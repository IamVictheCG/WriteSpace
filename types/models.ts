// Data model interfaces — review these before writing SQL migrations.
// These are NOT the runtime types (those come from `database.types.ts` generated
// by Supabase CLI). These exist so we can agree on the shape of every table
// before committing schema.

// ─── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = 'writer' | 'client' | 'admin'

export type ProjectStatus =
  | 'pending'            // created from Path A (direct contact), no terms agreed yet
  | 'awaiting_payment'   // terms agreed, waiting for client to pay
  | 'active'             // payment received (held in escrow), work in progress
  | 'writer_completed'   // writer marked their deliverable as done
  | 'completed'          // client approved, payment released to writer wallet
  | 'disputed'           // client flagged a dispute while funds are held
  | 'cancelled'          // abandoned before or after payment (refund if held)

export type TransactionStatus =
  | 'pending'   // Paystack charge initiated, not yet confirmed
  | 'held'      // Paystack confirmed, funds in escrow
  | 'released'  // client approved, commission deducted, net credited to wallet
  | 'refunded'  // full refund to client
  | 'partially_released' // dispute resolved with partial split

export type JobPostingStatus = 'open' | 'closed' | 'filled'

export type JobResponseStatus = 'pending' | 'accepted' | 'rejected'

export type MessageFlagStatus = 'pending' | 'released' | 'edit_requested' | 'escalated'

export type BadgeApplicationStatus = 'pending' | 'approved' | 'rejected'

export type DisputeResolution =
  | 'open'
  | 'resolved_writer'   // full release to writer
  | 'resolved_client'   // full refund to client
  | 'resolved_partial'  // split — see resolution_amount

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type WalletTransactionType = 'credit' | 'debit'

export type WalletTransactionReference =
  | 'project_payment'  // credit: money released from completed project
  | 'withdrawal'       // debit: writer withdrew to bank
  | 'refund'           // debit: reversal due to dispute

// ─── Auth ───────────────────────────────────────────────────────────────────
// user_metadata.role is set at signup ('writer' | 'client').
// admin is a manually-assigned role, not self-registered.
// auth.users is managed by Supabase — no custom table.

// ─── Writer Profiles ────────────────────────────────────────────────────────
// SECURITY: bank_* fields must NEVER appear in any public-facing query.
// Any query that could serve the directory, public profile, or job response
// list MUST use an explicit column list excluding bank fields.

export interface WriterProfile {
  id: string                     // uuid, PK
  user_id: string                // FK → auth.users (unique)
  username: string               // unique, public-facing identifier
  full_name: string              // never shown to clients
  bio: string | null
  avatar_url: string | null
  response_time_hours: number    // writer-set, max enforced by platform_settings
  price_range_min_ngn: number    // minimum the writer will accept (NGN)
  price_range_max_ngn: number    // maximum the writer will accept (NGN)

  // ↓ bank details — excluded from all public queries
  bank_name: string
  bank_account_number: string
  bank_account_name: string

  // ↓ denormalized for directory listing performance
  completed_jobs_count: number   // default 0, incremented on project completion
  average_rating: number | null  // null until first rating, recomputed on new rating

  // ↓ verified badge status (set by admin via badge_applications flow)
  is_verified: boolean           // default false
  verified_at: string | null     // ISO timestamp, null until verified

  created_at: string
  updated_at: string
}

// ─── Client Profiles ────────────────────────────────────────────────────────

export interface ClientProfile {
  id: string                     // uuid, PK
  user_id: string                // FK → auth.users (unique)
  username: string               // unique, public-facing, visible to writers
  contact_email: string          // never shown to writers
  created_at: string
  updated_at: string
}

// ─── Categories ─────────────────────────────────────────────────────────────
// Config-driven, seeded with: Ghostwriting, Copywriting, Technical writing,
// Academic writing. Adding a category = row insert, not code change.

export interface Category {
  id: string                     // uuid, PK
  name: string
  slug: string                   // unique, URL-safe
  description: string | null
  is_active: boolean             // default true
  created_at: string
}

// ─── Writer ↔ Category (many-to-many) ───────────────────────────────────────

export interface WriterCategory {
  id: string                     // uuid, PK
  writer_id: string              // FK → writer_profiles
  category_id: string            // FK → categories
  // unique constraint on (writer_id, category_id)
  created_at: string
}

