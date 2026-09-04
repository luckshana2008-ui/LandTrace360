import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, HelpCircle, AlertCircle, Database } from 'lucide-react';
import API_BASE from '../api';

const SUGGESTED_QUESTIONS = [
    "Who owns this land?",
    "What is the risk score?",
    "Any legal cases?",
    "Is there an active mortgage?",
    "Show land history",
    "Explain the boundary status",
    "How many subdivisions?",
    "Give me a complete summary"
];

const AIAssistant = ({ land_id }) => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { sender: 'ai', text: `Hello! I am your demo LandTrace AI Assistant. I can answer questions about the stored project data for ${land_id}.`, sources: [] }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (textInput) => {
        const textToUse = typeof textInput === 'string' ? textInput : query;
        if (!textToUse.trim()) return;

        const userMsg = { sender: 'user', text: textToUse };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        fetch(`${API_BASE}/api/lands/${land_id}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: userMsg.text })
        })
            .then(res => res.json())
            .then(data => {
                setMessages(prev => [...prev, { sender: 'ai', text: data.answer, sources: data.sources || [] }]);
                setLoading(false);
            })
            .catch(() => {
                setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered a network error. Try again.', sources: [] }]);
                setLoading(false);
            });
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '650px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bot color="var(--accent-color)" size={24} />
                <h3 style={{ margin: 0 }}>Ask Your Land</h3>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    AI-generated demo information. Not legal advice. Always verify official records before making decisions.
                </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex', flexDirection: 'column', gap: '0.5rem'
                    }}>
                        <div style={{
                            background: msg.sender === 'user' ? 'var(--accent-color)' : 'rgba(0,0,0,0.3)',
                            border: msg.sender === 'ai' ? '1px solid var(--border-color)' : 'none',
                            padding: '1rem', borderRadius: '12px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
                        }}>
                            {msg.sender === 'ai' ? <Bot size={20} color="var(--accent-color)" style={{ flexShrink: 0, marginTop: '2px' }} /> : <User size={20} style={{ flexShrink: 0, marginTop: '2px' }} />}
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.text}</p>
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingLeft: '2.5rem' }}>
                                {msg.sources.map((s, i) => (
                                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                        <Database size={12} /> {s}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '1rem' }}>
                        <div className="status-badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-color)' }}>AI is scanning records...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {messages.length < 4 && (
                <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {SUGGESTED_QUESTIONS.map((sq, i) => (
                        <button key={i} onClick={() => handleSend(sq)} style={{
                            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: '16px',
                            fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}>
                            <HelpCircle size={14} /> {sq}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)' }}>
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask about this property..."
                    style={{ flex: 1, padding: '0.85rem', borderRadius: '8px 0 0 8px', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', background: 'rgba(255,255,255,0.02)', color: 'white' }}
                />
                <button type="submit" className="btn-primary" style={{ borderRadius: '0 8px 8px 0', padding: '0 1.25rem' }} disabled={loading}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};
export default AIAssistant;
