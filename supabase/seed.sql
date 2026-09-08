-- Mirrorball Madness — season cast
-- Real per-season data, kept separate from schema.sql (structure). Update the
-- season name and cast list each year and re-run.
--
-- Pros recur across seasons (people.role = 'pro'), so seeding them is a
-- find-or-create by (name, role) rather than a blind insert — the same pro
-- returning next year should resolve to the same people row, not a new one.
-- Celebrities are typically one-and-done, but use the same find-or-create
-- logic uniformly in case of an All-Stars-style return.

begin;

create temporary table season_cast (celebrity_name text, pro_name text) on commit drop;

insert into season_cast (celebrity_name, pro_name) values
  ('Tatyana Ali', 'Jan Ravnik'),
  ('Tyler Cameron', 'Sharna Burgess'),
  ('Giada De Laurentiis', 'Alan Bersten'),
  ('Jenna Dewan', 'Val Chmerkovskiy'),
  ('Ezra Frech', 'Daniella Karagach'),
  ('Amber Glenn', 'Pasha Pashkov'),
  ('Taylor Hanson', 'Britt Stewart'),
  ('Maura Higgins', 'Mark Ballas'),
  ('Conner Leavitt', 'Adele Zaikman'),
  ('Ciara Miller', 'Brandon Armstrong'),
  ('Sarah Jane Nader', 'Hailey Bills'),
  ('Jackson Olson', 'Emma Slater'),
  ('Guillermo Rodriguez', 'Witney Carson'),
  ('Harry Shum Jr.', 'Jenna Johnson'),
  ('Julia Stiles', 'Ezra Sosa'),
  ('Connor Wood', 'Rylee Arnold');

update public.seasons set is_active = false where is_active;

insert into public.seasons (name, is_active)
values ('Season 35', true)
on conflict (name) do update set is_active = true;

insert into public.people (name, role)
select distinct celebrity_name, 'celebrity' from season_cast
on conflict (name, role) do nothing;

insert into public.people (name, role)
select distinct pro_name, 'pro' from season_cast
on conflict (name, role) do nothing;

insert into public.couples (season_id, celebrity_id, pro_id)
select
  (select id from public.seasons where name = 'Season 35'),
  celeb.id,
  pro.id
from season_cast
join public.people celeb on celeb.name = season_cast.celebrity_name and celeb.role = 'celebrity'
join public.people pro on pro.name = season_cast.pro_name and pro.role = 'pro'
on conflict (season_id, celebrity_id, pro_id) do nothing;

commit;