// ─── Portfolio Samples ──────────────────────────────────────────────────────
// OPEN QUESTION: spec says directory shows "portfolio samples" but doesn't
// detail the shape. Drafted as a separate table with multiple entries per
// writer. Confirm: are these text+link only, or can writers upload files
// (which would use Supabase Storage like project_files)?

export interface PortfolioSample {
  id: string                     // uuid, PK
  writer_id: string              // FK → writer_profiles
  title: string
  description: string | null
  external_url: string | null    // link to published work
  file_url: string | null        // Supabase Storage path if uploaded
  category_id: string | null     // FK → categories, optional tagging
  display_order: number          // for manual ordering on profile
  created_at: string
}

// ─── Job Postings ───────────────────────────────────────────────────────────

export interface JobPosting {
  id: string                     // uuid, PK
  client_id: string              // FK → client_profiles
  title: string
  description: string
  category_id: string            // FK → categories
  budget_ngn: number | null      // optional, client-set (NGN)
  status: JobPostingStatus       // default 'open'
  response_count: number         // denormalized, default 0
  max_responses: number          // copied from platform_settings at creation time
  response_deadline: string      // ISO timestamp, computed at creation
  created_at: string
  updated_at: string
}

// ─── Job Responses ──────────────────────────────────────────────────────────

export interface JobResponse {
  id: string                     // uuid, PK
  job_id: string                 // FK → job_postings
  writer_id: string              // FK → writer_profiles
  pitch_text: string
  proposed_price_ngn: number     // writer's proposed price (NGN)
  status: JobResponseStatus      // default 'pending'
  created_at: string
}

// ─── Projects ───────────────────────────────────────────────────────────────
// Created from Path A (direct contact → pending) or Path B (job selection →
// awaiting_payment). Writer is locked in at creation, no swapping.

export interface Project {
  id: string                     // uuid, PK
  job_id: string | null          // FK → job_postings (null if Path A)
  client_id: string              // FK → client_profiles
  writer_id: string              // FK → writer_profiles
  title: string
  description: string | null
  agreed_price_ngn: number | null // null during negotiation (pending status)
  status: ProjectStatus          // default depends on creation path
  writer_completed_at: string | null
  client_approved_at: string | null
  created_at: string
  updated_at: string
}

// ─── Messages ───────────────────────────────────────────────────────────────
// Supabase Realtime, scoped to a project. Flagged messages are not delivered
// to the recipient — they route to /admin/flags instead.

export interface Message {
  id: string                     // uuid, PK
  project_id: string             // FK → projects
  sender_id: string              // FK → auth.users
  content: string
  is_flagged: boolean            // default false, set by contact-scan before insert
  created_at: string
}

// ─── Message Flags ──────────────────────────────────────────────────────────
// Only flag type in the system. No polymorphic flagging.

export interface MessageFlag {
  id: string                     // uuid, PK
  message_id: string             // FK → messages (unique — one flag per message)
  matched_pattern: string        // what contact-scan.ts detected
  status: MessageFlagStatus      // default 'pending'
  reviewed_by: string | null     // FK → auth.users (admin)
  review_notes: string | null
  reviewed_at: string | null
  created_at: string
}

// ─── Project Files ──────────────────────────────────────────────────────────
// Separate upload flow on the project page, available once a writer is assigned.
// Access enforced in route handler via require-role.ts.

export interface ProjectFile {
  id: string                     // uuid, PK
  project_id: string             // FK → projects
  uploaded_by: string            // FK → auth.users
  file_name: string
  file_path: string              // path in Supabase Storage bucket
  file_size: number              // bytes
  mime_type: string
  created_at: string
}

// ─── Transactions (Escrow) ──────────────────────────────────────────────────
// Tracks the client's payment for a project through the escrow lifecycle.
// On release: commission deducted, net amount credited to writer's wallet.

