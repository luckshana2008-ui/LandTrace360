import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trash2 } from 'lucide-react';
import API_BASE from '../api';

const SavedLands = () => {
    const [savedIds, setSavedIds] = useState([]);
    const [lands, setLands] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/saved-lands`).then(res => res.json()).then(setSavedIds);
        fetch(`${API_BASE}/api/lands`).then(res => res.json()).then(setLands);
    }, []);

    const savedLandsData = lands.filter(l => savedIds.includes(l.id));

    const removeSaved = (id) => {
        fetch(`${API_BASE}/api/saved-lands/${id}`, { method: 'POST' })
            .then(() => setSavedIds(prev => prev.filter(sId => sId !== id)));
    };

    return (
        <div>
            <h1 className="page-title">Saved Lands</h1>
            <div className="grid-cards">
                {savedLandsData.map(land => (
                    <div key={land.id} className="glass-panel">
                        <h3 style={{ marginBottom: '1rem' }}>{land.id}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{land.location}</p>
                        <p style={{ marginBottom: '1rem' }}><strong>Owner:</strong> {land.owner}</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                            <Link to={`/land/${land.id}`} style={{ color: 'var(--accent-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                View Profile <ArrowRight size={16} />
                            </Link>
                            <button
                                onClick={() => removeSaved(land.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
                {savedLandsData.length === 0 && <p>You have not saved any lands yet.</p>}
            </div>
        </div>
    );
};
export default SavedLands;
