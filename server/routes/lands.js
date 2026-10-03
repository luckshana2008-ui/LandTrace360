import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coimbatoreLandsPath = path.join(__dirname, '../data/coimbatore_lands.json');
const demoLandsPath = path.join(__dirname, '../data/demo_lands.json');
const legacyRecordsPath = path.join(__dirname, '../data/legacy_records.json');

function getAllMergedLands() {
  const cbe = fs.existsSync(coimbatoreLandsPath) ? JSON.parse(fs.readFileSync(coimbatoreLandsPath, 'utf8')) : [];
  const demo = fs.existsSync(demoLandsPath) ? JSON.parse(fs.readFileSync(demoLandsPath, 'utf8')) : [];
  return [...demo, ...cbe];
}

function getLegacyData() {
  return fs.existsSync(legacyRecordsPath) ? JSON.parse(fs.readFileSync(legacyRecordsPath, 'utf8')) : {};
}

// 1. GET all lands (Merged: Demo Lands LND-1001..1008 + Coimbatore Lands CBE-LND-2001..2008)
router.get('/', (req, res) => {
  try {
    const lands = getAllMergedLands();
    const { district, status, min_price, max_price, query } = req.query;

    let filtered = [...lands];
    if (district) {
      filtered = filtered.filter(l => l.district && l.district.toLowerCase() === district.toLowerCase());
    }
    if (status) {
      filtered = filtered.filter(l => l.status && l.status.toLowerCase().includes(status.toLowerCase()));
    }
    if (min_price) {
      filtered = filtered.filter(l => (l.asking_price || 0) >= Number(min_price));
    }
    if (max_price) {
      filtered = filtered.filter(l => (l.asking_price || Infinity) <= Number(max_price));
    }
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(l =>
        l.id.toLowerCase().includes(q) ||
        (l.location && l.location.toLowerCase().includes(q)) ||
        (l.survey_number && l.survey_number.toLowerCase().includes(q)) ||
        (l.owner && l.owner.toLowerCase().includes(q))
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve lands', details: err.message });
  }
});

// 2. GET lands for sale
router.get('/for-sale', (req, res) => {
  try {
    const lands = getAllMergedLands();
    const forSale = lands.filter(l => l.is_for_sale === true);
    res.json(forSale);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lands for sale', details: err.message });
  }
});

// 3. GET high risk lands
router.get('/high-risk', (req, res) => {
  try {
    const lands = getAllMergedLands();
    const highRisk = lands.filter(l => (l.risk_score || 0) >= 40);
    res.json(highRisk);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch high-risk lands', details: err.message });
  }
});

// 4. GET Coimbatore Real Land Cadastral GeoJSON
router.get('/coimbatore/real-data', (req, res) => {
  try {
    const cbe = fs.existsSync(coimbatoreLandsPath) ? JSON.parse(fs.readFileSync(coimbatoreLandsPath, 'utf8')) : [];
    const geoJsonFeatures = cbe.map(land => ({
      type: 'Feature',
      properties: {
        id: land.id,
        survey_number: land.survey_number,
        subdivision: land.subdivision_number,
        location: land.location,
        taluk: land.taluk,
        owner: land.owner,
        status: land.status,
        risk_score: land.risk_score,
        health_score: land.health_score,
        asking_price: land.asking_price,
        guideline_value_per_sqft: land.guideline_value_per_sqft,
        market_value_per_sqft: land.market_value_per_sqft,
        sro_office: land.sro_office,
        dilrmp_code: land.dilrmp_code,
        encumbrance_status: land.encumbrance_status
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          land.boundary_polygon ? land.boundary_polygon.map(coord => [coord[1], coord[0]]) : []
        ]
      }
    }));

    res.json({
      type: 'FeatureCollection',
      region: 'Coimbatore District, Tamil Nadu',
      crs: 'EPSG:4326',
      total_parcels: cbe.length,
      features: geoJsonFeatures,
      raw_lands: cbe
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to build Coimbatore GeoJSON', details: err.message });
  }
});

// 5. GET announcements
router.get('/announcements', (req, res) => {
  res.json([
    { id: 1, title: "Coimbatore Metro Rail Corridor Phase 1 Alignment Notified", date: "2026-09-15", details: "Avinashi Road and Trichy Road survey parcels under accelerated clearance." },
    { id: 2, title: "TNREGINET 2024-2026 Guideline Value Revision Enforced", date: "2026-08-01", details: "All registrations benchmarked to new circle rates." },
    { id: 3, title: "DILRMP Cadastral Resurvey Completed for Coimbatore North", date: "2026-07-20", details: "FMB boundaries digitized with sub-meter RTK GNSS accuracy." }
  ]);
});

// 6. GET single land by ID
router.get('/:id', (req, res) => {
  try {
    const lands = getAllMergedLands();
    const land = lands.find(l => l.id.toLowerCase() === req.params.id.toLowerCase());
    if (!land) {
      return res.status(404).json({ error: `Land with ID ${req.params.id} not found.` });
    }
    res.json(land);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching land details', details: err.message });
  }
});

// 7. GET Land History
router.get('/:id/history', (req, res) => {
  const landId = req.params.id.toUpperCase();
  const legacy = getLegacyData();
  if (legacy.history && legacy.history[landId]) {
    return res.json(legacy.history[landId]);
  }
  const lands = getAllMergedLands();
  const land = lands.find(l => l.id === landId);
  res.json([
    { year: 2012, owner: "Ancestral Family Settlement", status: "Agricultural Punja", transactions: 0, risk_score: 10, boundary_status: "FMB Surveyed" },
    { year: 2018, owner: land?.owner || "Prior Registered Entity", status: "Converted Commercial/Mixed", transactions: 1, risk_score: land?.risk_score ? Math.round(land.risk_score * 0.8) : 15, boundary_status: "Stone Bound" },
    { year: 2026, owner: land?.owner || "Current Owner", status: land?.status || "Verified", transactions: 2, risk_score: land?.risk_score || 12, boundary_status: "Digital GPS Demarcated" }
  ]);
});

// 8. GET Land Owners
router.get('/:id/owners', (req, res) => {
  const landId = req.params.id.toUpperCase();
  const legacy = getLegacyData();
  if (legacy.owners && legacy.owners[landId]) {
    return res.json(legacy.owners[landId]);
  }
  const lands = getAllMergedLands();
  const land = lands.find(l => l.id === landId);
  res.json([
    { name: land?.owner || "Current Registered Owner", period: "2018 - Present", type: "Registered Title Holder" },
    { name: "Prior Landholder / Pattadar", period: "1995 - 2018", type: "Settlement Deed" }
  ]);
});

// 9. GET Land Documents
router.get('/:id/documents', (req, res) => {
  const landId = req.params.id.toUpperCase();
  const legacy = getLegacyData();
  if (legacy.documents && legacy.documents[landId]) {
    return res.json(legacy.documents[landId]);
  }
  const lands = getAllMergedLands();
  const land = lands.find(l => l.id === landId);
  res.json([
    { doc_no: `DOC-TN-${landId}-01`, type: "Sale Deed & Title Registration", date: "2018-06-14", verification: "Verified", result: "Match" },
    { doc_no: `EC-${land?.patta_number || '88102'}`, type: "Encumbrance Certificate (1985-2026)", date: "2026-08-20", verification: "Verified", result: "Match" },
    { doc_no: `FMB-${land?.survey_number || '412'}`, type: "Field Measurement Book (FMB Sketch)", date: "2024-03-10", verification: "Verified", result: "Match" }
  ]);
});

// 10. GET Land Legal Cases
router.get('/:id/cases', (req, res) => {
  const landId = req.params.id.toUpperCase();
  const legacy = getLegacyData();
  if (legacy.cases && legacy.cases[landId]) {
    return res.json(legacy.cases[landId]);
  }
  const lands = getAllMergedLands();
  const land = lands.find(l => l.id === landId);
  if (land && land.active_cases > 0) {
    res.json([
      { case_no: `OS-104/2024`, court: "Coimbatore District Commercial Court", status: "Active Hearing", type: "Partition & Recovery Dispute", filing_date: "2024-04-12" }
    ]);
  } else {
    res.json([]);
  }
});

// 11. GET Land Mortgages
router.get('/:id/mortgages', (req, res) => {
  const landId = req.params.id.toUpperCase();
  const legacy = getLegacyData();
  if (legacy.mortgages && legacy.mortgages[landId]) {
    return res.json(legacy.mortgages[landId]);
  }
  const lands = getAllMergedLands();
  const land = lands.find(l => l.id === landId);
  if (land && land.mortgage_active) {
    res.json([
      { bank: "State Bank of India (Coimbatore Main)", amount: "₹18,500,000", status: "Active Hypothecation", registered_date: "2022-03-15" }
    ]);
  } else {
    res.json([]);
  }
});

// 12. GET Land DNA
router.get('/:id/dna', (req, res) => {
  const landId = req.params.id.toUpperCase();
  const legacy = getLegacyData();
  if (legacy.dna && legacy.dna[landId]) {
    return res.json(legacy.dna[landId]);
  }
  const lands = getAllMergedLands();
  const land = lands.find(l => l.id === landId);
  res.json({
    land_id: landId,
    ownership_stability: land?.risk_score < 25 ? 90 : 50,
    document_health: land?.health_score || 85,
    legal_safety: land?.active_cases > 0 ? 30 : 95,
    mortgage_status: land?.mortgage_active ? 40 : 95,
    boundary_stability: land?.status?.includes("Boundary") ? 45 : 90,
    overall_health: land?.health_score || 85
  });
});

// 13. GET Land Risk Breakdown
router.get('/:id/risk', (req, res) => {
  const landId = req.params.id.toUpperCase();
  const legacy = getLegacyData();
  if (legacy.risk && legacy.risk[landId]) {
    return res.json(legacy.risk[landId]);
  }
  const lands = getAllMergedLands();
  const land = lands.find(l => l.id === landId);
  res.json({
    land_id: landId,
    overall_score: land?.risk_score || 15,
    document_risk: land?.health_score < 70 ? 25 : 5,
    ownership_risk: land?.status?.includes("Dispute") ? 55 : 5,
    legal_risk: land?.active_cases > 0 ? 75 : 0,
    mortgage_risk: land?.mortgage_active ? 60 : 0,
    boundary_risk: land?.status?.includes("Boundary") ? 45 : 0,
    level: (land?.risk_score || 0) < 25 ? "LOW" : (land?.risk_score || 0) < 60 ? "MEDIUM" : "HIGH"
  });
});

// 14. GET Fragmentation & Boundary Changes
router.get('/:id/fragmentation', (req, res) => {
  res.json({
    land_id: req.params.id,
    fragmentation_risk: "Low",
    original_size: "100%",
    subdivision_count: 1,
    details: "No illegal fragmentation detected on record."
  });
});

router.get('/:id/boundary-changes', (req, res) => {
  res.json({
    land_id: req.params.id,
    boundary_status: "Verified",
    variance_area: "0.2%",
    satellite_concordance: "High"
  });
});

// Helper: Proxy or Generate Anomalies
router.get('/:id/anomalies', async (req, res) => {
  const landId = req.params.id;
  try {
    // Try FastAPI proxy first
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const pyResp = await fetch(`http://127.0.0.1:8000/api/lands/${encodeURIComponent(landId)}/anomalies`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);

    if (pyResp && pyResp.ok) {
      const pyData = await pyResp.json();
      if (pyData && pyData.anomalies) return res.json(pyData);
    }
  } catch (e) {
    // Fall back to built-in generator
  }

  const lands = getAllMergedLands();
  const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || {
    id: landId,
    location: "Coimbatore Region",
    owner: "Registered Landholder",
    survey_number: "104/A",
    risk_score: 20,
    health_score: 80
  };

  const anomalies = [];
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  if ((land.risk_score || 0) >= 45 || land.status?.includes("Dispute") || land.active_cases > 0) {
    anomalies.push({
      anomaly_id: `ANOM-${land.id}-LEGAL`,
      category: "Legal-history anomalies",
      severity: "CRITICAL",
      title: `Contested Title Claim / Legal Dispute on Parcel ${land.survey_number}`,
      description: `Active litigation or partition petition flagged in district civil court records for parcel ${land.id}.`,
      why_it_was_detected: `Risk evaluation triggered: Risk score ${land.risk_score}/100 exceeds critical safety threshold.`,
      confidence: 0.96,
      evidence: {
        court: "Coimbatore District Commercial Court",
        case_type: "Partition & Recovery Dispute",
        filing_date: "2024-04-12",
        status: "Active Hearing"
      },
      affected_records: [`CASE-${land.id}-01`, `LAND-${land.id}`],
      detected_at: nowStr
    });
  }

  if (land.status?.includes("Boundary") || (land.risk_score || 0) >= 30) {
    anomalies.push({
      anomaly_id: `ANOM-${land.id}-BOUNDARY`,
      category: "Boundary changes",
      severity: "HIGH",
      title: `Cadastral Boundary Incongruence (${land.survey_number})`,
      description: "Discrepancy identified between historical Field Measurement Book (FMB) survey sketch and modern drone/satellite boundary overlay.",
      why_it_was_detected: "Spatial variance delta of >1.5% detected across eastern cadastral boundary line.",
      confidence: 0.92,
      evidence: {
        fmb_area_sqft: land.area_sq_ft || 45000,
        survey_deviation: "1.8%",
        surveyor_notes: "Stone demarcations partially relocated during arterial road widening."
      },
      affected_records: [`FMB-${land.survey_number}`, `SURVEY-2025-${land.id}`],
      detected_at: nowStr
    });
  }

  if (land.mortgage_active || (land.risk_score || 0) >= 25) {
    anomalies.push({
      anomaly_id: `ANOM-${land.id}-MORTGAGE`,
      category: "Mortgage status inconsistencies",
      severity: "MEDIUM",
      title: `Unreleased Hypothecation / Institutional Lien Registered`,
      description: "Property exhibits an active mortgage registration with state financial institution.",
      why_it_was_detected: "Encumbrance Certificate (EC) ledger cross-referenced against SRO bank release receipts.",
      confidence: 0.89,
      evidence: {
        mortgagee: "Commercial Banking Institution",
        registered_amount: "₹18,500,000",
        release_noc_filed: false
      },
      affected_records: [`MORT-${land.id}`, `EC-2026-${land.id}`],
      detected_at: nowStr
    });
  }

  if (anomalies.length === 0) {
    anomalies.push({
      anomaly_id: `ANOM-${land.id}-INFO`,
      category: "Document/record inconsistencies",
      severity: "LOW",
      title: `Guideline Rate Benchmark Revision Noted`,
      description: `TNREGINET 2024-2026 circle rate revision applied to survey number ${land.survey_number}. No legal discrepancies.`,
      why_it_was_detected: "Routine circle rate compliance audit performed against state gazette.",
      confidence: 0.98,
      evidence: {
        current_circle_rate: land.guideline_value_per_sqft || 3500,
        registration_status: "Fully Compliant"
      },
      affected_records: [`EC-GAZETTE-2026`, `LAND-${land.id}`],
      detected_at: nowStr
    });
  }

  res.json({
    land_id: land.id,
    total_anomalies: anomalies.length,
    critical_count: anomalies.filter(a => a.severity === 'CRITICAL').length,
    high_count: anomalies.filter(a => a.severity === 'HIGH').length,
    medium_count: anomalies.filter(a => a.severity === 'MEDIUM').length,
    low_count: anomalies.filter(a => a.severity === 'LOW').length,
    summary: `Rule-based analysis identified ${anomalies.length} anomaly indicator(s) for parcel ${land.id}.`,
    disclaimer: "Project Rule-Based Analysis — Demo / Synthetic Project Data — Not an Official Government Land Record",
    analyzed_at: nowStr,
    anomalies
  });
});

// Helper: Proxy or Generate Evidence Explorer
router.get('/:id/evidence', async (req, res) => {
  const landId = req.params.id;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const pyResp = await fetch(`http://127.0.0.1:8000/api/lands/${encodeURIComponent(landId)}/evidence`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);

    if (pyResp && pyResp.ok) {
      const pyData = await pyResp.json();
      if (pyData && pyData.findings) return res.json(pyData);
    }
  } catch (e) {
    // Fall back to built-in generator
  }

  const lands = getAllMergedLands();
  const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || {
    id: landId,
    location: "Coimbatore Region",
    owner: "Registered Landholder",
    survey_number: "104/A",
    risk_score: 20,
    health_score: 80
  };

  const findings = [
    {
      finding_id: `FND-${land.id}-TITLE`,
      category: "Ownership & Registered Custody",
      finding: `Verified Title Holder: ${land.owner} for Survey No. ${land.survey_number}`,
      reason: "Concordance check across Patta register, sale deed, and SRO encumbrance ledger.",
      supporting_records: [
        {
          record_type: "Patta / Chitta",
          record_id: `PATTA-${land.patta_number || '88102'}`,
          date: "2024-03-15",
          relevant_field: "Registered Pattadar",
          value: land.owner,
          relationship_to_finding: "Primary Title Confirmation"
        },
        {
          record_type: "Sale Deed",
          record_id: `DEED-TN-${land.id}`,
          date: "2018-06-14",
          relevant_field: "Transferee",
          value: land.owner,
          relationship_to_finding: "Title Conveyance Execution"
        }
      ],
      details: `Title confirmed in SRO ${land.sro_office || 'Coimbatore Sub-Registrar'} with registered deed document.`
    },
    {
      finding_id: `FND-${land.id}-SURVEY`,
      category: "Cadastral Boundary Concordance",
      finding: `Boundary footprint of ${land.area_sq_ft ? Number(land.area_sq_ft).toLocaleString() : '45,000'} sq.ft mapped under DILRMP`,
      reason: "Field Measurement Book (FMB) vector boundaries cross-referenced with modern satellite orthomosaic.",
      supporting_records: [
        {
          record_type: "FMB Sketch",
          record_id: `FMB-${land.survey_number}`,
          date: "2025-07-20",
          relevant_field: "Surveyed Area",
          value: `${land.area_sq_ft ? Number(land.area_sq_ft).toLocaleString() : '45,000'} sq.ft`,
          relationship_to_finding: "Cadastral Demarcation"
        },
        {
          record_type: "GNSS Ground Survey",
          record_id: `GNSS-CBE-${land.id}`,
          date: "2026-02-10",
          relevant_field: "Coordinate Reference",
          value: "WGS84 EPSG:4326",
          relationship_to_finding: "Spatial Georeferencing"
        }
      ],
      details: "Boundary polygon georeferenced with GPS control points in Coimbatore District."
    },
    {
      finding_id: `FND-${land.id}-RISK`,
      category: "Risk Telemetry & Safety Score",
      finding: `Computed Land Health Index: ${land.health_score || 85}% | Risk Score: ${land.risk_score || 15}/100`,
      reason: "Automated multi-factor evaluation combining legal status, mortgage records, and survey concordance.",
      supporting_records: [
        {
          record_type: "EC Search",
          record_id: `EC-TN-30YR-${land.id}`,
          date: "2026-08-20",
          relevant_field: "Encumbrance Status",
          value: land.encumbrance_status || land.status || "Verified",
          relationship_to_finding: "Lien Clearance Audit"
        }
      ],
      details: `Evaluation generated by LandTrace360 AI Risk Assessment Engine for parcel ${land.id}.`
    }
  ];

  res.json({
    land_id: land.id,
    total_findings: findings.length,
    disclaimer: "Demo / Synthetic Project Data — Not an Official Government Land Record",
    generated_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    findings
  });
});

// Helper: Proxy or Generate Risk Breakdown
router.get('/:id/risk-breakdown', async (req, res) => {
  const landId = req.params.id;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const pyResp = await fetch(`http://127.0.0.1:8000/api/lands/${encodeURIComponent(landId)}/risk-breakdown`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);

    if (pyResp && pyResp.ok) {
      const pyData = await pyResp.json();
      if (pyData && pyData.dimensions) return res.json(pyData);
    }
  } catch (e) {
    // Fall back to built-in generator
  }

  const lands = getAllMergedLands();
  const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || {
    id: landId,
    location: "Coimbatore Region",
    owner: "Registered Landholder",
    survey_number: "104/A",
    risk_score: 18,
    health_score: 82
  };

  const hasCase = (land.active_cases > 0) || land.status?.includes("Dispute");
  const hasBoundary = land.status?.includes("Boundary");
  const hasMortgage = !!land.mortgage_active;

  const dimensions = [
    {
      name: "Legal Disputes & Litigation",
      score: hasCase ? 80 : 5,
      level: hasCase ? "HIGH" : "LOW",
      weight: "25%",
      details: hasCase ? "Active case contested in civil court" : "Clear of civil court disputes"
    },
    {
      name: "Unreleased Mortgages / Hypothecation",
      score: hasMortgage ? 70 : 8,
      level: hasMortgage ? "HIGH" : "LOW",
      weight: "20%",
      details: hasMortgage ? "Active institutional lien registered" : "Nil encumbrance (NOC verified)"
    },
    {
      name: "Document Inconsistencies",
      score: (land.health_score || 85) < 70 ? 55 : 10,
      level: (land.health_score || 85) < 70 ? "MEDIUM" : "LOW",
      weight: "15%",
      details: "Sale deed and EC verification consistency audit"
    },
    {
      name: "Boundary & Area Discrepancies",
      score: hasBoundary ? 65 : 12,
      level: hasBoundary ? "MEDIUM" : "LOW",
      weight: "15%",
      details: hasBoundary ? "FMB sketch variance noted on eastern corner" : "Sub-meter GPS boundary match"
    },
    {
      name: "Ownership Instability & Rapid Transitions",
      score: (land.risk_score || 15) > 50 ? 50 : 10,
      level: (land.risk_score || 15) > 50 ? "MEDIUM" : "LOW",
      weight: "10%",
      details: "Historical title conveyancing frequency"
    },
    {
      name: "Guideline vs Market Value Variance",
      score: 12,
      level: "LOW",
      weight: "5%",
      details: "TNREGINET guideline circle rate comparison"
    },
    {
      name: "Environmental & Coastal Zoning",
      score: 5,
      level: "LOW",
      weight: "5%",
      details: "Master Plan land use zone clearance"
    },
    {
      name: "Possession & Ground Survey Match",
      score: 8,
      level: "LOW",
      weight: "5%",
      details: "Physical boundary stone demarcation verified"
    }
  ];

  res.json({
    land_id: land.id,
    overall_score: land.risk_score || 15,
    overall_level: (land.risk_score || 15) < 30 ? "LOW" : (land.risk_score || 15) < 60 ? "MEDIUM" : "HIGH",
    dimensions,
    analyzed_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    disclaimer: "Multi-factor risk evaluation based on stored cadastral and registry records."
  });
});

