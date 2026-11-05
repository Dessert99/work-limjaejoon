import { globalFontFace, globalStyle, style } from '@vanilla-extract/css';
import { paperTheme as theme } from '@/lib/styles/tokens';

globalFontFace('Toolbax Serif', {
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
/** 검색으로 방문한 사용자도 작업대 아래에서 처리 방식과 사용법을 읽을 수 있다. */
export const guide = style({
  maxWidth: 800,
  margin: '48px auto',
  padding: '0 24px',
  lineHeight: 1.8,
  overflowWrap: 'anywhere',
});
/** 가운데 제목의 위치는 가방 너비와 독립적이다. */
export const brand = style({
  height: 122,
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  margin: '0 48px',
  '@media': {
    '(max-width: 700px)': { margin: '0 16px', paddingTop: 70, height: 155 },
  },
});
/** 선택한 A 명조체를 로고처럼 사용한다. */
export const title = style({
  margin: 0,
  fontFamily: theme.heading,
  fontWeight: 800,
  fontSize: 35,
  letterSpacing: '-1.2px',
  lineHeight: 1.4,
  color: theme.title,
  '@media': { '(max-width: 700px)': { fontSize: 26 } },
});
/** 가방 자체가 홈으로 돌아가는 링크다. */
export const bagLink = style({
  position: 'absolute',
  left: 0,
  top: 12,
  height: 98,
  width: 124,
  display: 'flex',
  alignItems: 'center',
  color: theme.title,
  textDecoration: 'none',
  ':focus-visible': { outline: `2px solid ${theme.title}`, borderRadius: 6 },
  '@media': {
    '(max-width: 700px)': {
      top: 0,
      transform: 'scale(.75)',
      transformOrigin: 'left top',
    },
  },
});
/** 가방이 로딩되지 않아도 화살표로 이동할 수 있다. */
export const backArrow = style({
  width: 24,
  fontSize: 22,
  opacity: 0,
  transform: 'translateX(14px)',
  transition: 'opacity .3s, transform .4s',
  selectors: {
    [`${bagLink}:hover &, ${bagLink}:focus-visible &, ${bagLink}[data-failed="true"] &`]:
      { opacity: 1, transform: 'none' },
  },
  '@media': {
    [reduced]: { transition: 'none', transform: 'none' },
    '(hover: none)': { opacity: 1, transform: 'none' },
  },
});
/** 고정된 아이콘 공간으로 로딩 중 배치 이동을 막는다. */
export const bagView = style({
  position: 'relative',
  width: 100,
  height: 100,
  flexShrink: 0,
  display: 'block',
});
globalStyle(`${bagView} canvas`, { width: 100, height: 100, display: 'block' });
/** WebGL 준비 전이나 실패 시에도 같은 가방으로 돌아가기 위치를 표시한다. */
export const bagFallback = style({
  position: 'absolute',
  inset: 0,
  width: 100,
  height: 100,
});
/** 데스크톱에서 두 인화지를 넓게 펼친다. */
export const desk = style({
  maxWidth: 1400,
  margin: '4px auto 0',
  padding: '0 28px',
  '@media': { '(max-width: 700px)': { padding: '0 20px' } },
});
/** 이미지 교체는 오른쪽 위 한 곳에서만 시작한다. */
export const toolbar = style({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  minHeight: 55,
  margin: '0 13px 22px',
});
/** 두 인화지 사이 간격은 회전 후에도 겹치지 않게 잡는다. */
export const prints = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 45,
  margin: '0 20px',
  position: 'relative',
  ':before': {
    content: '""',
    position: 'absolute',
    left: '50%',
    top: 42,
    bottom: 20,
    width: 2,
    background: '#b9a98d77',
    transform: 'translateX(-50%)',
  },
  '@media': {
    '(max-width: 1390px)': { gap: 34 },
    '(max-width: 700px)': {
      gridTemplateColumns: 'minmax(0,1fr)',
      gap: 34,
      margin: '0 4px',
      ':before': { display: 'none' },
    },
  },
});
/** 흰 인화지와 약간의 기울기로 사진 작업대의 감각을 유지한다. */
export const print = style({
  margin: 0,
  minWidth: 0,
  background: theme.paper,
  padding: '16px 16px 0',
  boxShadow: '0 1px 1px #68533d33, 0 7px 15px #6c56302b',
  position: 'relative',
  ':first-child': { transform: 'rotate(-1.2deg)' },
  ':last-child': { transform: 'rotate(1.1deg)' },
});
/** 반투명 종이테이프는 원본과 결과의 색을 살짝 구분한다. */
export const tape = style({
  width: 102,
  height: 26,
  background: theme.tape,
  position: 'absolute',
  top: -12,
  left: '40%',
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
/** 사진 모양에 관계없이 원본과 결과의 표시 영역을 맞춘다. */
export const imageBox = style({
  position: 'relative',
  height: 390,
  background: theme.photo,
  overflow: 'hidden',
  boxShadow: 'inset 0 0 1px #0005',
  '@media': {
    '(max-width: 1390px)': { height: 350 },
    '(max-width: 700px)': { height: 280 },
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
  height: 88,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '0 4px',
  minWidth: 0,
});
/** 원본과 결과 표시는 파일명보다 약하게 둔다. */
export const captionLabel = style({
  fontSize: 11,
  color: theme.muted,
  marginBottom: 5,
});
/** 긴 파일명이 사진 폭을 늘리지 않도록 생략한다. */
export const fileName = style({
  fontSize: 13,
  lineHeight: 1.4,
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
/** 실제 결과 용량을 인화지 아래에서 쉽게 비교한다. */
export const resultSize = style({
  fontFamily: theme.monoFont,
  fontSize: 23,
  fontWeight: 500,
  letterSpacing: '-.8px',
  color: theme.title,
});
/** 용량과 해상도 숫자는 같은 폭으로 읽히게 한다. */
export const facts = style({
  display: 'flex',
  gap: 18,
  marginTop: 5,
  fontFamily: theme.monoFont,
  fontSize: 11,
  color: theme.muted,
  minHeight: 16,
});
/** 설정은 하단 중앙에, 저장 버튼은 오른쪽에 고정한다. */
export const resultBar = style({
  margin: '25px 23px 40px',
  display: 'grid',
  gridTemplateColumns: '1fr 420px 1fr',
  alignItems: 'center',
  gap: 18,
  '@media': { '(max-width: 850px)': { gridTemplateColumns: 'minmax(0,1fr)' } },
});
/** 빈 상태에서도 저장 버튼의 오른쪽 정렬을 유지한다. */
export const downloadAction = style({
  gridColumn: 3,
  gridRow: 1,
  justifySelf: 'end',
  '@media': { '(max-width: 850px)': { gridColumn: 1, gridRow: 2 } },
});
/** 처리 상태는 조작 요소 아래에서 별도 행으로 읽힌다. */
export const status = style({
  margin: 0,
  fontSize: 12,
  color: theme.muted,
  gridColumn: '1 / -1',
  gridRow: 2,
  '@media': { '(max-width: 850px)': { gridRow: 3 } },
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
/** 명조 Download와 단순한 더하기 기호를 구분한다. */
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

/** 이미지를 올린 뒤에만 하단 중앙에 설정을 표시한다. */
export const settings = style({
  gridColumn: 2,
  gridRow: 1,
  minWidth: 0,
  color: theme.title,
  '@media': { '(max-width: 850px)': { gridColumn: 1 } },
});
/** 목표 감소율과 용량을 작은 종이 패널 안에 모은다. */
export const targetField = style({
  display: 'grid',
  gap: 10,
  width: '100%',
  padding: '16px 24px',
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
/** PNG는 같은 중앙 위치에서 무손실 처리임을 알린다. */
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
