import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Printer, ExternalLink, QrCode, AlertTriangle, CheckCircle, FileText, Activity, Scale, Building, MapPin, Eye } from 'lucide-react';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const LandPassport = ({ landId, initialData = null }) => {
  const { t } = useLanguage();
  const [passport, setPassport] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!landId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/lands/${landId}/passport`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load passport');
        return res.json();
      })
      .then((data) => {
        setPassport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [landId]);

  const handleDownload = () => {
    if (!passport) return;
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LandPassport_${passport.land_id || landId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div className="status-badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-color)', display: 'inline-block' }}>
          {t('common.loading', 'Loading Land Passport...')}
        </div>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--danger)' }}>
        <p style={{ color: 'var(--danger)', margin: 0 }}>{t('common.error', 'Unable to generate passport.')}</p>
      </div>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(passport.qr_code_url || `https://demo.landtrace360.com/profile/${passport.land_id}`)}`;

  const renderPassportCard = (isModal = false) => (
    <div
      className="passport-card-print-target"
      style={{
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        borderRadius: '16px',
        padding: isModal ? '2rem' : '1.75rem',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Gold & Blue Accent Ribbons */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: 'linear-gradient(90deg, #3b82f6, #f59e0b, #10b981)',
        }}
      />

      {/* Passport Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(245, 158, 11, 0.2))',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={28} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
                LANDTRACE360 INTELLIGENCE 2.0
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {t('passport.badge', 'DIGITAL PASSPORT')}
              </span>
            </div>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('passport.title', 'Digital Land Passport')}
            </h2>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('passport.generationTimestamp', 'Generated')}:</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
            {passport.passport_generated_at}
          </div>
        </div>
      </div>

      {/* Grid of Passport Fields */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Left Column: Property Identity */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Property Identification
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.landId', 'Land ID')}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{passport.land_id}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.surveyNumber', 'Survey Number')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{passport.survey_number}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.subdivision', 'Subdivision')}</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{passport.subdivision}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.currentOwner', 'Current Owner')}</span>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{passport.current_owner}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.location', 'Location')}</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>
              {passport.location} ({passport.district})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.landType', 'Land Type')}</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{passport.land_type}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.area', 'Area')}</span>
            <span style={{ fontWeight: 600, color: '#38bdf8' }}>
              {Number(passport.area_sqft).toLocaleString()} sq.ft ({passport.area_acres} acres)
            </span>
          </div>
        </div>

        {/* Right Column: Health, Risk & Legal Telemetry */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Verification & Risk Credentials
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.verificationStatus', 'Verification Status')}</span>
            <span
              style={{
                fontWeight: 600,
                color: passport.verification_status === 'Verified' ? '#34d399' : '#f59e0b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <CheckCircle size={14} /> {passport.verification_status}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.currentRiskScore', 'Risk Score')}</span>
            <span
              style={{
                fontWeight: 700,
                color: passport.risk_score < 30 ? '#34d399' : passport.risk_score > 60 ? '#ef4444' : '#f59e0b',
              }}
            >
              {passport.risk_score}/100 ({passport.risk_level})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.landDnaScore', 'Land DNA Score')}</span>
            <span style={{ fontWeight: 700, color: '#60a5fa' }}>{passport.land_dna_score}/100</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.legalStatus', 'Legal Status')}</span>
            <span
              style={{
                fontWeight: 500,
                color: passport.legal_status.toLowerCase().includes('clear') || passport.legal_status.toLowerCase().includes('resolved') ? '#34d399' : '#f87171',
                textAlign: 'right',
                maxWidth: '60%',
              }}
            >
              {passport.legal_status}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.mortgageStatus', 'Mortgage Status')}</span>
            <span
              style={{
                fontWeight: 500,
                color: passport.mortgage_status.toLowerCase().includes('active') ? '#f59e0b' : '#34d399',
                textAlign: 'right',
                maxWidth: '60%',
              }}
            >
              {passport.mortgage_status}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.documentStatus', 'Document Status')}</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{passport.document_status}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('passport.lastUpdated', 'Last Record Update')}</span>
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{passport.last_updated}</span>
          </div>
        </div>
      </div>

      {/* QR Code and Official Stamp Footer */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              background: '#ffffff',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            <img src={qrUrl} alt={`QR for ${passport.land_id}`} style={{ width: '90px', height: '90px', display: 'block' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600 }}>
              <QrCode size={16} /> {t('passport.qrCodeTitle', 'Scan for Public Verification')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', maxWidth: '300px' }}>
              Cryptographically derived demo passport record linking to LandTrace360 public profile: {passport.land_id}
            </div>
          </div>
        </div>

        {/* Synthetic Seal Badge */}
        <div
          style={{
            border: '2px dashed rgba(245, 158, 11, 0.4)',
            borderRadius: '50%',
            width: '100px',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            textAlign: 'center',
            color: '#f59e0b',
            transform: 'rotate(-8deg)',
          }}
        >
          <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.05em' }}>LANDTRACE360</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>DEMO</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 600 }}>SYNTHETIC</span>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '0.75rem 1rem',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: '#fef3c7', fontWeight: 500, lineHeight: 1.4 }}>
          {passport.disclaimer || t('passport.disclaimer', 'Demo / Synthetic Project Data — Not an Official Government Land Record')}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Action Buttons Bar */}
      <div
        className="passport-actions-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="#38bdf8" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('passport.title', 'Digital Land Passport')} — {passport.land_id}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Eye size={16} /> {t('passport.viewAction', 'View Land Passport')}
          </button>

          <button
            onClick={handleDownload}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Download size={16} /> {t('passport.downloadAction', 'Download Land Passport')}
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Printer size={16} /> {t('passport.printAction', 'Print Land Passport')}
          </button>
        </div>
      </div>

      {/* Main Passport Card */}
      {renderPassportCard(false)}

      {/* Full View Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{ maxWidth: '850px', width: '100%', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '0.4rem 0.8rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ✕ {t('common.close', 'Close')}
              </button>
            </div>
            {renderPassportCard(true)}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandPassport;
