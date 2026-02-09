# Next.js Component Creation Rules

Ensure new components are created with proper separation of concerns from the start.

## Pre-Creation Analysis

Before creating any component, analyze requirements and identify:

1. **Domain Concerns**: User management, data display, form handling, security
2. **State Complexity**: Multiple forms, API calls, validation, UI toggles
3. **UI Sections**: Headers, forms, lists, modals, sidebars
4. **Reusability**: Parts that could be reused elsewhere

## Component Structure by Complexity

### Simple Components (< 200 lines expected)
Create a single component file following standard patterns.

### Complex Components (> 200 lines expected)
Use Domain-Driven Component Architecture:

```
feature-name/
├── README.md                    # Component documentation
├── FeaturePageClient.tsx        # Main component (composition only)
├── types.ts                     # Shared interfaces
├── utils.tsx                    # Pure utility functions
├── hooks/                       # Custom hooks by domain
│   ├── useFeatureManagement.ts  # Primary domain logic
│   └── useSecondaryFeature.ts   # Secondary domain logic
└── components/                  # Standalone UI components
    ├── PrimarySection.tsx       # Main feature UI
    └── SecondarySection.tsx     # Secondary feature UI
```

## Creation Process

### Step 1: Foundation Files

**`types.ts`** - Define All Interfaces:
```typescript
export interface PrimaryData {
  id: string;
  name: string;
}

export interface FormData {
  field1: string;
  field2: string;
}
```

**`utils.tsx`** - Pure Utility Functions:
```typescript
import { useTranslations } from 'next-intl';

export const formatData = (data: string) => {
  // formatting logic
};

export const useFeatureUtils = () => {
  const t = useTranslations('feature');
  const getStatusBadge = (status: string) => { /* ... */ };
  return { getStatusBadge };
};
```

### Step 2: Custom Hooks by Domain

```typescript
// hooks/usePrimaryFeature.ts
import { useState, useTransition } from 'react';

export const usePrimaryFeature = (initialData: PrimaryData) => {
  const t = useTranslations('feature.primary');

  // ALL state for this domain
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(/* initial */);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, startTransition] = useTransition();

  // ALL handlers for this domain
  const handleSubmit = async (e: React.FormEvent) => { /* ... */ };
  const handleCancel = () => { /* ... */ };
  const startEditing = () => setIsEditing(true);

  return {
    isEditing, formData, errors, isLoading,
    handleSubmit, handleCancel, startEditing,
  };
};
```

### Step 3: Standalone UI Components

```typescript
// components/PrimarySection.tsx
'use client';

import { usePrimaryFeature } from '../hooks/usePrimaryFeature';
import type { PrimaryData } from '../types';

interface PrimarySectionProps {
  data: PrimaryData;
}

export default function PrimarySection({ data }: PrimarySectionProps) {
  const t = useTranslations('feature.primary');
  const feature = usePrimaryFeature(data);

  return (
    <div>
      {/* Complete UI for this domain */}
    </div>
  );
}
```

### Step 4: Main Component (Composition Only)

```typescript
// FeaturePageClient.tsx
'use client';

import PrimarySection from './components/PrimarySection';
import SecondarySection from './components/SecondarySection';
import type { ComponentProps } from './types';

export default function FeaturePageClient({ data }: ComponentProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <PrimarySection data={data} />
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <SecondarySection data={data} />
      </div>
    </div>
  );
}
```

## State Management Guidelines

### Use Custom Hooks When:
- Managing complex form state with validation
- Handling API calls with loading/error states
- Managing multiple related UI toggles
- Implementing domain-specific business logic

### Keep Local State When:
- Simple UI toggles (modal open/close)
- Single input field values
- Temporary UI state that doesn't need sharing

### Hook Design Principles:
1. **Complete Encapsulation**: Each hook manages ALL related state
2. **Clear Boundaries**: No shared state between different domain hooks
3. **Actions Pattern**: Expose action functions, not raw setters
4. **Single Responsibility**: Each hook handles one domain concern

## Quality Checklist

Before considering a component complete:

- [ ] Main component < 100 lines (primarily composition)
- [ ] Each hook handles complete domain
- [ ] Components are standalone (can be used independently)
- [ ] No duplicate logic between main component and hooks
- [ ] Clear file organization
- [ ] Proper TypeScript (interfaces in types.ts)
- [ ] Documentation exists (README.md explains architecture)

## Anti-Patterns to Avoid

### DON'T Create Monolithic Components
```typescript
// BAD: Everything in one file
export default function FeatureComponent() {
  // 500+ lines of mixed concerns
}
```

### DON'T Create Incomplete Hooks
```typescript
// BAD: Hook only has some functions
const { data } = useFeature();
const handleEdit = () => { /* should be in hook */ };
```

### DON'T Define Local Components
```typescript
// BAD: Component defined inside main component
function MainComponent() {
  const LocalComponent = () => <div>...</div>; // Extract!
  return <LocalComponent />;
}
```
