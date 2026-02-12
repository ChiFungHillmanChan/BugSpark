import {
  BUGSPARK_API_URL,
  BUGSPARK_WIDGET_CDN_URL,
} from "./constants";

// ---------------------------------------------------------------------------
// Dashboard — snippet code for project integration page
// ---------------------------------------------------------------------------
export const DASHBOARD_SCRIPT_TAG = `<script
  src="${BUGSPARK_WIDGET_CDN_URL}"
  data-api-key="\${BUGSPARK_PROJECT_KEY}"
  data-endpoint="${BUGSPARK_API_URL}"
  data-position="bottom-right"
  async
></script>`;

export const DASHBOARD_NPM_INIT = `import BugSpark from "@bugspark/widget";

// Set ENABLE_BUGSPARK=false in .env to disable the widget
if (process.env.ENABLE_BUGSPARK !== "false") {
  BugSpark.init({
    apiKey: process.env.BUGSPARK_PROJECT_KEY,
    endpoint: "${BUGSPARK_API_URL}",
    position: "bottom-right",
  });
}`;

export const DASHBOARD_REACT_INIT = `import { useEffect } from "react";
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

export const DASHBOARD_VUE_INIT = `<script setup>
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

export const DASHBOARD_ANGULAR_INIT = `import { Component, OnInit } from "@angular/core";
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
