import { requireOptionalNativeModule } from 'expo';

// 네이티브 모듈이 없거나 로드 실패 시 null 반환 (앱 크래시 방지)
const DigitalInkRecognitionNative = requireOptionalNativeModule('DigitalInkRecognition');

export interface InkPoint {
  x: number;
  y: number;
  t: number;
}

export type InkStroke = InkPoint[];

export async function isNativeAvailable(): Promise<boolean> {
  return !!DigitalInkRecognitionNative;
}

export async function downloadModel(languageTag: string = 'ko'): Promise<boolean> {
  if (!DigitalInkRecognitionNative) return false;
  return DigitalInkRecognitionNative.downloadModel(languageTag);
}

export async function warmUpRecognizer(languageTag: string = 'ko'): Promise<boolean> {
  if (!DigitalInkRecognitionNative?.warmUpRecognizer) return downloadModel(languageTag);
  return DigitalInkRecognitionNative.warmUpRecognizer(languageTag);
}

export async function recognize(
  strokes: InkStroke[],
  languageTag: string = 'ko'
): Promise<string[]> {
  if (!DigitalInkRecognitionNative) return [];
  return DigitalInkRecognitionNative.recognize(strokes, languageTag);
}

export async function recognizeWithDebug(
  strokes: InkStroke[],
  languageTag: string = 'ko'
): Promise<{
  ok: boolean;
  stage: string;
  languageTag: string;
  resolvedLanguageTag?: string;
  strokeCount: number;
  pointCount: number;
  modelDownloadedBefore?: boolean;
  modelDownloadedAfter?: boolean;
  candidates: string[];
  error?: string;
}> {
  if (!DigitalInkRecognitionNative) {
    return {
      ok: false,
      stage: 'NO_NATIVE',
      languageTag,
      strokeCount: strokes?.length || 0,
      pointCount: (strokes || []).reduce((sum, stroke) => sum + (stroke?.length || 0), 0),
      candidates: [],
      error: 'DigitalInkRecognition native module is not loaded.',
    };
  }
  if (!DigitalInkRecognitionNative.recognizeWithDebug) {
    const candidates = await DigitalInkRecognitionNative.recognize(strokes, languageTag);
    return {
      ok: candidates.length > 0,
      stage: 'LEGACY_RECOGNIZE',
      languageTag,
      strokeCount: strokes?.length || 0,
      pointCount: (strokes || []).reduce((sum, stroke) => sum + (stroke?.length || 0), 0),
      candidates,
    };
  }
  return DigitalInkRecognitionNative.recognizeWithDebug(strokes, languageTag);
}

export async function recognizeImage(imageUri: string): Promise<string[]> {
  if (!DigitalInkRecognitionNative) return [];
  if (!DigitalInkRecognitionNative.recognizeImage) return [];
  return DigitalInkRecognitionNative.recognizeImage(imageUri);
}
