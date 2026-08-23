// ===================== KALENDER IMPORTEREN (ICS / EXCEL / CSV) =====================
// Een seizoenskalender met dertig wedstrijden intikken is werk van een halve avond. Foot24 (en de
// meeste bondssites) geven diezelfde kalender als agendabestand (.ics) of als tabel (.xlsx/.csv).
// Dit bestand leest die drie vormen, laat je in één lijst kiezen wat er binnen mag, en maakt er
// gewone GEPLANDE wedstrijden van — exact hetzelfde objectformaat als de wizard (zie
// finishStep1Only in wizard-prep.js). Er komt geen nieuw veld in het datamodel bij: een
// geïmporteerde wedstrijd is niet te onderscheiden van een handmatig ingevoerde, behalve door
// m.importUid (optioneel, enkel om dezelfde agenda later opnieuw te kunnen inlezen zonder dubbels).
//
// GEEN EXTERNE BIBLIOTHEEK. Een .xlsx is een zip met XML erin; de browser kan zelf uitpakken
// (DecompressionStream 'deflate-raw'), dus hoeft er geen SheetJS van een halve megabyte mee in de
// app. Een .ics is platte tekst. Alles hieronder is dus eigen code, ~zelfde grootteorde als één
// wizardstap.
//
// WAT DIT BESTAND NOOIT DOET: bestaande wedstrijden aanraken die je niet zelf aanvinkt. Een dubbel
// (zelfde datum + tegenstander) staat standaard uit; vink je hem toch aan, dan worden enkel de
// velden uit het bestand bijgewerkt (datum, uur, thuis/uit, plaats) en blijven selectie, opstelling,
// plan, events en notities ongemoeid.

// Toestand van het importscherm. Leeft enkel zolang je op dat scherm bent.
let impSt = null;

// ---------------------------------------------------------------------------------------------
// SCHERM
// ---------------------------------------------------------------------------------------------
function impStart() {
  if (!canManage()) { showToast('Enkel een beheerder kan een kalender importeren.', 'err'); return; }
  const teams = getTeamsV2();
  const team = (cloudReady && activeTeamId ? teamById(activeTeamId) : null) || teams[0] || null;
  const md = teamMatchDefaults(team);
  impSt = {
    fase: 'kies', bron: '', bestand: '', fout: '',
    regels: [], eigenClub: '', clubKeuzes: [],
    // tabelmodus (xlsx/csv)
    tabellen: [], bladIndex: 0, kopIndex: -1, kolommen: [], map: null,
    // instellingen die in geen enkel kalenderbestand staan — één keer voor de hele import
    teamId: (team || {}).id || '', subteam: '',
    // Format, blokken en blokduur staan in geen enkel kalenderbestand, dus die komen uit de
    // standaardinstelling van de ploeg — je kan ze bovenaan nog voor de hele import wijzigen.
    matchType: md.matchType, periodKey: md.periodKey, quarterDuration: md.quarterDuration,
    competition: 'Competitie',
  };
  go('importcal');
}

function renderImportCal() {
  if (!impSt) impStart();
  const body = impSt.fase === 'lijst' ? impLijstHtml() : impKiesHtml();
  return `<div class="hdr"><button class="back" onclick="impTerug()">‹</button><h1>${icI(IC.upload)} Kalender importeren</h1></div>
    <div class="content" id="imp-content">${body}</div>`;
}
function impTerug() {
  if (impSt && impSt.fase === 'lijst') { impSt.fase = 'kies'; impSt.regels = []; impSt.fout = ''; render(); return; }
  impSt = null; go('matches');
}
// Enkel het inhoudsblok hertekenen: de titelbalk hoeft niet mee, en zo blijft de scrollpositie
// van een lange lijst bewaard bij het aan- en uitvinken.
function impRender() {
  const el = document.getElementById('imp-content');
  if (!el) { render(); return; }
  el.innerHTML = impSt.fase === 'lijst' ? impLijstHtml() : impKiesHtml();
}

