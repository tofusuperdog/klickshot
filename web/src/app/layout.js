import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "minChap - ดูซีรีส์และหนังแนวตั้งบน TikTok",
  description: "minChap แพลตฟอร์มดูซีรีส์และหนังภาพยนตร์แนวตั้งแบบสั้น (Vertical Short Drama) ที่จะมามอบความบันเทิงรูปแบบใหม่บน TikTok ให้คุณรับชมได้อย่างเพลิดเพลิน",
  keywords: ["minChap", "มินแชป", "หนังแนวตั้ง", "ซีรีส์แนวตั้ง", "TikTok", "Short Drama", "มินิซีรีส์"],
  openGraph: {
    title: "minChap - ดูซีรีส์และหนังแนวตั้ง",
    description: "แอปพลิเคชันดูหนังและมินิซีรีส์แนวตั้งแบบสั้นสุดฮิต สนุกครบทุกอารมณ์ ค้นหาความบันเทิงได้แล้วที่ minChap บน TikTok",
    type: "website",
    locale: "th_TH",
    siteName: "minChap",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
