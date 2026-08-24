// ===================== LIVE MATCH =====================
function renderLive() {
  // Met een uitweg (audit 25-08-2026): dit was een scherm zonder hoofding, zonder tabbalk en zonder
  // terugknop. Kan gebeuren wanneer een medebeheerder de wedstrijd verwijdert terwijl jij erin staat.
  if (!match) return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>Wedstrijd</h1></div>
    <div class="content"><div class="card">
      <p style="margin:0 0 10px">Deze wedstrijd is niet meer te vinden op dit toestel. Mogelijk is ze verwijderd.</p>
      <button class="btn btn-pale" onclick="go('matches')">${icI(IC.log)} Naar de wedstrijden</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="go('home')">${icI(IC.ball)} Naar het startscherm</button>
    </div></div>`;
  // ÉÉN MAATSTAF (audit 25-08-2026). Stond hier: `match.fromCloud && (!isAdmin || viewerMode)`.
  // Twee gaten: (1) bij een wedstrijd die NIET uit de cloud komt was ro altijd false, ook met de
  // kijkmodus aan — en de helft van de handelingen op dit scherm heeft geen eigen wachter, dus daar
  // kon een "kijker" de opstelling, de wissels en de kapitein echt herschrijven; (2) een gast zat er
  // niet in, en offline (waar isAdmin false kan zijn) sloot het een beheerder juist buiten.
  // canLive() is precies de bedoelde regel: niet als gast, niet in kijkmodus, en zonder verbinding
  // mag alles wat live kan gebeuren. renderPrep gebruikt die al sinds 23-08.
  const ro = !canLive(); // kijker of gast: alleen-lezen
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
        ${/* Twee dingen rechtgezet op 24-08-2026: (1) het opschrift was de HUIDIGE stand ("Optellen
             aan") terwijl je bij een knop het gevolg van je tik verwacht — nu staat de stand er met
             "tik om te wisselen" erbij; (2) zonder blokduur kan er niets afgeteld worden (timerText
             negeert aftellen dan), en toch werd de knop groen met "Aftellen aan". Nu staat hij er
             enkel als er een blokduur is. */ ''}
        ${match.quarterDuration ? `<button onclick="toggleCountdown()" style="margin-top:12px;width:100%;padding:10px;border-radius:10px;border:none;font-size:14px;font-weight:700;cursor:pointer;background:${countdownOn()?'var(--grn)':'rgba(255,255,255,.15)'};color:#fff">${icI(IC.stopwatch)} ${countdownOn()?'Aftellen':'Optellen'} <span style="font-weight:400;opacity:.75">· tik om te wisselen</span></button>` : ''}
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
      ${/* Geen enkele knop bruikbaar? Dan hoort hier de uitweg te staan, niet niets. Zie
            vastgelopenLive(): dat overkwam de veldtest van 22-08-2026. */ ''}
      ${(!ro && vastgelopenLive(match)) ? vastgelopenHtml(match) : ''}
      ${/* Misklik op "Wedstrijd starten" ongedaan maken. Enkel zolang er echt niets gebeurd is:
            geen enkel deel gelopen en geen enkele gebeurtenis gelogd. Bewust een bescheiden knop
            onder de startknop — het is een uitzondering, geen dagelijkse handeling. */ ''}
      ${(canStartFirst && !(match.quarters || []).length && !(match.events || []).length)
        ? `<button class="btn btn-gray btn-sm" style="width:100%;margin-bottom:12px" onclick="confirmTerugNaarGepland()">${icI(IC.undo)} Toch nog niet gestart</button>`
        : ''}
      ${/* Mistik op "Einde kwart X" ongedaan maken. Bescheiden knop onder de startknop, zelfde
            plaats en toon als "Toch nog niet gestart": het is een uitzondering, geen dagelijkse
            handeling. Stond tot 23-08-2026 enkel achter "Wedstrijd heropenen" op een AFGESLOTEN
            wedstrijd — precies niet waar je staat wanneer het gebeurt. */ ''}
      ${(!ro && hervatBaarDeel(match))
        ? `<button class="btn btn-gray btn-sm" style="width:100%;margin-bottom:12px" onclick="confirmHervatDeel()">${icI(IC.undo)} Te vroeg gestopt — verder in ${pSingLow(match)} ${hervatBaarDeel(match)}</button>`
        : ''}
      ${/* HET PAUZEKAARTJE (herontwerp 22-08-2026, op Tims aanwijzing). Hier stond de lijst met
           AFGELEIDE wissels ("Klaar voor kwart 2") — verwarrend, want die heeft niemand ingegeven:
           het veld op het tabblad Opstelling is de waarheid, en de wissels zijn daar een gevolg van.
           Nu: wat er gaat gebeuren in één zin, en de handelingen die je in een pauze echt doet. */ ''}
      ${canStartNext ? (() => {
        /* Eén brede hoofdknop (dít doe je in elke pauze) en daaronder de drie kleinere handelingen
           als tegels — zelfde look als de eventknoppen. Zonder plan valt de plantegel weg en delen
           de twee overige de rij. (Layout "1B", Tims keuze van 22-08-2026.) */
        const heeftPlan = ((match.plannedLineups || {})[qNum + 1] || []).length > 0;
        return `<div class="card" style="padding:12px;border-left:4px solid var(--org)">
        <div class="sec" style="margin-top:0">${icI(IC.timer)} Wat kan je doen in de pauze?</div>
        <p style="color:var(--txt2);font-size:13px;margin-bottom:10px">${pSing(match)} ${qNum+1} start automatisch met het veld op het tabblad <b>Opstelling</b>.</p>
        ${/* Klopt het aantal niet met de plaatsen die er ZIJN (na een rode kaart is dat er één
             minder), dan hoort dat hier te staan. Dit kaartje belooft wat er gaat gebeuren, maar de
             telwaarschuwing stond enkel op het tabblad Opstelling — en de vraag bij het starten komt
             pas als je al op "Start" tikt. Zo zie je het terwijl je nog rustig in de pauze zit.
             Zelfde woorden en kleuren als de waarschuwing daar (audit 23-08-2026, Tims keuze). */ ''}
        ${(() => {
          const doel = nextLineupOf(match).length, plaatsen = veldPlaatsenNu(match);
          if (!doel || doel === plaatsen) return '';
          const verschil = Math.abs(doel - plaatsen);
          const hoeveel = verschil === 1 ? 'een man' : verschil + ' spelers';
          return `<p style="font-size:13px;color:#b45309;background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:8px 10px;margin-bottom:10px">${icI(IC.warn)} Er ${doel === 1 ? 'staat' : 'staan'} nu <b>${doel}</b> ${doel === 1 ? 'speler' : 'spelers'} op het veld voor <b>${plaatsen}</b> ${plaatsen === 1 ? 'plaats' : 'plaatsen'} — je begint met ${hoeveel} ${doel > plaatsen ? 'te veel' : 'minder'}.</p>`;
        })()}
        <button class="btn btn-orn" style="width:100%" onclick="setTab('opstelling')">${icI(IC.shirt)} Opstelling nakijken of wijzigen</button>
        <div class="evtbtns" style="margin:8px 0 0;grid-template-columns:repeat(${heeftPlan ? 3 : 2},1fr)">
          ${heeftPlan ? `<div class="evtbtn ec" onclick="modalUsePlannedLineup(${qNum + 1})"><span class="ei">${IC.clipboard}</span><span class="el">Volgens plan</span></div>` : ''}
          <div class="evtbtn" onclick="confirmNextLineupLeeg()"><span class="ei">${IC.eraser}</span><span class="el">Leeg veld</span></div>
          <div class="evtbtn" onclick="modalAddPostEvent()"><span class="ei">${IC.log}</span><span class="el">Event in ${pSingLow(match)} ${qNum}</span></div>
        </div>
      </div>`; })() : ''}
      ${ro ? '' : (() => { const simple = simpleEventsOn(); return `<div class="evtbtns">
        <div class="evtbtn eg ${dis}" onclick="modalGoal()"><span class="ei">${IC.goal}</span><span class="el">Goal</span></div>
        <div class="evtbtn es ${dis}" onclick="modalSub()"><span class="ei">${IC.swap}</span><span class="el">Wissel</span></div>
        ${/* Sinds 2B (22-08-2026): alles met pláátsen — verzetten, ruilen, wisselen via het veld,
             bijzetten — gebeurt op het tabblad Opstelling. De knop heet daarom exact zoals dat
             tabblad. modalPosSwap() blijft bestaan voor events achteraf (via "Meer"). */ ''}
        ${/* Bewust zonder ${dis}: naar het tabblad springen kan ook in de pauze — daar leeft het. */ ''}
        <div class="evtbtn" onclick="setTab('opstelling')"><span class="ei">${IC.shirt}</span><span class="el">Opstelling</span></div>
        ${/* KAARTEN OOK BIJ 3v3 EN 5v5 (Tims keuze, 25-08-2026). De gele kaart viel bij die twee
             spelvormen weg, maar "Meer" bood de rode onvoorwaardelijk aan en "Event toevoegen" beide
             — dus de beperking gold enkel op dit scherm en was daardoor vooral verwarrend. Tim koos
             voor overal toelaten in plaats van overal weglaten. */ ''}
        <div class="evtbtn eyel ${dis}" onclick="modalCard('yellow')"><span class="ei">${IC.cardY}</span><span class="el">Gele kaart</span></div>
        ${/* Blessure staat nu in de eenvoudige rij (Tims keuze, 25-08-2026): "blessure en dan wissel"
             is aan de zijlijn een van de meest voorkomende handelingen, en de uitleg bij de instelling
             beweerde al dat hij erin zat. Rood en penalty blijven onder "Meer". */ ''}
        <div class="evtbtn einj ${dis}" onclick="modalInjury()"><span class="ei">${IC.injury}</span><span class="el">Blessure</span></div>
        ${simple ? '' : `<div class="evtbtn ered ${dis}" onclick="modalCard('red')"><span class="ei">${IC.cardR}</span><span class="el">Rode kaart</span></div>
        <div class="evtbtn epen ${dis}" onclick="modalPenalty()"><span class="ei">${IC.penalty}</span><span class="el">Penalty</span></div>`}
        <div class="evtbtn ${dis}" onclick="modalExtra()"><span class="ei">${IC.more}</span><span class="el">Meer</span></div>
      </div>
      <button class="btn btn-pale btn-sm" style="margin-top:2px" onclick="toggleSimpleEvents()">${simple ? `${icI(IC.plus)} Meer opties tonen` : `${icI(IC.close)} Minder opties tonen`}</button>
      ${/* Klaargezette wissels: altijd bereikbaar, met een telletje zodat je ziet dat er iets
           wacht. Ze gaan nooit vanzelf af — zie modalPlannedSubs(). Het telletje toont enkel wat je
           in dít deel kan doorvoeren (plannedCountNu), niet je hele plan voor de wedstrijd. */ ''}
      <button class="btn btn-orgpale btn-sm" style="margin-top:6px;margin-bottom:14px" onclick="modalPlannedSubs()">${icI(IC.clipboard)} Geplande wissels${plannedCountNu(match) ? ` (${plannedCountNu(match)})` : ''}</button>`; })()}
      ${(canEvent && hasUndo()) ? `<button class="btn btn-orgpale" onclick="confirmUndoLast()">${icI(IC.undo)} Laatste actie ongedaan maken</button>` : ''}
      ${/* "Oei, dit was niet de bedoeling": een bescheiden knop onderaan, niet tussen de knoppen die
            je tijdens het spel nodig hebt. Enkel zolang de wedstrijd niet afgesloten is, en niet in
            het vastgelopen-kader (daar staat ze al). Bij een wedstrijd waar nog niets gebeurd is,
            volstaat "Toch nog niet gestart" hierboven. */ ''}
      ${(!ro && !isDone && (match.quarters || []).length && !vastgelopenLive(match))
        ? `<button class="btn btn-gray btn-sm" style="width:100%;margin-top:10px" onclick="confirmResetMatch()">${icI(IC.undo)} Opnieuw beginnen</button>`
        : ''}
      ${/* "Deel score" enkel ná de wedstrijd: tijdens het spel stond die knop in de weg van de
           knoppen die je dan echt nodig hebt, en de stand delen doe je toch achteraf. */ ''}
      ${isDone ? `<button class="btn btn-pale" onclick="go('detail','${match.id}')">${icI(IC.chart)} Wedstrijd bekijken</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="shareWhatsApp(match)">${icI(IC.share)} Deel score</button>` : ''}`;
  } else if (tab === 'opstelling') {
    const on = playersOnField(match), off = playersOnBench(match), absent = match.players.filter(p => p.absent), mins = calcMinutes(match);
    // Wie de wedstrijd verlaten heeft (naar huis, tweede veld, blessure met vertrek) stond in GEEN
    // van de drie lijsten: niet op het veld, niet op de bank (magNogMeedoen sluit hem uit) en niet
    // bij "Niet aanwezig" (p.absent blijft false). Gemeten 24-08-2026: zijn naam stond nergens meer
    // op dit tabblad terwijl hij 8 minuten gespeeld had, en een mistik was enkel terug te draaien
    // door het event te wissen op het tabblad Verloop. Daarom een vierde groep.
    const vertrokken = match.players.filter(p => !p.absent && isVertrokken(match, p.id));
    // Het ×-knopje heette altijd "Niet aanwezig", maar zodra iemand gespeeld heeft opent het een
    // ánder venster ("X van het veld": blessure of vertrokken). Titel volgt nu wat er echt gebeurt.
    const absentBtn = pid => {
      // Ná het eindsignaal geen kruisje meer: afwezig melden WIST de speelminuten van die speler, en
      // dat op een afgesloten wedstrijd is nooit wat iemand bedoelt. Rechtzetten kan nog altijd via
      // het verslag (audit 24-08-2026).
      if (ro || isDone) return '';
      const gespeeld = Math.round((((mins[pid] || {}).ms) || 0) / 60000);
      return `<button class="evt-del" style="margin-left:6px;flex-shrink:0" onclick="modalMarkAbsent('${pid}')" title="${gespeeld > 0 ? 'Van het veld' : 'Niet aanwezig'}">×</button>`;
    };
    tabContent = `
      ${miniScore}
      ${/* 'paused' erbij (audit 24-08-2026): tijdens een klokpauze viel dit terug op een veld waar je
           niet op kon tikken — gemeten: 26 aantikbare plekken tijdens het spel, 0 tijdens een pauze —
           terwijl de knoppen voor doelpunt, kaart en wissel gewoon bleven werken. Een stilgelegd spel
           is juist wanneer je wisselt. */ ''}
      ${canStartNext ? pauseLineupHtml(match)
        : ((!ro && !isDone && (match.quarterStatus === 'running' || match.quarterStatus === 'paused'))
          ? liveLineupHtml(match)
          : `<div class="card">${renderPitch(match, on)}</div>`)}
      <div class="card">
        ${/* In de pauze staat hierboven al de opstelling VAN HET VOLGENDE deel. Deze lijst is die van
             het deel dat net gespeeld is; zonder dat erbij te zeggen stonden er twee opstellingen
             onder elkaar zonder onderscheid (audit 24-08-2026). */ ''}
        <div class="sec" style="margin-top:0">${canStartNext ? `Op het veld aan het einde van ${pSingLow(match)} ${qNum}` : 'Op het veld'} (${on.length})</div>
        ${on.length ? on.map(p => playerRowHtml(p, mins[p.id], false, getGameTimeMs(match), ro ? '' : absentBtn(p.id))).join('') : '<p style="color:var(--txt2);font-size:14px">Niemand op het veld.</p>'}
        ${off.length ? `<hr><div class="sec">Bank (${off.length})</div>${off.map(p => playerRowHtml(p, mins[p.id], true, getGameTimeMs(match), ro ? '' : absentBtn(p.id))).join('')}` : ''}
        ${vertrokken.length ? `<hr><div class="sec" style="color:var(--org2,#b45309)">Weg uit de wedstrijd (${vertrokken.length})</div>${vertrokken.map(p => `<div class="prow">${numDot(p, 'pnum pnum-off', 'opacity:.6')}<div style="flex:1"><div class="pname">${esc(p.name)}${vertrokkenChip(p)}</div><div style="font-size:11px;color:var(--txt2)">Speelde ${Math.round((((mins[p.id]||{}).ms)||0)/60000)} min — die blijven staan</div></div>${(ro || isDone) ? '' : `<button class="btn btn-sm btn-pale" style="font-size:11px;padding:3px 8px" onclick="confirmHerstelVertrokken('${p.id}')">Herstel</button>`}</div>`).join('')}` : ''}
        ${absent.length ? `<hr><div class="sec" style="color:var(--rd)">Niet aanwezig (${absent.length})</div>${absent.map(p => `<div class="prow">${numDot(p, 'pnum pnum-off', 'opacity:.4')}<div style="flex:1"><div class="pname" style="opacity:.5;text-decoration:line-through">${esc(p.name)}</div>${p.absentReason ? `<div style="font-size:11px;color:var(--txt2)">${esc(absentReasonLabel(p.absentReason))}</div>` : ''}</div>${ro ? '' : `<button class="btn btn-sm btn-pale" style="font-size:11px;padding:3px 8px" onclick="doUnmarkAbsent('${p.id}')">Herstel</button>`}</div>`).join('')}` : ''}
        ${/* Zie modalAddPlayerLive: de selectie lag vast vanaf de aftrap, en dat botst met de
             laatkomer en met de speler die van het tweede veld komt bijspringen. */ ''}
        ${(ro || isDone) ? '' : `<hr><button class="btn btn-pale btn-sm" style="width:100%" onclick="modalAddPlayerLive()">${icI(IC.plus)} Speler bijzetten</button>`}
      </div>
      ${planningTijdensMatchHtml(match)}`;
  } else {
    tabContent = miniScore + (match.events.length
      ? `<div class="card">${renderEventLog(match)}</div>`
      : `<div class="empty"><div class="ei">${IC.clipboard}</div><p>Nog geen events.</p></div>`)
      + ((ro || isDone) ? '' : `<button class="btn btn-red" style="margin-top:12px" onclick="endMatch()">${icI(IC.finish)} Wedstrijd afsluiten</button>`);
  }

  return `
  <div class="hdr"><button class="back" onclick="confirmLeave()">‹</button>
    ${/* esc() en geen lege delen (audit 25-08-2026): bij een tornooiwedstrijd erft location een door
         de gebruiker getypte tekst, en overal elders in dit bestand staat esc(). Zonder locatie las
         de kop bovendien "undefined · …". */ ''}
    <div><h1>${matchTitle(match)}</h1><div class="hdr-sub">${[match.location, matchWhen(match), match.matchType].filter(Boolean).map(esc).join(' · ')}</div></div>
    ${/* "Afsluiten" stond hier — pal naast de plek waar je duim de hele wedstrijd komt. Eén mistik
         en de wedstrijd is dicht. Nu staat hier het onschuldige "Info" (wedstrijdinfo bewerken) en
         is Afsluiten verhuisd naar onderaan het tabblad Verloop, bewust wat weggestoken. */ ''}
    ${(!isDone && !ro) ? `<button class="hdr-btn" onclick="modalEditMatchInfo()">Info</button>` : ''}
  </div>
  <div class="content">${ro ? `<div class="viewer-banner">${icI(IC.eye)} Je kijkt mee — dit scherm wordt live bijgewerkt</div>` : ''}${tabContent}</div>
  ${/* Stonden tot 24-08-2026 niet in de pauze (`!isBetween`), net het moment waarop je iets wil
       opschrijven: wat er in het vorige deel gebeurde, of een afspraak voor het volgende. Ná het
       afsluiten bleven ze wél staan, dus het was ook niet consequent. */ ''}
  ${!ro ? `<button class="fab-note" onclick="modalQuickNote()" title="Snelle notitie">${IC.edit}</button><button class="fab-mark" onclick="markMoment()" title="Moment markeren">${IC.motm}</button>` : ''}
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
  // De balk en het percentage blijven de feiten: hij speelde echt minder. Maar het RODE alarm zegt
  // "deze speler kreeg te weinig speeltijd", en dat is geen verwijt dat klopt voor wie halverwege
  // vertrok of pas later bijkwam. Het cijfer blijft staan, het merkje ernaast legt het uit.
  const weg = !!(match && isVertrokken(match, p.id));
  const uitgelegd = weg || !!p.addedDuringMatch;
  const bar = pct !== null ? `<div class="fairbar ${low?'low':mid?'mid':''}" style="max-width:120px"><span style="width:${Math.min(100,pct)}%"></span></div>` : '';
  return `<div class="prow">
    ${numDot(p, 'pnum ' + (isOff?'pnum-off':''))}
    <div style="flex:1"><div class="pname">${esc(p.name)}${cap}${motm}${bijgekomenChip(p)}${vertrokkenChip(p)}</div>${bar}</div>
    <div class="pmins ${(low && !uitgelegd)?'pmins-warn':''}" style="margin-left:6px">${m}'${pct!==null?` · ${pct}%`:' gespeeld'}</div>
    ${extraBtn}
  </div>`;
}
// Timer blijft lopen op álle subtabs: checkOvertimeAlert (eindsignaal) draait in de timer-
// interval en moet ook piepen als de gebruiker net de speeltijden (Opstelling) bekijkt.
// updateTimerDisplay stopt zelf meteen zonder #timer-time-element, dus dit kost niets.
function setTab(t) { tab = t; _lineupSel = null; render(); startTimer(); }
function confirmLeave() {
  // matchTerug(): terug naar waar de wedstrijd geopend werd — homescherm of wedstrijdenlijst.
  const backFn = isGuest ? `go('home')` : (match && match.tournamentId) ? `goTournament('${match && match.tournamentId}')` : `go(matchTerug())`;
  if (match && match.status === 'live') {
    openModal(`<h3>Wedstrijd verlaten?</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De wedstrijd loopt nog. Je kan later terugkomen.</p>
      <button class="btn btn-pale" onclick="closeModal();${backFn}">${icI(IC.check)}Terug naar overzicht</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
  } else { if (isGuest) go('home'); else if (match && match.tournamentId) goTournament(match.tournamentId); else go(matchTerug()); }
}

