# Multi-lingual & Localization Rules

Guidelines for implementing translations using next-intl with client-side priority.

## Core Principle

**Default to client-side localization unless server-side is absolutely required.**

## Client-Side Localization (Preferred)

### Use Client Components For:
- Page content (all user-facing text)
- Interactive elements (buttons, forms, modals)
- Dynamic content (lists, tables, cards)
- Feature-specific UI
- Error messages
- Navigation elements

### Implementation Pattern:
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('featureName.sectionName');
  return <h1>{t('title')}</h1>;
}
```

### Benefits:
- Build-time validation (missing keys detected during build)
- Tree shaking (unused translations excluded)
- Better caching (browser caches translation files)
- Faster development (no server restarts needed)
- Type safety (full TypeScript support)

## Server-Side Localization (Limited Use)

### ONLY Use Server Components For:
- Page metadata (`<title>`, `<meta>` tags, OpenGraph)
- SEO-critical content
- Static generation at build time

### Implementation Pattern:
```typescript
// Server component - only for metadata
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'mainNamespace' });

  return {
    title: t('pageTitle'),
    description: t('pageDescription')
  };
}

// Delegate content to client component
export default function ServerPage() {
  return <ClientPageComponent />;
}
```

### Server Constraints:
- **Main namespace only** - Can only access main files (`en.json`, `zh-TW.json`)
- **No feature namespaces** - Cannot access feature files (`assignments.json`)
- **Minimal usage** - Keep server translations to absolute minimum

## Translation File Structure

### Main Files (Server Accessible)
```
messages/
├── en.json           # loginPage, dashboardPage, common
└── zh-TW.json
```

### Feature Files (Client Only)
```
messages/
├── en/
│   ├── assignments.json    # assignments.assignmentsPage.*
│   ├── admin.json         # admin.users.*
│   └── ...
└── zh-TW/
    ├── assignments.json
    ├── admin.json
    └── ...
```

## Namespace Access Patterns

### Both Patterns Work:
```typescript
'use client';

// Pattern 1: Nested namespace access
const t = useTranslations('assignments.createAssignment');
const title = t('title'); // Direct access

// Pattern 2: Top-level namespace with dot notation
const t2 = useTranslations('assignments');
const title2 = t2('createAssignment.title'); // Dot notation
```

### Choose the Right Pattern:
```typescript
// Use nested when working primarily with one section
const createT = useTranslations('assignments.createAssignment');

// Use top-level when accessing multiple sections
const assignmentsT = useTranslations('assignments');
const commonT = useTranslations('common');
```

## Common Patterns

### Page with Metadata
```typescript
// page.tsx (Server)
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'mainNamespace' });
  return { title: t('assignments.pageTitle') }; // From main file
}

export default function Page() {
  return <AssignmentsPageClient />; // Delegate to client
}

// AssignmentsPageClient.tsx (Client)
'use client';
export default function AssignmentsPageClient() {
  const t = useTranslations('assignments.assignmentsPage'); // From feature file
  return <div>{t('title')}</div>;
}
```

### Pure Client Page
```typescript
// page.tsx (Server - minimal)
export const metadata = { title: 'Static Title' };

export default function Page() {
  return <ClientComponent />;
}
```

## Error Prevention

### WRONG:
```typescript
// Server component accessing feature namespace
const t = await getTranslations('assignments.assignmentsPage'); // ❌

// Client hook in server component
export default async function Page() {
  const t = useTranslations('feature'); // ❌
}

// Mixed server/client
export default async function Page() {
  const serverT = await getTranslations('main');
  const clientT = useTranslations('feature'); // ❌ Can't mix
}
```

### CORRECT:
```typescript
// Server metadata + client content
export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'main' }); // ✅
  return { title: t('pageTitle') };
}

export default function Page() {
  return <ClientComponent />; // ✅ Delegate to client
}

// Pure client component
'use client';
export default function ClientComponent() {
  const t = useTranslations('feature.section'); // ✅
  return <div>{t('content')}</div>;
}
```

## Adding New Translations

1. Create feature namespace files:
```bash
touch messages/en/newFeature.json
touch messages/zh-TW/newFeature.json
```

2. Update ClientIntlProvider if needed (add to auto-discovery list)

3. Use in components:
```typescript
'use client';
const t = useTranslations('newFeature.sectionName');
return <h1>{t('title')}</h1>;
```

## Validation Checklist

Before implementing translations:
- [ ] Client-first approach - Is this content better suited for client-side?
- [ ] Server necessity - Is server-side rendering truly required?
- [ ] Namespace access - Can server access the required namespace?
- [ ] SEO requirements - Does content need server-side for SEO?
