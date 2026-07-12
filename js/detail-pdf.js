// ===================== DETAIL VIEW =====================
function renderDetail() {
  if (!match) return '<div class="content"><p>Niet gevonden.</p></div>';
  if (ensurePosNums(match)) dbSave(match);
  const ro = !!(match.fromCloud && (!isAdmin || viewerMode)); // kijker: alleen-lezen
  const mins = calcMinutes(match);
  const qSummary = match.quarters.map(q => {
    const dur = q.endTime ? q.endTime - q.startTime - (q.totalPaused||0) : getQElapsed(match);
    const goals = match.events.filter(e => (e.type==='goal_us'||e.type==='own_goal_them'||e.type==='goal_them'||e.type==='own_goal'||(e.type.startsWith('penalty')&&e.scored)) && e.quarterNum === q.num);
    const cum = scoreUpToQuarter(match, q.num);
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bdr)">
      <div style="font-weight:800;min-width:32px">${pAbbr(match)}${q.num}</div>
      <div style="font-weight:900;min-width:54px;font-variant-numeric:tabular-nums">${isAway(match) ? `${cum.them}–<span style="color:var(--grn)">${cum.us}</span>` : `<span style="color:var(--grn)">${cum.us}</span>–${cum.them}`}</div>
      <div style="flex:1;font-size:13px;color:var(--txt2)">${fmtTime(dur)}</div>
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
      ${[['Formatie',match.formation],['Trainer',match.trainer],['Ploegverantwoordelijke',match.responsible],['Soort',match.competition],['Speeldag',match.matchday],['Scheidsrechter',match.referee],['Truikleur',match.jersey],['Locatie',match.venue],['Kapitein(s)',allCaptains(match).map(id=>pName(match,id)).join(' | ')]].filter(([k,v])=>v).map(([k,v])=>`<div class="stat-row"><span style="color:var(--txt2);min-width:120px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('') || '<p style="color:var(--txt2);font-size:14px">Geen extra info ingevuld.</p>'}
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
    ${ro ? '' : `<div class="sec">Notities <span style="font-size:11px;font-weight:400;color:var(--txt2);text-transform:none">(enkel zichtbaar voor beheerders)</span></div>
    <div class="card">
      <p class="notes-txt" style="${match.notes?'':'color:var(--txt2)'}">${match.notes?esc(match.notes):'Geen notities.'}</p>
      <button class="btn btn-pale btn-sm no-print" style="margin-top:10px" onclick="modalNotes()">${icI(IC.edit)} Bewerken</button>
    </div>`}
    <div class="sec">Opstelling</div>
    <div class="card">${renderLineupCarousel(match)}</div>
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
    opponent: '',
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
function rasterizeSvgString(svgString, w, h) {
  // data:image/svg+xml vereist een xmlns-attribuut op de root <svg> (in tegenstelling tot
  // inline SVG in een HTML-pagina, waar de browser dat automatisch regelt) — anders
  // weigert de browser het te laden als losstaande afbeelding.
  if (!/xmlns=/.test(svgString)) svgString = svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return rasterizeToPng('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString), w, h);
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
  const infoBits = [m.formation && ('Opstelling: ' + m.formation), m.competition, m.matchday && ('Speeldag ' + m.matchday), m.trainer && ('Trainer: ' + m.trainer), m.responsible && ('Afgevaardigde: ' + m.responsible), m.referee && ('ref.: ' + m.referee), m.jersey && ('trui ' + m.jersey), m.venue && ('Locatie: ' + m.venue), allCaptains(m).length && ('Kapitein(s): ' + allCaptains(m).map(id => pName(m, id)).join(' | '))].filter(Boolean);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const PW = 595.28, PH = 841.89, MG = 40, CW = PW - MG * 2;
  let y = MG;
  const ensure = need => { if (y + need > PH - MG) { doc.addPage(); y = MG; } };
  const heading = text => {
    ensure(30);
    doc.setFont(undefined, 'bold'); doc.setFontSize(11); doc.setTextColor(107, 114, 128);
    doc.text(text.toUpperCase(), MG, y);
    y += 5; doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.75); doc.line(MG, y, MG + CW, y);
    y += 16; doc.setTextColor(23, 23, 23);
  };

  // ---- Header ----
  const logoPng = await rasterizeToPng(getClubLogo(), 96, 96);
  if (logoPng) { try { doc.addImage(logoPng, 'PNG', MG, y, 40, 40); } catch (e) {} }
  const tx = MG + 50, tw = CW - 50;
  doc.setFont(undefined, 'bold'); doc.setFontSize(15); doc.setTextColor(23, 23, 23);
  const title = isAway(m) ? `${m.opponent} vs ${tName(m)}` : `${tName(m)} vs ${m.opponent}`;
  doc.text(title, tx, y + 13, { maxWidth: tw });
  doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(107, 114, 128);
  doc.text(`${matchWhen(m)} · ${m.location} · ${m.matchType} · ${m.numQuarters} ${pPlural(m)} × ${m.quarterDuration} min`, tx, y + 27, { maxWidth: tw });
  if (infoBits.length) doc.text(infoBits.join(' · '), tx, y + 39, { maxWidth: tw });
  y += 56;
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

  // ---- Opstelling (diagram = afbeelding, rest van het PDF blijft tekst) ----
  if (m.players.some(p => p.starting)) {
    heading(`Opstelling${m.formation ? ' · ' + m.formation : ''}`);
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
    // samen met kop/score/legende nog op pagina 1 passen i.p.v. over te lopen naar pagina 2.
    if (numRows > 1) imgW = Math.min(imgW, 150);
    const imgH = imgW * (504 / 326);
    const rowWidth = perRow * imgW + (perRow - 1) * gap;
    const rowStartX = MG + (CW - rowWidth) / 2; // centreren als de rij smaller is dan de volle breedte
    for (let i = 0; i < items.length; i += perRow) {
      const rowItems = items.slice(i, i + perRow);
      const labelH = rowItems[0].q != null ? 14 : 0;
      ensure(imgH + labelH + 14);
      let x = rowStartX;
      for (const it of rowItems) {
        if (it.q != null) {
          doc.setFont(undefined, 'bold'); doc.setFontSize(9); doc.setTextColor(107, 114, 128);
          doc.text(`${pSing(m)} ${it.q}`.toUpperCase(), x + imgW / 2, y, { align: 'center' });
        }
        const png = await rasterizeSvgString(pitchSVG(m, it.ps, 326, it.capId), 326 * 2, 504 * 2);
        if (png) { try { doc.addImage(png, 'PNG', x, y + labelH, imgW, imgH); } catch (e) {} }
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
    heading(`Tussenstand per ${pSingLow(m)}`);
    const rows = m.quarters.map(q => {
      const dur = q.endTime ? Math.round((q.endTime - q.startTime - (q.totalPaused || 0)) / 60000) : 0;
      const cum = scoreUpToQuarter(m, q.num);
      const cumText = isAway(m) ? `${cum.them} – ${cum.us}` : `${cum.us} – ${cum.them}`;
      const gs = m.events.filter(e => (e.type === 'goal_us' || e.type === 'goal_them' || e.type === 'own_goal' || e.type === 'own_goal_them' || (e.type.startsWith('penalty') && e.scored)) && e.quarterNum === q.num)
        .map(e => `${e.gameTimeMs != null ? eventMinSummaryText(e, m) + ' ' : ''}${evtLabelPlain(e, m)}`).join('\n') || '–';
      return [`${pAbbr(m)}${q.num}`, cumText, `${dur} min`, gs];
    });
    doc.autoTable({ startY: y, margin: { left: MG, right: MG }, head: [[pSing(m), 'Tussenstand', 'Duur', 'Doelpunten']], body: rows,
      styles: { fontSize: 9, cellPadding: 5, valign: 'top' }, headStyles: { fillColor: [245, 246, 245], textColor: [107, 114, 128], fontStyle: 'bold' } });
    y = doc.lastAutoTable.finalY + 24;
  }

  // ---- Wedstrijdstatistieken ----
  const pdfStats = [
    [stat('corner_us') + stat('corner_them'), `Hoekschoppen: ${stat('corner_us')} – ${stat('corner_them')}`],
    [stat('freekick_us') + stat('freekick_them'), `Vrije trappen: ${stat('freekick_us')} – ${stat('freekick_them')}`],
    [stat('penalty_us') + stat('penalty_them'), `Penalty's: ${stat('penalty_us')} – ${stat('penalty_them')}`],
    [stat('yellow_card') + stat('red_card'), `Geel: ${stat('yellow_card')} · Rood: ${stat('red_card')}`],
  ].filter(([n]) => n > 0);
  if (pdfStats.length) {
    heading('Wedstrijdstatistieken');
    ensure(16);
    doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(23, 23, 23);
    doc.text(pdfStats.map(([, t]) => t).join('   ·   '), MG, y, { maxWidth: CW });
    y += 26;
  }

  // ---- Spelers ----
  heading('Spelers');
  const qCols = qData ? qData.qNums.map(qNum => `${pAbbr(m)}${qNum}`) : [];
  const playerHead = ['#', 'Naam', 'Totaal', ...qCols, 'Goals', 'Assists', 'Geel', 'Rood'];
  const absentRowIdx = new Set();
  const playerRows = m.players.map((p, idx) => {
    if (p.absent) { absentRowIdx.add(idx); return [p.number || '', p.name || '', 'Afwezig', ...qCols.map(() => ''), '', '', '', '']; }
    const min = mins[p.id] ? Math.floor(mins[p.id].ms / 60000) : 0;
    const g = m.events.filter(e => (e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored)) && e.playerId === p.id).length;
    const a = m.events.filter(e => e.type === 'goal_us' && e.assistId === p.id).length;
    const yc = m.events.filter(e => e.type === 'yellow_card' && e.playerId === p.id).length;
    const rc = m.events.filter(e => e.type === 'red_card' && e.playerId === p.id).length;
    const qVals = qData ? qData.qNums.map(qNum => { const ms = qData.result[p.id]?.[qNum] || 0; return ms > 0 ? Math.round(ms / 60000) + "'" : '—'; }) : [];
    return [p.number || '', p.name || '', `${min}'`, ...qVals, g || '', a || '', yc || '', rc || ''];
  });
  doc.autoTable({ startY: y, margin: { left: MG, right: MG }, head: [playerHead], body: playerRows,
    styles: { fontSize: 8.5, cellPadding: 5 }, headStyles: { fillColor: [245, 246, 245], textColor: [107, 114, 128], fontStyle: 'bold' },
    didParseCell: data => { if (data.section === 'body' && absentRowIdx.has(data.row.index)) data.cell.styles.textColor = [156, 163, 175]; } });
  y = doc.lastAutoTable.finalY + 24;

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
    heading('Notities');
    doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(23, 23, 23);
    const lines = doc.splitTextToSize(m.notes, CW);
    for (const line of lines) { ensure(14); doc.text(line, MG, y); y += 14; }
    y += 10;
  }
  const notedPlayers = m.players.filter(p => p.note);
  if (canManage() && notedPlayers.length) {
    heading('Notities per speler');
    for (const p of notedPlayers) {
      const lines = doc.splitTextToSize(`${p.name}: ${p.note}`, CW);
      for (const line of lines) { ensure(14); doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.text(line, MG, y); y += 14; }
    }
    y += 10;
  }

  // ---- Volledige tijdlijn ----
  const timelineGroups = eventsByQuarter(m);
  heading(`Volledige tijdlijn (${m.events.length} events)`);
  for (const g of timelineGroups) {
    const head = g.qn == null ? 'Overig' : `${pSing(m)} ${g.qn}${g.cum ? ` — tussenstand ${g.cum.us}–${g.cum.them}` : ''}`;
    const rows = g.list.length ? g.list.map(e => [eventMinLocal(e, m), evtLabelPlain(e, m)]) : [['', 'Geen events']];
    doc.autoTable({ startY: y, margin: { left: MG, right: MG }, head: [[head, '']], body: rows, showHead: 'firstPage',
      styles: { fontSize: 9, cellPadding: 4 }, headStyles: { fillColor: [241, 243, 245], textColor: [23, 23, 23], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 60 } } });
    y = doc.lastAutoTable.finalY + 10;
  }

  doc.setFont(undefined, 'normal'); doc.setFontSize(9); doc.setTextColor(156, 163, 175);
  doc.text(`Match Delegate · ${getClubName()} · app created by Tim Buyse`, PW / 2, PH - 20, { align: 'center' });

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
views.teams = renderTeamsList;
views.teamEdit = renderTeamEdit;
views.tournaments = renderTournamentList;
views.tournament = renderTournament;
views.tournamentNew = renderTournamentNew;
views.prep = renderPrep;
views.new = renderNew;
function newMatch() { if (!canManage()) return; startWizard(); go('new'); }
init();
