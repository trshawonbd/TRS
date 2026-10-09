-- "We cooked it": one row per family, recipe and day. Drives the family dashboard.
-- Applied to project fschjgkvvjcwfpbgwiei.
create table if not exists public.cooked_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  recipe_id text not null check (length(recipe_id) between 1 and 40),
  day date not null default current_date,
  cooked_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (family_id, recipe_id, day)
);
create index if not exists cooked_log_family_day on public.cooked_log(family_id, day desc);
alter table public.cooked_log enable row level security;
create policy "members read cooked" on public.cooked_log for select to authenticated using (public.is_member(family_id));
create policy "members log cooked" on public.cooked_log for insert to authenticated
  with check (public.is_member(family_id) and cooked_by = auth.uid());
create policy "cook removes own entry" on public.cooked_log for delete to authenticated using (cooked_by = auth.uid());
alter publication supabase_realtime add table public.cooked_log;

-- How many families have cooked each recipe (counts only, no family details).
create or replace function public.recipe_popularity()
returns table(recipe_id text, families bigint)
language sql stable security definer set search_path to 'public' as $$
  select recipe_id, count(distinct family_id)
  from (select family_id, recipe_id from cooked_log union select family_id, recipe_id from dish_photos) x
  group by recipe_id;
$$;
revoke all on function public.recipe_popularity() from public;
grant execute on function public.recipe_popularity() to authenticated;
