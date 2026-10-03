import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import AnomalyDetective from '../components/AnomalyDetective';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const DEMO_LAND_IDS = [
  'LND-1001', 'LND-1002', 'LND-1003', 'LND-1004',
  'LND-1005', 'LND-1006', 'LND-1007', 'LND-1008'
];

const AnomalyDetectivePage = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedParam = searchParams.get('id') || 'LND-1004'; // Default to LND-1004 which has rich anomalies
  const [selectedLandId, setSelectedLandId] = useState(selectedParam);
  const [lands, setLands] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/lands`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLands(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelect = (id) => {
    setSelectedLandId(id);
    setSearchParams({ id });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f87171' }}>
              {t('nav.landIntelligence', 'LAND INTELLIGENCE 2.0')}
            </span>
          </div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={28} color="#ef4444" />
            {t('anomalies.title', 'Land Anomaly Detective')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('anomalies.subtitle', 'Transparent rule-based detection analyzing stored project records across 10 critical risk dimensions')}
          </p>
        </div>

        <Link
          to={`/land/${selectedLandId}`}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.1rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.85rem'
          }}
        >
          {t('common.view', 'View Full Land Profile')} ({selectedLandId})
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Parcel Selector Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('anomalies.selectParcel', 'Select Parcel to Audit')}:
          </label>
          <select
            value={selectedLandId}
            onChange={(e) => handleSelect(e.target.value)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {(lands.length > 0 ? lands : DEMO_LAND_IDS.map((lid) => ({ id: lid }))).map((landObj) => {
              const lid = landObj.id;
              const label = landObj.location ? `${lid} — ${landObj.location} (${landObj.owner})` : lid;
              return (
                <option key={lid} value={lid} style={{ background: '#1e293b', color: '#ffffff' }}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Quick Parcel Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {DEMO_LAND_IDS.map((lid) => (
            <button
              key={lid}
              onClick={() => handleSelect(lid)}
              style={{
                background: selectedLandId === lid ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedLandId === lid ? '#ffffff' : 'var(--text-secondary)',
                border: selectedLandId === lid ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.25rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {lid}
            </button>
          ))}
        </div>
      </div>

      {/* Main Anomaly Detective Component */}
      <AnomalyDetective landId={selectedLandId} />
    </div>
  );
};

export default AnomalyDetectivePage;
