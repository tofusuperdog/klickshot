import "./globals.css";

export const metadata = {
  title: "Klickshot Partner",
  description: "Partner dashboard for Klickshot Series",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
