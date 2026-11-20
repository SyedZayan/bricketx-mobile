import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../theme/colors';
import { buildCachedImageSource } from '../../../../utils/mediaCache';

interface Props {
  htmlContent: string;
}

type ContentBlock =
  | { type: 'heading'; level: number; html: string }
  | { type: 'paragraph'; html: string }
  | { type: 'blockquote'; html: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'youtube'; videoId: string; url: string };

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, '"')
    .replace(/&ndash;/gi, '-')
    .replace(/&mdash;/gi, '-')
    .replace(/&bull;/gi, '•')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * Renders inline HTML formatting (<strong>, <b>, <em>, <i>, <u>, <a href>, <br>)
 * as nested React Native <Text> nodes so bolding, italics, and links are preserved.
 */
const InlineFormattedText: React.FC<{
  html: string;
  baseStyle: any;
}> = ({ html, baseStyle }) => {
  const nodes = useMemo(() => {
    const cleaned = html.replace(/<br\s*\/?>/gi, '\n');
    const tokenRegex =
      /(<strong\b[^>]*>[\s\S]*?<\/strong>|<b\b[^>]*>[\s\S]*?<\/b>|<em\b[^>]*>[\s\S]*?<\/em>|<i\b[^>]*>[\s\S]*?<\/i>|<u\b[^>]*>[\s\S]*?<\/u>|<a\b[^>]*>[\s\S]*?<\/a>)/gi;

    const parts = cleaned.split(tokenRegex).filter((p) => p !== '');
    return parts.map((part, idx) => {
      // Bold
      const boldMatch = part.match(/^<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>$/i);
      if (boldMatch) {
        return (
          <Text key={idx} style={styles.boldText}>
            <InlineFormattedText html={boldMatch[1]} baseStyle={styles.boldText} />
          </Text>
        );
      }

      // Italic
      const italicMatch = part.match(/^<(?:em|i)\b[^>]*>([\s\S]*?)<\/(?:em|i)>$/i);
      if (italicMatch) {
        return (
          <Text key={idx} style={styles.italicText}>
            <InlineFormattedText html={italicMatch[1]} baseStyle={styles.italicText} />
          </Text>
        );
      }

      // Underline
      const underlineMatch = part.match(/^<u\b[^>]*>([\s\S]*?)<\/u>$/i);
      if (underlineMatch) {
        return (
          <Text key={idx} style={styles.underlineText}>
            <InlineFormattedText html={underlineMatch[1]} baseStyle={styles.underlineText} />
          </Text>
        );
      }

      // Link
      const linkMatch = part.match(/^<a\b([^>]*)>([\s\S]*?)<\/a>$/i);
      if (linkMatch) {
        const attrs = linkMatch[1] || '';
        const inner = linkMatch[2] || '';
        const hrefMatch = attrs.match(/href\s*=\s*["']([^"']+)["']/i);
        const href = hrefMatch?.[1] ? decodeEntities(hrefMatch[1]) : null;
        const label = decodeEntities(inner.replace(/<[^>]+>/g, ''));

        return (
          <Text
            key={idx}
            style={styles.linkText}
            onPress={() => {
              if (href) Linking.openURL(href).catch(() => {});
            }}
          >
            {label || href}
          </Text>
        );
      }

      // Plain text segment (strip any remaining unknown inline tags)
      const plain = decodeEntities(part.replace(/<[^>]+>/g, ''));
      return <React.Fragment key={idx}>{plain}</React.Fragment>;
    });
  }, [html]);

  return <Text style={baseStyle}>{nodes}</Text>;
};

