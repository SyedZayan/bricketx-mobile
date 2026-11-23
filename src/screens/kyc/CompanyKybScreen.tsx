import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { KycStackParamList } from '../../navigation/types';
import {
  usePutKycMeCompanyMutation,
  useGetKycMeQuery,
} from '../../api/generated/investorApi';
import {
  LATIN_NAME_MESSAGE,
  latinNameError,
  toCountryCode,
  isCountryCode,
  toDateInputValue,
  cleanPercentage,
  AMOUNT_PATTERN,
  getKycErrorMessage,
} from '../../features/kyc/kycUtils';
import { TextField } from '../../components/ui/TextField';
import { CountryPickerField } from '../../components/ui/CountryPickerModal';
import { Button } from '../../components/ui/Button';
import { InlineErrorBanner } from '../../components/common/InlineErrorBanner';
import { normalizeError } from '../../utils/errorHandler';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<KycStackParamList, 'CompanyKyb'>;

interface DirectorRow {
  id?: string;
  fullName: string;
  nationality: string;
  designation: string;
  isAuthorizedSignatory: boolean;
}

interface UboRow {
  id?: string;
  fullName: string;
  nationality: string;
  ownershipPercentage: string;
  isPep: boolean;
}

interface BeneficialOwnerRow {
  id?: string;
  fullName: string;
  nationality: string;
  relationship: string;
}

