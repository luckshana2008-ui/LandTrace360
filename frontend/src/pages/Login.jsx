import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Target, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck,
  AlertCircle, Sparkles, UserCheck, HelpCircle, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import GoogleSignInButton from '../components/GoogleSignInButton';

const DEMO_PASSWORD = "DemoPassword123!";

const DEMO_CREDENTIALS = [
  {
    roleKey: 'investigator',
    title: 'Revenue Officer / Admin',
    email: 'admin@landtrace.in',
    password: 'Admin@2026',
    color: '#10b981',
    desc: 'Full access: Coimbatore MapLibre, ML Suite, Audit & Anomalies'
  },
  {
    roleKey: 'buyer',
    title: 'Kovai Land Investor (Buyer)',
    email: 'user@landtrace.in',
    password: 'User@2026',
    color: '#38bdf8',
    desc: 'Coimbatore Cadastral search, saved lands & Gemini AI'
  },
  {
    roleKey: 'owner',
    title: 'Land Owner / Seller',
    email: 'owner@landtrace.in',
    password: 'Owner@2026',
    color: '#f59e0b',
    desc: 'Manage listings, land passports & legal title documents'
  },
  {
    roleKey: 'quick',
    title: 'Quick 1-Click Test',
    email: 'demo@landtrace.in',
    password: '123456',
    color: '#c084fc',
    desc: 'Instant test access with simple password'
  }
];

const Login = () => {
  const { t } = useLanguage();
  const { login, isAuthenticated, error: authError, clearError, enterAsPublicGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);

  // If already logged in, redirect to dashboard or attempted URL
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    const result = await login(cleanEmail, password, rememberMe);
    setSubmitting(false);

    if (result.success) {
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } else {
      setFormError(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleQuickFill = (demoEmail, roleKey, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass || DEMO_PASSWORD);
    setActiveDemoRole(roleKey);
    setFormError('');
    clearError();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Decorative Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
          top: '-150px',
          left: '-100px',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192, 132, 252, 0.12) 0%, transparent 70%)',
          bottom: '-150px',
          right: '-100px',
          pointerEvents: 'none'
        }}
      />

      {/* Language Switcher in Top Right */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
        <LanguageSelector compact />
      </div>

      {/* Main Login Card */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.1)',
          position: 'relative',
          zIndex: 5
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(192, 132, 252, 0.25))',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
            }}
          >
            <Target size={30} color="#38bdf8" />
          </div>

          <h1 style={{ margin: '0 0 0.4rem 0', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            LandTrace360
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Secure AI Land Intelligence & Cadastral Audit Platform
          </p>
        </div>

        {/* Error Alert Box */}
        {(formError || authError) && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: '#f87171',
              fontSize: '0.85rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{formError || authError}</span>
          </div>
        )}

        {/* Google Authentication Sign In */}
        <div style={{ marginBottom: '1.25rem' }}>
          <GoogleSignInButton text="Continue with Google" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0 0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <span>OR SIGN IN WITH EMAIL</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              {t('auth.email', 'Email Address')}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.65rem 0.9rem',
                transition: 'border-color 0.2s ease'
              }}
            >
              <Mail size={18} color="var(--text-secondary)" style={{ marginRight: '0.65rem', flexShrink: 0 }} />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError('');
                  clearError();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              {t('auth.password', 'Password')}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.65rem 0.9rem'
              }}
            >
              <Lock size={18} color="var(--text-secondary)" style={{ marginRight: '0.65rem', flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError('');
                  clearError();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  width: '100%'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
              {t('auth.rememberMe', 'Remember me')}
            </label>

            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                fontSize: '0.82rem',
                padding: 0
              }}
            >
              {t('auth.forgotPassword', 'Forgot Password?')}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '0.5rem',
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.2s ease',
              opacity: submitting ? 0.75 : 1
            }}
          >
            {submitting ? (
              <>
                <Sparkles size={18} className="spin" />
                {t('common.loading', 'Authenticating...')}
              </>
            ) : (
              <>
                {t('auth.signIn', 'Sign In to LandTrace360')}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Public Open Access 1-Click Gateway */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <span>OR OPEN ACCESS</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>
          <button
            type="button"
            onClick={() => {
              if (enterAsPublicGuest) enterAsPublicGuest();
              navigate('/');
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.15))',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={16} />
            ⚡ Enter Directly as Public Guest (Open Access)
          </button>
        </div>

        {/* Create Account Link */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
            Create an Account
          </Link>
        </div>

        {/* ── Demo Accounts Quick Fill Box ── */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#f59e0b',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <UserCheck size={13} />
              {t('auth.demoAccounts', 'DEMO TEST ACCOUNTS')}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              1-Click Test Login
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMO_CREDENTIALS.map((demo) => {
              const isSelected = activeDemoRole === demo.roleKey && email === demo.email;
              return (
                <button
                  key={demo.roleKey}
                  type="button"
                  onClick={() => handleQuickFill(demo.email, demo.roleKey, demo.password)}
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected ? `1px solid ${demo.color}` : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '0.55rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: demo.color
                        }}
                      />
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {demo.title}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '1rem' }}>
                      {demo.email}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: demo.color,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    Auto-Fill
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '1.75rem',
              borderRadius: '16px',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Password Reset Information
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              This is an academic project prototype running on demo and project records.
              For testing purposes, you can immediately log in using any of the pre-configured Demo Roles or register a new custom account.
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              <strong>Demo Password for local testing:</strong>
              <div style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {DEMO_PASSWORD}
              </div>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
