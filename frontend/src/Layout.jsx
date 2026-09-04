import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Target } from 'lucide-react';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="layout">
            <div className="mobile-header">
                <div className="brand" style={{ margin: 0 }}>
                    <Target className="brand-icon" size={24} style={{ marginRight: '0.5rem' }} /> LandTrace360
                </div>
                <button className="menu-btn" onClick={toggleSidebar}>
                    <Menu size={28} color="var(--text-primary)" />
                </button>
            </div>

            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>

            <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

