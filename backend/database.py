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
    # For local development, fall back to a local PostgreSQL URL.
    # Set DATABASE_URL in your .env file to override this.
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/landtrace360"
    logger.warning(
        "DATABASE_URL is not set in environment. "
        "Falling back to local default: postgresql://postgres:postgres@localhost:5432/landtrace360. "
        "For production on Render, set DATABASE_URL in the environment variables."
    )

# Render uses postgres:// but SQLAlchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Set connect_timeout so startup does not hang if localhost postgres is not running
connect_args = {}
if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+psycopg2://"):
    connect_args["connect_timeout"] = 5

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,          # test connections before use
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
