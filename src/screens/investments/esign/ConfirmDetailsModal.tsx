import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import {
  useGetInvestorsMeAgreementProfileQuery,
  useGetKycMeQuery,
  usePatchInvestorsMeAgreementProfileMutation,
  usePostInvestorsMeBankAccountChangesByChangeIdConfirmMutation,
  usePostInvestorsMeBankAccountChangesByChangeIdResendMutation,
  usePostInvestorsMeBankAccountChangesByChangeIdCancelMutation,
  PendingBankChange,
} from '../../../api/generated/investorApi';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BannerState {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

const ID_DOC_TYPES = [
  { label: 'Passport', value: 'passport' },
  { label: 'National ID', value: 'national_id' },
];

export const ConfirmDetailsModal: React.FC<Props> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16);

  const { data: profileData, isLoading: isLoadingProfile, refetch } =
    useGetInvestorsMeAgreementProfileQuery(undefined, {
      skip: !visible,
      refetchOnMountOrArgChange: true,
    });

  const { data: kycData } = useGetKycMeQuery(undefined, {
    skip: !visible,
  });

  const [patchProfile, { isLoading: isSubmitting }] =
    usePatchInvestorsMeAgreementProfileMutation();
  const [confirmBankChange, { isLoading: isConfirming }] =
    usePostInvestorsMeBankAccountChangesByChangeIdConfirmMutation();
  const [resendBankChange, { isLoading: isResending }] =
    usePostInvestorsMeBankAccountChangesByChangeIdResendMutation();
  const [cancelBankChange, { isLoading: isCancelling }] =
    usePostInvestorsMeBankAccountChangesByChangeIdCancelMutation();

  const profile = profileData?.agreementProfile;
  const account = profile?.investingAccount;
  const isCompany = account?.entityType === 'company';

  const savedMaskedNumber = profile?.identityDocumentNumber;
  const [docType, setDocType] = useState<'passport' | 'national_id'>('passport');
  const [changingNumber, setChangingNumber] = useState(false);
  const [docNumber, setDocNumber] = useState('');

  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('AE');

  const savedBank = account?.bankDetails;
  const isSavedBankComplete = Boolean(
    savedBank?.bankName &&
      savedBank?.country &&
      savedBank?.swiftBic &&
      savedBank?.accountReference &&
      (isCompany || (account?.firstName && account?.lastName))
  );

  const [editingBank, setEditingBank] = useState(false);
  const [bankDirty, setBankDirty] = useState(false);

  const [bankCountry, setBankCountry] = useState('AE');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftBic, setSwiftBic] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [nokName, setNokName] = useState('');
  const [nokRelationship, setNokRelationship] = useState('');
  const [nokPhone, setNokPhone] = useState('');
  const [nokEmail, setNokEmail] = useState('');
  const [nokAddress, setNokAddress] = useState('');

  const [pendingChange, setPendingChange] = useState<PendingBankChange | null>(null);
  const [otpCode, setOtpCode] = useState('');

  const [banner, setBanner] = useState<BannerState | null>(null);

  useEffect(() => {
    if (!visible) {
      setBanner(null);
    }
  }, [visible]);

  useEffect(() => {
    if (profile) {
      if (profile.identityDocumentType === 'passport' || profile.identityDocumentType === 'national_id') {
        setDocType(profile.identityDocumentType);
      }

      if (profile.identityDocumentNumber) {
        setChangingNumber(false);
        setDocNumber('');
      } else {
        setChangingNumber(true);
      }

      const ind = kycData?.individualDetails as
        | { firstName?: string; lastName?: string; fullName?: string; legalName?: string }
        | undefined;
      const kycFirst = (ind?.firstName || '').trim();
      const kycLast = (ind?.lastName || '').trim();
      const kycRawFull = (ind?.fullName || ind?.legalName || '').trim();
      const kycParts = kycRawFull ? kycRawFull.split(/\s+/) : [];

      const fallbackFirst = kycFirst || (kycParts.length > 0 ? kycParts[0] : '');
      const fallbackLast = kycLast || (kycParts.length > 1 ? kycParts.slice(1).join(' ') : '');

      if (account) {
        const resolvedFirst =
          account.firstName && account.lastName
            ? account.firstName
            : fallbackFirst || account.firstName || '';
        const resolvedLast = account.lastName || fallbackLast || '';

        setFirstName(resolvedFirst);
        setLastName(resolvedLast);

        if (account.address) {
          if (account.address.street) setStreetAddress(account.address.street);
          if (account.address.city) setCity(account.address.city);
          if (account.address.state) setState(account.address.state);
          if (account.address.postcode) setPostcode(account.address.postcode);
          if (account.address.country) setCountry(account.address.country);
        }
      } else if (fallbackFirst || fallbackLast) {
        setFirstName(fallbackFirst);
        setLastName(fallbackLast);
      }

      if (savedBank) {
        if (savedBank.country) setBankCountry(savedBank.country);
        if (savedBank.bankName) setBankName(savedBank.bankName);
        if (savedBank.swiftBic) setSwiftBic(savedBank.swiftBic);
      }

      if (isSavedBankComplete) {
        setEditingBank(false);
        setBankDirty(false);
      } else {
        setEditingBank(true);
        setBankDirty(false);
      }

      if (profile.nextOfKin) {
        if (profile.nextOfKin.name) setNokName(profile.nextOfKin.name);
        if (profile.nextOfKin.relationship) setNokRelationship(profile.nextOfKin.relationship);
        if (profile.nextOfKin.phone) setNokPhone(profile.nextOfKin.phone);
        if (profile.nextOfKin.email) setNokEmail(profile.nextOfKin.email);
        if (profile.nextOfKin.address) setNokAddress(profile.nextOfKin.address);
      }

      if (profileData?.pendingBankChange) {
        setPendingChange(profileData.pendingBankChange);
      } else {
        setPendingChange(null);
      }
    }
  }, [profileData, profile, account, savedBank, isSavedBankComplete, kycData]);

  const handleSubmit = async () => {
    setBanner(null);
    const wantsBank = !isSavedBankComplete || (editingBank && bankDirty);

    if (!isCompany && (!firstName.trim() || !lastName.trim())) {
      setBanner({
        type: 'warning',
        title: 'Required Field',
        message: 'Please enter your full first and last legal name.',
      });
      return;
    }

    if (wantsBank) {
      const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
      const cleanAcc = accountNumber.replace(/\s+/g, '').toUpperCase();
      if (!bankName.trim()) {
        setBanner({
          type: 'warning',
          title: 'Required Field',
          message: 'Please enter your bank name.',
        });
        return;
      }
      if (!cleanIban && !cleanAcc) {
        setBanner({
          type: 'warning',
          title: 'Required Field',
          message: 'Please enter an account number or IBAN.',
        });
        return;
      }
      if (!swiftBic.trim()) {
        setBanner({
          type: 'warning',
          title: 'Required Field',
          message: 'Please enter your bank SWIFT / BIC code.',
        });
        return;
      }
    }

    if (changingNumber && docNumber.trim()) {
      if (docNumber.trim().length < 3) {
        setBanner({
          type: 'warning',
          title: 'Invalid Document',
          message: 'Document number must be at least 3 characters.',
        });
        return;
      }
    }

    const payload: any = {
      identityDocumentType: docType || null,
      ...(changingNumber && docNumber.trim()
        ? { identityDocumentNumber: docNumber.trim().toUpperCase() }
        : {}),
      nextOfKin: nokName.trim()
        ? {
            name: nokName.trim(),
            relationship: nokRelationship.trim() || undefined,
            phone: nokPhone.trim() || undefined,
            email: nokEmail.trim() || undefined,
            address: nokAddress.trim() || undefined,
          }
        : null,
    };

    if (!isCompany && firstName.trim() && lastName.trim()) {
      payload.accountHolder = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
    }

    if (streetAddress.trim() || city.trim() || country.trim()) {
      payload.accountAddress = {
        street: streetAddress.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim().toUpperCase() || 'AE',
        state: state.trim() || undefined,
        postcode: postcode.trim() || undefined,
      };
    }

    if (wantsBank) {
      const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
      const cleanAcc = accountNumber.replace(/\s+/g, '').toUpperCase();

      payload.bankDetails = {
        country: bankCountry.trim().toUpperCase() || 'AE',
        bankName: bankName.trim(),
        swiftBic: swiftBic.trim().toUpperCase(),
        ...(cleanAcc ? { accountNumber: cleanAcc } : {}),
        ...(cleanIban ? { iban: cleanIban } : {}),
      };
    }

    try {
      const res = await patchProfile({ body: payload }).unwrap();
      const outcome = res?.bankAccountChange;

      if (
        wantsBank &&
        outcome?.status === 'pending_confirmation' &&
        (outcome.change || res.pendingBankChange)
      ) {
        setPendingChange(outcome.change || res.pendingBankChange || null);
        setBanner({
          type: 'info',
          title: 'Verification Code Sent',
          message:
            'A security code was emailed to confirm this bank update. Enter it below to unlock the agreement.',
        });
        return;
      }

      await refetch();
      onSuccess();
    } catch (err: any) {
      const message =
        err?.data?.error?.details?.formErrors?.[0] ||
        err?.data?.error?.message ||
        err?.data?.message ||
        'Could not save agreement profile. Please check the required fields.';
      setBanner({
        type: 'error',
        title: 'Save Failed',
        message,
      });
    }
  };

  const handleConfirmOtp = async () => {
    setBanner(null);
    const cleanId = pendingChange?.id || profileData?.pendingBankChange?.id;
    const cleanCode = otpCode.replace(/[^0-9]/g, '').trim();

    if (!cleanId || !cleanCode) {
      setBanner({
        type: 'warning',
        title: 'Code Required',
        message: 'Please enter the authorization code received.',
      });
      return;
    }

    try {
      await confirmBankChange({
        changeId: cleanId,
        body: { code: cleanCode },
      }).unwrap();

      setPendingChange(null);
      setOtpCode('');
      setEditingBank(false);
      setBankDirty(false);

      await refetch();
      onSuccess();
    } catch (err: any) {
      setBanner({
        type: 'error',
        title: 'Verification Failed',
        message:
          err?.data?.error?.message || err?.data?.message || 'Invalid or expired confirmation code.',
      });
    }
  };

  const handleResendOtp = async () => {
    setBanner(null);
    const cleanId = pendingChange?.id || profileData?.pendingBankChange?.id;
    if (!cleanId) return;

    try {
      await resendBankChange({ changeId: cleanId }).unwrap();
      setBanner({
        type: 'success',
        title: 'Code Sent',
        message: 'A fresh verification code has been sent to your email.',
      });
    } catch (err: any) {
      setBanner({
        type: 'error',
        title: 'Resend Failed',
        message: err?.data?.error?.message || 'Could not resend code.',
      });
    }
  };

  const handleCancelBankChange = async () => {
    setBanner(null);
    const cleanId = pendingChange?.id || profileData?.pendingBankChange?.id;
    if (!cleanId) {
      setPendingChange(null);
      return;
    }

    try {
      await cancelBankChange({ changeId: cleanId }).unwrap();
      setPendingChange(null);
      setOtpCode('');
      await refetch();
    } catch (err: any) {
      setBanner({
        type: 'error',
        title: 'Cancel Failed',
        message: err?.data?.error?.message || 'Could not cancel change.',
      });
    }
  };

  const bannerPalette = banner
    ? banner.type === 'error'
      ? { bg: '#FFEBEE', border: '#FFCDD2', icon: '#C62828' as const, iconName: 'alert-circle' as const }
      : banner.type === 'warning'
      ? { bg: '#FFF8E1', border: '#FFE082', icon: '#B78103' as const, iconName: 'warning' as const }
      : banner.type === 'success'
      ? { bg: '#E8F5E9', border: '#C8E6C9', icon: '#2E7D32' as const, iconName: 'checkmark-circle' as const }
      : { bg: '#FAF5EE', border: '#E7D7C1', icon: colors.primary, iconName: 'information-circle' as const }
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheetContainer, { paddingBottom: bottomInset + 10 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.kicker} numberOfLines={1}>
                EXECUTION PREREQUISITES
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                Confirm Your Agreement Profile
              </Text>
              <Text style={styles.subtitle}>
                Legal investor name, banking coordinates & identity
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Inline Feedback Banner */}
          {banner && bannerPalette && (
            <View
              style={[
                styles.bannerBox,
                { backgroundColor: bannerPalette.bg, borderColor: bannerPalette.border },
              ]}
            >
              <Ionicons
                name={bannerPalette.iconName}
                size={18}
                color={bannerPalette.icon}
                style={{ flexShrink: 0 }}
              />
              <View style={{ flex: 1, minWidth: 0, flexShrink: 1 }}>
                <Text style={[styles.bannerTitle, { color: bannerPalette.icon }]}>
                  {banner.title}
                </Text>
                <Text style={styles.bannerMessage}>{banner.message}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBanner(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ flexShrink: 0 }}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {isLoadingProfile ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading agreement profile...</Text>
            </View>
          ) : pendingChange ? (
            <ScrollView
              contentContainerStyle={styles.otpContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.otpIconBox}>
                <Ionicons name="mail-unread-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.otpTitle} numberOfLines={2}>
                Verify Bank Account Change
              </Text>
              <Text style={styles.otpSub}>
                To protect your payouts, we sent a 6-digit confirmation code to your email. Enter it below to authorize this bank account change.
              </Text>

              <TextInput
                style={styles.otpInput}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { width: '100%' }]}
                onPress={handleConfirmOtp}
                disabled={isConfirming}
                activeOpacity={0.85}
              >
                {isConfirming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText} numberOfLines={2}>
                    Confirm Bank Details
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.otpActionsRow}>
                <TouchableOpacity onPress={handleResendOtp} disabled={isResending}>
                  <Text style={styles.otpLinkText}>Resend Code</Text>
                </TouchableOpacity>
                <Text style={styles.otpDivider}>•</Text>
                <TouchableOpacity onPress={handleCancelBankChange} disabled={isCancelling}>
                  <Text style={[styles.otpLinkText, { color: colors.error }]}>Cancel Change</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Section 1: Legal Name & Identity Document */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle} numberOfLines={2}>
                    1. Investor Identity
                  </Text>
                  <View style={styles.pinPill}>
                    <Text style={styles.pinPillText} numberOfLines={1}>
                      Page 1 &amp; 15
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Printed as the contracting investor on the Master Agreement
                </Text>

                {!isCompany && (
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Legal First Name</Text>
                      <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First Name"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Legal Last Name</Text>
                      <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last Name"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.radioRow}>
                  {ID_DOC_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.radioBtn, docType === t.value && styles.radioBtnActive]}
                      onPress={() => setDocType(t.value as 'passport' | 'national_id')}
                    >
                      <Ionicons
                        name={docType === t.value ? 'radio-button-on' : 'radio-button-off'}
                        size={17}
                        color={docType === t.value ? colors.primary : colors.textMuted}
                        style={{ flexShrink: 0 }}
                      />
                      <Text
                        style={[styles.radioText, docType === t.value && styles.radioTextActive]}
                        numberOfLines={1}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {savedMaskedNumber && !changingNumber ? (
                  <View style={styles.maskedRow}>
                    <View style={{ flex: 1, minWidth: 0, flexShrink: 1 }}>
                      <Text style={styles.label}>Stored ID Number</Text>
                      <Text style={styles.maskedValue} numberOfLines={1}>
                        {savedMaskedNumber}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.inlineChangeBtn}
                      onPress={() => {
                        setChangingNumber(true);
                        setDocNumber('');
                      }}
                    >
                      <Text style={styles.inlineChangeText} numberOfLines={1}>
                        Change
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.fieldGroup}>
                    <View style={styles.fieldHeader}>
                      <Text style={styles.label}>Document Number</Text>
                      {savedMaskedNumber && (
                        <TouchableOpacity onPress={() => setChangingNumber(false)}>
                          <Text style={styles.cancelLink}>Keep Stored ID</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={docNumber}
                      onChangeText={setDocNumber}
                      placeholder="e.g. A12345678"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                    />
                  </View>
                )}
              </View>

              {/* Section 2: Residential Address */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle} numberOfLines={2}>
                    2. Residential Address
                  </Text>
                  <View style={styles.pinPill}>
                    <Text style={styles.pinPillText} numberOfLines={1}>
                      Page 1
                    </Text>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Street Address</Text>
                  <TextInput
                    style={styles.input}
                    value={streetAddress}
                    onChangeText={setStreetAddress}
                    placeholder="Street, Building, Unit"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={city}
                      onChangeText={setCity}
                      placeholder="City"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Country Code</Text>
                    <TextInput
                      style={styles.input}
                      value={country}
                      onChangeText={setCountry}
                      placeholder="AE"
                      placeholderTextColor={colors.textMuted}
                      maxLength={2}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </View>

              {/* Section 3: Distribution Bank Account */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1, minWidth: 0, flexShrink: 1, paddingRight: 8 }}>
                    <Text style={styles.sectionTitle} numberOfLines={2}>
                      3. Distribution Bank Account
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Where quarterly yields &amp; principal return are wired
                    </Text>
                  </View>
                  {isSavedBankComplete && !editingBank && (
                    <TouchableOpacity
                      style={styles.inlineChangeBtn}
                      onPress={() => {
                        setEditingBank(true);
                        setBankDirty(true);
                      }}
                    >
                      <Text style={styles.inlineChangeText} numberOfLines={1}>
                        Edit Bank
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isSavedBankComplete && !editingBank ? (
                  <View style={styles.savedBankCard}>
                    <View style={styles.bankCardHeader}>
                      <Ionicons
                        name="card"
                        size={20}
                        color={colors.primary}
                        style={{ flexShrink: 0 }}
                      />
                      <Text style={styles.bankCardBankName} numberOfLines={1}>
                        {savedBank?.bankName || 'Saved Bank'}
                      </Text>
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                        <Text style={styles.verifiedText} numberOfLines={1}>
                          On File
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.bankCardAccount} numberOfLines={1}>
                      {savedBank?.accountReference || '••••'}
                    </Text>
                    <View style={styles.bankCardFooter}>
                      <Text style={styles.bankCardSub}>SWIFT: {savedBank?.swiftBic || '-'}</Text>
                      <Text style={styles.bankCardSub}>Country: {savedBank?.country || '-'}</Text>
                    </View>
                  </View>
                ) : (
                  <View>
                    {isSavedBankComplete && (
                      <View style={styles.noticeBox}>
                        <Ionicons
                          name="information-circle"
                          size={16}
                          color={colors.primary}
                          style={{ flexShrink: 0 }}
                        />
                        <Text style={styles.noticeText}>
                          Updating saved bank details will require an email verification code.
                        </Text>
                      </View>
                    )}

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Bank Name</Text>
                      <TextInput
                        style={styles.input}
                        value={bankName}
                        onChangeText={(val) => {
                          setBankName(val);
                          setBankDirty(true);
                        }}
                        placeholder="e.g. Emirates NBD, HSBC"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>IBAN</Text>
                      <TextInput
                        style={styles.input}
                        value={iban}
                        onChangeText={(val) => {
                          setIban(val);
                          setBankDirty(true);
                        }}
                        placeholder="e.g. AE070330000000000000000"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={styles.row}>
                      <View style={styles.halfField}>
                        <Text style={styles.label}>Account Number (if no IBAN)</Text>
                        <TextInput
                          style={styles.input}
                          value={accountNumber}
                          onChangeText={(val) => {
                            setAccountNumber(val);
                            setBankDirty(true);
                          }}
                          placeholder="Account Number"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                      <View style={styles.halfField}>
                        <Text style={styles.label}>SWIFT / BIC</Text>
                        <TextInput
                          style={styles.input}
                          value={swiftBic}
                          onChangeText={(val) => {
                            setSwiftBic(val);
                            setBankDirty(true);
                          }}
                          placeholder="e.g. EBILAEAD"
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>

                    {isSavedBankComplete && (
                      <TouchableOpacity
                        style={styles.cancelEditBtn}
                        onPress={() => {
                          setEditingBank(false);
                          setBankDirty(false);
                        }}
                      >
                        <Text style={styles.cancelEditText}>
                          Cancel bank editing (keep saved account)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Section 4: Next of Kin */}
              <View style={[styles.section, { borderBottomWidth: 0 }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle} numberOfLines={2}>
                    4. Next of Kin (Optional)
                  </Text>
                  <View style={styles.pinPill}>
                    <Text style={styles.pinPillText} numberOfLines={1}>
                      Page 1
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Designated beneficiary for succession planning
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={nokName}
                    onChangeText={setNokName}
                    placeholder="Full Legal Name"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Relationship</Text>
                    <TextInput
                      style={styles.input}
                      value={nokRelationship}
                      onChangeText={setNokRelationship}
                      placeholder="e.g. Spouse, Sibling"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                      style={styles.input}
                      value={nokPhone}
                      onChangeText={setNokPhone}
                      placeholder="+971..."
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={nokEmail}
                    onChangeText={setNokEmail}
                    placeholder="beneficiary@email.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {!pendingChange && !isLoadingProfile && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText} numberOfLines={2}>
                    Save Profile &amp; Update Agreement
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 24, 21, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 17.5,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bannerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  bannerMessage: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
    marginTop: 2,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
  },
  formScroll: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EFECE6',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  pinPill: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  pinPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  radioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFECE6',
    backgroundColor: '#FAF9F6',
  },
  radioBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5EE',
  },
  radioText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  radioTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  maskedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF9F6',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  maskedValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
    letterSpacing: 1,
  },
  inlineChangeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    flexShrink: 0,
  },
  inlineChangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  halfField: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 130,
    flexShrink: 1,
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cancelLink: {
    fontSize: 11.5,
    color: colors.primary,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  savedBankCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: 14,
  },
  bankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bankCardBankName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  bankCardAccount: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bankCardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bankCardSub: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5EE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7D7C1',
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.primary,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  cancelEditBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelEditText: {
    fontSize: 12.5,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpContainer: {
    padding: 24,
    alignItems: 'center',
  },
  otpIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    flexShrink: 0,
  },
  otpTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  otpSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  otpInput: {
    width: '75%',
    minWidth: 180,
    maxWidth: 260,
    backgroundColor: '#FAF9F6',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 20,
  },
  otpActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  otpLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  otpDivider: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