// ===================== QUARTER CONTROLS =====================
// "Wedstrijd starten" op het prep-scherm zet enkel de status op live — de klok begint pas bij
// startQuarter(). Een misklik daar was tot nu toe niet meer terug te draaien in de app: de
// wedstrijd stond live voor alle kijkers en er was enkel nog de weg naar het einde. Deze twee
// functies zetten haar terug op gepland, maar alleen zolang er geen enkel deel gelopen heeft en
// geen enkele gebeurtenis gelogd is — anders zou je speelminuten en events in een tussentoestand
// achterlaten. De controle staat bewust twee keer: de knop verschijnt niet, en de actie weigert.
function confirmTerugNaarGepland() {
  if (!canLive() || !match) return;
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
  if (!canLive() || !match) return;
  if ((match.quarters || []).length || (match.events || []).length) {
    closeModal(); showToast('Deze wedstrijd is al begonnen — terugzetten kan niet meer.', 'err');
    return;
  }
  match.status = 'planned';
  match.currentQuarter = 0;
  match.quarterStatus = 'not_started';
  delete match.startLineup;   // hoort bij een aftrap die er niet meer is (zie startQuarter)
  await dbSave(match);
  closeModal();
  showToast('Terug naar gepland.', 'ok');
  await go('prep', match.id);
}
// ---- Nooit vastzitten (v0.48.0) ----
// Op 22-08-2026 stond er tijdens een veldtest een wedstrijd op het scherm zonder één bruikbare knop:
// de klok liep niet (het blok was afgesloten), een volgend blok kon niet (numQuarters stond te laag
// door het bulk-bewerken van v0.39.0), en afsluiten leek nergens te kunnen. De onderliggende fout is
// hersteld, maar een livescherm hoort NOOIT een doodlopend eind te zijn: welke toestand er ook in de
// gegevens staat, er moet een weg vooruit zichtbaar zijn. Vandaar deze vaststelling én de twee
// uitwegen eronder.
function vastgelopenLive(m) {
  if (!m || m.status !== 'live') return false;
  const q = laatsteQuarter(m);
  if (!q) return false;                                    // nog niets gespeeld: "Start wedstrijd" staat er
  if (klokLoopt(m) || q.pausedAt) return false;            // klok loopt of staat op pauze: knoppen aanwezig
  const qNum = m.currentQuarter || 0;
  if (qNum === 0) return false;                            // idem: startknop
  return !(m.quarterStatus === 'between' && qNum < (m.numQuarters || 0));
}
// De uitleg volgt de ECHTE oorzaak (audit 24-08-2026). Tot dan stond er altijd "er zijn N gespeeld
// maar de wedstrijd staat op M" — ook wanneer N en M gelijk waren en enkel het toestandsveld niet op
// 'between' stond. Dan las het kader tegenstrijdige onzin.
function vastgelopenHtml(m) {
  const label = pSingLow(m);
  const gespeeld = (m.quarters || []).length;
  const voorzien = m.numQuarters || 0;
  const teLaag = (m.currentQuarter || 0) >= voorzien;   // alle voorziene delen zijn gespeeld
  const uitleg = teLaag
    ? `Er ${gespeeld === 1 ? 'is 1 ' + label : 'zijn ' + gespeeld + ' ' + pPlural(m)} gespeeld, en dat ${gespeeld === 1 ? 'is' : 'zijn'} er even veel als voorzien. De klok staat stil en de wedstrijd is nog niet afgesloten.`
    : `Er ${gespeeld === 1 ? 'is 1 ' + label : 'zijn ' + gespeeld + ' ' + pPlural(m)} gespeeld en de klok staat stil, maar de wedstrijd staat in een tussentoestand waarin ze niet verder kan.`;
  return `<div class="card" style="border-left:4px solid var(--rd)">
    <div class="sec" style="margin-top:0">${icI(IC.warn)} Deze wedstrijd zit vast</div>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">${uitleg} Kies wat er moet gebeuren:</p>
    <button class="btn btn-green" onclick="confirmExtraDeel()">${icI(IC.playFilled)} Nog een ${label} spelen</button>
    <button class="btn btn-red" style="margin-top:8px" onclick="endMatch()">${icI(IC.finish)} Wedstrijd afsluiten</button>
    <button class="btn btn-pale" style="margin-top:8px" onclick="confirmResetMatch()">${icI(IC.undo)} Opnieuw beginnen</button>
  </div>`;
}
function confirmExtraDeel() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const label = pSingLow(match);
  openModal(`<h3>Nog een ${label} spelen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De wedstrijd krijgt er één ${label} bij (${(match.numQuarters || 0) + 1} in totaal) en je kan meteen starten. De al gespeelde ${pPlural(match)} en hun speelminuten blijven staan.</p>
    <button class="btn btn-green" onclick="doExtraDeel()">${icI(IC.check)} Ja, ${label} toevoegen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doExtraDeel() {
  if (!canLive() || !match) return;
  // Zelfde rekenwijze als bij het heropenen van een afgesloten wedstrijd (zie confirmReopenMatch):
  // nooit lager dan wat er al gespeeld is, en dan één erbij.
  match.numQuarters = Math.max(match.numQuarters || 0, (match.quarters || []).length) + 1;
  match.quarterStatus = 'between';
  await dbSave(match);
  closeModal(); render();
  showToast(`Er is een ${pSingLow(match)} bijgekomen — je kan starten.`, 'ok');
}
// ---- Opnieuw beginnen ----
// "Oei, dit was niet de bedoeling": de wedstrijd terug naar gepland, met de opstelling van de aftrap.
// Anders dan terugNaarGepland() mag dit ook als er al gespeeld is — en dus gooit het echt iets weg.
// Daarom drie waarborgen: de bevestiging noemt de wedstrijd bij ploeg, tegenstander, datum en uur
// (het is te makkelijk om dit op de verkeerde wedstrijd te doen), ze zegt precies wat verdwijnt, en
// de volledige wedstrijd wordt bewaard zodat het meteen terug te draaien is.
const RESET_UNDO_KEY = 'voetbal_resetUndo';
const RESET_UNDO_GELDIG_MS = 24 * 3600 * 1000;
function matchOmschrijving(m) {
  return [tName(m), m.opponent ? 'tegen ' + m.opponent : '', matchWhen(m), m.venue].filter(Boolean).join(' · ');
}
function confirmResetMatch() {
  if (!canLive() || !match) return;
  const m = match;
  const nEvents = (m.events || []).filter(e => e.type !== 'quarter_start' && e.type !== 'quarter_end').length;
  const nDelen = (m.quarters || []).length;
  const heeftPlan = ((m.plannedLineups && Object.keys(m.plannedLineups).length) || 0) > 0;
  openModal(`<h3>${icI(IC.warn)} Opnieuw beginnen?</h3>
    <div style="background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:10px 12px;margin-bottom:12px;text-align:left">
      <div style="font-size:12px;color:#b45309;margin-bottom:4px">Dit gaat over deze wedstrijd:</div>
      <div style="font-weight:700;font-size:14px">${esc(matchOmschrijving(m))}</div>
    </div>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:12px;text-align:left">Ze gaat terug naar <b>gepland</b> en kan daarna gewoon opnieuw gestart worden, met <b>de opstelling van de aftrap</b>${heeftPlan ? ' en je plan per ' + pSingLow(m) + ' zoals het was' : ''}.</p>
    <p style="font-size:13px;color:var(--rd);margin-bottom:12px;text-align:left">Wat verdwijnt: <b>${nDelen === 1 ? '1 gespeeld ' + pSingLow(m) : nDelen + ' gespeelde ' + pPlural(m)}</b>, <b>${nEvents === 1 ? '1 gebeurtenis' : nEvents + ' gebeurtenissen'}</b> (doelpunten, wissels, kaarten) en alle speelminuten. Je selectie, je plan en je notities blijven staan.</p>
    ${/* Zei tot 24-08-2026 "een dag lang". De undo-knop staat enkel op het voorbereidingsscherm, dus
         zodra je opnieuw start is ze onbereikbaar — de belofte klopte niet met waar de knop staat.
         Ook eerlijk gezegd wat NIET meegaat: doResetMatch raakt numQuarters en de afwezigmeldingen
         bewust niet (die zijn meestal nog waar), maar dat verwacht niemand vanzelf. */ ''}
    <p style="font-size:12px;color:var(--txt2);margin-bottom:14px">Vergissing? Zolang je niet opnieuw gestart bent, staat er op het voorbereidingsscherm een knop om dit terug te draaien.${(m.players || []).some(p => p.absent) ? ' Wie je afwezig meldde, blijft afwezig.' : ''}</p>
    <button class="btn btn-red" onclick="doResetMatch()">${icI(IC.undo)} Ja, opnieuw beginnen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doResetMatch() {
  if (!canLive() || !match) return;
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    const m = match;
    // Eerst de volledige wedstrijd wegzetten — pas daarna iets wijzigen. Mislukt het bewaren, dan
    // gaat de reset niet door: liever een vastzittende wedstrijd dan een onherstelbare.
    try {
      localStorage.setItem(RESET_UNDO_KEY, JSON.stringify({
        when: Date.now(), teamId: activeTeamId || '', id: m.id,
        omschrijving: matchOmschrijving(m), match: jclone(m),
      }));
    } catch (e) {
      showToast('Kon geen veiligheidskopie bewaren — opnieuw beginnen is daarom niet doorgegaan.', 'err');
      return;
    }
    // Posities van de aftrap terugspoelen vóór we de events weggooien: die reconstructie leest ze.
    const startPos = positionsAtMatchStart(m);
    (m.players || []).forEach(p => {
      const pos = startPos[p.id];
      if (pos) { p.x = pos.x; p.y = pos.y; p.line = pos.line; p.posNum = pos.posNum; }
      p.onField = !!p.starting;
      // x/y is de bron voor de roosterplek (zie spelerGridCode) — de code hier meteen mee bijwerken,
      // anders blijft een oude plek als terugval hangen voor wie geen coördinaten heeft.
      const code = spelerGridCode(p);
      if (code) p.posCodeVeld = code; else delete p.posCodeVeld;
    });
    m.status = 'planned';
    m.currentQuarter = 0;
    m.quarterStatus = 'not_started';
    m.quarters = [];
    // MET TOMBSTONE (audit 25-08-2026). De gebeurtenissen werden hier leeggegooid zonder ze als
    // verwijderd te markeren, terwijl undoLast en doDeleteEvent dat wél doen. Bij twee beheerders op
    // één wedstrijd zet de merge in applyCloudMatch elk lokaal event terug dat niet in de cloud staat
    // én niet getombsteend is — en pusht het opnieuw. Het tweede toestel heeft de oude events nog, dus
    // die stroomden terug in de leeggemaakte wedstrijd. Gemeten: 0 tombstones na een reset.
    (m.events || []).forEach(e => tombstoneEvent(m, e.id));
    m.events = [];
    m.pendingSubs = []; m.pendingPosSwaps = [];
    m.keeperByQ = {};
    // De vastgelegde startopstelling hoort bij de aftrap die net ongedaan gemaakt is; bij de
    // volgende start wordt ze opnieuw vastgelegd (zie startQuarter).
    delete m.startLineup;
    // En de getekende opstelling voor het volgende deel (audit 25-08-2026). Die bleef staan, dus bij
    // de eerste pauze van de NIEUWE poging tekende de app de opstelling van de vorige — terwijl het
    // kaartje ernaast zei dat er niets te wijzigen was, want de afgeleide wissels waren wél leeg.
    delete m.nextLineup;
    m.scoreUs = 0; m.scoreThem = 0;
    delete m.motmId;
    recomputeScore(m); recomputeOnField(m);
    stopTimer(); releaseWake();
    await dbSave(m);
    closeModal();
    showToast('Terug naar gepland — je kan opnieuw starten.', 'ok');
    await go('prep', m.id);
  } finally { _eventBusy = false; }
}
function resetUndoBeschikbaar() {
  try {
    const u = JSON.parse(localStorage.getItem(RESET_UNDO_KEY) || 'null');
    if (!u || !u.match || !u.id) return null;
    if (Date.now() - (u.when || 0) > RESET_UNDO_GELDIG_MS) return null;
    // Enkel aanbieden bij de ploeg waar het gebeurde — zelfde reden als bij het bulk-bewerken:
    // anders zet een tik hier een wedstrijd terug in de cloud van een ándere ploeg.
    if (cloudReady && (!u.teamId || u.teamId !== activeTeamId)) return null;
    return u;
  } catch (e) { return null; }
}
function resetUndoVergeten() { try { localStorage.removeItem(RESET_UNDO_KEY); } catch (e) {} render(); }
async function resetUndo() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const u = resetUndoBeschikbaar();
  if (!u) return;
  const terug = u.match;
  recomputeScore(terug); recomputeOnField(terug);
  await dbSave(terug);
  try { localStorage.removeItem(RESET_UNDO_KEY); } catch (e) {}
  showToast('De wedstrijd staat terug zoals ze was.', 'ok');
  await go(terug.status === 'done' ? 'detail' : 'live', terug.id);
}
async function startQuarter(zonderControle) {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  if (match.quarterStatus === 'running') return; // dubbeltik-guard: deel loopt al
  // Bovenop de statuscontrole ook naar het BLOK zelf kijken (audit 24-08-2026). pauseQuarter,
  // resumeQuarter en doEndPeriod doen dat al; hier niet, en dus kon een verouderd scherm of een
  // synchronisatie met een medebeheerder een nieuw blok openen terwijl het vorige nog geen eindtijd
  // had. Zo'n open blok blijft in de speeltijd doortellen tot nu — een blok dat nooit stopt.
  const laatsteBlok = (match.quarters || [])[match.quarters.length - 1];
  if (laatsteBlok && !laatsteBlok.endTime) {
    showToast(`${pSing(match)} ${laatsteBlok.num} is nog niet afgesloten. Sluit dat eerst af.`, 'err');
    render();
    return;
  }
  // DE WACHTER (Tim, 22-08-2026): een volgend deel starten met een leeg — of half leeg — veld is
  // vrijwel altijd een vergissing (leeg veld gemaakt en vergeten te vullen). Eén controle, hier,
  // vlak voor de start: de enige plek waar het te laat zou zijn. Enkel voor een VOLGEND deel; de
  // aftrap van deel 1 heeft haar eigen waarschuwing in de selectiewizard.
  if (!zonderControle && match.currentQuarter >= 1 && startControleModal()) return;
  // DE GETEKENDE OPSTELLING IS DE WAARHEID (audit 25-08-2026). De drie rondes hieronder voeren de
  // AFGELEIDE wissels uit (pendingSubs/pendingPosSwaps), en die werden tot nu alleen herrekend op het
  // moment dat je de doelopstelling schreef. Veranderde het veld daarna nog, dan waren ze verouderd
  // en deed de start iets anders dan wat op het pauzeveld stond. GEMETEN: pauze na kwart 1, opstelling
  // voor kwart 2 getekend mét Cas, dan het vorige deel hervat ("Te vroeg gestopt"), daarin één keer
  // live gewisseld, afgesloten en kwart 2 gestart → Jef stond op het veld en Cas niet. Het aantal
  // klopte (8), dus het viel niet op. Door de afleiding hier nog één keer te draaien, is de
  // doelopstelling per definitie wat er gebeurt.
  // Raakt match.plannedSubs NIET: dat is de aparte lijst met de wissels die JIJ klaarzet.
  // Zonder getekende opstelling niets doen — dan zijn de pendings leeg en start het deel zoals het
  // vorige eindigde, precies zoals altijd.
  if (Array.isArray(match.nextLineup) && match.nextLineup.length) _pasNextLineupAan(match, match.nextLineup);
  _lineupSel = null;   // selectie uit de pauze-opstelling niet laten hangen
  match.currentQuarter++;
  match.quarterStatus = 'running';
  match.quarters.push({ num: match.currentQuarter, startTime: Date.now(), endTime: null, totalPaused: 0, pausedAt: null });
  addEvent('quarter_start');
  // DE STARTOPSTELLING VASTLEGGEN (v0.54.0) — één keer, bij de aftrap. Vanaf hier is dit veld het
  // feit waar élke reconstructie van vertrekt; er wordt voor deze wedstrijd nooit meer
  // teruggespoeld vanaf de eindtoestand. Bewust VÓÓR het doorvoeren van de klaargezette wissels
  // hieronder: die worden als atBreak-events gelogd en door de reconstructie op deze basis
  // toegepast — legde je ze al toegepast vast, dan werden ze dubbel gerekend.
  // Nieuw, optioneel veld: bestaande wedstrijden zonder dit veld blijven terugspoelen zoals altijd.
  if (match.currentQuarter === 1 && !Array.isArray(match.startLineup)) {
    match.startLineup = match.players
      .filter(p => p.starting && magOpHetVeld(match, p) && typeof p.x === 'number')
      .map(p => ({ id: p.id, x: p.x, y: p.y, line: p.line, posNum: p.posNum, posCodeVeld: spelerGridCode(p) || null }));
  }
  // DRIE RONDES, en de volgorde is wezenlijk (v0.49.0):
  //   1. de wissels waar iemand het veld verlaat — dat maakt plaatsen vrij;
  //   2. de positiewissels van wie blijft — nu kan iedereen naar zijn doelplek;
  //   3. wie erbij komt zonder tegenhanger — zijn plek is dan pas echt vrij.
  // Deed ronde 3 mee met ronde 1, dan zette die speler zich op een plek die nog bezet was, en bleef
  // de vorige bewoner op zijn oude plaats staan (gevonden met 40 willekeurige tikreeksen).
  const subsWissel = (match.pendingSubs || []).filter(s => s.outId);
  const subsErbij = (match.pendingSubs || []).filter(s => !s.outId);
  for (const s of subsWissel) {
    const pOut = match.players.find(p => p.id === s.outId), pIn = match.players.find(p => p.id === s.inId);
    if (!pOut) continue;
    // Staat hij al niet meer op het veld, dan is deze wissel al uitgevoerd (of achterhaald): hem
    // toch verwerken zou de invaller erbij zetten zonder dat er iemand af gaat — een man te veel.
    // Kan sinds v1.0.2 niet meer ontstaan (alles loopt via de doelopstelling), maar een wedstrijd
    // die met oudere klaargezette wissels op een toestel staat, mag daar niet op stuklopen.
    if (!pOut.onField) continue;
    // Eenzijdige wissel (geen invaller): de speler gaat eraf en zijn plaats blijft leeg. Zo kan een
    // doelopstelling met minder spelers ook echt uitgevoerd worden, en verlaat iemand de wedstrijd
    // in de pauze. Zelfde eventvorm als een gewone wissel, met playerInId null — calcMinutes en
    // playersAtPeriodStart lezen playerOutId los van playerInId.
    if (!s.inId || !pIn) {
      addEvent('substitution', { playerOutId: s.outId, playerInId: null, atBreak: true, reden: s.reden || null });
      pOut.onField = false;
      continue;
    }
    // Speler intussen afwezig gemarkeerd (bv. vertrokken tijdens de rust): wissel niet doorvoeren —
    // een afwezige speler het veld op sturen geeft een onzichtbaar gat op zijn positie.
    if (pIn.absent) { showToast(`Ingeplande wissel overgeslagen: ${pIn.name} is afwezig gemarkeerd.`, 'err'); continue; }
    // Uitgesloten speler (rode kaart) mag niet vervangen worden en dus ook zelf niet het veld op:
    // de plaats van wie eruit ging blijft dan gewoon leeg — de ploeg speelt met een man minder.
    if (isUitgesloten(match, pIn.id)) { showToast(`Ingeplande wissel overgeslagen: ${pIn.name} is uitgesloten (rode kaart).`, 'err'); continue; }
    // Vertrokken tijdens de pauze (naar huis, tweede veld): hij kan het volgende blok niet starten.
    // De doelopstelling filtert hem al weg, dit is het vangnet voor wissels die er al stonden.
    if (isVertrokken(match, pIn.id)) { showToast(`Ingeplande wissel overgeslagen: ${pIn.name} heeft de wedstrijd verlaten.`, 'err'); continue; }
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
    // Verhuizing naar een lege plek: geen tegenspeler, dus enkel pA verplaatst en zijn oude plaats
    // blijft leeg. Zelfde eventvorm als live (pB null + naarPlek), met atBreak erbij.
    if (!s.pB && s.naarPlek) {
      const p = match.players.find(x => x.id === s.pA), plek = gridPlek(s.naarPlek);
      if (!p || !plek) continue;
      const pos = { x: p.x, y: p.y, line: p.line, posNum: p.posNum, posCodeVeld: p.posCodeVeld };
      addEvent('posSwap', { pA: s.pA, pB: null, naarPlek: s.naarPlek, atBreak: true, posA: pos, posB: null });
      zetOpGridPlek(p, plek, match);
      continue;
    }
    const pA = match.players.find(p => p.id === s.pA), pB = match.players.find(p => p.id === s.pB);
    if (!pA || !pB) continue;
    const posA = { x: pA.x, y: pA.y, line: pA.line, posNum: pA.posNum };
    const posB = { x: pB.x, y: pB.y, line: pB.line, posNum: pB.posNum };
    addEvent('posSwap', { pA: s.pA, pB: s.pB, atBreak: true, posA, posB });
    pA.x = posB.x; pA.y = posB.y; pA.line = posB.line; pA.posNum = posB.posNum;
    pB.x = posA.x; pB.y = posA.y; pB.line = posA.line; pB.posNum = posA.posNum;
  }
  match.pendingPosSwaps = [];
  // Ronde 3: wie erbij komt zonder dat er iemand af gaat. Nu pas, want zijn plek is pas vrij nadat
  // de verhuizingen hierboven gebeurd zijn. Zie de uitleg bij de drie rondes.
  for (const s of subsErbij) {
    const pIn = match.players.find(p => p.id === s.inId);
    const plek = s.naarPlek ? gridPlek(s.naarPlek) : null;
    if (!pIn || !plek || !magNogMeedoen(match, pIn)) continue;
    // posBefore ook hier, om dezelfde reden als bij een gewone wissel: een speler die eerder al op
    // het veld stond en nu terugkomt, moet bij het terugspoelen zijn vórige plaats terugkrijgen.
    // Ontbrak dat, dan zette de reconstructie hem op "geen positie" — en dan viel de startopstelling
    // van een basisspeler weg die tussentijds gewisseld was en later terugkwam.
    const posBefore = (typeof pIn.x === 'number')
      ? { x: pIn.x, y: pIn.y, line: pIn.line, posNum: pIn.posNum } : null;
    addEvent('substitution', { playerOutId: null, playerInId: s.inId, atBreak: true, naarPlek: s.naarPlek, posBefore });
    zetOpGridPlek(pIn, plek, match);
    pIn.onField = true;
  }
  // De doelopstelling hoort bij de pauze die net voorbij is en is nu uitgevoerd. Laten staan zou de
  // volgende pauze laten beginnen met een opstelling van een deel eerder.
  delete match.nextLineup;
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
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const q = match.quarters[match.quarters.length - 1];
  if (!q || q.pausedAt || q.endTime) return; // guard: al gepauzeerd, of het deel is al beëindigd (stale UI/co-admin-sync)
  q.pausedAt = Date.now(); match.quarterStatus = 'paused';
  releaseWake();
  await dbSave(match); render();
}
async function resumeQuarter() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
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
// Een net afgesloten deel dat je nog kan hervatten: we staan tussen de delen (of na het laatste)
// en het laatste deel heeft een eindtijd. Geeft het nummer terug, anders null. Voor de mistik op
// "Einde kwart" — die was tot nu onomkeerbaar zolang de wedstrijd liep (Tim, 23-08-2026).
function hervatBaarDeel(m) {
  if (!m || m.status === 'done' || m.quarterStatus !== 'between') return null;
  const q = (m.quarters || [])[(m.quarters || []).length - 1];
  return (q && q.startTime && q.endTime) ? q.num : null;
}
// Bevestiging vóór het hervatten: de klok springt terug naar waar ze stond en het einde-event
// verdwijnt, dus het is geen onschuldige tik. De tijd sinds het (foute) afsluiten telt als pauze,
// zodat niemand er speelminuten bij krijgt — zie doResumeLastPeriod.
function confirmHervatDeel() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const nr = hervatBaarDeel(match);
  if (!nr) return;
  const label = pSingLow(match);
  const q = match.quarters[match.quarters.length - 1];
  const gespeeld = Math.round(kwartDuurMs(q) / 60000);
  openModal(`<h3>${icI(IC.live)} Verder in ${label} ${nr}?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Dit ${label} staat afgesloten op <b>${gespeeld} min</b>. Hervatten zet de klok terug op dat punt en laat ze weer lopen, alsof je nooit gestopt was. De tijd sinds het afsluiten telt niet mee als speeltijd.</p>
    <button class="btn btn-green" onclick="doResumeLastPeriod()">${icI(IC.live)} Ja, verder in ${label} ${nr}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Beëindig het huidige deel handmatig -> pauze tussen de delen (klok staat stil tot de volgende start).
// Vergeten af te sluiten? Bij fors overtime (zie overtimeNudgeMin) waarschuwen en de mogelijkheid
// geven de werkelijke duur te corrigeren, i.p.v. stilzwijgend Date.now() te nemen — anders
// vertekent zo'n vergeten tik alle speeltijden van dit deel.
function endPeriod() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const label = pSingLow(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const overtimeMin = durMs ? Math.round((getQElapsed(match) - durMs) / 60000) : 0;
  // AUDIT 24-08-2026 — het duurveld zat VÁST aan de waarschuwing, en die verschijnt enkel bij ruime
  // overschrijding. Gemeten: 18 minuten op een blok van 15 gaf geen enkel invoerveld, dus drie
  // minuten te veel waren hier niet recht te zetten. Nu staat het veld er altijd; de luide
  // waarschuwing blijft voorbehouden aan een echte overschrijding. Bevestig je de voorgevulde
  // waarde, dan verandert er niets (doEndPeriod slaat de correctie over bij dezelfde minuut).
  const gelopenMin = Math.round(getQElapsed(match) / 60000);
  const warn = (durMs && overtimeMin > overtimeNudgeMin(match)) ? `<div class="nudge" style="margin-bottom:12px">${icI(IC.warn)} Dit ${label} loopt al ${overtimeMin} min langer dan gepland (${match.quarterDuration} min voorzien). Ben je vergeten af te sluiten? Corrigeer hieronder de werkelijke duur.</div>` : '';
  const duurVeld = `<div class="fg" style="margin-bottom:12px"><label style="font-size:12px;color:var(--txt2)">Werkelijke duur van dit ${label} (minuten)</label><input id="ep-correct-min" type="number" inputmode="numeric" value="${gelopenMin}" min="1"></div>`;
  openModal(`<h3>Einde ${label} ${match.currentQuarter}?</h3>
    ${warn}
    ${duurVeld}
    ${/* Zei tot 24-08-2026 "en je kan dit kwart niet meer hervatten". Dat is sinds 23-08 niet meer
         waar: op het scherm waar je hierna landt staat "Te vroeg gestopt — verder in kwart N". Wie
         het oude venster las, besliste op verkeerde informatie én zocht de herstelknop niet. */ ''}
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De klok stopt. Was het te vroeg? Dan staat er daarna een knop om dit ${label} te hervatten.</p>
    <button class="btn btn-red" onclick="doEndPeriod()">${icI(IC.stopFilled)} Ja, beëindig ${label}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doEndPeriod() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const q = match.quarters[match.quarters.length - 1];
  if (!q || q.endTime) { closeModal(); return; } // dubbeltik-guard: deel al beëindigd
  if (q.pausedAt) { q.totalPaused = (q.totalPaused || 0) + (Date.now() - q.pausedAt); q.pausedAt = null; }
  const corrInp = document.getElementById('ep-correct-min');
  const corrMin = corrInp ? parseInt(corrInp.value) : NaN;
  // AUDIT 24-08-2026 — het correctieveld zette alleen q.endTime en liet de gebeurtenissen staan waar
  // ze stonden. Gemeten gevolg: blok van 15 min, wissel gelogd op 30', duur gecorrigeerd naar 15 →
  // de uitgewisselde speler kreeg 30 minuten in een blok van 15, en de ingebrachte MIN 15. Het
  // venster "Duur aanpassen" op het verslag deed dit al jaren correct, dus doen we nu hetzelfde:
  // eerst normaal afsluiten (klok + einde-event), daarna de correctie via pasKwartDuurToe, die het
  // einde-event meeschuift, gebeurtenissen ná het nieuwe einde afknipt en de keeperminuten meeneemt.
  q.endTime = Date.now();
  addEvent('quarter_end');
  // Alleen toepassen als de gebruiker de waarde ECHT veranderd heeft. Anders zou elke gewone
  // afsluiting de duur op hele minuten afronden, en kon een gebeurtenis in de laatste seconden
  // daardoor stil naar de slotminuut geknipt worden.
  const gelopenMin = Math.round(kwartDuurMs(q) / 60000);
  if (!isNaN(corrMin) && corrMin > 0 && corrMin !== gelopenMin) {
    const res = pasKwartDuurToe(match, q.num, corrMin * 60000);
    if (res && res.geknipt.length) {
      showToast(`${res.geknipt.length === 1 ? '1 gebeurtenis' : res.geknipt.length + ' gebeurtenissen'} stond na de gecorrigeerde eindtijd en staat nu op de slotminuut.`, 'err');
    }
  }
  match.quarterStatus = 'between';
  // De afgeleide wissels opnieuw uitrekenen tegen het veld zoals het NU staat (audit 25-08-2026).
  // Stond er al een getekende opstelling voor het volgende deel, dan is die de bedoeling; de
  // afgeleide lijst eronder was berekend op het veld van toen. Gemeten: het veld eindigde met Gust
  // en Jef terwijl de doelopstelling Cas en Ilias vroeg, en de lijst beloofde één wissel waar er
  // twee nodig waren — het pauzekaartje onderrapporteerde dus. startQuarter rekent ze óók nog eens
  // na (gordel en bretellen), maar dan heb je het kaartje al gelezen.
  if (Array.isArray(match.nextLineup) && match.nextLineup.length) _pasNextLineupAan(match, match.nextLineup);
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
  // De doelopstelling mee zetten (v0.49.0): het pauzescherm tekent die, en zonder dit zou het veld
  // de plan-opstelling niet tonen terwijl de wissels er wel al klaarstaan. Via _pasNextLineupAan,
  // want een plan kan spelers bevatten die intussen afwezig of uitgesloten zijn — die horen er niet
  // meer in, en die functie is de enige plek waar die regel staat. Ze leidt de wissels ook opnieuw
  // af, dus die kloppen daarna met wat het veld toont.
  _pasNextLineupAan(m, plan.map(e => ({ ...e })));
  const nSubs = (m.pendingSubs || []).length, nSwaps = (m.pendingPosSwaps || []).length;
  if (!nSubs && !nSwaps) return '';
  const telling = [
    nSubs ? `${nSubs} wissel${nSubs === 1 ? '' : 's'}` : '',
    nSwaps ? `${nSwaps} positiewissel${nSwaps === 1 ? '' : 's'}` : '',
  ].filter(Boolean).join(' en ');
  // Past het plan niet op de plaatsen die er nog ZIJN (rode kaart: één minder), dan hoort dat in
  // dezelfde melding: het plan is van vóór die kaart, dus het aantal kan niet meer kloppen. De
  // uitgesloten speler is er hierboven al uit gefilterd, dus dit gaat over de spelers die overblijven.
  const staan = (m.nextLineup || []).length, plaatsen = veldPlaatsenNu(m);
  const mismatch = (staan && staan !== plaatsen)
    ? ` Let op: ${staan} ${staan === 1 ? 'speler' : 'spelers'} voor ${plaatsen} ${plaatsen === 1 ? 'plaats' : 'plaatsen'}.`
    : '';
  return `Opstelling voor ${pSingLow(m)} ${deel} klaargezet: ${telling}.${diff.problemen.length ? ' ' + diff.problemen[0] : ''}${mismatch}`;
}
// ===================== DE DUUR VAN EEN GESPEELD BLOK AANPASSEN =====================
// Je stopte te vroeg (13' i.p.v. 15') of de wedstrijd liep langer dan je afsloot. Er bestond al een
// correctieveld op het MOMENT van afsluiten (zie endPeriod/endMatchModal), maar daarna niet meer.
//
// WAT ER MEE MOET SCHUIVEN, en dat is de hele moeilijkheid. De duur van een blok zit in
// `endTime - startTime - totalPaused`. Maar elke gebeurtenis draagt `gameTimeMs`: de verstreken
// SPEELTIJD sinds de aftrap. gameTimeMsAtStartOfQuarter() telt daarvoor de duur van alle eerdere
// blokken op. Verleng je blok 2 met twee minuten, dan begint blok 3 dus twee minuten later in
// speeltijd — terwijl de gebeurtenissen in blok 3 hun absolute gameTimeMs houden en daardoor twee
// minuten te vroeg in hun blok zouden komen te staan. Vandaar: alles ná dit blok schuift mee.
// De wandkloktijden van latere blokken blijven ongemoeid: elk blok berekent zijn eigen duur, dus
// die zijn onafhankelijk.
function kwartDuurMs(q) {
  return (q && q.startTime && q.endTime) ? Math.max(0, q.endTime - q.startTime - (q.totalPaused || 0)) : 0;
}
// De wijziging toepassen op een (klonen van een) wedstrijd. Eén functie, zodat het voorbeeld dat we
// tonen met exact dezelfde berekening gemaakt wordt als wat er straks bewaard wordt.
function pasKwartDuurToe(m, qNum, nieuweMs) {
  const q = (m.quarters || []).find(x => x.num === qNum);
  if (!q || !q.startTime || !q.endTime) return null;
  const oudeMs = kwartDuurMs(q);
  const delta = nieuweMs - oudeMs;
  if (!delta) return { delta: 0, geknipt: [] };
  const qStart = gameTimeMsAtStartOfQuarter(m, qNum);
  const nieuwEind = qStart + nieuweMs;
  q.endTime = q.startTime + (q.totalPaused || 0) + nieuweMs;
  const geknipt = [];
  for (const e of (m.events || [])) {
    if (e.quarterNum == null) continue;
    if (e.quarterNum > qNum) { e.gameTimeMs = Math.max(0, (e.gameTimeMs || 0) + delta); continue; }
    if (e.quarterNum !== qNum) continue;
    // Het einde-event van dit blok hoort per definitie op de nieuwe eindtijd.
    if (e.type === 'quarter_end') { e.gameTimeMs = nieuwEind; continue; }
    // Inkorten: wat na het nieuwe einde valt, kan daar niet blijven staan. Dat is verlies van
    // informatie (de minuut van dat doelpunt), dus het wordt gemeld vóór het bevestigen.
    if ((e.gameTimeMs || 0) > nieuwEind) {
      geknipt.push({ id: e.id, type: e.type, van: e.gameTimeMs, naar: nieuwEind });
      e.gameTimeMs = nieuwEind;
    }
  }
  // Keeperminuten: sinceMs is ook cumulatieve speeltijd.
  const byQ = m.keeperByQ || {};
  for (const k of Object.keys(byQ)) {
    if (!Array.isArray(byQ[k])) continue;
    const kn = Number(k);
    if (kn > qNum) byQ[k].forEach(x => { x.sinceMs = Math.max(0, (x.sinceMs || 0) + delta); });
    else if (kn === qNum) byQ[k].forEach(x => { if ((x.sinceMs || 0) > nieuwEind) x.sinceMs = nieuwEind; });
  }
  return { delta, geknipt };
}
function modalKwartDuur(qNum) {
  if (!canLive() || !match) return;
  const q = (match.quarters || []).find(x => x.num === qNum);
  if (!q || !q.endTime) {
    showToast(`Dit ${pSingLow(match)} is nog niet afgesloten — de duur kan je aanpassen bij het afsluiten.`, 'err');
    return;
  }
  const huidig = Math.round(kwartDuurMs(q) / 60000);
  openModal(`<h3>${icI(IC.timer)} Duur van ${pSingLow(match)} ${qNum}</h3>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:12px;text-align:left">Dit ${pSingLow(match)} staat nu op <b>${huidig} minuten</b>. Stopte je te vroeg of liep het langer door, zet het dan hier recht — de speelminuten van iedereen die er op stond veranderen mee.</p>
    <div class="fg"><label>Werkelijke duur (minuten)</label>
      <input id="kd-min" type="number" inputmode="numeric" min="1" max="90" value="${huidig}" style="width:100%"></div>
    <button class="btn btn-green" onclick="voorbeeldKwartDuur(${qNum})">${icI(IC.check)} Bekijk wat er verandert</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
  setTimeout(() => document.getElementById('kd-min')?.select(), 60);
}
// Het voorbeeld wordt op een KOPIE berekend met dezelfde functie die straks echt schrijft. Zo kan
// wat je te zien krijgt niet afwijken van wat er gebeurt — de fout die deze hele reeks begon.
function voorbeeldKwartDuur(qNum) {
  const inp = document.getElementById('kd-min');
  const nieuw = inp ? parseInt(inp.value) : NaN;
  if (isNaN(nieuw) || nieuw < 1) { showToast('Geef een aantal minuten in.', 'err'); return; }
  const q = (match.quarters || []).find(x => x.num === qNum);
  const huidig = Math.round(kwartDuurMs(q) / 60000);
  if (nieuw === huidig) { showToast('Dat is de huidige duur.', 'ok'); return; }
  const kopie = jclone(match);
  const res = pasKwartDuurToe(kopie, qNum, nieuw * 60000);
  if (!res) { showToast('Kan dit niet berekenen.', 'err'); return; }
  const voor = calcMinutes(match), na = calcMinutes(kopie);
  const rijen = (match.players || []).map(p => {
    const v = Math.round((voor[p.id]?.ms || 0) / 60000), n = Math.round((na[p.id]?.ms || 0) / 60000);
    return (v === n) ? null : { naam: fieldName(match, p.id), v, n };
  }).filter(Boolean).sort((a, b) => (b.n - b.v) - (a.n - a.v));
  const label = pSingLow(match);
  openModal(`<h3>${icI(IC.warn)} Nakijken</h3>
    <p style="font-size:14px;margin-bottom:10px;text-align:left"><b>${pSing(match)} ${qNum}</b> gaat van <b>${huidig}</b> naar <b>${nieuw} minuten</b>.</p>
    ${rijen.length
      ? `<div style="max-height:34vh;overflow-y:auto;text-align:left;font-size:13px;border:1px solid var(--bdr);border-radius:8px;padding:8px;margin-bottom:10px">
          ${rijen.map(r => `<div style="padding:3px 0;border-bottom:1px solid var(--bdr)">${esc(r.naam)}: <b>${r.v}</b> → <b>${r.n}</b> min</div>`).join('')}
        </div>`
      : `<p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Niemands speelminuten veranderen hierdoor.</p>`}
    ${res.geknipt.length
      ? `<div style="font-size:13px;color:#b45309;background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:8px 10px;margin-bottom:10px;text-align:left">${icI(IC.warn)} <b>${res.geknipt.length} ${res.geknipt.length === 1 ? 'gebeurtenis' : 'gebeurtenissen'}</b> ${res.geknipt.length === 1 ? 'valt' : 'vallen'} na het nieuwe einde en ${res.geknipt.length === 1 ? 'schuift' : 'schuiven'} naar de slotminuut. Hun oorspronkelijke minuut is daarna niet meer te achterhalen.</div>`
      : ''}
    <p style="font-size:12px;color:var(--txt2);margin-bottom:14px;text-align:left">De gebeurtenissen in de ${pPlural(match)} ná dit ${label} schuiven mee, zodat ze op hetzelfde moment van hún ${label} blijven staan.</p>
    <button class="btn btn-org" onclick="doKwartDuur(${qNum},${nieuw})">${icI(IC.check)} Ja, aanpassen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="modalKwartDuur(${qNum})">Terug</button>`);
}
async function doKwartDuur(qNum, nieuweMin) {
  if (!canLive() || !match) return;
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    const res = pasKwartDuurToe(match, qNum, nieuweMin * 60000);
    if (!res) { showToast('Kan dit niet aanpassen.', 'err'); return; }
    recomputeScore(match); recomputeOnField(match);
    await dbSave(match);
    closeModal(); render();
    showToast(`${pSing(match)} ${qNum} staat nu op ${nieuweMin} minuten.`, 'ok');
  } finally { _eventBusy = false; }
}
// Afgesloten wedstrijd heropenen. Dat gebeurt om twee heel verschillende redenen, en die moeten
// uit elkaar: een foutieve afsluiting hervat het LAATSTE deel, een verlenging voegt er een toe.
// Voordien deed heropenen altijd +1, waardoor een per ongeluk afgesloten wedstrijd van één blok
// stil een wedstrijd van twee delen werd — met een "deel 2" in het verslag en in beide PDF's.
function confirmReopenMatch() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const label = pSingLow(match);
  const laatste = match.quarters[match.quarters.length - 1];
  const hervatbaar = !!(laatste && laatste.startTime && laatste.endTime);
  // Nooit gestart en toch afgesloten (mis-tik op "Afsluiten"): er is geen deel om te hervatten,
  // dus dan is de juiste herstelactie ze terugzetten naar "gepland".
  if (!match.quarters.length) {
    // TWEE HEEL VERSCHILLENDE GEVALLEN LANDEN HIER (audit 25-08-2026), want beide hebben nul delen:
    // een mistik op "Afsluiten", én een wedstrijd waarvan je de uitslag SNEL invoerde. Bij die
    // tweede stond hier "afgesloten zonder ooit gestart te zijn" — feitelijk onjuist voor een 3-1
    // die je zelf ingaf — en bleven de doelpunten staan, dus begon de volgende echte poging op 3-1.
    // De snelinvoer-doelpunten dragen `quick: true`, dus ze zijn precies te herkennen.
    const snel = (match.events || []).filter(e => e.quick);
    openModal(`<h3>Wedstrijd heropenen?</h3>
      ${snel.length
        ? `<p style="text-align:center;color:var(--txt2);margin-bottom:16px">Je vulde voor deze wedstrijd enkel de <b>uitslag</b> in (${esc(scoreTxt(match))}). We zetten ze terug op <b>gepland</b>, zodat je ze echt kan spelen en bijhouden.</p>
           <p style="text-align:center;color:var(--rd);font-size:13px;margin-bottom:16px">${snel.length === 1 ? 'Het doelpunt dat' : 'De ' + snel.length + ' doelpunten die'} bij die uitslag ${snel.length === 1 ? 'hoort' : 'horen'}, ${snel.length === 1 ? 'verdwijnt' : 'verdwijnen'} — anders begint de wedstrijd straks op ${esc(scoreTxt(match))}. Je selectie en je opstelling blijven staan.</p>`
        : `<p style="text-align:center;color:var(--txt2);margin-bottom:16px">Deze wedstrijd is afgesloten zonder ooit gestart te zijn. We zetten ze terug op <b>gepland</b>, zodat ze uit de uitslagen verdwijnt en je ze gewoon kan starten.</p>`}
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
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  if (match.quarters.length) { closeModal(); return; }
  // De snel ingevoerde doelpunten mee opruimen (audit 25-08-2026): zonder dit begon de volgende
  // echte poging op de oude stand, want recomputeScore telt elk goal-event ongeacht zijn deel.
  // Mét tombstone, anders brengt de synchronisatie met een medebeheerder ze terug.
  const snel = (match.events || []).filter(e => e.quick);
  if (snel.length) {
    snel.forEach(e => tombstoneEvent(match, e.id));
    match.events = (match.events || []).filter(e => !e.quick);
  }
  match.status = 'planned'; match.quarterStatus = 'not_started'; match.currentQuarter = 0;
  recomputeScore(match); recomputeOnField(match);
  closeModal();
  await dbSave(match);
  go('prep', match.id);
}
// Foutieve afsluiting ongedaan maken: het laatste deel loopt weer, zonder extra deel. Bereikbaar
// langs twee kanten: bij een afgesloten wedstrijd via "Wedstrijd heropenen", en sinds 23-08-2026
// ook mídden in de wedstrijd, vanuit de pauze (zie hervatBaarDeel) — dat is waar de mistik gebeurt.
// De guard kijkt daarom niet meer naar de status van de wedstrijd maar naar het deel zelf: loopt
// het al (geen endTime), dan valt er niets te hervatten en is dit een dubbeltik.
async function doResumeLastPeriod() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
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
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
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
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
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
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const label = pSingLow(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const overtimeMin = durMs ? Math.round((getQElapsed(match) - durMs) / 60000) : 0;
  // Loopt de klok meer dan dubbel de voorziene duur, dan is ze duidelijk vergeten en is de
  // verstreken tijd geen bruikbaar voorstel meer: dan de NOMINALE duur voorinvullen. Voordien stond
  // de foute waarde vóóringevuld (bv. 140 min voor een blok van 20) en moest je de juiste zelf
  // typen — wie gewoon bevestigde, zette die 140 minuten definitief vast.
  const vergeten = !!durMs && getQElapsed(match) > durMs * 2;
  const prefill = vergeten ? (match.quarterDuration || 1) : Math.round(getQElapsed(match) / 60000);
  // Zelfde rechtzetting als in endPeriod (audit 24-08-2026): het duurveld staat er altijd, de luide
  // waarschuwing enkel bij een echte overschrijding. Loopt het laatste deel al, dan hoort de duur
  // van dát deel hier recht te kunnen — ook bij een kleine afwijking.
  const laatste = match.quarters[match.quarters.length - 1];
  const nogBezig = !!laatste && !laatste.endTime;
  // De waarschuwing hangt aan `nogBezig` (audit 25-08-2026). Sloot je het laatste deel eerst netjes af
  // op 25 min (blok van 15) en tik je daarna in de pauze op "Wedstrijd afsluiten", dan las het venster
  // "dit kwart LOOPT al 10 min langer dan gepland — corrigeer hieronder", terwijl er niets te
  // corrigeren viel: het duurveld staat er enkel zolang het deel loopt, en het blok was al gesloten.
  // Voor dat geval staat er nu een rustige regel die naar de juiste weg wijst (het pennetje bij de
  // blokduur op het verslag).
  const warn = (nogBezig && durMs && overtimeMin > overtimeNudgeMin(match)) ? `<div class="nudge" style="margin-bottom:12px">${icI(IC.warn)} Dit ${label} loopt al ${overtimeMin} min langer dan gepland (${match.quarterDuration} min voorzien). Ben je vergeten af te sluiten? Corrigeer hieronder de werkelijke duur.${vergeten ? ` <b>De klok liep veel langer dan verwacht, dus we stellen de voorziene ${match.quarterDuration} min voor</b> — pas aan als het anders was.` : ''}</div>` : '';
  const duurTip = (!nogBezig && durMs && overtimeMin > overtimeNudgeMin(match))
    ? `<p style="font-size:12px;color:var(--txt2);text-align:left;margin-bottom:12px">${icI(IC.warn)} Dit ${label} staat afgesloten op ${Math.round(getQElapsed(match) / 60000)} min terwijl er ${match.quarterDuration} min voorzien was. Dat rechtzetten kan achteraf op het verslag, met het pennetje naast de duur van dat ${label}.</p>`
    : '';
  const duurVeld = nogBezig ? `<div class="fg" style="margin-bottom:12px"><label style="font-size:12px;color:var(--txt2)">Werkelijke duur van dit ${label} (minuten)</label><input id="em-correct-min" type="number" inputmode="numeric" value="${prefill}" min="1"></div>` : '';
  openModal(`<h3>Wedstrijd afsluiten?</h3>
    ${warn}
    ${duurTip}
    ${duurVeld}
    <div class="fg"><label>Notities (optioneel)</label>
      <textarea id="end-notes" rows="4" placeholder="Aanvullingen over de wedstrijd, bv. weer, blessures, opmerkingen...">${esc(match.notes||'')}</textarea></div>
    <button class="btn btn-red" onclick="confirmEndMatch()">${icI(IC.finish)} Afsluiten &amp; opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function confirmEndMatch() {
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const t = document.getElementById('end-notes');
  if (t) match.notes = t.value;
  const corrInp = document.getElementById('em-correct-min');
  const corrMin = corrInp ? parseInt(corrInp.value) : NaN;
  closeModal(); await forceEndMatch(!isNaN(corrMin) && corrMin > 0 ? corrMin : null);
  // Gelijkspel? Dan kan er een strafschoppenreeks gevolgd zijn. Pas NA het afsluiten vragen: de
  // eindstand ligt dan vast, en wie geen reeks had, is met één tik klaar.
  if (match.scoreUs === match.scoreThem && !heeftShootout(match)) vraagShootout();
}
// ===================== STRAFSCHOPPENREEKS =====================
// De wedstrijdscore blijft ongemoeid (zie de uitleg bij shootoutSchoten in core.js): de reeks staat
// ernaast en bepaalt enkel wie wint. Eén scherm dat zichzelf opnieuw tekent na elke strafschop.
function vraagShootout() {
  openModal(`<h3>${icI(IC.penalty)} Strafschoppen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Het staat <b>${esc(scoreTxt(match))}</b>. Volgde er een strafschoppenreeks?</p>
    <button class="btn btn-green" onclick="startShootout()">${icI(IC.penalty)} Ja, strafschoppen ingeven</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal();render()">Nee, het blijft gelijk</button>`);
}
// Wie begint? In de reeks wisselen de ploegen elkaar af, dus dit bepaalt de hele volgorde.
function startShootout() {
  openModal(`<h3>${icI(IC.penalty)} Wie begint?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De ploegen nemen om beurten een strafschop.</p>
    <button class="btn btn-green" onclick="zetShootoutStart('us')">${esc(tName(match))} begint</button>
    <button class="btn btn-pale" style="margin-top:8px" onclick="zetShootoutStart('them')">${esc(match.opponent || 'De tegenstander')} begint</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal();render()">Annuleren</button>`);
}
async function zetShootoutStart(eerste) {
  if (_eventBusy) return; _eventBusy = true;
  try {
    match.shootout = { eerste: eerste === 'them' ? 'them' : 'us', schoten: [] };
    await dbSave(match);
    modalShootout();
  } finally { _eventBusy = false; }
}
// Wie is er nu aan de beurt? De reeks wisselt strikt af vanaf `eerste`.
function shootoutAanZet(m) {
  const s = m.shootout; if (!s) return 'us';
  const n = shootoutSchoten(m).length;
  const start = s.eerste === 'them' ? 'them' : 'us';
  return (n % 2 === 0) ? start : (start === 'us' ? 'them' : 'us');
}
// Het rijtje bollen per ploeg, zoals op televisie: groen = raak, rood = gemist.
function shootoutRijHtml(m, ploeg) {
  const schoten = shootoutSchoten(m).filter(s => s.ploeg === ploeg);
  const naam = ploeg === 'us' ? tName(m) : (m.opponent || 'Tegenstander');
  const raak = schoten.filter(s => s.raak).length;
  const bollen = schoten.map(s => {
    const titel = s.playerId ? esc(fieldName(m, s.playerId)) : '';
    return `<span class="pen-bol ${s.raak ? 'raak' : 'mis'}" title="${titel}"></span>`;
  }).join('') || '<span style="color:var(--txt2);font-size:13px">—</span>';
  return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0">
    <div style="flex:1;font-weight:700;font-size:14px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(naam)}</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${bollen}</div>
    <div style="font-weight:900;font-size:18px;min-width:22px;text-align:right;font-variant-numeric:tabular-nums">${raak}</div>
  </div>`;
}
// De reeks zoals ze in het verslag staat: per ploeg een rij bollen, en daaronder wie er nam. Ook
// gebruikt door het scherm zelf (shootoutRijHtml) — één weergave, geen tweede die kan afwijken.
function penaltyReeksHtml(m) {
  const nemers = shootoutSchoten(m).filter(s => s.ploeg === 'us' && s.playerId)
    .map((s, i) => `<span style="white-space:nowrap"><span class="pen-bol ${s.raak ? 'raak' : 'mis'}" style="width:10px;height:10px;vertical-align:middle;margin-right:4px"></span>${esc(fieldName(m, s.playerId))}</span>`)
    .join('<span style="color:var(--bdr);margin:0 6px">·</span>');
  return `${shootoutRijHtml(m, isAway(m) ? 'them' : 'us')}${shootoutRijHtml(m, isAway(m) ? 'us' : 'them')}
    ${nemers ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--bdr);font-size:13px;line-height:1.9">${nemers}</div>` : ''}`;
}
let shootoutSchutterId = null;
function selectShootoutSchutter(id, el) { shootoutSchutterId = id; gpSelIn('so-spelers', el); }
function modalShootout() {
  const m = match;
  if (!m.shootout) return;
  const aanZet = shootoutAanZet(m);
  const eigen = aanZet === 'us';
  const nr = shootoutSchoten(m).filter(s => s.ploeg === aanZet).length + 1;
  const st = shootoutStand(m);
  // Wie mag er nemen? Iedereen uit de selectie die niet afwezig of uitgesloten is — na de wedstrijd
  // telt "wie stond er op het veld" niet meer, iedereen mag aan de stip komen.
  // Wie de wedstrijd verlaten heeft, staat niet meer aan de stip.
  const kiesbaar = eigen ? (m.players || []).filter(p => magNogMeedoen(m, p)) : [];
  const gekozen = shootoutSchutterId && kiesbaar.some(p => p.id === shootoutSchutterId) ? shootoutSchutterId : null;
  if (!gekozen) shootoutSchutterId = null;
  // Wie al genomen heeft, krijgt een merkje: bij een jeugdreeks wil je iedereen een beurt geven.
  const alGenomen = new Set(shootoutSchoten(m).filter(s => s.ploeg === 'us' && s.playerId).map(s => s.playerId));
  const merk = p => alGenomen.has(p.id) ? `<span style="font-size:9px;color:var(--txt2)">nam al</span>` : '';
  openModal(`<h3>${icI(IC.penalty)} Strafschoppen</h3>
    <div class="card" style="padding:10px 14px;margin-bottom:12px">
      ${shootoutRijHtml(m, isAway(m) ? 'them' : 'us')}
      ${shootoutRijHtml(m, isAway(m) ? 'us' : 'them')}
    </div>
    <div class="sec" style="margin-top:0">${esc(eigen ? tName(m) : (m.opponent || 'Tegenstander'))} · strafschop ${nr}</div>
    ${eigen
      ? `<p style="font-size:13px;color:var(--txt2);margin:-4px 0 8px">Kies wie neemt${kiesbaar.length ? '' : ' — niemand beschikbaar'}.</p>
         <div id="so-spelers">${pgGrid(kiesbaar.map(p => pgBtn(p, 'so-pb', `selectShootoutSchutter('${p.id}',this)`, merk(p))).join(''))}</div>`
      : `<p style="font-size:13px;color:var(--txt2);margin:-4px 0 8px">Scoorde de tegenstander?</p>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
      <button class="btn btn-green" onclick="logShootout(true)">${icI(IC.goal)} Raak</button>
      <button class="btn btn-red" onclick="logShootout(false)">${icI(IC.close)} Gemist</button>
    </div>
    ${shootoutSchoten(m).length ? `<button class="btn btn-pale btn-sm" style="margin-top:10px" onclick="undoShootout()">${icI(IC.undo)} Laatste strafschop wissen</button>` : ''}
    <button class="btn btn-orgpale" style="margin-top:10px" onclick="stopShootout()">${icI(IC.check)} Reeks afsluiten${st.us !== st.them ? ` (${shootoutTxt(m)})` : ''}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal();render()">Later verder</button>`);
}
async function logShootout(raak) {
  if (_eventBusy) return; _eventBusy = true;
  try {
    const aanZet = shootoutAanZet(match);
    if (aanZet === 'us' && !shootoutSchutterId) { showToast('Kies wie de strafschop neemt.', 'err'); return; }
    match.shootout.schoten = shootoutSchoten(match).concat([{
      ploeg: aanZet, raak: !!raak, playerId: aanZet === 'us' ? shootoutSchutterId : null,
    }]);
    shootoutSchutterId = null;
    await dbSave(match);
    modalShootout();
  } finally { _eventBusy = false; }
}
async function undoShootout() {
  if (_eventBusy) return; _eventBusy = true;
  try {
    const s = shootoutSchoten(match).slice(0, -1);
    match.shootout.schoten = s;
    await dbSave(match);
    modalShootout();
  } finally { _eventBusy = false; }
}
// De reeks is afgelopen wanneer JIJ dat zegt — de app rekent geen "best of five" uit, want bij de
// jeugd neemt vaak iedereen een strafschop en gelden er lokale afspraken.
async function stopShootout() {
  if (_eventBusy) return; _eventBusy = true;
  try {
    if (!heeftShootout(match)) { delete match.shootout; }
    await dbSave(match);
    closeModal(); render();
    const w = shootoutWinnaar(match);
    if (w) showToast(shootoutZin(match), 'ok');
    else if (heeftShootout(match)) showToast('De reeks staat gelijk — vul aan of wis ze in het verslag.', 'err');
  } finally { _eventBusy = false; }
}
// Ingang achteraf, vanuit het verslag: reeks alsnog ingeven of corrigeren.
function shootoutVanuitVerslag() {
  if (!canLive()) return;
  if (match.shootout) modalShootout(); else startShootout();
}
// De hele reeks weghalen (bv. verkeerd ingegeven).
function confirmWisShootout() {
  openModal(`<h3>${icI(IC.trash)} Strafschoppen wissen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">De reeks verdwijnt. De uitslag <b>${esc(scoreTxt(match))}</b> blijft zoals ze is.</p>
    <button class="btn btn-red" onclick="doWisShootout()">${icI(IC.trash)} Wissen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doWisShootout() {
  if (_eventBusy) return; _eventBusy = true;
  try { delete match.shootout; await dbSave(match); closeModal(); render(); }
  finally { _eventBusy = false; }
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
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
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
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
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
    // Verwees tot 24-08-2026 naar "Positiewissel" als knop. Zo'n knop staat niet op dit scherm: je
    // herplaatst iemand door hem op het tabblad Opstelling aan te tikken en dan zijn nieuwe plek.
    // De oude tekst stuurde je dus zoeken naar iets wat er niet staat.
    showToast('Formatie gewijzigd (enkel het label). Er zijn al wissels gebeurd — verplaats iemand door hem op het tabblad Opstelling aan te tikken en dan zijn nieuwe plek.', 'ok');
  } else if (slots) {
    openModal(`<h3>Spelersposities aanpassen?</h3>
      <p style="color:var(--txt2);font-size:14px;text-align:center;margin-bottom:16px">Wil je de posities van de spelers ook herplaatsen volgens de nieuwe formatie <b>${esc(match.formation)}</b>?</p>
      <button class="btn btn-green" onclick="applyFormationPositions()">${icI(IC.check)} Ja, posities herplaatsen</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal();render()">Nee, alleen label wijzigen</button>`);
  } else {
    closeModal(); render();
  }
}
// LET OP: hier stond tot 24-08-2026 een tweede, dode definitie van applyFormationPositions die
// gewoon modalEditPositions() opende. Ze bleef staan bij het herbouwen van het herplaatsvenster in
// v1.1.14. Omdat de échte versie (verderop, op de aanbevolen plekken van de formatie) later in
// hetzelfde bestand staat, won die altijd — de knop werkte dus correct, maar wie de dode versie
// "herstelde" of verplaatste, veranderde stil het gedrag van "Ja, posities herplaatsen".

// ===================== DE STARTOPSTELLING HERPLAATSEN =====================
// HERBOUWD OP HET POSITIEROOSTER (audit 23-08-2026). Dit venster kwam uit het oude model, waarin een
// FORMATIE de plaatsen vastlegde: het tekende de acht slots van de formatie en zocht wie daar stond
// via een exacte coördinatenvergelijking. Sinds v0.34.0 staan spelers op roosterplekken, en die vallen
// in geen enkele formatie samen met formatiecoördinaten — dus opende het venster met NIEMAND
// geplaatst. En omdat het opslaan eerst alle posities wist en daarna enkel de toewijzingen terugzet,
// veegde één tik op Opslaan de volledige startopstelling van een gespeelde wedstrijd weg, inclusief
// het vastgelegde m.startLineup. Gemeten: 8 spelers met een plek → 0, startLineup 8 → 0.
//
// Nu: hetzelfde tikbare veld en dezelfde 26 plekken als de planner en het livescherm (renderPitch met
// een tik-handler). Twee ingangen, elk met een eigen betekenis:
//   1. "Startopstelling herplaatsen" op het verslag → opent met IEDEREEN op zijn huidige plek. Je
//      versleept er één en klaar. Dat is waarvoor de knop bestaat: een gespeelde wedstrijd rechtzetten
//      zodat het verslag en de PDF het juiste veld tonen.
//   2. Na een formatiewijziging → de spelers op de AANBEVOLEN plekken van die formatie zetten. Dat is
//      precies de verzameling die de wizard oplicht (formatieVoorstel), dus dezelfde belofte als daar.
//      Wie niet in zijn eigen lijn past (2-3-2 heeft twee verdedigers, 3-3-1 drie), komt op de
//      dichtstbijzijnde vrije aanbevolen plek. Dat verandert zijn lijn, maar zichtbaar: hij staat er,
//      en je kan hem verzetten (Tims keuze 23-08-2026 — het bezwaar bij punt 3 was juist dat een lijn
//      daar stil werd overschreven in een keuzelijst, zonder veld).
// En: OPSLAAN WEIGERT zolang niet iedereen staat. Dit venster kan dus nooit meer een opstelling wissen.
let _ep = null;   // { plaats: {playerId: code|null}, sel: {kind:'field'|'bench', id} | null }
function _epStarters() { return (match.players || []).filter(p => p.starting); }
// Mag de startopstelling nog herplaatst worden? Zodra er wissels of positiewissels gelogd zijn, hangt
// de reconstructie van de latere kwarten aan de oorspronkelijke posities (zie de snapshots in de
// events en playersAtPeriodStart) — dan blokkeren we, met de weg die dan wél klopt.
function _epMag() {
  if ((match.events || []).some(e => e.type === 'substitution' || e.type === 'posSwap')) {
    closeModal();
    // Zelfde rechtzetting als hierboven: niet naar een knopnaam verwijzen die niet bestaat, maar naar
    // de weg die er wél is (tik de speler aan op het tabblad Opstelling, dan zijn nieuwe plek).
    showToast('Er zijn al wissels of positiewissels gebeurd, dus de startopstelling kan hier niet meer herplaatst worden. Verplaats iemand via het tabblad Opstelling: tik de speler aan en dan zijn nieuwe plek.', 'err');
    return false;
  }
  return true;
}
// INGANG 1: iedereen op zijn huidige plek.
function modalEditPositions() {
  if (!canLive() || !match) return;
  if (!_epMag()) return;
  const plaats = {};
  const gezien = new Set();
  _epStarters().forEach(p => {
    const code = spelerGridCode(p);
    // Botsen twee spelers op dezelfde plek (oude data), dan houdt de eerste ze en moet de tweede
    // opnieuw geplaatst worden — zichtbaar in "Nog te plaatsen" i.p.v. stil boven op elkaar.
    plaats[p.id] = (code && gridPlek(code) && !gezien.has(code)) ? (gezien.add(code), code) : null;
  });
  _ep = { plaats, sel: null };
  _renderEpModal();
}
// INGANG 2: op de aanbevolen plekken van de (nieuwe) formatie.
function applyFormationPositions() {
  if (!canLive() || !match) return;
  if (!_epMag()) return;
  const forms = FORMATIONS[match.matchType] || [];
  const form = forms.find(f => f.name === match.formation) || forms[0];
  const voorstel = [...(typeof formatieVoorstel === 'function' ? formatieVoorstel(form, match.matchType) : new Set())]
    .map(c => gridPlek(c)).filter(Boolean);
  const vrij = new Set(voorstel.map(p => p.code));
  const plaats = {};
  const starters = _epStarters();
  const afstand = (p, plek) => {
    const eigen = gridPlek(spelerGridCode(p));
    if (!eigen) return 0;
    return Math.abs(eigen.x - plek.x) + Math.abs(eigen.y - plek.y);
  };
  // Eerst iedereen in zijn EIGEN lijn, dichtstbij zijn huidige plek: zo blijft een verdediger
  // verdediger zolang die formatie daar plaats voor heeft.
  const nogTeDoen = [];
  starters.forEach(p => {
    const eigen = gridPlek(spelerGridCode(p));
    const lijn = (eigen && eigen.line) || p.line;
    const kand = voorstel.filter(pl => vrij.has(pl.code) && pl.line === lijn)
      .sort((a, b) => afstand(p, a) - afstand(p, b));
    if (kand.length) { plaats[p.id] = kand[0].code; vrij.delete(kand[0].code); }
    else nogTeDoen.push(p);
  });
  // Wie niet in zijn lijn paste: de dichtstbijzijnde vrije aanbevolen plek.
  nogTeDoen.forEach(p => {
    const kand = voorstel.filter(pl => vrij.has(pl.code)).sort((a, b) => afstand(p, a) - afstand(p, b));
    if (kand.length) { plaats[p.id] = kand[0].code; vrij.delete(kand[0].code); }
    else plaats[p.id] = null;   // meer starters dan de formatie plaatsen heeft: zelf plaatsen
  });
  _ep = { plaats, sel: null };
  _renderEpModal();
}
// Tikken, met dezelfde regels als in de planner: speler + lege plek = verhuizen, speler + speler =
// van plaats wisselen, tweemaal dezelfde speler = selectie weg.
function _epTap(kind, id) {
  if (!_ep) return;
  const sel = _ep.sel;
  if (kind !== 'plek' && sel && sel.id === id) { _ep.sel = null; _renderEpModal(); return; }
  if (kind === 'plek') {
    if (!sel) return;                                  // geen speler in de hand: niets te verhuizen
    const bewoner = Object.keys(_ep.plaats).find(pid => _ep.plaats[pid] === id);
    const oude = _ep.plaats[sel.id] || null;
    _ep.plaats[sel.id] = id;
    // Bezette plek: ze ruilen. Kwam de verhuizer nergens vandaan, dan moet de bewoner opnieuw
    // geplaatst worden — hij komt in "Nog te plaatsen" te staan, niet stil onder de ander.
    if (bewoner && bewoner !== sel.id) _ep.plaats[bewoner] = oude;
    _ep.sel = null; _renderEpModal(); return;
  }
  if (!sel) { _ep.sel = { kind, id }; _renderEpModal(); return; }
  // Twee spelers: van plaats wisselen.
  const a = sel.id, b = id;
  const pa = _ep.plaats[a] || null, pb = _ep.plaats[b] || null;
  _ep.plaats[a] = pb; _ep.plaats[b] = pa;
  _ep.sel = null; _renderEpModal();
}
function _epVeldSpelers() {
  return _epStarters().filter(p => _ep.plaats[p.id]).map(p => {
    const plek = gridPlek(_ep.plaats[p.id]);
    return Object.assign({}, p, { x: plek.x, y: plek.y, line: plek.line,
      posNum: matchGridNummer(match, plek.code) || '', posCodeVeld: plek.code });
  });
}
function _renderEpModal() {
  if (!_ep) return;
  const veld = _epVeldSpelers();
  const nogTeDoen = _epStarters().filter(p => !_ep.plaats[p.id]);
  const selId = _ep.sel ? _ep.sel.id : null;
  const chips = nogTeDoen.length
    ? nogTeDoen.map(p => `<span class="place-chip ${selId === p.id ? 'sel' : ''}" onclick="_epTap('bench','${p.id}')">${numSpan(p, 'pcn')}${esc(fieldName(match, p.id))}</span>`).join('')
    : `<span style="color:var(--grn);font-weight:700;font-size:14px">${icI(IC.check)} Iedereen staat op het veld</span>`;
  document.getElementById('modal').innerHTML = `<div class="modal-ov"><div class="modal">
    <h3>${icI(IC.shirt)} Startopstelling herplaatsen</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">Zo stonden ze bij de aftrap. Tik een speler en dan een andere plek om hem te verzetten, of twee spelers om ze van plaats te wisselen.</p>
    <div class="card" style="padding:8px">${renderPitch(match, veld, match.captainId, null, { fn: '_epTap', selId, plek: true })}</div>
    <div class="sec" style="margin-top:8px">Nog te plaatsen (${nogTeDoen.length})</div>
    <div class="place-chips">${chips}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="_saveEpPositions()">${icI(IC.check)} Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="_ep=null;closeModal();render()">Annuleren</button>
  </div></div>`;
  document.getElementById('modal').classList.remove('hidden');
}
async function _saveEpPositions() {
  if (!_ep || !canLive()) return;
  const nogTeDoen = _epStarters().filter(p => !_ep.plaats[p.id]);
  // WEIGEREN bij een onvolledige opstelling. Dit is het slot dat er niet was: opslaan wiste eerst
  // alle posities, dus een half gevuld veld liet spelers zonder plaats achter.
  if (nogTeDoen.length) {
    showToast(`${nogTeDoen.length === 1 ? 'Er staat nog iemand' : 'Er staan nog ' + nogTeDoen.length + ' spelers'} naast het veld — zet ${nogTeDoen.length === 1 ? 'hem' : 'ze'} eerst op een plek.`, 'err');
    return;
  }
  _epStarters().forEach(p => {
    const plek = gridPlek(_ep.plaats[p.id]);
    if (plek) zetOpGridPlek(p, plek, match);
  });
  // De vastgelegde startopstelling volgt mee: dit venster herplaatst per definitie de aftrap (het
  // weigert zodra er wissels zijn), dus het bewaarde feit is nu dit.
  if (Array.isArray(match.startLineup)) {
    match.startLineup = match.players
      .filter(p => p.starting && typeof p.x === 'number')
      .map(p => ({ id: p.id, x: p.x, y: p.y, line: p.line, posNum: p.posNum, posCodeVeld: spelerGridCode(p) || null }));
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
  // Strafschoppenreeks onder de uitslag, met wie er won — zonder de score zelf aan te passen.
  if (toonShootout(m)) {   // enkel bij een gelijke stand — zie toonShootout in core.js
    const so = shootoutStand(m);
    lines.push(`🥅 Strafschoppen: ${home ? so.us : so.them}–${home ? so.them : so.us}`);
    const zin = shootoutZin(m); if (zin) lines.push(`🏆 ${zin}`);
  }
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
  // canLive() i.p.v. isAdmin: in "Kijken"-modus zie je de notities zelf niet op het scherm, dus dan
  // horen ze ook niet in een bericht dat je doorstuurt. Stond tot 24-08-2026 op canManage, en die is
  // offline false — een beheerder zonder verbinding stuurde dus stil een verslag zonder notities.
  if (canLive() && m.notes) lines.push('', m.notes);
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
  if (!canLive() || !match) return;   // audit 25-08-2026: ruwe export enkel voor wie beheert
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
  // Tweede slot naast de verborgen knop (audit 25-08-2026): dit bestand bevat de wedstrijd
  // ongefilterd, dus ook de notities. Wie het scherm alleen mag lezen, hoort het niet te krijgen.
  if (!canLive() || !match) return;
  const data = { app: 'voetbal-match', version: 1, exportedAt: Date.now(), match };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safe = `${tName(match)}-${match.opponent}-${match.date || ''}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.download = `match-${safe}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportMatchCSV() {
  if (!canLive() || !match) return;   // audit 25-08-2026: ruwe export enkel voor wie beheert
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
    substitution: 'Wissel', posSwap: 'Positiewisseling', posSwapReeks: 'Positiewisselingen',
    injury: 'Blessure', penalty_us: 'Penalty voor', penalty_them: 'Penalty tegen',
    freekick_us: 'Vrije trap voor', freekick_them: 'Vrije trap tegen',
    corner_us: 'Hoekschop voor', corner_them: 'Hoekschop tegen',
    motm: 'Man v/d match', note: 'Notitie'
  };
  row('EVENTS', 'Periode', 'Minuut', 'Speeltijd (ms)', 'Type', 'Speler', 'Extra info');
  // Positiewisselingen op hetzelfde moment als één rij — zie groepeerPosSwaps in views-account.js.
  for (const e of groepeerPosSwaps([...(m.events || [])].sort((a, b) => (a.gameTimeMs || 0) - (b.gameTimeMs || 0)))) {
    const type = typeLabels[e.type] || e.type;
    const { min, extra } = eventMinGlobal(e, m);
    const minStr = min != null ? min + (extra ? '+' + extra : '') + "'" : '';
    let player = '';
    let extraInfo = '';
    if (e.type === 'substitution') {
      player = pName(m, e.playerInId);
      extraInfo = 'Uit: ' + pName(m, e.playerOutId) + (e.atBreak ? ' (pauzewissel)' : '');
    } else if (e.type === 'posSwap') {
      // CSV-export: ook hier de bewegingen, niet de ruil — zie posSwapBeweging.
      player = posSwapBeweging(m, e, '->');
      extraInfo = e.atBreak ? 'Pauze-positiewissel' : '';
    } else if (e.type === 'posSwapReeks') {
      player = posSwapReeksTekst(m, e.events, '->');
      extraInfo = e.atBreak ? 'Pauze-positiewissels' : '';
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
  if (!canLive() || !match) return;   // audit 24-08-2026: gordel EN bretellen
  const q = match.quarters[match.quarters.length - 1];
  if (q && !q.endTime) {
    if (q.pausedAt) { q.totalPaused=(q.totalPaused||0)+(Date.now()-q.pausedAt); q.pausedAt=null; }
    q.endTime = Date.now();
  }
  // Zelfde rechtzetting als in doEndPeriod (audit 24-08-2026): de correctie loopt via
  // pasKwartDuurToe, zodat het einde-event meeschuift en gebeurtenissen ná de nieuwe eindtijd niet
  // buiten hun blok blijven hangen (dat gaf speelminuten hoger dan de wedstrijdduur, en negatieve).
  // Enkel als de waarde echt afwijkt van de gelopen duur — zie doEndPeriod.
  if (q && correctMin && correctMin !== Math.round(kwartDuurMs(q) / 60000)) {
    const res = pasKwartDuurToe(match, q.num, correctMin * 60000);
    if (res && res.geknipt.length) {
      showToast(`${res.geknipt.length === 1 ? '1 gebeurtenis' : res.geknipt.length + ' gebeurtenissen'} stond na de gecorrigeerde eindtijd en staat nu op de slotminuut.`, 'err');
    }
  }
  match.status = 'done'; match.quarterStatus = 'done';
  stopTimer(); releaseWake(); await dbSave(match); render();
}
let _postEventQuarter = null; // null = gebruik match.currentQuarter (live), anders: kwart-override (detail)
let _postEventMinute = null;  // null = einde van het deel, anders: minuut binnen het deel (1-based)
// true = het gebeurde IN DE PAUZE vóór _postEventQuarter. Dat is geen minuut binnen een deel, dus
// het krijgt de speeltijd van de START van dat deel — en die is in speeltijd hetzelfde moment als
// het einde van het vorige deel, want tijdens een pauze loopt de klok niet. Zo stopt de teller van
// een speler die in de rust vertrekt exact op het einde van het deel dat hij nog meespeelde.
// Zelfde conventie als de pauzewissels (atBreak), zodat de reconstructie en het verslag het zonder
// uitzonderingen lezen.
let _postEventAtBreak = false;
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
  // In de pauze vóór dit deel: de speeltijd van de start van het deel, en het event draagt atBreak.
  // atBreak staat vóór ...extra, zodat een aanroeper die het zelf meegeeft (startQuarter) wint.
  if (_postEventAtBreak && _postEventQuarter) {
    match.events.push({ id: uid(), realTime: Date.now(), gameTimeMs: gameTimeMsAtStartOfQuarter(match, _postEventQuarter),
      quarterNum: _postEventQuarter, atBreak: true, type, ...extra });
    return;
  }
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
// Een reeks positiewisselingen die als één regel getoond wordt (zie groepeerPosSwaps): die hoort
// ook als geheel te verdwijnen. Eén schakel eruit halen laat een herschikking achter die niemand
// zo bedoeld heeft.
function confirmDeleteEvents(ids) {
  const evs = (ids || []).map(id => match.events.find(x => x.id === id)).filter(Boolean);
  if (!evs.length) return;
  if (evs.length === 1) return confirmDeleteEvent(evs[0].id);
  openModal(`<h3>${evs.length} positiewisselingen verwijderen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">"${posSwapReeksTekst(match, evs, '→')}"<br>Ze horen bij elkaar en gaan samen weg. De opstelling wordt herberekend.</p>
    <button class="btn btn-red" onclick="doDeleteEvents(['${evs.map(e => e.id).join("','")}'])">${icI(IC.trash)} Verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doDeleteEvents(ids) {
  // Nieuwste eerst: revertPosSwapPositions draait één wissel terug op de HUIDIGE stand, dus de
  // volgorde moet omgekeerd chronologisch zijn — anders herstel je een tussenstand.
  const geordend = (ids || []).slice().reverse();
  for (const id of geordend) await doDeleteEvent(id);
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
  if (!e || e.type !== 'posSwap' || !e.pA) return;
  // Verhuizing naar een lege plek (geen pB): enkel die ene speler terugzetten op waar hij stond.
  if (!e.pB) {
    if (!e.posA) return;
    const p = m.players.find(x => x.id === e.pA);
    if (p) { p.x = e.posA.x; p.y = e.posA.y; p.line = e.posA.line; p.posNum = e.posA.posNum; p.posCodeVeld = e.posA.posCodeVeld; }
    return;
  }
  if (!e.posA || !e.posB) return;
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
  // De bewaarde startopstelling (v0.54.0) wint altijd van de meegegeven baseline. Aanroepers geven
  // playersAtPeriodStart(m, 1) mee, en die bevat de pauzewijzigingen van blok 1 al toegepast —
  // hieronder worden die events opnieuw afgespeeld, dus met die baseline telden ze dubbel. De
  // bewaarde startopstelling is per definitie de toestand van vóór elk event.
  if (Array.isArray(m.startLineup) && m.startLineup.length) baseline = m.startLineup;
  const pos = {}, onF = {};
  m.players.forEach(p => { onF[p.id] = false; });
  (baseline || []).forEach(b => { onF[b.id] = true; pos[b.id] = { x: b.x, y: b.y, line: b.line, posNum: b.posNum }; });
  // AFWEZIG GEMARKEERD IS GEEN TIJDSTIP. `p.absent` is een vlag zonder moment: je zet ze bv. in het
  // derde blok, terwijl die speler de twee eerste blokken gewoon meespeelde. Die vlag hier vooraf op
  // "nooit op het veld" zetten was dus fout — de replay sloeg dan élke ruil over waar hij in een
  // vroeger blok bij betrokken was (`if (onF[e.pA] && onF[e.pB])`), en dan belandden ANDERE spelers
  // op een verkeerde plek. Precies het soort scheve velddiagram dat de veldtest opleverde, en het
  // werd blijvend opgeslagen zodra je daarna een event bewerkte of verwijderde.
  // De replay loopt nu gewoon door zoals de events het zeggen; enkel de EINDstand mag hem niet meer
  // op het veld zetten (zie onderaan). De posities van de anderen blijven zo kloppen.
  const absent = new Set();
  const evs = [...m.events].filter(e => e.type === 'substitution' || e.type === 'posSwap' || e.type === 'red_card' || (e.type === 'injury' && e.leavesField))
    .sort((a, b) => a.gameTimeMs - b.gameTimeMs);
  for (const e of evs) {
    if (e.type === 'substitution') {
      if (e.playerInId) e.posBefore = pos[e.playerInId] ? { ...pos[e.playerInId] } : null; // snapshot repareren
      // De plaats van wie eraf gaat NIET wissen: posBefore hierboven heeft ze nodig om een speler
      // die later terugkeert op zijn vorige stint-positie te kunnen terugspoelen (zie de uitleg bij
      // posBefore in startQuarter). Wat wél moet: een positiewissel mag hem niet meer betrekken —
      // en dat regelt onF, niet het wissen van zijn plaats.
      if (e.playerOutId) onF[e.playerOutId] = false;
      if (e.playerInId && !absent.has(e.playerInId)) {
        onF[e.playerInId] = true;
        if (e.playerOutId && pos[e.playerOutId]) pos[e.playerInId] = { ...pos[e.playerOutId] };
        // KOMT ERBIJ ZONDER TEGENHANGER (v0.49.0): er is geen uitgaande speler wiens plaats hij
        // overneemt, dus de plek moet uit het event zelf komen. Zonder dit bleef hij buiten `pos`,
        // en dan verplaatste een latere positiewissel enkel de ándere speler — twee shirts op één
        // plek, met een lege plaats ernaast. Precies wat er op 22-08-2026 op het scherm stond.
        else if (!e.playerOutId && e.naarPlek) {
          // Absolute plek uit het event, via zetInPosKaart: na een rechtgezette startopstelling kan
          // die plek bezet blijken, en dan wordt dit een ruil met de bewoner (zie core.js).
          const plek = gridPlek(e.naarPlek);
          if (plek) zetInPosKaart(m, pos, id => !!onF[id], e.playerInId, plek);
        }
      }
    } else if (e.type === 'posSwap' && e.pA && !e.pB && e.naarPlek) {
      // Verhuizing naar een lege plek: enkel pA verandert, de plek waar hij wegging blijft leeg.
      // Enkel voor wie op dat moment op het veld staat — een gewisselde speler houdt zijn laatste
      // plaats in de boekhouding (voor posBefore), maar mag niet meer verplaatst worden.
      if (onF[e.pA]) {
        const a = pos[e.pA];
        e.posA = a ? { ...a } : e.posA;   // snapshot repareren
        const plek = gridPlek(e.naarPlek);
        if (plek) zetInPosKaart(m, pos, id => !!onF[id], e.pA, plek);
      } else {
        // OVERGESLAGEN: hij stond er niet. Dan moeten ook de momentopnames weg, want het
        // terugspoelen (positionsAtMatchStart) leest juist die en zou de zet dán wél ongedaan maken —
        // en daarmee de fout die we hier net vermeden opnieuw binnenhalen. Zonder posA slaat het
        // terugspoelen dit event over, precies zoals hier.
        e.posA = null;
      }
    } else if (e.type === 'posSwap' && e.pA && e.pB) {
      // Ruilen kan alleen tussen twee spelers die er beide staan. Zonder die voorwaarde verplaatste
      // een ruil met iemand die al gewisseld was maar één kant, en bleef de andere op zijn plek —
      // twee shirts op één plaats. Dat is wat er op 22-08-2026 op het scherm stond.
      if (onF[e.pA] && onF[e.pB]) {
        const a = pos[e.pA], b = pos[e.pB];
        e.posA = a ? { ...a } : e.posA; e.posB = b ? { ...b } : e.posB; // snapshots repareren
        if (b) pos[e.pA] = { ...b }; if (a) pos[e.pB] = { ...a };
      } else {
        // Overgeslagen, zelfde reden als hierboven: zonder momentopnames slaat het terugspoelen dit
        // event ook over. Anders draait het een ruil terug die vooruit nooit gebeurd is, en dan
        // reproduceert het terugspoelen de startopstelling niet meer — precies waardoor een
        // reparatie van de startopstelling op 22-08-2026 geen effect had.
        e.posA = null; e.posB = null;
      }
    } else if (e.type === 'red_card' && e.playerId) {
      onF[e.playerId] = false;
    } else if (e.type === 'injury' && e.leavesField && e.playerId) {
      onF[e.playerId] = false;
    }
  }
  m.players.forEach(p => {
    // Wie afwezig gemeld of uitgesloten is, staat op het EIND nooit op het veld — ongeacht wat een
    // oudere wissel in de replay zei (undo, event verwijderen). Zie de uitleg bij `absent` hierboven:
    // dit hoort hier, aan het einde, en niet vooraf.
    p.onField = !!onF[p.id] && !p.absent && !isUitgesloten(m, p.id);
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
      } else if (e.type === 'posSwap' && e.pA && !e.pB && e.naarPlek) {
        // Verhuizing: enkel de lijn van die ene speler verandert (dit stukje volgt de keeperminuten,
        // dus de lijn is wat telt — zie keeperNow hieronder).
        const plek = gridPlek(e.naarPlek);
        if (plek) line[e.pA] = plek.line;
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
  else if (t === 'injury') fields = `<div class="fg"><label>Speler</label><select id="ee-player">${opts(e.playerId)}</select></div><div class="fg"><label>Type</label><select id="ee-itype"><option value="kramp" ${e.injuryType === 'kramp' ? 'selected' : ''}>Kramp</option><option value="licht" ${e.injuryType === 'licht' ? 'selected' : ''}>Licht</option><option value="ernstig" ${e.injuryType === 'ernstig' ? 'selected' : ''}>Ernstig</option><option value="vertrokken" ${e.injuryType === 'vertrokken' ? 'selected' : ''}>Vertrokken</option></select></div><div class="chkrow"><input type="checkbox" id="ee-leaves" ${e.leavesField ? 'checked' : ''}> Verlaat het veld</div>`;
  else if (t === 'disallowed_us' || t === 'disallowed_them') fields = `<div class="fg"><label>Reden</label><input id="ee-reason" type="text" value="${esc(e.reason || '')}" placeholder="bv. buitenspel"></div>`;
  openModal(`<h3>${icI(IC.edit)} Event bewerken</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${evtLabel(e, match)}</p>
    ${e.atBreak
      ? `<p style="text-align:center;color:var(--txt2);font-size:12px;margin-bottom:12px">Pauzewissel — vindt plaats bij de start van het deel; de minuut is niet aanpasbaar.</p>`
      : `<div class="fg"><label>Minuut</label><input id="ee-min" type="number" value="${minute}" inputmode="numeric"></div>`}
    ${fields}
    <button class="btn btn-green" onclick="saveEditEvent('${id}')">${icI(IC.check)}Opslaan</button>
    ${startopstellingKnopHtml(e)}
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// ---- "Dit hoorde bij de opstelling van dit deel" ----
// Een wissel of positiewissel die je vlak na de aftrap van een deel doet, is bijna altijd geen
// wissel maar een CORRECTIE: de trainer had de opstelling nog gewijzigd en dat kwam pas op het veld
// aan het licht. In het verloop staat ze dan als een echte wissel ("1' Simon voor Sebastian"), ze
// vertekent ieders speelminuten met die minuten, en ze valt buiten de samengevouwen startopstelling
// van dat deel. Deze knop hangt ze om naar een pauzewijziging: atBreak + de tijd van de start van
// het deel. Daarmee rekent playersAtPeriodStart() ze mee in de opstelling waarmee dat deel begint
// (zie de atBreak-uitzondering daar), vouwt het verslag ze samen in die ene regel, en kloppen de
// speelminuten. Twee velden op één event — de rest volgt uit de bestaande machinerie.
// Omkeerbaar: bij een pauzewijziging staat er de omgekeerde knop.
function startopstellingKnopHtml(e) {
  if (!e || !e.quarterNum) return '';
  if (e.type !== 'substitution' && e.type !== 'posSwap') return '';
  const label = pSingLow(match);
  return e.atBreak
    ? `<button class="btn btn-pale btn-sm" style="margin-top:8px;width:100%" onclick="confirmVerplaatsEvent('${e.id}', false)">${icI(IC.swap)} Dit gebeurde tijdens het spel, niet bij de start</button>`
    : `<button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="confirmVerplaatsEvent('${e.id}', true)">${icI(IC.shirt)} Dit hoorde bij de opstelling van ${label} ${e.quarterNum}</button>`;
}
// Welke andere gebeurtenissen komen door dit omhangen in de knoop? Een wissel naar de start van het
// blok schuiven, terwijl er tússen de nieuwe en de oude tijd nog iets met dezelfde spelers gebeurt,
// maakt de gegevens tegenstrijdig: dan wordt er van plaats geruild met iemand die al gewisseld is.
// De reconstructie sleept die tegenspraak door naar élk blok — zichtbaar als twee shirts op één plek,
// ook in de startopstelling (gevonden op 22-08-2026 met 60 nagespeelde wedstrijden). Beter dus om ze
// niet te laten ontstaan dan om de reconstructie er nog een uitzondering bij te geven.
function verplaatsConflicten(e, naarStart) {
  if (!e || !e.quarterNum) return [];
  const qStart = gameTimeMsAtStartOfQuarter(match, e.quarterNum);
  const nieuw = naarStart ? qStart : qStart + 60000;
  const oud = e.gameTimeMs || 0;
  const van = Math.min(nieuw, oud), tot = Math.max(nieuw, oud);
  const betrokken = new Set([e.playerOutId, e.playerInId, e.pA, e.pB].filter(Boolean));
  if (!betrokken.size) return [];
  // STRIKT tussen de twee tijdstippen, en geen pauzewijzigingen van dit blok. Die laatste staan
  // precies óp het starttijdstip en zijn juist geen probleem: het omgehangen event komt daar netjes
  // achter (zie de drie rondes in startQuarter). Nam je ze wel mee, dan weigerde de app precies het
  // geval waarvoor de knop bestaat — een correctie op minuut 1 in een blok met pauzewissels.
  return (match.events || []).filter(x => x.id !== e.id
    && x.quarterNum === e.quarterNum
    && !x.atBreak
    && (x.type === 'substitution' || x.type === 'posSwap')
    && (x.gameTimeMs || 0) > van && (x.gameTimeMs || 0) < tot
    && [x.playerOutId, x.playerInId, x.pA, x.pB].filter(Boolean).some(pid => betrokken.has(pid)));
}
function confirmVerplaatsEvent(id, naarStart) {
  const e = match.events.find(x => x.id === id); if (!e) return;
  const label = pSingLow(match);
  const conflicten = verplaatsConflicten(e, naarStart);
  if (conflicten.length) {
    openModal(`<h3>${icI(IC.warn)} Dit kan zo niet</h3>
      <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${evtLabel(e, match)}</p>
      <p style="font-size:13px;margin-bottom:10px;text-align:left">Er ${conflicten.length === 1 ? 'staat' : 'staan'} nog ${conflicten.length === 1 ? 'een gebeurtenis' : conflicten.length + ' gebeurtenissen'} met dezelfde spelers <b>tussen</b> het nieuwe en het oude tijdstip. Die zou${conflicten.length === 1 ? '' : 'den'} dan gebeuren met iemand die op dat moment al gewisseld is, en dan klopt de opstelling van geen enkel ${label} meer:</p>
      <div style="text-align:left;font-size:13px;border:1px solid var(--bdr);border-radius:8px;padding:8px;margin-bottom:12px">
        ${conflicten.map(x => `<div style="padding:3px 0">${eventMinLocal(x, match)} — ${evtLabel(x, match)}</div>`).join('')}
      </div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:14px;text-align:left">Zet ${conflicten.length === 1 ? 'die' : 'die'} eerst recht (verplaatsen of verwijderen), en kom dan hier terug.</p>
      <button class="btn btn-gray" onclick="modalEditEvent('${id}')">Terug</button>`);
    return;
  }
  // Hoeveel speeltijd verschuift er? Dat is het enige dat je vóór het bevestigen wil weten, want het
  // raakt de statistieken van twee spelers. Bij het omhangen naar de start schuift het event naar
  // het begin van het deel; terug wordt het de eerste minuut van dat deel.
  const qStart = gameTimeMsAtStartOfQuarter(match, e.quarterNum);
  const nieuwMs = naarStart ? qStart : qStart + 60000;
  const verschilMin = Math.round(Math.abs(nieuwMs - (e.gameTimeMs || 0)) / 60000);
  const wie = e.type === 'substitution'
    ? { af: e.playerOutId ? pName(match, e.playerOutId) : null, op: e.playerInId ? pName(match, e.playerInId) : null }
    : null;
  const gevolg = !verschilMin ? '<b>Niemands speelminuten veranderen</b> — het event staat al op dat moment.'
    : (wie && wie.af && wie.op)
      ? `<b>${esc(wie.op)}</b> krijgt ${verschilMin} minuut${verschilMin === 1 ? '' : 'en'} ${naarStart ? 'méér' : 'minder'}, <b>${esc(wie.af)}</b> ${naarStart ? 'evenveel minder' : 'evenveel méér'}.`
      : `Het event verschuift ${verschilMin} minuut${verschilMin === 1 ? '' : 'en'}; de speelminuten worden opnieuw berekend.`;
  openModal(`<h3>${icI(naarStart ? IC.shirt : IC.swap)} ${naarStart ? `Bij de opstelling van ${label} ${e.quarterNum}?` : 'Terug naar tijdens het spel?'}</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${evtLabel(e, match)}</p>
    <p style="font-size:13px;margin-bottom:10px;text-align:left">${naarStart
      ? `Dit wordt behandeld als een wijziging <b>bij de start van ${label} ${e.quarterNum}</b> in plaats van als een wissel tijdens het spel. Op het verslag verdwijnt de losse regel en staat het gewoon in de <b>startopstelling</b> van dat ${label}.`
      : `Dit wordt weer een gewone wissel <b>tijdens ${label} ${e.quarterNum}</b> en krijgt een eigen regel in het verloop.`}</p>
    <p style="font-size:13px;margin-bottom:14px;text-align:left">${gevolg}</p>
    <button class="btn btn-green" onclick="doVerplaatsEvent('${id}', ${naarStart ? 'true' : 'false'})">${icI(IC.check)} Ja, doen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="modalEditEvent('${id}')">Annuleren</button>`);
}
async function doVerplaatsEvent(id, naarStart) {
  if (!canLive()) return;
  const e = match.events.find(x => x.id === id); if (!e) return;
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    // Zelfde voorzorg als in saveEditEvent: de startopstelling vastleggen TERWIJL de staat nog
    // consistent is, want rebuildPositions vertrekt daarvan.
    const baseline = playersAtPeriodStart(match, 1);
    const qStart = gameTimeMsAtStartOfQuarter(match, e.quarterNum);
    if (naarStart) { e.atBreak = true; e.gameTimeMs = qStart; }
    else { delete e.atBreak; e.gameTimeMs = qStart + 60000; }
    recomputeScore(match);
    rebuildPositions(match, baseline);
    if (match.keeperByQ && Object.keys(match.keeperByQ).length) rebuildKeeperByQ(match);
    await dbSave(match);
    closeModal(); render();
    showToast(naarStart ? `Staat nu in de startopstelling van ${pSingLow(match)} ${e.quarterNum}.` : 'Staat weer in het verloop.', 'ok');
  } finally { _eventBusy = false; }
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
    <div class="sec">${icI(IC.injury)} Blessure of vertrek</div>
    ${opt(`${icI(IC.injury)} Blessure`, "modalInjury()")}
    ${/* Eigen ingang, want dit is geen blessure: een speler die naar huis gaat of naar het tweede
         veld. Stond alleen als vierde keuze binnen het blessurevenster en was daardoor onvindbaar. */ ''}
    ${opt(`${icI(IC.close)} Speler verlaat de wedstrijd`, "modalInjury(null,'vertrokken')")}
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
// ----- Een speler bijzetten terwijl de wedstrijd loopt -----
// Tot hier lag de selectie vast vanaf de aftrap. Dat botst met twee alledaagse situaties: de
// laatkomer die pas na het startsignaal toekomt, en — bij de jongste reeksen, waar dezelfde ploeg
// twee wedstrijden tegelijk speelt — de speler die van het andere veld komt bijspringen. Zonder
// deze knop bestond zo iemand niet voor de wedstrijd: geen minuten, geen doelpunten, geen plek in
// het verslag, enkel een zin in de notitie.
//
// Hij komt binnen als BANKSPELER. Dat is bewust en het is ook wat het veilig maakt: de speeltijd
// vertrekt van de basisopstelling en loopt daarna de wissels af (calcMinutes), en de veldbezetting
// wordt op dezelfde manier herrekend (recomputeOnField). Wie in geen enkel event voorkomt, krijgt
// dus nul minuten en staat niet op het veld, zonder dat er iets aan de anderen verandert. Vanaf nu
// is het een gewone bankspeler: je brengt hem in met een gewone wissel.
//
// Kiezen gebeurt uit het PLOEGROOSTER en niet door een naam te typen. Zonder de koppeling naar het
// rooster (rosterId) groepeert de seizoensstatistiek hem op naam, en dan staat hij daar met een
// tweede regel naast zichzelf. Voor wie echt niet in het rooster staat is er "Losse speler",
// dezelfde uitweg als in de selectiewizard.
function _liveTeam() {
  return teamById(match.teamId) || (getTeamsV2().find(t => t.name === match.teamName) || null);
}
function modalAddPlayerLive() {
  const team = _liveTeam();
  // Zowel op rosterId als op naam ontdubbelen: een speler die via een oudere wedstrijd of als gast
  // in de selectie kwam, heeft niet noodzakelijk een rosterId.
  const zit = new Set();
  (match.players || []).forEach(p => { if (p.rosterId) zit.add(p.rosterId); zit.add((p.name || '').trim().toLowerCase()); });
  const vrij = ((team && team.players) || []).filter(p => !zit.has(p.id) && !zit.has((p.name || '').trim().toLowerCase()));
  const lijst = vrij.length
    ? pgGrid(vrij.map(p => pgBtn(p, 'addp-pb', `addPlayerLive('${p.id}')`)).join(''))
    : `<p style="text-align:center;color:var(--txt2);font-size:13px;margin:4px 0 14px">${rosterEmptyText('Iedereen uit het rooster zit al in deze wedstrijd.')}</p>`;
  openModal(`<h3>${icI(IC.plus)} Speler bijzetten</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Voor een laatkomer of iemand die komt bijspringen. Hij komt op de <b>bank</b> — zijn speeltijd start pas wanneer je hem effectief inbrengt.</p>
    ${lijst}
    <button class="btn btn-pale" style="margin-top:12px" onclick="addLoosePlayerLiveModal()">Losse speler (niet in het rooster)</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Gemeenschappelijk stuk voor beide ingangen: de speler in de selectie zetten en opslaan.
async function _voegSpelerToeAanWedstrijd(veld) {
  match.players.push(Object.assign({
    id: uid(), rosterId: null, globalId: null, name: 'Speler', number: '',
    line: 'Middenveld', posNum: '', starting: false, onField: false, guest: false,
    // Waaraan je later ziet dat hij niet vanaf de aftrap in de selectie zat — het verslag en de PDF
    // tonen dat als "bijgekomen", zodat zijn lagere speeltijd verklaard staat. Wedstrijden van vóór
    // deze versie hebben het veld niet en tonen dus niets.
    addedDuringMatch: true, addedQuarter: match.currentQuarter || 0,
  }, veld));
  // Bij een tornooiwedstrijd komt de dagselectie uit het tornooi: zonder deze stap krijgt hij
  // speelminuten zonder in enige groep te staan (zelfde reden als bij "Spelers bewerken").
  const trn = syncMatchPlayersToTournamentSquad(match);
  recomputeOnField(match);
  await dbSave(match);
  closeModal(); render();
  const naam = veld.name || 'Speler';
  showToast(trn.length
    ? `${naam} staat op de bank en in de tornooiselectie van vandaag.`
    : `${naam} staat op de bank. Breng hem in met een wissel.`, 'ok');
}
async function addPlayerLive(rosterId) {
  const team = _liveTeam();
  const r = ((team && team.players) || []).find(p => p.id === rosterId);
  if (!r) { showToast('Die speler staat niet meer in het rooster.', 'err'); return; }
  await _voegSpelerToeAanWedstrijd({
    rosterId: r.id, globalId: r.globalId || null, name: r.name,
    number: teamUsesNumbers(team) ? (r.number || '') : '',
    line: posLine(r.pos) || 'Middenveld',
  });
}
function addLoosePlayerLiveModal() {
  openModal(`<h3>${icI(IC.plus)} Losse speler bijzetten</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Iemand die niet in het rooster van deze ploeg staat. Hij telt mee voor deze wedstrijd, niet voor de seizoensstatistieken van de ploeg.</p>
    <div class="fg"><label>Voornaam</label><input id="alp-first" type="text" placeholder="Voornaam" autocomplete="off"></div>
    <div class="fg"><label>Naam</label><input id="alp-last" type="text" placeholder="Naam" autocomplete="off"></div>
    <button class="btn btn-green" style="margin-top:4px" onclick="confirmLoosePlayerLive()">${icI(IC.check)} Bijzetten</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="modalAddPlayerLive()">Terug</button>`);
  setTimeout(() => document.getElementById('alp-first')?.focus(), 50);
}
async function confirmLoosePlayerLive() {
  const first = (document.getElementById('alp-first')?.value || '').trim();
  const last = (document.getElementById('alp-last')?.value || '').trim();
  if (!first && !last) { showToast('Geef minstens een naam in.', 'err'); return; }
  await _voegSpelerToeAanWedstrijd({ name: [first, last].filter(Boolean).join(' '), guest: true, fromName: 'Losse speler' });
}
// Het merkje bij een speler die niet vanaf de aftrap meedeed. Enkel in de schermen tijdens en na de
// wedstrijd; het verslag en de PDF hebben hun eigen weergave (zie nameWithNum in detail-pdf.js).
function bijgekomenChip(p) {
  if (!p || !p.addedDuringMatch) return '';
  return ` <span style="font-size:10px;font-weight:700;color:var(--txt2);border:1px solid var(--bdr);border-radius:6px;padding:1px 5px;white-space:nowrap">bijgekomen</span>`;
}
// Het spiegelbeeld: wie de wedstrijd verliet. Zelfde reden om het te tonen als bij "bijgekomen" —
// zonder dit merkje leest zijn lagere speeltijd als een keuze van de trainer, terwijl hij simpelweg
// weg was. De reden komt in de tooltip, zodat de rij niet uitdijt.
function vertrokkenChip(p) {
  if (!p || !match || !isVertrokken(match, p.id)) return '';
  const ev = (match.events || []).find(e => e.type === 'injury' && e.injuryType === 'vertrokken' && e.playerId === p.id);
  const reden = ev && ev.reason ? ev.reason : '';
  return ` <span title="${esc(reden || 'Verliet de wedstrijd')}" style="font-size:10px;font-weight:700;color:var(--org2,#b45309);border:1px solid #fbbf24;background:var(--org-pale,#fff3e0);border-radius:6px;padding:1px 5px;white-space:nowrap">vertrokken${reden ? ' · ' + esc(reden) : ''}</span>`;
}
// "Herstel" bij de groep "Weg uit de wedstrijd" (audit 24-08-2026). Tot dan was een mistik hier enkel
// terug te draaien door het event op te zoeken in het tabblad Verloop. Het verwijderen loopt via
// doDeleteEvent, dus mét tombstone (anders brengt de synchronisatie met een medebeheerder het event
// terug) en mét het herrekenen van veld, score en keeperminuten.
function confirmHerstelVertrokken(pid) {
  if (!canLive() || !match) return;
  const p = match.players.find(pl => pl.id === pid);
  if (!p) return;
  const ev = (match.events || []).slice().reverse().find(e => e.type === 'injury' && e.playerId === pid && (e.injuryType === 'vertrokken' || e.leavesField));
  if (!ev) { showToast('Geen vertrek gevonden om terug te draaien.', 'err'); return; }
  const inPlan = Array.isArray(match.nextLineup) && match.nextLineup.some(x => x.id === pid);
  openModal(`<h3>${esc(p.name)} terug in de wedstrijd?</h3>
    ${/* Gemeten 24-08-2026: doDeleteEvent laat de reconstructie opnieuw lopen, dus wie op het veld
         stond toen hij wegging, staat daar weer — hij komt NIET op de bank terecht. De tekst zei dat
         eerst wel, en dat zou een verkeerd beeld van het veld geven. */ ''}
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px">Zijn vertrek wordt geschrapt en hij doet weer mee: stond hij op het veld toen hij wegging, dan staat hij daar weer. Zijn gespeelde minuten blijven zoals ze zijn en zijn teller loopt weer.${inPlan ? '' : ' Stond hij in een getekende opstelling voor een volgend deel, kijk die dan nog eens na.'}</p>
    <button class="btn btn-green" onclick="doDeleteEvent('${ev.id}')">${icI(IC.check)} Ja, terug in de wedstrijd</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
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
      ${/* Hij was er wél, maar voetbalt elders — bij twee gelijktijdige wedstrijden van dezelfde
           ploeg het gewone geval. Zelfde gevolg voor deze wedstrijd (0 minuten), maar het verslag
           zegt dan waarom, en de aanwezigheidsstatistiek rekent het niet als een gemiste wedstrijd. */ ''}
      <button class="btn btn-orgpale" style="margin-top:8px" onclick="doMarkAbsent('${pid}','elders')">Vertrokken — speelt elders</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  openModal(`<h3>${icI(IC.injury)} ${esc(p.name)} van het veld</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:14px">Hij speelde al <b>${min} min</b>. Registreer je hem als <b>blessure</b> of als <b>vertrokken</b>, dan stopt zijn teller nu, blijven die ${min} min staan en kan je meteen iemand inbrengen.</p>
    ${trnOptie}
    <button class="btn btn-green" onclick="markAbsentViaInjury('${pid}')">${icI(IC.injury)} Blessure / verlaat het veld</button>
    <button class="btn btn-orgpale" style="margin-top:8px" onclick="markLeftField('${pid}')">Vertrokken — speelt elders of naar huis</button>
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
// Een speler die al gespeeld heeft en nu weggaat (naar het tweede veld van dezelfde ploeg, of naar
// huis). Zelfde afhandeling als een blessure waarbij hij het veld verlaat — zijn teller stopt, zijn
// gespeelde minuten blijven staan en je krijgt meteen de wisselmodal — maar dan zonder het
// "blessure" te noemen. Bewust GEEN nieuw eventtype: dit is het bestaande "verlaat het veld" met
// 'vertrokken' als soort, zodat elke bestaande berekening (speeltijd, veldbezetting, keeperminuten)
// en elk bestaand verslag het ongewijzigd blijft lezen.
async function markLeftField(pid) {
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    const p = match.players.find(pl => pl.id === pid);
    if (!p) return;
    if (_trnAbsentAangevinkt() && !markTournamentUnavailable(pid)) {
      showToast(`${p.name} staat niet in de tornooiselectie — enkel voor deze wedstrijd afgemeld.`, 'err');
    }
    addEvent('injury', { playerId: pid, injuryType: 'vertrokken', leavesField: true });
    p.onField = false;
    // Ook uit de getekende opstelling van het volgende blok — zie confirmInjury.
    if (Array.isArray(match.nextLineup) && match.nextLineup.some(e => e.id === pid)) {
      _pasNextLineupAan(match, match.nextLineup.filter(e => e.id !== pid));
    }
    await dbSave(match);
    modalSubAfterInjury(pid, 'vertrokken');
  } finally { _eventBusy = false; }
}
// `reden` is een sleutel uit ABSENT_REASONS en blijft optioneel: zonder reden verandert er niets aan
// het bestaande gedrag. Met 'elders' zegt het verslag waarom hij niet speelde, en telt de wedstrijd
// niet als gemist in zijn aanwezigheids-% — hij voetbalde, alleen niet hier.
async function doMarkAbsent(pid, reden) {
  const p = match.players.find(pl => pl.id === pid);
  if (!p) return;
  if (reden) p.absentReason = reden; else delete p.absentReason;
  // Vinkje aan maar de speler staat niet in de tornooiselectie (gastspeler, of iemand die de ploeg
  // intussen verliet)? Dan geldt de afmelding enkel voor deze wedstrijd — dat moet je weten,
  // anders denk je hem voor de hele dag afgemeld te hebben.
  if (_trnAbsentAangevinkt() && !markTournamentUnavailable(pid)) {
    showToast(`${p.name} staat niet in de tornooiselectie — enkel voor deze wedstrijd afgemeld.`, 'err');
  }
  p.absent = true;
  if (p.onField) p.onField = false;
  // Ook uit de GETEKENDE OPSTELLING van het volgende deel halen. Dat is sinds v0.49.0 de waarheid:
  // de wissels hieronder zijn er enkel de afgeleide van. Bleef hij erin staan, dan toonde het
  // pauzeveld hem nog gewoon (aantikbaar en wel) terwijl de wissels wél opgeruimd waren — en dan
  // deed de start iets anders dan wat het scherm liet zien. Gemeld in de zijlijntest van 22-08-2026.
  // _pasNextLineupAan leidt de pendings meteen opnieuw af, dus die kloppen daarna vanzelf.
  if (Array.isArray(match.nextLineup) && match.nextLineup.some(e => e.id === pid)) {
    _pasNextLineupAan(match, match.nextLineup.filter(e => e.id !== pid));
  }
  // Wedstrijden zonder getekende opstelling (of een speler die er niet in stond): de klaargezette
  // wissels alsnog opschonen — een afwezige mag bij de start niet alsnog het veld op gestuurd worden.
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
  delete p.absentReason;
  // Zolang er nog geen deel gestart is, is een basisspeler die je herstelt gewoon weer basisspeler:
  // doMarkAbsent zette onField op false, en zonder dit bleef hij achter met starting=true en
  // onField=false. De planning telde hem dan mee en de veldbezetting niet. Loopt de wedstrijd al,
  // dan blijft hij bewust van het veld — daar hoort een echte wissel bij.
  if (!(match.quarters || []).length && p.starting) p.onField = true;
  await dbSave(match); render();
}
// BEWUSTE KEUZE (Tim, 25-08-2026): dit blijft enkel bereikbaar via "Meer", en die tegel staat in de
// PAUZE uit. Kapitein wijzigen kan dus pas als het volgende deel loopt. De audit stelde een eigen
// tegel in het pauzekaartje voor (het pauzeveld tekent daar wél een ©, mogelijk op iemand die straks
// niet speelt); Tim koos ervoor het te laten. Niet "repareren" zonder het hem te vragen.
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
// WAT KAN JE ONGEDAAN MAKEN? (Tim, 23-08-2026) Enkel wat je ZELF net loggde in het deel dat nu
// bezig is. Drie soorten vallen er bewust buiten:
//   - de kwartgrenzen (quarter_start/quarter_end): die horen bij de klok, niet bij een actie;
//   - alles met atBreak: de wissels die de app bij de START van dit deel automatisch doorvoerde om
//     je opstelling te halen. Die heb je hier niet ingetikt, dus "ongedaan maken" leest als een
//     vergissing van jou terwijl het de uitvoering van je plan is. Aanpassen doe je in het verslag
//     of op het tabblad Opstelling;
//   - alles uit een vórig deel: dat corrigeer je in het verslag, niet met een knop die je aan de
//     zijlijn blind kan blijven indrukken.
// Eén functie, zodat de knop (hasUndo), de bevestiging en de uitvoering het over dezelfde
// gebeurtenis hebben — anders toont het venster iets anders dan wat er verdwijnt.
function undoKandidaat(m) {
  if (!m || !Array.isArray(m.events)) return null;
  for (let i = m.events.length - 1; i >= 0; i--) {
    const e = m.events[i];
    if (e.type === 'quarter_start' || e.type === 'quarter_end') continue;
    if (e.atBreak) continue;
    if (e.quarterNum !== m.currentQuarter) continue;
    return e;
  }
  return null;
}
function hasUndo() { return !!undoKandidaat(match); }
// Bevestigen vóór het weggaat: de knop stond naast de eventknoppen en verwijderde meteen, zonder
// te zeggen wát. Nu zie je eerst de gebeurtenis staan.
function confirmUndoLast() {
  const e = undoKandidaat(match);
  if (!e) { showToast(`Niets van jou om ongedaan te maken in dit ${pSingLow(match)}.`, 'err'); return; }
  openModal(`<h3>${icI(IC.undo)} Ongedaan maken?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">"${evtLabel(e, match)}"<br>Deze gebeurtenis verdwijnt uit het verloop. De score en de opstelling worden herberekend.</p>
    <button class="btn btn-red" onclick="undoLast()">${icI(IC.undo)} Ja, ongedaan maken</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function undoLast() {
  // Dubbeltik-guard: een tweede tik vóór de re-render zou stil óók het voorlaatste event verwijderen.
  if (_eventBusy) return;
  _eventBusy = true;
  try {
  const removed = undoKandidaat(match);
  if (!removed) { closeModal(); return; }
  const idx = match.events.indexOf(removed);
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
  await dbSave(match); closeModal(); render();
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
// Spelerskeuze voor wie SCOORDE of een KAART kreeg bij een event dat je ACHTERAF toevoegt: de lijst
// toonde enkel wie het gekozen blok begón, dus een doelpunt van iemand die op minuut 10 inviel was
// niet toe te kennen. Nu: eerst wie het blok begon, daarna de rest van de selectie, gemerkt als
// 'bank' — dezelfde oplossing als bij blessure/vertrek (v0.51.0), en bewust géén lijst die met de
// ingetikte minuut meebeweegt: twee berekeningen voor één waarheid is precies wat deze week brak.
// Tijdens het spel blijft de lijst gewoon het veld van dit moment.
function spelersVoorEventKeuze(m) {
  const veld = playersOnFieldForEvent(m);
  if (_postEventQuarter == null) return { lijst: veld, bank: new Set() };
  const veldIds = new Set(veld.map(p => p.id));
  const rest = sortedByName((m.players || []).filter(p => !veldIds.has(p.id) && !p.absent));
  return { lijst: [...veld, ...rest], bank: new Set(rest.map(p => p.id)) };
}
// Het merkje op zo'n bankspeler in de keuzeknoppen.
function bankTag(bank, p) {
  return bank.has(p.id) ? '<span style="font-size:9px;font-weight:800;color:var(--txt2);border:1px solid var(--bdr);border-radius:5px;padding:0 4px">bank</span>' : '';
}
let goalTeam = 'us', goalPlayerId = null, goalAssistId = null, goalIsOwnGoal = false;
function modalGoal() {
  const goalCount = id => match.events.filter(e => (e.type==='goal_us'||e.type==='penalty_us') && e.playerId===id).length;
  const keuze = spelersVoorEventKeuze(match);
  // Veldspelers eerst (op doelpuntentotaal), de bank erachter.
  const on = keuze.lijst.slice().sort((a,b) => (keuze.bank.has(a.id)?1:0)-(keuze.bank.has(b.id)?1:0) || goalCount(b.id)-goalCount(a.id) || (Number(a.number)||99)-(Number(b.number)||99));
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
        ${on.map(p=>`<button type="button" class="gp-btn" data-id="${p.id}" onclick="selectGoalPlayer('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px">${playerBtnInner(p, 'var(--txt)')}${bankTag(keuze.bank, p)}</button>`).join('')}
        <button type="button" class="gp-btn" data-id="own_them" onclick="selectGoalPlayer('own_them',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px"><span style="font-size:13px;font-weight:900;color:var(--txt2);line-height:1">OG</span><span style="font-size:10px;color:var(--txt2);text-align:center">eigen doel teg.</span></button>
      </div>
      <div id="assist-section" class="hidden">
        <div class="sec">Assist door? (optioneel)</div>
        <div id="assist-players" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${on.map(p=>`<button type="button" class="ap-btn" data-id="${p.id}" onclick="selectAssist('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px">${playerBtnInner(p, 'var(--txt2)')}${bankTag(keuze.bank, p)}</button>`).join('')}
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
          ${on.map(p=>`<button type="button" class="ogp-btn" data-id="${p.id}" onclick="selectOwnGoalPlayer('${p.id}',this)" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:3px">${playerBtnInner(p, 'var(--txt)')}${bankTag(keuze.bank, p)}</button>`).join('')}
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
  // OOK HET EIGEN-DOELDEEL TERUGZETTEN (audit 25-08-2026). De regel hierboven zet goalIsOwnGoal op
  // false, maar liet het schakelaartje op "Eigen doel" staan en de spelerslijst open. Gemeten reeks:
  // tegenstander → eigen doel → onze speler aanduiden → onze ploeg → weer tegenstander → Bevestigen.
  // Op het scherm stond "Eigen doel" mét een gekozen speler, opgeslagen werd een gewoon tegendoel
  // zonder speler. Zelfde stand, verkeerd verloop en verkeerde spelersstatistiek.
  const ogTgl = document.getElementById('goal-own-tgl');
  if (ogTgl) {
    ogTgl.querySelectorAll('button').forEach((b, i) => b.classList.toggle('act', i === 0));
  }
  const ogWrap = document.getElementById('own-goal-players');
  if (ogWrap) ogWrap.classList.add('hidden');
  document.querySelectorAll('#own-goal-player-list .mopt').forEach(o => o.classList.remove('sel'));
  document.querySelectorAll('#own-goal-player-list .ogp-btn').forEach(o => gpDesel(o));
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
// OPGERUIMD op 25-08-2026 (audit): hier stonden posDoelBtn, posDoelGrid, selectSubOut,
// selectPosSwapA, selectPosSwapB en removePendingPosSwap. Dat waren restanten van de vensters van
// vóór v0.57: ze praatten tegen id's (#psw-a, #psw-b, #psw-b-lbl, #psw-confirm, #sub-out) die niet
// meer bestaan, en de wissellijst waar removePendingPosSwap bij hoorde is verdwenen. Gecontroleerd
// met een grep over de hele repo: geen enkele aanroeper meer.
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
// Wie er op het veld staat op het moment waarover dit scherm gaat, MET de posities van dat moment —
// nodig om een veld te kunnen tekenen i.p.v. een rij naamkaartjes. Drie situaties:
//   retro  : een event toevoegen aan een afgelopen deel → de opstelling waarmee dat deel begon
//   pauze  : de opstelling waarmee het volgende deel begint (inclusief wat er al klaarstaat)
//   live   : gewoon wie er nu staat
function veldVoorWisselScherm(m) {
  if (_postEventQuarter != null) return pitchPlayersAtPeriodStart(m, _postEventQuarter);
  if (m.quarterStatus === 'between') return previewNextLineup(m).filter(p => p.onField && !p.absent);
  return effectiveOnField(m);
}
// Wissel via het veld: tik een speler op het veld (die gaat eraf) en een op de bank (die komt erin).
// Zelfde bediening als het tabblad Opstelling en de pauze-opstelling, zodat er nog maar één manier
// is om een wissel aan te duiden. De knop blijft bestaan omdat hij ook werkt voor een deel dat al
// gespeeld is ("Event toevoegen"), waar het tabblad Opstelling niet over gaat.
function modalSub(behoud) {
  // Een wissel heeft een tijdstip nodig (speeltijd/opstelling): bij "Onbekend deel" niet toelaten.
  if (_postEventQuarter === 'unknown') { showToast('Kies eerst een specifiek deel — een wissel heeft een tijdstip nodig.', 'err'); return; }
  const between = match.quarterStatus === 'between' && _postEventQuarter === null;
  const on = veldVoorWisselScherm(match);
  const mins = calcMinutes(match);
  const onIds = new Set(on.map(p => p.id));
  const qNum = _postEventQuarter != null ? _postEventQuarter : (between ? match.currentQuarter + 1 : match.currentQuarter);
  // Bank gesorteerd op minst gespeeld, zodat eerlijke rotatie makkelijk is. magNogMeedoen i.p.v.
  // magOpHetVeld: wie de wedstrijd verlaten heeft, stond hier — met zijn lage speeltijd zelfs
  // bovenaan — terwijl hij al naar huis was. Het deel meegeven, want bij een event dat je ACHTERAF
  // aan een vroeger blok toevoegt was hij toen misschien nog gewoon aanwezig.
  const off = match.players.filter(p => !onIds.has(p.id) && magNogMeedoen(match, p, qNum)).slice().sort((a, b) => (mins[a.id]?.ms || 0) - (mins[b.id]?.ms || 0));
  const minMs = off.length ? (mins[off[0].id]?.ms || 0) : 0;
  const mm = id => playedMin(mins[id]?.ms);
  if (!behoud) { subOut = null; subIn = null; }
  // Een selectie die niet meer klopt (bv. na het wisselen van deel) niet laten hangen.
  if (subOut && !onIds.has(subOut)) subOut = null;
  if (subIn && onIds.has(subIn)) subIn = null;
  const title = between ? `${icI(IC.swap)} Pauzewissel · ${pSing(match)} ${match.currentQuarter + 1}`
    : (_postEventQuarter != null ? `${icI(IC.swap)} Wissel · ${pSing(match)} ${_postEventQuarter}` : `${icI(IC.swap)} Wissel`);
  const cta = between ? `${icI(IC.check)} Pauzewissel inplannen` : `${icI(IC.check)} Wissel doorvoeren`;
  const klaar = subOut && subIn;
  openModal(`<h3>${title}</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">Tik de speler op het veld die <b>eraf</b> gaat, en dan wie er van de bank <b>in</b> komt.${between ? ' Wordt doorgevoerd bij de start van het volgende deel.' : ''}</p>
    ${renderPitch(match, on, captainAtStartOfQuarter(match, qNum), null, { fn: 'subVeldTap', selId: subOut })}
    <div class="sec">Bank (${off.length}) <span style="color:var(--txt2);font-weight:400;text-transform:none">· minst gespeeld eerst</span></div>
    <div class="place-chips">${off.length
      ? off.map(p => { const low = (mins[p.id]?.ms || 0) === minMs; return `<span class="place-chip ${subIn === p.id ? 'sel' : ''}" onclick="subVeldTap('bench','${p.id}')">${numSpan(p, 'pcn')}${esc(fieldName(match, p.id))} <small style="opacity:.7;margin-left:4px;color:${low ? 'var(--org)' : 'inherit'}">${mm(p.id)}'${low ? ' ●' : ''}</small></span>`; }).join('')
      : '<span style="color:var(--txt2);font-size:14px">Geen spelers op de bank.</span>'}</div>
    <p style="text-align:center;font-size:13px;margin-top:12px;color:${klaar ? 'var(--txt)' : 'var(--txt2)'}">${klaar
      ? `<b>${esc(pName(match, subIn))}</b> komt voor <b>${esc(pName(match, subOut))}</b>`
      : (subOut ? 'Kies nu een speler van de bank.' : (subIn ? 'Kies nu wie er van het veld gaat.' : 'Nog niets gekozen.'))}</p>
    <button class="btn btn-green" style="margin-top:8px${klaar ? '' : ';opacity:.5'}" onclick="confirmSub()">${cta}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function subVeldTap(kind, id) {
  if (kind === 'field') subOut = (subOut === id) ? null : id;
  else subIn = (subIn === id) ? null : id;
  modalSub(true);
}
function selectSubIn(id, el) { subIn = id; gpSelIn('sub-in', el); }
async function confirmSub() {
  if (!subOut || !subIn) { showToast('Kies wie eraf gaat en wie erin komt.', 'err'); return; }
  // Een uitgesloten speler staat niet meer in de banklijst, maar een selectie die nog van vóór de
  // rode kaart dateert zou hier alsnog door kunnen. Hij mag niet meer op het veld — en niemand mag
  // in zijn plaats komen, dus de ploeg speelt met een man minder.
  if (isUitgesloten(match, subIn)) {
    showToast(`${pName(match, subIn)} is uitgesloten (rode kaart) en mag niet meer op het veld.`, 'err');
    subIn = null; modalSub(true); return;
  }
  // Zelfde vangnet voor wie de wedstrijd verliet: hij staat niet meer in de banklijst, maar een
  // selectie die nog van vóór zijn vertrek dateert (of een tweede toestel) zou hier alsnog door.
  if (isVertrokken(match, subIn)) {
    showToast(`${pName(match, subIn)} heeft de wedstrijd verlaten.`, 'err');
    subIn = null; modalSub(true); return;
  }
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    // Echte pauzewissel: enkel tussen de delen ÉN niet in retro-modus (een event toevoegen aan een
    // reeds afgelopen deel). Dan inplannen i.p.v. meteen doorvoeren. Zelfde conditie als modalSub().
    if (match.quarterStatus === 'between' && _postEventQuarter === null) {
      // Via de doelopstelling (pauzeWisselInDoel), niet rechtstreeks in de pendings: anders staat
      // deze wissel niet op het pauzeveld én verdwijnt hij zodra je daar één keer tikt.
      if (!pauzeWisselInDoel(match, subOut, subIn)) {
        showToast(`${pName(match, subOut)} staat niet in de opstelling van ${pSingLow(match)} ${match.currentQuarter + 1}.`, 'err');
        return;
      }
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
  // Zelfde drie rondes en dezelfde volgorde als startQuarter — zie de uitleg daar. Wijkt deze
  // volgorde af, dan toont het scherm iets anders dan wat er gebeurt, en dat was precies de fout.
  for (const s of (m.pendingSubs || []).filter(s => s.outId)) {
    const o = byId(s.outId), i = byId(s.inId);
    if (!o) continue;
    if (!s.inId || !i) { o.onField = false; continue; }   // eenzijdig: eraf, plaats blijft leeg
    if (!magNogMeedoen(m, i)) continue;                   // zelfde regels als startQuarter: rood én vertrokken
    i.x = o.x; i.y = o.y; i.line = o.line; i.posNum = o.posNum;
    o.onField = false; i.onField = true;
  }
  for (const s of (m.pendingPosSwaps || [])) {
    // Verhuizing naar een lege plek: enkel pA verplaatst — zelfde regel als startQuarter().
    if (!s.pB && s.naarPlek) {
      const a = byId(s.pA), plek = gridPlek(s.naarPlek);
      if (a && plek) zetOpGridPlek(a, plek, m);
      continue;
    }
    const a = byId(s.pA), b = byId(s.pB);
    if (!a || !b) continue;
    const t = { x: a.x, y: a.y, line: a.line, posNum: a.posNum, posCodeVeld: a.posCodeVeld };
    a.x = b.x; a.y = b.y; a.line = b.line; a.posNum = b.posNum; a.posCodeVeld = b.posCodeVeld;
    b.x = t.x; b.y = t.y; b.line = t.line; b.posNum = t.posNum; b.posCodeVeld = t.posCodeVeld;
  }
  // Ronde 3: wie erbij komt zonder tegenhanger, op zijn nu vrijgekomen plek.
  for (const s of (m.pendingSubs || []).filter(s => !s.outId)) {
    const i = byId(s.inId), plek = s.naarPlek ? gridPlek(s.naarPlek) : null;
    if (i && plek && magNogMeedoen(m, i)) { zetOpGridPlek(i, plek, m); i.onField = true; }
  }
  return players;
}
// ===================== DE OPSTELLING VAN HET VOLGENDE DEEL =====================
// EEN DOELOPSTELLING, niet een stapel losse wijzigingen. Dat is het hele punt van v0.49.0.
//
// Wat er misging (veldtest 22-08-2026): de pauze hield een lijst pendingSubs + pendingPosSwaps bij,
// die elk tegen de stand van dát moment berekend waren maar pas bij de start achter elkaar werden
// toegepast. Zet je er zes achter elkaar klaar, dan kan een latere wijziging een plaats opeisen die
// een eerdere al gaf: nergens werd gecontroleerd dat een plek één bewoner heeft. Resultaat: twee
// shirts op exact dezelfde coördinaten, waarvan je er één ziet — "die speler verdween gewoon".
// En de voorstelling op het scherm werd door ándere code berekend (previewNextLineup) dan de
// werkelijkheid (startQuarter), met net andere regels, dus wat je aantikte was niet wat je kreeg.
//
// Nu: m.nextLineup IS de opstelling van het volgende deel — een lijst plekken met elk één speler.
// Elke tik wijzigt die opstelling rechtstreeks, en pas daarna wordt ze omgerekend naar de wissels
// en positiewissels die ervoor nodig zijn (lineupToPending, dezelfde weg als de geplande opstelling
// altijd al ging). pendingSubs/pendingPosSwaps blijven dus bestaan en bestaan enkel nog als AFGELEIDE
// van de doelopstelling — dat houdt startQuarter, het verslag, de PDF's en een tweede toestel
// ongewijzigd werkend. Nieuw, optioneel veld: een wedstrijd zonder nextLineup werkt gewoon door.
function lineupPlekSleutel(p) { return typeof p.x === 'number' ? `${p.x},${p.y}` : `L:${p.line || ''}`; }
function lineupEntry(p) { return { id: p.id, x: p.x, y: p.y, line: p.line, posNum: p.posNum, posCodeVeld: p.posCodeVeld }; }
function huidigVeldEntries(m) { return playersOnField(m).map(lineupEntry); }
// De doelopstelling. Staat er nog geen (wedstrijd van vóór v0.49.0, of een pauze die al liep), dan
// leiden we ze één keer af uit wat er klaarstond. Daarna is nextLineup de waarheid.
function nextLineupOf(m) {
  if (Array.isArray(m.nextLineup)) return m.nextLineup.map(e => ({ ...e }));
  return previewNextLineup(m).filter(p => p.onField && magOpHetVeld(m, p)).map(lineupEntry);
}
// De invariant: één speler per plek, en niemand twee keer. Dit is de enige plek waar de
// doelopstelling geschreven wordt, dus dit is ook de enige plek waar die regel moet staan.
function lineupOntdubbel(entries) {
  const perPlek = new Map(), gezien = new Set();
  for (const e of entries) {
    if (!e || !e.id || gezien.has(e.id)) continue;
    gezien.add(e.id);
    perPlek.set(lineupPlekSleutel(e), e);
  }
  return [...perPlek.values()];
}
// De doelopstelling zetten en de wissels eruit afleiden. Puur de mutatie, zonder opslaan en zonder
// guard: zo kunnen ook de schermen die zélf al een _eventBusy-guard aanhouden en zelf opslaan
// (confirmSub, confirmPosSwap, doMarkAbsent, …) langs deze ene weg. Dat is het hele punt van
// v0.49.0 — wie de pendings rechtstreeks vulde, zette iets klaar dat NIET op het pauzeveld stond en
// dat bij de eerstvolgende tik weer verdween, omdat de afleiding hieronder dan opnieuw draait.
function _pasNextLineupAan(m, entries) {
  // WIE NIET OP HET VELD MAG, STAAT ER OOK NIET IN. Afwezig gemeld of uitgesloten na een rode
  // kaart: startQuarter slaat zo iemand terecht over, dus als hij in de doelopstelling blijft
  // staan, belooft het pauzeveld een speler die straks niet verschijnt — en dan doet de start iets
  // anders dan wat je zag. Hier filteren en niet bij elke deur apart (tik, knop, plan, kaart,
  // afwezig melden): dit is de énige schrijfweg naar de doelopstelling, net zoals lineupOntdubbel
  // hier de regel "één speler per plek" bewaakt. Een rode kaart tijdens het spel kwam anders
  // alsnog binnen via het plan, dat pas ná die kaart de opstelling van het volgende deel wordt.
  // magNogMeedoen: ook wie de wedstrijd verlaten heeft valt weg — die kan het volgende blok niet
  // meer starten. Het venster is het blok dat gaat beginnen.
  const deel = (m.currentQuarter || 0) + 1;
  const bruikbaar = entries.filter(e => {
    const p = m.players.find(x => x.id === e.id);
    return p && magNogMeedoen(m, p, deel);
  });
  const schoon = lineupOntdubbel(bruikbaar);
  m.nextLineup = schoon;
  const diff = lineupToPending(m, huidigVeldEntries(m), schoon);
  m.pendingSubs = diff.subs;
  m.pendingPosSwaps = diff.swaps;
}
async function bewaarNextLineup(m, entries, melding) {
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    _pasNextLineupAan(m, entries);
    await dbSave(m); render();
    if (melding) showToast(melding, 'ok');
  } finally { _eventBusy = false; }
}
// Een WISSEL in de pauze, uitgedrukt in de doelopstelling: de invaller neemt de plaats van wie
// eraf gaat. Geeft false als die speler daar niet (meer) staat — dan is de wissel zinloos en hoort
// het scherm dat te zeggen in plaats van stil iets klaar te zetten.
function pauzeWisselInDoel(m, outId, inId) {
  const doel = nextLineupOf(m);
  let plaats = doel.find(e => e.id === outId);
  // HIJ IS ER NET AFGEHAALD (audit 25-08-2026). Meld je in de pauze iemand als vertrokken, dan haalt
  // markLeftField hem meteen uit de doelopstelling en biedt de app daarna "Wissel na vertrek" aan.
  // Die wissel liep dood: de speler stond er niet meer in, dus dit gaf false en je kreeg alleen
  // "X staat niet in de opstelling van kwart N" — gemeten, er gebeurde niets, en de ploeg bleef op
  // zeven. Terugvallen op de plek die hij net vrijmaakte (zijn x/y staan er nog, enkel onField is
  // uitgezet) maakt de wissel precies wat de gebruiker bedoelt: de invaller neemt zijn plaats.
  // Staat er in de doelopstelling intussen al iemand op die plek, dan is dit géén wissel meer en
  // blijft het antwoord false — dan hoort het scherm dat te zeggen i.p.v. iemand te verdringen.
  if (!plaats) {
    const pOut = (m.players || []).find(p => p.id === outId);
    if (pOut && typeof pOut.x === 'number') {
      const code = spelerGridCode(pOut);
      const bezet = doel.some(e => code ? spelerGridCode(e) === code : (e.x === pOut.x && e.y === pOut.y));
      if (!bezet) plaats = { x: pOut.x, y: pOut.y, line: pOut.line, posNum: pOut.posNum, posCodeVeld: code || null };
    }
  }
  if (!plaats) return false;
  _pasNextLineupAan(m, doel.filter(e => e.id !== outId && e.id !== inId).concat([
    { id: inId, x: plaats.x, y: plaats.y, line: plaats.line, posNum: plaats.posNum, posCodeVeld: plaats.posCodeVeld },
  ]));
  return true;
}
// Twee spelers van plaats laten ruilen in de doelopstelling.
function pauzeRuilInDoel(m, aId, bId) {
  const doel = nextLineupOf(m);
  const a = doel.find(e => e.id === aId), b = doel.find(e => e.id === bId);
  if (!a || !b) return false;
  const t = { x: a.x, y: a.y, line: a.line, posNum: a.posNum, posCodeVeld: a.posCodeVeld };
  a.x = b.x; a.y = b.y; a.line = b.line; a.posNum = b.posNum; a.posCodeVeld = b.posCodeVeld;
  b.x = t.x; b.y = t.y; b.line = t.line; b.posNum = t.posNum; b.posCodeVeld = t.posCodeVeld;
  _pasNextLineupAan(m, doel);
  return true;
}
// Eén speler naar een (lege) plek in de doelopstelling. Staat er al iemand, dan neemt die de oude
// plaats over — zelfde uitkomst als tikken op het veld, en nooit twee shirts op één plek.
function pauzeVerhuisInDoel(m, aId, code) {
  const plek = gridPlek(code);
  const doel = nextLineupOf(m);
  const a = doel.find(e => e.id === aId);
  if (!plek || !a) return false;
  const bewoner = doel.find(e => e.id !== aId && e.x === plek.x && e.y === plek.y);
  if (bewoner) { bewoner.x = a.x; bewoner.y = a.y; bewoner.line = a.line; bewoner.posNum = a.posNum; bewoner.posCodeVeld = a.posCodeVeld; }
  a.x = plek.x; a.y = plek.y; a.line = plek.line;
  a.posNum = matchGridNummer(m, plek.code) || '';
  a.posCodeVeld = plek.code;
  _pasNextLineupAan(m, doel);
  return true;
}
// Wat er niet klopt aan de doelopstelling zoals ze nu staat. Bewust niet opgeslagen: het is een
// vaststelling over de huidige stand, geen gegeven van de wedstrijd.
function nextLineupProblemen(m) {
  return lineupToPending(m, huidigVeldEntries(m), nextLineupOf(m)).problemen;
}
// ---- De drie startpunten ----
async function nextLineupUitPlan(deel) {
  const plan = ((match.plannedLineups || {})[deel] || []);
  if (!plan.length) return;
  _lineupSel = null;
  await bewaarNextLineup(match, plan.map(e => ({ ...e })), `Opstelling uit je plan voor ${pSingLow(match)} ${deel}.`);
}
async function nextLineupZoalsNu() {
  _lineupSel = null;
  await bewaarNextLineup(match, huidigVeldEntries(match), 'Dezelfde opstelling als nu.');
}
function confirmNextLineupLeeg() {
  const aantal = nextLineupOf(match).length;
  openModal(`<h3>${icI(IC.shirt)} Leeg veld?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Het veld gaat leeg en je zet iedereen opnieuw op zijn plaats. Handig als er in de pauze veel verandert: je bouwt de opstelling op zoals bij de aftrap, in plaats van ${aantal} spelers één voor één te verschuiven.</p>
    <button class="btn btn-green" onclick="nextLineupLeeg()">${icI(IC.check)} Ja, leeg veld</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function nextLineupLeeg() {
  _lineupSel = null;
  closeModal();
  // Meteen naar het tabblad Opstelling: daar staat het lege veld dat je nu gaat vullen. Vanaf het
  // pauzekaartje op het tabblad Wedstrijd zou je anders een leeg veld maken dat je niet ziet.
  tab = 'opstelling';
  await bewaarNextLineup(match, [], 'Leeg veld — tik een speler en dan een plaats.');
}
// ---- De wachter vóór "Start kwart X" (zie startQuarter) ----
// Waar = er is iets mis en de modal staat open; startQuarter() breekt dan af. De vraag is telkens
// dezelfde: ja = starten (met plan of gewoon toch), nee = naar het opstellingsveld om het te
// herstellen. Een leeg veld ZONDER plan kan niet gestart worden — dat is nooit de bedoeling.
function startControleModal() {
  const volgend = match.currentQuarter + 1;
  const doel = nextLineupOf(match);
  const plaatsen = veldPlaatsenNu(match);
  if (doel.length && doel.length === plaatsen) return false;
  const naarOpstelling = `<button class="btn btn-gray" style="margin-top:8px" onclick="closeModal();setTab('opstelling')">Nee, naar de opstelling</button>`;
  if (!doel.length) {
    const heeftPlan = ((match.plannedLineups || {})[volgend] || []).length > 0;
    openModal(`<h3>${icI(IC.warn)} Je veld is leeg</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">${pSing(match)} ${volgend} zou zonder spelers starten.${heeftPlan
        ? ` Wil je starten met je geplande opstelling voor ${pSingLow(match)} ${volgend}?`
        : ` Zet eerst je spelers op het veld op het tabblad Opstelling.`}</p>
      ${heeftPlan
        ? `<button class="btn btn-green" onclick="startMetPlan(${volgend})">${icI(IC.check)} Ja, start volgens plan</button>${naarOpstelling}`
        : `<button class="btn btn-orn" onclick="closeModal();setTab('opstelling')">${icI(IC.shirt)} Naar de opstelling</button>`}`);
    return true;
  }
  openModal(`<h3>${icI(IC.warn)} ${doel.length} ${doel.length === 1 ? 'speler' : 'spelers'} op een veld voor ${plaatsen}</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">${pSing(match)} ${volgend} start met ${doel.length < plaatsen ? 'minder spelers dan er plaats is' : 'meer spelers dan er plaats is'}. Dat mag — maar is het de bedoeling?</p>
    <button class="btn btn-green" onclick="closeModal();startQuarter(true)">${icI(IC.check)} Ja, zo starten</button>
    ${naarOpstelling}`);
  return true;
}
async function startMetPlan(deel) {
  closeModal();
  await nextLineupUitPlan(deel);
  await startQuarter(true);
}
// ---- Tikken op het veld en de bank ----
// Vier mogelijkheden, en elk is een wijziging van de doelopstelling zelf:
//   speler op het veld + lege plek   -> hij verhuist daarnaartoe
//   speler op het veld + andere speler op het veld -> ze ruilen van plaats
//   bankspeler + lege plek           -> hij komt daar staan
//   bankspeler + speler op het veld  -> hij neemt die plaats over, de ander gaat naar de bank
// Anders dan voordien mag een bankspeler nu WEL op een lege plek: bij een leeg veld is dat de enige
// manier om te beginnen. De spelregel achter het oude verbod (na rood speel je met een man minder)
// zit waar ze hoort — magOpHetVeld() houdt een uitgesloten speler tegen, en de telling hieronder
// waarschuwt als je er te veel op zet.
function lineupTap(kind, id) {
  const m = match;
  const sel = _lineupSel;
  if (sel && sel.id === id) { _lineupSel = null; render(); return; }   // zelfde speler = deselecteren
  const doel = nextLineupOf(m);
  if (kind === 'plek') {
    const plek = gridPlek(id);
    if (!plek) return;
    if (!sel) { showToast('Tik eerst de speler die je daar wil zetten.', 'err'); return; }
    const speler = m.players.find(p => p.id === sel.id);
    if (!speler) { _lineupSel = null; render(); return; }
    if (!magNogMeedoen(m, speler, (m.currentQuarter || 0) + 1)) {
      showToast(`${fieldName(m, speler.id)} kan niet op het veld.`, 'err');
      _lineupSel = null; render(); return;
    }
    _lineupSel = null;
    const nieuw = doel.filter(e => e.id !== speler.id);
    nieuw.push({ id: speler.id, x: plek.x, y: plek.y, line: plek.line,
                 posNum: matchGridNummer(m, plek.code) || '', posCodeVeld: plek.code });
    return bewaarNextLineup(m, nieuw);
  }
  if (!sel) { _lineupSel = { kind, id }; render(); return; }
  // Twee bankspelers na elkaar: de tweede wordt de keuze (de eerste stond nog op niets te wachten).
  if (sel.kind === 'bench' && kind === 'bench') { _lineupSel = { kind, id }; render(); return; }
  _lineupSel = null;
  if (sel.kind === 'field' && kind === 'field') {
    // Ruilen van plaats: de twee vakjes wisselen van bewoner.
    const a = doel.find(e => e.id === sel.id), b = doel.find(e => e.id === id);
    if (!a || !b) { render(); return; }
    const t = { x: a.x, y: a.y, line: a.line, posNum: a.posNum, posCodeVeld: a.posCodeVeld };
    a.x = b.x; a.y = b.y; a.line = b.line; a.posNum = b.posNum; a.posCodeVeld = b.posCodeVeld;
    b.x = t.x; b.y = t.y; b.line = t.line; b.posNum = t.posNum; b.posCodeVeld = t.posCodeVeld;
    return bewaarNextLineup(m, doel);
  }
  // Een van de twee komt van de bank: die neemt de plaats van de ander over.
  const bankId = sel.kind === 'bench' ? sel.id : id;
  const veldId = sel.kind === 'bench' ? id : sel.id;
  const bankSpeler = m.players.find(p => p.id === bankId);
  if (!bankSpeler || !magNogMeedoen(m, bankSpeler, (m.currentQuarter || 0) + 1)) {
    showToast(`${fieldName(m, bankId)} kan niet op het veld.`, 'err');
    render(); return;
  }
  const plaats = doel.find(e => e.id === veldId);
  if (!plaats) { render(); return; }
  const nieuw = doel.filter(e => e.id !== veldId && e.id !== bankId);
  nieuw.push({ id: bankId, x: plaats.x, y: plaats.y, line: plaats.line, posNum: plaats.posNum, posCodeVeld: plaats.posCodeVeld });
  return bewaarNextLineup(m, nieuw);
}
// Iemand van het veld halen zonder vervanger. Voor de speler die de wedstrijd verlaat, en om een
// plaats vrij te maken als je met een man minder speelt.
async function lineupVanHetVeld(spelerId) {
  _lineupSel = null;
  await bewaarNextLineup(match, nextLineupOf(match).filter(e => e.id !== spelerId));
}
// Het pauzescherm in het tabblad Opstelling. Sinds v0.49.0 tekent dit de DOELOPSTELLING van het
// volgende deel (m.nextLineup) en niets anders: wat hier op het veld staat, is wat er straks
// gebeurt. Bovenaan de drie startpunten, want bij de jeugd verandert er in de pauze zoveel dat
// verschuiven vanaf de vorige opstelling meer werk is dan opnieuw opzetten.
function pauseLineupHtml(m) {
  const deel = m.currentQuarter + 1;
  const doel = nextLineupOf(m);
  const mins = calcMinutes(m);
  const opVeld = new Set(doel.map(e => e.id));
  // Het veld tekent de doelopstelling: de speler met zijn plek uit die opstelling.
  const on = doel.map(e => {
    const p = m.players.find(x => x.id === e.id);
    return p ? { ...p, ...e, onField: true } : null;
  }).filter(Boolean);
  // magNogMeedoen: wie vertrokken is hoort niet op de bank van het volgende blok — en stond daar
  // met zijn lage speeltijd zelfs bovenaan.
  const bench = m.players.filter(p => !opVeld.has(p.id) && magNogMeedoen(m, p, deel))
    .sort((a, b) => (mins[a.id]?.ms || 0) - (mins[b.id]?.ms || 0));
  const mm = id => playedMin(mins[id]?.ms);
  const selId = _lineupSel ? _lineupSel.id : null;
  const selVeld = _lineupSel && _lineupSel.kind === 'field' ? _lineupSel.id : null;
  const nSubs = (m.pendingSubs || []).length, nSwaps = (m.pendingPosSwaps || []).length;
  const plaatsen = veldPlaatsenNu(m);
  const heeftPlan = ((m.plannedLineups || {})[deel] || []).length > 0;
  const problemen = nextLineupProblemen(m);
  // De telling apart van de problemen: dit is het ene dat je vlak voor de aftrap wil zien.
  const telWarn = doel.length !== plaatsen
    ? `<div style="font-size:13px;color:#b45309;background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:8px 10px;margin-top:10px">${icI(IC.warn)} Je zet <b>${doel.length} ${doel.length === 1 ? 'speler' : 'spelers'}</b> op een veld voor <b>${plaatsen}</b>. Dat mag — je speelt dan met ${doel.length < plaatsen ? 'een man minder' : 'een man te veel'} — maar kijk het even na.</div>`
    : '';
  return `
    <div class="card" style="border-left:4px solid var(--org)">
      <div class="sec" style="margin-top:0">${icI(IC.shirt)} Opstelling voor ${pSingLow(m)} ${deel}</div>
      ${/* Drie startpunten. "Zoals nu" is geen lege handeling: het gooit weg wat je klaarzette en
           begint opnieuw van de opstelling waarmee het vorige deel eindigde. */ ''}
      <div class="wiz-nav" style="margin-bottom:10px;gap:6px;flex-wrap:wrap">
        ${heeftPlan ? `<button class="btn btn-orgpale btn-sm" style="flex:1;min-width:110px" onclick="nextLineupUitPlan(${deel})">${icI(IC.clipboard)} Opstellen volgens plan</button>` : ''}
        <button class="btn btn-pale btn-sm" style="flex:1;min-width:110px" onclick="nextLineupZoalsNu()">${icI(IC.undo)} Herneem einde ${pSingLow(m)} ${deel - 1}</button>
        <button class="btn btn-pale btn-sm" style="flex:1;min-width:110px" onclick="confirmNextLineupLeeg()">${icI(IC.eraser)} Maak veld leeg</button>
      </div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Dit veld <b>is</b> de opstelling van ${pSingLow(m)} ${deel}. Tik een speler en dan een <b>lege plaats</b> om hem te verzetten, of tik <b>twee spelers</b> om ze te laten ruilen. Een <b>bankspeler</b> en dan iemand op het veld wisselt hen om.</p>
      ${/* plek: true → de vrije roosterplekken zijn hier aantikbaar. Enkel in dit bewerkscherm; het
           plaatje van het plan eronder en het veld van een kijker tonen alleen de opstelling. */ ''}
    ${renderPitch(m, on, captainAtStartOfQuarter(m, deel), null, { fn: 'lineupTap', selId, plek: true })}
      ${selVeld ? `<button class="btn btn-orgpale btn-sm" style="margin-top:10px;width:100%" onclick="lineupVanHetVeld('${selVeld}')">${icI(IC.close)} ${esc(fieldName(m, selVeld))} van het veld halen</button>` : ''}
      ${telWarn}
      <div class="sec">Bank (${bench.length}) <span style="color:var(--txt2);font-weight:400;text-transform:none">· minst gespeeld eerst</span></div>
      <div class="place-chips">${bench.length
        ? bench.map(p => `<span class="place-chip ${selId === p.id ? 'sel' : ''}" onclick="lineupTap('bench','${p.id}')">${numSpan(p, 'pcn')}${esc(fieldName(m, p.id))} <small style="opacity:.7;margin-left:4px">${mm(p.id)}'</small></span>`).join('')
        : '<span style="color:var(--txt2);font-size:14px">Niemand op de bank.</span>'}</div>
      ${/* GEEN wissellijst meer (herontwerp 22-08-2026): de afgeleide wissels opsommen — met
           verwijderknoppen — was dubbel gereedschap naast het veld zelf, en niemand had ze
           ingegeven. Het veld is de waarheid; één zin zegt wat de app ermee doet. */ ''}
      <p style="font-size:13px;color:var(--txt2);margin-top:10px">${(nSubs || nSwaps)
        ? `De app zorgt ervoor dat ${pSingLow(m)} ${deel} start met het veld hierboven.`
        : `Niets te wijzigen — ${pSingLow(m)} ${deel} start met dezelfde opstelling als nu.`}</p>
      ${problemen.length ? `<div style="font-size:12px;color:#b45309;background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:8px 10px;margin-top:10px">${icI(IC.warn)} ${problemen.map(esc).join('<br>')}</div>` : ''}
      <button class="btn btn-gray btn-sm" style="width:100%;margin-top:12px" onclick="setTab('wedstrijd')">‹ Terug naar de wedstrijd</button>
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
  // Zelfde regel als in het voorbereidingsscherm: het plan voor de komende delen is enkel voor
  // beheerders. Hier weegt dat nog zwaarder — dit toont net wat er nog gaat gebeuren. Pas ná de
  // controles hierboven, anders krijgt een kijker de melding ook bij een wedstrijd zonder plan.
  if (!canLive()) {
    return `<div class="sec">Planning</div>
      <div class="card"><p style="margin:0;color:var(--txt2);font-size:14px;text-align:center">${icI(IC.eye)} De opstelling en geplande wissels zijn enkel zichtbaar voor ploegbeheerders.</p></div>`;
  }
  const delen = Array.from({ length: totaal - vanaf + 1 }, (_, i) => vanaf + i);
  // Binnen hetzelfde deel blijft staan waar je naartoe bladerde; zodra het spel een deel opschuift
  // springt de kaart terug naar wat er nú aankomt — dat is waar je in de pauze naar wil kijken.
  if (_planLiveVanaf !== vanaf) { _planLiveVanaf = vanaf; _planLiveQ = vanaf; }
  _planLiveQ = Math.min(Math.max(_planLiveQ, vanaf), totaal);
  const slide = q => {
    const lijst = plannedLineupBase(m, q);
    const opVeld = new Set(lijst.map(p => p.id));
    const bank = sortedByName((m.players || []).filter(p => magOpHetVeld(m, p) && !opVeld.has(p.id)));
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
    ${canLive() ? `<button class="btn btn-gray" style="margin-top:8px" onclick="exportWedstrijdplanPDF()">${icI(IC.download)} Wedstrijdplan (PDF)</button>` : ''}`;
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
  if (!canLive()) return;
  const m = match;
  const plan = ((m.plannedLineups || {})[deel] || []);
  if (!plan.length) return;
  // GEEN wisselopsomming meer (herontwerp 22-08-2026): de opgesomde "pauzewissels" had niemand
  // ingegeven en ze lazen als iets dat je moest nakijken. De vraag is simpel — wil je dit deel
  // starten volgens je plan? — en het resultaat bekijk je op het veld. Enkel wat er níet kan
  // (afwezige of uitgesloten spelers uit het plan) wordt nog gemeld, want dat moet je wél weten.
  const huidig = playersOnField(m).map(p => ({ id: p.id, x: p.x, y: p.y, line: p.line, posNum: p.posNum }));
  const diff = lineupToPending(m, huidig, plan);
  const alGelijk = !diff.subs.length && !diff.swaps.length;
  openModal(`<h3>${icI(IC.clipboard)} ${pSing(m)} ${deel} volgens je plan?</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${alGelijk
      ? `De opstelling voor ${pSingLow(m)} ${deel} staat al klaar zoals in het wedstrijdplan.`
      : `${pSing(m)} ${deel} start dan met de opstelling uit je plan. Je ziet en wijzigt ze op het tabblad <b>Opstelling</b>.`}</p>
    ${diff.problemen.length ? `<div style="font-size:12px;color:#b45309;background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:8px 10px;margin-bottom:10px;text-align:left">${icI(IC.warn)} ${diff.problemen.map(esc).join('<br>')}</div>` : ''}
    ${alGelijk ? '' : `<button class="btn btn-green" onclick="doUsePlannedLineup(${deel})">${icI(IC.check)} Ja, volgens het plan</button>`}
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">${alGelijk ? 'Sluiten' : 'Annuleren'}</button>`);
}
async function doUsePlannedLineup(deel) {
  if (!canLive()) return;
  const m = match;
  const plan = ((m.plannedLineups || {})[deel] || []);
  if (!plan.length) return;
  // Sinds v0.49.0 loopt dit langs de doelopstelling, net als elke tik op het veld: het plan wordt
  // de opstelling van het volgende deel, en de wissels zijn daar de afgeleide van. Zo is er één
  // weg naar één waarheid, in plaats van twee plekken die pendingSubs zetten.
  // GEEN eigen _eventBusy-blokkering hier: bewaarNextLineup zet die zelf, en twee keer zetten zou
  // de tweede meteen laten afhaken — dan deed deze knop niets.
  _lineupSel = null;
  closeModal();
  await bewaarNextLineup(m, plan.map(e => ({ ...e })), `${pSing(m)} ${deel} start volgens je plan — bekijk het veld op het tabblad Opstelling.`);
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
  // 'paused' hoort hier bij 'running' (audit 24-08-2026): de klok staat stil, maar het deel is bezig.
  // Zonder deze regel weigerde "Doorvoeren" tijdens een klokpauze met "kan zodra een deel bezig is",
  // terwijl een stilstaand spel juist HET moment is om te wisselen (blessure, fluitsignaal).
  if (m.quarterStatus === 'running' || m.quarterStatus === 'paused') return 'live';
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
    if (pl && pl.length) return plannedLineupPlayers(m, pl).filter(p => magOpHetVeld(m, p));
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
  if (isUitgesloten(m, s.inId)) return `${pName(m, s.inId)} is uitgesloten (rode kaart) en mag niet meer op het veld.`;
  if (isVertrokken(m, s.inId)) return `${pName(m, s.inId)} heeft de wedstrijd verlaten.`;
  if (!veld.has(s.outId)) return `${pName(m, s.outId)} staat niet op het veld.`;
  if (veld.has(s.inId)) return `${pName(m, s.inId)} staat al op het veld.`;
  return null;
}
// Een geplande positiewissel bewaart een PLEK, niet de speler die daar toevallig stond toen je het
// plande. Wie de tegenpartij is, blijkt pas op het moment van doorvoeren: staat er intussen iemand
// anders op die plek — bijvoorbeeld omdat een eerdere wissel uit hetzelfde kwart al doorgevoerd is —
// dan is dát de speler die ruilt, en staat er niemand, dan verhuist hij gewoon.
// Drie vormen, alle drie in gebruik: naarPlek (v0.34.0, een roostercode, de enige die ook een LEGE
// plek kan aanduiden), naarPos (v0.22.0, een positienummer) en een vaste pB (het oudste).
function plannedSwapDoelId(m, s, veldLijst) {
  if (s.pB) return s.pB;
  const veld = veldLijst || effectiveOnField(m);
  if (s.naarPlek) {
    const t = veld.find(p => spelerGridCode(p) === s.naarPlek);
    return t ? t.id : null;
  }
  if (!s.naarPos) return null;
  const t = veld.find(p => String(p.posNum) === String(s.naarPos));
  return t ? t.id : null;
}
// Welke roosterplek draagt dit positienummer? Enkel nodig om een plan van vóór v0.34.0 bij het
// bewerken naar een plek om te zetten. Eerst de plek waar iemand met dat nummer staat, anders de
// tabel van de gekozen formatie.
function _plekVanNummer(m, num) {
  const staand = effectiveOnField(m).find(p => String(p.posNum) === String(num));
  if (staand) { const c = spelerGridCode(staand); if (c) return c; }
  const tabel = formatieNummers(m.matchType, m.formation) || {};
  return Object.keys(tabel).find(code => String(tabel[code]) === String(num)) || null;
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
    // magOpHetVeld dekt ook een uitgesloten invaller: die blijft eraf, dus de plaats blijft leeg.
    if (idx < 0 || !inn || !magOpHetVeld(m, inn) || veld.some(p => p.id === s.inId)) continue;
    veld[idx] = Object.assign({}, inn, { x: veld[idx].x, y: veld[idx].y, line: veld[idx].line, posNum: veld[idx].posNum });
  }
  if (tot && tot.soort === 'sub') return veld;
  const nSwaps = (tot && tot.soort === 'swap') ? tot.index : swaps.length;
  for (let i = 0; i < nSwaps; i++) {
    const s = swaps[i];
    const a = veld.find(p => p.id === s.pA);
    const bId = plannedSwapDoelId(m, s, veld);
    const b = bId ? veld.find(p => p.id === bId) : null;
    if (!a) continue;
    // Bestemming leeg: geen ruil maar een verhuizing. Enkel mogelijk bij een plan dat een roosterplek
    // bewaart — een plan met een positienummer weet niet wélke plek het bedoelde als er niemand staat.
    if (!b && s.naarPlek) { const plek = gridPlek(s.naarPlek); if (plek) zetOpGridPlek(a, plek, m); continue; }
    if (!b || a === b) continue;
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
  if (!doelId) {
    // Een lege bestemming is bij een roosterplek geen probleem: dan verhuist hij er zonder ruil naartoe.
    if (s.naarPlek) return gridPlek(s.naarPlek) ? null : 'Die plek bestaat niet meer.';
    return s.naarPos ? `Er staat niemand op positie ${s.naarPos}.` : 'De tegenpartij zit niet meer in de selectie.';
  }
  if (!m.players.find(p => p.id === doelId)) return 'De tegenpartij zit niet meer in de selectie.';
  if (doelId === s.pA) return `${pName(m, s.pA)} staat daar al.`;
  if (!veld.has(doelId)) return `${pName(m, doelId)} staat niet op het veld.`;
  return null;
}
function plannedCount(m) { return ((m && m.plannedSubs) || []).length + ((m && m.plannedPosSwaps) || []).length; }
// Enkel wat aan een BLOK hangt (audit 23-08-2026). Het telletje op "Opstelling en wissels per kwart"
// gebruikte plannedCount, dus álles — ook de wissels zonder vast blok, die in een eigen knop eronder
// staan. Twee losse plus één in kwart 2 las dan als "(3 wissels)" naast "(2)": vijf voor drie, en het
// scherm dat die knop opent toonde er één, want daar staat per blok alleen wat aan dat blok hangt.
// plannedCount blijft bestaan voor waar het totaal juist is (zie confirmClearSelectie: "dit wist 3
// geplande wissels").
function plannedCountPerDeel(m) {
  const heeftDeel = s => !!s.quarterNum;
  return ((m && m.plannedSubs) || []).filter(heeftDeel).length + ((m && m.plannedPosSwaps) || []).filter(heeftDeel).length;
}
// Hoe een geplande positiewissel leest: de PLEK waar hij naartoe gaat. Bewust ZONDER "nu speler X"
// erachter — wie daar staat wordt pas bij het doorvoeren bepaald, dus die naam was een momentopname
// die bovendien wegviel zodra de plek (nog) niet bezet was. Dat las als een grillig detail.
function plannedSwapTekst(m, s) {
  if (s.naarPlek) return `<b>${esc(pName(m, s.pA))}</b> <span style="color:var(--txt2)">naar</span> <b>${esc(matchGridLabel(m, s.naarPlek))}</b>`;
  if (!s.naarPos) {
    // Oudere vorm met een vaste tegenpartij: toon waar allebei belanden i.p.v. "A wisselt met B".
    const b = m.players.find(p => p.id === s.pB), a = m.players.find(p => p.id === s.pA);
    if (a && b && a.posNum && b.posNum) {
      const cA = posCode(b.posNum, m.matchType), cB = posCode(a.posNum, m.matchType);
      return `<b>${esc(pName(m, s.pA))}</b> <span style="color:var(--txt2)">naar</span> <b>${esc(String(b.posNum) + (cA ? ' ' + cA : ''))}</b> <span style="color:var(--txt2)">·</span> <b>${esc(pName(m, s.pB))}</b> <span style="color:var(--txt2)">naar</span> <b>${esc(String(a.posNum) + (cB ? ' ' + cB : ''))}</b>`;
    }
    return `<b>${esc(pName(m, s.pA))}</b> <span style="color:var(--txt2)">wisselt met</span> ${esc(pName(m, s.pB))}`;
  }
  const code = posCode(s.naarPos, m.matchType);
  return `<b>${esc(pName(m, s.pA))}</b> <span style="color:var(--txt2)">naar positie</span> <b>${esc(String(s.naarPos))}</b>${code ? ` <span style="color:var(--txt2)">(${esc(code)})</span>` : ''}`;
}
// Welk tabblad staat open in "Wissels plannen": een deelnummer, of 0 voor "Altijd" (wissels zonder
// vast deel). Wordt bij het openen gezet op het deel dat nu aan de beurt is.
let _planDeelTab = null;
let _planDeelTabBasis = null;   // bij welk "huidig deel" de keuze hoort — zie modalPlannedSubs
function modalPlannedSubs(tab) {
  const m = match; if (!m) return;
  const mode = plannedRunMode(m);
  const totaal = plannedPartsCount(m);
  // Het gekozen tabblad plakte over de kwarten heen: wie het in kwart 2 opende, kreeg het in kwart 3
  // nog steeds op kwart 2 — en omdat de "Nu"-knoppen enkel op het HUIDIGE deel staan, leek er dan
  // geen enkele wissel doorvoerbaar. Zodra de wedstrijd een deel opgeschoven is, springt de keuze
  // terug naar het deel dat nu aan de beurt is.
  const huidig = plannedHuidigDeel(m);
  if (_planDeelTabBasis !== huidig) { _planDeelTab = null; _planDeelTabBasis = huidig; }
  if (tab !== undefined && tab !== null) _planDeelTab = tab;
  if (_planDeelTab === null) _planDeelTab = Math.min(Math.max(1, huidig || 1), totaal);
  const actief = _planDeelTab;
  const hoort = s => (actief ? s.quarterNum === actief : !s.quarterNum);
  const subs = (m.plannedSubs || []).filter(hoort), swaps = (m.plannedPosSwaps || []).filter(hoort);
  // Sinds v0.20.0 geef je een volledige opstelling per deel in met de planning. Dit scherm blijft
  // voor de losse wissel die je MIDDEN in een deel wil doen ("na een kwartier gaat X eruit") — dat
  // is precies wat een opstelling per deel niet kan uitdrukken. Vandaar de verwijzing hieronder:
  // zonder dat leek dit een tweede, concurrerende manier om hetzelfde te doen.
  // Doorvoeren kan enkel terwijl er een deel LOOPT. In de pauze regel je de opstelling op het
  // tabblad Opstelling — een doorvoerknop hier was dubbel gereedschap en stond bovendien al
  // klikbaar voor een deel dat nog moet beginnen (gemeld 22-08-2026).
  const kanDoorvoeren = mode === 'live';
  const uitleg = mode === 'live' ? 'Doorvoeren wordt meteen een wissel in het verloop.'
    : mode === 'break' ? `Nu is het pauze: de opstelling van ${pSingLow(m)} ${m.currentQuarter + 1} regel je op het tabblad <b>Opstelling</b>. Doorvoeren kan weer zodra dat ${pSingLow(m)} loopt.`
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
      ${(kanDoorvoeren && !probleem && nuAanDeBeurt) ? `<button class="btn btn-green btn-sm" style="width:auto;padding:4px 10px;font-size:12px;margin:0 6px 0 0;flex-shrink:0" onclick="${runFn}">Nu</button>` : ''}
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
  // De pauze-afgeleiden ("gaat automatisch bij de start") staan hier NIET meer: sinds het veld op
  // het tabblad Opstelling zélf de opstelling van het volgende deel is, is dat de enige plek waar
  // je die bekijkt en wijzigt. Hier stonden ze nog eens, mét een verwijderknop — dubbel gereedschap
  // dat het veld en deze lijst uit elkaar kon laten lopen (gemeld 22-08-2026).
  const aantal = subs.length + swaps.length;
  openModal(`<h3>${icI(IC.clipboard)} Wissels plannen</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:8px">${waarvoor}</p>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${uitleg}</p>
    ${tabs}
    <div class="sec" style="margin-top:0">${actief ? `Klaargezet voor ${pSingLow(m)} ${actief}` : 'Zonder vast deel'} <span style="color:var(--txt2);font-weight:400;text-transform:none">(jij kiest wanneer)</span></div>
    <div id="gw-lijst">${lijst || `<p style="color:var(--txt2);font-size:13px;padding:4px 0">Nog niets klaargezet${actief ? ` voor ${pSingLow(m)} ${actief}` : ''}.</p>`}</div>
    ${/* Alles ineens: eerst de wissels, dan de positiewissels — zie runAllPlanned. Enkel zichtbaar
         als er meer dan één ding klaarstaat; voor één regel volstaat de knop "Nu" ernaast. */ ''}
    ${(kanDoorvoeren && nuAanDeBeurt && aantal > 1) ? `<button class="btn btn-green btn-sm" style="margin-top:10px" onclick="runAllPlanned(${actief})">${icI(IC.check)} Alle ${aantal} doorvoeren</button>` : ''}
    ${/* Geen "+ Positiewissel" meer: wie er bij de START van een deel waar staat, teken je op het
         veld (Planning/Opstelling), en de app rekent de verschuivingen uit. Een positiewissel apart
         klaarzetten was gereedschap uit het oude model — Tims vaststelling van 22-08-2026. Bestaande
         klaargezette positiewissels blijven hierboven gewoon zichtbaar, aanpasbaar en uitvoerbaar. */ ''}
    <button class="btn btn-pale btn-sm" style="margin-top:10px" onclick="modalPlanSub(null,false,${actief})">${icI(IC.swap)} + Wissel klaarzetten</button>
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Sluiten</button>`);
}
// Kiezers voor het klaarzetten/aanpassen. Zonder id = nieuw, met id = bestaande aanpassen.
let _planSel = { a: null, b: null, editId: null };
// Waar je vandaan kwam, bepaalt waar je na opslaan of annuleren weer belandt: null = het menu
// 'Wissels plannen', 'prep' = de planningskaart in het wedstrijdscherm, 'planner' = de
// opstellingsplanner. Zonder dit belandde je telkens in een menu dat je nooit geopend had. Zelfde
// idee als _settingsFrom bij de instellingen.
let _planSubBron = null;
function planSubTerug(deel) {
  const bron = _planSubBron;
  _planSubBron = null;
  if (bron === 'planner') {
    // Terug in de planner, op het deel waar je mee bezig was. De opstelling zelf staat al opgeslagen
    // (planSubOpen schrijft de werkkopie weg vóór dit scherm opent), dus een verse werkkopie is juist.
    _planLineupDraft = {};
    modalPlannedLineups(deel || _planLineupQ);
    return;
  }
  if (bron === 'prep') {
    // Koos je in de modal alsnog een ander deel, dan volgt de kaart mee: anders sla je iets op dat
    // je daarna nergens ziet staan.
    if (deel) _prepPlanQ = deel;
    closeModal(); render();
    return;
  }
  modalPlannedSubs(deel);
}
// De drie ingangen vanuit de planningskaart en uit de planner: aanpassen, verwijderen, toevoegen.
// Vanuit de planner staat er mogelijk nog een onopgeslagen opstelling open; die gaat eerst naar de
// databank, want de schermen hieronder slaan zelf op en zouden ze anders overschrijven.
async function planSubOpen(bron) {
  _planSubBron = bron === 'planner' ? 'planner' : (bron === 'prep' ? 'prep' : null);
  if (bron === 'planner') { await _schrijfPlanDraft(); _planLineupDraft = {}; }
}
async function planSubBewerk(id, soort, bron) {
  if (!canLive()) return;
  await planSubOpen(bron);
  if (soort === 'swap') modalPlanPosSwap(id); else modalPlanSub(id);
}
async function planSubNieuw(deel, soort, bron) {
  if (!canLive()) return;
  await planSubOpen(bron);
  if (soort === 'swap') modalPlanPosSwap(null, false, deel); else modalPlanSub(null, false, deel);
}
async function planSubWis(id, soort, bron) {
  if (!canLive()) return;
  if (_eventBusy) return; _eventBusy = true;
  try {
    if (bron === 'planner') { await _schrijfPlanDraft(); _planLineupDraft = {}; }
    if (soort === 'swap') match.plannedPosSwaps = (match.plannedPosSwaps || []).filter(s => s.id !== id);
    else match.plannedSubs = (match.plannedSubs || []).filter(s => s.id !== id);
    await dbSave(match); render();
    // In de planner blijft de modal openstaan: enkel de lijst eronder verandert.
    if (bron === 'planner') modalPlannedLineups();
  } finally { _eventBusy = false; }
}
function _preselect(containerId, id) {
  if (!id) return;
  const el = document.querySelector(`#${containerId} button[data-id="${id}"]`);
  if (el) gpSel(el);
}
function selPlan(vak, id, el, containerId) { _planSel[vak] = id; gpSelIn(containerId, el); }
// Bij het klaarzetten dragen de doelknoppen het POSITIENUMMER, niet het speler-id.
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
  const bank = sortedByName((m.players || []).filter(p => magOpHetVeld(m, p) && !veldIds.has(p.id)));
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
    <button class="btn btn-gray" style="margin-top:8px" onclick="planSubTerug()">Annuleren</button>`);
  _preselect('pl-a', _planSel.a); _preselect('pl-b', _planSel.b);
}
function modalPlanPosSwap(editId, behoud, deelVoorNieuw) {
  const m = match; if (!m) return;
  const best = editId ? (m.plannedPosSwaps || []).find(s => s.id === editId) : null;
  if (!behoud) {
    // Een oudere positiewissel droeg een vaste tegenpartij (pB); die tonen we als de plek waar die
    // speler stond, zodat bewerken hem meteen naar de nieuwe vorm omzet. Idem voor een plan met een
    // positienummer: we zoeken de plek die dat nummer nu draagt.
    const oudeP = (best && !best.naarPlek && best.pB) ? m.players.find(p => p.id === best.pB) : null;
    const oudePlek = oudeP ? spelerGridCode(oudeP) : (best && !best.naarPlek && best.naarPos ? _plekVanNummer(m, best.naarPos) : null);
    _planSel = { a: best ? best.pA : null, plek: best ? (best.naarPlek || oudePlek || null) : null, editId: editId || null, deel: best ? (best.quarterNum || null) : (deelVoorNieuw || null) };
  }
  const deel = _planSel.deel || null;
  // Een nieuwe positiewissel komt achteraan: alles wat je voor dit deel plande is dan al gebeurd.
  const veld = _planVeld(m);
  const veldIds = new Set(veld.map(p => p.id));
  if (_planSel.a && !veldIds.has(_planSel.a)) _planSel.a = null;
  if (_planSel.plek && !gridPlek(_planSel.plek)) _planSel.plek = null;
  openModal(`<h3>${icI(IC.compass)} Positiewissel klaarzetten</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Kies een speler en tik daarna op het veld de <b>plek</b> aan waar hij naartoe gaat. Staat daar op dat moment iemand, dan neemt die zijn plaats over — ook als dat door een eerdere wissel iemand anders geworden is. Is de plek dan leeg, dan verhuist hij er gewoon naartoe. ${planDeelUitleg(m, deel)}</p>
    ${planDeelSelHtml(m, deel, 'swap')}
    <div class="sec" style="margin-top:0">Welke speler verplaatst?</div>
    <div id="pl-a">${pgGrid(sortedByName(veld).map(p => pgBtn(p, 'pl-ab', `_planSpelerTap('${p.id}')`)).join(''))}</div>
    <div class="sec">Naar welke plek?</div>
    <div id="pl-plek">${renderPitch(m, veld, captainAtStartOfQuarter(m, deel || (m.currentQuarter + 1)), null, { fn: '_planDoelTap', selId: _planSel.a, plek: true, plekSel: _planSel.plek })}</div>
    <button class="btn btn-green" style="margin-top:12px" onclick="savePlanPosSwap()">${icI(IC.check)} ${editId ? 'Aanpassen' : 'Klaarzetten'}</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="planSubTerug()">Annuleren</button>`);
  _preselect('pl-a', _planSel.a);
}
// De opstelling zoals het veld in dit scherm ze toont: die van de start van het deel plus alles wat
// je voor datzelfde deel al plande. Niet de posities van nu.
function _planVeld(m) {
  const best = _planSel.editId ? (m.plannedPosSwaps || []).find(s => s.id === _planSel.editId) : null;
  return veldMetGeplandeWissels(m, _planSel.deel || null, best ? { soort: 'swap', index: _plannedIndex(m, best, 'swap') } : null);
}
// Een andere speler kiezen hertekent het veld: anders bleef het oranje kader om de vorige speler
// staan, en dan wees het veld iemand anders aan dan de knop eronder.
function _planSpelerTap(id) {
  _planSel.a = (_planSel.a === id) ? null : id;
  if (_planSel.plek && _planSel.a) {
    // Zijn eigen plek als bestemming zegt niets: dan blijft de bestemming leeg.
    const p = _planVeld(match).find(x => x.id === _planSel.a);
    if (p && spelerGridCode(p) === _planSel.plek) _planSel.plek = null;
  }
  modalPlanPosSwap(_planSel.editId, true);
}
// De bestemming aantikken op het veld. Een BEZETTE plek geeft de plek van die speler, niet zijn id:
// wie er straks staat, wordt pas bij het doorvoeren bepaald. Tik je de gekozen speler zelf aan, dan
// zou de bestemming zijn eigen plek zijn — dat negeren we.
function _planDoelTap(kind, id) {
  const m = match; if (!m) return;
  let plek = null;
  if (kind === 'plek') plek = id;
  else {
    if (id === _planSel.a) return;
    const p = _planVeld(m).find(x => x.id === id);
    plek = p ? spelerGridCode(p) : null;
  }
  if (!plek) return;
  _planSel.plek = (_planSel.plek === plek) ? null : plek;
  modalPlanPosSwap(_planSel.editId, true);
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
    await dbSave(match); render(); planSubTerug(deel || 0);
  } finally { _eventBusy = false; }
}
async function savePlanPosSwap() {
  if (!_planSel.a) { showToast('Kies wie er verplaatst.', 'err'); return; }
  if (!_planSel.plek) { showToast('Tik op het veld de plek aan waar hij naartoe gaat.', 'err'); return; }
  if (_eventBusy) return; _eventBusy = true;
  try {
    match.plannedPosSwaps = match.plannedPosSwaps || [];
    const deel = _planSel.deel || null;
    const plek = _planSel.plek;
    const best = _planSel.editId ? match.plannedPosSwaps.find(s => s.id === _planSel.editId) : null;
    // Een roostercode i.p.v. een positienummer of een vaste tegenspeler: wie er op die plek staat,
    // blijkt pas bij het doorvoeren, en een code duidt óók een lege plek eenduidig aan. De oudere
    // vormen worden bij het bewerken opgeruimd, anders zouden die voorrang houden.
    if (best) { best.pA = _planSel.a; best.naarPlek = plek; delete best.pB; delete best.naarPos; if (deel) best.quarterNum = deel; else delete best.quarterNum; }
    else match.plannedPosSwaps.push(Object.assign({ id: uid(), pA: _planSel.a, naarPlek: plek }, deel ? { quarterNum: deel } : {}));
    // Terug naar het tabblad van het deel waarvoor je zonet opsloeg: wijzigde je het kwart in de
    // keuzelijst, dan stond je anders naar een lijst te kijken waar hij niet in staat.
    await dbSave(match); render(); planSubTerug(deel || 0);
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
    // In de pauze bestaat "nu" niet: dan is doorvoeren hetzelfde als de doelopstelling aanpassen —
    // zie pauzeWisselInDoel. Rechtstreeks in de pendings schrijven zette iets klaar dat niet op het
    // pauzeveld stond en dat bij de eerstvolgende tik weer verdween.
    if (!pauzeWisselInDoel(match, s.outId, s.inId)) return `${pName(match, s.outId)} staat niet in de opstelling van het volgende ${pSingLow(match)}.`;
  } else {
    const pOut = match.players.find(p => p.id === s.outId), pIn = match.players.find(p => p.id === s.inId);
    // DE WERKELIJKHEID, NIET DE VOORSPELLING (audit 25-08-2026). plannedSubProbleem hierboven toetst
    // aan veldMetGeplandeWissels: het veld zoals het ZOU zijn met de andere klaargezette wissels
    // erbij. Dat is juist voor de knop (een wissel voor een later deel mag niet grijs staan), maar
    // niet voor het doorvoeren zelf. Stond de uitgaande speler in werkelijkheid al niet meer op het
    // veld, dan kopieerde de regel hieronder zijn VEROUDERDE plek naar de invaller — en die plek is
    // intussen van iemand anders. Gevolg: twee spelers op één plek.
    // Gevonden door de fuzzer (seed 7313: Fons ging er live af, daarna gaf "nu doorvoeren" zijn oude
    // plek aan Ilias, waar Jef stond). Bestond ook vóór de wijzigingen van vandaag — nagegaan door
    // dezelfde seed op de vorige versie te draaien.
    if (!pOut || !pOut.onField) return `${pName(match, s.outId)} staat niet meer op het veld.`;
    if (pIn && pIn.onField) return `${pName(match, s.inId)} staat al op het veld.`;
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
  // Lege bestemming: verhuizen zonder ruil. Dezelfde weg als een verhuizing die je ter plekke doet.
  if (!doelId) {
    if (!s.naarPlek || !gridPlek(s.naarPlek)) return 'Er staat niemand op die positie.';
    if (mode === 'break') {
      if (!pauzeVerhuisInDoel(match, s.pA, s.naarPlek)) return `${pName(match, s.pA)} staat niet in de opstelling van het volgende ${pSingLow(match)}.`;
    } else {
      const pA = match.players.find(p => p.id === s.pA);
      if (!pA) return 'Die speler zit niet meer in de selectie.';
      addEvent('posSwap', { pA: s.pA, pB: null, naarPlek: s.naarPlek, posA: { x: pA.x, y: pA.y, line: pA.line, posNum: pA.posNum } });
      zetOpGridPlek(pA, gridPlek(s.naarPlek), match);
      syncKeeper();
    }
    match.plannedPosSwaps = (match.plannedPosSwaps || []).filter(x => x.id !== s.id);
    return null;
  }
  if (mode === 'break') {
    if (!pauzeRuilInDoel(match, s.pA, doelId)) return 'Die spelers staan niet allebei in de opstelling van het volgende deel.';
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
  // 'paused' hoort hier bij 'running': het deel is bezig, enkel de klok staat stil (audit 24-08-2026).
  if (!canLive() || !match || (match.quarterStatus !== 'running' && match.quarterStatus !== 'paused')) return;
  const sel = _liveTapSel;
  if (sel && sel.id === id) { _liveTapSel = null; render(); return; }              // deselecteren
  // Een LEGE plek tijdens het spel: een speler die al op het veld staat verhuist ernaartoe. Van de
  // bank kan dat niet — dan is het een wissel, en na een rode kaart mag die plaats niet opgevuld
  // worden (zie veldPlaatsenNu).
  if (kind === 'plek') {
    if (!sel) { showToast('Tik eerst de speler die verplaatst.', 'err'); return; }
    if (sel.kind !== 'field') { showToast('Van de bank kan je enkel wisselen met een speler op het veld.', 'err'); _liveTapSel = null; render(); return; }
    const vast = sel.id; _liveTapSel = null; render();
    _postEventQuarter = null;
    return bevestigLiveVerhuis(vast, id);
  }
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
  // Expliciet géén doelplek: een ruil tussen twee spelers is nooit een verhuizing naar een lege
  // plek. Zonder dat wissen erfde deze ruil de doelplek van een eerdere verhuizing — zie
  // zetPosSwapKeuze().
  zetPosSwapKeuze(a, b, null);
  openModal(`<h3>${icI(IC.compass)} Positiewissel</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px"><b>${esc(pName(match, a))}</b> en <b>${esc(pName(match, b))}</b> wisselen van positie.</p>
    <button class="btn btn-green" onclick="confirmPosSwap()">${icI(IC.check)} Doorvoeren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Zelfde weg als bevestigLivePosSwap, maar met een lege plek als bestemming: posSwapDoel zetten en
// confirmPosSwap() laten lopen, die dan naar confirmPosVerhuis() doorschakelt. Geen tweede
// implementatie die uit elkaar kan groeien.
function bevestigLiveVerhuis(spelerId, code) {
  const plek = gridPlek(code); if (!plek) return;
  zetPosSwapKeuze(spelerId, null, code);
  openModal(`<h3>${icI(IC.compass)} Naar een vrije plek</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px"><b>${esc(pName(match, spelerId))}</b> gaat naar <b>${esc(matchGridLabel(match, code))}</b>.<br>Zijn oude plaats blijft leeg.</p>
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
    ${/* De uitleg BOVEN het veld, net als in de pauze: je leest eerst wat tikken doet en ziet dan
         het veld waar het gebeurt (Tim, 22-08-2026). */ ''}
    <div class="field-legend" style="margin-bottom:10px">Tik een <b>bankspeler</b> en dan een <b>speler op het veld</b> om te wisselen. Tik <b>twee spelers op het veld</b> om ze van positie te wisselen. Je krijgt telkens eerst een bevestiging.</div>
    ${/* plek: true → tijdens het spel een speler naar een vrije plek kunnen zetten (zie liveFieldTap). */ ''}
    ${renderPitch(m, on, m.captainId, null, { fn: 'liveFieldTap', selId, plek: true })}
    <div class="sec">Bank (${bench.length}) <span style="color:var(--txt2);font-weight:400;text-transform:none">· minst gespeeld eerst</span></div>
    <div class="place-chips">${bench.length
      ? bench.map(p => `<span class="place-chip ${selId === p.id ? 'sel' : ''}" onclick="liveFieldTap('bench','${p.id}')">${numSpan(p, 'pcn')}${esc(fieldName(m, p.id))} <small style="opacity:.7;margin-left:4px">${playedMin(mins[p.id] ? mins[p.id].ms : 0)}'</small></span>`).join('')
      : '<span style="color:var(--txt2);font-size:14px">Niemand op de bank.</span>'}</div>
  </div>`;
}
// posSwapDoel: een LEGE roosterplek als bestemming, i.p.v. een tweede speler. Dan is het geen ruil
// maar een verhuizing — de speler gaat naar die plek en zijn oude plaats blijft leeg. Dat is wat je
// na een rode kaart nodig hebt: de ploeg speelt met een man minder en je herschikt wie er nog staat.
let posSwapA = null, posSwapB = null, posSwapDoel = null;
// De keuze wordt ALTIJD in haar geheel gezet, nooit half. Dat is geen stijlkeuze maar een
// bugfix: posSwapDoel bleef staan na een verhuizing via het veld, en confirmPosSwap() begint met
// "is er een doelplek? dan is dit een verhuizing" — dus elke volgende positiewissel via het veld
// werd stil een verhuizing naar die oude plek, terwijl het venster een ruil beloofde. De speler
// belandde bovenop de bewoner van die plek en zijn tegenhanger bleef staan. Het overleefde zelfs
// het einde van de wedstrijd (module-globalen), dus je nam het mee naar de volgende match.
// Alleen modalPosSwap(false) ruimde op, en dat is net de weg die je sinds v0.57.0 niet meer neemt.
function zetPosSwapKeuze(a, b, doel) {
  posSwapA = a || null; posSwapB = b || null; posSwapDoel = doel || null;
}
// Positiewissel via het veld: tik de speler die verplaatst en dan de plek waar hij naartoe gaat.
// Op het veld tikken IS de positie kiezen — je ziet meteen waar iedereen staat, in plaats van een
// nummer te moeten opzoeken. Zelfde bediening als het tabblad Opstelling en de pauze-opstelling.
function modalPosSwap(behoud) {
  // Retro (via "Event toevoegen" op een afgewerkte wedstrijd): een positiewissel hoort op een
  // tijdstip, net als een wissel — zonder deel kan hij nergens in de reconstructie belanden.
  if (_postEventQuarter === 'unknown') { showToast('Kies eerst een specifiek deel — een positiewissel heeft een tijdstip nodig.', 'err'); return; }
  if (!behoud) zetPosSwapKeuze(null, null, null);
  const retro = _postEventQuarter != null;
  // Pauze-positiewissel enkel als je écht in de pauze staat: in retro-modus hoort het event in het
  // gekozen (afgelopen) deel, niet in de wachtrij voor het volgende. Zelfde conditie als confirmSub().
  const isBetween = match.quarterStatus === 'between' && !retro;
  const on = veldVoorWisselScherm(match);
  const onIds = new Set(on.map(p => p.id));
  if (posSwapA && !onIds.has(posSwapA)) posSwapA = null;
  if (posSwapB && !onIds.has(posSwapB)) posSwapB = null;
  const qNum = retro ? _postEventQuarter : (isBetween ? match.currentQuarter + 1 : match.currentQuarter);
  const title = isBetween ? `${icI(IC.compass)} Pauze-positiewissel · ${pSing(match)} ${match.currentQuarter + 1}`
    : retro ? `${icI(IC.compass)} Positiewissel · ${pSing(match)} ${_postEventQuarter}`
    : `${icI(IC.compass)} Positiewissel`;
  const staart = isBetween ? ' Wordt doorgevoerd bij de start van het volgende deel.'
    : retro ? ' Komt in het verloop en telt mee voor de keeperminuten.' : '';
  // Waar ze belanden: A neemt de plek van B en omgekeerd.
  const pA = on.find(p => p.id === posSwapA), pB = on.find(p => p.id === posSwapB);
  const plek = p => { const c = spelerGridCode(p); return c ? matchGridLabel(match, c) : String(p.posNum || ''); };
  // Klaar zodra er een bestemming is: een ploegmaat (dan ruilen ze) of een vrije plek (verhuizing).
  const klaarRuil = !!(pA && pB && pA.id !== pB.id);
  const klaarVerhuis = !!(pA && posSwapDoel);
  const klaar = klaarRuil || klaarVerhuis;
  openModal(`<h3>${title}</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">Tik de speler die <b>verplaatst</b> en dan de <b>plek</b> waar hij naartoe gaat: de plek van een ploegmaat (dan neemt die zijn plaats over) of een <b>vrije plek</b> (dan blijft zijn oude plaats leeg).${staart}</p>
    ${renderPitch(match, on, captainAtStartOfQuarter(match, qNum), null, { fn: 'posSwapVeldTap', selId: posSwapA || posSwapB, plek: true, plekSel: posSwapDoel })}
    <p style="text-align:center;font-size:13px;margin-top:10px;color:${klaar ? 'var(--txt)' : 'var(--txt2)'}">${klaarVerhuis
      ? `<b>${esc(fieldName(match, pA.id))}</b> naar <b>${esc(matchGridLabel(match, posSwapDoel))}</b> — zijn oude plaats blijft leeg`
      : (klaarRuil
        ? `<b>${esc(fieldName(match, pA.id))}</b> naar <b>${esc(plek(pB))}</b> · <b>${esc(fieldName(match, pB.id))}</b> naar <b>${esc(plek(pA))}</b>`
        : (posSwapA ? 'Tik nu de plek waar hij naartoe gaat.' : 'Nog niemand gekozen.'))}</p>
    <button class="btn btn-green" style="margin-top:8px${klaar ? '' : ';opacity:.5'}" onclick="confirmPosSwap()">${icI(IC.check)} Positiewissel doorvoeren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function posSwapVeldTap(kind, id) {
  // Een lege plek aantikken: bestemming zonder tegenspeler. Enkel zinvol als er al iemand gekozen is —
  // anders weet de app niet wie er naartoe moet.
  if (kind === 'plek') {
    if (!posSwapA) { showToast('Tik eerst de speler die verplaatst.', 'err'); return; }
    // Dezelfde plek nog eens aantikken = de bestemming weer weghalen.
    zetPosSwapKeuze(posSwapA, null, (posSwapDoel === id) ? null : id);
    modalPosSwap(true); return;
  }
  if (kind !== 'field') return;
  if (posSwapA === id) { zetPosSwapKeuze(null, null, null); modalPosSwap(true); return; }   // deselecteren
  if (!posSwapA) zetPosSwapKeuze(id, null, null); else zetPosSwapKeuze(posSwapA, id, null);
  modalPosSwap(true);
}
async function confirmPosSwap() {
  if (posSwapDoel) return confirmPosVerhuis();
  if (!posSwapA || !posSwapB) return;
  if (posSwapA === posSwapB) { showToast('Kies twee verschillende spelers.', 'err'); return; }
  if (_eventBusy) return; // dubbeltik-guard: tweede tik zou de net-gewisselde posities terugdraaien
  _eventBusy = true;
  // De keuze pas opruimen als ze ook echt uitgevoerd is: bij een afgebroken poging blijft ze staan
  // zodat je kan corrigeren i.p.v. van nul te herbeginnen.
  let uitgevoerd = false;
  try {
    // Echte pauze-positiewissel: enkel tussen de delen ÉN niet in retro-modus. Zelfde conditie als
    // modalPosSwap() hierboven en als de pauzewissel-variant in confirmSub().
    if (match.quarterStatus === 'between' && _postEventQuarter === null) {
      // Via de doelopstelling — zie de uitleg bij de pauzewissel in confirmSub().
      if (!pauzeRuilInDoel(match, posSwapA, posSwapB)) {
        showToast(`Die spelers staan niet allebei in de opstelling van ${pSingLow(match)} ${match.currentQuarter + 1}.`, 'err');
        return;
      }
      uitgevoerd = true;
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
      uitgevoerd = true;
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
    uitgevoerd = true;
    await dbSave(match); closeModal(); render();
  } finally { _eventBusy = false; if (uitgevoerd) zetPosSwapKeuze(null, null, null); }
}
// Een speler naar een LEGE plek: geen ruil, dus geen tweede speler. Het event blijft een `posSwap`
// (zelfde soort gebeurtenis in het verloop, de filters, het verslag en de CSV) maar met `pB: null` en
// `naarPlek` = de roostercode van de bestemming. Elke lezer van een posSwap kent dat geval; zie
// revertPosSwapPositions, rebuildPositions en posSwapBeweging.
// Zelfde drie paden als confirmPosSwap: pauze (in de wachtrij), retro (in een afgelopen deel via
// voorwaartse replay) en live (nu doorvoeren, met een snapshot vóór de mutatie).
async function confirmPosVerhuis() {
  if (!posSwapA || !posSwapDoel) return;
  const doel = gridPlek(posSwapDoel);
  if (!doel) { showToast('Onbekende plek.', 'err'); return; }
  if (_eventBusy) return;
  _eventBusy = true;
  let uitgevoerd = false;   // zie confirmPosSwap()
  try {
    if (match.quarterStatus === 'between' && _postEventQuarter === null) {
      // Via de doelopstelling — zie de uitleg bij de pauzewissel in confirmSub(). De oude
      // "nog eens tikken = weer weghalen"-truc is daarmee verdwenen: je zet de speler nu gewoon op
      // een andere plek, en het veld toont meteen waar hij staat.
      if (!pauzeVerhuisInDoel(match, posSwapA, posSwapDoel)) {
        showToast(`${pName(match, posSwapA)} staat niet in de opstelling van ${pSingLow(match)} ${match.currentQuarter + 1}.`, 'err');
        return;
      }
      uitgevoerd = true;
      await dbSave(match); closeModal(); render();
      return;
    }
    if (_postEventQuarter != null) {
      const baseline = playersAtPeriodStart(match, 1);
      addEvent('posSwap', { pA: posSwapA, pB: null, naarPlek: posSwapDoel, posA: null, posB: null });
      rebuildPositions(match, baseline);
      if (match.keeperByQ && Object.keys(match.keeperByQ).length) rebuildKeeperByQ(match);
      uitgevoerd = true;
      await dbSave(match); closeModal(); render();
      return;
    }
    const pA = match.players.find(p => p.id === posSwapA);
    if (!pA) { closeModal(); return; }
    // Is die plek intussen tóch bezet? Alleen VRIJE plekken zijn aantikbaar (pitchOpenPlekken), dus
    // dit betekent dat het scherm verouderd is — bv. een co-admin die op een tweede toestel iemand
    // daar zette. Dan niet blind neerzetten: dat zou de bewoner overschrijven en twee shirts op
    // dezelfde coördinaten geven, waarvan je er één ziet. Liever niets doen en het zeggen.
    const bewoner = match.players.find(p => p.onField && p.id !== pA.id && spelerGridCode(p) === posSwapDoel);
    if (bewoner) {
      showToast(`${matchGridLabel(match, posSwapDoel)} is intussen bezet door ${fieldName(match, bewoner.id)} — tik opnieuw.`, 'err');
      zetPosSwapKeuze(null, null, null);
      closeModal(); render();
      return;
    }
    const posA = { x: pA.x, y: pA.y, line: pA.line, posNum: pA.posNum, posCodeVeld: pA.posCodeVeld };
    addEvent('posSwap', { pA: posSwapA, pB: null, naarPlek: posSwapDoel, posA, posB: null });
    zetOpGridPlek(pA, doel, match);
    syncKeeper();   // naar (of weg van) het doel is een keeperwissel — zelfde regel als bij een ruil
    uitgevoerd = true;
    await dbSave(match); closeModal(); render();
  } finally { _eventBusy = false; if (uitgevoerd) zetPosSwapKeuze(null, null, null); }
}

// ===================== MODAL: CARD =====================
function modalCard(color) {
  // Bij een event-achteraf ook de bank kiesbaar (gemerkt) — zie spelersVoorEventKeuze.
  const keuze = spelersVoorEventKeuze(match);
  const on = keuze.lijst;
  const ico = color === 'yellow' ? icI(IC.cardY) : icI(IC.cardR);
  const lbl = color === 'yellow' ? 'Gele kaart' : 'Rode kaart';
  openModal(`<h3>${ico} ${lbl}</h3>
    <div class="sec" style="margin-top:0">Voor welke speler?</div>
    ${pgGrid(on.map(p=>`<button type="button" onclick="logCard('${color}','${p.id}')" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 4px;border-radius:10px;border:2px solid var(--bdr);background:var(--card);cursor:pointer;gap:2px">${playerBtnInner(p, 'var(--txt)')}${bankTag(keuze.bank, p)}</button>`).join(''))}
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
    // Uitgesloten = niet meer op het veld, ook niet in het volgende deel. Staat hij in de getekende
    // opstelling van dat deel, dan hoort hij daar meteen uit: het pauzeveld beloofde hem anders nog,
    // terwijl startQuarter hem terecht overslaat — scherm en werkelijkheid liepen dan uiteen.
    // Dezelfde regel als bij afwezig melden (doMarkAbsent), maar via de kaartendeur.
    if (Array.isArray(match.nextLineup) && match.nextLineup.some(e => e.id === pid) && isUitgesloten(match, pid)) {
      _pasNextLineupAan(match, match.nextLineup.filter(e => e.id !== pid));
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
  // Bij een event-achteraf ook de bank kiesbaar (gemerkt) — een penalty is ook een doelpunt.
  const keuze = spelersVoorEventKeuze(match);
  const on = keuze.lijst;
  openModal(`<h3>${icI(IC.penalty)} Penalty</h3>
    <div class="sec" style="margin-top:0">Voor wie?</div>
    <div class="tgl" id="pen-team"><button class="act" onclick="tglPen('us',this)">${esc(tName(match))}</button><button onclick="tglPen('them',this)">Tegenstander</button></div>
    <div id="pen-player-section">
      <div class="sec">Wie neemt de penalty?</div>
      <div id="pen-players">
        ${pgGrid(on.map(p=>pgBtn(p,'pen-pb',`selectPenPlayer('${p.id}',this)`,bankTag(keuze.bank,p))).join(''))}
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
// `soort` = 'vertrokken' opent dit venster meteen voor een speler die de wedstrijd VERLAAT en niet
// geblesseerd is (naar huis, naar het tweede veld, opgehaald door de ouders). Dat soort bestond al in
// de gegevens — de knop tijdens de wedstrijd maakt zulke events (zie markLeftField) — maar was hier
// niet te kiezen. Daardoor kon je zoiets achteraf, op een afgesloten wedstrijd, enkel als "blessure"
// registreren, en dat is niet wat er gebeurde.
function modalInjury(preId, soort) {
  // ALLE beschikbare spelers, niet enkel wie op het veld stond. Een speler die naar huis gaat of
  // naar het tweede veld vertrekt, zit op dat moment vaak al op de bank — hij was eerder gewisseld.
  // Met enkel de veldbezetting was zo iemand niet te kiezen. Dat gold ook voor een blessure op de
  // bank. Wie op het veld stond komt eerst en is gemarkeerd, zodat de keuze wél gestuurd blijft.
  // (Voordien: playersOnFieldForEvent alleen. Punt uit de veldtest van 22-08-2026.)
  const opVeld = playersOnFieldForEvent(match);
  const opVeldIds = new Set(opVeld.map(p => p.id));
  // Wie al vertrokken is, hoort hier niet meer: hem nóg eens laten vertrekken of blesseren kan niet.
  // Bij een event dat je achteraf aan een vroeger blok hangt, was hij toen misschien nog aanwezig.
  const bank = (match.players || []).filter(p => !opVeldIds.has(p.id) && magNogMeedoen(match, p, _postEventQuarter != null ? _postEventQuarter : undefined));
  const lijst = [...opVeld, ...sortedByName(bank)];
  injPlayerId = (preId && lijst.some(p => p.id === preId)) ? preId : null;
  injType = soort === 'vertrokken' ? 'vertrokken' : 'kramp';
  const weg = injType === 'vertrokken';
  const tb = (t, label) => `<button class="${injType === t ? 'act' : ''}" onclick="tglInjType('${t}',this)">${label}</button>`;
  const merk = p => opVeldIds.has(p.id) ? '' : '<span style="font-size:10px;color:var(--txt2)">bank</span>';
  openModal(`<h3>${icI(weg ? IC.close : IC.injury)} ${weg ? 'Speler verlaat de wedstrijd' : 'Blessure'}</h3>
    <div class="sec" style="margin-top:0">Welke speler?</div>
    ${bank.length ? `<p style="font-size:12px;color:var(--txt2);margin:-4px 0 8px">Wie op dat moment op het veld stond, staat vooraan; wie op de bank zat, is gemerkt.</p>` : ''}
    <div id="inj-players">${pgGrid(lijst.map(p=>pgBtn(p,'inj-pb',`selectInjuryPlayer('${p.id}',this)`, merk(p))).join(''))}</div>
    <div class="sec">Wat is er aan de hand?</div>
    <div class="tgl" id="inj-type" style="flex-wrap:wrap;gap:6px">
      ${tb('kramp', 'Kramp')}${tb('licht', 'Lichte blessure')}${tb('ernstig', 'Ernstig')}${tb('vertrokken', 'Vertrokken')}
    </div>
    ${/* Reden enkel bij "vertrokken": bij een blessure is het type zelf de reden. Vrije tekst, want
         de redenen zijn te uiteenlopend voor een lijstje (naar huis, tweede veld, ophaalregeling). */ ''}
    <div class="fg" id="inj-reden-rij" style="margin-top:10px;${weg ? '' : 'display:none'}">
      <label>Reden <span style="font-weight:400;color:var(--txt2)">(optioneel)</span></label>
      <input id="inj-reden" type="text" placeholder="bv. naar huis, speelt op het tweede veld" autocomplete="off">
    </div>
    ${/* Bij "vertrokken" staat dit vinkje er niet: wie de wedstrijd verlaat, verlaat het veld — een
         vertrek zonder dat is een onmogelijke toestand, en die hoort niet aanklikbaar te zijn. */ ''}
    <label class="chkrow" id="inj-off-rij" style="margin-bottom:16px;${weg ? 'display:none' : ''}"><input type="checkbox" id="inj-off"${(injPlayerId || weg) ? ' checked' : ''}> Speler verlaat het veld</label>
    <button class="btn btn-green" onclick="confirmInjury()">${icI(IC.check)}Registreren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
  // Voorselectie zichtbaar maken: de keuze wordt met inline stijlen gemarkeerd (gpSel), niet met
  // een klasse, dus dat moet na het renderen gebeuren.
  if (injPlayerId) {
    const i = lijst.findIndex(p => p.id === injPlayerId);
    const btn = document.querySelectorAll('#inj-players button')[i];
    if (btn) gpSel(btn);
  }
}
function selectInjuryPlayer(id, el) { injPlayerId = id; gpSelIn('inj-players', el); }
function tglInjType(type, btn) {
  injType = type;
  document.querySelectorAll('#inj-type button').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  // Het redenveld hoort bij "vertrokken"; bij een blessure zegt het type zelf al genoeg. En wie
  // vertrekt, verlaat per definitie het veld — dat vinkje dus meteen aan.
  const rij = document.getElementById('inj-reden-rij');
  if (rij) rij.style.display = (type === 'vertrokken') ? '' : 'none';
  const off = document.getElementById('inj-off');
  if (off && type === 'vertrokken') off.checked = true;
  const offRij = document.getElementById('inj-off-rij');
  if (offRij) offRij.style.display = (type === 'vertrokken') ? 'none' : '';
}
async function confirmInjury() {
  if (!injPlayerId) { showToast('Kies een speler.', 'err'); return; }
  if (_eventBusy) return;
  _eventBusy = true;
  try {
    // "Vertrokken" betekent per definitie van het veld af — niet afhankelijk van een vinkje dat bij
    // dat soort niet eens getoond wordt. Zonder deze regel kon er een event ontstaan dat zegt dat
    // iemand vertrok maar hem toch op het veld liet staan, met speelminuten die doorliepen.
    const leavesField = injType === 'vertrokken' ? true : !!document.getElementById('inj-off')?.checked;
    const reden = (document.getElementById('inj-reden')?.value || '').trim();
    // `reason` enkel meegeven als er ook echt iets staat: een leeg veld hoort geen sleutel toe te
    // voegen aan het event (en dus ook niet naar de cloud te gaan).
    const extra = { playerId: injPlayerId, injuryType: injType, leavesField };
    if (injType === 'vertrokken' && reden) extra.reason = reden;
    // Stond hij op dat moment eigenlijk wél op het veld? Zit hij al op de bank (eerder gewisseld en
    // dan naar huis), dan komt er niemand in zijn plaats en hoort de wisselvraag er niet te staan.
    const stondOpHetVeld = playersOnFieldForEvent(match).some(p => p.id === injPlayerId);
    addEvent('injury', extra);
    if (leavesField) { const p = match.players.find(x => x.id === injPlayerId); if (p) p.onField = false; }
    // Vertrekt hij, dan hoort hij ook uit de getekende opstelling van het volgende blok — zelfde
    // regel als bij afwezig melden en bij een rode kaart. Vertrok hij tijdens de PAUZE, dan stond
    // die opstelling er al mét hem in, en zette de start hem alsnog het veld op.
    if (injType === 'vertrokken' && Array.isArray(match.nextLineup) && match.nextLineup.some(e => e.id === injPlayerId)) {
      _pasNextLineupAan(match, match.nextLineup.filter(e => e.id !== injPlayerId));
    }
    await dbSave(match);
    if (leavesField && stondOpHetVeld) { modalSubAfterInjury(injPlayerId, injType === 'vertrokken' ? 'vertrokken' : undefined); }
    else { closeModal(); render(); }
  } finally { _eventBusy = false; }
}
// `reden` = 'vertrokken' wanneer de speler niet geblesseerd is maar weggaat (naar het tweede veld
// van dezelfde ploeg, of naar huis) — zie markLeftField. Dezelfde wisselmodal, andere woorden.
function modalSubAfterInjury(outId, reden) {
  const weg = reden === 'vertrokken';
  subOut = outId; subIn = null;
  const outPlayer = match.players.find(p => p.id === outId);
  const mins = calcMinutes(match);
  const off = playersOnBench(match).slice().sort((a,b) => (mins[a.id]?.ms||0) - (mins[b.id]?.ms||0));
  const minMs = off.length ? (mins[off[0].id]?.ms||0) : 0;
  const mm = id => playedMin(mins[id]?.ms);
  openModal(`<h3>${icI(IC.swap)} Wissel na ${weg ? 'vertrek' : 'blessure'}</h3>
    <div style="background:var(--rdp);color:var(--rd);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-weight:700;font-size:14px">${weg ? icI(IC.close) : '🤕'} ${esc(outPlayer?.name||'?')} verlaat het veld</div>
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
  _postEventAtBreak = false;
  // Per deel een knop, en daartussen de PAUZES. Een speler die in de rust naar huis gaat, hoort in
  // geen van beide delen: hij stond aan het einde van het vorige niet meer op het veld (misschien al
  // gewisseld) en aan het begin van het volgende ook niet. Zonder deze keuze was zo'n gebeurtenis
  // niet vast te leggen — punt uit de veldtest van 22-08-2026.
  const label = pSing(match);
  const qBtns = quarters.map(q => {
    const act = q.num === lastQ ? ' act' : '';
    const pauze = q.num > 1
      ? `<button class="tgl-btn" onclick="selPostQ(${q.num},this,true)">Pauze na ${pSingLow(match)} ${q.num - 1}</button>`
      : '';
    return pauze + `<button class="tgl-btn${act}" onclick="selPostQ(${q.num},this)">${label} ${q.num}</button>`;
  }).join('') + `<button class="tgl-btn${lastQ===null?' act':''}" onclick="selPostQ('unknown',this)">Onbekend</button>`;
  openModal(`
    <h3>${icI(IC.log)} Event toevoegen</h3>
    <div class="sec" style="margin-top:0">Wanneer?</div>
    <div class="tgl" id="post-q-tgl" style="flex-wrap:wrap;gap:6px;margin-bottom:8px">${qBtns}</div>
    <div class="fg" style="margin-bottom:4px" id="post-min-rij">
      <label style="font-size:13px;color:var(--txt2)">Minuut binnen dit deel <span style="font-weight:400">(optioneel — laat leeg voor einde deel)</span></label>
      <input id="post-evt-min" type="number" inputmode="numeric" min="1" max="${match.quarterDuration || 99}" placeholder="bv. 12" oninput="selPostMin(this.value)" style="width:100%">
    </div>
    <p id="post-pauze-uitleg" style="display:none;font-size:12px;color:var(--txt2);margin:-2px 0 8px">In de pauze loopt de klok niet, dus dit wordt vastgelegd op het moment tussen de twee delen. Wie dan vertrekt, houdt de minuten die hij daarvóór speelde.</p>
    <div class="sec">Wat wil je toevoegen?</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <button class="btn btn-pale" onclick="postEvt(modalGoal)">${icI(IC.goal)} Goal</button>
      <button class="btn btn-pale" onclick="postEvt(()=>modalCard('yellow'))">${icI(IC.cardY)} Kaart</button>
      <button class="btn btn-pale" onclick="postEvt(modalPenalty)">${icI(IC.penalty)} Penalty</button>
      <button class="btn btn-pale" onclick="postEvt(modalFreekick)">${icI(IC.bolt)} Vrije trap</button>
      <button class="btn btn-pale" onclick="postEvt(modalSub)">${icI(IC.swap)} Wissel</button>
      <button class="btn btn-pale" onclick="postEvt(modalPosSwap)">${icI(IC.compass)} Positiewissel</button>
      ${/* Achteraf een speler laten vertrekken (naar huis, tweede veld) was enkel te bereiken via
           "Meer… → Blessure" met een keuze die er niet stond. Dit gebeurt vaak genoeg voor een
           eigen knop — het was punt 4 van de veldtest van 22-08-2026. */ ''}
      <button class="btn btn-pale" style="grid-column:1/-1" onclick="postEvt(()=>modalInjury(null,'vertrokken'))">${icI(IC.close)} Speler verlaat de wedstrijd</button>
      ${/* "Meer…" over de volle breedte: met het oneven aantal knoppen hierboven zou hij anders als
           losse halve knop naast een gat staan. */ ''}
      <button class="btn btn-pale" style="grid-column:1/-1" onclick="postEvt(modalExtra)">${icI(IC.more)} Meer…</button>
    </div>
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Annuleren</button>`);
}
function selPostQ(num, btn, atBreak) {
  _postEventQuarter = num;
  _postEventAtBreak = !!atBreak;
  document.querySelectorAll('#post-q-tgl .tgl-btn').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  // Een pauze heeft geen minuten: het minuutveld verdwijnt en de eerder ingevulde waarde vervalt,
  // anders zou een blijven staan getal stil meegenomen worden bij een volgende keuze.
  const rij = document.getElementById('post-min-rij');
  const uitleg = document.getElementById('post-pauze-uitleg');
  if (rij) rij.style.display = _postEventAtBreak ? 'none' : '';
  if (uitleg) uitleg.style.display = _postEventAtBreak ? '' : 'none';
  if (_postEventAtBreak) {
    _postEventMinute = null;
    const inp = document.getElementById('post-evt-min');
    if (inp) inp.value = '';
  }
}
function selPostMin(val) {
  const n = parseInt(val);
  _postEventMinute = (!isNaN(n) && n > 0) ? n : null;
}
function postEvt(fn) {
  fn();
}

