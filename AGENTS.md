<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:University Management Fronted -->
# University Management Frontend: Agent Rules

Frontend for the University Management Backend. Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4, pnpm.

## Source of truth
- Backend docs live in `docs/backend-handoff/` and are READ-ONLY: API_CONTRACT.md, AUTH_AND_RBAC.md, BUSINESS_RULES.md, CONVENTIONS.md, DATA_MODELS.md, UI_MAP.md, GAPS_AND_RISKS.md, openapi.yaml.
- Typed API shapes live in `types/api.ts`.
- Use ONLY endpoints, fields, enums and error messages described in those docs. Never invent an endpoint, field, status code or permission.
- If the docs are ambiguous or contradict the real backend behavior, stop and report it. Do not guess.

## Roles (exactly 3)
- ADMIN (company template calls it "Admin")
- INSTRUCTOR (template: "Provider")
- STUDENT (template: "User")
Enforce at route level (`proxy.ts`) AND UI level (hide or disable by role and by record status). The backend remains the real authority.

## Next.js 16 specifics
- Use `proxy.ts`, NOT `middleware.ts`.
- `params`, `searchParams`, `cookies()` and `headers()` are async. Always `await` them.
- When unsure, check `node_modules/next/dist/docs` or the official docs. Do not rely on older Next.js habits.

## Architecture rules
1. Server Components by default. Add `"use client"` only for state, effects, browser APIs or event handlers. Keep client islands small and pass data down as props.
2. List and detail pages fetch on the server (cookies forwarded) and read filters from `searchParams`.
3. All mutations and interactive widgets use TanStack Query on the client. After a mutation: invalidate queries and call `router.refresh()` where server-fetched data is on screen.
4. Every data-fetching page has `loading.tsx` (skeleton, never a spinner), a meaningful empty state, and an error path (`error.tsx` plus a Sonner toast).
5. Route groups: `(public)`, `(auth)`, `(admin)`, `(instructor)`, `(student)`.
6. Folder layout (no `src/`): `app/`, `components/ui` (shadcn), `components/shared`, `components/<feature>`, `lib/`, `hooks/`, `stores/`, `types/`, `providers/`.

## Auth and API rules
- The backend uses httpOnly cookies (`accessToken`, `refreshToken`). Tokens are NEVER stored in localStorage or exposed to client JS.
- The browser talks only to the Next.js origin. Browser calls go through a Next.js proxy (rewrite or route handler, for example `/api/backend/*` → backend `/api/v1/*`), and `Set-Cookie` must pass through. Server-side fetches call `BACKEND_INTERNAL_URL` directly with the cookie header forwarded.
- Access tokens last about 15 minutes. On 401: refresh once, retry the original request once, and on failure redirect to `/login?next=<path>`. This applies to both client calls and server-component calls.
- One typed `apiFetch<T>()` for server and one for client. Both parse the envelope `{ success, message, data, meta?, errors? }` and throw a typed `ApiError` (status, message, field errors).
- Always send `order` for sorting. NEVER send `sortOrder`.
- Map backend `errors[].field` to form fields by stripping the `body.` / `query.` prefix.
- Handle 429: read `Retry-After`, disable the submit button, and show a countdown.
- Show backend business-rule errors (enrollment, drop, publish, and so on) as human-friendly toasts or inline alerts. `BUSINESS_RULES.md` is the reference.

## Forms
- React Hook Form + Zod (`@hookform/resolvers`) for ALL forms.
- Zod schemas mirror backend validation (lengths, ranges, enums, date `YYYY-MM-DD`, time `HH:mm`).
- Real-time, human-readable validation messages.

## URL state
All filters, search, sorting and pagination live in the URL (`?page=2&status=active&q=...`). Debounce search input. Views must be shareable and bookmarkable.

## Data and formatting
- Money via `Intl.NumberFormat`. Dates through ONE date helper. Normalize API decimals (number or numeric string) in ONE place.
- Never display soft-deleted data (the backend already filters it).

## Payments
Stripe Checkout (test mode) via the backend `POST /invoices/:id/pay`. Handle initiation, redirect, `/payment/success` and `/payment/cancel`. The webhook is the source of truth, so the success page must confirm status from the real invoice/payment data. No manual or fake status updates.

## Code quality
- Strict TypeScript. NO `any`.
- No mock data, no hardcoded JSON, no lorem ipsum, no placeholder images. Use `next/image` for all images.
- Reusable components (DataTable, StatCard, StatusBadge, SearchInput, EmptyState, ConfirmDialog, PageHeader) and custom hooks (useAuth, useDebounce, usePagination, useUrlState). Never copy-paste UI.
- Public pages need Metadata API (title, description, Open Graph).
- Accessibility: labels, focus management in dialogs, keyboard navigation, AA contrast.
- Allowed libraries: shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, @hookform/resolvers, Sonner, Recharts, Lucide, date-fns, next-themes. Ask before adding anything else.
- File uploads are out of scope (no backend endpoint).

## Workflow
- One roadmap commit per session. Never implement later commits early.
- Before finishing a task run `pnpm lint`, `pnpm tsc --noEmit` and `pnpm build`, and fix every error.
- Verify against the real running backend and report exactly what was tested.
- Conventional commit messages (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`). The agent suggests the message but NEVER runs `git commit` or `git push`. I review and commit.
- If a backend gap blocks the work, report it. Do not work around it with fake data.
<!-- END:University Management Fronted -->