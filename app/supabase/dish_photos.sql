-- Family photos of dishes they cooked. Files live in the private "dish-photos" bucket
-- under <family_id>/<recipe_id>/<random>.jpg; only members of that family can see them.
-- Applied to project fschjgkvvjcwfpbgwiei.
create table if not exists public.dish_photos (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  recipe_id text not null check (length(recipe_id) between 1 and 40),
  path text not null unique,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists dish_photos_family_recipe on public.dish_photos(family_id, recipe_id, created_at desc);
alter table public.dish_photos enable row level security;
create policy "members read photos" on public.dish_photos for select to authenticated using (public.is_member(family_id));
create policy "members add photos" on public.dish_photos for insert to authenticated
  with check (public.is_member(family_id) and user_id = auth.uid() and path like family_id::text || '/' || recipe_id || '/%');
create policy "owner removes photo" on public.dish_photos for delete to authenticated using (user_id = auth.uid());
alter publication supabase_realtime add table public.dish_photos;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-photos', 'dish-photos', false, 3145728, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create or replace function public.photo_family(object_name text)
returns uuid language sql immutable as $$
  select case when split_part(object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(object_name, '/', 1)::uuid end;
$$;
create policy "family reads dish photos" on storage.objects for select to authenticated
  using (bucket_id = 'dish-photos' and public.is_member(public.photo_family(name)));
create policy "family uploads dish photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'dish-photos' and public.is_member(public.photo_family(name)));
create policy "owner deletes dish photos" on storage.objects for delete to authenticated
  using (bucket_id = 'dish-photos' and owner_id = auth.uid()::text);
