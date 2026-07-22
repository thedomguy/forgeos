// theme.jsx — Forge OS theme tokens + app shell (full-viewport, no device bezel).

export const ACCENTS = {
  violet: { solid: '#7c5cff', g1: '#8b6bff', g2: '#5b8def', glow: 'rgba(124,92,255,0.45)' },
  cyan:   { solid: '#22d3ee', g1: '#22d3ee', g2: '#3b82f6', glow: 'rgba(34,211,238,0.40)' },
  emerald:{ solid: '#34d399', g1: '#34d399', g2: '#0ea5e9', glow: 'rgba(52,211,153,0.40)' },
  coral:  { solid: '#ff6b4a', g1: '#ff7a59', g2: '#ff4d8d', glow: 'rgba(255,107,74,0.40)' },
};
// semantic / module colors (theme-independent)
export const HUE = {
  cal: '#ff6b4a', calLight: '#ff9d6b', protein: '#4f8cff', carbs: '#f5a623', fat: '#c084fc',
  burn: '#34d399', water: '#38bdf8', weight: '#a78bfa', workout: '#ff6b4a',
  health: '#34d399', finance: '#fbbf24', learning: '#38bdf8',
  projects: '#fb7185', documents: '#a78bfa', travel: '#2dd4bf',
  tasks: '#f97316', home: '#60a5fa', relationships: '#f472b6',
};
// status color (theme-independent) — used for destructive actions/errors
export const DANGER = { solid: '#ff5470', text: '#ff7088', tint: '#ff547044' };
// text/icon color placed on top of a solid or gradient accent fill — readable in both themes
export const ON_ACCENT = '#fff';
// always-dark chip background (e.g. toast) — needs contrast against any page background, in either theme
export const SCRIM = 'rgba(22,24,30,0.95)';
// shared z-index stack — keeps overlay layering coordinated across screens
export const Z = { base: 1, shell: 10, sticky: 20, float: 30, floatHi: 55, nav: 60, sheet: 100, toast: 110 };
// shared corner-radius scale for non-circular surfaces
export const RADIUS = { chip: 10, control: 12, card: 22 };
// horizontal gutter shared by every screen's content
export const SCREEN_PAD_X = 16;

export function makeTheme(dark, accentKey) {
  const a = ACCENTS[accentKey] || ACCENTS.violet;
  if (dark) {
    return {
      dark: true, accent: a, accentKey, hue: HUE,
      bg: '#0a0b0f', bgGrad: 'radial-gradient(120% 80% at 50% -10%, #14161f 0%, #0a0b0f 55%)',
      surface: '#121419', surface2: '#181b22', surfaceHi: '#1e222b',
      border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
      text: '#f3f4f7', text2: '#9aa1ad', text3: '#646b78',
      navBg: 'rgba(14,16,21,0.72)', sheet: '#15181f',
      track: 'rgba(255,255,255,0.08)', overlay: 'rgba(4,5,8,0.66)',
      shadow: '0 18px 50px rgba(0,0,0,0.5)', statusInk: '#fff',
    };
  }
  return {
    dark: false, accent: a, accentKey, hue: HUE,
    bg: '#eef0f4', bgGrad: 'radial-gradient(120% 80% at 50% -10%, #ffffff 0%, #eaecf1 60%)',
    surface: '#ffffff', surface2: '#f7f8fa', surfaceHi: '#ffffff',
    border: 'rgba(16,18,24,0.08)', border2: 'rgba(16,18,24,0.13)',
    text: '#14161b', text2: '#5b626e', text3: '#98a0ad',
    navBg: 'rgba(255,255,255,0.78)', sheet: '#ffffff',
    track: 'rgba(16,18,24,0.07)', overlay: 'rgba(20,22,28,0.4)',
    shadow: '0 18px 50px rgba(20,22,40,0.16)', statusInk: '#000',
  };
}
// top/bottom breathing room for sticky headers & the bottom nav — real device
// chrome (browser UI, notch safe-area) is handled separately via CSS, so these
// stay small compared to the design-tool's fake-status-bar mockup.
export const STATUS_H = 14;
export const NAV_H = 78;
export const FONT = "'Geist', -apple-system, system-ui, sans-serif";
export const MONO = "'Geist Mono', 'SF Mono', ui-monospace, monospace";

// ── App shell ────────────────────────────────────────────────────
// Full-viewport container that clips content so each screen can scroll
// independently (position: absolute; inset: 0) while the bottom nav, sheets,
// and toast stay pinned within it — the same layout model the design used
// for its phone-frame mockup, just sized to the real viewport instead of a
// fixed 402×874 bezel.
export function AppShell({ children, theme }) {
  const t = theme;
  return (
    <div className="forge-root" style={{
      position: 'relative', overflow: 'hidden', background: t.bg, fontFamily: FONT,
      WebkitFontSmoothing: 'antialiased', color: t.text,
    }}>
      {/* ambient gradient bleeds edge-to-edge, under any notch/safe-area */}
      <div style={{ position: 'absolute', inset: 0, background: t.bgGrad, pointerEvents: 'none' }} />
      {/* content layer insets for the safe area so screens/nav/sheets clear the notch */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: Z.shell,
        paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      }}>{children}</div>
    </div>
  );
}
