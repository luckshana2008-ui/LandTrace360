import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="available" element={<AvailableLands />} />
          <Route path="sell" element={<SellLand />} />
          <Route path="saved" element={<SavedLands />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="high-risk" element={<HighRiskLands />} />
          <Route path="report" element={<VerificationReport />} />
          <Route path="land/:id" element={<LandProfileWrapper />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
