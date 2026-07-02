# GiftWise — Planning Document

## Concept
Personal gift management platform: manage gifts per recipient, build wishlists,
and track prices across Cyprus and Greek e-commerce sites automatically.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind CSS + Recharts |
| Database & Auth | Supabase (PostgreSQL + Auth + Edge Functions + Realtime) |
| Scraping | Firecrawl + Apify Skroutz Scraper + custom Python scrapers |
| Cron | Supabase pg_cron + pg_net |
| Notifications | Resend (email) + Web Push API |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Core Features
1. Recipient management (people you buy gifts for, with budget, birthday)
2. Wishlist system (multiple wishlists per recipient, shareable links)
3. Price tracker (Skroutz.gr/cy + individual CY store scrapers)
4. Notifications (price drop alerts, birthday reminders)
5. Social (claim system, group gifting)

## Tracked Stores (Cyprus + Greece)
| Store | URL | Platform | Scraper |
|---|---|---|---|
| Skroutz.cy | skroutz.cy | Aggregator | Apify API |
| Skroutz.gr | skroutz.gr | Aggregator | Apify API |
| Stephanis | stephanis.com.cy | Custom | Custom parser |
| Superhome Center | superhomecenter.com.cy | Custom | Playwright |
| Electroline | electroline.com.cy | WooCommerce | wp-json API |
| Beauty Bar | beautybar.com.cy | Shopify | /products.json |
| Bionic | bionic.com.cy | Custom | Custom parser |
| Cablenet | cablenet.com.cy | WooCommerce | wp-json API |

## Development Phases
| Phase | Duration | Deliverables |
|---|---|---|
| 1 — Foundation | Week 1-2 | Supabase setup, schema, auth, recipient CRUD |
| 2 — Wishlist Core | Week 2-3 | Wishlist CRUD, add product by URL, item mgmt |
| 3 — Price Tracker | Week 3-5 | Skroutz integration, CY scrapers, price history |
| 4 — Notifications | Week 5-6 | Price drop emails, in-app alerts, digest |
| 5 — Social | Week 6-7 | Shareable links, claim system, group gifting |
| 6 — Polish | Week 7-8 | Dark mode, mobile nav, PDF export, deployment |

## Routes
```
/                        Dashboard
/recipients              List of people
/recipients/[id]         Person profile
/wishlists               All wishlists
/wishlists/[id]          Wishlist detail
/wishlists/[id]/share    Public shareable view (no login)
/tracker                 Price tracker dashboard
/tracker/[itemId]        Item detail + price history chart
/add                     Quick add product by URL
/settings                Notification preferences
```
