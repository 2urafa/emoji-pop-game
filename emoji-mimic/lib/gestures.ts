import { EMOJIS, type EmojiId } from "./emojis";
import { getDistance, getEAR, getMidpoint, type EyeIndices, type Point } from "./geometry";

/**
 * Tüm eşikler burada. Standta ışık/kamera farklı olabilir:
 * oyun ekranında "D" tuşuna basıp canlı ölçümleri görerek buradan ayarlayın.
 *
 * Algılama stratejisi: her emoji için BİRDEN FAZLA kaynak "VEYA" ile birleşir
 *  1) kendi landmark/geometri kuralımız,
 *  2) MediaPipe yüz blendshape skorları (gülüş, göz kırpma, kaş, dil, yanak...),
 *  3) MediaPipe GestureRecognizer'ın hazır el hareketleri (👍 👎 ✌️ ✋ ✊ ☝️ 🤟).
 * Biri bile doğruysa poz sayılır; böylece ışık/kamera yüzünden tek kaynak şaşsa da oyun akar.
 */
export const THRESHOLDS = {
  // Yüz geometrisi (oranlar: ağız açıklığı / yüz yüksekliği, ağız genişliği / yüz genişliği)
  mouthOpenSurprised: 0.09,
  surprisedMaxWidth: 0.43,
  surprisedMaxLift: 0.015,
  smileLift: 0.012,
  smileMinWidth: 0.4,
  grinMinOpen: 0.035, // gülerken ağız bu kadar açıksa 😁 (diş gösteren sırıtış)
  eyeClosedEAR: 0.17,
  eyeOpenEAR: 0.23,
  browGapAngry: 0.235, // iç kaşlar arası / yüz genişliği
  browEyeAngry: 0.1, // iç kaş-göz köşesi / yüz yüksekliği
  kissMaxWidth: 0.29,
  kissMaxOpen: 0.06,
  // Yüz blendshape skorları (0-1)
  bsJawOpen: 0.4, // 😲
  bsSmile: 0.45, // 😃
  bsGrinSmile: 0.5, // 😁
  bsGrinJaw: 0.2,
  bsBlink: 0.55, // kapalı göz
  bsEyeOpen: 0.3, // açık göz
  bsBrowDown: 0.5, // 😠
  bsPucker: 0.5, // 😘
  bsCheekPuff: 0.35, // 🐡
  bsLook: 0.5, // 👀
  tongueOut: 0.35,
  tongueWinkOut: 0.3,
  smirkSide: 0.35, // daha çok gülen taraf
  smirkDiff: 0.3, // iki taraf arası fark
  browSide: 0.4, // kalkık kaş
  browDiff: 0.3, // iki kaş arası fark
  // El (oranlar: avuç boyu = bilek-orta parmak tabanı)
  fingerExtendedRatio: 1.15, // |uç-bilek| / |PIP-bilek|
  thumbReach: 0.62, // |başparmak ucu - işaret tabanı| / avuç boyu
  thumbVertical: 0.35,
  indexUpVertical: 0.5,
  pinchRatio: 0.28,
  pinchIndexRatio: 0.85,
  vulcanGap: 0.5, // 🖖 orta-yüzük arası
  vulcanClose: 0.4, // 🖖 işaret-orta ve yüzük-serçe arası en fazla
  pointHorizontal: 1.3, // 👉👈: yatay yön / dikey yön en az
  // Yüz + el
  shushDistance: 0.25, // işaret ucu - dudak / yüz genişliği
  thinkDistance: 0.3, // işaret ucu - çene / yüz genişliği
  // İki el (oranlar: ortalama avuç boyu)
  prayerTip: 0.5,
  prayerWrist: 1.0,
  bothApart: 1.1,
  heartTip: 0.6,
  // Oyun (tutma süresi seviyeye göre lib/emojis.ts içinde)
  graceMs: 250,
} as const;

const T = THRESHOLDS;

const RIGHT_EYE: EyeIndices = [33, 160, 158, 133, 153, 144];
const LEFT_EYE: EyeIndices = [362, 385, 387, 263, 373, 380];

/* ------------------------------ YÜZ ------------------------------ */

