# @bugspark/widget

Embeddable bug reporting widget for any website. Automatically captures screenshots, console logs, network requests, and user session recordings.

## Features

- **Auto Screenshot** — captures a screenshot when users open the bug report form, with built-in annotation tools (pen, arrow, rectangle, circle, text, blur)
- **Console Logs** — records the last 100 console entries (log, warn, error)
- **Network Logs** — records the last 50 network requests with timing
- **Session Recording** — captures the last 30 seconds of user interactions (clicks, scrolls, inputs)
- **Device Metadata** — browser, viewport, screen resolution, locale, timezone, connection, Web Vitals
- **Zero Dependencies UI** — all UI is injected via Shadow DOM, no CSS conflicts with your site
- **Tiny Bundle** — ~229 KB (includes html2canvas)

## Quick Start

### Option 1: Script Tag (easiest)

Add one line before `</body>` — works with any website (HTML, Django, WordPress, PHP, etc.):

```html
<script
  src="https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js"
  data-api-key="YOUR_API_KEY"
  data-endpoint="https://api.bugspark.hillmanchan.com/api/v1"
  data-position="bottom-right"
  data-theme="light"
></script>
```

### Option 2: npm install

```bash
npm install @bugspark/widget
```

```javascript
import BugSpark from '@bugspark/widget';

BugSpark.init({
  apiKey: 'YOUR_API_KEY',
  endpoint: 'https://api.bugspark.hillmanchan.com/api/v1',
});
```

## Configuration

### Script Tag Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-api-key` | (required) | Your project API key from BugSpark Dashboard |
| `data-endpoint` | (required) | Your BugSpark API URL |
| `data-position` | `bottom-right` | Button position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-theme` | `light` | Theme: `light`, `dark`, `auto` |

### Programmatic Config

```javascript
BugSpark.init({
  apiKey: 'YOUR_API_KEY',           // required
  endpoint: 'https://...',          // required
  position: 'bottom-right',        // button position
  theme: 'light',                   // light | dark | auto
  primaryColor: '#e94560',          // brand color
  enableScreenshot: true,           // auto screenshot
  enableConsoleLogs: true,          // capture console
  enableNetworkLogs: true,          // capture network
  enableSessionRecording: true,     // capture user actions
  user: {                           // optional: identify user
    id: 'user-123',
    email: 'user@example.com',
    name: 'Jane Doe',
  },
  beforeSend(report) {              // filter sensitive data
    return report;
  },
  onSubmit(report) {                // callback after submit
    console.log('Bug submitted!');
  },
});
```

## API

| Method | Description |
|--------|-------------|
| `BugSpark.init(config)` | Initialize the widget |
| `BugSpark.open()` | Programmatically open the report form |
| `BugSpark.close()` | Close the report form |
| `BugSpark.destroy()` | Remove the widget and clean up |
| `BugSpark.identify(user)` | Update user info after init |

## Framework Examples

### Next.js (App Router)

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js"
          data-api-key="YOUR_API_KEY"
          data-endpoint="https://api.bugspark.hillmanchan.com/api/v1"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

### React (Vite / CRA)

```tsx
// src/App.tsx
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js';
    script.setAttribute('data-api-key', 'YOUR_API_KEY');
    script.setAttribute('data-endpoint', 'https://api.bugspark.hillmanchan.com/api/v1');
    document.body.appendChild(script);
    return () => {
      if ((window as any).BugSpark) (window as any).BugSpark.destroy();
    };
  }, []);

  return <div>Your App</div>;
}
```

### Django

```html
<!-- templates/base.html -->
{% load static %}
<!DOCTYPE html>
<html>
<body>
  {% block content %}{% endblock %}

  <script
    src="https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js"
    data-api-key="{{ BUGSPARK_API_KEY }}"
    data-endpoint="https://api.bugspark.hillmanchan.com/api/v1"
  ></script>
</body>
</html>
```

### Vue.js

```html
<!-- index.html -->
<body>
  <div id="app"></div>
  <script
    src="https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js"
    data-api-key="YOUR_API_KEY"
    data-endpoint="https://api.bugspark.hillmanchan.com/api/v1"
  ></script>
</body>
```

### WordPress

```php
// functions.php
function bugspark_widget() {
    echo '<script
      src="https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js"
      data-api-key="YOUR_API_KEY"
      data-endpoint="https://api.bugspark.hillmanchan.com/api/v1"
    ></script>';
}
add_action('wp_footer', 'bugspark_widget');
```

## Getting Your API Key

1. Go to your BugSpark Dashboard
2. Navigate to **Projects** → **Create Project**
3. Copy the generated API key (starts with `bsk_pub_`)

## License

MIT
