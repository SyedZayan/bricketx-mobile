import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { GalleryItem } from '../types';
import { buildCachedImageSource, getStableMediaCacheKey } from '../../../../utils/mediaCache';

interface ContentMediaItem {
  id: string;
  type: 'image' | 'video';
  viewUrl: string;
  caption?: string | null;
  fileName?: string | null;
}

interface Props {
  galleries: GalleryItem[];
  contentMedia?: ContentMediaItem[];
}

interface MediaEntry {
  id: string;
  viewUrl: string;
  caption?: string | null;
}

const SafeImageCard: React.FC<{
  item: MediaEntry;
  onPress: (item: MediaEntry) => void;
}> = ({ item, onPress }) => {
  const { viewUrl: url, caption } = item;
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  const stableCacheKey = useMemo(() => getStableMediaCacheKey(url, item.id), [url, item.id]);
  const imageSource = useMemo(
    () => buildCachedImageSource(url, { width: 320, height: 220 }),
    [url]
  );

  if (!imageSource || hasError) {
    return (
      <View style={styles.gridItem}>
        <View style={styles.fallbackBox}>
          <Ionicons name="image-outline" size={24} color={colors.primary} />
          <Text style={styles.fallbackText} numberOfLines={1}>
            {caption || 'Offering Asset'}
          </Text>
          <Text style={styles.fallbackSub}>Cloud asset sync pending</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.gridItem}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <View style={styles.imageContainer}>
        {loading && (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          transition={100}
          cachePolicy="memory-disk"
          recyclingKey={stableCacheKey}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={() => {
            setHasError(true);
            setLoading(false);
          }}
        />
        <View style={styles.expandChip}>
          <Ionicons name="expand-outline" size={11} color="#FFFFFF" />
        </View>
      </View>
      {caption ? (
        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

export const DetailGalleryTab: React.FC<Props> = ({ galleries = [], contentMedia = [] }) => {
  const insets = useSafeAreaInsets();
  const [selectedMedia, setSelectedMedia] = useState<MediaEntry | null>(null);

  const allMediaItems = useMemo(() => {
    const items: MediaEntry[] = [];

    galleries.forEach((gal) => {
      if (gal.media && Array.isArray(gal.media)) {
        gal.media.forEach((item) => {
          if (item.viewUrl) {
            items.push({
              id: item.id,
              viewUrl: item.viewUrl,
              caption: item.caption || item.fileName,
            });
          }
        });
      }
    });

    contentMedia.forEach((item) => {
      if (item.viewUrl) {
        items.push({
          id: item.id,
          viewUrl: item.viewUrl,
          caption: item.caption || item.fileName,
        });
      }
    });

    return items;
  }, [galleries, contentMedia]);

  const fullscreenSource = useMemo(
    () => buildCachedImageSource(selectedMedia?.viewUrl),
    [selectedMedia?.viewUrl]
  );

  if (allMediaItems.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="images-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Media Available</Text>
        <Text style={styles.emptyText}>
          Visual collateral and project documentation will be attached soon.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>Offering Media</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{allMediaItems.length}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {allMediaItems.map((item) => (
          <SafeImageCard key={item.id} item={item} onPress={setSelectedMedia} />
        ))}
      </View>

      {/* Zero-Latency Cached Lightbox Modal */}
      <Modal
        visible={Boolean(selectedMedia)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity
            style={[styles.lightboxClose, { top: Math.max(insets.top, 16) + 8 }]}
            onPress={() => setSelectedMedia(null)}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {fullscreenSource && (
            <Image
              source={fullscreenSource}
              style={styles.lightboxImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          )}

          {selectedMedia?.caption ? (
            <View
              style={[
                styles.lightboxCaptionBar,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <Text style={styles.lightboxCaptionText}>{selectedMedia.caption}</Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFECE6',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1815',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 125,
    backgroundColor: '#FAF5EE',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  expandChip: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5EE',
    zIndex: 1,
  },
  fallbackBox: {
    width: '100%',
    height: 125,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  fallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  fallbackSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 10,
    paddingVertical: 8,
    lineHeight: 15,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
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
    height: '72%',
  },
  lightboxCaptionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  lightboxCaptionText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
    fontWeight: '600',
    textAlign: 'center',
  },
});

