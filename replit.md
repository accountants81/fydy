# أرشيف الضرائب — Tax Archive

A full-featured Arabic-language tax customer archive management app. All data is stored locally in the browser's `localStorage` — no backend database required for the frontend.

## Project Structure

This is a **pnpm monorepo** with two registered artifacts:

| Artifact | Dir | Purpose |
|---|---|---|
| `أرشيف الضرائب` (web) | `artifacts/tax-archive` | React + Vite frontend — the main app |
| `API Server` (api) | `artifacts/api-server` | Express + TypeScript backend (optional AI features) |

## Running Locally

```bash
# Start everything
pnpm install
# Frontend only
pnpm --filter @workspace/tax-archive run dev
# API server only
pnpm --filter @workspace/api-server run dev
```

Both are managed by Replit workflows — see the configured workflows in the Replit UI.

## Frontend App (artifacts/tax-archive)

**Stack:** React 18, TypeScript, Vite, Tailwind CSS (with custom Arabic RTL layout)

**Key views:**
- `DashboardView` — stats overview, city breakdown, upcoming reminders, top customers by buildings
- `CustomerManagementView` — CRUD for customers, bulk actions, CSV export, color filters, detail modal
- `RemindersView` — tax deadlines & reminders with priority, due dates, done state
- `RecycleBinView` — soft-deleted customers with restore/permanent-delete
- `BackupView` — export/import full JSON backup (customers + trash + reminders)
- `SettingsView` — password change, reset all data
- `ChatbotView` — AI assistant (uses API server)
- `LoginView` — password-protected login

**Data model** (`src/types.ts`):
- `Customer` — fullName, mobile, nationalId, password, city, buildingsCount, gender, altNumbers, declarationLink, color, notes, serial, addedAt, lastEditedAt
- `Reminder` — title, description, dueDate (YYYY-MM-DD), priority (high/medium/low), done, createdAt

**localStorage keys:**
- `tax_customers` — Customer[]
- `tax_trash` — Customer[] (soft-deleted)
- `tax_reminders` — Reminder[]
- `tax_admin_password` — string (default: `A12026`)
- `tax_theme` — `"light"` | `"dark"`
- `tax_is_logged_in` — `"true"` | `"false"`
- `tax_show_counts` — `"true"` | `"false"`

**Important bug fixes baked in:**
1. All `useEffect` persist hooks are guarded by `isAppLoading` to prevent wiping saved data on first mount.
2. `deleteCustomer`/`restoreCustomer` use independent `setCustomers`/`setTrash` calls (not nested) to avoid StrictMode double-invocation duplicates.
3. Animation classes in `index.css` do NOT use `forwards` fill-mode (would trap `position:fixed` modals in stacking contexts).
4. `normalizeData` / `dedupeById` helpers self-heal pre-existing duplicate-id records on every boot.

## API Server (artifacts/api-server)

**Stack:** Node.js, Express, TypeScript, pino logging

**Vercel deployment:**  
- Set Root Directory = `artifacts/api-server` in Vercel dashboard  
- Framework = Other  
- The `vercel.json` sets buildCommand to `pnpm run typecheck` (avoids running the esbuild script meant for Replit only)  
- `api/index.ts` exports the Express app as a serverless function entrypoint

## User Preferences

- Default theme: dark
- UI language: Arabic (RTL)
- All user-facing text is Arabic
- Preferred color scheme: violet/purple accent with slate neutrals
