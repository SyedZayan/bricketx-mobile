import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { RichContentRenderer } from '../../packages/detail/components/RichContentRenderer';

interface CommitmentDeclarationsProps {
  packageName: string;
  disclaimerText?: string | null;
  isPooled: boolean;
  poolingVersion?: number;
  proDeclarationAccepted: boolean;
  onToggleProDeclaration: () => void;
  disclaimerAccepted: boolean;
  onToggleDisclaimer: () => void;
  poolingAccepted: boolean;
  onOpenPoolingDisclaimer: () => void;
  onTogglePoolingConsent: () => void;
}

export const CommitmentDeclarations: React.FC<CommitmentDeclarationsProps> = ({
  packageName,
  disclaimerText,
  isPooled,
  poolingVersion = 1,
  proDeclarationAccepted,
  onToggleProDeclaration,
  disclaimerAccepted,
  onToggleDisclaimer,
  poolingAccepted,
  onOpenPoolingDisclaimer,
  onTogglePoolingConsent,
}) => {
  const hasDisclaimer = Boolean(disclaimerText && disclaimerText.trim().length > 0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(!hasDisclaimer);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const checkScrollCompletion = useCallback(
    (offsetY: number, viewH: number, totalH: number) => {
      if (hasScrolledToEnd || viewH <= 0 || totalH <= 0) return;
      if (offsetY + viewH >= totalH - 24) {
        setHasScrolledToEnd(true);
      }
    },
    [hasScrolledToEnd]
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    checkScrollCompletion(
      contentOffset.y,
      layoutMeasurement.height,
      contentSize.height
    );
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle} numberOfLines={2}>
        Disclaimer &amp; declarations
      </Text>

      {/* Scrollable Legal Disclaimer Box (matching web Step 2) */}
      {hasDisclaimer && (
        <View style={styles.disclaimerWrapper}>
          <ScrollView
            style={styles.disclaimerScroll}
            contentContainerStyle={styles.disclaimerScrollContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              setContainerHeight(h);
              checkScrollCompletion(0, h, contentHeight);
            }}
            onContentSizeChange={(_, h) => {
              setContentHeight(h);
              checkScrollCompletion(0, containerHeight, h);
            }}
            onScroll={handleScroll}
            scrollEventThrottle={32}
          >
            <RichContentRenderer htmlContent={disclaimerText!} />
          </ScrollView>

          <View style={styles.scrollStatusBar}>
            <Ionicons
              name={hasScrolledToEnd ? 'checkmark-circle' : 'arrow-down-circle-outline'}
              size={15}
              color={hasScrolledToEnd ? '#C39967' : colors.primary}
              style={{ flexShrink: 0 }}
            />
            <Text
              style={[
                styles.scrollStatusText,
                hasScrolledToEnd && styles.scrollStatusTextDone,
              ]}
            >
              {hasScrolledToEnd
                ? 'Disclaimer reviewed - please confirm declarations below.'
                : 'Scroll to the end of the disclaimer to continue.'}
            </Text>
          </View>
        </View>
      )}

      {/* Checkbox 1: Package Disclaimer Acceptance */}
      <TouchableOpacity
        style={[
          styles.checkboxBox,
          !hasScrolledToEnd && styles.checkboxBoxLocked,
          disclaimerAccepted && styles.checkboxBoxChecked,
        ]}
        activeOpacity={0.8}
        disabled={!hasScrolledToEnd}
        onPress={onToggleDisclaimer}
      >
        <Ionicons
          name={disclaimerAccepted ? 'checkbox' : 'square-outline'}
          size={20}
          color={
            !hasScrolledToEnd
              ? '#C7C2BA'
              : disclaimerAccepted
              ? colors.primary
              : colors.textMuted
          }
          style={styles.checkboxIcon}
        />
        <Text
          style={[
            styles.checkboxLabel,
            !hasScrolledToEnd && styles.checkboxLabelLocked,
          ]}
        >
          I have read and accept this package&apos;s disclaimer, shown above.
        </Text>
      </TouchableOpacity>

      {/* Checkbox 2: Professional / Accredited Investor Declaration */}
      <TouchableOpacity
        style={[
          styles.checkboxBox,
          !hasScrolledToEnd && styles.checkboxBoxLocked,
          proDeclarationAccepted && styles.checkboxBoxChecked,
        ]}
        activeOpacity={0.8}
        disabled={!hasScrolledToEnd}
        onPress={onToggleProDeclaration}
      >
        <Ionicons
          name={proDeclarationAccepted ? 'checkbox' : 'square-outline'}
          size={20}
          color={
            !hasScrolledToEnd
              ? '#C7C2BA'
              : proDeclarationAccepted
              ? colors.primary
              : colors.textMuted
          }
          style={styles.checkboxIcon}
        />
        <Text
          style={[
            styles.checkboxLabel,
            !hasScrolledToEnd && styles.checkboxLabelLocked,
          ]}
        >
          I confirm that I qualify as a professional investor under the terms described in this agreement, and am eligible to make this investment.
        </Text>
      </TouchableOpacity>

      {/* Checkbox 3: Syndicate Pooling Agreement (only when below standard minimum) */}
      {isPooled && (
        <TouchableOpacity
          style={[
            styles.checkboxBox,
            !hasScrolledToEnd && styles.checkboxBoxLocked,
            poolingAccepted && styles.checkboxBoxChecked,
          ]}
          activeOpacity={0.8}
          disabled={!hasScrolledToEnd}
          onPress={() => {
            if (!poolingAccepted) {
              onOpenPoolingDisclaimer();
            } else {
              onTogglePoolingConsent();
            }
          }}
        >
          <Ionicons
            name={poolingAccepted ? 'checkbox' : 'square-outline'}
            size={20}
            color={
              !hasScrolledToEnd
                ? '#C7C2BA'
                : poolingAccepted
                ? colors.primary
                : colors.textMuted
            }
            style={styles.checkboxIcon}
          />
          <Text
            style={[
              styles.checkboxLabel,
              !hasScrolledToEnd && styles.checkboxLabelLocked,
            ]}
          >
            I have read and agree to the{' '}
            <Text style={styles.linkText}>
              Syndicate Pooling Agreement (v{poolingVersion})
            </Text>{' '}
            for allocations below the standard minimum threshold ({packageName}).
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  disclaimerWrapper: {
    borderWidth: 1,
    borderColor: '#E5E1D8',
    borderRadius: 12,
    backgroundColor: '#FAF9F6',
    overflow: 'hidden',
    marginBottom: 14,
  },
  disclaimerScroll: {
    maxHeight: 300,
  },
  disclaimerScrollContent: {
    padding: 14,
  },
  scrollStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
    backgroundColor: '#FFFFFF',
  },
  scrollStatusText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
    color: colors.textMuted,
  },
  scrollStatusTextDone: {
    color: '#C39967',
    lineHeight: 16,
  },
  checkboxBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E1D8',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  checkboxBoxLocked: {
    backgroundColor: '#FAF9F6',
    borderColor: '#EFECE6',
    opacity: 0.7,
  },
  checkboxBoxChecked: {
    backgroundColor: '#FAF5EE',
    borderColor: colors.primary,
  },
  checkboxIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxLabel: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  checkboxLabelLocked: {
    color: colors.textMuted,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
