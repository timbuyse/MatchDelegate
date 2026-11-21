// Minivoetbal: cornerteller (vierde corner = cornerbal), protestcorner, cornerbal gescoord of gemist, cornerbalreeks, woorden.
const mvWedstrijd = () => { activeSport = 'minivoetbal'; T.stubOpslag(); const spelers = T.spelers('5v5'); spelers.forEach((s, i) => { s.starting = s.onField = i < 5; }); spelers.push({ id: 'p9', name: 'Wissel', number: '9', starting: false, onField: false, x: 50, y: 50, line: 'MID' });
  match = { id: 'm1', events: [], players: spelers, quarters: [], currentQuarter: 1, quarterStatus: 'running', status: 'live', teamName: 'U9B', opponent: 'Dender', matchType: '5v5',
    periodKey: 'kwarten', numQuarters: 4, quarterDuration: 13, scoreUs: 0, scoreThem: 0, location: 'Thuis', date: '2026-11-21', time: '10:00' }; return match; };
T.test('minivoetbal: vier corners geven een cornerbal', async () => {
  mvWedstrijd();
  for (let i = 0; i < 3; i++) await logCorner('us');
  let t = cornerTelling(match);
  T.is([t.us, t.openUs], [3, 0], 'na drie corners nog geen cornerbal');
  await logCorner('us'); t = cornerTelling(match);
  T.is([t.us, t.openUs], [4, 1], 'de vierde corner geeft een openstaande cornerbal');
  T.check(/Cornerbal voor/.test(T.modalTekst()), 'de app vraagt meteen naar de cornerbal');
  await cornerbalGemist('us');
  T.is(cornerTelling(match).openUs, 0, 'gemist sluit de cornerbal');
  T.check(match.events.some(e => e.type === 'cornerbal_mis_us'), 'gemist is een eigen gebeurtenis');
  T.is(match.scoreUs, 0, 'gemist verandert de stand niet');
});
T.test('minivoetbal: cornerbal gescoord is een gewoon doelpunt met wijze Cornerbal', async () => {
  mvWedstrijd();
  for (let i = 0; i < 4; i++) await logCorner('us');
  await cornerbalDoelpunt('us');
  T.is(goalWijze, 'Cornerbal', 'het doelpuntvenster staat op Cornerbal');
  goalPlayerId = 'p3'; goalAssistId = 'p1'; await confirmGoal();
  const g = match.events.filter(e => e.type === 'goal_us').pop();
  T.is([g.wijze, g.playerId, g.assistId, match.scoreUs], ['Cornerbal', 'p3', 'p1', 1], 'doelpunt: kopper is doelpuntenmaker, trapper is assist');
  recomputeScore(match);
  T.is([match.scoreUs, match.scoreThem], [1, 0], 'de stand klopt na herberekening uit de gebeurtenissen');
  T.is(cornerTelling(match).openUs, 0, 'cornerbal is afgehandeld');
});
T.test('minivoetbal: protestcorner en teller van de tegenstander', async () => {
  mvWedstrijd();
  for (let i = 0; i < 3; i++) await logCorner('them');
  T.is(cornerTelling(match).restThem, 3, 'na drie corners staat de teller op 3');
  await logCorner('them', true);
  T.check(match.events.filter(e => e.type === 'corner_them').pop().protest === true, 'protestcorner is gemarkeerd');
  T.is(cornerTelling(match).openThem, 1, 'de protestcorner telt mee voor de cornerbal');
  await cornerbalDoelpunt('them');
  const gt = match.events.filter(e => e.type === 'goal_them').pop();
  T.is([gt.wijze, match.scoreThem], ['Cornerbal', 1], 'cornerbal voor de tegenstander');
  await logCorner('them');
  T.is(cornerTelling(match).restThem, 1, 'na de cornerbal start de teller opnieuw op 1');
});
T.test('minivoetbal: woorden, cornerbalreeks en veld', async () => {
  mvWedstrijd();
  T.is(cornerWoord(), 'Corner', 'het woord Corner');
  T.check(goalWijzenVoor().includes('Cornerbal'), 'Cornerbal staat bij de doelpuntwijzen');
  match.scoreUs = 1; match.scoreThem = 1;
  match.shootout = { eerste: 'us', schoten: [{ ploeg: 'us', raak: true }, { ploeg: 'them', raak: false }, { ploeg: 'us', raak: true }, { ploeg: 'them', raak: true }] };
  T.check(/cb\./.test(uitslagTxt(match)), 'uitslag toont "cb." voor de cornerbalreeks: ' + uitslagTxt(match));
  T.is(matchResultaat(match), 'W', 'een gewonnen reeks telt als winst');
  const veld = renderPitch(match, match.players.filter(s => s.onField), null, null);
  T.check(/class="pitch pitch-mv"/.test(veld), 'minivoetbalveld heeft de eigen klasse');
  activeSport = 'voetbal';
  T.check(/class="pitch"/.test(renderPitch(match, match.players.filter(s => s.onField), null, null)), 'voetbal houdt zijn gewone veld');
  T.is([cornerWoord(), reeksNaam()].join('|').includes('Cornerbal') || false, false, 'voetbal toont geen cornerbalwoorden');
});
