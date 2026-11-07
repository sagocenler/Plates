-- The event trigger runs as the function owner; API roles never need to call it directly.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
