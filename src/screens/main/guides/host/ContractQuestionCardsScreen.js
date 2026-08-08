// src/screens/main/guides/host/ContractQuestionCardsScreen.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { TC, PressableCard, StaggerItem, ScreenHeader } from '../tossStyle';

const CONTRACT_TYPES = [
  { key: 'wedding', label: '결혼식', icon: 'heart-outline' },
  { key: 'funeral', label: '장례식', icon: 'flower-outline' },
];

const QUESTION_GROUPS = [
  { key: 'money', label: '비용', icon: 'card-outline' },
  { key: 'guest', label: '인원·식사', icon: 'people-outline' },
  { key: 'change', label: '취소·변경', icon: 'refresh-outline' },
  { key: 'operation', label: '현장', icon: 'business-outline' },
  { key: 'paper', label: '서류', icon: 'document-text-outline' },
];

const QUESTION_DATA = {
  wedding: [
    {
      id: 'w-money-1',
      group: 'money',
      must: true,
      question: '식대에 부가세와 봉사료가 모두 포함되어 있나요?',
      why: '견적서에는 저렴해 보여도 최종 정산 때 10% 이상 차이가 날 수 있어요.',
      ask: ['1인 식대 최종 결제 금액', '음료·주류 별도 여부', '어린이 식대 기준'],
      risk: '“별도”라고 적혀 있으면 총액을 다시 계산해야 해요.',
    },
    {
      id: 'w-guest-1',
      group: 'guest',
      must: true,
      question: '보증인원은 언제까지, 몇 명까지 조정할 수 있나요?',
      why: '보증인원은 총액을 가장 크게 바꾸는 항목이에요.',
      ask: ['최종 확정 마감일', '감소 가능 인원', '초과 인원 정산 방식'],
      risk: '마감일 이후 감소가 안 되면 노쇼 비용이 커질 수 있어요.',
    },
    {
      id: 'w-money-2',
      group: 'money',
      question: '대관료에 포함된 항목과 별도 항목은 무엇인가요?',
      why: '폐백실, 혼주대기실, 빔프로젝터, 음향, 포토테이블이 별도일 수 있어요.',
      ask: ['포함 항목 목록', '필수 옵션', '선택 옵션 가격표'],
      risk: '필수 옵션인데 계약서 밖에 있으면 분쟁이 생기기 쉬워요.',
    },
    {
      id: 'w-change-1',
      group: 'change',
      must: true,
      question: '날짜 변경이나 취소 시 위약금은 단계별로 어떻게 계산되나요?',
      why: '계약금만 포기하면 끝나는 구조가 아닐 수 있어요.',
      ask: ['계약 직후', '예식 90일 전', '예식 30일 전', '당일 취소 기준'],
      risk: '구두 설명과 계약서 조항이 다르면 계약서가 우선돼요.',
    },
    {
      id: 'w-operation-1',
      group: 'operation',
      question: '당일 주차 지원과 안내 인력은 어디까지 제공되나요?',
      why: '하객 경험은 식장 위치보다 주차와 안내에서 많이 갈려요.',
      ask: ['무료 주차 시간', '혼주 차량', '대형버스 진입', '안내 직원 배치'],
      risk: '주차권 유료 전환 시간이 짧으면 하객 불만이 생길 수 있어요.',
    },
    {
      id: 'w-paper-1',
      group: 'paper',
      question: '구두로 약속한 혜택을 계약서나 특약에 적을 수 있나요?',
      why: '서비스 업그레이드, 할인, 추가 제공은 문자나 특약으로 남겨야 해요.',
      ask: ['특약란 기재 가능 여부', '담당자 명함', '변경 시 확인 방식'],
      risk: '계약서에 없으면 담당자가 바뀌었을 때 인정받기 어려워요.',
    },
  ],
  funeral: [
    {
      id: 'f-money-1',
      group: 'money',
      must: true,
      question: '빈소 사용료는 시간 기준인가요, 일 단위 기준인가요?',
      why: '입실·퇴실 시간이 애매하면 하루 비용이 더 붙을 수 있어요.',
      ask: ['입실 기준 시간', '퇴실 기준 시간', '연장 요금', '야간 추가 비용'],
      risk: '발인 시간이 늦어지면 추가 비용이 발생할 수 있어요.',
    },
    {
      id: 'f-money-2',
      group: 'money',
      must: true,
      question: '제단, 수의, 관, 상복, 영정 장식은 필수 구매인가요?',
      why: '장례 비용은 용품 선택에서 크게 달라져요.',
      ask: ['필수 품목', '선택 품목', '외부 반입 가능 여부', '등급별 가격표'],
      risk: '필수와 선택이 섞여 있으면 나중에 총액이 불어날 수 있어요.',
    },
    {
      id: 'f-guest-1',
      group: 'guest',
      question: '조문객 식사는 인분 기준인지 실제 사용 기준인지 확인할 수 있나요?',
      why: '조문객 수 변동이 커서 식사 정산 기준이 중요해요.',
      ask: ['최소 주문 수량', '추가 주문 단위', '반품 가능 여부', '음료·주류 별도 여부'],
      risk: '최소 수량이 높으면 남은 음식도 비용으로 처리될 수 있어요.',
    },
    {
      id: 'f-operation-1',
      group: 'operation',
      must: true,
      question: '입관, 발인, 장지 이동 시간표는 누가 최종 확정하나요?',
      why: '장례는 시간이 바뀌면 가족과 조문객 안내가 모두 흔들려요.',
      ask: ['입관 예정 시간', '발인 예정 시간', '화장장 예약', '장지 이동 차량'],
      risk: '구두 시간표만 믿으면 부고장 안내와 실제 일정이 어긋날 수 있어요.',
    },
    {
      id: 'f-change-1',
      group: 'change',
      question: '장례 기간 단축이나 연장 시 비용은 어떻게 바뀌나요?',
      why: '가족 사정이나 화장장 일정에 따라 일정이 바뀔 수 있어요.',
      ask: ['1일 연장 비용', '일정 단축 환불', '빈소 변경 가능 여부'],
      risk: '일정 변경 규정이 없으면 급한 상황에서 선택지가 줄어들어요.',
    },
    {
      id: 'f-paper-1',
      group: 'paper',
      question: '최종 견적서와 정산서는 항목별로 받을 수 있나요?',
      why: '상주 여러 명이 비용을 나누거나 보험 청구를 할 때 필요해요.',
      ask: ['상세 견적서', '영수증', '카드/현금영수증', '보험 제출용 서류'],
      risk: '총액만 받으면 나중에 가족끼리 설명하기 어려워요.',
    },
  ],
};

