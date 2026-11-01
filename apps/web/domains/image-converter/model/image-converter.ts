/** 브라우저가 실제로 출력했는지 확인할 이미지 형식이다. */
export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

/** 미리보기와 다운로드에 같은 변환 조건을 적용한다. */
export type ConvertOptions = {
  format: ImageFormat;
  quality: number;
  maxDimension: number | null;
};

/** 원본과 결과의 비교에 필요한 정보만 UI에 전달한다. */
export type ImageResult = {
  blob: Blob;
  name: string;
  originalSize: number;
  width: number;
  height: number;
  originalReturned: boolean;
};

/** Worker 내부의 순차 처리와 결과 재사용에 필요한 요청이다. */
export type ImageRequest = {
  files: File[];
  options: ConvertOptions;
  cached?: { index: number; result: ImageResult };
};

/** 큰 원본 버퍼를 돌려보내지 않고 진행 상태와 결과만 전달한다. */
export type ImageResponse =
  | { type: 'progress'; completed: number; total: number }
  | { type: 'result'; results: ImageResult[]; download: Blob; name: string }
  | { type: 'error'; message: string };
