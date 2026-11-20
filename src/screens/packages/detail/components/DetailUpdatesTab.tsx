import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useGetPackagesByIdUpdatesQuery } from '../../../../api/generated/investorApi';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { stripHtml } from '../packageFormatters';
import { RichContentRenderer } from './RichContentRenderer';
import { buildCachedImageSource } from '../../../../utils/mediaCache';

interface Props {
  packageId: string;
}

export const DetailUpdatesTab: React.FC<Props> = ({ packageId }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useGetPackagesByIdUpdatesQuery(
    { id: packageId, page, pageSize: 10 },
    { refetchOnMountOrArgChange: 60 }
  );

  if (isLoading) {
    return (
      <View style={styles.centerCard}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.mutedText}>Loading updates...</Text>
      </View>
    );
  }

  if (error || !data || data.items.length === 0) {
    return (
      <View style={styles.centerCard}>
        <Ionicons name="newspaper-outline" size={30} color={colors.textMuted} />
        <Text style={styles.mutedText}>No updates have been published yet.</Text>
      </View>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <View style={styles.container}>
      {data.items.map((u) => {
        const sortedImages = [...u.images].sort(
          (a, b) => a.displayOrder - b.displayOrder
        );
        const dateStr = new Date(u.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        return (
          <View key={u.id} style={styles.updateCard}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.titleText}>{u.title}</Text>
            <RichContentRenderer htmlContent="{u.bodyHtml}"/>

            {sortedImages.length > 0 && (
              <View style={styles.imagesRow}>
                {sortedImages.map((img) => {
                  const src = buildCachedImageSource(img.viewUrl, {
                    width: 240,
                    height: 240,
                  });
                  if (!src) return null;
                  return (
                    <Image
                      key={img.id}
                      source={src}
                      style={styles.thumbImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {totalPages > 1 && (
        <View style={styles.pagerRow}>
          <TouchableOpacity
            style={[styles.pagerBtn, page <= 1 && styles.pagerBtnDisabled]}
            disabled={isFetching || page <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            <Text style={styles.pagerBtnText}>Newer</Text>
          </TouchableOpacity>
          <Text style={styles.pagerInfo}>
            Page {page} of {totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.pagerBtn,
              page >= totalPages && styles.pagerBtnDisabled,
            ]}
            disabled={isFetching || page >= totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            <Text style={styles.pagerBtnText}>Older</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    gap: 8,
  },
  mutedText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  thumbImage: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
  },
  pagerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  pagerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  pagerBtnDisabled: {
    opacity: 0.4,
  },
  pagerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  pagerInfo: {
    fontSize: 12,
    color: colors.textMuted,
  },
});