import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, Scale, Users, FileText, Landmark,
  Target, TreePine, MapPin, History, ChevronDown, ChevronUp,
  Activity, AlertTriangle, Sparkles, CheckCircle2
} from 'lucide-react';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const RiskBreakdown = ({ landId, initialData = null }) => {
  const { t } = useLanguage();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [expandedEvidence, setExpandedEvidence] = useState({});

  useEffect(() => {
    if (!landId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/lands/${landId}/risk-breakdown`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load risk breakdown');
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

  const toggleEvidence = (dimName) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [dimName]: !prev[dimName]
    }));
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div className="status-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
          <Sparkles size={16} />
          {t('common.loading', 'Evaluating 8 risk dimensions...')}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error || t('common.error', 'Failed to load risk breakdown')}</p>
      </div>
    );
  }

  const {
    overall_score = 15,
    overall_level = 'LOW',
    dimensions = [],
    disclaimer = '',
    analyzed_at = ''
  } = data;

  const getDimensionIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('legal')) return Scale;
    if (n.includes('ownership')) return Users;
    if (n.includes('document')) return FileText;
    if (n.includes('mortgage')) return Landmark;
    if (n.includes('boundary')) return Target;
    if (n.includes('environmental')) return TreePine;
    if (n.includes('location')) return MapPin;
    if (n.includes('transaction')) return History;
    return Activity;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'HIGH':
        return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)' };
      case 'MEDIUM':
        return { text: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.4)' };
      case 'LOW':
      default:
        return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)' };
    }
  };

  const getProgressBarColor = (score) => {
    if (score > 60) return '#ef4444';
    if (score >= 30) return '#eab308';
    return '#10b981';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Header Gauge Banner ── */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: overall_level === 'HIGH' ? '1px solid rgba(239, 68, 68, 0.4)' : overall_level === 'MEDIUM' ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
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
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Activity size={13} />
                {t('riskBreakdown.badge', '8-DIMENSION AUDIT')}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {landId}
              </span>
            </div>
            <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('riskBreakdown.title', 'Advanced Multi-Dimensional Risk Breakdown')}
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '780px' }}>
              {t('riskBreakdown.subtitle', '8 independent audit dimensions scored transparently from stored parcel evidence')}
            </p>
          </div>

          {/* Overall Score Badge */}
          <div
            style={{
              padding: '1rem 1.75rem',
              borderRadius: '14px',
              background: getLevelColor(overall_level).bg,
              border: `1px solid ${getLevelColor(overall_level).border}`,
              textAlign: 'center',
              minWidth: '150px'
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: getLevelColor(overall_level).text, letterSpacing: '0.05em' }}>
              {t('riskBreakdown.overallRating', 'Overall Assessment')}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getLevelColor(overall_level).text, lineHeight: 1.1 }}>
              {overall_score}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {overall_level} RISK
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          ℹ️ {disclaimer || t('riskBreakdown.disclaimer', 'Demo / Synthetic Project Data — Not an Official Government Land Record')}
        </div>
      </div>

      {/* ── 8 Dimensions Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {dimensions.map((dim) => {
          const IconComp = getDimensionIcon(dim.dimension);
          const lvlColor = getLevelColor(dim.risk_level);
          const isExp = !!expandedEvidence[dim.dimension];

          return (
            <div
              key={dim.dimension}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'rgba(15, 23, 42, 0.65)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                {/* Dimension Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '0.4rem', borderRadius: '8px', color: 'var(--accent-color)' }}>
                      <IconComp size={18} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {dim.dimension}
                    </h3>
                  </div>

                  <span
                    style={{
                      background: lvlColor.bg,
                      color: lvlColor.text,
                      border: `1px solid ${lvlColor.border}`,
                      borderRadius: '6px',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em'
                    }}
                  >
                    {dim.risk_level}
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                    <span>{t('riskBreakdown.score', 'Score')}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{dim.score} / 100</strong>
                  </div>
                  <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, dim.score))}%`,
                        background: getProgressBarColor(dim.score),
                        borderRadius: '4px',
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Key Contribution */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderLeft: `3px solid ${lvlColor.text}`,
                    borderRadius: '0 6px 6px 0',
                    padding: '0.5rem 0.75rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: lvlColor.text }}>
                    {t('riskBreakdown.contribution', 'Key Factor')}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {dim.contribution}
                  </div>
                </div>

                {/* Explanation */}
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {dim.explanation}
                </p>
              </div>

              {/* Evidence Inspector Toggle */}
              <div>
                <button
                  onClick={() => toggleEvidence(dim.dimension)}
                  style={{
                    width: '100%',
                    background: isExp ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.45rem',
                    fontSize: '0.75rem',
                    color: 'var(--accent-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isExp ? t('riskBreakdown.hideEvidence', 'Hide Factor Evidence') : t('riskBreakdown.showEvidence', 'Show Factor Evidence')}
                  {isExp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {/* Expandable Evidence */}
                {isExp && dim.evidence && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.75rem'
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: 'var(--text-secondary)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        lineHeight: 1.4,
                        fontSize: '0.72rem'
                      }}
                    >
                      {JSON.stringify(dim.evidence, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskBreakdown;
