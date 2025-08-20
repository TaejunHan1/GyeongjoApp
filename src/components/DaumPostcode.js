// src/components/DaumPostcode.js - 임시 WebView 기반 구현
import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import Postcode from '@actbase/react-daum-postcode';

const DaumPostcode = ({ visible, onComplete, onClose }) => {
  const [manualAddress, setManualAddress] = React.useState('');
  const [manualZonecode, setManualZonecode] = React.useState('');
  
  const handleManualInput = () => {
    if (!manualAddress || !manualZonecode) {
      Alert.alert('알림', '주소와 우편번호를 모두 입력해주세요.');
      return;
    }
    
    // 수동 입력된 주소 데이터 구조
    const addressData = {
      address: manualAddress,
      roadAddress: manualAddress,
      jibunAddress: manualAddress,
      zonecode: manualZonecode,
      buildingName: '',
      bname: '',
      sido: '',
      sigungu: '',
      roadname: '',
      buildingCode: '',
      apartment: '',
    };
    
    onComplete(addressData);
    setManualAddress('');
    setManualZonecode('');
    onClose();
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
        
        {/* 임시 수동 입력 폼 */}
        <View style={styles.postcodeContainer}>
          <View style={styles.manualInputContainer}>
            <Text style={styles.inputLabel}>우편번호</Text>
            <TextInput
              style={styles.input}
              placeholder="12345"
              value={manualZonecode}
              onChangeText={setManualZonecode}
              keyboardType="number-pad"
              maxLength={5}
            />
            
            <Text style={styles.inputLabel}>주소</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              placeholder="주소를 입력하세요"
              value={manualAddress}
              onChangeText={setManualAddress}
              multiline
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleManualInput}
            >
              <Text style={styles.submitButtonText}>주소 입력 완료</Text>
            </TouchableOpacity>
            
            <Text style={styles.temporaryNotice}>
              ※ 임시로 수동 입력 방식을 사용합니다.
            </Text>
          </View>
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
  manualInputContainer: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#0064ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  temporaryNotice: {
    fontSize: 12,
    color: '#8B95A1',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default DaumPostcode;