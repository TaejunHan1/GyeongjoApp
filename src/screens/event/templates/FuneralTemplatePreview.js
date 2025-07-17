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
      console.error('메시지 전송 오류:', error);
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

// 템플릿 1: 증명서 스타일 (CertificateFuneralNotice 기반)
const CertificateTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit }) => {
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
                  <Image source={{ uri: mainImage }} style={styles.certificatePhoto} />
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

        </View>

        {/* 메시지 입력 모달 */}
        {allowMessages && (
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
const OfficialTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit }) => {
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
                  <Image source={{ uri: mainImage }} style={styles.officialPhoto} />
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

          {/* 마지막 인사 */}
          <View style={styles.officialFooter}>
            <View style={styles.officialFooterBox}>
              <Text style={styles.officialFooterText}>故人의 명복을 빕니다</Text>
            </View>
          </View>

        </View>

        {/* 메시지 입력 모달 */}
        {allowMessages && (
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
const NewspaperTemplate = ({ eventData, categorizedImages, allowMessages, messageSettings, onMessageSubmit }) => {
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
                <Image source={{ uri: mainImage }} style={styles.newspaperPhoto} />
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

        {/* 신문 푸터 */}
        <View style={styles.newspaperFooter}>
          <Text style={styles.newspaperFooterText}>故人의 명복을 빕니다</Text>
        </View>

        {/* 메시지 입력 모달 */}
        {allowMessages && (
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

// 메인 컴포넌트
const FuneralTemplatePreview = ({ template, eventData, userImages, categorizedImages, allowMessages, messageSettings, onMessageSubmit }) => {
  const renderTemplate = () => {
    const templateProps = {
      eventData,
      categorizedImages,
      allowMessages,
      messageSettings,
      onMessageSubmit,
    };

    switch (template?.style) {
      case 'traditional-dark':
        return <CertificateTemplate {...templateProps} />;
      case 'modern-beige':
        return <OfficialTemplate {...templateProps} />;
      case 'simple-white':
        return <NewspaperTemplate {...templateProps} />;
      default:
        return <CertificateTemplate {...templateProps} />;
    }
  };

  return <View style={styles.container}>{renderTemplate()}</View>;
};

const styles = StyleSheet.create({
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
    width: 80,
    height: 104,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 16,
    borderRadius: 4,
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
    width: 80,
    height: 104,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
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
    width: 80,
    height: 104,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
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