export interface FaceMetrics {
  mouthOpen: number;
  mouthWidth: number;
  smileLift: number;
  leftEAR: number;
  rightEAR: number;
  browGap: number;
  browEye: number;
  mouthCenter: Point;
  chin: Point;
  faceWidth: number;
  // blendshape'ler (yoksa 0)
  jawOpen: number;
  smile: number; // iki taraf ortalaması
  smileL: number;
  smileR: number;
  blinkL: number;
  blinkR: number;
  browDown: number;
  browUpL: number;
  browUpR: number;
  pucker: number;
  cheekPuff: number;
  tongue: number;
  lookLeft: number;
  lookRight: number;
}

export function computeFaceMetrics(f: Point[], bs: Record<string, number> | null = null): FaceMetrics {
  const faceWidth = getDistance(f[234], f[454]) || 1;
  const faceHeight = getDistance(f[10], f[152]) || 1;

  const upperLip = f[13];
  const lowerLip = f[14];
  const mouthCenter = getMidpoint(upperLip, lowerLip);
  const cornerMid = getMidpoint(f[61], f[291]);

  // Yüzün "yukarı" ekseni (çene → alın): baş eğikken de gülümseme doğru ölçülsün.
  const upX = f[10].x - f[152].x;
  const upY = f[10].y - f[152].y;
  const upLen = Math.hypot(upX, upY) || 1;
  const smileLift =
    // Referans üst iç dudak (13): ağız açılınca dudak ortası aşağı kayar ve gülümsemeyi olduğundan büyük gösterirdi.
    (((cornerMid.x - upperLip.x) * upX + (cornerMid.y - upperLip.y) * upY) / upLen) / faceHeight;

  const b = (name: string) => bs?.[name] ?? 0;

  return {
    mouthOpen: getDistance(upperLip, lowerLip) / faceHeight,
    mouthWidth: getDistance(f[61], f[291]) / faceWidth,
    smileLift,
    leftEAR: getEAR(f, LEFT_EYE),
    rightEAR: getEAR(f, RIGHT_EYE),
    browGap: getDistance(f[107], f[336]) / faceWidth,
    browEye: (getDistance(f[107], f[133]) + getDistance(f[336], f[362])) / 2 / faceHeight,
    mouthCenter,
    chin: getMidpoint(f[17], f[152]),
    faceWidth,
    jawOpen: b("jawOpen"),
    smile: (b("mouthSmileLeft") + b("mouthSmileRight")) / 2,
    smileL: b("mouthSmileLeft"),
    smileR: b("mouthSmileRight"),
    blinkL: b("eyeBlinkLeft"),
    blinkR: b("eyeBlinkRight"),
    browDown: (b("browDownLeft") + b("browDownRight")) / 2,
    browUpL: b("browOuterUpLeft"),
    browUpR: b("browOuterUpRight"),
    pucker: b("mouthPucker"),
    cheekPuff: b("cheekPuff"),
    tongue: b("tongueOut"),
    lookLeft: (b("eyeLookOutLeft") + b("eyeLookInRight")) / 2,
    lookRight: (b("eyeLookInLeft") + b("eyeLookOutRight")) / 2,
  };
}

const isSurprised = (f: FaceMetrics) =>
  (f.mouthOpen > T.mouthOpenSurprised && f.mouthWidth < T.surprisedMaxWidth && f.smileLift < T.surprisedMaxLift) ||
  (f.jawOpen > T.bsJawOpen && f.smile < 0.4);

const isHappy = (f: FaceMetrics) =>
  (f.mouthWidth > T.smileMinWidth && f.smileLift > T.smileLift && !isSurprised(f)) ||
  (f.smile > T.bsSmile && f.jawOpen < 0.45);

const isGrin = (f: FaceMetrics) =>
  (f.mouthWidth > T.smileMinWidth && f.smileLift > T.smileLift && f.mouthOpen > T.grinMinOpen) ||
  (f.smile > T.bsGrinSmile && f.jawOpen > T.bsGrinJaw);

const isWink = (f: FaceMetrics) =>
  (f.leftEAR < T.eyeClosedEAR && f.rightEAR > T.eyeOpenEAR) ||
  (f.rightEAR < T.eyeClosedEAR && f.leftEAR > T.eyeOpenEAR) ||
  (f.blinkL > T.bsBlink && f.blinkR < T.bsEyeOpen) ||
  (f.blinkR > T.bsBlink && f.blinkL < T.bsEyeOpen);

const isAngry = (f: FaceMetrics) =>
  (f.browGap < T.browGapAngry && f.browEye < T.browEyeAngry && f.mouthOpen < T.mouthOpenSurprised) ||
  f.browDown > T.bsBrowDown;

