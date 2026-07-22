// assistant.jsx — Forge AI Assistant (cross-module retrieval, inline data cards).
import { useState, useCallback, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { IconBtn, Tag } from './ui.jsx';
import { FONT, MONO, HUE, STATUS_H, ON_ACCENT, SCREEN_PAD_X } from './theme.jsx';
import { MODULES, SUGGESTIONS, ASSISTANT_ANSWERS } from './data.js';

function ChartCard({ chart, theme }) {
  const t = theme;
  if (!chart) return null;
  if (chart.type === 'bars') {
    const max = Math.max(...chart.data, 1);
    const peak = chart.data.indexOf(max);
    return (
      <div style={{ marginTop: 12, padding: 14, borderRadius: 16, background: t.surface2,
        border: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: t.text2 }}>{chart.label}</span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: chart.color }}>peak {max.toLocaleString()}{chart.unit ? ' ' + chart.unit : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 72 }}>
          {chart.data.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', height: Math.max(6, (v / max) * 64), borderRadius: 5,
                background: i === peak ? chart.color : chart.color + '40',
                transition: 'height .6s', transitionDelay: (i * 60) + 'ms' }} />
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{chart.labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (chart.type === 'split') {
    const total = chart.data.reduce((s, d) => s + d.v, 0);
    return (
      <div style={{ marginTop: 12, padding: 14, borderRadius: 16, background: t.surface2,
        border: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text2, marginBottom: 10 }}>{chart.label}</div>
        <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
          {chart.data.map(d => <div key={d.n} style={{ width: (d.v / total * 100) + '%', background: d.c }} />)}
        </div>
        {chart.data.map(d => (
          <div key={d.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: 3, background: d.c }} />
            <span style={{ flex: 1, fontSize: 13, color: t.text }}>{d.n}</span>
            <span style={{ fontFamily: MONO, fontSize: 13, color: t.text2 }}>{chart.unit}{d.v.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function SummaryGrid({ summary, theme }) {
  const t = theme;
  return (
    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {summary.map(s => (
        <div key={s.k} style={{ padding: 12, borderRadius: 14, background: t.surface2, border: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: s.hue, background: s.hue + '1c' }}><Icon name={s.icon} size={15} /></div>
            <span style={{ fontSize: 11.5, color: t.text3 }}>{s.k}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 600 }}>{s.v}</div>
          <div style={{ fontSize: 11, color: t.text3, marginTop: 2 }}>{s.d}</div>
        </div>
      ))}
    </div>
  );
}

function Sources({ sources, theme }) {
  const t = theme;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
      <span style={{ fontSize: 11, color: t.text3, alignSelf: 'center' }}>Sources</span>
      {sources.map(s => <Tag key={s} theme={t} color={t.text2} style={{ textTransform: 'none', letterSpacing: 0 }}>
        <Icon name="layers" size={11} />{s}</Tag>)}
    </div>
  );
}

function TypingDots({ theme }) {
  const t = theme;
  return (
    <div style={{ display: 'flex', gap: 5, padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: 7, background: t.text3,
          animation: `forgeBlink 1.2s ${i * 0.18}s infinite ease-in-out` }} />
      ))}
    </div>
  );
}

