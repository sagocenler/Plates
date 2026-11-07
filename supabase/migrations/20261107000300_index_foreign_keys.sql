-- Cover foreign keys. The user_id columns matter most: every RLS policy filters on them.
create index if not exists list_items_place_idx on public.list_items (place_id);
create index if not exists list_items_user_idx on public.list_items (user_id);
create index if not exists list_items_list_idx on public.list_items (list_id, position);
create index if not exists lists_user_idx on public.lists (user_id, position);
create index if not exists photos_user_idx on public.photos (user_id);
create index if not exists visit_dishes_user_idx on public.visit_dishes (user_id);
create index if not exists visit_dishes_photo_idx on public.visit_dishes (photo_id);
create index if not exists visit_photos_photo_idx on public.visit_photos (photo_id);
create index if not exists visit_photos_user_idx on public.visit_photos (user_id);
create index if not exists want_items_place_idx on public.want_items (place_id);
