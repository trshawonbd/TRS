-- Family head can remove members; anyone can leave.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

create or replace function public.remove_member(fam uuid, target uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from family_members where family_id = fam and user_id = auth.uid() and role = 'owner') then
    raise exception 'only the family head can remove members';
  end if;
  if target = auth.uid() then raise exception 'use leave_family to leave'; end if;
  delete from family_members where family_id = fam and user_id = target;
  delete from favorites where family_id = fam and user_id = target;
  insert into activity(family_id, user_id, text) values (fam, auth.uid(), 'একজন সদস্যকে সরিয়েছেন');
end $$;

-- If the head leaves, the member who joined earliest becomes the new head.
create or replace function public.leave_family(fam uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare was_owner boolean; heir uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select role = 'owner' into was_owner from family_members where family_id = fam and user_id = auth.uid();
  if was_owner is null then return; end if;
  insert into activity(family_id, user_id, text) values (fam, auth.uid(), 'পরিবার ছেড়ে গেছেন');
  delete from family_members where family_id = fam and user_id = auth.uid();
  delete from favorites where family_id = fam and user_id = auth.uid();
  if was_owner then
    select user_id into heir from family_members where family_id = fam order by joined_at asc limit 1;
    if heir is not null then
      update family_members set role = 'owner' where family_id = fam and user_id = heir;
      update families set created_by = heir where id = fam;
    end if;
  end if;
end $$;

revoke all on function public.remove_member(uuid, uuid) from public, anon;
revoke all on function public.leave_family(uuid) from public, anon;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.leave_family(uuid) to authenticated;
