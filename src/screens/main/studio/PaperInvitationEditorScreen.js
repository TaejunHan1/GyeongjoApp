// src/screens/main/studio/PaperInvitationEditorScreen.js
// 종이 청첩장 에디터 — 템플릿 기반으로 사진·이름·날짜·장소 입력해 PDF 출력
// 현재는 placeholder, 추후 정보 입력 폼 + 미리보기 + PDF 다운로드 구현 예정
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TC } from '../guides/tossStyle';

export default function PaperInvitationEditorScreen({ navigation, route }) {
  const template = route?.params?.template;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={TC.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>종이 청첩장 만들기</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {template && (
          <View style={s.previewWrap}>
            <Image
              source={template.blank}
              style={s.previewImage}
              resizeMode="contain"
            />
            <Text style={s.templateName}>
              {template.name} · {template.subtitle}
            </Text>
            <Text style={s.templateHint}>빈 템플릿에 사진과 정보를 채워보세요</Text>
          </View>
        )}

        <View style={s.comingSoonCard}>
          <View style={s.comingSoonIcon}>
            <Ionicons name="construct-outline" size={28} color={TC.blue} />
          </View>
          <Text style={s.comingSoonTitle}>곧 출시됩니다</Text>
          <Text style={s.comingSoonSub}>
            이 템플릿 기반으로 사진·이름·날짜·장소를{'\n'}
            입력해 PDF로 받을 수 있게 준비 중이에요
          </Text>

          <View style={s.featureList}>
            <View style={s.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={TC.green} />
              <Text style={s.featureText}>사진 자유 배치</Text>
            </View>
            <View style={s.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={TC.green} />
              <Text style={s.featureText}>이름·날짜·장소 입력</Text>
            </View>
            <View style={s.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={TC.green} />
              <Text style={s.featureText}>지도·연락처 추가</Text>
            </View>
            <View style={s.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color={TC.green} />
              <Text style={s.featureText}>300dpi 인쇄용 PDF</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: TC.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: TC.ink,
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  previewWrap: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 32,
  },
  previewImage: {
    width: 200,
    height: 274,
    borderRadius: 10,
    backgroundColor: '#FBF9F3',
  },
  templateName: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    color: TC.ink,
    letterSpacing: -0.3,
  },
  templateHint: {
    marginTop: 4,
    fontSize: 12,
    color: TC.inkMuted,
    letterSpacing: -0.2,
  },

  comingSoonCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    backgroundColor: TC.card,
    borderRadius: 18,
    alignItems: 'center',
  },
  comingSoonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TC.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TC.ink,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  comingSoonSub: {
    fontSize: 13,
    color: TC.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
    letterSpacing: -0.2,
    marginBottom: 20,
  },
  featureList: {
    width: '100%',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: TC.ink,
    letterSpacing: -0.2,
  },
});
