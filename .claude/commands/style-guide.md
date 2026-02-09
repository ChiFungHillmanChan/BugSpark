# Style Guide

Visual design and styling rules for the project.

<!-- [PROJECT: Customize this for your project's design system] -->

## General Principles

- Use a consistent styling approach across the project
- Follow the project's chosen CSS methodology (Tailwind, CSS Modules, styled-components, etc.)
- Maintain visual consistency through shared design tokens

## Layout Consistency Rules

### Page Structure Requirements

All pages should follow a consistent layout structure for uniform spacing and visual hierarchy.

<!-- [PROJECT: Define your page structure pattern here. Example:] -->

<!--
### Example: TailwindCSS Page Pattern
```tsx
export default function YourPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Title</h1>
        <p className="text-gray-600">Page description</p>
      </div>
    </div>
  )
}
```
-->

### Consistency Rules

1. **Root Container**: Use a consistent root wrapper across pages
2. **Content Sections**: Use a consistent card/section pattern
3. **No Ad Hoc Containers**: Don't add extra wrapper divs with inconsistent spacing
4. **Let Layouts Handle Spacing**: Global layouts handle page-level margins

### Forbidden Practices

- Extra container divs with arbitrary padding/margins
- Custom layout styling that conflicts with global layouts
- Page-specific spacing overrides that break consistency

## Naming Conventions

```
Files:      kebab-case (user-profile.tsx)
Components: PascalCase (UserProfile)
Functions:  camelCase (getUserById)
Constants:  SCREAMING_SNAKE_CASE (API_BASE_URL)
Types:      PascalCase (UserProfile, ApiResponse)
CSS:        kebab-case for classes (user-card, nav-link)
```

## Import Order

```
1. Framework/language imports
2. External library imports
3. Internal absolute imports (using path aliases)
4. Relative imports
```
