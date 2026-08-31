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
  // Dezelfde wacht als bij "+ Nieuwe wedstrijd" (zie newMatch). Zonder deze controle kon je een hele
  // kalender inlezen terwijl de kern nog onderweg was: getTeamsV2() is dan leeg, en dan schreef de
  // import wedstrijden weg zónder ploeg en met "Ploeg" als naam. Elke lijst filtert op de ploegnaam,
  // dus die wedstrijden staan daarna nergens meer op het scherm — terwijl de melding zegt dat het
  // gelukt is. Precies de verdwijning van het incident van 21-08-2026 (audit 23-08-2026).
  if (!rosterReady()) { showToast('Spelers zijn nog aan het laden — probeer het over een paar seconden opnieuw.', 'err'); return; }
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
  // VANGNET. impStart() weigert wanneer je niet mag beheren en laat impSt dan op null: dit las
  // meteen daarna impSt.fase en gooide een fout midden in render(), waardoor #app nooit gevuld werd
  // en elke volgende hertekening óók crashte — de app stond stil op het vorige scherm. De
  // poortwachter in go() houdt dit geval nu tegen; dit vangnet zorgt dat een volgend vergeten geval
  // nooit meer een bevroren app kan geven, maar een scherm met een weg terug.
  if (!impSt) {
    return `<div class="hdr"><button class="back" onclick="go('matches')">‹</button><h1>${icI(IC.upload)} Kalender importeren</h1></div>
      <div class="content"><div class="empty"><div class="ei">${IC.upload}</div>
        <p>Een kalender inlezen kan enkel een ploegbeheerder, en enkel met verbinding.</p></div>
        <button class="btn btn-pale" onclick="go('matches')">Naar de wedstrijden</button></div>`;
  }
  const body = impSt.fase === 'lijst' ? impLijstHtml() : impKiesHtml();
  return `<div class="hdr"><button class="back" onclick="impTerug()">‹</button><h1>${icI(IC.upload)} Kalender importeren</h1></div>
    <div class="content" id="imp-content">${body}</div>`;
}
// De ‹ in de titelbalk VERLAAT het scherm, zoals overal in de app (audit 23-08-2026). Ze deed in de
// lijstfase hetzelfde als "Ander bestand kiezen" onderaan: dezelfde handeling twee keer op één
// scherm, en je moest twee keer tikken om weg te raken — terwijl de browserterugknop wél meteen weg
// ging. Teruggaan naar de bestandskeuze blijft de knop onderaan, die letterlijk zegt wat ze doet.
function impTerug() { impSt = null; go('matches'); }
function impAnderBestand() {
  if (!impSt) return;
  // Ook de bron leegmaken: anders staat het keuzescherm nog in de stand van de vorige poging (en
  // bleef een foutmelding van de bond onder het bestandsveld hangen).
  impSt.fase = 'kies'; impSt.regels = []; impSt.fout = ''; impSt.bron = ''; impSt.bestand = ''; impSt.rbfaFout = false; render();
}
// Enkel het inhoudsblok hertekenen: de titelbalk hoeft niet mee, en zo blijft de scrollpositie
// van een lange lijst bewaard bij het aan- en uitvinken.
function impRender() {
  const el = document.getElementById('imp-content');
  if (!el) { render(); return; }
  el.innerHTML = impSt.fase === 'lijst' ? impLijstHtml() : impKiesHtml();
}

