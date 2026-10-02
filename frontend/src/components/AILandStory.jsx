import React, { useState } from 'react';
import { Sparkles, FileText, ChevronDown, ChevronUp, AlertCircle, Database, CheckCircle2, History, Scale, Landmark, ShieldAlert, ArrowDown } from 'lucide-react';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const STAGE_ICONS = {
  origin: History,
  ownership: FileText,
  subdivision: Sparkles,
  documents: FileText,
  legal: Scale,
  mortgages: Landmark,
  boundary: ShieldAlert,
  current_status: CheckCircle2,
};

const AILandStory = ({ landId }) => {
  const { language, t } = useLanguage();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openEvidenceMap, setOpenEvidenceMap] = useState({});

  const handleGenerateStory = () => {
    if (!landId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/lands/${landId}/story?lang=${language}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to generate AI land story');
        return res.json();
      })
      .then((data) => {
        setStory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  const toggleEvidence = (step) => {
    setOpenEvidenceMap((prev) => ({
      ...prev,
      [step]: !prev[step],
    }));
  };

  const renderEvidenceContent = (evidence) => {
    if (!evidence) {
      return <span style={{ color: 'var(--text-secondary)' }}>{t('story.noRecordsForMilestone', 'No record available.')}</span>;
    }
    if (Array.isArray(evidence)) {
      if (evidence.length === 0) {
        return <span style={{ color: 'var(--text-secondary)' }}>{t('story.noRecordsForMilestone', 'No record available.')}</span>;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
          {evidence.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: '#93c5fd',
              }}
            >
              {typeof item === 'object' ? JSON.stringify(item, null, 1).replace(/[{}"]/g, '') : String(item)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0.6rem 0.85rem',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          color: '#93c5fd',
          whiteSpace: 'pre-wrap',
          marginTop: '0.5rem',
        }}
      >
        {JSON.stringify(evidence, null, 2)}
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(59, 130, 246, 0.25))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={24} color="#c084fc" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c084fc' }}>
                {t('story.badge', 'CHRONOLOGICAL NARRATIVE')}
              </span>
            </div>
            <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('story.title', 'AI Land Story')} — {landId}
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t('story.subtitle', 'Chronological explanation generated from stored ownership, legal, mortgage, and survey records')}
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateStory}
          disabled={loading}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <Sparkles size={18} />
          {loading ? t('story.generating', 'Synthesizing Land History...') : t('story.generateButton', 'Generate Story')}
        </button>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <AlertCircle size={18} color="#60a5fa" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.825rem', color: '#bfdbfe', fontWeight: 500, lineHeight: 1.4 }}>
          {t('story.aiDisclaimer', 'AI-generated summary based on available project records. Demo / Synthetic Project Data — Not an Official Government Land Record.')}
        </span>
      </div>

      {/* Initial Empty State */}
      {!story && !loading && !error && (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.015)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          }}
        >
          <Sparkles size={36} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
            Chronological Property Narrative
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Click "Generate Story" to synthesize origin, subdivisions, conveyances, encumbrances, and boundary telemetry into a verified chronological report.
          </p>
          <button
            onClick={handleGenerateStory}
            className="btn-primary"
            style={{
              padding: '0.6rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              borderRadius: '8px',
            }}
          >
            <Sparkles size={16} /> {t('story.generateButton', 'Generate Story')}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div className="status-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
            <Sparkles size={16} className="animate-spin" />
            {t('story.generating', 'Scanning all historical records and synthesizing chronological story...')}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {/* Story Timeline */}
      {story && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {story.chapters?.map((chapter, idx) => {
            const isLast = idx === story.chapters.length - 1;
            const Icon = STAGE_ICONS[chapter.key] || History;
            const isEvidenceOpen = !!openEvidenceMap[chapter.step];

            return (
              <div key={chapter.step} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                {/* Timeline Axis Line & Milestone Icon */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '42px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(168, 85, 247, 0.3))',
                      border: '2px solid #60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
                      zIndex: 2,
                    }}
                  >
                    <Icon size={18} color="#93c5fd" />
                  </div>
                  {!isLast && (
                    <div
                      style={{
                        width: '2px',
                        flex: 1,
                        background: 'linear-gradient(180deg, #3b82f6, rgba(255, 255, 255, 0.1))',
                        minHeight: '40px',
                        margin: '0.35rem 0',
                      }}
                    />
                  )}
                </div>

                {/* Milestone Content Box */}
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: isLast ? '0' : '1.25rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        STEP {chapter.step}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {chapter.stage_localized || chapter.stage}
                      </h4>
                    </div>

                    {/* Evidence Button */}
                    <button
                      onClick={() => toggleEvidence(chapter.step)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: isEvidenceOpen ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        padding: '0.3rem 0.65rem',
                        color: isEvidenceOpen ? '#93c5fd' : 'var(--text-secondary)',
                        fontSize: '0.785rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Database size={13} />
                      {isEvidenceOpen ? t('common.hideEvidence', 'Hide Evidence') : t('common.evidence', 'Evidence')}
                      {isEvidenceOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {/* Narrative text */}
                  <p style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0', fontSize: '0.925rem', lineHeight: '1.6' }}>
                    {chapter.summary}
                  </p>

                  {/* Expandable Evidence Drawer */}
                  {isEvidenceOpen && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.85rem 1rem',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        animation: 'fadeIn 0.2s ease-in-out',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        <Database size={14} />
                        {t('story.evidenceTitle', 'Underlying Record Evidence')}:
                      </div>
                      {renderEvidenceContent(chapter.evidence)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AILandStory;
