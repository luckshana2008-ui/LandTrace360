import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, Info,
  Filter, ChevronDown, ChevronUp, Clock, FileText, CheckCircle2,
  Layers, Search, Sparkles
} from 'lucide-react';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const AnomalyDetective = ({ landId, initialData = null }) => {
  const { t } = useLanguage();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [expandedAnomalies, setExpandedAnomalies] = useState({});

  useEffect(() => {
    if (!landId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/lands/${landId}/anomalies`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load anomaly detection data');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [landId]);

  const toggleExpand = (anomId) => {
    setExpandedAnomalies((prev) => ({
      ...prev,
      [anomId]: !prev[anomId]
    }));
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
          <Sparkles size={16} />
          {t('common.loading', 'Scanning records for anomalies...')}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <AlertTriangle size={32} color="var(--danger)" style={{ marginBottom: '0.5rem' }} />
        <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error || t('common.error', 'Failed to load anomalies')}</p>
      </div>
    );
  }

  const {
    total_anomalies = 0,
    critical_count = 0,
    high_count = 0,
    medium_count = 0,
    low_count = 0,
    anomalies = [],
    summary = '',
    disclaimer = '',
    analyzed_at = ''
  } = data;

  const filteredAnomalies = anomalies.filter((a) => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.45)',
          color: '#ef4444',
          glow: '0 0 16px rgba(239, 68, 68, 0.25)',
          icon: AlertCircle
        };
      case 'HIGH':
        return {
          bg: 'rgba(249, 115, 22, 0.12)',
          border: 'rgba(249, 115, 22, 0.45)',
          color: '#f97316',
          glow: '0 0 14px rgba(249, 115, 22, 0.2)',
          icon: AlertTriangle
        };
      case 'MEDIUM':
        return {
          bg: 'rgba(234, 179, 8, 0.12)',
          border: 'rgba(234, 179, 8, 0.45)',
          color: '#eab308',
          glow: '0 0 12px rgba(234, 179, 8, 0.15)',
          icon: Info
        };
      case 'LOW':
      default:
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.35)',
          color: '#38bdf8',
          glow: '0 0 10px rgba(56, 189, 248, 0.12)',
          icon: Info
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Header Banner ── */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: total_anomalies > 0 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
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
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <ShieldAlert size={13} />
                {t('anomalies.badge', 'RULE-BASED AI DETECTIVE')}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {landId}
              </span>
            </div>
            <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('anomalies.title', 'Land Anomaly Detective')}
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '780px' }}>
              {t('anomalies.subtitle', 'Transparent rule-based detection analyzing stored project records across 10 critical risk dimensions')}
            </p>
          </div>

          <div
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              background: total_anomalies > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: total_anomalies > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
              textAlign: 'right'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: total_anomalies > 0 ? '#f87171' : '#34d399', letterSpacing: '0.05em' }}>
              {total_anomalies > 0 ? t('anomalies.statusFlagged', 'STATUS: ANOMALIES IDENTIFIED') : t('anomalies.statusClear', 'STATUS: CLEAN AUDIT')}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {total_anomalies} {total_anomalies === 1 ? 'Indicator' : 'Indicators'}
            </div>
          </div>
        </div>

        {/* ── Metric Chips ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Found</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{total_anomalies}</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>Critical</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444' }}>{critical_count}</div>
          </div>
          <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#fb923c', textTransform: 'uppercase', fontWeight: 600 }}>High</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f97316' }}>{high_count}</div>
          </div>
          <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#facc15', textTransform: 'uppercase', fontWeight: 600 }}>Medium</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#eab308' }}>{medium_count}</div>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600 }}>Low</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8' }}>{low_count}</div>
          </div>
        </div>

        {/* ── Disclaimer Callout ── */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>
            ℹ️ {disclaimer || t('anomalies.disclaimer', 'Project Rule-Based Analysis — Demo / Synthetic Project Data — Not an Official Government Land Record')}
          </span>
          {analyzed_at && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> {analyzed_at}
            </span>
          )}
        </div>
      </div>

      {/* ── Filters & Summary Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
            <Filter size={14} /> Filter:
          </span>
          {[
            { id: 'ALL', label: t('anomalies.filterAll', 'All Anomalies'), count: total_anomalies },
            { id: 'CRITICAL', label: t('anomalies.filterCritical', 'Critical'), count: critical_count },
            { id: 'HIGH', label: t('anomalies.filterHigh', 'High'), count: high_count },
            { id: 'MEDIUM', label: t('anomalies.filterMedium', 'Medium'), count: medium_count },
            { id: 'LOW', label: t('anomalies.filterLow', 'Low'), count: low_count }
          ].map((flt) => (
            <button
              key={flt.id}
              onClick={() => setSeverityFilter(flt.id)}
              style={{
                background: severityFilter === flt.id ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                color: severityFilter === flt.id ? '#ffffff' : 'var(--text-secondary)',
                border: severityFilter === flt.id ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {flt.label}
              <span
                style={{
                  background: severityFilter === flt.id ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.7rem'
                }}
              >
                {flt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty / Clear State ── */}
      {total_anomalies === 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 23, 42, 0.6))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}
          >
            <ShieldCheck size={36} color="var(--success)" />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem' }}>
            {t('anomalies.noAnomalies', 'No anomaly can be determined from the available project records.')}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '580px', marginInline: 'auto', fontSize: '0.9rem' }}>
            {t('anomalies.cleanDesc', 'No contradictory ownership, area reduction, litigation, or encumbrance anomalies detected in project records.')}
          </p>
        </div>
      )}

      {/* ── Filtered List Empty ── */}
      {total_anomalies > 0 && filteredAnomalies.length === 0 && (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No anomalies found matching the selected severity ({severityFilter}).</p>
        </div>
      )}

      {/* ── Anomaly Cards Grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAnomalies.map((anom) => {
          const sevStyle = getSeverityStyle(anom.severity);
          const IconComp = sevStyle.icon;
          const isExpanded = !!expandedAnomalies[anom.anomaly_id];

          return (
            <div
              key={anom.anomaly_id}
              className="glass-panel"
              style={{
                padding: '1.4rem',
                borderRadius: '14px',
                border: `1px solid ${sevStyle.border}`,
                background: 'rgba(15, 23, 42, 0.65)',
                boxShadow: sevStyle.glow,
                transition: 'all 0.2s ease'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: sevStyle.bg,
                      color: sevStyle.color,
                      border: `1px solid ${sevStyle.border}`,
                      borderRadius: '6px',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <IconComp size={12} />
                    {anom.severity}
                  </span>

                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                      borderRadius: '6px',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Layers size={12} />
                    {anom.category}
                  </span>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {anom.anomaly_id}
                  </span>
                </div>

                {/* Confidence Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {t('anomalies.confidence', 'Confidence')}:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '48px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.round((anom.confidence || 0.9) * 100)}%`,
                          height: '100%',
                          background: sevStyle.color
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Math.round((anom.confidence || 0.9) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {anom.title}
              </h3>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {anom.description}
              </p>

              {/* Why It Was Detected Box */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderLeft: `3px solid ${sevStyle.color}`,
                  borderRadius: '0 8px 8px 0',
                  padding: '0.65rem 0.9rem',
                  marginBottom: '0.85rem'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: sevStyle.color, marginBottom: '0.2rem' }}>
                  🔍 {t('anomalies.whyDetected', 'Why It Was Detected')}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {anom.why_it_was_detected}
                </div>
              </div>

              {/* Affected Records & Evidence Expand Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t('anomalies.affectedRecords', 'Affected Records')}:
                  </span>
                  {(anom.affected_records || []).map((rec, i) => (
                    <span
                      key={i}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {rec}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => toggleExpand(anom.anomaly_id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.78rem',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileText size={13} />
                  {isExpanded ? t('common.hideEvidence', 'Hide Evidence') : t('common.viewEvidence', 'View Evidence')}
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Expandable Evidence Inspector */}
              {isExpanded && anom.evidence && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--accent-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Search size={14} /> {t('anomalies.evidence', 'Underlying Evidence Breakdown')}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'var(--text-secondary)',
                      fontFamily: 'Consolas, Monaco, monospace',
                      lineHeight: 1.5,
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '0.75rem',
                      borderRadius: '6px'
                    }}
                  >
                    {JSON.stringify(anom.evidence, null, 2)}
                  </pre>
                  {anom.detected_at && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                      Timestamp: {anom.detected_at}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnomalyDetective;
