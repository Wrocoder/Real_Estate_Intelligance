import os

# Existing API tests intentionally exercise the deterministic demo dataset.
os.environ["DEMO_MODE_ENABLED"] = "true"
