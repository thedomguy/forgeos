// icons.jsx — Forge OS icon set. Stroke icons using currentColor.
// <Icon name="home" size={22} strokeWidth={1.8} />
export const ICON_PATHS = {
  // ── OS nav
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  spark: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  timeline: 'M7 4v16M7 7h13M7 12h9M7 17h11',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c0-3.3 3.1-5 7-5s7 1.7 7 5',
  // ── utility
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  mic: 'M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3',
  camera: 'M4 8a2 2 0 0 1 2-2h2l1.5-2h5L18 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8ZM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  pencil: 'M16.5 3.5 20.5 7.5 8 20H4v-4L16.5 3.5ZM14.5 5.5l4 4',
  chevronRight: 'M9 5l7 7-7 7',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronDown: 'M5 9l7 7 7-7',
  chevronUp: 'M5 15l7-7 7 7',
  arrowUp: 'M12 20V5M6 11l6-6 6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5 10 17.5 19.5 7',
  command: 'M9 9V7a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v10a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2V9Z',
  filter: 'M4 5h16l-6 8v6l-4-2v-4L4 5Z',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM9.5 19a2.5 2.5 0 0 0 5 0',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 6.4l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 3.6V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.6 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 9h.1',
  // ── modules / health
  heart: 'M12 20s-7-4.6-9.3-9.1C1.2 7.8 2.7 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.3 0 4.8 3.3 3.3 6.4C19 15.4 12 20 12 20Z',
  flame: 'M12 3c0 3-4 4.5-4 8a4 4 0 0 0 8 0c0-1.3-.6-2.3-1.2-3.2-.4 1-1 1.4-1.6 1.4 1-2.3-.2-5-1.2-6.2Z',
  dumbbell: 'M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12',
  wallet: 'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 0 0 4h14v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM16 11.5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z',
  book: 'M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4ZM5 18a2 2 0 0 1 2-2h10',
  checkSquare: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6ZM8.5 12l2.2 2.2L16 9',
  doc: 'M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z',
  home2: 'M4 11 12 4l8 7M6 10v9h12v-9',
  scale: 'M12 4v16M7 8h10M5 20h14M9 8 6 14a3 3 0 0 0 6 0L9 8ZM15 8l-3 6a3 3 0 0 0 6 0l-3-6Z',
  apple: 'M12 7c-1-2-3-3-5-2-2.4 1.2-2.5 5 0 9 1 1.6 2 2.5 3 2.5s1.3-.6 2-.6 1 .6 2 .6 2-.9 3-2.5c1-1.6 1.4-3.2 1.3-4.5M12 7c0-2 1.2-3.5 3-3.5',
  drop: 'M12 3c3 4 6 7 6 10.5a6 6 0 0 1-12 0C6 10 9 7 12 3Z',
  trend: 'M3 17l5-5 4 4 8-9M16 7h5v5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2',
  play: 'M7 4.5 19 12 7 19.5V4.5Z',
  pause: 'M8 5h3v14H8zM14 5h3v14h-3z',
  stop: 'M7 7h10v10H7z',
  route: 'M7 18a3 3 0 1 0 0 0ZM6 18h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h2M17 3a3 3 0 1 0 0 0Z',
  walk: 'M13 4.5a1.5 1.5 0 1 0 0 0ZM11 9l-2 4 2 1 1 5M11 9l3 1 1 4M11 9l-3 2',
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 18l9 5 9-5',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  bolt: 'M13 3 4 14h6l-1 7 9-11h-6l1-7Z',
  moon: 'M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  star: 'M12 3.5 14.6 9l6 .5-4.5 4 1.4 6L12 16.5 6.5 19.5l1.4-6-4.5-4 6-.5L12 3.5Z',
  shield: 'M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z',
  link: 'M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1',
  send: 'M5 12 20 4l-5 16-3.5-6L5 12Z',
  sliders: 'M4 8h10M18 8h2M4 16h2M10 16h10M14 6v4M6 14v4',
  copy: 'M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2ZM5 15a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2',
  refresh: 'M4 11a8 8 0 0 1 14-5l2 2M20 13a8 8 0 0 1-14 5l-2-2M18 4v4h-4M6 20v-4h4',
};

export function Icon({ name, size = 22, strokeWidth = 1.75, style = {}, fill = 'none', ...rest }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
      strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }} {...rest}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}
