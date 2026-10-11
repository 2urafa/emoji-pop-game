import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emoji Mimic — Emoji Taklitçisi",
  description: "Yüzünle ve elinle emojileri taklit et, 60 saniyede en yüksek skoru yap!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-950 text-slate-50 antialiased">{children}</body>
    </html>
  );
}
