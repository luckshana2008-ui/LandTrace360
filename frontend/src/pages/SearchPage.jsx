import { useState, useEffect } from 'react';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE from '../api';

const SearchPage = () => {
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/search?q=${query}`)
            .then(res => res.json())
            .then(data => {
                setResults(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    // Initial load
    useEffect(() => {
        handleSearch();
    }, []);

    return (
        <div>
            <h1 className="page-title">Search Lands</h1>
            <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search by ID, Survey Number, Location, Owner..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                />
                <button className="btn-primary" onClick={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={18} /> Search
                </button>
            </div>

            {loading ? <p>Searching...</p> : (
                <div className="grid-cards">
                    {results.map(land => (
                        <div key={land.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>{land.id}</h3>
                                <span className={`status-badge ${land.status === 'Verified' ? 'status-success' : 'status-warning'}`}>{land.status}</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{land.location} - {land.land_type}</p>
                            <p style={{ marginBottom: '1rem' }}><strong>Owner:</strong> {land.owner}</p>
                            <Link to={`/land/${land.id}`} style={{ marginTop: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontWeight: '600' }}>
                                View Land Profile <ArrowRight size={16} />
                            </Link>
                        </div>
                    ))}
                    {results.length === 0 && <p>No lands found matching your search.</p>}
                </div>
            )}
        </div>
    );
};
export default SearchPage;
