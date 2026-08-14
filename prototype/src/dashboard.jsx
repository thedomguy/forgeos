// dashboard.jsx — Health module dashboard (energy hero, stat grid, insight).
import { useState, useEffect } from 'react';
import { Icon } from './icons.jsx';
import { Card, Ring, Bar } from './ui.jsx';
import { ModuleHeader, StatTile } from './health.jsx';
import { SectionLabel } from './screens.jsx';
import { MONO, HUE, ACCENTS, ON_ACCENT, NAV_H, SCREEN_PAD_X } from './theme.jsx';
import { useToday, useMacros, useInsights } from './store.jsx';

export function HealthDashboard({ theme, nav }) {
  const t = theme;
  const today = useToday();
  const macros = useMacros();
  const insights = useInsights();
  const inPct = Math.round((today.caloriesIn / today.caloriesGoal) * 100);

  // rotate through the AI insights (auto-advance + tap a dot to select)
  const [insightIdx, setInsightIdx] = useState(0);
  useEffect(() => {
    if (insights.length <= 1) return;
    const id = setInterval(() => setInsightIdx(i => (i + 1) % insights.length), 6000);
    return () => clearInterval(id);
  }, [insights.length]);
  const insight = insights[insightIdx % insights.length] || insights[0];
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: NAV_H + 12 }}>
      <ModuleHeader theme={t} nav={nav} title="Health" view="health" />
      {/* energy hero */}
      <div style={{ padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 0` }}>
        <Card theme={t} elevated style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Ring theme={t} value={today.caloriesIn} max={today.caloriesGoal} size={108} stroke={11}
              gradient={[HUE.cal, HUE.calLight]}>
              <span style={{ fontFamily: MONO, fontSize: 25, fontWeight: 600, letterSpacing: -1 }}>{(today.caloriesGoal - today.caloriesIn).toLocaleString()}</span>
              <span style={{ fontSize: 10.5, color: t.text3, marginTop: 1 }}>kcal left</span>
            </Ring>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[['Eaten', today.caloriesIn, HUE.cal], ['Burned', today.caloriesOut, HUE.burn],
                ['Goal', today.caloriesGoal, t.text2]].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: t.text2 }}>{l}</span>
                  <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: c }}>{v.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          {/* macros */}
          <div style={{ display: 'flex', gap: 16, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
            {macros.map(m => (
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
        <StatTile theme={t} icon="scale" hue={HUE.weight} label="Weight" value={today.weight} unit="kg"
          sub="tap to log" onClick={() => nav.deep(['health', 'body'])} />
        <StatTile theme={t} icon="walk" hue={HUE.burn} label="Steps" value={today.steps.toLocaleString()}
          sub={`${Math.round(today.steps / today.stepsGoal * 100)}% of goal`} onClick={() => nav.quick('walk')} />
        <StatTile theme={t} icon="drop" hue={HUE.water} label="Water" value={today.water.v} unit="L"
          sub={`goal ${today.water.goal || 3.0} L`} onClick={() => nav.quick('water')} />
        <StatTile theme={t} icon="flame" hue={HUE.cal} label="Active burn" value={today.caloriesOut} unit="kcal"
          sub="walk + workout" onClick={() => nav.deep(['health', 'history'])} />
      </div>

      {/* insight */}
      <SectionLabel theme={t} action="More" onAction={() => nav.deep(['health', 'history'])}>AI Health Insight</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px` }}>
        <Card theme={t} onClick={() => nav.tab('assistant')} style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: insight.hue,
              background: insight.hue + '1c' }}><Icon name={insight.icon} size={19} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 620, fontSize: 14.5, marginBottom: 3 }}>{insight.title}</div>
              <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.45 }}>{insight.body}</div>
            </div>
          </div>
          {insights.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingLeft: 48 }}>
              {insights.map((ins, i) => (
                <button key={ins.id} aria-label={`Insight ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); setInsightIdx(i); }}
                  style={{ width: i === insightIdx ? 18 : 7, height: 7, borderRadius: 100, padding: 0,
                    border: 'none', cursor: 'pointer', transition: 'width .2s, background .2s',
                    background: i === insightIdx ? insight.hue : t.border2 }} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
