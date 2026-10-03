import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Target, Mail, Lock, Eye, EyeOff, ArrowRight,
  AlertCircle, Sparkles, UserCheck, LogOut, LayoutDashboard,
  ShieldCheck, Globe, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import GoogleSignInButton from '../components/GoogleSignInButton';

/* ── Demo accounts for quick fill ── */
const DEMO_ACCOUNTS = [
  { role: 'investigator', label: 'Revenue Officer / Admin', email: 'admin@landtrace.in',  password: 'Admin@2026', color: '#10b981' },
  { role: 'buyer',        label: 'Land Investor (Buyer)',   email: 'user@landtrace.in',   password: 'User@2026',  color: '#38bdf8' },
  { role: 'owner',        label: 'Land Owner / Seller',     email: 'owner@landtrace.in',  password: 'Owner@2026', color: '#f59e0b' },
  { role: 'quick',        label: 'Quick 1-Click Test',      email: 'demo@landtrace.in',   password: '123456',     color: '#c084fc' },
];

/* ── Shared style helpers ── */
const card = {
  width: '100%', maxWidth: '460px', padding: '2.25rem 2rem',
  borderRadius: '20px',
  background: 'rgba(15, 23, 42, 0.88)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 35px rgba(56,189,248,0.08)',
  position: 'relative', zIndex: 5
};

