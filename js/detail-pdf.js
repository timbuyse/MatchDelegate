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
      ${[['Ploeg-label',match.subteam],['Formatie',match.formation],['Trainer',match.trainer],['Ploegverantw.',match.responsible],['Soort',match.competition],['Speeldag',match.matchday],['Scheidsrechter',match.referee],['Truikleur',match.jersey],['Locatie',match.venue],['Kapitein(s)',allCaptains(match).map(id=>pName(match,id)).join(' | ')]].filter(([k,v])=>v).map(([k,v])=>`<div class="stat-row"><span style="color:var(--txt2);min-width:120px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('') || '<p style="color:var(--txt2);font-size:14px">Geen extra info ingevuld.</p>'}
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
    <div class="sec">${match.quarters.length > 1 ? `Startopstelling per ${pSingLow(match)}` : 'Startopstelling'}</div>
    <div class="card">${renderLineupCarousel(match)}</div>
    ${lineupTableHtml(match)}
    ${match.quarters.length ? `<div class="sec">Per ${pSingLow(match)}</div><div class="card">${qSummary}</div>` : ''}
    <div class="sec">Speelminuten <span style="font-weight:400;text-transform:none;color:var(--txt2)">(balk = % van de speeltijd · groen ≥75% · oranje ≥50% · rood &lt;50%)</span></div>
    <div class="card">
      <div class="prow" style="opacity:.5;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding-bottom:4px">
        <div class="pnum"></div>
        <div style="flex:1">Speler</div>
        <div class="pmins" style="font-size:11px">Min · %</div>
      </div>
      ${(() => {
        const qData = calcMinutesPerQuarter(match);
        const abbr = pAbbr(match);
        return match.players.map(p => {
          const row = playerRowHtml(p, mins[p.id], !p.onField, getGameTimeMs(match));
          if (p.absent) return row;
          if (!qData) return row;
          const parts = qData.qNums.map(qNum => {
            const ms = qData.result[p.id]?.[qNum] || 0;
            return `${abbr}${qNum}: ${ms > 0 ? Math.round(ms/60000)+"'" : '—'}`;
          });
          return row + `<div style="font-size:11px;color:var(--txt2);padding:0 0 8px 42px">${parts.join(' · ')}</div>`;
        }).join('');
      })()}
    </div>
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
      ${(FORMATIONS[match.matchType]||[]).length ? `<button class="btn btn-pale" style="margin-bottom:8px;width:100%" onclick="modalEditPositions()">${icI(IC.shirt)} Posities herplaatsen</button>` : ''}
      <button class="btn btn-pale" style="margin-bottom:8px;width:100%" onclick="cloneMatch()">${icI(IC.copy)} Gebruik als template</button>
      <button class="btn btn-orgpale" style="margin-bottom:8px;width:100%" onclick="confirmReopenMatch()">${icI(IC.live)} Wedstrijd heropenen</button>
      <div class="danger"><button class="btn btn-red" onclick="confirmDelete()">${icI(IC.trash)} Wedstrijd verwijderen</button></div>
    </div>`}
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
function cloneMatch() {
  if (!canManage() || !match) return;
  const src = match;
  const team = teamById(src.teamId);
  const pool = (src.players || []).map(p => ({
    pid: uid(), srcId: p.rosterId || p.id,
    name: p.name, number: p.number,
    pos: p.pos || p.line || '',
    sel: p.starting ? 'basis' : 'bank',
    slot: null, x: p.x, y: p.y, line: p.line, posNum: p.posNum,
  }));
  wiz = {
    step: 1,
    teamId: src.teamId || (team ? team.id : ''),
    opponent: '', subteam: src.subteam || '',
    date: new Date().toISOString().split('T')[0],
    time: src.time || '10:00',
    location: src.location || 'Thuis',
    matchType: src.matchType || '11v11',
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
    trainerIsOther: false,
    pool, poolTeamId: src.teamId || '',
    formationIndex: src.formationIndex || 0,
    selPlace: null,
  };
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
function rasterizeToPng(src, w, h) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
// Als rasterizeToPng, maar behoudt de beeldverhouding binnen een max-vak. Geeft
// { uri, w, h } terug (of null) zodat jsPDF de afbeelding onvervormd kan plaatsen.
function rasterizeToPngFit(src, maxW, maxH) {
  return new Promise(resolve => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(maxW / img.width, maxH / img.height, 1) || 1;
        const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ uri: canvas.toDataURL('image/png'), w, h });
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
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
  const dns = fieldDisplayNames(pts.map(({ p }) => p));
  const subs = subsDuringPeriod(m, qNum);
  const numSize = Math.max(4.5, L(13)), nameSize = Math.max(3.8, L(10));
  // Naamplaatje (en eventueel het wisselplaatje eronder) tekenen, horizontaal binnen het veld
  // geklemd: bij een speler op de flank zou een lange naam anders buiten het diagram uitsteken en
  // (in de 2x2-weergave) over het veld ernaast lopen. Op het scherm valt dat weg door de overflow
  // van .pitch, in de PDF clipt niets.
  const chip = (txt, cx, top, size, color) => {
    doc.setFontSize(size);
    const tw = doc.getTextWidth(txt), pad = size * 0.3, half = tw / 2 + pad;
    const lx = Math.min(Math.max(cx, ux(0) + half), ux(W) - half);
    doc.setFillColor(12, 14, 12);
    let gs = null;
    try { gs = new doc.GState({ opacity: 0.5 }); doc.setGState(gs); } catch (e) { gs = null; }
    doc.roundedRect(lx - half, top, tw + pad * 2, size * 1.35, size * 0.25, size * 0.25, 'F');
    if (gs) { try { doc.setGState(new doc.GState({ opacity: 1 })); } catch (e) {} }
    doc.setTextColor(...color);
    doc.text(txt, lx, top + size, { align: 'center' });
    return top + size * 1.35;
  };
  for (const { p, x, y } of pts) {
    const cx = ux(x / 100 * W), cy = uy(y / 100 * H);
    doc.setFillColor(...(p.line === 'Doel' ? [245, 130, 31] : [16, 16, 16]));
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(L(2));
    doc.circle(cx, cy, L(R), 'FD');
    doc.setTextColor(255, 255, 255); doc.setFont(undefined, 'bold');
    doc.setFontSize(numSize);
    doc.text(String(p.posNum || p.number || '?'), cx, cy + numSize * 0.35, { align: 'center' });
    // Naam op een donker plaatje: wit-op-gras liep in elkaar over waar twee bollen dicht bij
    // elkaar staan (zelfde reden als de .pdot-lbl-achtergrond op het scherm).
    const label = (dns.get(p.id) || _lastName(p.name || '')) + (capId === p.id ? ' ©' : '');
    const after = chip(label, cx, cy + L(R) + nameSize * 0.25, nameSize, [255, 255, 255]);
    // Tijdens dit deel gewisseld: wie er in zijn plaats kwam, eronder in een lichter accent.
    // '»' i.p.v. een pijl: pijltekens vallen buiten WinAnsi en zouden als '?' renderen (zie pdfSafe).
    const sl = subs.get(p.id);
    if (sl) chip('» ' + sl, cx, after + nameSize * 0.15, nameSize * 0.92, [253, 214, 160]);
  }
  doc.setTextColor(23, 23, 23); doc.setFont(undefined, 'normal'); doc.setLineWidth(0.75);
}

// Selectie van een wedstrijd in vier groepen, gesorteerd op familienaam. Gedeeld door de PDF en
// het verslag op het scherm, zodat beide altijd hetzelfde tonen.
//  - selected       : kern + wissels (met rugnummer)
//  - notAvailable   : NB in de selectie (m.absentPlayers), eventueel met reden
//  - notPresent     : wél geselecteerd, maar tijdens de wedstrijd als niet aanwezig gemarkeerd
//  - notSelected    : NG — rosterspelers die niet in de wedstrijd zaten (leeg als de ploeg weg is)
function matchSelectionGroups(m) {
  const byLast = (a, b) => _lastName(a.name || '').localeCompare(_lastName(b.name || ''), 'nl');
  const pick = p => ({ name: p.name || '', number: p.number || '', rosterId: p.rosterId || null });
  const selected = m.players.filter(p => !p.absent).map(pick).sort(byLast);
  const notPresent = m.players.filter(p => p.absent).map(pick).sort(byLast);
  const team = typeof teamById === 'function' ? teamById(m.teamId) : null;
  const notAvailable = [];
  for (const a of (m.absentPlayers || [])) {
    const rec = typeof a === 'string' ? { name: a, rosterId: null, reason: '' } : { name: a.name || '', rosterId: a.rosterId || null, reason: a.reason || '' };
    if (!rec.name) continue;
    const dup = [...notPresent, ...notAvailable].some(x => (rec.rosterId && x.rosterId === rec.rosterId) || x.name === rec.name);
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
    .map(p => ({ name: p.name || '', number: p.number || '', rosterId: p.id })).sort(byLast);
  return { selected, notAvailable, notPresent, notSelected };
}
// Uitleg bij de positielabels van de opstellingstabel (KP/VCL/ML/SC...): die afkortingen worden
// afgeleid uit lijn + plaats op de breedte en zijn zonder legende niet te raden.
const POS_LABEL_LEGEND = 'KP = keeper · V/M/S = verdediging/middenveld/spits · L/C/R = links/centraal/rechts (CL/CR = centraal links/rechts)';
// Naam met rugnummer ervoor, voor de selectielijsten ("7 Wout Coppens"); bij een NB'er komt de
// eventuele reden erachter tussen haakjes ("13 Lars Marysse (speelt elders)").
function nameWithNum(p) {
  const r = p.reason ? absentReasonLabel(p.reason) : '';
  return (p.number ? p.number + ' ' : '') + p.name + (r ? ` (${r.toLowerCase()})` : '');
}
// De vier selectiegroepen als [label, namen]-blokken, in vaste volgorde. Eén bron voor het
// verslag op het scherm en de PDF-sectie.
function selectionBlocks(m) {
  const g = matchSelectionGroups(m);
  const blocks = [];
  if (g.selected.length) blocks.push(['', g.selected]);
  if (g.notAvailable.length) blocks.push(['Niet beschikbaar:', g.notAvailable]);
  if (g.notPresent.length) blocks.push(['Geselecteerd maar niet aanwezig:', g.notPresent]);
  if (g.notSelected.length) blocks.push(['Niet geselecteerd:', g.notSelected]);
  return { groups: g, blocks };
}
// Selectiekaart voor het verslag op het scherm — zelfde inhoud als de PDF-sectie 'Selectie'.
function selectionCardHtml(m) {
  const { groups, blocks } = selectionBlocks(m);
  if (!blocks.length) return '';
  return `<div class="sec">Selectie (${groups.selected.length})</div>
    <div class="card">
      ${blocks.map(([lbl, list]) => `<p style="font-size:14px;line-height:1.6;margin-bottom:6px">${lbl ? `<span style="color:var(--txt2)">${esc(lbl)}</span> ` : ''}${esc(list.map(nameWithNum).join(', '))}</p>`).join('')}
    </div>`;
}
// Tabel "Opstelling per periode" op het scherm, uit dezelfde bron als de PDF
// (lineupPerQuarterRows) zodat scherm en PDF niet uit elkaar kunnen lopen. Horizontaal
// scrollbaar met een vastgezette positiekolom — op een telefoon passen 1 + 4 kolommen
// met volledige namen niet naast elkaar.
function lineupTableHtml(m) {
  const t = lineupPerQuarterRows(m);
  if (!t) return '';
  const th = t.head.map((h, i) => `<th${i === 0 ? ' class="lut-fix"' : ''}>${esc(h)}</th>`).join('');
  const rows = t.body.map(r => `<tr>${r.map((c, i) => i === 0
    ? `<th class="lut-fix">${esc(c)}</th>`
    : `<td>${esc(c).replace(/\n/g, '<br>')}</td>`).join('')}</tr>`).join('');
  return `<div class="sec">Opstelling per ${pSingLow(m)}</div>
    <div class="card" style="padding:0">
      <div class="lut-wrap"><table class="lut"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>
      <div class="lut-legend">${POS_LABEL_LEGEND}</div>
    </div>`;
}
// Thuis- en uitploeg bij naam: elke tussenstand wordt als "thuis – uit" weergegeven, dus bij een
// uitwedstrijd staat de eigen ploeg tweede. Zonder deze namen erbij is dat niet af te leiden.
function homeName(m) { return isAway(m) ? m.opponent : tName(m); }
function awayName(m) { return isAway(m) ? tName(m) : m.opponent; }
// Bouwt de "Opstelling per periode"-tabel voor de PDF: één rij per veldpositie (gelabeld
// KP / VL / MC / SC ... — afgeleid uit lijn + x-volgorde op het veld), daarna één rij per
// bankplaats. Elke kolom toont wie daar bij de START van de periode stond; wie tijdens de
// periode betrokken raakt bij een wissel (of rood/blessure-uit) krijgt dat als markering
// in de cel. Gebruikt dezelfde reconstructie als de velddiagrammen (playersAtPeriodStart),
// zodat tabel en diagram nooit tegenspreken.
function lineupPerQuarterRows(m) {
  const numQ = m.quarters.length;
  if (!numQ) return null;
  const LINE_ORDER = { 'Doel': 0, 'Verdediging': 1, 'Middenveld': 2, 'Aanval': 3 };
  const qStarts = Array.from({ length: numQ }, (_, i) => playersAtPeriodStart(m, i + 1));
  // Alle gebruikte veldposities (x|y) over alle periodes verzamelen — zo blijft de tabel ook
  // kloppen als de opstelling/posities tussendoor herplaatst werden (er komt dan een rij bij).
  const posKeys = new Map();
  qStarts.forEach(ps => ps.forEach(p => {
    if (typeof p.x === 'number' && typeof p.y === 'number') {
      const k = p.x + '|' + p.y;
      if (!posKeys.has(k)) posKeys.set(k, { key: k, line: p.line, x: p.x, y: p.y });
    }
  }));
  const fieldRows = [...posKeys.values()].sort((a, b) =>
    (LINE_ORDER[a.line] ?? 9) - (LINE_ORDER[b.line] ?? 9) || a.x - b.x || a.y - b.y);
  const PREFIX = { 'Verdediging': 'V', 'Middenveld': 'M', 'Aanval': 'S' };
  const SIDES = { 1: ['C'], 2: ['L', 'R'], 3: ['L', 'C', 'R'], 4: ['L', 'CL', 'CR', 'R'], 5: ['L', 'CL', 'C', 'CR', 'R'] };
  const byLine = {};
  fieldRows.forEach(r => { (byLine[r.line] = byLine[r.line] || []).push(r); });
  Object.entries(byLine).forEach(([line, list]) => {
    if (line === 'Doel') { list.forEach((r, i) => r.label = list.length > 1 ? 'KP' + (i + 1) : 'KP'); return; }
    const pre = PREFIX[line] || LINE_SHORT[line] || '?';
    const sides = SIDES[list.length];
    list.forEach((r, i) => r.label = pre + (sides ? sides[i] : (i + 1)));
  });
  // Markeringen voor gebeurtenissen TIJDENS de periode. atBreak-events horen bij de start
  // van de periode (zitten al in playersAtPeriodStart) en worden dus niet als markering getoond.
  const outMark = {}, inMark = {};
  for (const e of m.events) {
    if (e.quarterNum == null || e.atBreak) continue;
    if (e.type === 'substitution') {
      if (e.playerOutId) (outMark[e.quarterNum] = outMark[e.quarterNum] || {})[e.playerOutId] = 'wissel uit';
      if (e.playerInId) (inMark[e.quarterNum] = inMark[e.quarterNum] || {})[e.playerInId] = 'wissel in';
    } else if (e.type === 'red_card' && e.playerId) {
      (outMark[e.quarterNum] = outMark[e.quarterNum] || {})[e.playerId] = 'rood';
    } else if (e.type === 'injury' && e.leavesField && e.playerId) {
      (outMark[e.quarterNum] = outMark[e.quarterNum] || {})[e.playerId] = 'blessure uit';
    }
  }
  // Volledige naam (Tims expliciete wens) — de markering op een eigen regel, zodat een cel
  // voorspelbaar afbreekt tussen naam en markering i.p.v. midden in een lange naam.
  const cellTxt = (p, q, marks) => {
    const mark = marks[q] && marks[q][p.id];
    return (p.name || '') + (mark ? `\n(${mark})` : '');
  };
  const body = fieldRows.map(r => [r.label]);
  const extrasPerQ = [], benchPerQ = [];
  for (let q = 1; q <= numQ; q++) {
    const ps = qStarts[q - 1];
    const used = new Set();
    fieldRows.forEach((r, ri) => {
      const p = ps.find(pl => !used.has(pl.id) && pl.x + '|' + pl.y === r.key);
      if (p) used.add(p.id);
      body[ri].push(p ? cellTxt(p, q, outMark) : '');
    });
    // Veldspelers zonder (herkenbare) positie krijgen een generieke 'Veld'-rij i.p.v. te verdwijnen.
    extrasPerQ.push(ps.filter(p => !used.has(p.id)).map(p => cellTxt(p, q, outMark)));
    const onIds = new Set(ps.map(p => p.id));
    benchPerQ.push(m.players.filter(p => !p.absent && !onIds.has(p.id))
      .sort((a, b) => _lastName(a.name || '').localeCompare(_lastName(b.name || ''), 'nl'))
      .map(p => cellTxt(p, q, inMark)));
  }
  // Eén 'Veld'- en één 'Bank'-rij met de namen onder elkaar in dezelfde cel: genummerde rijen
  // (Bank 1/2/3) suggereerden een vaste plaats, terwijl de lijst per periode alfabetisch
  // opnieuw gevuld wordt — dezelfde rij sprong dan van speler naar speler.
  if (extrasPerQ.some(l => l.length)) body.push(['Veld', ...extrasPerQ.map(l => l.join('\n'))]);
  if (benchPerQ.some(l => l.length)) body.push(['Bank', ...benchPerQ.map(l => l.join('\n'))]);
  if (!body.length) return null;
  return { head: ['Positie', ...Array.from({ length: numQ }, (_, i) => pAbbr(m) + (i + 1))], body };
}

// Wedstrijd-PDF: écht, doorzoekbaar PDF via jsPDF (geen screenshot/rasterbeeld van de pagina).
// Enkel het veld-opstellingsdiagram wordt als afbeelding ingevoegd (het is een tekening,
// geen tekst) — alle tabellen en tekst hieronder zijn selecteerbare/doorzoekbare PDF-tekst.
async function exportPDF() {
  const m = match; if (!m) return;
  showToast('PDF wordt gemaakt...', 'ok');
  try { await loadJsPDF(); } catch (e) { showToast('PDF-bibliotheek laden mislukt. Controleer je verbinding.', 'err'); return; }

  const mins = calcMinutes(m);
  const qData = calcMinutesPerQuarter(m);
  const stat = (type) => m.events.filter(e => e.type === type).length;
  const infoBits = [m.subteam && ('Ploeg: ' + m.subteam), m.formation && ('Opstelling: ' + m.formation), m.competition, m.matchday && ('Speeldag ' + m.matchday), m.trainer && ('Trainer: ' + m.trainer), m.responsible && ('Afgevaardigde: ' + m.responsible), m.referee && ('Scheidsrechter: ' + m.referee), m.jersey && ('Truikleur: ' + m.jersey), m.venue && ('Locatie: ' + m.venue), allCaptains(m).length && ('Kapitein(s): ' + allCaptains(m).map(id => pName(m, id)).join(' | '))].filter(Boolean);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  // Alle PDF-tekst automatisch WinAnsi-veilig maken (zie pdfSafe). Dekt ook autoTable, dat de
  // celtekst intern via doc.text tekent.
  const _docText = doc.text.bind(doc);
  doc.text = (text, ...rest) => _docText(Array.isArray(text) ? text.map(t => typeof t === 'string' ? pdfSafe(t) : t) : (typeof text === 'string' ? pdfSafe(text) : text), ...rest);
  const PW = 595.28, PH = 841.89, MG = 40, CW = PW - MG * 2;
  let y = MG;
  const ensure = need => { if (y + need > PH - MG) { doc.addPage(); y = MG; } };
  // `need` = hoogte van wat direct ná de kop komt: zo blijft een sectiekop nooit alleen
  // onderaan een pagina staan met zijn inhoud op de volgende.
  const heading = (text, need = 0) => {
    ensure(30 + need);
    doc.setFont(undefined, 'bold'); doc.setFontSize(11); doc.setTextColor(107, 114, 128);
    doc.text(text.toUpperCase(), MG, y);
    y += 5; doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.75); doc.line(MG, y, MG + CW, y);
    y += 16; doc.setTextColor(23, 23, 23);
  };
  // Meet de hoogte van een autoTable door hem in een wegwerp-document te tekenen (autoTable
  // heeft geen "meet-alleen"-modus). Geeft null als de tabel niet op één pagina past — dan is
  // samenhouden onmogelijk en mag hij gewoon splitsen.
  const measureTable = opts => {
    try {
      const tmp = new jsPDF({ unit: 'pt', format: 'a4' });
      tmp.autoTable({ ...opts, startY: MG });
      const pages = tmp.getNumberOfPages ? tmp.getNumberOfPages() : tmp.internal.getNumberOfPages();
      if (pages > 1) return null;
      return tmp.lastAutoTable.finalY - MG;
    } catch (e) { return null; }
  };
  // Tekent een tabel (met optionele sectiekop) als één samenhangend blok: past kop + tabel niet
  // meer op deze pagina, dan schuift het geheel naar een nieuwe pagina i.p.v. afgekapt te worden.
  // rowPageBreak:'avoid' voorkomt bovendien dat een meerregelige rij middendoor geknipt wordt.
  // `note` = grijze toelichtingsregel tussen kop en tabel (bv. welke ploeg als eerste staat).
  const tableBlock = (title, opts, gapAfter = 24, note = '') => {
    const full = { margin: { left: MG, right: MG, top: MG, bottom: MG }, rowPageBreak: 'avoid', ...opts };
    const h = measureTable(full);
    // Een lange toelichting (bv. de legende van de positielabels) moet afbreken i.p.v. voorbij de
    // rechtermarge te lopen — dus vooraf opsplitsen en de hoogte meerekenen.
    let noteLines = [];
    if (note) { doc.setFont(undefined, 'normal'); doc.setFontSize(8.5); noteLines = doc.splitTextToSize(note, CW); }
    const headH = (title ? 30 : 0) + noteLines.length * 11 + (note ? 4 : 0);
    if (h != null && y + headH + h > PH - MG) { doc.addPage(); y = MG; }
    if (title) heading(title);
    if (noteLines.length) {
      doc.setFont(undefined, 'normal'); doc.setFontSize(8.5); doc.setTextColor(107, 114, 128);
      for (const ln of noteLines) { doc.text(ln, MG, y); y += 11; }
      y += 4; doc.setTextColor(23, 23, 23);
    }
    doc.autoTable({ ...full, startY: y });
    y = doc.lastAutoTable.finalY + gapAfter;
  };

  // ---- Header ----
  const logoPng = await rasterizeToPng(getClubLogo(), 96, 96);
  if (logoPng) { try { doc.addImage(logoPng, 'PNG', MG, y, 40, 40); } catch (e) {} }
  // Clublogo rechtsboven, naast het MatchDelegate-merklogo (onvervormd, max 40×40 pt).
  let clubW = 0;
  const clubLogo = await rasterizeToPngFit(getActiveClubLogo(), 40, 40);
  if (clubLogo) { try { doc.addImage(clubLogo.uri, 'PNG', MG + CW - clubLogo.w, y, clubLogo.w, clubLogo.h); clubW = clubLogo.w + 10; } catch (e) {} }
  const tx = MG + 50, tw = CW - 50 - clubW;
  doc.setFont(undefined, 'bold'); doc.setFontSize(15); doc.setTextColor(23, 23, 23);
  const title = isAway(m) ? `${m.opponent} vs ${tName(m)}` : `${tName(m)} vs ${m.opponent}`;
  const titleLines = doc.splitTextToSize(title, tw);
  doc.text(titleLines, tx, y + 13);
  doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(107, 114, 128);
  // Metaregels net onder de (mogelijk meerregelige) titel plaatsen i.p.v. op vaste offsets,
  // zodat een lange titel de datum-/inforegel niet overlapt en de header-hoogte meegroeit.
  // Ook deze regels kunnen door maxWidth over meerdere regels wikkelen — my moet dan met
  // het werkelijke aantal regels opschuiven, anders komt de oranje lijn door de tekst.
  let my = y + 13 + (titleLines.length - 1) * 16 + 14;
  const metaLines = doc.splitTextToSize(`${matchWhen(m)} · ${m.location} · ${m.matchType} · ${m.numQuarters} ${pPlural(m)} × ${m.quarterDuration} min`, tw);
  doc.text(metaLines, tx, my);
  my += metaLines.length * 12;
  if (infoBits.length) {
    const infoLines = doc.splitTextToSize(infoBits.join(' · '), tw);
    doc.text(infoLines, tx, my);
    my += infoLines.length * 12;
  }
  y = Math.max(y + 56, my + 4);
  doc.setDrawColor(245, 130, 31); doc.setLineWidth(2); doc.line(MG, y, MG + CW, y);
  y += 26;

  // ---- Score ----
  doc.setFont(undefined, 'bold'); doc.setFontSize(30); doc.setTextColor(23, 23, 23);
  doc.text(isAway(m) ? `${m.scoreThem} – ${m.scoreUs}` : `${m.scoreUs} – ${m.scoreThem}`, PW / 2, y + 24, { align: 'center' });
  y += 46;
  if (m.motmId) {
    doc.setFont(undefined, 'bold'); doc.setFontSize(11);
    doc.text(`Man van de match: ${pName(m, m.motmId)}`, PW / 2, y, { align: 'center' });
    y += 20;
  }

  // ---- Selectie (kern + bank, dan de afwezigen en wie niet geselecteerd was) ----
  const selBlocks = selectionBlocks(m).blocks;
  if (selBlocks.length) {
    doc.setFont(undefined, 'normal'); doc.setFontSize(10);
    const wrapped = selBlocks.map(([lbl, list]) => doc.splitTextToSize((lbl ? lbl + ' ' : '') + list.map(nameWithNum).join(', '), CW));
    heading('Selectie', wrapped.reduce((n, w) => n + w.length * 13, 0) + (selBlocks.length - 1) * 4);
    for (let i = 0; i < wrapped.length; i++) {
      doc.setFont(undefined, 'normal'); doc.setFontSize(10);
      doc.setTextColor(...(selBlocks[i][0] ? [107, 114, 128] : [23, 23, 23]));
      for (const line of wrapped[i]) { ensure(13); doc.text(line, MG, y); y += 13; }
      y += 4;
    }
    doc.setTextColor(23, 23, 23);
    y += 8;
  }

  // ---- Opstelling per periode (tabel: veldposities + bank, met wisselmarkeringen) ----
  // Bewust vóór de velddiagrammen: zo staat de tabel bij de Selectie op pagina 1 en
  // beginnen de diagrammen (één samenhangend blok) netjes op de volgende pagina.
  const lineupTable = lineupPerQuarterRows(m);
  if (lineupTable) {
    tableBlock(`Opstelling per ${pSingLow(m)}`, { head: [lineupTable.head], body: lineupTable.body,
      styles: { fontSize: 8.5, cellPadding: 5 }, headStyles: { fillColor: [245, 246, 245], textColor: [107, 114, 128], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } } }, 24, POS_LABEL_LEGEND);
  }

  // ---- Opstelling (diagram = afbeelding, rest van het PDF blijft tekst) ----
  if (m.players.some(p => p.starting)) {
    const numQ = m.quarters.length || 1;
    const items = numQ <= 1
      ? [{ q: null, ps: m.players.filter(p => p.starting), capId: m.captainId }]
      : Array.from({ length: numQ }, (_, i) => { const q = i + 1; return { q, ps: playersAtPeriodStart(m, q), capId: captainAtStartOfQuarter(m, q) }; });
    // 1-3 items: allemaal op één rij. 4 items: 2x2 (niet 3+1). 5+: 3 per rij.
    const perRow = items.length <= 3 ? items.length : (items.length === 4 ? 2 : 3);
    const numRows = Math.ceil(items.length / perRow);
    const gap = 12;
    let imgW = (CW - (perRow - 1) * gap) / perRow;
    // Bij meerdere rijen (bv. 2x2 voor 4 kwarten) de diagrammen kleiner houden zodat ze
    // samen op één pagina passen.
    if (numRows > 1) imgW = Math.min(imgW, 150);
    const imgH = imgW * PITCH_PDF_RATIO;
    const labelH = items[0].q != null ? 14 : 0;
    // Het hele diagrammenblok (kop + alle rijen + legende) bij elkaar houden: past het niet
    // meer op deze pagina, dan eerst naar een nieuwe pagina i.p.v. de rijen te splitsen
    // (dat gebeurde zodra er boven het blok extra secties zoals "Selectie" bijkwamen).
    ensure(21 + numRows * (imgH + labelH + 14) + 18);
    // "Startopstelling per kwart/helft/deel": de diagrammen tonen de stand bij de START van elke
    // periode (formatie staat al in de inforegel bovenaan, dus niet dubbel vermelden).
    heading(items.length > 1 ? `Startopstelling per ${pSingLow(m)}` : 'Startopstelling');
    const rowWidth = perRow * imgW + (perRow - 1) * gap;
    const rowStartX = MG + (CW - rowWidth) / 2; // centreren als de rij smaller is dan de volle breedte
    for (let i = 0; i < items.length; i += perRow) {
      const rowItems = items.slice(i, i + perRow);
      ensure(imgH + labelH + 14);
      let x = rowStartX;
      for (const it of rowItems) {
        if (it.q != null) {
          doc.setFont(undefined, 'bold'); doc.setFontSize(9); doc.setTextColor(107, 114, 128);
          doc.text(`${pSing(m)} ${it.q}`.toUpperCase(), x + imgW / 2, y, { align: 'center' });
        }
        drawPitchPdf(doc, m, it.ps, x, y + labelH, imgW, it.capId, it.q != null ? it.q : (m.quarters.length ? 1 : undefined));
        x += imgW + gap;
      }
      y += imgH + labelH + 14;
    }
    doc.setFont(undefined, 'normal'); doc.setFontSize(9); doc.setTextColor(156, 163, 175);
    doc.text('Oranje = doelman · cijfer = positienummer · © = kapitein', PW / 2, y, { align: 'center' });
    y += 18; doc.setTextColor(23, 23, 23);
  }

  // ---- Tussenstand per periode ----
  if (m.quarters.length) {
    const rows = m.quarters.map(q => {
      const dur = q.endTime ? Math.round((q.endTime - q.startTime - (q.totalPaused || 0)) / 60000) : (m.quarterDuration || 0);
      const cum = scoreUpToQuarter(m, q.num);
      const cumText = isAway(m) ? `${cum.them} – ${cum.us}` : `${cum.us} – ${cum.them}`;
      const gs = m.events.filter(e => (e.type === 'goal_us' || e.type === 'goal_them' || e.type === 'own_goal' || (e.type.startsWith('penalty') && e.scored)) && e.quarterNum === q.num)
        .map(e => `${e.gameTimeMs != null ? eventMinSummaryText(e, m) + ' ' : ''}${evtLabelPlain(e, m)}`).join('\n') || '–';
      return [`${pAbbr(m)}${q.num}`, cumText, `${dur} min`, gs];
    });
    tableBlock(`Tussenstand per ${pSingLow(m)}`, { head: [[pSing(m), 'Tussenstand', 'Duur', 'Doelpunten']], body: rows,
      styles: { fontSize: 9, cellPadding: 5, valign: 'top' }, headStyles: { fillColor: [245, 246, 245], textColor: [107, 114, 128], fontStyle: 'bold' } },
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
    heading('Wedstrijdstatistieken', 16);
    doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(23, 23, 23);
    doc.text(pdfStats.map(([, t]) => t).join('   ·   '), MG, y, { maxWidth: CW });
    y += 26;
  }

  // ---- Keeper(s) ----
  const keeperMs = keeperMinutes(m);
  if (keeperMs && Object.keys(keeperMs).length) {
    heading('Keeper(s)', 16);
    doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(23, 23, 23);
    const keeperText = Object.entries(keeperMs)
      .sort((a, b) => b[1] - a[1])
      .map(([pid, ms]) => `${pName(m, pid)}: ${Math.round(ms / 60000)} min`)
      .join('   ·   ');
    doc.text(keeperText, MG, y, { maxWidth: CW });
    y += 26;
  }

  // ---- Spelers ----
  const qCols = qData ? qData.qNums.map(qNum => `${pAbbr(m)}${qNum}`) : [];
  const playerHead = ['#', 'Naam', 'Totaal', ...qCols, 'Goals', 'Assists', 'Geel', 'Rood'];
  const absentRowIdx = new Set();
  const playerRows = m.players.map((p, idx) => {
    if (p.absent) { absentRowIdx.add(idx); return [p.number || '', p.name || '', 'Niet aanwezig', ...qCols.map(() => ''), '', '', '', '']; }
    const min = mins[p.id] ? Math.floor(mins[p.id].ms / 60000) : 0;
    const g = m.events.filter(e => (e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored)) && e.playerId === p.id).length;
    const a = m.events.filter(e => e.type === 'goal_us' && e.assistId === p.id).length;
    const yc = m.events.filter(e => e.type === 'yellow_card' && e.playerId === p.id).length;
    const rc = m.events.filter(e => e.type === 'red_card' && e.playerId === p.id).length;
    const qVals = qData ? qData.qNums.map(qNum => { const ms = qData.result[p.id]?.[qNum] || 0; return ms > 0 ? Math.round(ms / 60000) + "'" : '—'; }) : [];
    return [p.number || '', p.name || '', `${min}'`, ...qVals, g || '', a || '', yc || '', rc || ''];
  });
  tableBlock('Spelers', { head: [playerHead], body: playerRows,
    styles: { fontSize: 8.5, cellPadding: 5 }, headStyles: { fillColor: [245, 246, 245], textColor: [107, 114, 128], fontStyle: 'bold' },
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
      if (png) { try { doc.addImage(png, 'PNG', x, y, imgW, imgH); } catch (e) {} }
      x += imgW + gap;
    }
    y += imgH + 20;
  }

  // ---- Notities (enkel beheerder) ----
  if (canManage() && m.notes) {
    doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(23, 23, 23);
    const lines = doc.splitTextToSize(m.notes, CW);
    heading('Notities', Math.min(lines.length, 4) * 14);
    doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(23, 23, 23);
    for (const line of lines) { ensure(14); doc.text(line, MG, y); y += 14; }
    y += 10;
  }
  const notedPlayers = m.players.filter(p => p.note);
  if (canManage() && notedPlayers.length) {
    heading('Notities per speler', 14);
    for (const p of notedPlayers) {
      const lines = doc.splitTextToSize(`${p.name}: ${p.note}`, CW);
      for (const line of lines) { ensure(14); doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.text(line, MG, y); y += 14; }
    }
    y += 10;
  }

  // ---- Volledige tijdlijn ----
  const timelineGroups = eventsByQuarter(m);
  timelineGroups.forEach((g, gi) => {
    // Tussenstand in dezelfde volgorde als overal elders: bij een uitwedstrijd staat de eigen
    // ploeg tweede (thuisploeg – uitploeg), zoals de eindscore en de tabel hierboven.
    const cumText = !g.cum ? '' : (isAway(m) ? `${g.cum.them}–${g.cum.us}` : `${g.cum.us}–${g.cum.them}`);
    const head = g.qn == null ? 'Overig' : `${pSing(m)} ${g.qn}${cumText ? ` — tussenstand ${cumText}` : ''}`;
    const rows = g.list.length ? g.list.map(e => [eventMinLocal(e, m), evtLabelPlain(e, m)]) : [['', 'Geen events']];
    // Kopcel over beide kolommen: anders wordt de titel in de smalle minuut-kolom (60 pt)
    // gewikkeld en komt de tussenstand ónder het kwart te staan i.p.v. ernaast.
    tableBlock(gi === 0 ? `Volledige tijdlijn (${m.events.length} events)` : null,
      { head: [[{ content: head, colSpan: 2 }]], body: rows, showHead: 'firstPage',
        styles: { fontSize: 9, cellPadding: 4 }, headStyles: { fillColor: [241, 243, 245], textColor: [23, 23, 23], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 60 } } }, 10,
      gi === 0 ? `Minuut binnen het ${pSingLow(m)} · tussenstand: ${homeName(m)} – ${awayName(m)}` : '');
  });

  // Voettekst + paginanummer op ELKE pagina: één losse doc.text() na het opbouwen belandde
  // enkel op de pagina die dan actief was (de laatste).
  const totalPages = doc.getNumberOfPages ? doc.getNumberOfPages() : doc.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFont(undefined, 'normal'); doc.setFontSize(9); doc.setTextColor(156, 163, 175);
    doc.text(`Match Delegate · ${activeClubName || getClubName()} · app created by Tim Buyse`, PW / 2, PH - 20, { align: 'center' });
    doc.text(`${pg} / ${totalPages}`, MG + CW, PH - 20, { align: 'right' });
  }

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
views.tournamentNew = renderTournamentNew;
views.prep = renderPrep;
views.new = renderNew;
function newMatch() { if (!canManage()) return; startWizard(); go('new'); }
init();
