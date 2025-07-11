// src/components/DaumPostcode.js - react-native-daum-postcode 라이브러리 사용
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
import Postcode from 'react-native-daum-postcode';

const DaumPostcode = ({ visible, onComplete, onClose }) => {
  
  const handleAddressSelected = (data) => {
    console.log('🎯🎯🎯 주소 선택 완료!');
    console.log('📋 받은 주소 데이터:', JSON.stringify(data, null, 2));
    
    // react-native-daum-postcode에서 제공하는 데이터 구조
    const addressData = {
      address: data.address || '',                    // 지번 주소
      roadAddress: data.roadAddress || '',           // 도로명 주소  
      jibunAddress: data.jibunAddress || '',         // 지번 주소
      zonecode: data.zonecode || '',                 // 우편번호 (5자리)
      buildingName: data.buildingName || '',         // 건물명
      bname: data.bname || '',                       // 법정동명
      sido: data.sido || '',                         // 시도
      sigungu: data.sigungu || '',                   // 시군구
      roadname: data.roadname || '',                 // 도로명
      buildingCode: data.buildingCode || '',         // 건물관리번호
      apartment: data.apartment || '',               // 공동주택 여부
    };
    
    console.log('✅ 정리된 주소 데이터:', addressData);
    console.log('🔄 onComplete 함수 호출...');
    
    try {
      onComplete(addressData);
      console.log('✅ onComplete 호출 성공!');
    } catch (error) {
      console.error('❌ onComplete 호출 실패:', error);
    }
  };

  const handleError = (error) => {
    console.error('❌ Postcode 오류:', error);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>주소 검색</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#191f28" />
          </TouchableOpacity>
        </View>
        
        {/* 안내 메시지 */}
        <View style={styles.instructionContainer}>
          <Ionicons name="location" size={20} color="#0064ff" />
          <Text style={styles.instructionText}>
            원하는 주소를 검색하고 선택해주세요
          </Text>
        </View>
        
        {/* Daum Postcode 컴포넌트 */}
        <View style={styles.postcodeContainer}>
          <Postcode
            style={styles.postcode}
            jsOptions={{
              hideMapBtn: true,           // 지도 버튼 숨기기
              hideEngBtn: true,           // 영문 버튼 숨기기
              alwaysShowEngAddr: false,   // 영문 주소 항상 표시 안함
            }}
            onSelected={handleAddressSelected}
            onError={handleError}
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
  postcode: {
    flex: 1,
  },
});

export default DaumPostcode;