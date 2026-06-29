# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (flat config, eslint.config.mjs)
```

No test runner is configured yet.

## Architecture

**WriteNaija** — a commission-based marketplace connecting Nigerian writers with clients. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase (auth + Postgres + Storage), Paystack (payments), Resend (transactional email).

### Three Supabase clients — use the right one

| Client | File | Purpose |
|--------|------|---------|
| `createClient()` (server) | `lib/supabase/server.ts` | Auth checks only (`getUser`, `signOut`). Uses anon key + cookies. **Never use for data reads/writes.** |
| `createClient()` (browser) | `lib/supabase/client.ts` | Client components — auth state only. |
| `supabaseService` | `lib/supabase/service.ts` | Service-role key, bypasses RLS. **All data reads/writes go through this.** |

### Route groups and roles

Three authenticated dashboards, each with its own layout and sidebar:

- `app/(public)/` — unauthenticated pages (landing, categories, writer directory, public job view)
- `app/writer/` — writer dashboard (`'use client'` layout, client-side auth guard)
- `app/client/` — client dashboard (same pattern)
- `app/admin/` — admin panel (dark sidebar, no client-side auth guard on layout — relies on API-level `requireRole`)

### Auth & access control

- Roles are stored in Supabase `user_metadata.role` (`'writer'` | `'client'` | `'admin'`).
- Signup uses `supabaseService.auth.admin.generateLink()` to create users + extract `hashed_token`, then sends verification emails via Resend (not Supabase's built-in mailer).
- Auth callback at `app/auth/callback/route.ts` handles OTP verification and redirects by role.
- API routes use `requireRole(...roles)` from `lib/access/require-role.ts` — returns `{ userId, role, profileId }` or throws `AuthError`. Always wrap route handlers in try/catch with `handleAuthError(err)`.
- `requireOwnership()` is available for record-level access checks.
- No Next.js middleware file — auth is enforced per-route, not globally.

### API route conventions

All API routes are Next.js Route Handlers under `app/api/`. Pattern:
1. Call `requireRole()` for auth
2. Parse body with Zod schema from `lib/validators/`
3. Read/write via `supabaseService`
4. Return `NextResponse.json()`

### Key domain concepts

- **Two paths to project creation**: Path A (direct contact, status starts `pending`) or Path B (job posting + writer response + client selection, status starts `awaiting_payment`).
- **Escrow flow**: client pays via Paystack -> `transaction.status = 'held'` -> writer completes -> client approves -> commission deducted -> net credited to writer wallet.
- **Contact scanning**: `lib/utils/contact-scan.ts` checks messages for phone numbers, emails, and social media phrases. Flagged messages are withheld from recipients and routed to admin review.
- **Writer wallets**: balance is denormalized on the `wallets` table; source of truth is the `wallet_transactions` ledger.
- **Platform settings**: key-value pairs in `platform_settings` table (commission rate, price limits, response windows). Read at runtime, not hardcoded.

### Data model

`types/models.ts` defines the full schema as TypeScript interfaces with detailed comments. Read it before modifying any database-related code.

**Security rule**: `bank_*` fields on `writer_profiles` must never appear in public-facing queries. Always use explicit column lists.

### Email

Transactional emails via Resend, organized by audience:
- `lib/emails/writer-emails.ts`
- `lib/emails/client-emails.ts`
- `lib/emails/admin-emails.ts`
- `lib/emails/config.ts` — `EMAIL_FROM` constant

### Validation

Zod v4 schemas in `lib/validators/`. Shared between API routes and (where applicable) client-side forms via react-hook-form + `@hookform/resolvers`.

### Payments

- Paystack webhook at `app/api/webhooks/paystack/route.ts` handles `charge.success`, `transfer.success`, `transfer.failed`. Signature is verified via HMAC-SHA512.
- Writer payouts go through Paystack Transfer API.
- Currency is Nigerian Naira (NGN) throughout.

### Environment variables

Required (in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`
- `EMAIL_FROM` (optional, defaults to `WriteNaija <noreply@writenaija.com>`)
