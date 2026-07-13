// ===================== LIVE MATCH =====================
function renderLive() {
  if (!match) return '<div class="content"><p>Geen wedstrijd.</p></div>';
  const ro = !!(match.fromCloud && (!isAdmin || viewerMode)); // kijker: alleen-lezen
  const q = match.quarters[match.quarters.length - 1];
  const isRunning = q && q.startTime && !q.pausedAt && !q.endTime;
  const isPaused = q && q.pausedAt;
  const isBetween = match.quarterStatus === 'between';
  const isDone = match.status === 'done';
  const qNum = match.currentQuarter;
  const canStartFirst = !ro && !isDone && qNum === 0;
  const canStartNext = !ro && !isDone && isBetween && qNum < match.numQuarters;
  const isLastPeriod = qNum >= match.numQuarters;
  const canEvent = !ro && (isRunning || isPaused) && !isDone;
  const dis = canEvent ? '' : 'disabled';
  const completed = (isBetween || isDone) ? qNum : qNum - 1;
  const dots = Array.from({length: match.numQuarters}, (_,i) => {
    const cls = i < completed ? 'done' : (i === qNum-1 && !isBetween && !isDone && qNum > 0 ? 'active' : '');
    return `<div class="qdot ${cls}"></div>`;
  }).join('');
  // Kijker heeft geen "Wedstrijd"-bedieningstab → start op de Log.
  if (ro && tab === 'wedstrijd') tab = 'log';
  const syncDot = (match.fromCloud && cloudReady) ? `<span id="sync-dot" class="sync-dot ${fbConnected === false ? 'off' : 'on'}" title="${fbConnected === false ? 'Offline — wijzigingen syncen zodra er verbinding is' : 'Gesynchroniseerd met de cloud'}"></span>` : '';
  const statusLine = (isDone ? `${icI(IC.done)} Afgelopen` : (isBetween ? `${icI(IC.timer)} Pauze · klaar voor ${pSingLow(match)} ${qNum+1}` : (qNum > 0 ? `${pSing(match)} ${qNum} van ${match.numQuarters} · ${match.matchType}` : `${match.matchType} · nog niet gestart`))) + syncDot;
  const miniScore = `<div class="scoreboard" style="margin-bottom:12px">
        <div class="sb-teams"><span>${esc(isAway(match)?match.opponent:tName(match))}</span><span>${esc(isAway(match)?tName(match):match.opponent)}</span></div>
        <div class="sb-score">${scoreHtml(match,'us')}</div>
        <div class="sb-info">${statusLine}</div>
      </div>`;
  let tabContent = '';
  if (tab === 'wedstrijd') {
    tabContent = `
      <div class="scoreboard">
        <div class="sb-teams"><span>${esc(isAway(match)?match.opponent:tName(match))}</span><span>${esc(isAway(match)?tName(match):match.opponent)}</span></div>
        <div class="sb-score">${scoreHtml(match,'us')}</div>
        <div class="sb-info">${statusLine}</div>
      </div>
      <div class="timer-card">
        <div class="timer-time" id="timer-time">${timerText(match)}</div>
        ${match.quarterDuration ? `<div class="timer-progress-wrap"><div class="timer-progress-bar" id="timer-progress-bar" style="width:${Math.min(100,(getQElapsed(match)/((match.quarterDuration||1)*60000))*100).toFixed(1)}%"></div></div>` : ''}
        <div class="qdots">${dots}</div>
        <button onclick="toggleCountdown()" style="margin-top:12px;width:100%;padding:10px;border-radius:10px;border:none;font-size:14px;font-weight:700;cursor:pointer;background:${countdownOn()?'var(--grn)':'rgba(255,255,255,.15)'};color:#fff">${icI(IC.stopwatch)} ${countdownOn()?'Aftellen aan':'Optellen aan'}</button>
      </div>
      ${(!isDone && !ro) ? `<div class="qctrl">
        ${canStartFirst ? `<button class="qbtn qbtn-start" onclick="startQuarter()" style="grid-column:1/-1">${icI(IC.playFilled)} Start wedstrijd</button>` : ''}
        ${canStartNext ? `<button class="qbtn qbtn-start" onclick="startQuarter()" style="grid-column:1/-1">${icI(IC.playFilled)} Start ${pSingLow(match)} ${qNum+1}</button>` : ''}
        ${isRunning ? `<button class="qbtn qbtn-pause" onclick="pauseQuarter()">${icI(IC.pauseFilled)} Pauze</button>` : ''}
        ${isPaused ? `<button class="qbtn qbtn-resume" onclick="resumeQuarter()">${icI(IC.playFilled)} Hervatten</button>` : ''}
        ${(isRunning||isPaused) ? (isLastPeriod
            ? `<button class="qbtn qbtn-end" onclick="endMatch()">${icI(IC.finish)} Einde match</button>`
            : `<button class="qbtn qbtn-end" onclick="endPeriod()">${icI(IC.stopFilled)} Einde ${pSingLow(match)} ${qNum}</button>`) : ''}
      </div>` : ''}
      ${canStartNext ? `<div class="card" style="padding:12px;border-left:4px solid var(--org)">
        <button class="btn btn-orgpale btn-sm" style="width:100%;margin-bottom:12px" onclick="modalAddPostEvent()">${icI(IC.log)} Event toevoegen aan ${pSingLow(match)} ${qNum}</button>
        <div class="sec" style="margin-top:0">${icI(IC.swap)} Pauzewissels · klaar voor ${pSingLow(match)} ${qNum+1}</div>
        ${(match.pendingSubs&&match.pendingSubs.length) ? match.pendingSubs.map((s,i)=>`<div class="prow" style="padding:8px 0"><div style="flex:1;font-size:14px">${icI(IC.swap)} <b>${esc(pName(match,s.inId))}</b> <span style="color:var(--txt2)">voor</span> ${esc(pName(match,s.outId))}</div><button class="evt-del" onclick="removePendingSub(${i})" title="Verwijderen">×</button></div>`).join('') : `<p style="color:var(--txt2);font-size:13px">Nog geen wissels ingepland. Voeg ze nu toe; ze worden automatisch doorgevoerd bij de start van ${pSingLow(match)} ${qNum+1}.</p>`}
        <button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="modalSub()">${icI(IC.plus)} Pauzewissel toevoegen</button>
        ${(match.pendingPosSwaps&&match.pendingPosSwaps.length) ? `<div class="sec" style="margin-top:12px">${icI(IC.compass)} Positiewissels</div>${match.pendingPosSwaps.map((s,i)=>`<div class="prow" style="padding:8px 0"><div style="flex:1;font-size:14px">${icI(IC.compass)} <b>${esc(pName(match,s.pA))}</b> <span style="color:var(--txt2)">${icI(IC.compass)}</span> ${esc(pName(match,s.pB))}</div><button class="evt-del" onclick="removePendingPosSwap(${i})" title="Verwijderen">${icI(IC.close)}</button></div>`).join('')}` : ''}
        <button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="modalPosSwap()">${icI(IC.compass)} Positiewissel toevoegen</button>
      </div>` : ''}
      ${ro ? '' : (() => { const simple = simpleEventsOn(); return `<div class="evtbtns">
        <div class="evtbtn eg ${dis}" onclick="modalGoal()"><span class="ei">${IC.goal}</span><span class="el">Goal</span></div>
        <div class="evtbtn es ${dis}" onclick="modalSub()"><span class="ei">${IC.swap}</span><span class="el">Wissel</span></div>
        <div class="evtbtn ${dis}" onclick="modalPosSwap()"><span class="ei">${IC.compass}</span><span class="el">Positie</span></div>
        <div class="evtbtn ${dis}" onclick="modalFreekick()"><span class="ei">${IC.bolt}</span><span class="el">Vrije trap</span></div>
        ${(match.matchType==='3v3'||match.matchType==='5v5') ? '' : `<div class="evtbtn eyel ${dis}" onclick="modalCard('yellow')"><span class="ei">${IC.cardY}</span><span class="el">Gele kaart</span></div>
        ${simple ? '' : `<div class="evtbtn ered ${dis}" onclick="modalCard('red')"><span class="ei">${IC.cardR}</span><span class="el">Rode kaart</span></div>`}`}
        ${simple ? '' : `<div class="evtbtn epen ${dis}" onclick="modalPenalty()"><span class="ei">${IC.penalty}</span><span class="el">Penalty</span></div>
        <div class="evtbtn einj ${dis}" onclick="modalInjury()"><span class="ei">${IC.injury}</span><span class="el">Blessure</span></div>`}
        <div class="evtbtn ${dis}" onclick="modalExtra()"><span class="ei">${IC.more}</span><span class="el">Meer</span></div>
      </div>
      <button class="btn btn-pale btn-sm" style="margin-top:2px;margin-bottom:14px" onclick="toggleSimpleEvents()">${simple ? `${icI(IC.plus)} Meer opties tonen` : `${icI(IC.close)} Minder opties tonen`}</button>`; })()}
      ${(canEvent && hasUndo()) ? `<button class="btn btn-orgpale" onclick="undoLast()">${icI(IC.undo)} Laatste actie ongedaan maken</button>` : ''}
      ${isDone ? `<button class="btn btn-pale" onclick="go('detail','${match.id}')">${icI(IC.chart)} Wedstrijd bekijken</button>` : ''}
      <button class="btn btn-pale" style="margin-top:8px" onclick="shareWhatsApp(match)">${icI(IC.share)} Deel score</button>`;
  } else if (tab === 'opstelling') {
    const on = playersOnField(match), off = playersOnBench(match), absent = match.players.filter(p => p.absent), mins = calcMinutes(match);
    const absentBtn = pid => ro ? '' : `<button class="evt-del" style="margin-left:6px;flex-shrink:0" onclick="modalMarkAbsent('${pid}')" title="Niet aanwezig">×</button>`;
    tabContent = `
      ${miniScore}
      <div class="card">${renderPitch(match, on)}</div>
      <div class="card">
        <div class="sec" style="margin-top:0">Op het veld (${on.length})</div>
        ${on.length ? on.map(p => playerRowHtml(p, mins[p.id], false, getGameTimeMs(match), ro ? '' : absentBtn(p.id))).join('') : '<p style="color:var(--txt2);font-size:14px">Niemand op het veld.</p>'}
        ${off.length ? `<hr><div class="sec">Bank (${off.length})</div>${off.map(p => playerRowHtml(p, mins[p.id], true, getGameTimeMs(match), ro ? '' : absentBtn(p.id))).join('')}` : ''}
        ${absent.length ? `<hr><div class="sec" style="color:var(--rd)">Niet aanwezig (${absent.length})</div>${absent.map(p => `<div class="prow"><div class="pnum pnum-off" style="opacity:.4">${p.number||'?'}</div><div style="flex:1"><div class="pname" style="opacity:.5;text-decoration:line-through">${esc(p.name)}</div></div>${ro ? '' : `<button class="btn btn-sm btn-pale" style="font-size:11px;padding:3px 8px" onclick="doUnmarkAbsent('${p.id}')">Herstel</button>`}</div>`).join('')}` : ''}
      </div>`;
  } else {
    tabContent = miniScore + (match.events.length
      ? `<div class="card">${renderEventLog(match)}</div>`
      : `<div class="empty"><div class="ei">${IC.clipboard}</div><p>Nog geen events.</p></div>`)
      + (ro ? '' : `<button class="btn btn-pale" style="margin-top:4px" onclick="modalEditMatchInfo()">${icI(IC.clipboard)} Wedstrijdinfo bewerken</button>`);
  }

  return `
  <div class="hdr"><button class="back" onclick="confirmLeave()">‹</button>
    <div><h1>${matchTitle(match)}</h1><div class="hdr-sub">${match.location} · ${matchWhen(match)} · ${match.matchType}</div></div>
    ${(!isDone && !ro) ? `<button class="hdr-btn" onclick="endMatch()">Afsluiten</button>` : ''}
  </div>
  <div class="content">${ro ? `<div class="viewer-banner">${icI(IC.eye)} Je kijkt mee — dit scherm wordt live bijgewerkt</div>` : ''}${tabContent}</div>
  ${!ro ? `<button class="fab-note" onclick="modalQuickNote()" title="Snelle notitie">${IC.edit}</button><button class="fab-mark" onclick="markMoment()" title="Moment markeren">${IC.motm}</button>` : ''}
  <div class="ltabs">
    ${ro ? '' : `<button class="ltab ${tab==='wedstrijd'?'act':''}" onclick="setTab('wedstrijd')"><span class="ti">${IC.ball}</span>Wedstrijd</button>`}
    <button class="ltab ${tab==='opstelling'?'act':''}" onclick="setTab('opstelling')"><span class="ti">${IC.shirt}</span>Opstelling</button>
    <button class="ltab ${tab==='log'?'act':''}" onclick="setTab('log')"><span class="ti">${IC.log}</span>Verloop</button>
  </div>`;
}

