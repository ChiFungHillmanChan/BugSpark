# State Management Philosophy

Guidelines for React/Next.js state management with Zustand.

## Goal

Balance component encapsulation and local state simplicity with the scalability and decoupling benefits of Zustand for shared or complex state. Choose the right tool for the job.

## Core Principles

### 1. Prioritize Local State (`useState`, `useReducer`) When:
- State is only used by a single component or passed 1-2 levels to children
- State represents simple UI concerns (modal visibility, input values, toggles)
- Logic to update state is straightforward and confined to the component

**Benefit:** Simplicity, less boilerplate, easy to understand

### 2. Use Zustand Stores When:
- State needs to be accessed by multiple distant components (avoids prop drilling)
- State represents a distinct domain (playHistory, searchPlaylist, player, userSession)
- State involves complex update logic or side effects (API calls, localStorage, WebSockets)
- Performance optimizations are needed (Zustand selectors prevent re-renders)

**Benefit:** Decoupling, scalability, testability, maintainability

### 3. Identifying State Domains for Stores

Look for groups of related state causing a component to become overly complex:

- **User Authentication**: Session, roles, permissions
- **Player Controls**: Status, current item, playback settings
- **Search/Filtering**: Query, results, filters, pagination
- **Playlist Management**: Items, order, modifications
- **Application Settings**: Preferences, theme, language

Each distinct domain is often a good candidate for its own store:
- `useAuthStore`
- `usePlayerStore`
- `useSearchStore`

### 4. Store Implementation Guidelines

- Keep stores focused on their specific domain
- Define clear state interfaces and action signatures
- Place state modification logic (actions) within the store
- Handle side effects (API calls, localStorage) within store actions
- Components should select only needed state slices: `useMyStore(state => state.someValue)`
- Components call store actions to trigger updates ("actions up" pattern)

### 5. Avoid Overuse

Do NOT put all state into Zustand stores. Simple, local UI state often belongs in the component using `useState`. Evaluate sharing and complexity requirements first.

## Example Scenario

### Initial State (Before Refactor)
`YoutubeBrowser` manages playHistory, search, playlist, player status, UI toggles locally. Prop drilling becomes extensive.

### Refactor 1 (History)
`playHistory` and `recentCoSingers` involve localStorage and WebSocket effects, needed by `YoutubeHistorySidebar`. Moved to `usePlayHistoryStore`.

### Refactor 2 (Search/Playlist)
Search/playlist state (`searchResults`, `playlistItems`, loading states, API calls) is complex and used by input/results components. Moved to `useSearchPlaylistStore`.

### Remaining Local State
`YoutubeBrowser` keeps `inputUrlOrQuery`, `showSidebar`, `videoHeight`, `roomId`, player state (`videoId`, `videoInfo`) - simpler, primarily UI-related.

## Decision Flowchart

```
Is state used by multiple distant components?
├── Yes → Consider Zustand store
└── No
    │
    Is state complex (API calls, localStorage, side effects)?
    ├── Yes → Consider Zustand store
    └── No
        │
        Is state simple UI concern?
        ├── Yes → Use useState/useReducer
        └── Consider based on future needs
```

## Store Template

```typescript
import { create } from 'zustand';

interface FeatureState {
  // State
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => void;
  clearError: () => void;
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await api.getItems();
      set({ items, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch', isLoading: false });
    }
  },

  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  clearError: () => set({ error: null }),
}));
```

## Component Usage

```typescript
// Select only what you need (prevents unnecessary re-renders)
const items = useFeatureStore((state) => state.items);
const fetchItems = useFeatureStore((state) => state.fetchItems);

// Or destructure multiple values
const { items, isLoading, fetchItems } = useFeatureStore();

// Use in effect
useEffect(() => {
  fetchItems();
}, [fetchItems]);
```
