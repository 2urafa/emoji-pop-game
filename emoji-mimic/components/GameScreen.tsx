"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Leaderboard } from "@/components/Leaderboard";
import { Logo } from "@/components/Logo";
import { useMediaPipe, type FrameResult } from "@/hooks/useMediaPipe";
import { createEmojiPicker, getLevel, holdMsForLevel, type EmojiDef } from "@/lib/emojis";
import { analyzeFrame, describeAnalysis, isMatch, THRESHOLDS } from "@/lib/gestures";
import { getTopScores, type ScoreEntry } from "@/lib/leaderboard";
import { playGameOver, playSkip, playSuccess } from "@/lib/sounds";

const GAME_MS = 60_000;

type Phase = "init" | "countdown" | "playing" | "done";
type CameraStatus = "checking" | "granted" | "error";

function describeCameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Kamera izni verilmedi. Tarayıcının adres çubuğundaki kamera simgesinden izin verip tekrar deneyin.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Kamera bulunamadı. Bir kamera bağlı olduğundan emin olun.";
  if (name === "NotReadableError") return "Kamera başka bir uygulama tarafından kullanılıyor olabilir.";
  if (err instanceof Error) return err.message;
  return "Kamera açılamadı.";
}

interface GameScreenProps {
  playerName: string;
  onFinish: (score: number) => void;
  onExit: () => void;
}

