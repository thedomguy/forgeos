// login.jsx — simple mock auth gate. Any email + password proceeds; a real backend
// replaces onLogin next round. Persisted via the store's `auth` slice.
import { useState } from 'react';
import { Icon } from './icons.jsx';
import { Button } from './ui.jsx';
import { FONT, MONO, ON_ACCENT, STATUS_H, SCREEN_PAD_X } from './theme.jsx';

function Field({ theme, icon, ...rest }) {
  const t = theme;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: `13px ${SCREEN_PAD_X}px`,
      background: t.surface, borderRadius: 15, border: `1px solid ${t.border2}` }}>
      <Icon name={icon} size={19} style={{ color: t.text3 }} />
      <input {...rest} style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
        color: t.text, fontSize: 15.5, fontFamily: FONT }} />
    </div>
  );
}

export function LoginScreen({ theme, onLogin }) {
  const t = theme;
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('alex@forge.os');
  const [password, setPassword] = useState('');
  const isSignup = mode === 'signup';

  const submit = () => { if (email.trim()) onLogin(email.trim()); };

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: t.bg }}>
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: `${STATUS_H + 40}px 24px 40px`, maxWidth: 440, margin: '0 auto' }}>
        {/* brand */}
        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <div style={{ width: 66, height: 66, borderRadius: 20, margin: '0 auto 18px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: ON_ACCENT,
            background: `linear-gradient(135deg, ${t.accent.g1}, ${t.accent.g2})`,
            boxShadow: `0 14px 34px ${t.accent.glow}` }}>
            <Icon name="spark" size={32} /></div>
          <div style={{ fontSize: 30, fontWeight: 720, letterSpacing: -0.8 }}>Forge OS</div>
          <div style={{ fontSize: 14, color: t.text2, marginTop: 6 }}>
            {isSignup ? 'Create your personal operating system' : 'Your wellbeing, unified'}</div>
        </div>

        {/* form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {isSignup && <Field theme={t} icon="user" placeholder="Full name" autoComplete="name" />}
          <Field theme={t} icon="user" placeholder="Email" type="email" autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)} />
          <Field theme={t} icon="shield" placeholder="Password" type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />

          {!isSignup && (
            <button onClick={() => onLogin(email.trim() || 'alex@forge.os')} style={{ alignSelf: 'flex-end',
              background: 'none', border: 'none', color: t.accent.solid, fontSize: 13, fontWeight: 600,
              fontFamily: FONT, cursor: 'pointer', padding: '2px 2px' }}>Forgot password?</button>
          )}

          <Button theme={t} onClick={submit} style={{ marginTop: 6 }}>
            {isSignup ? 'Create account' : 'Sign in'}</Button>
        </div>

        {/* divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: t.text3, textTransform: 'uppercase',
            letterSpacing: 0.5 }}>or</span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>

        {/* mock social */}
        <button onClick={() => onLogin('alex@forge.os')} style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10, width: '100%', padding: '13px', borderRadius: 15, cursor: 'pointer',
          background: t.surface, border: `1px solid ${t.border2}`, color: t.text, fontFamily: FONT,
          fontSize: 15, fontWeight: 600 }}>
          <Icon name="bolt" size={18} style={{ color: t.accent.solid }} />Continue with SSO</button>

        {/* toggle */}
        <div style={{ textAlign: 'center', marginTop: 26, fontSize: 13.5, color: t.text2 }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setMode(isSignup ? 'signin' : 'signup')} style={{ background: 'none',
            border: 'none', color: t.accent.solid, fontSize: 13.5, fontWeight: 650, fontFamily: FONT,
            cursor: 'pointer' }}>{isSignup ? 'Sign in' : 'Create one'}</button>
        </div>
      </div>
    </div>
  );
}
