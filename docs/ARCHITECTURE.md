# System Architecture & Technical Specifications

**TOLAND (toland.pvt.ltd)** — Industrial Denim Jeans & Casual Apparel Manufacturer  
*Sheikhpura, Barbigha, Khetalpura 811101 (Bihar, India)*

---

## 1. Monorepo Topology

```
toland/
├── apps/
│   ├── web/                        # Next.js 14 (App Router) Storefront & Admin Portal
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/         # Auth pages (login, register, forgot-password)
│   │   │   │   ├── (store)/        # B2C & B2B Customer Storefront
│   │   │   │   ├── admin/          # Admin Control Center (ERP, CRM, Catalog, WhatsApp)
│   │   │   │   └── api/            # Route Handlers (Admin CRUD, WhatsApp bridge, Webhooks)
│   │   │   ├── components/         # Reusable UI & Layout Components
│   │   │   └── lib/                # Supabase SSR clients, query hooks, utilities
│   │   ├── public/                 # Static assets, branding logos, icons
│   │   └── tailwind.config.ts      # Forest Green tokens & responsive breakpoints
│   └── bridge/                     # Baileys WhatsApp Automation Service (Dockerized Node.js)
│       ├── src/
│       │   ├── db/                 # Direct PostgreSQL connection pool
│       │   ├── providers/          # Baileys socket & Cloud API providers
│       │   ├── services/           # Queue worker, rate limiter, anti-ban engine
│       │   └── routes.ts           # REST endpoints for health, send, QR status
│       ├── Dockerfile              # Production container build
│       └── docker-compose.yml       # Production orchestration with healthchecks
├── packages/
│   └── shared/                     # Shared TypeScript schemas, types, and constants
│       └── src/
│           ├── types/              # Database entities, ERP, CRM, WhatsApp types
│           └── schemas/            # Zod validation schemas
├── supabase/
│   ├── migrations/                 # PostgreSQL migrations (001 to 008)
│   ├── seed.sql                    # Staging seed data
│   └── config.toml                 # Local & CI Supabase configuration
├── tests/                          # Automated Node.js native test suites
│   ├── erp-bom-capacity.test.js    # BOM calculation & 5-stage yield simulation
│   ├── storefront-cart-gst.test.js # Indian GST slabs & cart calculations
│   └── whatsapp-antiban.test.js    # Anti-ban jitter, quiet hours, auto-reply matching
├── docs/                           # Enterprise SOPs and Operational Handbooks
└── .github/workflows/              # GitHub Actions CI/CD pipelines
```

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | 14.2.18 | Server-Side Rendering, Server Components, API routes |
| **Language & Typing** | TypeScript | 5.6.3 | Strict type enforcement across monorepo |
| **Styling & Design** | Tailwind CSS | 3.4.15 | Responsive layout with custom Forest Green palette |
| **Data Fetching & State** | TanStack React Query | 5.60.5 | Client caching, optimistic mutations, server revalidation |
| **Form Handling** | React Hook Form + Zod | 7.53 / 3.23 | Schema-based client and API payload validation |
| **Icons & UI** | Lucide React | 0.460.0 | Clean accessible iconography |
| **Database & Auth** | Supabase (PostgreSQL 15) | Managed | RLS security, Postgres triggers, Realtime events |
| **File Storage** | Supabase Storage | S3-Compatible | Direct uploads for product media, fabric specs, bills |
| **WhatsApp Engine** | @whiskeysockets/baileys | 6.7.9 | Headless multi-device socket connection to WhatsApp |
| **Hosting (Web)** | Vercel Edge & Serverless | Enterprise | Monorepo CI/CD deployment, global CDN, HTTPS |
| **Hosting (Bridge)** | Docker Container (VPS) | 24+ | Always-on persistent TCP WebSocket for WhatsApp |

---

## 3. Database Architecture & Row-Level Security (RLS)

All tables run on PostgreSQL with Row-Level Security (RLS) enabled. Schema changes are strictly managed through sequential migration files in `supabase/migrations/`.

### Migration Ledger
1. `20261126000001_core_schema.sql` — Profiles, roles, products, categories, variants, inventory, orders, order items.
2. `20261126000002_rls_policies.sql` — Customer vs Admin security boundaries.
3. `20261126000003_storage_buckets.sql` — `products` and `attachments` storage buckets.
4. `20261126000004_whatsapp_tables.sql` — WhatsApp sessions, messages queue, and inbound logs.
5. `20261126000005_storefront_seed.sql` — Apparel categories, products, coupons, and inventory.
6. `20261126000006_erp_manufacturing.sql` — Suppliers, raw materials, BOM, purchase orders, 5-stage production tracker, stock ledger, B2B wholesale pricing tiers.
7. `20261126000007_erp_seed.sql` — Sheikhpura mill suppliers, denim fabric rolls, buttons, zippers, BOMs, active POs.
8. `20261126000008_crm_seed.sql` — CRM customer stages, B2B leads pipeline, follow-up tasks, activity logs, WhatsApp templates, broadcast campaigns, auto-reply rules, anti-ban settings.

### Security Hierarchy (RBAC)
- **Anonymous / Public**: Read-only access to active products, categories, and public reviews.
- **Authenticated Customer**: Full access to own profile, addresses, order history, and cart.
- **Admin**: Full CRUD access across Storefront, ERP, CRM, and WhatsApp Automation backed by `profiles.role = 'admin'` or `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4. WhatsApp Automation & Anti-Ban Architecture

```
[Customer / Lead] <---> [WhatsApp Network]
                             ^
                             | (Persistent WebSocket / TCP)
                     [Baileys Bridge Docker]
                             |
                   (Internal REST / Webhooks)
                             |
                             v
               [Next.js API Route Handlers]
                             |
                             v
                 [Supabase PostgreSQL Queue]
```

### Safety & Compliance Controls
1. **Typing Jitter Emulation**: Random typing delays between 4,000ms and 12,000ms before sending text.
2. **Overnight Quiet Hours**: Automatic dispatch suppression between 22:00 and 08:00 IST to prevent carrier complaints.
3. **SIM Warmup Schedule**: Graduated message throttling for newly registered SIM numbers (Day 1: 50, Day 2: 100, Day 3: 200, Day 4: 350, Day 5+: 500/day).
4. **Spintax Text Rotation**: Dynamic phrase variation (`{Namaste|Hello|Pranam} {Bhai|Sir}`) to avoid pattern detection.
5. **Opt-Out Engine**: Automated suppression on receipt of STOP, UNSUBSCRIBE, or Hindi keyword 'बंद'.
