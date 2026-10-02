import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bot, Send, User, AlertCircle, Database, ChevronDown,
    ChevronUp, Sparkles, HelpCircle, RotateCcw, MapPin,
    Shield, Scale, FileText, CheckCircle, ExternalLink,
    Layers, AlertTriangle, ShieldCheck
} from 'lucide-react';
import API_BASE from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';

const DEMO_LAND_OPTIONS = [
    { id: 'GLOBAL', label: 'All Lands (Global Explorer Mode)' },
    { id: 'LND-1001', label: 'LND-1001 — TechSpace Inc. (Commercial • Risk: 15)' },
    { id: 'LND-1002', label: 'LND-1002 — Ramesh Kumar (Agricultural • Risk: 45)' },
    { id: 'LND-1003', label: 'LND-1003 — Sarah Smith (Residential • Risk: 5)' },
    { id: 'LND-1004', label: 'LND-1004 — HeavyCorp Ltd. (Industrial • High Risk: 85)' },
    { id: 'LND-1005', label: 'LND-1005 — Amit Patel (Residential • Risk: 10)' },
    { id: 'LND-1006', label: 'LND-1006 — Riverfront Devs (Commercial • Risk: 35)' },
    { id: 'LND-1007', label: 'LND-1007 — Kavita Sharma (Residential • Risk: 55)' },
    { id: 'LND-1008', label: 'LND-1008 — Global Logistics (Commercial • Risk: 20)' }
];

