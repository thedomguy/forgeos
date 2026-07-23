// workout.jsx — Workouts list + live workout session (hero flow) + live banner.
import { useState, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { Card, IconBtn, Button, Tag, Sheet } from './ui.jsx';
import { ModuleHeader } from './health.jsx';
import { SectionLabel } from './screens.jsx';
import { FONT, MONO, STATUS_H, NAV_H, HUE, ACCENTS, ON_ACCENT, DANGER, Z, SCREEN_PAD_X } from './theme.jsx';
import { WORKOUT_TEMPLATES, WORKOUT_EXERCISES, EXERCISE_LIBRARY } from './data.js';

export function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60), sec = s % 60;
  const h = Math.floor(m / 60), min = m % 60;
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// re-render every second while active
export function useTicker(active) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => set(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}

export function elapsedOf(w) {
  if (!w || !w.active) return 0;
  const end = w.paused ? w.pausedAt : Date.now();
  return end - w.startedAt - (w.pausedTotal || 0);
}

// ── helpers ────────────────────────────────────────────────────
const round1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// actual exercise count for a template (derive from the exercise arrays, fall back to the label)
function exCountOf(id, tpl) {
  const arr = WORKOUT_EXERCISES[id];
  return arr ? arr.length : (tpl ? tpl.exCount : 0);
}
// rough duration estimate: ~4 min per working set
function estMinutes(id) {
  const arr = WORKOUT_EXERCISES[id];
  if (!arr) return null;
  const sets = arr.reduce((s, e) => s + e.sets.length, 0);
  return Math.round(sets * 4);
}

