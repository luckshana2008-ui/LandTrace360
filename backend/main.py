import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(title="LandTrace360 Complete API")

# CORS — always allow the deployed Vercel frontend + localhost for dev.
# FRONTEND_URL env var is also respected if set (e.g. for staging/preview URLs).
_VERCEL_URL = "https://land-trace360.vercel.app"
_frontend_url = os.environ.get("FRONTEND_URL", "")
_allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    _VERCEL_URL,  # production Vercel frontend — always allowed
]
# Add FRONTEND_URL env var if it is set and not already in the list
if _frontend_url and _frontend_url not in _allowed_origins:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Demo Data
DEMO_LAND_DATA = [
    {
        "id": "LND-1001", "survey_number": "104/A", "subdivision_number": "1",
        "location": "Central IT Park", "village": "Cyber City", "taluk": "North", "district": "Metro",
        "area_sq_ft": 45000, "land_type": "Commercial", "status": "Verified", "owner": "TechSpace Inc.",
        "is_for_sale": True, "asking_price": 5000000, "posted_date": "2026-08-01",
        "risk_score": 15, "health_score": 85, "coordinates": [12.9716, 77.5946] # Approx BLR
    },
    {
        "id": "LND-1002", "survey_number": "22/B", "subdivision_number": "3",
        "location": "Green Valley", "village": "Agri Hamlet", "taluk": "East", "district": "Rural",
        "area_sq_ft": 120000, "land_type": "Agricultural", "status": "Pending Verification", "owner": "Ramesh Kumar",
        "is_for_sale": False, "asking_price": None, "posted_date": None,
        "risk_score": 45, "health_score": 60, "coordinates": [13.0827, 80.2707] # Approx MAA
    },
    {
        "id": "LND-1003", "survey_number": "87/C", "subdivision_number": "None",
        "location": "Sunset Boulevard", "village": "West End", "taluk": "West", "district": "Metro",
        "area_sq_ft": 2400, "land_type": "Residential", "status": "Verified", "owner": "Sarah Smith",
        "is_for_sale": True, "asking_price": 120000, "posted_date": "2026-08-20",
        "risk_score": 5, "health_score": 95, "coordinates": [19.0760, 72.8777] # Approx BOM
    },
    {
        "id": "LND-1004", "survey_number": "11/A", "subdivision_number": "2",
        "location": "Industrial Estate", "village": "Factory Town", "taluk": "South", "district": "Industrial",
        "area_sq_ft": 250000, "land_type": "Industrial", "status": "Contested", "owner": "HeavyCorp Ltd.",
        "is_for_sale": False, "asking_price": None, "posted_date": None,
        "risk_score": 85, "health_score": 30, "coordinates": [28.7041, 77.1025] # Approx DEL
    },
    {
        "id": "LND-1005", "survey_number": "55/D", "subdivision_number": "4",
        "location": "Hilltop View", "village": "Highlands", "taluk": "North", "district": "Rural",
        "area_sq_ft": 5000, "land_type": "Residential", "status": "Verified", "owner": "Amit Patel",
        "is_for_sale": True, "asking_price": 80000, "posted_date": "2026-09-01",
        "risk_score": 10, "health_score": 90, "coordinates": [22.5726, 88.3639] # Approx CCU
    },
    {
        "id": "LND-1006", "survey_number": "102/B", "subdivision_number": "1",
        "location": "Riverfront", "village": "Waterside", "taluk": "East", "district": "Metro",
        "area_sq_ft": 15000, "land_type": "Commercial", "status": "Verified", "owner": "Riverfront Developers",
        "is_for_sale": False, "asking_price": None, "posted_date": None,
        "risk_score": 25, "health_score": 75, "coordinates": [17.3850, 78.4867] # Approx HYD
    },
    {
        "id": "LND-1007", "survey_number": "44/A", "subdivision_number": "1",
        "location": "Old Town", "village": "Heritage", "taluk": "Central", "district": "Historic",
        "area_sq_ft": 3000, "land_type": "Residential", "status": "Pending Verification", "owner": "Kavita Sharma",
        "is_for_sale": True, "asking_price": 150000, "posted_date": "2026-07-15",
        "risk_score": 55, "health_score": 50, "coordinates": [25.5941, 85.1376] # Approx PAT
    },
    {
        "id": "LND-1008", "survey_number": "77/C", "subdivision_number": "2",
        "location": "New Airport Road", "village": "Aero City", "taluk": "North", "district": "Metro",
        "area_sq_ft": 80000, "land_type": "Commercial", "status": "Verified", "owner": "Global Logistics",
        "is_for_sale": False, "asking_price": None, "posted_date": None,
        "risk_score": 20, "health_score": 80, "coordinates": [26.9124, 75.7873] # Approx JAI
    }
]

