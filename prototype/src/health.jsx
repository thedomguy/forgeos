// health.jsx — Health module screens.
import { useState } from 'react';
import { Icon } from './icons.jsx';
import { Card, Ring, Bar, Tag, Sparkline, MiniBars, Chip, Button } from './ui.jsx';
import { SectionLabel } from './screens.jsx';
import { FONT, MONO, HUE, STATUS_H, NAV_H, ACCENTS, ON_ACCENT, Z, SCREEN_PAD_X } from './theme.jsx';
import {
  TODAY, MACROS, MEALS, BODY_METRICS, WEIGHT_DATES, CALORIE_WEEK, PROTEIN_WEEK, WEEK_LABELS, INSIGHTS,
} from './data.js';

export function ModuleHeader({ theme, nav, title, hue, view }) {
  const t = theme; const c = hue || HUE.health;
  const tabs = [
    { id: 'health', label: 'Dashboard' }, { id: 'nutrition', label: 'Nutrition' },
    { id: 'workouts', label: 'Workouts' }, { id: 'body', label: 'Body' }, { id: 'history', label: 'History' },
  ];
  return (
    <div style={{ paddingTop: STATUS_H, background: t.bg, position: 'sticky', top: 0, zIndex: Z.sticky,
      borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 10px' }}>
        <button onClick={() => nav.back()} style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          border: `1px solid ${t.border}`, background: t.surface, color: t.text, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronLeft" size={20} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: ON_ACCENT, background: `linear-gradient(135deg, ${c}, ${c}aa)` }}>
            <Icon name="heart" size={17} /></div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>{title}</span>
        </div>
        <button onClick={() => nav.spotlight()} style={{ width: 40, height: 40, borderRadius: 12,
          border: `1px solid ${t.border}`, background: t.surface, color: t.text2, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="command" size={19} /></button>
      </div>
      <div style={{ display: 'flex', gap: 7, padding: '0 14px 10px', overflowX: 'auto' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => nav.deep(['health', tb.id === 'health' ? null : tb.id].filter(Boolean))}
            style={{ padding: '7px 14px', borderRadius: 100, whiteSpace: 'nowrap', cursor: 'pointer',
              fontFamily: FONT, fontSize: 13.5, fontWeight: view === tb.id ? 650 : 500,
              border: `1px solid ${view === tb.id ? c : t.border}`,
              background: view === tb.id ? c + '1f' : 'transparent', color: view === tb.id ? c : t.text2 }}>
            {tb.label}</button>
        ))}
      </div>
    </div>
  );
}

export function StatTile({ theme, icon, hue, label, value, unit, sub, onClick }) {
  const t = theme;
  return (
    <Card theme={t} onClick={onClick} style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: hue, background: hue + '1c' }}><Icon name={icon} size={16} /></div>
        <span style={{ fontSize: 12.5, color: t.text2, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{value}</span>
        {unit && <span style={{ fontSize: 12.5, color: t.text3 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: t.text3, marginTop: 3 }}>{sub}</div>}
    </Card>
  );
}

// ── HEALTH DASHBOARD ───────────────────────────────────────────
export function HealthDashboard({ theme, nav }) {
  const t = theme;
  const inPct = Math.round((TODAY.caloriesIn / TODAY.caloriesGoal) * 100);
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: NAV_H + 12 }}>
      <ModuleHeader theme={t} nav={nav} title="Health" view="health" />
      {/* energy hero */}
      <div style={{ padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 0` }}>
        <Card theme={t} elevated style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Ring theme={t} value={TODAY.caloriesIn} max={TODAY.caloriesGoal} size={108} stroke={11}
              gradient={[HUE.cal, HUE.calLight]}>
              <span style={{ fontFamily: MONO, fontSize: 25, fontWeight: 600, letterSpacing: -1 }}>{(TODAY.caloriesGoal - TODAY.caloriesIn).toLocaleString()}</span>
              <span style={{ fontSize: 10.5, color: t.text3, marginTop: 1 }}>kcal left</span>
            </Ring>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[['Eaten', TODAY.caloriesIn, HUE.cal], ['Burned', TODAY.caloriesOut, HUE.burn],
                ['Goal', TODAY.caloriesGoal, t.text2]].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: t.text2 }}>{l}</span>
                  <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: c }}>{v.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          {/* macros */}
          <div style={{ display: 'flex', gap: 16, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            {MACROS.map(m => (
              <div key={m.key} style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: t.text2 }}>{m.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: t.text3 }}>{m.v}/{m.goal}{m.unit}</span>
                </div>
                <Bar theme={t} value={m.v} max={m.goal} color={m.color} height={6} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* start workout CTA */}
      <div style={{ padding: `12px ${SCREEN_PAD_X}px 0` }}>
        <Card theme={t} onClick={() => nav.deep(['health', 'workouts'])} style={{ padding: 16,
          background: `linear-gradient(120deg, ${HUE.workout}18, ${t.surface} 60%)`, border: `1px solid ${HUE.workout}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: ON_ACCENT, background: `linear-gradient(135deg, ${ACCENTS.coral.g1}, ${ACCENTS.coral.g2})`,
              boxShadow: `0 8px 20px ${HUE.workout}40` }}><Icon name="dumbbell" size={23} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 660 }}>Ready to train?</div>
              <div style={{ fontSize: 12.5, color: t.text2 }}>Push day · last done 3 days ago</div>
            </div>
            <Icon name="play" size={22} fill={HUE.workout} style={{ color: HUE.workout }} />
          </div>
        </Card>
      </div>

      {/* stat grid */}
      <SectionLabel theme={t}>Today</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: `0 ${SCREEN_PAD_X}px` }}>
        <StatTile theme={t} icon="scale" hue={HUE.weight} label="Weight" value={TODAY.weight} unit="kg"
          sub="-0.1 vs yesterday" onClick={() => nav.deep(['health', 'body'])} />
        <StatTile theme={t} icon="walk" hue={HUE.burn} label="Steps" value={TODAY.steps.toLocaleString()}
          sub={`${Math.round(TODAY.steps / TODAY.stepsGoal * 100)}% of goal`} />
        <StatTile theme={t} icon="drop" hue={HUE.water} label="Water" value={TODAY.water.v} unit="L"
          sub={`goal ${TODAY.water.goal || 3.0} L`} onClick={() => nav.quick('water')} />
        <StatTile theme={t} icon="flame" hue={HUE.cal} label="Active burn" value={TODAY.caloriesOut} unit="kcal"
          sub="walk + workout" />
      </div>

      {/* insight */}
      <SectionLabel theme={t} action="More" onAction={() => nav.deep(['health', 'history'])}>AI Health Insight</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: INSIGHTS[1].hue,
              background: INSIGHTS[1].hue + '1c' }}><Icon name={INSIGHTS[1].icon} size={19} /></div>
            <div>
              <div style={{ fontWeight: 620, fontSize: 14.5, marginBottom: 3 }}>{INSIGHTS[1].title}</div>
              <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.45 }}>{INSIGHTS[1].body}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── NUTRITION ──────────────────────────────────────────────────
