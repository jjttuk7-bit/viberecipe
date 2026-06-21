import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// D-026 디자인 시스템 — 폰트 3종.
// Pretendard는 Google Fonts 미등록이라 시스템 fallback chain만 globals.css에서 처리.
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-newsreader",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "바이브 레시피",
  description:
    "레시피를 코드처럼 빌드하고, 부엌에서 실행하고, 결과를 다음 빌드로 되먹이는 페어 쿠킹 IDE.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  return (
    <html
      lang="ko"
      className={`${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
