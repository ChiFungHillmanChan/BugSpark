/**
 * Centralized BugSpark URLs and configuration
 * 
 * Update these values to change URLs across the entire dashboard application.
 * All references should import from this file instead of hardcoding URLs.
 */

// Production URLs - Update these to change the deployment URLs
export const BUGSPARK_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bugspark.hillmanchan.com/api/v1";
export const BUGSPARK_DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bugspark.hillmanchan.com";

// Widget CDN URL (for serving the widget script)
export const BUGSPARK_WIDGET_CDN_URL = "https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js";

// Widget feature flag — set NEXT_PUBLIC_ENABLE_BUGSPARK=false to disable
export const BUGSPARK_ENABLED =
  (process.env.NEXT_PUBLIC_ENABLE_BUGSPARK ?? "true").toLowerCase() !== "false";

// Extract base API URL (without /api/v1) for CSP and other uses
export const BUGSPARK_API_BASE_URL = BUGSPARK_API_URL.replace("/api/v1", "");

// Extract dashboard domain for CSP
export const BUGSPARK_DASHBOARD_DOMAIN = new URL(BUGSPARK_DASHBOARD_URL).hostname;
export const BUGSPARK_API_DOMAIN = new URL(BUGSPARK_API_BASE_URL).hostname;
