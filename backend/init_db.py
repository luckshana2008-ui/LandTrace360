import os
import sys
from pathlib import Path

_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Land, Owner, LandDocument, LegalCase, Mortgage, LandHistory, VerificationRecord, Alert
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from database import engine, SessionLocal

# Import existing dictionaries from main
import main
from main import (
    DEMO_LAND_DATA, HISTORY_DATA, OWNERS_DATA, DOCUMENTS_DATA, 
    CASES_DATA, MORTGAGES_DATA, DOC_VERIFICATION_DATA
)

def init_db():
    logger.info("Dropping tables if any schema changes... wait, skipping drop to preserve.")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed Lands
        for l_data in DEMO_LAND_DATA:
            existing = db.query(Land).filter(Land.id == l_data["id"]).first()
            if not existing:
                logger.info(f"Seeding land {l_data['id']}")
                new_land = Land(
                    id=l_data["id"],
                    survey_number=l_data["survey_number"],
                    subdivision_number=l_data["subdivision_number"],
                    location=l_data["location"],
                    village=l_data["village"],
                    taluk=l_data["taluk"],
                    district=l_data["district"],
                    area_sq_ft=l_data["area_sq_ft"],
                    land_type=l_data["land_type"],
                    owner=l_data["owner"],
                    status=l_data["status"],
                    is_for_sale=l_data.get("is_for_sale", False),
                    asking_price=l_data.get("asking_price"),
                    posted_date=l_data.get("posted_date"),
                    risk_score=l_data["risk_score"],
                    health_score=l_data["health_score"],
                    coordinates=l_data["coordinates"]
                )
                db.add(new_land)
        
        db.commit()

        # Seed Owners
        for land_id, owners in OWNERS_DATA.items():
            if land_id != "default":
                for owner in owners:
                    ex = db.query(Owner).filter(Owner.land_id == land_id, Owner.name == owner["name"]).first()
                    if not ex:
                        db.add(Owner(land_id=land_id, name=owner["name"], period=owner["period"], owner_type=owner["type"]))
        
        db.commit()

        # Seed History
        for land_id, hist_list in HISTORY_DATA.items():
            for h in hist_list:
                ex = db.query(LandHistory).filter(LandHistory.land_id == land_id, LandHistory.year == h["year"]).first()
                if not ex:
                    db.add(LandHistory(land_id=land_id, year=h["year"], owner=h["owner"], status=h["status"],
                                       transactions=h["transactions"], risk_score=h["risk_score"], boundary_status=h["boundary_status"]))
        
        db.commit()

        # Seed Documents
        for land_id, docs in DOCUMENTS_DATA.items():
            if land_id != "default":
                for doc in docs:
                    ex = db.query(LandDocument).filter(LandDocument.land_id == land_id, LandDocument.doc_no == doc["doc_no"]).first()
                    if not ex:
                        db.add(LandDocument(land_id=land_id, doc_no=doc["doc_no"], type=doc["type"], date=doc["date"],
                                            verification=doc["verification"], result=doc["result"]))
        db.commit()

        # Seed Legal Cases
        for land_id, cases in CASES_DATA.items():
            if land_id != "default":
                for case in cases:
                    ex = db.query(LegalCase).filter(LegalCase.land_id == land_id, LegalCase.case_no == case["case_no"]).first()
                    if not ex:
                        db.add(LegalCase(land_id=land_id, case_no=case["case_no"], case_type=case["type"], court=case["court"],
                                         filing_date=case["filing_date"], status=case["status"]))
        db.commit()

        # Seed Mortgages
        for land_id, mortgages in MORTGAGES_DATA.items():
            if land_id != "default":
                for m in mortgages:
                    ex = db.query(Mortgage).filter(Mortgage.land_id == land_id, Mortgage.bank == m["bank"]).first()
                    if not ex:
                        db.add(Mortgage(land_id=land_id, bank=m["bank"], start_date=m["start_date"], release_date=m["release_date"], status=m["status"]))
        db.commit()
        
        # Seed Verification Details
        for land_id, ver in DOC_VERIFICATION_DATA.items():
            if land_id != "default":
                ex = db.query(VerificationRecord).filter(VerificationRecord.land_id == land_id).first()
                if not ex:
                    db.add(VerificationRecord(
                        land_id=land_id,
                        overall_result=ver["overall_result"],
                        score=ver["score"],
                        fields=ver["fields"],
                        explanation=ver["explanation"]
                    ))
        db.commit()
        
        logger.info("Database seeding completed.")
    except Exception as e:
        logger.error(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
