import {
  BUGSPARK_API_URL,
  BUGSPARK_WIDGET_CDN_URL,
} from "./constants";

// ---------------------------------------------------------------------------
// Landing page — script tag with env-variable placeholder
// ---------------------------------------------------------------------------
export const LANDING_SCRIPT_TAG = `<script
  src="${BUGSPARK_WIDGET_CDN_URL}"
  data-api-key="\${BUGSPARK_PROJECT_KEY}"
  data-position="bottom-right"
  async
></script>`;

// ---------------------------------------------------------------------------
// Landing page — NPM init with theme
// ---------------------------------------------------------------------------
export const LANDING_NPM_INIT = `import BugSpark from '@bugspark/widget';

BugSpark.init({
  apiKey: process.env.BUGSPARK_PROJECT_KEY,
  endpoint: '${BUGSPARK_API_URL}',
  position: 'bottom-right',
  // Optional: customize theme
  theme: { accent: '#e94560' },
});`;

// ---------------------------------------------------------------------------
// Landing page — Vue init
// ---------------------------------------------------------------------------
export const LANDING_VUE_INIT = `<script setup>
import { onMounted } from 'vue';
import BugSpark from '@bugspark/widget';

onMounted(() => {
  BugSpark.init({
    apiKey: import.meta.env.VITE_BUGSPARK_PROJECT_KEY,
    endpoint: '${BUGSPARK_API_URL}',
    position: 'bottom-right',
  });
});
</script>`;
