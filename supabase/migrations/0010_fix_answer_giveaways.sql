-- Trims answer-echoing text out of question prompts flagged by an audit
-- for handing the answer away for free -- each of these had the correct
-- option's own distinctive wording (a year, a brand, a person's name)
-- restated directly in the question text, so the right choice could be
-- pattern-matched without any real recall. Only question wording changes
-- here -- options/correct_index are untouched, and every rewrite keeps
-- the question answerable from genuine knowledge of the same fact.
--
-- Audited: every active question (1,540 rows) scanned for a shared
-- literal number, or a distinctive word appearing in the question and
-- ONLY the correct option among all four, between the question text and
-- its own correct option. The 17 fixed here were the clear cases -- a
-- named person/brand/place stated as fact and then just repeated in the
-- answer; softer/coincidental overlaps (a movie literally named after
-- its own plot, a generic category word, homograph collisions) were
-- left alone since flagging those isn't the same "way too easy" problem
-- and rewriting them on a blunt heuristic risked doing more harm than
-- good to otherwise-fine questions.

update questions set text = 'What landmark U.S. legislation outlawed discrimination based on race, color, religion, sex, or national origin?' where id = 'c039150d-3d53-4c65-bb65-a07f07c19dd7';
update questions set text = 'What vault do players emerge from in the Fallout game set in Appalachia, West Virginia?' where id = '6c2ce4b5-f564-46f6-a726-8a6303600cf6';
update questions set text = 'What flat-ironed hairstyle, often dyed jet black with contrasting streaks and angled sharply across the forehead, defined 2000s emo and scene subculture?' where id = '0ad4a5fe-6b95-4c79-bd77-1c8fdf66b1c3';
update questions set text = 'What sitcom, set in a small fictional North Carolina town, starred a folksy leading man as a widowed sheriff raising his young son?' where id = '0ffd404c-7d19-4a1a-a223-2462acbb3c26';
update questions set text = 'What phrase, describing erratic public behavior, originated from Tom Cruise''s excited jumping and shouting during a 2005 daytime talk-show appearance?' where id = '184dd8c1-5867-4113-9832-eaf2a7f1c0e7';
update questions set text = 'What behind-the-scenes term describes the mock practice sessions Josh and the senior staff run to prepare Santos for facing Vinick head-to-head?' where id = '193102c0-682b-4547-8a1c-06aa586463b8';
update questions set text = 'What 1968 event, marked by violent clashes between police and anti-war protesters outside a presidential nominating convention, became a defining image of that year''s unrest?' where id = '19cdc03c-d59e-4d4e-95a9-ca05fda486e0';
update questions set text = 'What ultra-thin flip phone, released in 2004, became a fashion status symbol as much as a communication device?' where id = '1d714d0d-f6c6-4c1e-9b61-d6ea3407e084';
update questions set text = 'What catchphrase did Damon Wayans''s disgruntled ex-con clown character use on ''In Living Color'' to refuse a request?' where id = '1e394a4d-4af3-4649-9f03-fddb2c1b0395';
update questions set text = 'What Motown vocal group, fronted by a smooth-voiced singer who later became a celebrated solo artist and Motown VP, had hits like ''The Tears of a Clown''?' where id = '22748481-9a96-48f8-9013-67e8c6afa9da';
update questions set text = 'What fitness fad, combining skating with dance moves at rinks that pumped the era''s popular dance music, became a popular pastime in the late 1970s?' where id = '2b0c08a5-b1d3-428b-8b5e-19824a1f4a78';
update questions set text = 'What voice-activated smart speaker, launched in November 2014, introduced its virtual assistant ''Alexa'' into millions of homes?' where id = '415afad4-e3ce-45bf-8f03-75db1510a25f';
update questions set text = 'What term describes the wave of rock bands from across the Atlantic, led by The Beatles, that dominated American charts starting in 1964?' where id = '4389e9f3-73f3-4421-b3bc-8547e74d29a4';
update questions set text = 'What Childish Gambino single and music video, released in May 2018, sparked widespread analysis for its imagery addressing gun violence and racism in the United States?' where id = '77861b34-ef5b-4e1c-b677-56a8625d434e';
update questions set text = 'What basketball shoe brand did a rising NBA superstar famously debut in 1985, sparking a high-top sneaker craze?' where id = '8fcac1bc-b4db-482c-a4e1-606eef3bb6b3';
update questions set text = 'What home video game console, released in 1977, popularized cartridge-based gaming?' where id = 'c18d0231-14cf-40fd-a804-88478f52b73f';
update questions set text = 'What Motown family group of brothers, featuring a young future King of Pop, topped charts in the early 1970s?' where id = 'f238d714-72ee-4197-8ce9-08ca0dbe19f4';
