// English → slang phrase rules.
//
// Template syntax:  {surface}  or  {surface|term-id}  marks a slang term (linked to the dictionary),
// $0 is the whole English match, $1..$9 are capture groups. Plain text passes through unchanged.
// Styles are single letters (see STYLE_CODES); '*' means every style.
// Rules are matched longest-match-first per sentence, so overlapping phrases win over single words.

export type Style =
  | 'natural' | 'genz' | 'alpha' | 'brainrot' | 'wholesome' | 'gamer'
  | 'dramatic' | 'sarcastic' | 'school' | 'college' | 'retro' | 'custom';

export const STYLE_CODES: Record<Exclude<Style, 'custom'>, string> = {
  natural: 'N', genz: 'Z', alpha: 'A', brainrot: 'B', wholesome: 'W', gamer: 'G',
  dramatic: 'D', sarcastic: 'S', school: 'K', college: 'C', retro: 'R',
};

export const STYLES: { id: Style; label: string; emoji: string; blurb: string }[] = [
  { id: 'natural', label: 'Natural', emoji: '🙂', blurb: 'Actually sounds human' },
  { id: 'genz', label: 'Casual Gen Z', emoji: '😎', blurb: 'No cap, fr' },
  { id: 'alpha', label: 'Gen Alpha', emoji: '🧃', blurb: 'Aura, sigma, six seven' },
  { id: 'brainrot', label: 'Max Brain Rot', emoji: '🧠', blurb: 'Skibidi chaos mode' },
  { id: 'wholesome', label: 'Wholesome', emoji: '🫶', blurb: 'Bestie energy only' },
  { id: 'gamer', label: 'Gamer', emoji: '🎮', blurb: 'GG, clutch, cracked' },
  { id: 'dramatic', label: 'Dramatic', emoji: '🎭', blurb: 'I am literally screaming' },
  { id: 'sarcastic', label: 'Sarcastic', emoji: '🙄', blurb: 'Oh wow. So original.' },
  { id: 'school', label: 'School Appropriate', emoji: '✏️', blurb: 'Teacher-proof' },
  { id: 'college', label: 'College / Campus', emoji: '🎓', blurb: 'Running on iced coffee' },
  { id: 'retro', label: 'Retro Internet', emoji: '📼', blurb: 'Epic win, totes' },
  { id: 'custom', label: 'Custom mix', emoji: '🎛️', blurb: 'Intensity decides' },
];

export interface RuleOption { t: string; s: string; min: number; max: number }
export interface Rule { re: RegExp; opts: RuleOption[] }

const o = (t: string, s = '*', min = 1, max = 10): RuleOption => ({ t, s, min, max });
const KEEP = (max = 3) => o('$0', '*', 1, max);
const r = (src: string, ...opts: RuleOption[]): Rule => ({ re: new RegExp(src, 'gi'), opts });

const B = '\\b';

