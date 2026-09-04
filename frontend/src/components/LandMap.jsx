import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LandMap = ({ coordinates, popupText, lands }) => {
    // Legacy single coordinate
    if (coordinates && coordinates.length === 2 && !lands) {
        return (
            <MapContainer center={coordinates} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 1 }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={coordinates}>
                    <Popup>{popupText}</Popup>
                </Marker>
            </MapContainer>
        );
    }

    // Multiple lands
    if (lands && lands.length > 0) {
        const center = lands[0].coordinates;
        return (
            <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 1 }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {lands.map((land, idx) => land.coordinates ? (
                    <Marker key={land.id || idx} position={land.coordinates}>
                        <Popup>
                            <strong>{land.id}</strong><br />
                            {land.location}<br />
                            ₹{land.asking_price?.toLocaleString('en-IN')}<br />
                            <a href={`/land/${land.id}`} style={{ color: 'var(--accent-color)' }}>View Details</a>
                        </Popup>
                    </Marker>
                ) : null)}
            </MapContainer>
        );
    }

    return <div>No locations available</div>;
};

export default LandMap;
