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
