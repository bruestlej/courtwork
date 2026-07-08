# CourtWork 🏀

A lightweight, mobile-first web app for basketball trainers to build custom homework playlists with drag-and-drop video clips and assign them to clients.

## Tech Stack

| Service | Purpose |
|---------|---------|
| **Next.js 16** | App Router, Server Components, API routes |
| **Supabase** | Auth, Postgres database, video storage, RLS |
| **Vercel** | Hosting & deployment |
| **Stripe** | Pro subscription billing ($29/mo) |
| **PostHog** | Product analytics |
| **Resend** | Homework assignment email notifications |

## Features

- **Clip Library** — Upload training drill videos to Supabase Storage
- **Drag & Drop Playlists** — Build ordered homework sequences with touch-friendly reordering
- **Client Management** — Link athletes to your trainer account
- **Homework Assignments** — Send playlists with due dates and notes
- **Progress Tracking** — Clients mark drills complete; trainers see status
- **Email Notifications** — Clients receive homework links via Resend
- **Stripe Billing** — Pro plan for unlimited usage

## Getting Started

### 1. Clone & install

```bash
cd courtwork
npm install
cp .env.example .env.local
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order via the SQL editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_clips.sql`
   - `supabase/migrations/003_harden_rls.sql`
3. Create a Storage bucket named `clips` (private)
4. Apply the storage policies from `002_storage_clips.sql`
5. In **Authentication → URL Configuration**, set:
   - Site URL: your app URL (`http://localhost:3000` locally, production URL in prod)
   - Redirect URLs: `{APP_URL}/auth/callback`
6. Copy your project URL and keys to `.env.local`

### 3. Set up Stripe

1. Create a product "CourtWork Pro" at $29/month in [Stripe Dashboard](https://dashboard.stripe.com)
2. Copy the Price ID to `STRIPE_PRO_PRICE_ID`
3. Set up a webhook endpoint pointing to `/api/stripe/webhook` for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 4. Set up PostHog & Resend (optional)

- PostHog: Create a project and add `NEXT_PUBLIC_POSTHOG_KEY`
- Resend: Verify your domain and add `RESEND_API_KEY`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npx vercel
```

Add all environment variables from `.env.example` in the Vercel dashboard.

## User Roles

| Role | Access |
|------|--------|
| **Trainer** | Upload clips, build playlists, manage clients, assign homework |
| **Client** | View assigned homework, watch videos, mark drills complete |

Sign up and select your role on the registration page.

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated routes with bottom nav
│   │   ├── dashboard/  # Trainer home
│   │   ├── clips/      # Video library
│   │   ├── playlists/  # Drag-drop playlist builder
│   │   ├── clients/    # Client roster
│   │   ├── assignments/# Homework management
│   │   ├── homework/   # Client homework view
│   │   └── settings/   # Account & billing
│   ├── (auth)/         # Login & signup
│   └── api/            # Stripe webhooks, assignments
├── components/
│   ├── playlists/      # DnD playlist builder
│   ├── layout/         # Mobile nav, headers
│   └── ui/             # Button, Card, Input, etc.
├── lib/                # Supabase, Stripe, Resend, auth helpers
└── types/              # TypeScript interfaces
```

## License

MIT
