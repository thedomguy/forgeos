// workout.jsx — Workouts list + live workout session (hero flow) + live banner.
import { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';
import { Card, IconBtn, Button, Tag } from './ui.jsx';
import { ModuleHeader } from './health.jsx';
import { SectionLabel } from './screens.jsx';
import { FONT, MONO, STATUS_H, NAV_H, HUE, ACCENTS, ON_ACCENT, Z, SCREEN_PAD_X } from './theme.jsx';
import { WORKOUT_TEMPLATES } from './data.js';

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

// ── WORKOUTS LIST ──────────────────────────────────────────────
export function WorkoutsScreen({ theme, nav }) {
  const t = theme;
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
              <div style={{ fontSize: 19, fontWeight: 700 }}>Push Day</div>
              <div style={{ fontSize: 12.5, color: t.text2 }}>5 exercises · ~52 min · last 3d ago</div>
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
              <div style={{ fontFamily: MONO, fontSize: 12, color: t.text3 }}>{tpl.exCount} ex</div>
              <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{tpl.last}</div>
            </div>
          </Card>
        ))}
        <button onClick={() => nav.toast('Create custom template')} style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 16, cursor: 'pointer',
          background: 'transparent', border: `1px dashed ${t.border2}`, color: t.text2, fontFamily: FONT,
          fontSize: 14, fontWeight: 550
        }}><Icon name="plus" size={18} />Custom workout</button>
      </div>
    </div>
  );
}

// ── LIVE SESSION (hero flow) ───────────────────────────────────
export function WorkoutLive({ theme, nav, workout, api }) {
  const t = theme;
  useTicker(workout && workout.active && !workout.paused);
  if (!workout || !workout.active) { nav.back(); return null; }

  const elapsed = elapsedOf(workout);
  const allSets = workout.exercises.flatMap(e => e.sets);
  const doneSets = allSets.filter(s => s.done).length;
  const volume = workout.exercises.reduce((sum, e) =>
    sum + e.sets.filter(s => s.done).reduce((a, s) => a + s.w * s.reps, 0), 0);

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
          <button onClick={() => nav.toast('Voice note recorded')} style={{
            width: 44, height: 44, borderRadius: 100,
            border: `1px solid ${t.border2}`, background: t.surface, color: t.text2, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
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
              border: `1px solid ${exDone === ex.sets.length ? HUE.workout + '44' : t.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: `14px ${SCREEN_PAD_X}px 10px` }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 14,
                  color: exDone === ex.sets.length ? HUE.workout : t.text2,
                  background: exDone === ex.sets.length ? HUE.workout + '1c' : t.surface2
                }}>{ei + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 620 }}>{ex.name}</div>
                  <div style={{ fontSize: 11.5, color: t.text3 }}>{ex.muscle} · {exDone}/{ex.sets.length} sets</div>
                </div>
                <IconBtn name="more" theme={t} size={34} iconSize={18} onClick={() => nav.toast('Exercise options')} />
              </div>
              {/* set header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '34px 1fr 1fr 52px', gap: 8,
                padding: `4px ${SCREEN_PAD_X}px`, fontFamily: MONO, fontSize: 10.5, color: t.text3,
                textTransform: 'uppercase', letterSpacing: 0.4
              }}>
                <span>Set</span><span>Previous</span><span style={{ textAlign: 'center' }}>kg × reps</span><span></span>
              </div>
              {ex.sets.map((s, si) => (
                <div key={si} style={{
                  display: 'grid', gridTemplateColumns: '34px 1fr 1fr 52px', gap: 8,
                  alignItems: 'center', padding: `9px ${SCREEN_PAD_X}px`, transition: 'background .2s',
                  background: s.done ? HUE.workout + '10' : 'transparent'
                }}>
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: t.text2 }}>{si + 1}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12.5, color: t.text3 }}>{s.prev}</span>
                  <span style={{
                    fontFamily: MONO, fontSize: 14, fontWeight: 600, textAlign: 'center',
                    color: s.done ? HUE.workout : t.text
                  }}>{s.w} × {s.reps}</span>
                  <button onClick={() => api.toggleSet(ei, si)} style={{
                    width: 36, height: 36, borderRadius: 11,
                    marginLeft: 'auto', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', transition: 'all .15s',
                    border: `1px solid ${s.done ? HUE.workout : t.border2}`,
                    background: s.done ? HUE.workout : t.surface2, color: s.done ? ON_ACCENT : t.text3
                  }}>
                    <Icon name="check" size={18} strokeWidth={s.done ? 2.6 : 2} /></button>
                </div>
              ))}
              <button onClick={() => api.addSet(ei)} style={{
                width: '100%', padding: '11px', cursor: 'pointer',
                background: 'transparent', border: 'none', borderTop: `1px solid ${t.border}`, color: t.text2,
                fontFamily: FONT, fontSize: 13, fontWeight: 550, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6
              }}><Icon name="plus" size={15} />Add set</button>
            </Card>
          );
        })}
        <button onClick={() => nav.toast('Add exercise')} style={{
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
          <div style={{ fontSize: 13, color: t.text3, lineHeight: 1.5, fontStyle: 'italic' }}>
            "Lower back felt tight on bench — keep core braced. Increase shoulder press next week."</div>
        </Card>
      </div>
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
