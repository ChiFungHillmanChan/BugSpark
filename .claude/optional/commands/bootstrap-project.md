# Project Bootstrap Rule

Guidelines for bootstrapping new projects or adding new frameworks.

## Core Principles

### 1. Official Documentation First

- ALWAYS refer to official documentation for the framework/library
- Never assume or guess bootstrap commands - verify against official sources
- Check for the latest version of bootstrap commands
- Look for official CLI tools, scaffolding tools, or project generators

### 2. Use Official Bootstrap Commands with pnpm

**NEVER manually create project structures or manage dependencies yourself.**

Always use official bootstrap/scaffolding commands:

```bash
# React
pnpm create react-app my-app
pnpm create vite@latest my-app --template react-ts

# Next.js
pnpm create next-app my-app

# Vue.js
pnpm create vue@latest my-app

# Svelte
pnpm create svelte@latest my-app

# Other frameworks
dotnet new        # .NET projects
rails new         # Ruby on Rails
django-admin startproject  # Django
cargo new         # Rust
```

### 3. Avoid Self-Managed Dependencies

Let the official bootstrap process handle:
- Build configurations (webpack, vite, etc.)
- Development server setup
- Testing framework configuration
- Linting and formatting tools
- TypeScript configuration
- Package.json scripts and dependencies

## Package Manager Guidelines

### pnpm Preference

**ALWAYS use pnpm** for Node.js projects:
- Faster installation and better disk space efficiency
- Strict dependency resolution prevents phantom dependencies
- Better monorepo support
- Compatible with npm registry

### Bootstrap Commands with pnpm

```bash
# Use pnpm create instead of npx create
pnpm create react-app my-app      # Instead of npx create-react-app
pnpm create next-app my-app       # Instead of npx create-next-app

# For unsupported commands, use pnpm dlx
pnpm dlx create-expo-app my-app   # Expo projects
```

## User Interaction Guidelines

### Guide Users Through Interactive Processes

When bootstrap commands require input:

1. **Explain each option** before running interactive commands
2. **Provide context** for configuration choices
3. **Recommend default options** for beginners
4. **Document the choices made** for future reference

Example guidance:
```
The bootstrap process will ask you several questions:
1. Project name: Use kebab-case (e.g., my-awesome-app)
2. TypeScript: Choose 'Yes' for better type safety
3. ESLint: Choose 'Yes' for code quality
4. Tailwind CSS: Choose based on styling preference
5. Package manager: Select 'pnpm' when prompted
```

### Post-Bootstrap Verification

After running bootstrap commands:
- Verify project structure was created correctly
- Test that dev server starts: `pnpm dev` or `pnpm start`
- Confirm dependencies installed: `pnpm install`
- Check basic commands work (build, test, lint)
- Ensure `pnpm-lock.yaml` file is generated

## Framework-Specific Guidelines

### Web Frameworks
- **React**: `pnpm create react-app` or `pnpm create vite@latest` with React template
- **Next.js**: `pnpm create next-app` with appropriate flags
- **Vue**: `pnpm create vue@latest`
- **Angular**: Angular CLI `ng new` then switch to pnpm
- **Svelte**: `pnpm create svelte@latest`

### Backend Frameworks
- **Node.js/Express**: express-generator with pnpm
- **Python/Django**: `django-admin startproject`
- **Python/FastAPI**: Official templates or cookiecutter
- **.NET**: `dotnet new` templates
- **Spring Boot**: Spring Initializr

### Mobile Development
- **React Native**: `pnpm dlx react-native init` or Expo CLI
- **Flutter**: `flutter create`
- **Ionic**: Ionic CLI with pnpm

## Common Mistakes to Avoid

1. **DON'T** manually create package.json files
2. **DON'T** manually install build tools like webpack or babel
3. **DON'T** copy configurations from other projects without understanding
4. **DON'T** skip reading official getting started guides
5. **DON'T** use outdated bootstrap commands or tutorials
6. **DON'T** mix package managers (avoid npm/yarn if using pnpm)

## Best Practices

1. Always check for updates to bootstrap tools before starting
2. Read the generated README files
3. Commit the initial bootstrap as a clean starting point
4. Document any post-bootstrap customizations
5. Keep bootstrap tools updated for future projects
6. Use pnpm consistently across all Node.js projects
7. Add pnpm-lock.yaml to version control, exclude node_modules

## Troubleshooting Bootstrap Issues

If bootstrap commands fail:
1. Check Node.js/runtime version compatibility
2. Clear package manager caches: `pnpm store prune`
3. Try with pnpm first, fallback to npm/yarn only if necessary
4. Check network connectivity and registry access
5. Refer to official troubleshooting documentation
6. Look for known issues in project's GitHub repository
7. Ensure pnpm is installed globally: `npm install -g pnpm`
