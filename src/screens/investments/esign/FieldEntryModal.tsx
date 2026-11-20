import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { EsignField } from '../../../api/generated/investorApi';

interface Props {
  visible: boolean;
  field: EsignField | null;
  currentValue: string;
  hasNext: boolean;
  onSave: (fieldId: string, value: string) => void;
  onNext: () => void;
  onClose: () => void;
}

export const FieldEntryModal: React.FC<Props> = ({
  visible,
  field,
  currentValue,
  hasNext,
  onSave,
  onNext,
  onClose,
}) => {
  const [val, setVal] = useState(currentValue);

  useEffect(() => {
    setVal(currentValue);
  }, [currentValue, field]);

  if (!field) return null;

  const label = field.label || field.type.replace('_', ' ').toUpperCase();
  const isCheckbox = field.type === 'checkbox';

  const handleSaveOnly = () => {
    onSave(field.id, val);
    onClose();
  };

  const handleSaveAndNext = () => {
    onSave(field.id, val);
    onNext();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.kicker} numberOfLines={1}>
                Page {field.page} Agreement Field
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {label}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {isCheckbox ? (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setVal(val === 'true' ? 'false' : 'true')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={val === 'true' ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={colors.primary}
                  style={{ flexShrink: 0 }}
                />
                <Text style={styles.checkboxLabel}>Check this box to confirm</Text>
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.input}
                value={val}
                onChangeText={setVal}
                placeholder={`Enter ${label.toLowerCase()}`}
                placeholderTextColor="#A8A29E"
                autoFocus
                keyboardType={
                  field.type === 'email'
                    ? 'email-address'
                    : field.type === 'date_signed'
                    ? 'numbers-and-punctuation'
                    : 'default'
                }
                autoCapitalize={field.type === 'email' ? 'none' : 'words'}
              />
            )}
            <Text style={styles.fieldHelp}>
              This value prints directly onto the Master Participation Agreement.
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleSaveOnly}>
              <Text style={styles.secondaryBtnText} numberOfLines={1}>
                Done
              </Text>
            </TouchableOpacity>

            {hasNext && (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAndNext}>
                <Text style={styles.primaryBtnText} numberOfLines={1}>
                  Next Field
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ flexShrink: 0 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  closeBtn: {
    flexShrink: 0,
  },
  kicker: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  body: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F8F7F4',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkboxLabel: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
    fontWeight: '600',
  },
  fieldHelp: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F4',
    minWidth: 0,
    flexShrink: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    minWidth: 0,
    flexShrink: 1,
  },
  primaryBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
});
