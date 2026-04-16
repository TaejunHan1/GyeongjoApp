package expo.modules.digitalink

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.vision.digitalink.DigitalInkRecognition
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModel
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModelIdentifier
import com.google.mlkit.vision.digitalink.DigitalInkRecognizerOptions
import com.google.mlkit.vision.digitalink.Ink

class DigitalInkRecognitionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DigitalInkRecognition")

    /**
     * 모델 사전 다운로드
     * languageTag: "ko" 등 BCP-47 코드
     */
    AsyncFunction("downloadModel") { languageTag: String, promise: Promise ->
      val modelIdentifier = DigitalInkRecognitionModelIdentifier.fromLanguageTag(languageTag)
      if (modelIdentifier == null) {
        promise.reject("MODEL_ERROR", "지원하지 않는 언어 코드: $languageTag", null)
        return@AsyncFunction
      }
      val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
      RemoteModelManager.getInstance()
        .download(model, DownloadConditions.Builder().build())
        .addOnSuccessListener { promise.resolve(null) }
        .addOnFailureListener { e -> promise.reject("DOWNLOAD_ERROR", e.message ?: "모델 다운로드 실패", e) }
    }

    /**
     * 손글씨 획 데이터 → 텍스트 인식
     * strokes: [[{x: Double, y: Double, t: Double}, ...], ...]
     * languageTag: "ko"
     */
    AsyncFunction("recognize") { strokes: List<List<Map<String, Double>>>, languageTag: String, promise: Promise ->
      val modelIdentifier = DigitalInkRecognitionModelIdentifier.fromLanguageTag(languageTag)
      if (modelIdentifier == null) {
        promise.reject("MODEL_ERROR", "지원하지 않는 언어 코드: $languageTag", null)
        return@AsyncFunction
      }
      val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
      val recognizer = DigitalInkRecognition.getClient(
        DigitalInkRecognizerOptions.builder(model).build()
      )

      val inkBuilder = Ink.builder()
      for (strokeData in strokes) {
        if (strokeData.isEmpty()) continue
        val strokeBuilder = Ink.Stroke.builder()
        for (point in strokeData) {
          val x = point["x"]?.toFloat() ?: continue
          val y = point["y"]?.toFloat() ?: continue
          val t = point["t"]?.toLong() ?: 0L
          strokeBuilder.addPoint(Ink.Point.create(x, y, t))
        }
        inkBuilder.addStroke(strokeBuilder.build())
      }
      val ink = inkBuilder.build()

      recognizer.recognize(ink)
        .addOnSuccessListener { result ->
          val candidates = result.candidates.take(5).map { it.text }
          promise.resolve(candidates)
          recognizer.close()
        }
        .addOnFailureListener { e ->
          promise.reject("RECOGNIZE_ERROR", e.message ?: "인식 실패", e)
          recognizer.close()
        }
    }
  }
}
