import React from 'react';
import MapLibreLandMap from './MapLibreLandMap';

/**
 * Backward-compatible LandMap wrapper delegating directly to MapLibre GL
 * Replaces Leaflet with vector-accelerated MapLibre
 */
const LandMap = ({ coordinates, popupText, lands, height = '100%' }) => {
  return (
    <MapLibreLandMap
      coordinates={coordinates}
      popupText={popupText}
      lands={lands}
      height={height}
    />
  );
};

export default LandMap;
