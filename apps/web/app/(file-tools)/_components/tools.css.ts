import { style } from '@vanilla-extract/css';
import { paperTheme as theme } from '@/lib/styles/tokens';

/** 기존 이미지 도구와 같은 작업대 색상으로 문서 도구를 묶는다. */
export const page = style({
  minHeight: '100svh',
  boxSizing: 'border-box',
  background: theme.desk,
  color: theme.ink,
  fontFamily: theme.bodyFont,
  padding: '40px 20px 80px',
  lineHeight: 1.6,
});
/** 긴 파일 이름에도 화면 폭을 유지한다. */
export const content = style({ maxWidth: 960, margin: '0 auto', minWidth: 0 });
/** 보조 도구 이동은 처리 버튼과 시각적으로 구분한다. */
export const nav = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px 20px',
  marginBottom: 28,
  fontSize: 14,
});
/** 페이지 제목은 부분 글꼴에 없는 문자를 기본 한글 글꼴로 표시한다. */
export const heading = style({
  fontSize: 'clamp(26px, 5vw, 38px)',
  color: theme.title,
  margin: '0 0 12px',
});
/** 본문과 입력을 종이 위에 배치한다. */
export const panel = style({
  background: theme.paper,
  padding: 'clamp(16px, 4vw, 32px)',
  borderRadius: 12,
  boxShadow: `0 8px 24px rgba(${theme.shadowRgb}, 0.1)`,
  marginTop: 24,
});
/** 오류와 제한 설명은 읽을 수 있는 대비를 유지한다. */
export const note = style({ fontSize: 14, margin: '10px 0' });
/** 파일 선택과 실행 버튼은 좁은 화면에서 줄바꿈한다. */
export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  margin: '16px 0',
});
/** 버튼은 키보드 초점과 비활성 상태를 드러낸다. */
export const button = style({
  background: theme.buttonTop,
  color: theme.buttonInk,
  border: `1px solid ${theme.rangeThumbBorder}`,
  borderRadius: 7,
  padding: '10px 16px',
  cursor: 'pointer',
  font: 'inherit',
  ':disabled': { opacity: 0.5, cursor: 'default' },
  ':focus-visible': {
    outline: `3px solid ${theme.rangeFill}`,
    outlineOffset: 3,
  },
});
/** 입력은 작은 화면에서도 부모 영역을 넘지 않는다. */
export const input = style({
  maxWidth: '100%',
  boxSizing: 'border-box',
  font: 'inherit',
  color: theme.ink,
  background: theme.paper,
  border: `1px solid ${theme.rangeThumbBorder}`,
  borderRadius: 5,
  padding: 8,
});
/** 범위 입력은 줄마다 다른 결과를 요청한다. */
export const textarea = style([
  input,
  { display: 'block', width: '100%', minHeight: 100, marginTop: 8 },
]);
/** 파일 목록은 긴 이름과 조작 버튼이 함께 보이도록 줄바꿈한다. */
export const item = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  borderBottom: `1px solid ${theme.photo}`,
  padding: '10px 0',
  overflowWrap: 'anywhere',
});
/** 파일 이름이 버튼보다 먼저 남은 너비를 사용한다. */
export const filename = style({ flex: '1 1 220px', minWidth: 0 });
/** 페이지 편집은 썸네일과 번호를 함께 표시한다. */
export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
  gap: 16,
  marginTop: 20,
});
/** 각 페이지의 이동과 회전 조작을 같은 카드에 둔다. */
export const card = style({
  border: `1px solid ${theme.rangeThumbBorder}`,
  borderRadius: 8,
  padding: 12,
  textAlign: 'center',
  overflow: 'hidden',
});
/** 썸네일은 원본 페이지 비율을 유지한다. */
export const thumbnail = style({
  width: '100%',
  height: 180,
  objectFit: 'contain',
  background: theme.photo,
});
/** 진행 상태는 입력 아래에서 즉시 읽을 수 있게 한다. */
export const status = style({
  padding: 16,
  background: theme.settingsPaper,
  borderRadius: 8,
  marginTop: 16,
});

/** 기본 fieldset 테두리 대신 작업대 안에서 옵션을 묶는다. */
export const options = style({ border: 0, padding: 0, margin: 0, minWidth: 0 });

/** 화면 밖 Canvas를 비워도 카드 높이는 유지해 불필요한 재배치를 막는다. */
export const thumbnailFrame = style({
  height: 180,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.photo,
});
/** 작은 PDF Canvas를 확대하지 않고 실제 문서 비율로 표시한다. */
export const canvas = style({
  maxWidth: '100%',
  maxHeight: 180,
  objectFit: 'contain',
});
