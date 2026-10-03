import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Search, ShoppingCart, Target, Bookmark, MessageSquare,
  Bell, FileText, ShieldCheck, X, Shield, Sparkles, Compass,
  ShieldAlert, Layers, LogOut, Bot, Activity, MapPin, Cpu
} from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';
import { useAuth } from './context/AuthContext';
import LanguageSelector from './components/LanguageSelector';
import { useState } from 'react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    closeSidebar();
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
      <button className="close-btn" onClick={closeSidebar} aria-label="Close Sidebar">
        <X size={24} />
      </button>

      <div className="brand">
        <Target className="brand-icon" size={28} />
        LandTrace360
      </div>

      <div style={{ marginBottom: '1.25rem', padding: '0 0.5rem' }}>
        <LanguageSelector compact />
      </div>

      <nav className="nav-links" style={{ flex: 1, overflowY: 'auto' }}>
        <NavLink to="/" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Home size={19} /> {t('nav.dashboard', 'Dashboard')}
        </NavLink>
        <NavLink to="/search" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Search size={19} /> {t('nav.search', 'Search')}
        </NavLink>
        <NavLink to="/available" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <ShoppingCart size={19} /> {t('nav.availableLands', 'Available Lands')}
        </NavLink>

        {/* ── Land Intelligence Section ── */}
        <div style={{
          marginTop: '0.85rem',
          marginBottom: '0.85rem',
          paddingTop: '0.75rem',
          paddingBottom: '0.5rem',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem'
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#38bdf8',
            padding: '0.2rem 1rem 0.35rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Compass size={13} /> {t('nav.landIntelligence', 'Land Intelligence')}
          </div>

          <NavLink to="/passport" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Shield size={18} color="#38bdf8" /> {t('nav.landPassport', 'Land Passport')}
          </NavLink>
          <NavLink to="/story" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Sparkles size={18} color="#c084fc" /> {t('nav.aiLandStory', 'AI Land Story')}
          </NavLink>
          <NavLink to="/anomalies" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <ShieldAlert size={18} color="#ef4444" /> {t('nav.anomalyDetective', 'Anomaly Detective')}
          </NavLink>
          <NavLink to="/evidence" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Layers size={18} color="#34d399" /> {t('nav.evidenceExplorer', 'Evidence Explorer')}
          </NavLink>
          <NavLink to="/risk-breakdown" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Activity size={18} color="#fbbf24" /> {t('nav.riskBreakdown', 'Risk Breakdown')}
          </NavLink>
          <NavLink to="/coimbatore-map" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <MapPin size={18} color="#06b6d4" /> Coimbatore MapLibre
          </NavLink>
          <NavLink to="/predictive-analysis" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Cpu size={18} color="#10b981" /> Predictive ML & LSTM
          </NavLink>
          <NavLink to="/chat" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Bot size={18} color="#38bdf8" /> {t('nav.landTraceAI', 'LandTrace AI')}
          </NavLink>
        </div>

        {/* ── Saved Lands, Alerts & Announce Land for Sale ── */}
        <NavLink to="/saved" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Bookmark size={19} /> {t('nav.savedLands', 'Saved Lands')}
        </NavLink>
        <NavLink to="/alerts" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Bell size={19} /> {t('nav.alerts', 'Alerts')}
        </NavLink>
        <NavLink to="/sell" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <MessageSquare size={19} /> {t('nav.announceLandForSale', 'Announce Land for Sale')}
        </NavLink>

        {/* ── Additional Reports & Tools ── */}
        <div style={{
          marginTop: '0.85rem',
          paddingTop: '0.65rem',
          borderTop: '1px dashed var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <NavLink to="/report" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <FileText size={18} /> {t('nav.verificationReport', 'Verification Report')}
          </NavLink>
          <NavLink to="/loan-closure" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <ShieldCheck size={18} /> {t('nav.loanClosure', 'Loan Closure')}
          </NavLink>
        </div>
      </nav>

      {/* ── Authenticated User Profile & Logout Area ── */}
      {user && (
        <div style={{
          marginTop: 'auto',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: user.role === 'owner' ? 'rgba(245, 158, 11, 0.2)' : user.role === 'investigator' ? 'rgba(192, 132, 252, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              border: user.role === 'owner' ? '1px solid #f59e0b' : user.role === 'investigator' ? '1px solid #c084fc' : '1px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: user.role === 'owner' ? '#f59e0b' : user.role === 'investigator' ? '#c084fc' : '#38bdf8',
              flexShrink: 0
            }}>
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.full_name || 'LandTrace User'}
              </div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: user.role === 'owner' ? '#f59e0b' : user.role === 'investigator' ? '#c084fc' : '#38bdf8'
              }}>
                {user.role === 'owner' ? 'Land Owner' : user.role === 'investigator' ? 'Investigator' : 'Buyer'}
              </div>
            </div>
          </div>

          <button
            id="btn-sidebar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              width: '100%',
              opacity: loggingOut ? 0.65 : 1
            }}
          >
            <LogOut size={14} />
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
