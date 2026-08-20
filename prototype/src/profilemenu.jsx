// profilemenu.jsx — avatar → account popup.
//
// Mirrors the splitwise app's ProfileMenu options (Install app / Change
// password / Log out). Rendered as an anchored popover rather than a bottom
// sheet: it hangs off the avatar it was launched from, which reads as a native
// menu instead of a full modal for three short actions.
import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './icons.jsx';
import { FONT, ON_ACCENT, DANGER, Z, RADIUS } from './theme.jsx';

// ── PWA install ────────────────────────────────────────────────
// Chrome/Edge fire `beforeinstallprompt` and let us trigger the native sheet.
// iOS Safari never does — there the only path is Share → Add to Home Screen,
// so we detect it and show instructions instead of a dead button.
export function usePwaInstall() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true,
  );

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  }, [deferred]);

  return { canPromptInstall: !!deferred, promptInstall, installed, isIOS };
}

// ── menu ───────────────────────────────────────────────────────
export function ProfileMenu({ theme, user, onLogout, onToast, size = 42 }) {
  const t = theme;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('menu'); // 'menu' | 'password'
  const wrapRef = useRef(null);
  const { canPromptInstall, promptInstall, installed, isIOS } = usePwaInstall();

  const name = user?.name || 'Forge';
  const initial = name.trim().slice(0, 1).toUpperCase() || 'F';

  const close = useCallback(() => { setOpen(false); setView('menu'); }, []);

  // Dismiss on outside tap / Escape — expected of any menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  async function handleInstall() {
    if (canPromptInstall) { close(); await promptInstall(); return; }
    onToast?.(isIOS
      ? 'Tap Share in Safari, then "Add to Home Screen"'
      : 'Open your browser menu and choose "Install app"');
    close();
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button onClick={() => (open ? close() : setOpen(true))} aria-label="Account"
        className="forge-press" style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0, padding: 0,
          border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
          color: ON_ACCENT, fontWeight: 700, fontSize: size * 0.4, fontFamily: FONT,
          boxShadow: `0 0 0 2px ${t.bg}, 0 0 0 4px ${t.accent.solid}66`,
        }}>{initial}</button>

      {open && (
        <>
          {/* click-catcher so a tap anywhere closes, without dimming the screen */}
          <div style={{ position: 'fixed', inset: 0, zIndex: Z.float }} />
          <div className="forge-pop" style={{
            position: 'absolute', top: size + 10, right: 0, zIndex: Z.floatHi,
            width: 250, background: t.sheet, border: `1px solid ${t.border2}`,
            borderRadius: 18, boxShadow: t.shadow, overflow: 'hidden',
            transformOrigin: 'top right',
          }}>
            {view === 'menu' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 14,
                  borderBottom: `1px solid ${t.border}` }}>
                  <span style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
                    color: ON_ACCENT, fontWeight: 700, fontSize: 15 }}>{initial}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 650, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 12, color: t.text3, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
                  </div>
                </div>
                <div style={{ padding: 6 }}>
                  {!installed && (
                    <MenuItem theme={t} icon="arrowUp" onClick={handleInstall}>Install app</MenuItem>
                  )}
                  <MenuItem theme={t} icon="shield" onClick={() => setView('password')}>
                    Change password
                  </MenuItem>
                  <MenuItem theme={t} icon="arrowRight" danger onClick={async () => {
                    close(); await onLogout?.();
                  }}>Log out</MenuItem>
                </div>
              </>
            ) : (
              <ChangePassword theme={t} onDone={(msg) => { close(); onToast?.(msg); }}
                onBack={() => setView('menu')} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ theme: t, icon, danger, onClick, children }) {
  const color = danger ? DANGER.text : t.text;
  return (
    <button onClick={onClick} className="forge-press" style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 10px',
      background: 'none', border: 'none', borderRadius: RADIUS.chip, cursor: 'pointer',
      color, fontFamily: FONT, fontSize: 14.5, fontWeight: 550, textAlign: 'left',
    }}>
      <Icon name={icon} size={18} style={{ color: danger ? DANGER.text : t.text2, flexShrink: 0 }} />
      {children}
    </button>
  );
}

function ChangePassword({ theme: t, onDone, onBack }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      const { post } = await import('./api.js');
      await post('/auth/change-password', { currentPassword: cur, newPassword: next });
      onDone('Password changed');
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  const field = {
    width: '100%', background: t.surface2, border: `1px solid ${t.border}`,
    borderRadius: RADIUS.control, padding: '10px 12px', color: t.text,
    fontFamily: FONT, fontSize: 14.5, outline: 'none', marginTop: 6,
  };

  return (
    <form onSubmit={submit} style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button type="button" onClick={onBack} style={{ background: 'none', border: 'none',
          color: t.text2, cursor: 'pointer', padding: 0, display: 'flex' }}>
          <Icon name="chevronLeft" size={18} /></button>
        <span style={{ fontSize: 14.5, fontWeight: 650 }}>Change password</span>
      </div>
      <input type="password" value={cur} onChange={(e) => setCur(e.target.value)}
        placeholder="Current password" autoComplete="current-password" style={field} />
      <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
        placeholder="New password" autoComplete="new-password" style={field} />
      {err && <div style={{ fontSize: 12.5, color: DANGER.text, marginTop: 8 }}>{err}</div>}
      <button type="submit" disabled={busy || !cur || !next} style={{
        width: '100%', marginTop: 12, padding: '10px 14px', borderRadius: RADIUS.control,
        border: 'none', cursor: busy ? 'default' : 'pointer', opacity: busy || !cur || !next ? 0.5 : 1,
        background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`, color: ON_ACCENT,
        fontFamily: FONT, fontSize: 14.5, fontWeight: 650,
      }}>{busy ? 'Saving…' : 'Save'}</button>
    </form>
  );
}
