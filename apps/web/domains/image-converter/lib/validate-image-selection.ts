/** 비트맵을 만들기 전에 파일 개수와 합산 용량의 임시 안전 상한을 확인한다. */
export function validateImageSelection(
  files: readonly { name: string; size: number }[]
) {
  if (files.length > 30)
    throw new Error('이미지는 한 번에 30장까지 선택해 주세요.');
  if (files.some((file) => !file.size || file.size > 90_000_000))
    throw new Error('각 파일은 0B보다 크고 90MB 이하여야 합니다.');
  if (files.reduce((total, file) => total + file.size, 0) > 300_000_000)
    throw new Error('선택한 파일의 합계는 300MB 이하여야 합니다.');
  if (files.some((file) => !/\.(jpe?g|png|webp)$/i.test(file.name)))
    throw new Error(
      'JPG·PNG·WebP 파일을 선택해 주세요. HEIC는 지원하지 않습니다.'
    );
}
