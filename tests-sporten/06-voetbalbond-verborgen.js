// De koppeling met de voetbalbond hoort niet bij hockey; minivoetbal en voetbal houden ze. En het voorgestelde formaat per sport.
T.test('voetbalbond: aan/uit per sport', async () => {
  canManage = () => true;
  T.is([voetbalbondImport('voetbal'), voetbalbondImport('hockey'), voetbalbondImport('minivoetbal')], [true, false, true], 'bond-import per sport');
  const team = { id: 't', name: 'x', rbfaTeams: [{ id: 1, naam: 'U9' }] };
  const sectie = sp => { activeSport = sp; try { return rbfaTeamSectieHtml(team) ? 'getoond' : 'verborgen'; } catch (e) { return 'FOUT ' + e.message; } };
  T.is(sectie('voetbal'), 'getoond', 'voetbal toont de bondsectie');
  T.is(sectie('hockey'), 'verborgen', 'hockey verbergt de bondsectie');
  T.is(sectie('minivoetbal'), 'getoond', 'minivoetbal toont de bondsectie');
  activeSport = 'voetbal';
});
T.test('voetbalbond: voorgesteld formaat per sport', async () => {
  const tekst = g => g && (g.matchType + '/' + g.periodKey + '/' + g.quarterDuration);
  T.is(rbfaVormGok('U13 A', 'minivoetbal').matchType, '5v5', 'minivoetbal U13 is 5v5');
  T.is(rbfaVormGok('Eerste elftal', 'minivoetbal').matchType, '5v5', 'minivoetbal senior is 5v5');
  T.is(rbfaVormGok('U8', 'minivoetbal').matchType, '5v5', 'minivoetbal U8 is 5v5');
  T.is(rbfaVormGok('U13 A').matchType, '8v8', 'voetbal U13 blijft zoals voorheen (8v8)');
  T.check(tekst(rbfaVormGok('U16', 'voetbal')).startsWith('11v11'), 'voetbal U16 blijft 11v11');
});
