# Deployment & Launch Handover Manual

**TOLAND (toland.pvt.ltd)** — Production Infrastructure Handover  
*Sheikhpura, Barbigha, Khetalpura 811101 (Bihar, India)*

---

## 1. Environment Topology

TOLAND runs on two isolated, enterprise-tier Supabase cloud projects located in the **Mumbai (`ap-south-1`)** AWS region for ultra-low latency across India:

| Environment | Supabase Project Ref | Database URL | Vercel Deployment Target |
|---|---|---|---|
| **Staging** | `zgmsfnedrgthinykkgxk` | `db.zgmsfnedrgthinykkgxk.supabase.co` | Preview Deployments (PRs) |
| **Production** | `uuqnczklpmfvscrpziet` | `db.uuqnczklpmfvscrpziet.supabase.co` | `https://toland-web.vercel.app` / `toland.in` |

---

## 2. Production Database Migration Runbook

All database schemas are stored as version-controlled SQL files in `supabase/migrations/`.

### Migration Commands for Production
To apply migrations 001 through 008 to the production project:

```bash
# 1. Link CLI to production reference
npx supabase link --project-ref uuqnczklpmfvscrpziet

# 2. Apply all unapplied migrations
$env:SUPABASE_DB_PASSWORD="[PRODUCTION_DATABASE_PASSWORD]"
npx supabase db push --remote --yes
```

### Storage Buckets Initialization
Ensure the following public buckets are created on the production project:
- `products`: Product photography, catalog images, zoom renders.
- `attachments`: Supplier invoices, material spec sheets, customer proof-of-payment.

---

## 3. Vercel Production Environment Configuration

In the Vercel Project Dashboard (`toland-web`), confirm the following production environment variables are configured:

```ini
# Supabase Production Keys
NEXT_PUBLIC_SUPABASE_URL=https://uuqnczklpmfvscrpziet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[PRODUCTION_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[PRODUCTION_SERVICE_ROLE_KEY]

# Domain & URLs
NEXT_PUBLIC_APP_URL=https://toland-web.vercel.app

# WhatsApp Bridge Endpoint
WHATSAPP_BRIDGE_URL=https://bridge.toland.in
WHATSAPP_BRIDGE_SECRET=[STRONG_SECRET]

# Razorpay Production Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_[KEY_ID]
RAZORPAY_KEY_SECRET=[SECRET]
RAZORPAY_WEBHOOK_SECRET=[SECRET]

# Company Profile
NEXT_PUBLIC_COMPANY_NAME=TOLAND
NEXT_PUBLIC_COMPANY_ADDRESS=Sheikhpura, Barbigha, Khetalpura 811101, Bihar, India
NEXT_PUBLIC_COMPANY_GST=10AAAAA0000A1Z5
```

---

## 4. Custom Domain & DNS Mapping

To link `www.toland.in` and `toland.in`:

1. In Vercel Project Settings -> **Domains**:
   - Add `toland.in` (Redirect to `www.toland.in`)
   - Add `www.toland.in`
2. Update DNS A / CNAME records in registrar (e.g. GoDaddy / Cloudflare):
   - `A` record for `@` pointing to `76.76.21.21`
   - `CNAME` record for `www` pointing to `cname.vercel-dns.com`

---

## 5. Security & Secret Rotation Policy

1. **Identity & Access**: All cloud deployments, GitHub Actions, and CLI keys must be administered exclusively via authorized organization accounts (`info.giniespace@gmail.com`).
2. **Access Tokens**: Rotate Supabase Personal Access Tokens and Vercel Tokens every 90 days.
3. **Database Passwords**: Store encrypted in organization password managers (e.g. 1Password / Bitwarden). Never commit passwords or service role keys to git.
4. **Row-Level Security**: Never disable RLS in production. All table reads and writes must pass security policies.

---

## 6. Pre-Launch Verification Checklist

- [x] All 8 database migrations verified and applied without errors.
- [x] RLS policies enforced on all 16 tables.
- [x] Storefront cart Indian GST calculation verified (5% for $\le ₹1,000$, 12% for $> ₹1,000$).
- [x] ERP BOM capacity and 5-stage yield engine verified with 100% test coverage.
- [x] WhatsApp Anti-ban jitter and quiet hours verified with 100% test coverage.
- [x] Direct image upload from desktop file picker into Supabase Storage tested.
- [x] Responsive layout verified across mobile, tablet, and desktop viewports.
- [x] Forest Green design tokens (`#14532D`, `#228B22`, `#F0F7F2`) strictly applied.
- [x] Production build passes with 0 warnings or type errors (42/42 routes compiled).
