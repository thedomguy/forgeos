// sheets.jsx — Add Food (photo / voice / manual + AI parsing) & Log Weight sheets.
import { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';
import { Sheet, Button, IconBtn, Tag } from './ui.jsx';
import { FONT, MONO, HUE, ON_ACCENT, SCREEN_PAD_X } from './theme.jsx';

const DETECTED_FOOD = [
  { n: 'Grilled chicken breast', portion: '180 g', kcal: 297, p: 56, c: 0, f: 7, conf: 0.96, emoji: '🍗' },
  { n: 'Steamed broccoli', portion: '1 cup', kcal: 55, p: 4, c: 11, f: 1, conf: 0.93, emoji: '🥦' },
  { n: 'Brown rice', portion: '1 cup', kcal: 216, p: 5, c: 45, f: 2, conf: 0.88, emoji: '🍚' },
];
const RECENT_FOODS = [
  { n: 'Greek yogurt bowl', kcal: 280, emoji: '🥣' },
  { n: 'Protein shake', kcal: 160, emoji: '🥤' },
  { n: 'Banana', kcal: 105, emoji: '🍌' },
  { n: 'Black coffee', kcal: 5, emoji: '☕' },
];

function MethodTab({ theme, icon, label, active, onClick }) {
  const t = theme;
  return (
    <button onClick={onClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '12px 4px', borderRadius: 14, cursor: 'pointer',
      background: active ? t.accent.solid + '1f' : 'transparent',
      border: `1px solid ${active ? t.accent.solid + '55' : t.border}`,
      color: active ? t.accent.solid : t.text2 }}>
      <Icon name={icon} size={20} /><span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span></button>
  );
}

