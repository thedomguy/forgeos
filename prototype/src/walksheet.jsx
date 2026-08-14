// walksheet.jsx — Track Walk. Finishes the previously toast-only "Track Walk" action:
// distance + duration → onLogged({ km, min, kcal, steps }) → store (timeline + steps + burn).
// A lightweight start/stop timer accumulates live duration/distance; the manual steppers
// and log path stay fully intact.
import { useState, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { Sheet, Button, IconBtn } from './ui.jsx';
import { MONO, HUE, SCREEN_PAD_X } from './theme.jsx';

const PACE_KM_PER_MIN = 0.083; // ~5 km/h walking pace, for the live accumulation

function Stepper({ theme, label, value, unit, onDec, onInc, disabled }) {
  const t = theme;
  const btn = { width: 40, height: 40, borderRadius: 13, border: `1px solid ${t.border2}`,
    background: t.surface2, color: t.text, fontSize: 20, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1 };
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: t.text3, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <button onClick={disabled ? undefined : onDec} style={btn}>−</button>
        <div style={{ minWidth: 70 }}>
          <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600 }}>{value}</span>
          <span style={{ fontSize: 13, color: t.text2, marginLeft: 4 }}>{unit}</span>
        </div>
        <button onClick={disabled ? undefined : onInc} style={btn}>+</button>
      </div>
    </div>
  );
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function TrackWalkSheet({ open, onClose, theme, onLogged }) {
  const t = theme;
  const [km, setKm] = useState(2.4);
  const [min, setMin] = useState(28);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds accumulated in the current run
  const base = useRef({ km: 2.4, min: 28 });  // km/min at the moment Start was pressed

  useEffect(() => { if (open) { setKm(2.4); setMin(28); setRunning(false); setElapsed(0); } }, [open]);

  // tick while running
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // grow duration + distance from the captured baseline as time accumulates
  useEffect(() => {
    if (!running) return;
    const addMin = elapsed / 60;
    setMin(Math.max(1, Math.round(base.current.min + addMin)));
    setKm(Math.max(0.1, Math.round((base.current.km + addMin * PACE_KM_PER_MIN) * 10) / 10));
  }, [elapsed, running]);

  const kcal = Math.round(km * 58);
  const steps = Math.round(km * 1300);

  const toggle = () => {
    if (running) { setRunning(false); return; }
    base.current = { km, min };
    setElapsed(0);
    setRunning(true);
  };

  return (
    <Sheet open={open} onClose={onClose} theme={t} height={470}>
      <div style={{ padding: '14px 20px 28px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>Track Walk</span>
          <IconBtn name="close" theme={t} size={36} iconSize={18} onClick={onClose} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 0 14px' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: HUE.burn, background: HUE.burn + '1c' }}>
            <Icon name="walk" size={30} /></div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: HUE.burn }}>{kcal}</span>
            <span style={{ fontSize: 13, color: t.text2 }}>kcal · {steps.toLocaleString()} steps</span>
          </div>
        </div>

        {/* live start/stop timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${SCREEN_PAD_X}px 14px` }}>
          <button onClick={toggle} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '11px 0', borderRadius: 13, cursor: 'pointer',
            border: `1px solid ${running ? HUE.burn : t.border2}`,
            background: running ? HUE.burn + '1f' : t.surface2, color: running ? HUE.burn : t.text }}>
            <Icon name={running ? 'stop' : 'play'} size={18} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{running ? 'Stop' : 'Start'}</span>
          </button>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, minWidth: 62, textAlign: 'center',
            color: running ? HUE.burn : t.text3 }}>{fmt(elapsed)}</div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: `0 ${SCREEN_PAD_X}px 8px` }}>
          <Stepper theme={t} label="Distance" value={km.toFixed(1)} unit="km" disabled={running}
            onDec={() => setKm(v => Math.max(0.1, Math.round((v-0.1)*10)/10))}
            onInc={() => setKm(v => Math.round((v+0.1)*10)/10)} />
          <Stepper theme={t} label="Duration" value={min} unit="min" disabled={running}
            onDec={() => setMin(v => Math.max(1, v-1))} onInc={() => setMin(v => v+1)} />
        </div>

        <div style={{ flex: 1 }} />
        <Button theme={t} icon="walk"
          onClick={() => { setRunning(false); onLogged && onLogged({ km: Number(km.toFixed(1)), min, kcal, steps }); onClose(); }}>
          Log Walk</Button>
      </div>
    </Sheet>
  );
}
