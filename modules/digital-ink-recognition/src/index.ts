import { requireOptionalNativeModule } from 'expo-modules-core';

// 네이티브 모듈이 없거나 로드 실패 시 null 반환 (앱 크래시 방지)
const DigitalInkRecognitionNative = requireOptionalNativeModule('DigitalInkRecognition');

export interface InkPoint {
  x: number;
  y: number;
  t: number;
}

export type InkStroke = InkPoint[];

export async function downloadModel(languageTag: string = 'ko'): Promise<void> {
  if (!DigitalInkRecognitionNative) return;
  return DigitalInkRecognitionNative.downloadModel(languageTag);
}

export async function recognize(
  strokes: InkStroke[],
  languageTag: string = 'ko'
): Promise<string[]> {
  if (!DigitalInkRecognitionNative) return [];
  return DigitalInkRecognitionNative.recognize(strokes, languageTag);
}

export async function recognizeImage(imageUri: string): Promise<string[]> {
  if (!DigitalInkRecognitionNative) return ['NO_NATIVE'];
  if (!DigitalInkRecognitionNative.recognizeImage) return ['NO_FUNC'];
  return DigitalInkRecognitionNative.recognizeImage(imageUri);
}
