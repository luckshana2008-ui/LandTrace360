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

raw_url = os.getenv("DATABASE_URL", "").strip()

def _is_valid_remote_database(url: str) -> bool:
    if not url:
        return False
    lower = url.lower()
    if lower in ("none", "null", "false", "undefined", "", "sqlite", "sqlite://"):
        return False
    # If the URL points to localhost or 127.0.0.1, it cannot reach a cloud database on Render
    if "localhost" in lower or "127.0.0.1" in lower:
        return False
    return True

if _is_valid_remote_database(raw_url):
    DATABASE_URL = raw_url
    # Render postgres:// handling
    # Explicitly use postgresql+psycopg2:// if psycopg2 is installed to avoid missing driver errors
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    logger.info("DATABASE_URL is set to a remote PostgreSQL database.")
else:
    # Use SQLite for safe, self-contained startup without requiring a local Postgres service.
    # Absolute path ensures database file is accessible regardless of working directory.
    _db_path = Path(_BACKEND_DIR) / "landtrace360.db"
    DATABASE_URL = f"sqlite:///{_db_path.resolve().as_posix()}"
    logger.info(
        f"DATABASE_URL not set or points to localhost. Using local SQLite database at {DATABASE_URL}. "
        "For persistent storage across Render rebuilds, configure a remote PostgreSQL DATABASE_URL in Render Environment Variables."
    )

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
