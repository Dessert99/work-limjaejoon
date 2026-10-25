import Link from "next/link";

/** 임시 검증 화면 없이 실제 도구에 진입할 경로만 제공한다. */
export default function HomePage() {
  return <main><Link href="/tools/image-converter/">이미지 변환</Link></main>;
}