// ── WORKOUTS LIST ──────────────────────────────────────────────
export function WorkoutsScreen({ theme, nav }) {
  const t = theme;
  const [customOpen, setCustomOpen] = useState(false);
  const pushTpl = WORKOUT_TEMPLATES.find(w => w.id === 'push') || WORKOUT_TEMPLATES[0];
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: NAV_H + 12 }}>
      <ModuleHeader theme={t} nav={nav} title="Workouts" view="workouts" />
      {/* quick start */}
      <div style={{ padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 0` }}>
        <Card theme={t} elevated onClick={() => nav.startWorkout('push')} style={{
          padding: 18,
          background: `linear-gradient(125deg, ${HUE.workout}22, ${ACCENTS.coral.g2}14)`, border: `1px solid ${HUE.workout}40`
        }}>
          <Tag theme={t} color={HUE.workout}>Recommended today</Tag>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: ON_ACCENT, background: `linear-gradient(135deg, ${ACCENTS.coral.g1}, ${ACCENTS.coral.g2})`,
              boxShadow: `0 8px 22px ${HUE.workout}44`
            }}><Icon name="dumbbell" size={26} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{pushTpl.name} Day</div>
              <div style={{ fontSize: 12.5, color: t.text2 }}>
                {exCountOf('push', pushTpl)} exercises · ~{estMinutes('push')} min · last {pushTpl.last}</div>
            </div>
          </div>
          <Button theme={t} onClick={(e) => { e.stopPropagation(); nav.startWorkout('push'); }} icon="play"
            style={{
              marginTop: 16, background: `linear-gradient(135deg, ${ACCENTS.coral.g1}, ${ACCENTS.coral.g2})`,
              boxShadow: `0 8px 24px ${HUE.workout}44`
            }}>Start Workout</Button>
        </Card>
      </div>

      <SectionLabel theme={t}>Templates</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {WORKOUT_TEMPLATES.map(tpl => (
          <Card key={tpl.id} theme={t} onClick={() => nav.startWorkout(tpl.id)} style={{
            padding: 14,
            display: 'flex', alignItems: 'center', gap: 13
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: tpl.hue, background: tpl.hue + '1c', fontFamily: FONT,
              fontWeight: 700, fontSize: 17
            }}>{tpl.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 620 }}>{tpl.name}</div>
              <div style={{ fontSize: 12, color: t.text3 }}>{tpl.sub}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: MONO, fontSize: 12, color: t.text3 }}>{exCountOf(tpl.id, tpl)} ex</div>
              <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{tpl.last}</div>
            </div>
          </Card>
        ))}
        <button onClick={() => setCustomOpen(true)} style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 16, cursor: 'pointer',
          background: 'transparent', border: `1px dashed ${t.border2}`, color: t.text2, fontFamily: FONT,
          fontSize: 14, fontWeight: 550
        }}><Icon name="plus" size={18} />Custom workout</button>
      </div>

      <CustomWorkoutSheet theme={t} nav={nav} open={customOpen} onClose={() => setCustomOpen(false)} />
    </div>
  );
}

// ── Custom workout sheet: name + pick a base routine, then start it ─
function CustomWorkoutSheet({ theme, nav, open, onClose }) {
  const t = theme;
  const [name, setName] = useState('');
  const [base, setBase] = useState('push');
  const start = () => { nav.startWorkout(base, name.trim() || undefined); onClose(); };
  return (
    <Sheet open={open} onClose={onClose} theme={t}>
      <div style={{ padding: `10px ${SCREEN_PAD_X}px 24px`, overflowY: 'auto' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Custom workout</div>
        <div style={{ fontSize: 12.5, color: t.text3, marginBottom: 16 }}>
          Name it and choose a routine to start from — you can add or remove exercises once you're live.</div>

        <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3, textTransform: 'uppercase',
          letterSpacing: 0.4, marginBottom: 7 }}>Name</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Push + Arms"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 12,
            border: `1px solid ${t.border2}`, background: t.surface2, color: t.text,
            fontFamily: FONT, fontSize: 14, outline: 'none', marginBottom: 18
          }} />

        <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3, textTransform: 'uppercase',
          letterSpacing: 0.4, marginBottom: 7 }}>Start from</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {WORKOUT_TEMPLATES.map(tpl => {
            const sel = base === tpl.id;
            return (
              <button key={tpl.id} onClick={() => setBase(tpl.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 13,
                cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
                border: `1px solid ${sel ? HUE.workout : t.border}`,
                background: sel ? HUE.workout + '14' : t.surface,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: tpl.hue, background: tpl.hue + '1c',
                  fontWeight: 700, fontSize: 15
                }}>{tpl.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 620, color: t.text }}>{tpl.name}</div>
                  <div style={{ fontSize: 11.5, color: t.text3 }}>{tpl.sub}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11.5, color: sel ? HUE.workout : t.text3 }}>
                  {exCountOf(tpl.id, tpl)} ex</div>
              </button>
            );
          })}
        </div>

        <Button theme={t} icon="play" onClick={start} style={{
          background: `linear-gradient(135deg, ${ACCENTS.coral.g1}, ${ACCENTS.coral.g2})`,
          boxShadow: `0 8px 24px ${HUE.workout}44`
        }}>Start {name.trim() ? `“${name.trim()}”` : 'workout'}</Button>
      </div>
    </Sheet>
  );
}

// ── weight/reps stepper (tap-to-edit input with +/- bumpers) ────
function Stepper({ theme, value, onChange, step = 1, min = 0, max = 999, unit }) {
  const t = theme;
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { setTxt(String(value)); }, [value]);
  const commit = (raw) => {
    const n = parseFloat(raw);
    if (isNaN(n)) { setTxt(String(value)); return; }
    onChange(clamp(round1(n), min, max));
  };
  const bump = (d) => onChange(clamp(round1(value + d), min, max));
  const btn = {
    width: 30, height: 30, borderRadius: 9, border: `1px solid ${t.border2}`, background: t.surface2,
    color: t.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 19, fontWeight: 600, lineHeight: 1, flexShrink: 0,
  };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <button onClick={() => bump(-step)} style={btn}>−</button>
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, minWidth: 46, justifyContent: 'center' }}>
        <input value={txt} onChange={e => setTxt(e.target.value)} onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} inputMode="decimal"
          style={{
            width: 36, textAlign: 'center', fontFamily: MONO, fontSize: 15, fontWeight: 600, color: t.text,
            background: 'transparent', border: 'none', outline: 'none', padding: 0,
          }} />
        {unit && <span style={{ fontFamily: MONO, fontSize: 11, color: t.text3 }}>{unit}</span>}
      </div>
      <button onClick={() => bump(step)} style={btn}>+</button>
    </div>
  );
}

// ── exercise "more" menu (remove last set / remove exercise) ────
function ExerciseMenuSheet({ theme, open, ex, onClose, onRemoveSet, onRemoveExercise }) {
  const t = theme;
  const row = {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 4px', cursor: 'pointer',
    background: 'transparent', border: 'none', textAlign: 'left', fontFamily: FONT, fontSize: 15,
    fontWeight: 550, color: t.text,
  };
  return (
    <Sheet open={open} onClose={onClose} theme={t}>
      <div style={{ padding: `10px ${SCREEN_PAD_X}px 22px` }}>
        {ex && <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{ex.name}</div>}
        {ex && <div style={{ fontSize: 12, color: t.text3, marginBottom: 10 }}>
          {ex.muscle} · {ex.sets.length} set{ex.sets.length === 1 ? '' : 's'}</div>}
        <button onClick={() => { onRemoveSet(); onClose(); }} disabled={!ex || ex.sets.length === 0}
          style={{ ...row, opacity: (!ex || ex.sets.length === 0) ? 0.4 : 1,
            cursor: (!ex || ex.sets.length === 0) ? 'default' : 'pointer', borderTop: `1px solid ${t.border}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: t.surface2, color: t.text2 }}>
            <Icon name="close" size={18} /></div>
          Remove last set
        </button>
        <button onClick={() => { onRemoveExercise(); onClose(); }}
          style={{ ...row, color: DANGER.text, borderTop: `1px solid ${t.border}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: DANGER.solid + '1f', color: DANGER.text }}>
            <Icon name="close" size={18} /></div>
          Remove exercise
        </button>
      </div>
    </Sheet>
  );
}

// ── add-exercise picker (search over EXERCISE_LIBRARY) ──────────
function ExercisePicker({ theme, open, onClose, onPick }) {
  const t = theme;
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const list = EXERCISE_LIBRARY.filter(e =>
    !ql || e.name.toLowerCase().includes(ql) || (e.muscle || '').toLowerCase().includes(ql));
  return (
    <Sheet open={open} onClose={onClose} theme={t} height="70%">
      <div style={{ padding: `10px ${SCREEN_PAD_X}px 8px` }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Add exercise</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12,
          border: `1px solid ${t.border2}`, background: t.surface2, marginBottom: 6 }}>
          <Icon name="search" size={17} style={{ color: t.text3 }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search exercises" autoFocus
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text,
              fontFamily: FONT, fontSize: 14 }} />
        </div>
      </div>
      <div style={{ overflowY: 'auto', padding: `4px ${SCREEN_PAD_X}px 20px`, display: 'flex',
        flexDirection: 'column', gap: 6 }}>
        {list.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: t.text3, fontSize: 13 }}>
            No exercises match “{q}”.</div>
        )}
        {list.map((e, i) => (
          <button key={i} onClick={() => { onPick(e); onClose(); }} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderRadius: 13,
            cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
            border: `1px solid ${t.border}`, background: t.surface,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: HUE.workout + '1c', color: HUE.workout }}>
              <Icon name="dumbbell" size={17} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: t.text }}>{e.name}</div>
              <div style={{ fontSize: 11.5, color: t.text3 }}>{e.muscle}</div>
            </div>
            <Icon name="plus" size={18} style={{ color: t.text3 }} />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

// ── LIVE SESSION (hero flow) ───────────────────────────────────
export function WorkoutLive({ theme, nav, workout, api }) {
  const t = theme;
  useTicker(workout && workout.active && !workout.paused);

  const [editKey, setEditKey] = useState(null); // `${ei}:${si}` of the set being edited
  const [exMenu, setExMenu] = useState(null);    // exercise index whose menu is open
  const [pickerOpen, setPickerOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);
  const notesRef = useRef(workout ? workout.notes : '');
  useEffect(() => { notesRef.current = workout ? (workout.notes || '') : ''; }, [workout]);
  // stop any live recognition when leaving the session
  useEffect(() => () => { try { recogRef.current && recogRef.current.stop(); } catch {} }, []);

  if (!workout || !workout.active) { nav.back(); return null; }

  const elapsed = elapsedOf(workout);
  const allSets = workout.exercises.flatMap(e => e.sets);
  const doneSets = allSets.filter(s => s.done).length;
  const volume = workout.exercises.reduce((sum, e) =>
    sum + e.sets.filter(s => s.done).reduce((a, s) => a + s.w * s.reps, 0), 0);

  // Web Speech API voice note → appended to workout.notes, with graceful fallback
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { nav.toast('Voice notes not supported on this browser'); return; }
    if (listening) { try { recogRef.current && recogRef.current.stop(); } catch {} return; }
    let r;
    try { r = new SR(); } catch { nav.toast('Voice capture unavailable'); return; }
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => {
      const txt = Array.from(e.results).map(x => x[0].transcript).join(' ').trim();
      if (txt) {
        const cur = notesRef.current || '';
        api.setNotes(cur ? `${cur} ${txt}` : txt);
        nav.toast('Voice note added');
      }
    };
    r.onerror = (e) => {
      setListening(false);
      nav.toast(e && e.error === 'not-allowed' ? 'Microphone permission denied' : 'Voice capture failed');
    };
    r.onend = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); nav.toast('Voice capture failed'); }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: t.bg, paddingBottom: 120 }}>
      {/* top bar */}
      <div style={{
        paddingTop: STATUS_H, position: 'sticky', top: 0, zIndex: Z.sticky, background: t.bg,
        borderBottom: `1px solid ${t.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px 10px' }}>
          <button onClick={() => nav.minimizeWorkout()} style={{
            width: 40, height: 40, borderRadius: 12,
            border: `1px solid ${t.border}`, background: t.surface, color: t.text, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <Icon name="chevronDown" size={20} /></button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 680 }}>{workout.name} Day</div>
            <div style={{ fontSize: 11.5, color: t.text2 }}>{doneSets}/{allSets.length} sets · {(volume / 1000).toFixed(1)}k kg vol</div>
          </div>
          <button onClick={() => api.finish()} style={{
            padding: '9px 15px', borderRadius: 12, border: 'none',
            cursor: 'pointer', fontFamily: FONT, fontSize: 13.5, fontWeight: 650, color: ON_ACCENT,
            background: `linear-gradient(135deg, ${ACCENTS.coral.g1}, ${ACCENTS.coral.g2})`
          }}>Finish</button>
        </div>
      </div>

      {/* timer */}
      <div style={{ padding: `20px ${SCREEN_PAD_X}px 4px`, textAlign: 'center' }}>
        <div style={{
          fontFamily: MONO, fontSize: 64, fontWeight: 600, letterSpacing: -2, lineHeight: 1,
          color: workout.paused ? t.text3 : t.text, fontVariantNumeric: 'tabular-nums'
        }}>{fmtTime(elapsed)}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={() => workout.paused ? api.resume() : api.pause()} style={{
            display: 'flex',
            alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 100, cursor: 'pointer',
            fontFamily: FONT, fontSize: 14, fontWeight: 600,
            border: `1px solid ${t.border2}`, background: t.surface, color: t.text
          }}>
            <Icon name={workout.paused ? 'play' : 'pause'} size={17} />{workout.paused ? 'Resume' : 'Pause'}</button>
          <button onClick={startVoice} title="Voice note" style={{
            width: 44, height: 44, borderRadius: 100,
            border: `1px solid ${listening ? DANGER.solid : t.border2}`,
            background: listening ? DANGER.solid + '1f' : t.surface,
            color: listening ? DANGER.text : t.text2, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s'
          }}><Icon name="mic" size={19} /></button>
        </div>
      </div>

      {/* exercises */}
      <div style={{ padding: `20px ${SCREEN_PAD_X}px 0`, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {workout.exercises.map((ex, ei) => {
          const exDone = ex.sets.filter(s => s.done).length;
          return (
            <Card key={ex.id} theme={t} style={{
              padding: 0, overflow: 'hidden',
              border: `1px solid ${exDone === ex.sets.length && ex.sets.length ? HUE.workout + '44' : t.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: `14px ${SCREEN_PAD_X}px 10px` }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 14,
                  color: exDone === ex.sets.length && ex.sets.length ? HUE.workout : t.text2,
                  background: exDone === ex.sets.length && ex.sets.length ? HUE.workout + '1c' : t.surface2
                }}>{ei + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 620 }}>{ex.name}</div>
                  <div style={{ fontSize: 11.5, color: t.text3 }}>{ex.muscle} · {exDone}/{ex.sets.length} sets</div>
                </div>
                <IconBtn name="more" theme={t} size={34} iconSize={18} onClick={() => setExMenu(ei)} />
              </div>
              {/* set header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '34px 1fr 1fr 52px', gap: 8,
                padding: `4px ${SCREEN_PAD_X}px`, fontFamily: MONO, fontSize: 10.5, color: t.text3,
                textTransform: 'uppercase', letterSpacing: 0.4
              }}>
                <span>Set</span><span>Previous</span><span style={{ textAlign: 'center' }}>kg × reps</span><span></span>
              </div>
              {ex.sets.map((s, si) => {
                const key = `${ei}:${si}`;
                if (editKey === key) {
                  return (
                    <div key={si} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: `9px ${SCREEN_PAD_X}px`, background: HUE.workout + '10'
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: t.text2, width: 34 }}>{si + 1}</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Stepper theme={t} value={s.w} step={2.5} min={0} max={999} unit="kg"
                          onChange={(v) => api.editSet(ei, si, { w: v })} />
                        <span style={{ fontFamily: MONO, fontSize: 14, color: t.text3 }}>×</span>
                        <Stepper theme={t} value={s.reps} step={1} min={1} max={99}
                          onChange={(v) => api.editSet(ei, si, { reps: v })} />
                      </div>
                      <button onClick={() => setEditKey(null)} title="Done editing" style={{
                        width: 36, height: 36, borderRadius: 11, marginLeft: 'auto', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${HUE.workout}`, background: HUE.workout + '1f', color: HUE.workout
                      }}><Icon name="check" size={18} strokeWidth={2.4} /></button>
                    </div>
                  );
                }
                return (
                  <div key={si} style={{
                    display: 'grid', gridTemplateColumns: '34px 1fr 1fr 52px', gap: 8,
                    alignItems: 'center', padding: `9px ${SCREEN_PAD_X}px`, transition: 'background .2s',
                    background: s.done ? HUE.workout + '10' : 'transparent'
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: t.text2 }}>{si + 1}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12.5, color: t.text3 }}>{s.prev}</span>
                    <button onClick={() => setEditKey(key)} title="Tap to edit" style={{
                      fontFamily: MONO, fontSize: 14, fontWeight: 600, textAlign: 'center',
                      color: s.done ? HUE.workout : t.text, background: 'transparent', cursor: 'pointer',
                      border: 'none', borderBottom: `1px dashed ${t.border2}`, padding: '2px 0', justifySelf: 'center'
                    }}>{s.w} × {s.reps}</button>
                    <button onClick={() => api.toggleSet(ei, si)} style={{
                      width: 36, height: 36, borderRadius: 11,
                      marginLeft: 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', transition: 'all .15s',
                      border: `1px solid ${s.done ? HUE.workout : t.border2}`,
                      background: s.done ? HUE.workout : t.surface2, color: s.done ? ON_ACCENT : t.text3
                    }}>
                      <Icon name="check" size={18} strokeWidth={s.done ? 2.6 : 2} /></button>
                  </div>
                );
              })}
              <button onClick={() => api.addSet(ei)} style={{
                width: '100%', padding: '11px', cursor: 'pointer',
                background: 'transparent', border: 'none', borderTop: `1px solid ${t.border}`, color: t.text2,
                fontFamily: FONT, fontSize: 13, fontWeight: 550, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6
              }}><Icon name="plus" size={15} />Add set</button>
            </Card>
          );
        })}
        <button onClick={() => setPickerOpen(true)} style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 16, cursor: 'pointer',
          background: 'transparent', border: `1px dashed ${t.border2}`, color: t.text2, fontFamily: FONT,
          fontSize: 14, fontWeight: 550
        }}><Icon name="plus" size={18} />Add exercise</button>

        {/* notes */}
        <Card theme={t} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Icon name="pencil" size={16} style={{ color: t.text2 }} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Workout Notes</span>
          </div>
          <textarea value={workout.notes || ''} onChange={(e) => api.setNotes(e.target.value)}
            placeholder="Add a note about this session — how it felt, what to change next time…"
            rows={3} style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 58,
              background: 'transparent', border: 'none', outline: 'none', color: t.text,
              fontFamily: FONT, fontSize: 13, lineHeight: 1.5,
            }} />
        </Card>
      </div>

      <ExerciseMenuSheet theme={t} open={exMenu !== null} ex={exMenu !== null ? workout.exercises[exMenu] : null}
        onClose={() => setExMenu(null)}
        onRemoveSet={() => { const ex = workout.exercises[exMenu]; if (ex && ex.sets.length) api.removeSet(exMenu, ex.sets.length - 1); }}
        onRemoveExercise={() => api.removeExercise(exMenu)} />
      <ExercisePicker theme={t} open={pickerOpen} onClose={() => setPickerOpen(false)}
        onPick={(e) => api.addExercise({ name: e.name, muscle: e.muscle })} />
    </div>
  );
}

