import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Target, LogOut, User } from 'lucide-react';
import LanguageSelector from './components/LanguageSelector';
import { useAuth } from './context/AuthContext';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    const isGuest = user?.id === 'usr-guest-001' || user?.email === 'public@landtrace.in';
    const displayName = user?.name || user?.full_name || 'User';
    const avatarLetter = displayName.charAt(0).toUpperCase();

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        setLoggingOut(false);
        navigate('/login', { replace: true });
    };

    return (
        <div className="layout">
            <div className="mobile-header">
                <div className="brand" style={{ margin: 0, fontSize: '1.25rem' }}>
                    <Target className="brand-icon" size={22} style={{ marginRight: '0.4rem' }} /> LandTrace360
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <LanguageSelector compact />
                    <button className="menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
                        <Menu size={26} color="var(--text-primary)" />
                    </button>
                </div>
            </div>

            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>

            <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

            <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <header className="desktop-topbar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0.65rem 2rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(8px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    gap: '1rem'
                }}>
                    <LanguageSelector />

                    {/* User pill + logout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {/* Avatar + name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '0.3rem 0.75rem 0.3rem 0.4rem' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: isGuest ? 'linear-gradient(135deg,#475569,#334155)' : 'linear-gradient(135deg,#10b981,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                                {user?.picture ? <img src={user.picture} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter}
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isGuest ? 'Public Guest' : displayName.split(' ')[0]}
                            </span>
                        </div>

                        {/* Logout button — only shown for real (non-guest) users */}
                        {!isGuest && (
                            <button
                                id="btn-topbar-logout"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                title="Sign out"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', cursor: loggingOut ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s ease' }}
                            >
                                <LogOut size={14} />
                                {loggingOut ? '...' : 'Logout'}
                            </button>
                        )}
                        {isGuest && (
                            <button
                                id="btn-topbar-login"
                                onClick={() => navigate('/login')}
                                title="Sign in"
                                style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '0.35rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s ease' }}
                            >
                                <User size={14} />
                                Sign In
                            </button>
                        )}
                    </div>
                </header>

                <main className="main-content" style={{ flex: 1, padding: '2rem' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
