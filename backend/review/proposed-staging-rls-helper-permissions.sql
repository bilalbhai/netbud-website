-- PROPOSAL ONLY: NOT APPLIED. Requires explicit owner approval.
-- Target only netbud-staging / pzorzppbxgqespexuers after rechecking identity.
-- Keep the ensure_rls event trigger and its function body/owner unchanged.
begin;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
commit;
