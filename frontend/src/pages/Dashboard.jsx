import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle, ShoppingCart, AlertTriangle, Bell, FileText, Activity, TrendingUp, Shield, Sparkles, ArrowRight, Bot, ShieldAlert, Layers, Compass } from 'lucide-react';
import '../index.css';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const Dashboard = () => {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [globalAlerts, setGlobalAlerts] = useState([]);
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

        // Mocking global alerts and trend
        setGlobalAlerts([
            { id: 1, type: "Boundary Change", land_id: "LND-1002", date: "2026-09-04", severity: "High", explanation: "Significant boundary mismatch detected via drone survey." },
            { id: 2, type: "New Legal Case", land_id: "LND-1004", date: "2026-09-02", severity: "High", explanation: "Title dispute filed in High Court." },
            { id: 3, type: "Risk Score Increased", land_id: "LND-1007", date: "2026-08-28", severity: "Medium", explanation: "Risk score increased due to pending document verification." },
            { id: 4, type: "Document Verification", land_id: "LND-1008", date: "2026-08-25", severity: "Medium", explanation: "Lease agreement requires administrative review." }
        ]);
    }, []);

    if (loading) return <div className="page-title">{t('common.loading', 'Loading Dashboard...')}</div>;
    if (!stats) return <div className="page-title">{t('common.error', 'Error loading data.')}</div>;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0 }}>{t('dashboard.title', 'Dashboard Overview')}</h1>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {t('dashboard.welcome', 'Transparent Land Registry & Risk Assessment Intelligence')}
                    </p>
                </div>
            </div>

            {/* Land Intelligence Section — 6 Unified Intelligence Engines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Compass size={20} color="#38bdf8" />
                        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700 }}>
                            {t('nav.landIntelligence', 'Land Intelligence')}
                        </h2>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        6 Specialized Engines Powered by Verified Project Records
                    </span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.25rem'
                }}>
                    {/* 1. Land Passport */}
                    <div
                        onClick={() => navigate('/passport')}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(56, 189, 248, 0.1))',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(56, 189, 248, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                                <Shield size={26} color="#38bdf8" />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase' }}>
                                    CREDENTIAL
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                    {t('passport.title', 'Land Passport')}
                                </h3>
                            </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                            {t('passport.subtitle', 'Unified digital property credential derived dynamically from project records with View, Download, and Print.')}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.875rem', fontWeight: 600 }}>
                            {t('passport.viewAction', 'View Land Passport')} <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* 2. AI Land Story */}
                    <div
                        onClick={() => navigate('/story')}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(192, 132, 252, 0.3)',
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(168, 85, 247, 0.1))',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(168, 85, 247, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                                <Sparkles size={26} color="#c084fc" />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#c084fc', textTransform: 'uppercase' }}>
                                    NARRATIVE
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                    {t('story.title', 'AI Land Story')}
                                </h3>
                            </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                            {t('story.subtitle', 'Chronological narrative generated from stored ownership, legal, mortgage, and survey records with evidence tracking.')}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.875rem', fontWeight: 600 }}>
                            {t('story.generateButton', 'Generate Story')} <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* 3. Anomaly Detective */}
                    <div
                        onClick={() => navigate('/anomalies')}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(239, 68, 68, 0.1))',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                                <ShieldAlert size={26} color="#ef4444" />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#ef4444', textTransform: 'uppercase' }}>
                                    DETECTION
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                    {t('anomalies.title', 'Anomaly Detective')}
                                </h3>
                            </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                            Identify area discrepancies, rapid ownership flips, mortgage overlaps, and active litigation flags across land archives.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600 }}>
                            {t('common.view', 'Detect Anomalies')} <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* 4. Evidence Explorer */}
                    <div
                        onClick={() => navigate('/evidence')}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(52, 211, 153, 0.1))',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(52, 211, 153, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'rgba(52, 211, 153, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                                <Layers size={26} color="#34d399" />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#34d399', textTransform: 'uppercase' }}>
                                    AUDIT TRAIL
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                    {t('evidenceExplorer.title', 'Evidence Explorer')}
                                </h3>
                            </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                            Hierarchical audit trail connecting high-level conclusions and risk ratings to verified underlying database records.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.875rem', fontWeight: 600 }}>
                            {t('common.view', 'Explore Evidence')} <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* 5. Risk Breakdown */}
                    <div
                        onClick={() => navigate('/risk-breakdown')}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(245, 158, 11, 0.1))',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(251, 191, 36, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                                <Activity size={26} color="#fbbf24" />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fbbf24', textTransform: 'uppercase' }}>
                                    ANALYTICS
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                    {t('nav.riskBreakdown', 'Risk Breakdown')}
                                </h3>
                            </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                            Multi-factor scoring across legal disputes, unreleased mortgages, document flags, and boundary discrepancies.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.875rem', fontWeight: 600 }}>
                            {t('common.view', 'View Breakdown')} <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* 6. LandTrace AI */}
                    <div
                        onClick={() => navigate('/chat')}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(37, 99, 235, 0.15))',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(56, 189, 248, 0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.75rem', borderRadius: '12px' }}>
                                <Bot size={26} color="#38bdf8" />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#38bdf8', textTransform: 'uppercase' }}>
                                    INTELLIGENT AI
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                                    {t('chatbot.title', 'LandTrace AI')}
                                </h3>
                            </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                            {t('chatbot.subtitle', 'Evidence-Based Intelligent Land Assistant')} — Interactive Q&A for parcel records, dockets, and risk evaluation.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.875rem', fontWeight: 600 }}>
                            {t('chatbot.askAI', 'Ask LandTrace AI')} <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <Target size={32} color="var(--accent-color)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Lands</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_lands}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <CheckCircle size={32} color="var(--success)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Verified Lands</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.verified_lands}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <ShoppingCart size={32} color="#a855f7" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Lands For Sale</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.lands_for_sale}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onClick={() => navigate('/high-risk')} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.15)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <AlertTriangle size={32} color="var(--danger)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>High Risk Lands</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.high_risk_lands}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <Bell size={32} color="var(--warning)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>New Alerts</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.new_alerts}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <FileText size={32} color="var(--accent-color)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Docs to Review</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.documents_requiring_review}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <Activity size={32} color="var(--success)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Avg Land Health</h3>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.average_land_health}%</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '50%' }}>
                        <TrendingUp size={32} color="var(--danger)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Risk Trends</h3>
                        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.predicted_risk_changes}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
                <div className="glass-panel">
                    <h2><Bell style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Smart Land Alerts</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {globalAlerts.map(alert => (
                            <div key={alert.id} style={{ background: 'rgba(0,0,0,0.2)', borderLeft: `4px solid ${alert.severity === 'High' ? 'var(--danger)' : 'var(--warning)'}`, padding: '1rem', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <strong style={{ fontSize: '1.1rem' }}>⚠️ {alert.type}</strong>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{alert.date}</span>
                                </div>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{alert.explanation}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Land ID: {alert.land_id}</span>
                                    <button onClick={() => navigate(`/land/${alert.land_id}`)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>View Land</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel">
                    <h2><TrendingUp style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Risk Trend Highlights</h2>
                    <div style={{ marginTop: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Based on synthetic predictions across the 8 demo lands.</p>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>LND-1002 (Expected Boundary Dispute)</span>
                                <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Risk Increasing</span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px' }}>
                                <div style={{ width: '70%', background: 'var(--danger)', height: '100%', borderRadius: '4px' }}></div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>LND-1004 (Contested Legal Cases)</span>
                                <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Risk Increasing</span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px' }}>
                                <div style={{ width: '85%', background: 'var(--danger)', height: '100%', borderRadius: '4px' }}></div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>LND-1001 (Clear Title)</span>
                                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Risk Stable</span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px' }}>
                                <div style={{ width: '15%', background: 'var(--success)', height: '100%', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Dashboard;
