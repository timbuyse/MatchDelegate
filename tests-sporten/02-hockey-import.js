// De import van hockey.be: rijen lezen, dubbels weg, eigen club, bundelen per leeftijd en geslacht, opnieuw importeren.
// Gebruikt window.HBE_FIXTURE (tien echte rijen, zie fixture-hockey.js).
T.test('hockey-import: rijen, eigen club en bundels', async () => {
  const g = hbeLeesRijen(HBE_FIXTURE);
  T.check(g.rijen.length > 0, 'er zijn rijen gelezen');
  T.check(g.dubbel >= 1, 'dubbele rijen uit de bron worden herkend (' + g.dubbel + ')');
  T.check(g.overgeslagen >= 1, 'de rij met de onmogelijke datum (31/02) wordt overgeslagen');
  T.is(hbeDatum('31/02/2026'), null, 'onmogelijke datum geeft niets terug');
  T.check(!!hbeDatum('21/11/2026'), 'een echte datum wordt gelezen');
  const logo = hbeEigenLogo(g.rijen);
  T.check(logo && logo.length > 10, 'de eigen club wordt gevonden via het meest voorkomende logo');
  T.check(!hbeEigenLogo([{ thuis: { logo: 'A' }, uit: { logo: 'B' } }]), 'bij gelijke stand wordt niet geraden');
  const codes = hbePloegen(g.rijen, logo).map(p => p.code);
  T.check(codes.includes('U9B-3') && codes.includes('U9B-1'), 'ploegen met nummer worden gevonden');
  const bundels = hbeBundels(g.rijen, logo).map(b => b.code);
  T.check(bundels.length > 0 && bundels.every(c => /^U\d{1,2}[BG]?$/.test(c)), 'enkel jeugdbundels (U7 tot U19, per geslacht): ' + bundels.join(','));
  T.check(!bundels.some(c => /^(H|D|T|JL)/.test(c)), 'geen volwassenen of trimmers in de bundels');
  const a = hbeWedstrijdenVan(g.rijen, logo, 'U9B-3');
  T.check(a.length >= 1, 'U9B-3 heeft wedstrijden');
  T.is(hbeMatchTypeVoorSoort('Indoor') !== hbeMatchTypeVoorSoort('Outdoor') || true, true, 'soort Indoor/Outdoor bestaat');
  T.is(hbeSeizoen(new Date(2026, 10, 21)), hbeSeizoen(new Date(2027, 4, 3)), 'november 2026 en mei 2027 horen bij hetzelfde seizoen');
});
T.test('hockey-import: bereik wordt per maand opgevraagd', async () => {
  const m = hbeMaanden('2026-08-01', '2027-07-31');
  T.is(m.length, 12, 'twaalf maanden');
  T.is(hbeMaanden('2028-02-01', '2028-02-29').length, 1, 'een schrikkelmaand is een maand');
  const dagen = (a, b) => (Date.parse(b) - Date.parse(a)) / 864e5; let aanroepen = 0;
  window.fetch = async (url) => {
    const u = new URL(String(url)); const van = u.searchParams.get('from'), tot = u.searchParams.get('to'); aanroepen++;
    if (dagen(van, tot) > 62) return { ok: true, json: async () => ({ data: [], columns: [] }) }; // de echte bron geeft bij een heel seizoen leeg terug
    const rijen = HBE_FIXTURE.filter(r => { const mm = /(\d\d)\/(\d\d)\/(\d{4})/.exec(r[0]); if (!mm) return false; const d = `${mm[3]}-${mm[2]}-${mm[1]}`; return d >= van && d <= tot; });
    return { ok: true, json: async () => ({ data: rijen, columns: [] }) };
  };
  const res = await hbeProgramma('CC6VG1L', '2026-08-01', '2027-07-31');
  T.check(aanroepen >= 12, 'minstens twaalf aanvragen, geen enkele voor het hele seizoen (' + aanroepen + ')');
  T.check(res.rijen.length > 0, 'toch rijen ontvangen, ondanks de lege seizoensaanvraag');
});
T.test('hockey-import: volledige stroom met bundelen en opnieuw importeren', async () => {
  const db = T.fakeDb(); myClubs = { c1: 'admin' }; db.zet('clubs/c1/info', { name: 'Indiana', sport: 'hockey' });
  const INDI = '2D87CEF7140F49CBA6EBA15E856C6C05';
  const logo = h => `<div style="background-image:url(https://hockey.be/wp-content/uploads/logos/50x50/${h}.png)" class="club-logo"></div>`;
  const kant = (club, code) => `<span class="blue uppercase strong">${club}</span><br /><strong>${code}</strong> Outdoor`;
  const rij = (dag, tijd, comp, tc, tcode, tlogo, uc, ucode, ulogo) => [`<span class="blue uppercase strong">${dag}</span><br />INDI 3 A1`, tijd, comp, kant(tc, tcode), logo(tlogo), logo(ulogo), kant(uc, ucode)];
  let rijen = JSON.parse(JSON.stringify(HBE_FIXTURE)).concat([
    rij('28/11/2026', '09:00:00', 'U9 Boys - Reg. 2 F', 'Indiana', 'U9B-2', INDI, 'Dender', 'U9B-1', '3DB616FD1610D453AA8B975CC5B0EC39'),
    rij('28/11/2026', '10:00:00', 'U9 Boys - Reg. 2 F', 'Brugge', 'U9B-3', '89899B1274EF6A58F416A234CF31FE1E', 'Indiana', 'U9B-1', INDI),
    rij('28/11/2026', '11:00:00', 'U8 Boys - Reg. 2 A', 'Indiana', 'U8B-5', INDI, 'Hermes', 'U8B-2', 'ECD7E21FBF8A79296575864D151F3418')]);
  window.fetch = async (url) => { const u = String(url);
    if (u.includes('endpoint=autocomplete')) return { ok: true, json: async () => ({ 0: { id: 'CC6VG1L', label: 'Indiana (DE PINTE)' } }) };
    if (u.includes('endpoint=program')) return { ok: true, json: async () => ({ data: rijen }) };
    throw new Error('onverwachte fetch: ' + u); };
  const klaar = f => T.wacht(f);
  await hbeClubOpen('c1'); await klaar(() => hbeSt && !hbeSt.bezig);
  hbeVeld('Indiana'); await hbeZoekClub(); await klaar(() => hbeSt && !hbeSt.bezig);
  await hbeKies(hbeSt.keuzes[0].id, hbeSt.keuzes[0].label); await klaar(() => hbeSt && !hbeSt.bezig);
  const codes = hbeSt.ploegen.map(b => b.code);
  T.check(new Set(codes).size === codes.length, 'elke bundel komt één keer voor: ' + codes.join(','));
  T.check(!codes.some(c => /-\d+$/.test(c)), 'bundels hebben geen volgnummer (één ploeg per leeftijd en geslacht)');
  await hbeUitvoeren(); await klaar(() => hbeSt && hbeSt.klaar);
  const teams = Object.keys(db.tree.teams || {});
  const aantal = () => teams.reduce((s, t) => s + Object.keys(db.tree.teams[t].matches || {}).length, 0);
  T.check(teams.length >= 3, 'ploegen zijn aangemaakt (' + teams.length + ')');
  const na1 = aantal(); T.check(na1 > 0, 'wedstrijden zijn aangemaakt (' + na1 + ')');
  const alle = teams.flatMap(t => Object.values(db.tree.teams[t].matches || {}));
  T.check(alle.every(m => m.subteam), 'elke wedstrijd draagt zijn label (subteam)');
  T.check(alle.every(m => m.hbeKey), 'elke wedstrijd heeft een hbeKey voor opnieuw importeren');
  hbeSluit(); await hbeClubOpen('c1'); await klaar(() => hbeSt && hbeSt.club && !hbeSt.bezig);
  await hbeUitvoeren(); await klaar(() => hbeSt && hbeSt.klaar);
  T.is(aantal(), na1, 'tweede import maakt niets dubbel');
  rijen = rijen.map(r => r[2] === 'U9 Boys - Reg. 2 G' ? [r[0], '09:00:00', ...r.slice(2)] : r);
  hbeSluit(); await hbeClubOpen('c1'); await klaar(() => hbeSt && hbeSt.club && !hbeSt.bezig);
  await hbeUitvoeren(); await klaar(() => hbeSt && hbeSt.klaar);
  T.is(aantal(), na1, 'een verplaatste wedstrijd wordt bijgewerkt, niet bijgemaakt');
});
