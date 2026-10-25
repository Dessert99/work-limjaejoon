import type { Metadata } from "next";
import { StyleCheck } from "@/features/style-check/style-check";

export const metadata: Metadata = { title: "환경 확인" };

export default function HomePage() {
  return (
    <StyleCheck
      title="Next.js + Emotion 환경 확인"
      description="이 페이지의 본문과 스타일은 정적 HTML에 포함됩니다. 버튼을 눌러 스타일 변경도 확인할 수 있습니다."
      href="/style-check/"
      linkLabel="페이지 이동 확인"
    />
  );
}