HISTORY_DATA = {
    "LND-1001": [
        {"year": 2005, "owner": "Govt IT Dept", "status": "Registered", "transactions": 0, "risk_score": 10, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "TechSpace Inc.", "status": "Under Construction", "transactions": 1, "risk_score": 12, "boundary_status": "Surveyed"},
        {"year": 2026, "owner": "TechSpace Inc.", "status": "Verified", "transactions": 2, "risk_score": 15, "boundary_status": "Fenced"}
    ],
    "LND-1002": [
        {"year": 2005, "owner": "Village Panchayat", "status": "Agricultural", "transactions": 0, "risk_score": 20, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "Ramesh Kumar", "status": "Transferred", "transactions": 1, "risk_score": 35, "boundary_status": "Surveyed"},
        {"year": 2026, "owner": "Ramesh Kumar", "status": "Pending Verification", "transactions": 2, "risk_score": 45, "boundary_status": "Partially Marked"}
    ],
    "LND-1003": [
        {"year": 2005, "owner": "Smith Family Trust", "status": "Residential Plot", "transactions": 0, "risk_score": 8, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "John Smith", "status": "Inherited", "transactions": 1, "risk_score": 6, "boundary_status": "Surveyed"},
        {"year": 2026, "owner": "Sarah Smith", "status": "Verified", "transactions": 2, "risk_score": 5, "boundary_status": "Fenced"}
    ],
    "LND-1004": [
        {"year": 2005, "owner": "State Industrial Corp", "status": "Government Land", "transactions": 0, "risk_score": 40, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "HeavyCorp Ltd.", "status": "Acquired (Disputed)", "transactions": 1, "risk_score": 70, "boundary_status": "Under Dispute"},
        {"year": 2026, "owner": "HeavyCorp Ltd.", "status": "Contested", "transactions": 2, "risk_score": 85, "boundary_status": "Disputed"}
    ],
    "LND-1005": [
        {"year": 2005, "owner": "Patel Family", "status": "Vacant Plot", "transactions": 0, "risk_score": 15, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "Patel Family", "status": "Residential", "transactions": 0, "risk_score": 12, "boundary_status": "Surveyed"},
        {"year": 2026, "owner": "Amit Patel", "status": "Verified", "transactions": 1, "risk_score": 10, "boundary_status": "Fenced"}
    ],
    "LND-1006": [
        {"year": 2005, "owner": "City Municipal Corp", "status": "Public Land", "transactions": 0, "risk_score": 30, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "Waterside Holdings", "status": "Leased", "transactions": 1, "risk_score": 28, "boundary_status": "Surveyed"},
        {"year": 2026, "owner": "Riverfront Developers", "status": "Verified", "transactions": 2, "risk_score": 25, "boundary_status": "Fenced"}
    ],
    "LND-1007": [
        {"year": 2005, "owner": "Sharma Family Estate", "status": "Ancestral Property", "transactions": 0, "risk_score": 50, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "Kavita Sharma", "status": "Inherited", "transactions": 1, "risk_score": 55, "boundary_status": "Partially Marked"},
        {"year": 2026, "owner": "Kavita Sharma", "status": "Pending Verification", "transactions": 2, "risk_score": 55, "boundary_status": "Surveyed"}
    ],
    "LND-1008": [
        {"year": 2005, "owner": "Airport Authority", "status": "Reserved Land", "transactions": 0, "risk_score": 25, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "Aero Infra Pvt Ltd", "status": "Leased", "transactions": 1, "risk_score": 22, "boundary_status": "Surveyed"},
        {"year": 2026, "owner": "Global Logistics", "status": "Verified", "transactions": 2, "risk_score": 20, "boundary_status": "Fenced"}
    ],
    "default": [
        {"year": 2005, "owner": "Original Owner", "status": "Registered", "transactions": 0, "risk_score": 35, "boundary_status": "Unmarked"},
        {"year": 2015, "owner": "Previous Owner", "status": "Transferred", "transactions": 1, "risk_score": 25, "boundary_status": "Surveyed"},
        {"year": 2026, "owner": "Current Owner", "status": "Verified", "transactions": 2, "risk_score": 20, "boundary_status": "Fenced"}
    ]
}

OWNERS_DATA = {
    "LND-1001": [
        {"name": "TechSpace Inc.", "period": "2015 - Present", "type": "Corporate"},
        {"name": "Govt IT Dept", "period": "2000 - 2015", "type": "Government"}
    ],
    "default": [
        {"name": "Current Owner", "period": "2015 - Present", "type": "Individual"},
        {"name": "Historical Owner", "period": "1990 - 2015", "type": "Individual"}
    ]
}

DOCUMENTS_DATA = {
    "LND-1001": [
        {"doc_no": "DOC-99812", "type": "Sale Deed", "date": "2015-04-12", "verification": "Verified", "result": "Match"},
        {"doc_no": "DOC-33211", "type": "Encumbrance Certificate", "date": "2026-01-10", "verification": "Verified", "result": "Match"}
    ],
    "LND-1002": [
        {"doc_no": "DOC-77442", "type": "Sale Deed", "date": "2018-09-22", "verification": "Pending", "result": "Mismatch"},
        {"doc_no": "DOC-89912", "type": "Tax Receipt", "date": "2025-11-20", "verification": "Verified", "result": "Match"}
    ],
    "LND-1003": [
        {"doc_no": "DOC-11234", "type": "Gift Deed", "date": "2020-02-14", "verification": "Verified", "result": "Match"},
        {"doc_no": "DOC-11333", "type": "Property Tax Receipt", "date": "2025-02-28", "verification": "Verified", "result": "Match"}
    ],
    "LND-1004": [
        {"doc_no": "DOC-55321", "type": "Sale Deed", "date": "1995-07-06", "verification": "Disputed", "result": "Mismatch"},
        {"doc_no": "DOC-11983", "type": "Survey Report", "date": "2005-08-30", "verification": "Verified", "result": "Match"}
    ],
    "LND-1005": [
        {"doc_no": "DOC-44822", "type": "Sale Deed", "date": "2021-03-01", "verification": "Verified", "result": "Match"},
        {"doc_no": "DOC-99001", "type": "Building Plan", "date": "2022-05-15", "verification": "Verified", "result": "Match"}
    ],
    "LND-1006": [
        {"doc_no": "DOC-88334", "type": "Lease Agreement", "date": "2019-12-01", "verification": "Verified", "result": "Match"},
        {"doc_no": "DOC-88335", "type": "Clearance Certificate", "date": "2020-01-15", "verification": "Verified", "result": "Match"}
    ],
    "LND-1007": [
        {"doc_no": "DOC-77211", "type": "Sale Deed", "date": "2010-06-25", "verification": "Verified", "result": "Match"},
        {"doc_no": "DOC-22312", "type": "Will Document", "date": "2012-10-18", "verification": "Pending", "result": "Pending"}
    ],
    "LND-1008": [
        {"doc_no": "DOC-33299", "type": "Commercial Lease", "date": "2023-01-15", "verification": "Verified", "result": "Match"},
        {"doc_no": "DOC-33300", "type": "Zoning Exception", "date": "2023-03-10", "verification": "Verified", "result": "Match"}
    ],
    "default": [
        {"doc_no": "DOC-10023", "type": "Sale Deed", "date": "2015-01-01", "verification": "Verified", "result": "Match"},
        {"doc_no": "DOC-88231", "type": "Tax Receipt", "date": "2025-12-01", "verification": "Verified", "result": "Match"}
    ]
}

