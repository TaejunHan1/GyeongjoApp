// src/screens/event/wedding/CreateWeddingScreen.js
import React, { useState, useRef }from 'react';
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
import { createEvent, uploadImageToStorage, deleteImageFromStorage, getCurrentUserInfo, moveImagesToEventFolder,
} from '../../../lib/supabaseHelper';
import DaumPostcode from '../../../components/DaumPostcode';
import WeddingTemplatePreview from '../templates/WeddingTemplatePreview';

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

// 사진 카테고리 설정 - 결혼식용
const WEDDING_PHOTO_CATEGORIES = {
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
const TossDatePicker = ({ visible, selectedDate, onSelect, onClose, allowPastDates = false }) => {
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
                  onPress={() => dayInfo.isCurrentMonth && (allowPastDates || !isPast) && handleDateSelect(dayInfo.date)}
                  disabled={!dayInfo.isCurrentMonth || (!allowPastDates && isPast)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !dayInfo.isCurrentMonth && styles.otherMonthText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayText,
                    (!allowPastDates && isPast) && styles.pastDayText,
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

// 이미지 업로드 진행 상황 모달
const ImageUploadModal = ({ visible, currentIndex, totalCount, onCancel }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.uploadModalOverlay}>
      <View style={styles.uploadModalContainer}>
        <View style={styles.uploadModalContent}>
          <View style={styles.uploadIconContainer}>
            <Ionicons name="cloud-upload-outline" size={48} color={TossColors.primary} />
          </View>
          <Text style={styles.uploadModalTitle}>이미지 업로드 중</Text>
          <Text style={styles.uploadModalMessage}>
            {currentIndex}/{totalCount} 이미지 업로드 중...
          </Text>
          <View style={styles.uploadProgressContainer}>
            <View style={styles.uploadProgressTrack}>
              <View style={[
                styles.uploadProgressFill,
                { width: `${(currentIndex / totalCount) * 100}%` }
              ]} />
            </View>
            <Text style={styles.uploadProgressText}>
              {Math.round((currentIndex / totalCount) * 100)}%
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.uploadModalCancelButton} onPress={onCancel}>
          <Text style={styles.uploadModalCancelText}>취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function CreateWeddingScreen({ navigation, route }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState({
    type: 'wedding', // 🔥 고정값
    title: '',
    date: null,
    time: null,
    location: '',
    detailedAddress: '',
    
    // 결혼식 관련 필드
    groomName: '',
    brideName: '',
    groomFatherName: '',
    groomMotherName: '',
    brideFatherName: '',
    brideMotherName: '',
    groomContact: '',
    brideContact: '',
    groomFatherContact: '',
    groomMotherContact: '',
    brideFatherContact: '',
    brideMotherContact: '',
    ceremonyTime: null,
    receptionTime: null,
    customMessage: '',
    parkingInfo: '',
    
    // 축하메시지 설정
    allowMessages: false,
    messageSettings: {
      placeholder: '축하의 메시지를 남겨주세요.',
      requireLogin: true,
    },
    
    // 공통 필드
    familyRelations: ['신랑측', '신부측'],
    presetAmounts: [100000, 200000, 300000],
    selectedTemplate: null,
    images: [],
  });
  
  // 이미지 업로드 관련 상태
  const [imageUploadState, setImageUploadState] = useState({
    isUploading: false,
    currentIndex: 0,
    totalCount: 0,
    uploadingCategory: null,
  });
  
  // 스크롤 및 입력 필드 참조
  const scrollViewRef = useRef(null);
  const sectionPositions = useRef({
    names: 0,
    contact: 0,
    parents: 0,
    dateTime: 0,
    location: 0,
    photos: 0,
    weddingMessageSettings: 0,
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

  // 🔥 템플릿 목록 - 로맨틱 핑크 추가
  const templates = {
    wedding: [
      {
        id: 'modern-dark',
        name: '모던 다크',
        description: '세련되고 감각적인 디자인',
        preview: require('../../../../assets/images/aa1.png'),
        style: 'modern-dark',
        features: ['다크 모드', '그라디언트'],
      },
      {
        id: 'romantic-pink',  // 🔥 새로 추가
        name: '로맨틱 핑크',
        description: '따뜻하고 로맨틱한 분위기',
        preview: require('../../../../assets/images/aa2.png'),
        style: 'romantic-pink',
        features: ['핑크 톤', '감성적 디자인'],
      },
      {
        id: 'korean-elegant', 
        name: '한국 전통',
        description: '우아한 한국 전통 스타일',
        preview: require('../../../../assets/images/aa3.png'),
        style: 'korean-elegant',
        features: ['전통 색상', '한국적 레이아웃'],
      },
      {
        id: 'vintage-app',
        name: '빈티지 앱',
        description: '트렌디한 스토리 스타일',
        preview: require('../../../../assets/images/aa2.png'),
        style: 'vintage-app',
        features: ['스토리 타임라인', '모던 색감'],
      },
      {
        id: 'elegant-garden',
        name: '가든 보타닉',
        description: '트렌디한 스토리 스타일',
        preview: require('../../../../assets/images/aa1.png'),
        style: 'elegant-garden',
        features: ['스토리 타임라인', '모던 색감'],
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

  // 핸드폰 번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 010으로 시작하지 않으면 010 추가
    let formattedNumbers = numbers;
    if (!numbers.startsWith('010')) {
      formattedNumbers = '010' + numbers;
    }
    
    // 최대 11자리까지만
    formattedNumbers = formattedNumbers.slice(0, 11);
    
    // 포맷팅 적용
    if (formattedNumbers.length <= 3) {
      return formattedNumbers;
    } else if (formattedNumbers.length <= 7) {
      return `${formattedNumbers.slice(0, 3)}-${formattedNumbers.slice(3)}`;
    } else {
      return `${formattedNumbers.slice(0, 3)}-${formattedNumbers.slice(3, 7)}-${formattedNumbers.slice(7)}`;
    }
  };

  // 경조사 타입에 따른 축의금 설정 (결혼식 전용)
  const getMoneyPresets = () => {
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

  // 사진 관련 함수들
  const getCategoryImageCount = (category) => {
    const count = eventData.images.filter(img => img.category === category).length;
    console.log(`🔍 [DEBUG] ${category} 카테고리 이미지 개수:`, count);
    return count;
  };

  const getCategoryImages = (category) => {
    const images = eventData.images.filter(img => img.category === category);
    console.log(`🔍 [DEBUG] ${category} 카테고리 이미지들:`, images.map(img => ({ id: img.id, category: img.category })));
    return images;
  };

  const removeImage = async (imageId) => {
    console.log('🔍 [DEBUG] 이미지 제거 요청 ID:', imageId);
    
    setEventData(prevData => {
      const imageToRemove = prevData.images.find(img => img.id === imageId);
      console.log('🔍 [DEBUG] 제거할 이미지:', imageToRemove);
      
      // Storage에서 이미지 삭제 (백그라운드에서 실행)
      if (imageToRemove?.storagePath) {
        deleteImageFromStorage(imageToRemove.storagePath)
          .then(result => {
            if (result.success) {
              console.log('✅ Storage에서 이미지 삭제 완료:', imageToRemove.storagePath);
            } else {
              console.log('⚠️ Storage 이미지 삭제 실패:', result.error);
            }
          })
          .catch(error => {
            console.log('⚠️ Storage 이미지 삭제 중 오류:', error);
          });
      }
      
      const newImages = prevData.images.filter(img => img.id !== imageId);
      console.log('🔍 [DEBUG] 제거 후 남은 이미지들:', newImages.map(img => ({ id: img.id, category: img.category })));
      
      return { 
        ...prevData, 
        images: newImages 
      };
    });
  };

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
        
        const userResult = await getCurrentUserInfo();
        if (!userResult.success) {
          showTossModal('오류', '사용자 정보를 확인할 수 없어요. 다시 로그인해주세요.', () => {});
          return;
        }
  
        const currentUser = userResult.user;
        const selectedImages = result.assets.slice(0, remainingCount);
        const tempEventId = `temp_${Date.now()}`;
        
        setImageUploadState({
          isUploading: true,
          currentIndex: 0,
          totalCount: selectedImages.length,
          uploadingCategory: category.label,
        });
  
        console.log('🔍 [DEBUG] 이미지 업로드 시작:', selectedImages.length, '개');
  
        const uploadPromises = selectedImages.map(async (asset, index) => {
          try {
            const timestamp = new Date().getTime();
            const fileName = `${category.key}_${timestamp}_${index}.jpg`;
            
            console.log('🔍 [DEBUG] 개별 이미지 업로드 시작:', fileName);
  
            const uploadResult = await uploadImageToStorage(asset.uri, fileName, currentUser.id, tempEventId);
            
            setImageUploadState(prev => ({
              ...prev,
              currentIndex: prev.currentIndex + 1,
            }));
            
            if (uploadResult.success) {
              console.log('✅ 개별 이미지 업로드 성공:', uploadResult.data.publicUrl);
              return {
                ...asset,
                category: category.key,
                categoryLabel: category.label,
                id: `${category.key}_${timestamp}_${index}`,
                publicUrl: uploadResult.data.publicUrl,
                storagePath: uploadResult.data.path,
                eventId: tempEventId,
                uploadSuccess: true,
              };
            } else {
              console.error('❌ 개별 이미지 업로드 실패:', uploadResult.error);
              return {
                ...asset,
                category: category.key,
                categoryLabel: category.label,
                id: `${category.key}_${timestamp}_${index}`,
                eventId: tempEventId,
                uploadSuccess: false,
                error: uploadResult.error,
              };
            }
          } catch (error) {
            console.error('❌ 개별 이미지 처리 오류:', error);
            return {
              ...asset,
              category: category.key,
              categoryLabel: category.label,
              id: `${category.key}_${Date.now()}_${index}`,
              eventId: tempEventId,
              uploadSuccess: false,
              error: error.message,
            };
          }
        });
  
        const results = await Promise.all(uploadPromises);
        
        setImageUploadState({
          isUploading: false,
          currentIndex: 0,
          totalCount: 0,
          uploadingCategory: null,
        });
  
        const successfulUploads = results.filter(result => result.uploadSuccess);
        const failedUploads = results.filter(result => !result.uploadSuccess);
        
        console.log('🔍 [DEBUG] 업로드 결과:', {
          total: results.length,
          success: successfulUploads.length,
          failed: failedUploads.length
        });
  
        if (successfulUploads.length > 0) {
          setEventData(prevData => {
            let updatedImages;
            
            if (category.maxCount === 1) {
              const otherCategoryImages = prevData.images.filter(img => img.category !== category.key);
              updatedImages = [...otherCategoryImages, ...successfulUploads];
            } else {
              updatedImages = [...prevData.images, ...successfulUploads];
            }
  
            console.log('🔍 [DEBUG] 최종 이미지 배열 업데이트:', updatedImages.length, '개');
            
            return {
              ...prevData,
              images: updatedImages,
              tempEventId: tempEventId,
            };
          });
  
          if (failedUploads.length > 0) {
            showTossModal(
              '일부 업로드 실패', 
              `${successfulUploads.length}장은 성공했지만 ${failedUploads.length}장 업로드에 실패했어요. 다시 시도해주세요.`, 
              () => {}
            );
          } else {
            showTossModal(
              '업로드 완료', 
              `${successfulUploads.length}장의 이미지가 성공적으로 업로드되었어요!`, 
              () => {}
            );
          }
        } else {
          showTossModal('업로드 실패', '이미지 업로드에 실패했어요. 네트워크 상태를 확인하고 다시 시도해주세요.', () => {});
        }
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 이미지 선택 오류:', error);
      setImageUploadState({
        isUploading: false,
        currentIndex: 0,
        totalCount: 0,
        uploadingCategory: null,
      });
      showTossModal('오류', '사진 선택 중 문제가 발생했어요', () => {});
    }
  };
  
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
      const eventTitle = `${eventData.groomName} ♥ ${eventData.brideName} 결혼식`;

      const categorizedImages = getCategorizedImages();
      console.log('🔍 [DEBUG] 저장할 카테고리별 이미지:', categorizedImages);

      const fullLocation = eventData.detailedAddress 
        ? `${eventData.location} ${eventData.detailedAddress}`.trim()
        : eventData.location.trim();

      const parentsContactInfo = {
        groom_father_contact: eventData.groomFatherContact || null,
        groom_mother_contact: eventData.groomMotherContact || null,
        bride_father_contact: eventData.brideFatherContact || null,
        bride_mother_contact: eventData.brideMotherContact || null,
        reception_time: eventData.receptionTime && eventData.receptionTime instanceof Date && !isNaN(eventData.receptionTime.getTime()) ? 
          eventData.receptionTime.toTimeString().split(' ')[0] : null,
      };

      let formattedEventData = {
        event_type: 'wedding', // 🔥 고정
        event_name: eventTitle,
        template_style: eventData.selectedTemplate?.style || 'modern-dark',
        family_relations: eventData.familyRelations,
        preset_amounts: eventData.presetAmounts,
        status: 'active',
        is_finalized: false,
        
        image_urls: eventData.images.map(img => ({
          uri: img.publicUrl || img.uri,
          category: img.category,
          categoryLabel: img.categoryLabel,
          id: img.id,
          storagePath: img.storagePath || null,
          publicUrl: img.publicUrl || null,
          eventId: img.eventId || null
        })),
        
        allow_messages: eventData.allowMessages,
        message_placeholder: eventData.messageSettings.placeholder,
        
        event_date: eventData.date && eventData.date instanceof Date && !isNaN(eventData.date.getTime()) ? 
          eventData.date.toISOString().split('T')[0] : null,
        location: fullLocation || null,
        detailed_address: eventData.detailedAddress.trim() || null,
        main_person_name: `${eventData.groomName}, ${eventData.brideName}`,
        bride_name: eventData.brideName.trim(),
        groom_name: eventData.groomName.trim(),
        bride_father_name: eventData.brideFatherName.trim() || null,
        bride_mother_name: eventData.brideMotherName.trim() || null,
        groom_father_name: eventData.groomFatherName.trim() || null,
        groom_mother_name: eventData.groomMotherName.trim() || null,
        bride_contact: eventData.brideContact || null,
        groom_contact: eventData.groomContact || null,
        ceremony_time: eventData.ceremonyTime && eventData.ceremonyTime instanceof Date && !isNaN(eventData.ceremonyTime.getTime()) ? 
          eventData.ceremonyTime.toTimeString().split(' ')[0] : null,
        custom_message: eventData.customMessage.trim() || null,
        parking_info: eventData.parkingInfo.trim() || null,
        additional_info: {
          ...parentsContactInfo,
          categorized_images: categorizedImages,
          message_settings: eventData.messageSettings,
        }
      };

      console.log('🔍 [DEBUG] 최종 저장 데이터 - 이미지 정보:', {
        totalImages: formattedEventData.image_urls.length,
        imagesWithPublicUrl: formattedEventData.image_urls.filter(img => img.publicUrl).length,
        imagesWithStoragePath: formattedEventData.image_urls.filter(img => img.storagePath).length,
      });

      const result = await createEvent(formattedEventData);

      if (result.success) {
        console.log('✅ 결혼식 이벤트 생성 및 이미지 저장 완료, ID:', result.data.id);
        
        setCurrentStep(3);
        setTimeout(() => {
          navigation.navigate('EventDisplay', { 
            eventId: result.data.id,
            templateStyle: eventData.selectedTemplate?.style || 'modern-dark',
            categorizedImages: categorizedImages,
            allowMessages: eventData.allowMessages,
            messageSettings: eventData.messageSettings,
          });
        }, 2000);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('🔍 [DEBUG] 결혼식 저장 오류:', error);
      showTossModal('오류', '결혼식 청첩장 생성 중 문제가 발생했어요', () => {});
    } finally {
      setIsLoading(false);
    }
  };

  // 연락처 입력 핸들러
  const handleContactChange = (text, field) => {
    const formattedNumber = formatPhoneNumber(text);
    setEventData({ ...eventData, [field]: formattedNumber });
  };

  // 업로드 취소 핸들러
  const handleUploadCancel = () => {
    setImageUploadState({
      isUploading: false,
      currentIndex: 0,
      totalCount: 0,
      uploadingCategory: null,
    });
    showTossModal('업로드 취소', '이미지 업로드가 취소되었습니다.', () => {});
  };

  // 메인 렌더링 함수들
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
        <Text style={styles.sectionSubtitle}>결혼식이 열리는 날짜와 시간을 선택해주세요</Text>
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
        <Text style={styles.sectionSubtitle}>결혼식이 열리는 장소를 입력해주세요</Text>
      </View>
      
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>주소</Text>
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
          <Text style={styles.inputLabel}>상세 주소</Text>
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

  const renderWeddingMessageSettingsForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.weddingMessageSettings = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>축하 메시지</Text>
        <Text style={styles.sectionSubtitle}>하객들이 축하 메시지를 남길 수 있게 할지 설정해주세요</Text>
      </View>
      
      {/* 방명록 허용 여부 토글 */}
      <View style={styles.messageToggleContainer}>
        <TouchableOpacity
          style={styles.messageToggle}
          onPress={() => setEventData({ 
            ...eventData, 
            allowMessages: !eventData.allowMessages 
          })}
        >
          <View style={styles.messageToggleLeft}>
            <View style={styles.messageToggleIcon}>
              <Ionicons 
                name="heart-outline" 
                size={20} 
                color={eventData.allowMessages ? TossColors.primary : TossColors.textSecondary} 
              />
            </View>
            <View style={styles.messageToggleTextContainer}>
              <Text style={[
                styles.messageToggleTitle,
                eventData.allowMessages && styles.messageToggleTitleActive
              ]}>
                축하 메시지 허용
              </Text>
              <Text style={styles.messageToggleDescription}>
                하객들이 온라인으로 축하 메시지를 남길 수 있어요
              </Text>
            </View>
          </View>
          <View style={[
            styles.toggleSwitch,
            eventData.allowMessages && styles.toggleSwitchActive
          ]}>
            <View style={[
              styles.toggleSwitchKnob,
              eventData.allowMessages && styles.toggleSwitchKnobActive
            ]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 방명록이 활성화된 경우 추가 설정 */}
      {eventData.allowMessages && (
        <View style={styles.messageSettingsDetails}>
          <View style={styles.messageSettingCard}>
            <View style={styles.messageSettingHeader}>
              <Ionicons name="shield-checkmark" size={20} color={TossColors.success} />
              <Text style={styles.messageSettingTitle}>회원 인증 필요</Text>
            </View>
            <Text style={styles.messageSettingDescription}>
              축하 메시지 작성 시 회원가입이 필요합니다.{'\n'}
              소중한 메시지 환경을 위해 본인 인증을 진행해요.
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>메시지 안내문</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              placeholder="축하의 메시지를 남겨주세요."
              value={eventData.messageSettings.placeholder}
              onChangeText={(text) => setEventData({ 
                ...eventData, 
                messageSettings: { 
                  ...eventData.messageSettings, 
                  placeholder: text 
                }
              })}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              placeholderTextColor={TossColors.textTertiary}
            />
            <Text style={styles.inputHint}>
              하객들에게 표시될 메시지 입력 안내문이에요
            </Text>
          </View>

          <View style={styles.messagePreviewContainer}>
            <Text style={styles.messagePreviewTitle}>미리보기</Text>
            <View style={styles.messagePreviewBox}>
              <View style={styles.messagePreviewHeader}>
                <Ionicons name="heart" size={16} color={TossColors.primary} />
                <Text style={styles.messagePreviewHeaderText}>축하 메시지 작성</Text>
              </View>
              <Text style={styles.messagePreviewPlaceholder}>
                {eventData.messageSettings.placeholder || "축하의 메시지를 남겨주세요."}
              </Text>
              <View style={styles.messagePreviewButton}>
                <Text style={styles.messagePreviewButtonText}>메시지 남기기</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 방명록이 비활성화된 경우 안내 */}
      {!eventData.allowMessages && (
        <View style={styles.messageDisabledContainer}>
          <Ionicons name="heart-half-outline" size={32} color={TossColors.textTertiary} />
          <Text style={styles.messageDisabledText}>
            축하 메시지 기능을 사용하지 않습니다
          </Text>
          <Text style={styles.messageDisabledSubtext}>
            언제든지 위의 토글로 기능을 활성화할 수 있어요
          </Text>
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

  // 카테고리별 사진 업로드 폼
  const renderPhotoUploadForm = () => {
    return (
      <Animated.View 
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        onLayout={(event) => {
          sectionPositions.current.photos = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>사진 업로드</Text>
          <Text style={styles.sectionSubtitle}>카테고리별로 사진을 업로드해주세요 (자동으로 클라우드에 저장됩니다)</Text>
        </View>

        <View style={styles.photoCategoriesContainer}>
          {Object.values(WEDDING_PHOTO_CATEGORIES).map((category) => {
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
                    isRequired && styles.categoryUploadButtonRequired,
                    imageUploadState.isUploading && styles.categoryUploadButtonUploading
                  ]}
                  onPress={() => {
                    console.log('🔍 [DEBUG] 업로드 버튼 클릭:', category.key);
                    pickImagesForCategory(category);
                  }}
                  disabled={isComplete || imageUploadState.isUploading}
                >
                  <Ionicons 
                    name={isComplete ? "checkmark-circle" : 
                         imageUploadState.isUploading ? "cloud-upload" : "camera"} 
                    size={20} 
                    color={isComplete ? TossColors.success : 
                           imageUploadState.isUploading ? TossColors.warning :
                           isRequired ? TossColors.error : TossColors.primary} 
                  />
                  <Text style={[
                    styles.categoryUploadButtonText,
                    isComplete && styles.categoryUploadButtonTextDisabled,
                    isRequired && styles.categoryUploadButtonTextRequired,
                    imageUploadState.isUploading && styles.categoryUploadButtonTextUploading
                  ]}>
                    {imageUploadState.isUploading ? '업로드 중...' :
                     isComplete ? '업로드 완료' : 
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
                        <Image source={{ uri: image.publicUrl || image.uri }} style={styles.categoryImage} />
                        
                        {/* 업로드 상태 표시 */}
                        <View style={styles.categoryImageStatus}>
                          <Ionicons 
                            name={image.publicUrl ? "cloud-done" : "cloud-upload-outline"} 
                            size={12} 
                            color={image.publicUrl ? TossColors.success : TossColors.warning} 
                          />
                        </View>
                        
                        <TouchableOpacity
                          style={styles.categoryImageRemove}
                          onPress={() => {
                            console.log('🔍 [DEBUG] 이미지 제거 버튼 클릭:', image.id, image.category);
                            removeImage(image.id);
                          }}
                          disabled={imageUploadState.isUploading}
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

        {/* 전체 업로드 현황 요약 */}
        <View style={styles.photoSummaryContainer}>
          <Text style={styles.photoSummaryTitle}>업로드 현황</Text>
          <View style={styles.photoSummaryStats}>
            <Text style={styles.photoSummaryText}>
              총 {eventData.images.length}장 선택됨
            </Text>
            <Text style={styles.photoSummaryDetail}>
              클라우드 저장: {eventData.images.filter(img => img.publicUrl).length}장 / 
              대기 중: {eventData.images.filter(img => !img.publicUrl).length}장
            </Text>
            <Text style={styles.photoSummaryDetail}>
              메인 {getCategoryImageCount('main')}/5, 
              갤러리 {getCategoryImageCount('gallery')}/10, 
              신랑 {getCategoryImageCount('groom')}/1, 
              신부 {getCategoryImageCount('bride')}/1
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderMoneyForm = () => {
    const moneyPresets = getMoneyPresets();
    
    return (
      <Animated.View 
        style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        onLayout={(event) => {
          sectionPositions.current.money = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>축의금 설정</Text>
          <Text style={styles.sectionSubtitle}>참석자들이 선택할 수 있는 축의금 금액을 설정해주세요</Text>
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
        {templates.wedding?.map((template) => (
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
        <Text style={styles.completionTitle}>결혼식 청첩장이 완성되었어요!</Text>
        <Text style={styles.completionSubtitle}>잠시 후 청첩장 화면으로 이동할게요</Text>
      </Animated.View>
    </View>
  );

  const renderStep1 = () => (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
    >
      {renderWeddingForm()}
      {renderContactForm()}
      {renderParentsForm()}
      {renderDateTimeForm()}
      {renderLocationForm()}
      {renderPhotoUploadForm()}
      {renderWeddingMessageSettingsForm()}
      {renderMessageForm()}
      {renderParkingForm()}
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
                (isLoading || imageUploadState.isUploading) && styles.nextButtonDisabled,
                currentStep === 1 && { flex: 1 }
              ]}
              onPress={handleNext}
              disabled={isLoading || imageUploadState.isUploading}
            >
              <Text style={styles.nextButtonText}>
                {isLoading ? '생성 중...' : 
                 imageUploadState.isUploading ? '이미지 업로드 중...' :
                 currentStep === 1 ? '다음' : '결혼식 청첩장 만들기'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 이미지 업로드 진행 모달 */}
        <ImageUploadModal
          visible={imageUploadState.isUploading}
          currentIndex={imageUploadState.currentIndex}
          totalCount={imageUploadState.totalCount}
          onCancel={handleUploadCancel}
        />

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
          allowPastDates={false}
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
                allowMessages={eventData.allowMessages}
                messageSettings={eventData.messageSettings}
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
  inputHint: {
    fontSize: 12,
    color: TossColors.textTertiary,
    marginTop: 6,
    lineHeight: 16,
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
  
  // 방명록 설정 스타일 (공통)
  messageToggleContainer: {
    marginBottom: 24,
  },
  messageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: TossColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  messageToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageToggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TossColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  messageToggleTextContainer: {
    flex: 1,
  },
  messageToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 4,
  },
  messageToggleTitleActive: {
    color: TossColors.primary,
  },
  messageToggleDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
    lineHeight: 18,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: TossColors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: TossColors.primary,
  },
  toggleSwitchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TossColors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleSwitchKnobActive: {
    marginLeft: 20,
  },
  
  messageSettingsDetails: {
    gap: 20,
  },
  messageSettingCard: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  messageSettingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSettingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TossColors.text,
    marginLeft: 8,
  },
  messageSettingDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
    lineHeight: 18,
  },
  
  messagePreviewContainer: {
    marginTop: 8,
  },
  messagePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 12,
  },
  messagePreviewBox: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  messagePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messagePreviewHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
    marginLeft: 8,
  },
  messagePreviewPlaceholder: {
    fontSize: 14,
    color: TossColors.textTertiary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  messagePreviewButton: {
    backgroundColor: TossColors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  messagePreviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.background,
  },
  
  messageDisabledContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  messageDisabledText: {
    fontSize: 16,
    color: TossColors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  messageDisabledSubtext: {
    fontSize: 13,
    color: TossColors.textTertiary,
    textAlign: 'center',
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
  categoryUploadButtonUploading: {
    borderColor: TossColors.warning,
    backgroundColor: TossColors.warning + '10',
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
  categoryUploadButtonTextUploading: {
    color: TossColors.warning,
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
  categoryImageStatus: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: TossColors.background,
    borderRadius: 8,
    padding: 2,
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
  
  // 이미지 업로드 모달
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: TossColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  uploadModalContainer: {
    backgroundColor: TossColors.background,
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  uploadModalContent: {
    padding: 32,
    alignItems: 'center',
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadModalMessage: {
    fontSize: 15,
    color: TossColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  uploadProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  uploadProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: TossColors.border,
    borderRadius: 3,
    marginBottom: 8,
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: TossColors.primary,
    borderRadius: 3,
  },
  uploadProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
  },
  uploadModalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: TossColors.border,
  },
  uploadModalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: TossColors.textSecondary,
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
  previewModalSelectText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
  },
});