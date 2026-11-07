-- Only the restaurants the signed-in user actually uses (visited, wanted, or on a list).
-- security_invoker makes the subqueries run under the caller's RLS, so other users' usage is invisible.
create view public.my_places with (security_invoker = true) as
select p.*
from public.places p
where exists (select 1 from public.visits v where v.place_id = p.id)
   or exists (select 1 from public.want_items w where w.place_id = p.id)
   or exists (select 1 from public.list_items li where li.place_id = p.id);

revoke all on public.my_places from anon, public;
grant select on public.my_places to authenticated;
