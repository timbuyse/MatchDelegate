// ===================== WEDSTRIJDINFO OPHALEN VAN DE WEDSTRIJDPAGINA =====================
// Een wedstrijd die niemand live gevolgd heeft, staat achteraf vaak leeg in de app terwijl álles wat
// je nodig hebt intussen op de openbare wedstrijdpagina van de bond staat: de selectie van beide
// ploegen, de uitslag, de kaarten, de scheidsrechter, het terrein, de trainer en de afgevaardigde.
// Dit bestand haalt die pagina op, laat je nakijken wat de app ervan begrepen heeft, en schrijft pas
// op jouw knop weg. Zelfde vorm als de PSD-import (import-psd.js) — dat is hier het model.
//
// GEEN KOPPELING, GEEN SAMENWERKING. Net als bij ProSoccerData: dit is een openbare pagina uitlezen,
// meer niet. Er is geen afspraak met de voetbalbond, geen documentatie en geen toezegging dat het
// blijft werken. Daarom is de hele functie opgebouwd rond één regel: LUKT HET NIET, DAN VERANDERT ER
// NIETS. Je krijgt een gewone melding en vult in met de hand, precies zoals voordien. Nergens in de
// teksten van dit scherm staat "koppeling" of "integratie" — het zijn geen woorden die kloppen.
//
// WAAROM NIET DE PAGINA ZELF (gemeten 30-08-2026). www.voetbalvlaanderen.be zelf ophalen kan niet:
// de browser blokkeert dat (CORS). De pagina haalt haar gegevens bij een aparte dienst, en díé staat
// wél open voor andere herkomsten — gemeten vanaf localhost én vanuit de app. De vraag hieronder is
// letterlijk de vraag die de site zelf stelt; hij komt uit haar eigen JavaScript.
//
// ALLES WAT OP HET BLAD STAAT, KOMT MEE (Tims regel van 31-08-2026). Staan de doelpuntenmakers erop:
// meenemen. Staan de kaarten erop: meenemen. Staan de wissels met hun minuut erop: meenemen, en dan
// ook de speelminuten. Staat het er niet, dan gebeurt er niets — geen schatting, geen benadering.
//
// TOT v1.27.7 GING DAT ANDERS, en het argument daarvoor was fout. De wissels werden overgeslagen
// "omdat er niet bij staat wie voor wie inviel". Dat hebben we niet nodig: calcMinutes kent al sinds
// v0.49.0 de eenzijdige wissel (playerInId of playerOutId mag null zijn), dus elke in- en uitwissel
// kan los op zijn minuut. Bij de wedstrijd waarop dit boven kwam gingen op minuut 75 drie spelers
// samen uit en drie in — paren zijn daar niet alleen onnodig, ze zijn niet te maken.
//
// DE KLOK VAN HET BLAD. Speeltijd komt in deze app altijd uit m.quarters (getGameTimeMs), en die
// heeft een achteraf ingegeven wedstrijd niet — dáárom kwam er nul uit, niet omdat de gegevens
// ontbraken. Het blad geeft wél een klok: minuut 46, 75, 86. Bij het overnemen zetten we dus blokken
// op de wedstrijd die overeenkomen met wat er gespeeld is, en daarna rekent calcMinutes met exact
// dezelfde code als bij een live gevolgde wedstrijd. Geen nieuw veld voor minuten, geen tweede
// rekenweg — dat is de hele reden om het zo te doen.
//
// ALLEEN WANNEER HET VERANTWOORD IS. Voorwaarde: er staan wissels mét minuut op het blad ÉN het blad
// zegt wie begon en wie op de bank zat. Zonder dat laatste weet de app niet wie startte en zou
// iedereen de volle wedstrijd krijgen — dat is fout, niet onnauwkeurig. Bij een vriendschappelijke
// wedstrijd staat er geen bank en geen enkele gebeurtenis op het blad (gemeten 31-08-2026 op drie
// wedstrijden), dus daar blijft alles nul, precies zoals voordien. Tims regel van 29-08-2026 blijft
// dus staan waar hij hoort: heeft niemand gevolgd én staat er niets op het blad, dan geen minuten.
//
// EN ZO'N WEDSTRIJD IS GEEN LIVE GEVOLGDE WEDSTRIJD. Op verschillende plaatsen leest de app
// "er is tijd gelopen" als "hier stond iemand met de klok in de hand, blijf eraf". Zetten we een klok
// zonder meer, dan kan je niet meer opnieuw ophalen — en de bond verwerkt een blad soms dagen later,
// dus je komt hier juist vaak twee keer. Daarom draagt zo'n wedstrijd `klokVanBlad: true` en kijken
// die controles daarop. Zoek dat vlaggetje op vóór je ergens `getGameTimeMs(m) === 0` aanpast.
//
// ER KOMT NIETS NIEUWS IN HET DATAMODEL BIJ. Spelers worden gewone spelers van de selectie,
// doelpunten gewone `quick`-doelpunten zoals bij "Uitslag ingeven", kaarten gewone kaart-events.
// Het enige extra is een merkje `bron:'vv'` op de events die hier vandaan komen, zodat een tweede
// keer ophalen ze vervangt in plaats van te verdubbelen.

const VV_ENDPOINT = 'https://datalake-prod2018.rbfa.be/graphql';
const VV_TIMEOUT_MS = 15000;

// De vraag zoals de site ze zelf stelt. Fragmenten uitgeschreven, zodat hier één blok tekst staat.
const VV_QUERY = `query GetMatchDetail($matchId: ID!, $language: Language!) {
  matchDetail(matchId: $matchId, language: $language) {
    id title startTime eventType state
    series { id name }
    location { name city postalCode address pitchCode synthetic }
    officials { lastName firstName function }
    homeTeam { id name } awayTeam { id name }
    outcome { homeTeamGoals awayTeamGoals isFinished hasPenalties }
    ageGroup
    lineup { home { ...P } away { ...P } }
    substitutes { home { ...P } away { ...P } }
    staffLineup {
      home { lastName firstName function }
      away { lastName firstName function }
    }
  }
}
fragment P on MatchDetailPlayer { id lastName firstName shirtNumber badges events { type minute } }`;

// Toestand van het ophaalscherm. Leeft enkel zolang je op dat scherm bent.
let vvSt = null;

// ---------------------------------------------------------------------------------------------
// 1. DE DIENST BEVRAGEN
// ---------------------------------------------------------------------------------------------

// Het wedstrijdnummer uit wat je plakt. Dat mag een volledige link zijn (.../wedstrijd/7630157) of
// gewoon het nummer. De link kan er per taal anders uitzien, dus we zoeken eerst het bekende stuk en
// vallen anders terug op het langste getal — een wedstrijdnummer telt zeven cijfers.
function vvNummerUit(tekst) {
  const t = String(tekst || '');
  const m = t.match(/(?:wedstrijd|match|rencontre|spiel)\/(\d{4,})/i);
  if (m) return m[1];
  const alle = t.match(/\d{5,}/g);
  return alle ? alle.sort((a, b) => b.length - a.length)[0] : '';
}

// Eén verzoek, met een eigen tijdslimiet. Zonder die limiet kan een wispelturige verbinding het
// scherm minutenlang op "bezig" laten staan (zie de "lie-fi"-uitleg in sw.js).
// `credentials` blijft bewust weg: we sturen niets van de gebruiker mee.
async function vvHaalOp(nummer) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), VV_TIMEOUT_MS);
  try {
    const r = await fetch(VV_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: VV_QUERY, variables: { matchId: String(nummer), language: 'nl' } }),
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error(`De wedstrijdpagina antwoordde niet (${r.status}). Probeer het later opnieuw.`);
    const j = await r.json();
    if (j && j.errors && j.errors.length) throw new Error('De wedstrijdpagina gaf een foutmelding terug. Klopt het wedstrijdnummer?');
    return (j && j.data && j.data.matchDetail) || null;
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('Het ophalen duurde te lang. Kijk je verbinding na en probeer opnieuw.');
    if (e instanceof TypeError) throw new Error('We konden de wedstrijdpagina niet bereiken. Ben je online?');
    throw e;
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------------------------
// 2. LEZEN WAT ERUIT KOMT
// ---------------------------------------------------------------------------------------------

