-- Lets an invite link show whose family it is before the visitor signs in.
-- Returns null for an unknown code. Applied to project fschjgkvvjcwfpbgwiei.
create or replace function public.family_preview(join_code text)
returns json
language sql
stable
security definer
set search_path to 'public'
as $$
  select json_build_object(
    'name', f.name,
    'kind', f.kind,
    'members', (select count(*) from family_members m where m.family_id = f.id),
    'inviter', (select p.name from family_members m join profiles p on p.id = m.user_id
                where m.family_id = f.id order by (m.role = 'owner') desc, m.joined_at limit 1)
  )
  from families f
  where f.code = upper(trim(join_code)) and length(trim(join_code)) = 6;
$$;
revoke all on function public.family_preview(text) from public;
grant execute on function public.family_preview(text) to anon, authenticated;
