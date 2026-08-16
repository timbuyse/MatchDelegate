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
      ${/* Misklik op "Wedstrijd starten" ongedaan maken. Enkel zolang er echt niets gebeurd is:
            geen enkel deel gelopen en geen enkele gebeurtenis gelogd. Bewust een bescheiden knop
            onder de startknop — het is een uitzondering, geen dagelijkse handeling. */ ''}
      ${(canStartFirst && !(match.quarters || []).length && !(match.events || []).length)
        ? `<button class="btn btn-gray btn-sm" style="width:100%;margin-bottom:12px" onclick="confirmTerugNaarGepland()">${icI(IC.undo)} Toch nog niet gestart</button>`
        : ''}
      ${canStartNext ? `<div class="card" style="padding:12px;border-left:4px solid var(--org)">
        <button class="btn btn-orgpale btn-sm" style="width:100%;margin-bottom:12px" onclick="modalAddPostEvent()">${icI(IC.log)} Event toevoegen aan ${pSingLow(match)} ${qNum}</button>
        <div class="sec" style="margin-top:0">${icI(IC.swap)} Klaar voor ${pSingLow(match)} ${qNum+1}</div>
        ${(match.pendingSubs&&match.pendingSubs.length) ? match.pendingSubs.map((s,i)=>`<div class="prow" style="padding:8px 0"><div style="flex:1;font-size:14px">${icI(IC.swap)} <b>${esc(pName(match,s.inId))}</b> <span style="color:var(--txt2)">voor</span> ${esc(pName(match,s.outId))}</div><button class="evt-del" onclick="removePendingSub(${i})" title="Verwijderen">×</button></div>`).join('') : ''}
        ${(match.pendingPosSwaps&&match.pendingPosSwaps.length) ? match.pendingPosSwaps.map((s,i)=>`<div class="prow" style="padding:8px 0"><div style="flex:1;font-size:14px">${icI(IC.compass)} <b>${esc(pName(match,s.pA))}</b> <span style="color:var(--txt2)">wisselt met</span> ${esc(pName(match,s.pB))}</div><button class="evt-del" onclick="removePendingPosSwap(${i})" title="Verwijderen">×</button></div>`).join('') : ''}
        ${(!(match.pendingSubs||[]).length && !(match.pendingPosSwaps||[]).length) ? `<p style="color:var(--txt2);font-size:13px">Nog geen wissels ingepland. Regel ze in het tabblad <b>Opstelling</b>: tik daar een bankspeler en dan een speler op het veld.</p>` : ''}
        ${((match.plannedLineups || {})[qNum + 1] || []).length
          ? `<button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="modalUsePlannedLineup(${qNum + 1})">${icI(IC.shirt)} Geplande opstelling ${((match.pendingSubs||[]).length + (match.pendingPosSwaps||[]).length) ? 'opnieuw toepassen' : 'gebruiken'}</button>` : ''}
        <button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="setTab('opstelling')">${icI(IC.shirt)} Wissels & posities op het veld</button>
      </div>` : ''}
      ${ro ? '' : (() => { const simple = simpleEventsOn(); return `<div class="evtbtns">
        <div class="evtbtn eg ${dis}" onclick="modalGoal()"><span class="ei">${IC.goal}</span><span class="el">Goal</span></div>
        <div class="evtbtn es ${dis}" onclick="modalSub()"><span class="ei">${IC.swap}</span><span class="el">Wissel</span></div>
        <div class="evtbtn ${dis}" onclick="modalPosSwap()"><span class="ei">${IC.compass}</span><span class="el">Positie</span></div>
        ${(match.matchType==='3v3'||match.matchType==='5v5') ? '' : `<div class="evtbtn eyel ${dis}" onclick="modalCard('yellow')"><span class="ei">${IC.cardY}</span><span class="el">Gele kaart</span></div>
        ${simple ? '' : `<div class="evtbtn ered ${dis}" onclick="modalCard('red')"><span class="ei">${IC.cardR}</span><span class="el">Rode kaart</span></div>`}`}
        ${simple ? '' : `<div class="evtbtn epen ${dis}" onclick="modalPenalty()"><span class="ei">${IC.penalty}</span><span class="el">Penalty</span></div>
        <div class="evtbtn einj ${dis}" onclick="modalInjury()"><span class="ei">${IC.injury}</span><span class="el">Blessure</span></div>`}
        <div class="evtbtn ${dis}" onclick="modalExtra()"><span class="ei">${IC.more}</span><span class="el">Meer</span></div>
      </div>
      <button class="btn btn-pale btn-sm" style="margin-top:2px" onclick="toggleSimpleEvents()">${simple ? `${icI(IC.plus)} Meer opties tonen` : `${icI(IC.close)} Minder opties tonen`}</button>
      ${/* Klaargezette wissels: altijd bereikbaar, met een telletje zodat je ziet dat er iets
           wacht. Ze gaan nooit vanzelf af — zie modalPlannedSubs(). Het telletje toont enkel wat je
           in dít deel kan doorvoeren (plannedCountNu), niet je hele plan voor de wedstrijd. */ ''}
      <button class="btn btn-orgpale btn-sm" style="margin-top:6px;margin-bottom:14px" onclick="modalPlannedSubs()">${icI(IC.clipboard)} Geplande wissels${plannedCountNu(match) ? ` (${plannedCountNu(match)})` : ''}</button>`; })()}
      ${(canEvent && hasUndo()) ? `<button class="btn btn-orgpale" onclick="undoLast()">${icI(IC.undo)} Laatste actie ongedaan maken</button>` : ''}
      ${/* "Deel score" enkel ná de wedstrijd: tijdens het spel stond die knop in de weg van de
           knoppen die je dan echt nodig hebt, en de stand delen doe je toch achteraf. */ ''}
      ${isDone ? `<button class="btn btn-pale" onclick="go('detail','${match.id}')">${icI(IC.chart)} Wedstrijd bekijken</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="shareWhatsApp(match)">${icI(IC.share)} Deel score</button>` : ''}`;
  } else if (tab === 'opstelling') {
    const on = playersOnField(match), off = playersOnBench(match), absent = match.players.filter(p => p.absent), mins = calcMinutes(match);
    const absentBtn = pid => ro ? '' : `<button class="evt-del" style="margin-left:6px;flex-shrink:0" onclick="modalMarkAbsent('${pid}')" title="Niet aanwezig">×</button>`;
    tabContent = `
      ${miniScore}
      ${canStartNext ? pauseLineupHtml(match)
        : ((!ro && !isDone && match.quarterStatus === 'running')
          ? liveLineupHtml(match)
          : `<div class="card">${renderPitch(match, on)}</div>`)}
      <div class="card">
        <div class="sec" style="margin-top:0">Op het veld (${on.length})</div>
        ${on.length ? on.map(p => playerRowHtml(p, mins[p.id], false, getGameTimeMs(match), ro ? '' : absentBtn(p.id))).join('') : '<p style="color:var(--txt2);font-size:14px">Niemand op het veld.</p>'}
        ${off.length ? `<hr><div class="sec">Bank (${off.length})</div>${off.map(p => playerRowHtml(p, mins[p.id], true, getGameTimeMs(match), ro ? '' : absentBtn(p.id))).join('')}` : ''}
        ${absent.length ? `<hr><div class="sec" style="color:var(--rd)">Niet aanwezig (${absent.length})</div>${absent.map(p => `<div class="prow">${numDot(p, 'pnum pnum-off', 'opacity:.4')}<div style="flex:1"><div class="pname" style="opacity:.5;text-decoration:line-through">${esc(p.name)}</div></div>${ro ? '' : `<button class="btn btn-sm btn-pale" style="font-size:11px;padding:3px 8px" onclick="doUnmarkAbsent('${p.id}')">Herstel</button>`}</div>`).join('')}` : ''}
      </div>
      ${planningTijdensMatchHtml(match)}`;
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
  ${(!ro && !isBetween) ? `<button class="fab-note" onclick="modalQuickNote()" title="Snelle notitie">${IC.edit}</button><button class="fab-mark" onclick="markMoment()" title="Moment markeren">${IC.motm}</button>` : ''}
  <div class="ltabs">
    ${ro ? '' : `<button class="ltab ${tab==='wedstrijd'?'act':''}" onclick="setTab('wedstrijd')"><span class="ti">${IC.ball}</span>Wedstrijd</button>`}
    <button class="ltab ${tab==='opstelling'?'act':''}" onclick="setTab('opstelling')"><span class="ti">${IC.shirt}</span>Opstelling${canStartNext ? '<span class="ltab-dot" title="Wissels voor het volgende deel regel je hier"></span>' : ''}</button>
    <button class="ltab ${tab==='log'?'act':''}" onclick="setTab('log')"><span class="ti">${IC.log}</span>Verloop</button>
  </div>`;
}

