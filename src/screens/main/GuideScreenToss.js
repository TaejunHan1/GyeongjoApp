// src/screens/main/GuideScreenToss.js - 토스 스타일 가이드 화면
import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  PanResponder,
  Keyboard,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { getAiStatus, AI_COST } from '../../lib/aiCredit';
import GuideThemeMinimal from './guides/themes/GuideThemeMinimal';
import { KOREA_COST_MAP_AREAS, KOREA_COST_MAP_LABELS } from './costMapPathData';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : RNStatusBar.currentHeight || 24;
const ESTIMATE_LOADING_LOTTIE = require('../../../assets/lottie/estimate-loading.json');

// 토스 스타일 컬러
const TossColors = {
  primary: '#0064FF',
  primaryLight: '#E6F0FF',
  background: '#FFFFFF',
  surface: '#F7F8FA',
  text: {
    primary: '#191F28',
    secondary: '#8B95A1',
    tertiary: '#B0B8C1',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F2F4F6',
    200: '#E5E8EB',
    300: '#D1D6DB',
    400: '#B0B8C1',
    500: '#8B95A1',
    600: '#6B7684',
    700: '#4E5968',
    800: '#333D4B',
    900: '#191F28',
  },
  border: '#F2F3F5',
  success: '#00C896',
  error: '#FF5A5F',
};

// 테마 스위처 (상단 미리보기 칩)
const THEMES = [
  { id: 'toss',    label: '기본',   icon: '🎯' },
  { id: 'minimal', label: '미니멀', icon: '○' },
];

const GUIDE_MAIN_TABS = [
  { id: 'guide', label: '가이드', icon: 'book-outline' },
  { id: 'cost', label: '예식비 진단', icon: 'calculator-outline' },
];

const WEDDING_COST_REGIONS = [
  {
    region: '전국',
    rental: { p10: 100, p25: 200, median: 350, p75: 600, p90: 850, average: 436, sample: 5566 },
    meal: { p10: 4.5, p25: 5.0, median: 5.9, p75: 7.5, p90: 9.2, average: 6.6, sample: 5566 },
    baseMeal: { p10: 660, p25: 846, median: 1140, p75: 1580, p90: 2150, average: 1316, sample: 5566 },
    contract: { p10: 825, p25: 1109, median: 1550, p75: 2240, p90: 3050, average: 1822, sample: 5566 },
  },
  {
    region: '수도권',
    rental: { p10: 150, p25: 300, median: 550, p75: 800, p90: 1100, average: 608, sample: 2727 },
    meal: { p10: 5.4, p25: 6.3, median: 7.5, p75: 8.7, p90: 10.5, average: 7.9, sample: 2727 },
    baseMeal: { p10: 790, p25: 1100, median: 1500, p75: 1923, p90: 2640, average: 1640, sample: 2727 },
    contract: { p10: 1145, p25: 1530, median: 2120, p75: 2865, p90: 4069, average: 2374, sample: 2727 },
  },
  {
    region: '비수도권',
    rental: { p10: 80, p25: 150, median: 260, p75: 370, p90: 470, average: 271, sample: 2839 },
    meal: { p10: 4.2, p25: 4.5, median: 5.2, p75: 5.8, p90: 6.5, average: 5.3, sample: 2839 },
    baseMeal: { p10: 585, p25: 750, median: 940, p75: 1180, p90: 1500, average: 1004, sample: 2839 },
    contract: { p10: 730, p25: 940, median: 1200, p75: 1550, p90: 1930, average: 1292, sample: 2839 },
  },
  {
    region: '서울(강남)',
    rental: { p10: 220, p25: 500, median: 770, p75: 898, p90: 1200, average: 714, sample: 680 },
    meal: { p10: 6.8, p25: 7.8, median: 8.8, p75: 9.8, p90: 12.4, average: 9.3, sample: 680 },
    baseMeal: { p10: 790, p25: 1275, median: 1760, p75: 2565, p90: 3240, average: 1993, sample: 680 },
    contract: { p10: 1530, p25: 1930, median: 2774, p75: 3520, p90: 5250, average: 2940, sample: 680 },
  },
  {
    region: '서울(강남외)',
    rental: { p10: 200, p25: 400, median: 610, p75: 800, p90: 1500, average: 705, sample: 1205 },
    meal: { p10: 5.6, p25: 6.7, median: 7.5, p75: 8.8, p90: 13.0, average: 8.3, sample: 1205 },
    baseMeal: { p10: 975, p25: 1300, median: 1575, p75: 2000, p90: 2664, average: 1768, sample: 1205 },
    contract: { p10: 1380, p25: 1885, median: 2290, p75: 2860, p90: 4440, average: 2594, sample: 1205 },
  },
  {
    region: '부산',
    rental: { p10: 50, p25: 100, median: 170, p75: 290, p90: 350, average: 193, sample: 400 },
    meal: { p10: 4.2, p25: 4.5, median: 4.9, p75: 5.3, p90: 5.6, average: 5.0, sample: 400 },
    baseMeal: { p10: 540, p25: 660, median: 780, p75: 840, p90: 980, average: 772, sample: 400 },
    contract: { p10: 600, p25: 725, median: 915, p75: 1130, p90: 1280, average: 968, sample: 400 },
  },
  {
    region: '대구',
    rental: { p10: 70, p25: 80, median: 150, p75: 250, p90: 450, average: 212, sample: 384 },
    meal: { p10: 4.5, p25: 4.9, median: 5.5, p75: 5.8, p90: 6.5, average: 5.6, sample: 384 },
    baseMeal: { p10: 675, p25: 855, median: 995, p75: 1160, p90: 1600, average: 1059, sample: 384 },
    contract: { p10: 735, p25: 1000, median: 1120, p75: 1550, p90: 2050, average: 1312, sample: 384 },
  },
  {
    region: '인천',
    rental: { p10: 100, p25: 190, median: 300, p75: 350, p90: 500, average: 283, sample: 197 },
    meal: { p10: 4.8, p25: 5.0, median: 5.5, p75: 5.8, p90: 6.0, average: 5.5, sample: 197 },
    baseMeal: { p10: 675, p25: 870, median: 1000, p75: 1131, p90: 1242, average: 1003, sample: 197 },
    contract: { p10: 810, p25: 1120, median: 1300, p75: 1500, p90: 1755, average: 1303, sample: 197 },
  },
  {
    region: '경기도',
    rental: { p10: 100, p25: 200, median: 380, p75: 600, p90: 750, average: 413, sample: 645 },
    meal: { p10: 5.3, p25: 5.5, median: 6.5, p75: 6.9, p90: 7.8, average: 6.5, sample: 645 },
    baseMeal: { p10: 600, p25: 975, median: 1140, p75: 1625, p90: 1900, average: 1223, sample: 645 },
    contract: { p10: 850, p25: 1260, median: 1575, p75: 2170, p90: 2865, average: 1691, sample: 645 },
  },
  {
    region: '광주',
    rental: { p10: 70, p25: 100, median: 235, p75: 430, p90: 450, average: 246, sample: 240 },
    meal: { p10: 4.8, p25: 5.5, median: 6.0, p75: 6.6, p90: 6.7, average: 5.9, sample: 240 },
    baseMeal: { p10: 825, p25: 960, median: 1140, p75: 1340, p90: 1625, average: 1178, sample: 240 },
    contract: { p10: 885, p25: 1100, median: 1450, p75: 1770, p90: 1968, average: 1426, sample: 240 },
  },
  {
    region: '대전',
    rental: { p10: 90, p25: 200, median: 297, p75: 300, p90: 350, average: 259, sample: 230 },
    meal: { p10: 4.6, p25: 4.8, median: 5.5, p75: 6.0, p90: 6.3, average: 5.6, sample: 230 },
    baseMeal: { p10: 554, p25: 735, median: 945, p75: 1200, p90: 1500, average: 1042, sample: 230 },
    contract: { p10: 800, p25: 1085, median: 1240, p75: 1497, p90: 2130, average: 1344, sample: 230 },
  },
  {
    region: '울산',
    rental: { p10: 280, p25: 280, median: 380, p75: 530, p90: 550, average: 406, sample: 159 },
    meal: { p10: 5.2, p25: 5.4, median: 5.6, p75: 5.8, p90: 6.2, average: 5.6, sample: 159 },
    baseMeal: { p10: 936, p25: 1020, median: 1120, p75: 1160, p90: 1240, average: 1104, sample: 159 },
    contract: { p10: 1311, p25: 1350, median: 1610, p75: 1650, p90: 1770, average: 1518, sample: 159 },
  },
  {
    region: '강원도',
    rental: { p10: 120, p25: 200, median: 350, p75: 400, p90: 430, average: 319, sample: 150 },
    meal: { p10: 4.0, p25: 4.5, median: 5.2, p75: 5.4, p90: 5.7, average: 5.1, sample: 150 },
    baseMeal: { p10: 675, p25: 800, median: 1040, p75: 1620, p90: 1710, average: 1165, sample: 150 },
    contract: { p10: 840, p25: 1000, median: 1470, p75: 1990, p90: 2060, average: 1509, sample: 150 },
  },
  {
    region: '충청도',
    rental: { p10: 167, p25: 200, median: 350, p75: 500, p90: 600, average: 366, sample: 342 },
    meal: { p10: 3.9, p25: 5.0, median: 5.7, p75: 6.0, p90: 6.5, average: 5.5, sample: 342 },
    baseMeal: { p10: 500, p25: 810, median: 1080, p75: 1200, p90: 1380, average: 1003, sample: 342 },
    contract: { p10: 700, p25: 1036, median: 1430, p75: 1780, p90: 1970, average: 1382, sample: 342 },
  },
  {
    region: '전라도',
    rental: { p10: 130, p25: 200, median: 280, p75: 400, p90: 500, average: 321, sample: 371 },
    meal: { p10: 4.3, p25: 4.5, median: 5.0, p75: 5.5, p90: 6.5, average: 5.2, sample: 371 },
    baseMeal: { p10: 645, p25: 840, median: 1000, p75: 1250, p90: 1325, average: 1029, sample: 371 },
    contract: { p10: 815, p25: 1040, median: 1300, p75: 1550, p90: 1850, average: 1361, sample: 371 },
  },
  {
    region: '경상도',
    rental: { p10: 100, p25: 150, median: 290, p75: 370, p90: 400, average: 266, sample: 448 },
    meal: { p10: 3.8, p25: 4.3, median: 4.5, p75: 4.7, p90: 6.5, average: 4.7, sample: 448 },
    baseMeal: { p10: 540, p25: 660, median: 782, p75: 920, p90: 1400, average: 841, sample: 448 },
    contract: { p10: 705, p25: 855, median: 1053, p75: 1298, p90: 1800, average: 1108, sample: 448 },
  },
  {
    region: '제주도',
    rental: { p10: 0, p25: 150, median: 198, p75: 200, p90: 200, average: 150, sample: 115 },
    meal: { p10: 3.8, p25: 4.2, median: 4.7, p75: 5.5, p90: 5.9, average: 4.8, sample: 115 },
    baseMeal: { p10: 840, p25: 940, median: 1160, p75: 1650, p90: 2100, average: 1394, sample: 115 },
    contract: { p10: 950, p25: 1140, median: 1300, p75: 1850, p90: 2298, average: 1595, sample: 115 },
  },
];

