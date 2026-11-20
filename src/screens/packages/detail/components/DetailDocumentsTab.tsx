import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { DocumentItem, ResourceItem } from '../types';
import { documentMeta, getUrlDomain } from '../packageFormatters';
import { getCachedDocumentUri, openCachedDocument } from '../../../../utils/documentCache';

interface Props {
  documents: DocumentItem[];
  resources?: ResourceItem[];
}

export const DetailDocumentsTab: React.FC<Props> = ({
  documents,
  resources = [],
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [cachedIds, setCachedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    const checkCache = async () => {
      const entries: Record<string, boolean> = {};
      await Promise.all(
        documents.map(async (doc) => {
          if (!doc.viewUrl) return;
          const hit = await getCachedDocumentUri(doc.viewUrl, doc.fileName);
          if (hit) entries[doc.id] = true;
        })
      );
      if (isMounted) setCachedIds(entries);
    };
    checkCache();
    return () => {
      isMounted = false;
    };
  }, [documents]);

  const handleOpenDoc = useCallback(async (doc: DocumentItem) => {
    if (!doc.viewUrl) return;
    setDownloadingId(doc.id);
    try {
      await openCachedDocument(doc.viewUrl, {
        fileName: doc.fileName,
        title: doc.title,
      });
      setCachedIds((prev) => ({ ...prev, [doc.id]: true }));
    } catch {
      try {
        const supported = await Linking.canOpenURL(doc.viewUrl);
        if (supported) {
          await Linking.openURL(doc.viewUrl);
        } else {
          Alert.alert('Notice', `Unable to open ${doc.title}.`);
        }
      } catch {
        Alert.alert('Error', 'Unable to stream file from secure vault.');
      }
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleOpenResource = useCallback(async (res: ResourceItem) => {
    if (!res.url) return;
    try {
      await Linking.openURL(res.url);
    } catch {
      Alert.alert('Error', `Unable to open ${res.label}.`);
    }
  }, []);

  if (documents.length === 0 && resources.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="folder-open-outline" size={32} color={colors.textMuted} />
        <Text style={styles.emptyText}>No data-room documents uploaded yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {documents.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Documents ({documents.length})</Text>
          {documents.map((doc) => {
            const isBusy = downloadingId === doc.id;
            const isCached = Boolean(cachedIds[doc.id]);
            const metaLine = documentMeta(doc.title, doc.fileName);

            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.docRow}
                activeOpacity={0.75}
                disabled={isBusy}
                onPress={() => handleOpenDoc(doc)}
              >
                <View style={styles.iconBox}>
                  <Ionicons name="document-text" size={20} color={colors.primary} />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.title} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <View style={styles.subRow}>
                    <Text style={styles.sub} numberOfLines={1}>
                      {metaLine || 'Official Data-Room Document'}
                    </Text>
                    {isCached && (
                      <View style={styles.cachedBadge}>
                        <Ionicons name="checkmark-circle" size={10} color="#C39967" />
                        <Text style={styles.cachedText}>Offline Ready</Text>
                      </View>
                    )}
                  </View>
                </View>
                {isBusy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name={isCached ? 'open-outline' : 'download-outline'}
                    size={18}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {resources.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Resources ({resources.length})</Text>
          {resources.map((res) => (
            <TouchableOpacity
              key={res.id}
              style={styles.docRow}
              activeOpacity={0.75}
              onPress={() => handleOpenResource(res)}
            >
              <View style={styles.iconBox}>
                <Ionicons name="link-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.meta}>
                <Text style={styles.title} numberOfLines={1}>
                  {res.label}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {getUrlDomain(res.url)}
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    padding: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  meta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sub: {
    flexShrink: 1,
    fontSize: 11,
    color: colors.textMuted,
  },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#DFC7A7',
  },
  cachedText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#C39967',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});