import { href } from '../lib/router';

// Where the name comes from: the Rosetta Stone carried one decree in three scripts,
// and a script people could still read (Greek) unlocked one nobody could (hieroglyphs).

const BANDS = [
  { script: 'Hieroglyphs', ours: 'Meme speak', text: '🔥🔥🔥 +1000 aura 🗿' },
  { script: 'Demotic', ours: 'Everyday slang', text: 'That was fire, no cap.' },
  { script: 'Ancient Greek', ours: 'Plain English', text: 'That was really impressive, honestly.' },
];

const PARALLELS = [
  { icon: '📜', title: 'One message, many scripts', body: 'The stone says the same thing three ways. The translator shows one sentence in plain English and in a dozen slang styles.' },
  { icon: '🔑', title: 'A known language is the key', body: 'Scholars used the Greek they could read to crack the hieroglyphs. SlangStone uses plain English to crack slang, and slang to explain English.' },
  { icon: '👑', title: 'Start with what you know', body: 'Champollion began with royal names like Ptolemy, which were circled in ovals called cartouches. The games train the same move: use the words and context you already know.' },
  { icon: '💀', title: 'Pictures that carry meaning', body: 'Hieroglyphs mix signs for sounds with signs for ideas. Emoji do something similar: 💀 can mean “that’s so funny,” not a skull.' },
  { icon: '⏳', title: 'Meanings fade', body: 'Once nobody wrote hieroglyphs, people forgot how to read them for about 1,400 years. Slang dates fast too, so the dictionary labels each word as current, fading or a throwback.' },
];

export function RosettaSection() {
  return (
    <section className="card rosetta" aria-labelledby="rosetta-title">
      <div className="small muted" style={{ fontWeight: 800 }}>🪨 WHY “SLANGSTONE”?</div>
      <h2 id="rosetta-title" style={{ margin: '6px 0 14px' }}>Named after the rock that unlocked a lost language</h2>

      <div className="rosetta-top">
        <div className="stack" style={{ gap: 10 }}>
          <h3 style={{ margin: 0 }}>What was the Rosetta Stone?</h3>
          <p style={{ margin: 0 }}>
            It’s a slab of dark stone about 1.1 m (3.7 ft) tall, carved in Egypt in 196 BCE. It records a decree that priests issued to honor the young king Ptolemy V.
          </p>
          <p style={{ margin: 0 }}>
            The twist: <strong>the same message is carved three times, in three scripts</strong>. Hieroglyphs were the sacred script of temples, Demotic was Egypt’s everyday handwriting, and Ancient Greek was the language of the government.
          </p>
          <p style={{ margin: 0 }}>
            French soldiers found it in 1799 near the town of Rashid, which Europeans called Rosetta. It has been at the British Museum in London since 1802. By then, nobody had been able to read hieroglyphs for about 1,400 years. Scholars could still read Greek, so they used it as a key. Thomas Young made early breakthroughs, and in 1822 Jean-François Champollion showed how hieroglyphs worked.
          </p>
          <p className="muted" style={{ margin: 0 }}>
            That’s why people still call anything that unlocks something hard to understand “a Rosetta Stone.”
          </p>
        </div>

        <figure className="stone" aria-label="One message, three ways">
          {BANDS.map((b) => (
            <div key={b.script} className="stone-band">
              <div className="stone-label">{b.ours} <span>· like {b.script}</span></div>
              <div className="stone-text">{b.text}</div>
            </div>
          ))}
          <figcaption>Same idea, three layers. Plain English plays the part of the Greek: the key that unlocks the rest.</figcaption>
        </figure>
      </div>

      <h3 style={{ margin: '22px 0 10px' }}>How SlangStone does the same thing</h3>
      <div className="grid auto">
        {PARALLELS.map((x) => (
          <div key={x.title} className="parallel">
            <div className="parallel-icon" aria-hidden="true">{x.icon}</div>
            <strong>{x.title}</strong>
            <p className="small" style={{ margin: '4px 0 0' }}>{x.body}</p>
          </div>
        ))}
      </div>

      <div className="btn-row" style={{ marginTop: 18 }}>
        <a className="btn primary sm" href={href('translate?dir=slang2en')}>Decode some slang</a>
        <a className="btn sm" href="https://www.britishmuseum.org/collection/object/Y_EA24" target="_blank" rel="noopener noreferrer">See the real stone ↗</a>
      </div>
    </section>
  );
}
