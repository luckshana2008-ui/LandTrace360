import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, MapPin, Tag, ArrowRight, SlidersHorizontal,
    CheckCircle, Clock, X, LayoutGrid, Map as MapIcon,
    Maximize2, IndianRupee, ChevronDown, ChevronUp, Building2
} from 'lucide-react';
import API_BASE from '../api';

// Lazy-load map to avoid SSR issues with leaflet
const LandMap = lazy(() => import('../components/LandMap'));

const LAND_TYPES = ['Agricultural', 'Residential', 'Commercial', 'Industrial'];
const VERIFICATION_OPTIONS = ['Verified', 'Pending Verification', 'Contested'];

const DEFAULT_FILTERS = {
    location: '',
    district: '',
    city: '',
    village: '',
    land_type: '',
    min_price: '',
    max_price: '',
    min_area: '',
    max_area: '',
    verification_status: '',
};

function formatPrice(val) {
    if (!val && val !== 0) return '—';
    const n = Number(val);
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
}

function formatArea(sq_ft) {
    if (!sq_ft) return '—';
    const acres = (sq_ft / 43560).toFixed(2);
    return acres >= 1 ? `${acres} Acres (${sq_ft.toLocaleString()} sq ft)` : `${sq_ft.toLocaleString()} sq ft`;
}