function impKiesHtml() {
  return `
    <div class="card">
      <p style="font-size:14px;color:var(--txt2);margin:0 0 14px">Kies het kalenderbestand van je ploeg. Op <b>Foot24</b> staat bij je reeks een knop om de kalender als <b>agenda (.ics)</b> te downloaden — dat is de gemakkelijkste weg. Krijg je de kalender van je club als tabel doorgestuurd (<b>.xlsx</b> of <b>.csv</b>), dan kan die ook.</p>
      <div class="fg"><label>Bestand</label>
        <input id="imp-file" type="file" accept=".ics,.ical,.xlsx,.csv,.txt,text/calendar" onchange="impBestand(this)"
               style="width:100%;padding:10px;border:2px dashed var(--bdr);border-radius:8px;font-size:14px;background:var(--card);color:var(--txt)"></div>
      ${impSt.fout ? `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(220,60,60,.12);color:var(--rd);font-size:14px;font-weight:600">${icI(IC.warn)}${esc(impSt.fout)}</div>` : ''}
      <p style="font-size:13px;color:var(--txt2);margin:14px 0 0">Er wordt nog niets bewaard: je krijgt eerst de volledige lijst te zien en kiest zelf welke wedstrijden erbij komen.</p>
    </div>`;
}

function impLijstHtml() {
  const teams = getTeamsV2();
  const rs = impSt.regels;
  const aan = rs.filter(r => r.aan).length;
  const nieuw = rs.filter(r => r.aan && !r.bestaat).length;
  const bij = aan - nieuw;
  const isCustomDur = impSt.quarterDuration && !(DURATIONS[impSt.periodKey] || []).includes(impSt.quarterDuration);
  const teamSel = teams.length
    ? `<select id="imp-team" onchange="impZetTeam(this.value)">${teams.map(t => `<option value="${t.id}" ${impSt.teamId===t.id?'selected':''}>${esc(t.name)} (${t.players.length})</option>`).join('')}</select>`
    : `<div style="font-size:14px;color:var(--txt2);padding:6px 0">Nog geen ploegen. <a onclick="go('teams')" style="color:var(--grn);font-weight:700;cursor:pointer">Maak eerst een ploeg aan →</a></div>`;
  // In tabelmodus bepaal je zelf welke kolom wat is. Bij een agendabestand staat dat vast.
  const mapKaart = impSt.bron === 'tabel' ? impMapHtml() : '';
  // Enkel bij een agendabestand: in tabelmodus staat de eigen club al als tekstveld bij de kolommen.
  const clubKaart = (impSt.bron === 'ics' && impSt.clubKeuzes.length > 1) ? `
    <div class="fg"><label>Eigen club in dit bestand</label>
      <select onchange="impZetClub(this.value)">${impSt.clubKeuzes.map(c => `<option value="${esc(c.naam)}" ${impSt.eigenClub===c.naam?'selected':''}>${esc(c.naam)} (${c.n}×)</option>`).join('')}</select>
      <div style="font-size:12px;color:var(--txt2);margin-top:4px">Hieraan zie ik wie de tegenstander is en of je thuis of uit speelt.</div></div>` : '';

  return `
    <div class="card">
      <div style="font-size:14px;font-weight:700;margin-bottom:2px">${esc(impSt.bestand)}</div>
      <div style="font-size:13px;color:var(--txt2);margin-bottom:12px">${rs.length} ${rs.length === 1 ? 'wedstrijd' : 'wedstrijden'} gevonden${impSt.overgeslagen ? ` · ${impSt.overgeslagen} andere agenda-items overgeslagen` : ''}${impSt.eigenClub && impSt.clubKeuzes.length <= 1 ? ` · eigen club: <b>${esc(impSt.eigenClub)}</b>` : ''}</div>
      ${clubKaart}
      <div class="fg"><label>Eigen ploeg</label>${teamSel}</div>
      ${/* Speelt een club met een A- en een B-ploeg onder dezelfde ploegnaam, dan staat op dezelfde
           dag twee keer een wedstrijd. Het label houdt die twee kalenders uit elkaar, óók bij het
           herkennen van dubbels — vandaar dat het hier meteen hertekent. */''}
      <div class="fg"><label>Ploeg-label (optioneel)</label>
        <input type="text" value="${esc(impSt.subteam)}" oninput="impVeld('subteam',this.value)" onchange="impHermarkeer()" placeholder="bv. A of B" autocomplete="off">
        ${impSt.subteamVoorstel ? `<div style="font-size:12px;color:var(--txt2);margin-top:4px">Uit de reeksnaam in het bestand (<b>${esc(impSt.subteamVoorstel)}</b>). Lees je de kalender van je andere ploeg in, zet hier dan haar label.</div>` : ''}</div>
      <div class="fg"><label>Format</label>
        <select onchange="impVeld('matchType',this.value)">${['3v3','5v5','8v8','11v11'].map(t => `<option value="${t}" ${impSt.matchType===t?'selected':''}>${t.replace('v',' tegen ')}</option>`).join('')}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="fg"><label>Aantal blokken</label>
          <select id="imp-pt" onchange="impPeriode()">${['helften','delen','kwarten'].map(k => `<option value="${k}" ${impSt.periodKey===k?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
        <div class="fg"><label>Duur van een blok</label>
          <select id="imp-qd" onchange="impDuur()">${durOptsHtml(impSt.periodKey, impSt.quarterDuration)}</select>
          <input id="imp-qd-custom" type="number" min="1" max="99" placeholder="min." oninput="impDuur()" style="margin-top:6px;${isCustomDur?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;color:var(--txt);background:var(--card);-webkit-appearance:none" value="${isCustomDur?impSt.quarterDuration:''}"></div>
      </div>
      <div class="fg"><label>Soort</label>
        <select onchange="impVeld('competition',this.value)">${['Competitie','Vriendschappelijk','Beker'].map(c => `<option ${impSt.competition===c?'selected':''}>${c}</option>`).join('')}</select>
        <div style="font-size:12px;color:var(--txt2);margin-top:4px">Geldt voor alles wat je nu importeert; per wedstrijd nadien aan te passen.</div></div>
      ${mapKaart}
    </div>
    ${rs.length ? `
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <button class="btn btn-gray" style="margin:0;flex:1;padding:10px" onclick="impAlles(true)">Alles aan</button>
      <button class="btn btn-gray" style="margin:0;flex:1;padding:10px" onclick="impAlles(false)">Alles uit</button>
    </div>
    <div id="imp-lijst">${rs.map(impRegelHtml).join('')}</div>
    <button class="btn btn-green" style="margin-top:14px" onclick="impVoerUit()" ${aan ? '' : 'disabled style="margin-top:14px;opacity:.5"'}>
      ${icI(IC.check)} ${aan ? `${aan} ${aan === 1 ? 'wedstrijd' : 'wedstrijden'} importeren` : 'Niets aangevinkt'}</button>
    ${bij ? `<div style="font-size:13px;color:var(--txt2);text-align:center;margin-top:8px">${nieuw} nieuw · ${bij} bestaande ${bij === 1 ? 'wedstrijd wordt' : 'wedstrijden worden'} bijgewerkt: tegenstander, datum, uur, thuis/uit en plaats. Selectie, opstelling en plan blijven staan.</div>` : ''}`
    : `<div class="empty"><div class="ei">${IC.search}</div><p>Geen wedstrijden herkend in dit bestand.${impSt.bron === 'tabel' ? '<br>Kijk hierboven na welke kolom de datum en de tegenstander bevat.' : ''}</p></div>`}
    <button class="btn btn-gray" style="margin-top:10px" onclick="impTerug()">Ander bestand kiezen</button>`;
}

function impRegelHtml(r, i) {
  const dag = r.datum ? new Date(r.datum + 'T12:00:00') : null;
  const dagTxt = dag && !isNaN(dag) ? dag.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' }) : (r.datum || '?');
  return `<div class="match-item ${r.bestaat ? 'cancel-border' : 'plan-border'}" style="cursor:pointer;${r.aan ? '' : 'opacity:.55'}" onclick="impToggle(${i})">
    <div style="display:flex;align-items:center;gap:12px;width:100%">
      <input type="checkbox" ${r.aan ? 'checked' : ''} onclick="event.stopPropagation();impToggle(${i})" style="width:22px;height:22px;flex-shrink:0;accent-color:var(--grn)">
      <div class="mi-info" style="min-width:0">
        <div class="mi-opp">${esc(r.tegenstander || '?')}</div>
        <div class="mi-date">${esc(dagTxt)}${r.tijd ? ' · ' + esc(r.tijd) : ''}${r.venue ? ' · ' + esc(r.venue) : ''}</div>
        ${/* Aantikbaar: een tabel zonder thuis/uit-kolom maakt van álles een thuismatch, en dan wil
             je dat hier kunnen rechtzetten in plaats van na de import wedstrijd per wedstrijd. */''}
        <span class="badge badge-plan" style="cursor:pointer" title="Wissel thuis/uit"
              onclick="event.stopPropagation();impWisselTU(${i})">${r.thuis ? icI(IC.home) + 'Thuis' : icI(IC.plane) + 'Uit'}</span>
        ${r.reeks ? `<span class="badge badge-type">${esc(r.reeks)}</span>` : ''}
        ${r.bestaat ? `<span class="badge badge-cancel">${icI(IC.warn)}${r.andereNaam ? 'Staat er al als ' + esc(r.andereNaam) : 'Staat er al'}${r.bestaatStatus === 'done' ? ' · gespeeld' : (r.bestaatStatus === 'live' ? ' · loopt nu' : '')}</span>` : ''}
        ${r.dagWaarschuwing ? `<span class="badge badge-type">${icI(IC.warn)}Ook ${esc(r.dagWaarschuwing)} op deze dag</span>` : ''}
      </div>
    </div></div>`;
}

// Keuzelijstjes voor een tabelbestand: welke kolom is wat. Automatisch voorgesteld op de kopnamen,
// maar altijd zelf bij te sturen — Foot24's tabel is niet de enige tabel ter wereld.
function impMapHtml() {
  const opts = (sel) => `<option value="-1" ${sel === -1 ? 'selected' : ''}>— niet gebruiken —</option>`
    + impSt.kolommen.map((k, i) => `<option value="${i}" ${sel === i ? 'selected' : ''}>${esc(k || 'kolom ' + (i + 1))}</option>`).join('');
  const rij = (label, sleutel, hint) => `<div class="fg"><label>${label}</label>
    <select onchange="impZetMap('${sleutel}',this.value)">${opts(impSt.map[sleutel])}</select>
    ${hint ? `<div style="font-size:12px;color:var(--txt2);margin-top:4px">${hint}</div>` : ''}</div>`;
  const bladen = impSt.tabellen.length > 1 ? `<div class="fg"><label>Werkblad</label>
    <select onchange="impZetBlad(this.value)">${impSt.tabellen.map((t, i) => `<option value="${i}" ${impSt.bladIndex === i ? 'selected' : ''}>${esc(t.naam)} (${t.rijen.length} rijen)</option>`).join('')}</select></div>` : '';
  return `<details class="more-details" open>
    <summary>Kolommen van het bestand</summary>
    <div style="margin-top:12px">
      ${bladen}
      ${rij('Datum', 'datum')}
      ${rij('Uur', 'tijd')}
      ${rij('Thuisploeg', 'thuisploeg', 'Vul thuis- én uitploeg in, óf enkel de tegenstander hieronder.')}
      ${rij('Uitploeg', 'uitploeg')}
      ${rij('Tegenstander', 'tegenstander')}
      ${rij('Thuis of uit', 'tu', 'Een kolom met bv. T/U of thuis/uit.')}
      ${rij('Plaats', 'venue')}
      ${rij('Speeldag', 'speeldag')}
      <div class="fg"><label>Naam van je eigen club in het bestand</label>
        <input type="text" value="${esc(impSt.eigenClub)}" oninput="impVeld('eigenClub',this.value);" onchange="impHerbouw()" placeholder="bv. SPARTA PETEGEM DEINZE">
        <div style="font-size:12px;color:var(--txt2);margin-top:4px">Nodig zodra je met een thuis- en een uitploegkolom werkt.</div></div>
    </div></details>`;
}

// ---------------------------------------------------------------------------------------------
// BEDIENING
// ---------------------------------------------------------------------------------------------
function impVeld(k, v) { if (impSt) impSt[k] = v; }
// De ploeg en het ploeg-label bepalen mee wat als dubbel geldt, dus na een wijziging daaraan moeten
// de "staat er al"-markeringen opnieuw berekend worden.
async function impHermarkeer() { await impMarkeerDubbels(); impRender(); }
async function impZetTeam(id) { impSt.teamId = id; await impHermarkeer(); }
function impPeriode() {
  const pt = document.getElementById('imp-pt').value;
  impSt.periodKey = pt; impSt.quarterDuration = DUR_DEFAULT[pt];
  impRender();
}
function impDuur() { impSt.quarterDuration = readDur('imp-qd', 'imp-qd-custom', impSt.quarterDuration); const s = document.getElementById('imp-qd'), i = document.getElementById('imp-qd-custom'); if (s && i) i.style.display = s.value === '0' ? '' : 'none'; }
function impToggle(i) {
  const r = impSt.regels[i]; if (!r) return;
  r.aan = !r.aan; impRender();
}
// "Alles aan" laat een GESPEELDE of lopende wedstrijd staan (audit 23-08-2026). Eén tik zette
// anders ook die regels aan, en dan schrijft de bondskalender datum, uur, thuis/uit, terrein en
// tegenstander over een wedstrijd waar al een verslag aan hangt. Wil je zo'n regel toch bijwerken,
// dan vink je ze zelf aan — dat blijft mogelijk, het gebeurt alleen niet meer per ongeluk.
// "Alles uit" zet gewoon alles uit: dat kan niets overschrijven.
function impAlles(aan) {
  let overgeslagen = 0;
  impSt.regels.forEach(r => {
    if (aan && r.gespeeld) { r.aan = false; overgeslagen++; return; }
    r.aan = aan;
  });
  impRender();
  if (overgeslagen) showToast(`${overgeslagen} ${overgeslagen === 1 ? 'wedstrijd is' : 'wedstrijden zijn'} al gespeeld — die laat ik staan. Vink ze zelf aan als je ze toch wil bijwerken.`, 'ok');
}
function impWisselTU(i) { const r = impSt.regels[i]; if (!r) return; r.thuis = !r.thuis; impRender(); }
async function impZetClub(naam) { impSt.eigenClub = naam; await impHerbouw(); }
async function impZetMap(sleutel, waarde) { impSt.map[sleutel] = parseInt(waarde, 10); await impHerbouw(); }
async function impZetBlad(i) {
  impSt.bladIndex = parseInt(i, 10);
  const t = impSt.tabellen[impSt.bladIndex];
  impSt.kopIndex = impTabelKop(t.rijen);
  impSt.kolommen = impSt.kopIndex >= 0 ? (t.rijen[impSt.kopIndex] || []).map(c => String(c || '')) : [];
  impSt.map = impAutoMap(impSt.kolommen);
  await impHerbouw();
}
// Zelfde truc als bij een agendabestand: staat er een thuis- én een uitploegkolom, dan is jóuw club
// de naam die in bijna elke rij voorkomt. Zonder dit blijft de lijst leeg tot je je clubnaam met de
// hand intikt — en dat is niet het eerste wat je verwacht na het kiezen van een bestand.
function impTabelClubKandidaten() {
  const t = impSt.tabellen[impSt.bladIndex], map = impSt.map;
  if (!t || map.thuisploeg < 0 || map.uitploeg < 0) return [];
  const tel = new Map();
  t.rijen.slice(impSt.kopIndex + 1).forEach(rij => {
    [rij[map.thuisploeg], rij[map.uitploeg]].forEach(n => {
      const naam = String(n || '').trim(); if (!naam) return;
      const k = impNorm(naam); const c = tel.get(k) || { naam, n: 0 }; c.n++; tel.set(k, c);
    });
  });
  const max = Math.max(0, ...[...tel.values()].map(c => c.n));
  return [...tel.values()].filter(c => c.n > 1 && c.n >= max * 0.4).sort((a, b) => b.n - a.n);
}
// Regels opnieuw opbouwen na een wijziging aan de kolomkeuze of de eigen club.
async function impHerbouw() {
  if (impSt.bron === 'tabel') {
    // Na elke wijziging aan de kolomkeuze opnieuw kijken wie de eigen club is — een zelf ingetikte
    // naam blijft staan.
    impSt.clubKeuzes = impTabelClubKandidaten();
    if (!impSt.eigenClub) impSt.eigenClub = (impSt.clubKeuzes[0] || {}).naam || '';
    impSt.regels = impTabelNaarRegels();
  }
  else impSt.regels = impIcsNaarRegels(impSt.icsEvents);
  await impMarkeerDubbels();
  impRender();
}

// ---------------------------------------------------------------------------------------------
// BESTAND INLEZEN
// ---------------------------------------------------------------------------------------------
async function impBestand(inp) {
  const f = inp && inp.files && inp.files[0];
  if (!f) return;
  impSt.fout = ''; impSt.bestand = f.name;
  const naam = f.name.toLowerCase();
  try {
    if (naam.endsWith('.xlsx')) {
      const buf = await f.arrayBuffer();
      impSt.bron = 'tabel';
      impSt.tabellen = await xlsxTabellen(buf);
      if (!impSt.tabellen.length) throw new Error('Geen werkbladen gevonden in dit Excel-bestand.');
      await impZetBlad(0);
    } else {
      const txt = await f.text();
      if (/BEGIN:VCALENDAR/i.test(txt)) {
        impSt.bron = 'ics';
        impSt.icsEvents = icsParse(txt);
        impSt.clubKeuzes = icsClubKandidaten(impSt.icsEvents);
        impSt.eigenClub = (impSt.clubKeuzes[0] || {}).naam || '';
        impSt.regels = impIcsNaarRegels(impSt.icsEvents);
        // Label uit de reeksnaam voorstellen vóór het zoeken naar dubbels: het bepaalt mee welke
        // bestaande wedstrijden in aanmerking komen.
        impSt.subteamVoorstel = impSubteamUitReeks(impSt.regels);
        if (!impSt.subteam && impSt.subteamVoorstel) impSt.subteam = impSt.subteamVoorstel;
        await impMarkeerDubbels();
      } else {
        impSt.bron = 'tabel';
        impSt.tabellen = [{ naam: f.name, rijen: csvTabel(txt) }];
        await impZetBlad(0);
      }
    }
    impSt.fase = 'lijst';
  } catch (e) {
    impSt.fout = (e && e.message) || 'Dit bestand kon ik niet lezen.';
    impSt.fase = 'kies';
  }
  impRender();
}

// ---------------------------------------------------------------------------------------------
// ICS (RFC 5545)
// ---------------------------------------------------------------------------------------------
// Lange waarden worden in een agendabestand over meerdere regels geplooid: een vervolgregel begint
// met een spatie of tab. Eerst weer aan elkaar plakken, anders knipt een adres of een ploegnaam
// middenin. (In Tims Foot24-bestand gebeurt dat bij DESCRIPTION.)
function icsUnfold(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '');
}
function icsUnesc(v) {
  return String(v).replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}
// Alle VEVENTs met hun eigenschappen. VTIMEZONE en VALARM worden overgeslagen: die dragen dezelfde
// veldnamen (DTSTART, DESCRIPTION) en zouden de wedstrijd overschrijven.
function icsParse(text) {
  const lijnen = icsUnfold(text).split('\n');
  const events = [];
  let ev = null, negeer = 0, calNaam = '';
  for (const raw of lijnen) {
    const lijn = raw.trim();
    if (!lijn) continue;
    const boven = lijn.toUpperCase();
    if (boven === 'BEGIN:VTIMEZONE' || boven === 'BEGIN:VALARM' || boven === 'BEGIN:STANDARD' || boven === 'BEGIN:DAYLIGHT') { negeer++; continue; }
    if (boven === 'END:VTIMEZONE' || boven === 'END:VALARM' || boven === 'END:STANDARD' || boven === 'END:DAYLIGHT') { negeer = Math.max(0, negeer - 1); continue; }
    if (boven === 'BEGIN:VEVENT') { ev = { _props: {} }; continue; }
    if (boven === 'END:VEVENT') { if (ev) { ev.calNaam = calNaam; events.push(ev); } ev = null; continue; }
    if (negeer) continue;
    const dp = lijn.indexOf(':');
    if (dp < 0) continue;
    const kop = lijn.slice(0, dp), waarde = lijn.slice(dp + 1);
    const delen = kop.split(';');
    const naam = delen[0].toUpperCase();
    const params = {};
    delen.slice(1).forEach(p => { const i = p.indexOf('='); if (i > 0) params[p.slice(0, i).toUpperCase()] = p.slice(i + 1).replace(/^"|"$/g, ''); });
    if (!ev) { if (naam === 'X-WR-CALNAME' || naam === 'NAME') calNaam = calNaam || icsUnesc(waarde); continue; }
    ev._props[naam] = { waarde: icsUnesc(waarde), params };
  }
  return events;
}
function icsProp(ev, naam) { const p = ev._props[naam]; return p ? p.waarde : ''; }
// DTSTART kent drie vormen: een datum met TZID of zonder (lokale tijd — die neem ik letterlijk over,
// want de app bewaart datum en uur als tekst), een datum met Z (UTC — die reken ik om naar de tijd
// van het toestel) en een dag zonder uur.
function icsDatumTijd(ev) {
  const p = ev._props['DTSTART'];
  if (!p) return { datum: '', tijd: '' };
  const v = p.waarde.trim();
  let m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?Z$/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
    const p2 = n => String(n).padStart(2, '0');
    return { datum: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`, tijd: `${p2(d.getHours())}:${p2(d.getMinutes())}` };
  }
  m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (m) return { datum: `${m[1]}-${m[2]}-${m[3]}`, tijd: `${m[4]}:${m[5]}` };
  m = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return { datum: `${m[1]}-${m[2]}-${m[3]}`, tijd: '' };
  return { datum: '', tijd: '' };
}
// De twee ploegnamen uit een titel als "⚽ SPARTA PETEGEM DEINZE - SPORTKRING ROESELARE (U11 A)".
// Enkel een gewoon koppelteken met spaties eromheen geldt als scheiding: Foot24 zet zijn reclame
// ("... reeks U11 A – Internationaal tornooivoetbal") met een langer streepje, en die mag niet als
// wedstrijd binnenglippen.
function icsTitelDelen(titel) {
  let t = String(titel || '').trim();
  t = t.replace(/^[^\p{L}\p{N}]+/u, '').trim();       // ⚽ en andere sierteken vooraan weg
  let reeks = '';
  const rm = t.match(/\s*\(([^()]{1,30})\)\s*$/);
  if (rm) { reeks = rm[1].trim(); t = t.slice(0, rm.index).trim(); }
  const i = t.indexOf(' - ');
  if (i < 0) return null;
  const thuis = t.slice(0, i).trim(), uit = t.slice(i + 3).trim();
  if (!thuis || !uit) return null;
  return { thuis, uit, reeks };
}
function impNorm(s) { return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''); }
// Welke ploeg is de jouwe? Die staat in élke wedstrijd van de reeks, aan de ene of de andere kant.
// De naam met de meeste treffers wint; de kalendernaam ("... reeks U11 A") krijgt voorrang bij
// een gelijkspel. Format-onafhankelijk, dus dit werkt ook op de kalender van een andere site.
function icsClubKandidaten(events) {
  const tel = new Map();
  events.forEach(ev => {
    const d = icsTitelDelen(icsProp(ev, 'SUMMARY'));
    if (!d) return;
    [d.thuis, d.uit].forEach(n => { const k = impNorm(n); const t = tel.get(k) || { naam: n, n: 0 }; t.n++; tel.set(k, t); });
  });
  const calNaam = (events[0] || {}).calNaam || '';
  const uitCal = impNorm(calNaam.split(/\breeks\b/i)[0]);
  // Enkel namen die vaak genoeg voorkomen om jóuw ploeg te kunnen zijn. Zonder die drempel komen
  // de reclame-items van Foot24 mee in het keuzelijstje ("Foot24.be" 5×, "Update kalender" 3×),
  // terwijl een echte twijfel (twee schrijfwijzen van dezelfde club) er wél door blijft.
  const max = Math.max(0, ...[...tel.values()].map(c => c.n));
  const lijst = [...tel.values()].filter(c => c.n > 1 && c.n >= max * 0.4);
  lijst.sort((a, b) => (b.n - a.n) || ((impNorm(b.naam) === uitCal ? 1 : 0) - (impNorm(a.naam) === uitCal ? 1 : 0)));
  // Draagt de kalendernaam dezelfde club, zet die vooraan — ook als een tegenstander toevallig
  // even vaak voorkomt.
  if (uitCal) { const i = lijst.findIndex(c => impNorm(c.naam) === uitCal); if (i > 0) lijst.unshift(lijst.splice(i, 1)[0]); }
  return lijst;
}
// Van agenda-items naar importregels. Alles wat geen "X - Y" met je eigen club aan één kant is,
// valt eruit: in Tims bestand zijn dat 17 van de 33 items (reclame van Foot24 zelf).
function impIcsNaarRegels(events) {
  const eigen = impNorm(impSt.eigenClub);
  const regels = [];
  let over = 0;
  (events || []).forEach(ev => {
    const d = icsTitelDelen(icsProp(ev, 'SUMMARY'));
    const dt = icsDatumTijd(ev);
    if (!d || !dt.datum || !eigen || (impNorm(d.thuis) !== eigen && impNorm(d.uit) !== eigen)) { over++; return; }
    const thuis = impNorm(d.thuis) === eigen;
    regels.push({
      datum: dt.datum, tijd: dt.tijd, thuis,
      tegenstander: thuis ? d.uit : d.thuis,
      venue: icsProp(ev, 'LOCATION').replace(/\s*\n\s*/g, ', ').trim(),
      reeks: d.reeks, speeldag: '',
      uid: icsProp(ev, 'UID'), bestaat: null, aan: true,
    });
  });
  impSt.overgeslagen = over;
  regels.sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
  return regels;
}
// Dragen álle wedstrijden dezelfde reeks, en eindigt die op één losse letter ("U11 A"), dan is dat
// precies het ploeg-label waarmee de app een A- en een B-ploeg van elkaar houdt. Enkel een
// voorstel: het veld staat zichtbaar op het scherm en je kan het leegmaken.
function impSubteamUitReeks(regels) {
  const reeksen = [...new Set((regels || []).map(r => r.reeks).filter(Boolean))];
  if (reeksen.length !== 1) return '';
  const m = reeksen[0].trim().match(/(?:^|\s)([A-Za-z])$/);
  return m ? m[1].toUpperCase() : '';
}

// ---------------------------------------------------------------------------------------------
// ZIP + XLSX
// ---------------------------------------------------------------------------------------------
// Een .xlsx is een zipbestand. De browser kan sinds enkele jaren zelf deflate uitpakken
// (DecompressionStream), dus lees ik de centrale map van de zip uit en pak enkel de vier XML-jes
// uit die ik nodig heb. Zip64 (bestanden > 4 GB) laat ik buiten beschouwing.
async function zipLijst(buf) {
  const dv = new DataView(buf), n = buf.byteLength;
  let eocd = -1;
  for (let i = n - 22; i >= Math.max(0, n - 66000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw new Error('Dit lijkt geen Excel-bestand (.xlsx) te zijn.');
  const aantal = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const uit = {};
  for (let k = 0; k < aantal; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const e = {
      method: dv.getUint16(p + 10, true),
      csize: dv.getUint32(p + 20, true),
      lho: dv.getUint32(p + 42, true),
    };
    const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    uit[dec.decode(new Uint8Array(buf, p + 46, nlen))] = e;
    p += 46 + nlen + elen + clen;
  }
  return uit;
}
async function zipTekst(buf, e) {
  if (!e) return '';
  const dv = new DataView(buf);
  if (dv.getUint32(e.lho, true) !== 0x04034b50) throw new Error('Beschadigd Excel-bestand.');
  const nlen = dv.getUint16(e.lho + 26, true), elen = dv.getUint16(e.lho + 28, true);
  const data = new Uint8Array(buf, e.lho + 30 + nlen + elen, e.csize);
  if (e.method === 0) return new TextDecoder().decode(data);
  if (e.method !== 8) throw new Error('Dit Excel-bestand gebruikt een compressie die de browser niet kan uitpakken.');
  if (typeof DecompressionStream !== 'function') throw new Error('Deze browser kan geen Excel-bestand uitpakken. Bewaar het bestand als CSV en probeer opnieuw.');
  const stroom = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(stroom).text();
}
function _xml(t) { const d = new DOMParser().parseFromString(t, 'application/xml'); if (d.getElementsByTagName('parsererror').length) throw new Error('Onleesbare XML in het Excel-bestand.'); return d; }
function _txt(el) { return el ? (el.textContent || '') : ''; }

// Welke opmaakstijlen betekenen "dit is een datum"? Zonder dit worden Excel-datums kale getallen
// (45889 i.p.v. 19-08-2026). Ingebouwde datumformaten hebben een vaste nummerreeks; een eigen
// formaat herken ik aan de letters in de opmaakcode.
function xlsxDatumStijlen(stylesXml) {
  const set = new Set();
  if (!stylesXml) return set;
  let doc; try { doc = _xml(stylesXml); } catch (e) { return set; }
  const datumFmt = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57]);
  [...doc.getElementsByTagName('numFmt')].forEach(f => {
    const id = parseInt(f.getAttribute('numFmtId'), 10);
    const code = (f.getAttribute('formatCode') || '').replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, '');
    if (/[ymdhs]/i.test(code) && !/^[#0.,%\s]*$/.test(code)) datumFmt.add(id);
  });
  const xfs = doc.getElementsByTagName('cellXfs')[0];
  if (!xfs) return set;
  [...xfs.getElementsByTagName('xf')].forEach((xf, i) => {
    if (datumFmt.has(parseInt(xf.getAttribute('numFmtId') || '0', 10))) set.add(i);
  });
  return set;
}
// Excel rekent in dagen sinds 30-12-1899 (met de schrikkeljaarfout van 1900 erin verrekend).
// Een waarde onder 1 is enkel een uur.
function xlsxDatum(n) {
  const p2 = v => String(v).padStart(2, '0');
  if (n < 1) { const min = Math.round(n * 1440); return { datum: '', tijd: `${p2(Math.floor(min / 60) % 24)}:${p2(min % 60)}` }; }
  const ms = Math.round((n - 25569) * 86400000);
  const d = new Date(ms);
  if (isNaN(d)) return { datum: '', tijd: '' };
  const datum = `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;
  const heeftTijd = Math.abs(n - Math.floor(n)) > 1e-9;
  return { datum, tijd: heeftTijd ? `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}` : '' };
}
function xlsxKolomNr(ref) { // "BC12" → 28
  let n = 0;
  for (const ch of String(ref)) { const c = ch.toUpperCase().charCodeAt(0); if (c < 65 || c > 90) break; n = n * 26 + (c - 64); }
  return n - 1;
}
async function xlsxTabellen(buf) {
  const zip = await zipLijst(buf);
  const wbXml = await zipTekst(buf, zip['xl/workbook.xml']);
  if (!wbXml) throw new Error('Dit lijkt geen Excel-bestand (.xlsx) te zijn.');
  const relsXml = await zipTekst(buf, zip['xl/_rels/workbook.xml.rels']);
  const sstXml = await zipTekst(buf, zip['xl/sharedStrings.xml']);
  const datumStijlen = xlsxDatumStijlen(await zipTekst(buf, zip['xl/styles.xml']));
  // Gedeelde teksten: Excel bewaart elke tekst één keer en verwijst er per cel naar.
  const sst = [];
  if (sstXml) [..._xml(sstXml).getElementsByTagName('si')].forEach(si => sst.push([...si.getElementsByTagName('t')].map(_txt).join('')));
  const rel = {};
  if (relsXml) [..._xml(relsXml).getElementsByTagName('Relationship')].forEach(r => { rel[r.getAttribute('Id')] = r.getAttribute('Target'); });
  const tabellen = [];
  for (const sh of [..._xml(wbXml).getElementsByTagName('sheet')]) {
    const rid = sh.getAttribute('r:id') || sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    let doel = rel[rid] || '';
    if (!doel) continue;
    doel = doel.replace(/^\//, '');
    const pad = doel.startsWith('xl/') ? doel : 'xl/' + doel;
    const xml = await zipTekst(buf, zip[pad]);
    if (!xml) continue;
    tabellen.push({ naam: sh.getAttribute('name') || ('Blad ' + (tabellen.length + 1)), rijen: xlsxRijen(xml, sst, datumStijlen) });
  }
  return tabellen;
}
function xlsxRijen(xml, sst, datumStijlen) {
  const doc = _xml(xml);
  const rijen = [];
  for (const r of [...doc.getElementsByTagName('row')]) {
    const rij = [];
    for (const c of [...r.getElementsByTagName('c')]) {
      const k = xlsxKolomNr(c.getAttribute('r') || '');
      const t = c.getAttribute('t') || 'n';
      const vEl = c.getElementsByTagName('v')[0];
      let w = '';
      if (t === 's') { const i = parseInt(_txt(vEl), 10); w = sst[i] != null ? sst[i] : ''; }
      else if (t === 'inlineStr') { w = [...c.getElementsByTagName('t')].map(_txt).join(''); }
      else if (t === 'b') { w = _txt(vEl) === '1' ? 'ja' : 'nee'; }
      else {
        w = _txt(vEl);
        const st = parseInt(c.getAttribute('s') || '-1', 10);
        if (w !== '' && datumStijlen.has(st) && !isNaN(parseFloat(w))) {
          const dt = xlsxDatum(parseFloat(w));
          w = dt.datum && dt.tijd ? `${dt.datum} ${dt.tijd}` : (dt.datum || dt.tijd);
        }
      }
      rij[k >= 0 ? k : rij.length] = String(w).trim();
    }
    for (let i = 0; i < rij.length; i++) if (rij[i] == null) rij[i] = '';
    rijen.push(rij);
  }
  return rijen;
}

// ---------------------------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------------------------
// Scheidingsteken zelf bepalen: een Belgische Excel-export gebruikt een puntkomma, een export uit
// een website meestal een komma, en soms staat er een tab.
function csvTabel(text) {
  const t = String(text).replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const eerste = t.split('\n').slice(0, 5).join('\n');
  const kandidaten = [';', ',', '\t', '|'];
  let sep = ';', beste = -1;
  kandidaten.forEach(s => { const n = eerste.split(s).length; if (n > beste) { beste = n; sep = s; } });
  const rijen = [];
  let rij = [], cel = '', quote = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quote) {
      if (ch === '"') { if (t[i + 1] === '"') { cel += '"'; i++; } else quote = false; }
      else cel += ch;
    } else if (ch === '"') quote = true;
    else if (ch === sep) { rij.push(cel.trim()); cel = ''; }
    else if (ch === '\n') { rij.push(cel.trim()); rijen.push(rij); rij = []; cel = ''; }
    else cel += ch;
  }
  if (cel !== '' || rij.length) { rij.push(cel.trim()); rijen.push(rij); }
  return rijen.filter(r => r.some(c => c !== ''));
}

// ---------------------------------------------------------------------------------------------
// TABEL → REGELS
// ---------------------------------------------------------------------------------------------
const IMP_KOPWOORDEN = {
  datum: ['datum', 'date', 'dag', 'wanneer', 'speeldatum'],
  tijd: ['uur', 'tijd', 'aanvang', 'start', 'tijdstip', 'time', 'kickoff', 'aftrap'],
  thuisploeg: ['thuisploeg', 'thuis ploeg', 'thuisclub', 'home', 'thuis team', 'ploeg thuis'],
  uitploeg: ['uitploeg', 'uit ploeg', 'bezoekers', 'away', 'uit team', 'ploeg uit'],
  tegenstander: ['tegenstander', 'tegenpartij', 'opponent', 'tegen'],
  tu: ['thuis of uit', 'thuis/uit', 't/u', 'thuisuit', 'locatie t/u'],
  venue: ['plaats', 'terrein', 'veld', 'adres', 'locatie', 'sportterrein', 'venue'],
  speeldag: ['speeldag', 'wedstrijddag', 'ronde', 'matchday', 'nr', 'dagnr'],
};
// Waar begint de eigenlijke tabel? De eerste rij die minstens twee bekende kopnamen bevat — een
// export begint vaak met een titelregel of een lege rij.
function impTabelKop(rijen) {
  const alle = Object.values(IMP_KOPWOORDEN).flat();
  for (let i = 0; i < Math.min(rijen.length, 15); i++) {
    const treffers = (rijen[i] || []).filter(c => alle.some(w => impNorm(c) === impNorm(w) || (impNorm(c) && impNorm(c).includes(impNorm(w))))).length;
    if (treffers >= 2) return i;
  }
  return rijen.length ? 0 : -1;
}
// Eerst de kopnamen die letterlijk kloppen, en pas daarna de gedeeltelijke treffers op de kolommen
// die nog vrij zijn. Korte kopwoorden ("t/u", "nr") tellen enkel letterlijk mee: anders werd de
// kolom "Datum" als thuis/uit-kolom gelezen, want "tu" zit in "datum".
function impAutoMap(kolommen) {
  const map = { datum: -1, tijd: -1, thuisploeg: -1, uitploeg: -1, tegenstander: -1, tu: -1, venue: -1, speeldag: -1 };
  const genomen = new Set();
  const sleutels = Object.keys(IMP_KOPWOORDEN);
  sleutels.forEach(sleutel => {
    const woorden = IMP_KOPWOORDEN[sleutel].map(impNorm);
    const i = kolommen.findIndex((k, ki) => !genomen.has(ki) && woorden.includes(impNorm(k)));
    if (i >= 0) { map[sleutel] = i; genomen.add(i); }
  });
  sleutels.forEach(sleutel => {
    if (map[sleutel] >= 0) return;
    const woorden = IMP_KOPWOORDEN[sleutel].map(impNorm).filter(w => w.length >= 4);
    const i = kolommen.findIndex((k, ki) => !genomen.has(ki) && impNorm(k) && woorden.some(w => impNorm(k).includes(w)));
    if (i >= 0) { map[sleutel] = i; genomen.add(i); }
  });
  // Staat er zowel een thuis- als een uitploegkolom, dan is een losse "tegenstander" niet nodig.
  if (map.thuisploeg >= 0 && map.uitploeg >= 0) map.tegenstander = -1;
  return map;
}
// Datums in een tabel: 19/08/2026, 19-8-2026, 2026-08-19, 19.08.2026 — en soms met het uur erbij.
// Bij dag/maand houd ik de Belgische lezing aan (19/08 = 19 augustus), want dat is wat hier uit
// Excel en van de bondssites komt.
function impLeesDatum(txt) {
  const s = String(txt || '').trim();
  if (!s) return '';
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    let jaar = +m[3]; if (jaar < 100) jaar += jaar < 70 ? 2000 : 1900;
    return `${jaar}-${String(+m[2]).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
  }
  return '';
}
function impLeesTijd(txt) {
  const m = String(txt || '').match(/(\d{1,2})\s*[:.uUhH]\s*(\d{2})/);
  if (!m) return '';
  const u = +m[1], min = +m[2];
  if (u > 23 || min > 59) return '';
  return `${String(u).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
function impTabelNaarRegels() {
  const t = impSt.tabellen[impSt.bladIndex];
  if (!t) return [];
  const map = impSt.map, eigen = impNorm(impSt.eigenClub);
  const cel = (rij, k) => (map[k] >= 0 ? String(rij[map[k]] || '').trim() : '');
  const regels = [];
  let over = 0;
  t.rijen.slice(impSt.kopIndex + 1).forEach(rij => {
    if (!rij || !rij.some(c => c !== '')) return;
    const datum = impLeesDatum(cel(rij, 'datum'));
    // Het uur staat soms in de datumkolom ("19/08/2026 18:00") en soms in een eigen kolom.
    const tijd = impLeesTijd(cel(rij, 'tijd')) || impLeesTijd(cel(rij, 'datum').replace(impLeesDatum(cel(rij, 'datum')), ''));
    const thuisploeg = cel(rij, 'thuisploeg'), uitploeg = cel(rij, 'uitploeg');
    let tegenstander = cel(rij, 'tegenstander'), thuis = true;
    if (thuisploeg && uitploeg) {
      if (!eigen) { over++; return; }
      if (impNorm(thuisploeg) === eigen) { thuis = true; tegenstander = uitploeg; }
      else if (impNorm(uitploeg) === eigen) { thuis = false; tegenstander = thuisploeg; }
      else { over++; return; }
    } else {
      const tu = impNorm(cel(rij, 'tu'));
      if (tu) thuis = !(tu.startsWith('u') || tu.startsWith('a') || tu.includes('bezoek'));
    }
    if (!datum || !tegenstander) { over++; return; }
    regels.push({
      datum, tijd, thuis, tegenstander,
      venue: cel(rij, 'venue'), speeldag: cel(rij, 'speeldag'), reeks: '',
      uid: '', bestaat: null, aan: true,
    });
  });
  impSt.overgeslagen = over;
  regels.sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
  return regels;
}

// ---------------------------------------------------------------------------------------------
// DUBBELS EN WEGSCHRIJVEN
// ---------------------------------------------------------------------------------------------
// Zelfde dag + zelfde tegenstander binnen dezelfde ploeg = dezelfde wedstrijd. Leestekens en
// hoofdletters doen niet mee ("R. KNOKKE FC." en "R Knokke FC" zijn één club).
// Het ploeg-label hoort in de sleutel: een club met een A- en een B-ploeg onder dezelfde ploegnaam
// speelt op dezelfde dag twee verschillende wedstrijden. Zonder het label zou de A-kalender de
// wedstrijd van B als "staat er al" aanwijzen.
function impDubbelSleutel(teamId, subteam, datum, tegenstander) { return `${teamId}|${impNorm(subteam)}|${datum}|${impNorm(tegenstander)}`; }
// Past een bestaande wedstrijd bij het label waarmee je nu importeert? Een leeg label aan één van
// beide kanten past op alles: wie zijn wedstrijden nooit labelde, mag ze niet plots dubbel krijgen.
function impZelfdeSubteam(a, b) { return !impNorm(a) || !impNorm(b) || impNorm(a) === impNorm(b); }
// Gaan twee clubnamen over dezelfde ploeg? Ze moeten een echt woord delen: "SK Roeselare" en
// "SPORTKRING ROESELARE" delen "roeselare", maar "RFC Wetteren" en "FOOTBALL CLUB GULLEGEM" delen
// niets — dat zijn dus twee verschillende wedstrijden op dezelfde dag, geen dubbel.
// Korte woorden ("fc", "sk", "club", "kfc", "royal") zeggen niets over wélke club het is.
const IMP_LEGE_WOORDEN = new Set(['club', 'football', 'royal', 'sporting', 'racing', 'united', 'jeugd', 'sportkring', 'voetbal', 'ploeg']);
function impZelfdeClub(a, b) {
  const woorden = s => new Set(String(s || '').toLowerCase().split(/[^\p{L}\p{N}]+/u)
    .filter(w => w.length >= 4 && !IMP_LEGE_WOORDEN.has(w)));
  const wa = woorden(a), wb = woorden(b);
  if (!wa.size || !wb.size) return false;
  for (const w of wa) if (wb.has(w)) return true;
  return false;
}
async function impMarkeerDubbels() {
  const alle = await dbAll();
  const bestaand = new Map();
  const perDag = new Map();
  // De TOESTAND van een bestaande wedstrijd erbij (audit 23-08-2026). Een gespeelde of lopende
  // wedstrijd was voor de dubbeldetectie een gewone dubbel: het kaartje zei enkel "Staat er al", en
  // één tik op "Alles aan" schreef datum, uur, thuis/uit, terrein en tegenstander over een wedstrijd
  // met verslag en gebeurtenissen. Gemeten: een afgesloten wedstrijd verhuisde via het agenda-nummer
  // van 6 september naar 5 juli, met haar 1-0 en drie gebeurtenissen erin.
  const statusVan = new Map();
  alle.forEach(m => {
    statusVan.set(m.id, m.status || 'planned');
    if (m.tournamentId) return;                        // tornooiwedstrijden staan buiten de kalender
    bestaand.set(impDubbelSleutel(m.teamId || '', m.subteam || '', m.date || '', m.opponent || ''), m.id);
    if (m.importUid) bestaand.set('uid|' + m.importUid, m.id);
    // Tweede net: een bondssite schrijft de tegenstander voluit ("SPORTKRING ROESELARE") waar jij hem
    // kort intikte ("SK Roeselare") — op naam alleen zou dat een dubbel worden. Álle wedstrijden van
    // die dag bijhouden, niet enkel de eerste: met een A- en een B-ploeg staan er twee, en dan moet
    // de juiste gevonden worden in plaats van degene die toevallig vooraan stond.
    const dk = `${m.teamId || ''}|${m.date || ''}`;
    if (!perDag.has(dk)) perDag.set(dk, []);
    perDag.get(dk).push({ id: m.id, opponent: m.opponent || '', subteam: m.subteam || '' });
  });
  impSt.regels.forEach(r => {
    const exact = (r.uid && bestaand.get('uid|' + r.uid)) || bestaand.get(impDubbelSleutel(impSt.teamId, impSt.subteam, r.datum, r.tegenstander)) || null;
    const dagAlles = exact ? [] : (perDag.get(`${impSt.teamId}|${r.datum}`) || []);
    // Voor het herkennen van een dubbel enkel wedstrijden van dezelfde (of van een niet-gelabelde)
    // ploeg: A mag de wedstrijd van B niet opeisen.
    const dagLijst = dagAlles.filter(m => impZelfdeSubteam(m.subteam, impSt.subteam));
    const zelfdeClub = dagLijst.find(m => impZelfdeClub(m.opponent, r.tegenstander)) || null;
    r.bestaat = exact || (zelfdeClub ? zelfdeClub.id : null);
    // Dezelfde wedstrijd onder een andere schrijfwijze: de naam die er nu staat erbij, zodat je zelf
    // ziet waarom deze regel als dubbel geldt. Is de naam identiek, dan valt er niets uit te leggen.
    r.andereNaam = (zelfdeClub && impNorm(zelfdeClub.opponent) !== impNorm(r.tegenstander)) ? zelfdeClub.opponent : '';
    // Wél een wedstrijd op die dag, maar niet als dubbel geteld. Dat kan een tweede wedstrijd van
    // dezelfde ploeg zijn, of dezelfde wedstrijd onder het ándere ploeg-label (dan staat het label
    // erbij, en zie je meteen dat er iets te kiezen valt). Enkel melden, niet blokkeren.
    r.dagWaarschuwing = (!r.bestaat && dagAlles.length)
      ? dagAlles.filter(m => m.opponent).map(m => m.opponent + (m.subteam ? ` (${m.subteam})` : '')).join(', ')
      : '';
    // Is de bestaande wedstrijd al gespeeld (of loopt ze), dan hoort dat op het kaartje: "Staat er al"
    // alleen zegt niet dat er een verslag aan hangt. `r.gespeeld` houdt "Alles aan" er ook van af.
    r.bestaatStatus = r.bestaat ? (statusVan.get(r.bestaat) || '') : '';
    r.gespeeld = r.bestaatStatus === 'done' || r.bestaatStatus === 'live';
    // Een bestaande wedstrijd staat standaard uit: niets overschrijven wat je niet zelf vraagt.
    r.aan = !r.bestaat;
  });
}

async function impVoerUit() {
  if (!canManage()) { showToast('Enkel een beheerder kan importeren.', 'err'); return; }
  const kiezen = impSt.regels.filter(r => r.aan);
  if (!kiezen.length) return;
  const team = teamById(impSt.teamId);
  if (!team && getTeamsV2().length) { showToast('Kies eerst je eigen ploeg.', 'err'); return; }
  let nieuw = 0, bijgewerkt = 0;
  // ONGEDAAN MAKEN NA EEN IMPORT (audit 23-08-2026). Voordien was een verkeerd bestand of een
  // verkeerde ploeg niet terug te draaien: dertig wedstrijden één per één openen en verwijderen, en
  // bij een bijgewerkte wedstrijd waren de oude datum, het oude uur en het oude terrein definitief
  // weg. Zelfde vorm en zelfde geldigheidsduur als het ongedaan-maken van "Meerdere aanpassen", met
  // één verschil: een import kan ook wedstrijden AANMAKEN, en die moeten dan weer verdwijnen.
  const undo = { when: Date.now(), teamId: activeTeamId || '',
    ploeg: (cloudReady ? (teamNames[activeTeamId] || '') : (team ? team.name : '')) || '',
    aangemaakt: [], bijgewerkt: [] };
  for (const r of kiezen) {
    const veld = {
      opponent: r.tegenstander, date: r.datum, time: r.tijd || '00:00',
      location: r.thuis ? 'Thuis' : 'Uit', venue: r.venue || '',
    };
    if (r.bestaat) {
      // Enkel de velden uit het bestand aanpassen. De selectie, de opstelling, het plan, de events
      // en de notities van die wedstrijd blijven staan.
      const m = await dbGet(r.bestaat);
      if (!m) continue;
      // De oude waarden bewaren vóór het overschrijven: exact de velden die deze import aanraakt.
      // null betekent "stond er niet" — bij het terugzetten wordt die eigenschap dan verwijderd.
      const oud = {};
      Object.keys(veld).forEach(k => { oud[k] = (m[k] === undefined) ? null : m[k]; });
      oud.importUid = (m.importUid === undefined) ? null : m.importUid;
      undo.bijgewerkt.push({ id: m.id, oud });
      Object.assign(m, veld);
      if (r.uid) m.importUid = r.uid;
      await dbSave(m);
      bijgewerkt++;
      continue;
    }
    const m = Object.assign({
      id: uid(), createdAt: Date.now(), notes: '', motmId: null, captainId: null,
      quarters: [], currentQuarter: 0, quarterStatus: 'not_started', scoreUs: 0, scoreThem: 0, events: [],
      formation: '', players: [], absentPlayers: [], status: 'planned',
    }, veld, {
      teamName: team ? team.name : 'Ploeg', teamId: impSt.teamId || '',
      subteam: impSt.subteam || '',
      competition: impSt.competition, matchday: r.speeldag || '', referee: '', jersey: '',
      trainer: teamTrainerNames(team)[0] || '', responsible: teamResponsibleNames(team)[0] || '',
      matchType: impSt.matchType, fieldSize: MATCH_TYPES[impSt.matchType].field,
      periodKey: impSt.periodKey, numQuarters: PERIOD_TYPES[impSt.periodKey].count,
      quarterDuration: impSt.quarterDuration,
    });
    if (r.uid) m.importUid = r.uid;
    await dbSave(m);
    undo.aangemaakt.push(m.id);
    nieuw++;
  }
  if (undo.aangemaakt.length || undo.bijgewerkt.length) {
    try { localStorage.setItem(IMP_UNDO_KEY, JSON.stringify(undo)); } catch (e) {}
  }
  impSt = null;
  await go('matches');
  showToast(`${nieuw} ${nieuw === 1 ? 'wedstrijd' : 'wedstrijden'} toegevoegd${bijgewerkt ? ` · ${bijgewerkt} bijgewerkt` : ''}.`);
}

// ---------------------------------------------------------------------------------------------
// ONGEDAAN MAKEN — zelfde vorm als bulkUndo (zie views-account.js): in de opslag, 24 uur geldig, en
// enkel aangeboden bij de ploeg waar de import gebeurde. Een import raakt twee soorten wedstrijden,
// dus het terugzetten doet twee dingen: wat aangemaakt werd verdwijnt, en wat bijgewerkt werd krijgt
// zijn oude datum, uur, thuis/uit, terrein, tegenstander en agenda-nummer terug. De selectie, de
// opstelling, het plan, de gebeurtenissen en de notities zijn nooit aangeraakt, dus die blijven.
// ---------------------------------------------------------------------------------------------
const IMP_UNDO_KEY = 'voetbal_import_undo';
const IMP_UNDO_GELDIG_MS = 24 * 60 * 60 * 1000;
function impUndoBeschikbaar() {
  try {
    const u = JSON.parse(localStorage.getItem(IMP_UNDO_KEY) || 'null');
    if (!u || (!(u.aangemaakt || []).length && !(u.bijgewerkt || []).length)) return null;
    if (Date.now() - (u.when || 0) > IMP_UNDO_GELDIG_MS) return null;
    // Enkel bij de ploeg waar het gebeurde: anders zou je in de lijst van een ándere ploeg een
    // ongedaan-maken zien die daar niets mee te maken heeft (zelfde regel als bulkUndoBeschikbaar,
    // en dezelfde les uit het incident van 21-08-2026).
    if (cloudReady) { if (!u.teamId || u.teamId !== activeTeamId) return null; }
    else if (u.ploeg && homeFilter !== 'all' && u.ploeg !== homeFilter) return null;
    return u;
  } catch (e) { return null; }
}
function impUndoVergeten() { try { localStorage.removeItem(IMP_UNDO_KEY); } catch (e) {} loadMatches(); }
async function impUndo() {
  const u = impUndoBeschikbaar();
  if (!u || !canManage()) return;
  let weg = 0, terug = 0;
  for (const id of (u.aangemaakt || [])) {
    // Enkel wedstrijden waar niets mee gebeurd is. Wie intussen aan een ingelezen wedstrijd werkte
    // (selectie, opstelling, of ze zelfs al speelde), verliest dat niet door een ongedaan-maken.
    const m = await dbGet(id);
    if (!m) continue;
    if ((m.status && m.status !== 'planned') || (m.players || []).length || (m.events || []).length) continue;
    await dbDel(id); weg++;
  }
  for (const e of (u.bijgewerkt || [])) {
    const m = await dbGet(e.id);
    if (!m) continue;
    Object.keys(e.oud || {}).forEach(k => { if (e.oud[k] === null) delete m[k]; else m[k] = e.oud[k]; });
    await dbSave(m); terug++;
  }
  try { localStorage.removeItem(IMP_UNDO_KEY); } catch (e) {}
  const delen = [];
  if (weg) delen.push(`${weg} ${weg === 1 ? 'wedstrijd' : 'wedstrijden'} verwijderd`);
  if (terug) delen.push(`${terug} teruggezet`);
  showToast(delen.length ? delen.join(' · ') + '.' : 'Niets om terug te zetten.', 'ok');
  loadMatches();
}
function impUndoBannerHtml() {
  const u = impUndoBeschikbaar();
  if (!u || !canManage() || (typeof bulkMode !== 'undefined' && bulkMode)) return '';
  const n = (u.aangemaakt || []).length, b = (u.bijgewerkt || []).length;
  const wat = [n ? `${n} ${n === 1 ? 'wedstrijd' : 'wedstrijden'} toegevoegd` : '', b ? `${b} bijgewerkt` : ''].filter(Boolean).join(' · ');
  return `<div class="nudge" style="margin-bottom:12px">${icI(IC.upload)} <b>Kalender ingelezen</b> — ${esc(wat)}.
    <button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="impUndo()">Import ongedaan maken</button>
    <button class="btn btn-gray btn-sm" style="margin-top:6px;width:100%" onclick="impUndoVergeten()">Sluiten</button></div>`;
}
