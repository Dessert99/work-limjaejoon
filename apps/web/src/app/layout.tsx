import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EmotionRegistry } from "@/shared/ui/emotion-registry";

/** 페이지별 메타데이터가 없는 경로에도 기본 검색 정보를 제공한다. */
export const metadata: Metadata = {
  title: "이미지 도구",
  description: "브라우저에서 이미지를 변환합니다.",
};

/** 서버 페이지 경계를 유지하면서 모든 경로에 동일한 스타일 캐시를 제공한다. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <EmotionRegistry>{children}</EmotionRegistry>
      </body>
    </html>
  );
}
