import type { ConversionOptions, ConversionResult } from "./types";

/** 디코딩 전 입력 용량을 제한해 큰 파일의 처리를 피한다. */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
/** Canvas 메모리 사용이 해상도에 비례하므로 픽셀 수를 제한한다. */
export const MAX_IMAGE_PIXELS = 24_000_000;
/** 픽셀 수는 적어도 한 변이 지나치게 긴 이미지는 처리하지 않는다. */
export const MAX_IMAGE_DIMENSION = 8192;

/** 디코딩 전에 처리할 수 없는 입력을 걸러 불필요한 자원 할당을 막는다. */
export function validateImageFile(file: File): void {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("PNG, JPEG, WebP 이미지만 선택할 수 있습니다.");
  }
  if (file.size === 0) throw new Error("비어 있는 파일은 변환할 수 없습니다.");
  if (file.size > MAX_FILE_BYTES) throw new Error("20 MiB 이하의 이미지를 선택해 주세요.");
}

/** React 밖에서도 동일한 변환 정책과 자원 해제를 보장한다. */
export async function convertImage(file: File, options: ConversionOptions): Promise<ConversionResult> {
  validateImageFile(file);
  if (!["image/png", "image/jpeg", "image/webp"].includes(options.format)) {
    throw new Error("지원하지 않는 출력 형식입니다.");
  }
  if (options.format !== "image/png" && (!Number.isFinite(options.quality) || options.quality < 0 || options.quality > 1)) {
    throw new Error("품질은 0부터 100% 사이여야 합니다.");
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error("이 브라우저에서는 이미지 변환을 사용할 수 없습니다. 최신 브라우저를 이용해 주세요.");
  }

  let bitmap: ImageBitmap;
  try {
    // 촬영 방향을 픽셀에 반영해 메타데이터가 사라져도 이미지 방향을 유지한다.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("이미지를 읽을 수 없습니다. 파일이 손상되었거나 지원하지 않는 형식입니다.");
  }

  const canvas = document.createElement("canvas");
  try {
    const { width, height } = bitmap;
    // 디코딩된 크기를 기준으로 Canvas를 할당해 파일의 압축률에 속지 않는다.
    if (width * height > MAX_IMAGE_PIXELS || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      throw new Error("이미지는 2,400만 화소 이하이며 가로와 세로가 각각 8,192px 이하여야 합니다.");
    }
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 처리 공간을 만들 수 없습니다. 다른 탭을 닫고 다시 시도해 주세요.");
    if (options.format === "image/jpeg") {
      // JPEG에는 알파 채널이 없어 투명 영역의 배경색을 명시해야 한다.
      context.fillStyle = options.background;
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, options.format, options.format === "image/png" ? undefined : options.quality);
    });
    if (!blob || blob.size === 0) throw new Error("변환 결과를 만들지 못했습니다. 작은 이미지로 다시 시도해 주세요.");
    // 미지원 형식을 PNG로 대체하는 브라우저에서 확장자와 실제 형식이 어긋나지 않게 한다.
    if (blob.type !== options.format) {
      throw new Error("이 브라우저는 선택한 출력 형식을 지원하지 않습니다. PNG 또는 JPEG를 선택해 주세요.");
    }
    return { blob, width, height };
  } finally {
    // 성공 여부와 관계없이 디코딩 버퍼와 Canvas 메모리를 반환한다.
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
