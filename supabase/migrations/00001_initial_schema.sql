-- ============================================================
-- 1. PROFILES TABLE (linked to auth.users)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  stripe_account_id text,           -- Connected Account ID (e.g., acct_xxx)
  stripe_account_enabled boolean default false,
  updated_at timestamptz default now()
);

-- Automatically update the updated_at timestamp
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 2. PRODUCTS / SERVICES TABLE
-- ============================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price integer not null check (price >= 0), -- stored in cents for Stripe
  currency text default 'usd',               -- e.g., 'usd', 'eur'
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger products_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 3. ORDERS / PAYMENTS TABLE
-- ============================================================

create type public.order_status as enum ('pending', 'succeeded', 'failed', 'refunded', 'canceled');

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.profiles(id) on delete set null,      -- nullable for guest checkout
  seller_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,     -- optional link to a product
  amount integer not null check (amount >= 0),                          -- stored in cents
  currency text default 'usd',
  stripe_payment_intent_id text,                                         -- pi_xxx
  stripe_transfer_id text,                                               -- tr_xxx (for Connect transfers)
  status public.order_status default 'pending',
  metadata jsonb default '{}',                                           -- extra Stripe/order data
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger orders_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 4. AUTO-CREATE PROFILE ON SIGNUP (Database Trigger)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop if exists to avoid conflicts on re-runs
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Products
alter table public.products enable row level security;

create policy "Owners can CRUD own products"
  on public.products for all
  to authenticated
  using (user_id = auth.uid());

create policy "Anyone can read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

-- Orders
alter table public.orders enable row level security;

create policy "Buyers and sellers can read own orders"
  on public.orders for select
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Sellers can update own orders"
  on public.orders for update
  to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "Buyers can create orders"
  on public.orders for insert
  to authenticated
  with check (buyer_id = auth.uid() or buyer_id is null);

-- ============================================================
-- 6. INDEXES (performance for Stripe lookups & common queries)
-- ============================================================

create index if not exists idx_profiles_stripe_account on public.profiles(stripe_account_id);
create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_orders_seller_id on public.orders(seller_id);
create index if not exists idx_orders_buyer_id on public.orders(buyer_id);
create index if not exists idx_orders_stripe_pi on public.orders(stripe_payment_intent_id);
create index if not exists idx_orders_status on public.orders(status);
