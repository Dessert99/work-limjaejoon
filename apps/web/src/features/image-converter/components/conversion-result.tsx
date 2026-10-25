/** @jsxImportSource @emotion/react */
"use client";

import { css } from "@emotion/react";
import type { ConversionState } from "../types";

const resultStyle = css({
  marginTop: 32,
  paddingTop: 24,
  borderTop: "1px solid #cbd5e1",
  img: {
    display: "block",
    width: "auto",
    height: "auto",
    maxWidth: "100%",
    maxHeight: 400,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
  },
  dl: { display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 20px", fontSize: 14 },
  dd: { margin: 0, overflowWrap: "anywhere" },
  a: { display: "inline-block", padding: "12px 20px", borderRadius: 8, background: "#166534", color: "white", textDecoration: "none", fontWeight: 700 },
});

/** 성공한 결과만 표시하고 용량 증가도 드러내 사용자가 다운로드를 판단하게 한다. */
export function ConversionResult({ state, originalSize }: {
  state: Extract<ConversionState, { status: "success" }>;
  originalSize: number;
}) {
  const { result, url, filename } = state;
  const bytes = new Intl.NumberFormat("ko-KR");
  const difference = Math.round((1 - result.blob.size / originalSize) * 100);

  // 로컬 Blob 미리보기는 Next.js 이미지 최적화 대상이 아니다.
  return (
    <section css={resultStyle} aria-labelledby="conversion-result-title">
      <h2 id="conversion-result-title">변환 결과</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="변환된 이미지 미리보기" width={result.width} height={result.height} />
      <dl>
        <dt>파일 이름</dt><dd>{filename}</dd>
        <dt>해상도</dt><dd>{result.width} × {result.height}px</dd>
        <dt>원본 크기</dt><dd>{bytes.format(originalSize)} 바이트</dd>
        <dt>변환 크기</dt><dd>{bytes.format(result.blob.size)} 바이트 ({Math.abs(difference)}% {difference >= 0 ? "감소" : "증가"})</dd>
      </dl>
      <a href={url} download={filename}>변환 이미지 다운로드</a>
    </section>
  );
}
