export type EmojiId =
  // yüz
  | "happy"
  | "surprised"
  | "wink"
  | "angry"
  | "kiss"
  | "tongue"
  | "smirk"
  | "browRaise"
  | "sleep"
  | "grin"
  | "puff"
  | "lookSide"
  | "winkTongue"
  // el
  | "thumbsUp"
  | "thumbsDown"
  | "victory"
  | "openHand"
  | "fist"
  | "rock"
  | "call"
  | "pinch"
  | "point"
  | "loveYou"
  | "okHand"
  | "three"
  | "four"
  | "pointRight"
  | "pointLeft"
  | "vulcan"
  // iki el
  | "bothHands"
  | "prayer"
  | "heart"
  // yüz + el
  | "shush"
  | "think";

/** 1 = kolay, 2 = orta, 3 = zor */
export type Tier = 1 | 2 | 3;

export interface EmojiDef {
  id: EmojiId;
  char: string;
  label: string;
  /** Oyuncuya nasıl yapacağını anlatan kısa ipucu. */
  hint: string;
  tier: Tier;
}

export const EMOJIS: EmojiDef[] = [
  // ---- Kolay ----
  { id: "happy", char: "😃", label: "Gülen", hint: "Geniş geniş gülümse", tier: 1 },
  { id: "surprised", char: "😲", label: "Şaşkın", hint: "Ağzını kocaman 'O' gibi aç", tier: 1 },
  { id: "tongue", char: "😛", label: "Dil Çıkar", hint: "Dilini dışarı çıkar", tier: 1 },
  { id: "grin", char: "😁", label: "Sırıtan", hint: "Dişlerini göstererek kocaman sırıt", tier: 1 },
  { id: "thumbsUp", char: "👍", label: "Beğen", hint: "Başparmağını yukarı kaldır, diğerleri kapalı", tier: 1 },
  { id: "openHand", char: "🖐️", label: "Dur", hint: "Elini tamamen aç, parmaklar ayrık", tier: 1 },
  { id: "fist", char: "✊", label: "Yumruk", hint: "Elini sıkı bir yumruk yap", tier: 1 },
  { id: "victory", char: "✌️", label: "Zafer", hint: "İşaret ve orta parmağınla V yap", tier: 1 },
  { id: "point", char: "☝️", label: "Dikkat / 1 Numara", hint: "Sadece işaret parmağını yukarı kaldır", tier: 1 },
  // ---- Orta ----
  { id: "wink", char: "😉", label: "Göz Kırpma", hint: "Bir gözünü kapat, diğeri açık kalsın", tier: 2 },
  { id: "kiss", char: "😘", label: "Öpücük", hint: "Dudaklarını büz, öpücük ver", tier: 2 },
  { id: "angry", char: "😠", label: "Kızgın", hint: "Kaşlarını çat, sert bak", tier: 2 },
  { id: "sleep", char: "😴", label: "Uyuyan", hint: "İki gözünü de kapat", tier: 2 },
  { id: "puff", char: "🐡", label: "Balon Balığı", hint: "Yanaklarını şişir", tier: 2 },
  { id: "lookSide", char: "👀", label: "Yana Bak", hint: "Başını oynatmadan gözlerini bir yana kaydır", tier: 2 },
  { id: "thumbsDown", char: "👎", label: "Beğenmeme", hint: "Başparmağını aşağı çevir, diğerleri kapalı", tier: 2 },
  { id: "rock", char: "🤘", label: "Rock", hint: "İşaret ve serçe parmak havada, başparmak içeride", tier: 2 },
  { id: "call", char: "📞", label: "Beni Ara", hint: "Başparmak ve serçe açık, telefon gibi tut", tier: 2 },
  { id: "loveYou", char: "🤟", label: "Seni Seviyorum", hint: "Başparmak, işaret ve serçe parmak açık", tier: 2 },
  { id: "four", char: "4️⃣", label: "Dört Parmak", hint: "Dört parmağını bitişik aç, başparmak içeride", tier: 2 },
  { id: "pointRight", char: "👉", label: "Sağı Göster", hint: "İşaret parmağınla ekranın sağ tarafını göster", tier: 2 },
  { id: "pointLeft", char: "👈", label: "Solu Göster", hint: "İşaret parmağınla ekranın sol tarafını göster", tier: 2 },
  { id: "bothHands", char: "🙌", label: "İki El Havada", hint: "İki elini birden aç ve kameraya göster", tier: 2 },
  // ---- Zor ----
  { id: "shush", char: "🤫", label: "Sus", hint: "İşaret parmağını dudağına koy", tier: 3 },
  { id: "think", char: "🤔", label: "Düşünen", hint: "İşaret parmağını çenene koy", tier: 3 },
  { id: "smirk", char: "😏", label: "Yan Gülüş", hint: "Ağzının sadece bir köşesini kaldır", tier: 3 },
  { id: "browRaise", char: "🤨", label: "Tek Kaş", hint: "Sadece tek kaşını kaldır", tier: 3 },
  { id: "winkTongue", char: "😜", label: "Çılgın", hint: "Dilini çıkar ve bir gözünü kıs", tier: 3 },
  { id: "pinch", char: "🤏", label: "Çok Az", hint: "Başparmak ve işaret ucunu birbirine yaklaştır", tier: 3 },
  { id: "okHand", char: "👌", label: "Tamam", hint: "Başparmak-işaret halka yap, diğer üçü açık", tier: 3 },
  { id: "three", char: "3️⃣", label: "Üç Parmak", hint: "İşaret, orta ve yüzük parmağını aç", tier: 3 },
  { id: "vulcan", char: "🖖", label: "Spock Selamı", hint: "Parmakları ikişerli ayır: orta ile yüzük arası açık", tier: 3 },
  { id: "prayer", char: "🙏", label: "Teşekkürler", hint: "İki avucunu birbirine yapıştır", tier: 3 },
  { id: "heart", char: "❤️", label: "Kalp", hint: "İki elinle kalp şekli yap", tier: 3 },
];

