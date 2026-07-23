// weightsheet.jsx — Log Weight. Seeded from the live current weight; onLogged(kg) → store.
import { useState, useEffect } from 'react';
import { Sheet, Button, IconBtn, Tag } from './ui.jsx';
import { MONO, HUE } from './theme.jsx';

export function LogWeightSheet({ open, onClose, theme, onLogged, current = 74.2 }) {
  const t = theme;
  // `w` is the raw input string so it can be typed freely; `num` is the parsed value.
  const [w, setW] = useState(current.toFixed(1));
  useEffect(() => { if (open) setW(current.toFixed(1)); }, [open, current]);
  const num = parseFloat(w);
  const valid = Number.isFinite(num) && num > 0;
  const value = valid ? num : current;
  const delta = value - current;               // "vs current" — uses the passed `current` prop
  const step = (d) => setW((Math.round((value + d) * 10) / 10).toFixed(1));
  return (
    <Sheet open={open} onClose={onClose} theme={t} height={360}>
      <div style={{ padding: '14px 20px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>Log Weight</span>
          <IconBtn name="close" theme={t} size={36} iconSize={18} onClick={onClose} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button onClick={() => step(-0.1)} style={{ width: 52, height: 52, borderRadius: 16,
              border: `1px solid ${t.border2}`, background: t.surface2, color: t.text, fontSize: 24, cursor: 'pointer' }}>−</button>
            <div style={{ textAlign: 'center', minWidth: 130, display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
              <input value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal"
                aria-label="Weight in kilograms"
                style={{ width: 120, textAlign: 'right', fontFamily: MONO, fontSize: 52, fontWeight: 600,
                  letterSpacing: -2, background: 'transparent', border: 'none', outline: 'none', color: t.text, padding: 0 }} />
              <span style={{ fontSize: 18, color: t.text2, marginLeft: 6 }}>kg</span>
            </div>
            <button onClick={() => step(0.1)} style={{ width: 52, height: 52, borderRadius: 16,
              border: `1px solid ${t.border2}`, background: t.surface2, color: t.text, fontSize: 24, cursor: 'pointer' }}>+</button>
          </div>
          <Tag theme={t} color={HUE.health}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)} kg vs current</Tag>
        </div>
        <Button theme={t} disabled={!valid}
          onClick={() => { if (!valid) return; onLogged && onLogged(value); onClose(); }}>Save Weight</Button>
      </div>
    </Sheet>
  );
}
