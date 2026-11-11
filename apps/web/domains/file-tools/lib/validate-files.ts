import { fileTools } from '../config/tools';
import type { FileTool } from '../model/file-tools';

/** 업로드 전에 개수와 크기를 막으며 서버 검증을 대신하지 않는다. */
export function validateFiles(
  tool: FileTool,
  files: readonly Pick<File, 'name' | 'size'>[]
) {
  const config = fileTools[tool];
  if (!files.length || files.length > config.maxFiles)
    throw new Error(
      `파일은 1개 이상 ${config.maxFiles}개 이하로 선택해 주세요.`
    );
  let total = 0;
  for (const file of files) {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!(config.extensions as readonly string[]).includes(extension))
      throw new Error(`${file.name}: 지원하지 않는 형식입니다.`);
    if (file.size <= 0 || file.size > 90_000_000)
      throw new Error('각 파일은 0B보다 크고 90MB 이하여야 합니다.');
    total += file.size;
  }
  if (total > 300_000_000)
    throw new Error('파일 합계는 300MB 이하여야 합니다.');
}

/** 화면의 단위 반올림은 원본 바이트 비교와 분리한다. */
export function formatBytes(bytes: number) {
  return bytes < 1_000_000
    ? `${(bytes / 1_000).toFixed(1)} KB`
    : `${(bytes / 1_000_000).toFixed(2)} MB`;
}
