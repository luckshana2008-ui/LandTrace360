import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Map as MapIcon, Database, Activity, MessagesSquare, FileText, Scale, Target } from 'lucide-react';
import LandMap from '../components/LandMap';
import AIAssistant from '../components/AIAssistant';
import LandDNA from '../components/LandDNA';
import TimeMachine from '../components/TimeMachine';
import RelationshipGraph from '../components/RelationshipGraph';
import BoundaryDetection from '../components/BoundaryDetection';
import DocumentVerification from '../components/DocumentVerification';
import FragmentationDetector from '../components/FragmentationDetector';
import WhatIfSimulator from '../components/WhatIfSimulator';
import VerificationReport from '../components/VerificationReport';
import API_BASE from '../api';

const LandProfileWrapper = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState({
        land: null, history: null, owners: null, docs: null, cases: null, mortgages: null, dna: null, risk: null, fragments: null, boundary: null, activeAnnouncement: null
    });
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Fetch all land related data in parallel
        const fetchData = async () => {
            setLoading(true);
            try {
                const [land, history, owners, docs, cases, mortgages, dna, risk, savedLands, fragments, boundary, announcements] = await Promise.all([
                    fetch(`${API_BASE}/api/lands/${id}`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/history`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/owners`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/documents`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/cases`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/mortgages`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/dna`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/risk`).then(r => r.json()),
                    fetch(`${API_BASE}/api/saved-lands`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/fragmentation`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/${id}/boundary-changes`).then(r => r.json()),
                    fetch(`${API_BASE}/api/lands/announcements`).then(r => r.json())
                ]);

                const activeAnnouncement = announcements.find(a => a.land_id === id);
                setData({ land, history, owners, docs, cases, mortgages, dna, risk, fragments, boundary, activeAnnouncement });
                setSaved(savedLands.includes(id));
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const toggleSave = () => {
        fetch(`${API_BASE}/api/saved-lands/${id}`, { method: 'POST' }).then(() => setSaved(!saved));
    };

    if (loading) return <div className="page-title">Loading Land Profile...</div>;
    if (!data.land || data.land.detail === "Land not found") return <div className="page-title">Land Not Found</div>;

    const { land, history, owners, docs, cases, mortgages, dna, risk, fragments, boundary, activeAnnouncement } = data;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/available" style={{ color: 'var(--text-secondary)' }}><ArrowLeft size={24} /></Link>
                    <h1 className="page-title" style={{ margin: 0 }}>Land Profile: {land.id}</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <VerificationReport landId={land.id} />
                    <button onClick={toggleSave} className="btn-primary" style={{ background: saved ? 'var(--success)' : 'var(--accent-color)', height: 'fit-content', padding: '0.75rem 1.5rem', alignSelf: 'center', marginTop: '1.5rem' }}>
                        <Save size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        {saved ? 'Saved' : 'Save Land'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
                {[
                    { id: 'overview', icon: MapIcon, label: 'Overview & Map' },
                    { id: 'history', icon: Database, label: 'History & Time Machine' },
                    { id: 'boundary', icon: Target, label: 'Boundary Detection' },
                    { id: 'legal', icon: Scale, label: 'Legal & Documents' },
                    { id: 'dna', icon: Activity, label: 'DNA & Risk Analysis' },
                    { id: 'ai', icon: MessagesSquare, label: 'AI Assistant' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? 'var(--accent-light)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                            border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500'
                        }}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* ── Buyer Quick Summary Banner ── */}
                        {land.is_for_sale && (
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.1))',
                                border: '1px solid rgba(16,185,129,0.3)',
                                borderRadius: '12px', padding: '1.25rem 1.5rem',
                                display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🏷️</span>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asking Price</p>
                                        <p style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: 'var(--success)' }}>₹{land.asking_price?.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                                <div style={{ width: '1px', height: '40px', background: 'var(--border-color)', flexShrink: 0 }} className="mobile-hide" />
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Area</p>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{land.area_sq_ft?.toLocaleString()} sq ft</p>
                                </div>
                                <div style={{ width: '1px', height: '40px', background: 'var(--border-color)', flexShrink: 0 }} className="mobile-hide" />
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</p>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{land.land_type}</p>
                                </div>
                                <div style={{ width: '1px', height: '40px', background: 'var(--border-color)', flexShrink: 0 }} className="mobile-hide" />
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Score</p>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: land.risk_score < 30 ? 'var(--success)' : land.risk_score < 60 ? 'var(--warning)' : 'var(--danger)' }}>
                                        {land.risk_score}/100 {land.risk_score < 30 ? '🟢 Low' : land.risk_score < 60 ? '🟡 Medium' : '🔴 High'}
                                    </p>
                                </div>
                                <div style={{ width: '1px', height: '40px', background: 'var(--border-color)', flexShrink: 0 }} className="mobile-hide" />
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Listing Status</p>
                                    <span className="status-badge status-success" style={{ marginTop: '0.25rem', display: 'inline-block' }}>✅ Available for Sale</span>
                                </div>
                            </div>
                        )}

                        {/* ── Main Overview Grid ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: '1.5rem' }}>
                            <div className="glass-panel" style={{ position: 'relative' }}>
                                {land.is_for_sale && (
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--success)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        FOR SALE
                                    </div>
                                )}
                                <h2 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Land Details</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: '0.75rem 1rem', marginTop: '1rem' }}>
                                    <div><strong>Survey No:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.survey_number}</span></div>
                                    <div><strong>Subdivision:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.subdivision_number}</span></div>
                                    <div><strong>Location:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.location}</span></div>
                                    <div><strong>Village:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.village}</span></div>
                                    <div><strong>Taluk:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.taluk}</span></div>
                                    <div><strong>District:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.district}</span></div>
                                    <div><strong>Area:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.area_sq_ft?.toLocaleString()} sq ft</span></div>
                                    <div><strong>Type:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.land_type}</span></div>
                                    <div><strong>Owner:</strong><br /><span style={{ color: 'var(--text-secondary)' }}>{land.owner}</span></div>
                                    <div><strong>Status:</strong><br /><span className={`status-badge ${land.status === 'Verified' ? 'status-success' : land.status === 'Contested' ? 'status-danger' : 'status-warning'}`}>{land.status}</span></div>
                                </div>

                                {land.is_for_sale && (
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--success)' }}>Sale Information</h3>
                                        <p style={{ margin: '0.25rem 0' }}><strong>Asking Price:</strong> ₹{land.asking_price?.toLocaleString('en-IN') || 'N/A'}</p>
                                        <p style={{ margin: '0.25rem 0' }}><strong>Description:</strong> {activeAnnouncement?.description || 'Prime property with clear title ready for acquisition. Reach out to the owner for more details and negotiations.'}</p>
                                        <p style={{ margin: '0.25rem 0' }}><strong>Seller Contact:</strong> <a href={`mailto:${activeAnnouncement?.contact || 'demo-owner@landtrace360.com'}`} style={{ color: 'var(--accent-color)' }}>{activeAnnouncement?.contact || 'demo-owner@landtrace360.com'}</a></p>
                                        <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Listed on:</strong> {land.posted_date || activeAnnouncement?.posted_date || 'Recently'}</p>

                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button onClick={() => setActiveTab('legal')} style={{ padding: '0.5rem 0.85rem', background: 'var(--accent-light)', color: 'var(--accent-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>📄 View Documents</button>
                                            <button onClick={() => setActiveTab('legal')} style={{ padding: '0.5rem 0.85rem', background: 'var(--accent-light)', color: 'var(--accent-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>⚖️ Legal Cases</button>
                                            <button onClick={() => setActiveTab('legal')} style={{ padding: '0.5rem 0.85rem', background: 'var(--accent-light)', color: 'var(--accent-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>🏦 Mortgage</button>
                                            <button onClick={() => setActiveTab('dna')} style={{ padding: '0.5rem 0.85rem', background: 'var(--accent-light)', color: 'var(--accent-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>🧬 Risk Analysis</button>
                                        </div>
                                    </div>
                                )}

                                {land.is_for_sale && activeAnnouncement && (activeAnnouncement.house_on_land || activeAnnouncement.well_borewell || activeAnnouncement.electricity_available || activeAnnouncement.road_access || activeAnnouncement.compound_wall || activeAnnouncement.existing_building || activeAnnouncement.current_land_use || activeAnnouncement.nearby_facilities || activeAnnouncement.additional_details) && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem', border: '1px solid var(--border-color)' }}>
                                        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--accent-color)' }}>Property Features & Facilities</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
                                            {activeAnnouncement.house_on_land && <div><strong>House:</strong> <span className={`status-badge ${activeAnnouncement.house_on_land === 'Yes' ? 'status-success' : 'status-danger'}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{activeAnnouncement.house_on_land}</span>{activeAnnouncement.house_details && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{activeAnnouncement.house_details}</div>}</div>}
                                            {activeAnnouncement.well_borewell && <div><strong>Well / Borewell:</strong> <span className={`status-badge ${activeAnnouncement.well_borewell === 'Yes' ? 'status-success' : 'status-danger'}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{activeAnnouncement.well_borewell}</span>{activeAnnouncement.water_facility && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{activeAnnouncement.water_facility}</div>}</div>}
                                            {activeAnnouncement.electricity_available && <div><strong>Electricity:</strong> <span className={`status-badge ${activeAnnouncement.electricity_available === 'Yes' ? 'status-success' : 'status-danger'}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{activeAnnouncement.electricity_available === 'Yes' ? 'Available' : 'Not Available'}</span></div>}
                                            {activeAnnouncement.road_access && <div><strong>Road Access:</strong> <span className={`status-badge ${activeAnnouncement.road_access === 'Yes' ? 'status-success' : 'status-danger'}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{activeAnnouncement.road_access}</span>{activeAnnouncement.road_details && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{activeAnnouncement.road_details}</div>}</div>}
                                            {activeAnnouncement.compound_wall && <div><strong>Fencing:</strong> <span className={`status-badge ${activeAnnouncement.compound_wall === 'Yes' ? 'status-success' : 'status-danger'}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{activeAnnouncement.compound_wall === 'Yes' ? 'Available' : 'Not Available'}</span></div>}
                                            {activeAnnouncement.existing_building && <div><strong>Building:</strong> <span className={`status-badge ${activeAnnouncement.existing_building === 'Yes' ? 'status-success' : 'status-danger'}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{activeAnnouncement.existing_building}</span>{activeAnnouncement.existing_building_details && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{activeAnnouncement.existing_building_details}</div>}</div>}
                                            {activeAnnouncement.current_land_use && <div><strong>Current Use:</strong> <span className="status-badge status-info" style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>{activeAnnouncement.current_land_use}</span></div>}
                                        </div>
                                        {activeAnnouncement.nearby_facilities && (
                                            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                <strong>Nearby Facilities:</strong>
                                                <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{activeAnnouncement.nearby_facilities}</p>
                                            </div>
                                        )}
                                        {activeAnnouncement.additional_details && (
                                            <div style={{ marginTop: '1rem' }}>
                                                <strong>Additional Details:</strong>
                                                <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{activeAnnouncement.additional_details}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="glass-panel">
                                <h2 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>📍 Live Map</h2>
                                <div style={{ height: '300px', background: '#333', borderRadius: '8px', marginTop: '1rem' }}>
                                    <LandMap coordinates={land.coordinates} popupText={`${land.id} — ${land.location}, ${land.district}`} />
                                </div>
                                {land.coordinates && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                                        📌 Approx. coordinates: {land.coordinates[0].toFixed(4)}°N, {land.coordinates[1].toFixed(4)}°E
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <TimeMachine history={history} owners={owners} boundary={boundary} fragments={fragments} landId={land.id} />
                )}

                {activeTab === 'boundary' && (
                    <BoundaryDetection landId={land.id} />
                )}

                {activeTab === 'legal' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <DocumentVerification landId={land.id} />
                        <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="glass-panel">
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={20} /> Documents ({docs ? docs.filter(d => d.verification !== 'Rejected').length : 0})</h2>
                                {(!docs || docs.filter(d => d.verification !== 'Rejected').length === 0) ? <p>No documents found.</p> : docs.filter(d => d.verification !== 'Rejected').map((doc, idx) => (
                                    <div key={doc.id || doc.doc_no || idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <p><strong>{doc.doc_no || (doc.document_name && 'User Uploaded')}</strong> - {doc.type}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date: {doc.date}</p>
                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span className={`status-badge ${doc.verification === 'Verified' ? 'status-success' : (doc.verification === 'Pending' || doc.verification === 'Under Review' ? 'status-warning' : 'status-info')}`}>{doc.verification}</span>
                                            {doc.result && <span className="status-badge status-info">{doc.result} match</span>}
                                            {doc.file_path && (
                                                <a href={`${API_BASE}${doc.file_path}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '0.75rem', marginLeft: 'auto' }}>
                                                    View Document
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="glass-panel">
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Scale size={20} /> Legal Cases ({cases?.length || 0})</h2>
                                {(!cases || cases.length === 0) ? <p>No active legal cases found.</p> : cases.map(c => (
                                    <div key={c.case_no} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid var(--danger)' }}>
                                        <p><strong>{c.case_no}</strong> - {c.type}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Court: {c.court} | Filed: {c.filing_date}</p>
                                        <span className="status-badge status-warning" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{c.status}</span>
                                    </div>
                                ))}

                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem' }}><Database size={20} /> Mortgages ({mortgages?.length || 0})</h2>
                                {(!mortgages || mortgages.length === 0) ? <p>No active mortgages found.</p> : mortgages.map((m, i) => (
                                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <p><strong>Bank:</strong> {m.bank}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.start_date} to {m.release_date}</p>
                                        <span className={`status-badge ${m.status === 'Active' ? 'status-danger' : 'status-success'}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>{m.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <RelationshipGraph land={land} owners={owners} docs={docs} cases={cases} mortgages={mortgages} />
                    </div>
                )}

                {activeTab === 'dna' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <LandDNA dna={dna} risk={risk} />
                        <FragmentationDetector landId={land.id} />
                        <WhatIfSimulator landId={land.id} />
                    </div>
                )}

                {activeTab === 'ai' && (
                    <AIAssistant land_id={id} />
                )}
            </div>
        </div>
    );
};

export default LandProfileWrapper;
