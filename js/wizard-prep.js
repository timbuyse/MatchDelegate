// ===================== NIEUWE WEDSTRIJD (WIZARD) =====================
let wiz = null;
// Standaard wedstrijdvorm + opstelling van een ploeg (ingesteld bij het aanmaken / in de editor).
// Valt terug op 8v8 / eerste formatie voor ploegen zonder ingestelde voorkeur.
function teamMatchDefaults(team) {
  const mt = (team && MATCH_TYPES[team.defaultMatchType]) ? team.defaultMatchType : '8v8';
  const forms = FORMATIONS[mt] || [];
  let fi = (team && team.defaultFormation) ? forms.findIndex(f => f.name === team.defaultFormation) : 0;
  if (fi < 0) fi = 0;
  return { matchType: mt, formationIndex: fi };
}
function startWizard() {
  const now = new Date();
  const team = getTeamsV2()[0] || null;
  const md = teamMatchDefaults(team);
  wiz = {
    step: 1, teamId: (team || {}).id || '', opponent: '', subteam: '',
    date: now.toISOString().split('T')[0],
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    location: 'Thuis', matchType: md.matchType, periodKey: 'kwarten', quarterDuration: 15,
    competition: 'Competitie', matchday: '', referee: '', jersey: '', venue: '',
    // Standaard staat de eerste trainer en de eerste ploegverantwoordelijke van de ploeg
    // aangevinkt; de rest vink je er per wedstrijd bij.
    trainer: teamTrainerNames(team)[0] || '',
    responsible: teamResponsibleNames(team)[0] || '',
    pool: [], poolTeamId: null, formationIndex: md.formationIndex, selPlace: null,
  };
}
function wizTeamChange() {
  captureStep1();
  const team = teamById(wiz.teamId);
  if (team) {
    wiz.trainer = teamTrainerNames(team)[0] || '';
    wiz.responsible = teamResponsibleNames(team)[0] || '';
    // Standaard wedstrijdvorm + opstelling van de gekozen ploeg klaarzetten (per wedstrijd
    // aanpasbaar) — maar niet als de gebruiker het format in deze wizard al zelf koos
    // (eerst format zetten en dán pas de ploeg kiezen mag die keuze niet stil terugdraaien).
    if (!wiz._typeTouched) {
      const md = teamMatchDefaults(team);
      wiz.matchType = md.matchType;
      wiz.formationIndex = md.formationIndex;
    }
  }
  render();
}
function durOptsHtml(periodKey, currentDur) {
  const fixed = DURATIONS[periodKey] || [15];
  const isCustom = !!currentDur && !fixed.includes(currentDur);
  return fixed.map(v => `<option value="${v}" ${v===currentDur?'selected':''}>${v} min</option>`).join('')
    + `<option value="0" ${isCustom?'selected':''}>Vrij...</option>`;
}
function onDurChange(selId, inpId) {
  const s = document.getElementById(selId), i = document.getElementById(inpId);
  if (s && i) i.style.display = s.value === '0' ? '' : 'none';
}
function readDur(selId, inpId, fallback) {
  const s = document.getElementById(selId); if (!s) return fallback;
  if (s.value === '0') { const i = document.getElementById(inpId); return (i && parseInt(i.value)) || fallback; }
  return parseInt(s.value) || fallback;
}
function onPeriodChange() {
  const pt = document.getElementById('n-pt').value;
  const qd = document.getElementById('n-qd');
  if (!qd) return;
  const def = DUR_DEFAULT[pt];
  qd.innerHTML = durOptsHtml(pt, def);
  const ci = document.getElementById('n-qd-custom'); if (ci) ci.style.display = 'none';
  if (wiz) { wiz.periodKey = pt; wiz.quarterDuration = def; }
}
function fieldSizeW() { return MATCH_TYPES[wiz.matchType].field; }
// Sinds v0.33.0 kiest de selectiestap enkel nog WIE meegaat. Of iemand start volgt uit de
// opstelling: daar betekent sel 'basis' letterlijk "staat op een plaats op het veld" en 'bank'
// "hoort bij de selectie maar staat er niet" (zie placeSlot en finishWizard). De twee waarden
// blijven dus bestaan — ze zijn nu een gevolg in plaats van een keuze.
function isSel(p) { return p.sel === 'basis' || p.sel === 'bank'; }
function selectedCount() { return wiz.pool.filter(isSel).length; }
// Een andere wedstrijdvorm verzet niemand meer: het positierooster is voor élke vorm hetzelfde, dus
// een speler op CAM blijft op CAM staan. Enkel hoeveel spelers er op het veld horen en welke plekken
// een positienummer dragen, verandert mee. De formatiekeuze valt wel terug op de eerste, want de
// formatielijst hoort bij de wedstrijdvorm. Voordien werd hier de hele opstelling gewist.
function wizTypeChange() { wiz.matchType = document.getElementById('n-type').value; wiz.formationIndex = 0; wiz._typeTouched = true; }
function wizSetLoc(loc, btn) { wiz.location = loc; document.querySelectorAll('#n-loc-tgl button').forEach(b => b.classList.remove('act')); btn.classList.add('act'); }

