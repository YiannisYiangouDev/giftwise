# 🎁 GiftWise

> Advanced gift guide app with wishlist management and live price tracking across Cyprus & Greece.

## Features
- 👥 **Recipient management** — track people, birthdays, budgets
- 🎀 **Wishlists** — multiple wishlists per person, shareable links, claim system
- 💰 **Price tracker** — monitors prices across Skroutz.cy, Skroutz.gr, and top CY stores
- 🔔 **Alerts** — email and browser push when price drops below your target
- 🎄 **Occasions** — birthday, Christmas, name day templates

## Tech Stack
- **Frontend**: Next.js 16 + Tailwind CSS + Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Scraping**: Firecrawl + Apify + Python/Playwright
- **Deployment**: Vercel + Supabase

## Project Structure
```
giftwise/
├── frontend/          # Next.js 16 app
├── scraper/           # Python price scraper service
├── supabase/          # DB migrations + Edge Functions
└── docs/              # Planning, architecture docs
```

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- Supabase account
- Vercel account (for deployment)

### Local Setup
```bash
# 1. Clone
git clone https://github.com/YiannisYiangouDev/giftwise.git
cd giftwise

# 2. Frontend
cd frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev   # → localhost:3000

# 3. Scraper
cd ../scraper
cp .env.example .env
pip install -r requirements.txt
python main.py
```

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Scraper (`scraper/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APPIFY_API_TOKEN=your_apify_token
FIRECRAWL_API_KEY=your_firecrawl_key
RESEND_API_KEY=your_resend_key
```

## GitHub Secrets (for CI/CD)
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
SUPABASE_PROJECT_REF
SUPABASE_ACCESS_TOKEN
```

## Docs
- [Planning](docs/PLANNING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)
