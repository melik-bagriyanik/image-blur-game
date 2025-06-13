import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google"; // Oswald'ı ekledik
import "./globals.css";

// Font tanımları
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"], // isteğe göre ağırlıklar
});

export const metadata: Metadata = {
  title: "Movie Game",
  description: "A fun movie guessing game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable}`}>
        {children}
      </body>
    </html>
  );
}
