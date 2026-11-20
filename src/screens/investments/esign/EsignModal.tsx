import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { openCachedDocument } from '../../../utils/documentCache';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { baseApi } from '../../../api/baseApi';
import {
  useGetInvestorsMeAgreementProfileQuery,
  useGetKycMeQuery,
  usePatchInvestorsMeAgreementProfileMutation,
  usePostEsignInvestmentsByInvestmentIdEnvelopeMutation,
  usePostEsignEnvelopesByEnvelopeIdSignMutation,
  useLazyGetEsignEnvelopesByEnvelopeIdDownloadQuery,
  EsignField,
  EsignSigner,
} from '../../../api/generated/investorApi';
import { ConfirmDetailsModal } from './ConfirmDetailsModal';
import {
  AgreementDocumentViewer,
  AgreementViewerHandle,
} from './AgreementDocumentViewer';
import { SignatureCaptureModal, SignatureValue } from './SignatureCaptureModal';
import { SignersQuestionView } from './SignersQuestionView';
import { FieldEntryModal } from './FieldEntryModal';
import {
  StatusFeedbackModal,
  FeedbackVariant,
} from '../../../components/common/StatusFeedbackModal';

const BRAND = {
  gold: '#C39967',
  goldTint: '#FAF5EE',
  goldBorder: '#DFC7A7',
  grey: '#A5ADB6',
  white: '#FFFFFF',
  canvas: '#F5F4F0',
  charcoal: '#212121',
  mutedText: '#6B7280',
  border: '#E5E7EB',
};

type Props = NativeStackScreenProps<RootStackParamList, 'EsignModal'>;

interface FeedbackState {
  visible: boolean;
  variant: FeedbackVariant;
  title: string;
  message: string;
  details?: string[];
  primaryLabel?: string;
  onPrimary?: () => void;
}

