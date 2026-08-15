// ===================== DETAIL VIEW =====================
function renderDetail() {
  if (!match) return '<div class="content"><p>Niet gevonden.</p></div>';
  if (ensurePosNums(match)) dbSave(match);
  const ro = !!(match.fromCloud && (!isAdmin || viewerMode)); // kijker: alleen-lezen
  const mins = calcMinutes(match);
  const qSummary = match.quarters.map(q => {
    const dur = q.endTime ? q.endTime - q.startTime - (q.totalPaused||0) : getQElapsed(match);
    const goals = match.events.filter(e => (e.type==='goal_us'||e.type==='goal_them'||e.type==='own_goal'||(e.type.startsWith('penalty')&&e.scored)) && e.quarterNum === q.num);
    const cum = scoreUpToQuarter(match, q.num);
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bdr)">
      <div style="font-weight:800;min-width:32px">${pAbbr(match)}${q.num}</div>
      <div style="font-weight:900;min-width:54px;font-variant-numeric:tabular-nums">${isAway(match) ? `${cum.them}–<span style="color:var(--grn)">${cum.us}</span>` : `<span style="color:var(--grn)">${cum.us}</span>–${cum.them}`}</div>
      <div style="flex:1;font-size:13px;color:var(--txt2);white-space:nowrap">${Math.round(dur / 60000)} min</div>
      <div style="font-size:13px;text-align:right">${goals.map(e=>`<span style="color:var(--txt2);font-size:11px">${eventMinSummaryText(e,match)}</span> ${evtLabel(e,match)}`).join('<br>')||'–'}</div>
    </div>`;
  }).join('');

  const detailBack = match.tournamentId ? `goTournament('${match.tournamentId}')` : `go('matches')`;
  return `
  <div class="hdr"><button class="back" onclick="${detailBack}">‹</button>
    <div><h1>${matchTitle(match)}</h1><div class="hdr-sub">${match.location} · ${matchWhen(match)} · ${match.matchType}</div></div>
  </div>
  <div class="content">
    <div class="card" style="text-align:center">
      <div style="font-size:13px;color:var(--txt2);margin-bottom:4px">Eindscore</div>
      <div style="font-size:50px;font-weight:900;color:var(--txt)">${scoreHtml(match,'grn')}</div>
      <div style="font-size:14px;color:var(--txt2)">${esc(isAway(match)?match.opponent:tName(match))} – ${esc(isAway(match)?tName(match):match.opponent)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px" class="no-print">
      <button class="btn btn-green btn-sm" onclick="shareReport()">${icI(IC.share)} Delen</button>
      <button class="btn btn-org btn-sm" onclick="exportPDF()">${icI(IC.fileText)} PDF</button>
      <button class="btn btn-pale btn-sm" onclick="exportMatchModal()">${icI(IC.download)} Export</button>
    </div>
    <div class="sec">Wedstrijdinfo</div>
    <div class="card">
      ${[['Tornooi', match.tournamentId ? ((tournamentById(match.tournamentId) || {}).name || '') : ''],['Ploeg-label',match.subteam],['Formatie',match.formation],[trainerLabel(matchTrainer(match)),matchTrainer(match)],['Ploegverantw.',matchResponsible(match)],['Soort',match.competition],['Speeldag',match.matchday],['Scheidsrechter',match.referee],['Truikleur',match.jersey],['Locatie',match.venue],['Kapitein(s)',allCaptains(match).map(id=>pName(match,id)).join(' | ')]].filter(([k,v])=>v).map(([k,v])=>`<div class="stat-row"><span style="color:var(--txt2);min-width:120px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('') || '<p style="color:var(--txt2);font-size:14px">Geen extra info ingevuld.</p>'}
      <div class="stat-row"><span style="color:var(--txt2);min-width:120px">${icI(IC.motm)} Man v/d match</span><span style="font-weight:600">${match.motmId?esc(pName(match,match.motmId)):'—'}</span>${ro?'':`<button class="btn btn-pale btn-sm no-print" style="margin-left:auto;width:auto" onclick="modalMotm()">Kiezen</button>`}</div>
    </div>
    ${(() => {
      const ev = match.events;
      const st = (type) => ev.filter(e => e.type === type).length;
      const rows = [
        [icI(IC.corner) + ' Hoekschoppen', st('corner_us'),   st('corner_them')],
        [icI(IC.bolt)   + ' Vrije trappen', st('freekick_us'), st('freekick_them')],
        [icI(IC.penalty)+ ' Penalty\'s',   st('penalty_us'),  st('penalty_them')],
        [icI(IC.cardY)  + ' Gele kaarten', st('yellow_card'), ''],
        [icI(IC.cardR)  + ' Rode kaarten', st('red_card'),    ''],
      ].filter(([,a,b]) => (Number(String(a).match(/\d+/)?.[0]||0) + Number(String(b).match(/\d+/)?.[0]||0)) > 0);
      if (!rows.length) return '';
      return `<div class="sec">Wedstrijdstatistieken</div><div class="card">
        <div class="prow" style="opacity:.5;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding-bottom:4px">
          <div style="flex:1"></div><div style="min-width:90px;text-align:right">Voor</div><div style="min-width:70px;text-align:right">Tegen</div>
        </div>
        ${rows.map(([label,a,b])=>`<div class="stat-row"><span style="flex:1">${label}</span><span style="min-width:90px;text-align:right;font-weight:700">${a}</span><span style="min-width:70px;text-align:right;color:var(--txt2)">${b}</span></div>`).join('')}
      </div>`;
    })()}
    ${photoSectionHtml(match, ro)}
    ${!canManage() ? '' : `<div class="sec">Notities <span style="font-size:11px;font-weight:400;color:var(--txt2);text-transform:none">(enkel zichtbaar voor beheerders)</span></div>
    <div class="card">
      <p class="notes-txt" style="${match.notes?'':'color:var(--txt2)'}">${match.notes?esc(match.notes):'Geen notities.'}</p>
      <button class="btn btn-pale btn-sm no-print" style="margin-top:10px" onclick="modalNotes()">${icI(IC.edit)} Bewerken</button>
    </div>`}
    ${selectionCardHtml(match)}
    <div class="sec">${match.quarters.length > 1 ? `Opstelling per ${pSingLow(match)}` : 'Opstelling'}</div>
    <div class="card">${renderLineupCarousel(match)}</div>
    ${match.quarters.length ? `<div class="sec">Per ${pSingLow(match)}</div><div class="card">${qSummary}</div>` : ''}
    ${!statSectionVisible('minutes') ? '' : `
    <div class="sec">Speelminuten <span style="font-weight:400;text-transform:none;color:var(--txt2)">(balk = % van de speeltijd · groen ≥75% · oranje ≥50% · rood &lt;50%)</span></div>
    <div class="card">
      <div class="prow" style="opacity:.5;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding-bottom:4px">
        ${/* Lege plaatshouder voor het rugnummerbolletje — enkel als er in deze wedstrijd effectief
             nummers staan, anders schuift deze kopregel op t.o.v. de rijen eronder. */ ''}
        ${match.players.some(p => pNum(p)) ? '<div class="pnum"></div>' : ''}
        <div style="flex:1">Speler</div>
        <div class="pmins" style="font-size:11px">Min · %</div>
      </div>
      ${(() => {
        const qData = calcMinutesPerQuarter(match);
        const abbr = pAbbr(match);
        // Alfabetisch op familienaam, zoals elke spelerslijst in de app (sortedByName).
        return sortedByName(match.players).map(p => {
          const row = playerRowHtml(p, mins[p.id], !p.onField, getGameTimeMs(match));
          if (p.absent) return row;
          if (!qData) return row;
          const parts = qData.qNums.map(qNum => {
            const ms = qData.result[p.id]?.[qNum] || 0;
            return `${abbr}${qNum}: ${ms > 0 ? playedMin(ms)+"'" : '—'}`;
          });
          return row + `<div style="font-size:11px;color:var(--txt2);padding:0 0 8px 42px">${parts.join(' · ')}</div>`;
        }).join('');
      })()}
    </div>`}
    ${canManage() && match.players.some(p=>p.note) ? `<div class="sec">Notities per speler <span style="font-size:11px;font-weight:400;color:var(--txt2);text-transform:none">(enkel zichtbaar voor beheerders)</span></div><div class="card">${match.players.filter(p=>p.note).map(p=>`<div class="stat-row"><span style="color:var(--txt2);min-width:120px">${esc(p.name)}</span><span>${esc(p.note)}</span></div>`).join('')}</div>` : ''}
    <div class="sec">Events (${match.events.length})</div>
    <div class="card">${renderEventLog(match)}</div>
    ${(() => {
      const km = keeperMinutes(match);
      if (!km || !Object.keys(km).length) return '';
      const rows = Object.entries(km).sort((a, b) => b[1] - a[1])
        .map(([pid, ms]) => `<div class="stat-row"><span style="color:var(--txt2);min-width:120px">${esc(pName(match, pid))}</span><span style="font-weight:600">${Math.round(ms / 60000)} min</span></div>`).join('');
      return `<div class="sec">Keeper(s)</div><div class="card">${rows}</div>`;
    })()}
    ${(match.fromCloud && (!isAdmin || viewerMode)) ? '' : `<div class="no-print">
      <div style="margin-bottom:8px">
        <button class="btn btn-green" style="width:100%" onclick="modalAddPostEvent()">${icI(IC.log)} Event toevoegen</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <button class="btn btn-orgpale" onclick="modalPlayerNotes()">${icI(IC.edit)} Spelernotities</button>
        <button class="btn btn-pale" onclick="modalEditMatchInfo()">${icI(IC.clipboard)} Info bewerken</button>
      </div>
      ${/* Rugnummers zijn een label, dus ook na de wedstrijd nog aanpasbaar — bv. om ze te wissen als
           de ploeg overstapt op spelen zonder vaste nummers. Los van "Spelers bewerken", dat op een
           afgewerkte wedstrijd te veel kan (spelers verwijderen, lijnen wijzigen). */ ''}
      <button class="btn btn-pale" style="margin-bottom:8px;width:100%" onclick="modalMatchNumbers()">${icI(IC.shirt)} Rugnummers</button>
      ${/* "Posities herplaatsen" herplaatst de STARTopstelling. Zodra er een wissel of positiewissel
           gelogd is, weigert modalEditPositions dat (het zou de kwart-reconstructie corrumperen) —
           dan stond hier een knop die alleen een foutmelding gaf. Nu verbergen we ze in dat geval,
           met een regeltje dat naar de juiste weg verwijst. */ ''}
      ${((FORMATIONS[match.matchType]||[]).length && !(match.events || []).some(e => e.type === 'substitution' || e.type === 'posSwap'))
        ? `<button class="btn btn-pale" style="margin-bottom:8px;width:100%" onclick="modalEditPositions()">${icI(IC.shirt)} Startopstelling herplaatsen</button>`
        : ((FORMATIONS[match.matchType]||[]).length ? `<p style="font-size:11px;color:var(--txt2);margin:-2px 0 8px">De startopstelling kan niet meer herplaatst worden — er zijn al wissels of positiewissels gebeurd. Eén speler verplaatsen doe je met <b>Positiewissel</b> in het livescherm.</p>` : '')}
      ${cloneMatchBtnHtml(match)}
      <button class="btn btn-orgpale" style="margin-bottom:8px;width:100%" onclick="confirmReopenMatch()">${icI(IC.live)} Wedstrijd heropenen</button>
      <div class="danger"><button class="btn btn-red" onclick="confirmDelete()">${icI(IC.trash)} Wedstrijd verwijderen</button></div>
    </div>`}
    ${viewerVisibilityHintHtml(['selected', 'minutes'])}
  </div>`;
}
function pickPhoto(slot) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      match['photo' + slot] = ev.target.result;
      await dbSave(match); render();
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}
async function deletePhoto(slot) {
  delete match['photo' + slot];
  await dbSave(match); render();
}
function photoSectionHtml(m, ro) {
  const slots = [
    { key: 'photo1', label: 'TEAMFOTO' },
    { key: 'photo2', label: 'ACTIEFOTO' },
  ];
  const html = slots.map((s, i) => {
    const num = i + 1;
    const src = m[s.key];
    if (src) {
      return `<div class="photo-slot">
        <img src="${src}" alt="${s.label}">
        <div class="photo-slot-lbl">${s.label}</div>
        ${ro ? '' : `<button class="photo-del" onclick="deletePhoto(${num})" title="Verwijderen">×</button>`}
      </div>`;
    }
    if (ro) return `<div class="photo-slot" style="cursor:default"><span style="font-size:22px;opacity:.3">📷</span><span>${s.label}</span></div>`;
    return `<div class="photo-slot" onclick="pickPhoto(${num})">
      <span style="font-size:28px;opacity:.4">📷</span>
      <span>${s.label}</span>
      <span style="font-size:10px;opacity:.6">Tik om toe te voegen</span>
    </div>`;
  }).join('');
  const hasPhotos = m.photo1 || m.photo2;
  if (ro && !hasPhotos) return '';
  return `<div class="sec">Foto's</div><div class="card"><div class="photo-grid">${html}</div></div>`;
}
// "Gebruik als template" hoort niet bij een tornooiwedstrijd: cloneMatch() maakt een LOSSE
// wedstrijd (geen tournamentId, geen tornooimodus), en dat is op een tornooidag nooit wat je wil.
// Daar bestaat "Kloon als nieuwe wedstrijd" voor, die de kloon in hetzelfde tornooi houdt — die
// bieden we hier ook aan, zodat je er niet voor terug moet naar de tornooipagina.
function cloneMatchBtnHtml(m) {
  if (!m) return '';
  return m.tournamentId
    ? `<button class="btn btn-pale" style="margin-bottom:8px;width:100%" onclick="cloneTournamentMatch('${m.id}','${m.tournamentId}')">${icI(IC.copy)} Kloon als nieuwe tornooiwedstrijd</button>`
    : `<button class="btn btn-pale" style="margin-bottom:8px;width:100%" onclick="cloneMatch()">${icI(IC.copy)} Gebruik als template</button>`;
}
function cloneMatch() {
  if (!canManage() || !match) return;
  const src = match;
  // Eigen guard naast het verbergen van de knop: een tornooiwedstrijd klonen loopt via
  // cloneTournamentMatch, anders belandt de kloon buiten het tornooi.
  if (src.tournamentId) { cloneTournamentMatch(src.id, src.tournamentId); return; }
  const team = teamById(src.teamId);
  const matchType = src.matchType || '11v11';
  // Formatie-index uit de bewaarde formatienaam halen. Hier stond `src.formationIndex`, een veld dat
  // niet op een wedstrijdobject bestaat: elke kloon viel dus terug op de eerste formatie.
  const fi = Math.max(0, (FORMATIONS[matchType] || []).findIndex(f => f.name === src.formation));
  const pool = (src.players || []).map(p => ({
    pid: uid(),
    // p.id is het speler-id BINNEN de wedstrijd, geen rooster-id: als srcId gebruiken koppelde de
    // speler aan niets en liet buildPool/finishWizard hem als losse naam achter.
    srcId: p.rosterId || null,
    srcGlobalId: p.globalId || null,
    name: p.name, number: p.number,
    pos: p.pos || p.line || '',
    side: p.side || '',
    fromName: p.guest ? (p.fromName || '') : (src.teamName || (team ? team.name : '')),
    guest: !!p.guest,
    sel: p.starting ? 'basis' : 'bank',
    slot: null, _x: p.x, _y: p.y,
  }));
  // Spelers die deze wedstrijd niet meededen alsnog in de pool als 'none', zoals editMatchWizard
  // doet — anders waren ze in de kloon enkel via de gast-modal (fout gelabeld als gast) terug te
  // halen.
  const usedSrc = new Set(pool.map(p => p.srcId).filter(Boolean));
  (team ? team.players || [] : []).forEach(r => {
    if (usedSrc.has(r.id)) return;
    pool.push({ pid: uid(), srcId: r.id, srcGlobalId: r.globalId || null, name: r.name, number: r.number || '', pos: r.pos || '', side: r.side || '', fromName: team.name, guest: false, sel: 'none', slot: null });
  });
  wiz = {
    step: 1,
    teamId: src.teamId || (team ? team.id : ''),
    opponent: '', subteam: src.subteam || '',
    date: new Date().toISOString().split('T')[0],
    time: src.time || '10:00',
    location: src.location || 'Thuis',
    matchType,
    periodKey: src.periodKey || 'kwarten',
    quarterDuration: src.quarterDuration || 25,
    numQuarters: src.numQuarters || 4,
    competition: src.competition || '',
    matchday: '',
    referee: src.referee || '',
    jersey: src.jersey || '',
    venue: src.venue || '',
    trainer: src.trainer || '',
    responsible: src.responsible || '',
    pool, poolTeamId: src.teamId || '',
    formationIndex: fi,
    selPlace: null,
  };
  // Basisspelers terugzetten op hun formatieslot (x/y-match), zoals editMatchWizard en
  // cloneTournamentMatch — anders opende stap 3 met een leeg veld.
  const form = FORMATIONS[matchType] && FORMATIONS[matchType][fi];
  if (form) wiz.pool.filter(p => p.sel === 'basis').forEach(p => { const idx = form.slots.findIndex(s => s.x === p._x && s.y === p._y); p.slot = idx >= 0 ? idx : null; });
  // Kapitein meenemen: de eerste pool-entries volgen de volgorde van src.players.
  if (src.captainId) {
    const ci = (src.players || []).findIndex(p => p.id === src.captainId);
    if (ci >= 0 && wiz.pool[ci]) wiz.captainPid = wiz.pool[ci].pid;
  }
  go('new');
}
function confirmDelete() {
  openModal(`<h3>Wedstrijd verwijderen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Dit kan niet ongedaan gemaakt worden.</p>
    <button class="btn btn-red" onclick="deleteCurrentMatch()">${icI(IC.trash)} Ja, verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function deleteCurrentMatch() {
  const m = match;
  // Vangnet: back-up naar de cloud vóór de echte verwijdering, zodat een misklik herstelbaar
  // blijft (zelfde patroon als deletedTeams bij ploeg verwijderen). Enkel zinvol voor
  // cloud-wedstrijden — een zuiver lokale wedstrijd heeft toch nooit een cloud-spoor.
  if (cloudReady && activeTeamId && isAdmin && m) {
    try {
      const nr = notesRef(m.id);
      // fbOnce() i.p.v. ruwe once('value'): offline zonder gecachte waarde resolvet die
      // nooit, en de bestaande try/catch vangt dat niet op (geen reject, gewoon een eeuwig
      // hangende await) — de bevestigingsmodal bleef dan open zonder foutmelding of lokale
      // verwijdering. fbOnce() gooit bij timeout wél, wat hier alsnog netjes wordt opgevangen.
      const notesSnap = nr ? await fbOnce(nr) : null;
      await fbdb.ref('deletedMatches/' + activeTeamId + '/' + m.id).set({
        deletedAt: Date.now(),
        deletedBy: currentUser ? currentUser.uid : null,
        deletedByEmail: (currentUser && currentUser.email) || '',
        match: jclone(m),
        notes: notesSnap ? notesSnap.val() : null,
      });
    } catch (e) {}
  }
  await dbDel(m.id); match = null; closeModal(); go('home');
}

// ===================== PDF EXPORT =====================
// Rasterizeert een afbeeldingsbron (pad, data-URL, of SVG-tekst als data-URI) naar een
// PNG data-URL op de gevraagde pixelgrootte — nodig omdat jsPDF geen SVG kan tekenen.
// Geeft null terug bij een fout i.p.v. te crashen (een ontbrekende foto mag de PDF niet breken).
// Verkleinen in halveringsstappen. Eén grote sprong (bv. 320 naar 48 px) laat de browser maar een
// handvol bronpixels bemonsteren: randen worden zacht en dunne lijnen verdwijnen half. Door telkens
// te halveren tot vlak boven de doelmaat middelt elke stap netjes uit en blijft het beeld scherp.
function _verkleinStapsgewijs(img, doelW, doelH) {
  let cv = document.createElement('canvas');
  cv.width = img.width || doelW; cv.height = img.height || doelH;
  let ctx = cv.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0);
  while (cv.width / 2 >= doelW && cv.height / 2 >= doelH) {
    const k = document.createElement('canvas');
    k.width = Math.max(doelW, Math.round(cv.width / 2));
    k.height = Math.max(doelH, Math.round(cv.height / 2));
    const kc = k.getContext('2d');
    kc.imageSmoothingQuality = 'high';
    kc.drawImage(cv, 0, 0, k.width, k.height);
    cv = k;
  }
  const eind = document.createElement('canvas');
  eind.width = doelW; eind.height = doelH;
  const ec = eind.getContext('2d');
  ec.imageSmoothingQuality = 'high';
  ec.drawImage(cv, 0, 0, doelW, doelH);
  return eind;
}
function rasterizeToPng(src, w, h) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try { resolve(_verkleinStapsgewijs(img, w, h).toDataURL('image/png')); }
      catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
// Als rasterizeToPng, maar behoudt de beeldverhouding binnen een max-vak. Geeft
// { uri, w, h } terug (of null) zodat jsPDF de afbeelding onvervormd kan plaatsen.
// `w`/`h` zijn de maten in PDF-PUNTEN; `dichtheid` bepaalt hoeveel pixels daarachter zitten
// (zie PDF_LOGO_DICHTHEID in js/core.js).
function rasterizeToPngFit(src, maxW, maxH, dichtheid = 1) {
  return new Promise(resolve => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(maxW / img.width, maxH / img.height, 1) || 1;
        const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
        const canvas = _verkleinStapsgewijs(img, Math.max(1, Math.round(w * dichtheid)),
                                                 Math.max(1, Math.round(h * dichtheid)));
        resolve({ uri: canvas.toDataURL('image/png'), w, h });
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
// Welk icoon hoort bij welk soort gebeurtenis — dezelfde toewijzing als evtLabel() op het scherm.
// Wijzig je daar het icoon van een gebeurtenis, pas het hier ook aan.
const PDF_EVT_ICON = {
  goal_us: 'goal', goal_them: 'goal', own_goal: 'goal', own_goal_them: 'goal',
  corner_us: 'corner', corner_them: 'corner', substitution: 'swap', posSwap: 'compass',
  yellow_card: 'cardY', red_card: 'cardR', penalty_us: 'penalty', penalty_them: 'penalty',
  freekick_us: 'bolt', freekick_them: 'bolt', injury: 'injury', shot_us: 'shot', shot_them: 'shot',
  save_us: 'save', save_them: 'save', disallowed_us: 'disallowed', disallowed_them: 'disallowed',
  captain_change: 'captain', quarter_start: 'playFilled', quarter_end: 'stopFilled',
};
// De iconen van de gebeurtenissen als kleine PNG's, klaar voor doc.addImage(). jsPDF kan geen SVG
// tekenen, dus rasteriseren we de ECHTE app-iconen (i.p.v. ze in de PDF na te tekenen): zo blijven
// scherm en PDF hetzelfde. Eén keer per PDF opgebouwd, enkel voor de soorten die effectief voorkomen.
// `currentColor` moet een echte kleur worden, want in een <img> erft een SVG geen tekstkleur.
// Cache over PDF's heen: de iconen zijn altijd dezelfde 64×64 PNG's. Bij een tornooi-PDF van 8
// wedstrijden werd dezelfde set ~16 keer opnieuw gerasterizeerd (elke ronde een <img>-load plus een
// canvas), wat op een telefoon merkbaar traag was. Eén Map volstaat; ze wordt nooit ongeldig, want
// de iconen zitten in de code en veranderen enkel met een app-update (en dan is de pagina nieuw).
const _pdfIconCache = new Map();
async function pdfEventIcons(events) {
  const icons = {};
  const keys = [...new Set((events || []).map(e => PDF_EVT_ICON[e.type]).filter(k => k && IC[k]))];
  for (const k of keys) {
    if (!_pdfIconCache.has(k)) {
      const svg = IC[k]
        .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" ')
        .replace(/currentColor/g, '#374151');
      _pdfIconCache.set(k, await rasterizeToPng('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), 64, 64));
    }
    icons[k] = _pdfIconCache.get(k);
  }
  return icons;
}
function pdfEventIcon(icons, e) { const k = e && PDF_EVT_ICON[e.type]; return (k && icons[k]) || null; }
// Verhouding van het velddiagram (326 x 504 eenheden, zoals de veldweergave op het scherm).
const PITCH_PDF_RATIO = 504 / 326;
// Tekent het velddiagram als ECHTE PDF-vectoren i.p.v. een ingebedde PNG. Voordien werd
// een SVG-versie van het veld naar een PNG van 652x1008 px gerasterizeerd en op ~150 pt geplaatst (~313 dpi):
// vier kwarten maakten de PDF ~8 MB groot en de namen waren geïnterpoleerd/onscherp. Vectoren
// zijn enkele KB's, blijven scherp bij elke zoom en de rugnummers/namen worden doorzoekbare tekst.
// Geometrie is 1-op-1 dezelfde als de veldweergave op het scherm (pitchLines()/.pitch in
// views-account.js resp. index.html) zodat scherm en PDF hetzelfde veld tonen; wijzig je daar de
// afmetingen, pas dan ook deze constanten aan.
function drawPitchPdf(doc, m, players, x0, y0, w, capId, qNum) {
  const W = 320, H = 480, R = 15;
  const PAW = 189, PAD = 75, GAW = 86, GAD = 25, CCR = 43, PENY = 50, CR = 8, RX = 8;
  const S = w / 326;                       // eenheden -> punten
  const ux = u => x0 + (u + 3) * S;        // viewBox begint op x=-3
  const uy = v => y0 + (v + 12) * S;       // ... en op y=-12
  const L = n => n * S;
  // Gras: basisvlak in de donkere tint, daarbovenop de lichtere banen. De banen worden geklemd
  // tot binnen de afronding, zodat er geen vierkante hoekjes buiten de ronde rand vallen.
  doc.setFillColor(27, 128, 64);
  doc.roundedRect(ux(0), uy(0), L(W), L(H), L(RX), L(RX), 'F');
  doc.setFillColor(30, 148, 73);
  for (let top = 30; top < H; top += 60) {
    const a = Math.max(top, RX), b = Math.min(top + 30, H - RX);
    if (b > a) doc.rect(ux(0), uy(a), L(W), L(b - a), 'F');
  }
  // Belijning
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(L(2.5)); doc.roundedRect(ux(0), uy(0), L(W), L(H), L(RX), L(RX), 'S');
  doc.setLineWidth(L(2));
  doc.line(ux(0), uy(H / 2), ux(W), uy(H / 2));
  doc.circle(ux(W / 2), uy(H / 2), L(CCR), 'S');
  doc.rect(ux((W - PAW) / 2), uy(0), L(PAW), L(PAD), 'S');
  doc.rect(ux((W - PAW) / 2), uy(H - PAD), L(PAW), L(PAD), 'S');
  doc.rect(ux((W - GAW) / 2), uy(0), L(GAW), L(GAD), 'S');
  doc.rect(ux((W - GAW) / 2), uy(H - GAD), L(GAW), L(GAD), 'S');
  doc.setFillColor(255, 255, 255);
  doc.circle(ux(W / 2), uy(H / 2), L(3), 'F');
  doc.circle(ux(W / 2), uy(PENY), L(3), 'F');
  doc.circle(ux(W / 2), uy(H - PENY), L(3), 'F');
  // Hoekbogen: jsPDF kan geen losse boog tekenen, dus benaderen met een kwartcirkel in lijnstukjes.
  const arc = (cx, cy, from) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) { const a = from + (i / 6) * (Math.PI / 2); pts.push([ux(cx + Math.cos(a) * CR), uy(cy + Math.sin(a) * CR)]); }
    for (let i = 1; i < pts.length; i++) doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  };
  arc(0, 0, 0); arc(W, 0, Math.PI / 2); arc(0, H, -Math.PI / 2); arc(W, H, Math.PI);
  // Spelers: zelfde plaatsingsregels als renderPitch (x/y indien gekend, anders verdeeld over de lijn).
  const pts = [];
  players.filter(p => typeof p.x === 'number' && typeof p.y === 'number').forEach(p => pts.push({ p, x: p.x, y: p.y }));
  const byLine = {};
  players.filter(p => !(typeof p.x === 'number' && typeof p.y === 'number')).forEach(p => { (byLine[p.line] = byLine[p.line] || []).push(p); });
  Object.entries(byLine).forEach(([line, ps]) => {
    const yy = LINE_Y[line] != null ? LINE_Y[line] : 50, n = ps.length;
    ps.forEach((p, i) => pts.push({ p, x: n === 1 ? 50 : 18 + i * (64 / (n - 1)), y: yy }));
  });
  // Zie renderPitch: ontdubbelen over de hele wedstrijdselectie, zodat een invaller met dezelfde
  // voornaam in het wisselplaatje eronder ook zijn letter krijgt.
  const dns = fieldDisplayNames((m && m.players && m.players.length) ? m.players : pts.map(({ p }) => p));
  const marks = periodPlayerMarks(m, qNum);
  // 12 eenheden (i.p.v. 10) voor de namen: op papier las 10 te klein. Het nummer in de bol blijft
  // op 13 — groter past niet binnen de bol (radius 15).
  const numSize = Math.max(5, L(13)), nameSize = Math.max(4.5, L(12));
  // Naamplaatje (en eventueel het wisselplaatje eronder) tekenen, horizontaal binnen het veld
  // geklemd: bij een speler op de flank zou een lange naam anders buiten het diagram uitsteken en
  // (in de 2x2-weergave) over het veld ernaast lopen. Op het scherm valt dat weg door de overflow
  // van .pitch, in de PDF clipt niets.
  //  icoW = ruimte vóór de tekst (wisselpijltjes), tailW = ruimte erachter (kaartjes).
  const chip = (txt, cx, top, size, color, icoW = 0, tailW = 0) => {
    doc.setFontSize(size);
    const tw = doc.getTextWidth(txt) + icoW + tailW, pad = size * 0.3, half = tw / 2 + pad;
    const lx = Math.min(Math.max(cx, ux(0) + half), ux(W) - half);
    doc.setFillColor(12, 14, 12);
    let gs = null;
    try { gs = new doc.GState({ opacity: 0.5 }); doc.setGState(gs); } catch (e) { gs = null; }
    doc.roundedRect(lx - half, top, tw + pad * 2, size * 1.35, size * 0.25, size * 0.25, 'F');
    if (gs) { try { doc.setGState(new doc.GState({ opacity: 1 })); } catch (e) {} }
    doc.setTextColor(...color);
    doc.text(txt, lx - half + pad + icoW, top + size);
    return { bottom: top + size * 1.35, icoX: lx - half + pad, midY: top + size * 0.68,
             tailX: lx - half + pad + icoW + doc.getTextWidth(txt) };
  };
  // Wisselicoon: twee tegengestelde pijltjes (zoals het wisselicoon in de app), getekend met
  // lijnen omdat de PDF-fonts geen pijlglyphs hebben (een echt pijlteken werd '?').
  const swapIcon = (x, midY, s, color) => {
    doc.setDrawColor(...color); doc.setLineWidth(Math.max(0.25, s * 0.1));
    const w = s * 1.15, dy = s * 0.3, head = s * 0.32;
    doc.line(x, midY - dy, x + w, midY - dy);                      // bovenste pijl naar rechts
    doc.line(x + w - head, midY - dy - head * 0.7, x + w, midY - dy);
    doc.line(x + w - head, midY - dy + head * 0.7, x + w, midY - dy);
    doc.line(x, midY + dy, x + w, midY + dy);                      // onderste pijl naar links
    doc.line(x + head, midY + dy - head * 0.7, x, midY + dy);
    doc.line(x + head, midY + dy + head * 0.7, x, midY + dy);
    return w;
  };
  // Kaartjes achter de naam (niet bij de bol: daar leken ze bij het positienummer te horen).
  // Hoeveel breedte ze in het naamplaatje innemen, en hoe ze getekend worden.
  const cardCount = mk => mk ? ((mk.yellow || 0) + (mk.red ? 1 : 0)) : 0;
  const cardsWidth = (mk, size) => cardCount(mk) * size * 0.85;
  const drawCards = (mk, x, midY, size) => {
    const cw = size * 0.62, ch = size * 0.92;
    let bx = x + size * 0.2;
    const card = rgb => { doc.setFillColor(...rgb); doc.setDrawColor(30, 30, 30); doc.setLineWidth(Math.max(0.15, cw * 0.09)); doc.rect(bx, midY - ch / 2, cw, ch, 'FD'); bx += cw + size * 0.22; };
    for (let i = 0; i < (mk.yellow || 0); i++) card([242, 194, 0]);
    if (mk.red) card([229, 57, 53]);
  };
  for (const { p, x, y } of pts) {
    const cx = ux(x / 100 * W), cy = uy(y / 100 * H);
    doc.setFillColor(...(p.line === 'Doel' ? [245, 130, 31] : [16, 16, 16]));
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(L(2));
    doc.circle(cx, cy, L(R), 'FD');
    doc.setTextColor(255, 255, 255); doc.setFont(undefined, 'bold');
    doc.setFontSize(numSize);
    // In de bol staat ENKEL het positienummer (vast per plaats in de formatie), nooit het rugnummer:
    // die zijn optioneel en horen buiten het veld (chips, lijsten). Zelfde regel als op het scherm,
    // zie pitchDot(). Geen positienummer (oude wedstrijd waarvan de x/y niet meer op een slot valt)
    // → lege bol met enkel de naam eronder, i.p.v. het vroegere "?".
    const bolTekst = String(p.posNum || '');
    if (bolTekst) doc.text(bolTekst, cx, cy + numSize * 0.35, { align: 'center' });
    // Naam op een donker plaatje: wit-op-gras liep in elkaar over waar twee bollen dicht bij
    // elkaar staan (zelfde reden als de .pdot-lbl-achtergrond op het scherm).
    const label = (dns.get(p.id) || _firstName(p.name || '')) + (capId === p.id ? ' ©' : '');
    const mk = marks.get(p.id);
    const nameChip = chip(label, cx, cy + L(R) + nameSize * 0.25, nameSize, [255, 255, 255], 0, cardsWidth(mk, nameSize));
    if (cardCount(mk)) drawCards(mk, nameChip.tailX, nameChip.midY, nameSize);
    // Tijdens dit deel gewisseld: wie er in zijn plaats kwam, eronder met het wisselicoon.
    if (mk && mk.subs.length) {
      const s = nameSize * 0.92, icoW = s * 1.5;
      const c = chip(mk.subs.join(' · '), cx, nameChip.bottom + nameSize * 0.15, s, [253, 214, 160], icoW);
      swapIcon(c.icoX, c.midY, s * 0.85, [253, 214, 160]);
    }
  }
  doc.setTextColor(23, 23, 23); doc.setFont(undefined, 'normal'); doc.setLineWidth(0.75);
}

// Selectie van een wedstrijd in vier groepen, gesorteerd op familienaam. Gedeeld door de PDF en
// het verslag op het scherm, zodat beide altijd hetzelfde tonen.
//  - selected       : kern + wissels (met rugnummer)
//  - notAvailable   : NB in de selectie (m.absentPlayers), eventueel met reden
//  - notPresent     : wél geselecteerd, maar tijdens de wedstrijd als niet aanwezig gemarkeerd
//  - notSelected    : NG — rosterspelers die niet in de wedstrijd zaten (leeg als de ploeg weg is)
// Bij een TORNOOIWEDSTRIJD gelden twee uitzonderingen, want beschikbaarheid en tornooiselectie geef
// je één keer voor de hele dag in en zijn dus identiek voor elke wedstrijd (ze staan op de
// tornooipagina en in het tornooiverslag):
//  - notAvailable blijft leeg — NB hoort bij het tornooi, niet bij de wedstrijd (v0.7.5)
//  - notSelected  = enkel wie meeging naar het tornooi maar deze wedstrijd niet speelde, i.p.v. de
//    hele ploegkern (anders stonden de NB'ers en de niet-opgeroepen spelers in elk wedstrijdverslag)
function matchSelectionGroups(m) {
  const byLast = (a, b) => _lastName(a.name || '').localeCompare(_lastName(b.name || ''), 'nl');
  // Een rugnummer wordt getoond als de speler er een heeft — de wedstrijd draagt haar eigen kopie
  // mee, en die blijft de waarheid voor dát verslag. Wil je ze weg, dan wis je ze in de wedstrijd
  // zelf ("Rugnummers" op het verslag); de ploeginstelling regelt enkel het rooster en wat er in
  // een nieuwe wedstrijd voorgevuld wordt.
  const num = p => p.number || '';
  const pick = p => ({ name: p.name || '', number: num(p), rosterId: p.rosterId || null, guest: !!p.guest });
  const selected = m.players.filter(p => !p.absent).map(pick).sort(byLast);
  const notPresent = m.players.filter(p => p.absent).map(pick).sort(byLast);
  // Ploeg bij voorkeur via het stabiele m.teamId (sinds v0.5.34), met dezelfde naam-fallback als
  // editMatchWizard: wedstrijden van vóór die versie hebben geen teamId, en zonder ploeg bleef de
  // groep "Niet geselecteerd" daar onterecht leeg.
  const team = typeof teamById === 'function'
    ? (teamById(m.teamId) || (typeof getTeamsV2 === 'function' ? (getTeamsV2().find(t => t.name === m.teamName) || null) : null))
    : null;
  const trn = (m.tournamentId && typeof tournamentById === 'function') ? tournamentById(m.tournamentId) : null;
  if (trn) {
    const known = new Set();
    [...selected, ...notPresent].forEach(p => { if (p.rosterId) known.add(p.rosterId); known.add(p.name); });
    // Wie pas ná deze wedstrijd aan de dagselectie toegevoegd is (addedAt), hoort hier niet: hij
    // stond dan onder "Niet voor deze wedstrijd geselecteerd" terwijl hij er nog niet eens bij was.
    // Squad-entries van vóór dit veld hebben geen addedAt en blijven dus gewoon meegerekend.
    const naDezeMatch = s => s.addedAt && m.createdAt && s.addedAt > m.createdAt;
    const notSelected = tournamentSquadMee(trn)
      .filter(s => !known.has(s.srcId) && !known.has(s.name) && !naDezeMatch(s))
      .map(s => ({ name: s.name || '', number: num(s), rosterId: s.srcId || null, guest: !!s.guest, fromName: s.fromName || '' })).sort(byLast);
    return { selected, notAvailable: [], notPresent, notSelected };
  }
  const notAvailable = [];
  for (const a of (m.absentPlayers || [])) {
    const rec = typeof a === 'string' ? { name: a, rosterId: null, reason: '' } : { name: a.name || '', rosterId: a.rosterId || null, reason: a.reason || '' };
    if (!rec.name) continue;
    // Ook tegen `selected` ontdubbelen: staat iemand per ongeluk zowel in de wedstrijdselectie als
    // in de afwezigenlijst (kan door een oude of half bewerkte wedstrijd), dan zou hij in twee
    // elkaar tegensprekende groepen verschijnen. Wie effectief in de selectie zat, wint.
    const dup = [...selected, ...notPresent, ...notAvailable].some(x => (rec.rosterId && x.rosterId === rec.rosterId) || x.name === rec.name);
    if (dup) continue;
    // NB'ers uit de selectiestap dragen geen rugnummer mee — dat staat enkel in de kern van de
    // ploeg, dus daar opzoeken zodat de lijst er niet half genummerd uitziet.
    const r = ((team && team.players) || []).find(p => (rec.rosterId && p.id === rec.rosterId) || p.name === rec.name);
    notAvailable.push({ name: rec.name, number: (r && r.number) || '', rosterId: rec.rosterId, reason: rec.reason });
  }
  notAvailable.sort(byLast);
  const known = new Set();
  [...selected, ...notPresent, ...notAvailable].forEach(p => { if (p.rosterId) known.add(p.rosterId); known.add(p.name); });
  const notSelected = ((team && team.players) || [])
    .filter(p => !known.has(p.id) && !known.has(p.name))
    .map(p => ({ name: p.name || '', number: num(p), rosterId: p.id })).sort(byLast);
  return { selected, notAvailable, notPresent, notSelected };
}
// Naam met rugnummer ervoor, voor de selectielijsten ("7 Wout Coppens"); bij een NB'er komt de
// eventuele reden erachter tussen haakjes ("13 Lars Marysse (speelt elders)").
// Eén opmaakpunt voor alle spelerslijsten (tornooipagina, verslag, deelbericht en beide PDF's).
// Een gastspeler krijgt zijn herkomst mee, zodat hij nergens als eigen ploegspeler leest.
function nameWithNum(p) {
  const bits = [];
  if (p.guest) bits.push('gast' + (p.fromName ? ' · ' + p.fromName : ''));
  if (p.reason) bits.push(absentReasonLabel(p.reason).toLowerCase());
  return (p.number ? p.number + ' ' : '') + p.name + (bits.length ? ` (${bits.join(', ')})` : '');
}
// De vier selectiegroepen als [label, namen]-blokken, in vaste volgorde. Eén bron voor het
// verslag op het scherm en de PDF-sectie.
function selectionBlocks(m) {
  const g = matchSelectionGroups(m);
  // Derde element = "hoofdlijst": bepaalt in de PDF de tekstkleur (zwart voor de selectie, grijs voor
  // de nevengroepen). Vroeger hing die kleur af van "heeft dit blok een label", maar sinds de
  // selectie zelf ook "Geselecteerd:" als label heeft, zou dat de namen grijs maken.
  const blocks = [];
  // Bij een TORNOOIWEDSTRIJD is de selectie voor elke wedstrijd van die dag dezelfde (je duidt ze één
  // keer aan voor het hele tornooi), net als "niet beschikbaar" en "niet geselecteerd" — die staan op
  // de tornooipagina en in het tornooiverslag. Hier blijft dus enkel wat per wedstrijd kán afwijken:
  // wie niet aanwezig was (bv. na twee wedstrijden naar huis) en, als de trainer toch iemand uitvinkte,
  // wie niet voor deze wedstrijd geselecteerd was. Is er geen afwijking, dan valt de kaart weg.
  // Wie meegespeeld heeft mag een kijker altijd zien; wie niet gekozen werd of niet beschikbaar was
  // (met reden) volgt de statsPublic-keuze 'selected' — zelfde regel als het tornooiverslag en de
  // statistiekenpagina. Geldt hier in één keer voor het scherm (selectionCardHtml) én de PDF.
  const nevengroepen = statSectionVisible('selected');
  if (m.tournamentId) {
    // Zonder label: de sectiekop is hier al "Niet aanwezig (n)".
    if (nevengroepen && g.notPresent.length) blocks.push(['', g.notPresent, true]);
    if (nevengroepen && g.notSelected.length) blocks.push(['Niet voor deze wedstrijd geselecteerd:', g.notSelected]);
    return { groups: g, blocks };
  }
  if (g.selected.length) blocks.push(['Geselecteerd:', g.selected, true]);
  if (nevengroepen && g.notAvailable.length) blocks.push(['Niet beschikbaar:', g.notAvailable]);
  if (nevengroepen && g.notPresent.length) blocks.push(['Geselecteerd maar niet aanwezig:', g.notPresent]);
  if (nevengroepen && g.notSelected.length) blocks.push(['Niet geselecteerd:', g.notSelected]);
  return { groups: g, blocks };
}
// Selectiekaart voor het verslag op het scherm — zelfde inhoud als de PDF-sectie 'Selectie'.
function selectionCardHtml(m) {
  const { groups, blocks } = selectionBlocks(m);
  if (!blocks.length) return '';
  // Bij een tornooiwedstrijd staat hier enkel nog de afwijking op de tornooiselectie, dus is een kop
  // "Selectie (8)" misleidend.
  // Kop op de ZICHTBARE blokken baseren: bij een tornooiwedstrijd blijven voor een kijker enkel de
  // nevengroepen over, en die kunnen verborgen zijn — dan is "Niet aanwezig (1)" boven een lege
  // kaart misleidend (de kaart valt dan trouwens al weg via de blocks.length-check hierboven).
  const toontNotPresent = blocks.some(b => b[1] === groups.notPresent);
  const title = (m.tournamentId && toontNotPresent) ? `Niet aanwezig (${groups.notPresent.length})` : `Selectie (${groups.selected.length})`;
  return `<div class="sec">${title}</div>
    <div class="card">
      ${blocks.map(([lbl, list]) => `<p style="font-size:14px;line-height:1.6;margin-bottom:6px">${lbl ? `<span style="color:var(--txt2)">${esc(lbl)}</span> ` : ''}${esc(list.map(nameWithNum).join(', '))}</p>`).join('')}
    </div>`;
}
// Thuis- en uitploeg bij naam: elke tussenstand wordt als "thuis – uit" weergegeven, dus bij een
// uitwedstrijd staat de eigen ploeg tweede. Zonder deze namen erbij is dat niet af te leiden.
function homeName(m) { return isAway(m) ? m.opponent : tName(m); }
function awayName(m) { return isAway(m) ? tName(m) : m.opponent; }

// ===================== GEDEELDE PDF-OPMAAK =====================
// Paginamaten, cursor (L.y), sectiekoppen, pagina-einden en tabellen die als één blok bij elkaar
// blijven. Gedeeld door de wedstrijd-PDF (exportPDF) en de tornooi-PDF (exportTournamentPDF), zodat
// beide er identiek uitzien en een wijziging aan de opmaak op één plek gebeurt.
function createPdfLayout(doc) {
  const Ctor = window.jspdf.jsPDF;
  const L = { PW: 595.28, PH: 841.89, MG: 40, CW: 595.28 - 80, y: 40 };
  L.ensure = need => { if (L.y + need > L.PH - L.MG) { doc.addPage(); L.y = L.MG; } };
  // `need` = hoogte van wat direct ná de kop komt: zo blijft een sectiekop nooit alleen
  // onderaan een pagina staan met zijn inhoud op de volgende.
  L.heading = (text, need = 0) => {
    L.ensure(30 + need);
    doc.setFont(undefined, 'bold'); doc.setFontSize(12); doc.setTextColor(107, 114, 128);
    doc.text(String(text).toUpperCase(), L.MG, L.y);
    L.y += 5; doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.75); doc.line(L.MG, L.y, L.MG + L.CW, L.y);
    L.y += 16; doc.setTextColor(23, 23, 23);
  };
  // Meet de hoogte van een autoTable door hem in een wegwerp-document te tekenen (autoTable
  // heeft geen "meet-alleen"-modus). Geeft null als de tabel niet op één pagina past —?" dan is
  // samenhouden onmogelijk en mag hij gewoon splitsen.
  L.measureTable = opts => {
    try {
      const tmp = new Ctor({ unit: 'pt', format: 'a4' });
      tmp.autoTable({ ...opts, startY: L.MG });
      const pages = tmp.getNumberOfPages ? tmp.getNumberOfPages() : tmp.internal.getNumberOfPages();
      if (pages > 1) return null;
      return tmp.lastAutoTable.finalY - L.MG;
    } catch (e) { return null; }
  };
  // Tekent een tabel (met optionele sectiekop) als één samenhangend blok: past kop + tabel niet
  // meer op deze pagina, dan schuift het geheel naar een nieuwe pagina i.p.v. afgekapt te worden.
  // rowPageBreak:'avoid' voorkomt bovendien dat een meerregelige rij middendoor geknipt wordt.
  // `note` = grijze toelichtingsregel tussen kop en tabel (bv. welke ploeg als eerste staat).
  L.tableBlock = (title, opts, gapAfter = 24, note = '') => {
    const full = { margin: { left: L.MG, right: L.MG, top: L.MG, bottom: L.MG }, rowPageBreak: 'avoid', ...opts };
    const h = L.measureTable(full);
    // Een lange toelichting moet afbreken i.p.v. voorbij de rechtermarge te lopen —?" dus vooraf
    // opsplitsen en de hoogte meerekenen.
    let noteLines = [];
    if (note) { doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); noteLines = doc.splitTextToSize(note, L.CW); }
    const headH = (title ? 30 : 0) + noteLines.length * 12 + (note ? 4 : 0);
    if (h != null && L.y + headH + h > L.PH - L.MG) { doc.addPage(); L.y = L.MG; }
    if (title) L.heading(title);
    if (noteLines.length) {
      doc.setFont(undefined, 'normal'); doc.setFontSize(9.5); doc.setTextColor(107, 114, 128);
      for (const ln of noteLines) { doc.text(ln, L.MG, L.y); L.y += 12; }
      L.y += 4; doc.setTextColor(23, 23, 23);
    }
    doc.autoTable({ ...full, startY: L.y });
    L.y = doc.lastAutoTable.finalY + gapAfter;
  };
  // Sectiekop met vrije tekst eronder (wikkelt en respecteert pagina-einden).
  L.textBlock = (title, txt, size = 11) => {
    if (!txt) return;
    doc.setFont(undefined, 'normal'); doc.setFontSize(size);
    const lines = doc.splitTextToSize(txt, L.CW);
    L.heading(title, Math.min(lines.length, 4) * 15);
    doc.setFont(undefined, 'normal'); doc.setFontSize(size); doc.setTextColor(23, 23, 23);
    for (const ln of lines) { L.ensure(15); doc.text(ln, L.MG, L.y); L.y += 15; }
    L.y += 12;
  };
  // Voettekst + paginanummer op ELKE pagina: één losse doc.text() na het opbouwen belandt enkel op
  // de pagina die dan actief is (de laatste).
  // Drie delen: links het app-merkje (op dezelfde marge als het clublogo bovenaan), in het midden
  // de clubnaam, rechts de paginanummering. Het app-logo stond vroeger linksboven; die plek is nu
  // voor de club, want het verslag is een clubdocument.
  // `merk` is optioneel en komt van rasterizeToPngFit: { uri, w, h } in punten — enkel het
  // PICTOGRAM. De naam zetten we ernaast als echte PDF-tekst, niet als afbeelding: een gerasterde
  // letter blijft zacht naast de vectortekst van de clubnaam en het paginanummer, ook op 576 dpi.
  // Vet, hoofdletters en ruim gespatieerd, zodat het samen als één merkje leest.
  L.footer = (merk) => {
    const total = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
    const basis = L.PH - 20;               // tekstlijn van de voettekst
    for (let pg = 1; pg <= total; pg++) {
      doc.setPage(pg);
      let x = L.MG;
      if (merk) {
        // Verticaal rond de tekstlijn centreren, zodat pictogram en tekst op één hoogte lezen.
        try { doc.addImage(merk.uri, 'PNG', x, basis - merk.h + 2.5, merk.w, merk.h, 'appmerk', PDF_BEELD_COMPRESSIE); } catch (e) {}
        x += merk.w + 5;
      }
      doc.setFont(undefined, 'bold'); doc.setFontSize(8); doc.setTextColor(120, 128, 138);
      if (doc.setCharSpace) doc.setCharSpace(0.7);
      doc.text('MATCH DELEGATE', x, basis);
      if (doc.setCharSpace) doc.setCharSpace(0);
      doc.setFont(undefined, 'normal'); doc.setFontSize(9); doc.setTextColor(156, 163, 175);
      const club = activeClubName || getClubName();
      if (club) doc.text(club, L.PW / 2, basis, { align: 'center' });
      doc.text(`${pg} / ${total}`, L.MG + L.CW, basis, { align: 'right' });
    }
  };
  return L;
}
// Alle secties óver de wedstrijd zelf in een bestaand document tekenen: selectie, opstelling per
// deel, tussenstand, statistieken, keeper(s), spelers, foto's, notities en de tijdlijn. Gebruikt door
// de wedstrijd-PDF én door de tornooi-PDF, die na het dagoverzicht elke wedstrijd toevoegt. De kop
// (logo's, titel, score) en het tornooiblok staan bij de aanroeper: die verschillen per document.
async function pdfMatchBody(doc, L, m) {
  const { PW, PH, MG, CW } = L;
  const ensure = L.ensure, heading = L.heading, tableBlock = L.tableBlock;
  const mins = calcMinutes(m);
  const qData = calcMinutesPerQuarter(m);
  const stat = (type) => m.events.filter(e => e.type === type).length;

  // ---- Selectie (kern + bank, dan de afwezigen en wie niet geselecteerd was) ----
  // Bij een tornooiwedstrijd bevat dit enkel de afwijking op de tornooiselectie (zie selectionBlocks),
  // dus krijgt de sectie daar een passende kop; zonder afwijking valt ze helemaal weg.
  const selGroups = selectionBlocks(m);
  const selBlocks = selGroups.blocks;
  if (selBlocks.length) {
    doc.setFont(undefined, 'normal'); doc.setFontSize(11.5);
    const wrapped = selBlocks.map(([lbl, list]) => doc.splitTextToSize((lbl ? lbl + ' ' : '') + list.map(nameWithNum).join(', '), CW));
    const selTitle = (m.tournamentId && selBlocks.some(b => b[1] === selGroups.groups.notPresent)) ? 'Niet aanwezig' : 'Selectie';
    heading(selTitle, wrapped.reduce((n, w) => n + w.length * 15, 0) + (selBlocks.length - 1) * 4);
    for (let i = 0; i < wrapped.length; i++) {
      doc.setFont(undefined, 'normal'); doc.setFontSize(11.5);
      doc.setTextColor(...(selBlocks[i][2] ? [23, 23, 23] : [107, 114, 128]));
      for (const line of wrapped[i]) { ensure(15); doc.text(line, MG, L.y); L.y += 15; }
      L.y += 4;
    }
    doc.setTextColor(23, 23, 23);
    L.y += 8;
  }

  // De tabel "Opstelling per <deel>" staat niet meer in de PDF: de velddiagrammen tonen sinds
  // v0.6.3 zelf de bank per deel en de kaarten/blessures, dus ze overlapte volledig. In het
  // verslag op het scherm blijft ze wel staan (daar is geen pagina-beperking).

  // ---- Opstelling (diagram = afbeelding, rest van het PDF blijft tekst) ----
  if (m.players.some(p => p.starting)) {
    const numQ = m.quarters.length || 1;
    const items = numQ <= 1
      ? [{ q: null, ps: m.players.filter(p => p.starting), capId: m.captainId }]
      : Array.from({ length: numQ }, (_, i) => { const q = i + 1; return { q, ps: playersAtPeriodStart(m, q), capId: captainAtStartOfQuarter(m, q) }; });
    // De diagrammen lopen gewoon mee in de tekst en mogen over twee pagina's vloeien (bv. twee
    // velden op pagina 1 en twee op pagina 2). De breedte volgt uit de PAGINABREEDTE, niet uit de
    // resterende hoogte: een eigen pagina liet pagina 1 halfleeg en maakte de velden kleiner dan
    // nodig. Ze tonen sinds v0.6.3 ook de bank per deel en de kaarten, waardoor de aparte tabel
    // "Opstelling per <deel>" overbodig werd.
    const labelH = items[0].q != null ? 14 : 0;
    const benchLines = items.map(it => {
      // Bij één blok is it.q null (er is geen "Deel 1"-label nodig), maar de bank hoort er wél bij:
      // op het scherm staat ze onder hetzelfde diagram, en in de PDF viel ze daardoor stil weg —
      // net bij tornooiwedstrijden, die vrijwel altijd uit één blok bestaan.
      const q = it.q != null ? it.q : (m.quarters && m.quarters.length ? 1 : null);
      const names = q != null ? periodBenchNames(m, q) : [];
      return names.length ? ('Bank: ' + names.join(', ')) : '';
    });
    const gap = 12;
    const perRow = items.length === 1 ? 1 : (items.length <= 4 ? 2 : 3);
    // Bankregel in dezelfde lettergrootte als de namen op het veld (zie nameSize in drawPitchPdf:
    // 10 eenheden van de 326 brede viewBox), zodat de bank niet als bijzaak leest.
    const benchSize0 = Math.max(7, ((CW - (perRow - 1) * gap) / perRow) / 326 * 12);
    const benchH = benchLines.some(Boolean) ? benchSize0 * 2.6 + 4 : 0;
    const availH = (PH - MG * 2) - labelH - benchH - 14;
    // Eén enkel diagram (wedstrijd van één deel) mag de pagina niet opeisen. Zonder tweede kolom
    // volgde de hoogte uit de vólle paginahoogte: het veld vulde dan een hele pagina, de kop
    // "Opstelling" bleef alleen achter op de pagina ervóór en alles erna schoof door.
    // Nu vult het de ruimte die op DEZE pagina nog over is (met een bovengrens van iets meer dan de
    // halve pagina), zodat de info erboven en het veld samen op één pagina staan en de tabellen
    // erna gewoon doorlopen. Blijft er te weinig over voor een leesbaar veld, dan begint het op een
    // nieuwe pagina met die bovengrens als maat.
    let maxImgH = availH;
    if (items.length === 1) {
      const cap = Math.min(availH, (PH - MG * 2) * 0.55);
      const rest = (PH - MG) - L.y - 30 - labelH - benchH - 14;   // 30 = hoogte van de sectiekop
      maxImgH = rest >= 300 ? Math.min(cap, rest) : cap;
    }
    const imgW = Math.min((CW - (perRow - 1) * gap) / perRow, maxImgH / PITCH_PDF_RATIO);
    const imgH = imgW * PITCH_PDF_RATIO;
    const benchSize = Math.max(7, imgW / 326 * 12), benchLineH = benchSize * 1.25;
    const rowH = imgH + labelH + benchH + 14;
    // "Startopstelling per kwart/helft/deel": de diagrammen tonen de stand bij de START van elke
    // periode (formatie staat al in de inforegel bovenaan, dus niet dubbel vermelden).
    // Kop en eerste rij samenhouden, anders blijft de kop alleen onderaan een pagina staan.
    ensure(21 + rowH);
    heading(items.length > 1 ? `Opstelling per ${pSingLow(m)}` : 'Opstelling');
    for (let i = 0; i < items.length; i += perRow) {
      const rowItems = items.slice(i, i + perRow);
      ensure(rowH);   // rij past niet meer op deze pagina → in haar geheel naar de volgende
      // Per rij centreren: een laatste rij met minder diagrammen (bv. 2+1 bij drie delen) staat
      // dan netjes in het midden i.p.v. links tegen de marge.
      const rowWidth = rowItems.length * imgW + (rowItems.length - 1) * gap;
      let x = MG + (CW - rowWidth) / 2;
      for (const it of rowItems) {
        if (it.q != null) {
          doc.setFont(undefined, 'bold'); doc.setFontSize(10); doc.setTextColor(107, 114, 128);
          doc.text(`${pSing(m)} ${it.q}`.toUpperCase(), x + imgW / 2, L.y, { align: 'center' });
        }
        drawPitchPdf(doc, m, it.ps, x, L.y + labelH, imgW, it.capId, it.q != null ? it.q : (m.quarters.length ? 1 : undefined));
        // Bank onder het veld: wie in de selectie zat maar dat deel niet op het veld kwam. Wie inviel
        // staat al bij de speler die hij verving (wisselicoon), dus die hoort hier niet meer bij.
        const bl = benchLines[items.indexOf(it)];
        if (bl) {
          doc.setFont(undefined, 'normal'); doc.setFontSize(benchSize); doc.setTextColor(107, 114, 128);
          const lines = doc.splitTextToSize(bl, imgW);
          lines.slice(0, 2).forEach((ln, li) => doc.text(ln, x + imgW / 2, L.y + labelH + imgH + benchSize + 3 + li * benchLineH, { align: 'center' }));
          doc.setTextColor(23, 23, 23);
        }
        x += imgW + gap;
      }
      L.y += rowH;
    }
    // Geen legende onder de diagrammen: oranje keeper, positienummer, ©, wisselpijltjes en de
    // kaartjes spreken voor zich (Tims beslissing) — dat scheelt ook een regel op de pagina.
    L.y += 4;
  }

  // ---- Tussenstand per periode ----
  if (m.quarters.length) {
    const goalIcons = await pdfEventIcons(m.events);
    const goalsPerRow = [];
    const rows = m.quarters.map(q => {
      const dur = q.endTime ? Math.round((q.endTime - q.startTime - (q.totalPaused || 0)) / 60000) : (m.quarterDuration || 0);
      const cum = scoreUpToQuarter(m, q.num);
      const cumText = isAway(m) ? `${cum.them} – ${cum.us}` : `${cum.us} – ${cum.them}`;
      const evts = m.events.filter(e => (e.type === 'goal_us' || e.type === 'goal_them' || e.type === 'own_goal' || (e.type.startsWith('penalty') && e.scored)) && e.quarterNum === q.num);
      goalsPerRow.push(evts);
      const gs = evts.map(e => `${e.gameTimeMs != null ? eventMinSummaryText(e, m) + ' ' : ''}${evtLabelPlain(e, m)}`).join('\n') || '–';
      return [`${pAbbr(m)}${q.num}`, cumText, `${dur} min`, gs];
    });
    tableBlock(`Tussenstand per ${pSingLow(m)}`, { head: [[pSing(m), 'Tussenstand', 'Duur', 'Doelpunten']], body: rows,
      styles: { fontSize: 10, cellPadding: 5, valign: 'top' }, headStyles: { fillColor: [245, 246, 245], textColor: [107, 114, 128], fontStyle: 'bold' },
      // Ruimte links in de doelpuntenkolom voor het icoon per regel.
      columnStyles: { 3: { cellPadding: { top: 5, right: 5, bottom: 5, left: 21 } } },
      didDrawCell: data => {
        if (data.section !== 'body' || data.column.index !== 3) return;
        const evts = goalsPerRow[data.row.index] || [];
        const lines = Array.isArray(data.cell.text) ? data.cell.text : [];
        if (!evts.length || !lines.length) return;
        const fs = (data.cell.styles && data.cell.styles.fontSize) || 10;
        const lineH = fs * 1.15, s = 9;
        // Een doelpunt met assist kan over twee regels wikkelen, dus het icoon van doelpunt i staat
        // niet zomaar op regel i: per doelpunt zelf uitrekenen hoeveel regels het inneemt, met
        // dezelfde breedte en lettergrootte als autoTable gebruikt. Klopt de som niet met het
        // werkelijke aantal regels, dan laten we de iconen liever weg dan ze verkeerd te zetten.
        data.doc.setFont(undefined, 'normal'); data.doc.setFontSize(fs);
        const avail = data.cell.width - 21 - 5;
        const spans = evts.map(e => data.doc.splitTextToSize(`${e.gameTimeMs != null ? eventMinSummaryText(e, m) + ' ' : ''}${evtLabelPlain(e, m)}`, avail).length);
        if (spans.reduce((a, b) => a + b, 0) !== lines.length) return;
        let line = 0;
        for (let i = 0; i < evts.length; i++) {
          const png = pdfEventIcon(goalIcons, evts[i]);
          if (png) {
            // Geen eigen alias: het icoon verschilt per gebeurtenis, en jsPDF leidt er zelf een af
            // uit de afbeelding, zodat hetzelfde icoon toch maar één keer in het bestand komt.
            try { data.doc.addImage(png, 'PNG', data.cell.x + 5, data.cell.y + 5 + line * lineH + (lineH - s) / 2, s, s, undefined, PDF_BEELD_COMPRESSIE); } catch (e) {}
          }
          line += spans[i];
        }
      } },
      24, `Tussenstand: ${homeName(m)} – ${awayName(m)}`);
  }

  // ---- Wedstrijdstatistieken ----
  // Expliciet "voor / tegen" i.p.v. "1 – 0": dat las als een tussenstand, en dan is de volgorde
  // bij een uitwedstrijd (waar de score omgewisseld staat) dubbelzinnig.
  const vt = (a, b) => `${stat(a)} voor / ${stat(b)} tegen`;
  const pdfStats = [
    [stat('corner_us') + stat('corner_them'), `Hoekschoppen: ${vt('corner_us', 'corner_them')}`],
    [stat('freekick_us') + stat('freekick_them'), `Vrije trappen: ${vt('freekick_us', 'freekick_them')}`],
    [stat('penalty_us') + stat('penalty_them'), `Penalty's: ${vt('penalty_us', 'penalty_them')}`],
    [stat('yellow_card') + stat('red_card'), `Geel: ${stat('yellow_card')} · Rood: ${stat('red_card')}`],
  ].filter(([n]) => n > 0);
  if (pdfStats.length) {
    heading('Wedstrijdstatistieken', 17);
    doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(23, 23, 23);
    doc.text(pdfStats.map(([, t]) => t).join('   ·   '), MG, L.y, { maxWidth: CW });
    L.y += 26;
  }

  // ---- Keeper(s) ----
  const keeperMs = keeperMinutes(m);
  if (keeperMs && Object.keys(keeperMs).length) {
    heading('Keeper(s)', 17);
    doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(23, 23, 23);
    const keeperText = Object.entries(keeperMs)
      .sort((a, b) => b[1] - a[1])
      .map(([pid, ms]) => `${pName(m, pid)}: ${Math.round(ms / 60000)} min`)
      .join('   ·   ');
    doc.text(keeperText, MG, L.y, { maxWidth: CW });
    L.y += 26;
  }

  // ---- Spelers ----
  const qCols = qData ? qData.qNums.map(qNum => `${pAbbr(m)}${qNum}`) : [];
  // De '#'-kolom valt weg als geen enkele speler een rugnummer heeft: rugnummers zijn optioneel
  // (zie teamUsesNumbers), en een kolom met louter lege cellen is enkel ruis.
  const anyNum = m.players.some(p => pNum(p));
  const numCol = anyNum ? ['#'] : [];
  const numCell = p => anyNum ? [pNum(p)] : [];
  const playerHead = [...numCol, 'Naam', 'Totaal', ...qCols, 'Goals', 'Assists', 'Geel', 'Rood'];
  const absentRowIdx = new Set();
  const playerRows = sortedByName(m.players).map((p, idx) => {
    if (p.absent) { absentRowIdx.add(idx); return [...numCell(p), p.name || '', 'Niet aanwezig', ...qCols.map(() => ''), '', '', '', '']; }
    const min = mins[p.id] ? playedMin(mins[p.id].ms) : 0;
    const g = m.events.filter(e => (e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored)) && e.playerId === p.id).length;
    const a = m.events.filter(e => e.type === 'goal_us' && e.assistId === p.id).length;
    const yc = m.events.filter(e => e.type === 'yellow_card' && e.playerId === p.id).length;
    const rc = m.events.filter(e => e.type === 'red_card' && e.playerId === p.id).length;
    const qVals = qData ? qData.qNums.map(qNum => { const ms = qData.result[p.id]?.[qNum] || 0; return ms > 0 ? playedMin(ms) + "'" : '—'; }) : [];
    return [...numCell(p), p.name || '', `${min}'`, ...qVals, g || '', a || '', yc || '', rc || ''];
  });
  // Iets minder celvulling zodat de 12 kolommen bij een grotere letter nog naast elkaar passen.
  // Deze tabel bevat de speelminuten per speler (en wie niet aanwezig was), dus ze volgt dezelfde
  // statsPublic-keuze als de sectie Speelminuten op het scherm — een kijker kan deze PDF downloaden.
  if (statSectionVisible('minutes')) tableBlock('Spelers', { head: [playerHead], body: playerRows,
    styles: { fontSize: 9.5, cellPadding: 4 }, headStyles: { fillColor: [245, 246, 245], textColor: [107, 114, 128], fontStyle: 'bold' },
    didParseCell: data => { if (data.section === 'body' && absentRowIdx.has(data.row.index)) data.cell.styles.textColor = [156, 163, 175]; } });

  // ---- Foto's ----
  const photos = [m.photo1, m.photo2].filter(Boolean);
  if (photos.length) {
    heading("Foto's");
    const gap = 12, imgW = photos.length > 1 ? (CW - gap) / 2 : Math.min(CW, 300), imgH = imgW * 0.66;
    ensure(imgH + 10);
    let x = MG;
    for (const src of photos) {
      const png = await rasterizeToPng(src, Math.round(imgW * 2), Math.round(imgH * 2));
      if (png) { try { doc.addImage(png, 'PNG', x, L.y, imgW, imgH, undefined, PDF_BEELD_COMPRESSIE); } catch (e) {} }
      x += imgW + gap;
    }
    L.y += imgH + 20;
  }

  // ---- Notities (enkel beheerder) ----
  if (canManage() && m.notes) {
    // Lettergrootte instellen vóór splitTextToSize, anders wordt er op de verkeerde maat gewikkeld.
    doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(23, 23, 23);
    const lines = doc.splitTextToSize(m.notes, CW);
    heading('Notities', Math.min(lines.length, 4) * 15);
    doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(23, 23, 23);
    for (const line of lines) { ensure(15); doc.text(line, MG, L.y); L.y += 15; }
    L.y += 10;
  }
  const notedPlayers = m.players.filter(p => p.note);
  if (canManage() && notedPlayers.length) {
    heading('Notities per speler', 15);
    doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(23, 23, 23);
    for (const p of notedPlayers) {
      const lines = doc.splitTextToSize(`${p.name}: ${p.note}`, CW);
      for (const line of lines) { ensure(15); doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.text(line, MG, L.y); L.y += 15; }
    }
    L.y += 10;
  }

  // ---- Volledige tijdlijn ----
  // Met dezelfde icoontjes als op het scherm: een lege smalle kolom houdt de plaats vrij, het icoon
  // zelf wordt in didDrawCell getekend (autoTable kan geen afbeelding in celtekst zetten).
  const evtIcons = await pdfEventIcons(m.events);
  const timelineGroups = eventsByQuarter(m);
  timelineGroups.forEach((g, gi) => {
    // Tussenstand in dezelfde volgorde als overal elders: bij een uitwedstrijd staat de eigen
    // ploeg tweede (thuisploeg – uitploeg), zoals de eindscore en de tabel hierboven.
    const cumText = !g.cum ? '' : (isAway(m) ? `${g.cum.them}–${g.cum.us}` : `${g.cum.us}–${g.cum.them}`);
    const head = g.qn == null ? 'Overig' : `${pSing(m)} ${g.qn}${cumText ? ` — tussenstand ${cumText}` : ''}`;
    const rows = g.list.length ? g.list.map(e => [eventMinLocal(e, m), '', evtLabelPlain(e, m)]) : [['', '', 'Geen events']];
    // Kopcel over alle kolommen: anders wordt de titel in de smalle minuut-kolom (60 pt)
    // gewikkeld en komt de tussenstand ónder het kwart te staan i.p.v. ernaast.
    tableBlock(gi === 0 ? `Volledige tijdlijn (${m.events.length} events)` : null,
      { head: [[{ content: head, colSpan: 3 }]], body: rows, showHead: 'firstPage',
        styles: { fontSize: 10, cellPadding: 4.5 }, headStyles: { fillColor: [241, 243, 245], textColor: [23, 23, 23], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 18 } },
        didDrawCell: data => {
          if (data.section !== 'body' || data.column.index !== 1) return;
          const png = pdfEventIcon(evtIcons, g.list[data.row.index]);
          if (!png) return;
          const s = 11;
          try { data.doc.addImage(png, 'PNG', data.cell.x + 3, data.cell.y + (data.cell.height - s) / 2, s, s, undefined, PDF_BEELD_COMPRESSIE); } catch (e) {}
        } }, 10,
      gi === 0 ? `Minuut binnen het ${pSingLow(m)} · tussenstand: ${homeName(m)} – ${awayName(m)}` : '');
  });

}

// Wedstrijd-PDF: écht, doorzoekbaar PDF via jsPDF (geen screenshot/rasterbeeld van de pagina).
// Enkel het veld-opstellingsdiagram wordt als afbeelding ingevoegd (het is een tekening,
// geen tekst) — alle tabellen en tekst hieronder zijn selecteerbare/doorzoekbare PDF-tekst.
async function exportPDF() {
  const m = match; if (!m) return;
  showToast('PDF wordt gemaakt...', 'ok');
  try { await loadJsPDF(); } catch (e) { showToast('PDF-bibliotheek laden mislukt. Controleer je verbinding.', 'err'); return; }

  // `venue` alleen erbij als het iets toevoegt: bij een tornooiwedstrijd is de locatie gelijk aan
  // m.location, dat al in de metaregel hierboven staat — dan stond ze er twee keer.
  const sameVenue = (m.venue || '').trim().toLowerCase() === (m.location || '').trim().toLowerCase();
  const infoBits = [m.subteam && ('Ploeg: ' + m.subteam), m.formation && ('Opstelling: ' + m.formation), m.competition, m.matchday && ('Speeldag ' + m.matchday), matchTrainer(m) && (trainerLabel(matchTrainer(m)) + ': ' + matchTrainer(m)), matchResponsible(m) && ('Afgevaardigde: ' + matchResponsible(m)), m.referee && ('Scheidsrechter: ' + m.referee), m.jersey && ('Truikleur: ' + m.jersey), (m.venue && !sameVenue) && ('Locatie: ' + m.venue), allCaptains(m).length && ('Kapitein(s): ' + allCaptains(m).map(id => pName(m, id)).join(' | '))].filter(Boolean);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  // Alle PDF-tekst automatisch WinAnsi-veilig maken (zie pdfSafe). Dekt ook autoTable, dat de
  // celtekst intern via doc.text tekent.
  const _docText = doc.text.bind(doc);
  doc.text = (text, ...rest) => _docText(Array.isArray(text) ? text.map(t => typeof t === 'string' ? pdfSafe(t) : t) : (typeof text === 'string' ? pdfSafe(text) : text), ...rest);
  const L = createPdfLayout(doc);
  const { PW, PH, MG, CW } = L;
  const ensure = L.ensure, heading = L.heading, tableBlock = L.tableBlock;

  // ---- Header ----
  // Het CLUBlogo staat linksboven: dit is een document van de club. Het app-logo is naar de
  // voettekst verhuisd (zie L.footer). Heeft de club geen logo, dan begint de titel gewoon op de
  // marge — er komt geen vervangend logo in de plaats.
  const clubLogo = await rasterizeToPngFit(getActiveClubLogo(), 40, 40, PDF_LOGO_DICHTHEID);
  if (clubLogo) { try { doc.addImage(clubLogo.uri, 'PNG', MG, L.y, clubLogo.w, clubLogo.h, 'clublogo', PDF_BEELD_COMPRESSIE); } catch (e) {} }
  const kopInspring = clubLogo ? clubLogo.w + 10 : 0;
  const tx = MG + kopInspring, tw = CW - kopInspring;
  // Enkel het pictogram voor de voettekst; de naam komt daar als tekst naast (zie L.footer).
  const voetLogo = await rasterizeToPngFit(APP_LOGO_TRANSPARANT, 13, 13, PDF_LOGO_DICHTHEID);
  doc.setFont(undefined, 'bold'); doc.setFontSize(15); doc.setTextColor(23, 23, 23);
  const title = isAway(m) ? `${m.opponent} vs ${tName(m)}` : `${tName(m)} vs ${m.opponent}`;
  const titleLines = doc.splitTextToSize(title, tw);
  doc.text(titleLines, tx, L.y + 13);
  doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(107, 114, 128);
  // Metaregels net onder de (mogelijk meerregelige) titel plaatsen i.p.v. op vaste offsets,
  // zodat een lange titel de datum-/inforegel niet overlapt en de header-hoogte meegroeit.
  // Ook deze regels kunnen door maxWidth over meerdere regels wikkelen — my moet dan met
  // het werkelijke aantal regels opschuiven, anders komt de oranje lijn door de tekst.
  let my = L.y + 13 + (titleLines.length - 1) * 16 + 14;
  const metaLines = doc.splitTextToSize(`${matchWhen(m)} · ${m.location} · ${m.matchType} · ${pCount(m)} × ${m.quarterDuration} min`, tw);
  doc.text(metaLines, tx, my);
  my += metaLines.length * 13;
  if (infoBits.length) {
    const infoLines = doc.splitTextToSize(infoBits.join(' · '), tw);
    doc.text(infoLines, tx, my);
    my += infoLines.length * 13;
  }
  L.y = Math.max(L.y + 56, my + 4);
  doc.setDrawColor(245, 130, 31); doc.setLineWidth(2); doc.line(MG, L.y, MG + CW, L.y);
  L.y += 26;

  // ---- Score ----
  doc.setFont(undefined, 'bold'); doc.setFontSize(30); doc.setTextColor(23, 23, 23);
  doc.text(isAway(m) ? `${m.scoreThem} – ${m.scoreUs}` : `${m.scoreUs} – ${m.scoreThem}`, PW / 2, L.y + 24, { align: 'center' });
  L.y += 46;
  if (m.motmId) {
    doc.setFont(undefined, 'bold'); doc.setFontSize(12);
    doc.text(`Man van de match: ${pName(m, m.motmId)}`, PW / 2, L.y, { align: 'center' });
    L.y += 20;
  }

  // ---- Tornooi (enkel bij een tornooiwedstrijd) ----
  // Een PDF wordt los doorgestuurd, dus hier hoort wél de tornooi-informatie en de dagselectie in:
  // die staan sinds v0.7.5/v0.8.3 bewust op tornooiniveau en dus niet meer in de wedstrijd zelf.
  const pdfTrn = m.tournamentId ? tournamentById(m.tournamentId) : null;
  if (pdfTrn) {
    const pos = await tournamentMatchPosition(pdfTrn.id, m.id);
    const tg = tournamentSelectionGroups(pdfTrn);
    // Enkel wat de inforegels bovenaan nog niet zeggen: datum, locatie, format, trainer en
    // ploegverantwoordelijke van het tornooi staan daar al (ze zijn gelijk aan die van de wedstrijd).
    // Wijkt de datum of locatie van het tornooi toch af — bv. een wedstrijd die verplaatst werd —
    // dan komt ze er wel bij staan.
    const eq = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
    const trnBits = [
      pos.total ? `Wedstrijd ${pos.index} van ${pos.total}` : '',
      (pdfTrn.date && !eq(pdfTrn.date, m.date)) ? fmtDate(new Date(pdfTrn.date + 'T00:00:00').getTime()) : '',
      (pdfTrn.location && !eq(pdfTrn.location, m.location)) ? pdfTrn.location : '',
      pdfTrn.standing && ('Eindstand: ' + pdfTrn.standing),
      tournamentUsesPoints(pdfTrn) ? `Punten: ${tournamentPointsLabel(pdfTrn)} (${tournamentPointsLegend(pdfTrn)})` : '',
    ].filter(Boolean);
    const trnGroups = [['Geselecteerd:', tg.mee, true], ['Niet geselecteerd:', tg.notSelected, false], ['Niet beschikbaar:', tg.absent, false]]
      .filter(g => g[1].length);
    doc.setFont(undefined, 'normal'); doc.setFontSize(11);
    const bitLines = trnBits.length ? doc.splitTextToSize(trnBits.join(' · '), CW) : [];
    const grpLines = trnGroups.map(([lbl, list]) => doc.splitTextToSize(lbl + ' ' + list.map(nameWithNum).join(', '), CW));
    heading(`Tornooi · ${pdfTrn.name || ''}`, bitLines.length * 13 + 6 + grpLines.reduce((n, w) => n + w.length * 15 + 4, 0));
    doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(107, 114, 128);
    for (const ln of bitLines) { ensure(13); doc.text(ln, MG, L.y); L.y += 13; }
    if (bitLines.length && grpLines.length) L.y += 6;
    for (let i = 0; i < grpLines.length; i++) {
      doc.setFont(undefined, 'normal'); doc.setFontSize(11);
      doc.setTextColor(...(trnGroups[i][2] ? [23, 23, 23] : [107, 114, 128]));
      for (const ln of grpLines[i]) { ensure(15); doc.text(ln, MG, L.y); L.y += 15; }
      L.y += 4;
    }
    doc.setTextColor(23, 23, 23);
    L.y += 12;
  }

  await pdfMatchBody(doc, L, m);

  L.footer(voetLogo);

  // Eigen (niet-HTML-ge-esc'te) bestandsnaam i.p.v. matchTitle() — die is voor de HTML-<title>
  // en zou HTML-entities (&amp; e.d.) letterlijk in de bestandsnaam laten verschijnen.
  // Formaat: datum_thuisploeg_vs_uitploeg, zodat een map met PDF's chronologisch sorteert.
  const teamsPart = isAway(m) ? `${m.opponent}_vs_${tName(m)}` : `${tName(m)}_vs_${m.opponent}`;
  const fileTitle = `${m.date ? m.date + '_' : ''}${teamsPart}`.replace(/[\\/:*?"<>|]/g, '-');
  doc.save(`${fileTitle}.pdf`);
  // Eigen bevestiging i.p.v. te vertrouwen op de (soms afwezige) native downloadmelding van
  // de browser: door de await's hierboven is het korte "rechtstreeks door een tik"-venster
  // van de browser vaak al verstreken tegen dat doc.save() draait, waardoor sommige mobiele
  // browsers (vooral Android Chrome) de download stil uitvoeren zonder eigen meldingsbalk.
  showToast(`PDF gedownload: ${fileTitle}.pdf`, 'ok');
}

// ===================== HELPERS =====================
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
// Escaped voor gebruik binnen een enkel-gequote JS-stringliteral in een inline onclick-attribuut.
function jsq(s) { return esc(String(s == null ? '' : s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")); }
// jsPDF's standaardfonts ondersteunen enkel WinAnsi (CP1252). Tekens daarbuiten (Turks ş/ğ, Pools
// ł/ć, Tsjechisch č/ř, ...) zouden als verkeerde glyphs renderen. We laten alles wat CP1252 wél
// kan (é, ü, ç, ñ, š, ž, œ, ...) ongemoeid en translitereren enkel de rest naar een leesbare
// ASCII-benadering (ş→s, ł→l, ğ→g), i.p.v. een volledig Unicode-font in te bedden (fors qua omvang).
const _CP1252_EXTRA = new Set([...'‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ€']);
const _PDF_TRANSLIT = { 'ł':'l','Ł':'L','đ':'d','Đ':'D','ı':'i','İ':'I','ħ':'h','Ħ':'H','ŧ':'t','Ŧ':'T','ĸ':'k','ŉ':'n','ə':'e' };
function pdfSafe(s) {
  if (s == null) return '';
  return [...String(s)].map(ch => {
    if (ch.codePointAt(0) <= 0xFF || _CP1252_EXTRA.has(ch)) return ch;  // in CP1252 → ongemoeid
    const norm = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');   // accent strippen (ş→s, č→c, ğ→g)
    if (norm && norm.charCodeAt(0) <= 0x7F) return norm;
    return _PDF_TRANSLIT[ch] || '?';
  }).join('');
}

// ===================== INIT =====================
async function init() {
  db = await openDB();
  applyStoredTheme(); applyDark();
  // ?join=TOKEN uit URL opvangen (QR-code flow)
  const joinParam = new URLSearchParams(window.location.search).get('join');
  if (joinParam) {
    localStorage.setItem('voetbal_pending_join', joinParam.trim().toUpperCase());
    window.history.replaceState({}, '', window.location.pathname);
  }
  view = 'home';
  // Splash blijft zichtbaar tot auth klaar is; toon spinner na 2 sec als Firebase traag is
  let _splashGone = false, _authReady = false, _minTimeDone = false;
  const _doHideSplash = () => {
    if (_splashGone || !_authReady || !_minTimeDone) return;
    _splashGone = true;
    const s = document.getElementById('splash');
    if (s) { s.style.transition = 'opacity .4s ease'; s.style.opacity = '0'; setTimeout(() => s && s.remove(), 420); }
  };
  window._hideSplash = function() { _authReady = true; _doHideSplash(); };
  setTimeout(() => {
    _minTimeDone = true; _doHideSplash();
    if (!_splashGone) { const sp = document.getElementById('splash-spinner'); if (sp) sp.style.display = 'block'; }
  }, 2000);
  cloudInit();
  // ?v=APP_VERSION zorgt dat de SW-cache automatisch meeloopt met de app-versie (B16):
  // een gewijzigde registratie-URL laat de browser het script als "nieuw" behandelen,
  // zonder dat CACHE in sw.js nog apart handmatig bijgehouden moet worden.
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=' + APP_VERSION).catch(() => {});
  // Offline fallback: als Firebase niet klaar is, splash na 3 sec verbergen
  if (!cloudReady) setTimeout(() => { if (window._hideSplash) window._hideSplash(); }, 3000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && view === 'live' && match) {
      const q = match.quarters[match.quarters.length - 1];
      if (q && q.startTime && !q.pausedAt && !q.endTime) requestWake();
    }
  });
  // Als Firebase niet beschikbaar is (offline), val terug op lokale modus
  if (!cloudReady) {
    if (!setupDone()) { await go('setup', undefined, true); return; }
    const all = await dbAll();
    const live = all.find(m => m.status === 'live');
    if (live) { match = live; view = 'live'; startTimer(); }
    render();
  }
  // Met cloud: onAuthChanged() neemt de flow over zodra Firebase reageert
}
views.beheer = renderBeheer;
views.clubbeheer = renderClubBeheer;
views.clubsadmin = renderClubsAdmin;
views.allusers = renderAllUsers;
views.teams = renderTeamsList;
views.teamEdit = renderTeamEdit;
views.tournaments = renderTournamentList;
views.tournament = renderTournament;
views.tournamentReport = renderTournamentReport;
views.tournamentNew = renderTournamentNew;
views.prep = renderPrep;
views.new = renderNew;
function newMatch() { if (!canManage()) return; startWizard(); go('new'); }
init();
