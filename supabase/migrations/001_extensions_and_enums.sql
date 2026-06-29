-- 001: Extensions and custom enum types
-- Run this first — everything else depends on these types.

create extension if not exists "pgcrypto";

-- User roles (set in auth.users.raw_user_meta_data at signup)
create type user_role as enum ('writer', 'client', 'admin');

-- Project lifecycle
create type project_status as enum (
  'pending',           -- Path A: direct contact, no terms agreed yet
  'awaiting_payment',  -- terms agreed, waiting for client to pay
  'active',            -- payment received (held in escrow), work in progress
  'writer_completed',  -- writer marked deliverable as done
  'completed',         -- client approved, payment released to writer wallet
  'disputed',          -- client flagged a dispute while funds are held
  'cancelled'          -- abandoned before or after payment
);

-- Escrow payment lifecycle
create type transaction_status as enum (
  'pending',             -- Paystack charge initiated, not yet confirmed
  'held',                -- Paystack confirmed, funds in escrow
  'released',            -- client approved, commission deducted, net credited to wallet
  'refunded',            -- full refund to client
  'partially_released'   -- dispute resolved with partial split
);

create type job_posting_status as enum ('open', 'closed', 'filled');

create type job_response_status as enum ('pending', 'accepted', 'rejected');

create type message_flag_status as enum ('pending', 'released', 'edit_requested', 'escalated');

create type badge_application_status as enum ('pending', 'approved', 'rejected');

create type dispute_resolution as enum (
  'open',
  'resolved_writer',    -- full release to writer
  'resolved_client',    -- full refund to client
  'resolved_partial'    -- split — see resolution_amount_ngn
);

create type payout_status as enum ('pending', 'processing', 'completed', 'failed');

create type wallet_transaction_type as enum ('credit', 'debit');

create type wallet_transaction_reference as enum (
  'project_payment',  -- credit: money released from completed project
  'withdrawal',       -- debit: writer withdrew to bank
  'refund'            -- debit: reversal due to dispute
);
