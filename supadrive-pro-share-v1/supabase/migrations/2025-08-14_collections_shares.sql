-- Tables
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid null,
  name text not null,
  title text null,
  subtitle text null,
  banner_image_url text null,
  bottom_image_url text null,
  cta_label text null,
  cta_url text null,
  created_at timestamp with time zone default now()
);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete cascade,
  path text not null,
  name text not null,
  mimetype text null,
  size bigint null,
  created_at timestamp with time zone default now()
);

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete cascade,
  slug text unique not null,
  is_public boolean not null default true,
  expires_at timestamp with time zone null,
  title text null,
  subtitle text null,
  banner_image_url text null,
  bottom_image_url text null,
  cta_label text null,
  cta_url text null,
  created_at timestamp with time zone default now()
);

-- Function to create a share for a collection with random slug
create or replace function public.create_share_for_collection(p_collection_id uuid)
returns shares
language plpgsql
security definer
as $$
declare
  v_slug text;
  v_share shares;
begin
  v_slug := encode(gen_random_bytes(6), 'hex');
  insert into public.shares (collection_id, slug)
  values (p_collection_id, v_slug)
  returning * into v_share;
  return v_share;
end;
$$;

-- RLS
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.shares enable row level security;

-- Policies (basic permissive: allow anon to select shares & their items)
create policy if not exists "select shares by slug public"
on public.shares for select
to anon
using (is_public and (expires_at is null or now() < expires_at));

create policy if not exists "select items via share slug"
on public.collection_items for select
to anon
using (exists (
  select 1 from public.shares s
  where s.collection_id = collection_items.collection_id
    and s.is_public = true
    and (s.expires_at is null or now() < s.expires_at)
));

-- For simplicity in demo, allow insert from authenticated or anon (adjust in prod)
create policy if not exists "insert collections any"
on public.collections for insert
to authenticated, anon
with check (true);

create policy if not exists "insert items any"
on public.collection_items for insert
to authenticated, anon
with check (true);

create policy if not exists "insert shares any"
on public.shares for insert
to authenticated, anon
with check (true);

create policy if not exists "update shares any"
on public.shares for update
to authenticated, anon
using (true)
with check (true);