function StatusBadge({ status }) {
    const map = {
        'Verified': { cls: 'status-success', icon: <CheckCircle size={13} /> },
        'Pending Verification': { cls: 'status-warning', icon: <Clock size={13} /> },
        'Contested': { cls: 'status-danger', icon: <X size={13} /> },
    };
    const cfg = map[status] || { cls: 'status-info', icon: null };
    return (
        <span className={`status-badge ${cfg.cls}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            {cfg.icon} {status}
        </span>
    );
}

function LandTypeIcon({ type }) {
    const icons = {
        Agricultural: '🌾', Residential: '🏘️', Commercial: '🏢', Industrial: '🏭'
    };
    return <span style={{ fontSize: '1.4rem' }}>{icons[type] || '🗺️'}</span>;
}

const AvailableLands = () => {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [applied, setApplied] = useState(DEFAULT_FILTERS);
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('grid'); // 'grid' | 'map'
    const [showFilters, setShowFilters] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const buildQuery = (f) => {
        const params = new URLSearchParams();
        Object.entries(f).forEach(([k, v]) => { if (v !== '') params.set(k, v); });
        return params.toString();
    };

    const fetchLands = useCallback((f) => {
        setLoading(true);
        const qs = buildQuery(f);
        fetch(`${API_BASE}/api/lands/available${qs ? '?' + qs : ''}`)
            .then(res => res.json())
            .then(data => { setLands(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { setLands([]); setLoading(false); });
    }, []);

    // Initial load — all available lands
    useEffect(() => { fetchLands(DEFAULT_FILTERS); }, [fetchLands]);

    // Delay map activation to allow leaflet CSS to settle
    useEffect(() => {
        if (view === 'map') setTimeout(() => setMapReady(true), 100);
        else setMapReady(false);
    }, [view]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setApplied(filters);
        fetchLands(filters);
    };

    const handleClear = () => {
        setFilters(DEFAULT_FILTERS);
        setApplied(DEFAULT_FILTERS);
        fetchLands(DEFAULT_FILTERS);
    };

    const hasActiveFilters = Object.values(applied).some(v => v !== '');
    const landsWithCoords = lands.filter(l => Array.isArray(l.coordinates) && l.coordinates.length === 2);

    return (
        <div>
            {/* ── Page Header ── */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
                    🏡 Available Lands Marketplace
                </h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    Browse and filter verified land listings available for purchase across India.
                </p>
            </div>

            {/* ── Search Bar + Filter Toggle ── */}
            <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <form onSubmit={handleSearch}>
                    {/* Primary location search row */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
                        <div style={{ flex: '1 1 260px', position: 'relative' }}>
                            <MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                name="location"
                                value={filters.location}
                                onChange={handleChange}
                                placeholder="Search by location, city, district…"
                                style={{
                                    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.25rem',
                                    borderRadius: '8px', border: '1px solid var(--border-color)',
                                    background: 'rgba(0,0,0,0.25)', color: 'white', fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <button type="submit" className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}>
                            <Search size={18} /> Search
                        </button>

                        <button type="button"
                            onClick={() => setShowFilters(v => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1.25rem', borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: showFilters ? 'var(--accent-light)' : 'rgba(0,0,0,0.2)',
                                color: showFilters ? 'var(--accent-color)' : 'var(--text-secondary)',
                                cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem'
                            }}>
                            <SlidersHorizontal size={16} />
                            Filters
                            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {hasActiveFilters && (
                            <button type="button" onClick={handleClear}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.75rem 1rem', borderRadius: '8px',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                                    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.9rem'
                                }}>
                                <X size={15} /> Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Expanded filter panel */}
                    {showFilters && (
                        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '0.85rem' }}>

                                {/* District */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>District</label>
                                    <input type="text" name="district" value={filters.district} onChange={handleChange}
                                        placeholder="e.g. Coimbatore"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                                </div>

                                {/* City / Taluk */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>City / Taluk</label>
                                    <input type="text" name="city" value={filters.city} onChange={handleChange}
                                        placeholder="e.g. Pollachi"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                                </div>

                                {/* Village / Locality */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Village / Locality</label>
                                    <input type="text" name="village" value={filters.village} onChange={handleChange}
                                        placeholder="e.g. Agri Hamlet"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                                </div>

                                {/* Land Type */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Land Type</label>
                                    <select name="land_type" value={filters.land_type} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                        <option value="">All Types</option>
                                        {LAND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* Min Price */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Min Price (₹)</label>
                                    <input type="number" name="min_price" value={filters.min_price} onChange={handleChange}
                                        placeholder="e.g. 500000"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                                </div>

                                {/* Max Price */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Price (₹)</label>
                                    <input type="number" name="max_price" value={filters.max_price} onChange={handleChange}
                                        placeholder="e.g. 10000000"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                                </div>

                                {/* Min Area */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Min Area (sq ft)</label>
                                    <input type="number" name="min_area" value={filters.min_area} onChange={handleChange}
                                        placeholder="e.g. 1000"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                                </div>

                                {/* Max Area */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Area (sq ft)</label>
                                    <input type="number" name="max_area" value={filters.max_area} onChange={handleChange}
                                        placeholder="e.g. 100000"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                                </div>

                                {/* Verification Status */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Verification Status</label>
                                    <select name="verification_status" value={filters.verification_status} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                                        <option value="">All Statuses</option>
                                        {VERIFICATION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button type="button" onClick={handleClear}
                                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    Reset
                                </button>
                                <button type="submit" className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem' }}>
                                    <Search size={16} /> Apply Filters
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* ── Results Header Row ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    {loading ? 'Searching…' : (
                        <>
                            <strong style={{ color: 'var(--text-primary)' }}>{lands.length}</strong>
                            {' '}land{lands.length !== 1 ? 's' : ''} found
                            {hasActiveFilters && (
                                <span style={{ marginLeft: '0.5rem', color: 'var(--accent-color)' }}>
                                    (filtered)
                                </span>
                            )}
                        </>
                    )}
                </p>

                {/* View toggle */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setView('grid')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
                            border: '1px solid var(--border-color)',
                            background: view === 'grid' ? 'var(--accent-color)' : 'rgba(0,0,0,0.2)',
                            color: view === 'grid' ? 'white' : 'var(--text-secondary)',
                            fontSize: '0.85rem'
                        }}>
                        <LayoutGrid size={15} /> Grid
                    </button>
                    <button onClick={() => setView('map')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
                            border: '1px solid var(--border-color)',
                            background: view === 'map' ? 'var(--accent-color)' : 'rgba(0,0,0,0.2)',
                            color: view === 'map' ? 'white' : 'var(--text-secondary)',
                            fontSize: '0.85rem'
                        }}>
                        <MapIcon size={15} /> Map
                    </button>
                </div>
            </div>

            {/* ── Loading State ── */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
                    <p>Searching available lands…</p>
                </div>
            )}

            {/* ── No Results ── */}
            {!loading && lands.length === 0 && (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏜️</div>
                    <h3 style={{ marginBottom: '0.75rem' }}>No available lands found</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        {hasActiveFilters
                            ? 'No land listings match your current filters. Try adjusting or clearing them.'
                            : 'No lands are currently listed for sale.'}
                    </p>
                    {hasActiveFilters && (
                        <button onClick={handleClear} className="btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <X size={16} /> Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* ── MAP VIEW ── */}
            {!loading && lands.length > 0 && view === 'map' && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', height: '520px', border: '1px solid var(--border-color)' }}>
                    <Suspense fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading map…</div>}>
                        {mapReady && landsWithCoords.length > 0
                            ? <LandMap lands={landsWithCoords} />
                            : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                                    <MapIcon size={40} />
                                    <p>No coordinate data available for map view.</p>
                                </div>
                            )
                        }
                    </Suspense>
                </div>
            )}

            {/* ── GRID VIEW ── */}
            {!loading && lands.length > 0 && view === 'grid' && (
                <div className="grid-cards">
                    {lands.map(land => (
                        <div key={land.id} className="glass-panel"
                            style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '0', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>

                            {/* Card Header — coloured type band */}
                            <div style={{
                                background: land.land_type === 'Agricultural' ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.05))'
                                    : land.land_type === 'Residential' ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.05))'
                                        : land.land_type === 'Industrial' ? 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.05))'
                                            : 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(168,85,247,0.05))',
                                padding: '1.25rem 1.25rem 1rem',
                                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <LandTypeIcon type={land.land_type} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{land.id}</p>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{land.land_type} Land</p>
                                    </div>
                                </div>
                                <StatusBadge status={land.status} />
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                                {/* Location */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <MapPin size={15} color="var(--accent-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                                        {[land.location, land.village, land.taluk, land.district].filter(Boolean).join(', ')}
                                    </span>
                                </div>

                                {/* Area */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Maximize2 size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{formatArea(land.area_sq_ft)}</span>
                                </div>

                                {/* Price */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <IndianRupee size={15} color="var(--success)" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {land.asking_price ? formatPrice(land.asking_price) : 'Price on request'}
                                    </span>
                                </div>

                                {/* Survey details */}
                                {land.survey_number && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Tag size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Survey No: {land.survey_number}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)' }}>
                                <Link to={`/land/${land.id}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        width: '100%', padding: '0.6rem 1rem',
                                        background: 'var(--accent-color)', color: 'white',
                                        borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
                                        textDecoration: 'none', transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-color)'}>
                                    View Details <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Seller CTA ── */}
            <div className="glass-panel" style={{ marginTop: '2.5rem', textAlign: 'center', padding: '2rem' }}>
                <Building2 size={36} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ marginBottom: '0.5rem' }}>Want to list your land for sale?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Register your listing through the Sell Land section and reach thousands of buyers.
                </p>
                <Link to="/sell" className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none' }}>
                    List Your Land <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
};

export default AvailableLands;
