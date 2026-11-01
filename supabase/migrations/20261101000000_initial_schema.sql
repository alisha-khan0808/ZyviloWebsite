-- Zyvilo — initial schema, RLS policies and lead-intake function.
-- Mirrors src/types/index.ts and src/lib/auth/permissions.ts. Keep in sync.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('owner', 'admin', 'sales', 'content_editor');
create type public.lead_status as enum ('new','contacted','qualified','discovery_scheduled','proposal_sent','won','lost','nurture','spam','archived');
create type public.lead_priority as enum ('low', 'medium', 'high');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (admin users; provisioned by invitation only)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role public.app_role not null default 'sales',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Role helpers used by RLS (security definer avoids recursive policy evaluation on profiles).
create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.has_perm(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.current_app_role()
    when 'owner' then true
    when 'admin' then true
    when 'sales' then perm in ('leads:read','leads:write','leads:export','analytics:read')
    when 'content_editor' then perm in ('content:write')
    else false
  end
$$;

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  idempotency_key uuid not null unique,
  form_type text not null check (form_type in ('quick','discovery')),
  contact_name text not null,
  email text,
  phone text,
  company text,
  website text,
  industry text,
  industry_other text,
  country text,
  message text,
  service_interest text,
  status public.lead_status not null default 'new',
  owner_id uuid references public.profiles(id) on delete set null,
  priority public.lead_priority not null default 'medium',
  qualification_score smallint check (qualification_score between 0 and 100),
  next_contact_at timestamptz,
  first_contacted_at timestamptz,
  source text not null default 'direct',
  source_page text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  privacy_consent_at timestamptz not null,
  privacy_consent_version text not null,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_contact_required check (email is not null or phone is not null)
);
create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);
create index leads_owner_idx on public.leads (owner_id);
create index leads_industry_idx on public.leads (industry);
create index leads_source_idx on public.leads (source);
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();

