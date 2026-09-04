import { useState, useEffect } from 'react';
import { History, Maximize, Target } from 'lucide-react';
import API_BASE from '../api';

const TimeMachine = ({ history, owners, boundary: initialBoundary, fragments: initialFragments, landId }) => {
    const [selectedYear, setSelectedYear] = useState(history[history.length - 1].year);
    const [yearBoundary, setYearBoundary] = useState(initialBoundary);
    const [yearFragments, setYearFragments] = useState(initialFragments);

    useEffect(() => {
        if (!landId) return;

        let isMounted = true;

        Promise.all([
            fetch(`${API_BASE}/api/lands/${landId}/boundary-changes?year=${selectedYear}`).then(res => res.json()),
            fetch(`${API_BASE}/api/lands/${landId}/fragmentation?year=${selectedYear}`).then(res => res.json())
        ]).then(([boundaryData, fragmentData]) => {
            if (isMounted) {
                setYearBoundary(boundaryData);
                setYearFragments(fragmentData);
            }
        }).catch(err => console.error("Error fetching year data:", err));

        return () => { isMounted = false; };
    }, [selectedYear, landId]);

    const currentRecord = history.find(h => Number(h.year) === Number(selectedYear)) || history[history.length - 1];

    return (
        <div className="glass-panel">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <History color="var(--accent-color)" /> Land Time Machine
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>Scrub through the history of this land property</p>
            </div>

            <div style={{ padding: '0 2rem', marginBottom: '3rem' }}>
                <input
                    type="range"
                    min={history[0].year}
                    max={history[history.length - 1].year}
                    step={1}
                    value={selectedYear}
                    onChange={(e) => {
                        // Snap to closest available year in history data
                        const y = parseInt(e.target.value);
                        const closest = history.reduce((prev, curr) => Math.abs(curr.year - y) < Math.abs(prev.year - y) ? curr : prev);
                        setSelectedYear(closest.year);
                    }}
                    style={{ width: '100%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    {history.map(h => <span key={h.year}>{h.year}</span>)}
                </div>
            </div>

            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Snapshot for {currentRecord.year}</h3>
                    <p style={{ marginTop: '1rem' }}><strong>Owner:</strong> {currentRecord.owner}</p>
                    <p><strong>Status:</strong> {currentRecord.status}</p>
                    <p><strong>Transactions:</strong> {currentRecord.transactions}</p>
                    <p><strong>Risk Score:</strong> {currentRecord.risk_score}</p>
                    <p><strong>Boundary:</strong> {currentRecord.boundary_status}</p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={18} color="var(--success)" /> Boundary Change</h3>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status at year {selectedYear}</p>
                    <p><strong>Previous:</strong> {yearBoundary?.previous_status || 'N/A'}</p>
                    <p><strong>Current:</strong> {yearBoundary?.current_status || 'N/A'}</p>
                    <p><strong>Deviation:</strong> <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>{yearBoundary?.deviation_percentage || 'N/A'}</span></p>
                    <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>Last Survey: {yearBoundary?.last_survey_date || 'N/A'}</p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Maximize size={18} color="#a855f7" /> Fragmentation</h3>
                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Historical subdivisions as of {selectedYear}</p>
                    <p><strong>Original Parent Area:</strong> {yearFragments?.original_area || 0} sq ft</p>
                    <p><strong>Current Area:</strong> {yearFragments?.current_area || 0} sq ft</p>
                    <p><strong>Total Subdivisions:</strong> {yearFragments?.subdivisions || 0}</p>
                </div>
            </div>
        </div>
    );
};
export default TimeMachine;
