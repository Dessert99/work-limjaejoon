import type { Metadata } from "next";
import { StyleCheck } from "@/features/style-check/style-check";

export const metadata: Metadata = {
  title: "페이지 이동 확인",
  description: "페이지 이동과 새로고침 후에도 Emotion 스타일이 유지되는지 확인합니다.",
};

export default function StyleCheckPage() {
  return (
    <StyleCheck
      title="페이지 이동 후 스타일 확인"
      description="이 페이지에서도 카드와 버튼의 스타일이 유지됩니다. 새로고침하거나 처음 페이지로 돌아가 확인해 보세요."
      href="/"
      linkLabel="처음으로 돌아가기"
      secondary
    />
  );
}