DOC_VERIFICATION_DATA = {
    "LND-1001": {
        "overall_result": "VERIFIED MATCH",
        "score": 100,
        "fields": [
            {"name": "Survey Number", "doc_value": "104/A", "record_value": "104/A", "result": "MATCH"},
            {"name": "Owner", "doc_value": "TechSpace Inc.", "record_value": "TechSpace Inc.", "result": "MATCH"},
            {"name": "Area", "doc_value": "45000 sq ft", "record_value": "45000 sq ft", "result": "MATCH"},
            {"name": "Land Type", "doc_value": "Commercial", "record_value": "Commercial", "result": "MATCH"}
        ],
        "explanation": "All document fields align completely with the official registry."
    },
    "LND-1002": {
        "overall_result": "CONFLICT DETECTED",
        "score": 50,
        "fields": [
            {"name": "Survey Number", "doc_value": "22/B", "record_value": "22/B", "result": "MATCH"},
            {"name": "Owner", "doc_value": "Rajesh Kumar", "record_value": "Ramesh Kumar", "result": "MISMATCH"},
            {"name": "Area", "doc_value": "120000 sq ft", "record_value": "120000 sq ft", "result": "MATCH"},
            {"name": "Land Type", "doc_value": "Residential", "record_value": "Agricultural", "result": "MISMATCH"}
        ],
        "explanation": "Conflict found! The document lists the owner as 'Rajesh Kumar' while the actual registry states 'Ramesh Kumar'. Furthermore, the document claims a 'Residential' land type instead of 'Agricultural'."
    },
    "LND-1003": {
        "overall_result": "VERIFIED MATCH",
        "score": 100,
        "fields": [
            {"name": "Survey Number", "doc_value": "87/C", "record_value": "87/C", "result": "MATCH"},
            {"name": "Owner", "doc_value": "Sarah Smith", "record_value": "Sarah Smith", "result": "MATCH"},
            {"name": "Area", "doc_value": "2400 sq ft", "record_value": "2400 sq ft", "result": "MATCH"},
            {"name": "Land Type", "doc_value": "Residential", "record_value": "Residential", "result": "MATCH"}
        ],
        "explanation": "All document fields align completely with the official registry."
    },
    "LND-1004": {
        "overall_result": "CONFLICT DETECTED",
        "score": 25,
        "fields": [
            {"name": "Survey Number", "doc_value": "11/A", "record_value": "11/A", "result": "MATCH"},
            {"name": "Owner", "doc_value": "HeavyCorp Pvt.", "record_value": "HeavyCorp Ltd.", "result": "MISMATCH"},
            {"name": "Area", "doc_value": "200000 sq ft", "record_value": "250000 sq ft", "result": "MISMATCH"},
            {"name": "Land Type", "doc_value": "Commercial", "record_value": "Industrial", "result": "MISMATCH"}
        ],
        "explanation": "Major conflict found! The Area is significantly reported differently, and the Owner corporate entity differs from legal records."
    },
    "default": {
        "overall_result": "PARTIAL MATCH",
        "score": 75,
        "fields": [
            {"name": "Survey Number", "doc_value": "Matched", "record_value": "Matched", "result": "MATCH"},
            {"name": "Owner", "doc_value": "Pending Doc", "record_value": "Registered", "result": "NOT AVAILABLE"},
            {"name": "Area", "doc_value": "Match", "record_value": "Match", "result": "MATCH"},
            {"name": "Land Type", "doc_value": "Match", "record_value": "Match", "result": "MATCH"}
        ],
        "explanation": "Some documents are pending translation or missing details, resulting in a partial verification."
    }
}

