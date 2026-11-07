-- RLS / privacy tests. Run against the project (e.g. via the Supabase SQL editor or MCP execute_sql).
-- Everything happens inside one DO block that ALWAYS ends by raising an exception, so the transaction
-- rolls back and nothing is persisted: no test users, no test rows. The exception message is the report.
-- A line starting with FAIL means a privacy guarantee is broken.

do $$
declare
  u1 uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  pid uuid;
  vid uuid := gen_random_uuid();
  lid uuid := gen_random_uuid();
  tok text := replace(gen_random_uuid()::text, '-', '');
  n int;
  payload jsonb;
  report text := '';
begin
  -- Fixtures (as the table owner). The signup trigger creates the profiles.
  insert into auth.users (id, email, aud, role) values
    (u1, 'owner@test.invalid', 'authenticated', 'authenticated'),
    (u2, 'other@test.invalid', 'authenticated', 'authenticated');

  -- ---- as user 1: create data -------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;

  pid := public.ensure_place('{"googlePlaceId":"test-place","name":"Test Bistro","address":"1 Main St","lat":40.7,"lng":-74.0,"neighborhood":"SoHo","cuisine":"French","priceLevel":3}'::jsonb);
  insert into public.visits (id, place_id, verdict, order_the, tip, private_note, occasions)
    values (vid, pid, 'loved', 'Steak frites', 'Book ahead', 'SECRET-PRIVATE-NOTE', array['date night']);
  insert into public.visit_dishes (visit_id, name, order_again) values (vid, 'Onion soup', true);
  insert into public.lists (id, name) values (lid, 'Date night');
  insert into public.list_items (list_id, place_id, note) values (lid, pid, 'Order the steak');
  insert into public.want_items (place_id, note) values (pid, 'want');
  insert into public.shares (token, kind, target_id) values (tok, 'place', pid);

  select count(*) into n from public.visits;
  report := report || case when n = 1 then 'PASS' else 'FAIL' end || ': owner sees own visit (' || n || E')\n';

  -- ---- as user 2: must see and change nothing of user 1's --------------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into n from public.visits;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot read visits (' || n || E')\n';
  select count(*) into n from public.visit_dishes;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot read dishes (' || n || E')\n';
  select count(*) into n from public.lists;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot read lists (' || n || E')\n';
  select count(*) into n from public.list_items;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot read list items (' || n || E')\n';
  select count(*) into n from public.want_items;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot read want-to-try (' || n || E')\n';
  select count(*) into n from public.shares;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot read share tokens (' || n || E')\n';

  update public.visits set private_note = 'HACKED' where id = vid;
  get diagnostics n = row_count;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot update the visit (' || n || E' rows)\n';
  delete from public.visits where id = vid;
  get diagnostics n = row_count;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot delete the visit (' || n || E' rows)\n';
  update public.shares set revoked_at = now() where token = tok;
  get diagnostics n = row_count;
  report := report || case when n = 0 then 'PASS' else 'FAIL' end || ': other user cannot revoke the share (' || n || E' rows)\n';

  begin
    insert into public.visits (user_id, place_id, verdict) values (u1, pid, 'skip');
    report := report || E'FAIL: other user inserted a visit as someone else\n';
  exception when others then
    report := report || E'PASS: cannot insert a visit on behalf of another user\n';
  end;
  begin
    insert into public.visit_dishes (visit_id, name) values (vid, 'injected');
    report := report || E'FAIL: other user attached a dish to someone else''s visit\n';
  exception when others then
    report := report || E'PASS: cannot attach a dish to another user''s visit\n';
  end;
  begin
    insert into public.list_items (list_id, place_id) values (lid, pid);
    report := report || E'FAIL: other user added an item to someone else''s list\n';
  exception when others then
    report := report || E'PASS: cannot add items to another user''s list\n';
  end;
  begin
    insert into public.places (google_place_id, name, lat, lng) values ('direct', 'Direct insert', 0, 0);
    report := report || E'FAIL: direct insert into places is allowed\n';
  exception when others then
    report := report || E'PASS: places cannot be written directly (only via ensure_place)\n';
  end;

  -- ---- anonymous visitor ----------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;

  begin
    perform 1 from public.visits limit 1;
    report := report || E'FAIL: anon can query visits\n';
  exception when insufficient_privilege then
    report := report || E'PASS: anon has no access to visits\n';
  end;
  begin
    perform 1 from public.shares limit 1;
    report := report || E'FAIL: anon can query shares\n';
  exception when insufficient_privilege then
    report := report || E'PASS: anon has no access to shares\n';
  end;
  begin
    perform public.ensure_place('{"googlePlaceId":"x","name":"x","lat":0,"lng":0}'::jsonb);
    report := report || E'FAIL: anon can call ensure_place\n';
  exception when insufficient_privilege then
    report := report || E'PASS: anon cannot call ensure_place\n';
  end;

  payload := public.get_shared(tok);
  report := report || case when payload is not null and payload->'places'->0->>'name' = 'Test Bistro' then 'PASS' else 'FAIL' end
    || E': anon can open an active share via get_shared\n';
  report := report || case when payload::text not like '%SECRET-PRIVATE-NOTE%' then 'PASS' else 'FAIL' end
    || E': shared payload never contains the private note\n';
  report := report || case when payload->'places'->0->'orderThe' ? 'Steak frites' and payload->'places'->0->'orderThe' ? 'Onion soup' then 'PASS' else 'FAIL' end
    || E': shared payload lists order-the dishes\n';
  report := report || case when public.get_shared('0000') is null then 'PASS' else 'FAIL' end || E': unknown token returns null\n';

  -- ---- owner revokes -> link dies ----------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.shares set revoked_at = now() where token = tok;

  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  payload := public.get_shared(tok);
  report := report || case when payload is null then 'PASS' else 'FAIL' end || E': revoked share returns null\n';

  reset role;
  raise exception E'RLS REPORT\n%', report;
end $$;
