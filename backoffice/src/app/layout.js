import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  display: 'swap',
});

export const metadata = {
  title: "minChap TikTok Minis CMS",
  description: "ระบบจัดการเนื้อหา (CMS) สำหรับ minChap TikTok Minis",
  keywords: ["minChap", "TikTok", "Minis", "CMS", "Content Management System", "Series"],
  authors: [{ name: "minChap" }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "minChap TikTok Minis CMS",
    description: "ระบบจัดการเนื้อหา (CMS) สำหรับ minChap TikTok Minis",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${ibmPlexSansThai.className} min-h-full flex flex-col`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
