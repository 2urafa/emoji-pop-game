"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { loadModels, type Models } from "@/lib/mediapipe";
import { toMetric, type Point } from "@/lib/geometry";
import type { FrameLandmarks } from "@/lib/gestures";

export type FrameResult = FrameLandmarks;

interface UseMediaPipeOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Kamera akışı hazır olunca true yap. */
  enabled: boolean;
  /** Her işlenen karede çağrılır (metrik uzaya çevrilmiş landmark'larla). */
  onFrame: (frame: FrameResult) => void;
  fps?: number;
}

export function useMediaPipe({ videoRef, enabled, onFrame, fps = 30 }: UseMediaPipeOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelsRef = useRef<Models | null>(null);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  // Modeller sadece bir kez (asenkron) yüklenir.
  useEffect(() => {
    let cancelled = false;
    loadModels()
      .then((models) => {
        if (cancelled) return;
        modelsRef.current = models;
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("MediaPipe yüklenemedi:", err);
        setError("Yapay zeka modelleri yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenileyin.");
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // requestAnimationFrame döngüsü (yaklaşık 30 fps'e kısıtlı).
  useEffect(() => {
    if (isLoading || error || !enabled) return;

    let raf = 0;
    let last = 0;
    let lastVideoTime = -1;
    const interval = 1000 / fps;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);

      const video = videoRef.current;
      const models = modelsRef.current;
      if (!video || !models || video.readyState < 2 || video.videoWidth === 0) return;
      if (now - last < interval - 4) return;
      if (video.currentTime === lastVideoTime) return;
      last = now;
      lastVideoTime = video.currentTime;

      try {
        const ts = performance.now();
        const aspect = video.videoWidth / video.videoHeight;
        const faceRes = models.face.detectForVideo(video, ts);
        const handRes = models.hand.recognizeForVideo(video, ts);

        const face: Point[] | null = faceRes.faceLandmarks[0] ? toMetric(faceRes.faceLandmarks[0], aspect) : null;
        const hands: Point[][] = handRes.landmarks.map((lm) => toMetric(lm, aspect));

        const blendshapes: Record<string, number> | null = faceRes.faceBlendshapes?.[0]
          ? Object.fromEntries(faceRes.faceBlendshapes[0].categories.map((c) => [c.categoryName, c.score]))
          : null;

        // Her el için MediaPipe'ın hazır hareket adı (güven > 0.5 ise): Thumb_Up, Victory, ILoveYou...
        const gestures: string[] = handRes.landmarks.map((_, i) => {
          const g = handRes.gestures[i]?.[0];
          return g && g.score > 0.5 ? g.categoryName : "None";
        });

        onFrameRef.current({ face, hands, blendshapes, gestures });
      } catch (err) {
        console.error("Kare işlenemedi:", err);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isLoading, error, enabled, fps, videoRef]);

  return { isLoading, error };
}