const isKiss = (f: FaceMetrics) =>
  (f.mouthWidth < T.kissMaxWidth && f.mouthOpen < T.kissMaxOpen) || (f.pucker > T.bsPucker && f.jawOpen < 0.35);

const isTongue = (f: FaceMetrics) => f.tongue > T.tongueOut;

const isWinkTongue = (f: FaceMetrics) => f.tongue > T.tongueWinkOut && isWink(f);

const isSmirk = (f: FaceMetrics) =>
  Math.max(f.smileL, f.smileR) > T.smirkSide && Math.abs(f.smileL - f.smileR) > T.smirkDiff;

const isBrowRaise = (f: FaceMetrics) =>
  Math.max(f.browUpL, f.browUpR) > T.browSide && Math.abs(f.browUpL - f.browUpR) > T.browDiff;

const isSleep = (f: FaceMetrics) =>
  (f.leftEAR < T.eyeClosedEAR && f.rightEAR < T.eyeClosedEAR) || (f.blinkL > 0.6 && f.blinkR > 0.6);

const isPuff = (f: FaceMetrics) => f.cheekPuff > T.bsCheekPuff;

const isLookSide = (f: FaceMetrics) => f.lookLeft > T.bsLook || f.lookRight > T.bsLook;

const FACE_RULES: Partial<Record<EmojiId, (f: FaceMetrics) => boolean>> = {
  surprised: isSurprised,
  happy: isHappy,
  grin: isGrin,
  wink: isWink,
  angry: isAngry,
  kiss: isKiss,
  tongue: isTongue,
  winkTongue: isWinkTongue,
  smirk: isSmirk,
  browRaise: isBrowRaise,
  sleep: isSleep,
  puff: isPuff,
  lookSide: isLookSide,
};

/* ------------------------------ EL ------------------------------- */

export interface HandState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  thumbUp: boolean;
  thumbDown: boolean;
  indexUp: boolean;
  indexRatio: number;
  pinch: number;
  indexTip: Point;
  /** İşaret parmağı yönü (uç - taban) / avuç boyu; ham (aynalanmamış) görüntü koordinatında. */
  dirX: number;
  dirY: number;
  gapIM: number;
  gapMR: number;
  gapRP: number;
  size: number;
  /** MediaPipe GestureRecognizer'ın hazır hareketi ("Thumb_Up", "Victory"... ya da "None"). */
  gesture: string;
  lm: Point[];
}

export function computeHandState(h: Point[], gesture = "None"): HandState {
  const size = getDistance(h[0], h[9]) || 1; // avuç boyu

  // Parmak açık mı? Uç, bileğe PIP eklemine göre belirgin biçimde daha uzaksa açık.
  const ratio = (tip: number, pip: number) => getDistance(h[tip], h[0]) / (getDistance(h[pip], h[0]) || 1);
  const indexRatio = ratio(8, 6);
  const extended = (r: number) => r > T.fingerExtendedRatio;

  // Başparmak: ucu işaret parmağı tabanından uzak ve serçe tabanından IP'den daha uzak.
  const thumbReach = getDistance(h[4], h[5]) / size;
  const thumb = thumbReach > T.thumbReach && getDistance(h[4], h[17]) > getDistance(h[3], h[17]);

  return {
    thumb,
    index: extended(indexRatio),
    middle: extended(ratio(12, 10)),
    ring: extended(ratio(16, 14)),
    pinky: extended(ratio(20, 18)),
    // Görüntüde y aşağı doğru artar: uç tabandan küçük y = yukarı.
    thumbUp: (h[2].y - h[4].y) / size > T.thumbVertical,
    thumbDown: (h[4].y - h[2].y) / size > T.thumbVertical,
    indexUp: (h[5].y - h[8].y) / size > T.indexUpVertical,
    indexRatio,
    pinch: getDistance(h[4], h[8]) / size,
    indexTip: h[8],
    dirX: (h[8].x - h[5].x) / size,
    dirY: (h[8].y - h[5].y) / size,
    gapIM: getDistance(h[8], h[12]) / size,
    gapMR: getDistance(h[12], h[16]) / size,
    gapRP: getDistance(h[16], h[20]) / size,
    size,
    gesture,
    lm: h,
  };
}

const onlyThumb = (h: HandState) => h.thumb && !h.index && !h.middle && !h.ring && !h.pinky;
const fourUp = (h: HandState) => h.index && h.middle && h.ring && h.pinky;
const isVulcan = (h: HandState) =>
  fourUp(h) && h.gapMR > T.vulcanGap && h.gapIM < T.vulcanClose && h.gapRP < T.vulcanClose;

