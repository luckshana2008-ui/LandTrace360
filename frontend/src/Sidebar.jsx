import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingCart, Target, Bookmark, MessageSquare, Bell, FileText } from 'lucide-react';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="brand">
                <Target className="brand-icon" size={28} />
                LandTrace360
            </div>
            <nav className="nav-links">
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <Home size={20} /> Dashboard
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <Search size={20} /> Search
                </NavLink>
                <NavLink to="/available" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <ShoppingCart size={20} /> Available Lands
                </NavLink>
                <NavLink to="/sell" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <MessageSquare size={20} /> Announce Land
                </NavLink>
                <NavLink to="/saved" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <Bookmark size={20} /> Saved Lands
                </NavLink>
                <NavLink to="/alerts" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <Bell size={20} /> Alerts
                </NavLink>
                <NavLink to="/report" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    <FileText size={20} /> Verification Report
                </NavLink>
            </nav>
        </div>
    );
};

export default Sidebar;
