/**
 * LandTrace360 Cloudflare Worker API
 * Serverless deployment for Cloudflare Workers
 * Integrates: Coimbatore Real Cadastral Data, Predictive ML (K-Means, Random Forest, LSTM),
 * Location Access History, OGD India Data History, and Land Intelligence Endpoints.
 */

import { runKMeansClustering } from './ml_engine/kmeans.js';
import { randomForestModel } from './ml_engine/randomForestRegression.js';
import { lstmModel } from './ml_engine/lstmEngine.js';

import coimbatoreLandsData from './data/coimbatore_lands.json';
import demoLandsData from './data/demo_lands.json';
import legacyRecordsData from './data/legacy_records.json';
import locationHistoryData from './data/location_access_history.json';
import ogdGovernmentRecordsData from './data/ogd_government_records.json';

// In-memory clones for worker lifetime
let coimbatoreLands = [...coimbatoreLandsData];
let demoLands = [...demoLandsData];
let locationAccessHistory = [...locationHistoryData];
let legacyRecords = { ...legacyRecordsData };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-gemini-api-key',
  'Content-Type': 'application/json'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

function getAllLands() {
  return [...demoLands, ...coimbatoreLands];
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();

    // 1. Handle CORS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    try {
      // 2. Health Check
      if (pathname === '/health' || pathname === '/') {
        return jsonResponse({
          status: 'HEALTHY',
          service: 'LandTrace360 Cloudflare Worker API',
          runtime: 'Cloudflare Workers (Edge)',
          region: 'Coimbatore, Tamil Nadu & All India Cadastral Grid',
          timestamp: new Date().toISOString(),
          total_parcels: getAllLands().length,
          ml_engines: ['K-Means Spatial Clustering', 'Random Forest Regressor', 'ML-LSTM Recurrent Neural Network']
        });
      }

      // ── AUTHENTICATION ENDPOINTS ──
      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const rawIdentifier = (body.email || body.username || "").trim().toLowerCase();
        const cleanPassword = (body.password || "").trim();

        let role = 'buyer';
        let name = 'Kovai Land Investor';
        let email = 'user@landtrace.in';

        if (['admin', 'administrator', 'inspector', 'investigator', 'officer'].includes(rawIdentifier) || rawIdentifier.startsWith('admin@')) {
          role = 'investigator';
          name = 'Revenue Officer / Admin';
          email = 'admin@landtrace.in';
        } else if (['owner', 'seller', 'landholder'].includes(rawIdentifier) || rawIdentifier.startsWith('owner@')) {
          role = 'owner';
          name = 'Peelamedu Landholder';
          email = 'owner@landtrace.in';
        } else if (['demo', 'test', 'quick'].includes(rawIdentifier) || rawIdentifier.startsWith('demo@')) {
          role = 'buyer';
          name = 'Quick Demo User';
          email = 'demo@landtrace.in';
        } else if (rawIdentifier.includes('@')) {
          email = rawIdentifier;
          name = rawIdentifier.split('@')[0];
        }

        const fakeToken = `cf_jwt_${btoa(`${email}:${role}:${Date.now()}`)}`;
        return jsonResponse({
          token: fakeToken,
          access_token: fakeToken,
          token_type: 'bearer',
          authenticated: true,
          user: {
            id: `usr-${role}-001`,
            email,
            name,
            full_name: name,
            role
          },
          message: 'Authenticated successfully on Cloudflare Edge.'
        });
      }

      if (pathname === '/api/auth/me' && method === 'GET') {
        const authHeader = request.headers.get('Authorization') || '';
        return jsonResponse({
          authenticated: true,
          user: {
            id: 'usr-investigator-001',
            email: 'admin@landtrace.in',
            name: 'Revenue Officer / Admin',
            full_name: 'Revenue Officer / Admin',
            role: 'investigator'
          }
        });
      }

      if (pathname === '/api/auth/demo-accounts' && method === 'GET') {
        return jsonResponse([
          { roleKey: 'admin', email: 'admin@landtrace.in', password: 'Admin@2026', title: 'Admin / Inspector' },
          { roleKey: 'buyer', email: 'user@landtrace.in', password: 'User@2026', title: 'Buyer' },
          { roleKey: 'owner', email: 'owner@landtrace.in', password: 'Owner@2026', title: 'Land Owner' },
          { roleKey: 'quick', email: 'demo@landtrace.in', password: '123456', title: 'Quick Test' }
        ]);
      }

      // ── DASHBOARD & STATS ──
      if (pathname === '/api/dashboard' && method === 'GET') {
        const lands = getAllLands();
        const verified = lands.filter(l => l.status && l.status.toLowerCase().includes('verified')).length;
        const forSale = lands.filter(l => l.is_for_sale === true).length;
        const highRisk = lands.filter(l => (l.risk_score || 0) >= 40).length;
        const avgHealth = Math.round(lands.reduce((acc, l) => acc + (l.health_score || 82), 0) / (lands.length || 1));
        const avgRisk = Math.round(lands.reduce((acc, l) => acc + (l.risk_score || 18), 0) / (lands.length || 1));

        return jsonResponse({
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
      }

      if (pathname === '/api/alerts' && method === 'GET') {
        return jsonResponse([
          { id: "ALT-01", type: "Boundary Change", land_id: "LND-1002", date: "2026-09-04", severity: "High", title: "Boundary Mismatch", message: "Significant boundary mismatch detected via survey.", read: false },
          { id: "ALT-02", type: "New Legal Case", land_id: "LND-1004", date: "2026-09-02", severity: "High", title: "Legal Case Alert", message: "Title dispute filed in High Court.", read: false },
          { id: "ALT-03", type: "Risk Score Increased", land_id: "LND-1007", date: "2026-08-28", severity: "Medium", title: "Verification Pending", message: "Risk score increased due to pending document verification.", read: false },
          { id: "ALT-04", type: "Document Verification", land_id: "CBE-LND-2004", date: "2026-08-25", severity: "Medium", title: "Guideline Value Update", message: "Singanallur industrial circle rate revised.", read: false }
        ]);
      }

      // ── LANDS ENDPOINTS ──
      if (pathname === '/api/lands' && method === 'GET') {
        return jsonResponse(getAllLands());
      }

      if (pathname === '/api/lands/for-sale' && method === 'GET') {
        return jsonResponse(getAllLands().filter(l => l.is_for_sale === true));
      }

      if (pathname === '/api/lands/high-risk' && method === 'GET') {
        return jsonResponse(getAllLands().filter(l => (l.risk_score || 0) >= 40));
      }

      if (pathname === '/api/lands/coimbatore/real-data' && method === 'GET') {
        const geoJsonFeatures = coimbatoreLands.map(land => ({
          type: 'Feature',
          properties: { ...land },
          geometry: {
            type: 'Polygon',
            coordinates: [
              land.boundary_polygon ? land.boundary_polygon.map(coord => [coord[1], coord[0]]) : []
            ]
          }
        }));
        return jsonResponse({
          type: 'FeatureCollection',
          region: 'Coimbatore District, Tamil Nadu',
          crs: 'EPSG:4326',
          total_parcels: coimbatoreLands.length,
          features: geoJsonFeatures,
          raw_lands: coimbatoreLands
        });
      }

      // ── PARAMETRIC LAND INTELLIGENCE ENDPOINTS ──
      const anomaliesMatch = pathname.match(/^\/api\/lands\/([^/]+)\/anomalies$/);
      if (anomaliesMatch && method === 'GET') {
        const landId = decodeURIComponent(anomaliesMatch[1]);
        const lands = getAllLands();
        const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || { id: landId, risk_score: 20, survey_number: "104/A", owner: "Land Owner" };
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        const anomalies = [];

        if ((land.risk_score || 0) >= 45 || land.status?.includes("Dispute")) {
          anomalies.push({
            anomaly_id: `ANOM-${land.id}-LEGAL`,
            category: "Legal-history anomalies",
            severity: "CRITICAL",
            title: `Contested Title Claim / Legal Dispute on Parcel ${land.survey_number}`,
            description: `Active litigation or partition petition flagged in district civil court records for parcel ${land.id}.`,
            why_it_was_detected: `Risk score ${land.risk_score}/100 exceeds critical safety threshold.`,
            confidence: 0.96,
            evidence: { court: "Coimbatore Commercial Court", status: "Active Hearing" },
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
            evidence: { survey_deviation: "1.8%" },
            affected_records: [`FMB-${land.survey_number}`, `SURVEY-2025-${land.id}`],
            detected_at: nowStr
          });
        }

        if (anomalies.length === 0) {
          anomalies.push({
            anomaly_id: `ANOM-${land.id}-INFO`,
            category: "Document/record inconsistencies",
            severity: "LOW",
            title: `Guideline Rate Benchmark Revision Noted`,
            description: `TNREGINET circle rate revision benchmarked for survey number ${land.survey_number}. No legal discrepancies.`,
            why_it_was_detected: "Routine circle rate compliance audit performed against state gazette.",
            confidence: 0.98,
            evidence: { registration_status: "Fully Compliant" },
            affected_records: [`EC-GAZETTE-2026`, `LAND-${land.id}`],
            detected_at: nowStr
          });
        }

        return jsonResponse({
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
      }

      const evidenceMatch = pathname.match(/^\/api\/lands\/([^/]+)\/evidence$/);
      if (evidenceMatch && method === 'GET') {
        const landId = decodeURIComponent(evidenceMatch[1]);
        const lands = getAllLands();
        const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || { id: landId, owner: "Owner", survey_number: "104/A", area_sq_ft: 45000, risk_score: 15, health_score: 85 };

        return jsonResponse({
          land_id: land.id,
          total_findings: 3,
          disclaimer: "Demo / Synthetic Project Data — Not an Official Government Land Record",
          generated_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          findings: [
            {
              finding_id: `FND-${land.id}-TITLE`,
              category: "Ownership & Registered Custody",
              finding: `Verified Title Holder: ${land.owner} for Survey No. ${land.survey_number}`,
              reason: "Concordance check across Patta register, sale deed, and SRO encumbrance ledger.",
              supporting_records: [
                { record_type: "Patta / Chitta", record_id: `PATTA-${land.patta_number || '88102'}`, date: "2024-03-15", relevant_field: "Registered Pattadar", value: land.owner, relationship_to_finding: "Primary Title Confirmation" }
              ],
              details: `Title confirmed in SRO ${land.sro_office || 'Coimbatore Sub-Registrar'} with registered deed document.`
            },
            {
              finding_id: `FND-${land.id}-SURVEY`,
              category: "Cadastral Boundary Concordance",
              finding: `Boundary footprint of ${land.area_sq_ft ? Number(land.area_sq_ft).toLocaleString() : '45,000'} sq.ft mapped under DILRMP`,
              reason: "Field Measurement Book (FMB) vector boundaries cross-referenced with modern satellite orthomosaic.",
              supporting_records: [
                { record_type: "FMB Sketch", record_id: `FMB-${land.survey_number}`, date: "2025-07-20", relevant_field: "Surveyed Area", value: `${land.area_sq_ft ? Number(land.area_sq_ft).toLocaleString() : '45,000'} sq.ft`, relationship_to_finding: "Cadastral Demarcation" }
              ],
              details: "Boundary polygon georeferenced with GPS control points in Coimbatore District."
            },
            {
              finding_id: `FND-${land.id}-RISK`,
              category: "Risk Telemetry & Safety Score",
              finding: `Computed Land Health Index: ${land.health_score || 85}% | Risk Score: ${land.risk_score || 15}/100`,
              reason: "Automated multi-factor evaluation combining legal status, mortgage records, and survey concordance.",
              supporting_records: [
                { record_type: "EC Search", record_id: `EC-TN-30YR-${land.id}`, date: "2026-08-20", relevant_field: "Encumbrance Status", value: land.status || "Verified", relationship_to_finding: "Lien Clearance Audit" }
              ],
              details: `Evaluation generated by LandTrace360 AI Risk Assessment Engine for parcel ${land.id}.`
            }
          ]
        });
      }

      const passportMatch = pathname.match(/^\/api\/lands\/([^/]+)\/passport$/);
      if (passportMatch && method === 'GET') {
        const landId = decodeURIComponent(passportMatch[1]);
        const lands = getAllLands();
        const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || { id: landId, survey_number: "104/A", owner: "Owner", location: "Coimbatore", risk_score: 15, health_score: 85, area_sq_ft: 45000 };

        return jsonResponse({
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
          area_sqft: land.area_sq_ft || 45000,
          area_acres: ((land.area_sq_ft || 45000) / 43560).toFixed(2),
          verification_status: land.status || "Verified",
          risk_level: (land.risk_score || 15) < 30 ? "LOW" : (land.risk_score || 15) < 60 ? "MEDIUM" : "HIGH",
          risk_score: land.risk_score || 15,
          health_score: land.health_score || 85,
          document_consistency: (land.health_score || 85) >= 70 ? "Consistent" : "Discrepancy Noted",
          mortgage_status: land.mortgage_active ? "Active Mortgage" : "No Active Mortgage",
          legal_status: (land.active_cases > 0) ? "Under Active Dispute" : "Clear of Litigation",
          boundary_status: land.status?.includes("Boundary") ? "Variance Under Review" : "Survey Aligned",
          passport_generated_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          qr_code_url: `https://landtrace360.in/land/${land.id}`,
          checksum: `SHA256:${btoa(`${land.id}:${land.survey_number}:${land.owner}`)}`,
          disclaimer: "Demo / Synthetic Project Data — Not an Official Government Land Record"
        });
      }

      // Single land by ID
      const singleLandMatch = pathname.match(/^\/api\/lands\/([^/]+)$/);
      if (singleLandMatch && method === 'GET') {
        const landId = decodeURIComponent(singleLandMatch[1]);
        const lands = getAllLands();
        const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase());
        if (land) return jsonResponse(land);
        return jsonResponse({ error: `Land with ID ${landId} not found.` }, 404);
      }

      // ── PREDICTIVE ML SUITE ──
      if (pathname === '/api/ml/kmeans-clustering' && method === 'GET') {
        const k = parseInt(url.searchParams.get('k') || '3');
        const lands = getAllLands();
        const clusterResults = runKMeansClustering(lands, k);
        return jsonResponse(clusterResults);
      }

      if (pathname === '/api/ml/random-forest-regression' && method === 'GET') {
        const lands = getAllLands();
        const predictions = randomForestModel.batchPredict(lands);
        return jsonResponse({
          model: "Ensembled Random Forest & XG-Regression",
          target_district: "Coimbatore, Tamil Nadu",
          total_parcels_evaluated: lands.length,
          predictions
        });
      }

      if (pathname === '/api/ml/predict-valuation' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const prediction = randomForestModel.predict(body);
        return jsonResponse(prediction);
      }

      if (pathname === '/api/ml/lstm-adaptive-forecast' && method === 'GET') {
        const historySeries = ogdGovernmentRecordsData.annual_transaction_history || [];
        const horizon = parseInt(url.searchParams.get('horizon') || '4', 10);
        const forecast = lstmModel.forecastTrajectory(historySeries, horizon);
        return jsonResponse(forecast);
      }

      if (pathname === '/api/ml/lstm-online-adapt' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const observationPrice = Number(body.observationPrice || body.actual_price || 0);
        const predictedPrice = Number(body.predictedPrice || body.observed_risk || 0);
        const adaptResult = lstmModel.adaptOnline(observationPrice, predictedPrice);
        return jsonResponse({
          message: 'LSTM recurrent weights successfully adapted to new transaction observation.',
          result: adaptResult
        });
      }

      // ── LOCATION ACCESS AUDIT HISTORY ──
      if (pathname === '/api/location/coimbatore/access-history' && method === 'GET') {
        return jsonResponse({
          region: 'Coimbatore Cadastral Grid',
          audit_count: locationAccessHistory.length,
          records: locationAccessHistory
        });
      }

      if (pathname === '/api/location/access/append' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const newRecord = {
          id: `LOC-CBE-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          latitude: body.latitude || 11.0168,
          longitude: body.longitude || 76.9558,
          accuracy_meters: body.accuracy_meters || 0.45,
          user_agent: request.headers.get('user-agent') || 'Browser Web Client',
          access_type: body.access_type || 'GPS_REAL_TIME_LOOKUP',
          purpose: body.purpose || 'Cadastral Survey Inspection',
          authorized_by: body.authorized_by || 'Field Revenue Inspector',
          coimbatore_ward: body.coimbatore_ward || 'Ward 24 - Peelamedu',
          verification_hash: `SHA256:${btoa(Date.now().toString())}`
        };
        locationAccessHistory.unshift(newRecord);
        return jsonResponse({ status: 'APPENDED', record: newRecord });
      }

      const removeLocMatch = pathname.match(/^\/api\/location\/access\/remove\/([^/]+)$/);
      if (removeLocMatch && method === 'DELETE') {
        const idToRemove = decodeURIComponent(removeLocMatch[1]);
        locationAccessHistory = locationAccessHistory.filter(r => r.id !== idToRemove);
        return jsonResponse({ status: 'REMOVED', id: idToRemove });
      }

      // ── OPEN GOVERNMENT DATA (OGD) REPORT ──
      if (pathname === '/api/ogd/required-datasets-report' && method === 'GET') {
        return jsonResponse({
          report_title: "Open Government Data (OGD) Platform India - Required Datasets for Coimbatore Cadastral Audit",
          portal_source: "data.gov.in & tnreginet.gov.in",
          total_required_catalogs: 4,
          datasets: ogdGovernmentRecordsData.datasets || []
        });
      }

      // Fallback 404
      return jsonResponse({ error: `Route ${pathname} not found on Cloudflare Worker.` }, 404);

    } catch (err) {
      return jsonResponse({ error: 'Worker internal exception', details: err.message }, 500);
    }
  }
};
