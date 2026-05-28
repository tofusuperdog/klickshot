import "./globals.css";
import { PartnerLanguageProvider } from "@/components/PartnerLanguageProvider";

export const metadata = {
  title: "Klickshot Partner",
  description: "Partner dashboard for Klickshot Series",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <PartnerLanguageProvider>{children}</PartnerLanguageProvider>
      </body>
    </html>
  );
}