export const EsignModal: React.FC<Props> = ({ route, navigation }) => {
  const { investmentId, internalRef } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const hasTriggeredRef = useRef(false);
  const hasSyncedFullNameRef = useRef(false);
  const viewerRef = useRef<AgreementViewerHandle>(null);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useGetInvestorsMeAgreementProfileQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { data: kycData } = useGetKycMeQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });

  const [patchAgreementProfile] = usePatchInvestorsMeAgreementProfileMutation();

  const [requestEnvelope, { isLoading: isGeneratingEnvelope }] =
    usePostEsignInvestmentsByInvestmentIdEnvelopeMutation();

  const [signEnvelope, { isLoading: isSigning }] =
    usePostEsignEnvelopesByEnvelopeIdSignMutation();

  const [triggerDownload, { isFetching: isFetchingDownload }] =
    useLazyGetEsignEnvelopesByEnvelopeIdDownloadQuery();

  const account = profileData?.agreementProfile?.investingAccount;
  const combinedAccountName = [account?.firstName, account?.lastName]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' ');

  const indDetails = kycData?.individualDetails as
    | { firstName?: string; lastName?: string; fullName?: string; legalName?: string }
    | undefined;
  const combinedKycName = [indDetails?.firstName, indDetails?.lastName]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' ');

  const kycFullName = (
    combinedKycName ||
    indDetails?.fullName ||
    indDetails?.legalName ||
    kycData?.companyKyc?.companyName ||
    ''
  ).trim();
  const legalAccountName = (account?.legalName || '').trim();

  const investorFullName =
    (combinedAccountName.includes(' ') ? combinedAccountName : '') ||
    kycFullName ||
    (legalAccountName.includes(' ') ? legalAccountName : '') ||
    combinedAccountName ||
    legalAccountName ||
    '';

  const [activeEnvelopeId, setActiveEnvelopeId] = useState<string | null>(null);
  const [fields, setFields] = useState<EsignField[]>([]);
  const [signers, setSigners] = useState<EsignSigner[]>([]);
  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [hasAnsweredSigners, setHasAnsweredSigners] = useState(false);
  const [presentRoles, setPresentRoles] = useState<string[]>([]);

  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signaturesByFieldId, setSignaturesByFieldId] = useState<Record<string, SignatureValue>>({});
  const [activeEditingField, setActiveEditingField] = useState<EsignField | null>(null);

  const [showConfirmDetails, setShowConfirmDetails] = useState(false);
  const [showSigModal, setShowSigModal] = useState(false);
  const [activeSigFieldId, setActiveSigFieldId] = useState<string>('investor_signature');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    variant: 'error',
    title: '',
    message: '',
  });

  const showFeedback = (next: Omit<FeedbackState, 'visible'>) => {
    setFeedback({ ...next, visible: true });
  };

  const closeFeedback = () => {
    setFeedback((prev) => ({ ...prev, visible: false }));
  };

  const pendingChange = profileData?.pendingBankChange;
  const requirements = profileData?.requirements;
  const isProfileComplete = requirements?.complete ?? true;

  useEffect(() => {
    if (!investorFullName || fields.length === 0) return;

    setFieldValues((prev) => {
      const next = { ...prev };
      let changed = false;

      fields.forEach((f) => {
        const signerKey = f.signerKey || 'investor';
        const labelLower = (f.label || f.id || '').toLowerCase();
        const isInvestorNameField =
          signerKey === 'investor' &&
          (labelLower.includes('name') || labelLower.includes('investor')) &&
          f.fillMode !== 'signature' &&
          f.type !== 'signature';

        if (isInvestorNameField && next[f.id] !== investorFullName) {
          next[f.id] = investorFullName;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [investorFullName, fields]);

  const generateFreshEnvelope = useCallback(async () => {
    try {
      setGenerationError(null);
      setResolvedPdfUrl(null);
      setSignaturesByFieldId({});
      setHasScrolledToEnd(false);

      const res = await requestEnvelope({ investmentId }).unwrap();
      const freshId = res.envelope?.id;

      if (!freshId) {
        throw new Error('Envelope identifier not returned by agreement service.');
      }

      setActiveEnvelopeId(freshId);
      if (res.fields) {
        setFields(res.fields);
        const invSigField = res.fields.find(
          (f) =>
            (f.signerKey || 'investor') === 'investor' &&
            (f.fillMode === 'signature' || f.type === 'signature')
        );
        if (invSigField) {
          setActiveSigFieldId(invSigField.id);
        }
      }

      const envelopeSigners = res.signers || [];
      setSigners(envelopeSigners);

      const defaultRequiredCoSigners = envelopeSigners
        .filter((s) => s.required && s.key !== 'investor')
        .map((s) => s.key)
        .filter(Boolean);
      setPresentRoles(defaultRequiredCoSigners);

      const previewUrl = `${process.env.EXPO_PUBLIC_API_URL}/esign/envelopes/${freshId}/preview`;
      setResolvedPdfUrl(previewUrl);
    } catch (err: any) {
      if (err?.status === 409 || err?.status === 422) {
        setGenerationError('Agreement parameters need verification before document compilation.');
        setShowConfirmDetails(true);
      } else {
        setGenerationError(
          err?.data?.message || err?.data?.error?.message || 'Unable to prepare contract envelope.'
        );
      }
    }
  }, [investmentId, requestEnvelope]);

  useEffect(() => {
    if (profileData && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      if (pendingChange || !isProfileComplete) {
        setShowConfirmDetails(true);
        return;
      }

      const isIndividual = account?.entityType !== 'company';
      const missingLastName = isIndividual && !account?.lastName && kycFullName.includes(' ');
      if (missingLastName && !hasSyncedFullNameRef.current) {
        hasSyncedFullNameRef.current = true;
        const parts = kycFullName.split(/\s+/);
        patchAgreementProfile({
          body: {
            accountHolder: {
              firstName: parts[0],
              lastName: parts.slice(1).join(' '),
            },
          } as any,
        })
          .unwrap()
          .then(() => refetchProfile())
          .catch(() => {})
          .finally(() => {
            generateFreshEnvelope();
          });
        return;
      }

      generateFreshEnvelope();
    }
  }, [
    profileData,
    isProfileComplete,
    pendingChange,
    account,
    kycFullName,
    patchAgreementProfile,
    refetchProfile,
    generateFreshEnvelope,
  ]);

  const handleDetailsSuccess = async () => {
    setShowConfirmDetails(false);
    await refetchProfile();
    generateFreshEnvelope();
  };

  const activeRolesForViewer = ['investor', ...presentRoles];

  const witnessNameField = fields.find(
    (f) =>
      (f.signerKey || '') === 'witness' &&
      f.fillMode === 'signer_entered' &&
      ((f.label || f.id || '').toLowerCase().includes('name') || f.required !== false)
  );
  const isWitnessPresent = presentRoles.includes('witness');
  const isWitnessNameCompleted =
    !isWitnessPresent ||
    !witnessNameField ||
    Boolean((fieldValues[witnessNameField.id] || '').trim());

  const requiresWitnessNameFirst = isWitnessPresent && !isWitnessNameCompleted;

  const openWitnessNameEntry = () => {
    if (witnessNameField) {
      if (witnessNameField.page) {
        viewerRef.current?.scrollToPage(witnessNameField.page);
      }
      setActiveEditingField(witnessNameField);
    }
  };

  const activeSignatureFields = fields.filter(
    (f) =>
      activeRolesForViewer.includes(f.signerKey || 'investor') &&
      (f.fillMode === 'signature' || f.type === 'signature')
  );

  const editableFields = fields.filter(
    (f) =>
      activeRolesForViewer.includes(f.signerKey || 'investor') &&
      (f.fillMode === 'signer_entered' || f.fillMode === 'signature' || f.type === 'signature')
  );

  const handleTapField = (field: EsignField) => {
    if (field.fillMode === 'signature' || field.type === 'signature') {
      if (requiresWitnessNameFirst) {
        openWitnessNameEntry();
        return;
      }
      setActiveSigFieldId(field.id);
      setShowSigModal(true);
    } else if (field.fillMode === 'signer_entered') {
      setActiveEditingField(field);
    }
  };

  const handleSaveFieldValue = (fieldId: string, val: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleNextField = () => {
    if (!activeEditingField) return;
    const currentIndex = editableFields.findIndex((f) => f.id === activeEditingField.id);
    if (currentIndex >= 0 && currentIndex < editableFields.length - 1) {
      const nextField = editableFields[currentIndex + 1];
      if (nextField.fillMode === 'signature' || nextField.type === 'signature') {
        setActiveEditingField(null);
        setActiveSigFieldId(nextField.id);
        setShowSigModal(true);
      } else {
        setActiveEditingField(nextField);
      }
    } else {
      setActiveEditingField(null);
    }
  };

  const allRequiredSignaturesApplied =
    activeSignatureFields.length > 0
      ? activeSignatureFields.every((f) => Boolean(signaturesByFieldId[f.id]))
      : Object.keys(signaturesByFieldId).length > 0;

  const handleExecute = async () => {
    if (!activeEnvelopeId) return;

    if (requiresWitnessNameFirst) {
      openWitnessNameEntry();
      return;
    }

    if (!hasScrolledToEnd) {
      showFeedback({
        variant: 'warning',
        title: 'Document Review Required',
        message: 'Please scroll through to page 15 of the Master Agreement before sealing.',
        primaryLabel: 'Got It',
      });
      return;
    }

    const missingTextFields = fields.filter(
      (f) =>
        activeRolesForViewer.includes(f.signerKey || 'investor') &&
        f.fillMode === 'signer_entered' &&
        f.required !== false &&
        !(fieldValues[f.id] || '').trim()
    );

    const missingSigFields = activeSignatureFields.filter(
      (f) => !signaturesByFieldId[f.id]
    );

    if (missingTextFields.length > 0 || missingSigFields.length > 0) {
      const missingLabels = [
        ...missingTextFields.map((f) => f.label || f.id),
        ...missingSigFields.map(
          (f) =>
            f.label ||
            (f.signerKey === 'investor' ? 'Investor Signature' : `${f.signerKey} Signature`)
        ),
      ];

      showFeedback({
        variant: 'warning',
        title: 'Missing Required Fields',
        message: 'Please complete all highlighted fields and signatures before sealing the agreement:',
        details: missingLabels,
        primaryLabel: 'Fill Next Missing',
        onPrimary: () => {
          closeFeedback();
          if (missingTextFields.length > 0) {
            setActiveEditingField(missingTextFields[0]);
          } else if (missingSigFields.length > 0) {
            setActiveSigFieldId(missingSigFields[0].id);
            setShowSigModal(true);
          }
        },
      });
      return;
    }

    const submittedValues: any[] = [];
    fields.forEach((f) => {
      const signerKey = f.signerKey || 'investor';
      if (!activeRolesForViewer.includes(signerKey)) return;
      if (f.fillMode === 'auto') return;

      const isSig = f.fillMode === 'signature' || f.type === 'signature';
      if (isSig) {
        const sig = signaturesByFieldId[f.id];
        if (sig) {
          submittedValues.push({
            fieldId: f.id,
            signature:
              sig.method === 'typed'
                ? { method: 'typed', text: sig.text }
                : { method: 'drawn', objectKey: sig.objectKey },
          });
        }
      } else if (fieldValues[f.id] && fieldValues[f.id].trim()) {
        submittedValues.push({
          fieldId: f.id,
          value: fieldValues[f.id].trim(),
        });
      }
    });

    const validSignerKeys = new Set(signers.map((s) => s.key).filter(Boolean));
    const sanitizedPresentRoles = presentRoles.filter((role) => validSignerKeys.has(role));

    try {
      await signEnvelope({
        envelopeId: activeEnvelopeId,
        body: {
          presentRoles: sanitizedPresentRoles,
          values: submittedValues,
        },
      }).unwrap();

      dispatch(baseApi.util.invalidateTags(['Investments', 'DashboardStats', 'E-Sign']));
      setIsSuccessModalVisible(true);
    } catch (err: any) {
      if (err?.status === 409) {
        showFeedback({
          variant: 'warning',
          title: 'Contract Updated',
          message:
            'Agreement parameters changed while reviewing. We will compile an updated contract snapshot.',
          primaryLabel: 'Reload Agreement',
          onPrimary: () => {
            closeFeedback();
            generateFreshEnvelope();
          },
        });
        return;
      }

      const rawDetails = err?.data?.error?.details || err?.data?.details;
      const parsedDetails: string[] = Array.isArray(rawDetails)
        ? rawDetails.map((d: any) =>
            typeof d === 'string' ? d : d?.message || JSON.stringify(d)
          )
        : rawDetails && typeof rawDetails === 'object'
        ? Object.entries(rawDetails).map(([k, v]) => `${k}: ${String(v)}`)
        : [];

      showFeedback({
        variant: 'error',
        title: 'Execution Validation Failed',
        message:
          err?.data?.error?.message ||
          err?.data?.message ||
          'Please verify that all investor and witness details are filled accurately.',
        details: parsedDetails.length > 0 ? parsedDetails : undefined,
        primaryLabel: 'Review Agreement',
      });
    }
  };

  const handleDownloadSignedPdf = async () => {
    if (!activeEnvelopeId) return;
    try {
      const dlRes = await triggerDownload({ envelopeId: activeEnvelopeId }, false).unwrap();
      if (!dlRes?.url) {
        throw new Error('No pre-signed download URL returned');
      }
      await openCachedDocument(dlRes.url, {
        fileName: `BricketX_Agreement_${internalRef}.pdf`,
        title: `BricketX_Agreement_${internalRef}.pdf`,
      });
    } catch (err: any) {
      const detail =
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        'Could not download the signed agreement PDF. Please try again.';
      showFeedback({
        variant: 'error',
        title: 'Download Failed',
        message:
          typeof detail === 'string'
            ? detail
            : 'Could not download the signed agreement PDF. Please try again.',
        primaryLabel: 'Close',
      });
    }
  };

  const activeSigField = fields.find((f) => f.id === activeSigFieldId);
  const isWitnessSigModal =
    activeSigField && (activeSigField.signerKey || 'investor') !== 'investor';

  const defaultSigName = isWitnessSigModal
    ? (witnessNameField ? fieldValues[witnessNameField.id] : '') || ''
    : investorFullName;

  const isPreparing = isLoadingProfile || isGeneratingEnvelope;
  const coSigners = signers.filter((s) => s.key !== 'investor');

  if (coSigners.length > 0 && !hasAnsweredSigners && resolvedPdfUrl) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
        <SignersQuestionView
          signers={signers}
          investorFieldCount={fields.filter((f) => f.fillMode === 'signer_entered').length}
          onContinue={(roles) => {
            setPresentRoles(roles);
            setHasAnsweredSigners(true);
          }}
          onBack={() => navigation.goBack()}
        />
      </View>
    );
  }

  const appliedSigCount = activeSignatureFields.filter((f) =>
    Boolean(signaturesByFieldId[f.id])
  ).length;
  const totalRequiredSigCount = Math.max(1, activeSignatureFields.length);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color={BRAND.charcoal} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Master Agreement
          </Text>
          <Text style={styles.topBarRef} numberOfLines={1}>
            {internalRef}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.detailsBtnHeader}
          onPress={() => setShowConfirmDetails(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={14} color={BRAND.white} style={{ flexShrink: 0 }} />
          <Text style={styles.editBtn} numberOfLines={1}>
            Edit Details
          </Text>
        </TouchableOpacity>
      </View>

      {(!isProfileComplete || Boolean(pendingChange)) && (
        <View style={styles.noticeBar}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={BRAND.charcoal}
            style={{ flexShrink: 0 }}
          />
          <Text style={styles.noticeText}>
            {pendingChange
              ? 'Bank update awaiting verification code.'
              : 'Required profile parameters missing.'}
          </Text>
          <TouchableOpacity onPress={() => setShowConfirmDetails(true)} style={{ flexShrink: 0 }}>
            <Text style={styles.fixLink}>Resolve</Text>
          </TouchableOpacity>
        </View>
      )}

      {isPreparing && !resolvedPdfUrl ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={BRAND.gold} />
          <Text style={styles.loadingTitle} numberOfLines={2}>
            Preparing Master Agreement
          </Text>
          <Text style={styles.loadingText}>
            Compiling investment terms, statutory clauses, and signature targets into the 15-page agreement...
          </Text>
        </View>
      ) : generationError && !resolvedPdfUrl ? (
        <View style={styles.centerBox}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={38} color={BRAND.charcoal} />
          </View>
          <Text style={styles.errorTitle} numberOfLines={2}>
            Verification Needed
          </Text>
          <Text style={styles.errorSub}>{generationError}</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowConfirmDetails(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText} numberOfLines={2}>
              Confirm Profile Details
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <AgreementDocumentViewer
          ref={viewerRef}
          envelopeId={activeEnvelopeId || ''}
          pdfUrl={resolvedPdfUrl || undefined}
          fields={fields}
          fieldValues={fieldValues}
          presentRoles={activeRolesForViewer}
          signaturesByFieldId={signaturesByFieldId}
          hasScrolledToEnd={hasScrolledToEnd}
          requiresWitnessNameFirst={requiresWitnessNameFirst}
          onRequireWitnessName={openWitnessNameEntry}
          onReachEnd={() => setHasScrolledToEnd(true)}
          onTapSignature={(fieldId) => {
            if (requiresWitnessNameFirst) {
              openWitnessNameEntry();
              return;
            }
            if (fieldId) {
              setActiveSigFieldId(fieldId);
            } else {
              const nextUnsigned = activeSignatureFields.find((f) => !signaturesByFieldId[f.id]);
              if (nextUnsigned) setActiveSigFieldId(nextUnsigned.id);
            }
            setShowSigModal(true);
          }}
          onOpenDetails={() => setShowConfirmDetails(true)}
          onTapField={handleTapField}
        />
      )}

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 10 }]}>
        <View style={styles.sigStatusBox}>
          <View
            style={[
              styles.statusDot,
              allRequiredSignaturesApplied && !requiresWitnessNameFirst && styles.statusDotActive,
            ]}
          />
          <Text
            style={[
              styles.sigStatusText,
              allRequiredSignaturesApplied && !requiresWitnessNameFirst && styles.sigStatusDone,
            ]}
            numberOfLines={2}
          >
            {requiresWitnessNameFirst
              ? 'Witness Full Name required before signing'
              : allRequiredSignaturesApplied
              ? `Ready (${appliedSigCount}/${totalRequiredSigCount} signed)`
              : hasScrolledToEnd
              ? `Signatures: ${appliedSigCount} of ${totalRequiredSigCount} applied`
              : 'Review & scroll to Page 15'}
          </Text>
        </View>

        {requiresWitnessNameFirst ? (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={openWitnessNameEntry}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText} numberOfLines={2}>
              Enter Witness Name
            </Text>
            <Ionicons name="arrow-forward" size={16} color={BRAND.white} style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!hasScrolledToEnd || !allRequiredSignaturesApplied || isSigning) &&
                styles.submitBtnDisabled,
            ]}
            onPress={handleExecute}
            disabled={!hasScrolledToEnd || !allRequiredSignaturesApplied || isSigning}
            activeOpacity={0.85}
          >
            {isSigning ? (
              <ActivityIndicator color={BRAND.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText} numberOfLines={2}>
                  Seal Agreement
                </Text>
                <Ionicons name="checkmark-circle" size={16} color={BRAND.white} style={{ flexShrink: 0 }} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ConfirmDetailsModal
        visible={showConfirmDetails}
        onClose={() => setShowConfirmDetails(false)}
        onSuccess={handleDetailsSuccess}
      />

      {activeEnvelopeId && (
        <SignatureCaptureModal
          key={activeSigFieldId}
          visible={showSigModal}
          envelopeId={activeEnvelopeId}
          label={
            isWitnessSigModal
              ? `Apply ${activeSigField?.label || 'Witness Signature'}`
              : 'Apply Investor Signature'
          }
          defaultName={defaultSigName}
          onCapture={(sig) => {
            setSignaturesByFieldId((prev) => ({
              ...prev,
              [activeSigFieldId]: sig,
            }));
            setShowSigModal(false);
          }}
          onClose={() => setShowSigModal(false)}
        />
      )}

      <FieldEntryModal
        visible={Boolean(activeEditingField)}
        field={activeEditingField}
        currentValue={activeEditingField ? fieldValues[activeEditingField.id] || '' : ''}
        hasNext={
          Boolean(activeEditingField) &&
          editableFields.findIndex((f) => f.id === activeEditingField?.id) <
            editableFields.length - 1
        }
        onSave={handleSaveFieldValue}
        onNext={handleNextField}
        onClose={() => setActiveEditingField(null)}
      />

      <StatusFeedbackModal
        visible={feedback.visible}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        details={feedback.details}
        primaryLabel={feedback.primaryLabel}
        onPrimary={() => {
          if (feedback.onPrimary) {
            feedback.onPrimary();
          } else {
            closeFeedback();
          }
        }}
      />

      <Modal visible={isSuccessModalVisible} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={30} color={BRAND.white} />
            </View>
            <Text style={styles.successTitle} numberOfLines={2}>
              Agreement Executed
            </Text>
            <Text style={styles.successSub}>
              Your Master Participation Agreement ({internalRef}) has been legally signed and timestamped.
            </Text>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handleDownloadSignedPdf}
              disabled={isFetchingDownload}
            >
              {isFetchingDownload ? (
                <ActivityIndicator size="small" color={BRAND.gold} />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color={BRAND.gold} style={{ flexShrink: 0 }} />
                  <Text style={styles.secondaryActionText} numberOfLines={2}>
                    Download Signed PDF
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.replace('FundingInstructionsModal', {
                  investmentId,
                  internalRef,
                  envelopeId: activeEnvelopeId || undefined,
                });
              }}
            >
              <Text style={styles.primaryActionBtnText} numberOfLines={2}>
                Proceed to Funding Instructions
              </Text>
              <Ionicons name="arrow-forward" size={16} color={BRAND.white} style={{ flexShrink: 0 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    gap: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topBarCenter: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    color: BRAND.charcoal,
  },
  topBarRef: {
    fontSize: 11,
    lineHeight: 15,
    color: BRAND.grey,
    marginTop: 1,
    fontWeight: '600',
  },
  detailsBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: BRAND.gold,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexShrink: 0,
    maxWidth: '34%',
  },
  editBtn: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: BRAND.white,
    flexShrink: 1,
  },
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.goldTint,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.goldBorder,
  },
  noticeText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.charcoal,
    fontWeight: '600',
  },
  fixLink: {
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.gold,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  centerBox: {
    flex: 1,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    color: BRAND.charcoal,
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: BRAND.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.goldTint,
    borderWidth: 1,
    borderColor: BRAND.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexShrink: 0,
  },
  errorTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: BRAND.charcoal,
    marginBottom: 4,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 12.5,
    color: BRAND.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  actionBtn: {
    backgroundColor: BRAND.gold,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  actionBtnText: {
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: BRAND.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sigStatusBox: {
    flex: 1,
    minWidth: 140,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.grey,
    flexShrink: 0,
  },
  statusDotActive: {
    backgroundColor: BRAND.gold,
  },
  sigStatusText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.mutedText,
    fontWeight: '600',
  },
  sigStatusDone: {
    color: BRAND.charcoal,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRAND.gold,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
    flexShrink: 1,
    maxWidth: '100%',
  },
  submitBtnDisabled: {
    backgroundColor: BRAND.grey,
  },
  submitBtnText: {
    color: BRAND.white,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(33, 33, 33, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: BRAND.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flexShrink: 0,
  },
  successTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    color: BRAND.charcoal,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: BRAND.mutedText,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BRAND.gold,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    color: BRAND.gold,
    textAlign: 'center',
    flexShrink: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND.gold,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: BRAND.white,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});