export const RULES: Rule[] = [
  // ---- praise & quality ---------------------------------------------------------------
  r(`${B}you did (?:a |an )?(?:really |very |so )?(?:great|excellent|amazing|fantastic|incredible|awesome|good|wonderful) job${B}`,
    o('you {ate}', 'NZWKC'), o('you {ate and left no crumbs|ate}', 'ZWD', 4), o('you {cooked}', 'ZAGC'),
    o('you {understood the assignment}', 'NWKC', 2), o('you {slayed|slay}', 'ZWD'), o('bro {cooked} with {infinite aura|aura}', 'AB', 6),
    o('you went {goated} mode', 'G', 3), o('you totally rocked it', 'R'), o('you crushed it', 'NKW', 1, 3)),
  r(`${B}(?:(?:great|good|nice|amazing|excellent) (?:job|work)|well done|nailed it|crushed it|killed it)${B}`,
    o('{ate}', 'NZWD'), o('{W}', 'ZAGKC'), o('{cooked}', 'ZAB', 3), o('{slay}', 'WD'), o('{GG}', 'G'),
    o('{props}', 'R'), o('{absolute cinema}', 'BA', 7), o('massive {W}', 'AB', 4)),
  r(`${B}(?:congratulations|congrats)${B}`, o('huge {W}', 'NZAKCW'), o('{W}', '*'), o('{GG}', 'G'), o('{props}', 'R'), o('{massive W|W}', 'BD', 5)),
  r(`${B}(?:really|very|so|extremely|super|incredibly|truly) (?:impressive|amazing|awesome|incredible|excellent|fantastic|great|wonderful|outstanding)${B}`,
    o('so good', 'NK', 1, 3), o('{high-key} {fire}', 'ZKC'), o('so {fire}', 'NZWKC'), o('{goated}', 'ZAGC', 3), o('{cracked}', 'G'),
    o('{fire} {fr fr|fr}', 'ZA', 4), o('{absolute cinema}', 'BA', 6), o('{goated} with the sauce', 'B', 7), o('{totally rad|rad}', 'R'), o('{da bomb}', 'R', 4)),
  r(`${B}(?:impressive|amazing|awesome|incredible|excellent|fantastic|outstanding|phenomenal)${B}`,
    KEEP(2), o('{fire}', 'NZWKC'), o('{goated}', 'ZAGC', 3), o('{cracked}', 'G'), o('{tuff}', 'A', 3), o('{lit}', 'R'), o('{dope}', 'R'),
    o('{absolute cinema}', 'B', 6), o('{bussin}', 'B', 7)),
  r(`${B}(?:the best|the greatest)(?: of all time| ever)?${B}`, o('the {GOAT}', '*'), o('{goated}', 'ZAG', 3), o('the {GOAT} fr', 'AB', 6)),
  r(`${B}(?:mediocre|average|so-so|nothing special|underwhelming|just okay|not that great|meh)${B}`,
    o('{mid}', '*'), o('kinda {mid}', 'NWK'), o('{mid} {fr}', 'ZA', 4), o('so {mid} it hurts', 'DS', 3), o('{mid} with {negative aura}', 'B', 6)),
  r(`${B}(?:overrated)${B}`, o('{mid}', '*'), o('lowkey {mid}', 'NZ')),
  r(`${B}(?:underrated|overlooked)${B}`, o('{slept on}', '*')),
  r(`${B}(?:delicious|tasty|scrumptious)${B}`, o('{bussin}', 'ZABC'), o('{fire}', 'NZWKC'), o('{bussin bussin|bussin}', 'B', 6), o('{slaps}', 'ZC')),
  r(`${B}(the|this|that|my|your) (food|pizza|burger|meal|taco|tacos|fries|dinner|lunch|breakfast|snack|pasta|cake|sandwich|soup|ramen|chicken|cookie|cookies) (is|was|are|were) (?:really |so |very |super )?(?:good|great|amazing|delicious|tasty|incredible)${B}`,
    o('$1 $2 $3 {bussin}', 'ZACK'), o('$1 $2 $3 {fire}', 'NZWKC'), o('$1 $2 $3 {bussin bussin|bussin}', 'B', 6), o('$1 $2 {slaps|slaps}', 'NZC'), o('$1 $2 $3 {goated}', 'G')),
  r(`${B}(this|that|the) (song|track|beat|album|music) (?:is|was) (?:really |so |very )?(?:good|great|amazing|catchy|incredible)${B}`,
    o('$1 $2 {slaps}', '*'), o('$1 $2 {hits different}', 'NZDC'), o('$1 $2 is a {bop}', 'ZWR'), o('$1 $2 is {fire}', 'ZK')),
  r(`${B}(?:is|was) (?:a )?(?:really |so |very )?(?:catchy|great|good) song${B}`, o('is a {bop}', '*')),
  r(`${B}(?:(?:nice|great|cool|amazing|good) (?:outfit|clothes|style|look)|dressed (?:so )?(?:well|nicely))${B}`,
    o('{fire} {fit}', 'NZKC'), o('the {drip} is crazy', 'ZAB', 3), o('{snatched}', 'WD'), o('{drip} check passed', 'AB', 5), o('{fresh}', 'R')),
  r(`${B}(you|she|he|they) (?:look|looks|looked) (?:really |so |absolutely )?(?:great|amazing|stunning|beautiful|gorgeous|fantastic)${B}`,
    o('$1 look {snatched}', 'WDZ'), o('$1 {ate}', 'NZWD'), o('$1 {understood the assignment}', 'NWK'), o('$1 {mogged} everyone', 'AB', 5), o('$1 look {fire}', 'ZKC')),
  r(`${B}(?:(?:is|are|was|were) (?:so |really |very )?(?:talented|skilled|good at (?:this|it|games|gaming)))${B}`,
    o('is {cracked}', 'GZ'), o('is {goated}', 'NZAKC'), o('is {him|hes-him}', 'A', 4), o('is {built different}', 'ZAB', 3)),

  // ---- negative & trouble -------------------------------------------------------------
  r(`${B}(?:in (?:big |so much |serious |deep )?trouble|doomed|done for|finished|screwed|toast|a lost cause|hopeless)${B}`,
    o('{cooked}', '*'), o('so {cooked}', 'ZAKC'), o('absolutely {cooked}', 'ZABD', 4), o('{cooked} {fr fr|fr}', 'AB', 5), o('{cooked} like a turkey', 'BS', 6), o('{pwned}', 'GR')),
  r(`${B}(?:I'm|I am) (?:so )?(?:stressed|overwhelmed|panicking)${B}`,
    o("I'm {cooked}", 'NZACK'), o("I'm about to {crash out}", 'ZADB', 3), o("I'm {lowkey} losing it", 'NZWC'), o("chat, am I {cooked}", 'AB', 5), o("I'm on the {struggle bus}", 'RC')),
  r(`${B}(?:I'm|I am) (?:so |really )?(?:tired|exhausted|drained|sleepy)${B}`,
    o("I'm {cooked}", 'ZAC'), o("I'm {dead}", 'ZD'), o("I'm {lowkey} exhausted", 'NWK'), o("I'm running on {negative aura}", 'B', 6), o("I'm {AFK} from life", 'G')),
  r(`${B}(?:I|we|you|he|she|they) (?:failed|lost|flopped|bombed)${B}`, o('$0', 'NK', 1, 2), o('took the {L}', 'ZAKC'), o('took a massive {L}', 'ZAB', 4), o('had an {epic fail}', 'R')),
  r(`${B}(?:a|an) (?:loss|failure|disaster|fail|flop)${B}`, o('an {L}', '*'), o('a massive {L}', 'ZAB', 3), o('an {epic fail}', 'R'), o('a {canon event}', 'D', 4)),
  r(`${B}(?:a|an) (?:win|victory|success|triumph)${B}`, o('a {W}', '*'), o('a massive {W}', 'ZAB', 3), o('a {dub}', 'Z'), o('an {epic win|ftw}', 'R')),
  r(`${B}(?:terrible|awful|horrible|the worst|atrocious)${B}`, KEEP(3), o('{mid}', 'S'), o('so {cringe}', 'ZK'), o('giving {negative aura}', 'AB', 4), o('{trash}', 'ZG')),
  r(`${B}(?:embarrassing|awkward|cringeworthy|cringey|cringy)${B}`, o('{cringe}', '*'), o('{big yikes}', 'ZDS', 3), o('{-1000 aura|negative aura}', 'AB', 5)),
  r(`${B}(?:that's|that is|how) (?:so )?(?:embarrassing|awkward)${B}`, o('{big yikes}', 'NZDS'), o("that's {cringe}", 'ZK'), o('{-1000 aura|negative aura}', 'AB', 4)),
  r(`${B}(?:got|was|were|get|gets) caught${B}`, o('got {caught in 4K}', '*')),
  r(`${B}(?:suspicious|sketchy|shady|fishy|questionable)${B}`, o('{sus}', '*'), o('kinda {sus}', 'NW'), o('{sus} {fr}', 'AB', 4), o('{mega sus|sus}', 'B', 7)),
  r(`${B}(?:inappropriate|uncalled for|out of line|too far)${B}`, o('{out of pocket}', '*'), o('way {out of pocket}', 'DZ', 3)),
  r(`${B}(?:angry|annoyed|bitter|irritated|upset about it)${B}`, o('{salty}', '*'), o('{pressed}', 'ZDS'), o('{tilted}', 'G'), o('{big mad}', 'Z', 4)),
  r(`${B}(?:shocked|stunned|speechless|astonished)${B}`, o('{shook}', '*'), o('{shook} {fr}', 'ZA', 4)),
  r(`${B}(?:being )?(?:overdramatic|over the top|dramatic)${B}`, o('{extra}', '*'), o('so {extra}', 'ZD')),
  r(`${B}(?:mean|harsh|brutal|ruthless)${B}`, KEEP(2), o('{savage}', '*')),
  r(`${B}(?:weird|strange|bizarre)${B}`, KEEP(4), o('lowkey $0', 'NZ', 3), o('so {Ohio}', 'AB', 4), o('{goofy}', 'ZA', 5)),
  r(`${B}(?:silly|goofy|foolish|ridiculous)${B}`, o('{goofy}', 'ZAW'), KEEP(3), o('{goofy ahh}', 'B', 7)),
  r(`${B}(?:delusional|unrealistic|in denial)${B}`, o('{delulu}', '*')),
  r(`${B}(?:mindless (?:content|videos)|junk content|nonsense content)${B}`, o('{brain rot}', '*')),

  // ---- truth, agreement, reactions -----------------------------------------------------
  r(`${B}(?:that's|that is|it's|it is) (?:a lie|not true|false|fake|made up)${B}`, o("that's {cap}", '*'), o('{cap} 🧢', 'ZAB', 4), o("that's so {cap}", 'D')),
  r(`${B}(?:you're|you are) (?:lying|making (?:that|it) up|kidding)${B}`, o("you're {capping|cap}", '*'), o('stop {capping|cap}', 'ZAS'), o('{cap}', 'B', 5)),
  r(`${B}(?:I'm|I am) (?:not lying|being serious|serious)${B}`, o('{no cap}', '*'), o("I'm {deadass}", 'Z'), o('{on god}', 'Z', 3), o('{no cap} {fr fr|fr}', 'AB', 5)),
  r(`${B}(?:I swear(?: to god)?|I promise|no lie|for real|truthfully)${B}`, o('{no cap}', '*'), o('{fr}', 'NZKC'), o('{on god}', 'Z', 3), o('{deadass}', 'Z'), o('{ISTG}', 'ZC')),
  r(`${B}(?:honestly|to be honest|not going to lie|not gonna lie|I won't lie)${B}`, o('{ngl}', '*'), o('{tbh}', 'NZKC'), o('{lowkey}', 'ZC'), o('{deadass}', 'Z', 4)),
  r(`${B}(?:are you serious|are you kidding(?: me)?|be serious|come on)${B}`, o('{bffr}', 'ZDS'), o('{bruh}', '*'), o("you're {tweaking}", 'ZA', 3), o('{bruh} what', 'B', 5)),
  r(`${B}(?:you're|you are) (?:being )?(?:crazy|ridiculous|overreacting|unreasonable)${B}`, o("you're {tweaking}", 'ZA'), o("you're {crashing out|crash out}", 'ZB', 4), o('{bffr}', 'ZS'), o("you're being {extra}", 'NWK')),
  r(`${B}(?:you're|you are) (?:right|correct|so right)${B}`, o('{facts}', '*'), o('{real}', 'ZA'), o('{say it louder}', 'ZD', 3), o("you're {valid}", 'NW'), o('{periodt}', 'ZD', 4)),
  r(`${B}(?:I agree|so true|that's (?:so )?true|exactly|same here)${B}`, o('{facts}', '*'), o('{real}', 'ZA'), o('{valid}', 'NZWKC'), o('{say less}', 'Z'), o('{periodt}', 'ZD', 3), o('{based}', 'ZA', 3)),
  r(`${B}(?:that's|that is) (?:fair|reasonable|understandable|legit)${B}`, o("that's {valid}", '*'), o("that's fair", 'N')),
  r(`${B}(?:I relate|relatable|same energy)${B}`, o('{mood}', '*'), o('{big mood|mood}', 'ZD'), o('{real}', 'A')),
  r(`^(?:okay|ok|sure|sounds good|deal|alright|all right)${B}`, o('{bet}', '*'), o('{say less}', 'ZAC'), o('{aight}', 'Z'), o('{bet} {bet|bet}', 'B', 6), o('{word}', 'R')),
  r(`^(?:no way|absolutely not|not a chance|nope)${B}`, o('{no shot}', 'ZA'), o('nah', 'NZ'), o('{bffr}', 'ZS'), o('{as if}', 'R')),
  r(`^(?:wow|whoa|oh wow)${B}`, o('{sheesh}', 'ZAWG'), o('{yo}', 'NZ'), o('{OMG}', 'WD'), o('{sheesh} 🥶', 'AB', 5)),
  r(`^(?:oh my god|oh my gosh|omg)${B}`, o('{OMG}', '*'), o('{bruh}', 'ZS'), o('chat', 'A', 4)),
  r(`^(?:hi|hello|hey|hey there|what's up)${B}`, o('{yo}', 'NZGC'), o('{wsg}', 'Z', 3), o('{wagwan}', 'AB', 5), o('hey {bestie}', 'W'), o('{sup}', 'R')),
  r(`^(?:bye|goodbye|see you later|see ya)${B}`, o('{peace out}', 'R'), o('{TTYL}', 'NZKC'), o('{gtg}', 'ZG'), o('bye {bestie}', 'W')),
  r(`${B}(?:that's|that is|this is|it's|it is) (?:so |really )?(?:funny|hilarious)${B}`, o("{I'm weak}", 'NZ'), o("I'm {dead} 💀", 'ZAB'), o('{IJBOL}', 'Z', 3), o("I'm {dead}", 'D'), o('{LOL}', 'R'), o('{💀}', 'B', 5)),
  r(`${B}(?:it seems like|it feels like|it looks like|this feels like|this looks like|that seems like)${B}`, o("{it's giving}", 'NZWDC'), KEEP(3)),
  r(`${B}(?:it's|it is|that's|that is) not (?:a big deal|that serious|that important|a problem)${B}`, o("{it's not that deep}", '*')),
  r(`${B}(?:calm down|relax|chill out)${B}`, o('{chill}', '*'), o("{it's not that deep}", 'ZD'), o('take a {chill pill}', 'R')),
  r(`${B}(?:it's|it is|this is|we're|we are) (?:hopeless|doomed|over)${B}`, o("{it's so over|its-so-over-were-so-back}", '*')),
  r(`${B}(?:we're|we are) back|things are looking up${B}`, o("{we're so back|its-so-over-were-so-back}", '*')),
  r(`${B}(?:I don't care|I couldn't care less|whatever)${B}`, o('{IDC}', 'ZKC'), o('{whatever}', 'R'), o("{it's not that deep}", 'NZ')),
  r(`${B}(?:I don't know|no idea|I have no clue)${B}`, o('{IDK}', '*'), o('{idek}', 'Z', 3)),

  // ---- abbreviations -------------------------------------------------------------------
  r(`${B}by the way${B}`, o('{BTW}', '*')),
  r(`${B}right now${B}`, o('{RN}', 'ZAKC'), KEEP(10)),
  r(`${B}in my (?:humble )?opinion${B}`, o('{IMO}', '*')),
  r(`${B}in real life${B}`, o('{IRL}', '*')),
  r(`${B}let me know${B}`, o('{LMK}', '*')),
  r(`${B}where are you${B}`, o('{WYA}', '*')),
  r(`${B}what are you doing${B}`, o('{WYD}', '*')),
  r(`${B}(?:what's the plan|what's the move|what are we doing tonight)${B}`, o('{WTW}', 'Z'), o("what's the move", 'NZC')),
  r(`${B}(?:text|message|call) me${B}`, o('{HMU}', '*'), o('{hit me up|hmu}', 'NZ')),
  r(`${B}be right back${B}`, o('{BRB}', '*')),
  r(`${B}too much information${B}`, o('{TMI}', '*')),
  r(`${B}I know,? right${B}`, o('{IKR}', '*')),
  r(`${B}(?:shaking my head|that's disappointing|so disappointing)${B}`, o('{SMH}', '*')),
  r(`${B}(?:fear of missing out|afraid of missing out)${B}`, o('{FOMO}', '*')),
  r(`${B}if you know,? you know${B}`, o('{IYKYK}', '*')),
  r(`${B}thank you so much${B}`, o('{TYSM}', '*'), KEEP(2)),
  r(`${B}of course${B}`, o('{ofc}', 'ZC'), KEEP(10)),
  r(`${B}good game${B}`, o('{GG}', '*')),
  r(`${B}I love you${B}`, o('{ILY}', 'ZC'), o('love you {pookie}', 'WA'), KEEP(3)),

  // ---- people --------------------------------------------------------------------------
  r(`${B}my (?:best )?friends${B}`, o('my {besties|bestie}', 'NZWD'), o('the {squad}', 'ZRC'), o('the boys', 'G'), o('my {bros|bro}', 'AB', 3)),
  r(`${B}my (?:best )?friend${B}`, o('my {bestie}', 'NZWD'), o('my {bro}', 'ZAG'), o('my {twin}', 'A', 4), o('my {BFF}', 'R')),
  r(`(?:^|(?<=, ))(?:friend|buddy|pal|dude|man|mate)(?=[,.!?]|$)`, o('{bro}', 'ZAGB'), o('{bestie}', 'WD'), o('{fam}', 'ZC'), o('{blud}', 'AB', 5), o('{dude}', 'R')),
  r(`(?:^|(?<=, ))(?:sweetheart|darling|honey|sweetie|dear)(?=[,.!?]|$)`, o('{pookie}', 'WAZ'), o('{bestie}', 'ND')),
  r(`^(?:he|that guy|this guy|the guy) (is|was|thinks|really|just|has|did|got)${B}`, KEEP(4), o('{bro} $1', 'ZAB', 5), o('{blud} $1', 'AB', 7), o('{lil bro} $1', 'B', 8)),
  r(`${B}(?:an old person|an old man|an older guy|old-fashioned)${B}`, o('{unc}', 'ZAB'), o('giving {unc} energy', 'ZAB', 4), KEEP(3)),
  r(`${B}(?:a beginner|a newbie|a novice|a rookie)${B}`, o('a {noob}', '*')),
  r(`${B}(?:a background character|a follower|a nobody)${B}`, o('an {NPC}', '*')),
  r(`${B}(?:boyfriend|girlfriend)${B}`, KEEP(4), o('{boo}', 'ZW'), o('{bae}', 'R')),

  // ---- verbs & actions -----------------------------------------------------------------
  r(`${B}(focus|concentrate|get serious|buckle down|get to work)${B}`, o('{lock in}', '*'), o('fully {lock in}', 'ZAB', 4)),
  r(`${B}(?:focused|concentrating)${B}`, o('{locked in}', '*')),
  r(`${B}showing off${B}`, o('{flexing}', '*'), o('{aura farming}', 'AB', 4)),
  r(`${B}(?:show off|brag)${B}`, o('{flex}', '*'), o('{aura farm|aura farming}', 'AB', 5)),
  r(`${B}(?:showed off|bragged)${B}`, o('{flexed|flex}', '*')),
  r(`${B}(?:losing it|freaking out|losing my mind|having a meltdown)${B}`, o('{crashing out}', '*'), o('{tweaking}', 'Z')),
  r(`${B}(?:lose it|freak out|lose my mind|have a meltdown)${B}`, o('{crash out}', '*')),
  r(`${B}(?:lost it|freaked out|lost (?:his|her|their|my) mind|had a meltdown)${B}`, o('{crashed out}', '*')),
  r(`${B}(?:talking too much|rambling|talking nonstop|going on and on)${B}`, o('{yapping}', '*'), o('on a {yap session}', 'AB', 4)),
  r(`${B}(?:talks too much|rambles)${B}`, o('{yaps|yap}', '*'), o('is a {yapper}', 'ZA')),
  r(`${B}(?:stop talking|be quiet)${B}`, o('stop {yapping}', '*'), o('{yap} less', 'AB', 4)),
  r(`${B}(?:sucking up to|flattering|overpraising|hyping up)${B}`, o('{glazing}', '*')),
  r(`${B}(?:suck up to|flatter|overpraise)${B}`, o('{glaze}', '*')),
  r(`${B}(?:tell me|give me) (?:all )?(?:the )?(?:gossip|details|news|drama)${B}`, o('{spill the tea}', '*'), o('spill', 'Z', 3)),
  r(`${B}(?:the )?(?:gossip|drama)${B}`, o('the {tea}', '*')),
  r(`${B}(?:go outside|get some fresh air|log off|get off your phone|get a life)${B}`, o('go {touch grass}', '*')),
  r(`${B}(let) (him|her|them|me) (?:work|keep going|continue|finish|do (?:his|her|their|my) thing)${B}`, o('{$1 $2 cook|let-him-cook}', '*')),
  r(`${B}(?:is|are|was|were) doing (?:so |really )?(?:well|great|amazing)${B}`, o('is {cooking}', '*'), o('is {in their bag|bag}', 'Z', 4)),
  r(`${B}(?:came through|saved the day|saved us)${B}`, o('came in {clutch}', '*'), o('{clutched up|clutch}', 'G')),
  r(`${B}(?:stopped (?:replying|responding|texting)(?: to)?|stopped talking to|ignored)( me| us)?${B}`, o('{ghosted}$1', '*')),
  r(`${B}(?:overshared|overshare|oversharing)${B}`, o('{trauma dumping}', 'ZD'), o('$0', 'NWK')),
  r(`${B}(?:scrolling|scrolled) (?:for hours|forever|all night|endlessly)${B}`, o('{doomscrolling} for hours', '*')),
  r(`${B}(?:stayed up all night (?:studying|working)?)${B}`, o('pulled an {all-nighter}', '*')),
  r(`${B}(?:took|stole|ate) (?:some of |a bite of |part of )?(my|your|his|her|their|our) (food|fries|snack|snacks|lunch|pizza|chips|dessert)${B}`,
    o('{fanum taxed|fanum tax} $1 $2', 'ZAB'), o('took $1 $2', 'NWK', 1, 4), o('hit $1 $2 with the {fanum tax}', 'AB', 5)),
  r(`(I )?(?:can't stop|keep) thinking about (.+?)(?=[.!?]|$)`, o('$2 lives {rent-free} in my head', '*')),
  r(`(?:I )?think about (.+?) (?:all the time|constantly|every day|way too much)`, o('$1 is my {Roman Empire}', 'ZDC'), o('$1 lives {rent-free} in my head', '*')),
  r(`${B}(?:it|that|this) was (?:meant to happen|inevitable|destiny|bound to happen)${B}`, o('it was a {canon event}', '*')),
  r(`${B}(my|his|her|their|your) (?:backstory|life story|history)${B}`, o('$1 {lore}', '*')),
  r(`${B}(?:improved (?:so much|a lot)|got so much better|changed for the better)${B}`, o('had a {glow up}', '*')),

  // ---- feelings ------------------------------------------------------------------------
  r(`${B}(?:I'm|I am) (?:so |really |super )?(?:excited|hyped|pumped)${B}`, o("I'm {highkey} hyped", 'NZKC'), o("I'm {geeked}", 'Z', 4), o("we're {so back|we're so back}", 'AB', 4), o("I'm so excited ✨", 'W')),
  r(`${B}(?:I'm|I am) (?:so |really )?(?:sad|devastated|heartbroken)${B}`, o("I'm {lowkey} sad", 'NZW'), o("{it's so over|its-so-over-were-so-back}", 'ZAB', 3), o('{emotional damage}', 'DG', 3), o("I'm in my feels", 'ZC')),
  r(`${B}(?:I'm|I am) (?:so |really )?bored${B}`, o("I'm bored out of my mind", 'N', 1, 3), o('this is so {mid}', 'ZK'), o("I'm in {NPC} mode", 'AB', 4)),
  r(`${B}(?:is|was) (?:so |really |very )?(?:boring|dull|tedious)${B}`, o('is so {mid}', 'ZKC'), o('is {lowkey} boring', 'N'), o('is giving {NPC}', 'AB', 4), o('is {mid} {fr fr|fr}', 'B', 6)),
  r(`${B}(?:confident|unbothered|nonchalant|calm and collected|cool and collected)${B}`, KEEP(3), o('{nonchalant}', 'ZA'), o('{sigma}', 'AB', 4), o('unbothered', 'WD')),
  r(`${B}(?:has|have|got) (?:a lot of |so much )?(?:charm|charisma|game)${B}`, o('has {rizz}', '*'), o('has {W rizz|rizz}', 'ZA', 3), o('has {unspoken rizz|rizz}', 'Z', 4), o('has infinite {rizz}', 'B', 6)),
  r(`${B}(?:no|zero) (?:charm|charisma|game)${B}`, o('{no rizz|rizz}', '*'), o('{negative rizz}', 'AB', 5)),
  r(`${B}(?:charming|smooth|charismatic)${B}`, o('{rizzy|rizz}', 'Z'), o('the {rizzler}', 'AB', 4), KEEP(3)),
  r(`${B}(?:lost (?:all )?(?:his|her|their|my|your) (?:cool|dignity|respect))${B}`, o('lost all {aura}', '*'), o('took {-1000 aura|negative aura}', 'AB', 5)),
  r(`${B}(?:(?:his|her|their|my|your) )?(?:reputation|cool factor|street cred|credibility)${B}`, o('{aura}', '*')),
  r(`${B}(?:the )?(?:center of attention|star of the show)${B}`, o('the main character', '*'), o('giving {main character energy}', 'ZDW', 3)),
  r(`${B}(?:warning sign|bad sign)${B}`, o('{red flag}', '*')),
  r(`${B}(?:good sign)${B}`, o('{green flag}', '*')),
  r(`${B}(?:trying to make people angry|rage-inducing|provoking people)${B}`, o('{rage bait}', '*')),

  // ---- gaming & school -----------------------------------------------------------------
  r(`${B}(?:you're|you are|he's|she's|they're) (?:just )?(?:bad|terrible|awful) at (?:this|it|the game)${B}`, o('{skill issue}', '*'), o('massive {skill issue}', 'GAB', 4)),
  r(`${B}(?:great|amazing|insane|incredible) (play|move|save|shot)${B}`, o('{clutch} $1', '*'), o('{cracked} $1', 'G', 3)),
  r(`${B}(?:overpowered|unfair advantage)${B}`, o('{OP}', '*')),
  r(`${B}(?:weakened|made (?:it )?weaker)${B}`, o('{nerfed}', '*')),
  r(`${B}(?:strengthened|made (?:it )?stronger|upgraded)${B}`, o('{buffed}', '*')),
  r(`${B}(?:quit (?:in anger|angrily|out of anger))${B}`, o('{rage quit}', '*')),
  r(`${B}(?:the )?(?:hardest part|ultimate challenge|toughest challenge)${B}`, o('the {final boss}', '*')),
  r(`${B}(?:an errand|a chore|a detour|a random task)${B}`, o('a {side quest}', '*')),
  r(`${B}(the )?(test|exam|final|quiz|homework) (?:is|was) (?:really |so |very |extremely )?(?:hard|difficult|tough|brutal|impossible)${B}`,
    o('$1$2 was the {final boss}', 'ZAGKC'), o('$1$2 had me {cooked}', 'ZAC'), o('$1$2 was {lowkey} brutal', 'NWK'), o('$1$2 was {absolute cinema} (derogatory)', 'B', 8)),
  r(`${B}(?:legendary|historic|epic|cinematic)${B}`, KEEP(3), o('{absolute cinema}', 'AB', 4), o('epic', 'R'), o('{goated}', 'ZG')),

  // ---- intensifiers (lowest priority: single words) ------------------------------------
  r(`${B}(?:kind of|kinda|sort of|somewhat|a little|a bit|slightly|secretly)${B}`, KEEP(2), o('{lowkey}', '*')),
  r(`${B}(?:really|extremely|totally|definitely|absolutely)${B}`, KEEP(4), o('{highkey}', 'ZKC', 3), o('{hella}', 'Z', 5), o('{deadass}', 'Z', 6), o('{totes}', 'R'), o('{skibidi}', 'B', 9)),
  r(`${B}(?:cool)${B}`, KEEP(2), o('{fire}', 'ZK'), o('{valid}', 'NW'), o('{tuff}', 'A'), o('{dope}', 'R'), o('{based}', 'B', 5)),
  r(`${B}(?:very good|really good|so good)${B}`, KEEP(2), o('{fire}', '*'), o('{elite}', 'Z'), o('{goated}', 'AG', 4)),
];

