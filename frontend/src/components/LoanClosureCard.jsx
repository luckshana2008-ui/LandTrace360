import { useState } from 'react';
import { ShieldCheck, Search, FileText, AlertTriangle, CheckCircle2, Clock, Info, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE from '../api';

const STATUS_COLORS = {
    COMPLETED: '#10b981',
    ACTIVE: '#3b82f6',
    OVERDUE: '#ef4444',
    'NO LOAN RECORD FOUND': '#94a3b8'
};

const STATUS_ICONS = {
    COMPLETED: CheckCircle2,
    ACTIVE: Clock,
    OVERDUE: AlertTriangle,
    'NO LOAN RECORD FOUND': Info
};

const LoanClosureCard = ({ landId }) => {
    const [docNo, setDocNo] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        const trimmed = docNo.trim();
        if (!trimmed) { setError('Enter a document number.'); return; }
        setError('');
        setResult(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/loan-closure-verification/${encodeURIComponent(trimmed)}`);
            const data = await res.json();
            setResult(data);
        } catch {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = result?.loan_status ? (STATUS_COLORS[result.loan_status] || '#94a3b8') : null;
    const StatusIcon = result?.loan_status ? (STATUS_ICONS[result.loan_status] || Info) : Info;

    return (
        <div className="glass-panel">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <ShieldCheck size={20} /> Loan Closure Verification
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Quickly check loan/mortgage status for a document linked to this land.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <FileText size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        value={docNo}
                        onChange={(e) => setDocNo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        placeholder="e.g. DOC-88334"
                        style={{
                            width: '100%', padding: '0.6rem 0.75rem 0.6rem 2rem',
                            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                            borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none'
                        }}
                    />
                </div>
                <button onClick={handleVerify} className="btn-primary" disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                    <Search size={16} /> {loading ? '...' : 'Verify'}
                </button>
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}

            {result && !result.found && (
                <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', borderLeft: '3px solid var(--danger)', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <XCircle size={18} color="var(--danger)" />
                        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Not Found</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.message}</p>
                </div>
            )}

            {result && result.found && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem', borderLeft: `3px solid ${statusColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <StatusIcon size={20} color={statusColor} />
                        <span style={{ fontWeight: 700, color: statusColor, fontSize: '0.95rem' }}>
                            {result.loan_status}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Doc:</span> {result.document_number}</div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Type:</span> {result.document_type}</div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Land:</span> <Link to={`/land/${result.land_id}`} style={{ color: 'var(--accent-color)' }}>{result.land_id}</Link></div>
                        {result.bank_lender && <div><span style={{ color: 'var(--text-secondary)' }}>Bank:</span> {result.bank_lender}</div>}
                        {result.loan_start_date && <div><span style={{ color: 'var(--text-secondary)' }}>Start:</span> {result.loan_start_date}</div>}
                        {result.loan_end_date && <div><span style={{ color: 'var(--text-secondary)' }}>End:</span> {result.loan_end_date}</div>}
                        {result.closure_date && <div><span style={{ color: 'var(--text-secondary)' }}>Closed:</span> <span style={{ color: '#10b981' }}>{result.closure_date}</span></div>}
                    </div>

                    <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '6px', background: `${statusColor}15`, color: statusColor, fontWeight: 500 }}>
                        {result.verification_result}
                    </p>
                </div>
            )}

            <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertTriangle size={12} /> Demo/project records only — not real bank verification.
            </p>
        </div>
    );
};

export default LoanClosureCard;
