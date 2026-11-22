# RAI Platform

Website and operational platform for UMKM Creative by RAI, built against `prd_platform_rai.md`.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env`. Keep local `DATABASE_URL=file:./dev.db`, set a random `AUTH_SECRET` with at least 32 characters, then run:

```bash
npm run db:apply
npm run db:seed
npm run admin:bootstrap
npm run dev
```

Before `admin:bootstrap`, set `RAI_SUPER_ADMIN_NAME`, `RAI_SUPER_ADMIN_EMAIL`, and a unique `RAI_SUPER_ADMIN_PASSWORD` of at least 16 characters in `.env`. Remove those three values after the first admin is created. Open `/q/RAI-DEMO` to preview the QR flow. In production, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. Set `NEXT_PUBLIC_RAI_ADMIN_WA` to the official WhatsApp number before publishing consultation links. Never put secrets in `NEXT_PUBLIC_*` variables.

## Current scope

- Apple-inspired responsive marketing landing page.
- Interactive customer and owner experience preview.
- Package cards without pricing.
- WhatsApp consultation link when the admin number is configured; otherwise links point to the contact section.
- Prisma 7 schema and libSQL adapter for the tenant, QR, visit, visitor-session, user, and product tables.
- Dynamic QR redirects with signed visitor cookies and an atomic three-hour per-browser cooldown.
- Password-protected Super Admin panel, batch QR printing, and concierge onboarding.
- Customer registration through the RAI Google Form. A form-submit trigger places each submission in the Super Admin approval queue; approval creates the tenant and owner credentials.
- POS, digital stamps and vouchers, queue management, cash drawer shifts, attendance with GPS geofencing, customer feedback, and owner sales reports.
- Owner XLSX export for transactions, cash shifts, drawer movements, and attendance. Downloads are limited to 90 days and use the owner’s store or explicitly assigned RAI Juragan group.
- Multi-branch daily summaries for Super Admin-linked RAI Juragan stores. Other store owners do not inherit group access.
- Super Admin bulk product import by pasting Excel TSV into a single selected tenant; import rejects duplicate or invalid rows before writing.
- Per-tenant Super Admin controls for dynamic QR destination and loyalty program terms, stamp target, and reward amount. New tenants keep rewards disabled until a valid discount is configured.
- Public promo campaigns with quota and expiry, claim-once WhatsApp identity, and nominal, percentage, or free-product vouchers checked by POS.
- Per-tenant Super Admin editing for business profile, Google review URL, geofence, work start time, plan status, and store activation.

Owner and staff can sign in at `/login`. Scanning an assigned store QR redirects its owner to `/dashboard` and its staff to `/app`; other visitors continue to the public store portal. Reports and XLSX downloads are restricted to the signed-in owner’s tenant scope. Automatic nightly WhatsApp reports remain disabled until a provider is selected.

## Google Form webhook

The public form is available at `/daftar`. The installed Apps Script trigger sends submissions to `/api/integrations/google-form` using the `GOOGLE_FORM_WEBHOOK_SECRET` value stored in local `.env`, Vercel Production, and Apps Script Script Properties. Each valid submission stays `PENDING` until a Super Admin approves it and assigns an unused QR code.

Apply pending additive database migrations with `npm run db:apply` before deploying code that reads the new schema. Super Admin creates per-store campaigns from `/admin/tenants/[tenantId]/settings`; customers claim them on their store portal, then give the generated code to staff at POS.
