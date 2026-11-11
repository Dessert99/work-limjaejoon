import { expect, it } from 'vitest';
import { validateImageSelection } from './validate-image-selection';

it('선택 상한을 실제 파일 내용을 할당하지 않고 검사한다', () => {
  expect(() =>
    validateImageSelection(
      Array.from({ length: 30 }, () => ({ name: '사진.jpg', size: 1 }))
    )
  ).not.toThrow();
  expect(() =>
    validateImageSelection(
      Array.from({ length: 31 }, () => ({ name: '사진.jpg', size: 1 }))
    )
  ).toThrow('30장');
  expect(() =>
    validateImageSelection([{ name: '사진.jpg', size: 90_000_001 }])
  ).toThrow('90MB');
  expect(() =>
    validateImageSelection(
      Array.from({ length: 4 }, () => ({ name: '사진.jpg', size: 80_000_000 }))
    )
  ).toThrow('300MB');
});

it('빈 파일과 지원하지 않는 확장자를 변환 전에 거부한다', () => {
  expect(() => validateImageSelection([{ name: '사진.png', size: 0 }])).toThrow(
    '0B'
  );
  expect(() =>
    validateImageSelection([{ name: '사진.heic', size: 1 }])
  ).toThrow('HEIC');
});
