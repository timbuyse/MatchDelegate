// Het veld per sport: voetbal onveranderd, minivoetbal, hockey buiten en hockey zaal.
const veldSpelers = (mt) => T.spelers(mt, 99);
T.test('velden: variant en klasse per sport', async () => {
  const mk = (mt, extra) => Object.assign({ id: 'x', events: [], players: veldSpelers(mt), matchType: mt, quarters: [], teamName: 'U' }, extra || {});
  activeSport = 'voetbal'; T.is(veldVariant(mk('8v8')), 'voetbal', 'voetbal: gewoon veld');
  activeSport = 'minivoetbal'; T.is(veldVariant(mk('5v5')), 'minivoetbal', 'minivoetbal: zaalveld');
  activeSport = 'hockey'; T.is(veldVariant(mk('11v11')), 'hockey', 'hockey buiten');
  T.is(veldVariant(mk('6v6', { zaal: true })), 'hockeyzaal', 'hockey zaal (6v6 met zaal)');
  T.is(veldVariant(mk('6v6')), 'hockey', 'hockey 6v6 zonder zaal is gewoon het buitenveld (U9)');
  activeSport = 'voetbal';
});
T.test('velden: renderPitch zonder fouten voor elke sport en formaat', async () => {
  const gevallen = [['voetbal', '3v3'], ['voetbal', '5v5'], ['voetbal', '8v8'], ['voetbal', '11v11'], ['minivoetbal', '5v5'], ['hockey', '3v3'], ['hockey', '6v6'], ['hockey', '8v8'], ['hockey', '11v11']];
  for (const [sp, mt] of gevallen) {
    activeSport = sp; const pl = veldSpelers(mt);
    const html = renderPitch({ id: 'x', events: [], players: pl, matchType: mt, quarters: [], teamName: 'U' }, pl, null, null);
    T.check(html.length > 200 && (html.match(/class="pdot[ "]/g) || []).length === pl.length, `${sp} ${mt}: veld met ${pl.length} spelers`);
  }
  activeSport = 'hockey'; const pl = veldSpelers('6v6');
  const zaal = renderPitch({ id: 'x', events: [], players: pl, matchType: '6v6', zaal: true, quarters: [], teamName: 'U' }, pl, null, null);
  T.check(/pitch-hkz/.test(zaal), 'zaalhockey gebruikt het zaalveld');
  const buiten = renderPitch({ id: 'x', events: [], players: veldSpelers('11v11'), matchType: '11v11', quarters: [], teamName: 'U' }, veldSpelers('11v11'), null, null);
  T.check(/pitch-hk/.test(buiten) && !/pitch-hkz/.test(buiten), 'buitenhockey gebruikt het buitenveld');
  activeSport = 'voetbal';
});
