# Skill Engineering ERP

A web workspace for managing the day-to-day work of a construction and engineering business. It brings leads, estimates, projects, purchasing, people, vehicles, accounts, and reports into one interface.

> **Project status:** This repository uses selectable demo roles for sign-in. Screens and permissions can be explored locally, but business data comes from a configured Supabase project. The demo sign-in flow is not a production identity system.

## What is inside

| Area | What you can explore |
| --- | --- |
| Dashboard | Lead pipeline, active projects, stock requests, and recent work |
| Marketing and QS | Leads, estimates, and BOQ import |
| Quotations and projects | Quotations, project records, progress, and related activity |
| Stock | Items, suppliers, requests, purchase orders, goods receipts, and inventory |
| HR and vehicles | Employees, attendance, payroll, and vehicle records |
| Accounting and reports | Ledgers, payments, cash book, profit and loss, and operational reports |
| Administration | Users, roles, master data, and audit views |

The interface is responsive and shows navigation based on the selected role. A client portal is also available through token-based routes.

## Built with

Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 4, NextAuth, Supabase, TanStack Query, and TanStack Table.

## Run locally

**Prerequisites:** Node.js 20 or newer, npm, and a Supabase project containing the tables used by this app. See [`supabase-schema.sql`](supabase-schema.sql) for the schema reference.

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/deshandinidu2001/skill-erp.git
   cd skill-erp
   npm ci
   ```

2. Create a `.env.local` file in the project root:

   ```dotenv
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=replace-with-a-long-random-secret
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   Get the URL and keys from your Supabase project settings. Keep the service role key private; `.env.local` is ignored by Git. The Supabase URL must point to a reachable project.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and select a demo role.

### Where does dashboard data come from?

The dashboard reads live leads, projects, and stock requests from Supabase. If the project is unreachable, those figures appear as **Unavailable**. If it is reachable but has no records, the lists are empty. Selecting a demo role does not add data.

For a disposable development project, [`scripts/seed-supabase-mock.mjs`](scripts/seed-supabase-mock.mjs) contains sample records. Review the script before running it because it writes to the configured Supabase project and creates demo users.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Check TypeScript types |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |

## Repository layout

```text
app/              Pages, layouts, and API routes
components/       Shared UI and feature screens
services/api/     Server-side data operations
lib/              Authentication, permissions, and utilities
scripts/          Development utilities and sample-data script
supabase-schema.sql  Database schema reference
```

## Contributing

Open an issue to discuss a change or submit a pull request. Before opening a pull request, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. Do not commit `.env.local`, credentials, or generated `.next` files.
