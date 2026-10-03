import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ogdRecordsPath = path.join(__dirname, '../data/ogd_government_records.json');

function getOgdData() {
  const data = fs.readFileSync(ogdRecordsPath, 'utf8');
  return JSON.parse(data);
}

// GET all OGD government land history and benchmark metrics
router.get('/coimbatore', (req, res) => {
  try {
    const data = getOgdData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve OGD India data', details: err.message });
  }
});

// GET list of required official datasets from data.gov.in for user report & synchronization
router.get('/required-datasets-report', (req, res) => {
  res.json({
    platform: "Open Government Data (OGD) Platform India (data.gov.in)",
    jurisdiction: "Coimbatore District, Tamil Nadu",
    report_generated: new Date().toISOString(),
    status: "Dataset Schema Configured — Live API Key / CSV Ingestion Ready",
    required_datasets: [
      {
        dataset_name: "DILRMP Cadastral Maps & Spatial Vector Shapefiles",
        ministry: "Ministry of Rural Development / Department of Land Resources (DoLR)",
        platform_url: "https://data.gov.in/resource/digital-india-land-records-modernization-programme-cadastral",
        format: "GeoJSON / Shapefile (.shp) / OGC WFS",
        purpose: "Real survey field boundaries, subdivision lines (FMB), and government Poramboke / waterbody demarcation across Coimbatore taluks.",
        integration_status: "Active (Local GeoJSON Seeded; API Hook Configured)"
      },
      {
        dataset_name: "TNREGINET Guideline Value Master Records (Coimbatore Zone)",
        ministry: "Commercial Taxes and Registration Department, Government of Tamil Nadu",
        platform_url: "https://tnreginet.gov.in/portal/webHP?requestType=ApplicationRH&actionVal=guidelineValView",
        format: "JSON / CSV / REST API",
        purpose: "Street-wise and survey-number-wise benchmark valuation per square foot and acre for circle rate benchmarking.",
        integration_status: "Active (2024-2026 Revision Rates Loaded)"
      },
      {
        dataset_name: "Annual Land Transaction Volumes & Stamp Duty Inflow (Coimbatore District)",
        ministry: "Open Government Data Platform India / State Revenue Department",
        platform_url: "https://data.gov.in/catalog/registration-and-stamp-revenue-tamil-nadu",
        format: "CSV / JSON",
        purpose: "Empirical inputs for the ML-LSTM adaptive forecaster to model market momentum and dispute probability over 2018-2026.",
        integration_status: "Active (Historical Sequence Modeled)"
      },
      {
        dataset_name: "National Judicial Data Grid (NJDG) — Coimbatore District Court Land Disputes",
        ministry: "Department of Justice / eCourts Services",
        platform_url: "https://njdg.ecourts.gov.in/njdgnew/",
        format: "JSON / Scraping API",
        purpose: "Cross-referencing active civil suits, partition suits, and injunctions against survey numbers for Random Forest risk escalation scoring.",
        integration_status: "Active (Model Feature Connected)"
      }
    ],
    developer_instructions: "To pull direct automated updates from data.gov.in, acquire an API Key from https://data.gov.in/user/register and set `DATA_GOV_IN_API_KEY` in server/.env."
  });
});

export default router;
