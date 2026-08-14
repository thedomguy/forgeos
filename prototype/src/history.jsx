// history.jsx — Health module history / analytics screen.
import { useState } from 'react';
import { Icon } from './icons.jsx';
import { Card, Tag, MiniBars, Chip } from './ui.jsx';
import { ModuleHeader } from './health.jsx';
import { SectionLabel } from './screens.jsx';
import { MONO, HUE, NAV_H, ON_ACCENT, SCREEN_PAD_X } from './theme.jsx';
import { HISTORY } from './data.js';
import { useInsights } from './store.jsx';

const SPAN_WORD = { Daily: 'today', Weekly: 'this week', Monthly: 'this month' };

export function HistoryScreen({ theme, nav }) {
  const t = theme;
  const insights = useInsights();
  const [period, setPeriod] = useState('Weekly');
  const h = HISTORY[period];
  const cal = h.calories, pro = h.protein, wk = h.workouts;
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
              <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600 }}>{cal.avg.toLocaleString()}</div>
              <div style={{ fontSize: 11.5, color: t.text3 }}>avg kcal / day</div>
            </div>
            <Tag theme={t} color={HUE.cal}>{cal.note}</Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
            {cal.data.map((v, i) => {
              const max = Math.max(...cal.data, 1);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: t.text3 }}>{(v/1000).toFixed(1)}k</span>
                  <div style={{ width: '100%', height: (v / max) * 64, borderRadius: 5,
                    background: i === cal.highlight ? HUE.cal : HUE.cal + '40' }} />
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{cal.labels[i]}</span>
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
            <span style={{ fontSize: 13, color: t.text2 }}>Protein (g)</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: HUE.protein }}>avg {pro.avg}g</span>
          </div>
          <MiniBars data={pro.data} color={HUE.protein} theme={t} height={56} highlight={pro.highlight} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {pro.labels.map((l, i) => <span key={i} style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3,
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
              <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: HUE.workout }}>{wk.count}</span>
              <span style={{ fontSize: 12.5, color: t.text2, marginLeft: 6 }}>sessions {SPAN_WORD[period]}</span>
            </div>
            <Tag theme={t} color={HUE.workout}><Icon name="flame" size={11} />{wk.streak}-day streak</Tag>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {wk.dots.map((done, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: done ? HUE.workout : t.surface2,
                  border: `1px solid ${done ? HUE.workout : t.border}`, color: done ? ON_ACCENT : t.text3 }}>
                  {done ? <Icon name="check" size={15} /> : <span style={{ fontSize: 11 }}>—</span>}</div>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{wk.labels[i]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI observations */}
      <SectionLabel theme={t}>AI Observations</SectionLabel>
      <div style={{ padding: `0 ${SCREEN_PAD_X}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights.map(ins => (
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