function playerRowHtml(p, minsData, isOff=false, totalMs=0, extraBtn='') {
  if (minsData && minsData.absent) {
    const cap = (match && match.captainId === p.id) ? ` ${icI(IC.captain)}` : '';
    return `<div class="prow" style="opacity:.5">
      <div class="pnum pnum-off">${p.number||'?'}</div>
      <div style="flex:1"><div class="pname" style="text-decoration:line-through">${esc(p.name)}${cap}</div></div>
      <div class="pmins" style="margin-left:6px;color:var(--rd)">Afwezig</div>
    </div>`;
  }
  const ms = minsData ? minsData.ms : 0;
  const m = Math.floor(ms / 60000);
  const cap = (match && match.captainId === p.id) ? ` ${icI(IC.captain)}` : '';
  const motm = (match && match.motmId === p.id) ? ` ${icI(IC.motm)}` : '';
  const pct = totalMs > 0 ? Math.round(ms / totalMs * 100) : null;
  const low = pct !== null && pct < 50;
  const mid = pct !== null && pct >= 50 && pct < 75;
  const bar = pct !== null ? `<div class="fairbar ${low?'low':mid?'mid':''}" style="max-width:120px"><span style="width:${Math.min(100,pct)}%"></span></div>` : '';
  return `<div class="prow">
    <div class="pnum ${isOff?'pnum-off':''}">${p.number||'?'}</div>
    <div style="flex:1"><div class="pname">${esc(p.name)}${cap}${motm}</div>${bar}</div>
    <div class="pmins ${low?'pmins-warn':''}" style="margin-left:6px">${m}'${pct!==null?` · ${pct}%`:' gespeeld'}</div>
    ${extraBtn}
  </div>`;
}
function setTab(t) { tab = t; render(); if (t==='wedstrijd') startTimer(); else stopTimer(); }
function confirmLeave() {
  const backFn = isGuest ? `go('home')` : (match && match.tournamentId) ? `goTournament('${match && match.tournamentId}')` : `go('matches')`;
  if (match && match.status === 'live') {
    openModal(`<h3>Wedstrijd verlaten?</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De wedstrijd loopt nog. Je kan later terugkomen.</p>
      <button class="btn btn-pale" onclick="closeModal();${backFn}">${icI(IC.check)}Terug naar overzicht</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
  } else { if (isGuest) go('home'); else if (match && match.tournamentId) goTournament(match.tournamentId); else go('matches'); }
}

// ===================== QUARTER CONTROLS =====================
async function startQuarter() {
  if (match.quarterStatus === 'running') return; // dubbeltik-guard: deel loopt al
  match.currentQuarter++;
  match.quarterStatus = 'running';
  match.quarters.push({ num: match.currentQuarter, startTime: Date.now(), endTime: null, totalPaused: 0, pausedAt: null });
  addEvent('quarter_start');
  // Tijdens de pauze ingeplande wissels nu automatisch doorvoeren bij de start van het deel.
  for (const s of (match.pendingSubs || [])) {
    const pOut = match.players.find(p => p.id === s.outId), pIn = match.players.find(p => p.id === s.inId);
    if (!pOut || !pIn) continue;
    addEvent('substitution', { playerOutId: s.outId, playerInId: s.inId, atBreak: true });
    pOut.onField = false;
    pIn.onField = true; pIn.x = pOut.x; pIn.y = pOut.y; pIn.line = pOut.line; pIn.posNum = pOut.posNum;
  }
  match.pendingSubs = [];
  for (const s of (match.pendingPosSwaps || [])) {
    const pA = match.players.find(p => p.id === s.pA), pB = match.players.find(p => p.id === s.pB);
    if (!pA || !pB) continue;
    addEvent('posSwap', { pA: s.pA, pB: s.pB, atBreak: true });
    const tmp = { x: pA.x, y: pA.y, line: pA.line, posNum: pA.posNum };
    pA.x = pB.x; pA.y = pB.y; pA.line = pB.line; pA.posNum = pB.posNum;
    pB.x = tmp.x; pB.y = tmp.y; pB.line = tmp.line; pB.posNum = tmp.posNum;
  }
  match.pendingPosSwaps = [];
  // Keeper voor dit deel = automatisch de speler op de doellijn.
  syncKeeper();
  requestWake();
  await dbSave(match); startTimer(); render();
}
// Keeper = automatisch de speler die op het veld op de doellijn staat.
function currentKeeperId(m) { const gk = m.players.find(p => p.onField && p.line === 'Doel'); return gk ? gk.id : null; }
// Houd de keeper(s) van het lopende deel bij (voor minuten/overzicht). Volledig automatisch.
// keeperByQ[qNum] is een lijst {id, sinceMs} i.p.v. één vaste id, zodat een keeperwissel
// halverwege een deel (bv. na een blessure) elke keeper enkel zijn eigen speeltijd toekent
// i.p.v. de volledige deelduur aan wie toevallig als laatste op doel stond.
function syncKeeper() {
  if (!match || !match.currentQuarter) return;
  match.keeperByQ = match.keeperByQ || {};
  const kid = currentKeeperId(match);
  if (!kid) return;
  const existing = match.keeperByQ[match.currentQuarter];
  const arr = Array.isArray(existing) ? existing : [];
  match.keeperByQ[match.currentQuarter] = arr;
  const last = arr[arr.length - 1];
  if (!last || last.id !== kid) arr.push({ id: kid, sinceMs: getGameTimeMs(match) });
}
async function pauseQuarter() {
  const q = match.quarters[match.quarters.length - 1];
  if (!q || q.pausedAt) return; // dubbeltik-guard: al gepauzeerd
  q.pausedAt = Date.now(); match.quarterStatus = 'paused';
  releaseWake();
  await dbSave(match); render();
}
async function resumeQuarter() {
  const q = match.quarters[match.quarters.length - 1];
  if (!q || q.pausedAt == null) return; // dubbeltik-guard: Date.now() - null zou de klok corrumperen
  q.totalPaused = (q.totalPaused || 0) + (Date.now() - q.pausedAt); q.pausedAt = null;
  match.quarterStatus = 'running';
  requestWake();
  await dbSave(match); startTimer(); render();
}
// Beëindig het huidige deel handmatig -> pauze tussen de delen (klok staat stil tot de volgende start).
// Vergeten af te sluiten? Bij fors overtime (>10 min boven de geplande duur) waarschuwen en
// de mogelijkheid geven de werkelijke duur te corrigeren, i.p.v. stilzwijgend Date.now() te
// nemen — anders vertekent zo'n vergeten tik alle speeltijden van dit deel.
function endPeriod() {
  const label = pSingLow(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const overtimeMin = durMs ? Math.round((getQElapsed(match) - durMs) / 60000) : 0;
  const warn = (durMs && overtimeMin > 10) ? `<div class="nudge" style="margin-bottom:12px">${icI(IC.warn)} Dit ${label} loopt al ${overtimeMin} min langer dan gepland (${match.quarterDuration} min voorzien). Ben je vergeten af te sluiten? Corrigeer hieronder desgewenst de werkelijke duur.
    <div class="fg" style="margin-top:8px"><label>Werkelijke duur van dit ${label} (minuten)</label><input id="ep-correct-min" type="number" inputmode="numeric" value="${Math.round(getQElapsed(match)/60000)}" min="1"></div></div>` : '';
  openModal(`<h3>Einde ${label} ${match.currentQuarter}?</h3>
    ${warn}
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De klok stopt en je kan dit ${label} niet meer hervatten.</p>
    <button class="btn btn-red" onclick="doEndPeriod()">${icI(IC.stopFilled)} Ja, beëindig ${label}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doEndPeriod() {
  const q = match.quarters[match.quarters.length - 1];
  if (!q || q.endTime) { closeModal(); return; } // dubbeltik-guard: deel al beëindigd
  if (q.pausedAt) { q.totalPaused = (q.totalPaused || 0) + (Date.now() - q.pausedAt); q.pausedAt = null; }
  const corrInp = document.getElementById('ep-correct-min');
  const corrMin = corrInp ? parseInt(corrInp.value) : NaN;
  q.endTime = (!isNaN(corrMin) && corrMin > 0) ? q.startTime + (q.totalPaused || 0) + corrMin * 60000 : Date.now();
  addEvent('quarter_end');
  match.quarterStatus = 'between';
  stopTimer(); releaseWake(); await dbSave(match); closeModal(); render();
}
// Afgesloten wedstrijd heropenen (foutklik, of verlenging spelen). Voegt automatisch een extra
// deel toe zodat "Start volgend deel" meteen weer beschikbaar is.
function confirmReopenMatch() {
  const label = pSingLow(match);
  openModal(`<h3>Wedstrijd heropenen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De wedstrijd gaat terug naar 'live' en er wordt een extra ${label} toegevoegd, zodat je kan verdergaan (bv. na een foutieve afsluiting, of voor een verlenging).</p>
    <button class="btn btn-org" onclick="doReopenMatch()">${icI(IC.live)} Ja, heropenen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doReopenMatch() {
  match.status = 'live';
  match.quarterStatus = 'between';
  match.numQuarters = Math.max(match.numQuarters || 0, match.quarters.length) + 1;
  closeModal();
  await dbSave(match);
  go('live', match.id);
}
function endMatch() {
  const label = pSingLow(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const overtimeMin = durMs ? Math.round((getQElapsed(match) - durMs) / 60000) : 0;
  const warn = (durMs && overtimeMin > 10) ? `<div class="nudge" style="margin-bottom:12px">${icI(IC.warn)} Dit ${label} loopt al ${overtimeMin} min langer dan gepland (${match.quarterDuration} min voorzien). Ben je vergeten af te sluiten? Corrigeer hieronder desgewenst de werkelijke duur.
    <div class="fg" style="margin-top:8px"><label>Werkelijke duur van dit ${label} (minuten)</label><input id="em-correct-min" type="number" inputmode="numeric" value="${Math.round(getQElapsed(match)/60000)}" min="1"></div></div>` : '';
  openModal(`<h3>Wedstrijd afsluiten?</h3>
    ${warn}
    <div class="fg"><label>Notities (optioneel)</label>
      <textarea id="end-notes" rows="4" placeholder="Aanvullingen over de wedstrijd, bv. weer, blessures, opmerkingen...">${esc(match.notes||'')}</textarea></div>
    <button class="btn btn-red" onclick="confirmEndMatch()">${icI(IC.finish)} Afsluiten &amp; opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function confirmEndMatch() {
  const t = document.getElementById('end-notes');
  if (t) match.notes = t.value;
  const corrInp = document.getElementById('em-correct-min');
  const corrMin = corrInp ? parseInt(corrInp.value) : NaN;
  closeModal(); await forceEndMatch(!isNaN(corrMin) && corrMin > 0 ? corrMin : null);
}
function modalNotes() {
  openModal(`<h3>${icI(IC.edit)} Notities</h3>
    <div class="fg"><textarea id="note-area" rows="6" placeholder="Aanvullingen over de wedstrijd...">${esc(match.notes||'')}</textarea></div>
    <button class="btn btn-green" onclick="saveNotes()">${icI(IC.check)}Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function modalQuickNote() {
  const gameTime = fmtTime(getGameTimeMs(match));
  openModal(`<h3>${icI(IC.edit)} Snelle notitie</h3>
    <div class="fg"><textarea id="qn-area" rows="3" placeholder="Jouw notitie..." autofocus style="font-size:16px"></textarea></div>
    <button class="btn btn-green" onclick="saveQuickNote()">${icI(IC.check)}Toevoegen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
  setTimeout(() => document.getElementById('qn-area')?.focus(), 50);
}
async function saveQuickNote() {
  const txt = (document.getElementById('qn-area')?.value || '').trim();
  if (!txt) { closeModal(); return; }
  const gameTime = fmtTime(getGameTimeMs(match));
  const stamp = `[${gameTime}] ${txt}`;
  match.notes = match.notes ? match.notes + '\n' + stamp : stamp;
  await dbSave(match);
  closeModal();
}
async function markMoment() {
  const gameTime = fmtTime(getGameTimeMs(match));
  const stamp = `[${gameTime}] ★`;
  match.notes = match.notes ? match.notes + '\n' + stamp : stamp;
  await dbSave(match);
  const btn = document.querySelector('.fab-mark');
  if (btn) { btn.innerHTML = IC.check; setTimeout(() => { btn.innerHTML = IC.motm; }, 800); }
}
function modalEditMatchInfo() {
  const notStarted = (match.currentQuarter || 0) === 0 && match.status !== 'done';
  const partsBlock = notStarted ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Aantal blokken</label>
        <select id="ei-pt" onchange="eiPeriodChange()">${['helften','delen','kwarten'].map(k=>`<option value="${k}" ${match.periodKey===k?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
      <div class="fg"><label>Duur van een blok</label>
        <select id="ei-qd" onchange="onDurChange('ei-qd','ei-qd-custom')">${durOptsHtml(match.periodKey, match.quarterDuration)}</select>
        <input id="ei-qd-custom" type="number" min="1" max="99" placeholder="min." style="margin-top:6px;${!(DURATIONS[match.periodKey]||[]).includes(match.quarterDuration)&&match.quarterDuration?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;background:var(--card);-webkit-appearance:none" value="${!(DURATIONS[match.periodKey]||[]).includes(match.quarterDuration)&&match.quarterDuration?match.quarterDuration:''}"></div>
    </div>` : '';
  openModal(`<h3>${icI(IC.edit)} Wedstrijdinfo bewerken</h3>
    <input type="hidden" id="ei-loc" value="${esc(match.location||'')}">
    <div class="fg"><label>Tegenstander</label><input id="ei-opp" type="text" value="${esc(match.opponent||'')}" placeholder="Naam ploeg" autocomplete="off"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Datum</label><input id="ei-date" type="date" value="${match.date||''}"></div>
      <div class="fg"><label>Startuur</label><input id="ei-time" type="time" value="${match.time||''}"></div>
    </div>
    <div class="fg"><label>Thuis of uit?</label>
      <div class="tgl" id="ei-loc-tgl">
        <button type="button" class="${match.location==='Thuis'?'act':''}" onclick="eiSetLoc('Thuis',this)">${icI(IC.home)} Thuismatch</button>
        <button type="button" class="${match.location==='Uit'?'act':''}" onclick="eiSetLoc('Uit',this)">${icI(IC.plane)} Uitmatch</button>
      </div></div>
    ${partsBlock}
    ${(FORMATIONS[match.matchType]||[]).length ? `<div class="fg"><label>Spelvorm (formatie)</label>
      <select id="ei-formation">${(FORMATIONS[match.matchType]||[]).map(f=>`<option value="${esc(f.name)}" ${match.formation===f.name?'selected':''}>${esc(f.name)}</option>`).join('')}
      ${!(FORMATIONS[match.matchType]||[]).some(f=>f.name===match.formation)&&match.formation?`<option value="${esc(match.formation)}" selected>${esc(match.formation)}</option>`:''}</select></div>` : ''}
    <details class="more-details">
      <summary>+ Meer details (optioneel)</summary>
      <div class="fg" style="margin-top:12px"><label>Soort</label>
        ${(()=>{ const std=['Competitie','Vriendschappelijk','Beker']; const cur=match.competition||''; const isCustom=cur&&!std.includes(cur);
          return `<select id="ei-comp" onchange="document.getElementById('ei-comp-custom').style.display=this.value==='__other__'?'':'none'">${std.map(c=>`<option ${cur===c?'selected':''}>${c}</option>`).join('')}<option value="__other__" ${isCustom?'selected':''}>Andere…</option></select>
          <input id="ei-comp-custom" type="text" placeholder="Eigen soort" value="${esc(isCustom?cur:'')}" style="margin-top:6px;${isCustom?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;background:var(--card)">`;
        })()}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="fg"><label>Speeldag</label><input id="ei-md" type="text" value="${esc(match.matchday||'')}" placeholder="bv. 5" autocomplete="off"></div>
        <div class="fg"><label>Truikleur</label><input id="ei-jersey" type="text" value="${esc(match.jersey||'')}" placeholder="bv. zwart-groen" autocomplete="off"></div>
      </div>
      <div class="fg"><label>Scheidsrechter</label><input id="ei-ref" type="text" value="${esc(match.referee||'')}" placeholder="Naam" autocomplete="off"></div>
      <div class="fg"><label>Locatie</label><input id="ei-venue" type="text" value="${esc(match.venue||'')}" placeholder="bv. sportveld, kunstgras B2" autocomplete="off"></div>
      <div class="fg"><label>Trainer</label><input id="ei-trainer" type="text" value="${esc(match.trainer||'')}" placeholder="Naam trainer" autocomplete="off"></div>
      <div class="fg" style="margin-bottom:0"><label>Ploegverantwoordelijke</label><input id="ei-responsible" type="text" value="${esc(match.responsible||'')}" placeholder="Naam" autocomplete="off"></div>
    </details>
    <button class="btn btn-green" style="margin-top:12px" onclick="saveMatchInfo()">${icI(IC.check)}Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function eiSetLoc(val, btn) {
  const h = document.getElementById('ei-loc'); if (h) h.value = val;
  [...btn.parentElement.children].forEach(b => b.classList.toggle('act', b === btn));
}
function eiPeriodChange() {
  const pk = (document.getElementById('ei-pt') || {}).value || 'kwarten';
  const sel = document.getElementById('ei-qd');
  if (sel) sel.innerHTML = durOptsHtml(pk, DUR_DEFAULT[pk]);
  const ci = document.getElementById('ei-qd-custom'); if (ci) ci.style.display = 'none';
}
async function saveMatchInfo() {
  const v = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const opp = v('ei-opp').trim(); if (opp) match.opponent = opp;
  match.date = v('ei-date') || match.date;
  match.time = v('ei-time');
  const loc = v('ei-loc'); if (loc) match.location = loc;
  if (document.getElementById('ei-pt')) {
    match.periodKey = v('ei-pt') || match.periodKey;
    match.numQuarters = PERIOD_TYPES[match.periodKey].count;
    match.quarterDuration = readDur('ei-qd', 'ei-qd-custom', match.quarterDuration);
  }
  const formEl = document.getElementById('ei-formation');
  const prevFormation = match.formation;
  if (formEl) match.formation = formEl.value;
  const formationChanged = formEl && match.formation !== prevFormation;
  match.trainer = v('ei-trainer').trim();
  match.responsible = v('ei-responsible').trim();
  match.referee = v('ei-ref').trim();
  const compSel = v('ei-comp'); match.competition = compSel === '__other__' ? v('ei-comp-custom').trim() || compSel : compSel;
  match.matchday = v('ei-md').trim();
  match.jersey = v('ei-jersey').trim();
  match.venue = v('ei-venue').trim();
  await dbSave(match);
  const slots = formationChanged && (FORMATIONS[match.matchType]||[]).find(f => f.name === match.formation)?.slots;
  if (slots) {
    openModal(`<h3>Spelersposities aanpassen?</h3>
      <p style="color:var(--txt2);font-size:14px;text-align:center;margin-bottom:16px">Wil je de posities van de spelers ook herplaatsen volgens de nieuwe formatie <b>${esc(match.formation)}</b>?</p>
      <button class="btn btn-green" onclick="applyFormationPositions()">${icI(IC.check)} Ja, posities herplaatsen</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal();render()">Nee, alleen label wijzigen</button>`);
  } else {
    closeModal(); render();
  }
}
function applyFormationPositions() {
  modalEditPositions();
}

// ===================== MANUELE HERPLAATSING =====================
let _ep = null; // { slots, assign: Map<slotIdx,playerId>, sel: playerId|null }
function modalEditPositions() {
  const forms = FORMATIONS[match.matchType] || [];
  if (!forms.length) { closeModal(); render(); return; }
  const fi = Math.max(0, forms.findIndex(f => f.name === match.formation));
  const slots = forms[fi].slots;
  // Initialiseer toewijzingen op basis van huidige spelerposities
  const assign = new Map();
  match.players.filter(p => p.starting && typeof p.x === 'number').forEach(p => {
    const si = slots.findIndex(s => s.x === p.x && s.y === p.y);
    if (si >= 0 && !assign.has(si)) assign.set(si, p.id);
  });
  _ep = { fi, slots, assign, sel: null };
  _renderEpModal();
}
function _epChangeFormation(fi) {
  const forms = FORMATIONS[match.matchType] || [];
  _ep.fi = parseInt(fi);
  _ep.slots = forms[_ep.fi].slots;
  _ep.assign = new Map();
  _ep.sel = null;
  _renderEpModal();
}
function _epSelectPlayer(pid) {
  _ep.sel = (_ep.sel === pid) ? null : pid;
  _renderEpModal();
}
function _epClickSlot(si) {
  const occupantId = _ep.assign.get(si);
  if (_ep.sel) {
    // Vorige positie van de geselecteerde speler opzoeken (null = komt uit "Nog te plaatsen")
    let prevSlot = null;
    for (const [k, v] of _ep.assign) if (v === _ep.sel) { prevSlot = k; break; }
    if (prevSlot === si) {
      // Zelfde positie opnieuw aangetikt → speler van het veld halen
      _ep.assign.delete(si);
    } else {
      if (prevSlot !== null) _ep.assign.delete(prevSlot);
      _ep.assign.set(si, _ep.sel);
      // Bezette positie: wissel van plek als de geselecteerde speler op het veld stond,
      // anders gaat de verdrongen speler terug naar "Nog te plaatsen".
      if (occupantId !== undefined && prevSlot !== null) _ep.assign.set(prevSlot, occupantId);
    }
    _ep.sel = null;
  } else if (occupantId !== undefined) {
    // Speler op het veld aantikken → selecteren om te verplaatsen of te wisselen
    _ep.sel = occupantId;
  }
  _renderEpModal();
}
function _renderEpModal() {
  const forms = FORMATIONS[match.matchType] || [];
  const form = forms[_ep.fi];
  const starters = match.players.filter(p => p.starting);
  const placedIds = new Set(_ep.assign.values());
  const unplaced = starters.filter(p => !placedIds.has(p.id));
  // Veld
  const slotsHtml = _ep.slots.map((s, i) => {
    const posNum = computePosNum(match.matchType, i, _ep.slots);
    const pid = _ep.assign.get(i);
    const p = pid ? match.players.find(x => x.id === pid) : null;
    const gk = s.line === 'Doel';
    if (p) return `<div class="pslot filled ${gk?'gk':''}" style="left:${s.x}%;top:${s.y}%${_ep.sel===p.id?';box-shadow:0 0 0 3px var(--org)':''}" onclick="_epClickSlot(${i})">${posNum}<span class="pslot-lbl">${esc(p.name)}</span></div>`;
    return `<div class="pslot ${gk?'gk':''}" style="left:${s.x}%;top:${s.y}%" onclick="_epClickSlot(${i})">${posNum}</div>`;
  }).join('');
  const chipsHtml = unplaced.length
    ? unplaced.map(p => `<span class="place-chip ${_ep.sel===p.id?'sel':''}" onclick="_epSelectPlayer('${p.id}')"><span class="pcn">${p.number||'?'}</span>${esc(p.name)}</span>`).join('')
    : `<span style="color:var(--grn);font-weight:700;font-size:14px">${icI(IC.check)} Iedereen geplaatst</span>`;
  const formSel = forms.map((f,i) => `<option value="${i}" ${i===_ep.fi?'selected':''}>${esc(f.name)}</option>`).join('');
  document.getElementById('modal').innerHTML = `<div class="modal-ov"><div class="modal">
    <h3>${icI(IC.shirt)} Posities herplaatsen</h3>
    <div class="fg" style="margin-bottom:8px"><label>Formatie</label><select onchange="_epChangeFormation(this.value)">${formSel}</select></div>
    <div class="card" style="padding:8px">${`<div class="pitch">${pitchLines()}${slotsHtml}</div>`}
      <div class="field-legend">Tik een speler hieronder en dan een positie om hem te plaatsen. Tik een speler op het veld en dan een andere positie om te verplaatsen of van plek te wisselen. Tik tweemaal dezelfde positie om de speler eraf te halen.</div>
    </div>
    <div class="sec" style="margin-top:8px">Nog te plaatsen (${unplaced.length})</div>
    <div class="place-chips">${chipsHtml}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="_saveEpPositions()">${icI(IC.check)} Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal();render()">Annuleren</button>
  </div></div>`;
  document.getElementById('modal').classList.remove('hidden');
}
async function _saveEpPositions() {
  const forms = FORMATIONS[match.matchType] || [];
  const form = forms[_ep.fi];
  match.formation = form.name;
  // Reset alle starter-posities
  match.players.filter(p => p.starting).forEach(p => { p.x = undefined; p.y = undefined; p.line = undefined; p.posNum = undefined; });
  for (const [si, pid] of _ep.assign) {
    const p = match.players.find(x => x.id === pid);
    const s = _ep.slots[si];
    if (p && s) { p.x = s.x; p.y = s.y; p.line = s.line; p.posNum = computePosNum(match.matchType, si, _ep.slots); }
  }
  _ep = null;
  await dbSave(match); closeModal(); render();
}
async function saveNotes() {
  const t = document.getElementById('note-area');
  if (t) match.notes = t.value;
  await dbSave(match); closeModal(); render();
}
function modalMotm() {
  openModal(`<h3>${icI(IC.motm)} Man van de match</h3>
    ${match.players.map(p => `<div class="mopt ${match.motmId===p.id?'sel':''}" onclick="setMotm('${p.id}')"><div class="mopt-num">${p.number||'?'}</div>${esc(p.name)}</div>`).join('')}
    <div class="mopt mopt-skip" onclick="setMotm(null)">Geen / wissen</div>
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
}
async function setMotm(id) { match.motmId = id; await dbSave(match); closeModal(); render(); }
function shareWhatsApp(m) {
  if (!m) return;
  const home = !isAway(m);
  const us = home ? tName(m) : m.opponent;
  const them = home ? m.opponent : tName(m);
  const usScore = home ? m.scoreUs : m.scoreThem;
  const themScore = home ? m.scoreThem : m.scoreUs;

  // Status
  const isDone = m.status === 'done';
  const qNum = m.currentQuarter || 0;
  const statusTxt = isDone
    ? 'Afgelopen'
    : (m.quarterStatus === 'between' ? 'Pauze' : (qNum > 0 ? 'Bezig' : 'Nog niet gestart'));

  // Doelpunten voor ons (met minuut)
  const goalEvents = m.events.filter(e =>
    e.type === 'goal_us' || e.type === 'own_goal_them' ||
    (e.type === 'penalty_us' && e.scored)
  );
  const goalLines = goalEvents.map(e => {
    const min = e.gameTimeMs != null ? eventMinSummaryText(e, m) : '';
    if (e.type === 'own_goal_them') return `  ⚽ ${min} Eigen doel tegenstander`;
    const scorer = e.playerId ? pName(m, e.playerId) : '?';
    const assist = e.assistId ? ` (assist ${pName(m, e.assistId)})` : '';
    const isPen = e.type === 'penalty_us' ? ' (pen.)' : '';
    return `  ⚽ ${min} ${scorer}${isPen}${assist}`;
  });

  // Eigen doelen door onze spelers
  const ownGoals = m.events.filter(e => e.type === 'own_goal');
  const ownGoalLines = ownGoals.map(e => {
    const min = e.gameTimeMs != null ? eventMinSummaryText(e, m) : '';
    return `  🔴 ${min} Eigen doel ${pName(m, e.playerId)}`;
  });

  // Kaarten
  const yellowCards = m.events.filter(e => e.type === 'yellow_card');
  const redCards = m.events.filter(e => e.type === 'red_card');
  const cardLines = [
    ...yellowCards.map(e => `  🟨 ${pName(m, e.playerId)}`),
    ...redCards.map(e => `  🟥 ${pName(m, e.playerId)}`),
  ];

  // Samenstellen
  const lines = [];
  lines.push(`⚽ ${us} ${usScore}–${themScore} ${them}`);
  lines.push(`📍 ${statusTxt}`);
  if (goalLines.length || ownGoalLines.length) {
    lines.push('');
    lines.push('Doelpunten:');
    lines.push(...goalLines, ...ownGoalLines);
  }
  if (cardLines.length) {
    lines.push('');
    lines.push('Kaarten:');
    lines.push(...cardLines);
  }

  const text = lines.join('\n');

  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      openModal(`<h3>${icI(IC.share)} Gekopieerd!</h3>
        <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De tekst staat op je klembord. Plak hem waar je wil delen.</p>
        <pre style="background:var(--card2,#f1f5f9);padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap;word-break:break-word">${esc(text)}</pre>
        <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
    }).catch(() => {
      openModal(`<h3>${icI(IC.share)} Delen</h3>
        <pre style="background:var(--card2,#f1f5f9);padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap;word-break:break-word">${esc(text)}</pre>
        <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
    });
  }
}
async function shareReport() {
  const m = match;
  const tally = (filter, key) => {
    const cnt = {};
    m.events.filter(filter).forEach(e => { const id = e[key]; if (!id) return; const n = pName(m, id); cnt[n] = (cnt[n] || 0) + 1; });
    return Object.entries(cnt).map(([n, c]) => c > 1 ? `${n} (${c})` : n).join(', ');
  };
  const scLine = tally(e => e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored), 'playerId');
  const asLine = tally(e => e.type === 'goal_us' && e.assistId, 'assistId');
  const ycLine = tally(e => e.type === 'yellow_card', 'playerId');
  const rcLine = tally(e => e.type === 'red_card', 'playerId');
  const lines = [`${isAway(m)?m.opponent:tName(m)} ${scoreTxt(m)} ${isAway(m)?tName(m):m.opponent}`, `${matchWhen(m)} · ${m.location}${m.competition ? ' · ' + m.competition : ''}`];
  if (scLine) lines.push(`⚽ ${scLine}`);
  if (asLine) lines.push(`🎯 Assists: ${asLine}`);
  if (ycLine) lines.push(`🟨 ${ycLine}`);
  if (rcLine) lines.push(`🟥 ${rcLine}`);
  if (m.motmId) lines.push(`⭐ Man v/d match: ${pName(m, m.motmId)}`);
  if (isAdmin && m.notes) lines.push('', m.notes);
  // Volgende geplande wedstrijd van dezelfde ploeg
  try {
    const all = await dbAll();
    const today = new Date().toISOString().split('T')[0];
    const next = all.filter(x => x.teamName === m.teamName && x.status === 'planned' && (x.date || '') >= today).sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0];
    if (next) lines.push('', `📅 Volgende: ${tName(next)} vs ${next.opponent} — ${matchWhen(next)}${next.location ? ' · ' + next.location : ''}`);
  } catch (e) {}
  lines.push('', `— ${getClubName()}`);
  const text = lines.join('\n');
  if (navigator.share) { try { await navigator.share({ title: `${tName(m)} vs ${m.opponent}`, text }); } catch (e) {} }
  else { try { await navigator.clipboard.writeText(text); showToast('Verslag gekopieerd naar klembord', 'ok'); } catch (e) { showToast(text, ''); } }
}
// Eén wedstrijd exporteren als bestand (om door te sturen of op een ander toestel te importeren).
function exportMatchModal() {
  openModal(`<h3>${icI(IC.download)} Export</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <button class="btn btn-pale" style="flex-direction:column;align-items:center;gap:6px;padding:16px 8px" onclick="closeModal();exportMatchCSV()">
        <span class="ic-i" style="font-size:1.4em">${IC.table}</span>
        <div style="font-weight:700">CSV / Excel</div>
        <div style="font-size:11px;color:var(--txt2);line-height:1.3">Excel, Numbers,<br>Google Sheets</div>
      </button>
      <button class="btn btn-pale" style="flex-direction:column;align-items:center;gap:6px;padding:16px 8px" onclick="closeModal();exportMatch()">
        <span class="ic-i" style="font-size:1.4em">${IC.code}</span>
        <div style="font-weight:700">JSON</div>
        <div style="font-size:11px;color:var(--txt2);line-height:1.3">Ruwe data,<br>technisch gebruik</div>
      </button>
    </div>
    <button class="btn btn-gray" onclick="closeModal()">Annuleer</button>`);
}
function exportMatch() {
  const data = { app: 'voetbal-match', version: 1, exportedAt: Date.now(), match };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safe = `${tName(match)}-${match.opponent}-${match.date || ''}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.download = `match-${safe}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportMatchCSV() {
  const m = match;
  const team = tName(m);
  const opp = m.opponent || '';
  const safe = `${team}-${opp}-${m.date || ''}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const rows = [];
  const esc2 = v => (v == null ? '' : String(v).replace(/"/g, '""'));
  const row = (...cols) => rows.push(cols.map(c => `"${esc2(c)}"`).join(';'));
  const blank = () => rows.push('');
  const mins = calcMinutes(m);

  // WEDSTRIJDINFO
  row('WEDSTRIJDINFO');
  row('Ploeg', team);
  row('Tegenstander', opp);
  row('Datum', m.date || '');
  row('Tijdstip', m.time || '');
  row('Locatie', m.location || '');
  row('Wedstrijdtype', m.matchType || '');
  row('Competitie', m.competition || '');
  row('Speeldag', m.matchday || '');
  row('Opstelling', m.formation || '');
  row('Aantal periodes', m.numQuarters || '');
  row('Duur per periode (min)', m.quarterDuration || '');
  row('Trainer', m.trainer || '');
  row('Afgevaardigde', m.responsible || '');
  row('Scheidsrechter', m.referee || '');
  row('Truikleur', m.jersey || '');
  row('Kapitein(s)', allCaptains(m).map(id => pName(m, id)).join(', '));
  row('Score', `${m.scoreUs ?? 0} - ${m.scoreThem ?? 0}`);
  row('Man v/d match', m.motmId ? pName(m, m.motmId) : '');
  blank();

  // EVENTS
  const typeLabels = {
    goal_us: 'Doelpunt', goal_them: 'Doelpunt tegen',
    own_goal: 'Eigen doel', own_goal_them: 'Eigen doel (teg.)',
    yellow_card: 'Gele kaart', red_card: 'Rode kaart',
    substitution: 'Wissel', posSwap: 'Positiewisseling',
    injury: 'Blessure', penalty_us: 'Penalty voor', penalty_them: 'Penalty tegen',
    freekick_us: 'Vrije trap voor', freekick_them: 'Vrije trap tegen',
    corner_us: 'Hoekschop voor', corner_them: 'Hoekschop tegen',
    motm: 'Man v/d match', note: 'Notitie'
  };
  row('EVENTS', 'Periode', 'Minuut', 'Speeltijd (ms)', 'Type', 'Speler', 'Extra info');
  for (const e of [...(m.events || [])].sort((a, b) => (a.gameTimeMs || 0) - (b.gameTimeMs || 0))) {
    const type = typeLabels[e.type] || e.type;
    const { min, extra } = eventMinGlobal(e, m);
    const minStr = min != null ? min + (extra ? '+' + extra : '') + "'" : '';
    let player = '';
    let extraInfo = '';
    if (e.type === 'substitution') {
      player = pName(m, e.playerInId);
      extraInfo = 'Uit: ' + pName(m, e.playerOutId) + (e.atBreak ? ' (pauzewissel)' : '');
    } else if (e.type === 'posSwap') {
      player = pName(m, e.pA) + ' ↔ ' + pName(m, e.pB);
      extraInfo = e.atBreak ? 'Pauze-positiewissel' : '';
    } else if (e.playerId) {
      player = pName(m, e.playerId);
      if (e.assistId) extraInfo = 'Assist: ' + pName(m, e.assistId);
      if (e.scored === true) extraInfo = 'Goal';
      if (e.scored === false) extraInfo = 'Gemist';
      if (e.isOwnGoal) extraInfo = 'Eigen doel';
      if (e.leavesField) extraInfo += (extraInfo ? ' · ' : '') + 'Verlaat veld';
    }
    if (e.type === 'note' && e.text) extraInfo = e.text;
    row('', e.quarterNum || '', minStr, e.gameTimeMs || '', type, player, extraInfo);
  }
  blank();

  // SELECTIE
  row('SELECTIE', 'Naam', 'Nummer', 'Positie', 'Status', 'Speelminuten', 'Goals', 'Assists', 'Gele kaarten', 'Rode kaarten');
  for (const p of (m.players || [])) {
    const minMs = mins[p.id] ? Math.floor(mins[p.id].ms / 60000) : 0;
    const g = m.events.filter(e => (e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored)) && e.playerId === p.id).length;
    const a = m.events.filter(e => e.type === 'goal_us' && e.assistId === p.id).length;
    const yc = m.events.filter(e => e.type === 'yellow_card' && e.playerId === p.id).length;
    const rc = m.events.filter(e => e.type === 'red_card' && e.playerId === p.id).length;
    const status = p.absent ? 'Afwezig' : p.starting ? 'Basis' : 'Bank';
    row('', p.name || '', p.number || '', p.line || p.pos || '', status, minMs ? minMs + "'" : '', g || '', a || '', yc || '', rc || '');
  }

  const csv = '﻿' + rows.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `match-${safe}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function forceEndMatch(correctMin) {
  const q = match.quarters[match.quarters.length - 1];
  if (q && !q.endTime) {
    if (q.pausedAt) { q.totalPaused=(q.totalPaused||0)+(Date.now()-q.pausedAt); q.pausedAt=null; }
    q.endTime = correctMin ? q.startTime + (q.totalPaused || 0) + correctMin * 60000 : Date.now();
  }
  match.status = 'done'; match.quarterStatus = 'done';
  stopTimer(); releaseWake(); await dbSave(match); render();
}
let _postEventQuarter = null; // null = gebruik match.currentQuarter (live), anders: kwart-override (detail)
let _postEventMinute = null;  // null = einde van het deel, anders: minuut binnen het deel (1-based)
// Cumulatieve speeltijd t/m het EINDE van kwart qNum (voor retrograde events).
function gameTimeMsAtEndOfQuarter(m, qNum) {
  let t = 0;
  for (const q of [...m.quarters].sort((a,b) => a.num - b.num)) {
    if (q.num > qNum) break;
    if (q.endTime && q.startTime) t += q.endTime - q.startTime - (q.totalPaused || 0);
    else t += (m.quarterDuration || 15) * 60000; // fallback: nominale kwartduur
  }
  return Math.max(0, t);
}
function addEvent(type, extra={}) {
  const qn = _postEventQuarter !== null ? _postEventQuarter : match.currentQuarter;
  let gms;
  if (_postEventQuarter !== null && _postEventQuarter) {
    if (_postEventMinute !== null) {
      gms = gameTimeMsAtStartOfQuarter(match, _postEventQuarter) + (_postEventMinute - 1) * 60000;
    } else {
      gms = Math.max(0, gameTimeMsAtEndOfQuarter(match, _postEventQuarter) - 1);
    }
  } else {
    gms = getGameTimeMs(match);
  }
  match.events.push({ id: uid(), realTime: Date.now(), gameTimeMs: gms, quarterNum: qn, type, ...extra });
}
// Events corrigeren / verwijderen
function confirmDeleteEvent(id) {
  const e = match.events.find(x => x.id === id); if (!e) return;
  openModal(`<h3>Event verwijderen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">"${evtLabel(e, match)}"<br>De score en opstelling worden herberekend.</p>
    <button class="btn btn-red" onclick="doDeleteEvent('${id}')">${icI(IC.trash)} Verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Tombstone: onthoud verwijderde event-ids zodat de co-admin-merge (applyCloudMatch)
// ze niet "terugbrengt" vanaf een ander toestel of uit een oude back-up.
function tombstoneEvent(m, id) {
  if (!id) return;
  m.deletedEventIds = m.deletedEventIds || [];
  if (!m.deletedEventIds.includes(id)) m.deletedEventIds.push(id);
}
// Bij een wissel kopieert confirmSub() de veldpositie van de uitgaande naar de ingekomen
// speler. Bij het ongedaan maken/verwijderen van dat wissel-event moet die overname mee
// ongedaan gemaakt worden — anders blijft de (nu weer gebankte) speler de positie
// "vasthouden" alsof hij nog op het veld staat.
function revertSubstitutionPositions(m, e) {
  if (!e || e.type !== 'substitution' || !e.playerInId) return;
  const pIn = m.players.find(p => p.id === e.playerInId);
  if (pIn) { pIn.x = undefined; pIn.y = undefined; pIn.line = undefined; pIn.posNum = undefined; }
}
async function doDeleteEvent(id) {
  const removed = match.events.find(e => e.id === id);
  tombstoneEvent(match, id);
  match.events = match.events.filter(e => e.id !== id);
  revertSubstitutionPositions(match, removed);
  recomputeScore(match); recomputeOnField(match);
  await dbSave(match); closeModal(); render();
}
// Een bestaand event bewerken (speler/assist/minuut/details).
function modalEditEvent(id) {
  const e = match.events.find(x => x.id === id); if (!e) return;
  const minute = eventMin(e, match);
  const opts = (sel, withNone) => `${withNone ? '<option value="">—</option>' : ''}${match.players.map(p => `<option value="${p.id}" ${sel === p.id ? 'selected' : ''}>${p.number ? '#' + p.number + ' ' : ''}${esc(p.name)}</option>`).join('')}`;
  const t = e.type; let fields = '';
  if (t === 'goal_us') fields = `<div class="fg"><label>Doelpuntenmaker</label><select id="ee-player">${opts(e.playerId)}</select></div><div class="fg"><label>Assist</label><select id="ee-assist">${opts(e.assistId, true)}</select></div>`;
  else if (t === 'yellow_card' || t === 'red_card') fields = `<div class="fg"><label>Speler</label><select id="ee-player">${opts(e.playerId)}</select></div>`;
  else if (t === 'own_goal') fields = `<div class="fg"><label>Speler</label><select id="ee-player">${opts(e.playerId, true)}</select></div>`;
  else if (t === 'freekick_us') fields = `<div class="fg"><label>Speler</label><select id="ee-player">${opts(e.playerId, true)}</select></div>`;
  else if (t === 'corner_us') fields = `<div class="fg"><label>Nemer</label><select id="ee-player">${opts(e.playerId, true)}</select></div><div class="fg"><label>Type</label><select id="ee-ctype"><option value="lang" ${e.cornerType === 'lang' ? 'selected' : ''}>Lang</option><option value="kort" ${e.cornerType === 'kort' ? 'selected' : ''}>Kort</option></select></div>`;
  else if (t === 'corner_them') fields = `<div class="fg"><label>Type</label><select id="ee-ctype"><option value="lang" ${e.cornerType === 'lang' ? 'selected' : ''}>Lang</option><option value="kort" ${e.cornerType === 'kort' ? 'selected' : ''}>Kort</option></select></div>`;
  else if (t === 'penalty_us') fields = `<div class="fg"><label>Nemer</label><select id="ee-player">${opts(e.playerId, true)}</select></div><div class="fg"><label>Resultaat</label><select id="ee-scored"><option value="1" ${e.scored ? 'selected' : ''}>Gescoord</option><option value="0" ${!e.scored ? 'selected' : ''}>Gemist</option></select></div>`;
  else if (t === 'penalty_them') fields = `<div class="fg"><label>Resultaat</label><select id="ee-scored"><option value="1" ${e.scored ? 'selected' : ''}>Tegendoel</option><option value="0" ${!e.scored ? 'selected' : ''}>Gemist</option></select></div>`;
  else if (t === 'substitution') fields = `<div class="fg"><label>Speler eraf</label><select id="ee-out">${opts(e.playerOutId)}</select></div><div class="fg"><label>Speler erin</label><select id="ee-in">${opts(e.playerInId)}</select></div>`;
  else if (t === 'injury') fields = `<div class="fg"><label>Speler</label><select id="ee-player">${opts(e.playerId)}</select></div><div class="fg"><label>Type</label><select id="ee-itype"><option value="kramp" ${e.injuryType === 'kramp' ? 'selected' : ''}>Kramp</option><option value="licht" ${e.injuryType === 'licht' ? 'selected' : ''}>Licht</option><option value="ernstig" ${e.injuryType === 'ernstig' ? 'selected' : ''}>Ernstig</option></select></div><div class="chkrow"><input type="checkbox" id="ee-leaves" ${e.leavesField ? 'checked' : ''}> Verlaat het veld</div>`;
  else if (t === 'disallowed_us' || t === 'disallowed_them') fields = `<div class="fg"><label>Reden</label><input id="ee-reason" type="text" value="${esc(e.reason || '')}" placeholder="bv. buitenspel"></div>`;
  openModal(`<h3>${icI(IC.edit)} Event bewerken</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${evtLabel(e, match)}</p>
    <div class="fg"><label>Minuut</label><input id="ee-min" type="number" value="${minute}" inputmode="numeric"></div>
    ${fields}
    <button class="btn btn-green" onclick="saveEditEvent('${id}')">${icI(IC.check)}Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function saveEditEvent(id) {
  const e = match.events.find(x => x.id === id); if (!e) return;
  const has = i => document.getElementById(i);
  const val = i => { const el = has(i); return el ? el.value : undefined; };
  const min = parseInt(val('ee-min'));
  if (!isNaN(min) && min > 0) {
    const qStart = e.quarterNum ? gameTimeMsAtStartOfQuarter(match, e.quarterNum) : 0;
    e.gameTimeMs = qStart + (min - 1) * 60000;
  }
  if (has('ee-player')) e.playerId = val('ee-player') || null;
  if (has('ee-assist')) e.assistId = val('ee-assist') || null;
  if (has('ee-ctype')) e.cornerType = val('ee-ctype');
  if (has('ee-scored')) e.scored = val('ee-scored') === '1';
  if (has('ee-out')) e.playerOutId = val('ee-out');
  if (has('ee-in')) e.playerInId = val('ee-in');
  if (has('ee-itype')) e.injuryType = val('ee-itype');
  if (has('ee-leaves')) e.leavesField = has('ee-leaves').checked;
  if (has('ee-reason')) e.reason = val('ee-reason');
  recomputeScore(match); recomputeOnField(match);
  await dbSave(match); closeModal(); render();
}
// Extra registraties: schoten, reddingen, afgekeurd doelpunt.
function modalExtra() {
  const opt = (label, fn) => `<div class="mopt" onclick="${fn}">${label}</div>`;
  openModal(`<h3>${icI(IC.more)} Extra registreren</h3>
    <div class="sec" style="margin-top:0">${icI(IC.penalty)} Penalty</div>
    ${opt(`${icI(IC.penalty)} Penalty`, "modalPenalty()")}
    <div class="sec">${icI(IC.cardR)} Rode kaart</div>
    ${opt(`${icI(IC.cardR)} Rode kaart`, "modalCard('red')")}
    <div class="sec">${icI(IC.injury)} Blessure</div>
    ${opt(`${icI(IC.injury)} Blessure`, "modalInjury()")}
    <div class="sec">${icI(IC.corner)} Hoekschop</div>
    ${opt(`${icI(IC.corner)} Hoekschop voor ons`, "logCorner('us')")}
    ${opt(`${icI(IC.corner)} Hoekschop tegen`, "logCorner('them')")}
    <div class="sec">${icI(IC.disallowed)} Afgekeurd doelpunt</div>
    ${opt(`${icI(IC.disallowed)} Afgekeurd voor ons`, "modalDisallowed('us')")}
    ${opt(`${icI(IC.disallowed)} Afgekeurd tegen`, "modalDisallowed('them')")}
    <div class="sec">${icI(IC.shirt)} Opstelling</div>
    ${opt(`${icI(IC.shirt)} Kapitein wijzigen`, "modalSetCaptain()")}
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
}
function modalMarkAbsent(pid) {
  const p = match.players.find(pl => pl.id === pid);
  if (!p) return;
  openModal(`<h3>${icI(IC.injury)} Niet aanwezig</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px"><b>${esc(p.name)}</b> markeren als niet aanwezig?<br><span style="font-size:12px">Speeltijd wordt op 0 gezet. Dit is ongedaan te maken.</span></p>
    <button class="btn btn-red" onclick="doMarkAbsent('${pid}')">Niet aanwezig</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doMarkAbsent(pid) {
  const p = match.players.find(pl => pl.id === pid);
  if (!p) return;
  p.absent = true;
  if (p.onField) p.onField = false;
  await dbSave(match); closeModal(); render();
}
async function doUnmarkAbsent(pid) {
  const p = match.players.find(pl => pl.id === pid);
  if (!p) return;
  p.absent = false;
  await dbSave(match); render();
}
function modalSetCaptain() {
  const on = playersOnFieldForEvent(match);
  const cur = match.captainId;
  openModal(`<h3>${icI(IC.captain)} Kapitein</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">Kies de huidige kapitein. Dit verandert <b>niet</b> automatisch bij een wissel.</p>
    ${pgGrid(on.map(p => pgBtn(p, 'cap-pb', `setMatchCaptain('${p.id}')`, cur===p.id ? `<span style="font-size:10px;color:var(--grn);font-weight:700">${icI(IC.captain)} nu</span>` : '')).join(''))}
    <button class="btn btn-gray" style="margin-top:12px" onclick="setMatchCaptain(null)">Geen / wissen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Sluiten</button>`);
}
async function setMatchCaptain(id) {
  const prev = match.captainId;
  match.captainId = id;
  if (id && id !== prev) addEvent('captain_change', { playerId: id, fromId: prev || null });
  await dbSave(match); closeModal(); render();
}
async function logExtra(type, extra = {}) {
  addEvent(type, extra); await dbSave(match); closeModal(); render();
}
function modalDisallowed(side) {
  const type = side === 'us' ? 'disallowed_us' : 'disallowed_them';
  const label = side === 'us' ? 'voor ons' : 'tegen';
  openModal(`<h3>${icI(IC.disallowed)} Afgekeurd doelpunt ${label}</h3>
    <div class="fg"><label>Reden (optioneel)</label><input id="disallowed-reason" type="text" placeholder="bv. buitenspel" value="buitenspel" autocomplete="off"></div>
    <button class="btn btn-org" onclick="logExtra('${type}',{reason:(document.getElementById('disallowed-reason').value||'').trim()})">Registreren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function hasUndo() { return match && match.events.some(e => e.type !== 'quarter_start' && e.type !== 'quarter_end'); }
async function undoLast() {
  let idx = -1;
  for (let i = match.events.length - 1; i >= 0; i--) { const t = match.events[i].type; if (t !== 'quarter_start' && t !== 'quarter_end') { idx = i; break; } }
  if (idx < 0) return;
  const removed = match.events[idx];
  tombstoneEvent(match, removed.id);
  match.events.splice(idx, 1);
  revertSubstitutionPositions(match, removed);
  recomputeScore(match); recomputeOnField(match);
  await dbSave(match); render();
  showUndoToast(`${icI(IC.undo)} Ongedaan: ${evtLabel(removed, match)}`);
}
function showUndoToast(html) {
  let t = document.getElementById('undo-toast');
  if (t) { clearTimeout(t._to); t.remove(); }
  t = document.createElement('div'); t.id = 'undo-toast'; t.innerHTML = html;
  document.body.appendChild(t);
  t._to = setTimeout(() => { if (t.parentNode) t.remove(); }, 3000);
}

// ===================== MODALS: GOAL (+ assist) =====================
let goalTeam = 'us', goalPlayerId = null, goalAssistId = null, goalIsOwnGoal = false;
function modalGoal() {
  const goalCount = id => match.events.filter(e => (e.type==='goal_us'||e.type==='penalty_us') && e.playerId===id).length;
  const on = playersOnFieldForEvent(match).slice().sort((a,b) => goalCount(b.id)-goalCount(a.id) || (Number(a.number)||99)-(Number(b.number)||99));
  goalTeam = 'us'; goalPlayerId = null; goalAssistId = null; goalIsOwnGoal = false;
  openModal(`
    <h3>${icI(IC.goal)} Goal</h3>
    <div class="sec" style="margin-top:0">Voor wie?</div>
    <div class="tgl" id="goal-team">
      <button class="act" onclick="tglGoalTeam('us',this)">${esc(tName(match))}</button>
      <button onclick="tglGoalTeam('them',this)">Tegenstander</button>
    </div>
    <div id="goal-us-section">
      <div class="sec">Welke speler scoorde?</div>
      <div id="goal-players" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${on.map(p=>`<button type="button" class="gp-btn" data-id="${p.id}" onclick="selectGoalPlayer('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px"><span style="font-size:22px;font-weight:900;color:var(--txt);line-height:1">${p.number||'?'}</span><span style="font-size:10px;color:var(--txt2);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(_lastName(p.name))}</span></button>`).join('')}
        <button type="button" class="gp-btn" data-id="own_them" onclick="selectGoalPlayer('own_them',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px"><span style="font-size:13px;font-weight:900;color:var(--txt2);line-height:1">OG</span><span style="font-size:10px;color:var(--txt2);text-align:center">eigen doel teg.</span></button>
      </div>
      <div id="assist-section" class="hidden">
        <div class="sec">Assist door? (optioneel)</div>
        <div id="assist-players" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${on.map(p=>`<button type="button" class="ap-btn" data-id="${p.id}" onclick="selectAssist('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px"><span style="font-size:22px;font-weight:900;color:var(--txt2);line-height:1">${p.number||'?'}</span><span style="font-size:10px;color:var(--txt2);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(_lastName(p.name))}</span></button>`).join('')}
          <button type="button" class="ap-btn" data-id="none" onclick="selectAssist(null,this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px"><span style="font-size:18px;color:var(--txt2)">—</span><span style="font-size:10px;color:var(--txt2)">geen</span></button>
        </div>
      </div>
    </div>
    <div id="goal-them-section" class="hidden">
      <div class="sec">Soort tegendoel?</div>
      <div class="tgl" id="goal-own-tgl">
        <button class="act" onclick="tglOwnGoal(false,this)">Tegendoel</button>
        <button onclick="tglOwnGoal(true,this)">Eigen doel (onze speler)</button>
      </div>
      <div id="own-goal-players" class="hidden">
        <div class="sec">Welke speler?</div>
        <div id="own-goal-player-list" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${on.map(p=>`<button type="button" class="ogp-btn" data-id="${p.id}" onclick="selectOwnGoalPlayer('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px"><span style="font-size:22px;font-weight:900;color:var(--txt);line-height:1">${p.number||'?'}</span><span style="font-size:10px;color:var(--txt2);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(_lastName(p.name))}</span></button>`).join('')}
        </div>
      </div>
    </div>
    <button class="btn btn-green" style="margin-top:12px" onclick="confirmGoal()">${icI(IC.check)}Bevestigen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function tglGoalTeam(team, btn) {
  goalTeam = team; goalPlayerId = null; goalAssistId = null; goalIsOwnGoal = false;
  document.querySelectorAll('#goal-team button').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  document.getElementById('goal-us-section').classList.toggle('hidden', team !== 'us');
  document.getElementById('goal-them-section').classList.toggle('hidden', team !== 'them');
}
function tglOwnGoal(isOwn, btn) {
  goalIsOwnGoal = isOwn; goalPlayerId = null;
  document.querySelectorAll('#goal-own-tgl button').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  document.getElementById('own-goal-players').classList.toggle('hidden', !isOwn);
  document.querySelectorAll('#own-goal-player-list .mopt').forEach(o => o.classList.remove('sel'));
}
function selectGoalPlayer(id, el) {
  goalIsOwnGoal = id === 'own_them';
  goalPlayerId = goalIsOwnGoal ? null : id;
  goalAssistId = null;
  document.querySelectorAll('#goal-players .gp-btn').forEach(o => gpDesel(o));
  gpSel(el);
  const as = document.getElementById('assist-section');
  as.classList.toggle('hidden', goalIsOwnGoal);
  document.querySelectorAll('#assist-players .ap-btn').forEach(o => gpDesel(o));
}
function selectOwnGoalPlayer(id, el) {
  goalPlayerId = id;
  document.querySelectorAll('#own-goal-player-list .ogp-btn').forEach(o => gpDesel(o));
  gpSel(el);
}
function selectAssist(id, el) {
  goalAssistId = id;
  document.querySelectorAll('#assist-players .ap-btn').forEach(o => gpDesel(o));
  gpSel(el);
}
function pgBtn(p, cls, onclick, extra = '') {
  return `<button type="button" class="${cls}" data-id="${p.id}" onclick="${onclick}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:2px"><span style="font-size:22px;font-weight:900;color:var(--txt);line-height:1">${p.number||'?'}</span><span style="font-size:10px;color:var(--txt2);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(_lastName(p.name))}</span>${extra}</button>`;
}
function pgGrid(btns) { return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${btns}</div>`; }
function gpSel(el) {
  el.style.background = 'var(--grn)'; el.style.borderColor = 'var(--grn)';
  el.querySelectorAll('span').forEach(s => s.style.color = '#fff');
}
function gpDesel(el) {
  el.style.background = 'var(--card)'; el.style.borderColor = 'var(--bdr)';
  el.querySelectorAll('span').forEach(s => s.style.color = 'var(--txt2)');
}
function gpSelIn(containerId, el) {
  document.querySelectorAll(`#${containerId} button`).forEach(o => gpDesel(o));
  gpSel(el);
}
let _goalBusy = false; // dubbeltik-guard: popup sluit pas na het (trage) opslaan
async function confirmGoal() {
  if (_goalBusy) return;
  if (goalTeam === 'us') {
    if (!goalPlayerId && !goalIsOwnGoal) { showToast('Kies een speler.', 'err'); return; }
  } else if (goalIsOwnGoal && !goalPlayerId) { showToast('Kies een speler.', 'err'); return; }
  _goalBusy = true;
  try {
    if (goalTeam === 'us') {
      if (goalIsOwnGoal) { addEvent('own_goal_them', {}); match.scoreUs++; }
      else { addEvent('goal_us', { playerId: goalPlayerId, assistId: goalAssistId || null }); match.scoreUs++; }
    } else {
      if (goalIsOwnGoal) { addEvent('own_goal', { playerId: goalPlayerId }); match.scoreThem++; }
      else { addEvent('goal_them'); match.scoreThem++; }
    }
    await dbSave(match); closeModal(); render();
  } finally { _goalBusy = false; }
  requestAnimationFrame(() => {
    const sb = document.querySelector('.scoreboard .sb-score');
    if (sb) { sb.classList.remove('goal-anim'); void sb.offsetWidth; sb.classList.add('goal-anim'); }
  });
}

// Dubbeltik-guard, gedeeld door de eventfuncties hieronder (zelfde patroon als _goalBusy
// bij Goal): dbSave() (IndexedDB + Firebase) kan traag genoeg zijn dat een tweede tik vóór
// het sluiten van de modal een tweede identiek event/score-optelling veroorzaakt.
let _eventBusy = false;

// Hoekschop: één tik per ploeg (geen nemer/type meer — overbodig voor jeugd).
async function logCorner(team) {
  if (_eventBusy) return;
  _eventBusy = true;
  try { addEvent(team === 'us' ? 'corner_us' : 'corner_them', {}); await dbSave(match); closeModal(); render(); }
  finally { _eventBusy = false; }
}

// ===================== MODAL: SUB =====================
let subOut = null, subIn = null;
function modalSub() {
  const between = match.quarterStatus === 'between' && _postEventQuarter === null;
  const on = _postEventQuarter != null ? playersAtPeriodStart(match, _postEventQuarter) : effectiveOnField(match);
  const mins = calcMinutes(match);
  const onIds = new Set(on.map(p => p.id));
  // bank gesorteerd op minst gespeeld, zodat eerlijke rotatie makkelijk is
  const off = match.players.filter(p => !onIds.has(p.id)).slice().sort((a, b) => (mins[a.id]?.ms || 0) - (mins[b.id]?.ms || 0));
  const minMs = off.length ? (mins[off[0].id]?.ms || 0) : 0;
  const mm = id => Math.floor((mins[id]?.ms || 0) / 60000);
  subOut = null; subIn = null;
  const title = between ? `${icI(IC.swap)} Pauzewissel · ${pSing(match)} ${match.currentQuarter + 1}` : `${icI(IC.swap)} Wissel`;
  const cta = between ? `${icI(IC.check)} Pauzewissel inplannen` : `${icI(IC.check)} Wissel doorvoeren`;
  const hint = between ? '<p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Wordt automatisch doorgevoerd bij de start van het volgende deel.</p>' : '';
  openModal(`<h3>${title}</h3>${hint}
    <div class="sec" style="margin-top:0">Wie gaat ERAF?</div>
    <div id="sub-out">${pgGrid(on.map(p=>pgBtn(p,'sub-ob',`selectSubOut('${p.id}',this)`,`<span style="font-size:10px;color:var(--txt2)">${mm(p.id)}'</span>`)).join(''))}</div>
    <div class="sec">Wie komt ERIN? <span style="color:var(--txt2);font-weight:400;text-transform:none">(minst gespeeld bovenaan)</span></div>
    <div id="sub-in">${off.length ? pgGrid(off.map(p=>{ const low=(mins[p.id]?.ms||0)===minMs; return pgBtn(p,'sub-ib',`selectSubIn('${p.id}',this)`,`<span style="font-size:10px;color:${low?'var(--org)':'var(--txt2)'};">${mm(p.id)}'${low?' ●':''}</span>`); }).join('')) : '<p style="color:var(--txt2);font-size:14px;padding:8px 0">Geen spelers op de bank.</p>'}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="confirmSub()">${cta}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function selectSubOut(id, el) { subOut = id; gpSelIn('sub-out', el); }
function selectSubIn(id, el) { subIn = id; gpSelIn('sub-in', el); }
async function confirmSub() {
  if (!subOut || !subIn) { showToast('Kies wie eraf gaat en wie erin komt.', 'err'); return; }
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    // Tijdens de pauze: wissel inplannen i.p.v. meteen doorvoeren.
    if (match.quarterStatus === 'between') {
      match.pendingSubs = match.pendingSubs || [];
      match.pendingSubs.push({ outId: subOut, inId: subIn });
      await dbSave(match); closeModal(); render();
      return;
    }
    addEvent('substitution', { playerOutId: subOut, playerInId: subIn });
    const pOut = match.players.find(p => p.id === subOut), pIn = match.players.find(p => p.id === subIn);
    if (pOut) pOut.onField = false;
    if (pIn) { pIn.onField = true; if (pOut) { pIn.x = pOut.x; pIn.y = pOut.y; pIn.line = pOut.line; pIn.posNum = pOut.posNum; } }
    syncKeeper(); // keeper volgt automatisch de doellijn
    await dbSave(match); closeModal(); render();
  } finally { _eventBusy = false; }
}
async function removePendingSub(i) { if (match.pendingSubs) match.pendingSubs.splice(i, 1); await dbSave(match); render(); }

// ===================== MODAL: POSITIEWISSEL =====================
let posSwapA = null, posSwapB = null;
function modalPosSwap() {
  posSwapA = null; posSwapB = null;
  const isBetween = match.quarterStatus === 'between';
  const on = isBetween ? playersOnField(match) : playersOnField(match);
  const title = isBetween ? `${icI(IC.compass)} Pauze-positiewissel · ${pSing(match)} ${match.currentQuarter + 1}` : `${icI(IC.compass)} Positiewissel`;
  const hint = isBetween
    ? '<p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Wordt automatisch doorgevoerd bij de start van het volgende deel.</p>'
    : '<p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Kies twee spelers die van positie wisselen.</p>';
  openModal(`<h3>${title}</h3>${hint}
    <div class="sec" style="margin-top:0">Eerste speler</div>
    <div id="psw-a">${pgGrid(on.map(p=>pgBtn(p,'psw-ab',`selectPosSwapA('${p.id}',this)`)).join(''))}</div>
    <div class="sec" id="psw-b-lbl" style="display:none">Tweede speler</div>
    <div id="psw-b" style="display:none"></div>
    <button class="btn btn-green" style="margin-top:12px;display:none" id="psw-confirm" onclick="confirmPosSwap()">${icI(IC.check)}Positiewissel doorvoeren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function selectPosSwapA(id, el) {
  posSwapA = id; posSwapB = null;
  gpSelIn('psw-a', el);
  const on = playersOnField(match).filter(p => p.id !== id);
  const bDiv = document.getElementById('psw-b');
  const bLbl = document.getElementById('psw-b-lbl');
  const btn = document.getElementById('psw-confirm');
  if (!bDiv || !bLbl || !btn) return;
  bDiv.innerHTML = pgGrid(on.map(p => pgBtn(p, 'psw-bb', `selectPosSwapB('${p.id}',this)`)).join(''));
  bLbl.style.display = ''; bDiv.style.display = ''; btn.style.display = 'none';
}
function selectPosSwapB(id, el) {
  posSwapB = id;
  gpSelIn('psw-b', el);
  const btn = document.getElementById('psw-confirm'); if (btn) btn.style.display = '';
}
async function confirmPosSwap() {
  if (!posSwapA || !posSwapB) return;
  if (match.quarterStatus === 'between') {
    match.pendingPosSwaps = match.pendingPosSwaps || [];
    match.pendingPosSwaps.push({ pA: posSwapA, pB: posSwapB });
    await dbSave(match); closeModal(); render();
    return;
  }
  addEvent('posSwap', { pA: posSwapA, pB: posSwapB });
  const pA = match.players.find(p => p.id === posSwapA), pB = match.players.find(p => p.id === posSwapB);
  if (pA && pB) {
    const tmp = { x: pA.x, y: pA.y, line: pA.line, posNum: pA.posNum };
    pA.x = pB.x; pA.y = pB.y; pA.line = pB.line; pA.posNum = pB.posNum;
    pB.x = tmp.x; pB.y = tmp.y; pB.line = tmp.line; pB.posNum = tmp.posNum;
  }
  await dbSave(match); closeModal(); render();
}
async function removePendingPosSwap(i) { if (match.pendingPosSwaps) match.pendingPosSwaps.splice(i, 1); await dbSave(match); render(); }

// ===================== MODAL: CARD =====================
function modalCard(color) {
  const on = playersOnFieldForEvent(match);
  const ico = color === 'yellow' ? icI(IC.cardY) : icI(IC.cardR);
  const lbl = color === 'yellow' ? 'Gele kaart' : 'Rode kaart';
  openModal(`<h3>${ico} ${lbl}</h3>
    <div class="sec" style="margin-top:0">Voor welke speler?</div>
    ${pgGrid(on.map(p=>`<button type="button" onclick="logCard('${color}','${p.id}')" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:2px"><span style="font-size:22px;font-weight:900;color:var(--txt);line-height:1">${p.number||'?'}</span><span style="font-size:10px;color:var(--txt2);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(_lastName(p.name))}</span></button>`).join(''))}
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Annuleren</button>`);
}
async function logCard(color, pid) {
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    if (color === 'red') { addEvent('red_card', { playerId: pid }); const p = match.players.find(x=>x.id===pid); if (p) p.onField = false; }
    else {
      addEvent('yellow_card', { playerId: pid });
      const prevYellow = match.events.filter(e => e.type === 'yellow_card' && e.playerId === pid).length;
      if (prevYellow >= 2) {
        addEvent('red_card', { playerId: pid });
        const p = match.players.find(x => x.id === pid);
        if (p) p.onField = false;
        showToast(`2e gele kaart → ${p ? p.name : 'Speler'} krijgt automatisch rood en verlaat het veld.`, 'err');
      }
    }
    await dbSave(match); closeModal(); render();
    requestAnimationFrame(() => {
      const ic = document.querySelector(color === 'red' ? '.evtbtn.ered .ei' : '.evtbtn.eyel .ei');
      if (ic) { ic.classList.remove('card-anim'); void ic.offsetWidth; ic.classList.add('card-anim'); }
    });
  } finally { _eventBusy = false; }
}

// ===================== MODAL: PENALTY =====================
let penTeam = 'us', penPlayerId = null;
function modalPenalty() {
  penTeam = 'us'; penPlayerId = null;
  const on = playersOnFieldForEvent(match);
  openModal(`<h3>${icI(IC.penalty)} Penalty</h3>
    <div class="sec" style="margin-top:0">Voor wie?</div>
    <div class="tgl" id="pen-team"><button class="act" onclick="tglPen('us',this)">${esc(tName(match))}</button><button onclick="tglPen('them',this)">Tegenstander</button></div>
    <div id="pen-player-section">
      <div class="sec">Wie neemt de penalty?</div>
      <div id="pen-players">
        ${pgGrid(on.map(p=>pgBtn(p,'pen-pb',`selectPenPlayer('${p.id}',this)`)).join(''))}
      </div>
    </div>
    <div class="sec">Resultaat?</div>
    <div class="mopt" onclick="logPenalty(true)">${icI(IC.goal)} Gescoord</div>
    <div class="mopt" onclick="logPenalty(false)"><div class="mopt-num mopt-num-off"><span class="ic-i">${IC.close}</span></div>Gemist / gestopt</div>
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Annuleren</button>`);
}
function tglPen(team, btn){ penTeam = team; document.querySelectorAll('#pen-team button').forEach(b=>b.classList.remove('act')); btn.classList.add('act'); const s=document.getElementById('pen-player-section'); if(s) s.style.display = team==='us'?'':'none'; }
function selectPenPlayer(id, el){ penPlayerId = id; gpSelIn('pen-players', el); }
async function logPenalty(scored) {
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    if (penTeam === 'us') { addEvent('penalty_us', { scored, playerId: penPlayerId || null }); if (scored) match.scoreUs++; }
    else { addEvent('penalty_them', { scored }); if (scored) match.scoreThem++; }
    await dbSave(match); closeModal(); render();
  } finally { _eventBusy = false; }
}

// ===================== MODAL: INJURY =====================
let injPlayerId = null, injType = 'kramp';
function modalInjury() {
  const on = playersOnFieldForEvent(match);
  injPlayerId = null; injType = 'kramp';
  openModal(`<h3>${icI(IC.injury)} Blessure</h3>
    <div class="sec" style="margin-top:0">Welke speler?</div>
    <div id="inj-players">${pgGrid(on.map(p=>pgBtn(p,'inj-pb',`selectInjuryPlayer('${p.id}',this)`)).join(''))}</div>
    <div class="sec">Type</div>
    <div class="tgl" id="inj-type">
      <button class="act" onclick="tglInjType('kramp',this)">Kramp</button>
      <button onclick="tglInjType('licht',this)">Lichte blessure</button>
      <button onclick="tglInjType('ernstig',this)">Ernstig</button>
    </div>
    <label class="chkrow" style="margin-bottom:16px"><input type="checkbox" id="inj-off"> Speler verlaat het veld</label>
    <button class="btn btn-green" onclick="confirmInjury()">${icI(IC.check)}Registreren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function selectInjuryPlayer(id, el) { injPlayerId = id; gpSelIn('inj-players', el); }
function tglInjType(type, btn) {
  injType = type;
  document.querySelectorAll('#inj-type button').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
}
async function confirmInjury() {
  if (!injPlayerId) { showToast('Kies een speler.', 'err'); return; }
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    const leavesField = !!document.getElementById('inj-off')?.checked;
    addEvent('injury', { playerId: injPlayerId, injuryType: injType, leavesField });
    if (leavesField) { const p = match.players.find(x => x.id === injPlayerId); if (p) p.onField = false; }
    await dbSave(match);
    if (leavesField) { modalSubAfterInjury(injPlayerId); } else { closeModal(); render(); }
  } finally { _eventBusy = false; }
}
function modalSubAfterInjury(outId) {
  subOut = outId; subIn = null;
  const outPlayer = match.players.find(p => p.id === outId);
  const mins = calcMinutes(match);
  const off = playersOnBench(match).slice().sort((a,b) => (mins[a.id]?.ms||0) - (mins[b.id]?.ms||0));
  const minMs = off.length ? (mins[off[0].id]?.ms||0) : 0;
  const mm = id => Math.floor((mins[id]?.ms||0)/60000);
  openModal(`<h3>${icI(IC.swap)} Wissel na blessure</h3>
    <div style="background:var(--rdp);color:var(--rd);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-weight:700;font-size:14px">🤕 ${esc(outPlayer?.name||'?')} verlaat het veld</div>
    <div class="sec" style="margin-top:0">Wie komt ERIN? <span style="color:var(--txt2);font-weight:400;text-transform:none">(minst gespeeld bovenaan)</span></div>
    <div id="sub-in">${off.length ? pgGrid(off.map(p => { const low=(mins[p.id]?.ms||0)===minMs; return pgBtn(p,'sub-ib',`selectSubIn('${p.id}',this)`,`<span style="font-size:10px;color:${low?'var(--org)':'var(--txt2)'};">${mm(p.id)}'${low?' ●':''}</span>`); }).join('')) : '<p style="color:var(--txt2);font-size:14px;padding:8px 0">Geen bankspelers beschikbaar.</p>'}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="confirmSub()">${icI(IC.check)}Wissel doorvoeren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal();render()">Geen wissel</button>`);
}

// ===================== MODAL: FREE KICK =====================
let fkTeam = 'us', fkPlayerId = null;
function modalFreekick() {
  fkTeam = 'us'; fkPlayerId = null;
  const on = playersOnFieldForEvent(match);
  openModal(`<h3>${icI(IC.bolt)} Vrije trap</h3>
    <div class="sec" style="margin-top:0">Voor wie?</div>
    <div class="tgl" id="fk-team">
      <button class="act" onclick="tglFk('us',this)">${esc(tName(match))}</button>
      <button onclick="tglFk('them',this)">Tegenstander</button>
    </div>
    <div id="fk-player-section">
      <div class="sec">Wie neemt de vrije trap?</div>
      <div id="fk-players">
        ${on.map(p=>`<div class="mopt" onclick="selectFkPlayer('${p.id}',this)"><div class="mopt-num">${p.number||'?'}</div>${esc(p.name)}</div>`).join('')}
        <div class="mopt mopt-skip" onclick="selectFkPlayer(null,this)">Niet ingeven</div>
      </div>
    </div>
    <button class="btn btn-green" style="margin-top:12px" onclick="confirmFreekick()">${icI(IC.check)}Bevestigen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function tglFk(team, btn){ fkTeam = team; document.querySelectorAll('#fk-team button').forEach(b=>b.classList.remove('act')); btn.classList.add('act'); const s=document.getElementById('fk-player-section'); if(s) s.style.display = team==='us'?'':'none'; }
function selectFkPlayer(id, el){ fkPlayerId = id; document.querySelectorAll('#fk-players .mopt').forEach(o=>o.classList.remove('sel')); el.classList.add('sel'); }
async function confirmFreekick() {
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    if (fkTeam === 'us') addEvent('freekick_us', { playerId: fkPlayerId || null });
    else addEvent('freekick_them');
    await dbSave(match); closeModal(); render();
  } finally { _eventBusy = false; }
}

// Event toevoegen achteraf (detail view): kies eerst het kwart, dan het event-type
function modalAddPostEvent() {
  const quarters = match.quarters || [];
  const lastQ = quarters.length > 0 ? quarters[quarters.length - 1].num : null;
  _postEventQuarter = lastQ;
  _postEventMinute = null;
  const qBtns = quarters.map(q => {
    const act = q.num === lastQ ? ' act' : '';
    return `<button class="tgl-btn${act}" onclick="selPostQ(${q.num},this)">${pSing(match)} ${q.num}</button>`;
  }).join('') + `<button class="tgl-btn${lastQ===null?' act':''}" onclick="selPostQ(null,this)">Onbekend</button>`;
  openModal(`
    <h3>${icI(IC.log)} Event toevoegen</h3>
    <div class="sec" style="margin-top:0">In welk deel?</div>
    <div class="tgl" id="post-q-tgl" style="flex-wrap:wrap;gap:6px;margin-bottom:8px">${qBtns}</div>
    <div class="fg" style="margin-bottom:4px">
      <label style="font-size:13px;color:var(--txt2)">Minuut binnen dit deel <span style="font-weight:400">(optioneel — laat leeg voor einde deel)</span></label>
      <input id="post-evt-min" type="number" inputmode="numeric" min="1" placeholder="bv. 12" oninput="selPostMin(this.value)" style="width:100%">
    </div>
    <div class="sec">Wat wil je toevoegen?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button class="btn btn-pale" onclick="postEvt(modalGoal)">${icI(IC.goal)} Goal</button>
      <button class="btn btn-pale" onclick="postEvt(()=>modalCard('yellow'))">${icI(IC.cardY)} Kaart</button>
      <button class="btn btn-pale" onclick="postEvt(modalPenalty)">${icI(IC.penalty)} Penalty</button>
      <button class="btn btn-pale" onclick="postEvt(modalFreekick)">${icI(IC.bolt)} Vrije trap</button>
      <button class="btn btn-pale" onclick="postEvt(modalSub)">${icI(IC.swap)} Wissel</button>
      <button class="btn btn-pale" onclick="postEvt(modalExtra)">${icI(IC.more)} Meer…</button>
    </div>
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Annuleren</button>`);
}
function selPostQ(num, btn) {
  _postEventQuarter = num;
  document.querySelectorAll('#post-q-tgl .tgl-btn').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
}
function selPostMin(val) {
  const n = parseInt(val);
  _postEventMinute = (!isNaN(n) && n > 0) ? n : null;
}
function postEvt(fn) {
  fn();
}

