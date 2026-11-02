// Hand-written game content. Everything here is original and kept family-friendly.
// Invented phrases live ONLY in NONSENSE and are always labelled as made up in the UI.

/** Deliberately invented "slang" for Slang or Nonsense? — not real expressions. */
export const NONSENSE = [
  'blorp mode', 'crunchmaxxing', 'giving sandwich', 'zibble', 'aura tax refund', 'noodle drip', 'mega yonk', 'skrimble',
  'fr fr fr fr', 'tofu rizz', 'cheugy sigma pickle', 'gloopy', 'sheeshcake', 'velvet npc', 'doom brunch', 'lowkey hydrant',
  'yeetle', 'banana aura', 'clanky', 'spaghetti era', 'mid-mid', 'snorg', 'rizztoration', 'the wobble', 'pancaked',
  'cosmic glaze', 'bloop the council', 'flimbo', 'chat is this toast', 'zoomslap', 'quad-cooked', 'triple W tax',
  'snackwave', 'grumblecore', 'pickle check', 'ohio bubble', 'sigma soup', 'crispy aura', 'mooncapping', 'goblin dinner math',
];

export type Verdict = 'smooth' | 'awkward' | 'funny' | 'depends';
export interface RizzItem { text: string; setup: string; verdict: Verdict; why: string }

/** Rizz or Cringe? — friendly social moments, not romantic content aimed at kids. */
export const RIZZ_ITEMS: RizzItem[] = [
  { setup: 'Your friend is nervous before a presentation. You say:', text: '“You already know this stuff. Lock in, then go eat.”', verdict: 'smooth', why: 'Encouraging, confident, and uses slang naturally.' },
  { setup: 'Someone compliments your drawing. You reply:', text: '“Thanks, I studied the art of aura for 67 years.”', verdict: 'funny', why: 'Absurd on purpose — it lands as a joke, not a brag.' },
  { setup: 'Meeting a new classmate:', text: '“Hello fellow youth. Is this the skibidi you speak of?”', verdict: 'awkward', why: 'Forcing slang into a first hello sounds like a parody of a grown-up.' },
  { setup: 'Your teammate scores the winning goal. You yell:', text: '“BRO IS HIM. Absolute cinema.”', verdict: 'smooth', why: 'Big hype at the right moment. Perfect timing.' },
  { setup: 'Trying to join a group game at recess:', text: '“Can I play? I’m kinda cracked at tag.”', verdict: 'smooth', why: 'Friendly ask plus a playful bit of confidence.' },
  { setup: 'Your friend shows you their new haircut:', text: '“It’s… a haircut. Definitely a haircut.”', verdict: 'awkward', why: 'Hesitation reads as an insult even if you didn’t mean one.' },
  { setup: 'A teacher asks if you finished the homework:', text: '“No cap, my dog ate my Wi-Fi.”', verdict: 'funny', why: 'Nobody believes it, but it might get a laugh. Probably still get the homework done.' },
  { setup: 'You send a meme to the group chat at 3 a.m.:', text: '“chat is this real 💀”', verdict: 'depends', why: 'Hilarious to night owls; annoying to anyone woken up by notifications.' },
  { setup: 'Someone shares that they failed a test:', text: '“L + ratio + skill issue.”', verdict: 'awkward', why: 'Roasting someone who’s already down is a bad look. Read the room.' },
  { setup: 'Someone shares that they failed a test:', text: '“That test was the final boss. Next round you’re cooking.”', verdict: 'smooth', why: 'Supportive with just enough slang to keep it light.' },
  { setup: 'Introducing yourself at a new club:', text: '“Hi! I’m new. I bring snacks and zero aura.”', verdict: 'funny', why: 'Self-deprecating humor is a solid icebreaker.' },
  { setup: 'Your friend beats you at a video game:', text: '“GG, you were actually cracked that round.”', verdict: 'smooth', why: 'Good sportsmanship plus a real compliment.' },
  { setup: 'Your friend beats you at a video game:', text: '“Controller was lagging. And the sun was in my eyes. Indoors.”', verdict: 'funny', why: 'Excuses so bad they become a joke. Works if you’re clearly kidding.' },
  { setup: 'A parent tries slang at dinner:', text: '“This casserole is bussin, no cap, fellow kids.”', verdict: 'depends', why: 'Cringe… but kind of wholesome. Context decides.' },
  { setup: 'Someone asks to borrow your pencil:', text: '“Sure, but there’s a fanum tax: one (1) fry at lunch.”', verdict: 'funny', why: 'A playful joke — as long as you actually lend the pencil.' },
  { setup: 'Asking a friend to hang out:', text: '“Wyd Saturday? We should go get tacos.”', verdict: 'smooth', why: 'Casual, clear, and makes a real plan.' },
  { setup: 'Group chat is quiet after you send a long message:', text: '“…anyway that was my TED talk 😭”', verdict: 'funny', why: 'Owning your own yap session is relatable.' },
  { setup: 'Your friend is excited about their new shoes:', text: '“Mid.”', verdict: 'awkward', why: 'One-word downers kill the vibe, even as a joke.' },
  { setup: 'Your friend is excited about their new shoes:', text: '“Okay the drip is crazy. Where’d you get those?”', verdict: 'smooth', why: 'Compliment plus a follow-up question = W.' },
  { setup: 'Talking to your grandma:', text: '“Grandma, your cookies have infinite aura.”', verdict: 'depends', why: 'She may not know what aura means — but she’ll probably take it as a compliment.' },
  { setup: 'Someone holds the door for you:', text: '“W human. Thank you!”', verdict: 'smooth', why: 'Grateful and a little playful.' },
  { setup: 'Job interview for a summer job:', text: '“Ngl I’m lowkey goated at customer service.”', verdict: 'awkward', why: 'Slang in a formal setting usually backfires. Code-switching is a skill!' },
  { setup: 'Your sibling burns the toast:', text: '“Bro really said ‘charcoal speedrun’.”', verdict: 'funny', why: 'Gentle teasing about something harmless.' },
  { setup: 'Someone new sits alone at lunch. You say:', text: '“Wanna sit with us? Fair warning, we yap a lot.”', verdict: 'smooth', why: 'Kind, inclusive, and honest about the yap levels.' },
  { setup: 'Your friend tells you a secret. You reply:', text: '“Say less. Vault mode activated 🔒”', verdict: 'smooth', why: 'Reassuring and fun.' },
  { setup: 'Asked how your weekend was:', text: '“It was giving… nothing. Absolute NPC weekend.”', verdict: 'funny', why: 'Relatable and self-aware.' },
  { setup: 'You trip in the hallway in front of everyone:', text: '“That was a canon event. Moving on.”', verdict: 'smooth', why: 'Laughing at yourself first takes the sting out. +1000 aura.' },
  { setup: 'A friend asks for honest feedback on their essay:', text: '“It’s fire, no notes,” (you didn’t read it).', verdict: 'awkward', why: 'Glazing instead of helping isn’t actually kind.' },
];

