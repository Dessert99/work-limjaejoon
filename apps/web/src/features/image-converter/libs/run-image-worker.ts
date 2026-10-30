import type { ImageRequest, ImageResponse } from '../types/image-converter';

/** 실행 중 옵션이 바뀌면 Worker 자체를 종료해 이전 변환의 연산도 중단한다. */
export function runImageWorker(
  request: ImageRequest,
  onMessage: (message: ImageResponse) => void
): () => void {
  const worker = new Worker(
    new URL('../workers/image.worker.ts', import.meta.url)
  );
  worker.onmessage = (event: MessageEvent<ImageResponse>) => {
    if (event.data.type !== 'progress') worker.terminate();
    onMessage(event.data);
  };
  worker.onerror = () => {
    worker.terminate();
    onMessage({
      type: 'error',
      message:
        '이미지 처리 기능을 실행하지 못했습니다. 최신 브라우저에서 다시 시도해 주세요.',
    });
  };
  worker.onmessageerror = () => {
    worker.terminate();
    onMessage({
      type: 'error',
      message: '이미지 처리 결과를 읽지 못했습니다.',
    });
  };
  worker.postMessage(request);
  return () => worker.terminate();
}
