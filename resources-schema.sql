-- VCT Resources Schema
-- Run this in your Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- Resources table
create table resources (
  id uuid default gen_random_uuid() primary key,
  play integer not null check (play between 1 and 5),
  title text not null,
  author text,
  resource_type text not null default 'book' check (resource_type in ('book','article','reference','video','podcast','tool')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table resources enable row level security;

-- Public access policies
create policy "Anyone can read resources" on resources for select using (true);
create policy "Anyone can add resources" on resources for insert with check (true);
create policy "Anyone can delete resources" on resources for delete using (true);

-- Index
create index idx_resources_play on resources(play);

-- =============================================================
-- Seed data: existing resources from all five plays
-- =============================================================

-- Play 1: Sensemaking
insert into resources (play, title, author, resource_type) values
(1, 'Making Sense of the Organization', 'Karl E. Weick', 'book'),
(1, 'Sensemaking in Organizations', 'Karl E. Weick', 'book'),
(1, 'The Fifth Discipline', 'Peter Senge', 'book'),
(1, 'The Art of Strategic Sensemaking', 'Harvard Business Review', 'article'),
(1, 'Three Horizons: The Patterning of Hope', 'Bill Sharpe', 'book'),
(1, 'The Alchemy of Growth', 'Mehrdad Baghai, Stephen Coley & David White', 'book'),
(1, 'Three Horizons Methodology', 'International Futures Forum', 'reference'),
(1, 'Thinking in Bets', 'Annie Duke', 'book'),
(1, 'Superforecasting', 'Philip Tetlock & Dan Gardner', 'book');

-- Play 2: Imagining
insert into resources (play, title, author, resource_type) values
(2, 'The Art of the Long View', 'Peter Schwartz', 'book'),
(2, 'Scenario Planning: Managing for the Future', 'Gill Ringland', 'book'),
(2, 'Competing for the Future', 'Gary Hamel & C.K. Prahalad', 'book'),
(2, 'Shell Scenarios Methodology', 'Royal Dutch Shell', 'reference'),
(2, 'Stretch: Unlock the Power of Less', 'Scott Sonenshein', 'book'),
(2, 'Good Strategy Bad Strategy', 'Richard Rumelt', 'book'),
(2, 'Playing to Win', 'A.G. Lafley & Roger Martin', 'book'),
(2, 'The Natural Step for Business', 'Karl-Henrik Robèrt', 'book'),
(2, 'Backcasting: A Framework for Strategic Planning', 'John B. Robinson', 'article');

-- Play 3: Navigating
insert into resources (play, title, author, resource_type) values
(3, 'Cynefin: Weaving Sense-Making into the Fabric of Our World', 'Dave Snowden et al.', 'book'),
(3, 'A Leader''s Framework for Decision Making', 'David J. Snowden & Mary E. Boone (HBR)', 'article'),
(3, 'Cognitive Edge / The Cynefin Company Resources', 'The Cynefin Company', 'reference'),
(3, 'Probe, Sense, Respond Methodology', 'Complexity Science literature', 'reference'),
(3, 'Adaptive Action', 'Glenda Eoyang & Royce Holladay', 'book'),
(3, 'Safe Enough to Try', 'Sociocracy & Complexity literature', 'reference'),
(3, 'Thinking, Fast and Slow', 'Daniel Kahneman', 'book'),
(3, 'Decisive', 'Chip Heath & Dan Heath', 'book'),
(3, 'How Big Things Get Done', 'Bent Flyvbjerg & Dan Gardner', 'book');

-- Play 4: Collaborating
insert into resources (play, title, author, resource_type) values
(4, 'The Wisdom of Teams', 'Jon Katzenbach & Douglas Smith', 'book'),
(4, 'Team of Teams', 'General Stanley McChrystal', 'book'),
(4, 'Teaming', 'Amy Edmondson', 'book'),
(4, 'The Five Dysfunctions of a Team', 'Patrick Lencioni', 'book'),
(4, 'Who Can You Trust?', 'Rachel Botsman', 'book'),
(4, 'The Fearless Organization', 'Amy Edmondson', 'book'),
(4, 'Radical Candor', 'Kim Scott', 'book'),
(4, 'An Everyone Culture', 'Robert Kegan & Lisa Laskow Lahey', 'book'),
(4, 'Daring Greatly', 'Brené Brown', 'book'),
(4, 'Humanocracy', 'Gary Hamel & Michele Zanini', 'book'),
(4, 'Humble Inquiry', 'Edgar Schein', 'book'),
(4, 'Reflective Practice', 'Donald Schön', 'book'),
(4, 'Action Science', 'Chris Argyris, Robert Putnam & Diana Smith', 'book'),
(4, 'U.S. Army After Action Review', 'U.S. Army', 'reference');

-- Play 5: Value Creating
insert into resources (play, title, author, resource_type) values
(5, 'Playing to Win', 'A.G. Lafley & Roger Martin', 'book'),
(5, 'The Innovator''s Dilemma', 'Clayton Christensen', 'book'),
(5, 'Blue Ocean Strategy', 'W. Chan Kim & Renée Mauborgne', 'book'),
(5, 'Loonshots', 'Safi Bahcall', 'book'),
(5, 'Humanocracy', 'Gary Hamel & Michele Zanini', 'book'),
(5, 'Who Can You Trust?', 'Rachel Botsman', 'book'),
(5, 'Measure What Matters', 'John Doerr', 'book'),
(5, 'The Lean Startup', 'Eric Ries', 'book'),
(5, 'Outcomes Over Output', 'Josh Seiden', 'book'),
(5, 'The Alchemy of Growth', 'Mehrdad Baghai, Stephen Coley & David White', 'book'),
(5, 'Discovery-Driven Growth', 'Rita McGrath & Ian MacMillan', 'book'),
(5, 'Antifragile', 'Nassim Nicholas Taleb', 'book');