export interface DecoderItem { text: string; options: string[]; answer: number; note: string; absurd: boolean }

/** Brain Rot Decoder — deliberately over-the-top sentences with an intended meaning. */
export const DECODER: DecoderItem[] = [
  { text: 'Bro pulled up with negative aura, got mogged, and is officially cooked.', options: ['He arrived looking uncool, was outshined by someone else, and is now in trouble.', 'He arrived late, ate a lot of food, and fell asleep.', 'He arrived with a new haircut and everyone loved it.', 'He drove a car that broke down.'], answer: 0, note: 'Negative aura = uncool vibes; mogged = outshined; cooked = doomed.', absurd: true },
  { text: 'Chat, the fanum tax on my fries was crazy, I’m crashing out.', options: ['Someone ate a lot of my fries and I’m about to lose it.', 'I had to pay tax on fries at the store.', 'I posted my fries online and got lots of comments.', 'My fries were too salty.'], answer: 0, note: 'Fanum tax = friends taking some of your food; crashing out = losing your temper.', absurd: true },
  { text: 'Lil bro was yapping in Ohio, zero rizz, absolute NPC behavior.', options: ['This kid talked nonstop in a weird way, with no charm, acting totally predictable.', 'A young boy moved to the state of Ohio.', 'A kid gave a great speech and impressed everyone.', 'Someone played a game with computer characters.'], answer: 0, note: '“Ohio” here means weird, not the actual state. NPC = acting robotic or generic.', absurd: true },
  { text: 'She locked in for the final boss and ate. No crumbs.', options: ['She focused hard for the hardest test and did perfectly.', 'She ate a whole cake before a video game.', 'She was locked in a room by her boss.', 'She skipped lunch to play games.'], answer: 0, note: 'Lock in = focus; final boss = the hardest challenge; ate, no crumbs = flawless.', absurd: false },
  { text: 'Skibidi sigma rizzler said six seven and the whole class crashed out.', options: ['Someone said a meme phrase and the class went wild — there’s no deep meaning.', 'The teacher announced test scores of 6 and 7.', 'A smart student solved a math problem.', 'The class got in trouble for being late.'], answer: 0, note: 'This is mostly meme noise. “Six seven” famously doesn’t mean anything specific — the point is the chaos.', absurd: true },
  { text: 'Unc is glazing the new phone update like it’s absolute cinema.', options: ['An older guy is over-praising a phone update as if it were a masterpiece.', 'My uncle broke his phone screen.', 'Someone is watching a movie on a phone.', 'A donut shop released a new flavor.'], answer: 0, note: 'Unc = someone acting older; glazing = over-praising; absolute cinema = a masterpiece.', absurd: true },
  { text: 'Not the delulu situationship lore drop at 2 a.m. 💀', options: ['Someone overshared a late-night backstory about an unclear crush — it’s funny and a bit unrealistic.', 'A new episode of a show dropped at 2 a.m.', 'Someone fell asleep while reading.', 'A video game got a new level.'], answer: 0, note: 'Delulu = unrealistic hopes; lore drop = sharing backstory; 💀 = “I’m dying laughing.”', absurd: false },
  { text: 'That was a W fit, but the shoes? Mid. Still +500 aura.', options: ['The outfit was great, the shoes were average, but overall it looked cool.', 'Someone won a fitness contest.', 'The shoes cost 500 dollars.', 'The outfit was too big.'], answer: 0, note: 'W = win; fit = outfit; mid = average; aura points = coolness.', absurd: false },
  { text: 'Bro hit the griddy, tripped, and lost 10,000 aura in 4K.', options: ['He did a dance, fell, and it was super embarrassing — and caught on camera.', 'He cooked on a griddle and burned the food.', 'He bought a 4K TV.', 'He ran 10,000 steps.'], answer: 0, note: 'The griddy is a dance; losing aura = embarrassment; in 4K = clearly seen or recorded.', absurd: true },
  { text: 'We got a snow day before GTA 6.', options: ['Something surprising happened before a long-awaited thing that keeps getting delayed.', 'A video game came out on a snow day.', 'School is canceled for six days.', 'The weather report was wrong.'], answer: 0, note: '“Before GTA 6” jokes about how long people have waited for that game.', absurd: false },
  { text: 'Erm what the sigma, the cafeteria pizza is bussin today??', options: ['Wait, what? The cafeteria pizza is actually delicious today?', 'The cafeteria ran out of pizza.', 'A sigma is a type of pizza.', 'The cafeteria pizza made someone sick.'], answer: 0, note: '“Erm what the sigma” = a meme way of saying “wait, what?” Bussin = delicious.', absurd: true },
  { text: 'Lowkey cooked on the quiz but highkey slept on the bonus question.', options: ['I kind of did badly on the quiz, and I totally overlooked the bonus question.', 'I baked something during the quiz.', 'I fell asleep during the bonus question.', 'The quiz was about cooking.'], answer: 0, note: 'Here “cooked” = doing badly. “Slept on” = overlooked. Note: “he cooked” can also mean he did great — context matters!', absurd: false },
  { text: 'Pookie said “it’s not that deep” and then crashed out anyway.', options: ['My friend said it wasn’t a big deal, then got really upset about it anyway.', 'My dog fell into a deep pool.', 'Someone went swimming and got lost.', 'A friend refused to go to the beach.'], answer: 0, note: 'Pookie = an affectionate nickname; crashed out = lost their cool.', absurd: false },
  { text: 'Chopped clanker energy with mid rizz and no lore.', options: ['A boring, unappealing, robot-like vibe with no charm and no interesting backstory.', 'A broken robot from a movie.', 'A chef chopping vegetables.', 'A cool story about a robot.'], answer: 0, note: 'Clanker started as a sci-fi word for robots and became a jokey insult for AI/robots; chopped = unattractive or bad. Mostly noise for comedy.', absurd: true },
  { text: 'The group project is giving side quest, and I’m the only one locked in.', options: ['The group project feels like a pointless extra task and I’m the only one focused.', 'Our group is playing a video game instead of working.', 'The project is about medieval quests.', 'Everyone is working hard on the project.'], answer: 0, note: 'Side quest = a random extra task; locked in = focused.', absurd: false },
];