const Login = () => {
  const { t }   = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login, logout, user, isAuthenticated, isGuest,
    error: authError, clearError, enterAsPublicGuest
  } = useAuth();

  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [showPwd,        setShowPwd]        = useState(false);
  const [rememberMe,     setRememberMe]     = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [loggingOut,     setLoggingOut]     = useState(false);
  const [formError,      setFormError]      = useState('');
  const [activeDemo,     setActiveDemo]     = useState(null);

  const destination = location.state?.from?.pathname || '/';

  /* ────────────────────────────────────────────────
   *  Already-signed-in screen (real user only)
   * ──────────────────────────────────────────────── */
  const isRealUser = isAuthenticated && !isGuest;
  if (isRealUser) {
    const displayName  = user?.name || user?.full_name || user?.email || 'User';
    const firstName    = displayName.split(' ')[0];
    const avatarLetter = firstName.charAt(0).toUpperCase();
    const roleLabel    =
      user?.role === 'investigator' ? '🛡️ Revenue Officer / Admin'
      : user?.role === 'owner'      ? '🏠 Land Owner / Seller'
      : user?.auth_provider === 'google' ? '🔵 Google Account'
      : '💼 Land Investor';

    const handleLogout = async () => {
      setLoggingOut(true);
      await logout();
      setLoggingOut(false);
    };

    return (
      <PageWrapper>
        <div style={{ ...card, border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 40px rgba(16,185,129,0.1)', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: '20px', padding: '0.3rem 0.9rem', fontSize: '0.73rem', fontWeight: 700, color: '#34d399', marginBottom: '1.5rem', letterSpacing: '0.06em' }}>
            <ShieldCheck size={12} /> ALREADY SIGNED IN
          </div>

          {/* Avatar */}
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#38bdf8)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', fontWeight: 800, color: '#fff', marginBottom: '1.1rem', boxShadow: '0 0 30px rgba(16,185,129,0.4)', overflow: 'hidden' }}>
            {user?.picture
              ? <img src={user.picture} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : avatarLetter}
          </div>

          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
            Welcome back, {firstName}!
          </h2>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>{user?.email}</p>
          <p style={{ margin: '0 0 2rem', fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>{roleLabel}</p>

          {/* Go to Dashboard */}
          <button
            id="btn-already-signed-in-dashboard"
            onClick={() => navigate(destination, { replace: true })}
            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', background: 'linear-gradient(135deg,#10b981,#38bdf8)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 6px 20px rgba(16,185,129,0.35)', marginBottom: '0.75rem' }}
          >
            <LayoutDashboard size={18} /> Go to Dashboard
          </button>

          {/* Sign Out */}
          <button
            id="btn-already-signed-in-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontWeight: 700, fontSize: '0.88rem', cursor: loggingOut ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loggingOut ? 0.7 : 1 }}
          >
            <LogOut size={16} /> {loggingOut ? 'Signing out...' : 'Sign Out / Switch Account'}
          </button>

          <p style={{ marginTop: '1.4rem', fontSize: '0.76rem', color: 'rgba(255,255,255,0.35)' }}>
            Not you?{' '}
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, padding: 0 }}>
              Log out and use a different account
            </button>
          </p>
        </div>
      </PageWrapper>
    );
  }

  /* ────────────────────────────────────────────────
   *  Login form
   * ──────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();
    const cleanEmail = email.trim();
    if (!cleanEmail) { setFormError('Please enter your email address.'); return; }
    if (!password)   { setFormError('Please enter your password.'); return; }

    setSubmitting(true);
    const result = await login(cleanEmail, password, rememberMe);
    setSubmitting(false);

    if (result.success) {
      navigate(destination, { replace: true });
    } else {
      setFormError(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setActiveDemo(acc.role);
    setFormError('');
    clearError();
  };

  const handleGuestAccess = () => {
    enterAsPublicGuest();
    navigate(destination, { replace: true });
  };

  const displayError = formError || authError;

  return (
    <PageWrapper>
      <div style={card}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(56,189,248,0.25),rgba(192,132,252,0.25))', border: '1px solid rgba(56,189,248,0.5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem', boxShadow: '0 0 20px rgba(56,189,248,0.25)' }}>
            <Target size={28} color="#38bdf8" />
          </div>
          <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>LandTrace360</h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>Secure AI Land Intelligence & Cadastral Audit Platform</p>
        </div>

        {/* Error */}
        {displayError && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', padding: '0.7rem 1rem', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#f87171', fontSize: '0.83rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Google Sign In */}
        <div style={{ marginBottom: '1.1rem' }}>
          <GoogleSignInButton text="Continue with Google" />
          <Divider label="OR SIGN IN WITH EMAIL" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: '0.35rem' }}>Email Address</label>
            <FieldWrap>
              <Mail size={17} color="rgba(255,255,255,0.35)" style={{ marginRight: '0.6rem', flexShrink: 0 }} />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@domain.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setFormError(''); clearError(); }}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.88rem', width: '100%' }}
              />
            </FieldWrap>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: '0.35rem' }}>Password</label>
            <FieldWrap>
              <Lock size={17} color="rgba(255,255,255,0.35)" style={{ marginRight: '0.6rem', flexShrink: 0 }} />
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setFormError(''); clearError(); }}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.88rem', width: '100%' }}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </FieldWrap>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#38bdf8', cursor: 'pointer' }} />
              Remember me
            </label>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>Demo password: <code style={{ color: '#38bdf8' }}>Admin@2026</code></span>
          </div>

          {/* Submit */}
          <button
            id="btn-login-submit"
            type="submit"
            disabled={submitting}
            style={{ marginTop: '0.25rem', padding: '0.82rem', borderRadius: '10px', background: submitting ? 'rgba(56,189,248,0.5)' : 'linear-gradient(135deg,#38bdf8,#2563eb)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.93rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(56,189,248,0.3)' }}
          >
            {submitting
              ? <><Sparkles size={17} className="spin" /> Authenticating...</>
              : <>Sign In to LandTrace360 <ArrowRight size={17} /></>}
          </button>
        </form>

        {/* Public Guest */}
        <Divider label="OR OPEN ACCESS" style={{ margin: '1.1rem 0 0.8rem' }} />
        <button
          id="btn-enter-as-guest"
          type="button"
          onClick={handleGuestAccess}
          style={{ width: '100%', padding: '0.78rem', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(56,189,248,0.12))', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Globe size={16} /> ⚡ Enter Directly as Public Guest (Open Access)
        </button>

        {/* Register link */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>Create Account</Link>
        </p>

        {/* Demo accounts */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <UserCheck size={12} /> Demo Test Accounts
            </span>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>1-Click Auto-Fill</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {DEMO_ACCOUNTS.map(acc => {
              const sel = activeDemo === acc.role && email === acc.email;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  style={{ background: sel ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', border: sel ? `1px solid ${acc.color}` : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: acc.color, display: 'inline-block' }} />
                      <strong style={{ fontSize: '0.78rem', color: '#fff' }}>{acc.label}</strong>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginLeft: '1rem' }}>{acc.email}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: acc.color, background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Fill</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

/* ── Shared sub-components ── */
const PageWrapper = ({ children }) => (
  <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.1) 0%,transparent 70%)', top: '-150px', left: '-100px', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(192,132,252,0.1) 0%,transparent 70%)', bottom: '-150px', right: '-100px', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
      <LanguageSelector compact />
    </div>
    {children}
  </div>
);

const FieldWrap = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
    {children}
  </div>
);

const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
    <span>{label}</span>
    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
  </div>
);

export default Login;
