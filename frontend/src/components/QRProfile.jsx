import { useState, useEffect } from 'react';
import API_BASE from '../api';

const QRProfile = ({ landId, surveyNumber }) => {
    const [qrData, setQrData] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/lands/${landId}/qr-profile`)
            .then(r => r.json())
            .then(setQrData)
            .catch(console.error);
    }, [landId]);

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData?.qr_data || `https://demo.landtrace360.com/profile/${landId}`)}`;

    return (
        <div className="glass-panel" style={{ marginTop: '2rem', textAlign: 'center', width: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>QR Profile</h3>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
                <img src={qrUrl} alt={`QR for ${landId}`} style={{ width: '150px', height: '150px' }} />
            </div>
            <div style={{ marginTop: '1rem' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{landId}</p>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Survey No: {surveyNumber}</p>
            </div>
            <button className="btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={() => window.print()}>Print QR</button>
        </div>
    );
};

export default QRProfile;
