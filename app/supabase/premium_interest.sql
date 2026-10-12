-- Who is interested in Premium and what they would pay (one row per user)
create table if not exists public.premium_interest (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  choice text not null check (choice in ('m99','m149','y999','free')),
  lang text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.premium_interest enable row level security;
create policy "own interest read" on public.premium_interest for select to authenticated using (user_id = (select auth.uid()));
create policy "own interest insert" on public.premium_interest for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own interest update" on public.premium_interest for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Results: select choice, count(*) from premium_interest group by choice;
