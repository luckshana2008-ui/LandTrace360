import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import LandPassport from '../components/LandPassport';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const DEMO_LAND_IDS = [
  'LND-1001', 'LND-1002', 'LND-1003', 'LND-1004',
  'LND-1005', 'LND-1006', 'LND-1007', 'LND-1008'
];

const LandPassportPage = () => {
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

  const availableIds = lands.length > 0 ? lands.map((l) => l.id) : DEMO_LAND_IDS;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
              {t('nav.landIntelligence', 'LAND INTELLIGENCE 2.0')}
            </span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {t('passport.title', 'Digital Land Passport')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('passport.subtitle', 'Unified digital property credential derived dynamically from project records')}
          </p>
        </div>

        <Link
          to={`/land/${selectedLandId}`}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#60a5fa',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          View Full Profile <ExternalLink size={14} />
        </Link>
      </div>

      {/* Land Selector Selector Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {t('common.selectLand', 'Select Land Record')}:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {availableIds.map((lid) => {
            const isSelected = lid === selectedLandId;
            return (
              <button
                key={lid}
                onClick={() => handleSelect(lid)}
                style={{
                  background: isSelected ? 'var(--accent-color, #3b82f6)' : 'rgba(255, 255, 255, 0.05)',
                  border: isSelected ? '1px solid #60a5fa' : '1px solid var(--border-color)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {lid}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Passport Component */}
      <LandPassport landId={selectedLandId} />
    </div>
  );
};

export default LandPassportPage;