export function NutritionScreen({ theme, nav }) {
  const t = theme;
  const [open, setOpen] = useState(null);
  const total = MEALS.reduce((s, m) => s + m.kcal, 0);
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: NAV_H + 70 }}>
      <ModuleHeader theme={t} nav={nav} title="Nutrition" view="nutrition" />
      {/* summary */}
      <div style={{ padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 0` }}>
        <Card theme={t} elevated style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600 }}>{total.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: t.text2, marginLeft: 6 }}>/ {TODAY.caloriesGoal.toLocaleString()} kcal</span>
            </div>
            <Tag theme={t} color={HUE.cal}>{Math.round(total / TODAY.caloriesGoal * 100)}% of goal</Tag>
          </div>
          <Bar theme={t} value={total} max={TODAY.caloriesGoal} color={HUE.cal} height={9} />
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            {MACROS.map(m => (
              <div key={m.key} style={{ flex: 1, textAlign: 'center' }}>
                <Ring theme={t} value={m.v} max={m.goal} size={52} stroke={6} color={m.color}>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600 }}>{m.v}</span>
                </Ring>
                <div style={{ fontSize: 11.5, color: t.text2, marginTop: 6 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SectionLabel theme={t}>Meals · Today</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MEALS.map(meal => {
          const isOpen = open === meal.id;
          return (
            <Card key={meal.id} theme={t} style={{ overflow: 'hidden' }}>
              <div onClick={() => setOpen(isOpen ? null : meal.id)} style={{ display: 'flex', alignItems: 'center',
                gap: 12, padding: `14px ${SCREEN_PAD_X}px`, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20, background: t.surface2 }}>{meal.items[0].emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 620 }}>{meal.meal}</div>
                  <div style={{ fontSize: 12, color: t.text3 }}>{meal.items.length} items · {meal.time}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: HUE.cal }}>{meal.kcal}</span>
                <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={18} style={{ color: t.text3 }} />
              </div>
              {isOpen && (
                <div style={{ padding: `0 ${SCREEN_PAD_X}px 8px`, borderTop: `1px solid ${t.border}` }}>
                  {meal.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0',
                      borderTop: i ? `1px solid ${t.border}` : 'none' }}>
                      <span style={{ fontSize: 18 }}>{it.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 530 }}>{it.n}</div>
                        <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3 }}>
                          P{it.p} · C{it.c} · F{it.f}</div>
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: t.text2 }}>{it.kcal}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* sticky add bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: NAV_H - 8, padding: `0 ${SCREEN_PAD_X}px`, zIndex: Z.float }}>
        <Button theme={t} onClick={() => nav.quick('food')} icon="plus"
          style={{ boxShadow: `0 10px 30px ${t.accent.glow}` }}>Add Food</Button>
      </div>
    </div>
  );
}

// ── BODY METRICS ───────────────────────────────────────────────
export function BodyScreen({ theme, nav }) {
  const t = theme;
  const w = BODY_METRICS[0];
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: NAV_H + 12 }}>
      <ModuleHeader theme={t} nav={nav} title="Body Metrics" view="body" />
      {/* weight hero */}
      <div style={{ padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 0` }}>
        <Card theme={t} elevated style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12.5, color: t.text2 }}>Current weight</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 38, fontWeight: 600, letterSpacing: -1.5 }}>{w.v}</span>
                <span style={{ fontSize: 15, color: t.text2 }}>kg</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Tag theme={t} color={HUE.health}><Icon name="arrowUp" size={11} style={{ transform: 'rotate(180deg)' }} />{Math.abs(w.delta)} kg</Tag>
                <span style={{ fontSize: 12, color: t.text3 }}>last 5 weeks</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11.5, color: t.text3 }}>Goal</div>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: t.accent.solid }}>{w.goal} kg</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Sparkline data={w.series} color={w.color} theme={t} width={338} height={70} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{WEIGHT_DATES[0]}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{WEIGHT_DATES[WEIGHT_DATES.length-1]}</span>
            </div>
          </div>
          {/* goal progress */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, color: t.text2 }}>Progress to goal</span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: t.accent.solid }}>
                {Math.round((76.1 - w.v) / (76.1 - w.goal) * 100)}%</span>
            </div>
            <Bar theme={t} value={76.1 - w.v} max={76.1 - w.goal} height={8}
              color={t.accent.solid} />
          </div>
        </Card>
      </div>

      <SectionLabel theme={t}>Measurements</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BODY_METRICS.slice(1).map(m => (
          <Card key={m.key} theme={t} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: t.text2 }}>{m.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3 }}>
                <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600 }}>{m.v}</span>
                <span style={{ fontSize: 12.5, color: t.text3 }}>{m.unit}</span>
                <Tag theme={t} color={HUE.health} style={{ marginLeft: 4 }}>{m.delta > 0 ? '+' : ''}{m.delta}{m.unit}</Tag>
              </div>
            </div>
            <Sparkline data={m.series} color={m.color} theme={t} width={110} height={44} />
          </Card>
        ))}
      </div>

      {/* progress photos */}
      <SectionLabel theme={t} action="Add" onAction={() => nav.toast('Add progress photo')}>Progress Photos</SectionLabel>
      <div style={{ display: 'flex', gap: 10, padding: `0 ${SCREEN_PAD_X}px`, overflowX: 'auto' }}>
        {['Apr 1', 'May 1', 'Jun 1'].map((d, i) => (
          <div key={d} style={{ width: 110, flexShrink: 0 }}>
            <div style={{ height: 140, borderRadius: 16, border: `1px dashed ${t.border2}`,
              background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.text3, flexDirection: 'column', gap: 6 }}>
              <Icon name="camera" size={24} /><span style={{ fontSize: 11 }}>Photo</span></div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, textAlign: 'center', marginTop: 6 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HISTORY / ANALYTICS ────────────────────────────────────────
export function HistoryScreen({ theme, nav }) {
  const t = theme;
  const [period, setPeriod] = useState('Weekly');
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: NAV_H + 12 }}>
      <ModuleHeader theme={t} nav={nav} title="History" view="history" />
      <div style={{ display: 'flex', gap: 8, padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 0` }}>
        {['Daily', 'Weekly', 'Monthly'].map(p => (
          <Chip key={p} theme={t} active={period === p} onClick={() => setPeriod(p)}
            style={{ flex: 1, justifyContent: 'center' }}>{p}</Chip>
        ))}
      </div>

      {/* calories */}
      <SectionLabel theme={t}>Calories</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600 }}>2,193</div>
              <div style={{ fontSize: 11.5, color: t.text3 }}>avg kcal / day</div>
            </div>
            <Tag theme={t} color={HUE.cal}>under goal 6/7 days</Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
            {CALORIE_WEEK.map((v, i) => {
              const max = Math.max(...CALORIE_WEEK);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: t.text3 }}>{(v/1000).toFixed(1)}k</span>
                  <div style={{ width: '100%', height: (v / max) * 64, borderRadius: 5,
                    background: i === 4 ? HUE.cal : HUE.cal + '40' }} />
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{WEEK_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* protein */}
      <SectionLabel theme={t}>Protein</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: t.text2 }}>Daily protein (g)</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: HUE.protein }}>avg 138g</span>
          </div>
          <MiniBars data={PROTEIN_WEEK} color={HUE.protein} theme={t} height={56} highlight={4} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {WEEK_LABELS.map((l, i) => <span key={i} style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3,
              flex: 1, textAlign: 'center' }}>{l}</span>)}
          </div>
        </Card>
      </div>

      {/* workout consistency */}
      <SectionLabel theme={t}>Workout Consistency</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: HUE.workout }}>4</span>
              <span style={{ fontSize: 12.5, color: t.text2, marginLeft: 6 }}>sessions this week</span>
            </div>
            <Tag theme={t} color={HUE.workout}><Icon name="flame" size={11} />4-day streak</Tag>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,1,1,1,0,1,0].map((done, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: done ? HUE.workout : t.surface2,
                  border: `1px solid ${done ? HUE.workout : t.border}`, color: done ? ON_ACCENT : t.text3 }}>
                  {done ? <Icon name="check" size={15} /> : <span style={{ fontSize: 11 }}>—</span>}</div>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{WEEK_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI observations */}
      <SectionLabel theme={t}>AI Observations</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {INSIGHTS.map(ins => (
          <Card key={ins.id} theme={t} style={{ padding: 15 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: ins.hue,
                background: ins.hue + '1c' }}><Icon name={ins.icon} size={18} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{ins.title}</div>
                <div style={{ fontSize: 12.5, color: t.text2, lineHeight: 1.45 }}>{ins.body}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
