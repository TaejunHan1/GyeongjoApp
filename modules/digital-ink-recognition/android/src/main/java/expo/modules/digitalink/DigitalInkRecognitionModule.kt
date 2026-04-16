package expo.modules.digitalink

import android.graphics.BitmapFactory
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.digitalink.DigitalInkRecognition
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModel
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModelIdentifier
import com.google.mlkit.vision.digitalink.DigitalInkRecognizerOptions
import com.google.mlkit.vision.digitalink.Ink
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions

class DigitalInkRecognitionModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DigitalInkRecognition")

    // ── 이미지 → 텍스트 (ML Kit Korean Text Recognition) ─────────
    AsyncFunction("recognizeImage") { imageUri: String, promise: Promise ->
      try {
        val path = if (imageUri.startsWith("file://")) imageUri.removePrefix("file://") else imageUri
        val bitmap = BitmapFactory.decodeFile(path)
        if (bitmap == null) {
          promise.resolve(emptyList<String>())
          return@AsyncFunction
        }
        val image = InputImage.fromBitmap(bitmap, 0)
        val recognizer = TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
        recognizer.process(image)
          .addOnSuccessListener { result ->
            val lines = mutableListOf<String>()
            for (block in result.textBlocks) {
              for (line in block.lines) {
                val text = line.text.trim()
                if (text.isNotEmpty()) lines.add(text)
              }
            }
            promise.resolve(lines)
            recognizer.close()
          }
          .addOnFailureListener {
            promise.resolve(emptyList<String>())
            recognizer.close()
          }
      } catch (e: Exception) {
        promise.resolve(emptyList<String>())
      }
    }

    // ── 모델 다운로드 (Digital Ink) ──────────────────────────────
    AsyncFunction("downloadModel") { languageTag: String, promise: Promise ->
      try {
        val modelIdentifier = DigitalInkRecognitionModelIdentifier.fromLanguageTag(languageTag)
        if (modelIdentifier == null) {
          promise.resolve(false)
          return@AsyncFunction
        }
        val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
        val modelManager = RemoteModelManager.getInstance()
        modelManager.isModelDownloaded(model)
          .addOnSuccessListener { isDownloaded ->
            if (isDownloaded) {
              promise.resolve(true)
            } else {
              modelManager.download(model, DownloadConditions.Builder().build())
                .addOnSuccessListener { promise.resolve(true) }
                .addOnFailureListener { promise.resolve(false) }
            }
          }
          .addOnFailureListener { promise.resolve(false) }
      } catch (e: Throwable) {
        promise.resolve(false)
      }
    }

    // ── 획 인식 (Digital Ink) ─────────────────────────────────────
    AsyncFunction("recognize") { strokes: List<List<Map<String, Double>>>, languageTag: String, promise: Promise ->
      try {
        val modelIdentifier = DigitalInkRecognitionModelIdentifier.fromLanguageTag(languageTag)
        if (modelIdentifier == null) {
          promise.resolve(emptyList<String>())
          return@AsyncFunction
        }
        val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
        val recognizer = DigitalInkRecognition.getClient(DigitalInkRecognizerOptions.builder(model).build())
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
        recognizer.recognize(inkBuilder.build())
          .addOnSuccessListener { result ->
            promise.resolve(result.candidates.take(5).map { it.text })
            recognizer.close()
          }
          .addOnFailureListener {
            promise.resolve(emptyList<String>())
            recognizer.close()
          }
      } catch (e: Throwable) {
        promise.resolve(emptyList<String>())
      }
    }
  }
}
