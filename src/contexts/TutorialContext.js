// 튜토리얼 전역 상태 관리
// - activeTutorial: 어느 튜토리얼이 진행 중인가 ('home' | 'myEvents' | null)
// - currentStep: 현재 스텝 인덱스
// - targets: 각 스텝 타겟 버튼의 화면상 좌표 (onLayout에서 등록)
//
// 각 화면에서:
//   const { activeTutorial, currentStep, registerTarget, advanceStep } = useTutorial();
//   <Button onLayout={e => registerTarget('createWeddingBtn', e.nativeEvent.layout)} ... />

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUserInfo } from '../lib/supabaseHelper';
import { resetToTab } from '../navigation/navigationRef';

// ─────────────────────────────────────────────────
// 튜토리얼 스텝 정의
// ─────────────────────────────────────────────────
export const HOME_TUTORIAL_STEPS = [
  {
    id: 'home_create', scope: 'app',
    screen: 'Home', targetKey: 'homeCreateSection',
    accents: ['weddingMakeBtn', 'funeralMakeBtn'],
    tooltip: '청첩장이나 부고장을 만들어봐요',
    hint: '만들기 버튼을 누르면 시작돼요',
    interaction: 'tap',
  },
  {
    id: 'cw_names', scope: 'app',
    screen: 'CreateWedding', targetKey: 'weddingSection_names',
    tooltip: '주인공 정보부터 확인해요',
    hint: '샘플로 미리 채워 두었어요',
    interaction: 'next',
  },
  {
    id: 'cw_datetime', scope: 'app',
    screen: 'CreateWedding', targetKey: 'weddingSection_datetime',
    tooltip: '결혼식 날짜와 시간이에요',
    hint: '그대로 두고 진행해도 돼요',
    interaction: 'next',
  },
  {
    id: 'cw_photos', scope: 'app',
    screen: 'CreateWedding', targetKey: 'weddingSection_photos',
    tooltip: '메인 사진을 등록해요',
    hint: '청첩장 첫 화면에 보여져요',
    interaction: 'next',
  },
  {
    id: 'cw_next', scope: 'app',
    screen: 'CreateWedding', targetKey: 'weddingNextBtn',
    tooltip: '다음 단계로 넘어가요',
    hint: '',
    interaction: 'tap',
  },
  {
    id: 'template_preview', scope: 'app',
    screen: 'CreateWedding', targetKey: 'modernDarkPreviewBtn',
    tooltip: '모던 다크 템플릿을\n미리보기로 확인해봐요',
    hint: '버튼을 누르면 미리보기가 열려요',
    interaction: 'tap',
    pauseAfterTap: true,
  },
  {
    id: 'preview_music_btn', scope: 'previewModal',
    screen: 'CreateWedding', targetKey: 'previewMusicBtn',
    tooltip: '배경음악을 설정해봐요',
    hint: '적용하려면 1,100원 결제가 필요해요. 미리보기는 무료로 가능해요',
    interaction: 'tap',
    pauseAfterTap: true,
  },
  {
    id: 'preview_music_item', scope: 'musicModal',
    screen: 'CreateWedding', targetKey: 'firstMusicItem',
    tooltip: '맨 위 음악을 선택해보세요',
    hint: '',
    interaction: 'tap',
  },
  {
    id: 'preview_petal_btn', scope: 'previewModal',
    screen: 'CreateWedding', targetKey: 'previewPetalBtn',
    tooltip: '꽃잎 효과도 추가할 수 있어요',
    hint: '적용하려면 1,100원 결제가 필요해요. 미리보기는 무료로 가능해요',
    interaction: 'tap',
    pauseAfterTap: true,
  },
  {
    id: 'preview_petal_item', scope: 'petalModal',
    screen: 'CreateWedding', targetKey: 'firstPetalItem',
    tooltip: '맨 위 꽃잎을 선택해보세요',
    hint: '',
    interaction: 'tap',
  },
  {
    id: 'preview_intro_btn', scope: 'previewModal',
    screen: 'CreateWedding', targetKey: 'previewIntroBtn',
    tooltip: '인트로 오버레이도 설정해요',
    hint: '적용하려면 1,100원 결제가 필요해요. 미리보기는 무료로 가능해요',
    interaction: 'tap',
    pauseAfterTap: true,
  },
  {
    id: 'intro_grand_item', scope: 'introModal',
    screen: 'CreateWedding', targetKey: 'introGrandItem',
    tooltip: '그랜드 오픈을 선택해보세요',
    hint: '다른 도어도 자유롭게 선택할 수 있어요',
    interaction: 'auto',
    passTargetTap: true, // 타겟 위에 투명 버튼 안 올림 → 실제 아이템 탭 가능
  },
  {
    id: 'intro_apply_btn', scope: 'introModal',
    screen: 'CreateWedding', targetKey: 'introApplyBtn',
    tooltip: '"이 도어로 적용하기"를 눌러 반영해주세요',
    hint: '',
    interaction: 'auto',
    passTargetTap: true,
    pauseAfterTap: true,
  },
  {
    id: 'preview_scroll', scope: 'previewModal',
    screen: 'CreateWedding', targetKey: 'previewScrollHint',
    centerTooltip: true,
    allowInteraction: true, // 배경 터치 허용 (노래/꽃/인트로 재설정, 스크롤 가능)
    tooltip: '위아래로 스크롤하며\n청첩장을 확인해보세요',
    hint: '노래·꽃·인트로도 자유롭게 바꿔보세요. X로 닫으면 다음 단계로 넘어갑니다',
    interaction: 'auto',
  },
  {
    id: 'template_saved', scope: 'app',
    screen: 'CreateWedding', targetKey: 'modernDarkTemplateCard',
    tooltip: '음악·꽃잎·인트로 설정이\n템플릿에 저장됐어요',
    hint: '카드를 눌러 템플릿을 선택해주세요',
    interaction: 'tap',
  },
  {
    id: 'create_final', scope: 'app',
    screen: 'CreateWedding', targetKey: 'weddingNextBtn',
    tooltip: '결혼식 청첩장 만들기\n버튼을 눌러주세요',
    hint: '청첩장이 생성돼요',
    interaction: 'tap',
  },
];