CASES_DATA = {
    "LND-1001": [{"case_no": "OS-2026-11", "type": "Tax Reassessment", "court": "Municipal Tribunal", "filing_date": "2026-01-10", "status": "Closed"}],
    "LND-1002": [{"case_no": "OS-2025-88", "type": "Title Dispute", "court": "High Court", "filing_date": "2025-11-04", "status": "Ongoing"}],
    "LND-1003": [{"case_no": "OS-2024-55", "type": "Boundary Demarcation", "court": "Civil Court", "filing_date": "2024-05-16", "status": "Closed"}],
    "LND-1004": [
        {"case_no": "OS-2023-45", "type": "Boundary Dispute", "court": "District Court", "filing_date": "2023-06-15", "status": "Ongoing"},
        {"case_no": "WP-2018-99", "type": "Environmental Clearance", "court": "Green Tribunal", "filing_date": "2018-09-10", "status": "Closed"}
    ],
    "LND-1005": [{"case_no": "OS-2022-77", "type": "Easement Rights", "court": "Lower Court", "filing_date": "2022-11-12", "status": "Resolved"}],
    "LND-1006": [{"case_no": "OS-2021-22", "type": "Commercial Zoning", "court": "City Tribunal", "filing_date": "2021-08-08", "status": "Resolved"}],
    "LND-1007": [{"case_no": "OS-2015-12", "type": "Inheritance Dispute", "court": "Civil Court", "filing_date": "2015-03-22", "status": "Resolved"}],
    "LND-1008": [{"case_no": "OS-2026-05", "type": "Lease Violation Penalty", "court": "Commercial Court", "filing_date": "2026-03-01", "status": "Ongoing"}],
    "default": [
        {"case_no": "OS-DEFAULT-1", "type": "General Inquiry", "court": "Civil Court", "filing_date": "2020-01-01", "status": "Closed"}
    ]
}

MORTGAGES_DATA = {
    "LND-1001": [{"bank": "National Bank", "start_date": "2016-01-01", "release_date": "2025-12-31", "status": "Released"}],
    "LND-1002": [{"bank": "Rural Credit Union", "start_date": "2019-11-11", "release_date": "2029-11-11", "status": "Active"}],
    "LND-1003": [{"bank": "City Finance", "start_date": "2021-08-20", "release_date": "2031-08-20", "status": "Active"}],
    "LND-1004": [{"bank": "Industrial Dev Bank", "start_date": "2015-05-15", "release_date": "2035-05-15", "status": "Active"}],
    "LND-1005": [{"bank": "State Housing Bank", "start_date": "2022-04-10", "release_date": "2042-04-10", "status": "Active"}],
    "LND-1006": [{"bank": "Commerce Bank", "start_date": "2020-02-15", "release_date": "2030-02-15", "status": "Active"}],
    "LND-1007": [{"bank": "Heritage Trust Bank", "start_date": "2017-09-09", "release_date": "2027-09-09", "status": "Released"}],
    "LND-1008": [{"bank": "Global Finance", "start_date": "2024-05-10", "release_date": "2034-05-10", "status": "Active"}],
    "default": []
}

RISK_DATA = {
    "LND-1001": {"document_risk": 5, "ownership_risk": 5, "legal_risk": 0, "mortgage_risk": 5, "boundary_risk": 0, "overall_score": 15, "level": "LOW"},
    "LND-1004": {"document_risk": 20, "ownership_risk": 30, "legal_risk": 80, "mortgage_risk": 0, "boundary_risk": 85, "overall_score": 85, "level": "HIGH"},
    "default": {"document_risk": 10, "ownership_risk": 15, "legal_risk": 0, "mortgage_risk": 0, "boundary_risk": 10, "overall_score": 35, "level": "MEDIUM"}
}

DNA_DATA = {
    "LND-1001": {"ownership_stability": 90, "document_health": 95, "legal_safety": 100, "mortgage_status": 85, "boundary_stability": 90, "overall_health": 92},
    "LND-1004": {"ownership_stability": 40, "document_health": 50, "legal_safety": 20, "mortgage_status": 100, "boundary_stability": 30, "overall_health": 48},
    "default": {"ownership_stability": 75, "document_health": 80, "legal_safety": 100, "mortgage_status": 100, "boundary_stability": 80, "overall_health": 87}
}

class Announcement(BaseModel):
    land_id: str
    location: str
    area: str
    land_type: str
    expected_price: int
    description: str
    contact: str
    house_on_land: Optional[str] = None
    house_details: Optional[str] = None
    well_borewell: Optional[str] = None
    water_facility: Optional[str] = None
    electricity_available: Optional[str] = None
    road_access: Optional[str] = None
    road_details: Optional[str] = None
    compound_wall: Optional[str] = None
    existing_building: Optional[str] = None
    existing_building_details: Optional[str] = None
    current_land_use: Optional[str] = None
    nearby_facilities: Optional[str] = None
    additional_details: Optional[str] = None

class AskQuery(BaseModel):
    question: str

ANNOUNCEMENTS = []
SAVED_LANDS = []

@app.get("/api/dashboard")
def get_dashboard_stats():
    total = len(DEMO_LAND_DATA)
    verified = len([l for l in DEMO_LAND_DATA if l.get("status") == "Verified"])
    for_sale = len([l for l in DEMO_LAND_DATA if l.get("is_for_sale")])
    
    # Calculate high risk appropriately based on RISK_DATA or just assume a mock number
    high_risk = len([v for k, v in RISK_DATA.items() if k != "default" and v.get("level") == "HIGH"])
    
    return {
        "total_lands": total,
        "verified_lands": verified,
        "lands_for_sale": for_sale,
        "high_risk_lands": high_risk,
        "recent_announcements": len(ANNOUNCEMENTS)
    }

