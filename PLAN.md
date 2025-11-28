# React Native Mirror Plan

## Source Web App Snapshot
- Framework: Next.js App Router + Tailwind (`game-rental` root).
- Core capabilities: Cappuccino auth, dashboards, CRUD for games/rentals/users/clients, client-aware rentals UI, shared Cappuccino SDK wrapper in `src/lib/cappuccino`.
- Data dependencies: API base + key from `tenant-config.ts`, collections `games`, `clients`, `rentals`, `users` accessed through Cappuccino client.

## Objectives
1. Ship a React Native app (`game-rental-app`) that mirrors the feature set of the existing web client.
2. Reuse Cappuccino SDK logic (auth, collections) where practical, or implement equivalent API bindings.
3. Preserve UX flows: login gate → dashboard summary → tabbed CRUD modules.
4. Ensure app runs against the same local Cappuccino API defaults but allows overrides via `.env`.

## Work Breakdown

### 1. Project Bootstrap
- Initialize React Native project (Expo or bare RN + TypeScript); prefer Expo for speed unless native modules conflict with Cappuccino SDK needs.
- Configure TypeScript, ESLint, Prettier consistent with `game-rental` conventions.
- Set up absolute import aliases mirroring `src/lib` structure for parity.

### 2. Cappuccino Client Layer
- Port `src/lib/cappuccino/config.ts` and `tenant-config.ts` concept into `src/lib/cappuccino` for RN.
- Implement secure token storage (e.g., `expo-secure-store` or AsyncStorage fallback) replicating `BrowserTokenStorage` behavior.
- Mirror API client helpers (fetch wrappers, error handling, snapshot mapping) to support collections, users, uploads.

### 3. Auth & Navigation Shell
- Create global providers (CappuccinoProvider, AuthContext) similar to `src/app/providers.tsx`.
- Build guarded navigation tree (React Navigation) with public `(auth)` stack and protected tabs/drawers (Dashboard, Games, Rentals, Users, Clients, Settings).
- Implement login screen replicating existing validations and error messaging.

### 4. Feature Screens
- **Dashboard**: summary cards + last rentals list, reusing memoized mapping logic for client/game names.
- **Games CRUD**: list view with create/edit modal; align fields with web form (title, platform, price, status).
- **Clients CRUD**: manage client documents identical to `clients` page (name, phone, email, address, document ID).
- **Rentals**: split-screen UX adjusted for mobile—client picker plus rental form; ensure records store `client_name`/`game_title` for friendly display.
- **Users**: list and role badges; include invite/creation flow as in web counterpart if available.

### 5. Cross-Cutting Concerns
- Theme + design tokens: adapt Tailwind styles to RN components (spacing, colors, typography).
- Form handling: adopt `react-hook-form` or controlled components with validation matching web rules.
- Networking: centralize loading + error states, add optimistic updates where safe.
- Offline considerations: basic retry/backoff for mobile network conditions.

### 6. Tooling & Delivery
- Scripts: `expo start`, `expo run:ios`, `expo run:android`, lint/test commands.
- Testing: write unit tests for client helpers and component tests for key screens (Jest/React Native Testing Library).
- CI hooks (optional): align with existing project pipeline if required.

### 7. Stretch Items
- Push notifications for overdue rentals.
- Camera/file upload integration for client avatars or rental receipts.
- Deep linking to specific collections (e.g., `game-rental://rentals/123`).

## Immediate Next Steps
1. Decide between Expo vs bare RN (default to Expo unless native SDK constraints emerge).
2. Run `npx create-expo-app game-rental-app -t expo-template-blank-typescript` (or equivalent) inside repo root.
3. Port Cappuccino config + client scaffolding into new app structure per sections above.