// Binnenkant van een spelerkeuzeknop (wie scoorde / assist / kaart / wissel): groot rugnummer met de
// familienaam eronder. Heeft de speler geen nummer — rugnummers zijn optioneel — dan staat de naam
// zelf groot, want anders is de knop een lege doos met een klein woordje eronder.
// Naam op een spelersknop: dezelfde weergave als op het velddiagram — voornaam met de beginletter
// van de familienaam, en meer letters zodra twee spelers dezelfde voornaam hebben. Vroeger stond
// hier enkel de familienaam, waardoor je op het veld "Sam D." las en in de wisselmodal "De Wit".
// Ontdubbelen gebeurt over de hele wedstrijdselectie, zodat een knop dezelfde naam toont als de bol.
function pickerNaam(p) {
  const lijst = (match && match.players && match.players.some(x => x.id === p.id)) ? match.players : [p];
  return fieldDisplayNames(lijst).get(p.id) || _firstName(p.name || '');
}
function playerBtnInner(p, kleur) {
  const naam = esc(pickerNaam(p));
  const klein = `<span style="font-size:10px;color:var(--txt2);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${naam}</span>`;
  const n = pNum(p);
  if (!n) return `<span style="font-size:13px;font-weight:900;color:${kleur};line-height:1.15;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${naam}</span>`;
  return `<span style="font-size:22px;font-weight:900;color:${kleur};line-height:1">${esc(n)}</span>` + klein;
}
function playerRowHtml(p, minsData, isOff=false, totalMs=0, extraBtn='') {
  if (minsData && minsData.absent) {
    const cap = (match && match.captainId === p.id) ? ` ${icI(IC.captain)}` : '';
    return `<div class="prow" style="opacity:.5">
      ${numDot(p, 'pnum pnum-off')}
      <div style="flex:1"><div class="pname" style="text-decoration:line-through">${esc(p.name)}${cap}</div></div>
      <div class="pmins" style="margin-left:6px;color:var(--rd)">Niet aanwezig</div>
    </div>`;
  }
  const ms = minsData ? minsData.ms : 0;
  const m = playedMin(ms);
  const cap = (match && match.captainId === p.id) ? ` ${icI(IC.captain)}` : '';
  const motm = (match && match.motmId === p.id) ? ` ${icI(IC.motm)}` : '';
  const pct = totalMs > 0 ? Math.round(ms / totalMs * 100) : null;
  const low = pct !== null && pct < 50;
  const mid = pct !== null && pct >= 50 && pct < 75;
  const bar = pct !== null ? `<div class="fairbar ${low?'low':mid?'mid':''}" style="max-width:120px"><span style="width:${Math.min(100,pct)}%"></span></div>` : '';
  return `<div class="prow">
    ${numDot(p, 'pnum ' + (isOff?'pnum-off':''))}
    <div style="flex:1"><div class="pname">${esc(p.name)}${cap}${motm}</div>${bar}</div>
    <div class="pmins ${low?'pmins-warn':''}" style="margin-left:6px">${m}'${pct!==null?` · ${pct}%`:' gespeeld'}</div>
    ${extraBtn}
  </div>`;
}
// Timer blijft lopen op álle subtabs: checkOvertimeAlert (eindsignaal) draait in de timer-
// interval en moet ook piepen als de gebruiker net de speeltijden (Opstelling) bekijkt.
// updateTimerDisplay stopt zelf meteen zonder #timer-time-element, dus dit kost niets.
function setTab(t) { tab = t; _lineupSel = null; render(); startTimer(); }
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
// "Wedstrijd starten" op het prep-scherm zet enkel de status op live — de klok begint pas bij
// startQuarter(). Een misklik daar was tot nu toe niet meer terug te draaien in de app: de
// wedstrijd stond live voor alle kijkers en er was enkel nog de weg naar het einde. Deze twee
// functies zetten haar terug op gepland, maar alleen zolang er geen enkel deel gelopen heeft en
// geen enkele gebeurtenis gelogd is — anders zou je speelminuten en events in een tussentoestand
// achterlaten. De controle staat bewust twee keer: de knop verschijnt niet, en de actie weigert.
function confirmTerugNaarGepland() {
  if (!canManage() || !match) return;
  if ((match.quarters || []).length || (match.events || []).length) {
    showToast('Deze wedstrijd is al begonnen — terugzetten kan niet meer.', 'err');
    return;
  }
  openModal(`<h3>${icI(IC.undo)} Toch nog niet starten?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De wedstrijd gaat terug naar <b>gepland</b> en is niet langer live zichtbaar voor kijkers. Er is nog niets bijgehouden, dus er gaat niets verloren.</p>
    <button class="btn btn-green" onclick="terugNaarGepland()">${icI(IC.check)} Ja, terug naar gepland</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function terugNaarGepland() {
  if (!canManage() || !match) return;
  if ((match.quarters || []).length || (match.events || []).length) {
    closeModal(); showToast('Deze wedstrijd is al begonnen — terugzetten kan niet meer.', 'err');
    return;
  }
  match.status = 'planned';
  match.currentQuarter = 0;
  match.quarterStatus = 'not_started';
  await dbSave(match);
  closeModal();
  showToast('Terug naar gepland.', 'ok');
  await go('prep', match.id);
}
async function startQuarter() {
  if (match.quarterStatus === 'running') return; // dubbeltik-guard: deel loopt al
  _lineupSel = null;   // selectie uit de pauze-opstelling niet laten hangen
  match.currentQuarter++;
  match.quarterStatus = 'running';
  match.quarters.push({ num: match.currentQuarter, startTime: Date.now(), endTime: null, totalPaused: 0, pausedAt: null });
  addEvent('quarter_start');
  // Tijdens de pauze ingeplande wissels nu automatisch doorvoeren bij de start van het deel.
  for (const s of (match.pendingSubs || [])) {
    const pOut = match.players.find(p => p.id === s.outId), pIn = match.players.find(p => p.id === s.inId);
    if (!pOut || !pIn) continue;
    // Speler intussen afwezig gemarkeerd (bv. vertrokken tijdens de rust): wissel niet doorvoeren —
    // een afwezige speler het veld op sturen geeft een onzichtbaar gat op zijn positie.
    if (pIn.absent) { showToast(`Ingeplande wissel overgeslagen: ${pIn.name} is afwezig gemarkeerd.`, 'err'); continue; }
    // posBefore = positie van pIn vóór deze wissel (meestal geen, tenzij hij al eerder op het
    // veld stond en nadien terugkeert) — nodig zodat playersAtPeriodStart() een speler die
    // meermaals in-en-uit gewisseld wordt correct kan terugspoelen i.p.v. hem simpelweg naar
    // "geen positie" te resetten, wat zijn eerdere stint zou wissen.
    const posBefore = { x: pIn.x, y: pIn.y, line: pIn.line, posNum: pIn.posNum };
    addEvent('substitution', { playerOutId: s.outId, playerInId: s.inId, atBreak: true, posBefore });
    pOut.onField = false;
    pIn.onField = true; pIn.x = pOut.x; pIn.y = pOut.y; pIn.line = pOut.line; pIn.posNum = pOut.posNum;
  }
  match.pendingSubs = [];
  for (const s of (match.pendingPosSwaps || [])) {
    const pA = match.players.find(p => p.id === s.pA), pB = match.players.find(p => p.id === s.pB);
    if (!pA || !pB) continue;
    const posA = { x: pA.x, y: pA.y, line: pA.line, posNum: pA.posNum };
    const posB = { x: pB.x, y: pB.y, line: pB.line, posNum: pB.posNum };
    addEvent('posSwap', { pA: s.pA, pB: s.pB, atBreak: true, posA, posB });
    pA.x = posB.x; pA.y = posB.y; pA.line = posB.line; pA.posNum = posB.posNum;
    pB.x = posA.x; pB.y = posA.y; pB.line = posA.line; pB.posNum = posA.posNum;
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
  if (!q || q.pausedAt || q.endTime) return; // guard: al gepauzeerd, of het deel is al beëindigd (stale UI/co-admin-sync)
  q.pausedAt = Date.now(); match.quarterStatus = 'paused';
  releaseWake();
  await dbSave(match); render();
}
async function resumeQuarter() {
  const q = match.quarters[match.quarters.length - 1];
  if (!q || q.pausedAt == null || q.endTime) return; // guard: niet gepauzeerd, of het deel is al beëindigd — anders krimpt de reeds vastgelegde speeltijd
  q.totalPaused = (q.totalPaused || 0) + (Date.now() - q.pausedAt); q.pausedAt = null;
  match.quarterStatus = 'running';
  requestWake();
  await dbSave(match); startTimer(); render();
}
// Drempel voor de "ben je vergeten af te sluiten?"-nudge, relatief aan de blokduur: een kwart van
// het deel, met een minimum van 3 min zodat korte blokken niet bij elke minuut zeuren. Een vaste
// 10 min was bij blokken van 20 min veel te laks — 9 min te laat afsluiten (+45% op de speeltijd
// van elke speler op het veld) gaf dan geen enkele waarschuwing.
function overtimeNudgeMin(m) { return Math.max(3, Math.round(((m && m.quarterDuration) || 0) * 0.25)); }
// Beëindig het huidige deel handmatig -> pauze tussen de delen (klok staat stil tot de volgende start).
// Vergeten af te sluiten? Bij fors overtime (zie overtimeNudgeMin) waarschuwen en de mogelijkheid
// geven de werkelijke duur te corrigeren, i.p.v. stilzwijgend Date.now() te nemen — anders
// vertekent zo'n vergeten tik alle speeltijden van dit deel.
function endPeriod() {
  const label = pSingLow(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const overtimeMin = durMs ? Math.round((getQElapsed(match) - durMs) / 60000) : 0;
  const warn = (durMs && overtimeMin > overtimeNudgeMin(match)) ? `<div class="nudge" style="margin-bottom:12px">${icI(IC.warn)} Dit ${label} loopt al ${overtimeMin} min langer dan gepland (${match.quarterDuration} min voorzien). Ben je vergeten af te sluiten? Corrigeer hieronder desgewenst de werkelijke duur.
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
  const gezet = zetGeplandeOpstellingKlaar(match);
  stopTimer(); releaseWake(); await dbSave(match); closeModal(); render();
  if (gezet) showToast(gezet, 'ok');
}
// Zodra de pauze begint: de opstelling die je voor het volgende deel tekende meteen klaarzetten als
// gewone wissels. Voordien moest je daar in de pauze zelf een knop voor indrukken, en vergat je dat,
// dan begon het volgende deel stil met wie het vorige eindigde — je getekende opstelling leek
// genegeerd. Nu staat alles klaar in het pauzescherm, waar je het nog kan aanpassen of weghalen; bij
// de start wordt het doorgevoerd zoals elke andere klaargezette wissel.
// Staat er al iets klaar (zelf gepland of van een vorige keer), dan blijft dat met rust: dat
// overschrijven zou handwerk wissen. De knop "Geplande opstelling gebruiken" blijft bestaan om
// alsnog te vervangen.
function zetGeplandeOpstellingKlaar(m) {
  const deel = (m.currentQuarter || 0) + 1;
  const plan = ((m.plannedLineups || {})[deel] || []);
  if (!plan.length) return '';
  if (((m.pendingSubs || []).length + (m.pendingPosSwaps || []).length) > 0) return '';
  const huidig = playersOnField(m).map(p => ({ id: p.id, x: p.x, y: p.y, line: p.line, posNum: p.posNum }));
  const diff = lineupToPending(m, huidig, plan);
  if (!diff.subs.length && !diff.swaps.length) return '';
  m.pendingSubs = diff.subs;
  m.pendingPosSwaps = diff.swaps;
  const telling = [
    diff.subs.length ? `${diff.subs.length} wissel${diff.subs.length === 1 ? '' : 's'}` : '',
    diff.swaps.length ? `${diff.swaps.length} positiewissel${diff.swaps.length === 1 ? '' : 's'}` : '',
  ].filter(Boolean).join(' en ');
  return `Opstelling voor ${pSingLow(m)} ${deel} klaargezet: ${telling}.${diff.problemen.length ? ' ' + diff.problemen[0] : ''}`;
}
// Afgesloten wedstrijd heropenen. Dat gebeurt om twee heel verschillende redenen, en die moeten
// uit elkaar: een foutieve afsluiting hervat het LAATSTE deel, een verlenging voegt er een toe.
// Voordien deed heropenen altijd +1, waardoor een per ongeluk afgesloten wedstrijd van één blok
// stil een wedstrijd van twee delen werd — met een "deel 2" in het verslag en in beide PDF's.
function confirmReopenMatch() {
  const label = pSingLow(match);
  const laatste = match.quarters[match.quarters.length - 1];
  const hervatbaar = !!(laatste && laatste.startTime && laatste.endTime);
  // Nooit gestart en toch afgesloten (mis-tik op "Afsluiten"): er is geen deel om te hervatten,
  // dus dan is de juiste herstelactie ze terugzetten naar "gepland".
  if (!match.quarters.length) {
    openModal(`<h3>Wedstrijd heropenen?</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Deze wedstrijd is afgesloten zonder ooit gestart te zijn. We zetten ze terug op <b>gepland</b>, zodat ze uit de uitslagen verdwijnt en je ze gewoon kan starten.</p>
      <button class="btn btn-org" onclick="doUnfinishToPlanned()">${icI(IC.check)}Terug naar gepland</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  openModal(`<h3>Wedstrijd heropenen?</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:14px">Waarom heropen je de wedstrijd?</p>
    ${hervatbaar ? `<button class="btn btn-org" onclick="doResumeLastPeriod()">${icI(IC.live)} Verkeerd afgesloten — verder in ${label} ${laatste.num}</button>
      <p style="text-align:center;color:var(--txt2);font-size:12px;margin:6px 0 12px">De klok gaat verder waar ze stond; er komt geen extra ${label} bij.</p>` : ''}
    <button class="btn btn-pale" onclick="doReopenMatch()">${icI(IC.plus)} Verlenging — extra ${label} toevoegen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doUnfinishToPlanned() {
  if (match.quarters.length) { closeModal(); return; }
  match.status = 'planned'; match.quarterStatus = 'not_started'; match.currentQuarter = 0;
  closeModal();
  await dbSave(match);
  go('prep', match.id);
}
// Foutieve afsluiting ongedaan maken: het laatste deel loopt weer, zonder extra deel.
async function doResumeLastPeriod() {
  if (match.status === 'live') { closeModal(); return; } // dubbeltik-guard
  const q = match.quarters[match.quarters.length - 1];
  if (!q || !q.startTime || !q.endTime) { closeModal(); return; }
  // De tijd tussen het (foute) afsluiten en nu telt als pauze — zo hervat de klok exact waar ze
  // stond i.p.v. de wandkloktijd sindsdien als speeltijd bij te tellen (zelfde truc als
  // resumeQuarter). Anders kreeg iedereen op het veld er de bedenktijd gratis bij.
  q.totalPaused = (q.totalPaused || 0) + Math.max(0, Date.now() - q.endTime);
  q.endTime = null; q.pausedAt = null;
  // Het quarter_end-event van dit deel hoort er niet meer te staan. Met tombstone, zodat de
  // co-admin-merge in applyCloudMatch het niet vanaf een ander toestel terugbrengt.
  for (let i = match.events.length - 1; i >= 0; i--) {
    const e = match.events[i];
    if (e.type === 'quarter_end' && (e.quarterNum == null || e.quarterNum === q.num)) {
      tombstoneEvent(match, e.id); match.events.splice(i, 1); break;
    }
  }
  match.status = 'live'; match.quarterStatus = 'running'; match.currentQuarter = q.num;
  requestWake();
  closeModal();
  await dbSave(match);
  startTimer();
  go('live', match.id);
}
async function doReopenMatch() {
  if (match.status === 'live') { closeModal(); return; } // dubbeltik-guard: anders telkens +1 fantoomdeel
  match.status = 'live';
  match.quarterStatus = 'between';
  match.numQuarters = Math.max(match.numQuarters || 0, match.quarters.length) + 1;
  closeModal();
  await dbSave(match);
  go('live', match.id);
}
// "Afsluiten" staat in de hoofding, dus op een gsm is een mis-tik snel gebeurd. Bij een wedstrijd
// die nog nooit gestart is, zette die tik ze zonder enige vraag op 0-0 "Gespeeld" met nul delen —
// en zo verscheen ze ook in de uitslagen van het dagverslag. Eerst de veilige uitweg aanbieden.
function endMatch() {
  if (!match.quarters.length) {
    openModal(`<h3>Deze wedstrijd is nog niet gestart</h3>
      <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px">Afsluiten zet ze op <b>0-0 "Gespeeld"</b> zonder speeltijd, en dan komt ze zo ook in de uitslagen van het dagverslag te staan.</p>
      <button class="btn btn-pale" onclick="closeModal()">${icI(IC.check)}Laten staan als gepland</button>
      <button class="btn btn-red" style="margin-top:8px" onclick="endMatchModal()">Toch afsluiten op 0-0</button>`);
    return;
  }
  endMatchModal();
}
function endMatchModal() {
  const label = pSingLow(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const overtimeMin = durMs ? Math.round((getQElapsed(match) - durMs) / 60000) : 0;
  // Loopt de klok meer dan dubbel de voorziene duur, dan is ze duidelijk vergeten en is de
  // verstreken tijd geen bruikbaar voorstel meer: dan de NOMINALE duur voorinvullen. Voordien stond
  // de foute waarde vóóringevuld (bv. 140 min voor een blok van 20) en moest je de juiste zelf
  // typen — wie gewoon bevestigde, zette die 140 minuten definitief vast.
  const vergeten = !!durMs && getQElapsed(match) > durMs * 2;
  const prefill = vergeten ? (match.quarterDuration || 1) : Math.round(getQElapsed(match) / 60000);
  const warn = (durMs && overtimeMin > overtimeNudgeMin(match)) ? `<div class="nudge" style="margin-bottom:12px">${icI(IC.warn)} Dit ${label} loopt al ${overtimeMin} min langer dan gepland (${match.quarterDuration} min voorzien). Ben je vergeten af te sluiten? Corrigeer hieronder desgewenst de werkelijke duur.${vergeten ? ` <b>De klok liep veel langer dan verwacht, dus we stellen de voorziene ${match.quarterDuration} min voor</b> — pas aan als het anders was.` : ''}
    <div class="fg" style="margin-top:8px"><label>Werkelijke duur van dit ${label} (minuten)</label><input id="em-correct-min" type="number" inputmode="numeric" value="${prefill}" min="1"></div></div>` : '';
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
let _noteBusy = false; // dubbeltik-guard voor snelle notitie / ★-moment (voorkomt dubbele regels)
async function saveQuickNote() {
  const txt = (document.getElementById('qn-area')?.value || '').trim();
  if (!txt) { closeModal(); return; }
  if (_noteBusy) return;
  _noteBusy = true;
  try {
    const stamp = `[${fmtTime(getGameTimeMs(match))}] ${txt}`;
    match.notes = match.notes ? match.notes + '\n' + stamp : stamp;
    await dbSave(match); closeModal();
  } finally { _noteBusy = false; }
}
async function markMoment() {
  if (_noteBusy) return;
  _noteBusy = true;
  try {
    const stamp = `[${fmtTime(getGameTimeMs(match))}] ★`;
    match.notes = match.notes ? match.notes + '\n' + stamp : stamp;
    await dbSave(match);
    const btn = document.querySelector('.fab-mark');
    if (btn) { btn.innerHTML = IC.check; setTimeout(() => { btn.innerHTML = IC.motm; }, 800); }
  } finally { _noteBusy = false; }
}
function modalEditMatchInfo() {
  const notStarted = (match.currentQuarter || 0) === 0 && match.status !== 'done';
  const partsBlock = notStarted ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Aantal blokken</label>
        <select id="ei-pt" onchange="eiPeriodChange()"><option value="1" ${match.numQuarters===1?'selected':''}>1 blok</option>${['helften','delen','kwarten'].map(k=>`<option value="${k}" ${match.numQuarters!==1&&match.periodKey===k?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
      <div class="fg"><label>Duur van een blok</label>
        <select id="ei-qd" onchange="onDurChange('ei-qd','ei-qd-custom')">${durOptsHtml(match.periodKey, match.quarterDuration)}</select>
        <input id="ei-qd-custom" type="number" min="1" max="99" placeholder="min." style="margin-top:6px;${!(DURATIONS[match.periodKey]||[]).includes(match.quarterDuration)&&match.quarterDuration?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;background:var(--card);-webkit-appearance:none" value="${!(DURATIONS[match.periodKey]||[]).includes(match.quarterDuration)&&match.quarterDuration?match.quarterDuration:''}"></div>
    </div>` : '';
  openModal(`<h3>${icI(IC.edit)} Wedstrijdinfo bewerken</h3>
    <input type="hidden" id="ei-loc" value="${esc(match.location||'')}">
    <div class="fg"><label>Ploeg-label (optioneel)</label><input id="ei-subteam" type="text" value="${esc(match.subteam||'')}" placeholder="bv. A of B — enkel invullen als je ploeg in meerdere delen speelt" autocomplete="off"></div>
    <div class="fg"><label>Tegenstander</label><input id="ei-opp" type="text" value="${esc(match.opponent||'')}" placeholder="Naam ploeg" autocomplete="off"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Datum</label><input id="ei-date" type="date" value="${match.date||''}"></div>
      <div class="fg"><label>Startuur</label><input id="ei-time" type="time" value="${match.time||''}"></div>
    </div>
    ${match.tournamentId
      // Een tornooiwedstrijd staat op neutraal terrein en erft de locatie van het tornooi. De
      // thuis/uit-keuze had hier geen betekenis (isAway() negeert ze bij een tornooi) maar overschreef
      // wél de tornooilocatie: één tik en de plaats verdween uit de kop van het verslag en de PDF.
      ? `<div class="fg"><label>Locatie</label>
          <div style="font-size:15px;font-weight:600;padding:6px 0">${esc(match.location || '—')}</div>
          <div style="font-size:11px;color:var(--txt2)">Komt van het tornooi — een tornooiwedstrijd is neutraal terrein, dus geen thuis of uit. Pas je ze aan, dan doe je dat bij het tornooi zelf.</div>
        </div>`
      : `<div class="fg"><label>Thuis of uit?</label>
          <div class="tgl" id="ei-loc-tgl">
            <button type="button" class="${match.location==='Thuis'?'act':''}" onclick="eiSetLoc('Thuis',this)">${icI(IC.home)} Thuismatch</button>
            <button type="button" class="${match.location==='Uit'?'act':''}" onclick="eiSetLoc('Uit',this)">${icI(IC.plane)} Uitmatch</button>
          </div></div>`}
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
      ${match.tournamentId
        // Op een tornooidag zijn trainer en ploegverantwoordelijke voor alle wedstrijden dezelfde:
        // die geef je één keer bij het tornooi in. Kon je ze hier per wedstrijd overschrijven, dan
        // liep de wedstrijd stil uit de pas met het tornooi (en omgekeerd: een wijziging bij het
        // tornooi kwam nooit in de wedstrijd terecht). Zelfde aanpak als bij de locatie hierboven.
        ? `<div class="fg"><label>${trainerLabel(matchTrainer(match))}</label>
            <div style="font-size:15px;font-weight:600;padding:6px 0">${esc(matchTrainer(match) || '—')}</div></div>
          <div class="fg" style="margin-bottom:0"><label>${responsibleLabel(matchResponsible(match))}</label>
            <div style="font-size:15px;font-weight:600;padding:6px 0">${esc(matchResponsible(match) || '—')}</div>
            <div style="font-size:11px;color:var(--txt2)">Trainer(s) en ploegverantwoordelijke(n) komen van het tornooi en gelden voor elke wedstrijd ervan. Pas je ze aan, dan doe je dat bij het tornooi zelf.</div>
          </div>`
        : `${staffPickerHtml('ei', 'trn', teamTrainerNames(teamById(match.teamId)), match.trainer)}
          ${staffPickerHtml('ei', 'resp', teamResponsibleNames(teamById(match.teamId)), match.responsible)}`}
    </details>
    <button class="btn btn-green" style="margin-top:12px" onclick="saveMatchInfo()">${icI(IC.check)}Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function eiSetLoc(val, btn) {
  const h = document.getElementById('ei-loc'); if (h) h.value = val;
  [...btn.parentElement.children].forEach(b => b.classList.toggle('act', b === btn));
}
// De blokken-selector kan ook "1 blok" zijn (waarde "1"): dat is periodKey 'delen' met
// numQuarters 1, net zoals readTrnPeriodSel() in de tornooiwizard. Vertaal dat hier vóór de
// duurlijst opnieuw opgebouwd wordt, anders is er geen enkele duuroptie voor de waarde "1".
function eiPeriodChange() {
  const raw = (document.getElementById('ei-pt') || {}).value || 'kwarten';
  const pk = raw === '1' ? 'delen' : raw;
  const sel = document.getElementById('ei-qd');
  if (sel) sel.innerHTML = durOptsHtml(pk, DUR_DEFAULT[pk]);
  const ci = document.getElementById('ei-qd-custom'); if (ci) ci.style.display = 'none';
}
async function saveMatchInfo() {
  const v = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const opp = v('ei-opp').trim(); if (opp) match.opponent = opp;
  match.subteam = v('ei-subteam').trim();
  match.date = v('ei-date') || match.date;
  match.time = v('ei-time');
  const loc = v('ei-loc'); if (loc) match.location = loc;
  if (document.getElementById('ei-pt')) {
    // numQuarters uit de selector lezen i.p.v. af te leiden uit periodKey: een wedstrijd van
    // 1 blok heeft periodKey 'delen' met numQuarters 1, en die werd hier stil 3 delen (de
    // selector kon die waarde niet eens tonen). Zelfde logica als readTrnPeriodSel().
    const raw = v('ei-pt');
    if (raw === '1') { match.periodKey = 'delen'; match.numQuarters = 1; }
    else if (PERIOD_TYPES[raw]) { match.periodKey = raw; match.numQuarters = PERIOD_TYPES[raw].count; }
    match.quarterDuration = readDur('ei-qd', 'ei-qd-custom', match.quarterDuration);
  }
  const formEl = document.getElementById('ei-formation');
  const prevFormation = match.formation;
  if (formEl) match.formation = formEl.value;
  const formationChanged = formEl && match.formation !== prevFormation;
  // Bij een tornooiwedstrijd staan deze twee velden er niet (ze komen van het tornooi): dan niets
  // overschrijven, anders wist de lege waarde de bewaarde terugval. readStaffPicker geeft in dat
  // geval de meegegeven bestaande waarde terug.
  match.trainer = readStaffPicker('ei', 'trn', match.trainer);
  match.responsible = readStaffPicker('ei', 'resp', match.responsible);
  syncTournamentStaff(match);
  match.referee = v('ei-ref').trim();
  const compSel = v('ei-comp'); match.competition = compSel === '__other__' ? v('ei-comp-custom').trim() : compSel;
  match.matchday = v('ei-md').trim();
  match.jersey = v('ei-jersey').trim();
  match.venue = v('ei-venue').trim();
  await dbSave(match);
  const slots = formationChanged && (FORMATIONS[match.matchType]||[]).find(f => f.name === match.formation)?.slots;
  // Zodra er wissels/positiewissels gelogd zijn, blokkeert modalEditPositions het collectief
  // herplaatsen (zou de kwart-reconstructie corrumperen) — bied de knop dan ook niet aan.
  if (slots && (match.events || []).some(e => e.type === 'substitution' || e.type === 'posSwap')) {
    closeModal(); render();
    showToast('Formatie gewijzigd (label). Er zijn al wissels gebeurd — gebruik "Positiewissel" om spelers individueel te herplaatsen.', 'ok');
  } else if (slots) {
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
  // Dit herplaatst de STARTopstelling. Zodra er wissels/positiewissels zijn gebeurd, zou dat de
  // reconstructie van de latere kwarten corrumperen (de posBefore/posA/posB-snapshots en
  // playersAtPeriodStart() verwijzen naar de oorspronkelijke posities). Dan blokkeren en naar de
  // per-kwart "Positiewissel" verwijzen. Vóór de eerste wissel (opstelling opzetten) blijft dit werken.
  if ((match.events || []).some(e => e.type === 'substitution' || e.type === 'posSwap')) {
    closeModal();
    showToast('Er zijn al wissels of positiewissels gebeurd — gebruik "Positiewissel" om posities aan te passen. De startopstelling kan hier niet meer herplaatst worden.', 'err');
    return;
  }
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
    ? unplaced.map(p => `<span class="place-chip ${_ep.sel===p.id?'sel':''}" onclick="_epSelectPlayer('${p.id}')">${numSpan(p, 'pcn')}${esc(p.name)}</span>`).join('')
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
    ${match.players.map(p => `<div class="mopt ${match.motmId===p.id?'sel':''}" onclick="setMotm('${p.id}')">${numDot(p, 'mopt-num')}${esc(p.name)}</div>`).join('')}
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
  // canManage() i.p.v. isAdmin: in "Kijken"-modus zie je de notities zelf niet op het scherm, dus
  // dan horen ze ook niet in een bericht dat je doorstuurt.
  if (canManage() && m.notes) lines.push('', m.notes);
  // Volgende geplande wedstrijd van dezelfde ploeg
  try {
    const all = await dbAll();
    const today = new Date().toISOString().split('T')[0];
    // Geplande TORNOOIwedstrijden hier weglaten: die staan niet in de wedstrijdenlijst en de datum
    // van een tornooidag zegt de ploeggroep niets ("Volgende: vs Opp2" zonder context). En de
    // volgorde volgt isAway, zoals overal elders — anders stond bij een uitwedstrijd de eigen ploeg
    // hier wél eerst en in de rest van het bericht niet.
    const next = all.filter(x => x.teamName === m.teamName && x.status === 'planned' && !x.tournamentId && (x.date || '') >= today).sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0];
    if (next) {
      const thuis = isAway(next) ? next.opponent : tName(next);
      const uit = isAway(next) ? tName(next) : next.opponent;
      lines.push('', `📅 Volgende: ${thuis} vs ${uit} — ${matchWhen(next)}${next.location ? ' · ' + next.location : ''}`);
    }
  } catch (e) {}
  lines.push('', `— ${activeClubName || getClubName()}`);
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
  row('Club', activeClubName || getClubName() || '');
  row('Ploeg', team);
  row('Ploeg-label', m.subteam || '');
  row('Tegenstander', opp);
  row('Datum', m.date || '');
  row('Tijdstip', m.time || '');
  // Bij een tornooiwedstrijd is `location` de tornooilocatie, geen thuis/uit — dit was de enige
  // plek die isAway() niet volgde en zette "Sportpark Aalter" onder de kop "Thuis/uit".
  if (m.tournamentId) row('Tornooilocatie', m.location || '');
  else row('Thuis/uit', m.location || '');
  row('Locatie', m.venue || '');
  row('Wedstrijdtype', m.matchType || '');
  row('Competitie', m.competition || '');
  row('Speeldag', m.matchday || '');
  row('Opstelling', m.formation || '');
  row('Aantal periodes', m.numQuarters || '');
  row('Duur per periode (min)', m.quarterDuration || '');
  // Vast label: dit is een export, en een kolomnaam die meebeweegt met het aantal trainers maakt
  // het bestand moeilijker te verwerken. De namen zelf staan komma-gescheiden in de waarde.
  row('Trainer', matchTrainer(m));
  row('Afgevaardigde', matchResponsible(m));
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
  for (const p of sortedByName(m.players)) {
    const minMs = mins[p.id] ? playedMin(mins[p.id].ms) : 0;
    const g = m.events.filter(e => (e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored)) && e.playerId === p.id).length;
    const a = m.events.filter(e => e.type === 'goal_us' && e.assistId === p.id).length;
    const yc = m.events.filter(e => e.type === 'yellow_card' && e.playerId === p.id).length;
    const rc = m.events.filter(e => e.type === 'red_card' && e.playerId === p.id).length;
    const status = p.absent ? 'Niet aanwezig' : p.starting ? 'Basis' : 'Wissel';
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
  } else if (q && correctMin) {
    // Het laatste deel was al beëindigd, maar de gebruiker vulde in het afsluitdialoog een
    // gecorrigeerde duur in — die alsnog toepassen, anders is het correctieveld een stille no-op.
    q.endTime = q.startTime + (q.totalPaused || 0) + correctMin * 60000;
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
  if (_postEventQuarter === 'unknown') {
    // Bewust "Onbekend" gekozen bij "Event toevoegen": geen deel/tijdstip verzinnen — het event
    // komt zonder quarterNum in het verloop onder "Overig" (zelfde patroon als quick-events),
    // i.p.v. stil op de slotminuut van het laatste deel te belanden.
    match.events.push({ id: uid(), realTime: Date.now(), gameTimeMs: 0, quarterNum: null, type, ...extra });
    return;
  }
  const qn = _postEventQuarter !== null ? _postEventQuarter : match.currentQuarter;
  let gms;
  if (_postEventQuarter !== null && _postEventQuarter) {
    if (_postEventMinute !== null) {
      const qEnd = Math.max(0, gameTimeMsAtEndOfQuarter(match, _postEventQuarter) - 1);
      gms = Math.min(gameTimeMsAtStartOfQuarter(match, _postEventQuarter) + (_postEventMinute - 1) * 60000, qEnd);
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
  if (!pIn) return;
  // posBefore herstellen i.p.v. blind naar "geen positie" te resetten — anders verliest een
  // speler die al eerder op het veld stond (en nadien terugkeert) zijn vorige stint-positie.
  // Oudere events zonder posBefore (van vóór deze fix) vallen terug op het oude gedrag.
  if (e.posBefore) { pIn.x = e.posBefore.x; pIn.y = e.posBefore.y; pIn.line = e.posBefore.line; pIn.posNum = e.posBefore.posNum; }
  else { pIn.x = undefined; pIn.y = undefined; pIn.line = undefined; pIn.posNum = undefined; }
}
// Bij een posSwap wisselen beide spelers van positie. Bij het ongedaan maken/verwijderen
// van dat event moet dit teruggedraaid worden — analoog aan revertSubstitutionPositions.
function revertPosSwapPositions(m, e) {
  if (!e || e.type !== 'posSwap' || !e.pA || !e.pB || !e.posA || !e.posB) return;
  const pA = m.players.find(p => p.id === e.pA), pB = m.players.find(p => p.id === e.pB);
  if (pA) { pA.x = e.posA.x; pA.y = e.posA.y; pA.line = e.posA.line; pA.posNum = e.posA.posNum; }
  if (pB) { pB.x = e.posB.x; pB.y = e.posB.y; pB.line = e.posB.line; pB.posNum = e.posB.posNum; }
}
// C2: veldbezetting + posities volledig herberekenen vanaf de startopstelling (baseline), door alle
// wissel-/posSwap-events voorwaarts opnieuw toe te passen. Nodig na het bewerken van een wissel-event
// (speler/minuut), waarbij de losse mutatie de posities niet meer laat kloppen. De baseline (positie
// van de basisspelers bij aanvang) moet vastgelegd zijn TERWIJL de staat nog consistent was
// (playersAtPeriodStart(m,1) vóór de bewerking). Repareert meteen de posBefore/posA/posB-snapshots
// zodat playersAtPeriodStart nadien consistent blijft. Idempotent op een correcte wedstrijd.
function rebuildPositions(m, baseline) {
  const pos = {}, onF = {};
  m.players.forEach(p => { onF[p.id] = false; });
  (baseline || []).forEach(b => { onF[b.id] = true; pos[b.id] = { x: b.x, y: b.y, line: b.line, posNum: b.posNum }; });
  // Zelfde regel als in recomputeOnField: een afwezig gemarkeerde speler blijft van het veld, ook
  // al brengt een oudere wissel hem in de replay hieronder weer in (undo/event verwijderen).
  const absent = new Set(m.players.filter(p => p.absent).map(p => p.id));
  m.players.forEach(p => { if (p.absent) onF[p.id] = false; });
  const evs = [...m.events].filter(e => e.type === 'substitution' || e.type === 'posSwap' || e.type === 'red_card' || (e.type === 'injury' && e.leavesField))
    .sort((a, b) => a.gameTimeMs - b.gameTimeMs);
  for (const e of evs) {
    if (e.type === 'substitution') {
      if (e.playerInId) e.posBefore = pos[e.playerInId] ? { ...pos[e.playerInId] } : null; // snapshot repareren
      if (e.playerOutId) onF[e.playerOutId] = false;
      if (e.playerInId && !absent.has(e.playerInId)) { onF[e.playerInId] = true; if (e.playerOutId && pos[e.playerOutId]) pos[e.playerInId] = { ...pos[e.playerOutId] }; }
    } else if (e.type === 'posSwap' && e.pA && e.pB) {
      const a = pos[e.pA], b = pos[e.pB];
      e.posA = a ? { ...a } : e.posA; e.posB = b ? { ...b } : e.posB; // snapshots repareren
      if (b) pos[e.pA] = { ...b }; if (a) pos[e.pB] = { ...a };
    } else if (e.type === 'red_card' && e.playerId) {
      onF[e.playerId] = false;
    } else if (e.type === 'injury' && e.leavesField && e.playerId) {
      onF[e.playerId] = false;
    }
  }
  m.players.forEach(p => {
    p.onField = !!onF[p.id];
    if (pos[p.id]) { p.x = pos[p.id].x; p.y = pos[p.id].y; p.line = pos[p.id].line; p.posNum = pos[p.id].posNum; }
  });
}
// C3: keeperByQ (per kwart een lijst {id, sinceMs}) opnieuw opbouwen uit de events, zodat de
// keeperminuten kloppen na undo/verwijderen/bewerken van een wissel. Werkt vanaf een consistente
// staat: per kwart de veldstart via playersAtPeriodStart(), dan de wissels/posSwaps binnen het kwart
// voorwaarts toepassen en elke keeperwissel (speler op de doellijn) noteren.
function rebuildKeeperByQ(m) {
  const kbq = {};
  const maxQ = Math.max(0, m.currentQuarter || 0, ...((m.quarters || []).map(q => q.num || 0)));
  for (let q = 1; q <= maxQ; q++) {
    const startField = playersAtPeriodStart(m, q);
    const line = {}, onF = {};
    startField.forEach(p => { onF[p.id] = true; line[p.id] = p.line; });
    const keeperNow = () => { for (const id in onF) if (onF[id] && line[id] === 'Doel') return id; return null; };
    const list = [];
    let k = keeperNow();
    if (k) list.push({ id: k, sinceMs: gameTimeMsAtStartOfQuarter(m, q) });
    const evs = m.events.filter(e => e.quarterNum === q && !e.atBreak && (e.type === 'substitution' || e.type === 'posSwap' || e.type === 'red_card' || (e.type === 'injury' && e.leavesField)))
      .sort((a, b) => a.gameTimeMs - b.gameTimeMs);
    for (const e of evs) {
      if (e.type === 'substitution') {
        if (e.playerOutId) onF[e.playerOutId] = false;
        if (e.playerInId) { onF[e.playerInId] = true; if (e.playerOutId) line[e.playerInId] = line[e.playerOutId]; }
      } else if (e.type === 'posSwap' && e.pA && e.pB) {
        const la = line[e.pA], lb = line[e.pB]; line[e.pA] = lb; line[e.pB] = la;
      } else if ((e.type === 'red_card' || (e.type === 'injury' && e.leavesField)) && e.playerId) {
        onF[e.playerId] = false;
      }
      const nk = keeperNow();
      if (nk && nk !== k) list.push({ id: nk, sinceMs: e.gameTimeMs });
      k = nk;
    }
    if (list.length) kbq[q] = list;
  }
  m.keeperByQ = kbq;
}
async function doDeleteEvent(id) {
  const removed = match.events.find(e => e.id === id);
  const toRemove = removed ? [removed] : [];
  // 2e gele + automatische rode horen samen (zelfde paar-logica als undoLast): wie de foutieve
  // 2e gele verwijdert, moet ook de automatisch gegeven rode kwijt — anders blijft de speler
  // van het veld terwijl het verloop nog maar één gele kaart toont.
  if (removed && removed.type === 'yellow_card' && removed.playerId) {
    const remainingYellows = match.events.filter(e => e.type === 'yellow_card' && e.playerId === removed.playerId && e.id !== id).length;
    const autoRed = match.events.find(e => e.type === 'red_card' && e.autoSecondYellow && e.playerId === removed.playerId);
    if (autoRed && remainingYellows < 2) { toRemove.push(autoRed); showToast('De automatische rode kaart (2e geel) is mee verwijderd.', 'ok'); }
  }
  const ids = new Set(toRemove.map(ev => ev.id));
  toRemove.forEach(ev => tombstoneEvent(match, ev.id));
  match.events = match.events.filter(e => !ids.has(e.id));
  toRemove.forEach(ev => { revertSubstitutionPositions(match, ev); revertPosSwapPositions(match, ev); });
  if (removed && removed.type === 'captain_change') recomputeCaptain(match, removed);
  recomputeScore(match); recomputeOnField(match);
  // C3: keeperminuten herbouwen na het verwijderen van een keeper-relevante actie.
  if (match.keeperByQ && Object.keys(match.keeperByQ).length && toRemove.some(ev => ['substitution','posSwap','red_card','injury'].includes(ev.type))) rebuildKeeperByQ(match);
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
  // Positiewissel: enkel spelers die in dat deel op het veld stonden — met iemand van de bank van
  // positie wisselen betekent niets (hij komt er niet door op het veld) en zou de reconstructie
  // een positie laten toekennen aan wie niet speelt. De twee spelers die er nú in staan blijven
  // altijd kiesbaar, ook als een latere aanpassing hen buiten die lijst zou duwen.
  else if (t === 'posSwap') {
    const onIds = new Set(playersAtPeriodStart(match, e.quarterNum).map(p => p.id));
    [e.pA, e.pB].forEach(id => { if (id) onIds.add(id); });
    const swapOpts = sel => sortedByName(match.players.filter(p => onIds.has(p.id)))
      .map(p => `<option value="${p.id}" ${sel === p.id ? 'selected' : ''}>${p.number ? '#' + p.number + ' ' : ''}${esc(p.name)}</option>`).join('');
    fields = `<div class="fg"><label>Eerste speler</label><select id="ee-swap-a">${swapOpts(e.pA)}</select></div><div class="fg"><label>Tweede speler</label><select id="ee-swap-b">${swapOpts(e.pB)}</select></div>`;
  }
  else if (t === 'injury') fields = `<div class="fg"><label>Speler</label><select id="ee-player">${opts(e.playerId)}</select></div><div class="fg"><label>Type</label><select id="ee-itype"><option value="kramp" ${e.injuryType === 'kramp' ? 'selected' : ''}>Kramp</option><option value="licht" ${e.injuryType === 'licht' ? 'selected' : ''}>Licht</option><option value="ernstig" ${e.injuryType === 'ernstig' ? 'selected' : ''}>Ernstig</option></select></div><div class="chkrow"><input type="checkbox" id="ee-leaves" ${e.leavesField ? 'checked' : ''}> Verlaat het veld</div>`;
  else if (t === 'disallowed_us' || t === 'disallowed_them') fields = `<div class="fg"><label>Reden</label><input id="ee-reason" type="text" value="${esc(e.reason || '')}" placeholder="bv. buitenspel"></div>`;
  openModal(`<h3>${icI(IC.edit)} Event bewerken</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${evtLabel(e, match)}</p>
    ${e.atBreak
      ? `<p style="text-align:center;color:var(--txt2);font-size:12px;margin-bottom:12px">Pauzewissel — vindt plaats bij de start van het deel; de minuut is niet aanpasbaar.</p>`
      : `<div class="fg"><label>Minuut</label><input id="ee-min" type="number" value="${minute}" inputmode="numeric"></div>`}
    ${fields}
    <button class="btn btn-green" onclick="saveEditEvent('${id}')">${icI(IC.check)}Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function saveEditEvent(id) {
  const e = match.events.find(x => x.id === id); if (!e) return;
  const posAffecting = e.type === 'substitution' || e.type === 'posSwap';
  // C2: baseline (startopstelling) vastleggen terwijl de staat nog consistent is, vóór de bewerking.
  const baseline = posAffecting ? playersAtPeriodStart(match, 1) : null;
  const has = i => document.getElementById(i);
  const val = i => { const el = has(i); return el ? el.value : undefined; };
  // Twee keer dezelfde speler is geen positiewissel: rebuildPositions zou zijn positie met zichzelf
  // verwisselen en er staat een zinledig event in het verloop. Vóór élke mutatie controleren —
  // anders was de minuut hieronder al aangepast op het moment dat we de bewerking afbreken. De
  // modal blijft open, zodat de keuze meteen rechtgezet kan worden.
  if (has('ee-swap-a') && has('ee-swap-b') && val('ee-swap-a') === val('ee-swap-b')) {
    showToast('Kies twee verschillende spelers.', 'err'); return;
  }
  const min = parseInt(val('ee-min'));
  if (!isNaN(min) && min > 0) {
    const qStart = e.quarterNum ? gameTimeMsAtStartOfQuarter(match, e.quarterNum) : 0;
    // Begrens tot binnen het kwart, zodat het event niet in een volgend kwart schuift (wat de
    // op gameTimeMs gesorteerde speeltijd-/bezettingsberekening zou verstoren). Voor een nog
    // LOPEND (niet-afgesloten) deel is de grens de werkelijk verstreken speeltijd: de nominale
    // duur zou een event in overtime stil vervroegen én een minuut in de toekomst toelaten.
    const q = (match.quarters || []).find(x => x.num === e.quarterNum);
    const qEndMs = (q && !q.endTime) ? getGameTimeMs(match) : gameTimeMsAtEndOfQuarter(match, e.quarterNum);
    const qEnd = e.quarterNum ? Math.max(qStart, qEndMs - 1) : Infinity;
    e.gameTimeMs = Math.min(qStart + (min - 1) * 60000, qEnd);
  }
  const oldPlayerId = e.playerId;
  if (has('ee-player')) e.playerId = val('ee-player') || null;
  if (has('ee-assist')) e.assistId = val('ee-assist') || null;
  if (has('ee-ctype')) e.cornerType = val('ee-ctype');
  if (has('ee-scored')) e.scored = val('ee-scored') === '1';
  if (has('ee-out')) e.playerOutId = val('ee-out');
  if (has('ee-in')) e.playerInId = val('ee-in');
  if (has('ee-swap-a')) e.pA = val('ee-swap-a');
  if (has('ee-swap-b')) e.pB = val('ee-swap-b');
  if (has('ee-itype')) e.injuryType = val('ee-itype');
  if (has('ee-leaves')) e.leavesField = has('ee-leaves').checked;
  if (has('ee-reason')) e.reason = val('ee-reason');
  // Gepaarde 2e gele die naar een andere speler verhuist: de automatische rode blijft bij de
  // oorspronkelijke speler staan — dat kan juist zijn (die heeft misschien nog 2 gele) of niet;
  // te dubbelzinnig om automatisch om te hangen, dus expliciet waarschuwen.
  if (e.type === 'yellow_card' && oldPlayerId && e.playerId !== oldPlayerId) {
    const autoRed = match.events.find(x => x.type === 'red_card' && x.autoSecondYellow && x.playerId === oldPlayerId);
    if (autoRed) showToast('Let op: de automatische rode kaart (2e geel) staat nog bij de vorige speler — pas die zo nodig apart aan of verwijder ze.', 'err');
  }
  recomputeScore(match);
  if (posAffecting) {
    rebuildPositions(match, baseline); // C2: posities + bezetting herberekenen (onField incl.)
    if (match.keeperByQ && Object.keys(match.keeperByQ).length) rebuildKeeperByQ(match); // C3
  } else recomputeOnField(match);
  await dbSave(match); closeModal(); render();
}
// Extra registraties: schoten, reddingen, afgekeurd doelpunt.
function modalExtra() {
  const opt = (label, fn) => `<div class="mopt" onclick="${fn}">${label}</div>`;
  openModal(`<h3>${icI(IC.more)} Extra registreren</h3>
    <div class="sec" style="margin-top:0">${icI(IC.bolt)} Vrije trap</div>
    ${opt(`${icI(IC.bolt)} Vrije trap`, "modalFreekick()")}
    <div class="sec">${icI(IC.penalty)} Penalty</div>
    ${opt(`${icI(IC.penalty)} Penalty`, "modalPenalty()")}
    <div class="sec">${icI(IC.cardR)} Rode kaart</div>
    ${opt(`${icI(IC.cardR)} Rode kaart`, "modalCard('red')")}
    <div class="sec">${icI(IC.injury)} Blessure</div>
    ${opt(`${icI(IC.injury)} Blessure`, "modalInjury()")}
    <div class="sec">${icI(IC.corner)} Hoekschop</div>
    ${opt(`${icI(IC.corner)} Hoekschop voor ${esc(tName(match))}`, "logCorner('us')")}
    ${opt(`${icI(IC.corner)} Hoekschop tegen`, "logCorner('them')")}
    <div class="sec">${icI(IC.disallowed)} Afgekeurd doelpunt</div>
    ${opt(`${icI(IC.disallowed)} Afgekeurd voor ${esc(tName(match))}`, "modalDisallowed('us')")}
    ${opt(`${icI(IC.disallowed)} Afgekeurd tegen`, "modalDisallowed('them')")}
    <div class="sec">${icI(IC.shirt)} Opstelling</div>
    ${opt(`${icI(IC.shirt)} Kapitein wijzigen`, "modalSetCaptain()")}
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
}
// Heeft deze speler in deze wedstrijd effectief op het veld gestaan? Zo ja, dan is "niet aanwezig"
// het verkeerde gereedschap: dat is bedoeld voor wie niet opgedaagd is (0 minuten), en het zou zijn
// al gespeelde minuten wissen terwijl zijn doelpunten uit diezelfde wedstrijd blijven staan.
function hasPlayedInMatch(m, pid) {
  const p = (m.players || []).find(x => x.id === pid);
  if (!p || (m.currentQuarter || 0) === 0) return false;   // vóór de aftrap is niemand nog gespeeld
  if (p.starting) return true;
  return (m.events || []).some(e => e.type === 'substitution' && e.playerInId === pid);
}
// Zet deze speler in de DAGSELECTIE van het tornooi op NB. doMarkAbsent is puur wedstrijd-lokaal,
// dus wie halfweg de dag naar huis gaat kwam in de volgende wedstrijden automatisch weer in de
// basis (addTournamentMatch vult de pool met tournamentSquadMee) en kreeg minuten toegeschreven
// die hij niet speelde.
function markTournamentUnavailable(pid) {
  const t = match.tournamentId ? tournamentById(match.tournamentId) : null;
  if (!t) return false;
  const p = (match.players || []).find(x => x.id === pid);
  if (!p) return false;
  const list = tournamentSquadList(t).map(s => Object.assign({}, s));
  const hit = list.find(s => (s.srcId && p.rosterId && s.srcId === p.rosterId)
    || (s.name || '').trim() === (p.name || '').trim());
  if (!hit) return false;
  hit.sel = 'absent';
  t.squad = { players: list };
  saveTournament(t);
  return true;
}
function _trnAbsentAangevinkt() { return !!(document.getElementById('ma-trn') || {}).checked; }
function modalMarkAbsent(pid) {
  const p = match.players.find(pl => pl.id === pid);
  if (!p) return;
  const gespeeld = hasPlayedInMatch(match, pid);
  const min = Math.floor(((calcMinutes(match)[pid] || {}).ms || 0) / 60000);
  // Bij een tornooiwedstrijd meteen ook voor de rest van de dag kunnen afmelden.
  const trn = match.tournamentId ? tournamentById(match.tournamentId) : null;
  const trnOptie = trn ? `<label class="chkrow" style="margin-bottom:14px"><input type="checkbox" id="ma-trn"> Ook <b>niet beschikbaar</b> voor de rest van het tornooi</label>` : '';
  if (!gespeeld) {
    openModal(`<h3>${icI(IC.injury)} Niet aanwezig</h3>
      <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px"><b>${esc(p.name)}</b> markeren als niet aanwezig?<br><span style="font-size:12px">Speeltijd wordt op 0 gezet. Dit is ongedaan te maken.</span></p>
      ${trnOptie}
      <button class="btn btn-red" onclick="doMarkAbsent('${pid}')">Niet aanwezig</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  openModal(`<h3>${icI(IC.injury)} ${esc(p.name)} van het veld</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:14px">Hij speelde al <b>${min} min</b>. Registreer je hem als <b>blessure</b>, dan stopt zijn teller nu en kan je meteen iemand inbrengen.</p>
    ${trnOptie}
    <button class="btn btn-green" onclick="markAbsentViaInjury('${pid}')">${icI(IC.injury)} Blessure / verlaat het veld</button>
    <p style="text-align:center;color:var(--txt2);font-size:12px;margin:14px 0 6px">Stond hij per ongeluk in de selectie?</p>
    <button class="btn btn-red" onclick="doMarkAbsent('${pid}')">Toch niet aanwezig — wist zijn ${min} min</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// De tornooikeuze staat in de vorige modal, dus die hier meteen toepassen — daarna neemt de
// bestaande blessureflow het over (event + teller stoppen + vervanger aanbieden).
function markAbsentViaInjury(pid) {
  // Zelfde eerlijkheid als in doMarkAbsent: lukt de afmelding voor de rest van het tornooi niet,
  // zeg het dan i.p.v. het stil te laten mislukken.
  if (_trnAbsentAangevinkt() && !markTournamentUnavailable(pid)) {
    const p = (match.players || []).find(pl => pl.id === pid);
    showToast(`${(p || {}).name || 'Deze speler'} staat niet in de tornooiselectie — enkel voor deze wedstrijd afgemeld.`, 'err');
  }
  modalInjury(pid);
}
async function doMarkAbsent(pid) {
  const p = match.players.find(pl => pl.id === pid);
  if (!p) return;
  // Vinkje aan maar de speler staat niet in de tornooiselectie (gastspeler, of iemand die de ploeg
  // intussen verliet)? Dan geldt de afmelding enkel voor deze wedstrijd — dat moet je weten,
  // anders denk je hem voor de hele dag afgemeld te hebben.
  if (_trnAbsentAangevinkt() && !markTournamentUnavailable(pid)) {
    showToast(`${p.name} staat niet in de tornooiselectie — enkel voor deze wedstrijd afgemeld.`, 'err');
  }
  p.absent = true;
  if (p.onField) p.onField = false;
  // Ook uit de ingeplande pauzewissels/positiewissels halen — een afwezige speler mag bij de
  // start van het volgende deel niet alsnog het veld op gestuurd worden.
  if (match.pendingSubs) match.pendingSubs = match.pendingSubs.filter(s => s.inId !== pid && s.outId !== pid);
  if (match.pendingPosSwaps) match.pendingPosSwaps = match.pendingPosSwaps.filter(s => s.pA !== pid && s.pB !== pid);
  // Idem voor de klaargezette wissels: die zouden anders in het menu blijven staan met een
  // speler die er niet meer is.
  if (match.plannedSubs) match.plannedSubs = match.plannedSubs.filter(s => s.inId !== pid && s.outId !== pid);
  if (match.plannedPosSwaps) match.plannedPosSwaps = match.plannedPosSwaps.filter(s => s.pA !== pid && s.pB !== pid);
  // Een geplande OPSTELLING wordt niet stil bijgeknipt: daar hoort iemand anders zijn plaats in te
  // nemen, en die keuze is aan de coach. Wel meteen zeggen welke delen daardoor niet meer kloppen —
  // anders merk je het pas in de pauze, wanneer je moet beslissen.
  const raakt = plannedLineupIssues(match).filter(i => i.deel > match.currentQuarter);
  await dbSave(match); closeModal(); render();
  if (raakt.length) {
    showToast(`Kijk je opstelling na voor ${pSingLow(match)} ${raakt.map(i => i.deel).join(' en ')}: ${p.name} stond daarin.`, 'err');
  }
}
async function doUnmarkAbsent(pid) {
  const p = match.players.find(pl => pl.id === pid);
  if (!p) return;
  p.absent = false;
  // Zolang er nog geen deel gestart is, is een basisspeler die je herstelt gewoon weer basisspeler:
  // doMarkAbsent zette onField op false, en zonder dit bleef hij achter met starting=true en
  // onField=false. De planning telde hem dan mee en de veldbezetting niet. Loopt de wedstrijd al,
  // dan blijft hij bewust van het veld — daar hoort een echte wissel bij.
  if (!(match.quarters || []).length && p.starting) p.onField = true;
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
// Na het verwijderen/ongedaan maken van een kapiteinwissel-event de actuele kapitein herrekenen:
// de laatst overblijvende wissel geldt; zonder overblijvende wissels valt hij terug op de
// oorspronkelijke kapitein (fromId van het verwijderde event, dat de vorige toestand bewaart).
function recomputeCaptain(m, removed) {
  const changes = (m.events || []).filter(e => e.type === 'captain_change').sort((a, b) => (a.gameTimeMs || 0) - (b.gameTimeMs || 0));
  m.captainId = changes.length ? changes[changes.length - 1].playerId : ((removed && removed.fromId) || null);
}
async function setMatchCaptain(id) {
  const prev = match.captainId;
  match.captainId = id;
  if (id && id !== prev) addEvent('captain_change', { playerId: id, fromId: prev || null });
  await dbSave(match); closeModal(); render();
}
async function logExtra(type, extra = {}) {
  if (_eventBusy) return; // dubbeltik-guard (bv. afgekeurd doelpunt): anders twee identieke events
  _eventBusy = true;
  try { addEvent(type, extra); await dbSave(match); closeModal(); render(); }
  finally { _eventBusy = false; }
}
function modalDisallowed(side) {
  const type = side === 'us' ? 'disallowed_us' : 'disallowed_them';
  const label = side === 'us' ? `voor ${esc(tName(match))}` : 'tegen';
  openModal(`<h3>${icI(IC.disallowed)} Afgekeurd doelpunt ${label}</h3>
    <div class="fg"><label>Reden (optioneel)</label><input id="disallowed-reason" type="text" placeholder="bv. buitenspel" value="buitenspel" autocomplete="off"></div>
    <button class="btn btn-org" onclick="logExtra('${type}',{reason:(document.getElementById('disallowed-reason').value||'').trim()})">Registreren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function hasUndo() { return match && match.events.some(e => e.type !== 'quarter_start' && e.type !== 'quarter_end'); }
async function undoLast() {
  // Dubbeltik-guard: een tweede tik vóór de re-render zou stil óók het voorlaatste event verwijderen.
  if (_eventBusy) return;
  _eventBusy = true;
  try {
  let idx = -1;
  for (let i = match.events.length - 1; i >= 0; i--) { const t = match.events[i].type; if (t !== 'quarter_start' && t !== 'quarter_end') { idx = i; break; } }
  if (idx < 0) return;
  const removed = match.events[idx];
  const toRemove = [removed];
  // Een automatische rode kaart bij de 2e gele hoort bij die gele kaart — samen ongedaan maken,
  // anders blijft de speler van het veld staan met twee gele kaarten in het verloop.
  if (removed.type === 'red_card' && removed.autoSecondYellow) {
    for (let i = idx - 1; i >= 0; i--) {
      if (match.events[i].type === 'yellow_card' && match.events[i].playerId === removed.playerId) { toRemove.push(match.events[i]); break; }
    }
  }
  const ids = new Set(toRemove.map(ev => ev.id));
  toRemove.forEach(ev => tombstoneEvent(match, ev.id));
  match.events = match.events.filter(ev => !ids.has(ev.id));
  toRemove.forEach(ev => { revertSubstitutionPositions(match, ev); revertPosSwapPositions(match, ev); });
  if (removed.type === 'captain_change') recomputeCaptain(match, removed);
  recomputeScore(match); recomputeOnField(match);
  // C3: keeperminuten kloppen niet meer na het ongedaan maken van een keeper-relevante actie → herbouwen.
  if (match.keeperByQ && Object.keys(match.keeperByQ).length && toRemove.some(ev => ['substitution','posSwap','red_card','injury'].includes(ev.type))) rebuildKeeperByQ(match);
  await dbSave(match); render();
  showUndoToast(`${icI(IC.undo)} Ongedaan: ${evtLabel(removed, match)}`);
  } finally { _eventBusy = false; }
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
        ${on.map(p=>`<button type="button" class="gp-btn" data-id="${p.id}" onclick="selectGoalPlayer('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px">${playerBtnInner(p, 'var(--txt)')}</button>`).join('')}
        <button type="button" class="gp-btn" data-id="own_them" onclick="selectGoalPlayer('own_them',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px"><span style="font-size:13px;font-weight:900;color:var(--txt2);line-height:1">OG</span><span style="font-size:10px;color:var(--txt2);text-align:center">eigen doel teg.</span></button>
      </div>
      <div id="assist-section" class="hidden">
        <div class="sec">Assist door? (optioneel)</div>
        <div id="assist-players" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${on.map(p=>`<button type="button" class="ap-btn" data-id="${p.id}" onclick="selectAssist('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px">${playerBtnInner(p, 'var(--txt2)')}</button>`).join('')}
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
          ${on.map(p=>`<button type="button" class="ogp-btn" data-id="${p.id}" onclick="selectOwnGoalPlayer('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px">${playerBtnInner(p, 'var(--txt)')}</button>`).join('')}
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
  return `<button type="button" class="${cls}" data-id="${p.id}" onclick="${onclick}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:2px">${playerBtnInner(p, 'var(--txt)')}${extra}</button>`;
}
function pgGrid(btns) { return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${btns}</div>`; }
// Een positiewissel kies je sinds v0.21.0 op de PLEK, niet op de tweede speler: je duidt aan waar
// speler A naartoe gaat, en wie daar staat neemt zijn plaats over. Dat is hoe een trainer het zegt
// ("jij gaat naar de 9"), en je hoeft niet meer op te zoeken wie daar ook alweer stond. Wat er
// opgeslagen wordt blijft een gewone posSwap met pA en pB — enkel de manier van kiezen verandert.
// De knop draagt het positienummer en de code (zie POS_CODES), met de huidige speler eronder.
// `sleutel` is wat de knop teruggeeft: het speler-id bij een wissel die je meteen doorvoert, of het
// POSITIENUMMER bij een wissel die je klaarzet — dan blijft het plan geldig ook als er later iemand
// anders op die plek belandt (zie plannedSwapDoelId).
function posDoelBtn(m, p, cls, onclick, sleutel) {
  const nr = p.posNum || '';
  const code = posCode(nr, m.matchType);
  return `<button type="button" class="${cls}" data-id="${esc(String(sleutel))}" onclick="${onclick}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:1px">
    <span style="font-weight:900;font-size:17px;line-height:1;color:var(--txt)">${esc(String(nr) || '–')}</span>
    ${code ? `<span style="font-size:10px;font-weight:800;letter-spacing:.3px;color:var(--txt2)">${esc(code)}</span>` : ''}
    <span style="font-size:10px;color:var(--txt2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(fieldName(m, p.id))}</span>
  </button>`;
}
// Op positienummer sorteren: zo staan de knoppen in de volgorde die een trainer in het hoofd heeft
// (1 achteraan, 9 vooraan) i.p.v. alfabetisch op de naam van wie er nu staat.
function posDoelGrid(m, spelers, clsPrefix, fnNaam, opPositie) {
  const gesorteerd = [...spelers].sort((a, b) => (parseInt(a.posNum, 10) || 99) - (parseInt(b.posNum, 10) || 99));
  return pgGrid(gesorteerd.map(p => {
    const sleutel = opPositie ? p.posNum : p.id;
    return posDoelBtn(m, p, clsPrefix, `${fnNaam}('${sleutel}',this)`, sleutel);
  }).join(''));
}
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
  // Een wissel heeft een tijdstip nodig (speeltijd/opstelling): bij "Onbekend deel" niet toelaten.
  if (_postEventQuarter === 'unknown') { showToast('Kies eerst een specifiek deel — een wissel heeft een tijdstip nodig.', 'err'); return; }
  const between = match.quarterStatus === 'between' && _postEventQuarter === null;
  const on = _postEventQuarter != null ? playersAtPeriodStart(match, _postEventQuarter) : effectiveOnField(match);
  const mins = calcMinutes(match);
  const onIds = new Set(on.map(p => p.id));
  // bank gesorteerd op minst gespeeld, zodat eerlijke rotatie makkelijk is
  const off = match.players.filter(p => !onIds.has(p.id) && !p.absent).slice().sort((a, b) => (mins[a.id]?.ms || 0) - (mins[b.id]?.ms || 0));
  const minMs = off.length ? (mins[off[0].id]?.ms || 0) : 0;
  const mm = id => playedMin(mins[id]?.ms);
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
    // Echte pauzewissel: enkel tussen de delen ÉN niet in retro-modus (een event toevoegen aan een
    // reeds afgelopen deel). Dan inplannen i.p.v. meteen doorvoeren. Zelfde conditie als modalSub().
    if (match.quarterStatus === 'between' && _postEventQuarter === null) {
      match.pendingSubs = match.pendingSubs || [];
      match.pendingSubs.push({ outId: subOut, inId: subIn });
      await dbSave(match); closeModal(); render();
      return;
    }
    const pOut = match.players.find(p => p.id === subOut), pIn = match.players.find(p => p.id === subIn);
    if (_postEventQuarter != null) {
      // Retro-wissel toegevoegd aan een afgelopen deel: NIET de live-veldstaat muteren of het
      // posBefore-snapshot van de huidige staat nemen (die horen bij het huidige/volgende deel).
      // In plaats daarvan: baseline vastleggen terwijl de staat nog consistent is, het event
      // toevoegen, en dan posities + keeperminuten herbouwen via voorwaartse replay — dezelfde
      // machinerie als bij het bewerken van een wissel-event (saveEditEvent). rebuildPositions
      // repareert daarbij ook het posBefore-snapshot van het nieuwe event.
      const baseline = playersAtPeriodStart(match, 1);
      addEvent('substitution', { playerOutId: subOut, playerInId: subIn, posBefore: null });
      rebuildPositions(match, baseline);
      if (match.keeperByQ && Object.keys(match.keeperByQ).length) rebuildKeeperByQ(match);
    } else {
      // posBefore: zie toelichting bij de pauzewissel-variant in startQuarter().
      const posBefore = pIn ? { x: pIn.x, y: pIn.y, line: pIn.line, posNum: pIn.posNum } : null;
      addEvent('substitution', { playerOutId: subOut, playerInId: subIn, posBefore });
      if (pIn && pOut) { pIn.x = pOut.x; pIn.y = pOut.y; pIn.line = pOut.line; pIn.posNum = pOut.posNum; }
      if (pOut) pOut.onField = false;
      if (pIn) pIn.onField = true;
      syncKeeper(); // keeper volgt automatisch de doellijn
    }
    await dbSave(match); closeModal(); render();
  } finally { _eventBusy = false; }
}
async function removePendingSub(i) { if (_eventBusy) return; _eventBusy = true; try { if (match.pendingSubs) match.pendingSubs.splice(i, 1); await dbSave(match); render(); } finally { _eventBusy = false; } }

// ===================== PAUZE-OPSTELLING (tikken op het veld) =====================
// In de pauze plan je wissels en positiewissels door op het veld te tikken i.p.v. via modals.
// Er wordt NIETS nieuws opgeslagen: elke tik voegt exact één pendingSub of pendingPosSwap toe —
// dezelfde data die startQuarter() bij de start van het volgende deel doorvoert. Zo blijven de
// speelminuten-, keeper- en verslagreconstructie ongewijzigd.
let _lineupSel = null;   // { kind: 'field' | 'bench', id }
// De opstelling zoals ze eruit zal zien bij de start van het volgende deel: huidige veldbezetting
// met de reeds ingeplande wissels en positiewissels toegepast (zelfde regels als startQuarter).
function previewNextLineup(m) {
  const players = (m.players || []).map(p => ({ ...p }));
  const byId = id => players.find(p => p.id === id);
  for (const s of (m.pendingSubs || [])) {
    const o = byId(s.outId), i = byId(s.inId);
    if (!o || !i || i.absent) continue;
    i.x = o.x; i.y = o.y; i.line = o.line; i.posNum = o.posNum;
    o.onField = false; i.onField = true;
  }
  for (const s of (m.pendingPosSwaps || [])) {
    const a = byId(s.pA), b = byId(s.pB);
    if (!a || !b) continue;
    const t = { x: a.x, y: a.y, line: a.line, posNum: a.posNum };
    a.x = b.x; a.y = b.y; a.line = b.line; a.posNum = b.posNum;
    b.x = t.x; b.y = t.y; b.line = t.line; b.posNum = t.posNum;
  }
  return players;
}
function lineupTap(kind, id) {
  const sel = _lineupSel;
  if (sel && sel.id === id) { _lineupSel = null; render(); return; }   // zelfde speler = deselecteren
  if (!sel || (sel.kind === 'bench' && kind === 'bench')) { _lineupSel = { kind, id }; render(); return; }
  _lineupSel = null;
  if (sel.kind === 'bench' && kind === 'field') planPauseSub(id, sel.id);
  else if (sel.kind === 'field' && kind === 'bench') planPauseSub(sel.id, id);
  else planPausePosSwap(sel.id, id);
}
async function planPauseSub(outId, inId) {
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    match.pendingSubs = match.pendingSubs || [];
    // Staat er al een wissel gepland op deze plek? Dan die aanpassen i.p.v. een tweede wissel op
    // dezelfde positie te stapelen; kies je de oorspronkelijke speler opnieuw, dan valt ze weg.
    const existing = match.pendingSubs.findIndex(s => s.inId === outId);
    if (existing >= 0) {
      if (match.pendingSubs[existing].outId === inId) match.pendingSubs.splice(existing, 1);
      else match.pendingSubs[existing].inId = inId;
    } else {
      match.pendingSubs.push({ outId, inId });
    }
    await dbSave(match); render();
  } finally { _eventBusy = false; }
}
async function planPausePosSwap(a, b) {
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    match.pendingPosSwaps = match.pendingPosSwaps || [];
    // Dezelfde twee spelers nog eens aantikken = de geplande positiewissel ongedaan maken.
    const i = match.pendingPosSwaps.findIndex(s => (s.pA === a && s.pB === b) || (s.pA === b && s.pB === a));
    if (i >= 0) match.pendingPosSwaps.splice(i, 1); else match.pendingPosSwaps.push({ pA: a, pB: b });
    await dbSave(match); render();
  } finally { _eventBusy = false; }
}
// Het pauzescherm in het tabblad Opstelling: veld met de geplande opstelling + bank om uit te kiezen.
function pauseLineupHtml(m) {
  const preview = previewNextLineup(m);
  const mins = calcMinutes(m);
  const on = preview.filter(p => p.onField && !p.absent);
  const bench = preview.filter(p => !p.onField && !p.absent)
    .sort((a, b) => (mins[a.id]?.ms || 0) - (mins[b.id]?.ms || 0));
  const mm = id => playedMin(mins[id]?.ms);
  const selId = _lineupSel ? _lineupSel.id : null;
  const nSubs = (m.pendingSubs || []).length, nSwaps = (m.pendingPosSwaps || []).length;
  return `
    <div class="card" style="border-left:4px solid var(--org)">
      <div class="sec" style="margin-top:0">${icI(IC.swap)} Wissels voor ${pSingLow(m)} ${m.currentQuarter + 1}</div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Tik een <b>bankspeler</b> en dan een <b>speler op het veld</b> om te wisselen. Tik <b>twee spelers op het veld</b> om ze van positie te wisselen. Het veld toont meteen de opstelling van ${pSingLow(m)} ${m.currentQuarter + 1}; alles wordt doorgevoerd bij de start.</p>
      ${renderPitch(m, on, captainAtStartOfQuarter(m, m.currentQuarter + 1), null, { fn: 'lineupTap', selId })}
      ${/* De opstelling van het volgende deel staat sinds v0.25.0 al klaar zodra de pauze begint
           (zie zetGeplandeOpstellingKlaar). Deze knop blijft voor wie ze weghaalde en toch wil, of
           om wat er nu klaarstaat te vervangen door het plan. */ ''}
      ${((m.plannedLineups || {})[m.currentQuarter + 1] || []).length
        ? `<button class="btn btn-orgpale btn-sm" style="margin-top:10px;width:100%" onclick="modalUsePlannedLineup(${m.currentQuarter + 1})">${icI(IC.shirt)} Geplande opstelling ${nSubs + nSwaps ? 'opnieuw toepassen' : 'gebruiken'}</button>` : ''}
      <div class="sec">Bank (${bench.length}) <span style="color:var(--txt2);font-weight:400;text-transform:none">· minst gespeeld eerst</span></div>
      <div class="place-chips">${bench.length
        ? bench.map(p => `<span class="place-chip ${selId === p.id ? 'sel' : ''}" onclick="lineupTap('bench','${p.id}')">${numSpan(p, 'pcn')}${esc(fieldName(m, p.id))} <small style="opacity:.7;margin-left:4px">${mm(p.id)}'</small></span>`).join('')
        : '<span style="color:var(--txt2);font-size:14px">Niemand op de bank.</span>'}</div>
      ${(nSubs || nSwaps) ? `<div class="sec">Ingepland (${nSubs + nSwaps})</div>
        ${(m.pendingSubs || []).map((s, i) => `<div class="prow" style="padding:7px 0"><div style="flex:1;font-size:14px">${icI(IC.swap)} <b>${esc(pName(m, s.inId))}</b> <span style="color:var(--txt2)">voor</span> ${esc(pName(m, s.outId))}</div><button class="evt-del" onclick="removePendingSub(${i})" title="Verwijderen">×</button></div>`).join('')}
        ${(m.pendingPosSwaps || []).map((s, i) => `<div class="prow" style="padding:7px 0"><div style="flex:1;font-size:14px">${icI(IC.compass)} <b>${esc(pName(m, s.pA))}</b> <span style="color:var(--txt2)">wisselt met</span> ${esc(pName(m, s.pB))}</div><button class="evt-del" onclick="removePendingPosSwap(${i})" title="Verwijderen">×</button></div>`).join('')}`
        : '<p style="font-size:13px;color:var(--txt2);margin-top:10px">Nog niets ingepland — de opstelling blijft zoals ze nu staat.</p>'}
    </div>`;
}

// ===================== PLANNING TIJDENS DE WEDSTRIJD =====================
// Tijdens het spel wil de trainer kunnen nakijken wat er voor het volgende deel gepland staat,
// zonder daarvoor iets te moeten wijzigen. Dit is dezelfde carrousel als in het
// voorbereidingsscherm, maar alleen-lezen, en enkel voor de delen die nog moeten komen — wat al
// gespeeld is, staat in het verslag. De geplande wissels voor dat deel staan eronder.
function planningTijdensMatchHtml(m) {
  if (!m || m.status === 'done') return '';
  const totaal = plannedPartsCount(m);
  const vanaf = plannedHuidigDeel(m) + (m.quarterStatus === 'between' ? 0 : 1);
  if (vanaf > totaal) return '';
  const heeftPlan = plannedLineupCount(m) > 0;
  const losseWissels = [...(m.plannedSubs || []), ...(m.plannedPosSwaps || [])].some(s => s.quarterNum >= vanaf);
  if (!heeftPlan && !losseWissels) return '';
  const delen = Array.from({ length: totaal - vanaf + 1 }, (_, i) => vanaf + i);
  // Binnen hetzelfde deel blijft staan waar je naartoe bladerde; zodra het spel een deel opschuift
  // springt de kaart terug naar wat er nú aankomt — dat is waar je in de pauze naar wil kijken.
  if (_planLiveVanaf !== vanaf) { _planLiveVanaf = vanaf; _planLiveQ = vanaf; }
  _planLiveQ = Math.min(Math.max(_planLiveQ, vanaf), totaal);
  const slide = q => {
    const lijst = plannedLineupBase(m, q);
    const opVeld = new Set(lijst.map(p => p.id));
    const bank = sortedByName((m.players || []).filter(p => !p.absent && !opVeld.has(p.id)));
    return `<div class="lc-slide" style="${q === _planLiveQ ? '' : 'display:none'}">
      ${renderPitch(m, plannedLineupPlayers(m, lijst), captainAtStartOfQuarter(m, q))}
      <div class="sec" style="margin-bottom:6px">Bank (${bank.length})</div>
      <div class="place-chips">${bank.length
        ? bank.map(p => `<span class="place-chip">${numSpan(p, 'pcn')}${esc(fieldName(m, p.id))}</span>`).join('')
        : '<span style="color:var(--txt2);font-size:14px">Niemand op de bank.</span>'}</div>
      ${plannedSubsVoorDeelHtml(m, q)}
    </div>`;
  };
  return `<div class="sec">Planning${delen.length > 1 ? ` <span style="font-weight:400;text-transform:none;color:var(--txt2)">(nog te spelen)</span>` : ''}</div>
    <div class="card"><div class="lc-wrap" id="pl-wrap">
      ${delen.length > 1 ? `<div class="lc-nav">
        <button class="lc-btn" id="pl-prev" onclick="_planLiveNav(-1)" ${_planLiveQ === vanaf ? 'disabled' : ''}>‹</button>
        <span class="lc-nav-lbl" id="pl-lbl" style="flex:1;text-align:center">${pSing(m)} ${_planLiveQ} van ${totaal}</span>
        <button class="lc-btn" id="pl-next" onclick="_planLiveNav(1)" ${_planLiveQ === totaal ? 'disabled' : ''}>›</button>
      </div>` : `<div class="lc-nav"><span class="lc-nav-lbl" style="flex:1;text-align:center">${pSing(m)} ${_planLiveQ}</span></div>`}
      ${delen.map(slide).join('')}
    </div></div>
    ${canManage() ? `<button class="btn btn-gray" style="margin-top:8px" onclick="exportWedstrijdplanPDF()">${icI(IC.download)} Wedstrijdplan (PDF)</button>` : ''}`;
}
let _planLiveQ = 1;
let _planLiveVanaf = 0;
function _planLiveNav(dir) {
  const m = match;
  const totaal = plannedPartsCount(m);
  const vanaf = plannedHuidigDeel(m) + (m.quarterStatus === 'between' ? 0 : 1);
  const wrap = document.getElementById('pl-wrap');
  if (!wrap) return;
  const slides = wrap.querySelectorAll('.lc-slide');
  _planLiveQ = Math.min(Math.max(vanaf, _planLiveQ + dir), totaal);
  slides.forEach((s, i) => s.style.display = (vanaf + i === _planLiveQ) ? '' : 'none');
  document.getElementById('pl-lbl').textContent = `${pSing(m)} ${_planLiveQ} van ${totaal}`;
  document.getElementById('pl-prev').disabled = _planLiveQ === vanaf;
  document.getElementById('pl-next').disabled = _planLiveQ === totaal;
}

// ===================== GEPLANDE OPSTELLING GEBRUIKEN =====================
// De opstelling die je vooraf per deel plande (zie modalPlannedLineups) omrekenen naar gewone
// wissels en positiewissels voor het volgende deel. Het plan zelf gaat nooit vanzelf af: dit
// gebeurt enkel als je hier op drukt, en wat eruit komt belandt in de pauze-opstelling waar je het
// nog kan aanpassen of weggooien voor het deel start.
function modalUsePlannedLineup(deel) {
  if (!canManage()) return;
  const m = match;
  const plan = ((m.plannedLineups || {})[deel] || []);
  if (!plan.length) return;
  const huidig = playersOnField(m).map(p => ({ id: p.id, x: p.x, y: p.y, line: p.line, posNum: p.posNum }));
  const diff = lineupToPending(m, huidig, plan);
  const nu = (m.pendingSubs || []).length + (m.pendingPosSwaps || []).length;
  const telling = [
    diff.subs.length ? `${diff.subs.length} wissel${diff.subs.length === 1 ? '' : 's'}` : '',
    diff.swaps.length ? `${diff.swaps.length} positiewissel${diff.swaps.length === 1 ? '' : 's'}` : '',
  ].filter(Boolean).join(' en ');
  openModal(`<h3>${icI(IC.shirt)} Geplande opstelling · ${pSing(m)} ${deel}</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${telling
      ? `Om die opstelling te krijgen zijn <b>${telling}</b> nodig. Ze komen klaar te staan voor de start van ${pSingLow(m)} ${deel}; daar kan je ze nog aanpassen.`
      : 'Het veld staat al precies zoals gepland — er is niets te wijzigen.'}</p>
    ${diff.subs.map(s => `<div class="prow" style="padding:6px 0"><div style="flex:1;font-size:14px">${icI(IC.swap)} <b>${esc(fieldName(m, s.inId))}</b> <span style="color:var(--txt2)">voor</span> ${esc(fieldName(m, s.outId))}</div></div>`).join('')}
    ${diff.swaps.map(s => `<div class="prow" style="padding:6px 0"><div style="flex:1;font-size:14px">${icI(IC.compass)} <b>${esc(fieldName(m, s.pA))}</b> <span style="color:var(--txt2)">wisselt met</span> ${esc(fieldName(m, s.pB))}</div></div>`).join('')}
    ${diff.problemen.length ? `<div style="font-size:12px;color:#b45309;background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:8px 10px;margin-top:10px">${icI(IC.warn)} ${diff.problemen.map(esc).join('<br>')}</div>` : ''}
    ${nu ? `<p style="text-align:center;font-size:12px;color:var(--txt2);margin-top:10px">Er ${nu === 1 ? 'staat' : 'staan'} al ${nu} wijziging${nu === 1 ? '' : 'en'} klaar; die word${nu === 1 ? 't' : 'en'} vervangen.</p>` : ''}
    ${telling ? `<button class="btn btn-green" style="margin-top:12px" onclick="doUsePlannedLineup(${deel})">${icI(IC.check)} Klaarzetten</button>` : ''}
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">${telling ? 'Annuleren' : 'Sluiten'}</button>`);
}
async function doUsePlannedLineup(deel) {
  if (!canManage()) return;
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    const m = match;
    const plan = ((m.plannedLineups || {})[deel] || []);
    if (!plan.length) return;
    const huidig = playersOnField(m).map(p => ({ id: p.id, x: p.x, y: p.y, line: p.line, posNum: p.posNum }));
    const diff = lineupToPending(m, huidig, plan);
    // Vervangen, niet aanvullen: het plan beschrijft de eindtoestand, dus na dit knopje ziet het
    // volgende deel er exact zo uit. Wat er handmatig klaarstond zou anders dubbel tellen.
    m.pendingSubs = diff.subs;
    m.pendingPosSwaps = diff.swaps;
    await dbSave(m); closeModal(); render();
    showToast(`Opstelling klaargezet voor ${pSingLow(m)} ${deel}.`, 'ok');
  } finally { _eventBusy = false; }
}

// ===================== GEPLANDE (KLAARGEZETTE) WISSELS =====================
// match.plannedSubs / match.plannedPosSwaps: wissels die je op voorhand klaarzet — voor de aftrap,
// tijdens een deel of in de pauze. Ze gaan NOOIT vanzelf af; jij drukt op "Nu doorvoeren".
// Bewust los van pendingSubs/pendingPosSwaps, die iets anders betekenen: dat is de opstelling die
// je in de pauze samenstelt en die bij de start van het volgende deel automatisch doorgevoerd
// wordt. Beide lijsten staan wel samen in dit ene menu, elk onder hun eigen kop.
// Nieuwe, optionele velden: een wedstrijd zonder deze lijsten blijft gewoon werken.

// Kan er op dit moment iets doorgevoerd worden, en zo ja hoe?
//   'live'  = deel loopt, wordt meteen een event
//   'break' = pauze, komt in de pauze-opstelling (start van het volgende deel)
//   null    = nog niet begonnen of afgelopen: enkel klaarzetten
function plannedRunMode(m) {
  if (!m || m.status === 'done') return null;
  if (m.quarterStatus === 'running') return 'live';
  if (m.quarterStatus === 'between') return 'break';
  return null;
}
// Welk deel is nu aan de beurt voor een klaargezette wissel? Tijdens het spel het lopende deel; in
// de pauze het deel dat zo begint (daar komt een doorgevoerde wissel immers in terecht).
function plannedHuidigDeel(m) {
  if (!m) return 0;
  if (m.quarterStatus === 'between') return (m.currentQuarter || 0) + 1;
  return m.currentQuarter || 0;
}
// Wat er in dít deel klaarstaat: de teller op de knop telt enkel mee wat je nu ook echt kan
// doorvoeren, anders zie je tijdens kwart 1 een (5) staan voor wissels die pas later aan bod komen.
function plannedCountNu(m) {
  const deel = plannedHuidigDeel(m);
  const telt = s => !s.quarterNum || s.quarterNum === deel;
  return ((m && m.plannedSubs) || []).filter(telt).length + ((m && m.plannedPosSwaps) || []).filter(telt).length;
}
// Wie staat er op het veld bij de START van deel q, voor zover we dat nu kunnen weten? Een wissel
// die je voor kwart 3 klaarzet, gaat over de spelers die kwart 3 beginnen — niet over wie er bij de
// aftrap van de wedstrijd stond. Voor een deel dat al loopt of voorbij is, is er geen giswerk: dan
// telt de echte veldbezetting.
function veldBijStartVanDeel(m, q) {
  if (!q || q <= (m.currentQuarter || 0)) return effectiveOnField(m);
  // Toekomstig deel: het dichtstbijzijnde plan op of vóór dat deel (delen erven van elkaar, zie
  // plannedLineupBase). Zonder plan verandert er niets, dus blijft staan wie er nu staat.
  for (let k = q; k >= 2; k--) {
    const pl = (m.plannedLineups || {})[k];
    if (pl && pl.length) return plannedLineupPlayers(m, pl).filter(p => !p.absent);
  }
  return effectiveOnField(m);
}
// Waarom een klaargezette wissel nu niet kan (of null als hij wel kan). De situatie kan veranderd
// zijn sinds het klaarzetten: speler intussen gewisseld, afwezig gemarkeerd of uit de selectie.
// Bij een wissel die aan een later deel hangt, wordt dat deel als ijkpunt genomen — anders stond er
// "staat niet op het veld" bij iemand die pas vanaf dat deel meedoet.
function plannedSubProbleem(m, s) {
  const veld = new Set(veldMetGeplandeWissels(m, s.quarterNum, { soort: 'sub', index: _plannedIndex(m, s, 'sub') }).map(p => p.id));
  const uit = m.players.find(p => p.id === s.outId), inn = m.players.find(p => p.id === s.inId);
  if (!uit || !inn) return 'Een van beide spelers zit niet meer in de selectie.';
  if (inn.absent) return `${pName(m, s.inId)} is afwezig gemarkeerd.`;
  if (!veld.has(s.outId)) return `${pName(m, s.outId)} staat niet op het veld.`;
  if (veld.has(s.inId)) return `${pName(m, s.inId)} staat al op het veld.`;
  return null;
}
// Een geplande positiewissel bewaart sinds v0.22.0 een PLEK (naarPos = het positienummer), niet de
// speler die daar toevallig stond toen je het plande. Wie de tegenpartij is, blijkt pas op het
// moment van doorvoeren: staat er intussen iemand anders op die plek — bijvoorbeeld omdat een
// eerdere wissel uit hetzelfde kwart al doorgevoerd is — dan is dát de speler die ruilt. Oudere
// positiewissels dragen nog een vaste pB; die blijven werken zoals ze waren.
function plannedSwapDoelId(m, s, veldLijst) {
  if (s.pB) return s.pB;
  if (!s.naarPos) return null;
  const veld = veldLijst || effectiveOnField(m);
  const t = veld.find(p => String(p.posNum) === String(s.naarPos));
  return t ? t.id : null;
}
// Waar een geplande wissel in terechtkomt, is niet de opstelling bij de start van het deel maar die
// opstelling PLUS de wissels die je voor datzelfde deel al plande: zet je eerst "A eruit, B erin",
// dan staat B daarna op het veld en moet je hem kunnen kiezen voor een positiewissel. `tot` bepaalt
// hoever we projecteren en volgt de uitvoeringsvolgorde van runAllPlanned (eerst alle wissels, dan
// de positiewissels): {soort:'sub'|'swap', index} past alles toe wat er vóór komt, null past alles
// toe. Werkt op kopieën — de echte spelers worden hier nooit aangeraakt.
function _pasGeplandToe(m, veld, deel, tot) {
  const hoort = s => (deel ? s.quarterNum === deel : !s.quarterNum);
  const subs = (m.plannedSubs || []).filter(hoort);
  const swaps = (m.plannedPosSwaps || []).filter(hoort);
  const nSubs = (tot && tot.soort === 'sub') ? tot.index : subs.length;
  for (let i = 0; i < nSubs; i++) {
    const s = subs[i];
    const idx = veld.findIndex(p => p.id === s.outId);
    const inn = (m.players || []).find(p => p.id === s.inId);
    if (idx < 0 || !inn || inn.absent || veld.some(p => p.id === s.inId)) continue;
    veld[idx] = Object.assign({}, inn, { x: veld[idx].x, y: veld[idx].y, line: veld[idx].line, posNum: veld[idx].posNum });
  }
  if (tot && tot.soort === 'sub') return veld;
  const nSwaps = (tot && tot.soort === 'swap') ? tot.index : swaps.length;
  for (let i = 0; i < nSwaps; i++) {
    const s = swaps[i];
    const a = veld.find(p => p.id === s.pA);
    const bId = plannedSwapDoelId(m, s, veld);
    const b = bId ? veld.find(p => p.id === bId) : null;
    if (!a || !b || a === b) continue;
    const t = { x: a.x, y: a.y, line: a.line, posNum: a.posNum };
    a.x = b.x; a.y = b.y; a.line = b.line; a.posNum = b.posNum;
    b.x = t.x; b.y = t.y; b.line = t.line; b.posNum = t.posNum;
  }
  return veld;
}
function veldMetGeplandeWissels(m, deel, tot) {
  return _pasGeplandToe(m, veldBijStartVanDeel(m, deel).map(p => ({ ...p })), deel, tot);
}
// De index van een geplande wissel binnen zijn eigen deel — nodig om te weten wat er vóór hem komt.
function _plannedIndex(m, s, soort) {
  const hoort = x => (s.quarterNum ? x.quarterNum === s.quarterNum : !x.quarterNum);
  const lijst = (soort === 'swap' ? (m.plannedPosSwaps || []) : (m.plannedSubs || [])).filter(hoort);
  const i = lijst.findIndex(x => x.id === s.id);
  return i < 0 ? lijst.length : i;
}
function plannedSwapProbleem(m, s) {
  const veldLijst = veldMetGeplandeWissels(m, s.quarterNum, { soort: 'swap', index: _plannedIndex(m, s, 'swap') });
  const veld = new Set(veldLijst.map(p => p.id));
  if (!m.players.find(p => p.id === s.pA)) return 'Die speler zit niet meer in de selectie.';
  if (!veld.has(s.pA)) return `${pName(m, s.pA)} staat niet op het veld.`;
  const doelId = plannedSwapDoelId(m, s, veldLijst);
  if (!doelId) return s.naarPos ? `Er staat niemand op positie ${s.naarPos}.` : 'De tegenpartij zit niet meer in de selectie.';
  if (!m.players.find(p => p.id === doelId)) return 'De tegenpartij zit niet meer in de selectie.';
  if (doelId === s.pA) return `${pName(m, s.pA)} staat daar al.`;
  if (!veld.has(doelId)) return `${pName(m, doelId)} staat niet op het veld.`;
  return null;
}
function plannedCount(m) { return ((m && m.plannedSubs) || []).length + ((m && m.plannedPosSwaps) || []).length; }
// Hoe een geplande positiewissel leest: de PLEK waar hij naartoe gaat. Bewust ZONDER "nu speler X"
// erachter — wie daar staat wordt pas bij het doorvoeren bepaald, dus die naam was een momentopname
// die bovendien wegviel zodra de plek (nog) niet bezet was. Dat las als een grillig detail.
function plannedSwapTekst(m, s) {
  if (!s.naarPos) return `<b>${esc(pName(m, s.pA))}</b> <span style="color:var(--txt2)">wisselt met</span> ${esc(pName(m, s.pB))}`;
  const code = posCode(s.naarPos, m.matchType);
  return `<b>${esc(pName(m, s.pA))}</b> <span style="color:var(--txt2)">naar positie</span> <b>${esc(String(s.naarPos))}</b>${code ? ` <span style="color:var(--txt2)">(${esc(code)})</span>` : ''}`;
}
// Welk tabblad staat open in "Wissels plannen": een deelnummer, of 0 voor "Altijd" (wissels zonder
// vast deel). Wordt bij het openen gezet op het deel dat nu aan de beurt is.
let _planDeelTab = null;
function modalPlannedSubs(tab) {
  const m = match; if (!m) return;
  const mode = plannedRunMode(m);
  const totaal = plannedPartsCount(m);
  if (tab !== undefined && tab !== null) _planDeelTab = tab;
  if (_planDeelTab === null) _planDeelTab = Math.min(Math.max(1, plannedHuidigDeel(m) || 1), totaal);
  const actief = _planDeelTab;
  const hoort = s => (actief ? s.quarterNum === actief : !s.quarterNum);
  const subs = (m.plannedSubs || []).filter(hoort), swaps = (m.plannedPosSwaps || []).filter(hoort);
  const pendS = m.pendingSubs || [], pendP = m.pendingPosSwaps || [];
  // Sinds v0.20.0 geef je een volledige opstelling per deel in met de planning. Dit scherm blijft
  // voor de losse wissel die je MIDDEN in een deel wil doen ("na een kwartier gaat X eruit") — dat
  // is precies wat een opstelling per deel niet kan uitdrukken. Vandaar de verwijzing hieronder:
  // zonder dat leek dit een tweede, concurrerende manier om hetzelfde te doen.
  const uitleg = mode === 'live' ? 'Doorvoeren wordt meteen een wissel in het verloop.'
    : mode === 'break' ? `Doorvoeren zet ze klaar bij de start van ${pSingLow(m)} ${m.currentQuarter + 1}.`
    : 'Doorvoeren kan zodra een deel bezig is. Tot dan kan je ze hier klaarzetten en aanpassen.';
  const waarvoor = `Voor wissels <b>tijdens</b> een ${pSingLow(m)}: jij kiest zelf wanneer je ze doorvoert. Wie er <b>bij de start</b> van een ${pSingLow(m)} op het veld staat, geef je in bij <b>Planning</b>.`;
  // Tabjes per deel, plus "Altijd" voor wissels die aan geen enkel deel hangen. Bij een wedstrijd
  // van één blok is er niets te kiezen en vallen ze weg.
  const telVoor = k => (m.plannedSubs || []).filter(s => k ? s.quarterNum === k : !s.quarterNum).length
    + (m.plannedPosSwaps || []).filter(s => k ? s.quarterNum === k : !s.quarterNum).length;
  const tabs = totaal < 2 ? '' : `<div class="tgl" style="flex-wrap:wrap;gap:6px;margin-bottom:10px">
    ${Array.from({ length: totaal }, (_, i) => i + 1).map(k =>
      `<button class="tgl-btn${k === actief ? ' act' : ''}" onclick="modalPlannedSubs(${k})">${pSing(m)} ${k}${telVoor(k) ? ` (${telVoor(k)})` : ''}</button>`).join('')}
    <button class="tgl-btn${actief === 0 ? ' act' : ''}" onclick="modalPlannedSubs(0)">Altijd${telVoor(0) ? ` (${telVoor(0)})` : ''}</button>
  </div>`;
  const nuAanDeBeurt = !actief || actief === plannedHuidigDeel(m);
  const rij = (ico, tekst, probleem, runFn, editFn, delFn) => `
    <div class="prow" style="padding:8px 0;align-items:flex-start">
      <div style="flex:1;font-size:14px">${icI(ico)} ${tekst}
        ${probleem ? `<div style="font-size:11px;color:var(--rd);margin-top:2px">${esc(probleem)}</div>` : ''}</div>
      ${(mode && !probleem && nuAanDeBeurt) ? `<button class="btn btn-green btn-sm" style="width:auto;padding:4px 10px;font-size:12px;margin:0 6px 0 0;flex-shrink:0" onclick="${runFn}">Nu</button>` : ''}
      <button class="evt-edit" onclick="${editFn}" title="Aanpassen">${icI(IC.edit)}</button>
      <button class="evt-del" onclick="${delFn}" title="Verwijderen">×</button>
    </div>`;
  const lijst = [
    ...subs.map(s => rij(IC.swap,
      `<b>${esc(pName(m, s.inId))}</b> <span style="color:var(--txt2)">voor</span> ${esc(pName(m, s.outId))}`,
      plannedSubProbleem(m, s), `runPlannedSub('${s.id}')`, `modalPlanSub('${s.id}')`, `removePlannedSub('${s.id}')`)),
    ...swaps.map(s => rij(IC.compass, plannedSwapTekst(m, s),
      plannedSwapProbleem(m, s), `runPlannedPosSwap('${s.id}')`, `modalPlanPosSwap('${s.id}')`, `removePlannedPosSwap('${s.id}')`)),
  ].join('');
  // De pauze-opstelling staat er enkel ter info bij: die gaat wél automatisch af, en het is
  // verwarrend als je hier "geplande wissels" ziet die niet alles tonen wat er klaarstaat.
  const auto = [
    ...pendS.map((s, i) => `<div class="prow" style="padding:7px 0"><div style="flex:1;font-size:14px">${icI(IC.swap)} <b>${esc(pName(m, s.inId))}</b> <span style="color:var(--txt2)">voor</span> ${esc(pName(m, s.outId))}</div><button class="evt-del" onclick="removePendingSub(${i});modalPlannedSubs()" title="Verwijderen">×</button></div>`),
    ...pendP.map((s, i) => `<div class="prow" style="padding:7px 0"><div style="flex:1;font-size:14px">${icI(IC.compass)} <b>${esc(pName(m, s.pA))}</b> <span style="color:var(--txt2)">wisselt met</span> ${esc(pName(m, s.pB))}</div><button class="evt-del" onclick="removePendingPosSwap(${i});modalPlannedSubs()" title="Verwijderen">×</button></div>`),
  ].join('');
  const aantal = subs.length + swaps.length;
  openModal(`<h3>${icI(IC.clipboard)} Wissels plannen</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:8px">${waarvoor}</p>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${uitleg}</p>
    ${tabs}
    <div class="sec" style="margin-top:0">${actief ? `Klaargezet voor ${pSingLow(m)} ${actief}` : 'Zonder vast deel'} <span style="color:var(--txt2);font-weight:400;text-transform:none">(jij kiest wanneer)</span></div>
    <div id="gw-lijst">${lijst || `<p style="color:var(--txt2);font-size:13px;padding:4px 0">Nog niets klaargezet${actief ? ` voor ${pSingLow(m)} ${actief}` : ''}.</p>`}</div>
    ${/* Alles ineens: eerst de wissels, dan de positiewissels — zie runAllPlanned. Enkel zichtbaar
         als er meer dan één ding klaarstaat; voor één regel volstaat de knop "Nu" ernaast. */ ''}
    ${(mode && nuAanDeBeurt && aantal > 1) ? `<button class="btn btn-green btn-sm" style="margin-top:10px" onclick="runAllPlanned(${actief})">${icI(IC.check)} Alle ${aantal} doorvoeren</button>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      <button class="btn btn-pale btn-sm" onclick="modalPlanSub(null,false,${actief})">${icI(IC.swap)} + Wissel</button>
      <button class="btn btn-pale btn-sm" onclick="modalPlanPosSwap(null,false,${actief})">${icI(IC.compass)} + Positiewissel</button>
    </div>
    ${auto ? `<div class="sec">Gaat automatisch bij de start van ${pSingLow(m)} ${m.currentQuarter + 1}</div>${auto}` : ''}
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
}
// Kiezers voor het klaarzetten/aanpassen. Zonder id = nieuw, met id = bestaande aanpassen.
let _planSel = { a: null, b: null, editId: null };
function _preselect(containerId, id) {
  if (!id) return;
  const el = document.querySelector(`#${containerId} button[data-id="${id}"]`);
  if (el) gpSel(el);
}
function selPlan(vak, id, el, containerId) { _planSel[vak] = id; gpSelIn(containerId, el); }
// Bij het klaarzetten dragen de doelknoppen het POSITIENUMMER, niet het speler-id.
function _selPlanDoel(pos, el) { _planSel.pos = pos; gpSelIn('pl-b', el); }
// Voor welk deel is deze wissel bedoeld? Optioneel veld `quarterNum` op de klaargezette wissel:
// zonder deel blijft hij overal bruikbaar, precies zoals elke wissel die vóór v0.20.2 klaargezet
// werd. Mét deel duikt hij enkel in dát deel op als snelle knop — zo staat het menu tijdens kwart 1
// niet vol met wissels die pas voor kwart 3 bedoeld zijn.
function planDeelSelHtml(m, gekozen, soort) {
  const totaal = plannedPartsCount(m);
  if (totaal < 2) return '';
  // onchange hertekent de modal: de spelerslijsten hieronder horen bij het gekozen deel.
  return `<div class="fg" style="margin-bottom:12px"><label>Voor welk ${pSingLow(m)}?</label>
    <select id="pl-deel" onchange="planDeelChange('${soort}')">
      <option value="">Geen voorkeur — altijd beschikbaar</option>
      ${Array.from({ length: totaal }, (_, i) => i + 1).map(k =>
        `<option value="${k}" ${gekozen === k ? 'selected' : ''}>${pSing(m)} ${k}</option>`).join('')}
    </select></div>`;
}
function planDeelGekozen() {
  const el = document.getElementById('pl-deel');
  const v = el ? parseInt(el.value, 10) : NaN;
  return isNaN(v) ? null : v;
}
function planDeelChange(soort) {
  _planSel.deel = planDeelGekozen();
  if (soort === 'swap') modalPlanPosSwap(_planSel.editId, true);
  else modalPlanSub(_planSel.editId, true);
}
// Zinnetje onder de titel: bij een later deel is het niet vanzelfsprekend dat de lijst hieronder
// een andere veldbezetting toont dan wat er nu op het veld staat.
function planDeelUitleg(m, deel) {
  if (!deel) return 'Blijft staan tot jij hem doorvoert.';
  const later = deel > (m.currentQuarter || 0);
  if (!later) return 'Blijft staan tot jij hem doorvoert.';
  // Staan er voor dit deel al wissels klaar, dan tonen we de stand ná die wissels (zie
  // veldMetGeplandeWissels) — anders kon je een invaller die je zelf net inplande niet kiezen.
  const alGepland = ((m.plannedSubs || []).some(s => s.quarterNum === deel) || (m.plannedPosSwaps || []).some(s => s.quarterNum === deel));
  return `Blijft staan tot jij hem doorvoert. De spelers hieronder zijn wie er ${alGepland
    ? `op het veld staat ná de wissels die je al voor <b>${pSingLow(m)} ${deel}</b> klaarzette`
    : `volgens de planning <b>${pSingLow(m)} ${deel}</b> begint`}.`;
}
// `behoud` = de modal wordt opnieuw opgebouwd na een wijziging van het deel; dan mag de al gemaakte
// spelerskeuze niet gewist worden — behalve wie in het nieuwe deel niet meer kan.
function modalPlanSub(editId, behoud, deelVoorNieuw) {
  const m = match; if (!m) return;
  const best = editId ? (m.plannedSubs || []).find(s => s.id === editId) : null;
  // Een nieuwe wissel erft het deel van het tabblad waarop je stond. De keuzelijst blijft wel staan,
  // voorgevuld: je hoeft niets te kiezen, maar je kan het nog bijstellen zonder terug te moeten.
  if (!behoud) _planSel = { a: best ? best.outId : null, b: best ? best.inId : null, editId: editId || null, deel: best ? (best.quarterNum || null) : (deelVoorNieuw || null) };
  const deel = _planSel.deel || null;
  // Een nieuwe wissel komt vóór de positiewissels aan de beurt, dus projecteren we tot dáár; bij het
  // bewerken tot net vóór de wissel zelf.
  const veld = sortedByName(veldMetGeplandeWissels(m, deel, best ? { soort: 'sub', index: _plannedIndex(m, best, 'sub') } : { soort: 'swap', index: 0 }));
  const veldIds = new Set(veld.map(p => p.id));
  const bank = sortedByName((m.players || []).filter(p => !p.absent && !veldIds.has(p.id)));
  if (_planSel.a && !veldIds.has(_planSel.a)) _planSel.a = null;
  if (_planSel.b && veldIds.has(_planSel.b)) _planSel.b = null;
  openModal(`<h3>${icI(IC.swap)} Wissel klaarzetten</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${planDeelUitleg(m, deel)}</p>
    ${planDeelSelHtml(m, deel, 'sub')}
    <div class="sec" style="margin-top:0">Wie gaat ERAF?</div>
    <div id="pl-a">${veld.length ? pgGrid(veld.map(p => pgBtn(p, 'pl-ab', `selPlan('a','${p.id}',this,'pl-a')`)).join('')) : '<p style="color:var(--txt2);font-size:14px;padding:8px 0">Niemand op het veld.</p>'}</div>
    <div class="sec">Wie komt ERIN?</div>
    <div id="pl-b">${bank.length ? pgGrid(bank.map(p => pgBtn(p, 'pl-bb', `selPlan('b','${p.id}',this,'pl-b')`)).join('')) : '<p style="color:var(--txt2);font-size:14px;padding:8px 0">Geen spelers op de bank.</p>'}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="savePlanSub()">${icI(IC.check)} ${editId ? 'Aanpassen' : 'Klaarzetten'}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="modalPlannedSubs()">Annuleren</button>`);
  _preselect('pl-a', _planSel.a); _preselect('pl-b', _planSel.b);
}
function modalPlanPosSwap(editId, behoud, deelVoorNieuw) {
  const m = match; if (!m) return;
  const best = editId ? (m.plannedPosSwaps || []).find(s => s.id === editId) : null;
  if (!behoud) {
    // Een oudere positiewissel droeg een vaste tegenpartij (pB); die tonen we als de positie waar
    // die speler stond, zodat bewerken hem meteen naar de nieuwe vorm omzet.
    const oudePos = (best && !best.naarPos && best.pB) ? (m.players.find(p => p.id === best.pB) || {}).posNum : null;
    _planSel = { a: best ? best.pA : null, pos: best ? (best.naarPos || oudePos || null) : null, editId: editId || null, deel: best ? (best.quarterNum || null) : (deelVoorNieuw || null) };
  }
  const deel = _planSel.deel || null;
  // Een nieuwe positiewissel komt achteraan: alles wat je voor dit deel plande is dan al gebeurd.
  const veld = sortedByName(veldMetGeplandeWissels(m, deel, best ? { soort: 'swap', index: _plannedIndex(m, best, 'swap') } : null));
  const veldIds = new Set(veld.map(p => p.id));
  if (_planSel.a && !veldIds.has(_planSel.a)) _planSel.a = null;
  if (_planSel.pos && !veld.some(p => String(p.posNum) === String(_planSel.pos))) _planSel.pos = null;
  openModal(`<h3>${icI(IC.compass)} Positiewissel klaarzetten</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Kies een speler en daarna de <b>positie</b> waar hij naartoe gaat. Wie op dat moment op die plek staat, neemt zijn plaats over — ook als dat door een eerdere wissel iemand anders geworden is. ${planDeelUitleg(m, deel)}</p>
    ${planDeelSelHtml(m, deel, 'swap')}
    <div class="sec" style="margin-top:0">Welke speler verplaatst?</div>
    <div id="pl-a">${pgGrid(veld.map(p => pgBtn(p, 'pl-ab', `selPlan('a','${p.id}',this,'pl-a')`)).join(''))}</div>
    <div class="sec">Naar welke positie? <span style="font-weight:400;text-transform:none;color:var(--txt2)">· positienummer en wie er nu staat</span></div>
    <div id="pl-b">${posDoelGrid(m, veld, 'pl-bb', '_selPlanDoel', true)}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="savePlanPosSwap()">${icI(IC.check)} ${editId ? 'Aanpassen' : 'Klaarzetten'}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="modalPlannedSubs()">Annuleren</button>`);
  _preselect('pl-a', _planSel.a); _preselect('pl-b', _planSel.pos);
}
async function savePlanSub() {
  if (!_planSel.a || !_planSel.b) { showToast('Kies wie eraf gaat en wie erin komt.', 'err'); return; }
  if (_eventBusy) return; _eventBusy = true;
  try {
    match.plannedSubs = match.plannedSubs || [];
    const deel = _planSel.deel || null;
    const best = _planSel.editId ? match.plannedSubs.find(s => s.id === _planSel.editId) : null;
    // Zonder deel het veld niet wegschrijven i.p.v. er null in te zetten: zo blijft een wissel
    // zonder voorkeur exact hetzelfde object als vroeger.
    if (best) { best.outId = _planSel.a; best.inId = _planSel.b; if (deel) best.quarterNum = deel; else delete best.quarterNum; }
    else match.plannedSubs.push(Object.assign({ id: uid(), outId: _planSel.a, inId: _planSel.b }, deel ? { quarterNum: deel } : {}));
    // Terug naar het tabblad van het deel waarvoor je zonet opsloeg — zie savePlanPosSwap.
    await dbSave(match); render(); modalPlannedSubs(deel || 0);
  } finally { _eventBusy = false; }
}
async function savePlanPosSwap() {
  if (!_planSel.a) { showToast('Kies wie er verplaatst.', 'err'); return; }
  if (!_planSel.pos) { showToast('Kies de positie waar hij naartoe gaat.', 'err'); return; }
  if (_eventBusy) return; _eventBusy = true;
  try {
    match.plannedPosSwaps = match.plannedPosSwaps || [];
    const deel = _planSel.deel || null;
    const pos = _planSel.pos;
    const best = _planSel.editId ? match.plannedPosSwaps.find(s => s.id === _planSel.editId) : null;
    // naarPos i.p.v. pB: wie er op die plek staat, blijkt pas bij het doorvoeren. pB van een
    // oudere positiewissel wordt bij het bewerken opgeruimd, anders zou die voorrang houden.
    if (best) { best.pA = _planSel.a; best.naarPos = pos; delete best.pB; if (deel) best.quarterNum = deel; else delete best.quarterNum; }
    else match.plannedPosSwaps.push(Object.assign({ id: uid(), pA: _planSel.a, naarPos: pos }, deel ? { quarterNum: deel } : {}));
    // Terug naar het tabblad van het deel waarvoor je zonet opsloeg: wijzigde je het kwart in de
    // keuzelijst, dan stond je anders naar een lijst te kijken waar hij niet in staat.
    await dbSave(match); render(); modalPlannedSubs(deel || 0);
  } finally { _eventBusy = false; }
}
async function removePlannedSub(id) {
  if (_eventBusy) return; _eventBusy = true;
  try { match.plannedSubs = (match.plannedSubs || []).filter(s => s.id !== id); await dbSave(match); render(); modalPlannedSubs(); }
  finally { _eventBusy = false; }
}
async function removePlannedPosSwap(id) {
  if (_eventBusy) return; _eventBusy = true;
  try { match.plannedPosSwaps = (match.plannedPosSwaps || []).filter(s => s.id !== id); await dbSave(match); render(); modalPlannedSubs(); }
  finally { _eventBusy = false; }
}
// De kern van "doorvoeren", zonder opslaan of hertekenen: zo kan één wissel dezelfde weg volgen als
// een hele reeks (zie runAllPlanned). Geeft null terug als het gelukt is, anders de reden.
function _voerPlannedSubUit(s, mode) {
  const probleem = plannedSubProbleem(match, s);
  if (probleem) return probleem;
  if (mode === 'break') {
    // In de pauze bestaat "nu" niet: dan is doorvoeren hetzelfde als een pauzewissel inplannen.
    match.pendingSubs = match.pendingSubs || [];
    match.pendingSubs.push({ outId: s.outId, inId: s.inId });
  } else {
    const pOut = match.players.find(p => p.id === s.outId), pIn = match.players.find(p => p.id === s.inId);
    // Zelfde afhandeling als confirmSub(): posBefore vastleggen, positie overnemen, keeper volgen.
    const posBefore = pIn ? { x: pIn.x, y: pIn.y, line: pIn.line, posNum: pIn.posNum } : null;
    addEvent('substitution', { playerOutId: s.outId, playerInId: s.inId, posBefore });
    if (pIn && pOut) { pIn.x = pOut.x; pIn.y = pOut.y; pIn.line = pOut.line; pIn.posNum = pOut.posNum; }
    if (pOut) pOut.onField = false;
    if (pIn) pIn.onField = true;
    syncKeeper();
  }
  match.plannedSubs = (match.plannedSubs || []).filter(x => x.id !== s.id);
  return null;
}
function _voerPlannedPosSwapUit(s, mode) {
  const probleem = plannedSwapProbleem(match, s);
  if (probleem) return probleem;
  // Pas hier bepalen wie er op de doelplek staat — zie plannedSwapDoelId. Dat gebeurt dus ná de
  // wissels die in dezelfde reeks al doorgevoerd zijn, precies zoals het hoort.
  const doelId = plannedSwapDoelId(match, s);
  if (!doelId) return 'Er staat niemand op die positie.';
  if (mode === 'break') {
    match.pendingPosSwaps = match.pendingPosSwaps || [];
    match.pendingPosSwaps.push({ pA: s.pA, pB: doelId });
  } else {
    const pA = match.players.find(p => p.id === s.pA), pB = match.players.find(p => p.id === doelId);
    if (!pA || !pB) return 'Een van beide spelers zit niet meer in de selectie.';
    // Zelfde afhandeling als confirmPosSwap(): snapshot vóór de mutatie, dan de posities ruilen.
    const posA = { x: pA.x, y: pA.y, line: pA.line, posNum: pA.posNum };
    const posB = { x: pB.x, y: pB.y, line: pB.line, posNum: pB.posNum };
    addEvent('posSwap', { pA: s.pA, pB: doelId, posA, posB });
    pA.x = posB.x; pA.y = posB.y; pA.line = posB.line; pA.posNum = posB.posNum;
    pB.x = posA.x; pB.y = posA.y; pB.line = posA.line; pB.posNum = posA.posNum;
    syncKeeper();
  }
  match.plannedPosSwaps = (match.plannedPosSwaps || []).filter(x => x.id !== s.id);
  return null;
}
// Alles van één tabblad in één keer: eerst de wissels, dan de positiewissels. Die volgorde is geen
// toeval — een positiewissel naar "plaats 5" moet de invaller kunnen vinden die daar door een
// wissel uit dezelfde reeks net beland is.
async function runAllPlanned(deel) {
  if (_eventBusy) return; _eventBusy = true;
  try {
    const mode = plannedRunMode(match);
    if (!mode) { showToast('Doorvoeren kan zodra een deel bezig is.', 'err'); return; }
    const hoort = s => (deel ? s.quarterNum === deel : !s.quarterNum);
    const subs = (match.plannedSubs || []).filter(hoort);
    const swaps = (match.plannedPosSwaps || []).filter(hoort);
    let gedaan = 0; const fouten = [];
    for (const s of subs) { const f = _voerPlannedSubUit(s, mode); if (f) fouten.push(f); else gedaan++; }
    for (const s of swaps) { const f = _voerPlannedPosSwapUit(s, mode); if (f) fouten.push(f); else gedaan++; }
    if (gedaan) await dbSave(match);
    render(); modalPlannedSubs();
    if (!gedaan) showToast(fouten[0] || 'Er stond niets klaar.', 'err');
    else if (fouten.length) showToast(`${gedaan} doorgevoerd, ${fouten.length} niet: ${fouten[0]}`, 'err');
    else showToast(mode === 'break' ? `${gedaan} klaargezet voor de start van ${pSingLow(match)} ${match.currentQuarter + 1}.` : `${gedaan} doorgevoerd.`, 'ok');
  } finally { _eventBusy = false; }
}
async function runPlannedSub(id) {
  if (_eventBusy) return; _eventBusy = true;
  try {
    const s = (match.plannedSubs || []).find(x => x.id === id); if (!s) return;
    const mode = plannedRunMode(match);
    if (!mode) { showToast('Doorvoeren kan zodra een deel bezig is.', 'err'); return; }
    const fout = _voerPlannedSubUit(s, mode);
    if (fout) { showToast(fout, 'err'); return; }
    await dbSave(match); render(); modalPlannedSubs();
    showToast(mode === 'break' ? `Klaargezet bij de start van ${pSingLow(match)} ${match.currentQuarter + 1}.` : 'Wissel doorgevoerd.', 'ok');
  } finally { _eventBusy = false; }
}
async function runPlannedPosSwap(id) {
  if (_eventBusy) return; _eventBusy = true;
  try {
    const s = (match.plannedPosSwaps || []).find(x => x.id === id); if (!s) return;
    const mode = plannedRunMode(match);
    if (!mode) { showToast('Doorvoeren kan zodra een deel bezig is.', 'err'); return; }
    const fout = _voerPlannedPosSwapUit(s, mode);
    if (fout) { showToast(fout, 'err'); return; }
    await dbSave(match); render(); modalPlannedSubs();
    showToast(mode === 'break' ? `Klaargezet bij de start van ${pSingLow(match)} ${match.currentQuarter + 1}.` : 'Positiewissel doorgevoerd.', 'ok');
  } finally { _eventBusy = false; }
}

// ===================== MODAL: POSITIEWISSEL =====================
// Wisselen en van positie ruilen door op het veld te tikken, terwijl het deel loopt. Exact dezelfde
// bediening als de pauze-opstelling — bank aantikken en dan een veldspeler wisselt, twee
// veldspelers ruilen van plaats — maar met één verschil dat telt: hier wordt het meteen een event
// met een tijdstip. Daarom altijd eerst een bevestiging; in de pauze is een misklik onschuldig
// (die staat enkel klaar), tijdens het spel niet.
let _liveTapSel = null;   // { kind: 'field' | 'bench', id }
function liveFieldTap(kind, id) {
  if (!canManage() || match.quarterStatus !== 'running') return;
  const sel = _liveTapSel;
  if (sel && sel.id === id) { _liveTapSel = null; render(); return; }              // deselecteren
  if (!sel || (sel.kind === 'bench' && kind === 'bench')) { _liveTapSel = { kind, id }; render(); return; }
  _liveTapSel = null; render();
  // Dit is altijd een wissel in het LOPENDE deel, nooit een retro-event: die context expliciet
  // leegmaken, anders zou een blijven hangen _postEventQuarter het event in een afgelopen deel
  // laten belanden.
  _postEventQuarter = null;
  if (sel.kind === 'field' && kind === 'field') return bevestigLivePosSwap(sel.id, id);
  const veldId = kind === 'field' ? id : sel.id;
  const bankId = kind === 'bench' ? id : sel.id;
  bevestigLiveWissel(veldId, bankId);
}
function bevestigLivePosSwap(a, b) {
  posSwapA = a; posSwapB = b;
  openModal(`<h3>${icI(IC.compass)} Positiewissel</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px"><b>${esc(pName(match, a))}</b> en <b>${esc(pName(match, b))}</b> wisselen van positie.</p>
    <button class="btn btn-green" onclick="confirmPosSwap()">${icI(IC.check)} Doorvoeren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// subOut/subIn zetten en confirmSub() laten lopen: zo volgt een wissel via het veld exact dezelfde
// weg als een wissel via de knop — met posBefore, de keeper die de doellijn volgt en één
// substitution-event. Geen tweede implementatie die uit elkaar kan groeien.
function bevestigLiveWissel(veldId, bankId) {
  subOut = veldId; subIn = bankId;
  openModal(`<h3>${icI(IC.swap)} Wissel</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px"><b>${esc(pName(match, bankId))}</b> komt op het veld voor <b>${esc(pName(match, veldId))}</b>.</p>
    <button class="btn btn-green" onclick="confirmSub()">${icI(IC.check)} Doorvoeren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Het veld tijdens een lopend deel, met de bank eronder. Tegenhanger van pauseLineupHtml.
function liveLineupHtml(m) {
  const on = playersOnField(m);
  const mins = calcMinutes(m);
  const bench = playersOnBench(m).filter(p => !p.absent)
    .sort((a, b) => (mins[a.id] ? mins[a.id].ms : 0) - (mins[b.id] ? mins[b.id].ms : 0));
  const selId = _liveTapSel ? _liveTapSel.id : null;
  return `<div class="card">
    ${renderPitch(m, on, m.captainId, null, { fn: 'liveFieldTap', selId })}
    <div class="field-legend">Tik een <b>bankspeler</b> en dan een <b>speler op het veld</b> om te wisselen. Tik <b>twee spelers op het veld</b> om ze van positie te wisselen. Je krijgt telkens eerst een bevestiging.</div>
    <div class="sec">Bank (${bench.length}) <span style="color:var(--txt2);font-weight:400;text-transform:none">· minst gespeeld eerst</span></div>
    <div class="place-chips">${bench.length
      ? bench.map(p => `<span class="place-chip ${selId === p.id ? 'sel' : ''}" onclick="liveFieldTap('bench','${p.id}')">${numSpan(p, 'pcn')}${esc(fieldName(m, p.id))} <small style="opacity:.7;margin-left:4px">${playedMin(mins[p.id] ? mins[p.id].ms : 0)}'</small></span>`).join('')
      : '<span style="color:var(--txt2);font-size:14px">Niemand op de bank.</span>'}</div>
  </div>`;
}
let posSwapA = null, posSwapB = null;
function modalPosSwap() {
  // Retro (via "Event toevoegen" op een afgewerkte wedstrijd): een positiewissel hoort op een
  // tijdstip, net als een wissel — zonder deel kan hij nergens in de reconstructie belanden.
  if (_postEventQuarter === 'unknown') { showToast('Kies eerst een specifiek deel — een positiewissel heeft een tijdstip nodig.', 'err'); return; }
  posSwapA = null; posSwapB = null;
  const retro = _postEventQuarter != null;
  // Pauze-positiewissel enkel als je écht in de pauze staat: in retro-modus hoort het event in het
  // gekozen (afgelopen) deel, niet in de wachtrij voor het volgende. Zelfde conditie als confirmSub().
  const isBetween = match.quarterStatus === 'between' && !retro;
  const on = playersOnFieldForEvent(match);
  const title = isBetween ? `${icI(IC.compass)} Pauze-positiewissel · ${pSing(match)} ${match.currentQuarter + 1}`
    : retro ? `${icI(IC.compass)} Positiewissel · ${pSing(match)} ${_postEventQuarter}`
    : `${icI(IC.compass)} Positiewissel`;
  const uitleg = 'Kies een speler en daarna de <b>positie</b> waar hij naartoe gaat. Wie daar staat, neemt zijn plaats over.';
  const hint = isBetween
    ? `<p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${uitleg} Wordt automatisch doorgevoerd bij de start van het volgende deel.</p>`
    : retro
    ? `<p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${uitleg} Komt in het verloop en telt mee voor de keeperminuten; het velddiagram toont enkel de startopstelling en de wissels.</p>`
    : `<p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${uitleg}</p>`;
  openModal(`<h3>${title}</h3>${hint}
    <div class="sec" style="margin-top:0">Welke speler verplaatst?</div>
    <div id="psw-a">${pgGrid(on.map(p=>pgBtn(p,'psw-ab',`selectPosSwapA('${p.id}',this)`)).join(''))}</div>
    ${/* Uitdrukkelijk zeggen dat het cijfer hier iets ANDERS is dan in de rij hierboven: daar staat
         het rugnummer van de speler, hier het nummer van de plek. */ ''}
    <div class="sec" id="psw-b-lbl" style="display:none">Naar welke positie? <span style="font-weight:400;text-transform:none;color:var(--txt2)">· positienummer en wie er nu staat</span></div>
    <div id="psw-b" style="display:none"></div>
    <button class="btn btn-green" style="margin-top:12px;display:none" id="psw-confirm" onclick="confirmPosSwap()">${icI(IC.check)}Positiewissel doorvoeren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function selectPosSwapA(id, el) {
  posSwapA = id; posSwapB = null;
  gpSelIn('psw-a', el);
  const on = playersOnFieldForEvent(match).filter(p => p.id !== id);
  const bDiv = document.getElementById('psw-b');
  const bLbl = document.getElementById('psw-b-lbl');
  const btn = document.getElementById('psw-confirm');
  if (!bDiv || !bLbl || !btn) return;
  bDiv.innerHTML = posDoelGrid(match, on, 'psw-bb', 'selectPosSwapB');
  bLbl.style.display = ''; bDiv.style.display = ''; btn.style.display = 'none';
}
function selectPosSwapB(id, el) {
  posSwapB = id;
  gpSelIn('psw-b', el);
  const btn = document.getElementById('psw-confirm'); if (btn) btn.style.display = '';
}
async function confirmPosSwap() {
  if (!posSwapA || !posSwapB) return;
  if (posSwapA === posSwapB) { showToast('Kies twee verschillende spelers.', 'err'); return; }
  if (_eventBusy) return; // dubbeltik-guard: tweede tik zou de net-gewisselde posities terugdraaien
  _eventBusy = true;
  try {
    // Echte pauze-positiewissel: enkel tussen de delen ÉN niet in retro-modus. Zelfde conditie als
    // modalPosSwap() hierboven en als de pauzewissel-variant in confirmSub().
    if (match.quarterStatus === 'between' && _postEventQuarter === null) {
      match.pendingPosSwaps = match.pendingPosSwaps || [];
      match.pendingPosSwaps.push({ pA: posSwapA, pB: posSwapB });
      await dbSave(match); closeModal(); render();
      return;
    }
    if (_postEventQuarter != null) {
      // Retro-positiewissel in een afgelopen deel: NIET de live-veldstaat muteren en geen snapshot
      // van de HUIDIGE posities nemen — die horen bij het laatste deel, niet bij het gekozen deel.
      // Zelfde machinerie als de retro-wissel in confirmSub(): baseline vastleggen terwijl de staat
      // nog consistent is, het event toevoegen, en posities + keeperminuten herbouwen via
      // voorwaartse replay. rebuildPositions() vult daarbij meteen posA/posB van het nieuwe event in.
      const baseline = playersAtPeriodStart(match, 1);
      addEvent('posSwap', { pA: posSwapA, pB: posSwapB, posA: null, posB: null });
      rebuildPositions(match, baseline);
      if (match.keeperByQ && Object.keys(match.keeperByQ).length) rebuildKeeperByQ(match);
      await dbSave(match); closeModal(); render();
      return;
    }
    const pA = match.players.find(p => p.id === posSwapA), pB = match.players.find(p => p.id === posSwapB);
    if (!pA || !pB) { closeModal(); return; }
    // Snapshot vóór de mutatie meegeven aan het event: dit is het stabiele anker waarop
    // playersAtPeriodStart() zich baseert bij het reconstrueren van vroegere kwarten, ook
    // nadat een van beide spelers via een later event alweer van positie veranderd is.
    const posA = { x: pA.x, y: pA.y, line: pA.line, posNum: pA.posNum };
    const posB = { x: pB.x, y: pB.y, line: pB.line, posNum: pB.posNum };
    addEvent('posSwap', { pA: posSwapA, pB: posSwapB, posA, posB });
    pA.x = posB.x; pA.y = posB.y; pA.line = posB.line; pA.posNum = posB.posNum;
    pB.x = posA.x; pB.y = posA.y; pB.line = posA.line; pB.posNum = posA.posNum;
    syncKeeper(); // een positiewissel mét de doellijn is een keeperwissel — registreer voor de keeperminuten
    await dbSave(match); closeModal(); render();
  } finally { _eventBusy = false; }
}
async function removePendingPosSwap(i) { if (_eventBusy) return; _eventBusy = true; try { if (match.pendingPosSwaps) match.pendingPosSwaps.splice(i, 1); await dbSave(match); render(); } finally { _eventBusy = false; } }

// ===================== MODAL: CARD =====================
function modalCard(color) {
  const on = playersOnFieldForEvent(match);
  const ico = color === 'yellow' ? icI(IC.cardY) : icI(IC.cardR);
  const lbl = color === 'yellow' ? 'Gele kaart' : 'Rode kaart';
  openModal(`<h3>${ico} ${lbl}</h3>
    <div class="sec" style="margin-top:0">Voor welke speler?</div>
    ${pgGrid(on.map(p=>`<button type="button" onclick="logCard('${color}','${p.id}')" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:2px">${playerBtnInner(p, 'var(--txt)')}</button>`).join(''))}
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
        addEvent('red_card', { playerId: pid, autoSecondYellow: true });
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
// preId: speler al aangeduid en "verlaat het veld" aangevinkt — gebruikt door de "Niet aanwezig"-
// modal, die voor iemand die al gespeeld heeft naar deze flow doorverwijst (zie modalMarkAbsent).
function modalInjury(preId) {
  const on = playersOnFieldForEvent(match);
  injPlayerId = (preId && on.some(p => p.id === preId)) ? preId : null;
  injType = 'kramp';
  openModal(`<h3>${icI(IC.injury)} Blessure</h3>
    <div class="sec" style="margin-top:0">Welke speler?</div>
    <div id="inj-players">${pgGrid(on.map(p=>pgBtn(p,'inj-pb',`selectInjuryPlayer('${p.id}',this)`)).join(''))}</div>
    <div class="sec">Type</div>
    <div class="tgl" id="inj-type">
      <button class="act" onclick="tglInjType('kramp',this)">Kramp</button>
      <button onclick="tglInjType('licht',this)">Lichte blessure</button>
      <button onclick="tglInjType('ernstig',this)">Ernstig</button>
    </div>
    <label class="chkrow" style="margin-bottom:16px"><input type="checkbox" id="inj-off"${injPlayerId ? ' checked' : ''}> Speler verlaat het veld</label>
    <button class="btn btn-green" onclick="confirmInjury()">${icI(IC.check)}Registreren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
  // Voorselectie zichtbaar maken: de keuze wordt met inline stijlen gemarkeerd (gpSel), niet met
  // een klasse, dus dat moet na het renderen gebeuren.
  if (injPlayerId) {
    const i = on.findIndex(p => p.id === injPlayerId);
    const btn = document.querySelectorAll('#inj-players button')[i];
    if (btn) gpSel(btn);
  }
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
  const mm = id => playedMin(mins[id]?.ms);
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
        ${on.map(p=>`<div class="mopt" onclick="selectFkPlayer('${p.id}',this)">${numDot(p, 'mopt-num')}${esc(p.name)}</div>`).join('')}
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
  _postEventQuarter = lastQ !== null ? lastQ : 'unknown';
  _postEventMinute = null;
  const qBtns = quarters.map(q => {
    const act = q.num === lastQ ? ' act' : '';
    return `<button class="tgl-btn${act}" onclick="selPostQ(${q.num},this)">${pSing(match)} ${q.num}</button>`;
  }).join('') + `<button class="tgl-btn${lastQ===null?' act':''}" onclick="selPostQ('unknown',this)">Onbekend</button>`;
  openModal(`
    <h3>${icI(IC.log)} Event toevoegen</h3>
    <div class="sec" style="margin-top:0">In welk deel?</div>
    <div class="tgl" id="post-q-tgl" style="flex-wrap:wrap;gap:6px;margin-bottom:8px">${qBtns}</div>
    <div class="fg" style="margin-bottom:4px">
      <label style="font-size:13px;color:var(--txt2)">Minuut binnen dit deel <span style="font-weight:400">(optioneel — laat leeg voor einde deel)</span></label>
      <input id="post-evt-min" type="number" inputmode="numeric" min="1" max="${match.quarterDuration || 99}" placeholder="bv. 12" oninput="selPostMin(this.value)" style="width:100%">
    </div>
    <div class="sec">Wat wil je toevoegen?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button class="btn btn-pale" onclick="postEvt(modalGoal)">${icI(IC.goal)} Goal</button>
      <button class="btn btn-pale" onclick="postEvt(()=>modalCard('yellow'))">${icI(IC.cardY)} Kaart</button>
      <button class="btn btn-pale" onclick="postEvt(modalPenalty)">${icI(IC.penalty)} Penalty</button>
      <button class="btn btn-pale" onclick="postEvt(modalFreekick)">${icI(IC.bolt)} Vrije trap</button>
      <button class="btn btn-pale" onclick="postEvt(modalSub)">${icI(IC.swap)} Wissel</button>
      <button class="btn btn-pale" onclick="postEvt(modalPosSwap)">${icI(IC.compass)} Positiewissel</button>
      ${/* "Meer…" over de volle breedte: met het oneven aantal knoppen hierboven zou hij anders als
           losse halve knop naast een gat staan. */ ''}
      <button class="btn btn-pale" style="grid-column:1/-1" onclick="postEvt(modalExtra)">${icI(IC.more)} Meer…</button>
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

