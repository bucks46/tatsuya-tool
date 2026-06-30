import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "通信費まるごと試算ツール | 楽天モバイル",
  description: "月のデータ使用量を入力するだけで、主要キャリアの料金を正直に比較。最安プランをすぐに確認できます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-white">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
