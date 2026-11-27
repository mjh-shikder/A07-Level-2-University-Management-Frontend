# UniManage — University Management Frontend

A full-featured, role-based University Management Portal built with **Next.js 16 (App Router, Turbopack)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**, integrated with the **University Management Backend** REST API and **Stripe Checkout**.

---

## 1. Project Overview

**UniManage** unifies university academic and financial operations across four user experiences:

- **Public Portal:** University overview, about page, searchable academic programs catalog, tuition FAQ, and admissions contact inquiry form.
- **Admin Portal (`/admin/*`):** System overview dashboard with charts, user management (roles/statuses/creation), departments, academic programs, courses & prerequisite graph, semester lifecycle management (`UPCOMING -> ACTIVE -> COMPLETED`), multi-step section scheduling wizard, tuition invoice generation, and filterable audit logs with before/after JSON snapshots.
- **Instructor Portal (`/instructor/*`):** Assigned sections & weekly teaching schedule, searchable/printable/CSV-exportable student rosters, daily bulk attendance marking with optimistic updates, exam & weight configuration (totaling 100%), marks entry grid, and draft grade computation.
- **Student Portal (`/student/*`):** Active-semester dashboard with cumulative CGPA badge and urgent unpaid tuition banners, course registration (with live seat capacity & 18-credit limit gauge), enrolled courses & drop flow, attendance rates & logs, published semester results, printable official academic transcript, and Stripe Checkout tuition billing.

---

## 2. Tech Stack

- **Framework:** Next.js `16.4.6` (App Router, Turbopack, `cacheComponents`, `partialPrefetching`, `proxy.ts`)
- **UI Runtime:** React `19.3.0`, TypeScript `^5` (strict mode)
- **Styling & Components:** Tailwind CSS `4.3.3`, shadcn/ui (`radix-ui`), Lucide Icons, `next-themes` (dark-first glassmorphism with Deep Emerald accent)
- **Data Fetching & State:** TanStack Query `^5.108.4` (client mutations/queries), Zustand `^5.1.0` (session state), Server Components (`serverApiFetch`)
- **Forms & Validation:** React Hook Form `^7.92.0`, Zod `^4.6.7`, `@hookform/resolvers`
- **Charts, Notifications & Dates:** Recharts `^3.11.0`, Sonner `^2.0.8`, `date-fns` `^4.4.0`
- **Linting & Formatting:** Biome `^2.6.9`
- **Package Manager:** `pnpm@12.15.0`

---

## 3. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Base URL for server-side fetches AND Next.js /api/backend/* proxy rewrites (no trailing slash)
BACKEND_INTERNAL_URL=http://localhost:5000/api/v1

# Public backend URL reference
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# Stripe publishable key (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder_key

# Frontend public URL (used for metadataBase and Stripe return URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** After changing `BACKEND_INTERNAL_URL` in `.env.local`, restart `pnpm dev` (or rebuild) so `next.config.ts` updates the `/api/backend/:path*` rewrite rule.

---

## 4. Getting Started & Verification Commands

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Run Biome linter
pnpm lint

# Run TypeScript type checker
pnpm tsc --noEmit

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 5. Demo Credentials & One-Click Demo Logins

The `/login` page includes **One-Click Demo Login** buttons for all three roles:

| Role | Email | Password | Portal Root |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@university.edu` | `Admin1234!` | `/admin` |
| **Instructor** | `dr.smith@university.edu` | `Instructor123!` | `/instructor` |
| **Student** | `student1@university.edu` | `Student123!` | `/student` |

---

## 6. Complete Route Breakdown (35 Routes)

### Public & Auth Routes (7)
- `/` — University landing page & statistics
- `/about` — Institution mission & leadership overview
- `/programs` — Searchable academic programs catalog
- `/tuition-faq` — Tuition, billing, and academic policy FAQ
- `/contact` — Admissions contact & inquiry form
- `/login` — Sign in with RHF/Zod, 429 countdown, and One-Click Demo Logins
- `/register` — Self-registration with role selection

### Admin Portal Routes (11)
- `/admin` — Admin Dashboard overview (StatCards, Recharts, recent audit logs)
- `/admin/users` — User management, role/status updates, and account creation
- `/admin/departments` — Department CRUD
- `/admin/programs` — Academic program CRUD
- `/admin/courses` — Course catalog CRUD
- `/admin/courses/[id]` — Course details & prerequisite management
- `/admin/semesters` — Semester CRUD & status transitions (`UPCOMING -> ACTIVE -> COMPLETED`)
- `/admin/sections` — Section scheduling & 3-step section creation wizard
- `/admin/invoices` — Student tuition invoice generation & status filtering
- `/admin/audit-logs` — Searchable system audit trail with before/after JSON diff modal
- `/admin/profile` — Profile info & change password

### Instructor Portal Routes (7)
- `/instructor` — Instructor Dashboard (assigned sections & weekly teaching schedule)
- `/instructor/profile` — Profile info & change password
- `/instructor/sections/[sectionId]/students` — Section student roster with search, CSV export & print
- `/instructor/sections/[sectionId]/attendance` — Daily bulk attendance sheet with optimistic updates
- `/instructor/sections/[sectionId]/exams` — Exam configuration & 100% weight allocation
- `/instructor/sections/[sectionId]/marks` — Marks entry grid & draft grade computation
- `/instructor/sections/[sectionId]/results` — Section gradebook & draft results review

### Student Portal & Stripe Payment Routes (10)
- `/student` — Student Dashboard (active courses, weekly schedule, CGPA badge, unpaid invoice alert)
- `/student/registration` — Course registration catalog with capacity bars & 18-credit limit gauge
- `/student/courses` — Active & past enrolled courses with drop confirmation dialog
- `/student/attendance` — Per-course attendance percentages & dated session logs
- `/student/results` — Published semester letter grades & grade points
- `/student/transcript` — Printable Official Academic Transcript with SGPA & CGPA
- `/student/billing` — Tuition invoices & live Stripe Checkout initiation (`POST /invoices/:id/pay`)
- `/student/profile` — Profile info & change password
- `/payments/success` — Stripe Checkout return verification (polls real invoice status from backend)
- `/payments/cancel` — Stripe Checkout cancellation return page

---

## 7. Architecture Highlights

- **First-Party `httpOnly` Cookie Auth:** Browser requests call `/api/backend/*`, which `next.config.ts` rewrites to `BACKEND_INTERNAL_URL`, keeping `accessToken` and `refreshToken` cookies strictly `httpOnly` with deduplicated 401 refresh handling (`lib/api.ts` & `lib/api-server.ts`).
- **Role-Based Route Guard (`proxy.ts`):** Enforces `ADMIN`, `INSTRUCTOR`, and `STUDENT` access at the request boundary.
- **SEO & Responsive UI:** All routes export `title`, `description`, and OpenGraph metadata (`lib/metadata.ts`); mobile viewports include collapsible drawer navigation and horizontally scrollable tables with touch hints.
