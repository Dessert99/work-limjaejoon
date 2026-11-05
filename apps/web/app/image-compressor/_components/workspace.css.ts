import { globalFontFace, globalStyle, style } from '@vanilla-extract/css';
import { paperTheme as theme } from '@/lib/styles/tokens';

globalFontFace('Workspace Serif', {
  src: 'url("/fonts/noto-serif-kr-title.ttf") format("truetype")',
  fontWeight: 800,
  fontDisplay: 'swap',
});
globalStyle('body', { margin: 0 });
const reduced = '(prefers-reduced-motion: reduce)';
const shadow = (alpha: number) => `rgba(${theme.shadowRgb}, ${alpha})`;

/** 종이 작업대의 질감은 이미지 요청 없이 표현한다. */
export const page = style({
  minHeight: '100svh',
  paddingBottom: 1,
  color: theme.ink,
  backgroundColor: theme.desk,
  fontFamily: theme.bodyFont,
  fontSize: 14,
  lineHeight: 1.5,
  backgroundImage:
    'repeating-linear-gradient(0deg,#ffffff08 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,#57472e06 0 1px,transparent 1px 3px)',
});
globalStyle(`${page}, ${page} *`, { boxSizing: 'border-box' });
/** 가운데 제목의 위치는 가방 너비와 독립적이다. */
export const brand = style({
  position: 'relative',
  padding: '38px 24px 20px',
  textAlign: 'center',
  '@media': {
    '(max-width: 700px)': { padding: '92px 20px 15px' },
  },
});
/** 선택한 A 명조체를 로고처럼 사용한다. */
export const title = style({
  margin: 0,
  fontFamily: theme.heading,
  fontWeight: 800,
  fontSize: 30,
  letterSpacing: '-1.2px',
  lineHeight: 1.4,
  color: theme.title,
  '@media': { '(max-width: 700px)': { fontSize: 25 } },
});
/** 짧은 정적 설명으로 지원 형식과 압축 범위를 검색과 화면에 함께 전달한다. */
export const description = style({
  margin: '10px auto 0',
  maxWidth: 650,
  fontSize: 13,
  color: theme.title,
  wordBreak: 'keep-all',
  '@media': { '(max-width: 700px)': { fontSize: 12, maxWidth: 330 } },
});
/** 파일을 선택하기 전에 브라우저 처리 방식을 확인할 수 있게 한다. */
export const privacy = style({
  margin: '12px 0 0',
  fontSize: 11,
  color: theme.title,
  wordBreak: 'keep-all',
  '@media': { '(max-width: 700px)': { fontSize: 10 } },
});
/** 추가 자산을 불러오지 않는 텍스트 로고로 홈 이동 경로를 제공한다. */
export const homeLink = style({
  position: 'absolute',
  left: 24,
  top: 20,
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: theme.buttonFont,
  fontWeight: 600,
  fontSize: 20,
  color: theme.title,
  textDecoration: 'none',
  ':hover': { textDecoration: 'underline', textUnderlineOffset: 4 },
  ':focus-visible': { outline: `2px solid ${theme.title}`, outlineOffset: 4 },
  '@media': { '(max-width: 700px)': { left: 20, top: 16 } },
});
/** 데스크톱에서 두 인화지를 넓게 펼친다. */
export const desk = style({
  maxWidth: 1200,
  margin: '18px auto 28px',
  padding: '0 38px',
  '@media': {
    '(max-width: 700px)': { margin: '12px auto 25px', padding: '0 22px' },
  },
});
/** 파일 선택은 제목 아래 중앙에서 시작한다. */
export const toolbar = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 12,
  marginBottom: 24,
  '@media': { '(max-width: 700px)': { flexDirection: 'column', gap: 8 } },
});
/** 파일 선택 버튼 옆에서 지원하는 입력 형식을 확인한다. */
export const formats = style({ fontSize: 11, color: theme.title });
/** 두 인화지 사이 간격은 회전 후에도 겹치지 않게 잡는다. */
export const prints = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 30,
  position: 'relative',
  '@media': {
    '(max-width: 700px)': {
      gridTemplateColumns: 'minmax(0,1fr)',
      gap: 27,
    },
  },
});
/** 흰 인화지와 약간의 기울기로 사진 작업대의 감각을 유지한다. */
export const print = style({
  margin: 0,
  minWidth: 0,
  background: theme.paper,
  padding: '12px 12px 16px',
  boxShadow: '0 1px 1px #68533d33, 0 7px 15px #6c56302b',
  position: 'relative',
  ':first-child': { transform: 'rotate(-1deg)' },
  ':last-child': { transform: 'rotate(1deg)' },
  '@media': { '(max-width: 700px)': { padding: '10px 10px 13px' } },
});
/** 반투명 종이테이프는 원본과 결과의 색을 살짝 구분한다. */
export const tape = style({
  width: 78,
  height: 20,
  background: theme.tape,
  position: 'absolute',
  top: -9,
  left: 'calc(50% - 39px)',
  zIndex: 2,
  transform: 'rotate(-4deg)',
  clipPath:
    'polygon(0 0,100% 0,97% 8%,100% 14%,98% 23%,100% 35%,97% 44%,100% 55%,98% 69%,100% 84%,98% 100%,0 100%,2% 90%,0 77%,2% 62%,0 51%,2% 38%,0 24%,2% 14%)',
  selectors: {
    [`${print}:last-child &`]: {
      background: theme.resultTape,
      transform: 'rotate(5deg)',
    },
  },
});
/** PC의 화면 높이를 활용해 세로 사진도 크게 비교한다. */
export const imageBox = style({
  position: 'relative',
  height: 'clamp(320px, 42svh, 480px)',
  background: theme.photo,
  overflow: 'hidden',
  boxShadow: 'inset 0 0 1px #0005',
  '@media': {
    '(max-width: 700px)': { height: 218 },
  },
});
/** 긴 이미지도 자르지 않고 전체를 표시한다. */
export const photo = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'center',
  display: 'block',
});
/** 처리 전 상태를 사진과 같은 자리에서 보여준다. */
export const empty = style({
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: theme.empty,
  fontSize: 13,
});
/** 파일 정보는 별도 목록 대신 인화지 아래에 모은다. */
export const caption = style({
  minHeight: 90,
  padding: '12px 3px 0',
  minWidth: 0,
});
/** 원본·결과 구분과 파일명을 한 줄에서 비교한다. */
export const captionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 12,
});
/** 원본과 결과 표시는 파일명보다 약하게 둔다. */
export const captionLabel = style({
  fontSize: 10,
  color: theme.muted,
  flexShrink: 0,
});
/** 긴 파일명이 사진 폭을 늘리지 않도록 생략한다. */
export const fileName = style({
  fontSize: 10,
  lineHeight: 1.4,
  fontWeight: 400,
  color: theme.muted,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
/** 실제 결과 용량을 인화지 아래에서 쉽게 비교한다. */
export const resultSize = style({
  display: 'block',
  marginTop: 4,
  fontFamily: theme.buttonFont,
  fontSize: 24,
  fontWeight: 500,
  letterSpacing: '-.8px',
  color: theme.title,
});
/** 용량과 해상도 숫자는 같은 폭으로 읽히게 한다. */
export const facts = style({
  display: 'flex',
  gap: 12,
  marginTop: 5,
  fontFamily: theme.monoFont,
  fontSize: 10,
  color: theme.muted,
  minHeight: 16,
});
/** 설정과 다운로드를 비교 이미지 아래 오른쪽에 모은다. */
export const resultBar = style({
  marginTop: 24,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 340px auto',
  alignItems: 'center',
  gap: 22,
  '@media': {
    '(max-width: 700px)': {
      gridTemplateColumns: 'minmax(0,1fr)',
      gap: 16,
      marginTop: 22,
    },
  },
});
/** 빈 상태에서도 저장 버튼의 오른쪽 정렬을 유지한다. */
export const downloadAction = style({
  gridColumn: 3,
  gridRow: 1,
  justifySelf: 'end',
  '@media': { '(max-width: 700px)': { gridColumn: 1, gridRow: 2 } },
});
/** 처리 상태는 조작 요소 아래에서 별도 행으로 읽힌다. */
export const status = style({
  margin: 0,
  fontSize: 12,
  color: theme.muted,
  gridColumn: '1 / -1',
  gridRow: 2,
  '@media': { '(max-width: 700px)': { gridRow: 3 } },
});

// FColombati의 Uiverse 버튼을 조정했으며 배포 허가문은 /licenses/uiverse-button.txt에 보존한다.
/** 눌림은 바깥 위치가 아니라 내부 깊이로 표현한다. */
export const button = style({
  all: 'unset',
  boxSizing: 'border-box',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  position: 'relative',
  borderRadius: '100em',
  backgroundColor: 'rgba(94,76,47,.48)',
  font: `500 15px/1.4 ${theme.bodyFont}`,
  boxShadow: `-.15em -.15em .15em -.075em ${shadow(0.25)}, .0375em .0375em .0675em 0 ${shadow(0.1)}`,
  display: 'inline-block',
  flexShrink: 0,
  ':after': {
    content: '""',
    position: 'absolute',
    zIndex: 0,
    width: 'calc(100% + .3em)',
    height: 'calc(100% + .3em)',
    top: '-.15em',
    left: '-.15em',
    borderRadius: 'inherit',
    background: `linear-gradient(-135deg,${shadow(0.5)},transparent 20%,transparent 100%)`,
    filter: 'blur(.0125em)',
    opacity: 0.25,
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
  },
  ':focus-visible': { outline: `2px solid ${theme.title}`, outlineOffset: 6 },
  ':disabled': { cursor: 'default', opacity: 0.45 },
});
/** 추가 버튼은 문구 없이 원형으로 표시한다. */
export const roundButton = style({});
const pressing = `${button}:not(:disabled):is(:active, [data-pressed="true"])`;
/** 바깥 그림자가 사라지며 누르는 깊이를 만든다. */
export const buttonOuter = style({
  display: 'block',
  position: 'relative',
  zIndex: 1,
  borderRadius: 'inherit',
  transition: 'box-shadow 180ms ease',
  boxShadow: `0 .05em .05em -.01em ${shadow(1)}, 0 .01em .01em -.01em ${shadow(0.5)}, .15em .3em .1em -.01em ${shadow(0.25)}`,
  selectors: {
    [`${pressing} &`]: {
      boxShadow: `0 0 0 0 ${shadow(1)},0 0 0 0 ${shadow(0.5)},0 0 0 0 ${shadow(0.25)}`,
    },
  },
  '@media': { [reduced]: { transition: 'none' } },
});
/** 종이색 표면은 클릭하는 동안에만 안쪽으로 들어간다. */
export const buttonInner = style({
  display: 'block',
  position: 'relative',
  zIndex: 1,
  borderRadius: 'inherit',
  padding: '.9em 1.7em',
  minWidth: 132,
  textAlign: 'center',
  backgroundImage: `linear-gradient(135deg,${theme.buttonTop},${theme.buttonBottom})`,
  transition: 'box-shadow 180ms ease,clip-path 180ms ease,transform 180ms ease',
  overflow: 'clip',
  clipPath: 'inset(0 0 0 0 round 100em)',
  boxShadow: `0 0 0 0 inset ${shadow(0.1)},-.05em -.05em .05em 0 inset ${shadow(0.25)},0 0 0 0 inset ${shadow(0.1)},0 0 .05em .2em inset #ffffff40,.025em .05em .1em 0 inset #fff,.12em .12em .12em inset #ffffff40,-.075em -.25em .25em .1em inset ${shadow(0.25)}`,
  selectors: {
    [`${pressing} &`]: {
      clipPath: 'inset(clamp(1px,.0625em,2px) round 100em)',
      transform: 'scale(.975)',
      boxShadow: `.1em .15em .05em 0 inset ${shadow(0.75)},-.025em -.03em .05em .025em inset ${shadow(0.5)},.25em .25em .2em 0 inset ${shadow(0.5)},0 0 .05em .5em inset #ffffff26,0 0 0 0 inset #fff,.12em .12em .12em inset #ffffff40,-.075em -.12em .2em .1em inset ${shadow(0.25)}`,
    },
    [`${roundButton} &`]: {
      padding: 0,
      minWidth: 0,
      width: 51,
      height: 51,
      display: 'grid',
      placeItems: 'center',
    },
  },
  '@media': { [reduced]: { transition: 'none' } },
});
/** 다운로드는 명조로 강조하고 선택 버튼은 본문 서체로 읽히게 한다. */
export const buttonLabel = style({
  position: 'relative',
  zIndex: 4,
  fontFamily: theme.buttonFont,
  fontSize: 16,
  letterSpacing: '.01em',
  fontWeight: 600,
  color: 'transparent',
  backgroundImage: `linear-gradient(135deg,${theme.buttonInk},${theme.buttonInkEnd})`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  transition: 'transform 180ms ease',
  display: 'block',
  textShadow: '0 0 .1em #0000001a',
  userSelect: 'none',
  selectors: {
    [`${toolbar} &`]: { fontFamily: theme.bodyFont, fontSize: 13 },
    [`${pressing} &`]: { transform: 'scale(.975)' },
    [`${roundButton} &`]: {
      fontFamily: 'Arial, sans-serif',
      fontWeight: 400,
      fontSize: 25,
      lineHeight: 1,
    },
  },
  '@media': { [reduced]: { transition: 'none' } },
});

/** 이미지를 선택한 뒤에만 압축 설정을 보여준다. */
export const settings = style({
  gridColumn: 2,
  gridRow: 1,
  minWidth: 0,
  color: theme.title,
  '@media': { '(max-width: 700px)': { gridColumn: 1 } },
});
/** 목표 감소율과 용량을 작은 종이 패널 안에 모은다. */
export const targetField = style({
  display: 'grid',
  gap: 10,
  width: '100%',
  padding: '12px 18px',
  background: theme.settingsPaper,
  boxShadow: `0 2px 4px ${theme.settingsShadow}`,
  borderRadius: 2,
  color: theme.title,
  fontSize: 12,
});
/** 설명과 선택한 감소율의 기준선을 맞춘다. */
export const targetHeading = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
});
/** 감소율을 Download와 같은 명조 계열로 강조한다. */
export const targetValue = style({ font: `600 25px ${theme.buttonFont}` });
const thumb = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  border: `1px solid ${theme.rangeThumbBorder}`,
  background: `linear-gradient(135deg, ${theme.rangeThumbTop}, ${theme.buttonBottom})`,
  boxShadow: `0 2px 3px ${theme.rangeThumbShadow}, inset 0 1px #fff`,
};
/** 브라우저별 손잡이를 맞추고 현재 목표까지 트랙을 채운다. */
export const targetRange = style({
  appearance: 'none',
  WebkitAppearance: 'none',
  width: '100%',
  height: 7,
  margin: 0,
  borderRadius: 9,
  boxShadow: `inset 0 1px 2px ${theme.rangeInset}`,
  cursor: 'pointer',
  selectors: {
    '&::-webkit-slider-thumb': { ...thumb, WebkitAppearance: 'none' },
    '&::-moz-range-thumb': thumb,
  },
  ':focus-visible': { outline: `2px solid ${theme.title}`, outlineOffset: 6 },
  ':disabled': { cursor: 'default' },
});
/** PNG에 적용되는 무손실 처리 방식을 알린다. */
export const lossless = style({
  display: 'block',
  textAlign: 'center',
  fontSize: 12,
  color: theme.muted,
});
/** 양 끝 범위와 목표 용량을 한 줄로 비교한다. */
export const targetHint = style({
  display: 'flex',
  justifyContent: 'space-between',
  font: `10px ${theme.monoFont}`,
  color: theme.muted,
});