function parseHtmlBlocks(htmlContent: string): ContentBlock[] {
  if (!htmlContent) return [];

  // Normalize TipTap YouTube wrapper divs (<div data-youtube-video><iframe src="..."></iframe></div>)
  let source = htmlContent.replace(
    /<div[^>]*data-youtube-video[^>]*>[\s\S]*?<iframe[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/div>/gi,
    (_, src) => `\n__BLOCK_YT__${src}__ENDBLOCK__\n`
  );

  // Standalone YouTube iframes
  source = source.replace(
    /<iframe[^>]*src=["']([^"']+)["'][^>]*>(?:[\s\S]*?<\/iframe>)?/gi,
    (_, src) => `\n__BLOCK_YT__${src}__ENDBLOCK__\n`
  );

  // Images (both standalone and wrapped in <p> or <figure>)
  source = source.replace(
    /<img\b([^>]*)\/?>/gi,
    (_, attrs) => {
      const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
      const altMatch = attrs.match(/alt\s*=\s*["']([^"']*)["']/i);
      if (!srcMatch?.[1]) return '';
      const alt = altMatch?.[1] || '';
      return `\n__BLOCK_IMG__${srcMatch[1]}|||${alt}__ENDBLOCK__\n`;
    }
  );

  // Blockquotes
  source = source.replace(
    /<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_, inner) => `\n__BLOCK_QUOTE__${inner}__ENDBLOCK__\n`
  );

  // Ordered lists
  source = source.replace(
    /<ol\b[^>]*>([\s\S]*?)<\/ol>/gi,
    (_, inner) => `\n__BLOCK_OL__${inner}__ENDBLOCK__\n`
  );

  // Unordered lists
  source = source.replace(
    /<ul\b[^>]*>([\s\S]*?)<\/ul>/gi,
    (_, inner) => `\n__BLOCK_UL__${inner}__ENDBLOCK__\n`
  );

  // Headings h1 - h6
  source = source.replace(
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_, level, inner) => `\n__BLOCK_H${level}__${inner}__ENDBLOCK__\n`
  );

  // Paragraphs & divs
  source = source.replace(
    /<(?:p|div)\b[^>]*>([\s\S]*?)<\/(?:p|div)>/gi,
    (_, inner) => `\n__BLOCK_P__${inner}__ENDBLOCK__\n`
  );

  const chunks = source
    .split(/(__BLOCK_[A-Z0-9]+__[\s\S]*?__ENDBLOCK__)/g)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const blocks: ContentBlock[] = [];

  for (const chunk of chunks) {
    if (chunk.startsWith('__BLOCK_YT__')) {
      const url = chunk.replace(/^__BLOCK_YT__|__ENDBLOCK__$/g, '').trim();
      const videoId = extractYouTubeId(url);
      if (videoId) {
        blocks.push({
          type: 'youtube',
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }
      continue;
    }

    if (chunk.startsWith('__BLOCK_IMG__')) {
      const payload = chunk.replace(/^__BLOCK_IMG__|__ENDBLOCK__$/g, '');
      const [src, alt] = payload.split('|||');
      if (src?.trim()) {
        blocks.push({
          type: 'image',
          src: decodeEntities(src.trim()),
          alt: alt ? decodeEntities(alt.trim()) : undefined,
        });
      }
      continue;
    }

    if (chunk.startsWith('__BLOCK_QUOTE__')) {
      const inner = chunk.replace(/^__BLOCK_QUOTE__|__ENDBLOCK__$/g, '').trim();
      const textCheck = decodeEntities(inner.replace(/<[^>]+>/g, '')).trim();
      if (textCheck) {
        blocks.push({ type: 'blockquote', html: inner });
      }
      continue;
    }

    if (chunk.startsWith('__BLOCK_OL__') || chunk.startsWith('__BLOCK_UL__')) {
      const ordered = chunk.startsWith('__BLOCK_OL__');
      const inner = chunk.replace(/^__BLOCK_(?:OL|UL)__|__ENDBLOCK__$/g, '');
      const liMatches = Array.from(inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi));
      const items = liMatches
        .map((m) => m[1].replace(/^<p\b[^>]*>([\s\S]*?)<\/p>$/i, '$1').trim())
        .filter((itemHtml) => decodeEntities(itemHtml.replace(/<[^>]+>/g, '')).trim().length > 0);

      if (items.length > 0) {
        blocks.push({ type: 'list', ordered, items });
      }
      continue;
    }

    const headingMatch = chunk.match(/^__BLOCK_H([1-6])__([\s\S]*?)__ENDBLOCK__$/);
    if (headingMatch) {
      const level = Number(headingMatch[1]);
      const inner = headingMatch[2].trim();
      const textCheck = decodeEntities(inner.replace(/<[^>]+>/g, '')).trim();
      if (textCheck) {
        blocks.push({ type: 'heading', level, html: inner });
      }
      continue;
    }

    const pInner = chunk.startsWith('__BLOCK_P__')
      ? chunk.replace(/^__BLOCK_P__|__ENDBLOCK__$/g, '').trim()
      : chunk;

    const textCheck = decodeEntities(pInner.replace(/<[^>]+>/g, '')).trim();
    if (textCheck) {
      // Check if a paragraph is solely a standalone YouTube URL
      const ytId = extractYouTubeId(textCheck);
      if (ytId && /^https?:\/\/\S+$/.test(textCheck)) {
        blocks.push({
          type: 'youtube',
          videoId: ytId,
          url: textCheck,
        });
      } else {
        blocks.push({ type: 'paragraph', html: pInner });
      }
    }
  }

  return blocks;
}

