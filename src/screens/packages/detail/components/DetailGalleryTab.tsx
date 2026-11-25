import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
  useWindowDimensions,
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
  index: number;
  onPress: (index: number) => void;
  variant?: 'grid' | 'carousel';
}> = ({ item, index, onPress, variant = 'grid' }) => {
  const { viewUrl: url, caption } = item;
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  const stableCacheKey = useMemo(() => getStableMediaCacheKey(url, item.id), [url, item.id]);
  const imageSource = useMemo(
    () =>
      buildCachedImageSource(
        url,
        variant === 'carousel' ? { width: 560, height: 340 } : { width: 320, height: 220 }
      ),
    [url, variant]
  );

  const cardStyle = variant === 'carousel' ? styles.carouselItem : styles.gridItem;
  const imgBoxStyle = variant === 'carousel' ? styles.carouselImageBox : styles.imageContainer;

  if (!imageSource || hasError) {
    return (
      <View style={cardStyle}>
        <View style={[imgBoxStyle, styles.fallbackBox]}>
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
      style={cardStyle}
      activeOpacity={0.9}
      onPress={() => onPress(index)}
    >
      <View style={imgBoxStyle}>
        {loading && (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          transition={80}
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
  const { width: screenWidth } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe');
  const lightboxListRef = useRef<FlatList<MediaEntry>>(null);
  const thumbListRef = useRef<FlatList<MediaEntry>>(null);

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

  const jumpLightboxTo = (index: number, animated = true) => {
    const clamped = Math.max(0, Math.min(allMediaItems.length - 1, index));
    setSelectedIndex(clamped);
    setActiveIndex(clamped);
    lightboxListRef.current?.scrollToIndex({ index: clamped, animated });
    thumbListRef.current?.scrollToIndex({ index: clamped, animated: true, viewPosition: 0.5 });
  };

  const openLightboxAt = (index: number) => {
    setActiveIndex(index);
    setSelectedIndex(index);
    setTimeout(() => {
      lightboxListRef.current?.scrollToIndex({ index, animated: false });
      thumbListRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
    }, 30);
  };

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

  const currentItem = selectedIndex !== null ? allMediaItems[selectedIndex] : null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionHeader}>Offering Media</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {viewMode === 'swipe'
                ? `${activeIndex + 1} / ${allMediaItems.length}`
                : `${allMediaItems.length}`}
            </Text>
          </View>
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'swipe' && styles.modeBtnActive]}
            onPress={() => setViewMode('swipe')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={14}
              color={viewMode === 'swipe' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.modeBtnText, viewMode === 'swipe' && styles.modeBtnTextActive]}>
              Swipe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'grid' && styles.modeBtnActive]}
            onPress={() => setViewMode('grid')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid-outline"
              size={14}
              color={viewMode === 'grid' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.modeBtnText, viewMode === 'grid' && styles.modeBtnTextActive]}>
              Grid
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'swipe' ? (
        <View style={styles.swipeWrap}>
          <FlatList
            data={allMediaItems}
            keyExtractor={(item, idx) => `${item.id}_${idx}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={Math.max(screenWidth - spacing.lg * 2 - 20, 260)}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={(e) => {
              const cardW = Math.max(screenWidth - spacing.lg * 2 - 20, 260);
              const idx = Math.round(e.nativeEvent.contentOffset.x / cardW);
              setActiveIndex(Math.max(0, Math.min(allMediaItems.length - 1, idx)));
            }}
            renderItem={({ item, index }) => (
              <SafeImageCard
                item={item}
                index={index}
                variant="carousel"
                onPress={openLightboxAt}
              />
            )}
          />

        </View>
      ) : (
        <View style={styles.grid}>
          {allMediaItems.map((item, idx) => (
            <SafeImageCard
              key={`${item.id}_${idx}`}
              item={item}
              index={idx}
              variant="grid"
              onPress={openLightboxAt}
            />
          ))}
        </View>
      )}

      {/* Enhanced Swipeable Fullscreen Lightbox + Bottom Thumbnails */}
      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View style={styles.lightboxOverlay}>
          {/* Top Bar */}
          <View style={[styles.lightboxTopBar, { paddingTop: Math.max(insets.top, 14) + 4 }]}>
            <View style={styles.lightboxCounterPill}>
              <Ionicons name="images-outline" size={13} color="#E7D7C1" />
              <Text style={styles.lightboxCounter}>
                {selectedIndex !== null ? `${selectedIndex + 1} of ${allMediaItems.length}` : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.lightboxClose}
              onPress={() => setSelectedIndex(null)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Main Left/Right Swipe Pager */}
          <FlatList
            ref={lightboxListRef}
            data={allMediaItems}
            keyExtractor={(item, idx) => `lb_${item.id}_${idx}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              const clamped = Math.max(0, Math.min(allMediaItems.length - 1, idx));
              setSelectedIndex(clamped);
              setActiveIndex(clamped);
              thumbListRef.current?.scrollToIndex({
                index: clamped,
                animated: true,
                viewPosition: 0.5,
              });
            }}
            renderItem={({ item }) => {
              const source = buildCachedImageSource(item.viewUrl);
              return (
                <View style={[styles.lightboxSlide, { width: screenWidth }]}>
                  {source && (
                    <Image
                      source={source}
                      style={styles.lightboxImage}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />
                  )}
                </View>
              );
            }}
          />

          {/* Bottom Dock: Caption + Other Images Thumbnail Strip */}
          <View
            style={[
              styles.lightboxBottomDock,
              { paddingBottom: Math.max(insets.bottom, 14) + 4 },
            ]}
          >
            {currentItem?.caption ? (
              <Text style={styles.lightboxCaptionText} numberOfLines={2}>
                {currentItem.caption}
              </Text>
            ) : null}

            {allMediaItems.length > 1 && (
              <View style={styles.thumbStripSection}>
                <Text style={styles.thumbStripLabel}>MORE GALLERY PHOTOS</Text>
                <FlatList
                  ref={thumbListRef}
                  data={allMediaItems}
                  keyExtractor={(item, idx) => `thumb_${item.id}_${idx}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbStripContent}
                  getItemLayout={(_, index) => ({
                    length: 66,
                    offset: 66 * index,
                    index,
                  })}
                  renderItem={({ item, index }) => {
                    const isCurrent = index === selectedIndex;
                    const thumbSrc = buildCachedImageSource(item.viewUrl, {
                      width: 140,
                      height: 110,
                    });
                    return (
                      <TouchableOpacity
                        style={[styles.thumbCard, isCurrent && styles.thumbCardActive]}
                        onPress={() => jumpLightboxTo(index, true)}
                        activeOpacity={0.85}
                      >
                        {thumbSrc ? (
                          <Image
                            source={thumbSrc}
                            style={styles.thumbImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <View style={styles.thumbFallback}>
                            <Ionicons name="image-outline" size={16} color="#E7D7C1" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}
          </View>
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
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE8',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E7E2D8',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  swipeWrap: {
    gap: 10,
  },
  carouselContent: {
    gap: 12,
    paddingRight: 8,
  },
  carouselItem: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  carouselImageBox: {
    width: '100%',
    height: 175,
    backgroundColor: '#FAF5EE',
    position: 'relative',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DED8CE',
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.primary,
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
    backgroundColor: 'rgba(10, 12, 16, 0.97)',
    justifyContent: 'space-between',
  },
  lightboxTopBar: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxCounterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231, 215, 193, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  lightboxCounter: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  lightboxClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxSlide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lightboxImage: {
    width: '94%',
    height: '86%',
    borderRadius: 12,
  },
  lightboxBottomDock: {
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(18, 21, 28, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  lightboxCaptionText: {
    color: '#F8F7F4',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  thumbStripSection: {
    gap: 6,
  },
  thumbStripLabel: {
    color: '#B5A99A',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 2,
  },
  thumbStripContent: {
    gap: 8,
    paddingRight: 8,
  },
  thumbCard: {
    width: 58,
    height: 46,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    opacity: 0.65,
  },
  thumbCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    opacity: 1,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});