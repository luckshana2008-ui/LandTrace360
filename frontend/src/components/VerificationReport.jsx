import { useState } from 'react';
import { FileText, Printer, Download, X } from 'lucide-react';
import API_BASE from '../api';

const VerificationReport = ({ landId }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/lands/${landId}/verification-report`);
            const data = await res.json();
            setReportData(data);
            setShowModal(true);
        } catch (err) {
            console.error('Failed to generate report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <button onClick={generateReport} className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                <FileText size={18} />
                {loading ? 'Generating Report...' : 'Generate Verification Report'}
            </button>

            {showModal && reportData && (
                <div className="report-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, overflowY: 'auto', padding: '2rem' }}>
                    <div className="report-modal-content" style={{ maxWidth: '900px', margin: '0 auto', background: 'white', color: 'black', padding: '3rem', borderRadius: '8px', position: 'relative' }}>

                        <div className="no-print" style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button onClick={handlePrint} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Printer size={16} /> Print / Download PDF
                            </button>
                            <button onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <X size={16} /> Close
                            </button>
                        </div>

                        <div id="print-area">
                            <style>
                                {`
                                    @media print {
                                        body * { visibility: hidden; }
                                        #print-area, #print-area * { visibility: visible; }
                                        #print-area { position: absolute; left: 0; top: 0; width: 100%; color: black !important; }
                                        .no-print { display: none !important; }
                                        h1, h2, h3, h4 { margin-top: 1rem; margin-bottom: 0.5rem; color: #1f2937 !important; }
                                        p, div, span, td, th { color: #374151 !important; }
                                        .report-section { margin-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; }
                                        .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; border: 1px solid #ccc; }
                                    }
                                    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; border: 1px solid #ccc; background: #f3f4f6; color: #374151; }
                                    .report-section { margin-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; }
                                `}
                            </style>

                            <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #1f2937', paddingBottom: '1rem' }}>
                                <h1 style={{ fontSize: '2.5rem', margin: 0, color: '#1f2937' }}>LANDTRACE 360</h1>
                                <h2 style={{ fontSize: '1.5rem', color: '#4b5563', margin: '0.5rem 0' }}>LAND VERIFICATION REPORT</h2>
                                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Date: {new Date().toLocaleDateString()} | ID: {reportData.land.id}</p>
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>1. Land Overview</h3>
                                <p><strong>Survey Number:</strong> {reportData.land.survey_number}</p>
                                <p><strong>Location:</strong> {reportData.land.location}, {reportData.land.village}</p>
                                <p><strong>Area:</strong> {reportData.land.area_sq_ft} sq ft</p>
                                <p><strong>Land Type:</strong> {reportData.land.land_type}</p>
                                <p><strong>Current Status:</strong> <span className="badge">{reportData.land.status}</span></p>
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>2. Ownership Verification</h3>
                                <p><strong>Current Owner:</strong> {reportData.land.owner}</p>
                                <p><strong>Total Transactions:</strong> {reportData.history.reduce((sum, h) => sum + h.transactions, 0)}</p>
                                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    <strong>History:</strong>
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
                                        {reportData.owners.map((o, i) => (
                                            <li key={i}>{o.name} ({o.period}) - {o.type}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>3. Document Verification</h3>
                                <p><strong>Overall Result:</strong> <span className="badge">{reportData.doc_verification.overall_result}</span></p>
                                <p><strong>Score:</strong> {reportData.doc_verification.score}/100</p>
                                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
                                    {reportData.documents.map((d, i) => (
                                        <li key={i}>{d.doc_no} ({d.type}) - Verification: {d.verification}, Result: {d.result}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>4. Legal Case Analysis</h3>
                                {reportData.cases.length === 0 ? <p>No active legal cases found.</p> : (
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
                                        {reportData.cases.map((c, i) => (
                                            <li key={i}>{c.case_no} - {c.type} at {c.court}. Status: <span className="badge">{c.status}</span></li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>5. Mortgage / Encumbrance Status</h3>
                                {reportData.mortgages.length === 0 ? <p>No active mortgages found.</p> : (
                                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
                                        {reportData.mortgages.map((m, i) => (
                                            <li key={i}>{m.bank} ({m.start_date} to {m.release_date}). Status: <span className="badge">{m.status}</span></li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>6. Boundary Analysis</h3>
                                <p><strong>Current Status:</strong> {reportData.boundary.current_status}</p>
                                <p><strong>Previous Status:</strong> {reportData.boundary.previous_status}</p>
                                <p><strong>Deviation:</strong> {reportData.boundary.deviation_percentage}%</p>
                                <p><strong>Risk Impact:</strong> <span className="badge">{reportData.boundary.risk_impact}</span></p>
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>7. Land Fragmentation</h3>
                                <p><strong>Status:</strong> {reportData.fragmentation.status}</p>
                                <p><strong>Subdivisions:</strong> {reportData.fragmentation.subdivisions}</p>
                                <p><strong>Original vs Current Area:</strong> {reportData.fragmentation.original_area} sq ft vs {reportData.fragmentation.current_area} sq ft</p>
                                <p><strong>Risk Impact:</strong> <span className="badge">{reportData.fragmentation.risk_impact}</span></p>
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>8. Land DNA</h3>
                                <p>Overall Health: {reportData.dna.overall_health}% | Ownership Stability: {reportData.dna.ownership_stability}% | Document Health: {reportData.dna.document_health}% | Legal Safety: {reportData.dna.legal_safety}% | Mortgage Status: {reportData.dna.mortgage_status}% | Boundary Stability: {reportData.dna.boundary_stability}%</p>
                            </div>

                            <div className="report-section">
                                <h3 style={{ color: '#1f2937' }}>9. AI Risk Analysis</h3>
                                <div>
                                    <strong>Overall Risk Score:</strong> <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reportData.risk.overall_score}</span> / 100
                                    <span className="badge" style={{ marginLeft: '1rem' }}>{reportData.risk.level} RISK</span>
                                </div>
                                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Document Risk: {reportData.risk.document_risk} | Legal Risk: {reportData.risk.legal_risk} | Ownership Risk: {reportData.risk.ownership_risk} | Boundary Risk: {reportData.risk.boundary_risk}</p>
                            </div>

                            <div className="report-section" style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                                <h3 style={{ color: '#1f2937', marginTop: 0 }}>10. Overall Verification Summary</h3>
                                <p style={{ fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>{reportData.summary}</p>
                            </div>

                            <div style={{ marginTop: '3rem', borderTop: '2px dashed #ccc', paddingTop: '1rem', fontSize: '0.8rem', color: '#6b7280', textAlign: 'center' }}>
                                <p>
                                    This report is generated using synthetic demonstration data for the LandTrace360 project. It is intended for educational and demonstration purposes only and does not constitute legal, cadastral, financial, or professional advice.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationReport;
