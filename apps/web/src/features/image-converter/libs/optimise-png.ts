import initialise, {
  optimise,
  optimise_raw,
} from '@jsquash/oxipng/codec/pkg/squoosh_oxipng.js';

let ready: ReturnType<typeof initialise> | undefined;

/** 별도 격리 헤더 없이 Worker 하나에서 PNG를 무손실 최적화한다. */
export async function optimisePng(
  input: ArrayBuffer | ImageData
): Promise<Blob> {
  // 광고와 정적 호스팅에 추가 제약을 주지 않도록 단일 스레드 WASM을 사용한다.
  ready ??= initialise();
  await ready;
  const bytes =
    input instanceof ImageData
      ? optimise_raw(input.data, input.width, input.height, 2, false, false)
      : optimise(new Uint8Array(input), 2, false, false);
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'image/png' });
}
