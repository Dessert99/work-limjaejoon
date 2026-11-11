import { describe, expect, it } from 'vitest';
import { countCharacters } from './count-characters';

describe('글자 수와 바이트 수', () => {
  it('공백과 결합된 이모지를 구분하고 한글의 두 바이트 기준을 계산한다', () => {
    expect(countCharacters('한글 👩‍💻')).toEqual({
      characters: 4,
      withoutSpaces: 3,
      legacyBytes: 11,
      utf8Bytes: 18,
    });
    expect(countCharacters('한')).toMatchObject({
      legacyBytes: 2,
      utf8Bytes: 3,
    });
  });

  it('빈 글과 결합 문자, 줄바꿈 및 탭을 처리한다', () => {
    expect(countCharacters('')).toEqual({
      characters: 0,
      withoutSpaces: 0,
      legacyBytes: 0,
      utf8Bytes: 0,
    });
    expect(countCharacters('e\u0301\n\t')).toMatchObject({
      characters: 3,
      withoutSpaces: 1,
      legacyBytes: 5,
    });
  });
});