/* ------------------------------ SEVİYELER ------------------------------ */

/** Skora göre seviye: 1 (0-3), 2 (4-9), 3 (10+). */
export function getLevel(score: number): 1 | 2 | 3 {
  if (score < 4) return 1;
  if (score < 10) return 2;
  return 3;
}

/** Seviye yükseldikçe pozu tutma süresi uzar. */
export function holdMsForLevel(level: 1 | 2 | 3): number {
  return level === 1 ? 1000 : level === 2 ? 1200 : 1400;
}

/**
 * Seviye 1: kolay + orta, seviye 2: zor emojiler de açılır,
 * seviye 3: zor emojiler desteye iki kez girer (daha sık gelir).
 */
function poolForLevel(level: 1 | 2 | 3): EmojiDef[] {
  const base = EMOJIS.filter((e) => (level === 1 ? e.tier <= 2 : true));
  return level === 3 ? [...base, ...EMOJIS.filter((e) => e.tier === 3)] : base;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Yan yana aynı emoji yok ve ilk emoji bir öncekiyle aynı değil mi? */
function isValidDeck(d: EmojiDef[], prev?: EmojiId): boolean {
  if (d.length > 0 && d[0].id === prev) return false;
  for (let i = 1; i < d.length; i++) if (d[i].id === d[i - 1].id) return false;
  return true;
}

/** Geçerli bir sıralama bulunana kadar yeniden karıştırır (eşit olasılıklı, önyargısız). */
function buildDeck(pool: EmojiDef[], prev?: EmojiId): EmojiDef[] {
  let d = shuffle(pool);
  for (let attempt = 0; attempt < 500 && !isValidDeck(d, prev); attempt++) d = shuffle(pool);
  return d;
}

/**
 * Karıştırılmış deste: havuzdaki her emoji bir kez gelmeden hiçbiri tekrar etmez.
 * Böylece rastgele ama "hep aynıları" hissi olmaz; art arda aynı emoji de gelmez.
 */
export function createEmojiPicker() {
  let deck: EmojiDef[] = [];
  let deckLevel: 1 | 2 | 3 | 0 = 0;
  let prev: EmojiId | undefined;

  return {
    next(score: number): EmojiDef {
      const level = getLevel(score);
      if (deck.length === 0 || deckLevel === 0 || level < deckLevel || level - deckLevel > 1) {
        // Deste bitti (yeni tur) ya da beklenmedik seviye atlaması: havuzdan baştan kur.
        deck = buildDeck(poolForLevel(level), prev);
      } else if (level > deckLevel) {
        // Seviye atlandı: kalan desteyi koru, sadece yeni açılan emojileri ona kat.
        // Böylece henüz gelmemiş emojiler kaybolmaz, gelmiş olanlar da hemen tekrar etmez.
        const extra = EMOJIS.filter((e) => e.tier === 3);
        deck = buildDeck([...deck, ...extra], prev);
      }
      deckLevel = level;
      const card = deck.shift() as EmojiDef;
      prev = card.id;
      return card;
    },
  };
}
