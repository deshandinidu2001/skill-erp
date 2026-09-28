# Skill Engineering ERP

Skill Engineering ERP is a modern workspace for construction and engineering teams. It brings sales, project delivery, purchasing, people, finance, fleet, and reporting into one responsive web application.

## Features

| Module | Capabilities |
| --- | --- |
| Dashboard | Operational overview of pipeline, projects, stock activity, and reports |
| Marketing and QS | Lead management, estimates, and BOQ import |
| Quotations and projects | Quotations, project records, progress tracking, and activity history |
| Stock and purchasing | Inventory, suppliers, requests, purchase orders, and goods receipts |
| HR and fleet | Employees, attendance, payroll, vehicles, fuel, and maintenance |
| Accounting and reports | Ledgers, payments, cash book, debtors, profit and loss, and reports |
| Administration | User roles, permissions, master data, and audit views |

The application adjusts navigation by role and includes a token-based client portal for sharing project information.

## Technology

- Next.js 14 with the App Router
- React 18 and TypeScript
- Tailwind CSS 4
- NextAuth for demo-role sessions
- Supabase for application data
- TanStack Query and TanStack Table

## Run locally

You need Node.js 20 or newer, npm, and access to a Supabase project prepared for this application.

```bash
git clone https://github.com/deshandinidu2001/skill-erp.git
cd skill-erp
npm ci
```

Create `.env.local` in the project root:

```dotenv
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then choose a demo role to enter the workspace.

## Data and demo access

The selectable roles are for demonstrating screens and permission-aware navigation. They are not a production authentication system.

Dashboard values come from the connected Supabase project. If the project URL is unreachable, the dashboard shows an unavailable-data message. If the project has no records, lists remain empty. Keep `.env.local` and all database keys private; they are already excluded from Git.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Check TypeScript types |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |

## Project structure

```text
app/           Pages, layouts, and API routes
components/    Shared interface components and feature views
services/api/  Server-side data operations
lib/           Authentication, permissions, and utilities
scripts/       Development utilities
```

## Contributing

Issues and pull requests are welcome. Before opening a pull request, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Do not commit `.env.local`, credentials, or generated `.next` files.
