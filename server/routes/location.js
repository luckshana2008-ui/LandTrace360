import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const locationHistoryPath = path.join(__dirname, '../data/location_access_history.json');

function getLocationHistory() {
  if (!fs.existsSync(locationHistoryPath)) {
    fs.writeFileSync(locationHistoryPath, JSON.stringify([]));
  }
  const data = fs.readFileSync(locationHistoryPath, 'utf8');
  return JSON.parse(data);
}

function saveLocationHistory(history) {
  fs.writeFileSync(locationHistoryPath, JSON.stringify(history, null, 2));
}

// GET all location access history for Coimbatore
router.get('/coimbatore/access-history', (req, res) => {
  try {
    const history = getLocationHistory();
    const { land_id, access_type, status } = req.query;

    let filtered = [...history];
    if (land_id) {
      filtered = filtered.filter(item => item.land_id.toLowerCase() === land_id.toLowerCase());
    }
    if (access_type) {
      filtered = filtered.filter(item => item.access_type === access_type);
    }
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    res.json({
      region: 'Coimbatore District, Tamil Nadu',
      total_records: filtered.length,
      history: filtered
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve location access history', details: err.message });
  }
});

// POST append location access entry to Coimbatore location data history
router.post('/access/append', (req, res) => {
  try {
    const {
      land_id,
      location_name,
      coordinates, // [lat, lng]
      access_type,
      operator_name,
      purpose,
      authorized_by,
      device_info
    } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ error: 'Valid [latitude, longitude] coordinates are required for Coimbatore location access.' });
    }

    const history = getLocationHistory();
    const newId = `LOC-ACC-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    const timestamp = new Date().toISOString();

    // Cryptographic audit hash for tamper-evidence
    const rawPayload = `${newId}-${land_id}-${coordinates.join(',')}-${timestamp}`;
    const hash = crypto.createHash('sha256').update(rawPayload).digest('hex').substring(0, 32);

    const newRecord = {
      id: newId,
      land_id: land_id || 'CBE-COIMBATORE-GEN',
      location_name: location_name || 'Coimbatore Cadastral Zone',
      coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])],
      access_type: access_type || 'GPS_FIELD_AUDIT',
      status: 'GRANTED',
      authorized_by: authorized_by || 'Coimbatore Revenue Authority / LandTrace360',
      operator_name: operator_name || 'Licensed Surveyor / Verified Inspector',
      purpose: purpose || 'On-site Geofence & Boundary Inspection',
      timestamp,
      device_info: device_info || 'MapLibre WebGL Client Geolocation',
      hash
    };

    history.unshift(newRecord); // Prepend to top of history
    saveLocationHistory(history);

    res.status(201).json({
      message: 'Location access successfully appended to Coimbatore history log.',
      record: newRecord,
      total_records: history.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to append location access record', details: err.message });
  }
});

// DELETE remove location access entry from Coimbatore history
router.delete('/access/remove/:id', (req, res) => {
  try {
    const targetId = req.params.id;
    const history = getLocationHistory();
    const index = history.findIndex(item => item.id.toLowerCase() === targetId.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ error: `Location access entry '${targetId}' not found.` });
    }

    const removedItem = history.splice(index, 1)[0];
    saveLocationHistory(history);

    res.json({
      message: `Location access entry '${targetId}' successfully removed from Coimbatore history.`,
      removed_record: removedItem,
      remaining_records: history.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove location access record', details: err.message });
  }
});

// PATCH toggle grant/revoke status of location access
router.patch('/access/status/:id', (req, res) => {
  try {
    const targetId = req.params.id;
    const { status } = req.body; // 'GRANTED' or 'REVOKED'
    const history = getLocationHistory();
    const record = history.find(item => item.id.toLowerCase() === targetId.toLowerCase());

    if (!record) {
      return res.status(404).json({ error: `Location access entry '${targetId}' not found.` });
    }

    record.status = status || (record.status === 'GRANTED' ? 'REVOKED' : 'GRANTED');
    record.status_updated_at = new Date().toISOString();
    saveLocationHistory(history);

    res.json({
      message: `Location access status updated to ${record.status}`,
      record
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update access status', details: err.message });
  }
});

export default router;