export interface BuildScenario { setup: string; tone: string; pieces: { text: string; fit: 0 | 1 | 2 | 3; why: string }[] }

/** Build-a-Sentence: fit 3 = perfect, 2 = good, 1 = odd but okay, 0 = wrong meaning or tone. */
export const BUILD: BuildScenario[] = [
  { setup: 'Your friend just got an A on an impossible exam.', tone: 'hype', pieces: [
    { text: 'You ate.', fit: 3, why: 'Ate = did amazingly.' }, { text: 'Absolutely goated.', fit: 3, why: 'Goated = the best.' }, { text: 'No cap,', fit: 2, why: 'Adds sincerity.' },
    { text: 'that test was the final boss', fit: 3, why: 'Acknowledges how hard it was.' }, { text: "you're cooked", fit: 0, why: 'Cooked usually means in trouble — wrong vibe.' },
    { text: 'mid', fit: 0, why: 'Mid = mediocre. Ouch.' }, { text: '+1000 aura', fit: 2, why: 'Fun hype bonus.' }, { text: 'skibidi', fit: 1, why: 'Random meme filler — doesn’t add meaning.' } ] },
  { setup: 'Your sibling ate the last slice of pizza you were saving.', tone: 'mock outrage', pieces: [
    { text: 'The fanum tax is out of control', fit: 3, why: 'Fanum tax = someone taking your food.' }, { text: "I'm about to crash out", fit: 3, why: 'Crash out = lose your temper.' },
    { text: 'bro', fit: 2, why: 'Natural address.' }, { text: 'that was so demure', fit: 0, why: 'Demure = modest and polite — not what happened.' },
    { text: 'caught in 4K', fit: 2, why: 'If you saw it happen, they got caught.' }, { text: 'slay', fit: 0, why: 'You would not be congratulating them.' }, { text: 'not cool 😤', fit: 2, why: 'Clear, plain feelings work too.' } ] },
  { setup: 'Class is so boring that time is moving backwards.', tone: 'bored', pieces: [
    { text: 'This class is so mid', fit: 2, why: 'Mid = unimpressive.' }, { text: "I'm in full NPC mode", fit: 3, why: 'NPC mode = zoned out, on autopilot.' },
    { text: 'ngl', fit: 2, why: 'Not gonna lie — natural opener.' }, { text: "it's giving eternity", fit: 3, why: '“It’s giving” = it feels like.' },
    { text: 'absolute cinema', fit: 0, why: 'That means it’s amazing.' }, { text: 'bussin', fit: 0, why: 'Bussin is for delicious food.' }, { text: 'help 😭', fit: 2, why: 'Dramatic but on-tone.' } ] },
  { setup: 'Your friend shows up in a really fresh outfit.', tone: 'compliment', pieces: [
    { text: 'The drip is crazy', fit: 3, why: 'Drip = stylish clothes.' }, { text: 'fit check passed', fit: 3, why: 'Fit = outfit.' }, { text: "you're serving", fit: 3, why: 'Serving = looking great (from ballroom culture).' },
    { text: 'red flag', fit: 0, why: 'A warning sign — not a compliment.' }, { text: 'lowkey', fit: 1, why: 'Softens it — fine, but why be lowkey about it?' }, { text: 'touch grass', fit: 0, why: 'Telling them to go outside is random here.' } ] },
  { setup: 'You lost a game in the last second.', tone: 'disappointed but funny', pieces: [
    { text: 'Massive L', fit: 3, why: 'L = loss.' }, { text: "it's so over", fit: 3, why: 'Dramatic despair, meme-style.' }, { text: 'GG', fit: 2, why: 'Good sportsmanship.' },
    { text: 'skill issue', fit: 2, why: 'Roasting yourself — works.' }, { text: 'W', fit: 0, why: 'W means win.' }, { text: 'we got this before GTA 6', fit: 1, why: 'Meme-y, but the meaning is a stretch.' } ] },
  { setup: 'Your friend is stressing about something that really is no big deal.', tone: 'reassuring', pieces: [
    { text: "It's not that deep", fit: 3, why: 'It’s not that serious.' }, { text: 'bestie', fit: 2, why: 'Warm address.' }, { text: 'you got this fr', fit: 3, why: 'Fr = for real.' },
    { text: "you're cooked", fit: 0, why: 'The opposite of reassuring.' }, { text: 'touch grass', fit: 1, why: 'Could be helpful… or rude, depending on tone.' }, { text: 'chill', fit: 2, why: 'Relax — fine if said kindly.' } ] },
  { setup: 'Someone tells an obviously fake story.', tone: 'skeptical', pieces: [
    { text: "That's cap", fit: 3, why: 'Cap = a lie.' }, { text: '🧢', fit: 3, why: 'The cap emoji means “lie.”' }, { text: 'bffr', fit: 2, why: '“Be for real” — teen-ish, but on tone.' },
    { text: 'sus', fit: 2, why: 'Suspicious.' }, { text: 'no cap', fit: 0, why: 'That means “for real” — the opposite.' }, { text: 'periodt', fit: 0, why: 'Periodt agrees strongly.' } ] },
  { setup: 'Your favorite song comes on.', tone: 'excited', pieces: [
    { text: 'This song slaps', fit: 3, why: 'Slaps = really good (usually music).' }, { text: 'it hits different', fit: 3, why: 'Feels especially good.' }, { text: 'banger', fit: 3, why: 'An awesome song.' },
    { text: 'mid', fit: 0, why: 'Mediocre — not if it’s your favorite.' }, { text: 'turn it up', fit: 2, why: 'Plain but perfect.' }, { text: 'glazing', fit: 1, why: 'Over-praising — maybe if you’re joking about yourself.' } ] },
];

