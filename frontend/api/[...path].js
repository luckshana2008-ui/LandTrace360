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

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
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
      if (pathname === '/health' || pathname === '/api/health' || pathname === '/') {
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

      if (pathname === '/api/auth/google' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const email = (body.email || 'google.user@gmail.com').trim().toLowerCase();
        const name = body.name || body.full_name || email.split('@')[0];
        const picture = body.picture || body.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        const role = email.includes('admin') || email.includes('officer') ? 'investigator' : 'buyer';

        const googleToken = `cf_google_jwt_${btoa(`${email}:${role}:${Date.now()}`)}`;
        return jsonResponse({
          token: googleToken,
          access_token: googleToken,
          token_type: 'bearer',
          authenticated: true,
          auth_provider: 'google',
          user: {
            id: `usr-google-${Date.now().toString().slice(-6)}`,
            email,
            name,
            full_name: name,
            picture,
            role,
            email_verified: true
          },
          message: 'Authenticated successfully with Google Account on Cloudflare Edge.'
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

      const riskBreakdownMatch = pathname.match(/^\/api\/lands\/([^/]+)\/risk-breakdown$/);
      if (riskBreakdownMatch && method === 'GET') {
        const landId = decodeURIComponent(riskBreakdownMatch[1]);
        const lands = getAllLands();
        const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || { id: landId, risk_score: 18, health_score: 82 };
        const hasCase = (land.active_cases > 0) || land.status?.includes("Dispute");
        const hasBoundary = land.status?.includes("Boundary");
        const hasMortgage = !!land.mortgage_active;

        const dimensions = [
          { name: "Legal Disputes & Litigation", score: hasCase ? 80 : 5, level: hasCase ? "HIGH" : "LOW", weight: "25%", details: hasCase ? "Active case contested in civil court" : "Clear of civil court disputes" },
          { name: "Unreleased Mortgages / Hypothecation", score: hasMortgage ? 70 : 8, level: hasMortgage ? "HIGH" : "LOW", weight: "20%", details: hasMortgage ? "Active institutional lien registered" : "Nil encumbrance (NOC verified)" },
          { name: "Document Inconsistencies", score: (land.health_score || 85) < 70 ? 55 : 10, level: (land.health_score || 85) < 70 ? "MEDIUM" : "LOW", weight: "15%", details: "Sale deed and EC verification consistency audit" },
          { name: "Boundary & Area Discrepancies", score: hasBoundary ? 65 : 12, level: hasBoundary ? "MEDIUM" : "LOW", weight: "15%", details: hasBoundary ? "FMB sketch variance noted on eastern corner" : "Sub-meter GPS boundary match" },
          { name: "Ownership Instability & Rapid Transitions", score: (land.risk_score || 15) > 50 ? 50 : 10, level: (land.risk_score || 15) > 50 ? "MEDIUM" : "LOW", weight: "10%", details: "Historical title conveyancing frequency" },
          { name: "Guideline vs Market Value Variance", score: 12, level: "LOW", weight: "5%", details: "TNREGINET guideline circle rate comparison" },
          { name: "Environmental & Coastal Zoning", score: 5, level: "LOW", weight: "5%", details: "Master Plan land use zone clearance" },
          { name: "Possession & Ground Survey Match", score: 8, level: "LOW", weight: "5%", details: "Physical boundary stone demarcation verified" }
        ];

        return jsonResponse({
          land_id: land.id,
          overall_score: land.risk_score || 15,
          overall_level: (land.risk_score || 15) < 30 ? "LOW" : (land.risk_score || 15) < 60 ? "MEDIUM" : "HIGH",
          dimensions,
          analyzed_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          disclaimer: "Multi-factor risk evaluation based on stored cadastral and registry records."
        });
      }

      const storyMatch = pathname.match(/^\/api\/lands\/([^/]+)\/story$/);
      if (storyMatch && method === 'GET') {
        const landId = decodeURIComponent(storyMatch[1]);
        const lands = getAllLands();
        const land = lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) || { id: landId, owner: "Registered Landholder", location: "Coimbatore", survey_number: "104/A", risk_score: 15, health_score: 85 };

        return jsonResponse({
          land_id: land.id,
          survey_number: land.survey_number,
          overall_verdict: (land.risk_score || 15) < 30 ? "SAFE_TO_PURCHASE" : (land.risk_score || 15) < 60 ? "MODERATE_DUE_DILIGENCE_REQUIRED" : "HIGH_RISK_SUSPECT",
          summary: `Comprehensive chronological narrative for Survey No. ${land.survey_number} in ${land.location}, Coimbatore. Property exhibits strong historical continuity with ${land.status || 'Verified'} tenure.`,
          stages: [
            { stage_number: 1, title: "Historical Ownership & Origin", period: "1988 - 2012", tone: "POSITIVE", description: `Originally agricultural Punja land held by ancestral farming families in Coimbatore. Cadastral FMB demarcated.` },
            { stage_number: 2, title: "Zoning & Land Use Transition", period: "2012 - 2020", tone: "NEUTRAL", description: `Re-designated under Coimbatore Local Planning Authority (LPA) master plan with guideline valuations indexed.` },
            { stage_number: 3, title: "Current Custody & Integrity Assessment", period: "2020 - Present", tone: (land.risk_score || 15) < 30 ? "POSITIVE" : "ATTENTION_REQUIRED", description: `Title currently registered under ${land.owner}. Land Health Index stands at ${land.health_score || 85}%.` }
          ]
        });
      }

      const historyMatch = pathname.match(/^\/api\/lands\/([^/]+)\/history$/);
      if (historyMatch && method === 'GET') {
        const landId = decodeURIComponent(historyMatch[1]).toUpperCase();
        if (legacyRecords.history && legacyRecords.history[landId]) {
          return jsonResponse(legacyRecords.history[landId]);
        }
        const land = getAllLands().find(l => l.id.toUpperCase() === landId);
        return jsonResponse([
          { year: 2012, owner: "Ancestral Family Settlement", status: "Agricultural Punja", transactions: 0, risk_score: 10, boundary_status: "FMB Surveyed" },
          { year: 2018, owner: land?.owner || "Prior Registered Entity", status: "Converted Commercial/Mixed", transactions: 1, risk_score: land?.risk_score ? Math.round(land.risk_score * 0.8) : 15, boundary_status: "Stone Bound" },
          { year: 2026, owner: land?.owner || "Current Owner", status: land?.status || "Verified", transactions: 2, risk_score: land?.risk_score || 12, boundary_status: "Digital GPS Demarcated" }
        ]);
      }

      const ownersMatch = pathname.match(/^\/api\/lands\/([^/]+)\/owners$/);
      if (ownersMatch && method === 'GET') {
        const landId = decodeURIComponent(ownersMatch[1]).toUpperCase();
        if (legacyRecords.owners && legacyRecords.owners[landId]) {
          return jsonResponse(legacyRecords.owners[landId]);
        }
        const land = getAllLands().find(l => l.id.toUpperCase() === landId);
        return jsonResponse([
          { name: land?.owner || "Current Registered Owner", period: "2018 - Present", type: "Registered Title Holder" },
          { name: "Prior Landholder / Pattadar", period: "1995 - 2018", type: "Settlement Deed" }
        ]);
      }

      const documentsMatch = pathname.match(/^\/api\/lands\/([^/]+)\/documents$/);
      if (documentsMatch && method === 'GET') {
        const landId = decodeURIComponent(documentsMatch[1]).toUpperCase();
        if (legacyRecords.documents && legacyRecords.documents[landId]) {
          return jsonResponse(legacyRecords.documents[landId]);
        }
        const land = getAllLands().find(l => l.id.toUpperCase() === landId);
        return jsonResponse([
          { doc_no: `DOC-TN-${landId}-01`, type: "Sale Deed & Title Registration", date: "2018-06-14", verification: "Verified", result: "Match" },
          { doc_no: `EC-${land?.patta_number || '88102'}`, type: "Encumbrance Certificate (1985-2026)", date: "2026-08-20", verification: "Verified", result: "Match" },
          { doc_no: `FMB-${land?.survey_number || '412'}`, type: "Field Measurement Book (FMB Sketch)", date: "2024-03-10", verification: "Verified", result: "Match" }
        ]);
      }

      const casesMatch = pathname.match(/^\/api\/lands\/([^/]+)\/cases$/);
      if (casesMatch && method === 'GET') {
        const landId = decodeURIComponent(casesMatch[1]).toUpperCase();
        if (legacyRecords.cases && legacyRecords.cases[landId]) {
          return jsonResponse(legacyRecords.cases[landId]);
        }
        const land = getAllLands().find(l => l.id.toUpperCase() === landId);
        if (land && land.active_cases > 0) {
          return jsonResponse([
            { case_no: `OS-104/2024`, court: "Coimbatore District Commercial Court", status: "Active Hearing", type: "Partition & Recovery Dispute", filing_date: "2024-04-12" }
          ]);
        }
        return jsonResponse([]);
      }

      const mortgagesMatch = pathname.match(/^\/api\/lands\/([^/]+)\/mortgages$/);
      if (mortgagesMatch && method === 'GET') {
        const landId = decodeURIComponent(mortgagesMatch[1]).toUpperCase();
        if (legacyRecords.mortgages && legacyRecords.mortgages[landId]) {
          return jsonResponse(legacyRecords.mortgages[landId]);
        }
        const land = getAllLands().find(l => l.id.toUpperCase() === landId);
        if (land && land.mortgage_active) {
          return jsonResponse([
            { bank: "State Bank of India (Coimbatore Main)", amount: "₹18,500,000", status: "Active Hypothecation", registered_date: "2022-03-15" }
          ]);
        }
        return jsonResponse([]);
      }

      const dnaMatch = pathname.match(/^\/api\/lands\/([^/]+)\/dna$/);
      if (dnaMatch && method === 'GET') {
        const landId = decodeURIComponent(dnaMatch[1]).toUpperCase();
        if (legacyRecords.dna && legacyRecords.dna[landId]) {
          return jsonResponse(legacyRecords.dna[landId]);
        }
        const land = getAllLands().find(l => l.id.toUpperCase() === landId);
        return jsonResponse({
          land_id: landId,
          ownership_stability: (land?.risk_score || 15) < 25 ? 90 : 50,
          document_health: land?.health_score || 85,
          legal_safety: (land?.active_cases || 0) > 0 ? 30 : 95,
          mortgage_status: land?.mortgage_active ? 40 : 95,
          boundary_stability: land?.status?.includes("Boundary") ? 45 : 90,
          overall_health: land?.health_score || 85
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


      // ── SEARCH ENDPOINT ──
      if (pathname === '/api/search' && method === 'GET') {
        const q = (url.searchParams.get('q') || '').toLowerCase();
        const lands = getAllLands();
        const results = lands.filter(l =>
          l.id.toLowerCase().includes(q) ||
          (l.location && l.location.toLowerCase().includes(q)) ||
          (l.survey_number && l.survey_number.toLowerCase().includes(q)) ||
          (l.owner && l.owner.toLowerCase().includes(q)) ||
          (l.village && l.village.toLowerCase().includes(q)) ||
          (l.taluk && l.taluk.toLowerCase().includes(q))
        );
        return jsonResponse({ count: results.length, query: q, results });
      }

      // ── SAVED LANDS ──
      if (pathname === '/api/saved-lands' && method === 'GET') {
        return jsonResponse(legacyRecords.saved_lands || ["LND-1001", "CBE-LND-2001"]);
      }

      const saveLandMatch = pathname.match(/^\/api\/saved-lands\/([^/]+)$/);
      if (saveLandMatch && (method === 'POST' || method === 'DELETE')) {
        const id = decodeURIComponent(saveLandMatch[1]).toUpperCase();
        let list = legacyRecords.saved_lands || ["LND-1001", "CBE-LND-2001"];
        if (method === 'DELETE' || list.includes(id)) {
          list = list.filter(item => item !== id);
        } else {
          list.push(id);
        }
        legacyRecords.saved_lands = list;
        return jsonResponse({ saved: list.includes(id), saved_lands: list });
      }

      // ── LOAN CLOSURE VERIFICATION ──
      const loanMatch = pathname.match(/^\/api\/loan-closure-verification\/([^/]+)$/);
      if (loanMatch && method === 'GET') {
        const docNo = decodeURIComponent(loanMatch[1]);
        return jsonResponse({
          verification_status: "VERIFIED_CLOSED",
          document_number: docNo,
          bank: "State Bank of India / Commercial Mortgage Registry",
          closure_date: "2026-05-18",
          no_objection_certificate: "NOC-SBI-CBE-99410",
          encumbrance_released: true,
          risk_cleared: true,
          message: `Loan clearance confirmed. Hypothecation on document ${docNo} has been officially satisfied and struck from registry.`
        });
      }

      // ── LANDTRACE AI CHATBOT ──
      if (pathname === '/api/chat/suggestions' && method === 'GET') {
        const landId = url.searchParams.get('land_id');
        const lands = getAllLands();
        const targetedLand = landId ? lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) : null;

        return jsonResponse({
          land_id: targetedLand?.id || null,
          suggestions: targetedLand ? [
            `Who owns ${targetedLand.id}?`,
            `Why is ${targetedLand.id} risk scored at ${targetedLand.risk_score || 15}?`,
            `Does ${targetedLand.id} have a mortgage?`,
            `What legal cases are associated with ${targetedLand.id}?`,
            `What documents are available for ${targetedLand.id}?`,
            `Show evidence for the risk`,
            `Give me a complete summary of ${targetedLand.id}`
          ] : [
            'What lands are currently for sale?',
            'Which lands have high risk scores?',
            'Who owns LND-1001?',
            'Why is LND-1004 high risk?',
            'Does LND-1006 have a mortgage?',
            'What happened to LND-1001 over time?'
          ]
        });
      }

      if ((pathname === '/api/chat' || pathname === '/chat') && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const message = body.message || '';
        const landId = body.land_id;
        const lands = getAllLands();
        const targetedLand = landId ? lands.find(l => l.id.toLowerCase() === landId.toLowerCase()) : null;
        const q = message.toLowerCase();

        let answer = '';
        let why = 'Verified from stored cadastral registry and land integrity records.';
        let evidence = [];
        let sources = ['Cadastral Survey Records', 'TNREGINET Registry', 'DILRMP'];
        let intent = 'general_query';

        if (targetedLand) {
          if (q.includes('owner') || q.includes('who owns')) {
            intent = 'owner_inquiry';
            answer = `The recorded registered owner of **${targetedLand.id}** (${targetedLand.survey_number}) is **${targetedLand.owner}**.`;
            why = `Title confirmed against registered patta records and deed documentation.`;
            evidence = [
              { type: 'Registered Owner', value: targetedLand.owner },
              { type: 'Survey Number', value: targetedLand.survey_number },
              { type: 'Patta Number', value: targetedLand.patta_number || '88102' }
            ];
          } else if (q.includes('risk') || q.includes('why')) {
            intent = 'risk_inquiry';
            answer = `The current evaluated risk score for **${targetedLand.id}** is **${targetedLand.risk_score || 15}/100** (${(targetedLand.risk_score || 15) >= 50 ? 'HIGH' : (targetedLand.risk_score || 15) >= 30 ? 'MEDIUM' : 'LOW'} risk). Land Health Index stands at **${targetedLand.health_score || 85}/100**.`;
            why = (targetedLand.risk_score || 15) >= 50 ? 'Active legal cases or boundary disputes increase evaluated risk.' : 'Property exhibits clean title, clear boundary survey, and no active litigation.';
            evidence = [
              { type: 'Risk Score', value: `${targetedLand.risk_score || 15}/100` },
              { type: 'Health Score', value: `${targetedLand.health_score || 85}/100` },
              { type: 'Legal Status', value: (targetedLand.active_cases > 0) ? 'Active Litigation' : 'Clear of Disputes' }
            ];
          } else if (q.includes('mortgage') || q.includes('loan')) {
            intent = 'mortgage_inquiry';
            answer = targetedLand.mortgage_active ? `**${targetedLand.id}** has an active bank mortgage registered with institutional lenders.` : `**${targetedLand.id}** has no active mortgages registered. Prior charges are discharged.`;
            why = 'Mortgage and hypothecation status confirmed against Sub-Registrar encumbrance certificate (EC) search.';
            evidence = [
              { type: 'Mortgage Status', value: targetedLand.mortgage_active ? 'Active Mortgage' : 'Clear / Released' }
            ];
          } else if (q.includes('case') || q.includes('legal') || q.includes('dispute')) {
            intent = 'legal_inquiry';
            answer = (targetedLand.active_cases > 0) ? `Active civil litigation is recorded for **${targetedLand.id}** regarding boundary and partition claims.` : `No active civil or criminal court disputes are recorded for **${targetedLand.id}**.`;
            why = 'Civil e-Courts and district commercial court records queried.';
            evidence = [
              { type: 'Active Cases', value: String(targetedLand.active_cases || 0) }
            ];
          } else {
            answer = `Parcel **${targetedLand.id}** (${targetedLand.survey_number}) is located in ${targetedLand.location}, ${targetedLand.district || 'Coimbatore'}. Area: ${Number(targetedLand.area_sq_ft || 45000).toLocaleString()} sq.ft. Status: ${targetedLand.status || 'Verified'}.`;
            why = 'Primary cadastral profile retrieved from database.';
            evidence = [
              { type: 'Survey Number', value: targetedLand.survey_number },
              { type: 'Location', value: targetedLand.location },
              { type: 'Owner', value: targetedLand.owner }
            ];
          }
        } else {
          if (q.includes('sale') || q.includes('buy') || q.includes('available')) {
            const forSaleLands = lands.filter(l => l.is_for_sale);
            answer = `There are currently **${forSaleLands.length}** parcels listed for sale in the marketplace, including ${forSaleLands.slice(0, 3).map(l => l.id).join(', ')}.`;
            why = 'Marketplace listing query across entire repository.';
          } else {
            answer = `LandTrace AI is connected to ${lands.length} cadastral parcels. You can ask about ownership, risk scores, mortgages, legal cases, boundaries, or complete land summaries.`;
            why = 'General assistant response grounded in LandTrace360 data.';
          }
        }

        return jsonResponse({
          answer,
          why,
          evidence,
          sources,
          land_id: targetedLand?.id || null,
          intent,
          suggested_questions: targetedLand ? [
            `Who owns ${targetedLand.id}?`,
            `Why is ${targetedLand.id} risk scored at ${targetedLand.risk_score || 15}?`,
            `Does ${targetedLand.id} have a mortgage?`,
            `What legal cases are associated with ${targetedLand.id}?`,
            `Give me a complete summary of ${targetedLand.id}`
          ] : [
            'What lands are currently for sale?',
            'Which lands have high risk scores?',
            'Who owns LND-1001?',
            'Why is LND-1004 high risk?',
            'Does LND-1006 have a mortgage?'
          ]
        });
      }

      // Fallback 404
      return jsonResponse({ error: `Route ${pathname} not found on Cloudflare Worker.` }, 404);

    } catch (err) {
      return jsonResponse({ error: 'Worker internal exception', details: err.message }, 500);
    }
}