export default function ContractQuestionCardsScreen({ navigation }) {
  const [contractType, setContractType] = useState('wedding');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const questions = QUESTION_DATA[contractType] || [];
  const visibleQuestions = useMemo(() => {
    if (selectedGroup === 'all') return questions;
    return questions.filter(item => item.group === selectedGroup);
  }, [questions, selectedGroup]);
  const mustQuestions = questions.filter(item => item.must).slice(0, 5);

  const copyQuestion = async (item) => {
    const text = [
      item.question,
      '',
      `확인할 것: ${item.ask.join(' / ')}`,
      `주의: ${item.risk}`,
    ].join('\n');
    await Clipboard.setStringAsync(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const copyMustQuestions = async () => {
    const text = mustQuestions
      .map((item, index) => `${index + 1}. ${item.question}\n- 확인: ${item.ask.join(' / ')}`)
      .join('\n\n');
    await Clipboard.setStringAsync(text);
    setCopiedId('must');
    setTimeout(() => setCopiedId(null), 1200);
  };

  const typeLabel = contractType === 'wedding' ? '예식장' : '장례식장';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <StaggerItem delay={0}>
          <ScreenHeader
            onBack={() => navigation.goBack()}
            eyebrow="계약 전 질문 카드"
            title={'상담 전에\n이것만은 물어보세요'}
            subtitle="견적 계산이 아니라, 계약서에 남겨야 할 질문을 정리했어요."
          />
        </StaggerItem>

        <StaggerItem delay={80}>
          <View style={styles.typeSegment}>
            {CONTRACT_TYPES.map(type => {
              const active = contractType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.typeButton, active && styles.typeButtonActive]}
                  onPress={() => {
                    setContractType(type.key);
                    setSelectedGroup('all');
                  }}
                  activeOpacity={0.82}
                >
                  <Ionicons name={type.icon} size={16} color={active ? '#FFFFFF' : TC.inkMuted} />
                  <Text style={[styles.typeButtonText, active && styles.typeButtonTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </StaggerItem>

        <StaggerItem delay={120}>
          <PressableCard style={styles.summaryCard} onPress={copyMustQuestions}>
            <View style={styles.summaryTop}>
              <View style={styles.summaryIcon}>
                <Ionicons name="checkmark-done" size={18} color={TC.blue} />
              </View>
              <View style={styles.summaryTextBox}>
                <Text style={styles.summaryTitle}>꼭 물어볼 질문 {mustQuestions.length}개</Text>
                <Text style={styles.summarySub}>
                  {typeLabel} 상담 전에 복사해서 메모장에 붙여두세요
                </Text>
              </View>
              <View style={styles.copyPill}>
                <Text style={styles.copyPillText}>{copiedId === 'must' ? '복사됨' : '복사'}</Text>
              </View>
            </View>
            {mustQuestions.map((item, index) => (
              <View key={item.id} style={styles.mustRow}>
                <Text style={styles.mustIndex}>{index + 1}</Text>
                <Text style={styles.mustText}>{item.question}</Text>
              </View>
            ))}
          </PressableCard>
        </StaggerItem>

        <StaggerItem delay={160}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupScroll}
          >
            <TouchableOpacity
              style={[styles.groupChip, selectedGroup === 'all' && styles.groupChipActive]}
              onPress={() => setSelectedGroup('all')}
              activeOpacity={0.82}
            >
              <Text style={[styles.groupChipText, selectedGroup === 'all' && styles.groupChipTextActive]}>전체</Text>
            </TouchableOpacity>
            {QUESTION_GROUPS.map(group => {
              const active = selectedGroup === group.key;
              return (
                <TouchableOpacity
                  key={group.key}
                  style={[styles.groupChip, active && styles.groupChipActive]}
                  onPress={() => setSelectedGroup(group.key)}
                  activeOpacity={0.82}
                >
                  <Ionicons name={group.icon} size={14} color={active ? TC.blue : TC.inkMuted} />
                  <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>{group.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </StaggerItem>

        <StaggerItem delay={200}>
          <Text style={styles.sectionLabel}>질문 카드 · {visibleQuestions.length}</Text>
        </StaggerItem>

        {visibleQuestions.map((item, index) => (
          <StaggerItem key={item.id} delay={240 + index * 40}>
            <View style={styles.questionCard}>
              <View style={styles.questionHead}>
                <View style={[styles.groupDot, item.must && styles.groupDotMust]}>
                  <Ionicons name={item.must ? 'alert-circle' : 'help'} size={15} color={item.must ? TC.orange : TC.blue} />
                </View>
                <View style={styles.questionTitleBox}>
                  <Text style={styles.questionMeta}>{getGroupLabel(item.group)} · {item.must ? '필수 확인' : '추가 확인'}</Text>
                  <Text style={styles.questionTitle}>{item.question}</Text>
                </View>
              </View>

              <Text style={styles.questionWhy}>{item.why}</Text>

              <View style={styles.askBox}>
                {item.ask.map((askItem) => (
                  <View key={askItem} style={styles.askChip}>
                    <Text style={styles.askChipText}>{askItem}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.riskBox}>
                <Ionicons name="warning-outline" size={15} color={TC.orange} />
                <Text style={styles.riskText}>{item.risk}</Text>
              </View>

              <TouchableOpacity
                style={styles.cardCopyButton}
                onPress={() => copyQuestion(item)}
                activeOpacity={0.82}
              >
                <Ionicons name="copy-outline" size={15} color={TC.blue} />
                <Text style={styles.cardCopyText}>{copiedId === item.id ? '질문 복사됨' : '질문 복사하기'}</Text>
              </TouchableOpacity>
            </View>
          </StaggerItem>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGroupLabel(groupKey) {
  return QUESTION_GROUPS.find(group => group.key === groupKey)?.label || '확인';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TC.bg,
  },
  scroll: {
    padding: 20,
    paddingBottom: 72,
  },
  typeSegment: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 18,
    backgroundColor: TC.card,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: TC.ink,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: TC.inkMuted,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: TC.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
    shadowRadius: 18,
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: TC.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextBox: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: TC.ink,
    letterSpacing: -0.3,
  },
  summarySub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: TC.inkMuted,
    lineHeight: 17,
  },
  copyPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: TC.blueSoft,
  },
  copyPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: TC.blue,
  },
  mustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: TC.border,
  },
  mustIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TC.border,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '900',
    color: TC.inkSoft,
    overflow: 'hidden',
  },
  mustText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: TC.inkSoft,
    lineHeight: 19,
  },
  groupScroll: {
    gap: 8,
    paddingRight: 20,
    marginBottom: 14,
  },
  groupChip: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: TC.card,
    borderWidth: 1,
    borderColor: TC.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  groupChipActive: {
    backgroundColor: TC.blueSoft,
    borderColor: '#CFE1FF',
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: TC.inkMuted,
  },
  groupChipTextActive: {
    color: TC.blue,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TC.inkMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  questionCard: {
    backgroundColor: TC.card,
    borderRadius: 18,
    padding: 17,
    marginBottom: 10,
  },
  questionHead: {
    flexDirection: 'row',
    gap: 11,
    marginBottom: 12,
  },
  groupDot: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: TC.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupDotMust: {
    backgroundColor: TC.orangeSoft,
  },
  questionTitleBox: {
    flex: 1,
  },
  questionMeta: {
    fontSize: 11,
    fontWeight: '900',
    color: TC.inkMuted,
    marginBottom: 4,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: TC.ink,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  questionWhy: {
    fontSize: 13,
    fontWeight: '600',
    color: TC.inkSoft,
    lineHeight: 20,
    marginBottom: 12,
  },
  askBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  askChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: TC.bg,
  },
  askChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: TC.inkSoft,
  },
  riskBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 12,
    borderRadius: 14,
    backgroundColor: TC.orangeSoft,
    marginBottom: 12,
  },
  riskText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5A00',
    lineHeight: 18,
  },
  cardCopyButton: {
    height: 42,
    borderRadius: 14,
    backgroundColor: TC.blueSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardCopyText: {
    fontSize: 13,
    fontWeight: '900',
    color: TC.blue,
  },
});
