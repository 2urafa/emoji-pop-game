const KEY = "emoji-mimic-leaderboard-v1";

export interface ScoreEntry {
  name: string;
  score: number;
  date: number;
}

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ScoreEntry =>
        !!e && typeof e.name === "string" && typeof e.score === "number" && typeof e.date === "number"
    );
  } catch {
    return [];
  }
}

function sortEntries(entries: ScoreEntry[]): ScoreEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || a.date - b.date);
}

/** Aynı isim (büyük/küçük harf duyarsız) için sadece en iyi skor tutulur. */
export function saveScore(name: string, score: number): ScoreEntry[] {
  const entries = loadScores();
  const idx = entries.findIndex((e) => e.name.toLowerCase() === name.toLowerCase());
  if (idx >= 0) {
    if (score > entries[idx].score) entries[idx] = { name, score, date: Date.now() };
  } else {
    entries.push({ name, score, date: Date.now() });
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* depolama dolu / kapalı: sessizce geç */
  }
  return entries;
}

export function getTopScores(limit = 10, entries: ScoreEntry[] = loadScores()): ScoreEntry[] {
  return sortEntries(entries).slice(0, limit);
}

/** 1 tabanlı sıra; bulunamazsa 0. */
export function getRank(name: string, entries: ScoreEntry[] = loadScores()): number {
  return sortEntries(entries).findIndex((e) => e.name.toLowerCase() === name.toLowerCase()) + 1;
}
