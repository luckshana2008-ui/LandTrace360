import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Target, Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck,
  AlertCircle, Sparkles, CheckCircle2, Shield, UserCheck, Search, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

const ROLES = [
  {
    id: 'owner',
    title: 'Land Owner',
    icon: ShieldCheck,
    color: '#f59e0b',
    summary: 'Manage property sale listings, title deeds & encumbrances',
    features: ['View owned lands', 'Manage sale listings', 'View history & documents', 'Risk inspection']
  },
  {
    id: 'buyer',
    title: 'Buyer',
    icon: Search,
    color: '#38bdf8',
    summary: 'Search verified marketplace, save lands & query AI',
    features: ['Search available lands', 'Time machine & DNA', 'Save shortlisted lands', 'AI Assistant queries']
  },
  {
    id: 'investigator',
    title: 'Investigator / Admin',
    icon: Shield,
    color: '#c084fc',
    summary: 'Full access to anomaly detection, evidence & audit telemetry',
    features: ['Inspect all 8 demo lands', 'Anomaly detective rules', 'Hierarchical evidence', 'Intelligent alerts']
  }
];

const Register = () => {
  const { t } = useLanguage();
  const { register, isAuthenticated, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('buyer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Please enter your email address.');
      return;
    }

    if (!password) {
      setFormError('Please create a password.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!termsAccepted) {
      setFormError('You must accept the academic project disclaimer to proceed.');
      return;
    }

    setSubmitting(true);
    const result = await register(fullName, cleanEmail, password, role);
    setSubmitting(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setFormError(result.error || 'Registration failed. Please check inputs.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192, 132, 252, 0.12) 0%, transparent 70%)',
          top: '-150px',
          right: '-100px',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
          bottom: '-150px',
          left: '-100px',
          pointerEvents: 'none'
        }}
      />

      {/* Language Switcher */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
        <LanguageSelector compact />
      </div>

      {/* Registration Card */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(192, 132, 252, 0.1)',
          position: 'relative',
          zIndex: 5
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.25), rgba(56, 189, 248, 0.25))',
              border: '1px solid rgba(192, 132, 252, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
              boxShadow: '0 0 20px rgba(192, 132, 252, 0.3)'
            }}
          >
            <Target size={28} color="#c084fc" />
          </div>

          <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Join LandTrace360
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Create an authenticated account to access cadastral audits & land records
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              {t('auth.fullName', 'Full Name')}
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
              <User size={18} color="var(--text-secondary)" style={{ marginRight: '0.65rem', flexShrink: 0 }} />
              <input
                type="text"
                required
                placeholder="Dr. Rajesh Kumar"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
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
                padding: '0.65rem 0.9rem'
              }}
            >
              <Mail size={18} color="var(--text-secondary)" style={{ marginRight: '0.65rem', flexShrink: 0 }} />
              <input
                type="email"
                required
                placeholder="rajesh.kumar@example.com"
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

          {/* Role Selection (3 Options) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
              Select Account Role
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.65rem' }}>
              {ROLES.map((r) => {
                const IconComp = r.icon;
                const isSelected = role === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                      border: isSelected ? `2px solid ${r.color}` : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 15px ${r.color}33` : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <IconComp size={18} color={r.color} />
                        {isSelected && <CheckCircle2 size={16} color={r.color} />}
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {r.title}
                      </div>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                        {r.summary}
                      </p>
                    </div>
                  </div>
                );
              })}
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
                placeholder="At least 6 characters"
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
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              {t('auth.confirmPassword', 'Confirm Password')}
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
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: '0.2rem', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
              <span>
                I agree to the LandTrace360 Project Terms & understand that all analyses are based strictly on synthetic/demo project records.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '0.4rem',
              padding: '0.8rem 1.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #c084fc, #38bdf8)',
              color: '#0f172a',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(192, 132, 252, 0.3)',
              transition: 'all 0.2s ease',
              opacity: submitting ? 0.75 : 1
            }}
          >
            {submitting ? (
              <>
                <Sparkles size={18} className="spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create LandTrace360 Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Link back to Login */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <Link to="/login" style={{ color: '#c084fc', fontWeight: 600, textDecoration: 'none' }}>
            {t('auth.alreadyHaveAccount', 'Already have an account? Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
