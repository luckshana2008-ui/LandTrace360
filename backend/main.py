import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path regardless of execution directory (root vs backend)
_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import logging
import shutil
import uuid
import hashlib
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, File, Form, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, DatabaseError

from database import get_db, engine, SessionLocal
from models import (
    Base, Land, Owner, LandDocument, LegalCase, Mortgage,
    LandHistory, SavedLand, SellerListing, SellerPropertyDetail,
    VerificationRecord, Alert, SellerDocumentUpload, User
)

from auth_helpers import (
    register_user, authenticate_user, create_access_token,
    decode_access_token, revoke_token, get_user_by_id,
    seed_demo_users_in_db, DEMO_PASSWORD
)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from phase2_helpers import (
    detect_land_anomalies, build_land_evidence, build_risk_breakdown,
    build_intelligent_alerts, _READ_ALERTS_SET
)
from chatbot_service import LandTraceAIChatbot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(_BACKEND_DIR) / "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

DB_AVAILABLE = False



def _seed_database():
    """Idempotent seed: inserts demo data only if rows don't already exist."""
    db = SessionLocal()
    try:
        # --- Lands ---
        for l_data in DEMO_LAND_DATA:
            if not db.query(Land).filter(Land.id == l_data["id"]).first():
                db.add(Land(
                    id=l_data["id"], survey_number=l_data["survey_number"],
                    subdivision_number=l_data["subdivision_number"],
                    location=l_data["location"], village=l_data["village"],
                    taluk=l_data["taluk"], district=l_data["district"],
                    area_sq_ft=l_data["area_sq_ft"], land_type=l_data["land_type"],
                    owner=l_data["owner"], status=l_data["status"],
                    is_for_sale=l_data.get("is_for_sale", False),
                    asking_price=l_data.get("asking_price"),
                    posted_date=l_data.get("posted_date"),
                    risk_score=l_data["risk_score"], health_score=l_data["health_score"],
                    coordinates=l_data["coordinates"]
                ))
        db.commit()
        logger.info("Lands seeded.")

        # --- Owners ---
        for land_id, owners_list in OWNERS_DATA.items():
            if land_id == "default":
                continue
            for o in owners_list:
                if not db.query(Owner).filter(Owner.land_id == land_id, Owner.name == o["name"]).first():
                    db.add(Owner(land_id=land_id, name=o["name"], period=o["period"], owner_type=o["type"]))
        db.commit()

        # --- History ---
        for land_id, hist_list in HISTORY_DATA.items():
            if land_id == "default":
                continue
            for h in hist_list:
                if not db.query(LandHistory).filter(LandHistory.land_id == land_id, LandHistory.year == h["year"]).first():
                    db.add(LandHistory(land_id=land_id, year=h["year"], owner=h["owner"],
                                       status=h["status"], transactions=h["transactions"],
                                       risk_score=h["risk_score"], boundary_status=h["boundary_status"]))
        db.commit()
        logger.info("History seeded.")

        # --- Documents ---
        for land_id, docs in DOCUMENTS_DATA.items():
            if land_id == "default":
                continue
            for doc in docs:
                if not db.query(LandDocument).filter(LandDocument.land_id == land_id, LandDocument.doc_no == doc["doc_no"]).first():
                    db.add(LandDocument(land_id=land_id, doc_no=doc["doc_no"], type=doc["type"],
                                        date=doc["date"], verification=doc["verification"], result=doc["result"]))
        db.commit()
        logger.info("Documents seeded.")

        # --- Legal Cases ---
        for land_id, cases_list in CASES_DATA.items():
            if land_id == "default":
                continue
            for c in cases_list:
                if not db.query(LegalCase).filter(LegalCase.land_id == land_id, LegalCase.case_no == c["case_no"]).first():
                    db.add(LegalCase(land_id=land_id, case_no=c["case_no"], case_type=c["type"],
                                     court=c["court"], filing_date=c["filing_date"], status=c["status"]))
        db.commit()
        logger.info("Legal cases seeded.")

        # --- Mortgages ---
        for land_id, mort_list in MORTGAGES_DATA.items():
            if land_id == "default":
                continue
            for m in mort_list:
                if not db.query(Mortgage).filter(Mortgage.land_id == land_id, Mortgage.bank == m["bank"]).first():
                    db.add(Mortgage(land_id=land_id, bank=m["bank"], start_date=m["start_date"],
                                    release_date=m["release_date"], status=m["status"]))
        db.commit()
        logger.info("Mortgages seeded.")

        # --- Verification Records ---
        for land_id, ver in DOC_VERIFICATION_DATA.items():
            if land_id == "default":
                continue
            if not db.query(VerificationRecord).filter(VerificationRecord.land_id == land_id).first():
                db.add(VerificationRecord(land_id=land_id, overall_result=ver["overall_result"],
                                          score=ver["score"], fields=ver["fields"],
                                          explanation=ver["explanation"]))
        db.commit()
        logger.info("Verification records seeded.")

        # --- Alerts ---
        if db.query(Alert).count() == 0:
            initial_alerts = [
                Alert(land_id="LND-1004", date=datetime.now().strftime("%Y-%m-%d"),
                      title="Legal Case Alert", message="Found active legal case for Industrial Estate.", type="Legal Case"),
                Alert(land_id="LND-1002", date=datetime.now().strftime("%Y-%m-%d"),
                      title="Boundary Mismatch", message="Boundary discrepancy noted in recent survey.", type="Boundary Change"),
                Alert(land_id="LND-1007", date=datetime.now().strftime("%Y-%m-%d"),
                      title="Verification Pending", message="Document details require secondary verification.", type="Document Verification"),
            ]
            for a in initial_alerts:
                db.add(a)
            db.commit()
            logger.info("Alerts seeded.")

        # --- Users (Phase 2.5 Auth) ---
        seed_demo_users_in_db(db)
        logger.info("Demo users seeded.")

        logger.info("Database seeding complete.")
    except Exception as e:
        logger.error(f"Seeding error: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and seed demo data. Graceful if DB is unavailable."""
    global DB_AVAILABLE
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully.")
        _seed_database()
        DB_AVAILABLE = True
    except Exception as e:
        DB_AVAILABLE = False
        logger.warning(
            f"Database initialization deferred (PostgreSQL not reachable or connection error): {e}\n"
            "Set DATABASE_URL in your environment or .env file. "
            "The application will start with in-memory / demo data fallbacks."
        )
    yield
    # shutdown


app = FastAPI(title="LandTrace360 Complete API", lifespan=lifespan)

# CORS — always allow the deployed Vercel frontend + localhost / 127.0.0.1 for dev.
# FRONTEND_URL env var is also respected if set (e.g. for staging/preview URLs).
_VERCEL_URL = "https://land-trace360.vercel.app"
_frontend_url = os.environ.get("FRONTEND_URL", "").strip()
_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    _VERCEL_URL,  # production Vercel frontend — always allowed
    "https://landtrace360.vercel.app",
]
# Add FRONTEND_URL env var if it is set and not already in the list
if _frontend_url and _frontend_url not in _allowed_origins:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "LandTrace360 Complete API",
        "version": "2.6.0"
    }

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
        "is_for_sale": True, "asking_price": 2200000, "posted_date": "2026-09-02",
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
    language: Optional[str] = "en"

class ChatRequest(BaseModel):
    message: str
    land_id: Optional[str] = None
    language: Optional[str] = "en"
    conversation_id: Optional[str] = None

def _resolve_land_id(identifier: str, db: Optional[Session] = None) -> str:
    """Resolve an identifier that might be a survey_number or land_id to a canonical land_id."""
    clean_id = (identifier or "").strip()
    for l in DEMO_LAND_DATA:
        if l["id"].upper() == clean_id.upper():
            return l["id"]
    for l in DEMO_LAND_DATA:
        if (l.get("survey_number") or "").strip().upper() == clean_id.upper():
            return l["id"]
    if db is not None:
        try:
            row = db.query(Land).filter(
                (Land.id == clean_id) | (Land.survey_number == clean_id)
            ).first()
            if row:
                return row.id
        except Exception:
            pass
    return clean_id


# NOTE: ANNOUNCEMENTS and SELLER_DOCUMENTS are now persisted in the database.
# These variables are intentionally removed; use DB queries instead.

