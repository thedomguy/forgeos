// ui.jsx — Forge OS design primitives.
import { useState, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { FONT, MONO, STATUS_H, NAV_H, DANGER, ON_ACCENT, Z, RADIUS } from './theme.jsx';

// ── Scroll screen wrapper ──────────────────────────────────────
export function Screen({ children, theme, padTop = STATUS_H + 6, padBottom = NAV_H + 12, scrollRef, onScroll, style = {} }) {
  return (
    <div ref={scrollRef} onScroll={onScroll} className="forge-scroll" style={{
      position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden',
      paddingTop: padTop, paddingBottom: padBottom, ...style,
    }}>{children}</div>
  );
}

// ── Primitives ─────────────────────────────────────────────────
export function Card({ children, theme, style = {}, elevated = false, onClick, accent }) {
  const t = theme;
  return (
    <div onClick={onClick} style={{
      background: elevated ? t.surface2 : t.surface, borderRadius: RADIUS.card,
      border: `1px solid ${accent ? accent + '40' : t.border}`,
      boxShadow: elevated ? t.shadow : 'none',
      cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden',
      transition: 'transform .15s ease, border-color .15s', ...style,
    }}>{children}</div>
  );
}

export function Chip({ children, theme, active, onClick, accent, style = {} }) {
  const t = theme; const c = accent || t.accent.solid;
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
      padding: '8px 14px', borderRadius: 100, fontFamily: FONT, fontSize: 13.5, fontWeight: 550,
      border: `1px solid ${active ? c : t.border}`,
      background: active ? c + '1f' : t.surface,
      color: active ? c : t.text2, cursor: 'pointer', transition: 'all .15s', ...style,
    }}>{children}</button>
  );
}

export function Button({ children, theme, kind = 'primary', size = 'md', onClick, style = {}, icon, disabled }) {
  const t = theme;
  const pads = { sm: '9px 14px', md: '13px 18px', lg: '16px 22px' };
  const fs = { sm: 13.5, md: 15, lg: 16 };
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: pads[size], borderRadius: 14, fontFamily: FONT, fontSize: fs[size], fontWeight: 600,
    border: '1px solid transparent', cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.45 : 1, transition: 'transform .12s, filter .15s', width: '100%', ...style,
  };
  const kinds = {
    primary: { background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`, color: ON_ACCENT,
      boxShadow: `0 8px 24px ${t.accent.glow}` },
    soft: { background: t.accent.solid + '1f', color: t.accent.solid, border: `1px solid ${t.accent.solid}33` },
    ghost: { background: t.surface2, color: t.text, border: `1px solid ${t.border}` },
    danger: { background: DANGER.solid + '1f', color: DANGER.text, border: `1px solid ${DANGER.tint}` },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...kinds[kind] }}>
    {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}{children}</button>;
}

export function IconBtn({ name, theme, onClick, size = 40, iconSize = 20, active, accent, style = {} }) {
  const t = theme; const c = accent || t.accent.solid;
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: 12, display: 'flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer', transition: 'all .15s',
      background: active ? c + '1f' : t.surface, color: active ? c : t.text2,
      border: `1px solid ${active ? c + '44' : t.border}`, ...style,
    }}><Icon name={name} size={iconSize} /></button>
  );
}

// progress ring (SVG)
export function Ring({ value = 0, max = 100, size = 64, stroke = 7, color, track, theme, children, gradient }) {
  const t = theme;
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const gid = useRef('rg' + Math.random().toString(36).slice(2)).current;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {gradient && <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={gradient[0]} /><stop offset="1" stopColor={gradient[1]} />
        </linearGradient></defs>}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track || t.track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={gradient ? `url(#${gid})` : (color || t.accent.solid)} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      {children && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>{children}</div>}
    </div>
  );
}

// linear bar
export function Bar({ value = 0, max = 100, color, theme, height = 8, track, style = {} }) {
  const t = theme; const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ height, borderRadius: 100, background: track || t.track, overflow: 'hidden', ...style }}>
      <div style={{ width: pct + '%', height: '100%', borderRadius: 100,
        background: color || t.accent.solid, transition: 'width .8s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

// sparkline / mini bar chart
export function MiniBars({ data, color, theme, height = 44, highlight = -1 }) {
  const t = theme; const maxV = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, height: Math.max(8, (v / maxV) * height) + '%',
          minHeight: 6, borderRadius: 4, transition: 'height .6s',
          background: i === highlight ? color : (t.dark ? color + '4d' : color + '40') }} />
      ))}
    </div>
  );
}

export function Sparkline({ data, color, theme, width = 120, height = 40, fill = true }) {
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * width, height - ((v - min) / rng) * (height - 6) - 3 ]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const gid = useRef('sp' + Math.random().toString(36).slice(2)).current;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {fill && <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity="0.3" /><stop offset="1" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>}
      {fill && <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gid})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color} />
    </svg>
  );
}

// bottom sheet / modal overlay
export function Sheet({ open, onClose, theme, children, height, full = false }) {
  const t = theme;
  const [mounted, setMounted] = useState(open);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (open) { setMounted(true); requestAnimationFrame(() => requestAnimationFrame(() => setShow(true))); }
    else { setShow(false); const id = setTimeout(() => setMounted(false), 280); return () => clearTimeout(id); }
  }, [open]);
  if (!mounted) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: Z.sheet, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: t.overlay,
        opacity: show ? 1 : 0, transition: 'opacity .28s', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', width: '100%', maxHeight: full ? '100%' : '90%',
        height: full ? '100%' : height, background: t.sheet, color: t.text,
        borderRadius: full ? 0 : '28px 28px 0 0', border: `1px solid ${t.border}`, borderBottom: 'none',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
        transform: show ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .32s cubic-bezier(.32,.72,0,1)', display: 'flex', flexDirection: 'column' }}>
        {!full && <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 38, height: 5, borderRadius: 100, background: t.border2 }} /></div>}
        {children}
      </div>
    </div>
  );
}

// small label / tag
export function Tag({ children, color, theme, style = {} }) {
  const t = theme; const c = color || t.text2;
  return <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, letterSpacing: 0.4,
    textTransform: 'uppercase', color: c, background: c + '16', padding: '3px 8px', borderRadius: 6,
    display: 'inline-flex', alignItems: 'center', gap: 4, ...style }}>{children}</span>;
}

export function Avatar({ size = 40, theme, ring, name }) {
  const t = theme;
  return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: ON_ACCENT,
    fontWeight: 700, fontSize: size * 0.4, fontFamily: FONT,
    boxShadow: ring ? `0 0 0 2px ${t.bg}, 0 0 0 4px ${t.accent.solid}66` : 'none' }}>
    {(name || 'F').trim().slice(0, 1).toUpperCase()}</div>;
}