export const CompanyKybScreen: React.FC<Props> = ({ navigation }) => {
  const { data: kycData } = useGetKycMeQuery(undefined);
  const [putCompany, { isLoading }] = usePutKycMeCompanyMutation();

  const company = kycData?.companyKyc;
  const actingOnBehalf = Boolean(kycData?.kycProfile?.actingOnBehalf);

  const [companyName, setCompanyName] = useState(company?.companyName || '');
  const [regNumber, setRegNumber] = useState(company?.regNumber || '');
  const [jurisdiction, setJurisdiction] = useState(
    toCountryCode(company?.jurisdiction)
  );
  const [incorporationDate, setIncorporationDate] = useState(
    toDateInputValue(company?.incorporationDate)
  );
  const [natureOfBusiness, setNatureOfBusiness] = useState(
    company?.natureOfBusiness || ''
  );
  const [registeredAddress, setRegisteredAddress] = useState(
    company?.registeredAddress || ''
  );
  const [taxId, setTaxId] = useState(company?.taxId || '');

  const [bankName, setBankName] = useState(
    (company?.bankDetails?.bankName as string) || ''
  );
  const [accountNumber, setAccountNumber] = useState(
    (company?.bankDetails?.accountNumber as string) || ''
  );
  const [iban, setIban] = useState((company?.bankDetails?.iban as string) || '');

  const [directors, setDirectors] = useState<DirectorRow[]>(
    company?.directors?.length
      ? company.directors.map((d) => ({
          id: d.id,
          fullName: d.fullName,
          nationality: toCountryCode(d.nationality),
          designation: d.designation || '',
          isAuthorizedSignatory: d.isAuthorizedSignatory,
        }))
      : [
          {
            fullName: '',
            nationality: '',
            designation: '',
            isAuthorizedSignatory: true,
          },
        ]
  );

  const [uboRecords, setUboRecords] = useState<UboRow[]>(
    company?.uboRecords?.length
      ? company.uboRecords.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          nationality: toCountryCode(u.nationality),
          ownershipPercentage: u.ownershipPercentage || '',
          isPep: u.isPep,
        }))
      : []
  );

  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwnerRow[]>(
    company?.beneficialOwners?.length
      ? company.beneficialOwners.map((b) => ({
          id: b.id,
          fullName: b.fullName,
          nationality: toCountryCode(b.nationality),
          relationship: b.relationship || '',
        }))
      : actingOnBehalf
        ? [{ fullName: '', nationality: '', relationship: '' }]
        : []
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);

  useEffect(() => {
    if (!company) return;
    setCompanyName(company.companyName || '');
    setRegNumber(company.regNumber || '');
    setJurisdiction(toCountryCode(company.jurisdiction));
    setIncorporationDate(toDateInputValue(company.incorporationDate));
    setNatureOfBusiness(company.natureOfBusiness || '');
    setRegisteredAddress(company.registeredAddress || '');
    setTaxId(company.taxId || '');
    setBankName((company.bankDetails?.bankName as string) || '');
    setAccountNumber((company.bankDetails?.accountNumber as string) || '');
    setIban((company.bankDetails?.iban as string) || '');
    if (company.directors?.length) {
      setDirectors(
        company.directors.map((d) => ({
          id: d.id,
          fullName: d.fullName,
          nationality: toCountryCode(d.nationality),
          designation: d.designation || '',
          isAuthorizedSignatory: d.isAuthorizedSignatory,
        }))
      );
    }
    if (company.uboRecords) {
      setUboRecords(
        company.uboRecords.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          nationality: toCountryCode(u.nationality),
          ownershipPercentage: u.ownershipPercentage || '',
          isPep: u.isPep,
        }))
      );
    }
    if (company.beneficialOwners) {
      setBeneficialOwners(
        company.beneficialOwners.map((b) => ({
          id: b.id,
          fullName: b.fullName,
          nationality: toCountryCode(b.nationality),
          relationship: b.relationship || '',
        }))
      );
    }
  }, [company]);

  const handleContinue = async () => {
    setErrorMessage(null);
    setRawError(null);

    if (!companyName.trim()) {
      setErrorMessage('Registered company name is required.');
      return;
    }
    if (latinNameError(companyName)) {
      setErrorMessage(LATIN_NAME_MESSAGE);
      return;
    }
    if (!regNumber.trim()) {
      setErrorMessage('Registration / Trade License number is required.');
      return;
    }
    if (!isCountryCode(jurisdiction)) {
      setErrorMessage('Select the jurisdiction of incorporation.');
      return;
    }
    if (!registeredAddress.trim()) {
      setErrorMessage('Registered corporate address is required.');
      return;
    }
    if (
      incorporationDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(toDateInputValue(incorporationDate))
    ) {
      setErrorMessage('Incorporation date must be in YYYY-MM-DD format.');
      return;
    }

    if (directors.length === 0 || directors.some((d) => !d.fullName.trim())) {
      setErrorMessage('At least one director with a full name is required.');
      return;
    }
    if (directors.some((d) => latinNameError(d.fullName))) {
      setErrorMessage(`Director name: ${LATIN_NAME_MESSAGE}`);
      return;
    }

    for (const u of uboRecords) {
      const hasOther =
        toCountryCode(u.nationality) || u.ownershipPercentage.trim() || u.isPep;
      if (!u.fullName.trim() && hasOther) {
        setErrorMessage('Each UBO record with details must have a full name.');
        return;
      }
      if (latinNameError(u.fullName)) {
        setErrorMessage(`UBO name: ${LATIN_NAME_MESSAGE}`);
        return;
      }
      if (
        u.fullName.trim() &&
        u.ownershipPercentage.trim() &&
        !AMOUNT_PATTERN.test(cleanPercentage(u.ownershipPercentage))
      ) {
        setErrorMessage(
          'Ownership share must be a number with up to two decimals (e.g. 25 or 12.5).'
        );
        return;
      }
    }

    if (actingOnBehalf) {
      if (
        beneficialOwners.length === 0 ||
        beneficialOwners.some((b) => !b.fullName.trim())
      ) {
        setErrorMessage(
          'Since you are acting on behalf of the company, add at least one beneficial owner.'
        );
        return;
      }
      if (beneficialOwners.some((b) => latinNameError(b.fullName))) {
        setErrorMessage(`Beneficial owner name: ${LATIN_NAME_MESSAGE}`);
        return;
      }
    }

    const bankDetails =
      bankName.trim() || accountNumber.trim() || iban.trim()
        ? {
            ...(bankName.trim() ? { bankName: bankName.trim() } : {}),
            ...(accountNumber.trim()
              ? { accountNumber: accountNumber.trim() }
              : {}),
            ...(iban.trim() ? { iban: iban.trim() } : {}),
          }
        : undefined;

    try {
      await putCompany({
        body: {
          companyName: companyName.trim(),
          regNumber: regNumber.trim(),
          jurisdiction: toCountryCode(jurisdiction),
          registeredAddress: registeredAddress.trim(),
          ...(incorporationDate.trim()
            ? { incorporationDate: toDateInputValue(incorporationDate) }
            : {}),
          ...(natureOfBusiness.trim()
            ? { natureOfBusiness: natureOfBusiness.trim() }
            : {}),
          ...(taxId.trim() ? { taxId: taxId.trim() } : {}),
          ...(bankDetails ? { bankDetails } : {}),
          directors: directors.map((d) => ({
            ...(d.id ? { id: d.id } : {}),
            fullName: d.fullName.trim(),
            ...(toCountryCode(d.nationality)
              ? { nationality: toCountryCode(d.nationality) }
              : {}),
            ...(d.designation.trim()
              ? { designation: d.designation.trim() }
              : {}),
            isAuthorizedSignatory: d.isAuthorizedSignatory,
          })),
          uboRecords: uboRecords
            .filter((u) => u.fullName.trim())
            .map((u) => ({
              ...(u.id ? { id: u.id } : {}),
              fullName: u.fullName.trim(),
              ...(toCountryCode(u.nationality)
                ? { nationality: toCountryCode(u.nationality) }
                : {}),
              ...(u.ownershipPercentage.trim()
                ? { ownershipPercentage: cleanPercentage(u.ownershipPercentage) }
                : {}),
              isPep: u.isPep,
            })),
          ...(actingOnBehalf
            ? {
                beneficialOwners: beneficialOwners
                  .filter((b) => b.fullName.trim())
                  .map((b) => ({
                    ...(b.id ? { id: b.id } : {}),
                    fullName: b.fullName.trim(),
                    ...(toCountryCode(b.nationality)
                      ? { nationality: toCountryCode(b.nationality) }
                      : {}),
                    ...(b.relationship.trim()
                      ? { relationship: b.relationship.trim() }
                      : {}),
                  })),
              }
            : {}),
        },
      }).unwrap();

      navigation.navigate('IdentityDocs');
    } catch (err: any) {
      setRawError(err);
      setErrorMessage(
        getKycErrorMessage(err, 'Failed to save company information.')
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'android' ? 120 : 64}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stepHeader}>
        <Text style={styles.stepBadge}>STEP 3 OF 6</Text>
        <Text style={styles.title}>Corporate Verification (KYB)</Text>
        <Text style={styles.subtitle}>
          Enter corporate registration details, directors, and ultimate beneficial owners.
        </Text>
      </View>
        {!!errorMessage && (
          <InlineErrorBanner
            error={rawError}
            appError={{
              ...normalizeError(rawError, { defaultMessage: errorMessage }),
              message: errorMessage,
            }}
            onDismiss={() => {
              setErrorMessage(null);
              setRawError(null);
            }}
          />
        )}

      {/* Company Information */}
      <View style={styles.formCard}>
        <Text style={styles.cardHeading}>Company Details</Text>

        <TextField
          label="Registered Entity Name *"
          placeholder="e.g. BricketX Investments Ltd"
          value={companyName}
          onChangeText={setCompanyName}
          maxLength={200}
          hint={LATIN_NAME_MESSAGE}
          error={latinNameError(companyName)}
        />

        <TextField
          label="Registration / Trade License Number *"
          placeholder="e.g. CR-982341"
          value={regNumber}
          onChangeText={setRegNumber}
          maxLength={100}
        />

        <CountryPickerField
          label="Jurisdiction / Country of Incorporation *"
          placeholder="Select jurisdiction"
          value={jurisdiction}
          onChange={setJurisdiction}
        />

        <TextField
          label="Incorporation Date (YYYY-MM-DD) (Optional)"
          placeholder="2020-01-15"
          value={incorporationDate}
          onChangeText={setIncorporationDate}
          maxLength={10}
        />

        <TextField
          label="Registered Corporate Address *"
          placeholder="Official legal registered address"
          value={registeredAddress}
          onChangeText={setRegisteredAddress}
          multiline
          numberOfLines={3}
        />

        <TextField
          label="Nature of Business (Optional)"
          placeholder="e.g. Asset Management, Commercial Real Estate"
          value={natureOfBusiness}
          onChangeText={setNatureOfBusiness}
          maxLength={200}
        />

        <TextField
          label="Corporate Tax ID / TRN (Optional)"
          placeholder="e.g. Tax registration number"
          value={taxId}
          onChangeText={setTaxId}
          maxLength={50}
        />
      </View>

      {/* Optional Bank Details */}
      <View style={styles.formCard}>
        <Text style={styles.cardHeading}>Corporate Bank Details (Optional)</Text>
        <TextField
          label="Bank Name"
          placeholder="e.g. Emirates NBD"
          value={bankName}
          onChangeText={setBankName}
        />
        <TextField
          label="Account Number"
          placeholder="Account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />
        <TextField
          label="IBAN"
          placeholder="AE070331234567890123456"
          value={iban}
          onChangeText={setIban}
          autoCapitalize="characters"
        />
      </View>

      {/* Directors (Required >= 1) */}
      <View style={styles.formCard}>
        <Text style={styles.cardHeading}>Directors *</Text>
        <Text style={styles.cardSub}>
          At least one director is required. Identity & address documents will be requested for each director in the next step.
        </Text>

        {directors.map((row, idx) => (
          <View key={idx} style={styles.repeatItem}>
            <View style={styles.repeatHeader}>
              <Text style={styles.repeatTitle}>Director #{idx + 1}</Text>
              {directors.length > 1 && (
                <TouchableOpacity
                  onPress={() =>
                    setDirectors((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextField
              label="Full Name *"
              placeholder="Full legal name"
              value={row.fullName}
              onChangeText={(val) =>
                setDirectors((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, fullName: val } : r))
                )
              }
              maxLength={200}
              error={latinNameError(row.fullName)}
            />

            <CountryPickerField
              label="Nationality"
              placeholder="Select nationality"
              clearable
              value={row.nationality}
              onChange={(code) =>
                setDirectors((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, nationality: code } : r))
                )
              }
            />

            <TextField
              label="Designation"
              placeholder="e.g. Managing Director"
              value={row.designation}
              onChangeText={(val) =>
                setDirectors((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, designation: val } : r))
                )
              }
              maxLength={100}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Authorized Signatory</Text>
              <Switch
                value={row.isAuthorizedSignatory}
                onValueChange={(val) =>
                  setDirectors((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, isAuthorizedSignatory: val } : r
                    )
                  )
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addRowBtn}
          onPress={() =>
            setDirectors((prev) => [
              ...prev,
              {
                fullName: '',
                nationality: '',
                designation: '',
                isAuthorizedSignatory: false,
              },
            ])
          }
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.addRowText}>Add Another Director</Text>
        </TouchableOpacity>
      </View>

      {/* Ultimate Beneficial Owners (Optional) */}
      <View style={styles.formCard}>
        <Text style={styles.cardHeading}>
          Ultimate Beneficial Owners (UBOs) (Optional)
        </Text>
        <Text style={styles.cardSub}>
          Individuals owning or controlling 25% or more of the company.
        </Text>

        {uboRecords.map((row, idx) => (
          <View key={idx} style={styles.repeatItem}>
            <View style={styles.repeatHeader}>
              <Text style={styles.repeatTitle}>UBO #{idx + 1}</Text>
              <TouchableOpacity
                onPress={() =>
                  setUboRecords((prev) => prev.filter((_, i) => i !== idx))
                }
              >
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <TextField
              label="Full Name *"
              placeholder="Full legal name"
              value={row.fullName}
              onChangeText={(val) =>
                setUboRecords((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, fullName: val } : r))
                )
              }
              maxLength={200}
              error={latinNameError(row.fullName)}
            />

            <CountryPickerField
              label="Nationality"
              placeholder="Select nationality"
              clearable
              value={row.nationality}
              onChange={(code) =>
                setUboRecords((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, nationality: code } : r))
                )
              }
            />

            <TextField
              label="Ownership Percentage (%)"
              placeholder="e.g. 50"
              value={row.ownershipPercentage}
              onChangeText={(val) =>
                setUboRecords((prev) =>
                  prev.map((r, i) =>
                    i === idx ? { ...r, ownershipPercentage: val } : r
                  )
                )
              }
              keyboardType="decimal-pad"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Politically Exposed Person (PEP)</Text>
              <Switch
                value={row.isPep}
                onValueChange={(val) =>
                  setUboRecords((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, isPep: val } : r))
                  )
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addRowBtn}
          onPress={() =>
            setUboRecords((prev) => [
              ...prev,
              {
                fullName: '',
                nationality: '',
                ownershipPercentage: '',
                isPep: false,
              },
            ])
          }
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.addRowText}>Add UBO Record</Text>
        </TouchableOpacity>
      </View>

      {/* Beneficial Owners when Acting on Behalf */}
      {actingOnBehalf && (
        <View style={styles.formCard}>
          <Text style={styles.cardHeading}>
            Beneficial Owners (Acting on Behalf) *
          </Text>
          {beneficialOwners.map((row, idx) => (
            <View key={idx} style={styles.repeatItem}>
              <View style={styles.repeatHeader}>
                <Text style={styles.repeatTitle}>Beneficial Owner #{idx + 1}</Text>
                {beneficialOwners.length > 1 && (
                  <TouchableOpacity
                    onPress={() =>
                      setBeneficialOwners((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextField
                label="Full Name *"
                placeholder="Full legal name"
                value={row.fullName}
                onChangeText={(val) =>
                  setBeneficialOwners((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, fullName: val } : r))
                  )
                }
                maxLength={200}
                error={latinNameError(row.fullName)}
              />

              <CountryPickerField
                label="Nationality"
                placeholder="Select nationality"
                clearable
                value={row.nationality}
                onChange={(code) =>
                  setBeneficialOwners((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, nationality: code } : r
                    )
                  )
                }
              />

              <TextField
                label="Relationship / Capacity"
                placeholder="e.g. Trust Beneficiary, Parent Entity"
                value={row.relationship}
                onChangeText={(val) =>
                  setBeneficialOwners((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, relationship: val } : r
                    )
                  )
                }
                maxLength={100}
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.addRowBtn}
            onPress={() =>
              setBeneficialOwners((prev) => [
                ...prev,
                { fullName: '', nationality: '', relationship: '' },
              ])
            }
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addRowText}>Add Beneficial Owner</Text>
          </TouchableOpacity>
        </View>
      )}

      <Button
        title="Save & Continue"
        onPress={handleContinue}
        loading={isLoading}
        style={styles.submitBtn}
      />
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  stepHeader: {
    marginBottom: spacing.md,
  },
  stepBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    padding: spacing.sm,
    borderRadius: spacing.radiusSm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  repeatItem: {
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  repeatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  repeatTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  removeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.error,
    textDecorationLine: 'underline',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: 8,
  },
  addRowText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
});
