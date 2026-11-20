import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { EsignSigner } from '../../../api/generated/investorApi';

interface Props {
  signers: EsignSigner[];
  investorFieldCount: number;
  onContinue: (presentRoles: string[]) => void;
  onBack: () => void;
}

export const SignersQuestionView: React.FC<Props> = ({
  signers,
  onContinue,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const coSigners = signers.filter((s) => s.key !== 'investor');
  const requiredSigners = coSigners.filter((s) => s.required);
  const optionalSigners = coSigners.filter((s) => !s.required);
  const isAllAnswered = optionalSigners.every((s) => answers[s.key] !== undefined);

  const handleContinue = () => {
    const validKeys = new Set(signers.map((s) => s.key).filter(Boolean));
    const presentRoles: string[] = [];

    requiredSigners.forEach((s) => {
      if (validKeys.has(s.key) && !presentRoles.includes(s.key)) {
        presentRoles.push(s.key);
      }
    });

    optionalSigners.forEach((s) => {
      if (answers[s.key] && validKeys.has(s.key) && !presentRoles.includes(s.key)) {
        presentRoles.push(s.key);
      }
    });

    onContinue(presentRoles);
  };

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 38 : 16);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeRow}>
          <View style={styles.kickerBadge}>
            <Ionicons name="shield-checkmark" size={13} color={colors.primary} style={{ flexShrink: 0 }} />
            <Text style={styles.kickerText} numberOfLines={1}>
              Step 1 • Execution Setup
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {coSigners.length === 0 ? 'Signer Attestation' : 'Who is Signing With You?'}
        </Text>
        <Text style={styles.subtitle}>
          {coSigners.length === 0
            ? 'You are executing this investment agreement individually on this device. Next, you will review the complete contract and apply your signature.'
            : 'Any co-signer or witness present will attest the contract on this device after you review the agreement.'}
        </Text>

        {requiredSigners.length > 0 && (
          <View style={styles.requiredBox}>
            {requiredSigners.map((s) => (
              <View key={s.key} style={styles.signerItem}>
                <View style={styles.signerIconBox}>
                  <Ionicons name="people" size={18} color={colors.primary} />
                </View>
                <View style={styles.flexTextCol}>
                  <Text style={styles.signerItemTitle} numberOfLines={2}>
                    {s.label} signs with you
                  </Text>
                  <Text style={styles.signerItemSub}>
                    Required co-signer. They will sign on this device immediately after your execution.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {optionalSigners.map((signer) => {
          const selectedAnswer = answers[signer.key];
          return (
            <View key={signer.key} style={styles.questionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.flexTextCol}>
                  <Text style={styles.questionPrompt}>
                    {signer.prompt || `Will a ${signer.label.toLowerCase()} sign with you?`}
                  </Text>
                  <Text style={styles.questionHelp}>
                    Attestation by a witness is optional for your Master Participation Agreement.
                  </Text>
                </View>
              </View>

              <View style={styles.choiceGrid}>
                <TouchableOpacity
                  style={[
                    styles.choiceCard,
                    selectedAnswer === true && styles.choiceCardActive,
                  ]}
                  onPress={() => setAnswers((prev) => ({ ...prev, [signer.key]: true }))}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioRow}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedAnswer === true && styles.radioOuterActive,
                      ]}
                    >
                      {selectedAnswer === true && <View style={styles.radioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.choiceTitle,
                        selectedAnswer === true && styles.choiceTitleActive,
                      ]}
                    >
                      Yes, with {signer.label}
                    </Text>
                  </View>
                  <Text style={styles.choiceDesc}>
                    Your {signer.label.toLowerCase()} is present and will provide their details & seal on this device.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceCard,
                    selectedAnswer === false && styles.choiceCardActive,
                  ]}
                  onPress={() => setAnswers((prev) => ({ ...prev, [signer.key]: false }))}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioRow}>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedAnswer === false && styles.radioOuterActive,
                      ]}
                    >
                      {selectedAnswer === false && <View style={styles.radioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.choiceTitle,
                        selectedAnswer === false && styles.choiceTitleActive,
                      ]}
                    >
                      No, Sign Solo
                    </Text>
                  </View>
                  <Text style={styles.choiceDesc}>
                    I will sign this agreement on my own behalf without a {signer.label.toLowerCase()}.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={styles.legalBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
            style={{ flexShrink: 0 }}
          />
          <View style={styles.flexTextCol}>
            <Text style={styles.legalTitle}>Statutory Finality</Text>
            <Text style={styles.legalText}>
              Upon execution, all terms (principal amount, payout schedule, tenure, and coordinates) are permanently stamped onto the Master Agreement.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} style={{ flexShrink: 0 }} />
          <Text style={styles.backBtnText} numberOfLines={1}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueBtn, !isAllAnswered && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!isAllAnswered}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText} numberOfLines={2}>
            Continue to Agreement
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  flexTextCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  kickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  kickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 22,
  },
  requiredBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    ...Platform.select({
      ios: { shadowColor: '#212121', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  signerItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  signerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  signerItemTitle: {
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.text,
  },
  signerItemSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    ...Platform.select({
      ios: { shadowColor: '#212121', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  questionPrompt: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.text,
  },
  questionHelp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  choiceGrid: {
    gap: 10,
  },
  choiceCard: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  choiceCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.slate,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  choiceTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.text,
  },
  choiceTitleActive: {
    color: colors.primary,
  },
  choiceDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    paddingLeft: 30,
  },
  legalBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  legalTitle: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.text,
  },
  legalText: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#212121', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.slateLight,
    flexShrink: 0,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  continueBtn: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  continueBtnDisabled: {
    backgroundColor: colors.slate,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});
