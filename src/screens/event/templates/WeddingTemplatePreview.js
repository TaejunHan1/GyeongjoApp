// src/screens/event/templates/WeddingTemplatePreview.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 분리된 템플릿들 import
import ModernDarkTemplate from './wedding/ModernMinimalTemplate';
import ModernMinimalTemplate from './wedding/ElegantGardenTemplate';
import TossStyleTemplate from './wedding/TossStyleTemplate';
import VintageAppTemplate from './wedding/VintageAppTemplate';
import RomanticPinkTemplate from './wedding/RomanticPinkTemplate';
import ElegantGardenTemplate from './wedding/ElegantGardenTemplate';
import ClassicElegantTemplate from './wedding/ClassicElegantTemplate';
import RomanticArchTemplate from './wedding/RomanticArchTemplate';
import EditorialMagazineTemplate from './wedding/EditorialMagazineTemplate';
import TicketFlightTemplate from './wedding/TicketFlightTemplate';
import CinemaTemplate from './wedding/CinemaTemplate';
import RunicRiftTemplate from './wedding/RunicRiftTemplate';
import PhotoBookTemplate from './wedding/PhotoBookTemplate';

// 메인 렌더링 컴포넌트
export default function WeddingTemplatePreview({
  template,
  eventData,
  userImages,
  categorizedImages,
  allowMessages,
  messageSettings,
  isPlaying,
  onTogglePlay,
  playbackProgress,
  selectedPhotoFrame,
  frameAdjusting,
  onPhotoFrameAdjust,
  isPreviewMode,
}) {

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
    messageSettings: messageSettings,
    isPlaying: isPlaying,
    onTogglePlay: onTogglePlay,
    playbackProgress: playbackProgress ?? 0,
    selectedPhotoFrame: selectedPhotoFrame || null,
    frameAdjusting: !!frameAdjusting,
    onPhotoFrameAdjust: onPhotoFrameAdjust,
    isPreviewMode: !!isPreviewMode,
  };

  // 템플릿 스타일에 따라 해당하는 컴포넌트 렌더링
  switch (template.style) {
    case 'modern-dark': 
      return <ModernDarkTemplate {...commonProps} />;
    case 'korean-elegant':
      return <TossStyleTemplate {...commonProps} />;
    case 'vintage-app': 
      return <VintageAppTemplate {...commonProps} />;
    case 'romantic-pink':
      return <RomanticPinkTemplate {...commonProps} />;
    case 'elegant-garden':
      return <ElegantGardenTemplate {...commonProps} />;
    case 'classic-elegant':
      return <ClassicElegantTemplate {...commonProps} />;
    case 'ticket-flight':
      return <TicketFlightTemplate {...commonProps} />;
    case 'cinema-romance':
      return <CinemaTemplate {...commonProps} />;
    case 'runic-rift':
      return <RunicRiftTemplate {...commonProps} />;
    case 'photo-book':
      return <PhotoBookTemplate {...commonProps} />;
    case 'romantic-arch':
      return <RomanticArchTemplate {...commonProps} />;
    case 'editorial-magazine':
      return <EditorialMagazineTemplate {...commonProps} />;
    default:
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>지원하지 않는 템플릿입니다: {template.style}</Text>
        </View>
      );
  }
}
