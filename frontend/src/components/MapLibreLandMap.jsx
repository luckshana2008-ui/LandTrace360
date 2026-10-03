import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, MapPin, ShieldCheck, AlertTriangle, Navigation, Crosshair } from 'lucide-react';

const COIMBATORE_CENTER = [76.9558, 11.0168]; // [lng, lat] for MapLibre

const MapLibreLandMap = ({
  coordinates, // [lat, lng]
  popupText,
  lands = [],
  locationAccessHistory = [],
  selectedLandId = null,
  onSelectLand = null,
  height = '500px'
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapStyle, setMapStyle] = useState('streets'); // 'streets' or 'satellite'
  const [activeGeoloc, setActiveGeoloc] = useState(null);

  // MapLibre Tile Styles
  const STYLES = {
    streets: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    },
    satellite: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics'
        }
      },
      layers: [
        {
          id: 'satellite-tiles-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  };

  // Determine initial center and zoom
  let initialCenter = COIMBATORE_CENTER;
  let initialZoom = 11.5;

  if (coordinates && coordinates.length === 2) {
    initialCenter = [coordinates[1], coordinates[0]]; // [lng, lat]
    initialZoom = 14;
  } else if (lands && lands.length > 0 && lands[0].coordinates) {
    initialCenter = [lands[0].coordinates[1], lands[0].coordinates[0]];
  }

  // Initialize MapLibre
  useEffect(() => {
    if (map.current) return; // initialize only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLES[mapStyle],
      center: initialCenter,
      zoom: initialZoom,
      pitch: 35, // 3D perspective
      bearing: -10
    });

    // Add navigation and geolocate controls
    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true
    });
    map.current.addControl(geolocate, 'top-right');

    geolocate.on('geolocate', (e) => {
      setActiveGeoloc([e.coords.longitude, e.coords.latitude]);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle Style Switching
  const switchStyle = (newStyle) => {
    if (!map.current || newStyle === mapStyle) return;
    setMapStyle(newStyle);
    map.current.setStyle(STYLES[newStyle]);
  };

  // Render Polygons and Markers
  useEffect(() => {
    if (!map.current) return;

    const renderLayersAndMarkers = () => {
      // Clear previous markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Case 1: Single land view
      if (coordinates && coordinates.length === 2 && (!lands || lands.length === 0)) {
        const lngLat = [coordinates[1], coordinates[0]];

        // Create marker
        const el = document.createElement('div');
        el.className = 'maplibre-marker-single';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundColor = '#3b82f6';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`<div style="color: #1e293b; padding: 6px; font-size: 13px;">
            <strong>Cadastral Coordinates</strong><br/>
            ${popupText || 'Coimbatore Real Land Point'}
          </div>`);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(lngLat)
          .setPopup(popup)
          .addTo(map.current);

        markersRef.current.push(marker);

        // Fly to coordinates
        map.current.flyTo({ center: lngLat, zoom: 14.5 });
        return;
      }

      // Case 2: Multi-lands Cadastral Registry
      if (lands && lands.length > 0) {
        lands.forEach(land => {
          if (!land.coordinates) return;
          const lngLat = [land.coordinates[1], land.coordinates[0]];

          const isSelected = selectedLandId === land.id;
          const riskColor = (land.risk_score || 0) < 25
            ? '#10b981'
            : (land.risk_score || 0) < 60
            ? '#f59e0b'
            : '#ef4444';

          const el = document.createElement('div');
          el.className = `maplibre-marker-${land.id}`;
          el.style.width = isSelected ? '32px' : '26px';
          el.style.height = isSelected ? '32px' : '26px';
          el.style.backgroundColor = riskColor;
          el.style.borderRadius = '50%';
          el.style.border = isSelected ? '4px solid #ffffff' : '2.5px solid #ffffff';
          el.style.boxShadow = isSelected ? '0 0 16px rgba(59, 130, 246, 0.9)' : '0 2px 6px rgba(0,0,0,0.4)';
          el.style.cursor = 'pointer';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.color = '#ffffff';
          el.style.fontSize = '10px';
          el.style.fontWeight = 'bold';
          el.innerHTML = `${land.risk_score || 0}`;

          const popupContent = `
            <div style="color: #0f172a; font-family: sans-serif; min-width: 210px; padding: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #1e293b; font-size: 14px;">${land.id}</span>
                <span style="background: ${riskColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                  Risk: ${land.risk_score}%
                </span>
              </div>
              <div style="font-size: 12px; color: #334155; margin-bottom: 4px;">
                <strong>Survey:</strong> ${land.survey_number || 'N/A'}<br/>
                <strong>Location:</strong> ${land.location || 'Coimbatore'}<br/>
                <strong>Guideline:</strong> ₹${land.guideline_value_per_sqft || 0}/sq.ft<br/>
                <strong>Asking:</strong> ₹${land.asking_price ? land.asking_price.toLocaleString('en-IN') : 'N/A'}
              </div>
              <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between;">
                <a href="/land/${land.id}" style="color: #2563eb; text-decoration: none; font-size: 12px; font-weight: 600;">View Profile &rarr;</a>
              </div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(lngLat)
            .setPopup(popup)
            .addTo(map.current);

          el.addEventListener('click', () => {
            if (onSelectLand) onSelectLand(land);
          });

          markersRef.current.push(marker);
        });
      }

      // Case 3: Location Access History Points (from MapLibre audit logs)
      if (locationAccessHistory && locationAccessHistory.length > 0) {
        locationAccessHistory.forEach(record => {
          if (!record.coordinates || record.coordinates.length !== 2) return;
          const lngLat = [record.coordinates[1], record.coordinates[0]];

          const isGranted = record.status === 'GRANTED';
          const el = document.createElement('div');
          el.className = `maplibre-access-marker-${record.id}`;
          el.style.width = '18px';
          el.style.height = '18px';
          el.style.backgroundColor = isGranted ? '#06b6d4' : '#64748b';
          el.style.borderRadius = '3px';
          el.style.transform = 'rotate(45deg)';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 0 8px rgba(6, 182, 212, 0.7)';
          el.style.cursor = 'pointer';

          const accessPopup = `
            <div style="color: #0f172a; font-family: sans-serif; min-width: 220px; padding: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="color: #0891b2; font-size: 13px;">📍 ${record.id}</strong>
                <span style="background: ${isGranted ? '#06b6d4' : '#64748b'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                  ${record.status}
                </span>
              </div>
              <div style="font-size: 11px; color: #334155; line-height: 1.4;">
                <strong>Target:</strong> ${record.land_id} (${record.location_name})<br/>
                <strong>Type:</strong> ${record.access_type}<br/>
                <strong>Operator:</strong> ${record.operator_name}<br/>
                <strong>Purpose:</strong> ${record.purpose}<br/>
                <strong>Device:</strong> ${record.device_info}<br/>
                <strong>Time:</strong> ${new Date(record.timestamp).toLocaleString()}
              </div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 20 }).setHTML(accessPopup);
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(lngLat)
            .setPopup(popup)
            .addTo(map.current);

          markersRef.current.push(marker);
        });
      }
    };

    if (map.current.isStyleLoaded()) {
      renderLayersAndMarkers();
    } else {
      map.current.once('style.load', renderLayersAndMarkers);
    }
  }, [lands, coordinates, locationAccessHistory, selectedLandId, mapStyle]);

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color, #334155)' }}>
      {/* MapLibre DOM container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Layer Switcher Floating Pill */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 10,
        display: 'flex',
        gap: '6px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '5px 8px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <button
          onClick={() => switchStyle('streets')}
          style={{
            background: mapStyle === 'streets' ? '#3b82f6' : 'transparent',
            color: '#ffffff',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Layers size={13} /> Street Map
        </button>
        <button
          onClick={() => switchStyle('satellite')}
          style={{
            background: mapStyle === 'satellite' ? '#3b82f6' : 'transparent',
            color: '#ffffff',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🛰️ Satellite
        </button>
      </div>

      {/* Region & Engine Badge */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 10,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
        <span>MapLibre GL Vector Engine &bull; Coimbatore Cadastral (EPSG:4326)</span>
        {activeGeoloc && (
          <span style={{ color: '#06b6d4', marginLeft: '6px' }}>
            GPS Active: [{activeGeoloc[1].toFixed(4)}, {activeGeoloc[0].toFixed(4)}]
          </span>
        )}
      </div>
    </div>
  );
};

export default MapLibreLandMap;
