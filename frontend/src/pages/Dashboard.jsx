import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle, ShoppingCart, AlertTriangle, Bell } from 'lucide-react';
import '../index.css';
import API_BASE from '../api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE}/api/dashboard`)
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching dashboard stats:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="page-title">Loading Dashboard...</div>;
    if (!stats) return <div className="page-title">Error loading data.</div>;

    return (
        <div>
            <h1 className="page-title">Dashboard Overview</h1>

            <div className="grid-cards">
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <Target size={32} color="var(--accent-color)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Lands</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_lands}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <CheckCircle size={32} color="var(--success)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Verified Lands</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.verified_lands}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <ShoppingCart size={32} color="#a855f7" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Lands For Sale</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.lands_for_sale}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onClick={() => navigate('/high-risk')} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.15)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <AlertTriangle size={32} color="var(--danger)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>High Risk Lands</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.high_risk_lands}</p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
                <h2><Bell style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Recent Announcements ({stats.recent_announcements})</h2>
                <div className="glass-panel">
                    {stats.recent_announcements > 0 ? (
                        <p>New lands have been listed for sale. Check the Available Lands tab.</p>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)' }}>No new announcements at this time.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Dashboard;
