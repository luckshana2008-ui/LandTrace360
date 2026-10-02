import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Activity, ExternalLink, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import RiskBreakdown from '../components/RiskBreakdown';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const DEMO_LAND_IDS = [
  'LND-1001', 'LND-1002', 'LND-1003', 'LND-1004',
  'LND-1005', 'LND-1006', 'LND-1007', 'LND-1008'
];

const RiskBreakdownPage = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedParam = searchParams.get('id') || 'LND-1001';
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

  const currentLand = lands.find((l) => l.id === selectedLandId);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
              {t('nav.landIntelligence', 'LAND INTELLIGENCE')}
            </span>
          </div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={28} color="#38bdf8" />
            {t('nav.riskBreakdown', 'Risk Breakdown')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('riskBreakdownPage.subtitle', 'Comprehensive 8-dimension risk evaluation with empirical evidence indicators')}
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
            {t('evidenceExplorer.selectParcel', 'Select Land Parcel')}:
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
            {lands.length > 0 ? (
              lands.map((l) => (
                <option key={l.id} value={l.id} style={{ background: '#0f172a', color: '#fff' }}>
                  {l.id} — {l.location} ({l.land_type}) — Risk: {l.risk_score}/100
                </option>
              ))
            ) : (
              DEMO_LAND_IDS.map((id) => (
                <option key={id} value={id} style={{ background: '#0f172a', color: '#fff' }}>
                  {id}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Quick Demo Land Chips */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
            Quick:
          </span>
          {DEMO_LAND_IDS.map((id) => {
            const isSelected = selectedLandId === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Parcel Summary Ribbon */}
      {currentLand && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '0.85rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Survey No: </span>
              <strong>{currentLand.survey_number}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Location: </span>
              <strong>{currentLand.location}, {currentLand.district}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Owner: </span>
              <strong>{currentLand.owner}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Area: </span>
              <strong>{currentLand.area_sq_ft?.toLocaleString()} sq ft</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Overall Risk:</span>
            <span
              style={{
                fontWeight: 700,
                color: currentLand.risk_score < 30 ? '#10b981' : currentLand.risk_score < 60 ? '#eab308' : '#ef4444',
                background: currentLand.risk_score < 30 ? 'rgba(16, 185, 129, 0.1)' : currentLand.risk_score < 60 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                border: `1px solid ${currentLand.risk_score < 30 ? '#10b981' : currentLand.risk_score < 60 ? '#eab308' : '#ef4444'}`
              }}
            >
              {currentLand.risk_score}/100 ({currentLand.risk_score < 30 ? 'LOW' : currentLand.risk_score < 60 ? 'MEDIUM' : 'HIGH'})
            </span>
          </div>
        </div>
      )}

      {/* Embedded Component */}
      <RiskBreakdown landId={selectedLandId} />
    </div>
  );
};

export default RiskBreakdownPage;
