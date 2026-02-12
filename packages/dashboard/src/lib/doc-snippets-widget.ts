import {
  BUGSPARK_API_URL,
  BUGSPARK_WIDGET_CDN_URL,
  BUGSPARK_API_DOMAIN,
} from "./constants";

// ---------------------------------------------------------------------------
// Widget script tag — standard (for docs)
// ---------------------------------------------------------------------------
export const WIDGET_SCRIPT_TAG = `<script
  src="${BUGSPARK_WIDGET_CDN_URL}"
  data-api-key="YOUR_API_KEY"
  data-endpoint="${BUGSPARK_API_URL}"
  data-position="bottom-right"
  async
></script>`;

// ---------------------------------------------------------------------------
// Widget script tag — full configuration example
// ---------------------------------------------------------------------------
export const WIDGET_SCRIPT_TAG_FULL = `<script
  src="${BUGSPARK_WIDGET_CDN_URL}"
  data-api-key="bsk_pub_abc123"
  data-endpoint="${BUGSPARK_API_URL}"
  data-position="bottom-left"
  data-accent="#6366f1"
  data-dark-mode="true"
  data-reporter="user@example.com"
  async
></script>`;

// ---------------------------------------------------------------------------
// NPM — basic init
// ---------------------------------------------------------------------------
export const WIDGET_NPM_INIT = `import BugSpark from "@bugspark/widget";

// Set ENABLE_BUGSPARK=false in .env to disable the widget
if (process.env.ENABLE_BUGSPARK !== "false") {
  BugSpark.init({
    apiKey: process.env.BUGSPARK_PROJECT_KEY,
    endpoint: "${BUGSPARK_API_URL}",
    position: "bottom-right",
  });
}`;

// ---------------------------------------------------------------------------
// NPM — React useEffect pattern
// ---------------------------------------------------------------------------
export const WIDGET_REACT_INIT = `import { useEffect } from "react";
import BugSpark from "@bugspark/widget";

function App() {
  useEffect(() => {
    // Set NEXT_PUBLIC_ENABLE_BUGSPARK=false in .env to disable
    if (process.env.NEXT_PUBLIC_ENABLE_BUGSPARK !== "false") {
      BugSpark.init({
        apiKey: process.env.BUGSPARK_PROJECT_KEY,
        endpoint: "${BUGSPARK_API_URL}",
        position: "bottom-right",
      });
    }
  }, []);

  return <div>{/* your app */}</div>;
}`;

// ---------------------------------------------------------------------------
// NPM — Vue pattern
// ---------------------------------------------------------------------------
export const WIDGET_VUE_INIT = `<script setup>
import { onMounted } from "vue";
import BugSpark from "@bugspark/widget";

onMounted(() => {
  // Set VITE_ENABLE_BUGSPARK=false in .env to disable
  if (import.meta.env.VITE_ENABLE_BUGSPARK !== "false") {
    BugSpark.init({
      apiKey: import.meta.env.VITE_BUGSPARK_PROJECT_KEY,
      endpoint: "${BUGSPARK_API_URL}",
      position: "bottom-right",
    });
  }
});
</script>`;

// ---------------------------------------------------------------------------
// NPM — Angular pattern
// ---------------------------------------------------------------------------
export const WIDGET_ANGULAR_INIT = `import { Component, OnInit } from "@angular/core";
import BugSpark from "@bugspark/widget";
import { environment } from "../environments/environment";

@Component({ selector: "app-root", template: "<router-outlet />" })
export class AppComponent implements OnInit {
  ngOnInit() {
    // Set enableBugspark: false in environment.ts to disable
    if (environment.enableBugspark !== false) {
      BugSpark.init({
        apiKey: environment.bugsparkApiKey,
        endpoint: "${BUGSPARK_API_URL}",
        position: "bottom-right",
      });
    }
  }
}`;

// ---------------------------------------------------------------------------
// CSP example
// ---------------------------------------------------------------------------
export const CSP_EXAMPLE = `script-src 'self' https://cdn.jsdelivr.net;
connect-src 'self' https://${BUGSPARK_API_DOMAIN};`;
