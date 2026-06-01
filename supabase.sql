create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists updated_at timestamptz not null default now();
alter table public.orders add column if not exists customer jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists subtotal numeric(10,2) not null default 0;
alter table public.orders add column if not exists delivery_fee numeric(10,2) not null default 0;
alter table public.orders add column if not exists discount numeric(10,2) not null default 0;
alter table public.orders add column if not exists coupon jsonb;
alter table public.orders add column if not exists extra numeric(10,2) not null default 0;
alter table public.orders add column if not exists total numeric(10,2) not null default 0;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists change_for text;
alter table public.orders add column if not exists order_type text default 'retirada';
alter table public.orders add column if not exists source text default 'verbo-hub';
alter table public.orders add column if not exists status text default 'novo';
alter table public.orders add column if not exists fiado boolean not null default false;
alter table public.orders add column if not exists order_number bigint;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text not null unique,
  percent numeric(5,2) not null default 0,
  active boolean not null default true
);

create table if not exists public.store_settings (
  id text primary key default 'main',
  is_open boolean not null default true,
  estimated_minutes integer not null default 25,
  message text default 'Estamos recebendo pedidos normalmente.',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, is_open, estimated_minutes, message)
values ('main', true, 25, 'Estamos recebendo pedidos normalmente.')
on conflict (id) do nothing;

alter table public.orders enable row level security;
alter table public.store_settings enable row level security;
alter table public.coupons enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_insert_public') then
    create policy "orders_insert_public" on public.orders for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_read_public') then
    create policy "orders_read_public" on public.orders for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_update_public') then
    create policy "orders_update_public" on public.orders for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='store_settings' and policyname='store_settings_read_public') then
    create policy "store_settings_read_public" on public.store_settings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='store_settings' and policyname='store_settings_write_public') then
    create policy "store_settings_write_public" on public.store_settings for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='coupons' and policyname='coupons_read_public') then
    create policy "coupons_read_public" on public.coupons for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='coupons' and policyname='coupons_write_public') then
    create policy "coupons_write_public" on public.coupons for all using (true) with check (true);
  end if;
end $$;
