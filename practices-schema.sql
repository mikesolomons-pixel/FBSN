-- ============================================================
-- Supabase schema for dynamic practices management
-- ============================================================

-- 1. practices table
create table practices (
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

-- unique partial index: resource_play_id must be unique when set
create unique index practices_resource_play_id_unique
  on practices (resource_play_id)
  where resource_play_id is not null;

-- 2. play_practices junction table
create table play_practices (
  id            uuid    default gen_random_uuid() primary key,
  play_number   integer not null check (play_number between 1 and 5),
  practice_id   uuid    not null references practices(id) on delete cascade,
  sort_order    integer not null default 0,
  created_at    timestamptz default now(),
  unique (play_number, practice_id)
);

create index play_practices_play_sort
  on play_practices (play_number, sort_order);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table practices enable row level security;
alter table play_practices enable row level security;

-- Open read/insert/update/delete policies (matches existing app pattern)
create policy "Allow public read on practices"
  on practices for select using (true);

create policy "Allow public insert on practices"
  on practices for insert with check (true);

create policy "Allow public update on practices"
  on practices for update using (true) with check (true);

create policy "Allow public delete on practices"
  on practices for delete using (true);

create policy "Allow public read on play_practices"
  on play_practices for select using (true);

create policy "Allow public insert on play_practices"
  on play_practices for insert with check (true);

create policy "Allow public update on play_practices"
  on play_practices for update using (true) with check (true);

create policy "Allow public delete on play_practices"
  on play_practices for delete using (true);

-- ============================================================
-- Seed data: 16 practices
-- ============================================================

-- Play 1 – Sensemaking
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
  'Three Horizons Scanning',
  '',
  'coming-soon',
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

-- Play 2 – Imagining
insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
values
(
  'Future Visioning',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Compelling shared vision of the future","Emotional and strategic alignment"]'::jsonb,
  '["Vision statement or narrative","Key elements of the desired future state"]'::jsonb,
  '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
  201
),
(
  'Strategic Ambition Setting',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Clear strategic ambition","Defined strategic boundaries and focus areas"]'::jsonb,
  '["Strategic ambition statement","Success criteria and milestones"]'::jsonb,
  '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
  202
),
(
  'Backcasting',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Clear pathway from future vision to present actions","Identified capability gaps and development needs"]'::jsonb,
  '["Reverse timeline with key milestones","Near-term actions connected to long-term vision"]'::jsonb,
  '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
  203
),
(
  'The Future Backwards',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Expanded perspective on possible futures","Identification of critical branching points","Shared language for discussing uncertainty"]'::jsonb,
  '["Future Backwards narrative map","Critical decision points identified","Weak signals to monitor that indicate which narrative is unfolding"]'::jsonb,
  '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
  204
);

-- Play 3 – Navigating
insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
values
(
  'Cynefin Navigator',
  '',
  'automated',
  '[]'::jsonb,
  '["Shared understanding of which domain each challenge belongs to","Domain-appropriate response strategies","Reduced misapplication of methods"]'::jsonb,
  '["Categorized strategic challenges","Domain-specific action plans"]'::jsonb,
  '[{"label":"Launch Cynefin Navigator","url":"cynefin.html","style":"primary"}]'::jsonb,
  301
),
(
  'Safe-to-Fail Experiments',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Portfolio of low-risk experiments","Rapid learning about complex challenges","Reduced fear of failure"]'::jsonb,
  '["Experiment design documents","Success and failure criteria","Learning extraction protocols"]'::jsonb,
  '[{"label":"Available via Cynefin Navigator","url":"cynefin.html","style":"secondary"},{"label":"Full Version Coming Soon","url":"","style":"disabled"}]'::jsonb,
  302
),
(
  'Decision Architecture',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Clear decision-making frameworks","Appropriate decision rights allocation","Faster, more confident decisions"]'::jsonb,
  '["Decision architecture map","Categorized decision rights and processes"]'::jsonb,
  '[{"label":"Coming Soon","url":"","style":"disabled"}]'::jsonb,
  303
);

-- Play 4 – Collaborating
insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
values
(
  'Team Operating System Design',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Clear team operating agreements","Explicit norms and expectations","Shared language for how the team works"]'::jsonb,
  '["Team operating manual or charter","Meeting rhythms, decision processes, and communication norms"]'::jsonb,
  '[{"label":"Coming Soon \u2014 Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
  401
),
(
  'Trust & Candor Protocol',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Increased psychological safety","More honest and direct communication","Stronger interpersonal trust"]'::jsonb,
  '["Trust assessment baseline","Agreed candor norms and feedback practices"]'::jsonb,
  '[{"label":"Coming Soon \u2014 Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
  402
),
(
  'Collaborative Reflection',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Regular learning from team experience","Continuous improvement of team processes","Stronger collective intelligence"]'::jsonb,
  '["Reflection insights and action items","Adjusted team practices based on reflection"]'::jsonb,
  '[{"label":"Coming Soon \u2014 Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
  403
);

-- Play 5 – Value Creating
insert into practices (title, description, status, modes, outcomes, outputs, action_links, resource_play_id)
values
(
  'Value Creation Cycle',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Systematic approach to value creation","Clear link between team activities and outcomes","Measurable value indicators"]'::jsonb,
  '["Value creation map","Stakeholder impact assessment"]'::jsonb,
  '[{"label":"Coming Soon \u2014 Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
  501
),
(
  'Impact Assessment',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Clear understanding of team impact","Evidence-based improvement priorities","Stakeholder alignment on value"]'::jsonb,
  '["Impact assessment report","Priority areas for improvement"]'::jsonb,
  '[{"label":"Coming Soon \u2014 Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
  502
),
(
  'Portfolio of Bets',
  '',
  'coming-soon',
  '[]'::jsonb,
  '["Strategic portfolio of experiments and initiatives","Balanced risk across time horizons","Clear criteria for scaling, continuing, or stopping"]'::jsonb,
  '["Portfolio map across three horizons","Investment allocation framework","Regular review cadence and criteria"]'::jsonb,
  '[{"label":"Coming Soon \u2014 Automated Tool in Development","url":"","style":"disabled"}]'::jsonb,
  503
);

-- ============================================================
-- Seed play_practices junction rows
-- ============================================================

-- Play 1 – Sensemaking
insert into play_practices (play_number, practice_id, sort_order)
select 1, id, 0 from practices where title = 'FBSN Exercise';

insert into play_practices (play_number, practice_id, sort_order)
select 1, id, 1 from practices where title = 'Three Horizons Scanning';

insert into play_practices (play_number, practice_id, sort_order)
select 1, id, 2 from practices where title = 'Assumption Mapping';

-- Play 2 – Imagining
insert into play_practices (play_number, practice_id, sort_order)
select 2, id, 0 from practices where title = 'Future Visioning';

insert into play_practices (play_number, practice_id, sort_order)
select 2, id, 1 from practices where title = 'Strategic Ambition Setting';

insert into play_practices (play_number, practice_id, sort_order)
select 2, id, 2 from practices where title = 'Backcasting';

insert into play_practices (play_number, practice_id, sort_order)
select 2, id, 3 from practices where title = 'The Future Backwards';

-- Play 3 – Navigating
insert into play_practices (play_number, practice_id, sort_order)
select 3, id, 0 from practices where title = 'Cynefin Navigator';

insert into play_practices (play_number, practice_id, sort_order)
select 3, id, 1 from practices where title = 'Safe-to-Fail Experiments';

insert into play_practices (play_number, practice_id, sort_order)
select 3, id, 2 from practices where title = 'Decision Architecture';

-- Play 4 – Collaborating
insert into play_practices (play_number, practice_id, sort_order)
select 4, id, 0 from practices where title = 'Team Operating System Design';

insert into play_practices (play_number, practice_id, sort_order)
select 4, id, 1 from practices where title = 'Trust & Candor Protocol';

insert into play_practices (play_number, practice_id, sort_order)
select 4, id, 2 from practices where title = 'Collaborative Reflection';

-- Play 5 – Value Creating
insert into play_practices (play_number, practice_id, sort_order)
select 5, id, 0 from practices where title = 'Value Creation Cycle';

insert into play_practices (play_number, practice_id, sort_order)
select 5, id, 1 from practices where title = 'Impact Assessment';

insert into play_practices (play_number, practice_id, sort_order)
select 5, id, 2 from practices where title = 'Portfolio of Bets';