/** MediaPipe'ın hazır hareket adlarının karşılığı olan emojiler. */
const CANNED: Record<string, EmojiId> = {
  Thumb_Up: "thumbsUp",
  Thumb_Down: "thumbsDown",
  Victory: "victory",
  Open_Palm: "openHand",
  Closed_Fist: "fist",
  Pointing_Up: "point",
  ILoveYou: "loveYou",
};

const HAND_RULES: Partial<Record<EmojiId, (h: HandState) => boolean>> = {
  thumbsUp: (h) => onlyThumb(h) && h.thumbUp,
  thumbsDown: (h) => onlyThumb(h) && h.thumbDown,
  victory: (h) => h.index && h.middle && !h.ring && !h.pinky,
  openHand: (h) => h.thumb && fourUp(h),
  fist: (h) => !h.thumb && !h.index && !h.middle && !h.ring && !h.pinky,
  // başparmak açıksa bu 🤟'dir (ayrı emoji), 🤘 için başparmak içeride olmalı
  rock: (h) => h.index && h.pinky && !h.middle && !h.ring && !h.thumb,
  call: (h) => h.thumb && h.pinky && !h.index && !h.middle && !h.ring,
  pinch: (h) =>
    h.pinch < T.pinchRatio && h.indexRatio > T.pinchIndexRatio && !(h.middle && h.ring && h.pinky),
  // pinch > eşik*1.5: başparmak ve işaret ucu birbirine yakınsa bu bir 🤏'dır, ☝️ değil.
  point: (h) =>
    h.index && !h.middle && !h.ring && !h.pinky && !h.thumb && h.indexUp && h.pinch > T.pinchRatio * 1.5,
  loveYou: (h) => h.thumb && h.index && h.pinky && !h.middle && !h.ring,
  // 👌: başparmak ve işaret ucu birleşik, diğer üç parmak açık
  okHand: (h) => h.pinch < T.pinchRatio && h.middle && h.ring && h.pinky,
  three: (h) => !h.thumb && h.index && h.middle && h.ring && !h.pinky,
  // pinch eşiği: başparmak işaret ucuna değiyorsa bu 👌'dir, 4️⃣ değil. Orta-yüzük arası açıksa 🖖'dir.
  four: (h) => !h.thumb && fourUp(h) && h.pinch > T.pinchRatio * 1.5 && !isVulcan(h),
  vulcan: isVulcan,
  // Kamera görüntüsü ekranda aynalanıyor: ham görüntüde parmak SOLA bakıyorsa ekranda SAĞA bakar.
  pointRight: (h) =>
    h.index && !h.middle && !h.ring && !h.pinky && -h.dirX > T.pointHorizontal * Math.abs(h.dirY) && -h.dirX > 0.4,
  pointLeft: (h) =>
    h.index && !h.middle && !h.ring && !h.pinky && h.dirX > T.pointHorizontal * Math.abs(h.dirY) && h.dirX > 0.4,
};

/* --------------------------- ANALİZ / EŞLEŞME --------------------------- */

export interface Analysis {
  face: FaceMetrics | null;
  hands: HandState[];
  // yüz + el ve iki el birleşimleri
  shush: boolean;
  think: boolean;
  prayer: boolean;
  heart: boolean;
  bothHands: boolean;
}

export interface FrameLandmarks {
  face: Point[] | null;
  hands: Point[][];
  /** FaceLandmarker blendshape skorları (tongueOut, mouthSmileLeft...). */
  blendshapes?: Record<string, number> | null;
  /** Her el için MediaPipe hazır hareket adı (hands ile aynı sırada). */
  gestures?: string[] | null;
}

