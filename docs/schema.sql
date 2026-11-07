-- REFERENCE ONLY (not executed). Target schema for the Supabase phase; mirrors src/domain/types.ts.
-- Principles: private by default; owner-only RLS; anon never reads tables (shares go through get_shared()).

create type verdict as enum ('loved','liked','fine','skip');
create type value_rating as enum ('great','fair','overpriced');
create type visibility as enum ('private','link','friends');

create table profiles (id uuid primary key references auth.users on delete cascade, display_name text not null);

create table places (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique not null,
  name text not null, address text not null,
  lat double precision not null, lng double precision not null,
  neighborhood text, cuisine text, price_level smallint check (price_level between 1 and 4),
  snapshot_at timestamptz not null default now()
);

create table visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade default auth.uid(),
  place_id uuid not null references places,
  visited_on date not null default current_date,
  verdict verdict not null, value value_rating,
  order_the text not null default '', skip_the text not null default '', tip text not null default '',
  private_note text not null default '',          -- never returned by get_shared()
  visibility visibility not null default 'private',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table visit_dishes (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references visits on delete cascade,
  name text not null, verdict verdict, order_again boolean not null default false, photo_id uuid
);

create table occasions (id uuid primary key default gen_random_uuid(), user_id uuid references profiles, name text not null);
create table visit_occasions (visit_id uuid references visits on delete cascade, occasion_id uuid references occasions, primary key (visit_id, occasion_id));

create table lists (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles default auth.uid(), name text not null, position int not null);
create table list_items (id uuid primary key default gen_random_uuid(), list_id uuid not null references lists on delete cascade, place_id uuid not null references places, position int not null, note text not null default '');

create table shares (
  token text primary key,                          -- 128-bit random, hex
  user_id uuid not null references profiles default auth.uid(),
  kind text not null check (kind in ('place','list')), target_id uuid not null,
  show_photos boolean not null default true, show_tips boolean not null default true,
  revoked_at timestamptz, created_at timestamptz not null default now()
);

create table friendships (id uuid primary key default gen_random_uuid(), requester_id uuid not null references profiles, addressee_id uuid not null references profiles, status text not null default 'pending');

-- RLS: deny by default, owner-only.
alter table visits enable row level security;
create policy visits_owner on visits for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Repeat the owner policy for visit_dishes (via visits), lists, list_items (via lists), shares, occasions.
alter table places enable row level security;
create policy places_read on places for select to authenticated using (true);  -- writes server-side only

-- Public share path: the only function granted to anon.
-- create function get_shared(p_token text) returns jsonb security definer ... checks revoked_at is null and
-- returns a whitelisted payload (no private_note). Mirrors src/domain/share.ts.
