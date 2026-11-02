import { termsFor, TERMS } from '../data';
import { ModeSelect, SoundToggle, ThemeToggle } from '../components/settings';
import { PageHead } from '../components/ui';
import { useMode } from '../lib/store';

export default function About() {
  const mode = useMode();
  const counts = TERMS.reduce<Record<string, number>>((m, t) => ((m[t.status] = (m[t.status] ?? 0) + 1), m), {});
  return (
    <div>
      <PageHead kicker="About" title="How slang actually works.">
        A few things worth knowing before you go calling your teacher “unc.”
      </PageHead>

      <div className="card stack" style={{ marginBottom: 18 }}>
        <h2>⚙️ Settings</h2>
        <div className="grid two">
          <ModeSelect />
          <div className="field small"><span className="muted">Theme & sound</span><div className="row"><ThemeToggle /><SoundToggle /></div></div>
        </div>
        <div className="small muted">
          <p><strong>Family Friendly</strong> (default): kid-safe terms and examples only. <strong>Teen Mode</strong>: adds rude-but-common slang, with labels. <strong>Unfiltered Dictionary</strong>: for older users and educators — shows terms with mature or derogatory origins, clearly flagged and defined neutrally. Games never use mature terms in any mode.</p>
          <p style={{ margin: 0 }}>You’re seeing {termsFor(mode).length} of {TERMS.length} entries in the current mode.</p>
        </div>
      </div>

      <div className="grid two">
        <article className="card">
          <h3>🔁 Translations are approximations</h3>
          <p className="muted">Slang meaning depends on who says it, to whom, and how ironically. “Cooked” can mean doomed — or “he cooked” can mean he did amazingly. Our translator uses a hand-built phrase dictionary and context rules, works offline, and tells you its confidence. It will miss brand-new phrases; you can suggest them for review.</p>
        </article>
        <article className="card">
          <h3>🌍 Credit where it’s due</h3>
          <p className="muted">A lot of “internet slang” didn’t start on TikTok. Many terms — cap, finna, on god, it’s giving, periodt, woke — come from African American Vernacular English (AAVE). Words like shade, read, serve, mother, and yass come from ballroom culture created by Black and Latino LGBTQ+ communities. Gamers and streamers gave us nerf, GG, and pog. We note these origins in the dictionary.</p>
        </article>
        <article className="card">
          <h3>👶👵 Generations overlap</h3>
          <p className="muted">“Gen Alpha slang” and “Gen Z slang” are rough patterns, not rules. Plenty of 40-year-olds say “no cap,” and plenty of teens never say “skibidi.” Slang also varies by region, school, friend group, and online community.</p>
        </article>
        <article className="card">
          <h3>⏳ Currentness labels</h3>
          <p className="muted">Each entry is tagged: current ({counts.current ?? 0}), established ({counts.established ?? 0}), mostly ironic ({counts.ironic ?? 0}), fading ({counts.fading ?? 0}), or throwback ({counts.throwback ?? 0}). These reflect our best judgment at the last review date — we never claim something is “trending” just because it’s in the database.</p>
        </article>
        <article className="card">
          <h3>⚠️ Origins vs. how kids use it</h3>
          <p className="muted">Some words kids use innocently (like “glazing” or “gyatt”) have adult or body-focused origins. We say so plainly and neutrally, so parents and teachers can make informed calls. Using a word doesn’t mean someone knows its history.</p>
        </article>
        <article className="card">
          <h3>📚 Where definitions come from</h3>
          <p className="muted">Every definition and example is written for this app. Each entry lists source links (dictionaries like Merriam-Webster, Dictionary.com, Oxford Learner’s; Know Your Meme and Urban Dictionary only as evidence of community usage), a last-reviewed date, and a confidence level. Low-confidence entries are excluded from games.</p>
        </article>
        <article className="card">
          <h3>🔒 Privacy</h3>
          <p className="muted">No sign-up. Progress, favorites, and streaks are stored in your browser on this device only. We never ask for a name, email, birthday, or school. If the optional AI helper is enabled on a server, text you choose to send is passed to an AI model for translation — the app tells you when that happens.</p>
        </article>
        <article className="card">
          <h3>🙅 What we won’t do</h3>
          <p className="muted">No slurs as game rewards, no bullying prompts, no sexual content involving minors, no public feeds or chat rooms. Rizz or Cringe stays friendly. If something in the dictionary looks wrong or outdated, suggest a fix from the Translator page.</p>
        </article>
      </div>
    </div>
  );
}
