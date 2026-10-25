import type { Metadata } from "next";
import { ImageConverter } from "@/features/image-converter/image-converter";

/** 검색과 공유 미리보기에서 지원 형식과 로컬 처리 방식을 알린다. */
export const metadata: Metadata = {
  title: { absolute: "이미지 변환 | PNG, JPEG, WebP 무료 변환" },
  description: "PNG, JPEG, WebP 이미지를 브라우저에서 변환하세요. 파일을 서버에 업로드하지 않고 품질 조절, 미리보기, 다운로드를 제공합니다.",
};

/** 메타데이터는 서버에 유지하고 변환에 필요한 화면만 제공한다. */
export default function ImageConverterPage() {
  return <ImageConverter />;
}
