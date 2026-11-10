-- Make one beta account an admin.
-- Run in the Supabase SQL editor for the beta project, as the project owner.
-- Sign up with the account first, then replace the email below.
-- Only the project owner should run this. It is never run from the app.

do $$
begin
  perform set_config('app.allow_role_change', 'on', true);
  update public.profiles
     set role = 'admin'
   where id = (select id from auth.users where email = 'REPLACE-WITH-ADMIN-EMAIL@example.com');
end $$;
