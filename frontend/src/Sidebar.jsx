import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, Target, Bookmark, MessageSquare, Bell, FileText, X } from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <button className="close-btn" onClick={closeSidebar}>
                <X size={24} />
            </button>
            <div className="brand">
                <Target className="brand-icon" size={28} />
                LandTrace360
            </div>
            <nav className="nav-links">
                <NavLink to="/" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <Home size={20} /> Dashboard
                </NavLink>
                <NavLink to="/search" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <Search size={20} /> Search
                </NavLink>
                <NavLink to="/available" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <ShoppingCart size={20} /> Available Lands
                </NavLink>
                <NavLink to="/sell" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <MessageSquare size={20} /> Announce Land
                </NavLink>
                <NavLink to="/saved" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <Bookmark size={20} /> Saved Lands
                </NavLink>
                <NavLink to="/alerts" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <Bell size={20} /> Alerts
                </NavLink>
                <NavLink to="/report" onClick={closeSidebar} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <FileText size={20} /> Verification Report
                </NavLink>
            </nav>
        </div>
    );
};

export default Sidebar;