// ---- sentence flourishes ---------------------------------------------------------------
// tags go at the end of a sentence (", no cap."), openers at the start ("Ngl, ...").
export const TAGS: Record<string, string[]> = {
  N: ['{fr}', 'honestly'],
  Z: ['{no cap}', '{fr}', '{fr fr}', '{periodt}', '{on god}', '💀', '😭', '{ngl}'],
  A: ['{fr fr}', '{no cap}', '{six seven}', '{W}', 'chat', '{bro}', '💀'],
  B: ['{no cap}', '{fr fr}', '+1000 {aura}', '{skibidi}', '{six seven}', 'only in {Ohio}', '{absolute cinema}', '{chat is this real}', '{what the sigma}', '💀💀', '{fanum tax} included', '{goofy ahh}'],
  W: ['{bestie}', '✨', '{slay}', 'love that for you', '🫶'],
  G: ['{GG}', '{EZ}', '{no cap}', '{clip it}', '{diff}', '{pog}'],
  D: ["I'm literally screaming", '😭😭', 'this is a {canon event}', '{I can\'t even}', '{periodt}'],
  S: ['wow, groundbreaking', '{big yikes}', 'sure, {bestie}', '🙄', 'totally'],
  K: ['{fr}', '{no cap}', '✏️'],
  C: ['{no cap}', '{fr}', '{ngl}', "and I'm {cooked}", '☕'],
  R: ['{LOL}', '{FTW}', '{totes}', '{YOLO}', '{as if}', '{booyah}', '{word}'],
};

