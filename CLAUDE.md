# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (also runs TypeScript check)
npm run lint     # ESLint (flat config, eslint.config.mjs)
```

No test runner is configured yet.

## Architecture

**WriteNaija** — a commission-based marketplace connecting Nigerian writers with clients. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase (auth + Postgres + Storage + Realtime), Paystack (payments, NGN only), Resend (transactional email).

### Three Supabase clients — use the right one

| Client | File | Purpose |
|--------|------|---------|
| `createClient()` (server) | `lib/supabase/server.ts` | Auth checks only (`getUser`, `signOut`). Uses anon key + cookies. **Never use for data reads/writes.** |
| `createClient()` (browser) | `lib/supabase/client.ts` | Client components — auth state only. |
| `supabaseService` | `lib/supabase/service.ts` | Service-role key, bypasses RLS. **All data reads/writes go through this.** |

### Route groups and roles

- `app/(public)/` — unauthenticated pages (landing, categories, writer directory, public job view, privacy policy)
- `app/writer/` — writer dashboard (layout has client-side auth guard)
- `app/client/` — client dashboard (same pattern)
- `app/admin/` — admin panel (dark sidebar, relies on API-level `requireRole`)

### Auth & access control

- Roles stored in Supabase `user_metadata.role` (`'writer'` | `'client'` | `'admin'`).
- Signup is server-side only: `supabaseService.auth.admin.generateLink()` creates the user + extracts `hashed_token`, then sends verification email via Resend (not Supabase's built-in mailer). Never use client-side `supabase.auth.signUp()`.
- Auth callback at `app/auth/callback/route.ts` calls `verifyOtp({ token_hash, type })` and redirects by role.
- `proxy.ts` (Next.js 16's replacement for `middleware.ts`) is intentionally thin: session cookie check + redirect only. No role checks, no DB calls, no JWT validation.
- API routes use `requireRole(...roles)` from `lib/access/require-role.ts` — returns `{ userId, role, profileId }` or throws `AuthError`. Always wrap in try/catch with `handleAuthError(err)`.
- `requireOwnership()` for record-level access checks.

### API route conventions

All API routes under `app/api/`. Pattern:
1. Call `requireRole()` for auth (except Paystack webhook, which uses signature verification)
2. Parse body with Zod schema from `lib/validators/`
3. Read/write via `supabaseService`
4. Return `NextResponse.json()`

File upload routes must validate `project_id` as UUID and enforce file size (50 MB) and MIME type limits.

### Security rules

- **`writer_profiles` bank fields** (`bank_name`, `bank_account_number`, `bank_account_name`): never `select('*')` on this table. Only two legitimate access points: writer's own account page and admin payout processing. Every other query must use an explicit column list excluding bank fields.
- **Service-role key**: must never be prefixed `NEXT_PUBLIC_`.
- **Paystack webhook** (`/api/webhooks/paystack`): verifies HMAC-SHA512 signature before processing. Never trust client-side payment callbacks alone.
- **Signed URLs** for project files: use `file_path` (the full storage path), not `file_name`. Expiry is 1 hour.
- Messages rendered via React text binding (no `dangerouslySetInnerHTML`).

### Key domain concepts

- **Two paths to project creation**: Path A (direct contact, status starts `pending`) or Path B (job posting → writer response → client selection, status starts `awaiting_payment`).
- **Escrow flow**: client pays via Paystack → `transaction.status = 'held'` → writer completes → client approves → `release_escrow` RPC (atomic: updates transaction + credits wallet + inserts ledger entry + sets project completed).
- **Contact scanning**: `lib/utils/contact-scan.ts` checks messages for phone numbers, emails, and social media phrases before insert. Flagged messages are withheld from recipients and routed to admin review.
- **Writer wallets**: balance is denormalized on `wallets` table; source of truth is the `wallet_transactions` ledger. Withdrawals go through `process_withdrawal` RPC (atomic debit + payout creation).
- **Platform settings**: key-value pairs in `platform_settings` table (commission rate, price limits, response windows). Read at runtime, not hardcoded. Commission rate default is 15%.
- **Response window**: job postings have a deadline (hours) and a max response cap, both read from platform_settings. Enforced server-side in `lib/utils/response-window.ts`.

### Database functions (atomic operations)

Three RPC functions in `supabase/migrations/019_functions.sql` handle multi-table writes:
- `approve_badge_application` — sets application approved + writer `is_verified = true` atomically
- `release_escrow` — releases transaction + credits wallet + inserts ledger + completes project
- `process_withdrawal` — debits wallet + creates payout record + inserts ledger (with `FOR UPDATE` lock)

Call these via `supabaseService.rpc('function_name', { ...params })`.

### Data model

`types/models.ts` defines the full schema as TypeScript interfaces. Read it before modifying any database-related code. SQL migrations are in `supabase/migrations/` (001–019).

### Email

Transactional emails via Resend, organized by audience:
- `lib/emails/writer-emails.ts` (5 functions: verification, job match, response confirmation, assignment, payout)
- `lib/emails/client-emails.ts` (5 functions: verification, job posted, response received, project completed, payment)
- `lib/emails/admin-emails.ts` (2 functions: flagged message, dispute opened)
- `lib/emails/config.ts` — `EMAIL_FROM` constant

### Validation

Zod v4 schemas in `lib/validators/`. Shared between API routes and client-side forms via react-hook-form + `@hookform/resolvers`.

### Payments

- Paystack webhook at `app/api/webhooks/paystack/route.ts` handles `charge.success`, `transfer.success`, `transfer.failed`.
- Commission rate is snapshotted into each `transactions` row at payment time.
- Writer payouts go through Paystack Transfer API.
- Currency is Nigerian Naira (NGN) throughout.

### Environment variables

Required (in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`
- `EMAIL_FROM` (optional, defaults to `WriteNaija <noreply@writenaija.com>`)
