// foodsheet.jsx — Add Food (photo / voice / manual). Logged items flow to the store via
// onLogged(items, mealId). Real camera + Web-Speech inputs, live food search, and a
// running selected-items list with per-item portion editing & removal.
import { useState, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { Sheet, Button, IconBtn, Chip } from './ui.jsx';
import { FONT, MONO, HUE, ON_ACCENT, SCREEN_PAD_X } from './theme.jsx';
import { RECENT_FOODS, DETECTED_FOOD, FOOD_DB } from './data.js';

let SEQ = 0;
const uid = () => 'sel' + (++SEQ) + Date.now().toString(36);
const round = (n) => Math.round(n);
// trim a multiplier for display: 1, 1.5, 2 …
const fmtQty = (q) => (Number.isInteger(q) ? String(q) : q.toFixed(1));

// wrap a raw food object into a selectable item (captures a base snapshot for scaling)
function toSelectable(food) {
  const base = { kcal: food.kcal || 0, p: food.p || 0, c: food.c || 0, f: food.f || 0 };
  return {
    key: uid(), n: food.n, emoji: food.emoji || '🍽️',
    portion: food.portion || null, conf: food.conf,
    qty: 1, base, ...base,
  };
}
// scale a selectable to a new quantity multiplier
function scaled(it, qty) {
  return { ...it, qty,
    kcal: round(it.base.kcal * qty), p: round(it.base.p * qty),
    c: round(it.base.c * qty), f: round(it.base.f * qty) };
}

// which meal should be selected by default, given the current time
function defaultMealId(meals) {
  if (!meals || !meals.length) return null;
  const h = new Date().getHours();
  const wanted = h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snack' : 'Dinner';
  const m = meals.find((x) => x.meal === wanted) || meals[meals.length - 1];
  return m ? m.id : null;
}

// simulated NL parse of a spoken phrase → matched foods from the DB
function parseSpoken(transcript) {
  const q = (transcript || '').toLowerCase();
  const hits = [];
  for (const f of FOOD_DB) {
    const words = f.n.toLowerCase().replace(/[()0-9]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
    if (words.some((w) => q.includes(w)) && !hits.find((h) => h.n === f.n)) hits.push(f);
  }
  return hits;
}

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

// a single row in the running selected-items list, with a portion stepper + remove
function SelectedRow({ theme, it, onQty, onRemove }) {
  const t = theme;
  const stepBtn = (label, onClick, disabled) => (
    <button onClick={disabled ? undefined : onClick} style={{ width: 30, height: 30, borderRadius: 9,
      border: `1px solid ${t.border2}`, background: t.surface, color: disabled ? t.text3 : t.text,
      fontSize: 18, fontWeight: 600, lineHeight: 1, cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>{label}</button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
      borderRadius: 14, background: t.surface2, border: `1px solid ${t.border}`, marginBottom: 8 }}>
      <span style={{ fontSize: 22 }}>{it.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.n}</div>
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: t.text3 }}>
          {it.portion ? it.portion + ' · ' : ''}P{it.p} C{it.c} F{it.f}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {stepBtn('−', () => onQty(Math.max(0.5, round((it.qty - 0.5) * 10) / 10)), it.qty <= 0.5)}
        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, minWidth: 26, textAlign: 'center' }}>×{fmtQty(it.qty)}</span>
        {stepBtn('+', () => onQty(round((it.qty + 0.5) * 10) / 10))}
      </div>
      <div style={{ width: 44, textAlign: 'right', fontFamily: MONO, fontSize: 14, fontWeight: 600, color: HUE.cal }}>{it.kcal}</div>
      <button onClick={onRemove} aria-label="Remove" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        border: `1px solid ${t.border}`, background: 'transparent', color: t.text3, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={15} /></button>
    </div>
  );
}

