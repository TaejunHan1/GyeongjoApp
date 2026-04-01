// src/components/DaumPostcode.js - 신규 도메인 사용 (postcode.map.kakao.com)
import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';

const POSTCODE_HTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <style>
    html, body { width: 100%; height: 100%; margin: 0; padding: 0; background-color: #fff; }
    #layer { width: 100%; min-height: 100%; }
  </style>
</head>
<body>
  <div id="layer"></div>
  <script src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
  <script>
    var layer = document.getElementById('layer');
    new kakao.Postcode({
      oncomplete: function(data) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      },
      onresize: function(size) {
        layer.style.height = size.height + 'px';
      },
      onclose: function(state) {
        if (state === 'FORCE_CLOSE') return;
        new kakao.Postcode({
          oncomplete: function(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          },
          onresize: function(size) {
            layer.style.height = size.height + 'px';
          },
          width: '100%',
          height: '100%',
          hideMapBtn: true,
          hideEngBtn: true,
        }).embed(layer);
      },
      width: '100%',
      height: '100%',
      hideMapBtn: true,
      hideEngBtn: true,
    }).embed(layer);
  </script>
</body>
</html>
`;

const DaumPostcode = ({ visible, onComplete, onClose }) => {
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const addressData = {
        address: data.address || '',
        roadAddress: data.roadAddress || '',
        jibunAddress: data.jibunAddress || '',
        zonecode: data.zonecode || '',
        buildingName: data.buildingName || '',
        bname: data.bname || '',
        sido: data.sido || '',
        sigungu: data.sigungu || '',
        roadname: data.roadname || '',
        buildingCode: data.buildingCode || '',
        apartment: data.apartment || '',
      };
      onComplete(addressData);
    } catch (error) {
      console.error('DaumPostcode 파싱 오류:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>주소 검색</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#191f28" />
          </TouchableOpacity>
        </View>

        <View style={styles.instructionContainer}>
          <Ionicons name="location" size={20} color="#0064ff" />
          <Text style={styles.instructionText}>
            원하는 주소를 검색하고 선택해주세요
          </Text>
        </View>

        <View style={styles.postcodeContainer}>
          <WebView
            source={{ html: POSTCODE_HTML, baseUrl: 'https://t1.kakaocdn.net' }}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="compatibility"
            originWhitelist={['*']}
            scrollEnabled={true}
            bounces={false}
            keyboardDisplayRequiresUserAction={false}
            automaticallyAdjustContentInsets={false}
            style={{ flex: 1 }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8eb',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191f28',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  instructionText: {
    fontSize: 14,
    color: '#0064ff',
    fontWeight: '500',
    marginLeft: 6,
  },
  postcodeContainer: {
    flex: 1,
  },
});

export default DaumPostcode;