export interface Transaction {
  id: string                     // uuid, PK
  project_id: string             // FK → projects (unique — one escrow per project)
  client_id: string              // FK → client_profiles
  writer_id: string              // FK → writer_profiles
  amount_ngn: number             // total amount charged to client
  commission_rate: number        // snapshot of rate at time of charge (e.g. 0.15)
  commission_amount_ngn: number  // amount × commission_rate
  writer_amount_ngn: number      // amount − commission
  status: TransactionStatus
  paystack_reference: string | null        // charge reference
  paystack_transfer_code: string | null    // transfer code for payout (if direct)
  released_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

// ─── Writer Wallets ─────────────────────────────────────────────────────────
// One wallet per writer. Balance is denormalized (source of truth is the
// wallet_transactions ledger, but cached here for fast reads).

export interface Wallet {
  id: string                     // uuid, PK
  writer_id: string              // FK → writer_profiles (unique)
  balance_ngn: number            // current available balance, default 0
  total_earned_ngn: number       // lifetime earnings (after commission), default 0
  total_withdrawn_ngn: number    // lifetime withdrawals, default 0
  created_at: string
  updated_at: string
}

// ─── Wallet Transactions (Ledger) ───────────────────────────────────────────
// Every credit/debit to a writer's wallet. The wallet balance should always
// equal the sum of credits minus debits in this ledger.

export interface WalletTransaction {
  id: string                     // uuid, PK
  wallet_id: string              // FK → wallets
  type: WalletTransactionType
  amount_ngn: number             // always positive; type indicates direction
  description: string
  reference_type: WalletTransactionReference
  reference_id: string | null    // FK to project or payout, depending on reference_type
  balance_after_ngn: number      // wallet balance after this transaction
  created_at: string
}

// ─── Payouts (Withdrawals) ──────────────────────────────────────────────────
// Writer requests withdrawal from wallet → bank transfer via Paystack.

export interface Payout {
  id: string                     // uuid, PK
  writer_id: string              // FK → writer_profiles
  wallet_id: string              // FK → wallets
  amount_ngn: number
  status: PayoutStatus           // default 'pending'
  bank_name: string              // snapshot from writer_profiles at request time
  bank_account_number: string    // snapshot
  bank_account_name: string      // snapshot
  paystack_transfer_code: string | null
  paystack_reference: string | null
  requested_at: string
  processed_at: string | null
  created_at: string
}

// ─── Ratings & Reviews ──────────────────────────────────────────────────────
// Only allowed after a project is completed with a verified transaction.
// One rating per project, from client to writer.

export interface RatingReview {
  id: string                     // uuid, PK
  project_id: string             // FK → projects (unique — one review per project)
  client_id: string              // FK → client_profiles
  writer_id: string              // FK → writer_profiles
  rating: number                 // 1–5 integer
  review_text: string | null
  created_at: string
}

// ─── Badge Applications ─────────────────────────────────────────────────────
// Writer applies for verified badge. Admin reviews manually.
// On approval: writer_profiles.is_verified = true, verified_at = now()
// Both updates MUST happen in a single database transaction.

export interface BadgeApplication {
  id: string                     // uuid, PK
  writer_id: string              // FK → writer_profiles
  portfolio_notes: string        // whatever the writer submits with the application
  status: BadgeApplicationStatus // default 'pending'
  reviewer_id: string | null     // FK → auth.users (admin), null until reviewed
  review_notes: string | null
  submitted_at: string
  decided_at: string | null
}

// ─── Disputes ───────────────────────────────────────────────────────────────
// Client flags a dispute on a project with held funds. Every dispute routes
// to a manual admin decision. No automated resolution.

export interface Dispute {
  id: string                     // uuid, PK
  project_id: string             // FK → projects (unique — one dispute per project)
  initiated_by: string           // FK → auth.users (typically the client)
  reason: string
  status: DisputeResolution      // default 'open'
  admin_id: string | null        // FK → auth.users (admin who resolved)
  admin_notes: string | null
  resolution_amount_ngn: number | null  // for partial resolutions only
  created_at: string
  resolved_at: string | null
}

// ─── Platform Settings ──────────────────────────────────────────────────────
// Global config values, managed from /admin. Key-value store.
// Expected keys at launch:
//   min_writer_price_ngn       — floor for writer price range
//   max_writer_price_ngn       — ceiling for writer price range
//   min_client_budget_ngn      — floor for client job budget
//   max_client_budget_ngn      — ceiling for client job budget
//   commission_rate            — e.g. "0.15" (15%)
//   max_writer_response_time_hours — ceiling for writer response_time_hours (48)
//   job_response_window_hours  — how long a job posting stays open for responses
//   max_job_responses          — cap on responses per job posting (5)

export interface PlatformSetting {
  id: string                     // uuid, PK
  key: string                    // unique
  value: string                  // stored as string, parsed by application code
  description: string | null
  updated_at: string
  updated_by: string | null      // FK → auth.users (admin who last changed it)
}
