-- ========================================================
-- FBSN: Combined idempotent migration
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Safe to re-run.
-- ========================================================

-- ===== supabase-schema.sql =====
-- FBSN Supabase Schema (Rooms / Participants / Votes)
-- Idempotent — safe to re-run.

create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  title text not null default 'Untitled',
  context text default '',
  perspectives jsonb not null default '[]',
  current_index int not null default 0,
  revealed boolean not null default false,
  final_decisions jsonb not null default '{}',
  status text not null default 'waiting' check (status in ('waiting', 'active', 'complete')),
  created_at timestamptz default now()
);

create table if not exists participants (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  perspective_index int not null,
  certainty text not null check (certainty in ('fact', 'belief')),
  importance text not null check (importance in ('signal', 'noise')),
  created_at timestamptz default now(),
  unique(room_id, participant_id, perspective_index)
);

alter table rooms enable row level security;
alter table participants enable row level security;
alter table votes enable row level security;

drop policy if exists "Anyone can create rooms" on rooms;
create policy "Anyone can create rooms" on rooms for insert with check (true);
drop policy if exists "Anyone can read rooms" on rooms;
create policy "Anyone can read rooms" on rooms for select using (true);
drop policy if exists "Anyone can update rooms" on rooms;
create policy "Anyone can update rooms" on rooms for update using (true);

drop policy if exists "Anyone can add participants" on participants;
create policy "Anyone can add participants" on participants for insert with check (true);
drop policy if exists "Anyone can read participants" on participants;
create policy "Anyone can read participants" on participants for select using (true);
drop policy if exists "Anyone can delete participants" on participants;
create policy "Anyone can delete participants" on participants for delete using (true);

drop policy if exists "Anyone can vote" on votes;
create policy "Anyone can vote" on votes for insert with check (true);
drop policy if exists "Anyone can read votes" on votes;
create policy "Anyone can read votes" on votes for select using (true);
drop policy if exists "Anyone can update votes" on votes;
create policy "Anyone can update votes" on votes for update using (true);

-- Realtime: only add to publication if not already there
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table participants;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table votes;
  end if;
end $$;

create index if not exists idx_rooms_code on rooms(code);
create index if not exists idx_participants_room on participants(room_id);
create index if not exists idx_votes_room on votes(room_id);

-- ===== content-schema.sql =====
-- VCT Content Overrides Schema (for admin inline editing)
-- Idempotent — safe to re-run.

create table if not exists content (
  id uuid default gen_random_uuid() primary key,
  page text not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now(),
  unique(page, key)
);

alter table content enable row level security;

drop policy if exists "Anyone can read content" on content;
create policy "Anyone can read content" on content for select using (true);
drop policy if exists "Anyone can insert content" on content;
create policy "Anyone can insert content" on content for insert with check (true);
drop policy if exists "Anyone can update content" on content;
create policy "Anyone can update content" on content for update using (true);

create index if not exists idx_content_page on content(page);

-- ===== beliefs-schema.sql =====
-- ============================================================
-- Supabase schema for Principles & Beliefs
-- Idempotent — safe to re-run.
-- ============================================================

