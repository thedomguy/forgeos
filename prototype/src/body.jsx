// body.jsx — Health module body-metrics screen (metric hero, measurements, photos).
import { useState, useRef, useEffect } from 'react';
import { Icon } from './icons.jsx';
import { Card, Bar, Tag, Chip, Button, Sparkline } from './ui.jsx';
import { ModuleHeader } from './health.jsx';
import { SectionLabel } from './screens.jsx';
import { MONO, HUE, NAV_H, SCREEN_PAD_X } from './theme.jsx';
import { useBodyMetrics, useWeight } from './store.jsx';

const PHOTO_SLOTS = ['Apr 1', 'May 1', 'Jun 1'];

export function BodyScreen({ theme, nav }) {
  const t = theme;
  const bodyMetrics = useBodyMetrics();
  const weight = useWeight();

  // ── metric switcher: which measurement fills the hero ──────────
  const [sel, setSel] = useState('weight');
  const m = bodyMetrics.find(x => x.key === sel) || bodyMetrics[0];
  const start = m.series[0];
  const span = start - m.goal;
  const goalPct = span ? Math.max(0, Math.min(100, Math.round((start - m.v) / span * 100))) : 0;
  const dropped = m.delta <= 0;
  const firstLabel = sel === 'weight' ? weight.dates[0] : 'Start';
  const lastLabel = sel === 'weight' ? weight.dates[weight.dates.length - 1] : 'Now';

  // ── progress photos: real file picks held as object URLs ───────
  const [photos, setPhotos] = useState({});
  const fileRef = useRef(null);
  const pendingSlot = useRef(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => { Object.values(photosRef.current).forEach(u => URL.revokeObjectURL(u)); }, []);

  const pickFor = (slot) => { pendingSlot.current = slot; if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); } };
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    const slot = pendingSlot.current;
    if (!file || !slot) return;
    const url = URL.createObjectURL(file);
    setPhotos(prev => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot]);
      return { ...prev, [slot]: url };
    });
  };
  const addNext = () => pickFor(PHOTO_SLOTS.find(s => !photos[s]) || PHOTO_SLOTS[PHOTO_SLOTS.length - 1]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: NAV_H + 12 }}>
      <ModuleHeader theme={t} nav={nav} title="Body Metrics" view="body" />

      {/* metric switcher */}
      <div style={{ display: 'flex', gap: 8, padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 0`, overflowX: 'auto' }}>
        {bodyMetrics.map(bm => (
          <Chip key={bm.key} theme={t} active={sel === bm.key} accent={bm.color}
            onClick={() => setSel(bm.key)}>{bm.label}</Chip>
        ))}
      </div>

      {/* metric hero */}
      <div style={{ padding: `10px ${SCREEN_PAD_X}px 0` }}>
        <Card theme={t} elevated style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12.5, color: t.text2 }}>Current {m.label.toLowerCase()}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 38, fontWeight: 600, letterSpacing: -1.5 }}>{m.v}</span>
                <span style={{ fontSize: 15, color: t.text2 }}>{m.unit}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Tag theme={t} color={HUE.health}>
                  <Icon name="arrowUp" size={11} style={{ transform: dropped ? 'rotate(180deg)' : 'none' }} />
                  {Math.abs(m.delta)}{m.unit}</Tag>
                <span style={{ fontSize: 12, color: t.text3 }}>recent trend</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11.5, color: t.text3 }}>Goal</div>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: m.color }}>{m.goal} {m.unit}</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Sparkline data={m.series} color={m.color} theme={t} width={338} height={70} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{firstLabel}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{lastLabel}</span>
            </div>
          </div>
          {/* goal progress */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: t.text2 }}>Progress to goal</span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: m.color }}>{goalPct}%</span>
            </div>
            <Bar theme={t} value={start - m.v} max={span} height={8} color={m.color} />
          </div>
        </Card>
      </div>

      {/* log weight CTA */}
      <div style={{ padding: `12px ${SCREEN_PAD_X}px 0` }}>
        <Button theme={t} icon="scale" onClick={() => nav.quick('weight')}>Log Weight</Button>
      </div>

      <SectionLabel theme={t}>Measurements</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bodyMetrics.filter(bm => bm.key !== sel).map(bm => (
          <Card key={bm.key} theme={t} onClick={() => setSel(bm.key)} accent={bm.color}
            style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: t.text2 }}>{bm.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3 }}>
                <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600 }}>{bm.v}</span>
                <span style={{ fontSize: 12.5, color: t.text3 }}>{bm.unit}</span>
                <Tag theme={t} color={HUE.health} style={{ marginLeft: 4 }}>{bm.delta > 0 ? '+' : ''}{bm.delta}{bm.unit}</Tag>
              </div>
            </div>
            <Sparkline data={bm.series} color={bm.color} theme={t} width={110} height={44} />
          </Card>
        ))}
      </div>

      {/* progress photos */}
      <SectionLabel theme={t} action="Add" onAction={addNext}>Progress Photos</SectionLabel>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 10, padding: `0 ${SCREEN_PAD_X}px`, overflowX: 'auto' }}>
        {PHOTO_SLOTS.map((d) => {
          const url = photos[d];
          return (
            <div key={d} style={{ width: 110, flexShrink: 0 }}>
              <button onClick={() => pickFor(d)} style={{ display: 'block', width: '100%', padding: 0,
                border: 'none', background: 'none', cursor: 'pointer' }}>
                {url ? (
                  <div style={{ height: 140, borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.border}`,
                    position: 'relative' }}>
                    <img src={url} alt={d} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', right: 6, bottom: 6, width: 24, height: 24, borderRadius: 8,
                      background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center' }}><Icon name="pencil" size={13} /></div>
                  </div>
                ) : (
                  <div style={{ height: 140, borderRadius: 16, border: `1px dashed ${t.border2}`,
                    background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: t.text3, flexDirection: 'column', gap: 6 }}>
                    <Icon name="camera" size={24} /><span style={{ fontSize: 11 }}>Photo</span></div>
                )}
              </button>
              <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, textAlign: 'center', marginTop: 6 }}>{d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
