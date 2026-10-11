"use client";

import { useEffect, useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { GameScreen } from "@/components/GameScreen";
import { GameOver } from "@/components/GameOver";
import { preloadModels } from "@/lib/mediapipe";
import { saveScore } from "@/lib/leaderboard";
import { unlockAudio } from "@/lib/sounds";

type Screen = "welcome" | "game" | "over";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [name, setName] = useState("");
  const [score, setScore] = useState(0);
  // Her oyun için yeni bir GameScreen örneği (state sıfırlansın) diye anahtar.
  const [round, setRound] = useState(0);

  // Karşılama ekranındayken modelleri arka planda ısıt.
  useEffect(() => {
    preloadModels();
  }, []);

  const start = (playerName: string) => {
    setName(playerName);
    setRound((r) => r + 1);
    setScreen("game");
  };

  const finish = (finalScore: number) => {
    saveScore(name, finalScore);
    setScore(finalScore);
    setScreen("over");
  };

  if (screen === "game") {
    return <GameScreen key={round} playerName={name} onFinish={finish} onExit={() => setScreen("welcome")} />;
  }

  if (screen === "over") {
    return (
      <GameOver
        name={name}
        score={score}
        onReplay={() => {
          unlockAudio();
          start(name);
        }}
        onHome={() => {
          setName("");
          setScreen("welcome");
        }}
      />
    );
  }

  return <WelcomeScreen initialName={name} onStart={start} />;
}
