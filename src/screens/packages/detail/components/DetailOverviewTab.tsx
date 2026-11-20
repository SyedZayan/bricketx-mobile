import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { DetailTab, KeyInfoItem, SectionItem } from '../types';
import { RichContentRenderer } from './RichContentRenderer';

interface Props {
  keyInfo: KeyInfoItem[];
  sections: SectionItem[];
  disclaimerText?: string | null;
  documentCount?: number;
  resourceCount?: number;
  mediaCount?: number;
  onNavigateTab?: (tab: DetailTab) => void;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, '"')
    .replace(/&ndash;/gi, '-')
    .replace(/&mdash;/gi, '-');
}

function tryParseJson(content: string): unknown | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  const lower = spaced.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

const TableBlock: React.FC<{ content: string }> = ({ content }) => {
  const parsed = useMemo(() => tryParseJson(content), [content]);

  const { header, rows } = useMemo(() => {
    if (Array.isArray(parsed) && parsed.every((r) => Array.isArray(r))) {
      const matrix = (parsed as unknown[][]).map((r) => r.map((c) => String(c)));
      return { header: matrix[0] || [], rows: matrix.slice(1) };
    }
    if (
      Array.isArray(parsed) &&
      parsed.every((r) => r && typeof r === 'object' && !Array.isArray(r))
    ) {
      const objs = parsed as Record<string, unknown>[];
      const keys = Array.from(new Set(objs.flatMap((o) => Object.keys(o))));
      return {
        header: keys.map(humanizeKey),
        rows: objs.map((o) => keys.map((k) => (k in o ? String(o[k]) : ''))),
      };
    }

    const lines = content.split('\n').filter((l) => l.trim());
    const delimiter = lines.some((l) => l.includes('|'))
      ? '|'
      : lines.some((l) => l.includes(','))
      ? ','
      : null;

    if (!delimiter) return { header: [], rows: [] };
    const matrix = lines.map((l) => l.split(delimiter).map((c) => c.trim()));
    return { header: matrix[0] || [], rows: matrix.slice(1) };
  }, [parsed, content]);

  if (header.length === 0) {
    return <Text style={styles.fallbackText}>{decodeEntities(content)}</Text>;
  }

  return (
    <View style={styles.tableWrapper}>
      <View style={styles.tableHeaderRow}>
        {header.map((cell, i) => (
          <Text
            key={i}
            style={[
              styles.tableHeaderCell,
              i === header.length - 1 && styles.tableCellRight,
            ]}
          >
            {decodeEntities(cell)}
          </Text>
        ))}
      </View>
      {rows.map((row, rIdx) => (
        <View
          key={rIdx}
          style={[
            styles.tableDataRow,
            rIdx === rows.length - 1 && { borderBottomWidth: 0 },
          ]}
        >
          {row.map((cell, cIdx) => (
            <Text
              key={cIdx}
              style={[
                styles.tableDataCell,
                cIdx === row.length - 1 && styles.tableCellRight,
              ]}
            >
              {decodeEntities(cell)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

export const DetailOverviewTab: React.FC<Props> = ({
  keyInfo,
  sections,
  documentCount = 0,
  resourceCount = 0,
  mediaCount = 0,
  onNavigateTab,
}) => {
  const sortedSections = useMemo(
    () =>
      [...sections].sort(
        (a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity)
      ),
    [sections]
  );

  const previewKeyInfo = keyInfo.slice(0, 3);

  const summaryTiles = [
    mediaCount > 0
      ? {
          key: 'GALLERY' as DetailTab,
          label: 'Gallery',
          count: mediaCount,
          icon: 'images-outline' as const,
        }
      : null,
    documentCount > 0
      ? {
          key: 'DOCUMENTS' as DetailTab,
          label: 'Docs',
          count: documentCount,
          icon: 'document-text-outline' as const,
        }
      : null,
    resourceCount > 0
      ? {
          key: 'DOCUMENTS' as DetailTab,
          label: 'Links',
          count: resourceCount,
          icon: 'link-outline' as const,
        }
      : null,
  ].filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <View style={styles.container}>
      {/* Quick Data-Room Summary Tiles */}
      {onNavigateTab && summaryTiles.length > 0 && (
        <View style={styles.summaryTilesRow}>
          {summaryTiles.map((tile) => (
            <TouchableOpacity
              key={tile.label}
              style={styles.summaryTile}
              activeOpacity={0.8}
              onPress={() => onNavigateTab(tile.key)}
            >
              <View style={styles.summaryTileIcon}>
                <Ionicons name={tile.icon} size={15} color={colors.primary} />
              </View>
              <View style={styles.summaryTileMeta}>
                <Text style={styles.summaryTileCount}>{tile.count}</Text>
                <Text style={styles.summaryTileLabel} numberOfLines={1}>
                  {tile.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Key Info Preview Card */}
      {previewKeyInfo.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitleNoMargin}>Key info</Text>
            {keyInfo.length > previewKeyInfo.length && onNavigateTab && (
              <TouchableOpacity
                onPress={() => onNavigateTab('DETAILS')}
                activeOpacity={0.75}
              >
                <Text style={styles.viewAllLink}>
                  View all ({keyInfo.length}) →
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {previewKeyInfo.map((info, idx) => (
            <View key={info.id || idx}>
              <View style={styles.paramRow}>
                <Text style={styles.paramLabel}>{info.label}</Text>
                <Text style={styles.paramValue}>{info.value}</Text>
              </View>
              {idx < previewKeyInfo.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}

      {/* Structured Content Sections */}
      {sortedSections.map((section) => {
        if (
          section.blockType === 'callout' &&
          section.blockData &&
          'body' in section.blockData &&
          typeof section.blockData.body === 'string' &&
          section.blockData.body.trim().length > 0
        ) {
          const variant = (section.blockData as any).variant || 'info';
          const isWarning = variant === 'warning';
          const isSuccess = variant === 'success';
          const accentColor = isWarning
            ? '#8C6A3E'
            : isSuccess
            ? '#C39967'
            : colors.primary;
          const bgColor = isWarning
            ? '#FAF5EE'
            : isSuccess
            ? '#FAF5EE'
            : '#FAF5EE';
          const borderColor = isWarning
            ? '#DFC7A7'
            : isSuccess
            ? '#DFC7A7'
            : '#E7D7C1';

          return (
            <View
              key={section.id}
              style={[
                styles.calloutCard,
                {
                  backgroundColor: bgColor,
                  borderColor,
                  borderLeftColor: accentColor,
                },
              ]}
            >
              <Ionicons
                name={
                  isWarning
                    ? 'warning-outline'
                    : isSuccess
                    ? 'checkmark-circle-outline'
                    : 'information-circle-outline'
                }
                size={20}
                color={accentColor}
                style={styles.calloutIcon}
              />
              <View style={styles.calloutBody}>
                {section.blockData.title ? (
                  <Text style={[styles.calloutTitle, { color: accentColor }]}>
                    {section.blockData.title}
                  </Text>
                ) : null}
                <Text style={styles.calloutText}>{section.blockData.body}</Text>
              </View>
            </View>
          );
        }

        if (
          section.blockType === 'metrics' &&
          section.blockData &&
          'metrics' in section.blockData &&
          Array.isArray(section.blockData.metrics) &&
          section.blockData.metrics.length > 0
        ) {
          return (
            <View key={section.id} style={styles.card}>
              {section.heading ? (
                <Text style={styles.cardTitle}>{section.heading}</Text>
              ) : null}
              <View style={styles.metricsGrid}>
                {section.blockData.metrics.map((m, mIdx) => (
                  <View key={mIdx} style={styles.metricItem}>
                    <Text style={styles.metricItemValue}>{m.value}</Text>
                    <Text style={styles.metricItemLabel}>{m.label}</Text>
                    {m.caption ? (
                      <Text style={styles.metricItemCaption}>{m.caption}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          );
        }

        if (section.blockType === 'table' && section.content?.trim()) {
          return (
            <View key={section.id} style={styles.card}>
              {section.heading ? (
                <Text style={styles.cardTitle}>{section.heading}</Text>
              ) : null}
              <TableBlock content={section.content} />
            </View>
          );
        }

        if (section.content?.trim()) {
          return (
            <View key={section.id} style={styles.card}>
              {section.heading ? (
                <Text style={styles.cardTitle}>{section.heading}</Text>
              ) : null}
              <RichContentRenderer htmlContent={section.content} />
            </View>
          );
        }

        return null;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  summaryTilesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  summaryTileIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTileMeta: {
    flex: 1,
    minWidth: 0,
  },
  summaryTileCount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  summaryTileLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  cardTitleNoMargin: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
  },
  paramLabel: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
  },
  paramValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFECE6',
  },
  fallbackText: {
    fontSize: 13.5,
    color: '#3F3D3A',
    lineHeight: 21.5,
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
  },
  calloutIcon: {
    marginTop: 1,
  },
  calloutBody: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  calloutText: {
    fontSize: 12.5,
    color: colors.text,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricItem: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    padding: 12,
  },
  metricItemValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  metricItemLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.text,
    marginTop: 3,
  },
  metricItemCaption: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  tableWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E1D8',
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFECE6',
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 8,
  },
  tableDataCell: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
  tableCellRight: {
    textAlign: 'right',
  },
});