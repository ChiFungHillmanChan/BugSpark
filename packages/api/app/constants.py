"""
Centralized BugSpark URLs and configuration

Update these values to change URLs across the entire API application.
All references should import from this module instead of hardcoding URLs.
"""
import os

# Production URLs - Update these to change the deployment URLs
# These can be overridden by environment variables
BUGSPARK_API_URL = os.getenv("BUGSPARK_API_URL", "https://api.bugspark.hillmanchan.com/api/v1")
BUGSPARK_DASHBOARD_URL = os.getenv("BUGSPARK_DASHBOARD_URL", "https://bugspark.hillmanchan.com")

# Extract base URLs (without /api/v1)
BUGSPARK_API_BASE_URL = BUGSPARK_API_URL.replace("/api/v1", "")

# Extract domains for CORS and CSP
BUGSPARK_DASHBOARD_DOMAIN = BUGSPARK_DASHBOARD_URL.replace("https://", "").replace("http://", "")
BUGSPARK_API_DOMAIN = BUGSPARK_API_BASE_URL.replace("https://", "").replace("http://", "")
