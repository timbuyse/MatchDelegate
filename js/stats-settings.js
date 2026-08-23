// ===================== SEIZOENSSTATISTIEKEN =====================
let statsFilter = 'all', seasonFilter = null;
// null = de gebruiker koos nog niets, dus loadStats bepaalt de standaard (competitie, met terugval
// op alles als er nog geen competitiewedstrijd gespeeld is). Zie de uitleg daar.
let kindFilter = null; // soort wedstrijd — zie MATCH_KINDS in core.js
// Welke statistieksecties standaard zichtbaar zijn voor kijkers (vóór de beheerder iets kiest).
// De samenvattingskaart bovenaan staat hier niet in — die is altijd publiek.
const STATS_DEFAULT_PUBLIC = { topscorers: true, assists: true, cleansheets: true, minutes: false, fairplay: false, cards: false, positions: false, selected: false };
// Beheerder zet een sectie publiek/privé voor kijkers. Opgeslagen in teams/{id}/info/statsPublic
// (leesbaar voor kijkers, schrijfbaar door beheerders). Lokaal meteen bijwerken + herrenderen.
function toggleStatPublic(key) {
  if (!canSeeStats() || !fbdb || !activeTeamId) return;
  const cur = (key in activeStatsPublic) ? !!activeStatsPublic[key] : !!STATS_DEFAULT_PUBLIC[key];
  activeStatsPublic[key] = !cur;
  // Mislukt de write (offline/permissie), draai de lokale flip terug en meld het — anders toont
  // dit toestel de nieuwe stand terwijl kijkers en de volgende sessie de oude zien.
  fbdb.ref('teams/' + activeTeamId + '/info/statsPublic/' + key).set(!cur).catch(() => {
    activeStatsPublic[key] = cur;
    showToast('Zichtbaarheid niet opgeslagen — controleer je verbinding en probeer opnieuw.', 'err');
    if (view === 'stats') loadStats();
  });
  loadStats();
}
function setStatsFilter(v) { statsFilter = v; loadStats(); }
function setSeasonFilter(v) { seasonFilter = v; loadStats(); }
// MATCH_KINDS en matchKindOf staan sinds v0.58.1 in core.js: het kaartje in de lijsten en de filter
// van de wedstrijdenlijst hebben ze ook nodig, en vier losse kopieën van dezelfde drie soorten lopen
// vroeg of laat uit elkaar. Tornooiwedstrijden komen hier nooit langs, die zitten al buiten de
// statistieken.
// null = nog niets gekozen (loadStats bepaalt dan de standaard). Kom je hier vóór dat gebeurde —
// bv. rechtstreeks in een spelerdetail — dan telt alles mee; een niet-gemaakte keuze mag nooit stil
// elke wedstrijd wegfilteren.
function kindMatches(m) { return !kindFilter || kindFilter === 'all' || matchKindOf(m) === kindFilter; }
// ===================== FILTERKNOP (seizoen + soort) =====================
// Sinds v0.58.1 zitten seizoen en soort achter één knop in plaats van als twee losse keuzelijsten
// bovenaan (Tim's keuze). Twee volle-breedte selects duwden de eigenlijke cijfers onder de vouw,
// terwijl je ze zelden wisselt. De knop toont wél altijd wáár je naar kijkt — "2025/2026 ·
// Competitie" — want een statistiek zonder dat kader is misleidend.
function statsFilterLabel() {
  const soort = (kindFilter === 'all') ? 'alle wedstrijden' : (kindFilter === 'other' ? 'andere soort' : kindFilter.toLowerCase());
  return `${seasonFilter || '—'} · ${soort}`;
}
// Een filtertekentje met daarnaast de actieve filters als kaartjes (Tim, 23-08-2026). Zo zie je in
// één oogopslag waar de cijfers over gaan — seizoen en soort staan er altijd, want die twee bepalen
// altijd wat je ziet. Tikken op het teken of op een kaartje opent hetzelfde paneel.
function statsFilterKnopHtml(seasons) {
  const arg = JSON.stringify(seasons || []).replace(/"/g, '&quot;');
  const soort = (!kindFilter || kindFilter === 'all') ? 'Alle wedstrijden' : (kindFilter === 'other' ? 'Andere' : kindFilter);
  const chip = t => `<span class="start-chip on" onclick="modalStatsFilter(${arg})">${esc(t)}</span>`;
  return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
    <button class="btn btn-pale btn-sm" style="width:auto;padding:6px 11px;margin:0" title="Filter" onclick="modalStatsFilter(${arg})">${icI(IC.filter)}</button>
    ${seasonFilter ? chip(seasonFilter) : ''}${chip(soort)}
  </div>`;
}
function modalStatsFilter(seasons) {
  const soorten = [['all', 'Alle wedstrijden'], ...MATCH_KINDS.map(k => [k, k]), ['other', 'Andere']];
  const ss = seasons || [];
  openModal(`<h3>${icI(IC.search)} Welke wedstrijden?</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">De cijfers hieronder gelden altijd voor één seizoen en één soort.</p>
    ${ss.length ? `<div class="fg"><label>Seizoen</label>
      <select onchange="setSeasonFilter(this.value);modalStatsFilter(${JSON.stringify(ss).replace(/"/g, '&quot;')})">
        ${ss.map(s => `<option value="${esc(s)}" ${seasonFilter === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
      </select></div>` : ''}
    <div class="fg"><label>Soort wedstrijd</label>
      <select onchange="setKindFilter(this.value);modalStatsFilter(${JSON.stringify(ss).replace(/"/g, '&quot;')})">
        ${soorten.map(([w, l]) => `<option value="${esc(w)}" ${kindFilter === w ? 'selected' : ''}>${esc(l)}</option>`).join('')}
      </select></div>
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
}
// Eén gedeelde keuze voor het seizoensoverzicht én het spelerdetail: wie naar de bekerwedstrijden
// kijkt en dan op een speler tikt, verwacht daar hetzelfde. Het seizoen blijft bewust wél per
// scherm (dat kan legitiem verschillen: een speler heeft niet in elk seizoen gespeeld).
function setKindFilter(v) { kindFilter = v; if (view === 'playerDetail') loadPlayerDetail(); else loadStats(); }
// Label voor de lege staat, zodat "niets te zien" niet als "geen wedstrijden" leest. Verdraagt de
// null-stand (nog niets gekozen): die komt hier normaal niet, maar een label hoort geen scherm te
// laten crashen.
function kindLabelLow() { return (!kindFilter || kindFilter === 'all') ? 'alle wedstrijden' : (kindFilter === 'other' ? 'andere soort' : kindFilter.toLowerCase()); }
// In het spelerdetail staat de soort onder de seizoenskiezer, als knop met dezelfde tekst als op de
// statistiekenpagina. Het seizoen zit daar in zijn eigen kiezer, dus dit paneel toont enkel de soort.
function spelerSoortKnopHtml() {
  const soort = (!kindFilter || kindFilter === 'all') ? 'Alle wedstrijden' : (kindFilter === 'other' ? 'Andere' : kindFilter);
  return `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
    <button class="btn btn-pale btn-sm" style="width:auto;padding:6px 11px;margin:0" title="Filter" onclick="modalStatsFilter([])">${icI(IC.filter)}</button>
    <span class="start-chip on" onclick="modalStatsFilter([])">${esc(soort)}</span>
  </div>`;
}
// Seizoen van een wedstrijd (Belgisch voetbalseizoen: juli–juni).
function seasonOf(m) {
  const d = m.date ? new Date(m.date + 'T00:00:00') : (m.createdAt ? new Date(m.createdAt) : null);
  if (!d || isNaN(d.getTime())) return 'Onbekend';   // geen/ongeldige datum → geen "NaN/NaN"-seizoen
  const y = d.getFullYear(), start = d.getMonth() >= 6 ? y : y - 1;
  return `${start}/${start + 1}`;
}
async function loadStats() {
  const all = await dbAll();
  const el = document.getElementById('stats-content');
  if (!el) return;
  const teams = [...new Set(all.map(m => m.teamName).filter(Boolean))].sort();
  // De lokale matches-store is niet per ploeg gescheiden (zie cleanupOrphanMatches in core.js) —
  // dus ook binnen een ploeg altijd expliciet filteren op de actieve ploeg, anders lekt de cache
  // van een andere ploeg op dit toestel mee in de statistieken.
  // Zoals loadHome()/loadMatches(): in de cloud altijd op de actieve ploeg filteren, nooit blind
  // 'all'. Is de naam nog niet gekend (net na refresh) of heeft de actieve ploeg nog geen eigen
  // wedstrijden in de cache, dan UNKNOWN_TEAM_FILTER (toont niets) i.p.v. de stats van een andere
  // ploeg op dit toestel te tonen.
  if (cloudReady) statsFilter = teamNames[activeTeamId] || UNKNOWN_TEAM_FILTER;
  else if (statsFilter !== 'all' && !teams.includes(statsFilter)) statsFilter = 'all';
  // Seizoenslijst uit dezelfde set als de stats zelf (afgewerkt, geen tornooi, actieve ploeg) —
  // anders staan er seizoenen van andere ploegen of geplande wedstrijden in de dropdown. En
  // 'Onbekend' (wedstrijd zonder datum) hoort achteraan, niet als default bovenaan: door de
  // alfabetische sort ('O' > cijfers) werd één datumloze wedstrijd anders het standaardseizoen
  // en leek de statistiekenpagina leeg.
  const candidates = all.filter(m => m.status === 'done' && !m.tournamentId && (statsFilter === 'all' || m.teamName === statsFilter));
  const seasons = [...new Set(candidates.map(seasonOf))].sort().reverse();
  const _unkIdx = seasons.indexOf('Onbekend');
  if (_unkIdx >= 0) { seasons.splice(_unkIdx, 1); seasons.push('Onbekend'); }
  // Geen "alle seizoenen" meer: spelers uit oudere wedstrijden (zonder rosterId, gematcht op
  // naam) en nieuwere wedstrijden (mét rosterId) kwamen anders dubbel in de lijst terecht, zie
  // getp() hieronder. Standaard het meest recente seizoen met een wedstrijd.
  if (!seasonFilter || !seasons.includes(seasonFilter)) seasonFilter = seasons[0] || null;
  // De seizoenskiezer staat er ook bij één seizoen (zelfde balk als in het spelerdetail): deze
  // cijfers gelden ALTIJD voor één seizoen, dus zonder die regel lijken ze over alles te gaan.
  // Bij één gespeelde wedstrijd in juni springt de pagina straks stil naar het nieuwe seizoen
  // zodra de eerste augustuswedstrijd afgewerkt is — dan moet zichtbaar zijn wélk seizoen je ziet.
  // Tornooiwedstrijden tellen niet mee in de algemene statistieken (zelfde aanpak als de "Wedstrijden"-lijst).
  // De soortfilter zit bewust NIET in `candidates` hierboven: de seizoenslijst mag niet verspringen
  // (of verdwijnen) omdat je even op "Beker" filtert — dan kon je niet meer terug van seizoen wisselen.
  // STANDAARD OP COMPETITIE (Tim, 23-08-2026). Statistieken gaan over hoe je het in de competitie
  // doet; een oefenmatch of een bekeravond hoort daar niet zomaar in mee te tellen. Maar zolang er
  // in dit seizoen nog geen competitiewedstrijd gespeeld is, zou "Competitie" een lege pagina geven
  // — dan blijft het "alle wedstrijden". Enkel de EERSTE keer: zodra je zelf iets kiest (ook
  // "alle"), blijft die keuze staan zolang de app open is.
  if (kindFilter === null) {
    const inSeizoen = candidates.filter(m => seasonOf(m) === seasonFilter);
    kindFilter = inSeizoen.some(m => matchKindOf(m) === 'Competitie') ? 'Competitie' : 'all';
  }
  const list = candidates.filter(m => seasonOf(m) === seasonFilter && kindMatches(m));
  // Enkel bij meer dan één ploeg op dit toestel — zie dezelfde afweging in loadMatches.
  const filterBar = `${(!cloudReady && teams.length > 1) ? `<div class="filterbar"><select onchange="setStatsFilter(this.value)">
      <option value="all" ${statsFilter==='all'?'selected':''}>Alle ploegen</option>
      ${teams.map(t => `<option value="${esc(t)}" ${statsFilter===t?'selected':''}>${esc(t)}</option>`).join('')}
    </select></div>` : ''}${candidates.length ? statsFilterKnopHtml(seasons) : ''}`;
  if (!list.length) {
    const leeg = kindFilter === 'all'
      ? 'Nog geen wedstrijden.'
      : `Geen wedstrijden van soort "${esc(kindLabelLow())}" in seizoen ${esc(seasonFilter || '')}.`;
    el.innerHTML = filterBar + `<div class="empty"><div class="ei">${IC.chart}</div><p>${leeg}</p></div>`; return;
  }
  // Oudste eerst verwerken, zodat de weergavenaam van een speler steeds de meest recente is (bv. na een naamscorrectie).
  const sortedList = [...list].sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0));
  let w = 0, d = 0, l = 0, gf = 0, ga = 0, cleanSheets = 0;
  let reeksen = 0, reeksenGewonnen = 0;   // strafschoppenreeksen (zie m.shootout in core.js)
  const pl = {};
  // Groepeert op rosterId wanneer beschikbaar (stabiel over naamswijzigingen heen), anders op naam (oude matches, gasten).
  const getp = (rosterId, name, num) => {
    const nm = (name || 'Speler').trim();
    const k = rosterId || nm;
    const r = pl[k] || (pl[k] = { name: nm, rosterId: rosterId || null, number: num || '', goals: 0, assists: 0, ms: 0, yc: 0, rc: 0, mp: 0, cs: 0, squad: 0, timed: 0, absent: 0, lines: {}, plekken: {} });
    if (name) r.name = nm;
    if (num) r.number = num;
    return r;
  };
  // Onbekende speler-id's (speler achteraf uit de wedstrijd verwijderd) leveren null op i.p.v.
  // over alle wedstrijden samen te klonteren in één "?"-rij die in Topschutters kan opduiken.
  const getpById = (m, id) => { const p = m.players.find(x => x.id === id); if (p) return getp(p.rosterId, p.name, p.number); const nm = pName(m, id); return (nm && nm !== '?') ? getp(null, nm) : null; };
  // 2b (A/B-ploegen): wie op een bepaalde dag in de selectie van eender welke wedstrijd van deze
  // ploeg stond, mag voor die dag niet als afwezig geteld worden — anders drukt een ✗ bij ploeg A
  // het selectiepercentage terwijl de speler tegelijk bij ploeg B meespeelde. Sleutel = speler+datum.
  // A/B-correctie: wie op een dag geselecteerd was, mag die dag niet als afwezig tellen. Op BEIDE
  // sleutels indexeren (rosterId én naam), zodat het ook klopt als het ene record wél een rosterId
  // heeft en het andere niet (oude string-absents / losse spelers) — anders miste die match.
  const selKeyR = (rosterId, date) => rosterId ? ('r:' + rosterId + '|' + (date || '')) : null;
  const selKeyN = (name, date) => 'n:' + (name || '').trim().toLowerCase() + '|' + (date || '');
  const selectedOnDate = new Set();
  for (const m of sortedList) for (const p of (m.players || [])) { const kr = selKeyR(p.rosterId, m.date); if (kr) selectedOnDate.add(kr); selectedOnDate.add(selKeyN(p.name, m.date)); }
  for (const m of sortedList) {
    gf += m.scoreUs; ga += m.scoreThem;
    // Een gewonnen strafschoppenreeks telt als winst (matchResultaat in core.js). De doelpunten
    // hierboven blijven die van de wedstrijd zelf — een strafschop uit de reeks is geen doelpunt.
    { const r = matchResultaat(m); if (r === 'W') w++; else if (r === 'V') l++; else d++; }
    if (heeftShootout(m)) { reeksen++; if (shootoutWinnaar(m) === 'us') reeksenGewonnen++; }
    if (m.scoreThem === 0) cleanSheets++;
    const mins = calcMinutes(m);
    // Zelfde regel als in het tornooiverslag: een wedstrijd zonder geregistreerde speeltijd ("Snel
    // resultaat") telt wél als selectie, maar niet als noemer voor de fair-play-gemiddelden.
    const gemeten = getGameTimeMs(m) > 0;
    for (const p of (m.players || [])) {
      // Reden "speelt elders" (weggeroepen naar de tweede wedstrijd van dezelfde ploeg, die op
      // hetzelfde uur loopt): hij voetbalde wel degelijk, alleen niet hier. Dus geen gemiste
      // wedstrijd én geen selectie met 0 minuten. Zelfde regel als bij een NB'er met die reden, en
      // net als daar vóór getp(), zodat deze wedstrijd hem ook geen lege regel bezorgt.
      if (p.absent && p.absentReason === 'elders') continue;
      const r = getp(p.rosterId, p.name, p.number); const ms = mins[p.id] ? mins[p.id].ms : 0;
      // No-show ("Niet aanwezig" tijdens de wedstrijd): telt als afwezig, niet als geselecteerd —
      // anders staat hij bovenaan Fair-play met 0' alsof de trainer hem geen kansen gaf, terwijl
      // hij zelf niet kwam opdagen. (selectedOnDate hierboven bevat hem wél, zodat een ✗ bij een
      // A/B-tegenhanger op dezelfde dag niet dubbel als afwezig telt.)
      if (p.absent) { r.absent++; continue; }
      r.squad++;
      if (gemeten) r.timed++;
      // Per PLEK bijhouden (CAM, RM, LCV …) en de linie erbij als samenvatting. "Middenveld 9×" zegt een
    // trainer niets; "CAM 5× · CM 3× · RM 1×" wel. Voor wedstrijden van vóór v0.34.0 bestaat de code
    // nog niet — spelerGridCode leidt ze dan af uit lijn + x/y, wat een benadering is op een rooster
    // van 26 plekken maar het seizoen wél leesbaar houdt.
    if (ms > 0) {
      r.mp++;
      r.lines[p.line] = (r.lines[p.line] || 0) + 1;
      const code = spelerGridCode(p);
      if (code) r.plekken[code] = (r.plekken[code] || 0) + 1;
    }
      r.ms += ms;
      // keeperByQ (per-kwart bijgehouden, zie syncKeeper()) i.p.v. de eind-positie: anders krijgt
      // bij een keeperwissel tijdens de wedstrijd de verkeerde speler het clean-sheet-krediet.
      const wasKeeper = m.keeperByQ && Object.keys(m.keeperByQ).length ? wasKeeperAtAll(m, p.id) : p.line === 'Doel';
      if (ms > 0 && wasKeeper && m.scoreThem === 0) r.cs++;  // clean sheet voor de keeper
    }
    for (const a of (m.absentPlayers || [])) {
      const ab = typeof a === 'string' ? { name: a, rosterId: null } : a;
      const _kr = selKeyR(ab.rosterId, m.date);
      if ((_kr && selectedOnDate.has(_kr)) || selectedOnDate.has(selKeyN(ab.name, m.date))) continue; // die dag elders geselecteerd → niet afwezig
      // Reden "speelt elders": de speler voetbalde wel, alleen bij een ploeg buiten deze
      // statistieken. Dat is dus geen gemiste wedstrijd — zelfde gedachte als de A/B-correctie
      // hierboven, maar dan handmatig aangegeven omdat die wedstrijd hier niet in de lijst zit.
      if (ab.reason === 'elders') continue;
      const r = getp(ab.rosterId, ab.name); r.absent++;
    }
    for (const e of m.events) {
      let r;
      if (e.type === 'goal_us' && e.playerId) { if ((r = getpById(m, e.playerId))) r.goals++; if (e.assistId && (r = getpById(m, e.assistId))) r.assists++; }
      if (e.type === 'penalty_us' && e.scored && e.playerId && (r = getpById(m, e.playerId))) r.goals++;  // strafschopdoelpunt telt mee
      if (e.type === 'yellow_card' && e.playerId && (r = getpById(m, e.playerId))) r.yc++;
      if (e.type === 'red_card' && e.playerId && (r = getpById(m, e.playerId))) r.rc++;
    }
  }
  const players = Object.values(pl);
  const pDetTeam = statsFilter !== 'all' ? statsFilter : '';
  const isMgr = canSeeStats();
  // Zichtbaarheid per sectie: beheerders zien alles + een oog-toggle per sectie; kijkers (en een
  // beheerder in viewerMode) zien enkel de publieke secties. Keuze staat in teams/{id}/info/statsPublic.
  const sp = activeStatsPublic || {};
  const isPub = k => (k in sp) ? !!sp[k] : !!STATS_DEFAULT_PUBLIC[k];
  let hiddenCount = 0;
  const eyeCtrl = k => { if (!isMgr) return ''; const pub = isPub(k); return `<span class="stat-eye${pub ? '' : ' off'}" title="${pub ? 'Zichtbaar voor kijkers — klik om te verbergen' : 'Verborgen voor kijkers — klik om te tonen'}" onclick="event.preventDefault();event.stopPropagation();toggleStatPublic('${k}')">${icI(pub ? IC.eye : IC.eyeOff)}</span>`; };
  // Open/dicht-stand van de secties overleven een her-render (bv. na een oog-toggle) — anders
  // klapt elke klik op een oogje alle openstaande secties dicht.
  const _openSecs = new Set([...el.querySelectorAll('details.stat-acc[data-sk][open]')].map(d => d.dataset.sk));
  const sect = (k, summaryInner, bodyHtml) => { const pub = isPub(k); if (!isMgr && !pub) { hiddenCount++; return ''; } return `<details class="stat-acc" data-sk="${k}"${_openSecs.has(k) ? ' open' : ''}><summary>${summaryInner}${eyeCtrl(k)}</summary><div class="card">${bodyHtml}</div></details>`; };
  // Spelernamen enkel klikbaar (→ individueel spelerdetail) voor beheerders; kijkers krijgen geen detail.
  // data-link zet het chevron achter de rij (zie .stat-row[data-link] in index.html): zonder dat
  // teken was er nergens te zien dat achter een spelersnaam een persoonlijk detail zit.
  const prow = p => isMgr ? `data-link="1" style="cursor:pointer" onclick="openPlayerDetail('${jsq(p.name)}','${jsq(pDetTeam)}','${jsq(p.rosterId || '')}')"` : '';
  const topList = (arr, val, unit) => arr.length ? arr.map((p, i) => `<div class="stat-row" ${prow(p)}><span class="stat-rank">${i+1}</span><span style="flex:1">${esc(p.name)}</span><span style="font-weight:800">${val(p)}${unit}</span></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">—</p>';
  const scorers = players.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 10);
  const assisters = players.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 10);
  // Beide lijsten vertrekken van GESELECTEERD, niet van gespeeld: een speler die wél in de selectie
  // stond maar 0 minuten kreeg (bank, niet ingevallen) hoort net zichtbaar te zijn — dat is het
  // eerlijkheids-signaal. Wie op ✗/niets stond zit niet in squad en blijft er terecht buiten.
  // Fair-play deelt echter door `timed` (wedstrijden waarin er ook echt tijd geregistreerd is): een
  // "Snel resultaat" heeft een score maar geen speeltijd en verlaagde zo het gemiddelde van iedereen.
  const minutes = players.filter(p => p.squad > 0).sort((a, b) => b.ms - a.ms);
  const fairplay = players.filter(p => p.timed > 0).sort((a, b) => (a.ms / a.timed) - (b.ms / b.timed));
  const keepers = players.filter(p => p.cs > 0).sort((a, b) => b.cs - a.cs);
  const carded = players.filter(p => p.yc || p.rc).sort((a, b) => (b.yc + b.rc * 2) - (a.yc + a.rc * 2));
  const posList = players.filter(p => p.mp > 0 && Object.keys(p.lines).length).sort((a, b) => b.mp - a.mp);
  const attend = players.filter(p => (p.squad + p.absent) > 0).sort((a, b) => (b.squad / (b.squad + b.absent)) - (a.squad / (a.squad + a.absent)) || b.squad - a.squad);
  el.innerHTML = filterBar
    + `<div class="card">
      <div class="stat-big" style="margin-bottom:10px">
        <div class="stat-box"><div class="v">${list.length}</div><div class="l">Gespeeld</div></div>
        <div class="stat-box"><div class="v" style="color:var(--grn)">${w}</div><div class="l">Winst</div></div>
        <div class="stat-box"><div class="v">${d}</div><div class="l">Gelijk</div></div>
        <div class="stat-box"><div class="v" style="color:var(--rd)">${l}</div><div class="l">Verlies</div></div>
      </div>
      <div class="stat-big">
        <div class="stat-box"><div class="v">${gf}</div><div class="l">Doelpunten voor</div></div>
        <div class="stat-box"><div class="v">${ga}</div><div class="l">Doelpunten tegen</div></div>
        <div class="stat-box"><div class="v">${gf-ga>=0?'+':''}${gf-ga}</div><div class="l">Saldo</div></div>
      </div>
      ${/* Strafschoppenreeksen: alleen tonen als er ook echt één genomen is — een regel met nullen
           bij een ploeg die nooit penalty's schiet, is ruis. De winst zit al in "Winst" hierboven
           (zie matchResultaat), hier staat waar die vandaan kwam. */ ''}
      ${reeksen ? `<div class="stat-row" style="margin-top:10px;border-top:1px solid var(--bdr);padding-top:10px">
        <span style="flex:1">${icI(IC.penalty)} Strafschoppenreeksen</span>
        <span style="font-weight:800">${reeksenGewonnen} van de ${reeksen} gewonnen</span>
      </div>` : ''}
    </div>`
    // Eén keer zeggen wat de chevrons hieronder betekenen. Enkel voor beheerders (kijkers hebben geen
    // spelerdetail) en enkel als er ook effectief spelersrijen zijn — een wedstrijd die via "Snel
    // resultaat" ingevoerd is, heeft er geen.
    + ((isMgr && players.length) ? `<p class="stat-hint">${icI(IC.shirt)}<span>Tik op een speler voor zijn persoonlijke statistieken.</span></p>` : '')
    + sect('topscorers', `${icI(IC.ball)} Topschutters`, topList(scorers, p => p.goals, ''))
    + sect('assists', `${icI(IC.assist)} Meeste assists`, topList(assisters, p => p.assists, ''))
    + sect('minutes', `${icI(IC.timer)} Meeste speelminuten`, minutes.length ? minutes.map((p,i)=>`<div class="stat-row" ${prow(p)}><span class="stat-rank">${i+1}</span><span style="flex:1">${esc(p.name)}<small style="color:var(--txt2);display:block">${p.mp > 0 ? `${p.mp} ${p.mp===1?'wedstrijd':'wedstrijden'} · gem. ${Math.round(p.ms/p.mp/60000)}'/match` : `${p.squad}× geselecteerd · niet gespeeld`}</small></span><span style="font-weight:800">${playedMin(p.ms)}'</span></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">—</p>')
    + sect('fairplay', `${icI(IC.balance)} Fair-play · minste speeltijd`, `<p style="font-size:12px;color:var(--txt2);margin-bottom:8px">Gemiddelde speeltijd per keer dat de speler in de selectie stond (bank inbegrepen) — zo zie je wie meer speelkansen verdient. Wie geselecteerd werd maar niet speelde, staat bovenaan met 0'. Een wedstrijd die je via "Snel resultaat" invoerde telt hier niet mee: daar is geen speeltijd bijgehouden.</p>${fairplay.length ? fairplay.map(p=>`<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span style="color:var(--txt2);font-size:13px">${p.mp}/${p.timed} gesp.</span><span style="font-weight:800;min-width:64px;text-align:right">${Math.round(p.ms/p.timed/60000)}'/match</span></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">—</p>'}`)
    + sect('cleansheets', `${icI(IC.save)} Clean sheets`, `<div class="stat-row"><span style="flex:1">Ploeg (geen tegendoel)</span><span style="font-weight:800">${cleanSheets}/${list.length}</span></div>${keepers.map(p=>`<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span style="font-weight:800">${p.cs}</span></div>`).join('')}`)
    + (carded.length ? sect('cards', `${icI(IC.cardY)} Kaarten`, carded.map(p=>`<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span>${p.yc?icI(IC.cardY).repeat(p.yc):''}${p.rc?icI(IC.cardR).repeat(p.rc):''}</span></div>`).join('')) : '')
    + (posList.length ? sect('positions', `${icI(IC.compass)} Posities <span style="font-weight:400;text-transform:none;color:var(--txt2)">(hoe vaak per plek)</span>`, posList.map(p=>{
      // Per PLEK, aflopend: "CAM×5 · CM×3 · RM×1". De linie staat eronder als samenvatting, want dat is
      // waar je in één oogopslag ziet of iemand vooral verdedigt of aanvalt. Heeft een speler nog geen
      // plekken (enkel oude wedstrijden waarvan de plaats niet te herleiden was), dan valt de rij terug
      // op de linies alleen — beter een grovere indeling dan een lege rij.
      const plekken = Object.entries(p.plekken || {}).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`${c}×${n}`).join(' · ');
      const linies = Object.entries(p.lines).sort((a,b)=>b[1]-a[1]).map(([l,c])=>`${LINE_SHORT[l]||l}×${c}`).join(' · ');
      return `<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}${plekken && linies ? `<small style="color:var(--txt2);display:block">${linies}</small>` : ''}</span>`
        + `<span style="color:var(--txt2);font-size:13px">${plekken || linies}</span></div>`;
    }).join('')) : '')
    + (attend.length ? sect('selected', `${icI(IC.clipboard)} Geselecteerd <span style="font-weight:400;text-transform:none;color:var(--txt2)">(in selectie / totaal)</span>`, attend.map(p=>{const tot=p.squad+p.absent;const pct=tot?Math.round(p.squad/tot*100):0;return `<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span style="color:var(--txt2);font-size:13px">${p.squad}/${tot}</span><span style="font-weight:800;min-width:46px;text-align:right${pct<60?';color:var(--org)':''}">${pct}%</span></div>`;}).join('')) : '')
    + ((!isMgr && hiddenCount > 0) ? `<p class="stat-locked">${icI(IC.eyeOff)} Meer statistieken enkel beschikbaar voor ploegbeheerders.</p>` : '');
}

// ===================== SPELERSDETAIL =====================
let playerDetailName = null, playerDetailTeamName = null, playerDetailRosterId = null, playerDetailSeason = null, _playerDetailFrom = 'stats';
function openPlayerDetail(name, teamName, rosterId) {
  if (!canSeeStats()) return; // enkel beheerders; kijkers/gasten mogen geen spelerdetail zien
  name = (name || '').trim();
  if (!name) return;
  playerDetailName = name; playerDetailTeamName = teamName || null; playerDetailRosterId = rosterId || null; playerDetailSeason = null; _playerDetailFrom = view;
  go('playerDetail');
}
function setPlayerDetailSeason(v) { playerDetailSeason = v; loadPlayerDetail(); }
async function loadPlayerDetail() {
  const all = await dbAll();
  const el = document.getElementById('player-detail-content');
  if (!el) return;
  const name = (playerDetailName || '').trim();
  const rosterId = playerDetailRosterId || null;
  const inTeam = m => !playerDetailTeamName || m.teamName === playerDetailTeamName;
  // Matcht bij voorkeur op het stabiele ploegrooster-id; oudere matches zonder rosterId vallen terug op naam.
  const findPlayer = m => {
    const players = m.players || [];
    if (rosterId) {
      const byId = players.find(p => p.rosterId === rosterId);
      if (byId) return byId;
    }
    return players.find(p => (p.name || '').trim() === name);
  };
  // Tornooiwedstrijden tellen niet mee bij gespeeld/doelpunten/etc. — die krijgen hieronder een apart "Tornooien"-kadertje.
  const allDone = all.filter(m => m.status === 'done' && !m.tournamentId && inTeam(m) && findPlayer(m));
  // globalId (blijvende speleridentiteit over ploegen heen, sinds de "Speler overzetten"-tool)
  // opzoeken via de eerste match waarin die al bewaard staat — voor het carrière-overzicht verderop.
  let resolvedGlobalId = null;
  for (const m of allDone) { const p = findPlayer(m); if (p && p.globalId) { resolvedGlobalId = p.globalId; break; } }
  // Tornooien waarvoor deze speler geselecteerd stond. Staan hier al vóór de seizoenslijst, omdat
  // die seizoenen mee in de dropdown moeten: bouwden we de lijst enkel uit gespeelde wedstrijden,
  // dan was een tornooi vóór de eerste wedstrijd van het seizoen onbereikbaar — het seizoen bestond
  // dan simpelweg niet in de kiezer, en het tornooiblok hieronder kwam nooit in beeld.
  const inTournamentSquad = t => tournamentSquadMee(t).some(s => rosterId ? s.srcId === rosterId : (s.name || '').trim() === name);
  const tInTeam = t => { if (!playerDetailTeamName) return true; const tm = teamById(t.teamId); return (tm && tm.name === playerDetailTeamName) || t.teamName === playerDetailTeamName; };
  const myTournaments = getTournaments().filter(t => tInTeam(t) && inTournamentSquad(t));
  const seasons = [...new Set([...allDone.map(seasonOf), ...myTournaments.map(seasonOf)])].sort().reverse();
  // 'Onbekend' achteraan, niet als default — zie loadStats().
  const _unkIdx2 = seasons.indexOf('Onbekend');
  if (_unkIdx2 >= 0) { seasons.splice(_unkIdx2, 1); seasons.push('Onbekend'); }
  // Geen "alle seizoenen" meer, zie loadStats() hierboven voor de reden (dubbele spelers
  // door rosterId- vs. naam-matching tussen oude en nieuwe wedstrijden). Standaard het meest
  // recente seizoen waarin deze speler écht een wedstrijd speelde — een seizoen dat enkel via een
  // tornooiselectie in de lijst staat, is wel kiesbaar maar geen goede startpagina (die zou leeg
  // ogen op één tornooiregel na). Zijn er helemaal geen gespeelde wedstrijden, dan valt hij terug
  // op het recentste seizoen uit de lijst.
  if (!playerDetailSeason || !seasons.includes(playerDetailSeason)) {
    const gespeeld = new Set(allDone.map(seasonOf));
    playerDetailSeason = seasons.find(s => gespeeld.has(s)) || seasons[0] || null;
  }
  // Het seizoen blijft hier een eigen keuze (een speler heeft niet in elk seizoen gespeeld), de
  // soort is dezelfde gedeelde keuze als op de statistiekenpagina — zie setKindFilter.
  const filterBar = seasons.length ? `<div class="filterbar"><select onchange="setPlayerDetailSeason(this.value)">
      ${seasons.map(s => `<option value="${s}" ${playerDetailSeason===s?'selected':''}>Seizoen ${s}</option>`).join('')}
    </select></div>` + spelerSoortKnopHtml() : '';
  // Een tornooi heeft geen "soort", dus bij een actieve soortfilter hoort dit kadertje er niet bij
  // (0 = het blok wordt niet gerenderd) — anders lees je een bekerfilter met tornooien erin.
  const tournamentCount = (kindFilter && kindFilter !== 'all') ? 0
    : myTournaments.filter(t => seasonOf(t) === playerDetailSeason).length;
  const tournamentBlock = tournamentCount
    ? `<div class="sec">${icI(IC.medal)} Tornooien</div><div class="card"><div class="stat-row"><span style="flex:1">Geselecteerd voor</span><span style="font-weight:800">${tournamentCount} ${tournamentCount===1?'tornooi':'tornooien'}</span></div></div>`
    : '';
  // Soortfilter op dezelfde manier als in loadStats: buiten de seizoenslijst gehouden, wél op de
  // wedstrijden zelf. Hij geldt hieronder ook voor de afwezigheidscorrectie en de gastoptredens,
  // anders zouden die uit wedstrijden van een ánder soort blijven meetellen.
  const doneList = allDone.filter(m => seasonOf(m) === playerDetailSeason && kindMatches(m));
  doneList.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
  if (!doneList.length) {
    const leeg = kindFilter === 'all'
      ? `Nog geen gespeelde wedstrijden voor ${esc(name)}${playerDetailSeason?(' in seizoen '+playerDetailSeason):''}.`
      : `Geen wedstrijden van soort "${esc(kindLabelLow())}" voor ${esc(name)}${playerDetailSeason?(' in seizoen '+playerDetailSeason):''}.`;
    // Het tornooiblok hoort hier wél bij: een speler kan in een tornooiselectie staan in een seizoen
    // waarin nog geen enkele wedstrijd gespeeld is (bv. een tornooi vóór de competitiestart).
    el.innerHTML = filterBar + `<div class="empty"><div class="ei">${IC.chart}</div><p>${leeg}</p></div>` + tournamentBlock; return;
  }
  let goals = 0, assists = 0, ms = 0, mp = 0, yc = 0, rc = 0, cs = 0, keeperApps = 0, squad = 0, absent = 0, number = '', pos = '';
  // Strafschoppen van deze speler, tijdens de wedstrijd én in een reeks samengeteld (Tim, 23-08-2026):
  // voor een speler is het dezelfde vaardigheid en hetzelfde lef. In `penGescoord` zit dus zowel een
  // strafschopdoelpunt (dat óók bij zijn doelpunten telt) als een rake strafschop uit een reeks
  // (die nooit bij de doelpunten telt — de reeks staat buiten de score).
  let penGenomen = 0, penGescoord = 0;
  const rows = [];
  for (const m of doneList) {
    const pl = findPlayer(m);
    if (!pl) continue;
    // No-show: telt als afwezig i.p.v. geselecteerd — zelfde semantiek als loadStats().
    if (pl.absent) { absent++; continue; }
    if (pl.number) number = pl.number;
    if (pl.line) pos = pl.line;
    const mins = calcMinutes(m);
    const pms = mins[pl.id] ? mins[pl.id].ms : 0;
    let g = 0, a = 0, y = 0, r = 0;
    for (const e of m.events) {
      if (e.type === 'goal_us' && e.playerId === pl.id) g++;
      if (e.type === 'penalty_us' && e.scored && e.playerId === pl.id) g++;
      // Zelfde assist-criterium als loadStats() (enkel bij een echt doelpunt) — anders spreken
      // het seizoensoverzicht en het spelerdetail elkaar tegen.
      if (e.type === 'goal_us' && e.assistId === pl.id) a++;
      if (e.type === 'yellow_card' && e.playerId === pl.id) y++;
      if (e.type === 'red_card' && e.playerId === pl.id) r++;
      if (e.type === 'penalty_us' && e.playerId === pl.id) { penGenomen++; if (e.scored) penGescoord++; }
    }
    // En de strafschoppen uit een reeks na de wedstrijd.
    for (const s of shootoutSchoten(m)) {
      if (s.ploeg === 'us' && s.playerId === pl.id) { penGenomen++; if (s.raak) penGescoord++; }
    }
    squad++;
    // keeperByQ i.p.v. eind-positie — zie toelichting bij wasKeeperAtAll().
    const wasKeeper = m.keeperByQ && Object.keys(m.keeperByQ).length ? wasKeeperAtAll(m, pl.id) : pl.line === 'Doel';
    if (pms > 0) { mp++; ms += pms; if (wasKeeper) { keeperApps++; if (m.scoreThem === 0) cs++; } }
    goals += g; assists += a; yc += y; rc += r;
    rows.push({ m, pms, g, a, y, r });
  }
  // 2b (A/B-ploegen): dagen waarop de speler in de selectie van een wedstrijd van deze ploeg zat
  // (doneList bevat enkel wedstrijden waarin hij effectief geselecteerd was). Een ✗ op zo'n dag
  // telt niet als afwezig — hij speelde dan bij de A/B-tegenhanger.
  const selectedDates = new Set(doneList.map(m => m.date || ''));
  for (const m of all.filter(m2 => m2.status === 'done' && !m2.tournamentId && inTeam(m2) && seasonOf(m2) === playerDetailSeason && kindMatches(m2))) {
    // Zelfde uitzondering als in loadStats: reden "speelt elders" is geen gemiste wedstrijd.
    const rec = (m.absentPlayers || []).map(a => typeof a === 'string' ? { name: a, rosterId: null } : a)
      .find(ab => rosterId ? ab.rosterId === rosterId : (ab.name || '').trim() === name);
    if (rec && rec.reason !== 'elders' && !selectedDates.has(m.date || '')) absent++;
  }
  const pct = (squad + absent) ? Math.round(squad / (squad + absent) * 100) : null;
  // (De tornooitelling zelf staat bovenaan, samen met de seizoenslijst — zie myTournaments.)
  // Gastoptredens bij ANDERE ploegen opsporen — enkel via het stabiele rosterId (dat blijft
  // ploeg-overschrijdend hetzelfde bij een echte gastbeurt, zie addGuestsModal in wizard-prep.js);
  // op naam matchen zou spelers met dezelfde naam bij onverwante ploegen foutief kunnen samenvoegen.
  // Enkel wedstrijden van ploegen die dit toestel al lokaal kent zijn hier zichtbaar.
  const guestElsewhere = {};
  if (rosterId && playerDetailTeamName) {
    for (const m of all) {
      if (m.status !== 'done' || m.tournamentId || m.teamName === playerDetailTeamName) continue;
      if (seasonOf(m) !== playerDetailSeason || !kindMatches(m)) continue;
      if ((m.players || []).some(p => p.rosterId === rosterId)) guestElsewhere[m.teamName] = (guestElsewhere[m.teamName] || 0) + 1;
    }
  }
  const guestEntries = Object.entries(guestElsewhere).sort((a, b) => b[1] - a[1]);
  // Carrière bij eerdere ploegen (na een formele overzetting via de eigenaarstool): matcht op
  // globalId, over ALLE seizoenen heen (i.t.t. guestElsewhere hierboven, dat bewust wél per
  // seizoen filtert — een overzetting hoort juist bij een seizoensovergang). Enkel wedstrijden
  // van na de invoering van globalId (geen retroactieve koppeling) en enkel ploegen die dit
  // toestel al lokaal kent zijn hier zichtbaar.
  const careerElsewhere = {};
  if (resolvedGlobalId && playerDetailTeamName) {
    for (const m of all) {
      if (m.status !== 'done' || m.tournamentId || m.teamName === playerDetailTeamName) continue;
      const p = (m.players || []).find(x => x.globalId === resolvedGlobalId);
      if (!p) continue;
      const mins = calcMinutes(m);
      if (!(mins[p.id] && mins[p.id].ms > 0)) continue;
      const c = careerElsewhere[m.teamName] || (careerElsewhere[m.teamName] = { mp: 0, goals: 0, assists: 0 });
      c.mp++;
      for (const e of m.events) {
        if ((e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored)) && e.playerId === p.id) c.goals++;
        if (e.type === 'goal_us' && e.assistId === p.id) c.assists++;
      }
    }
  }
  const careerEntries = Object.entries(careerElsewhere).sort((a, b) => b[1].mp - a[1].mp);
  el.innerHTML = filterBar + `
    <div class="card">
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:20px;font-weight:800">${esc(name)}</div>
        <div style="font-size:13px;color:var(--txt2)">${number ? ('Rugnr. ' + esc(number) + (pos ? ' · ' : '')) : ''}${pos ? esc(pos) : ''}</div>
        ${playerDetailTeamName ? `<div style="font-size:12px;color:var(--txt2);margin-top:6px">Statistieken voor wedstrijden bij <b>${esc(playerDetailTeamName)}</b></div>` : ''}
      </div>
      <div class="stat-big">
        <div class="stat-box"><div class="v">${mp}</div><div class="l">Gespeeld</div></div>
        <div class="stat-box"><div class="v">${goals}</div><div class="l">Doelpunten</div></div>
        <div class="stat-box"><div class="v">${assists}</div><div class="l">Assists</div></div>
      </div>
      <div class="stat-big" style="margin-top:10px">
        <div class="stat-box"><div class="v">${playedMin(ms)}'</div><div class="l">Speeltijd</div></div>
        <div class="stat-box"><div class="v">${mp ? Math.round(ms / mp / 60000) : 0}'</div><div class="l">Gem./match</div></div>
        <div class="stat-box"><div class="v">${pct != null ? pct + '%' : '–'}</div><div class="l">Geselecteerd</div></div>
      </div>
    </div>
    ${tournamentBlock}
    ${guestEntries.length ? `<div class="sec">${icI(IC.link)} Ook gastspeler bij</div><div class="card">${guestEntries.map(([t, c]) => `<div class="stat-row"><span style="flex:1">${esc(t)}</span><span style="font-weight:800">${c} ${c===1?'wedstrijd':'wedstrijden'}</span></div>`).join('')}</div>` : ''}
    ${careerEntries.length ? `<div class="sec">${icI(IC.swap)} Carrière — eerder bij</div><div class="card">${careerEntries.map(([t, c]) => `<div class="stat-row"><span style="flex:1">${esc(t)}</span><span style="color:var(--txt2);font-size:13px">${c.mp} ${c.mp===1?'wedstrijd':'wedstrijden'}${c.goals?` · ${c.goals} ${icI(IC.ball)}`:''}${c.assists?` · ${c.assists} ${icI(IC.assist)}`:''}</span></div>`).join('')}</div>` : ''}
    ${/* Strafschoppen: tijdens de wedstrijd en in een reeks samengeteld. Enkel tonen wie er ooit
         één nam — anders staat er bij elke speler een lege rubriek. */ ''}
    ${penGenomen ? `<div class="sec">${icI(IC.penalty)} Strafschoppen</div><div class="card">
      <div class="stat-row"><span style="flex:1">Genomen</span><span style="font-weight:800">${penGenomen}</span></div>
      <div class="stat-row"><span style="flex:1">Gescoord</span><span style="font-weight:800">${penGescoord} <small style="color:var(--txt2);font-weight:400">van de ${penGenomen}</small></span></div>
      <p style="font-size:12px;color:var(--txt2);margin:6px 0 0">Tijdens de wedstrijd en in een strafschoppenreeks samengeteld.</p>
    </div>` : ''}
    ${(yc || rc) ? `<div class="sec">${icI(IC.cardY)} Kaarten</div><div class="card"><div class="stat-row"><span style="flex:1">Gele kaarten</span><span style="font-weight:800">${yc}</span></div><div class="stat-row"><span style="flex:1">Rode kaarten</span><span style="font-weight:800">${rc}</span></div></div>` : ''}
    ${keeperApps ? `<div class="sec">${icI(IC.save)} Als doelman</div><div class="card"><div class="stat-row"><span style="flex:1">Wedstrijden in doel</span><span style="font-weight:800">${keeperApps}</span></div><div class="stat-row"><span style="flex:1">Clean sheets</span><span style="font-weight:800">${cs}</span></div></div>` : ''}
    <div class="sec">${icI(IC.ball)} Wedstrijden</div>
    <div class="card">${rows.map(r => `<div class="stat-row" style="cursor:pointer" onclick="go('detail','${r.m.id}')">
      <span style="flex:1">
        <b style="font-size:14px">${esc(matchTitle(r.m))}</b>
        <small style="color:var(--txt2);display:block">${matchWhen(r.m)} · ${scoreTxt(r.m)}${r.g ? ` · ${icI(IC.goal)}×${r.g}` : ''}${r.a ? ` · ${icI(IC.assist)}×${r.a}` : ''}${r.y ? ` · ${icI(IC.cardY).repeat(r.y)}` : ''}${r.r ? ` · ${icI(IC.cardR).repeat(r.r)}` : ''}</small>
      </span>
      <span style="font-weight:800">${r.pms > 0 ? playedMin(r.pms) + "'" : '–'}</span>
    </div>`).join('')}</div>`;
}

// ===================== SETUP / SETTINGS (club-branding) =====================
function renderSettings(isFirst) {
  return `
  <div class="hdr"><button class="back" onclick="go(_settingsFrom||'home')">‹</button><h1>Instellingen</h1></div>
  <div class="content">
    ${(cloudReady && activeTeamId && isAdmin) ? `<p style="font-size:12px;color:var(--txt2);margin-bottom:14px">Kijkers uitnodigen, beheren of verwijderen? Dat doe je op het <b>ploegscherm</b>, bij "Mensen met toegang".</p>` : ''}
    <div class="sec">Weergave</div>
    <div class="card">
      <div><b style="font-size:15px">${icI(IC.moon)} Donkere modus</b><div style="font-size:12px;color:var(--txt2);margin-bottom:9px">Rustiger scherm, handig 's avonds. Met <b>Automatisch</b> volgt de app de instelling van je toestel${darkPref()==='auto'?` — nu ${systemDark()?'donker':'licht'}`:''}.</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${[['0','Uit'],['1','Aan'],['auto','Automatisch']].map(([v,l]) => `<span class="start-chip ${darkPref()===v?'on':''}" onclick="setDarkPref('${v}')">${l}</span>`).join('')}</div></div>
    </div>
    ${('Notification' in window) ? `<div class="sec">Meldingen</div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px"><div style="flex:1"><b style="font-size:15px">${icI(IC.bell)} Melding bij doelpunt</b><div style="font-size:12px;color:var(--txt2)">Ook als de app op de achtergrond staat. Op iPhone/iPad enkel als de app op je beginscherm staat (iOS 16.4+).</div></div>
        <span class="start-chip ${bgNotifOn()?'on':''}" onclick="toggleBgNotif()">${bgNotifOn()?'Aan':'Uit'}</span></div>
    </div>` : ''}
    ${currentUser ? `<div class="sec">Account</div>
    <div class="card">
      <p style="font-size:15px;font-weight:700;margin-bottom:2px">${esc(currentUser.displayName || (isGuest ? 'Gast' : currentUser.email))}</p>
      <p style="font-size:12px;color:var(--txt2);margin-bottom:12px">${isGuest ? 'Je kijkt mee als gast, zonder eigen account.' : esc(currentUser.email)}</p>
      ${(!isGuest && currentUser.email && !currentUser.emailVerified) ? `
      <div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24;margin-bottom:12px;text-align:left">
        ${/* Twee dingen die deze tekst moet overleven. (1) Ze wordt ook gelezen door iemand die al
              ploegbeheerder is — de meeste trainers zijn dat, want ze komen binnen via een uitnodigingslink
              en worden daarna gepromoveerd; "zonder bevestiging kan je niet aangesteld worden" klonk voor
              hen als een dreiging dat ze rechten verliezen. (2) Accounts van vóór v0.37.0 hebben nooit een
              bevestigingsmail gekregen, dus "klik de link in de mail die we je stuurden" verwees hen naar
              iets dat niet bestaat. Geen datumlogica om die twee groepen te scheiden: één tekst die voor
              beide klopt is hier minder fragiel. */ ''}
        ${icI(IC.warn)} <b>E-mailadres nog niet bevestigd.</b> Klik de link in de bevestigingsmail, of stuur
        ze hieronder opnieuw als je er geen gekregen hebt — bestond je account al vóór deze stap, dan is er
        nooit een verstuurd. Wat je nu al bent, blijf je; bevestigen is nodig om later nieuw aangesteld te
        worden als ploeg- of clubbeheerder, en het laat anderen zien dat dit adres echt van jou is.</div>
      <button class="btn btn-pale" onclick="checkVerifiedNow(this)">${icI(IC.done)} Ik heb de link aangeklikt</button>
      <button class="btn btn-pale" style="margin-top:8px;margin-bottom:8px" onclick="resendVerification(this)">${icI(IC.mail)} Bevestigingsmail opnieuw sturen</button>` : ''}
      <button class="btn btn-pale" onclick="confirmChangeName()">${icI(IC.edit)} Naam wijzigen</button>
      ${isGuest ? '' : `
      <button class="btn btn-pale" style="margin-top:8px" onclick="confirmChangeEmail()">${icI(IC.mail)} E-mailadres wijzigen</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="confirmChangePassword()">${icI(IC.lock)} Wachtwoord wijzigen</button>`}
      <button class="btn btn-gray" style="margin-top:8px" onclick="cloudLogout()">Afmelden</button>
      ${isGuest ? '' : `<button class="btn btn-red" style="margin-top:8px" onclick="confirmDeleteAccount()">Account verwijderen</button>`}
    </div>` : ''}
    <div class="sec">Over de app</div>
    <div class="card">
      <div class="stat-row"><span style="color:var(--txt2)">Versie</span><span style="font-weight:700">${APP_VERSION}</span></div>
      <button class="btn btn-pale" style="margin-top:10px" onclick="go('handleiding')">${icI(IC.clipboard)} Handleiding</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="reportProblem()">${icI(IC.mail)} Probleem melden</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="showPrivacyModal()">${icI(IC.shieldLock)} Privacyverklaring</button>
    </div>
    ${/* Heette "Back-up & herstel", maar dat botste met de Prullenmand: het één is overzetten naar
          een ander toestel, het ander is terughalen wat je verwijderde. Twee knoppen die allebei
          naar "iets van vroeger" klonken. De naam zegt nu wat het is — een bestand met wat er op
          DIT toestel staat — en verwijst door voor het andere geval. */ ''}
    ${canManage() ? `<div class="sec">Dit toestel</div>
    <div class="card">
      <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Een bestand met de wedstrijden en spelers die nu op dit toestel staan. Bedoeld om over te zetten naar een ander toestel.</p>
      <p style="font-size:12px;color:var(--txt2);margin-bottom:12px">Iets per ongeluk verwijderd? Dat haal je terug via de <b>Prullenmand</b> op het ploegscherm, niet hier.</p>
      ${(() => { const t = localStorage.getItem('voetbal_last_backup'); return `<p style="font-size:12px;color:${t?'var(--txt2)':'var(--org2)'};margin-bottom:10px">${t?('Laatste bestand: '+fmtDate(+t)):`${icI(IC.warn)} Nog geen bestand gedownload.`}</p>`; })()}
      <button class="btn btn-pale" onclick="exportBackup()">${icI(IC.download)} Bestand downloaden</button>
      <label class="file-btn" style="margin-top:8px">${icI(IC.upload)} Bestand inlezen<input type="file" accept="application/json,.json" onchange="importBackup(this)"></label>
    </div>` : ''}
  </div>`;
}

// Bevestigingsmail opnieuw versturen. Knop wordt meteen uitgeschakeld: Firebase knijpt herhaalde
// aanvragen af, en twee tikken zou enkel een tweede mail-die-niet-komt opleveren.
async function resendVerification(btn) {
  if (!currentUser || currentUser.isAnonymous) return;
  const zet = (tekst, uit) => { if (!btn) return; btn.disabled = uit; btn.style.opacity = uit ? '.6' : ''; btn.innerHTML = icI(IC.mail) + ' ' + tekst; };
  zet('Bezig...', true);
  try {
    await currentUser.sendEmailVerification();
    showToast('Bevestigingsmail verstuurd naar ' + currentUser.email + '. Kijk ook in je spammap.', 'ok');
    zet('Mail verstuurd', true);
  } catch (e) {
    showToast(e && e.code === 'auth/too-many-requests'
      ? 'Er is er net al één verstuurd. Wacht even en kijk in je spammap.'
      : 'Versturen mislukt. Probeer het later opnieuw.', 'err');
    zet('Bevestigingsmail opnieuw sturen', false);
  }
}
// Of een adres bevestigd is, staat op twee plaatsen: in het gebruikersrecord (dat bepaalt of de
// herinnering verdwijnt) én in het token dat de app bij het aanmelden kreeg (dat bepaalt of de
// databank een wijziging aanvaardt). Klik je de link aan in je mailprogramma, dan lopen die twee
// niet mee: `reload()` verse't het record, maar het token blijft zeggen dat je niet bevestigd bent
// tot het vernieuwd wordt. Zonder die vernieuwing zou de herinnering verdwijnen terwijl de databank
// de bijwerking stil weigert — en bleef je onaanstelbaar. Vandaar `getIdToken(true)` ertussen.
async function refreshEmailVerified() {
  if (!currentUser || currentUser.isAnonymous || currentUser.emailVerified) return false;
  try {
    await currentUser.reload();
    if (!currentUser.emailVerified) return false;
    try { await currentUser.getIdToken(true); } catch (e) {}
    writeUserEmailIndex(currentUser);
    // Ook de ledeninformatie van de actieve ploeg, want daar leest de ploegbeheerder het.
    if (activeTeamId && userTeams && userTeams[activeTeamId]) writeMemberInfo(activeTeamId, userTeams[activeTeamId]);
    if (view === 'settings' || view === 'setup') render();
    return true;
  } catch (e) { return false; }
}
// Terugkomen uit je mailprogramma is genoeg: navigeren naar Instellingen hoeft niet. Doet niets
// zodra het adres bevestigd is (de functie stopt dan meteen), dus dit kost verder niets.
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshEmailVerified(); });
// Knop in de herinnering, voor wie niet wil wachten of niet ziet dat het al goed zit.
async function checkVerifiedNow(btn) {
  if (btn) { btn.disabled = true; btn.style.opacity = '.6'; btn.innerHTML = icI(IC.timer) + ' Bezig...'; }
  const ok = await refreshEmailVerified();
  if (ok) { showToast('Je e-mailadres is bevestigd. Bedankt!', 'ok'); return; }
  showToast('Nog niet bevestigd. Klik eerst de link in de mail aan; die kan even onderweg zijn.', 'err');
  if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.innerHTML = icI(IC.done) + ' Ik heb de link aangeklikt'; }
}
function showPrivacyModal() {
  openModal(`<h3>${icI(IC.shieldLock)} Privacyverklaring</h3>
    <div style="font-size:13px;color:var(--txt2);line-height:1.7;text-align:left;max-height:60vh;overflow-y:auto;padding-right:4px">
      <p style="margin-bottom:10px"><b style="color:var(--txt)">Verwerkingsverantwoordelijke</b><br>
      Tim Buyse<br>
      <a href="mailto:${FEEDBACK_EMAIL}" style="color:var(--grn)">Contacteer ons via e-mail</a></p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Doel van de app</b><br>
      Match Delegate is een interne beheersapp voor sportploegen. Ze laat beheerders toe wedstrijden op te volgen, speelminuten bij te houden en spelersgegevens te beheren. De app is uitsluitend bedoeld voor intern gebruik.</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Welke gegevens verwerken we?</b><br>
      • E-mailadres en naam van gebruikers (accounts)<br>
      • Spelersgegevens: naam, rugnummer, positie, notities<br>
      • Wedstrijdgegevens: speelminuten, doelpunten, assists, gele en rode kaarten<br>
      • Teamlidmaatschappen en rollen (beheerder / kijker)</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Rechtsgrond</b><br>
      Gegevens worden verwerkt op basis van toestemming. Gebruikers registreren zich vrijwillig en voegen zelf spelersgegevens toe.</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Bewaartermijn</b><br>
      Gegevens worden bewaard zolang een account actief is. Bij verwijdering van een account worden de gekoppelde gegevens gewist.</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Verwerkers</b><br>
      De app maakt gebruik van <b>Firebase</b> (Google LLC) voor authenticatie en gegevensopslag. Gegevens worden opgeslagen op servers van Google binnen de Europese Economische Ruimte. Google treedt op als verwerker conform de GDPR.</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Jouw rechten</b><br>
      Als betrokkene heb je het recht op inzage, correctie en verwijdering van je gegevens. Je kunt je account zelf verwijderen via Instellingen → Account verwijderen. Voor andere vragen of verzoeken kun je <a href="mailto:${FEEDBACK_EMAIL}" style="color:var(--grn)">contact opnemen via e-mail</a>.</p>

      <p style="margin-bottom:4px"><b style="color:var(--txt)">Klachten</b><br>
      Je hebt het recht een klacht in te dienen bij de Gegevensbeschermingsautoriteit (GBA): <a href="https://www.gegevensbeschermingsautoriteit.be" style="color:var(--grn)" target="_blank">gegevensbeschermingsautoriteit.be</a></p>
    </div>
    <button class="btn btn-gray" style="margin-top:14px" onclick="closeModal()">Sluiten</button>`);
}
// ===================== HANDLEIDING =====================
const HANDLEIDING_PAGINAS = [
  {
    titel: 'De app installeren',
    inhoud: `
      <p>Surf naar <a href="https://timbuyse.github.io/MatchDelegate/" target="_blank" style="color:var(--grn)">timbuyse.github.io/MatchDelegate</a> om de app te openen in je browser.</p>
      <div class="sec">iPhone / iPad (iOS)</div>
      <ol class="hdl-list">
        <li>Open de app in <b>Safari</b>.</li>
        <li>Tik onderaan op het <b>deelknopje</b> (vierkantje met pijl omhoog).</li>
        <li>Kies <b>'Zet op beginscherm'</b>.</li>
        <li>Tik op <b>'Voeg toe'</b>.</li>
      </ol>
      <div class="sec">Android</div>
      <ol class="hdl-list">
        <li>Open de app in <b>Chrome</b>.</li>
        <li>Tik rechtsboven op de <b>drie puntjes</b> (⋮).</li>
        <li>Kies <b>'Toevoegen aan startscherm'</b>.</li>
        <li>Tik op <b>'Toevoegen'</b>.</li>
      </ol>
      <p class="hdl-tip">Tip: door de app te installeren laad je ze sneller en heb je een betere ervaring dan via de browser.</p>
    `
  },
  {
    titel: 'Account aanmaken & aanmelden',
    img: 'handleiding/screenshots/01_aanmelden.png',
    img2: 'handleiding/screenshots/03_homescherm.png',
    inhoud: `
      <div class="sec">Account aanmaken</div>
      <ol class="hdl-list">
        <li>Open Match Delegate en tik op het tabblad <b>'Registreren'</b>.</li>
        <li>Vul je <b>e-mailadres</b> en een <b>wachtwoord</b> in.</li>
        <li>Tik op <b>'Registreren'</b>.</li>
        <li>Je bent meteen aangemeld.</li>
        <li>Je krijgt een <b>bevestigingsmail</b>: klik die link één keer aan. De app werkt ook zonder,
          maar zolang je adres niet bevestigd is, kan je niet als ploeg- of clubbeheerder aangesteld
          worden. Mail niet gevonden? Kijk in je spammap, of stuur ze opnieuw via
          <b>Instellingen → Account</b>.</li>
      </ol>
      <div class="sec">Aanmelden</div>
      <ol class="hdl-list">
        <li>Open Match Delegate — het <b>'Aanmelden'</b>-tabblad is standaard actief.</li>
        <li>Vul je <b>e-mailadres</b> en <b>wachtwoord</b> in.</li>
        <li>Tik op <b>'Aanmelden'</b>.</li>
      </ol>
      <p class="hdl-tip">Wachtwoord vergeten? Tik op <b>'Wachtwoord vergeten?'</b> en volg de instructies per e-mail.</p>
      <div class="sec">Waar je terechtkomt</div>
      <p>Volg je meer dan één ploeg, dan land je op <b>'Jouw ploegen'</b>: je ploegen gegroepeerd per club, met achter elke ploeg of je er beheerder of kijker van bent. Tik een ploeg aan en je zit in die ploeg — het <b>ploegscherm</b>, met de tegels en de eerstvolgende wedstrijd.</p>
      <p style="margin-top:10px">Van ploeg wisselen doe je met de knop <b>'Ploeg'</b> linksboven op het ploegscherm; die brengt je terug naar 'Jouw ploegen'. Het <b>tandwiel</b> rechtsboven staat op elk scherm en gaat naar je eigen instellingen: donkere modus, meldingen en je account.</p>
    `
  },
  {
    titel: 'Rollen in de app',
    img: 'handleiding/screenshots/26_jouw_ploegen.png',
    inhoud: `
      <p>Match Delegate is opgebouwd rond <b>clubs</b>: een club groepeert meerdere ploegen. Op <b>'Jouw ploegen'</b> staan jouw ploegen dan ook onder hun club, met achter elke ploeg welke rol je er hebt. De rollen:</p>
      <div class="hdl-rol"><b>Kijker</b><span>Een ploeg volgen en live wedstrijden bekijken</span></div>
      <div class="hdl-rol"><b>Ploegbeheerder</b><span>Beheert één ploeg: wedstrijden aanmaken en live bijhouden, spelers beheren, leden uitnodigen (ook trainer/afgevaardigde genoemd)</span></div>
      <div class="hdl-rol"><b>Clubbeheerder</b><span>Beheert een volledige club: ploegen aanmaken en archiveren, trainers uitnodigen, spelers overzetten tussen ploegen en het clublogo instellen</span></div>
      <p style="margin-top:14px">Na registratie start je als <b>kijker</b>. Je kan daarna:</p>
      <ul class="hdl-list">
        <li>Een ploeg volgen via een uitnodiging (link, QR-code of code).</li>
        <li>Ploegbeheer aanvragen bij een ploegbeheerder van een ploeg die je al volgt.</li>
      </ul>
      <p style="margin-top:14px">Nieuwe ploegen worden niet meer los aangemaakt: dat doet de <b>clubbeheerder</b> binnen zijn club. Wil je een ploeg opstarten? Contacteer de clubbeheerder — die maakt de ploeg aan en nodigt jou uit als ploegbeheerder.</p>
      <p style="margin-top:14px">Daarnaast bestaan er twee bijzondere rollen die de meeste gebruikers nooit zelf zullen zijn:</p>
      <div class="hdl-rol"><b>Eigenaar</b><span>Systeembreed, één per app-installatie — maakt clubs aan en stelt clubbeheerders aan</span></div>
      <div class="hdl-rol"><b>Gast</b><span>Volgt enkel live wedstrijden via een gastlink, zonder eigen account</span></div>
    `
  },
  {
    titel: 'Als kijker',
    img: 'handleiding/screenshots/04_homescherm_kijker.png',
    inhoud: `
      <p>Als kijker zie je het homescherm met de tegels <b>Wedstrijden</b>, <b>Ploeg</b>, <b>Tornooien</b>, <b>Statistieken</b> en <b>Agenda</b>. Rechtsboven staat de knop <b>'Kijken'</b>. Je kan niets wijzigen.</p>
      <p>Bij <b>Statistieken</b> zie je de secties die de beheerder heeft vrijgegeven; de overige statistieken en het individuele spelersdetail blijven voorbehouden aan ploegbeheerders.</p>
      <p>Bij een wedstrijd zie je onder <b>Planning</b> de melding dat de opstelling en de geplande wissels enkel voor ploegbeheerders zijn. Dat geldt vóór én tijdens de wedstrijd: wie waar begint en welke wissels klaarstaan, blijft bij de trainer. Wat er <b>gebeurd</b> is — de score, de events en het verslag achteraf — kan je gewoon volgen.</p>
      <div class="sec">Een ploeg volgen</div>
      <p>De beheerder deelt een uitnodiging als <b>link</b>, <b>QR-code</b> of <b>code van 6 tekens</b> (letters en cijfers).</p>
      <ul class="hdl-list">
        <li><b>Via link:</b> tik op de link. De ploeg komt vanzelf in je lijst zodra je aangemeld bent.</li>
        <li><b>Via QR-code:</b> scan de code — verder hetzelfde als bij een link.</li>
        <li><b>Via code:</b> tik op <b>'Ploeg volgen via code'</b> → voer de code van 6 tekens in.</li>
      </ul>
      <div class="sec">Live wedstrijd bekijken</div>
      <ol class="hdl-list">
        <li>Ga naar <b>'Wedstrijden'</b> en tik op een lopende wedstrijd.</li>
        <li>Je ziet de score en alle events in real time.</li>
      </ol>
      <p class="hdl-tip">Match Delegate stuurt momenteel geen pushmeldingen als de app gesloten is. Houd de app open tijdens de wedstrijd om alles live mee te volgen.</p>
    `
  },
  {
    titel: 'Ploegbeheer aanvragen',
    img: 'handleiding/screenshots/13_cobeheer_aanvragen.png',
    inhoud: `
      <p>Ben je kijker en wil je wedstrijden kunnen beheren? Vraag ploegbeheer aan:</p>
      <ol class="hdl-list">
        <li>Tik rechtsboven op <b>'Kijken'</b>, of op de tegel <b>'Ploeg'</b>. Je komt op het ploegscherm.</li>
        <li>Tik onderaan, bij <b>'Meedoen'</b>, op <b>'Vraag ploegbeheer aan'</b>.</li>
        <li>De beheerder krijgt een melding en keurt je aanvraag goed of af.</li>
        <li>Zodra goedgekeurd, krijg je toegang als ploegbeheerder.</li>
      </ol>
      <p class="hdl-tip">Je kan enkel ploegbeheerder worden van een ploeg waarvan je al kijker bent.</p>
    `
  },
  {
    titel: 'Ploeg & spelers beheren',
    img: 'handleiding/screenshots/10_ploeg_bewerken.png',
    inhoud: `
      <p>Via de tegel <b>'Ploeg'</b> op het homescherm kom je op het <b>ploegscherm</b>. Daar staat alles over deze ploeg bij elkaar: de spelers, de mensen met toegang en de ploeg zelf. Zet bovenaan <b>'Bewerken'</b> aan om iets te wijzigen:</p>
      <ul class="hdl-list">
        <li><b>Ploegnaam</b>.</li>
        <li><b>Ploegverantwoordelijken</b> en <b>trainers</b> — zoveel als je er hebt. Vul een naam in en tik op <b>'+ Nog een trainer'</b> of <b>'+ Nog een ploegverantwoordelijke'</b> voor de volgende; met het rode kruisje haal je er één weg. Wie hier staat, kan je per wedstrijd en per tornooi aanvinken.</li>
        <li><b>Spelers</b> — rugnummer, voornaam, familienaam en voorkeurspositie. Sorteer op nummer of naam. Verwijder via het rode kruisje.</li>
        <li><b>Kant bij een verdediger</b> — kies je <b>Verdediging</b> als voorkeurspositie, dan kan je er <b>Centraal</b>, <b>Links</b> of <b>Rechts</b> bij zetten. Dat staat bij zijn naam in de selectie, zodat je hem bij de opstelling op de juiste flank zet.</li>
        <li><b>Standaard voor nieuwe wedstrijden</b> — stel per ploeg in met welke <b>vorm</b> (bv. 8v8) en welke <b>formatie</b> je meestal speelt, en ook het <b>aantal blokken</b> en de <b>duur per blok</b>. Een U8 speelt geen vier kwarten van een kwartier, en zo hoef je dat niet bij elke wedstrijd opnieuw bij te stellen. Staat jouw speelduur niet in de lijst, kies dan <b>'Vrij…'</b> en tik het aantal minuten in.</li>
      </ul>
      <p class="hdl-tip">Een nieuwe wedstrijd én een ingelezen kalender nemen die instellingen over; per wedstrijd kan je ze nog altijd wijzigen. Bestaande ploegen zonder instelling houden vier kwarten van 15 minuten tot je het aanpast.</p>
    `
  },
  {
    titel: 'Wedstrijd aanmaken',
    img: 'handleiding/screenshots/06_nieuwe_wedstrijd_stap1.png',
    inhoud: `
      <p>Tik op de grote blauwe knop <b>'+ Nieuwe wedstrijd'</b> op het homescherm. De wizard heeft 3 stappen:</p>
      <div class="sec">Stap 1 — Wedstrijd</div>
      <ul class="hdl-list">
        <li><b>Tegenstander</b>, <b>Datum</b> en <b>Startuur</b>.</li>
        <li><b>Thuis of uit</b>: kies Thuismatch of Uitmatch.</li>
        <li><b>Format</b>: bv. 8 tegen 8, 11 tegen 11.</li>
        <li><b>Aantal blokken</b>: bv. 4 kwarten, 2 helften.</li>
        <li><b>Duur van een blok</b>: speelduur in minuten.</li>
        <li>Optioneel: tik op <b>'+ Meer details'</b> voor scheidsrechter, locatie, trainer(s), ploegverantwoordelijke(n), enz. Bij de trainers en de ploegverantwoordelijken vink je aan wie er die wedstrijd bij is — er mogen er meerdere zijn, en wie niet in de ploeg staat typ je in het vrije veld eronder.</li>
      </ul>
      <p class="hdl-tip">Wil je plannen zonder opstelling? Tik op <b>'Plannen zonder selectie'</b>.</p>
    `
  },
  {
    titel: 'Kalender importeren',
    img: 'handleiding/screenshots/24_kalender_importeren.png',
    inhoud: `
      <p>Staat de kalender van je reeks al ergens klaar, dan hoef je ze niet wedstrijd per wedstrijd in te tikken. Ga naar <b>Wedstrijden</b> en tik op <b>'Kalender importeren'</b>.</p>
      <div class="sec">Welk bestand?</div>
      <ul class="hdl-list">
        <li>Een <b>agenda</b> (<b>.ics</b>) — op Foot24 staat bij je reeks een knop om de kalender als agenda te downloaden. Dit is de gemakkelijkste weg: de app haalt er zelf datum, uur, tegenstander, thuis of uit en het adres van het terrein uit.</li>
        <li>Een <b>tabel</b> (<b>.xlsx</b> of <b>.csv</b>) — bijvoorbeeld een kalender die je club zelf rondstuurt. Foot24 biedt enkel de agenda aan, dus hiervoor heb je een andere bron nodig. De app raadt zelf welke kolom de datum, het uur en de tegenstander bevat; onder <b>'Kolommen van het bestand'</b> zet je dat recht als ze het verkeerd voorstelt.</li>
      </ul>
      <div class="sec">Voor je importeert</div>
      <ul class="hdl-list">
        <li>Bovenaan kies je één keer de <b>ploeg</b>, het <b>format</b>, het <b>aantal blokken</b>, de <b>blokduur</b> en de <b>soort</b>. Die staan in geen enkele kalender, dus ze gelden voor alles wat je nu inleest — per wedstrijd blijven ze nadien aanpasbaar.</li>
        <li>Speelt je ploeg in twee delen (A en B), dan hoort daar een <b>ploeg-label</b> bij. De app leest dat uit de reeksnaam in het bestand ('U11 A' wordt label <b>A</b>). Lees je daarna de kalender van de andere ploeg in, wijzig dan enkel dat veld — zo blijven de twee wedstrijden van dezelfde dag netjes gescheiden.</li>
        <li>In de lijst vink je aan wat erbij mag. Tik op het bolletje <b>Thuis</b> of <b>Uit</b> om dat om te zetten als het bestand het verkeerd heeft.</li>
        <li>Wedstrijden die al in de app staan, dragen <b>'Staat er al'</b> en zijn <b>niet</b> aangevinkt. Vink je er toch een aan, dan worden alleen de tegenstander, de datum, het uur, thuis/uit en de plaats bijgewerkt — je selectie, je opstelling en je plan blijven staan. Handig bij een verschoven kalender.</li>
      </ul>
      <p class="hdl-tip">Een bondssite schrijft clubnamen voluit ('SPORTKRING ROESELARE') waar jij ze kort intikte ('SK Roeselare'). De app herkent dat als dezelfde wedstrijd en zet dat erbij. Past er die dag geen enkele wedstrijd bij, maar staat er wel één, dan krijg je een waarschuwing ('Ook Olsa Brakel (B) op deze dag') en blijft de regel aangevinkt — jij beslist.</p>
      <p>Er wordt niets bewaard tot je onderaan op de groene knop tikt. Reclame en aankondigingen die in zo'n agenda meekomen, laat de app zelf vallen.</p>
    `
  },
  {
    titel: 'Meerdere wedstrijden aanpassen',
    img: 'handleiding/screenshots/25_meerdere_aanpassen.png',
    inhoud: `
      <p>Moet bij tien wedstrijden hetzelfde veranderen — bijvoorbeeld het ploeg-label van <b>'B'</b> naar <b>'Zwart'</b> — dan hoef je die niet één per één te openen. Ga naar <b>Wedstrijden</b> en tik op <b>'Meerdere aanpassen'</b>.</p>
      <ol class="hdl-list">
        <li><b>Zoek eerst</b> in de zoekbalk om je lijst korter te maken, bijvoorbeeld op de tegenstander of het label.</li>
        <li><b>Vink aan</b> welke wedstrijden mee moeten. <b>'Alles in de lijst'</b> volgt je zoekterm, dus wat je weggefilterd hebt, wordt ook niet aangevinkt.</li>
        <li>Tik op <b>'Aanpassen…'</b> en kies <b>één</b> ding: ploeg-label, soort wedstrijd, terrein, truikleur, trainer of ploegverantwoordelijke. Op <b>geplande</b> wedstrijden ook de wedstrijdvorm, het aantal blokken en de blokduur.</li>
        <li>Je krijgt een <b>nakijkscherm</b>: bij hoeveel wedstrijden wat verandert, met de lijst erbij en per wedstrijd de waarde die er nu staat. Wat al goed stond, wordt overgeslagen.</li>
      </ol>
      <p class="hdl-tip">Fout gedaan? Bovenaan de wedstrijdenlijst staat daarna <b>'Ongedaan maken'</b>, dat de oude waarden terugzet. Eén stap terug, tot een dag na de wijziging, en enkel bij de ploeg waar je de wijziging deed.</p>
      <p>De ploeg, de tegenstander, de datum, het uur en thuis/uit kan je hier <b>niet</b> wijzigen, en ook niets rond selectie, opstelling of gebeurtenissen. Dat blijft per wedstrijd — één misklik over tien wedstrijden is daar te riskant.</p>
      <p style="margin-top:10px">Bij een gespeelde wedstrijd blijven de wedstrijdvorm en de blokken buiten bereik: die bepalen mee de speelminuten, en die van een gespeelde wedstrijd horen niet meer te bewegen. Zitten er zulke wedstrijden in je selectie, dan zegt de app vooraf hoeveel er dus niet meewijzigen.</p>
    `
  },
  {
    titel: 'Selectie & opstelling',
    img: 'handleiding/screenshots/07_selectie.png',
    img2: 'handleiding/screenshots/08_opstelling.png',
    inhoud: `
      <div class="sec">Stap 2 — Selectie</div>
      <p>Deze stap gaat enkel over <b>wie je meeneemt</b>. Duid je een speler niet aan, dan is hij
        <b>niet geselecteerd</b>: hij telt nergens mee in de statistieken. Verder kan je per speler
        kiezen (nog eens tikken maakt de keuze ongedaan):</p>
      <ul class="hdl-list">
        <li><b style="color:#4caf50">Mee</b> — doet mee aan deze wedstrijd. Of hij start of op de bank
          begint, bepaal je bij de opstelling.</li>
        <li><b style="color:#f44336">NB</b> — niet beschikbaar (ziek, geblesseerd, afgemeld …). Telt
          mee als gemiste wedstrijd in het aanwezigheidspercentage. Je kan er een <b>reden</b> bij
          kiezen; koos je <b>'speelt elders'</b>, dan telt die wedstrijd niet als gemist — de speler
          voetbalde immers, alleen bij een andere ploeg.</li>
      </ul>
      <p>Niet in de lijst? Voeg toe via <b>'+ Losse speler'</b> of <b>'+ Speler van andere ploeg'</b>.</p>
      <p>Onderaan kies je zelf hoe ver je gaat: <b>'Opslaan zonder opstelling'</b> bewaart enkel wie
        er meespeelt — handig als je de ploeg al kent maar nog niet wie waar begint. De wedstrijd
        staat dan ingepland en toont een knop <b>'Opstelling aanmaken'</b> voor later. Wil je meteen
        verder, tik dan op <b>'Volgende → Opstelling'</b>.</p>
      <p class="hdl-tip">Zolang er geen opstelling is, blijft het blok <b>Planning</b> weg en kan je
        de wedstrijd niet starten — er is dan immers nog niemand op het veld gezet.</p>
      <div class="sec">Stap 3 — Opstelling</div>
      <p>Kies bovenaan een <b>formatie</b>. Het veld begint leeg: tik een speler aan uit de lijst
        eronder, dan een vrije positie op het veld.</p>
      <p>De formatie is een <b>voorstel, geen keurslijf</b>: de plekken die erbij horen worden groter
        getekend, maar je mag iedereen op eender welke plek van het veld zetten. Kies je een andere
        formatie, dan verhuist er niemand — er lichten enkel andere plekken op.</p>
      <p>Die lijst onder het veld bevat je hele selectie behalve wie al op het veld staat. Zolang het
        veld niet vol is, heet ze <b>'Nog op het veld te zetten'</b>; zodra het vol is, is exact
        diezelfde lijst je <b>bank</b> — <b>wie je niet op het veld zet, staat automatisch op de
        bank</b>. Wil je nadien nog ruilen: tik een <b>bankspeler</b> aan en dan de speler op het veld
        die hij vervangt. Met <b>'Veld leegmaken'</b> zet je iedereen terug in de lijst.</p>
      <p>Bovenaan zie je <b>hoeveel spelers er op het veld staan</b> (bij 8v8 dus 8/8). Opslaan kan
        pas als het veld vol is. Heb je minder spelers dan er plaatsen zijn — zeven voor 8v8 —
        dan volstaat het die zeven op te stellen. Wie na het vullen overblijft, komt automatisch op
        de bank.</p>
      <p>Tik op <b>'Plannen'</b> om de wedstrijd op te slaan: <b>alle kwarten beginnen dan met deze
        opstelling</b>, en je past ze later enkel aan waar er iets verandert.</p>
      <p>Met <b>'Verder → wissels en volgende kwarten'</b> bouw je het plan kwart per kwart op. Je
        krijgt telkens hetzelfde scherm: bovenaan de opstelling waarmee dat kwart begint, eronder de
        <b>wissels tijdens dat kwart</b> (met <b>'+ Wissel'</b>), en
        onderaan de knop naar het volgende kwart. Stop je onderweg, dan zegt de app welke kwarten de
        laatste opstelling overnemen — bijwerken kan altijd nog via <b>Planning</b> in het
        wedstrijdscherm.</p>
      <p>De wedstrijd is in beide gevallen al ingepland; <b>starten</b> doe je later in het
        wedstrijdscherm.</p>
      <p class="hdl-tip">De opstelling van elk deel pas je nadien nog aan met het <b>potlood</b> in het
        blok <b>Planning</b> van de geplande wedstrijd — ook die van kwart 1. In datzelfde blok staan
        onder het veld de wissels die je voor dat kwart klaarzette: met het <b>potlood</b> pas je er
        een aan, met het <b>kruisje</b> haal je hem weg, en met <b>'+ Wissel'</b> zet je er een bij
        voor precies dat kwart.</p>
      <div class="sec">Nadien nog iets wijzigen?</div>
      <p>Bij een geplande wedstrijd zit alles achter de knop <b>'Bewerken'</b>. Daar kies je wat je
        wil aanpassen:</p>
      <ul class="hdl-list">
        <li><b>Info bewerken</b> — tegenstander, datum, uur, formaat en de rest van de gegevens.</li>
        <li><b>Selectie</b> — wie meegaat en wie niet beschikbaar is. Een speler die je toevoegt komt
          op de bank; wil je hem in de basis, zet hem dan bij de opstelling op het veld. Haal je
          iemand weg die op het veld stond, dan vraagt de app om de opstelling aan te vullen.</li>
        <li><b>Opstelling &amp; wissels</b> — het hele plan, kwart per kwart.</li>
        <li><b>Namen, nummers &amp; notities</b> — enkel voor deze ene wedstrijd.</li>
        <li><b>Snel resultaat invoeren</b> — de wedstrijd niet live volgen, enkel de uitslag ingeven.</li>
        <li><b>Selectie wissen</b> — helemaal opnieuw beginnen: de selectie, de opstellingen per
          kwart en de geplande wissels gaan weg, de wedstrijd zelf blijft staan.</li>
      </ul>
      <p>Onder het veld staat <b>'Opstelling en wissels per kwart'</b>: dat is dezelfde reeks als bij
        het aanmaken, waarin je kwart per kwart de opstelling en de wissels nakijkt. Wil je gericht
        één kwart bijstellen, gebruik dan het <b>potlood</b> in het blok <b>Planning</b>; daar
        blijven je wijzigingen pas bewaard als je op <b>'Opslaan'</b> tikt, en met <b>'Sluiten'</b>
        laat je ze vallen.</p>
      <p>Een <b>positiewissel</b> geef je in door een speler te kiezen en daarna op het veld de
        <b>plek</b> aan te tikken waar hij naartoe gaat. Staat daar op dat moment iemand, dan neemt
        die zijn plaats over — ook als dat door een eerdere wissel intussen iemand anders is. Kies je
        een <b>lege plek</b>, dan verhuist hij er gewoon naartoe; handig als je met een man minder
        speelt na een rode kaart. Tijdens de match voer je ze één voor één door, of allemaal samen
        met <b>'Alle N doorvoeren'</b>.</p>
      <p class="hdl-tip">Kies je bij een wissel <b>'geen voorkeur — altijd beschikbaar'</b>, dan hoort
        hij bij geen enkel kwart. Zulke wissels staan apart onder <b>'Wissels zonder vast kwart'</b>,
        een knop die enkel verschijnt als je er hebt.</p>
      <p class="hdl-tip">Tijdens de wedstrijd vind je die planning terug onderaan het tabblad
        <b>Opstelling</b>: per nog te spelen deel het veld, de bank en de wissels die je voor dat
        deel klaarzette.</p>
      <div class="sec">Wedstrijd gaat niet door</div>
      <p>Onderaan de geplande wedstrijd staat <b>'Wedstrijd annuleren'</b> — voor een match die
        afgelast wordt zonder ooit gespeeld te zijn. Je mag er een korte reden bij zetten (bv.
        "onbespeelbaar terrein"), maar dat hoeft niet. De wedstrijd blijft in de agenda en in de
        wedstrijdenlijst staan met de vermelding <b>Geannuleerd</b>: ze staat dus niet bij de komende
        wedstrijden, niet bij de uitslagen, en telt nergens mee in de statistieken.</p>
      <p class="hdl-tip">Annuleren is omkeerbaar: je selectie en je hele plan blijven bewaard, en met
        <b>'Annulering ongedaan maken'</b> staat de wedstrijd weer op gepland zoals ze was. Gaat ze
        echt nooit door, dan is <b>'Wedstrijd verwijderen'</b> nog altijd de definitieve weg.</p>
    `
  },
  {
    titel: 'Live wedstrijd bijhouden',
    img: 'handleiding/screenshots/09_live_wedstrijd.png',
    img2: 'handleiding/screenshots/09b_pauze_opstelling.png',
    inhoud: `
      <ol class="hdl-list">
        <li>Tik op <b>'► Start wedstrijd'</b>.</li>
        <li>Registreer events via de knoppen:<br>
          <b>Goal</b> · <b>Wissel</b> · <b>Positie</b> · <b>Gele kaart</b> · <b>Rode kaart</b> · <b>Penalty</b> · <b>Blessure</b> · <b>Meer</b> (met o.a. <b>Vrije trap</b>)
        </li>
        <li><b>In de pauze</b> regel je wissels en positiewissels in het tabblad <b>Opstelling</b> (er
          staat dan een oranje stipje bij): tik een <b>bankspeler</b> en dan een <b>speler op het
          veld</b> om te wisselen, of tik <b>twee spelers op het veld</b> om ze van positie te
          wisselen. Tik je een speler op het veld en dan een <b>lege plek</b>, dan verhuist hij
          daarnaartoe zonder ruil. Het veld toont meteen de opstelling van het volgende deel, en alles wordt
          doorgevoerd zodra je dat deel start.</li>
        <li>De puntjes tonen de wedstrijddelen. De timer loopt per deel.</li>
        <li>Navigeer onderaan tussen <b>Wedstrijd</b>, <b>Opstelling</b> en <b>Verloop</b>.</li>
        <li>Komt een geselecteerde speler niet opdagen? Tik in het tabblad <b>Opstelling</b> op het
          kruisje naast zijn naam en kies <b>'Niet aanwezig'</b>. Hij krijgt dan geen speelminuten en
          telt als gemiste wedstrijd; via <b>'Herstel'</b> draai je het terug.</li>
        <li>Gaat een speler onderweg <b>weg</b> — naar huis, of naar het tweede veld waar je ploeg op
          hetzelfde uur speelt? Kies dan bij datzelfde kruisje <b>'Vertrokken'</b>. Speelde hij al,
          dan stopt zijn teller op dat moment, blijven zijn gespeelde minuten staan en kan je meteen
          iemand inbrengen. Speelde hij nog niet, dan komt hij bij <b>'Niet aanwezig'</b> te staan met
          de vermelding <b>speelt elders</b>, en telt die wedstrijd niet als gemist — hij voetbalde
          immers wel, alleen niet hier.</li>
        <li>Komt er iemand <b>bij</b> — een laatkomer, of iemand die van dat tweede veld komt
          bijspringen? Onderaan het tabblad <b>Opstelling</b> staat <b>'Speler bijzetten'</b>. Kies
          hem uit je ploeg (of voeg hem toe als losse speler); hij komt op de <b>bank</b> en je brengt
          hem in met een gewone wissel. Zijn speeltijd start pas wanneer hij effectief het veld op
          gaat, en bij zijn naam komt <b>bijgekomen</b> te staan — in de app, in het verslag en in de
          PDF — zodat later duidelijk is waarom hij minder minuten heeft.</li>
        <li>In het tabblad <b>Opstelling</b> regel je wissels rechtstreeks op het veld: tik een
          <b>bankspeler</b> en dan een <b>speler op het veld</b> om te wisselen, of <b>twee
          veldspelers</b> om ze van plaats te wisselen. Je krijgt telkens een bevestiging en het
          wordt meteen doorgevoerd. Het kan ook via de knoppen <b>'Wissel'</b> en <b>'Meer'</b> →
          <b>'Positiewissel'</b>; daar tik je op het veld de <b>plek</b> aan waar de speler naartoe
          gaat, ook als die leeg is.</li>
        <li>Tik op <b>'Afsluiten'</b> om de wedstrijd te beëindigen. Daarna verschijnt <b>'Deel score'</b> om de uitslag te delen.</li>
      </ol>
      <p class="hdl-tip">Fout geregistreerd? Verwijder events via het tabblad <b>'Verloop'</b>.</p>
      <p class="hdl-tip">Zijn er meerdere ploegbeheerders? Laat best 1 persoon tegelijk events registreren voor een wedstrijd — gelijktijdig invoeren op verschillende toestellen kan elkaars wijzigingen overschrijven.</p>
      <div class="sec">Twee wedstrijden op hetzelfde uur</div>
      <p>Bij de jongste reeksen speelt dezelfde ploeg vaak twee wedstrijden tegelijk, met twee groepjes
        op twee terreinen. Dat kan gewoon: elke wedstrijd wordt apart bijgehouden, ook wanneer beide
        toestellen met <b>hetzelfde account</b> aangemeld zijn. Op elk toestel zie je de stand van de
        andere wedstrijd meelopen, en de speelminuten van beide tellen bij dezelfde spelers op.</p>
      <p>Eén toestel per wedstrijd is wel de regel: laat twee mensen nooit dezelfde wedstrijd bedienen.
        En sluit elke wedstrijd af zodra ze gedaan is — een wedstrijd die blijft openstaan, laat haar
        klok doorlopen en geeft die spelers veel te veel minuten.</p>
      <p class="hdl-tip">Start je de tweede wedstrijd terwijl de eerste loopt, dan zegt de app niets —
        tenzij er iets fout dreigt te gaan: de andere wedstrijd staat al veel te lang open, of er
        staan spelers in beide selecties. In dat laatste geval krijg je hun namen te zien, want die
        zouden op twee klokken tegelijk speeltijd krijgen.</p>
    `
  },
  {
    titel: 'Wedstrijdverslag & PDF',
    img: 'handleiding/screenshots/11_wedstrijd_detail_2.png',
    img2: 'handleiding/screenshots/12_wedstrijd_detail_2.png',
    inhoud: `
      <p>Open een gespeelde wedstrijd voor de volledige samenvatting: eindscore, wedstrijdinfo, opstelling en alle events. Per event kan je bewerken (potlood) of verwijderen (rood kruisje).</p>
      <p style="margin-top:10px">Onderaan vind je ook:</p>
      <ul class="hdl-list">
        <li><b>'Event toevoegen'</b> — voeg achteraf nog een event toe.</li>
        <li><b>'Spelernotities'</b> / <b>'Info bewerken'</b> — voeg notities per speler toe of pas de wedstrijdinfo aan.</li>
        <li><b>'Posities herplaatsen'</b> — pas de opstelling aan.</li>
        <li><b>'Wedstrijd verwijderen'</b> — haalt ze uit de lijst. Ze blijft bewaard in de <b>Prullenmand</b> op het ploegscherm, dus een misklik is recht te zetten.</li>
      </ul>
      <p class="hdl-tip"><b>'Posities herplaatsen'</b> werkt zolang er nog geen wissels of positiewissels gebeurd zijn. Daarna zou het de reconstructie per deel omgooien; gebruik dan <b>Positiewissel</b> in de wedstrijd zelf.</p>
      <div class="sec">Wat staat er in het verslag?</div>
      <ul class="hdl-list">
        <li><b>Selectie</b> in vier groepen: wie in de selectie zat, wie <b>niet beschikbaar</b> was (met de reden erbij), wie <b>geselecteerd was maar niet aanwezig</b>, en wie <b>niet geselecteerd</b> was. Kwam iemand pas tijdens de wedstrijd bij de selectie, dan staat <b>bijgekomen</b> achter zijn naam; vertrok hij naar een ander veld, dan staat er <b>speelt elders</b>.</li>
        <li><b>Opstelling per deel</b> — een veld per kwart (of helft) met de stand bij de start. Onder elk veld staat de bank van dat deel; bij een speler die gewisseld werd staat zijn vervanger met een wisselicoon, en gele of rode kaarten staan als kaartje achter zijn naam.</li>
        <li><b>Tussenstand per deel</b>, wedstrijdstatistieken, keeperminuten, een spelerstabel met speelminuten per deel, en de volledige tijdlijn.</li>
      </ul>
      <div class="sec">PDF & delen</div>
      <ul class="hdl-list">
        <li>Tik op <b>'PDF'</b> voor een officieel wedstrijdverslag. De namen zijn selecteerbare tekst, dus je kan in de PDF zoeken.</li>
        <li>Tik op <b>'Delen'</b> om te delen via je toestel.</li>
        <li>Tik op <b>'Deel score'</b> voor de stand.</li>
      </ul>
    `
  },
  {
    titel: 'Statistieken',
    img: 'handleiding/screenshots/14_statistieken.png',
    inhoud: `
      <p>Via de tegel <b>Statistieken</b> op het homescherm zie je het overzicht van je ploeg per seizoen. Bovenaan staat een samenvattingskaart (gespeeld, gewonnen, gelijk, verloren, doelpunten); daaronder staan de secties die je open- en dichtklapt door op de titel te tikken.</p>
      <ul class="hdl-list">
        <li><b>Topschutters</b> en <b>Assists</b>.</li>
        <li><b>Clean sheets</b> — per keeper, op basis van de minuten die hij effectief in doel stond.</li>
        <li><b>Meeste speelminuten</b> en <b>Fair-play · minste speeltijd</b> — die tweede rekent de <i>gemiddelde</i> speeltijd per selectie, dus wie vaak geselecteerd wordt maar weinig speelt, staat bovenaan. Bedoeld om eerlijke speelkansen op te volgen.</li>
        <li><b>Geselecteerd</b> — in hoeveel procent van de wedstrijden een speler in de selectie zat. Wie <b>NB</b> stond, telt als gemiste wedstrijd, behalve met de reden 'speelt elders'.</li>
        <li><b>Posities</b> en <b>Kaarten</b>.</li>
      </ul>
      <div class="sec">Wat mag een kijker zien?</div>
      <p>Bij elke sectie staat voor jou als beheerder een <b>oog-icoontje</b>. Tik erop om die sectie vrij te geven aan kijkers, of ze weer privé te zetten. Standaard zijn Topschutters, Assists en Clean sheets publiek en de rest privé. Een kijker ziet onderaan de melding dat er meer statistieken bestaan voor ploegbeheerders. Het <b>individuele spelersdetail</b> blijft altijd voorbehouden aan ploegbeheerders.</p>
      <div class="sec">Per speler</div>
      <p>Tik op een speler voor zijn detailpagina: doelpunten, assists, speelminuten, kaarten, keeperbeurten en zijn aanwezigheid. Onderaan staat <b>'Carrière — eerder bij'</b>: wedstrijden bij een vorige ploeg, voor spelers die via <b>'Speler overzetten'</b> verhuisd zijn.</p>
      <p class="hdl-tip"><b>Tornooiwedstrijden tellen niet mee</b> in deze statistieken — net zoals ze in een aparte lijst staan. Wel wordt geteld in hoeveel tornooien een speler in de selectie zat.</p>
    `
  },
  {
    titel: 'Tornooien',
    img: 'handleiding/screenshots/15_tornooi.png',
    inhoud: `
      <p>Een tornooi bundelt meerdere korte wedstrijden op één dag, met één selectie voor de hele dag. Je vindt het via de tegel <b>Tornooien</b> op het homescherm.</p>
      <div class="sec">Stap 1 — Tornooi aanmaken</div>
      <ul class="hdl-list">
        <li><b>Naam</b> (bv. Paastornooi Gent), <b>ploeg</b>, <b>datum</b> en <b>locatie</b>.</li>
        <li><b>Type wedstrijd</b> — de vorm waarin je die dag speelt (bv. 5v5 of 8v8).</li>
        <li><b>Aantal blokken</b> en <b>duur van een blok</b> — de standaardduur van de dag (tornooiwedstrijden zijn vaak één blok van 10 of 15 minuten). Elke nieuwe wedstrijd neemt ze over; wijkt er één af, dan pas je dat in die wedstrijd zelf aan.</li>
        <li><b>Trainer(s)</b> en <b>ploegverantwoordelijke(n)</b>. Vink aan wie er die dag bij is — er mogen er meerdere zijn — of typ een naam die niet in de ploeg staat. Die gelden voor élke wedstrijd van het tornooi: je geeft ze hier één keer in en past ze ook hier aan.</li>
      </ul>
      <div class="sec">Stap 2 — Selectie voor de hele dag</div>
      <p>Duid per speler aan of hij <b>Mee</b> is naar het tornooi, of <b>NB</b> (niet beschikbaar, met een reden naar keuze). Wie je niet aanduidt, is niet geselecteerd. Je kan hier ook per speler het rugnummer voor die dag aanpassen.</p>
      <p class="hdl-tip">Zonder selectie kan je nog geen wedstrijden toevoegen — de app waarschuwt je en biedt meteen de knop om ze in te geven.</p>
      <div class="sec">Wedstrijden toevoegen</div>
      <ol class="hdl-list">
        <li>Open het tornooi en tik op <b>'+ Wedstrijd toevoegen'</b>.</li>
        <li>Vul de <b>tegenstander</b> en het <b>uur</b> in. Het aantal blokken en de duur staan al ingevuld volgens de standaard van het tornooi; wijkt deze wedstrijd af, dan pas je ze hier aan.</li>
        <li>Kies uit je tornooiselectie wie <b>mee</b> doet aan deze wedstrijd en zet de opstelling; wie je niet op het veld zet, begint op de bank. Daarna houd je de wedstrijd live bij zoals elke andere wedstrijd.</li>
      </ol>
      <p>Bij een gespeelde wedstrijd staat <b>'Kloon als nieuwe wedstrijd'</b>: dat neemt de formatie en de opstelling over, zodat je voor de volgende tegenstander enkel de naam en het uur hoeft in te vullen. Dezelfde knop staat in de wedstrijd zelf als <b>'Kloon als nieuwe tornooiwedstrijd'</b>.</p>
      <div class="sec">Overzicht</div>
      <p>Bovenaan het tornooi zie je de info en het aantal geselecteerde spelers; zodra er wedstrijden gespeeld zijn, komt daar de balans (gewonnen, gelijk, verloren, doelpunten) bij. Onderaan kan je het hele tornooi verwijderen; het blijft bewaard in de <b>Prullenmand</b> op het ploegscherm.</p>
      <p class="hdl-tip">Tornooiwedstrijden staan apart: ze verschijnen niet in de gewone wedstrijdenlijst en tellen niet mee in de seizoensstatistieken. Wel wordt bijgehouden in hoeveel tornooien een speler in de selectie zat.</p>
    `
  },
  {
    titel: 'Als ploegbeheerder',
    img: 'handleiding/screenshots/05_beheer.png',
    img2: 'handleiding/screenshots/05b_beheer_toegang.png',
    inhoud: `
      <p>Alles over één ploeg staat op het <b>ploegscherm</b>. Je opent het met de tegel <b>'Ploeg'</b> op het startscherm, of met de knop <b>'Ploeg'</b> rechtsboven. Het heeft drie delen:</p>
      <ul class="hdl-list">
        <li><b>'De ploeg'</b> — de spelerslijst, de trainers en ploegverantwoordelijken, en wat standaard klaarstaat bij een nieuwe wedstrijd. Zet <b>'Bewerken'</b> aan om er iets aan te wijzigen.</li>
        <li><b>'Mensen met toegang'</b> — <b>'Iemand uitnodigen'</b> deelt een uitnodiging via link, QR-code of code van 6 tekens. Wie via de link vervoegt, komt binnen als <b>kijker</b>; via <b>'Leden'</b> promoveer of degradeer je hem, en keur je ploegbeheeraanvragen goed of af.</li>
        <li><b>'Deze ploeg'</b> — de ploegnaam wijzigen, de <b>kijkmodus</b> (bekijk de ploeg zoals een ouder ze ziet), en de <b>Prullenmand</b>.</li>
      </ul>
      <p>In de <b>Prullenmand</b> blijven verwijderde wedstrijden en tornooien bewaard. Je ziet er wat er gewist is, wanneer en door wie, en zet het in één tik volledig terug: gebeurtenissen, opstelling en notities inbegrepen.</p>
      <p class="hdl-tip">Als ploegbeheerder kan je alles voor je ploeg: wedstrijden aanmaken, live bijhouden, spelers beheren en PDF's genereren.</p>
      <p style="margin-top:10px">Op het startscherm staat een blok <b>'Niet afgesloten'</b>: wedstrijden waarvan de dag voorbij is en die nooit gestart of nooit beëindigd werden. Die staan niet meer bij 'Eerstvolgende' — daar horen ze niet — maar ze verdwijnen ook niet, want er hangt een verslag aan dat nog afgewerkt moet worden.</p>
      <p style="margin-top:10px">Een <b>nieuwe ploeg</b> aanmaken doe je niet zelf — dat doet de clubbeheerder binnen de club (zie de volgende pagina). Contacteer de clubbeheerder van je club.</p>
    `
  },
  {
    titel: 'Als clubbeheerder',
    img: 'handleiding/screenshots/02_ploeg_toevoegen.png',
    inhoud: `
      <p>Een <b>clubbeheerder</b> beheert alle ploegen van één club. De eigenaar stelt je aan als clubbeheerder. Daarna is op <b>'Jouw ploegen'</b> de <b>groene clubbalk</b> boven je ploegen de ingang: tik erop en je komt in <b>Clubbeheer</b>. Volg je zelf geen enkele ploeg van die club, dan staat er onderaan de knop <b>'Mijn club beheren'</b>.</p>
      <div class="sec">Ploegen beheren</div>
      <ul class="hdl-list">
        <li><b>'Nieuwe ploeg in deze club'</b> — maak een ploeg aan binnen je club. Vink aan of je zelf het dagelijks beheer doet (dan verschijnt de ploeg ook in 'Jouw ploegen'). Dit is de enige plek waar een ploeg gemaakt wordt.</li>
        <li><b>'Openen'</b> bij een ploeg — ga naar het ploegscherm van die ploeg, met haar wedstrijden, spelers en leden.</li>
        <li><b>'Archiveren'</b> — zet een ploeg weg zonder ze te verwijderen; ze verdwijnt uit de actieve lijsten maar behoudt alle gegevens en kan hersteld worden. Dit is wat je wil bij een ploeg die niet meer speelt.</li>
        <li><b>'Verwijderen'</b> — definitief wissen. Deze knop staat grijs: enkel de maker van de app kan dat. Vraag het aan hem als het echt moet.</li>
      </ul>
      <p class="hdl-tip">Aanmaken, archiveren en verwijderen van een hele ploeg staan alle drie hier, in Clubbeheer — niet op het ploegscherm zelf. Zo kan niemand tijdens het dagelijkse werk per ongeluk een ploeg wissen.</p>
      <div class="sec">Een trainer uitnodigen</div>
      <ol class="hdl-list">
        <li>Open de ploeg met <b>'Openen'</b>, tik op de tegel <b>'Ploeg'</b> en dan bij <b>'Mensen met toegang'</b> op <b>'Iemand uitnodigen'</b>.</li>
        <li>Bezorg de trainer de <b>uitnodigingslink</b> (of QR-code / code). Hij komt eerst binnen als kijker.</li>
        <li>Ga naar <b>'Leden'</b> en <b>promoveer</b> hem tot ploegbeheerder.</li>
      </ol>
      <div class="sec">Spelers doorschuiven</div>
      <p>Elk seizoen schuiven de lichtingen door. Tik in Clubbeheer op <b>'Spelers doorschuiven'</b>, kies <b>van</b> welke ploeg <b>naar</b> welke, en vink aan wie meegaat — met <b>'Allemaal'</b> als snelkoppeling. Je krijgt eerst te zien wie meegaat en hoeveel spelers achterblijven.</p>
      <ul class="hdl-list">
        <li><b>Iedereen houdt zijn verleden.</b> Op de spelerspagina blijft onder <b>'Carrière — eerder bij'</b> staan wat hij bij zijn vorige ploeg deed. Zijn oude wedstrijden blijven bij die ploeg, met zijn naam erin.</li>
        <li><b>Doe het niet met de hand.</b> Tik je een speler in de nieuwe ploeg opnieuw in, dan is dat voor de app een nieuwe persoon en blijft zijn carrière-overzicht leeg. Gebruik altijd dit scherm.</li>
        <li><b>Begin bij de oudste ploeg</b> — eerst U12 naar U13, dan U11 naar U12, en zo verder. Omgekeerd staan er even twee lichtingen in één lijst en moet je bij het aanvinken opletten.</li>
        <li>Wie <b>stopt</b>, gaat niet mee: die haal je daarna uit de spelerslijst bij <b>Ploeg</b> — en ook dat kan je daar ongedaan maken.</li>
      </ul>
      <p class="hdl-tip">Fout doorgeschoven? Meteen na de beurt staat er <b>'Ongedaan maken'</b>, dat beide spelerslijsten exact terugzet.</p>
      <div class="sec">Clubexport (Excel)</div>
      <p>Met <b>'Clubexport'</b> haal je de cijfers van <b>alle</b> ploegen van je club op — ook van ploegen die je op dit toestel nooit opende. Je kiest eerst het <b>seizoen</b>. Het bestand heeft zes tabbladen:</p>
      <ul class="hdl-list">
        <li><b>Spelers</b> — één regel per speler, met zijn speeltijd over al zijn ploegen samen. Dit is de tabel voor de vraag <i>"heeft dit kind genoeg gevoetbald?"</i>, ook als hij halfweg het seizoen van ploeg veranderde.</li>
        <li><b>Spelers per ploeg</b> — dezelfde speler opgesplitst per ploeg, voor de vraag <i>"hoe is de speeltijd in mijn ploeg verdeeld?"</i>.</li>
        <li><b>Overzicht</b>, <b>Wedstrijden</b>, <b>Speeltijd</b> (de ruwe tabel per speler per wedstrijd) en <b>Tornooiwedstrijden</b>.</li>
      </ul>
      <p><b>Tornooiwedstrijden staan apart</b> en tellen niet mee in de speeltijd: een tornooidag is vijf wedstrijdjes van tien minuten, en die zouden elk gemiddelde vertekenen. Je vindt het aantal tornooien terug in het Overzicht.</p>
      <p class="hdl-tip">Spelernotities en kwetsuurdetails zitten er bewust <b>niet</b> in. In de app zijn die enkel voor beheerders; in een bestand dat rondgestuurd wordt, zijn ze dat niet meer.</p>
      <div class="sec">Extra</div>
      <ul class="hdl-list">
        <li><b>Clublogo</b> — stel bovenaan in Clubbeheer het clublogo in. Het verschijnt bij je club op 'Jouw ploegen', onderaan de ploegpagina en in de wedstrijd-PDF.</li>
      </ul>
    `
  },
];

let hdlPagina = 0;
function renderHandleiding(p) {
  hdlPagina = p;
  const pagina = HANDLEIDING_PAGINAS[p];
  const totaal = HANDLEIDING_PAGINAS.length;
  const tabs = HANDLEIDING_PAGINAS.map((pg, i) =>
    `<button class="hdl-tab${i === p ? ' active' : ''}" onclick="hdlGo(${i})">${pg.titel}</button>`
  ).join('');
  const shot = src => `<img src="${src}" class="hdl-img" onerror="this.style.display='none'">`;
  const imgList = (pagina.img ? shot(pagina.img) : '') + (pagina.img2 ? shot(pagina.img2) : '');
  const imgs = imgList ? `<div class="hdl-shots">${imgList}</div>` : '';
  const pdfKnop = p === 0 ? `<button class="btn btn-pale" style="margin-bottom:16px;width:100%" onclick="exportHandleidingPDF()">${icI(IC.clipboard)} Download handleiding als PDF</button>` : '';
  return `
    <div class="hdr"><button class="back" onclick="go('settings')">‹</button><h1>${icI(IC.clipboard)} Handleiding</h1></div>
    <div class="content" style="padding:0">
      <div class="hdl-tabs">${tabs}</div>
      <div class="hdl-body">
        ${pdfKnop}
        <h2 class="hdl-titel">${pagina.titel}</h2>
        ${imgs}
        ${pagina.inhoud}
        <div class="hdl-nav">
          ${p > 0 ? `<button class="btn btn-pale" onclick="hdlGo(${p-1})">‹ Vorige</button>` : '<span></span>'}
          <span style="font-size:13px;color:var(--txt2)">${p+1} / ${totaal}</span>
          ${p < totaal-1 ? `<button class="btn btn-green" onclick="hdlGo(${p+1})">Volgende ›</button>` : '<span></span>'}
        </div>
      </div>
    </div>`;
}
function hdlGo(p) {
  document.getElementById('app').innerHTML = renderHandleiding(p);
  window.scrollTo(0, 0);
  document.getElementById('app').scrollTop = 0;
}

let _jspdfLoading = null;
// Laadt jsPDF + autoTable (~450KB) pas bij een effectieve PDF-export, niet bij elke opstart.
function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable) return Promise.resolve();
  if (_jspdfLoading) return _jspdfLoading;
  _jspdfLoading = new Promise((resolve, reject) => {
    const s1 = document.createElement('script');
    s1.src = 'pdf/jspdf.umd.min.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'pdf/jspdf.plugin.autotable.min.js';
      s2.onload = () => resolve();
      s2.onerror = () => reject(new Error('jspdf.plugin.autotable.min.js niet geladen'));
      document.head.appendChild(s2);
    };
    s1.onerror = () => reject(new Error('jspdf.umd.min.js niet geladen'));
    document.head.appendChild(s1);
  });
  return _jspdfLoading;
}

let _hdlScreenshotsLoading = null;
// Laadt handleiding-screenshots.js (792KB base64) pas wanneer echt nodig, niet bij elke opstart.
function loadHandleidingScreenshots() {
  if (Object.keys(HANDLEIDING_SCREENSHOTS).length > 0) return Promise.resolve();
  if (_hdlScreenshotsLoading) return _hdlScreenshotsLoading;
  _hdlScreenshotsLoading = new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'handleiding-screenshots.js';
    s.onload = () => resolve();
    s.onerror = () => { console.info('handleiding-screenshots.js niet gevonden'); resolve(); };
    document.head.appendChild(s);
  });
  return _hdlScreenshotsLoading;
}
async function exportHandleidingPDF() {
  showToast('PDF wordt voorbereid...', '');
  await loadHandleidingScreenshots();
  const heeftScreenshots = Object.keys(HANDLEIDING_SCREENSHOTS).length > 0;
  // Schermafbeeldingen zijn telefoonbeelden (verhouding ongeveer 1:2,17). Met `width:100%` werden ze
  // in een body van 780 px ruim 40 cm hoog — hoger dan een A4 — waardoor elk beeld een eigen pagina
  // opeiste en de PDF tot ~48 pagina's uitdijde. Daarom een vaste HOOGTE met vrije breedte: twee
  // beelden passen dan naast elkaar en blijven op papier ongeveer 4,9 bij 10,5 cm.
  function imgTag(key, style) {
    if (!key) return '';
    const k = key.replace('handleiding/screenshots/', '').replace('.png', '');
    const src = HANDLEIDING_SCREENSHOTS[k];
    if (!src) return '';
    return `<img src="${src}" style="height:10.5cm;width:auto;border-radius:8px;border:1px solid #e5e7eb;display:block${style ? ';' + style : ''}">`;
  }

  const secties = HANDLEIDING_PAGINAS.map((pg, i) => {
    const imgs = (pg.img ? imgTag(pg.img) : '') + (pg.img2 ? imgTag(pg.img2) : '');
    return `
      <div class="sectie${i < HANDLEIDING_PAGINAS.length - 1 ? ' page-break' : ''}">
        <h2>${i + 1}. ${pg.titel}</h2>
        ${imgs ? `<div class="shots">${imgs}</div>` : ''}
        ${pg.inhoud}
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
    <title>Match Delegate — Handleiding</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;color:#171717;padding:32px;max-width:780px;margin:0 auto;font-size:14px;line-height:1.6}
      h1.titel{font-size:28px;font-weight:900;margin-bottom:4px}
      .subtitel{font-size:14px;color:#6b7280;margin-bottom:32px;letter-spacing:1px}
      h2{font-size:18px;font-weight:700;margin:24px 0 10px;color:#111;border-bottom:2px solid #e5e7eb;padding-bottom:6px}
      .sec{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#6b7280;margin:16px 0 6px}
      p{margin-bottom:8px}
      ol,ul{padding-left:20px;margin:8px 0}
      li{margin-bottom:4px}
      .hdl-rol{background:#f9fafb;border-radius:8px;padding:10px 12px;margin-bottom:8px}
      .hdl-rol b{display:block;font-size:15px;margin-bottom:2px}
      .hdl-rol span{color:#6b7280;font-size:13px}
      .hdl-tip{background:#f0fdf4;border-left:3px solid #22c55e;padding:8px 12px;border-radius:0 8px 8px 0;font-size:13px;color:#374151;margin-top:12px}
      .hdl-list{padding-left:20px;margin:8px 0;line-height:1.8;font-size:14px}
      .hdl-list li{margin-bottom:4px}
      .sectie{margin-bottom:40px}
      /* Twee schermafbeeldingen naast elkaar; ze mogen niet over een paginagrens vallen. */
      .shots{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;margin:12px 0}
      .page-break{page-break-after:auto}
      a{color:#16a34a}
      @media print{
        body{padding:16px}
        /* Geen gedwongen pagina-einde per sectie: dat gaf een halfleeg blad na elke sectie (met de
           14 secties en 16 beelden liep de PDF zo tot 48 pagina's op). De tekst loopt nu door;
           koppen blijven bij hun inhoud en een beeldenblok wordt niet in twee gesneden. */
        h2{page-break-after:avoid}
        img{page-break-inside:avoid}
        .shots{page-break-inside:avoid}
        .sectie{page-break-inside:auto}
        @page{margin:14mm}
      }
    </style>
  </head><body>
    ${/* Het merkje bevat pictogram, naam én baseline, dus die twee tekstregels staan hier niet meer
          apart. Absolute URL: deze HTML wordt in een leeg venster geschreven en heeft daar geen
          eigen basispad om een relatieve verwijzing tegen af te zetten. */ ''}
    <img src="${new URL(APP_LOGO_HOOG, location.href).href}" alt="Match Delegate" style="width:190px;height:auto;margin:0 auto 28px;display:block">
    <h1 style="font-size:22px;margin-bottom:32px">Gebruikershandleiding</h1>
    ${!heeftScreenshots ? '<p style="color:#ef4444;margin-bottom:24px">⚠ Screenshots niet beschikbaar. Draai eerst <code>node handleiding/generate-b64.js</code> om ze toe te voegen.</p>' : ''}
    ${secties}
    <p style="margin-top:40px;font-size:12px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:16px">Match Delegate · App created by Tim Buyse</p>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) { showToast('Sta pop-ups toe om de PDF te maken.', 'err'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 800);
}

// De spelerskern van ÁLLE ploegen van deze gebruiker, elk bij zijn eigen ploeg. Vóór versie 3 zat er
// maar één kern in een back-up — die van de ploeg die op dat moment open stond — terwijl de
// wedstrijden van alle ploegen er wél in zaten. Wie via het tandwieltje een back-up nam, wist dus
// niet wiens spelers hij meenam, en bij het terugzetten niet wiens spelers hij overschreef.
async function backupKernen() {
  const uit = [];
  for (const tid of Object.keys(userTeams || {})) {
    let arr = [];
    // De actieve ploeg staat in de gewone sleutel; de andere in hun eigen cache van een eerder bezoek.
    if (tid === activeTeamId) arr = getTeamsV2();
    if (!arr.length) { try { arr = JSON.parse(localStorage.getItem(rosterCacheKey(tid)) || '[]'); } catch (e) { arr = []; } }
    if (!Array.isArray(arr)) arr = [];
    // Nooit op dit toestel geopend? Dan bij de cloud halen, zodat een back-up compleet is en niet
    // afhangt van waar je toevallig al geweest bent.
    if (!arr.length && cloudReady && fbdb) {
      try {
        const v = (await fbOnce(fbdb.ref('teams/' + tid + '/roster'))).val();
        arr = v ? (Array.isArray(v) ? v : Object.values(v)) : [];
      } catch (e) { arr = []; }
    }
    uit.push({ teamId: tid, teamName: teamNames[tid] || '', rol: userTeams[tid] || '', kernen: arr });
  }
  return uit;
}
async function exportBackup() {
  const matches = await dbAll();
  const ploegen = await backupKernen();
  const data = { app: 'voetbal', version: 3, exportedAt: Date.now(), matches, ploegen,
    settings: { countdown: localStorage.getItem('voetbal_countdown'),
      tournaments: localStorage.getItem('voetbal_tournaments') } };
  // Wat er in dit bestand zit, meteen zeggen — anders weet je pas bij het terugzetten wat je hebt.
  const nP = ploegen.filter(p => (p.kernen || []).length).length;
  showToast(`Back-up: ${matches.length} ${matches.length === 1 ? 'wedstrijd' : 'wedstrijden'}, spelers van ${nP} ${nP === 1 ? 'ploeg' : 'ploegen'}.`, 'ok');
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `voetbal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  localStorage.setItem('voetbal_last_backup', String(Date.now()));
}
function importBackup(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    let data;
    try { data = JSON.parse(e.target.result); } catch (err) { showToast('Ongeldig back-upbestand.', 'err'); return; }
    // Losse wedstrijd?
    if (data && data.app === 'voetbal-match' && data.match) {
      pendingRestore = { matches: [data.match], settings: null, single: true };
      openModal(`<h3>Wedstrijd importeren?</h3>
        <p style="text-align:center;color:var(--txt2);margin-bottom:16px"><b>${esc(data.match.teamName||'')} vs ${esc(data.match.opponent||'')}</b><br>Deze wordt toegevoegd aan je bestaande wedstrijden.</p>
        <button class="btn btn-green" onclick="doRestore('merge')">＋ Toevoegen</button>
        <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
      input.value = ''; return;
    }
    if (!data || data.app !== 'voetbal' || !Array.isArray(data.matches)) { showToast('Dit lijkt geen geldige voetbal-back-up.', 'err'); return; }
    pendingRestore = data;
    herstelBouwGroepen();
    go('herstel');
    input.value = '';
  };
  reader.readAsText(f);
}

let pendingRestore = null;
// ===================== TERUGGEVONDEN: wat er per ongeluk gewist is =====================
// De back-ups van een verwijderde wedstrijd, ploeg of tornooi bestonden al in de databank, maar waren
// enkel via de Firebase-console te bekijken — dus in de praktijk onbereikbaar. Hier staan ze.
// Wat waar staat: `deletedMatches/{ploeg}/{id}` met `match` (+ `notes`) bij een wedstrijd, of met
// `tournament` bij een tornooi; `deletedTeams/{ploeg}` met de volledige ploeg, en dat is enkel voor de
// eigenaar leesbaar. Er is geen tombstone-lijst: een verwijdering ís "staat niet meer in de cloud",
// dus terugzetten is gewoon terugschrijven.
let tgvState = null;   // { wedstrijden:[], tornooien:[], ploegen:[], fouten:[] }
// Heet sinds v1.1.0 "Prullenmand" en hangt aan de ploeg (ploegscherm → Prullenmand), met voor de
// eigenaar dezelfde ingang in App-beheer voor de verwijderde ploegen. Als "Teruggevonden" stond ze
// in het oude Beheer-scherm, dat er anders uitzag naargelang je via het ploegscherm of via de
// ploegenlijst binnenkwam — vandaar dat ze eens wel en dan weer niet leek te bestaan.
let _tgvFrom = 'home';
function renderTeruggevonden() {
  setTimeout(loadTeruggevonden, 0);
  return `<div class="hdr"><button class="back" onclick="go(_tgvFrom||'home')">‹</button><h1>${icI(IC.history)} Prullenmand</h1></div>
    <div class="content" id="tgv-content"><p style="text-align:center;color:var(--txt2)">Zoeken…</p></div>`;
}
async function loadTeruggevonden() {
  const el = document.getElementById('tgv-content');
  if (!el || !fbdb) { if (el) el.innerHTML = '<p style="text-align:center;color:var(--txt2)">Hiervoor is een internetverbinding nodig.</p>'; return; }
  const wedstrijden = [], tornooien = [], ploegen = [];
  // Per ploeg waar je beheerder van bent. Een leesfout (bv. een ploeg waar je toch geen rechten op
  // hebt) mag het scherm niet breken — dan tonen we die ploeg simpelweg niet.
  for (const tid of Object.keys(userTeams || {})) {
    let val = null;
    try { val = (await fbOnce(fbdb.ref('deletedMatches/' + tid))).val(); } catch (e) { continue; }
    Object.entries(val || {}).forEach(([id, e]) => {
      const basis = { tid, id, ploeg: teamNames[tid] || tid, wanneer: e.deletedAt || 0, door: e.deletedByEmail || '' };
      if (e && e.match) wedstrijden.push({ ...basis, match: e.match, notes: e.notes || null, tornooi: e.tournament || null });
      else if (e && e.tournament) tornooien.push({ ...basis, tornooi: e.tournament });
    });
  }
  if (isOwner) {
    try {
      const val = (await fbOnce(fbdb.ref('deletedTeams'))).val() || {};
      Object.entries(val).forEach(([tid, e]) => {
        if (e && e.team) ploegen.push({ tid, naam: ((e.team.info || {}).name) || tid, wanneer: e.deletedAt || 0,
          door: e.deletedByEmail || '', aantalWedstrijden: Object.keys(e.team.matches || {}).length, entry: e });
      });
    } catch (e) {}
  }
  const opTijd = (a, b) => (b.wanneer || 0) - (a.wanneer || 0);
  wedstrijden.sort(opTijd); tornooien.sort(opTijd); ploegen.sort(opTijd);
  tgvState = { wedstrijden, tornooien, ploegen };
  const wanneer = w => w ? fmtDate(w) : 'onbekend wanneer';
  const regel = (titel, onder, knop) => `<div class="ts-team-row" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
    <div><b>${titel}</b><br><small style="color:var(--txt2)">${onder}</small></div>
    <div>${knop}</div></div>`;
  const wHtml = wedstrijden.map((w, i) => regel(
    `${esc(w.match.opponent || '(geen tegenstander)')}`,
    `${esc(w.ploeg)} · ${esc(matchWhen(w.match))} · gewist ${esc(wanneer(w.wanneer))}${w.door ? ' door ' + esc(w.door) : ''}${w.tornooi ? ' · hoorde bij tornooi ' + esc(w.tornooi.name || '') : ''}`,
    `<button class="btn btn-green btn-sm" onclick="tgvHerstelWedstrijd(${i})">Terugzetten</button>`)).join('');
  const tHtml = tornooien.map((t, i) => regel(
    `${esc(t.tornooi.name || '(naamloos tornooi)')}`,
    `${esc(t.ploeg)}${t.tornooi.date ? ' · ' + esc(fmtDate(new Date(t.tornooi.date + 'T00:00:00').getTime())) : ''} · gewist ${esc(wanneer(t.wanneer))}${t.door ? ' door ' + esc(t.door) : ''}`,
    `<button class="btn btn-green btn-sm" onclick="tgvHerstelTornooi(${i})">Terugzetten</button>`)).join('');
  const pHtml = ploegen.map((p, i) => regel(
    `${esc(p.naam)}`,
    `${p.aantalWedstrijden} ${p.aantalWedstrijden === 1 ? 'wedstrijd' : 'wedstrijden'} · gewist ${esc(wanneer(p.wanneer))}${p.door ? ' door ' + esc(p.door) : ''}`,
    `<button class="btn btn-green btn-sm" onclick="tgvHerstelPloeg(${i})">Ploeg terugzetten</button>`)).join('');
  const leeg = !wedstrijden.length && !tornooien.length && !ploegen.length;
  el.innerHTML = leeg
    ? `<div class="empty" style="padding:24px 0"><div class="ei">${IC.done}</div><p>Niets gewist om terug te vinden.</p></div>`
    : `<p style="font-size:13px;color:var(--txt2);margin-bottom:12px">Wat hier staat, is verwijderd maar bewaard. Terugzetten brengt het volledig terug: gebeurtenissen, opstelling en notities inbegrepen.</p>
      ${wedstrijden.length ? `<div class="sec">${icI(IC.ball)} Wedstrijden (${wedstrijden.length})</div><div class="card">${wHtml}</div>` : ''}
      ${tornooien.length ? `<div class="sec">${icI(IC.medal)} Tornooien (${tornooien.length})</div><div class="card">${tHtml}</div>` : ''}
      ${ploegen.length ? `<div class="sec">${icI(IC.players)} Ploegen (${ploegen.length})</div><div class="card">${pHtml}</div>
        <p style="font-size:12px;color:var(--txt2);margin-top:6px">Een ploeg terugzetten brengt ook haar spelers, wedstrijden, leden en notities terug. De oude uitnodigingslink werkt niet meer — maak een nieuwe aan.</p>` : ''}`;
}
async function tgvHerstelWedstrijd(i) {
  const w = (tgvState || {}).wedstrijden ? tgvState.wedstrijden[i] : null;
  if (!w || !fbdb) return;
  showConfirm(`"${jsq(w.match.opponent || 'Wedstrijd')}" terugzetten bij ${jsq(w.ploeg)}?`, async () => {
    try {
      const m = { ...w.match }; delete m.fromCloud;
      // Eerst de back-up weg, dan terugschrijven: staat de wedstrijd er weer terwijl de back-up nog
      // bestaat, dan zou een tweede tik ze een tweede keer "herstellen" over een intussen bewerkte
      // versie heen.
      await fbdb.ref('deletedMatches/' + w.tid + '/' + w.id).remove();
      await fbdb.ref('teams/' + w.tid + '/matches/' + m.id).set(m);
      if (w.notes) { try { await fbdb.ref('teamNotes/' + w.tid + '/' + m.id).set(w.notes); } catch (e) {} }
      // Lokaal niets schrijven: hoort de wedstrijd bij de actieve ploeg, dan brengt de listener ze
      // meteen binnen. Hoort ze bij een ándere ploeg, dan zou een lokale kopie bij de eerstvolgende
      // synchronisatie juist opgeruimd worden — precies het mechanisme dat vandaag een wedstrijd van
      // een toestel haalde.
      showToast(w.tid === activeTeamId ? 'Wedstrijd teruggezet.' : `Teruggezet bij ${w.ploeg}. Open die ploeg om ze te zien.`, 'ok');
      loadTeruggevonden();
    } catch (e) { showToast('Terugzetten mislukt, probeer opnieuw.', 'err'); }
  }, 'Terugzetten', 'btn-green');
}
async function tgvHerstelTornooi(i) {
  const t = (tgvState || {}).tornooien ? tgvState.tornooien[i] : null;
  if (!t || !fbdb) return;
  showConfirm(`Tornooi "${jsq(t.tornooi.name || '')}" terugzetten?`, async () => {
    try {
      await fbdb.ref('deletedMatches/' + t.tid + '/' + t.id).remove();
      saveTournament(t.tornooi);   // lokaal + het ene child in de cloud
      showToast('Tornooi teruggezet.', 'ok');
      loadTeruggevonden();
    } catch (e) { showToast('Terugzetten mislukt, probeer opnieuw.', 'err'); }
  }, 'Terugzetten', 'btn-green');
}
async function tgvHerstelPloeg(i) {
  const p = (tgvState || {}).ploegen ? tgvState.ploegen[i] : null;
  if (!p || !fbdb || !isOwner) return;
  showConfirm(`Ploeg "${jsq(p.naam)}" volledig terugzetten, met haar spelers, wedstrijden en leden?`, async () => {
    try {
      const e = p.entry;
      await fbdb.ref('teams/' + p.tid).set(e.team);
      if (e.memberInfo) { try { await fbdb.ref('memberInfo/' + p.tid).set(e.memberInfo); } catch (x) {} }
      if (e.teamNotes) { try { await fbdb.ref('teamNotes/' + p.tid).set(e.teamNotes); } catch (x) {} }
      // De omgekeerde index: zonder deze regel staat de ploeg er wel, maar ziet niemand ze in
      // "Jouw ploegen" — ook de leden niet.
      for (const [uid2, rol] of Object.entries((e.team || {}).members || {})) {
        try { await fbdb.ref('users/' + uid2 + '/teams/' + p.tid).set(rol); } catch (x) {}
      }
      await fbdb.ref('deletedTeams/' + p.tid).remove();
      showToast('Ploeg teruggezet. Herlaad de app om ze te zien.', 'ok');
      loadTeruggevonden();
    } catch (err) { showToast('Terugzetten mislukt, probeer opnieuw.', 'err'); }
  }, 'Terugzetten', 'btn-green');
}
// ===================== TERUGZETTEN, PER PLOEG =====================
// Vroeger waren er twee knoppen: "samenvoegen" of "alles vervangen". Die tweede wiste ALLE
// wedstrijden van ALLE ploegen op het toestel en overschreef bovendien de spelerslijst — en dat is
// het plekje van de ploeg die op dat moment open staat. Het tandwieltje staat op elk scherm, dus je
// wist zelden in welke ploeg je zat. Nu kies je per ploeg wat er terug moet.
let herstelGroepen = [];   // [{ naam, wedstrijden:[], kernen:[], teamId, mijn, aan, mode, naarNaam }]
function herstelBouwGroepen() {
  const d = pendingRestore || {};
  // Groeperen op ploegNAAM: dat is waarop de lijsten filteren en dus wat bepaalt of je een wedstrijd
  // te zien krijgt. De ploegverwijzing is er wel, maar die verschilt per toestel en per ploeg-versie.
  const perNaam = new Map();
  (d.matches || []).forEach(m => {
    const naam = (m.teamName || '').trim() || '(zonder ploegnaam)';
    if (!perNaam.has(naam)) perNaam.set(naam, []);
    perNaam.get(naam).push(m);
  });
  // Welke ploegen zijn van MIJ? Op naam vergelijken, want de wedstrijden dragen een naam.
  const mijnNamen = new Map();   // naam -> teamId
  Object.keys(userTeams || {}).forEach(tid => { const n = (teamNames[tid] || '').trim(); if (n) mijnNamen.set(n, tid); });
  const kernenUitBestand = new Map();
  (d.ploegen || []).forEach(p => { if ((p.teamName || '').trim()) kernenUitBestand.set(p.teamName.trim(), p.kernen || []); });
  let tornooien = [];
  try { tornooien = JSON.parse((d.settings || {}).tournaments || '[]') || []; } catch (e) { tornooien = []; }
  herstelGroepen = [...perNaam.entries()].map(([naam, wedstrijden]) => {
    const teamId = mijnNamen.get(naam) || null;
    // Enkel een ploeg waarvan ik BEHEERDER ben, kan een spelerskern terugkrijgen: bij een kijker
    // weigert de databank die schrijfactie, en dan mislukt het stil.
    const mag = teamId && userTeams[teamId] === 'admin';
    return { naam, wedstrijden, teamId, mijn: !!teamId, magKern: !!mag,
      kernen: kernenUitBestand.get(naam) || [],
      tornooien: tornooien.filter(t => t.teamId && teamId && t.teamId === teamId),
      aan: !!teamId, mode: 'add', naarNaam: '' };
  }).sort((a, b) => (b.mijn - a.mijn) || a.naam.localeCompare(b.naam));
}
function herstelZet(i, veld, waarde) {
  const g = herstelGroepen[i]; if (!g) return;
  g[veld] = veld === 'aan' ? !g.aan : waarde;
  render();
}
function renderHerstel() {
  const d = pendingRestore;
  if (!d) return `<div class="hdr"><button class="back" onclick="go('settings')">‹</button><h1>Back-up terugzetten</h1></div>
    <div class="content"><p style="text-align:center;color:var(--txt2)">Geen bestand geladen.</p></div>`;
  const mijnOpties = Object.keys(userTeams || {}).filter(tid => userTeams[tid] === 'admin')
    .map(tid => teamNames[tid] || '').filter(Boolean).sort();
  const dat = d.exportedAt ? fmtDate(d.exportedAt) : 'onbekende datum';
  const kaart = (g, i) => {
    const nW = g.wedstrijden.length, nS = (g.kernen || []).length ? ((g.kernen[0].players || []).length) : 0;
    const nT = (g.tornooien || []).length;
    const info = `${nW} ${nW === 1 ? 'wedstrijd' : 'wedstrijden'}`
      + (nS ? ` · ${nS} ${nS === 1 ? 'speler' : 'spelers'}` : '') + (nT ? ` · ${nT} ${nT === 1 ? 'tornooi' : 'tornooien'}` : '');
    if (!g.mijn) {
      // Kan de app niet onderscheiden: verwijderd, of bestaat nog maar jij hoort er niet meer bij.
      // Een ploeg waar je geen lid van bent, mag je niet eens lezen — dus één eerlijke formulering.
      return `<div class="card" style="margin-bottom:10px;border-left:3px solid var(--org)">
        <b style="font-size:15px">${esc(g.naam)}</b>
        <div style="font-size:13px;color:var(--txt2);margin:2px 0 8px">${info}</div>
        <p style="font-size:13px;color:var(--org2);margin:0 0 10px">Deze ploeg zit niet bij jouw ploegen. Haar spelers kunnen niet terug.</p>
        <div class="fg" style="margin-bottom:0"><label>Wedstrijden toewijzen aan</label>
          <select onchange="herstelZet(${i},'naarNaam',this.value)">
            <option value="" ${g.naarNaam===''?'selected':''}>Overslaan</option>
            ${mijnOpties.map(n => `<option value="${esc(n)}" ${g.naarNaam===n?'selected':''}>${esc(n)}</option>`).join('')}
          </select></div>
      </div>`;
    }
    return `<div class="card ${g.aan ? '' : ''}" style="margin-bottom:10px;${g.aan ? 'border-left:3px solid var(--grn)' : 'opacity:.7'}">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div class="bulk-vink ${g.aan ? '' : ''}" style="${g.aan ? 'background:var(--grn);border-color:var(--grn)' : ''}" onclick="herstelZet(${i},'aan')">${g.aan ? icI(IC.done) : ''}</div>
        <div style="flex:1" onclick="herstelZet(${i},'aan')">
          <b style="font-size:15px">${esc(g.naam)}</b>
          <div style="font-size:13px;color:var(--txt2)">${info}</div>
        </div>
      </div>
      ${g.aan ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <span class="start-chip ${g.mode==='add'?'on':''}" onclick="herstelZet(${i},'mode','add')">Toevoegen wat ontbreekt</span>
        <span class="start-chip ${g.mode==='replace'?'on':''}" onclick="herstelZet(${i},'mode','replace')">Volledig terugzetten</span>
      </div>
      <p style="font-size:12px;color:var(--txt2);margin:8px 0 0">${g.mode === 'add'
        ? 'Enkel wedstrijden die je niet meer hebt. Spelers en bestaande wedstrijden blijven staan.'
        : `Wedstrijden van <b>${esc(g.naam)}</b> worden vervangen door die uit het bestand${g.magKern && (g.kernen||[]).length ? ', en ook de spelerskern' : ''}. Andere ploegen blijven ongemoeid.${!g.magKern && (g.kernen||[]).length ? ' Je bent geen beheerder van deze ploeg, dus de spelers blijven zoals ze zijn.' : ''}`}</p>` : ''}
    </div>`;
  };
  const teDoen = herstelGroepen.filter(g => (g.mijn && g.aan) || (!g.mijn && g.naarNaam));
  return `<div class="hdr"><button class="back" onclick="go('settings')">‹</button><h1>${icI(IC.upload)} Back-up terugzetten</h1></div>
    <div class="content">
      <p style="font-size:13px;color:var(--txt2);margin-bottom:12px">Bestand van <b>${esc(dat)}</b> · ${(d.matches||[]).length} wedstrijden in totaal. Kies per ploeg wat er terug moet. Wat je niet aanvinkt, blijft exact zoals het nu is.</p>
      ${herstelGroepen.map(kaart).join('')}
      ${teDoen.length ? `<button class="btn btn-org" onclick="herstelVoerUit()">${icI(IC.done)} Terugzetten</button>` : `<p style="font-size:13px;color:var(--txt2)">Vink aan wat je terug wil.</p>`}
      <button class="btn btn-gray" style="margin-top:8px" onclick="go('settings')">Annuleren</button>
    </div>`;
}
async function herstelVoerUit() {
  const d = pendingRestore; if (!d) return;
  let toegevoegd = 0, vervangen = 0, kernen = 0, verplaatst = 0;
  const schoon = m => { const c = { ...m }; delete c.fromCloud; return c; };
  for (const g of herstelGroepen) {
    // Ploeg die niet van mij is: enkel wedstrijden, en enkel als je een doelploeg koos.
    if (!g.mijn) {
      if (!g.naarNaam) continue;
      const tid = Object.keys(userTeams).find(t => (teamNames[t] || '').trim() === g.naarNaam);
      const kern = tid === activeTeamId ? (getTeamsV2()[0] || null) : null;
      for (const m of g.wedstrijden) {
        const c = schoon(m);
        c.teamName = g.naarNaam;
        // De ploegverwijzing meenemen als we ze kennen; anders leegmaken in plaats van de oude,
        // niet-bestaande verwijzing te laten staan (die maakt de wedstrijd onbewerkbaar).
        c.teamId = kern ? kern.id : '';
        recomputeScore(c); recomputeOnField(c);
        try { await dbSave(c); verplaatst++; } catch (e) {}
      }
      continue;
    }
    if (!g.aan) continue;
    // De verwijzing naar de spelerslijst gelijkzetten met de kern die we voor deze ploeg kennen.
    // Bij een echte back-up klopt die al (wedstrijden en kern komen van hetzelfde toestel), maar
    // klopt ze niet, dan is zo'n wedstrijd niet bewerkbaar — en dat is precies wat we vandaag
    // hebben opgelost. Kennen we geen kern, dan laten we de verwijzing zoals ze is.
    const kernId = ((g.kernen || [])[0] || {}).id || (g.teamId === activeTeamId ? ((getTeamsV2()[0] || {}).id || '') : '');
    const metKern = m => { const c = schoon(m); if (kernId) c.teamId = kernId; return c; };
    if (g.mode === 'replace') {
      // Enkel de wedstrijden van DEZE ploeg wissen, op naam — precies de verzameling die je in de
      // lijst van die ploeg ziet. Andere ploegen worden niet aangeraakt.
      const bestaand = (await dbAll()).filter(m => ((m.teamName || '').trim() || '(zonder ploegnaam)') === g.naam);
      for (const m of bestaand) { try { await dbDelLocal(m.id); } catch (e) {} }
      for (const m of g.wedstrijden) {
        const c = metKern(m); recomputeScore(c); recomputeOnField(c);
        try { await dbSave(c); vervangen++; } catch (e) {}
      }
      if (g.magKern && (g.kernen || []).length) {
        try {
          cacheRoster(g.teamId, g.kernen);
          if (g.teamId === activeTeamId) saveTeamsV2(g.kernen);
          else if (fbdb) await fbdb.ref('teams/' + g.teamId + '/roster').set(g.kernen);
          kernen++;
        } catch (e) {}
      }
    } else {
      const ids = new Set((await dbAll()).map(m => m.id));
      for (const m of g.wedstrijden) {
        if (ids.has(m.id)) continue;
        const c = metKern(m); recomputeScore(c); recomputeOnField(c);
        try { await dbSave(c); toegevoegd++; } catch (e) {}
      }
    }
    for (const t of (g.tornooien || [])) { try { saveTournament(t); } catch (e) {} }
  }
  pendingRestore = null; herstelGroepen = [];
  const stukjes = [];
  if (toegevoegd) stukjes.push(`${toegevoegd} toegevoegd`);
  if (vervangen) stukjes.push(`${vervangen} teruggezet`);
  if (verplaatst) stukjes.push(`${verplaatst} toegewezen`);
  if (kernen) stukjes.push(`${kernen} ${kernen === 1 ? 'spelerskern' : 'spelerskernen'}`);
  showToast(stukjes.length ? stukjes.join(', ') + '.' : 'Niets gewijzigd.', 'ok');
  go('home');
}
async function doRestore(mode) {
  const data = pendingRestore;
  if (!data) return;
  try {
  // fromCloud strippen: anders ruimt de cloud-listener herstelde wedstrijden die niet
  // (meer) in de cloud staan meteen weer op. Hersteld = lokaal; staat de wedstrijd tóch
  // nog in de cloud, dan wint die versie vanzelf (zelfde id). Pas bij een latere
  // bewerking door een beheerder gaat ze opnieuw naar de cloud van de actieve ploeg.
  const incoming = (data.matches || []).map(m => { const c = { ...m }; delete c.fromCloud; return c; });
  const norm = s => (s || '').trim().toLowerCase();
  if (mode === 'replace') {
    await new Promise((res, rej) => { const tx = db.transaction('matches', 'readwrite'); const st = tx.objectStore('matches'); st.clear(); incoming.forEach(m => st.put(m)); tx.oncomplete = () => res(); tx.onerror = () => rej(); });
    const s = data.settings || {};
    const setOrDel = (k, v) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); };
    setOrDel('voetbal_club_name', s.clubName); setOrDel('voetbal_club_logo', s.clubLogo);
    setOrDel('voetbal_teams_v2', s.teamsV2); setOrDel('voetbal_countdown', s.countdown);
    setOrDel('voetbal_theme', s.theme); setOrDel('voetbal_dark', s.dark);
    setOrDel('voetbal_tournaments', s.tournaments);
  } else {
    // Samenvoegen: enkel wedstrijden toevoegen die nog niet bestaan (op id).
    const existing = await dbAll();
    const ids = new Set(existing.map(m => m.id));
    const toAdd = incoming.filter(m => !ids.has(m.id));
    if (toAdd.length) await new Promise((res, rej) => { const tx = db.transaction('matches', 'readwrite'); const st = tx.objectStore('matches'); toAdd.forEach(m => st.put(m)); tx.oncomplete = () => res(); tx.onerror = () => rej(); });
    // Ploegen samenvoegen (op naam) indien aanwezig in de back-up.
    if (data.settings && data.settings.teamsV2) {
      let inc = []; try { inc = JSON.parse(data.settings.teamsV2) || []; } catch (e) {}
      const cur = getTeamsV2(); const keys = new Set(cur.map(t => norm(t.name)));
      inc.forEach(t => { if (!keys.has(norm(t.name))) { cur.push(t); keys.add(norm(t.name)); } });
      saveTeamsV2(cur);
    }
    if (data.settings && data.settings.tournaments) {
      let incT = []; try { incT = JSON.parse(data.settings.tournaments) || []; } catch(e) {}
      const curT = getTournaments(); const tIds = new Set(curT.map(t => t.id));
      incT.forEach(t => { if (!tIds.has(t.id)) { curT.push(t); tIds.add(t.id); } });
      localStorage.setItem('voetbal_tournaments', JSON.stringify(curT));
    }
  }
  localStorage.setItem('voetbal_setup_done', '1');
  pendingRestore = null;
  closeModal(); match = null; applyStoredTheme(); applyDark(); go('home');
  const cloudNote = (cloudReady && activeTeamId) ? ' (als lokale wedstrijden)' : '';
  setTimeout(() => showToast((mode === 'replace' ? 'Back-up hersteld' : 'Back-ups samengevoegd') + cloudNote, 'ok'), 100);
  } catch (e) {
    // Falende IndexedDB-write: modal sluiten en duidelijk melden i.p.v. een stille unhandled rejection.
    closeModal();
    showToast('Herstellen mislukt — er is niets (of slechts gedeeltelijk) hersteld. Probeer opnieuw.', 'err');
  }
}
// Opent de mailapp met een voorgevuld probleemrapport (versie, rol, ploeg, toestel).
function reportProblem() {
  const role = isOwner ? 'Eigenaar' : isClubAdmin ? 'Clubbeheerder' : isAdmin ? 'Ploegbeheerder' : isGuest ? 'Gast' : currentUser ? 'Kijker' : 'Niet aangemeld';
  const club = getClubName() || '';
  const subject = `Match Delegate v${APP_VERSION} — probleem melden`;
  const infoLines = [`Versie: ${APP_VERSION}`, `Rol: ${role}`];
  if (club) infoLines.push(`Ploeg: ${club}`);
  infoLines.push(`Toestel: ${navigator.userAgent}`);
  const body = ['Beschrijf hieronder wat er misliep:', '', '', '---', ...infoLines].join('\n');
  window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function confirmChangeEmail() {
  openModal(`<h3>E-mailadres wijzigen</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:14px">Je krijgt een bevestigingsmail op je <b>nieuwe</b> adres. Pas nadat je die link aanklikt, wordt je e-mailadres aangepast. Je rol en ploegen blijven behouden.</p>
    <div class="fg"><label>Nieuw e-mailadres</label><input id="ce-email" type="email" placeholder="nieuw@example.com"></div>
    <div class="fg fg-pwd"><label>Huidig wachtwoord</label><input id="ce-pwd" type="password" placeholder="wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="ce-err"></div>
    <button class="btn btn-green" onclick="doChangeEmail()">Bevestigingsmail versturen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doChangeEmail() {
  const email = (document.getElementById('ce-email') || {}).value || '';
  const pwd = (document.getElementById('ce-pwd') || {}).value || '';
  const err = document.getElementById('ce-err');
  if (!email.trim()) { if (err) err.textContent = 'Geef een nieuw e-mailadres in.'; return; }
  if (!pwd) { if (err) err.textContent = 'Geef je huidige wachtwoord in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pwd);
    await currentUser.reauthenticateWithCredential(cred);
    await currentUser.verifyBeforeUpdateEmail(email.trim());
    closeModal();
    showToast('Bevestigingsmail verstuurd naar ' + email.trim() + '. Klik de link in die mail (kijk ook in spam).', 'ok');
  } catch (e) {
    if (err) err.textContent = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') ? 'Onjuist wachtwoord.'
      : e.code === 'auth/invalid-email' ? 'Ongeldig e-mailadres.'
      : e.code === 'auth/email-already-in-use' ? 'Dit e-mailadres is al in gebruik.'
      : 'Wijzigen mislukt, probeer opnieuw.';
  }
}

function confirmChangePassword() {
  openModal(`<h3>${icI(IC.lock)} Wachtwoord wijzigen</h3>
    <div class="fg fg-pwd"><label>Huidig wachtwoord</label><input id="cp-old" type="password" autocomplete="current-password" placeholder="huidig wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="fg fg-pwd"><label>Nieuw wachtwoord</label><input id="cp-new" type="password" autocomplete="new-password" placeholder="min. 6 tekens"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="fg fg-pwd"><label>Nieuw wachtwoord bevestigen</label><input id="cp-new2" type="password" autocomplete="new-password" placeholder="herhaal nieuw wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="cp-err"></div>
    <button class="btn btn-green" onclick="doChangePassword()">Wachtwoord wijzigen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doChangePassword() {
  const oldPwd = (document.getElementById('cp-old') || {}).value || '';
  const newPwd = (document.getElementById('cp-new') || {}).value || '';
  const newPwd2 = (document.getElementById('cp-new2') || {}).value || '';
  const err = document.getElementById('cp-err');
  if (!oldPwd) { if (err) err.textContent = 'Geef je huidig wachtwoord in.'; return; }
  if (newPwd.length < 6) { if (err) err.textContent = 'Nieuw wachtwoord moet minstens 6 tekens zijn.'; return; }
  if (newPwd !== newPwd2) { if (err) err.textContent = 'De twee nieuwe wachtwoorden zijn niet gelijk.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, oldPwd);
    await currentUser.reauthenticateWithCredential(cred);
    await currentUser.updatePassword(newPwd);
    closeModal();
    showToast('Wachtwoord succesvol gewijzigd.', 'ok');
  } catch (e) {
    if (err) err.textContent = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') ? 'Huidig wachtwoord is onjuist.'
      : e.code === 'auth/weak-password' ? 'Nieuw wachtwoord moet minstens 6 tekens zijn.'
      : 'Wijzigen mislukt, probeer opnieuw.';
  }
}

function confirmChangeName() {
  openModal(`<h3>${icI(IC.edit)} Naam wijzigen</h3>
    <div class="fg"><label>Nieuwe naam</label><input id="cn-name" type="text" value="${esc(currentUser.displayName || '')}" placeholder="Jouw naam" autocomplete="off"></div>
    <div class="auth-err" id="cn-err"></div>
    <button class="btn btn-green" onclick="doChangeName()">Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doChangeName() {
  const name = ((document.getElementById('cn-name') || {}).value || '').trim();
  const err = document.getElementById('cn-err');
  if (!name) { if (err) err.textContent = 'Geef een naam in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    await currentUser.updateProfile({ displayName: name });
    await fbdb.ref('users/' + currentUser.uid).update({ displayName: name });
    closeModal(); render();
  } catch (e) { if (err) err.textContent = 'Er ging iets mis, probeer opnieuw.'; }
}

function confirmDeleteAccount() {
  openModal(`<h3>Account verwijderen</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px;font-size:14px">Je account wordt permanent verwijderd. Je ploegen en data in de cloud blijven bewaard voor andere leden.</p>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:16px">Geef je wachtwoord in ter bevestiging:</p>
    <div class="fg fg-pwd"><input id="del-pwd" type="password" placeholder="wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="del-err"></div>
    <button class="btn btn-red" onclick="doDeleteAccount()">Permanent verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}

async function doDeleteAccount() {
  const pwd = (document.getElementById('del-pwd') || {}).value || '';
  const err = document.getElementById('del-err');
  if (!pwd) { if (err) err.textContent = 'Geef je wachtwoord in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pwd);
    await currentUser.reauthenticateWithCredential(cred);
    const uid = currentUser.uid;
    // Eigen sporen opruimen vóór het account zelf weg is; team- en wedstrijddata van anderen
    // blijft bewust bestaan (zie de bevestigingstekst). Zelfde routine als bij het afmelden van
    // een gast, zodat beide paden niet uit elkaar kunnen lopen.
    await wisEigenCloudSporen(uid);
    await currentUser.delete();
    await clearLocalDeviceData(uid);
    closeModal();
    activeTeamId = null; userTeams = {}; isAdmin = false; viewerMode = false;
  } catch (e) {
    if (err) err.textContent = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') ? 'Onjuist wachtwoord.' : 'Verwijderen mislukt. Probeer opnieuw.';
  }
}

// ---- Naam van ploeg wijzigen ----
function showRenameTeamModal() {
  // Hernoemen mag elke ploegbeheerder van DEZE ploeg (isAdmin), niet enkel wie systeembreed
  // goedgekeurd is om nieuwe ploegen aan te maken (isApprovedAdmin) — de backend-regel
  // (database.rules.json, teams/$teamId/.write) staat dit ook al toe aan elke team-admin.
  // Verwijderen blijft bewust strenger (isApprovedAdmin + createdBy), zie confirmDeleteCloudTeam().
  if (!isAdmin || !activeTeamId || !fbdb) return;
  const current = getClubName() || '';
  openModal(`<h3>${icI(IC.edit)} Naam ploeg wijzigen</h3>
    <div class="fg"><label>Nieuwe naam</label><input id="rename-team-input" type="text" value="${esc(current)}" autofocus></div>
    <div class="auth-err" id="rename-team-err"></div>
    <button class="btn btn-org" id="rename-team-btn" onclick="doRenameTeam()">Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doRenameTeam() {
  const input = document.getElementById('rename-team-input');
  const err = document.getElementById('rename-team-err');
  const btn = document.getElementById('rename-team-btn');
  const name = (input ? input.value : '').trim();
  if (!name) { if (err) err.textContent = 'Geef een naam in.'; return; }
  if (err) err.textContent = 'Bezig...';
  if (btn) btn.disabled = true;
  const oldClubName = getClubName() || '';
  try {
    await fbdb.ref('teams/' + activeTeamId + '/info/name').set(name);
    await fbdb.ref('teams/' + activeTeamId + '/club/name').set(name);
    localStorage.setItem('voetbal_club_name', name);
    teamNames[activeTeamId] = name;
    // Zonder deze persist valt de in-memory cache na een refresh terug op de oude naam
    // (zie preloadTeamNames/selectTeam in core.js), en blijft de ploegenkeuze-pagina de
    // oude naam tonen.
    try { localStorage.setItem('voetbal_teamNames', JSON.stringify(teamNames)); } catch (e) {}
    // Roster-naam (Spelers-pagina, tornooiwizard) en bestaande wedstrijden dragen een apart
    // naamveld dat nooit automatisch meeliep met de club-naam — zie syncTeamNaming (core.js).
    await syncTeamNaming(name, [oldClubName]);
    closeModal();
    render();
  } catch (e) {
    if (err) err.textContent = 'Er ging iets mis, probeer opnieuw.';
    if (btn) btn.disabled = false;
  }
}

// ---- Hele ploeg (Firebase-team) verwijderen ----
// De knop stond tot v1.1.3 onderaan het ploegscherm (confirmDeleteCloudTeam/doDeleteCloudTeam,
// hier verwijderd). Sinds v1.1.4 gebeurt dat uitsluitend in Clubbeheer, naast Archiveren, via
// ownerDeleteTeam() in core.js — het hoort bij de club, net als een ploeg aanmaken. Voor een
// clubbeheerder staat die knop daar grijs: de databankregels laten enkel de eigenaar hard
// verwijderen, hij archiveert.

