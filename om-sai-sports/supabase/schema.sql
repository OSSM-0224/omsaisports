-- Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  design_id text unique not null,
  title text not null,
  category text not null check (category in ('School','College','Club','Cricket','Football','Kabaddi','Running','Custom')),
  description text default '',
  image_url text not null,
  alt_text text,
  featured boolean default false,
  created_at timestamptz not null default now()
);
alter table public.designs enable row level security;
create policy "Public can read designs" on public.designs for select using (true);
-- Create a Supabase Auth user for the single administrator.
-- Replace the email below with the admin account you create in Authentication.
create policy "Admin can insert designs" on public.designs for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');
create policy "Admin can update designs" on public.designs for update to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com')
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');
create policy "Admin can delete designs" on public.designs for delete to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');
create index if not exists designs_created_at_idx on public.designs(created_at desc);
create index if not exists designs_category_idx on public.designs(category);

-- Single-row hero background settings managed from /admin.
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  hero_video_url text not null default '',
  hero_poster_url text not null default '/hero-poster.svg',
  hero_use_video boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;
create policy "Public can read site settings" on public.site_settings for select using (true);
create policy "Admin can insert site settings" on public.site_settings for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');
create policy "Admin can update site settings" on public.site_settings for update to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com')
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');
