# TOLAND (toland.pvt.ltd)

[![CI](https://github.com/infoginiespace-1/toland/actions/workflows/ci.yml/badge.svg)](https://github.com/infoginiespace-1/toland/actions/workflows/ci.yml)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-14532D?logo=vercel&logoColor=white)](https://toland-web.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-Mumbai%20ap--south--1-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

**TOLAND** is a full-stack, enterprise-grade e-commerce storefront and industrial manufacturing management system (ERP + CRM + WhatsApp Automation) custom-built for **Toland Private Limited**, an authentic denim jeans and casual wear apparel manufacturer based in **Sheikhpura, Barbigha, Khetalpura 811101 (Bihar, India)**.

Unified on a single **Supabase** backend with **Next.js 14 App Router** and a self-hosted **Baileys WhatsApp Web Automation Bridge**.

---

## 🌐 Live Deployments

- **Production Storefront & Admin**: [https://toland-web.vercel.app](https://toland-web.vercel.app)
- **GitHub Repository**: [https://github.com/infoginiespace-1/toland](https://github.com/infoginiespace-1/toland)
- **Supabase Staging Project**: `zgmsfnedrgthinykkgxk` (Mumbai `ap-south-1`)
- **Supabase Production Target**: `uuqnczklpmfvscrpziet` (Mumbai `ap-south-1`)

---

## 🏭 Manufacturing Factory Profile

- **Legal Entity**: Toland Private Limited (`toland.pvt.ltd`)
- **Factory & Mill Address**: Sheikhpura, Barbigha, Khetalpura 811101, Bihar, India
- **Core Product Lines**: Raw Selvedge Denim, Comfort Stretch Jeans, Heavy Cotton Chinos, Twill Overshirts.
- **Operations Supported**: Raw fabric procurement, laser cutting, multi-needle stitching, enzyme stone wash, industrial finishing, barcoded packaging, B2B wholesale distribution, and B2C direct-to-consumer e-commerce.

---

## 🧩 Architectural Topology

```
toland/
├── apps/
│   ├── web/                        # Next.js 14 App Router (Storefront + /admin Portal)
│   │   ├── src/
│   │   │   ├── app/                # 42+ dynamic & static routes (Storefront, ERP, CRM)
│   │   │   ├── components/         # Forest Green responsive UI components
│   │   │   └── lib/                # Supabase SSR client, TanStack queries, helpers
│   │   └── public/                 # Static brand assets and product photography
│   └── bridge/                     # Baileys WhatsApp Multi-Device Gateway (Dockerized)
│       ├── src/
│       │   ├── providers/          # Baileys socket & Meta Cloud API fallback
│       │   ├── services/           # Queue worker, typing jitter, anti-ban engine
│       │   └── routes.ts           # REST API endpoints & webhook handlers
│       ├── Dockerfile              # Production container build
│       └── docker-compose.yml       # Production container orchestration
├── packages/
│   └── shared/                     # Shared TypeScript types, Zod schemas, constants
├── supabase/
│   ├── migrations/                 # Sequential SQL migrations (001 to 008)
│   └── seed.sql                    # Initial seed dataset
├── tests/                          # Automated Node.js native test suites
│   ├── erp-bom-capacity.test.js    # BOM calculation & 5-stage yield simulation
│   ├── storefront-cart-gst.test.js # Indian GST slabs & cart calculations
│   └── whatsapp-antiban.test.js    # Anti-ban jitter, quiet hours, auto-reply matching
├── docs/                           # Enterprise Documentation & SOP Manuals
│   ├── ARCHITECTURE.md             # Monorepo topology, database RLS & security
│   ├── ERP_MANUFACTURING.md        # Factory SOPs, BOM formula, 5-stage tracking
│   ├── WHATSAPP_AUTOMATION.md      # Baileys setup, Docker deployment, anti-ban heuristics
│   └── DEPLOYMENT_HANDOVER.md      # Mumbai production migration & launch checklist
└── .github/workflows/              # Automated CI/CD (lint, test, build, deploy)
    ├── ci.yml                      # CI test runner & typecheck
    ├── deploy-web.yml              # Vercel preview & production deployments
    └── deploy-bridge.yml           # WhatsApp bridge Docker build & deployment
```

---

## 🎨 Forest Green Design System

The application strictly implements the **Forest Green** design tokens across both customer-facing storefronts and internal admin screens:

| Token | CSS Variable | Hex Code | Visual Role |
|---|---|---|---|
| **Primary** | `--primary` | `#14532D` | Core brand identity, primary buttons, headers |
| **Primary Hover** | `--primary-hover` | `#0F3F22` | Interactive button hover and active states |
| **Accent** | `--accent` | `#228B22` | Vibrant forest green highlights, badges, icons |
| **Surface** | `--surface` | `#F0F7F2` | Page background canvas |
| **Surface Alt** | `--surface-alt` | `#E3EFE7` | Secondary cards, table alternating rows |
| **Text** | `--text` | `#0F1F17` | High-contrast body typography |
| **Muted** | `--muted` | `#5B6B61` | Secondary captions, timestamps, placeholders |
| **Border** | `--border` | `#CFE0D5` | Subtle container lines and input outlines |
| **Success** | `--success` | `#1E7B3A` | Order confirmed, inventory added, positive feedback |
| **Warning** | `--warning` | `#B7791F` | Low stock alerts, overdue follow-ups |
| **Danger** | `--danger` | `#B3261E` | Scrap write-offs, destructive actions |

---

## 📦 System Modules & Feature Matrix

### 1. Customer Storefront (`/`)
- **Product Catalog**: Dynamic filtering by fit (Slim, Regular, Relaxed), size (28 to 38), wash (Raw, Stone, Bleached), and price.
- **Product Details**: Multi-angle image galleries, interactive size charts, fabric density (GSM), and real-time stock indicator.
- **Cart & Indian GST Engine**: Dual-slab GST calculation (5% for $\le ₹1,000$, 12% for $> ₹1,000$), coupon redemption with discount caps, and free shipping threshold (₹1,999+).
- **Checkout & Payments**: Dual payment options supporting **Razorpay** (UPI, Net Banking, Cards) and **Cash on Delivery (COD)**.
- **Customer Account**: Profile management, order tracking, address book, and one-click WhatsApp customer support.

### 2. Admin ERP & Manufacturing Suite (`/admin/erp`)
- **Suppliers (`/admin/erp/suppliers`)**: Verified textile mills, contact persons, GST numbers, payment terms, and supplier performance scorecards.
- **Raw Materials (`/admin/erp/raw-materials`)**: Fabric rolls (meters), buttons, rivets, zippers, patches, and polybags with reorder points.
- **Bill of Materials (`/admin/erp/boms`)**: Multi-item recipe definitions per garment SKU with automated bottleneck capacity calculation.
- **Purchase Orders (`/admin/erp/purchase-orders`)**: Draft, issue, and receive supplier shipments with stock ledger auto-increment.
- **5-Stage Production Tracker (`/admin/erp/production`)**: Real-time batch progression through **Cutting $\rightarrow$ Stitching $\rightarrow$ Washing $\rightarrow$ Finishing $\rightarrow$ Packing** with scrap deduction.
- **Stock Ledger (`/admin/erp/stock-ledger`)**: Immutable, FIFO audit history for all raw material and finished garment movements.
- **B2B Wholesale Tiers (`/admin/erp/b2b-tiers`)**: Volume-based wholesale pricing matrix with MOQ enforcement and tiered discount schedules.

### 3. CRM & Customer WhatsApp Engagement Suite (`/admin/crm` & `/admin/whatsapp`)
- **Customer CRM (`/admin/crm/customers`)**: Lifetime spend, order count, VIP customer tiers, WhatsApp opt-in state, and direct messaging drawer.
- **B2B Leads Pipeline (`/admin/crm/leads`)**: Kanban board and table view across 6 stages (New Lead $\rightarrow$ Contacted $\rightarrow$ Sample Sent $\rightarrow$ Quote Submitted $\rightarrow$ Won $\rightarrow$ Lost).
- **Follow-up Tasks (`/admin/crm/followups`)**: Scheduled reminders, due dates, priority flags, and one-click completion toggles.
- **Activity Log (`/admin/crm/activities`)**: Unified audit feed capturing all calls, WhatsApp messages, order updates, and status shifts.
- **Message Templates (`/admin/whatsapp/templates`)**: Reusable message templates with Spintax phrase rotation and dynamic merge variables (`{{customer_name}}`, `{{order_number}}`).
- **Broadcast Campaigns (`/admin/whatsapp/campaigns`)**: Targeted promotional dispatches filtered by customer segments.
- **Auto-Reply Bot Rules (`/admin/whatsapp/auto-replies`)**: Automated keyword response triggers supporting Exact, Contains, and Regex matching (e.g. `CATALOG`, `PRICE`, `STOP`, `बंद`).
- **Anti-Ban Engine & Settings (`/admin/whatsapp/settings`)**: Human typing jitter emulation (4s–12s), IST quiet hours suppression (22:00–08:00), daily quotas, and SIM warmup scheduler.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js $\ge 20.0.0$
- pnpm $\ge 12.0.0$
- Docker & Docker Compose (for local WhatsApp bridge)

### Installation
```bash
# Clone the repository
git clone https://github.com/infoginiespace-1/toland.git
cd toland

# Install monorepo dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
```

### Running Automated Test Suites
TOLAND includes native test suites using Node.js's built-in test runner:
```bash
# Run all test suites
pnpm test
```

### Starting Web Application
```bash
# Start Next.js development server
pnpm dev

# Or build for production
pnpm build
```

### Starting WhatsApp Bridge Container
```bash
cd apps/bridge
docker-compose up -d --build
```

---

## 📚 Technical Documentation Directory

For in-depth operational guides, refer to the documents in `docs/`:
- [System Architecture & Security Specifications](docs/ARCHITECTURE.md)
- [ERP & Manufacturing Operations SOP](docs/ERP_MANUFACTURING.md)
- [WhatsApp Automation & Anti-Ban Manual](docs/WHATSAPP_AUTOMATION.md)
- [Production Deployment & Launch Handover Guide](docs/DEPLOYMENT_HANDOVER.md)

---

## 🔒 Security & Compliance

- **Authentication**: Supabase Auth with server-side cookie verification.
- **Authorization**: Row-Level Security (RLS) policies enforced on 100% of tables.
- **Data Protection**: Zero committed credentials; all secrets stored in GitHub Secrets and Vercel Environment Variables.
- **Audit Trails**: Full stock ledger and activity feeds for manufacturing and customer interactions.

---

*© 2026 Toland Private Limited (toland.pvt.ltd). All rights reserved.*  
*Sheikhpura, Barbigha, Khetalpura 811101, Bihar, India.*
