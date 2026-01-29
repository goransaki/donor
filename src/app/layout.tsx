import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ДДК",
  description: "Апликација за управљање донорима крви",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr-Cyrl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
