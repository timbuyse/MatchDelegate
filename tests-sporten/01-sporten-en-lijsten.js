// Per sport de juiste formaten, duren en formaties (voetbal ongewijzigd, hockey, minivoetbal) en de teamstandaarden.
T.test('sporten: formaten en duren per sport', async () => {
  T.is(matchTypesVoorSport('voetbal'), ['3v3', '5v5', '8v8', '11v11'], 'voetbal heeft vier formaten');
  T.is(matchTypesVoorSport('hockey'), ['3v3', '6v6', '8v8', '11v11'], 'hockey heeft 3v3, 6v6, 8v8, 11v11');
  T.is(matchTypesVoorSport('minivoetbal'), ['5v5'], 'minivoetbal is altijd 5v5');
  T.is(sportVan('basketbal'), 'voetbal', 'onbekende sport valt terug op voetbal');
  T.is(sportVan(undefined), 'voetbal', 'ontbrekende sport = voetbal');
  T.check(FORMATIONS['6v6'] && FORMATIONS['6v6'].length >= 3, '6v6 heeft formaties');
  T.is(FORMATIONS['6v6'].map(f => f.slots.length), FORMATIONS['6v6'].map(() => 6), 'elke 6v6-formatie heeft 6 plaatsen');
  const s = sportStandaard('minivoetbal');
  T.is([s.matchType, s.periodKey, s.dur], ['5v5', 'kwarten', 13], 'minivoetbal: 5v5, 4 kwarten van 13');
});
T.test('sporten: standaardwaarden van een ploeg', async () => {
  const oud = { id: 't1', name: 'U9', defaultMatchType: '8v8', defaultPeriodKey: 'kwarten', defaultQuarterDuration: 15, defaultFormation: 'Dubbele ruit' };
  const strip = d => `${d.matchType}/${d.periodKey}/${d.quarterDuration}`;
  activeSport = 'minivoetbal';
  T.is(strip(teamMatchDefaults(oud)), '5v5/kwarten/13', 'minivoetbal negeert een voetbalformaat in de ploeg');
  T.is(strip(teamMatchDefaults(null)), '5v5/kwarten/13', 'minivoetbal zonder ploeg');
  T.is([geldigeVorm('8v8'), geldigeVorm('11v11'), geldigeVorm('5v5')], ['5v5', '5v5', '5v5'], 'minivoetbal: elk ander formaat wordt 5v5');
  activeSport = 'voetbal';
  T.is(strip(teamMatchDefaults(oud)), '8v8/kwarten/15', 'voetbal behoudt het eigen formaat');
  T.is([geldigeVorm('zomaar'), geldigeVorm('11v11')], ['8v8', '11v11'], 'voetbal: onzin wordt 8v8 (zoals altijd), een echt formaat blijft');
  activeSport = 'hockey';
  T.is(strip(teamMatchDefaults({ defaultMatchType: '6v6', defaultPeriodKey: 'kwarten', defaultQuarterDuration: 15 })), '6v6/kwarten/15', 'hockey: 6v6 blijft 6v6');
});
T.test('sporten: een ploeg aanmaken in een minivoetbalclub dwingt 5v5 af', async () => {
  const db = T.fakeDb(); myClubs = { cm: 'admin', cv: 'admin' };
  db.zet('clubs/cm/info', { name: 'Mini', sport: 'minivoetbal' }); db.zet('clubs/cv/info', { name: 'Voet' });
  const a = await createTeam('U13', 'cm', false, '11v11', '', 'helften', 30, true);
  const c = await createTeam('U13', 'cv', false, '11v11', '', 'helften', 30, true);
  const ra = Object.values(db.tree.teams[a.teamId].roster)[0], rc = Object.values(db.tree.teams[c.teamId].roster)[0];
  T.is([ra.defaultMatchType, ra.defaultPeriodKey, ra.defaultQuarterDuration], ['5v5', 'kwarten', 13], 'minivoetbalploeg is 5v5, 4 x 13');
  T.is([rc.defaultMatchType, rc.defaultPeriodKey, rc.defaultQuarterDuration], ['11v11', 'helften', 30], 'voetbalploeg houdt 11v11, 2 x 30');
  T.is(db.tree.teams[a.teamId].info.sport, 'minivoetbal', 'sport is gekopieerd naar de ploeg');
  T.check(db.tree.teams[c.teamId].info.sport === undefined || db.tree.teams[c.teamId].info.sport === 'voetbal', 'voetbalclub: geen of voetbal');
});
