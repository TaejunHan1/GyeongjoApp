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
import com.google.mlkit.vision.digitalink.DigitalInkRecognizer
import com.google.mlkit.vision.digitalink.DigitalInkRecognizerOptions
import com.google.mlkit.vision.digitalink.Ink
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions

class DigitalInkRecognitionModule : Module() {
  private var cachedRecognizer: DigitalInkRecognizer? = null
  private var cachedRecognizerTag: String? = null

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
        val modelIdentifier = resolveModelIdentifier(languageTag)
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

    AsyncFunction("warmUpRecognizer") { languageTag: String, promise: Promise ->
      try {
        val modelIdentifier = resolveModelIdentifier(languageTag)
        if (modelIdentifier == null) {
          promise.resolve(false)
          return@AsyncFunction
        }
        val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
        val modelManager = RemoteModelManager.getInstance()
        modelManager.isModelDownloaded(model)
          .addOnSuccessListener { isDownloaded ->
            if (!isDownloaded) {
              modelManager.download(model, DownloadConditions.Builder().build())
                .addOnSuccessListener {
                  getRecognizer(modelIdentifier, languageTag)
                  promise.resolve(true)
                }
                .addOnFailureListener { promise.resolve(false) }
            } else {
              getRecognizer(modelIdentifier, languageTag)
              promise.resolve(true)
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
        val modelIdentifier = resolveModelIdentifier(languageTag)
        if (modelIdentifier == null) {
          promise.resolve(emptyList<String>())
          return@AsyncFunction
        }
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
        val recognizer = getRecognizer(modelIdentifier, languageTag)
        recognizer.recognize(ink)
          .addOnSuccessListener { result ->
            promise.resolve(result.candidates.take(5).map { it.text })
          }
          .addOnFailureListener {
            promise.resolve(emptyList<String>())
          }
      } catch (e: Throwable) {
        promise.resolve(emptyList<String>())
      }
    }

    AsyncFunction("recognizeWithDebug") { strokes: List<List<Map<String, Double>>>, languageTag: String, promise: Promise ->
      val strokeCount = strokes.size
      val pointCount = strokes.sumOf { it.size }
      fun debugResult(
        ok: Boolean,
        stage: String,
        candidates: List<String> = emptyList(),
        resolvedLanguageTag: String? = null,
        modelDownloadedBefore: Boolean? = null,
        modelDownloadedAfter: Boolean? = null,
        error: String? = null
      ): Map<String, Any?> {
        return mapOf(
          "ok" to ok,
          "stage" to stage,
          "languageTag" to languageTag,
          "resolvedLanguageTag" to resolvedLanguageTag,
          "strokeCount" to strokeCount,
          "pointCount" to pointCount,
          "modelDownloadedBefore" to modelDownloadedBefore,
          "modelDownloadedAfter" to modelDownloadedAfter,
          "candidates" to candidates,
          "error" to error
        )
      }

      try {
        if (strokeCount == 0 || pointCount == 0) {
          promise.resolve(debugResult(false, "NO_STROKES"))
          return@AsyncFunction
        }

        val resolved = resolveModelIdentifierWithTag(languageTag)
        val modelIdentifier = resolved.first
        val resolvedTag = resolved.second
        if (modelIdentifier == null) {
          promise.resolve(debugResult(false, "MODEL_IDENTIFIER_NULL", resolvedLanguageTag = resolvedTag))
          return@AsyncFunction
        }

        val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
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
        val modelManager = RemoteModelManager.getInstance()

        val runRecognition = { downloadedBefore: Boolean, downloadedAfter: Boolean ->
          val recognizer = getRecognizer(modelIdentifier, resolvedTag ?: languageTag)
          recognizer.recognize(ink)
            .addOnSuccessListener { result ->
              val candidates = result.candidates.take(5).map { it.text }
              promise.resolve(
                debugResult(
                  ok = candidates.isNotEmpty(),
                  stage = "RECOGNIZE_SUCCESS",
                  candidates = candidates,
                  resolvedLanguageTag = resolvedTag,
                  modelDownloadedBefore = downloadedBefore,
                  modelDownloadedAfter = downloadedAfter
                )
              )
            }
            .addOnFailureListener { e ->
              promise.resolve(
                debugResult(
                  ok = false,
                  stage = "RECOGNIZE_FAILED",
                  resolvedLanguageTag = resolvedTag,
                  modelDownloadedBefore = downloadedBefore,
                  modelDownloadedAfter = downloadedAfter,
                  error = e.message ?: e.javaClass.simpleName
                )
              )
            }
        }

        modelManager.isModelDownloaded(model)
          .addOnSuccessListener { isDownloaded ->
            if (isDownloaded) {
              runRecognition(true, true)
            } else {
              modelManager.download(model, DownloadConditions.Builder().build())
                .addOnSuccessListener { runRecognition(false, true) }
                .addOnFailureListener { e ->
                  promise.resolve(
                    debugResult(
                      ok = false,
                      stage = "MODEL_DOWNLOAD_FAILED",
                      resolvedLanguageTag = resolvedTag,
                      modelDownloadedBefore = false,
                      modelDownloadedAfter = false,
                      error = e.message ?: e.javaClass.simpleName
                    )
                  )
                }
            }
          }
          .addOnFailureListener { e ->
            promise.resolve(
              debugResult(
                ok = false,
                stage = "MODEL_CHECK_FAILED",
                resolvedLanguageTag = resolvedTag,
                error = e.message ?: e.javaClass.simpleName
              )
            )
          }
      } catch (e: Throwable) {
        promise.resolve(debugResult(false, "THROWN", error = e.message ?: e.javaClass.simpleName))
      }
    }
  }

  private fun resolveModelIdentifier(languageTag: String): DigitalInkRecognitionModelIdentifier? {
    return resolveModelIdentifierWithTag(languageTag).first
  }

  private fun resolveModelIdentifierWithTag(languageTag: String): Pair<DigitalInkRecognitionModelIdentifier?, String?> {
    val tags = listOf(languageTag, "ko-KR", "ko").distinct()
    for (tag in tags) {
      val identifier = DigitalInkRecognitionModelIdentifier.fromLanguageTag(tag)
      if (identifier != null) return Pair(identifier, tag)
    }
    return Pair(null, null)
  }

  private fun getRecognizer(
    modelIdentifier: DigitalInkRecognitionModelIdentifier,
    languageTag: String
  ): DigitalInkRecognizer {
    val cached = cachedRecognizer
    if (cached != null && cachedRecognizerTag == languageTag) {
      return cached
    }

    cachedRecognizer?.close()
    val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
    val recognizer = DigitalInkRecognition.getClient(DigitalInkRecognizerOptions.builder(model).build())
    cachedRecognizer = recognizer
    cachedRecognizerTag = languageTag
    return recognizer
  }
}
