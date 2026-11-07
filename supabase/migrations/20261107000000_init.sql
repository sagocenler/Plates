-- Plates: initial schema.
-- Principles: private by default; owner-only RLS on every user table; anonymous visitors can read
-- nothing directly and only reach shared content through get_shared() (which never returns private notes).

create type public.verdict as enum ('loved', 'liked', 'fine', 'skip');
create type public.value_rating as enum ('great', 'fair', 'overpriced');
create type public.visibility as enum ('private', 'link', 'friends');
create type public.share_kind as enum ('place', 'list');
create type public.friendship_status as enum ('pending', 'accepted');

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- Restaurant snapshots (public business info, not user data). Written only through ensure_place().
create table public.places (
  id uuid primary key default gen_random_uuid(),
  google_place_id text not null unique,
  name text not null,
  address text not null default '',
  lat double precision not null,
  lng double precision not null,
  neighborhood text not null default '',
  cuisine text not null default '',
  price_level smallint check (price_level between 1 and 4),
  snapshot_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  storage_path text not null unique,
  width int,
  height int,
  created_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  place_id uuid not null references public.places,
  visited_on date not null default current_date,
  verdict public.verdict not null,
  value public.value_rating,
  order_the text not null default '',
  skip_the text not null default '',
  tip text not null default '',
  private_note text not null default '',            -- never returned by get_shared()
  occasions text[] not null default '{}',
  visibility public.visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index visits_user_date_idx on public.visits (user_id, visited_on desc);
create index visits_place_idx on public.visits (place_id);

create table public.visit_dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  visit_id uuid not null references public.visits on delete cascade,
  name text not null,
  verdict public.verdict,
  order_again boolean not null default false,
  photo_id uuid references public.photos on delete set null,
  position int not null default 0
);
create index visit_dishes_visit_idx on public.visit_dishes (visit_id);

create table public.visit_photos (
  visit_id uuid not null references public.visits on delete cascade,
  photo_id uuid not null references public.photos on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  position int not null default 0,
  primary key (visit_id, photo_id)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  list_id uuid not null references public.lists on delete cascade,
  place_id uuid not null references public.places,
  position int not null default 0,
  note text not null default '',
  unique (list_id, place_id)
);

create table public.want_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  place_id uuid not null references public.places,
  note text not null default '',
  added_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create table public.shares (
  token text primary key check (token ~ '^[0-9a-f]{32}$'),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind public.share_kind not null,
  target_id uuid not null,
  show_photos boolean not null default true,
  show_tips boolean not null default true,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index shares_target_idx on public.shares (target_id);
create index shares_user_idx on public.shares (user_id);

-- Social phase: modelled now, no UI yet.
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references public.profiles on delete cascade,
  addressee_id uuid not null references public.profiles on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
create index friendships_addressee_idx on public.friendships (addressee_id);

-- ---------------------------------------------------------------- triggers

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger visits_updated_at before update on public.visits
  for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- row level security

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.photos enable row level security;
alter table public.visits enable row level security;
alter table public.visit_dishes enable row level security;
alter table public.visit_photos enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.want_items enable row level security;
alter table public.shares enable row level security;
alter table public.friendships enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Restaurant info is public business data: any signed-in user may read it. No direct writes.
create policy places_select on public.places for select to authenticated using (true);

create policy photos_owner on public.photos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy visits_owner on public.visits for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Child rows: owned by the user AND attached to a parent the user owns.
create policy visit_dishes_owner on public.visit_dishes for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.visits v where v.id = visit_id and v.user_id = (select auth.uid())));

create policy visit_photos_owner on public.visit_photos for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.visits v where v.id = visit_id and v.user_id = (select auth.uid()))
    and exists (select 1 from public.photos p where p.id = photo_id and p.user_id = (select auth.uid())));

create policy lists_owner on public.lists for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy list_items_owner on public.list_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())));

create policy want_items_owner on public.want_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy shares_owner on public.shares for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy friendships_select on public.friendships for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));
create policy friendships_insert on public.friendships for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');
create policy friendships_accept on public.friendships for update to authenticated
  using (addressee_id = (select auth.uid())) with check (addressee_id = (select auth.uid()));
create policy friendships_delete on public.friendships for delete to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

-- Anonymous visitors get no direct table access at all.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- ---------------------------------------------------------------- functions

