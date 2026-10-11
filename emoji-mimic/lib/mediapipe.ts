import { FaceLandmarker, FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

// NEXT_PUBLIC_MP_LOCAL=1 ise modeller /public altından (internetsiz) yüklenir: npm run setup:offline
const USE_LOCAL = process.env.NEXT_PUBLIC_MP_LOCAL === "1";

const WASM_URL = USE_LOCAL
  ? "/mediapipe/wasm"
  : "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const FACE_MODEL_URL = USE_LOCAL
  ? "/models/face_landmarker.task"
  : "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// GestureRecognizer = el landmark'ları + hazır hareket sınıfları (👍 👎 ✌️ ✋ ✊ ☝️ 🤟).
// Kendi kurallarımızdan bağımsız, ikinci bir algılama kaynağı olarak kullanılır.
const GESTURE_MODEL_URL = USE_LOCAL
  ? "/models/gesture_recognizer.task"
  : "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

export interface Models {
  face: FaceLandmarker;
  hand: GestureRecognizer;
}

let modelsPromise: Promise<Models> | null = null;

async function createModels(): Promise<Models> {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  const build = async (delegate: "GPU" | "CPU"): Promise<Models> => {
    const face = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true, // dil, gülüş, göz kırpma, kaş, yanak gibi ifadeler için
    });
    const hand = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: { modelAssetPath: GESTURE_MODEL_URL, delegate },
      runningMode: "VIDEO",
      numHands: 2,
    });
    return { face, hand };
  };

  try {
    return await build("GPU");
  } catch (err) {
    console.warn("GPU delegate başlatılamadı, CPU'ya geçiliyor:", err);
    return await build("CPU");
  }
}

/** Modeller uygulama boyunca sadece bir kez yüklenir (singleton). */
export function loadModels(): Promise<Models> {
  if (!modelsPromise) {
    modelsPromise = createModels().catch((err) => {
      modelsPromise = null; // tekrar denenebilsin
      throw err;
    });
  }
  return modelsPromise;
}

/** Karşılama ekranındayken arka planda ısıt. */
export function preloadModels() {
  loadModels().catch(() => {});
}
