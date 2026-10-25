/** @jsxImportSource @emotion/react */
"use client";

import { css } from "@emotion/react";
import { MAX_FILE_BYTES } from "../convert-image";

const inputStyle = css({
  padding: 24,
  border: "2px dashed #a5b4fc",
  borderRadius: 16,
  background: "#f5f7ff",
  "&:focus-within": { outline: "3px solid #6366f1", outlineOffset: 3 },
  label: { display: "block", fontWeight: 700, cursor: "pointer", color: "#4338ca", textDecoration: "underline", textUnderlineOffset: 4 },
  input: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    border: 0,
  },
  p: { marginBottom: 0, fontSize: 14, overflowWrap: "anywhere" },
});

/** 파일 입력의 키보드 접근성을 유지하면서 드롭도 같은 검증 경로로 전달한다. */
export function ImageInput({ file, onFiles }: { file: File | null; onFiles: (files: File[]) => void }) {
  // 네이티브 입력을 시각적으로 숨겨도 탭 이동과 파일 선택 대화상자는 유지한다.
  return (
    <div
      css={inputStyle}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <label htmlFor="image-file">이미지 선택 또는 여기에 끌어 놓기</label>
      <input
        id="image-file"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-describedby="image-file-help image-file-selection"
        onChange={(event) => {
          if (event.currentTarget.files?.length) onFiles(Array.from(event.currentTarget.files));
          // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 비운다.
          event.currentTarget.value = "";
        }}
      />
      <p id="image-file-help">PNG, JPEG, WebP · 한 장당 최대 {MAX_FILE_BYTES / 1024 / 1024} MiB</p>
      <p id="image-file-selection" aria-live="polite">
        {file ? `선택한 파일: ${file.name} (${new Intl.NumberFormat("ko-KR").format(file.size)} 바이트)` : "선택한 이미지가 없습니다."}
      </p>
    </div>
  );
}
