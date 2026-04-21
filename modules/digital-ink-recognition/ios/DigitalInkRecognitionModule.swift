import ExpoModulesCore
import MLKitDigitalInkRecognition
import MLKitCommon
import Vision
import UIKit

public class DigitalInkRecognitionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DigitalInkRecognition")

    // ── iOS: 이미지 → 텍스트 (Apple Vision OCR) ──────────────────
    AsyncFunction("recognizeImage") { (imageUri: String, promise: Promise) in
      let url: URL
      if imageUri.hasPrefix("file://") {
        guard let u = URL(string: imageUri) else {
          promise.reject("IMAGE_ERROR", "잘못된 URL")
          return
        }
        url = u
      } else {
        url = URL(fileURLWithPath: imageUri)
      }

      guard let imageData = try? Data(contentsOf: url),
            let uiImage = UIImage(data: imageData),
            let cgImage = uiImage.cgImage else {
        promise.reject("IMAGE_ERROR", "이미지 로딩 실패")
        return
      }

      let request = VNRecognizeTextRequest { req, error in
        if let error = error {
          promise.reject("OCR_ERROR", error.localizedDescription)
          return
        }
        let obs = req.results as? [VNRecognizedTextObservation] ?? []
        var texts: [String] = []
        for o in obs {
          if let top = o.topCandidates(1).first {
            texts.append(top.string)
          }
        }
        promise.resolve(texts)
      }
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true
      request.minimumTextHeight = 0.0
      request.recognitionLanguages = ["ko-KR", "en-US"]

      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      do {
        try handler.perform([request])
      } catch {
        promise.reject("OCR_ERROR", error.localizedDescription)
      }
    }

    // ── Android: MLKit 모델 다운로드 ─────────────────────────────
    AsyncFunction("downloadModel") { (languageTag: String, promise: Promise) in
      do {
        let identifier = try DigitalInkRecognitionModelIdentifier.from(languageTag: languageTag)
        let model = DigitalInkRecognitionModel(modelIdentifier: identifier)
        if ModelManager.modelManager().isModelDownloaded(model) {
          promise.resolve(true)
          return
        }
        let conditions = ModelDownloadConditions(allowsCellularAccess: true, allowsBackgroundDownloading: true)
        ModelManager.modelManager().download(model, conditions: conditions)
        var attempts = 0
        var checkReady: (() -> Void)?
        checkReady = {
          if ModelManager.modelManager().isModelDownloaded(model) {
            promise.resolve(true)
            return
          }
          attempts += 1
          if attempts >= 120 {
            promise.reject("TIMEOUT", "모델 다운로드 시간 초과")
            return
          }
          DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + 0.5) { checkReady?() }
        }
        DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + 1.0) { checkReady?() }
      } catch {
        promise.reject("MODEL_ERROR", "지원하지 않는 언어 코드: \(languageTag)")
      }
    }

    // ── Android: MLKit 획 인식 ────────────────────────────────────
    AsyncFunction("recognize") { (strokes: [[Dictionary<String, Double>]], languageTag: String, promise: Promise) in
      do {
        let identifier = try DigitalInkRecognitionModelIdentifier.from(languageTag: languageTag)
        let model = DigitalInkRecognitionModel(modelIdentifier: identifier)
        guard ModelManager.modelManager().isModelDownloaded(model) else {
          promise.reject("MODEL_NOT_READY", "모델 미준비")
          return
        }
        let options = DigitalInkRecognizerOptions(model: model)
        let recognizer = DigitalInkRecognizer.digitalInkRecognizer(options: options)
        var inkStrokes: [Stroke] = []
        for strokeData in strokes {
          var points: [StrokePoint] = []
          for point in strokeData {
            guard let x = point["x"], let y = point["y"] else { continue }
            let t = point["t"] ?? 0
            points.append(StrokePoint(x: Float(x), y: Float(y), t: Int(t)))
          }
          if !points.isEmpty { inkStrokes.append(Stroke(points: points)) }
        }
        let ink = Ink(strokes: inkStrokes)
        recognizer.recognize(ink: ink) { [recognizer] result, error in
          _ = recognizer // strong reference 유지 — ARC 해제 방지
          if let error = error {
            promise.reject("RECOGNIZE_ERROR", error.localizedDescription)
          } else if let result = result {
            promise.resolve(Array(result.candidates.prefix(5).map { $0.text }))
          } else {
            promise.resolve([String]())
          }
        }
      } catch {
        promise.reject("MODEL_ERROR", "지원하지 않는 언어 코드: \(languageTag)")
      }
    }
  }
}