export function GameScreen({ playerName, onFinish, onExit }: GameScreenProps) {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Karıştırılmış emoji destesi: havuzdaki her emoji bir kez gelmeden tekrar etmez.
  const pickerRef = useRef<ReturnType<typeof createEmojiPicker> | null>(null);
  if (!pickerRef.current) pickerRef.current = createEmojiPicker();

  const [phase, setPhase] = useState<Phase>("init");
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("checking");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_MS);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<EmojiDef>(() => (pickerRef.current as ReturnType<typeof createEmojiPicker>).next(0));
  const [holdProgress, setHoldProgress] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [leaders, setLeaders] = useState<ScoreEntry[]>([]);
  const [stuck, setStuck] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLines, setDebugLines] = useState<string[]>([]);

  // Döngü içinden okunan değerler ref'te tutulur (yeniden render/stale closure olmasın).
  const phaseRef = useRef<Phase>("init");
  const targetRef = useRef<EmojiDef>(target);
  const scoreRef = useRef(0);
  const holdStartRef = useRef<number | null>(null);
  const lastMatchRef = useRef(0);
  const lastHoldRef = useRef(0);
  const faceRef = useRef(false);
  const debugRef = useRef(false);
  const lastDebugRef = useRef(0);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    setLeaders(getTopScores(10));
  }, []);

  const changePhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /* ---- Kamera izni (try-catch) ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Bu tarayıcı kamera erişimini desteklemiyor (HTTPS veya localhost gerekir).");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) setCameraStatus("granted");
      } catch (err) {
        if (!cancelled) {
          setCameraError(describeCameraError(err));
          setCameraStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /* ---- Oyun mantığı ---- */
  const setHold = useCallback((p: number) => {
    if (p === 0 || p === 1 || Math.abs(p - lastHoldRef.current) > 0.03) {
      lastHoldRef.current = p;
      setHoldProgress(p);
    }
  }, []);

  const nextTarget = useCallback(() => {
    const next = (pickerRef.current as ReturnType<typeof createEmojiPicker>).next(scoreRef.current);
    targetRef.current = next;
    setTarget(next);
    holdStartRef.current = null;
    lastMatchRef.current = 0;
    setHold(0);
  }, [setHold]);

  const succeed = useCallback(() => {
    scoreRef.current += 1;
    setScore(scoreRef.current);
    playSuccess();
    setFlashKey((k) => k + 1);
    nextTarget();
  }, [nextTarget]);

  const handleSkip = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    playSkip();
    nextTarget();
  }, [nextTarget]);

  const handleFrame = useCallback(
    (frame: FrameResult) => {
      const hasFace = !!frame.face;
      if (hasFace !== faceRef.current) {
        faceRef.current = hasFace;
        setFaceDetected(hasFace);
      }

      const analysis = analyzeFrame(frame);

      if (debugRef.current) {
        const t = performance.now();
        if (t - lastDebugRef.current > 150) {
          lastDebugRef.current = t;
          setDebugLines(describeAnalysis(analysis));
        }
      }

      if (phaseRef.current !== "playing") return;
      const now = performance.now();

      if (isMatch(targetRef.current.id, analysis)) {
        lastMatchRef.current = now;
        if (holdStartRef.current === null) holdStartRef.current = now;
        const holdMs = holdMsForLevel(getLevel(scoreRef.current));
        const p = Math.min((now - holdStartRef.current) / holdMs, 1);
        if (p >= 1) {
          succeed();
          return;
        }
        setHold(p);
      } else if (holdStartRef.current !== null && now - lastMatchRef.current > THRESHOLDS.graceMs) {
        // Kısa titremeleri tolere et; poz gerçekten bozulduysa sayacı sıfırla.
        holdStartRef.current = null;
        setHold(0);
      }
    },
    [succeed, setHold]
  );

  const { isLoading: modelsLoading, error: modelError } = useMediaPipe({
    videoRef,
    enabled: videoReady,
    onFrame: handleFrame,
    fps: 30,
  });

  /* ---- Faz geçişleri ---- */
  useEffect(() => {
    if (phase === "init" && videoReady && !modelsLoading && !modelError) changePhase("countdown");
  }, [phase, videoReady, modelsLoading, modelError, changePhase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    let n = 3;
    setCountdown(3);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        changePhase("playing");
      } else {
        setCountdown(n);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, changePhase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const start = performance.now();
    const id = setInterval(() => {
      const left = Math.max(0, GAME_MS - (performance.now() - start));
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(id);
        changePhase("done");
        playGameOver();
        onFinishRef.current(scoreRef.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, changePhase]);

  /* ---- Bir emojide 7 sn takılınca Pas Geç butonu dikkat çeksin ---- */
  useEffect(() => {
    setStuck(false);
    if (phase !== "playing") return;
    const id = setTimeout(() => setStuck(true), 7000);
    return () => clearTimeout(id);
  }, [target, phase]);

  /* ---- Klavye: Boşluk = Pas Geç, D = hata ayıklama paneli ---- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) handleSkip();
      } else if (e.code === "KeyD") {
        debugRef.current = !debugRef.current;
        setShowDebug(debugRef.current);
        if (!debugRef.current) setDebugLines([]);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") e.preventDefault(); // odaktaki butonun ikinci kez tetiklenmesini engelle
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [handleSkip]);

  /* ---- Hata ekranları ---- */
  if (cameraStatus === "error" || modelError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#1b0f3d] via-[#120a2b] to-[#0b1030] px-6 text-center">
        <div className="text-6xl">📷</div>
        <p className="max-w-md text-lg text-rose-300">{cameraStatus === "error" ? cameraError : modelError}</p>
        <div className="flex gap-3">
          {cameraStatus === "error" && (
            <Button
              onClick={() => {
                setCameraError(null);
                setCameraStatus("checking");
                setAttempt((a) => a + 1);
              }}
            >
              Tekrar Dene
            </Button>
          )}
          <Button variant="outline" onClick={onExit}>
            Geri Dön
          </Button>
        </div>
      </main>
    );
  }

  const urgent = timeLeft < 10_000;
  const panel =
    "rounded-2xl border border-teal-400/30 bg-[#150f33]/70 shadow-[inset_0_0_40px_rgba(124,58,237,0.15),0_0_30px_rgba(124,58,237,0.15)]";

  return (
    <main className="relative flex min-h-screen flex-col gap-4 bg-gradient-to-br from-[#1b0f3d] via-[#120a2b] to-[#0b1030] p-4">
      {flashKey > 0 && <div key={flashKey} className="flash-overlay" />}

      {/* Üst çubuk: logo, süre çubuğu, süre, skor */}
      <header
        className={`flex items-center gap-4 px-5 py-3 ${panel} border-fuchsia-500/40`}
      >
        <Logo className="h-10 shrink-0" />
        <Progress
          value={(timeLeft / GAME_MS) * 100}
          className="h-4 flex-1 border border-slate-600/50 bg-slate-900/80"
          indicatorClassName={urgent ? "bg-red-500" : "bg-gradient-to-r from-teal-400 to-emerald-400"}
        />
        <span className={`min-w-[6.5rem] text-xl font-bold tabular-nums ${urgent ? "text-red-400" : "text-slate-100"}`}>
          Süre: {Math.ceil(timeLeft / 1000)}s
        </span>
        <span className="rounded-md bg-fuchsia-600/30 px-2 py-1 text-sm font-semibold text-fuchsia-200">
          Seviye {getLevel(score)}
        </span>
        <span className="min-w-[6rem] text-right text-xl font-bold tabular-nums text-teal-300">Skor: {score}</span>
        <Button variant="ghost" size="sm" onClick={onExit} tabIndex={-1} aria-label="Oyundan çık">
          ✕
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Sol panel: hedef emoji + kamera */}
        <section className={`flex flex-col items-center gap-3 px-4 py-5 ${panel}`}>
          <h1 className="text-2xl font-bold text-white">Sıradaki Emoji: Taklit Et!</h1>
          <p className="-mt-2 text-sm text-slate-400">Oyuncu: {playerName}</p>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div
                key={`${target.id}-${score}`}
                className="emoji-pop text-[clamp(4.5rem,15vh,9rem)] leading-none drop-shadow-[0_0_30px_rgba(217,70,239,0.6)]"
              >
                {target.char}
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-200">{target.label}</p>
              <p className="max-w-[16rem] text-sm leading-snug text-fuchsia-200/80">{target.hint}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleSkip}
              onMouseUp={(e) => e.currentTarget.blur()}
              tabIndex={-1}
              disabled={phase !== "playing"}
              className={stuck ? "animate-pulse border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]" : undefined}
            >
              Pas Geç
              <kbd className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-200">Boşluk</kbd>
            </Button>
          </div>

          {/* 1 sn tutma göstergesi */}
          <div className="w-full max-w-md">
            <Progress value={holdProgress * 100} className="h-2 bg-slate-800/80" indicatorClassName="bg-emerald-400" />
          </div>

          {/* Kamera */}
          <div
            className={`relative aspect-video h-[34vh] max-w-full overflow-hidden rounded-2xl border-2 bg-slate-900 transition-all ${
              faceDetected
                ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.6)]"
                : "border-fuchsia-500/70 shadow-[0_0_30px_rgba(217,70,239,0.35)]"
            }`}
          >
            {cameraStatus === "granted" && (
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                onUserMedia={() => {
                  videoRef.current = webcamRef.current?.video ?? null;
                  setVideoReady(true);
                }}
                onUserMediaError={(e) => {
                  setCameraError(describeCameraError(e));
                  setCameraStatus("error");
                }}
                className="h-full w-full object-cover"
              />
            )}

            {phase !== "init" && (
              <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    faceDetected ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                >
                  {faceDetected ? "✓" : "!"}
                </span>
                {faceDetected ? "Yüz Algılandı" : "Yüz Aranıyor..."}
              </div>
            )}

            {phase === "init" && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85">
                <LoadingSpinner label={modelsLoading ? "Yapay Zeka Yükleniyor..." : "Kamera bekleniyor..."} />
              </div>
            )}

            {phase === "countdown" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/70">
                <span className="text-8xl font-black text-fuchsia-300 neon-text">{countdown}</span>
                <span className="text-lg text-slate-200">Hazır ol!</span>
              </div>
            )}

            {showDebug && (
              <pre className="absolute bottom-2 left-2 max-w-[95%] whitespace-pre-wrap rounded-lg bg-black/70 p-2 text-[11px] leading-snug text-lime-300">
                {debugLines.join("\n")}
              </pre>
            )}
          </div>
        </section>

        {/* Sağ panel: Günün Liderleri */}
        <aside className="flex min-h-0 flex-col">
          <Leaderboard entries={leaders} highlightName={playerName} className="flex-1" />
        </aside>
      </div>
    </main>
  );
}
