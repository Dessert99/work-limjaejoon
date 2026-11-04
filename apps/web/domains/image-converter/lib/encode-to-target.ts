/** 목표 용량 안에서 높은 품질을 탐색하며 도달하지 못하면 검사한 가장 작은 결과를 반환한다. */
export async function encodeToTarget(
  encode: (quality: number) => Promise<Blob>,
  targetBytes: number
): Promise<Blob> {
  const highest = await encode(100);
  if (highest.size <= targetBytes) return highest;
  const lowest = await encode(1);
  if (lowest.size > targetBytes)
    return lowest.size < highest.size ? lowest : highest;
  let result = lowest;
  let low = 2;
  let high = 99;
  // 코덱 품질은 연속적인 용량 비율이 아니므로 최대 9회 실제 인코딩으로 근사한다.
  while (low <= high) {
    const quality = Math.floor((low + high) / 2);
    const candidate = await encode(quality);
    if (candidate.size <= targetBytes) {
      result = candidate;
      low = quality + 1;
    } else {
      high = quality - 1;
    }
  }
  return result;
}
