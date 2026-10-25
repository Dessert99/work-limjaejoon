/** @jsxImportSource @emotion/react */
"use client";

import { css } from "@emotion/react";
import type { ConversionOptions as Options } from "../types";

const optionsStyle = css({
  display: "grid",
  gap: 20,
  margin: "24px 0",
  padding: 0,
  border: 0,
  legend: { marginBottom: 16, fontWeight: 700 },
  label: { display: "block", marginBottom: 8 },
  select: { padding: "10px 14px", border: "1px solid #94a3b8", borderRadius: 8, font: "inherit", background: "white" },
  input: { display: "block", width: "100%", maxWidth: 360, accentColor: "#4338ca" },
  p: { margin: 0, color: "#475569", fontSize: 14 },
});

/** 출력 형식에 유효한 설정만 노출해 변환 옵션과 화면의 불일치를 막는다. */
export function ConversionOptions({ value, onChange }: { value: Options; onChange: (value: Options) => void }) {
  return (
    <fieldset css={optionsStyle}>
      <legend>변환 설정</legend>
      <div>
        <label htmlFor="output-format">출력 형식</label>
        <select
          id="output-format"
          value={value.format}
          onChange={(event) => {
            // 손실 압축 형식끼리 전환할 때 사용자가 고른 품질을 유지한다.
            const quality = value.format === "image/png" ? 0.85 : value.quality;
            switch (event.target.value) {
              case "image/png":
                onChange({ format: "image/png" });
                break;
              case "image/jpeg":
                onChange({ format: "image/jpeg", quality, background: "#ffffff" });
                break;
              case "image/webp":
                onChange({ format: "image/webp", quality });
                break;
            }
          }}
        >
          <option value="image/webp">WebP</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
        </select>
      </div>
      {value.format !== "image/png" && (
        <div>
          <label htmlFor="output-quality">품질: {Math.round(value.quality * 100)}%</label>
          <input
            id="output-quality"
            type="range"
            min="1"
            max="100"
            value={Math.round(value.quality * 100)}
            onChange={(event) => onChange({ ...value, quality: Number(event.target.value) / 100 })}
          />
        </div>
      )}
      <p>{value.format === "image/jpeg" ? "JPEG는 투명한 부분을 흰색 배경으로 바꿉니다." : "PNG와 WebP는 투명한 부분을 유지합니다."}</p>
    </fieldset>
  );
}
