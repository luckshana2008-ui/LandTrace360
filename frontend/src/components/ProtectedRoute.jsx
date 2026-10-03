import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, Shield } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at top, #0f172a, #020617)',
          color: '#ffffff',
          gap: '1.25rem'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(192, 132, 252, 0.2))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)'
          }}
        >
          <Target size={34} color="#38bdf8" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            LandTrace360
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Verifying secure credentials...
          </div>
        </div>
      </div>
    );
  }

  // Open Access: Allow all public users to explore the full platform seamlessly
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
