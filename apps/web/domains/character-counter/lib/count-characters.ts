const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
const encoder = new TextEncoder();

/** 결합 문자와 이모지를 사람이 보는 글자 단위로 세고 두 바이트 기준을 함께 계산한다. */
export function countCharacters(text: string) {
  let characters = 0;
  let withoutSpaces = 0;
  let legacyBytes = 0;
  for (const { segment } of segmenter.segment(text)) {
    characters++;
    if (!/^\s+$/u.test(segment)) withoutSpaces++;
  }
  // 취업 사이트 관행에 따른 값이므로 실제 EUC-KR 인코딩 가능 여부와 구분한다.
  for (const character of text) {
    legacyBytes += character.codePointAt(0)! <= 127 ? 1 : 2;
  }
  return {
    characters,
    withoutSpaces,
    legacyBytes,
    utf8Bytes: encoder.encode(text).byteLength,
  };
}