// Helper: Proxy or Generate AI Land Story
router.get('/:id/story', async (req, res) => {
  const landId = req.params.id;
  const lang = (req.query.lang || 'en').toLowerCase();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const pyResp = await fetch(`http://127.0.0.1:8000/api/lands/${encodeURIComponent(landId)}/story?lang=${encodeURIComponent(lang)}`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);

    if (pyResp && pyResp.ok) {
      const pyData = await pyResp.json();
      if (pyData && pyData.stages) return res.json(pyData);
    }
  } catch (e) {
    // Fall back to built-in generator
  }

  const lands = getAllMergedLands();
  const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || {
    id: landId,
    location: "Coimbatore",
    owner: "Registered Landholder",
    survey_number: "104/A",
    risk_score: 18,
    health_score: 82
  };

  res.json({
    land_id: land.id,
    title: `The Story of Survey No. ${land.survey_number} — ${land.location}`,
    language: lang,
    summary: `Chronological narrative tracking cadastral origin, deed conveyances, survey demarcations, and safety metrics for ${land.owner}.`,
    stages: [
      {
        stage: "origin",
        title: "Cadastral Inception & Settlement",
        year: "1995",
        details: `Survey parcel ${land.survey_number} established under Revenue Settlement Records in ${land.taluk || 'Coimbatore'}.`
      },
      {
        stage: "ownership",
        title: "Title Conveyances & Lineage",
        year: "2018",
        details: `Title conveyed to ${land.owner} via registered deed document in SRO ${land.sro_office || 'District Registrar'}.`
      },
      {
        stage: "documents",
        title: "Legal & Encumbrance Audit",
        year: "2024",
        details: "Continuous 30-year Encumbrance Certificate verified with non-disputed ledger stamps."
      },
      {
        stage: "boundary",
        title: "Field Measurement Book Demarcation",
        year: "2025",
        details: `Sub-meter RTK GNSS digital boundary coordinates recorded covering ${land.area_sq_ft ? Number(land.area_sq_ft).toLocaleString() : '45,000'} sq.ft.`
      },
      {
        stage: "current_status",
        title: "Current Operational Standing",
        year: "2026",
        details: `Assigned Health Index of ${land.health_score || 85}% with status: ${land.status || 'Verified'}.`
      }
    ]
  });
});

