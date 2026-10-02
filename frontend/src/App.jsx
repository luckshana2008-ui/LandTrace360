import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';
import AvailableLands from './pages/AvailableLands';
import SellLand from './pages/SellLand';
import SavedLands from './pages/SavedLands';
import LandProfileWrapper from './pages/LandProfileWrapper';
import Alerts from './pages/Alerts';
import HighRiskLands from './pages/HighRiskLands';
import VerificationReport from './pages/VerificationReport';
import LoanClosureVerification from './pages/LoanClosureVerification';
import LandPassportPage from './pages/LandPassportPage';
import AILandStoryPage from './pages/AILandStoryPage';
import AnomalyDetectivePage from './pages/AnomalyDetectivePage';
import EvidenceExplorerPage from './pages/EvidenceExplorerPage';
import RiskBreakdownPage from './pages/RiskBreakdownPage';
import LandTraceAIPage from './pages/LandTraceAIPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="available" element={<AvailableLands />} />
                <Route path="sell" element={<SellLand />} />
                <Route path="saved" element={<SavedLands />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="high-risk" element={<HighRiskLands />} />
                <Route path="report" element={<VerificationReport />} />
                <Route path="loan-closure" element={<LoanClosureVerification />} />
                <Route path="passport" element={<LandPassportPage />} />
                <Route path="intelligence/passport" element={<Navigate to="/passport" replace />} />
                <Route path="story" element={<AILandStoryPage />} />
                <Route path="intelligence/story" element={<Navigate to="/story" replace />} />
                <Route path="anomalies" element={<AnomalyDetectivePage />} />
                <Route path="intelligence/anomalies" element={<Navigate to="/anomalies" replace />} />
                <Route path="evidence" element={<EvidenceExplorerPage />} />
                <Route path="intelligence/evidence" element={<Navigate to="/evidence" replace />} />
                <Route path="risk-breakdown" element={<RiskBreakdownPage />} />
                <Route path="intelligence/risk-breakdown" element={<Navigate to="/risk-breakdown" replace />} />
                <Route path="chat" element={<LandTraceAIPage />} />
                <Route path="intelligence/chat" element={<Navigate to="/chat" replace />} />
                <Route path="land/:id" element={<LandProfileWrapper />} />
              </Route>
            </Route>

            {/* Fallback to Dashboard (which redirects to Login if unauthenticated) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
