// Draait alle sporttests in een echte browser (Playwright). Gebruik:
//   node tests-sporten/run.js [url] [filter]
// Standaard: http://localhost:3000/index.html. Start eerst de app met een static server.
// De tests zetten niets weg: opslag is gestubd en Firebase/fetch zijn nagemaakt. Toch verdient een NIEUWE poort de voorkeur
// (zie CLAUDE.md: poort 3000 kan met jouw account ingelogd zijn). Elke test krijgt een verse pagina.
const fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright ontbreekt. Installeer het met: npm i -D playwright  (in een aparte map, niet in de repo)'); process.exit(2); }
const url = process.argv[2] || 'http://localhost:3000/index.html', filter = process.argv[3] || '';
const lees = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const bestanden = fs.readdirSync(__dirname).filter(f => /^\d\d-.*\.js$/.test(f) && f !== '00-helpers.js').sort();
(async () => {
  const b = await chromium.launch(); let slecht = 0, goed = 0;
  for (const f of bestanden) {
    const p = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.addScriptTag({ content: lees('fixture-hockey.js') });
    await p.addScriptTag({ content: lees('00-helpers.js') });
    // Elke bovenstaande testbestand in een eigen scope, zodat T.test overal werkt.
    await p.addScriptTag({ content: lees(f) });
    console.log('\n== ' + f);
    p.on('console', m => { const t = m.text(); if (/^(OK|FOUT|MISLUKT|GESLAAGD|\s+x )/.test(t)) console.log(t); });
    const fouten = []; p.on('pageerror', e => fouten.push(e.message));
    const r = await p.evaluate(async (flt) => { return await T.run(flt); }, filter);
    fouten.forEach(x => console.log('FOUT pageerror: ' + x));
    goed += r.ok; slecht += r.fout + fouten.length; await p.context().close();
  }
  await b.close();
  console.log(`\nTOTAAL: ${goed} goed, ${slecht} fout`); process.exit(slecht ? 1 : 0);
})();
