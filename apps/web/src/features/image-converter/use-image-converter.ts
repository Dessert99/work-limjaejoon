"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { convertImage, validateImageFile } from "./convert-image";
import type { ConversionOptions, ConversionState } from "./types";

const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** 파일·옵션 변경과 비동기 완료의 순서 및 결과 URL 수명을 한곳에서 제어한다. */
export function useImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({ format: "image/webp", quality: 0.85 });
  const [state, setState] = useState<ConversionState>({ status: "idle" });
  const revision = useRef(0);
  const resultUrl = useRef<string | null>(null);

  const invalidate = useCallback(() => {
    // 진행 중인 브라우저 작업을 취소할 수 없어 완료된 결과의 적용을 무효화한다.
    revision.current += 1;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
  }, []);

  // 화면 종료 후의 상태 갱신과 Blob URL 누수를 함께 막는다.
  useEffect(() => invalidate, [invalidate]);

  function selectFiles(files: File[]) {
    invalidate();
    setFile(null);
    try {
      if (files.length !== 1) throw new Error("이미지는 한 번에 한 장씩 선택해 주세요.");
      validateImageFile(files[0]);
      setFile(files[0]);
      setState({ status: "idle" });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "파일을 선택하지 못했습니다." });
    }
  }

  function changeOptions(next: ConversionOptions) {
    invalidate();
    setOptions(next);
    setState({ status: "idle" });
  }

  async function convert() {
    if (!file) return;
    invalidate();
    const currentRevision = revision.current;
    setState({ status: "converting" });
    try {
      const result = await convertImage(file, options);
      // 파일 교체, 옵션 변경, 화면 종료 후에는 이전 작업 결과를 사용하지 않는다.
      if (currentRevision !== revision.current) return;
      const url = URL.createObjectURL(result.blob);
      resultUrl.current = url;
      // 마지막 확장자만 교체하고 이름이 남지 않는 숨김 파일에는 기본 이름을 쓴다.
      const basename = file.name.replace(/\.[^.]*$/, "") || "image";
      setState({ status: "success", result, url, filename: `${basename}.${extensions[options.format]}` });
    } catch (error) {
      if (currentRevision !== revision.current) return;
      setState({ status: "error", message: error instanceof Error ? error.message : "이미지 변환 중 오류가 발생했습니다." });
    }
  }

  return { file, options, state, selectFiles, changeOptions, convert };
}