export function analyzeFrame(frame: FrameLandmarks): Analysis {
  const face = frame.face ? computeFaceMetrics(frame.face, frame.blendshapes ?? null) : null;
  const hands = frame.hands.map((h, i) => computeHandState(h, frame.gestures?.[i] ?? "None"));

  // İşaret parmağı açık, diğerleri bükülü bir el için dudağa ve çeneye uzaklık.
  // 🤫: parmak ucu dudağa daha yakın.  🤔: parmak ucu çeneye daha yakın.
  let shush = false;
  let think = false;
  if (face) {
    for (const h of hands) {
      if (!(h.index && !h.middle && !h.ring && !h.pinky)) continue;
      const dMouth = getDistance(h.indexTip, face.mouthCenter) / face.faceWidth;
      const dChin = getDistance(h.indexTip, face.chin) / face.faceWidth;
      if (dMouth < T.shushDistance && dMouth <= dChin) shush = true;
      if (dChin < T.thinkDistance && dChin < dMouth) think = true;
    }
  }

  // İki el: 🙏 avuçlar birleşik, ❤️ başparmak ve işaret uçları buluşuyor, 🙌 iki açık el birbirinden uzak.
  let prayer = false;
  let heart = false;
  let bothHands = false;
  if (hands.length >= 2) {
    const [a, b] = hands;
    const size = (a.size + b.size) / 2;
    const d = (i: number) => getDistance(a.lm[i], b.lm[i]) / size;
    prayer = d(12) < T.prayerTip && d(0) < T.prayerWrist && a.middle && b.middle;
    heart = !prayer && d(4) < T.heartTip && d(8) < T.heartTip;
    bothHands = fourUp(a) && fourUp(b) && d(0) > T.bothApart;
  }

  return { face, hands, shush, think, prayer, heart, bothHands };
}

const COMBO_FLAGS: Partial<Record<EmojiId, "shush" | "think" | "prayer" | "heart" | "bothHands">> = {
  shush: "shush",
  think: "think",
  prayer: "prayer",
  heart: "heart",
  bothHands: "bothHands",
};

export function isMatch(id: EmojiId, a: Analysis): boolean {
  const flag = COMBO_FLAGS[id];
  if (flag) return a[flag];
  const faceRule = FACE_RULES[id];
  if (faceRule) return !!a.face && faceRule(a.face);
  const handRule = HAND_RULES[id];
  if (handRule) return a.hands.some((h) => handRule(h) || CANNED[h.gesture] === id);
  return false;
}

/** Hata ayıklama paneli için okunabilir ölçümler. */
export function describeAnalysis(a: Analysis): string[] {
  const lines: string[] = [];
  if (!a.face) {
    lines.push("Yüz: bulunamadı");
  } else {
    const f = a.face;
    lines.push(
      `ağız açıklığı ${f.mouthOpen.toFixed(3)} | genişlik ${f.mouthWidth.toFixed(3)} | gülümseme ${f.smileLift.toFixed(3)}`,
      `EAR sol ${f.leftEAR.toFixed(3)} | sağ ${f.rightEAR.toFixed(3)} | kaş aralığı ${f.browGap.toFixed(3)}`,
      `çene ${f.jawOpen.toFixed(2)} | gülüş ${f.smile.toFixed(2)} (sol ${f.smileL.toFixed(2)} sağ ${f.smileR.toFixed(2)}) | büzme ${f.pucker.toFixed(2)}`,
      `göz kırp sol ${f.blinkL.toFixed(2)} sağ ${f.blinkR.toFixed(2)} | kaş çat ${f.browDown.toFixed(2)} | kaş kaldır ${f.browUpL.toFixed(2)}/${f.browUpR.toFixed(2)}`,
      `dil ${f.tongue.toFixed(2)} | yanak ${f.cheekPuff.toFixed(2)} | bakış sol ${f.lookLeft.toFixed(2)} sağ ${f.lookRight.toFixed(2)}`
    );
  }
  if (a.hands.length === 0) {
    lines.push("El: bulunamadı");
  } else {
    a.hands.forEach((h, i) => {
      const fingers = ([
        ["B", h.thumb],
        ["İ", h.index],
        ["O", h.middle],
        ["Y", h.ring],
        ["S", h.pinky],
      ] as const)
        .map(([n, on]) => `${n}${on ? "↑" : "·"}`)
        .join(" ");
      lines.push(
        `El ${i + 1}: ${fingers} | MediaPipe: ${h.gesture} | çimdik ${h.pinch.toFixed(2)} | orta-yüzük aralığı ${h.gapMR.toFixed(2)}`
      );
    });
    if (a.hands.length >= 2) lines.push(`iki el: dua ${a.prayer ? "✓" : "·"} kalp ${a.heart ? "✓" : "·"} iki-el-havada ${a.bothHands ? "✓" : "·"}`);
  }
  const matching = EMOJIS.filter((e) => isMatch(e.id, a)).map((e) => e.char);
  lines.push(`Şu an algılanan: ${matching.length ? matching.join(" ") : "—"}`);
  return lines;
}