// 내 행사 탭 튜토리얼
export const MY_EVENTS_TUTORIAL_STEPS = [
  {
    id: 'me_credit', scope: 'app',
    screen: 'MyEvents', targetKey: 'myEventsCreditBanner',
    tooltip: '알림톡 크레딧이에요',
    hint: '하객이 부조를 하면 카카오톡으로 감사 인사와 내역을 자동으로 전달해요. 크레딧이 있을 때 발송됩니다.',
    interaction: 'next',
  },
  {
    id: 'me_first_event', scope: 'app',
    screen: 'MyEvents', targetKey: 'myEventsFirstEventCard',
    tooltip: '여기를 눌러\n상세보기로 들어가보세요',
    hint: '행사별 부조 내역과 통계를 확인할 수 있어요',
    interaction: 'tap',
  },
  {
    id: 'me_guest_receive_btn', scope: 'app',
    screen: 'EventDetail', targetKey: 'eventDetailGuestReceiveBtn',
    tooltip: '하객 접수를 시작해봐요',
    hint: '축의대에서 하객 정보와 부조금을 빠르게 기록할 수 있어요. 버튼을 눌러보세요',
    interaction: 'tap',
    pauseAfterTap: true,
  },
  {
    id: 'me_side_select', scope: 'sideSelectModal',
    screen: 'EventDetail', targetKey: 'eventDetailSideSelectRows',
    tooltip: '어느 축의대인지 선택해주세요',
    hint: '신랑측 / 신부측 중 담당하는 접수대를 골라주세요',
    interaction: 'tap',
    passTargetTap: true,
  },
  {
    id: 'me_guest_writing_start', scope: 'app',
    screen: 'GuestWriting', targetKey: 'guestWritingStartBtn',
    tooltip: '방명록을 시작해봐요',
    hint: '버튼을 누르면 화면이 가로 전체화면으로 바뀌고 서명패드가 열려요. 하객분이 직접 성함을 적어요',
    interaction: 'tap',
    passTargetTap: true,
  },
  {
    id: 'me_guest_confirm_name', scope: 'app',
    screen: 'GuestConfirm', targetKey: 'guestConfirmNameArea',
    tooltip: '서명을 자동으로 인식했어요',
    hint: '하객분이 서명패드에 적은 이름을 자동으로 인식해서 후보로 보여드려요. 종이 방명록 대신 훨씬 간편하게 기록할 수 있어요',
    interaction: 'next',
    tooltipAlign: 'leftOfSpot',
  },
  {
    id: 'me_guest_confirm_btn', scope: 'app',
    screen: 'GuestConfirm', targetKey: 'guestConfirmYesBtn',
    tooltip: '성함이 맞으면 눌러주세요',
    hint: '이름이 정확하면 "네, 맞습니다" 버튼을 눌러 다음 단계로 넘어가요. 후보가 안 맞으면 직접 입력도 가능해요',
    interaction: 'tap',
    passTargetTap: true,
    tooltipAlign: 'leftOfSpot',
  },
  {
    id: 'me_guest_amount_relation', scope: 'app',
    screen: 'GuestConfirm', targetKey: 'guestConfirmAmountRelation',
    tooltip: '금액과 관계를 입력해요',
    hint: '튜토리얼이니까 금액이랑 관계는 임의로 선택해 둘게요. 실제로는 하객분이 내신 축의금과 신랑/신부와의 관계(친척·친구·직장 등)를 골라주시면 돼요',
    interaction: 'next',
    tooltipAlign: 'leftOfSpot',
  },
  {
    id: 'me_guest_kakao_toggle', scope: 'app',
    screen: 'GuestConfirm', targetKey: 'guestConfirmKakaoToggle',
    tooltip: '카카오 영수증을 켜볼게요',
    hint: '토글을 누르면 하객분 휴대폰 번호를 입력할 수 있어요. 입력하면 처음에 본 주최자 알림톡 크레딧이 1건 차감되고, 하객에게는 부조 기록이 카카오톡으로 전달돼요. (세금·현금 영수증이 아니라 부조 내역을 영수증 형태로 보여드리는 기록이에요)',
    interaction: 'tap',
    passTargetTap: true,
    tooltipAlign: 'leftOfSpot',
  },
  {
    id: 'me_guest_phone_input', scope: 'app',
    screen: 'GuestConfirm', targetKey: 'guestConfirmPhoneArea',
    tooltip: '휴대폰 번호를 직접 입력해보세요',
    hint: '실제 번호로 한 번 입력해 보세요. 11자리를 다 입력하면 자동으로 다음 단계로 넘어가요',
    interaction: 'next',
    passTargetTap: true,
    tooltipAlign: 'leftOfSpot',
  },
  {
    id: 'me_guest_save_btn', scope: 'app',
    screen: 'GuestConfirm', targetKey: 'guestConfirmSaveBtn',
    tooltip: '기록하기를 눌러서 기록해보세요',
    hint: '번호 입력이 완료되면 기록하기 버튼이 활성화돼요. 버튼을 누르면 부조 내역이 저장되고 하객분께 카카오 알림톡이 발송돼요',
    interaction: 'tap',
    passTargetTap: true,
    tooltipAlign: 'leftOfSpot',
  },
  {
    id: 'me_guest_done', scope: 'app',
    screen: 'EventDetail', targetKey: 'eventDetailDone',
    tooltip: '🎉 기록이 완료됐어요',
    hint: '방금 입력한 하객의 부조가 이 행사에 저장됐어요. 종이 방명록 대신 앱으로 간편하게 기록하고, 언제든 하객 내역을 확인하거나 감사 메시지를 보낼 수 있어요. 이제 실제로 축의대에서 사용해 보세요!',
    interaction: 'next',
    centerTooltip: true,
  },
];

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  // 현재 진행 중인 튜토리얼 종류 ('home' | 'myEvents' | null)
  const [activeTutorial, setActiveTutorial] = useState(null);
  // 현재 스텝 인덱스
  const [currentStep, setCurrentStep] = useState(0);
  // 일시정지 — 모달 열림 등으로 Overlay를 잠깐 숨겨야 할 때
  const [isPaused, setIsPaused] = useState(false);
  // 각 targetKey별 레이아웃 좌표 {x, y, width, height} + pageX, pageY
  const [targets, setTargets] = useState({});
  // 타겟 탭 시 호출할 실제 동작 (화면 이동 등)
  const [handlers, setHandlers] = useState({});
  // 튜토리얼 완료 콜백 (종료 시 DB 업데이트)
  const completingRef = useRef(false);
  // stale closure 방지용 — useCallback 내부에서 항상 최신 activeTutorial 참조
  const activeTutorialRef = useRef(activeTutorial);
  useEffect(() => { activeTutorialRef.current = activeTutorial; }, [activeTutorial]);

  const steps =
    activeTutorial === 'home' ? HOME_TUTORIAL_STEPS :
    activeTutorial === 'myEvents' ? MY_EVENTS_TUTORIAL_STEPS : [];
  const step = steps[currentStep] || null;

  const startHomeTutorial = useCallback(() => {
    setActiveTutorial('home');
    setCurrentStep(0);
  }, []);

  const startMyEventsTutorial = useCallback(() => {
    setActiveTutorial('myEvents');
    setCurrentStep(0);
  }, []);

  const advanceStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= steps.length) {
        // 튜토리얼 끝
        completeTutorial();
        return prev;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  const pauseTutorial = useCallback(() => setIsPaused(true), []);
  const resumeTutorial = useCallback(() => setIsPaused(false), []);

  // 튜토리얼 종료 + DB 업데이트 + (옵션) 시작 화면으로 reset
  // shouldResetNav: 건너뛰기 시 true — 중간 스텝이면 처음 화면으로 돌아감
  const finishTutorial = useCallback(async (shouldResetNav = false) => {
    if (completingRef.current) return;
    completingRef.current = true;
    // ref에서 최신값 읽기 (stale closure 회피)
    const tutorialType = activeTutorialRef.current;

    // 오버레이 먼저 끄기 (UI 즉시 반응)
    setActiveTutorial(null);
    setCurrentStep(0);
    setTargets({});
    setIsPaused(false);

    // ⚠️ DB 업데이트를 nav reset보다 먼저 — 반대 순서면
    //    화면이 돌아갔을 때 useFocusEffect가 옛 DB값(false)을 읽고 튜토리얼 재시작되는 경쟁 발생
    try {
      const info = await getCurrentUserInfo();
      const uid = info?.user?.id;
      if (uid && tutorialType) {
        const column =
          tutorialType === 'home' ? 'tutorial_home_completed' :
          tutorialType === 'myEvents' ? 'tutorial_my_events_completed' : null;
        if (column) {
          await supabase.from('users').update({ [column]: true }).eq('id', uid);
        }
      }
    } catch (e) {
      console.warn('튜토리얼 완료 상태 저장 실패:', e);
    }

    // DB 저장 끝난 후 시작 탭으로 복귀 (skip일 때만)
    if (shouldResetNav && tutorialType) {
      const tabName = tutorialType === 'home' ? 'Home' : tutorialType === 'myEvents' ? 'MyEvents' : null;
      if (tabName) resetToTab(tabName);
    }

    completingRef.current = false;
  }, []);

  const completeTutorial = useCallback(() => finishTutorial(false), [finishTutorial]);
  const skipTutorial = useCallback(() => finishTutorial(true), [finishTutorial]);

  // 타겟 등록 — 각 화면에서 onLayout 또는 measure로 호출
  // layout은 화면 전체 기준 좌표 (pageX/pageY)여야 오버레이가 정확히 맞음
  const registerTarget = useCallback((key, layout) => {
    setTargets(prev => ({ ...prev, [key]: layout }));
  }, []);

  const unregisterTarget = useCallback((key) => {
    setTargets(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // 타겟 탭 시 실행할 handler 등록 (화면 이동 등)
  const registerHandler = useCallback((key, fn) => {
    setHandlers(prev => ({ ...prev, [key]: fn }));
  }, []);

  // 현재 스텝이 이 화면/타겟에 해당하는지
  const isActiveStep = useCallback((targetKey) => {
    return activeTutorial && step?.targetKey === targetKey;
  }, [activeTutorial, step]);

  // 타겟 버튼이 실제로 탭되었을 때 호출 (interaction === 'tap' 스텝에서)
  const onTargetTap = useCallback((targetKey) => {
    if (step?.targetKey === targetKey && step?.interaction === 'tap') {
      advanceStep();
    }
  }, [step, advanceStep]);

  const value = {
    activeTutorial,
    currentStep,
    step,
    totalSteps: steps.length,
    targets,
    handlers,
    isPaused,
    startHomeTutorial,
    startMyEventsTutorial,
    advanceStep,
    skipTutorial,
    pauseTutorial,
    resumeTutorial,
    registerTarget,
    unregisterTarget,
    registerHandler,
    isActiveStep,
    onTargetTap,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    return {
      activeTutorial: null,
      currentStep: 0,
      step: null,
      totalSteps: 0,
      targets: {},
      handlers: {},
      isPaused: false,
      startHomeTutorial: () => {},
      startMyEventsTutorial: () => {},
      advanceStep: () => {},
      skipTutorial: () => {},
      pauseTutorial: () => {},
      resumeTutorial: () => {},
      registerTarget: () => {},
      unregisterTarget: () => {},
      registerHandler: () => {},
      isActiveStep: () => false,
      onTargetTap: () => {},
    };
  }
  return ctx;
}