export interface ChallengeItem { prompt: string; examples: string[]; concepts: { label: string; words: string[] }[] }

/** Translator Challenges: English → slang. Concepts are rubric checks; any listed word counts. */
export const EN_CHALLENGES: ChallengeItem[] = [
  { prompt: 'That pizza was really delicious.', examples: ['That pizza was bussin.', 'The pizza slaps fr.', 'Pizza was fire, no cap.'], concepts: [{ label: 'Mentions the pizza', words: ['pizza', 'za'] }, { label: 'Says it tasted great', words: ['bussin', 'fire', 'slaps', 'elite', 'goated', 'hits different', 'banger'] }] },
  { prompt: "I'm not lying, he is really good at this game.", examples: ['No cap, bro is cracked at this game.', 'Fr he is goated at this.', 'On god he’s cracked.'], concepts: [{ label: 'Says it’s true', words: ['no cap', 'fr', 'for real', 'on god', 'ong', 'deadass', 'deadass'] }, { label: 'Says he is skilled', words: ['cracked', 'goated', 'goat', 'him', 'built different', 'fire', 'cooking', 'op'] }] },
  { prompt: 'You did an amazing job on your presentation.', examples: ['You ate that presentation.', 'You understood the assignment.', 'You cooked fr.'], concepts: [{ label: 'Praises their performance', words: ['ate', 'cooked', 'slay', 'slayed', 'understood the assignment', 'w', 'goated', 'fire', 'no crumbs'] }] },
  { prompt: "I'm in big trouble because I forgot my homework.", examples: ['I’m cooked, I forgot my homework.', 'Chat, am I cooked? Forgot the homework.'], concepts: [{ label: 'Says you’re in trouble', words: ['cooked', 'it’s so over', "it's so over", 'doomed', 'l'] }, { label: 'Mentions the homework', words: ['homework', 'hw', 'assignment'] }] },
  { prompt: 'That joke was so embarrassing.', examples: ['That joke was so cringe.', 'Big yikes, that joke.', 'That joke was -1000 aura.'], concepts: [{ label: 'Calls it embarrassing', words: ['cringe', 'yikes', 'aura', 'secondhand', 'ick', 'oof'] }] },
  { prompt: 'Stop talking so much and focus.', examples: ['Stop yapping and lock in.', 'Less yap, more lock in.'], concepts: [{ label: 'Says stop talking', words: ['yap', 'yapping', 'yapper'] }, { label: 'Says focus', words: ['lock in', 'locked in', 'focus'] }] },
  { prompt: 'Honestly, that movie was just average.', examples: ['Ngl that movie was mid.', 'Tbh the movie was mid.'], concepts: [{ label: 'Honesty marker', words: ['ngl', 'tbh', 'lowkey', 'honestly', 'fr', 'deadass'] }, { label: 'Says it was average', words: ['mid'] }] },
  { prompt: 'My friend took some of my fries.', examples: ['My bestie fanum taxed my fries.', 'Bro hit me with the fanum tax.'], concepts: [{ label: 'Food-taking slang', words: ['fanum', 'tax'] }] },
  { prompt: "I can't stop thinking about that song.", examples: ['That song lives rent-free in my head.', 'That song is my Roman Empire.'], concepts: [{ label: 'Stuck in your head', words: ['rent free', 'rent-free', 'roman empire', 'stuck'] }] },
  { prompt: 'Go outside and take a break from the internet.', examples: ['Go touch grass.', 'Log off and touch grass fr.'], concepts: [{ label: 'Touch grass', words: ['touch grass', 'grass'] }] },
];

