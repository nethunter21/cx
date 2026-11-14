// Builds the big word lists for Handle Forge: handles/words-en.txt and handles/words-fr.txt.
// Usage: node tools/build-words.js <node_modules dir> <freq_en.txt> <freq_fr.txt>
// Sources (npm): an-array-of-english-words (MIT), an-array-of-french-words (MIT),
// wordnet-db (WordNet licence) for English parts of speech, dictionary-fr (MPL-2.0) for French
// base forms and parts of speech. Ordering uses hermitdave/FrequencyWords 2018 (CC BY-SA 4.0).
// Each output line is `word` or `word:flags`, most common first. Flags: n noun, a adjective, v verb, b base form.
const fs = require('fs'), path = require('path');
const [nm, fen, ffr] = process.argv.slice(2);
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').toLowerCase();
const ok = w => /^[a-z]{2,15}$/.test(w);
const BLOCK_EXACT = new Set(('nigger nigga niggas niggers faggot faggots fag fags retard retards chink chinks spic spics kike kikes tranny trannies cunt cunts whore whores slut sluts rape raped rapes rapist rapists pedo pedos pedophile nazi nazis hitler porn porno cock cocks dick dicks pussy pussies penis vagina anal anus cum fuck fucks fucked fucking fucker shit shits bitch bitches bastard dildo dildos orgasm sex sexy horny boob boobs tits titty wank wanker twat jizz semen ' +
  'pute putes salope salopes connard connards connasse encule encules nique niquer negre negres bougnoule pd pede pedes tapette tapettes bite bites chatte couille couilles merde putain viol viols violeur violeurs nazie bordel branleur foutre').split(' '));
const BLOCK_SUB = ['nigg', 'faggot', 'pedophil', 'bougnoul', 'encul', 'salop', 'connass', 'putain', 'fuck', 'shit', 'cunt', 'porn', 'rapist'];
const blocked = w => BLOCK_EXACT.has(w) || BLOCK_SUB.some(s => w.includes(s));
function freqRank(file) { const m = new Map(); fs.readFileSync(file, 'utf8').split('\n').forEach((l, i) => { const w = strip(l.split(' ')[0] || ''); if (ok(w) && !m.has(w)) m.set(w, i); }); return m; }
function seeded(seed) { let x = seed; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; }
function order(words, rank, flags) {
  const r = seeded(42), arr = [...words].map(w => [w, rank.has(w) ? rank.get(w) : 1e6 + (flags.get(w) && flags.get(w).includes('b') ? 0 : 1e6) + r() * 1e5]);
  arr.sort((a, b) => a[1] - b[1]);
  return arr.map(([w]) => { const f = flags.get(w); return f ? w + ':' + [...new Set(f)].sort().join('') : w; }).join('\n') + '\n';
}
const add = (m, w, f) => m.set(w, (m.get(w) || '') + f);

/* English */
{
  const words = new Set(require(path.join(nm, 'an-array-of-english-words')).map(strip).filter(w => ok(w) && !blocked(w)));
  const flags = new Map(), dict = path.join(nm, 'wordnet-db', 'dict');
  for (const [file, f] of [['index.noun', 'n'], ['index.adj', 'a'], ['index.verb', 'v']]) {
    for (const line of fs.readFileSync(path.join(dict, file), 'utf8').split('\n')) {
      if (!line || line[0] === ' ') continue; const w = line.split(' ')[0];
      if (ok(w) && words.has(w)) { add(flags, w, f); add(flags, w, 'b'); }
    }
  }
  const has = (w, f) => (flags.get(w) || '').includes(f);
  for (const w of words) {
    if (flags.has(w)) continue;
    if (/s$/.test(w) && (has(w.slice(0, -1), 'n') || (/es$/.test(w) && has(w.slice(0, -2), 'n')) || (/ies$/.test(w) && has(w.slice(0, -3) + 'y', 'n')))) add(flags, w, 'n');
    if (/(ing|ed)$/.test(w)) { const s = w.replace(/(ing|ed)$/, ''); if (has(s, 'v') || has(s + 'e', 'v') || (s.length > 2 && s[s.length - 1] === s[s.length - 2] && has(s.slice(0, -1), 'v'))) add(flags, w, 'v'); }
    if (/(er|est)$/.test(w)) { const s = w.replace(/(er|est)$/, ''); if (has(s, 'a') || has(s + 'e', 'a') || (/i$/.test(s) && has(s.slice(0, -1) + 'y', 'a'))) add(flags, w, 'a'); }
  }
  fs.writeFileSync('handles/words-en.txt', order(words, freqRank(fen), flags));
  console.log('en', words.size, 'n', [...flags.values()].filter(f => f.includes('n')).length, 'a', [...flags.values()].filter(f => f.includes('a')).length, 'v', [...flags.values()].filter(f => f.includes('v')).length);
}
/* French */
{
  const words = new Set(require(path.join(nm, 'an-array-of-french-words')).map(strip).filter(w => ok(w) && !blocked(w)));
  const flags = new Map();
  for (const line of fs.readFileSync(path.join(nm, 'dictionary-fr', 'index.dic'), 'utf8').split('\n')) {
    const [raw, fl = ''] = line.split(/\s/)[0].split('/'); const w = strip(raw || '');
    if (!ok(w) || !words.has(w) || /^[A-Z]/.test(raw)) continue;
    add(flags, w, 'b');
    if (/^[a-z]/.test(fl) && /(er|ir|re|oir)$/.test(w)) add(flags, w, 'v');
    else if (/[FW]/.test(fl)) add(flags, w, 'a');
    else if (/[SX]/.test(fl)) add(flags, w, 'n');
  }
  const has = (w, f) => (flags.get(w) || '').includes(f);
  for (const w of words) {
    if (has(w, 'b')) continue;
    if (/[sx]$/.test(w) && has(w.slice(0, -1), 'n')) add(flags, w, 'n');
    if (/(e|es|s)$/.test(w)) { const s = w.replace(/(es|e|s)$/, ''); if (has(s, 'a')) add(flags, w, 'a'); }
    if (/(euse|euses)$/.test(w) && has(w.replace(/euses?$/, 'eux'), 'a')) add(flags, w, 'a');
  }
  fs.writeFileSync('handles/words-fr.txt', order(words, freqRank(ffr), flags));
  console.log('fr', words.size, 'n', [...flags.values()].filter(f => f.includes('n')).length, 'a', [...flags.values()].filter(f => f.includes('a')).length, 'v', [...flags.values()].filter(f => f.includes('v')).length);
}
