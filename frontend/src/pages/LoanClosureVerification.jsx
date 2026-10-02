import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Search, FileText, Landmark, AlertTriangle, CheckCircle2, XCircle, Clock, Info } from 'lucide-react';
import API_BASE from '../api';

const STATUS_CONFIG = {
    COMPLETED: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', icon: CheckCircle2, label: 'COMPLETED / CLOSED' },
    ACTIVE: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', icon: Clock, label: 'ACTIVE / ONGOING' },
    OVERDUE: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', icon: AlertTriangle, label: 'OVERDUE / DEFAULT' },
    'NO LOAN RECORD FOUND': { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', icon: Info, label: 'NO LOAN RECORD FOUND' }
};

const LoanClosureVerification = () => {
    const [docNo, setDocNo] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        const trimmed = docNo.trim();
        if (!trimmed) {
            setError('Please enter a document number.');
            return;
        }
        setError('');
        setResult(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/loan-closure-verification/${encodeURIComponent(trimmed)}`);
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError('Failed to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleVerify();
    };

    const statusCfg = result?.loan_status ? (STATUS_CONFIG[result.loan_status] || STATUS_CONFIG['NO LOAN RECORD FOUND']) : null;
    const StatusIcon = statusCfg?.icon || Info;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={32} /> Loan Closure Verification
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                Enter a document number to verify whether the loan or mortgage associated with the linked land has been completed or is still active.
            </p>

            {/* Search bar */}
            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <FileText size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            id="loan-doc-input"
                            type="text"
                            value={docNo}
                            onChange={(e) => setDocNo(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. DOC-88334"
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem 0.85rem 2.5rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>
                    <button
                        id="loan-verify-btn"
                        onClick={handleVerify}
                        className="btn-primary"
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', padding: '0.85rem 1.5rem' }}
                    >
                        <Search size={18} />
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </div>
                {error && <p style={{ color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.9rem' }}>{error}</p>}
            </div>

            {/* Loading state */}
            {loading && (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{
                        width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-color)',
                        borderRadius: '50%', margin: '0 auto 1rem',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Looking up document and loan records...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Not Found */}
            {result && !result.found && (
                <div className="glass-panel" style={{
                    borderLeft: '4px solid var(--danger)',
                    animation: 'fadeSlideIn 0.35s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <XCircle size={28} color="var(--danger)" />
                        <h2 style={{ margin: 0, color: 'var(--danger)' }}>Document Not Found</h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        <strong>Document Number:</strong> {result.document_number}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--warning)' }}>
                        ⚠️ {result.disclaimer}
                    </div>
                </div>
            )}

            {/* Result Card */}
            {result && result.found && (
                <div style={{ animation: 'fadeSlideIn 0.35s ease-out' }}>
                    {/* Status Banner */}
                    <div style={{
                        background: statusCfg.bg,
                        border: `1px solid ${statusCfg.border}`,
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}>
                        <StatusIcon size={40} color={statusCfg.color} />
                        <div style={{ flex: 1 }}>
                            <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.85rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                color: statusCfg.color,
                                background: `${statusCfg.color}22`,
                                letterSpacing: '0.05em',
                                marginBottom: '0.5rem'
                            }}>
                                {statusCfg.label}
                            </span>
                            <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.1rem' }}>
                                {result.verification_result}
                            </p>
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="glass-panel">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                            <Landmark size={22} /> Verification Details
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
                            gap: '1.25rem'
                        }}>
                            <DetailRow label="Document Number" value={result.document_number} />
                            <DetailRow label="Document Type" value={result.document_type} />
                            <DetailRow label="Document Date" value={result.document_date} />
                            <DetailRow label="Document Verification" value={result.document_verification} />
                            <DetailRow label="Land ID" value={result.land_id} link={`/land/${result.land_id}`} />
                            <DetailRow label="Survey Number" value={result.survey_number} />
                            <DetailRow label="Land Location" value={result.land_location} />
                            <DetailRow label="Land Owner" value={result.land_owner} />
                            <DetailRow label="Land Type" value={result.land_type} />
                            {result.loan_mortgage_id && <DetailRow label="Loan/Mortgage ID" value={result.loan_mortgage_id} />}
                            {result.bank_lender && <DetailRow label="Bank / Lender" value={result.bank_lender} />}
                            {result.loan_start_date && <DetailRow label="Loan Start Date" value={result.loan_start_date} />}
                            {result.loan_end_date && <DetailRow label="Loan End Date" value={result.loan_end_date} />}
                            <DetailRow label="Loan Status"
                                value={result.loan_status}
                                highlight={statusCfg.color}
                            />
                            {result.closure_date && <DetailRow label="Closure Date" value={result.closure_date} highlight="#10b981" />}
                        </div>

                        {/* Verification Result Summary */}
                        <div style={{
                            marginTop: '1.5rem', padding: '1rem', borderRadius: '8px',
                            background: statusCfg.bg, borderLeft: `4px solid ${statusCfg.color}`
                        }}>
                            <p style={{ margin: 0, fontWeight: '600', color: statusCfg.color, marginBottom: '0.25rem' }}>
                                Verification Result
                            </p>
                            <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                                {result.verification_result}
                            </p>
                        </div>

                        {/* Disclaimer */}
                        <div style={{
                            marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.08)',
                            borderRadius: '8px', fontSize: '0.85rem', color: 'var(--warning)',
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
                        }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            {result.disclaimer}
                        </div>
                    </div>
                </div>
            )}

            {/* Helper text */}
            {!result && !loading && (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
                    <ShieldCheck size={48} style={{ color: 'var(--accent-color)', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Enter a document number above to check loan/mortgage status.</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Try: <strong style={{ color: 'var(--text-primary)' }}>DOC-88334</strong> (active loan),{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>DOC-99812</strong> (completed loan),{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>DOC-11234</strong> (active loan)
                    </p>
                </div>
            )}

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const DetailRow = ({ label, value, link, highlight }) => (
    <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            {label}
        </p>
        {link ? (
            <Link to={link} style={{ margin: 0, fontWeight: '600', color: 'var(--accent-color)', textDecoration: 'underline' }}>
                {value || '—'}
            </Link>
        ) : (
            <p style={{ margin: 0, fontWeight: '600', color: highlight || 'var(--text-primary)' }}>
                {value || '—'}
            </p>
        )}
    </div>
);

export default LoanClosureVerification;