export const OPENERS: Record<string, string[]> = {
  N: [],
  Z: ['{Ngl},', '{Lowkey},', '{Deadass},', '{Bro},', 'Okay but'],
  A: ['{Bro},', 'Chat,', 'Erm {what the sigma},', '{Sheesh},'],
  B: ['Chat,', '{Bro},', '{Skibidi} {bro},', 'Erm {what the sigma},', '{Chat is this real},'],
  W: ['{Bestie},', 'Okay {bestie},', '{Pookie},'],
  G: ['Yo,', 'Chat,', '{GG},'],
  D: ["Okay I'm literally screaming,", 'Not me crying, but', 'The drama,'],
  S: ['Oh wow,', 'Okay sure,', '{Big yikes},'],
  K: ['{Ngl},', 'Honestly,'],
  C: ['{Ngl},', '{Lowkey},', 'Okay so'],
  R: ['Dude,', 'Yo,', 'Like,', '{Totes},'],
};

// ---- slang → English context rules (applied before dictionary lookup) ------------------
export const SLANG_TO_EN: { re: RegExp; to: string; note: string }[] = [
  { re: /\b(?:bro|blud|lil bro|bruh)\s+(?=(?:is|was|thinks|really|just|got|has|did|said|pulled|went|can't|won't|will|needs|be|ate|cooked)\b)/gi, to: 'he ', note: '"Bro" at the start of a sentence usually means "he" / "this person".' },
  { re: /\b(?:zero|no|negative|minus|-\s?\d+)\s+aura\b/gi, to: 'no cool factor', note: 'Negative or zero aura = losing cool points.' },
  { re: /\b(?:no|zero|negative)\s+rizz\b/gi, to: 'no charm', note: '"No rizz" = no charm or flirting skills.' },
  { re: /\+\s?\d+\s+aura\b/gi, to: 'major cool points', note: '"+1000 aura" = something earned a lot of respect.' },
  { re: /\bchat,?\s+(?=am i|is this|are we|did)/gi, to: 'everyone, ', note: '"Chat" addresses an imaginary stream audience.' },
];

