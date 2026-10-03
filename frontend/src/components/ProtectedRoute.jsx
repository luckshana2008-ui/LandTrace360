import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show splash while checking stored session
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0f172a, #020617)',
        color: '#ffffff', gap: '1.25rem'
      }}>
        <div style={{
          width: '64px', height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(192,132,252,0.2))',
          border: '1px solid rgba(56,189,248,0.4)',
          boxShadow: '0 0 25px rgba(56,189,248,0.25)',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          <Target size={34} color="#38bdf8" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>LandTrace360</div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.3rem' }}>
            Loading secure platform...
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
      </div>
    );
  }

  // Not authenticated → redirect to login (preserves intended destination)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