const formatManWon = (value, digits = 0) => {
  if (!Number.isFinite(value)) return '-';
  return `${value.toLocaleString('ko-KR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}만원`;
};

const parseNumberInput = (value) => {
  const normalized = String(value || '').replace(/,/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCostLevel = (value, dist) => {
  if (!Number.isFinite(value) || value <= 0) {
    return { label: '입력 필요', tone: 'muted', description: '견적을 입력하면 비교가 나와요' };
  }
  if (value <= dist.p10) return { label: '매우 낮음', tone: 'green', description: '하위 10% 구간이에요' };
  if (value <= dist.p25) return { label: '낮은 편', tone: 'green', description: '하위 25% 안쪽이에요' };
  if (value <= dist.median) return { label: '평균 아래', tone: 'blue', description: '중간값보다 낮아요' };
  if (value <= dist.p75) return { label: '평균권', tone: 'blue', description: '중간~상위 25% 구간이에요' };
  if (value <= dist.p90) return { label: '높은 편', tone: 'orange', description: '상위 25% 구간이에요' };
  return { label: '매우 높음', tone: 'red', description: '상위 10%를 넘어요' };
};

const estimatePercentile = (value, dist) => {
  if (!Number.isFinite(value) || value <= 0) return null;
  const points = [
    { value: dist.p10, pct: 10 },
    { value: dist.p25, pct: 25 },
    { value: dist.median, pct: 50 },
    { value: dist.p75, pct: 75 },
    { value: dist.p90, pct: 90 },
  ].sort((a, b) => a.value - b.value);

  const first = points[0];
  const last = points[points.length - 1];
  if (value <= first.value) {
    return Math.max(1, Math.round((value / Math.max(first.value, 1)) * first.pct));
  }
  if (value >= last.value) {
    const overRatio = (value - last.value) / Math.max(last.value, 1);
    return Math.min(99, Math.round(last.pct + overRatio * 20));
  }
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const next = points[i];
    if (value <= next.value) {
      const ratio = (value - prev.value) / Math.max(next.value - prev.value, 1);
      return Math.round(prev.pct + ratio * (next.pct - prev.pct));
    }
  }
  return 50;
};

const getPercentileCopy = (percentile) => {
  if (percentile == null) {
    return { title: '계산 전', detail: '견적을 입력해 주세요' };
  }
  if (percentile >= 50) {
    const top = Math.max(1, 100 - percentile);
    return {
      title: `상위 ${top}% 구간`,
      detail: `비용이 지역 표본의 약 ${percentile}%보다 높아요`,
    };
  }
  const bottom = Math.max(1, percentile);
  return {
    title: `하위 ${bottom}% 구간`,
    detail: `비용이 지역 표본의 약 ${100 - percentile}%보다 낮아요`,
  };
};

function GuideTopTabs({ active, onChange }) {
  return (
    <View style={styles.mainTabWrap}>
      {GUIDE_MAIN_TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.mainTabButton, isActive && styles.mainTabButtonActive]}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={tab.icon}
              size={15}
              color={isActive ? TossColors.text.primary : TossColors.text.secondary}
            />
            <Text style={[styles.mainTabText, isActive && styles.mainTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CostStepper({
  label,
  helper,
  value,
  onChangeText,
  onStep,
  unit,
  keyboardType = 'decimal-pad',
  stepLabel,
}) {
  return (
    <View style={styles.costStepper}>
      <View style={styles.costStepperHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.costStepperLabel}>{label}</Text>
          {!!helper && <Text style={styles.costStepperHelper}>{helper}</Text>}
        </View>
        <Text style={styles.costStepperStep}>{stepLabel}</Text>
      </View>
      <View style={styles.costStepperControl}>
        <TouchableOpacity
          style={styles.costStepButton}
          onPress={() => onStep(-1)}
          activeOpacity={0.82}
        >
          <Ionicons name="remove" size={18} color={TossColors.text.primary} />
        </TouchableOpacity>
        <View style={styles.costValueWrap}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            style={styles.costValueInput}
            placeholder="0"
            placeholderTextColor={TossColors.gray[400]}
            selectTextOnFocus
          />
          <Text style={styles.costValueUnit}>{unit}</Text>
        </View>
        <TouchableOpacity
          style={styles.costStepButton}
          onPress={() => onStep(1)}
          activeOpacity={0.82}
        >
          <Ionicons name="add" size={18} color={TossColors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function KoreaCostRegionMap({ selectedRegion, onSelectRegion }) {
  const isAreaActive = (areaRegion) => {
    if (selectedRegion === '전국') return true;
    if (selectedRegion === '수도권') {
      return ['서울(강남외)', '경기도', '인천'].includes(areaRegion);
    }
    if (selectedRegion === '비수도권') {
      return !['서울(강남외)', '경기도', '인천'].includes(areaRegion);
    }
    if (selectedRegion === '서울(강남)') return areaRegion === '서울(강남외)';
    return areaRegion === selectedRegion;
  };

  const isLabelActive = (region) => isAreaActive(region);
  const cityLabels = KOREA_COST_MAP_LABELS.filter((item) => item.kind === 'city');
  const mainLabels = KOREA_COST_MAP_LABELS.filter((item) => item.kind !== 'city');

  return (
    <Svg width="100%" height="100%" viewBox="24 -8 178 286" preserveAspectRatio="xMidYMid meet">
      {KOREA_COST_MAP_AREAS.filter((area) => isAreaActive(area.region)).map((area) => (
        <Path
          key={`halo-${area.name}`}
          d={area.d}
          fill="none"
          stroke="#A9D3FF"
          strokeWidth={6.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.45}
        />
      ))}

      {KOREA_COST_MAP_AREAS.map((area) => {
        const active = isAreaActive(area.region);
        return (
          <Path
            key={area.name}
            d={area.d}
            fill={active ? '#339AF0' : '#DCEEFF'}
            stroke={active ? '#2F8FE0' : '#8F9BA7'}
            strokeWidth={active ? 1.45 : 0.9}
            strokeLinejoin="round"
            strokeLinecap="round"
            onPress={() => onSelectRegion(area.region)}
          />
        );
      })}

      {mainLabels.map((item) => {
        const active = isLabelActive(item.region);
        return (
          <SvgText
            key={item.region}
            x={item.x}
            y={item.y}
            fill={active ? '#FFFFFF' : '#536170'}
            fontSize={active ? 9.6 : 8.2}
            fontWeight="900"
            textAnchor="middle"
            alignmentBaseline="middle"
            onPress={() => onSelectRegion(item.region)}
          >
            {item.label}
          </SvgText>
        );
      })}

      {cityLabels.map((item) => {
        const active = isLabelActive(item.region);
        const radius = item.region === '서울(강남외)' || item.region === '인천' ? 10.6 : 9.3;
        const hitRadius = item.region === '서울(강남외)' || item.region === '인천' ? 17 : 15;
        return (
          <React.Fragment key={item.region}>
            <Circle
              cx={item.x}
              cy={item.y}
              r={hitRadius}
              fill="transparent"
              onPress={() => onSelectRegion(item.region)}
            />
            <Circle
              cx={item.x}
              cy={item.y}
              r={radius}
              fill={active ? '#0064FF' : '#FFFFFF'}
              stroke={active ? '#0056D6' : '#9FAAB5'}
              strokeWidth={1.1}
              onPress={() => onSelectRegion(item.region)}
            />
            <SvgText
              x={item.x}
              y={item.y + 0.1}
              fill={active ? '#FFFFFF' : '#4E5968'}
              fontSize={5.8}
              fontWeight="900"
              textAnchor="middle"
              alignmentBaseline="middle"
              onPress={() => onSelectRegion(item.region)}
            >
              {item.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function WeddingCostDiagnosis() {
  const [selectedRegion, setSelectedRegion] = useState('서울(강남외)');
  const [rentalCost, setRentalCost] = useState('610');
  const [mealCost, setMealCost] = useState('8.3');
  const [guestCount, setGuestCount] = useState('200');
  const [showResult, setShowResult] = useState(false);
  const [showEstimateInputSheet, setShowEstimateInputSheet] = useState(false);
  const [estimateInputStep, setEstimateInputStep] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const sheetTranslateY = useRef(new Animated.Value(560)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const inputSheetTranslateY = useRef(new Animated.Value(620)).current;
  const inputBackdropOpacity = useRef(new Animated.Value(0)).current;
  const estimateLoadingTimerRef = useRef(null);
  const estimateInputStepRef = useRef(0);

  const selectedData = WEDDING_COST_REGIONS.find((item) => item.region === selectedRegion) || WEDDING_COST_REGIONS[0];
  const rental = parseNumberInput(rentalCost);
  const meal = parseNumberInput(mealCost);
  const guests = parseNumberInput(guestCount);
  const baseMealTotal = meal * guests;
  const contractTotal = rental + baseMealTotal;
  const saveByTenGuests = meal * 10;
  const sampleCount = selectedData.contract.sample;

  const diagnosis = [
    { key: 'rental', label: '대관비', value: rental, dist: selectedData.rental, digits: 0 },
    { key: 'meal', label: '1인당 식대', value: meal, dist: selectedData.meal, digits: 1 },
    { key: 'baseMeal', label: '식대 총액', value: baseMealTotal, dist: selectedData.baseMeal, digits: 0 },
    { key: 'contract', label: '총 계약금액', value: contractTotal, dist: selectedData.contract, digits: 0 },
  ].map((item) => ({
    ...item,
    level: getCostLevel(item.value, item.dist),
  }));

  const contractPercentile = estimatePercentile(contractTotal, selectedData.contract);
  const percentileCopy = getPercentileCopy(contractPercentile);
  const strongest = [...diagnosis]
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => (b.value / b.dist.median) - (a.value / a.dist.median))[0];
  const adjustNumber = (setter, current, delta, min, max, digits = 0) => {
    const currentValue = parseNumberInput(current);
    const nextValue = Math.max(min, Math.min(max, currentValue + delta));
    setter(digits > 0 ? nextValue.toFixed(digits) : String(Math.round(nextValue)));
    setShowResult(false);
  };
  const contractDiff = contractTotal - selectedData.contract.median;
  const contractDiffText =
    Math.abs(contractDiff) < 1
      ? '중간값과 거의 같아요'
      : contractDiff > 0
        ? `중간값보다 약 ${formatManWon(contractDiff)} 높아요`
        : `중간값보다 약 ${formatManWon(Math.abs(contractDiff))} 낮아요`;
  const percentilePosition = Math.max(2, Math.min(98, contractPercentile || 0));
  const sampleCountText = sampleCount.toLocaleString('ko-KR');
  const showSeoulInset = selectedRegion === '서울(강남)' || selectedRegion === '서울(강남외)';
  const estimateStepConfigs = [
    {
      title: '대관비가 얼마인가요?',
      helper: '계약서에 적힌 홀 사용료나 기본 대관 비용을 입력해 주세요.',
      value: rentalCost,
      onChangeText: setRentalCost,
      unit: '만원',
      placeholder: '예: 610',
      keyboardType: 'number-pad',
    },
    {
      title: '1인당 식대가 얼마인가요?',
      helper: '성인 1명 기준 식사 금액을 만원 단위로 입력해 주세요.',
      value: mealCost,
      onChangeText: setMealCost,
      unit: '만원',
      placeholder: '예: 8.3',
      keyboardType: 'decimal-pad',
    },
    {
      title: '기본 하객인원이 몇 명인가요?',
      helper: '식대 계산에 쓰이는 보증 인원이나 기본 하객 인원을 입력해 주세요.',
      value: guestCount,
      onChangeText: setGuestCount,
      unit: '명',
      placeholder: '예: 200',
      keyboardType: 'number-pad',
    },
  ];
  const estimateInputConfigIndex = Math.max(0, Math.min(estimateInputStep - 1, 2));
  const activeEstimateInputConfig = estimateStepConfigs[estimateInputConfigIndex];
  const estimateSelectableRegions = WEDDING_COST_REGIONS.filter(
    (item) => !['전국', '수도권', '비수도권'].includes(item.region)
  );
  const canProceedEstimate =
    estimateInputStep === 0 || parseNumberInput(activeEstimateInputConfig.value) > 0;
  const inputKeyboardLift =
    showEstimateInputSheet && estimateInputStep >= 1 && estimateInputStep <= 3
      ? Math.min(keyboardHeight, Math.round(height * 0.46))
      : 0;
  const estimateMood =
    contractPercentile == null
      ? '계산 전'
      : contractPercentile >= 75
        ? '비싼 편'
        : contractPercentile <= 25
          ? '저렴한 편'
          : contractPercentile >= 40 && contractPercentile <= 60
            ? '중간 정도'
            : contractPercentile > 60
              ? '살짝 높은 편'
              : '살짝 낮은 편';

  useEffect(() => () => {
    if (estimateLoadingTimerRef.current) {
      clearTimeout(estimateLoadingTimerRef.current);
    }
  }, []);

  useEffect(() => {
    estimateInputStepRef.current = estimateInputStep;
  }, [estimateInputStep]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function openEstimateInputSheet() {
    if (estimateLoadingTimerRef.current) {
      clearTimeout(estimateLoadingTimerRef.current);
      estimateLoadingTimerRef.current = null;
    }
    setEstimateInputStep(0);
    inputSheetTranslateY.setValue(620);
    inputBackdropOpacity.setValue(0);
    setShowEstimateInputSheet(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(inputBackdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(inputSheetTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function closeEstimateInputSheet() {
    if (estimateLoadingTimerRef.current) {
      clearTimeout(estimateLoadingTimerRef.current);
      estimateLoadingTimerRef.current = null;
    }
    Keyboard.dismiss();
    setKeyboardHeight(0);
    Animated.parallel([
      Animated.timing(inputBackdropOpacity, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(inputSheetTranslateY, {
        toValue: 620,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setShowEstimateInputSheet(false));
  }

  function handleEstimateNext() {
    if (!canProceedEstimate) return;
    setShowResult(false);
    if (estimateInputStep < 3) {
      setEstimateInputStep((prev) => prev + 1);
      return;
    }
    Keyboard.dismiss();
    setEstimateInputStep(4);
    estimateLoadingTimerRef.current = setTimeout(() => {
      estimateLoadingTimerRef.current = null;
      setEstimateInputStep(5);
    }, 6000);
  }

  function handleEstimateBack() {
    if (estimateInputStep <= 0 || estimateInputStep === 4) return;
    Keyboard.dismiss();
    setKeyboardHeight(0);
    setEstimateInputStep((prev) => Math.max(0, prev - 1));
  }

  function openResultSheet() {
    sheetTranslateY.setValue(560);
    backdropOpacity.setValue(0);
    setShowResult(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function closeResultSheet() {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 560,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setShowResult(false));
  }

  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetTranslateY.setValue(gestureState.dy);
          backdropOpacity.setValue(Math.max(0.25, 1 - gestureState.dy / 420));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 0.75) {
          closeResultSheet();
          return;
        }
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;
  const inputSheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        estimateInputStepRef.current !== 4 &&
        Math.abs(gestureState.dy) > 6 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          inputSheetTranslateY.setValue(gestureState.dy);
          inputBackdropOpacity.setValue(Math.max(0.25, 1 - gestureState.dy / 420));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 0.75) {
          closeEstimateInputSheet();
          return;
        }
        Animated.parallel([
          Animated.timing(inputBackdropOpacity, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(inputSheetTranslateY, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  return (
    <>
    <ScrollView style={styles.costRoot} contentContainerStyle={styles.costScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.costSectionLabel}>지역 선택</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionChipRow}>
        {WEDDING_COST_REGIONS.map((item) => {
          const active = selectedRegion === item.region;
          return (
            <TouchableOpacity
              key={item.region}
              style={[styles.regionChip, active && styles.regionChipActive]}
              onPress={() => {
                setSelectedRegion(item.region);
                setShowResult(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.regionChipText, active && styles.regionChipTextActive]}>{item.region}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.regionMapCard}>
        <View style={styles.regionMapHeader}>
          <View>
            <Text style={styles.regionMapTitle}>지역별 가격 비교</Text>
            <Text style={styles.regionMapSub}>권역과 세부 지역을 눌러 바로 비교해요</Text>
          </View>
          <View style={styles.regionMapBadge}>
            <Text style={styles.regionMapBadgeText}>2026.04</Text>
          </View>
        </View>

        <View style={styles.mapPricePanel}>
          <View style={styles.mapPriceHeader}>
            <View style={styles.mapPriceMain}>
              <Text style={styles.mapPriceRegion} numberOfLines={1}>{selectedRegion}</Text>
              <Text style={styles.mapPriceAmount} numberOfLines={1}>평균 {formatManWon(selectedData.contract.average)}</Text>
            </View>
            <Text style={styles.mapPriceSample} numberOfLines={1}>{sampleCountText}건</Text>
          </View>
          {showSeoulInset ? (
            <View style={styles.seoulPriceSelectorRow}>
              {[
                { region: '서울(강남외)', label: '강남 외' },
                { region: '서울(강남)', label: '강남' },
              ].map((item) => {
                const active = selectedRegion === item.region;
                return (
                  <TouchableOpacity
                    key={item.region}
                    style={[styles.seoulPriceSelectorChip, active && styles.seoulPriceSelectorChipActive]}
                    onPress={() => {
                      setSelectedRegion(item.region);
                      setShowResult(false);
                    }}
                    activeOpacity={0.84}
                  >
                    <Text style={[styles.seoulPriceSelectorText, active && styles.seoulPriceSelectorTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.mapPriceInfoRow}>
              <View style={styles.mapPriceInfoChip}>
                <Text style={styles.mapPriceInfoLabel}>중간값</Text>
                <Text style={styles.mapPriceInfoValue} numberOfLines={1}>
                  {formatManWon(selectedData.contract.median)}
                </Text>
              </View>
              <View style={styles.mapPriceInfoChip}>
                <Text style={styles.mapPriceInfoLabel}>일반 구간</Text>
                <Text style={styles.mapPriceInfoValue} numberOfLines={1}>
                  {formatManWon(selectedData.contract.p25)}~{formatManWon(selectedData.contract.p75)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.koreaMapBox}>
          <KoreaCostRegionMap
            selectedRegion={selectedRegion}
            onSelectRegion={(region) => {
              setSelectedRegion(region);
              setShowResult(false);
            }}
          />
        </View>

        <View style={styles.mapStatsGrid}>
          <View style={styles.mapStatItem}>
            <Text style={styles.mapStatLabel}>평균 식대</Text>
            <Text style={styles.mapStatValue}>{formatManWon(selectedData.meal.average, 1)}</Text>
          </View>
          <View style={styles.mapStatItem}>
            <Text style={styles.mapStatLabel}>평균 대관비</Text>
            <Text style={styles.mapStatValue}>{formatManWon(selectedData.rental.average)}</Text>
          </View>
          <View style={styles.mapStatItem}>
            <Text style={styles.mapStatLabel}>표본</Text>
            <Text style={styles.mapStatValue}>{sampleCountText}건</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.estimateInputToggle}
          onPress={openEstimateInputSheet}
          activeOpacity={0.86}
        >
          <View>
            <Text style={styles.estimateInputToggleTitle}>내 견적 입력하기</Text>
            <Text style={styles.estimateInputToggleSub}>받은 견적을 넣고 지역 평균과 비교해요</Text>
          </View>
          <Ionicons
            name="create-outline"
            size={19}
            color={TossColors.primary}
          />
        </TouchableOpacity>

        <View style={styles.priceBandList}>
          <View style={styles.priceBandRow}>
            <Text style={styles.priceBandLabel}>낮은 편</Text>
            <Text style={styles.priceBandValue}>하위 25% {formatManWon(selectedData.contract.p25)}</Text>
          </View>
          <View style={styles.priceBandRow}>
            <Text style={styles.priceBandLabel}>중간값</Text>
            <Text style={styles.priceBandValue}>{formatManWon(selectedData.contract.median)}</Text>
          </View>
          <View style={styles.priceBandRow}>
            <Text style={styles.priceBandLabel}>높은 편</Text>
            <Text style={styles.priceBandValue}>상위 25% {formatManWon(selectedData.contract.p75)}</Text>
          </View>
          <View style={styles.priceBandRowLast}>
            <Text style={styles.priceBandLabel}>상위권</Text>
            <Text style={styles.priceBandValue}>상위 10% {formatManWon(selectedData.contract.p90)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    <Modal
      visible={showEstimateInputSheet}
      transparent
      animationType="none"
      onRequestClose={closeEstimateInputSheet}
    >
      <View style={styles.sheetOverlay}>
        <Animated.View style={[styles.sheetBackdrop, { opacity: inputBackdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={estimateInputStep === 4 ? undefined : closeEstimateInputSheet}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.estimateSheetCard,
            inputKeyboardLift > 0 && styles.estimateSheetCardKeyboard,
            {
              marginBottom: inputKeyboardLift,
              transform: [{ translateY: inputSheetTranslateY }],
            },
          ]}
        >
          <View style={styles.sheetDragZone} {...inputSheetPanResponder.panHandlers}>
            <View style={styles.sheetHandle} />
          </View>

          {estimateInputStep === 0 && (
            <>
              <View style={styles.estimateSheetHeader}>
                <View style={styles.estimateStepBadge}>
                  <Text style={styles.estimateStepBadgeText}>1/4</Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetClose}
                  onPress={closeEstimateInputSheet}
                  activeOpacity={0.82}
                >
                  <Ionicons name="close" size={18} color={TossColors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.estimateQuestionTitle}>어디에서 웨딩하시나요?</Text>
              <Text style={styles.estimateQuestionHelper}>
                선택한 지역의 공식 가격정보 표본으로 내 견적을 비교합니다.
              </Text>

              <View style={styles.estimateRegionGrid}>
                {estimateSelectableRegions.map((item) => {
                  const active = selectedRegion === item.region;
                  return (
                    <TouchableOpacity
                      key={item.region}
                      style={[styles.estimateRegionChip, active && styles.estimateRegionChipActive]}
                      onPress={() => {
                        setSelectedRegion(item.region);
                        setShowResult(false);
                      }}
                      activeOpacity={0.86}
                    >
                      <Text style={[styles.estimateRegionChipText, active && styles.estimateRegionChipTextActive]}>
                        {item.region.replace('서울(', '서울 ').replace(')', '')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.estimateProgressRow}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.estimateProgressDot,
                      index <= estimateInputStep && styles.estimateProgressDotActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.estimateSheetButton}
                onPress={handleEstimateNext}
                activeOpacity={0.88}
              >
                <Text style={styles.estimateSheetButtonText}>다음</Text>
              </TouchableOpacity>
            </>
          )}

          {estimateInputStep >= 1 && estimateInputStep <= 3 && (
            <>
              <View style={styles.estimateSheetHeader}>
                <View style={styles.estimateHeaderLeft}>
                  <TouchableOpacity
                    style={styles.estimateBackButton}
                    onPress={handleEstimateBack}
                    activeOpacity={0.82}
                  >
                    <Ionicons name="chevron-back" size={18} color={TossColors.text.primary} />
                  </TouchableOpacity>
                  <View style={styles.estimateStepBadge}>
                    <Text style={styles.estimateStepBadgeText}>{estimateInputStep + 1}/4</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.sheetClose}
                  onPress={closeEstimateInputSheet}
                  activeOpacity={0.82}
                >
                  <Ionicons name="close" size={18} color={TossColors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.estimateQuestionTitle}>{activeEstimateInputConfig.title}</Text>
              <Text style={styles.estimateQuestionHelper}>{activeEstimateInputConfig.helper}</Text>

              <View style={styles.estimateInputBox}>
                <TextInput
                  value={activeEstimateInputConfig.value}
                  onChangeText={(value) => {
                    activeEstimateInputConfig.onChangeText(value);
                    setShowResult(false);
                  }}
                  keyboardType={activeEstimateInputConfig.keyboardType}
                  placeholder={activeEstimateInputConfig.placeholder}
                  placeholderTextColor={TossColors.gray[400]}
                  style={styles.estimateSheetInput}
                  selectTextOnFocus
                  autoFocus
                  returnKeyType={estimateInputStep === 3 ? 'done' : 'next'}
                  onSubmitEditing={handleEstimateNext}
                />
                <Text style={styles.estimateInputUnit}>{activeEstimateInputConfig.unit}</Text>
              </View>

              <View style={styles.estimateProgressRow}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.estimateProgressDot,
                      index <= estimateInputStep && styles.estimateProgressDotActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.estimateSheetButton,
                  !canProceedEstimate && styles.estimateSheetButtonDisabled,
                ]}
                onPress={handleEstimateNext}
                disabled={!canProceedEstimate}
                activeOpacity={0.88}
              >
                <Text style={styles.estimateSheetButtonText}>
                  {estimateInputStep === 3 ? '견적 보기' : '다음'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {estimateInputStep === 4 && (
            <View style={styles.estimateLoadingWrap}>
              <LottieView
                source={ESTIMATE_LOADING_LOTTIE}
                autoPlay
                loop
                speed={1.5}
                style={styles.estimateLoadingLottie}
              />
              <Text style={styles.estimateLoadingTitle}>견적을 비교하고 있어요</Text>
              <Text style={styles.estimateLoadingText}>
                {selectedRegion} 공식 표본 {sampleCountText}건과 입력한 견적을 대조 중입니다
              </Text>
            </View>
          )}

          {estimateInputStep === 5 && (
            <>
              <View style={styles.estimateSheetHeader}>
                <View>
                  <Text style={styles.sheetEyebrow}>{selectedRegion} · {sampleCountText}건 기준</Text>
                  <Text style={styles.sheetTitle}>내 견적 결과</Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetClose}
                  onPress={closeEstimateInputSheet}
                  activeOpacity={0.82}
                >
                  <Ionicons name="close" size={18} color={TossColors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.estimateResultHero}>
                <Text style={styles.estimateResultLabel}>예상 총 계약금액</Text>
                <Text style={styles.estimateResultAmount}>{formatManWon(contractTotal)}</Text>
                <View style={styles.estimateResultBadge}>
                  <Text style={styles.estimateResultBadgeText}>
                    {estimateMood} · {percentileCopy.title}
                  </Text>
                </View>
                <Text style={styles.estimateResultDetail}>{percentileCopy.detail}</Text>
              </View>

              <View style={styles.sheetMeterTrack}>
                <View style={[styles.sheetMeterFill, { width: `${percentilePosition}%` }]} />
                <View style={[styles.sheetMeterDot, { left: `${percentilePosition}%` }]} />
              </View>
              <View style={styles.sheetMeterLabels}>
                <Text style={styles.sheetMeterLabel}>저렴</Text>
                <Text style={styles.sheetMeterLabel}>중간</Text>
                <Text style={styles.sheetMeterLabel}>비쌈</Text>
              </View>

              <View style={styles.estimateResultRows}>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetRowLabel}>지역 중간값</Text>
                  <Text style={styles.sheetRowValue}>{formatManWon(selectedData.contract.median)}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetRowLabel}>중간값 대비</Text>
                  <Text style={styles.sheetRowValue}>{contractDiffText}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.sheetRowLabel}>입력 내역</Text>
                  <Text style={styles.sheetRowValue}>
                    대관 {formatManWon(rental)} · 식대 {formatManWon(meal, 1)} · {guests}명
                  </Text>
                </View>
                <View style={styles.sheetRowLast}>
                  <Text style={styles.sheetRowLabel}>먼저 볼 항목</Text>
                  <Text style={styles.sheetRowValue}>{strongest ? strongest.label : '총 계약금액'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.estimateSheetButton}
                onPress={() => setEstimateInputStep(0)}
                activeOpacity={0.88}
              >
                <Text style={styles.estimateSheetButtonText}>다시 입력하기</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
    <Modal
      visible={showResult}
      transparent
      animationType="none"
      onRequestClose={closeResultSheet}
    >
      <View style={styles.sheetOverlay}>
        <Animated.View style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeResultSheet}
          />
        </Animated.View>
        <Animated.View style={[styles.sheetCard, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={styles.sheetDragZone} {...sheetPanResponder.panHandlers}>
            <View style={styles.sheetHandle} />
          </View>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>{selectedRegion} · {sampleCountText}건 기준</Text>
              <Text style={styles.sheetTitle}>견적 결과</Text>
            </View>
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={closeResultSheet}
              activeOpacity={0.82}
            >
              <Ionicons name="close" size={18} color={TossColors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetEvidenceCard}>
            <View style={styles.sheetEvidenceIcon}>
              <Ionicons name="server-outline" size={18} color={TossColors.primary} />
            </View>
            <View style={styles.sheetEvidenceTextWrap}>
              <Text style={styles.sheetEvidenceTitle}>공식 가격정보 {sampleCountText}건 기반</Text>
              <Text style={styles.sheetEvidenceText}>
                2026년 4월 예식장 품목별 가격정보 중 {selectedRegion} 표본으로 비교했어요
              </Text>
            </View>
          </View>

          <View style={styles.sheetSummaryCard}>
            <View style={styles.sheetSummaryTop}>
              <View>
                <Text style={styles.sheetAmountLabel}>예상 총 계약금액</Text>
                <Text style={styles.sheetAmount}>{formatManWon(contractTotal)}</Text>
              </View>
              <View style={styles.sheetPercentBadge}>
                <Text style={styles.sheetPercentBadgeText}>{percentileCopy.title}</Text>
              </View>
            </View>
            <Text style={styles.sheetAmountSub}>대관비 {formatManWon(rental)} + 식대 {formatManWon(baseMealTotal)}</Text>
            <View style={styles.sheetMeterTrack}>
              <View style={[styles.sheetMeterFill, { width: `${percentilePosition}%` }]} />
              <View style={[styles.sheetMeterDot, { left: `${percentilePosition}%` }]} />
            </View>
            <View style={styles.sheetMeterLabels}>
              <Text style={styles.sheetMeterLabel}>낮음</Text>
              <Text style={styles.sheetMeterLabel}>중간</Text>
              <Text style={styles.sheetMeterLabel}>높음</Text>
            </View>
            <Text style={styles.sheetPercentDetail}>{percentileCopy.detail}</Text>
          </View>

          <View style={styles.sheetRows}>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetRowLabel}>지역 중간값</Text>
              <Text style={styles.sheetRowValue}>{formatManWon(selectedData.contract.median)}</Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetRowLabel}>중간값 대비</Text>
              <Text style={styles.sheetRowValue}>{contractDiffText}</Text>
            </View>
            <View style={styles.sheetRow}>
              <Text style={styles.sheetRowLabel}>보증 10명 조정</Text>
              <Text style={styles.sheetRowValue}>약 {formatManWon(saveByTenGuests)} 변동</Text>
            </View>
            <View style={styles.sheetRowLast}>
              <Text style={styles.sheetRowLabel}>먼저 확인할 항목</Text>
              <Text style={styles.sheetRowValue}>{strongest ? strongest.label : '총 계약금액'}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
    </>
  );
}

function ThemePicker({ active, onChange }) {
  return (
    <View style={themePickerStyles.wrap}>
      <Text style={themePickerStyles.label}>디자인 테마 · 탭해서 미리보기</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={themePickerStyles.row}
      >
        {THEMES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[themePickerStyles.chip, active === t.id && themePickerStyles.chipActive]}
            onPress={() => onChange(t.id)}
            activeOpacity={0.85}
          >
            <Text style={themePickerStyles.chipIcon}>{t.icon}</Text>
            <Text style={[themePickerStyles.chipText, active === t.id && themePickerStyles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const themePickerStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B95A1',
    letterSpacing: 1,
    marginBottom: 6,
    paddingLeft: 2,
  },
  row: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  chipActive: {
    backgroundColor: '#191F28',
    borderColor: '#191F28',
  },
  chipIcon: { fontSize: 13 },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4E5968',
  },
  chipTextActive: { color: '#FFFFFF' },
});

// 크레딧 뱃지 컴포넌트
function CreditBadge({ balance, onPress, compact }) {
  const low = balance <= 2;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        creditBadgeStyles.wrap,
        low && creditBadgeStyles.wrapLow,
        compact && creditBadgeStyles.wrapCompact,
      ]}
    >
      <Ionicons
        name="diamond-outline"
        size={compact ? 13 : 14}
        color={low ? TossColors.error : TossColors.primary}
      />
      <Text style={[creditBadgeStyles.text, low && creditBadgeStyles.textLow]}>
        {balance}
      </Text>
      {!compact && (
        <Text style={[creditBadgeStyles.sub, low && creditBadgeStyles.textLow]}>
          크레딧
        </Text>
      )}
    </TouchableOpacity>
  );
}

const creditBadgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: TossColors.primaryLight,
    borderRadius: 14,
  },
  wrapCompact: { paddingHorizontal: 8, paddingVertical: 4 },
  wrapLow: { backgroundColor: '#FFEDED' },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.primary,
  },
  sub: {
    fontSize: 11,
    color: TossColors.primary,
    fontWeight: '500',
  },
  textLow: { color: TossColors.error },
});

export default function GuideScreenToss({ navigation, userInfo, session, isAuthenticated }) {
  const canUseAccountFeatures = isAuthenticated !== false && !userInfo?.isGuest;
  const [activeMainTab, setActiveMainTab] = useState('guide');
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [activeTheme, setActiveTheme] = useState('toss'); // 'toss' | 'character' | 'magazine' | 'dashboard'
  const [displayedHostFAQ, setDisplayedHostFAQ] = useState([]);
  const [displayedParticipantFAQ, setDisplayedParticipantFAQ] = useState([]);
  const [currentHostTip, setCurrentHostTip] = useState('');
  const [currentParticipantTip, setCurrentParticipantTip] = useState('');
  const [aiStatus, setAiStatus] = useState({
    balance: 0,
    budgetFreeAvailable: true,
    moneyFreeAvailable: true,
  });

  // 주최자 꿀팁 데이터
  const hostTips = [
    '평균 준비 기간은 결혼식 6개월, 장례식은 즉시 진행됩니다',
    '결혼식 예산의 40%는 웨딩홀, 30%는 스드메에 배정하세요',
    '청첩장은 예식 2개월 전에 발송하는 것이 적절합니다',
    '웨딩홀 예약은 최소 6개월 전에 하는 것이 안전합니다',
    '상조회사는 충분히 비교해보고 신중하게 선택하세요',
    '장례식장은 접근성을 최우선으로 고려하세요',
    '부주금 관리는 엑셀로 정리하면 나중에 편합니다',
    '결혼식 리허설은 꼭 1주일 전에 진행하세요',
    '비수기(11-2월)에는 20-30% 할인 혜택이 있습니다',
    '답례품은 실용적인 것으로 준비하는 것이 좋습니다',
    '사진 촬영은 날씨를 고려해 실내외 모두 준비하세요',
    '하객 수는 예상의 90% 정도로 계산하는 것이 정확합니다',
  ];

  // 참여자 꿀팁 데이터
  const participantTips = [
    '축의금은 관계와 나이를 고려해 결정하세요',
    '결혼식에는 밝은 색상의 옷을 입어도 좋습니다',
    '장례식 조의금은 홀수로 준비하는 것이 관례입니다',
    '예식장 도착은 시작 15분 전이 적절합니다',
    '검은색 정장은 경조사 필수 복장입니다',
    '부조금 봉투는 미리 준비해두면 편합니다',
    '온라인 송금도 요즘은 일반적으로 받아들여집니다',
    '임신 중이거나 영유아 동반 시 미리 양해를 구하세요',
    '조문은 오전 11시-오후 8시가 적절한 시간입니다',
    '화환보다는 현금이 실질적으로 도움이 됩니다',
    '못 가게 되면 미리 연락하고 축의금만 보내도 됩니다',
    '장례식장에서는 향수를 자제하는 것이 예의입니다',
  ];

  // Fisher-Yates 셔플 알고리즘으로 랜덤 선택
  const getRandomFAQ = (data, count = 6) => {
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  };


  // 다른 탭으로 이동하면 역할 선택 화면으로 리셋 (blur 이벤트만 사용 — focus 루프 방지)
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => {
      setSelectedUserType(null);
    });
    return unsub;
  }, [navigation]);

  // 화면 포커스 시 랜덤 데이터 생성 및 하드웨어 뒤로가기 처리
  useFocusEffect(
    React.useCallback(() => {
      // 랜덤 FAQ 생성
      const randomHostFAQ = getRandomFAQ(allHostQuickAnswers);
      const randomParticipantFAQ = getRandomFAQ(allParticipantQuickAnswers);
      
      console.log('🎲 주최자 FAQ 랜덤 생성:', randomHostFAQ.slice(0, 3).map(q => q.question));
      console.log('🎲 참여자 FAQ 랜덤 생성:', randomParticipantFAQ.slice(0, 3).map(q => q.question));
      
      setDisplayedHostFAQ(randomHostFAQ);
      setDisplayedParticipantFAQ(randomParticipantFAQ);
      
      // 랜덤 꿀팁 선택
      const randomHostTip = hostTips[Math.floor(Math.random() * hostTips.length)];
      const randomParticipantTip = participantTips[Math.floor(Math.random() * participantTips.length)];
      
      console.log('🎯 주최자 꿀팁:', randomHostTip);
      console.log('🎯 참여자 꿀팁:', randomParticipantTip);
      
      setCurrentHostTip(randomHostTip);
      setCurrentParticipantTip(randomParticipantTip);

      // AI 크레딧 상태 로드
      getAiStatus().then((status) => {
        if (status?.success) {
          setAiStatus({
            balance: status.balance,
            budgetFreeAvailable: status.budgetFreeAvailable,
            moneyFreeAvailable: status.moneyFreeAvailable,
          });
        }
      });

      // Android에서만 동작하는 하드웨어 뒤로가기 버튼 처리
      if (Platform.OS === 'android') {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
          if (activeMainTab === 'cost') {
            setActiveMainTab('guide');
            return true;
          }
          // 사용자 타입이 선택된 상태에서 뒤로가기를 누르면
          if (selectedUserType) {
            // 선택 화면으로 돌아가기
            setSelectedUserType(null);
            return true; // 이벤트 처리됨 (기본 동작 방지)
          }
          // 선택 화면에서는 기본 동작 (다른 탭으로 이동 허용)
          return false;
        });

        // cleanup
        return () => backHandler.remove();
      }
    }, [activeMainTab, selectedUserType])
  );

  // 사용자 타입 선택 데이터 - 토스 스타일로 수정
  const userTypes = [
    {
      id: 'host',
      title: '행사를 준비해요',
      subtitle: '결혼식·장례식 주최자',
      icon: 'calendar-outline',
    },
    {
      id: 'participant',
      title: '행사에 참석해요',
      subtitle: '하객·조문객',
      icon: 'people-outline',
    },
  ];

  // 주최자용 가이드 - 토스 스타일로 수정
  const hostGuideCategories = [
    {
      id: 'wedding-prep',
      title: '결혼식 준비',
      subtitle: '체크리스트와 준비 일정',
      icon: 'heart-outline',
      screen: 'WeddingPrepGuide',
      isNew: true,
    },
    {
      id: 'funeral-prep',
      title: '장례식 준비',
      subtitle: '절차와 준비사항',
      icon: 'flower-outline',
      screen: 'FuneralPrepGuide',
    },
  ];

  // 참여자용 가이드 - 토스 스타일로 수정
  const participantGuideCategories = [
    {
      id: 'money',
      title: '축의금·조의금',
      subtitle: 'AI가 추천하는 적정 금액',
      icon: 'cash-outline',
      screen: 'MoneyGuide',
      isAi: true,
      aiFeature: 'money',
      aiCost: AI_COST.money,
    },
    {
      id: 'manner',
      title: '복장 가이드',
      subtitle: '상황별 올바른 복장',
      icon: 'shirt-outline',
      screen: 'MannerGuide',
    },
    {
      id: 'etiquette',
      title: '예절·매너',
      subtitle: '꼭 알아야 할 예절',
      icon: 'book-outline',
      screen: 'EtiquetteGuide',
    },
  ];

  // 전체 FAQ 데이터 - 참여자용
  const allParticipantQuickAnswers = [
    {
      question: '부조금 봉투에 이름 어떻게 써요?',
      answer: '한자 또는 한글 정자체로 세로 작성',
      icon: '✍️',
    },
    {
      question: '결혼식 당일 축의금 언제 전달해요?',
      answer: '입장 시 접수대에서 방명록 작성 후',
      icon: '💌',
    },
    {
      question: '장례식장 조문 시간은 언제가 좋아요?',
      answer: '오전 11시~오후 8시가 적절',
      icon: '🕐',
    },
    {
      question: '임신 중인데 장례식장 가도 되나요?',
      answer: '가급적 피하거나 짧게 조문',
      icon: '🤰',
    },
    {
      question: '못 가게 됐을 때 축의금만 보내도 되나요?',
      answer: '계좌이체나 지인 통해 전달 가능',
      icon: '📱',
    },
    {
      question: '재혼이나 삼혼 축의금도 똑같나요?',
      answer: '초혼의 70~80% 수준이 일반적',
      icon: '💑',
    },
    {
      question: '코로나 시대 경조사 예절이 바뀔었나요?',
      answer: '비대면 참석, 마스크 대사 증가',
      icon: '😷',
    },
    {
      question: '결혼식에 아이와 함께 가도 될까요?',
      answer: '사전 허락 후 조용히 참석',
      icon: '👶',
    },
    {
      question: '온라인 축의금 송금은 언제 하나요?',
      answer: '예식 당일 오전까지 권장',
      icon: '📱',
    },
    {
      question: '예식장 주차는 어떻게 하나요?',
      answer: '미리 도착 또는 대중교통 이용',
      icon: '🏎️',
    },
    {
      question: '여름 결혼식 복장은 어떻게 하나요?',
      answer: '시원한 소재, 무릎 아래 길이',
      icon: '☀️',
    },
    {
      question: '결혼식 사진 촬영 예절은?',
      answer: '전문사진사 방해 금지, 플래시 자제',
      icon: '📷',
    },
    {
      question: '장례식장 복장과 메이크업은?',
      answer: '검은색 정장, 진한 화장 피하기',
      icon: '🕶️',
    },
    {
      question: '빈소에서 향을 피우는 방법은?',
      answer: '3개 집어 촛불에 점화 후 손으로 끌기',
      icon: '🕯️',
    },
    {
      question: '조문할 때 하지 말아야 할 말은?',
      answer: '"어떻게 돌아가셨어요?", "왜 이렇게 일찍.." 금기',
      icon: '🤐',
    },
    {
      question: '결혼식 중 울거나 감정이 북받칠 때는?',
      answer: '조용히 휴지로 닦기, 과도하게 울지 않기',
      icon: '😭',
    },
    {
      question: '주차가 어려운 예식장은 어떻게?',
      answer: '지하철/버스 또는 카풀 활용',
      icon: '🚇',
    },
  ];

  // 전체 FAQ 데이터 - 주최자용  
  const allHostQuickAnswers = [
    {
      question: '결혼식 예산은 얼마나 준비해야 하나요?',
      answer: '평균 3000~5000만원 (지역별 차이)',
      icon: '💰',
    },
    {
      question: '청첩장은 언제 보내는게 좋아요?',
      answer: '결혼식 2개월 전 발송 권장',
      icon: '💌',
    },
    {
      question: '예식장 예약은 언제 해야 하나요?',
      answer: '최소 6개월 전 예약 필수',
      icon: '🏛️',
    },
    {
      question: '부주 받은 금액 관리는 어떻게?',
      answer: '방명록과 함께 엑셀로 정리',
      icon: '📊',
    },
    {
      question: '장례식장 선택 기준은 뭔가요?',
      answer: '접근성, 시설, 가격 순으로 고려',
      icon: '🏥',
    },
    {
      question: '상조회사 가입이 필수인가요?',
      answer: '선택사항, 장단점 비교 후 결정',
      icon: '📋',
    },
    {
      question: '웨딩드레스는 언제 정해야 하나요?',
      answer: '최소 4-6개월 전 예약 및 시착',
      icon: '👰',
    },
    {
      question: '빈소 차리는 방법을 알려주세요',
      answer: '영정 사진 가운데, 제단과 상차림 앞쪽',
      icon: '🏺',
    },
    {
      question: '장례 기간은 며칠이 적당한가요?',
      answer: '3일장이 가장 일반적, 5일장은 여유 있게',
      icon: '📅',
    },
    {
      question: '화장과 매장 중 어떻게 선택하나요?',
      answer: '경제적 부담, 관리 편의성, 고인 의향 고려',
      icon: '⚰️',
    },
    {
      question: '웨딩 케이크는 어떻게 준비하나요?',
      answer: '1-2개월 전 주문, 맛보기 예약 필수',
      icon: '🎂',
    },
    {
      question: '리허설은 언제 어떻게 하나요?',
      answer: '예식 1주일 전 또는 전날, 주례와 가족 참석',
      icon: '🎬',
    },
    {
      question: '혼수는 어떻게 준비해야 하나요?',
      answer: '3-4개월 전부터 신혼집 구조 확정 후',
      icon: '🏠',
    },
    {
      question: '웨딩 플래너가 필요한가요?',
      answer: '처음 준비 또는 시간 부족 시 추천',
      icon: '📉',
    },
    {
      question: '예식 당일 준비사항은?',
      answer: '헤어메이크업 4시간 전, 결혼반지 확인',
      icon: '💍',
    },
    {
      question: '날씨가 안 좋을 때 대비책은?',
      answer: '하객용 우산, 실내 촬영 장소 확보',
      icon: '☔',
    },
    {
      question: '신혼집 준비는 언제부터 해야 하나요?',
      answer: '전세/매매는 6개월 전, 임대는 3개월 전',
      icon: '🏡',
    },
  ];

  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType);
  };

  const handleBackToSelection = () => {
    setSelectedUserType(null);
  };

  const handleCategoryPress = (category) => {
    navigation.navigate(category.screen);
  };

  // ──────────────────────────────────────────────
  // 미니멀 테마 단일 렌더 — 상단 헤더(경조사 가이드 + 크레딧) + Minimal
  // ──────────────────────────────────────────────
  const headerTitle = selectedUserType
    ? selectedUserType === 'host'
      ? '주최자 가이드'
      : '참여자 가이드'
    : activeMainTab === 'cost'
      ? '예식비 진단'
      : '경조사 가이드';

  const handleMainTabChange = (tab) => {
    setActiveMainTab(tab);
    if (tab === 'cost') {
      setSelectedUserType(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {(activeMainTab === 'cost' || !selectedUserType) && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={{ flex: 1 }} />
          {canUseAccountFeatures && (
            <CreditBadge
              balance={aiStatus.balance}
              onPress={() => navigation.navigate('Credit')}
              compact
            />
          )}
        </View>
      )}
      {(activeMainTab === 'cost' || !selectedUserType) && (
        <GuideTopTabs active={activeMainTab} onChange={handleMainTabChange} />
      )}
      {activeMainTab === 'cost' ? (
        <WeddingCostDiagnosis />
      ) : (
        <GuideThemeMinimal
          navigation={navigation}
          userTypes={userTypes}
          hostCategories={hostGuideCategories}
          participantCategories={participantGuideCategories}
          hostTips={hostTips}
          participantTips={participantTips}
          aiStatus={aiStatus}
          AI_COST={AI_COST}
          selectedUserType={selectedUserType}
          setSelectedUserType={setSelectedUserType}
          onCreditPress={canUseAccountFeatures ? () => navigation.navigate('Credit') : undefined}
        />
      )}
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TossColors.background,
  },
  
  // 헤더 - 다른 탭(내 경조사, 프로필)과 일치하는 좌측 정렬 큰 타이틀
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerBackBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#191F28',
    letterSpacing: -0.5,
  },
  mainTabWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 4,
    backgroundColor: '#F2F4F6',
    borderRadius: 14,
  },
  mainTabButton: {
    flex: 1,
    height: 40,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mainTabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 1 },
    }),
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  mainTabTextActive: {
    color: TossColors.text.primary,
  },
  costRoot: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  costScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 56,
  },
  costSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TossColors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  regionChipRow: {
    gap: 8,
    paddingRight: 20,
    paddingBottom: 16,
  },
  regionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  regionChipActive: {
    backgroundColor: '#191F28',
    borderColor: '#191F28',
  },
  regionChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  regionChipTextActive: {
    color: '#FFFFFF',
  },
  costCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  costCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  costCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TossColors.text.primary,
    letterSpacing: -0.4,
  },
  costCardSub: {
    fontSize: 12,
    fontWeight: '600',
    color: TossColors.text.secondary,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  costSourceBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: TossColors.primary,
    backgroundColor: TossColors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  costStepper: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  costStepperHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  costStepperLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  costStepperHelper: {
    fontSize: 11,
    fontWeight: '600',
    color: TossColors.text.secondary,
    letterSpacing: -0.1,
    marginTop: 3,
  },
  costStepperStep: {
    fontSize: 11,
    fontWeight: '800',
    color: TossColors.primary,
    backgroundColor: TossColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  costStepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  costStepButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  costValueWrap: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  costValueInput: {
    minWidth: 34,
    textAlign: 'right',
    fontSize: 22,
    fontWeight: '900',
    color: TossColors.text.primary,
    paddingVertical: 0,
    letterSpacing: -0.5,
  },
  costValueUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: TossColors.text.secondary,
    marginLeft: 3,
    letterSpacing: -0.2,
  },
  costCalculateButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#191F28',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  costCalculateButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inputBox: {
    width: (width - 70) / 2,
    backgroundColor: '#F7F8FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  inputBoxWide: {
    width: '100%',
    backgroundColor: '#F7F8FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: TossColors.text.secondary,
    letterSpacing: -0.1,
    marginBottom: 5,
  },
  costInput: {
    fontSize: 22,
    fontWeight: '800',
    color: TossColors.text.primary,
    paddingVertical: 0,
    letterSpacing: -0.5,
  },
  resultCard: {
    backgroundColor: '#191F28',
    borderRadius: 22,
    padding: 20,
    marginBottom: 12,
  },
  resultEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8BB8FF',
    letterSpacing: 0.3,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  resultAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  resultSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1D6DB',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  percentCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 15,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  percentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B95A1',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  percentTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.7,
    marginBottom: 4,
  },
  percentDetail: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B0B8C1',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  resultDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 16,
  },
  simpleBreakdown: {
    gap: 10,
  },
  simpleBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  simpleBreakdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A1',
    letterSpacing: -0.2,
  },
  simpleBreakdownValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  diagnosisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 14,
  },
  diagnosisLeft: {
    flex: 1,
  },
  diagnosisLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B0B8C1',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  diagnosisValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  diagnosisRight: {
    alignItems: 'flex-end',
    maxWidth: 150,
  },
  costTonePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 5,
  },
  costToneGreen: {
    backgroundColor: '#DCFCE7',
  },
  costToneBlue: {
    backgroundColor: '#E6F0FF',
  },
  costToneOrange: {
    backgroundColor: '#FEF3C7',
  },
  costToneRed: {
    backgroundColor: '#FEE2E2',
  },
  costToneMuted: {
    backgroundColor: '#E5E8EB',
  },
  costToneText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: -0.2,
  },
  costToneTextMuted: {
    color: TossColors.text.secondary,
  },
  diagnosisDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B95A1',
    textAlign: 'right',
    lineHeight: 15,
    letterSpacing: -0.1,
  },
  costInsightText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text.secondary,
    lineHeight: 22,
    letterSpacing: -0.2,
    marginTop: 10,
  },
  focusList: {
    marginTop: 14,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  focusItemLast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 13,
  },
  focusIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCopy: {
    flex: 1,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  focusText: {
    fontSize: 13,
    fontWeight: '600',
    color: TossColors.text.secondary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  savingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: TossColors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  savingText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: TossColors.primary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  regionMapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    marginHorizontal: -8,
  },
  regionMapHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  regionMapTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.4,
  },
  regionMapSub: {
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.text.secondary,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  regionMapBadge: {
    backgroundColor: TossColors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  regionMapBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: TossColors.primary,
    letterSpacing: -0.1,
  },
  koreaMapBox: {
    width: '100%',
    height: Math.min(650, Math.max(560, (width - 40) * 1.56)),
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  mapPricePanel: {
    backgroundColor: '#191F28',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    height: 116,
  },
  mapPriceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    height: 42,
  },
  mapPriceMain: {
    flex: 1,
    minWidth: 0,
  },
  mapPriceRegion: {
    fontSize: 12,
    fontWeight: '900',
    color: '#8BB8FF',
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  mapPriceAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.7,
  },
  mapPriceSample: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B0B8C1',
    letterSpacing: -0.1,
    flexShrink: 0,
  },
  seoulPriceSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    height: 34,
  },
  seoulPriceSelectorChip: {
    flex: 1,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seoulPriceSelectorChipActive: {
    backgroundColor: '#FFFFFF',
  },
  seoulPriceSelectorText: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: -0.2,
  },
  seoulPriceSelectorTextActive: {
    color: TossColors.primary,
  },
  mapPriceInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    height: 34,
  },
  mapPriceInfoChip: {
    flex: 1,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  mapPriceInfoLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.58)',
    letterSpacing: -0.1,
    marginBottom: 1,
  },
  mapPriceInfoValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  mapStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  mapStatItem: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    borderRadius: 14,
    padding: 12,
  },
  mapStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: TossColors.text.secondary,
    letterSpacing: -0.1,
    marginBottom: 5,
  },
  mapStatValue: {
    fontSize: 15,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  estimateInputToggle: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: TossColors.primaryLight,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  estimateInputToggleTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: TossColors.primary,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  estimateInputToggleSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F7FD5',
    letterSpacing: -0.1,
  },
  inlineEstimateCard: {
    backgroundColor: '#F7F8FA',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  estimateSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    minHeight: 360,
    maxHeight: '82%',
  },
  estimateSheetCardKeyboard: {
    minHeight: 330,
    maxHeight: '64%',
  },
  estimateSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 12,
  },
  estimateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  estimateBackButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateStepBadge: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: TossColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateStepBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: TossColors.primary,
    letterSpacing: -0.2,
  },
  estimateQuestionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.6,
    lineHeight: 27,
    marginBottom: 7,
  },
  estimateQuestionHelper: {
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.text.secondary,
    lineHeight: 18,
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  estimateRegionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  estimateRegionChip: {
    minWidth: '30%',
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E5E8EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  estimateRegionChipActive: {
    backgroundColor: '#191F28',
    borderColor: '#191F28',
  },
  estimateRegionChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: TossColors.text.secondary,
    letterSpacing: -0.25,
  },
  estimateRegionChipTextActive: {
    color: '#FFFFFF',
  },
  estimateInputBox: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E9EEF5',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  estimateSheetInput: {
    flex: 1,
    fontSize: 23,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -1,
    paddingVertical: 0,
    fontVariant: ['tabular-nums'],
  },
  estimateInputUnit: {
    fontSize: 13,
    fontWeight: '900',
    color: TossColors.text.secondary,
    letterSpacing: -0.3,
    marginLeft: 8,
  },
  estimateProgressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  estimateProgressDot: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: TossColors.gray[200],
  },
  estimateProgressDotActive: {
    backgroundColor: TossColors.primary,
  },
  estimateSheetButton: {
    height: 50,
    borderRadius: 15,
    backgroundColor: TossColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  estimateSheetButtonDisabled: {
    backgroundColor: TossColors.gray[300],
  },
  estimateSheetButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  estimateLoadingWrap: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  estimateLoadingLottie: {
    width: 148,
    height: 148,
    marginBottom: 8,
  },
  estimateLoadingTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  estimateLoadingText: {
    maxWidth: 280,
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  estimateResultHero: {
    backgroundColor: '#F7F8FA',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  estimateResultLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: TossColors.text.secondary,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  estimateResultAmount: {
    fontSize: 29,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -1.1,
    fontVariant: ['tabular-nums'],
    marginBottom: 12,
  },
  estimateResultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#191F28',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  estimateResultBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  estimateResultDetail: {
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.text.secondary,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  estimateResultRows: {
    backgroundColor: '#F7F8FA',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  priceBandList: {
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  priceBandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  priceBandRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  priceBandLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  priceBandValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
  },
  referenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },
  referenceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  referenceHighlight: {
    backgroundColor: '#F7F8FA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  referenceHighlightLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: TossColors.text.secondary,
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  referenceHighlightValue: {
    fontSize: 13,
    fontWeight: '800',
    color: TossColors.text.primary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  referenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  referenceValue: {
    fontSize: 14,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
  },
  referenceNote: {
    fontSize: 11,
    fontWeight: '600',
    color: TossColors.text.tertiary,
    lineHeight: 17,
    letterSpacing: -0.1,
    marginTop: 12,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(25,31,40,0.42)',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '86%',
  },
  sheetDragZone: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#C9CDD2',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  sheetEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: TossColors.primary,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.7,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetEvidenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF5FF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DCEBFF',
  },
  sheetEvidenceIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetEvidenceTextWrap: {
    flex: 1,
  },
  sheetEvidenceTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  sheetEvidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: TossColors.text.secondary,
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  sheetSummaryCard: {
    backgroundColor: '#F7F8FA',
    borderRadius: 24,
    padding: 18,
    marginBottom: 10,
  },
  sheetSummaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  sheetAmountLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TossColors.text.secondary,
    letterSpacing: 0.3,
    marginBottom: 7,
  },
  sheetAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  sheetAmountSub: {
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.text.secondary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  sheetPercentBadge: {
    backgroundColor: '#191F28',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  sheetPercentBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sheetMeterTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E5E8EB',
    marginTop: 18,
    marginBottom: 8,
    overflow: 'visible',
  },
  sheetMeterFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: TossColors.primary,
  },
  sheetMeterDot: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 18,
    marginLeft: -9,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 5,
    borderColor: TossColors.primary,
  },
  sheetMeterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetMeterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TossColors.text.tertiary,
    letterSpacing: -0.1,
  },
  sheetPercentTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: TossColors.text.primary,
    letterSpacing: -0.7,
    marginBottom: 4,
  },
  sheetPercentDetail: {
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.text.secondary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  sheetRows: {
    backgroundColor: '#F7F8FA',
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EB',
  },
  sheetRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 14,
  },
  sheetRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  sheetRowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '900',
    color: TossColors.text.primary,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  headerWithBack: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: TossColors.background,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
    marginTop: Platform.OS === 'ios' ? 0 : STATUSBAR_HEIGHT, // SafeAreaView가 iOS 상단 처리
  },
  backButton: {
    padding: 4,
  },
  headerTitleWithBack: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
  },
  
  // 메인 질문 - 토스 스타일
  mainQuestion: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TossColors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  
  // 역할 선택 - 토스 스타일 플랫 디자인
  roleSelection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TossColors.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: TossColors.gray[200],
  },
  roleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TossColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
  },
  
  // 빠른 답변 - 토스 스타일 (개선된 버전)
  quickSection: {
    marginTop: 32,
  },
  quickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  quickSubtitle: {
    fontSize: 13,
    color: TossColors.text.secondary,
    marginTop: 4,
  },
  quickMore: {
    fontSize: 14,
    color: TossColors.primary,
    fontWeight: '500',
  },
  faqTabSection: {
    marginTop: 8,
  },
  faqTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  faqTabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text.primary,
  },
  faqMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  faqMoreText: {
    fontSize: 12,
    color: TossColors.primary,
    fontWeight: '600',
  },
  quickScroll: {
    paddingLeft: 20,
  },
  quickScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  quickCard: {
    width: 160,
    backgroundColor: TossColors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minHeight: 140,
  },
  quickCardHeader: {
    marginBottom: 12,
  },
  quickIcon: {
    fontSize: 28,
  },
  quickQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
    marginBottom: 8,
    lineHeight: 18,
  },
  quickAnswer: {
    fontSize: 13,
    color: TossColors.text.secondary,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  
  // 정보 카드 - 토스 스타일
  infoCard: {
    marginTop: 24,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TossColors.primaryLight,
    borderRadius: 12,
    padding: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: TossColors.primary,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  
  // 인기 서비스 섹션 - 토스 스타일
  servicesSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  servicesTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceItem: {
    width: (width - 52) / 2, // 2열 그리드
    backgroundColor: TossColors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: TossColors.gray[200],
    alignItems: 'center',
  },
  serviceIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  serviceIcon: {
    fontSize: 32,
  },
  serviceBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotBadge: {
    backgroundColor: TossColors.error,
  },
  newBadge: {
    backgroundColor: TossColors.success,
  },
  preparingServiceBadge: {
    backgroundColor: TossColors.gray[300],
  },
  serviceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: TossColors.background,
    letterSpacing: 0.5,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 12,
    color: TossColors.text.secondary,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  serviceItemDisabled: {
    opacity: 0.6,
  },
  serviceTitleDisabled: {
    color: TossColors.gray[400],
  },
  serviceDescriptionDisabled: {
    color: TossColors.gray[300],
  },
  
  // 메뉴 섹션 - 토스 스타일
  menuSection: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: TossColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TossColors.gray[200],
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.gray[100],
  },
  menuItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TossColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.3,
  },
  menuSubtitle: {
    fontSize: 14,
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  
  // 배지 - 토스 스타일
  newBadge: {
    backgroundColor: TossColors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: TossColors.background,
    letterSpacing: 0.5,
  },
  popularBadge: {
    backgroundColor: TossColors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: TossColors.background,
  },

  // AI 크레딧 뱃지
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: TossColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeFree: {
    backgroundColor: '#E9F8F0',
  },
  aiBadgeIcon: {
    fontSize: 10,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: TossColors.primary,
    letterSpacing: -0.2,
  },
  aiBadgeTextFree: {
    color: TossColors.success,
  },

  // 준비중 스타일
  preparingBadge: {
    backgroundColor: TossColors.gray[300],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  preparingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: TossColors.background,
    letterSpacing: 0.5,
  },
  menuIconDisabled: {
    backgroundColor: TossColors.gray[100],
  },
  menuTitleDisabled: {
    color: TossColors.gray[400],
  },
  menuSubtitleDisabled: {
    color: TossColors.gray[300],
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: TossColors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TossColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TossColors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalDescription: {
    fontSize: 15,
    color: TossColors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  modalButton: {
    width: '100%',
    backgroundColor: TossColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
    letterSpacing: -0.3,
  },
  
  // 하단 카드 - 토스 스타일
  bottomCard: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: TossColors.gray[50],
    borderRadius: 12,
    padding: 20,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TossColors.text.primary,
    letterSpacing: -0.2,
    marginLeft: 8,
  },
  bottomCardRefreshHint: {
    fontSize: 11,
    color: TossColors.text.tertiary,
    fontWeight: '500',
  },
  bottomCardText: {
    fontSize: 14,
    color: TossColors.text.secondary,
    letterSpacing: -0.2,
    lineHeight: 20,
    marginBottom: 16,
  },
  bottomCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
    letterSpacing: -0.2,
  },
});
