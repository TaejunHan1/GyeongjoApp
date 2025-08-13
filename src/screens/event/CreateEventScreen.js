// src/screens/event/CreateEventScreen.js - Event Type Selection Screen
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';

export default function CreateEventScreen({ navigation, route, userInfo, session }) {
  const { selectedDate, presetDate } = route?.params || {};

  const handleEventTypeSelection = (eventType) => {
    const params = {
      selectedDate,
      presetDate,
      userInfo,
      session,
    };

    if (eventType === 'wedding') {
      navigation.navigate('CreateWedding', params);
    } else if (eventType === 'funeral') {
      navigation.navigate('CreateFuneral', params);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>경조사 만들기</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>어떤 경조사를 만드시겠어요?</Text>
        <Text style={styles.subtitle}>용도에 맞는 템플릿을 준비했어요</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.optionCard, styles.weddingCard]}
            onPress={() => handleEventTypeSelection('wedding')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="heart" size={32} color={Colors.wedding} />
            </View>
            <Text style={styles.optionTitle}>결혼식</Text>
            <Text style={styles.optionDescription}>청첩장과 축의금 관리</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionCard, styles.funeralCard]}
            onPress={() => handleEventTypeSelection('funeral')}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="flower" size={32} color={Colors.funeral} />
            </View>
            <Text style={styles.optionTitle}>장례식</Text>
            <Text style={styles.optionDescription}>부고장과 조의금 관리</Text>
          </TouchableOpacity>
        </View>

        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.selectedDateText}>
              선택된 날짜: {selectedDate.toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  
  placeholder: {
    width: 40,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  
  optionsContainer: {
    gap: 20,
  },
  
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray100,
  },
  
  weddingCard: {
    borderColor: Colors.wedding + '20',
    backgroundColor: Colors.wedding + '05',
  },
  
  funeralCard: {
    borderColor: Colors.funeral + '20',
    backgroundColor: Colors.funeral + '05',
  },
  
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    padding: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    gap: 8,
  },
  
  selectedDateText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});