/** Reverse challenges: slang → plain English. */
export const SLANG_CHALLENGES: ChallengeItem[] = [
  { prompt: 'Bro is cooked, zero aura, absolutely no rizz.', examples: ['He’s in trouble, has lost his cool factor, and has no charm.'], concepts: [{ label: 'In trouble', words: ['trouble', 'doomed', 'done for', 'finished', 'screwed'] }, { label: 'Not cool', words: ['cool', 'respect', 'embarrass', 'reputation'] }, { label: 'No charm', words: ['charm', 'charisma', 'flirt', 'smooth', 'game'] }] },
  { prompt: 'No cap, that fit is fire.', examples: ['Honestly, that outfit looks great.'], concepts: [{ label: 'Honestly / for real', words: ['honest', 'real', 'serious', 'not lying', 'truly', 'swear'] }, { label: 'Outfit', words: ['outfit', 'clothes', 'look', 'style'] }, { label: 'Looks great', words: ['great', 'amazing', 'awesome', 'good', 'cool', 'excellent'] }] },
  { prompt: 'Ngl the test was lowkey mid.', examples: ['Honestly, the test was kind of average.'], concepts: [{ label: 'Honestly', words: ['honest', 'not going to lie', 'not gonna lie', 'truth'] }, { label: 'Kind of', words: ['kind of', 'kinda', 'somewhat', 'a bit', 'slightly', 'sort of'] }, { label: 'Average', words: ['average', 'mediocre', 'okay', 'meh', 'so-so', 'not great'] }] },
  { prompt: 'She ate and left no crumbs.', examples: ['She did an amazing job, perfectly.'], concepts: [{ label: 'Did great', words: ['great', 'amazing', 'perfect', 'flawless', 'excellent', 'nailed', 'killed it', 'crushed'] }] },
  { prompt: 'Stop glazing him, it’s not that deep.', examples: ['Stop over-praising him; it’s not that serious.'], concepts: [{ label: 'Over-praising', words: ['praise', 'flatter', 'compliment', 'suck up', 'hype'] }, { label: 'Not serious', words: ['serious', 'big deal', 'important', 'deep'] }] },
  { prompt: 'Lock in, the final is the final boss.', examples: ['Focus — the final exam is the hardest challenge.'], concepts: [{ label: 'Focus', words: ['focus', 'concentrate', 'serious', 'study'] }, { label: 'Hardest challenge', words: ['hardest', 'toughest', 'difficult', 'biggest challenge', 'hard'] }] },
  { prompt: 'Bet, say less, I’m pulling up.', examples: ['Okay, got it — I’m coming over.'], concepts: [{ label: 'Agreeing', words: ['okay', 'ok', 'sure', 'sounds good', 'deal', 'alright', 'got it', 'yes'] }, { label: 'Coming over', words: ['coming', 'on my way', 'arriving', 'heading', 'come over', 'be there'] }] },
  { prompt: 'That’s so sus, you’re capping.', examples: ['That’s suspicious — you’re lying.'], concepts: [{ label: 'Suspicious', words: ['suspicious', 'sketchy', 'shady', 'fishy', 'weird'] }, { label: 'Lying', words: ['lying', 'lie', 'making it up', 'not true', 'fibbing'] }] },
];

