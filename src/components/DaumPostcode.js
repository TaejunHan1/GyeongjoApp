// src/components/DaumPostcode.js - 네트워크 오류 해결 버전
import React, { useRef, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../styles/constants';

const DaumPostcode = ({ visible, onComplete, onClose }) => {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 개선된 다음 우편번호 API HTML
  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>주소 검색</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
            }
            html, body {
                width: 100%;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                background-color: #ffffff;
                overflow: hidden;
                position: fixed;
            }
            .container {
                width: 100%;
                height: 100vh;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            .header {
                background: #3182F6;
                color: white;
                padding: 16px 20px;
                text-align: center;
                font-weight: 600;
                font-size: 18px;
                flex-shrink: 0;
                z-index: 100;
            }
            .postcode-wrap {
                flex: 1;
                width: 100%;
                border: none;
                overflow: hidden;
            }
            .status {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                padding: 20px;
                z-index: 200;
            }
            .loading {
                color: #3182F6;
                font-size: 16px;
            }
            .error {
                color: #FF4444;
                font-size: 16px;
            }
            .retry-btn {
                margin-top: 16px;
                padding: 12px 24px;
                background: #3182F6;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">주소 검색</div>
            <div id="loading" class="status loading">
                <div>주소 검색 서비스 준비중...</div>
            </div>
            <div id="error" class="status error" style="display: none;">
                <div>주소 검색을 사용할 수 없습니다</div>
                <button class="retry-btn" onclick="retryInit()">다시 시도</button>
            </div>
            <div id="layer" class="postcode-wrap"></div>
        </div>

        <script>
            let initAttempts = 0;
            const maxAttempts = 3;
            
            function showLoading() {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('error').style.display = 'none';
            }
            
            function showError() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
            }
            
            function hideStatus() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'none';
            }
            
            function postMessage(data) {
                try {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify(data));
                    } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ReactNativeWebView) {
                        window.webkit.messageHandlers.ReactNativeWebView.postMessage(JSON.stringify(data));
                    } else {
                        console.log('ReactNativeWebView interface not found');
                    }
                } catch (error) {
                    console.error('Failed to post message:', error);
                }
            }
            
            function initPostcode() {
                try {
                    initAttempts++;
                    console.log('Initializing postcode, attempt:', initAttempts);
                    
                    showLoading();
                    
                    // 다음 Postcode API 로드 확인
                    if (typeof daum === 'undefined' || typeof daum.Postcode === 'undefined') {
                        if (initAttempts < maxAttempts) {
                            console.log('Daum API not ready, retrying...');
                            setTimeout(initPostcode, 2000);
                            return;
                        } else {
                            throw new Error('Daum Postcode API failed to load after ' + maxAttempts + ' attempts');
                        }
                    }
                    
                    console.log('Daum API loaded successfully');
                    hideStatus();
                    
                    // Postcode 인스턴스 생성
                    const postcodeInstance = new daum.Postcode({
                        oncomplete: function(data) {
                            console.log('Address selected:', data);
                            
                            const message = {
                                type: 'complete',
                                data: {
                                    address: data.address || '',
                                    roadAddress: data.roadAddress || '',
                                    jibunAddress: data.jibunAddress || '',
                                    zonecode: data.zonecode || '',
                                    buildingName: data.buildingName || '',
                                    apartmentYn: data.apartment || 'N',
                                    addressType: data.addressType || 'R',
                                    userSelectedType: data.userSelectedType || 'R'
                                }
                            };
                            
                            postMessage(message);
                        },
                        onresize: function(size) {
                            console.log('Postcode resized:', size);
                        },
                        onsearch: function(data) {
                            console.log('Search completed:', data);
                        },
                        width: '100%',
                        height: '100%',
                        maxSuggestItems: 5,
                        animation: false,
                        hideMapBtn: true,
                        hideEngBtn: true,
                        autoMapping: true,
                        shorthand: false,
                        pleaseReadGuide: 0,
                        pleaseReadGuideTimer: 0,
                        focusInput: true,
                        focusContent: true
                    });
                    
                    // DOM에 embed
                    const layerElement = document.getElementById('layer');
                    if (layerElement) {
                        postcodeInstance.embed(layerElement);
                        console.log('Postcode embedded successfully');
                        
                        // 성공 메시지
                        postMessage({
                            type: 'ready',
                            message: 'Postcode service ready'
                        });
                    } else {
                        throw new Error('Layer element not found');
                    }
                    
                } catch (error) {
                    console.error('Postcode initialization error:', error);
                    showError();
                    
                    // 에러 메시지
                    postMessage({
                        type: 'error',
                        message: error.message
                    });
                }
            }
            
            function retryInit() {
                initAttempts = 0;
                initPostcode();
            }
            
            // 스크립트 동적 로드
            function loadDaumScript() {
                return new Promise((resolve, reject) => {
                    if (typeof daum !== 'undefined' && typeof daum.Postcode !== 'undefined') {
                        resolve();
                        return;
                    }
                    
                    const script = document.createElement('script');
                    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                    script.async = true;
                    script.defer = true;
                    
                    script.onload = function() {
                        console.log('Daum script loaded');
                        // 잠시 대기 후 초기화 (API 준비 시간)
                        setTimeout(resolve, 500);
                    };
                    
                    script.onerror = function(error) {
                        console.error('Failed to load Daum script:', error);
                        reject(new Error('Failed to load address search service'));
                    };
                    
                    document.head.appendChild(script);
                });
            }
            
            // 초기화 시작
            window.addEventListener('load', function() {
                console.log('Window loaded, starting initialization');
                loadDaumScript()
                    .then(() => {
                        initPostcode();
                    })
                    .catch((error) => {
                        console.error('Script loading failed:', error);
                        showError();
                        postMessage({
                            type: 'error',
                            message: 'Failed to load address search service'
                        });
                    });
            });
            
            // 에러 핸들링
            window.addEventListener('error', function(event) {
                console.error('Global error:', event.error);
                showError();
            });
            
            window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled promise rejection:', event.reason);
                showError();
            });
        </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 Received message:', message);
      
      switch (message.type) {
        case 'ready':
          setIsLoading(false);
          setHasError(false);
          break;
          
        case 'complete':
          if (message.data && message.data.address) {
            console.log('✅ Address selected:', message.data);
            onComplete({
              address: message.data.roadAddress || message.data.jibunAddress || message.data.address,
              zonecode: message.data.zonecode,
              roadAddress: message.data.roadAddress,
              jibunAddress: message.data.jibunAddress,
              buildingName: message.data.buildingName,
              addressType: message.data.addressType,
              userSelectedType: message.data.userSelectedType
            });
          } else {
            Alert.alert('오류', '주소 정보를 가져올 수 없습니다.');
          }
          break;
          
        case 'error':
          setIsLoading(false);
          setHasError(true);
          console.error('❌ Postcode error:', message.message);
          break;
          
        default:
          console.log('🔔 Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Message parsing error:', error);
      setHasError(true);
    }
  };

  const handleLoadStart = () => {
    console.log('🔄 WebView load started');
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    console.log('✅ WebView load completed');
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    setIsLoading(false);
    setHasError(true);
    
    Alert.alert(
      '연결 오류', 
      '주소 검색 서비스에 연결할 수 없습니다.\n네트워크 상태를 확인해주세요.',
      [
        { text: '확인', onPress: onClose }
      ]
    );
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    webViewRef.current?.reload();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>주소 검색</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={{ html }}
            style={styles.webview}
            onMessage={handleMessage}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mixedContentMode="compatibility"
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            bounces={false}
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            injectedJavaScript={`
              console.log('WebView JavaScript injected');
              true;
            `}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
          />
          
          {/* 커스텀 로딩/에러 오버레이 */}
          {(isLoading || hasError) && (
            <View style={styles.overlay}>
              {isLoading && (
                <View style={styles.overlayContent}>
                  <Ionicons name="search" size={48} color={Colors.primary} />
                  <Text style={styles.overlayText}>주소 검색 서비스 준비중...</Text>
                </View>
              )}
              
              {hasError && (
                <View style={styles.overlayContent}>
                  <Ionicons name="warning" size={48} color={Colors.error} />
                  <Text style={styles.overlayTitle}>연결 오류</Text>
                  <Text style={styles.overlayText}>
                    주소 검색 서비스를 사용할 수 없습니다.{'\n'}
                    네트워크 연결을 확인해주세요.
                  </Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>다시 시도</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  
  // 오버레이 스타일
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  overlayText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default DaumPostcode;