export function AddFoodSheet({ open, onClose, theme, meals = [], onLogged }) {
  const t = theme;
  const [method, setMethod] = useState('photo');
  const [mealId, setMealId] = useState(null);
  const [items, setItems] = useState([]);
  // photo
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const fileRef = useRef(null);
  const scanTimer = useRef(null);
  // voice
  const [voiceState, setVoiceState] = useState('idle'); // idle | listening | done
  const [transcript, setTranscript] = useState('');
  const [voiceNote, setVoiceNote] = useState('');
  const recRef = useRef(null);
  // manual
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setMethod('photo'); setItems([]); setMealId(defaultMealId(meals));
      setScanning(false); setScanned(false); setPhotoUrl(null);
      setVoiceState('idle'); setTranscript(''); setVoiceNote(''); setQuery('');
    } else {
      if (scanTimer.current) clearTimeout(scanTimer.current);
      try { recRef.current && recRef.current.abort(); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addFoods = (foods) => setItems((p) => [...p, ...foods.map(toSelectable)]);
  const setQty = (key, qty) => setItems((p) => p.map((it) => (it.key === key ? scaled(it, qty) : it)));
  const removeItem = (key) => setItems((p) => p.filter((it) => it.key !== key));

  // ── photo recognition (real file/camera pick → simulated detection) ──
  const runRecognition = () => {
    if (scanTimer.current) clearTimeout(scanTimer.current);
    setScanning(true); setScanned(false);
    scanTimer.current = setTimeout(() => {
      setScanning(false); setScanned(true);
      addFoods(DETECTED_FOOD);
    }, 1600);
  };
  const openPicker = () => {
    if (scanning) return;
    if (fileRef.current) fileRef.current.click();
    else runRecognition(); // fallback: no file input support → tap-to-scan
  };
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    } catch {}
    runRecognition();
  };

  // ── voice (Web Speech API → simulated parse) ──
  const cannedVoice = () => {
    setTranscript('Chicken breast and broccoli');
    const parsed = parseSpoken('chicken breast and broccoli');
    addFoods(parsed.length ? parsed : DETECTED_FOOD.slice(0, 2));
    setVoiceNote('Voice input simulated on this device');
    setVoiceState('done');
  };
  const startVoice = () => {
    if (voiceState === 'listening') { try { recRef.current && recRef.current.stop(); } catch {} return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { cannedVoice(); return; }
    let rec;
    try { rec = new SR(); } catch { cannedVoice(); return; }
    recRef.current = rec;
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    setVoiceState('listening'); setTranscript(''); setVoiceNote('');
    let got = false;
    rec.onresult = (ev) => {
      got = true;
      const tr = ev.results[0][0].transcript;
      setTranscript(tr);
      const parsed = parseSpoken(tr);
      if (parsed.length) { addFoods(parsed); setVoiceNote(`Parsed ${parsed.length} item${parsed.length > 1 ? 's' : ''}`); }
      else setVoiceNote('No foods recognized — try the Manual tab');
      setVoiceState('done');
    };
    rec.onerror = () => { if (!got) cannedVoice(); };
    rec.onend = () => { setVoiceState((s) => (s === 'listening' ? (got ? 'done' : 'idle') : s)); };
    try { rec.start(); } catch { cannedVoice(); }
  };

  const results = query.trim()
    ? FOOD_DB.filter((f) => f.n.toLowerCase().includes(query.trim().toLowerCase()))
    : [];
  const total = items.reduce((s, i) => s + i.kcal, 0);
  const selMeal = meals.find((m) => m.id === mealId);

  const pickRow = (food, key) => (
    <div key={key} onClick={() => addFoods([food])} style={{ display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
      background: t.surface2, border: `1px solid ${t.border}`, marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{food.emoji}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 550 }}>{food.n}</span>
      <span style={{ fontFamily: MONO, fontSize: 13, color: t.text2 }}>{food.kcal}</span>
      <Icon name="plus" size={18} style={{ color: t.accent.solid }} />
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} theme={t} height={640}>
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={onFile} style={{ display: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px' }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>Log Food</span>
          <IconBtn name="close" theme={t} size={36} iconSize={18} onClick={onClose} />
        </div>

        {/* meal selector */}
        <div style={{ display: 'flex', gap: 8, padding: `0 ${SCREEN_PAD_X}px 12px`, overflowX: 'auto' }}>
          {meals.map((m) => (
            <Chip key={m.id} theme={t} active={m.id === mealId} accent={HUE.cal}
              onClick={() => setMealId(m.id)}>{m.meal}</Chip>
          ))}
        </div>

        {/* method tabs */}
        <div style={{ display: 'flex', gap: 8, padding: `0 ${SCREEN_PAD_X}px 14px` }}>
          <MethodTab theme={t} icon="camera" label="Photo" active={method === 'photo'} onClick={() => setMethod('photo')} />
          <MethodTab theme={t} icon="mic" label="Voice" active={method === 'voice'} onClick={() => setMethod('voice')} />
          <MethodTab theme={t} icon="pencil" label="Manual" active={method === 'manual'} onClick={() => setMethod('manual')} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: `0 ${SCREEN_PAD_X}px` }}>
          {method === 'photo' && (
            <div onClick={openPicker} style={{ height: 200, borderRadius: 20, cursor: 'pointer',
              border: `1px dashed ${t.border2}`, background: photoUrl ? `center/cover no-repeat url(${photoUrl})` : t.surface2,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
              position: 'relative', overflow: 'hidden', marginBottom: 6 }}>
              {photoUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,8,0.42)' }} />}
              {scanning ? (
                <>
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 3, top: '20%',
                    background: `linear-gradient(90deg, transparent, ${t.accent.solid}, transparent)`,
                    animation: 'forgeScan 1.4s ease-in-out infinite' }} />
                  <div style={{ width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: ON_ACCENT, zIndex: 1,
                    background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})` }}>
                    <Icon name="spark" size={24} /></div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: photoUrl ? '#fff' : t.text2, zIndex: 1 }}>Recognizing food…</span>
                </>
              ) : (
                <>
                  <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1,
                    color: photoUrl ? '#fff' : t.accent.solid, background: photoUrl ? 'rgba(255,255,255,0.16)' : t.accent.solid + '1c' }}>
                    <Icon name={scanned ? 'refresh' : 'camera'} size={28} /></div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: photoUrl ? '#fff' : t.text, zIndex: 1 }}>
                    {scanned ? 'Tap to retake' : 'Tap to capture your plate'}</span>
                  <span style={{ fontSize: 12, color: photoUrl ? 'rgba(255,255,255,0.8)' : t.text3, zIndex: 1 }}>
                    AI detects items, portions &amp; macros</span>
                </>
              )}
            </div>
          )}

          {method === 'voice' && (
            <div style={{ textAlign: 'center', paddingTop: 16, paddingBottom: 4 }}>
              <button onClick={startVoice} style={{ width: 88, height: 88, borderRadius: '50%', border: 'none',
                cursor: 'pointer', color: ON_ACCENT, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
                boxShadow: `0 12px 32px ${t.accent.glow}`,
                animation: voiceState === 'listening' ? 'forgeBlink 1.2s ease-in-out infinite' : 'none' }}>
                <Icon name={voiceState === 'listening' ? 'stop' : 'mic'} size={36} /></button>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 16 }}>
                {voiceState === 'listening' ? 'Listening…'
                  : transcript ? `“${transcript}”` : 'Tap and describe your meal'}</div>
              <div style={{ fontSize: 12.5, color: t.text3, marginTop: 5, marginBottom: 4 }}>
                {voiceState === 'listening' ? 'Speak now — e.g. “two eggs and a coffee”'
                  : voiceNote || 'e.g. “two eggs, toast and a coffee”'}</div>
            </div>
          )}

          {method === 'manual' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                background: t.surface2, borderRadius: 14, border: `1px solid ${t.border2}`, marginBottom: 14 }}>
                <Icon name="search" size={18} style={{ color: t.text3 }} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search foods…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 15, fontFamily: FONT }} />
                {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: t.text3, display: 'flex', padding: 0 }}><Icon name="close" size={16} /></button>}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, textTransform: 'uppercase',
                letterSpacing: 0.5, padding: '0 2px 8px' }}>{query.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Recent'}</div>
              {query.trim()
                ? (results.length ? results.map((f, i) => pickRow(f, 'r' + i))
                  : <div style={{ padding: '18px 0', fontSize: 13, color: t.text3, textAlign: 'center' }}>No foods match “{query.trim()}”</div>)
                : RECENT_FOODS.map((f, i) => pickRow(f, 'rec' + i))}
            </>
          )}

          {/* running selected-items list — shared across all three methods */}
          {items.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px 10px' }}>
                <Icon name="check" size={15} style={{ color: t.accent.solid }} />
                <span style={{ fontSize: 13, color: t.text2 }}>
                  {items.length} item{items.length > 1 ? 's' : ''} selected · tap ± to edit portions</span>
              </div>
              {items.map((it) => (
                <SelectedRow key={it.key} theme={t} it={it}
                  onQty={(q) => setQty(it.key, q)} onRemove={() => removeItem(it.key)} />
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        {items.length > 0 && (
          <div style={{ padding: `12px ${SCREEN_PAD_X}px 28px`, borderTop: `1px solid ${t.border}` }}>
            <Button theme={t} onClick={() => {
              const payload = items.map((it) => ({ n: it.n, kcal: it.kcal, p: it.p, c: it.c, f: it.f, emoji: it.emoji }));
              onLogged && onLogged(payload, mealId);
              onClose();
            }}>Add {items.length} item{items.length > 1 ? 's' : ''}{selMeal ? ` to ${selMeal.meal}` : ''} · {total} kcal</Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