export function AddFoodSheet({ open, onClose, theme, onLogged }) {
  const t = theme;
  const [method, setMethod] = useState('photo');
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => { if (open) { setMethod('photo'); setScanning(false); setScanned(false); setItems([]); } }, [open]);

  const runScan = () => {
    setScanning(true); setScanned(false);
    setTimeout(() => { setScanning(false); setScanned(true); setItems(DETECTED_FOOD.map(d => ({ ...d }))); }, 1600);
  };
  const total = items.reduce((s, i) => s + i.kcal, 0);

  return (
    <Sheet open={open} onClose={onClose} theme={t} height={620}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px' }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>Log Food</span>
          <IconBtn name="close" theme={t} size={36} iconSize={18} onClick={onClose} />
        </div>
        <div style={{ display: 'flex', gap: 8, padding: `0 ${SCREEN_PAD_X}px 14px` }}>
          <MethodTab theme={t} icon="camera" label="Photo" active={method==='photo'} onClick={() => setMethod('photo')} />
          <MethodTab theme={t} icon="mic" label="Voice" active={method==='voice'} onClick={() => setMethod('voice')} />
          <MethodTab theme={t} icon="pencil" label="Manual" active={method==='manual'} onClick={() => setMethod('manual')} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${SCREEN_PAD_X}px` }}>
          {method === 'photo' && (
            <>
              {!scanned && (
                <div onClick={() => !scanning && runScan()} style={{ height: 200, borderRadius: 20, cursor: 'pointer',
                  border: `1px dashed ${t.border2}`, background: t.surface2, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
                  {scanning ? (
                    <>
                      <div style={{ position: 'absolute', left: 0, right: 0, height: 3, top: '20%',
                        background: `linear-gradient(90deg, transparent, ${t.accent.solid}, transparent)`,
                        animation: 'forgeScan 1.4s ease-in-out infinite' }} />
                      <div style={{ width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: ON_ACCENT,
                        background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})` }}>
                        <Icon name="spark" size={24} /></div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: t.text2 }}>Recognizing food…</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: t.accent.solid, background: t.accent.solid + '1c' }}>
                        <Icon name="camera" size={28} /></div>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Tap to capture your plate</span>
                      <span style={{ fontSize: 12, color: t.text3 }}>AI detects items, portions & macros</span>
                    </>
                  )}
                </div>
              )}
              {scanned && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px 12px' }}>
                    <Icon name="spark" size={16} style={{ color: t.accent.solid }} />
                    <span style={{ fontSize: 13, color: t.text2 }}>Detected {items.length} items · tap to edit portions</span>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 14, background: t.surface2, border: `1px solid ${t.border}`, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{it.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{it.n}</div>
                        <div style={{ fontFamily: MONO, fontSize: 11.5, color: t.text3 }}>
                          {it.portion} · P{it.p} C{it.c} F{it.f}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: HUE.cal }}>{it.kcal}</div>
                        <Tag theme={t} color={it.conf > 0.9 ? HUE.health : HUE.carbs}
                          style={{ marginTop: 2 }}>{Math.round(it.conf*100)}%</Tag>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {method === 'voice' && (
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <button onClick={() => { setScanned(true); setItems(DETECTED_FOOD.slice(0,2).map(d => ({...d}))); }}
                style={{ width: 88, height: 88, borderRadius: '50%', border: 'none', cursor: 'pointer', color: ON_ACCENT,
                background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
                boxShadow: `0 12px 32px ${t.accent.glow}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto' }}><Icon name="mic" size={36} /></button>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 16 }}>
                {scanned ? '"Chicken breast and broccoli"' : 'Tap and describe your meal'}</div>
              <div style={{ fontSize: 12.5, color: t.text3, marginTop: 5 }}>
                {scanned ? 'Parsed 2 items · 352 kcal' : 'e.g. "two eggs, toast and a coffee"'}</div>
              {scanned && items.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left',
                  borderRadius: 14, background: t.surface2, border: `1px solid ${t.border}`, marginTop: 10 }}>
                  <span style={{ fontSize: 20 }}>{it.emoji}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{it.n}</div>
                    <div style={{ fontFamily: MONO, fontSize: 11.5, color: t.text3 }}>{it.portion}</div></div>
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: HUE.cal }}>{it.kcal}</span>
                </div>
              ))}
            </div>
          )}

          {method === 'manual' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                background: t.surface2, borderRadius: 14, border: `1px solid ${t.border2}`, marginBottom: 14 }}>
                <Icon name="search" size={18} style={{ color: t.text3 }} />
                <input placeholder="Search foods…" style={{ flex: 1, background: 'none', border: 'none',
                  outline: 'none', color: t.text, fontSize: 15, fontFamily: FONT }} />
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, textTransform: 'uppercase',
                letterSpacing: 0.5, padding: '0 2px 8px' }}>Recent</div>
              {RECENT_FOODS.map((it, i) => (
                <div key={i} onClick={() => setItems(p => [...p, { ...it, p:0,c:0,f:0 }])} style={{ display: 'flex',
                  alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                  background: t.surface2, border: `1px solid ${t.border}`, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{it.emoji}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 550 }}>{it.n}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: t.text2 }}>{it.kcal}</span>
                  <Icon name="plus" size={18} style={{ color: t.accent.solid }} />
                </div>
              ))}
            </>
          )}
        </div>

        {/* footer */}
        {(items.length > 0) && (
          <div style={{ padding: `12px ${SCREEN_PAD_X}px 28px`, borderTop: `1px solid ${t.border}` }}>
            <Button theme={t} onClick={() => { onLogged && onLogged(total); onClose(); }}>
              Add {items.length} item{items.length>1?'s':''} · {total} kcal</Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}

export function LogWeightSheet({ open, onClose, theme, onLogged }) {
  const t = theme;
  const [w, setW] = useState(74.2);
  useEffect(() => { if (open) setW(74.2); }, [open]);
  return (
    <Sheet open={open} onClose={onClose} theme={t} height={360}>
      <div style={{ padding: '14px 20px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>Log Weight</span>
          <IconBtn name="close" theme={t} size={36} iconSize={18} onClick={onClose} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button onClick={() => setW(v => Math.round((v-0.1)*10)/10)} style={{ width: 52, height: 52, borderRadius: 16,
              border: `1px solid ${t.border2}`, background: t.surface2, color: t.text, fontSize: 24, cursor: 'pointer' }}>−</button>
            <div style={{ textAlign: 'center', minWidth: 130 }}>
              <span style={{ fontFamily: MONO, fontSize: 52, fontWeight: 600, letterSpacing: -2 }}>{w.toFixed(1)}</span>
              <span style={{ fontSize: 18, color: t.text2, marginLeft: 6 }}>kg</span>
            </div>
            <button onClick={() => setW(v => Math.round((v+0.1)*10)/10)} style={{ width: 52, height: 52, borderRadius: 16,
              border: `1px solid ${t.border2}`, background: t.surface2, color: t.text, fontSize: 24, cursor: 'pointer' }}>+</button>
          </div>
          <Tag theme={t} color={HUE.health}>{(w-74.3).toFixed(1)} kg vs yesterday</Tag>
        </div>
        <Button theme={t} onClick={() => { onLogged && onLogged(w); onClose(); }}>Save Weight</Button>
      </div>
    </Sheet>
  );
}
