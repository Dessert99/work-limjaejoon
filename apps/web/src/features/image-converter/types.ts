/** PNG에 무효한 품질 옵션이 전달되지 않도록 형식별 옵션을 제한한다. */
export type ConversionOptions =
  | { format: "image/png" }
  | { format: "image/jpeg"; quality: number; background: "#ffffff" }
  | { format: "image/webp"; quality: number };

/** 화면이 Canvas 구현에 의존하지 않고 결과를 사용할 수 있게 한다. */
export type ConversionResult = {
  blob: Blob;
  width: number;
  height: number;
};

/** 작업 상태에 맞지 않는 결과와 오류가 동시에 노출되지 않게 한다. */
export type ConversionState =
  | { status: "idle" }
  | { status: "converting" }
  | { status: "success"; result: ConversionResult; url: string; filename: string }
  | { status: "error"; message: string };