-- Insert a restaurant snapshot if new; never overwrite an existing one. Returns its id.
create function public.ensure_place(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  pid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if coalesce(p->>'googlePlaceId', '') = '' or coalesce(p->>'name', '') = '' then
    raise exception 'googlePlaceId and name are required' using errcode = '22023';
  end if;

  insert into public.places (google_place_id, name, address, lat, lng, neighborhood, cuisine, price_level)
  values (
    p->>'googlePlaceId',
    left(p->>'name', 200),
    left(coalesce(p->>'address', ''), 400),
    (p->>'lat')::double precision,
    (p->>'lng')::double precision,
    left(coalesce(p->>'neighborhood', ''), 120),
    left(coalesce(p->>'cuisine', ''), 120),
    nullif(p->>'priceLevel', '')::smallint
  )
  on conflict (google_place_id) do nothing;

  select id into pid from public.places where google_place_id = p->>'googlePlaceId';
  return pid;
end $$;

-- One place as a recipient may see it. Whitelist only: private_note is never selected.
create function public._shared_place(p_user uuid, p_place uuid, p_show_photos boolean, p_show_tips boolean, p_note text)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  pl public.places%rowtype;
  rep public.visits%rowtype;
  order_list jsonb;
  best_for jsonb;
  photo_paths jsonb := '[]'::jsonb;
begin
  select * into pl from public.places where id = p_place;
  if not found then return null; end if;

  -- representative visit: best verdict, then most recent (mirrors src/domain/share.ts)
  select * into rep from public.visits
   where user_id = p_user and place_id = p_place
   order by case verdict when 'loved' then 0 when 'liked' then 1 when 'fine' then 2 else 3 end,
            visited_on desc, created_at desc
   limit 1;
  if not found then return null; end if;

  select coalesce(jsonb_agg(x.name order by x.ord), '[]'::jsonb) into order_list from (
    select trim(rep.order_the) as name, 0 as ord where trim(rep.order_the) <> ''
    union all
    select d.name, 1 from (
      select distinct d.name from public.visit_dishes d
       join public.visits v on v.id = d.visit_id
       where v.user_id = p_user and v.place_id = p_place and d.order_again
         and position(lower(d.name) in lower(rep.order_the)) = 0
    ) d
  ) x;

  select coalesce(jsonb_agg(o order by o), '[]'::jsonb) into best_for from (
    select distinct unnest(occasions) as o from public.visits where user_id = p_user and place_id = p_place
  ) s;

  if p_show_photos then
    select coalesce(jsonb_agg(path), '[]'::jsonb) into photo_paths from (
      select ph.storage_path as path
        from public.visit_photos vp
        join public.visits v on v.id = vp.visit_id
        join public.photos ph on ph.id = vp.photo_id
       where v.user_id = p_user and v.place_id = p_place
       order by v.visited_on desc, vp.position
       limit 6
    ) q;
  end if;

  return jsonb_strip_nulls(jsonb_build_object(
    'name', pl.name,
    'address', pl.address,
    'neighborhood', pl.neighborhood,
    'cuisine', pl.cuisine,
    'googlePlaceId', pl.google_place_id,
    'verdict', rep.verdict,
    'value', rep.value,
    'orderThe', order_list,
    'bestFor', best_for,
    'skipThe', case when p_show_tips and trim(rep.skip_the) <> '' then trim(rep.skip_the) end,
    'tip', case when p_show_tips and trim(rep.tip) <> '' then trim(rep.tip) end,
    'photoPaths', photo_paths,
    'note', case when coalesce(trim(p_note), '') <> '' then trim(p_note) end
  ));
end $$;

-- The only door anonymous visitors have. Returns null for unknown or revoked tokens.
create function public.get_shared(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  sh public.shares%rowtype;
  lst public.lists%rowtype;
  places_json jsonb := '[]'::jsonb;
  one jsonb;
  item record;
begin
  select * into sh from public.shares where token = p_token and revoked_at is null;
  if not found then return null; end if;

  if sh.kind = 'place' then
    one := public._shared_place(sh.user_id, sh.target_id, sh.show_photos, sh.show_tips, null);
    if one is null then return null; end if;
    return jsonb_build_object('kind', 'place', 'title', one->>'name', 'places', jsonb_build_array(one));
  end if;

  select * into lst from public.lists where id = sh.target_id and user_id = sh.user_id;
  if not found then return null; end if;

  for item in select place_id, note from public.list_items where list_id = lst.id order by position loop
    one := public._shared_place(sh.user_id, item.place_id, sh.show_photos, sh.show_tips, item.note);
    if one is not null then places_json := places_json || jsonb_build_array(one); end if;
  end loop;
  return jsonb_build_object('kind', 'list', 'title', lst.name, 'places', places_json);
end $$;

-- Is this storage object part of an active share that includes photos?
create function public.is_shared_photo(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
      from public.photos ph
      join public.visit_photos vp on vp.photo_id = ph.id
      join public.visits v on v.id = vp.visit_id
      join public.shares s on s.user_id = ph.user_id and s.revoked_at is null and s.show_photos
       and ((s.kind = 'place' and s.target_id = v.place_id)
         or (s.kind = 'list' and exists (select 1 from public.list_items li where li.list_id = s.target_id and li.place_id = v.place_id)))
     where ph.storage_path = p_path
  );
$$;

revoke all on function public.ensure_place(jsonb) from public, anon;
revoke all on function public._shared_place(uuid, uuid, boolean, boolean, text) from public, anon, authenticated;
revoke all on function public.get_shared(text) from public;
revoke all on function public.is_shared_photo(text) from public;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.ensure_place(jsonb) to authenticated;
grant execute on function public.get_shared(text) to anon, authenticated;
grant execute on function public.is_shared_photo(text) to anon, authenticated;

-- ---------------------------------------------------------------- storage (private bucket)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Owners manage files under their own user-id folder: photos/<user_id>/<file>
create policy photos_owner_all on storage.objects for all to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Recipients may read a photo only while an active share includes it.
create policy photos_shared_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'photos' and public.is_shared_photo(name));
