// src/screens/event/CreateEventScreen.js - 토스 스타일 완전 개선 버전
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
  primary: '#4A88FF',      // 토스 블루
  secondary: '#F8FAFF',    // 아주 연한 블루
  background: '#FFFFFF',   // 순백
  surface: '#FFFFFF',      // 카드 배경
  text: '#191F28',         // 메인 텍스트
  textSecondary: '#8B95A1', // 서브 텍스트
  textTertiary: '#C1C8D0',  // 플레이스홀더
  border: '#F2F4F6',       // 테두리
  success: '#26C976',      // 성공
  warning: '#FFB800',      // 경고
  error: '#FF6B6B',        // 에러
  disabled: '#F2F4F6',     // 비활성화
  overlay: 'rgba(0, 0, 0, 0.4)', // 오버레이
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
  
  // 사진 카테고리 선택 관련 state
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedImageForCategory, setSelectedImageForCategory] = useState(null);

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
        photoCategories: [
          { key: 'main', label: '메인 사진', icon: '🖼️' },
          { key: 'groom', label: '신랑 사진', icon: '🤵' },
          { key: 'bride', label: '신부 사진', icon: '👰' },
          { key: 'couple', label: '커플 사진', icon: '💕' },
          { key: 'gallery', label: '갤러리', icon: '📷' },
        ]
      },
      {
        id: 'romantic-gold', 
        name: '한국 전통',
        description: '우아한 한국 전통 스타일',
        preview: require('../../../assets/images/aa2.png'),
        style: 'romantic-gold',
        features: ['전통 색상', '한국적 레이아웃'],
        photoCategories: [
          { key: 'main', label: '메인 사진', icon: '🖼️' },
          { key: 'hanbok', label: '한복 사진', icon: '👘' },
          { key: 'ceremony', label: '전통 예식', icon: '🏛️' },
          { key: 'family', label: '가족 사진', icon: '👨‍👩‍👧‍👦' },
          { key: 'gallery', label: '갤러리', icon: '📷' },
        ]
      },
      {
        id: 'vintage-app',
        name: '빈티지 앱',
        description: '트렌디한 스토리 스타일',
        preview: require('../../../assets/images/aa3.png'),
        style: 'vintage-app',
        features: ['스토리 타임라인', '모던 색감'],
        photoCategories: [
          { key: 'first_meet', label: '첫 만남', icon: '👋' },
          { key: 'dating', label: '연인이 되다', icon: '💕' },
          { key: 'proposal', label: '프로포즈', icon: '💍' },
          { key: 'engagement', label: '약혼', icon: '👫' },
          { key: 'wedding', label: '결혼식', icon: '💒' },
          { key: 'honeymoon', label: '신혼여행', icon: '✈️' },
        ]
      },
    ],
    funeral: [
      {
        id: 'funeral-solemn',
        name: '차분한 추모',
        description: '정중하고 엄숙한 분위기',
        preview: require('../../../assets/images/bb1.png'),
        style: 'solemn',
        photoCategories: [
          { key: 'portrait', label: '영정 사진', icon: '🖼️' },
          { key: 'life', label: '생전 모습', icon: '📸' },
          { key: 'family', label: '가족 사진', icon: '👨‍👩‍👧‍👦' },
        ]
      },
    ],
    birthday: [
      {
        id: 'birthday-happy',
        name: '행복한 돌잔치',
        description: '밝고 즐거운 첫 번째 생일',
        preview: require('../../../assets/images/aa1.png'),
        style: 'garden',
        photoCategories: [
          { key: 'baby', label: '아기 사진', icon: '👶' },
          { key: 'growth', label: '성장 과정', icon: '📈' },
          { key: 'family', label: '가족 사진', icon: '👨‍👩‍👧‍👦' },
          { key: 'celebration', label: '축하 순간', icon: '🎉' },
        ]
      },
    ],
    other: [
      {
        id: 'other-celebration',
        name: '기념일 축하',
        description: '특별한 순간을 위한 디자인',
        preview: require('../../../assets/images/aa1.png'),
        style: 'classic',
        photoCategories: [
          { key: 'main', label: '메인 사진', icon: '🖼️' },
          { key: 'celebration', label: '축하 사진', icon: '🎉' },
          { key: 'group', label: '단체 사진', icon: '👥' },
        ]
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

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showTossModal('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요해요', () => {});
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        const newImage = result.assets[0];
        setSelectedImageForCategory({
          ...newImage,
          tempId: Date.now()
        });
        setShowCategorySelector(true);
      }
    } catch (error) {
      showTossModal('오류', '사진 선택 중 문제가 발생했어요', () => {});
    }
  };

  const getCurrentPhotoCategories = () => {
    if (!eventData.selectedTemplate) {
      return [
        { key: 'main', label: '메인 사진', icon: '🖼️' },
        { key: 'gallery', label: '갤러리', icon: '📷' },
      ];
    }
    return eventData.selectedTemplate.photoCategories || [];
  };

  const getCategoryStats = () => {
    const categories = getCurrentPhotoCategories();
    const stats = {};
    
    categories.forEach(cat => {
      stats[cat.key] = 0;
    });
    
    eventData.images.forEach(img => {
      if (img.category && stats[img.category] !== undefined) {
        stats[img.category]++;
      }
    });
    
    return stats;
  };

  const handleCategorySelect = (category) => {
    if (!selectedImageForCategory) return;

    const imageWithCategory = {
      ...selectedImageForCategory,
      category: category.key,
      categoryLabel: category.label,
      id: selectedImageForCategory.tempId
    };

    if (category.key !== 'gallery') {
      const newImages = eventData.images.filter(img => img.category !== category.key);
      setEventData({
        ...eventData,
        images: [...newImages, imageWithCategory].slice(0, 20),
      });
    } else {
      setEventData({
        ...eventData,
        images: [...eventData.images, imageWithCategory].slice(0, 20),
      });
    }

    setShowCategorySelector(false);
    setSelectedImageForCategory(null);
  };

  const removeImage = (index) => {
    const newImages = eventData.images.filter((_, i) => i !== index);
    setEventData({ ...eventData, images: newImages });
  };

  const handleTemplatePreview = (template) => {
    setPreviewTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleTemplateSelect = (template) => {
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
          additional_info: parentsContactInfo
        }),
        
        status: 'active',
        is_finalized: false,
        image_urls: [],
      };

      const result = await createEvent(formattedEventData);

      if (result.success) {
        setCurrentStep(3);
        setTimeout(() => {
          navigation.navigate('EventDisplay', { 
            eventId: result.data.id,
            templateStyle: eventData.selectedTemplate?.style || 'modern-dark'
          });
        }, 2000);
      } else {
        showTossModal('오류', '경조사 등록에 실패했어요. 다시 시도해주세요', () => {});
      }
    } catch (error) {
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

  const renderPhotoUploadForm = () => (
    <Animated.View 
      style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      onLayout={(event) => {
        sectionPositions.current.photos = event.nativeEvent.layout.y;
      }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>사진 업로드</Text>
        <Text style={styles.sectionSubtitle}>경조사에 사용할 사진들을 업로드해주세요</Text>
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
        <View style={styles.uploadButtonContent}>
          <Ionicons name="camera" size={24} color={TossColors.primary} />
          <Text style={styles.uploadButtonText}>사진 추가하기</Text>
        </View>
      </TouchableOpacity>

      {eventData.images.length > 0 && (
        <View style={styles.uploadedImagesContainer}>
          <Text style={styles.uploadedImagesTitle}>업로드된 사진 ({eventData.images.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uploadedImagesScroll}>
            {eventData.images.map((image, index) => (
              <View key={image.id || index} style={styles.uploadedImageItem}>
                <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                
                {image.category && (
                  <View style={styles.uploadedImageCategory}>
                    <Text style={styles.uploadedImageCategoryText}>
                      {getCurrentPhotoCategories().find(cat => cat.key === image.category)?.icon || '📷'}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.uploadedImageRemove}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={20} color={TossColors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
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
              
              <View style={styles.templateFeatures}>
                {template.features.map((feature, index) => (
                  <View key={index} style={styles.templateFeature}>
                    <Text style={styles.templateFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>
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

        {/* 사진 카테고리 선택 모달 */}
        <Modal
          visible={showCategorySelector}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategorySelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.categoryModal}>
              <View style={styles.categoryModalHeader}>
                <Text style={styles.categoryModalTitle}>사진 용도 선택</Text>
                <TouchableOpacity
                  style={styles.categoryModalClose}
                  onPress={() => setShowCategorySelector(false)}
                >
                  <Ionicons name="close" size={24} color={TossColors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.categoryModalSubtitle}>
                이 사진을 어떤 용도로 사용하시겠어요?
              </Text>
              
              <ScrollView style={styles.categoryList}>
                {getCurrentPhotoCategories().map((category) => {
                  const currentCount = getCategoryStats()[category.key] || 0;
                  const isDisabled = category.key !== 'gallery' && currentCount >= 1;
                  
                  return (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryItem,
                        isDisabled && styles.categoryItemDisabled
                      ]}
                      onPress={() => !isDisabled && handleCategorySelect(category)}
                      disabled={isDisabled}
                    >
                      <View style={styles.categoryItemContent}>
                        <Text style={styles.categoryItemIcon}>{category.icon}</Text>
                        <View style={styles.categoryItemText}>
                          <Text style={[
                            styles.categoryItemLabel,
                            isDisabled && styles.categoryItemLabelDisabled
                          ]}>
                            {category.label}
                          </Text>
                          {isDisabled && (
                            <Text style={styles.categoryItemDisabledText}>
                              이미 설정되어 있어요
                            </Text>
                          )}
                        </View>
                      </View>
                      {!isDisabled && (
                        <Ionicons name="chevron-forward" size={20} color={TossColors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
  
  // 사진 업로드
  uploadButton: {
    backgroundColor: TossColors.surface,
    borderRadius: 12,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: TossColors.border,
    borderStyle: 'dashed',
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.primary,
    marginLeft: 8,
  },
  
  // 업로드된 사진
  uploadedImagesContainer: {
    marginTop: 20,
  },
  uploadedImagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 12,
  },
  uploadedImagesScroll: {
    marginHorizontal: -4,
  },
  uploadedImageItem: {
    position: 'relative',
    marginHorizontal: 4,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: TossColors.border,
  },
  uploadedImageCategory: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: TossColors.primary,
    borderRadius: 8,
    padding: 4,
  },
  uploadedImageCategoryText: {
    fontSize: 10,
  },
  uploadedImageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: TossColors.background,
    borderRadius: 10,
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
  
  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: TossColors.overlay,
    justifyContent: 'flex-end',
  },
  categoryModal: {
    backgroundColor: TossColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    overflow: 'hidden',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
  },
  categoryModalClose: {
    padding: 4,
  },
  categoryModalSubtitle: {
    fontSize: 14,
    color: TossColors.textSecondary,
    padding: 20,
    paddingBottom: 0,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryItemDisabled: {
    opacity: 0.5,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryItemText: {
    flex: 1,
  },
  categoryItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
  },
  categoryItemLabelDisabled: {
    color: TossColors.textSecondary,
  },
  categoryItemDisabledText: {
    fontSize: 12,
    color: TossColors.error,
    marginTop: 4,
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