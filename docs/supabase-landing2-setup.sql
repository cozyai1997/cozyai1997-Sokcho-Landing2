create table if not exists public.sokcho_landing2_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  type text not null,
  visit_date date not null,
  visit_time text not null,
  created_at timestamptz not null default now(),
  source text not null default 'landing2-resort-magazine',
  sms_status text not null default 'not_configured'
    check (sms_status = any (array['not_configured', 'pending', 'sent', 'failed', 'skipped'])),
  sms_sent_at timestamptz,
  sms_error text,
  sms_message_id text
);

comment on table public.sokcho_landing2_leads is 'Sokcho-Landing2 resort magazine landing page visit reservations';

create index if not exists sokcho_landing2_leads_created_at_idx
  on public.sokcho_landing2_leads (created_at desc);

create index if not exists sokcho_landing2_leads_phone_idx
  on public.sokcho_landing2_leads (phone);

alter table public.sokcho_landing2_leads enable row level security;

create table if not exists public.sokcho_landing2_sms_settings (
  id text primary key default 'default' check (id = 'default'),
  enabled boolean not null default false,
  subject text not null default '속초 중앙하이츠 THE 228 방문예약',
  body_template text not null default '안녕하세요, {{name}} 고객님
속초 중앙하이츠 THE 228 입니다.
방문 날짜/일정 : {{visitDate}} {{visitTime}}
모델하우스를 방문하셔서, 해당 문자 메시지를 보여주시면 친절히 안내 및 상담 도와드리겠습니다.
감사합니다.',
  image_id text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.sokcho_landing2_sms_settings enable row level security;

insert into public.sokcho_landing2_sms_settings (id, enabled, subject, body_template, image_id)
values (
  'default',
  false,
  '속초 중앙하이츠 THE 228 방문예약',
  '안녕하세요, {{name}} 고객님
속초 중앙하이츠 THE 228 입니다.
방문 날짜/일정 : {{visitDate}} {{visitTime}}
모델하우스를 방문하셔서, 해당 문자 메시지를 보여주시면 친절히 안내 및 상담 도와드리겠습니다.
감사합니다.',
  ''
)
on conflict (id) do nothing;
