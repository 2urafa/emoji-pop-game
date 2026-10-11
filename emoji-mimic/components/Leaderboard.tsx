import { cn } from "@/lib/utils";
import type { ScoreEntry } from "@/lib/leaderboard";

const MEDAL_STYLES = ["bg-amber-300", "bg-slate-300", "bg-orange-400"];

interface LeaderboardProps {
  entries: ScoreEntry[];
  highlightName?: string;
  title?: string;
  className?: string;
}

export function Leaderboard({ entries, highlightName, title = "Günün Liderleri", className }: LeaderboardProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-2xl border border-teal-400/30 bg-[#150f33]/70 p-5 shadow-[inset_0_0_40px_rgba(124,58,237,0.15),0_0_30px_rgba(124,58,237,0.15)]",
        className
      )}
    >
      <h2 className="mb-4 text-center text-2xl font-bold text-white">{title}</h2>

      <div className="grid grid-cols-[3.5rem_1fr_3.5rem] border-b border-slate-600/60 pb-2 text-sm font-semibold text-slate-300">
        <span>Sıra</span>
        <span>Yarışmacı Adı</span>
        <span className="text-right">Skor</span>
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-slate-400">Henüz skor yok. İlk sen ol!</p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto">
          {entries.map((e, i) => {
            const mine = !!highlightName && e.name.toLowerCase() === highlightName.toLowerCase();
            return (
              <li
                key={`${e.name}-${e.date}`}
                className={cn(
                  "grid grid-cols-[3.5rem_1fr_3.5rem] items-center border-b border-slate-700/50 py-2 text-slate-100",
                  mine && "rounded-md bg-fuchsia-600/25 ring-1 ring-fuchsia-400"
                )}
              >
                <span>
                  {i < 3 ? (
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-slate-900",
                        MEDAL_STYLES[i]
                      )}
                    >
                      {i + 1}
                    </span>
                  ) : (
                    <span className="pl-1 text-slate-300">{i + 1}.</span>
                  )}
                </span>
                <span className="truncate pr-2 font-medium">{e.name}</span>
                <span className="text-right font-semibold tabular-nums">{e.score}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
