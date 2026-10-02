import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Sparkles, ShieldCheck, Database, Layers } from 'lucide-react';
import LandTraceAI from '../components/LandTraceAI';
import { useLanguage } from '../i18n/LanguageContext';

const LandTraceAIPage = () => {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const initialLandId = searchParams.get('id') || searchParams.get('land_id') || null;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
                        {t('nav.landIntelligence', 'LAND INTELLIGENCE 2.0')}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>•</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#34d399' }}>
                        PHASE 2.6
                    </span>
                </div>
                <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Bot size={30} color="#38bdf8" />
                    {t('chatbot.title', 'LandTrace AI')}
                </h1>
                <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
                    {t('chatbot.subtitle', 'Evidence-Based Intelligent Land Assistant')} — Natural language inquiries grounded strictly in verified LandTrace360 project records with complete anti-hallucination protection.
                </p>
            </div>

            {/* Feature Highlights Pills */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.85rem'
            }}>
                <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                }}>
                    <ShieldCheck size={20} color="#38bdf8" />
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Zero Hallucination</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Answers only from verified records</div>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                }}>
                    <Layers size={20} color="#34d399" />
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Supporting Evidence</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Traceable record IDs & dockets</div>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(192, 132, 252, 0.2)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                }}>
                    <Sparkles size={20} color="#c084fc" />
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>25+ Core Intents</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Ownership, risk, legal, mortgage & more</div>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                }}>
                    <Database size={20} color="#f59e0b" />
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Global & Land Modes</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Query all lands or parcel context</div>
                    </div>
                </div>
            </div>

            {/* Embedded LandTrace AI Component */}
            <LandTraceAI initialLandId={initialLandId} height="740px" />
        </div>
    );
};

export default LandTraceAIPage;
