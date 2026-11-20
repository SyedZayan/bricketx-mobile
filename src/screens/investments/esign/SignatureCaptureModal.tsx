import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { usePostEsignEnvelopesByEnvelopeIdSignatureUploadsPresignMutation } from '../../../api/generated/investorApi';

export type SignatureValue =
  | { method: 'typed'; text: string }
  | { method: 'drawn'; objectKey: string };

interface Props {
  visible: boolean;
  envelopeId: string;
  label: string;
  defaultName: string;
  onCapture: (sig: SignatureValue) => void;
  onClose: () => void;
}

export const SignatureCaptureModal: React.FC<Props> = ({
  visible,
  envelopeId,
  label,
  defaultName,
  onCapture,
  onClose,
}) => {
  const [tab, setTab] = useState<'type' | 'draw' | 'upload'>('type');
  const [typedName, setTypedName] = useState(defaultName || '');
  const [isUploading, setIsUploading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [pickedImageBase64, setPickedImageBase64] = useState<string | null>(null);

  const webViewRef = useRef<any>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const [presignUpload] =
    usePostEsignEnvelopesByEnvelopeIdSignatureUploadsPresignMutation();

  useEffect(() => {
    setTypedName(defaultName || '');
  }, [defaultName, visible]);

  useEffect(() => {
    if (!visible) {
      setInlineError(null);
    }
  }, [visible]);

  const resetAll = () => {
    setPickedImageUri(null);
    setPickedImageBase64(null);
    setHasDrawn(false);
    setInlineError(null);
  };

  const uploadSignatureBinary = async (base64Data: string): Promise<string> => {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const sizeBytes = Math.ceil((cleanBase64.length * 3) / 4);

    const presigned = await presignUpload({
      envelopeId,
      body: { mimeType: 'image/png', sizeBytes },
    }).unwrap();

    const tempFileUri = `${FileSystem.cacheDirectory}sig_upload_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(tempFileUri, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const uploadRes = await FileSystem.uploadAsync(presigned.uploadUrl, tempFileUri, {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': 'image/png',
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    if (uploadRes.status !== 200) {
      throw new Error(`Upload failed with HTTP ${uploadRes.status}`);
    }

    return presigned.objectKey;
  };

  const handleApplyTyped = () => {
    setInlineError(null);
    const trimmed = typedName.trim();
    if (!trimmed) {
      setInlineError('Please enter your legal name to adopt a typed signature.');
      return;
    }
    onCapture({ method: 'typed', text: trimmed });
    onClose();
  };

  const handleApplyDrawn = () => {
    setInlineError(null);
    if (!hasDrawn) {
      setInlineError('Please draw your signature on the pad first.');
      return;
    }

    setIsUploading(true);
    webViewRef.current?.injectJavaScript(`
      if (window.exportDrawing) {
        window.exportDrawing();
      }
      true;
    `);
  };

  const handlePickImage = async () => {
    setInlineError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPickedImageUri(asset.uri);
        setPickedImageBase64(asset.base64 || null);
      }
    } catch {
      setInlineError('Could not access photo library on this device.');
    }
  };

  const handleApplyUpload = async () => {
    setInlineError(null);
    if (!pickedImageUri) {
      setInlineError('Please select a signature image to upload.');
      return;
    }

    try {
      setIsUploading(true);
      let base64 = pickedImageBase64;
      if (!base64) {
        base64 = await FileSystem.readAsStringAsync(pickedImageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const objectKey = await uploadSignatureBinary(base64);
      onCapture({ method: 'drawn', objectKey });
      onClose();
    } catch (err: any) {
      setInlineError(err?.message || 'Could not upload signature image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCanvasMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'stroke_detected') {
        setHasDrawn(true);
        setInlineError(null);
      } else if (data.type === 'canvas_export') {
        const dataUrl = data.dataUrl;
        const objectKey = await uploadSignatureBinary(dataUrl);
        setIsUploading(false);
        onCapture({ method: 'drawn', objectKey });
        onClose();
      }
    } catch (err: any) {
      setIsUploading(false);
      setInlineError(err?.message || 'Failed to upload drawn signature.');
    }
  };

  const drawPadHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background-color: #FAF9F6; width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
          canvas { width: 100%; height: 100%; touch-action: none; background: #FAF9F6; }
        </style>
      </head>
      <body>
        <canvas id="pad"></canvas>
        <script>
          var canvas = document.getElementById('pad');
          var ctx = canvas.getContext('2d');
          var drawing = false;
          var hasStroke = false;

          function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#1A1815';
          }
          window.addEventListener('resize', resize);
          resize();

          function start(e) {
            e.preventDefault();
            drawing = true;
            var pt = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
          }
          function move(e) {
            if (!drawing) return;
            e.preventDefault();
            var pt = getPos(e);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
            if (!hasStroke) {
              hasStroke = true;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'stroke_detected' }));
            }
          }
          function end() {
            drawing = false;
          }
          function getPos(e) {
            var clientX = e.clientX || (e.touches && e.touches[0].clientX);
            var clientY = e.clientY || (e.touches && e.touches[0].clientY);
            return { x: clientX, y: clientY };
          }

          canvas.addEventListener('touchstart', start, { passive: false });
          canvas.addEventListener('touchmove', move, { passive: false });
          canvas.addEventListener('touchend', end);

          window.clearCanvas = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasStroke = false;
          };

          window.exportDrawing = function() {
            var dataUrl = canvas.toDataURL('image/png');
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'canvas_export', dataUrl: dataUrl }));
          };
        </script>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title} numberOfLines={2}>
                {label}
              </Text>
              <Text style={styles.subtitle}>Choose how you want to sign the agreement</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {inlineError && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={16}
                color={colors.error}
                style={{ flexShrink: 0 }}
              />
              <Text style={styles.errorBannerText}>{inlineError}</Text>
            </View>
          )}

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'type' && styles.tabItemActive]}
              onPress={() => {
                setTab('type');
                resetAll();
              }}
            >
              <Ionicons
                name="text"
                size={14}
                color={tab === 'type' ? colors.primary : colors.textMuted}
                style={{ flexShrink: 0 }}
              />
              <Text
                style={[styles.tabText, tab === 'type' && styles.tabTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Type
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, tab === 'draw' && styles.tabItemActive]}
              onPress={() => {
                setTab('draw');
                resetAll();
              }}
            >
              <Ionicons
                name="brush"
                size={14}
                color={tab === 'draw' ? colors.primary : colors.textMuted}
                style={{ flexShrink: 0 }}
              />
              <Text
                style={[styles.tabText, tab === 'draw' && styles.tabTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Draw
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, tab === 'upload' && styles.tabItemActive]}
              onPress={() => {
                setTab('upload');
                resetAll();
              }}
            >
              <Ionicons
                name="cloud-upload"
                size={14}
                color={tab === 'upload' ? colors.primary : colors.textMuted}
                style={{ flexShrink: 0 }}
              />
              <Text
                style={[styles.tabText, tab === 'upload' && styles.tabTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Upload
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {tab === 'type' && (
              <View style={styles.body}>
                <Text style={styles.sub}>Type your legal name as on your passport / ID:</Text>
                <TextInput
                  style={styles.input}
                  value={typedName}
                  onChangeText={(v) => {
                    setTypedName(v);
                    if (inlineError) setInlineError(null);
                  }}
                  placeholder="e.g. Syed Zayan Ali"
                  placeholderTextColor={colors.textMuted}
                />

                <View style={styles.cursivePreviewBox}>
                  <Text
                    style={styles.cursiveSignatureText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    {typedName.trim() || 'Your Signature'}
                  </Text>
                  <View style={styles.signatureBaseline} />
                  <Text style={styles.attestationNote}>
                    Digitally attested via BricketX Agreement Ledger
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleApplyTyped}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText} numberOfLines={2}>
                    Adopt Typed Signature
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#FFFFFF"
                    style={{ flexShrink: 0 }}
                  />
                </TouchableOpacity>
              </View>
            )}

            {tab === 'draw' && (
              <View style={styles.body}>
                <View style={styles.drawHeaderRow}>
                  <Text style={styles.sub}>Draw your signature on the pad:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      webViewRef.current?.injectJavaScript('window.clearCanvas(); true;');
                      setHasDrawn(false);
                    }}
                  >
                    <Text style={styles.clearText}>Clear Pad</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.drawCanvasContainer}>
                  <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: drawPadHtml }}
                    style={styles.drawWebView}
                    onMessage={handleCanvasMessage}
                    scrollEnabled={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (!hasDrawn || isUploading) && styles.primaryBtnDisabled]}
                  onPress={handleApplyDrawn}
                  disabled={!hasDrawn || isUploading}
                  activeOpacity={0.85}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText} numberOfLines={2}>
                        Adopt Drawn Signature
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#FFFFFF"
                        style={{ flexShrink: 0 }}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {tab === 'upload' && (
              <View style={styles.body}>
                <Text style={styles.sub}>Upload a photo of your signature (PNG / JPEG):</Text>

                {pickedImageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: pickedImageUri }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                    <TouchableOpacity style={styles.changeImageBtn} onPress={handlePickImage}>
                      <Ionicons
                        name="refresh-outline"
                        size={14}
                        color={colors.primary}
                        style={{ flexShrink: 0 }}
                      />
                      <Text style={styles.changeImageText} numberOfLines={1}>
                        Choose Different Image
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadPlaceholder}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="image-outline" size={32} color={colors.primary} />
                    <Text style={styles.uploadPlaceholderTitle}>Select Signature Image</Text>
                    <Text style={styles.uploadPlaceholderSub}>PNG, JPEG or WebP up to 2MB</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, (!pickedImageUri || isUploading) && styles.primaryBtnDisabled]}
                  onPress={handleApplyUpload}
                  disabled={!pickedImageUri || isUploading}
                  activeOpacity={0.85}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText} numberOfLines={2}>
                        Adopt Uploaded Signature
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#FFFFFF"
                        style={{ flexShrink: 0 }}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 24, 21, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.error,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tabText: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textMuted,
    flexShrink: 1,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  bodyScroll: {
    flexGrow: 0,
  },
  body: {
    marginBottom: 4,
  },
  sub: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 14,
  },
  cursivePreviewBox: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cursiveSignatureText: {
    fontFamily: Platform.select({ ios: 'Snell Roundhand', android: 'serif' }),
    fontStyle: 'italic',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.8,
  },
  signatureBaseline: {
    width: '82%',
    height: 1,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginBottom: 6,
  },
  attestationNote: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  drawHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  clearText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
    flexShrink: 0,
  },
  drawCanvasContainer: {
    height: 145,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: '#FAF9F6',
    marginBottom: 16,
  },
  drawWebView: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  uploadPlaceholder: {
    height: 135,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 4,
  },
  uploadPlaceholderTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  uploadPlaceholderSub: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    height: 135,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 8,
  },
  previewImage: {
    width: '100%',
    height: 85,
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  changeImageText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});