create table public.lead_requirements (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  solution_types text[] not null default '{}',
  pain_points text[] not null default '{}',
  pain_points_other text,
  current_process text,
  desired_outcome text,
  current_tools text[] not null default '{}',
  current_tools_other text,
  example_steps text,
  integrations text,
  business_size text,
  volume_range text,
  budget_range text,
  timeline text,
  api_access text,
  human_approval text,
  sensitive_data_flag text,
  contact_preference text,
  contact_time text
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lead_notes_lead_idx on public.lead_notes (lead_id);

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index lead_activities_lead_idx on public.lead_activities (lead_id, created_at desc);

create table public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  title text not null,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lead_tasks_lead_idx on public.lead_tasks (lead_id);
create index lead_tasks_assignee_idx on public.lead_tasks (assignee_id);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  kind text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  attempts int not null default 0,
  last_error text,
  next_retry_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notification_outbox_due_idx on public.notification_outbox (status, next_retry_at);
create trigger outbox_touch before update on public.notification_outbox for each row execute function public.touch_updated_at();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- CMS
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  summary text not null default '',
  body text not null default '',
  example text not null default '',
  icon text not null default 'Sparkles',
  category text not null default 'agent',
  flagship boolean not null default false,
  problems text[] not null default '{}',
  capabilities text[] not null default '{}',
  scenarios text[] not null default '{}',
  integrations text[] not null default '{}',
  workflow_json jsonb not null default '[]',
  seo_json jsonb not null default '{}',
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.industries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null default 'Sparkles',
  summary text not null default '',
  pain_point text not null default '',
  sample_solution text not null default '',
  outcome text not null default '',
  pain_points_json jsonb not null default '[]',
  integrations text[] not null default '{}',
  outcomes text[] not null default '{}',
  solution_slugs text[] not null default '{}',
  workflow_json jsonb not null default '[]',
  seo_json jsonb not null default '{}',
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  draft_json jsonb not null,
  published_json jsonb not null,
  seo_json jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  scope text not null default 'home',
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
create index faqs_scope_idx on public.faqs (scope);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  attribution text not null,
  company text,
  consent_record text not null check (char_length(consent_record) > 0),
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client text not null,
  summary text not null default '',
  challenge text not null default '',
  solution text not null default '',
  outcome text not null default '',
  permission_record text not null check (char_length(permission_record) > 0),
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.site_settings (
  key text primary key,
  value_json jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text not null,
  mime text not null,
  size int not null,
  alt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

do $$
declare t text;
begin
  foreach t in array array['services','industries','pages','faqs','testimonials','case_studies','site_settings','media','lead_notes','lead_tasks']
  loop
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_requirements enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_activities enable row level security;
alter table public.lead_tasks enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.audit_logs enable row level security;
alter table public.services enable row level security;
alter table public.industries enable row level security;
alter table public.pages enable row level security;
alter table public.faqs enable row level security;
alter table public.testimonials enable row level security;
alter table public.case_studies enable row level security;
alter table public.site_settings enable row level security;
alter table public.media enable row level security;

-- Profiles: everyone signed in sees the team list (names for owners/assignees); only team managers change it.
create policy profiles_read on public.profiles for select to authenticated using (public.current_app_role() is not null);
create policy profiles_manage on public.profiles for update to authenticated
  using (public.has_perm('team:manage') and id <> auth.uid() and (role <> 'owner' or public.current_app_role() = 'owner'))
  with check (public.has_perm('team:manage') and (role <> 'owner' or public.current_app_role() = 'owner'));

-- Leads & children: no anonymous access at all (public intake goes through the server + service role).
create policy leads_read on public.leads for select to authenticated using (public.has_perm('leads:read'));
create policy leads_update on public.leads for update to authenticated using (public.has_perm('leads:write')) with check (public.has_perm('leads:write'));
create policy leads_delete on public.leads for delete to authenticated using (public.has_perm('leads:delete'));

create policy req_read on public.lead_requirements for select to authenticated using (public.has_perm('leads:read'));

create policy notes_read on public.lead_notes for select to authenticated using (public.has_perm('leads:read'));
create policy notes_insert on public.lead_notes for insert to authenticated with check (public.has_perm('leads:write') and author_id = auth.uid());

create policy act_read on public.lead_activities for select to authenticated using (public.has_perm('leads:read'));
create policy act_insert on public.lead_activities for insert to authenticated with check (public.has_perm('leads:write') and actor_id = auth.uid());

create policy tasks_read on public.lead_tasks for select to authenticated using (public.has_perm('leads:read'));
create policy tasks_write on public.lead_tasks for all to authenticated using (public.has_perm('leads:write')) with check (public.has_perm('leads:write'));

create policy outbox_read on public.notification_outbox for select to authenticated using (public.has_perm('settings:write'));
create policy outbox_update on public.notification_outbox for update to authenticated using (public.has_perm('settings:write'));

create policy audit_read on public.audit_logs for select to authenticated using (public.has_perm('audit:read'));
create policy audit_insert on public.audit_logs for insert to authenticated with check (actor_id = auth.uid() and public.current_app_role() is not null);

-- CMS: public reads only published rows; editors read/write everything (drafts + preview).
do $$
declare t text;
begin
  foreach t in array array['services','industries','faqs','testimonials','case_studies']
  loop
    execute format('create policy %I_public_read on public.%I for select to anon, authenticated using (published)', t, t);
    execute format('create policy %I_editor_all on public.%I for all to authenticated using (public.has_perm(''content:write'')) with check (public.has_perm(''content:write''))', t, t);
  end loop;
end $$;

-- Pages: anon may read rows but should only use published_json; draft_json is hidden via a column grant below.
create policy pages_public_read on public.pages for select to anon, authenticated using (true);
create policy pages_editor_write on public.pages for all to authenticated using (public.has_perm('content:write')) with check (public.has_perm('content:write'));
revoke select on public.pages from anon;
grant select (id, slug, published_json, seo_json, published_at, updated_at) on public.pages to anon;

create policy settings_public_read on public.site_settings for select to anon, authenticated using (is_public or public.has_perm('settings:write'));
create policy settings_editor_write on public.site_settings for all to authenticated
  using ((is_public and public.has_perm('content:write')) or public.has_perm('settings:write'))
  with check ((is_public and public.has_perm('content:write')) or public.has_perm('settings:write'));

create policy media_read on public.media for select to authenticated using (public.has_perm('content:write'));
create policy media_write on public.media for all to authenticated using (public.has_perm('content:write')) with check (public.has_perm('content:write'));

-- ---------------------------------------------------------------------------
-- Transactional, idempotent lead intake (called by the server with the service role only)
-- ---------------------------------------------------------------------------
create or replace function public.submit_lead(p_lead jsonb, p_requirements jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_lead public.leads;
begin
  select * into v_lead from public.leads where idempotency_key = (p_lead->>'idempotency_key')::uuid;
  if found then
    return jsonb_build_object('lead', to_jsonb(v_lead), 'duplicate', true);
  end if;

  insert into public.leads
  select * from jsonb_populate_record(null::public.leads,
    p_lead || jsonb_build_object('id', gen_random_uuid(), 'created_at', now(), 'updated_at', now()))
  returning * into v_lead;

  if p_requirements is not null then
    insert into public.lead_requirements
    select * from jsonb_populate_record(null::public.lead_requirements, p_requirements || jsonb_build_object('lead_id', v_lead.id));
  end if;

  insert into public.lead_activities (lead_id, event_type, metadata)
  values (v_lead.id, 'lead_submitted', jsonb_build_object('form_type', v_lead.form_type, 'source', v_lead.source));

  insert into public.notification_outbox (lead_id, kind, next_retry_at) values (v_lead.id, 'new_lead_admin', now());

  return jsonb_build_object('lead', to_jsonb(v_lead), 'duplicate', false);
exception when unique_violation then
  -- Concurrent double-submit with the same idempotency key.
  select * into v_lead from public.leads where idempotency_key = (p_lead->>'idempotency_key')::uuid;
  return jsonb_build_object('lead', to_jsonb(v_lead), 'duplicate', true);
end $$;

revoke all on function public.submit_lead(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.submit_lead(jsonb, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket for published site images; writes via server (service role) only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;
