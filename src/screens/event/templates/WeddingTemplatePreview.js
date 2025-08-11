// src/screens/event/templates/WeddingTemplatePreview.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 분리된 템플릿들 import
import ModernDarkTemplate from './wedding/ModernDarkTemplate';
import KoreanElegantTemplate from './wedding/KoreanElegantTemplate';
import VintageAppTemplate from './wedding/VintageAppTemplate';
import RomanticPinkTemplate from './wedding/RomanticPinkTemplate'; // 추가된 import

// 메인 렌더링 컴포넌트
export default function WeddingTemplatePreview({ 
  template, 
  eventData, 
  userImages, 
  categorizedImages,
  allowMessages,
  messageSettings 
}) {
  console.log('🔍 [MAIN COMPONENT] 입력 파라미터:', {
    template: template?.style || 'undefined',
    eventData: !!eventData,
    userImages: userImages?.length || 0,
    categorizedImages: !!categorizedImages,
    allowMessages: allowMessages,
    messageSettings: !!messageSettings
  });

  // template이 undefined인 경우 대비
  if (!template || !template.style) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>템플릿을 선택해주세요.</Text>
      </View>
    );
  }

  // 공통 props 구성
  const commonProps = {
    eventData: eventData || {},
    categorizedImages: categorizedImages,
    allowMessages: allowMessages,
    messageSettings: messageSettings
  };

  // 템플릿 스타일에 따라 해당하는 컴포넌트 렌더링
  switch (template.style) {
    case 'modern-dark': 
      return <ModernDarkTemplate {...commonProps} />;
    case 'romantic-gold': 
      return <KoreanElegantTemplate {...commonProps} />;
    case 'vintage-app': 
      return <VintageAppTemplate {...commonProps} />;
    case 'romantic-pink':  // 추가된 케이스
      return <RomanticPinkTemplate {...commonProps} />;
    default: 
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>지원하지 않는 템플릿입니다: {template.style}</Text>
        </View>
      );
  }
}