@app.get("/api/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            total = db.query(Land).count()
            verified = db.query(Land).filter(Land.status == "Verified").count()
            for_sale = db.query(Land).filter(Land.is_for_sale == True).count()
            recent_announcements = db.query(SellerListing).count()
        except Exception:
            total = len(DEMO_LAND_DATA)
            verified = len([l for l in DEMO_LAND_DATA if l.get("status") == "Verified"])
            for_sale = len([l for l in DEMO_LAND_DATA if l.get("is_for_sale")])
            recent_announcements = 0
    else:
        total = len(DEMO_LAND_DATA)
        verified = len([l for l in DEMO_LAND_DATA if l.get("status") == "Verified"])
        for_sale = len([l for l in DEMO_LAND_DATA if l.get("is_for_sale")])
        recent_announcements = 0
    high_risk = len([v for k, v in RISK_DATA.items() if k != "default" and v.get("level") == "HIGH"])
    return {
        "total_lands": total,
        "verified_lands": verified,
        "lands_for_sale": for_sale,
        "high_risk_lands": high_risk,
        "recent_announcements": recent_announcements,
        "documents_requiring_review": 2,
        "new_alerts": 3,
        "average_land_health": 82,
        "predicted_risk_changes": "2 lands showing increasing risk"
    }

def _land_to_dict(land: Land) -> dict:
    return {
        "id": land.id, "survey_number": land.survey_number,
        "subdivision_number": land.subdivision_number, "location": land.location,
        "village": land.village, "taluk": land.taluk, "district": land.district,
        "area_sq_ft": land.area_sq_ft, "land_type": land.land_type, "owner": land.owner,
        "status": land.status, "is_for_sale": land.is_for_sale,
        "asking_price": land.asking_price, "posted_date": land.posted_date,
        "risk_score": land.risk_score, "health_score": land.health_score,
        "coordinates": land.coordinates
    }

@app.get("/api/search")
def search_lands(q: Optional[str] = None, status: Optional[str] = None, land_type: Optional[str] = None, db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            query = db.query(Land)
            if status:
                query = query.filter(Land.status == status)
            if land_type:
                query = query.filter(Land.land_type == land_type)
            lands = query.all()
            if lands:
                results = [_land_to_dict(l) for l in lands]
                if q:
                    q_lower = q.lower()
                    results = [l for l in results if q_lower in l["id"].lower() or q_lower in l["survey_number"].lower() or q_lower in l["location"].lower() or q_lower in l["owner"].lower()]
                return results
        except Exception:
            pass
    results = DEMO_LAND_DATA
    if q:
        q_lower = q.lower()
        results = [l for l in results if q_lower in l["id"].lower() or q_lower in l["survey_number"].lower() or q_lower in l["location"].lower() or q_lower in l["owner"].lower()]
    if status:
        results = [l for l in results if l["status"].lower() == status.lower()]
    if land_type:
        results = [l for l in results if l["land_type"].lower() == land_type.lower()]
    return results

_IN_MEMORY_SAVED_LANDS = set()

@app.get("/api/saved-lands")
def get_saved_lands(db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            saved = db.query(SavedLand).all()
            return [s.land_id for s in saved]
        except Exception:
            pass
    return list(_IN_MEMORY_SAVED_LANDS)

@app.post("/api/saved-lands/{land_id:path}")
def toggle_saved_land(land_id: str, db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            ex = db.query(SavedLand).filter(SavedLand.land_id == land_id).first()
            if ex:
                db.delete(ex)
                db.commit()
                return {"status": "removed"}
            else:
                db.add(SavedLand(land_id=land_id))
                db.commit()
                return {"status": "added"}
        except Exception:
            pass
    if land_id in _IN_MEMORY_SAVED_LANDS:
        _IN_MEMORY_SAVED_LANDS.remove(land_id)
        return {"status": "removed"}
    else:
        _IN_MEMORY_SAVED_LANDS.add(land_id)
        return {"status": "added"}

@app.post("/api/lands/{land_id:path}/save")
def save_land_explicit(land_id: str, db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            ex = db.query(SavedLand).filter(SavedLand.land_id == land_id).first()
            if not ex:
                db.add(SavedLand(land_id=land_id))
                db.commit()
            return {"status": "added"}
        except Exception:
            pass
    _IN_MEMORY_SAVED_LANDS.add(land_id)
    return {"status": "added"}

@app.delete("/api/lands/{land_id:path}/save")
def delete_saved_land_explicit(land_id: str, db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            ex = db.query(SavedLand).filter(SavedLand.land_id == land_id).first()
            if ex:
                db.delete(ex)
                db.commit()
            return {"status": "removed"}
        except Exception:
            pass
    _IN_MEMORY_SAVED_LANDS.discard(land_id)
    return {"status": "removed"}
    
@app.get("/api/lands/saved")
def get_saved_explicit(db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            saved = db.query(SavedLand).all()
            return [s.land_id for s in saved]
        except Exception:
            pass
    return list(_IN_MEMORY_SAVED_LANDS)

@app.post("/api/lands/{land_id:path}/ask")
def ask_land_ai(land_id: str, query: AskQuery, db: Session = Depends(get_db)):
    """
    Explainable AI endpoint delivering structured:
      ANSWER
      WHY
      EVIDENCE
    Respects query.language ('en', 'ta', 'hi').
    Uses only verified stored/demo records. Never fabricates evidence.
    """
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    lang = (query.language or "en").lower().strip()
    if lang not in ["en", "ta", "hi"]:
        lang = "en"

    # Get land data
    land = None
    if DB_AVAILABLE:
        try:
            db_l = db.query(Land).filter(Land.id == canonical_id).first()
            if db_l:
                land = _land_to_dict(db_l)
        except Exception:
            pass
    if not land:
        land = next((l for l in DEMO_LAND_DATA if l["id"] == canonical_id), None)

    no_evidence_msg = {
        "en": "No supporting record is available in the project database.",
        "ta": "திட்ட தரவுத்தளத்தில் ஆதரவு பதிவு எதுவும் கிடைக்கவில்லை.",
        "hi": "परियोजना डेटाबेस में कोई समर्थक रिकॉर्ड उपलब्ध नहीं है।"
    }[lang]

    if not land or not canonical_id.startswith("LND-"):
        fallbacks = {
            "en": {
                "answer": "I can only answer questions about this land using verified LandTrace360 demo records.",
                "why": "The queried identifier does not correspond to an accessible land parcel.",
                "evidence": [{"label": "Search Status", "value": no_evidence_msg}]
            },
            "ta": {
                "answer": "சரிபார்க்கப்பட்ட லேண்ட் ட்ரேஸ்360 திட்ட பதிவுகளைப் பயன்படுத்தி மட்டுமே என்னால் பதிலளிக்க முடியும்.",
                "why": "கேட்கப்பட்ட நில அடையாள எண் அணுகக்கூடிய பதிவேடுகளில் இல்லை.",
                "evidence": [{"label": "தேடல் நிலை", "value": no_evidence_msg}]
            },
            "hi": {
                "answer": "मैं केवल सत्यापित LandTrace360 परियोजना रिकॉर्ड का उपयोग करके इस भूमि के बारे में उत्तर दे सकता हूँ।",
                "why": "पूछा गया पहचानकर्ता सुलभ भूमि पार्सल से मेल नहीं खाता है।",
                "evidence": [{"label": "खोज स्थिति", "value": no_evidence_msg}]
            }
        }
        res = fallbacks[lang]
        return {**res, "sources": []}

    q = query.question.lower().strip()
    risk = RISK_DATA.get(canonical_id, RISK_DATA["default"])
    dna = DNA_DATA.get(canonical_id, DNA_DATA["default"])
    docs = DOCUMENTS_DATA.get(canonical_id, DOCUMENTS_DATA["default"])
    cases = CASES_DATA.get(canonical_id, CASES_DATA["default"])
    mortgages = MORTGAGES_DATA.get(canonical_id, MORTGAGES_DATA["default"])
    boundary = BOUNDARY_DETECTION_DATA.get(canonical_id, BOUNDARY_DETECTION_DATA["default"])
    frag = FRAGMENTATION_ANALYSIS_DATA.get(canonical_id, FRAGMENTATION_ANALYSIS_DATA["default"])
    history = HISTORY_DATA.get(canonical_id, HISTORY_DATA["default"])
    owners = OWNERS_DATA.get(canonical_id, OWNERS_DATA["default"])

    # --- 1. Intent: Owner ---
    if any(kw in q for kw in ["owner", "who owns", "whose", "belong", "உரிமையாளர்", "யார்", "மாлик", "स्वामी"]):
        sources = ["Ownership Registry", "Title Records"]
        if lang == "ta":
            answer = f"**{canonical_id}** நிலத்தின் தற்போதைய பதிவு செய்யப்பட்ட உரிமையாளர் **{land['owner']}** ஆவார்."
            why = "அதிகாரப்பூர்வ நிலப் பதிவேடு மற்றும் உரிமை ஆவணங்களின் அடிப்படையில் சரிபார்க்கப்பட்டது."
            evidence = [
                {"label": "தற்போதைய உரிமையாளர்", "value": land["owner"]},
                {"label": "சர்வே எண்", "value": land["survey_number"]},
                {"label": "பதிவு நிலை", "value": land["status"]},
                {"label": "நில அடையாளம்", "value": canonical_id}
            ]
        elif lang == "hi":
            answer = f"**{canonical_id}** भूमि के वर्तमान पंजीकृत स्वामी **{land['owner']}** हैं।"
            why = "आधिकारिक भूमि रजिस्ट्री और स्वामित्व दस्तावेजों के आधार पर सत्यापित।"
            evidence = [
                {"label": "वर्तमान स्वामी", "value": land["owner"]},
                {"label": "सर्वेक्षण संख्या", "value": land["survey_number"]},
                {"label": "पंजीकृत स्थिति", "value": land["status"]},
                {"label": "भूमि पहचान", "value": canonical_id}
            ]
        else:
            answer = f"The current recorded owner of **{canonical_id}** is **{land['owner']}**."
            why = "Ownership title is verified against land registry records and chain of custody documentation."
            evidence = [
                {"label": "Current Owner", "value": land["owner"]},
                {"label": "Survey Number", "value": land["survey_number"]},
                {"label": "Title Status", "value": land["status"]},
                {"label": "Land ID", "value": canonical_id}
            ]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 2. Intent: Mortgage ---
    if any(kw in q for kw in ["mortgage", "bank", "loan", "lien", "encumbrance", "அடமானம்", "வங்கி", "கடன்", "बंधक", "ऋण", "बैंक"]):
        sources = ["Mortgage Registry", "Banking Liens Database"]
        active_m = next((m for m in mortgages if m.get("status") == "Active"), None)
        if active_m:
            if lang == "ta":
                answer = f"ஆம், இந்த நிலத்தில் {active_m['bank']} வங்கியுடன் செயல்பாட்டில் உள்ள அடமானப் பதிவு உள்ளது."
                why = "நிதிப் பொறுப்புப் பதிவேட்டில் இந்த நிலத்திற்கு செயல்பாட்டில் (Active) உள்ள அடமானப் பதிவு உள்ளது."
                evidence = [
                    {"label": "வங்கி / கடன் நிறுவனம்", "value": active_m["bank"]},
                    {"label": "அடமான நிலை", "value": active_m["status"]},
                    {"label": "பதிவு செய்யப்பட்ட தேதி", "value": active_m["start_date"]},
                    {"label": "எதிர்பார்க்கப்படும் விடுவிப்பு", "value": active_m["release_date"]}
                ]
            elif lang == "hi":
                answer = f"हाँ, इस भूमि पर {active_m['bank']} के साथ एक सक्रिय बंधक (ऋण) दर्ज है।"
                why = "वित्तीय प्रभार रजिस्ट्री में इस भूमि के लिए सक्रिय (Active) स्थिति वाला बंधक रिकॉर्ड मौजूद है।"
                evidence = [
                    {"label": "बैंक / ऋणदाता", "value": active_m["bank"]},
                    {"label": "बंधक स्थिति", "value": active_m["status"]},
                    {"label": "पंजीकरण तिथि", "value": active_m["start_date"]},
                    {"label": "अपेक्षित मुक्ति तिथि", "value": active_m["release_date"]}
                ]
            else:
                answer = f"Yes, an active mortgage is recorded on this property with {active_m['bank']}."
                why = "The land has a mortgage record whose status is Active in the financial encumbrance registry."
                evidence = [
                    {"label": "Bank / Lender", "value": active_m["bank"]},
                    {"label": "Mortgage Status", "value": active_m["status"]},
                    {"label": "Registration Date", "value": active_m["start_date"]},
                    {"label": "Expected Release", "value": active_m["release_date"]}
                ]
        elif mortgages:
            m0 = mortgages[0]
            if lang == "ta":
                answer = "தற்போது நிலுவையில் உள்ள அடமானம் எதுவும் இல்லை. முந்தைய அடமானம் விடுவிக்கப்பட்டுள்ளது."
                why = "அடமானப் பதிவுகளில் முந்தைய நிதிப் பொறுப்புகள் முடிக்கப்பட்டு விடுவிக்கப்பட்டதாகக் காட்டுகின்றன."
                evidence = [
                    {"label": "வங்கி", "value": m0["bank"]},
                    {"label": "அடமான நிலை", "value": m0["status"]},
                    {"label": "விடுவிக்கப்பட்ட தேதி", "value": m0["release_date"]}
                ]
            elif lang == "hi":
                answer = "वर्तमान में कोई सक्रिय बंधक लंबित नहीं है। पिछला बंधक चुकाया जा चुका है और जारी किया गया है।"
                why = "बंधक रिकॉर्ड दर्शाते हैं कि पिछले सभी दायित्व पूर्ण और मुक्त कर दिए गए हैं।"
                evidence = [
                    {"label": "बैंक", "value": m0["bank"]},
                    {"label": "बंधक स्थिति", "value": m0["status"]},
                    {"label": "मुक्ति तिथि", "value": m0["release_date"]}
                ]
            else:
                answer = "No active mortgage is currently pending. Prior recorded mortgage has been fully cleared and released."
                why = "Mortgage records indicate release status for prior liabilities."
                evidence = [
                    {"label": "Bank", "value": m0["bank"]},
                    {"label": "Mortgage Status", "value": m0["status"]},
                    {"label": "Release Date", "value": m0["release_date"]}
                ]
        else:
            if lang == "ta":
                answer = "இந்த நிலத்திற்கான அடமானப் பதிவுகள் எதுவும் திட்ட பதிவுகளில் இல்லை."
                why = "இந்த நிலத்திற்கான அடமானப் பதிவேட்டில் எந்த ஒரு அடமானப் பதிவும் கிடைக்கவில்லை."
                evidence = [{"label": "அடமான நிலை", "value": no_evidence_msg}]
            elif lang == "hi":
                answer = "इस भूमि के लिए कोई सक्रिय बंधक या बैंक ऋण दर्ज नहीं है।"
                why = "इस भूमि के लिए डेटाबेस में कोई बंधक या प्रभार रिकॉर्ड नहीं मिला।"
                evidence = [{"label": "बंधक स्थिति", "value": no_evidence_msg}]
            else:
                answer = "No active mortgage or bank loan is recorded for this land."
                why = "No supporting mortgage or lien records were found in the database."
                evidence = [{"label": "Mortgage Status", "value": no_evidence_msg}]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 3. Intent: Risk Score ---
    if any(kw in q for kw in ["risk", "score", "why risk", "safe", "danger", "hazard", "இடர்", "ஆபத்து", "மதிப்பீடு", "जोखिम", "स्कोर", "सुरक्षित"]):
        sources = ["AI Risk Engine", "Multi-Factor Registry Analysis"]
        if lang == "ta":
            answer = f"தற்போதைய திட்ட இடர் மதிப்பீடு **{risk['overall_score']}/100** ({risk['level']} ஆபத்து) ஆகும்."
            why = "பதிவு செய்யப்பட்ட சட்ட வழக்குகள், எல்லை வேறுபாடுகள் மற்றும் ஆவண சரிபார்ப்பு நிலைகளின் அடிப்படையில் கணக்கிடப்பட்டுள்ளது."
            evidence = [
                {"label": "ஒட்டுமொத்த இடர் மதிப்பீடு", "value": f"{risk['overall_score']}/100 ({risk['level']})"},
                {"label": "சட்ட ரீதியான ஆபத்து", "value": risk["legal_risk"]},
                {"label": "எல்லை ஆபத்து", "value": risk["boundary_risk"]},
                {"label": "உரிமையாளர் ஆபத்து", "value": risk["ownership_risk"]},
                {"label": "ஆவண ஆபத்து", "value": risk["document_risk"]}
            ]
        elif lang == "hi":
            answer = f"वर्तमान परियोजना जोखिम स्कोर **{risk['overall_score']}/100** ({risk['level']} जोखिम) है।"
            why = "दर्ज कानूनी मुकदमों, सीमा विसंगतियों, स्वामित्व और दस्तावेज़ जोखिम कारकों के आधार पर निर्धारित किया गया है।"
            evidence = [
                {"label": "कुल जोखिम स्कोर", "value": f"{risk['overall_score']}/100 ({risk['level']})"},
                {"label": "कानूनी जोखिम", "value": risk["legal_risk"]},
                {"label": "सीमा जोखिम", "value": risk["boundary_risk"]},
                {"label": "स्वामित्व जोखिम", "value": risk["ownership_risk"]},
                {"label": "दस्तावेज़ जोखिम", "value": risk["document_risk"]}
            ]
        else:
            answer = f"The current project risk score is **{risk['overall_score']}/100** ({risk['level']} Risk)."
            why = "High risk is mainly associated with the stored legal, boundary, ownership, and document risk factors." if risk['overall_score'] >= 70 else ("Moderate risk considerations noted across boundary or documentation." if risk['overall_score'] >= 35 else "Low risk score with strong ownership stability and clear title documentation.")
            evidence = [
                {"label": "Overall Risk Score", "value": f"{risk['overall_score']}/100 ({risk['level']})"},
                {"label": "Legal Risk", "value": risk["legal_risk"]},
                {"label": "Boundary Risk", "value": risk["boundary_risk"]},
                {"label": "Ownership Risk", "value": risk["ownership_risk"]},
                {"label": "Document Risk", "value": risk["document_risk"]}
            ]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 4. Intent: Legal Cases ---
    if any(kw in q for kw in ["legal", "case", "court", "dispute", "litigation", "சட்டம்", "வழக்கு", "நீதிமன்றம்", "कानूनी", "मामला", "अदालत", "विवाद"]):
        sources = ["Judicial Court Dockets", "Litigation Registry"]
        if cases:
            if lang == "ta":
                answer = f"**{canonical_id}** நிலத்திற்கு {len(cases)} சட்ட வழக்கு(கள்) பதிவாகியுள்ளன."
                why = "நீதிமன்ற வழக்கு பதிவேடுகளிலிருந்து சரிபார்க்கப்பட்டது."
                evidence = [{"label": f"வழக்கு எண் {c['case_no']}", "value": f"{c['type']} - {c['court']} (நிலை: {c['status']}, பதிவு: {c['filing_date']})"} for c in cases]
            elif lang == "hi":
                answer = f"**{canonical_id}** के लिए {len(cases)} कानूनी मामले दर्ज पाए गए हैं।"
                why = "न्यायालय डॉकेट और विवाद रजिस्ट्री के साथ मिलान किया गया।"
                evidence = [{"label": f"मामला सं. {c['case_no']}", "value": f"{c['type']} - {c['court']} (स्थिति: {c['status']}, दर्ज: {c['filing_date']})"} for c in cases]
            else:
                answer = f"Found {len(cases)} legal case(s) associated with **{canonical_id}**."
                why = "Matched against active judicial court docket records for this parcel."
                evidence = [{"label": f"Case {c['case_no']}", "value": f"{c['type']} at {c['court']} (Status: {c['status']}, Filed: {c['filing_date']})"} for c in cases]
        else:
            if lang == "ta":
                answer = f"**{canonical_id}** நிலத்திற்கு திட்ட பதிவுகளில் எந்தவொரு நிலுவையிலுள்ள வழக்குகளும் இல்லை."
                why = "நீதிமன்ற பதிவேடுகளில் நிலுவையில் உள்ள வழக்குகள் ஏதுமில்லை என பதிவாகியுள்ளது."
                evidence = [{"label": "நீதிமன்ற வழக்குகள்", "value": no_evidence_msg}]
            elif lang == "hi":
                answer = f"**{canonical_id}** के लिए परियोजना रिकॉर्ड में कोई सक्रिय कानूनी मामला नहीं मिला।"
                why = "न्यायालय विवाद रजिस्ट्री शून्य लंबित मामलों के साथ स्पष्ट रिकॉर्ड दिखाती है।"
                evidence = [{"label": "मुकदमा डॉकेट", "value": no_evidence_msg}]
            else:
                answer = f"No active legal cases found in project records for **{canonical_id}**."
                why = "Civil litigation registry returns clean title with zero pending lawsuits."
                evidence = [{"label": "Litigation Docket", "value": no_evidence_msg}]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 5. Intent: Boundary ---
    if any(kw in q for kw in ["boundary", "border", "encroach", "survey", "எல்லை", "सीमा"]):
        sources = ["Cadastral Survey Records", "Satellite Boundary AI"]
        if lang == "ta":
            answer = f"**{canonical_id}** நிலத்தின் எல்லை நிலை: **{boundary['change_status']}** ({boundary['deviation_percentage']}% விலகல்)."
            why = "முந்தைய ஆய்வு வரைபடத்துடன் சமீபத்திய செயற்கைக்கோள் நில அளவீடு ஒப்பிடப்பட்டது."
            evidence = [
                {"label": "எல்லை நிலை", "value": boundary["change_status"]},
                {"label": "விலகல் சதவீதம்", "value": f"{boundary['deviation_percentage']}%"},
                {"label": "கடைசி ஆய்வு தேதி", "value": boundary["last_survey_date"]},
                {"label": "இடர் தாக்கம்", "value": boundary["risk_impact"]}
            ]
        elif lang == "hi":
            answer = f"**{canonical_id}** की सीमा स्थिति: **{boundary['change_status']}** ({boundary['deviation_percentage']}% विचलन)।"
            why = "पिछले सर्वेक्षण मानचित्र के साथ उपग्रह और भूकर सर्वेक्षण की तुलना की गई।"
            evidence = [
                {"label": "सीमा स्थिति", "value": boundary["change_status"]},
                {"label": "विचलन प्रतिशत", "value": f"{boundary['deviation_percentage']}%"},
                {"label": "अंतिम सर्वेक्षण तिथि", "value": boundary["last_survey_date"]},
                {"label": "जोखिम प्रभाव", "value": boundary["risk_impact"]}
            ]
        else:
            answer = f"Boundary Status for **{canonical_id}**: **{boundary['change_status']}** with a **{boundary['deviation_percentage']}%** deviation index."
            why = "Current survey footprint was compared against historical cadastral registry markers."
            evidence = [
                {"label": "Boundary Status", "value": boundary["change_status"]},
                {"label": "Deviation Index", "value": f"{boundary['deviation_percentage']}%"},
                {"label": "Last Survey Date", "value": boundary["last_survey_date"]},
                {"label": "Risk Impact", "value": boundary["risk_impact"]}
            ]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 6. Intent: Subdivisions / Fragmentation ---
    if any(kw in q for kw in ["subdivision", "fragment", "split", "divided", "பிரிவு", "उपखंड", "विभाजन"]):
        sources = ["Fragmentation Detector", "Cadastral Plot History"]
        if frag["subdivisions"] == 0:
            if lang == "ta":
                answer = f"**{canonical_id}** நிலத்தில் உபபிரிவுகள் ஏதுமில்லை (0). அசல் பரப்பளவான {frag['original_area']} சதுர அடி முழுமையாக தக்கவைக்கப்பட்டுள்ளது."
            elif lang == "hi":
                answer = f"**{canonical_id}** में कोई उपखंड नहीं है (0)। यह अपने मूल {frag['original_area']} वर्ग फुट पार्सल को बनाए रखता है।"
            else:
                answer = f"**{canonical_id}** has **0 subdivisions**. It remains the original {frag['original_area']} sq ft parcel with No Fragmentation."
        else:
            if lang == "ta":
                answer = f"**{canonical_id}** நிலத்தில் **{frag['subdivisions']} உபபிரிவுகள்** செய்யப்பட்டுள்ளன. அசல் {frag['original_area']} சதுர அடியிலிருந்து தற்போது {frag['current_area']} சதுர அடியாக உள்ளது."
            elif lang == "hi":
                answer = f"**{canonical_id}** में **{frag['subdivisions']} उपखंड** हुए हैं। यह मूल {frag['original_area']} वर्ग फुट से अब {frag['current_area']} वर्ग फुट है।"
            else:
                answer = f"**{canonical_id}** has **{frag['subdivisions']} subdivisions**. It was originally {frag['original_area']} sq ft and now sits at {frag['current_area']} sq ft. {frag['description']}"
        why = "Calculated from parcel lineage records and historical parent plot registry."
        evidence = [
            {"label": "Subdivisions Count", "value": str(frag["subdivisions"])},
            {"label": "Original Area", "value": f"{frag['original_area']} sq ft"},
            {"label": "Current Area", "value": f"{frag['current_area']} sq ft"},
            {"label": "Fragmentation Status", "value": frag["status"]}
        ]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 7. Intent: History / Timeline ---
    if any(kw in q for kw in ["past", "history", "happened", "timeline", "வரலாறு", "इतिहास", "समय"]):
        sources = ["Time Machine Database", "Historical Ownership Chain"]
        hist_summary = "; ".join([f"In {h['year']}: {h['owner']} ({h['status']})" for h in history])
        if lang == "ta":
            answer = f"**{canonical_id}** நிலத்தின் வரலாற்று சுருக்கம்:\n" + "\n".join([f"- **{h['year']}**: உரிமையாளர் {h['owner']}, நிலை: {h['status']}" for h in history])
            why = "நில உரிமை காலவரிசைப் பதிவேட்டிலிருந்து தொகுக்கப்பட்டது."
        elif lang == "hi":
            answer = f"**{canonical_id}** का ऐतिहासिक सारांश:\n" + "\n".join([f"- **{h['year']}**: स्वामी {h['owner']}, स्थिति: {h['status']}" for h in history])
            why = "भूमि स्वामित्व समयरेखा रजिस्ट्री से संकलित।"
        else:
            answer = f"Chronological history for **{canonical_id}**:\n" + "\n".join([f"- **{h['year']}**: Owned by {h['owner']}, Status: {h['status']}" for h in history])
            why = "Compiled from chronological deed transfers and tax registry ledgers."
        evidence = [{"label": f"Year {h['year']}", "value": f"Owner: {h['owner']}, Status: {h['status']}, Risk: {h['risk_score']}"} for h in history]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 8. Intent: Documents ---
    if any(kw in q for kw in ["document", "doc ", "docs", "deed", "certificate", "record", "ஆவணம்", "பத்திரம்", "दस्तावेज़"]):
        sources = ["Document Verification Engine", "Registry Archive"]
        if docs:
            if lang == "ta":
                answer = f"**{canonical_id}** நிலத்திற்கு {len(docs)} சரிபார்க்கப்பட்ட ஆவணங்கள் கிடைக்கின்றன."
                why = "பதிவுத்துறை மற்றும் பத்திரக் காப்பகப் பதிவுகளின்படி சரிபார்க்கப்பட்டது."
            elif lang == "hi":
                answer = f"**{canonical_id}** के लिए {len(docs)} सत्यापित दस्तावेज़ उपलब्ध हैं।"
                why = "पंजीकरण विभाग और अभिलेखागार रिकॉर्ड के अनुसार सत्यापित।"
            else:
                answer = f"Found {len(docs)} official documents registered on file for **{canonical_id}**."
                why = "Verified against registered deed dockets and digital land archives."
            evidence = [{"label": f"Doc {d['doc_no']}", "value": f"Type: {d['type']}, Date: {d['date']}, Verification: {d['verification']}"} for d in docs]
        else:
            answer = "No document records are available for this parcel."
            why = "Document registry has no matching files for this parcel ID."
            evidence = [{"label": "Document Records", "value": no_evidence_msg}]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 9. Intent: DNA / Health ---
    if any(kw in q for kw in ["health", "dna", "stability", "தன்மை", "स्वास्थ्य"]):
        sources = ["Land DNA Diagnostic Engine"]
        if lang == "ta":
            answer = f"**{canonical_id}** நிலத்தின் ஒட்டுமொத்த நல்வாழ்வு மதிப்பீடு (Health Score): **{dna['overall_health']}%** ஆகும்."
            why = "உரிமையாளர் நிலைத்தன்மை, ஆவண நலம், சட்டப் பாதுகாப்பு மற்றும் அடமான நிலைகளின் கூட்டு பகுப்பாய்வு."
            evidence = [
                {"label": "ஒட்டுமொத்த நலம்", "value": f"{dna['overall_health']}%"},
                {"label": "உரிமை நிலைத்தன்மை", "value": f"{dna['ownership_stability']}%"},
                {"label": "ஆவண நலம்", "value": f"{dna['document_health']}%"},
                {"label": "சட்ட பாதுகாப்பு", "value": f"{dna['legal_safety']}%"},
                {"label": "அடமான நிலைத்தன்மை", "value": f"{dna['mortgage_status']}%"}
            ]
        elif lang == "hi":
            answer = f"**{canonical_id}** के लिए भूमि स्वास्थ्य स्कोर (Health Score): **{dna['overall_health']}%** है।"
            why = "स्वामित्व स्थिरता, दस्तावेज़ अखंडता, कानूनी सुरक्षा और बंधक स्थिति का समग्र मूल्यांकन।"
            evidence = [
                {"label": "कुल स्वास्थ्य", "value": f"{dna['overall_health']}%"},
                {"label": "स्वामित्व स्थिरता", "value": f"{dna['ownership_stability']}%"},
                {"label": "दस्तावेज़ स्वास्थ्य", "value": f"{dna['document_health']}%"},
                {"label": "कानूनी सुरक्षा", "value": f"{dna['legal_safety']}%"},
                {"label": "बंधक स्थिति", "value": f"{dna['mortgage_status']}%"}
            ]
        else:
            answer = f"Land Health Score for **{canonical_id}** is **{dna['overall_health']}%**."
            why = "Derived from aggregate multi-factor scoring of ownership stability, legal safety, document validity, and boundary consistency."
            evidence = [
                {"label": "Overall Health", "value": f"{dna['overall_health']}%"},
                {"label": "Ownership Stability", "value": f"{dna['ownership_stability']}%"},
                {"label": "Document Health", "value": f"{dna['document_health']}%"},
                {"label": "Legal Safety", "value": f"{dna['legal_safety']}%"},
                {"label": "Mortgage Stability", "value": f"{dna['mortgage_status']}%"}
            ]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 10. Intent: Comprehensive Summary ---
    if any(kw in q for kw in ["summary", "overview", "everything", "all", "complete", "detail", "full", "சுருக்கம்", "सारांश"]):
        sources = ["Registry Overview", "Risk Engine", "Cadastral Dockets"]
        active_m_txt = "Active" if any(m.get("status") == "Active" for m in mortgages) else ("Released" if mortgages else "None")
        cases_txt = f"{len(cases)} case(s)" if cases else "None"
        if lang == "ta":
            answer = (f"**{canonical_id} பற்றிய முழுமையான சுருக்கம்:**\n"
                      f"• உரிமையாளர்: {land['owner']}\n"
                      f"• நிலை: {land['status']}\n"
                      f"• பரப்பளவு: {land['area_sq_ft']:,} சதுர அடி ({land['land_type']})\n"
                      f"• இடர் மதிப்பீடு: {risk['overall_score']}/100 ({risk['level']})\n"
                      f"• எல்லை நிலை: {boundary['change_status']}\n"
                      f"• அடமான நிலை: {active_m_txt}\n"
                      f"• சட்ட வழக்குகள்: {cases_txt}")
            why = "அனைத்து முக்கிய திட்ட தரவுத்தள பதிவுகளிலிருந்தும் ஒருங்கிணைக்கப்பட்டது."
        elif lang == "hi":
            answer = (f"**{canonical_id} का समग्र सारांश:**\n"
                      f"• स्वामी: {land['owner']}\n"
                      f"• स्थिति: {land['status']}\n"
                      f"• क्षेत्रफल: {land['area_sq_ft']:,} वर्ग फुट ({land['land_type']})\n"
                      f"• जोखिम स्कोर: {risk['overall_score']}/100 ({risk['level']})\n"
                      f"• सीमा स्थिति: {boundary['change_status']}\n"
                      f"• बंधक स्थिति: {active_m_txt}\n"
                      f"• कानूनी मामले: {cases_txt}")
            why = "सभी प्रमुख परियोजना डेटाबेस तालिकाओं से संकलित।"
        else:
            answer = (f"**Comprehensive Land Summary for {canonical_id}:**\n"
                      f"• Owner: {land['owner']}\n"
                      f"• Status: {land['status']}\n"
                      f"• Area: {land['area_sq_ft']:,} sq ft ({land['land_type']})\n"
                      f"• Risk Score: {risk['overall_score']}/100 ({risk['level']})\n"
                      f"• Boundary: {boundary['change_status']}\n"
                      f"• Mortgage: {active_m_txt}\n"
                      f"• Legal Cases: {cases_txt}")
            why = "Aggregated across all primary registry and diagnostic tables in the project database."
        evidence = [
            {"label": "Owner", "value": land["owner"]},
            {"label": "Area", "value": f"{land['area_sq_ft']:,} sq ft"},
            {"label": "Type", "value": land["land_type"]},
            {"label": "Risk Score", "value": f"{risk['overall_score']}/100"},
            {"label": "Boundary Status", "value": boundary["change_status"]}
        ]
        return {"answer": answer, "why": why, "evidence": evidence, "sources": sources}

    # --- 11. Fallback ---
    if lang == "ta":
        answer = f"**{canonical_id}** நில பதிவுகளின்படி: இது **{land['location']}** பகுதியில் உள்ள **{land['land_type']}** நிலம். தற்போதைய உரிமையாளர் **{land['owner']}**, நிலை: **{land['status']}**."
        why = "உரிமையாளர், அடமானம், இடர் மதிப்பீடு, எல்லை, ஆவணங்கள் அல்லது சட்ட வழக்குகள் குறித்து நீங்கள் என்னிடம் கேட்கலாம்."
    elif lang == "hi":
        answer = f"**{canonical_id}** के रिकॉर्ड के अनुसार: यह **{land['location']}** में स्थित **{land['land_type']}** भूमि है। वर्तमान स्वामी **{land['owner']}** हैं, स्थिति: **{land['status']}**।"
        why = "आप मुझसे स्वामी, बंधक, जोखिम स्कोर, सीमा, दस्तावेज़ या कानूनी मामलों के बारे में पूछ सकते हैं।"
    else:
        answer = f"Based on the records for **{canonical_id}**: it is a **{land['land_type']}** property at **{land['location']}**, owned by **{land['owner']}**, with status **{land['status']}**."
        why = "You can ask about the owner, mortgage, risk score, legal cases, documents, boundary, subdivisions, or request a complete summary."
    evidence = [
        {"label": "Land ID", "value": canonical_id},
        {"label": "Owner", "value": land["owner"]},
        {"label": "Location", "value": land["location"]},
        {"label": "Status", "value": land["status"]}
    ]
    return {"answer": answer, "why": why, "evidence": evidence, "sources": ["General Registry Record"]}

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

@app.get("/api/lands/{land_id:path}/boundary-changes")
def get_boundary_changes(land_id: str, year: Optional[int] = None):
    if year and year in BOUNDARY_HISTORY:
        return BOUNDARY_HISTORY[year]
    return BOUNDARY_HISTORY[2026]

@app.get("/api/lands/{land_id:path}/boundary-detection")
def get_boundary_detection(land_id: str):
    canonical_id = _resolve_land_id(land_id)
    return BOUNDARY_DETECTION_DATA.get(canonical_id, BOUNDARY_DETECTION_DATA["default"])

@app.get("/api/lands/{land_id:path}/fragmentation-analysis")
def get_fragmentation_analysis(land_id: str):
    canonical_id = _resolve_land_id(land_id)
    return FRAGMENTATION_ANALYSIS_DATA.get(canonical_id, FRAGMENTATION_ANALYSIS_DATA["default"])

@app.get("/api/lands/{land_id:path}/fragmentation")
def get_fragmentation(land_id: str, year: Optional[int] = None):
    canonical_id = _resolve_land_id(land_id)
    land_area = next((l["area_sq_ft"] for l in DEMO_LAND_DATA if l["id"] == canonical_id), 0)
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
@app.get("/lands")
def get_lands(db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            lands = db.query(Land).all()
            if lands:
                return [_land_to_dict(l) for l in lands]
        except Exception:
            pass
    return DEMO_LAND_DATA

@app.get("/api/lands/for-sale")
@app.get("/lands/for-sale")
def get_lands_for_sale(db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            lands = db.query(Land).filter(Land.is_for_sale == True).all()
            if lands:
                return [_land_to_dict(l) for l in lands]
        except Exception:
            pass
    return [l for l in DEMO_LAND_DATA if l.get("is_for_sale")]

@app.get("/api/lands/available")
def get_available_lands(
    location: Optional[str] = None,
    district: Optional[str] = None,
    city: Optional[str] = None,
    village: Optional[str] = None,
    land_type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_area: Optional[int] = None,
    max_area: Optional[int] = None,
    verification_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if DB_AVAILABLE:
        try:
            query = db.query(Land).filter(Land.is_for_sale == True)
            if land_type:
                query = query.filter(Land.land_type == land_type)
            if verification_status:
                query = query.filter(Land.status == verification_status)
            if min_price is not None:
                query = query.filter(Land.asking_price >= min_price)
            if max_price is not None:
                query = query.filter(Land.asking_price <= max_price)
            if min_area is not None:
                query = query.filter(Land.area_sq_ft >= min_area)
            if max_area is not None:
                query = query.filter(Land.area_sq_ft <= max_area)
            results = [_land_to_dict(l) for l in query.all()]
            if location:
                q = location.lower()
                results = [l for l in results if q in l.get("location","").lower() or q in l.get("village","").lower() or q in l.get("taluk","").lower() or q in l.get("district","").lower()]
            if district:
                q = district.lower()
                results = [l for l in results if q in l.get("district","").lower()]
            if city:
                q = city.lower()
                results = [l for l in results if q in l.get("taluk","").lower() or q in l.get("location","").lower()]
            if village:
                q = village.lower()
                results = [l for l in results if q in l.get("village","").lower()]
            return results
        except Exception:
            pass
    results = [l for l in DEMO_LAND_DATA if l.get("is_for_sale")]
    return results

@app.get("/api/lands/announcements")
@app.get("/lands/announcements")
def get_announcements(db: Session = Depends(get_db)):
    if DB_AVAILABLE:
        try:
            listings = db.query(SellerListing).all()
            return [{
                "land_id": l.land_id, "location": l.location, "area": l.area,
                "land_type": l.land_type, "expected_price": l.expected_price,
                "description": l.description, "contact": l.contact,
                "posted_date": l.created_at.strftime("%Y-%m-%d") if l.created_at else None
            } for l in listings]
        except Exception:
            pass
    return []

@app.post("/api/lands/announcements")
def post_announcement(announcement: Announcement, db: Session = Depends(get_db)):
    # Check: seller must have a verified uploaded document for this land
    uploaded_doc = db.query(SellerDocumentUpload).filter(
        SellerDocumentUpload.land_id == announcement.land_id,
        SellerDocumentUpload.verification_status == "Verified"
    ).first()
    if not uploaded_doc:
        raise HTTPException(status_code=400, detail="A verified land document must be uploaded before publishing a listing.")
    posted_date = datetime.now().strftime("%Y-%m-%d")
    # Idempotent: update existing or insert new
    existing = db.query(SellerListing).filter(SellerListing.land_id == announcement.land_id).first()
    if existing:
        existing.location = announcement.location
        existing.area = announcement.area
        existing.land_type = announcement.land_type
        existing.expected_price = announcement.expected_price
        existing.description = announcement.description
        existing.contact = announcement.contact
        listing = existing
    else:
        listing = SellerListing(
            land_id=announcement.land_id, location=announcement.location,
            area=announcement.area, land_type=announcement.land_type,
            expected_price=announcement.expected_price, description=announcement.description,
            contact=announcement.contact
        )
        db.add(listing)
    # Update land record to mark as for sale
    land_row = db.query(Land).filter(Land.id == announcement.land_id).first()
    if land_row:
        land_row.is_for_sale = True
        land_row.asking_price = announcement.expected_price
        land_row.posted_date = posted_date
    # Save property details
    db.flush()
    existing_detail = db.query(SellerPropertyDetail).filter(SellerPropertyDetail.listing_id == listing.id).first()
    if not existing_detail:
        db.add(SellerPropertyDetail(
            listing_id=listing.id,
            house_on_land=announcement.house_on_land, house_details=announcement.house_details,
            well_borewell=announcement.well_borewell, water_facility=announcement.water_facility,
            electricity_available=announcement.electricity_available, road_access=announcement.road_access,
            road_details=announcement.road_details, compound_wall=announcement.compound_wall,
            existing_building=announcement.existing_building,
            existing_building_details=announcement.existing_building_details,
            current_land_use=announcement.current_land_use,
            nearby_facilities=announcement.nearby_facilities, additional_details=announcement.additional_details
        ))
    db.commit()
    new_ann = announcement.dict()
    new_ann["posted_date"] = posted_date
    return {"status": "success", "data": new_ann}

@app.get("/api/lands/{land_id:path}/history")
@app.get("/lands/{land_id:path}/history")
def get_history(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    if DB_AVAILABLE:
        try:
            rows = db.query(LandHistory).filter(LandHistory.land_id == canonical_id).order_by(LandHistory.year).all()
            if rows:
                return [{"year": r.year, "owner": r.owner, "status": r.status,
                         "transactions": r.transactions, "risk_score": r.risk_score,
                         "boundary_status": r.boundary_status} for r in rows]
        except Exception:
            pass
    return HISTORY_DATA.get(canonical_id, HISTORY_DATA["default"])

@app.get("/api/lands/{land_id:path}/owners")
@app.get("/lands/{land_id:path}/owners")
def get_owners(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    if DB_AVAILABLE:
        try:
            rows = db.query(Owner).filter(Owner.land_id == canonical_id).all()
            if rows:
                return [{"name": r.name, "period": r.period, "type": r.owner_type} for r in rows]
        except Exception:
            pass
    return OWNERS_DATA.get(canonical_id, OWNERS_DATA["default"])

@app.get("/api/lands/{land_id:path}/documents")
@app.get("/lands/{land_id:path}/documents")
def get_documents(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    if DB_AVAILABLE:
        try:
            db_docs = db.query(LandDocument).filter(LandDocument.land_id == canonical_id).all()
            docs = [{"doc_no": d.doc_no, "type": d.type, "date": d.date,
                     "verification": d.verification, "result": d.result} for d in db_docs]
            if not docs:
                docs = DOCUMENTS_DATA.get(canonical_id, DOCUMENTS_DATA["default"]).copy()
            seller_db_docs = db.query(SellerDocumentUpload).filter(SellerDocumentUpload.land_id == canonical_id).all()
            for doc in seller_db_docs:
                docs.append({
                    "is_uploaded": True, "id": doc.id,
                    "doc_no": doc.document_number or doc.id[:8],
                    "document_name": doc.document_name, "type": doc.document_type,
                    "date": doc.issue_date or (doc.uploaded_at[:10] if doc.uploaded_at else ""),
                    "verification": doc.verification_status,
                    "result": "Pending Verification" if doc.verification_status == "Pending" else doc.verification_status,
                    "file_path": doc.file_path, "notes": doc.notes
                })
            return docs
        except Exception:
            pass
    return DOCUMENTS_DATA.get(canonical_id, DOCUMENTS_DATA["default"]).copy()

@app.post("/api/lands/{land_id:path}/documents")
def upload_land_document(
    land_id: str,
    document_type: str = Form(...),
    document_name: str = Form(...),
    document_number: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    doc_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    filename = f"{doc_id}{ext}"
    file_path = UPLOADS_DIR / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    uploaded_at = datetime.now().isoformat()
    if DB_AVAILABLE:
        try:
            db_doc = SellerDocumentUpload(
                id=doc_id, land_id=canonical_id, document_type=document_type,
                document_name=document_name, document_number=document_number or "",
                issue_date=issue_date or "", file_path=f"/uploads/{filename}",
                uploaded_at=uploaded_at, verification_status="Pending", notes=notes or ""
            )
            db.add(db_doc)
            db.commit()
        except Exception:
            pass
    doc_record = {
        "id": doc_id, "land_id": canonical_id, "document_type": document_type,
        "document_name": document_name, "document_number": document_number or "",
        "issue_date": issue_date or "", "file_path": f"/uploads/{filename}",
        "uploaded_at": uploaded_at, "verification_status": "Pending", "notes": notes or ""
    }
    return {"status": "success", "data": doc_record}

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    if not DB_AVAILABLE:
        return {"status": "success"}
    doc = db.query(SellerDocumentUpload).filter(SellerDocumentUpload.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        filename = os.path.basename(doc.file_path)
        target_path = UPLOADS_DIR / filename
        if target_path.exists():
            target_path.unlink()
    except Exception:
        pass
    db.delete(doc)
    db.commit()
    return {"status": "success"}

@app.put("/api/documents/{document_id}")
def update_document(
    document_id: str,
    document_type: Optional[str] = Form(None),
    document_name: Optional[str] = Form(None),
    document_number: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    if not DB_AVAILABLE:
        return {"status": "success", "data": {}}
    doc = db.query(SellerDocumentUpload).filter(SellerDocumentUpload.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if document_type: doc.document_type = document_type
    if document_name: doc.document_name = document_name
    if document_number is not None: doc.document_number = document_number
    if issue_date is not None: doc.issue_date = issue_date
    if notes is not None: doc.notes = notes
    if file:
        if not file.filename.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
            raise HTTPException(status_code=400, detail="Invalid file type")
        try:
            old_filename = os.path.basename(doc.file_path)
            old_target = UPLOADS_DIR / old_filename
            if old_target.exists():
                old_target.unlink()
        except Exception:
            pass
        ext = os.path.splitext(file.filename)[1]
        filename = f"{document_id}{ext}"
        new_path = UPLOADS_DIR / filename
        with open(new_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        doc.file_path = f"/uploads/{filename}"
        doc.verification_status = "Pending"
    db.commit()
    result = {
        "id": doc.id, "land_id": doc.land_id, "document_type": doc.document_type,
        "document_name": doc.document_name, "document_number": doc.document_number,
        "issue_date": doc.issue_date, "file_path": doc.file_path,
        "uploaded_at": doc.uploaded_at, "verification_status": doc.verification_status, "notes": doc.notes
    }
    return {"status": "success", "data": result}

@app.post("/api/documents/{document_id}/verify")
def verify_document(document_id: str, db: Session = Depends(get_db)):
    if not DB_AVAILABLE:
        return {"status": "success", "data": {}}
    doc = db.query(SellerDocumentUpload).filter(SellerDocumentUpload.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.verification_status = "Verified"
    db.commit()
    result = {
        "id": doc.id, "land_id": doc.land_id, "document_type": doc.document_type,
        "document_name": doc.document_name, "document_number": doc.document_number,
        "issue_date": doc.issue_date, "file_path": doc.file_path,
        "uploaded_at": doc.uploaded_at, "verification_status": doc.verification_status, "notes": doc.notes
    }
    return {"status": "success", "data": result}

@app.get("/api/lands/{land_id:path}/document-verification")
def get_document_verification(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    if DB_AVAILABLE:
        try:
            rec = db.query(VerificationRecord).filter(VerificationRecord.land_id == canonical_id).first()
            if rec:
                return {"overall_result": rec.overall_result, "score": rec.score,
                        "fields": rec.fields, "explanation": rec.explanation}
        except Exception:
            pass
    return DOC_VERIFICATION_DATA.get(canonical_id, DOC_VERIFICATION_DATA["default"])

@app.get("/api/lands/{land_id:path}/cases")
@app.get("/lands/{land_id:path}/cases")
def get_cases(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    if DB_AVAILABLE:
        try:
            rows = db.query(LegalCase).filter(LegalCase.land_id == canonical_id).all()
            if rows:
                return [{"case_no": r.case_no, "type": r.case_type, "court": r.court,
                         "filing_date": r.filing_date, "status": r.status} for r in rows]
        except Exception:
            pass
    return CASES_DATA.get(canonical_id, CASES_DATA["default"])

@app.get("/api/lands/{land_id:path}/mortgages")
@app.get("/lands/{land_id:path}/mortgages")
def get_mortgages(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    if DB_AVAILABLE:
        try:
            rows = db.query(Mortgage).filter(Mortgage.land_id == canonical_id).all()
            if rows:
                return [{"bank": r.bank, "start_date": r.start_date,
                         "release_date": r.release_date, "status": r.status} for r in rows]
        except Exception:
            pass
    return MORTGAGES_DATA.get(canonical_id, MORTGAGES_DATA["default"])

@app.get("/api/lands/{land_id:path}/risk")
@app.get("/lands/{land_id:path}/risk")
def get_risk(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    return RISK_DATA.get(canonical_id, RISK_DATA["default"])

@app.get("/api/lands/{land_id:path}/dna")
@app.get("/lands/{land_id:path}/dna")
def get_dna(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    return DNA_DATA.get(canonical_id, DNA_DATA["default"])

class WhatIfQuery(BaseModel):
    scenario: str

@app.post("/api/lands/{land_id:path}/what-if")
def what_if_simulator(land_id: str, query: WhatIfQuery, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    risk = RISK_DATA.get(canonical_id, RISK_DATA["default"])
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
        "land_id": canonical_id,
        "current_score": current_score,
        "simulated_score": simulated_score,
        "risk_level": risk_level,
        "change": change,
        "reason": scenario_data["reason"]
    }

@app.get("/api/lands/{land_id:path}/verification-report")
def get_verification_report(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    land = None
    if DB_AVAILABLE:
        try:
            db_l = db.query(Land).filter(Land.id == canonical_id).first()
            if db_l:
                land = _land_to_dict(db_l)
        except Exception:
            pass
    if not land:
        land = next((l for l in DEMO_LAND_DATA if l["id"] == canonical_id), None)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
        
    owners = OWNERS_DATA.get(canonical_id, OWNERS_DATA["default"])
    docs = DOCUMENTS_DATA.get(canonical_id, DOCUMENTS_DATA["default"]).copy()
    doc_verif = DOC_VERIFICATION_DATA.get(canonical_id, DOC_VERIFICATION_DATA["default"])
    cases = CASES_DATA.get(canonical_id, CASES_DATA["default"])
    mortgages = MORTGAGES_DATA.get(canonical_id, MORTGAGES_DATA["default"])
    boundary = BOUNDARY_DETECTION_DATA.get(canonical_id, BOUNDARY_DETECTION_DATA["default"])
    frag = FRAGMENTATION_ANALYSIS_DATA.get(canonical_id, FRAGMENTATION_ANALYSIS_DATA["default"])
    dna = DNA_DATA.get(canonical_id, DNA_DATA["default"])
    risk = RISK_DATA.get(canonical_id, RISK_DATA["default"])
    history = HISTORY_DATA.get(canonical_id, HISTORY_DATA["default"])
    
    # Merge static docs with seller-uploaded docs from DB (ORM attribute access)
    if DB_AVAILABLE:
        try:
            seller_docs = db.query(SellerDocumentUpload).filter(SellerDocumentUpload.land_id == canonical_id).all()
            for doc in seller_docs:
                docs.append({
                    "is_uploaded": True,
                    "id": doc.id,
                    "doc_no": doc.document_number or doc.id[:8],
                    "document_name": doc.document_name,
                    "type": doc.document_type,
                    "date": doc.issue_date or (doc.uploaded_at[:10] if doc.uploaded_at else ""),
                    "verification": doc.verification_status,
                    "result": "Pending Verification" if doc.verification_status == "Pending" else doc.verification_status,
                    "file_path": doc.file_path,
                    "notes": doc.notes
                })
        except Exception:
            pass

    # Generate simple summary
    summary = f"Based on synthetic records, {canonical_id} is a {land['area_sq_ft']} sq ft {land['land_type']} property owned by {land['owner']}. "
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

@app.get("/api/lands/{land_id:path}/risk-timeline")
def get_risk_timeline(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    history = HISTORY_DATA.get(canonical_id, HISTORY_DATA["default"])
    timeline = []
    if not history:
        return {"timeline": [], "trend": "Stable"}
        
    last_risk = history[-1]["risk_score"]
    second_last = history[-2]["risk_score"] if len(history) > 1 else last_risk
    future_diff = last_risk - second_last
    future_risk = max(0, min(100, last_risk + future_diff))
    
    for h in history:
        timeline.append({"year": h["year"], "risk_score": h["risk_score"]})
        
    timeline.append({"year": "Future", "risk_score": future_risk, "is_prediction": True})
    
    trend = "Stable"
    if future_diff > 0: trend = "Increasing"
    elif future_diff < 0: trend = "Decreasing"
    
    return {"timeline": timeline, "trend": trend}

@app.get("/api/lands/{land_id:path}/alerts")
@app.get("/lands/{land_id:path}/alerts")
def get_alerts(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    if DB_AVAILABLE:
        try:
            db_alerts = db.query(Alert).filter(Alert.land_id == canonical_id).all()
            if db_alerts:
                return [{"type": a.type, "date": a.date, "severity": "High" if a.type in ["Legal Case", "Boundary Change"] else "Medium", "text": a.message} for a in db_alerts]
        except Exception:
            pass
    alerts = []
    risk = RISK_DATA.get(canonical_id, RISK_DATA["default"])
    boundary = BOUNDARY_DETECTION_DATA.get(canonical_id, BOUNDARY_DETECTION_DATA["default"])
    cases = CASES_DATA.get(canonical_id, CASES_DATA["default"])
    doc_verif = DOC_VERIFICATION_DATA.get(canonical_id, DOC_VERIFICATION_DATA["default"])
    
    if boundary.get("change_status") == "Significant Change Detected":
        alerts.append({"type": "Boundary Change", "date": datetime.now().strftime("%Y-%m-%d"), "severity": "High", "text": "Boundary mismatch detected."})
    
    if risk.get("level") == "HIGH":
        alerts.append({"type": "Risk Level", "date": datetime.now().strftime("%Y-%m-%d"), "severity": "High", "text": "Overall risk level is High."})
        
    on_going_cases = [c for c in cases if c.get("status", "") == "Ongoing"]
    if on_going_cases:
        alerts.append({"type": "Legal Case", "date": datetime.now().strftime("%Y-%m-%d"), "severity": "High", "text": f"Found {len(on_going_cases)} active legal case(s)."})
        
    if doc_verif.get("overall_result") == "CONFLICT DETECTED":
        alerts.append({"type": "Document Verification", "date": datetime.now().strftime("%Y-%m-%d"), "severity": "Medium", "text": "Document details do not match registry."})
        
    if not alerts:
        alerts.append({"type": "General", "date": datetime.now().strftime("%Y-%m-%d"), "severity": "Low", "text": "No significant alerts at this time."})
        
    return alerts

@app.post("/api/lands/{land_id:path}/document-scan")
def document_scan(land_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    doc_verif = DOC_VERIFICATION_DATA.get(canonical_id, DOC_VERIFICATION_DATA["default"]).copy()
    consistency_score = doc_verif.get("score", 75)
    status = "REVIEW" if consistency_score < 70 else "CONSISTENT"
        
    return {
        "status": "success",
        "message": "Automated consistency screening – not legal authentication. (DEMO)",
        "fields": doc_verif.get("fields", []),
        "consistency_score": consistency_score,
        "consistency_status": status,
        "explanation": doc_verif.get("explanation", "")
    }

@app.get("/api/lands/{land_id:path}/environmental-risk")
def environmental_risk(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    risk_level = "LOW"
    score = 20
    if canonical_id in ["LND-1002", "LND-1004"]:
        risk_level = "HIGH"
        score = 80
    elif canonical_id in ["LND-1006", "LND-1007"]:
        risk_level = "MEDIUM"
        score = 50
        
    return {
        "risk_level": risk_level,
        "score": score,
        "factors": [
            {"factor": "Flood Risk", "impact": "High" if risk_level == "HIGH" else "Low"},
            {"factor": "Water Availability", "impact": "Medium"},
            {"factor": "Soil/Environmental concern", "impact": "Low"},
            {"factor": "Nearby Water Body", "impact": "High" if canonical_id == "LND-1006" else "Low"}
        ],
        "disclaimer": "This is synthetic/demo environmental data."
    }

@app.get("/api/lands/{land_id:path}/nearby-facilities")
def nearby_facilities(land_id: str):
    return [
        {"type": "School", "name": "Demo Public School", "distance_km": 1.5},
        {"type": "Hospital", "name": "City Care Hospital", "distance_km": 3.0},
        {"type": "Bank", "name": "State Bank", "distance_km": 0.8},
        {"type": "Bus Stop", "name": "Main Road Stop", "distance_km": 0.3},
        {"type": "Railway Station", "name": "Central Station", "distance_km": 5.0}
    ]

class ValueEstimateParams(BaseModel):
    area: float
    land_type: str
    road_access: str
    water_facility: str
    electricity: str

@app.post("/api/lands/{land_id:path}/value-estimate")
def value_estimate(land_id: str, params: ValueEstimateParams):
    base_rate = 1000
    if params.land_type == "Commercial":
        base_rate = 3000
    elif params.land_type == "Agricultural":
        base_rate = 500
        
    value = params.area * base_rate
    if params.road_access == "Yes": value *= 1.2
    if params.water_facility == "Yes": value *= 1.1
    if params.electricity == "Yes": value *= 1.1
    
    return {
        "estimated_value": value,
        "factors": [
            "Area",
            "Land Type",
            "Road Access",
            "Electricity",
            "Water Facility"
        ],
        "disclaimer": "This is a demo estimate for academic purposes and is not a professional property valuation."
    }

@app.get("/api/lands/{land_id:path}/qr-profile")
def qr_profile(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    return {
        "qr_data": f"https://demo.landtrace360.com/profile/{canonical_id}",
        "land_id": canonical_id
    }

def _fetch_land_context(canonical_id: str, db: Optional[Session] = None):
    canonical_id = _resolve_land_id(canonical_id, db if DB_AVAILABLE else None)
    land = None
    if DB_AVAILABLE and db:
        try:
            db_land = db.query(Land).filter(
                (Land.id == canonical_id) | (Land.survey_number == canonical_id)
            ).first()
            if db_land:
                land = _land_to_dict(db_land)
        except Exception:
            pass
    if not land:
        for item in DEMO_LAND_DATA:
            if item["id"] == canonical_id or item["survey_number"].lower() == canonical_id.lower():
                land = item.copy()
                break
    if not land:
        land = DEMO_LAND_DATA[0].copy()
        canonical_id = land["id"]

    risk = RISK_DATA.get(canonical_id, RISK_DATA.get("default", {}))
    dna = DNA_DATA.get(canonical_id, DNA_DATA.get("default", {}))

    docs = []
    if DB_AVAILABLE and db:
        try:
            db_docs = db.query(LandDocument).filter(LandDocument.land_id == canonical_id).all()
            docs = [{"doc_no": d.doc_no, "type": d.type, "date": d.date,
                     "verification": d.verification, "result": d.result} for d in db_docs]
        except Exception:
            pass
    if not docs:
        docs = DOCUMENTS_DATA.get(canonical_id, DOCUMENTS_DATA.get("default", [])).copy()

    cases = []
    if DB_AVAILABLE and db:
        try:
            db_cases = db.query(LegalCase).filter(LegalCase.land_id == canonical_id).all()
            cases = [{"case_number": c.case_number, "court": c.court, "parties": c.parties,
                      "status": c.status, "year": c.year} for c in db_cases]
        except Exception:
            pass
    if not cases:
        cases = CASES_DATA.get(canonical_id, CASES_DATA.get("default", [])).copy()

    mortgages = []
    if DB_AVAILABLE and db:
        try:
            db_m = db.query(Mortgage).filter(Mortgage.land_id == canonical_id).all()
            mortgages = [{"bank": m.bank, "start_date": m.start_date,
                          "release_date": m.release_date, "status": m.status} for m in db_m]
        except Exception:
            pass
    if not mortgages:
        mortgages = MORTGAGES_DATA.get(canonical_id, MORTGAGES_DATA.get("default", [])).copy()

    owners = []
    if DB_AVAILABLE and db:
        try:
            db_o = db.query(Owner).filter(Owner.land_id == canonical_id).all()
            owners = [{"name": o.name, "period": o.period, "type": o.owner_type} for o in db_o]
        except Exception:
            pass
    if not owners:
        owners = OWNERS_DATA.get(canonical_id, OWNERS_DATA.get("default", [])).copy()

    history = []
    if DB_AVAILABLE and db:
        try:
            db_h = db.query(LandHistory).filter(LandHistory.land_id == canonical_id).order_by(LandHistory.year).all()
            history = [{"year": h.year, "owner": h.owner, "status": h.status,
                        "transactions": h.transactions, "risk_score": h.risk_score,
                        "boundary_status": h.boundary_status} for h in db_h]
        except Exception:
            pass
    if not history:
        history = HISTORY_DATA.get(canonical_id, HISTORY_DATA.get("default", [])).copy()

    boundary = BOUNDARY_DETECTION_DATA.get(canonical_id, BOUNDARY_DETECTION_DATA.get("default", {}))
    frag = FRAGMENTATION_ANALYSIS_DATA.get(canonical_id, FRAGMENTATION_ANALYSIS_DATA.get("default", {}))

    return canonical_id, land, risk, dna, docs, cases, mortgages, owners, history, boundary, frag


def _build_land_passport(canonical_id: str, db: Optional[Session] = None):
    canonical_id, land, risk, dna, docs, cases, mortgages, owners, history, boundary, frag = _fetch_land_context(canonical_id, db)

    active_cases = [c for c in cases if str(c.get("status", "")).lower() in ["active", "ongoing", "pending", "contested"]]
    if active_cases:
        case_nums = ", ".join([c.get("case_no") or c.get("case_number", "Case") for c in active_cases])
        legal_status = f"{len(active_cases)} Active Case(s): {case_nums}"
    elif cases:
        legal_status = "Resolved / Closed (Clear)"
    else:
        legal_status = "Clear / No Litigation Recorded"

    active_mortgages = [m for m in mortgages if str(m.get("status", "")).lower() == "active"]
    if active_mortgages:
        banks = ", ".join([m.get("bank", "Bank") for m in active_mortgages])
        mortgage_status = f"Active Mortgage ({banks})"
    elif mortgages:
        mortgage_status = "Mortgage Released / Clear"
    else:
        mortgage_status = "No Mortgage Recorded"

    verified_docs = [d for d in docs if str(d.get("verification", "")).lower() == "verified"]
    if docs:
        doc_status = f"{len(verified_docs)}/{len(docs)} Documents Verified"
    else:
        doc_status = "No Documents Registered"

    risk_score = risk.get("overall_score") or land.get("risk_score") or 15
    dna_score = dna.get("overall_health") or land.get("health_score") or 85
    risk_level = risk.get("level") or ("LOW" if risk_score < 30 else "HIGH" if risk_score > 60 else "MEDIUM")

    area_sqft = land.get("area_sq_ft") or land.get("area") or 0
    area_acres = round(area_sqft / 43560, 2) if area_sqft else 0.0

    return {
        "land_id": canonical_id,
        "survey_number": land.get("survey_number", "N/A"),
        "subdivision": land.get("subdivision_number", "None"),
        "location": land.get("location", "N/A"),
        "village": land.get("village", "N/A"),
        "taluk": land.get("taluk", "N/A"),
        "district": land.get("district", "N/A"),
        "current_owner": land.get("owner", land.get("owner_name", "N/A")),
        "land_type": land.get("land_type", "Standard"),
        "area_sqft": area_sqft,
        "area_acres": area_acres,
        "verification_status": land.get("status", "Verified"),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "land_dna_score": dna_score,
        "legal_status": legal_status,
        "mortgage_status": mortgage_status,
        "document_status": doc_status,
        "last_updated": land.get("posted_date") or "2026-08-01",
        "passport_generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "qr_code_url": f"https://demo.landtrace360.com/profile/{canonical_id}",
        "disclaimer": "Demo / Synthetic Project Data — Not an Official Government Land Record"
    }


def _build_land_story(canonical_id: str, db: Optional[Session] = None, lang: str = "en"):
    canonical_id, land, risk, dna, docs, cases, mortgages, owners, history, boundary, frag = _fetch_land_context(canonical_id, db)
    lang = (lang or "en").lower()
    if lang not in ["en", "ta", "hi"]:
        lang = "en"

    chapters = []

    # 1. LAND ORIGIN
    orig_area = frag.get("original_area") or land.get("area_sq_ft") or 0
    first_hist = history[0] if history else None
    first_year = first_hist.get("year", 2005) if first_hist else 2005
    first_owner = first_hist.get("owner", land.get("owner", "Initial Owner")) if first_hist else land.get("owner", "Initial Owner")

    if orig_area:
        if lang == "ta":
            origin_summary = f"இந்த நிலம் முதன்முதலில் {first_year} ஆம் ஆண்டில் {first_owner} இன் கீழ் {orig_area:,} சதுர அடி பரப்பளவாக பதிவு செய்யப்பட்டது."
        elif lang == "hi":
            origin_summary = f"यह भूमि मूल रूप से {first_year} में {first_owner} के तहत {orig_area:,} वर्ग फुट पार्सल के रूप में दर्ज की गई थी।"
        else:
            origin_summary = f"This land was originally recorded in {first_year} under {first_owner} as a {orig_area:,} sq.ft parcel."
        origin_ev = {"year": first_year, "initial_owner": first_owner, "original_area_sqft": orig_area, "source": "Land History & Registry Record"}
    else:
        origin_summary = "பதிவுகள் எதுவும் கிடைக்கவில்லை." if lang == "ta" else ("कोई रिकॉर्ड उपलब्ध नहीं है।" if lang == "hi" else "No record available.")
        origin_ev = {"status": "No historical origin record available"}

    chapters.append({
        "step": 1,
        "key": "origin",
        "stage": "LAND ORIGIN",
        "stage_localized": "நில தோற்றம்" if lang == "ta" else ("भूमि उत्पत्ति" if lang == "hi" else "LAND ORIGIN"),
        "summary": origin_summary,
        "evidence": origin_ev
    })

    # 2. OWNERSHIP CHANGES
    if history and len(history) > 1:
        chain = " → ".join([h.get("owner", "Unknown") for h in history])
        trans_count = sum(h.get("transactions", 0) for h in history)
        if lang == "ta":
            owner_summary = f"காலப்போக்கில் நில உரிமை மாற்றம் அடைந்தது: {chain}. மொத்த பரிவர்த்தனைகள்: {trans_count}."
        elif lang == "hi":
            owner_summary = f"समय के साथ भूमि का स्वामित्व बदला: {chain}। कुल दर्ज लेनदेन: {trans_count}।"
        else:
            owner_summary = f"Ownership transitioned over time through recorded conveyances: {chain}. Total recorded transactions: {trans_count}."
        owner_ev = {"ownership_chain": [h.get("owner") for h in history], "milestones": history}
    elif owners:
        chain = " → ".join([o.get("name", "Unknown") for o in owners])
        if lang == "ta":
            owner_summary = f"பதிவு செய்யப்பட்ட உரிமை தொடர்ச்சி: {chain}."
        elif lang == "hi":
            owner_summary = f"दर्ज स्वामित्व श्रृंखला: {chain}।"
        else:
            owner_summary = f"Recorded ownership continuity: {chain}."
        owner_ev = {"owners": owners}
    else:
        owner_summary = "பதிவுகள் எதுவும் கிடைக்கவில்லை." if lang == "ta" else ("कोई रिकॉर्ड उपलब्ध नहीं है।" if lang == "hi" else "No record available.")
        owner_ev = {"status": "No ownership transition record found"}

    chapters.append({
        "step": 2,
        "key": "ownership",
        "stage": "OWNERSHIP CHANGES",
        "stage_localized": "உரிமை மாற்றங்கள்" if lang == "ta" else ("स्वामित्व परिवर्तन" if lang == "hi" else "OWNERSHIP CHANGES"),
        "summary": owner_summary,
        "evidence": owner_ev
    })

    # 3. SUBDIVISION / AREA CHANGES
    subs = frag.get("subdivisions", 0)
    cur_area = land.get("area_sq_ft", 0)
    pct_lost = frag.get("percentage_lost", 0)
    if frag and subs > 0:
        if lang == "ta":
            sub_summary = f"இந்த நிலம் {subs} உட்பிரிவு(கள்) பெற்றுள்ளது. பரப்பளவு {orig_area:,} சதுர அடியிலிருந்து {cur_area:,} சதுர அடியாக மாற்றப்பட்டது ({pct_lost}% பரப்பளவு மாற்றம்)."
        elif lang == "hi":
            sub_summary = f"यह भूमि {subs} उप-विभाजन(नों) से गुजरी है। क्षेत्रफल {orig_area:,} वर्ग फुट से बदलकर {cur_area:,} वर्ग फुट हो गया ({pct_lost}% क्षेत्रफल परिवर्तन)।"
        else:
            sub_summary = f"The parcel underwent {subs} recorded subdivision(s), adjusting the footprint from {orig_area:,} sq.ft to {cur_area:,} sq.ft ({pct_lost}% area shift)."
        sub_ev = frag
    elif cur_area:
        if lang == "ta":
            sub_summary = f"நிலத்தின் தற்போதைய பரப்பளவு {cur_area:,} சதுர அடி. குறிப்பிடத்தக்க உட்பிரிவு மாற்றங்கள் எதுவும் இல்லை."
        elif lang == "hi":
            sub_summary = f"भूमि का वर्तमान क्षेत्रफल {cur_area:,} वर्ग फुट है। कोई महत्वपूर्ण उप-विभाजन नहीं पाया गया।"
        else:
            sub_summary = f"The parcel currently holds {cur_area:,} sq.ft with no major subdivision recorded."
        sub_ev = {"current_area": cur_area, "subdivisions": 0}
    else:
        sub_summary = "பதிவுகள் எதுவும் கிடைக்கவில்லை." if lang == "ta" else ("कोई रिकॉर्ड उपलब्ध नहीं है।" if lang == "hi" else "No record available.")
        sub_ev = {"status": "No subdivision records found"}

    chapters.append({
        "step": 3,
        "key": "subdivision",
        "stage": "SUBDIVISION / AREA CHANGES",
        "stage_localized": "உட்பிரிவு / பரப்பளவு மாற்றங்கள்" if lang == "ta" else ("उप-विभाजन / क्षेत्रफल परिवर्तन" if lang == "hi" else "SUBDIVISION / AREA CHANGES"),
        "summary": sub_summary,
        "evidence": sub_ev
    })

    # 4. DOCUMENT EVENTS
    if docs:
        types = [d.get("type", "Document") for d in docs]
        types_str = ", ".join(types)
        ver_count = sum(1 for d in docs if str(d.get("verification", "")).lower() == "verified")
        if lang == "ta":
            doc_summary = f"திட்ட அமைப்பில் {len(docs)} சட்ட ஆவணங்கள் பதிவு செய்யப்பட்டுள்ளன ({types_str}). {ver_count} ஆவணங்கள் வெற்றிகரமாக சரிபார்க்கப்பட்டுள்ளன."
        elif lang == "hi":
            doc_summary = f"सिस्टम में {len(docs)} कानूनी दस्तावेज पंजीकृत हैं ({types_str})। {ver_count} दस्तावेज सफलतापूर्वक सत्यापित किए गए हैं।"
        else:
            doc_summary = f"{len(docs)} legal document(s) registered in the system ({types_str}). {ver_count} document(s) verified against stored records."
        doc_ev = docs
    else:
        doc_summary = "பதிவுகள் எதுவும் கிடைக்கவில்லை." if lang == "ta" else ("कोई रिकॉर्ड उपलब्ध नहीं है।" if lang == "hi" else "No record available.")
        doc_ev = {"status": "No document records stored"}

    chapters.append({
        "step": 4,
        "key": "documents",
        "stage": "DOCUMENT EVENTS",
        "stage_localized": "ஆவண நிகழ்வுகள்" if lang == "ta" else ("दस्तावेज़ घटनाएँ" if lang == "hi" else "DOCUMENT EVENTS"),
        "summary": doc_summary,
        "evidence": doc_ev
    })

    # 5. LEGAL EVENTS
    if cases:
        case_summaries = []
        for c in cases:
            num = c.get("case_no") or c.get("case_number", "Case")
            court = c.get("court", "Court")
            st = c.get("status", "Active")
            case_summaries.append(f"{num} ({court} - {st})")
        cases_str = "; ".join(case_summaries)
        if lang == "ta":
            legal_summary = f"பதிவு செய்யப்பட்ட வழக்கு நிகழ்வுகள்: {cases_str}."
        elif lang == "hi":
            legal_summary = f"दर्ज कानूनी मामले की घटनाएँ: {cases_str}।"
        else:
            legal_summary = f"Legal tribunal filings recorded: {cases_str}."
        legal_ev = cases
    else:
        if lang == "ta":
            legal_summary = "பதிவுகள் எதுவும் கிடைக்கவில்லை (எந்தவொரு நிலுவை அல்லது பழைய வழக்கும் பதிவு செய்யப்படவில்லை)."
        elif lang == "hi":
            legal_summary = "कोई रिकॉर्ड उपलब्ध नहीं है (कोई सक्रिय या पुराना कानूनी विवाद दर्ज नहीं है)।"
        else:
            legal_summary = "No litigation record available (Clear title with zero active or past disputes)."
        legal_ev = {"active_cases": 0, "status": "Clear Title"}

    chapters.append({
        "step": 5,
        "key": "legal",
        "stage": "LEGAL EVENTS",
        "stage_localized": "சட்ட வழக்கு நிகழ்வுகள்" if lang == "ta" else ("कानूनी घटनाएँ" if lang == "hi" else "LEGAL EVENTS"),
        "summary": legal_summary,
        "evidence": legal_ev
    })

    # 6. MORTGAGE EVENTS
    if mortgages:
        m_summaries = []
        for m in mortgages:
            b = m.get("bank", "Bank")
            st = m.get("status", "Status")
            s_date = m.get("start_date", "")
            r_date = m.get("release_date", "")
            m_summaries.append(f"{b} [{st}: {s_date} to {r_date}]")
        m_str = "; ".join(m_summaries)
        if lang == "ta":
            mort_summary = f"அடமான நிகழ்வுகள் பதிவு செய்யப்பட்டுள்ளன: {m_str}."
        elif lang == "hi":
            mort_summary = f"बंधक घटनाएँ दर्ज की गईं: {m_str}।"
        else:
            mort_summary = f"Financial encumbrances recorded: {m_str}."
        mort_ev = mortgages
    else:
        if lang == "ta":
            mort_summary = "பதிவுகள் எதுவும் கிடைக்கவில்லை (வங்கி அடமானக் கடன்கள் எதுவும் பதிவு செய்யப்படவில்லை)."
        elif lang == "hi":
            mort_summary = "कोई रिकॉर्ड उपलब्ध नहीं है (कोई बैंक बंधक दर्ज नहीं है)।"
        else:
            mort_summary = "No mortgage record available (No bank liens or encumbrances registered)."
        mort_ev = {"mortgages_count": 0, "status": "Unencumbered"}

    chapters.append({
        "step": 6,
        "key": "mortgages",
        "stage": "MORTGAGE EVENTS",
        "stage_localized": "அடமான நிகழ்வுகள்" if lang == "ta" else ("बंधक घटनाएँ" if lang == "hi" else "MORTGAGE EVENTS"),
        "summary": mort_summary,
        "evidence": mort_ev
    })

    # 7. BOUNDARY EVENTS
    if boundary:
        b_prev = boundary.get("previous_status", "Unmarked")
        b_cur = boundary.get("current_status", "Surveyed")
        b_dev = boundary.get("deviation_percentage", 0.0)
        b_stat = boundary.get("change_status", "Verified")
        if lang == "ta":
            bound_summary = f"எல்லை அளவீட்டு நிலை: '{b_prev}' இலிருந்து '{b_cur}' ஆக மாறியது ({b_stat}, விலகல்: {b_dev}%)."
        elif lang == "hi":
            bound_summary = f"सीमा सर्वेक्षण स्थिति: '{b_prev}' से बदलकर '{b_cur}' हुई ({b_stat}, विचलन: {b_dev}%)।"
        else:
            bound_summary = f"Boundary demarcation shifted from '{b_prev}' to '{b_cur}' with {b_dev}% deviation ({b_stat})."
        bound_ev = boundary
    else:
        bound_summary = "பதிவுகள் எதுவும் கிடைக்கவில்லை." if lang == "ta" else ("कोई रिकॉर्ड उपलब्ध नहीं है।" if lang == "hi" else "No record available.")
        bound_ev = {"status": "No boundary telemetry stored"}

    chapters.append({
        "step": 7,
        "key": "boundary",
        "stage": "BOUNDARY EVENTS",
        "stage_localized": "எல்லை நிகழ்வுகள்" if lang == "ta" else ("सीमा घटनाएँ" if lang == "hi" else "BOUNDARY EVENTS"),
        "summary": bound_summary,
        "evidence": bound_ev
    })

    # 8. CURRENT STATUS
    c_owner = land.get("owner", land.get("owner_name", "Current Owner"))
    c_area = land.get("area_sq_ft", 0)
    c_risk = risk.get("overall_score") or land.get("risk_score") or 15
    c_dna = dna.get("overall_health") or land.get("health_score") or 85
    c_status = land.get("status", "Verified")
    if lang == "ta":
        status_summary = f"தற்போதைய உரிமையாளர் {c_owner}, பரப்பளவு {c_area:,} சதுர அடி. சரிபார்ப்பு நிலை: {c_status}, இடர் மதிப்பீடு: {c_risk}/100, நில DNA மதிப்பீடு: {c_dna}/100."
    elif lang == "hi":
        status_summary = f"वर्तमान स्वामी {c_owner}, क्षेत्रफल {c_area:,} वर्ग फुट। सत्यापन स्थिति: {c_status}, जोखिम स्कोर: {c_risk}/100, लैंड डीएनए स्कोर: {c_dna}/100।"
    else:
        status_summary = f"Current parcel is held by {c_owner} spanning {c_area:,} sq.ft. Status: {c_status}, Risk Score: {c_risk}/100, Land DNA Score: {c_dna}/100."
    status_ev = {
        "owner": c_owner,
        "area_sq_ft": c_area,
        "risk_score": c_risk,
        "dna_score": c_dna,
        "status": c_status
    }

    chapters.append({
        "step": 8,
        "key": "current_status",
        "stage": "CURRENT STATUS",
        "stage_localized": "தற்போதைய நிலை" if lang == "ta" else ("वर्तमान स्थिति" if lang == "hi" else "CURRENT STATUS"),
        "summary": status_summary,
        "evidence": status_ev
    })

    full_narrative = "\n\n".join([f"{c['stage_localized']}: {c['summary']}" for c in chapters])

    return {
        "land_id": canonical_id,
        "language": lang,
        "title": "AI Land Chronological Story" if lang == "en" else ("AI நில காலவரிசைக் கதை" if lang == "ta" else "एआई भूमि कालानुक्रमिक कहानी"),
        "disclaimer": "AI-generated summary based on available project records. Demo / Synthetic Project Data — Not an Official Government Land Record.",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "full_narrative": full_narrative,
        "chapters": chapters
    }

@app.get("/api/lands/{land_id:path}/passport")
@app.get("/lands/{land_id:path}/passport")
def get_land_passport(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    return _build_land_passport(canonical_id, db)

@app.get("/api/lands/{land_id:path}/story")
@app.get("/lands/{land_id:path}/story")
def get_land_story(land_id: str, lang: Optional[str] = "en", db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    return _build_land_story(canonical_id, db, lang=lang)

@app.get("/api/lands/{land_id:path}/anomalies")
@app.get("/lands/{land_id:path}/anomalies")
def get_land_anomalies(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    ctx = _fetch_land_context(canonical_id, db)
    return detect_land_anomalies(canonical_id, ctx)

@app.get("/api/lands/{land_id:path}/evidence")
@app.get("/lands/{land_id:path}/evidence")
def get_land_evidence(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    ctx = _fetch_land_context(canonical_id, db)
    return build_land_evidence(canonical_id, ctx)

@app.get("/api/lands/{land_id:path}/risk-breakdown")
@app.get("/lands/{land_id:path}/risk-breakdown")
def get_land_risk_breakdown(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    ctx = _fetch_land_context(canonical_id, db)
    return build_risk_breakdown(canonical_id, ctx)

@app.get("/api/alerts")
def get_intelligent_alerts(db: Session = Depends(get_db)):
    return build_intelligent_alerts(_fetch_land_context, DEMO_LAND_DATA, db)

@app.post("/api/alerts/{alert_id:path}/read")
def mark_alert_read(alert_id: str):
    _READ_ALERTS_SET.add(alert_id)
    return {"status": "success", "alert_id": alert_id, "read": True}

# ============================================================================
# PHASE 2.5 AUTHENTICATION MODELS & ENDPOINTS
# ============================================================================

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[str] = "buyer"
    terms_accepted: Optional[bool] = True

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False

@app.post("/api/auth/register")
@app.post("/auth/register")
def register_endpoint(req: RegisterRequest, db: Session = Depends(get_db)):
    user_dict, error = register_user(
        db if DB_AVAILABLE else None,
        req.full_name,
        req.email,
        req.password,
        req.role or "buyer"
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    token = create_access_token({
        "sub": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"],
        "full_name": user_dict["full_name"]
    })
    return {
        "token": token,
        "user": user_dict,
        "message": "Account created successfully."
    }

@app.post("/api/auth/login")
@app.post("/auth/login")
def login_endpoint(req: LoginRequest, db: Session = Depends(get_db)):
    user_dict, error = authenticate_user(
        db if DB_AVAILABLE else None,
        req.email,
        req.password
    )
    if error:
        raise HTTPException(status_code=401, detail=error)
    
    expires_delta = timedelta(days=30) if req.remember_me else timedelta(days=1)
    token = create_access_token({
        "sub": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"],
        "full_name": user_dict["full_name"]
    }, expires_delta=expires_delta)
    
    return {
        "token": token,
        "user": user_dict,
        "message": "Logged in successfully."
    }

@app.get("/api/auth/me")
@app.get("/auth/me")
def get_current_user_profile(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    
    token = auth_header.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")
    
    user_id = payload.get("sub")
    user = get_user_by_id(db if DB_AVAILABLE else None, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")
    
    return {
        "authenticated": True,
        "user": user
    }

@app.post("/api/auth/logout")
@app.post("/auth/logout")
def logout_endpoint(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        revoke_token(token)
    return {"status": "logged_out", "message": "Successfully logged out."}

@app.get("/api/auth/demo-accounts")
@app.get("/auth/demo-accounts")
def get_demo_accounts_info():
    """Returns safe metadata about demo accounts for quick testing."""
    return {
        "disclaimer": "DEMO ONLY CREDENTIALS FOR TESTING",
        "accounts": [
            {
                "role": "owner",
                "role_label": "Land Owner",
                "email": "owner@landtrace360.demo",
                "password": DEMO_PASSWORD,
                "description": "View owned lands, manage listings, view title history & risk"
            },
            {
                "role": "buyer",
                "role_label": "Buyer",
                "email": "buyer@landtrace360.demo",
                "password": DEMO_PASSWORD,
                "description": "Search & view available lands, save lands, run AI queries"
            },
            {
                "role": "investigator",
                "role_label": "Investigator / Admin",
                "email": "investigator@landtrace360.demo",
                "password": DEMO_PASSWORD,
                "description": "Full access to anomalies, evidence explorer, risk audit & alerts"
            }
        ]
    }

@app.get("/api/lands/{land_id:path}")
@app.get("/lands/{land_id:path}")
def get_land(land_id: str, db: Session = Depends(get_db)):
    canonical_id = _resolve_land_id(land_id, db if DB_AVAILABLE else None)
    if DB_AVAILABLE:
        try:
            db_land = db.query(Land).filter(
                (Land.id == canonical_id) | (Land.survey_number == land_id)
            ).first()
            if db_land:
                return _land_to_dict(db_land)
        except Exception:
            pass
    for item in DEMO_LAND_DATA:
        if item["id"] == canonical_id or item["survey_number"] == land_id or item["survey_number"].lower() == land_id.lower():
            return item
    raise HTTPException(status_code=404, detail="Land not found")

@app.get("/api/loan-closure-verification/{doc_no:path}")
def loan_closure_verification(doc_no: str, db: Session = Depends(get_db)):
    """
    Look up a document number → find the linked land → find mortgage/loan →
    return loan status and verification result.
    """
    # 1. Search all DOCUMENTS_DATA for the doc_no
    found_land_id = None
    found_doc = None
    for land_id, docs in DOCUMENTS_DATA.items():
        if land_id == "default":
            continue
        for doc in docs:
            if doc["doc_no"].upper() == doc_no.strip().upper():
                found_land_id = land_id
                found_doc = doc
                break
        if found_doc:
            break

    # Also check seller-uploaded documents (ORM attribute access)
    if not found_doc and DB_AVAILABLE:
        try:
            for doc in db.query(SellerDocumentUpload).filter(SellerDocumentUpload.document_number == doc_no.strip()).all():
                if (doc.document_number or "").upper() == doc_no.strip().upper():
                    found_land_id = doc.land_id
                    found_doc = {
                        "doc_no": doc.document_number,
                        "type": doc.document_type,
                        "date": doc.issue_date or doc.uploaded_at[:10],
                        "verification": doc.verification_status,
                        "result": doc.verification_status
                    }
                    break
        except Exception:
            pass

    if not found_doc:
        return {
            "found": False,
            "document_number": doc_no,
            "message": "Document number not found in project records.",
            "disclaimer": "This verification is based on LandTrace360 project/demo records only. It is NOT real bank or government verification."
        }

    # 2. Get the land record
    land = None
    if DB_AVAILABLE:
        try:
            db_land = db.query(Land).filter(Land.id == found_land_id).first()
            if db_land:
                land = _land_to_dict(db_land)
        except Exception:
            pass
    if not land:
        land = next((l for l in DEMO_LAND_DATA if l["id"] == found_land_id), None)

    # 3. Get the mortgage/loan record
    mortgages = MORTGAGES_DATA.get(found_land_id, MORTGAGES_DATA.get("default", []))

    # 4. Build result
    result = {
        "found": True,
        "document_number": found_doc["doc_no"],
        "document_type": found_doc["type"],
        "document_date": found_doc.get("date", "N/A"),
        "document_verification": found_doc.get("verification", "N/A"),
        "land_id": found_land_id,
        "survey_number": land["survey_number"] if land else "N/A",
        "land_location": f"{land['location']}, {land['village']}, {land['district']}" if land else "N/A",
        "land_owner": land["owner"] if land else "N/A",
        "land_type": land["land_type"] if land else "N/A",
        "disclaimer": "This verification is based on LandTrace360 project/demo records only. It is NOT real bank or government verification."
    }

    if not mortgages or len(mortgages) == 0:
        result["loan_status"] = "NO LOAN RECORD FOUND"
        result["loan_mortgage_id"] = None
        result["bank_lender"] = None
        result["loan_start_date"] = None
        result["loan_end_date"] = None
        result["closure_date"] = None
        result["verification_result"] = "No loan information is available in the project records."
    else:
        m = mortgages[0]
        result["bank_lender"] = m["bank"]
        result["loan_start_date"] = m["start_date"]
        result["loan_end_date"] = m["release_date"]
        result["loan_mortgage_id"] = f"MTG-{found_land_id.replace('LND-', '')}-001"

        if m["status"] == "Released":
            result["loan_status"] = "COMPLETED"
            result["closure_date"] = m["release_date"]
            result["verification_result"] = "LOAN CLOSED — The mortgage/loan associated with this land has been fully completed and released."
        elif m["status"] == "Active":
            # Check if the release_date is in the past (overdue)
            try:
                from datetime import date as date_type
                release = datetime.strptime(m["release_date"], "%Y-%m-%d").date()
                today = datetime.now().date()
                if release < today:
                    result["loan_status"] = "OVERDUE"
                    result["closure_date"] = None
                    result["verification_result"] = "LOAN OVERDUE — The mortgage/loan has passed its expected release date but has not been marked as released."
                else:
                    result["loan_status"] = "ACTIVE"
                    result["closure_date"] = None
                    result["verification_result"] = "LOAN NOT YET COMPLETED — The mortgage/loan is currently active and has not been released."
            except Exception:
                result["loan_status"] = "ACTIVE"
                result["closure_date"] = None
                result["verification_result"] = "LOAN NOT YET COMPLETED — The mortgage/loan is currently active and has not been released."
        else:
            result["loan_status"] = m["status"].upper()
            result["closure_date"] = None
            result["verification_result"] = f"Loan status is {m['status']}."

    return result


# =====================================================================
# PHASE 2.6 — LANDTRACE AI EVIDENCE-BASED CHATBOT
# =====================================================================

chatbot_engine = LandTraceAIChatbot({
    "demo_lands": DEMO_LAND_DATA,
    "history_data": HISTORY_DATA,
    "owners_data": OWNERS_DATA,
    "documents_data": DOCUMENTS_DATA,
    "doc_verification_data": DOC_VERIFICATION_DATA,
    "cases_data": CASES_DATA,
    "mortgages_data": MORTGAGES_DATA,
    "risk_data": RISK_DATA,
    "dna_data": DNA_DATA,
    "boundary_data": BOUNDARY_DETECTION_DATA,
    "fragmentation_data": FRAGMENTATION_ANALYSIS_DATA,
    "fetch_land_context": _fetch_land_context
})

def _authenticate_chat_user(request: Request, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Enforces Phase 2.5 token authentication for LandTrace AI.
    Owner, Buyer, and Investigator/Admin roles can all access.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required to access LandTrace AI.")
    
    token = auth_header.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")
    
    user_id = payload.get("sub")
    user = get_user_by_id(db if DB_AVAILABLE else None, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")
    return user


@app.post("/api/chat")
@app.post("/chat")
def chat_endpoint(chat_req: ChatRequest, request: Request, db: Session = Depends(get_db)):
    """
    POST /api/chat
    Answers natural language queries grounded solely in LandTrace360 stored data.
    Returns: answer, land_id, language, intent, confidence, evidence, sources, suggested_questions.
    """
    user = _authenticate_chat_user(request, db)
    
    result = chatbot_engine.process_query(
        message=chat_req.message,
        explicit_land_id=chat_req.land_id,
        language=chat_req.language or "en",
        db=db if DB_AVAILABLE else None
    )
    if chat_req.conversation_id:
        result["conversation_id"] = chat_req.conversation_id
    result["user_role"] = user.get("role", "buyer")
    return result


@app.get("/api/chat/suggestions")
@app.get("/chat/suggestions")
def chat_suggestions_endpoint(land_id: Optional[str] = None):
    """
    GET /api/chat/suggestions?land_id=LND-1001
    Returns quick suggested inquiry pills tailored to the land context or global explorer.
    """
    target = (land_id or "").strip().upper()
    if target and target.startswith("LND-"):
        return {
            "land_id": target,
            "suggestions": [
                f"Who owns {target}?",
                f"Why is {target} high risk?",
                f"Does {target} have a mortgage?",
                f"What legal cases are associated with {target}?",
                f"What documents are available for {target}?",
                f"What anomalies were detected?",
                f"Show evidence for the risk",
                f"Show the ownership history of {target}",
                f"Is {target} listed for sale?",
                f"Give me a complete summary of {target}"
            ]
        }
    return {
        "land_id": None,
        "suggestions": [
            "What lands are currently for sale?",
            "Which lands have high risk scores?",
            "Who owns LND-1001?",
            "Why is LND-1004 high risk?",
            "Does LND-1006 have a mortgage?",
            "What happened to LND-1001 over time?"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)




