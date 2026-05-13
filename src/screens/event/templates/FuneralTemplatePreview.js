// src/screens/event/templates/FuneralTemplatePreview.js - 메시지 기능 추가
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const FUNERAL_PREVIEW_FRAME_WIDTH = Math.min(width - 40, 360);
const FUNERAL_PREVIEW_FRAME_HEIGHT = Math.round(FUNERAL_PREVIEW_FRAME_WIDTH * 1.78);
const FUNERAL_PREVIEW_FULL_HERO_HEIGHT = FUNERAL_PREVIEW_FRAME_HEIGHT;
const FUNERAL_PREVIEW_PAPER_HERO_HEIGHT = Math.round(Math.min(width - 64, 340) * 1.78);
const FUNERAL_EDITOR_FRAME_WIDTH = width * 0.88;
const IS_TABLET_PREVIEW = Math.min(width, height) >= 600;
const TABLET_MEMORIAL_TEXT_Y_OFFSET = IS_TABLET_PREVIEW ? -10 : 0;
const MOBILE_NAME_TEXT_Y_OFFSET = IS_TABLET_PREVIEW ? 0 : 1;
const FUNERAL_MAIN_PHOTO_LAYOUT_DEFAULT = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};
const FUNERAL_MEMORIAL_TEXT_LAYOUT_DEFAULT = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};
const FUNERAL_PHOTO_FRAME_SOURCES = {
  'funeral-template-modern-card': require('../../../../assets/funeral/templates/funeral-template-modern-card.png'),
  'funeral-template-editorial-timeline': require('../../../../assets/funeral/templates/funeral-template-editorial-timeline.png'),
  'funeral-template-paper-letter': require('../../../../assets/funeral/templates/funeral-template-paper-letter.png'),
  'funeral-template-certificate': require('../../../../assets/funeral/templates/funeral-template-certificate.png'),
  'funeral-template-classic-flower': require('../../../../assets/funeral/templates/funeral-template-classic-flower.png'),
};
const MODERN_FUNERAL_BACKGROUND = require('../../../../assets/event-card-covers/cover-hanji-gold.png');
const MODERN_FUNERAL_FLOWER_CORNER = require('../../../../assets/studio/elements/2-white-flowers-bottom-left.png');
const MODERN_FUNERAL_COTTON_FLOWER = require('../../../../assets/studio/elements/14-cotton-flower.png');
const MODERN_FUNERAL_DIVIDER = require('../../../../assets/studio/elements/18-divider-flower-horizontal.png');
const MODERN_FUNERAL_OLIVE_BRANCH = require('../../../../assets/studio/elements/7-olive-branch.png');
const MODERN_FUNERAL_SINGLE_LEAF = require('../../../../assets/studio/elements/10-single-leaf-small.png');
const MODERN_FUNERAL_MAGNOLIA_PETALS = require('../../../../assets/studio/elements/12-magnolia-petals.png');
const FUNERAL_PHOTO_FRAME_ASPECT_RATIOS = {
  'funeral-template-modern-card': 1024 / 1535,
  'funeral-template-editorial-timeline': 941 / 1672,
  'funeral-template-paper-letter': 941 / 1672,
  'funeral-template-certificate': 941 / 1672,
  'funeral-template-classic-flower': 1024 / 1535,
};
const FUNERAL_MEMORIAL_FONT_FAMILIES = {
  serif: 'NanumMyeongjo',
  sans: 'GowunDodum',
  'nanum-myeongjo': 'NanumMyeongjo',
  hahmlet: 'Hahmlet',
  'gowun-batang': 'GowunBatang',
  'gowun-dodum': 'GowunDodum',
  sunflower: 'Sunflower',
  'black-han': 'BlackHanSans',
  'yeon-sung': 'YeonSung',
  'single-day': 'SingleDay',
  playfair: 'PlayfairDisplay',
  garamond: 'EBGaramond',
  cinzel: 'Cinzel',
  'great-vibes': 'Great Vibes',
  italianno: 'Italianno',
  dancing: 'DancingScript',
  tangerine: 'Tangerine',
};

