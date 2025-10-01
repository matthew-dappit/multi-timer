# Multi-Timer AI Coding Guide

## Project Overview

Multi-Timer is a Next.js 15 time tracking app for development agencies. All state lives in localStorage with no backend database - Xano only handles authentication.

**Note:** Timer tracking logic has been cleared and is ready for fresh implementation. See `docs/timer-rebuild-plan.md` for details.

## Critical Architecture Concepts

### State Management Pattern

`MultiTimer.tsx` is the **single source of truth** for all timer state:

- `groups`: Array of timer groups containing timers
- Timer tracking logic: **Currently removed, ready for new implementation**

**Persistence:** localStorage key in `MultiTimer.tsx`:

- `multi-timer/state`: Timer groups structure and view preferences

### Component Hierarchy & Data Flow

```
AuthProvider (contexts/AuthContext.tsx)
└── ProtectedRoute (components/ProtectedRoute.tsx)
    └── MultiTimer (components/MultiTimer.tsx) ← State owner
        └── Timer (components/Timer.tsx) ← Presentation only
```

**Timer.tsx is purely presentational** - receives props, renders UI. All logic lives in `MultiTimer.tsx`.

## Development Workflow

### Running the App

```bash
npm run dev    # Start dev server with Turbopack
npm run build  # Production build with Turbopack
npm run lint   # Run ESLint
```

**Dev server:** `http://localhost:3000` (Next.js 15 with Turbopack enabled)

### Authentication Setup

Set environment variables in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-workspace.xano.io/api:main
```

Auth flow: Xano JWT stored in `localStorage` → `AuthContext` provides auth state → `ProtectedRoute` guards timer UI.

## Project Conventions

### Naming & Structure

- **IDs:** Random alphanumeric via `createId()` - e.g., `"x7k9m2p4q1"`
- **Storage keys:** Namespace with `multi-timer/` prefix
- **Components:** PascalCase files matching component name
- **Types:** Define interfaces inline at top of component files

### Styling

- **Tailwind CSS** with custom Dappit brand colors in `tailwind.config.ts`:
  - `dappit-turquoise` (#01D9B5) - active states
  - `dappit-coral` (#FF7F50) - stop/warning states
  - `dappit-black` (#202020) - primary text
- **Font:** Poppins (weights 300-700) via `next/font/google`
- **Layout:** Responsive grid with compact/standard views

### TypeScript Patterns

- **Strict typing:** All props, state, and functions typed
- **Type guards:** Use normalisation functions (e.g., `normaliseTimer`) for localStorage data
- **Client components:** Mark with `"use client"` directive (all current components are client-side)

## Common Tasks

### Adding a Timer Feature

1. Add state to `MultiTimer.tsx` (state owner)
2. Pass data down to `Timer.tsx` as props
3. Persist new state fields to localStorage

### Adding UI Elements

- Use existing Dappit colors from `tailwind.config.ts`
- Match compact/standard view pattern (see `isCompact` prop in `Timer.tsx`)
- Ensure responsive grid layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

## Integration Points

### Xano Backend

- **Authentication only** - `/auth/login`, `/auth/signup`, `/auth/me`
- Auth utilities in `src/lib/auth.ts` (see `authAPI` and `authClient`)
- **No timer data** sent to backend - all localStorage

### Future Integrations (Planned)

- Zoho Books: Invoice generation from time events
- ClickUp/Linear: Task sync with timer task names

## Key Files Reference

| File                            | Purpose                             |
| ------------------------------- | ----------------------------------- |
| `src/components/MultiTimer.tsx` | State management, localStorage      |
| `src/components/Timer.tsx`      | Timer UI card (presentation)        |
| `src/contexts/AuthContext.tsx`  | Authentication state provider       |
| `src/lib/auth.ts`               | Xano auth utilities                 |
| `docs/timer-rebuild-plan.md`    | Plan for timer logic implementation |
| `docs/development.md`           | Full developer setup guide          |

## Anti-Patterns to Avoid

❌ **Don't use `setInterval` for elapsed time** - browser throttling breaks it  
❌ **Don't manage state in `Timer.tsx`** - keep it in `MultiTimer.tsx`  
❌ **Don't skip type guards** when reading localStorage - data can be corrupt

## Git Workflow & Conventions

### Branch Naming

Use the `feat/` prefix for new features:

```bash
git checkout -b feat/zoho-integration
git checkout -b feat/export-time-data
git checkout -b feat/analytics-dashboard
```

Other prefixes:

- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

### Commit Messages

Be descriptive and concise:

```bash
git commit -m "feat: add daily summary calculation to MultiTimer"
git commit -m "fix: prevent timer drift when browser tab throttled"
git commit -m "docs: update architecture guide with event system"
```

### Deployment Workflow

1. Push changes to GitHub (any branch)
2. Create PR to `main` branch
3. Vercel automatically deploys preview for PR
4. Merge to `main` triggers production deployment
5. Vercel syncs with GitHub - no manual deployment needed

**Production URL:** Check Vercel dashboard for live URL

## Environment Variables

### Local Development

Create `.env.local` (git-ignored):

```env
NEXT_PUBLIC_API_BASE_URL=https://your-workspace.xano.io/api:main
```

### Vercel Production

**Critical:** Environment variables must be set in Vercel dashboard for production:

1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add `NEXT_PUBLIC_API_BASE_URL` with your Xano workspace URL
4. Redeploy for changes to take effect

**Current Issue:** Authentication not working on Vercel deployment likely due to missing environment variables. Check:

- Vercel dashboard has `NEXT_PUBLIC_API_BASE_URL` set
- Value matches your Xano workspace (format: `https://workspace-name.xano.io/api:main`)
- Redeploy after adding/updating variables

**Note:** All `NEXT_PUBLIC_*` variables are exposed to the browser. Store secrets (API keys, tokens) without this prefix and access them server-side only.

## Testing Strategy

**Current approach:** Manual testing only (no test framework configured)

### Manual Testing Checklist

1. Create timer, start/stop multiple times
2. Refresh page - verify state persistence
3. Switch between timers - verify exclusive behavior (only one runs)
4. Check elapsed accuracy matches actual wall-clock time
5. Test authentication flow (login/signup/logout)
6. Verify localStorage persistence across browser sessions
7. Test compact vs standard view switching

### Future Testing (Planned)

Consider adding:

- **Jest** + **React Testing Library** for component tests
- **Playwright** or **Cypress** for E2E tests
- **Vitest** as a faster alternative to Jest
