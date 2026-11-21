// Gedeelde hulpjes voor alle sporttests. Plak dit bestand altijd EERST in de Console (of laat run.js het doen).
// Een test is `T.test('naam', async () => { ...T.is(werkelijk, verwacht, 'uitleg')... })`; daarna `await T.run()`.
// Veiligheid: de tests stubben alles wat opslaat (dbSave, render, ...) en gebruiken een nagemaakte database en fetch.
// Laad daarna de pagina opnieuw (F5): sommige tests zetten globals zoals activeSport of fbdb om.
(function () {
  const T = window.T = { tests: [], resultaten: [] };
  T.test = (naam, fn) => T.tests.push({ naam, fn });
  T.check = (ok, uitleg) => { T.huidig.push({ ok: !!ok, uitleg }); };
  T.is = (werkelijk, verwacht, uitleg) => {
    const a = JSON.stringify(werkelijk), b = JSON.stringify(verwacht);
    T.huidig.push({ ok: a === b, uitleg: uitleg + (a === b ? '' : ` (kreeg ${a}, verwacht ${b})`) });
  };
  T.wacht = async (f, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (f()) return; await new Promise(r => setTimeout(r, 20)); } throw new Error('time-out bij wachten'); };
  T.platte = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  T.modalTekst = () => ((document.getElementById('modal') || {}).innerText || '');
  // Alles wat schrijft of hertekent uitzetten.
  T.stubOpslag = () => { dbSave = async () => {}; render = () => {}; canLive = () => true; meldVastgelegd = () => {}; };
  // Nagemaakte Firebase-database in het geheugen.
  T.fakeDb = () => {
    const tree = {}; let n = 0;
    const keys = pad => pad.split('/').filter(Boolean);
    const get = pad => keys(pad).reduce((x, k) => (x == null ? undefined : x[k]), tree);
    const zet = (pad, v) => { const ks = keys(pad); let x = tree; ks.slice(0, -1).forEach(k => { if (!x[k] || typeof x[k] !== 'object') x[k] = {}; x = x[k]; }); const l = ks[ks.length - 1]; if (v === null || v === undefined) delete x[l]; else x[l] = JSON.parse(JSON.stringify(v)); };
    const ref = pad => ({ once: async () => ({ val: () => { const v = get(pad); return v === undefined ? null : JSON.parse(JSON.stringify(v)); } }), set: async v => zet(pad, v),
      update: async o => { Object.keys(o).forEach(k => zet(pad + '/' + k, o[k])); }, remove: async () => zet(pad, null), push: () => ({ key: '-K' + (++n) }) });
    fbdb = { ref }; currentUser = { uid: 'u1' }; isOwner = true;
    return { tree, zet, get };
  };
  // Een nagemaakte speler-opstelling voor een formatie.
  T.spelers = (matchType, aantalOpVeld) => {
    const f = FORMATIONS[matchType][0];
    return f.slots.map((s, i) => ({ id: 'p' + i, name: 'Sp' + i, number: String(i + 1), starting: i < (aantalOpVeld || 99), onField: i < (aantalOpVeld || 99), x: s.x, y: s.y, line: s.line, posNum: '' }));
  };
  T.run = async (filter) => {
    const fouten = [];
    window.addEventListener('error', e => fouten.push(e.message));
    let ok = 0, fout = 0;
    for (const t of T.tests) {
      if (filter && !t.naam.includes(filter)) continue;
      T.huidig = [];
      try { await t.fn(); } catch (e) { T.huidig.push({ ok: false, uitleg: 'UITZONDERING: ' + (e && e.message) }); }
      const slecht = T.huidig.filter(x => !x.ok);
      T.huidig.forEach(x => (x.ok ? ok++ : fout++));
      console.log((slecht.length ? 'FOUT ' : 'OK   ') + t.naam + ` (${T.huidig.length - slecht.length}/${T.huidig.length})`);
      slecht.forEach(x => console.log('       x ' + x.uitleg));
      T.resultaten.push({ naam: t.naam, ok: !slecht.length, slecht: slecht.map(x => x.uitleg) });
    }
    if (fouten.length) { fout += fouten.length; console.log('FOUT pagina-fouten: ' + fouten.join(' | ')); }
    console.log(`\n${fout ? 'MISLUKT' : 'GESLAAGD'}: ${ok} controles goed, ${fout} fout. Laad de pagina opnieuw (F5) voor je verder werkt.`);
    T.klaar = { ok, fout };
    return T.klaar;
  };
})();
