import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { getCurrentUserInfo } from '../../lib/supabaseHelper';
import { getSharedEventsForCurrentUser } from '../../lib/eventSharing';
import { normalizePhone } from '../../lib/phoneUtils';
import { Colors } from '../../styles/constants';
import SimpleModal from '../../components/SimpleModal';
import { useSimpleAlert } from '../../hooks/useSimpleAlert';

const EVENT_TYPE_IMAGES = {
  wedding: require('../../../assets/icons/reciprocity/thumbs/wedding-thumb.png'),
  funeral: require('../../../assets/icons/reciprocity/thumbs/funeral-thumb.png'),
};
const THANK_YOU_HERO_IMAGE = require('../../../assets/images/thank-you/thank-you-hero.png');

const getEventTypeImage = (eventType) => (
  eventType === 'funeral' ? EVENT_TYPE_IMAGES.funeral : EVENT_TYPE_IMAGES.wedding
);

const THANK_YOU_HISTORY_PREFIX = 'thankYouMessageHistory';

const parseAdditionalInfo = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const formatPhone = (value) => {
  const d = normalizePhone(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
};

const formatAmount = (amount) => {
  const n = Number(amount || 0);
  if (!n) return '금액 미입력';
  return `${new Intl.NumberFormat('ko-KR').format(Math.round(n))}원`;
};

const getEventTypeLabel = (eventType) => (eventType === 'funeral' ? '부고' : '청첩');

const RELATION_CATEGORY_LABELS = {
  groom: '신랑측',
  bride: '신부측',
  mourner: '상주측',
  mourner_side: '상주측',
  host: '주최측',
  guest: '조문객',
  condolence_guest: '조문객',
  family: '가족',
  friend: '친구',
  colleague: '직장',
  coworker: '직장',
  relative: '친척',
  acquaintance: '지인',
  other: '기타',
};

const RELATION_DETAIL_LABELS = {
  family: '가족',
  friend: '친구',
  colleague: '직장동료',
  coworker: '직장동료',
  senior: '선배',
  junior: '후배',
  relative: '친척',
  acquaintance: '지인',
  neighbor: '이웃',
  school: '학교',
  company: '회사',
  church: '종교',
  other: '기타',
};

const getRelationLabel = (value, map) => {
  if (!value) return '';
  return map[value] || map[String(value).toLowerCase()] || value;
};

const getGivenName = (fullName = '') => {
  const name = String(fullName || '').trim().replace(/\s+/g, '');
  if (name.length >= 3) return name.slice(1);
  return name;
};

const getCasualName = (guest) => {
  const givenName = getGivenName(guest?.guest_name);
  return givenName || '친구';
};

const buildTemplateText = (guest, tone) => {
  const fullName = String(guest?.guest_name || '').trim();
  const politeName = fullName ? `${fullName}님, ` : '';
  const casualName = getCasualName(guest);
  const friendName = `${casualName}아`;
  const brotherName = `${casualName}이 형`;
  const sisterName = `${casualName}이 누나`;
  const juniorName = `${casualName}아`;
  const isFuneral = guest?.event_type === 'funeral';

  const weddingTemplates = {
    polite: `${politeName}바쁘신 와중에도 귀한 걸음과 따뜻한 마음 전해주셔서 진심으로 감사드립니다. 보내주신 마음 오래 기억하며 행복하게 잘 살겠습니다. 😊`,
    friend: `${friendName}, 와줘서 진짜 고마워. 덕분에 더 든든하고 행복한 하루였어. 보내준 마음 잊지 않고 잘 살게! 😊`,
    brother: `${brotherName}, 바쁜데 와줘서 정말 고마워. 축하해준 마음 덕분에 하루가 더 든든했어. 조만간 편하게 연락할게! 🙏`,
    sister: `${sisterName}, 바쁜데 와줘서 정말 고마워. 따뜻하게 축하해줘서 마음이 많이 든든했어. 조만간 편하게 연락할게! 😊`,
    junior: `${juniorName}, 와줘서 정말 고마워. 축하해준 마음 덕분에 하루가 더 따뜻했어. 조만간 편하게 보자! 😊`,
    short: `${politeName}함께해주시고 따뜻한 마음 전해주셔서 진심으로 감사드립니다. 🙏`,
  };

  const funeralTemplates = {
    polite: `${politeName}바쁘신 와중에도 따뜻한 위로와 마음을 전해주셔서 진심으로 감사드립니다. 덕분에 큰 힘이 되었습니다. 보내주신 마음 잊지 않겠습니다. 🤍`,
    friend: `${friendName}, 와줘서 정말 고마워. 정신없는 중에도 네 위로가 큰 힘이 됐어. 마음 써줘서 잊지 않을게. 🤍`,
    brother: `${brotherName}, 어려운 걸음 해줘서 정말 고마워. 위로해준 마음 덕분에 큰 힘이 됐어. 잊지 않을게. 🙏`,
    sister: `${sisterName}, 어려운 걸음 해줘서 정말 고마워. 따뜻하게 위로해줘서 큰 힘이 됐어. 잊지 않을게. 🤍`,
    junior: `${juniorName}, 와줘서 고마워. 챙겨준 마음 덕분에 큰 힘이 됐어. 정말 고맙게 생각하고 있어. 🤍`,
    short: `${politeName}따뜻한 위로와 마음 전해주셔서 진심으로 감사드립니다. 🤍`,
  };

  return (isFuneral ? funeralTemplates : weddingTemplates)[tone] || (isFuneral ? funeralTemplates.polite : weddingTemplates.polite);
};

const MESSAGE_TEMPLATES = [
  { key: 'polite', label: '정중', icon: 'sparkles-outline' },
  { key: 'friend', label: '친구', icon: 'happy-outline' },
  { key: 'brother', label: '형', icon: 'person-outline' },
  { key: 'sister', label: '누나', icon: 'person-outline' },
  { key: 'junior', label: '동생', icon: 'heart-outline' },
  { key: 'short', label: '짧게', icon: 'remove-outline' },
];

export default function ThankYouMessagesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('polite');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sentHistory, setSentHistory] = useState({});
  const sheetFade = React.useRef(new Animated.Value(0)).current;
  const sheetSlide = React.useRef(new Animated.Value(360)).current;
  const { showAlert, alertProps } = useSimpleAlert();
  const showAlertRef = React.useRef(showAlert);
  showAlertRef.current = showAlert;

  const sentCount = guests.filter((guest) => sentHistory[guest.id]).length;
  const pendingCount = Math.max(guests.length - sentCount, 0);

  const getHistoryKey = useCallback((userId) => (
    userId ? `${THANK_YOU_HISTORY_PREFIX}:${userId}` : THANK_YOU_HISTORY_PREFIX
  ), []);

  const loadSentHistory = useCallback(async (userId) => {
    try {
      const raw = await AsyncStorage.getItem(getHistoryKey(userId));
      const parsed = raw ? JSON.parse(raw) : {};
      setSentHistory(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setSentHistory({});
    }
  }, [getHistoryKey]);

  const saveSentHistory = useCallback(async (nextHistory, userId = currentUserId) => {
    setSentHistory(nextHistory);
    try {
      await AsyncStorage.setItem(getHistoryKey(userId), JSON.stringify(nextHistory));
    } catch (error) {
      console.warn('감사 인사 이력 저장 실패:', error);
    }
  }, [currentUserId, getHistoryKey]);

  const groupedGuests = React.useMemo(() => {
    const map = new Map();
    guests.forEach((guest) => {
      const key = guest.event_id || 'unknown';
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          event_name: guest.event_name || '행사',
          event_type: guest.event_type,
          event_date: guest.event_date,
          totalAmount: 0,
          guests: [],
        });
      }
      const group = map.get(key);
      group.totalAmount += Number(guest.amount || 0);
      group.guests.push(guest);
    });
    return Array.from(map.values()).sort((a, b) => {
      const aTime = new Date(a.event_date || 0).getTime();
      const bTime = new Date(b.event_date || 0).getTime();
      return bTime - aTime;
    });
  }, [guests]);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const info = await getCurrentUserInfo();
      const userId = info?.user?.id;
      if (!userId) {
        setGuests([]);
        return;
      }
      setCurrentUserId(userId);
      await loadSentHistory(userId);

      const [{ data: ownedEvents }, sharedResult] = await Promise.all([
        supabase
          .from('events')
          .select('id, event_name, event_type, event_date')
          .eq('user_id', userId),
        getSharedEventsForCurrentUser(),
      ]);

      const eventMap = new Map();
      [...(ownedEvents || []), ...(sharedResult?.data || [])].forEach((event) => {
        if (event?.id) eventMap.set(event.id, event);
      });

      const eventIds = Array.from(eventMap.keys());
      if (eventIds.length === 0) {
        setGuests([]);
        return;
      }

      const { data, error } = await supabase
        .from('guest_book')
        .select('id, event_id, guest_name, guest_phone, amount, relation_category, relation_detail, created_at, input_method, additional_info')
        .in('event_id', eventIds)
        .not('guest_phone', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || [])
        .map((row) => {
          const event = eventMap.get(row.event_id) || {};
          const info = parseAdditionalInfo(row.additional_info);
          return {
            ...row,
            event_name: event.event_name || '행사',
            event_type: event.event_type,
            event_date: event.event_date,
            source: row.input_method || info.created_via || 'app',
            normalized_phone: normalizePhone(row.guest_phone),
          };
        })
        .filter((row) => row.normalized_phone);

      setGuests(rows);
    } catch (error) {
      console.error('감사 인사 대상 로딩 실패:', error);
      showAlertRef.current({ title: '불러오기 실패', message: '감사 인사 대상을 불러오지 못했습니다.' });
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [loadSentHistory]);

  useFocusEffect(
    useCallback(() => {
      loadGuests();
    }, [loadGuests])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGuests();
    setRefreshing(false);
  };

  const openMessageModal = (guest) => {
    setSelectedGuest(guest);
    setSelectedTemplate('polite');
    setMessage(buildTemplateText(guest, 'polite'));
    setSheetVisible(true);
    sheetFade.setValue(0);
    sheetSlide.setValue(360);
    Animated.parallel([
      Animated.timing(sheetFade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(sheetSlide, {
        toValue: 0,
        damping: 24,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMessageModal = () => {
    Animated.parallel([
      Animated.timing(sheetFade, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetSlide, {
        toValue: 360,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSheetVisible(false);
      setSelectedGuest(null);
      setMessage('');
      setSelectedTemplate('polite');
    });
  };

  const applyTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    setMessage(buildTemplateText(selectedGuest, templateKey));
  };

  const openSmsApp = async () => {
    const phone = normalizePhone(selectedGuest?.guest_phone);
    const body = message.trim();

    if (!phone || !body) {
      showAlert({ title: '확인 필요', message: '휴대폰번호와 감사 문구를 확인해주세요.' });
      return;
    }

    try {
      const separator = Platform.OS === 'ios' ? '&' : '?';
      await Linking.openURL(`sms:${phone}${separator}body=${encodeURIComponent(body)}`);
      if (selectedGuest?.id) {
        await saveSentHistory({
          ...sentHistory,
          [selectedGuest.id]: {
            sent_at: new Date().toISOString(),
            message: body,
            phone,
            guest_name: selectedGuest.guest_name || '',
            event_id: selectedGuest.event_id || '',
            event_name: selectedGuest.event_name || '',
            template: selectedTemplate,
          },
        });
      }
      closeMessageModal();
    } catch (error) {
      showAlert({ title: '문자앱 열기 실패', message: '기본 메시지 앱을 열 수 없습니다.' });
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.78}>
          <Ionicons name="chevron-back" size={24} color="#191F28" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>감사 인사</Text>
        <View style={styles.topRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroVisual}>
            <Image source={THANK_YOU_HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          </View>
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>문자앱으로 마음을 전해요</Text>
            <Text style={styles.heroSubtitle}>
              하객을 고르면 문구를 수정한 뒤 내 휴대폰 메시지 앱으로 보낼 수 있어요.
            </Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>경조사별 대상</Text>
            <Text style={styles.listSubtitle}>행사별로 하객을 나눠서 보여요</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{guests.length}명</Text>
          </View>
        </View>

        {!loading && guests.length > 0 && (
          <View style={styles.statusSummaryRow}>
            <View style={styles.statusSummaryItem}>
              <Text style={styles.statusSummaryLabel}>미처리</Text>
              <Text style={styles.statusSummaryPending}>{pendingCount}명</Text>
            </View>
            <View style={styles.statusSummaryDivider} />
            <View style={styles.statusSummaryItem}>
              <Text style={styles.statusSummaryLabel}>처리됨</Text>
              <Text style={styles.statusSummaryDone}>{sentCount}명</Text>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>대상을 불러오는 중이에요</Text>
          </View>
        ) : guests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#C8D0DA" />
            <Text style={styles.emptyTitle}>보낼 대상이 없어요</Text>
            <Text style={styles.emptyText}>하객 접수에서 휴대폰번호가 저장되면 여기에 표시됩니다.</Text>
          </View>
        ) : (
          <View style={styles.groupList}>
            {groupedGuests.map((group) => (
              <View key={group.id} style={styles.eventGroupCard}>
                <View style={styles.eventGroupHeader}>
                  <View style={styles.eventThumbWrap}>
                    <Image
                      source={getEventTypeImage(group.event_type)}
                      style={styles.eventThumb}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.eventGroupInfo}>
                    <Text style={styles.eventGroupTitle} numberOfLines={1}>{group.event_name}</Text>
                    <Text style={styles.eventGroupMeta}>
                      {getEventTypeLabel(group.event_type)} · {group.guests.length}명 · {formatAmount(group.totalAmount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.groupGuestList}>
                  {group.guests.map((guest) => (
                    <TouchableOpacity
                      key={guest.id}
                      style={[
                        styles.guestCard,
                        sentHistory[guest.id] && styles.guestCardDone,
                      ]}
                      onPress={() => openMessageModal(guest)}
                      activeOpacity={0.82}
                    >
                      <View style={styles.guestInfo}>
                        <View style={styles.guestTopRow}>
                          <Text style={styles.guestName} numberOfLines={1}>{guest.guest_name || '이름 없음'}</Text>
                          <Text style={styles.guestAmount}>{formatAmount(guest.amount)}</Text>
                        </View>
                        <View style={styles.guestSubRow}>
                          {!!guest.relation_category && (
                            <Text style={styles.guestRelation} numberOfLines={1}>
                              {getRelationLabel(guest.relation_category, RELATION_CATEGORY_LABELS)}
                              {guest.relation_detail ? ` · ${getRelationLabel(guest.relation_detail, RELATION_DETAIL_LABELS)}` : ''}
                            </Text>
                          )}
                          <View style={styles.phoneRow}>
                            <Ionicons name="call-outline" size={13} color="#8B95A1" />
                            <Text style={styles.guestPhone}>{formatPhone(guest.guest_phone)}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={[
                        styles.sendPill,
                        sentHistory[guest.id] && styles.sendPillDone,
                      ]}>
                        {sentHistory[guest.id] ? (
                          <Ionicons name="checkmark" size={16} color="#16A34A" />
                        ) : (
                          <Ionicons name="chevron-forward" size={17} color="#2563EB" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={sheetVisible} transparent animationType="none" onRequestClose={closeMessageModal}>
        <KeyboardAvoidingView style={styles.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View style={[styles.sheetBackdrop, { opacity: sheetFade }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeMessageModal} />
          </Animated.View>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <Animated.View style={[styles.sheetCard, { transform: [{ translateY: sheetSlide }] }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTop}>
                <View>
                  <Text style={styles.sheetEyebrow}>감사 인사</Text>
                  <Text style={styles.sheetTitle}>어떤 톤으로 보낼까요?</Text>
                <Text style={styles.sheetName} numberOfLines={1}>
                  {selectedGuest?.guest_name || '하객'} · {selectedGuest?.event_name || '행사'}
                </Text>
                {!!sentHistory[selectedGuest?.id] && (
                  <Text style={styles.sheetDoneText}>이미 처리된 대상이에요. 다시 보낼 수 있어요.</Text>
                )}
              </View>
                <TouchableOpacity style={styles.sheetClose} onPress={closeMessageModal}>
                  <Ionicons name="close" size={22} color="#8B95A1" />
                </TouchableOpacity>
              </View>

              <View style={styles.sheetRecipientCard}>
                <View style={styles.sheetRecipientIcon}>
                  <Ionicons name="person-outline" size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.sheetRecipientName} numberOfLines={1}>{selectedGuest?.guest_name || '하객'}</Text>
                  <Text style={styles.sheetRecipientPhone}>{formatPhone(selectedGuest?.guest_phone || '')}</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templateRow}
                keyboardShouldPersistTaps="handled"
              >
                {MESSAGE_TEMPLATES.map((template) => {
                  const active = selectedTemplate === template.key;
                  return (
                    <TouchableOpacity
                      key={template.key}
                      style={[styles.templateChip, active && styles.templateChipActive]}
                      onPress={() => applyTemplate(template.key)}
                      activeOpacity={0.78}
                    >
                      <Ionicons
                        name={template.icon}
                        size={14}
                        color={active ? '#FFFFFF' : '#2563EB'}
                      />
                      <Text style={[styles.templateText, active && styles.templateTextActive]}>
                        {template.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.messageEditorHeader}>
                <Text style={styles.messageEditorTitle}>보낼 문구</Text>
                <Text style={styles.messageEditorCount}>{message.length}/500</Text>
              </View>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeMessageModal}>
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smsButton} onPress={openSmsApp}>
                  <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.smsText}>문자앱 열기</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <SimpleModal {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  topBar: {
    height: 58,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: 0,
  },
  topRightSpacer: {
    width: 40,
    height: 40,
  },
  content: { padding: 18, paddingBottom: 40 },
  heroCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EEF8',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 18,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  heroVisual: {
    width: 96,
    height: 76,
    borderRadius: 18,
    backgroundColor: '#F5F9FF',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTextBox: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: 0,
  },
  heroSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0,
  },
  listHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: 0,
  },
  listSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
  },
  countBadge: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563EB',
  },
  statusSummaryRow: {
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF1F5',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSummaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSummaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#EEF1F5',
  },
  statusSummaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B95A1',
  },
  statusSummaryPending: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '900',
    color: '#F59E0B',
  },
  statusSummaryDone: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '900',
    color: '#16A34A',
  },
  loadingBox: { marginTop: 80, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '700', color: '#8B95A1' },
  emptyBox: { marginTop: 80, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { marginTop: 14, fontSize: 18, fontWeight: '900', color: '#191F28' },
  emptyText: { marginTop: 8, fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#8B95A1', textAlign: 'center' },
  groupList: { gap: 14 },
  eventGroupCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF4',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  eventGroupHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  eventThumbWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventThumb: {
    width: 30,
    height: 30,
  },
  eventGroupInfo: {
    flex: 1,
    minWidth: 0,
  },
  eventGroupTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: 0,
  },
  eventGroupMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0,
  },
  groupGuestList: {
    padding: 10,
    gap: 8,
  },
  guestCard: {
    minHeight: 74,
    borderRadius: 14,
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EEF1F5',
  },
  guestCardDone: {
    backgroundColor: '#F7FCF9',
    borderColor: '#D7F0DF',
  },
  guestInfo: { flex: 1, minWidth: 0 },
  guestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guestName: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: 0,
  },
  guestAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 0,
  },
  guestSubRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  guestRelation: {
    maxWidth: '48%',
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guestPhone: { fontSize: 12, fontWeight: '800', color: '#8B95A1' },
  sendPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPillDone: {
    backgroundColor: '#DCFCE7',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.46)',
  },
  sheetCard: {
    maxHeight: '88%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D6DB',
    marginBottom: 18,
  },
  sheetTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetEyebrow: { fontSize: 12, fontWeight: '900', color: '#2563EB', letterSpacing: 0 },
  sheetTitle: { marginTop: 3, fontSize: 22, fontWeight: '900', color: '#191F28', letterSpacing: 0 },
  sheetName: { marginTop: 5, fontSize: 13, fontWeight: '800', color: '#8B95A1' },
  sheetDoneText: { marginTop: 4, fontSize: 12, fontWeight: '800', color: '#16A34A' },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F4F6', alignItems: 'center', justifyContent: 'center' },
  sheetRecipientCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  sheetRecipientIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRecipientName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#191F28',
  },
  sheetRecipientPhone: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  templateRow: {
    gap: 8,
    paddingTop: 16,
    paddingBottom: 4,
  },
  templateChip: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#CFE2FF',
    backgroundColor: '#F5F9FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  templateChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  templateText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563EB',
  },
  templateTextActive: {
    color: '#FFFFFF',
  },
  messageEditorHeader: {
    marginTop: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageEditorTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#191F28',
  },
  messageEditorCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B95A1',
  },
  messageInput: { minHeight: 178, borderRadius: 18, borderWidth: 1, borderColor: '#E1E7EF', backgroundColor: '#F9FAFB', padding: 16, fontSize: 15, lineHeight: 23, fontWeight: '700', color: '#191F28' },
  modalActions: { marginTop: 18, flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#F2F4F6', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '900', color: '#4E5968' },
  smsButton: { flex: 1.25, height: 48, borderRadius: 12, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  smsText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
});
