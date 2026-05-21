// src/screens/main/studio/PaperInvitationFormScreen.js
// 종이 청첩장 만들기 1단계 — 데이터 입력 (사진·이름·일시·예식장)
// → "다음" 누르면 PaperInvitationLayoutScreen 으로 이동
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TC } from '../guides/tossStyle';
import { A6_ASPECT_RATIO, MOBILE_TEMPLATES } from './mobileTemplateConfigs';

const formatDate = (d) => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')} ${days[d.getDay()]}`;
};
const formatTime = (d) => {
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h < 12 ? '오전' : '오후';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${String(m).padStart(2, '0')}`;
};

// 저장된 date_str/time_str 을 Date 객체로 복원 (수정 모드용)
const parseSavedDateTime = (date_str, time_str) => {
  if (!date_str) return null;
  const dm = date_str.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!dm) return null;
  const dt = new Date(parseInt(dm[1]), parseInt(dm[2]) - 1, parseInt(dm[3]));
  if (time_str) {
    const tm =
      time_str.match(/(오전|오후)\s*(\d+):(\d+)/) ||
      time_str.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (tm) {
      const isKoreanPeriod = tm[1] === '오전' || tm[1] === '오후';
      let h = parseInt(isKoreanPeriod ? tm[2] : tm[1]);
      const min = parseInt(isKoreanPeriod ? tm[3] : tm[2]);
      const period = isKoreanPeriod ? tm[1] : (tm[3] || '').toUpperCase();
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      if (period === '오후' && h < 12) h += 12;
      if (period === '오전' && h === 12) h = 0;
      dt.setHours(h, min);
    }
  }
  return dt;
};

const GROOM_RELATION_OPTIONS = ['아들', '장남', '차남', '삼남'];
const BRIDE_RELATION_OPTIONS = ['딸', '장녀', '차녀', '삼녀'];
const TEST_PHOTO = require('../../../../assets/images/photo-book-preview.png');
const INVITATION_TEXT_SAMPLES = {
  short: [
    '서로의 오늘을 약속하는 날,\n소중한 분들을 초대합니다.\n따뜻한 마음으로 함께해 주세요.',
    '두 사람이 한 길을 걷습니다.\n기쁜 마음으로 함께해 주시면\n큰 축복이 되겠습니다.',
    '사랑으로 함께할 첫날,\n귀한 걸음으로 축복해 주세요.\n감사한 마음 오래 간직하겠습니다.',
    '저희 두 사람의 시작에\n따뜻한 마음을 더해 주세요.\n소중한 날 함께하고 싶습니다.',
    '소중한 약속의 자리에\n함께해 주시면 감사하겠습니다.\n기쁜 마음으로 모시겠습니다.',
  ],
  medium: [
    '서로에게 가장 좋은 계절이 되어준 두 사람이\n이제 하나의 이름으로 걸어가려 합니다.\n귀한 걸음으로 축복해 주세요.',
    '늘 곁에서 아껴주신 마음을 기억하며\n저희 두 사람이 새로운 시작을 합니다.\n함께 자리해 주시면 큰 기쁨이 되겠습니다.',
    '서로의 손을 잡고 같은 방향을 바라보며\n저희 두 사람이 부부의 연을 맺습니다.\n소중한 날에 함께해 주세요.',
    '작은 인연이 깊은 사랑이 되어\n평생을 함께할 약속으로 이어졌습니다.\n기쁜 날, 따뜻한 축복을 부탁드립니다.',
    '서로를 향한 믿음과 사랑으로\n새로운 가정을 이루려 합니다.\n귀한 시간 내어 함께해 주시면 감사하겠습니다.',
  ],
  long: [
    '서로 다른 길을 걷던 두 사람이\n이제 같은 마음으로 하나의 길을 걸어가려 합니다.\n그 시작의 자리에 소중한 분들을 모시고\n감사의 마음을 전하고 싶습니다.\n부디 귀한 걸음으로 함께해 주세요.',
    '오랜 시간 저희를 아껴주시고 응원해 주신 분들께\n감사한 마음을 담아 이 자리를 마련했습니다.\n저희 두 사람이 사랑과 믿음으로 새 출발을 하는 날,\n함께해 주시면 더없는 기쁨이 되겠습니다.\n축복의 마음 오래 간직하겠습니다.',
    '함께 웃고, 함께 기대며,\n서로에게 가장 든든한 사람이 되기로 약속했습니다.\n저희의 첫걸음이 따뜻한 축복 속에서 시작될 수 있도록\n귀한 걸음으로 함께해 주세요.\n앞으로의 날들도 예쁘게 살아가겠습니다.',
    '서로의 부족함을 채워주고\n서로의 기쁨을 더 크게 나누며 살아가겠습니다.\n새로운 가정을 이루는 뜻깊은 날,\n소중한 분들의 축복을 마음 깊이 간직하겠습니다.\n함께해 주시면 감사하겠습니다.',
    '두 사람이 만나 하나의 계절을 만들고\n그 계절이 이제 평생의 약속으로 이어집니다.\n저희가 함께 써 내려갈 첫 장에\n따뜻한 마음으로 함께해 주시면 감사하겠습니다.\n늘 받은 사랑을 기억하며 살아가겠습니다.',
  ],
};

const getTestPhotoInfo = () => {
  const resolved = Image.resolveAssetSource(TEST_PHOTO);
  return {
    uri: resolved?.uri || null,
    aspect: resolved?.width && resolved?.height ? resolved.width / resolved.height : null,
  };
};

export default function PaperInvitationFormScreen({ navigation, route }) {
  const invitation = route?.params?.invitation; // 수정 모드일 때 들어옴
  const isEditing = !!invitation;

  // 수정 모드: invitation.template_id로 템플릿 복원
  const template =
    route?.params?.template ||
    MOBILE_TEMPLATES.find((t) => t.id === invitation?.template_id);

  const [photoUri, setPhotoUri] = useState(invitation?.photo_url || null);
  const [photoAspect, setPhotoAspect] = useState(null); // 가로/세로 비율
  const [groom, setGroom] = useState(invitation?.groom || '');
  const [bride, setBride] = useState(invitation?.bride || '');
  const [dateObj, setDateObj] = useState(
    parseSavedDateTime(invitation?.date_str, invitation?.time_str)
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); // 'date' | 'time' (Android 용)
  const [tempDate, setTempDate] = useState(
    parseSavedDateTime(invitation?.date_str, invitation?.time_str) ||
      new Date(2026, 5, 14, 11, 30)
  );
  const [venue, setVenue] = useState(invitation?.venue || '');
  const backData = invitation?.layout?.backData || {};
  const [formStep, setFormStep] = useState(1);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [invitationText, setInvitationText] = useState(
    backData.invitationText ||
      '서로의 이름을 부르는 것만으로도\n따뜻한 약속이 되는 날,\n소중한 분들을 모시고 함께하고 싶습니다.'
  );
  const [groomFather, setGroomFather] = useState(backData.groomFather || '');
  const [groomMother, setGroomMother] = useState(backData.groomMother || '');
  const [brideFather, setBrideFather] = useState(backData.brideFather || '');
  const [brideMother, setBrideMother] = useState(backData.brideMother || '');
  const [groomRelation, setGroomRelation] = useState(backData.groomRelation || '아들');
  const [brideRelation, setBrideRelation] = useState(backData.brideRelation || '딸');
  const supportsBackSide = !!template?.hasBack;
  const templateInfoPreview =
    supportsBackSide && formStep === 2 && template?.backPreview
      ? template.backPreview
      : template?.preview;

  const fillTestData = () => {
    const testDate = new Date(2026, 4, 14, 13, 0);
    const samplePhoto = getTestPhotoInfo();

    if (samplePhoto.uri) {
      setPhotoUri(samplePhoto.uri);
      setPhotoAspect(samplePhoto.aspect);
    }
    setGroom('김민수');
    setBride('이서연');
    setDateObj(testDate);
    setTempDate(testDate);
    setVenue('신라호텔 다이너스티 홀 3층');
    setInvitationText('서로의 계절이 되어준 두 사람이\n하나의 약속으로 새 출발을 합니다.\n귀한 걸음으로 함께 축복해 주세요.');
    setGroomFather('김성호');
    setGroomMother('박미정');
    setBrideFather('이동훈');
    setBrideMother('최은영');
    setGroomRelation('장남');
    setBrideRelation('장녀');
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      // 원본 비율 저장 (가로 / 세로) — 다음 화면에서 영역 비율 자동 맞춤
      if (asset.width && asset.height) {
        setPhotoAspect(asset.width / asset.height);
      } else {
        setPhotoAspect(null);
      }
    }
  };

  const handleNext = () => {
    if (!groom.trim() || !bride.trim()) {
      Alert.alert('입력 필요', '신랑·신부 이름을 모두 입력해주세요.');
      return;
    }
    if (!dateObj) {
      Alert.alert('입력 필요', '예식 일시를 선택해주세요.');
      return;
    }
    // 예식장은 선택 사항 — 비워도 통과

    if (supportsBackSide && formStep === 1) {
      setFormStep(2);
      return;
    }

    navigation.navigate('PaperInvitationLayout', {
      template,
      formData: {
        photoUri,
        photoAspect,
        groom: groom.trim(),
        bride: bride.trim(),
        date_str: formatDate(dateObj),
        time_str: formatTime(dateObj),
        venue,
        backData: supportsBackSide
          ? {
              invitationText,
              groomFather: groomFather.trim(),
              groomMother: groomMother.trim(),
              brideFather: brideFather.trim(),
              brideMother: brideMother.trim(),
              groomRelation,
              brideRelation,
            }
          : null,
      },
      // 수정 모드: 기존 invitation의 id와 layout 전달
      editingId: invitation?.id,
      editingLayout: invitation?.layout,
    });
  };

  // 일시 picker — iOS는 modal에 datetime 인라인, Android는 chain (date → time)
  const openDateTimePicker = () => {
    setTempDate(dateObj || new Date(2026, 5, 14, 11, 30));
    if (Platform.OS === 'ios') {
      setPickerOpen(true);
    } else {
      setPickerMode('date');
      setPickerOpen(true);
    }
  };

  const handleAndroidPickerChange = (_, selected) => {
    if (!selected) {
      setPickerOpen(false);
      return;
    }
    if (pickerMode === 'date') {
      const next = new Date(tempDate);
      next.setFullYear(selected.getFullYear());
      next.setMonth(selected.getMonth());
      next.setDate(selected.getDate());
      setTempDate(next);
      setPickerMode('time');
    } else {
      const next = new Date(tempDate);
      next.setHours(selected.getHours());
      next.setMinutes(selected.getMinutes());
      setDateObj(next);
      setPickerOpen(false);
    }
  };

  if (!template) {
    return (
      <SafeAreaView style={s.root}>
        <Text style={{ padding: 20, color: TC.inkMuted }}>템플릿 정보가 없습니다</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            if (supportsBackSide && formStep === 2) {
              setFormStep(1);
              return;
            }
            navigation.goBack();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={24} color={TC.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {supportsBackSide && formStep === 2 ? '뒷면 입력' : '정보 입력'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* 진행 상태 표시 */}
      <View style={s.stepBar}>
        <View style={[s.stepDot, s.stepDotActive]}>
          <Text style={s.stepDotText}>1</Text>
        </View>
        <View style={s.stepLine} />
        {supportsBackSide && (
          <>
            <View style={[s.stepDot, formStep >= 2 && s.stepDotActive]}>
              <Text style={[s.stepDotText, formStep < 2 && { color: TC.inkMuted }]}>2</Text>
            </View>
            <View style={s.stepLine} />
          </>
        )}
        <View style={s.stepDot}>
          <Text style={[s.stepDotText, { color: TC.inkMuted }]}>
            {supportsBackSide ? '3' : '2'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 템플릿 안내 */}
          <View style={s.templateInfo}>
            <Image
              source={templateInfoPreview}
              style={s.templateThumb}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={s.templateInfoTitle}>{template.name}</Text>
              <Text style={s.templateInfoSub}>{template.subtitle}</Text>
              <Text style={s.templateInfoHint}>다음 단계에서 위치·크기 조정 가능</Text>
            </View>
          </View>

          <View style={s.testFillWrap}>
            <TouchableOpacity style={s.testFillBtn} onPress={fillTestData} activeOpacity={0.85}>
              <Ionicons name="sparkles-outline" size={16} color={TC.blue} />
              <Text style={s.testFillText}>테스트 입력</Text>
            </TouchableOpacity>
            <Text style={s.testFillHint}>앞면·뒷면 정보와 기본 사진을 한 번에 채웁니다.</Text>
          </View>

            {(!supportsBackSide || formStep === 1) ? (
              <>
                {/* 사진 */}
                <Text style={s.sectionLabel}>사진</Text>
                <TouchableOpacity style={s.photoCard} onPress={pickPhoto} activeOpacity={0.85}>
                  {photoUri ? (
                    <>
                      <Image source={{ uri: photoUri }} style={s.photoThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.photoTitle}>사진 변경</Text>
                        <Text style={s.photoSub}>다른 사진 선택하기</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={TC.inkDim} />
                    </>
                  ) : (
                    <>
                      <View style={s.photoPlaceholder}>
                        <Ionicons name="image-outline" size={22} color={TC.blue} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.photoTitle}>사진 추가하기</Text>
                        <Text style={s.photoSub}>갤러리에서 선택 (3:4 권장)</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={TC.inkDim} />
                    </>
                  )}
                </TouchableOpacity>

                {/* 이름 */}
                <Text style={s.sectionLabel}>이름</Text>
                <View style={s.tipCard}>
                  <View style={s.tipIcon}>
                    <Ionicons name="sparkles-outline" size={16} color={TC.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.tipTitle}>이름 연출 팁</Text>
                    <Text style={s.tipText}>
                      템플릿 분위기에 맞춰 "김 민 수"처럼 한 칸씩 띄어 입력해도 좋아요.
                    </Text>
                  </View>
                </View>
                <View style={s.row}>
                  <View style={[s.inputCellInRow, { flex: 1 }]}>
                    <Text style={s.inputLabel}>신랑</Text>
                    <TextInput
                      value={groom}
                      onChangeText={setGroom}
                      placeholder="한준서"
                      placeholderTextColor={TC.inkDim}
                      style={s.input}
                      maxLength={10}
                    />
                  </View>
                  <View style={[s.inputCellInRow, { flex: 1 }]}>
                    <Text style={s.inputLabel}>신부</Text>
                    <TextInput
                      value={bride}
                      onChangeText={setBride}
                      placeholder="김은재"
                      placeholderTextColor={TC.inkDim}
                      style={s.input}
                      maxLength={10}
                    />
                  </View>
                </View>

                {/* 일시 — 통합 1줄 */}
                <Text style={s.sectionLabel}>예식 일시</Text>
                <TouchableOpacity
                  style={s.dateTimeCard}
                  onPress={openDateTimePicker}
                  activeOpacity={0.7}
                >
                  <View style={s.dateTimeIcon}>
                    <Ionicons name="calendar-outline" size={20} color={TC.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {dateObj ? (
                      <>
                        <Text style={s.dateTimeMain}>{formatDate(dateObj)}</Text>
                        <Text style={s.dateTimeSub}>{formatTime(dateObj)}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={s.dateTimeMainPlaceholder}>날짜·시간 선택</Text>
                        <Text style={s.dateTimeSub}>예식 날짜와 시간을 골라주세요</Text>
                      </>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={TC.inkDim} />
                </TouchableOpacity>

                {/* 예식장 (이름만, 선택사항) */}
                <Text style={s.sectionLabel}>예식장 <Text style={{ color: TC.inkDim, fontWeight: '500' }}>(선택)</Text></Text>
                <View style={s.inputCell}>
                  <Text style={s.inputLabel}>이름</Text>
                  <TextInput
                    value={venue}
                    onChangeText={setVenue}
                    placeholder="그랜드 하얏트 서울 · 로즈홀 2층"
                    placeholderTextColor={TC.inkDim}
                    style={[s.input, s.compactTextArea]}
                    multiline
                    blurOnSubmit={false}
                    textAlignVertical="top"
                    maxLength={120}
                  />
                </View>
              </>
            ) : (
              <>
              <Text style={s.sectionLabel}>초대 문구</Text>
              <View style={s.inputCell}>
                <Text style={s.inputLabel}>문구</Text>
                <TextInput
                    value={invitationText}
                    onChangeText={setInvitationText}
                    placeholder="초대 문구를 입력해주세요"
                    placeholderTextColor={TC.inkDim}
                    style={[s.input, s.textArea]}
                    multiline
                    blurOnSubmit={false}
                    textAlignVertical="top"
                    maxLength={420}
                  />
                </View>
                <View style={s.sampleCard}>
                  <TouchableOpacity style={s.sampleHeader} onPress={() => setSampleOpen((prev) => !prev)} activeOpacity={0.75}>
                    <View>
                      <Text style={s.sampleHeaderTitle}>샘플 문구</Text>
                      <Text style={s.sampleHeaderSub}>짧은/중간/긴 문구 중 선택</Text>
                    </View>
                    <Ionicons name={sampleOpen ? 'chevron-up' : 'chevron-down'} size={18} color={TC.inkMuted} />
                  </TouchableOpacity>
                  {sampleOpen && (
                    <>
                      {[
                        { id: 'short', title: '짧은 문구', items: INVITATION_TEXT_SAMPLES.short },
                        { id: 'medium', title: '중간 문구', items: INVITATION_TEXT_SAMPLES.medium },
                        { id: 'long', title: '긴 문구', items: INVITATION_TEXT_SAMPLES.long },
                      ].map((group) => (
                        <View key={group.id} style={s.sampleGroup}>
                          <Text style={s.sampleGroupTitle}>{group.title}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sampleRow}>
                            {group.items.map((sample, index) => (
                              <TouchableOpacity
                                key={`${group.id}-${index}`}
                                style={s.sampleChip}
                                onPress={() => {
                                  setInvitationText(sample);
                                  setSampleOpen(false);
                                }}
                                activeOpacity={0.75}
                              >
                                <Text style={s.sampleChipTitle}>{index + 1}</Text>
                                <Text style={s.sampleChipText} numberOfLines={2}>
                                  {sample.replace(/\n/g, ' ')}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ))}
                    </>
                  )}
                </View>

                <Text style={s.sectionLabel}>혼주 성함</Text>
                <View style={s.tipCard}>
                  <View style={s.tipIcon}>
                    <Ionicons name="text-outline" size={16} color={TC.blue} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.tipTitle}>혼주 성함 표기</Text>
                    <Text style={s.tipText}>
                      "김 성 호"처럼 띄어 쓰면 더 격식 있는 느낌으로 연출할 수 있어요.
                    </Text>
                  </View>
                </View>
                <View style={s.row}>
                  <View style={[s.inputCellInRow, { flex: 1 }]}>
                    <Text style={s.inputLabel}>신랑 아버님</Text>
                    <TextInput value={groomFather} onChangeText={setGroomFather} placeholder="성함" placeholderTextColor={TC.inkDim} style={s.input} maxLength={12} />
                  </View>
                  <View style={[s.inputCellInRow, { flex: 1 }]}>
                    <Text style={s.inputLabel}>신랑 어머님</Text>
                    <TextInput value={groomMother} onChangeText={setGroomMother} placeholder="성함" placeholderTextColor={TC.inkDim} style={s.input} maxLength={12} />
                  </View>
                </View>
                <View style={s.row}>
                  <View style={[s.inputCellInRow, { flex: 1 }]}>
                    <Text style={s.inputLabel}>신부 아버님</Text>
                    <TextInput value={brideFather} onChangeText={setBrideFather} placeholder="성함" placeholderTextColor={TC.inkDim} style={s.input} maxLength={12} />
                  </View>
                  <View style={[s.inputCellInRow, { flex: 1 }]}>
                    <Text style={s.inputLabel}>신부 어머님</Text>
                    <TextInput value={brideMother} onChangeText={setBrideMother} placeholder="성함" placeholderTextColor={TC.inkDim} style={s.input} maxLength={12} />
                  </View>
                </View>

                <Text style={s.sectionLabel}>자녀 표기</Text>
                <View style={s.relationCard}>
                  <Text style={s.inputLabel}>신랑 표기</Text>
                  <View style={s.relationRow}>
                    {GROOM_RELATION_OPTIONS.map((option) => {
                      const active = groomRelation === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[s.relationChip, active && s.relationChipActive]}
                          onPress={() => setGroomRelation(option)}
                          activeOpacity={0.75}
                        >
                          <Text style={[s.relationChipText, active && s.relationChipTextActive]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[s.inputLabel, { marginTop: 12 }]}>신부 표기</Text>
                  <View style={s.relationRow}>
                    {BRIDE_RELATION_OPTIONS.map((option) => {
                      const active = brideRelation === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[s.relationChip, active && s.relationChipActive]}
                          onPress={() => setBrideRelation(option)}
                          activeOpacity={0.75}
                        >
                          <Text style={[s.relationChipText, active && s.relationChipTextActive]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={s.backHintCard}>
                  <View style={s.tipIcon}>
                    <Ionicons name="calendar-outline" size={16} color={TC.blue} />
                  </View>
                  <Text style={s.backHintText}>
                    달력은 1단계에서 선택한 예식 날짜를 기준으로 자동 생성돼요. 다음 단계에서 달력 스타일도 바꿀 수 있어요.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* 하단 다음 버튼 */}
          <View style={s.bottomBar}>
            {supportsBackSide && formStep === 2 && (
              <TouchableOpacity style={s.prevBtn} onPress={() => setFormStep(1)} activeOpacity={0.85}>
                <Ionicons name="chevron-back" size={19} color={TC.ink} />
                <Text style={s.prevBtnText}>앞면</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[s.nextBtn, supportsBackSide && formStep === 2 && { flex: 1 }]} onPress={handleNext} activeOpacity={0.85}>
              <Text style={s.nextBtnText}>
                {supportsBackSide && formStep === 1 ? '뒷면 입력' : '위치 조정하기'}
              </Text>
              <View style={s.nextIconBubble}>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
      </KeyboardAvoidingView>

      {/* iOS 통합 일시 picker 모달 — 캘린더(날짜) + 스피너(시간) 분리 */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={pickerOpen}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setPickerOpen(false)}
        >
          <View style={s.pickerBackdrop}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setPickerOpen(false)}
            />
            <View style={s.pickerSheet}>
              <View style={s.pickerHeader}>
                <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={8}>
                  <Text style={s.pickerCancel}>취소</Text>
                </TouchableOpacity>
                <Text style={s.pickerTitle}>예식 일시</Text>
                <TouchableOpacity
                  onPress={() => {
                    setDateObj(tempDate);
                    setPickerOpen(false);
                  }}
                  hitSlop={8}
                >
                  <Text style={s.pickerConfirm}>완료</Text>
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 16 }}>
                <Text style={s.pickerSummary}>
                  {formatDate(tempDate)}  ·  {formatTime(tempDate)}
                </Text>
              </View>

              {/* 날짜 — 인라인 캘린더 (가운데 정렬) */}
              <View style={s.pickerField}>
                <Text style={s.pickerFieldLabel}>날짜</Text>
                <View style={{ alignItems: 'center' }}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="inline"
                    locale="ko-KR"
                    themeVariant="light"
                    onChange={(_, d) => d && setTempDate(d)}
                    style={{ marginTop: 4, width: '100%' }}
                  />
                </View>
              </View>

              {/* 시간 — 스피너 (가운데 정렬) */}
              <View style={s.pickerField}>
                <Text style={s.pickerFieldLabel}>시간</Text>
                <View style={{ alignItems: 'center' }}>
                  <DateTimePicker
                    value={tempDate}
                    mode="time"
                    display="spinner"
                    locale="ko-KR"
                    themeVariant="light"
                    onChange={(_, d) => d && setTempDate(d)}
                    style={{ height: 140, width: '100%', backgroundColor: '#FFFFFF' }}
                    textColor="#000000"
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android: chained date → time */}
      {Platform.OS === 'android' && pickerOpen && (
        <DateTimePicker
          value={tempDate}
          mode={pickerMode}
          is24Hour={false}
          display="default"
          onChange={handleAndroidPickerChange}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: TC.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  // 단계 표시
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    gap: 7,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#111827' },
  stepDotText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  stepLine: { width: 34, height: 2, borderRadius: 1, backgroundColor: '#E5E8EB' },

  // 템플릿 정보
  templateInfo: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: TC.card,
    borderRadius: 20,
    gap: 12,
    alignItems: 'center',
  },
  templateThumb: {
    width: 72,
    height: 72 * A6_ASPECT_RATIO,
    borderRadius: 8,
    backgroundColor: '#FBF9F3',
  },
  templateInfoTitle: { fontSize: 14, fontWeight: '800', color: TC.ink, letterSpacing: -0.3 },
  templateInfoSub: {
    fontSize: 12,
    color: TC.inkMuted,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  templateInfoHint: {
    fontSize: 11,
    color: TC.blue,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  testFillWrap: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#E1ECFF',
  },
  testFillBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#D6E8FF',
  },
  testFillText: {
    fontSize: 13,
    fontWeight: '900',
    color: TC.blue,
    letterSpacing: -0.2,
  },
  testFillHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // 섹션 라벨
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHint: {
    marginHorizontal: 20,
    marginTop: -2,
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: -2,
    marginBottom: 10,
    padding: 13,
    borderRadius: 18,
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#E3EEFF',
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: TC.ink,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // 사진 카드
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: TC.card,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: TC.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: TC.bg },
  photoTitle: { fontSize: 14, fontWeight: '700', color: TC.ink, letterSpacing: -0.2, marginBottom: 2 },
  photoSub: { fontSize: 12, color: TC.inkMuted, letterSpacing: -0.2 },

  // 인풋 - row
  row: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  inputCellInRow: {
    backgroundColor: TC.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  // 인풋 - 단독
  inputCell: {
    backgroundColor: TC.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TC.inkMuted,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: TC.ink,
    letterSpacing: -0.3,
    padding: 0,
  },
  textArea: {
    minHeight: 104,
    lineHeight: 22,
    textAlignVertical: 'top',
    paddingTop: 2,
  },
  compactTextArea: {
    minHeight: 48,
    lineHeight: 22,
    textAlignVertical: 'top',
    paddingTop: 2,
  },
  sampleCard: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: TC.card,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sampleHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sampleHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: TC.ink,
    letterSpacing: -0.2,
  },
  sampleHeaderSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  sampleGroup: {
    marginBottom: 12,
  },
  sampleGroupTitle: {
    paddingHorizontal: 14,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '900',
    color: TC.ink,
    letterSpacing: -0.2,
  },
  sampleRow: {
    gap: 8,
    paddingHorizontal: 14,
  },
  sampleChip: {
    width: 152,
    minHeight: 64,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#EEF1F4',
  },
  sampleChipTitle: {
    alignSelf: 'flex-start',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: TC.ink,
    marginBottom: 7,
  },
  sampleChipText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  relationCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    backgroundColor: TC.card,
    borderRadius: 18,
  },
  relationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  relationChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
  },
  relationChipActive: {
    backgroundColor: '#111827',
  },
  relationChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
  relationChipTextActive: {
    color: '#FFFFFF',
  },
  inputValue: {
    fontSize: 15,
    fontWeight: '600',
    color: TC.ink,
    letterSpacing: -0.3,
  },
  inputPlaceholder: {
    fontSize: 15,
    fontWeight: '500',
    color: TC.inkDim,
    letterSpacing: -0.3,
  },

  // 통합 일시 카드
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: TC.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  dateTimeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: TC.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeMain: {
    fontSize: 15,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  dateTimeMainPlaceholder: {
    fontSize: 15,
    fontWeight: '600',
    color: TC.inkDim,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  dateTimeSub: {
    fontSize: 12,
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  // iOS picker 모달
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  pickerTitle: { fontSize: 15, fontWeight: '800', color: TC.ink, letterSpacing: -0.3 },
  pickerCancel: { fontSize: 14, fontWeight: '600', color: TC.inkMuted },
  pickerConfirm: { fontSize: 14, fontWeight: '800', color: TC.blue },
  pickerSummary: {
    fontSize: 14,
    fontWeight: '700',
    color: TC.blue,
    backgroundColor: TC.blueSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  pickerField: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  pickerFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TC.inkMuted,
    letterSpacing: -0.2,
    marginBottom: 4,
  },

  // 하단 다음 버튼
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    backgroundColor: '#FFFFFF',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flex: 1,
    height: 56,
    paddingHorizontal: 18,
    backgroundColor: '#111827',
    borderRadius: 16,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 88,
    height: 56,
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.3,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.3,
  },
  nextIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#F7FAFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3EEFF',
  },
  backHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },
});
