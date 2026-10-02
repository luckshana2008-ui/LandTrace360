import React, { useState, useEffect } from 'react';
import {
  FileText, ChevronDown, ChevronUp, Search, Layers,
  Calendar, CheckCircle, Database, Scale, MapPin, Sparkles,
  ExternalLink, ArrowDown, Shield, Eye
} from 'lucide-react';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const EvidenceExplorer = ({ landId, initialData = null }) => {
  const { t } = useLanguage();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [expandedFindings, setExpandedFindings] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!landId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/lands/${landId}/evidence`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load land evidence');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        // Expand first finding by default for quick visibility
        if (resData.findings && resData.findings.length > 0) {
          setExpandedFindings({ [resData.findings[0].finding_id]: true });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [landId]);

  const toggleExpand = (findingId) => {
    setExpandedFindings((prev) => ({
      ...prev,
      [findingId]: !prev[findingId]
    }));
  };

  const expandAll = () => {
    if (!data?.findings) return;
    const all = {};
    data.findings.forEach((f) => {
      all[f.finding_id] = true;
    });
    setExpandedFindings(all);
  };

  const collapseAll = () => {
    setExpandedFindings({});
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div className="status-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
          <Sparkles size={16} />
          {t('common.loading', 'Compiling evidence trails...')}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error || t('common.error', 'Failed to load evidence records')}</p>
      </div>
    );
  }

  const { findings = [], total_findings = 0, generated_at = '', disclaimer = '' } = data;

  const filteredFindings = findings.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchFinding = (f.finding || '').toLowerCase().includes(term);
    const matchCategory = (f.category || '').toLowerCase().includes(term);
    const matchReason = (f.reason || '').toLowerCase().includes(term);
    const matchRecord = (f.supporting_records || []).some(
      (r) =>
        (r.record_id || '').toLowerCase().includes(term) ||
        (r.record_type || '').toLowerCase().includes(term) ||
        (r.value || '').toLowerCase().includes(term)
    );
    return matchFinding || matchCategory || matchReason || matchRecord;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Header Card ── */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: '#c084fc',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Layers size={13} />
                {t('evidenceExplorer.badge', 'HIERARCHICAL AUDIT PROOF')}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {landId}
              </span>
            </div>
            <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('evidenceExplorer.title', 'Evidence Explorer')}
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '780px' }}>
              {t('evidenceExplorer.subtitle', 'Transparent traceability chain linking analytical findings to underlying project records')}
            </p>
          </div>

          <div
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              textAlign: 'right'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#c084fc', letterSpacing: '0.05em' }}>
              {t('evidenceExplorer.totalFindings', 'Total Findings Tracked')}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {total_findings} Verified Links
            </div>
          </div>
        </div>

        {/* ── Hierarchy Blueprint Diagram ── */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>FINDING</span>
          <span>→</span>
          <span style={{ fontWeight: 700, color: '#38bdf8' }}>REASON</span>
          <span>→</span>
          <span style={{ fontWeight: 700, color: '#c084fc' }}>SUPPORTING RECORDS</span>
          <span>→</span>
          <span style={{ fontWeight: 700, color: '#fbbf24' }}>RECORD / DATE / VALUE</span>
          <span>→</span>
          <span style={{ fontWeight: 700, color: 'var(--success)' }}>DETAILS</span>
        </div>

        {/* ── Disclaimer ── */}
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          ℹ️ {disclaimer || t('evidenceExplorer.disclaimer', 'Demo / Synthetic Project Data — Not an Official Government Land Record')}
        </div>
      </div>

      {/* ── Search & Actions Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.8rem', width: '320px', maxWidth: '100%' }}>
          <Search size={16} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
          <input
            type="text"
            placeholder={t('evidenceExplorer.searchPlaceholder', 'Search findings or records...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={expandAll}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            {t('evidenceExplorer.expandAll', 'Expand All')}
          </button>
          <button
            onClick={collapseAll}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            {t('evidenceExplorer.collapseAll', 'Collapse All')}
          </button>
        </div>
      </div>

      {/* ── Findings List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredFindings.map((item) => {
          const isExpanded = !!expandedFindings[item.finding_id];
          const recordCount = (item.supporting_records || []).length;

          return (
            <div
              key={item.finding_id}
              className="glass-panel"
              style={{
                borderRadius: '14px',
                border: isExpanded ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border-color)',
                background: 'rgba(15, 23, 42, 0.7)',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleExpand(item.finding_id)}
                style={{
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  background: isExpanded ? 'rgba(168, 85, 247, 0.06)' : 'transparent',
                  borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        borderRadius: '4px',
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                      }}
                    >
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {item.finding_id}
                    </span>
                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        borderRadius: '12px',
                        padding: '0.1rem 0.45rem',
                        fontSize: '0.7rem'
                      }}
                    >
                      {recordCount} {recordCount === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.finding}
                  </h3>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Accordion Body: Hierarchical Breakdown */}
              {isExpanded && (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Step 1: FINDING */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                      1. FINDING
                    </div>
                    <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>
                      {item.finding}
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', padding: '0.25rem', color: 'var(--text-secondary)' }}>
                      <ArrowDown size={14} />
                    </div>
                  </div>

                  {/* Step 2: REASON */}
                  <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                      2. REASON / JUSTIFICATION
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {item.reason}
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', padding: '0.25rem', color: 'var(--text-secondary)' }}>
                      <ArrowDown size={14} />
                    </div>
                  </div>

                  {/* Step 3: SUPPORTING RECORDS */}
                  <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        3. SUPPORTING RECORDS ({recordCount})
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Cross-referenced against project databases
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(item.supporting_records || []).map((rec, rIdx) => (
                        <div
                          key={rIdx}
                          style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.85rem 1rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: 'var(--text-primary)',
                                  borderRadius: '4px',
                                  padding: '0.15rem 0.5rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 600
                                }}
                              >
                                {rec.record_type}
                              </span>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#c084fc', fontWeight: 600 }}>
                                {rec.record_id}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              <Calendar size={12} />
                              {rec.date}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>Field / Value: </span>
                              <strong style={{ color: 'var(--text-primary)' }}>{rec.relevant_field}</strong> = <span style={{ color: '#38bdf8' }}>{rec.value}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>Relationship: </span>
                              <span style={{ color: 'var(--text-primary)' }}>{rec.relationship_to_finding}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', padding: '0.25rem', color: 'var(--text-secondary)' }}>
                      <ArrowDown size={14} />
                    </div>
                  </div>

                  {/* Step 4: DETAILS */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                      4. AUDIT DETAILS & SUMMARY
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {item.details}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvidenceExplorer;
