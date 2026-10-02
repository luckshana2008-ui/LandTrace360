import sys
from pathlib import Path

# Ensure backend directory is in sys.path
_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from sqlalchemy import Column, Integer, String, Boolean, Float, JSON, ForeignKey, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Land(Base):
    __tablename__ = "lands"
    id = Column(String, primary_key=True, index=True)
    survey_number = Column(String)
    subdivision_number = Column(String)
    location = Column(String)
    village = Column(String)
    taluk = Column(String)
    district = Column(String)
    area_sq_ft = Column(Integer)
    land_type = Column(String)
    owner = Column(String)
    status = Column(String)
    is_for_sale = Column(Boolean, default=False)
    asking_price = Column(Integer, nullable=True)
    posted_date = Column(String, nullable=True)
    risk_score = Column(Integer)
    health_score = Column(Integer)
    coordinates = Column(JSON)  # Store [lat, lng]

class Owner(Base):
    __tablename__ = "owners"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), index=True)
    name = Column(String)
    period = Column(String)
    owner_type = Column(String)

class LandDocument(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), index=True)
    doc_no = Column(String, index=True)
    type = Column(String)
    date = Column(String)
    verification = Column(String)
    result = Column(String)

class LegalCase(Base):
    __tablename__ = "legal_cases"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), index=True)
    case_no = Column(String)
    case_type = Column(String)
    court = Column(String)
    filing_date = Column(String)
    status = Column(String)

class Mortgage(Base):
    __tablename__ = "mortgages"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), index=True)
    bank = Column(String)
    start_date = Column(String)
    release_date = Column(String)
    status = Column(String)

class LandHistory(Base):
    __tablename__ = "land_history"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), index=True)
    year = Column(Integer)
    owner = Column(String)
    status = Column(String)
    transactions = Column(Integer)
    risk_score = Column(Integer)
    boundary_status = Column(String)

class SavedLand(Base):
    __tablename__ = "saved_lands"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), index=True, unique=True)  # Assuming 1 user for MVP

class SellerListing(Base):
    __tablename__ = "seller_listings"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), unique=True)
    location = Column(String)
    area = Column(String)
    land_type = Column(String)
    expected_price = Column(Integer)
    description = Column(String)
    contact = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class SellerPropertyDetail(Base):
    __tablename__ = "seller_property_details"
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("seller_listings.id"))
    house_on_land = Column(String, nullable=True)
    house_details = Column(String, nullable=True)
    well_borewell = Column(String, nullable=True)
    water_facility = Column(String, nullable=True)
    electricity_available = Column(String, nullable=True)
    road_access = Column(String, nullable=True)
    road_details = Column(String, nullable=True)
    compound_wall = Column(String, nullable=True)
    existing_building = Column(String, nullable=True)
    existing_building_details = Column(String, nullable=True)
    current_land_use = Column(String, nullable=True)
    nearby_facilities = Column(String, nullable=True)
    additional_details = Column(String, nullable=True)

class VerificationRecord(Base):
    __tablename__ = "verification_records"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), index=True)
    overall_result = Column(String)
    score = Column(Integer)
    fields = Column(JSON)
    explanation = Column(String)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    land_id = Column(String, ForeignKey("lands.id"), index=True)
    date = Column(String)
    title = Column(String)
    message = Column(String)
    type = Column(String)

class SellerDocumentUpload(Base):
    """Persistent storage for seller-uploaded land documents."""
    __tablename__ = "seller_document_uploads"
    id = Column(String, primary_key=True, index=True)   # UUID
    land_id = Column(String, ForeignKey("lands.id"), index=True)
    document_type = Column(String)
    document_name = Column(String)
    document_number = Column(String, nullable=True)
    issue_date = Column(String, nullable=True)
    file_path = Column(String)
    uploaded_at = Column(String)
    verification_status = Column(String, default="Pending")
    notes = Column(Text, nullable=True)
