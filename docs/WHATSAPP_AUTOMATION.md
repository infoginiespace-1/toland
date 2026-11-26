# WhatsApp Automation & Baileys Bridge Guide

**TOLAND (toland.pvt.ltd)** — Customer Engagement & Automation Suite  
*Sheikhpura, Barbigha, Khetalpura 811101 (Bihar, India)*

---

## 1. Architecture Overview

TOLAND utilizes a hybrid WhatsApp architecture:
1. **Baileys Web Multi-Device Socket (Primary)**: Self-hosted headless WhatsApp Web client container running inside Docker. Enables automated order confirmations, shipping updates, and customer chat without per-message template fees.
2. **Meta Cloud API (Fallback/High Volume)**: Direct official Meta Cloud API integration for high-concurrency transactional bursts and OTP dispatches.

---

## 2. Docker Deployment & Running the Bridge

The bridge service is located in `apps/bridge/`.

### Docker Compose Quick Start
```bash
cd apps/bridge
docker-compose up -d --build
```

### Dockerfile Breakdown
- Base Image: `node:20-alpine`
- Installs necessary native build tools and OpenSSL.
- Runs on internal port `3001`.
- Mounted volume `./session:/app/session` preserves WhatsApp multi-device authentication credentials across container restarts.

### Environment Configuration
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
WHATSAPP_BRIDGE_SECRET=[STRONG_SECRET_TOKEN]
WEB_APP_URL=https://toland-web.vercel.app
```

---

## 3. QR Code Linking & Session Management

1. Access the Admin Panel at `/admin/whatsapp/settings`.
2. Check the Bridge Connection status pill.
3. If not linked, click **"Request New QR Code"**.
4. Scan the rendered QR code with the official WhatsApp application on the dedicated TOLAND business device (**Linked Devices** -> **Link a Device**).
5. Once authenticated, session keys are stored securely in PostgreSQL (`whatsapp_sessions` table) and locally in the container's volume.

---

## 4. Anti-Ban Throttling Engine

To prevent WhatsApp spam blocks and preserve SIM longevity, the bridge enforces the following heuristics:

| Feature | Production Setting | Operational Behavior |
|---|---|---|
| **Typing Jitter** | 4,000ms – 12,000ms | Emulates human typing behavior before emitting message packets. |
| **Quiet Hours** | 22:00 – 08:00 IST | Non-critical marketing and reminder messages are queued and held until 08:01 IST. |
| **SIM Warmup** | 50 -> 500 msgs/day | Graduated message volume ramp-up for newly attached SIM numbers. |
| **Spintax Variations** | Enabled | Rotates phrasing across greetings and signatures. |
| **Opt-Out Compliance** | Real-time | Immediately revokes WhatsApp opt-in if customer texts `STOP`, `UNSUBSCRIBE`, or `बंद`. |

---

## 5. Spintax & Template Authoring

Broadcast templates support Spintax variations and dynamic merge variables:

```text
{Namaste|Hello|Pranam} {{customer_name}},

{Your TOLAND order|Order #{{order_number}}} has been {confirmed|packed and ready}!
Total: ₹{{order_total}}
Items: {{item_summary}}

{Track your delivery here|Click to track}: {{tracking_link}}

{Regards|Dhanyawaad},
Team TOLAND Jeans (Sheikhpura, Bihar)
```

### Available Dynamic Merge Fields
- `{{customer_name}}` — Full name or business name.
- `{{order_number}}` — Short 8-character order identifier.
- `{{order_total}}` — Formatted Indian Rupee value.
- `{{tracking_link}}` — Shipment URL.
- `{{dispatch_date}}` — Estimated delivery date.

---

## 6. Auto-Reply Bot Rules

Automated bot rules are evaluated on all inbound messages in `/admin/whatsapp/auto-replies`:

| Trigger Keyword | Match Type | Auto-Response Content |
|---|---|---|
| `CATALOG` / `CATALOGUE` | Contains | Sends latest PDF catalog download link and current top 10 retail jeans styles. |
| `WHOLESALE` / `B2B` | Contains | Triggers B2B inquiry form, requests trade license / GSTIN, and notifies Sheikhpura sales desk. |
| `ORDER` / `STATUS` | Contains | Asks for 6-digit order ID and queries Supabase order database in real-time. |
| `STOP` / `बंद` | Exact / Contains | Unsubscribes number from marketing campaigns and confirms opt-out. |
