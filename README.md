# UTM Campaign Tracker

A GA4-compliant UTM link builder and campaign database for marketing teams. Built with Next.js, Tailwind CSS, and Supabase.

## Features

- **UTM Generator** — Build GA4-compliant UTM links with validation and live preview
- **Bulk Generator** — Generate multiple UTM links at once via CSV-style input
- **Campaign Database** — Shared team database with search, filter, and pagination
- **CSV Export** — Export your campaign links to CSV
- **GA4 Naming Guide** — Built-in reference for UTM naming conventions
- **Name Tagging** — Each link is tagged with the team member who created it

---

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Supabase](https://supabase.com) account and project

---

## 1. Supabase Setup

### Create the database table

In your Supabase project, go to **SQL Editor** and run:

```sql
create table utm_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by text not null,
  brand text not null,
  campaign_type text not null,
  campaign_name text not null,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  utm_content text not null,
  utm_term text,
  base_url text not null,
  full_utm_url text not null,
  campaign_status text not null default 'active',
  notes text,
  tags text
);

-- Enable Row Level Security
alter table utm_links enable row level security;

-- Allow all operations for anonymous users (adjust as needed for your team)
create policy "Allow all" on utm_links for all using (true) with check (true);
```

### Get your API credentials

1. Go to your Supabase project → **Settings** → **API**
2. Copy your **Project URL** and **anon public** key

---

## 2. Local Development

```bash
# Clone the repo
git clone <your-repo-url>
cd utm-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Supabase credentials

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Deploy to Vercel

### Option A — Vercel Dashboard (recommended)

1. Push this repository to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository
3. Under **Environment Variables**, add:
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
4. Click **Deploy**

Vercel will automatically detect Next.js and use the settings in `vercel.json`.

### Option B — Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link and deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous API key |

These are prefixed with `NEXT_PUBLIC_` and are safe to expose in the browser — they are scoped by Row Level Security in Supabase.

---

## Project Structure

```
utm-tracker/
├── app/
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main app page
├── components/
│   ├── Header.tsx          # Top navigation bar
│   ├── WelcomeModal.tsx    # Name capture on first visit
│   ├── UTMForm.tsx         # Single UTM generator form
│   ├── LivePreview.tsx     # Real-time UTM URL preview
│   ├── BulkGenerator.tsx   # Bulk UTM generation
│   ├── CampaignDatabase.tsx # Shared campaign database
│   └── NamingGuide.tsx     # GA4 naming convention reference
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── utm-utils.ts        # UTM building utilities
├── .env.example            # Environment variable template
└── vercel.json             # Vercel deployment config
```

---

## Tech Stack

- [Next.js 16](https://nextjs.org) — React framework
- [Tailwind CSS 4](https://tailwindcss.com) — Styling
- [Supabase](https://supabase.com) — PostgreSQL database + API
- [TypeScript](https://www.typescriptlang.org) — Type safety
