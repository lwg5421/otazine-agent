import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "OTAZIN Agent — AI 뉴스 에이전트",
  description: "애니메이션 뉴스를 자동으로 수집·작성·검토하는 AI 에이전트 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
