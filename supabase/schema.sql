-- Fikrah Summit — Supabase schema
-- Run this once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  body text,
  category text,
  date date,
  author text,
  image text,
  video_id text,
  created_at timestamptz not null default now()
);

create table if not exists gallery (
  id uuid primary key default gen_random_uuid(),
  caption text,
  small text,
  category text,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  youtube_id text not null,
  created_at timestamptz not null default now()
);

alter table posts enable row level security;
alter table gallery enable row level security;
alter table videos enable row level security;

-- Anyone (including signed-out visitors) can read.
create policy "public read posts" on posts for select using (true);
create policy "public read gallery" on gallery for select using (true);
create policy "public read videos" on videos for select using (true);

-- Only a signed-in user (the admin account you create below) can write.
create policy "admin write posts" on posts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write gallery" on gallery for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write videos" on videos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Seed data — the same defaults the site currently ships with.
insert into posts (title, excerpt, body, category, date, author, image) values
('Recap: The 104th Session at Adil Conference Center',
 'Chaired by Eng. Nassor Morsady Hassan, Session 104 explored how disciplined presentation turns good ideas into decisions people act on.',
 E'Fikrah Summit''s 104th session opened with a review of the community''s growth since its early days as DOUBLE G, before moving into the evening''s core theme: the power of presentation as a leadership skill.\n\nMembers practiced structuring an argument, reading a room and closing with a clear call to action. As with every Fikrah session, the evening balanced formal learning with open networking, giving entrepreneurs, students and executives space to exchange contacts and ideas outside the structured programme.\n\nThe session closed with a short Q&A and an invitation for members to propose topics for upcoming sessions.',
 'Session Recap', '2026-07-11', 'Fikrah Summit', ''),
('Why We Renamed DOUBLE G to Fikrah Summit',
 'A short look at the philosophy behind the community''s evolution — and what stays the same.',
 E'Originally founded as DOUBLE G (Givers Gain), our community evolved into Fikrah Summit with a renewed philosophy and a stronger focus on leadership, entrepreneurship, business excellence and lifelong learning.\n\nThe name change reflected something deeper than branding: a shift toward structured, weekly learning built around real speakers, real case studies and real accountability between members.\n\nWhat hasn''t changed is the belief that gathering ambitious people in one room, consistently, compounds into something bigger than any single session.',
 'Community', '2026-05-02', 'Fikrah Summit', ''),
('Five Takeaways from Prof. Mussa J. Assad on Academic Leadership',
 'Notes from Session 61, where the Vice Chancellor of Muslim University of Morogoro joined Fikrah for a conversation on leading institutions.',
 E'When Prof. Mussa J. Assad, Vice Chancellor of Muslim University of Morogoro, joined Fikrah Summit for Session 61, the room filled quickly.\n\nHis talk moved between academic governance and everyday leadership — the discipline of listening before deciding, the cost of avoiding hard conversations, and why institutions (like communities) grow only as fast as the trust inside them.\n\nMembers left with a simple challenge: apply one habit from academic leadership to their own business or team this month.',
 'Session Recap', '2026-02-14', 'Fikrah Summit', ''),
('Finance for Founders: What Actually Matters Early On',
 'Said Mshana breaks down the handful of financial habits that separate businesses that survive year one from those that don''t.',
 E'Said Mshana, Senior Finance Manager at Amana Bank Limited, used Session 94 to strip business finance down to fundamentals: cash flow discipline, separating personal and business accounts, and building a habit of monthly reconciliation.\n\nThe session''s most repeated line: ''Profit is an opinion, cash is a fact.'' Members were encouraged to build a simple weekly cash tracker before adding any complexity to their books.',
 'Finance', '2026-01-18', 'Fikrah Summit', '');

insert into gallery (caption, small, category, image) values
('People. Ideas. Connections.', 'Fikrah Summit', 'Community', ''),
('Learning together', 'Session', 'Sessions', ''),
('Networking', 'Community', 'Community', ''),
('Sharing experience', 'Speaker', 'Speakers', ''),
('Creating impact', 'Highlights', 'Sessions', ''),
('Adil Conference Center', 'Session 104', 'Sessions', ''),
('Opening remarks', E'Chairman''s Address', 'Speakers', ''),
('Open floor discussion', 'Q&A', 'Community', ''),
('Group photo', 'Closing', 'Community', '');

insert into videos (title, category, youtube_id) values
('Fikrah Summit — Session Highlights', 'Sessions', '58vNS3C0Jds');

-- Storage bucket for uploaded photos (posts + gallery). Public so
-- photos display on the site; only the signed-in admin can upload.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media"
on storage.objects for select
using (bucket_id = 'media');

create policy "admin upload media"
on storage.objects for insert
with check (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "admin update media"
on storage.objects for update
using (bucket_id = 'media' and auth.role() = 'authenticated');

create policy "admin delete media"
on storage.objects for delete
using (bucket_id = 'media' and auth.role() = 'authenticated');

-- Demo placeholder photos (Lorem Picsum) so the site doesn't look
-- empty before real photos are uploaded through /admin. Safe to
-- re-run — each row gets a stable placeholder keyed to its position.
with ordered as (
  select id, row_number() over (order by created_at) as rn from gallery
)
update gallery g
set image = 'https://picsum.photos/seed/fikrah-gallery-' || o.rn || '/800/600'
from ordered o
where g.id = o.id;

with ordered as (
  select id, row_number() over (order by created_at) as rn from posts
)
update posts p
set image = 'https://picsum.photos/seed/fikrah-post-' || o.rn || '/1200/700'
from ordered o
where p.id = o.id;
