import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API_BASE from '../api';

const RiskTimeline = ({ landId }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/lands/${landId}/risk-timeline`)
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    }, [landId]);

    if (!data) return <p>Loading Risk Timeline...</p>;

    return (
        <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <h2>📈 Risk Timeline</h2>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Trend</p>
                    <h3 style={{ margin: 0, color: data.trend === 'Decreasing' ? 'var(--success)' : data.trend === 'Increasing' ? 'var(--danger)' : 'var(--warning)' }}>
                        {data.trend}
                    </h3>
                </div>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="year" stroke="var(--text-secondary)" />
                        <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)', color: '#fff' }} />
                        <Line type="monotone" dataKey="risk_score" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '0.5rem' }}>
                * Future values are demo estimates based on trend.
            </p>
        </div>
    );
};

export default RiskTimeline;