/** Common English words that are also slang: only translated when context supports it. */
export const AMBIGUOUS = new Set([
  'fire', 'bet', 'cap', 'mid', 'lit', 'tea', 'mood', 'extra', 'salty', 'basic', 'read', 'ship', 'serve', 'mother', 'chat',
  'cooked', 'ate', 'dead', 'weak', 'valid', 'based', 'flex', 'sus', 'bop', 'w', 'l', 'carry', 'buff', 'meta', 'sweat',
  'clutch', 'word', 'dope', 'chill', 'toxic', 'lore', 'bag', 'mad', 'wicked', 'bare', 'cheese', 'grind', 'loot', 'ping',
  'lag', 'rad', 'fetch', 'props', 'savage', 'shook', 'slaps', 'goat', 'bro', 'fam', 'squad', 'boo', 'crush', 'ghost',
  'diff', 'op', 'unlocked', 'camping', 'bot', 'tilted', 'dub', 'drip', 'fit', 'era', 'core', 'aesthetic', 'stan',
  'simp', 'yap', 'cook', 'him', 'real', 'facts', 'period', 'say less', 'it', 'unc', 'ohio', 'sigma', 'beta', 'alpha',
  '67', 'six seven', 'rent', 'deadass', 'nerf', 'noob', 'ick', 'pressed', 'hits different', 'gas', 'smurf', 'emote',
  'aura', 'brat', 'demure', 'the ick', 'rat', 'peak', 'slay', 'glaze', 'tweaking', 'geeked', 'touch grass', 'sheesh',
  'tuff', 'chopped', 'mog', 'crash out', 'lock in', 'locked in', 'ratio', 'npc', 'pog', 'hard', 'gyat', 'bussin',
]);