// TWEE BRONNEN sinds de bondskalender erbij kwam. De bond staat bovenaan: dat is de weg zonder
// download, en ze levert het wedstrijdnummer. Het bestandspad blijft er onveranderd naast staan —
// niet elke club haalt haar kalender bij de RBFA, en een ploeg die niet gekoppeld is moet gewoon
// verder kunnen.
function impKiesHtml() {
  return `
    ${rbfaBronKaartHtml()}
    <div class="sec">Uit een bestand</div>
    <div class="card">
      <p style="font-size:14px;color:var(--txt2);margin:0 0 14px">Kies het kalenderbestand van je ploeg. Op <b>Foot24</b> staat bij je reeks een knop om de kalender als <b>agenda (.ics)</b> te downloaden — dat is de gemakkelijkste weg. Krijg je de kalender van je club als tabel doorgestuurd (<b>.xlsx</b> of <b>.csv</b>), dan kan die ook.</p>
      <div class="fg"><label>Bestand</label>
        <input id="imp-file" type="file" accept=".ics,.ical,.xlsx,.csv,.txt,text/calendar" onchange="impBestand(this)"
               style="width:100%;padding:10px;border:2px dashed var(--bdr);border-radius:8px;font-size:14px;background:var(--card);color:var(--txt)"></div>
      ${/* Enkel de fouten van dít pad. Een mislukt ophalen bij de bond hoort in de bondskaart
           hierboven, niet onder het bestandsveld — daar lees je het als "mijn bestand is stuk". */''}
      ${impSt.fout && !impSt.rbfaFout ? `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(220,60,60,.12);color:var(--rd);font-size:14px;font-weight:600">${icI(IC.warn)}${esc(impSt.fout)}</div>` : ''}
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
  // Komt de kalender van de bond, dan staan twee dingen al per wedstrijd vast en horen hun velden
  // hier dus niet: het ploeg-label (dat komt van de bondsploeg waar de wedstrijd uit komt) en de
  // soort (uit de reeks — vriendschappelijk, beker of competitie). Een veld voor de hele import zou
  // die per-wedstrijdwaarde alleen maar kunnen overschrijven.
  const isRbfa = impSt.bron === 'rbfa';
  const telTxt = `${rs.length} ${rs.length === 1 ? 'wedstrijd' : 'wedstrijden'} gevonden`
    + (impSt.overgeslagen ? ` · ${impSt.overgeslagen} ${isRbfa ? 'onleesbare regel(s) overgeslagen' : 'andere agenda-items overgeslagen'}` : '')
    + ((isRbfa && impSt.rbfaSamengevoegd) ? ` · ${impSt.rbfaSamengevoegd} keer dezelfde wedstrijd in twee kalenders` : '')
    + ((!isRbfa && impSt.eigenClub && impSt.clubKeuzes.length <= 1) ? ` · eigen club: <b>${esc(impSt.eigenClub)}</b>` : '');
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
      <div style="font-size:13px;color:var(--txt2);margin-bottom:12px">${telTxt}</div>
      ${clubKaart}
      ${/* De ploegkeuze staat er bij de bondskalender niet: die is al gemaakt vóór het ophalen (de
           koppeling hangt aan één ploeg), en hier van ploeg wisselen zou een kalender op de kern van
           een ándere ploeg zetten zonder dat er ook maar één nummer bij past. */''}
      ${isRbfa
        ? `<div class="fg"><label>Eigen ploeg</label><div style="font-size:15px;font-weight:700;padding:6px 0">${esc((teamById(impSt.teamId) || {}).name || '')}</div>
             <div style="font-size:12px;color:var(--txt2)">De kalender is opgehaald voor déze ploeg. Wil je een andere ploeg, ga dan terug en haal haar kalender op.</div></div>`
        : `<div class="fg"><label>Eigen ploeg</label>${teamSel}</div>`}
      ${/* Speelt een club met een A- en een B-ploeg onder dezelfde ploegnaam, dan staat op dezelfde
           dag twee keer een wedstrijd. Het label houdt die twee kalenders uit elkaar, óók bij het
           herkennen van dubbels — vandaar dat het hier meteen hertekent. */''}
      ${isRbfa
        ? (rs.some(r => r.rbfaLabel)
            ? `<div class="fg"><label>Ploeg-label</label>
                 <div style="font-size:14px;padding:4px 0">${[...new Set(rs.map(r => r.rbfaLabel || '(geen)'))].map(l => `<b>${esc(l)}</b>`).join(' · ')}</div>
                 <div style="font-size:12px;color:var(--txt2)">Staat per wedstrijd vast: het komt van de bondsploeg waar ze uit komt. Aan te passen bij "Ploegen aanpassen".</div></div>`
            : '')
        : `<div class="fg"><label>Ploeg-label (optioneel)</label>
        <input type="text" value="${esc(impSt.subteam)}" oninput="impVeld('subteam',this.value)" onchange="impHermarkeer()" placeholder="bv. A of B" autocomplete="off">
        ${impSt.subteamVoorstel ? `<div style="font-size:12px;color:var(--txt2);margin-top:4px">Uit de reeksnaam in het bestand (<b>${esc(impSt.subteamVoorstel)}</b>). Lees je de kalender van je andere ploeg in, zet hier dan haar label.</div>` : ''}</div>`}
      <div class="fg"><label>Format</label>
        <select onchange="impVeld('matchType',this.value)">${Object.keys(MATCH_TYPES).map(t => `<option value="${t}" ${impSt.matchType===t?'selected':''}>${t.replace('v',' tegen ')}</option>`).join('')}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="fg"><label>Aantal blokken</label>
          <select id="imp-pt" onchange="impPeriode()">${Object.keys(PERIOD_TYPES).map(k => `<option value="${k}" ${impSt.periodKey===k?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
        <div class="fg"><label>Duur van een blok</label>
          <select id="imp-qd" onchange="impDuur()">${durOptsHtml(impSt.periodKey, impSt.quarterDuration)}</select>
          <input id="imp-qd-custom" type="number" min="1" max="99" placeholder="min." oninput="impDuur()" style="margin-top:6px;${isCustomDur?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;color:var(--txt);background:var(--card);-webkit-appearance:none" value="${isCustomDur?impSt.quarterDuration:''}"></div>
      </div>
      ${isRbfa
        ? `<div class="fg"><label>Soort</label>
             <div style="font-size:14px;padding:4px 0">${[...new Set(rs.map(r => r.rbfaSoort || 'Competitie'))].map(s => `<b>${esc(s)}</b>`).join(' · ')}</div>
             <div style="font-size:12px;color:var(--txt2)">Uit de reeks van de bond, per wedstrijd. Nadien nog aan te passen.</div></div>`
        : `<div class="fg"><label>Soort</label>
        <select onchange="impVeld('competition',this.value)">${MATCH_KINDS.map(c => `<option ${impSt.competition===c?'selected':''}>${c}</option>`).join('')}</select>
        <div style="font-size:12px;color:var(--txt2);margin-top:4px">Geldt voor alles wat je nu importeert; per wedstrijd nadien aan te passen.</div></div>`}
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
    ${/* Wat er bij een bestaande wedstrijd écht overschreven wordt. De bondskalender kent geen
         terrein, dus die noemt "plaats" hier niet — en raakt het veld ook niet aan (impVoerUit). */''}
    ${bij ? `<div style="font-size:13px;color:var(--txt2);text-align:center;margin-top:8px">${nieuw} nieuw · ${bij} bestaande ${bij === 1 ? 'wedstrijd wordt' : 'wedstrijden worden'} bijgewerkt: tegenstander, datum, uur, thuis/uit${isRbfa ? ' en het wedstrijdnummer' : ' en plaats'}. Selectie, opstelling en plan blijven staan.</div>` : ''}`
    : `<div class="empty"><div class="ei">${IC.search}</div><p>Geen wedstrijden herkend in ${isRbfa ? 'deze kalender' : 'dit bestand'}.${impSt.bron === 'tabel' ? '<br>Kijk hierboven na welke kolom de datum en de tegenstander bevat.' : ''}</p></div>`}
    <button class="btn btn-gray" style="margin-top:10px" onclick="impAnderBestand()">${isRbfa ? 'Andere bron kiezen' : 'Ander bestand kiezen'}</button>`;
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
        ${/* Bij de bondskalender: dat deze wedstrijd al gespeeld is, en met welke uitslag. Enkel om
             te ZIEN — de uitslag wordt niet geïmporteerd (zie rbfaUitslagTxt). Zo begrijp je waarom
             er een wedstrijd van vorige maand in de lijst staat, en dat ze als GEPLAND binnenkomt. */''}
        ${r.rbfaGespeeld ? `<span class="badge badge-type">Bij de bond gespeeld${r.rbfaUitslag ? ' · ' + esc(r.rbfaUitslag) : ''}</span>` : ''}
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
  impSt.fout = ''; impSt.rbfaFout = false; impSt.bestand = f.name;
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
// De bondskalenders schrijven de tegenstander en de plaats in kapitalen ("R. KNOKKE FC", "KSK DE
// JEUGD LOVENDEGEM", "SPORTPARK DE LEIE, KORTRIJKSESTRAAT 12"). Zo belanden die in de lijst, in
// het verslag en in de PDF, waar ze staan te schreeuwen. Vandaar deze omzetting naar gewone
// schrijfwijze.
// Enkel namen zónder één kleine letter komen in aanmerking: staat er al een kleine letter in, dan
// heeft iemand de naam bewust zo getypt en blijft hij zoals hij is.
// Afkortingen blijven wél kapitaal. Een woord zonder klinker is er altijd één (FC, KSV, VV, SK) —
// dat leid ik uit de letters af. Afkortingen mét klinker kan ik niet raden, die staan hieronder.
// Mist er één, zet hem er dan bij; de rest van de functie verandert daar niet van.
const IMP_AFKORTINGEN = new Set(['AA', 'AC', 'AFC', 'AS', 'ASC', 'ASO', 'ASV', 'EFC', 'ESK', 'ESV',
  'EVC', 'KAA', 'KAC', 'KAS', 'KAV', 'KOSC', 'OHL', 'RAAL', 'RAEC', 'RAS', 'RCS', 'RE', 'ROC',
  'RRC', 'RSCA', 'RUS', 'SCA', 'UR', 'US', 'VVA']);
// Woordjes die midden in een naam klein blijven. Kort gehouden: "de" hoort er niet bij, want dat
// krijgt in "KSK De Jeugd Lovendegem" wél een hoofdletter.
const IMP_KLEINE_WOORDEN = new Set(['van', 'der', 'en']);
function impNetteNaam(s) {
  const naam = String(s || '').trim();
  if (!naam || /\p{Ll}/u.test(naam)) return naam;
  // Split mét de tussenruimte erin, zodat dubbele spaties niet stil verdwijnen.
  return naam.split(/(\s+)/).map((w, i) => {
    if (!w.trim()) return w;
    if (/^['’]/.test(w)) return w.toLowerCase();                               // 's Gravenwezel, 't Zand
    const letters = w.replace(/[^\p{L}]/gu, '').toUpperCase();
    if (!letters) return w;                                                    // "1927", een los streepje
    if (letters.length === 1) return w.toUpperCase();                          // "R." en de losse ploegletter "A"
    if (IMP_AFKORTINGEN.has(letters) || !/[AEIOUYÀ-Ý]/.test(letters)) return w.toUpperCase();
    const klein = w.toLowerCase();
    if (i > 0 && IMP_KLEINE_WOORDEN.has(klein)) return klein;
    // Na een streepje, punt, schuine streep of apostrof begint een nieuw woorddeel:
    // "Sint-Eloois-Winkel", "D'Hondt".
    return klein.replace(/(^|[-.'’\/])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
  }).join('');
}
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
      tegenstander: impNetteNaam(thuis ? d.uit : d.thuis),
      venue: impNetteNaam(icsProp(ev, 'LOCATION').replace(/\s*\n\s*/g, ', ').trim()),
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
      datum, tijd, thuis, tegenstander: impNetteNaam(tegenstander),
      venue: impNetteNaam(cel(rij, 'venue')), speeldag: cel(rij, 'speeldag'), reeks: '',
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
// Het ploeg-label waarmee déze regel bekeken moet worden. Bij een bestand geldt er één label voor de
// hele import (het veld bovenaan de lijst); bij de bondskalender staat het per wedstrijd vast, want
// het komt van de bondsploeg waar ze uit komt — en dat is precies wat één MD-ploeg met twee
// bondsploegen bruikbaar maakt.
function impRegelSubteam(r) { return (r && r.rbfaLabel) ? r.rbfaLabel : (impSt.subteam || ''); }
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
    // HET WEDSTRIJDNUMMER VAN DE BOND is de sterkste sleutel die er is: hij overleeft een verplaatste
    // datum, een andere schrijfwijze van de tegenstander en een gewijzigd ploeg-label. Vandaar dat
    // hij hieronder als eerste bekeken wordt.
    if (m.rbfaMatchId) bestaand.set('rbfa|' + m.rbfaMatchId, m.id);
    // Tweede net: een bondssite schrijft de tegenstander voluit ("SPORTKRING ROESELARE") waar jij hem
    // kort intikte ("SK Roeselare") — op naam alleen zou dat een dubbel worden. Álle wedstrijden van
    // die dag bijhouden, niet enkel de eerste: met een A- en een B-ploeg staan er twee, en dan moet
    // de juiste gevonden worden in plaats van degene die toevallig vooraan stond.
    const dk = `${m.teamId || ''}|${m.date || ''}`;
    if (!perDag.has(dk)) perDag.set(dk, []);
    perDag.get(dk).push({ id: m.id, opponent: m.opponent || '', subteam: m.subteam || '' });
  });
  impSt.regels.forEach(r => {
    const label = impRegelSubteam(r);
    const exact = (r.rbfaMatchId && bestaand.get('rbfa|' + r.rbfaMatchId))
      || (r.uid && bestaand.get('uid|' + r.uid))
      || bestaand.get(impDubbelSleutel(impSt.teamId, label, r.datum, r.tegenstander)) || null;
    const dagAlles = exact ? [] : (perDag.get(`${impSt.teamId}|${r.datum}`) || []);
    // Voor het herkennen van een dubbel enkel wedstrijden van dezelfde (of van een niet-gelabelde)
    // ploeg: A mag de wedstrijd van B niet opeisen.
    const dagLijst = dagAlles.filter(m => impZelfdeSubteam(m.subteam, label));
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
  // Hard blokkeren zonder ploeg. Dit stond er als `!team && getTeamsV2().length`, dus juist in het
  // ergste geval — een lege ploegenlijst — liet het door, en dan werden wedstrijden weggeschreven met
  // teamId '' en teamName 'Ploeg'. Zonder ploeg heeft een wedstrijd geen plaats om te staan.
  if (!team) {
    showToast(getTeamsV2().length ? 'Kies eerst je eigen ploeg.' : 'Maak eerst een ploeg aan — een wedstrijd hoort altijd bij een ploeg.', 'err');
    return;
  }
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
      location: r.thuis ? 'Thuis' : 'Uit',
    };
    // HET TERREIN alleen aanraken als de bron het kent. De kalender van de bond bevat geen terrein
    // (dat komt pas mee bij het ophalen per wedstrijd), dus zonder deze voorwaarde wiste een import
    // bij élke wedstrijd het terrein dat je zelf ingaf of dat via "Wedstrijdinfo ophalen"
    // binnenkwam — en dat bij elke keer opnieuw inlezen.
    if (impSt.bron !== 'rbfa') veld.venue = r.venue || '';
    // HET WEDSTRIJDNUMMER VAN DE BOND. Dit is de eigenlijke buit van de bondskalender: staat dat
    // nummer op de wedstrijd, dan weet "Wedstrijdinfo ophalen" (import-vv.js) achteraf meteen welke
    // wedstrijd het is en hoeft er nooit meer een link geplakt te worden. Het staat in `veld`, dus
    // het gaat mee bij een nieuwe én bij een bijgewerkte wedstrijd, en het ongedaan-maken hieronder
    // neemt het automatisch mee (dat loopt over de sleutels van `veld`).
    if (r.rbfaMatchId) veld.rbfaMatchId = String(r.rbfaMatchId);
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
      // Het label per regel: bij een bestand is dat het ene veld bovenaan de lijst, bij de
      // bondskalender het label van de bondsploeg waar deze wedstrijd uit komt.
      subteam: impRegelSubteam(r) || '',
      // Idem voor de soort: de bond zegt per wedstrijd of het competitie, beker of vriendschappelijk
      // is; bij een bestand geldt de keuze voor de hele import.
      competition: r.rbfaSoort || impSt.competition, matchday: r.speeldag || '', referee: '', jersey: '',
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

// =============================================================================================
// DE KALENDER RECHTSTREEKS BIJ DE VOETBALBOND
// =============================================================================================
// Dezelfde wizard als hierboven, maar zonder bestand: de app vraagt de kalender van je ploeg op bij
// de bond. Twee redenen. Eén: geen download meer, geen bestand meer, en wat je krijgt is altijd de
// actuele kalender. Twee, en eigenlijk de belangrijkste: er komt een WEDSTRIJDNUMMER mee. Dat is
// precies wat "Wedstrijdinfo ophalen" (import-vv.js) nu met de hand geplakt moet krijgen — staat dat
// nummer op de wedstrijd, dan hoeft dat nooit meer.
//
// DIT IS GEEN NIEUWE LEZER. De regels die hieronder gebouwd worden hebben exact dezelfde vorm als
// die uit een .ics of een tabel, en gaan door dezelfde lijst, dezelfde dubbeldetectie en dezelfde
// impVoerUit. Alles wat daar geldt — een bestaande wedstrijd staat standaard uit, een gespeelde
// wedstrijd wordt niet stil overschreven, ongedaan maken blijft 24 uur geldig — geldt hier
// ongewijzigd.
//
// HETZELFDE ENDPOINT als import-vv.js, en op dezelfde manier: wij sturen onze eigen querytekst mee.
// De site van de bond stuurt zelf enkel een sha256-vingerafdruk van haar vraag (een Apollo
// "persisted query"), maar het endpoint neemt een gewone vraag óók aan — gemeten 31-08-2026, zowel
// voor de kalender als voor de ploegenlijst van een club. Dat scheelt een afhankelijkheid:
// verandert de site háár vraag, dan verandert er voor ons niets.
//
// MOET JE OOIT TOCH ZO'N VINGERAFDRUK VINDEN — bijvoorbeeld voor een vraag die de site alleen
// server-side stelt en die je dus nergens ziet passeren: haal `main.<hash>.js` van rbfa.be op. Daar
// staan álle vraagteksten in klare taal in, met `query <Naam>` erboven. De hash is de sha256 van die
// tekst nadat je (1) twee spaties indent weghaalt, (2) de spatie voor `(` na de operatienaam
// weghaalt en (3) `__typename` als laatste veld in élke geneste selectie zet, niet in de buitenste —
// dat laatste doet Apollo zelf vóór het hashen. Onderscheppen werkt ook, maar alleen binnen één
// paginabezoek: `window.fetch` overschrijven en dán BÍNNEN de pagina doorklikken; een volledige
// herlaadbeurt wist je onderschepper. Meer staat in analyse-rbfa-kalender.md.
//
// WAT ER NIET IN DE KALENDER ZIT: het terrein. Dat komt pas mee bij het ophalen per wedstrijd.
// Daarom raakt deze bron het terreinveld niet aan — zie impVoerUit.

const RBFA_ENDPOINT = 'https://datalake-prod2018.rbfa.be/graphql';

// Enkel de velden die we echt gebruiken. De kalender geeft er meer (het clublogo, de scheidsrechter,
// de strafschoppen van een reeks), maar elk veld dat we vragen is een veld dat kan verdwijnen.
const RBFA_Q_KALENDER = `query GetTeamCalendar($teamId: ID!, $language: Language!, $sortByDate: SortDirection) {
  teamCalendar(teamId: $teamId, language: $language, sortByDate: $sortByDate) {
    id
    startTime
    showScore
    homeTeam { id name }
    awayTeam { id name }
    outcome { status homeTeamGoals awayTeamGoals }
    series { id name }
  }
}`;
const RBFA_Q_CLUBPLOEGEN = `query getClubTeams($clubId: ID!, $language: Language!) {
  clubTeams(clubId: $clubId, language: $language) { id name discipline }
}`;
const RBFA_Q_CLUB = `query getClub($clubId: ID!, $language: Language!) {
  club(clubId: $clubId, language: $language) { id name registrationNumber }
}`;

// Eén verzoek. `wat` komt in de foutmelding terecht, zodat je uit de melding kan opmaken welke van
// de drie vragen niet lukte.
async function rbfaVraag(query, variables, wat) {
  let r;
  try {
    r = await fetch(RBFA_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    throw new Error('Geen verbinding met de voetbalbond. Kijk je internetverbinding na en probeer opnieuw.');
  }
  if (!r.ok) throw new Error(`De voetbalbond antwoordde niet zoals verwacht (${r.status}). Probeer het later opnieuw.`);
  let j;
  try { j = await r.json(); } catch (e) {
    throw new Error('Het antwoord van de voetbalbond was onleesbaar. Probeer het later opnieuw.');
  }
  // Een GraphQL-fout betekent hier bijna altijd dat de bond haar gegevens ánders is gaan noemen.
  // Daar helpt opnieuw proberen niet tegen, dus zeg dat er ook bij — en zet de melding van de bond
  // erachter, want dat is het enige spoor dat een volgende lezer heeft om de vraag mee te herstellen.
  if (j && j.errors && j.errors.length) {
    const m = (j.errors[0] && j.errors[0].message) || '';
    throw new Error(`De voetbalbond kon ${wat} niet geven. Mogelijk is haar site veranderd; dan werkt dit pas weer na een aanpassing van de app.${m ? ` (${m})` : ''}`);
  }
  return (j && j.data) || {};
}

// De clubnaam en het stamnummer, zodat de gebruiker zélf ziet of hij het juiste clubnummer heeft.
// Bestaat de club niet, dan komt hier `null` terug — het énige geval waarin de bond een verkeerd
// nummer verklapt. Bij een verkeerd PLOEGnummer krijg je gewoon een lege kalender, niet te
// onderscheiden van een ploeg zonder wedstrijden. Vandaar dat de ploeg gekozen wordt uit de lijst
// van de club en niet met de hand ingetikt.
async function rbfaClubInfo(clubId) {
  const d = await rbfaVraag(RBFA_Q_CLUB, { clubId: String(clubId), language: 'nl' }, 'de gegevens van die club');
  return d.club || null;
}
async function rbfaClubPloegen(clubId) {
  const d = await rbfaVraag(RBFA_Q_CLUBPLOEGEN, { clubId: String(clubId), language: 'nl' }, 'de ploegenlijst van die club');
  return d.clubTeams || null;
}
async function rbfaKalender(teamId) {
  const d = await rbfaVraag(RBFA_Q_KALENDER, { teamId: String(teamId), language: 'nl', sortByDate: 'asc' }, 'de kalender van die ploeg');
  return d.teamCalendar || [];
}

// Het clubnummer uit wat je plakt: een volledig adres mag, een los getal ook. Zelfde gedachte als
// vvNummerUit in import-vv.js. Plak je het adres van een PLOEGpagina
// (rbfa.be/nl/club/1641/ploeg/380596/overzicht), dan is het clubnummer het eerste van de twee — en
// dat is precies wat we hier willen.
function rbfaClubNummerUit(txt) {
  const s = String(txt || '').trim();
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/\/(?:club|clubs)\/(\d+)/i);
  if (m) return m[1];
  const alle = s.match(/\d{2,}/g);
  return alle ? alle[0] : '';
}

// De bond hangt haar eigen niveau- en ploegnummer achter de clubnaam: "RFC Wetteren A 3-2",
// "VK Ninove 3", "Koninklijke Eendracht Aalst Lede 3-2". Die cijfers horen niet bij de club en staan
// lelijk op het kaartje, in het verslag en in de PDF. Ze gaan eraf.
// De LOSSE LETTER blijft wél staan ("RFC Wetteren A"): dat is het ploeglabel van de tegenstander, en
// in een jeugdreeks is de A-ploeg een ándere tegenstander dan de B-ploeg.
// Maximaal twee cijfers, zodat een jaartal in de clubnaam ("Sporting 1927") blijft staan.
function rbfaNetteTegenstander(naam) {
  let s = String(naam || '').trim();
  s = s.replace(/\s+\d{1,2}\s*-\s*\d{1,2}$/, '');   // niveau, "3-2"
  s = s.replace(/\s+\d{1,2}$/, '');                 // ploegnummer, "3"
  // impNetteNaam maakt van "SPORTKRING ROESELARE" weer "Sportkring Roeselare"; een naam waar al een
  // kleine letter in staat blijft ongemoeid. Dat is nodig, want de bond schrijft dezelfde club in
  // een vriendschappelijke reeks in kapitalen en in de competitie niet.
  return impNetteNaam(s.trim());
}

// De soort wedstrijd, in de drie woorden die de app kent (MATCH_KINDS in core.js).
// LET OP — het voorvoegsel van de reeks-id zegt NIET of het een beker is: "Beker van Vlaanderen"
// staat onder CHP_ (competitie), en alleen de Croky Cup onder CUP_. Gemeten 31-08-2026 bij het
// eerste elftal. Vandaar dat de naam van de reeks hier meebeslist.
function rbfaSoort(w) {
  const id = String(((w.series || {}).id) || '');
  const naam = String(((w.series || {}).name) || '');
  if (/^FRN_/i.test(id)) return 'Vriendschappelijk';
  if (/^CUP_/i.test(id) || /\bbeker\b/i.test(naam) || /\bcoupe\b/i.test(naam)) return 'Beker';
  return 'Competitie';
}

// Enkel om te TONEN in de lijst, zodat je ziet dat het om een gespeelde wedstrijd gaat. De uitslag
// wordt NOOIT geïmporteerd: een stand zonder gebeurtenissen levert een wedstrijd met een score en
// geen verslag, en daar hangen de selectie- en speelminutenregels aan vast (v1.23.0). Een gespeelde
// wedstrijd aanvullen doe je met "Wedstrijdinfo ophalen" — dat heeft na deze import het
// wedstrijdnummer al klaarstaan.
function rbfaUitslagTxt(w) {
  const o = w.outcome || {};
  if (o.status !== 'finished' || w.showScore === false) return '';
  if (o.homeTeamGoals === null || o.homeTeamGoals === undefined) return '';
  if (o.awayTeamGoals === null || o.awayTeamGoals === undefined) return '';
  return `${o.homeTeamGoals}-${o.awayTeamGoals}`;
}

// ---------------------------------------------------------------------------------------------
// DE KOPPELING, ZOALS ZE BIJ DE PLOEG BEWAARD STAAT
// ---------------------------------------------------------------------------------------------
// Twee OPTIONELE velden op de ploeg: `rbfaClubId` (één clubnummer, enkel om de lijst de volgende
// keer meteen te kunnen tonen) en `rbfaTeams` (een LIJST van {id, label}).
//
// WAAROM EEN LIJST. Bij ons is U11IP één ploeg met ploeglabels (A = Groen, B = Zwart); bij de bond
// zijn dat U11 A en U11 B, elk in een eigen poule met een eigen kalender. Eén MD-ploeg kan dus met
// twee (of meer) bondsploegen overeenkomen, en die kalenders horen samen in één lijst te komen.
// Het label per bondsploeg wordt het ploeglabel op de wedstrijd (m.subteam) — precies het veld
// waarmee de app A en B al van elkaar houdt, ook in de dubbeldetectie. Geen nieuw veld nodig.
//
// Een ploeg van vóór deze versie heeft beide velden niet. Dan is er geen bondskalender op te halen
// en verandert er niets: elk gebruik hieronder gaat door rbfaPloegen(), die dan een lege lijst geeft.
// `naam` is de naam die de bond aan die ploeg geeft ("U17 A"). Enkel om te TONEN: een rij met
// "381165" alleen zegt niemand iets, en zonder naam kan je niet nakijken of je de juiste ploeg
// koppelde. Alles wat ophaalt gebruikt enkel `id`. Ontbreekt de naam, dan valt de weergave terug op
// het nummer.
function rbfaPloegen(team) {
  const arr = team && team.rbfaTeams;
  if (!Array.isArray(arr)) return [];
  return arr
    .map(p => ({
      id: String((p && p.id) || '').trim(),
      label: String((p && p.label) || '').trim(),
      naam: String((p && p.naam) || '').trim(),
    }))
    .filter(p => p.id);
}
// Hoe één gekoppelde bondsploeg op het scherm komt.
function rbfaPloegTxt(p) {
  return `<b>${esc(p.naam || ('ploeg ' + p.id))}</b>`
    + `<span style="color:var(--txt2)">${p.naam ? ` · ${esc(p.id)}` : ''}${p.label ? ` · label ${esc(p.label)}` : ''}</span>`;
}
function rbfaClubVan(team) { return String((team && team.rbfaClubId) || '').trim(); }

// De kalenders van álle gekoppelde bondsploegen. Eén na één en niet tegelijk: het zijn er twee of
// drie, en zo weet je bij een fout welke ploeg ze gaf.
async function rbfaHaalKalenders(ploegen) {
  const uit = [];
  for (const p of ploegen) {
    uit.push({ id: p.id, label: p.label, wedstrijden: await rbfaKalender(p.id) });
  }
  return uit;
}

// Van de kalender(s) van de bond naar exact dezelfde regels als impIcsNaarRegels aflevert.
function rbfaNaarRegels(perPloeg) {
  const onze = new Set(perPloeg.map(p => String(p.id)));
  const regels = [];
  const gezien = new Set();
  let over = 0, samengevoegd = 0;
  perPloeg.forEach(p => {
    (p.wedstrijden || []).forEach(w => {
      const nr = String((w && w.id) || '');
      const st = String((w && w.startTime) || '');
      const datum = st.slice(0, 10);
      if (!nr || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) { over++; return; }
      // ONTDUBBELEN OP HET WEDSTRIJDNUMMER. Spelen twee ploegen van je eigen club tegen elkaar, dan
      // staat die wedstrijd in beide kalenders. Eén keer volstaat.
      if (gezien.has(nr)) { samengevoegd++; return; }
      const thuisId = String(((w.homeTeam || {}).id) || '');
      const uitId = String(((w.awayTeam || {}).id) || '');
      // THUIS OF UIT NIET OP NAAM BEPALEN. Binnen één kalender staat de eigen club onder
      // verschillende schrijfwijzen — bij het eerste elftal van Sparta vier: "KFC Sparta Petegem A",
      // "SPARTA PETEGEM DEINZE", "SPARTA PETEGEM DEINZE A" en "Sparta Petegem Deinze A". Het
      // ploegnummer is exact, en we hebben het toch al. (De ICS-import moet wél op naam werken; daar
      // is geen nummer.)
      const thuis = onze.has(thuisId);
      if (!thuis && !onze.has(uitId)) { over++; return; }
      gezien.add(nr);
      regels.push({
        datum, tijd: st.slice(11, 16), thuis,
        tegenstander: rbfaNetteTegenstander(((thuis ? w.awayTeam : w.homeTeam) || {}).name),
        // Het terrein staat niet in de kalender van de bond. Leeg laten, en impVoerUit raakt het veld
        // dan ook niet aan (zie daar) — anders wiste elke import het terrein dat je zelf ingaf of dat
        // via "Wedstrijdinfo ophalen" binnenkwam.
        venue: '',
        reeks: String(((w.series || {}).name) || '').trim(),
        speeldag: '', uid: '',
        bestaat: null, aan: true,
        // De eigenlijke buit.
        rbfaMatchId: nr,
        // Het label van de bondsploeg waar deze wedstrijd uit komt.
        rbfaLabel: p.label || '',
        rbfaSoort: rbfaSoort(w),
        rbfaGespeeld: ((w.outcome || {}).status === 'finished'),
        rbfaUitslag: rbfaUitslagTxt(w),
      });
    });
  });
  regels.sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
  return { regels, overgeslagen: over, samengevoegd };
}

// ---------------------------------------------------------------------------------------------
// DE BRONKAART IN DE IMPORTWIZARD
// ---------------------------------------------------------------------------------------------
function rbfaBronKaartHtml() {
  const team = teamById(impSt.teamId);
  if (!team) return '';   // zonder ploeg valt er niets te koppelen; het bestandspad zegt dat al
  const ploegen = rbfaPloegen(team);
  const fout = (impSt.fout && impSt.rbfaFout)
    ? `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(220,60,60,.12);color:var(--rd);font-size:14px;font-weight:600">${icI(IC.warn)}${esc(impSt.fout)}</div>`
    : '';
  // NIET GEKOPPELD = HIER GEEN KNOP, MAAR EEN WEG (Tim, 31-08-2026). Koppelen is een clubgegeven en
  // gebeurt bij Clubbeheer; zie de uitleg bij rbfaTeamSectieHtml. Hier stond een knop die het per
  // ploeg deed. Zonder vervanging zou je hier alleen lezen dat het kan en niet waar — en dan is een
  // doodlopende melding erger dan geen melding. De clubbeheerder krijgt de weg erbij, wie het niet
  // is, weet aan wie hij het moet vragen.
  if (!ploegen.length) {
    const magZelf = isOwner || isClubAdmin;
    return `<div class="sec">Van de voetbalbond</div>
      <div class="card">
        <p style="font-size:14px;color:var(--txt2);margin:0 0 ${magZelf ? '12' : '0'}px">De kalender van je ploeg kan rechtstreeks van <b>rbfa.be</b> komen, met het <b>wedstrijdnummer</b> van elke wedstrijd erbij — maar dan moet <b>${esc(team.name)}</b> eerst aan haar ploeg bij de bond gekoppeld zijn. ${magZelf ? 'Dat doe je bij <b>Clubbeheer</b>, in één keer voor alle ploegen van de club.' : 'Dat doet de clubbeheerder, in één keer voor alle ploegen van de club.'}</p>
        ${magZelf ? `<button class="btn btn-pale" style="margin:0" onclick="go('clubbeheer')">${icI(IC.link)} Naar Clubbeheer</button>` : ''}
      </div>`;
  }
  const lijst = ploegen.map(p => `<div style="padding:1px 0">${rbfaPloegTxt(p)}</div>`).join('');
  return `<div class="sec">Van de voetbalbond</div>
    <div class="card">
      <p style="font-size:14px;color:var(--txt2);margin:0 0 6px"><b>${esc(team.name)}</b> is bij de bond ${ploegen.length === 1 ? 'deze ploeg' : `deze ${ploegen.length} ploegen`}:</p>
      <div style="font-size:14px;margin:0 0 12px">${lijst}</div>
      ${ploegen.length > 1 ? `<p style="font-size:13px;color:var(--txt2);margin:0 0 12px">Beide kalenders komen samen in één lijst.</p>` : ''}
      ${fout}
      <button class="btn btn-green" style="margin-top:2px" ${impSt.rbfaBezig ? 'disabled style="margin-top:2px;opacity:.5"' : 'onclick="impRbfaOphalen()"'}>${icI(IC.link)} ${impSt.rbfaBezig ? 'Bezig met ophalen…' : 'Kalender ophalen'}</button>
      ${/* "Ploegen aanpassen" stond hier; die weg loopt nu via Clubbeheer (Tim, 31-08-2026). */ ''}
    </div>`;
}

async function impRbfaOphalen() {
  if (!impSt || impSt.rbfaBezig) return;
  const team = teamById(impSt.teamId);
  const ploegen = rbfaPloegen(team);
  if (!ploegen.length) return;
  impSt.rbfaBezig = true; impSt.fout = ''; impSt.rbfaFout = false; impRender();
  try {
    const per = await rbfaHaalKalenders(ploegen);
    const uit = rbfaNaarRegels(per);
    if (!uit.regels.length) {
      throw new Error(`De bond geeft geen wedstrijden voor ${ploegen.length === 1 ? 'deze ploeg' : 'deze ploegen'}. Bij de jongste reeksen staat er soms nog geen kalender online; kijk anders bij "Ploegen aanpassen" na of het de juiste ploeg is.`);
    }
    impSt.bron = 'rbfa';
    impSt.bestand = 'Kalender van de voetbalbond';
    impSt.regels = uit.regels;
    impSt.overgeslagen = uit.overgeslagen;
    impSt.rbfaSamengevoegd = uit.samengevoegd;
    // Het ploeglabel staat hier per wedstrijd vast — het komt van de bondsploeg waar ze uit komt.
    // Dus niets te raden uit de reeksnaam (impSubteamUitReeks) en niets in te stellen voor de hele
    // import; het veld valt weg uit de lijst (zie impLijstHtml).
    impSt.subteamVoorstel = '';
    await impMarkeerDubbels();
    impSt.fase = 'lijst';
  } catch (e) {
    impSt.fout = (e && e.message) || 'Het ophalen is niet gelukt.';
    impSt.rbfaFout = true;
  }
  impSt.rbfaBezig = false;
  impRender();
}

// De sectie op het ploegscherm. Wordt tijdens het tekenen aangeroepen, dus na het laden van alle
// bestanden — teams-tournaments.js laadt vóór dit bestand, en dat mag zolang de aanroep op het moment
// van gebruik gebeurt en niet in een tabel die bij het laden opgebouwd wordt (zie CLAUDE.md).
//
// STAAT OP BEIDE GEDAANTEN VAN DAT SCHERM. Het ploegscherm heeft een leesweergave
// (renderTeamOverview) en een bewerkweergave (renderTeamEdit), en je komt standaard op de eerste
// terecht — daar hoort dit dus óók te staan, anders bestaat de functie voor wie het potlood niet
// aantikt gewoon niet.
//
// HIER ALLEEN LEZEN, KOPPELEN GEBEURT OP CLUBNIVEAU (Tim, 31-08-2026). Aanvankelijk stond hier een
// knop waarmee een ploegbeheerder zijn eigen ploeg koppelde. Dat is eruit: een koppeling is een
// clubgegeven, net als de clubnaam en het clublogo, en hoort één keer door de clubbeheerder gelegd te
// worden bij de opstart — en later opnieuw wanneer er een ploeg bij komt. Anders krijg je twintig
// ploegbeheerders die elk een clubnummer moeten opzoeken, met twintig kansen om de verkeerde ploeg
// van de bond aan te vinken. De nummers blijven hier wél STAAN, zodat je kan zien waaraan een ploeg
// hangt en waarom haar kalender vandaan komt waar hij vandaan komt.
//
// GEVOLG, BEWUST AANVAARD: een ploeg zonder club kan niet meer gekoppeld worden, want er is dan geen
// clubscherm om het vanaf te doen. Tims antwoord (31-08-2026): er worden nooit ploegen gemaakt die
// niet aan een club hangen.
function rbfaTeamSectieHtml(team) {
  if (!team || team.isNew || !canManage()) return '';
  const ploegen = rbfaPloegen(team);
  if (!ploegen.length) return '';
  return `<div class="sec">Kalender van de voetbalbond</div>
    <div class="card">
      <div style="font-size:14px">${ploegen.map(p => `<div style="padding:2px 0">${rbfaPloegTxt(p)}</div>`).join('')}</div>
      <p style="font-size:12px;color:var(--txt2);margin:8px 0 0">Bij <b>Kalender importeren</b> haalt de app hiermee de kalender op, met het wedstrijdnummer van elke wedstrijd erbij. De koppeling zelf legt de clubbeheerder, bij <b>Clubbeheer</b>.</p>
    </div>`;
}

// =============================================================================================
// DE PLOEGEN VAN DE CLUB NAAST DE PLOEGENLIJST VAN DE BOND
// =============================================================================================
// Laag 2, vanuit Clubbeheer. Het venster hierboven koppelt ÉÉN ploeg; dit legt de volledige
// ploegenlijst van de club naast die van de bond, en laat per bondsploeg kiezen: bij welke ploeg in
// de app ze hoort, of dat ze hier nog niet bestaat en aangemaakt moet worden. Dat laatste was Tims
// vraag: aan het begin van een seizoen staan er dertig ploegen bij de bond en nul in de app.
//
// WAT DIT SCHRIJFT, EN MET WELK RECHT. Twee dingen, en beide mocht een clubbeheerder al:
//   1. De koppeling op de kern van een ploeg van zijn club. De regel op `teams/$teamId` geeft hem
//      schrijfrecht op een BESTAANDE ploeg van zijn club zolang `info/clubId` ongewijzigd blijft
//      (fase 2d); `roster` heeft enkel een eigen `.read`, dus het schrijfrecht erft van de ouder.
//      Wij werken gericht bij op `teams/<ploeg>/roster/<kern>/rbfaTeams`. De ploeg-id's komen
//      uitsluitend uit `clubs/<club>/teams`, en de regels rekenen de clubbeheerdersclaim nóg eens na
//      op de ploeg zelf — er gaat dus niets over een clubgrens, ook niet bij een fout van ons.
//   2. Een ploeg aanmaken, via dezelfde createTeam als "Nieuwe ploeg in deze club".
// Er is GEEN regelwijziging voor nodig en er komt geen nieuw recht bij.
//
// EEN VALKUIL DIE APART AFGEHANDELD WORDT. `saveTeamsV2` schrijft de HELE kernlijst van de ACTIEVE
// ploeg weg (cloudOnLocalTeamsSave doet één `teamRef('roster').set(arr)`). Koppel je de actieve ploeg
// hier met een gerichte write, dan kan een latere gewone opslag dat overschrijven met de verouderde
// kopie die in het geheugen zat. Voor de actieve ploeg gaan we daarom langs de lokale weg
// (getTeamsV2 + saveTeamsV2), voor elke andere ploeg gericht. Zie rbfaKoppelingWegschrijven.

// De wedstrijdvorm en het aantal blokken die een NIEUWE ploeg meekrijgt, geraden uit de naam die de
// bond haar geeft. Enkel een startwaarde — ze staat op het ploegscherm en per wedstrijd aanpasbaar —
// maar een 11v11-ploeg met vier kwarten is zo verkeerd dat 'geen gok' hier de slechtere keuze is.
// De gok staat zichtbaar in de rij vóór je op Toepassen tikt.
// Belgische jeugdreeksen: U6-U7 3v3, U8-U9 5v5, U10-U13 8v8, vanaf U14 (en bij de kernploegen) 11v11.
function rbfaVormGok(naam) {
  const m = String(naam || '').match(/\bU\s?(\d{1,2})\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n <= 7) return { matchType: '3v3', periodKey: 'kwarten' };
    if (n <= 9) return { matchType: '5v5', periodKey: 'kwarten' };
    if (n <= 13) return { matchType: '8v8', periodKey: 'kwarten' };
    return { matchType: '11v11', periodKey: 'helften' };
  }
  // "Eerste Elftal", "Reserven", "G-voetbal" en al de rest: geen leeftijd om op te gaan. De
  // kernploegen spelen 11v11; voor de rest is 8v8 de standaard van de app zelf.
  if (/eerste\s*elftal|reserven|beloften|dames|vrouwen/i.test(naam)) return { matchType: '11v11', periodKey: 'helften' };
  return { matchType: '8v8', periodKey: 'kwarten' };
}

// Alle KERNEN van alle (niet-gearchiveerde) ploegen van de club, met hun huidige koppeling.
// Een kern, niet een ploeg: `m.teamId` op een wedstrijd is een kern-id, en de koppeling hoort dus bij
// de kern. Meestal heeft een cloudploeg er precies één (createTeam maakt er één aan), maar wie op het
// lokale Ploegen-scherm een tweede aanmaakte heeft er twee — dan komen die hier als twee rijen.
async function rbfaKernenVanClub(clubId) {
  const lees = async (pad, leeg) => {
    try { const v = (await fbOnce(fbdb.ref(pad))).val(); return (v === null || v === undefined) ? leeg : v; }
    catch (e) { return leeg; }
  };
  const teams = await lees('clubs/' + clubId + '/teams', {});
  const ids = Object.keys(teams || {});
  const uit = [];
  await Promise.all(ids.map(async tid => {
    const [naam, gearchiveerd, roster] = await Promise.all([
      lees('teams/' + tid + '/info/name', ''),
      lees('teams/' + tid + '/info/archived', false),
      lees('teams/' + tid + '/roster', null),
    ]);
    if (!naam || gearchiveerd) return;   // een gearchiveerde ploeg biedt zich hier niet aan
    // De kern staat als lijst óf als object, afhankelijk van wie ze het laatst wegschreef
    // (createTeam schrijft een object met één push-key, saveTeamsV2 een array). Overal in de app
    // wordt dat zo genormaliseerd; de SLEUTEL houden we erbij, want daarop schrijven we straks
    // gericht terug.
    const paren = roster
      ? (Array.isArray(roster)
          ? roster.map((k, i) => [String(i), k])
          : Object.keys(roster).map(k => [k, roster[k]]))
      : [];
    paren.forEach(([sleutel, kern]) => {
      if (!kern || !kern.id) return;
      uit.push({
        teamId: tid, ploegNaam: naam, sleutel,
        kernId: String(kern.id), kernNaam: String(kern.name || naam),
        meerdereKernen: paren.length > 1,
        rbfaClubId: String(kern.rbfaClubId || ''),
        rbfaTeams: rbfaPloegen(kern),
      });
    });
  }));
  uit.sort((a, b) => (a.kernNaam || '').localeCompare(b.kernNaam || '', 'nl'));
  return uit;
}

// De koppeling op één kern wegschrijven. `ploegen` is de volledige, gewenste lijst — een lege lijst
// haalt de koppeling weg.
async function rbfaKoppelingWegschrijven(kern, clubNr, ploegen) {
  const heeft = ploegen && ploegen.length;
  // DE ACTIEVE PLOEG langs de gewone lokale weg: dan klopt de lijst in het geheugen meteen én kan een
  // volgende "Ploeg opslaan" de koppeling niet overschrijven met een verouderde kopie. Die tweede
  // bescherming zit óók in ploegWegschrijven (teams-tournaments.js), dat deze twee velden
  // uitdrukkelijk uit de pas gelezen lijst overneemt.
  if (cloudReady && activeTeamId && kern.teamId === activeTeamId) {
    const arr = getTeamsV2();
    const idx = arr.findIndex(t => t && t.id === kern.kernId);
    if (idx >= 0) {
      if (heeft) { arr[idx].rbfaTeams = ploegen; arr[idx].rbfaClubId = String(clubNr || ''); }
      else { delete arr[idx].rbfaTeams; delete arr[idx].rbfaClubId; }
      saveTeamsV2(arr);
      return;
    }
    // Staat de kern (nog) niet in de lokale lijst — bv. een ploeg die net aangemaakt is en waarvan de
    // luisteraar nog niets binnenbracht — dan valt hij door naar de gerichte write hieronder.
  }
  // EEN ANDERE PLOEG VAN DE CLUB: gericht bijwerken, enkel deze twee velden. Nooit de hele kern
  // wegschrijven: daar zitten de spelers in, en die hebben we hier niet vers in handen.
  const pad = 'teams/' + kern.teamId + '/roster/' + kern.sleutel;
  await fbdb.ref(pad).update({
    rbfaTeams: heeft ? ploegen : null,
    rbfaClubId: heeft ? String(clubNr || '') : null,
  });
}

// ---------------------------------------------------------------------------------------------
// HET VENSTER
// ---------------------------------------------------------------------------------------------
let rbfaCkSt = null;

async function rbfaClubKoppelOpen(clubId) {
  if (!fbdb || !currentUser) { showToast('Hiervoor is verbinding nodig.', 'err'); return; }
  if (!(myClubs && myClubs[clubId]) && !isOwner) { showToast('Enkel een clubbeheerder kan dit.', 'err'); return; }
  rbfaCkSt = {
    clubId, clubNaam: '', clubIn: '', club: null, bondPloegen: null,
    kernen: null, keuze: {}, bezig: true, fout: '', bezigTxt: 'Ploegen van de club ophalen…',
  };
  rbfaCkRender();
  try {
    const [naam, kernen] = await Promise.all([
      (async () => { try { return (await fbOnce(fbdb.ref('clubs/' + clubId + '/info/name'))).val() || ''; } catch (e) { return ''; } })(),
      rbfaKernenVanClub(clubId),
    ]);
    rbfaCkSt.clubNaam = naam || 'deze club';
    rbfaCkSt.kernen = kernen;
    // Het clubnummer van de bond staat nergens op de CLUB bewaard — op `clubs/<id>` mag enkel de
    // maker van de app schrijven (het logo uitgezonderd), dus een clubbeheerder kan daar niets
    // kwijt. Het staat wél op elke kern die al gekoppeld is; daar halen we het vandaan. Zo hoeft
    // niemand het een tweede keer op te zoeken.
    const gekend = kernen.map(k => k.rbfaClubId).filter(Boolean);
    rbfaCkSt.clubIn = gekend[0] || '';
    // Wat er al gekoppeld is, is de beginstand van de keuzes.
    kernen.forEach(k => k.rbfaTeams.forEach(p => {
      rbfaCkSt.keuze[p.id] = { naar: k.kernId, label: p.label || '', naam: '' };
    }));
  } catch (e) {
    rbfaCkSt.fout = 'De ploegen van de club ophalen is niet gelukt. Probeer het opnieuw.';
  }
  rbfaCkSt.bezig = false; rbfaCkSt.bezigTxt = '';
  rbfaCkRender();
  if (rbfaCkSt.clubIn && !rbfaCkSt.fout) rbfaCkZoek();
}
// DE SCHUIFPOSITIE VAN DE PLOEGENLIJST OVERLEEFT EEN HERTEKENING (Tim, 31-08-2026). Elke keuze
// tekent dit venster opnieuw, en de lijst met bondsploegen zit in een eigen schuifvak binnen de
// modal. openModal bewaart de positie van de MODAL, maar niet die van een vak daarin — dus stond je
// na elke keuze weer bovenaan. Bij 39 bondsploegen betekende dat na elke tik opnieuw naar beneden
// vegen. Gemeten: op 1500 px stond je na één keuze terug op 0.
// Het vak wordt gezocht op zijn max-height-stijl en niet op een klasse: dat is dezelfde plek waar
// rbfaCkHtml hem zet, en zo hoeft er geen naam op twee plaatsen te kloppen. Vindt hij hem niet, dan
// gebeurt er gewoon niets — nooit een hertekening laten mislukken om een schuifpositie.
const RBFA_CK_LIJST_STIJL = 'max-height:44vh';
function rbfaCkLijstVak() {
  return Array.from(document.querySelectorAll('#modal div'))
    .find(e => (e.getAttribute('style') || '').indexOf(RBFA_CK_LIJST_STIJL) === 0) || null;
}
function rbfaCkRender() {
  if (!rbfaCkSt) return;
  const vak = rbfaCkLijstVak();
  const schuif = vak ? vak.scrollTop : 0;
  openModal(rbfaCkHtml());
  if (!schuif) return;
  const nieuw = rbfaCkLijstVak();
  if (nieuw) nieuw.scrollTop = schuif;
}
function rbfaCkSluit() { rbfaCkSt = null; closeModal(); }
function rbfaCkVeld(v) { if (rbfaCkSt) rbfaCkSt.clubIn = v; }

async function rbfaCkZoek() {
  if (!rbfaCkSt || rbfaCkSt.bezig) return;
  const veld = document.getElementById('rbfa-ck-club');
  if (veld) rbfaCkSt.clubIn = veld.value;
  const nr = rbfaClubNummerUit(rbfaCkSt.clubIn);
  if (!nr) { rbfaCkSt.fout = 'Hier vind ik geen clubnummer in. Tik het nummer in, of plak het volledige adres van je clubpagina.'; rbfaCkRender(); return; }
  rbfaCkSt.fout = ''; rbfaCkSt.bezig = true; rbfaCkSt.bezigTxt = 'Ploegen bij de bond ophalen…';
  rbfaCkSt.club = null; rbfaCkSt.bondPloegen = null;
  rbfaCkRender();
  try {
    const club = await rbfaClubInfo(nr);
    if (!club) throw new Error(`Club ${nr} bestaat niet bij de bond. Kijk het nummer na in het adres van je clubpagina.`);
    const ploegen = await rbfaClubPloegen(nr);
    if (!ploegen || !ploegen.length) throw new Error(`Bij ${club.name || ('club ' + nr)} staat geen enkele ploeg. Kijk het clubnummer na.`);
    rbfaCkSt.clubIn = nr; rbfaCkSt.club = club; rbfaCkSt.bondPloegen = ploegen;
  } catch (e) {
    rbfaCkSt.fout = (e && e.message) || 'Het ophalen is niet gelukt.';
  }
  rbfaCkSt.bezig = false; rbfaCkSt.bezigTxt = '';
  rbfaCkRender();
}

// Het ploeg-label geraden uit de naam die de bond geeft: "U11 A" → "A". Een losse letter achteraan
// is bij de bond het reeksonderscheid, en dat is precies waarmee de app A en B van elkaar houdt.
// Geen letter achteraan? Dan geen voorstel; je tikt zelf iets.
//
// STAAT HIER, VLAK BIJ ZIJN ENIGE GEBRUIKER, EN DAAR IS EEN REDEN VOOR. Deze functie stond
// oorspronkelijk in het koppelvenster per ploeg, en dat venster is in v1.27.2 opgeruimd — met deze
// functie mee. Gevolg: rbfaCkKies hieronder liep stuk op "rbfaLabelVoorstel is not defined", dus
// koppelen op clubniveau werkte niet meer en het labelveld verscheen nooit. Tim liep er meteen tegen
// aan. Een helper die in een ander blok woont dan zijn aanroeper, verdwijnt bij de volgende
// opruiming opnieuw.
function rbfaLabelVoorstel(naam) {
  const m = String(naam || '').trim().match(/(?:^|\s)([A-Za-z])$/);
  return m ? m[1].toUpperCase() : '';
}

// De keuzelijst per bondsploeg: niets doen, een bestaande kern, of aanmaken.
function rbfaCkKies(bondId, waarde) {
  if (!rbfaCkSt) return;
  bondId = String(bondId);
  if (!waarde) { delete rbfaCkSt.keuze[bondId]; rbfaCkRender(); return; }
  const bond = (rbfaCkSt.bondPloegen || []).find(p => String(p.id) === bondId) || {};
  const vorig = rbfaCkSt.keuze[bondId] || {};
  rbfaCkSt.keuze[bondId] = {
    naar: waarde,
    label: vorig.label !== undefined && vorig.label !== '' ? vorig.label : rbfaLabelVoorstel(bond.name),
    // Bij "aanmaken" is de naam van de bondsploeg het voorstel — je kan ze nog wijzigen.
    naam: waarde === '#nieuw' ? (vorig.naam || String(bond.name || '')) : '',
  };
  rbfaCkRender();
}
// Geen hertekening bij het typen: dat zou de cursor uit het veld halen.
function rbfaCkLabel(bondId, v) { const k = rbfaCkSt && rbfaCkSt.keuze[String(bondId)]; if (k) k.label = v; }
function rbfaCkNaam(bondId, v) { const k = rbfaCkSt && rbfaCkSt.keuze[String(bondId)]; if (k) k.naam = v; }

// Hoeveel bondsploegen wijzen naar dezelfde kern? Twee is het geval van Tim (U11 A en U11 B bij de
// bond, één U11IP bij ons); meer dan twee mag ook, maar dan hoort er een label bij elk.
function rbfaCkPerKern() {
  const per = {};
  Object.keys(rbfaCkSt.keuze).forEach(bondId => {
    const k = rbfaCkSt.keuze[bondId];
    if (!k || !k.naar) return;
    if (!per[k.naar]) per[k.naar] = [];
    per[k.naar].push(bondId);
  });
  return per;
}

function rbfaCkHtml() {
  const s = rbfaCkSt;
  const fout = s.fout
    ? `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(220,60,60,.12);color:var(--rd);font-size:14px;font-weight:600">${icI(IC.warn)}${esc(s.fout)}</div>`
    : '';
  if (s.bezig) {
    return `<h3 style="margin:0 0 4px">Ploegen van de voetbalbond</h3>
      <p style="font-size:14px;color:var(--txt2);margin:14px 0">${esc(s.bezigTxt || 'Bezig…')}</p>`;
  }
  const kernen = s.kernen || [];
  const perKern = s.bondPloegen ? rbfaCkPerKern() : {};
  const teKoppelen = Object.keys(s.keuze).filter(b => s.keuze[b].naar && s.keuze[b].naar !== '#nieuw').length;
  const teMaken = Object.keys(s.keuze).filter(b => s.keuze[b].naar === '#nieuw').length;

  const clubBlok = s.club
    ? `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:var(--bg2,#f4f6f8);font-size:14px">
         <b>${esc(s.club.name || '')}</b>${s.club.registrationNumber ? `<span style="color:var(--txt2)"> · stamnummer ${esc(s.club.registrationNumber)}</span>` : ''}
         <div style="font-size:12px;color:var(--txt2);margin-top:2px">${(s.bondPloegen || []).length} ploegen bij de bond · ${kernen.length} ${kernen.length === 1 ? 'ploeg' : 'ploegen'} in de app</div>
       </div>`
    : '';

  // Welke bondsploeg is de EERSTE van haar groep, gelezen in de volgorde van het scherm? Daar komt de
  // uitleg over het label te staan, één keer per groep. Niet via perKern[..][0]: dat is een lijst van
  // nummerachtige sleutels uit Object.keys, en die geeft JavaScript in numerieke volgorde terug — de
  // uitleg landde daardoor onder een willekeurige rij van de groep in plaats van onder de eerste.
  const eersteVanGroep = {};
  (s.bondPloegen || []).forEach(p => {
    const k = s.keuze[String(p.id)];
    if (!k || !k.naar) return;
    if (eersteVanGroep[k.naar] === undefined) eersteVanGroep[k.naar] = String(p.id);
  });

  // Eén rij per bondsploeg.
  const rijen = (s.bondPloegen || []).map(p => {
    const id = String(p.id);
    const k = s.keuze[id] || null;
    const naar = k ? k.naar : '';
    const nieuw = naar === '#nieuw';
    // Het labelveld hoort er zodra er MEER DAN ÉÉN bondsploeg bij dezelfde ploeg hoort — dan moet je
    // ze van elkaar kunnen houden. Maar ook wanneer er al een label staat, ook bij één bondsploeg:
    // anders verdwijnt het veld zodra je de tweede losmaakt, en kan je dat label nergens meer wissen.
    const samen = (naar && !nieuw && ((perKern[naar] || []).length > 1 || !!String(k.label || '').trim()));
    const gok = nieuw ? rbfaVormGok(k.naam || p.name) : null;
    const opties = `<option value="" ${!naar ? 'selected' : ''}>— niets doen —</option>`
      + kernen.map(kn => `<option value="${esc(kn.kernId)}" ${naar === kn.kernId ? 'selected' : ''}>${esc(kn.kernNaam)}${kn.meerdereKernen ? ` (in ${esc(kn.ploegNaam)})` : ''}</option>`).join('')
      + `<option value="#nieuw" ${nieuw ? 'selected' : ''}>+ Ploeg aanmaken in de app</option>`;
    return `<div style="padding:9px 0;border-bottom:1px solid var(--bdr)">
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="flex:1;min-width:0;font-size:15px;font-weight:${naar ? '700' : '500'}">${esc(p.name || ('ploeg ' + id))}</span>
        <span style="font-size:12px;color:var(--txt2);flex:none">${esc(id)}</span>
      </div>
      <select onchange="rbfaCkKies('${esc(id)}',this.value)" style="margin-top:6px;width:100%">${opties}</select>
      ${nieuw ? `<input type="text" value="${esc(k.naam || '')}" oninput="rbfaCkNaam('${esc(id)}',this.value)"
             placeholder="naam van de nieuwe ploeg" autocomplete="off"
             style="width:100%;margin-top:6px;padding:8px 10px;border:2px solid var(--bdr);border-radius:8px;font-size:15px;color:var(--txt);background:var(--card)">
        <div style="font-size:12px;color:var(--txt2);margin-top:4px">Wordt aangemaakt als <b>${esc(gok.matchType.replace('v', ' tegen '))}</b> · <b>${PERIOD_TYPES[gok.periodKey].count} ${esc(PERIOD_TYPES[gok.periodKey].plural)}</b>, geraden uit de naam. Aan te passen bij "Ploeg bewerken".</div>` : ''}
      ${(naar && samen) ? `<input type="text" value="${esc(k.label || '')}" oninput="rbfaCkLabel('${esc(id)}',this.value)"
             placeholder="ploeg-label, bv. A" autocomplete="off"
             style="width:100%;margin-top:6px;padding:8px 10px;border:2px solid var(--bdr);border-radius:8px;font-size:15px;color:var(--txt);background:var(--card)">
        ${/* De uitleg enkel bij de EERSTE van een groep. Ze stond onder elke rij van dezelfde ploeg,
             en dan lees je twee keer hetzelfde vlak onder elkaar. */''}
        ${(eersteVanGroep[naar] === id && (perKern[naar] || []).length > 1) ? `<div style="font-size:12px;color:var(--txt2);margin-top:4px">Meer dan één bondsploeg hoort bij <b>${esc((kernen.find(x => x.kernId === naar) || {}).kernNaam || 'deze ploeg')}</b>, dus hier hoort een label bij om ze in de app van elkaar te houden.</div>` : ''}` : ''}
    </div>`;
  }).join('');

  const knopTxt = (teKoppelen || teMaken)
    ? [teKoppelen ? `${teKoppelen} koppelen` : '', teMaken ? `${teMaken} aanmaken` : ''].filter(Boolean).join(' · ')
    : 'Alle koppelingen wissen';

  return `<h3 style="margin:0 0 4px">Ploegen van de voetbalbond</h3>
    <p style="font-size:13px;color:var(--txt2);margin:0 0 14px">Voor <b>${esc(s.clubNaam)}</b>. Zeg per ploeg van de bond bij welke ploeg in de app ze hoort — of laat ze hier meteen aanmaken als ze nog niet bestaat.</p>
    <div class="fg"><label>Clubnummer bij de bond</label>
      <input id="rbfa-ck-club" type="text" inputmode="numeric" value="${esc(s.clubIn || '')}" oninput="rbfaCkVeld(this.value)"
             placeholder="bv. 1641" autocomplete="off" spellcheck="false">
      <div style="font-size:12px;color:var(--txt2);margin-top:4px">Zoek je club op <b>rbfa.be</b>. In het adres van je clubpagina staat het nummer: rbfa.be/nl/club/<b>1641</b>/ploegen.</div></div>
    <button class="btn btn-pale" style="margin:0" onclick="rbfaCkZoek()">${icI(IC.search)} Ploegen ophalen</button>
    ${fout}
    ${clubBlok}
    ${s.bondPloegen ? `
      ${kernen.length ? '' : `<div style="margin-top:12px;padding:10px 12px;border-radius:8px;background:rgba(230,150,30,.14);font-size:13px">${icI(IC.warn)} Er staat nog geen enkele ploeg in de app voor deze club. Kies bij de ploegen die je nodig hebt <b>"+ Ploeg aanmaken in de app"</b>.</div>`}
      <div class="sec" style="margin-top:16px">Ploeg per ploeg</div>
      <div style="max-height:44vh;overflow-y:auto;margin-bottom:12px">${rijen}</div>
      <button class="btn btn-green" onclick="rbfaCkToepassen()">${icI(IC.check)} ${esc(knopTxt)}</button>` : ''}
    <button class="btn btn-gray" style="margin-top:8px" onclick="rbfaCkSluit()">Annuleren</button>`;
}

async function rbfaCkToepassen() {
  if (!rbfaCkSt || !rbfaCkSt.bondPloegen || rbfaCkSt.bezig) return;
  const s = rbfaCkSt;
  const clubNr = String(s.clubIn || '');
  const bondNaam = (id) => {
    const p = (s.bondPloegen || []).find(x => String(x.id) === String(id));
    return p ? String(p.name || '') : '';
  };
  // Eerst nakijken of elke aan te maken ploeg een naam heeft: halverwege stoppen is hier het
  // slechtste wat er kan gebeuren.
  const zonderNaam = Object.keys(s.keuze).filter(b => s.keuze[b].naar === '#nieuw' && !String(s.keuze[b].naam || '').trim());
  if (zonderNaam.length) {
    s.fout = `Geef elke nieuwe ploeg een naam (${zonderNaam.map(bondNaam).filter(Boolean).join(', ') || zonderNaam.join(', ')}).`;
    rbfaCkRender(); return;
  }
  s.bezig = true; s.fout = ''; s.bezigTxt = 'Bezig…'; rbfaCkRender();

  let gemaakt = 0, gekoppeld = 0, gewist = 0;
  const misluktBij = [];
  try {
    // ---- 1. De nieuwe ploegen aanmaken. Eén per één, want elke aanmaak is een reeks writes en bij
    // een fout willen we weten waar het stopte. `stil` houdt de app op dit scherm.
    for (const bondId of Object.keys(s.keuze)) {
      const k = s.keuze[bondId];
      if (!k || k.naar !== '#nieuw') continue;
      const naam = String(k.naam || '').trim();
      const gok = rbfaVormGok(naam || bondNaam(bondId));
      s.bezigTxt = `"${naam}" aanmaken…`; rbfaCkRender();
      // joinAsMember false: de clubbeheerder beheert deze ploegen via zijn clubrol, zoals bij
      // "Nieuwe ploeg in deze club" de niet-aangevinkte keuze. Hij kan zich er later bij zetten met
      // "Bij mijn ploegen" op het clubscherm — dertig ploegen in "Jouw ploegen" duwen zou het
      // ploegkeuzescherm onbruikbaar maken.
      const res = await createTeam(naam, s.clubId, false, gok.matchType, '', gok.periodKey, 0, true);
      if (!res || !res.teamId) { misluktBij.push(naam); continue; }
      gemaakt++;
      // De verse ploeg wordt vanaf nu een gewone bestemming: één kern, waarvan createTeam ons het
      // id gaf, dus zonder terug te moeten ophalen.
      const kern = { teamId: res.teamId, sleutel: res.rosterId, kernId: res.rosterId,
        kernNaam: naam, ploegNaam: naam, meerdereKernen: false, rbfaClubId: '', rbfaTeams: [] };
      s.kernen.push(kern);
      k.naar = kern.kernId;
    }

    // ---- 2. De gewenste koppeling per kern samenstellen. Over ÁLLE kernen lopen, niet enkel over de
    // gewijzigde: een kern waarvan de laatste bondsploeg weggehaald werd, moet haar koppeling kwijt.
    const perKern = rbfaCkPerKern();
    for (const kern of s.kernen) {
      const bondIds = perKern[kern.kernId] || [];
      // In de volgorde waarin de bond haar ploegen geeft, zodat het leest zoals het venster.
      const gewenst = (s.bondPloegen || [])
        .filter(p => bondIds.includes(String(p.id)))
        .map(p => {
          const k = s.keuze[String(p.id)] || {};
          const label = String(k.label || '').trim();
          const naam = String(p.name || '').trim();
          return Object.assign({ id: String(p.id) }, label ? { label } : {}, naam ? { naam } : {});
        });
      // Niets veranderd? Dan ook niets schrijven — elke overbodige write op een ándere ploeg is een
      // write die fout kan lopen.
      const nu = kern.rbfaTeams || [];
      const zelfde = nu.length === gewenst.length && nu.every((p, i) =>
        p.id === gewenst[i].id && (p.label || '') === (gewenst[i].label || '') && (p.naam || '') === (gewenst[i].naam || ''))
        && (!gewenst.length || String(kern.rbfaClubId || '') === clubNr);
      if (zelfde) continue;
      s.bezigTxt = `"${kern.kernNaam}" bijwerken…`; rbfaCkRender();
      try {
        await rbfaKoppelingWegschrijven(kern, clubNr, gewenst);
        if (gewenst.length) gekoppeld++; else gewist++;
        kern.rbfaTeams = gewenst;
        kern.rbfaClubId = gewenst.length ? clubNr : '';
      } catch (e) {
        misluktBij.push(kern.kernNaam);
      }
    }
  } catch (e) {
    s.bezig = false; s.bezigTxt = '';
    s.fout = (e && e.code === 'PERMISSION_DENIED')
      ? 'Je hebt hier geen toestemming voor. Enkel de clubbeheerder van deze club kan dit — contacteer de clubbeheerder of de maker van de app.'
      : ((e && e.message) || 'Het opslaan is niet gelukt.');
    rbfaCkRender();
    return;
  }
  s.bezig = false; s.bezigTxt = '';

  // Wat er misliep, blijft op het scherm staan; wat lukte, is gebeurd en wordt gemeld. Nooit
  // "gelukt" zeggen over een half gelukte beweging.
  const delen = [];
  if (gemaakt) delen.push(`${gemaakt} ${gemaakt === 1 ? 'ploeg' : 'ploegen'} aangemaakt`);
  // "bijgewerkt" en niet "gekoppeld": in deze telling zitten zowel nieuwe koppelingen als ploegen
  // waar er al één stond en die nu een bondsploeg meer of minder heeft.
  if (gekoppeld) delen.push(`${gekoppeld} koppeling${gekoppeld === 1 ? '' : 'en'} bijgewerkt`);
  if (gewist) delen.push(`${gewist} koppeling${gewist === 1 ? '' : 'en'} gewist`);
  if (misluktBij.length) {
    s.fout = `Niet gelukt bij: ${misluktBij.join(', ')}.${delen.length ? ' De rest is wel gelukt.' : ''} Probeer het opnieuw of kijk je verbinding na.`;
    rbfaCkRender();
    if (delen.length) showToast(delen.join(' · ') + '.', 'ok');
    return;
  }
  rbfaCkSt = null;
  closeModal();
  showToast(delen.length ? delen.join(' · ') + '.' : 'Niets gewijzigd.', 'ok');
  // Het clubscherm opnieuw opbouwen: de nieuwe ploegen horen er meteen bij te staan.
  if (typeof loadClubBeheerView === 'function') loadClubBeheerView();
}