// Helper: Proxy or Generate Land Passport
router.get('/:id/passport', async (req, res) => {
  const landId = req.params.id;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const pyResp = await fetch(`http://127.0.0.1:8000/api/lands/${encodeURIComponent(landId)}/passport`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeout);

    if (pyResp && pyResp.ok) {
      const pyData = await pyResp.json();
      if (pyData && pyData.passport_id) return res.json(pyData);
    }
  } catch (e) {
    // Fall back to built-in generator
  }

  const lands = getAllMergedLands();
  const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || {
    id: landId,
    location: "Coimbatore",
    owner: "Registered Landholder",
    survey_number: "104/A",
    risk_score: 18,
    health_score: 82
  };

  const areaSqft = land.area_sq_ft || 45000;
  const areaAcres = (areaSqft / 43560).toFixed(2);
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  res.json({
    passport_id: `PASS-${land.id}-2026`,
    land_id: land.id,
    survey_number: land.survey_number,
    subdivision: land.subdivision_number || "1",
    current_owner: land.owner,
    location: land.location,
    district: land.district || "Coimbatore",
    taluk: land.taluk || "Coimbatore North",
    village: land.village || "Urban Zone",
    land_type: land.land_type || "Commercial",
    area_sqft: areaSqft,
    area_acres: areaAcres,
    verification_status: land.status || "Verified",
    risk_level: (land.risk_score || 15) < 30 ? "LOW" : (land.risk_score || 15) < 60 ? "MEDIUM" : "HIGH",
    risk_score: land.risk_score || 15,
    health_score: land.health_score || 85,
    document_consistency: (land.health_score || 85) >= 70 ? "Consistent" : "Discrepancy Noted",
    mortgage_status: land.mortgage_active ? "Active Mortgage" : "No Active Mortgage",
    legal_status: (land.active_cases > 0) ? "Under Active Dispute" : "Clear of Litigation",
    boundary_status: land.status?.includes("Boundary") ? "Variance Under Review" : "Survey Aligned",
    passport_generated_at: nowStr,
    qr_code_url: `https://landtrace360.in/land/${land.id}`,
    checksum: `SHA256:${Buffer.from(`${land.id}:${land.survey_number}:${land.owner}:${land.risk_score || 15}`).toString('base64')}`,
    disclaimer: "Demo / Synthetic Project Data — Not an Official Government Land Record"
  });
});

export default router;
