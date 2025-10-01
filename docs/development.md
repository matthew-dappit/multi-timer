# Development Guide

Guide for developers working on the Multi-Timer application.

---

## Development Environment Setup

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Git**
- **VS Code** (recommended) or any code editor
- **Xano account** (for backend features)

### Initial Setup

1. **Clone the repository:**
```bash
git clone https://github.com/matthew-dappit/multi-timer.git
cd multi-timer
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_XANO_API_URL=https://your-workspace.xano.io/api:main
NEXT_PUBLIC_XANO_AUTH_TOKEN=your-token
```

4. **Start development server:**
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Project Structure

```
multi-timer/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Home page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   └── favicon.ico           # Favicon
│   ├── components/               # React components
│   │   ├── MultiTimer.tsx        # Main timer container (state)
│   │   ├── Timer.tsx             # Individual timer (presentation)
│   │   ├── Navbar.tsx            # Navigation bar
│   │   ├── AuthForm.tsx          # Login/signup form
│   │   └── ProtectedRoute.tsx    # Route protection
│   ├── contexts/                 # React contexts
│   │   └── AuthContext.tsx       # Authentication state
│   └── lib/                      # Utility functions
│       └── auth.ts               # Auth utilities
├── public/                       # Static assets
│   ├── dappit-logo-LightBG.svg
│   └── dappit-logo-DarkBG.svg
├── docs/                         # Documentation
│   ├── README.md                 # Docs index
│   ├── architecture.md           # System design
│   ├── features.md               # Feature list
│   ├── quick-start.md            # Getting started
│   ├── changelog.md              # Version history
│   └── integrations.md           # Third-party integrations
├── .env.local                    # Environment variables (git-ignored)
├── .env.example                  # Example env file
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

---

## npm Scripts

```bash
# Development
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Deployment
vercel               # Deploy to Vercel (requires Vercel CLI)
```

---

## Coding Standards

### TypeScript

**Always use TypeScript:**
```typescript
// ✅ Good
interface TimerProps {
  id: string;
  elapsed: number;
  onStart: (id: string) => void;
}

// ❌ Bad
const Timer = (props: any) => { }
```

**Type all function parameters and returns:**
```typescript
// ✅ Good
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// ❌ Bad
function formatTime(seconds) {
  // ...
}
```

### React Components

**Use functional components with TypeScript:**
```typescript
// ✅ Good
interface TimerProps {
  id: string;
  elapsed: number;
}

export default function Timer({ id, elapsed }: TimerProps) {
  // ...
}
```

**Name event handlers consistently:**
```typescript
// ✅ Good
const handleTaskChange = (id: string, value: string) => { };
const handleNotesChange = (id: string, value: string) => { };

// ❌ Bad
const changeTask = (id: string, value: string) => { };
const updateIt = (id: string, value: string) => { };
```

### State Management

**Immutable state updates:**
```typescript
// ✅ Good
setTimers(prev => prev.map(timer =>
  timer.id === id ? { ...timer, elapsed: newElapsed } : timer
));

// ❌ Bad
timers[index].elapsed = newElapsed;
setTimers(timers);
```

**Use refs for non-rendered values:**
```typescript
// ✅ Good - doesn't cause re-render
const hasHydratedRef = useRef(false);

// ❌ Bad - causes unnecessary re-renders
const [hasHydrated, setHasHydrated] = useState(false);
```

### Styling

**Use Tailwind CSS utility classes:**
```tsx
// ✅ Good
<button className="rounded-md bg-teal-400 px-4 py-2 text-white hover:bg-teal-500">
  Start
</button>

// ❌ Bad - inline styles
<button style={{ background: '#01D9B5', padding: '8px 16px' }}>
  Start
</button>
```

**Use Dappit brand colors:**
```typescript
// Tailwind config includes:
// - dappit-black: #202020
// - dappit-white: #F3F3F3
// - dappit-teal: #01D9B5
// - dappit-coral: #FF7F50
```

---

## Adding New Features

### 1. Create Feature Branch

```bash
git checkout -b feature/analytics-dashboard
```

### 2. Implement Feature

**Example: Adding a new utility function**

```typescript
// src/lib/timeUtils.ts
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