@app.get("/api/search")
def search_lands(q: Optional[str] = None, status: Optional[str] = None, land_type: Optional[str] = None):
    results = DEMO_LAND_DATA
    if q:
        q_lower = q.lower()
        results = [l for l in results if q_lower in l["id"].lower() or q_lower in l["survey_number"].lower() or q_lower in l["location"].lower() or q_lower in l["owner"].lower()]
    if status:
        results = [l for l in results if l["status"].lower() == status.lower()]
    if land_type:
        results = [l for l in results if l["land_type"].lower() == land_type.lower()]
    return results

@app.get("/api/saved-lands")
def get_saved_lands():
    return SAVED_LANDS

@app.post("/api/saved-lands/{land_id}")
def toggle_saved_land(land_id: str):
    if land_id in SAVED_LANDS:
        SAVED_LANDS.remove(land_id)
        return {"status": "removed"}
    else:
        SAVED_LANDS.append(land_id)
        return {"status": "added"}

@app.post("/api/lands/{land_id}/ask")
def ask_land_ai(land_id: str, query: AskQuery):
    """Refined AI endpoint handling detailed, land-specific demo interactions."""
    q = query.question.lower().strip()
    land = next((l for l in DEMO_LAND_DATA if l["id"] == land_id), None)
    
    if "other land" in q or "different land" in q or not land_id.startswith("LND-"):
        return {"answer": "I can answer questions about this land using the available LandTrace360 demo records.", "sources": []}

    if not land:
        return {"answer": "I can answer questions about this land using the available LandTrace360 demo records.", "sources": []}

    risk = RISK_DATA.get(land_id, RISK_DATA["default"])
    dna = DNA_DATA.get(land_id, DNA_DATA["default"])
    docs = DOCUMENTS_DATA.get(land_id, DOCUMENTS_DATA["default"])
    cases = CASES_DATA.get(land_id, CASES_DATA["default"])
    mortgages = MORTGAGES_DATA.get(land_id, MORTGAGES_DATA["default"])
    boundary = BOUNDARY_DETECTION_DATA.get(land_id, BOUNDARY_DETECTION_DATA["default"])
    frag = FRAGMENTATION_ANALYSIS_DATA.get(land_id, FRAGMENTATION_ANALYSIS_DATA["default"])
    history = HISTORY_DATA.get(land_id, HISTORY_DATA["default"])

    sources = []

    # --- Intent: Owner ---
    if any(kw in q for kw in ["owner", "who owns", "whose", "belong"]):
        return {"answer": f"The current owner of **{land_id}** is **{land['owner']}**.", "sources": ["Ownership Records"]}

    # --- Intent: Boundary ---
    if any(kw in q for kw in ["boundary", "border"]):
        sources.append("Boundary Detection")
        return {"answer": f"Boundary Status for **{land_id}**: {boundary['change_status']} ({boundary['deviation_percentage']}% deviation from previous {boundary['previous_status']}). Risk Impact is considered {boundary['risk_impact']}.", "sources": sources}

    # --- Intent: Subdivisions / Fragmentation ---
    if any(kw in q for kw in ["subdivision", "fragment", "split", "divided"]):
        sources.append("Fragmentation Detector")
        if frag['subdivisions'] == 0:
            return {"answer": f"**{land_id}** has **0 subdivisions**. It remains the original {frag['original_area']} sq ft parcel with No Fragmentation.", "sources": sources}
        return {"answer": f"**{land_id}** has **{frag['subdivisions']} subdivisions**. It was originally {frag['original_area']} sq ft and now sits at {frag['current_area']} sq ft. {frag['description']}", "sources": sources}

    # --- Intent: History / Past ---
    if any(kw in q for kw in ["past", "history", "happened"]):
        sources.append("Time Machine Data")
        hist_str = "\n".join([f"- In **{h['year']}**: Owned by {h['owner']}, Status: {h['status']}" for h in history])
        return {"answer": f"Here is the demo history for **{land_id}**:\n{hist_str}", "sources": sources}

    # --- Intent: Legal / Cases ---
    if any(kw in q for kw in ["legal", "case", "court", "dispute", "litigation"]):
        sources.append("Legal & Cases")
        if not cases:
            return {"answer": "This information is not available in the current demo records.", "sources": sources}
        case_list = "\n".join([f"- **{c['case_no']}**: {c['type']} at {c['court']} (Status: {c['status']})" for c in cases])
        return {"answer": f"Legal cases found for **{land_id}**:\n{case_list}", "sources": sources}

    # --- Intent: Documents ---
    if any(kw in q for kw in ["document", "doc ", "docs", "deed", "certificate", "record"]):
        sources.append("Document Cross-Verification")
        if not docs:
            return {"answer": "This information is not available in the current demo records.", "sources": sources}
        doc_list = "\n".join([f"- **{d['doc_no']}**: {d['type']} ({d['verification']})" for d in docs])
        return {"answer": f"Available official documents for **{land_id}**:\n{doc_list}", "sources": sources}

    # --- Intent: Mortgage ---
    if any(kw in q for kw in ["mortgage", "bank", "loan", "lien", "encumbrance"]):
        sources.append("Mortgage Records")
        if not mortgages:
            return {"answer": "No active mortgages found in the current demo records for this land.", "sources": sources}
        m_list = "\n".join([f"- **{m['bank']}** ({m['start_date']} to {m['release_date']}) - Status: {m['status']}" for m in mortgages])
        return {"answer": f"Mortgage details for **{land_id}**:\n{m_list}", "sources": sources}

    # --- Intent: Risk Score / Why Risky / What to Check ---
    if any(kw in q for kw in ["risk", "check", "consider", "safe"]):
        sources.append("AI Risk Analysis")
        return {"answer": f"**Risk Analysis for {land_id}**: Overall Score is **{risk['overall_score']}/100** ({risk['level']} Risk).\n\nKey areas to review:\n- Document Risk: {risk['document_risk']}\n- Ownership Risk: {risk['ownership_risk']}\n- Legal Risk: {risk['legal_risk']}\n- Boundary Risk: {risk['boundary_risk']}\n\nYou should thoroughly check the {risk['level']} risk factors before making a decision.", "sources": sources}

    # --- Intent: Health / DNA ---
    if any(kw in q for kw in ["health", "dna", "stability"]):
        sources.append("Land DNA")
        return {"answer": f"Land Health Score for **{land_id}**: **{dna['overall_health']}%**.\nBreakdown: Ownership Stability {dna['ownership_stability']}%, Document Health {dna['document_health']}%, Legal Safety {dna['legal_safety']}%, Mortgage Status {dna['mortgage_status']}%, Boundary Stability {dna['boundary_stability']}%.", "sources": sources}

    # --- Intent: Summary ---
    if any(kw in q for kw in ["summary", "overview", "everything", "all", "complete", "detail", "full"]):
        sources = ["Overview", "DNA", "Legal", "Boundary", "Fragmentation"]
        doc_names = ", ".join([d['type'] for d in docs]) if docs else "None"
        case_info = ", ".join([f"{c['case_no']} ({c['status']})" for c in cases]) if cases else "None"
        mortgage_info = ", ".join([f"{m['bank']} ({m['status']})" for m in mortgages]) if mortgages else "None"
        sale_info = f"For Sale at ₹{land['asking_price']:,}" if land['is_for_sale'] else "Not for sale"
        
        summary = (f"**Comprehensive Land Summary for {land_id}:**\n\n"
                   f"• **Owner:** {land['owner']}\n"
                   f"• **Status:** {land['status']}\n"
                   f"• **Area:** {land['area_sq_ft']:,} sq ft ({land['land_type']})\n"
                   f"• **Documents:** {doc_names}\n"
                   f"• **Legal Cases:** {case_info}\n"
                   f"• **Mortgages:** {mortgage_info}\n"
                   f"• **Risk Score:** {risk['overall_score']} ({risk['level']})\n"
                   f"• **Boundary Status:** {boundary['change_status']}\n"
                   f"• **Fragmentation Status:** {frag['subdivisions']} subdivisions ({frag['status']})")
        return {"answer": summary, "sources": sources}

    # --- Fallback: General Info ---
    return {"answer": f"Based on the records for **{land_id}**: it is a **{land['land_type']}** property at **{land['location']}**, owned by **{land['owner']}**, with status **{land['status']}**. You can ask me about the owner, area, survey number, documents, legal cases, mortgage, risk score, health score, boundary, fragmentation, or request a full summary.", "sources": []}

