"""
LandTrace360 Root ASGI Entrypoint.
Enables both 'uvicorn main:app' and 'uvicorn backend.main:app' to work
seamlessly regardless of Render's configured Root Directory or Start Command.
"""
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
_BACKEND = _ROOT / "backend"
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from backend.main import app

__all__ = ["app"]