// Add tests (future)
// src/lib/timeUtils.test.ts
describe('formatDuration', () => {
  it('formats milliseconds to hours and minutes', () => {
    expect(formatDuration(5400000)).toBe('1h 30m');
  });
});
```

### 3. Update Documentation

Update relevant docs in `docs/` directory:
- Add to `features.md` if it's user-facing
- Update `architecture.md` if it changes structure
- Add to `changelog.md` with version number

### 4. Test Locally

```bash
npm run dev        # Test in development
npm run build      # Test production build
npm run start      # Test production server
```

### 5. Commit and Push

```bash
git add .
git commit -m "feat: add analytics dashboard"
git push origin feature/analytics-dashboard
```

### 6. Create Pull Request

- Clear description of changes
- Screenshots if UI changes
- Link to related issues

---

## Common Development Tasks

### Adding a New Component

```typescript
// src/components/ProjectSummary.tsx
"use client";

import { useMemo } from 'react';

interface ProjectSummaryProps {
  projectName: string;
  timerCount: number;
}

export default function ProjectSummary({ 
  projectName,
  timerCount
}: ProjectSummaryProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold">{projectName}</h2>
      <p className="mt-2 text-gray-600">{timerCount} timers</p>
    </div>
  );
}
```

### Adding LocalStorage Persistence

```typescript
// Save to localStorage
useEffect(() => {
  if (!hasHydrated.current) return;
  
  try {
    const data = JSON.stringify({ groups, timers });
    localStorage.setItem('multi-timer/state', data);
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}, [groups, timers]);

// Load from localStorage
useEffect(() => {
  try {
    const stored = localStorage.getItem('multi-timer/state');
    if (stored) {
      const parsed = JSON.parse(stored);
      setGroups(parsed.groups);
      setTimers(parsed.timers);
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
  
  hasHydrated.current = true;
}, []);
```

### Adding API Integration

```typescript
// src/lib/api.ts
export async function fetchProjects(): Promise<Project[]> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/projects`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
}
```

---

## Debugging

### Browser DevTools

**React DevTools:**
- Install React DevTools extension
- Inspect component props and state
- Profile performance

**Console Logging:**
```typescript
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Timer started:', timerId, Date.now());
}
```

### Common Issues

**Issue: LocalStorage quota exceeded**
```typescript
// Solution: Clear old data periodically
const clearOldData = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('multi-timer/old-')) {
      localStorage.removeItem(key);
    }
  });
};
```

**Issue: State not updating**
```typescript
// Problem: Mutating state directly
timers[0].elapsed = 100;  // ❌

// Solution: Create new array
setTimers(prev => prev.map((timer, i) => 
  i === 0 ? { ...timer, elapsed: 100 } : timer
));  // ✅
```

**Issue: Infinite re-render**
```typescript
// Problem: Missing useEffect dependencies
useEffect(() => {
  setCount(count + 1);  // ❌ Infinite loop
});

// Solution: Add dependencies
useEffect(() => {
  setCount(prev => prev + 1);
}, []);  // ✅ Runs once
```

---

## Testing

### Manual Testing Checklist

**Basic Functionality:**
- [ ] Create project groups and timers
- [ ] Edit task names and notes
- [ ] Remove timers and groups
- [ ] Switch between compact and standard views

**Persistence:**
- [ ] Create timers, refresh, verify all restored
- [ ] Add notes, refresh, verify notes preserved
- [ ] Switch to compact mode, refresh, verify mode preserved

**Authentication:**
- [ ] Sign up new user
- [ ] Log out and log back in
- [ ] Try accessing app without auth
- [ ] Verify token expiration handling

### Future: Automated Testing

```typescript
// Example unit test
import { formatTime } from '@/lib/utils';

describe('formatTime', () => {
  it('formats seconds to HH:MM:SS', () => {
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('handles zero seconds', () => {
    expect(formatTime(0)).toBe('00:00:00');
  });
});
```

---

## Deployment

### Vercel Deployment (Recommended)

1. **Connect repository to Vercel:**
   - Sign up at [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Vercel auto-detects Next.js

2. **Set environment variables:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`

3. **Deploy:**
   ```bash
   # Automatic on git push to main
   git push origin main
   
   # Or manual deploy
   vercel --prod
   ```

### Environment Variables

Required for production:
```env
NEXT_PUBLIC_XANO_API_URL=https://your-workspace.xano.io/api:main
NEXT_PUBLIC_XANO_AUTH_TOKEN=your-production-token
```

---

## Contributing Guidelines

1. **Code Style**: Follow existing patterns
2. **TypeScript**: Properly type everything
3. **Documentation**: Update relevant docs
4. **Testing**: Manually test all changes
5. **Commits**: Use conventional commits
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code improvements
   - `chore:` for maintenance

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Xano Documentation](https://docs.xano.com)

---

**Last Updated**: October 1, 2025
