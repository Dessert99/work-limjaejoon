import { style } from '@vanilla-extract/css';
import { paperTheme as theme, siteLayout } from '@/lib/styles/tokens';

/** 종이색 헤더는 스크롤 중에도 도구 이동을 유지한다. */
export const header = style({
  position: 'sticky',
  top: 0,
  zIndex: 20,
  height: 'var(--site-header-height)',
  background: theme.paper,
  borderBottom: `1px solid ${theme.rangeThumbBorder}`,
  boxShadow: `0 2px 12px rgba(${theme.shadowRgb}, 0.04)`,
  fontFamily: theme.bodyFont,
});
/** 좁은 화면에서는 브랜드와 메뉴를 두 줄로 나눠 터치 영역을 확보한다. */
export const inner = style({
  maxWidth: 1440,
  height: '100%',
  margin: '0 auto',
  padding: '0 32px',
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  alignItems: 'center',
  columnGap: 32,
  '@media': {
    [siteLayout.compactMedia]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: '60px 55px',
      padding: '0 20px',
    },
  },
});
/** 가방과 서비스 이름 전체를 홈으로 돌아가는 하나의 링크로 묶는다. */
export const brand = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  width: 'fit-content',
  textDecoration: 'none',
  color: theme.ink,
  borderRadius: 8,
  ':focus-visible': { outline: `2px solid ${theme.title}`, outlineOffset: 4 },
});
/** 기존 가방을 작은 금빛 우표처럼 사용해 작업방과 상세 화면을 연결한다. */
export const mark = style({
  display: 'grid',
  placeItems: 'center',
  width: 44,
  height: 44,
  flexShrink: 0,
  borderRadius: '13px 13px 13px 4px',
  background: theme.buttonBottom,
  border: `1px solid ${theme.rangeThumbBorder}`,
  transform: 'rotate(-5deg)',
});
/** 서비스 이름은 부분 글꼴의 글리프 범위와 무관하게 선명하게 표시한다. */
export const name = style({
  display: 'block',
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: '-0.7px',
  lineHeight: 1.4,
});
/** 브랜드 설명은 메뉴보다 작은 크기로 시각적 위계를 유지한다. */
export const tagline = style({
  display: 'block',
  marginTop: 3,
  color: theme.buttonInkEnd,
  fontSize: 10,
  letterSpacing: '0.04em',
  lineHeight: 1.4,
});
/** 메뉴가 넘쳐도 페이지 전체의 가로 스크롤로 번지지 않게 한다. */
export const nav = style({
  minWidth: 0,
  overflowX: 'auto',
  overscrollBehaviorX: 'contain',
  scrollbarWidth: 'thin',
  scrollbarColor: `${theme.rangeTrack} transparent`,
});
/** 도구는 같은 간격으로 나열하고 모바일에서는 한 줄 탐색을 유지한다. */
export const list = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 4,
  width: 'max-content',
  minWidth: '100%',
  listStyle: 'none',
  margin: 0,
  padding: '4px 2px',
  '@media': {
    [siteLayout.compactMedia]: { justifyContent: 'flex-start' },
  },
});
/** 현재 도구는 짙은 종이 탭으로 표시하고 키보드 초점도 별도로 드러낸다. */
export const link = style({
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '0 12px',
  color: theme.buttonInk,
  borderRadius: 8,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '-0.3px',
  ':hover': { background: theme.photo },
  ':focus-visible': { outline: `2px solid ${theme.title}`, outlineOffset: -2 },
  selectors: {
    '&[aria-current="page"]': {
      color: theme.paper,
      background: theme.ink,
      boxShadow: `0 3px 8px rgba(${theme.shadowRgb}, 0.16)`,
    },
  },
});
/** 작은 번호는 기능 이름을 가리지 않으면서 도구 목록의 리듬을 만든다. */
export const number = style({
  fontFamily: theme.monoFont,
  fontSize: 9,
  fontWeight: 400,
  opacity: 0.6,
  letterSpacing: '-0.5px',
});
