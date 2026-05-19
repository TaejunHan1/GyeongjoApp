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
  Linking,
  Share,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');
const FUNERAL_PREVIEW_FRAME_WIDTH = Math.min(width - 40, 360);
const FUNERAL_PREVIEW_FRAME_HEIGHT = Math.round(FUNERAL_PREVIEW_FRAME_WIDTH * 1.78);
const FUNERAL_PREVIEW_FULL_HERO_HEIGHT = FUNERAL_PREVIEW_FRAME_HEIGHT;
const FUNERAL_PREVIEW_PAPER_HERO_HEIGHT = Math.round(Math.min(width - 64, 340) * 1.78);
const FUNERAL_EDITOR_FRAME_WIDTH = width * 0.88;
const KAKAO_LOCAL_API_KEY = '8389c9b97fc151fcf5b0f7d994e16f7a';
const FUNERAL_WEB_PREVIEW_WIDTH = 430;
const TABLET_MEMORIAL_TEXT_Y_OFFSET = 0;
const MOBILE_NAME_TEXT_Y_OFFSET = 0;
const FUNERAL_MAIN_PHOTO_LAYOUT_DEFAULT = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  baseWidth: null,
};
const FUNERAL_MEMORIAL_TEXT_LAYOUT_DEFAULT = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  baseWidth: null,
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
const FUNERAL_LETTER_BG_HANJI = require('../../../../assets/funeral/elements/funeral-bg-hanji.png');
const FUNERAL_LETTER_CORNER = require('../../../../assets/funeral/elements/funeral-corner-ornament-clean.png');
const FUNERAL_LETTER_DIVIDER = require('../../../../assets/funeral/elements/funeral-divider-flower-clean.png');
const FUNERAL_LETTER_HOST_BRANCH = require('../../../../assets/funeral/elements/funeral-host-branch-clean.png');
const FUNERAL_LETTER_CANDLE = require('../../../../assets/funeral/elements/funeral-schedule-candle-clean.png');
const FUNERAL_LETTER_SCHEDULE_LINE = require('../../../../assets/funeral/elements/funeral-schedule-line.png');
const FUNERAL_LETTER_INFO_FLOWER = require('../../../../assets/funeral/elements/funeral-info-flower-clean.png');
const FUNERAL_LETTER_ACCOUNT_FLOWER = require('../../../../assets/funeral/elements/funeral-account-flower-clean.png');
const FUNERAL_LETTER_MESSAGE_PEN = require('../../../../assets/funeral/elements/funeral-message-pen-clean.png');
const FUNERAL_LETTER_GUESTBOOK_FLOWER = require('../../../../assets/funeral/elements/funeral-guestbook-flower-clean.png');
const FUNERAL_LETTER_BOTTOM_CLOUD = require('../../../../assets/funeral/elements/funeral-bottom-ink-cloud-clean.png');
const FUNERAL_TIMELINE_DIVIDER = require('../../../../assets/funeral/elements/generated/funeral-timeline-divider-modern.png');
const FUNERAL_TIMELINE_BG = require('../../../../assets/funeral/elements/generated/funeral-timeline-bg-modern.png');
const FUNERAL_ICON_HOST = require('../../../../assets/funeral/icons/icon-host.png');
const FUNERAL_ICON_SCHEDULE = require('../../../../assets/funeral/icons/icon-schedule.png');
const FUNERAL_ICON_INFO = require('../../../../assets/funeral/icons/icon-funeral-info.png');
const FUNERAL_ICON_GUIDANCE = require('../../../../assets/funeral/icons/icon-guidance.png');
const FUNERAL_ICON_ACCOUNT = require('../../../../assets/funeral/icons/icon-condolence-account.png');
const FUNERAL_ICON_FAMILY_MESSAGE = require('../../../../assets/funeral/icons/icon-family-message.png');
const FUNERAL_ICON_GUESTBOOK = require('../../../../assets/funeral/icons/icon-guestbook.png');
const FUNERAL_ICON_LOCATION = require('../../../../assets/funeral/icons/icon-location.png');
const FUNERAL_ICON_CASKET = require('../../../../assets/funeral/icons/icon-casket.png');
const FUNERAL_ICON_PROCESSION = require('../../../../assets/funeral/icons/icon-procession.png');
const FUNERAL_ICON_BURIAL = require('../../../../assets/funeral/icons/icon-burial.png');
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
  const baseWidth = Number(base.baseWidth);

  return {
    scale: Number.isFinite(scale) ? Math.min(3, Math.max(0.25, scale)) : FUNERAL_MAIN_PHOTO_LAYOUT_DEFAULT.scale,
    translateX: Number.isFinite(translateX) ? Math.min(5000, Math.max(-5000, translateX)) : FUNERAL_MAIN_PHOTO_LAYOUT_DEFAULT.translateX,
    translateY: Number.isFinite(translateY) ? Math.min(5000, Math.max(-5000, translateY)) : FUNERAL_MAIN_PHOTO_LAYOUT_DEFAULT.translateY,
    baseWidth: Number.isFinite(baseWidth) && baseWidth > 0 ? baseWidth : null,
  };
};

const getMainPhotoLayout = (eventData) => {
  const additionalInfo = getAdditionalInfo(eventData);
  const mainPhotoLayout = eventData.mainPhotoLayout || eventData.main_photo_layout || additionalInfo.main_photo_layout || additionalInfo.mainPhotoLayout;
  return normalizeMainPhotoLayout(mainPhotoLayout);
};

const getMainPhotoTransformStyle = (eventData, renderScale = 1) => {
  const layout = getMainPhotoLayout(eventData);
  return {
    transform: [
      { translateX: layout.translateX * renderScale },
      { translateY: layout.translateY * renderScale },
      { scale: layout.scale },
    ],
  };
};

const normalizeMemorialTextLayout = (layout) => {
  const base = layout && typeof layout === 'object' ? layout : {};
  const scale = Number(base.scale);
  const translateX = Number(base.translateX);
  const translateY = Number(base.translateY);
  const baseWidth = Number(base.baseWidth);

  return {
    scale: Number.isFinite(scale) ? Math.min(1.8, Math.max(0.35, scale)) : FUNERAL_MEMORIAL_TEXT_LAYOUT_DEFAULT.scale,
    translateX: Number.isFinite(translateX) ? Math.min(500, Math.max(-500, translateX)) : FUNERAL_MEMORIAL_TEXT_LAYOUT_DEFAULT.translateX,
    translateY: Number.isFinite(translateY) ? Math.min(500, Math.max(-500, translateY)) : FUNERAL_MEMORIAL_TEXT_LAYOUT_DEFAULT.translateY,
    baseWidth: Number.isFinite(baseWidth) && baseWidth > 0 ? baseWidth : null,
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

const getFuneralImageUri = (image) => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.uri || image.publicUrl || image.public_url || image.url || image.signedUrl || image.signed_url || null;
};

const getFuneralMainImageUri = (eventData = {}, categorizedImages = {}, userImages = []) => {
  const additionalInfo = getAdditionalInfo(eventData);
  const additionalCategorizedImages = additionalInfo.categorized_images || additionalInfo.categorizedImages || {};
  const candidates = [
    categorizedImages?.main?.[0],
    categorizedImages?.all?.find?.((img) => img?.category === 'main'),
    additionalCategorizedImages?.main?.[0],
    additionalCategorizedImages?.all?.find?.((img) => img?.category === 'main'),
    eventData?.images?.find?.((img) => img?.category === 'main'),
    eventData?.images?.[0],
    eventData?.image_urls?.find?.((img) => img?.category === 'main'),
    eventData?.image_urls?.[0],
    userImages?.find?.((img) => img?.category === 'main'),
    userImages?.[0],
  ];

  for (const image of candidates) {
    const uri = getFuneralImageUri(image);
    if (uri) return uri;
  }

  return null;
};

const getCurrentPageUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.href) {
    return window.location.href;
  }
  return '';
};

const shareFuneralPage = async (eventData = {}) => {
  const deceasedName = eventData.deceasedName || eventData.deceased_name || eventData.main_person_name || '고인';
  const url = getCurrentPageUrl();
  const title = `故 ${deceasedName} 부고장`;
  const message = url ? `${title}\n${url}` : title;

  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share && url) {
        await navigator.share({ title, text: title, url });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
        Alert.alert('공유 링크 복사', '부고장 링크가 복사되었습니다.');
        return;
      }
      Alert.alert('공유하기', url || '현재 공유할 링크를 찾을 수 없습니다.');
      return;
    }

    await Share.share({ title, message, url });
  } catch (error) {
    if (error?.name === 'AbortError') return;
    Alert.alert('공유 오류', '공유를 진행할 수 없습니다.');
  }
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

