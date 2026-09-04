import { useState } from 'react';
import { ShieldCheck, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const VerificationReport = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [landId, setLandId] = useState('LND-1001');

    const generateReport = (e) => {
        e.preventDefault();
        setLoading(true);
        // Mocking an API call to generate a verification report
        setTimeout(() => {
            setReport({
                land_id: landId,
                generatedAt: new Date().toLocaleString(),
                status: landId !== 'LND-1004' ? 'PASS' : 'FAIL',
                checks: [
                    { name: 'Document-Record Cross Verification', status: landId !== 'LND-1004' ? 'Match' : 'Mismatch found in Survey' },
                    { name: 'Boundary Status Check', status: 'Verified using recent scans' },
                    { name: 'Ownership History Trace', status: 'Continuous tracing achieved' },
                    { name: 'Legal Encumbrance', status: landId !== 'LND-1004' ? 'Clear' : 'Active Disputes Present' }
                ]
            });
            setLoading(false);
        }, 1000);
    };

    return (
        <div>
            <h1 className="page-title"><FileText style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Automatic Verification Report</h1>
            <div className="glass-panel" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Generate a comprehensive automatic audit report for a specific land ID.</p>
                <form onSubmit={generateReport} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={landId}
                        onChange={(e) => setLandId(e.target.value)}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                    />
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Analyzing...' : 'Generate Report'}
                    </button>
                </form>
            </div>

            {report && (
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                Audit Report: {report.land_id}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Generated: {report.generatedAt}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className={`status-badge ${report.status === 'PASS' ? 'status-success' : 'status-danger'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                {report.status}
                            </span>
                            <div style={{ marginTop: '0.5rem' }}>
                                <Link to={`/land/${report.land_id}`} style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>View Profile</Link>
                            </div>
                        </div>
                    </div>

                    <h3>Verification Checks</h3>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {report.checks.map((chk, idx) => (
                            <li key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{chk.name}</span>
                                <span className={`status-badge ${['Match', 'Verified using recent scans', 'Continuous tracing achieved', 'Clear'].includes(chk.status) ? 'status-success' : 'status-danger'}`}>
                                    {chk.status}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <button className="btn-primary" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)' }}>
                        <Download size={18} /> Export PDF (Demo)
                    </button>
                </div>
            )}
        </div>
    );
};

export default VerificationReport;
