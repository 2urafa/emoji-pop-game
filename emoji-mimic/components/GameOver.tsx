"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaderboard } from "@/components/Leaderboard";
import { Logo } from "@/components/Logo";
import { getRank, getTopScores, loadScores, type ScoreEntry } from "@/lib/leaderboard";

interface GameOverProps {
  name: string;
  score: number;
  onReplay: () => void;
  onHome: () => void;
}

export function GameOver({ name, score, onReplay, onHome }: GameOverProps) {
  const [top, setTop] = useState<ScoreEntry[]>([]);
  const [rank, setRank] = useState(0);

  useEffect(() => {
    const all = loadScores();
    setTop(getTopScores(10, all));
    setRank(getRank(name, all));
  }, [name]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#1b0f3d] via-[#120a2b] to-[#0b1030] px-4 py-8">
      <Logo className="h-16" />
      <div className="text-center">
        <p className="text-xl text-slate-400">Süre doldu!</p>
        <h1 className="mt-1 text-4xl font-extrabold text-fuchsia-300 neon-text">{name}</h1>
        <div className="mt-4 text-8xl font-black text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]">{score}</div>
        <p className="text-slate-400">emoji yakaladın</p>
        {rank > 0 && (
          <p className="mt-2 text-lg text-slate-200">
            Sıralaman: <b className="text-fuchsia-300">#{rank}</b>
          </p>
        )}
      </div>

      <div className="w-full max-w-md">
        <Leaderboard entries={top} highlightName={name} />
      </div>

      <div className="flex w-full max-w-md gap-3">
        <Button size="lg" className="flex-1" onClick={onReplay}>
          Tekrar Oyna
        </Button>
        <Button size="lg" variant="outline" className="flex-1" onClick={onHome}>
          Ana Menü
        </Button>
      </div>
    </main>
  );
}
