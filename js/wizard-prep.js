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
  const teamTrainers = team ? (team.trainers || []).filter(t => t.name) : [];
  const md = teamMatchDefaults(team);
  wiz = {
    step: 1, teamId: (team || {}).id || '', opponent: '', subteam: '',
    date: now.toISOString().split('T')[0],
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    location: 'Thuis', matchType: md.matchType, periodKey: 'kwarten', quarterDuration: 15,
    competition: 'Competitie', matchday: '', referee: '', jersey: '', venue: '',
    trainer: teamTrainers.length ? teamTrainers[0].name : '',
    responsible: team ? (team.responsible || '') : '',
    trainerIsOther: false,
    pool: [], poolTeamId: null, formationIndex: md.formationIndex, selPlace: null,
  };
}
function wizTeamChange() {
  captureStep1();
  const team = teamById(wiz.teamId);
  if (team) {
    const trainers = (team.trainers || []).filter(t => t.name);
    wiz.trainer = trainers.length ? trainers[0].name : '';
    wiz.trainerIsOther = false;
    wiz.responsible = team.responsible || '';
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
function wizTrainerSelChange(val) {
  wiz.trainerIsOther = val === '_other';
  if (!wiz.trainerIsOther) wiz.trainer = val;
  const fg = document.getElementById('n-trainer-other-fg');
  if (fg) fg.style.display = wiz.trainerIsOther ? '' : 'none';
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
function basisCount() { return wiz.pool.filter(p => p.sel === 'basis').length; }
function bankCount() { return wiz.pool.filter(p => p.sel === 'bank').length; }
function wizTypeChange() { wiz.matchType = document.getElementById('n-type').value; wiz.formationIndex = 0; wiz._typeTouched = true; wiz.pool.forEach(p => p.slot = null); }
function wizSetLoc(loc, btn) { wiz.location = loc; document.querySelectorAll('#n-loc-tgl button').forEach(b => b.classList.remove('act')); btn.classList.add('act'); }

function renderNew() {
  if (!wiz) startWizard();
  if (wiz.trnMode) {
    const t = tournamentById(wiz.tournamentId);
    const trnTitles = { 1: 'Tegenstander', 2: 'Selectie', 3: 'Opstelling' };
    const pills = [1, 2, 3].map(n => `<div class="step-pill ${wiz.step===n?'on':wiz.step>n?'done':''}"></div>`).join('');
    const body = wiz.step === 1 ? renderTrnMatchStep1() : wiz.step === 2 ? wizStep2() : wizStep3();
    const backAction = wiz.step === 1 ? `wizLeave()` : `wizBack()`;
    return `<div class="hdr"><button class="back" onclick="${backAction}">‹</button><h1>Tornooimatch${t?' · '+esc(t.name):''} · ${trnTitles[wiz.step]}</h1></div>
      <div class="steps">${pills}</div>
      <div class="content">${body}</div>`;
  }
  const titles = { 1: 'Wedstrijd', 2: 'Selectie', 3: 'Opstelling' };
  const pills = [1, 2, 3].map(n => `<div class="step-pill ${wiz.step===n?'on':wiz.step>n?'done':''}"></div>`).join('');
  const body = wiz.step === 1 ? wizStep1() : wiz.step === 2 ? wizStep2() : wizStep3();
  return `<div class="hdr"><button class="back" onclick="${wiz.step===1 ? 'wizLeave()' : 'wizBack()'}">‹</button><h1>Nieuwe wedstrijd · ${titles[wiz.step]}</h1></div>
    <div class="steps">${pills}</div>
    <div class="content">${body}</div>`;
}
function wizStep1() {
  const teams = getTeamsV2();
  const teamSel = teams.length
    ? `<select id="n-team-sel" onchange="wizTeamChange()">${teams.map(t => `<option value="${t.id}" ${wiz.teamId===t.id?'selected':''}>${esc(t.name)} (${t.players.length})</option>`).join('')}</select>`
    : `<div style="font-size:14px;color:var(--txt2);padding:6px 0">Nog geen ploegen. <a onclick="go('teams')" style="color:var(--grn);font-weight:700;cursor:pointer">Maak eerst een ploeg aan →</a></div>`;
  const selectedTeam = teamById(wiz.teamId) || (teams.length ? teams[0] : null);
  const teamTrainers = selectedTeam ? (selectedTeam.trainers || []).filter(t => t.name) : [];
  const trainerOpts = teamTrainers.map(t => `<option value="${esc(t.name)}" ${!wiz.trainerIsOther&&wiz.trainer===t.name?'selected':''}>${esc(t.name)}</option>`).join('');
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
        <div class="fg"><label>Trainer</label>
          <select id="n-trainer-sel" onchange="wizTrainerSelChange(this.value)">
            ${trainerOpts}
            <option value="_other" ${wiz.trainerIsOther?'selected':''}>Andere trainer…</option>
          </select></div>
        <div class="fg" id="n-trainer-other-fg" style="${wiz.trainerIsOther?'':'display:none'}">
          <label>Naam trainer</label>
          <input id="n-trainer-other" type="text" value="${esc(wiz.trainer||'')}" placeholder="Naam trainer" autocomplete="off">
        </div>
        <div class="fg"><label>Ploegverantwoordelijke</label>
          <input id="n-responsible" type="text" value="${esc(wiz.responsible||'')}" placeholder="Naam (optioneel)" autocomplete="off">
        </div>
      </details>
    </div>
    <button class="btn btn-green" onclick="wizNext()">Volgende → Selectie</button>
    <button class="btn btn-orgpale" onclick="finishStep1Only()" style="margin-top:8px">${icI(IC.calendar)} Plannen zonder selectie</button>`;
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
  const trainerSel = document.getElementById('n-trainer-sel');
  if (trainerSel) { wiz.trainerIsOther = trainerSel.value === '_other'; if (!wiz.trainerIsOther) wiz.trainer = trainerSel.value; }
  const trainerOther = document.getElementById('n-trainer-other');
  if (wiz.trainerIsOther && trainerOther) wiz.trainer = trainerOther.value.trim();
  wiz.responsible = (v('n-responsible') || '').trim();
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
function wizBack() { if (wiz.step > 1) { wiz.step--; render(); } }
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
    // Méér dan het veldaantal kan niet, maar MINDER moet wel kunnen: met 7 beschikbare spelers
    // voor 8v8 speel je gewoon met 7. Voordien blokkeerde een exact-aantal-eis dit scherm volledig,
    // en bij een tornooiwedstrijd was er geen uitweg (de pool is dan de dagselectie en de knoppen
    // om iemand bij te halen staan verborgen). Stap 3 en finishWizard eisen enkel dat elke
    // aangeduide basisspeler een plaats heeft, niet dat de formatie vol is.
    const need = fieldSizeW(), bc = basisCount();
    if (bc > need) { showToast(`Je kan maar ${need} basisspelers opstellen in ${wiz.matchType} (nu ${bc}).`, 'err'); return; }
    if (bc === 0) { showToast('Duid minstens één basisspeler aan, of gebruik "Plannen zonder opstelling".', 'err'); return; }
    if (bc < need) {
      showConfirm(`Je hebt <b>${bc} van de ${need}</b> basisspelers aangeduid. Verder met ${bc}? Er blijft dan een positie leeg op het veld.`,
        () => { wiz.step = 3; render(); }, 'Verder', 'btn-green');
      return;
    }
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
  p.sel = (p.sel === val) ? 'none' : val;
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
  const isSelected = p.sel === 'basis' || p.sel === 'bank';
  // Tornooiwedstrijd: enkel Basis · Wissel. Beschikbaarheid (NB) hoort bij de tornooiselectie —
  // wie NB is, gaat niet mee en staat hier dus ook niet in de lijst.
  const trn = !!wiz.trnMode;
  return `<div class="selrow">
    <input type="number" class="pn-inp" value="${esc(p.number)}" placeholder="" onchange="setPoolNum('${p.pid}',this.value)" inputmode="numeric" aria-label="Rugnummer">
    ${isSelected ? `<button class="cap-btn ${isCap?'on':''}" onclick="setWizCaptain('${p.pid}')" title="Kapitein aanduiden">${icI(IC.captain)}</button>` : '<span style="width:22px;flex-shrink:0"></span>'}
    <div class="nm">${esc(p.name)}${p.guest ? '<span class="guest-badge">gast</span>' : ''}<small>${posDisplay(p) || '—'}</small>
      ${(!trn && p.sel === 'absent') ? absentReasonSelect(p.pid, p.absentReason || '', 'setAbsentReason') : ''}</div>
    <div class="seg">
      <button class="${p.sel==='basis'?'basis':''}" onclick="setSel('${p.pid}','basis')">Basis</button>
      <button class="${p.sel==='bank'?'bank':''}" onclick="setSel('${p.pid}','bank')">Wissel</button>
      ${trn ? '' : `<button class="${p.sel==='absent'?'absent':''}" onclick="setSel('${p.pid}','absent')" title="Niet beschikbaar — telt mee in het aanwezigheids-%">NB</button>`}
    </div></div>`;
}
function setWizCaptain(pid) { wiz.captainPid = (wiz.captainPid === pid) ? null : pid; render(); }
function wizStep2() {
  const own = wiz.pool.filter(p => !p.guest), guests = wiz.pool.filter(p => p.guest);
  const team = teamById(wiz.teamId);
  const need = fieldSizeW(), bc = basisCount();
  const absentCount = wiz.pool.filter(p => p.sel === 'absent').length;
  return `
    <div class="card" style="display:flex;gap:10px;text-align:center">
      <div style="flex:1"><div style="font-size:22px;font-weight:900;color:${bc===need?'var(--grn)':'var(--org)'}">${bc}/${need}</div><div style="font-size:11px;color:var(--txt2)">BASIS</div></div>
      <div style="flex:1"><div style="font-size:22px;font-weight:900">${bankCount()}</div><div style="font-size:11px;color:var(--txt2)">WISSEL</div></div>
      ${absentCount ? `<div style="flex:1"><div style="font-size:22px;font-weight:900;color:var(--rd)">${absentCount}</div><div style="font-size:11px;color:var(--txt2)">NIET BESCH.</div></div>` : ''}
    </div>
    ${(() => { const nums = wiz.pool.filter(p => (p.sel === 'basis' || p.sel === 'bank') && (p.number || '').toString().trim()).map(p => p.number.toString().trim()); const dup = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))]; return dup.length ? `<div class="backup-banner" style="background:var(--rdp);color:var(--rd);border-color:#fca5a5">${icI(IC.warn)} Dubbel rugnummer bij geselecteerde spelers: ${dup.map(esc).join(', ')}</div>` : ''; })()}
    <div style="font-size:12px;color:var(--txt2);padding:6px 2px 2px">${wiz.trnMode
      ? `<b>Niets aanduiden = niet geselecteerd voor deze wedstrijd</b> (telt nergens in mee). Kies anders per speler <b>Basis</b> (start) of <b>Wissel</b>; nog eens op dezelfde knop tikken maakt de keuze weer ongedaan. Enkel wie meegaat naar het tornooi staat in deze lijst — <b>niet beschikbaar (NB)</b> geef je in bij de selectie van het tornooi zelf.`
      : `<b>Niets aanduiden = niet geselecteerd</b> (telt nergens in mee). Kies anders per speler <b>Basis</b> (start), <b>Wissel</b> of <b style="color:var(--rd)">NB</b> = niet beschikbaar (telt mee in het aanwezigheids-%); nog eens op dezelfde knop tikken maakt de keuze weer ongedaan. Bij <b>NB</b> kan je een reden kiezen; <b>speelt elders</b> laat die wedstrijd niet als gemist tellen.`} Bij geselecteerde spelers verschijnt een kapiteinsicoontje — klik erop om de kapitein aan te duiden.</div>
    <div class="sec">${esc(team ? team.name : 'Ploeg')}</div>
    <div class="card">${own.length ? selRowHead('Speler · voorkeurspositie', true) + own.map(selRow).join('') : '<p style="color:var(--txt2);font-size:14px">Deze ploeg heeft nog geen spelers. Voeg ze toe via ' + icI(IC.players) + ' Ploegen.</p>'}</div>
    ${guests.length ? `<div class="sec">Gastspelers</div><div class="card">${selRowHead('Speler · van welke ploeg', true)}${guests.map(selRow).join('')}</div>` : ''}
    ${wiz.noGuests ? '' : `<div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-orgpale" onclick="addGuestsModal()">+ Speler van andere ploeg</button>
      <button class="btn btn-pale" onclick="addLoosePlayerModal()">+ Losse speler</button>
    </div>`}
    <div class="wiz-nav">
      <button class="btn btn-gray" onclick="wizBack()">← Vorige</button>
      <button class="btn btn-green" onclick="wizNext()">Volgende →</button>
    </div>`;
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
function setFormation(idx) { wiz.formationIndex = parseInt(idx); wiz.pool.forEach(p => p.slot = null); wiz.selPlace = null; render(); }
function selectPlace(pid) { wiz.selPlace = (wiz.selPlace === pid) ? null : pid; render(); }
function placeSlot(i) {
  const occupied = wiz.pool.find(p => p.sel === 'basis' && p.slot === i);
  if (wiz.selPlace) {
    const sp = wiz.pool.find(p => p.pid === wiz.selPlace);
    if (sp) {
      if (occupied === sp) {
        // Zelfde positie opnieuw aangetikt → speler van het veld halen
        sp.slot = null;
      } else {
        // Bezette positie: wissel van plek als de geselecteerde speler op het veld stond,
        // anders gaat de verdrongen speler terug naar "Nog te plaatsen".
        const prevSlot = sp.slot;
        if (occupied) occupied.slot = (prevSlot != null) ? prevSlot : null;
        sp.slot = i;
      }
      wiz.selPlace = null;
    }
  } else if (occupied) {
    // Speler op het veld aantikken → selecteren om te verplaatsen of te wisselen
    wiz.selPlace = occupied.pid;
  }
  render();
}
function autoPlace() {
  const form = FORMATIONS[wiz.matchType][wiz.formationIndex];
  const basis = wiz.pool.filter(p => p.sel === 'basis');
  basis.forEach(p => p.slot = null);
  const used = {}, slotUsed = {};
  // Spelers met een verfijnde voorkeur eerst op de best passende slot van hun lijn zetten, vóór de
  // gewone lijn-match hieronder (die geen onderscheid maakt binnen een lijn). Waarop de verfijning
  // slaat, staat in POSITIONS: bij een verdediger of vleugelspeler is het de breedte (x-as, links/
  // rechts), bij een middenvelder de diepte (y-as; y=90 ligt aan eigen doel, dus "verdedigend" is
  // de hoogste y). Een spits zonder verdere keuze krijgt de meest centrale aanvalsslot.
  const kies = (kandidaten, axis, keuze) => {
    if (axis === 'y') {
      if (keuze === 'verdedigend') return kandidaten.reduce((a, b) => b.s.y > a.s.y ? b : a);
      if (keuze === 'aanvallend') return kandidaten.reduce((a, b) => b.s.y < a.s.y ? b : a);
      const ys = kandidaten.map(c => c.s.y), mid = (Math.min(...ys) + Math.max(...ys)) / 2;
      return kandidaten.reduce((a, b) => Math.abs(b.s.y - mid) < Math.abs(a.s.y - mid) ? b : a);
    }
    if (keuze === 'links')  return kandidaten.reduce((a, b) => b.s.x < a.s.x ? b : a);
    if (keuze === 'rechts') return kandidaten.reduce((a, b) => b.s.x > a.s.x ? b : a);
    return kandidaten.reduce((a, b) => Math.abs(b.s.x - 50) < Math.abs(a.s.x - 50) ? b : a);
  };
  const vrije = line => form.slots.map((s, i) => ({ s, i })).filter(({ s, i }) => s.line === line && !slotUsed[i]);
  const plaats = (p, kandidaten, axis, keuze) => {
    const best = kies(kandidaten, axis, keuze);
    p.slot = best.i; used[p.pid] = 1; slotUsed[best.i] = 1;
  };
  // Een uitgesproken keuze (links/rechts, verdedigend/aanvallend) gaat vóór "centraal": wie een
  // hoek van het veld wil, is het meest beperkt, en wat overblijft is per definitie het midden.
  // Zonder die volgorde bepaalde de volgorde in de spelerslijst de uitkomst.
  const extreem = s => s === 'links' || s === 'rechts' || s === 'verdedigend' || s === 'aanvallend';
  const uitgesprokenEerst = (a, b) => (extreem(b.side) ? 1 : 0) - (extreem(a.side) ? 1 : 0);
  ['Verdediger', 'Middenvelder'].forEach(pos => {
    const m = POSITIONS[pos];
    basis.filter(p => normPos(p.pos) === pos && posSideValid(p.pos, p.side)).sort(uitgesprokenEerst)
      .forEach(p => { const k = vrije(m.line); if (k.length) plaats(p, k, m.axis, p.side); });
  });
  // Aanvalslijn apart, want daar zitten twee posities in één lijn: een vleugelspeler kan uitwijken
  // naar het middenveld, een spits niet. Zijn er meer kandidaten dan aanvalsslots (bv. de dubbele
  // ruit in 8v8 heeft er maar één), dan schuift de vleugelspeler op naar de breedst gelegen vrije
  // middenveldslot — anders pikte hij de enige aanvalsslot en belandde de spits ergens op de rest.
  const vleugels = basis.filter(p => normPos(p.pos) === 'Vleugelspeler');
  const spitsen = basis.filter(p => normPos(p.pos) === 'Spits');
  let overschot = Math.max(0, vleugels.length + spitsen.length - vrije('Aanval').length);
  while (overschot > 0 && vleugels.length) {
    const p = vleugels.pop();
    const k = vrije('Middenveld');
    if (k.length) plaats(p, k, 'x', p.side);
    overschot--;
  }
  vleugels.sort(uitgesprokenEerst).forEach(p => { const k = vrije('Aanval'); if (k.length) plaats(p, k, 'x', p.side); });
  spitsen.forEach(p => { const k = vrije('Aanval'); if (k.length) plaats(p, k, 'x', 'centraal'); });
  form.slots.forEach((s, i) => { if (slotUsed[i]) return; const c = basis.find(p => p.slot == null && !used[p.pid] && posLine(p.pos) === s.line); if (c) { c.slot = i; used[c.pid] = 1; slotUsed[i] = 1; } });
  form.slots.forEach((s, i) => { if (basis.some(p => p.slot === i)) return; const c = basis.find(p => p.slot == null && !used[p.pid]); if (c) { c.slot = i; used[c.pid] = 1; } });
  wiz.selPlace = null; render();
}
function clearPlacement() { wiz.pool.forEach(p => p.slot = null); wiz.selPlace = null; render(); }
function wizPitch(form) {
  const slots = form.slots.map((s, i) => {
    const posNum = computePosNum(wiz.matchType, i, form.slots);
    const p = wiz.pool.find(pp => pp.sel === 'basis' && pp.slot === i);
    if (p) return `<div class="pslot filled ${s.line==='Doel'?'gk':''}" style="left:${s.x}%;top:${s.y}%${wiz.selPlace===p.pid?';box-shadow:0 0 0 3px var(--org)':''}" onclick="placeSlot(${i})">${posNum}<span class="pslot-lbl">${esc(p.name)}</span></div>`;
    return `<div class="pslot" style="left:${s.x}%;top:${s.y}%" onclick="placeSlot(${i})">${posNum}</div>`;
  }).join('');
  return `<div class="pitch">${pitchLines()}${slots}</div>`;
}
function wizStep3() {
  const forms = FORMATIONS[wiz.matchType] || [];
  const form = forms[wiz.formationIndex] || forms[0];
  const unplaced = wiz.pool.filter(p => p.sel === 'basis' && p.slot == null);
  return `
    <div class="fg"><label>Formatie</label>
      <select onchange="setFormation(this.value)">${forms.map((f, i) => `<option value="${i}" ${i===wiz.formationIndex?'selected':''}>${f.name}</option>`).join('')}</select></div>
    <div class="card">${wizPitch(form)}
      <div class="field-legend">Klik op een speler hieronder en dan op een positie op het veld om hem te plaatsen. Klik een speler op het veld en dan een andere positie om te verplaatsen of van plek te wisselen. Klik tweemaal dezelfde positie om de speler te verwijderen.</div>
    </div>
    <div class="sec">Nog te plaatsen (${unplaced.length})</div>
    <div class="place-chips">${unplaced.length ? unplaced.map(p => `<span class="place-chip ${wiz.selPlace===p.pid?'sel':''}" onclick="selectPlace('${p.pid}')">${numSpan(p, 'pcn')}${esc(p.name)}</span>`).join('') : `<span style="color:var(--grn);font-weight:700;font-size:14px">${icI(IC.check)} Iedereen geplaatst</span>`}</div>
    <div class="wiz-nav" style="margin-top:14px">
      <button class="btn btn-gray btn-sm" style="width:auto" onclick="autoPlace()">${icI(IC.auto)} Auto-plaats</button>
      <button class="btn btn-gray btn-sm" style="width:auto" onclick="clearPlacement()">${icI(IC.undo)} Wissen</button>
    </div>
    <div class="wiz-nav">
      <button class="btn btn-gray" onclick="wizBack()">← Vorige</button>
      <button class="btn btn-green" onclick="confirmStartNow()">${icI(IC.ball)} ${wiz.editId?'Opslaan & starten':'Nu starten'}</button>
    </div>
    <button class="btn btn-orgpale" onclick="finishWizard(false)" style="margin-top:8px">${icI(IC.calendar)} ${wiz.editId?'Opslaan (gepland)':'Plannen voor later'}</button>`;
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
  const toUndo = m.events.filter(e =>
    (e.type === 'substitution' || e.type === 'posSwap') && e.quarterNum != null &&
    !(e.quarterNum < qNum || (e.atBreak && e.quarterNum === qNum))
  ).sort((a, b) => b.gameTimeMs - a.gameTimeMs);
  for (const e of toUndo) {
    if (e.type === 'substitution' && e.playerInId) {
      // posBefore herstellen i.p.v. blind naar "geen positie": een speler die al eerder op
      // het veld stond en later terugkeert (meermaals in/uit wisselen) mag zijn vorige
      // stint-positie niet verliezen — anders belandt hij in de generieke "geen x/y"-fallback
      // (evenredig verspreid over de lijn), zichtbaar als een bolletje tussen twee posities in.
      posMap[e.playerInId] = e.posBefore ? { ...e.posBefore } : { x: undefined, y: undefined, line: undefined, posNum: undefined };
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
  if (total === 1) return renderPitch(m, m.players.filter(p => p.starting), captainAtStartOfQuarter(m, 1), m.quarters.length ? 1 : undefined);
  const slides = Array.from({length: total}, (_, i) => {
    const ps = playersAtPeriodStart(m, i + 1);
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
function confirmStartNow() {
  if (wiz.editId) { finishWizard(true); return; }
  openModal(`
    <h3>${icI(IC.live)} Wedstrijd nu starten?</h3>
    <p style="margin:0 0 16px;color:var(--txt2)">
      Als je de wedstrijd <strong>nu start</strong>, wordt ze onmiddellijk <strong>live</strong> zichtbaar voor alle kijkers.<br><br>
      Doe dit enkel als de wedstrijd <strong>binnenkort echt afgefloten wordt</strong>. Je kan dit achteraf <strong>niet ongedaan maken</strong>.
    </p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-green" onclick="closeModal();finishWizard(true)">${icI(IC.live)} Ja, wedstrijd starten</button>
      <button class="btn btn-gray" onclick="closeModal()">Annuleren</button>
    </div>
  `);
}
async function finishWizard(startNow) {
  const form = FORMATIONS[wiz.matchType][wiz.formationIndex];
  const unplaced = wiz.pool.filter(p => p.sel === 'basis' && p.slot == null);
  if (unplaced.length) { showToast(`Plaats nog ${unplaced.length} speler(s) op het veld.`, 'err'); return; }
  const team = teamById(wiz.teamId);
  const existing = wiz.editId ? await dbGet(wiz.editId) : null;
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
  const starters = wiz.pool.filter(p => p.sel === 'basis').map(p => { const s = form.slots[p.slot]; return Object.assign({ _pid: p.pid, id: resolvePlayerId(p), rosterId: p.srcId || null, globalId: p.srcGlobalId || null, name: p.name || 'Speler', number: p.number || '', line: s.line, posNum: computePosNum(wiz.matchType, p.slot, form.slots), starting: true, onField: true, x: s.x, y: s.y }, gastVeld(p)); });
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
  wiz = null; await dbSave(m); match = m;
  if (m.tournamentId) currentTournament = tournamentById(m.tournamentId);
  await go(startNow ? 'live' : 'prep', m.id);
}
// Een geplande wedstrijd opnieuw in de wizard openen om te bewerken.
function editMatchWizard(m) {
  // Ploeg bij voorkeur via het stabiele m.teamId (sinds v0.5.34) — zoeken op naam breekt na een
  // ploeg-hernoeming (pool zonder roster + teamId-koppeling die verloren gaat bij opslaan).
  const team = (m.teamId && teamById(m.teamId)) || getTeamsV2().find(t => t.name === m.teamName);
  const fi = Math.max(0, (FORMATIONS[m.matchType] || []).findIndex(f => f.name === m.formation));
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
    return { pid: uid(), srcId: p.rosterId || null, srcGlobalId: p.globalId || null, name: p.name, number: p.number || '', pos: (rp && rp.pos) || p.line || '', side: rp ? (rp.side || '') : '', fromName: p.guest ? (p.fromName || '') : m.teamName, guest: !!p.guest, sel: p.starting ? 'basis' : 'bank', slot: null, _x: p.x, _y: p.y };
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
    teamId: team ? team.id : '', opponent: m.opponent, subteam: m.subteam || '', date: m.date, time: m.time, location: m.location,
    matchType: m.matchType, periodKey: m.periodKey, quarterDuration: m.quarterDuration,
    competition: m.competition || 'Competitie', matchday: m.matchday || '', referee: m.referee || '', jersey: m.jersey || '', venue: m.venue || '',
    trainer: m.trainer || '', responsible: m.responsible || '', trainerIsOther: false,
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
  const form = FORMATIONS[m.matchType][fi];
  wiz.pool.filter(p => p.sel === 'basis').forEach(p => { const idx = form.slots.findIndex(s => s.x === p._x && s.y === p._y); p.slot = idx >= 0 ? idx : null; });
  go('new');
}

function startSelectieWizard() {
  const m = match;
  const team = m.teamId ? teamById(m.teamId) : getTeamsV2().find(t => t.name === m.teamName);
  const fi = Math.max(0, (FORMATIONS[m.matchType] || []).findIndex(f => f.name === m.formation));
  wiz = {
    step: 2, editId: m.id, editStatus: m.status, teamNameFallback: m.teamName,
    teamId: team ? team.id : '', noGuests: true,
    opponent: m.opponent, subteam: m.subteam || '', date: m.date, time: m.time, location: m.location,
    matchType: m.matchType, periodKey: m.periodKey, quarterDuration: m.quarterDuration,
    numQuarters: m.numQuarters,
    competition: m.competition || 'Competitie', matchday: m.matchday || '', referee: m.referee || '',
    jersey: m.jersey || '', venue: m.venue || '',
    trainer: m.trainer || '', responsible: m.responsible || '', trainerIsOther: false,
    formationIndex: fi, selPlace: null, pool: [],
  };
  if (m.tournamentId) {
    wiz.trnMode = true;
    wiz.tournamentId = m.tournamentId;
    const t = tournamentById(m.tournamentId);
    const tTeam = t ? teamById(t.teamId) : null;
    // Enkel wie meegaat naar het tornooi komt in de pool: NB-spelers gaven we al bij de
    // tornooiselectie op en zijn per wedstrijd niet meer te kiezen. Allen starten op 'none'
    // (de coach kiest basis/bank per wedstrijd).
    wiz.pool = tournamentSquadMee(t).map(s => ({
      pid: uid(), srcId: s.srcId, srcGlobalId: s.globalId || null,
      name: s.name, number: s.number || '', pos: s.pos || '', side: s.side || '',
      // Gasten zitten sinds v0.9.4 in de dagselectie zelf; hun herkomst en gastvlag overnemen
      // i.p.v. iedereen als eigen speler te behandelen.
      fromName: s.guest ? (s.fromName || '') : (tTeam ? tTeam.name : ''), guest: !!s.guest,
      sel: 'none', slot: null,
    }));
    wiz.poolTeamId = t ? t.teamId : wiz.teamId;
  } else {
    wiz.poolTeamId = wiz.teamId;
    buildPool();
  }
  go('new');
}

// ===================== GEPLANDE WEDSTRIJD (PREP) =====================
function renderPrep() {
  const m = match;
  if (!m) return '<div class="content"><p>Niet gevonden.</p></div>';
  const ro = !!(m.fromCloud && (!isAdmin || viewerMode)); // kijker: alleen-lezen
  const starters = m.players.filter(p => p.starting), bench = m.players.filter(p => !p.starting);
  const info = [['Ploeg-label', m.subteam], ['Formatie', m.formation], ['Trainer', m.trainer], ['Ploegverantwoordelijke', m.responsible], ['Soort', m.competition], ['Speeldag', m.matchday], ['Scheidsrechter', m.referee], ['Truikleur', m.jersey], ['Locatie', m.venue]].filter(([k, v]) => v);
  const prepBack = m.tournamentId ? `goTournament('${m.tournamentId}')` : `go('matches')`;
  return `
  <div class="hdr"><button class="back" onclick="${prepBack}">‹</button>
    <div><h1>${matchTitle(m)}</h1><div class="hdr-sub">${icI(IC.calendar)} Gepland · ${m.location} · ${matchWhen(m)} · ${m.matchType}</div></div>
  </div>
  <div class="content">
    ${ro ? `<div class="viewer-banner">${icI(IC.eye)} Je kijkt mee — deze wedstrijd is gepland</div>` : `${(!m.players || !m.players.length) ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24">${icI(IC.warn)} Selectie nog niet ingegeven — vul de spelers in voor je de wedstrijd start.</div>` : ''}<button class="btn btn-green" onclick="startPlanned()">${icI(IC.live)} Wedstrijd starten</button>
    <div class="wiz-nav" style="margin-top:8px">
      <button class="btn btn-pale" onclick="editMatchWizard(match)">${icI(IC.edit)} Bewerken</button>
      <button class="btn btn-orgpale" onclick="${(!m.players || !m.players.length) ? 'startSelectieWizard()' : 'modalEditPlayers()'}">${icI(IC.players)} Selectie &amp; opstelling</button>
    </div>
    <button class="btn btn-gray" style="margin-top:8px" onclick="modalQuickResult()">${icI(IC.timer)} Snel resultaat invoeren</button>`}
    <div class="sec">Info</div>
    <div class="card">${info.length ? info.map(([k, v]) => `<div class="stat-row"><span style="color:var(--txt2);min-width:120px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">Geen extra info.</p>'}</div>
    <div class="sec">Opstelling (${starters.length})</div>
    <div class="card">${renderPitch(m, starters)}</div>
    <div class="sec">Bank (${bench.length})</div>
    <div class="card">${bench.length ? sortedByName(bench).map(p => `<div class="prow">${numDot(p, 'pnum pnum-off')}<div style="flex:1"><div class="pname">${esc(p.name)}</div><div class="ppos">${p.line}</div></div></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">Geen bankspelers.</p>'}</div>
    ${ro ? '' : `<button class="btn btn-pale" style="margin-bottom:8px;width:100%" onclick="cloneMatch()">${icI(IC.copy)} Gebruik als template</button><div class="danger"><button class="btn btn-red" onclick="confirmDelete()">${icI(IC.trash)} Wedstrijd verwijderen</button></div>`}
  </div>`;
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
  if (m.tournamentId) currentTournament = tournamentById(m.tournamentId);
  wiz = null; await dbSave(m); match = m;
  await go('prep', m.id);
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
  if (!match.players || !match.players.length) {
    showToast('Vul eerst de selectie en opstelling in voor je de wedstrijd start.', 'err');
    return;
  }
  // Een vergeten wedstrijd laat zijn klok op wandkloktijd doorlopen (getGameTimeMs stopt enkel bij
  // een endTime), dus na twee uur staat elke basisspeler op absurde speelminuten en is de
  // fair-play-tabel van de dag onbruikbaar. Op een tornooidag met vier wedstrijden op een rij is
  // dat het makkelijkst te maken foutje, daarom hier expliciet waarschuwen i.p.v. stil te starten.
  const others = (await dbAll()).filter(m => m.status === 'live' && m.id !== match.id && sameTeamAsMatch(m, match));
  if (others.length) {
    const o = others[0];
    const q = (o.quarters || [])[(o.quarters || []).length - 1];
    const sinds = q && q.startTime ? ` (gestart om ${new Date(q.startTime).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })})` : '';
    openModal(`<h3>${icI(IC.warn)} Nog een wedstrijd loopt</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:14px"><b>${esc(o.opponent || 'Wedstrijd')}</b>${sinds} staat nog als lopend gemarkeerd. Sluit die eerst af, anders blijft zijn klok doorlopen en krijgen die spelers veel te veel speelminuten.</p>
      <button class="btn btn-green" onclick="closeModal();go('live','${o.id}')">${icI(IC.check)} Die wedstrijd afsluiten</button>
      <button class="btn btn-orgpale" style="margin-top:8px" onclick="closeModal();doStartPlanned()">Toch starten</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  await doStartPlanned();
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
  const lines = MATCH_TYPES[match.matchType].lines;
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
  const lines = MATCH_TYPES[match.matchType].lines;
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

