import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Target } from 'lucide-react';
import LanguageSelector from './components/LanguageSelector';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

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
                {/* Desktop Top Bar */}
                <header className="desktop-topbar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0.85rem 2rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(8px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50
                }}>
                    <LanguageSelector />
                </header>

                <main className="main-content" style={{ flex: 1, padding: '2rem' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
