-- Messages carry both languages; profiles remember each person's app language
-- (applied 2026-10-12; the notify edge function stores i18n and sends push in the recipient's language)
alter table public.notifications add column if not exists i18n jsonb;
alter table public.profiles add column if not exists lang text;
