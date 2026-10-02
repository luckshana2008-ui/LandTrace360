import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, AlertTriangle, AlertCircle, ShieldCheck, Info,
  Filter, Check, CheckCheck, ChevronDown, ChevronUp,
  FileText, ExternalLink, Sparkles, Clock, Layers
} from 'lucide-react';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const ALERT_CATEGORIES = [
  'All',
  'Risk change',
  'Ownership event',
  'Legal event',
  'Mortgage event',
  'Document event',
  'Boundary event',
  'Verification event',
  'Anomaly detected'
];

const Alerts = () => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState({});

  const fetchAlerts = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/alerts`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load intelligent alerts');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setAlerts(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const toggleReadStatus = async (alertId, currentStatus) => {
    // Optimistic UI update
    setAlerts((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, read_status: !currentStatus } : a))
    );

    if (!currentStatus) {
      try {
        await fetch(`${API_BASE}/api/alerts/${encodeURIComponent(alertId)}/read`, {
          method: 'POST'
        });
      } catch (e) {
        console.error('Failed to persist read status:', e);
      }
    }
  };

  const toggleEvidence = (alertId) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [alertId]: !prev[alertId]
    }));
  };

  const markAllAsRead = async () => {
    const unreadAlerts = alerts.filter((a) => !a.read_status);
    setAlerts((prev) => prev.map((a) => ({ ...a, read_status: true })));

    for (const a of unreadAlerts) {
      try {
        await fetch(`${API_BASE}/api/alerts/${encodeURIComponent(a.alert_id)}/read`, {
          method: 'POST'
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.45)',
          color: '#ef4444',
          glow: '0 0 16px rgba(239, 68, 68, 0.2)',
          icon: AlertCircle
        };
      case 'HIGH':
        return {
          bg: 'rgba(249, 115, 22, 0.12)',
          border: 'rgba(249, 115, 22, 0.45)',
          color: '#f97316',
          glow: '0 0 12px rgba(249, 115, 22, 0.15)',
          icon: AlertTriangle
        };
      case 'MEDIUM':
        return {
          bg: 'rgba(234, 179, 8, 0.12)',
          border: 'rgba(234, 179, 8, 0.45)',
          color: '#eab308',
          glow: '0 0 10px rgba(234, 179, 8, 0.12)',
          icon: Info
        };
      case 'LOW':
      default:
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.35)',
          color: '#38bdf8',
          glow: '0 0 8px rgba(56, 189, 248, 0.1)',
          icon: ShieldCheck
        };
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (unreadOnly && a.read_status) return false;
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read_status).length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f59e0b' }}>
              {t('nav.landIntelligence', 'LAND INTELLIGENCE 2.0')}
            </span>
          </div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={28} color="#f59e0b" />
            {t('alertsPage.title', 'Intelligent Land Alerts')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('alertsPage.subtitle', 'Generated dynamically from stored project records and calculated anomalies')}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1rem',
              fontSize: '0.85rem'
            }}
          >
            <CheckCheck size={16} />
            {t('alertsPage.markAllRead', 'Mark All Read')} ({unreadCount})
          </button>
        )}
      </div>

      {/* ── Status Metrics Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <div className="glass-panel" style={{ padding: '0.85rem 1.1rem', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Alerts</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{alerts.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem 1.1rem', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.72rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>Unread</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{unreadCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem 1.1rem', borderRadius: '10px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.72rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>Critical</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>{criticalCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem 1.1rem', borderRadius: '10px', borderLeft: '4px solid #f97316' }}>
          <span style={{ fontSize: '0.72rem', color: '#fb923c', textTransform: 'uppercase', fontWeight: 600 }}>High</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f97316' }}>{highCount}</div>
        </div>
      </div>

      {/* ── Filter Controls ── */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Layers size={13} /> Category:
          </span>
          {ALERT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                background: categoryFilter === cat ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                color: categoryFilter === cat ? '#ffffff' : 'var(--text-secondary)',
                border: categoryFilter === cat ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Severity & Unread Toggles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={13} /> Severity:
            </span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: severityFilter === sev ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: severityFilter === sev ? '1px solid var(--accent-color)' : '1px solid transparent',
                  borderRadius: '4px',
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--accent-color)' }}
            />
            {t('alertsPage.unreadOnly', 'Unread alerts only')} ({unreadCount})
          </label>
        </div>
      </div>

      {/* ── Alerts Feed ── */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} />
            Loading project alerts...
          </div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CheckCheck size={40} color="var(--success)" style={{ marginBottom: '0.75rem' }} />
          <h3>{t('alertsPage.noAlerts', 'No alerts matching current filters.')}</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAlerts.map((alert) => {
            const sevStyle = getSeverityStyle(alert.severity);
            const IconComp = sevStyle.icon;
            const isExpanded = !!expandedEvidence[alert.alert_id];

            return (
              <div
                key={alert.alert_id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '12px',
                  borderLeft: `4px solid ${sevStyle.color}`,
                  borderTop: `1px solid ${sevStyle.border}`,
                  borderRight: `1px solid ${sevStyle.border}`,
                  borderBottom: `1px solid ${sevStyle.border}`,
                  background: alert.read_status ? 'rgba(15, 23, 42, 0.5)' : 'rgba(15, 23, 42, 0.85)',
                  boxShadow: alert.read_status ? 'none' : sevStyle.glow,
                  transition: 'all 0.2s ease',
                  opacity: alert.read_status ? 0.78 : 1
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: sevStyle.bg,
                        color: sevStyle.color,
                        border: `1px solid ${sevStyle.border}`,
                        borderRadius: '4px',
                        padding: '0.15rem 0.55rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <IconComp size={11} />
                      {alert.severity}
                    </span>

                    <span
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        borderRadius: '4px',
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 600
                      }}
                    >
                      {alert.category}
                    </span>

                    <Link
                      to={`/land/${alert.land_id}`}
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        borderRadius: '4px',
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {alert.land_id}
                      <ExternalLink size={10} />
                    </Link>

                    {!alert.read_status && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#f59e0b',
                          display: 'inline-block'
                        }}
                        title="Unread alert"
                      />
                    )}
                  </div>

                  {/* Actions & Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> {alert.timestamp}
                    </span>

                    <button
                      onClick={() => toggleReadStatus(alert.alert_id, alert.read_status)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.72rem',
                        color: alert.read_status ? 'var(--text-secondary)' : 'var(--accent-color)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Check size={11} />
                      {alert.read_status ? t('alertsPage.markUnread', 'Mark Unread') : t('alertsPage.markRead', 'Mark Read')}
                    </button>
                  </div>
                </div>

                {/* Title & Message */}
                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {alert.title}
                </h3>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {alert.message}
                </p>

                {/* Bottom Row: Evidence toggle & Navigation links */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/evidence?id=${alert.land_id}`}
                      style={{
                        fontSize: '0.75rem',
                        color: '#c084fc',
                        textDecoration: 'none',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      🔍 {t('nav.evidenceExplorer', 'Evidence Explorer')} →
                    </Link>
                    <Link
                      to={`/anomalies?id=${alert.land_id}`}
                      style={{
                        fontSize: '0.75rem',
                        color: '#f87171',
                        textDecoration: 'none',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      ⚡ {t('nav.anomalyDetective', 'Anomaly Detective')} →
                    </Link>
                  </div>

                  {alert.related_evidence && (
                    <button
                      onClick={() => toggleEvidence(alert.alert_id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-color)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <FileText size={12} />
                      {isExpanded ? t('common.hideEvidence', 'Hide Evidence') : t('common.viewEvidence', 'View Evidence')}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>

                {/* Evidence Drawer */}
                {isExpanded && alert.related_evidence && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.35)',
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
                      {JSON.stringify(alert.related_evidence, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
