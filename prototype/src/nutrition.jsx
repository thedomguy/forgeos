// nutrition.jsx — Health module nutrition screen (summary + meals).
import { useState } from 'react';
import { Icon } from './icons.jsx';
import { Card, Ring, Bar, Tag, Button } from './ui.jsx';
import { ModuleHeader } from './health.jsx';
import { SectionLabel } from './screens.jsx';
import { FONT, MONO, HUE, NAV_H, Z, SCREEN_PAD_X } from './theme.jsx';
import { useMeals, useMacros, useToday, useStore } from './store.jsx';

const round = (n) => Math.round(n);
const fmtQty = (q) => (Number.isInteger(q) ? String(q) : q.toFixed(1));

export function NutritionScreen({ theme, nav }) {
  const t = theme;
  const meals = useMeals();
  const macros = useMacros();
  const today = useToday();
  const store = useStore();
  const [open, setOpen] = useState(null);
  // { mealId, i, base:{kcal,p,c,f}, mult } — the one food item currently being edited
  const [edit, setEdit] = useState(null);
  const total = meals.reduce((s, m) => s + m.kcal, 0);

  const startEdit = (mealId, i, it) => setEdit({ mealId, i,
    base: { kcal: it.kcal, p: it.p, c: it.c, f: it.f }, mult: 1 });
  const applyMult = (mult) => {
    if (!edit) return;
    const { base } = edit;
    store.editFoodItem(edit.mealId, edit.i, {
      kcal: round(base.kcal * mult), p: round(base.p * mult),
      c: round(base.c * mult), f: round(base.f * mult) });
    setEdit({ ...edit, mult });
  };
  const removeAt = (mealId, i) => { store.removeFoodItem(mealId, i); setEdit(null); };

  const stepBtn = (label, onClick, disabled) => (
    <button onClick={disabled ? undefined : onClick} style={{ width: 30, height: 30, borderRadius: 9,
      border: `1px solid ${t.border2}`, background: t.surface, color: disabled ? t.text3 : t.text,
      fontSize: 18, fontWeight: 600, lineHeight: 1, cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>{label}</button>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: NAV_H + 70 }}>
      <ModuleHeader theme={t} nav={nav} title="Nutrition" view="nutrition" />
      {/* summary */}
      <div style={{ padding: `${SCREEN_PAD_X}px ${SCREEN_PAD_X}px 0` }}>
        <Card theme={t} elevated style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600 }}>{total.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: t.text2, marginLeft: 6 }}>/ {today.caloriesGoal.toLocaleString()} kcal</span>
            </div>
            <Tag theme={t} color={HUE.cal}>{Math.round(total / today.caloriesGoal * 100)}% of goal</Tag>
          </div>
          <Bar theme={t} value={total} max={today.caloriesGoal} color={HUE.cal} height={9} />
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            {macros.map(m => (
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
        {meals.map(meal => {
          const isOpen = open === meal.id;
          return (
            <Card key={meal.id} theme={t} style={{ overflow: 'hidden' }}>
              <div onClick={() => setOpen(isOpen ? null : meal.id)} style={{ display: 'flex', alignItems: 'center',
                gap: 12, padding: `14px ${SCREEN_PAD_X}px`, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 20, background: t.surface2 }}>{meal.items[0] ? meal.items[0].emoji : '🍽️'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 620 }}>{meal.meal}</div>
                  <div style={{ fontSize: 12, color: t.text3 }}>{meal.items.length} items · {meal.time}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: HUE.cal }}>{meal.kcal}</span>
                <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={18} style={{ color: t.text3 }} />
              </div>
              {isOpen && (
                <div style={{ padding: `0 ${SCREEN_PAD_X}px 12px`, borderTop: `1px solid ${t.border}` }}>
                  {meal.items.map((it, i) => {
                    const editing = edit && edit.mealId === meal.id && edit.i === i;
                    return (
                      <div key={i} style={{ borderTop: i ? `1px solid ${t.border}` : 'none' }}>
                        <div onClick={() => editing ? setEdit(null) : startEdit(meal.id, i, it)}
                          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', cursor: 'pointer' }}>
                          <span style={{ fontSize: 18 }}>{it.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 530 }}>{it.n}</div>
                            <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3 }}>
                              P{it.p} · C{it.c} · F{it.f}</div>
                          </div>
                          <span style={{ fontFamily: MONO, fontSize: 13, color: t.text2 }}>{it.kcal}</span>
                          <Icon name="pencil" size={14} style={{ color: editing ? t.accent.solid : t.text3 }} />
                        </div>
                        {editing && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 12px' }}>
                            <span style={{ fontSize: 12, color: t.text3 }}>Portion</span>
                            {stepBtn('−', () => applyMult(Math.max(0.5, round((edit.mult - 0.5) * 10) / 10)), edit.mult <= 0.5)}
                            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>×{fmtQty(edit.mult)}</span>
                            {stepBtn('+', () => applyMult(round((edit.mult + 0.5) * 10) / 10))}
                            <div style={{ flex: 1 }} />
                            <Button theme={t} kind="danger" size="sm" icon="close"
                              style={{ width: 'auto' }} onClick={() => removeAt(meal.id, i)}>Remove</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {meal.items.length === 0 && (
                    <div style={{ padding: '14px 0', fontSize: 13, color: t.text3, textAlign: 'center' }}>
                      Nothing logged yet</div>
                  )}
                  <button onClick={() => nav.quick('food')} style={{ display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 7, width: '100%', marginTop: 8, padding: '10px',
                    borderRadius: 12, cursor: 'pointer', fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
                    color: t.accent.solid, background: t.accent.solid + '14', border: `1px dashed ${t.accent.solid}44` }}>
                    <Icon name="plus" size={16} />Add to {meal.meal}</button>
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
