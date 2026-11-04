import os
import sys
import logging
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Ensure backend directory is in sys.path
_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not DATABASE_URL:
    # When DATABASE_URL is not set, use local SQLite so startup succeeds immediately without
    # hanging on an unavailable local PostgreSQL port. Tables and demo data are initialized automatically.
    # To use a dedicated PostgreSQL database on Render, set DATABASE_URL in Render Environment Variables.
    DATABASE_URL = "sqlite:///./landtrace360.db"
    logger.info(
        "DATABASE_URL not set in environment. Initializing local database: sqlite:///./landtrace360.db. "
        "For persistent storage across Render rebuilds, configure DATABASE_URL in Render Environment Variables."
    )

# Render uses postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Set connect_timeout so startup does not hang if postgres is unreachable
connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True
}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+psycopg2://"):
        connect_args["connect_timeout"] = 5
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine_kwargs["connect_args"] = connect_args

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