const LandTraceAI = ({ initialLandId = null, compact = false, height = '720px' }) => {
    const { language, t } = useLanguage();
    const { token, user } = useAuth();
    const navigate = useNavigate();

    // Active Land context (Mode A: null/GLOBAL, Mode B: LND-100X)
    const [selectedLandId, setSelectedLandId] = useState(
        initialLandId && initialLandId !== 'GLOBAL' ? initialLandId.toUpperCase() : null
    );

    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openEvidenceMap, setOpenEvidenceMap] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);

    const messagesEndRef = useRef(null);

    // Sync initialLandId prop if changed from parent
    useEffect(() => {
        if (initialLandId && initialLandId !== 'GLOBAL') {
            setSelectedLandId(initialLandId.toUpperCase());
        }
    }, [initialLandId]);

    // Initial contextual welcome greeting
    useEffect(() => {
        const welcomeText = selectedLandId
            ? language === 'ta'
                ? `வணக்கம்! நான் உங்கள் LandTrace AI உதவியாளர். நீங்கள் தற்போது ${selectedLandId} நிலத்தைப் பார்க்கிறீர்கள். இதன் உரிமையாளர், ஆவணங்கள், சட்ட வழக்குகள், அடமானம், இடர் மதிப்பீடு அல்லது சான்றுகள் குறித்து என்னிடம் கேளுங்கள்.`
                : language === 'hi'
                    ? `नमस्ते! मैं आपका LandTrace AI सहायक हूँ। आप वर्तमान में ${selectedLandId} देख रहे हैं। आप मुझसे इसके स्वामित्व, दस्तावेज़, कानूनी मामलों, बंधक, जोखिम या साक्ष्य के बारे में पूछ सकते हैं।`
                    : `Hello! I am LandTrace AI. You're viewing ${selectedLandId}. Ask me about its ownership, history, documents, legal records, mortgage, risk factors, anomalies, or evidence.`
            : language === 'ta'
                ? `வணக்கம்! நான் உங்கள் LandTrace AI உதவியாளர். லேண்ட் ட்ரேஸ்360 திட்டத்தில் உள்ள நிலங்களின் பதிவுகள், உரிமையாளர், சட்ட வழக்குகள், அடமானம், விற்பனை நிலவரம் மற்றும் இடர் காரணிகள் குறித்து என்னிடம் கேளுங்கள்.`
                : language === 'hi'
                    ? `नमस्ते! मैं आपका LandTrace AI सहायक हूँ। मैं LandTrace360 परियोजना में संग्रहीत भूमि रिकॉर्ड, स्वामित्व, कानूनी मामले, बंधक, बिक्री स्थिति और जोखिम कारकों को समझने में आपकी सहायता कर सकता हूँ।`
                    : `Hello! I am LandTrace AI. I can help you understand any land parcel in LandTrace360 — including ownership, title history, documents, legal dockets, mortgages, risk scores, anomalies, and evidence.`;

        setMessages([
            {
                sender: 'ai',
                text: welcomeText,
                answer: welcomeText,
                why: t('chatbot.disclaimer', 'LandTrace AI answers are generated from records available in this project and do not constitute official government land records or legal advice.'),
                evidence: [],
                sources: ['LandTrace AI Knowledge Engine'],
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
        fetchSuggestions(selectedLandId);
    }, [selectedLandId, language]);

    // Fetch dynamic question suggestions
    const fetchSuggestions = (landId) => {
        const url = landId && landId !== 'GLOBAL'
            ? `${API_BASE}/api/chat/suggestions?land_id=${encodeURIComponent(landId)}`
            : `${API_BASE}/api/chat/suggestions`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.suggestions && Array.isArray(data.suggestions)) {
                    setSuggestions(data.suggestions);
                }
            })
            .catch(() => {
                // Fallback static suggestions
                setSuggestions(
                    landId
                        ? [
                            `Who owns ${landId}?`,
                            `Why is ${landId} high risk?`,
                            `Does ${landId} have a mortgage?`,
                            `What legal cases are associated with ${landId}?`,
                            `What documents are available for ${landId}?`,
                            `Show evidence for the risk`,
                            `Give me a complete summary of ${landId}`
                        ]
                        : [
                            'What lands are currently for sale?',
                            'Which lands have high risk scores?',
                            'Who owns LND-1001?',
                            'Why is LND-1004 high risk?',
                            'Does LND-1006 have a mortgage?',
                            'What happened to LND-1001 over time?'
                        ]
                );
            });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const toggleEvidence = (msgIndex) => {
        setOpenEvidenceMap(prev => ({
            ...prev,
            [msgIndex]: !prev[msgIndex]
        }));
    };

    const handleClearChat = () => {
        setMessages([]);
        setOpenEvidenceMap({});
        setErrorMsg(null);
    };

    const handleLandChange = (newLandId) => {
        if (newLandId === 'GLOBAL') {
            setSelectedLandId(null);
        } else {
            setSelectedLandId(newLandId);
        }
    };

    const handleSend = (textInput) => {
        const textToUse = typeof textInput === 'string' ? textInput : query;
        if (!textToUse || !textToUse.trim()) return;

        const userMsg = {
            sender: 'user',
            text: textToUse.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);
        setErrorMsg(null);

        const currentToken = token || localStorage.getItem('landtrace_auth_token') || sessionStorage.getItem('landtrace_auth_token');

        fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {})
            },
            body: JSON.stringify({
                message: userMsg.text,
                land_id: selectedLandId || null,
                language: language
            })
        })
            .then(async (res) => {
                if (res.status === 401) {
                    throw new Error('Authentication required. Please sign in to use LandTrace AI.');
                }
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || 'Service temporarily unavailable. Please try again.');
                }
                return res.json();
            })
            .then(data => {
                const aiMsg = {
                    sender: 'ai',
                    text: data.answer || '',
                    answer: data.answer,
                    why: data.why || null,
                    evidence: data.evidence || [],
                    sources: data.sources || [],
                    land_id: data.land_id,
                    intent: data.intent,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };

                // Automatically update context if AI recognized a specific land in the user query
                if (data.land_id && data.land_id !== selectedLandId) {
                    setSelectedLandId(data.land_id);
                }

                if (data.suggested_questions && data.suggested_questions.length > 0) {
                    setSuggestions(data.suggested_questions);
                }

                setMessages(prev => [...prev, aiMsg]);
                setLoading(false);
            })
            .catch(err => {
                setLoading(false);
                setErrorMsg(err.message);
                setMessages(prev => [
                    ...prev,
                    {
                        sender: 'ai',
                        text: `⚠️ ${err.message}`,
                        answer: err.message,
                        why: 'LandTrace AI requires an authenticated session to query project records.',
                        evidence: [],
                        sources: [],
                        isError: true,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
            });
    };

    const renderEvidenceCard = (ev, i) => {
        const recType = ev.record_type || ev.category || 'Record';
        const recId = ev.record_id || 'REF';
        const field = ev.field || ev.relevant_field || 'Detail';
        const val = ev.value !== undefined ? String(ev.value) : '';
        const dt = ev.date || null;

        return (
            <div
                key={i}
                style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px'
                    }}>
                        {recType}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 600 }}>
                        {recId}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', fontSize: '0.825rem' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{field}:</span>
                    <span style={{ color: '#67e8f9', fontWeight: 600, textAlign: 'right', fontFamily: 'monospace' }}>
                        {val}
                    </span>
                </div>
                {dt && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'right' }}>
                        Recorded: {dt}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="glass-panel"
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: height,
                padding: 0,
                overflow: 'hidden',
                borderRadius: '16px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(16px)'
            }}
        >
            {/* Header / Land Context Switcher */}
            <div style={{
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
                    }}>
                        <Bot color="#ffffff" size={22} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {t('chatbot.title', 'LandTrace AI')}
                            </h3>
                            <span className="status-badge" style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                fontSize: '0.7rem',
                                border: '1px solid rgba(56, 189, 248, 0.3)'
                            }}>
                                <Sparkles size={11} style={{ marginRight: '3px' }} />
                                {t('chatbot.activeBadge', 'EVIDENCE-GROUNDED AI')}
                            </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {t('chatbot.subtitle', 'Evidence-Based Intelligent Land Assistant')}
                        </span>
                    </div>
                </div>

                {/* Active Context Selector & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} color="#38bdf8" />
                        <select
                            value={selectedLandId || 'GLOBAL'}
                            onChange={(e) => handleLandChange(e.target.value)}
                            style={{
                                background: 'rgba(15, 23, 42, 0.85)',
                                color: '#f1f5f9',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                borderRadius: '8px',
                                padding: '0.4rem 0.65rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                            title="Active Land Context"
                        >
                            {DEMO_LAND_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id} style={{ background: '#0f172a', color: '#f1f5f9' }}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedLandId && (
                        <button
                            onClick={() => setSelectedLandId(null)}
                            title={t('chatbot.clearContext', 'Clear Context to Global Mode')}
                            style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#f87171',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {t('chatbot.clearContext', 'Global Mode')}
                        </button>
                    )}

                    <button
                        onClick={handleClearChat}
                        title={t('chatbot.clearChat', 'Clear Conversation')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '0.4rem 0.6rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem'
                        }}
                    >
                        <RotateCcw size={13} />
                        <span>{t('chatbot.clearChat', 'Clear')}</span>
                    </button>
                </div>
            </div>

            {/* Active Land Context Bar */}
            <div style={{
                padding: '0.45rem 1.25rem',
                background: selectedLandId ? 'rgba(56, 189, 248, 0.08)' : 'rgba(168, 85, 247, 0.08)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.785rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {t('chatbot.currentLand', 'Active Land Context')}:
                    </span>
                    <strong style={{
                        color: selectedLandId ? '#38bdf8' : '#c084fc',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem'
                    }}>
                        {selectedLandId ? `Current land: ${selectedLandId}` : t('chatbot.globalMode', 'Global Explorer Mode (All Lands)')}
                    </strong>
                </div>
                {selectedLandId && (
                    <button
                        onClick={() => navigate(`/land/${selectedLandId}`)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            textDecoration: 'underline'
                        }}
                    >
                        <span>View {selectedLandId} Profile</span>
                        <ExternalLink size={12} />
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
            }}>
                {messages.map((msg, idx) => {
                    const isAi = msg.sender === 'ai';
                    const hasWhy = Boolean(msg.why);
                    const hasEvidence = Boolean(msg.evidence && Array.isArray(msg.evidence) && msg.evidence.length > 0);
                    const isEvidenceOpen = !!openEvidenceMap[idx];

                    return (
                        <div
                            key={idx}
                            style={{
                                alignSelf: isAi ? 'flex-start' : 'flex-end',
                                maxWidth: isAi ? '92%' : '80%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem',
                                animation: 'fadeIn 0.2s ease-out'
                            }}
                        >
                            <div style={{
                                background: isAi
                                    ? (msg.isError ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))')
                                    : 'linear-gradient(135deg, #0284c7, #2563eb)',
                                border: isAi
                                    ? (msg.isError ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)')
                                    : 'none',
                                padding: '1rem 1.25rem',
                                borderRadius: isAi ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                                display: 'flex',
                                gap: '0.85rem',
                                alignItems: 'flex-start',
                                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isAi ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px'
                                }}>
                                    {isAi ? <Bot size={18} color="#38bdf8" /> : <User size={18} color="#ffffff" />}
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {/* Structured Answer */}
                                    {isAi ? (
                                        <>
                                            <div>
                                                <div style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    color: '#38bdf8',
                                                    letterSpacing: '0.06em',
                                                    textTransform: 'uppercase',
                                                    marginBottom: '0.35rem'
                                                }}>
                                                    {t('chatbot.answerHeading', 'ANSWER')}
                                                </div>
                                                <div style={{
                                                    color: '#f8fafc',
                                                    fontSize: '0.925rem',
                                                    lineHeight: '1.6',
                                                    fontWeight: 500,
                                                    whiteSpace: 'pre-wrap'
                                                }}>
                                                    {msg.answer || msg.text}
                                                </div>
                                            </div>

                                            {/* Reason / Why Block */}
                                            {hasWhy && (
                                                <div style={{
                                                    background: 'rgba(56, 189, 248, 0.08)',
                                                    borderLeft: '3px solid #38bdf8',
                                                    padding: '0.65rem 0.85rem',
                                                    borderRadius: '0 8px 8px 0'
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.68rem',
                                                        fontWeight: 700,
                                                        color: '#93c5fd',
                                                        letterSpacing: '0.05em',
                                                        marginBottom: '0.2rem',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {t('chatbot.whyHeading', 'REASON & WHY')}
                                                    </div>
                                                    <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                                        {msg.why}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Supporting Evidence Accordion */}
                                            {hasEvidence && (
                                                <div style={{ marginTop: '0.35rem' }}>
                                                    <button
                                                        onClick={() => toggleEvidence(idx)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.45rem',
                                                            background: isEvidenceOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                                            border: '1px solid rgba(56, 189, 248, 0.35)',
                                                            borderRadius: '8px',
                                                            padding: '0.35rem 0.85rem',
                                                            color: isEvidenceOpen ? '#38bdf8' : '#94a3b8',
                                                            fontSize: '0.785rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <Database size={13} color="#38bdf8" />
                                                        <span>{t('chatbot.evidenceHeading', 'SUPPORTING EVIDENCE')} ({msg.evidence.length})</span>
                                                        {isEvidenceOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                    </button>

                                                    {isEvidenceOpen && (
                                                        <div style={{
                                                            marginTop: '0.65rem',
                                                            padding: '0.85rem',
                                                            background: 'rgba(0, 0, 0, 0.45)',
                                                            border: '1px solid rgba(56, 189, 248, 0.25)',
                                                            borderRadius: '10px',
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                                            gap: '0.65rem',
                                                            animation: 'fadeIn 0.2s ease-out'
                                                        }}>
                                                            {msg.evidence.map((ev, i) => renderEvidenceCard(ev, i))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Data Sources Pills */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '0.4rem',
                                                    flexWrap: 'wrap',
                                                    marginTop: '0.2rem',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Sources:</span>
                                                    {msg.sources.map((s, i) => (
                                                        <span key={i} style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.3rem',
                                                            fontSize: '0.72rem',
                                                            background: 'rgba(255, 255, 255, 0.04)',
                                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                                            padding: '0.15rem 0.45rem',
                                                            borderRadius: '4px',
                                                            color: 'var(--text-secondary)'
                                                        }}>
                                                            <Database size={10} color="#38bdf8" /> {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.925rem', color: '#ffffff' }}>
                                            {msg.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span style={{
                                fontSize: '0.68rem',
                                color: '#64748b',
                                alignSelf: isAi ? 'flex-start' : 'flex-end',
                                padding: '0 0.5rem'
                            }}>
                                {msg.timestamp}
                            </span>
                        </div>
                    );
                })}

                {loading && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem' }}>
                        <div className="status-badge" style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.45rem 0.85rem'
                        }}>
                            <Bot size={15} className="animate-spin" />
                            <span>{t('chatbot.scanning', 'Scanning verified LandTrace360 stored records...')}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Question Chips */}
            {suggestions.length > 0 && (
                <div style={{
                    padding: '0.65rem 1.25rem',
                    borderTop: '1px solid var(--border-color)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.45rem',
                    alignItems: 'center'
                }}>
                    <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--text-secondary)',
                        marginRight: '0.25rem'
                    }}>
                        {t('chatbot.suggestedQuestions', 'Quick Questions')}:
                    </span>
                    {suggestions.slice(0, 5).map((sq, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(sq)}
                            disabled={loading}
                            style={{
                                background: 'rgba(15, 23, 42, 0.7)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                color: '#cbd5e1',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '16px',
                                fontSize: '0.785rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)';
                                e.currentTarget.style.borderColor = '#38bdf8';
                                e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)';
                                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                                e.currentTarget.style.color = '#cbd5e1';
                            }}
                        >
                            <HelpCircle size={12} color="#38bdf8" />
                            <span>{sq}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Input Bar */}
            <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                style={{
                    display: 'flex',
                    padding: '0.85rem 1.25rem',
                    borderTop: '1px solid var(--border-color)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    gap: '0.5rem'
                }}
            >
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={
                        selectedLandId
                            ? `${t('chatbot.inputPlaceholder', 'Ask about')} ${selectedLandId}... (e.g. "Why is this land high risk?", "Show evidence")`
                            : t('chatbot.inputPlaceholder', 'Ask about ownership, risk, mortgages, legal cases, or request a complete summary...')
                    }
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '0.85rem 1.15rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !query.trim()}
                    style={{
                        borderRadius: '10px',
                        padding: '0 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                        opacity: (!query.trim() || loading) ? 0.6 : 1
                    }}
                >
                    <Send size={18} />
                </button>
            </form>

            {/* Subtle Mandatory Disclaimer */}
            <div style={{
                padding: '0.4rem 1.25rem',
                background: 'rgba(0, 0, 0, 0.4)',
                borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.72rem',
                color: '#94a3b8'
            }}>
                <AlertCircle size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span>{t('chatbot.disclaimer', 'LandTrace AI answers are generated from records available in this project and do not constitute official government land records or legal advice.')}</span>
            </div>
        </div>
    );
};

export default LandTraceAI;
