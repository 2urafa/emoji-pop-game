export interface Point {
  x: number;
  y: number;
  z?: number;
}

/**
 * MediaPipe landmark'ları 0-1 arasında normalize gelir (x genişliğe, y yüksekliğe göre).
 * 16:9 videoda mesafelerin bozulmaması için x'i en/boy oranıyla çarpıp "metrik" uzaya çeviriyoruz.
 */
export function toMetric(lms: ReadonlyArray<Point>, aspect: number): Point[] {
  return lms.map((l) => ({ x: l.x * aspect, y: l.y, z: l.z }));
}

/** İki nokta arasındaki 2B Öklid mesafesi. */
export function getDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getMidpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export type EyeIndices = readonly [number, number, number, number, number, number];

/**
 * Eye Aspect Ratio: (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
 * idx sırası: [p1 (dış köşe), p2, p3 (üst kapak), p4 (iç köşe), p5, p6 (alt kapak)]
 */
export function getEAR(points: Point[], idx: EyeIndices): number {
  const [i1, i2, i3, i4, i5, i6] = idx;
  const v1 = getDistance(points[i2], points[i6]);
  const v2 = getDistance(points[i3], points[i5]);
  const h = getDistance(points[i1], points[i4]);
  return h === 0 ? 0 : (v1 + v2) / (2 * h);
}
