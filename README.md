# Thikaana Coaching ERP

A sellable demo of a coaching / tuition-centre management product — for home tutors,
small tuition centres, and IIT-JEE / NEET / SSC coaching institutes.

Single-page React app, **no backend**. All data lives in the browser's `localStorage`
and is seeded from a realistic demo dataset on first load. Everything reads/writes
through `src/lib/db.ts`, which is the intended swap seam for a real API + PostgreSQL
layer later.

## Run locally

```bash
cd app
npm install
npm run dev        # http://localhost:8130
```

## Demo logins

| Role | Username | Password | Lands on |
|------|----------|----------|----------|
| Super Admin (Thikaana) | `superadmin` | `super123` | Platform console — institutes, subscriptions, billing, support |
| Institute Owner | `owner` | `owner123` | Full coaching-centre admin |
| Staff / Teacher | `teacher` | `teacher123` | Attendance, fees, classes (limited) |
| Accountant | `accountant` | `account123` | Fees & receipts only |
| Student | `student` | `student123` | Student portal |
| Parent | `parent` | `parent123` | Parent portal |

Reset the demo data any time from **Owner → System → Settings → Reset demo data**.

## What's inside

- **Students** — profiles, guardians, documents, per-student fee / attendance / results tabs
- **Courses & Batches** — programs, fee structure, morning/evening/weekend batches with capacity
- **Fees** — installment invoices, collect payment, printable receipts, WhatsApp/email (simulated), due-alert buckets
- **Attendance** — mark present/absent/late per batch, batch reports
- **Exams** — schedule tests, enter marks, ranks, subject-wise analysis
- **Homework / Study Materials / Timetable**
- **Communication Center** — WhatsApp/SMS/email broadcasts (simulated), history
- **Staff** — directory + staff attendance
- **Reports** — financial, student performance, growth
- **Advanced (Phase 2, off by default)** — AI Insights, Online Classes, ID Cards, Doubt Box
- **Admin** — module switches (with dependency graph), users, roles & permissions, settings, audit log
- **Student portal** — attendance, fees, subjects, results, homework, materials, timetable
- **Parent portal** — child fee status, attendance, progress
- **Super Admin platform console** — coaching accounts, subscription plans (₹499 / ₹999 / ₹1999), platform billing, support tickets

### Module engine

`src/lib/modules.ts` defines every capability, its category and its `dependsOn`
graph. A module can't be enabled until its dependencies are, and can't be disabled
while something enabled still needs it. This is what lets the same product fit a
home tutor (Students + Fees only) and a large coaching centre (everything on).

## Stack

React 18 · TypeScript · Vite · Tailwind · React Router (HashRouter) · lucide-react.
Mobile-first and fully responsive.

## Deploy (GitHub Pages, project site)

`app/vite.config.ts` uses `base: '/thikaana-coaching-erp/'` for production builds.
The build is emitted to `dist-site/` and the `index.html` + `assets/` copied to the
repo root (committed) so Pages can serve it from the root of the branch:

```bash
cd app && npm run build
cd .. && rm -rf assets && cp -r dist-site/assets assets && cp dist-site/index.html index.html
```
