-- 0003: security hardening after advisor review

-- Trigger functions must not be callable through the REST API.
-- (Triggers fire without EXECUTE privilege, so this does not stop them working.)
revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.guard_profile_role()       from public, anon, authenticated;
revoke execute on function public.set_provider_free_until()  from public, anon, authenticated;
revoke execute on function public.guard_provider_status()    from public, anon, authenticated;
revoke execute on function public.check_rate_minimum()       from public, anon, authenticated;
revoke execute on function public.prepare_booking()          from public, anon, authenticated;
revoke execute on function public.booking_guard()            from public, anon, authenticated;
revoke execute on function public.audit_booking_status()     from public, anon, authenticated;
revoke execute on function public.review_allowed()           from public, anon, authenticated;
revoke execute on function public.audit_log_immutable()      from public, anon, authenticated;

-- Only signed-in users may apply as a provider.
revoke execute on function public.apply_as_provider(text, int, text, jsonb) from public, anon;
grant  execute on function public.apply_as_provider(text, int, text, jsonb) to authenticated;

-- Pin the search path on the one function that lacked it.
alter function public.audit_log_immutable() set search_path = public;

-- current_role_name() must stay executable by anon and authenticated, because RLS policies call it.
-- It only returns the caller's own role, so this is intentional.
