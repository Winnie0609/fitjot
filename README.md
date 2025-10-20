<div align="center">
  <img src="public/images/logo_black.png" alt="Desktop Mockup" width="200"/>
  <p>
    FitJot is a fitness tracking application designed for simplicity and focus.</br>
    We combine workout logging, body composition tracking, and progress visualization while making it easy for everyone to use.
  </p>
</div>

<img width="1351" height="558" alt="screenshot-landing" src="public/images/screenshot-landing.png" />

<div align="center">
  <p>💪 As simple as a notebook, but more powerful than a spreadsheet.</br>
  🔄 A perfect alternative to overly complex fitness apps.</br>
  🌐 https://fitjot.vercel.app
</p>
</div>

---

<details>
<summary>Table of Contents</summary>

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Design](#architecture-design)
- [Testing Strategy](#testing-strategy)
- [Performance & UX](#performance--ux)
- [Roadmap](#roadmap)
- [Project Structure](#project-structure)

</details>

[繁體中文](README.zh-TW.md)

## Features

- **Workout Sessions Management**: Log exercises, sets, weight, and RPE.
- **InBody Data Tracking**: Track changes in weight, body fat percentage, and skeletal muscle mass.
- **800+ Exercise Database**: Integrated with [wrkout/exercises.json](https://github.com/wrkout/exercises.json).
- **Real-time Data Sync**: Utilizes Firebase Firestore with a React Query caching strategy for a responsive UI.

</br>
</br>
</br>

<div align="center">
  <img src="public/images/mock-desktop.png" alt="Desktop Mockup" width="400"/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/images/mock-mobile.gif" alt="Mobile Mockup" width="150"/>
</div>

## Tech Stack

- **Frontend**:
  - Built with **Next.js 15** and **React 19** for a modern, server-first architecture using the App Router.
  - The codebase is fully typed with **TypeScript**.
  - Server state and caching are efficiently managed by **TanStack React Query** v5.
- **UI and Styling**:
  - Styled with **Tailwind CSS** v4 and a component library built using **shadcn/ui**.
  - Forms are handled with **React Hook Form** and validated against **Zod schemas**.
- **Backend & Deployment**:
  - Leverages **Firebase** for authentication (Email/Password, Google OAuth) and as a NoSQL database (Firestore).
  - Continuous deployment is automated through **Vercel**, deploying on every `git push` to the main branch.
- **Testing & Tooling**:
  - The project maintains high quality with a comprehensive testing suite, including **Vitest for unit/integration tests** and **Playwright for end-to-end tests**.
  - Code consistency is enforced by **ESLint**, and packages are managed with **pnpm**.

## Architecture Design

```
┌─────────────────────────────────────────────────┐
│  Vercel Edge/Serverless (Server Components)     │
│  ┌───────────────────────────────────────────┐  │
│  │ app/layout.tsx                            │  │
│  │  → Metadata                               │  │
│  │                                           │  │
│  │ app/workout/page.tsx                      │  │
│  │  → await getExercises()                   │  │
│  │  → 800+ exercises prefetched on server    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
              │ HTML + Serialized Data
              ▼
┌─────────────────────────────────────────────────┐
│  Client (Browser) - Client Components           │
│  ┌───────────────────────────────────────────┐  │
│  │ React Query + Context                     │  │
│  │  → Workout Sessions (user data)           │  │
│  │  → InBody Records                         │  │
│  │  → Auth State (Firebase)                  │  │
│  │                                           │  │
│  │ Interactive Components                    │  │
│  │  → SessionForm (React Hook Form)          │  │
│  │  → InBodyForm (React Hook Form)           │  │
│  │  → Dashboard (React Query)                │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
              │ Firestore SDK
              ▼
┌─────────────────────────────────────────────────────┐
│  Firebase Backend                                   │
│  - Authentication (Email + Google OAuth)            │
│  - Firestore (access controlled by Security Rules)  │
│  - Collections: users, workout_sessions,            │
│                 in_body_data, exercises             │
└─────────────────────────────────────────────────────┘
```

## Testing Strategy

```
        E2E (Playwright)
       ┌──────────────┐
       │   3 Flows    │  Auth, Workout CRUD, InBody CRUD
       └──────────────┘
     ┌──────────────────┐
     │   Integration    │  DB layer testing with Firebase Emulator
     └──────────────────┘
   ┌──────────────────────┐
   │      Unit Tests      │  React Testing Library + Vitest
   └──────────────────────┘
```

### E2E Test Coverage

| Scenario       | File                  | Covered Features             |
| -------------- | --------------------- | ---------------------------- |
| Authentication | `e2e/auth.spec.ts`    | Login, logout, redirect      |
| Workout CRUD   | `e2e/workout.spec.ts` | Create, edit, delete session |
| InBody CRUD    | `e2e/inbody.spec.ts`  | Create, edit, delete record  |

### Running Tests

```bash
# Unit Tests
pnpm test:unit

# Integration Tests (requires Firebase Emulator)
pnpm test:int

# E2E Tests
pnpm playwright test
```

## Performance & UX

### Implemented Optimizations

- **Dynamic Imports**: Large components like `InBodyForm` and `SessionForm` are lazy-loaded on interaction to reduce the initial JavaScript bundle size.
- **Font Optimization**: Utilizes `next/font` to self-host fonts, preventing layout shifts and eliminating network requests to Google Fonts.
- **Server-Side Data Fetching**: Static data, such as the extensive exercise list, is pre-fetched on the server. This ensures the data is included in the initial HTML, preventing client-side data fetching waterfalls and improving load times.
- **Auth Persistence**: User authentication state is persisted in local storage, allowing users to stay logged in after closing the browser.

---

## Roadmap

- [ ] GitHub Actions CI (pre-deploy testing)
- [ ] Core Web Vitals monitoring and optimization report
- [ ] Sentry error monitoring integration
- [ ] Data visualization charts (e.g., Recharts)
- [ ] PWA support (Service Worker + Manifest)
- [ ] Full offline support (Firestore Persistence)
- [ ] Custom user-defined exercises
- [ ] In-workout timer and tools
- [ ] AI-driven training suggestions based on historical data
- [ ] Dark Theme
- [ ] Internationalization (i18n) support

## Project Structure

```
workout-log/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (Server Component)
│   ├── page.tsx            # Dashboard (Client)
│   ├── workout/page.tsx    # Workout page (Server + Client)
│   ├── inbody/page.tsx     # InBody page (Client)
│   ├── login/page.tsx      # Login page
│   ├── signup/page.tsx     # Signup page
│   └── forgot-password/    # Password reset page
├── components/             # React components
│   ├── __tests__/          # Component tests (Unit)
│   ├── ui/                 # shadcn/ui components
│   ├── SessionForm.tsx     # Workout session form
│   ├── InBodyForm.tsx      # InBody data form
│   ├── Dashboard.tsx       # Main dashboard
│   ├── WorkoutDashboard.tsx        # Workout management
│   ├── WorkoutHistoryTable.tsx     # Workout history list
│   └── InBodyHistoryTable.tsx      # InBody records list
├── lib/                    # Utilities & contexts
│   ├── __tests__/          # Integration tests
│   ├── firebase.ts         # Firebase config
│   ├── db.ts               # Firestore operations
│   ├── AuthContext.tsx     # Auth state
│   ├── AppDataContext.tsx  # React Query wrapper
│   ├── types.ts            # TypeScript types
│   └── summary.ts          # Data computation utilities
├── e2e/                    # Playwright tests
│   ├── auth.spec.ts        # Authentication E2E
│   ├── workout.spec.ts     # Workout CRUD E2E
│   └── inbody.spec.ts      # InBody CRUD E2E
```

---

Built with ❤️ using Next.js 15, React 19, and Firebase