const FuneralComposedPhoto = ({ eventData, uri, style, nameOffsetY = 0, dateOffsetY = 0 }) => {
  const [measuredFrameWidth, setMeasuredFrameWidth] = useState(null);

  if (!uri) return null;

  const containerStyle = { ...(StyleSheet.flatten(style) || {}) };
  delete containerStyle.resizeMode;
  const nameSetting = getMemorialTextSetting(eventData, 'name');
  const dateSetting = getMemorialTextSetting(eventData, 'date');
  const frameSource = getPhotoFrameSource(eventData);
  const frameAspectRatio = getPhotoFrameAspectRatio(eventData);
  delete containerStyle.height;
  containerStyle.aspectRatio = frameAspectRatio;
  const numericFrameWidth = typeof containerStyle.width === 'number' ? containerStyle.width : null;
  const estimatedFrameWidth = measuredFrameWidth || numericFrameWidth || (width - 60);
  const mainPhotoLayout = getMainPhotoLayout(eventData);
  const translateScale = estimatedFrameWidth / (mainPhotoLayout.baseWidth || FUNERAL_EDITOR_FRAME_WIDTH);
  const fallbackTextBaseWidth = mainPhotoLayout.baseWidth || FUNERAL_EDITOR_FRAME_WIDTH;
  const nameSizeScale = Math.min(1.35, Math.max(0.55, estimatedFrameWidth / (nameSetting.layout.baseWidth || fallbackTextBaseWidth)));
  const dateSizeScale = Math.min(1.35, Math.max(0.55, estimatedFrameWidth / (dateSetting.layout.baseWidth || fallbackTextBaseWidth)));
  const mainPhotoTransformStyle = getMainPhotoTransformStyle(eventData, translateScale);
  const deceasedName = eventData.deceasedName || eventData.deceased_name || '김○○';
  const periodText = getMemorialPeriodText(eventData);

  const getTextTransform = (layout, extraY = 0) => {
    const layoutScale = estimatedFrameWidth / (layout.baseWidth || fallbackTextBaseWidth);
    return {
      transform: [
        { translateX: layout.translateX * layoutScale },
        { translateY: (layout.translateY * layoutScale) + TABLET_MEMORIAL_TEXT_Y_OFFSET + extraY },
        { scale: layout.scale },
      ],
    };
  };

  return (
    <View
      style={[containerStyle, styles.funeralComposedPhoto]}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && Math.abs((measuredFrameWidth || 0) - nextWidth) > 1) {
          setMeasuredFrameWidth(nextWidth);
        }
      }}
    >
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
            style={[styles.funeralComposedNameOverlay, getTextTransform(nameSetting.layout, MOBILE_NAME_TEXT_Y_OFFSET + nameOffsetY)]}
          >
            <Text
              style={[
                styles.funeralComposedNameText,
                {
                  fontSize: 28 * nameSizeScale,
                  lineHeight: 34 * nameSizeScale,
                },
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
            style={[styles.funeralComposedDateOverlay, getTextTransform(dateSetting.layout, dateOffsetY)]}
          >
            <Text
              style={[
                styles.funeralComposedDateText,
                {
                  marginTop: 6 * dateSizeScale,
                  fontSize: 13 * dateSizeScale,
                  lineHeight: 18 * dateSizeScale,
                },
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

const calculateFuneralAge = (birthDateValue, deathDateValue, method = 'korean_year') => {
  const birth = toDateObject(birthDateValue);
  const death = toDateObject(deathDateValue);
  if (!birth || !death) return '';

  const birthYear = birth.getFullYear();
  const birthMonth = birth.getMonth() + 1;
  const birthDay = birth.getDate();
  const deathYear = death.getFullYear();
  const deathMonth = death.getMonth() + 1;
  const deathDay = death.getDate();

  if (
    deathYear < birthYear ||
    (deathYear === birthYear && deathMonth < birthMonth) ||
    (deathYear === birthYear && deathMonth === birthMonth && deathDay < birthDay)
  ) {
    return '';
  }

  if (method === 'full_age') {
    let age = deathYear - birthYear;
    const birthdayPassed =
      deathMonth > birthMonth ||
      (deathMonth === birthMonth && deathDay >= birthDay);
    if (!birthdayPassed) age -= 1;
    return age >= 0 ? String(age) : '';
  }

  const age = deathYear - birthYear + 1;
  return age >= 0 ? String(age) : '';
};

const getDeceasedAge = (eventData) => {
  const age = getFuneralValue(eventData, 'deceasedAge', 'deceased_age') || getFuneralValue(eventData, 'age', 'age');
  if (age !== undefined && age !== null && String(age).trim()) {
    const text = String(age).trim();
    return text.endsWith('세') ? text : `${text}세`;
  }

  const calculatedAge = calculateFuneralAge(
    getFuneralValue(eventData, 'birthDate', 'birth_date'),
    getFuneralValue(eventData, 'deathDate', 'death_date'),
    getFuneralValue(eventData, 'ageCalculationMethod', 'age_calculation_method') || 'korean_year'
  );

  return calculatedAge ? `${calculatedAge}세` : '미입력';
};

const FuneralGuidanceSection = ({ eventData, variant = 'light' }) => {
  const items = getFuneralGuidanceItems(eventData);
  if (items.length === 0) return null;
  const getGuideIcon = (label = '') => {
    if (label.includes('주차') || label.includes('교통')) return 'car-outline';
    if (label.includes('조문')) return 'flower-outline';
    if (label.includes('복장')) return 'shirt-outline';
    if (label.includes('연락')) return 'call-outline';
    if (label.includes('계좌') || label.includes('부의')) return 'wallet-outline';
    return 'information-circle-outline';
  };

  return (
    <View style={[styles.funeralGuideSection, variant === 'dark' && styles.funeralGuideSectionDark]}>
      <Text style={[styles.funeralGuideTitle, variant === 'dark' && styles.funeralGuideTitleDark]}>안내</Text>
      {items.map(item => (
        <View key={item.label} style={styles.funeralGuideItem}>
          <View style={[styles.funeralGuideIcon, variant === 'dark' && styles.funeralGuideIconDark]}>
            <Ionicons
              name={getGuideIcon(item.label)}
              size={17}
              color={variant === 'dark' ? '#FFFFFF' : '#334155'}
            />
          </View>
          <View style={styles.funeralGuideCopy}>
            <Text style={[styles.funeralGuideLabel, variant === 'dark' && styles.funeralGuideLabelDark]}>{item.label}</Text>
            <Text style={[styles.funeralGuideValue, variant === 'dark' && styles.funeralGuideValueDark]}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// 템플릿 1: 증명서 스타일 (CertificateFuneralNotice 기반)
const CertificateTemplate = ({ eventData, categorizedImages, userImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [currentDate] = useState(new Date());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = getFuneralMainImageUri(eventData, categorizedImages, userImages);
  const displayCustomMessage = eventData.customMessage || eventData.custom_message || (isPreviewMode ? '고인을 추모해 주시는 모든 분들께 깊이 감사드립니다.' : null);
  const familyMembers = getFamilyMembersForPreview(eventData);
  const deceasedAge = getDeceasedAge(eventData);
  const deathDateText = formatDateText(eventData.deathDate || eventData.death_date);
  const casketScheduleText = [formatDateText(eventData.casketDate || eventData.casket_date), formatTimeText(eventData.casketTime || eventData.casket_time)].filter(Boolean).join(' ');
  const burialScheduleText = [formatDateText(eventData.burialDate || eventData.burial_date), formatTimeText(eventData.burialTime || eventData.burial_time)].filter(Boolean).join(' ');
  const burialLocation = eventData.burialLocation || eventData.burial_location;
  const hasFuneralSchedule = Boolean(casketScheduleText || burialScheduleText || burialLocation);
  const funeralHome = eventData.funeralHome || eventData.funeral_home;
  const detailAddress = eventData.detailedAddress || eventData.detailed_address;
  const funeralAddress = eventData.location;
  const primaryContact = eventData.primaryContact || eventData.primary_contact;
  
  const schedules = {
    입관: toDateObject(eventData.casketDate || eventData.casket_date),
    발인: toDateObject(eventData.burialDate || eventData.burial_date),
    장지: toDateObject(eventData.burialDate || eventData.burial_date),
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
          <Image pointerEvents="none" source={FUNERAL_LETTER_BG_HANJI} style={styles.certificateBackgroundTexture} resizeMode="cover" />
          <Image pointerEvents="none" source={FUNERAL_LETTER_CORNER} style={styles.certificateCornerTop} resizeMode="contain" />
          <Image pointerEvents="none" source={FUNERAL_LETTER_CORNER} style={styles.certificateCornerBottom} resizeMode="contain" />
          {/* 메인 내용 */}
          <View style={styles.certificateContent}>
            
            {/* 고인 정보 - 중앙 배치 */}
            <View style={styles.certificateDeceasedSection}>
              <View style={styles.certificatePhotoWrapper}>
                {mainImage ? (
                  <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.certificatePhoto} />
                ) : (
                  <View style={[styles.certificatePhoto, styles.modernPhotoPlaceholder]}>
                    <Ionicons name="person" size={42} color="#9CA3AF" />
                  </View>
                )}
              </View>

              {!mainImage && (
                <Text style={styles.certificatePhotoGuide}>고인 사진을 등록하면 이 영역에 표시됩니다</Text>
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
                    <Text style={styles.certificateDetailValue}>{deceasedAge}</Text>
                  </View>
                  <View style={styles.certificateDetailItem}>
                    <Text style={styles.certificateDetailLabel}>별세일</Text>
                    <Text style={styles.certificateDetailValue}>
                      {deathDateText || '미입력'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 상주의 말 */}
            {displayCustomMessage && (
              <View style={styles.certificateMessageSection}>
                <Text style={styles.certificateSectionTitle}>상주의 말</Text>
                <Image pointerEvents="none" source={FUNERAL_LETTER_DIVIDER} style={styles.certificateSectionDivider} resizeMode="contain" />
                <View style={styles.certificateMessageBox}>
                  <Text style={styles.certificateMessage}>
                    {displayCustomMessage}
                  </Text>
                </View>
              </View>
            )}

            {/* 상주 정보 */}
            <View style={styles.certificateSection}>
              <Text style={styles.certificateSectionTitle}>상 주</Text>
              <Image pointerEvents="none" source={FUNERAL_LETTER_DIVIDER} style={styles.certificateSectionDivider} resizeMode="contain" />
              <View style={styles.certificateFamilyGrid}>
                {familyMembers.map((member, index) => (
                  <View key={index} style={styles.certificateFamilyItem}>
                    <Text style={styles.certificateFamilyRelation}>{member.relation}</Text>
                    <Text style={styles.certificateFamilyName}>{member.names}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 일정 */}
            {hasFuneralSchedule && (
            <View style={styles.certificateSection}>
              <Text style={styles.certificateSectionTitle}>장례 일정</Text>
              <Image pointerEvents="none" source={FUNERAL_LETTER_DIVIDER} style={styles.certificateSectionDivider} resizeMode="contain" />
              <View style={styles.certificateScheduleList}>
                
                {/* 입관 일정 (입력된 경우만 표시) */}
                {!!casketScheduleText && (
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
                      {casketScheduleText}
                    </Text>
                  </View>
                )}

                {/* 발인 일정 */}
                {!!burialScheduleText && (
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
                    {burialScheduleText}
                  </Text>
                </View>
                )}

                {/* 장지 */}
                {!!burialLocation && (
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
                    {burialLocation}
                  </Text>
                </View>
                )}
              </View>
            </View>
            )}

            {/* 빈소 및 연락처 */}
            {(funeralHome || detailAddress || funeralAddress || primaryContact || eventData.secondaryContact || eventData.secondary_contact || eventData.funeralDirector || eventData.funeral_director) && (
            <View style={styles.certificateInfoSection}>
              
              {/* 빈소 */}
              {(funeralHome || detailAddress || funeralAddress) && (
              <View style={styles.certificateInfoBox}>
                <Text style={styles.certificateInfoTitle}>빈소</Text>
                <View style={styles.certificateInfoContent}>
                  {!!funeralHome && (
                  <Text style={styles.certificateLocationName}>
                    {funeralHome}
                  </Text>
                  )}
                  {!!detailAddress && (
                  <Text style={styles.certificateLocationDetail}>
                    {detailAddress}
                  </Text>
                  )}
                  {!!funeralAddress && (
                  <View style={styles.certificateLocationAddress}>
                    <Text style={styles.certificateLocationAddressText}>
                      {funeralAddress}
                    </Text>
                  </View>
                  )}
                </View>
              </View>
              )}

              {/* 연락처 */}
              {(primaryContact || eventData.secondaryContact || eventData.secondary_contact || eventData.funeralDirector || eventData.funeral_director) && (
              <View style={styles.certificateInfoBox}>
                <Text style={styles.certificateInfoTitle}>연락처</Text>
                <View style={styles.certificateInfoContent}>
                  {!!primaryContact && (
                  <View style={styles.certificateContactItem}>
                    <Text style={styles.certificateContactLabel}>상주</Text>
                    <Text style={styles.certificateContactValue}>
                      {primaryContact}
                    </Text>
                  </View>
                  )}
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
              )}
            </View>
            )}

            <FuneralGuidanceSection eventData={eventData} />

            {/* 조문 메시지 섹션 */}
            {allowMessages && (
              <View style={styles.certificateMessageSection}>
                <Text style={styles.certificateSectionTitle}>조문 메시지</Text>
                <Image pointerEvents="none" source={FUNERAL_LETTER_DIVIDER} style={styles.certificateSectionDivider} resizeMode="contain" />
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
            <TouchableOpacity style={styles.certificateShareButton} onPress={() => shareFuneralPage(eventData)}>
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
const OfficialTemplate = ({ eventData, categorizedImages, userImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [currentDate] = useState(new Date());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = getFuneralMainImageUri(eventData, categorizedImages, userImages);
  const displayCustomMessage = eventData.customMessage || eventData.custom_message || (isPreviewMode ? '고인을 추모해 주시는 모든 분들께 깊이 감사드립니다.' : null);
  
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
                享年 {getDeceasedAge(eventData)}
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

          {/* 상주의 말 */}
          {displayCustomMessage && (
            <View style={styles.officialCard}>
              <View style={styles.officialCardHeader}>
                <Text style={styles.officialCardTitle}>상주의 말</Text>
              </View>
              <View style={styles.officialCardContent}>
                <View style={styles.officialMessageContainer}>
                  <Text style={styles.officialMessage}>
                    {displayCustomMessage}
                  </Text>
                </View>
              </View>
            </View>
          )}

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
            <TouchableOpacity style={styles.officialShareButton} onPress={() => shareFuneralPage(eventData)}>
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
const NewspaperTemplate = ({ eventData, categorizedImages, userImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [currentDate] = useState(new Date());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const mainImage = getFuneralMainImageUri(eventData, categorizedImages, userImages);
  
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
              享年 {getDeceasedAge(eventData)}
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
          <TouchableOpacity style={styles.newspaperShareButton} onPress={() => shareFuneralPage(eventData)}>
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

const ModernCardTemplate = ({ eventData, categorizedImages, userImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mapCoord, setMapCoord] = useState(null);
  const mainImage = getFuneralMainImageUri(eventData, categorizedImages, userImages);
  const familyMembers = getFamilyMembersForPreview(eventData);
  const guidanceItems = getFuneralGuidanceItems(eventData);
  const accounts = getCondolenceAccounts(eventData);
  const deceasedName = eventData.deceasedName || eventData.deceased_name || '고인명';
  const deathDate = eventData.deathDate || eventData.death_date;
  const funeralHome = eventData.funeralHome || eventData.funeral_home || '○○장례식장';
  const funeralAddress = eventData.location || '주소를 입력해주세요';
  const detailAddress = eventData.detailedAddress || eventData.detailed_address;
  const primaryContact = eventData.primaryContact || eventData.primary_contact || '010-0000-0000';
  const familyMessage = eventData.customMessage || eventData.custom_message || '고인의 마지막 길에 함께 마음을 모아 주시는 모든 분들께 깊이 감사드립니다. 전해주신 따뜻한 위로와 애도의 마음을 오래도록 간직하겠습니다.';
  const funeralAddressText = `${detailAddress ? `${detailAddress} ` : ''}${funeralAddress}`;
  const mapSearchText = [funeralHome, funeralAddressText]
    .filter((text) => text && text !== '주소를 입력해주세요')
    .join(' ');
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
      value: funeralAddressText,
    },
    {
      key: 'contact',
      icon: 'call-outline',
      label: '연락처',
      value: primaryContact,
    },
  ];

  useEffect(() => {
    if (!mapSearchText) return;

    let isMounted = true;

    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(mapSearchText)}`, {
      headers: { Authorization: `KakaoAK ${KAKAO_LOCAL_API_KEY}` },
    })
      .then((response) => response.json())
      .then((data) => {
        const keywordResult = data.documents?.[0];
        if (keywordResult && isMounted) {
          setMapCoord({ lat: keywordResult.y, lng: keywordResult.x });
          return null;
        }

        if (!funeralAddress || funeralAddress === '주소를 입력해주세요') return null;

        return fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(funeralAddress)}`, {
          headers: { Authorization: `KakaoAK ${KAKAO_LOCAL_API_KEY}` },
        })
          .then((response) => response.json())
          .then((addressData) => {
            const addressResult = addressData.documents?.[0];
            if (addressResult && isMounted) {
              setMapCoord({ lat: addressResult.y, lng: addressResult.x });
            }
          });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [mapSearchText, funeralAddress]);

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
      <Text style={styles.modernSectionCaption}>{caption}</Text>
      <Text style={styles.modernSectionTitle}>{title}</Text>
      <Image pointerEvents="none" source={FUNERAL_LETTER_DIVIDER} style={styles.modernSectionDivider} resizeMode="contain" />
    </View>
  );

  const renderModernInfoRow = ({ key, icon, label, value }) => (
    <View key={key || label} style={styles.modernInfoRow}>
      <View style={styles.modernInfoRowIcon}>
        <Ionicons name={icon || 'information-circle-outline'} size={17} color="#5B6472" />
      </View>
      <View style={styles.modernInfoRowText}>
        <Text style={styles.modernInfoLabel}>{label}</Text>
        <Text style={styles.modernInfoValue}>{value}</Text>
      </View>
    </View>
  );

  const openModernMap = (type) => {
    if (!mapSearchText) return;
    const query = encodeURIComponent(mapSearchText);

    if (type === 'naver') {
      Linking.openURL(`nmap://search?query=${query}&appname=com.gyeongjo`).catch(() => {
        Linking.openURL(`https://map.naver.com/v5/search/${query}`);
      });
      return;
    }

    if (type === 'kakao') {
      Linking.openURL(`kakaomap://search?q=${query}`).catch(() => {
        Linking.openURL(`https://map.kakao.com/link/search/${query}`);
      });
      return;
    }

    Linking.openURL(`tmap://search?searchKeyword=${query}`).catch(() => {
      Linking.openURL(`https://tmap.life/search?query=${query}`);
    });
  };

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
            <Image pointerEvents="none" source={FUNERAL_LETTER_CORNER} style={styles.modernHeroCornerTop} resizeMode="contain" />
            <Image pointerEvents="none" source={FUNERAL_LETTER_BOTTOM_CLOUD} style={styles.modernHeroCloudBottom} resizeMode="stretch" />
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

          <View style={[styles.modernInfoBlock, styles.modernGreetingSection]}>
            <Image pointerEvents="none" source={FUNERAL_LETTER_MESSAGE_PEN} style={styles.modernGreetingPenArt} resizeMode="contain" />
            <Image pointerEvents="none" source={FUNERAL_LETTER_INFO_FLOWER} style={styles.modernGreetingFlowerArt} resizeMode="contain" />
            {renderModernSectionHeader('document-text-outline', '상주의 말', 'MESSAGE')}
            <View style={styles.modernGreetingBox}>
              <Text style={styles.modernGreetingText}>
                {familyMessage}
              </Text>
            </View>
          </View>

          {familyMembers.length > 0 && (
            <View style={styles.modernInfoBlock}>
              <Image pointerEvents="none" source={FUNERAL_LETTER_HOST_BRANCH} style={styles.modernHostBranchArt} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_OLIVE_BRANCH} style={styles.modernHostOlive} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernHostLeaf} resizeMode="contain" />
              {renderModernSectionHeader('people-outline', '상주', 'FAMILY')}
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
            <Image pointerEvents="none" source={FUNERAL_LETTER_CANDLE} style={styles.modernScheduleCandleArt} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_COTTON_FLOWER} style={styles.modernScheduleFlower} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernScheduleLeaf} resizeMode="contain" />
            {renderModernSectionHeader('time-outline', '조문 일정', 'SCHEDULE')}
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
            {renderModernSectionHeader('location-outline', '장례 안내', 'LOCATION')}
            <Image pointerEvents="none" source={FUNERAL_LETTER_INFO_FLOWER} style={styles.modernInfoFlowerArt} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_MAGNOLIA_PETALS} style={styles.modernInfoPetals} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_COTTON_FLOWER} style={styles.modernInfoCotton} resizeMode="contain" />
            <Image pointerEvents="none" source={MODERN_FUNERAL_DIVIDER} style={styles.modernInfoDivider} resizeMode="contain" />
            <View style={styles.modernInfoList}>
              {funeralInfoRows.map(renderModernInfoRow)}
            </View>

            <View style={styles.modernMapWrap}>
              {mapCoord ? (
                <WebView
                  source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              ) : (
                <View style={styles.modernMapPlaceholder}>
                  <Ionicons name="map-outline" size={24} color="#8B95A1" />
                  <Text style={styles.modernMapPlaceholderText}>지도를 불러오는 중...</Text>
                </View>
              )}
            </View>

            <View style={styles.modernMapButtonRow}>
              {[
                ['naver', '네이버지도'],
                ['kakao', '카카오맵'],
                ['tmap', '티맵'],
              ].map(([type, label]) => (
                <TouchableOpacity
                  key={type}
                  style={styles.modernMapButton}
                  activeOpacity={0.85}
                  onPress={() => openModernMap(type)}
                >
                  <Text style={styles.modernMapButtonText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {guidanceItems.length > 0 && (
            <View style={styles.modernInfoBlock}>
              {renderModernSectionHeader('information-circle-outline', '안내', 'GUIDE')}
              <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernGuideLeafA} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_OLIVE_BRANCH} style={styles.modernGuideOlive} resizeMode="contain" />
              <View style={styles.modernInfoList}>
                {guidanceItems.map((item, index) => renderModernInfoRow({
                  key: item.label,
                  icon: 'checkmark-circle-outline',
                  label: item.label,
                  value: item.value,
                }))}
              </View>
            </View>
          )}

          {accounts.length > 0 && (
            <View style={styles.modernInfoBlock}>
              {renderModernSectionHeader('card-outline', '부의금 계좌', 'ACCOUNT')}
              <Image pointerEvents="none" source={FUNERAL_LETTER_ACCOUNT_FLOWER} style={styles.modernAccountFlowerArt} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_DIVIDER} style={styles.modernAccountDivider} resizeMode="contain" />
              <Image pointerEvents="none" source={MODERN_FUNERAL_SINGLE_LEAF} style={styles.modernAccountLeaf} resizeMode="contain" />
              <View style={styles.modernInfoList}>
                {accounts.map((account) => renderModernInfoRow({
                  key: `${account.bank_name}-${account.account_number}`,
                  icon: 'wallet-outline',
                  label: account.bank_name || account.bankName,
                  value: `${account.account_number || account.accountNumber || ''} ${account.owner_name || account.ownerName || ''}`.trim(),
                }))}
              </View>
            </View>
          )}

          {allowMessages && (
            <View style={styles.modernInfoBlock}>
              {renderModernSectionHeader('chatbubble-ellipses-outline', '조문 메시지', 'GUESTBOOK')}
              <Image pointerEvents="none" source={FUNERAL_LETTER_GUESTBOOK_FLOWER} style={styles.modernGuestbookFlowerArt} resizeMode="contain" />
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
              <TouchableOpacity style={styles.modernGhostButton} onPress={() => shareFuneralPage(eventData)}>
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

const EditorialTimelineTemplate = ({ eventData, categorizedImages, userImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mapCoord, setMapCoord] = useState(null);
  const mainImage = getFuneralMainImageUri(eventData, categorizedImages, userImages);
  const familyMembers = getFamilyMembersForPreview(eventData);
  const deceasedName = eventData.deceasedName || eventData.deceased_name || '고인명';
  const deceasedAge = getDeceasedAge(eventData);
  const deathDate = formatDateText(eventData.deathDate || eventData.death_date);
  const funeralHome = eventData.funeralHome || eventData.funeral_home || '○○장례식장';
  const funeralAddress = eventData.location || '주소를 입력해주세요';
  const detailAddress = eventData.detailedAddress || eventData.detailed_address;
  const primaryContact = eventData.primaryContact || eventData.primary_contact || '010-0000-0000';
  const familyMessage = eventData.customMessage || eventData.custom_message || '고인의 마지막 길에 함께 마음을 모아 주시는 모든 분들께 깊이 감사드립니다. 전해주신 따뜻한 위로와 애도의 마음을 오래도록 간직하겠습니다.';
  const funeralAddressText = `${detailAddress ? `${detailAddress} ` : ''}${funeralAddress}`;
  const mapSearchText = [funeralHome, funeralAddressText]
    .filter((text) => text && text !== '주소를 입력해주세요')
    .join(' ');
  const currentScheduleStep = getCurrentFuneralStep(eventData);
  const guidanceItems = getFuneralGuidanceItems(eventData).filter((item) => item.label !== '부의금 계좌');
  const accounts = getCondolenceAccounts(eventData);

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

  useEffect(() => {
    if (!mapSearchText) return;
    let isMounted = true;

    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(mapSearchText)}`, {
      headers: { Authorization: `KakaoAK ${KAKAO_LOCAL_API_KEY}` },
    })
      .then((response) => response.json())
      .then((data) => {
        const keywordResult = data.documents?.[0];
        if (keywordResult && isMounted) {
          setMapCoord({ lat: keywordResult.y, lng: keywordResult.x });
          return null;
        }

        if (!funeralAddress || funeralAddress === '주소를 입력해주세요') return null;

        return fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(funeralAddress)}`, {
          headers: { Authorization: `KakaoAK ${KAKAO_LOCAL_API_KEY}` },
        })
          .then((response) => response.json())
          .then((addressData) => {
            const addressResult = addressData.documents?.[0];
            if (addressResult && isMounted) {
              setMapCoord({ lat: addressResult.y, lng: addressResult.x });
            }
          });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [mapSearchText, funeralAddress]);

  const openTimelineMap = (type) => {
    if (!mapSearchText) return;
    const query = encodeURIComponent(mapSearchText);

    if (type === 'naver') {
      Linking.openURL(`nmap://search?query=${query}&appname=com.gyeongjo`).catch(() => {
        Linking.openURL(`https://map.naver.com/v5/search/${query}`);
      });
      return;
    }

    if (type === 'kakao') {
      Linking.openURL(`kakaomap://search?q=${query}`).catch(() => {
        Linking.openURL(`https://map.kakao.com/link/search/${query}`);
      });
      return;
    }

    Linking.openURL(`tmap://search?searchKeyword=${query}`).catch(() => {
      Linking.openURL(`https://tmap.life/search?query=${query}`);
    });
  };

  const renderTimelineSectionHead = (kicker, title) => (
    <View style={styles.timelineSectionHead}>
      <Text style={styles.timelineSectionKicker}>{kicker}</Text>
      <Text style={styles.timelineTitle}>{title}</Text>
      <Image pointerEvents="none" source={FUNERAL_TIMELINE_DIVIDER} style={styles.timelineSectionDividerImage} resizeMode="contain" />
    </View>
  );

  const renderTimelineBgArt = () => (
    <Image pointerEvents="none" source={FUNERAL_TIMELINE_BG} style={styles.timelineBgArt} resizeMode="cover" />
  );

  const getTimelineInfoIconName = (label = '') => {
    if (label.includes('빈소') || label.includes('장례식장')) return 'business-outline';
    if (label.includes('주소') || label.includes('위치') || label.includes('지도')) return 'location-outline';
    if (label.includes('연락') || label.includes('전화')) return 'call-outline';
    if (label.includes('주차')) return 'car-outline';
    if (label.includes('교통') || label.includes('버스') || label.includes('지하철')) return 'bus-outline';
    if (label.includes('조문')) return 'flower-outline';
    if (label.includes('예식') || label.includes('일정') || label.includes('시간')) return 'calendar-outline';
    if (label.includes('복장')) return 'shirt-outline';
    if (label.includes('계좌') || label.includes('부의')) return 'wallet-outline';
    return 'information-circle-outline';
  };

  const renderTimelineInfoRow = ({ iconName, label, value }) => (
    <View key={label} style={styles.timelineInfoRow}>
      <View style={styles.timelineInfoIcon}>
        <Ionicons name={iconName || getTimelineInfoIconName(label)} size={17} color="#3A3A37" />
      </View>
      <View style={styles.timelineInfoCopy}>
        <Text style={styles.timelineInfoLabel}>{label}</Text>
        <Text style={styles.timelineInfoText}>{value}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.timelineContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.timelineCanvas}>
          <View style={styles.timelineVisual}>
            {mainImage ? (
              <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.timelinePhotoHero} nameOffsetY={3} />
            ) : (
              <View style={[styles.timelinePhotoHero, styles.modernPhotoPlaceholder]}>
                <Ionicons name="person" size={30} color="#94A3B8" />
              </View>
            )}
          </View>

          <View style={styles.timelineHeader}>
            {renderTimelineBgArt()}
            <View style={styles.timelineHeaderTop}>
              <Text style={styles.timelineHeaderTitle}>FUNERAL TIMELINE</Text>
              {!isPreviewMode && (
                <TouchableOpacity
                  style={styles.timelineHeaderShareButton}
                  activeOpacity={0.85}
                  onPress={() => shareFuneralPage(eventData)}
                >
                  <Ionicons name="share-social-outline" size={15} color="#3A3A37" />
                  <Text style={styles.timelineHeaderShareText}>공유</Text>
                </TouchableOpacity>
              )}
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

          <View style={styles.timelineBox}>
            {renderTimelineBgArt()}
            {renderTimelineSectionHead('MESSAGE', '상주의 말')}
            <Text style={styles.timelineMessageText}>{familyMessage}</Text>
          </View>

          {familyMembers.length > 0 && (
            <View style={styles.timelineBox}>
              {renderTimelineBgArt()}
              {renderTimelineSectionHead('FAMILY', '상주')}
              <View style={styles.timelineFamilyList}>
                {familyMembers.map((member, index) => (
                  <View key={`${member.names}-${member.relation}-${index}`} style={styles.timelineFamilyItem}>
                    <Text style={styles.timelineFamilyRelation}>{member.relation}</Text>
                    <Text style={styles.timelineFamilyName}>{member.names}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.timelineBox}>
            {renderTimelineBgArt()}
            {renderTimelineSectionHead('SCHEDULE', '조문 일정')}
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
            {renderTimelineBgArt()}
            {renderTimelineSectionHead('LOCATION', '장례 안내')}
            {[
              { iconName: 'business-outline', label: '빈소', value: funeralHome },
              { iconName: 'location-outline', label: '주소', value: funeralAddressText },
              { iconName: 'call-outline', label: '연락처', value: primaryContact },
            ].map(renderTimelineInfoRow)}

            <View style={styles.timelineMapWrap}>
              {mapCoord ? (
                <WebView
                  source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#E8EDF0}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              ) : (
                <View style={styles.timelineMapPlaceholder}>
                  <Ionicons name="map-outline" size={24} color="#777068" />
                  <Text style={styles.timelineMapPlaceholderText}>지도를 불러오는 중...</Text>
                </View>
              )}
            </View>

            <View style={styles.timelineMapButtonRow}>
              {[
                ['naver', '네이버지도'],
                ['kakao', '카카오맵'],
                ['tmap', '티맵'],
              ].map(([type, label]) => (
                <TouchableOpacity
                  key={type}
                  style={styles.timelineMapButton}
                  activeOpacity={0.85}
                  onPress={() => openTimelineMap(type)}
                >
                  <Text style={styles.timelineMapButtonText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {guidanceItems.length > 0 && (
            <View style={styles.timelineBox}>
              {renderTimelineBgArt()}
              {renderTimelineSectionHead('GUIDE', '조문 안내')}
              <View style={styles.timelineInfoList}>
                {guidanceItems.map((item) => renderTimelineInfoRow({
                  label: item.label,
                  value: item.value,
                  iconName: getTimelineInfoIconName(item.label),
                }))}
              </View>
            </View>
          )}

          {accounts.length > 0 && (
            <View style={styles.timelineBox}>
              {renderTimelineBgArt()}
              {renderTimelineSectionHead('ACCOUNT', '부의금 계좌')}
              <View style={styles.timelineInfoList}>
                {accounts.map((account) => renderTimelineInfoRow({
                  label: account.bank_name || account.bankName || '은행',
                  value: `${account.account_number || account.accountNumber || ''} ${account.owner_name || account.ownerName || ''}`.trim() || '계좌 미입력',
                  iconName: 'wallet-outline',
                }))}
              </View>
            </View>
          )}

          {allowMessages && (
            <View style={styles.timelineBox}>
              {renderTimelineBgArt()}
              {renderTimelineSectionHead('GUESTBOOK', '조문 메시지')}
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
              <TouchableOpacity style={styles.modernGhostButton} onPress={() => shareFuneralPage(eventData)}>
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

const PaperLetterTemplate = ({ eventData, categorizedImages, userImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode }) => {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mapCoord, setMapCoord] = useState(null);
  const mainImage = getFuneralMainImageUri(eventData, categorizedImages, userImages);
  const familyMembers = getFamilyMembersForPreview(eventData);
  const deceasedName = eventData.deceasedName || eventData.deceased_name || '고인명';
  const deathDate = formatDateText(eventData.deathDate || eventData.death_date);
  const deathTime = formatTimeText(eventData.deathTime || eventData.death_time);
  const customMessage = eventData.customMessage || eventData.custom_message;
  const letterMessage = customMessage || '고인의 마지막 길에 함께 마음을 모아 주시는 모든 분들께 깊이 감사드립니다. 전해주신 따뜻한 위로와 애도의 마음을 오래도록 간직하겠습니다.';
  const primaryContact = eventData.primaryContact || eventData.primary_contact || '010-0000-0000';
  const funeralHome = eventData.funeralHome || eventData.funeral_home || '○○장례식장';
  const funeralAddress = eventData.location || eventData.address || '주소를 입력해주세요';
  const detailAddress = eventData.detailAddress || eventData.detail_address || eventData.detailedAddress || eventData.detailed_address;
  const guidanceItems = getFuneralGuidanceItems(eventData).filter((item) => item.label !== '부의금 계좌');
  const accounts = getCondolenceAccounts(eventData);
  const funeralAddressText = [detailAddress, funeralAddress].filter(Boolean).join(' ') || '주소를 입력해주세요';
  const mapSearchText = [funeralHome, funeralAddressText]
    .filter((text) => text && text !== '주소를 입력해주세요' && !text.includes('○○'))
    .join(' ');
  const funeralInfoRows = [
    { iconName: 'business-outline', label: '빈소', value: funeralHome },
    { iconName: 'location-outline', label: '주소', value: funeralAddressText },
    { iconName: 'call-outline', label: '연락처', value: primaryContact },
  ];
  const currentScheduleStep = getCurrentFuneralStep(eventData);
  const funeralSchedule = [
    {
      label: '입관',
      value: [formatDateText(eventData.casketDate || eventData.casket_date), formatTimeText(eventData.casketTime || eventData.casket_time)].filter(Boolean).join(' ') || '일정 미입력',
      isActive: currentScheduleStep === '입관',
    },
    {
      label: '발인',
      value: [formatDateText(eventData.burialDate || eventData.burial_date), formatTimeText(eventData.burialTime || eventData.burial_time)].filter(Boolean).join(' ') || '일정 미입력',
      isActive: currentScheduleStep === '발인',
    },
    {
      label: '장지',
      value: eventData.burialLocation || eventData.burial_location || '미입력',
      isActive: currentScheduleStep === '장지',
    },
  ];
  const funeralScheduleIcons = [FUNERAL_ICON_CASKET, FUNERAL_ICON_PROCESSION, FUNERAL_ICON_BURIAL];

  useEffect(() => {
    if (!mapSearchText) return;

    let isMounted = true;

    fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(mapSearchText)}`, {
      headers: { Authorization: `KakaoAK ${KAKAO_LOCAL_API_KEY}` },
    })
      .then((response) => response.json())
      .then((data) => {
        const keywordResult = data.documents?.[0];
        if (keywordResult && isMounted) {
          setMapCoord({ lat: keywordResult.y, lng: keywordResult.x });
          return null;
        }

        if (!funeralAddress || funeralAddress === '주소를 입력해주세요') return null;

        return fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(funeralAddress)}`, {
          headers: { Authorization: `KakaoAK ${KAKAO_LOCAL_API_KEY}` },
        })
          .then((response) => response.json())
          .then((addressData) => {
            const addressResult = addressData.documents?.[0];
            if (addressResult && isMounted) {
              setMapCoord({ lat: addressResult.y, lng: addressResult.x });
            }
          });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [mapSearchText, funeralAddress]);

  const openPaperMap = (type) => {
    if (!mapSearchText) return;
    const query = encodeURIComponent(mapSearchText);

    if (type === 'naver') {
      Linking.openURL(`nmap://search?query=${query}&appname=com.gyeongjo`).catch(() => {
        Linking.openURL(`https://map.naver.com/v5/search/${query}`);
      });
      return;
    }

    if (type === 'kakao') {
      Linking.openURL(`kakaomap://search?q=${query}`).catch(() => {
        Linking.openURL(`https://map.kakao.com/link/search/${query}`);
      });
      return;
    }

    Linking.openURL(`tmap://search?searchKeyword=${query}`).catch(() => {
      Linking.openURL(`https://tmap.life/search?query=${query}`);
    });
  };

  const getPaperInfoIconName = (label = '') => {
    if (label.includes('빈소') || label.includes('장례식장')) return 'business-outline';
    if (label.includes('주소') || label.includes('위치') || label.includes('지도')) return 'location-outline';
    if (label.includes('연락') || label.includes('전화')) return 'call-outline';
    if (label.includes('주차')) return 'car-outline';
    if (label.includes('교통') || label.includes('버스') || label.includes('지하철')) return 'bus-outline';
    if (label.includes('조문')) return 'flower-outline';
    if (label.includes('예식') || label.includes('일정') || label.includes('시간')) return 'calendar-outline';
    if (label.includes('복장')) return 'shirt-outline';
    if (label.includes('계좌') || label.includes('부의')) return 'wallet-outline';
    if (label.includes('식사') || label.includes('식권')) return 'restaurant-outline';
    return 'information-circle-outline';
  };

  const renderPaperInfoIcon = (item, fallbackName = 'information-circle-outline') => {
    const iconName = item?.iconName || getPaperInfoIconName(item?.label) || fallbackName;
    return (
      <View style={styles.paperLetterInfoRowIcon}>
        <Ionicons name={iconName} size={21} color="#7B6755" />
      </View>
    );
  };

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

  const renderPaperSection = (icon, title, subtitle, children, decorSource, decorStyle) => (
    <View style={styles.paperLetterSection}>
      <Image pointerEvents="none" source={FUNERAL_LETTER_BG_HANJI} style={styles.paperLetterSectionTexture} resizeMode="cover" />
      {!!decorSource && (
        <Image
          pointerEvents="none"
          source={decorSource}
          style={[styles.paperLetterSectionDecor, decorStyle]}
          resizeMode="contain"
        />
      )}
      <View style={styles.paperLetterSectionHeader}>
        <View style={styles.paperLetterSectionCopy}>
          {!!subtitle && <Text style={styles.paperLetterSectionSubtitle}>{subtitle}</Text>}
          <Text style={styles.paperLetterSectionTitle}>{title}</Text>
        </View>
      </View>
      <View pointerEvents="none" style={styles.paperLetterSectionDivider}>
        <View style={styles.paperLetterDividerLine} />
        <View style={styles.paperLetterDividerDot} />
        <View style={styles.paperLetterDividerLine} />
      </View>
      <View style={styles.paperLetterSectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.paperLetterContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.paperLetterCanvas}>
          <View style={styles.paperLetterCard}>
            <View pointerEvents="none" style={styles.paperLetterDecorLayer}>
              <Image source={FUNERAL_LETTER_BG_HANJI} style={styles.paperLetterHanjiTexture} resizeMode="cover" />
              <Image source={FUNERAL_LETTER_CORNER} style={styles.paperLetterCornerTop} resizeMode="contain" />
              <Image source={FUNERAL_LETTER_CORNER} style={styles.paperLetterCornerBottom} resizeMode="contain" />
              <Image source={FUNERAL_LETTER_BOTTOM_CLOUD} style={styles.paperLetterBottomCloud} resizeMode="contain" />
            </View>

            <View style={styles.paperLetterPhotoPanel}>
              {mainImage ? (
                <FuneralComposedPhoto eventData={eventData} uri={mainImage} style={styles.paperLetterPhotoHero} />
              ) : (
                <View style={[styles.paperLetterPhotoHero, styles.paperLetterPhotoPlaceholder]}>
                  <Ionicons name="person" size={46} color="#9CA3AF" />
                </View>
              )}
            </View>

            <View style={styles.paperLetterHeroBlock}>
              <Image pointerEvents="none" source={FUNERAL_LETTER_HOST_BRANCH} style={styles.paperLetterHeroLeafLeft} resizeMode="contain" />
              <Image pointerEvents="none" source={FUNERAL_LETTER_ACCOUNT_FLOWER} style={styles.paperLetterHeroFlowerRight} resizeMode="contain" />
              <View style={styles.paperLetterHeroLabelWrap}>
                <View style={styles.paperLetterHeroLabelLine} />
                <Text style={styles.paperLetterEyebrow}>MEMORIAL LETTER</Text>
                <View style={styles.paperLetterHeroLabelLine} />
              </View>
              <Text style={styles.paperLetterHeroPhrase}>삼가 고인의 명복을 빕니다</Text>
              <View style={styles.paperLetterNameRow}>
                <Text style={styles.paperLetterHonorific}>故</Text>
                <Text style={styles.paperLetterName}>{deceasedName}</Text>
              </View>
              <Text style={styles.paperLetterSub}>
                {eventData.birthDate || eventData.birth_date ? `${formatDateText(eventData.birthDate || eventData.birth_date)}  ~  ` : ''}
                {deathDate || '사망일 미입력'} · 향년 {getDeceasedAge(eventData)}
              </Text>
            </View>

            <View style={styles.paperLetterBody}>
              {renderPaperSection(FUNERAL_ICON_FAMILY_MESSAGE, '상주의 말', '가족이 전하는 말씀', (
                <View style={styles.paperLetterIntroBox}>
                  <Text style={styles.paperLetterIntroText}>{letterMessage}</Text>
                </View>
              ), FUNERAL_LETTER_MESSAGE_PEN, styles.paperLetterDecorMessage)}

              {renderPaperSection(FUNERAL_ICON_HOST, '상주', '고인을 모시는 가족', (
                <View style={styles.paperLetterHostGrid}>
                  {familyMembers.map((member, index) => (
                    <View key={`${member.relation}-${member.names}`} style={[styles.paperLetterHostPill, index === 0 && styles.paperLetterHostPillWide]}>
                      <Text style={styles.paperLetterHostRelation}>{member.relation}</Text>
                      {index > 0 && <Text style={styles.paperLetterHostDot}>·</Text>}
                      <Text style={styles.paperLetterHostName}>{member.names}</Text>
                    </View>
                  ))}
                </View>
              ), FUNERAL_LETTER_HOST_BRANCH, styles.paperLetterDecorHost)}

              {renderPaperSection(FUNERAL_ICON_SCHEDULE, '조문 일정', '입관부터 장지까지', (
                <View style={styles.paperLetterScheduleOverview}>
                  <View pointerEvents="none" style={styles.paperLetterScheduleLineArt} />
                  {funeralSchedule.map((item, index) => (
                    <View key={item.label} style={[styles.paperLetterScheduleMiniCard, item.isActive && styles.paperLetterScheduleMiniCardActive]}>
                      <View style={styles.paperLetterMiniIcon}>
                        <Image source={funeralScheduleIcons[index]} style={styles.paperLetterMiniIconImage} resizeMode="contain" />
                      </View>
                      <Text style={styles.paperLetterMiniLabel}>{item.label}</Text>
                      <Text style={styles.paperLetterMiniValue}>{item.value}</Text>
                      {item.isActive && (
                        <View style={styles.paperLetterMiniBadge}>
                          <Text style={styles.paperLetterMiniBadgeText}>진행중</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ), FUNERAL_LETTER_CANDLE, styles.paperLetterDecorSchedule)}

              {renderPaperSection(FUNERAL_ICON_INFO, '장례 안내', '빈소와 연락처', (
                <View style={styles.paperLetterInfoList}>
                  {funeralInfoRows.map((item) => (
                    <View key={item.label} style={styles.paperLetterInfoRow}>
                      {renderPaperInfoIcon(item)}
                      <View style={styles.paperLetterInfoTextWrap}>
                        <Text style={styles.paperLetterInfoLabel}>{item.label}</Text>
                        <Text style={styles.paperLetterInfoValue}>{item.value}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.paperLetterMapWrap}>
                    {mapCoord ? (
                      <WebView
                        source={{ html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${mapCoord.lat},${mapCoord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);L.marker([${mapCoord.lat},${mapCoord.lng}]).addTo(map);</script></body></html>` }}
                        style={{ flex: 1 }}
                        scrollEnabled={false}
                        javaScriptEnabled
                        originWhitelist={['*']}
                      />
                    ) : (
                      <View style={styles.paperLetterMapPlaceholder}>
                        <Ionicons name="map-outline" size={24} color="#8A7A65" />
                        <Text style={styles.paperLetterMapPlaceholderText}>지도를 불러오는 중...</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.paperLetterMapButtonRow}>
                    {[
                      ['naver', '네이버지도'],
                      ['kakao', '카카오맵'],
                      ['tmap', '티맵'],
                    ].map(([type, label]) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.paperLetterMapButton}
                        activeOpacity={0.85}
                        onPress={() => openPaperMap(type)}
                      >
                        <Text style={styles.paperLetterMapButtonText}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ), FUNERAL_LETTER_INFO_FLOWER, styles.paperLetterDecorInfo)}

              {guidanceItems.length > 0 && (
                renderPaperSection(FUNERAL_ICON_GUIDANCE, '안내', '조문 전 확인 사항', (
                  <View style={styles.paperLetterInfoList}>
                    {guidanceItems.map((item) => (
                      <View key={item.label} style={styles.paperLetterInfoRow}>
                        {renderPaperInfoIcon(item)}
                        <View style={styles.paperLetterInfoTextWrap}>
                          <Text style={styles.paperLetterInfoLabel}>{item.label}</Text>
                          <Text style={styles.paperLetterInfoValue}>{item.value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ), FUNERAL_LETTER_HOST_BRANCH, styles.paperLetterDecorGuide)
              )}

              {accounts.length > 0 && (
                renderPaperSection(FUNERAL_ICON_ACCOUNT, '부의금 계좌', '마음을 전하실 곳', (
                  <View style={styles.paperLetterInfoList}>
                    {accounts.map((account) => (
                      <View
                        key={`${account.bank_name || account.bankName}-${account.account_number || account.accountNumber}`}
                        style={styles.paperLetterInfoRow}
                      >
                        {renderPaperInfoIcon({ label: '부의금 계좌', iconName: 'wallet-outline' })}
                        <View style={styles.paperLetterInfoTextWrap}>
                          <Text style={styles.paperLetterInfoLabel}>{account.bank_name || account.bankName || '은행'}</Text>
                          <Text style={styles.paperLetterInfoValue}>
                            {`${account.account_number || account.accountNumber || ''} ${account.owner_name || account.ownerName || ''}`.trim() || '계좌 미입력'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ), FUNERAL_LETTER_ACCOUNT_FLOWER, styles.paperLetterDecorAccount)
              )}
            </View>
          </View>

          {allowMessages && (
            <View style={styles.paperLetterMessage}>
              <Image pointerEvents="none" source={FUNERAL_LETTER_BG_HANJI} style={styles.paperLetterSectionTexture} resizeMode="cover" />
              <Image
                pointerEvents="none"
                source={FUNERAL_LETTER_GUESTBOOK_FLOWER}
                style={[styles.paperLetterSectionDecor, styles.paperLetterDecorGuestbook]}
                resizeMode="contain"
              />
              <View style={styles.paperLetterSectionHeader}>
                <View style={styles.paperLetterSectionCopy}>
                  <Text style={styles.paperLetterSectionSubtitle}>남겨주신 마음</Text>
                  <Text style={styles.paperLetterSectionTitle}>조문 메시지</Text>
                </View>
              </View>
              <View pointerEvents="none" style={styles.paperLetterSectionDivider}>
                <View style={styles.paperLetterDividerLine} />
                <View style={styles.paperLetterDividerDot} />
                <View style={styles.paperLetterDividerLine} />
              </View>
              <View style={styles.paperLetterSectionContent}>
                <MessageList messages={messages} eventType="funeral" />
              </View>
            </View>
          )}

          {!isPreviewMode && (
            <View style={styles.paperLetterActionRow}>
              {allowMessages && (
                <TouchableOpacity style={styles.paperLetterButton} onPress={() => setShowMessageModal(true)}>
                  <Text style={styles.paperLetterButtonText}>조문 메시지 남기기</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.paperLetterShareButton} onPress={() => shareFuneralPage(eventData)}>
                <Text style={styles.paperLetterShareButtonText}>공유하기</Text>
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

// 메인 컴포넌트
const FuneralTemplatePreview = ({ template, eventData, userImages, categorizedImages, allowMessages, messageSettings, onMessageSubmit, isPreviewMode = false }) => {
  const renderTemplate = () => {
    const templateProps = {
      eventData,
      categorizedImages,
      userImages,
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
    top: '68%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 3,
  },
  funeralComposedDateOverlay: {
    position: 'absolute',
    top: '75%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 3,
  },
  funeralComposedNameText: {
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 34,
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
    backgroundColor: '#F5F0E7',
  },
  modernCardCanvas: {
    paddingBottom: 16,
    gap: 0,
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
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 40,
    paddingBottom: 34,
    paddingHorizontal: 24,
    borderWidth: 0,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4a3b2a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    zIndex: 2,
  },
  modernHeroBadgeRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  modernHeroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    color: '#191F28',
    fontSize: 12,
    fontWeight: '800',
  },
  modernHeroDate: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    color: '#4E5968',
    fontWeight: '700',
  },
  modernHeroTitle: {
    fontSize: 36,
    color: '#191F28',
    fontWeight: '900',
    textAlign: 'center',
    zIndex: 1,
  },
  modernHeroOlive: {
    position: 'absolute',
    right: -74,
    top: 0,
    width: 230,
    height: 190,
    opacity: 0.16,
    transform: [{ rotate: '18deg' }],
  },
  modernHeroPetals: {
    position: 'absolute',
    left: -42,
    bottom: -12,
    width: 170,
    height: 170,
    opacity: 0.14,
    transform: [{ rotate: '-12deg' }],
  },
  modernHeroCotton: {
    position: 'absolute',
    right: 28,
    bottom: -46,
    width: 150,
    height: 150,
    opacity: 0.12,
    transform: [{ rotate: '10deg' }],
  },
  modernHeroLeafAccent: {
    position: 'absolute',
    left: 18,
    top: 28,
    width: 72,
    height: 72,
    opacity: 0.10,
    transform: [{ rotate: '-24deg' }],
  },
  modernHeroDivider: {
    position: 'absolute',
    top: 8,
    left: '14%',
    width: '72%',
    height: 28,
    opacity: 0.20,
  },
  modernHeroCornerTop: {
    position: 'absolute',
    right: -8,
    top: 0,
    width: 112,
    height: 150,
    opacity: 0.22,
  },
  modernHeroCloudBottom: {
    position: 'absolute',
    left: -28,
    right: -28,
    bottom: -42,
    height: 120,
    opacity: 0.18,
  },
  modernHeroEyebrow: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#8B95A1',
    fontWeight: '500',
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
    backgroundColor: '#191F28',
    color: '#fff',
    fontSize: 20,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  modernHeroDetailGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    zIndex: 1,
  },
  modernHeroDetailCard: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  modernHeroDetailLabel: {
    fontSize: 11,
    color: '#8B95A1',
    fontWeight: '800',
    marginBottom: 5,
  },
  modernHeroDetailValue: {
    fontSize: 15,
    lineHeight: 20,
    color: '#191F28',
    fontWeight: '800',
    textAlign: 'center',
  },
  modernCardProfile: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderWidth: 0,
    gap: 0,
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
    borderRadius: 0,
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
    gap: 10,
    zIndex: 1,
    backgroundColor: '#FAF7EF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9DDC9',
    padding: 12,
  },
  modernHostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6D8',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  modernHostRelation: {
    fontSize: 12,
    color: '#8B95A1',
    fontWeight: '800',
  },
  modernHostName: {
    fontSize: 16,
    color: '#191F28',
    fontWeight: '700',
    lineHeight: 22,
  },
  modernSectionTitle: {
    fontSize: 23,
    color: '#191F28',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  modernSectionHead: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    zIndex: 1,
  },
  modernSectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#191F28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernSectionCopy: {
    flex: 1,
  },
  modernSectionCaption: {
    fontSize: 10,
    color: '#9B8562',
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
  },
  modernSectionLine: {
    width: 34,
    height: 1,
    backgroundColor: '#191F28',
    marginTop: 16,
  },
  modernSectionDivider: {
    alignSelf: 'center',
    width: '48%',
    height: 28,
    marginTop: 8,
    opacity: 0.68,
  },
  modernInfoBlock: {
    backgroundColor: '#FFFDF8',
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 24,
    paddingVertical: 46,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  modernGreetingSection: {
    paddingTop: 52,
  },
  modernGreetingPenArt: {
    position: 'absolute',
    right: -22,
    top: 34,
    width: 116,
    height: 116,
    opacity: 0.18,
    transform: [{ rotate: '-8deg' }],
  },
  modernGreetingFlowerArt: {
    position: 'absolute',
    left: -34,
    bottom: 8,
    width: 126,
    height: 130,
    opacity: 0.16,
  },
  modernGreetingBox: {
    backgroundColor: '#FAF7EF',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#E9DDC9',
    zIndex: 1,
  },
  modernGreetingText: {
    fontSize: 15,
    lineHeight: 30,
    color: '#4E5968',
    fontWeight: '400',
    textAlign: 'center',
  },
  modernHostOlive: {
    position: 'absolute',
    right: -62,
    top: -24,
    width: 190,
    height: 170,
    opacity: 0,
    transform: [{ rotate: '22deg' }],
  },
  modernHostLeaf: {
    position: 'absolute',
    left: 12,
    bottom: 4,
    width: 74,
    height: 74,
    opacity: 0,
    transform: [{ rotate: '-16deg' }],
  },
  modernScheduleDivider: {
    alignSelf: 'center',
    width: '82%',
    height: 22,
    opacity: 0,
    marginTop: -22,
    marginBottom: -22,
    zIndex: 1,
  },
  modernScheduleFlower: {
    position: 'absolute',
    right: -58,
    top: -20,
    width: 210,
    height: 210,
    opacity: 0,
    transform: [{ rotate: '12deg' }],
  },
  modernScheduleCandleArt: {
    position: 'absolute',
    right: -18,
    top: 24,
    width: 146,
    height: 158,
    opacity: 0.24,
  },
  modernScheduleLeaf: {
    position: 'absolute',
    left: -8,
    bottom: 2,
    width: 110,
    height: 110,
    opacity: 0,
    transform: [{ rotate: '-14deg' }],
  },
  modernScheduleGrid: {
    gap: 10,
    zIndex: 1,
  },
  modernScheduleCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#FAF7EF',
    borderWidth: 1,
    borderColor: '#E9DDC9',
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowOpacity: 0,
    elevation: 0,
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
    backgroundColor: '#F7EEDB',
    borderColor: '#D7BE8A',
  },
  modernScheduleActiveGlow: {
    position: 'absolute',
    top: -26,
    right: -28,
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(155,111,47,0.15)',
  },
  modernScheduleCornerMark: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#9B6F2F',
    borderWidth: 4,
    borderColor: '#F7EEDB',
  },
  modernScheduleIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernScheduleIconCircleActive: {
    backgroundColor: 'rgba(155,111,47,0.12)',
  },
  modernScheduleSymbol: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: '#7b8492',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  modernScheduleSymbolActive: {
    color: '#9B6F2F',
  },
  modernScheduleTop: {
    flex: 0.8,
    minHeight: 0,
    marginBottom: 0,
    alignItems: 'flex-start',
  },
  modernScheduleStep: {
    marginBottom: 5,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    color: '#a1a1aa',
  },
  modernScheduleStepActive: {
    color: '#9B6F2F',
  },
  modernScheduleLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937',
  },
  modernScheduleLabelActive: {
    color: '#9B6F2F',
  },
  modernScheduleActivePill: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#9B6F2F',
    overflow: 'hidden',
  },
  modernScheduleActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  modernScheduleValue: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'right',
  },
  modernInfoList: {
    borderRadius: 18,
    backgroundColor: '#FAF7EF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9DDC9',
    paddingHorizontal: 14,
    zIndex: 1,
  },
  modernInfoPetals: {
    position: 'absolute',
    right: -28,
    top: 30,
    width: 150,
    height: 150,
    opacity: 0,
    transform: [{ rotate: '11deg' }],
  },
  modernInfoFlowerArt: {
    position: 'absolute',
    right: -28,
    bottom: 10,
    width: 148,
    height: 152,
    opacity: 0.22,
  },
  modernInfoCotton: {
    position: 'absolute',
    left: -54,
    bottom: -54,
    width: 170,
    height: 170,
    opacity: 0,
    transform: [{ rotate: '-18deg' }],
  },
  modernInfoDivider: {
    position: 'absolute',
    left: '12%',
    top: 54,
    width: '76%',
    height: 34,
    opacity: 0,
  },
  modernGuideLeafA: {
    position: 'absolute',
    right: 26,
    top: 74,
    width: 90,
    height: 90,
    opacity: 0,
    transform: [{ rotate: '18deg' }],
  },
  modernGuideOlive: {
    position: 'absolute',
    left: -66,
    bottom: -30,
    width: 190,
    height: 170,
    opacity: 0,
    transform: [{ rotate: '-22deg' }],
  },
  modernAccountDivider: {
    position: 'absolute',
    left: '14%',
    top: 46,
    width: '72%',
    height: 34,
    opacity: 0,
  },
  modernAccountLeaf: {
    position: 'absolute',
    right: -10,
    bottom: -14,
    width: 110,
    height: 110,
    opacity: 0,
    transform: [{ rotate: '22deg' }],
  },
  modernHostBranchArt: {
    position: 'absolute',
    left: -42,
    top: 42,
    width: 138,
    height: 206,
    opacity: 0.20,
  },
  modernAccountFlowerArt: {
    position: 'absolute',
    right: -24,
    top: 62,
    width: 136,
    height: 136,
    opacity: 0.20,
  },
  modernGuestbookFlowerArt: {
    position: 'absolute',
    left: -22,
    bottom: 10,
    width: 136,
    height: 136,
    opacity: 0.18,
  },
  modernInfoRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE3D5',
  },
  modernInfoRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernInfoRowText: {
    flex: 1,
    gap: 4,
  },
  modernInfoLabel: {
    fontSize: 12,
    color: '#8B95A1',
    fontWeight: '700',
    marginBottom: 2,
  },
  modernInfoValue: {
    fontSize: 15,
    color: '#191F28',
    fontWeight: '600',
    lineHeight: 22,
  },
  modernMapWrap: {
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E5E8EB',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E9DDC9',
    zIndex: 1,
  },
  modernMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modernMapPlaceholderText: {
    fontSize: 14,
    color: '#8B95A1',
    fontWeight: '600',
  },
  modernMapButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    zIndex: 1,
  },
  modernMapButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#FAF7EF',
    borderWidth: 1,
    borderColor: '#E9DDC9',
  },
  modernMapButtonText: {
    fontSize: 13,
    color: '#4E5968',
    fontWeight: '800',
  },
  modernMessageBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2F4F6',
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
    backgroundColor: '#F0EFEC',
  },
  timelineCanvas: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 24,
    gap: 0,
  },
  timelineHeader: {
    backgroundColor: '#FFFDF8',
    borderWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 38,
    paddingBottom: 34,
    paddingHorizontal: 24,
    gap: 10,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    marginTop: 0,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  timelineHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  timelineHeaderTitle: {
    color: '#6F6960',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  timelineHeaderShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#D8D1C7',
    backgroundColor: '#F9F6F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 0,
  },
  timelineHeaderShareText: {
    color: '#3A3A37',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineHeaderIndex: {
    display: 'none',
  },
  timelineHeaderName: {
    fontSize: 36,
    color: '#191F28',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    textAlign: 'center',
  },
  timelineHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timelineHeaderMeta: {
    color: '#5E5A53',
    fontSize: 13,
    fontWeight: '700',
  },
  timelineMetaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#AAA193',
  },
  timelineVisual: {
    position: 'relative',
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: '#191F28',
    padding: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  timelineVisualTexture: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.16,
  },
  timelineVisualCorner: {
    position: 'absolute',
    right: -8,
    top: 12,
    width: 132,
    height: 170,
    opacity: 0.34,
    zIndex: 2,
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
    borderWidth: 0,
  },
  timelineVisualCaption: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 42,
    borderRadius: 0,
    backgroundColor: 'rgba(20,24,31,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    paddingVertical: 20,
    paddingHorizontal: 18,
    zIndex: 3,
  },
  timelineVisualCaptionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  timelineVisualCaptionText: {
    color: '#E7DED0',
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '500',
    textAlign: 'center',
  },
  timelineLine: {
    height: 8,
    borderRadius: 999,
    width: 72,
    backgroundColor: '#ffedd5',
  },
  timelineFamilyPillWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 8,
    columnGap: 8,
  },
  timelineFamilyPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.86)',
    color: '#3D352B',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
  },
  timelineBox: {
    backgroundColor: '#FFFDF8',
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  timelineBgArt: {
    position: 'absolute',
    right: -34,
    top: -86,
    width: 260,
    height: 530,
    opacity: 0.18,
  },
  timelineSectionHead: {
    alignItems: 'center',
    gap: 3,
    marginBottom: 24,
    zIndex: 1,
  },
  timelineSectionKicker: {
    color: '#777068',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  timelineTitle: {
    fontSize: 23,
    color: '#191F28',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  timelineSectionDividerImage: {
    width: '74%',
    height: 34,
    marginTop: 10,
    opacity: 0.92,
  },
  timelineFamilyList: {
    gap: 10,
    zIndex: 1,
  },
  timelineFamilyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: '#DDD6CA',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  timelineFamilyRelation: {
    color: '#777068',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  timelineFamilyName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  timelineSimpleList: {
    gap: 12,
    zIndex: 1,
  },
  timelineSimpleItem: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 0,
    backgroundColor: '#F7F5F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6CA',
    padding: 14,
    overflow: 'hidden',
  },
  timelineSimpleItemActive: {
    backgroundColor: '#F1EDE4',
    borderColor: '#C9C2B6',
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
    borderColor: '#C9C2B6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineSimpleMarkerActive: {
    backgroundColor: '#3A3A37',
    borderColor: '#3A3A37',
  },
  timelineSimpleMarkerText: {
    color: '#777068',
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
    backgroundColor: '#C9C2B6',
  },
  timelineSimpleBody: {
    flex: 1,
    borderBottomWidth: 0,
    paddingBottom: 0,
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
    backgroundColor: '#3A3A37',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
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
    color: '#777068',
    lineHeight: 18,
  },
  timelineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderTopWidth: 0,
    borderRadius: 8,
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: '#DDD6CA',
    marginBottom: 10,
    zIndex: 1,
  },
  timelineInfoList: {
    gap: 10,
    zIndex: 1,
  },
  timelineInfoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FDFBF6',
    borderWidth: 1,
    borderColor: '#DDD6CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInfoCopy: {
    flex: 1,
    gap: 3,
  },
  timelineInfoLabel: {
    color: '#777068',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineInfoText: {
    color: '#3D352B',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  timelineMapWrap: {
    height: 192,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E8EDF0',
    borderWidth: 1,
    borderColor: '#DDD6CA',
    marginTop: 6,
    zIndex: 1,
  },
  timelineMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timelineMapPlaceholderText: {
    color: '#777068',
    fontSize: 13,
    fontWeight: '700',
  },
  timelineMapButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    zIndex: 1,
  },
  timelineMapButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: '#DDD6CA',
    borderRadius: 8,
    paddingVertical: 12,
  },
  timelineMapButtonText: {
    color: '#3A3A37',
    fontSize: 12,
    fontWeight: '900',
  },
  timelineMessageText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 26,
    marginTop: 4,
    textAlign: 'center',
    backgroundColor: '#F7F5F0',
    borderWidth: 1,
    borderColor: '#DDD6CA',
    paddingVertical: 24,
    paddingHorizontal: 18,
    zIndex: 1,
  },

  paperLetterContainer: {
    flex: 1,
    backgroundColor: '#EFE8DD',
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
    }),
  },
  paperLetterCanvas: {
    paddingVertical: 34,
    paddingHorizontal: 0,
    gap: 0,
    ...(Platform.OS === 'web' && {
      width: '100%',
      maxWidth: FUNERAL_WEB_PREVIEW_WIDTH,
      alignSelf: 'center',
      paddingTop: 42,
      paddingBottom: 64,
      boxShadow: '0 24px 80px rgba(76,58,47,0.18)',
    }),
  },
  paperLetterEyebrow: {
    textAlign: 'center',
    color: '#9C735E',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  },
  paperLetterRibbon: {
    textAlign: 'center',
    color: '#5f4e39',
    fontWeight: '700',
    marginBottom: -6,
  },
  paperLetterCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    gap: 26,
    overflow: 'visible',
  },
  paperLetterDecorLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  paperLetterHanjiTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.11,
  },
  paperLetterCornerTop: {
    position: 'absolute',
    width: 86,
    height: 118,
    top: 4,
    right: 4,
    opacity: 0.22,
  },
  paperLetterCornerBottom: {
    position: 'absolute',
    width: 86,
    height: 118,
    bottom: 4,
    left: 4,
    opacity: 0.20,
    transform: [{ rotate: '180deg' }],
  },
  paperLetterBottomCloud: {
    position: 'absolute',
    width: '105%',
    height: 100,
    left: -10,
    bottom: -16,
    opacity: 0.23,
  },
  paperLetterHeroBlock: {
    position: 'relative',
    minHeight: 178,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 24,
    gap: 10,
    backgroundColor: 'rgba(255,253,249,0.94)',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(156,115,94,0.22)',
    marginHorizontal: 30,
    marginTop: 2,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#4C3A2F',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    ...(Platform.OS === 'web' && {
      marginHorizontal: 4,
      boxShadow: '0 12px 34px rgba(76,58,47,0.10)',
    }),
  },
  paperLetterHeroLeafLeft: {
    position: 'absolute',
    width: 84,
    height: 84,
    left: -26,
    top: -16,
    opacity: 0.28,
    transform: [{ rotate: '18deg' }],
  },
  paperLetterHeroFlowerRight: {
    position: 'absolute',
    width: 96,
    height: 96,
    right: -28,
    top: -18,
    opacity: 0.26,
  },
  paperLetterHeroLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  paperLetterHeroLabelLine: {
    width: 32,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(156,115,94,0.42)',
  },
  paperLetterHeroPhrase: {
    color: '#5F574C',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
  paperLetterHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  paperLetterBadgeText: {
    color: '#1C1917',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    letterSpacing: 2,
  },
  paperLetterHeroDate: {
    flex: 1,
    textAlign: 'right',
    color: '#57534E',
    fontSize: 12,
    fontWeight: '700',
  },
  paperLetterNamePlate: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(250,247,239,0.78)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#BEB7AA',
  },
  paperLetterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paperLetterHonorific: {
    color: '#9C735E',
    fontSize: 25,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    marginTop: 5,
  },
  paperLetterTitle: {
    textAlign: 'center',
    fontSize: 38,
    color: '#4D4032',
    letterSpacing: 6,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  paperLetterDateText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
  },
  paperLetterBody: {
    gap: 10,
  },
  paperLetterName: {
    fontSize: 38,
    color: '#24211E',
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    textAlign: 'center',
    letterSpacing: 2,
  },
  paperLetterSub: {
    color: '#8A7A65',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    letterSpacing: 0.4,
  },
  paperLetterHeroDivider: {
    width: '44%',
    height: 20,
    marginTop: 8,
  },
  paperLetterHeroDividerImage: {
    width: '100%',
    height: '100%',
  },
  paperLetterIntroBox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  paperLetterIntroText: {
    color: '#6F665D',
    fontSize: 15,
    lineHeight: 27,
    textAlign: 'center',
    fontWeight: '500',
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
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: '#F5F5F4',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      height: 610,
    }),
  },
  paperLetterPhotoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.16)',
    zIndex: 1,
    display: 'none',
  },
  paperLetterPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperLetterPhotoPanel: {
    position: 'relative',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: 'rgba(156,115,94,0.16)',
    borderRadius: 0,
    padding: 8,
    marginHorizontal: 26,
    marginBottom: 2,
    overflow: 'hidden',
    shadowColor: '#4C3A2F',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    ...(Platform.OS === 'web' && {
      marginHorizontal: 0,
      borderColor: 'rgba(156,115,94,0.20)',
      boxShadow: '0 14px 36px rgba(76,58,47,0.12)',
    }),
  },
  paperLetterScheduleOverview: {
    position: 'relative',
    gap: 13,
  },
  paperLetterScheduleLineArt: {
    position: 'absolute',
    top: 28,
    bottom: 28,
    left: 22,
    width: 1,
    backgroundColor: '#D6CFC2',
    opacity: 0.78,
  },
  paperLetterScheduleMiniCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4D8C6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  paperLetterScheduleMiniCardActive: {
    backgroundColor: '#F1ECE4',
    borderColor: '#BFAF98',
  },
  paperLetterMiniIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#B8AA94',
  },
  paperLetterMiniIconText: {
    color: '#292524',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  paperLetterMiniIconImage: {
    width: 36,
    height: 36,
  },
  paperLetterMiniLabel: {
    color: '#1C1917',
    fontSize: 13,
    fontWeight: '900',
  },
  paperLetterMiniValue: {
    color: '#78716C',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left',
    fontWeight: '700',
    flex: 1,
  },
  paperLetterMiniBadge: {
    marginTop: 'auto',
    backgroundColor: '#1C1917',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  paperLetterMiniBadgeText: {
    color: '#FBF8F0',
    fontSize: 9,
    fontWeight: '900',
  },
  paperLetterSeparator: {
    height: 1,
    backgroundColor: '#D8D1C2',
    marginTop: 4,
  },
  paperLetterBodyTitle: {
    color: '#292524',
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 4,
  },
  paperLetterSection: {
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    minHeight: 0,
    overflow: 'hidden',
    paddingVertical: 48,
    paddingHorizontal: 28,
    marginBottom: 0,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 32,
      paddingVertical: 54,
    }),
  },
  paperLetterSectionTexture: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.045,
  },
  paperLetterSectionHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 0,
    marginBottom: 8,
    zIndex: 1,
  },
  paperLetterSectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperLetterSectionIconImage: {
    width: 34,
    height: 34,
  },
  paperLetterSectionCopy: {
    alignItems: 'center',
  },
  paperLetterSectionContent: {
    position: 'relative',
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 14,
    zIndex: 1,
  },
  paperLetterSectionDecor: {
    position: 'absolute',
    width: 104,
    height: 104,
    right: -24,
    bottom: -26,
    opacity: 0.13,
  },
  paperLetterDecorHost: {
    width: 118,
    height: 118,
    right: -22,
    bottom: -18,
    opacity: 0.24,
    transform: [{ rotate: '-8deg' }],
  },
  paperLetterDecorSchedule: {
    width: 150,
    height: 44,
    right: 22,
    top: 34,
    bottom: undefined,
    opacity: 0.20,
  },
  paperLetterDecorInfo: {
    width: 110,
    height: 110,
    right: -28,
    bottom: -26,
    opacity: 0.22,
  },
  paperLetterDecorGuide: {
    width: 82,
    height: 82,
    right: -18,
    bottom: -18,
    opacity: 0.18,
    transform: [{ rotate: '14deg' }],
  },
  paperLetterDecorAccount: {
    width: 120,
    height: 120,
    right: -34,
    bottom: -32,
    opacity: 0.22,
  },
  paperLetterDecorMessage: {
    width: 96,
    height: 96,
    right: -22,
    bottom: -24,
    opacity: 0.20,
  },
  paperLetterDecorGuestbook: {
    width: 96,
    height: 96,
    right: -18,
    bottom: -24,
    opacity: 0.20,
  },
  paperLetterSectionTitle: {
    color: '#24211E',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '300',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  paperLetterSectionSubtitle: {
    color: '#9C735E',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  paperLetterSectionDivider: {
    width: '52%',
    height: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.72,
    marginTop: 16,
    marginBottom: 36,
    alignSelf: 'center',
    marginLeft: 0,
  },
  paperLetterDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#BFAF98',
  },
  paperLetterDividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#9C735E',
  },
  paperLetterHostGrid: {
    gap: 13,
  },
  paperLetterHostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4D8C6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  paperLetterHostPillWide: {
    width: '100%',
  },
  paperLetterHostRelation: {
    color: '#78716C',
    fontSize: 11,
    fontWeight: '900',
  },
  paperLetterHostDot: {
    color: '#A8A29E',
    fontSize: 13,
    fontWeight: '900',
    marginHorizontal: 2,
  },
  paperLetterHostName: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  paperLetterScheduleCard: {
    gap: 8,
  },
  paperLetterScheduleRow: {
    position: 'relative',
    backgroundColor: '#F8F5EE',
    borderLeftWidth: 2,
    borderLeftColor: '#D6CFC2',
    paddingVertical: 10,
    paddingLeft: 42,
    paddingRight: 10,
    gap: 4,
  },
  paperLetterScheduleRowActive: {
    backgroundColor: '#F1EDE4',
    borderLeftColor: '#1C1917',
  },
  paperLetterScheduleLabelWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paperLetterScheduleIndex: {
    position: 'absolute',
    left: 10,
    top: 10,
    color: '#A8A29E',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  paperLetterScheduleLabel: {
    fontSize: 13,
    color: '#1C1917',
    fontWeight: '900',
  },
  paperLetterScheduleStatus: {
    fontSize: 11,
    color: '#292524',
    backgroundColor: '#E7DED1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
    fontWeight: '800',
  },
  paperLetterScheduleValue: {
    marginTop: 2,
    fontSize: 13,
    color: '#57534E',
    lineHeight: 20,
  },
  paperLetterBodyText: {
    color: '#292524',
    fontSize: 13,
    lineHeight: 20,
  },
  paperLetterInfoList: {
    gap: 13,
  },
  paperLetterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4D8C6',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...(Platform.OS === 'web' && {
      paddingVertical: 15,
      paddingHorizontal: 16,
    }),
  },
  paperLetterInfoRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F2EA',
    borderWidth: 1,
    borderColor: '#E7D8C7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  paperLetterInfoRowIconImage: {
    width: 26,
    height: 26,
  },
  paperLetterInfoTextWrap: {
    flex: 1,
    gap: 2,
  },
  paperLetterInfoLabel: {
    color: '#78716C',
    fontSize: 12,
    fontWeight: '900',
  },
  paperLetterInfoValue: {
    color: '#1C1917',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  paperLetterMapWrap: {
    height: 196,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#EAE5DC',
    borderWidth: 1,
    borderColor: '#E4D8C6',
    marginTop: 4,
    ...(Platform.OS === 'web' && {
      height: 220,
    }),
  },
  paperLetterMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paperLetterMapPlaceholderText: {
    color: '#8A7A65',
    fontSize: 13,
    fontWeight: '800',
  },
  paperLetterMapButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paperLetterMapButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181713',
    borderWidth: 1,
    borderColor: '#181713',
    borderRadius: 8,
    paddingVertical: 12,
  },
  paperLetterMapButtonText: {
    color: '#FFFDF8',
    fontSize: 12,
    fontWeight: '900',
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
    position: 'relative',
    backgroundColor: '#FBF8F2',
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 50,
    paddingHorizontal: 28,
    gap: 0,
    marginHorizontal: 0,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 32,
      paddingVertical: 54,
    }),
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
    flex: 1,
    borderRadius: 0,
    backgroundColor: '#1C1917',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 0,
  },
  paperLetterActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  paperLetterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  paperLetterShareButton: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#1C1917',
    backgroundColor: '#FFFDF9',
    paddingVertical: 14,
    alignItems: 'center',
  },
  paperLetterShareButtonText: {
    color: '#1C1917',
    fontSize: 16,
    fontWeight: '700',
  },

  funeralGuideSection: {
    marginVertical: 20,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  funeralGuideIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  funeralGuideIconDark: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  funeralGuideCopy: {
    flex: 1,
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
    backgroundColor: '#ECE6DA',
  },
  certificateMain: {
    position: 'relative',
    backgroundColor: '#FFFDF8',
    marginHorizontal: 14,
    marginVertical: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFC2AE',
    overflow: 'hidden',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  certificateBackgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.08,
  },
  certificateCornerTop: {
    position: 'absolute',
    top: 10,
    right: 8,
    width: 96,
    height: 132,
    opacity: 0.16,
  },
  certificateCornerBottom: {
    position: 'absolute',
    bottom: 10,
    left: 8,
    width: 96,
    height: 132,
    opacity: 0.14,
    transform: [{ rotate: '180deg' }],
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
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 14,
  },
  certificateDeceasedSection: {
    alignItems: 'center',
    marginBottom: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8CCB8',
    borderRadius: 8,
    padding: 8,
    overflow: 'hidden',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  certificatePhotoWrapper: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 22,
    borderRadius: 6,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  certificatePhoto: {
    width: '100%',
    height: Math.round(FUNERAL_PREVIEW_PAPER_HERO_HEIGHT * 0.86),
    resizeMode: 'cover',
    alignSelf: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  certificatePhotoGuide: {
    color: '#8a8174',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    textAlign: 'center',
  },
  certificateDeceasedInfo: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  certificateDeceasedLabelWrapper: {
    marginBottom: 8,
  },
  certificateDeceasedLabel: {
    fontSize: 10,
    color: '#8A7A65',
    fontWeight: '900',
    letterSpacing: 2,
  },
  certificateDeceasedName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1C1917',
    marginBottom: 18,
    letterSpacing: 2,
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  certificateDeceasedDetails: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  certificateDetailItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F4EC',
    borderWidth: 1,
    borderColor: '#E4D8C6',
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 10,
  },
  certificateDetailLabel: {
    fontSize: 10,
    color: '#8A7A65',
    marginBottom: 4,
    fontWeight: '900',
  },
  certificateDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1917',
    textAlign: 'center',
  },
  certificateSection: {
    position: 'relative',
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8CCB8',
    borderRadius: 8,
    paddingVertical: 28,
    paddingHorizontal: 18,
    overflow: 'hidden',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  certificateSectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: 6,
    paddingBottom: 0,
    borderBottomWidth: 0,
    letterSpacing: 0,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  certificateSectionDivider: {
    width: '38%',
    height: 18,
    alignSelf: 'center',
    opacity: 0.58,
    marginBottom: 20,
  },
  certificateFamilyGrid: {
    gap: 10,
  },
  certificateFamilyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F4EC',
    borderWidth: 1,
    borderColor: '#E4D8C6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  certificateFamilyRelation: {
    fontSize: 12,
    color: '#8A7A65',
    fontWeight: '900',
  },
  certificateFamilyName: {
    fontSize: 15,
    color: '#1C1917',
    fontWeight: 'bold',
  },
  certificateScheduleList: {
    gap: 12,
  },
  certificateScheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E4D8C6',
    borderRadius: 8,
    backgroundColor: '#F8F4EC',
    gap: 12,
  },
  certificateScheduleItemActive: {
    backgroundColor: '#EFE7DA',
    borderColor: '#C8B89F',
  },
  certificateScheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certificateScheduleIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#C8B89F',
    backgroundColor: '#fff',
  },
  certificateScheduleIndicatorActive: {
    backgroundColor: '#1C1917',
    borderColor: '#1C1917',
  },
  certificateScheduleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1917',
  },
  certificateScheduleTime: {
    flex: 1,
    fontSize: 13,
    color: '#5F574C',
    fontWeight: '700',
    textAlign: 'right',
    lineHeight: 19,
  },
  certificateInfoSection: {
    gap: 14,
  },
  certificateInfoBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8CCB8',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  certificateInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1917',
    textAlign: 'center',
    backgroundColor: '#FFFDF8',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E4D8C6',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  certificateInfoContent: {
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  certificateLocationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1917',
    marginBottom: 8,
    textAlign: 'center',
  },
  certificateLocationDetail: {
    fontSize: 14,
    color: '#5F574C',
    marginBottom: 12,
    textAlign: 'center',
  },
  certificateLocationAddress: {
    gap: 4,
    alignItems: 'center',
  },
  certificateLocationAddressText: {
    fontSize: 13,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 19,
  },
  certificateContactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F8F4EC',
    borderWidth: 1,
    borderColor: '#E4D8C6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  certificateContactLabel: {
    fontSize: 12,
    color: '#8A7A65',
    fontWeight: '900',
  },
  certificateContactValue: {
    fontSize: 14,
    color: '#1C1917',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  certificateMessageSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8CCB8',
    borderRadius: 8,
    paddingVertical: 28,
    paddingHorizontal: 18,
    marginBottom: 0,
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  certificateMessageBox: {
    backgroundColor: '#F8F4EC',
    borderRadius: 8,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E4D8C6',
  },
  certificateMessage: {
    fontSize: 15,
    color: '#292524',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'normal',
  },
  certificateFooter: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: '#E4D8C6',
  },
  certificateFooterText: {
    fontSize: 14,
    color: '#5F574C',
    fontWeight: '700',
    marginBottom: 8,
  },
  certificateFooterDate: {
    fontSize: 10,
    color: '#8A7A65',
    fontWeight: '800',
  },
  certificateButtons: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 18,
    paddingTop: 2,
    gap: 8,
  },
  certificateButton: {
    flex: 1,
    backgroundColor: '#1C1917',
    paddingVertical: 14,
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
    backgroundColor: '#5F574C',
    paddingVertical: 14,
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
    backgroundColor: '#FFFDF8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C1917',
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
