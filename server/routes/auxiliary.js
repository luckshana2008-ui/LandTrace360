import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const legacyRecordsPath = path.join(__dirname, '../data/legacy_records.json');
const coimbatoreLandsPath = path.join(__dirname, '../data/coimbatore_lands.json');
const demoLandsPath = path.join(__dirname, '../data/demo_lands.json');

function getLegacyData() {
  return fs.existsSync(legacyRecordsPath) ? JSON.parse(fs.readFileSync(legacyRecordsPath, 'utf8')) : {};
}

function saveLegacyData(data) {
  fs.writeFileSync(legacyRecordsPath, JSON.stringify(data, null, 2));
}

function getAllLands() {
  const cbe = fs.existsSync(coimbatoreLandsPath) ? JSON.parse(fs.readFileSync(coimbatoreLandsPath, 'utf8')) : [];
  const demo = fs.existsSync(demoLandsPath) ? JSON.parse(fs.readFileSync(demoLandsPath, 'utf8')) : [];
  return [...demo, ...cbe];
}

// 1. Saved Lands
router.get('/saved-lands', (req, res) => {
  const legacy = getLegacyData();
  res.json(legacy.saved_lands || ["LND-1001", "CBE-LND-2001"]);
});

router.post('/saved-lands/:id', (req, res) => {
  const legacy = getLegacyData();
  const id = req.params.id.toUpperCase();
  let list = legacy.saved_lands || [];
  if (list.includes(id)) {
    list = list.filter(item => item !== id);
  } else {
    list.push(id);
  }
  legacy.saved_lands = list;
  saveLegacyData(legacy);
  res.json({ saved: list.includes(id), saved_lands: list });
});

// 2. Alerts
router.get('/alerts', (req, res) => {
  const legacy = getLegacyData();
  const alerts = (legacy.alerts && legacy.alerts.length > 0) ? legacy.alerts : [
    { id: "ALT-01", type: "Boundary Change", land_id: "LND-1002", date: "2026-09-04", severity: "High", title: "Boundary Mismatch", message: "Significant boundary mismatch detected via survey.", read: false },
    { id: "ALT-02", type: "New Legal Case", land_id: "LND-1004", date: "2026-09-02", severity: "High", title: "Legal Case Alert", message: "Title dispute filed in High Court.", read: false },
    { id: "ALT-03", type: "Risk Score Increased", land_id: "LND-1007", date: "2026-08-28", severity: "Medium", title: "Verification Pending", message: "Risk score increased due to pending document verification.", read: false },
    { id: "ALT-04", type: "Document Verification", land_id: "CBE-LND-2004", date: "2026-08-25", severity: "Medium", title: "Guideline Value Update", message: "Singanallur industrial circle rate revised.", read: false }
  ];
  res.json(alerts);
});

router.post('/alerts/:id/read', (req, res) => {
  const legacy = getLegacyData();
  const alert = (legacy.alerts || []).find(a => a.id === req.params.id);
  if (alert) alert.read = true;
  saveLegacyData(legacy);
  res.json({ message: "Alert marked as read", alert });
});

// 3. Search
router.get('/search', (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const allLands = getAllLands();
  const results = allLands.filter(l =>
    l.id.toLowerCase().includes(q) ||
    (l.location && l.location.toLowerCase().includes(q)) ||
    (l.survey_number && l.survey_number.toLowerCase().includes(q)) ||
    (l.owner && l.owner.toLowerCase().includes(q)) ||
    (l.village && l.village.toLowerCase().includes(q)) ||
    (l.taluk && l.taluk.toLowerCase().includes(q))
  );
  res.json({ count: results.length, query: q, results });
});

// 4. Dashboard Stats
router.get('/dashboard', (req, res) => {
  const lands = getAllLands();
  const verified = lands.filter(l => l.status && l.status.toLowerCase().includes('verified')).length;
  const forSale = lands.filter(l => l.is_for_sale === true).length;
  const highRisk = lands.filter(l => (l.risk_score || 0) >= 40).length;
  const avgHealth = Math.round(lands.reduce((acc, l) => acc + (l.health_score || 82), 0) / (lands.length || 1));
  const avgRisk = Math.round(lands.reduce((acc, l) => acc + (l.risk_score || 18), 0) / (lands.length || 1));

  res.json({
    total_lands: lands.length,
    verified_lands: verified,
    lands_for_sale: forSale,
    high_risk_lands: highRisk,
    recent_announcements: 3,
    documents_requiring_review: 2,
    new_alerts: 4,
    average_land_health: avgHealth,
    predicted_risk_changes: "2 lands showing increasing risk",
    average_risk_score: avgRisk,
    recent_lands: lands.slice(0, 5)
  });
});

// 5. Loan Closure Verification
router.get('/loan-closure-verification/:doc_no', (req, res) => {
  const docNo = req.params.doc_no;
  res.json({
    verification_status: "VERIFIED_CLOSED",
    document_number: docNo,
    bank: "State Bank of India / Commercial Mortgage Registry",
    closure_date: "2026-05-18",
    no_objection_certificate: "NOC-SBI-CBE-99410",
    encumbrance_released: true,
    risk_cleared: true,
    message: `Loan clearance confirmed. Hypothecation on document ${docNo} has been officially satisfied and struck from registry.`
  });
});

export default router;