export function AssistantScreen({ theme, nav, seed, onSeedUsed }) {
  const t = theme;
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  const scrollDown = () => requestAnimationFrame(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  });

  const ask = useCallback((text) => {
    const q = (text || '').trim();
    if (!q) return;
    setDraft('');
    setMessages(m => [...m, { role: 'user', text: q }]);
    setThinking(true);
    scrollDown();
    const ans = ASSISTANT_ANSWERS[q] || {
      text: "I can pull from every Forge module to answer that. Right now Health is your most active module — try asking about calories, workouts, weight, or a weekly summary.",
      sources: ['Forge · All modules'],
    };
    setTimeout(() => {
      setThinking(false);
      setMessages(m => [...m, { role: 'assistant', ...ans, animate: true }]);
      scrollDown();
    }, 950);
  }, []);

  useEffect(() => { if (seed) { ask(seed); onSeedUsed && onSeedUsed(); } }, [seed]);
  useEffect(() => { scrollDown(); }, [messages, thinking]);

  const empty = messages.length === 0 && !thinking;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: `${STATUS_H + 6}px 20px 12px`, display: 'flex',
        alignItems: 'center', gap: 12, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: ON_ACCENT, background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
          boxShadow: `0 6px 18px ${t.accent.glow}` }}><Icon name="spark" size={21} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 680, letterSpacing: -0.3 }}>Forge Assistant</div>
          <div style={{ fontSize: 12, color: t.text2, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 6, background: HUE.health }} />
            Connected to {MODULES.filter(m => m.installed).length} module · 9 sources</div>
        </div>
        {messages.length > 0 && <IconBtn name="refresh" theme={t} size={38} iconSize={18}
          onClick={() => setMessages([])} />}
      </div>

      {/* thread */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 8px` }}>
        {empty && (
          <div style={{ paddingTop: 30 }}>
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: ON_ACCENT,
                background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
                boxShadow: `0 12px 30px ${t.accent.glow}` }}><Icon name="spark" size={30} /></div>
              <div style={{ fontSize: 20, fontWeight: 680, letterSpacing: -0.4 }}>Ask Forge anything</div>
              <div style={{ fontSize: 13.5, color: t.text2, marginTop: 6, lineHeight: 1.5, maxWidth: 280,
                marginLeft: 'auto', marginRight: 'auto' }}>
                I retrieve across all your modules — nutrition, training, finance and more — to answer in plain language.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => ask(s)} style={{ display: 'flex', alignItems: 'center', gap: 11,
                  padding: `14px ${SCREEN_PAD_X}px`, borderRadius: 15, cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: t.surface, border: `1px solid ${t.border}`, color: t.text }}>
                  <Icon name="spark" size={17} style={{ color: t.accent.solid }} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 530 }}>{s}</span>
                  <Icon name="arrowUp" size={15} style={{ color: t.text3, transform: 'rotate(45deg)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              <div style={{ maxWidth: '82%', padding: '11px 15px', borderRadius: '18px 18px 5px 18px',
                background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`, color: ON_ACCENT,
                fontSize: 14.5, lineHeight: 1.45, fontWeight: 500 }}>{m.text}</div>
            </div>
          ) : (
            <div key={i} className={m.animate ? 'forge-rise' : ''} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: ON_ACCENT, marginTop: 2,
                background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})` }}><Icon name="spark" size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.55, color: t.text }}>{m.text}</div>
                {m.chart && <ChartCard chart={m.chart} theme={t} />}
                {m.summary && <SummaryGrid summary={m.summary} theme={t} />}
                {m.sources && <Sources sources={m.sources} theme={t} />}
              </div>
            </div>
          )
        ))}

        {thinking && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: ON_ACCENT,
              background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})` }}><Icon name="spark" size={16} /></div>
            <div style={{ paddingTop: 4 }}>
              <TypingDots theme={t} />
              <div style={{ fontSize: 11.5, color: t.text3, marginTop: 4 }}>Retrieving across modules…</div>
            </div>
          </div>
        )}
      </div>

      {/* input bar */}
      <div style={{ padding: '10px 14px', paddingBottom: 28, borderTop: `1px solid ${t.border}`,
        background: t.navBg, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, padding: `6px 6px 6px ${SCREEN_PAD_X}px`,
            background: t.surface, borderRadius: 22, border: `1px solid ${t.border2}` }}>
            <input value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask(draft)}
              placeholder="Ask across your modules…" style={{ flex: 1, background: 'none', border: 'none',
              outline: 'none', color: t.text, fontSize: 15, fontFamily: FONT }} />
            <IconBtn name="mic" theme={t} size={34} iconSize={18} onClick={() => nav.toast('Voice input')} />
          </div>
          <button onClick={() => ask(draft)} disabled={!draft.trim()} style={{ width: 46, height: 46, borderRadius: 16,
            border: 'none', cursor: draft.trim() ? 'pointer' : 'default', flexShrink: 0, color: ON_ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: draft.trim() ? 1 : 0.4,
            background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
            boxShadow: draft.trim() ? `0 6px 18px ${t.accent.glow}` : 'none' }}>
            <Icon name="arrowUp" size={21} strokeWidth={2.2} /></button>
        </div>
      </div>
    </div>
  );
}
