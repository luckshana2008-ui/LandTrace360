import React, { useState, useEffect } from 'react';
import MapLibreLandMap from '../components/MapLibreLandMap';
import API_BASE from '../api';
import {
  MapPin, PlusCircle, Trash2, Shield, ShieldCheck, ShieldAlert,
  Compass, Radio, RefreshCw, FileText, CheckCircle, ExternalLink
} from 'lucide-react';

const CoimbatoreCadastralMap = () => {
  const [lands, setLands] = useState([]);
  const [locationHistory, setLocationHistory] = useState([]);
  const [selectedLand, setSelectedLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'history'
  const [filterTaluk, setFilterTaluk] = useState('ALL');

  // New location access form state
  const [newAccess, setNewAccess] = useState({
    land_id: 'CBE-LND-2001',
    location_name: 'Peelamedu, Avinashi Road IT Corridor',
    coordinates_lat: '11.0315',
    coordinates_lng: '77.0125',
    access_type: 'GPS_FIELD_AUDIT',
    operator_name: 'S. Rajesh Kumar (Surveyor #TN-402)',
    purpose: 'Routine Boundary Audit & Geo-coordinate Verification',
    authorized_by: 'Coimbatore District Revenue Officer'
  });

  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch lands and location access history
  const fetchData = async () => {
    setLoading(true);
    try {
      const [landsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/api/lands`),
        fetch(`${API_BASE}/api/location/coimbatore/access-history`)
      ]);

      const landsData = await landsRes.json();
      const historyData = await historyRes.json();

      setLands(Array.isArray(landsData) ? landsData : landsData.raw_lands || []);
      setLocationHistory(historyData.history || []);
    } catch (err) {
      console.error('Error fetching Coimbatore map data:', err);
      showNotification('Failed to load Coimbatore map records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Append Location Access
  const handleAppendAccess = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        land_id: newAccess.land_id,
        location_name: newAccess.location_name,
        coordinates: [parseFloat(newAccess.coordinates_lat), parseFloat(newAccess.coordinates_lng)],
        access_type: newAccess.access_type,
        operator_name: newAccess.operator_name,
        purpose: newAccess.purpose,
        authorized_by: newAccess.authorized_by,
        device_info: 'MapLibre WebGL Client GPS'
      };

      const res = await fetch(`${API_BASE}/api/location/access/append`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to append access');

      setLocationHistory([data.record, ...locationHistory]);
      showNotification(`Location access entry ${data.record.id} appended to Coimbatore history!`);
      // Reset form
      setNewAccess(prev => ({
        ...prev,
        purpose: 'On-site Geofence & Boundary Inspection'
      }));
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Remove Location Access
  const handleRemoveAccess = async (id) => {
    if (!window.confirm(`Are you sure you want to remove location access audit entry ${id}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/location/access/remove/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove');

      setLocationHistory(locationHistory.filter(item => item.id !== id));
      showNotification(data.message);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Detect Current Browser GPS Coordinates
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setNewAccess(prev => ({
            ...prev,
            coordinates_lat: pos.coords.latitude.toFixed(6),
            coordinates_lng: pos.coords.longitude.toFixed(6)
          }));
          showNotification(`GPS Acquired: [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`);
        },
        (err) => {
          showNotification(`GPS Error: ${err.message}`, 'error');
        }
      );
    } else {
      showNotification('Geolocation not supported by this browser', 'error');
    }
  };

  // When a land is selected from dropdown
  const handleLandSelectChange = (e) => {
    const lId = e.target.value;
    const l = lands.find(item => item.id === lId);
    if (l) {
      setNewAccess(prev => ({
        ...prev,
        land_id: l.id,
        location_name: l.location,
        coordinates_lat: l.coordinates ? l.coordinates[0].toString() : prev.coordinates_lat,
        coordinates_lng: l.coordinates ? l.coordinates[1].toString() : prev.coordinates_lng
      }));
      setSelectedLand(l);
    }
  };

  const filteredLands = filterTaluk === 'ALL'
    ? lands
    : lands.filter(l => l.taluk && l.taluk.toLowerCase().includes(filterTaluk.toLowerCase()));

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-color, #e2e8f0)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🗺️</span>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: 'var(--text-color, #ffffff)' }}>
              Coimbatore Real Land Map & Location Access Manager
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted, #94a3b8)', marginTop: '6px', fontSize: '14px' }}>
            MapLibre GL Vector Engine &bull; Open Government Data (data.gov.in) Cadastral Integration &bull; Location Access Audit History
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(51, 65, 85, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#10b981'}`,
          color: notification.type === 'error' ? '#fca5a5' : '#86efac',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {notification.type === 'error' ? <ShieldAlert size={18} /> : <CheckCircle size={18} />}
          {notification.msg}
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1fr)', gap: '24px' }}>
        {/* Left Column: MapLibre Map & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--card-bg, #1e293b)',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #334155)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="#3b82f6" />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Taluk Filter:</span>
              {['ALL', 'North', 'South', 'Central', 'Pollachi', 'Sulur', 'West'].map(taluk => (
                <button
                  key={taluk}
                  onClick={() => setFilterTaluk(taluk)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: filterTaluk === taluk ? '#3b82f6' : 'rgba(51, 65, 85, 0.4)',
                    color: filterTaluk === taluk ? '#ffffff' : '#94a3b8'
                  }}
                >
                  {taluk}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Parcels Mapped: <strong style={{ color: '#38bdf8' }}>{filteredLands.length}</strong> | Access Events: <strong style={{ color: '#34d399' }}>{locationHistory.length}</strong>
            </div>
          </div>

          {/* MapLibre Map Component */}
          <MapLibreLandMap
            lands={filteredLands}
            locationAccessHistory={locationHistory}
            selectedLandId={selectedLand?.id}
            onSelectLand={(l) => {
              setSelectedLand(l);
              setNewAccess(prev => ({
                ...prev,
                land_id: l.id,
                location_name: l.location,
                coordinates_lat: l.coordinates ? l.coordinates[0].toString() : prev.coordinates_lat,
                coordinates_lng: l.coordinates ? l.coordinates[1].toString() : prev.coordinates_lng
              }));
            }}
            height="560px"
          />

          {/* Quick Parcel Highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px'
          }}>
            {filteredLands.slice(0, 4).map(land => (
              <div
                key={land.id}
                onClick={() => setSelectedLand(land)}
                style={{
                  background: selectedLand?.id === land.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--card-bg, #1e293b)',
                  border: `1px solid ${selectedLand?.id === land.id ? '#3b82f6' : 'var(--border-color, #334155)'}`,
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc' }}>{land.id}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: (land.risk_score || 0) < 25 ? '#10b981' : (land.risk_score || 0) < 60 ? '#f59e0b' : '#ef4444',
                    color: 'white'
                  }}>
                    Risk {land.risk_score}%
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {land.location}
                </div>
                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
                  Guideline: ₹{land.guideline_value_per_sqft}/sq.ft
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Location Access Controller (Append & Remove) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Append Location Access Card */}
          <div style={{
            background: 'var(--card-bg, #1e293b)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #334155)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <PlusCircle size={20} color="#10b981" />
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Append Location Access</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Log a certified on-site surveyor GPS audit, buyer inspection, or official geofence access for Coimbatore lands.
            </p>

            <form onSubmit={handleAppendAccess} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Target Land Parcel
                </label>
                <select
                  value={newAccess.land_id}
                  onChange={handleLandSelectChange}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #475569',
                    color: 'white',
                    fontSize: '12px'
                  }}
                >
                  {lands.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.id} - {l.survey_number} ({l.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                    Coordinates [Latitude, Longitude]
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Radio size={12} /> Auto-Detect GPS
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Latitude (e.g. 11.0315)"
                    value={newAccess.coordinates_lat}
                    onChange={e => setNewAccess({ ...newAccess, coordinates_lat: e.target.value })}
                    required
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid #475569',
                      color: 'white',
                      fontSize: '12px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Longitude (e.g. 77.0125)"
                    value={newAccess.coordinates_lng}
                    onChange={e => setNewAccess({ ...newAccess, coordinates_lng: e.target.value })}
                    required
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid #475569',
                      color: 'white',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Access / Audit Type
                </label>
                <select
                  value={newAccess.access_type}
                  onChange={e => setNewAccess({ ...newAccess, access_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #475569',
                    color: 'white',
                    fontSize: '12px'
                  }}
                >
                  <option value="GPS_FIELD_AUDIT">GPS Cadastral Field Audit</option>
                  <option value="BUYER_SITE_INSPECTION">Buyer Site Due Diligence Walk</option>
                  <option value="DRONE_SURVEY">Drone Volumetric Boundary Survey</option>
                  <option value="REGISTRATION_FIELD_CHECK">Sub-Registrar Inspection Squad</option>
                  <option value="DISPUTE_LEGAL_INSPECTION">Court Receiver Legal Verification</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Operator / Surveyor Name
                </label>
                <input
                  type="text"
                  value={newAccess.operator_name}
                  onChange={e => setNewAccess({ ...newAccess, operator_name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #475569',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Purpose / Field Notes
                </label>
                <input
                  type="text"
                  value={newAccess.purpose}
                  onChange={e => setNewAccess({ ...newAccess, purpose: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #475569',
                    color: 'white',
                    fontSize: '12px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <PlusCircle size={16} /> {submitting ? 'Appending Access...' : 'Append to Location History'}
              </button>
            </form>
          </div>

          {/* Location Data History: Coimbatore (Remove Action) */}
          <div style={{
            background: 'var(--card-bg, #1e293b)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #334155)',
            maxHeight: '440px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#06b6d4" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Location Data History: Coimbatore</h2>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{locationHistory.length} logs</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {locationHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ color: '#38bdf8' }}>{item.id} &bull; {item.land_id}</strong>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: item.status === 'GRANTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: item.status === 'GRANTED' ? '#34d399' : '#f87171',
                      fontWeight: 600
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <div style={{ color: '#cbd5e1', marginBottom: '4px' }}>
                    {item.purpose}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px' }}>
                    <span>📍 [{item.coordinates?.[0]}, {item.coordinates?.[1]}]</span>
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>

                  {/* Remove Location Access Action */}
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                    <button
                      onClick={() => handleRemoveAccess(item.id)}
                      title="Remove this location access entry from history"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} /> Remove Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoimbatoreCadastralMap;
