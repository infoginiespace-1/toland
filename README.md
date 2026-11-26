# TOLAND

**TOLAND (toland.pvt.ltd)** — Premium Denim Jeans and Casual Outfits Manufacturer.  
*Sheikhpura, Barbigha, Khetalpura 811101 (Bihar, India)*

E-commerce Storefront + Admin Panel with ERP + CRM + WhatsApp Automation, unified on a single Supabase backend.

---

## Architecture Overview

```
toland/
├─ apps/
│  ├─ web/                 # Next.js (App Router): Storefront + /admin panel
│  └─ bridge/              # Baileys WhatsApp service (Dockerized)
├─ supabase/
│  ├─ migrations/          # Managed PostgreSQL schema migrations
│  ├─ functions/           # Supabase Edge Functions (SMS/OTP hook, webhooks)
│  └─ seed.sql             # Development & staging seed data
├─ packages/
│  └─ shared/              # Shared TypeScript types, Zod schemas, constants, tokens
├─ .github/workflows/      # Automated CI/CD (lint, test, Vercel, Supabase migration)
├─ .env.example            # Environment variables manifest (names only)
└─ README.md
```

---

## Design System & Theme Tokens (Forest Green)

The entire design system follows a single unified **Forest Green** palette:

| Token | Hex | Role |
|---|---|---|
| `--primary` | `#14532D` | Deep forest green (core brand, buttons, accents) |
| `--primary-hover` | `#0F3F22` | Interactive hover state |
| `--accent` | `#228B22` | Vibrant forest green highlight |
| `--surface` | `#F0F7F2` | Background surface tone |
| `--surface-alt` | `#E3EFE7` | Secondary surface/card background |
| `--text` | `#0F1F17` | High-contrast deep dark text |
| `--muted` | `#5B6B61` | Secondary/subdued text |
| `--border` | `#CFE0D5` | Clean border tone |
| `--danger` | `#B3261E` | Destructive actions & alerts |
| `--warning` | `#B7791F` | Warning banners & status |
| `--success` | `#1E7B3A` | Success confirmation |

---

## Cloud Deployments & Environments

- **Staging Project**: `toland-staging` (`zgmsfnedrgthinykkgxk`)
- **Production Project**: `toland-prod` (`uuqnczklpmfvscrpziet`)
- **Cloud Hosting**: Vercel (Web frontend) + VPS Docker container (WhatsApp Baileys Bridge)
- **CI/CD**: GitHub Actions (`ci.yml`, `deploy-web.yml`, `migrate.yml`, `deploy-bridge.yml`)