// ── LIVE ACTIVITY BANNER (persists while navigating) ───────────
export function WorkoutBanner({ theme, workout, onOpen }) {
  const t = theme;
  useTicker(workout && workout.active && !workout.paused);
  if (!workout || !workout.active) return null;
  const elapsed = elapsedOf(workout);
  const allSets = workout.exercises.flatMap(e => e.sets);
  const doneSets = allSets.filter(s => s.done).length;
  return (
    <div onClick={onOpen} style={{
      position: 'absolute', bottom: NAV_H + 12, left: 12, right: 12, zIndex: Z.floatHi,
      cursor: 'pointer', borderRadius: 18, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
      background: `linear-gradient(135deg, ${ACCENTS.coral.g1}f5, ${ACCENTS.coral.g2}f5)`,
      boxShadow: `0 12px 30px ${ACCENTS.coral.g2}66`, color: ON_ACCENT,
      animation: 'forgeRise .35s cubic-bezier(.32,.72,0,1)'
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon name={workout.paused ? 'pause' : 'dumbbell'} size={18} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 680 }}>{workout.name} Day {workout.paused ? '· paused' : 'in progress'}</div>
        <div style={{ fontSize: 11.5, opacity: 0.9 }}>{doneSets}/{allSets.length} sets done</div>
      </div>
      <div style={{
        fontFamily: MONO, fontSize: 19, fontWeight: 600, letterSpacing: -0.5,
        fontVariantNumeric: 'tabular-nums'
      }}>{fmtTime(elapsed)}</div>
      <Icon name="chevronUp" size={18} style={{ opacity: 0.85 }} />
    </div>
  );
}
