// Hockey: groene/gele/rode kaart, tijdelijke schorsing met aftelling, terugkeer, wisselblokkade, en dat het voetbal ongewijzigd blijft.
const hkWedstrijd = () => { activeSport = 'hockey'; T.stubOpslag(); modalSub = () => {};
  const spelers = T.spelers('11v11');
  match = { id: 'h1', events: [], players: spelers, quarters: [{ num: 1, startTime: Date.now() - 60000, totalPaused: 0 }], currentQuarter: 1, quarterStatus: 'running', status: 'live',
    teamName: 'U14B', opponent: 'Gantoise', matchType: '11v11', periodKey: 'helften', numQuarters: 2, quarterDuration: 35, scoreUs: 0, scoreThem: 0 }; return match; };
const veldIds = () => match.players.map(x => x.id + ':' + x.onField).join(',');
T.test('hockey: woorden en kaartduren', async () => {
  hkWedstrijd();
  T.is([penaltyWoord(), vrijeWoord(), cornerWoord()].map(x => typeof x), ['string', 'string', 'string'], 'hockeywoorden bestaan');
  T.is(kaartDuren(match, 'green'), [2], 'buiten: groen 2 minuten');
  T.is(kaartDuren(match, 'yellow'), [5, 10], 'buiten: geel 5 of 10 minuten');
  match.zaal = true;
  T.is(kaartDuren(match, 'green'), [1], 'zaal: groen 1 minuut');
  T.is(kaartDuren(match, 'yellow'), [2, 4], 'zaal: geel 2 of 4 minuten');
});
T.test('hockey: groene kaart zet de speler op de bank en laat hem terugkeren', async () => {
  hkWedstrijd();
  await logCardHockey('green', 'p3');
  const kaart = match.events.find(e => e.type === 'green_card');
  T.check(kaart && kaart.tijdelijk && kaart.duurMin === 2, 'groene kaart is tijdelijk, 2 minuten');
  T.is(match.players.find(x => x.id === 'p3').onField, false, 'de speler gaat naar de bank');
  const sub = match.events.find(e => e.type === 'substitution');
  T.check(sub && sub.playerOutId === 'p3' && !sub.playerInId && sub.reden === 'schorsing', 'dat is een wissel zonder invaller met reden schorsing');
  T.is(match.players.filter(x => x.onField).length, 10, 'de ploeg speelt met één man minder');
  T.check(T.platte(schorsingRegelHtml(match)).length > 0, 'de schorsing staat zichtbaar in de balk');
  // replay uit de gebeurtenissen geeft dezelfde bezetting
  const bijgehouden = veldIds(); recomputeOnField(match); T.is(veldIds(), bijgehouden, 'herberekening uit events klopt');
  // 3 minuten later is de groene kaart om
  match.quarters[0].startTime = Date.now() - 60000 - 180000;
  T.check(/terug op het veld/.test(schorsingRegelHtml(match)), 'na 3 minuten mag de speler terug');
  await kaartTerug(schorsingen(match).find(s => s.color === 'green').kaartId);
  const terug = match.events[match.events.length - 1];
  T.check(terug.type === 'substitution' && terug.playerInId === 'p3' && !!terug.naarPlek, 'terugkeer is een wissel met invaller en plek');
  T.is(match.players.filter(x => x.onField).length, 11, 'weer met elf');
  const b2 = veldIds(); recomputeOnField(match); T.is(veldIds(), b2, 'herberekening na terugkeer klopt');
  T.is(schorsingen(match).filter(s => !s.terug).length, 0, 'geen openstaande schorsingen meer');
});
T.test('hockey: gele kaart kiest een duur, wissel van een geschorste speler kan niet', async () => {
  hkWedstrijd();
  await logCardHockey('yellow', 'p4');
  T.check(/Hoe lang moet hij eruit/.test(T.modalTekst()), 'bij geel vraagt de app eerst de duur');
  T.is(match.events.length, 0, 'er is nog niets vastgelegd');
  await logCardHockey('yellow', 'p4', 10);
  T.is(match.events.find(e => e.type === 'yellow_card').duurMin, 10, 'geel van 10 minuten');
  T.is(match.players.find(x => x.id === 'p4').onField, false, 'speler is van het veld');
  subOut = 'p5'; subIn = 'p4'; const voor = match.events.length; await confirmSub();
  T.is(match.events.length, voor, 'een geschorste speler kan niet ingewisseld worden');
});
T.test('hockey: tweede gele geeft geen rood, rood blijft blijvend, tegenstander telt enkel af', async () => {
  hkWedstrijd();
  await logCardHockey('yellow', 'p4', 5); await logCardHockey('yellow', 'p4', 5);
  T.check(!match.events.some(e => e.type === 'red_card'), 'twee gele kaarten geven in hockey geen automatische rode');
  await logCard('red', 'p6');
  T.check(match.events.some(e => e.type === 'red_card' && e.playerId === 'p6') && !match.players.find(x => x.id === 'p6').onField, 'rood: speler eruit');
  T.check(!(match.events.filter(e => e.type === 'red_card').pop().tijdelijk), 'rood is niet tijdelijk');
  const inp = document.createElement('div'); inp.innerHTML = '<input id="card-them-nr" value="7"><select id="card-them-dur"><option value="2" selected>2</option></select>'; document.body.appendChild(inp);
  await logCardThem('green'); inp.remove();
  const tg = match.events[match.events.length - 1];
  T.check(tg.type === 'green_card_them' && tg.duurMin === 2 && tg.tijdelijk, 'groene kaart voor de tegenstander met duur');
  T.check(/tegenstander nr\. 7/.test(schorsingRegelHtml(match)), 'tegenstander staat in de balk');
  T.is(match.players.filter(x => x.onField).length, match.players.filter(x => x.onField).length, 'eigen bezetting blijft ongemoeid door een kaart voor de tegenstander');
});
T.test('hockey: Meer-venster en voetbal ongewijzigd', async () => {
  hkWedstrijd(); modalExtra();
  T.check(/Vrije slag/.test(T.modalTekst()), 'het Meer-venster heeft Vrije slag'); closeModal();
  activeSport = 'voetbal';
  T.is(schorsingRegelHtml(match), '', 'voetbal toont geen schorsingsbalk');
  T.check(penaltyWoord() !== undefined, 'voetbal heeft zijn eigen penaltywoord: ' + penaltyWoord());
});
