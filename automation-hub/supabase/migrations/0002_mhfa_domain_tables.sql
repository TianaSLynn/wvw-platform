-- WVW Automation Hub — MHFA domain tables (learners, sessions, registrations, payments)
-- NOT YET APPLIED. Field names deliberately mirror the real live Netlify form fields
-- recorded in docs/FORM_REGISTRY.md and the Notion TRAIN OS™ concepts, to minimize
-- translation drift when the Notion integration package is built.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_type text,
  website text,
  city text,
  state text,
  notion_page_id text,                    -- TRAIN-03 equivalent, once confirmed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  job_title text,
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists learners (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text not null,
  mhfa_connect_email text,
  phone text,
  organization_id uuid references organizations(id),
  job_title text,
  language_preference text not null default 'en' check (language_preference in ('en','es')),
  notion_page_id text,                    -- TRAIN-01 equivalent, once confirmed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  session_code text not null unique,
  course_type text,
  delivery_format text,
  session_date date,
  session_time text,
  capacity int,
  status text not null default 'scheduled' check (status in ('scheduled','full','completed','cancelled')),
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  learner_id uuid not null references learners(id),
  session_id uuid references sessions(id),
  organization_id uuid references organizations(id),
  source_form text not null,              -- e.g. 'mhfa-individual-registration' or 'FORM-MHFA-001'
  source_site text not null,              -- 'wholisticvibeswellness.com' | 'wvwacademy.com'
  payment_status text not null default 'pending'
    check (payment_status in ('pending','initiated','awaiting_verification','paid','failed','refunded')),
  attendance_status text,
  prework_status text,
  postwork_status text,
  certificate_eligibility text default 'not_eligible'
    check (certificate_eligibility in ('not_eligible','eligible','issued','blocked')),
  accommodation_requested boolean not null default false,
  notion_page_id text,                    -- TRAIN-05 equivalent, once confirmed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_registrations_learner on registrations(learner_id);
create index if not exists idx_registrations_session on registrations(session_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations(id),
  correlation_id text not null,
  provider text not null default 'wave',
  wave_invoice_id text,
  wave_transaction_id text,
  amount numeric,
  currency text default 'USD',
  status text not null default 'pending'
    check (status in ('pending','paid','failed','refunded','unmatched')),
  evidence_source text,                   -- 'wave_webhook' | 'wave_api' | 'manual_reconciliation'
  reconciliation_status text not null default 'unreconciled'
    check (reconciliation_status in ('unreconciled','reconciled','exception')),
  notion_page_id text,                    -- TRAIN-06 equivalent, once confirmed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payments_registration on payments(registration_id);

create table if not exists form_registry (
  id uuid primary key default gen_random_uuid(),
  form_name text not null unique,          -- matches Netlify form `name` exactly
  site text not null,
  page text,
  purpose text,
  service_line text,
  automation_code text,
  data_classification text not null default 'internal'
    check (data_classification in ('public','internal','confidential','restricted')),
  active boolean not null default true,
  version text not null default '1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['organizations','contacts','learners','sessions','registrations','payments','form_registry']
  loop
    execute format('drop trigger if exists trg_set_updated_at on %I', t);
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;
