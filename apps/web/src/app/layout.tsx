import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EmotionRegistry } from "@/shared/ui/emotion-registry";

export const metadata: Metadata = {
  title: { default: "스타일 검증", template: "%s | 스타일 검증" },
  description: "Next.js 정적 페이지에서 Emotion css prop의 동작을 확인합니다.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <EmotionRegistry>{children}</EmotionRegistry>
      </body>
    </html>
  );
}