BOUNDARY_HISTORY = {
    2005: {"previous_status": "N/A", "current_status": "Unmarked", "last_survey_date": "N/A", "deviation_percentage": "N/A"},
    2015: {"previous_status": "Unmarked", "current_status": "Surveyed", "last_survey_date": "2014-11-20", "deviation_percentage": "3.5%"},
    2026: {"previous_status": "Surveyed", "current_status": "Fenced", "last_survey_date": "2024-05-10", "deviation_percentage": "1.2%"}
}

BOUNDARY_DETECTION_DATA = {
    "LND-1001": {"previous_status": "Unmarked", "current_status": "Fenced (Surveyed)", "deviation_percentage": 0.5, "last_survey_date": "2026-08-15", "change_status": "No Significant Change", "risk_impact": "Low"},
    "LND-1002": {"previous_status": "Surveyed", "current_status": "Encroached on East", "deviation_percentage": 5.2, "last_survey_date": "2025-11-10", "change_status": "Significant Change Detected", "risk_impact": "High"},
    "LND-1003": {"previous_status": "Fenced", "current_status": "Walled", "deviation_percentage": 1.1, "last_survey_date": "2024-03-22", "change_status": "Minor Change Detected", "risk_impact": "Low"},
    "LND-1004": {"previous_status": "Marked Boundary", "current_status": "Overlapping Industrial Zone", "deviation_percentage": 8.5, "last_survey_date": "2023-01-14", "change_status": "Significant Change Detected", "risk_impact": "Critical"},
    "LND-1005": {"previous_status": "Surveyed", "current_status": "Fenced", "deviation_percentage": 0.2, "last_survey_date": "2026-05-30", "change_status": "No Significant Change", "risk_impact": "Low"},
    "LND-1006": {"previous_status": "Unmarked", "current_status": "Fenced (River erosion noted)", "deviation_percentage": 4.1, "last_survey_date": "2022-09-12", "change_status": "Minor Change Detected", "risk_impact": "Medium"},
    "LND-1007": {"previous_status": "Partially Marked", "current_status": "Disputed North Border", "deviation_percentage": 6.8, "last_survey_date": "2021-12-05", "change_status": "Significant Change Detected", "risk_impact": "High"},
    "LND-1008": {"previous_status": "Surveyed", "current_status": "Fenced (Airport Authority)", "deviation_percentage": 0.8, "last_survey_date": "2025-07-20", "change_status": "No Significant Change", "risk_impact": "Low"},
    "default": {"previous_status": "Surveyed", "current_status": "Fenced", "deviation_percentage": 2.5, "last_survey_date": "2024-01-01", "change_status": "Minor Change Detected", "risk_impact": "Medium"}
}


