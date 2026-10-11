"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaderboard } from "@/components/Leaderboard";
import { Logo } from "@/components/Logo";
import { getTopScores, type ScoreEntry } from "@/lib/leaderboard";
import { unlockAudio } from "@/lib/sounds";

export function WelcomeScreen({ initialName = "", onStart }: { initialName?: string; onStart: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  const [entries, setEntries] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    setEntries(getTopScores(10));
  }, []);

  const trimmed = name.trim();

  const start = () => {
    if (!trimmed) return;
    unlockAudio();
    onStart(trimmed);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-7 overflow-hidden bg-gradient-to-br from-[#1b0f3d] via-[#120a2b] to-[#0b1030] px-4 py-8">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-600/25 blur-[120px]" />

      <div className="z-10 flex flex-col items-center text-center">
        <Logo className="h-24 md:h-32" />
        <h1 className="mt-6 bg-gradient-to-r from-fuchsia-400 via-purple-400 to-rose-400 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent md:text-7xl">
          Emoji Mimic
        </h1>
        <p className="mt-3 text-lg text-slate-300">
          Ekrandaki emojiyi yüzün ve elinle taklit et. <b className="text-fuchsia-300">60 saniyede</b> en çok emojiyi yakala!
        </p>
      </div>

      <div className="z-10 flex w-full max-w-md flex-col gap-4">
        <Input
          autoFocus
          maxLength={20}
          placeholder="Adını yaz..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start()}
          aria-label="Oyuncu adı"
        />
        <Button size="lg" onClick={start} disabled={!trimmed}>
          Başla 🚀
        </Button>
        <p className="text-center text-sm text-slate-500">Kamera izni istenecek. Görüntü bilgisayarından çıkmaz.</p>
      </div>

      <div className="z-10 w-full max-w-md">
        <Leaderboard entries={entries} />
      </div>
    </main>
  );
}
