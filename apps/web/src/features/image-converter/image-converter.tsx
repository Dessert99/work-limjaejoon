/** @jsxImportSource @emotion/react */
"use client";

import { css } from "@emotion/react";
import Link from "next/link";
import { ImageInput } from "./components/image-input";
import { ConversionOptions } from "./components/conversion-options";
import { ConversionResult } from "./components/conversion-result";
import { useImageConverter } from "./use-image-converter";

const pageStyle = css({
  boxSizing: "border-box",
  maxWidth: 880,
  margin: "40px auto",
  padding: "0 24px",
  fontFamily: "system-ui, sans-serif",
  color: "#172554",
  lineHeight: 1.7,
  h1: { fontSize: "clamp(28px, 5vw, 40px)", letterSpacing: "-0.04em", marginBottom: 12 },
  h2: { fontSize: 22 },
  "a:focus-visible, button:focus-visible, select:focus-visible, input:focus-visible": { outline: "3px solid #6366f1", outlineOffset: 3 },
  "@media (max-width: 600px)": { margin: "24px auto", padding: "0 16px" },
});
const toolStyle = css({
  margin: "32px 0",
  padding: 24,
  border: "1px solid #cbd5e1",
  borderRadius: 20,
  background: "white",
});
const buttonStyle = css({
  padding: "12px 24px",
  border: 0,
  borderRadius: 8,
  background: "#4338ca",
  color: "white",
  font: "inherit",
  fontWeight: 700,
  cursor: "pointer",
  "&:hover:not(:disabled)": { background: "#3730a3" },
  "&:disabled": { background: "#e2e8f0", color: "#475569", cursor: "not-allowed" },
});
const errorStyle = css({ color: "#991b1b", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 });

/** 파일 입력부터 결과 다운로드까지 필요한 화면과 작업 상태만 연결한다. */
export function ImageConverter() {
  const { file, options, state, selectFiles, changeOptions, convert } = useImageConverter();

  return (
    <main css={pageStyle}>
      <nav aria-label="도구 탐색"><Link href="/">처음으로</Link></nav>
      <h1>이미지 변환</h1>
      <div css={toolStyle}>
        <ImageInput file={file} onFiles={selectFiles} />
        <ConversionOptions value={options} onChange={changeOptions} />
        <button
          type="button"
          css={buttonStyle}
          disabled={!file || state.status === "converting"}
          onClick={convert}
        >
          {state.status === "converting" ? "변환 중…" : "이미지 변환"}
        </button>
        <p role="status">{state.status === "converting" ? "이미지를 변환하고 있습니다." : state.status === "success" ? "변환이 완료되었습니다." : ""}</p>
        {state.status === "error" && <p role="alert" css={errorStyle}>{state.message}</p>}
        {state.status === "success" && file && <ConversionResult state={state} originalSize={file.size} />}
      </div>
    </main>
  );
}
