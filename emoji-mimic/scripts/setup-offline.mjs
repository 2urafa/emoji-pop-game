import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Çevrimdışı çalışma: MediaPipe WASM + model dosyalarını public/ altına kopyalar/indirir.
// Sonra .env.local içine  NEXT_PUBLIC_MP_LOCAL=1  yazıp `npm run build && npm start` çalıştırın.

const root = process.cwd();
const wasmSrc = path.join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const wasmDst = path.join(root, "public/mediapipe/wasm");
const modelsDir = path.join(root, "public/models");

const MODELS = {
  "face_landmarker.task":
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  "gesture_recognizer.task":
    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
};

await mkdir(wasmDst, { recursive: true });
await cp(wasmSrc, wasmDst, { recursive: true });
console.log("✓ WASM dosyaları kopyalandı → public/mediapipe/wasm");

await mkdir(modelsDir, { recursive: true });
for (const [name, url] of Object.entries(MODELS)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name} indirilemedi: HTTP ${res.status}`);
  await writeFile(path.join(modelsDir, name), Buffer.from(await res.arrayBuffer()));
  console.log(`✓ ${name} indirildi → public/models`);
}

console.log("\nSon adım: .env.local dosyasına NEXT_PUBLIC_MP_LOCAL=1 ekleyin, sonra npm run build && npm start");
