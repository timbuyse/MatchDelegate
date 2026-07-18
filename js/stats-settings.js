// ===================== SEIZOENSSTATISTIEKEN =====================
let statsFilter = 'all', seasonFilter = null;
function setStatsFilter(v) { statsFilter = v; loadStats(); }
function setSeasonFilter(v) { seasonFilter = v; loadStats(); }
// Seizoen van een wedstrijd (Belgisch voetbalseizoen: juli–juni).
function seasonOf(m) {
  const d = m.date ? new Date(m.date + 'T00:00:00') : new Date(m.createdAt);
  const y = d.getFullYear(), start = d.getMonth() >= 6 ? y : y - 1;
  return `${start}/${start + 1}`;
}
async function loadStats() {
  const all = await dbAll();
  const el = document.getElementById('stats-content');
  if (!el) return;
  const teams = [...new Set(all.map(m => m.teamName).filter(Boolean))].sort();
  const seasons = [...new Set(all.map(seasonOf))].sort().reverse();
  // De lokale matches-store is niet per ploeg gescheiden (zie cleanupOrphanMatches in core.js) —
  // dus ook binnen een ploeg altijd expliciet filteren op de actieve ploeg, anders lekt de cache
  // van een andere ploeg op dit toestel mee in de statistieken.
  if (cloudReady) statsFilter = teamNames[activeTeamId] || 'all';
  if (statsFilter !== 'all' && !teams.includes(statsFilter)) statsFilter = 'all';
  // Geen "alle seizoenen" meer: spelers uit oudere wedstrijden (zonder rosterId, gematcht op
  // naam) en nieuwere wedstrijden (mét rosterId) kwamen anders dubbel in de lijst terecht, zie
  // getp() hieronder. Standaard het meest recente seizoen met een wedstrijd.
  if (!seasonFilter || !seasons.includes(seasonFilter)) seasonFilter = seasons[0] || null;
  // Tornooiwedstrijden tellen niet mee in de algemene statistieken (zelfde aanpak als de "Wedstrijden"-lijst).
  const list = all.filter(m => m.status === 'done' && !m.tournamentId && (statsFilter === 'all' || m.teamName === statsFilter) && seasonOf(m) === seasonFilter);
  const filterBar = `${(!cloudReady && teams.length) ? `<div class="filterbar"><select onchange="setStatsFilter(this.value)">
      <option value="all" ${statsFilter==='all'?'selected':''}>Alle ploegen</option>
      ${teams.map(t => `<option value="${esc(t)}" ${statsFilter===t?'selected':''}>${esc(t)}</option>`).join('')}
    </select></div>` : ''}${seasons.length > 1 ? `<div class="filterbar"><select onchange="setSeasonFilter(this.value)">
      ${seasons.map(s => `<option value="${s}" ${seasonFilter===s?'selected':''}>Seizoen ${s}</option>`).join('')}
    </select></div>` : ''}`;
  if (!list.length) { el.innerHTML = filterBar + `<div class="empty"><div class="ei">${IC.chart}</div><p>Nog geen wedstrijden.</p></div>`; return; }
  // Oudste eerst verwerken, zodat de weergavenaam van een speler steeds de meest recente is (bv. na een naamscorrectie).
  const sortedList = [...list].sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0));
  let w = 0, d = 0, l = 0, gf = 0, ga = 0, cleanSheets = 0;
  const pl = {};
  // Groepeert op rosterId wanneer beschikbaar (stabiel over naamswijzigingen heen), anders op naam (oude matches, gasten).
  const getp = (rosterId, name, num) => {
    const nm = (name || 'Speler').trim();
    const k = rosterId || nm;
    const r = pl[k] || (pl[k] = { name: nm, rosterId: rosterId || null, number: num || '', goals: 0, assists: 0, ms: 0, yc: 0, rc: 0, mp: 0, cs: 0, squad: 0, absent: 0, lines: {} });
    if (name) r.name = nm;
    if (num) r.number = num;
    return r;
  };
  const getpById = (m, id) => { const p = m.players.find(x => x.id === id); return p ? getp(p.rosterId, p.name, p.number) : getp(null, pName(m, id)); };
  for (const m of sortedList) {
    gf += m.scoreUs; ga += m.scoreThem;
    if (m.scoreUs > m.scoreThem) w++; else if (m.scoreUs < m.scoreThem) l++; else d++;
    if (m.scoreThem === 0) cleanSheets++;
    const mins = calcMinutes(m);
    for (const p of (m.players || [])) {
      const r = getp(p.rosterId, p.name, p.number); const ms = mins[p.id] ? mins[p.id].ms : 0;
      r.squad++;
      if (ms > 0) { r.mp++; r.lines[p.line] = (r.lines[p.line] || 0) + 1; }
      r.ms += ms;
      // keeperByQ (per-kwart bijgehouden, zie syncKeeper()) i.p.v. de eind-positie: anders krijgt
      // bij een keeperwissel tijdens de wedstrijd de verkeerde speler het clean-sheet-krediet.
      const wasKeeper = m.keeperByQ && Object.keys(m.keeperByQ).length ? wasKeeperAtAll(m, p.id) : p.line === 'Doel';
      if (ms > 0 && wasKeeper && m.scoreThem === 0) r.cs++;  // clean sheet voor de keeper
    }
    for (const a of (m.absentPlayers || [])) { const ab = typeof a === 'string' ? { name: a, rosterId: null } : a; const r = getp(ab.rosterId, ab.name); r.absent++; }
    for (const e of m.events) {
      if (e.type === 'goal_us' && e.playerId) { getpById(m, e.playerId).goals++; if (e.assistId) getpById(m, e.assistId).assists++; }
      if (e.type === 'penalty_us' && e.scored && e.playerId) getpById(m, e.playerId).goals++;  // strafschopdoelpunt telt mee
      if (e.type === 'yellow_card' && e.playerId) getpById(m, e.playerId).yc++;
      if (e.type === 'red_card' && e.playerId) getpById(m, e.playerId).rc++;
    }
  }
  const players = Object.values(pl);
  const pDetTeam = statsFilter !== 'all' ? statsFilter : '';
  const prow = p => `style="cursor:pointer" onclick="openPlayerDetail('${jsq(p.name)}','${jsq(pDetTeam)}','${jsq(p.rosterId || '')}')"`;
  const topList = (arr, val, unit) => arr.length ? arr.map((p, i) => `<div class="stat-row" ${prow(p)}><span class="stat-rank">${i+1}</span><span style="flex:1">${esc(p.name)}</span><span style="font-weight:800">${val(p)}${unit}</span></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">—</p>';
  const scorers = players.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 10);
  const assisters = players.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 10);
  const minutes = players.filter(p => p.ms > 0).sort((a, b) => b.ms - a.ms).slice(0, 15);
  const fairplay = players.filter(p => p.mp > 0).sort((a, b) => (a.ms / a.mp) - (b.ms / b.mp)).slice(0, 12);
  const keepers = players.filter(p => p.cs > 0).sort((a, b) => b.cs - a.cs);
  const carded = players.filter(p => p.yc || p.rc).sort((a, b) => (b.yc + b.rc * 2) - (a.yc + a.rc * 2));
  const posList = players.filter(p => p.mp > 0 && Object.keys(p.lines).length).sort((a, b) => b.mp - a.mp);
  const anyAbsent = players.some(p => p.absent);
  const attend = players.filter(p => (p.squad + p.absent) > 0).sort((a, b) => (b.squad / (b.squad + b.absent)) - (a.squad / (a.squad + a.absent)) || b.squad - a.squad);
  el.innerHTML = filterBar + `
    <div class="card">
      <div class="stat-big" style="margin-bottom:10px">
        <div class="stat-box"><div class="v">${list.length}</div><div class="l">Gespeeld</div></div>
        <div class="stat-box"><div class="v" style="color:var(--grn)">${w}</div><div class="l">Winst</div></div>
        <div class="stat-box"><div class="v">${d}</div><div class="l">Gelijk</div></div>
        <div class="stat-box"><div class="v" style="color:var(--rd)">${l}</div><div class="l">Verlies</div></div>
      </div>
      <div class="stat-big">
        <div class="stat-box"><div class="v">${gf}</div><div class="l">Doelpunten voor</div></div>
        <div class="stat-box"><div class="v">${ga}</div><div class="l">Doelpunten tegen</div></div>
        <div class="stat-box"><div class="v">${gf-ga>=0?'+':''}${gf-ga}</div><div class="l">Saldo</div></div>
      </div>
    </div>
    <div class="sec">${icI(IC.ball)} Topschutters</div><div class="card">${topList(scorers, p => p.goals, '')}</div>
    <div class="sec">${icI(IC.assist)} Meeste assists</div><div class="card">${topList(assisters, p => p.assists, '')}</div>
    <div class="sec">${icI(IC.timer)} Meeste speelminuten</div><div class="card">${minutes.length ? minutes.map((p,i)=>`<div class="stat-row" ${prow(p)}><span class="stat-rank">${i+1}</span><span style="flex:1">${esc(p.name)}<small style="color:var(--txt2);display:block">${p.mp} ${p.mp===1?'wedstrijd':'wedstrijden'} · gem. ${Math.round(p.ms/p.mp/60000)}'/match</small></span><span style="font-weight:800">${Math.floor(p.ms/60000)}'</span></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">—</p>'}</div>
    <div class="sec">${icI(IC.balance)} Fair-play · minste speeltijd</div><div class="card"><p style="font-size:12px;color:var(--txt2);margin-bottom:8px">Gesorteerd op laagste gemiddelde speeltijd per wedstrijd — zo zie je snel wie meer speelkansen verdient.</p>${fairplay.length ? fairplay.map(p=>`<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span style="color:var(--txt2);font-size:13px">${p.mp} wd</span><span style="font-weight:800;min-width:64px;text-align:right">${Math.round(p.ms/p.mp/60000)}'/match</span></div>`).join('') : '<p style="color:var(--txt2);font-size:14px">—</p>'}</div>
    <div class="sec">${icI(IC.save)} Clean sheets</div><div class="card"><div class="stat-row"><span style="flex:1">Ploeg (geen tegendoel)</span><span style="font-weight:800">${cleanSheets}/${list.length}</span></div>${keepers.map(p=>`<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span style="font-weight:800">${p.cs}</span></div>`).join('')}</div>
    ${carded.length ? `<div class="sec">${icI(IC.cardY)} Kaarten</div><div class="card">${carded.map(p=>`<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span>${p.yc?icI(IC.cardY).repeat(p.yc):''}${p.rc?icI(IC.cardR).repeat(p.rc):''}</span></div>`).join('')}</div>` : ''}
    ${posList.length ? `<div class="sec">${icI(IC.compass)} Posities <span style="font-weight:400;text-transform:none;color:var(--txt2)">(hoe vaak per linie)</span></div><div class="card">${posList.map(p=>{const parts=Object.entries(p.lines).sort((a,b)=>b[1]-a[1]).map(([l,c])=>`${LINE_SHORT[l]||l}×${c}`).join(' · ');return `<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span style="color:var(--txt2);font-size:13px">${parts}</span></div>`;}).join('')}</div>` : ''}
    ${anyAbsent ? `<div class="sec">${icI(IC.clipboard)} Aanwezigheid <span style="font-weight:400;text-transform:none;color:var(--txt2)">(in selectie / totaal)</span></div><div class="card">${attend.map(p=>{const tot=p.squad+p.absent;const pct=tot?Math.round(p.squad/tot*100):0;return `<div class="stat-row" ${prow(p)}><span style="flex:1">${esc(p.name)}</span><span style="color:var(--txt2);font-size:13px">${p.squad}/${tot}</span><span style="font-weight:800;min-width:46px;text-align:right${pct<60?';color:var(--org)':''}">${pct}%</span></div>`;}).join('')}</div>` : ''}`;
}

// ===================== SPELERSDETAIL =====================
let playerDetailName = null, playerDetailTeamName = null, playerDetailRosterId = null, playerDetailSeason = null, _playerDetailFrom = 'stats';
function openPlayerDetail(name, teamName, rosterId) {
  name = (name || '').trim();
  if (!name) return;
  playerDetailName = name; playerDetailTeamName = teamName || null; playerDetailRosterId = rosterId || null; playerDetailSeason = null; _playerDetailFrom = view;
  go('playerDetail');
}
function setPlayerDetailSeason(v) { playerDetailSeason = v; loadPlayerDetail(); }
async function loadPlayerDetail() {
  const all = await dbAll();
  const el = document.getElementById('player-detail-content');
  if (!el) return;
  const name = (playerDetailName || '').trim();
  const rosterId = playerDetailRosterId || null;
  const inTeam = m => !playerDetailTeamName || m.teamName === playerDetailTeamName;
  // Matcht bij voorkeur op het stabiele ploegrooster-id; oudere matches zonder rosterId vallen terug op naam.
  const findPlayer = m => {
    const players = m.players || [];
    if (rosterId) {
      const byId = players.find(p => p.rosterId === rosterId);
      if (byId) return byId;
    }
    return players.find(p => (p.name || '').trim() === name);
  };
  // Tornooiwedstrijden tellen niet mee bij gespeeld/doelpunten/etc. — die krijgen hieronder een apart "Tornooien"-kadertje.
  const allDone = all.filter(m => m.status === 'done' && !m.tournamentId && inTeam(m) && findPlayer(m));
  // globalId (blijvende speleridentiteit over ploegen heen, sinds de "Speler overzetten"-tool)
  // opzoeken via de eerste match waarin die al bewaard staat — voor het carrière-overzicht verderop.
  let resolvedGlobalId = null;
  for (const m of allDone) { const p = findPlayer(m); if (p && p.globalId) { resolvedGlobalId = p.globalId; break; } }
  const seasons = [...new Set(allDone.map(seasonOf))].sort().reverse();
  // Geen "alle seizoenen" meer, zie loadStats() hierboven voor de reden (dubbele spelers
  // door rosterId- vs. naam-matching tussen oude en nieuwe wedstrijden). Standaard het
  // meest recente seizoen waarin deze speler een wedstrijd speelde.
  if (!playerDetailSeason || !seasons.includes(playerDetailSeason)) {
    playerDetailSeason = seasons[0] || null;
  }
  const filterBar = allDone.length ? `<div class="filterbar"><select onchange="setPlayerDetailSeason(this.value)">
      ${seasons.map(s => `<option value="${s}" ${playerDetailSeason===s?'selected':''}>Seizoen ${s}</option>`).join('')}
    </select></div>` : '';
  const doneList = allDone.filter(m => seasonOf(m) === playerDetailSeason);
  doneList.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
  if (!doneList.length) { el.innerHTML = filterBar + `<div class="empty"><div class="ei">${IC.chart}</div><p>Nog geen gespeelde wedstrijden voor ${esc(name)}${playerDetailSeason?(' in seizoen '+playerDetailSeason):''}.</p></div>`; return; }
  let goals = 0, assists = 0, ms = 0, mp = 0, yc = 0, rc = 0, cs = 0, keeperApps = 0, squad = 0, absent = 0, number = '', pos = '';
  const rows = [];
  for (const m of doneList) {
    const pl = findPlayer(m);
    if (!pl) continue;
    if (pl.number) number = pl.number;
    if (pl.line) pos = pl.line;
    const mins = calcMinutes(m);
    const pms = mins[pl.id] ? mins[pl.id].ms : 0;
    let g = 0, a = 0, y = 0, r = 0;
    for (const e of m.events) {
      if (e.type === 'goal_us' && e.playerId === pl.id) g++;
      if (e.type === 'penalty_us' && e.scored && e.playerId === pl.id) g++;
      if (e.assistId === pl.id) a++;
      if (e.type === 'yellow_card' && e.playerId === pl.id) y++;
      if (e.type === 'red_card' && e.playerId === pl.id) r++;
    }
    squad++;
    // keeperByQ i.p.v. eind-positie — zie toelichting bij wasKeeperAtAll().
    const wasKeeper = m.keeperByQ && Object.keys(m.keeperByQ).length ? wasKeeperAtAll(m, pl.id) : pl.line === 'Doel';
    if (pms > 0) { mp++; ms += pms; if (wasKeeper) { keeperApps++; if (m.scoreThem === 0) cs++; } }
    goals += g; assists += a; yc += y; rc += r;
    rows.push({ m, pms, g, a, y, r });
  }
  for (const m of all.filter(m2 => m2.status === 'done' && !m2.tournamentId && inTeam(m2) && seasonOf(m2) === playerDetailSeason)) {
    const wasAbsent = (m.absentPlayers || []).some(a => { const ab = typeof a === 'string' ? { name: a, rosterId: null } : a; return rosterId ? ab.rosterId === rosterId : (ab.name || '').trim() === name; });
    if (wasAbsent) absent++;
  }
  const pct = (squad + absent) ? Math.round(squad / (squad + absent) * 100) : null;
  // Aparte telling: in hoeveel tornooien de speler geselecteerd stond (aantal wedstrijden binnen dat tornooi is niet relevant).
  const inTournamentSquad = t => {
    const squad = t.squad || {};
    const pool = squad.players ? squad.players.filter(s => s.sel !== 'absent') : [...(squad.base || []), ...(squad.bench || [])];
    return pool.some(s => rosterId ? s.srcId === rosterId : (s.name || '').trim() === name);
  };
  const tInTeam = t => { if (!playerDetailTeamName) return true; const tm = teamById(t.teamId); return (tm && tm.name === playerDetailTeamName) || t.teamName === playerDetailTeamName; };
  const tournamentCount = getTournaments().filter(t => tInTeam(t) && seasonOf(t) === playerDetailSeason && inTournamentSquad(t)).length;
  // Gastoptredens bij ANDERE ploegen opsporen — enkel via het stabiele rosterId (dat blijft
  // ploeg-overschrijdend hetzelfde bij een echte gastbeurt, zie addGuestsModal in wizard-prep.js);
  // op naam matchen zou spelers met dezelfde naam bij onverwante ploegen foutief kunnen samenvoegen.
  // Enkel wedstrijden van ploegen die dit toestel al lokaal kent zijn hier zichtbaar.
  const guestElsewhere = {};
  if (rosterId && playerDetailTeamName) {
    for (const m of all) {
      if (m.status !== 'done' || m.tournamentId || m.teamName === playerDetailTeamName) continue;
      if (seasonOf(m) !== playerDetailSeason) continue;
      if ((m.players || []).some(p => p.rosterId === rosterId)) guestElsewhere[m.teamName] = (guestElsewhere[m.teamName] || 0) + 1;
    }
  }
  const guestEntries = Object.entries(guestElsewhere).sort((a, b) => b[1] - a[1]);
  // Carrière bij eerdere ploegen (na een formele overzetting via de eigenaarstool): matcht op
  // globalId, over ALLE seizoenen heen (i.t.t. guestElsewhere hierboven, dat bewust wél per
  // seizoen filtert — een overzetting hoort juist bij een seizoensovergang). Enkel wedstrijden
  // van na de invoering van globalId (geen retroactieve koppeling) en enkel ploegen die dit
  // toestel al lokaal kent zijn hier zichtbaar.
  const careerElsewhere = {};
  if (resolvedGlobalId && playerDetailTeamName) {
    for (const m of all) {
      if (m.status !== 'done' || m.tournamentId || m.teamName === playerDetailTeamName) continue;
      const p = (m.players || []).find(x => x.globalId === resolvedGlobalId);
      if (!p) continue;
      const mins = calcMinutes(m);
      if (!(mins[p.id] && mins[p.id].ms > 0)) continue;
      const c = careerElsewhere[m.teamName] || (careerElsewhere[m.teamName] = { mp: 0, goals: 0, assists: 0 });
      c.mp++;
      for (const e of m.events) {
        if ((e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored)) && e.playerId === p.id) c.goals++;
        if (e.assistId === p.id) c.assists++;
      }
    }
  }
  const careerEntries = Object.entries(careerElsewhere).sort((a, b) => b[1].mp - a[1].mp);
  el.innerHTML = filterBar + `
    <div class="card">
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:20px;font-weight:800">${esc(name)}</div>
        <div style="font-size:13px;color:var(--txt2)">${number ? ('Rugnr. ' + esc(number) + (pos ? ' · ' : '')) : ''}${pos ? esc(pos) : ''}</div>
        ${playerDetailTeamName ? `<div style="font-size:12px;color:var(--txt2);margin-top:6px">Statistieken voor wedstrijden bij <b>${esc(playerDetailTeamName)}</b></div>` : ''}
      </div>
      <div class="stat-big">
        <div class="stat-box"><div class="v">${mp}</div><div class="l">Gespeeld</div></div>
        <div class="stat-box"><div class="v">${goals}</div><div class="l">Doelpunten</div></div>
        <div class="stat-box"><div class="v">${assists}</div><div class="l">Assists</div></div>
      </div>
      <div class="stat-big" style="margin-top:10px">
        <div class="stat-box"><div class="v">${Math.floor(ms / 60000)}'</div><div class="l">Speeltijd</div></div>
        <div class="stat-box"><div class="v">${mp ? Math.round(ms / mp / 60000) : 0}'</div><div class="l">Gem./match</div></div>
        <div class="stat-box"><div class="v">${pct != null ? pct + '%' : '–'}</div><div class="l">Aanwezig</div></div>
      </div>
    </div>
    ${tournamentCount ? `<div class="sec">${icI(IC.medal)} Tornooien</div><div class="card"><div class="stat-row"><span style="flex:1">Geselecteerd voor</span><span style="font-weight:800">${tournamentCount} ${tournamentCount===1?'tornooi':'tornooien'}</span></div></div>` : ''}
    ${guestEntries.length ? `<div class="sec">${icI(IC.link)} Ook gastspeler bij</div><div class="card">${guestEntries.map(([t, c]) => `<div class="stat-row"><span style="flex:1">${esc(t)}</span><span style="font-weight:800">${c} ${c===1?'wedstrijd':'wedstrijden'}</span></div>`).join('')}</div>` : ''}
    ${careerEntries.length ? `<div class="sec">${icI(IC.swap)} Carrière — eerder bij</div><div class="card">${careerEntries.map(([t, c]) => `<div class="stat-row"><span style="flex:1">${esc(t)}</span><span style="color:var(--txt2);font-size:13px">${c.mp} ${c.mp===1?'wedstrijd':'wedstrijden'}${c.goals?` · ${c.goals} ${icI(IC.ball)}`:''}${c.assists?` · ${c.assists} ${icI(IC.assist)}`:''}</span></div>`).join('')}</div>` : ''}
    ${(yc || rc) ? `<div class="sec">${icI(IC.cardY)} Kaarten</div><div class="card"><div class="stat-row"><span style="flex:1">Gele kaarten</span><span style="font-weight:800">${yc}</span></div><div class="stat-row"><span style="flex:1">Rode kaarten</span><span style="font-weight:800">${rc}</span></div></div>` : ''}
    ${keeperApps ? `<div class="sec">${icI(IC.save)} Als doelman</div><div class="card"><div class="stat-row"><span style="flex:1">Wedstrijden in doel</span><span style="font-weight:800">${keeperApps}</span></div><div class="stat-row"><span style="flex:1">Clean sheets</span><span style="font-weight:800">${cs}</span></div></div>` : ''}
    <div class="sec">${icI(IC.ball)} Wedstrijden</div>
    <div class="card">${rows.map(r => `<div class="stat-row" style="cursor:pointer" onclick="go('detail','${r.m.id}')">
      <span style="flex:1">
        <b style="font-size:14px">${esc(matchTitle(r.m))}</b>
        <small style="color:var(--txt2);display:block">${matchWhen(r.m)} · ${scoreTxt(r.m)}${r.g ? ` · ${icI(IC.goal)}×${r.g}` : ''}${r.a ? ` · ${icI(IC.assist)}×${r.a}` : ''}${r.y ? ` · ${icI(IC.cardY).repeat(r.y)}` : ''}${r.r ? ` · ${icI(IC.cardR).repeat(r.r)}` : ''}</small>
      </span>
      <span style="font-weight:800">${r.pms > 0 ? Math.floor(r.pms / 60000) + "'" : '–'}</span>
    </div>`).join('')}</div>`;
}

// ===================== SETUP / SETTINGS (club-branding) =====================
function renderSettings(isFirst) {
  return `
  <div class="hdr"><button class="back" onclick="go(_settingsFrom||'home')">‹</button><h1>Instellingen</h1></div>
  <div class="content">
    ${(cloudReady && activeTeamId && isAdmin) ? `<p style="font-size:12px;color:var(--txt2);margin-bottom:14px">Ploeg uitnodigen, leden beheren of verwijderen? Dat doe je via de <b>Beheer</b>-knop.</p>` : ''}
    <div class="sec">Weergave</div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px"><div style="flex:1"><b style="font-size:15px">${icI(IC.moon)} Donkere modus</b><div style="font-size:12px;color:var(--txt2)">Rustiger scherm, handig 's avonds.</div></div>
        <span class="start-chip ${darkOn()?'on':''}" onclick="toggleDark()">${darkOn()?'Aan':'Uit'}</span></div>
    </div>
    ${('Notification' in window) ? `<div class="sec">Meldingen</div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px"><div style="flex:1"><b style="font-size:15px">${icI(IC.bell)} Melding bij doelpunt</b><div style="font-size:12px;color:var(--txt2)">Ook als de app op de achtergrond staat. Op iPhone/iPad enkel als de app op je beginscherm staat (iOS 16.4+).</div></div>
        <span class="start-chip ${bgNotifOn()?'on':''}" onclick="toggleBgNotif()">${bgNotifOn()?'Aan':'Uit'}</span></div>
    </div>` : ''}
    ${currentUser ? `<div class="sec">Account</div>
    <div class="card">
      <p style="font-size:15px;font-weight:700;margin-bottom:2px">${esc(currentUser.displayName || (isGuest ? 'Gast' : currentUser.email))}</p>
      <p style="font-size:12px;color:var(--txt2);margin-bottom:12px">${isGuest ? 'Je kijkt mee als gast, zonder eigen account.' : esc(currentUser.email)}</p>
      <button class="btn btn-pale" onclick="confirmChangeName()">${icI(IC.edit)} Naam wijzigen</button>
      ${isGuest ? '' : `
      <button class="btn btn-pale" style="margin-top:8px" onclick="confirmChangeEmail()">${icI(IC.mail)} E-mailadres wijzigen</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="confirmChangePassword()">${icI(IC.lock)} Wachtwoord wijzigen</button>`}
      <button class="btn btn-gray" style="margin-top:8px" onclick="cloudLogout()">Afmelden</button>
      ${isGuest ? '' : `<button class="btn btn-red" style="margin-top:8px" onclick="confirmDeleteAccount()">Account verwijderen</button>`}
    </div>` : ''}
    <div class="sec">Over de app</div>
    <div class="card">
      <div class="stat-row"><span style="color:var(--txt2)">Versie</span><span style="font-weight:700">${APP_VERSION}</span></div>
      <button class="btn btn-pale" style="margin-top:10px" onclick="go('handleiding')">${icI(IC.clipboard)} Handleiding</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="reportProblem()">${icI(IC.mail)} Probleem melden</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="showPrivacyModal()">${icI(IC.shieldLock)} Privacyverklaring</button>
    </div>
    ${canManage() ? `<div class="sec">Back-up &amp; herstel</div>
    <div class="card">
      <p style="font-size:13px;color:var(--txt2);margin-bottom:12px">Maak een back-up van je wedstrijden of zet ze terug op een ander toestel.</p>
      ${(() => { const t = localStorage.getItem('voetbal_last_backup'); return `<p style="font-size:12px;color:${t?'var(--txt2)':'var(--org2)'};margin-bottom:10px">${t?('Laatste back-up: '+fmtDate(+t)):`${icI(IC.warn)} Nog geen back-up gemaakt.`}</p>`; })()}
      <button class="btn btn-pale" onclick="exportBackup()">${icI(IC.download)} Back-up downloaden</button>
      <label class="file-btn" style="margin-top:8px">${icI(IC.upload)} Back-up herstellen of importeren<input type="file" accept="application/json,.json" onchange="importBackup(this)"></label>
    </div>` : ''}
  </div>`;
}

function showPrivacyModal() {
  openModal(`<h3>${icI(IC.shieldLock)} Privacyverklaring</h3>
    <div style="font-size:13px;color:var(--txt2);line-height:1.7;text-align:left;max-height:60vh;overflow-y:auto;padding-right:4px">
      <p style="margin-bottom:10px"><b style="color:var(--txt)">Verwerkingsverantwoordelijke</b><br>
      Tim Buyse<br>
      <a href="mailto:${FEEDBACK_EMAIL}" style="color:var(--grn)">Contacteer ons via e-mail</a></p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Doel van de app</b><br>
      Match Delegate is een interne beheersapp voor sportploegen. Ze laat beheerders toe wedstrijden op te volgen, speelminuten bij te houden en spelersgegevens te beheren. De app is uitsluitend bedoeld voor intern gebruik.</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Welke gegevens verwerken we?</b><br>
      • E-mailadres en naam van gebruikers (accounts)<br>
      • Spelersgegevens: naam, rugnummer, positie, notities<br>
      • Wedstrijdgegevens: speelminuten, doelpunten, assists, gele en rode kaarten<br>
      • Teamlidmaatschappen en rollen (beheerder / kijker)</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Rechtsgrond</b><br>
      Gegevens worden verwerkt op basis van toestemming. Gebruikers registreren zich vrijwillig en voegen zelf spelersgegevens toe.</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Bewaartermijn</b><br>
      Gegevens worden bewaard zolang een account actief is. Bij verwijdering van een account worden de gekoppelde gegevens gewist.</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Verwerkers</b><br>
      De app maakt gebruik van <b>Firebase</b> (Google LLC) voor authenticatie en gegevensopslag. Gegevens worden opgeslagen op servers van Google binnen de Europese Economische Ruimte. Google treedt op als verwerker conform de GDPR.</p>

      <p style="margin-bottom:10px"><b style="color:var(--txt)">Jouw rechten</b><br>
      Als betrokkene heb je het recht op inzage, correctie en verwijdering van je gegevens. Je kunt je account zelf verwijderen via Instellingen → Account verwijderen. Voor andere vragen of verzoeken kun je <a href="mailto:${FEEDBACK_EMAIL}" style="color:var(--grn)">contact opnemen via e-mail</a>.</p>

      <p style="margin-bottom:4px"><b style="color:var(--txt)">Klachten</b><br>
      Je hebt het recht een klacht in te dienen bij de Gegevensbeschermingsautoriteit (GBA): <a href="https://www.gegevensbeschermingsautoriteit.be" style="color:var(--grn)" target="_blank">gegevensbeschermingsautoriteit.be</a></p>
    </div>
    <button class="btn btn-gray" style="margin-top:14px" onclick="closeModal()">Sluiten</button>`);
}
// ===================== HANDLEIDING =====================
const HANDLEIDING_PAGINAS = [
  {
    titel: 'De app installeren',
    inhoud: `
      <p>Surf naar <a href="https://timbuyse.github.io/MatchDelegate/" target="_blank" style="color:var(--grn)">timbuyse.github.io/MatchDelegate</a> om de app te openen in je browser.</p>
      <div class="sec">iPhone / iPad (iOS)</div>
      <ol class="hdl-list">
        <li>Open de app in <b>Safari</b>.</li>
        <li>Tik onderaan op het <b>deelknopje</b> (vierkantje met pijl omhoog).</li>
        <li>Kies <b>'Zet op beginscherm'</b>.</li>
        <li>Tik op <b>'Voeg toe'</b>.</li>
      </ol>
      <div class="sec">Android</div>
      <ol class="hdl-list">
        <li>Open de app in <b>Chrome</b>.</li>
        <li>Tik rechtsboven op de <b>drie puntjes</b> (⋮).</li>
        <li>Kies <b>'Toevoegen aan startscherm'</b>.</li>
        <li>Tik op <b>'Toevoegen'</b>.</li>
      </ol>
      <p class="hdl-tip">Tip: door de app te installeren laad je ze sneller en heb je een betere ervaring dan via de browser.</p>
    `
  },
  {
    titel: 'Account aanmaken & aanmelden',
    img: 'handleiding/screenshots/01_aanmelden.png',
    inhoud: `
      <div class="sec">Account aanmaken</div>
      <ol class="hdl-list">
        <li>Open Match Delegate en tik op het tabblad <b>'Registreren'</b>.</li>
        <li>Vul je <b>e-mailadres</b> en een <b>wachtwoord</b> in.</li>
        <li>Tik op <b>'Registreren'</b>.</li>
        <li>Je bent meteen aangemeld.</li>
      </ol>
      <div class="sec">Aanmelden</div>
      <ol class="hdl-list">
        <li>Open Match Delegate — het <b>'Aanmelden'</b>-tabblad is standaard actief.</li>
        <li>Vul je <b>e-mailadres</b> en <b>wachtwoord</b> in.</li>
        <li>Tik op <b>'Aanmelden'</b>.</li>
      </ol>
      <p class="hdl-tip">Wachtwoord vergeten? Tik op <b>'Wachtwoord vergeten?'</b> en volg de instructies per e-mail.</p>
    `
  },
  {
    titel: 'Rollen in de app',
    inhoud: `
      <p>Match Delegate is opgebouwd rond <b>clubs</b>: een club groepeert meerdere ploegen. De rollen:</p>
      <div class="hdl-rol"><b>Kijker</b><span>Een ploeg volgen en live wedstrijden bekijken</span></div>
      <div class="hdl-rol"><b>Co-beheerder</b><span>Beheert één ploeg: wedstrijden aanmaken en live bijhouden, spelers beheren, leden uitnodigen (ook trainer/afgevaardigde genoemd)</span></div>
      <div class="hdl-rol"><b>Clubbeheerder</b><span>Beheert een volledige club: ploegen aanmaken en archiveren, trainers uitnodigen, spelers overzetten tussen ploegen en het clublogo instellen</span></div>
      <p style="margin-top:14px">Na registratie start je als <b>kijker</b>. Je kan daarna:</p>
      <ul class="hdl-list">
        <li>Een ploeg volgen via een uitnodiging (link, QR-code of code).</li>
        <li>Co-beheer aanvragen bij een co-beheerder van een ploeg die je al volgt.</li>
      </ul>
      <p style="margin-top:14px">Nieuwe ploegen worden niet meer los aangemaakt: dat doet de <b>clubbeheerder</b> binnen zijn club. Wil je een ploeg opstarten? Contacteer de clubbeheerder — die maakt de ploeg aan en nodigt jou uit als co-beheerder.</p>
      <p style="margin-top:14px">Daarnaast bestaan er twee bijzondere rollen die de meeste gebruikers nooit zelf zullen zijn:</p>
      <div class="hdl-rol"><b>Eigenaar</b><span>Systeembreed, één per app-installatie — maakt clubs aan en stelt clubbeheerders aan</span></div>
      <div class="hdl-rol"><b>Gast</b><span>Volgt enkel live wedstrijden via een gastlink, zonder eigen account</span></div>
    `
  },
  {
    titel: 'Als kijker',
    img: 'handleiding/screenshots/04_homescherm_kijker.png',
    inhoud: `
      <p>Als kijker zie je het homescherm met de tegels <b>Wedstrijden</b>, <b>Spelers</b>, <b>Tornooien</b> en <b>Statistieken</b>. Rechtsboven staat de knop <b>'Kijken'</b>. Je kan niets wijzigen.</p>
      <div class="sec">Een ploeg volgen</div>
      <p>De beheerder deelt een uitnodiging als <b>link</b>, <b>QR-code</b> of <b>code van 6 tekens</b> (letters en cijfers).</p>
      <ul class="hdl-list">
        <li><b>Via link:</b> tik op de link → tik op <b>'Ploeg vervoegen'</b>.</li>
        <li><b>Via QR-code:</b> scan de code → tik op <b>'Ploeg vervoegen'</b>.</li>
        <li><b>Via code:</b> tik op <b>'Ploeg bekijken via code'</b> → voer de code van 6 tekens in.</li>
      </ul>
      <div class="sec">Live wedstrijd bekijken</div>
      <ol class="hdl-list">
        <li>Ga naar <b>'Wedstrijden'</b> en tik op een lopende wedstrijd.</li>
        <li>Je ziet de score en alle events in real time.</li>
      </ol>
      <p class="hdl-tip">Match Delegate stuurt momenteel geen pushmeldingen als de app gesloten is. Houd de app open tijdens de wedstrijd om alles live mee te volgen.</p>
    `
  },
  {
    titel: 'Co-beheer aanvragen',
    img: 'handleiding/screenshots/13_cobeheer_aanvragen.png',
    inhoud: `
      <p>Ben je kijker en wil je wedstrijden kunnen beheren? Vraag co-beheer aan:</p>
      <ol class="hdl-list">
        <li>Tik rechtsboven op <b>'Kijken'</b>.</li>
        <li>Tik op <b>'Vraag co-beheer aan'</b>.</li>
        <li>De beheerder krijgt een melding en keurt je aanvraag goed of af.</li>
        <li>Zodra goedgekeurd, krijg je toegang als co-beheerder.</li>
      </ol>
      <p class="hdl-tip">Je kan enkel co-beheerder worden van een ploeg waarvan je al kijker bent.</p>
    `
  },
  {
    titel: 'Wedstrijd aanmaken',
    img: 'handleiding/screenshots/06_nieuwe_wedstrijd_stap1.png',
    inhoud: `
      <p>Tik op de grote blauwe knop <b>'+ Nieuwe wedstrijd'</b> op het homescherm. De wizard heeft 3 stappen:</p>
      <div class="sec">Stap 1 — Wedstrijd</div>
      <ul class="hdl-list">
        <li><b>Tegenstander</b>, <b>Datum</b> en <b>Startuur</b>.</li>
        <li><b>Thuis of uit</b>: kies Thuismatch of Uitmatch.</li>
        <li><b>Format</b>: bv. 8 tegen 8, 11 tegen 11.</li>
        <li><b>Aantal blokken</b>: bv. 4 kwarten, 2 helften.</li>
        <li><b>Duur van een blok</b>: speelduur in minuten.</li>
        <li>Optioneel: tik op <b>'+ Meer details'</b> voor scheidsrechter, locatie, enz.</li>
      </ul>
      <p class="hdl-tip">Wil je plannen zonder opstelling? Tik op <b>'Plannen zonder selectie'</b>.</p>
    `
  },
  {
    titel: 'Selectie & opstelling',
    img: 'handleiding/screenshots/07_selectie.png',
    img2: 'handleiding/screenshots/08_opstelling.png',
    inhoud: `
      <div class="sec">Stap 2 — Selectie</div>
      <p>Verdeel spelers per rol:</p>
      <ul class="hdl-list">
        <li><b style="color:#4caf50">Basis</b> — start in de basisopstelling.</li>
        <li><b style="color:#2196f3">Wissel</b> — wisselspeler.</li>
        <li><b style="color:#f44336">X</b> — niet geselecteerd.</li>
      </ul>
      <p>Niet in de lijst? Voeg toe via <b>'+ Losse speler'</b> of <b>'+ Speler van andere ploeg'</b>.</p>
      <div class="sec">Stap 3 — Opstelling</div>
      <p>Kies bovenaan een <b>formatie</b>. Tik een speler aan, dan een positie op het veld. Gebruik <b>'Auto-plaats'</b> om automatisch in te vullen.</p>
      <p>Tik op <b>'Nu starten'</b> om meteen te starten, of <b>'Plannen voor later'</b> om op te slaan.</p>
    `
  },
  {
    titel: 'Live wedstrijd bijhouden',
    img: 'handleiding/screenshots/09_live_wedstrijd.png',
    inhoud: `
      <ol class="hdl-list">
        <li>Tik op <b>'► Start wedstrijd'</b>.</li>
        <li>Registreer events via de knoppen:<br>
          <b>Goal</b> · <b>Wissel</b> · <b>Positie</b> · <b>Gele kaart</b> · <b>Rode kaart</b> · <b>Penalty</b> · <b>Blessure</b> · <b>Meer</b> (met o.a. <b>Vrije trap</b>)
        </li>
        <li>Wissels kunnen ook <b>tijdens de pauze</b> doorgevoerd worden.</li>
        <li>De puntjes tonen de wedstrijddelen. De timer loopt per deel.</li>
        <li>Navigeer onderaan tussen <b>Wedstrijd</b>, <b>Opstelling</b> en <b>Verloop</b>.</li>
        <li>Tik op <b>'Deel score'</b> om de stand te delen.</li>
        <li>Tik op <b>'Afsluiten'</b> om de wedstrijd te beëindigen.</li>
      </ol>
      <p class="hdl-tip">Fout geregistreerd? Verwijder events via het tabblad <b>'Verloop'</b>.</p>
      <p class="hdl-tip">Zijn er meerdere co-beheerders? Laat best 1 persoon tegelijk events registreren voor een wedstrijd — gelijktijdig invoeren op verschillende toestellen kan elkaars wijzigingen overschrijven.</p>
    `
  },
  {
    titel: 'Wedstrijd na afloop & PDF',
    img: 'handleiding/screenshots/11_wedstrijd_detail_2.png',
    img2: 'handleiding/screenshots/12_wedstrijd_detail_2.png',
    inhoud: `
      <p>Open een gespeelde wedstrijd voor de volledige samenvatting: eindscore, wedstrijdinfo, opstelling en alle events. Per event kan je bewerken (potlood) of verwijderen (rood kruisje).</p>
      <p style="margin-top:10px">Onderaan vind je ook:</p>
      <ul class="hdl-list">
        <li><b>'Event toevoegen'</b> — voeg achteraf nog een event toe.</li>
        <li><b>'Spelers bewerken'</b> / <b>'Info bewerken'</b> — pas gegevens aan.</li>
        <li><b>'Posities herplaatsen'</b> — pas de opstelling aan.</li>
        <li><b>'Wedstrijd verwijderen'</b> — verwijder definitief.</li>
      </ul>
      <div class="sec">PDF & delen</div>
      <ul class="hdl-list">
        <li>Tik op <b>'PDF'</b> voor een officieel wedstrijdverslag.</li>
        <li>Tik op <b>'Delen'</b> om te delen via je toestel.</li>
        <li>Tik op <b>'Deel score'</b> voor de stand.</li>
      </ul>
    `
  },
  {
    titel: 'Ploeg & spelers beheren',
    img: 'handleiding/screenshots/10_ploeg_bewerken.png',
    inhoud: `
      <p>Via de tegel <b>'Spelers'</b> op het homescherm kom je in <b>'Ploeg bewerken'</b>:</p>
      <ul class="hdl-list">
        <li><b>Ploegnaam</b> en <b>ploegverantwoordelijke</b>.</li>
        <li><b>Trainers</b> — tot 3 trainers invullen.</li>
        <li><b>Spelers</b> — rugnummer, voornaam, familienaam en positie. Sorteer op nummer of naam. Verwijder via het rode kruisje.</li>
      </ul>
    `
  },
  {
    titel: 'Als co-beheerder',
    img: 'handleiding/screenshots/05_beheer.png',
    inhoud: `
      <p>Ben je co-beheerder van een ploeg? Dan heb je rechtsboven de groene knop <b>'Beheer'</b> met extra opties voor die ploeg:</p>
      <ul class="hdl-list">
        <li><b>'Iemand uitnodigen'</b> — deel een uitnodiging via link, QR-code of code van 6 tekens. Wie via de link vervoegt, komt binnen als <b>kijker</b>; je kan hem daarna via <b>'Leden'</b> promoveren tot co-beheerder.</li>
        <li><b>'Leden'</b> — overzicht van alle kijkers en co-beheerders. Hier keur je co-beheeraanvragen goed of af, en promoveer of degradeer je leden.</li>
        <li><b>'Kijkmodus'</b> — bekijk de ploeg als kijker.</li>
      </ul>
      <p class="hdl-tip">Als co-beheerder kan je alles voor je ploeg: wedstrijden aanmaken, live bijhouden, spelers beheren en PDF's genereren.</p>
      <p style="margin-top:10px">Een <b>nieuwe ploeg</b> aanmaken doe je niet zelf — dat doet de clubbeheerder binnen de club (zie de volgende pagina). Contacteer de clubbeheerder van je club.</p>
    `
  },
  {
    titel: 'Als clubbeheerder',
    inhoud: `
      <p>Een <b>clubbeheerder</b> beheert alle ploegen van één club. De eigenaar stelt je aan als clubbeheerder. Daarna verschijnt op het ploegkeuzescherm de knop <b>'Mijn club beheren'</b>.</p>
      <div class="sec">Ploegen beheren</div>
      <ul class="hdl-list">
        <li><b>'Nieuwe ploeg in deze club'</b> — maak een ploeg aan binnen je club. Vink aan of je zelf het dagelijks beheer doet (dan verschijnt de ploeg ook in 'Jouw ploegen').</li>
        <li><b>'Beheren'</b> bij een ploeg — open het gewone ploegbeheer om trainers uit te nodigen en leden te beheren.</li>
        <li><b>'Archiveren'</b> — zet een ploeg weg zonder ze te verwijderen; ze verdwijnt uit de actieve lijsten maar behoudt alle gegevens en kan hersteld worden.</li>
      </ul>
      <div class="sec">Een trainer uitnodigen</div>
      <ol class="hdl-list">
        <li>Open de ploeg met <b>'Beheren'</b> en tik op <b>'Iemand uitnodigen'</b>.</li>
        <li>Bezorg de trainer de <b>uitnodigingslink</b> (of QR-code / code). Hij vervoegt eerst als kijker.</li>
        <li>Ga naar <b>'Leden'</b> en <b>promoveer</b> hem tot co-beheerder.</li>
      </ol>
      <div class="sec">Extra</div>
      <ul class="hdl-list">
        <li><b>'Speler overzetten'</b> — verplaats een speler tussen ploegen binnen je club.</li>
        <li><b>Clublogo</b> — stel bovenaan in 'Mijn club beheren' het clublogo in. Het verschijnt bij je club op het ploegkeuzescherm, onderaan de ploegpagina en in de wedstrijd-PDF.</li>
      </ul>
    `
  },
  {
    titel: 'Tornooi',
    inhoud: `
      <p>Match Delegate beschikt over een <b>tornooifunctie</b>.</p>
      <p style="margin-top:10px;color:var(--txt2)">De documentatie hierover is nog in opmaak en wordt binnenkort toegevoegd aan deze handleiding.</p>
    `
  }
];

let hdlPagina = 0;
function renderHandleiding(p) {
  hdlPagina = p;
  const pagina = HANDLEIDING_PAGINAS[p];
  const totaal = HANDLEIDING_PAGINAS.length;
  const tabs = HANDLEIDING_PAGINAS.map((pg, i) =>
    `<button class="hdl-tab${i === p ? ' active' : ''}" onclick="hdlGo(${i})">${pg.titel}</button>`
  ).join('');
  const imgs = (pagina.img ? `<img src="${pagina.img}" class="hdl-img" onerror="this.style.display='none'">` : '') +
               (pagina.img2 ? `<img src="${pagina.img2}" class="hdl-img" style="margin-top:10px" onerror="this.style.display='none'">` : '');
  const pdfKnop = p === 0 ? `<button class="btn btn-pale" style="margin-bottom:16px;width:100%" onclick="exportHandleidingPDF()">${icI(IC.clipboard)} Download handleiding als PDF</button>` : '';
  return `
    <div class="hdr"><button class="back" onclick="go('settings')">‹</button><h1>${icI(IC.clipboard)} Handleiding</h1></div>
    <div class="content" style="padding:0">
      <div class="hdl-tabs">${tabs}</div>
      <div class="hdl-body">
        ${pdfKnop}
        <h2 class="hdl-titel">${pagina.titel}</h2>
        ${imgs}
        ${pagina.inhoud}
        <div class="hdl-nav">
          ${p > 0 ? `<button class="btn btn-pale" onclick="hdlGo(${p-1})">‹ Vorige</button>` : '<span></span>'}
          <span style="font-size:13px;color:var(--txt2)">${p+1} / ${totaal}</span>
          ${p < totaal-1 ? `<button class="btn btn-green" onclick="hdlGo(${p+1})">Volgende ›</button>` : '<span></span>'}
        </div>
      </div>
    </div>`;
}
function hdlGo(p) {
  document.getElementById('app').innerHTML = renderHandleiding(p);
  window.scrollTo(0, 0);
  document.getElementById('app').scrollTop = 0;
}

let _jspdfLoading = null;
// Laadt jsPDF + autoTable (~450KB) pas bij een effectieve PDF-export, niet bij elke opstart.
function loadJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable) return Promise.resolve();
  if (_jspdfLoading) return _jspdfLoading;
  _jspdfLoading = new Promise((resolve, reject) => {
    const s1 = document.createElement('script');
    s1.src = 'pdf/jspdf.umd.min.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'pdf/jspdf.plugin.autotable.min.js';
      s2.onload = () => resolve();
      s2.onerror = () => reject(new Error('jspdf.plugin.autotable.min.js niet geladen'));
      document.head.appendChild(s2);
    };
    s1.onerror = () => reject(new Error('jspdf.umd.min.js niet geladen'));
    document.head.appendChild(s1);
  });
  return _jspdfLoading;
}

let _hdlScreenshotsLoading = null;
// Laadt handleiding-screenshots.js (792KB base64) pas wanneer echt nodig, niet bij elke opstart.
function loadHandleidingScreenshots() {
  if (Object.keys(HANDLEIDING_SCREENSHOTS).length > 0) return Promise.resolve();
  if (_hdlScreenshotsLoading) return _hdlScreenshotsLoading;
  _hdlScreenshotsLoading = new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'handleiding-screenshots.js';
    s.onload = () => resolve();
    s.onerror = () => { console.info('handleiding-screenshots.js niet gevonden'); resolve(); };
    document.head.appendChild(s);
  });
  return _hdlScreenshotsLoading;
}
async function exportHandleidingPDF() {
  showToast('PDF wordt voorbereid...', '');
  await loadHandleidingScreenshots();
  const heeftScreenshots = Object.keys(HANDLEIDING_SCREENSHOTS).length > 0;
  function imgTag(key, style) {
    if (!key) return '';
    const k = key.replace('handleiding/screenshots/', '').replace('.png', '');
    const src = HANDLEIDING_SCREENSHOTS[k];
    if (!src) return '';
    return `<img src="${src}" style="width:100%;border-radius:8px;border:1px solid #e5e7eb;margin:12px 0;display:block${style ? ';' + style : ''}">`;
  }

  const secties = HANDLEIDING_PAGINAS.map((pg, i) => {
    const imgs = (pg.img ? imgTag(pg.img) : '') + (pg.img2 ? imgTag(pg.img2) : '');
    return `
      <div class="sectie${i < HANDLEIDING_PAGINAS.length - 1 ? ' page-break' : ''}">
        <h2>${i + 1}. ${pg.titel}</h2>
        ${imgs}
        ${pg.inhoud}
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
    <title>Match Delegate — Handleiding</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;color:#171717;padding:32px;max-width:780px;margin:0 auto;font-size:14px;line-height:1.6}
      h1.titel{font-size:28px;font-weight:900;margin-bottom:4px}
      .subtitel{font-size:14px;color:#6b7280;margin-bottom:32px;letter-spacing:1px}
      h2{font-size:18px;font-weight:700;margin:24px 0 10px;color:#111;border-bottom:2px solid #e5e7eb;padding-bottom:6px}
      .sec{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#6b7280;margin:16px 0 6px}
      p{margin-bottom:8px}
      ol,ul{padding-left:20px;margin:8px 0}
      li{margin-bottom:4px}
      .hdl-rol{background:#f9fafb;border-radius:8px;padding:10px 12px;margin-bottom:8px}
      .hdl-rol b{display:block;font-size:15px;margin-bottom:2px}
      .hdl-rol span{color:#6b7280;font-size:13px}
      .hdl-tip{background:#f0fdf4;border-left:3px solid #22c55e;padding:8px 12px;border-radius:0 8px 8px 0;font-size:13px;color:#374151;margin-top:12px}
      .hdl-list{padding-left:20px;margin:8px 0;line-height:1.8;font-size:14px}
      .hdl-list li{margin-bottom:4px}
      .sectie{margin-bottom:40px}
      .page-break{page-break-after:auto}
      a{color:#16a34a}
      @media print{
        body{padding:16px}
        .page-break{page-break-after:always}
        h2{page-break-after:avoid}
        img{page-break-inside:avoid}
      }
    </style>
  </head><body>
    <h1 class="titel">Match Delegate</h1>
    <div class="subtitel">Manage &nbsp;·&nbsp; Track &nbsp;·&nbsp; Share</div>
    <h1 style="font-size:22px;margin-bottom:32px">Gebruikershandleiding</h1>
    ${!heeftScreenshots ? '<p style="color:#ef4444;margin-bottom:24px">⚠ Screenshots niet beschikbaar. Draai eerst <code>node handleiding/generate-b64.js</code> om ze toe te voegen.</p>' : ''}
    ${secties}
    <p style="margin-top:40px;font-size:12px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:16px">Match Delegate · App created by Tim Buyse</p>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) { showToast('Sta pop-ups toe om de PDF te maken.', 'err'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 800);
}

async function exportBackup() {
  const matches = await dbAll();
  const data = { app: 'voetbal', version: 2, exportedAt: Date.now(), matches,
    settings: { clubName: localStorage.getItem('voetbal_club_name'), clubLogo: localStorage.getItem('voetbal_club_logo'),
      teamsV2: localStorage.getItem('voetbal_teams_v2'), countdown: localStorage.getItem('voetbal_countdown'),
      theme: localStorage.getItem('voetbal_theme'), dark: localStorage.getItem('voetbal_dark'),
      tournaments: localStorage.getItem('voetbal_tournaments') } };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `voetbal-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  localStorage.setItem('voetbal_last_backup', String(Date.now()));
}
function importBackup(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    let data;
    try { data = JSON.parse(e.target.result); } catch (err) { showToast('Ongeldig back-upbestand.', 'err'); return; }
    // Losse wedstrijd?
    if (data && data.app === 'voetbal-match' && data.match) {
      pendingRestore = { matches: [data.match], settings: null, single: true };
      openModal(`<h3>Wedstrijd importeren?</h3>
        <p style="text-align:center;color:var(--txt2);margin-bottom:16px"><b>${esc(data.match.teamName||'')} vs ${esc(data.match.opponent||'')}</b><br>Deze wordt toegevoegd aan je bestaande wedstrijden.</p>
        <button class="btn btn-green" onclick="doRestore('merge')">＋ Toevoegen</button>
        <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
      input.value = ''; return;
    }
    if (!data || data.app !== 'voetbal' || !Array.isArray(data.matches)) { showToast('Dit lijkt geen geldige voetbal-back-up.', 'err'); return; }
    pendingRestore = data;
    openModal(`<h3>Back-up gevonden</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">${data.matches.length} wedstrijden in dit bestand.<br>Wil je ze <b>samenvoegen</b> met je huidige data, of <b>alles vervangen</b>?</p>
      <button class="btn btn-green" onclick="doRestore('merge')">${icI(IC.link)} Samenvoegen (toevoegen)</button>
      <button class="btn btn-red" style="margin-top:8px" onclick="doRestore('replace')">${icI(IC.warn)} Alles vervangen</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    input.value = '';
  };
  reader.readAsText(f);
}

let pendingRestore = null;
async function doRestore(mode) {
  const data = pendingRestore;
  if (!data) return;
  // fromCloud strippen: anders ruimt de cloud-listener herstelde wedstrijden die niet
  // (meer) in de cloud staan meteen weer op. Hersteld = lokaal; staat de wedstrijd tóch
  // nog in de cloud, dan wint die versie vanzelf (zelfde id). Pas bij een latere
  // bewerking door een beheerder gaat ze opnieuw naar de cloud van de actieve ploeg.
  const incoming = (data.matches || []).map(m => { const c = { ...m }; delete c.fromCloud; return c; });
  const norm = s => (s || '').trim().toLowerCase();
  if (mode === 'replace') {
    await new Promise((res, rej) => { const tx = db.transaction('matches', 'readwrite'); const st = tx.objectStore('matches'); st.clear(); incoming.forEach(m => st.put(m)); tx.oncomplete = () => res(); tx.onerror = () => rej(); });
    const s = data.settings || {};
    const setOrDel = (k, v) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); };
    setOrDel('voetbal_club_name', s.clubName); setOrDel('voetbal_club_logo', s.clubLogo);
    setOrDel('voetbal_teams_v2', s.teamsV2); setOrDel('voetbal_countdown', s.countdown);
    setOrDel('voetbal_theme', s.theme); setOrDel('voetbal_dark', s.dark);
    setOrDel('voetbal_tournaments', s.tournaments);
  } else {
    // Samenvoegen: enkel wedstrijden toevoegen die nog niet bestaan (op id).
    const existing = await dbAll();
    const ids = new Set(existing.map(m => m.id));
    const toAdd = incoming.filter(m => !ids.has(m.id));
    if (toAdd.length) await new Promise((res, rej) => { const tx = db.transaction('matches', 'readwrite'); const st = tx.objectStore('matches'); toAdd.forEach(m => st.put(m)); tx.oncomplete = () => res(); tx.onerror = () => rej(); });
    // Ploegen samenvoegen (op naam) indien aanwezig in de back-up.
    if (data.settings && data.settings.teamsV2) {
      let inc = []; try { inc = JSON.parse(data.settings.teamsV2) || []; } catch (e) {}
      const cur = getTeamsV2(); const keys = new Set(cur.map(t => norm(t.name)));
      inc.forEach(t => { if (!keys.has(norm(t.name))) { cur.push(t); keys.add(norm(t.name)); } });
      saveTeamsV2(cur);
    }
    if (data.settings && data.settings.tournaments) {
      let incT = []; try { incT = JSON.parse(data.settings.tournaments) || []; } catch(e) {}
      const curT = getTournaments(); const tIds = new Set(curT.map(t => t.id));
      incT.forEach(t => { if (!tIds.has(t.id)) { curT.push(t); tIds.add(t.id); } });
      localStorage.setItem('voetbal_tournaments', JSON.stringify(curT));
    }
  }
  localStorage.setItem('voetbal_setup_done', '1');
  pendingRestore = null;
  closeModal(); match = null; applyStoredTheme(); applyDark(); go('home');
  const cloudNote = (cloudReady && activeTeamId) ? ' (als lokale wedstrijden)' : '';
  setTimeout(() => showToast((mode === 'replace' ? 'Back-up hersteld' : 'Back-ups samengevoegd') + cloudNote, 'ok'), 100);
}
// Opent de mailapp met een voorgevuld probleemrapport (versie, rol, ploeg, toestel).
function reportProblem() {
  const role = isOwner ? 'Eigenaar' : isApprovedAdmin ? 'Beheerder (goedgekeurd)' : isAdmin ? 'Co-beheerder' : isGuest ? 'Gast' : currentUser ? 'Kijker' : 'Niet aangemeld';
  const club = getClubName() || '';
  const subject = `Match Delegate v${APP_VERSION} — probleem melden`;
  const infoLines = [`Versie: ${APP_VERSION}`, `Rol: ${role}`];
  if (club) infoLines.push(`Ploeg: ${club}`);
  infoLines.push(`Toestel: ${navigator.userAgent}`);
  const body = ['Beschrijf hieronder wat er misliep:', '', '', '---', ...infoLines].join('\n');
  window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function confirmChangeEmail() {
  openModal(`<h3>E-mailadres wijzigen</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:14px">Je krijgt een bevestigingsmail op je <b>nieuwe</b> adres. Pas nadat je die link aanklikt, wordt je e-mailadres aangepast. Je rol en ploegen blijven behouden.</p>
    <div class="fg"><label>Nieuw e-mailadres</label><input id="ce-email" type="email" placeholder="nieuw@example.com"></div>
    <div class="fg fg-pwd"><label>Huidig wachtwoord</label><input id="ce-pwd" type="password" placeholder="wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="ce-err"></div>
    <button class="btn btn-green" onclick="doChangeEmail()">Bevestigingsmail versturen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doChangeEmail() {
  const email = (document.getElementById('ce-email') || {}).value || '';
  const pwd = (document.getElementById('ce-pwd') || {}).value || '';
  const err = document.getElementById('ce-err');
  if (!email.trim()) { if (err) err.textContent = 'Geef een nieuw e-mailadres in.'; return; }
  if (!pwd) { if (err) err.textContent = 'Geef je huidige wachtwoord in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pwd);
    await currentUser.reauthenticateWithCredential(cred);
    await currentUser.verifyBeforeUpdateEmail(email.trim());
    closeModal();
    showToast('Bevestigingsmail verstuurd naar ' + email.trim() + '. Klik de link in die mail (kijk ook in spam).', 'ok');
  } catch (e) {
    if (err) err.textContent = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') ? 'Onjuist wachtwoord.'
      : e.code === 'auth/invalid-email' ? 'Ongeldig e-mailadres.'
      : e.code === 'auth/email-already-in-use' ? 'Dit e-mailadres is al in gebruik.'
      : 'Wijzigen mislukt, probeer opnieuw.';
  }
}

function confirmChangePassword() {
  openModal(`<h3>${icI(IC.lock)} Wachtwoord wijzigen</h3>
    <div class="fg fg-pwd"><label>Huidig wachtwoord</label><input id="cp-old" type="password" autocomplete="current-password" placeholder="huidig wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="fg fg-pwd"><label>Nieuw wachtwoord</label><input id="cp-new" type="password" autocomplete="new-password" placeholder="min. 6 tekens"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="fg fg-pwd"><label>Nieuw wachtwoord bevestigen</label><input id="cp-new2" type="password" autocomplete="new-password" placeholder="herhaal nieuw wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="cp-err"></div>
    <button class="btn btn-green" onclick="doChangePassword()">Wachtwoord wijzigen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doChangePassword() {
  const oldPwd = (document.getElementById('cp-old') || {}).value || '';
  const newPwd = (document.getElementById('cp-new') || {}).value || '';
  const newPwd2 = (document.getElementById('cp-new2') || {}).value || '';
  const err = document.getElementById('cp-err');
  if (!oldPwd) { if (err) err.textContent = 'Geef je huidig wachtwoord in.'; return; }
  if (newPwd.length < 6) { if (err) err.textContent = 'Nieuw wachtwoord moet minstens 6 tekens zijn.'; return; }
  if (newPwd !== newPwd2) { if (err) err.textContent = 'De twee nieuwe wachtwoorden zijn niet gelijk.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, oldPwd);
    await currentUser.reauthenticateWithCredential(cred);
    await currentUser.updatePassword(newPwd);
    closeModal();
    showToast('Wachtwoord succesvol gewijzigd.', 'ok');
  } catch (e) {
    if (err) err.textContent = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') ? 'Huidig wachtwoord is onjuist.'
      : e.code === 'auth/weak-password' ? 'Nieuw wachtwoord moet minstens 6 tekens zijn.'
      : 'Wijzigen mislukt, probeer opnieuw.';
  }
}

function confirmChangeName() {
  openModal(`<h3>${icI(IC.edit)} Naam wijzigen</h3>
    <div class="fg"><label>Nieuwe naam</label><input id="cn-name" type="text" value="${esc(currentUser.displayName || '')}" placeholder="Jouw naam" autocomplete="off"></div>
    <div class="auth-err" id="cn-err"></div>
    <button class="btn btn-green" onclick="doChangeName()">Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doChangeName() {
  const name = ((document.getElementById('cn-name') || {}).value || '').trim();
  const err = document.getElementById('cn-err');
  if (!name) { if (err) err.textContent = 'Geef een naam in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    await currentUser.updateProfile({ displayName: name });
    await fbdb.ref('users/' + currentUser.uid).update({ displayName: name });
    closeModal(); render();
  } catch (e) { if (err) err.textContent = 'Er ging iets mis, probeer opnieuw.'; }
}

function confirmDeleteAccount() {
  openModal(`<h3>Account verwijderen</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:16px;font-size:14px">Je account wordt permanent verwijderd. Je ploegen en data in de cloud blijven bewaard voor andere leden.</p>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:16px">Geef je wachtwoord in ter bevestiging:</p>
    <div class="fg fg-pwd"><input id="del-pwd" type="password" placeholder="wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="del-err"></div>
    <button class="btn btn-red" onclick="doDeleteAccount()">Permanent verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}

async function doDeleteAccount() {
  const pwd = (document.getElementById('del-pwd') || {}).value || '';
  const err = document.getElementById('del-err');
  if (!pwd) { if (err) err.textContent = 'Geef je wachtwoord in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pwd);
    await currentUser.reauthenticateWithCredential(cred);
    const uid = currentUser.uid;
    // Eigen sporen in elke ploeg opruimen vóór het account zelf weg is (nadien mag dat niet
    // meer, want auth.uid bestaat dan niet meer). Team- en wedstrijddata van anderen blijft
    // bewust bestaan (zie bevestigingstekst) — enkel de eigen gegevens van dit account verdwijnen.
    for (const tid of Object.keys(userTeams)) {
      try { await fbdb.ref('memberInfo/' + tid + '/' + uid).remove(); } catch (e) {}
      try { await fbdb.ref('teams/' + tid + '/members/' + uid).remove(); } catch (e) {}
      try { await fbdb.ref('teamAdminRequests/' + tid + '/' + uid).remove(); } catch (e) {}
    }
    try { await fbdb.ref('users/' + uid).remove(); } catch (e) {}
    // Overige persoonlijke sporen (naam/e-mail) los van een specifieke ploeg. Uitnodigingscodes
    // (invites/) blijven bewust ongemoeid: die zijn niet op uid geïndexeerd en verwijderen zou
    // per ongeluk de actieve uitnodigingslink van een hele ploeg kunnen breken voor anderen.
    try { await fbdb.ref('approvedAdmins/' + uid).remove(); } catch (e) {}
    try { await fbdb.ref('adminRequests/' + uid).remove(); } catch (e) {}
    try { await fbdb.ref('rejectedAdmins/' + uid).remove(); } catch (e) {}
    await currentUser.delete();
    await clearLocalDeviceData(uid);
    closeModal();
    activeTeamId = null; userTeams = {}; isAdmin = false; viewerMode = false;
  } catch (e) {
    if (err) err.textContent = e.code === 'auth/wrong-password' ? 'Onjuist wachtwoord.' : 'Verwijderen mislukt. Probeer opnieuw.';
  }
}

// ---- Naam van ploeg wijzigen ----
function showRenameTeamModal() {
  // Hernoemen mag elke co-beheerder van DEZE ploeg (isAdmin), niet enkel wie systeembreed
  // goedgekeurd is om nieuwe ploegen aan te maken (isApprovedAdmin) — de backend-regel
  // (database.rules.json, teams/$teamId/.write) staat dit ook al toe aan elke team-admin.
  // Verwijderen blijft bewust strenger (isApprovedAdmin + createdBy), zie confirmDeleteCloudTeam().
  if (!isAdmin || !activeTeamId || !fbdb) return;
  const current = getClubName() || '';
  openModal(`<h3>${icI(IC.edit)} Naam ploeg wijzigen</h3>
    <div class="fg"><label>Nieuwe naam</label><input id="rename-team-input" type="text" value="${esc(current)}" autofocus></div>
    <div class="auth-err" id="rename-team-err"></div>
    <button class="btn btn-org" id="rename-team-btn" onclick="doRenameTeam()">Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doRenameTeam() {
  const input = document.getElementById('rename-team-input');
  const err = document.getElementById('rename-team-err');
  const btn = document.getElementById('rename-team-btn');
  const name = (input ? input.value : '').trim();
  if (!name) { if (err) err.textContent = 'Geef een naam in.'; return; }
  if (err) err.textContent = 'Bezig...';
  if (btn) btn.disabled = true;
  const oldClubName = getClubName() || '';
  try {
    await fbdb.ref('teams/' + activeTeamId + '/info/name').set(name);
    await fbdb.ref('teams/' + activeTeamId + '/club/name').set(name);
    localStorage.setItem('voetbal_club_name', name);
    teamNames[activeTeamId] = name;
    // Zonder deze persist valt de in-memory cache na een refresh terug op de oude naam
    // (zie preloadTeamNames/selectTeam in core.js), en blijft de ploegenkeuze-pagina de
    // oude naam tonen.
    try { localStorage.setItem('voetbal_teamNames', JSON.stringify(teamNames)); } catch (e) {}
    // Roster-naam (Spelers-pagina, tornooiwizard) en bestaande wedstrijden dragen een apart
    // naamveld dat nooit automatisch meeliep met de club-naam — zie syncTeamNaming (core.js).
    await syncTeamNaming(name, [oldClubName]);
    closeModal();
    render();
  } catch (e) {
    if (err) err.textContent = 'Er ging iets mis, probeer opnieuw.';
    if (btn) btn.disabled = false;
  }
}

// ---- Hele ploeg (Firebase-team) verwijderen ----
async function confirmDeleteCloudTeam() {
  if (!isApprovedAdmin || !activeTeamId || !fbdb) return;
  const naam = getClubName() || 'deze ploeg';
  if (!isOwner) {
    let infoSnap;
    try { infoSnap = await fbOnce(fbdb.ref('teams/' + activeTeamId + '/info/createdBy')); }
    catch (e) { showToast('Kon niet controleren wie de ploeg aanmaakte (geen verbinding). Probeer later opnieuw.', 'err'); return; }
    if (infoSnap.val() !== currentUser.uid) {
      showToast('Je kan enkel ploegen verwijderen die je zelf hebt aangemaakt.', 'err');
      return;
    }
  }
  openModal(`<h3>Ploeg verwijderen</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:14px;font-size:14px"><b>${esc(naam)}</b> wordt volledig uit de cloud gewist: spelers, wedstrijden, tornooien en de toegangscode. Ook je kijkers verliezen toegang. Dit kan niet ongedaan gemaakt worden.</p>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">Geef je wachtwoord in ter bevestiging:</p>
    <div class="fg fg-pwd"><input id="delteam-pwd" type="password" placeholder="wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="delteam-err"></div>
    <button class="btn btn-red" onclick="doDeleteCloudTeam()">Permanent verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doDeleteCloudTeam() {
  if (!isAdmin || !activeTeamId || !fbdb) return;
  const tid = activeTeamId;
  const err = document.getElementById('delteam-err');
  const pwd = (document.getElementById('delteam-pwd') || {}).value || '';
  if (!pwd) { if (err) err.textContent = 'Geef je wachtwoord in.'; return; }
  if (err) err.textContent = 'Bezig met verwijderen...';
  try {
    // Wachtwoord opnieuw bevestigen
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pwd);
    await currentUser.reauthenticateWithCredential(cred);
    const [teamSnap, memberInfoSnap, teamNotesSnap] = await Promise.all([
      fbOnce(fbdb.ref('teams/' + tid)),
      fbOnce(fbdb.ref('memberInfo/' + tid)),
      fbOnce(fbdb.ref('teamNotes/' + tid)),
    ]);
    // Backup opslaan vóór verwijderen
    await fbdb.ref('deletedTeams/' + tid).set({
      deletedAt: Date.now(),
      deletedBy: currentUser.uid,
      deletedByEmail: currentUser.email || '',
      team: teamSnap.val(),
      memberInfo: memberInfoSnap.val(),
      teamNotes: teamNotesSnap.val(),
    });
    const info = (teamSnap.val() || {}).info || {};
    const token = info.inviteToken;
    // Uitnodiging + ledeninfo + notities eerst proberen wissen (terwijl team-lidmaatschap nog
    // bestaat — teamNotes/memberInfo staan los van teams/$teamId en volgen daar dus niet
    // automatisch uit mee; hun schrijfrechten vervallen bovendien zodra teams/$teamId weg is).
    if (token) { try { await fbdb.ref('invites/' + token).remove(); } catch (e) {} }
    try { await fbdb.ref('memberInfo/' + tid).remove(); } catch (e) {}
    try { await fbdb.ref('teamNotes/' + tid).remove(); } catch (e) {}
    // Club-index opkuisen (fase 2) zodat de ploeg niet als wees in Clubbeheer blijft staan.
    // Best-effort: onder de huidige rules mag de eigenaar clubs schrijven; voor een niet-eigenaar
    // clubbeheerder komt dat schrijfrecht in fase 2d.
    if (info.clubId) { try { await fbdb.ref('clubs/' + info.clubId + '/teams/' + tid).remove(); } catch (e) {} }
    // Het hele team verwijderen
    await fbdb.ref('teams/' + tid).remove();
    if (currentUser) { try { await fbdb.ref('users/' + currentUser.uid + '/teams/' + tid).remove(); } catch (e) {} }
    delete userTeams[tid];
    stopTeamListeners();
    activeTeamId = null; isAdmin = false;
    localStorage.removeItem('voetbal_activeTeamId');
    closeModal();
    go('teamselect', undefined, true);
  } catch (e) {
    console.error('Ploeg verwijderen mislukt:', e);
    if (err) err.textContent = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')
      ? 'Onjuist wachtwoord.'
      : 'Verwijderen mislukt, probeer opnieuw.';
  }
}