// 메시지 입력 모달 컴포넌트
const MessageModal = ({ visible, onClose, onSubmit, placeholder, eventType }) => {
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('알림', '메시지를 입력해주세요.');
      return;
    }

    if (!isAnonymous && !senderName.trim()) {
      Alert.alert('알림', '성함을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const messageData = {
        sender_name: isAnonymous ? '익명' : senderName.trim(),
        sender_phone: senderPhone.trim() || null,
        message: message.trim(),
        message_type: eventType,
        is_anonymous: isAnonymous,
      };

      await onSubmit(messageData);
      
      // 폼 초기화
      setSenderName('');
      setSenderPhone('');
      setMessage('');
      setIsAnonymous(false);
      
      onClose();
    } catch (error) {
      Alert.alert('오류', '메시지 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageLabel = eventType === 'funeral' ? '조문 메시지' : '축하 메시지';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.messageModalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.messageModalContainer}
        >
          <View style={styles.messageModalContent}>
            <View style={styles.messageModalHeader}>
              <Text style={styles.messageModalTitle}>{messageLabel} 작성</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messageModalBody}>
              {/* 익명 여부 */}
              <TouchableOpacity
                style={styles.anonymousToggle}
                onPress={() => setIsAnonymous(!isAnonymous)}
              >
                <View style={styles.anonymousToggleLeft}>
                  <Ionicons 
                    name={isAnonymous ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={isAnonymous ? "#4A88FF" : "#999"} 
                  />
                  <Text style={styles.anonymousToggleText}>익명으로 작성</Text>
                </View>
              </TouchableOpacity>

              {/* 성함 입력 */}
              {!isAnonymous && (
                <View style={styles.messageInputGroup}>
                  <Text style={styles.messageInputLabel}>성함 *</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="성함을 입력해주세요"
                    value={senderName}
                    onChangeText={setSenderName}
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {/* 연락처 입력 (선택사항) */}
              <View style={styles.messageInputGroup}>
                <Text style={styles.messageInputLabel}>연락처 (선택사항)</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="010-0000-0000"
                  value={senderPhone}
                  onChangeText={setSenderPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              {/* 메시지 입력 */}
              <View style={styles.messageInputGroup}>
                <Text style={styles.messageInputLabel}>메시지 *</Text>
                <TextInput
                  style={[styles.messageInput, styles.messageTextArea]}
                  placeholder={placeholder}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.messageModalFooter}>
              <TouchableOpacity
                style={styles.messageSubmitButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.messageSubmitButtonText}>
                  {isSubmitting ? '전송 중...' : `${messageLabel} 남기기`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// 메시지 목록 컴포넌트
const MessageList = ({ messages, eventType }) => {
  const messageLabel = eventType === 'funeral' ? '조문 메시지' : '축하 메시지';
  
  if (!messages || messages.length === 0) {
    return (
      <View style={styles.noMessagesContainer}>
        <Ionicons name="chatbubble-outline" size={32} color="#ccc" />
        <Text style={styles.noMessagesText}>
          아직 {messageLabel}가 없습니다.
        </Text>
        <Text style={styles.noMessagesSubtext}>
          첫 번째 메시지를 남겨보세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.messageListContainer}>
      <Text style={styles.messageListTitle}>
        {messageLabel} ({messages.length})
      </Text>
      
      <ScrollView style={styles.messageListScroll}>
        {messages.map((msg, index) => (
          <View key={index} style={styles.messageItem}>
            <View style={styles.messageItemHeader}>
              <Text style={styles.messageItemName}>
                {msg.sender_name || '익명'}
              </Text>
              <Text style={styles.messageItemDate}>
                {new Date(msg.created_at).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <Text style={styles.messageItemText}>
              {msg.message}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const getAdditionalInfo = (eventData) => eventData.additional_info || eventData.additionalInfo || {};

const normalizeMainPhotoLayout = (layout) => {
  const base = layout && typeof layout === 'object' ? layout : {};
  const scale = Number(base.scale);
  const translateX = Number(base.translateX);
  const translateY = Number(base.translateY);

  return {
    scale: Number.isFinite(scale) ? Math.min(3, Math.max(0.25, scale)) : FUNERAL_MAIN_PHOTO_LAYOUT_DEFAULT.scale,
    translateX: Number.isFinite(translateX) ? Math.min(5000, Math.max(-5000, translateX)) : FUNERAL_MAIN_PHOTO_LAYOUT_DEFAULT.translateX,
    translateY: Number.isFinite(translateY) ? Math.min(5000, Math.max(-5000, translateY)) : FUNERAL_MAIN_PHOTO_LAYOUT_DEFAULT.translateY,
  };
};

const getMainPhotoLayout = (eventData) => {
  const additionalInfo = getAdditionalInfo(eventData);
  const mainPhotoLayout = eventData.mainPhotoLayout || eventData.main_photo_layout || additionalInfo.main_photo_layout || additionalInfo.mainPhotoLayout;
  return normalizeMainPhotoLayout(mainPhotoLayout);
};

const getMainPhotoTransformStyle = (eventData) => {
  const layout = getMainPhotoLayout(eventData);
  return {
    transform: [
      { translateX: layout.translateX },
      { translateY: layout.translateY },
      { scale: layout.scale },
    ],
  };
};

const normalizeMemorialTextLayout = (layout) => {
  const base = layout && typeof layout === 'object' ? layout : {};
  const scale = Number(base.scale);
  const translateX = Number(base.translateX);
  const translateY = Number(base.translateY);

  return {
    scale: Number.isFinite(scale) ? Math.min(1.8, Math.max(0.35, scale)) : FUNERAL_MEMORIAL_TEXT_LAYOUT_DEFAULT.scale,
    translateX: Number.isFinite(translateX) ? Math.min(500, Math.max(-500, translateX)) : FUNERAL_MEMORIAL_TEXT_LAYOUT_DEFAULT.translateX,
    translateY: Number.isFinite(translateY) ? Math.min(500, Math.max(-500, translateY)) : FUNERAL_MEMORIAL_TEXT_LAYOUT_DEFAULT.translateY,
  };
};

const getPhotoFrameSource = (eventData) => {
  const additionalInfo = getAdditionalInfo(eventData);
  const frame = additionalInfo.photo_frame || additionalInfo.photoFrame || eventData.photoFrame;
  const frameKey = frame?.key || frame?.id || eventData.photoFrameKey;
  return FUNERAL_PHOTO_FRAME_SOURCES[frameKey] || FUNERAL_PHOTO_FRAME_SOURCES['funeral-template-modern-card'];
};

const getPhotoFrameAspectRatio = (eventData) => {
  const additionalInfo = getAdditionalInfo(eventData);
  const frame = additionalInfo.photo_frame || additionalInfo.photoFrame || eventData.photoFrame;
  const frameKey = frame?.key || frame?.id || eventData.photoFrameKey;
  return FUNERAL_PHOTO_FRAME_ASPECT_RATIOS[frameKey] || FUNERAL_PHOTO_FRAME_ASPECT_RATIOS['funeral-template-modern-card'];
};

const getMemorialTextSetting = (eventData, target) => {
  const additionalInfo = getAdditionalInfo(eventData);
  const isDate = target === 'date';
  const fontId = isDate
    ? eventData.memorialDateFontId || additionalInfo.memorial_date_font_id || 'serif'
    : eventData.memorialNameFontId || additionalInfo.memorial_name_font_id || 'serif';
  const color = isDate
    ? eventData.memorialDateColor || additionalInfo.memorial_date_color || '#555555'
    : eventData.memorialNameColor || additionalInfo.memorial_name_color || '#222222';
  const layout = normalizeMemorialTextLayout(
    isDate
      ? additionalInfo.memorial_date_layout || eventData.memorialDateLayout
      : additionalInfo.memorial_name_layout || eventData.memorialNameLayout
  );
  const visible = isDate
    ? additionalInfo.memorial_date_visible !== false && eventData.memorialDateVisible !== false
    : additionalInfo.memorial_name_visible !== false && eventData.memorialNameVisible !== false;
  const fontFamily = FUNERAL_MEMORIAL_FONT_FAMILIES[fontId] || FUNERAL_MEMORIAL_FONT_FAMILIES.serif;

  return {
    color,
    fontFamily,
    fontWeight: fontFamily ? '400' : undefined,
    layout,
    visible,
  };
};

const formatMemorialDateOnly = (value) => {
  const date = toValidDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}. ${month}. ${day}`;
};

const getMemorialPeriodText = (eventData) => {
  const birthDate = getFuneralValue(eventData, 'birthDate', 'birth_date');
  const deathDate = getFuneralValue(eventData, 'deathDate', 'death_date');
  const birthText = formatMemorialDateOnly(birthDate);
  const deathText = formatMemorialDateOnly(deathDate);

  if (birthText && deathText) return `${birthText} ~ ${deathText}`;
  return birthText || deathText || '';
};

const FuneralComposedPhoto = ({ eventData, uri, style }) => {
  if (!uri) return null;

  const containerStyle = { ...(StyleSheet.flatten(style) || {}) };
  delete containerStyle.resizeMode;
  const nameSetting = getMemorialTextSetting(eventData, 'name');
  const dateSetting = getMemorialTextSetting(eventData, 'date');
  const mainPhotoTransformStyle = getMainPhotoTransformStyle(eventData);
  const frameSource = getPhotoFrameSource(eventData);
  const frameAspectRatio = getPhotoFrameAspectRatio(eventData);
  delete containerStyle.height;
  containerStyle.aspectRatio = frameAspectRatio;
  const numericFrameWidth = typeof containerStyle.width === 'number' ? containerStyle.width : null;
  const estimatedFrameWidth = numericFrameWidth || (width - 60);
  const translateScale = estimatedFrameWidth / FUNERAL_EDITOR_FRAME_WIDTH;
  const deceasedName = eventData.deceasedName || eventData.deceased_name || '김○○';
  const periodText = getMemorialPeriodText(eventData);

  const getTextTransform = (layout, extraY = 0) => ({
    transform: [
      { translateX: layout.translateX * translateScale },
      { translateY: (layout.translateY * translateScale) + TABLET_MEMORIAL_TEXT_Y_OFFSET + extraY },
      { scale: layout.scale },
    ],
  });

  return (
    <View style={[containerStyle, styles.funeralComposedPhoto]}>
      <View style={[styles.funeralComposedFrameCanvas, { aspectRatio: frameAspectRatio }]}>
        <Image
          source={{ uri }}
          style={[styles.funeralComposedBaseImage, mainPhotoTransformStyle]}
          resizeMode="cover"
        />
        <Image
          source={frameSource}
          style={styles.funeralComposedFrameImage}
          resizeMode="cover"
        />
        {nameSetting.visible && (
          <View
            pointerEvents="none"
            style={[styles.funeralComposedNameOverlay, getTextTransform(nameSetting.layout, MOBILE_NAME_TEXT_Y_OFFSET)]}
          >
            <Text
              style={[
                styles.funeralComposedNameText,
                { color: nameSetting.color, fontFamily: nameSetting.fontFamily, fontWeight: nameSetting.fontWeight },
              ]}
            >
              故 {deceasedName}
            </Text>
          </View>
        )}
        {dateSetting.visible && Boolean(periodText) && (
          <View
            pointerEvents="none"
            style={[styles.funeralComposedDateOverlay, getTextTransform(dateSetting.layout)]}
          >
            <Text
              style={[
                styles.funeralComposedDateText,
                { color: dateSetting.color, fontFamily: dateSetting.fontFamily, fontWeight: dateSetting.fontWeight },
              ]}
            >
              {periodText}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const getFuneralValue = (eventData, camelKey, snakeKey) => {
  const additionalInfo = getAdditionalInfo(eventData);
  return eventData[camelKey] || eventData[snakeKey] || additionalInfo[snakeKey] || additionalInfo[camelKey];
};

const getVisitationLabel = (type) => ({
  available: '조문 가능',
  after_time: '조문 시간 안내',
  family_only: '가족장',
  decline: '조문 사양',
}[type] || null);

const getCondolenceAccounts = (eventData) => {
  const additionalInfo = getAdditionalInfo(eventData);
  return eventData.condolenceAccounts || eventData.condolence_accounts || additionalInfo.condolence_accounts || [];
};

const getFuneralGuidanceItems = (eventData) => {
  const items = [];
  const religiousRite = getFuneralValue(eventData, 'religiousRite', 'religious_rite');
  const funeralMethod = getFuneralValue(eventData, 'funeralMethod', 'funeral_method');
  const visitationType = getFuneralValue(eventData, 'visitationType', 'visitation_type');
  const visitationNote = getFuneralValue(eventData, 'visitationNote', 'visitation_note');
  const parkingTransportInfo = getFuneralValue(eventData, 'parkingTransportInfo', 'parking_transport_info');
  const accounts = getCondolenceAccounts(eventData);

  if (religiousRite || funeralMethod) {
    items.push({
      label: '예식',
      value: [religiousRite, funeralMethod].filter(Boolean).join(' · '),
    });
  }
  if (visitationType || visitationNote) {
    items.push({
      label: '조문',
      value: [getVisitationLabel(visitationType), visitationNote].filter(Boolean).join(' · '),
    });
  }
  if (parkingTransportInfo) {
    items.push({ label: '주차/교통', value: parkingTransportInfo });
  }
  if (accounts.length > 0) {
    items.push({
      label: '부의금 계좌',
      value: accounts
        .map(account => `${account.bank_name || account.bankName || ''} ${account.account_number || account.accountNumber || ''} ${account.owner_name || account.ownerName || ''}`.trim())
        .filter(Boolean)
        .join('\n'),
    });
  }

  return items;
};

const toValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateText = (value) => {
  const date = toValidDate(value);
  if (!date) return '';
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    ...(value && String(value).includes('-') && { year: 'numeric' }),
  });
};

const formatTimeText = (value) => {
  if (!value) return '';
  const date = toValidDate(value);
  if (date && !Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return value;
};

const toDateObject = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toTimeObject = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return {
      hour: value.getHours(),
      minute: value.getMinutes(),
      second: value.getSeconds(),
    };
  }

  if (typeof value !== 'string') return null;
  const timeText = value.trim().slice(0, 5);
  const [hourText, minuteText] = timeText.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  return { hour, minute, second: 0 };
};

const combineDateAndTime = (dateValue, timeValue) => {
  const date = toDateObject(dateValue);
  if (!date) return null;

  const time = toTimeObject(timeValue);
  if (!time) return date;

  const merged = new Date(date);
  merged.setHours(time.hour, time.minute, time.second || 0, 0);
  return merged;
};

const getCurrentFuneralStep = (eventData) => {
  const now = new Date();
  const casketDate = combineDateAndTime(
    eventData.casketDate || eventData.casket_date,
    eventData.casketTime || eventData.casket_time
  );
  const burialDate = combineDateAndTime(
    eventData.burialDate || eventData.burial_date,
    eventData.burialTime || eventData.burial_time
  );

  if (casketDate && burialDate) {
    if (now >= casketDate && now < burialDate) return '입관';
    if (now >= burialDate) return '장지';
  } else if (casketDate && now >= casketDate) {
    return '입관';
  } else if (burialDate && now >= burialDate) {
    return '발인';
  }

  return null;
};

const getFamilyMembersForPreview = (eventData) => {
  const source = (eventData.familyMembers || eventData.family_members || []).filter(
    (member) => member && member.names && member.names.trim()
  );

  if (source.length > 0) {
    return source.slice(0, 6);
  }

  return [
    { relation: '배우자', names: '김○○' },
    { relation: '장남', names: '김○○' },
    { relation: '차남', names: '김○○' },
    { relation: '장녀', names: '김○○' },
    { relation: '차녀', names: '김○○' },
  ];
};

const getDeceasedAge = (eventData) => {
  const age = getFuneralValue(eventData, 'deceasedAge', 'deceased_age') || getFuneralValue(eventData, 'age', 'age');
  return age ? `${age}세` : '미입력';
};

const FuneralGuidanceSection = ({ eventData, variant = 'light' }) => {
  const items = getFuneralGuidanceItems(eventData);
  if (items.length === 0) return null;

  return (
    <View style={[styles.funeralGuideSection, variant === 'dark' && styles.funeralGuideSectionDark]}>
      <Text style={[styles.funeralGuideTitle, variant === 'dark' && styles.funeralGuideTitleDark]}>안내</Text>
      {items.map(item => (
        <View key={item.label} style={styles.funeralGuideItem}>
          <Text style={[styles.funeralGuideLabel, variant === 'dark' && styles.funeralGuideLabelDark]}>{item.label}</Text>
          <Text style={[styles.funeralGuideValue, variant === 'dark' && styles.funeralGuideValueDark]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

// 템플릿 1: 증명서 스타일 (CertificateFuneralNotice 기반)
const CertificateTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [currentDate] = useState(new Date());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = categorizedImages?.main?.[0]?.uri || eventData.images?.[0]?.uri;
  
  const schedules = {
    입관: eventData.casketDate ? new Date(eventData.casketDate) : null,
    발인: eventData.burialDate ? new Date(eventData.burialDate) : null,
    장지: eventData.burialDate ? new Date(eventData.burialDate) : null,
  };

  const getCurrentSchedule = () => {
    if (schedules.입관 && currentDate >= schedules.입관 && currentDate < schedules.발인) return '입관';
    if (schedules.발인 && currentDate >= schedules.발인 && currentDate < schedules.장지) return '발인';
    if (schedules.장지 && currentDate >= schedules.장지) return '장지';
    return null;
  };

  const currentSchedule = getCurrentSchedule();

  const handleMessageSubmit = async (messageData) => {
    try {
      // 실제 구현에서는 API 호출
      if (onMessageSubmit) {
        await onMessageSubmit(messageData);
      }
      
      // 임시로 로컬 상태에 추가
      const newMessage = {
        ...messageData,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  return (
    <ScrollView style={styles.certificateContainer}>
      <SafeAreaView style={styles.safeArea}>
        {/* 메인 증명서 */}
        <View style={styles.certificateMain}>
          
          {/* 헤더 */}
          <View style={styles.certificateHeader}>
            <Text style={styles.certificateTitle}>부 고</Text>
            <Text style={styles.certificateSubtitle}>FUNERAL NOTICE</Text>
            <Text style={styles.certificateNumber}>No. 2025-{new Date().getMonth().toString().padStart(2, '0')}{new Date().getDate().toString().padStart(2, '0')}</Text>
          </View>

          {/* 메인 내용 */}
          <View style={styles.certificateContent}>
            
            {/* 고인 정보 - 중앙 배치 */}
            <View style={styles.certificateDeceasedSection}>
              {mainImage && (
                <View style={styles.certificatePhotoWrapper}>
                  <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.certificatePhoto} />
                </View>
              )}
              
              <View style={styles.certificateDeceasedInfo}>
                <View style={styles.certificateDeceasedLabelWrapper}>
                  <Text style={styles.certificateDeceasedLabel}>고인</Text>
                </View>
                <Text style={styles.certificateDeceasedName}>
                  故 {eventData.deceasedName || eventData.deceased_name || '김○○'}
                </Text>
                
                <View style={styles.certificateDeceasedDetails}>
                  <View style={styles.certificateDetailItem}>
                    <Text style={styles.certificateDetailLabel}>향년</Text>
                    <Text style={styles.certificateDetailValue}>{eventData.deceasedAge || eventData.deceased_age || '78'}세</Text>
                  </View>
                  <View style={styles.certificateDetailItem}>
                    <Text style={styles.certificateDetailLabel}>별세일</Text>
                    <Text style={styles.certificateDetailValue}>
                      {eventData.deathDate ? new Date(eventData.deathDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }) : eventData.death_date ? new Date(eventData.death_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit'
                      }) : '2025년 7월 12일'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 상주 정보 */}
            <View style={styles.certificateSection}>
              <Text style={styles.certificateSectionTitle}>상 주</Text>
              <View style={styles.certificateFamilyGrid}>
                {eventData.familyMembers?.filter(member => member.names && member.names.trim()).slice(0, 4).map((member, index) => (
                  <View key={index} style={styles.certificateFamilyItem}>
                    <Text style={styles.certificateFamilyRelation}>{member.relation}</Text>
                    <Text style={styles.certificateFamilyName}>{member.names}</Text>
                  </View>
                )) || eventData.family_members?.filter(member => member.names && member.names.trim()).slice(0, 4).map((member, index) => (
                  <View key={index} style={styles.certificateFamilyItem}>
                    <Text style={styles.certificateFamilyRelation}>{member.relation}</Text>
                    <Text style={styles.certificateFamilyName}>{member.names}</Text>
                  </View>
                )) || (
                  <>
                    <View style={styles.certificateFamilyItem}>
                      <Text style={styles.certificateFamilyRelation}>장남</Text>
                      <Text style={styles.certificateFamilyName}>김○○</Text>
                    </View>
                    <View style={styles.certificateFamilyItem}>
                      <Text style={styles.certificateFamilyRelation}>차남</Text>
                      <Text style={styles.certificateFamilyName}>김○○</Text>
                    </View>
                    <View style={styles.certificateFamilyItem}>
                      <Text style={styles.certificateFamilyRelation}>장녀</Text>
                      <Text style={styles.certificateFamilyName}>김○○</Text>
                    </View>
                    <View style={styles.certificateFamilyItem}>
                      <Text style={styles.certificateFamilyRelation}>차녀</Text>
                      <Text style={styles.certificateFamilyName}>김○○</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* 일정 */}
            <View style={styles.certificateSection}>
              <Text style={styles.certificateSectionTitle}>장례 일정</Text>
              <View style={styles.certificateScheduleList}>
                
                {/* 입관 일정 (입력된 경우만 표시) */}
                {(eventData.casketDate || eventData.casketTime) && (
                  <View style={[
                    styles.certificateScheduleItem,
                    currentSchedule === '입관' && styles.certificateScheduleItemActive
                  ]}>
                    <View style={styles.certificateScheduleLeft}>
                      <View style={[
                        styles.certificateScheduleIndicator,
                        currentSchedule === '입관' && styles.certificateScheduleIndicatorActive
                      ]} />
                      <Text style={styles.certificateScheduleLabel}>입관</Text>
                    </View>
                    <Text style={styles.certificateScheduleTime}>
                      {eventData.casketDate ? new Date(eventData.casketDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : ''} {eventData.casketTime ? new Date(`1970-01-01T${eventData.casketTime}`).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                    </Text>
                  </View>
                )}

                {/* 발인 일정 */}
                <View style={[
                  styles.certificateScheduleItem,
                  currentSchedule === '발인' && styles.certificateScheduleItemActive
                ]}>
                  <View style={styles.certificateScheduleLeft}>
                    <View style={[
                      styles.certificateScheduleIndicator,
                      currentSchedule === '발인' && styles.certificateScheduleIndicatorActive
                    ]} />
                    <Text style={styles.certificateScheduleLabel}>발인</Text>
                  </View>
                  <Text style={styles.certificateScheduleTime}>
                    {eventData.burialDate ? new Date(eventData.burialDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : '7월 15일'} {eventData.burialTime ? new Date(`1970-01-01T${eventData.burialTime}`).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00'}
                  </Text>
                </View>

                {/* 장지 */}
                <View style={[
                  styles.certificateScheduleItem,
                  currentSchedule === '장지' && styles.certificateScheduleItemActive
                ]}>
                  <View style={styles.certificateScheduleLeft}>
                    <View style={[
                      styles.certificateScheduleIndicator,
                      currentSchedule === '장지' && styles.certificateScheduleIndicatorActive
                    ]} />
                    <Text style={styles.certificateScheduleLabel}>장지</Text>
                  </View>
                  <Text style={styles.certificateScheduleTime}>
                    {eventData.burialLocation || eventData.burial_location || '○○공원묘지'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 빈소 및 연락처 */}
            <View style={styles.certificateInfoSection}>
              
              {/* 빈소 */}
              <View style={styles.certificateInfoBox}>
                <Text style={styles.certificateInfoTitle}>빈소</Text>
                <View style={styles.certificateInfoContent}>
                  <Text style={styles.certificateLocationName}>
                    {eventData.funeralHome || eventData.funeral_home || '○○병원 장례식장'}
                  </Text>
                  <Text style={styles.certificateLocationDetail}>
                    {eventData.detailedAddress || eventData.detailed_address || '3층 특실 302호'}
                  </Text>
                  <View style={styles.certificateLocationAddress}>
                    <Text style={styles.certificateLocationAddressText}>
                      {eventData.location || '서울시 강남구 ○○로 123'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 연락처 */}
              <View style={styles.certificateInfoBox}>
                <Text style={styles.certificateInfoTitle}>연락처</Text>
                <View style={styles.certificateInfoContent}>
                  <View style={styles.certificateContactItem}>
                    <Text style={styles.certificateContactLabel}>상주</Text>
                    <Text style={styles.certificateContactValue}>
                      {eventData.primaryContact || eventData.primary_contact || '010-1234-5678'}
                    </Text>
                  </View>
                  {(eventData.secondaryContact || eventData.secondary_contact) && (
                    <View style={styles.certificateContactItem}>
                      <Text style={styles.certificateContactLabel}>상주</Text>
                      <Text style={styles.certificateContactValue}>
                        {eventData.secondaryContact || eventData.secondary_contact}
                      </Text>
                    </View>
                  )}
                  {(eventData.funeralDirector || eventData.funeral_director) && (
                    <View style={styles.certificateContactItem}>
                      <Text style={styles.certificateContactLabel}>장례지도사</Text>
                      <Text style={styles.certificateContactValue}>
                        {eventData.funeralDirector || eventData.funeral_director}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <FuneralGuidanceSection eventData={eventData} />

            {/* 상주의 말 */}
            {(eventData.customMessage || eventData.custom_message) && (
              <View style={styles.certificateMessageSection}>
                <Text style={styles.certificateSectionTitle}>상주의 말</Text>
                <View style={styles.certificateMessageBox}>
                  <Text style={styles.certificateMessage}>
                    {eventData.customMessage || eventData.custom_message}
                  </Text>
                </View>
              </View>
            )}

            {/* 조문 메시지 섹션 */}
            {allowMessages && (
              <View style={styles.certificateMessageSection}>
                <Text style={styles.certificateSectionTitle}>조문 메시지</Text>
                <MessageList messages={messages} eventType="funeral" />
              </View>
            )}

          </View>

          {/* 하단 */}
          <View style={styles.certificateFooter}>
            <Text style={styles.certificateFooterText}>故人의 명복을 빕니다</Text>
            <Text style={styles.certificateFooterDate}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </Text>
          </View>

          {/* 부조하기 버튼 */}
          {!isPreviewMode && (
          <View style={styles.certificateButtons}>
            <TouchableOpacity style={styles.certificateButton}>
              <Text style={styles.certificateButtonText}>부조하기</Text>
            </TouchableOpacity>
            {allowMessages && (
              <TouchableOpacity 
                style={styles.certificateMessageButton}
                onPress={() => setShowMessageModal(true)}
              >
                <Text style={styles.certificateMessageButtonText}>조문 메시지</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.certificateShareButton}>
              <Text style={styles.certificateShareButtonText}>공유하기</Text>
            </TouchableOpacity>
          </View>
          )}

        </View>

        {/* 메시지 입력 모달 */}
        {!isPreviewMode && allowMessages && (
          <MessageModal
            visible={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            onSubmit={handleMessageSubmit}
            placeholder={messageSettings?.placeholder || '삼가 고인의 명복을 빕니다.'}
            eventType="funeral"
          />
        )}
      </SafeAreaView>
    </ScrollView>
  );
};

// 템플릿 2: 공문서 스타일 (OfficialFuneralNotice 기반)
const OfficialTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [currentDate] = useState(new Date());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = categorizedImages?.main?.[0]?.uri || eventData.images?.[0]?.uri;
  
  const schedules = {
    입관: eventData.casketDate ? new Date(eventData.casketDate) : null,
    발인: eventData.burialDate ? new Date(eventData.burialDate) : null,
    장지: eventData.burialDate ? new Date(eventData.burialDate) : null,
  };

  const getCurrentSchedule = () => {
    if (schedules.입관 && currentDate >= schedules.입관 && currentDate < schedules.발인) return '입관';
    if (schedules.발인 && currentDate >= schedules.발인 && currentDate < schedules.장지) return '발인';
    if (schedules.장지 && currentDate >= schedules.장지) return '장지';
    return null;
  };

  const currentSchedule = getCurrentSchedule();

  const handleMessageSubmit = async (messageData) => {
    try {
      if (onMessageSubmit) {
        await onMessageSubmit(messageData);
      }
      
      const newMessage = {
        ...messageData,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  return (
    <ScrollView style={styles.officialContainer}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* 공문서 헤더 */}
        <View style={styles.officialHeader}>
          <View style={styles.officialHeaderBox}>
            <Text style={styles.officialTitle}>부 고</Text>
            <Text style={styles.officialSubtitle}>FUNERAL NOTICE</Text>
            <View style={styles.officialHeaderLine} />
          </View>
        </View>

        {/* 메인 내용 */}
        <View style={styles.officialContent}>
          
          {/* 고인 정보 카드 */}
          <View style={styles.officialCard}>
            <View style={styles.officialCardHeader}>
              <Text style={styles.officialCardTitle}>고인 정보</Text>
            </View>
            <View style={styles.officialCardContent}>
              {mainImage && (
                <View style={styles.officialPhotoWrapper}>
                  <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.officialPhoto} />
                </View>
              )}
              <Text style={styles.officialDeceasedName}>
                故 {eventData.deceasedName || eventData.deceased_name || '김○○'}
              </Text>
              <Text style={styles.officialDeceasedAge}>
                享年 {eventData.deceasedAge || eventData.deceased_age || '78'}세
              </Text>
              <Text style={styles.officialDeceasedDate}>
                {eventData.deathDate ? new Date(eventData.deathDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }) : eventData.death_date ? new Date(eventData.death_date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }) : '2025년 7월 12일'} 별세
              </Text>
            </View>
          </View>

          {/* 상주 정보 */}
          <View style={styles.officialCard}>
            <View style={styles.officialCardHeader}>
              <Text style={styles.officialCardTitle}>상주 명단</Text>
            </View>
            <View style={styles.officialCardContent}>
              <View style={styles.officialTable}>
                <View style={styles.officialTableHeader}>
                  <Text style={styles.officialTableHeaderText}>관계</Text>
                  <Text style={styles.officialTableHeaderText}>성명</Text>
                </View>
                <View style={styles.officialTableBody}>
                  {eventData.familyMembers?.filter(member => member.names && member.names.trim()).slice(0, 4).map((member, index) => (
                    <View key={index} style={styles.officialTableRow}>
                      <Text style={styles.officialTableCell}>{member.relation}</Text>
                      <Text style={styles.officialTableCellName}>{member.names}</Text>
                    </View>
                  )) || eventData.family_members?.filter(member => member.names && member.names.trim()).slice(0, 4).map((member, index) => (
                    <View key={index} style={styles.officialTableRow}>
                      <Text style={styles.officialTableCell}>{member.relation}</Text>
                      <Text style={styles.officialTableCellName}>{member.names}</Text>
                    </View>
                  )) || (
                    <>
                      <View style={styles.officialTableRow}>
                        <Text style={styles.officialTableCell}>장남</Text>
                        <Text style={styles.officialTableCellName}>김○○</Text>
                      </View>
                      <View style={styles.officialTableRow}>
                        <Text style={styles.officialTableCell}>차남</Text>
                        <Text style={styles.officialTableCellName}>김○○</Text>
                      </View>
                      <View style={styles.officialTableRow}>
                        <Text style={styles.officialTableCell}>장녀</Text>
                        <Text style={styles.officialTableCellName}>김○○</Text>
                      </View>
                      <View style={styles.officialTableRow}>
                        <Text style={styles.officialTableCell}>차녀</Text>
                        <Text style={styles.officialTableCellName}>김○○</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* 장례 일정 */}
          <View style={styles.officialCard}>
            <View style={styles.officialCardHeader}>
              <Text style={styles.officialCardTitle}>장례 일정</Text>
            </View>
            <View style={styles.officialCardContent}>
              <View style={styles.officialScheduleList}>
                {/* 입관 일정 (입력된 경우만 표시) */}
                {(eventData.casketDate || eventData.casketTime) && (
                  <View style={[
                    styles.officialScheduleItem,
                    currentSchedule === '입관' && styles.officialScheduleItemActive
                  ]}>
                    <View style={styles.officialScheduleLeft}>
                      <View style={[
                        styles.officialScheduleIndicator,
                        currentSchedule === '입관' && styles.officialScheduleIndicatorActive
                      ]} />
                      <Text style={styles.officialScheduleLabel}>입관</Text>
                    </View>
                    <View style={styles.officialScheduleRight}>
                      <Text style={styles.officialScheduleDate}>
                        {eventData.casketDate ? new Date(eventData.casketDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : ''}
                      </Text>
                      <Text style={styles.officialScheduleTime}>
                        {eventData.casketTime ? new Date(`1970-01-01T${eventData.casketTime}`).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                      </Text>
                    </View>
                  </View>
                )}

                {/* 발인 일정 */}
                <View style={[
                  styles.officialScheduleItem,
                  currentSchedule === '발인' && styles.officialScheduleItemActive
                ]}>
                  <View style={styles.officialScheduleLeft}>
                    <View style={[
                      styles.officialScheduleIndicator,
                      currentSchedule === '발인' && styles.officialScheduleIndicatorActive
                    ]} />
                    <Text style={styles.officialScheduleLabel}>발인</Text>
                  </View>
                  <View style={styles.officialScheduleRight}>
                    <Text style={styles.officialScheduleDate}>
                      {eventData.burialDate ? new Date(eventData.burialDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : '7월 15일'}
                    </Text>
                    <Text style={styles.officialScheduleTime}>
                      {eventData.burialTime ? new Date(`1970-01-01T${eventData.burialTime}`).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }) : '오전 9시'}
                    </Text>
                  </View>
                </View>

                {/* 장지 */}
                <View style={[
                  styles.officialScheduleItem,
                  currentSchedule === '장지' && styles.officialScheduleItemActive
                ]}>
                  <View style={styles.officialScheduleLeft}>
                    <View style={[
                      styles.officialScheduleIndicator,
                      currentSchedule === '장지' && styles.officialScheduleIndicatorActive
                    ]} />
                    <Text style={styles.officialScheduleLabel}>장지</Text>
                  </View>
                  <View style={styles.officialScheduleRight}>
                    <Text style={styles.officialScheduleDate}>
                      {eventData.burialLocation || eventData.burial_location || '○○공원묘지'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 빈소 및 연락처 */}
          <View style={styles.officialInfoGrid}>
            
            {/* 빈소 정보 */}
            <View style={styles.officialInfoCard}>
              <View style={styles.officialCardHeader}>
                <Text style={styles.officialCardTitle}>빈소 안내</Text>
              </View>
              <View style={styles.officialCardContent}>
                <Text style={styles.officialLocationName}>
                  {eventData.funeralHome || eventData.funeral_home || '○○병원 장례식장'}
                </Text>
                <Text style={styles.officialLocationDetail}>
                  {eventData.detailedAddress || eventData.detailed_address || '3층 특실 302호'}
                </Text>
                <View style={styles.officialLocationAddress}>
                  <Text style={styles.officialLocationAddressText}>
                    주소: {eventData.location || '서울시 강남구 ○○로 123'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 연락처 */}
            <View style={styles.officialInfoCard}>
              <View style={styles.officialCardHeader}>
                <Text style={styles.officialCardTitle}>연락처</Text>
              </View>
              <View style={styles.officialCardContent}>
                <View style={styles.officialContactTable}>
                  <View style={styles.officialContactRow}>
                    <Text style={styles.officialContactLabel}>상주</Text>
                    <Text style={styles.officialContactValue}>
                      {eventData.primaryContact || eventData.primary_contact || '010-1234-5678'}
                    </Text>
                  </View>
                  {(eventData.secondaryContact || eventData.secondary_contact) && (
                    <View style={styles.officialContactRow}>
                      <Text style={styles.officialContactLabel}>상주</Text>
                      <Text style={styles.officialContactValue}>
                        {eventData.secondaryContact || eventData.secondary_contact}
                      </Text>
                    </View>
                  )}
                  {(eventData.funeralDirector || eventData.funeral_director) && (
                    <View style={styles.officialContactRow}>
                      <Text style={styles.officialContactLabel}>장례지도사</Text>
                      <Text style={styles.officialContactValue}>
                        {eventData.funeralDirector || eventData.funeral_director}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <FuneralGuidanceSection eventData={eventData} />

          {/* 상주의 말 */}
          {(eventData.customMessage || eventData.custom_message) && (
            <View style={styles.officialCard}>
              <View style={styles.officialCardHeader}>
                <Text style={styles.officialCardTitle}>상주의 말</Text>
              </View>
              <View style={styles.officialCardContent}>
                <View style={styles.officialMessageContainer}>
                  <Text style={styles.officialMessage}>
                    {eventData.customMessage || eventData.custom_message}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 조문 메시지 섹션 */}
          {allowMessages && (
            <View style={styles.officialCard}>
              <View style={styles.officialCardHeader}>
                <Text style={styles.officialCardTitle}>조문 메시지</Text>
              </View>
              <View style={styles.officialCardContent}>
                <MessageList messages={messages} eventType="funeral" />
              </View>
            </View>
          )}

          {/* 부조하기 버튼 */}
          {!isPreviewMode && (
          <View style={styles.officialButtons}>
            <TouchableOpacity style={styles.officialButton}>
              <Text style={styles.officialButtonText}>부조하기</Text>
            </TouchableOpacity>
            {allowMessages && (
              <TouchableOpacity 
                style={styles.officialMessageButton}
                onPress={() => setShowMessageModal(true)}
              >
                <Text style={styles.officialMessageButtonText}>조문 메시지</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.officialShareButton}>
              <Text style={styles.officialShareButtonText}>공유하기</Text>
            </TouchableOpacity>
          </View>
          )}

          {/* 마지막 인사 */}
          <View style={styles.officialFooter}>
            <View style={styles.officialFooterBox}>
              <Text style={styles.officialFooterText}>故人의 명복을 빕니다</Text>
            </View>
          </View>

        </View>

        {/* 메시지 입력 모달 */}
        {!isPreviewMode && allowMessages && (
          <MessageModal
            visible={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            onSubmit={handleMessageSubmit}
            placeholder={messageSettings?.placeholder || '삼가 고인의 명복을 빕니다.'}
            eventType="funeral"
          />
        )}
      </SafeAreaView>
    </ScrollView>
  );
};

// 템플릿 3: 신문 스타일 (NewspaperFuneralNotice 기반)
const NewspaperTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [currentDate] = useState(new Date());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = categorizedImages?.main?.[0]?.uri || eventData.images?.[0]?.uri;
  
  const schedules = {
    입관: eventData.casketDate ? new Date(eventData.casketDate) : null,
    발인: eventData.burialDate ? new Date(eventData.burialDate) : null,
    장지: eventData.burialDate ? new Date(eventData.burialDate) : null,
  };

  const getCurrentSchedule = () => {
    if (schedules.입관 && currentDate >= schedules.입관 && currentDate < schedules.발인) return '입관';
    if (schedules.발인 && currentDate >= schedules.발인 && currentDate < schedules.장지) return '발인';
    if (schedules.장지 && currentDate >= schedules.장지) return '장지';
    return null;
  };

  const currentSchedule = getCurrentSchedule();

  const handleMessageSubmit = async (messageData) => {
    try {
      if (onMessageSubmit) {
        await onMessageSubmit(messageData);
      }
      
      const newMessage = {
        ...messageData,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  return (
    <ScrollView style={styles.newspaperContainer}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* 신문 헤더 */}
        <View style={styles.newspaperHeader}>
          <View style={styles.newspaperHeaderContent}>
            <Text style={styles.newspaperTitle}>부 고</Text>
            <Text style={styles.newspaperSubtitle}>訃告</Text>
          </View>
          <Text style={styles.newspaperDate}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })} (월)
          </Text>
        </View>

        {/* 메인 기사 스타일 */}
        <View style={styles.newspaperMain}>
          
          {/* 사진 영역 */}
          {mainImage && (
            <View style={styles.newspaperPhotoSection}>
              <View style={styles.newspaperPhotoFrame}>
                <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.newspaperPhoto} />
              </View>
            </View>
          )}
          
          {/* 헤드라인 */}
          <View style={styles.newspaperHeadline}>
            <Text style={styles.newspaperHeadlineTitle}>
              故 {eventData.deceasedName || eventData.deceased_name || '김○○'} 별세
            </Text>
            <Text style={styles.newspaperHeadlineAge}>
              享年 {eventData.deceasedAge || eventData.deceased_age || '78'}세
            </Text>
            <Text style={styles.newspaperHeadlineDate}>
              {eventData.deathDate ? new Date(eventData.deathDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }) : eventData.death_date ? new Date(eventData.death_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }) : '2025년 7월 12일'} 오후 별세하셨습니다
            </Text>
          </View>

          {/* 2단 컬럼 레이아웃 */}
          <View style={styles.newspaperColumns}>
            
            {/* 왼쪽 컬럼 */}
            <View style={styles.newspaperLeftColumn}>
              <Text style={styles.newspaperColumnTitle}>상주</Text>
              <View style={styles.newspaperFamilyList}>
                {eventData.familyMembers?.filter(member => member.names && member.names.trim()).slice(0, 4).map((member, index) => (
                  <View key={index} style={styles.newspaperFamilyItem}>
                    <Text style={styles.newspaperFamilyRelation}>{member.relation}</Text>
                    <Text style={styles.newspaperFamilyName}>{member.names}</Text>
                  </View>
                )) || eventData.family_members?.filter(member => member.names && member.names.trim()).slice(0, 4).map((member, index) => (
                  <View key={index} style={styles.newspaperFamilyItem}>
                    <Text style={styles.newspaperFamilyRelation}>{member.relation}</Text>
                    <Text style={styles.newspaperFamilyName}>{member.names}</Text>
                  </View>
                )) || (
                  <>
                    <View style={styles.newspaperFamilyItem}>
                      <Text style={styles.newspaperFamilyRelation}>장남</Text>
                      <Text style={styles.newspaperFamilyName}>김○○</Text>
                    </View>
                    <View style={styles.newspaperFamilyItem}>
                      <Text style={styles.newspaperFamilyRelation}>차남</Text>
                      <Text style={styles.newspaperFamilyName}>김○○</Text>
                    </View>
                    <View style={styles.newspaperFamilyItem}>
                      <Text style={styles.newspaperFamilyRelation}>장녀</Text>
                      <Text style={styles.newspaperFamilyName}>김○○</Text>
                    </View>
                    <View style={styles.newspaperFamilyItem}>
                      <Text style={styles.newspaperFamilyRelation}>차녀</Text>
                      <Text style={styles.newspaperFamilyName}>김○○</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* 오른쪽 컬럼 */}
            <View style={styles.newspaperRightColumn}>
              <Text style={styles.newspaperColumnTitle}>연락처</Text>
              <View style={styles.newspaperContactList}>
                <View style={styles.newspaperContactItem}>
                  <Text style={styles.newspaperContactLabel}>상주</Text>
                  <Text style={styles.newspaperContactValue}>
                    {eventData.primaryContact || eventData.primary_contact || '010-1234-5678'}
                  </Text>
                </View>
                {(eventData.secondaryContact || eventData.secondary_contact) && (
                  <View style={styles.newspaperContactItem}>
                    <Text style={styles.newspaperContactLabel}>상주</Text>
                    <Text style={styles.newspaperContactValue}>
                      {eventData.secondaryContact || eventData.secondary_contact}
                    </Text>
                  </View>
                )}
                {(eventData.funeralDirector || eventData.funeral_director) && (
                  <View style={styles.newspaperContactItem}>
                    <Text style={styles.newspaperContactLabel}>장례지도사</Text>
                    <Text style={styles.newspaperContactValue}>
                      {eventData.funeralDirector || eventData.funeral_director}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

        </View>

        {/* 일정표 섹션 */}
        <View style={styles.newspaperScheduleSection}>
          <Text style={styles.newspaperScheduleTitle}>장례 일정표</Text>
          
          <View style={styles.newspaperScheduleTable}>
            {/* 테이블 헤더 */}
            <View style={styles.newspaperScheduleTableHeader}>
              <Text style={styles.newspaperScheduleTableHeaderText}>구분</Text>
              <Text style={styles.newspaperScheduleTableHeaderText}>일시</Text>
              <Text style={styles.newspaperScheduleTableHeaderText}>상태</Text>
            </View>
            
            {/* 테이블 내용 */}
            <View style={styles.newspaperScheduleTableBody}>
              {/* 입관 일정 (입력된 경우만 표시) */}
              {(eventData.casketDate || eventData.casketTime) && (
                <View style={[
                  styles.newspaperScheduleTableRow,
                  currentSchedule === '입관' && styles.newspaperScheduleTableRowActive
                ]}>
                  <Text style={styles.newspaperScheduleTableCell}>입관</Text>
                  <Text style={styles.newspaperScheduleTableCell}>
                    {eventData.casketDate ? new Date(eventData.casketDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : ''} {eventData.casketTime ? new Date(`1970-01-01T${eventData.casketTime}`).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                  </Text>
                  <View style={styles.newspaperScheduleTableCellStatus}>
                    {currentSchedule === '입관' ? (
                      <View style={styles.newspaperStatusBadgeActive}>
                        <Text style={styles.newspaperStatusBadgeText}>진행중</Text>
                      </View>
                    ) : (
                      <Text style={styles.newspaperStatusEmpty}>-</Text>
                    )}
                  </View>
                </View>
              )}
              
              {/* 발인 일정 */}
              <View style={[
                styles.newspaperScheduleTableRow,
                currentSchedule === '발인' && styles.newspaperScheduleTableRowActive
              ]}>
                <Text style={styles.newspaperScheduleTableCell}>발인</Text>
                <Text style={styles.newspaperScheduleTableCell}>
                  {eventData.burialDate ? new Date(eventData.burialDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : '7월 15일'} {eventData.burialTime ? new Date(`1970-01-01T${eventData.burialTime}`).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00'}
                </Text>
                <View style={styles.newspaperScheduleTableCellStatus}>
                  {currentSchedule === '발인' ? (
                    <View style={styles.newspaperStatusBadgeActive}>
                      <Text style={styles.newspaperStatusBadgeText}>진행중</Text>
                    </View>
                  ) : (
                    <Text style={styles.newspaperStatusEmpty}>-</Text>
                  )}
                </View>
              </View>
              
              {/* 장지 */}
              <View style={[
                styles.newspaperScheduleTableRow,
                currentSchedule === '장지' && styles.newspaperScheduleTableRowActive
              ]}>
                <Text style={styles.newspaperScheduleTableCell}>장지</Text>
                <Text style={styles.newspaperScheduleTableCell}>
                  {eventData.burialLocation || eventData.burial_location || '○○공원묘지'}
                </Text>
                <View style={styles.newspaperScheduleTableCellStatus}>
                  {currentSchedule === '장지' ? (
                    <View style={styles.newspaperStatusBadgeActive}>
                      <Text style={styles.newspaperStatusBadgeText}>진행중</Text>
                    </View>
                  ) : (
                    <Text style={styles.newspaperStatusEmpty}>-</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 빈소 정보 박스 */}
        <View style={styles.newspaperLocationBox}>
          <Text style={styles.newspaperLocationTitle}>빈소 정보</Text>
          <View style={styles.newspaperLocationContent}>
            <Text style={styles.newspaperLocationName}>
              {eventData.funeralHome || eventData.funeral_home || '○○병원 장례식장'}
            </Text>
            <Text style={styles.newspaperLocationDetail}>
              {eventData.detailedAddress || eventData.detailed_address || '3층 특실 302호'}
            </Text>
            <View style={styles.newspaperLocationAddress}>
              <Text style={styles.newspaperLocationAddressText}>
                {eventData.location || '서울시 강남구 ○○로 123'}
              </Text>
            </View>
          </View>
        </View>

        <FuneralGuidanceSection eventData={eventData} />

        {/* 상주의 말 */}
        {(eventData.customMessage || eventData.custom_message) && (
          <View style={styles.newspaperMessageBox}>
            <Text style={styles.newspaperMessageTitle}>상주의 말</Text>
            <View style={styles.newspaperMessageContent}>
              <Text style={styles.newspaperMessageText}>
                {eventData.customMessage || eventData.custom_message}
              </Text>
            </View>
          </View>
        )}

        {/* 조문 메시지 섹션 */}
        {allowMessages && (
          <View style={styles.newspaperMessageBox}>
            <Text style={styles.newspaperMessageTitle}>조문 메시지</Text>
            <View style={styles.newspaperMessageContent}>
              <MessageList messages={messages} eventType="funeral" />
            </View>
          </View>
        )}

        {/* 하단 액션 */}
        {!isPreviewMode && (
        <View style={styles.newspaperButtons}>
          <TouchableOpacity style={styles.newspaperButton}>
            <Text style={styles.newspaperButtonText}>부조하기</Text>
          </TouchableOpacity>
          {allowMessages && (
            <TouchableOpacity 
              style={styles.newspaperMessageButton}
              onPress={() => setShowMessageModal(true)}
            >
              <Text style={styles.newspaperMessageButtonText}>조문 메시지</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.newspaperShareButton}>
            <Text style={styles.newspaperShareButtonText}>공유하기</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* 신문 푸터 */}
        <View style={styles.newspaperFooter}>
          <Text style={styles.newspaperFooterText}>故人의 명복을 빕니다</Text>
        </View>

        {/* 메시지 입력 모달 */}
        {!isPreviewMode && allowMessages && (
          <MessageModal
            visible={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            onSubmit={handleMessageSubmit}
            placeholder={messageSettings?.placeholder || '삼가 고인의 명복을 빕니다.'}
            eventType="funeral"
          />
        )}

      </SafeAreaView>
    </ScrollView>
  );
};

const ModernCardTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = categorizedImages?.main?.[0]?.uri || eventData.images?.[0]?.uri;
  const familyMembers = getFamilyMembersForPreview(eventData);
  const guidanceItems = getFuneralGuidanceItems(eventData);
  const accounts = getCondolenceAccounts(eventData);
  const deceasedName = eventData.deceasedName || eventData.deceased_name || '고인명';
  const deathDate = eventData.deathDate || eventData.death_date;
  const funeralHome = eventData.funeralHome || eventData.funeral_home || '○○장례식장';
  const funeralAddress = eventData.location || '주소를 입력해주세요';
  const detailAddress = eventData.detailedAddress || eventData.detailed_address;
  const primaryContact = eventData.primaryContact || eventData.primary_contact || '010-0000-0000';
  const currentScheduleStep = getCurrentFuneralStep(eventData);
  const funeralInfoRows = [
    {
      key: 'hall',
      icon: 'location-outline',
      label: '장례식장',
      value: funeralHome,
    },
    {
      key: 'address',
      icon: 'map-outline',
      label: '주소',
      value: `${detailAddress ? `${detailAddress} ` : ''}${funeralAddress}`,
    },
    {
      key: 'contact',
      icon: 'call-outline',
      label: '연락처',
      value: primaryContact,
    },
  ];

  const schedules = [
    {
      label: '입관',
      date: formatDateText(eventData.casketDate || eventData.casket_date),
      time: formatTimeText(eventData.casketTime || eventData.casket_time),
      status: currentScheduleStep === '입관' ? '현재 진행' : (eventData.visitationType === 'decline' ? '조문 사양' : '안내'),
      isActive: currentScheduleStep === '입관',
    },
    {
      label: '발인',
      date: formatDateText(eventData.burialDate || eventData.burial_date),
      time: formatTimeText(eventData.burialTime || eventData.burial_time),
      status: currentScheduleStep === '발인' ? '현재 진행' : '안내',
      isActive: currentScheduleStep === '발인',
    },
    {
      label: '장지',
      date: eventData.burialLocation || eventData.burial_location || '미입력',
      time: '',
      status: currentScheduleStep === '장지' ? '현재 진행' : '안내',
      isActive: currentScheduleStep === '장지',
    },
  ];

  const renderModernSectionHeader = (icon, title, caption) => (
    <View style={styles.modernSectionHead}>
      <View style={styles.modernSectionIcon}>
        <Ionicons name={icon} size={17} color="#f8f4ec" />
      </View>
      <View style={styles.modernSectionCopy}>
        <Text style={styles.modernSectionTitle}>{title}</Text>
        <Text style={styles.modernSectionCaption}>{caption}</Text>
      </View>
    </View>
  );

  const renderModernInfoRow = ({ key, label, value }) => (
    <View key={key || label} style={styles.modernInfoRow}>
      <View style={styles.modernInfoRowText}>
        <Text style={styles.modernInfoLabel}>{label}</Text>
        <Text style={styles.modernInfoValue}>{value}</Text>
      </View>
    </View>
  );

  const renderModernDecorations = () => (
    <View pointerEvents="none" style={styles.modernDecorLayer}>
      <Image source={MODERN_FUNERAL_BACKGROUND} style={styles.modernHanjiBackground} resizeMode="cover" />
      <View style={styles.modernInkWashTopLeft} />
      <View style={styles.modernInkWashBottomRight} />
      <Image source={MODERN_FUNERAL_OLIVE_BRANCH} style={styles.modernOliveBranch} resizeMode="contain" />
      <Image source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernSingleLeaf} resizeMode="contain" />
      <Image source={MODERN_FUNERAL_MAGNOLIA_PETALS} style={styles.modernMagnoliaPetals} resizeMode="contain" />
      <Image source={MODERN_FUNERAL_DIVIDER} style={styles.modernFloralDivider} resizeMode="contain" />
      <Image source={MODERN_FUNERAL_COTTON_FLOWER} style={styles.modernCottonFlower} resizeMode="contain" />
      <Image source={MODERN_FUNERAL_FLOWER_CORNER} style={styles.modernFlowerCornerBottom} resizeMode="contain" />
      <Image source={MODERN_FUNERAL_FLOWER_CORNER} style={styles.modernFlowerCornerTop} resizeMode="contain" />
      <View style={styles.modernCandleLeft}>
        <View style={styles.modernCandleFlame} />
        <View style={styles.modernCandleBody} />
        <View style={styles.modernCandleBase} />
      </View>
      <View style={styles.modernCandleRight}>
        <View style={styles.modernCandleFlame} />
        <View style={styles.modernCandleBody} />
        <View style={styles.modernCandleBase} />
      </View>
    </View>
  );

  const handleMessageSubmit = async (messageData) => {
    try {
      if (onMessageSubmit) {
        await onMessageSubmit(messageData);
      }
      setMessages((prev) => [{ ...messageData, created_at: new Date().toISOString() }, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  return (
    <ScrollView style={styles.modernCardContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modernCardCanvas}>
          {renderModernDecorations()}
          <View style={styles.modernCardProfile}>
            <View style={styles.modernHeroBadgeRow}>
              <Text style={styles.modernHeroBadge}>부고</Text>
              <Text style={styles.modernHeroDate}>
                {formatDateText(deathDate) || '사망일자 미입력'}
              </Text>
            </View>
            {mainImage ? (
              <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.modernCardPhotoHero} />
            ) : (
              <View style={[styles.modernCardPhotoHero, styles.modernPhotoPlaceholder]}>
                <Ionicons name="person" size={40} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View style={styles.modernCardHero}>
            <Image pointerEvents="none" source={MODERN_FUNERAL_OLIVE_BRANCH} style={styles.modernHeroOlive} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_MAGNOLIA_PETALS} style={styles.modernHeroPetals} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_COTTON_FLOWER} style={styles.modernHeroCotton} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernHeroLeafAccent} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_DIVIDER} style={styles.modernHeroDivider} resizeMode="contain" />
            <Text style={styles.modernHeroEyebrow}>삼가 고인의 명복을 빕니다</Text>
            <View style={styles.modernHeroNamePlate}>
              <Text style={styles.modernHeroHonorific}>故</Text>
              <Text style={styles.modernHeroTitle}>{deceasedName}</Text>
            </View>
            <View style={styles.modernHeroDetailGrid}>
              <View style={styles.modernHeroDetailCard}>
                <Text style={styles.modernHeroDetailLabel}>향년</Text>
                <Text style={styles.modernHeroDetailValue}>{getDeceasedAge(eventData)}</Text>
              </View>
              <View style={styles.modernHeroDetailCard}>
                <Text style={styles.modernHeroDetailLabel}>별세일</Text>
                <Text style={styles.modernHeroDetailValue}>{formatDateText(deathDate) || '미입력'}</Text>
              </View>
            </View>
          </View>

          {familyMembers.length > 0 && (
            <View style={styles.modernInfoBlock}>
              <Image pointerEvents="none" source={MODERN_FUNERAL_OLIVE_BRANCH} style={styles.modernHostOlive} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernHostLeaf} resizeMode="contain" />
              {renderModernSectionHeader('people-outline', '상주', '고인을 모시는 가족')}
              <View style={styles.modernHostGrid}>
                {familyMembers.map((member) => (
                  <View key={`${member.relation}-${member.names}`} style={styles.modernHostPill}>
                    <Text style={styles.modernHostRelation}>{member.relation}</Text>
                    <Text style={styles.modernHostName}>{member.names}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.modernInfoBlock}>
            <Image pointerEvents="none" source={MODERN_FUNERAL_COTTON_FLOWER} style={styles.modernScheduleFlower} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernScheduleLeaf} resizeMode="contain" />
            <View style={styles.modernSectionHead}>
              <View style={styles.modernSectionIcon}>
                <Ionicons name="time-outline" size={17} color="#f8f4ec" />
              </View>
              <View style={styles.modernSectionCopy}>
                <Text style={styles.modernSectionTitle}>조문 일정</Text>
                <Text style={styles.modernSectionCaption}>입관부터 장지까지</Text>
              </View>
            </View>
            <Image pointerEvents="none" source={MODERN_FUNERAL_DIVIDER} style={styles.modernScheduleDivider} resizeMode="contain" />
            <View style={styles.modernScheduleGrid}>
              {schedules.map((item, index) => (
                <View key={item.label} style={[styles.modernScheduleCard, item.isActive && styles.modernScheduleCardActive]}>
                  <Image
                    pointerEvents="none"
                    source={index === 1 ? MODERN_FUNERAL_MAGNOLIA_PETALS : MODERN_FUNERAL_SINGLE_LEAF}
                    style={[
                      styles.modernScheduleCardOrnament,
                      index === 1 && styles.modernScheduleCardOrnamentCenter,
                      index === 2 && styles.modernScheduleCardOrnamentRight,
                    ]}
                    resizeMode="contain"
                  />
                  {item.isActive && (
                    <>
                      <View style={styles.modernScheduleCornerMark} />
                      <View style={styles.modernScheduleActiveGlow} />
                    </>
                  )}
                  <View style={[styles.modernScheduleIconCircle, item.isActive && styles.modernScheduleIconCircleActive]}>
                    <Text style={[styles.modernScheduleSymbol, item.isActive && styles.modernScheduleSymbolActive]}>
                      {index === 0 ? '入' : index === 1 ? '發' : '地'}
                    </Text>
                  </View>
                  <View style={styles.modernScheduleTop}>
                    <Text style={[styles.modernScheduleStep, item.isActive && styles.modernScheduleStepActive]}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                    <Text style={[styles.modernScheduleLabel, item.isActive && styles.modernScheduleLabelActive]}>{item.label}</Text>
                    {item.isActive && (
                      <View style={styles.modernScheduleActivePill}>
                        <Text style={styles.modernScheduleActiveText}>진행중</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.modernScheduleValue}>
                    {[item.date, item.time].filter(Boolean).join('\n') || '미입력'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.modernInfoBlock}>
            {renderModernSectionHeader('location-outline', '장례 안내', '빈소와 연락처')}
            <Image pointerEvents="none" source={MODERN_FUNERAL_MAGNOLIA_PETALS} style={styles.modernInfoPetals} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_COTTON_FLOWER} style={styles.modernInfoCotton} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_DIVIDER} style={styles.modernInfoDivider} resizeMode="contain" />
            <View style={styles.modernInfoList}>
              {funeralInfoRows.map(renderModernInfoRow)}
            </View>
          </View>

          {guidanceItems.length > 0 && (
            <View style={styles.modernInfoBlock}>
              {renderModernSectionHeader('information-circle-outline', '안내', '조문 전 확인 사항')}
              <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernGuideLeafA} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_OLIVE_BRANCH} style={styles.modernGuideOlive} resizeMode="contain" />
              <View style={styles.modernInfoList}>
                {guidanceItems.map((item, index) => renderModernInfoRow({
                  key: item.label,
                  label: item.label,
                  value: item.value,
                }))}
              </View>
            </View>
          )}

          {accounts.length > 0 && (
            <View style={styles.modernInfoBlock}>
              {renderModernSectionHeader('card-outline', '부의금 계좌', '마음을 전하실 곳')}
              <Image pointerEvents="none" source={MODERN_FUNERAL_DIVIDER} style={styles.modernAccountDivider} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernAccountLeaf} resizeMode="contain" />
              <View style={styles.modernInfoList}>
                {accounts.map((account) => renderModernInfoRow({
                  key: `${account.bank_name}-${account.account_number}`,
                  label: account.bank_name || account.bankName,
                  value: `${account.account_number || account.accountNumber || ''} ${account.owner_name || account.ownerName || ''}`.trim(),
                }))}
              </View>
            </View>
          )}

          {(eventData.customMessage || eventData.custom_message) && (
            <View style={styles.modernInfoBlock}>
              {renderModernSectionHeader('flower-outline', '상주의 말', '가족이 전하는 말씀')}
              <Image pointerEvents="none" source={MODERN_FUNERAL_OLIVE_BRANCH} style={styles.modernMessageOlive} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_MAGNOLIA_PETALS} style={styles.modernMessagePetals} resizeMode="contain" />
              <View style={styles.modernMessageBox}>
                <View style={styles.modernMessageOrnament}>
                  <Ionicons name="flower-outline" size={42} color="#d6cbb8" />
                </View>
                <Text style={styles.modernMessageText}>
                  {eventData.customMessage || eventData.custom_message}
                </Text>
              </View>
            </View>
          )}

          {allowMessages && (
            <View style={styles.modernInfoBlock}>
              {renderModernSectionHeader('chatbubble-ellipses-outline', '조문 메시지', '남겨주신 마음')}
              <Image pointerEvents="none" source={MODERN_FUNERAL_COTTON_FLOWER} style={styles.modernGuestbookFlower} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_DIVIDER} style={styles.modernGuestbookDivider} resizeMode="contain" />
              <MessageList messages={messages} eventType="funeral" />
            </View>
          )}

          {!isPreviewMode && (
            <View style={styles.modernActionRow}>
              {allowMessages && (
                <TouchableOpacity
                  style={styles.modernPrimaryButton}
                  onPress={() => setShowMessageModal(true)}
                >
                  <Text style={styles.modernPrimaryButtonText}>조문 메시지 남기기</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.modernGhostButton}>
                <Text style={styles.modernGhostButtonText}>공유하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      {!isPreviewMode && allowMessages && (
        <MessageModal
          visible={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          onSubmit={handleMessageSubmit}
          placeholder={messageSettings?.placeholder || '삼가 고인의 명복을 빕니다.'}
          eventType="funeral"
        />
      )}
    </ScrollView>
  );
};

const EditorialTimelineTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = categorizedImages?.main?.[0]?.uri || eventData.images?.[0]?.uri;
  const familyMembers = getFamilyMembersForPreview(eventData);
  const deceasedName = eventData.deceasedName || eventData.deceased_name || '고인명';
  const deceasedAge = getDeceasedAge(eventData);
  const deathDate = formatDateText(eventData.deathDate || eventData.death_date);
  const funeralHome = eventData.funeralHome || eventData.funeral_home || '○○장례식장';
  const funeralAddress = eventData.location || '주소를 입력해주세요';
  const detailAddress = eventData.detailedAddress || eventData.detailed_address;
  const primaryContact = eventData.primaryContact || eventData.primary_contact || '010-0000-0000';
  const currentScheduleStep = getCurrentFuneralStep(eventData);

  const timeline = [
    {
      day: '입관',
      label: '입관식',
      value: [formatDateText(eventData.casketDate || eventData.casket_date), formatTimeText(eventData.casketTime || eventData.casket_time)]
        .filter(Boolean)
        .join(' '),
      detail: eventData.visitation_note || '별도 안내를 확인해주세요.',
      isActive: currentScheduleStep === '입관',
    },
    {
      day: '발인',
      label: '발인식',
      value: [formatDateText(eventData.burialDate || eventData.burial_date), formatTimeText(eventData.burialTime || eventData.burial_time)]
        .filter(Boolean)
        .join(' '),
      detail: '장례 절차 진행',
      isActive: currentScheduleStep === '발인',
    },
    {
      day: '장지',
      label: '안치',
      value: eventData.burialLocation || eventData.burial_location || '미입력',
      detail: '화장장 또는 봉안 장소 안내',
      isActive: currentScheduleStep === '장지',
    },
  ];

  const handleMessageSubmit = async (messageData) => {
    try {
      if (onMessageSubmit) {
        await onMessageSubmit(messageData);
      }
      setMessages((prev) => [{ ...messageData, created_at: new Date().toISOString() }, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  return (
    <ScrollView style={styles.timelineContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.timelineCanvas}>
          <View style={styles.timelineHeader}>
            <View style={styles.timelineHeaderTop}>
              <Text style={styles.timelineHeaderTitle}>FUNERAL TIMELINE</Text>
              <Text style={styles.timelineHeaderIndex}>기본형</Text>
            </View>
            <Text style={styles.timelineHeaderName}>故 {deceasedName}</Text>
            <View style={styles.timelineHeaderMetaRow}>
              <Text style={styles.timelineHeaderMeta}>향년 {deceasedAge}</Text>
              <View style={styles.timelineMetaDivider} />
              <Text style={styles.timelineHeaderMeta}>
                {deathDate ? `${deathDate} 별세` : '사망일 미입력'}
              </Text>
            </View>
          </View>

          <View style={styles.timelineVisual}>
            {mainImage ? (
              <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.timelinePhotoHero} />
            ) : (
              <View style={[styles.timelinePhotoHero, styles.modernPhotoPlaceholder]}>
                <Ionicons name="person" size={30} color="#94A3B8" />
              </View>
            )}
            <View style={styles.timelineVisualCaption}>
              <Text style={styles.timelineVisualCaptionTitle}>고인의 길을 시간순으로 안내합니다</Text>
              <Text style={styles.timelineVisualCaptionText}>입관부터 장지까지, 조문객이 필요한 절차를 차분하게 확인할 수 있습니다.</Text>
            </View>
            <View style={styles.timelineFamilyPillWrap}>
              {familyMembers.slice(0, 4).map((member) => (
                <Text key={`${member.names}-${member.relation}`} style={styles.timelineFamilyPill}>
                  {member.relation} {member.names}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.timelineBox}>
            <View style={styles.timelineSectionHead}>
              <Text style={styles.timelineSectionKicker}>SCHEDULE</Text>
              <Text style={styles.timelineTitle}>조문 일정</Text>
            </View>
            <View style={styles.timelineSimpleList}>
              {timeline.map((item, index) => (
                <View key={item.day} style={[styles.timelineSimpleItem, item.isActive && styles.timelineSimpleItemActive]}>
                  <View style={styles.timelineSimpleMarkerWrap}>
                    <View style={[styles.timelineSimpleMarker, item.isActive && styles.timelineSimpleMarkerActive]}>
                      <Text style={[styles.timelineSimpleMarkerText, item.isActive && styles.timelineSimpleMarkerTextActive]}>
                        {index + 1}
                      </Text>
                    </View>
                    {index < timeline.length - 1 && <View style={styles.timelineSimpleLine} />}
                  </View>
                  <View style={styles.timelineSimpleBody}>
                    <View style={styles.timelineSimpleTitleRow}>
                      <View>
                        <Text style={styles.timelineSimpleDay}>{item.day}</Text>
                        <Text style={styles.timelineSimpleLabel}>{item.label}</Text>
                      </View>
                      {item.isActive && <Text style={styles.timelineCurrentBadge}>현재 진행</Text>}
                    </View>
                    <Text style={styles.timelineSimpleValue}>{item.value || '미입력'}</Text>
                    <Text style={styles.timelineSimpleDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.timelineBox}>
            <View style={styles.timelineSectionHead}>
              <Text style={styles.timelineSectionKicker}>LOCATION</Text>
              <Text style={styles.timelineTitle}>장례 안내</Text>
            </View>
            {[
              ['business-outline', '빈소', funeralHome],
              ['map-outline', '주소', `${detailAddress ? `${detailAddress} ` : ''}${funeralAddress}`],
              ['call-outline', '연락처', primaryContact],
            ].map(([icon, label, value]) => (
              <View key={label} style={styles.timelineInfoRow}>
                <View style={styles.timelineInfoIcon}>
                  <Ionicons name={icon} size={16} color="#E5E7EB" />
                </View>
                <View style={styles.timelineInfoCopy}>
                  <Text style={styles.timelineInfoLabel}>{label}</Text>
                  <Text style={styles.timelineInfoText}>{value}</Text>
                </View>
              </View>
            ))}
          </View>

          <FuneralGuidanceSection eventData={eventData} variant="light" />

          {(eventData.customMessage || eventData.custom_message) && (
            <View style={styles.timelineBox}>
              <View style={styles.timelineSectionHead}>
                <Text style={styles.timelineSectionKicker}>MESSAGE</Text>
                <Text style={styles.timelineTitle}>상주의 말</Text>
              </View>
              <Text style={styles.timelineMessageText}>
                {eventData.customMessage || eventData.custom_message}
              </Text>
            </View>
          )}

          {allowMessages && (
            <View style={styles.timelineBox}>
              <Text style={styles.timelineTitle}>조문 메시지</Text>
              <MessageList messages={messages} eventType="funeral" />
            </View>
          )}

          {!isPreviewMode && allowMessages && (
            <View style={styles.modernActionRow}>
              <TouchableOpacity
                style={styles.modernPrimaryButton}
                onPress={() => setShowMessageModal(true)}
              >
                <Text style={styles.modernPrimaryButtonText}>조문 메시지 남기기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modernGhostButton}>
                <Text style={styles.modernGhostButtonText}>공유하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      {!isPreviewMode && allowMessages && (
        <MessageModal
          visible={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          onSubmit={handleMessageSubmit}
          placeholder={messageSettings?.placeholder || '삼가 고인의 명복을 빕니다.'}
          eventType="funeral"
        />
      )}
    </ScrollView>
  );
};

const PaperLetterTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = categorizedImages?.main?.[0]?.uri || eventData.images?.[0]?.uri;
  const familyMembers = getFamilyMembersForPreview(eventData);
  const deceasedName = eventData.deceasedName || eventData.deceased_name || '고인명';
  const deathDate = formatDateText(eventData.deathDate || eventData.death_date);
  const deathTime = formatTimeText(eventData.deathTime || eventData.death_time);
  const customMessage = eventData.customMessage || eventData.custom_message;
  const primaryContact = eventData.primaryContact || eventData.primary_contact || '010-0000-0000';
  const currentScheduleStep = getCurrentFuneralStep(eventData);
  const funeralSchedule = [
    {
      label: '입관',
      value: [formatDateText(eventData.casketDate || eventData.casket_date), formatTimeText(eventData.casketTime || eventData.casket_time)].filter(Boolean).join(' '),
      isActive: currentScheduleStep === '입관',
    },
    {
      label: '발인',
      value: [formatDateText(eventData.burialDate || eventData.burial_date), formatTimeText(eventData.burialTime || eventData.burial_time)].filter(Boolean).join(' '),
      isActive: currentScheduleStep === '발인',
    },
    {
      label: '장지',
      value: eventData.burialLocation || eventData.burial_location || '미입력',
      isActive: currentScheduleStep === '장지',
    },
  ];

  const handleMessageSubmit = async (messageData) => {
    try {
      if (onMessageSubmit) {
        await onMessageSubmit(messageData);
      }
      setMessages((prev) => [{ ...messageData, created_at: new Date().toISOString() }, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  return (
    <ScrollView style={styles.paperLetterContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.paperLetterCanvas}>
          <Text style={styles.paperLetterRibbon}>故人을 추모합니다</Text>
          <View style={styles.paperLetterCard}>
            <Text style={styles.paperLetterTitle}>부 고</Text>
            <Text style={styles.paperLetterDateText}>
              {deathDate || '사망일 미입력'} {deathTime}
            </Text>
            <View style={styles.paperLetterBody}>
              {mainImage ? (
                <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.paperLetterPhotoHero} />
              ) : (
                <View style={[styles.paperLetterPhotoHero, styles.paperLetterPhotoPlaceholder]}>
                  <Ionicons name="person" size={46} color="#9CA3AF" />
                </View>
              )}
              <Text style={styles.paperLetterName}>故 {deceasedName}</Text>
              <Text style={styles.paperLetterSub}>
                향년 {getDeceasedAge(eventData)}로 별세
              </Text>
              <View style={styles.paperLetterScheduleCard}>
                <Text style={styles.paperLetterBodyTitle}>조문 일정</Text>
                {funeralSchedule.map((item) => (
                  <View key={item.label} style={[styles.paperLetterScheduleRow, item.isActive && styles.paperLetterScheduleRowActive]}>
                    <View style={styles.paperLetterScheduleLabelWrap}>
                      <Text style={styles.paperLetterScheduleLabel}>{item.label}</Text>
                      <Text style={styles.paperLetterScheduleStatus}>{item.isActive ? '현재 진행' : '안내'}</Text>
                    </View>
                    <Text style={styles.paperLetterScheduleValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.paperLetterSeparator} />
              <Text style={styles.paperLetterBodyTitle}>상주</Text>
              <View style={styles.paperLetterListWrap}>
                {familyMembers.map((member) => (
                  <Text key={`${member.relation}-${member.names}`} style={styles.paperLetterListItem}>
                    {member.relation} · {member.names}
                  </Text>
                ))}
              </View>
              <Text style={styles.paperLetterBodyTitle}>안내</Text>
              <Text style={styles.paperLetterBodyText}>
                {eventData.funeralHome || eventData.funeral_home || '○○장례식장'} · {primaryContact}
              </Text>
              <Text style={styles.paperLetterBodyText}>{eventData.location || '주소를 입력해주세요'}</Text>
            </View>
          </View>

          {customMessage && (
            <View style={styles.paperLetterMessage}>
              <Text style={styles.paperLetterMessageTitle}>상주의 말</Text>
              <Text style={styles.paperLetterMessageText}>{customMessage}</Text>
            </View>
          )}

          {allowMessages && (
            <View style={styles.paperLetterMessage}>
              <Text style={styles.paperLetterMessageTitle}>조문 메시지</Text>
              <MessageList messages={messages} eventType="funeral" />
            </View>
          )}

          {!isPreviewMode && allowMessages && (
            <TouchableOpacity style={styles.paperLetterButton} onPress={() => setShowMessageModal(true)}>
              <Text style={styles.paperLetterButtonText}>조문 메시지 남기기</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {!isPreviewMode && allowMessages && (
        <MessageModal
          visible={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          onSubmit={handleMessageSubmit}
          placeholder={messageSettings?.placeholder || '삼가 고인의 명복을 빕니다.'}
          eventType="funeral"
        />
      )}
    </ScrollView>
  );
};

// 메인 컴포넌트
const FuneralTemplatePreview = ({ template, eventData, userImages, categorizedImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode = false }) => {
  const renderTemplate = () => {
    const templateProps = {
      eventData,
      categorizedImages,
      allowMessages,
      messageSettings,
      onMessageSubmit,
      isPreviewMode,
    };

    switch (template?.style) {
      case 'traditional-dark':
        return <ModernCardTemplate {...templateProps} />;
      case 'certificate':
        return <CertificateTemplate {...templateProps} />;
      case 'modern-beige':
        return <EditorialTimelineTemplate {...templateProps} />;
      case 'simple-white':
        return <PaperLetterTemplate {...templateProps} />;
      case 'modern-card':
        return <ModernCardTemplate {...templateProps} />;
      case 'editorial-timeline':
        return <EditorialTimelineTemplate {...templateProps} />;
      case 'paper-letter':
        return <PaperLetterTemplate {...templateProps} />;
      default:
        return <ModernCardTemplate {...templateProps} />;
    }
  };

  return <View style={styles.container}>{renderTemplate()}</View>;
};

const styles = StyleSheet.create({
  funeralComposedPhoto: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  funeralComposedFrameCanvas: {
    width: '100%',
    maxHeight: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  funeralComposedBaseImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  funeralComposedFrameImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  funeralComposedNameOverlay: {
    position: 'absolute',
    top: '72%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 3,
  },
  funeralComposedDateOverlay: {
    position: 'absolute',
    top: '78%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 3,
  },
  funeralComposedNameText: {
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    includeFontPadding: false,
  },
  funeralComposedDateText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    includeFontPadding: false,
  },
  modernCardContainer: {
    flex: 1,
    backgroundColor: '#ece7dc',
  },
  modernCardCanvas: {
    padding: 16,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  modernDecorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  modernHanjiBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.18,
  },
  modernInkWashTopLeft: {
    position: 'absolute',
    top: 4,
    left: -48,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(41,37,32,0.10)',
    transform: [{ scaleX: 1.4 }],
  },
  modernInkWashBottomRight: {
    position: 'absolute',
    right: -72,
    bottom: 110,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(122,95,54,0.08)',
    transform: [{ scaleX: 1.25 }],
  },
  modernOliveBranch: {
    position: 'absolute',
    right: -76,
    top: 300,
    width: 260,
    height: 260,
    opacity: 0.22,
    transform: [{ rotate: '16deg' }],
  },
  modernSingleLeaf: {
    position: 'absolute',
    left: 22,
    top: 760,
    width: 86,
    height: 86,
    opacity: 0.18,
    transform: [{ rotate: '-18deg' }],
  },
  modernMagnoliaPetals: {
    position: 'absolute',
    right: -18,
    bottom: 410,
    width: 150,
    height: 150,
    opacity: 0.22,
    transform: [{ rotate: '14deg' }],
  },
  modernFloralDivider: {
    position: 'absolute',
    left: '12%',
    top: 720,
    width: '76%',
    height: 50,
    opacity: 0.12,
  },
  modernCottonFlower: {
    position: 'absolute',
    left: -70,
    bottom: 250,
    width: 210,
    height: 210,
    opacity: 0.24,
    transform: [{ rotate: '-18deg' }],
  },
  modernFlowerCornerBottom: {
    position: 'absolute',
    left: -54,
    bottom: -12,
    width: 240,
    height: 240,
    opacity: 0.28,
  },
  modernFlowerCornerTop: {
    position: 'absolute',
    right: -68,
    top: 1040,
    width: 220,
    height: 220,
    opacity: 0.18,
    transform: [{ rotate: '180deg' }],
  },
  modernCandleLeft: {
    position: 'absolute',
    left: 18,
    top: 470,
    alignItems: 'center',
    opacity: 0.16,
  },
  modernCandleRight: {
    position: 'absolute',
    right: 22,
    top: 470,
    alignItems: 'center',
    opacity: 0.16,
  },
  modernCandleFlame: {
    width: 12,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f4c76c',
    marginBottom: -2,
  },
  modernCandleBody: {
    width: 24,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#fff8ea',
    borderWidth: 1,
    borderColor: '#e2d4bd',
  },
  modernCandleBase: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a99067',
    marginTop: -2,
  },
  modernCardHero: {
    backgroundColor: 'rgba(255,253,247,0.88)',
    borderRadius: 24,
    paddingTop: 14,
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#d0bea0',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4a3b2a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 3,
  },
  modernHeroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    zIndex: 2,
  },
  modernHeroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modernHeroDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  modernHeroTitle: {
    fontSize: 34,
    color: '#0f172a',
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
    zIndex: 1,
  },
  modernHeroOlive: {
    position: 'absolute',
    right: -74,
    top: 0,
    width: 230,
    height: 190,
    opacity: 0.48,
    transform: [{ rotate: '18deg' }],
  },
  modernHeroPetals: {
    position: 'absolute',
    left: -42,
    bottom: -12,
    width: 170,
    height: 170,
    opacity: 0.40,
    transform: [{ rotate: '-12deg' }],
  },
  modernHeroCotton: {
    position: 'absolute',
    right: 28,
    bottom: -46,
    width: 150,
    height: 150,
    opacity: 0.24,
    transform: [{ rotate: '10deg' }],
  },
  modernHeroLeafAccent: {
    position: 'absolute',
    left: 18,
    top: 28,
    width: 72,
    height: 72,
    opacity: 0.22,
    transform: [{ rotate: '-24deg' }],
  },
  modernHeroDivider: {
    position: 'absolute',
    top: 8,
    left: '14%',
    width: '72%',
    height: 28,
    opacity: 0.42,
  },
  modernHeroEyebrow: {
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#8a6a2f',
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 1,
  },
  modernHeroNamePlate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1,
  },
  modernHeroHonorific: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#2b2b2a',
    color: '#f7efe2',
    fontSize: 20,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  modernHeroDetailGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    zIndex: 1,
  },
  modernHeroDetailCard: {
    flex: 1,
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: '#e3d6c3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  modernHeroDetailLabel: {
    fontSize: 11,
    color: '#9a7a43',
    fontWeight: '800',
    marginBottom: 5,
  },
  modernHeroDetailValue: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1f2937',
    fontWeight: '800',
    textAlign: 'center',
  },
  modernCardProfile: {
    borderRadius: 26,
    backgroundColor: '#f8f4ec',
    padding: 14,
    borderWidth: 1,
    borderColor: '#d8cdbb',
    gap: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  modernProfileOlive: {
    position: 'absolute',
    right: -74,
    top: 54,
    width: 230,
    height: 170,
    opacity: 0.28,
    transform: [{ rotate: '18deg' }],
  },
  modernProfilePetals: {
    position: 'absolute',
    left: -34,
    bottom: 42,
    width: 150,
    height: 150,
    opacity: 0.22,
    transform: [{ rotate: '-12deg' }],
  },
  modernCardPhoto: {
    width: 84,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  modernCardPhotoHero: {
    width: '100%',
    height: FUNERAL_PREVIEW_FULL_HERO_HEIGHT,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    zIndex: 1,
  },
  modernPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernCardNameBlock: {
    width: '100%',
    gap: 6,
    marginTop: 8,
  },
  modernNameChip: {
    fontSize: 13,
    color: '#0f172a',
    lineHeight: 20,
    fontWeight: '700',
  },
  modernHostGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    zIndex: 1,
  },
  modernHostPill: {
    minWidth: '30%',
    flexGrow: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: '#ebe4d8',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  modernHostRelation: {
    fontSize: 11,
    color: '#8a6a2f',
    fontWeight: '800',
    marginBottom: 4,
  },
  modernHostName: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '700',
    lineHeight: 19,
  },
  modernSectionTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '800',
  },
  modernSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    zIndex: 1,
  },
  modernSectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2b2b2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#45413b',
  },
  modernSectionCopy: {
    flex: 1,
  },
  modernSectionCaption: {
    marginTop: 3,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modernInfoBlock: {
    backgroundColor: 'rgba(255,253,248,0.82)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ded5c6',
    padding: 16,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  modernHostOlive: {
    position: 'absolute',
    right: -62,
    top: -24,
    width: 190,
    height: 170,
    opacity: 0.34,
    transform: [{ rotate: '22deg' }],
  },
  modernHostLeaf: {
    position: 'absolute',
    left: 12,
    bottom: 4,
    width: 74,
    height: 74,
    opacity: 0.22,
    transform: [{ rotate: '-16deg' }],
  },
  modernScheduleDivider: {
    alignSelf: 'center',
    width: '82%',
    height: 22,
    opacity: 0.58,
    marginTop: -16,
    marginBottom: -10,
    zIndex: 1,
  },
  modernScheduleFlower: {
    position: 'absolute',
    right: -58,
    top: -20,
    width: 210,
    height: 210,
    opacity: 0.40,
    transform: [{ rotate: '12deg' }],
  },
  modernScheduleLeaf: {
    position: 'absolute',
    left: -8,
    bottom: 2,
    width: 110,
    height: 110,
    opacity: 0.32,
    transform: [{ rotate: '-14deg' }],
  },
  modernScheduleGrid: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  modernScheduleCard: {
    flex: 1,
    minHeight: 136,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: '#d9dde3',
    padding: 11,
    shadowColor: '#4a3b2a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  modernScheduleCardOrnament: {
    position: 'absolute',
    left: -28,
    bottom: -26,
    width: 86,
    height: 86,
    opacity: 0.22,
    transform: [{ rotate: '-16deg' }],
  },
  modernScheduleCardOrnamentCenter: {
    left: 'auto',
    right: -34,
    bottom: -22,
    width: 96,
    height: 96,
    opacity: 0.20,
    transform: [{ rotate: '10deg' }],
  },
  modernScheduleCardOrnamentRight: {
    left: -20,
    bottom: -22,
    width: 92,
    height: 92,
    opacity: 0.23,
    transform: [{ rotate: '-24deg' }],
  },
  modernScheduleCardActive: {
    backgroundColor: '#fff4dc',
    borderColor: '#c9a96a',
  },
  modernScheduleActiveGlow: {
    position: 'absolute',
    top: -26,
    right: -28,
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(201,169,106,0.28)',
  },
  modernScheduleCornerMark: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#c9a96a',
    borderWidth: 4,
    borderColor: '#fff7e8',
  },
  modernScheduleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 9,
  },
  modernScheduleIconCircleActive: {
    backgroundColor: 'rgba(201,169,106,0.16)',
  },
  modernScheduleSymbol: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#7b8492',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  modernScheduleSymbolActive: {
    color: '#6f5424',
  },
  modernScheduleTop: {
    minHeight: 44,
    marginBottom: 8,
    alignItems: 'center',
  },
  modernScheduleStep: {
    marginBottom: 5,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: '#a1a1aa',
  },
  modernScheduleStepActive: {
    color: '#8a6a2f',
  },
  modernScheduleLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937',
  },
  modernScheduleLabelActive: {
    color: '#6f5424',
  },
  modernScheduleActivePill: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#6f5424',
    overflow: 'hidden',
  },
  modernScheduleActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  modernScheduleValue: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  modernInfoList: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.70)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ebe4d8',
    zIndex: 1,
  },
  modernInfoPetals: {
    position: 'absolute',
    right: -28,
    top: 30,
    width: 150,
    height: 150,
    opacity: 0.26,
    transform: [{ rotate: '11deg' }],
  },
  modernInfoCotton: {
    position: 'absolute',
    left: -54,
    bottom: -54,
    width: 170,
    height: 170,
    opacity: 0.24,
    transform: [{ rotate: '-18deg' }],
  },
  modernInfoDivider: {
    position: 'absolute',
    left: '12%',
    top: 54,
    width: '76%',
    height: 34,
    opacity: 0.46,
  },
  modernGuideLeafA: {
    position: 'absolute',
    right: 26,
    top: 74,
    width: 90,
    height: 90,
    opacity: 0.26,
    transform: [{ rotate: '18deg' }],
  },
  modernGuideOlive: {
    position: 'absolute',
    left: -66,
    bottom: -30,
    width: 190,
    height: 170,
    opacity: 0.24,
    transform: [{ rotate: '-22deg' }],
  },
  modernAccountDivider: {
    position: 'absolute',
    left: '14%',
    top: 46,
    width: '72%',
    height: 34,
    opacity: 0.58,
  },
  modernAccountLeaf: {
    position: 'absolute',
    right: -10,
    bottom: -14,
    width: 110,
    height: 110,
    opacity: 0.25,
    transform: [{ rotate: '22deg' }],
  },
  modernInfoRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ebe4d8',
  },
  modernInfoRowText: {
    flex: 1,
    gap: 4,
  },
  modernInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  modernInfoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 21,
  },
  modernMessageBox: {
    backgroundColor: 'rgba(255,255,255,0.58)',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ebe4d8',
    overflow: 'hidden',
    minHeight: 88,
    zIndex: 1,
  },
  modernMessageOlive: {
    position: 'absolute',
    right: -68,
    top: 8,
    width: 200,
    height: 170,
    opacity: 0.32,
    transform: [{ rotate: '16deg' }],
  },
  modernMessagePetals: {
    position: 'absolute',
    left: -34,
    bottom: -18,
    width: 150,
    height: 150,
    opacity: 0.28,
    transform: [{ rotate: '-12deg' }],
  },
  modernGuestbookFlower: {
    position: 'absolute',
    right: -42,
    top: -28,
    width: 170,
    height: 170,
    opacity: 0.26,
    transform: [{ rotate: '12deg' }],
  },
  modernGuestbookDivider: {
    position: 'absolute',
    left: '10%',
    top: 58,
    width: '80%',
    height: 42,
    opacity: 0.52,
  },
  modernMessageOrnament: {
    position: 'absolute',
    right: 16,
    bottom: 10,
    opacity: 0.75,
  },
  modernMessageText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  modernActionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 24,
  },
  modernPrimaryButton: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modernPrimaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  modernGhostButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    alignItems: 'center',
  },
  modernGhostButtonText: {
    color: '#334155',
    fontWeight: '700',
  },

  timelineContainer: {
    flex: 1,
    backgroundColor: '#F2EFE8',
  },
  timelineCanvas: {
    padding: 16,
    gap: 14,
  },
  timelineHeader: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#D7C7AA',
    borderRadius: 0,
    padding: 20,
    gap: 8,
    overflow: 'hidden',
    borderTopWidth: 6,
    borderTopColor: '#2B2B2A',
  },
  timelineHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineHeaderTitle: {
    color: '#8A6A2F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  timelineHeaderIndex: {
    color: '#FFFDF8',
    fontSize: 13,
    fontWeight: '900',
    backgroundColor: '#2B2B2A',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timelineHeaderName: {
    fontSize: 34,
    color: '#111827',
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  timelineHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timelineHeaderMeta: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  timelineMetaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D7C7AA',
  },
  timelineVisual: {
    position: 'relative',
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    padding: 12,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  timelinePhoto: {
    width: 86,
    height: 108,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  timelinePhotoHero: {
    width: '100%',
    height: FUNERAL_PREVIEW_FULL_HERO_HEIGHT,
    borderRadius: 0,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  timelineVisualCaption: {
    width: '100%',
    borderRadius: 0,
    backgroundColor: '#F8F4EC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  timelineVisualCaptionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  timelineVisualCaptionText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  timelineLine: {
    height: 8,
    borderRadius: 999,
    width: 72,
    backgroundColor: '#ffedd5',
  },
  timelineFamilyPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 8,
    columnGap: 8,
  },
  timelineFamilyPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: '#2B2B2A',
    color: '#F8F4EC',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
  },
  timelineBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7C7AA',
    borderRadius: 0,
    padding: 16,
    gap: 12,
  },
  timelineSectionHead: {
    gap: 3,
    marginBottom: 2,
  },
  timelineSectionKicker: {
    color: '#8A6A2F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  timelineTitle: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '900',
  },
  timelineSimpleList: {
    gap: 0,
  },
  timelineSimpleItem: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 96,
  },
  timelineSimpleItemActive: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingTop: 10,
    paddingRight: 10,
    marginLeft: -4,
    marginBottom: 4,
  },
  timelineSimpleMarkerWrap: {
    width: 34,
    alignItems: 'center',
    position: 'relative',
  },
  timelineSimpleMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineSimpleMarkerActive: {
    backgroundColor: '#344256',
    borderColor: '#344256',
  },
  timelineSimpleMarkerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  timelineSimpleMarkerTextActive: {
    color: '#FFFFFF',
  },
  timelineSimpleLine: {
    position: 'absolute',
    top: 30,
    bottom: -2,
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  timelineSimpleBody: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
  },
  timelineSimpleTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 7,
  },
  timelineSimpleDay: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  timelineSimpleLabel: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
  },
  timelineSimpleValue: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    marginBottom: 3,
  },
  timelineSimpleDetail: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  timelinePosterSection: {
    backgroundColor: '#EDE7DB',
    padding: 14,
    gap: 12,
  },
  timelinePosterHead: {
    borderBottomWidth: 2,
    borderBottomColor: '#2B2B2A',
    paddingBottom: 10,
  },
  timelinePosterKicker: {
    color: '#8A6A2F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  timelinePosterTitle: {
    color: '#111827',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  timelinePosterGrid: {
    gap: 10,
  },
  timelinePosterPanel: {
    minHeight: 172,
    backgroundColor: '#F8F4EC',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D7C7AA',
  },
  timelinePosterPanelActive: {
    backgroundColor: '#2B2B2A',
    borderColor: '#2B2B2A',
  },
  timelinePosterIndex: {
    position: 'absolute',
    right: 12,
    top: 8,
    color: 'rgba(43,43,42,0.12)',
    fontSize: 72,
    lineHeight: 78,
    fontWeight: '900',
  },
  timelinePosterIndexActive: {
    color: 'rgba(248,244,236,0.14)',
  },
  timelinePosterWord: {
    color: '#2B2B2A',
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '900',
    letterSpacing: 1,
  },
  timelinePosterWordActive: {
    color: '#F8F4EC',
  },
  timelinePosterLine: {
    width: 68,
    height: 4,
    backgroundColor: '#8A6A2F',
    marginTop: 6,
    marginBottom: 16,
  },
  timelinePosterCopy: {
    maxWidth: '82%',
    gap: 4,
  },
  timelinePosterLabel: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
  },
  timelinePosterLabelActive: {
    color: '#FFFFFF',
  },
  timelinePosterValue: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },
  timelinePosterValueActive: {
    color: '#E5E7EB',
  },
  timelinePosterDetail: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  timelinePosterDetailActive: {
    color: '#CBD5E1',
  },
  timelinePosterNow: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: '#F8F4EC',
    color: '#2B2B2A',
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
  },
  timelineRecordSection: {
    backgroundColor: '#FFFDF8',
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#2B2B2A',
    paddingVertical: 18,
    paddingHorizontal: 2,
  },
  timelineRecordHead: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2A',
  },
  timelineRecordKicker: {
    color: '#8A6A2F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  timelineRecordTitle: {
    color: '#111827',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  timelineRecordList: {
    paddingHorizontal: 14,
  },
  timelineRecordItem: {
    position: 'relative',
    minHeight: 132,
    borderBottomWidth: 1,
    borderBottomColor: '#D7C7AA',
    paddingVertical: 18,
    overflow: 'hidden',
  },
  timelineRecordItemActive: {
    backgroundColor: '#F8F4EC',
    marginHorizontal: -14,
    paddingHorizontal: 14,
  },
  timelineRecordNumber: {
    position: 'absolute',
    right: 2,
    top: -2,
    color: 'rgba(43,43,42,0.08)',
    fontSize: 84,
    lineHeight: 92,
    fontWeight: '900',
  },
  timelineRecordContent: {
    maxWidth: '82%',
  },
  timelineRecordTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 7,
  },
  timelineRecordDay: {
    color: '#8A6A2F',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  timelineRecordDayActive: {
    color: '#2B2B2A',
  },
  timelineRecordLabel: {
    color: '#111827',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    marginBottom: 6,
  },
  timelineRouteMap: {
    height: 118,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingTop: 26,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  timelineRouteLine: {
    position: 'absolute',
    left: 46,
    right: 46,
    top: 47,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
  },
  timelineRouteStation: {
    width: 72,
    alignItems: 'center',
    zIndex: 1,
  },
  timelineRouteDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timelineRouteDotActive: {
    backgroundColor: '#344256',
    borderColor: '#344256',
  },
  timelineRouteDotText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
  },
  timelineRouteDotTextActive: {
    color: '#FFFFFF',
  },
  timelineRouteLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  timelineRouteLabelActive: {
    color: '#111827',
  },
  timelineRouteNow: {
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#344256',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  timelineStationDetailList: {
    gap: 8,
  },
  timelineStationDetailCard: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 13,
  },
  timelineStationDetailCardActive: {
    borderColor: '#344256',
    backgroundColor: '#F8FAFC',
  },
  timelineStationNumber: {
    width: 28,
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 14,
    position: 'relative',
    minHeight: 98,
  },
  timelineRowActive: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingVertical: 10,
    paddingRight: 10,
    marginLeft: -4,
  },
  timelineRail: {
    width: 38,
    alignItems: 'center',
    position: 'relative',
  },
  timelineNode: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodeActive: {
    backgroundColor: '#344256',
    borderColor: '#344256',
  },
  timelineNodeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineNodeTextActive: {
    color: '#FFFFFF',
  },
  timelineRailLine: {
    position: 'absolute',
    top: 34,
    bottom: -64,
    width: 2,
    backgroundColor: '#CBD5E1',
  },
  timelineDay: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  timelineContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
  },
  timelineLabel: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '900',
  },
  timelineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineLabelActive: {
    color: '#111827',
  },
  timelineCurrentBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: '#2B2B2A',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 0,
    overflow: 'hidden',
  },
  timelineValue: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
    fontWeight: '800',
  },
  timelineDetail: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  timelineInfoRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  timelineInfoIcon: {
    width: 34,
    height: 34,
    borderRadius: 0,
    backgroundColor: '#2B2B2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInfoCopy: {
    flex: 1,
    gap: 3,
  },
  timelineInfoLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineInfoText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  timelineMessageText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },

  paperLetterContainer: {
    flex: 1,
    backgroundColor: '#f5efe6',
  },
  paperLetterCanvas: {
    padding: 16,
    gap: 12,
  },
  paperLetterRibbon: {
    textAlign: 'center',
    color: '#5f4e39',
    fontWeight: '700',
    marginBottom: -6,
  },
  paperLetterCard: {
    borderRadius: 6,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#d6cec0',
    padding: 22,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  paperLetterTitle: {
    textAlign: 'center',
    fontSize: 34,
    color: '#5f4e39',
    letterSpacing: 4,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  paperLetterDateText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
  },
  paperLetterBody: {
    marginTop: 12,
    gap: 10,
  },
  paperLetterName: {
    fontSize: 28,
    color: '#111827',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  paperLetterSub: {
    color: '#4b5563',
    marginBottom: 2,
  },
  paperLetterPhoto: {
    width: 90,
    height: 110,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 6,
  },
  paperLetterPhotoHero: {
    width: '100%',
    height: FUNERAL_PREVIEW_PAPER_HERO_HEIGHT,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginBottom: 6,
    overflow: 'hidden',
  },
  paperLetterPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperLetterSeparator: {
    height: 1,
    backgroundColor: '#ddd0b8',
    marginTop: 4,
  },
  paperLetterBodyTitle: {
    color: '#7c6b52',
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  paperLetterScheduleCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e7dfd0',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fffdf8',
    gap: 8,
  },
  paperLetterScheduleRow: {
    borderTopWidth: 1,
    borderTopColor: '#eadfc7',
    paddingTop: 8,
    gap: 4,
  },
  paperLetterScheduleRowActive: {
    backgroundColor: '#f9ede0',
    borderColor: '#d6a57f',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: -6,
    marginBottom: 4,
  },
  paperLetterScheduleLabelWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paperLetterScheduleLabel: {
    fontSize: 13,
    color: '#3f372b',
    fontWeight: '700',
  },
  paperLetterScheduleStatus: {
    fontSize: 11,
    color: '#7c4a1d',
    backgroundColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '700',
  },
  paperLetterScheduleValue: {
    marginTop: 2,
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  paperLetterBodyText: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 20,
  },
  paperLetterListWrap: {
    gap: 4,
    paddingBottom: 2,
  },
  paperLetterListItem: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  paperLetterMessage: {
    backgroundColor: '#fffef9',
    borderRadius: 12,
    borderColor: '#e7dfd0',
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  paperLetterMessageTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paperLetterMessageText: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 20,
  },
  paperLetterButton: {
    borderRadius: 999,
    backgroundColor: '#5f4e39',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  paperLetterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  funeralGuideSection: {
    marginVertical: 20,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  funeralGuideSectionDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  funeralGuideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  funeralGuideTitleDark: {
    color: '#FFFFFF',
  },
  funeralGuideItem: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  funeralGuideLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  funeralGuideLabelDark: {
    color: 'rgba(255,255,255,0.72)',
  },
  funeralGuideValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
  },
  funeralGuideValueDark: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },

  // 메시지 모달 스타일
  messageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  messageModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  messageModalContent: {
    flex: 1,
  },
  messageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  messageModalBody: {
    flex: 1,
    padding: 20,
  },
  messageModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  
  // 익명 토글
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  anonymousToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousToggleText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  
  // 메시지 입력 그룹
  messageInputGroup: {
    marginBottom: 20,
  },
  messageInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  messageTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  // 메시지 제출 버튼
  messageSubmitButton: {
    backgroundColor: '#4A88FF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // 메시지 목록 스타일
  messageListContainer: {
    maxHeight: 300,
  },
  messageListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  messageListScroll: {
    maxHeight: 250,
  },
  messageItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messageItemDate: {
    fontSize: 12,
    color: '#666',
  },
  messageItemText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  
  // 메시지 없음 상태
  noMessagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMessagesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noMessagesSubtext: {
    fontSize: 14,
    color: '#999',
  },

  // ======== 증명서 스타일 템플릿 ========
  certificateContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  certificateMain: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  certificateHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  certificateTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  certificateSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  certificateNumber: {
    fontSize: 10,
    color: '#999',
  },
  certificateContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  certificateDeceasedSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  certificatePhotoWrapper: {
    width: FUNERAL_PREVIEW_FRAME_WIDTH,
    height: FUNERAL_PREVIEW_FRAME_HEIGHT,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certificatePhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  certificateDeceasedInfo: {
    alignItems: 'center',
  },
  certificateDeceasedLabelWrapper: {
    marginBottom: 8,
  },
  certificateDeceasedLabel: {
    fontSize: 12,
    color: '#666',
  },
  certificateDeceasedName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    letterSpacing: 2,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  certificateDeceasedDetails: {
    flexDirection: 'row',
    gap: 32,
  },
  certificateDetailItem: {
    alignItems: 'center',
  },
  certificateDetailLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  certificateDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  certificateSection: {
    marginBottom: 32,
  },
  certificateSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    letterSpacing: 1,
  },
  certificateFamilyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  certificateFamilyItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  certificateFamilyRelation: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  certificateFamilyName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  certificateScheduleList: {
    gap: 12,
  },
  certificateScheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f8f8f8',
  },
  certificateScheduleItemActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  certificateScheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certificateScheduleIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  certificateScheduleIndicatorActive: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  certificateScheduleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  certificateScheduleTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  certificateInfoSection: {
    gap: 24,
  },
  certificateInfoBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  certificateInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  certificateInfoContent: {
    padding: 16,
    alignItems: 'center',
  },
  certificateLocationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  certificateLocationDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  certificateLocationAddress: {
    gap: 4,
    alignItems: 'center',
  },
  certificateLocationAddressText: {
    fontSize: 12,
    color: '#999',
  },
  certificateContactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  certificateContactLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  certificateContactValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  certificateMessageSection: {
    marginBottom: 24,
  },
  certificateMessageBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  certificateMessage: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  certificateFooter: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  certificateFooterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  certificateFooterDate: {
    fontSize: 10,
    color: '#999',
  },
  certificateButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  certificateButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  certificateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  certificateMessageButton: {
    flex: 1,
    backgroundColor: '#4A88FF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  certificateMessageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  certificateShareButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  certificateShareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  // ======== 공문서 스타일 템플릿 ========
  officialContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  officialHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  officialHeaderBox: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  officialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    letterSpacing: 3,
  },
  officialSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  officialHeaderLine: {
    width: 80,
    height: 1,
    backgroundColor: '#333',
  },
  officialContent: {
    padding: 24,
    gap: 16,
  },
  officialCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 0,
    overflow: 'hidden',
  },
  officialCardHeader: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  officialCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  officialCardContent: {
    padding: 24,
  },
  officialPhotoWrapper: {
    width: FUNERAL_PREVIEW_FRAME_WIDTH,
    height: FUNERAL_PREVIEW_FRAME_HEIGHT,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    marginBottom: 24,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  officialPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  officialDeceasedName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  officialDeceasedAge: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  officialDeceasedDate: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  officialTable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  officialTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  officialTableHeaderText: {
    flex: 1,
    padding: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  officialTableBody: {
    backgroundColor: '#fff',
  },
  officialTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  officialTableCell: {
    flex: 1,
    padding: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  officialTableCellName: {
    flex: 1,
    padding: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  officialScheduleList: {
    gap: 12,
  },
  officialScheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#f8f8f8',
  },
  officialScheduleItemActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  officialScheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  officialScheduleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
  },
  officialScheduleIndicatorActive: {
    backgroundColor: '#2196f3',
  },
  officialScheduleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  officialScheduleRight: {
    alignItems: 'flex-end',
  },
  officialScheduleDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  officialScheduleTime: {
    fontSize: 12,
    color: '#666',
  },
  officialInfoGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  officialInfoCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 0,
    overflow: 'hidden',
  },
  officialLocationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  officialLocationDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  officialLocationAddress: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  officialLocationAddressText: {
    fontSize: 12,
    color: '#999',
  },
  officialContactTable: {
    gap: 8,
  },
  officialContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  officialContactLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  officialContactValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  officialMessageContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  officialMessage: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  officialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  officialButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  officialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  officialMessageButton: {
    flex: 1,
    backgroundColor: '#4A88FF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  officialMessageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  officialShareButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  officialShareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  officialFooter: {
    alignItems: 'center',
    paddingTop: 16,
  },
  officialFooterBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  officialFooterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // ======== 신문 스타일 템플릿 ========
  newspaperContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  newspaperHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 4,
    borderBottomColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  newspaperHeaderContent: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 12,
    marginBottom: 12,
  },
  newspaperTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  newspaperSubtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  newspaperDate: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  newspaperMain: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  newspaperPhotoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  newspaperPhotoFrame: {
    width: FUNERAL_PREVIEW_FRAME_WIDTH,
    height: FUNERAL_PREVIEW_FRAME_HEIGHT,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    overflow: 'hidden',
  },
  newspaperPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  newspaperHeadline: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  newspaperHeadlineTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  newspaperHeadlineAge: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  newspaperHeadlineDate: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  newspaperColumns: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  newspaperLeftColumn: {
    flex: 1,
  },
  newspaperRightColumn: {
    flex: 1,
  },
  newspaperColumnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  newspaperFamilyList: {
    gap: 8,
  },
  newspaperFamilyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newspaperFamilyRelation: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  newspaperFamilyName: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  newspaperContactList: {
    gap: 8,
  },
  newspaperContactItem: {
    alignItems: 'flex-start',
  },
  newspaperContactLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  newspaperContactValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  newspaperScheduleSection: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  newspaperScheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  newspaperScheduleTable: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  newspaperScheduleTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  newspaperScheduleTableHeaderText: {
    flex: 1,
    padding: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  newspaperScheduleTableBody: {
    backgroundColor: '#fff',
  },
  newspaperScheduleTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  newspaperScheduleTableRowActive: {
    backgroundColor: '#e3f2fd',
  },
  newspaperScheduleTableCell: {
    flex: 1,
    padding: 12,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  newspaperScheduleTableCellStatus: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newspaperStatusBadgeActive: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newspaperStatusBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  newspaperStatusEmpty: {
    fontSize: 12,
    color: '#999',
  },
  newspaperLocationBox: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#333',
    padding: 16,
  },
  newspaperLocationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  newspaperLocationContent: {
    alignItems: 'center',
    gap: 8,
  },
  newspaperLocationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  newspaperLocationDetail: {
    fontSize: 14,
    color: '#666',
  },
  newspaperLocationAddress: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  newspaperLocationAddressText: {
    fontSize: 12,
    color: '#999',
  },
  newspaperMessageBox: {
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  newspaperMessageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  newspaperMessageContent: {
    alignItems: 'center',
  },
  newspaperMessageText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  newspaperButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  newspaperButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  newspaperButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  newspaperMessageButton: {
    flex: 1,
    backgroundColor: '#4A88FF',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  newspaperMessageButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  newspaperShareButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  newspaperShareButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  newspaperFooter: {
    backgroundColor: '#333',
    alignItems: 'center',
    paddingVertical: 12,
  },
  newspaperFooterText: {
    fontSize: 12,
    color: '#fff',
  },
});

export default FuneralTemplatePreview;
