// src/styles/constants.js
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// 토스 스타일 색상 팔레트
export const Colors = {
  // 메인 색상
  primary: '#3182F6',
  primaryLight: '#4A90E2',
  primaryDark: '#2171E5',
  
  // 배경 색상
  background: '#FFFFFF',
  backgroundSecondary: '#FAFBFC',
  
  // 그레이스케일
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',
  
  // 텍스트 색상
  textPrimary: '#191F28',
  textSecondary: '#8B95A1',
  textTertiary: '#C4CDD5',
  textDisabled: '#E5E8EB',
  
  // 상태 색상
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  warningDark: '#D97706',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoDark: '#2563EB',
  
  // 경조사 타입별 색상
  wedding: '#EC4899',      // 핑크
  weddingLight: '#F472B6',
  weddingDark: '#DB2777',
  
  funeral: '#64748B',      // 회색
  funeralLight: '#94A3B8',
  funeralDark: '#475569',
  
  celebration: '#F59E0B',  // 주황
  celebrationLight: '#FCD34D',
  celebrationDark: '#D97706',
  
  other: '#8B5CF6',        // 보라
  otherLight: '#A78BFA',
  otherDark: '#7C3AED',
  
  // 소셜 로그인 색상
  kakao: '#FEE500',
  google: '#4285F4',
  
  // 토스 특화 색상
  tossBlue: '#3182F6',
  tossPurple: '#6366F1',
  tossGreen: '#10B981',
  tossOrange: '#F59E0B',
  tossPink: '#EC4899',
  
  // 투명도 색상
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
  
  // 그라데이션
  gradientPrimary: ['#3182F6', '#6366F1'],
  gradientSuccess: ['#10B981', '#34D399'],
  gradientWarning: ['#F59E0B', '#FCD34D'],
  gradientError: ['#EF4444', '#F87171'],
};

// 반응형 사이즈
export const Sizes = {
  // 화면 크기
  screenWidth: width,
  screenHeight: height,
  
  // 반응형 판단
  isSmallScreen: width < 375,
  isMediumScreen: width >= 375 && width < 414,
  isLargeScreen: width >= 414,
  isTablet: width >= 768,
  isLargeTablet: width >= 1024,
  
  // 패딩 및 마진
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // 보더 라디우스
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    xxxl: 24,
    round: 9999,
  },
  
  // 그림자
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    xlarge: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// 타이포그래피
export const Typography = {
  // 폰트 크기
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 32,
    giant: 40,
  },
  
  // 폰트 굵기
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  },
  
  // 줄 간격
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // 글자 간격
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// 애니메이션
export const Animations = {
  // 지속 시간
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  
  // 이징
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // 스프링 설정
  spring: {
    default: {
      tension: 100,
      friction: 8,
    },
    gentle: {
      tension: 80,
      friction: 10,
    },
    wobbly: {
      tension: 180,
      friction: 8,
    },
    stiff: {
      tension: 200,
      friction: 10,
    },
  },
};

// 레이아웃
export const Layout = {
  // 컨테이너 패딩
  containerPadding: Sizes.isLargeTablet ? 40 : Sizes.isTablet ? 30 : 20,
  
  // 헤더 높이
  headerHeight: Platform.OS === 'ios' ? 88 : 64,
  
  // 탭바 높이
  tabBarHeight: Platform.OS === 'ios' ? 83 : 56,
  
  // 상태바 높이
  statusBarHeight: Platform.OS === 'ios' ? 44 : 24,
  
  // 버튼 높이
  buttonHeight: {
    small: 32,
    medium: 40,
    large: 48,
    xlarge: 56,
  },
  
  // 입력 필드 높이
  inputHeight: {
    small: 36,
    medium: 44,
    large: 52,
  },
  
  // 아이콘 크기
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
    xxxl: 40,
    huge: 48,
  },
};

// 기본 플렉스 스타일들 (순환 참조 방지를 위해 분리)
const flexStyles = {
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
};

// 공통 스타일
export const CommonStyles = {
  // 플렉스 레이아웃
  flex: flexStyles,
  
  // 카드 스타일
  card: {
    backgroundColor: Colors.white,
    borderRadius: Sizes.borderRadius.lg,
    padding: Sizes.padding.xl,
    ...Sizes.shadow.medium,
  },
  
  // 버튼 스타일
  button: {
    primary: {
      backgroundColor: Colors.primary,
      borderRadius: Sizes.borderRadius.lg,
      paddingHorizontal: Sizes.padding.xl,
      paddingVertical: Sizes.padding.lg,
      ...flexStyles.center,
    },
    secondary: {
      backgroundColor: Colors.gray100,
      borderRadius: Sizes.borderRadius.lg,
      paddingHorizontal: Sizes.padding.xl,
      paddingVertical: Sizes.padding.lg,
      ...flexStyles.center,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.primary,
      borderRadius: Sizes.borderRadius.lg,
      paddingHorizontal: Sizes.padding.xl,
      paddingVertical: Sizes.padding.lg,
      ...flexStyles.center,
    },
  },
  
  // 텍스트 스타일
  text: {
    title: {
      fontSize: Typography.fontSize.xxxl,
      fontWeight: Typography.fontWeight.bold,
      color: Colors.textPrimary,
      lineHeight: Typography.lineHeight.tight,
    },
    subtitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.semibold,
      color: Colors.textSecondary,
      lineHeight: Typography.lineHeight.normal,
    },
    body: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.normal,
      color: Colors.textPrimary,
      lineHeight: Typography.lineHeight.normal,
    },
    caption: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.normal,
      color: Colors.textSecondary,
      lineHeight: Typography.lineHeight.normal,
    },
  },
  
  // 입력 필드 스타일
  input: {
    base: {
      backgroundColor: Colors.gray50,
      borderRadius: Sizes.borderRadius.lg,
      paddingHorizontal: Sizes.padding.lg,
      paddingVertical: Sizes.padding.lg,
      fontSize: Typography.fontSize.lg,
      color: Colors.textPrimary,
      borderWidth: 1,
      borderColor: Colors.gray200,
    },
    focused: {
      borderColor: Colors.primary,
      backgroundColor: Colors.white,
    },
    error: {
      borderColor: Colors.error,
      backgroundColor: Colors.white,
    },
  },
};

// 테마
export const Theme = {
  light: {
    colors: Colors,
    sizes: Sizes,
    typography: Typography,
    animations: Animations,
    layout: Layout,
    commonStyles: CommonStyles,
  },
  // 다크 모드는 추후 추가 가능
};

// 기본 테마 내보내기
export default Theme.light;