// De pagina zet thuis- en bezoekersploeg naast elkaar in één lijst van paren ({home, away}) — ook de
// spelers, de wisselspelers en de staf. Is één kant korter, dan staat er aan die kant `null`.
function vvKant(lijst, kant) { return (lijst || []).map(r => r && r[kant]).filter(Boolean); }
function vvPersoonNaam(p) { return [p && p.firstName, p && p.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(); }

// Wat er per speler aan gebeurtenissen kan staan, vertaald naar wat de app kent. De pagina gebruikt
// meerdere schrijfwijzen voor hetzelfde (goal / goalScored), dus we vergelijken in kleine letters.
// 'rood2' is de uitsluiting na twee gele kaarten: de app kent maar één soort rode kaart, dus die
// wordt een rode kaart — met een regel erbij op het voorstelscherm, zodat je weet wat er gebeurt.
const VV_SOORT = {
  goal: 'doelpunt', goalscored: 'doelpunt', penalty: 'doelpunt', penaltyscored: 'doelpunt',
  owngoal: 'eigendoelpunt', owngoalscored: 'eigendoelpunt', og: 'eigendoelpunt',
  yellow: 'geel', yellowcard: 'geel',
  red: 'rood', redcard: 'rood', yellowred: 'rood2', yellowredcard: 'rood2',
  in: 'in', minutein: 'in', out: 'uit', minuteout: 'uit',
  penaltymiss: 'gemist',
};
function vvSoort(t) { return VV_SOORT[String(t || '').toLowerCase()] || ''; }

// Eén speler zoals de pagina hem geeft, in de vorm die dit scherm verder gebruikt.
function vvSpelerUit(p, basis) {
  const soorten = (p.events || []).map(e => ({ soort: vvSoort(e.type), minuut: e.minute })).filter(x => x.soort);
  return {
    naam: vvPersoonNaam(p),
    nummer: String(p.shirtNumber || '').trim(),
    kapitein: String(p.badges || '').toUpperCase().indexOf('(C)') >= 0,
    basis,
    soorten,
    doelpunten: soorten.filter(s => s.soort === 'doelpunt').length,
    eigenDoelpunten: soorten.filter(s => s.soort === 'eigendoelpunt').length,
    kaarten: soorten.filter(s => s.soort === 'geel' || s.soort === 'rood' || s.soort === 'rood2'),
    // Enkel de wissels met een bruikbare minuut. Een 'in' of 'uit' zonder minuut zegt dat er gewisseld
    // is maar niet wanneer, en daar kan geen klok op — die laten we liggen in plaats van te gokken.
    wissels: soorten.filter(s => (s.soort === 'in' || s.soort === 'uit') && Number(s.minuut) > 0),
  };
}

// Hoeveel woorden delen deze twee ploegnamen? De pagina schrijft de officiële naam in hoofdletters
// ("SPARTA PETEGEM DEINZE"), de app de naam die de ploeg zelf koos. Korte woordjes ("de", "fc")
// tellen niet mee, anders lijkt elke club op elke andere.
function vvNaamOverlap(a, b) {
  const norm = s => (typeof psdNorm === 'function' ? psdNorm(s) : String(s || '').toLowerCase());
  const wa = new Set(norm(a).split(' ').filter(w => w.length > 2));
  let n = 0;
  norm(b).split(' ').filter(w => w.length > 2).forEach(w => { if (wa.has(w)) n++; });
  return n;
}
// Welke kant van het blad zijn wij? Een gok, die je op het scherm zelf kan omzetten.
function vvGokKant(d, m) {
  const ons = tName(m), teg = m.opponent || '';
  const thuis = vvNaamOverlap(d.homeTeam && d.homeTeam.name, ons) + vvNaamOverlap(d.awayTeam && d.awayTeam.name, teg);
  const uit = vvNaamOverlap(d.awayTeam && d.awayTeam.name, ons) + vvNaamOverlap(d.homeTeam && d.homeTeam.name, teg);
  if (thuis > uit) return 'home';
  if (uit > thuis) return 'away';
  // Even veel (of niets) herkend: dan is wat er in de wedstrijd staat de beste gok die we hebben.
  return isAway(m) ? 'away' : 'home';
}

// Het soort wedstrijd zoals de pagina het noemt, in de woorden van de app. Wat er niet bij staat
// (tornooi, interland, …) laten we bewust ongemoeid: 'Tornooi' is in deze app een aparte modus, en
// die zou je met een los label niet krijgen.
const VV_SOORT_WEDSTRIJD = { friendly: 'Vriendschappelijk', championship: 'Competitie', cup: 'Beker', cupaschampionship: 'Beker' };

// Alles van het blad, gelezen vanuit ónze kant.
function vvLees(d, wij) {
  const ander = wij === 'home' ? 'away' : 'home';
  const spelers = kant => vvKant(d.lineup, kant).map(p => vvSpelerUit(p, true))
    .concat(vvKant(d.substitutes, kant).map(p => vvSpelerUit(p, false)));
  const staf = kant => vvKant(d.staffLineup, kant).map(s => ({ naam: vvPersoonNaam(s), functie: String(s.function || '').trim() }));
  const start = String(d.startTime || '');
  const uitslag = d.outcome || {};
  const loc = d.location || {};
  const scheids = (d.officials || []).filter(o => String(o.function || '').toLowerCase() === 'referee').map(vvPersoonNaam);
  const anderen = (d.officials || []).filter(o => String(o.function || '').toLowerCase() !== 'referee').map(vvPersoonNaam);
  // Er staat geen apart onderscheid basis/bank op elk blad: bij een vriendschappelijke wedstrijd
  // staat iedereen in één lijst en blijft de wisselbank leeg. Dan wéten we niet wie begon.
  const kentBasis = vvKant(d.substitutes, wij).length > 0;
  return {
    nummer: String(d.id || ''),
    titel: String(d.title || ''),
    reeks: (d.series && d.series.name) || '',
    soort: VV_SOORT_WEDSTRIJD[String(d.eventType || '').toLowerCase()] || '',
    eventType: String(d.eventType || ''),
    state: String(d.state || ''),
    gespeeld: String(d.state || '') === 'finished',
    datum: start.slice(0, 10),
    tijd: start.slice(11, 16),
    onsTeam: (d[wij === 'home' ? 'homeTeam' : 'awayTeam'] || {}).name || '',
    hunTeam: (d[ander === 'home' ? 'homeTeam' : 'awayTeam'] || {}).name || '',
    thuis: wij === 'home',
    scoreOns: wij === 'home' ? uitslag.homeTeamGoals : uitslag.awayTeamGoals,
    scoreZij: wij === 'home' ? uitslag.awayTeamGoals : uitslag.homeTeamGoals,
    strafschoppen: !!uitslag.hasPenalties,
    scheidsrechter: scheids.join(', '),
    andereOfficials: anderen,
    terrein: [loc.name, loc.pitchCode ? 'terrein ' + loc.pitchCode : ''].filter(Boolean).join(' — '),
    stad: [loc.address, [loc.postalCode, loc.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    onzeSpelers: spelers(wij),
    hunSpelers: spelers(ander),
    onzeStaf: staf(wij),
    kentBasis,
  };
}

// De trainer(s) en de afgevaardigde(n) van ons blad, elk als één tekst zoals de app ze bewaart.
// T1 t/m T5 zijn trainers; wie "afgevaardigde" in zijn functie heeft, is de ploegverantwoordelijke.
// De rest (verzorger, dokter, materiaal) kent de app niet en laten we liggen.
function vvTrainers(lz) { return staffJoin((lz.onzeStaf || []).filter(s => /^t\d$/i.test(s.functie)).map(s => s.naam)); }
function vvVerantwoordelijken(lz) { return staffJoin((lz.onzeStaf || []).filter(s => /afgevaardigde/i.test(s.functie)).map(s => s.naam)); }

// ---------------------------------------------------------------------------------------------
// 3. NAMEN KOPPELEN
// ---------------------------------------------------------------------------------------------
// Dezelfde vraag als bij de PSD-import: een naam op een blad terugvinden in de kern. We gebruiken
// daarom bewust dezelfde vergelijking (psdZelfdePersoon uit import-psd.js, dat vóór dit bestand
// geladen wordt): ze vergelijkt op de VERZAMELING woorden, dus de volgorde van voornaam en
// familienaam maakt niet uit, en ze laat een klein spellingverschil toe zonder twee verschillende
// spelers op elkaar te laten lijken. Eén implementatie voor één probleem.
//
// De waarde van een keuzelijst is bewust getypeerd, want er zijn drie soorten bestemmingen:
//   'w:<id>' — staat al in de selectie van deze wedstrijd
//   'r:<id>' — een speler uit je kern of uit een zusterploeg
//   'l:<id>' — een losse speler die we van deze naam maken
//   ''       — niet meenemen
function vvZelfde(a, b) { return typeof psdZelfdePersoon === 'function' ? psdZelfdePersoon(a, b) : String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase(); }

// De kern van de eigen ploeg van deze wedstrijd.
function vvRoster() {
  const m = match;
  const team = kernById(m.teamId) || getTeamsV2().find(t => t.name === m.teamName);
  return (team && team.players) || [];
}
// De speler achter een 'r:'-keuze, uit de eigen kern of uit een zusterploeg. Geeft { p, t } of null;
// `t` is null wanneer hij uit de eigen kern komt.
function vvRosterSpeler(rid) {
  const eigen = vvRoster().find(p => p && p.id === rid);
  if (eigen) return { p: eigen, t: null };
  for (const t of (vvSt.zusters || [])) {
    const p = (t.players || []).find(x => x && x.id === rid);
    if (p) return { p, t };
  }
  return null;
}
// Staat deze naam al in de selectie van de wedstrijd? Eerst op rooster-id (dat is de harde
// koppeling), anders op naam.
function vvReedsInSelectie(naam, rid) {
  const spelers = (match.players || []);
  if (rid) { const opId = spelers.find(p => p.rosterId && p.rosterId === rid); if (opId) return opId; }
  return spelers.find(p => vvZelfde(p.name, naam)) || null;
}

function vvKoppelAutomatisch() {
  const roster = vvRoster();
  const zusterSpelers = [];
  (vvSt.zusters || []).forEach(t => (t.players || []).forEach(p => zusterSpelers.push({ p, t })));
  const gebruikt = new Set();
  vvSt.koppel = {};
  (vvSt.lezing.onzeSpelers || []).forEach((s, i) => {
    const reeds = vvReedsInSelectie(s.naam, null);
    if (reeds && !gebruikt.has('w:' + reeds.id)) { vvSt.koppel[i] = 'w:' + reeds.id; gebruikt.add('w:' + reeds.id); return; }
    const kand = roster.filter(r => !gebruikt.has('r:' + r.id) && vvZelfde(r.name, s.naam));
    if (kand.length === 1) { vvSt.koppel[i] = 'r:' + kand[0].id; gebruikt.add('r:' + kand[0].id); return; }
    // Twijfel in de eigen kern (twee gelijkende namen): dan wijs je hem beter zelf aan.
    if (kand.length > 1) { vvSt.koppel[i] = ''; return; }
    // Niets in de eigen kern: de zusterploegen af, even streng. Hij komt dan als gastspeler binnen.
    const zk = zusterSpelers.filter(z => !gebruikt.has('r:' + z.p.id) && vvZelfde(z.p.name, s.naam));
    if (zk.length === 1) { vvSt.koppel[i] = 'r:' + zk[0].p.id; gebruikt.add('r:' + zk[0].p.id); return; }
    vvSt.koppel[i] = '';
  });
}

function vvZetKoppel(i, waarde) {
  if (!vvSt) return;
  let id = waarde;
  if (id === '__los__') {
    const naam = ((vvSt.lezing.onzeSpelers[i] || {}).naam || '').trim();
    if (!naam) { showToast('Deze naam konden we niet van de pagina lezen.', 'err'); return; }
    const lid = uid();
    vvSt.los[lid] = naam;
    id = 'l:' + lid;
  }
  // Een eerder aangemaakte losse speler die je weer loslaat, hoeft niet te blijven rondslingeren.
  const vorige = vvSt.koppel[i];
  if (vorige && vorige !== id && vorige.slice(0, 2) === 'l:') delete vvSt.los[vorige.slice(2)];
  // Dezelfde bestemming twee keer kiezen kan niet: dan stond één speler er twee keer in.
  if (id) Object.keys(vvSt.koppel).forEach(k => { if (k !== String(i) && vvSt.koppel[k] === id) vvSt.koppel[k] = ''; });
  vvSt.koppel[i] = id;
  vvRender();
}

// ---------------------------------------------------------------------------------------------
// 4. WAT ER TE HALEN VALT — de rijen van het voorstel
// ---------------------------------------------------------------------------------------------

// Mag de uitslag (en mogen de kaarten) van deze wedstrijd overschreven worden? Enkel wanneer er geen
// speeltijd bijgehouden is. Bij een live gevolgde wedstrijd zijn de events dáár de waarheid; die
// zouden hier stil dubbel komen te staan. Zelfde grens als "Uitslag aanpassen" in het bewerkmenu.
// EEN KLOK VAN HET BLAD IS GEEN GELOPEN KLOK. Zonder de tweede voorwaarde sloot deze functie zichzelf
// af zodra ze één keer minuten overgenomen had: er staat dan tijd op de wedstrijd, dus "live gevolgd",
// dus niets meer aan te raken. En dat is precies de wedstrijd waarvoor je hier een tweede keer komt —
// de bond verwerkt een blad soms dagen na het laatste fluitsignaal.
function vvMagUitslag(m) { return !m.tournamentId && (getGameTimeMs(m) === 0 || !!m.klokVanBlad); }
// En mag de selectie aangevuld worden? Niet bij een tornooiwedstrijd: daar komt de selectie uit de
// DAGSELECTIE van het tornooi (tournamentSquadMee) en geldt ze voor alle wedstrijden van die dag.
// Iemand hier bijzetten zou een speler opleveren die niet in die dagselectie staat — en die valt er
// bij de eerstvolgende bewerking langs de tornooiwizard gewoon weer uit. Zelfde reden waarom
// "Selectie aanpassen" op een tornooiwedstrijd grijs staat (zie modalSelectieVerslag).
function vvMagSelectie(m) { return !m.tournamentId; }

// De wedstrijdgegevens die te vullen zijn, elk met wat er nu staat en wat de pagina zegt. Enkel
// rijen waar de pagina iets zegt dat verschilt van wat er staat.
// `oud` leeg → het vinkje staat standaard AAN (aanvullen is waarvoor je hier bent).
// `oud` ingevuld → standaard UIT: wat je zelf ingaf, overschrijven we niet uit onszelf.
function vvInfoRijen(m, lz) {
  const rijen = [];
  const rij = (key, label, oud, nieuw, uitleg) => {
    if (!nieuw || String(oud || '').trim() === String(nieuw).trim()) return;
    rijen.push({ key, label, oud: String(oud || '').trim(), nieuw: String(nieuw).trim(), uitleg: uitleg || '' });
  };
  // De sleutel IS de veldnaam van de wedstrijd: vvOvernemen schrijft `m[key] = nieuw`.
  rij('date', 'Datum', m.date, lz.datum);
  rij('time', 'Uur', m.time, lz.tijd);
  rij('opponent', 'Tegenstander', m.opponent, lz.hunTeam);
  rij('competition', 'Soort', m.competition, lz.soort);
  rij('referee', 'Scheidsrechter', m.referee, lz.scheidsrechter);
  rij('venue', 'Terrein', m.venue, lz.terrein);
  // Bij een tornooiwedstrijd staan drie dingen niet op de wedstrijd zelf. `location` draagt daar de
  // plaats van het tornooi in plaats van Thuis/Uit (een tornooidag is neutraal terrein), en trainer
  // en ploegverantwoordelijke komen van het tornooi (zie matchTrainer/matchResponsible). Ze hier
  // overschrijven zou de dag uit elkaar laten lopen — precies waarom "Info bewerken" ze daar ook
  // enkel toont en niet laat wijzigen.
  if (!m.tournamentId) {
    rij('location', 'Thuis of uit', m.location, lz.thuis ? 'Thuis' : 'Uit');
    rij('trainer', 'Trainer(s)', m.trainer, vvTrainers(lz));
    rij('responsible', 'Ploegverantwoordelijke(n)', m.responsible, vvVerantwoordelijken(lz));
  }
  return rijen;
}

// De kaarten van ons blad, met de speler waaraan ze hangen (index in onzeSpelers), en die van de
// tegenstander met hun rugnummer — dat laatste is wat de app van een tegenspeler kan bewaren.
function vvKaartRijen(lz) {
  const uit = [];
  (lz.onzeSpelers || []).forEach((s, i) => s.kaarten.forEach(k => uit.push({ ons: true, idx: i, naam: s.naam, soort: k.soort, minuut: k.minuut })));
  (lz.hunSpelers || []).forEach(s => s.kaarten.forEach(k => uit.push({ ons: false, naam: s.naam, nummer: s.nummer, soort: k.soort, minuut: k.minuut })));
  return uit.sort((a, b) => (a.minuut || 0) - (b.minuut || 0));
}
function vvKaartWoord(soort) { return soort === 'geel' ? 'gele kaart' : soort === 'rood2' ? 'rood na twee keer geel' : 'rode kaart'; }

// De wissels van ons blad, elk als LOS moment: het blad zegt "in op 75'" en "uit op 86'", niet wie
// voor wie. Dat hoeft ook niet — zie de uitleg bovenaan over de eenzijdige wissel.
function vvWisselRijen(lz) {
  const uit = [];
  (lz.onzeSpelers || []).forEach((s, i) => (s.wissels || []).forEach(w =>
    uit.push({ idx: i, naam: s.naam, soort: w.soort, minuut: Number(w.minuut) })));
  return uit.sort((a, b) => a.minuut - b.minuut);
}

// Kan de app op dit blad speelminuten rekenen? Drie voorwaarden, en alle drie zijn hard:
//  - de wedstrijd is afgelopen (een lopende wedstrijd heeft geen eindstand van de klok);
//  - er staan wissels mét minuut op (anders is er geen enkel moment om op te rekenen);
//  - het blad zegt wie begon en wie op de bank zat (anders zou iedereen de volle wedstrijd krijgen,
//    en dat is fout in plaats van onnauwkeurig).
function vvKanMinuten(lz) { return !!(lz && lz.gespeeld && lz.kentBasis && vvWisselRijen(lz).length); }

// De hoogste minuut die ergens op het blad staat. Nodig omdat een wedstrijd langer kan duren dan het
// plan in de app: toegevoegde tijd, of verlengingen.
function vvHoogsteMinuut(lz) {
  let hoog = 0;
  ['onzeSpelers', 'hunSpelers'].forEach(k => ((lz && lz[k]) || []).forEach(s => (s.soorten || []).forEach(x => {
    const n = Number(x.minuut);
    if (Number.isFinite(n) && n > hoog) hoog = n;
  })));
  return hoog;
}

// De blokken zoals DEZE wedstrijd ze zelf kent (2 helften, 3 delen, 4 kwarten) met hun eigen duur.
// Loopt het blad verder dan het plan, dan rekt het LAATSTE blok mee: extra tijd komt aan het einde en
// niet netjes verdeeld over de hele wedstrijd.
function vvKlokPlan(m, lz) {
  const aantal = Math.max(1, Number(m.numQuarters) || 4);
  const duur = Math.max(1, Number(m.quarterDuration) || 25);
  const blokken = [];
  for (let i = 1; i <= aantal; i++) blokken.push({ num: i, vanMin: (i - 1) * duur, totMin: i * duur });
  const laatste = blokken[blokken.length - 1];
  const hoog = vvHoogsteMinuut(lz);
  if (hoog > laatste.totMin) laatste.totMin = hoog;
  return { blokken, totaalMin: laatste.totMin };
}

// De minuut van het blad als speeltijd in de app. gameMin() (views-account.js) toont
// floor(ms/60000)+1, dus minuut 86 moet op 85 volle minuten staan om als 86' te lezen. Zonder deze
// -1 staat élke gebeurtenis een minuut te laat in de tijdlijn.
function vvGameMs(minuut) { return Math.max(0, (Number(minuut) || 1) - 1) * 60000; }

// In welk blok valt die speeltijd?
function vvKwartVan(klok, gameMs) {
  const min = gameMs / 60000;
  for (const b of klok.blokken) if (min < b.totMin) return b.num;
  return klok.blokken[klok.blokken.length - 1].num;
}

// De klok op de wedstrijd zetten. De tijdstempels hangen aan datum en uur van de wedstrijd zelf, zodat
// ze niet toevallig van vandaag zijn; voor de speeltijd telt enkel het verschil (zie getGameTimeMs).
// `klokVanBlad` is het vlaggetje waaraan de rest van de app ziet dat hier niemand met een klok in de
// hand stond — lees de uitleg bovenaan vóór je het gebruikt.
function vvZetKlok(m, klok) {
  const geparsed = Date.parse(`${m.date || ''}T${m.time || '00:00'}:00`);
  const start = Number.isFinite(geparsed) ? geparsed : Date.now() - klok.totaalMin * 60000;
  m.quarters = klok.blokken.map(b => ({
    num: b.num,
    startTime: start + b.vanMin * 60000,
    endTime: start + b.totMin * 60000,
    totalPaused: 0,
    pausedAt: null,
  }));
  m.currentQuarter = klok.blokken.length;
  m.klokVanBlad = true;
}

// ---------------------------------------------------------------------------------------------
// 5. HET SCHERM
// ---------------------------------------------------------------------------------------------

function vvStart() {
  if (!match) return;
  if (!canManage()) { showToast('Enkel een beheerder met verbinding kan wedstrijdinfo ophalen.', 'err'); return; }
  if (!rosterReady()) { showToast('Spelers zijn nog aan het laden — probeer het over een paar seconden opnieuw.', 'err'); return; }
  vvSt = {
    // HET WEDSTRIJDNUMMER STAAT ER VAAK AL. Een wedstrijd die uit de kalender van de voetbalbond
    // ingelezen is, draagt het nummer van de bond (m.rbfaMatchId, gezet door impVoerUit in
    // import-cal.js). Dan hoeft er niets opgezocht en niets geplakt te worden: het veld staat
    // ingevuld en één tik volstaat. Staat het er niet, dan is dit gewoon leeg zoals voordien.
    fase: 'kies', matchId: match.id, link: String(match.rbfaMatchId || ''), bezig: false, fout: '',
    ruw: null, lezing: null, wij: 'home', koppel: {}, los: {}, zusters: [],
    aan: {},
  };
  go('importvv');
}
function vvTerug() {
  const id = vvSt && vvSt.matchId;
  const naar = (match && match.status === 'done') ? 'detail' : 'prep';
  vvSt = null;
  go(naar, id);
}
function vvOpnieuw() { if (!vvSt) return; vvSt.fase = 'kies'; vvSt.ruw = null; vvSt.lezing = null; vvSt.fout = ''; render(); }
function vvRender() {
  const el = document.getElementById('vv-content');
  if (!el) { render(); return; }
  el.innerHTML = vvBodyHtml();
}
function renderImportVv() {
  if (!vvSt || !match) {
    return `<div class="hdr"><button class="back" onclick="go('matches')">‹</button><h1>${icI(IC.link)} Wedstrijdinfo ophalen</h1></div>
      <div class="content"><div class="empty"><div class="ei">${IC.link}</div>
        <p>Wedstrijdinfo ophalen kan enkel een ploegbeheerder, vanuit één wedstrijd.</p></div>
        <button class="btn btn-pale" onclick="go('matches')">Naar de wedstrijden</button></div>`;
  }
  return `<div class="hdr"><button class="back" onclick="vvTerug()">‹</button><h1>${icI(IC.link)} Wedstrijdinfo ophalen</h1></div>
    <div class="content" id="vv-content">${vvBodyHtml()}</div>`;
}
function vvBodyHtml() { return vvSt.fase === 'na' ? vvVoorstelHtml() : vvKiesHtml(); }

const VV_STAPPEN = [
  'Zoek de wedstrijd op <b>voetbalvlaanderen.be</b> — via je club, je reeks of de kalender.',
  'Open de wedstrijdpagina. Bovenaan in je browser staat een adres dat eindigt op <b>/wedstrijd/</b> en een nummer.',
  'Kopieer dat volledige adres en plak het hieronder. Enkel het nummer mag ook.',
];
function vvKiesHtml() {
  // Staat het wedstrijdnummer al op de wedstrijd (ingelezen uit de kalender van de bond), dan gaan de
  // drie stappen hieronder over iets wat je niet meer hoeft te doen — die vallen dan weg, en het
  // plakveld verhuist achter een dichtgeklapt "Een ander nummer gebruiken".
  const nrKlaar = String((match && match.rbfaMatchId) || '').trim();
  return `
    <div class="card" style="border-left:4px solid var(--org)">
      <div style="font-weight:800;font-size:15px;margin-bottom:4px">${icI(IC.warn)} Demo-functie</div>
      <p style="font-size:13px;color:var(--txt2);margin:0">De app leest hier een <b>openbare wedstrijdpagina</b> uit. Dat is geen afspraak met de voetbalbond: verandert die pagina, dan kan het ophalen stoppen met werken. Dan vul je gewoon met de hand in, zoals altijd. Je krijgt sowieso eerst te zien wat we begrepen hebben.</p>
    </div>

    <div class="sec">Hoe werkt dit?</div>
    <div class="card">
      <p style="font-size:14px;color:var(--txt2);margin:0 0 10px">Van een wedstrijd die je niet live gevolgd hebt, staat er achteraf vaak meer op de wedstrijdpagina dan in je app: de selectie van beide ploegen, de uitslag, de kaarten, de scheidsrechter, het terrein, de trainer en de afgevaardigde.</p>
      ${/* WAAR EN WANNEER DIT WERKT (Tim, 30-08-2026). Twee voorwaarden, en allebei bepalen ze of er
           überhaupt iets te halen valt. Ze horen hier te staan, niet pas nadat je een leeg scherm
           terugkrijgt: anders lees je "er staat niets op" als "de app werkt niet". */ ''}
      <p style="font-size:13px;color:var(--txt2);margin:0 0 10px;padding:8px 10px;background:var(--bg2,#f4f6f8);border-radius:8px"><b>Dit is er voor de bovenbouw.</b> Daar wordt een wedstrijdblad ingevuld. Bij de jongste reeksen worden er geen uitslagen, rangschikkingen of opstellingen bijgehouden, dus valt er ook niets op te halen.<br><br><b>En pas zodra het blad verwerkt is.</b> De opstellingen en de uitslag verschijnen op die pagina wanneer de bond het officiële wedstrijdblad verwerkt heeft — niet meteen na het laatste fluitsignaal. Kom je er te vroeg, dan staat er nog weinig; probeer dan later opnieuw.</p>
      ${nrKlaar
        ? `<p style="font-size:14px;color:var(--txt2);margin:0"><b>Je hoeft niets op te zoeken.</b> Deze wedstrijd komt uit de kalender van de voetbalbond, dus haar wedstrijdnummer (<b>${esc(nrKlaar)}</b>) staat er al bij. Eén tik op de knop hieronder volstaat.</p>`
        : `<ol style="margin:0;padding-left:20px;font-size:14px;color:var(--txt2);line-height:1.8">
        ${VV_STAPPEN.map(s => `<li>${s}</li>`).join('')}
      </ol>`}
      <p style="font-size:13px;color:var(--txt2);margin:10px 0 0"><b>Alles wat op het blad staat, kan mee:</b> de selectie, de uitslag met de doelpuntenmakers, de kaarten, en bij een competitiewedstrijd ook de wissels met hun minuut — en daarmee de speelminuten. Staat iets er niet, dan gebeurt er niets: bij een vriendschappelijke wedstrijd houdt de bond enkel de namen en de uitslag bij. Wat nooit op het blad staat, is de opstelling per ${pSingLow(match)}.</p>
    </div>

    <div class="sec">${nrKlaar ? 'Ophalen' : 'Link of nummer'}</div>
    <div class="card">
      ${/* Het veld blijft bestaan wanneer het nummer al bekend is — vvOphalen leest het uit
           #vv-link — maar het zit dan dichtgeklapt: je hebt het alleen nodig als het nummer om
           een of andere reden niet klopt. */''}
      ${nrKlaar ? `<details class="more-details"><summary>Een ander nummer gebruiken</summary><div style="margin-top:10px">` : ''}
      <div class="fg" style="margin:0"><label>Het adres van de wedstrijdpagina</label>
        <input id="vv-link" type="text" inputmode="url" autocomplete="off" spellcheck="false"
               value="${esc(vvSt.link || '')}" placeholder="https://www.voetbalvlaanderen.be/wedstrijd/…"
               onchange="vvSt.link=this.value"></div>
      ${nrKlaar ? `</div></details>` : ''}
      ${vvSt.fout ? `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(220,60,60,.12);color:var(--rd);font-size:14px;font-weight:600">${icI(IC.warn)}${esc(vvSt.fout)}</div>` : ''}
      <button class="btn btn-green" style="margin-top:12px" ${vvSt.bezig ? 'disabled style="opacity:.5"' : 'onclick="vvOphalen()"'}>${icI(IC.link)} ${vvSt.bezig ? 'Bezig met ophalen…' : 'Gegevens ophalen'}</button>
      <p style="font-size:13px;color:var(--txt2);margin:14px 0 0">Er wordt nog niets bewaard: je krijgt eerst te zien wat we van de pagina begrepen hebben, en pas daarna neem je het over. Wat je zelf al ingaf, blijft standaard staan.</p>
    </div>`;
}

async function vvOphalen() {
  if (!vvSt || vvSt.bezig) return;
  const veld = document.getElementById('vv-link');
  if (veld) vvSt.link = veld.value;
  const nummer = vvNummerUit(vvSt.link);
  if (!nummer) { vvSt.fout = 'Hier vinden we geen wedstrijdnummer in. Plak het volledige adres van de wedstrijdpagina.'; vvRender(); return; }
  vvSt.fout = ''; vvSt.bezig = true; vvRender();
  try {
    const d = await vvHaalOp(nummer);
    if (!d) throw new Error(`Wedstrijd ${nummer} bestaat niet op de wedstrijdpagina. Kijk het nummer na.`);
    vvSt.ruw = d;
    vvSt.wij = vvGokKant(d, match);
    vvSt.lezing = vvLees(d, vvSt.wij);
    // De kernen van de zusterploegen erbij halen vóór we koppelen: een naam op het blad die niet in
    // de eigen kern staat, is vaak een speler die van een andere ploeg van de club kwam meehelpen.
    // Mislukt dit (geen club, geen rechten, geen net), dan koppelen we enkel tegen de eigen kern.
    try { vvSt.zusters = await clubZusterPloegen(); } catch (e) { vvSt.zusters = []; }
    vvKoppelAutomatisch();
    vvZetStandaardVinkjes();
    vvSt.fase = 'na';
  } catch (e) {
    vvSt.fout = (e && e.message) || 'Het ophalen is niet gelukt.';
  }
  vvSt.bezig = false;
  render();
}

// Van kant wisselen: alles opnieuw lezen vanuit de andere ploeg, en opnieuw koppelen.
function vvZetKant(kant) {
  if (!vvSt || !vvSt.ruw || vvSt.wij === kant) return;
  vvSt.wij = kant;
  vvSt.lezing = vvLees(vvSt.ruw, kant);
  vvSt.los = {};
  vvKoppelAutomatisch();
  vvZetStandaardVinkjes();
  vvRender();
}

// De vinkjes zoals ze bij het openen staan. Leeg veld → aanvullen (aan). Ingevuld veld → laten staan
// (uit), want dat heeft iemand zelf ingegeven.
function vvZetStandaardVinkjes() {
  const m = match, lz = vvSt.lezing;
  vvSt.aan = {};
  vvInfoRijen(m, lz).forEach(r => { vvSt.aan['i_' + r.key] = !r.oud; });
  vvSt.aan.selectie = vvMagSelectie(m) && (lz.onzeSpelers || []).length > 0;
  vvSt.aan.uitslag = vvMagUitslag(m) && lz.gespeeld && lz.scoreOns != null && lz.scoreZij != null;
  vvSt.aan.kaarten = vvMagUitslag(m) && vvKaartRijen(lz).length > 0;
  // De wissels en de speelminuten zitten onder ÉÉN vinkje, en dat is geen luiheid: het een kan niet
  // zonder het ander. Wissels zonder klok zouden allemaal op minuut 1 staan en de berekening van de
  // speeltijd bederven; minuten zonder wissels zouden elke basisspeler de volle wedstrijd geven en de
  // bank nul. Ze horen samen aan of samen uit.
  vvSt.aan.minuten = vvSt.aan.uitslag && vvKanMinuten(lz);
}
function vvZet(key, aan) {
  if (!vvSt) return;
  vvSt.aan[key] = !!aan;
  // De klok komt mee MET de uitslag. Zet je de uitslag uit, dan zou er een klok op een wedstrijd komen
  // waarvan de doelpunten nog op "geen tijd" staan — die zouden dan allemaal als minuut 1 lezen.
  if (key === 'uitslag' && !vvSt.aan.uitslag) vvSt.aan.minuten = false;
  if (key === 'minuten' && vvSt.aan.minuten) vvSt.aan.uitslag = true;
  vvRender();
}

// Eén vinkregel. `class="chkrow"` is nodig: binnen een .fg maakt de app-stijl van een vinkje anders
// een leeg vierkant zonder vinkje (zie de valkuil in de projectnotities).
function vvChk(key, label, extra) {
  return `<label class="chkrow" style="display:flex;align-items:flex-start;gap:8px;padding:6px 0">
    <input type="checkbox" ${vvSt.aan[key] ? 'checked' : ''} onchange="vvZet('${key}', this.checked)">
    <span style="flex:1;min-width:0"><span style="font-weight:600">${label}</span>${extra ? `<br><span style="font-size:12px;color:var(--txt2)">${extra}</span>` : ''}</span>
  </label>`;
}

function vvVoorstelHtml() {
  const m = match, lz = vvSt.lezing;
  const roster = vvRoster();
  const magUitslag = vvMagUitslag(m);

  // --- hoort dit blad bij deze wedstrijd? ---
  const controles = [];
  if (lz.datum && m.date && lz.datum !== m.date) controles.push(`De pagina is van <b>${esc(lz.datum)}</b>, deze wedstrijd staat op <b>${esc(m.date)}</b>.`);
  if (lz.hunTeam && m.opponent && !vvNaamOverlap(lz.hunTeam, m.opponent)) controles.push(`Op de pagina staat <b>${esc(lz.hunTeam)}</b> als tegenstander, in de app <b>${esc(m.opponent)}</b>.`);
  if (!vvNaamOverlap(lz.onsTeam, tName(m))) controles.push(`De ploeg die we als de onze lezen (<b>${esc(lz.onsTeam)}</b>) lijkt niet op <b>${esc(tName(m))}</b>. Zet hieronder de juiste kant.`);

  // --- de gegevens ---
  const infoRijen = vvInfoRijen(m, lz);
  const infoHtml = infoRijen.length
    ? infoRijen.map(r => vvChk('i_' + r.key, `${esc(r.label)}: <b>${esc(r.nieuw)}</b>`,
        r.oud ? `staat nu op <b>${esc(r.oud)}</b> — vink aan om te vervangen` : 'staat nu leeg')).join('')
    : '<p style="font-size:13px;color:var(--txt2);margin:0">Alles wat de pagina hierover zegt, staat er al zo in.</p>';

  // --- de selectie ---
  const selHtml = (lz.onzeSpelers || []).map((s, i) => {
    const id = vvSt.koppel[i] || '';
    const rosterOpties = roster.map(r => `<option value="r:${esc(r.id)}" ${id === 'r:' + r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
    const zusterOpties = (vvSt.zusters || []).filter(t => (t.players || []).length).map(t =>
      `<optgroup label="${esc(t.name)}">${t.players.map(p => `<option value="r:${esc(p.id)}" ${id === 'r:' + p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>`).join('');
    // Wie al in de selectie van deze wedstrijd staat, hoort als keuze in de lijst te staan — anders
    // kan de keuzelijst niet tonen wat er gekozen is.
    const reeds = id.slice(0, 2) === 'w:' ? (m.players || []).find(p => p.id === id.slice(2)) : null;
    const reedsOptie = reeds ? `<option value="${esc(id)}" selected>${esc(reeds.name)} — staat al in de selectie</option>` : '';
    const losOptie = id.slice(0, 2) === 'l:' && vvSt.los[id.slice(2)] ? `<option value="${esc(id)}" selected>${esc(vvSt.los[id.slice(2)])} — losse speler</option>` : '';
    const zuster = id.slice(0, 2) === 'r:' ? vvRosterSpeler(id.slice(2)) : null;
    const merk = [];
    if (s.nummer) merk.push(`<span style="font-size:11px;color:var(--txt2);margin-left:6px">#${esc(s.nummer)}</span>`);
    if (lz.kentBasis) merk.push(s.basis
      ? '<span style="font-size:11px;font-weight:700;color:var(--grn);margin-left:6px">BASIS</span>'
      : '<span style="font-size:11px;font-weight:700;color:var(--txt2);margin-left:6px">BANK</span>');
    if (s.kapitein) merk.push('<span style="font-size:11px;color:var(--org);margin-left:6px">kapitein</span>');
    if (s.doelpunten) merk.push(`<span style="font-size:11px;color:var(--txt2);margin-left:6px">${s.doelpunten}×${icI(IC.ball)}</span>`);
    if (reeds) merk.push('<span style="font-size:11px;color:var(--txt2);margin-left:6px">al in de selectie</span>');
    else if (zuster && zuster.t) merk.push(`<span style="font-size:11px;color:var(--org);margin-left:6px">gast · ${esc(zuster.t.name)}</span>`);
    else if (losOptie) merk.push('<span style="font-size:11px;color:var(--org);margin-left:6px">losse speler</span>');
    return `<div class="stat-row" style="align-items:center;gap:8px">
      <span style="flex:1;min-width:0"><span style="font-weight:600">${esc(s.naam)}</span>${merk.join('')}</span>
      <select onchange="vvZetKoppel(${i}, this.value)" style="max-width:52%;font-size:13px;padding:5px 6px">
        <option value="">— niet meenemen —</option>${reedsOptie}${rosterOpties}${zusterOpties}${losOptie}
        <option value="__los__">+ als losse speler toevoegen</option>
      </select>
    </div>`;
  }).join('');
  const telling = vvTelSelectie();

  // --- de uitslag ---
  const scorers = (lz.onzeSpelers || []).filter(s => s.doelpunten);
  const scorersTxt = scorers.length
    ? `${scorers.map(s => `${esc(s.naam)}${s.doelpunten > 1 ? ' (' + s.doelpunten + ')' : ''}`).join(' · ')} — de wedstrijd komt op <b>gespeeld</b> te staan.`
    : 'Er staan géén doelpuntenmakers op de pagina: de doelpunten komen zonder naam binnen. De wedstrijd komt op <b>gespeeld</b> te staan.';
  const uitslagTekst = (lz.scoreOns == null || lz.scoreZij == null)
    ? ''
    : (lz.thuis ? `${lz.scoreOns} - ${lz.scoreZij}` : `${lz.scoreZij} - ${lz.scoreOns}`);

  // --- de kaarten ---
  const kaarten = vvKaartRijen(lz);
  const kaartTxt = kaarten.map(k => `${k.ons ? esc(k.naam) : 'tegenstander' + (k.nummer ? ' nr. ' + esc(k.nummer) : '')} — ${vvKaartWoord(k.soort)}${k.minuut ? " (" + k.minuut + "')" : ''}`).join('<br>');

  // --- de wissels en de speelminuten ---
  const wisselRijen = vvWisselRijen(lz);
  const kanMinuten = vvKanMinuten(lz);
  const klok = kanMinuten ? vvKlokPlan(m, lz) : null;
  const wisselTxt = wisselRijen
    .map(w => `${w.minuut}' ${w.soort === 'in' ? 'in' : 'uit'}: ${esc(w.naam)}`)
    .join('<br>');
  // Hoeveel van die wissels kunnen we echt gebruiken? Een naam die nog niet aan een speler gekoppeld
  // is, heeft niemand om de wissel aan te hangen — net zoals bij de kaarten.
  const wisselsGekoppeld = wisselRijen.filter(w => vvSt.koppel[w.idx]).length;

  // --- wat we niet konden ---
  const waar = [];
  // GEEN SPELERS = MEESTAL GEEN VERWERKT BLAD (Tim, 30-08-2026). De opstellingen verschijnen op die
  // pagina pas wanneer de bond het officiële wedstrijdblad verwerkt heeft. Kom je er te vroeg, dan
  // krijg je een pagina die klopt maar leeg is — en dat leest als "de app doet het niet". Daarom hier
  // met zoveel woorden, als eerste regel, mét de tweede mogelijke reden erbij.
  if (!(lz.onzeSpelers || []).length) waar.push('Er staan <b>geen spelers</b> van onze ploeg op deze pagina. Meestal betekent dat dat het officiële wedstrijdblad nog niet verwerkt is — probeer het dan later opnieuw. Bij de jongste reeksen wordt er sowieso geen blad ingevuld; daar vul je de wedstrijd zelf in.');
  if (!lz.gespeeld) waar.push(`Volgens de pagina is deze wedstrijd <b>nog niet afgelopen</b> (${esc(lz.state || 'onbekend')}). De uitslag halen we dan niet op.`);
  if (!lz.kentBasis && (lz.onzeSpelers || []).length) waar.push('Op deze pagina staat niet wie er begon en wie op de bank zat — iedereen komt gewoon in de selectie. Wie start, duid je zelf aan bij de opstelling.');
  if (lz.strafschoppen) waar.push('Deze wedstrijd werd beslist na <b>strafschoppen</b>. Die reeks nemen we niet over — geef ze zelf in, dan telt ze mee voor winst of verlies.');
  if (!magUitslag && getGameTimeMs(m) > 0) waar.push('Deze wedstrijd is <b>live gevolgd</b>: de uitslag en de kaarten die je toen ingaf zijn de waarheid, dus die laten we ongemoeid. Enkel de gegevens en de selectie kan je hier aanvullen.');
  if (!magUitslag && m.tournamentId) waar.push('Bij een <b>tornooiwedstrijd</b> hoort de uitslag bij de dagstand van het tornooi; die geef je daar in.');
  if (kaarten.some(k => k.soort === 'rood2')) waar.push('Een uitsluiting na twee gele kaarten wordt hier één <b>rode kaart</b>: de app kent geen apart soort daarvoor.');
  if (kaarten.some(k => !k.ons && !k.nummer)) waar.push('Van een kaart voor de tegenstander bewaart de app enkel het rugnummer, en dat staat er niet bij elke speler bij.');
  // EEN BLAD MET ENKEL EEN UITSLAG. Bij een vriendschappelijke wedstrijd zet de club één lijst namen
  // op het blad en verder niets — geen bank, geen doelpuntenmaker, geen kaart, geen wissel (gemeten
  // 31-08-2026 op twee vriendschappelijke U14-wedstrijden: 0 gebeurtenissen op 32 en 34 spelers, ook
  // al eindigde de ene 7-5). Zonder deze regel zoek je waarom je vijf doelpunten nergens staan.
  if (lz.gespeeld && (lz.onzeSpelers || []).length && !kaarten.length && !wisselRijen.length
      && !(lz.onzeSpelers || []).some(s => s.doelpunten || s.eigenDoelpunten)) {
    waar.push(`Op dit blad staat <b>alleen de uitslag</b>: geen doelpuntenmakers, geen kaarten, geen wissels.${lz.soort === 'Vriendschappelijk' ? ' Bij een vriendschappelijke wedstrijd houdt de bond enkel de namen en de uitslag bij — er is niets meer om over te nemen.' : ' Meestal betekent dat dat het blad niet volledig ingevuld is.'}`);
  }
  // Wissels op het blad, maar de app kan er geen klok op leggen. Zeg dan WAT er ontbreekt in plaats van
  // "we nemen ze niet over" — dat las als "die informatie bestaat niet".
  if (wisselRijen.length && !kanMinuten) {
    waar.push(`Er staan <b>${wisselRijen.length}</b> wisselmomenten op de pagina, maar ${!lz.kentBasis ? 'het blad zegt niet wie begon en wie op de bank zat' : 'de wedstrijd staat nog niet als afgelopen'}. Zonder dat kan de app geen speeltijd berekenen, dus laten we de wissels én de speelminuten liggen.`);
  }
  if (kanMinuten && wisselsGekoppeld < wisselRijen.length) {
    waar.push(`Van de <b>${wisselRijen.length}</b> wisselmomenten kunnen we er <b>${wisselsGekoppeld}</b> gebruiken: de rest hangt aan een naam die hieronder nog niet gekoppeld is. Dat maakt de speelminuten van die spelers onvolledig.`);
  }
  if (m.klokVanBlad) waar.push('De speelminuten die nu op deze wedstrijd staan, komen van een eerdere ophaalbeurt van dit blad. Neem je opnieuw over, dan worden ze vervangen — niet verdubbeld.');
  const nietGekoppeld = (lz.onzeSpelers || []).filter((s, i) => !vvSt.koppel[i]).length;
  if (nietGekoppeld) waar.push(`<b>${nietGekoppeld}</b> ${nietGekoppeld === 1 ? 'naam van de pagina is' : 'namen van de pagina zijn'} nog niet gekoppeld. ${nietGekoppeld === 1 ? 'Die blijft' : 'Die blijven'} weg uit de selectie — kies de juiste speler, of <b>+ als losse speler toevoegen</b> voor wie niet in je kern staat.`);
  const absent = vvGekoppeldeAbsenten();
  if (absent.length) waar.push(`${absent.length === 1 ? 'Eén speler staat' : absent.length + ' spelers staan'} in deze wedstrijd als <b>niet beschikbaar</b> (${absent.map(esc).join(', ')}), maar ${absent.length === 1 ? 'staat' : 'staan'} wel op de pagina. Neem je ${absent.length === 1 ? 'hem' : 'ze'} mee, dan ${absent.length === 1 ? 'verdwijnt' : 'verdwijnen'} die vermelding.`);

  const ietsAan = Object.keys(vvSt.aan).some(k => vvSt.aan[k]);

  return `
    <div class="card" style="border-left:4px solid var(--org)">
      <p style="font-size:13px;color:var(--txt2);margin:0">${icI(IC.warn)} <b>Demo-functie.</b> Kijk hieronder na of alles klopt vóór je overneemt — vooral de koppeling van de namen. Er wordt niets bewaard tot je onderaan op <b>Overnemen</b> tikt.</p>
    </div>
    ${controles.length ? `<div class="card" style="border-left:4px solid var(--org)">
      <div style="font-weight:700;margin-bottom:6px">${icI(IC.warn)} Hoort deze pagina bij deze wedstrijd?</div>
      ${controles.map(c => `<p style="font-size:13px;color:var(--txt2);margin:0 0 4px">${c}</p>`).join('')}
    </div>` : ''}

    <div class="sec">De wedstrijd op de pagina</div>
    <div class="card">
      <div class="stat-row"><span style="color:var(--txt2);min-width:110px">Wedstrijd</span><span style="font-weight:600">${esc(lz.onsTeam || '—')} – ${esc(lz.hunTeam || '—')}</span></div>
      <div class="stat-row"><span style="color:var(--txt2);min-width:110px">Wanneer</span><span style="font-weight:600">${esc(lz.datum || '—')}${lz.tijd ? ' · ' + esc(lz.tijd) : ''}</span></div>
      <div class="stat-row"><span style="color:var(--txt2);min-width:110px">Reeks</span><span style="font-weight:600">${esc(lz.reeks || '—')}${lz.soort ? ' · ' + esc(lz.soort) : ''}</span></div>
      ${lz.stad ? `<div class="stat-row"><span style="color:var(--txt2);min-width:110px">Adres</span><span style="font-weight:600">${esc(lz.stad)}</span></div>` : ''}
      <div class="fg" style="margin:12px 0 0"><label>Welke ploeg zijn wij?</label>
        <div class="tgl">
          <button type="button" class="${vvSt.wij === 'home' ? 'act' : ''}" onclick="vvZetKant('home')">${esc((vvSt.ruw.homeTeam || {}).name || 'Thuisploeg')}</button>
          <button type="button" class="${vvSt.wij === 'away' ? 'act' : ''}" onclick="vvZetKant('away')">${esc((vvSt.ruw.awayTeam || {}).name || 'Bezoekers')}</button>
        </div></div>
    </div>

    <div class="sec">Wedstrijdgegevens</div>
    <div class="card">${infoHtml}</div>

    <div class="sec">Selectie${((lz.onzeSpelers || []).length && vvMagSelectie(m)) ? ` (${telling.nieuw} nieuw, ${telling.reeds} stond er al)` : ''}</div>
    <div class="card">
      ${!(lz.onzeSpelers || []).length
        ? '<p style="font-size:13px;color:var(--txt2);margin:0">Er staat geen enkele speler van onze ploeg op deze pagina.</p>'
        : !vvMagSelectie(m)
          ? '<p style="font-size:13px;color:var(--txt2);margin:0">Bij een <b>tornooiwedstrijd</b> komt de selectie van de tornooidag en geldt ze voor alle wedstrijden van die dag. Die pas je aan op de tornooipagina, niet hier.</p>'
          : `${vvChk('selectie', 'De selectie aanvullen', 'Enkel toevoegen — er wordt niemand uit je selectie gehaald.')}
      <p style="font-size:13px;color:var(--txt2);margin:6px 0 8px">Links staat de naam van de pagina, rechts wie dat is in jouw kern.</p>
      ${selHtml}`}
    </div>

    <div class="sec">Uitslag</div>
    <div class="card">
      ${(magUitslag && lz.gespeeld && uitslagTekst) ? `${vvChk('uitslag', `Uitslag <b>${esc(uitslagTekst)}</b> overnemen`, scorersTxt)}
      <p style="font-size:12px;color:var(--txt2);margin:8px 0 0">${icI(IC.timer)} ${kanMinuten
        ? 'De doelpunten en de kaarten komen op <b>de minuut van het blad</b> te staan. Zie hieronder bij de speelminuten.'
        : 'Er komen <b>geen speelminuten</b> bij: niemand volgde de klok en het blad geeft er geen. De selectie, de doelpunten en de assists tellen wél mee.'}</p>`
      : `<p style="font-size:13px;color:var(--txt2);margin:0">${magUitslag ? 'Er staat nog geen uitslag op de pagina.' : 'De uitslag van deze wedstrijd halen we hier niet op — zie hieronder.'}</p>`}
    </div>

    ${kaarten.length ? `<div class="sec">Kaarten</div>
    <div class="card">
      ${magUitslag ? vvChk('kaarten', `${kaarten.length} kaart${kaarten.length === 1 ? '' : 'en'} overnemen`, kaartTxt)
        : `<p style="font-size:13px;color:var(--txt2);margin:0">${kaartTxt}</p><p style="font-size:12px;color:var(--txt2);margin:8px 0 0">Deze nemen we niet over — zie hieronder.</p>`}
    </div>` : ''}

    ${wisselRijen.length ? `<div class="sec">Wissels en speelminuten</div>
    <div class="card">
      ${(magUitslag && kanMinuten) ? `${vvChk('minuten', `${wisselRijen.length} wissel${wisselRijen.length === 1 ? '' : 's'} en de speelminuten overnemen`,
          `De app zet de wedstrijd op <b>${klok.blokken.length} × ${esc(String(m.quarterDuration || 25))} min</b>${klok.totaalMin > klok.blokken.length * (Number(m.quarterDuration) || 25) ? ` (met ${klok.totaalMin} min tot de laatste gebeurtenis op het blad)` : ''} en rekent daarop wie hoe lang speelde.`)}
      <p style="font-size:13px;color:var(--txt2);margin:6px 0 8px">${wisselTxt}</p>
      <p style="font-size:12px;color:var(--txt2);margin:0">${icI(IC.warn)} Het blad zegt niet <b>wie voor wie</b> inviel — bij een dubbele wissel op dezelfde minuut valt dat niet op te maken. Elke wissel komt daarom als los moment binnen: "eraf" en "erbij". Voor de speelminuten maakt dat geen verschil.</p>
      <p style="font-size:12px;color:var(--txt2);margin:8px 0 0">${icI(IC.timer)} Deze minuten komen van het <b>officiële wedstrijdblad van de bond</b>, niet van iemand die de klok volgde. Ze tellen mee in de statistieken, en je kan ze nadien gewoon aanpassen.</p>`
        : `<p style="font-size:13px;color:var(--txt2);margin:0 0 6px">${wisselTxt}</p>
      <p style="font-size:12px;color:var(--txt2);margin:0">Deze nemen we niet over — zie hieronder waarom.</p>`}
    </div>` : ''}

    ${waar.length ? `<div class="card" style="border-left:4px solid var(--org)">
      <div style="font-weight:700;margin-bottom:6px">${icI(IC.warn)} Even nakijken</div>
      ${waar.map(w => `<p style="font-size:13px;color:var(--txt2);margin:0 0 6px">${w}</p>`).join('')}
    </div>` : ''}

    <button class="btn btn-green" ${ietsAan ? 'onclick="vvOvernemen()"' : 'disabled style="opacity:.5"'}>${icI(IC.check)} Overnemen</button>
    <button class="btn btn-pale" style="margin-top:8px" onclick="vvOpnieuw()">Een andere wedstrijd ophalen</button>
    <p style="font-size:12px;color:var(--txt2);margin-top:10px;text-align:center">Na het overnemen kan je alles gewoon aanpassen, zoals bij elke andere wedstrijd.</p>`;
}

// Hoeveel spelers komen erbij, en hoeveel stonden er al? Voor het opschrift boven de lijst.
function vvTelSelectie() {
  let nieuw = 0, reeds = 0;
  Object.values(vvSt.koppel || {}).forEach(v => {
    if (!v) return;
    if (v.slice(0, 2) === 'w:') { reeds++; return; }
    if (v.slice(0, 2) === 'r:' && vvReedsInSelectie('', v.slice(2))) { reeds++; return; }
    nieuw++;
  });
  return { nieuw, reeds };
}
// Namen die je meeneemt terwijl ze in deze wedstrijd als niet-beschikbaar staan.
function vvGekoppeldeAbsenten() {
  const uit = [];
  (match.absentPlayers || []).forEach(a => {
    const raak = Object.values(vvSt.koppel || {}).some(v => v && v.slice(0, 2) === 'r:' && a.rosterId && a.rosterId === v.slice(2));
    if (raak) uit.push(a.name || 'Speler');
  });
  return uit;
}

// ---------------------------------------------------------------------------------------------
// 6. OVERNEMEN
// ---------------------------------------------------------------------------------------------
// Alles gebeurt op de wedstrijd zelf en wordt in één keer bewaard. De volgorde telt: eerst de
// spelers (de events hieronder verwijzen naar hun id), dan de uitslag, dan de kaarten.

// De events die een vorige ophaalbeurt hier zette, weghalen vóór we opnieuw schrijven — anders staan
// ze twee keer. Een gewist event MOET een tombstone krijgen, anders duwt een ander toestel met een
// oude kopie ze via de cloudsync gewoon terug (zie de projectnotities).
function vvWisEigenEvents(m, soorten) {
  (m.events || []).filter(e => e.bron === 'vv' && soorten.includes(e.type)).forEach(e => {
    if (typeof tombstoneEvent === 'function') tombstoneEvent(m, e.id);
  });
  m.events = (m.events || []).filter(e => !(e.bron === 'vv' && soorten.includes(e.type)));
}
const VV_DOELPUNT_TYPES = ['goal_us', 'goal_them', 'own_goal', 'own_goal_them'];
const VV_KAART_TYPES = ['yellow_card', 'red_card', 'yellow_card_them', 'red_card_them'];
// Enkel wissels die híer vandaan komen (vvWisEigenEvents kijkt op `bron === 'vv'`). Een wissel die
// iemand zelf ingaf, blijft staan — die is niet van ons om weg te gooien.
const VV_WISSEL_TYPES = ['substitution'];

async function vvOvernemen() {
  if (!vvSt || !match) return;
  if (!canManage()) { showToast('Enkel een beheerder met verbinding kan dit bewaren.', 'err'); return; }
  const m = match, lz = vvSt.lezing;
  const gedaan = [];

  // --- 1. de wedstrijdgegevens ---
  const infoRijen = vvInfoRijen(m, lz).filter(r => vvSt.aan['i_' + r.key]);
  infoRijen.forEach(r => { m[r.key] = r.nieuw; });
  if (infoRijen.length) gedaan.push(`${infoRijen.length} gegeven${infoRijen.length === 1 ? '' : 's'}`);

  // --- 2. de selectie ---
  // Per naam van de pagina: het speler-id in DEZE wedstrijd. Dat hebben we verderop nodig om de
  // doelpunten en de kaarten op de juiste speler te zetten.
  const spelerIdVan = {};
  let toegevoegd = 0;
  if (vvSt.aan.selectie && vvMagSelectie(m)) {
    // Basis en bank enkel overnemen wanneer de pagina het onderscheid maakt ÉN er nog geen selectie
    // stond. Zit er al een selectie (en dus misschien een opstelling), dan komt iedereen op de bank:
    // een basisspeler zonder plaats zou anders in het velddiagram opduiken op een plek die niemand
    // gekozen heeft.
    const magBasis = lz.kentBasis && !heeftSelectie(m);
    (lz.onzeSpelers || []).forEach((s, i) => {
      const keuze = vvSt.koppel[i] || '';
      if (!keuze) return;
      const soort = keuze.slice(0, 2), id = keuze.slice(2);
      if (soort === 'w:') { spelerIdVan[i] = id; return; }
      if (soort === 'r:') {
        const bestaand = (m.players || []).find(p => p.rosterId && p.rosterId === id);
        if (bestaand) { spelerIdVan[i] = bestaand.id; return; }
        const bron = vvRosterSpeler(id);
        if (!bron) return;
        const p = bron.p, gast = !!bron.t;
        const nieuw = {
          id: uid(), rosterId: p.id, globalId: p.globalId || null,
          name: p.name || s.naam, number: p.number || s.nummer || '',
          line: posLine(p.pos) || 'Middenveld', posNum: '',
          starting: !!(magBasis && s.basis), onField: !!(magBasis && s.basis),
          guest: gast, fromName: gast ? bron.t.name : '',
        };
        m.players = (m.players || []).concat([nieuw]);
        spelerIdVan[i] = nieuw.id;
        toegevoegd++;
        // Hij stond als niet-beschikbaar maar speelde wel mee: die vermelding klopt dan niet meer.
        m.absentPlayers = (m.absentPlayers || []).filter(a => !(a.rosterId && a.rosterId === p.id));
        return;
      }
      if (soort === 'l:') {
        const naam = vvSt.los[id] || s.naam;
        const bestaand = (m.players || []).find(p => vvZelfde(p.name, naam));
        if (bestaand) { spelerIdVan[i] = bestaand.id; return; }
        const nieuw = {
          id: uid(), rosterId: id, globalId: null, name: naam, number: s.nummer || '',
          line: 'Middenveld', posNum: '',
          starting: !!(magBasis && s.basis), onField: !!(magBasis && s.basis),
          guest: true, fromName: 'Losse speler',
        };
        m.players = (m.players || []).concat([nieuw]);
        spelerIdVan[i] = nieuw.id;
        toegevoegd++;
      }
    });
    // De kapitein van het blad, enkel wanneer er nog geen aangeduid is.
    if (!m.captainId) {
      const kapIdx = (lz.onzeSpelers || []).findIndex(s => s.kapitein);
      if (kapIdx >= 0 && spelerIdVan[kapIdx]) m.captainId = spelerIdVan[kapIdx];
    }
    if (toegevoegd) gedaan.push(`${toegevoegd} speler${toegevoegd === 1 ? '' : 's'}`);
  } else {
    // De selectie niet aanvullen, maar wie er al in staat mag wél zijn doelpunten en kaarten krijgen.
    (lz.onzeSpelers || []).forEach((s, i) => {
      const keuze = vvSt.koppel[i] || '';
      if (keuze.slice(0, 2) === 'w:') spelerIdVan[i] = keuze.slice(2);
      else if (keuze.slice(0, 2) === 'r:') {
        const bestaand = (m.players || []).find(p => p.rosterId && p.rosterId === keuze.slice(2));
        if (bestaand) spelerIdVan[i] = bestaand.id;
      }
    });
  }

  // --- 3. de klok van het blad ---
  // MOET VÓÓR DE DOELPUNTEN EN DE KAARTEN STAAN: die krijgen hun blok uit deze klok.
  // De klok komt mee met de uitslag, nooit los. Zou ze los kunnen, dan kwam er tijd op een wedstrijd
  // waarvan de doelpunten nog op nul staan, en die zouden dan allemaal als minuut 1 lezen.
  const doetUitslag = vvSt.aan.uitslag && vvMagUitslag(m) && lz.scoreOns != null && lz.scoreZij != null;
  const metKlok = doetUitslag && !!vvSt.aan.minuten && vvKanMinuten(lz);
  const klok = metKlok ? vvKlokPlan(m, lz) : null;
  if (metKlok) vvZetKlok(m, klok);
  // Neemt hij de uitslag opnieuw over zónder de minuten, dan moet de klok van een vorige beurt weg:
  // anders blijven er speelminuten staan die bij doelpunten van minuut 1 horen.
  else if (doetUitslag && m.klokVanBlad) { m.quarters = []; m.currentQuarter = 0; delete m.klokVanBlad; }
  // ONZE WISSELS HOREN BIJ ONZE KLOK. Komt er geen klok, dan mogen de wissels van een vorige beurt
  // niet blijven staan: dan hangen er wissels op 75' aan een wedstrijd zonder speeltijd, en gaan drie
  // spelers volgens recomputeOnField van het veld terwijl er nul minuten gerekend worden. Gemeten
  // 31-08-2026: zonder deze regel bleven er 8 wissels achter na het uitvinken van de minuten.
  if (doetUitslag) vvWisEigenEvents(m, VV_WISSEL_TYPES);
  // De minuut van het blad als tijdstip voor een event — leeg wanneer er geen klok is, en dan blijft
  // het `gameTimeMs: 0` van hieronder gewoon staan, precies zoals vóór v1.28.0.
  const tijd = minuut => {
    if (!metKlok || !(Number(minuut) > 0)) return {};
    const gms = vvGameMs(minuut);
    return { gameTimeMs: gms, quarterNum: vvKwartVan(klok, gms) };
  };

  // --- 4. de uitslag ---
  // Zelfde vorm als "Uitslag ingeven" (saveQuickResult): doelpunten met het merkje `quick`, zodat een
  // latere correctie langs dat venster ze netjes vervangt. Sinds v1.28.0 mét de minuut van het blad,
  // als er een klok is.
  if (doetUitslag) {
    vvWisEigenEvents(m, VV_DOELPUNT_TYPES);
    // Een eerdere snelinvoer wijkt voor deze — zoals saveQuickResult dat ook doet. Mét tombstone,
    // anders duwt een ander toestel ze via de cloudsync terug.
    (m.events || []).filter(e => e.quick).forEach(e => { if (typeof tombstoneEvent === 'function') tombstoneEvent(m, e.id); });
    m.events = (m.events || []).filter(e => !e.quick);
    const evt = (type, extra) => ({ id: uid(), realTime: Date.now(), gameTimeMs: 0, quarterNum: null, type, quick: true, bron: 'vv', ...(extra || {}) });
    let onsGeteld = 0, zijGeteld = 0;
    // Wat we van de pagina wéten: wie scoorde, en wie in eigen doel trapte. Een eigen doelpunt van
    // ons telt voor hen, en omgekeerd — vandaar de twee soorten.
    // PER DOELPUNT, NIET PER SPELER: alleen zo houdt elk doelpunt zijn eigen minuut. Wie twee keer
    // scoorde in de 12e en de 78e, had anders twee doelpunten op hetzelfde moment gekregen.
    (lz.onzeSpelers || []).forEach((s, i) => {
      (s.soorten || []).forEach(x => {
        if (x.soort === 'doelpunt' && onsGeteld < lz.scoreOns) { m.events.push(evt('goal_us', { playerId: spelerIdVan[i] || null, assistId: null, ...tijd(x.minuut) })); onsGeteld++; }
        else if (x.soort === 'eigendoelpunt' && zijGeteld < lz.scoreZij) { m.events.push(evt('own_goal', { playerId: spelerIdVan[i] || null, ...tijd(x.minuut) })); zijGeteld++; }
      });
    });
    (lz.hunSpelers || []).forEach(s => {
      (s.soorten || []).forEach(x => {
        if (x.soort === 'eigendoelpunt' && onsGeteld < lz.scoreOns) { m.events.push(evt('own_goal_them', tijd(x.minuut))); onsGeteld++; }
      });
    });
    // De rest zonder naam erbij, tot de eindstand klopt — precies zoals bij "Uitslag ingeven". Zonder
    // minuut: van deze doelpunten weten we alleen dát ze gevallen zijn.
    for (let k = onsGeteld; k < lz.scoreOns; k++) m.events.push(evt('goal_us', { playerId: null, assistId: null }));
    // De doelpunten van de tegenstander bewaart de app zonder naam — die van een tegenspeler kent ze
    // niet. Hun minuten staan wél op het blad, en die zijn wat de tijdlijn en de stand-bij-elk-doelpunt
    // bruikbaar maakt: zonder hen zou de tussenstand bij ons derde doelpunt niets zeggen.
    const hunMinuten = (lz.hunSpelers || [])
      .flatMap(s => (s.soorten || []).filter(x => x.soort === 'doelpunt').map(x => Number(x.minuut)))
      .filter(n => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
    for (let k = zijGeteld, j = 0; k < lz.scoreZij; k++, j++) m.events.push(evt('goal_them', tijd(hunMinuten[j])));
    delete m.geenUitslag;
    if (typeof _wisPlanMinuten === 'function') _wisPlanMinuten(m);
    m.status = 'done'; m.quarterStatus = 'done';
    gedaan.push('de uitslag');
  }

  // --- 5. de kaarten ---
  if (vvSt.aan.kaarten && vvMagUitslag(m)) {
    vvWisEigenEvents(m, VV_KAART_TYPES);
    let n = 0;
    vvKaartRijen(lz).forEach(k => {
      const rood = k.soort !== 'geel';
      if (k.ons) {
        const pid = spelerIdVan[k.idx];
        if (!pid) return;   // niet gekoppeld: dan is er geen speler om de kaart aan te hangen
        m.events.push({ id: uid(), realTime: Date.now(), gameTimeMs: 0, quarterNum: null, type: rood ? 'red_card' : 'yellow_card', playerId: pid, bron: 'vv', ...tijd(k.minuut) });
      } else {
        const nr = String(k.nummer || '').replace(/\D/g, '').slice(0, 3);
        m.events.push({ id: uid(), realTime: Date.now(), gameTimeMs: 0, quarterNum: null, type: rood ? 'red_card_them' : 'yellow_card_them', ...(nr ? { oppNumber: nr } : {}), bron: 'vv', ...tijd(k.minuut) });
      }
      n++;
    });
    if (n) gedaan.push(`${n} kaart${n === 1 ? '' : 'en'}`);
  }

  // --- 6. de wissels, en daarmee de speelminuten ---
  // ELKE WISSEL ALS LOS MOMENT. Het blad zegt niet wie voor wie inviel, en dat hoeft ook niet:
  // calcMinutes kent de eenzijdige wissel (playerInId óf playerOutId mag null zijn). Wie eraf gaat op
  // 85' heeft 85 minuten gespeeld, wie erbij komt op 75' speelt van dan tot het einde — daar komt geen
  // paar aan te pas. Zie de uitleg bovenaan dit bestand.
  //
  // De klok staat hierboven al op de wedstrijd; deze events hangen eraan. Zonder klok komen ze er niet
  // in: een wissel op minuut 1 zou de speeltijd van iedereen bederven.
  if (metKlok) {
    let n = 0;
    vvWisselRijen(lz).forEach(w => {
      const pid = spelerIdVan[w.idx];
      if (!pid) return;   // niet gekoppeld: geen speler om de wissel aan te hangen (het voorstelscherm waarschuwt daarvoor)
      const gms = vvGameMs(w.minuut);
      m.events.push({
        id: uid(), realTime: Date.now(), gameTimeMs: gms, quarterNum: vvKwartVan(klok, gms),
        type: 'substitution',
        playerInId: w.soort === 'in' ? pid : null,
        playerOutId: w.soort === 'uit' ? pid : null,
        bron: 'vv',
      });
      n++;
    });
    if (n) gedaan.push(`${n} wissel${n === 1 ? '' : 's'} met de speelminuten`);
  }

  // HET WEDSTRIJDNUMMER ONTHOUDEN. Heb je het hier met de hand geplakt, dan staat het vanaf nu op de
  // wedstrijd — net zoals bij een wedstrijd die uit de kalender van de bond ingelezen werd. Dat
  // scheelt vooral bij een tweede poging: de bond verwerkt het wedstrijdblad niet meteen na het
  // laatste fluitsignaal, dus kom je hier vaak twee keer.
  const nrGebruikt = vvNummerUit(vvSt.link);
  if (nrGebruikt && String(m.rbfaMatchId || '') !== String(nrGebruikt)) m.rbfaMatchId = String(nrGebruikt);

  recomputeScore(m);
  recomputeOnField(m);
  await dbSave(m);
  vvSt = null;
  await go(m.status === 'done' ? 'detail' : 'prep', m.id);
  showToast(gedaan.length ? `Overgenomen: ${gedaan.join(', ')}.` : 'Er was niets aangevinkt om over te nemen.', gedaan.length ? 'ok' : 'err');
}

// ---------------------------------------------------------------------------------------------
// 7. BIJ DE BOND NAKIJKEN WAT ER KLAARSTAAT (Tim, 31-08-2026)
// ---------------------------------------------------------------------------------------------
// De bond verwerkt een wedstrijdblad niet meteen na het laatste fluitsignaal, soms pas dagen later.
// Wie er te vroeg was, kreeg een leeg voorstel en moest zelf onthouden om het later opnieuw te
// proberen — per wedstrijd, met de hand. Deze knop doet dat onthouden: hij loopt de niet-afgesloten
// wedstrijden van deze ploeg af en vraagt per stuk of er intussen iets klaarstaat.
//
// HIJ ZOEKT, HIJ WERKT NIET BIJ, en dat is een bewuste grens. Het gevoelige stuk van het overnemen is
// de koppeling van de namen: de bond schrijft "Lars Aloïs Van Laere" waar de kern "Lars Van Laere"
// heeft, en een gastspeler of een naam die niet in de kern staat vraagt een keuze. Dat automatisch
// doen over vijf wedstrijden tegelijk is precies hoe je stil de verkeerde speler in een verslag
// krijgt. Dus: de scan vindt ze, en je gaat per wedstrijd naar het bestaande voorstelscherm.
//
// EEN BONDSNUMMER IS NODIG. Zonder `m.rbfaMatchId` weet de app niet welke wedstrijd bij de bond hoort.
// Dat nummer komt van de kalenderimport; staat het er niet, dan zegt de uitkomst hoe je het erbij zet
// (zie impEnkelNummers in import-cal.js).
const VV_SCAN_MAX = 20;

let vvScanSt = null;   // { fase, totaal, gedaan, items, zonderNummer, overgeslagen, fout }

// Hoort deze wedstrijd bij de ploeg die je nu bekijkt? Dezelfde maatstaf als de wedstrijdenlijst zelf
// (zie loadMatches in views-account.js: in de cloud staat homeFilter op de actieve ploeg). Nodig omdat
// dbAll() élke wedstrijd op dit toestel geeft, ook die van een ploeg die hier ooit geopend is.
function vvScanEigenPloeg(m) {
  return homeFilter === 'all' || (m && (m.teamName || '') === homeFilter);
}
// Mag de uitslag van deze wedstrijd aangevuld worden? Zelfde vraag als vvMagUitslag, maar zonder te
// vertrouwen op `m.quarters`: Firebase bewaart geen lege lijst, dus een geplande wedstrijd kan uit de
// cloud terugkomen zónder dat veld — en getGameTimeMs loopt daar stuk op zijn for-of.
function vvScanMagAangevuld(m) {
  if (!m || m.tournamentId) return false;
  if (m.klokVanBlad) return true;
  return getGameTimeMs({ quarters: Array.isArray(m.quarters) ? m.quarters : [] }) === 0;
}
// Het nakijken waard: ze ligt in het verleden en er staat nog geen uitslag op. Een wedstrijd die je
// afsloot met "geen uitslag" hoort er óók bij — daar valt juist iets te halen.
function vvScanTeVullen(m) {
  return !!m && !matchCancelled(m) && (matchNietAfgesloten(m) || (m.status === 'done' && geenUitslag(m)));
}
function vvScanKandidaten(alle) {
  return (alle || [])
    .filter(m => vvScanTeVullen(m) && vvScanEigenPloeg(m) && vvScanMagAangevuld(m) && m.rbfaMatchId)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}
// Staat de knop op het wedstrijdenscherm? Enkel wanneer er iets na te kijken valt — anders is het een
// knop die altijd "niets gevonden" antwoordt.
function vvScanZinvol(alle) {
  return canManage() && (alle || []).some(m => vvScanTeVullen(m) && vvScanEigenPloeg(m) && vvScanMagAangevuld(m) && m.rbfaMatchId);
}

async function vvScanStart() {
  if (!canManage()) { showToast('Enkel een beheerder met verbinding kan bij de bond nakijken.', 'err'); return; }
  let alle = [];
  try { alle = (await dbAll()).filter(Boolean); } catch (e) { alle = []; }
  const teVullen = alle.filter(m => vvScanTeVullen(m) && vvScanEigenPloeg(m));
  const kandidaten = vvScanKandidaten(alle);
  vvScanSt = {
    fase: 'bezig', totaal: Math.min(kandidaten.length, VV_SCAN_MAX), gedaan: 0, items: [], fout: '',
    // Zonder bondsnummer valt er niets te vragen. Dat aantal hoort in de uitkomst: het is het verschil
    // tussen "er is niets nieuws" en "ik heb het niet kunnen nakijken".
    zonderNummer: teVullen.filter(m => !m.rbfaMatchId).length,
    overgeslagen: Math.max(0, kandidaten.length - VV_SCAN_MAX),
  };
  vvScanRender();
  for (const m of kandidaten.slice(0, VV_SCAN_MAX)) {
    if (!vvScanSt) return;                       // venster gesloten: stoppen
    const rij = { id: m.id, datum: m.date || '', tegen: m.opponent || '?', nr: String(m.rbfaMatchId) };
    try {
      const d = await vvHaalOp(rij.nr);
      if (!d) rij.staat = 'onbekend';
      else {
        const lz = vvLees(d, vvGokKant(d, m));
        rij.spelers = (lz.onzeSpelers || []).length;
        rij.kaarten = vvKaartRijen(lz).length;
        rij.wissels = vvWisselRijen(lz).length;
        rij.doelpunten = (lz.onzeSpelers || []).reduce((n, s) => n + s.doelpunten + s.eigenDoelpunten, 0);
        rij.uitslag = (lz.scoreOns != null && lz.scoreZij != null)
          ? (lz.thuis ? `${lz.scoreOns} - ${lz.scoreZij}` : `${lz.scoreZij} - ${lz.scoreOns}`) : '';
        rij.staat = !lz.gespeeld ? 'nietgespeeld' : (rij.spelers ? 'klaar' : (rij.uitslag ? 'enkeluitslag' : 'wacht'));
      }
    } catch (e) {
      rij.staat = 'fout';
      rij.fout = (e && e.message) || 'Het ophalen is niet gelukt.';
      // EEN FOUT OP DE EERSTE WEDSTRIJD IS GEEN WEDSTRIJDPROBLEEM. Dan is de verbinding weg of de
      // dienst onbereikbaar, en negentien keer hetzelfde proberen levert negentien keer dezelfde rode
      // regel (en negentien nutteloze verzoeken). Eén keer stoppen met een duidelijke melding.
      if (!vvScanSt.gedaan) { vvScanSt.fout = rij.fout; vvScanSt.fase = 'klaar'; vvScanRender(); return; }
    }
    if (!vvScanSt) return;
    vvScanSt.items.push(rij);
    vvScanSt.gedaan++;
    vvScanRender();
  }
  if (!vvScanSt) return;
  vvScanSt.fase = 'klaar';
  vvScanRender();
}

function vvScanSluit() { vvScanSt = null; closeModal(); }

// Naar het voorstelscherm van één wedstrijd. `match` is een LEXICALE global (géén window-eigenschap),
// dus een gewone toewijzing — vvStart leest ze en zet vvSt op.
async function vvScanOpen(id) {
  const m = await dbGet(id);
  if (!m) { showToast('Die wedstrijd staat niet meer op dit toestel.', 'err'); return; }
  vvScanSt = null;
  closeModal();
  match = m;
  vvStart();
}

const VV_SCAN_TEKST = {
  klaar:        { kleur: 'var(--grn)',  label: 'Blad verwerkt' },
  enkeluitslag: { kleur: 'var(--org)',  label: 'Enkel de uitslag' },
  wacht:        { kleur: 'var(--txt2)', label: 'Blad nog niet verwerkt' },
  nietgespeeld: { kleur: 'var(--txt2)', label: 'Nog niet gespeeld volgens de bond' },
  onbekend:     { kleur: 'var(--rd)',   label: 'Dit nummer bestaat niet bij de bond' },
  fout:         { kleur: 'var(--rd)',   label: 'Niet kunnen nakijken' },
};

function vvScanRijHtml(r) {
  const t = VV_SCAN_TEKST[r.staat] || VV_SCAN_TEKST.fout;
  const dag = r.datum ? r.datum.split('-').reverse().slice(0, 2).join('/') : '?';
  const wat = [];
  if (r.uitslag) wat.push(`uitslag <b>${esc(r.uitslag)}</b>`);
  if (r.spelers) wat.push(`${r.spelers} spelers`);
  if (r.doelpunten) wat.push(`${r.doelpunten} doelpunt${r.doelpunten === 1 ? '' : 'en'} met naam`);
  if (r.kaarten) wat.push(`${r.kaarten} kaart${r.kaarten === 1 ? '' : 'en'}`);
  if (r.wissels) wat.push(`${r.wissels} wissel${r.wissels === 1 ? '' : 's'}`);
  const magOphalen = r.staat === 'klaar' || r.staat === 'enkeluitslag';
  return `<div class="card" style="text-align:left;margin-bottom:8px;border-left:4px solid ${t.kleur}">
    <div style="font-weight:700">${esc(r.tegen)} <span style="font-weight:400;color:var(--txt2)">· ${esc(dag)}</span></div>
    <div style="font-size:12px;font-weight:700;color:${t.kleur};margin:2px 0 4px">${esc(t.label)}</div>
    ${wat.length ? `<div style="font-size:13px;color:var(--txt2)">${wat.join(' · ')}</div>` : ''}
    ${r.fout ? `<div style="font-size:12px;color:var(--rd)">${esc(r.fout)}</div>` : ''}
    ${magOphalen ? `<button class="btn btn-green btn-sm" style="margin-top:8px" onclick="vvScanOpen('${esc(r.id)}')">${icI(IC.link)} Ophalen</button>` : ''}
  </div>`;
}

function vvScanRender() {
  if (!vvScanSt) return;
  const st = vvScanSt;
  const klaar = st.items.filter(r => r.staat === 'klaar' || r.staat === 'enkeluitslag');
  const rest = st.items.filter(r => !(r.staat === 'klaar' || r.staat === 'enkeluitslag'));
  const kop = st.fase === 'bezig'
    ? `<p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:12px">Bezig met nakijken… <b>${st.gedaan} / ${st.totaal}</b></p>`
    : st.fout
      ? `<div class="card" style="border-left:4px solid var(--rd);text-align:left;margin-bottom:12px">
           <p style="font-size:13px;color:var(--rd);margin:0">${icI(IC.warn)}${esc(st.fout)}</p>
           <p style="font-size:12px;color:var(--txt2);margin:6px 0 0">Er is niets nagekeken. Probeer het opnieuw wanneer je verbinding weer werkt.</p></div>`
      : `<p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:12px">${klaar.length
          ? `Bij de bond staat er info klaar voor <b>${klaar.length}</b> van de <b>${st.items.length}</b> nagekeken ${st.items.length === 1 ? 'wedstrijd' : 'wedstrijden'}.`
          : st.items.length
            ? `Bij de bond staat er nog niets nieuws voor ${st.items.length === 1 ? 'deze wedstrijd' : 'deze ' + st.items.length + ' wedstrijden'}.`
            : 'Er is geen enkele niet-afgesloten wedstrijd met een wedstrijdnummer van de bond.'}</p>`;
  // Wat we NIET konden nakijken hoort erbij, anders leest "niets nieuws" als "alles is gecontroleerd".
  const voet = [];
  if (st.zonderNummer) voet.push(`<b>${st.zonderNummer}</b> ${st.zonderNummer === 1 ? 'wedstrijd heeft' : 'wedstrijden hebben'} geen wedstrijdnummer van de bond en ${st.zonderNummer === 1 ? 'is' : 'zijn'} dus niet nagekeken. Lees de kalender van je ploeg opnieuw in en gebruik daar <b>Alleen het wedstrijdnummer erbij zetten</b>.`);
  if (st.overgeslagen) voet.push(`Er zijn er nog <b>${st.overgeslagen}</b> ouder dan deze ${VV_SCAN_MAX}; die zijn niet nagekeken. Vraag het straks nog een keer.`);
  openModal(`<h3>${icI(IC.link)} Bij de bond nakijken</h3>
    ${kop}
    ${klaar.map(vvScanRijHtml).join('')}
    ${(klaar.length && rest.length) ? '<div class="sec" style="text-align:left">Nog niets te halen</div>' : ''}
    ${rest.map(vvScanRijHtml).join('')}
    ${voet.length ? `<div class="card" style="text-align:left;border-left:4px solid var(--org)">
      ${voet.map(v => `<p style="font-size:13px;color:var(--txt2);margin:0 0 6px">${v}</p>`).join('')}</div>` : ''}
    <button class="btn btn-gray" style="margin-top:8px" onclick="vvScanSluit()">${st.fase === 'bezig' ? 'Stoppen' : 'Sluiten'}</button>`);
}