// Aantal delen van de wedstrijd in de wizard: een tornooimatch draagt zijn eigen aantal (numQuarters),
// anders volgt het uit de gekozen periodevorm.
function wizDelen() {
  if (!wiz) return 1;
  return wiz.numQuarters !== undefined ? wiz.numQuarters : PERIOD_TYPES[wiz.periodKey].count;
}
function renderNew() {
  if (!wiz) startWizard();
  if (wiz.trnMode) {
    const t = tournamentById(wiz.tournamentId);
    const trnTitles = { 1: 'Tegenstander', 2: 'Selectie', 3: 'Opstelling' };
    const pills = [1, 2, 3].map(n => `<div class="step-pill ${wiz.step===n?'on':wiz.step>n?'done':''}"></div>`).join('');
    const body = wiz.step === 1 ? renderTrnMatchStep1() : wiz.step === 2 ? wizStep2() : wizStep3();
    return `<div class="hdr"><button class="back" onclick="wizBack()">‹</button><h1>Tornooimatch${t?' · '+esc(t.name):''} · ${trnTitles[wiz.step]}</h1></div>
      <div class="steps">${pills}</div>
      <div class="content">${body}</div>`;
  }
  // Bij meer dan één deel heet stap 3 "Startopstelling": ze gaat enkel over de aftrap, de volgende
  // delen komen daarna. Dat stond nergens, en de titel is de goedkoopste plek om het te zeggen.
  const titles = { 1: 'Wedstrijd', 2: 'Selectie', 3: wizDelen() > 1 ? 'Startopstelling' : 'Opstelling' };
  const pills = [1, 2, 3].map(n => `<div class="step-pill ${wiz.step===n?'on':wiz.step>n?'done':''}"></div>`).join('');
  const body = wiz.step === 1 ? wizStep1() : wiz.step === 2 ? wizStep2() : wizStep3();
  // "Nieuwe wedstrijd" klopte niet wanneer je een bestaande aan het bewerken bent — en dat is net
  // het geval waarin je je afvraagt waar dit scherm je naartoe brengt.
  const kop = wiz.editId ? 'Wedstrijd bewerken' : 'Nieuwe wedstrijd';
  return `<div class="hdr"><button class="back" onclick="wizBack()">‹</button><h1>${kop} · ${titles[wiz.step]}</h1></div>
    <div class="steps">${pills}</div>
    <div class="content">${body}</div>`;
}
function wizStep1() {
  const teams = getTeamsV2();
  const teamSel = teams.length
    ? `<select id="n-team-sel" onchange="wizTeamChange()">${teams.map(t => `<option value="${t.id}" ${wiz.teamId===t.id?'selected':''}>${esc(t.name)} (${t.players.length})</option>`).join('')}</select>`
    : !rosterReady()
      ? `<div style="font-size:14px;color:var(--txt2);padding:6px 0">Spelers laden…</div>`
      : `<div style="font-size:14px;color:var(--txt2);padding:6px 0">Nog geen ploegen. <a onclick="go('teams')" style="color:var(--grn);font-weight:700;cursor:pointer">Maak eerst een ploeg aan →</a></div>`;
  const selectedTeam = teamById(wiz.teamId) || (teams.length ? teams[0] : null);
  const isCustomDur = wiz.quarterDuration && !(DURATIONS[wiz.periodKey] || []).includes(wiz.quarterDuration);
  return `
    <div class="card">
      <div class="fg"><label>Eigen ploeg</label>${teamSel}</div>
      <div class="fg"><label>Ploeg-label (optioneel)</label><input id="n-subteam" type="text" value="${esc(wiz.subteam||'')}" placeholder="bv. A of B — enkel invullen als je ploeg in meerdere delen speelt" autocomplete="off"></div>
      <div class="fg"><label>Tegenstander</label><input id="n-opp" type="text" placeholder="Naam ploeg..." autocomplete="off" value="${esc(wiz.opponent)}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="fg"><label>Datum</label><input id="n-date" type="date" value="${wiz.date}"></div>
        <div class="fg"><label>Startuur</label><input id="n-time" type="time" value="${wiz.time}"></div>
      </div>
      <div class="fg"><label>Thuis of uit?</label>
        <div class="tgl" id="n-loc-tgl">
          <button type="button" class="${wiz.location==='Thuis'?'act':''}" onclick="wizSetLoc('Thuis',this)">${icI(IC.home)} Thuismatch</button>
          <button type="button" class="${wiz.location==='Uit'?'act':''}" onclick="wizSetLoc('Uit',this)">${icI(IC.plane)} Uitmatch</button>
        </div></div>
      <div class="fg"><label>Format</label>
        <select id="n-type" onchange="wizTypeChange()">
          ${['3v3','5v5','8v8','11v11'].map(t => `<option value="${t}" ${wiz.matchType===t?'selected':''}>${t.replace('v',' tegen ')}</option>`).join('')}
        </select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="fg"><label>Aantal blokken</label>
          <select id="n-pt" onchange="onPeriodChange()">${['helften','delen','kwarten'].map(k => `<option value="${k}" ${wiz.periodKey===k?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
        <div class="fg"><label>Duur van een blok</label>
          <select id="n-qd" onchange="onDurChange('n-qd','n-qd-custom')">${durOptsHtml(wiz.periodKey, wiz.quarterDuration)}</select>
          <input id="n-qd-custom" type="number" min="1" max="99" placeholder="min." style="margin-top:6px;${isCustomDur?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;color:var(--txt);background:var(--card);-webkit-appearance:none" value="${isCustomDur?wiz.quarterDuration:''}"></div>
      </div>
      <details class="more-details">
        <summary>+ Meer details (optioneel)</summary>
        <div class="fg" style="margin-top:12px"><label>Soort</label>
          ${(()=>{ const std=['Competitie','Vriendschappelijk','Beker']; const cur=wiz.competition||''; const isCustom=cur&&!std.includes(cur);
            return `<select id="n-comp" onchange="document.getElementById('n-comp-custom').style.display=this.value==='__other__'?'':'none'">${std.map(c=>`<option ${cur===c?'selected':''}>${c}</option>`).join('')}<option value="__other__" ${isCustom?'selected':''}>Andere…</option></select>
            <input id="n-comp-custom" type="text" placeholder="Eigen soort" value="${esc(isCustom?cur:'')}" style="margin-top:6px;${isCustom?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;background:var(--card)">`;
          })()}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="fg"><label>Speeldag</label><input id="n-md" type="text" value="${esc(wiz.matchday)}" placeholder="bv. 5"></div>
          <div class="fg"><label>Truikleur</label><input id="n-jersey" type="text" value="${esc(wiz.jersey)}" placeholder="bv. zwart-groen"></div>
        </div>
        <div class="fg"><label>Scheidsrechter</label><input id="n-ref" type="text" value="${esc(wiz.referee)}" placeholder="Naam"></div>
        <div class="fg"><label>Locatie</label><input id="n-venue" type="text" value="${esc(wiz.venue)}" placeholder="bv. sportveld, kunstgras B2"></div>
        ${staffPickerHtml('n', 'trn', teamTrainerNames(selectedTeam), wiz.trainer)}
        ${staffPickerHtml('n', 'resp', teamResponsibleNames(selectedTeam), wiz.responsible)}
      </details>
    </div>
    ${/* Bij "Bewerken" op een bestaande wedstrijd is dit scherm precies één ding: de wedstrijdinfo.
         De hele wizard opnieuw doorlopen hoeft dan niet — de selectie zit achter de knop
         'Selectie' en de opstelling achter het potlood in de planning. Enkel een NIEUWE wedstrijd
         loopt hier door naar de volgende stap. */ ''}
    ${wiz.editId
      ? `<button class="btn btn-green" onclick="finishStep1Only()">${icI(IC.check)} Opslaan</button>`
      : `<button class="btn btn-green" onclick="wizNext()">Volgende → Selectie</button>
    <button class="btn btn-orgpale" onclick="finishStep1Only()" style="margin-top:8px">${icI(IC.calendar)} Plannen zonder selectie</button>`}`;
}
function captureStep1() {
  const v = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const ts = document.getElementById('n-team-sel'); if (ts) wiz.teamId = ts.value;
  wiz.opponent = (v('n-opp') || '').trim();
  wiz.subteam = (v('n-subteam') || '').trim();
  wiz.date = v('n-date'); wiz.time = v('n-time');
  wiz.matchType = v('n-type') || wiz.matchType;
  wiz.periodKey = v('n-pt') || wiz.periodKey; wiz.quarterDuration = readDur('n-qd', 'n-qd-custom', wiz.quarterDuration);
  // numQuarters volgt de selector. Deze wizard kent geen "1 blok"-optie, maar finishWizard laat
  // wiz.numQuarters wél voorgaan op periodKey: "Gebruik als template" op een tornooiwedstrijd van
  // één blok toonde daardoor "3 delen" en sloeg 1 deel op.
  if (document.getElementById('n-pt') && PERIOD_TYPES[wiz.periodKey]) wiz.numQuarters = PERIOD_TYPES[wiz.periodKey].count;
  const nComp = v('n-comp'); wiz.competition = nComp === '__other__' ? (v('n-comp-custom') || '').trim() : nComp; wiz.matchday = (v('n-md') || '').trim(); wiz.referee = (v('n-ref') || '').trim();
  wiz.jersey = (v('n-jersey') || '').trim(); wiz.venue = (v('n-venue') || '').trim();
  wiz.trainer = readStaffPicker('n', 'trn', wiz.trainer);
  wiz.responsible = readStaffPicker('n', 'resp', wiz.responsible);
}
function buildPool() {
  const team = teamById(wiz.teamId);
  // Gebruikt de ploeg geen vaste rugnummers, dan starten de nummervelden leeg. Je kan er per
  // wedstrijd nog altijd één invullen (bv. geleende truitjes), maar het rooster dringt niets op.
  const numsAan = teamUsesNumbers(team);
  const own = (team ? team.players : []).map(p => ({ pid: uid(), srcId: p.id, srcGlobalId: p.globalId || null, name: p.name, number: numsAan ? (p.number || '') : '', pos: p.pos || '', side: p.side || '', fromName: team.name, guest: false, sel: 'none', slot: null }));
  // Een gast die intussen tot de (nieuw gekozen) eigen ploeg behoort, niet dubbel opnemen.
  const ownIds = new Set(own.map(p => p.srcId));
  const guests = wiz.pool.filter(p => p.guest && !ownIds.has(p.srcId));
  wiz.pool = own.concat(guests);
}
// Eén stap terug — maar niet vóórbij de stap waarop deze wizard begon. Kom je via "Selectie" op een
// bestaande wedstrijd binnen, dan start je op stap 2; terug hoort dan naar de wedstrijd te gaan, niet
// naar een stap 1 (de wedstrijdgegevens) die je nooit geopend hebt en die daarna ook nog vroeg of je
// de wedstrijd wel wou bewaren.
function wizBack() {
  if (!wiz) { go('home'); return; }   // scherm nog zichtbaar terwijl de wizard al afgesloten is
  const van = wiz.vanStap || 1;
  if (wiz.step > van) { wiz.step--; render(); return; }
  wizVerlaat();
}
// Een momentopname van alles wat je in de wizard kan wijzigen. Zo weten we bij het verlaten of er
// écht iets te verliezen valt: bij een bestaande wedstrijd is "er staat een selectie" geen bewijs
// van een wijziging, dus zonder deze vergelijking kreeg je de vraag altijd.
function wizSnapshot(w) {
  if (!w) return '';
  return JSON.stringify([
    (w.pool || []).map(p => [p.pid, p.sel || '', p.slot === null || p.slot === undefined ? -1 : p.slot, (p.number || '').toString(), p.absentReason || '']),
    w.captainPid || '', w.formationIndex, w.matchType || '', w.opponent || '',
  ]);
}
function wizDirty() { return wiz && wiz.snap !== undefined && wizSnapshot(wiz) !== wiz.snap; }
// Terug naar waar je vandaan kwam. Bij een bestaande wedstrijd is dat het scherm van die wedstrijd
// (prep of live); een nieuwe wedstrijd valt terug op wizLeave, dat naar het startscherm of de
// tornooipagina gaat en daar zijn eigen vraag stelt.
function wizVerlaat() {
  if (!wiz || !wiz.editId) { wizLeave(); return; }
  const naar = wiz.vanView === 'live' ? 'live' : 'prep';
  const id = wiz.editId;
  if (!wizDirty()) { wiz = null; go(naar, id); return; }
  openModal(`<h3>${icI(IC.warn)} Wijzigingen niet bewaren?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Je paste iets aan zonder op te slaan. Teruggaan laat die wijzigingen vallen; de wedstrijd zelf blijft zoals ze was.</p>
    <button class="btn btn-red" onclick="closeModal();wiz=null;go('${naar}','${id}')">${icI(IC.trash)} Terug zonder bewaren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Blijven</button>`);
}
// Dient beide wedstrijdwizards: de gewone (terug naar het startscherm) en die van een tornooimatch
// (terug naar de tornooipagina). Die laatste gooide de wizard weg zonder iets te vragen, terwijl
// hier al een dirty-guard stond. De tegenstander wordt uit het veld zelf gelezen: op stap 1 zit hij
// nog niet in wiz (captureStep1 loopt pas bij "Volgende").
function wizLeave() {
  const oppEl = document.getElementById('n-opp');
  const opp = oppEl ? oppEl.value : ((wiz && wiz.opponent) || '');
  const naar = (wiz && wiz.trnMode) ? 'tournament' : 'home';
  const dirty = wiz && ((opp || '').trim() || (wiz.pool || []).some(p => p.sel && p.sel !== 'none'));
  if (dirty) {
    openModal(`<h3>Wedstrijd niet bewaren?</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Je ingevulde gegevens gaan verloren.</p>
      <button class="btn btn-red" onclick="closeModal();wiz=null;go('${naar}')">Verlaten zonder bewaren</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Blijven</button>`);
  } else { wiz = null; go(naar); }
}
function wizNext() {
  if (wiz.step === 1) {
    captureStep1();
    if (!wiz.teamId) { showToast('Kies of maak eerst een ploeg aan.', 'err'); return; }
    if (!wiz.opponent) { showToast('Vul de tegenstander in.', 'err'); return; }
    if (wiz.poolTeamId !== wiz.teamId) { buildPool(); wiz.poolTeamId = wiz.teamId; }
    wiz.step = 2; render();
  } else if (wiz.step === 2) {
    // Deze stap zegt enkel WIE meegaat, dus er is maar één harde eis: er moet iemand meegaan. Een
    // bovengrens bestaat niet meer (je mag een ruime kern meenemen), en minder spelers dan het veld
    // groot is wordt gewaarschuwd in wizStep2, niet geblokkeerd — met zeven voor 8v8 speel je met
    // zeven. Hoeveel er op het veld horen, eist de opstellingsstap zelf (zie finishWizard).
    if (selectedCount() === 0) { showToast('Duid minstens één speler aan die meegaat.', 'err'); return; }
    wiz.step = 3; render();
  }
}
// ----- Stap 2: selectie -----
function setSel(pid, val) {
  // In tornooimodus bestaat NB niet per wedstrijd (dat gaf je in bij de tornooiselectie).
  if (val === 'absent' && wiz.trnMode) return;
  const p = wiz.pool.find(x => x.pid === pid); if (!p) return;
  // Geen aparte NG-knop (die maakte de rij te breed op een smartphone): niet-geselecteerd is de
  // standaard, en een tweede tik op de actieve knop zet de speler daar weer op terug.
  // 'mee' = in de selectie. Wie meegaat begint op de bank; op het veld komen gebeurt in de
  // opstellingsstap. Daarom mag een tweede tik op 'Mee' ook iemand die al op het veld staat
  // ('basis') uit de selectie halen — vandaar isSel() en niet een test op één waarde.
  if (val === 'mee') p.sel = isSel(p) ? 'none' : 'bank';
  else p.sel = (p.sel === val) ? 'none' : val;
  if (p.sel !== 'basis') p.slot = null;
  if (p.sel !== 'absent') p.absentReason = '';
  render();
}
function setPoolNum(pid, val) { const p = wiz.pool.find(x => x.pid === pid); if (p) p.number = val; }
function setAbsentReason(pid, val) { const p = wiz.pool.find(x => x.pid === pid); if (p) { p.absentReason = val; render(); } }
// Optioneel redenmenu bij NB. 'Speelt elders' is de enige keuze die de statistieken beïnvloedt
// (die wedstrijd telt dan niet als gemist), de andere zijn informatie voor het verslag.
function absentReasonSelect(pid, cur, onchange) {
  return `<select class="abs-reason" onchange="${onchange}('${pid}',this.value)" aria-label="Reden niet beschikbaar">
    <option value="" ${!cur?'selected':''}>reden (optioneel)</option>
    ${ABSENT_REASONS.map(r => `<option value="${r.key}" ${cur===r.key?'selected':''}>${r.label}</option>`).join('')}
  </select>`;
}
function selRow(p) {
  const isCap = wiz.captainPid === p.pid;
  const isSelected = isSel(p);
  // Tornooiwedstrijd: enkel 'Mee'. Beschikbaarheid (NB) hoort bij de tornooiselectie —
  // wie NB is, gaat niet mee en staat hier dus ook niet in de lijst.
  const trn = !!wiz.trnMode;
  return `<div class="selrow">
    <input type="number" class="pn-inp" value="${esc(p.number)}" placeholder="" onchange="setPoolNum('${p.pid}',this.value)" inputmode="numeric" aria-label="Rugnummer">
    ${isSelected ? `<button class="cap-btn ${isCap?'on':''}" onclick="setWizCaptain('${p.pid}')" title="Kapitein aanduiden">${icI(IC.captain)}</button>` : '<span style="width:22px;flex-shrink:0"></span>'}
    <div class="nm">${esc(p.name)}${p.guest ? '<span class="guest-badge">gast</span>' : ''}<small>${posDisplay(p) || '—'}</small>
      ${(!trn && p.sel === 'absent') ? absentReasonSelect(p.pid, p.absentReason || '', 'setAbsentReason') : ''}</div>
    <div class="seg">
      <button class="${isSelected?'basis':''}" onclick="setSel('${p.pid}','mee')" title="Neemt deel aan deze wedstrijd — wie start bepaal je bij de opstelling">Mee</button>
      ${trn ? '' : `<button class="${p.sel==='absent'?'absent':''}" onclick="setSel('${p.pid}','absent')" title="Niet beschikbaar — telt mee in het aanwezigheids-%">NB</button>`}
    </div></div>`;
}
function setWizCaptain(pid) { wiz.captainPid = (wiz.captainPid === pid) ? null : pid; render(); }
function wizStep2() {
  const own = wiz.pool.filter(p => !p.guest), guests = wiz.pool.filter(p => p.guest);
  const team = teamById(wiz.teamId);
  const need = fieldSizeW(), sc = selectedCount();
  const absentCount = wiz.pool.filter(p => p.sel === 'absent').length;
  return `
    <div class="card" style="display:flex;gap:10px;text-align:center">
      ${/* Enkel het aantal, geen "10/8". Die noemer deed alleen iets op de grens en las erboven als
           een fout ("10 van de 8"?), terwijl de veldgrootte hier geen bovengrens is: je mag een ruime
           kern meenemen. Te weinig spelers zegt de waarschuwing hieronder, en de kleur volgt mee. */ ''}
      <div style="flex:1"><div style="font-size:22px;font-weight:900;color:${sc>=need?'var(--grn)':'var(--org)'}">${sc}</div><div style="font-size:11px;color:var(--txt2)">GESELECTEERD</div></div>
      ${absentCount ? `<div style="flex:1"><div style="font-size:22px;font-weight:900;color:var(--rd)">${absentCount}</div><div style="font-size:11px;color:var(--txt2)">NIET BESCH.</div></div>` : ''}
    </div>
    ${/* Minder spelers dan het veld groot is mag: met zeven voor 8v8 speel je met zeven, en dat is
         een echte situatie (zie ook finishWizard, dat de ondergrens op min(plaatsen, selectie) legt).
         Daarom een waarschuwing en geen blokkade — ze staat hier, waar je er nog iets aan kan doen. */ ''}
    ${(sc > 0 && sc < need) ? `<div class="backup-banner" style="background:var(--ornp);color:var(--orn2);border-color:var(--orn)">${icI(IC.warn)} Je hebt ${sc} ${sc === 1 ? 'speler' : 'spelers'} geselecteerd voor ${esc(wiz.matchType)} — dan begin je met ${need - sc} ${need - sc === 1 ? 'speler' : 'spelers'} minder op het veld.</div>` : ''}
    ${(() => { const nums = wiz.pool.filter(p => (p.sel === 'basis' || p.sel === 'bank') && (p.number || '').toString().trim()).map(p => p.number.toString().trim()); const dup = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))]; return dup.length ? `<div class="backup-banner" style="background:var(--rdp);color:var(--rd);border-color:#fca5a5">${icI(IC.warn)} Dubbel rugnummer bij geselecteerde spelers: ${dup.map(esc).join(', ')}</div>` : ''; })()}
    ${/* Eén regel die zegt wat je hier moet doen; de rest onder een uitklapper. Dat blok stond
         voordien volledig open en besloeg een halve telefoonhoogte vóór je de eerste speler zag.
         Zelfde patroon (.more-details + "Hoe werkt dit?") als in de planner, zie modalPlannedLineups. */ ''}
    <div style="font-size:12px;color:var(--txt2);padding:6px 2px 0"><b>Duid aan wie je meeneemt.</b> Niets aanduiden = niet geselecteerd.</div>
    <details class="more-details" style="margin:0 2px 4px">
      <summary>Hoe werkt dit?</summary>
      <div style="font-size:12px;color:var(--txt2);margin-top:8px;line-height:1.5">
        <p style="margin-bottom:8px">Deze stap gaat enkel over <b>wie meegaat</b>. Wie start en wie op de bank begint, bepaal je bij de <b>opstelling</b>: alle geselecteerde spelers die je niet op het veld zet, staan automatisch op de bank.</p>
        <p style="margin-bottom:8px">Een speler die je <b>niet</b> aanduidt, is niet geselecteerd en telt nergens mee. Nog eens op dezelfde knop tikken maakt je keuze ongedaan.</p>
        <p style="margin-bottom:8px">${wiz.trnMode
          ? `Enkel wie meegaat naar het tornooi staat in deze lijst — <b>niet beschikbaar (NB)</b> geef je in bij de selectie van het tornooi zelf.`
          : `<b style="color:var(--rd)">NB</b> = niet beschikbaar, en dat telt mee in het aanwezigheidspercentage. Je kan er een reden bij kiezen; bij <b>speelt elders</b> telt die wedstrijd niet als gemist.`}</p>
        <p style="margin:0">Bij geselecteerde spelers verschijnt een <b>kapiteinsicoontje</b> — tik erop om de kapitein aan te duiden.</p>
      </div>
    </details>
    <div class="sec">${esc(team ? team.name : 'Ploeg')}</div>
    <div class="card">${own.length ? selRowHead('Speler · voorkeurspositie', true) + own.map(selRow).join('') : `<p style="color:var(--txt2);font-size:14px">${rosterEmptyText('Deze ploeg heeft nog geen spelers. Voeg ze toe via ' + icI(IC.players) + ' Ploegen.')}</p>`}</div>
    ${guests.length ? `<div class="sec">Gastspelers</div><div class="card">${selRowHead('Speler · van welke ploeg', true)}${guests.map(selRow).join('')}</div>` : ''}
    ${wiz.noGuests ? '' : `<div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-orgpale" onclick="addGuestsModal()">+ Speler van andere ploeg</button>
      <button class="btn btn-pale" onclick="addLoosePlayerModal()">+ Losse speler</button>
    </div>`}
    ${/* Twee uitwegen, en welke er past hangt af van wat er al ligt. Heeft de wedstrijd nog GEEN
         opstelling, dan kan je de selectie hier gewoon opslaan en de opstelling later maken — dat
         is de normale gang van zaken wanneer je de ploeg 's avonds al kent maar nog niet weet wie
         waar begint. Ligt er wél al een opstelling, dan blijven de bestaande plaatsen staan en komt
         wie je nu toevoegt gewoon op de bank — plaatsen doe je bij de opstelling. */ ''}
    ${(() => {
      const alOpstelling = wiz.pool.some(p => p.sel === 'basis' && p.slot != null);
      const opslaan = `<button class="btn btn-pale" style="margin-top:8px" onclick="saveSelectionOnly()">${icI(IC.check)} ${alOpstelling ? 'Selectie opslaan' : 'Opslaan zonder opstelling'}</button>`;
      const verder = `<button class="btn btn-green" onclick="wizNext()">${icI(IC.shirt)} ${wiz.editId ? 'Opstelling ingeven →' : 'Volgende → Opstelling'}</button>`;
      return wiz.editId
        ? `${verder}${opslaan}`
        : `<div class="wiz-nav"><button class="btn btn-gray" onclick="wizBack()">← Vorige</button>${verder}</div>${opslaan}`;
    })()}`;
}
// "Opslaan" op de selectiestap: dezelfde controle als wizNext, maar zonder de omweg langs de
// opstelling. Lag er al een opstelling, dan blijft die staan en komt wie je toevoegde op de bank —
// een speler bijzetten hoeft dus niemand van zijn plaats te halen. Lag er nog geen opstelling, dan
// slaan we bewust ZONDER op: niemand krijgt een plaats en de wedstrijd draagt `lineupPending` tot je
// de opstelling maakt. Hier stond ook placeUnplaced(), dat een basisspeler zonder plaats automatisch
// een plek gaf; die toestand kan sinds v0.33.0 niet meer bestaan (op het veld staan ÍS een plaats
// hebben), dus die functie is weg.
function saveSelectionOnly() {
  if (selectedCount() === 0) { showToast('Duid minstens één speler aan die meegaat.', 'err'); return; }
  const alOpstelling = wiz.pool.some(p => p.sel === 'basis' && p.slot != null);
  if (!alOpstelling) { finishWizard(false, true); return; }
  // Blijft het veld half leeg — omdat je iemand uit de selectie haalde die op het veld stond, of
  // omdat er nu een speler bij is voor een plaats die nog vrij was — dan is dat niet in dit scherm
  // op te lossen (je ziet er geen veld). Dan sturen we door naar de opstelling in plaats van te
  // weigeren met een melding die nergens naartoe leidt.
  const plaatsen = (FORMATIONS[wiz.matchType][wiz.formationIndex] || {}).slots.length;
  const nodig = Math.min(plaatsen, selectedCount());
  const geplaatst = wiz.pool.filter(p => p.sel === 'basis' && p.slot != null).length;
  if (geplaatst < nodig) {
    showConfirm(`Er ${geplaatst === 1 ? 'staat' : 'staan'} maar <b>${geplaatst} van de ${nodig}</b> spelers op het veld. Vul de opstelling aan — daar haal je er spelers bij van de bank.`,
      () => { wiz.step = 3; render(); }, 'Naar de opstelling', 'btn-green');
    return;
  }
  finishWizard(false);
}
// ----- Gastspelers -----
// Deze picker dient twee wizards: de wedstrijdwizard (wiz — een gast belandt op de bank) en de
// tornooi-selectiewizard (trnWiz — een gast gaat mee naar het tornooi, dus sel 'mee'). Eén
// implementatie met de actieve wizard als context. Bepaald door het SCHERM en niet door
// truthiness: wiz kan na een eerdere wizard nog blijven hangen.
function guestCtx() {
  if (view === 'tournamentNew' && trnWiz) return { pool: trnWiz.pool, teamId: trnWiz.teamId, sel: 'mee' };
  return { pool: wiz.pool, teamId: wiz.teamId, sel: 'bank' };
}
let guestModalTeam = null, guestPick = [], guestTeamsCache = [];
async function addGuestsModal() {
  guestTeamsCache = [];
  const ctx = guestCtx();
  let teams = getTeamsV2().filter(t => t.id !== ctx.teamId);
  if (!teams.length && cloudReady && fbdb) {
    const otherIds = Object.keys(userTeams).filter(id => id !== ctx.teamId);
    if (otherIds.length) {
      openModal(`<h3>Gastspelers toevoegen</h3><p style="text-align:center;color:var(--txt2);margin:16px 0">Ploegen laden…</p>`);
      const fetched = [];
      await Promise.all(otherIds.map(async id => {
        try {
          const s = await fbOnce(fbdb.ref('teams/' + id + '/roster'));
          const raw = s.val();
          if (!raw) return;
          const arr = Array.isArray(raw) ? raw : Object.values(raw);
          const t = arr.find(x => x && x.id === id) || arr.find(x => x && x.players && x.players.length);
          if (t) fetched.push(Object.assign({}, t, { id, fromCloud: true, players: Array.isArray(t.players) ? t.players : [] }));
        } catch (e) {}
      }));
      if (fetched.length) {
        guestTeamsCache = fetched;
        teams = [...getTeamsV2().filter(t => t.id !== ctx.teamId), ...fetched.filter(t => !getTeamsV2().some(x => x.id === t.id))];
      }
    }
  }
  if (!teams.length) { showToast('Er zijn geen andere ploegen om uit te kiezen.', 'err'); closeModal(); return; }
  guestModalTeam = teams[0].id; guestPick = [];
  openModal(`<h3>Gastspelers toevoegen</h3>
    <div class="fg"><label>Ploeg</label><select onchange="guestModalTeam=this.value;guestPick=[];document.getElementById('guest-list').innerHTML=guestListHtml()">${teams.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>
    <div id="guest-list">${guestListHtml()}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="confirmGuests()">${icI(IC.check)}Toevoegen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function guestTeamById(id) { return teamById(id) || guestTeamsCache.find(t => t.id === id) || null; }
function guestListHtml() {
  const t = guestTeamById(guestModalTeam); if (!t) return '';
  const existing = guestCtx().pool.map(p => p.srcId);
  if (!t.players.length) return '<p style="color:var(--txt2);font-size:14px">Deze ploeg heeft geen spelers.</p>';
  return t.players.map(p => { const already = existing.includes(p.id);
    return `<div class="selrow">${numDot(p, 'pn')}<div class="nm">${esc(p.name)}${already ? '<small>al in selectie</small>' : ''}</div>
      <input type="checkbox" ${already ? 'disabled' : ''} onchange="toggleGuest('${p.id}')" style="width:22px;height:22px"></div>`; }).join('');
}
function toggleGuest(srcId) { const i = guestPick.indexOf(srcId); if (i >= 0) guestPick.splice(i, 1); else guestPick.push(srcId); }
function confirmGuests() {
  const t = guestTeamById(guestModalTeam);
  const ctx = guestCtx();
  guestPick.forEach(srcId => { const p = t.players.find(x => x.id === srcId); if (p && !ctx.pool.some(pp => pp.srcId === srcId)) ctx.pool.push({ pid: uid(), srcId: p.id, srcGlobalId: p.globalId || null, name: p.name, number: p.number || '', pos: p.pos || '', side: p.side || '', fromName: t.name, guest: true, sel: ctx.sel, slot: null }); });
  guestPick = []; closeModal(); render();
}
function addLoosePlayerModal() {
  openModal(`<h3>Losse speler toevoegen</h3>
    <div class="fg"><label>Voornaam</label><input id="lp-first" type="text" placeholder="Voornaam" autocomplete="off"></div>
    <div class="fg"><label>Naam</label><input id="lp-last" type="text" placeholder="Naam" autocomplete="off"></div>
    <button class="btn btn-green" style="margin-top:4px" onclick="confirmLoosePlayer()">${icI(IC.check)} Toevoegen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
  setTimeout(() => document.getElementById('lp-first')?.focus(), 50);
}
function confirmLoosePlayer() {
  const first = (document.getElementById('lp-first')?.value || '').trim();
  const last = (document.getElementById('lp-last')?.value || '').trim();
  if (!first && !last) { showToast('Geef minstens een naam in.', 'err'); return; }
  const name = [first, last].filter(Boolean).join(' ');
  const id = uid();
  const ctx = guestCtx();
  ctx.pool.push({ pid: id, srcId: id, name, number: '', pos: '', fromName: 'Losse speler', guest: true, sel: ctx.sel, slot: null });
  closeModal(); render();
}
// ----- Stap 3: opstelling -----
// Sinds v0.34.0 staan spelers op een PLEK VAN HET ROOSTER (een code als 'CAM'), niet meer op een slot
// van de gekozen formatie. Een andere formatie verzet dus niemand meer: ze licht alleen andere plekken
// op als voorstel. Daarmee vervalt ook de waarschuwing die hier stond ("de plaatsen veranderen, je
// stelt iedereen opnieuw op") en het wissen van de opstellingen voor de volgende delen — die staan op
// roosterplekken en blijven gewoon kloppen.
function setFormation(idx) {
  const nieuw = parseInt(idx);
  if (nieuw === wiz.formationIndex) return;
  wiz.formationIndex = nieuw;
  wiz.selPlace = null;
  render();
}
function selectPlace(pid) { wiz.selPlace = (wiz.selPlace === pid) ? null : pid; render(); }
// `code` is een plek van het positierooster ('CAM', 'LCV', 'K' …) en niet langer de index van een
// formatieslot. De logica eronder is ongewijzigd: dezelfde plek nog eens aantikken haalt de speler van
// het veld, en een bankspeler op een bezette plek RUILT met wie daar staat.
function placeSlot(code) {
  // Enkel een echte roosterplek. Zonder deze controle kon `slot` een waarde krijgen die nergens op
  // het veld bestaat (bv. nog een oude slot-index): de speler gold dan als geplaatst — de teller
  // ging omhoog — maar werd nergens getekend.
  if (!gridPlek(code)) return;
  const i = code;
  const occupied = wiz.pool.find(p => p.sel === 'basis' && p.slot === i);
  if (wiz.selPlace) {
    const sp = wiz.pool.find(p => p.pid === wiz.selPlace);
    if (sp) {
      if (occupied === sp) {
        // Zelfde positie opnieuw aangetikt → speler van het veld halen
        sp.slot = null;
      } else {
        // Bezette positie. Twee gevallen:
        //  - de geselecteerde speler stond al op het veld → de twee ruilen van plek;
        //  - hij kwam van de bank → dan RUILEN ze van rol: hij gaat het veld op, de speler die daar
        //    stond gaat naar de bank. Zo blijft het veld altijd even vol en hoeft er niemand als
        //    basisspeler zonder plaats achter te blijven.
        const vanBank = sp.sel === 'bank';
        const prevSlot = sp.slot;
        if (occupied) {
          if (vanBank) { occupied.sel = 'bank'; occupied.slot = null; }
          else occupied.slot = (prevSlot != null) ? prevSlot : null;
        }
        sp.slot = i;
        if (vanBank) sp.sel = 'basis';
      }
      wiz.selPlace = null;
    }
  } else if (occupied) {
    // Speler op het veld aantikken → selecteren om te verplaatsen of te wisselen
    wiz.selPlace = occupied.pid;
  }
  render();
}
// Auto-plaats stond hier: die vulde het veld op met de spelers die je in de selectie als "Basis"
// had aangeduid. Sinds v0.33.0 zegt de selectie enkel nog wie meegaat, dus die knop zou uit een
// ruimere kern zelf een basiself moeten kiezen — de app zou dan met één tik beslissen wie start.
// Bewust weggelaten (Tims keuze): het veld begint leeg en je tikt de spelers er zelf op.
// Het veld leegmaken: iedereen terug naar de bank. Ook `sel` mee terugzetten, anders blijft er een
// 'basis'-speler zonder plaats achter — precies de toestand die sinds v0.33.0 niet meer hoort te
// bestaan, en die de speler in geen van beide lijsten van stap 3 zou doen opduiken.
function clearPlacement() {
  wiz.pool.forEach(p => { if (p.sel === 'basis') p.sel = 'bank'; p.slot = null; });
  wiz.selPlace = null; render();
}
// Welke roosterplekken de gekozen formatie voorstelt. Twee regels, in deze volgorde:
//  1. binnen de eigen lijn, en met VOORRANG voor de plekken die een positienummer dragen — dat zijn
//     net de plaatsen die een trainer bedoelt ("de 5, de 3, de 2");
//  2. van die kandidaten de plek die geometrisch het dichtst bij het formatieslot ligt.
// Enkel op x sorteren werkte niet: CAM en CVM liggen beide op x=50 (rij 2 en rij 4), waardoor de
// rechtse middenvelder van een dubbele ruit op CVM belandde in plaats van op RM. En enkel op afstand
// kijken werkte ook niet: de verdedigers van die ruit staan op y 65-77 en vielen dan op LCV/RCV,
// plekken zonder nummer.
// De plekken die een formatie voorstelt = de plekken uit haar nummertabel (FORMATIE_NUMMERS in
// core.js). Die tabel is de enige bron: welke plekken bij welke opstelling horen én welk nummer ze
// daar dragen. Staat een formatie er niet in, dan valt het terug op de afleiding hieronder — een
// vangnet voor een formatie die ooit bijkomt zonder dat de tabel meegroeit.
function formatieVoorstel(form, matchType) {
  const vast = formatieNummers(matchType, form && form.name);
  if (vast) return new Set(Object.keys(vast).filter(c => gridPlek(c)));
  const uit = new Set();
  const perLijn = {};
  ((form && form.slots) || []).forEach(s => { (perLijn[s.line] = perLijn[s.line] || []).push(s); });
  for (const lijn of Object.keys(perLijn)) {
    const plekken = POS_GRID.filter(p => p.line === lijn);
    const genummerd = plekken.filter(p => gridNummer(p.code, matchType, form && form.name));
    const rest = plekken.filter(p => !gridNummer(p.code, matchType, form && form.name));
    const gebruikt = new Set();
    const dichtste = (s, lijst) => {
      let best = null, bestD = Infinity;
      for (const p of lijst) {
        if (gebruikt.has(p.code)) continue;
        const d = (p.x - s.x) * (p.x - s.x) + (p.y - s.y) * (p.y - s.y);
        if (d < bestD) { bestD = d; best = p; }
      }
      return best ? { plek: best, d: Math.sqrt(bestD) } : null;
    };
    for (const s of perLijn[lijn]) {
      // Een genummerde plek krijgt voorrang, maar geen absolute: enkel als ze niet veel verder ligt
      // (tot 1,4× de kortste afstand). Met absolute voorrang belandde een centrale spits van 5v5 op
      // LW — een genummerde plek aan de zijlijn — terwijl CA er pal op lag.
      const g = dichtste(s, genummerd), r = dichtste(s, rest);
      let keuze = null;
      if (g && (!r || g.d <= r.d * 1.4)) keuze = g.plek;
      else if (r) keuze = r.plek;
      if (keuze) { gebruikt.add(keuze.code); uit.add(keuze.code); }
    }
  }
  return uit;
}
function wizPitch(form) {
  // Zelfde veldnaam als op het live-veld en in het wedstrijddetail: enkel de achternaam, met een
  // initiaal erbij als twee spelers in de basis dezelfde achternaam hebben. De volledige naam paste
  // niet in het label (lange familienamen werden afgekapt tot "Franciszek Dabrow…").
  const basis = wiz.pool.filter(p => p.sel === 'basis');
  // Ontdubbelen over iedereen die in de selectie zit (basis én bank), niet enkel over de
  // basisspelers: een wisselspeler met dezelfde voornaam komt in de wedstrijd op hetzelfde veld.
  const dns = fieldDisplayNames(wiz.pool.filter(p => p.sel === 'basis' || p.sel === 'bank').map(p => ({ id: p.pid, name: p.name })));
  // Het hele rooster staat op het veld, niet enkel de plekken van de formatie: je zet je spelers waar
  // je wil. De formatie is een VOORSTEL — haar plekken lichten sterker op, de rest staat er lichter
  // bij. Welke roosterplekken dat zijn, volgt uit dezelfde snap-per-lijn als elders (gridPlekVoor).
  const bezet = new Map();
  wiz.pool.forEach(p => { if (p.sel === 'basis' && p.slot) bezet.set(p.slot, p); });
  const voorstel = formatieVoorstel(form, wiz.matchType);
  const slots = POS_GRID.map(plek => {
    const gk = plek.line === 'Doel';
    const p = bezet.get(plek.code);
    const pos = `left:${plek.x}%;top:${plek.y}%`;
    // Bezet: het shirt met het RUGNUMMER erin en de naam eronder. Leeg: een open shirt met de
    // positiecode eronder — die verdwijnt zodra er iemand op staat (dan komt de naam daar).
    // Het positienummer staat niet meer op het veld: met 26 roosterplekken en 11 klassieke nummers
    // kan een nummer een plek niet meer aanduiden. Het leeft voort in de lijsten als "CAM (9)".
    if (p) {
      const ring = (wiz.selPlace === p.pid) ? ';box-shadow:0 0 0 3px var(--org);border-radius:8px' : '';
      return `<div class="pslot" style="${pos}${ring}" onclick="placeSlot('${plek.code}')" title="${plek.code}">`
        + `${shirtSvg(true, gk, pNum(p))}<span class="pslot-lbl">${esc(dns.get(p.pid) || _firstName(p.name))}</span></div>`;
    }
    return `<div class="pslot pslot-open${voorstel.has(plek.code) ? ' pslot-tip' : ''}" style="${pos}" onclick="placeSlot('${plek.code}')">`
      + `${shirtSvg(false, gk, '')}<span class="pmark-code">${plek.code}</span></div>`;
  }).join('');
  return `<div class="pitch">${pitchLines()}${slots}</div>`;
}
function wizStep3() {
  const forms = FORMATIONS[wiz.matchType] || [];
  const form = forms[wiz.formationIndex] || forms[0];
  // Eén lijst met wie geselecteerd is en (nog) niet op het veld staat. Dat was er vroeger twee —
  // "Nog te plaatsen" (de basisspelers uit de selectie) en "Op de bank" (de wisselspelers) — maar
  // sinds v0.33.0 duidt de selectie dat onderscheid niet meer aan: wie meegaat en niet op het veld
  // staat, ís de bank. De filter kijkt daarom naar de plaatsing en niet naar `sel`, zodat er nooit
  // iemand uit beide lijsten valt.
  const bank = sortedByName(wiz.pool.filter(p => isSel(p) && p.slot == null));
  // Hoeveel spelers er op het veld horen, en hoeveel er staan. Het opslaan eist dat dit gelijk is
  // (zie finishWizard), dus dat hoor je hier te zien en niet pas bij een foutmelding.
  // Hoeveel spelers er op het veld horen, komt sinds v0.34.0 uit de WEDSTRIJDVORM (8 bij 8v8) en niet
  // meer uit het aantal slots van de formatie: het rooster heeft er 26 en de formatie is enkel een
  // voorstel geworden.
  const plaatsen = fieldSizeW();
  const nodig = Math.min(plaatsen, selectedCount());
  const geplaatst = wiz.pool.filter(p => p.sel === 'basis' && p.slot != null).length;
  const compleet = geplaatst >= nodig;
  return `
    <div class="card" style="text-align:center;padding:10px">
      <div style="font-size:22px;font-weight:900;color:${compleet ? 'var(--grn)' : 'var(--org)'}">${geplaatst}/${nodig}</div>
      <div style="font-size:11px;color:var(--txt2)">OP HET VELD${nodig < plaatsen ? ` · ${plaatsen} plaatsen, maar ${nodig} spelers beschikbaar` : ''}</div>
    </div>
    ${/* Deze stap gaat enkel over de aftrap. Dat de volgende delen en de wissels daarna komen, stond
         alleen onderaan en dan nog geformuleerd rond opslaan — hier leest het als een wegwijzer. */ ''}
    ${wizDelen() > 1 ? `<p class="stat-hint">${icI(IC.shirt)}<span>Dit is de opstelling waarmee je <b>begint</b>. De opstelling van de volgende ${pPlural(wiz)} en de wissels geef je in de volgende stap in.</span></p>` : ''}
    <div class="fg"><label>Formatie</label>
      <select onchange="setFormation(this.value)">${forms.map((f, i) => `<option value="${i}" ${i===wiz.formationIndex?'selected':''}>${f.name}</option>`).join('')}</select></div>
    <div class="card">${wizPitch(form)}
      <div class="field-legend">Klik op een speler hieronder en dan op een positie op het veld om hem te plaatsen. Klik een speler op het veld en dan een andere positie om te verplaatsen of van plek te wisselen. Klik tweemaal dezelfde positie om de speler te verwijderen.</div>
    </div>
    ${/* Zolang het veld niet vol is, is dit de lijst waaruit je kiest; zodra het vol is, is exact
         diezelfde lijst je bank. Vandaar één titel die meebeweegt met wat er nog moet gebeuren. */ ''}
    <div class="sec">${compleet ? `Op de bank (${bank.length})` : `Nog op het veld te zetten (${bank.length})`}</div>
    <div class="place-chips">${bank.length
      ? bank.map(p => `<span class="place-chip ${wiz.selPlace===p.pid?'sel':''}" onclick="selectPlace('${p.pid}')">${numSpan(p, 'pcn')}${esc(p.name)}</span>`).join('')
      : '<span style="color:var(--txt2);font-size:14px">Niemand op de bank.</span>'}</div>
    <p style="color:var(--txt2);font-size:12px;margin-top:6px">${compleet
      ? 'Het veld is vol — wie hier staat, begint op de bank. Tik een <b>bankspeler</b> aan en dan een <b>speler op het veld</b> om ze te laten ruilen.'
      : 'Tik een speler hierboven aan en dan een <b>vrije plaats</b> op het veld. Wie na het vullen van het veld overblijft, begint op de bank.'}</p>
    <div class="wiz-nav" style="margin-top:14px">
      <button class="btn btn-gray btn-sm" style="width:auto" onclick="clearPlacement()">${icI(IC.undo)} Veld leegmaken</button>
    </div>
    ${/* Geen "Nu starten" meer op deze stap: een wedstrijd wordt eerst ingepland en pas later
         gestart, vanuit het wedstrijdscherm. Dat scheelt niet alleen een onomkeerbare misklik, het
         maakt ook plaats voor de opstelling van de volgende delen — die je hier net wél nog wil
         ingeven. Bij het herbewerken van een LOPENDE wedstrijd houdt finishWizard(false) de status
         gewoon op 'live'; opslaan zet ze dus nooit terug naar gepland. */ ''}
    ${/* Ook bij herbewerken: je komt hier net van de startopstelling, dus dit is dé plek om door te
         gaan — eerst naar de wissels tijdens dit deel, dan naar de volgende delen. Niet bij een
         wedstrijd die al loopt: daar regel je de volgende delen in de pauze. */ ''}
    ${(() => {
      const delen = wizDelen();
      const opslaan = `<button class="btn ${wiz.editStatus === 'live' ? 'btn-green' : 'btn-pale'}" onclick="finishWizard(false)">${icI(IC.calendar)} ${wiz.editId ? (wiz.editStatus === 'live' ? 'Opslaan' : 'Opslaan (gepland)') : 'Plannen'}</button>`;
      if (wiz.editStatus === 'live') {
        return `<div class="wiz-nav"><button class="btn btn-gray" onclick="wizBack()">← Vorige (selectie aanpassen)</button>${opslaan}</div>`;
      }
      return `<div class="wiz-nav"><button class="btn btn-gray" onclick="wizBack()">← Vorige (selectie aanpassen)</button>
      <button class="btn btn-green" onclick="finishWizardThenPlan()">${icI(IC.shirt)} ${delen > 1 ? `Verder → wissels en volgende ${pPlural(wiz)}` : 'Verder → wissels plannen'}</button></div>
    <div style="margin-top:8px">${opslaan}</div>
    ${/* Zeggen wat opslaan hier betekent: de volgende delen erven deze opstelling (zie
         plannedLineupBase), dus je hoeft ze enkel in te geven waar er iets verandert. Zonder dat
         zinnetje leek doorgaan verplicht werk. */ ''}
    ${delen > 1 ? `<p style="text-align:center;color:var(--txt2);font-size:12px;margin-top:8px">Sla je nu op, dan beginnen alle ${pPlural(wiz)} met deze opstelling. Je kan ze later nog per ${pSingLow(wiz)} aanpassen.</p>` : ''}`;
    })()}`;
}
// "Verder": eerst de wedstrijd inplannen (de planner werkt op een bewaarde wedstrijd, niet op de
// wizard-pool), dan de planner openen op deel 1. Daar staan ook de wissels tijdens dat deel, en met
// de pijlen wandel je verder. Stoppen kan overal — de wedstrijd staat op dat moment al ingepland,
// ook als je niets meer invult, en de delen die je niet ingaf volgen het deel ervoor.
async function finishWizardThenPlan() {
  await finishWizard(false);
  if (match) openPlannedLineups(1);
}
function ensurePosNums(m) {
  if (!m || !m.matchType) return false;
  const fi = (FORMATIONS[m.matchType] || []).findIndex(f => f.name === m.formation);
  if (fi < 0) return false;
  const slots = FORMATIONS[m.matchType][fi].slots;
  let changed = false;
  m.players.forEach(p => {
    if (p.starting && typeof p.x === 'number') {
      const idx = slots.findIndex(s => s.x === p.x && s.y === p.y);
      if (idx < 0) return;
      if (p.posNum === '' || p.posNum == null) { p.posNum = computePosNum(m.matchType, idx, slots); changed = true; }
      if (p.line !== slots[idx].line) { p.line = slots[idx].line; changed = true; }
    }
  });
  return changed;
}
// Alle positie-bepalende events (wissels en positiewisselingen) chronologisch, met de plaats in
// m.events als tiebreaker. Dat laatste is essentieel: alles wat bij de start van een deel wordt
// doorgevoerd (pauzewissels én pauze-positiewissels, zie startQuarter) krijgt exact dezelfde
// gameTimeMs. Een sort op gameTimeMs alleen is dan stabiel en houdt de invoegvolgorde aan — wat
// bij het TERUGspoelen (omgekeerde volgorde) net de verkeerde volgorde is, waardoor twee spelers
// op dezelfde plek konden belanden.
function _posEventsChrono(m) {
  return (m.events || []).map((e, i) => ({ e, i }))
    .filter(({ e }) => e.type === 'substitution' || e.type === 'posSwap')
    .sort((a, b) => (a.e.gameTimeMs - b.e.gameTimeMs) || (a.i - b.i))
    .map(({ e }) => e);
}
function playersAtPeriodStart(m, qNum) {
  const on = {}; m.players.forEach(p => { on[p.id] = p.starting; });
  const fallback = {};
  const relevant = m.events.filter(e => e.quarterNum != null && (e.quarterNum < qNum || (e.atBreak && e.quarterNum === qNum)))
    .sort((a, b) => a.gameTimeMs - b.gameTimeMs);
  for (const e of relevant) {
    if (e.type === 'substitution') {
      if (e.playerOutId) on[e.playerOutId] = false;
      if (e.playerInId) {
        on[e.playerInId] = true;
        const out = m.players.find(p => p.id === e.playerOutId);
        if (out && typeof out.x === 'number') fallback[e.playerInId] = { x: out.x, y: out.y, line: out.line, posNum: out.posNum };
      }
    } else if (e.type === 'red_card' && e.playerId) {
      on[e.playerId] = false;
    } else if (e.type === 'injury' && e.leavesField && e.playerId) {
      on[e.playerId] = false;
    }
  }
  // Positie per speler bepalen door vanaf de HUIDIGE (finale) m.players-staat terug te
  // spoelen: alle sub/posSwap-events die NA het gevraagde kwart gebeurd zijn ongedaan maken,
  // in omgekeerde chronologische volgorde (nieuwste eerst). Zo blijft elke eerdere periode
  // correct, ook voor een speler die zelf nooit wisselde maar wél als "bystander" betrokken
  // raakte in een latere wissel van iemand anders — voorheen bouwde deze functie posities
  // voorwaarts op met een fallback naar de finale m.players-waarde zodra er nog geen eerdere
  // override was, wat voor zo'n niet-eerder-geraakte speler zijn latere/finale positie liet
  // doorschemeren in vroegere kwarten (zichtbaar als bolletjes die boven elkaar staan).
  const posMap = {};
  m.players.forEach(p => { posMap[p.id] = { x: p.x, y: p.y, line: p.line, posNum: p.posNum }; });
  const toUndo = _posEventsChrono(m).filter(e =>
    e.quarterNum != null && !(e.quarterNum < qNum || (e.atBreak && e.quarterNum === qNum))
  ).reverse();
  for (const e of toUndo) {
    if (e.type === 'substitution' && e.playerInId) {
      // posBefore herstellen i.p.v. blind naar "geen positie": een speler die al eerder op
      // het veld stond en later terugkeert (meermaals in/uit wisselen) mag zijn vorige
      // stint-positie niet verliezen — anders belandt hij in de generieke "geen x/y"-fallback
      // (evenredig verspreid over de lijn), zichtbaar als een bolletje tussen twee posities in.
      posMap[e.playerInId] = e.posBefore ? { ...e.posBefore } : { x: undefined, y: undefined, line: undefined, posNum: undefined };
    } else if (e.type === 'posSwap' && e.pA && !e.pB && e.posA) {
      // Verhuizing naar een lege plek terugdraaien: enkel die ene speler terug op zijn oude plaats.
      posMap[e.pA] = { ...e.posA };
    } else if (e.type === 'posSwap' && e.pA && e.pB && e.posA && e.posB) {
      posMap[e.pA] = { ...e.posA };
      posMap[e.pB] = { ...e.posB };
    }
    // posSwap-events van vóór deze fix (zonder posA/posB-snapshot) kunnen niet betrouwbaar
    // teruggedraaid worden — die blijven op hun laatst gekende positie staan (bekende
    // beperking voor bestaande, oudere wedstrijden).
  }
  return m.players.filter(p => on[p.id]).map(p => {
    let pos = posMap[p.id];
    if (typeof pos.x !== 'number' && fallback[p.id]) pos = { ...pos, ...fallback[p.id] };
    return { ...p, ...pos };
  });
}
// Positie van elke speler bij de AANVANG van de wedstrijd (de startopstelling), gereconstrueerd
// door vanaf de huidige (finale) m.players-staat alle wissels en positiewisselingen terug te
// draaien — nieuwste eerst. De startopstelling wordt nergens apart bewaard: m.players.x/y worden
// live mee gemuteerd, dus terugspoelen is de enige bron.
// Een positiewissel wordt teruggedraaid door de twee HUIDIGE posities om te wisselen (een swap is
// zijn eigen omgekeerde) i.p.v. via de posA/posB-snapshots. Dat is exact hetzelfde resultaat, maar
// werkt ook voor oudere wedstrijden waarin die snapshots nog niet gelogd werden.
function positionsAtMatchStart(m) {
  const pos = {};
  (m.players || []).forEach(p => { pos[p.id] = { x: p.x, y: p.y, line: p.line, posNum: p.posNum }; });
  const evs = _posEventsChrono(m);
  for (let i = evs.length - 1; i >= 0; i--) {
    const e = evs[i];
    if (e.type === 'substitution' && e.playerInId) {
      pos[e.playerInId] = e.posBefore ? { ...e.posBefore } : { x: undefined, y: undefined, line: undefined, posNum: undefined };
    } else if (e.type === 'posSwap' && e.pA && !e.pB && e.posA) {
      // Achterwaarts: een verhuizing terugdraaien = die speler terug op zijn oude plaats.
      pos[e.pA] = { ...e.posA };
    } else if (e.type === 'posSwap' && e.pA && e.pB && pos[e.pA] && pos[e.pB]) {
      const a = pos[e.pA]; pos[e.pA] = pos[e.pB]; pos[e.pB] = a;
    }
  }
  return pos;
}
// De opstelling voor een VELDDIAGRAM (verslag op het scherm + PDF): wie er bij de start van het
// deel op het veld stond, geplaatst volgens de startopstelling + de wissels — positiewisselingen
// tellen hier bewust NIET mee. Een positiewissel verschuift spelers binnen dezelfde formatie; op
// het diagram leverde dat vooral verwarring op, en bij een reeks positiewissels bollen die elkaar
// overlappen. Ze blijven wel gewoon in het verloop staan en tellen mee voor de keeperminuten
// (rebuildKeeperByQ) — enkel de tekening negeert ze.
// WIE er op het veld staat komt onveranderd van playersAtPeriodStart(); enkel de posities worden
// overschreven.
function pitchPlayersAtPeriodStart(m, qNum) {
  const pos = positionsAtMatchStart(m);
  for (const e of _posEventsChrono(m)) {
    if (e.quarterNum == null) continue;
    // Zelfde tijdvenster als de veldbezetting in playersAtPeriodStart(): alles van een vorig deel,
    // plus wat bij de start van dit deel is doorgevoerd.
    if (!(e.quarterNum < qNum || (e.atBreak && e.quarterNum === qNum))) continue;
    if (e.type === 'substitution') {
      if (e.playerInId && e.playerOutId && pos[e.playerOutId]) pos[e.playerInId] = { ...pos[e.playerOutId] };
    } else if (e.type === 'posSwap' && e.pA && !e.pB && e.naarPlek && pos[e.pA]) {
      // Verhuizing naar een lege plek: enkel deze speler verschuift. Anders dan bij een ruil blijft de
      // som van de plaatsen hier NIET gelijk — zijn oude plaats blijft leeg, en dat is de bedoeling.
      const plek = gridPlek(e.naarPlek);
      if (plek) pos[e.pA] = { x: plek.x, y: plek.y, line: plek.line, posNum: matchGridNummer(m, plek.code) || '', posCodeVeld: plek.code };
    } else if (e.type === 'posSwap' && e.pA && e.pB && pos[e.pA] && pos[e.pB]) {
      // ALLE positiewissels binnen het venster tellen mee. Het venster hierboven doet het echte
      // werk: het laat enkel door wat vóór de aftrap van dit deel gebeurd is (een vorig deel, of
      // een pauzewissel bij de start van dit deel). Zo'n wissel is écht gebeurd, dus de opstelling
      // waarmee dit deel begint bevat hem.
      // Tot v0.25.2 stond hier een extra voorwaarde (enkel atBreak of de doellijn). Daardoor
      // negeerde de reconstructie een positiewissel uit een VORIG deel, en dat liep mis zodra er
      // daarna nog een pauzewissel volgde: het diagram wisselde dan twee spelers om terwijl het
      // veld zelf correct stond. Positiewissels tijdens het deel zelf blijven genegeerd — die
      // vallen buiten het venster, want het diagram toont de opstelling bij de START.
      // Overlappende bollen kan dit niet geven: een positiewissel verwisselt twee plaatsen binnen
      // dezelfde formatie, dus de posities blijven een permutatie van de startplaatsen.
      const a = pos[e.pA]; pos[e.pA] = pos[e.pB]; pos[e.pB] = a;
    }
  }
  return playersAtPeriodStart(m, qNum).map(p => ({ ...p, ...(pos[p.id] || {}) }));
}
let _lcIdx = 0;
function _lcNav(dir) {
  const total = Math.max(1, match.quarters.length);
  const car = document.getElementById('lc-wrap');
  if (!car) return;
  car.querySelectorAll('.lc-slide').forEach((s, i) => s.style.display = 'none');
  _lcIdx = (_lcIdx + dir + total) % total;
  car.querySelectorAll('.lc-slide')[_lcIdx].style.display = '';
  document.getElementById('lc-lbl').textContent = `${pSing(match)} ${_lcIdx + 1} / ${total}`;
  document.getElementById('lc-prev').disabled = _lcIdx === 0;
  document.getElementById('lc-next').disabled = _lcIdx === total - 1;
}
function renderLineupCarousel(m) {
  const total = Math.max(1, m.quarters.length);
  _lcIdx = 0;
  // Ook bij één deel via de reconstructie: m.players draagt de FINALE posities, dus een
  // uitgewisselde basisspeler stond daar nog op zijn oude plek terwijl een positiewissel iemand
  // anders naar diezelfde plek verschoof — twee bollen op elkaar. Speelt vooral bij
  // tornooiwedstrijden, die bijna altijd uit één blok bestaan.
  if (total === 1) {
    const q1 = m.quarters.length ? 1 : undefined;
    return renderPitch(m, pitchPlayersAtPeriodStart(m, q1), captainAtStartOfQuarter(m, 1), q1);
  }
  const slides = Array.from({length: total}, (_, i) => {
    const ps = pitchPlayersAtPeriodStart(m, i + 1);
    const capId = captainAtStartOfQuarter(m, i + 1);
    return `<div class="lc-slide" style="${i === 0 ? '' : 'display:none'}">${renderPitch(m, ps, capId, i + 1)}</div>`;
  }).join('');
  return `<div class="lc-wrap" id="lc-wrap">
    <div class="lc-nav">
      <button class="lc-btn" id="lc-prev" onclick="_lcNav(-1)" disabled>‹</button>
      <span class="lc-nav-lbl" id="lc-lbl">${pSing(m)} 1 / ${total}</span>
      <button class="lc-btn" id="lc-next" onclick="_lcNav(1)">›</button>
    </div>
    ${slides}
  </div>`;
}
function computePosNum(matchType, slotIdx, slots) {
  const slot = slots[slotIdx];
  const line = slot.line;
  const lineSlots = slots.map((s, i) => ({ ...s, origIdx: i })).filter(s => s.line === line).sort((a, b) => a.x - b.x);
  const pos = lineSlots.findIndex(s => s.origIdx === slotIdx);
  const n = lineSlots.length;
  if (matchType === '11v11') {
    const nd = slots.filter(s => s.line === V).length;
    const nm = slots.filter(s => s.line === M).length;
    const na = slots.filter(s => s.line === A).length;
    if (line === D) return 1;
    if (line === V) {
      if (n === 3 && nm === 4 && na === 3) return ([5,3,2])[pos] ?? pos+2; // 1-3-4-3: #4 zit op middenveld
      if (n === 4) return ([5,4,3,2])[pos] ?? pos+2;
      return pos + 2;
    }
    if (line === M) {
      if (nd===4 && nm===4 && na===2) return ([11,8,10,6])[pos] ?? pos+6; // 1-4-4-2
      if (nd===3 && nm===4 && na===3) return ([8,4,10,6])[pos] ?? pos+6;  // 1-3-4-3
      return ({ 3:[8,10,6], 5:[11,8,10,6,7] }[n] || [])[pos] ?? pos+6;
    }
    if (line === A) return ({ 1:[9], 2:[9,7], 3:[11,9,7] }[n] || [])[pos] ?? pos+9;
  }
  if (matchType === '8v8') {
    const nd8 = slots.filter(s => s.line === 'Verdediging').length;
    const nm8 = slots.filter(s => s.line === 'Middenveld').length;
    const na8 = slots.filter(s => s.line === 'Aanval').length;
    if (line === 'Doel') return 1;
    if (line === 'Verdediging') return ({ 1:[3], 2:[5,2], 3:[5,3,2] }[n] || [])[pos] || pos + 2;
    // 2-3-2: de 10 hoort bij het aanvalsduo (schaduwspits), de centrale middenvelder wordt 8 —
    // anders kregen centrale mid én rechteraanvaller allebei bol 10. Dubbele ruit en 3-3-1
    // behouden hun 10 als centrale middenvelder (playmaker).
    if (line === 'Middenveld')  { if (nd8===2 && nm8===3 && na8===2) return ([11,8,7])[pos] ?? pos + 7; return ({ 1:[10], 2:[11,7], 3:[11,10,7] }[n] || [])[pos] || pos + 7; }
    if (line === 'Aanval')      return ({ 1:[9], 2:[9,10], 3:[11,9,7] }[n] || [])[pos] || pos + 7;
  }
  if (matchType === '5v5') {
    if (line === 'Doel') return 1;
    if (line === 'Verdediging') return ({ 1:[3], 2:[3,4] }[n] || [])[pos] || 3;
    if (line === 'Middenveld')  return ({ 1:[10], 2:[11,7] }[n] || [])[pos] || pos + 6;
    if (line === 'Aanval')      return ({ 1:[9], 2:[11,7], 3:[11,9,7] }[n] || [])[pos] || pos + 7;
  }
  return pos + 1;
}
// confirmStartNow() is weg sinds v0.20.0: de wizard eindigt altijd op een INGEPLANDE wedstrijd.
// Starten gebeurt daarna bewust vanuit het wedstrijdscherm (startPlanned), waar dezelfde
// waarschuwing staat. finishWizard houdt de startNow-parameter voor dat pad.
// `zonderOpstelling`: de selectie wordt bewaard, maar niemand krijgt een plaats op het veld. Sinds
// v0.33.0 heeft zo'n wedstrijd dus ook geen `starting`-spelers meer: de selectie duidt er geen aan,
// en iemand `starting` maken zonder plaats zou een basisspeler zijn die nergens staat. Ze draagt
// `lineupPending` tot je de opstelling maakt — zie heeftOpstelling() in core.js.
async function finishWizard(startNow, zonderOpstelling) {
  const form = FORMATIONS[wiz.matchType][wiz.formationIndex];
  if (!zonderOpstelling) {
    // Het veld moet vol. Enige uitzondering: er zijn gewoon niet genoeg spelers geselecteerd om
    // alle plaatsen te vullen — met zeven beschikbare spelers voor 8v8 speel je met zeven, en dat
    // moet mogelijk blijven (zie ook wizNext). Vandaar de ondergrens op het kleinste van de twee.
    const plaatsen = fieldSizeW();   // uit de wedstrijdvorm; het rooster heeft 26 plekken
    const beschikbaar = wiz.pool.filter(p => p.sel === 'basis' || p.sel === 'bank').length;
    const nodig = Math.min(plaatsen, beschikbaar);
    const geplaatst = wiz.pool.filter(p => p.sel === 'basis' && p.slot != null).length;
    if (geplaatst < nodig) {
      showToast(`Zet ${nodig} spelers op het veld — er ${geplaatst === 1 ? 'staat er' : 'staan er'} nu ${geplaatst}.`, 'err');
      return;
    }
    // Wie na het vullen van het veld overblijft, hoort bij de bank. Zonder dit bleef iemand als
    // basisspeler zonder plaats achter, en die zou nergens meer opduiken.
    wiz.pool.forEach(p => { if (p.sel === 'basis' && p.slot == null) p.sel = 'bank'; });
  }
  const team = teamById(wiz.teamId);
  const existing = wiz.editId ? await dbGet(wiz.editId) : null;
  // Nú vastleggen: verderop wordt `existing` met Object.assign overschreven met de nieuwe waarden,
  // dus daarna is de oude formatie niet meer te zien.
  const oudeFormatie = existing ? existing.formation : null;
  // Hergebruik het bestaande speler-id bij het herbewerken van een wedstrijd, zodat reeds
  // gelogde events (playerId/assistId) geldig blijven i.p.v. te verwijzen naar niemand meer.
  const prevPlayers = (existing && Array.isArray(existing.players)) ? existing.players : [];
  const usedPrevIds = new Set();
  const resolvePlayerId = p => {
    let prev = p.srcId ? prevPlayers.find(x => x.rosterId && x.rosterId === p.srcId && !usedPrevIds.has(x.id)) : null;
    if (!prev) prev = prevPlayers.find(x => !usedPrevIds.has(x.id) && (x.name || '').trim() === (p.name || '').trim());
    if (prev) { usedPrevIds.add(prev.id); return prev.id; }
    return uid();
  };
  // globalId komt rechtstreeks uit de pool (srcGlobalId, vastgelegd bij het opbouwen van de pool
  // in buildPool()/trnWizBuildPool() e.d.) i.p.v. hier opnieuw op te zoeken in de lokale
  // teams-cache: die cache bevat in cloud-modus enkel de actieve ploeg en kan door een live
  // roster-sync net op het verkeerde moment overschreven zijn — vandaar altijd null zonder duidelijke
  // oorzaak. Gasten (andere bronploeg) hebben hier geen srcGlobalId; dat is geen regressie,
  // gastoptredens worden al apart via rosterId gedetecteerd (zie guestElsewhere in stats-settings.js).
  // guest meeschrijven: cloneTournamentMatch en editMatchWizard lezen dit veld, en zonder
  // meeschrijven verloor een gastspeler bij klonen of herbewerken stil zijn gastlabel en belandde
  // hij tussen de eigen spelers.
  // fromName enkel bij een gast: dan blijft "Gast · KVE Aalter" ook na herbewerken of klonen staan
  // i.p.v. terug te vallen op het algemene "andere ploeg".
  const gastVeld = p => p.guest ? { guest: true, fromName: p.fromName || '' } : { guest: false };
  const starters = wiz.pool.filter(p => p.sel === 'basis').map(p => {
    // Zonder opstelling is er geen plek: dan valt de speler terug op de lijn van zijn
    // voorkeurspositie, precies zoals een bankspeler, en blijven x/y/posNum leeg.
    // Mét opstelling komt alles van de ROOSTERPLEK: x/y en de lijn uit het rooster, het positienummer
    // uit de tabel per wedstrijdvorm (leeg voor een plek die er geen heeft), en de code zelf in
    // `posCodeVeld` — dat laatste is vanaf nu de identiteit van de plaats. x/y/line/posNum blijven
    // meeschrijven zoals altijd, zodat elk bestaand scherm, verslag en PDF ongewijzigd blijft werken.
    const s = zonderOpstelling ? null : gridPlek(p.slot);
    // Het nummer hoort bij de plek BINNEN de gekozen formatie (zie FORMATIE_NUMMERS): daar is elk
    // nummer uniek. Zet je iemand buiten die formatie, dan valt gridNummer terug op de algemene tabel.
    const formNaam = (FORMATIONS[wiz.matchType] && FORMATIONS[wiz.matchType][wiz.formationIndex] || {}).name;
    return Object.assign({ _pid: p.pid, id: resolvePlayerId(p), rosterId: p.srcId || null, globalId: p.srcGlobalId || null, name: p.name || 'Speler', number: p.number || '', line: s ? s.line : (posLine(p.pos) || 'Middenveld'), posNum: s ? (gridNummer(s.code, wiz.matchType, formNaam) || '') : '', starting: true, onField: true }, s ? { x: s.x, y: s.y, posCodeVeld: s.code } : {}, gastVeld(p));
  });
  const bench = wiz.pool.filter(p => p.sel === 'bank').map(p => Object.assign({ _pid: p.pid, id: resolvePlayerId(p), rosterId: p.srcId || null, globalId: p.srcGlobalId || null, name: p.name || 'Speler', number: p.number || '', line: posLine(p.pos) || 'Middenveld', posNum: '', starting: false, onField: false }, gastVeld(p)));
  const allP = starters.concat(bench);
  let capId = null;
  if (wiz.captainPid) { const c = allP.find(x => x._pid === wiz.captainPid); if (c) capId = c.id; }
  allP.forEach(x => delete x._pid);
  const common = {
    teamName: team ? team.name : (wiz.teamNameFallback || 'Ploeg'), teamId: wiz.teamId || '', formation: form.name,
    competition: wiz.competition, matchday: wiz.matchday, referee: wiz.referee, jersey: wiz.jersey, venue: wiz.venue,
    trainer: wiz.trainer || '', responsible: wiz.responsible || '',
    opponent: wiz.opponent, subteam: wiz.subteam || '', date: wiz.date, time: wiz.time, location: wiz.location,
    matchType: wiz.matchType, fieldSize: MATCH_TYPES[wiz.matchType].field,
    periodKey: wiz.periodKey, numQuarters: wiz.numQuarters !== undefined ? wiz.numQuarters : PERIOD_TYPES[wiz.periodKey].count, quarterDuration: wiz.quarterDuration,
    players: allP,
    absentPlayers: wiz.pool.filter(p => p.sel === 'absent').map(p => ({ name: p.name, rosterId: p.srcId || null, reason: p.absentReason || '' })),
  };
  let m;
  if (wiz.editId) {
    m = Object.assign(existing || {}, common);
    m.status = startNow ? 'live' : (m.status === 'live' ? 'live' : 'planned');
    m.captainId = capId; m.motmId = null;
  } else {
    m = Object.assign({ id: uid(), createdAt: Date.now(), notes: '', motmId: null, captainId: null, quarters: [], currentQuarter: 0, quarterStatus: 'not_started', scoreUs: 0, scoreThem: 0, events: [] }, common);
    m.captainId = capId;
    m.status = startNow ? 'live' : 'planned';
  }
  if (wiz.tournamentId) m.tournamentId = wiz.tournamentId;
  // Het vlaggetje enkel zetten zolang er geen opstelling is; zodra je de opstelling ingeeft (of ze
  // er al lag) hoort het weg, anders blijft het prep-scherm de planning verbergen.
  if (zonderOpstelling) m.lineupPending = true; else delete m.lineupPending;
  // Formatie gewijzigd? Dan vervallen de opstellingen voor de volgende delen: die staan op de
  // plaatsen van de oude formatie en zouden bij "Geplande opstelling gebruiken" positiewissels
  // opleveren die niemand bedoeld heeft. setFormation vroeg dit al; hier gebeurt het pas echt,
  // omdat je tot het opslaan nog kon terugkeren.
  const formatieGewijzigd = !!(oudeFormatie && oudeFormatie !== form.name);
  const planVerviel = formatieGewijzigd && plannedLineupCount(m) > 0;
  if (planVerviel) delete m.plannedLineups;
  syncTournamentStaff(m);
  wiz = null; await dbSave(m); match = m;
  if (planVerviel) showToast(`Andere formatie — de opstelling per ${pSingLow(m)} is gewist.`, 'err');
  if (m.tournamentId) currentTournament = tournamentById(m.tournamentId);
  // Een wedstrijd die al liep blijft live (zie m.status hierboven) en hoort dus terug in het
  // livescherm, niet in het voorbereidingsscherm — dat toont "Wedstrijd starten" voor iets wat al
  // bezig is. Sinds v0.20.0 is dit het enige pad terug uit de wizard, dus het viel op.
  await go((startNow || m.status === 'live') ? 'live' : 'prep', m.id);
}
// Een geplande wedstrijd opnieuw in de wizard openen om te bewerken.
function editMatchWizard(m) {
  // Ploeg bij voorkeur via het stabiele m.teamId (sinds v0.5.34) — zoeken op naam breekt na een
  // ploeg-hernoeming (pool zonder roster + teamId-koppeling die verloren gaat bij opslaan).
  const team = (m.teamId && teamById(m.teamId)) || getTeamsV2().find(t => t.name === m.teamName);
  // Onbekende wedstrijdvorm → terugvallen op de standaardvorm van de ploeg (die valt zelf terug op
  // 8v8). Data die de app aanmaakt heeft altijd een geldige vorm — de wizard kiest uit een lijstje —
  // maar dat verandert zodra een vorm in MATCH_TYPES hernoemd of geschrapt wordt: de wedstrijden die
  // al op de toestellen staan houden dan de oude tekst. Zonder deze terugval crasht dit scherm op
  // FORMATIONS[...][...] en MATCH_TYPES[...].field verderop, en dan is de dropdown op stap 1 — de
  // enige plek waar je de vorm kan rechtzetten — onbereikbaar. Alles wat volgt werkt op wiz.matchType,
  // dus deze ene correctie dekt de hele wizard; bij het opslaan krijgt de wedstrijd de geldige vorm.
  const matchType = MATCH_TYPES[m.matchType] ? m.matchType : teamMatchDefaults(team).matchType;
  if (matchType !== m.matchType) showToast(`Wedstrijdvorm "${m.matchType || '(leeg)'}" is niet bekend — ${matchType} wordt gebruikt. Kijk de wedstrijdvorm na op stap 1.`, 'err');
  const fi = Math.max(0, (FORMATIONS[matchType] || []).findIndex(f => f.name === m.formation));
  const roster = team ? (team.players || []) : [];
  const rosterUsed = new Set();
  const findRoster = (rosterId, name) => roster.find(r => (rosterId && r.id === rosterId) || (!rosterId && (r.name || '').trim() === (name || '').trim()));
  // 1. Reeds geselecteerde spelers (basis/bank) — behoud posities, rugnummers en (verderop) de kapitein.
  const pool = m.players.map(p => {
    const rp = findRoster(p.rosterId, p.name); if (rp) rosterUsed.add(rp.id);
    // Voorkeurspositie uit het rooster halen als we de speler daar vinden: die is fijner dan de
    // lijn waarin hij deze wedstrijd stond (een vleugelspeler en een spits staan beide in 'Aanval').
    // Zonder rooster valt hij terug op de lijn, die normPos omzet naar de bijhorende positie.
    // guest/fromName overnemen uit de wedstrijd: hier stond `guest: false` voor élke speler, dus een
    // gastspeler verloor bij herbewerken zijn label en belandde bij de eigen spelers — precies wat
    // finishWizard met het meeschrijven van `guest` juist wilde voorkomen.
    // Naam uit het ROOSTER als we de speler daar vinden: is hij intussen hernoemd, dan neemt het
    // opnieuw opslaan van de selectie die correctie mee. Een gast of iemand die de ploeg verliet
    // heeft geen rp en houdt de naam die in de wedstrijd staat.
    return { pid: uid(), srcId: p.rosterId || null, srcGlobalId: p.globalId || null, name: (rp && rp.name) || p.name, number: p.number || '', pos: (rp && rp.pos) || p.line || '', side: rp ? (rp.side || '') : '', fromName: p.guest ? (p.fromName || '') : m.teamName, guest: !!p.guest, sel: p.starting ? 'basis' : 'bank', slot: null, _x: p.x, _y: p.y, _line: p.line, _posCodeVeld: p.posCodeVeld || null };
  });
  const trn = m.tournamentId ? tournamentById(m.tournamentId) : null;
  // 2. Niet-beschikbare spelers (NB) mee in de pool — anders wist finishWizard ze bij het opslaan.
  //    De eventueel gekozen reden gaat mee, zodat herbewerken die niet stil laat vallen.
  //    Bij een tornooiwedstrijd niet: daar hoort NB bij de tornooiselectie, niet bij de wedstrijd.
  if (!trn) (m.absentPlayers || []).forEach(a => {
    const ab = typeof a === 'string' ? { name: a, rosterId: null } : a;
    const rp = findRoster(ab.rosterId, ab.name); if (rp) rosterUsed.add(rp.id);
    pool.push({ pid: uid(), srcId: ab.rosterId || (rp ? rp.id : null), srcGlobalId: rp ? (rp.globalId || null) : null, name: ab.name || (rp ? rp.name : 'Speler'), number: rp ? (rp.number || '') : '', pos: rp ? (rp.pos || '') : '', side: rp ? (rp.side || '') : '', fromName: m.teamName, guest: false, sel: 'absent', absentReason: ab.reason || '', slot: null });
  });
  // 3. Overige spelers die (nog) niet geselecteerd waren → beschikbaar als 'none', zodat ze bij het
  //    herbewerken alsnog opgesteld kunnen worden. Bij een tornooiwedstrijd komt die aanvulling uit
  //    de tornooiselectie (enkel wie meegaat) i.p.v. uit het volledige ploegrooster — anders werden
  //    niet-geselecteerden en NB-spelers hier alsnog kiesbaar.
  if (trn) {
    const usedSrc = new Set(pool.map(p => p.srcId).filter(Boolean));
    // Op naam ontdubbelen mag enkel als er GEEN stabiele id's zijn om op te vergelijken: twee
    // naamgenoten (bv. twee keer "Lucas Peeters") met elk hun eigen srcId zijn twee spelers, en de
    // tweede verdween hier stil uit de pool.
    const usedName = new Set(pool.filter(p => !p.srcId).map(p => (p.name || '').trim().toLowerCase()));
    tournamentSquadMee(trn).forEach(s => {
      if (s.srcId ? usedSrc.has(s.srcId) : usedName.has((s.name || '').trim().toLowerCase())) return;
      pool.push({ pid: uid(), srcId: s.srcId || null, srcGlobalId: s.globalId || null, name: s.name, number: s.number || '', pos: s.pos || '', side: s.side || '', fromName: m.teamName, guest: false, sel: 'none', slot: null });
    });
  } else {
    roster.forEach(r => {
      if (rosterUsed.has(r.id)) return;
      pool.push({ pid: uid(), srcId: r.id, srcGlobalId: r.globalId || null, name: r.name, number: r.number || '', pos: r.pos || '', side: r.side || '', fromName: m.teamName, guest: false, sel: 'none', slot: null });
    });
  }
  wiz = {
    step: 1, editId: m.id, editStatus: m.status, teamNameFallback: m.teamName,
    // noGuests verbergt "+ Speler van andere ploeg" en "+ Losse speler" in stap 2 (zie wizStep2).
    // Enkel bij een TORNOOIwedstrijd: daar is de pool de dagselectie van het tornooi en horen gasten
    // via die selectie binnen te komen (zie tournamentSquadMee in startSelectieWizard). Bij een
    // gewone wedstrijd moeten de knoppen er altijd zijn — ook wanneer je de selectie pas achteraf
    // invult; dat was tot v0.16.3 niet zo (startSelectieWizard zette noGuests onvoorwaardelijk).
    // Tim bevestigde op 2026-07-31 dat een gast op een tornooidag niet als noodoplossing wordt
    // gebruikt. Wil je dat later toch weer toelaten: zet noGuests hier op false (het blokkeert dan
    // enkel nog in startSelectieWizard, of nergens als je het daar ook aanpast).
    noGuests: !!m.tournamentId,
    teamId: team ? team.id : '', opponent: m.opponent, subteam: m.subteam || '', date: m.date, time: m.time, location: m.location,
    matchType, periodKey: m.periodKey, quarterDuration: m.quarterDuration,
    competition: m.competition || 'Competitie', matchday: m.matchday || '', referee: m.referee || '', jersey: m.jersey || '', venue: m.venue || '',
    trainer: m.trainer || '', responsible: m.responsible || '',
    pool,
    formationIndex: fi, selPlace: null,
  };
  // Pool is al voor deze ploeg opgebouwd → geen rebuild bij stap 1→2 (dat zou de selectie wissen).
  wiz.poolTeamId = wiz.teamId;
  // Tornooimatch: in tornooi-modus blijven (eigen stap 1 zonder ploegselector) en het aantal
  // blokken behouden — anders werd een 1-blok-tornooimatch bij herbewerken stil 3 delen en kon
  // een ploegwissel de match inconsistent maken met het tornooi.
  if (m.tournamentId) { wiz.trnMode = true; wiz.tournamentId = m.tournamentId; wiz.numQuarters = m.numQuarters; }
  // Bewaar de bestaande kapitein (de eerste pool-entries volgen de volgorde van m.players)
  wiz.pool.forEach((pp, i) => { if (m.players[i] && m.players[i].id === m.captainId) wiz.captainPid = pp.pid; });
  // De bestaande opstelling terugzetten op het rooster. Wie na v0.34.0 bewaard werd, draagt zijn code
  // (`posCodeVeld`) al; al de rest wordt teruggevonden uit lijn + x/y, en wel BINNEN de eigen lijn —
  // zie gridPlekVoor: zonder die beperking zou een verdediger van de dubbele ruit op (24,65) bij een
  // middenvelder belanden en stil van linie veranderen. Voordien werd hier een exacte match op x/y
  // gezocht in de formatie; viel die naast een slot, dan verloor de speler zijn plaats helemaal.
  wiz.pool.filter(p => p.sel === 'basis').forEach(p => {
    // De lijn waarin hij in DEZE wedstrijd stond (_line) is de baas, niet zijn voorkeurspositie uit
    // het rooster: een vleugelspeler die als middenvelder speelde, hoort op een middenveldplek terug.
    const plek = (p._posCodeVeld && gridPlek(p._posCodeVeld)) ? gridPlek(p._posCodeVeld)
      : gridPlekVoor(p._line || posLine(p.pos) || 'Middenveld', p._x, p._y);
    p.slot = plek ? plek.code : null;
  });
  // Twee spelers op dezelfde plek kan niet: valt er iemand samen (oude data, of een lijn met meer
  // spelers dan het rooster daar plekken heeft), dan houdt de eerste de plek en gaat de rest naar de
  // bank — daar kan je hem gewoon opnieuw plaatsen.
  const gezien = new Set();
  wiz.pool.filter(p => p.sel === 'basis').forEach(p => {
    if (!p.slot) return;
    if (gezien.has(p.slot)) { p.slot = null; p.sel = 'bank'; } else gezien.add(p.slot);
  });
  // Onthouden waar we vandaan komen en op welke stap we begonnen: het terugpijltje hoort daar weer
  // uit te komen (zie wizBack/wizVerlaat). startSelectieWizard en startOpstellingWizard zetten
  // vanStap hierna op hun eigen beginstap.
  wiz.vanView = (view === 'live' || view === 'prep') ? view : 'prep';
  wiz.vanStap = 1;
  wiz.snap = wizSnapshot(wiz);
  go('new');
}

// "Selectie" op een geplande wedstrijd: hetzelfde selectiescherm als in de wizard, maar met de
// bestaande selectie al ingevuld. Dat is precies de pool die editMatchWizard opbouwt (basis/bank uit
// m.players, NB uit absentPlayers, de rest van het rooster als 'none', en de slots hersteld uit
// x/y) — dus die hergebruiken we, en we springen meteen naar stap 2. Deze functie bouwde vroeger
// een eigen pool met iedereen op 'none': dat klopte toen ze enkel diende om een nog lege selectie
// in te vullen, maar zou nu een bestaande selectie hebben leeggemaakt.
function startSelectieWizard() {
  if (!match) return;
  editMatchWizard(match);
  if (!wiz) return;
  wiz.step = 2; wiz.vanStap = 2;
  render();
}
// De FORMATIE (3-3-1, 2-3-2 …) kiezen kan enkel op stap 3 van de wizard: daar hangen de vaste
// plaatsen aan vast. Het potlood in de planning verplaatst spelers binnen de huidige formatie, dus
// zonder deze ingang was de formatie van een geplande wedstrijd niet meer te wijzigen.
function startOpstellingWizard() {
  if (!match) return;
  editMatchWizard(match);
  if (!wiz) return;
  // vanStap blijft 2: vanaf de opstelling is "← Vorige (selectie aanpassen)" een zinvolle stap
  // terug, en pas dáár brengt het pijltje je weer naar de wedstrijd.
  wiz.step = 3; wiz.vanStap = 2;
  render();
}

// ===================== GEPLANDE WEDSTRIJD (PREP) =====================
// De planning: één kaart met per deel het veld en de bank die eronder meeschuift. Deel 1 is de
// startopstelling, de volgende delen komen uit plannedLineups (of erven van het vorige deel — zie
// plannedLineupBase). Het potlood opent voor elk deel dezelfde planner.
let _prepPlanQ = 1;
function _prepPlanNav(dir) {
  const total = plannedPartsCount(match);
  const wrap = document.getElementById('pp-wrap');
  if (!wrap) return;
  const slides = wrap.querySelectorAll('.lc-slide');
  _prepPlanQ = Math.min(Math.max(1, _prepPlanQ + dir), total);
  slides.forEach((s, i) => s.style.display = (i === _prepPlanQ - 1) ? '' : 'none');
  document.getElementById('pp-lbl').textContent = `${pSing(match)} ${_prepPlanQ} / ${total}`;
  document.getElementById('pp-prev').disabled = _prepPlanQ === 1;
  document.getElementById('pp-next').disabled = _prepPlanQ === total;
}
function prepPlanningHtml(m, ro) {
  const total = plannedPartsCount(m);
  // Na een bewerking hertekent het scherm; dan moet de kaart op hetzelfde deel blijven staan i.p.v.
  // terug te springen naar deel 1.
  _prepPlanQ = Math.min(Math.max(1, _prepPlanQ), total);
  const potlood = ro ? '' : `<button class="lc-btn" style="margin-left:8px" onclick="openPlannedLineups(_prepPlanQ)" title="Opstelling aanpassen">${icI(IC.edit)}</button>`;
  const slide = q => {
    const lijst = plannedLineupBase(m, q);
    const opVeld = new Set(lijst.map(p => p.id));
    const bank = sortedByName((m.players || []).filter(p => magOpHetVeld(m, p) && !opVeld.has(p.id)));
    return `<div class="lc-slide" style="${q === _prepPlanQ ? '' : 'display:none'}">
      ${renderPitch(m, plannedLineupPlayers(m, lijst), m.captainId)}
      <div class="sec" style="margin-bottom:6px">Bank (${bank.length})</div>
      <div class="place-chips">${bank.length
        ? bank.map(p => `<span class="place-chip">${numSpan(p, 'pcn')}${esc(fieldName(m, p.id))}</span>`).join('')
        : '<span style="color:var(--txt2);font-size:14px">Niemand op de bank.</span>'}</div>
      ${plannedSubsVoorDeelHtml(m, q, !ro && canManage())}
    </div>`;
  };
  if (total < 2) {
    return `<div class="card">${potlood ? `<div class="lc-nav"><span class="lc-nav-lbl">Opstelling</span>${potlood}</div>` : ''}${slide(1)}</div>`;
  }
  return `<div class="card"><div class="lc-wrap" id="pp-wrap">
    <div class="lc-nav">
      <button class="lc-btn" id="pp-prev" onclick="_prepPlanNav(-1)" ${_prepPlanQ === 1 ? 'disabled' : ''}>‹</button>
      <span class="lc-nav-lbl" id="pp-lbl" style="flex:1;text-align:center">${pSing(m)} ${_prepPlanQ} / ${total}</span>
      <button class="lc-btn" id="pp-next" onclick="_prepPlanNav(1)" ${_prepPlanQ === total ? 'disabled' : ''}>›</button>
      ${potlood}
    </div>
    ${Array.from({ length: total }, (_, i) => slide(i + 1)).join('')}
  </div></div>`;
}
function renderPrep() {
  const m = match;
  if (!m) return '<div class="content"><p>Niet gevonden.</p></div>';
  const ro = !!(m.fromCloud && (!isAdmin || viewerMode)); // kijker: alleen-lezen
  const af = matchCancelled(m);   // afgelast: alles blijft bewaard, maar er valt niets meer te doen
  // Formatie staat hier bewust niet meer bij: ze hoort bij de opstelling en is daar te zien én te
  // wijzigen (het linkje onder het veld van deel 1 in de planner).
  const info = [['Ploeg-label', m.subteam], [trainerLabel(matchTrainer(m)), matchTrainer(m)], ['Ploegverantw.', matchResponsible(m)], ['Soort', m.competition], ['Speeldag', m.matchday], ['Scheidsrechter', m.referee], ['Truikleur', m.jersey], ['Locatie', m.venue]].filter(([k, v]) => v);
  const prepBack = m.tournamentId ? `goTournament('${m.tournamentId}')` : `go('matches')`;
  return `
  <div class="hdr"><button class="back" onclick="${prepBack}">‹</button>
    <div><h1>${matchTitle(m)}</h1><div class="hdr-sub">${af ? `${icI(IC.close)} Geannuleerd` : `${icI(IC.calendar)} Gepland`} · ${m.location} · ${matchWhen(m)} · ${m.matchType}</div></div>
  </div>
  <div class="content">
    ${/* Geannuleerd: geen startknop en geen volgende stap meer — enkel de vaststelling en de weg
         terug. De wedstrijd zelf blijft volledig bewaard (selectie, opstelling, plan), dus ongedaan
         maken zet ze weer op gepland zoals ze was. */ ''}
    ${af
      ? `<div class="viewer-banner" style="background:var(--bdr);color:var(--txt2);border-color:var(--txt2)">${icI(IC.close)} Geannuleerd${m.cancelledAt ? ' op ' + fmtDate(m.cancelledAt) : ''}${m.cancelReason ? ' — ' + esc(m.cancelReason) : ''}</div>
      ${ro ? '' : `<button class="btn btn-pale" onclick="confirmUncancelMatch()">${icI(IC.undo)} Annulering ongedaan maken</button>`}`
      : ro ? `<div class="viewer-banner">${icI(IC.eye)} Je kijkt mee — deze wedstrijd is gepland</div>` : `${!heeftSelectie(m)
      ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24">${icI(IC.warn)} Selectie nog niet ingegeven — vul de spelers in voor je de wedstrijd start.</div>`
      : (!heeftOpstelling(m) ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24">${icI(IC.warn)} Opstelling nog niet ingegeven — zet de spelers op het veld voor je de wedstrijd start.</div>` : '')}<button class="btn btn-green" onclick="startPlanned()">${icI(IC.live)} Wedstrijd starten</button>
    ${/* Eén ingang voor alles wat je aan een geplande wedstrijd kan wijzigen (zie
         modalEditMatchMenu). Zonder dat menu stonden er een half dozijn knoppen naast elkaar in dit
         scherm, elk voor een stukje van dezelfde wedstrijd. Er staat enkel een tweede knop naast
         wanneer er nog een duidelijke volgende stap is — de selectie, of de opstelling — want dát
         is dan wat je komt doen, niet iets om op te zoeken. */ ''}
    ${heeftOpstelling(m)
      ? `<button class="btn btn-pale" style="margin-top:8px" onclick="modalEditMatchMenu()">${icI(IC.edit)} Bewerken</button>`
      : `<div class="wiz-nav" style="margin-top:8px">
      <button class="btn btn-pale" onclick="modalEditMatchMenu()">${icI(IC.edit)} Bewerken</button>
      ${heeftSelectie(m)
        ? `<button class="btn btn-orgpale" onclick="startOpstellingWizard()">${icI(IC.shirt)} Opstelling aanmaken</button>`
        : `<button class="btn btn-orgpale" onclick="startSelectieWizard()">${icI(IC.players)} Selectie ingeven</button>`}
    </div>`}
    `}
    <div class="sec">Info</div>
    <div class="card">${info.length ? info.map(([k, v]) => `<div class="stat-row"><span style="color:var(--txt2);min-width:120px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">Geen extra info.</p>'}</div>
    ${/* Zonder opstelling valt het hele planningsblok weg: een velddiagram zou hier spelers tonen
         die je nooit geplaatst hebt (renderPitch spreidt wie geen x/y heeft over zijn lijn), en dat
         leest als een opstelling die er niet is. In de plaats staat hierboven "Opstelling
         aanmaken"; zodra die er is, verschijnt alles — planning, wissels en de PDF. */ ''}
    ${heeftOpstelling(m) ? `<div class="sec">Planning${(!ro && plannedPartsCount(m) > 1) ? ` <span style="font-weight:400;text-transform:none;color:var(--txt2)">(opstelling per ${pSingLow(m)})</span>` : ''}</div>
    ${/* Voor een kijker blijft het plan dicht: wie waar begint en welke wissels klaarstaan is iets
         tussen de trainer en zijn ploeg, niet iets om vooraf op de tribune te lezen. Er staat wél
         dat het bestaat, anders lijkt de wedstrijd onvoorbereid. */ ''}
    ${ro
      ? `<div class="card"><p style="margin:0;color:var(--txt2);font-size:14px;text-align:center">${icI(IC.eye)} De opstelling en geplande wissels zijn enkel zichtbaar voor ploegbeheerders.</p></div>`
      : `${prepPlanningHtml(m, ro || af)}
    ${plannedLineupWarnHtml(m)}`}
    ${/* Eén knop onder het veld: opstelling en wissels horen bij hetzelfde plan en staan in dezelfde
         planner (zie openPlannedLineups). Hier stonden er twee — 'Opstelling per kwart' en 'Wissels
         plannen' — die elk de helft deden en naar een eigen scherm leidden. Het potlood in de kaart
         hierboven brengt je in diezelfde planner, maar meteen op het deel waar je naar kijkt. */ ''}
    ${(ro || af) ? '' : `<button class="btn btn-pale" style="margin-top:8px" onclick="openPlannedLineups(1)">${icI(IC.shirt)} Opstelling en wissels${plannedPartsCount(m) > 1 ? ` per ${pSingLow(m)}` : ''}${plannedCount(m) ? ` (${plannedCount(m)} ${plannedCount(m) === 1 ? 'wissel' : 'wissels'})` : ''}</button>
    ${/* Wissels zonder vast deel horen bij geen enkel kwart en duiken dus nergens in de reeks op.
         Ze zijn zeldzaam (je kiest ze expliciet in de keuzelijst), maar wie er heeft, moet erbij
         kunnen — vandaar deze knop, die enkel verschijnt als ze bestaan. */ ''}
    ${(() => { const los = ((m.plannedSubs || []).filter(s => !s.quarterNum).length + (m.plannedPosSwaps || []).filter(s => !s.quarterNum).length);
      return los ? `<button class="btn btn-pale" style="margin-top:8px" onclick="modalPlannedSubs(0)">${icI(IC.clipboard)} Wissels zonder vast ${pSingLow(m)} (${los})</button>` : ''; })()}
    <button class="btn btn-gray" style="margin-top:8px" onclick="exportWedstrijdplanPDF()">${icI(IC.download)} Wedstrijdplan (PDF)</button>`}` : ''}
    ${/* Annuleren staat bewust boven de rode zone: het is de omkeerbare uitweg voor een wedstrijd die
         niet doorgaat, en juist de knop die je hier zoekt in de plaats van verwijderen. */ ''}
    ${ro ? '' : `${af ? '' : `<button class="btn btn-gray" style="margin-top:8px" onclick="confirmCancelMatch()">${icI(IC.close)} Wedstrijd annuleren</button>`}
    ${m.tournamentId ? cloneMatchBtnHtml(m) : ''}<div class="danger"><button class="btn btn-red" onclick="confirmDelete()">${icI(IC.trash)} Wedstrijd verwijderen</button></div>`}
  </div>`;
}
// Alles wat je aan een geplande wedstrijd kan wijzigen, achter één knop. Elk item leidt naar het
// scherm dat er al voor bestond; dit menu is enkel de wegwijzer. De volgorde volgt hoe je een
// wedstrijd opbouwt: eerst de gegevens, dan wie meespeelt, dan waar ze staan, dan de details.
function modalEditMatchMenu() {
  const m = match; if (!m || !canManage()) return;
  const heeftSel = heeftSelectie(m);
  const heeftOpst = heeftOpstelling(m);
  const item = (ico, titel, uitleg, actie, uit) => `
    <button class="btn ${uit ? 'btn-gray' : 'btn-pale'}" style="margin-top:8px;text-align:left;display:block;width:100%${uit ? ';opacity:.5' : ''}"
      ${uit ? 'disabled' : `onclick="closeModal();${actie}"`}>
      <div style="font-weight:700">${icI(ico)} ${titel}</div>
      <div style="font-size:12px;font-weight:400;color:var(--txt2);margin-top:2px">${uitleg}</div>
    </button>`;
  openModal(`<h3>${icI(IC.edit)} Bewerken</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:4px">Wat wil je aanpassen?</p>
    ${item(IC.calendar, 'Info bewerken', 'Tegenstander, datum, uur, formaat en de rest van de wedstrijdgegevens.', 'editMatchWizard(match)')}
    ${item(IC.players, 'Selectie', 'Wie speelt, wie op de bank zit en wie niet beschikbaar is.', 'startSelectieWizard()')}
    ${/* Zonder opstelling leidt dit item naar de opstellingsstap van de wizard i.p.v. naar de
         planner: die laatste toont een veld en veronderstelt dus dat er al iemand op staat. */ ''}
    ${item(IC.shirt, heeftOpst ? 'Opstelling &amp; wissels' : 'Opstelling aanmaken', !heeftSel
      ? 'Geef eerst de selectie in.'
      : (heeftOpst ? `Het hele plan, ${pSingLow(m)} per ${pSingLow(m)}: wie er begint en wat er tijdens dat ${pSingLow(m)} verandert.`
        : 'Zet de spelers op het veld — dat moet nog gebeuren.'),
      heeftOpst ? 'openPlannedLineups(1)' : 'startOpstellingWizard()', !heeftSel)}
    ${item(IC.edit, 'Namen, nummers &amp; notities', heeftSel
      ? 'Enkel voor deze wedstrijd: rugnummers, kapitein en een notitie per speler.'
      : 'Geef eerst de selectie in.', 'modalEditPlayers()', !heeftSel)}
    ${/* "Wissels plannen" en de opstelling staan als eigen knop onder het veld — daar hoor je ze te
         vinden terwijl je naar de opstelling kijkt, niet weggestopt in dit menu. */ ''}
    ${item(IC.timer, 'Snel resultaat invoeren', 'De wedstrijd niet live volgen, maar achteraf enkel de uitslag ingeven.', 'modalQuickResult()')}
    ${/* Helemaal opnieuw beginnen met de selectie. Enkel zolang de wedstrijd gepland is: eens ze
         loopt hangen er speelminuten en events aan de spelers. */ ''}
    ${(heeftSel && (m.status || 'planned') === 'planned')
      ? item(IC.trash, 'Selectie wissen', `De volledige selectie, de opstelling per ${pSingLow(m)} en de geplande wissels wissen.`, 'confirmClearSelectie()')
      : ''}
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
}
// De selectie van een geplande wedstrijd volledig ongedaan maken: de wedstrijd zelf (tegenstander,
// datum, formaat, formatie) blijft, maar wie meespeelt en alles wat daarop gebouwd is verdwijnt.
// Daarna staat ze weer op "selectie nog niet ingegeven" — dezelfde toestand als een wedstrijd die
// via 'Plannen zonder opstelling' is aangemaakt.
function confirmClearSelectie() {
  const m = match; if (!m || !canManage()) return;
  if ((m.status || 'planned') !== 'planned') return;
  const stukken = [
    `de selectie (${(m.players || []).length} speler${(m.players || []).length === 1 ? '' : 's'})`,
    plannedLineupCount(m) ? `de opstelling per ${pSingLow(m)}` : '',
    plannedCount(m) ? `${plannedCount(m)} geplande wissel${plannedCount(m) === 1 ? '' : 's'}` : '',
  ].filter(Boolean);
  openModal(`<h3>${icI(IC.warn)} Selectie wissen</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:14px">Dit wist ${stukken.join(', ')}. De wedstrijd zelf blijft staan en komt weer op <b>'nog geen selectie ingegeven'</b>. Dit kan je niet ongedaan maken.</p>
    <button class="btn btn-red" onclick="clearSelectie()">${icI(IC.trash)} Ja, selectie wissen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function clearSelectie() {
  const m = match; if (!m || !canManage() || (m.status || 'planned') !== 'planned') return;
  m.players = [];
  m.absentPlayers = [];
  delete m.lineupPending;   // zonder selectie zegt "opstelling nog te maken" niets meer
  delete m.plannedLineups;
  delete m.plannedSubs;
  delete m.plannedPosSwaps;
  m.captainId = null; m.motmId = null;
  // Werkkopieën van de planner horen bij een selectie die er niet meer is.
  _planLineupDraft = null; _planLineupSel = null; _planLineupQ = 1; _prepPlanQ = 1;
  await dbSave(m);
  closeModal(); render();
  showToast('Selectie gewist.');
}
// ----- Een wedstrijd die niet doorgaat -----
// Annuleren i.p.v. verwijderen: de wedstrijd blijft in de agenda en het overzicht staan, maar als
// 'geannuleerd' — niet als gepland, en dus ook niet als 0-0 gespeeld. Selectie, opstelling en plan
// blijven gewoon bewaard, zodat een afgelaste wedstrijd die later toch doorgaat één tik terug is.
// Enkel vanaf 'gepland': een wedstrijd die al liep of afgesloten is hoort in het live-scherm thuis
// (daar staat "Verkeerd afgesloten" en "Terug naar gepland").
function confirmCancelMatch() {
  const m = match; if (!m || !canManage()) return;
  if ((m.status || 'planned') !== 'planned') { showToast('Enkel een geplande wedstrijd kan je annuleren.', 'err'); return; }
  openModal(`<h3>${icI(IC.close)} Wedstrijd annuleren</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:14px">Ze verdwijnt uit de komende wedstrijden en telt nergens mee in de statistieken, maar blijft als <b>geannuleerd</b> in de agenda en het overzicht staan. De selectie en het plan blijven bewaard — je kan dit altijd ongedaan maken.</p>
    <div class="fg"><label>Reden <span style="font-weight:400;color:var(--txt2)">(optioneel)</span></label>
      <input id="cancel-reason" type="text" maxlength="60" placeholder="bv. onbespeelbaar terrein" value="${esc(m.cancelReason || '')}"></div>
    <button class="btn btn-red" style="margin-top:12px" onclick="doCancelMatch()">${icI(IC.close)} Ja, wedstrijd annuleren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Terug</button>`);
}
async function doCancelMatch() {
  const m = match; if (!m || !canManage() || (m.status || 'planned') !== 'planned') return;
  const reden = (document.getElementById('cancel-reason')?.value || '').trim();
  m.status = 'cancelled';
  m.cancelledAt = Date.now();
  if (reden) m.cancelReason = reden; else delete m.cancelReason;
  await dbSave(m);
  closeModal(); render();
  showToast('Wedstrijd geannuleerd.');
}
function confirmUncancelMatch() {
  const m = match; if (!m || !canManage() || !matchCancelled(m)) return;
  openModal(`<h3>${icI(IC.undo)} Annulering ongedaan maken</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:14px">De wedstrijd komt weer op <b>gepland</b> te staan, met dezelfde selectie en hetzelfde plan als voordien.</p>
    <button class="btn btn-green" onclick="doUncancelMatch()">${icI(IC.check)} Ja, terug op gepland</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Terug</button>`);
}
async function doUncancelMatch() {
  const m = match; if (!m || !canManage() || !matchCancelled(m)) return;
  m.status = 'planned';
  delete m.cancelledAt;
  delete m.cancelReason;
  await dbSave(m);
  closeModal(); render();
  showToast('Wedstrijd staat weer op gepland.');
}
async function finishStep1Only() {
  if (wiz.trnMode) {
    wiz.opponent = (document.getElementById('n-opp')?.value || '').trim();
    wiz.date = document.getElementById('n-date')?.value || wiz.date;
    wiz.time = document.getElementById('n-time')?.value || wiz.time;
    wiz.matchType = document.getElementById('n-type')?.value || wiz.matchType;
    // Ook de gekozen periode + blokduur meenemen (die werden anders genegeerd bij "plannen zonder
    // opstelling"). Via readTrnPeriodSel (teams-tournaments.js): zet periodKey ÉN numQuarters,
    // incl. de "1 blok"-optie.
    readTrnPeriodSel();
    wiz.quarterDuration = readDur('n-qd', 'n-qd-custom', wiz.quarterDuration);
    if (!wiz.opponent) { showToast('Vul de naam van de tegenstander in.', 'err'); return; }
  } else {
    captureStep1();
    if (!wiz.teamId) { showToast('Kies of maak eerst een ploeg aan.', 'err'); return; }
    if (!wiz.opponent) { showToast('Vul de tegenstander in.', 'err'); return; }
  }
  const team = teamById(wiz.teamId);
  const common = {
    teamName: team ? team.name : (wiz.teamNameFallback || 'Ploeg'), teamId: wiz.teamId || '',
    competition: wiz.competition, matchday: wiz.matchday || '', referee: wiz.referee || '',
    jersey: wiz.jersey || '', venue: wiz.venue || '',
    trainer: wiz.trainer || '', responsible: wiz.responsible || '',
    opponent: wiz.opponent, subteam: wiz.subteam || '', date: wiz.date, time: wiz.time, location: wiz.location,
    matchType: wiz.matchType, fieldSize: MATCH_TYPES[wiz.matchType].field,
    periodKey: wiz.periodKey,
    numQuarters: wiz.numQuarters !== undefined ? wiz.numQuarters : PERIOD_TYPES[wiz.periodKey].count,
    quarterDuration: wiz.quarterDuration,
  };
  // Bij het herbewerken van een bestaande wedstrijd enkel de stap-1-velden overschrijven —
  // een vers object onder hetzelfde id zou de selectie, opstelling, events en notities stil wissen.
  const existing = wiz.editId ? await dbGet(wiz.editId) : null;
  const m = existing ? Object.assign(existing, common) : Object.assign({
    id: wiz.editId || uid(), createdAt: Date.now(), notes: '', motmId: null, captainId: null,
    quarters: [], currentQuarter: 0, quarterStatus: 'not_started', scoreUs: 0, scoreThem: 0, events: [],
    formation: '', players: [], absentPlayers: [], status: 'planned',
  }, common);
  if (wiz.tournamentId) m.tournamentId = wiz.tournamentId;
  syncTournamentStaff(m);
  if (m.tournamentId) currentTournament = tournamentById(m.tournamentId);
  wiz = null; await dbSave(m); match = m;
  await go('prep', m.id);
}
// ===================== OPSTELLING PER DEEL (VOORAF PLANNEN) =====================
// match.plannedLineups = { 2: [{id,x,y,line,posNum}], 3: [...] }: hoe het veld eruit zou moeten
// zien bij de start van dat deel. Deel 1 staat er niet in — dat IS de startopstelling.
// Een plan doet uit zichzelf niets. Pas als je in de pauze op "Geplande opstelling gebruiken"
// drukt, wordt het verschil met het veld omgerekend naar gewone wissels en positiewissels in
// pendingSubs/pendingPosSwaps, die startQuarter() doorvoert zoals altijd. Zo blijft er één
// waarheid: speelminuten, keeperminuten en het verslag lopen door dezelfde machinerie.
// Nieuw, optioneel veld — bestaande wedstrijden merken hier niets van.
function plannedPartsCount(m) {
  return Math.max(1, (m && (m.numQuarters || (m.quarters || []).length)) || 1);
}
// Waar begin je aan als je deel q opent: het plan voor dat deel, anders dat van het vorige deel,
// en uiteindelijk de startopstelling. Zo pas je per deel enkel aan wat er verandert.
// posCodeVeld mee: de plek van het rooster is sinds v0.34.0 de identiteit van een plaats, en zonder
// dit veld zou een geplande opstelling ze bij elk lezen opnieuw uit x/y moeten benaderen.
function _planEntry(p) { return { id: p.id, x: p.x, y: p.y, line: p.line, posNum: p.posNum, posCodeVeld: p.posCodeVeld || spelerGridCode(p) || undefined }; }
// De startopstelling als plan-entries (deel 1 woont in m.players, niet in plannedLineups).
function _planStartEntries(m) {
  return (m.players || []).filter(p => p.starting && magOpHetVeld(m, p)).map(_planEntry);
}
// Waarmee begint deel q volgens het plan? Het dichtstbijzijnde deel met een EIGEN opstelling (of de
// startopstelling), plus de geplande wissels van elk deel daartussen. Een deel zonder eigen opstelling
// begint dus zoals het vorige EINDIGT — hetzelfde antwoord als planStartVanDeel (de PDF) en als de
// wedstrijd zelf, die bij de overgang van het werkelijke veld vertrekt. Voordien gaven de drie
// planningsschermen hier de opstelling waarmee het vorige deel BEGON, zonder de wissels ervan: dat
// week af van het PDF van dezelfde wedstrijd.
function _planBasis(m, q, eff, startEntries) {
  let k = q, basis = null;
  for (; k >= 2; k--) {
    const pl = eff[k] || [];
    if (pl.length) { basis = pl.map(p => ({ ...p })); break; }
  }
  if (!basis) { k = 1; basis = startEntries.map(p => ({ ...p })); }
  // plannedLineupPlayers() maakt verse objecten, dus _pasGeplandToe (die muteert) raakt de echte
  // spelers nooit aan. De wissels ZONDER deelnummer blijven buiten beschouwing, net als in
  // planStartVanDeel: die horen bij het lopende deel, niet bij een overgang.
  for (let j = k; j < q; j++) {
    basis = _pasGeplandToe(m, plannedLineupPlayers(m, basis), j, null).map(_planEntry);
  }
  // Een uitgesloten speler (rode kaart) kan nog in een eerder ingegeven opstelling staan — die is
  // dan gemaakt vóór de kaart. Hij mag niet vervangen worden, dus zijn plaats blijft gewoon leeg.
  const uit = uitgeslotenIds(m);
  return uit.size ? basis.filter(e => !uit.has(e.id)) : basis;
}
function plannedLineupBase(m, q) {
  return _planBasis(m, q, (m && m.plannedLineups) || {}, _planStartEntries(m));
}
// De plan-entries dragen enkel id + plaats; voor het tekenen hebben we ook naam en rugnummer nodig.
function plannedLineupPlayers(m, lijst) {
  return lijst.map(e => Object.assign({}, (m.players || []).find(p => p.id === e.id) || { id: e.id, name: '?' }, e));
}
function plannedLineupCount(m) { return Object.keys((m && m.plannedLineups) || {}).length; }
// De losse wissels die je aan dít deel koppelde (zie planDeelSelHtml in live-match.js), als blokje
// onder het veld. Ze horen visueel bij de opstelling van dat deel: het veld toont hoe je begint, dit
// toont wat er tijdens dat deel nog gepland staat. Gebruikt door de planningskaart in het
// voorbereidingsscherm én door dezelfde kaart tijdens de wedstrijd.
// `bewerkbaar`: dan krijgt elke regel een potlood en een kruisje, en staat er onderaan een knop om er
// een bij te zetten voor dít deel — dezelfde ingangen als in het scherm 'Wissels plannen', maar
// meteen bij het kwart waar je naar kijkt. Tijdens de wedstrijd blijft dit blok alleen-lezen (zie
// planningTijdensMatchHtml): daar is de planning iets om na te kijken, niet om te herwerken.
// `bron` bepaalt waar je na het aanpassen weer belandt: 'prep' (de planningskaart in het
// wedstrijdscherm) of 'planner' (de opstellingsplanner, tijdens het doorlopen van de reeks).
function plannedSubsVoorDeelHtml(m, q, bewerkbaar, bron) {
  const regels = [
    ...(m.plannedSubs || []).filter(s => s.quarterNum === q)
      .map(s => ({ id: s.id, soort: 'sub', tekst: `${icI(IC.swap)} <b>${esc(pName(m, s.inId))}</b> <span style="color:var(--txt2)">voor</span> ${esc(pName(m, s.outId))}` })),
    ...(m.plannedPosSwaps || []).filter(s => s.quarterNum === q)
      .map(s => ({ id: s.id, soort: 'swap', tekst: `${icI(IC.compass)} ${plannedSwapTekst(m, s)}` })),
  ];
  if (!regels.length && !bewerkbaar) return '';
  const dit = pSingLow(m) === 'helft' ? 'deze' : 'dit';
  const b = bron === 'planner' ? 'planner' : 'prep';
  const knoppen = r => bewerkbaar
    ? `<button class="evt-edit" onclick="planSubBewerk('${r.id}','${r.soort}','${b}')" title="Aanpassen">${icI(IC.edit)}</button>
       <button class="evt-del" onclick="planSubWis('${r.id}','${r.soort}','${b}')" title="Verwijderen">×</button>`
    : '';
  return `<div class="sec" style="margin-bottom:6px">Geplande wissels tijdens ${dit} ${pSingLow(m)}</div>
    ${regels.length
      ? regels.map(r => `<div class="prow" style="padding:6px 0;align-items:center"><div style="flex:1;font-size:14px">${r.tekst}</div>${knoppen(r)}</div>`).join('')
      : `<p style="color:var(--txt2);font-size:13px;padding:2px 0 4px">Nog geen wissels klaargezet voor ${dit} ${pSingLow(m)}.</p>`}
    ${bewerkbaar ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">
      <button class="btn btn-pale btn-sm" onclick="planSubNieuw(${q},'sub','${b}')">${icI(IC.swap)} + Wissel</button>
      <button class="btn btn-pale btn-sm" onclick="planSubNieuw(${q},'swap','${b}')">${icI(IC.compass)} + Positiewissel</button>
    </div>` : ''}`;
}
// Spelers die in een plan staan maar er niet meer zijn: uit de selectie gehaald, of afwezig
// gemarkeerd (het kruisje in het tabblad Opstelling — dat kan ook nog tijdens de wedstrijd). Het
// plan zelf blijft ongemoeid; wie het opruimt beslist de gebruiker. Dit levert enkel de namen op,
// zodat het scherm kan zeggen wát er nagekeken moet worden in plaats van dat pas te melden op het
// moment dat je het plan wil gebruiken.
function plannedLineupIssues(m) {
  if (!m || !m.plannedLineups) return [];
  const spelers = new Map((m.players || []).map(p => [p.id, p]));
  return Object.keys(m.plannedLineups)
    .map(k => parseInt(k, 10))
    .filter(k => k > 0)
    .sort((a, b) => a - b)
    .map(deel => {
      const namen = [];
      (m.plannedLineups[deel] || []).forEach(e => {
        const sp = spelers.get(e.id);
        if (!sp) namen.push('een speler die niet meer in de selectie zit');
        else if (sp.absent) namen.push(`${fieldName(m, e.id)} staat niet aanwezig`);
        else if (isUitgesloten(m, e.id)) namen.push(`${fieldName(m, e.id)} is uitgesloten (rode kaart) — zijn plaats blijft leeg`);
      });
      return { deel, namen: [...new Set(namen)] };
    })
    .filter(x => x.namen.length);
}
// Eén kadertje dat zegt welk deel nagekeken moet worden. Leeg als er niets aan de hand is.
function plannedLineupWarnHtml(m, deelFilter) {
  const issues = plannedLineupIssues(m).filter(i => !deelFilter || i.deel === deelFilter);
  if (!issues.length) return '';
  const regels = issues.map(i => `<b>${pSing(m)} ${i.deel}</b>: ${i.namen.map(esc).join(', ')}`).join('<br>');
  return `<div style="font-size:12px;color:#b45309;background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:8px 10px;margin-top:8px">
    ${icI(IC.warn)} Kijk je opstelling na — de selectie is gewijzigd.<br>${regels}</div>`;
}
// Vertaalt "zo moet het veld eruitzien" naar de wissels en positiewissels die daarvoor nodig zijn.
// Het minimum aantal: elke speler die weg moet wordt gekoppeld aan een invaller — bij voorkeur die
// zijn plaats overneemt — en wie blijft maar verschuift vormt een permutatie van de plaatsen, die
// in cycli wordt opgesplitst (een cyclus van k plaatsen kost k-1 positiewissels).
function lineupToPending(m, huidig, gepland) {
  const sleutel = p => (typeof p.x === 'number' ? `${p.x},${p.y}` : `L:${p.line || ''}`);
  const problemen = [];
  const inSelectie = new Map((m.players || []).map(p => [p.id, p]));
  const doelLijst = gepland.filter(e => {
    const sp = inSelectie.get(e.id);
    if (!sp) { problemen.push('Een speler uit het plan zit niet meer in de selectie.'); return false; }
    if (sp.absent) { problemen.push(`${pName(m, e.id)} is afwezig gemarkeerd en blijft van het veld.`); return false; }
    // Uitgesloten: hij mag niet meer meedoen én niet vervangen worden. Door hem hier uit het doel te
    // laten, wordt er geen wissel voor hem berekend en blijft zijn plaats leeg — één man minder.
    if (isUitgesloten(m, e.id)) { problemen.push(`${pName(m, e.id)} is uitgesloten (rode kaart): zijn plaats blijft leeg, je speelt met een man minder.`); return false; }
    return true;
  });
  const nuIds = new Set(huidig.map(p => p.id));
  const doelIds = new Set(doelLijst.map(p => p.id));
  const restEraf = huidig.filter(p => !doelIds.has(p.id));
  const erin = doelLijst.filter(e => !nuIds.has(e.id));
  const subs = [];
  for (const i of erin) {
    if (!restEraf.length) { problemen.push(`Geen plaats vrij voor ${pName(m, i.id)}.`); continue; }
    // liefst de speler die nu net op de plaats staat waar de invaller naartoe moet: dan is er
    // achteraf geen positiewissel meer nodig.
    let idx = restEraf.findIndex(o => sleutel(o) === sleutel(i));
    if (idx < 0) idx = 0;
    const o = restEraf.splice(idx, 1)[0];
    subs.push({ outId: o.id, inId: i.id, slot: sleutel(o) });
  }
  // Het plan telt minder spelers dan er nu op het veld staan — meestal omdat er hierboven iemand
  // uitviel (afwezig of uit de selectie). Zeg wie er dan blijft staan i.p.v. een telling: de vorige
  // formulering ("N speler(s) uit het plan minder op het veld dan er nu staan") was niet te volgen.
  if (restEraf.length) {
    problemen.push(`Er komt niemand in de plaats voor ${restEraf.map(p => pName(m, p.id)).join(', ')} — ${restEraf.length === 1 ? 'hij blijft' : 'zij blijven'} op het veld.`);
  }
  // Stand ná de wissels: plaats -> speler. Daarna de plaatsen rechtzetten met positiewissels.
  const nu = new Map();
  const gewisseldWeg = new Set(subs.map(s => s.outId));
  huidig.forEach(p => { if (!gewisseldWeg.has(p.id)) nu.set(sleutel(p), p.id); });
  subs.forEach(s => nu.set(s.slot, s.inId));
  const swaps = [];
  for (const e of doelLijst) {
    const slot = sleutel(e);
    const staatEr = nu.get(slot);
    if (staatEr === undefined || staatEr === e.id) continue;
    let anderSlot = null;
    for (const [s2, id2] of nu) if (id2 === e.id) { anderSlot = s2; break; }
    if (anderSlot === null) continue;   // staat niet op het veld — al gemeld hierboven
    swaps.push({ pA: staatEr, pB: e.id });
    nu.set(slot, e.id); nu.set(anderSlot, staatEr);
  }
  return { subs: subs.map(s => ({ outId: s.outId, inId: s.inId })), swaps, problemen: [...new Set(problemen)] };
}

let _planLineupQ = 1;        // welk deel staat open in de planner
let _planLineupSel = null;   // { kind: 'field' | 'bench', id }
// Onopgeslagen wijzigingen in de planner. Sleutel = deelnummer, waarde = de opstelling voor dat deel
// (of null: "plan gewist, volg weer het vorige deel"). Elke tik schreef vroeger meteen naar de
// databank; nu blijft alles hier staan tot je op Opslaan drukt, zodat Sluiten écht annuleert.
let _planLineupDraft = null;
// De opstellingen per deel zoals ze er nú uitzien: wat opgeslagen is, met de werkkopie eroverheen.
// Deel 1 zit niet in plannedLineups (dat is de startopstelling in m.players) en blijft hier buiten.
function _planLineupsNu(m) {
  const eff = Object.assign({}, m.plannedLineups || {});
  if (_planLineupDraft) Object.keys(_planLineupDraft).forEach(k => {
    if (String(k) === '1') return;
    if (_planLineupDraft[k] === null) delete eff[k]; else eff[k] = _planLineupDraft[k];
  });
  return eff;
}
// Zelfde rol als plannedLineupBase, maar met de werkkopie meegerekend.
function planLineupBaseNu(m, q) {
  const draft1 = _planLineupDraft && _planLineupDraft[1];
  const start = draft1 ? draft1.map(p => ({ ...p })) : _planStartEntries(m);
  return _planBasis(m, q, _planLineupsNu(m), start);
}
function planLineupDirty() { return !!(_planLineupDraft && Object.keys(_planLineupDraft).length); }
// De planner openen: altijd met een verse werkkopie. Elk pad naar de planner (knop, potlood, het
// menu, en de wizard) loopt hierlangs; modalPlannedLineups zelf hertekent enkel wat al openstaat.
// Er is één planner: van waar je ook binnenkomt, je kan met de pijlen door alle delen bladeren en
// zie je bij elk deel ook de wissels die erin gepland staan. Vroeger was er een aparte
// "reeks"-variant (na de wizard) die als enige die wissels toonde en met "Klaar" afsloot.
function openPlannedLineups(q) {
  _planLineupDraft = {};
  modalPlannedLineups(q);
}
// Naar een ander deel. De werkkopie wordt eerst weggeschreven: de wissels die je eronder plant
// schrijven meteen weg (dus een openstaande werkkopie zou achterlopen), en het volgende deel erft
// van dit deel — dat moet dus vastliggen vóór we het tekenen.
async function planNaarDeel(deel) {
  const totaal = plannedPartsCount(match);
  const doel = Math.min(Math.max(1, deel || 1), totaal);
  await _schrijfPlanDraft();
  _planLineupDraft = {};
  modalPlannedLineups(doel);
}
// De melding bij het opslaan. Voordien stond hier een modal ("Opgeslagen tot kwart 3") die enkel de
// delen ná je stoppunt opsomde: kwart 2 bleef onvermeld terwijl dat evengoed geen eigen opstelling
// had, en de kop suggereerde dat de rest niet bewaard was. Nu één regel die altijd klopt, ongeacht
// waar je stopte, plus de weg terug.
function planOpgeslagenTekst(m) {
  const totaal = plannedPartsCount(m);
  const eigen = m.plannedLineups || {};
  let zonder = 0;
  for (let k = 2; k <= totaal; k++) if (!((eigen[k] || []).length)) zonder++;
  if (!zonder) return 'Wedstrijdplan opgeslagen.';
  return `Wedstrijdplan opgeslagen. ${pPlural(m).charAt(0).toUpperCase() + pPlural(m).slice(1)} zonder eigen opstelling beginnen zoals het vorige eindigt — later aanpasbaar via Planning.`;
}
// Deel 1 is de startopstelling zelf en woont dus in m.players, niet in plannedLineups. Bewerken mag
// enkel zolang de wedstrijd gepland is: eens ze loopt zijn er speelminuten en events die van die
// startopstelling vertrekken, en die achteraf verzetten zou het verslag laten liegen. Voor deel 1
// van een lopende wedstrijd bestaat het pauzescherm ("Wissels & posities op het veld").
function planLineupEditable(m, deel) {
  if (!canManage()) return false;
  return deel > 1 || (m.status || 'planned') === 'planned';
}
function modalPlannedLineups(q) {
  const m = match; if (!m) return;
  const totaal = plannedPartsCount(m);
  if (!(m.players || []).length) { showToast('Geef eerst de selectie en de startopstelling in.', 'err'); return; }
  if (!_planLineupDraft) _planLineupDraft = {};
  if (q) { _planLineupQ = Math.min(Math.max(1, q), totaal); _planLineupSel = null; }
  const deel = Math.min(_planLineupQ, totaal);
  // De planningskaart eronder volgt het deel dat hier openstaat: sluit je de planner op kwart 3,
  // dan kijk je ook in het scherm naar kwart 3 i.p.v. terug naar waar je vandaan kwam.
  _prepPlanQ = deel;
  const ro = !planLineupEditable(m, deel);
  const eff = _planLineupsNu(m);
  const plan = planLineupBaseNu(m, deel);
  const veld = plannedLineupPlayers(m, plan);
  const opVeld = new Set(plan.map(p => p.id));
  const bank = sortedByName((m.players || []).filter(p => magOpHetVeld(m, p) && !opVeld.has(p.id)));
  const eigen = deel > 1 && !!(eff[deel] || []).length;
  const chips = Array.from({ length: totaal }, (_, i) => i + 1).map(k => {
    // Een stipje betekent "dit deel heeft een eigen opstelling". Deel 1 heeft er per definitie een
    // (de startopstelling), dus daar zou het stipje niets onderscheiden.
    const heeft = k > 1 && !!(eff[k] || []).length;
    const titel = heeft ? ` title="Eigen opstelling — volgt ${pSingLow(m)} ${k - 1} niet meer"` : '';
    return `<button class="tgl-btn${k === deel ? ' act' : ''}"${titel} onclick="planNaarDeel(${k})">${pSing(m)} ${k}${heeft ? ' ●' : ''}</button>`;
  }).join('');
  // Wat het bolletje betekent, staat er nu bij: het onderscheidt een deel dat je zelf invulde van een
  // deel dat gewoon het vorige volgt, en dat verschil bepaalt of een latere wijziging nog doorwerkt.
  const bolUitleg = Array.from({ length: totaal }, (_, i) => i + 1).some(k => k > 1 && (eff[k] || []).length)
    ? `<p style="text-align:center;color:var(--txt2);font-size:11px;margin:-4px 0 10px">● = eigen opstelling</p>` : '';
  const selId = _planLineupSel ? _planLineupSel.id : null;
  const uitleg = ro
    ? (deel === 1
      ? `De startopstelling van deze wedstrijd.`
      : `Zo ziet de opstelling van ${pSingLow(m)} ${deel} eruit volgens het plan.`)
    : `Tik een speler en dan een <b>vrije plek</b> om hem daar te zetten. Tik een <b>bankspeler</b> en dan een <b>speler op het veld</b> om te wisselen, of <b>twee veldspelers</b> om ze van plaats te wisselen.${deel === 1
      ? ` Dit is de <b>startopstelling</b>.`
      : (eigen
        ? ` Dit ${pSingLow(m)} heeft een <b>eigen</b> opstelling en volgt ${pSingLow(m)} ${deel - 1} dus niet meer.`
        : ` Dit ${pSingLow(m)} heeft nog geen eigen opstelling: het begint zoals het vorige <b>eindigt</b>.`)}`;
  const titel = totaal > 1 ? `${pSing(m)} ${deel} van ${totaal}` : `Opstelling`;
  openModal(`<h3>${icI(IC.shirt)} ${titel}</h3>
    ${totaal > 1 ? `<div class="tgl" style="flex-wrap:wrap;gap:6px;margin-bottom:10px">${chips}</div>${bolUitleg}` : ''}
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">${uitleg}</p>
    ${/* Uitklapper i.p.v. een pop-up: wie het mechanisme kent, ziet één regeltje; wie het niet kent,
         leest het hier. De tekst volgt precies wat de code doet — zetGeplandeOpstellingKlaar() bij
         het einde van een deel, startQuarter() bij de start, en plannedSubs die NOOIT vanzelf afgaan
         (zie de commentaar bij "GEPLANDE (KLAARGEZETTE) WISSELS" in live-match.js). */ ''}
    ${(!ro && totaal > 1) ? `<details class="more-details" style="margin-bottom:12px">
      <summary>Hoe werkt dit?</summary>
      <div style="font-size:13px;color:var(--txt2);margin-top:10px;line-height:1.45">
        <p style="margin-bottom:8px">Geef per ${pSingLow(m)} de opstelling in waarmee dat ${pSingLow(m)} <b>begint</b>, en daaronder de wissels en positiewissels die je <b>tijdens</b> dat ${pSingLow(m)} wil doen.</p>
        <p style="margin-bottom:8px"><b>Vul je een ${pSingLow(m)} in</b>, dan zorgt de app dat die opstelling er ook echt komt. Bij het einde van het vorige ${pSingLow(m)} vergelijkt ze het <b>werkelijke</b> veld met jouw plan en zet ze de nodige wissels klaar in het pauzescherm; bij de start worden die automatisch doorgevoerd. Ook als er onderweg heel andere dingen gebeurden dan gepland. Had je in de pauze zelf al wissels klaargezet, dan blijft dat staan — je handwerk wordt niet overschreven.</p>
        <p style="margin-bottom:8px"><b>Vul je een ${pSingLow(m)} niet in</b>, dan begint het zoals het vorige <b>eindigt</b>, met de wissels die je daar doorvoerde erin, en zet de app niets klaar.</p>
        <p style="margin-bottom:8px">De wissels die je hieronder plant voor <b>tijdens</b> een ${pSingLow(m)} gaan niet vanzelf af: die voer je zelf door op het moment dat je ze wil.</p>
        <p style="margin:0"><b>Tip:</b> doorloop de ${pPlural(m)} van voor naar achter. Een ${pSingLow(m)} dat je zelf invult (●) krijgt een eigen opstelling en volgt de eerdere ${pPlural(m)} daarna niet meer — wijzig je later nog iets aan ${pSingLow(m)} 2, dan past ${pSingLow(m)} 3 zich dus niet meer aan. Met <b>Plan voor ${pSingLow(m)} X wissen</b> maak je dat weer ongedaan.</p>
      </div></details>` : ''}
    ${plannedLineupWarnHtml(m, deel)}
    ${/* plek: true → de onbezette roosterplekken worden getekend en zijn aantikbaar, zodat je hier een
         speler naar een LEGE plaats kan zetten en niet enkel met iemand kan ruilen. Daarmee is dit
         scherm ook de weg terug naar de startopstelling: per deel kan je alles opnieuw plaatsen. */ ''}
    ${renderPitch(m, veld, m.captainId, null, ro ? null : { fn: 'planLineupTap', selId, plek: true })}
    <div class="sec">Bank (${bank.length})</div>
    <div class="place-chips">${bank.length
      ? bank.map(p => `<span class="place-chip ${selId === p.id ? 'sel' : ''}"${ro ? '' : ` onclick="planLineupTap('bench','${p.id}')"`}>${numSpan(p, 'pcn')}${esc(fieldName(m, p.id))}</span>`).join('')
      : '<span style="color:var(--txt2);font-size:14px">Niemand op de bank.</span>'}</div>
    ${(!ro && deel === 1 && (FORMATIONS[m.matchType] || []).length > 1)
      ? `<p style="text-align:center;font-size:12px;color:var(--txt2);margin-top:10px">Formatie: <b>${esc(m.formation || '')}</b> · <a onclick="planLineupNaarFormatie()" style="color:var(--grn);font-weight:700;cursor:pointer">wijzigen</a></p>` : ''}
    ${(!ro && eigen) ? `<button class="btn btn-pale btn-sm" style="margin-top:12px" onclick="clearPlannedLineup(${deel})">${icI(IC.undo)} Plan voor ${pSingLow(m)} ${deel} wissen</button>` : ''}
    ${/* Het veld hierboven toont hoe dit deel BEGINT; hieronder staat wat er tijdens dat deel nog
         verandert. Die twee horen bij elkaar, dus ze staan altijd samen — ook wanneer je via het
         potloodje op de planningskaart binnenkomt. Voordien stond dit blok enkel bij het doorlopen
         van de reeks, waardoor je in dat ene geval de opstelling van een deel zag zonder de wissels
         die erin gepland waren. */ ''}
    ${!ro ? plannedSubsVoorDeelHtml(m, deel, true, 'planner') : ''}
    ${/* Eén planner met een pijl vooruit én achteruit i.p.v. twee varianten (reeks vs. één deel).
         Bladeren schrijft de werkkopie weg — het volgende deel erft van dit deel, dus dat moet
         vastliggen vóór we het tekenen. Onderaan gewoon Opslaan; Sluiten gooit weg wat je op dit
         deel nog niet bewaarde en hertekent het scherm eronder (_prepPlanQ volgt het deel dat hier
         openstond). */ ''}
    ${ro ? `<button class="btn btn-gray" style="margin-top:12px" onclick="closePlannedLineups()">Sluiten</button>`
      : `${totaal > 1 ? `<div class="wiz-nav" style="margin-top:12px">
      ${/* Vaste kolommen: terug altijd links, verder altijd rechts. .wiz-nav is een grid van twee
           kolommen, dus zonder grid-column schoof "Kwart 2 →" op het eerste deel naar links — waar
           je een terugknop verwacht. */ ''}
      ${deel > 1 ? `<button class="btn btn-gray" style="grid-column:1" onclick="planNaarDeel(${deel - 1})">← ${pSing(m)} ${deel - 1}</button>` : ''}
      ${deel < totaal ? `<button class="btn btn-gray" style="grid-column:2" onclick="planNaarDeel(${deel + 1})">${pSing(m)} ${deel + 1} →</button>` : ''}
    </div>` : ''}
    <button class="btn btn-green" style="margin-top:8px" onclick="savePlannedLineups()">${icI(IC.check)} Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closePlannedLineups()">Sluiten</button>`}`);
}
// Eén gewijzigd deel in de werkkopie zetten. Er wordt hier bewust niets opgeslagen: dat gebeurt pas
// in savePlannedLineups, zodat Sluiten de wijzigingen kan laten vallen.
function _savePlannedLineup(deel, lijst) {
  _planLineupDraft = _planLineupDraft || {};
  _planLineupDraft[deel] = lijst.map(p => _planEntry(p));
  modalPlannedLineups();
}
// De werkkopie wegschrijven, zonder de modal te sluiten. Deel 1 schrijft naar de startopstelling
// zelf (m.players), elk volgend deel naar plannedLineups. De vorm van een basisspeler en van een
// bankspeler blijft exact zoals finishWizard ze aanmaakt, anders leest de rest van de app
// (renderPitch, PDF, statistieken) er andere velden dan verwacht. Losgekoppeld van het sluiten omdat
// de sequentiële modus tussentijds opslaat: bij elk volgend deel, en vóór het openen van een
// wisselscherm dat zelf naar de databank schrijft.
async function _schrijfPlanDraft() {
  const m = match;
  const draft = _planLineupDraft || {};
  const delen = Object.keys(draft).map(k => parseInt(k, 10)).filter(k => k > 0).sort((a, b) => a - b);
  if (!delen.length) return false;
  for (const deel of delen) {
    const lijst = draft[deel];
    if (deel === 1) {
      if (!lijst) continue;   // deel 1 kan niet gewist worden
      const plek = new Map(lijst.map(p => [p.id, p]));
      m.players.forEach(p => {
        const s = plek.get(p.id);
        if (s) {
          p.starting = true; p.onField = true;
          p.x = s.x; p.y = s.y; p.line = s.line; p.posNum = s.posNum;
        } else if (p.starting || p.onField) {
          p.starting = false; p.onField = false;
          delete p.x; delete p.y; p.posNum = '';
        }
      });
    } else if (lijst === null) {
      if (m.plannedLineups) delete m.plannedLineups[deel];
    } else {
      m.plannedLineups = m.plannedLineups || {};
      m.plannedLineups[deel] = lijst.map(p => _planEntry(p));
    }
  }
  _planLineupDraft = null; _planLineupSel = null;
  await dbSave(m);
  return true;
}
// De werkkopie wegschrijven én de planner sluiten — de gewone "Opslaan"-knop. Ook wanneer er op dit
// deel niets veranderde: bladeren schrijft onderweg al weg, dus "niets in de werkkopie" betekent niet
// "niets opgeslagen", en dan hoort er gewoon een bevestiging te komen.
async function savePlannedLineups() {
  await _schrijfPlanDraft();
  _planLineupDraft = null; _planLineupSel = null;
  closeModal(); render();
  showToast(planOpgeslagenTekst(match));
}
// Sluiten zonder op te slaan. Enkel vragen als er ook echt iets te verliezen valt.
function closePlannedLineups() {
  if (!planLineupDirty()) { _planLineupDraft = null; _planLineupSel = null; closeModal(); render(); return; }
  openModal(`<h3>${icI(IC.warn)} Niet opgeslagen wijzigingen</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:14px">Je paste de opstelling aan zonder op te slaan. Sluiten laat die wijzigingen vallen.</p>
    <button class="btn btn-green" onclick="savePlannedLineups()">${icI(IC.check)} Toch opslaan</button>
    <button class="btn btn-red" style="margin-top:8px" onclick="discardPlannedLineups()">${icI(IC.trash)} Wijzigingen weggooien</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="modalPlannedLineups()">Terug naar de opstelling</button>`);
}
function discardPlannedLineups() {
  _planLineupDraft = null; _planLineupSel = null;
  closeModal(); render();
}
// Naar de formatiekeuze in de wizard: die herbouwt de wedstrijd uit wat opgeslagen is, dus de
// werkkopie zou er stil bij inschieten.
function planLineupNaarFormatie() {
  if (planLineupDirty()) { closePlannedLineups(); return; }
  _planLineupDraft = null;
  closeModal(); startOpstellingWizard();
}
function planLineupTap(kind, id) {
  const deel = _planLineupQ;
  if (!planLineupEditable(match, deel)) return;
  // Uitgesloten speler kan je niet in een opstelling zetten: zijn plaats hoort leeg te blijven.
  if (isUitgesloten(match, id)) {
    showToast(`${pName(match, id)} is uitgesloten (rode kaart) en mag niet meer op het veld.`, 'err');
    return;
  }
  const sel = _planLineupSel;
  if (sel && sel.id === id) { _planLineupSel = null; modalPlannedLineups(); return; }   // deselecteren
  // Een LEGE plek aantikken zonder speler in de hand doet niets: er is niemand om te verhuizen.
  if (kind === 'plek' && !sel) return;
  if (!sel || (sel.kind === 'bench' && kind === 'bench')) { _planLineupSel = { kind, id }; modalPlannedLineups(); return; }
  _planLineupSel = null;
  const plan = planLineupBaseNu(match, deel);
  // Naar een lege plek: de speler verhuist en zijn oude plaats blijft leeg. Dat is het punt waarvoor
  // dit bestaat — na een uitsluiting kan je iemand naar de vrijgekomen plek zetten zonder te ruilen.
  if (kind === 'plek') {
    const plek = gridPlek(id);
    if (!plek) { modalPlannedLineups(); return; }
    const nieuw = { x: plek.x, y: plek.y, line: plek.line, posNum: matchGridNummer(match, plek.code) || '', posCodeVeld: plek.code };
    if (sel.kind === 'field') {
      const e = plan.find(p => p.id === sel.id);
      if (!e) { modalPlannedLineups(); return; }
      Object.assign(e, nieuw);
    } else {
      // Van de bank naar een lege plek: er komt iemand bij op het veld. De bovengrens is de
      // wedstrijdvorm MIN de uitsluitingen (veldPlaatsenNu): na een rode kaart speel je met een man
      // minder, en die plaats mag niet opgevuld worden — ook niet van de bank.
      const max = veldPlaatsenNu(match);
      if (plan.length >= max) {
        const uit = ((MATCH_TYPES[match.matchType] || MATCH_TYPES['8v8']).field) - max;
        showToast(uit
          ? `Je speelt met ${max} spelers op het veld: ${uit === 1 ? 'één speler is' : uit + ' spelers zijn'} uitgesloten en die plaats blijft leeg.`
          : `Er staan al ${plan.length} spelers op het veld bij ${match.matchType}. Haal er eerst iemand af.`, 'err');
        modalPlannedLineups(); return;
      }
      plan.push(Object.assign({ id: sel.id }, nieuw));
    }
    _savePlannedLineup(deel, plan);
    return;
  }
  if (sel.kind === 'field' && kind === 'field') {
    const a = plan.find(p => p.id === sel.id), b = plan.find(p => p.id === id);
    if (!a || !b) { modalPlannedLineups(); return; }
    // posCodeVeld hoort bij de plaats en moet dus mee omwisselen, net als x/y en het positienummer.
    const t = { x: a.x, y: a.y, line: a.line, posNum: a.posNum, posCodeVeld: a.posCodeVeld };
    a.x = b.x; a.y = b.y; a.line = b.line; a.posNum = b.posNum; a.posCodeVeld = b.posCodeVeld;
    b.x = t.x; b.y = t.y; b.line = t.line; b.posNum = t.posNum; b.posCodeVeld = t.posCodeVeld;
  } else {
    // bank + veld: de bankspeler neemt de plaats van de veldspeler over
    const veldId = kind === 'field' ? id : sel.id;
    const bankId = kind === 'bench' ? id : sel.id;
    const plek = plan.find(p => p.id === veldId);
    if (!plek) { modalPlannedLineups(); return; }
    plek.id = bankId;
  }
  _savePlannedLineup(deel, plan);
}
function clearPlannedLineup(deel) {
  if (deel < 2 || !planLineupEditable(match, deel)) return;
  _planLineupDraft = _planLineupDraft || {};
  _planLineupDraft[deel] = null;   // pas bij Opslaan echt uit plannedLineups halen
  _planLineupSel = null;
  modalPlannedLineups();
}
function saveTournamentWizStep1Only() {
  captureTrnStep1();
  if (!trnWiz.name) { showToast('Geef het tornooi een naam.', 'err'); return; }
  if (!trnWiz.teamId) { showToast('Maak eerst een ploeg aan.', 'err'); return; }
  // Pool NIET leegmaken: bij het bewerken van een bestaand tornooi staat hier de herstelde
  // selectie (editTournament) — leegmaken zou de squad stil wissen. Enkel herbouwen als de
  // ploeg intussen gewijzigd is (zelfde guard als trnWizNext), en poolTeamId enkel bijwerken
  // als die herbouw ook echt gelukt is.
  if (trnWiz.poolTeamId !== trnWiz.teamId && trnWizBuildPool()) trnWiz.poolTeamId = trnWiz.teamId;
  saveTournamentWiz();
}
async function startPlanned() {
  // De knop staat er niet bij een geannuleerde wedstrijd, maar de handler weigert het zelf ook —
  // zelfde vangnet als bij een afgesloten tornooi (zie addTournamentMatch).
  if (matchCancelled(match)) {
    showToast('Deze wedstrijd is geannuleerd. Maak de annulering eerst ongedaan.', 'err');
    return;
  }
  if (!heeftSelectie(match)) {
    showToast('Vul eerst de selectie en opstelling in voor je de wedstrijd start.', 'err');
    return;
  }
  // Wel een selectie, nog geen opstelling: starten zou een veld opleveren waarop niemand een plaats
  // heeft, en elke wissel of positiewissel vertrekt van die plaatsen.
  if (!heeftOpstelling(match)) {
    showToast('Maak eerst de opstelling voor je de wedstrijd start.', 'err');
    return;
  }
  // Twee wedstrijden van dezelfde ploeg die tegelijk lopen is bij de jongste reeksen (U8 en co) net
  // de normale gang van zaken: twee groepjes, twee locaties, hetzelfde uur, vaak vanaf hetzelfde
  // account. Waarschuwen zodra er nog iets live staat, zou daar elke zaterdag een venster opleveren
  // dat je moet wegklikken — en een waarschuwing die je gewoonte wordt om weg te klikken, mis je
  // ook op de dag dat ze wél terecht is. Daarom enkel de twee gevallen waar het echt misloopt:
  //  - de andere wedstrijd staat vergeten open (haar klok loopt op wandkloktijd door, zie
  //    looksForgotten, dus na twee uur staat elke basisspeler op absurde speelminuten);
  //  - er staan spelers in beide selecties, want die krijgen op twee klokken tegelijk speeltijd.
  const live = (await dbAll()).filter(m => m.status === 'live' && m.id !== match.id && sameTeamAsMatch(m, match));
  const vergeten = live.filter(looksForgotten);
  if (vergeten.length) {
    const o = vergeten[0];
    const q = (o.quarters || [])[(o.quarters || []).length - 1];
    const sinds = q && q.startTime ? ` (gestart om ${new Date(q.startTime).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })})` : '';
    openModal(`<h3>${icI(IC.warn)} Nog een wedstrijd loopt</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:14px"><b>${esc(o.opponent || 'Wedstrijd')}</b>${sinds} staat nog als lopend gemarkeerd. Sluit die eerst af, anders blijft zijn klok doorlopen en krijgen die spelers veel te veel speelminuten.</p>
      <button class="btn btn-green" onclick="closeModal();go('live','${o.id}')">${icI(IC.check)} Die wedstrijd afsluiten</button>
      <button class="btn btn-orgpale" style="margin-top:8px" onclick="closeModal();doStartPlanned()">Toch starten</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  // Niet vergeten, maar wel gedeelde spelers: dan is het geen twee-groepjes-situatie maar een
  // vergissing in de selectie (of iemand die van het ene veld naar het andere gaat).
  const dubbel = live.map(m => ({ m, spelers: gedeeldeSpelers(m, match) })).find(x => x.spelers.length);
  if (dubbel) {
    const o = dubbel.m;
    const namen = dubbel.spelers.slice(0, 6).map(esc).join(', ') + (dubbel.spelers.length > 6 ? ` en ${dubbel.spelers.length - 6} andere` : '');
    openModal(`<h3>${icI(IC.warn)} Dezelfde spelers in twee wedstrijden</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:14px"><b>${esc(o.opponent || 'Wedstrijd')}</b> loopt nu ook, met ${dubbel.spelers.length === 1 ? 'dezelfde speler' : 'dezelfde spelers'} in de selectie: <b>${namen}</b>. Hun speeltijd loopt dan op twee klokken tegelijk.</p>
      <button class="btn btn-green" onclick="closeModal();go('live','${o.id}')">${icI(IC.check)} Die wedstrijd bekijken</button>
      <button class="btn btn-orgpale" style="margin-top:8px" onclick="closeModal();doStartPlanned()">Toch starten</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  await doStartPlanned();
}
// Welke spelers staan in de selectie van beide wedstrijden? Vergelijken op rosterId/globalId (het
// stabiele id van de speler in het rooster) met de naam als vangnet: een gast heeft geen rosterId,
// en het id per wedstrijd (resolvePlayerId) verschilt sowieso per wedstrijd. Geeft namen terug.
function gedeeldeSpelers(a, b) {
  const sleutels = p => [p.rosterId, p.globalId, (p.name || '').trim().toLowerCase()].filter(Boolean);
  const inA = new Set();
  (a.players || []).forEach(p => sleutels(p).forEach(k => inA.add(k)));
  return (b.players || []).filter(p => sleutels(p).some(k => inA.has(k))).map(p => p.name || 'Speler');
}
async function doStartPlanned() {
  match.status = 'live'; await dbSave(match); await go('live', match.id);
}
// ----- Snel resultaat invoeren (wedstrijd die al gespeeld is, zonder live opvolging) -----
let qrScorers = {};
function modalQuickResult() {
  const m = match; qrScorers = {};
  openModal(`<h3>${icI(IC.bolt)} Snel resultaat</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:14px">Voor een wedstrijd die al gespeeld is. Vul de eindstand in; speeltijd wordt niet bijgehouden.</p>
    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:end;margin-bottom:14px">
      <div class="fg" style="margin:0"><label>${esc(tName(m))}</label><input id="qr-us" type="number" inputmode="numeric" value="0" style="text-align:center;font-size:22px;font-weight:800"></div>
      <div style="font-size:22px;font-weight:800;padding-bottom:12px">–</div>
      <div class="fg" style="margin:0"><label>${esc(m.opponent)}</label><input id="qr-them" type="number" inputmode="numeric" value="0" style="text-align:center;font-size:22px;font-weight:800"></div>
    </div>
    <div class="sec" style="margin-top:0">Doelpuntenmakers (optioneel)</div>
    <div>${m.players.map(p => `<div class="selrow"><div class="nm">${esc(p.name)}</div><div class="seg"><button type="button" onclick="qrAdj('${p.id}',-1)">−</button><span id="qr-c-${p.id}" style="min-width:34px;text-align:center;font-weight:800;padding:0 6px;align-self:center">0</span><button type="button" onclick="qrAdj('${p.id}',1)">+</button></div></div>`).join('')}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="saveQuickResult()">${icI(IC.check)}Opslaan als gespeeld</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function qrAdj(id, d) { qrScorers[id] = Math.max(0, (qrScorers[id] || 0) + d); const el = document.getElementById('qr-c-' + id); if (el) el.textContent = qrScorers[id]; }
async function saveQuickResult() {
  const us = Math.max(0, parseInt(document.getElementById('qr-us').value) || 0);
  const them = Math.max(0, parseInt(document.getElementById('qr-them').value) || 0);
  const sum = Object.values(qrScorers).reduce((a, b) => a + b, 0);
  // Meer aangeduide doelpuntenmakers dan de ingevulde eindstand: waarschuw i.p.v. de score stil op te trekken.
  if (sum > us) { showToast(`Je duidde ${sum} doelpuntenmaker(s) aan, maar de eindstand staat op ${us}. Pas de score of de scorers aan.`, 'err'); return; }
  match.events = (match.events || []).filter(e => !e.quick); // eerdere snelinvoer wissen
  const usFinal = us;
  Object.entries(qrScorers).forEach(([pid, c]) => { for (let i = 0; i < c; i++) match.events.push({ id: uid(), realTime: Date.now(), gameTimeMs: 0, quarterNum: null, type: 'goal_us', playerId: pid, assistId: null, quick: true }); });
  for (let i = 0; i < usFinal - sum; i++) match.events.push({ id: uid(), realTime: Date.now(), gameTimeMs: 0, quarterNum: null, type: 'goal_us', playerId: null, assistId: null, quick: true });
  for (let i = 0; i < them; i++) match.events.push({ id: uid(), realTime: Date.now(), gameTimeMs: 0, quarterNum: null, type: 'goal_them', quick: true });
  recomputeScore(match);
  match.status = 'done'; match.quarterStatus = 'done';
  await dbSave(match); closeModal(); go('detail', match.id);
}

// ===================== EDIT PLAYERS =====================
function modalPlayerNotes() {
  // Alfabetisch op familienaam zoals elke spelerslijst, en het rugnummer enkel als de ploeg ze
  // gebruikt. De index voor het onchange-pad moet wél die van match.players blijven.

  const rows = sortedByName(match.players).map(p => {
    const i = match.players.indexOf(p);
    return `
    <div style="margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;margin-bottom:4px">${esc(p.number ? '#' + p.number + ' ' : '')}${esc(p.name || 'Speler')}</div>
      <input type="text" value="${esc(p.note||'')}" placeholder="Notitie (optioneel)" onchange="match.players[${i}].note=this.value" style="width:100%;padding:9px;border:2px solid var(--bdr);border-radius:8px;font-size:14px">
    </div>`; }).join('');
  openModal(`<h3>${icI(IC.edit)} Spelernotities</h3>
    <div>${rows}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="saveEditPlayers()">${icI(IC.check)} Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Enkel de rugnummers van deze wedstrijd, los van modalEditPlayers: daar kan je ook spelers
// verwijderen of van lijn wisselen, en dat wil je op een afgewerkte wedstrijd niet — events en
// statistieken hangen eraan. Een nummer is een label, dus dat is wél veilig aanpasbaar, ook
// achteraf. "Alles wissen" is er voor de ploeg die overstapt naar spelen zonder vaste nummers.
function modalMatchNumbers() {
  const rows = sortedByName(match.players).map(p => {
    const i = match.players.indexOf(p);
    return `<div class="selrow">
      <input type="number" class="pn-inp" value="${esc(p.number || '')}" placeholder="" inputmode="numeric" aria-label="Rugnummer van ${esc(p.name)}" onchange="match.players[${i}].number=this.value.trim()">
      <div class="nm">${esc(p.name || 'Speler')}<small>${esc(p.line || '')}</small></div>
    </div>`; }).join('');
  openModal(`<h3>${icI(IC.shirt)} Rugnummers</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Alleen voor deze wedstrijd — het rooster van je ploeg blijft ongewijzigd. Laat een vakje leeg als die speler geen nummer had.</p>
    ${selRowHead('Speler · lijn')}
    <div>${rows}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="saveMatchNumbers()">${icI(IC.check)} Opslaan</button>
    <button class="btn btn-pale" style="margin-top:8px" onclick="clearMatchNumbers()">Alle nummers wissen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function clearMatchNumbers() {
  match.players.forEach(p => { p.number = ''; });
  modalMatchNumbers(); // opnieuw tekenen met lege vakjes; opslaan blijft een aparte tik
}
async function saveMatchNumbers() {
  await dbSave(match);
  closeModal(); render();
  showToast('Rugnummers van deze wedstrijd bijgewerkt.', 'ok');
}
function modalEditPlayers() {
  // Terugval op 8v8 bij een onbekende wedstrijdvorm (zie editMatchWizard): dit zijn enkel de lijnen
  // voor het keuzelijstje, en zonder die terugval crasht "Spelers bewerken" op zo'n wedstrijd.
  const lines = matchLines(match);
  const rows = match.players.map((p,i) => `
    <div class="pirow">
      <input type="number" value="${esc(p.number)}" placeholder="#" onchange="match.players[${i}].number=this.value" inputmode="numeric">
      <input type="text" value="${esc(p.name)}" placeholder="Naam" onchange="match.players[${i}].name=this.value">
      <button class="delbtn" onclick="removePlayer('${p.id}')">×</button>
    </div>
    <div class="pirow2">
      <select onchange="match.players[${i}].line=this.value">${lines.map(l=>`<option value="${esc(l)}" ${p.line===l?'selected':''}>${lineLabel(l)}</option>`).join('')}</select>
      <input type="number" value="${esc(p.posNum)}" placeholder="pos#" onchange="match.players[${i}].posNum=this.value" inputmode="numeric">
    </div>
    <input type="text" value="${esc(p.note||'')}" placeholder="Notitie over deze speler (optioneel)" onchange="match.players[${i}].note=this.value" style="width:100%;padding:9px;border:2px solid var(--bdr);border-radius:8px;font-size:14px;margin-bottom:6px">
    <div style="margin:0 0 14px"><span class="start-chip ${match.captainId===p.id?'on':''}" onclick="setCaptain('${p.id}')">${icI(IC.captain)} Kapitein</span></div>`).join('');
  openModal(`<h3>${icI(IC.edit)} Spelers bewerken</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Wijzigt enkel deze wedstrijd — het spelersrooster van je ploeg blijft ongewijzigd.${match.tournamentId ? ' Wie je hier toevoegt, komt ook in de <b>tornooiselectie</b> van vandaag: anders zou hij speelminuten krijgen zonder in de selectie te staan.' : ''}</p>
    <div id="edit-rows">${rows}</div>
    <button class="btn btn-pale" onclick="addPlayerToMatch()" style="margin-top:6px">+ Speler toevoegen</button>
    <button class="btn btn-green" style="margin-top:12px" onclick="saveEditPlayers()">${icI(IC.check)}Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function addPlayerToMatch() {
  const lines = matchLines(match);
  match.players.push({ id:uid(), name:'', number:'', line:lines[Math.min(1,lines.length-1)], posNum:'', starting:false, onField:false });
  modalEditPlayers();
}
function removePlayer(id) {
  match.players = match.players.filter(p => p.id !== id);
  if (match.captainId === id) match.captainId = null;
  modalEditPlayers();
}
function setCaptain(id) {
  match.captainId = (match.captainId === id) ? null : id;
  modalEditPlayers();
}
// Een speler die je hier toevoegt zit enkel in m.players. Bij een TORNOOIwedstrijd komen de
// selectiegroepen uit het tornooi (sinds v0.7.5), dus zo'n speler kreeg wel speelminuten, doelpunten
// en een plek in de PDF, maar stond in géén enkele groep — niet als geselecteerd, niet als NB, niet
// als niet-geselecteerd. Hij wordt daarom mee in de dagselectie gezet.
function syncMatchPlayersToTournamentSquad(m) {
  const t = m.tournamentId ? tournamentById(m.tournamentId) : null;
  if (!t) return [];
  const list = tournamentSquadList(t).map(s => Object.assign({}, s));
  const kent = p => list.some(s => (s.srcId && p.rosterId && s.srcId === p.rosterId)
    || (s.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase());
  const nieuw = (m.players || []).filter(p => (p.name || '').trim() && !kent(p));
  if (!nieuw.length) return [];
  nieuw.forEach(p => list.push({
    pid: uid(), srcId: p.rosterId || null, globalId: p.globalId || null,
    // addedAt: zo weten de verslagen van wedstrijden die al gespeeld waren dat hij er toen nog niet
    // bij was (zie selectionGroups in detail-pdf.js).
    addedAt: Date.now(),
    name: p.name, number: p.number || '', pos: '', side: '', sel: 'mee', absentReason: '',
    // Bewust géén gastlabel: we weten niet of dit een gast is of een eigen speler die gewoon niet
    // in de dagselectie stond. Dat label zet je zelf in de tornooiselectie.
    guest: false, fromName: '',
  }));
  t.squad = { players: list };
  saveTournament(t);
  if (currentTournament && currentTournament.id === t.id) currentTournament = t;
  return nieuw.map(p => p.name);
}
async function saveEditPlayers() {
  match.players.forEach(p => { if (!p.name) p.name = 'Speler'; });
  syncKeeper(); // keeper volgt automatisch de doellijn
  const toegevoegd = syncMatchPlayersToTournamentSquad(match);
  await dbSave(match);
  closeModal();
  render();
  if (toegevoegd.length) {
    showToast(`${toegevoegd.join(', ')} ${toegevoegd.length === 1 ? 'is' : 'zijn'} ook aan de tornooiselectie toegevoegd.`, 'ok');
  }
}