/** Situations for the Slang Generator. */
export const SITUATIONS = [
  { id: 'performance', label: 'Reacting to an amazing performance', english: ['That was really impressive.', 'You did an excellent job.', 'That was legendary.'] },
  { id: 'bad-day', label: 'Describing a terrible day', english: ['I am so stressed.', 'Today was a failure.', 'I am in big trouble.'] },
  { id: 'win', label: 'Celebrating a win', english: ['Congratulations!', 'That was a win.', 'We are back.'] },
  { id: 'friend', label: 'Complimenting a friend', english: ['You look amazing, my friend.', 'Nice outfit.', 'You are the best.'] },
  { id: 'boring', label: 'Describing a boring class', english: ['This class is so boring.', 'I am so bored.', 'It feels like it is never ending.'] },
  { id: 'news', label: 'Reacting to unexpected news', english: ['Are you serious?', 'I am shocked.', 'Tell me the gossip.'] },
  { id: 'food', label: 'Talking about food', english: ['The pizza was delicious.', 'My friend took my fries.', 'The food was really good.'] },
  { id: 'gaming', label: 'A chaotic gaming session', english: ['Great play!', 'You are bad at this game.', 'I lost it.'] },
];

/** Meme Lab caption scenarios. {a}/{b} get filled with slang from the database. */
export const CAPTION_SCENES = [
  { id: 'monday', label: 'Monday morning', emoji: '☕', lines: ['Me walking into Monday with {neg}', 'Monday really said “{l}” and left', 'POV: it’s Monday and you’re already {cooked}'] },
  { id: 'test', label: 'Surprise test', emoji: '📝', lines: ['When the teacher says “surprise quiz” and you’re {cooked}', 'The final boss of {school}: a pop quiz', 'Me after studying for 5 minutes: I’m {goat} • The test: {neg}'] },
  { id: 'snack', label: 'Someone takes your snack', emoji: '🍟', lines: ['Fanum tax collector at 12:01 p.m.', 'They really took my fries. {crash}.', 'Every lunch table has one fanum tax agent'] },
  { id: 'win', label: 'Small victory', emoji: '🏆', lines: ['Found money in my old jacket. {w}', 'Got the last cookie. +1000 aura', 'The microwave stopped at :00. {cinema}'] },
  { id: 'group', label: 'Group project', emoji: '🧑‍🤝‍🧑', lines: ['Group project: one person {lockin}, three people yapping', 'Me doing the whole group project: {main}', 'Group chat: 87 messages. Work done: 0. {cooked}'] },
  { id: 'pet', label: 'Pet doing pet things', emoji: '🐈', lines: ['My cat knocking things off tables: {sigma}', 'Dog sees the leash: we’re so back', 'This cat has more aura than me {fr}'] },
  { id: 'gaming', label: 'Gaming fail', emoji: '🎮', lines: ['Lagged for 1 second and lost: skill issue (it was the Wi-Fi)', 'Me teaching my little cousin the game: {letcook}', 'Final boss: phase 3. Me: 1 HP. {cooked}'] },
  { id: 'weekend', label: 'Weekend plans', emoji: '🛋️', lines: ['Weekend plans: {npc} mode activated', 'Saturday me vs Monday me: {w} vs {l}', 'Me canceling plans to stay in: {main}'] },
];

/** Brain Rot Sentence Builder parts, from mild to absurd. Labelled as nonsense at high chaos. */
export const ROT = {
  subjects: [['My friend', 'The teacher', 'My cat', 'Someone'], ['Bro', 'Lil bro', 'Unc', 'My bestie'], ['The rizzler', 'Skibidi sigma', 'The Ohio final boss', 'A clanker with aura']],
  verbs: [['really did great', 'was so tired', 'got a little embarrassed', 'kept talking'], ['ate', 'got cooked', 'crashed out', 'was yapping', 'locked in'], ['mogged the entire cafeteria', 'got fanum taxed by the council', 'aura farmed in 4K', 'speedran a crash out']],
  tails: [['today.', 'at lunch.', 'during class.', 'again.'], ['no cap.', 'fr fr.', 'and it was giving main character.', 'ngl.'], ['with negative aura. Six seven.', 'and chat is this real 💀', 'before GTA 6. Absolute cinema.', 'while mewing. Skibidi.']],
};