export const RichContentRenderer: React.FC<Props> = ({ htmlContent }) => {
  const insets = useSafeAreaInsets();
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  const blocks = useMemo(() => parseHtmlBlocks(htmlContent), [htmlContent]);

  if (blocks.length === 0) return null;

  return (
    <View style={styles.container}>
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          const headingStyle =
            block.level === 1
              ? styles.h1
              : block.level === 2
              ? styles.h2
              : styles.h3;
          return (
            <InlineFormattedText
              key={idx}
              html={block.html}
              baseStyle={headingStyle}
            />
          );
        }

        if (block.type === 'blockquote') {
          return (
            <View key={idx} style={styles.blockquote}>
              <InlineFormattedText html={block.html} baseStyle={styles.blockquoteText} />
            </View>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={idx} style={styles.listContainer}>
              {block.items.map((itemHtml, itemIdx) => (
                <View key={itemIdx} style={styles.listRow}>
                  <Text style={styles.listMarker}>
                    {block.ordered ? `${itemIdx + 1}.` : 'â€¢'}
                  </Text>
                  <View style={styles.listContent}>
                    <InlineFormattedText html={itemHtml} baseStyle={styles.paragraph} />
                  </View>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'image') {
          const source = buildCachedImageSource(block.src, { width: 720 });
          if (!source) return null;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.embeddedImageWrapper}
              activeOpacity={0.9}
              onPress={() => setZoomImageUrl(block.src)}
            >
              <Image
                source={source}
                style={styles.embeddedImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
              {block.alt ? (
                <Text style={styles.imageCaption}>{block.alt}</Text>
              ) : null}
            </TouchableOpacity>
          );
        }

        if (block.type === 'youtube') {
          const thumbUrl = `https://img.youtube.com/vi/${block.videoId}/hqdefault.jpg`;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.youtubeCard}
              activeOpacity={0.88}
              onPress={() => Linking.openURL(block.url).catch(() => {})}
            >
              <Image
                source={{ uri: thumbUrl }}
                style={styles.youtubeThumb}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <View style={styles.youtubeOverlay}>
                <View style={styles.youtubePlayCircle}>
                  <Ionicons name="play" size={22} color="#FFFFFF" style={{ marginLeft: 2 }} />
                </View>
              </View>
              <View style={styles.youtubeFooter}>
                <Ionicons name="logo-youtube" size={16} color="#DC2626" />
                <Text style={styles.youtubeLabel}>Watch Video Presentation</Text>
                <Ionicons name="open-outline" size={14} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <InlineFormattedText
            key={idx}
            html={block.html}
            baseStyle={styles.paragraph}
          />
        );
      })}

      {/* Fullscreen Image Lightbox */}
      <Modal
        visible={Boolean(zoomImageUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomImageUrl(null)}
      >
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity
            style={[styles.lightboxClose, { top: Math.max(insets.top, 16) + 8 }]}
            onPress={() => setZoomImageUrl(null)}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {zoomImageUrl && (
            <Image
              source={{ uri: zoomImageUrl }}
              style={styles.lightboxImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  h1: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 25,
    marginTop: 4,
  },
  h2: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 23,
    marginTop: 4,
  },
  h3: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 21,
    marginTop: 2,
  },
  paragraph: {
    fontSize: 13.5,
    color: '#3F3D3A',
    lineHeight: 21.5,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  italicText: {
    fontStyle: 'italic',
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: '#FAF5EE',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  blockquoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 20,
  },
  listContainer: {
    gap: 6,
    paddingLeft: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  listMarker: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 21.5,
    minWidth: 14,
  },
  listContent: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  embeddedImageWrapper: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFECE6',
    backgroundColor: '#FAF9F6',
    marginVertical: 4,
  },
  embeddedImage: {
    width: '100%',
    height: 210,
  },
  imageCaption: {
    fontSize: 11.5,
    color: colors.textMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
  },
  youtubeCard: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFECE6',
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
  },
  youtubeThumb: {
    width: '100%',
    height: 185,
    backgroundColor: '#1A1815',
  },
  youtubeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 185,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youtubePlayCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(220, 38, 38, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  youtubeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAF9F6',
  },
  youtubeLabel: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 16, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    right: 18,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '94%',
    height: '76%',
  },
});