create table if not exists beliefs (
  id          uuid        default gen_random_uuid() primary key,
  title       text        not null,
  description text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table beliefs enable row level security;

drop policy if exists "Allow public read on beliefs" on beliefs;
create policy "Allow public read on beliefs" on beliefs for select using (true);
drop policy if exists "Allow public insert on beliefs" on beliefs;
create policy "Allow public insert on beliefs" on beliefs for insert with check (true);
drop policy if exists "Allow public update on beliefs" on beliefs;
create policy "Allow public update on beliefs" on beliefs for update using (true) with check (true);
drop policy if exists "Allow public delete on beliefs" on beliefs;
create policy "Allow public delete on beliefs" on beliefs for delete using (true);

-- Seed data: only insert if title not already present
insert into beliefs (title, description, sort_order)
select 'Leadership is a Team Sport',
       'The most critical unit of leadership in any organization is the top team, not the individual at the top.',
       0
where not exists (select 1 from beliefs where title = 'Leadership is a Team Sport');

insert into beliefs (title, description, sort_order)
select 'Team Building Happens by Achieving Outcomes in New Ways',
       'Not just shareholder returns. Teams exist to create value across all stakeholders. If we''re honest, most organizations are falling short.',
       1
where not exists (select 1 from beliefs where title = 'Team Building Happens by Achieving Outcomes in New Ways');

insert into beliefs (title, description, sort_order)
select 'Plays, Not Prescriptions',
       'Like a sports team, executive teams need a playbook of adaptable moves, not rigid processes.',
       2
where not exists (select 1 from beliefs where title = 'Plays, Not Prescriptions');

insert into beliefs (title, description, sort_order)
select 'Practice Makes Permanent',
       'Real change comes through repeated practice, not one-off events or workshops.',
       3
where not exists (select 1 from beliefs where title = 'Practice Makes Permanent');

insert into beliefs (title, description, sort_order)
select 'Conflict is Data, Not Dysfunction',
       'Divergent views tell us where reality is unclear and where assumptions differ. The goal isn''t consensus — it''s shared clarity.',
       4
where not exists (select 1 from beliefs where title = 'Conflict is Data, Not Dysfunction');

-- ===== practices-schema.sql =====
-- ============================================================
-- Supabase schema for dynamic practices management
-- Idempotent — safe to re-run. Seed runs only when tables empty.
-- ============================================================

create table if not exists practices (
  id              uuid        default gen_random_uuid() primary key,
  title           text        not null,
  description     text        not null default '',
  status          text        not null default 'coming-soon'
                              check (status in ('automated','coming-soon')),
  modes           jsonb       not null default '[]',
  outcomes        jsonb       not null default '[]',
  outputs         jsonb       not null default '[]',
  action_links    jsonb       not null default '[]',
  resource_play_id integer,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create unique index if not exists practices_resource_play_id_unique
  on practices (resource_play_id)
  where resource_play_id is not null;

create table if not exists play_practices (
  id            uuid    default gen_random_uuid() primary key,
  play_number   integer not null check (play_number between 1 and 5),
  practice_id   uuid    not null references practices(id) on delete cascade,
  sort_order    integer not null default 0,
  created_at    timestamptz default now(),
  unique (play_number, practice_id)
);

create index if not exists play_practices_play_sort
  on play_practices (play_number, sort_order);

alter table practices enable row level security;
alter table play_practices enable row level security;

drop policy if exists "Allow public read on practices" on practices;
create policy "Allow public read on practices" on practices for select using (true);
drop policy if exists "Allow public insert on practices" on practices;
create policy "Allow public insert on practices" on practices for insert with check (true);
drop policy if exists "Allow public update on practices" on practices;
create policy "Allow public update on practices" on practices for update using (true) with check (true);
drop policy if exists "Allow public delete on practices" on practices;
create policy "Allow public delete on practices" on practices for delete using (true);

drop policy if exists "Allow public read on play_practices" on play_practices;
create policy "Allow public read on play_practices" on play_practices for select using (true);
drop policy if exists "Allow public insert on play_practices" on play_practices;
create policy "Allow public insert on play_practices" on play_practices for insert with check (true);
drop policy if exists "Allow public update on play_practices" on play_practices;
create policy "Allow public update on play_practices" on play_practices for update using (true) with check (true);
drop policy if exists "Allow public delete on play_practices" on play_practices;
create policy "Allow public delete on play_practices" on play_practices for delete using (true);

-- ============================================================
-- Seed: only when practices table is empty
-- ============================================================
do $seed$
begin
if (select count(*) from practices) = 0 then

  insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
  values
  (
    'FBSN Exercise',
    'Facts, Beliefs, Signals, Noise',
    'automated',
    '[{"label":"Facilitated In-Room","description":"Use physical Fact/Belief and Signal/Noise cards with a facilitator guiding the team through the exercise live"},{"label":"Virtual Session","description":"Host a digital session where the team connects from their devices and votes on each perspective in real time"},{"label":"Solo Practice","description":"Run the exercise individually to build your own strategic clarity before a team session"}]'::jsonb,
    '["Shared understanding of current reality","Hidden assumptions surfaced and examined","Alignment on which signals matter most"]'::jsonb,
    '["Completed FBSN 2x2 matrix","Prioritized list of signals to act on","Identified beliefs to test"]'::jsonb,
    '[{"label":"Run a Session","url":"fbsn.html","style":"primary"},{"label":"Tutorial","url":"fbsn-tutorial.html","style":"secondary"}]'::jsonb,
    101
  ),
  (
    'Three Horizons Scanning', '', 'coming-soon',
    '[]'::jsonb,
    '["Shared view of current, emerging, and future landscape","Alignment on where to invest attention"]'::jsonb,
    '["Three Horizons map","Key shifts and emerging patterns identified"]'::jsonb,
    '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
    102
  ),
  (
    'Assumption Mapping',
    'Based on David Bland''s work from Testing Business Ideas',
    'automated',
    '[{"label":"Facilitated In-Room","description":"Use the digital tool on a shared screen while a facilitator guides the team through brainstorming and mapping assumptions"},{"label":"Virtual Session","description":"Share the tool screen in a video call and have the team contribute assumptions collaboratively"},{"label":"Solo Practice","description":"Map assumptions individually to clarify your own thinking before a team session"}]'::jsonb,
    '["Critical assumptions identified and ranked","Shared awareness of what the team takes for granted","Clear priorities for what to test first"]'::jsonb,
    '["Assumption map with importance and evidence ratings","Prioritized list of assumptions to test immediately","Test plan for highest-risk assumptions"]'::jsonb,
    '[{"label":"Run Assumption Mapping","url":"assumptions.html","style":"primary"}]'::jsonb,
    103
  );

  insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
  values
  (
    'Future Visioning', '', 'coming-soon',
    '[]'::jsonb,
    '["Compelling shared vision of the future","Emotional and strategic alignment"]'::jsonb,
    '["Vision statement or narrative","Key elements of the desired future state"]'::jsonb,
    '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
    201
  ),
  (
    'Strategic Ambition Setting', '', 'coming-soon',
    '[]'::jsonb,
    '["Clear strategic ambition","Defined strategic boundaries and focus areas"]'::jsonb,
    '["Strategic ambition statement","Success criteria and milestones"]'::jsonb,
    '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
    202
  ),
  (
    'Backcasting', '', 'coming-soon',
    '[]'::jsonb,
    '["Clear pathway from future vision to present actions","Identified capability gaps and development needs"]'::jsonb,
    '["Reverse timeline with key milestones","Near-term actions connected to long-term vision"]'::jsonb,
    '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
    203
  ),
  (
    'The Future Backwards', '', 'coming-soon',
    '[]'::jsonb,
    '["Expanded perspective on possible futures","Identification of critical branching points","Shared language for discussing uncertainty"]'::jsonb,
    '["Future Backwards narrative map","Critical decision points identified","Weak signals to monitor that indicate which narrative is unfolding"]'::jsonb,
    '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
    204
  );

  insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
  values
  (
    'Cynefin Navigator', '', 'automated',
    '[]'::jsonb,
    '["Shared understanding of which domain each challenge belongs to","Domain-appropriate response strategies","Reduced misapplication of methods"]'::jsonb,
    '["Categorized strategic challenges","Domain-specific action plans"]'::jsonb,
    '[{"label":"Launch Cynefin Navigator","url":"cynefin.html","style":"primary"}]'::jsonb,
    301
  ),
  (
    'Safe-to-Fail Experiments', '', 'coming-soon',
    '[]'::jsonb,
    '["Portfolio of low-risk experiments","Rapid learning about complex challenges","Reduced fear of failure"]'::jsonb,
    '["Experiment design documents","Success and failure criteria","Learning extraction protocols"]'::jsonb,
    '[{"label":"Available via Cynefin Navigator","url":"cynefin.html","style":"secondary"},{"label":"Full Version Coming Soon","url":"","style":"disabled"}]'::jsonb,
    302
  ),
  (
    'Decision Architecture', '', 'coming-soon',
    '[]'::jsonb,
    '["Clear decision-making frameworks","Appropriate decision rights allocation","Faster, more confident decisions"]'::jsonb,
    '["Decision architecture map","Categorized decision rights and processes"]'::jsonb,
    '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
    303
  );

  insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
  values
  (
    'Team Operating System Design', '', 'coming-soon',
    '[]'::jsonb,
    '["Clear team operating agreements","Explicit norms and expectations","Shared language for how the team works"]'::jsonb,
    '["Team operating manual or charter","Meeting rhythms, decision processes, and communication norms"]'::jsonb,
    '[{"label":"Coming Soon — Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
    401
  ),
  (
    'Trust & Candor Protocol', '', 'coming-soon',
    '[]'::jsonb,
    '["Increased psychological safety","More honest and direct communication","Stronger interpersonal trust"]'::jsonb,
    '["Trust assessment baseline","Agreed candor norms and feedback practices"]'::jsonb,
    '[{"label":"Coming Soon — Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
    402
  ),
  (
    'Collaborative Reflection', '', 'coming-soon',
    '[]'::jsonb,
    '["Regular learning from team experience","Continuous improvement of team processes","Stronger collective intelligence"]'::jsonb,
    '["Reflection insights and action items","Adjusted team practices based on reflection"]'::jsonb,
    '[{"label":"Coming Soon — Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
    403
  );

  insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
  values
  (
    'Value Creation Cycle', '', 'coming-soon',
    '[]'::jsonb,
    '["Systematic approach to value creation","Clear link between team activities and outcomes","Measurable value indicators"]'::jsonb,
    '["Value creation map","Stakeholder impact assessment"]'::jsonb,
    '[{"label":"Coming Soon — Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
    501
  ),
  (
    'Impact Assessment', '', 'coming-soon',
    '[]'::jsonb,
    '["Clear understanding of team impact","Evidence-based improvement priorities","Stakeholder alignment on value"]'::jsonb,
    '["Impact assessment report","Priority areas for improvement"]'::jsonb,
    '[{"label":"Coming Soon — Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
    502
  ),
  (
    'Portfolio of Bets', '', 'coming-soon',
    '[]'::jsonb,
    '["Strategic portfolio of experiments and initiatives","Balanced risk across time horizons","Clear criteria for scaling, continuing, or stopping"]'::jsonb,
    '["Portfolio map across three horizons","Investment allocation framework","Regular review cadence and criteria"]'::jsonb,
    '[{"label":"Coming Soon — Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
    503
  );

end if;
end $seed$;

-- play_practices: only seed if empty
do $seed2$
begin
if (select count(*) from play_practices) = 0 then

  insert into play_practices (play_number, practice_id, sort_order)
  select 1, id, 0 from practices where title = 'FBSN Exercise';
  insert into play_practices (play_number, practice_id, sort_order)
  select 1, id, 1 from practices where title = 'Three Horizons Scanning';
  insert into play_practices (play_number, practice_id, sort_order)
  select 1, id, 2 from practices where title = 'Assumption Mapping';

  insert into play_practices (play_number, practice_id, sort_order)
  select 2, id, 0 from practices where title = 'Future Visioning';
  insert into play_practices (play_number, practice_id, sort_order)
  select 2, id, 1 from practices where title = 'Strategic Ambition Setting';
  insert into play_practices (play_number, practice_id, sort_order)
  select 2, id, 2 from practices where title = 'Backcasting';
  insert into play_practices (play_number, practice_id, sort_order)
  select 2, id, 3 from practices where title = 'The Future Backwards';

  insert into play_practices (play_number, practice_id, sort_order)
  select 3, id, 0 from practices where title = 'Cynefin Navigator';
  insert into play_practices (play_number, practice_id, sort_order)
  select 3, id, 1 from practices where title = 'Safe-to-Fail Experiments';
  insert into play_practices (play_number, practice_id, sort_order)
  select 3, id, 2 from practices where title = 'Decision Architecture';

  insert into play_practices (play_number, practice_id, sort_order)
  select 4, id, 0 from practices where title = 'Team Operating System Design';
  insert into play_practices (play_number, practice_id, sort_order)
  select 4, id, 1 from practices where title = 'Trust & Candor Protocol';
  insert into play_practices (play_number, practice_id, sort_order)
  select 4, id, 2 from practices where title = 'Collaborative Reflection';

  insert into play_practices (play_number, practice_id, sort_order)
  select 5, id, 0 from practices where title = 'Value Creation Cycle';
  insert into play_practices (play_number, practice_id, sort_order)
  select 5, id, 1 from practices where title = 'Impact Assessment';
  insert into play_practices (play_number, practice_id, sort_order)
  select 5, id, 2 from practices where title = 'Portfolio of Bets';

end if;
end $seed2$;

-- ===== resources-schema.sql =====
-- VCT Resources Schema
-- Idempotent — safe to re-run. Seed runs only when table empty.

create table if not exists resources (
  id uuid default gen_random_uuid() primary key,
  play integer not null check (play between 0 and 599),
  title text not null,
  author text,
  resource_type text not null default 'book' check (resource_type in ('book','article','reference','video','podcast','tool','powerpoint')),
  url text,
  description text,
  created_at timestamptz default now()
);

alter table resources enable row level security;

drop policy if exists "Anyone can read resources" on resources;
create policy "Anyone can read resources" on resources for select using (true);
drop policy if exists "Anyone can add resources" on resources;
create policy "Anyone can add resources" on resources for insert with check (true);
drop policy if exists "Anyone can update resources" on resources;
create policy "Anyone can update resources" on resources for update using (true);
drop policy if exists "Anyone can delete resources" on resources;
create policy "Anyone can delete resources" on resources for delete using (true);

create index if not exists idx_resources_play on resources(play);

-- =============================================================
-- Seed: only when resources table is empty
-- =============================================================
do $seed$
begin
if (select count(*) from resources) = 0 then

  insert into resources (play, title, author, resource_type, url) values
  (1, 'Making Sense of the Organization', 'Karl E. Weick', 'book', 'https://www.amazon.com/Making-Sense-Organization-Karl-Weick/dp/0631223193'),
  (1, 'Sensemaking in Organizations', 'Karl E. Weick', 'book', 'https://www.amazon.com/Sensemaking-Organizations-Foundations-Organizational-Science/dp/080397177X'),
  (1, 'The Fifth Discipline', 'Peter Senge', 'book', 'https://www.amazon.com/Fifth-Discipline-Practice-Learning-Organization/dp/0385517254'),
  (1, 'The Art of Strategic Sensemaking', 'Harvard Business Review', 'article', 'https://hbr.org/2005/11/the-art-of-strategic-sensemaking'),
  (1, 'Three Horizons: The Patterning of Hope', 'Bill Sharpe', 'book', 'https://www.amazon.com/Three-Horizons-Patterning-Hope/dp/1909470384'),
  (1, 'The Alchemy of Growth', 'Mehrdad Baghai, Stephen Coley & David White', 'book', 'https://www.amazon.com/Alchemy-Growth-Practical-Insights-Building/dp/0738203092'),
  (1, 'Three Horizons Methodology', 'International Futures Forum', 'reference', 'https://www.internationalfuturesforum.com/three-horizons'),
  (1, 'Thinking in Bets', 'Annie Duke', 'book', 'https://www.amazon.com/Thinking-Bets-Making-Smarter-Decisions/dp/0735216371'),
  (1, 'Superforecasting', 'Philip Tetlock & Dan Gardner', 'book', 'https://www.amazon.com/Superforecasting-Science-Prediction-Philip-Tetlock/dp/0804136718');

  insert into resources (play, title, author, resource_type, url) values
  (2, 'The Art of the Long View', 'Peter Schwartz', 'book', 'https://www.amazon.com/Art-Long-View-Planning-Uncertain/dp/0385267320'),
  (2, 'Scenario Planning: Managing for the Future', 'Gill Ringland', 'book', 'https://www.amazon.com/Scenario-Planning-Managing-Future-Ringland/dp/0470023686'),
  (2, 'Competing for the Future', 'Gary Hamel & C.K. Prahalad', 'book', 'https://www.amazon.com/Competing-Future-Gary-Hamel/dp/0875847161'),
  (2, 'Shell Scenarios Methodology', 'Royal Dutch Shell', 'reference', 'https://www.shell.com/energy-and-innovation/the-energy-future/scenarios.html'),
  (2, 'Stretch: Unlock the Power of Less', 'Scott Sonenshein', 'book', 'https://www.amazon.com/Stretch-Unlock-Power-Less-Beyond/dp/0062457233'),
  (2, 'Good Strategy Bad Strategy', 'Richard Rumelt', 'book', 'https://www.amazon.com/Good-Strategy-Bad-Difference-Matters/dp/0307886239'),
  (2, 'Playing to Win', 'A.G. Lafley & Roger Martin', 'book', 'https://www.amazon.com/Playing-Win-Strategy-Really-Works/dp/142218739X'),
  (2, 'The Natural Step for Business', 'Karl-Henrik Robert', 'book', 'https://www.amazon.com/Natural-Step-Business-Sustainability/dp/0865714231'),
  (2, 'Backcasting: A Framework for Strategic Planning', 'John B. Robinson', 'article', 'https://doi.org/10.1016/0040-1625(90)90039-X');

  insert into resources (play, title, author, resource_type, url) values
  (3, 'Cynefin: Weaving Sense-Making into the Fabric of Our World', 'Dave Snowden et al.', 'book', 'https://www.amazon.com/Cynefin-Weaving-Sense-Making-Fabric-World/dp/1733903801'),
  (3, 'A Leader''s Framework for Decision Making', 'David J. Snowden & Mary E. Boone', 'article', 'https://hbr.org/2007/11/a-leaders-framework-for-decision-making'),
  (3, 'The Cynefin Company Resources', 'The Cynefin Company', 'reference', 'https://thecynefin.co/about-us/about-cynefin-framework/'),
  (3, 'Probe, Sense, Respond Methodology', 'Complexity Science literature', 'reference', 'https://thecynefin.co/about-us/about-cynefin-framework/'),
  (3, 'Adaptive Action', 'Glenda Eoyang & Royce Holladay', 'book', 'https://www.amazon.com/Adaptive-Action-Leveraging-Uncertainty-Organization/dp/0804786921'),
  (3, 'Safe Enough to Try', 'Sociocracy & Complexity literature', 'reference', 'https://patterns.sociocracy30.org/consent-decision-making.html'),
  (3, 'Thinking, Fast and Slow', 'Daniel Kahneman', 'book', 'https://www.amazon.com/Thinking-Fast-Slow-Daniel-Kahneman/dp/0374533555'),
  (3, 'Decisive', 'Chip Heath & Dan Heath', 'book', 'https://www.amazon.com/Decisive-Make-Better-Choices-Life/dp/0307956393'),
  (3, 'How Big Things Get Done', 'Bent Flyvbjerg & Dan Gardner', 'book', 'https://www.amazon.com/How-Big-Things-Get-Done/dp/0593239512');

  insert into resources (play, title, author, resource_type, url) values
  (4, 'The Wisdom of Teams', 'Jon Katzenbach & Douglas Smith', 'book', 'https://www.amazon.com/Wisdom-Teams-High-Performance-Organization-Essentials/dp/0060522003'),
  (4, 'Team of Teams', 'General Stanley McChrystal', 'book', 'https://www.amazon.com/Team-Teams-Rules-Engagement-Complex/dp/1591847486'),
  (4, 'Teaming', 'Amy Edmondson', 'book', 'https://www.amazon.com/Teaming-Organizations-Innovate-Compete-Knowledge/dp/078797093X'),
  (4, 'The Five Dysfunctions of a Team', 'Patrick Lencioni', 'book', 'https://www.amazon.com/Five-Dysfunctions-Team-Leadership-Fable/dp/0787960756'),
  (4, 'Who Can You Trust?', 'Rachel Botsman', 'book', 'https://www.amazon.com/Who-Can-You-Trust-Technology/dp/1541773675'),
  (4, 'The Fearless Organization', 'Amy Edmondson', 'book', 'https://www.amazon.com/Fearless-Organization-Psychological-Workplace-Innovation/dp/1119477247'),
  (4, 'Radical Candor', 'Kim Scott', 'book', 'https://www.amazon.com/Radical-Candor-Revised-Kick-Ass-Humanity/dp/1250235375'),
  (4, 'An Everyone Culture', 'Robert Kegan & Lisa Laskow Lahey', 'book', 'https://www.amazon.com/Everyone-Culture-Deliberately-Developmental-Organization/dp/1625278624'),
  (4, 'Daring Greatly', 'Brene Brown', 'book', 'https://www.amazon.com/Daring-Greatly-Courage-Vulnerable-Transforms/dp/1592408419'),
  (4, 'Humanocracy', 'Gary Hamel & Michele Zanini', 'book', 'https://www.amazon.com/Humanocracy-Creating-Organizations-Amazing-People/dp/1633696022'),
  (4, 'Humble Inquiry', 'Edgar Schein', 'book', 'https://www.amazon.com/Humble-Inquiry-Gentle-Instead-Telling/dp/1609949811'),
  (4, 'Reflective Practice', 'Donald Schon', 'book', 'https://www.amazon.com/Reflective-Practitioner-Professionals-Think-Action/dp/0465068782'),
  (4, 'Action Science', 'Chris Argyris, Robert Putnam & Diana Smith', 'book', 'https://www.amazon.com/Action-Science-Concepts-Methods-Practice/dp/0875896650'),
  (4, 'U.S. Army After Action Review', 'U.S. Army', 'reference', 'https://www.call.army.mil/');

  insert into resources (play, title, author, resource_type, url) values
  (5, 'Playing to Win', 'A.G. Lafley & Roger Martin', 'book', 'https://www.amazon.com/Playing-Win-Strategy-Really-Works/dp/142218739X'),
  (5, 'The Innovator''s Dilemma', 'Clayton Christensen', 'book', 'https://www.amazon.com/Innovators-Dilemma-Technologies-Management-Innovation/dp/1633691780'),
  (5, 'Blue Ocean Strategy', 'W. Chan Kim & Renee Mauborgne', 'book', 'https://www.amazon.com/Blue-Ocean-Strategy-Expanded-Uncontested/dp/1625274491'),
  (5, 'Loonshots', 'Safi Bahcall', 'book', 'https://www.amazon.com/Loonshots-Nurture-Diseases-Transform-Armies/dp/1250185963'),
  (5, 'Humanocracy', 'Gary Hamel & Michele Zanini', 'book', 'https://www.amazon.com/Humanocracy-Creating-Organizations-Amazing-People/dp/1633696022'),
  (5, 'Who Can You Trust?', 'Rachel Botsman', 'book', 'https://www.amazon.com/Who-Can-You-Trust-Technology/dp/1541773675'),
  (5, 'Measure What Matters', 'John Doerr', 'book', 'https://www.amazon.com/Measure-What-Matters-Google-Foundation/dp/0525536221'),
  (5, 'The Lean Startup', 'Eric Ries', 'book', 'https://www.amazon.com/Lean-Startup-Entrepreneurs-Continuous-Innovation/dp/0307887898'),
  (5, 'Outcomes Over Output', 'Josh Seiden', 'book', 'https://www.amazon.com/Outcomes-Over-Output-customer-behavior/dp/1091173265'),
  (5, 'The Alchemy of Growth', 'Mehrdad Baghai, Stephen Coley & David White', 'book', 'https://www.amazon.com/Alchemy-Growth-Practical-Insights-Building/dp/0738203092'),
  (5, 'Discovery-Driven Growth', 'Rita McGrath & Ian MacMillan', 'book', 'https://www.amazon.com/Discovery-Driven-Growth-Breakthrough-Process-Opportunity/dp/1591396859'),
  (5, 'Antifragile', 'Nassim Nicholas Taleb', 'book', 'https://www.amazon.com/Antifragile-Things-That-Disorder-Incerto/dp/0812979680');

end if;
end $seed$;

-- ===== resources-thumbnail-migration.sql =====
-- Migration: Add thumbnail_url column to resources table
-- Run this in Supabase SQL Editor

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Optional: create the thumbnails folder convention in the resources storage bucket
-- (This is handled client-side via uploads to resources/thumbnails/)

-- ===== auth-clients-schema.sql =====
-- ============================================================
-- Supabase schema: FBSN auth profiles + Client management
-- Idempotent — safe to re-run.
-- Uses fbsn_profiles to avoid colliding with Mise En Place's
-- existing public.profiles table in the shared Supabase project.
-- ============================================================

-- 0. Invitation codes (gate signup)
create table if not exists invite_codes (
  id          uuid default gen_random_uuid() primary key,
  code        text not null unique,
  role        text not null default 'practitioner' check (role in ('admin','practitioner','viewer')),
  max_uses    integer not null default 0,   -- 0 = unlimited
  times_used  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

alter table invite_codes enable row level security;

drop policy if exists "Invite codes: public read" on invite_codes;
create policy "Invite codes: public read" on invite_codes for select using (true);

drop policy if exists "Invite codes: auth update" on invite_codes;
create policy "Invite codes: auth update" on invite_codes for update using (true);

insert into invite_codes (code, role, max_uses) values
  ('VCT-ADMIN-2024', 'admin', 1),
  ('VCT-TEAM-2024', 'practitioner', 0)
on conflict (code) do nothing;


-- 1. FBSN user profiles (separate from Mise En Place's profiles table)
create table if not exists fbsn_profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'practitioner' check (role in ('admin','practitioner','viewer')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table fbsn_profiles enable row level security;

drop policy if exists "FBSN profiles: authenticated read" on fbsn_profiles;
create policy "FBSN profiles: authenticated read" on fbsn_profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "FBSN profiles: self update" on fbsn_profiles;
create policy "FBSN profiles: self update" on fbsn_profiles
  for update using (auth.uid() = id);

drop policy if exists "FBSN profiles: insert own" on fbsn_profiles;
create policy "FBSN profiles: insert own" on fbsn_profiles
  for insert with check (auth.uid() = id);

-- Replace the shared on-signup trigger function so both apps get their rows.
-- Mise En Place expects: profiles + dietary_profiles. FBSN adds fbsn_profiles.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Mise En Place
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.dietary_profiles (user_id)
  values (new.id)
  on conflict do nothing;

  -- FBSN
  insert into public.fbsn_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'practitioner')
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger already exists from Mise En Place's 001_initial.sql; ensure it's there.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Clients
create table if not exists clients (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  organization    text not null default '',
  contact_email   text default '',
  contact_phone   text default '',
  pipeline_stage  text not null default 'lead'
    check (pipeline_stage in ('lead','qualified','proposal','negotiation','won','lost')),
  notes           text default '',
  created_by      uuid references fbsn_profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table clients enable row level security;

drop policy if exists "Clients: authenticated read" on clients;
create policy "Clients: authenticated read" on clients for select using (auth.role() = 'authenticated');
drop policy if exists "Clients: authenticated insert" on clients;
create policy "Clients: authenticated insert" on clients for insert with check (auth.role() = 'authenticated');
drop policy if exists "Clients: authenticated update" on clients;
create policy "Clients: authenticated update" on clients for update using (auth.role() = 'authenticated');
drop policy if exists "Clients: authenticated delete" on clients;
create policy "Clients: authenticated delete" on clients for delete using (auth.role() = 'authenticated');


-- 3. Projects
create table if not exists projects (
  id              uuid default gen_random_uuid() primary key,
  client_id       uuid references clients(id) on delete cascade not null,
  title           text not null,
  description     text default '',
  current_stage   text not null default 'calibration'
    check (current_stage in ('calibration','scaffolding','ongoing','complete')),
  start_date      date,
  target_end_date date,
  status          text not null default 'active'
    check (status in ('active','paused','complete','archived')),
  created_by      uuid references fbsn_profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table projects enable row level security;

drop policy if exists "Projects: authenticated read" on projects;
create policy "Projects: authenticated read" on projects for select using (auth.role() = 'authenticated');
drop policy if exists "Projects: authenticated insert" on projects;
create policy "Projects: authenticated insert" on projects for insert with check (auth.role() = 'authenticated');
drop policy if exists "Projects: authenticated update" on projects;
create policy "Projects: authenticated update" on projects for update using (auth.role() = 'authenticated');
drop policy if exists "Projects: authenticated delete" on projects;
create policy "Projects: authenticated delete" on projects for delete using (auth.role() = 'authenticated');


-- 4. Artifacts
create table if not exists artifacts (
  id              uuid default gen_random_uuid() primary key,
  project_id      uuid references projects(id) on delete cascade not null,
  stage           text not null
    check (stage in ('calibration','scaffolding','ongoing')),
  artifact_type   text not null default 'document'
    check (artifact_type in ('document','exercise_output','meeting_notes','template','other')),
  title           text not null,
  description     text default '',
  content         text default '',
  url             text default '',
  created_by      uuid references fbsn_profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table artifacts enable row level security;

drop policy if exists "Artifacts: authenticated read" on artifacts;
create policy "Artifacts: authenticated read" on artifacts for select using (auth.role() = 'authenticated');
drop policy if exists "Artifacts: authenticated insert" on artifacts;
create policy "Artifacts: authenticated insert" on artifacts for insert with check (auth.role() = 'authenticated');
drop policy if exists "Artifacts: authenticated update" on artifacts;
create policy "Artifacts: authenticated update" on artifacts for update using (auth.role() = 'authenticated');
drop policy if exists "Artifacts: authenticated delete" on artifacts;
create policy "Artifacts: authenticated delete" on artifacts for delete using (auth.role() = 'authenticated');


-- 5. Stage tasks
create table if not exists stage_tasks (
  id              uuid default gen_random_uuid() primary key,
  project_id      uuid references projects(id) on delete cascade not null,
  stage           text not null
    check (stage in ('calibration','scaffolding','ongoing')),
  title           text not null,
  description     text default '',
  is_complete     boolean default false,
  sort_order      integer default 0,
  completed_at    timestamptz,
  created_at      timestamptz default now()
);

alter table stage_tasks enable row level security;

drop policy if exists "Stage tasks: authenticated read" on stage_tasks;
create policy "Stage tasks: authenticated read" on stage_tasks for select using (auth.role() = 'authenticated');
drop policy if exists "Stage tasks: authenticated insert" on stage_tasks;
create policy "Stage tasks: authenticated insert" on stage_tasks for insert with check (auth.role() = 'authenticated');
drop policy if exists "Stage tasks: authenticated update" on stage_tasks;
create policy "Stage tasks: authenticated update" on stage_tasks for update using (auth.role() = 'authenticated');
drop policy if exists "Stage tasks: authenticated delete" on stage_tasks;
create policy "Stage tasks: authenticated delete" on stage_tasks for delete using (auth.role() = 'authenticated');
