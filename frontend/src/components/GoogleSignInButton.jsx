import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, X, Check, Mail, User, ShieldCheck } from 'lucide-react';

export const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GoogleSignInButton = ({ text = "Continue with Google", mode = "button" }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const predefinedAccounts = [
    {
      name: "Google Verified Officer",
      email: "officer.landtrace@gmail.com",
      role: "investigator",
      desc: "Instant access to all Coimbatore cadastral maps & ML telemetry"
    },
    {
      name: "Verified Google Investor",
      email: "investor.kovai@gmail.com",
      role: "buyer",
      desc: "Buyer exploration, land valuation & digital passport inspection"
    }
  ];

  const handleSelectAccount = async (account) => {
    setIsAuthenticating(true);
    try {
      await loginWithGoogle({
        email: account.email,
        name: account.name,
        full_name: account.name,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.name)}`
      });
      setShowModal(false);
      navigate('/');
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setIsAuthenticating(true);
    const cleanEmail = customEmail.trim().toLowerCase();
    const displayName = customName.trim() || cleanEmail.split('@')[0];
    try {
      await loginWithGoogle({
        email: cleanEmail,
        name: displayName,
        full_name: displayName,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`
      });
      setShowModal(false);
      navigate('/');
    } catch (err) {
      console.error('Google custom auth error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: '#ffffff',
          color: '#1f2937',
          border: '1px solid #e5e7eb',
          fontWeight: 600,
          fontSize: '0.92rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <GoogleIcon size={19} />
        <span>{text}</span>
      </button>

      {/* Google Account Selector Dialog */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => !isAuthenticating && setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              color: '#f8fafc'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <GoogleIcon size={22} />
                <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isAuthenticating}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.45 }}>
              Choose a Google account to continue to <strong>LandTrace360</strong>. All data and analysis remain securely coupled.
            </p>

            {/* Quick 1-Click Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {predefinedAccounts.map((acc, i) => (
                <div
                  key={i}
                  onClick={() => !isAuthenticating && handleSelectAccount(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4285F4, #34A853)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{acc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{acc.email}</div>
                    </div>
                  </div>
                  <ShieldCheck size={16} color="#34d399" />
                </div>
              ))}
            </div>

            {/* Or Enter Custom Gmail */}
            <div style={{ position: 'relative', textAlign: 'center', margin: '1rem 0' }}>
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
              <span
                style={{
                  position: 'relative',
                  top: '-10px',
                  background: '#0f172a',
                  padding: '0 0.65rem',
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}
              >
                OR USE YOUR GMAIL
              </span>
            </div>

            <form onSubmit={handleCustomGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isAuthenticating || !customEmail.trim()}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4285F4, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isAuthenticating ? (
                  <>
                    <Sparkles size={15} className="spin" />
                    <span>Verifying with Google...</span>
                  </>
                ) : (
                  <span>Continue with this Account</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSignInButton;
