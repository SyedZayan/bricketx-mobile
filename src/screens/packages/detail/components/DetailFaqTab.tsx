import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { FaqItem } from '../types';
import { RichContentRenderer } from './RichContentRenderer';

interface Props {
  faqs: FaqItem[];
}

export const DetailFaqTab: React.FC<Props> = ({ faqs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (faqs.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="help-circle-outline" size={32} color={colors.textMuted} />
        <Text style={styles.emptyText}>No FAQs listed for this package</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {faqs.map((faq) => {
        const isExpanded = expandedId === faq.id;
        return (
          <View key={faq.id} style={styles.card}>
            <TouchableOpacity
              style={styles.headerRow}
              onPress={() => setExpandedId(isExpanded ? null : faq.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.questionText}>{faq.question}</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {isExpanded && (
              <View style={styles.answerBox}>
                <RichContentRenderer htmlContent={faq.answerHtml} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: 8,
  },
  questionText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 19,
  },
  answerBox: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
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