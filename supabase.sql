create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_method text,
  change_for text,
  order_type text default 'retirada',
  source text default 'verbo-hub-cardapio',
  status text default 'novo'
);

alter table public.orders enable row level security;

drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public" on public.orders for insert with check (true);

drop policy if exists "orders_read_public" on public.orders;
create policy "orders_read_public" on public.orders for select using (true);

drop policy if exists "orders_update_public" on public.orders;
create policy "orders_update_public" on public.orders for update using (true) with check (true);

alter publication supabase_realtime add table public.orders;
