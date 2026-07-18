// ===================== PLOEGEN BEHEREN =====================
let editingTeam = null;
let teamEditMode = false; // beheerder: overzicht (uit) vs. bewerkbare lijst (aan)
function renderTeamsList() {
  const teams = cloudReady ? getTeamsV2().filter(t => t.fromCloud) : getTeamsV2();
  const title = cloudReady ? `${icI(IC.players)} Spelers` : `${icI(IC.players)} Ploegen`;
  return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>${title}</h1></div>
  <div class="content">
    ${teams.length ? teams.map(t => `<div class="team-row" onclick="openTeam('${t.id}')"><div><div class="tn">${esc(t.name)}</div><div class="tc">${t.players.length} spelers</div></div><span style="margin-left:auto;color:var(--txt2);font-size:22px">›</span></div>`).join('') : `<div class="empty"><div class="ei">${IC.players}</div><p>Nog geen spelers.</p></div>`}
    ${!cloudReady && canManage()
      ? '<button class="btn btn-green" style="margin-top:8px" onclick="newTeam()">+ Nieuwe ploeg</button>'
      : (cloudReady && isAdmin)
        ? `<div class="viewer-banner" style="margin-top:8px">${icI(IC.plus)} Een andere ploeg aanmaken of ernaar wisselen doe je via de ploegknop (${icI(IC.swap)}) bovenaan het startscherm.</div>`
        : `<div class="viewer-banner" style="margin-top:8px">${icI(IC.eye)} Je kijkt mee — spelers worden door de beheerder beheerd</div>`}
  </div>`;
}
function newTeam() { if (!canManage()) return; editingTeam = { id: uid(), name: '', responsible: '', trainers: [], players: [], isNew: true }; teamEditMode = true; go('teamEdit'); }
function openTeam(id) { const t = teamById(id); if (!t) return; editingTeam = JSON.parse(JSON.stringify(t)); teamEditMode = false; go('teamEdit'); }
function toggleTeamEditMode() { teamEditMode = !teamEditMode; render(); }
// Kant-veld (centraal/links/rechts) is enkel zinvol bij Verdediging — tonen/verbergen
// zonder volledige herrender (zelfde patroon als wizTrainerSelChange).
function teamPosChange(i, val) {
  editingTeam.players[i].pos = val;
  if (val !== 'Verdediging') editingTeam.players[i].side = '';
  const fg = document.getElementById('team-side-fg-' + i);
  if (fg) fg.style.display = val === 'Verdediging' ? '' : 'none';
}
// Beheerder: ga rechtstreeks naar de spelerslijst van de huidige ploeg (1 roster per ploeg).
function openSquad() { const arr = cloudReady ? getTeamsV2().filter(t => t.fromCloud) : getTeamsV2(); if (arr.length === 1) openTeam(arr[0].id); else go('teams'); }
function closeTeamEdit() { editingTeam = null; go(cloudReady ? 'home' : 'teams'); }
function renderTeamView() {
  const t = editingTeam;
  const trainers = (t.trainers || []).filter(tr => tr.name);
  const sorted = [...t.players].sort((a, b) => (parseInt(a.number) || 999) - (parseInt(b.number) || 999));
  const rows = sorted.length ? sorted.map(p => `<div class="stat-row" style="cursor:pointer" onclick="openPlayerDetail('${jsq(pFirstName(p) + ' ' + pLastName(p))}','${jsq(t.name)}','${jsq(p.id)}')">
      <span style="min-width:38px;font-weight:800;color:var(--txt2)">${esc(p.number)||'–'}</span>
      <span style="flex:1;font-weight:600">${esc(pFirstName(p))} ${esc(pLastName(p))}</span>
      ${p.pos?`<span style="font-size:12px;color:var(--txt2)">${esc(posDisplay(p))}</span>`:''}
    </div>`).join('') : '<p style="color:var(--txt2);font-size:13px;text-align:center;padding:6px 0">Nog geen spelers.</p>';
  return `<div class="hdr"><button class="back" onclick="closeTeamEdit()">‹</button><h1>${esc(t.name)}</h1></div>
  <div class="content">
    <div class="viewer-banner">${icI(IC.eye)} Je kijkt mee — ploegen worden door de beheerder beheerd</div>
    ${(t.responsible || trainers.length) ? `<div class="card">
      ${t.responsible?`<div class="stat-row"><span style="color:var(--txt2);min-width:140px">Ploegverantwoordelijke</span><span style="font-weight:600">${esc(t.responsible)}</span></div>`:''}
      ${trainers.map((tr,i)=>`<div class="stat-row"><span style="color:var(--txt2);min-width:140px">Trainer ${i+1}</span><span style="font-weight:600">${esc(tr.name)}</span></div>`).join('')}
    </div>` : ''}
    <div class="sec">Spelers (${t.players.length})</div>
    <div class="card">${rows}</div>
  </div>`;
}
function renderTeamOverview() {
  const t = editingTeam;
  const trainers = (t.trainers || []).filter(tr => tr.name);
  const oDmt = MATCH_TYPES[t.defaultMatchType] ? t.defaultMatchType : '8v8';
  const oForms = FORMATIONS[oDmt] || [];
  const oForm = oForms.some(f => f.name === t.defaultFormation) ? t.defaultFormation : (oForms[0] ? oForms[0].name : '');
  const sorted = [...t.players].sort((a, b) => (parseInt(a.number) || 999) - (parseInt(b.number) || 999));
  const rows = sorted.length ? sorted.map(p => `<div class="stat-row" style="cursor:pointer" onclick="openPlayerDetail('${jsq(pFirstName(p) + ' ' + pLastName(p))}','${jsq(t.name)}','${jsq(p.id)}')">
      <span style="min-width:38px;font-weight:800;color:var(--txt2)">${esc(p.number)||'–'}</span>
      <span style="flex:1;font-weight:600">${esc(pFirstName(p))} ${esc(pLastName(p))}</span>
      ${p.pos?`<span style="font-size:12px;color:var(--txt2)">${esc(posDisplay(p))}</span>`:''}
    </div>`).join('') : '<p style="color:var(--txt2);font-size:13px;text-align:center;padding:6px 0">Nog geen spelers.</p>';
  return `<div class="hdr"><button class="back" onclick="closeTeamEdit()">‹</button><h1>${esc(t.name)}</h1></div>
  <div class="content">
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1"><b style="font-size:15px">${icI(IC.edit)} Bewerken</b><div style="font-size:12px;color:var(--txt2)">Spelers, rugnummers en trainers aanpassen.</div></div>
        <span class="start-chip" onclick="toggleTeamEditMode()">Aan</span>
      </div>
    </div>
    <div class="card">
      <div class="stat-row"><span style="color:var(--txt2);min-width:140px">Standaardopstelling</span><span style="font-weight:600">${esc(oForm)} <span style="color:var(--txt2);font-weight:400">(${esc(oDmt)})</span></span></div>
      ${t.responsible?`<div class="stat-row"><span style="color:var(--txt2);min-width:140px">Ploegverantwoordelijke</span><span style="font-weight:600">${esc(t.responsible)}</span></div>`:''}
      ${trainers.map((tr,i)=>`<div class="stat-row"><span style="color:var(--txt2);min-width:140px">Trainer ${i+1}</span><span style="font-weight:600">${esc(tr.name)}</span></div>`).join('')}
    </div>
    <div class="sec">Spelers (${t.players.length})</div>
    <div class="card">${rows}</div>
  </div>`;
}
function renderTeamEdit() {
  if (!editingTeam) return '<div class="content"><p>Geen ploeg.</p></div>';
  if (!canManage()) return renderTeamView();
  if (!teamEditMode) return renderTeamOverview();
  const lines = ['Doel', 'Verdediging', 'Middenveld', 'Aanval'];
  const rows = editingTeam.players.map((p, i) => `
    <div class="pirow">
      <input type="number" placeholder="Rugnr" value="${esc(p.number)}" onchange="editingTeam.players[${i}].number=this.value" inputmode="numeric" aria-label="Rugnummer">
      <input type="text" placeholder="Voornaam" value="${esc(pFirstName(p))}" oninput="editingTeam.players[${i}].firstName=this.value" autocomplete="off">
      <input type="text" placeholder="Familienaam" value="${esc(pLastName(p))}" oninput="editingTeam.players[${i}].lastName=this.value" autocomplete="off">
      <button class="delbtn" onclick="teamDelPlayer(${i})">×</button>
    </div>
    <div class="pirow2" style="grid-template-columns:1fr;margin-bottom:12px">
      <select onchange="teamPosChange(${i},this.value)"><option value="">Voorkeurspositie…</option>${lines.map(l => `<option value="${esc(l)}" ${p.pos===l?'selected':''}>${lineLabel(l)}</option>`).join('')}</select>
    </div>
    <div class="pirow2" id="team-side-fg-${i}" style="grid-template-columns:1fr;margin-bottom:12px;${p.pos==='Verdediging'?'':'display:none'}">
      <select onchange="editingTeam.players[${i}].side=this.value"><option value="">Kant (optioneel)…</option>${Object.entries(DEFENSE_SIDES).map(([k,label]) => `<option value="${k}" ${p.side===k?'selected':''}>${label}</option>`).join('')}</select>
    </div>`).join('');
  const colHead = `<div style="display:grid;grid-template-columns:56px 1fr 1fr 38px;gap:6px;font-size:11px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px"><span>Rugnr</span><span>Voornaam</span><span>Familienaam</span><span></span></div>`;
  const trainers = editingTeam.trainers || [];
  const trainerRows = [0, 1, 2].map(i => {
    const t = trainers[i] || { name: '' };
    return `<div class="fg" style="margin-bottom:8px"><label>Trainer ${i+1}${i > 0 ? ' (optioneel)' : ''}</label>
      <input type="text" placeholder="Naam trainer" value="${esc(t.name)}" oninput="setTrainer(${i},this.value)" autocomplete="off"></div>`;
  }).join('');
  const dmt = MATCH_TYPES[editingTeam.defaultMatchType] ? editingTeam.defaultMatchType : '8v8';
  const dForms = FORMATIONS[dmt] || [];
  const dfName = dForms.some(f => f.name === editingTeam.defaultFormation) ? editingTeam.defaultFormation : (dForms[0] ? dForms[0].name : '');
  return `<div class="hdr"><button class="back" onclick="${editingTeam.isNew ? 'closeTeamEdit()' : 'toggleTeamEditMode()'}">‹</button><h1>Ploeg bewerken</h1></div>
  <div class="content">
    <div class="card">
      <div class="fg"><label>Ploegnaam</label>${(cloudReady && !editingTeam.isNew)
        ? `<input id="t-name" value="${esc(editingTeam.name)}" autocomplete="off" readonly style="opacity:.65;cursor:not-allowed;background:var(--bg2,rgba(0,0,0,.04))"><div style="font-size:12px;color:var(--txt2);margin-top:4px">De ploegnaam wijzig je via <b>Beheer → "Naam ploeg wijzigen"</b>.</div>`
        : `<input id="t-name" value="${esc(editingTeam.name)}" oninput="editingTeam.name=this.value" placeholder="bv. U10IP" autocomplete="off">`}</div>
      <div class="fg" style="margin-bottom:0"><label>Ploegverantwoordelijke (optioneel)</label><input type="text" placeholder="Naam ploegverantwoordelijke" value="${esc(editingTeam.responsible||'')}" oninput="editingTeam.responsible=this.value" autocomplete="off"></div>
    </div>
    <div class="sec">Standaard voor nieuwe wedstrijden</div>
    <div class="card">
      <div class="fg"><label>Standaard wedstrijdvorm</label><select onchange="teamFormatChange(this.value)">${Object.keys(MATCH_TYPES).map(k => `<option value="${k}" ${k===dmt?'selected':''}>${k}</option>`).join('')}</select></div>
      <div class="fg" style="margin-bottom:0"><label>Standaard opstelling</label><select onchange="editingTeam.defaultFormation=this.value">${dForms.map(f => `<option value="${esc(f.name)}" ${f.name===dfName?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div>
      <p style="font-size:12px;color:var(--txt2);margin:8px 0 0">Staat klaar bij een nieuwe wedstrijd; je kan het per wedstrijd nog aanpassen.</p>
    </div>
    <div class="sec">Trainers</div>
    <div class="card">${trainerRows}</div>
    <div class="sec">Spelers (${editingTeam.players.length})</div>
    ${(() => { const nums = editingTeam.players.map(p => (p.number || '').trim()).filter(Boolean); const dup = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))]; return dup.length ? `<div class="backup-banner" style="background:var(--rdp);color:var(--rd);border-color:#fca5a5">${icI(IC.warn)} Dubbel rugnummer: ${dup.map(esc).join(', ')}</div>` : ''; })()}
    ${editingTeam.players.length > 1 ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px"><button class="btn btn-gray btn-sm" onclick="teamSortPlayers('nr')">↕ Sorteer op nr</button><button class="btn btn-gray btn-sm" onclick="teamSortPlayers('name')">↕ Sorteer op naam</button></div>` : ''}
    <div class="card">${editingTeam.players.length ? colHead : ''}<div id="t-rows">${rows || '<p style="color:var(--txt2);font-size:13px;text-align:center;padding:6px 0">Nog geen spelers.</p>'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <button class="btn btn-pale btn-sm" onclick="teamAddPlayer()">+ Speler</button>
        <button class="btn btn-pale btn-sm" onclick="teamPasteModal()">${icI(IC.clipboard)} Lijst plakken</button>
      </div></div>
    <button class="btn btn-green" onclick="saveTeamEdit()">${icI(IC.check)}${cloudReady ? 'Spelers opslaan' : 'Ploeg opslaan'}</button>
    ${(editingTeam.isNew || cloudReady) ? '' : `<div class="danger"><button class="btn btn-red" onclick="deleteTeamConfirm()">${icI(IC.trash)} Ploeg verwijderen</button></div>`}
  </div>`;
}
// Standaard opstelling volgt de gekozen wedstrijdvorm in de ploeg-editor.
function teamFormatChange(val) {
  editingTeam.defaultMatchType = MATCH_TYPES[val] ? val : '8v8';
  const forms = FORMATIONS[editingTeam.defaultMatchType] || [];
  editingTeam.defaultFormation = forms[0] ? forms[0].name : '';
  render();
}
function teamAddPlayer() { editingTeam.players.push({ id: uid(), globalId: uid(), firstName: '', lastName: '', name: '', number: String(editingTeam.players.length + 1), pos: '' }); render(); }
function teamDelPlayer(i) { editingTeam.players.splice(i, 1); render(); }
function teamSortPlayers(by) {
  editingTeam.players.sort((a, b) => {
    if (by === 'nr') { const na = parseInt(a.number) || 999, nb = parseInt(b.number) || 999; return na - nb; }
    return (pFirstName(a) + pLastName(a)).localeCompare(pFirstName(b) + pLastName(b), 'nl');
  });
  render();
}
function teamPasteModal() {
  openModal(`<h3>${icI(IC.clipboard)} Spelerslijst plakken</h3>
    <p style="color:var(--txt2);font-size:13px;margin-bottom:10px">Eén speler per regel. Een rugnummer vooraan mag (bv. "10 Jan Peeters"). De rest wordt voornaam + familienaam.</p>
    <div class="fg"><textarea id="paste-area" rows="8" placeholder="1 Tom Janssens\n7 Lars De Smet\nNoah Maes"></textarea></div>
    <button class="btn btn-green" onclick="teamPasteApply()">＋ Toevoegen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function teamPasteApply() {
  const ta = document.getElementById('paste-area'); if (!ta) return;
  let added = 0;
  ta.value.split('\n').forEach(raw => {
    const line = raw.trim(); if (!line) return;
    const mtch = line.match(/^(\d{1,3})[\s.\-)]+(.*)$/);
    const number = mtch ? mtch[1] : '';
    const rest = (mtch ? mtch[2] : line).trim();
    if (!rest) return;
    const parts = rest.split(/\s+/);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ');
    editingTeam.players.push({ id: uid(), globalId: uid(), firstName, lastName, name: (firstName + ' ' + lastName).trim(), number, pos: '' });
    added++;
  });
  closeModal();
  if (added) render(); else showToast('Geen spelers gevonden in de lijst.', 'err');
}
function saveTeamEdit() {
  if (!editingTeam.name.trim()) { showToast('Geef de ploeg een naam.', 'err'); return; }
  const eDmt = MATCH_TYPES[editingTeam.defaultMatchType] ? editingTeam.defaultMatchType : '8v8';
  const eDforms = FORMATIONS[eDmt] || [];
  const eDform = eDforms.some(f => f.name === editingTeam.defaultFormation) ? editingTeam.defaultFormation : (eDforms[0] ? eDforms[0].name : '');
  const clean = {
    id: editingTeam.id,
    name: editingTeam.name.trim(),
    responsible: (editingTeam.responsible || '').trim(),
    defaultMatchType: eDmt,
    defaultFormation: eDform,
    trainers: (editingTeam.trainers || []).map(t => ({ id: t.id || uid(), name: (t.name || '').trim() })).filter(t => t.name),
    players: editingTeam.players.filter(p => (pFirstName(p) || pLastName(p) || '').trim()).map(p => {
      const fn = ((p.firstName !== undefined ? p.firstName : pFirstName(p)) || '').trim();
      const ln = ((p.lastName !== undefined ? p.lastName : pLastName(p)) || '').trim();
      // globalId blijft de speler identificeren over ploegen heen (bv. na een overzetting via
      // de eigenaarstool "Speler overzetten"); spelers van vóór die feature krijgen er hier
      // lazy alsnog één, zodat elke speler vanaf nu overzetbaar is.
      return { id: p.id, globalId: p.globalId || uid(), firstName: fn, lastName: ln, name: (fn + ' ' + ln).trim() || p.name || '', number: p.number || '', pos: p.pos || '', side: (p.pos === 'Verdediging' && p.side) || '' };
    })
  };
  if (editingTeam.fromCloud) clean.fromCloud = true;
  const arr = getTeamsV2(); const idx = arr.findIndex(t => t.id === clean.id);
  if (idx >= 0) arr[idx] = clean; else arr.push(clean);
  saveTeamsV2(arr); editingTeam = null; go(cloudReady ? 'home' : 'teams');
}
function deleteTeamConfirm() {
  openModal(`<h3>Ploeg verwijderen?</h3><p style="text-align:center;color:var(--txt2);margin-bottom:16px">"${esc(editingTeam.name)}" en alle spelers worden verwijderd. Bestaande wedstrijden blijven behouden.</p>
    <button class="btn btn-red" onclick="doDeleteTeam()">${icI(IC.trash)} Ja, verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function doDeleteTeam() { saveTeamsV2(getTeamsV2().filter(t => t.id !== editingTeam.id)); editingTeam = null; closeModal(); go('teams'); }
function setTrainer(i, val) {
  if (!editingTeam.trainers) editingTeam.trainers = [];
  while (editingTeam.trainers.length <= i) editingTeam.trainers.push({ id: uid(), name: '' });
  editingTeam.trainers[i].name = val;
}

// ===================== TORNOOIEN =====================
function renderTournamentList() {
  const today = new Date().toISOString().split('T')[0];
  const all = getTournaments().slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const planned = all.filter(t => !t.date || t.date >= today);
  const done    = all.filter(t => t.date && t.date < today).reverse();
  const newBtn = canManage() ? `<button class="btn btn-green" onclick="newTournament()">${icI(IC.medal)} + Nieuw tornooi</button>` : '';
  const trnRow = (t, borderColor) => {
    const team = teamById(t.teamId);
    return `<div class="team-row" style="border-left-color:${borderColor}" onclick="goTournament('${t.id}')">
      <div>
        <div class="tn">${icI(IC.medal)} ${esc(t.name)}</div>
        <div class="tc">${t.date ? fmtDate(new Date(t.date + 'T00:00:00').getTime()) : ''}${t.location ? ' · ' + esc(t.location) : ''}${team ? ' · ' + esc(team.name) : ''}</div>
      </div>
      <span style="margin-left:auto;color:var(--txt2);font-size:22px">›</span>
    </div>`;
  };
  const plannedHtml = planned.length
    ? planned.map(t => trnRow(t, 'var(--orn)')).join('')
    : `<div class="empty" style="padding:16px"><p style="margin:0;color:var(--txt2)">Geen geplande tornooien.</p></div>`;
  const doneHtml = done.length
    ? done.map(t => trnRow(t, 'var(--tel)')).join('')
    : `<div class="empty" style="padding:16px"><p style="margin:0;color:var(--txt2)">Geen gespeelde tornooien.</p></div>`;
  const body = all.length
    ? `<div class="sec">${icI(IC.calendar)} Geplande tornooien</div>${plannedHtml}<div class="sec">${icI(IC.done)} Gespeelde tornooien</div>${doneHtml}`
    : `<div class="empty"><div class="ei">${IC.medal}</div><p>Nog geen tornooien.<br>Tik op de knop hieronder om er een aan te maken.</p></div>`;
  return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>${icI(IC.medal)} Tornooien</h1></div>
  <div class="content">
    ${newBtn}
    ${body}
  </div>`;
}

function renderTournament() {
  const t = currentTournament;
  if (!t) return '<div class="content"><p>Niet gevonden.</p></div>';
  setTimeout(loadTournamentDetail, 0);
  const editBtn = canManage() ? `<button class="hdr-btn" onclick="editTournament('${t.id}')">${icI(IC.edit)}</button>` : '';
  return `<div class="hdr"><button class="back" onclick="go('tournaments')">‹</button><h1>${icI(IC.medal)} ${esc(t.name)}</h1>${editBtn}</div>
  <div class="content" id="trn-content"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
}

async function loadTournamentDetail() {
  const t = currentTournament;
  if (!t) return;
  const el = document.getElementById('trn-content');
  if (!el) return;
  const all = await dbAll();
  const matches = all.filter(m => m.tournamentId === t.id).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt - b.createdAt));
  const done = matches.filter(m => m.status === 'done');
  const team = teamById(t.teamId);
  const w = done.filter(m => m.scoreUs > m.scoreThem).length;
  const d = done.filter(m => m.scoreUs === m.scoreThem).length;
  const l = done.filter(m => m.scoreUs < m.scoreThem).length;
  const gf = done.reduce((s, m) => s + m.scoreUs, 0);
  const ga = done.reduce((s, m) => s + m.scoreThem, 0);
  const infoRows = [
    ['Ploeg', team ? team.name : (t.teamName || '')],
    ['Locatie', t.location],
    ['Trainer', t.trainer],
    ['Ploegverantwoordelijke', t.responsible],
  ].filter(([, v]) => v).map(([k, v]) => `<div class="stat-row"><span style="color:var(--txt2);min-width:140px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('');
  const squad = t.squad || {};
  const squadMee = squad.players
    ? squad.players.filter(s => s.sel !== 'absent').length
    : (squad.base||[]).length + (squad.bench||[]).length;
  const squadRow = `<div class="stat-row"><span style="color:var(--txt2);min-width:140px">Selectie</span><span style="font-weight:600">${squadMee} spelers${t.matchType?' · '+t.matchType:''}</span></div>`;
  const statsHtml = done.length ? `<div class="card" style="margin-bottom:12px">
    <div class="stat-big">
      <div class="stat-box"><div class="v" style="color:var(--grn)">${w}</div><div class="l">Gewonnen</div></div>
      <div class="stat-box"><div class="v">${d}</div><div class="l">Gelijk</div></div>
      <div class="stat-box"><div class="v" style="color:var(--rd)">${l}</div><div class="l">Verloren</div></div>
      <div class="stat-box"><div class="v">${gf}–${ga}</div><div class="l">Doelpunten</div></div>
    </div>
  </div>` : '';
  const noSquad = squad.players ? !squad.players.length : !((squad.base||[]).length + (squad.bench||[]).length + (squad.absent||[]).length);
  const squadWarning = (canManage() && noSquad) ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24">${icI(IC.warn)} Nog geen selectie ingegeven — geef eerst een selectie in voor je wedstrijden toevoegt. <button class="btn btn-org btn-sm" onclick="editTournament('${t.id}')">Selectie ingeven</button></div>` : '';
  const newMatchBtn = (canManage() && !noSquad) ? `<button class="btn btn-org" style="margin-bottom:12px" onclick="addTournamentMatch('${t.id}')">${icI(IC.ball)} + Wedstrijd toevoegen</button>` : '';
  const matchList = matches.length
    ? matches.map(m => `<div>${matchItemHtml(m)}${canManage() ? `<button class="btn btn-orgpale btn-sm" style="margin:-6px 0 10px;width:100%" onclick="cloneTournamentMatch('${m.id}','${t.id}')">${icI(IC.copy)} Kloon als nieuwe wedstrijd</button>` : ''}</div>`).join('')
    : `<div class="empty" style="padding:20px 0"><div class="ei" style="font-size:36px">${IC.ball}</div><p>Nog geen wedstrijden.${canManage() && !noSquad ? ' Voeg er een toe!' : ''}</p></div>`;
  el.innerHTML = `
    <div class="card">${infoRows}${squadRow}</div>
    ${squadWarning}
    ${statsHtml}
    ${newMatchBtn}
    <div class="sec">Wedstrijden (${matches.length})</div>
    ${matchList}
    ${canManage() ? `<div class="danger"><button class="btn btn-red" onclick="deleteTournamentConfirm('${t.id}')">${icI(IC.trash)} Tornooi verwijderen</button></div>` : ''}`;
}

function deleteTournamentConfirm(id) {
  const t = tournamentById(id); if (!t) return;
  openModal(`<h3>Tornooi verwijderen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px">"${esc(t.name)}" wordt verwijderd. De wedstrijden blijven bewaard maar zijn niet meer gelinkt aan dit tornooi.</p>
    <button class="btn btn-red" onclick="doDeleteTournament('${id}')">${icI(IC.trash)} Ja, verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function doDeleteTournament(id) {
  saveTournaments(getTournaments().filter(t => t.id !== id));
  currentTournament = null; closeModal(); go('tournaments');
}

// ----- Tornooi-wizard -----
function newTournament() {
  if (!canManage()) return;
  const now = new Date();
  const team = getTeamsV2()[0] || null;
  const teamTrainers = team ? (team.trainers || []).filter(tr => tr.name) : [];
  trnWiz = {
    step: 1, id: uid(), isNew: true,
    name: '', date: now.toISOString().split('T')[0],
    location: '', teamId: (team || {}).id || '',
    matchType: '8v8',
    trainer: teamTrainers.length ? teamTrainers[0].name : '',
    responsible: team ? (team.responsible || '') : '',
    trainerIsOther: false, pool: [], poolTeamId: null,
  };
  go('tournamentNew');
}
function editTournament(id) {
  if (!canManage()) return;
  const t = tournamentById(id); if (!t) return;
  trnWiz = Object.assign({}, t, { step: 1, isNew: false, pool: [], poolTeamId: null, matchType: t.matchType || '8v8' });
  trnWizBuildPool();
  const squad = t.squad || {};
  // Nieuw formaat: squad.players; oud formaat: squad.base + squad.bench + squad.absent
  const allSquad = squad.players
    ? squad.players
    : [...(squad.base||[]), ...(squad.bench||[]), ...(squad.absent||[])];
  const byKey = {};
  allSquad.forEach(s => { byKey[s.srcId || s.name] = s.sel || 'mee'; });
  trnWiz.pool.forEach(p => {
    const val = byKey[p.srcId] || byKey[p.name];
    p.sel = val === 'absent' ? 'absent' : (val ? 'mee' : 'none');
  });
  trnWiz.poolTeamId = trnWiz.teamId;
  go('tournamentNew');
}
function trnWizBuildPool() {
  const team = teamById(trnWiz.teamId);
  trnWiz.pool = team ? team.players.map(p => ({
    pid: uid(), srcId: p.id, srcGlobalId: p.globalId || null,
    name: ((pFirstName(p) + ' ' + pLastName(p)).trim()) || p.name || '',
    number: p.number || '', pos: p.pos || '', side: p.side || '', sel: 'none',
  })) : [];
}
function trnWizTeamChange() {
  captureTrnStep1();
  const team = teamById(trnWiz.teamId);
  if (team) {
    const trainers = (team.trainers || []).filter(tr => tr.name);
    trnWiz.trainer = trainers.length ? trainers[0].name : '';
    trnWiz.responsible = team.responsible || '';
    trnWiz.trainerIsOther = false;
    trnWizBuildPool(); trnWiz.poolTeamId = trnWiz.teamId;
  }
  render();
}
function trnTrainerSelChange(val) {
  trnWiz.trainerIsOther = val === '_other';
  if (!trnWiz.trainerIsOther) trnWiz.trainer = val;
  const fg = document.getElementById('trn-trainer-other-fg');
  if (fg) fg.style.display = trnWiz.trainerIsOther ? '' : 'none';
}
function captureTrnStep1() {
  const v = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const ts = document.getElementById('trn-team-sel'); if (ts) trnWiz.teamId = ts.value;
  trnWiz.name = (v('trn-name') || '').trim();
  trnWiz.date = v('trn-date');
  trnWiz.location = (v('trn-location') || '').trim();
  const mt = document.getElementById('trn-matchtype'); if (mt) trnWiz.matchType = mt.value;
  const trainerSel = document.getElementById('trn-trainer-sel');
  if (trainerSel) { trnWiz.trainerIsOther = trainerSel.value === '_other'; if (!trnWiz.trainerIsOther) trnWiz.trainer = trainerSel.value; }
  const trainerOther = document.getElementById('trn-trainer-other');
  if (trnWiz.trainerIsOther && trainerOther) trnWiz.trainer = trainerOther.value.trim();
  trnWiz.responsible = (v('trn-responsible') || '').trim();
}
function trnWizNext() {
  if (trnWiz.step === 1) {
    captureTrnStep1();
    if (!trnWiz.name) { showToast('Geef het tornooi een naam.', 'err'); return; }
    if (!trnWiz.teamId) { showToast('Kies een ploeg.', 'err'); return; }
    if (trnWiz.poolTeamId !== trnWiz.teamId) { trnWizBuildPool(); trnWiz.poolTeamId = trnWiz.teamId; }
    trnWiz.step = 2; render();
  }
}
function trnWizBack() { if (trnWiz.step > 1) { trnWiz.step--; render(); } }
function trnWizLeave() { trnWiz = null; go(currentTournament ? 'tournament' : 'tournaments'); }
function setTrnSel(pid, val) {
  const p = trnWiz.pool.find(x => x.pid === pid); if (!p) return;
  p.sel = (p.sel === val) ? 'none' : val;
  render();
}
function setTrnPoolNum(pid, val) { const p = trnWiz.pool.find(x => x.pid === pid); if (p) p.number = val; }
async function saveTournamentWiz() {
  const squad = {
    players: trnWiz.pool
      .filter(p => p.sel === 'mee' || p.sel === 'absent')
      .map(p => ({ pid: p.pid, srcId: p.srcId, globalId: p.srcGlobalId || null, name: p.name, number: p.number, pos: p.pos, side: p.side || '', sel: p.sel })),
  };
  const team = teamById(trnWiz.teamId);
  const obj = {
    id: trnWiz.id, name: trnWiz.name, date: trnWiz.date, location: trnWiz.location,
    teamId: trnWiz.teamId, teamName: team ? team.name : '',
    matchType: trnWiz.matchType || '8v8',
    trainer: trnWiz.trainer || '', responsible: trnWiz.responsible || '', squad,
  };
  const arr = getTournaments();
  const idx = arr.findIndex(t => t.id === obj.id);
  if (idx >= 0) arr[idx] = obj; else arr.push(obj);
  saveTournaments(arr);
  currentTournament = obj; trnWiz = null;
  go('tournament');
}
function renderTournamentNew() {
  if (!trnWiz) return '<div class="content"><p>Geen wizard.</p></div>';
  const titles = { 1: 'Info', 2: 'Selectie' };
  const pills = [1, 2].map(n => `<div class="step-pill ${trnWiz.step===n?'on':trnWiz.step>n?'done':''}"></div>`).join('');
  const body = trnWiz.step === 1 ? renderTrnStep1() : renderTrnStep2();
  return `<div class="hdr"><button class="back" onclick="${trnWiz.step===1 ? 'trnWizLeave()' : 'trnWizBack()'}">‹</button><h1>${trnWiz.isNew ? 'Nieuw tornooi' : 'Tornooi bewerken'} · ${titles[trnWiz.step]}</h1></div>
    <div class="steps">${pills}</div>
    <div class="content">${body}</div>`;
}
function renderTrnStep1() {
  const teams = getTeamsV2();
  const teamSel = teams.length
    ? `<select id="trn-team-sel" onchange="trnWizTeamChange()">${teams.map(t => `<option value="${t.id}" ${trnWiz.teamId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select>`
    : `<div style="font-size:14px;color:var(--txt2);padding:6px 0">Nog geen ploegen. <a onclick="go('teams')" style="color:var(--grn);font-weight:700;cursor:pointer">Maak eerst een ploeg aan →</a></div>`;
  const selectedTeam = teamById(trnWiz.teamId) || (teams.length ? teams[0] : null);
  const teamTrainers = selectedTeam ? (selectedTeam.trainers || []).filter(tr => tr.name) : [];
  const trainerOpts = teamTrainers.map(tr => `<option value="${esc(tr.name)}" ${!trnWiz.trainerIsOther&&trnWiz.trainer===tr.name?'selected':''}>${esc(tr.name)}</option>`).join('');
  return `<div class="card">
    <div class="fg"><label>Naam van het tornooi</label><input id="trn-name" type="text" placeholder="bv. Paastornooi Gent" value="${esc(trnWiz.name)}" autocomplete="off"></div>
    <div class="fg"><label>Ploeg</label>${teamSel}</div>
    <div class="fg"><label>Datum</label><input id="trn-date" type="date" value="${esc(trnWiz.date)}"></div>
    <div class="fg"><label>Locatie</label><input id="trn-location" type="text" placeholder="bv. Sportpark Gent" value="${esc(trnWiz.location)}" autocomplete="off"></div>
    <div class="fg"><label>Type wedstrijd</label><select id="trn-matchtype">${['3v3','5v5','8v8','11v11'].map(t=>`<option value="${t}" ${(trnWiz.matchType||'8v8')===t?'selected':''}>${t.replace('v',' tegen ')}</option>`).join('')}</select></div>
    <div class="fg"><label>Trainer</label>
      <select id="trn-trainer-sel" onchange="trnTrainerSelChange(this.value)">
        ${trainerOpts}
        <option value="_other" ${trnWiz.trainerIsOther?'selected':''}>Andere trainer…</option>
      </select></div>
    <div class="fg" id="trn-trainer-other-fg" style="${trnWiz.trainerIsOther?'':'display:none'}">
      <label>Naam trainer</label>
      <input id="trn-trainer-other" type="text" value="${esc(trnWiz.trainer||'')}" placeholder="Naam trainer" autocomplete="off">
    </div>
    <div class="fg"><label>Ploegverantwoordelijke (optioneel)</label>
      <input id="trn-responsible" type="text" value="${esc(trnWiz.responsible||'')}" placeholder="Naam (optioneel)" autocomplete="off">
    </div>
  </div>
  <button class="btn btn-green" onclick="trnWizNext()">Volgende → Selectie</button>
  <button class="btn btn-orgpale" onclick="saveTournamentWizStep1Only()" style="margin-top:8px">${icI(IC.calendar)} Opslaan zonder selectie</button>`;
}
function renderTrnStep2() {
  const team = teamById(trnWiz.teamId);
  const mee = trnWiz.pool.filter(p => p.sel === 'mee').length;
  const ab  = trnWiz.pool.filter(p => p.sel === 'absent').length;
  const selRow2 = p => `<div class="selrow">
    <input type="number" class="pn-inp" value="${esc(p.number)}" placeholder="?" onchange="setTrnPoolNum('${p.pid}',this.value)" inputmode="numeric" aria-label="Rugnummer">
    <div class="nm">${esc(p.name)}<small>${posDisplay(p) || '—'}</small></div>
    <div class="seg">
      <button class="${p.sel==='mee'?'basis':''}" onclick="setTrnSel('${p.pid}','mee')">Mee</button>
      <button class="${p.sel==='absent'?'absent':''}" onclick="setTrnSel('${p.pid}','absent')" title="Afwezig (onbeschikbaar/afgemeld)">✗</button>
    </div></div>`;
  return `
    <div class="card" style="display:flex;gap:10px;text-align:center;margin-bottom:12px">
      <div style="flex:1"><div style="font-size:22px;font-weight:900;color:var(--grn)">${mee}</div><div style="font-size:11px;color:var(--txt2)">MEE</div></div>
      ${ab ? `<div style="flex:1"><div style="font-size:22px;font-weight:900;color:var(--rd)">${ab}</div><div style="font-size:11px;color:var(--txt2)">AFWEZIG</div></div>` : ''}
    </div>
    <div class="sec">${esc(team ? team.name : 'Ploeg')}</div>
    <div style="font-size:12px;color:var(--txt2);padding:0 2px 6px"><b>Mee</b> = in de tornooiselectie, <b style="color:var(--rd)">✗ afwezig</b> = onbeschikbaar/afgemeld. <b>Niets aanduiden</b> = niet geselecteerd (niet overwogen).</div>
    <div class="card">${trnWiz.pool.length ? trnWiz.pool.map(selRow2).join('') : '<p style="color:var(--txt2);font-size:14px">Deze ploeg heeft geen spelers.</p>'}</div>
    <div class="wiz-nav">
      <button class="btn btn-gray" onclick="trnWizBack()">← Vorige</button>
      <button class="btn btn-green" onclick="saveTournamentWiz()">${icI(IC.check)}Tornooi opslaan</button>
    </div>`;
}

// ----- Tornooimatch wizard -----
function addTournamentMatch(trnId) {
  if (!canManage()) return;
  const t = tournamentById(trnId); if (!t) return;
  const team = teamById(t.teamId);
  const squad = t.squad || {};
  // Nieuw formaat: squad.players; oud formaat: squad.base/bench/absent
  const allSquadPlayers = squad.players
    ? squad.players.filter(s => s.sel !== 'absent')
    : [...(squad.base||[]), ...(squad.bench||[])];
  const totalSquad = squad.players
    ? squad.players.length
    : (squad.base||[]).length + (squad.bench||[]).length + (squad.absent||[]).length;
  if (!totalSquad) {
    openModal(`<h3>Selectie ontbreekt</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Geef eerst een selectie in voor dit tornooi voor je wedstrijden toevoegt.</p>
      <button class="btn btn-green" onclick="closeModal();editTournament('${trnId}')">${icI(IC.edit)} Selectie ingeven</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  // Bepaal het aantal basisspelers op basis van matchType (bv. 8v8 → 8 basis)
  const matchType = t.matchType || '8v8';
  const numStarters = parseInt(matchType) || 8;
  const pool = allSquadPlayers.map((s, i) => ({
    pid: uid(), srcId: s.srcId, srcGlobalId: s.globalId || null, name: s.name, number: s.number, pos: s.pos, side: s.side || '',
    fromName: team ? team.name : '', guest: false,
    sel: i < numStarters ? 'basis' : 'bank', slot: null,
  }));
  const now = new Date();
  wiz = {
    step: 1, trnMode: true, tournamentId: trnId,
    teamId: t.teamId, teamNameFallback: team ? team.name : '',
    opponent: '', date: t.date || now.toISOString().split('T')[0],
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    location: t.location || 'Thuis', matchType,
    periodKey: 'delen', quarterDuration: 20, numQuarters: 1,
    competition: 'Tornooi', matchday: '', referee: '', jersey: '', venue: '',
    trainer: t.trainer || '', responsible: t.responsible || '', trainerIsOther: false,
    pool, poolTeamId: t.teamId, formationIndex: 0, selPlace: null,
  };
  go('new');
}
async function cloneTournamentMatch(matchId, trnId) {
  if (!canManage()) return;
  const src = await dbGet(matchId);
  if (!src) return;
  const t = tournamentById(trnId); if (!t) return;
  const team = teamById(t.teamId);
  const now = new Date();
  const matchType = src.matchType || t.matchType || '8v8';
  const fi = Math.max(0, (FORMATIONS[matchType] || []).findIndex(f => f.name === src.formation));
  const pool = (src.players || []).map(p => ({
    pid: uid(),
    srcId: p.rosterId || null,
    srcGlobalId: p.globalId || null,
    name: p.name,
    number: p.number,
    pos: p.line || p.pos || '',
    side: p.side || '',
    fromName: src.teamName || (team ? team.name : ''),
    guest: !!p.guest,
    sel: p.starting ? 'basis' : 'bank',
    slot: null,
    _x: p.x, _y: p.y,
  }));
  wiz = {
    step: 1, trnMode: true, tournamentId: trnId,
    teamId: t.teamId, teamNameFallback: team ? team.name : '',
    opponent: '',
    date: t.date || now.toISOString().split('T')[0],
    time: src.time || `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    location: src.location || t.location || 'Thuis',
    matchType,
    periodKey: src.periodKey || 'delen',
    quarterDuration: src.quarterDuration || 20,
    numQuarters: src.numQuarters || 1,
    competition: src.competition || 'Tornooi',
    matchday: '', referee: src.referee || '', jersey: src.jersey || '',
    venue: '', trainer: src.trainer || t.trainer || '',
    responsible: src.responsible || t.responsible || '',
    trainerIsOther: false,
    pool, poolTeamId: t.teamId, formationIndex: fi, selPlace: null,
  };
  // Basisspelers terugplaatsen op hun formatie-slot (x/y-match), zoals editMatchWizard — anders
  // blijft de opstelling leeg bij "Gebruik als template".
  const cloneForm = FORMATIONS[matchType] && FORMATIONS[matchType][fi];
  if (cloneForm) wiz.pool.filter(p => p.sel === 'basis').forEach(p => { const idx = cloneForm.slots.findIndex(s => s.x === p._x && s.y === p._y); p.slot = idx >= 0 ? idx : null; });
  go('new');
}
function renderTrnMatchStep1() {
  return `<div class="card">
    <div class="fg"><label>Tegenstander</label><input id="n-opp" type="text" placeholder="Naam tegenstander..." autocomplete="off" value="${esc(wiz.opponent)}"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Datum</label><input id="n-date" type="date" value="${wiz.date}"></div>
      <div class="fg"><label>Startuur</label><input id="n-time" type="time" value="${wiz.time}"></div>
    </div>
    <div class="fg"><label>Format</label>
      <select id="n-type" onchange="trnWizTypeChange()">
        ${['3v3','5v5','8v8','11v11'].map(tp => `<option value="${tp}" ${wiz.matchType===tp?'selected':''}>${tp.replace('v',' tegen ')}</option>`).join('')}
      </select></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Aantal blokken</label>
        <select id="n-pt" onchange="onPeriodChange()">${['helften','delen','kwarten'].map(k => `<option value="${k}" ${wiz.periodKey===k?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
      <div class="fg"><label>Duur van een blok</label>
        <select id="n-qd" onchange="onDurChange('n-qd','n-qd-custom')">${durOptsHtml(wiz.periodKey, wiz.quarterDuration)}</select>
        <input id="n-qd-custom" type="number" min="1" max="99" placeholder="min." style="margin-top:6px;display:none;width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;color:var(--txt);background:var(--card);-webkit-appearance:none" value=""></div>
    </div>
  </div>
  <button class="btn btn-green" onclick="trnMatchNext()">Volgende → Selectie</button>
  <button class="btn btn-orgpale" onclick="finishStep1Only()" style="margin-top:8px">${icI(IC.calendar)} Plannen zonder opstelling</button>`;
}
function trnWizTypeChange() {
  wiz.matchType = document.getElementById('n-type').value;
  wiz.formationIndex = 0;
  wiz.pool.forEach(p => p.slot = null);
}
function trnMatchNext() {
  wiz.opponent = (document.getElementById('n-opp')?.value || '').trim();
  wiz.date = document.getElementById('n-date')?.value || wiz.date;
  wiz.time = document.getElementById('n-time')?.value || wiz.time;
  wiz.matchType = document.getElementById('n-type')?.value || wiz.matchType;
  const pt = document.getElementById('n-pt'); if (pt) wiz.periodKey = pt.value;
  wiz.quarterDuration = readDur('n-qd', 'n-qd-custom', wiz.quarterDuration);
  if (!wiz.opponent) { showToast('Vul de naam van de tegenstander in.', 'err'); return; }
  wiz.step = 2; render();
}

