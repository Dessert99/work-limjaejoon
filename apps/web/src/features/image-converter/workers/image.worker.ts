import { zipSync } from 'fflate';
import { convertImage } from '../libs/convert-image';
import type { ImageRequest, ImageResponse } from '../types/image-converter';

function respond(message: ImageResponse) {
  self.postMessage(message);
}

self.onmessage = async (event: MessageEvent<ImageRequest>) => {
  try {
    const { files, options, cached } = event.data;
    const results = [];
    for (const [index, file] of files.entries()) {
      // 한 번에 하나만 디코딩해 선택한 파일 수만큼 비트맵 메모리가 늘지 않게 한다.
      const result =
        cached?.index === index
          ? cached.result
          : await convertImage(file, options);
      results.push(result);
      respond({ type: 'progress', completed: index + 1, total: files.length });
    }
    if (results.length === 1) {
      respond({
        type: 'result',
        results,
        download: results[0].blob,
        name: results[0].name,
      });
      return;
    }
    const entries: Record<string, Uint8Array> = {};
    for (const [index, result] of results.entries()) {
      // 번호로 경로와 이름 충돌을 막고 이미 압축된 이미지는 ZIP에서 다시 압축하지 않는다.
      entries[`${index + 1}-${result.name}`] = new Uint8Array(
        await result.blob.arrayBuffer()
      );
    }
    const zip = zipSync(entries, { level: 0 });
    respond({
      type: 'result',
      results,
      download: new Blob([zip as Uint8Array<ArrayBuffer>], {
        type: 'application/zip',
      }),
      name: 'images.zip',
    });
  } catch (error) {
    respond({
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : '이미지를 처리하지 못했습니다.',
    });
  }
};