FRAGMENTATION_HISTORY = {
    2005: {"original_area": 100000, "current_area_ratio": 1.0, "subdivisions": 0},
    2015: {"original_area": 100000, "current_area_ratio": 0.75, "subdivisions": 1},
    2026: {"original_area": 100000, "current_area_ratio": 1.0, "subdivisions": 3}
}

FRAGMENTATION_ANALYSIS_DATA = {
    "LND-1001": {"original_area": 45000, "current_area": 45000, "subdivisions": 1, "status": "Low Fragmentation", "percentage_lost": 0, "risk_impact": "Low", "description": "This parcel is a primary subdivision that retains its full original area with no subsequent splitting."},
    "LND-1002": {"original_area": 250000, "current_area": 120000, "subdivisions": 3, "status": "High Fragmentation", "percentage_lost": 52, "risk_impact": "High", "description": "This parcel has been extensively subdivided from a larger parent lot, potentially complicating boundary claims."},
    "LND-1003": {"original_area": 2400, "current_area": 2400, "subdivisions": 0, "status": "No Fragmentation", "percentage_lost": 0, "risk_impact": "Low", "description": "This is an original standalone plot that has never been subdivided."},
    "LND-1004": {"original_area": 350000, "current_area": 250000, "subdivisions": 2, "status": "Moderate Fragmentation", "percentage_lost": 28, "risk_impact": "Medium", "description": "This industrial parcel has undergone minor subdivisions for adjacent infrastructure access."},
    "LND-1005": {"original_area": 15000, "current_area": 5000, "subdivisions": 4, "status": "High Fragmentation", "percentage_lost": 66, "risk_impact": "High", "description": "This parcel is a highly fragmented remainder of a once significantly larger plot, split into multiple tight residential grids."},
    "LND-1006": {"original_area": 20000, "current_area": 15000, "subdivisions": 1, "status": "Low Fragmentation", "percentage_lost": 25, "risk_impact": "Low", "description": "This parcel was sectioned off once from an adjacent neighbor, retaining clear title paths."},
    "LND-1007": {"original_area": 6000, "current_area": 3000, "subdivisions": 1, "status": "Moderate Fragmentation", "percentage_lost": 50, "risk_impact": "Medium", "description": "This ancestral property was cleanly divided into two equal parcels among heirs."},
    "LND-1008": {"original_area": 85000, "current_area": 80000, "subdivisions": 2, "status": "Low Fragmentation", "percentage_lost": 5, "risk_impact": "Low", "description": "Minor zoning adjustments resulted in a small fraction being sliced off for utility access."},
    "default": {"original_area": 10000, "current_area": 10000, "subdivisions": 0, "status": "No Fragmentation", "percentage_lost": 0, "risk_impact": "Low", "description": "No significant fragmentation metrics found."}
}

@app.get("/api/lands/{land_id}/boundary-changes")
def get_boundary_changes(land_id: str, year: Optional[int] = None):
    if year and year in BOUNDARY_HISTORY:
        return BOUNDARY_HISTORY[year]
    return BOUNDARY_HISTORY[2026]

@app.get("/api/lands/{land_id}/boundary-detection")
def get_boundary_detection(land_id: str):
    return BOUNDARY_DETECTION_DATA.get(land_id, BOUNDARY_DETECTION_DATA["default"])

@app.get("/api/lands/{land_id}/fragmentation-analysis")
def get_fragmentation_analysis(land_id: str):
    return FRAGMENTATION_ANALYSIS_DATA.get(land_id, FRAGMENTATION_ANALYSIS_DATA["default"])

@app.get("/api/lands/{land_id}/fragmentation")
def get_fragmentation(land_id: str, year: Optional[int] = None):
    land_area = next((l["area_sq_ft"] for l in DEMO_LAND_DATA if l["id"] == land_id), 0)
    if year and year in FRAGMENTATION_HISTORY:
        frag = FRAGMENTATION_HISTORY[year]
        return {
            "original_area": frag["original_area"],
            "current_area": int(land_area * frag["current_area_ratio"]),
            "subdivisions": frag["subdivisions"]
        }
    return {
        "original_area": 100000,
        "current_area": land_area,
        "subdivisions": 3
    }

@app.get("/api/lands/high-risk")
def get_high_risk_lands():
    high_risk_ids = [k for k, v in RISK_DATA.items() if k != "default" and v.get("level") == "HIGH"]
    results = []
    for land in DEMO_LAND_DATA:
        if land["id"] in high_risk_ids:
            risk = RISK_DATA.get(land["id"], RISK_DATA["default"])
            results.append({**land, "risk_details": risk})
    return results

@app.get("/api/lands")
def get_lands(): return DEMO_LAND_DATA

@app.get("/api/lands/for-sale")
def get_lands_for_sale(): return [l for l in DEMO_LAND_DATA if l.get("is_for_sale")]

@app.get("/api/lands/announcements")
def get_announcements(): return ANNOUNCEMENTS

@app.post("/api/lands/announcements")
def post_announcement(announcement: Announcement):
    new_ann = announcement.dict()
    new_ann["posted_date"] = datetime.now().strftime("%Y-%m-%d")
    ANNOUNCEMENTS.append(new_ann)
    # Pseudo-update main db for the marketplace integration
    for land in DEMO_LAND_DATA:
        if land["id"] == new_ann["land_id"]:
            land["is_for_sale"] = True
            land["asking_price"] = new_ann["expected_price"]
    return {"status": "success", "data": new_ann}

