import React, { useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { tokenMemory } from '../../../api/tokenMemory';
import { EsignField } from '../../../api/generated/investorApi';
import { SignatureValue } from './SignatureCaptureModal';

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

export interface AgreementViewerHandle {
  scrollToPage: (page: number) => void;
}

interface Props {
  envelopeId: string;
  pdfUrl?: string;
  fields: EsignField[];
  fieldValues: Record<string, string>;
  presentRoles?: string[];
  signaturesByFieldId?: Record<string, SignatureValue>;
  hasScrolledToEnd: boolean;
  requiresWitnessNameFirst?: boolean;
  onRequireWitnessName?: () => void;
  onPageChange?: (page: number, total: number) => void;
  onReachEnd: () => void;
  onOpenDetails: () => void;
  onTapField: (field: EsignField) => void;
  onTapSignature: (fieldId?: string) => void;
}

export const AgreementDocumentViewer = forwardRef<AgreementViewerHandle, Props>(
  (
    {
      envelopeId,
      pdfUrl,
      fields,
      fieldValues,
      presentRoles = ['investor'],
      signaturesByFieldId = {},
      hasScrolledToEnd,
      requiresWitnessNameFirst = false,
      onRequireWitnessName,
      onPageChange,
      onReachEnd,
      onOpenDetails,
      onTapField,
      onTapSignature,
    },
    ref
  ) => {
    const webViewRef = useRef<any>(null);
    const [localBase64, setLocalBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(15);

    const latestPropsRef = useRef({
      fields,
      fieldValues,
      signaturesByFieldId,
      presentRoles,
      requiresWitnessNameFirst,
    });
    latestPropsRef.current = {
      fields,
      fieldValues,
      signaturesByFieldId,
      presentRoles,
      requiresWitnessNameFirst,
    };

    const triggerScrollToPage = (pageNum: number) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (window.scrollToPage) {
            window.scrollToPage(${pageNum});
          }
          true;
        `);
      }
      if (pageNum >= totalPages && !hasScrolledToEnd) {
        onReachEnd();
      }
    };

    useImperativeHandle(ref, () => ({
      scrollToPage: triggerScrollToPage,
    }));

    const loadDocument = async () => {
      if (!envelopeId) return;

      try {
        setLoading(true);
        setErrorMsg(null);

        const targetUrl =
          pdfUrl && pdfUrl.startsWith('http')
            ? pdfUrl
            : `${process.env.EXPO_PUBLIC_API_URL}/esign/envelopes/${envelopeId}/preview`;

        const headers: Record<string, string> = {
          Accept: 'application/pdf, application/json',
        };

        const token = tokenMemory.getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const basicAuth = process.env.EXPO_PUBLIC_BASIC_AUTH_TOKEN;
        if (basicAuth && !process.env.EXPO_PUBLIC_API_URL?.includes('@')) {
          headers['Proxy-Authorization'] = `Basic ${basicAuth}`;
        }

        const localTarget = `${FileSystem.cacheDirectory}envelope_${envelopeId}.pdf`;

        const downloadRes = await FileSystem.downloadAsync(targetUrl, localTarget, {
          headers,
        });

        if (downloadRes.status !== 200) {
          if (downloadRes.status === 409 || downloadRes.status === 422) {
            throw new Error(
              'Agreement details need confirmation before document preview can be rendered.'
            );
          }

          const textContent = await FileSystem.readAsStringAsync(downloadRes.uri);
          try {
            const json = JSON.parse(textContent);
            if (json?.url) {
              const secondAttempt = await FileSystem.downloadAsync(json.url, localTarget);
              if (secondAttempt.status === 200) {
                const base64 = await FileSystem.readAsStringAsync(secondAttempt.uri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                setLocalBase64(base64);
                setLoading(false);
                return;
              }
            }
          } catch {
            // not json
          }
          throw new Error(`Server returned HTTP ${downloadRes.status}`);
        }

        const base64 = await FileSystem.readAsStringAsync(downloadRes.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setLocalBase64(base64);
        setLoading(false);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to assemble 15-page agreement.');
        setLoading(false);
      }
    };

    useEffect(() => {
      loadDocument();
    }, [envelopeId, pdfUrl]);

    useEffect(() => {
      if (webViewRef.current && localBase64) {
        const serializedFields = JSON.stringify(fields || []);
        const serializedVals = JSON.stringify(fieldValues || {});
        const serializedSigs = JSON.stringify(signaturesByFieldId || {});
        const serializedRoles = JSON.stringify(presentRoles || ['investor']);
        const serializedLocked = JSON.stringify(Boolean(requiresWitnessNameFirst));
        webViewRef.current.injectJavaScript(`
          if (window.syncAgreementState) {
            window.syncAgreementState(${serializedFields}, ${serializedVals}, ${serializedSigs}, ${serializedRoles}, ${serializedLocked});
          }
          true;
        `);
      }
    }, [fields, fieldValues, signaturesByFieldId, presentRoles, requiresWitnessNameFirst, localBase64]);

    const viewerHtml = useMemo(() => {
      const snap = latestPropsRef.current;
      const initFields = JSON.stringify(snap.fields || []);
      const initVals = JSON.stringify(snap.fieldValues || {});
      const initSigs = JSON.stringify(snap.signaturesByFieldId || {});
      const initRoles = JSON.stringify(snap.presentRoles || ['investor']);
      const initLocked = JSON.stringify(Boolean(snap.requiresWitnessNameFirst));

      return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              background-color: #F5F4F0;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 12px 0 96px 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-tap-highlight-color: transparent;
            }
            .page-box {
              position: relative;
              width: 94% !important;
              margin-bottom: 14px;
              box-shadow: 0 2px 12px rgba(33, 33, 33, 0.08);
              border: 1px solid #E5E7EB;
              background: #FFFFFF;
              border-radius: 6px;
              overflow: visible;
            }
            canvas {
              width: 100% !important;
              height: auto !important;
              display: block;
              border-radius: 6px;
            }
            .overlay-layer {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
            }
            .auto-identity-box {
              position: absolute;
              pointer-events: none;
              display: flex;
              align-items: center;
              padding: 0 3px;
              background: rgba(255, 255, 255, 0.92);
            }
            .auto-identity-text {
              font-size: 9.5px;
              font-weight: 700;
              color: #212121;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }
            .edit-hotspot {
              position: absolute;
              pointer-events: auto;
              border: 1px solid #C39967;
              background: rgba(250, 245, 238, 0.95);
              border-radius: 4px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 4px;
              padding: 0 6px;
              z-index: 5;
              overflow: hidden;
            }
            .edit-hotspot.filled {
              border: 1px solid #A5ADB6;
              background: rgba(255, 255, 255, 0.96);
            }
            .hotspot-text {
              font-size: 9px;
              font-weight: 600;
              color: #8C6A3E;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 1;
            }
            .edit-hotspot.filled .hotspot-text {
              color: #212121;
              font-weight: 700;
            }
            .hotspot-edit-tag {
              font-size: 8px;
              font-weight: 700;
              color: #C39967;
              background: #FFFFFF;
              border: 1px solid #DFC7A7;
              padding: 1px 5px;
              border-radius: 3px;
              flex-shrink: 0;
              letter-spacing: 0.2px;
            }
            .edit-hotspot.filled .hotspot-edit-tag {
              color: #212121;
              border-color: #D1D5DB;
            }
            .signature-target {
              position: absolute;
              pointer-events: auto;
              border: 1.5px dashed #C39967;
              background: rgba(250, 245, 238, 0.95);
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2px 6px;
              cursor: pointer;
              z-index: 4;
              overflow: hidden;
            }
            .signature-target.locked {
              border: 1px dashed #A5ADB6;
              background: rgba(245, 244, 240, 0.94);
            }
            .signature-target.signed {
              border: 1px solid #C39967;
              background: rgba(255, 255, 255, 0.97);
            }
            .sig-cta {
              font-size: 8.5px;
              font-weight: 700;
              color: #8C6A3E;
              letter-spacing: 0.2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }
            .signature-target.locked .sig-cta {
              color: #6B7280;
            }
            .sig-cursive-text {
              font-family: Georgia, "Times New Roman", serif;
              font-style: italic;
              font-size: 13px;
              font-weight: 700;
              color: #212121;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 96%;
            }
            .sig-badge-done {
              position: absolute;
              top: 2px;
              right: 4px;
              background: #C39967;
              color: #FFFFFF;
              font-size: 7px;
              font-weight: 700;
              padding: 1px 4px;
              border-radius: 3px;
            }
            .other-signer-box {
              position: absolute;
              border: 1px dashed #D1D5DB;
              background: rgba(249, 250, 251, 0.65);
              border-radius: 3px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 7.5px;
              font-weight: 600;
              color: #A5ADB6;
              pointer-events: none;
              overflow: hidden;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div id="pdf-container" style="width: 100%; display: flex; flex-direction: column; align-items: center;"></div>

          <script>
            var rawBase64 = "${localBase64 || ''}";
            var allFields = ${initFields};
            var currentValues = ${initVals};
            var currentSignatures = ${initSigs};
            var activeRoles = ${initRoles};
            var witnessNameRequiredFirst = ${initLocked};

            window.syncAgreementState = function(newFields, newVals, newSigs, newRoles, isLocked) {
              if (newFields) allFields = newFields;
              currentValues = newVals || {};
              currentSignatures = newSigs || {};
              if (newRoles) activeRoles = newRoles;
              witnessNameRequiredFirst = Boolean(isLocked);
              renderAllOverlays();
            };

            window.scrollToPage = function(pageNum) {
              var targetBox = document.getElementById('page-box-' + pageNum);
              if (targetBox) {
                targetBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            };

            function renderAllOverlays() {
              var layers = document.querySelectorAll('.overlay-layer');
              layers.forEach(function(layer) {
                var pageNum = parseInt(layer.getAttribute('data-page'), 10);
                layer.innerHTML = '';

                var pageFields = allFields.filter(function(f) {
                  return f.page === pageNum;
                });

                pageFields.forEach(function(field) {
                  var signerKey = field.signerKey || 'investor';
                  var isActiveRole = activeRoles.indexOf(signerKey) !== -1;
                  var isSig = field.fillMode === 'signature' || field.type === 'signature';

                  if (isActiveRole && isSig) {
                    var el = document.createElement('div');
                    var sigObj = currentSignatures[field.id];
                    var isSigned = Boolean(sigObj);
                    el.className = 'signature-target ' + (isSigned ? 'signed' : (witnessNameRequiredFirst ? 'locked' : ''));
                    el.style.left = (field.position.xFrac * 100) + '%';
                    el.style.top = (field.position.yFrac * 100) + '%';
                    el.style.width = (field.position.widthFrac * 100) + '%';
                    el.style.height = (field.position.heightFrac * 100) + '%';

                    if (isSigned) {
                      var badge = document.createElement('div');
                      badge.className = 'sig-badge-done';
                      badge.innerText = 'Signed';
                      el.appendChild(badge);

                      var text = document.createElement('div');
                      text.className = 'sig-cursive-text';
                      text.innerText = sigObj.method === 'typed' ? sigObj.text : 'Signed';
                      el.appendChild(text);
                    } else {
                      var cta = document.createElement('div');
                      cta.className = 'sig-cta';
                      if (witnessNameRequiredFirst) {
                        cta.innerText = 'Witness Name Required';
                      } else {
                        cta.innerText = signerKey === 'investor'
                          ? 'Tap to Sign'
                          : 'Tap to Sign (' + (field.label || signerKey) + ')';
                      }
                      el.appendChild(cta);
                    }

                    el.onclick = function(e) {
                      e.stopPropagation();
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'signature_tap',
                        fieldId: field.id
                      }));
                    };
                    layer.appendChild(el);
                    return;
                  }

                  if (field.fillMode === 'auto') {
                    var autoVal = currentValues[field.id] || field.defaultValue || field.value || '';
                    var labelLower = (field.label || field.id || '').toLowerCase();
                    if (autoVal && (labelLower.indexOf('name') !== -1 || labelLower.indexOf('investor') !== -1)) {
                      var autoEl = document.createElement('div');
                      autoEl.className = 'auto-identity-box';
                      autoEl.style.left = (field.position.xFrac * 100) + '%';
                      autoEl.style.top = (field.position.yFrac * 100) + '%';
                      autoEl.style.width = (field.position.widthFrac * 100) + '%';
                      autoEl.style.height = (field.position.heightFrac * 100) + '%';

                      var autoText = document.createElement('div');
                      autoText.className = 'auto-identity-text';
                      autoText.innerText = autoVal;
                      autoEl.appendChild(autoText);
                      layer.appendChild(autoEl);
                    }
                    return;
                  }

                  if (isActiveRole && field.fillMode === 'signer_entered') {
                    var enteredVal = currentValues[field.id];
                    var el = document.createElement('div');
                    el.className = 'edit-hotspot ' + (enteredVal ? 'filled' : '');
                    el.style.left = (field.position.xFrac * 100) + '%';
                    el.style.top = (field.position.yFrac * 100) + '%';
                    el.style.width = (field.position.widthFrac * 100) + '%';
                    el.style.height = (field.position.heightFrac * 100) + '%';

                    var labelEl = document.createElement('div');
                    labelEl.className = 'hotspot-text';
                    labelEl.innerText = enteredVal ? enteredVal : (field.label || 'Enter');
                    el.appendChild(labelEl);

                    var chip = document.createElement('div');
                    chip.className = 'hotspot-edit-tag';
                    chip.innerText = enteredVal ? 'Edit' : 'Fill';
                    el.appendChild(chip);

                    el.onclick = function(e) {
                      e.stopPropagation();
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'field_tap',
                        fieldId: field.id
                      }));
                    };
                    layer.appendChild(el);
                    return;
                  }

                  if (!isActiveRole) {
                    var el = document.createElement('div');
                    el.className = 'other-signer-box';
                    el.style.left = (field.position.xFrac * 100) + '%';
                    el.style.top = (field.position.yFrac * 100) + '%';
                    el.style.width = (field.position.widthFrac * 100) + '%';
                    el.style.height = (field.position.heightFrac * 100) + '%';
                    el.innerText = field.label || signerKey;
                    layer.appendChild(el);
                  }
                });
              });
            }

            if (rawBase64) {
              try {
                var rawBytes = atob(rawBase64);
                var uint8Array = new Uint8Array(rawBytes.length);
                for (var i = 0; i < rawBytes.length; i++) {
                  uint8Array[i] = rawBytes.charCodeAt(i);
                }

                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

                pdfjsLib.getDocument({ data: uint8Array }).promise.then(function(pdf) {
                  var container = document.getElementById('pdf-container');
                  var totalPages = pdf.numPages;
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'page_info', total: totalPages }));

                  function renderPage(pageNum) {
                    pdf.getPage(pageNum).then(function(page) {
                      var viewport = page.getViewport({ scale: 1.5 });

                      var pageBox = document.createElement('div');
                      pageBox.className = 'page-box';
                      pageBox.id = 'page-box-' + pageNum;

                      var canvas = document.createElement('canvas');
                      var ctx = canvas.getContext('2d');
                      canvas.height = viewport.height;
                      canvas.width = viewport.width;

                      var overlayLayer = document.createElement('div');
                      overlayLayer.className = 'overlay-layer';
                      overlayLayer.setAttribute('data-page', pageNum);

                      pageBox.appendChild(canvas);
                      pageBox.appendChild(overlayLayer);
                      container.appendChild(pageBox);

                      var renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                      };

                      page.render(renderContext).promise.then(function() {
                        if (pageNum < totalPages) {
                          renderPage(pageNum + 1);
                        } else {
                          renderAllOverlays();
                        }
                      });
                    });
                  }
                  renderPage(1);
                }).catch(function(err) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
                });
              } catch(e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
              }
            }

            window.addEventListener('scroll', function() {
              var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
              if (scrollHeight > 0) {
                var progress = window.scrollY / scrollHeight;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', progress: progress }));
              }
            });
          </script>
        </body>
      </html>
      `;
    }, [localBase64]);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'scroll') {
          const progress = data.progress;
          const page = Math.min(totalPages, Math.max(1, Math.round(progress * (totalPages - 1)) + 1));
          setCurrentPage(page);
          onPageChange?.(page, totalPages);

          if (progress > 0.85 && !hasScrolledToEnd) {
            onReachEnd();
          }
        } else if (data.type === 'page_info') {
          if (data.total) {
            setTotalPages(data.total);
            onPageChange?.(1, data.total);
          }
        } else if (data.type === 'signature_tap') {
          if (requiresWitnessNameFirst) {
            onRequireWitnessName?.();
            return;
          }
          onTapSignature(data.fieldId);
        } else if (data.type === 'field_tap') {
          const field = fields.find((f) => f.id === data.fieldId);
          if (field) {
            onTapField(field);
          }
        } else if (data.type === 'error') {
          setErrorMsg(data.message);
        }
      } catch {
        // ignore
      }
    };

    const isOnFinalPage = currentPage >= totalPages || hasScrolledToEnd;
    const activeSigFields = fields.filter(
      (f) =>
        presentRoles.includes(f.signerKey || 'investor') &&
        (f.fillMode === 'signature' || f.type === 'signature')
    );
    const nextUnsignedSig = activeSigFields.find((f) => !signaturesByFieldId[f.id]);

    return (
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={BRAND.gold} />
            <Text style={styles.loadingTitle} numberOfLines={2}>
              Loading Agreement Document
            </Text>
            <Text style={styles.loadingText}>
              Assembling 15-page contract terms, statutory clauses, and signature targets...
            </Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.centerBox}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="alert-circle-outline" size={34} color={BRAND.charcoal} />
            </View>
            <Text style={styles.errorTitle} numberOfLines={2}>
              Preview Not Ready
            </Text>
            <Text style={styles.errorSub}>{errorMsg}</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={onOpenDetails}
                activeOpacity={0.85}
              >
                <Text style={styles.detailsBtnText} numberOfLines={2}>
                  Review Profile Details
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={loadDocument}
                activeOpacity={0.85}
              >
                <Text style={styles.retryBtnText} numberOfLines={2}>
                  Retry Preview
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: viewerHtml }}
              style={styles.webview}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
            />

            <View style={styles.floatingHud} pointerEvents="box-none">
              <View style={styles.pagePill}>
                <Ionicons name="document-text-outline" size={14} color={BRAND.charcoal} style={{ flexShrink: 0 }} />
                <Text style={styles.pagePillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  Page {currentPage} of {totalPages}
                </Text>
              </View>

              {requiresWitnessNameFirst ? (
                <TouchableOpacity
                  style={styles.goldActionPill}
                  onPress={() => onRequireWitnessName?.()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="person-add-outline" size={14} color={BRAND.white} style={{ flexShrink: 0 }} />
                  <Text style={styles.actionPillText} numberOfLines={2}>
                    Enter Witness Name
                  </Text>
                </TouchableOpacity>
              ) : isOnFinalPage ? (
                <TouchableOpacity
                  style={nextUnsignedSig ? styles.goldActionPill : styles.charcoalActionPill}
                  onPress={() => onTapSignature(nextUnsignedSig?.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={nextUnsignedSig ? 'create-outline' : 'checkmark-circle-outline'}
                    size={14}
                    color={BRAND.white}
                    style={{ flexShrink: 0 }}
                  />
                  <Text style={styles.actionPillText} numberOfLines={2}>
                    {nextUnsignedSig
                      ? `Sign (${nextUnsignedSig.signerKey === 'investor' ? 'Investor' : nextUnsignedSig.label || 'Witness'})`
                      : 'All Signatures Applied'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.goldActionPill}
                  onPress={() => triggerScrollToPage(totalPages)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionPillText} numberOfLines={2}>
                    Jump to Page {totalPages}
                  </Text>
                  <Ionicons name="arrow-down" size={14} color={BRAND.white} style={{ flexShrink: 0 }} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.canvas,
  },
  webview: {
    flex: 1,
    backgroundColor: BRAND.canvas,
  },
  floatingHud: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    flexShrink: 0,
    shadowColor: BRAND.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pagePillText: {
    color: BRAND.charcoal,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  goldActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flexShrink: 1,
    gap: 6,
    backgroundColor: BRAND.gold,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: BRAND.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  charcoalActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flexShrink: 1,
    gap: 6,
    backgroundColor: BRAND.charcoal,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 3,
  },
  actionPillText: {
    color: BRAND.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  centerBox: {
    flex: 1,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: BRAND.charcoal,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 6,
    fontSize: 12.5,
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
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 12.5,
    color: BRAND.mutedText,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
    maxWidth: 300,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  detailsBtn: {
    backgroundColor: BRAND.gold,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  detailsBtnText: {
    color: BRAND.white,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: BRAND.white,
    borderWidth: 1,
    borderColor: BRAND.grey,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryBtnText: {
    color: BRAND.charcoal,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
});




