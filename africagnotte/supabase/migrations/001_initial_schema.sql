-- =====================================================
-- AfriCagnotte — Schéma Supabase complet
-- Exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- recherche full-text

-- ─── Profils utilisateurs ────────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  full_name    text not null,
  avatar_url   text,
  phone        text,
  country      text default 'CM',
  city         text,
  bio          text,
  verified     boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── Cagnottes ───────────────────────────────────────────────────────────────
create table if not exists campaigns (
  id                     uuid primary key default uuid_generate_v4(),
  organizer_id           uuid not null references profiles(id) on delete restrict,
  title                  text not null,
  slug                   text unique not null,
  description            text not null,
  category               text not null check (category in ('Santé','Éducation','Business','Urgence','Culture','Environnement','Religion','Autre')),
  country                text not null,
  city                   text,
  goal_amount            numeric(14,2) not null check (goal_amount >= 1000),
  raised_amount          numeric(14,2) not null default 0,
  withdrawn_amount       numeric(14,2) not null default 0,
  currency               text not null default 'XAF' check (currency in ('XAF','CDF','EUR','USD')),
  donor_count            integer not null default 0,
  view_count             integer not null default 0,
  cover_emoji            text default '🌍',
  cover_image_url        text,
  status                 text not null default 'pending_review'
                           check (status in ('pending_review','active','ended','suspended','deleted')),
  end_date               timestamptz,
  ended_at               timestamptz,
  goal_reached_at        timestamptz,
  withdrawal_phone       text,
  withdrawal_operator    text check (withdrawal_operator in ('MTN','ORANGE','AIRTEL','MOOV')),
  withdrawal_country_code text default '+237',
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Index de recherche
create index if not exists campaigns_status_idx  on campaigns(status);
create index if not exists campaigns_country_idx on campaigns(country);
create index if not exists campaigns_category_idx on campaigns(category);
create index if not exists campaigns_organizer_idx on campaigns(organizer_id);
create index if not exists campaigns_title_search_idx on campaigns using gin(title gin_trgm_ops);

-- ─── Transactions ─────────────────────────────────────────────────────────────
create table if not exists transactions (
  id                   uuid primary key default uuid_generate_v4(),
  transaction_id       text unique not null,
  campaign_id          uuid not null references campaigns(id) on delete restrict,
  amount               numeric(14,2) not null check (amount >= 100),
  fees                 numeric(14,2) not null default 0,
  net_amount           numeric(14,2) not null,
  currency             text not null default 'XAF',
  donor_name           text not null,
  donor_surname        text,
  donor_email          text not null,
  donor_phone          text,
  donor_country        text default 'CM',
  payment_method       text not null check (payment_method in ('mtn','orange','airtel','moov','card')),
  payment_method_detail text,
  anonymous            boolean default false,
  message              text,
  status               text not null default 'pending'
                         check (status in ('pending','completed','failed','cancelled','refunded')),
  pay_token            text,
  cinetpay_status      text,
  error_message        text,
  reconciled_at        timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create index if not exists transactions_campaign_idx on transactions(campaign_id);
create index if not exists transactions_status_idx   on transactions(status);
create index if not exists transactions_email_idx    on transactions(donor_email);
create index if not exists transactions_created_idx  on transactions(created_at desc);

-- ─── Dons publics (après confirmation) ───────────────────────────────────────
create table if not exists donations (
  id             uuid primary key default uuid_generate_v4(),
  campaign_id    uuid not null references campaigns(id) on delete cascade,
  transaction_id uuid references transactions(id) on delete set null,
  amount         numeric(14,2) not null,
  currency       text not null default 'XAF',
  donor_name     text,
  donor_email    text,
  anonymous      boolean default false,
  message        text,
  created_at     timestamptz default now()
);

create index if not exists donations_campaign_idx on donations(campaign_id);
create index if not exists donations_created_idx  on donations(created_at desc);

-- ─── Retraits ────────────────────────────────────────────────────────────────
create table if not exists withdrawals (
  id             uuid primary key default uuid_generate_v4(),
  transaction_id text unique not null,
  campaign_id    uuid not null references campaigns(id),
  organizer_id   uuid not null references profiles(id),
  amount         numeric(14,2) not null,
  currency       text not null default 'XAF',
  phone          text not null,
  operator       text,
  status         text not null default 'pending'
                   check (status in ('pending','processing','completed','failed')),
  cinetpay_ref   text,
  error          text,
  created_at     timestamptz default now()
);

-- ─── Logs agents ──────────────────────────────────────────────────────────────
create table if not exists agent_logs (
  id          uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade,
  event       text not null,
  metadata    jsonb,
  created_at  timestamptz default now()
);

create index if not exists agent_logs_event_idx on agent_logs(event);

-- ─── Signalements fraude ─────────────────────────────────────────────────────
create table if not exists fraud_flags (
  id          uuid primary key default uuid_generate_v4(),
  donor_email text,
  reason      text,
  flagged_at  timestamptz default now(),
  resolved    boolean default false
);

-- ─── Stats globales ───────────────────────────────────────────────────────────
create table if not exists platform_stats (
  id               text primary key default 'global',
  total_campaigns  integer default 0,
  active_campaigns integer default 0,
  total_raised     numeric(16,2) default 0,
  updated_at       timestamptz default now()
);
insert into platform_stats(id) values('global') on conflict do nothing;

-- ─── Fonction détection fraude (appelée par l'agent) ─────────────────────────
create or replace function detect_suspicious_donations(p_since timestamptz, p_threshold int)
returns table(donor_email text, count bigint) language sql as $$
  select donor_email, count(*) as count
  from transactions
  where created_at >= p_since
    and status in ('pending','completed')
  group by donor_email
  having count(*) >= p_threshold;
$$;

-- ─── RLS Policies ─────────────────────────────────────────────────────────────
alter table profiles   enable row level security;
alter table campaigns  enable row level security;
alter table transactions enable row level security;
alter table donations  enable row level security;
alter table withdrawals enable row level security;

-- Profils: chacun voit/modifie le sien
create policy "Profil visible par tous" on profiles for select using (true);
create policy "Profil modifiable par le propriétaire" on profiles for update using (auth.uid() = id);
create policy "Profil créable par le propriétaire" on profiles for insert with check (auth.uid() = id);

-- Cagnottes: lecture publique (actives), écriture par organisateur
create policy "Cagnottes publiques lisibles" on campaigns for select using (status != 'deleted');
create policy "Cagnotte créable par authentifié" on campaigns for insert with check (auth.uid() = organizer_id);
create policy "Cagnotte modifiable par organisateur" on campaigns for update using (auth.uid() = organizer_id);

-- Dons: lecture publique
create policy "Dons lisibles par tous" on donations for select using (true);

-- Transactions: uniquement le donateur
create policy "Transaction visible par donateur" on transactions for select using (donor_email = (select email from profiles where id = auth.uid()));

-- Retraits: uniquement l'organisateur
create policy "Retrait visible par organisateur" on withdrawals for select using (auth.uid() = organizer_id);

-- Note: Le service_key backend bypass les RLS (normal pour le backend)
