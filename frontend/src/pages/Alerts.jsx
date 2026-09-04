import { Bell, AlertTriangle, ShieldCheck } from 'lucide-react';

const Alerts = () => {
    const alerts = [
        { id: 1, type: 'warning', title: 'Risk Change Detected', message: 'LND-1004 overall risk increased due to new legal case.', date: 'Today' },
        { id: 2, type: 'info', title: 'New Land Listed', message: 'LND-1005 was just announced for sale at ₹80,000.', date: 'Yesterday' },
        { id: 3, type: 'danger', title: 'Document Mismatch', message: 'Mismatch found in Survey number for LND-1002 during cross-verification.', date: '2 days ago' },
        { id: 4, type: 'success', title: 'Mortgage Released', message: 'National Bank released mortgage on LND-1001.', date: 'Last week' },
    ];

    return (
        <div>
            <h1 className="page-title"><Bell style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> System Alerts</h1>
            <div className="grid-cards" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alerts.map(alert => (
                    <div key={alert.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: alert.type === 'warning' ? '4px solid var(--warning)' : alert.type === 'danger' ? '4px solid var(--danger)' : alert.type === 'success' ? '4px solid var(--success)' : '4px solid var(--accent-color)' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {alert.type === 'danger' && <AlertTriangle size={18} color="var(--danger)" />}
                                    {alert.type === 'success' && <ShieldCheck size={18} color="var(--success)" />}
                                    {alert.title}
                                </h3>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{alert.date}</span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{alert.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Alerts;
