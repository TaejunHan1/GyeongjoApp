// src/screens/event/CreateEventScreen.js - 카테고리별 사진 업로드 개선 버전
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Modal,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createEvent } from '../../lib/supabaseHelper';
import DaumPostcode from '../../components/DaumPostcode';
import WeddingTemplatePreview from './templates/WeddingTemplatePreview';

const { width, height } = Dimensions.get('window');

// 토스 컬러 시스템
const TossColors = {
  primary: '#4A88FF',
  secondary: '#F8FAFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#191F28',
  textSecondary: '#8B95A1',
  textTertiary: '#C1C8D0',
  border: '#F2F4F6',
  success: '#26C976',
  warning: '#FFB800',
  error: '#FF6B6B',
  disabled: '#F2F4F6',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

// 사진 카테고리 설정
const PHOTO_CATEGORIES = {
  main: {
    key: 'main',
    label: '메인 사진',
    icon: '🖼️',
    description: '청첩장 첫 화면에 표시될 대표 사진',
    maxCount: 5,
    required: true,
  },
  gallery: {
    key: 'gallery',
    label: '갤러리 사진',
    icon: '📷',
    description: '갤러리 섹션에 표시될 추억 사진들',
    maxCount: 10,
    required: false,
  },
  groom: {
    key: 'groom',
    label: '신랑 사진',
    icon: '🤵',
    description: '신랑 소개 섹션에 사용될 사진',
    maxCount: 1,
    required: false,
  },
  bride: {
    key: 'bride',
    label: '신부 사진',
    icon: '👰',
    description: '신부 소개 섹션에 사용될 사진',
    maxCount: 1,
    required: false,
  },
};

// 토스 스타일 모달 컴포넌트
const TossModal = ({ visible, title, message, onConfirm, onCancel, confirmText = "확인", cancelText = "취소" }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.tossModalOverlay}>
      <View style={styles.tossModalContainer}>
        <View style={styles.tossModalContent}>
          <Text style={styles.tossModalTitle}>{title}</Text>
          <Text style={styles.tossModalMessage}>{message}</Text>
        </View>
        <View style={styles.tossModalButtons}>
          {onCancel && (
            <TouchableOpacity style={styles.tossModalCancelButton} onPress={onCancel}>
              <Text style={styles.tossModalCancelText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.tossModalConfirmButton} onPress={onConfirm}>
            <Text style={styles.tossModalConfirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// 토스 스타일 달력 컴포넌트
const TossDatePicker = ({ visible, selectedDate, onSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();
    
    const days = [];
    
    // 이전 달의 날짜들
    for (let i = startDate - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // 다음 달의 날짜들
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date) => {
    onSelect(date);
    onClose();
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.tossPickerOverlay}>
        <View style={styles.tossPickerContainer}>
          <View style={styles.tossPickerHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={TossColors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.tossPickerTitle}>날짜 선택</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.monthNavButton}>
              <Ionicons name="chevron-back" size={20} color={TossColors.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.monthNavButton}>
              <Ionicons name="chevron-forward" size={20} color={TossColors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, index) => (
              <Text key={index} style={[
                styles.weekDay,
                (index === 0 || index === 6) && styles.weekendDay
              ]}>
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {days.map((dayInfo, index) => {
              const isToday = dayInfo.date.toDateString() === today.toDateString();
              const isSelected = selectedDate && dayInfo.date.toDateString() === selectedDate.toDateString();
              const isPast = dayInfo.date < today && !isToday;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !dayInfo.isCurrentMonth && styles.otherMonthDay,
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay,
                  ]}
                  onPress={() => dayInfo.isCurrentMonth && !isPast && handleDateSelect(dayInfo.date)}
                  disabled={!dayInfo.isCurrentMonth || isPast}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !dayInfo.isCurrentMonth && styles.otherMonthText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayText,
                    isPast && styles.pastDayText,
                    (index % 7 === 0) && styles.sundayText,
                  ]}>
                    {dayInfo.date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// 토스 스타일 시간 선택 컴포넌트
const TossTimePicker = ({ visible, selectedTime, onSelect, onClose }) => {
  const [selectedHour, setSelectedHour] = useState(selectedTime ? selectedTime.getHours() : 14);
  const [selectedMinute, setSelectedMinute] = useState(selectedTime ? selectedTime.getMinutes() : 0);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => {
    const time = new Date();
    time.setHours(selectedHour, selectedMinute, 0, 0);
    onSelect(time);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.tossPickerOverlay}>
        <View style={styles.tossPickerContainer}>
          <View style={styles.tossPickerHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.timePickerCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.tossPickerTitle}>시간 선택</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.timePickerConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.timePickerContent}>
            <View style={styles.timePickerSection}>
              <Text style={styles.timePickerLabel}>시</Text>
              <ScrollView style={styles.timePickerList} showsVerticalScrollIndicator={false}>
                {hours.map(hour => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timePickerItem,
                      selectedHour === hour && styles.timePickerItemSelected
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[
                      styles.timePickerItemText,
                      selectedHour === hour && styles.timePickerItemTextSelected
                    ]}>
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.timePickerSection}>
              <Text style={styles.timePickerLabel}>분</Text>
              <ScrollView style={styles.timePickerList} showsVerticalScrollIndicator={false}>
                {minutes.map(minute => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timePickerItem,
                      selectedMinute === minute && styles.timePickerItemSelected
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.timePickerItemText,
                      selectedMinute === minute && styles.timePickerItemTextSelected
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function CreateEventScreen({ navigation, route }) {
  const { eventType = 'wedding' } = route.params || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState({
    type: eventType,
    title: '',
    date: null,
    time: null,
    location: '',
    detailedAddress: '',
    
    groomName: '',
    brideName: '',
    groomFatherName: '',
    groomMotherName: '',
    brideFatherName: '',
    brideMotherName: '',
    groomContact: '010-',
    brideContact: '010-',
    groomFatherContact: '010-',
    groomMotherContact: '010-',
    brideFatherContact: '010-',
    brideMotherContact: '010-',
    ceremonyTime: null,
    receptionTime: null,
    customMessage: '',
    parkingInfo: '',
    
    familyRelations: ['신랑측', '신부측'],
    presetAmounts: [100000, 200000, 300000],
    selectedTemplate: null,
    images: [],
  });
  
  // 스크롤 및 입력 필드 참조
  const scrollViewRef = useRef(null);
  const sectionPositions = useRef({
    eventType: 0,
    names: 0,
    contact: 0,
    parents: 0,
    dateTime: 0,
    location: 0,
    photos: 0,
    message: 0,
    parking: 0,
    money: 0,
  });

  // 토스 스타일 피커 상태
  const [showTossDatePicker, setShowTossDatePicker] = useState(false);
  const [showTossTimePicker, setShowTossTimePicker] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 토스 모달 상태
  const [modalState, setModalState] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  // 애니메이션
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, [currentStep]);

  const eventTypes = [
    { 
      key: 'wedding', 
      label: '결혼식', 
      emoji: '💒', 
      description: '평생을 함께할 특별한 날',
    },
    { 
      key: 'funeral', 
      label: '부고', 
      emoji: '🕯️', 
      description: '소중한 분을 보내드리는 날',
    },
    { 
      key: 'birthday', 
      label: '돌잔치', 
      emoji: '🎂', 
      description: '아이의 첫 번째 생일',
    },
    { 
      key: 'other', 
      label: '기타', 
      emoji: '🎉', 
      description: '특별한 기념일',
    },
  ];

  const templates = {
    wedding: [
      {
        id: 'modern-dark',
        name: '모던 다크',
        description: '세련되고 감각적인 디자인',
        preview: require('../../../assets/images/aa1.png'),
        style: 'modern-dark',
        features: ['다크 모드', '그라디언트'],
      },
      {
        id: 'romantic-gold', 
        name: '한국 전통',
        description: '우아한 한국 전통 스타일',
        preview: require('../../../assets/images/aa2.png'),
        style: 'romantic-gold',
        features: ['전통 색상', '한국적 레이아웃'],
      },
      {
        id: 'vintage-app',
        name: '빈티지 앱',
        description: '트렌디한 스토리 스타일',
        preview: require('../../../assets/images/aa3.png'),
        style: 'vintage-app',
        features: ['스토리 타임라인', '모던 색감'],
      },
    ],
    funeral: [
      {
        id: 'funeral-solemn',
        name: '차분한 추모',
        description: '정중하고 엄숙한 분위기',
        preview: require('../../../assets/images/bb1.png'),
        style: 'solemn',
      },
    ],
    birthday: [
      {
        id: 'birthday-happy',
        name: '행복한 돌잔치',
        description: '밝고 즐거운 첫 번째 생일',
        preview: require('../../../assets/images/aa1.png'),
        style: 'garden',
      },
    ],
    other: [
      {
        id: 'other-celebration',
        name: '기념일 축하',
        description: '특별한 순간을 위한 디자인',
        preview: require('../../../assets/images/aa1.png'),
        style: 'classic',
      },
    ],
  };

  // 섹션으로 스크롤하는 함수
  const scrollToSection = (sectionKey) => {
    const position = sectionPositions.current[sectionKey];
    if (scrollViewRef.current && position !== undefined) {
      scrollViewRef.current.scrollTo({ 
        y: Math.max(0, position - 100), 
        animated: true 
      });
    }
  };

  // 토스 스타일 모달 표시 함수 (스크롤 포함)
  const showTossModal = (title, message, onConfirm, onCancel = null, scrollTarget = null) => {
    setModalState({
      visible: true,
      title,
      message,
      onConfirm: () => {
        setModalState({ ...modalState, visible: false });
        if (scrollTarget) {
          setTimeout(() => scrollToSection(scrollTarget), 300);
        }
        onConfirm && onConfirm();
      },
      onCancel: onCancel ? () => {
        setModalState({ ...modalState, visible: false });
        onCancel();
      } : null,
    });
  };

  // 경조사 타입에 따른 축의금 설정 (DB 기반)
  const getMoneyPresets = () => {
    switch (eventData.type) {
      case 'wedding':
        return [
          { 
            id: 'basic',
            label: '기본',
            amounts: [50000, 100000, 200000],
            description: '가까운 지인들과 함께',
          },
          { 
            id: 'standard',
            label: '일반',
            amounts: [100000, 200000, 300000],
            description: '일반적인 결혼식 축의금',
          },
          { 
            id: 'premium',
            label: '정식',
            amounts: [200000, 300000, 500000],
            description: '정식 결혼식 행사',
          },
        ];
      case 'funeral':
        return [
          { 
            id: 'basic',
            label: '기본',
            amounts: [30000, 50000, 100000],
            description: '가까운 지인들과 함께',
          },
          { 
            id: 'standard',
            label: '일반',
            amounts: [50000, 100000, 200000],
            description: '일반적인 조의금',
          },
          { 
            id: 'premium',
            label: '정식',
            amounts: [100000, 200000, 300000],
            description: '정식 조문',
          },
        ];
      case 'birthday':
        return [
          { 
            id: 'basic',
            label: '기본',
            amounts: [50000, 100000, 150000],
            description: '가까운 가족과 친지',
          },
          { 
            id: 'standard',
            label: '일반',
            amounts: [100000, 200000, 300000],
            description: '일반적인 돌잔치 축하금',
          },
          { 
            id: 'premium',
            label: '정식',
            amounts: [200000, 300000, 500000],
            description: '정식 돌잔치 행사',
          },
        ];
      default:
        return [
          { 
            id: 'basic',
            label: '기본',
            amounts: [30000, 50000, 100000],
            description: '가까운 지인들과 함께',
          },
          { 
            id: 'standard',
            label: '일반',
            amounts: [50000, 100000, 200000],
            description: '일반적인 축하금',
          },
          { 
            id: 'premium',
            label: '정식',
            amounts: [100000, 200000, 300000],
            description: '정식 기념행사',
          },
        ];
    }
  };

  const handleAddressComplete = (data) => {
    console.log('주소 검색 완료:', data);
    
    if (!data) {
      showTossModal('알림', '주소를 다시 선택해주세요', () => {});
      return;
    }

    let selectedAddress = '';
    
    if (data.roadAddress && data.roadAddress.trim()) {
      selectedAddress = data.roadAddress.trim();
    } else if (data.jibunAddress && data.jibunAddress.trim()) {
      selectedAddress = data.jibunAddress.trim();
    } else if (data.address && data.address.trim()) {
      selectedAddress = data.address.trim();
    }

    if (!selectedAddress) {
      showTossModal('알림', '올바른 주소를 선택해주세요', () => {});
      return;
    }

    setEventData(prevData => ({
      ...prevData,
      location: selectedAddress,
      zonecode: data.zonecode || '',
      buildingName: data.buildingName || ''
    }));
    
    setShowAddressSearch(false);
  };

  const formatDate = (date) => {
    if (!date) return null;
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return null;
      
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } catch (error) {
      return null;
    }
  };

  const formatTime = (time) => {
    if (!time) return null;
    
    try {
      if (time instanceof Date && !isNaN(time.getTime())) {
        return time.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 카테고리별 이미지 개수 가져오기
  const getCategoryImageCount = (category) => {
    const count = eventData.images.filter(img => img.category === category).length;
    console.log(`🔍 [DEBUG] ${category} 카테고리 이미지 개수:`, count);
    return count;
  };

  // 특정 카테고리 이미지들 가져오기
  const getCategoryImages = (category) => {
    const images = eventData.images.filter(img => img.category === category);
    console.log(`🔍 [DEBUG] ${category} 카테고리 이미지들:`, images.map(img => ({ id: img.id, category: img.category })));
    return images;
  };

  // 이미지 제거 함수 - 단일 버전만 유지
  const removeImage = (imageId) => {
    console.log('🔍 [DEBUG] 이미지 제거 요청 ID:', imageId);
    
    setEventData(prevData => {
      const imageToRemove = prevData.images.find(img => img.id === imageId);
      console.log('🔍 [DEBUG] 제거할 이미지:', imageToRemove);
      
      const newImages = prevData.images.filter(img => img.id !== imageId);
      console.log('🔍 [DEBUG] 제거 후 남은 이미지들:', newImages.map(img => ({ id: img.id, category: img.category })));
      
      return { 
        ...prevData, 
        images: newImages 
      };
    });
  };

  // 카테고리별 이미지 객체 생성 - 템플릿에서 직접 사용할 수 있도록
  const getCategorizedImages = () => {
    const categorized = {
      main: eventData.images.filter(img => img.category === 'main'),
      gallery: eventData.images.filter(img => img.category === 'gallery'), 
      groom: eventData.images.filter(img => img.category === 'groom'),
      bride: eventData.images.filter(img => img.category === 'bride'),
      all: eventData.images
    };

    console.log('🔍 [DEBUG] 카테고리별 이미지 객체:', {
      main: categorized.main.length,
      gallery: categorized.gallery.length,
      groom: categorized.groom.length,
      bride: categorized.bride.length,
      total: categorized.all.length
    });

    return categorized;
  };



  // 이미지 선택 함수 - 디버깅 및 개선된 버전
  const pickImagesForCategory = async (category) => {
    try {
      console.log('🔍 [DEBUG] 카테고리 선택:', category.key, category.label);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showTossModal('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요해요', () => {});
        return;
      }

      const currentCount = getCategoryImageCount(category.key);
      const remainingCount = category.maxCount - currentCount;

      console.log('🔍 [DEBUG] 현재 카운트:', currentCount, '남은 카운트:', remainingCount);

      if (remainingCount <= 0) {
        showTossModal('알림', `${category.label}은 최대 ${category.maxCount}장까지 업로드 가능해요`, () => {});
        return;
      }

      const allowsMultiple = remainingCount > 1 && category.maxCount > 1;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !allowsMultiple,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: allowsMultiple,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('🔍 [DEBUG] 선택된 이미지 개수:', result.assets.length);
        
        let newImages = [];
        
        if (allowsMultiple && result.assets.length > 1) {
          // 여러 이미지 선택 (갤러리, 메인 사진 등)
          const selectedImages = result.assets.slice(0, remainingCount);
          newImages = selectedImages.map((asset, index) => ({
            ...asset,
            category: category.key,
            categoryLabel: category.label,
            id: `${category.key}_${Date.now()}_${index}`, // 더 고유한 ID
          }));
        } else {
          // 단일 이미지 선택
          newImages = [{
            ...result.assets[0],
            category: category.key,
            categoryLabel: category.label,
            id: `${category.key}_${Date.now()}`, // 카테고리 포함 고유 ID
          }];
        }

        console.log('🔍 [DEBUG] 생성된 새 이미지들:', newImages.map(img => ({ id: img.id, category: img.category })));

        // 이미지 배열 업데이트 로직 개선
        setEventData(prevData => {
          let updatedImages;
          
          if (category.maxCount === 1) {
            // 1장 제한 카테고리 (신랑, 신부): 기존 같은 카테고리 이미지 제거 후 새 이미지 추가
            const otherCategoryImages = prevData.images.filter(img => img.category !== category.key);
            updatedImages = [...otherCategoryImages, ...newImages];
            console.log('🔍 [DEBUG] 1장 제한 - 기존 제거 후 추가');
          } else {
            // 다중 이미지 허용 카테고리 (메인, 갤러리): 기존 배열에 추가
            updatedImages = [...prevData.images, ...newImages];
            console.log('🔍 [DEBUG] 다중 허용 - 기존에 추가');
          }

          console.log('🔍 [DEBUG] 최종 이미지 배열:', updatedImages.map(img => ({ id: img.id, category: img.category })));
          
          return {
            ...prevData,
            images: updatedImages,
          };
        });
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 이미지 선택 오류:', error);
      showTossModal('오류', '사진 선택 중 문제가 발생했어요', () => {});
    }
  };

  // 이미지 제거 함수
  // const removeImage = (imageId) => {
  //   const newImages = eventData.images.filter(img => img.id !== imageId);
  //   setEventData({ ...eventData, images: newImages });
  // };

  const handleTemplatePreview = (template) => {
    console.log('🔍 [DEBUG] 템플릿 미리보기 시작:', template.name);
    setPreviewTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleTemplateSelect = (template) => {
    console.log('🔍 [DEBUG] 템플릿 선택:', template.name);
    setEventData({ ...eventData, selectedTemplate: template });
    setShowTemplatePreview(false);
  };

  const validateStep1 = () => {
    if (eventData.type === 'wedding') {
      if (!eventData.groomName.trim()) {
        showTossModal('필수 입력', '신랑 이름을 입력해주세요', () => {}, null, 'names');
        return false;
      }
      if (!eventData.brideName.trim()) {
        showTossModal('필수 입력', '신부 이름을 입력해주세요', () => {}, null, 'names');
        return false;
      }
      if (!eventData.date) {
        showTossModal('필수 입력', '결혼식 날짜를 선택해주세요', () => {}, null, 'dateTime');
        return false;
      }
      if (!eventData.ceremonyTime) {
        showTossModal('필수 입력', '예식 시간을 선택해주세요', () => {}, null, 'dateTime');
        return false;
      }
    } else {
      if (!eventData.title.trim()) {
        showTossModal('필수 입력', '행사명을 입력해주세요', () => {}, null, 'names');
        return false;
      }
      if (!eventData.date) {
        showTossModal('필수 입력', '행사 날짜를 선택해주세요', () => {}, null, 'dateTime');
        return false;
      }
    }
    
    if (!eventData.location.trim()) {
      showTossModal('필수 입력', '행사 장소를 선택해주세요', () => {}, null, 'location');
      return false;
    }
    
    if (!eventData.detailedAddress.trim()) {
      showTossModal('필수 입력', '상세 주소를 입력해주세요', () => {}, null, 'location');
      return false;
    }

    // 메인 사진 필수 체크
    const mainImageCount = getCategoryImageCount('main');
    if (mainImageCount === 0) {
      showTossModal('필수 입력', '메인 사진을 최소 1장 이상 업로드해주세요', () => {}, null, 'photos');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (!eventData.selectedTemplate) {
        showTossModal('템플릿 선택', '원하는 템플릿을 선택해주세요', () => {});
        return;
      }
      handleSave();
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const fullLocation = eventData.detailedAddress 
        ? `${eventData.location} ${eventData.detailedAddress}`.trim()
        : eventData.location.trim();

      const eventTitle = eventData.type === 'wedding' 
        ? `${eventData.groomName} ♥ ${eventData.brideName} 결혼식`
        : eventData.title.trim();

      // 부모님 연락처 정보를 additional_info에 저장
      const parentsContactInfo = {
        groom_father_contact: eventData.groomFatherContact?.replace('010-', '') ? eventData.groomFatherContact : null,
        groom_mother_contact: eventData.groomMotherContact?.replace('010-', '') ? eventData.groomMotherContact : null,
        bride_father_contact: eventData.brideFatherContact?.replace('010-', '') ? eventData.brideFatherContact : null,
        bride_mother_contact: eventData.brideMotherContact?.replace('010-', '') ? eventData.brideMotherContact : null,
        reception_time: eventData.receptionTime && eventData.receptionTime instanceof Date && !isNaN(eventData.receptionTime.getTime()) ? 
          eventData.receptionTime.toTimeString().split(' ')[0] : null,
      };

      // 카테고리별 이미지 정보
      const categorizedImages = getCategorizedImages();
      console.log('🔍 [DEBUG] 저장할 카테고리별 이미지:', categorizedImages);

      const formattedEventData = {
        event_type: eventData.type,
        event_name: eventTitle,
        main_person_name: eventData.type === 'wedding' 
          ? `${eventData.groomName}, ${eventData.brideName}`
          : eventData.hostName?.trim(),
        event_date: eventData.date && eventData.date instanceof Date && !isNaN(eventData.date.getTime()) ? 
          eventData.date.toISOString().split('T')[0] : null,
        location: fullLocation || null,
        detailed_address: eventData.detailedAddress.trim() || null,
        template_style: eventData.selectedTemplate?.style || 'modern-dark',
        family_relations: eventData.familyRelations,
        preset_amounts: eventData.presetAmounts,
        
        ...(eventData.type === 'wedding' && {
          bride_name: eventData.brideName.trim(),
          groom_name: eventData.groomName.trim(),
          bride_father_name: eventData.brideFatherName.trim() || null,
          bride_mother_name: eventData.brideMotherName.trim() || null,
          groom_father_name: eventData.groomFatherName.trim() || null,
          groom_mother_name: eventData.groomMotherName.trim() || null,
          bride_contact: eventData.brideContact?.replace('010-', '') ? eventData.brideContact : null,
          groom_contact: eventData.groomContact?.replace('010-', '') ? eventData.groomContact : null,
          ceremony_time: eventData.ceremonyTime && eventData.ceremonyTime instanceof Date && !isNaN(eventData.ceremonyTime.getTime()) ? 
            eventData.ceremonyTime.toTimeString().split(' ')[0] : null,
          custom_message: eventData.customMessage.trim() || null,
          parking_info: eventData.parkingInfo.trim() || null,
          additional_info: {
            ...parentsContactInfo,
            categorized_images: categorizedImages // 카테고리별 이미지 저장
          }
        }),
        
        status: 'active',
        is_finalized: false,
        image_urls: eventData.images.map(img => ({
          uri: img.uri,
          category: img.category,
          categoryLabel: img.categoryLabel,
          id: img.id
        })),
      };

      console.log('🔍 [DEBUG] 최종 저장 데이터 - 이미지 개수:', formattedEventData.image_urls.length);

      const result = await createEvent(formattedEventData);

      if (result.success) {
        setCurrentStep(3);
        setTimeout(() => {
          navigation.navigate('EventDisplay', { 
            eventId: result.data.id,
            templateStyle: eventData.selectedTemplate?.style || 'modern-dark',
            categorizedImages: categorizedImages
          });
        }, 2000);
      } else {
        showTossModal('오류', '경조사 등록에 실패했어요. 다시 시도해주세요', () => {});
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 저장 오류:', error);
      showTossModal('오류', '경조사 등록 중 문제가 발생했어요', () => {});
    } finally {
      setIsLoading(false);
    }
  };

  // 연락처 입력 핸들러
  const handleContactChange = (text, field) => {
    // 010- 이후의 텍스트만 처리
    if (text.startsWith('010-')) {
      setEventData({ ...eventData, [field]: text });
    } else {
      // 010-가 지워진 경우 다시 추가
      setEventData({ ...eventData, [field]: '010-' + text.replace(/^010-?/, '') });
    }
  };

  // 메인 렌더링 함수들
  const renderEventTypeSelector = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.eventType = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>어떤 경조사인가요?</Text>
        <Text style={styles.sectionSubtitle}>준비하실 경조사 종류를 선택해주세요</Text>
      </View>
      
      <View style={styles.typeGrid}>
        {eventTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeCard,
              eventData.type === type.key && styles.typeCardSelected,
            ]}
            onPress={() => setEventData({ ...eventData, type: type.key })}
          >
            <Text style={styles.typeEmoji}>{type.emoji}</Text>
            <View style={styles.typeTextContainer}>
              <Text style={[
                styles.typeLabel,
                eventData.type === type.key && styles.typeLabelSelected
              ]}>
                {type.label}
              </Text>
              <Text style={[
                styles.typeDescription,
                eventData.type === type.key && styles.typeDescriptionSelected
              ]}>
                {type.description}
              </Text>
            </View>
            {eventData.type === type.key && (
              <View style={styles.typeCheckContainer}>
                <Ionicons name="checkmark-circle" size={20} color={TossColors.primary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderWeddingForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.names = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>신랑 & 신부</Text>
        <Text style={styles.sectionSubtitle}>결혼하실 두 분의 이름을 입력해주세요</Text>
      </View>
      
      <View style={styles.formRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>신랑 이름 *</Text>
          <TextInput
            style={[styles.textInput, !eventData.groomName && styles.textInputEmpty]}
            placeholder="홍길동"
            value={eventData.groomName}
            onChangeText={(text) => setEventData({ ...eventData, groomName: text })}
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>신부 이름 *</Text>
          <TextInput
            style={[styles.textInput, !eventData.brideName && styles.textInputEmpty]}
            placeholder="김영희"
            value={eventData.brideName}
            onChangeText={(text) => setEventData({ ...eventData, brideName: text })}
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderBasicForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.names = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>기본 정보</Text>
        <Text style={styles.sectionSubtitle}>행사의 기본 정보를 입력해주세요</Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>행사명 *</Text>
        <TextInput
          style={[styles.textInput, !eventData.title && styles.textInputEmpty]}
          placeholder={`예: ${eventData.type === 'funeral' ? '故 김영희 장례식' :
                          eventData.type === 'birthday' ? '김민수 첫 돌잔치' : '특별한 기념일'}`}
          value={eventData.title}
          onChangeText={(text) => setEventData({ ...eventData, title: text })}
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>
    </Animated.View>
  );

  const renderContactForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.contact = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>연락처</Text>
        <Text style={styles.sectionSubtitle}>하객들이 연락할 수 있는 번호예요</Text>
      </View>
      
      <View style={styles.formRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>신랑 연락처</Text>
          <TextInput
            style={styles.textInput}
            placeholder="010-0000-0000"
            value={eventData.groomContact}
            onChangeText={(text) => handleContactChange(text, 'groomContact')}
            keyboardType="phone-pad"
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>신부 연락처</Text>
          <TextInput
            style={styles.textInput}
            placeholder="010-0000-0000"
            value={eventData.brideContact}
            onChangeText={(text) => handleContactChange(text, 'brideContact')}
            keyboardType="phone-pad"
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderParentsForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.parents = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>양가 부모님</Text>
        <Text style={styles.sectionSubtitle}>청첩장에 표시될 부모님 성함과 연락처예요</Text>
      </View>
      
      <View style={styles.parentsSection}>
        <Text style={styles.parentTitle}>신랑측 부모님</Text>
        <View style={styles.formRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>아버님</Text>
            <TextInput
              style={styles.textInput}
              placeholder="성함"
              value={eventData.groomFatherName}
              onChangeText={(text) => setEventData({ ...eventData, groomFatherName: text })}
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>어머님</Text>
            <TextInput
              style={styles.textInput}
              placeholder="성함"
              value={eventData.groomMotherName}
              onChangeText={(text) => setEventData({ ...eventData, groomMotherName: text })}
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>아버님 연락처</Text>
            <TextInput
              style={styles.textInput}
              placeholder="010-0000-0000"
              value={eventData.groomFatherContact}
              onChangeText={(text) => handleContactChange(text, 'groomFatherContact')}
              keyboardType="phone-pad"
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>어머님 연락처</Text>
            <TextInput
              style={styles.textInput}
              placeholder="010-0000-0000"
              value={eventData.groomMotherContact}
              onChangeText={(text) => handleContactChange(text, 'groomMotherContact')}
              keyboardType="phone-pad"
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
        </View>
      </View>

      <View style={styles.parentsSection}>
        <Text style={styles.parentTitle}>신부측 부모님</Text>
        <View style={styles.formRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>아버님</Text>
            <TextInput
              style={styles.textInput}
              placeholder="성함"
              value={eventData.brideFatherName}
              onChangeText={(text) => setEventData({ ...eventData, brideFatherName: text })}
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>어머님</Text>
            <TextInput
              style={styles.textInput}
              placeholder="성함"
              value={eventData.brideMotherName}
              onChangeText={(text) => setEventData({ ...eventData, brideMotherName: text })}
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>아버님 연락처</Text>
            <TextInput
              style={styles.textInput}
              placeholder="010-0000-0000"
              value={eventData.brideFatherContact}
              onChangeText={(text) => handleContactChange(text, 'brideFatherContact')}
              keyboardType="phone-pad"
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>어머님 연락처</Text>
            <TextInput
              style={styles.textInput}
              placeholder="010-0000-0000"
              value={eventData.brideMotherContact}
              onChangeText={(text) => handleContactChange(text, 'brideMotherContact')}
              keyboardType="phone-pad"
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderDateTimeForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.dateTime = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>날짜 & 시간</Text>
        <Text style={styles.sectionSubtitle}>행사가 열리는 날짜와 시간을 선택해주세요</Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>날짜 *</Text>
        <TouchableOpacity
          style={[styles.selectButton, !eventData.date && styles.selectButtonEmpty]}
          onPress={() => setShowTossDatePicker(true)}
        >
          <Text style={[
            styles.selectButtonText,
            !eventData.date && styles.selectButtonTextEmpty
          ]}>
            {formatDate(eventData.date) || '날짜를 선택해주세요'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={TossColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {eventData.type === 'wedding' && (
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>예식 시간 *</Text>
          <TouchableOpacity
            style={[styles.selectButton, !eventData.ceremonyTime && styles.selectButtonEmpty]}
            onPress={() => setShowTossTimePicker(true)}
          >
            <Text style={[
              styles.selectButtonText,
              !eventData.ceremonyTime && styles.selectButtonTextEmpty
            ]}>
              {formatTime(eventData.ceremonyTime) || '시간을 선택해주세요'}
            </Text>
            <Ionicons name="time-outline" size={20} color={TossColors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  const renderLocationForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.location = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>장소</Text>
        <Text style={styles.sectionSubtitle}>행사가 열리는 장소를 입력해주세요</Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>주소 *</Text>
        <TouchableOpacity
          style={[styles.addressButton, eventData.location && styles.addressButtonSelected]}
          onPress={() => setShowAddressSearch(true)}
        >
          <View style={styles.addressButtonContent}>
            <Ionicons 
              name={eventData.location ? "location" : "search"} 
              size={20} 
              color={eventData.location ? TossColors.primary : TossColors.textSecondary} 
            />
            <Text style={[
              styles.addressButtonText,
              eventData.location && styles.addressButtonTextSelected
            ]}>
              {eventData.location || '주소를 검색해주세요'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={TossColors.textTertiary} />
        </TouchableOpacity>
      </View>
      
      {eventData.location && (
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>상세 주소 *</Text>
          <TextInput
            style={[styles.textInput, !eventData.detailedAddress && styles.textInputEmpty]}
            placeholder="예: 3층 그랜드볼룸"
            value={eventData.detailedAddress}
            onChangeText={(text) => setEventData({ ...eventData, detailedAddress: text })}
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
      )}
    </Animated.View>
  );

  const renderMessageForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.message = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>인사말</Text>
        <Text style={styles.sectionSubtitle}>하객들에게 전할 따뜻한 메시지를 적어보세요</Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.textInput, styles.messageInput]}
          placeholder="저희의 소중한 첫 걸음에 함께해주시는 모든 분들께 진심으로 감사드립니다."
          value={eventData.customMessage}
          onChangeText={(text) => setEventData({ ...eventData, customMessage: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>
    </Animated.View>
  );

  const renderParkingForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.parking = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>주차 안내</Text>
        <Text style={styles.sectionSubtitle}>주차에 대한 안내사항을 적어주세요</Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="예: 건물 지하 1층 주차장 이용 (2시간 무료)"
          value={eventData.parkingInfo}
          onChangeText={(text) => setEventData({ ...eventData, parkingInfo: text })}
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>
    </Animated.View>
  );

  // 디버깅용 이미지 상태 모니터링 컴포넌트
  const renderImageDebugInfo = () => {
    if (__DEV__) { // 개발 모드에서만 표시
      const categorizedImages = getCategorizedImages();
      
      return (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 이미지 상태 디버깅 (실시간)</Text>
          
          <Text style={styles.debugSummary}>
            업로드된 이미지: {eventData.images.length}장
          </Text>
          
          <Text style={styles.debugSummary}>
            메인: {categorizedImages.main.length}/5 | 
            갤러리: {categorizedImages.gallery.length}/10 | 
            신랑: {categorizedImages.groom.length}/1 | 
            신부: {categorizedImages.bride.length}/1
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            {eventData.images.map((image, index) => (
              <View key={image.id} style={styles.debugImageItem}>
                <Text style={styles.debugImageText}>#{index}</Text>
                <Text style={styles.debugImageText}>ID: ...{String(image.id).slice(-4)}</Text>
                <Text style={[styles.debugImageText, { fontWeight: 'bold', color: 
                  image.category === 'main' ? '#4A88FF' :
                  image.category === 'gallery' ? '#26C976' :
                  image.category === 'groom' ? '#FFB800' :
                  image.category === 'bride' ? '#FF6B6B' : '#666'
                }]}>
                  {image.category || 'NO_CAT'}
                </Text>
                <Image source={{ uri: image.uri }} style={styles.debugImage} />
              </View>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={{ backgroundColor: '#4A88FF', padding: 8, borderRadius: 4, marginTop: 8 }}
            onPress={() => {
              console.log('🔍 [DEBUG] === 카테고리별 이미지 상세 정보 ===');
              console.log('🔍 [DEBUG] 메인 사진들:', categorizedImages.main.map(img => ({ id: img.id, uri: img.uri.slice(-20) })));
              console.log('🔍 [DEBUG] 갤러리 사진들:', categorizedImages.gallery.map(img => ({ id: img.id, uri: img.uri.slice(-20) })));
              console.log('🔍 [DEBUG] 신랑 사진:', categorizedImages.groom.map(img => ({ id: img.id, uri: img.uri.slice(-20) })));
              console.log('🔍 [DEBUG] 신부 사진:', categorizedImages.bride.map(img => ({ id: img.id, uri: img.uri.slice(-20) })));
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>콘솔에 카테고리별 정보 출력</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  // 카테고리별 사진 업로드 폼 - 디버깅 정보 추가
  const renderPhotoUploadForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.photos = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>사진 업로드</Text>
        <Text style={styles.sectionSubtitle}>카테고리별로 사진을 업로드해주세요</Text>
      </View>

      {/* 디버깅 정보 */}
      {renderImageDebugInfo()}

      {/* 결혼식인 경우 모든 카테고리 표시 */}
      {eventData.type === 'wedding' ? (
        <View style={styles.photoCategoriesContainer}>
          {Object.values(PHOTO_CATEGORIES).map((category) => {
            const currentCount = getCategoryImageCount(category.key);
            const categoryImages = getCategoryImages(category.key);
            const isComplete = currentCount >= category.maxCount;
            const isRequired = category.required && currentCount === 0;

            return (
              <View key={category.key} style={styles.photoCategorySection}>
                <View style={styles.photoCategoryHeader}>
                  <View style={styles.photoCategoryInfo}>
                    <Text style={styles.photoCategoryIcon}>{category.icon}</Text>
                    <View style={styles.photoCategoryTextContainer}>
                      <Text style={[
                        styles.photoCategoryTitle,
                        isRequired && styles.photoCategoryTitleRequired
                      ]}>
                        {category.label}
                        {category.required && <Text style={styles.requiredAsterisk}> *</Text>}
                      </Text>
                      <Text style={styles.photoCategoryDescription}>{category.description}</Text>
                    </View>
                  </View>
                  <View style={styles.photoCategoryCount}>
                    <Text style={[
                      styles.photoCategoryCountText,
                      isComplete && styles.photoCategoryCountComplete,
                      isRequired && styles.photoCategoryCountRequired
                    ]}>
                      {currentCount}/{category.maxCount}
                    </Text>
                  </View>
                </View>

                {/* 업로드 버튼 */}
                <TouchableOpacity
                  style={[
                    styles.categoryUploadButton,
                    isComplete && styles.categoryUploadButtonDisabled,
                    isRequired && styles.categoryUploadButtonRequired
                  ]}
                  onPress={() => {
                    console.log('🔍 [DEBUG] 업로드 버튼 클릭:', category.key);
                    pickImagesForCategory(category);
                  }}
                  disabled={isComplete}
                >
                  <Ionicons 
                    name={isComplete ? "checkmark-circle" : "camera"} 
                    size={20} 
                    color={isComplete ? TossColors.success : 
                           isRequired ? TossColors.error : TossColors.primary} 
                  />
                  <Text style={[
                    styles.categoryUploadButtonText,
                    isComplete && styles.categoryUploadButtonTextDisabled,
                    isRequired && styles.categoryUploadButtonTextRequired
                  ]}>
                    {isComplete ? '업로드 완료' : 
                     currentCount === 0 ? `${category.label} 추가` : 
                     `${category.label} 추가 (${category.maxCount - currentCount}장 더)`}
                  </Text>
                </TouchableOpacity>

                {/* 업로드된 이미지들 */}
                {categoryImages.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryImagesScroll}
                  >
                    {categoryImages.map((image) => (
                      <View key={image.id} style={styles.categoryImageItem}>
                        <Image source={{ uri: image.uri }} style={styles.categoryImage} />
                        <TouchableOpacity
                          style={styles.categoryImageRemove}
                          onPress={() => {
                            console.log('🔍 [DEBUG] 이미지 제거 버튼 클릭:', image.id, image.category);
                            removeImage(image.id);
                          }}
                        >
                          <Ionicons name="close-circle" size={20} color={TossColors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        // 결혼식이 아닌 경우 기본 메인/갤러리만 표시
        <View style={styles.photoCategoriesContainer}>
          {[PHOTO_CATEGORIES.main, PHOTO_CATEGORIES.gallery].map((category) => {
            const currentCount = getCategoryImageCount(category.key);
            const categoryImages = getCategoryImages(category.key);
            const isComplete = currentCount >= category.maxCount;
            const isRequired = category.required && currentCount === 0;

            return (
              <View key={category.key} style={styles.photoCategorySection}>
                <View style={styles.photoCategoryHeader}>
                  <View style={styles.photoCategoryInfo}>
                    <Text style={styles.photoCategoryIcon}>{category.icon}</Text>
                    <View style={styles.photoCategoryTextContainer}>
                      <Text style={[
                        styles.photoCategoryTitle,
                        isRequired && styles.photoCategoryTitleRequired
                      ]}>
                        {category.label}
                        {category.required && <Text style={styles.requiredAsterisk}> *</Text>}
                      </Text>
                      <Text style={styles.photoCategoryDescription}>{category.description}</Text>
                    </View>
                  </View>
                  <View style={styles.photoCategoryCount}>
                    <Text style={[
                      styles.photoCategoryCountText,
                      isComplete && styles.photoCategoryCountComplete,
                      isRequired && styles.photoCategoryCountRequired
                    ]}>
                      {currentCount}/{category.maxCount}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.categoryUploadButton,
                    isComplete && styles.categoryUploadButtonDisabled,
                    isRequired && styles.categoryUploadButtonRequired
                  ]}
                  onPress={() => pickImagesForCategory(category)}
                  disabled={isComplete}
                >
                  <Ionicons 
                    name={isComplete ? "checkmark-circle" : "camera"} 
                    size={20} 
                    color={isComplete ? TossColors.success : 
                           isRequired ? TossColors.error : TossColors.primary} 
                  />
                  <Text style={[
                    styles.categoryUploadButtonText,
                    isComplete && styles.categoryUploadButtonTextDisabled,
                    isRequired && styles.categoryUploadButtonTextRequired
                  ]}>
                    {isComplete ? '업로드 완료' : 
                     currentCount === 0 ? `${category.label} 추가` : 
                     `${category.label} 추가 (${category.maxCount - currentCount}장 더)`}
                  </Text>
                </TouchableOpacity>

                {categoryImages.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryImagesScroll}
                  >
                    {categoryImages.map((image) => (
                      <View key={image.id} style={styles.categoryImageItem}>
                        <Image source={{ uri: image.uri }} style={styles.categoryImage} />
                        <TouchableOpacity
                          style={styles.categoryImageRemove}
                          onPress={() => removeImage(image.id)}
                        >
                          <Ionicons name="close-circle" size={20} color={TossColors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* 전체 업로드 현황 요약 */}
      <View style={styles.photoSummaryContainer}>
        <Text style={styles.photoSummaryTitle}>업로드 현황</Text>
        <View style={styles.photoSummaryStats}>
          <Text style={styles.photoSummaryText}>
            총 {eventData.images.length}장 업로드됨
          </Text>
          {eventData.type === 'wedding' && (
            <Text style={styles.photoSummaryDetail}>
              메인 {getCategoryImageCount('main')}/5, 
              갤러리 {getCategoryImageCount('gallery')}/10, 
              신랑 {getCategoryImageCount('groom')}/1, 
              신부 {getCategoryImageCount('bride')}/1
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );

  const renderMoneyForm = () => {
    const moneyPresets = getMoneyPresets();
    const moneyLabel = eventData.type === 'wedding' ? '축의금' : 
                      eventData.type === 'funeral' ? '조의금' : '축하금';
    
    return (
      <Animated.View 
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        onLayout={(event) => {
          sectionPositions.current.money = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{moneyLabel} 설정</Text>
          <Text style={styles.sectionSubtitle}>참석자들이 선택할 수 있는 {moneyLabel} 금액을 설정해주세요</Text>
        </View>
        
        <View style={styles.moneyPresetContainer}>
          {moneyPresets.map((preset) => {
            const isSelected = JSON.stringify(eventData.presetAmounts) === JSON.stringify(preset.amounts);
            
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.moneyPresetCard,
                  isSelected && styles.moneyPresetCardSelected,
                ]}
                onPress={() => setEventData({ ...eventData, presetAmounts: preset.amounts })}
              >
                <View style={styles.moneyPresetHeader}>
                  <View style={styles.moneyPresetInfo}>
                    <Text style={[
                      styles.moneyPresetLabel,
                      isSelected && styles.moneyPresetLabelSelected,
                    ]}>
                      {preset.label}
                    </Text>
                    <Text style={[
                      styles.moneyPresetDescription,
                      isSelected && styles.moneyPresetDescriptionSelected,
                    ]}>
                      {preset.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.moneyPresetCheckIcon}>
                      <Ionicons name="checkmark-circle" size={24} color={TossColors.primary} />
                    </View>
                  )}
                </View>
                
                <View style={styles.moneyPresetAmounts}>
                  {preset.amounts.map((amount, index) => (
                    <View
                      key={index}
                      style={[
                        styles.moneyAmountChip,
                        isSelected && styles.moneyAmountChipSelected,
                      ]}
                    >
                      <Text style={[
                        styles.moneyAmountText,
                        isSelected && styles.moneyAmountTextSelected,
                      ]}>
                        {formatAmount(amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const renderTemplateSelection = () => (
    <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>템플릿 선택</Text>
        <Text style={styles.sectionSubtitle}>마음에 드는 디자인을 선택해주세요</Text>
      </View>

      <View style={styles.templateGrid}>
        {templates[eventData.type]?.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              eventData.selectedTemplate?.id === template.id && styles.templateCardSelected,
            ]}
            onPress={() => setEventData({ ...eventData, selectedTemplate: template })}
          >
            <View style={styles.templateImageContainer}>
              <Image source={template.preview} style={styles.templateImage} />
              {eventData.selectedTemplate?.id === template.id && (
                <View style={styles.templateSelectedOverlay}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                </View>
              )}
            </View>
            
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateDescription}>{template.description}</Text>
              
              {template.features && (
                <View style={styles.templateFeatures}>
                  {template.features.map((feature, index) => (
                    <View key={index} style={styles.templateFeature}>
                      <Text style={styles.templateFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.templatePreviewButton}
              onPress={() => handleTemplatePreview(template)}
            >
              <Text style={styles.templatePreviewButtonText}>미리보기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderCompletionScreen = () => (
    <View style={styles.completionContainer}>
      <Animated.View style={[styles.completionContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.completionIconContainer}>
          <Text style={styles.completionEmoji}>🎉</Text>
        </View>
        <Text style={styles.completionTitle}>
          {eventData.type === 'wedding' 
            ? '결혼식 청첩장이 완성되었어요!'
            : eventData.type === 'funeral'
            ? '부고가 완성되었어요!'
            : eventData.type === 'birthday'
            ? '돌잔치 초대장이 완성되었어요!'
            : '경조사가 완성되었어요!'
          }
        </Text>
        <Text style={styles.completionSubtitle}>
          잠시 후 청첩장 화면으로 이동할게요
        </Text>
      </Animated.View>
    </View>
  );

  const renderStep1 = () => (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => {
        // 컨텐츠 사이즈가 변경될 때마다 위치 재계산
      }}
    >
      {renderEventTypeSelector()}
      {eventData.type === 'wedding' ? renderWeddingForm() : renderBasicForm()}
      {eventData.type === 'wedding' && renderContactForm()}
      {eventData.type === 'wedding' && renderParentsForm()}
      {renderDateTimeForm()}
      {renderLocationForm()}
      {renderPhotoUploadForm()}
      {renderMessageForm()}
      {eventData.type === 'wedding' && renderParkingForm()}
      {renderMoneyForm()}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {renderTemplateSelection()}
    </ScrollView>
  );

  const renderStep3 = () => renderCompletionScreen();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 프로그레스 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep}/3
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* 하단 버튼 */}
        {currentStep < 3 && (
          <View style={styles.bottomButtonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(currentStep - 1)}
              >
                <Text style={styles.backButtonText}>이전</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.nextButton,
                isLoading && styles.nextButtonDisabled,
                currentStep === 1 && { flex: 1 }
              ]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.nextButtonText}>
                {isLoading ? '생성 중...' : 
                 currentStep === 1 ? '다음' : 
                 eventData.type === 'wedding' ? '결혼식 청첩장 만들기' :
                 eventData.type === 'funeral' ? '부고 만들기' :
                 eventData.type === 'birthday' ? '돌잔치 초대장 만들기' : '경조사 만들기'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 토스 스타일 모달들 */}
        <TossModal
          visible={modalState.visible}
          title={modalState.title}
          message={modalState.message}
          onConfirm={modalState.onConfirm}
          onCancel={modalState.onCancel}
        />

        <TossDatePicker
          visible={showTossDatePicker}
          selectedDate={eventData.date}
          onSelect={(date) => setEventData({ ...eventData, date })}
          onClose={() => setShowTossDatePicker(false)}
        />

        <TossTimePicker
          visible={showTossTimePicker}
          selectedTime={eventData.ceremonyTime}
          onSelect={(time) => setEventData({ ...eventData, ceremonyTime: time })}
          onClose={() => setShowTossTimePicker(false)}
        />

        <DaumPostcode
          visible={showAddressSearch}
          onComplete={handleAddressComplete}
          onClose={() => setShowAddressSearch(false)}
        />

        {/* 템플릿 미리보기 모달 */}
        <Modal
          visible={showTemplatePreview}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.previewModalContainer}>
            <TouchableOpacity 
              style={styles.previewModalClose}
              onPress={() => setShowTemplatePreview(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.previewModalSelect}
              onPress={() => handleTemplateSelect(previewTemplate)}
            >
              <Text style={styles.previewModalSelectText}>이 템플릿 선택</Text>
            </TouchableOpacity>
            
            {previewTemplate && (
              <WeddingTemplatePreview
                template={previewTemplate}
                eventData={eventData}
                userImages={eventData.images}
                categorizedImages={getCategorizedImages()}
              />
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TossColors.background,
  },
  
  // 프로그레스 바
  progressContainer: {
    backgroundColor: TossColors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: TossColors.border,
    borderRadius: 2,
    marginRight: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: TossColors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: TossColors.secondary,
  },
  
  // 섹션
  section: {
    backgroundColor: TossColors.background,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: TossColors.textSecondary,
    lineHeight: 20,
  },
  
  // 경조사 타입 선택
  typeGrid: {
    gap: 12,
  },
  typeCard: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  typeEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 2,
  },
  typeLabelSelected: {
    color: TossColors.primary,
  },
  typeDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
  },
  typeDescriptionSelected: {
    color: TossColors.primary,
  },
  typeCheckContainer: {
    marginLeft: 8,
  },
  
  // 폼 요소
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: TossColors.text,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  textInputEmpty: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  messageInput: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  
  // 부모님 섹션
  parentsSection: {
    marginBottom: 24,
  },
  parentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 16,
  },
  
  // 선택 버튼
  selectButton: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonEmpty: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  selectButtonText: {
    fontSize: 16,
    color: TossColors.text,
    flex: 1,
  },
  selectButtonTextEmpty: {
    color: TossColors.textTertiary,
  },
  
  // 주소 선택 버튼
  addressButton: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressButtonSelected: {
    borderColor: TossColors.primary,
    backgroundColor: TossColors.secondary,
  },
  addressButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressButtonText: {
    fontSize: 16,
    color: TossColors.textTertiary,
    marginLeft: 12,
    flex: 1,
  },
  addressButtonTextSelected: {
    color: TossColors.text,
  },
  
  // 카테고리별 사진 업로드 스타일
  photoCategoriesContainer: {
    gap: 20,
  },
  photoCategorySection: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  photoCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photoCategoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  photoCategoryTextContainer: {
    flex: 1,
  },
  photoCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 2,
  },
  photoCategoryTitleRequired: {
    color: TossColors.error,
  },
  requiredAsterisk: {
    color: TossColors.error,
  },
  photoCategoryDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
    lineHeight: 18,
  },
  photoCategoryCount: {
    backgroundColor: TossColors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  photoCategoryCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  photoCategoryCountComplete: {
    backgroundColor: TossColors.success + '20',
    color: TossColors.success,
  },
  photoCategoryCountRequired: {
    backgroundColor: TossColors.error + '20',
    color: TossColors.error,
  },
  categoryUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: TossColors.primary,
    marginBottom: 12,
  },
  categoryUploadButtonRequired: {
    borderColor: TossColors.error,
    backgroundColor: TossColors.error + '10',
  },
  categoryUploadButtonDisabled: {
    borderColor: TossColors.success,
    backgroundColor: TossColors.success + '10',
  },
  categoryUploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
    marginLeft: 8,
  },
  categoryUploadButtonTextRequired: {
    color: TossColors.error,
  },
  categoryUploadButtonTextDisabled: {
    color: TossColors.success,
  },
  categoryImagesScroll: {
    marginHorizontal: -4,
  },
  categoryImageItem: {
    position: 'relative',
    marginHorizontal: 4,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: TossColors.border,
  },
  categoryImageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: TossColors.background,
    borderRadius: 10,
  },
  
  // 사진 업로드 요약
  photoSummaryContainer: {
    backgroundColor: TossColors.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  photoSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 8,
  },
  photoSummaryStats: {
    gap: 4,
  },
  photoSummaryText: {
    fontSize: 14,
    color: TossColors.textSecondary,
  },
  photoSummaryDetail: {
    fontSize: 12,
    color: TossColors.textTertiary,
  },
  
  // 축의금 설정 - 토스 스타일
  moneyPresetContainer: {
    gap: 16,
  },
  moneyPresetCard: {
    backgroundColor: TossColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  moneyPresetCardSelected: {
    backgroundColor: TossColors.secondary,
    borderColor: TossColors.primary,
    borderWidth: 2,
  },
  moneyPresetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  moneyPresetInfo: {
    flex: 1,
  },
  moneyPresetLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 4,
  },
  moneyPresetLabelSelected: {
    color: TossColors.primary,
  },
  moneyPresetDescription: {
    fontSize: 14,
    color: TossColors.textSecondary,
    lineHeight: 20,
  },
  moneyPresetDescriptionSelected: {
    color: TossColors.primary,
  },
  moneyPresetCheckIcon: {
    marginLeft: 12,
  },
  moneyPresetAmounts: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  moneyAmountChip: {
    backgroundColor: TossColors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moneyAmountChipSelected: {
    backgroundColor: TossColors.primary + '20',
  },
  moneyAmountText: {
    fontSize: 13,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  moneyAmountTextSelected: {
    color: TossColors.primary,
  },
  
  // 템플릿 선택
  templateGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: TossColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  templateCardSelected: {
    borderColor: TossColors.primary,
    borderWidth: 2,
  },
  templateImageContainer: {
    position: 'relative',
  },
  templateImage: {
    width: '100%',
    height: 200,
    backgroundColor: TossColors.border,
  },
  templateSelectedOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: TossColors.primary,
    borderRadius: 20,
    padding: 4,
  },
  templateInfo: {
    padding: 16,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: TossColors.textSecondary,
    marginBottom: 12,
  },
  templateFeatures: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  templateFeature: {
    backgroundColor: TossColors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  templateFeatureText: {
    fontSize: 11,
    color: TossColors.textSecondary,
  },
  templatePreviewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.secondary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  templatePreviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
  },
  
  // 완성 화면
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.background,
    paddingHorizontal: 40,
  },
  completionContent: {
    alignItems: 'center',
  },
  completionIconContainer: {
    marginBottom: 24,
  },
  completionEmoji: {
    fontSize: 80,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TossColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 16,
    color: TossColors.textSecondary,
    textAlign: 'center',
  },
  
  // 하단 버튼
  bottomButtonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: TossColors.background,
    borderTopWidth: 1,
    borderTopColor: TossColors.border,
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.surface,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: TossColors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: TossColors.disabled,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
  },
  
  // 토스 스타일 모달
  tossModalOverlay: {
    flex: 1,
    backgroundColor: TossColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  tossModalContainer: {
    backgroundColor: TossColors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  tossModalContent: {
    padding: 32,
    alignItems: 'center',
  },
  tossModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  tossModalMessage: {
    fontSize: 15,
    color: TossColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tossModalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: TossColors.border,
  },
  tossModalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: TossColors.border,
  },
  tossModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: TossColors.textSecondary,
  },
  tossModalConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tossModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.primary,
  },
  
  // 토스 스타일 피커
  tossPickerOverlay: {
    flex: 1,
    backgroundColor: TossColors.overlay,
    justifyContent: 'flex-end',
  },
  tossPickerContainer: {
    backgroundColor: TossColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  tossPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
  },
  tossPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
  },
  
  // 달력 스타일
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.secondary,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.text,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  weekendDay: {
    color: TossColors.primary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  selectedDay: {
    backgroundColor: TossColors.primary,
  },
  todayDay: {
    backgroundColor: TossColors.secondary,
    borderWidth: 1,
    borderColor: TossColors.primary,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: TossColors.text,
  },
  selectedDayText: {
    color: TossColors.background,
    fontWeight: '700',
  },
  todayText: {
    color: TossColors.primary,
    fontWeight: '600',
  },
  otherMonthText: {
    color: TossColors.textTertiary,
  },
  pastDayText: {
    color: TossColors.textTertiary,
  },
  sundayText: {
    color: TossColors.error,
  },
  
  // 시간 선택기 스타일
  timePickerCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: TossColors.textSecondary,
  },
  timePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.primary,
  },
  timePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timePickerSection: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 16,
  },
  timePickerList: {
    height: 200,
    width: 80,
  },
  timePickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  timePickerItemSelected: {
    backgroundColor: TossColors.secondary,
  },
  timePickerItemText: {
    fontSize: 18,
    color: TossColors.textSecondary,
  },
  timePickerItemTextSelected: {
    color: TossColors.primary,
    fontWeight: '600',
  },
  
  // 미리보기 모달
  previewModalContainer: {
    flex: 1,
    backgroundColor: TossColors.background,
  },
  previewModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewModalSelect: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: TossColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  
  // 디버깅 스타일
  debugContainer: {
    backgroundColor: '#FFE4E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB4B4',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: 8,
  },
  debugImageItem: {
    marginRight: 12,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 8,
    width: 100,
  },
  debugImageText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  debugImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  debugSummary: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 8,
    fontWeight: '600',
  },
  
  previewModalSelectText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
  },
});