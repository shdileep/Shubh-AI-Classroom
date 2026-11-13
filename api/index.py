import os
import sys
from dotenv import load_dotenv

# Add project root directory to sys.path so 'backend' package is importable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Load environment configuration if present
for env_candidate in [
    os.path.join(ROOT_DIR, ".env"),
    os.path.join(ROOT_DIR, "backend", ".env")
]:
    if os.path.exists(env_candidate):
        load_dotenv(dotenv_path=env_candidate)

# Set runtime defaults for Vercel serverless environment
os.environ.setdefault("USE_SQLITE", "1")
os.environ.setdefault("JWT_SECRET", "gapfinder_super_secret_jwt_key_2026_academic_spec")

# Import the FastAPI application
from backend.main import app