@app.get("/api/lands/{land_id}")
def get_land(land_id: str):
    for l in DEMO_LAND_DATA:
        if l["id"] == land_id: return l
    raise HTTPException(status_code=404, detail="Land not found")

@app.get("/api/lands/{land_id}/history")
def get_history(land_id: str): return HISTORY_DATA.get(land_id, HISTORY_DATA["default"])

@app.get("/api/lands/{land_id}/owners")
def get_owners(land_id: str): return OWNERS_DATA.get(land_id, OWNERS_DATA["default"])

@app.get("/api/lands/{land_id}/documents")
def get_documents(land_id: str): return DOCUMENTS_DATA.get(land_id, DOCUMENTS_DATA["default"])

@app.get("/api/lands/{land_id}/document-verification")
def get_document_verification(land_id: str): return DOC_VERIFICATION_DATA.get(land_id, DOC_VERIFICATION_DATA["default"])

@app.get("/api/lands/{land_id}/cases")
def get_cases(land_id: str): return CASES_DATA.get(land_id, CASES_DATA["default"])

@app.get("/api/lands/{land_id}/mortgages")
def get_mortgages(land_id: str): return MORTGAGES_DATA.get(land_id, MORTGAGES_DATA["default"])

@app.get("/api/lands/{land_id}/risk")
def get_risk(land_id: str): return RISK_DATA.get(land_id, RISK_DATA["default"])

@app.get("/api/lands/{land_id}/dna")
def get_dna(land_id: str): return DNA_DATA.get(land_id, DNA_DATA["default"])

class WhatIfQuery(BaseModel):
    scenario: str

@app.post("/api/lands/{land_id}/what-if")
def what_if_simulator(land_id: str, query: WhatIfQuery):
    risk = RISK_DATA.get(land_id, RISK_DATA["default"])
    current_score = risk["overall_score"]
    
    scenarios = {
        "mortgage_active": {"score_change": 15, "reason": "Active mortgage increases financial liability and restricts immediate transfer."},
        "legal_pending": {"score_change": 40, "reason": "Pending legal cases create high uncertainty and potential litigation costs."},
        "ownership_dispute": {"score_change": 50, "reason": "Ownership disputes severely impact title clarity and block transactions."},
        "boundary_change": {"score_change": 20, "reason": "Boundary uncertainty increases the property risk and may cause neighbor disputes."},
        "document_fail": {"score_change": 30, "reason": "Failed document verification casts doubt on legitimacy and requires lengthy correction."},
        "none": {"score_change": 0, "reason": "No change simulated."}
    }
    
    scenario_data = scenarios.get(query.scenario, scenarios["none"])
    simulated_score = min(100, current_score + scenario_data["score_change"])
    
    if simulated_score < 30:
        risk_level = "LOW"
    elif simulated_score < 70:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"
        
    change = "No Change"
    if simulated_score > current_score:
        change = "Increased"
    elif simulated_score < current_score:
        change = "Decreased"
        
    return {
        "land_id": land_id,
        "current_score": current_score,
        "simulated_score": simulated_score,
        "risk_level": risk_level,
        "change": change,
        "reason": scenario_data["reason"]
    }

@app.get("/api/lands/{land_id}/verification-report")
def get_verification_report(land_id: str):
    land = next((l for l in DEMO_LAND_DATA if l["id"] == land_id), None)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
        
    owners = OWNERS_DATA.get(land_id, OWNERS_DATA["default"])
    docs = DOCUMENTS_DATA.get(land_id, DOCUMENTS_DATA["default"])
    doc_verif = DOC_VERIFICATION_DATA.get(land_id, DOC_VERIFICATION_DATA["default"])
    cases = CASES_DATA.get(land_id, CASES_DATA["default"])
    mortgages = MORTGAGES_DATA.get(land_id, MORTGAGES_DATA["default"])
    boundary = BOUNDARY_DETECTION_DATA.get(land_id, BOUNDARY_DETECTION_DATA["default"])
    frag = FRAGMENTATION_ANALYSIS_DATA.get(land_id, FRAGMENTATION_ANALYSIS_DATA["default"])
    dna = DNA_DATA.get(land_id, DNA_DATA["default"])
    risk = RISK_DATA.get(land_id, RISK_DATA["default"])
    history = HISTORY_DATA.get(land_id, HISTORY_DATA["default"])
    
    # Generate simple summary
    summary = f"Based on synthetic records, {land_id} is a {land['area_sq_ft']} sq ft {land['land_type']} property owned by {land['owner']}. "
    summary += f"The AI Risk level is {risk['level']} (score: {risk['overall_score']}). "
    
    if cases and len(cases) == 1: summary += "There is 1 active legal case on record. "
    elif cases and len(cases) > 1: summary += f"There are {len(cases)} active legal cases on record. "
    else: summary += "There are no known active legal cases. "
    
    if mortgages and len(mortgages) == 1: summary += "Found 1 mortgage encumbrance. "
    elif mortgages and len(mortgages) > 1: summary += f"Found {len(mortgages)} mortgage encumbrances. "
    
    summary += f"Document verification reflects a {doc_verif['overall_result']}. "
    summary += f"Boundary status is {boundary['change_status']}."

    return {
        "land": land,
        "owners": owners,
        "history": history,
        "documents": docs,
        "doc_verification": doc_verif,
        "cases": cases,
        "mortgages": mortgages,
        "boundary": boundary,
        "fragmentation": frag,
        "dna": dna,
        "risk": risk,
        "summary": summary
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

