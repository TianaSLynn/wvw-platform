-- WVW Automation Hub — core cross-cutting tables
-- NOT YET APPLIED to any Supabase project (see docs/DECISION_REGISTER.md, Decision 6).
-- Drafted against the target architecture in the assignment spec + the existing
-- Notion TRAIN OS™ concepts (TRAIN-07 execution log, TRAIN-18 exceptions) so the
-- Notion integration package can map cleanly onto both.

create extension if not exists "pgcrypto";

create table if not exists automation_events (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null unique,
  event_type text not null,
  event_version text not null default '1',
  source_system text not null,
  source_form text,
  source_record_id text,
  submitted_at timestamptz,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received'
    check (status in (
      'received','validating','rejected','duplicate','queued','processing',
      'awaiting_external_system','awaiting_payment','awaiting_human_review',
      'draft_created','completed','completed_with_warning',
      'failed_retryable','failed_terminal','cancelled'
    )),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  service_line text,
  organization_id uuid,
  contact_id uuid,
  learner_id uuid,
  session_id uuid,
  registration_id uuid,
  payment_id uuid,
  payload jsonb not null,               -- governed/redacted payload only; never raw restricted narrative text
  payload_hash text not null,
  consent jsonb default '{}'::jsonb,
  language text not null default 'en' check (language in ('en','es')),
  data_classification text not null default 'internal'
    check (data_classification in ('public','internal','confidential','restricted')),
  retry_count int not null default 0,
  next_retry_at timestamptz,
  manual_review_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_automation_events_status on automation_events(status);
create index if not exists idx_automation_events_correlation on automation_events(correlation_id);
create index if not exists idx_automation_events_source_form on automation_events(source_form);

create table if not exists workflow_executions (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  automation_code text not null,        -- e.g. MHFA-REG-01
  workflow_version text not null default '1',
  status text not null default 'received',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms int,
  current_step text,
  trigger text,
  input_snapshot jsonb,
  output_snapshot jsonb,
  error_code text,
  error_summary text,
  retryable boolean not null default false,
  retry_count int not null default 0,
  environment text not null default 'development' check (environment in ('development','staging','production')),
  release_sha text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_workflow_executions_correlation on workflow_executions(correlation_id);
create index if not exists idx_workflow_executions_automation_code on workflow_executions(automation_code);

create table if not exists integration_mappings (
  id uuid primary key default gen_random_uuid(),
  internal_entity_id uuid not null,
  entity_type text not null,
  external_platform text not null check (external_platform in ('notion','wave','apollo','microsoft','netlify','github')),
  external_id text not null,
  external_parent_id text,
  mapping_status text not null default 'active' check (mapping_status in ('active','stale','broken')),
  last_synced_at timestamptz,
  sync_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, external_platform, external_id)
);

create table if not exists automation_exceptions (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  automation_code text not null,
  exception_type text not null,          -- e.g. 'Missing Merge Field'
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  summary text not null,
  technical_detail text,
  affected_entity text,
  external_platform text,
  retryable boolean not null default false,
  resolution_status text not null default 'open' check (resolution_status in ('open','in_progress','resolved','wont_fix')),
  owner text,
  due_date date,
  resolution_date date,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_automation_exceptions_status on automation_exceptions(resolution_status);

create table if not exists communications_queue (
  id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  communication_code text not null,
  recipient_identity text not null,
  language text not null default 'en' check (language in ('en','es')),
  organization_id uuid,
  learner_id uuid,
  template_key text not null,
  template_version text not null default '1',
  required_merge_fields text[] not null default '{}',
  merge_values jsonb not null default '{}'::jsonb,
  subject text,
  body_text text,
  body_html text,
  delivery_mode text not null default 'outlook_draft' check (delivery_mode in ('outlook_draft','outlook_send')),
  requested_action text not null default 'draft' check (requested_action in ('draft','send')),
  approval_status text not null default 'pending_review' check (approval_status in ('pending_review','approved','rejected')),
  outlook_draft_id text,
  outlook_sent_message_id text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dashboard_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  metric_code text not null,
  metric_category text not null,
  numeric_value numeric,
  text_value text,
  dimensions jsonb default '{}'::jsonb,
  source_query_version text,
  calculated_at timestamptz not null default now(),
  unique (metric_date, metric_code, dimensions)
);

create table if not exists feature_flags (
  key text primary key,
  description text,
  enabled boolean not null default false,   -- governance rule 30: default inactive
  environment text not null default 'development',
  updated_at timestamptz not null default now()
);

-- updated_at triggers
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['automation_events','workflow_executions','integration_mappings',
                            'automation_exceptions','communications_queue','feature_flags']
  loop
    execute format('drop trigger if exists trg_set_updated_at on %I', t);
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;
