import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
