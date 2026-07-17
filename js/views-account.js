// ===================== BEHEER (view) =====================
// Beheerscherm voor de ACTIEVE ploeg: uitnodigen, leden, naam, kijkmodus, verwijderen
// (of, voor een kijker: co-beheer aanvragen). Account zit in Instellingen (tandwiel),
// systeembrede eigenaarstools op het ploegkeuzescherm. Vervangt de vroegere cloudLoginModal().
function renderBeheer() {
  // Eigenaar: eenmalig claimen (enkel als nog niet ingesteld)
  const ownerBlock = !ownerUid
    ? `<div class="sec">Eigenaar</div><div class="card"><button class="btn btn-org" onclick="claimOwner()"><span class="ic-i" style="font-size:1.1em">${IC.crown}</span> Ik ben de maker (eigenaar instellen)</button></div>`
    : '';

  // Deze ploeg beheren: enkel getoond in de 'team'-context (vanaf het homescherm).
  const teamBlock = (_beheerContext !== 'team') ? '' : (!activeTeamId
    ? `<div class="card"><p style="color:var(--txt2);font-size:14px;margin:0">Kies eerst een ploeg om ze te beheren.</p></div>`
    : (isAdmin ? `
    <div class="sec">Deze ploeg</div>
    <div class="card">
      <button class="btn btn-green" onclick="showInviteModal()"><span class="ic-i" style="font-size:1.1em">${IC.qrcode}</span> Iemand uitnodigen</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="showMembersModal()">${icI(IC.players)} Leden${pendingCoAdminCount ? `<span class="req-badge">${pendingCoAdminCount}</span>` : ''}</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="showRenameTeamModal()">${icI(IC.edit)} Naam ploeg wijzigen</button>
      <div style="display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid var(--bdr)">
        <span style="flex:1;font-size:13px;color:var(--txt2)">Deze ploeg bekijken als kijker</span>
        <button onclick="toggleViewerMode()" style="background:${viewerMode?'var(--grn)':'rgba(0,0,0,.12)'};border:none;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;color:${viewerMode?'#fff':'var(--txt2)'};cursor:pointer;white-space:nowrap">${viewerMode ? `${icI(IC.eye)} Kijker` : `${icI(IC.eye)} Kijkmodus`}</button>
      </div>
      ${isApprovedAdmin ? `<button style="background:none;border:none;color:var(--rd);font-size:13px;font-weight:700;cursor:pointer;margin-top:16px;padding:0;display:flex;align-items:center;gap:6px" onclick="confirmDeleteCloudTeam()">${icI(IC.trash)} Ploeg verwijderen</button>` : ''}
    </div>` : (!isGuest ? `
    <div class="sec">Deze ploeg</div>
    <div class="card">
      <button class="btn btn-pale" onclick="confirmRequestCoAdmin()">${icI(IC.edit)} Vraag co-beheer aan</button>
      <p style="font-size:12px;color:var(--txt2);margin-top:6px">Wil je zelf wedstrijden mogen bijhouden voor deze ploeg? Vraag het hier aan.</p>
    </div>` : '')));

  // Systeembreed: beheerder worden (ploegen mogen aanmaken) + eigenaarstools. Enkel getoond
  // in de 'system'-context (vanaf het ploegkeuzescherm).
  const requestAdminBlock = (_beheerContext !== 'system' || viewerMode) ? '' : (
    (ownerUid && !isApprovedAdmin && localStorage.getItem('voetbal_adminRequested') === '1')
      ? `<div class="sec">Beheerder worden</div><div class="nudge" style="margin-bottom:16px">${icI(IC.hourglass)} <b>Aanvraag ingediend</b> — Je hoort het zodra de maker je goedkeurt. Daarna kan je een eigen ploeg aanmaken.</div>`
      : (!isApprovedAdmin ? `<div class="sec">Beheerder worden</div><div class="card"><button class="btn btn-org" onclick="showRequestAdminModal()">${icI(IC.plus)} Beheerder worden &amp; ploeg aanmaken</button><p style="font-size:12px;color:var(--txt2);margin-top:8px">Vraag toestemming aan de maker om zelf ploegen te mogen aanmaken.</p></div>` : ''));
  const ownerToolsBlock = (_beheerContext === 'system' && isOwner && !viewerMode) ? `
    <div class="sec">${icI(IC.shield)} Eigenaarstools <span style="font-weight:400;text-transform:none;color:var(--txt2)">(systeembreed, alle ploegen)</span></div>
    <div class="card">
      <button class="btn btn-dark" onclick="go('clubsadmin')">${icI(IC.players)} Clubs beheren</button>
      <button class="btn btn-dark" style="margin-top:8px" onclick="showAdminRequestsModal()">${icI(IC.shield)} Beheerdersaanvragen${pendingAdminCount ? ` <span class="req-badge">${pendingAdminCount}</span>` : ''}</button>
      <button class="btn btn-dark" style="margin-top:8px" onclick="showApprovedAdminsModal()">${icI(IC.admins)} Goedgekeurde beheerders</button>
      <button class="btn btn-dark" style="margin-top:8px" onclick="go('allusers')">${icI(IC.players)} Alle gebruikers</button>
      <button class="btn" style="margin-top:8px;background:${maintenanceActive?'#b91c1c':'#1e3a2f'};color:${maintenanceActive?'#fef2f2':'#86efac'};border:1.5px solid ${maintenanceActive?'#ef4444':'#2f9e57'}" onclick="toggleMaintenance()">${maintenanceActive?`${icI(IC.wrench)} Onderhoud UIT-zetten`:`${icI(IC.wrench)} Onderhoud AAN-zetten`}</button>
    </div>` : '';

  // Clubbeheer: enkel voor clubbeheerders (myClubs niet leeg), in de systeemcontext.
  const clubBeheerBlock = (_beheerContext === 'system' && !viewerMode && Object.keys(myClubs || {}).length) ? `
    <div class="sec">${icI(IC.players)} Mijn club</div>
    <div class="card">
      <button class="btn btn-dark" onclick="go('clubbeheer')">${icI(IC.players)} Clubbeheer <span style="font-weight:400;opacity:.85">(ploegen &amp; uitnodigingen)</span></button>
    </div>` : '';

  return `<div class="hdr"><button class="back" onclick="go(_beheerFrom||'home')">‹</button><h1>${icI(IC.edit)} Beheer</h1></div>
  <div class="content">
    ${ownerBlock}
    ${teamBlock}
    ${requestAdminBlock}
    ${clubBeheerBlock}
    ${ownerToolsBlock}
  </div>`;
}

// ===================== CLUBBEHEER (view) =====================
// Apart scherm voor de clubbeheerder: overzicht van de ploegen van zijn club, een ploeg
// aanmaken binnen de club, en per ploeg doorklikken naar het gewone ploegbeheer (waar de
// uitnodigingslink + ledenbeheer al zit). Werkt onder de huidige rules volledig voor de
// eigenaar; het niet-eigenaar clubbeheerder-pad vergt de fijnmazige rules van fase 2d.
let _clubBeheerId = null;
function renderClubBeheer() {
  setTimeout(loadClubBeheerView, 0);
  return `<div class="hdr"><button class="back" onclick="go('teamselect')">‹</button><h1>${icI(IC.players)} Clubbeheer</h1></div>
  <div class="content" id="clubbeheer-content"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
}
async function loadClubBeheerView() {
  const el = document.getElementById('clubbeheer-content');
  if (!el || !fbdb) return;
  const clubIds = Object.keys(myClubs || {});
  if (!clubIds.length) { el.innerHTML = '<div class="card"><p style="color:var(--txt2);font-size:14px;margin:0">Je beheert momenteel geen club.</p></div>'; return; }
  const clubId = (_clubBeheerId && clubIds.includes(_clubBeheerId)) ? _clubBeheerId : clubIds[0];
  _clubBeheerId = clubId;
  try {
    const club = (await fbOnce(fbdb.ref('clubs/' + clubId))).val() || {};
    const clubName = (club.info && club.info.name) || 'Mijn club';
    const teamIds = Object.keys(club.teams || {});
    // Altijd vers de naam ophalen (niet op de cache vertrouwen): zo weten we of de ploeg nog
    // bestaat. Een ploeg die verwijderd is laat anders een wees-indexregel achter (info bestaat
    // niet meer) — die tonen we niet én kuisen we meteen op uit clubs/{id}/teams.
    const fetched = await Promise.all(teamIds.map(async tid => {
      try { const s = await fbOnce(fbdb.ref('teams/' + tid + '/info/name')); return { id: tid, name: s.exists() ? (s.val() || '') : null, exists: s.exists() }; }
      catch (e) { return { id: tid, name: teamNames[tid] || '', exists: true }; } // bij een fout (bv. offline) niet opkuisen
    }));
    const dead = fetched.filter(r => !r.exists);
    for (const r of dead) { try { await fbdb.ref('clubs/' + clubId + '/teams/' + r.id).remove(); } catch (e) {} }
    const rows = fetched.filter(r => r.exists).map(r => ({ id: r.id, name: r.name || '(naamloze ploeg)' }));
    rows.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    const clubSelector = clubIds.length > 1
      ? `<div class="fg"><label>Club</label><select onchange="_clubBeheerId=this.value;loadClubBeheerView()">${clubIds.map(id => `<option value="${esc(id)}" ${id === clubId ? 'selected' : ''}>${esc(id === clubId ? clubName : id)}</option>`).join('')}</select></div>`
      : '';
    el.innerHTML = `
      ${clubSelector}
      <div class="sec">${esc(clubName)} <span style="font-weight:400;text-transform:none;color:var(--txt2)">(${rows.length} ${rows.length === 1 ? 'ploeg' : 'ploegen'})</span></div>
      <div class="card">
        ${rows.length ? rows.map(t => `<div style="padding:8px 0;border-bottom:1px solid var(--bdr)">
          <div style="font-weight:600">${esc(t.name)}${userTeams[t.id] ? ' <span style="font-weight:400;color:var(--grn);font-size:12px">· in Jouw ploegen</span>' : ''}</div>
          <div style="display:flex;gap:6px;margin-top:6px">
            <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="openTeamFromClub('${t.id}')">${icI(IC.edit)} Beheren</button>
            <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="toggleClubTeamMembership('${t.id}')">${userTeams[t.id] ? 'Uit mijn ploegen' : 'Bij mijn ploegen'}</button>
          </div>
        </div>`).join('') : '<p style="color:var(--txt2);font-size:14px;margin:0">Nog geen ploegen in deze club.</p>'}
      </div>
      <button class="btn btn-green" onclick="showCreateTeamModal('${clubId}')">${icI(IC.plus)} Nieuwe ploeg in deze club</button>
      ${rows.length >= 2 ? `<button class="btn btn-pale" style="margin-top:8px" onclick="go('playertransfer')">${icI(IC.swap)} Speler overzetten (binnen club)</button>` : ''}
      <p style="font-size:12px;color:var(--txt2);margin-top:10px">Open een ploeg met "Beheren" om trainers/afgevaardigden uit te nodigen (via uitnodigingslink) en leden te beheren.</p>`;
  } catch (e) {
    el.innerHTML = '<div class="card"><p style="color:var(--org2);font-size:14px;margin:0">Kon de club niet laden. Probeer opnieuw.</p></div>';
  }
}
async function openTeamFromClub(tid) {
  // Clubbeheerder klikt door naar het gewone ploegbeheer (team-context) van een clubploeg.
  // De terugknop daar keert terug naar dit clubbeheer-scherm.
  _beheerFrom = 'clubbeheer'; _beheerContext = 'team';
  await selectTeam(tid);
  // Optimistisch: we komen uit het clubbeheer van deze club, dus toon meteen de beheercontroles
  // (selectTeam bevestigt dit ook async via isClubAdmin → isAdmin).
  if (_clubBeheerId && myClubs && myClubs[_clubBeheerId]) isAdmin = true;
  go('beheer');
}
// Hybride (fase 2d): de clubbeheerder voegt zichzelf toe aan / haalt zichzelf weg uit een clubploeg
// als co-beheerder (lid). Zo verschijnt de ploeg wel/niet in zijn eigen "Jouw ploegen"; zijn
// rolgebaseerde clubtoegang blijft hoe dan ook bestaan. Enkel zijn eigen lidmaatschap (self-write).
async function toggleClubTeamMembership(tid) {
  if (!fbdb || !currentUser) return;
  const uid = currentUser.uid;
  try {
    if (userTeams[tid]) {
      await fbdb.ref('teams/' + tid + '/members/' + uid).remove();
      await fbdb.ref('users/' + uid + '/teams/' + tid).remove();
      try { await fbdb.ref('memberInfo/' + tid + '/' + uid).remove(); } catch (e) {}
      delete userTeams[tid];
      showToast('Uit jouw ploegen gehaald.', 'ok');
    } else {
      await fbdb.ref('teams/' + tid + '/members/' + uid).set('admin');
      await fbdb.ref('users/' + uid + '/teams/' + tid).set('admin');
      writeMemberInfo(tid, 'admin');
      userTeams[tid] = 'admin';
      showToast('Toegevoegd aan jouw ploegen.', 'ok');
    }
    loadClubBeheerView();
  } catch (e) { showToast('Wijzigen mislukt, probeer opnieuw.', 'err'); }
}

// ===================== CLUBS BEHEREN (eigenaar, fase 3) =====================
// Owner-scherm: clubs aanmaken, hernoemen en een clubbeheerder aanstellen. Vervangt het
// migratiescript-trucje. Aanstellen zet clubs/{id}/admins/{uid}=true én de omgekeerde index
// users/{uid}/clubs/{id}='admin' (die de app in loadOwnerStatus als myClubs leest).
function renderClubsAdmin() {
  if (!isOwner) return `<div class="hdr"><button class="back" onclick="go('beheer')">‹</button><h1>Clubs beheren</h1></div><div class="content"><p style="text-align:center;color:var(--txt2)">Geen toegang.</p></div>`;
  setTimeout(loadClubsAdminView, 0);
  return `<div class="hdr"><button class="back" onclick="go('beheer')">‹</button><h1>${icI(IC.players)} Clubs beheren</h1></div>
  <div class="content" id="clubsadmin-content"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
}
async function loadClubsAdminView() {
  const el = document.getElementById('clubsadmin-content');
  if (!el || !isOwner || !fbdb) return;
  try {
    const clubsVal = (await fbOnce(fbdb.ref('clubs'))).val() || {};
    const clubIds = Object.keys(clubsVal);
    // Namen/e-mails van gebruikers samenstellen uit usersByEmail (elke ingelogde gebruiker) +
    // memberInfo (fallback voor wie enkel als ploeglid bekend is), zodat aangestelde clubbeheerders
    // met naam getoond worden i.p.v. een ruwe uid.
    // Beide bronnen apart en veerkrachtig ophalen: als usersByEmail nog niet leesbaar is (bv. rules
    // nog niet gepubliceerd) mag dat het scherm niet breken — dan valt userMap terug op memberInfo.
    const userMap = {};
    let miVal = {}, ubeVal = {};
    try { miVal = (await fbOnce(fbdb.ref('memberInfo'))).val() || {}; } catch (e) {}
    try { ubeVal = (await fbOnce(fbdb.ref('usersByEmail'))).val() || {}; } catch (e) {}
    Object.values(miVal).forEach(team => Object.entries(team || {}).forEach(([uid, info]) => { if (!userMap[uid]) userMap[uid] = { name: (info && info.name) || '', email: (info && info.email) || '' }; }));
    Object.entries(ubeVal).forEach(([uid, info]) => { userMap[uid] = { name: (info && info.name) || (userMap[uid] && userMap[uid].name) || '', email: (info && info.email) || (userMap[uid] && userMap[uid].email) || '' }; });
    const userName = uid => { const u = userMap[uid]; return u ? (u.name || u.email || uid) : uid; };
    const clubsHtml = clubIds.length ? clubIds.map(cid => {
      const c = clubsVal[cid] || {};
      const nm = (c.info && c.info.name) || '(naamloze club)';
      const nTeams = Object.keys(c.teams || {}).length;
      const admins = Object.keys(c.admins || {});
      const adminHtml = admins.length
        ? admins.map(uid => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><span style="flex:1;font-size:13px">${esc(userName(uid))}</span><button class="btn btn-pale btn-sm" style="width:auto;margin:0;color:var(--rd)" onclick="removeClubAdmin('${cid}','${uid}')">Verwijderen</button></div>`).join('')
        : '<p style="font-size:13px;color:var(--txt2);margin:2px 0">Nog geen clubbeheerder.</p>';
      return `<div class="card" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="flex:1;font-weight:800;font-size:16px">${esc(nm)}</span>
          <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="renameClub('${cid}',&quot;${esc(nm).replace(/"/g, '&quot;')}&quot;)">${icI(IC.edit)} Hernoemen</button>
        </div>
        <div style="font-size:13px;color:var(--txt2);margin-bottom:10px">${nTeams} ${nTeams === 1 ? 'ploeg' : 'ploegen'}</div>
        <div style="font-size:12px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Clubbeheerders</div>
        ${adminHtml}
        <button class="btn btn-pale btn-sm" style="margin-top:8px" onclick="showAppointClubAdmin('${cid}')">${icI(IC.plus)} Clubbeheerder aanstellen</button>
      </div>`;
    }).join('') : '<p style="color:var(--txt2);font-size:14px">Nog geen clubs.</p>';
    el.innerHTML = `
      <button class="btn btn-green" onclick="showCreateClubModal()">${icI(IC.plus)} Nieuwe club aanmaken</button>
      <div class="sec" style="margin-top:16px">Clubs</div>
      ${clubsHtml}`;
  } catch (e) {
    el.innerHTML = '<div class="card"><p style="color:var(--org2);font-size:14px;margin:0">Kon de clubs niet laden. Probeer opnieuw.</p></div>';
  }
}
function showCreateClubModal() {
  openModal(`<h3>${icI(IC.plus)} Nieuwe club</h3>
    <div class="fg"><label>Naam van de club</label><input id="new-club-name" type="text" placeholder="bv. KFC Voorbeeld" autofocus></div>
    <div class="auth-err" id="cc-err"></div>
    <button class="btn btn-green" id="cc-btn" onclick="doCreateClub()">Aanmaken</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doCreateClub() {
  if (!isOwner || !fbdb || !currentUser) return;
  const name = ((document.getElementById('new-club-name') || {}).value || '').trim();
  const err = document.getElementById('cc-err');
  if (!name) { if (err) err.textContent = 'Geef een naam in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const cid = fbdb.ref('clubs').push().key;
    await fbdb.ref('clubs/' + cid).set({ info: { name, logo: '', createdBy: currentUser.uid, createdAt: Date.now() }, admins: {}, teams: {} });
    closeModal(); loadClubsAdminView();
  } catch (e) { if (err) err.textContent = 'Aanmaken mislukt. Probeer opnieuw.'; }
}
function renameClub(cid, current) {
  openModal(`<h3>${icI(IC.edit)} Club hernoemen</h3>
    <div class="fg"><label>Naam van de club</label><input id="rename-club-name" type="text" value="${esc(current)}" autofocus></div>
    <div class="auth-err" id="rc-err"></div>
    <button class="btn btn-green" onclick="doRenameClub('${cid}')">Opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doRenameClub(cid) {
  if (!isOwner || !fbdb) return;
  const name = ((document.getElementById('rename-club-name') || {}).value || '').trim();
  const err = document.getElementById('rc-err');
  if (!name) { if (err) err.textContent = 'Geef een naam in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    await fbdb.ref('clubs/' + cid + '/info/name').set(name);
    // Gedenormaliseerde clubName op alle ploegen van de club bijwerken (fase 2f).
    const teamIds = Object.keys((await fbOnce(fbdb.ref('clubs/' + cid + '/teams'))).val() || {});
    for (const tid of teamIds) { try { await fbdb.ref('teams/' + tid + '/info/clubName').set(name); } catch (e) {} }
    closeModal(); loadClubsAdminView();
  } catch (e) { if (err) err.textContent = 'Hernoemen mislukt. Probeer opnieuw.'; }
}
function showAppointClubAdmin(cid) {
  openModal(`<h3>${icI(IC.shield)} Clubbeheerder aanstellen</h3>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Vul het e-mailadres in van de persoon. Die moet zich al minstens één keer aangemeld hebben in Match Delegate met dat e-mailadres, zodat we het account kennen.</p>
    <div class="fg"><label>E-mailadres</label><input id="appoint-email" type="email" placeholder="naam@voorbeeld.be" autocomplete="off" autofocus></div>
    <div class="auth-err" id="ap-err"></div>
    <button class="btn btn-green" onclick="doAppointClubAdmin('${cid}')">Aanstellen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doAppointClubAdmin(cid) {
  if (!isOwner || !fbdb) return;
  const email = ((document.getElementById('appoint-email') || {}).value || '').trim().toLowerCase();
  const err = document.getElementById('ap-err');
  if (!email) { if (err) err.textContent = 'Vul een e-mailadres in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    // E-mail -> uid opzoeken via de owner-leesbare index.
    const idx = (await fbOnce(fbdb.ref('usersByEmail'))).val() || {};
    const uid = Object.keys(idx).find(u => ((idx[u] && idx[u].email) || '').toLowerCase() === email);
    if (!uid) { if (err) err.textContent = 'Geen account met dat e-mailadres gevonden. Vraag de persoon eerst één keer in te loggen.'; return; }
    await fbdb.ref('clubs/' + cid + '/admins/' + uid).set(true);
    await fbdb.ref('users/' + uid + '/clubs/' + cid).set('admin');
    closeModal(); loadClubsAdminView();
  } catch (e) { if (err) err.textContent = 'Aanstellen mislukt. Zijn de rules gepubliceerd?'; }
}
function removeClubAdmin(cid, uid) {
  if (!isOwner || !fbdb) return;
  showConfirm('Deze clubbeheerder verwijderen?', async () => {
    try {
      await fbdb.ref('clubs/' + cid + '/admins/' + uid).remove();
      try { await fbdb.ref('users/' + uid + '/clubs/' + cid).remove(); } catch (e) {}
      loadClubsAdminView();
    } catch (e) { showToast('Verwijderen mislukt.', 'err'); }
  }, 'Verwijderen');
}
// ===================== ALLE GEBRUIKERS (view) =====================
// Systeembreed overzicht van alle gebruikers per ploeg, voor de eigenaar. Vervangt de
// vroegere showAllUsersModal()-modal door een apart scherm: schaalt beter bij veel ploegen
// dankzij een zoekveld en per-ploeg inklapbare secties i.p.v. één lange platte lijst.
function renderAllUsers() {
  setTimeout(loadAllUsersView, 0);
  return `<div class="hdr"><button class="back" onclick="go('beheer')">‹</button><h1>${icI(IC.players)} Alle gebruikers</h1></div>
  <div class="content">
    <div class="fg" style="margin-bottom:16px"><input id="allusers-search" type="text" placeholder="Zoek op naam of e-mail..." oninput="filterAllUsersView(this.value)"></div>
    <div id="allusers-view-list"><p style="text-align:center;color:var(--txt2)">Laden...</p></div>
  </div>`;
}
async function loadAllUsersView() {
  const el = document.getElementById('allusers-view-list');
  if (!el || !isOwner || !fbdb) return;
  try {
    const [teamsSnap, approvedSnap, ownerSnap] = await Promise.all([
      fbOnce(fbdb.ref('teams')),
      fbOnce(fbdb.ref('approvedAdmins')),
      fbOnce(fbdb.ref('owner')),
    ]);
    const teamsVal = teamsSnap.val() || {};
    const approvedVal = approvedSnap.val() || {};
    const theOwnerUid = ownerSnap.val();
    const approvedUids = new Set(Object.keys(approvedVal));

    // Blokje bovenaan: wie mag ploegen aanmaken.
    // Oud formaat (true) → naam opzoeken via /users/
    const resolveApprovedUser = async (uid) => {
      const entry = approvedVal[uid];
      if (entry && typeof entry === 'object' && entry.name) return { uid, name: entry.name, email: entry.email || '' };
      try {
        const s = await fbOnce(fbdb.ref('users/' + uid));
        const u = s.val() || {};
        return { uid, name: u.displayName || u.name || uid, email: u.email || '' };
      } catch (_) { return { uid, name: uid, email: '' }; }
    };

    const canCreate = [];
    if (theOwnerUid) {
      const o = await resolveApprovedUser(theOwnerUid);
      const ownerName = (approvedVal[theOwnerUid] && approvedVal[theOwnerUid].name) || (currentUser && currentUser.displayName) || o.name;
      const ownerEmail = (approvedVal[theOwnerUid] && approvedVal[theOwnerUid].email) || (currentUser && currentUser.email) || o.email;
      canCreate.push(`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr)">
        <span style="flex:1;font-size:14px"><b>${esc(ownerName)}</b><br><small style="color:var(--txt2)">${esc(ownerEmail)}</small></span>
        <span class="ts-role admin" style="color:#7c3aed">${icI(IC.shield)} Eigenaar</span>
      </div>`);
    }
    const approvedResolved = await Promise.all([...approvedUids].filter(u => u !== theOwnerUid).map(resolveApprovedUser));
    for (const a of approvedResolved) {
      canCreate.push(`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr)">
        <span style="flex:1;font-size:14px"><b>${esc(a.name)}</b><br><small style="color:var(--txt2)">${esc(a.email)}</small></span>
        <span class="ts-role admin">${icI(IC.shield)} Beheerder</span>
      </div>`);
    }
    const topBlock = `<div style="margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Mogen ploegen aanmaken</div>
      ${canCreate.length ? canCreate.join('') : '<p style="color:var(--txt2);font-size:13px">Geen.</p>'}
    </div><hr style="margin-bottom:16px">`;

    // Per ploeg, als inklapbare sectie
    const teamIds = Object.keys(teamsVal);
    const memberInfoSnaps = await Promise.all(
      teamIds.map(tid => fbOnce(fbdb.ref('memberInfo/' + tid)).catch(() => null))
    );

    const sections = [];
    for (let i = 0; i < teamIds.length; i++) {
      const tid = teamIds[i];
      const team = teamsVal[tid] || {};
      const members = team.members || {};
      const info = (memberInfoSnaps[i] && memberInfoSnaps[i].val()) || {};
      const clubName = (team.club && team.club.name) || tid;
      const uids = Object.keys(members).sort((a, b) =>
        (members[a] === 'admin' ? 0 : 1) - (members[b] === 'admin' ? 0 : 1));
      if (!uids.length) continue;

      const users = uids.map(uid => ({ naam: (info[uid] || {}).name || '(onbekend)', email: (info[uid] || {}).email || '', role: members[uid] }));
      const rows = users.map(u => {
        const roleBadge = u.role === 'admin'
          ? `<span class="ts-role admin">${icI(IC.edit)} Co-beheerder</span>`
          : `<span class="ts-role viewer">${icI(IC.eye)} Kijker</span>`;
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr)">
          <span style="flex:1;font-size:14px"><b>${esc(u.naam)}</b><br><small style="color:var(--txt2)">${esc(u.email)}</small></span>
          ${roleBadge}
        </div>`;
      });
      const searchBlob = users.map(u => (u.naam + ' ' + u.email).toLowerCase()).join(' | ');
      sections.push(`<details class="card allusers-team" data-search="${esc(searchBlob)}" style="margin-bottom:12px" open>
        <summary style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <span style="flex:1;font-size:13px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px">${esc(clubName)} <span style="font-weight:400;text-transform:none">(${uids.length})</span></span>
          <button class="btn btn-red btn-sm" onclick="event.preventDefault();event.stopPropagation();ownerDeleteTeam('${tid}','${esc(clubName)}')">Verwijderen</button>
        </summary>
        <div style="margin-top:10px">${rows.join('')}</div>
      </details>`);
    }

    el.innerHTML = topBlock + (sections.length ? sections.join('') : '<p style="text-align:center;color:var(--txt2)">Geen ploegen met leden.</p>');
  } catch (e) {
    console.error('loadAllUsersView fout:', e);
    el.innerHTML = `<p style="text-align:center;color:var(--org2)">Kon de gebruikers niet laden. Probeer opnieuw.</p>`;
  }
}
// Filtert de ploeg-secties op naam/e-mail; een matchende sectie klapt open, de rest verdwijnt.
function filterAllUsersView(q) {
  const query = (q || '').trim().toLowerCase();
  document.querySelectorAll('.allusers-team').forEach(sec => {
    const isMatch = !query || (sec.getAttribute('data-search') || '').includes(query);
    sec.style.display = isMatch ? '' : 'none';
    if (query && isMatch) sec.open = true;
  });
}
// ===================== SPELER OVERZETTEN (eigenaarstool) =====================
// Verplaatst een speler permanent van de roster van de ene ploeg naar een andere (bv. een
// jeugdspeler die na een seizoen doorschuift naar een oudere leeftijdscategorie), met behoud
// van een blijvende speleridentiteit (globalId) zodat het carrière-overzicht in
// loadPlayerDetail() (stats-settings.js) de wedstrijden bij beide ploegen kan samenbrengen.
// De clubbeheerder mag dit binnen de ploegen van zijn eigen club (fase 2c; voorheen owner-only).
let ptState = null;
function renderPlayerTransfer() {
  // Speler overzetten is een club-operatie (binnen de ploegen van één club) — toegankelijk voor
  // de clubbeheerder (de eigenaar is dat ook voor zijn club). Gescoped op _clubBeheerId.
  const clubIds = Object.keys(myClubs || {});
  if (!clubIds.length) return '<div class="hdr"><button class="back" onclick="go(\'clubbeheer\')">‹</button><h1>Speler overzetten</h1></div><div class="content"><p style="text-align:center;color:var(--txt2)">Geen toegang.</p></div>';
  setTimeout(loadPlayerTransferView, 0);
  return `<div class="hdr"><button class="back" onclick="go('clubbeheer')">‹</button><h1>${icI(IC.swap)} Speler overzetten</h1></div>
  <div class="content" id="playertransfer-content"><p style="text-align:center;color:var(--txt2)">Laden...</p></div>`;
}
// teams/{id}/roster staat in Firebase soms als array (via de gewone lokale sync,
// cloudOnLocalTeamsSave), soms als object met een push-id-sleutel (een ploeg net aangemaakt via
// de admin-aanmaakflow in showRequestAdminModal — zie createNewCloudTeam). Beide vormen normaliseren
// naar een array, zodat lezen én terugschrijven (doTransferPlayer) consistent werken.
function normalizeRosterArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : Object.values(val);
}
async function loadPlayerTransferView() {
  const el = document.getElementById('playertransfer-content');
  if (!el || !fbdb) return;
  const clubIds = Object.keys(myClubs || {});
  if (!clubIds.length) return;
  const clubId = (_clubBeheerId && myClubs[_clubBeheerId]) ? _clubBeheerId : clubIds[0];
  try {
    // Via de club-index i.p.v. een globale /teams-lezing: dat laatste is enkel voor de eigenaar
    // leesbaar, terwijl clubs/{id}/teams door de clubbeheerder gelezen mag worden (vooruit-
    // compatibel met fase 2d). Enkel ploegen van DEZE club, zodat een transfer binnen de club blijft.
    const clubTeams = (await fbOnce(fbdb.ref('clubs/' + clubId + '/teams'))).val() || {};
    const teamIds = Object.keys(clubTeams);
    const teams = (await Promise.all(teamIds.map(async id => {
      try {
        const t = (await fbOnce(fbdb.ref('teams/' + id))).val() || {};
        const rosterArr = normalizeRosterArray(t.roster);
        const roster = rosterArr[0] || null;
        // Ook ploegen zonder spelers tonen (bv. net aangemaakt) — enkel zonder roster-node (naam onbekend) overslaan.
        return { id, name: roster && roster.name, players: (roster && roster.players) || [] };
      } catch (e) { return null; }
    }))).filter(t => t && t.name).sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    if (teams.length < 2) { el.innerHTML = '<p style="text-align:center;color:var(--txt2)">Je hebt minstens twee ploegen in deze club nodig om een speler over te zetten.</p>'; return; }
    ptState = { teams, srcTeamId: teams[0].id, dstTeamId: '', playerId: '' };
    el.innerHTML = renderPlayerTransferForm();
  } catch (e) {
    el.innerHTML = '<p style="text-align:center;color:var(--org2)">Kon de ploegen niet laden. Probeer opnieuw.</p>';
  }
}
function playerLabel(p) { return ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.name || '(naamloos)'; }
function renderPlayerTransferForm() {
  const s = ptState; if (!s) return '';
  const srcTeam = s.teams.find(t => t.id === s.srcTeamId);
  const players = srcTeam ? srcTeam.players : [];
  const dstOptions = s.teams.filter(t => t.id !== s.srcTeamId);
  if (!dstOptions.some(t => t.id === s.dstTeamId)) s.dstTeamId = (dstOptions[0] || {}).id || '';
  return `
    <div class="card">
      <div class="fg"><label>Van ploeg</label>
        <select onchange="ptSrcChange(this.value)">${s.teams.map(t => `<option value="${esc(t.id)}" ${s.srcTeamId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>
      <div class="fg"><label>Speler</label>
        <select onchange="ptState.playerId=this.value">
          <option value="">Kies een speler…</option>
          ${players.map(p => `<option value="${esc(p.id)}" ${s.playerId===p.id?'selected':''}>${esc(playerLabel(p))}${p.number?' · '+esc(p.number):''}</option>`).join('')}
        </select></div>
      <div class="fg" style="margin-bottom:0"><label>Naar ploeg</label>
        ${dstOptions.length ? `<select onchange="ptState.dstTeamId=this.value">${dstOptions.map(t => `<option value="${esc(t.id)}" ${s.dstTeamId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select>` : '<p style="color:var(--txt2);font-size:13px;margin:0">Geen andere ploeg beschikbaar.</p>'}</div>
    </div>
    <button class="btn btn-green" onclick="confirmTransferPlayer()">${icI(IC.swap)} Overzetten</button>
    <p style="font-size:12px;color:var(--txt2);margin-top:10px">De speler wordt uit de spelerslijst van de bronploeg verwijderd en toegevoegd aan de doelploeg. Bestaande wedstrijden en statistieken bij de bronploeg blijven behouden.</p>`;
}
function ptSrcChange(val) {
  ptState.srcTeamId = val; ptState.playerId = '';
  if (ptState.dstTeamId === val) ptState.dstTeamId = '';
  // Enkel het formulier herbouwen met de al-geladen ptState — een volledige render() zou
  // via renderPlayerTransfer() opnieuw loadPlayerTransferView() triggeren, dat ptState.srcTeamId
  // meteen terug op de eerste ploeg (België) zou zetten en de keuze onmogelijk maakte.
  const el = document.getElementById('playertransfer-content');
  if (el) el.innerHTML = renderPlayerTransferForm();
}
function confirmTransferPlayer() {
  const s = ptState;
  if (!s || !s.playerId) { showToast('Kies een speler.', 'err'); return; }
  if (!s.dstTeamId || s.dstTeamId === s.srcTeamId) { showToast('Kies een andere doelploeg.', 'err'); return; }
  const srcTeam = s.teams.find(t => t.id === s.srcTeamId);
  const player = srcTeam && srcTeam.players.find(p => p.id === s.playerId);
  const dstTeam = s.teams.find(t => t.id === s.dstTeamId);
  if (!player || !dstTeam) return;
  openModal(`<h3>Speler overzetten?</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px"><b>${esc(playerLabel(player))}</b> gaat van <b>${esc(srcTeam.name)}</b> naar <b>${esc(dstTeam.name)}</b>.<br><br>Bestaande wedstrijden bij ${esc(srcTeam.name)} blijven behouden.</p>
    <button class="btn btn-green" onclick="doTransferPlayer()">${icI(IC.check)} Ja, overzetten</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doTransferPlayer() {
  const s = ptState;
  if (!s || !isOwner || !fbdb) return;
  closeModal();
  try {
    const [srcSnap, dstSnap] = await Promise.all([
      fbOnce(fbdb.ref('teams/' + s.srcTeamId + '/roster')),
      fbOnce(fbdb.ref('teams/' + s.dstTeamId + '/roster')),
    ]);
    // Normaliseren naar array (zie normalizeRosterArray hierboven) — en in dat array-formaat
    // terugschrijven, ook als de ploeg tot nu toe het object-formaat had. Beide vormen worden
    // door elke lezer (hier, loadPlayerTransferView, applyCloudTeams) al tolerant ingelezen.
    const srcRoster = normalizeRosterArray(srcSnap.val()), dstRoster = normalizeRosterArray(dstSnap.val());
    if (!srcRoster[0] || !dstRoster[0]) {
      showToast('Kon de ploegdata niet laden, probeer opnieuw.', 'err'); return;
    }
    const player = (srcRoster[0].players || []).find(p => p.id === s.playerId);
    if (!player) { showToast('Speler niet gevonden, probeer opnieuw.', 'err'); return; }
    const globalId = player.globalId || uid();
    const newPlayer = Object.assign({}, player, { id: uid(), globalId });
    srcRoster[0].players = (srcRoster[0].players || []).filter(p => p.id !== s.playerId);
    dstRoster[0].players = (dstRoster[0].players || []).concat([newPlayer]);
    await Promise.all([
      fbdb.ref('teams/' + s.srcTeamId + '/roster').set(srcRoster),
      fbdb.ref('teams/' + s.dstTeamId + '/roster').set(dstRoster),
    ]);
    ptState = null;
    showToast('Speler overgezet.', 'ok');
    go('beheer');
  } catch (e) {
    showToast('Overzetten mislukt, probeer opnieuw.', 'err');
  }
}
function toggleViewerMode() {
  viewerMode = !viewerMode;
  closeModal();
  updateCloudChip();
  if (view === 'live' || view === 'detail' || view === 'home' || view === 'beheer') render();
}
function cloudLogout() {
  clearLocalDeviceData(currentUser ? currentUser.uid : null);
  try { fbauth.signOut(); } catch (e) {}
  activeTeamId = null; userTeams = {}; isAdmin = false; isGuest = false; viewerMode = false;
  closeModal();
}
function authDoSignOut() {
  clearLocalDeviceData(currentUser ? currentUser.uid : null);
  try { fbauth.signOut(); } catch (e) {}
  activeTeamId = null; userTeams = {}; isAdmin = false; isGuest = false; viewerMode = false;
}

// Cryptografisch sterke uitnodigingscode (6 tekens, A-Z0-9) i.p.v. Math.random(),
// die niet ontworpen is voor beveiligingsdoeleinden.
function genInviteToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}
// ---- Ploeg aanmaken ----
async function createTeam(name, clubId, joinAsMember) {
  if (joinAsMember === undefined) joinAsMember = true; // standaard: maker wordt co-beheerder (lid)
  if (!currentUser || !fbdb) return;
  name = (name || '').trim(); if (!name) return;
  const teamId = fbdb.ref('teams').push().key;
  const uid = currentUser.uid;
  const token = genInviteToken();
  const initialRosterId = fbdb.ref('teams/' + teamId + '/roster').push().key;
  const info = { name, createdBy: uid, createdAt: Date.now(), inviteToken: token };
  if (clubId) {
    info.clubId = clubId; // clubmodel: koppel meteen aan de club (fase 2)
    // Clubnaam gedenormaliseerd op de ploeg zetten (fase 2f) zodat ook kijkers — die de clubs-node
    // niet mogen lezen — de clubnaam zien in de header en de groepering op het ploegkeuzescherm.
    try { const cn = (await fbOnce(fbdb.ref('clubs/' + clubId + '/info/name'))).val(); if (cn) info.clubName = cn; } catch (e) {}
  }
  await fbdb.ref('teams/' + teamId).set({
    info,
    // Hybride (fase 2d): de clubbeheerder kan kiezen om de ploeg zelf mee te beheren (als lid) of
    // niet (puur via zijn clubrol). Bij niet-lid blijft members leeg tot een trainer aangesteld wordt.
    members: joinAsMember ? { [uid]: 'admin' } : {},
    club: { name, logo: '', theme: null },
    roster: { [initialRosterId]: { id: initialRosterId, name, players: [], trainers: [], fromCloud: true } }
  });
  // Registreer de ploeg in de club-index.
  if (clubId) { try { await fbdb.ref('clubs/' + clubId + '/teams/' + teamId).set(true); } catch (e) {} }
  // Sla uitnodigingstoken ook op als directe lookup (geen query nodig bij vervoegen)
  await fbdb.ref('invites/' + token).set({ teamId, createdBy: uid, createdAt: Date.now() });
  if (joinAsMember) {
    await fbdb.ref('users/' + uid + '/teams/' + teamId).set('admin');
    userTeams[teamId] = 'admin';
    await selectTeam(teamId);
  } else {
    // Clubbeheerder beheert de ploeg via zijn clubrol, niet als lid → terug naar het cluboverzicht,
    // waar de nieuwe ploeg nu verschijnt.
    go('clubbeheer');
  }
}

// ---- Ploeg vervoegen via uitnodigingscode ----
async function joinTeamByToken(token) {
  if (!currentUser || !fbdb) return null;
  token = (token || '').trim().toUpperCase();
  // fbOnce() i.p.v. een ruwe once('value'): offline resolvet die nooit, waardoor de hele
  // opstartflow (onAuthChanged) hier voor altijd zou blijven hangen (eeuwig blanco scherm
  // na de splash) — zie de fbOnce-toelichting in core.js.
  let snap;
  try { snap = await fbOnce(fbdb.ref('invites/' + token)); } catch (e) { return 'offline'; }
  if (!snap.exists()) return 'not_found';
  const teamId = snap.val().teamId;
  if (!teamId) return 'not_found';
  const uid = currentUser.uid;
  let existing;
  try { existing = await fbOnce(fbdb.ref('teams/' + teamId + '/members/' + uid)); } catch (e) { return 'offline'; }
  if (!existing.exists()) {
    await fbdb.ref('teams/' + teamId + '/members/' + uid).set('viewer');
    await fbdb.ref('users/' + uid + '/teams/' + teamId).set('viewer');
    userTeams[teamId] = 'viewer';
  } else {
    const role = existing.val();
    userTeams[teamId] = role;
    // Cache herstellen (kan leeg zijn na een bug of herinstallatie)
    await fbdb.ref('users/' + uid + '/teams/' + teamId).set(role).catch(() => {});
  }
  await selectTeam(teamId);
  return 'ok';
}

// ---- Uitnodigingslink tonen ----
async function showInviteModal(teamId) {
  // Bepaal welke ploeg: meegegeven of actieve ploeg
  const tid = teamId || activeTeamId;
  if (!tid) return;

  // Als beheerder meerdere ploegen heeft, toon eerst een keuze
  const adminTeams = Object.entries(userTeams).filter(([, role]) => role === 'admin');
  if (!teamId && !activeTeamId && adminTeams.length > 1) {
    // Laad namen van alle beheerde ploegen
    openModal(`<h3>${icI(IC.link)} Kies een ploeg</h3>
      <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Voor welke ploeg wil je de uitnodigingscode delen?</p>
      <div id="invite-team-list"><p style="text-align:center;color:var(--txt2)">Laden...</p></div>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    const listEl = document.getElementById('invite-team-list');
    if (listEl) {
      const items = await Promise.all(adminTeams.map(async ([id]) => {
        try { const s = await fbOnce(fbdb.ref('teams/' + id + '/info/name')); return { id, name: s.val() || id }; }
        catch (e) { return { id, name: id }; }
      }));
      if (listEl) listEl.innerHTML = items.map(t =>
        `<button class="btn btn-pale" style="margin-bottom:8px" onclick="showInviteModal('${t.id}')">${esc(t.name)}</button>`
      ).join('');
    }
    return;
  }

  // Haal token op en zorg dat het ook in /invites/ staat
  let info, token;
  try {
    const infoSnap = await fbOnce(fbdb.ref('teams/' + tid + '/info'));
    info = infoSnap.val() || {};
    token = info.inviteToken || '???';
    // Zorg dat /invites/{token} bestaat (voor ploegen aangemaakt vóór deze fix)
    const invSnap = await fbOnce(fbdb.ref('invites/' + token));
    if (!invSnap.exists() && currentUser) {
      await fbdb.ref('invites/' + token).set({ teamId: tid, createdBy: currentUser.uid, createdAt: Date.now() });
    }
  } catch (e) {
    showToast('Kon de uitnodiging niet laden (geen verbinding). Probeer het later opnieuw.', 'err');
    return;
  }
  const teamName = info.name || 'Ploeg';

  const joinUrl = 'https://timbuyse.github.io/MatchDelegate/?join=' + token;
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&ecc=M&data=' + encodeURIComponent(joinUrl);
  const shareText = 'Volg ' + teamName + ' via Match Delegate. Open de link of gebruik code ' + token + '.';
  openModal(`<h3>${icI(IC.link)} Uitnodiging — ${esc(teamName)}</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Scan de QR-code of deel de link. Werkt ook voor mensen zonder account.</p>
    <div id="invite-qr-wrap" style="display:flex;justify-content:center;margin-bottom:12px">
      <img src="${qrUrl}" width="180" height="180" style="border-radius:10px;background:#fff;padding:6px" alt="QR-code uitnodiging" onerror="this.closest('#invite-qr-wrap').style.display='none';document.getElementById('invite-qr-fallback').style.display=''">
    </div>
    <p id="invite-qr-fallback" style="display:none;text-align:center;color:var(--org2);font-size:12px;margin-bottom:8px">${icI(IC.warn)} QR-code niet beschikbaar — gebruik de code of link hieronder.</p>
    <div class="invite-code" style="margin-bottom:8px">${token}</div>
    <button class="btn btn-green" onclick="(navigator.share ? navigator.share({title:'Match Delegate',url:'${joinUrl}',text:'${shareText.replace(/'/g,"\\'")}'}):navigator.clipboard.writeText('${joinUrl}').then(()=>showToast('Link gekopieerd!','ok')))">${icI(IC.share)} Delen / Link kopiëren</button>
    ${isAdmin ? `<button class="btn btn-orgpale" style="margin-top:8px" onclick="confirmRegenerateInviteToken('${tid}')">${icI(IC.warn)} Nieuwe code genereren (oude wordt ongeldig)</button>` : ''}
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Sluiten</button>`);
}
function confirmRegenerateInviteToken(tid) {
  openModal(`<h3>${icI(IC.warn)} Nieuwe uitnodigingscode?</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px">De huidige code/link werkt daarna niet meer. Gebruik dit als een oude code per ongeluk verspreid raakte.</p>
    <button class="btn btn-org" onclick="doRegenerateInviteToken('${tid}')">${icI(IC.warn)} Nieuwe code genereren</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="showInviteModal('${tid}')">Annuleren</button>`);
}
async function doRegenerateInviteToken(tid) {
  if (!isAdmin || !tid || !fbdb) return;
  try {
    const infoSnap = await fbOnce(fbdb.ref('teams/' + tid + '/info'));
    const oldToken = (infoSnap.val() || {}).inviteToken;
    const newToken = genInviteToken();
    await fbdb.ref('teams/' + tid + '/info/inviteToken').set(newToken);
    await fbdb.ref('invites/' + newToken).set({ teamId: tid, createdBy: currentUser.uid, createdAt: Date.now() });
    if (oldToken) await fbdb.ref('invites/' + oldToken).remove().catch(() => {});
    showToast('Nieuwe code gegenereerd.', 'ok');
  } catch (e) { showToast('Genereren mislukt, probeer opnieuw.', 'err'); }
  showInviteModal(tid);
}

// ---- Kijker vraagt co-beheer aan ----
function confirmRequestCoAdmin() {
  openModal(`<h3>${icI(IC.edit)} Co-beheer aanvragen</h3>
    <p style="color:var(--txt2);font-size:14px;margin-bottom:16px">Je vraagt de beheerder van <b>${esc(getClubName() || 'deze ploeg')}</b> om co-beheerder te worden. De beheerder moet dit eerst goedkeuren voordat je wedstrijden kan aanmaken of bewerken.</p>
    <button class="btn btn-green" onclick="closeModal();requestCoAdmin()">Aanvraag versturen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function requestCoAdmin() {
  const tid = activeTeamId;
  if (!tid || !currentUser || !fbdb) return;
  const ref = fbdb.ref('teamAdminRequests/' + tid + '/' + currentUser.uid);
  let snap;
  try { snap = await fbOnce(ref); }
  catch (e) { showToast('Kon niet controleren of er al een aanvraag loopt (geen verbinding). Probeer later opnieuw.', 'err'); return; }
  if (snap.exists()) { showToast('Je aanvraag is al verstuurd. Wacht op goedkeuring van de beheerder.', 'err'); return; }
  try {
    await ref.set({ name: currentUser.displayName || '', email: currentUser.email || '', requestedAt: Date.now() });
    showToast('Aanvraag verstuurd. De beheerder ontvangt een melding.', 'ok');
  } catch (e) { showToast('Aanvraag mislukt, probeer opnieuw.', 'err'); }
}

// ---- Kijkers van de actieve ploeg tonen (enkel beheerder) ----
async function showMembersModal() {
  const tid = activeTeamId;
  if (!tid || !isAdmin) return;
  const teamName = getClubName() || 'deze ploeg';
  openModal(`<h3>${icI(IC.players)} Leden — ${esc(teamName)}</h3>
    <div class="fg" style="margin-bottom:10px"><input id="members-search" type="text" placeholder="Zoek op naam of e-mail..." oninput="filterMembersList(this.value)"></div>
    <div id="members-list"><p style="text-align:center;color:var(--txt2)">Laden...</p></div>
    <button class="btn btn-gray" style="margin-top:10px" onclick="closeModal()">Sluiten</button>`);
  try {
    const [miSnap, memSnap, reqSnap] = await Promise.all([
      fbOnce(fbdb.ref('memberInfo/' + tid)),
      fbOnce(fbdb.ref('teams/' + tid + '/members')),
      fbOnce(fbdb.ref('teamAdminRequests/' + tid)),
    ]);
    const info = miSnap.val() || {};
    const members = memSnap.val() || {};
    const requests = reqSnap.val() || {};
    // Haal ontbrekende memberInfo op via users-node (enkel voor leden zonder info)
    const missingUids = Object.keys(members).filter(u => !info[u]);
    await Promise.all(missingUids.map(async u => {
      try {
        const s = await fbOnce(fbdb.ref('users/' + u));
        const d = s.val();
        if (d) info[u] = { name: d.displayName || d.name || '', email: d.email || '' };
      } catch (e) {}
    }));
    // Sorteer: beheerders eerst, dan kijkers
    const uids = Object.keys(members).sort((a, b) =>
      (members[a] === 'admin' ? 0 : 1) - (members[b] === 'admin' ? 0 : 1));
    const rows = uids.map(uid => {
      const role = members[uid];
      const mi = info[uid] || {};
      const naam = mi.name || '(naam nog niet gekend)';
      const email = mi.email || '(e-mail nog niet gekend)';
      const badge = role === 'admin'
        ? `<span class="ts-role admin">${icI(IC.edit)} Co-beheerder</span>`
        : `<span class="ts-role viewer">${icI(IC.eye)} Kijker</span>`;
      const btns = role !== 'admin'
        ? `<button class="btn btn-pale btn-sm" onclick="promoteMember('${uid}')">Maak co-beheerder</button>
           <button class="btn btn-red btn-sm" onclick="removeMember('${uid}')">Verwijderen</button>`
        : (uid !== currentUser?.uid
          ? `<button class="btn btn-gray btn-sm" onclick="demoteMember('${uid}')">Maak kijker</button>`
          : '');
      return `<div class="ts-team-row ml-row" data-search="${esc((naam + ' ' + email).toLowerCase())}" style="cursor:default;flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="flex:1;font-size:15px;font-weight:700"><b>${esc(naam)}</b><br><small style="color:var(--txt2);font-weight:400">${esc(email)}</small></span>
          ${badge}
        </div>
        ${btns ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${btns}</div>` : ''}
      </div>`;
    });
    // Openstaande aanvragen
    const reqUids = Object.keys(requests).filter(u => !members[u] || members[u] !== 'admin');
    const reqRows = reqUids.map(uid => {
      const r = requests[uid];
      const naam = r.name || '(geen naam)';
      const email = r.email || '';
      return `<div class="ts-team-row ml-row" data-search="${esc((naam + ' ' + email).toLowerCase())}" style="cursor:default;border-left:3px solid var(--org);flex-direction:column;align-items:stretch;gap:8px">
        <div><b>${esc(naam)}</b><br><small style="color:var(--txt2)">${esc(email)}</small><br><small style="color:var(--org)">Vraagt co-beheer aan</small></div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-green btn-sm" onclick="approveCoAdmin('${uid}')">Goedkeuren</button>
          <button class="btn btn-red btn-sm" onclick="rejectCoAdmin('${uid}')">Weigeren</button>
        </div>
      </div>`;
    });
    const viewers = uids.filter(u => members[u] !== 'admin').length;
    const el = document.getElementById('members-list');
    if (el) el.innerHTML =
      (reqRows.length ? `<p style="font-size:12px;font-weight:700;color:var(--org);margin-bottom:6px">OPENSTAANDE AANVRAGEN</p>${reqRows.join('')}<hr style="margin:10px 0">` : '')
      + (rows.length ? rows.join('') : '<p style="text-align:center;color:var(--txt2)">Nog niemand vervoegd.</p>')
      + `<p style="text-align:center;color:var(--txt2);font-size:12px;margin-top:10px">${viewers} kijker${viewers===1?'':'s'} · ${uids.filter(u=>members[u]==='admin').length} co-beheerder${uids.filter(u=>members[u]==='admin').length===1?'':'s'}</p>`;
  } catch (e) {
    console.error('Leden laden mislukt:', e);
    const el = document.getElementById('members-list');
    if (el) el.innerHTML = '<p style="text-align:center;color:var(--org2)">Kon de lijst niet laden.</p>';
  }
}

// Filtert de leden/aanvragen-rijen in de Leden-modal op naam/e-mail.
function filterMembersList(q) {
  const query = (q || '').trim().toLowerCase();
  document.querySelectorAll('#members-list .ml-row').forEach(row => {
    row.style.display = (!query || (row.getAttribute('data-search') || '').includes(query)) ? '' : 'none';
  });
}
async function approveCoAdmin(uid) {
  const tid = activeTeamId;
  if (!isAdmin || !tid || !fbdb) return;
  try {
    await fbdb.ref('teams/' + tid + '/members/' + uid).set('admin');
    await fbdb.ref('teamAdminRequests/' + tid + '/' + uid).remove();
    showMembersModal();
  } catch (e) { showToast('Goedkeuren mislukt, probeer opnieuw.', 'err'); }
}

async function rejectCoAdmin(uid) {
  const tid = activeTeamId;
  if (!isAdmin || !tid || !fbdb) return;
  try {
    await fbdb.ref('teamAdminRequests/' + tid + '/' + uid).remove();
    showMembersModal();
  } catch (e) { showToast('Weigeren mislukt, probeer opnieuw.', 'err'); }
}

async function demoteMember(uid) {
  if (!isAdmin || !activeTeamId || !fbdb) return;
  showConfirm('Wil je deze co-beheerder terugzetten naar kijker?', async () => {
    try {
      await fbdb.ref('teams/' + activeTeamId + '/members/' + uid).set('viewer');
      showMembersModal();
    } catch (e) { showToast('Degraderen mislukt, probeer opnieuw.', 'err'); }
  }, 'Terugzetten', 'btn-org');
}

async function promoteMember(uid) {
  if (!isAdmin || !activeTeamId || !fbdb) return;
  showConfirm('Wil je deze persoon promoveren tot co-beheerder? Ze kunnen dan wedstrijden aanmaken en bewerken.', async () => {
    try {
      await fbdb.ref('teams/' + activeTeamId + '/members/' + uid).set('admin');
      showMembersModal();
    } catch (e) { showToast('Promoveren mislukt, probeer opnieuw.', 'err'); }
  }, 'Promoveren', 'btn-green');
}
async function removeMember(uid) {
  if (!isAdmin || !activeTeamId || !fbdb) return;
  showConfirm('Ben je zeker dat je deze kijker wil verwijderen? Ze verliezen toegang tot de ploeg.', async () => {
    try {
      await fbdb.ref('teams/' + activeTeamId + '/members/' + uid).remove();
      await fbdb.ref('memberInfo/' + activeTeamId + '/' + uid).remove();
      fbdb.ref('users/' + uid + '/teams/' + activeTeamId).remove().catch(() => {});
      showMembersModal();
    } catch (e) { showToast('Verwijderen mislukt, probeer opnieuw.', 'err'); }
  }, 'Verwijderen');
}

// ===================== AUTH VIEWS =====================
function renderAuth() {
  return `<div class="auth-wrap">
    <div class="auth-hero">
      <div class="auth-hero-dot1"></div>
      <div class="auth-hero-dot2"></div>
      <img src="logo_no_background.png" alt="Match Delegate" class="auth-logo-img">
      <div class="auth-title">Match Delegate</div>
      <div class="auth-sub">Manage &nbsp;·&nbsp; Track &nbsp;·&nbsp; Share</div>
    </div>
    <div class="auth-box" style="max-width:400px;width:100%">
      ${localStorage.getItem('voetbal_pending_join') ? `<div class="nudge" style="margin-bottom:14px">${icI(IC.link)} Je volgt een uitnodigingslink voor een ploeg. Meld je aan, registreer of ga verder als gast om ze te vervoegen.</div>` : ''}
      <div class="auth-welcome">Welkom</div>
      <div class="auth-welcome-sub">Meld aan om verder te gaan</div>
      <div class="auth-tabs">
        <button class="auth-tab act" id="tab-login" onclick="authSwitchTab('login')">Aanmelden</button>
        <button class="auth-tab" id="tab-register" onclick="authSwitchTab('register')">Registreren</button>
      </div>
      <div id="auth-login-form">
        <div class="fg"><label>E-mailadres</label><input id="auth-email" type="email" autocomplete="email" placeholder="naam@example.com"></div>
        <div class="fg fg-pwd"><label>Wachtwoord</label><input id="auth-pwd" type="password" autocomplete="current-password" placeholder="wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
        <div class="auth-err" id="auth-err"></div>
        <button class="btn btn-org" onclick="authDoLogin()">Aanmelden</button>
        <button class="btn btn-gray" style="margin-top:8px" onclick="authForgotPassword()">Wachtwoord vergeten?</button>
      </div>
      <div id="auth-register-form" style="display:none">
        <div class="fg"><label>Naam</label><input id="reg-name" type="text" autocomplete="name" placeholder="Jan Peeters"></div>
        <div class="fg"><label>E-mailadres</label><input id="reg-email" type="email" autocomplete="email" placeholder="naam@example.com"></div>
        <div class="fg fg-pwd"><label>Wachtwoord</label><input id="reg-pwd" type="password" autocomplete="new-password" placeholder="min. 6 tekens"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
        <div class="fg fg-pwd"><label>Wachtwoord bevestigen</label><input id="reg-pwd2" type="password" autocomplete="new-password" placeholder="herhaal wachtwoord"><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
        <div class="auth-err" id="reg-err"></div>
        <button class="btn btn-org" onclick="authDoRegister()">Account aanmaken</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin:14px 0">
        <div style="flex:1;height:1px;background:var(--bdr)"></div>
        <span style="font-size:12px;color:var(--txt2)">of</span>
        <div style="flex:1;height:1px;background:var(--bdr)"></div>
      </div>
      <button class="btn btn-pale" onclick="authSignInAsGuest()">${icI(IC.eye)} Verder als gast</button>
      <p style="font-size:12px;color:var(--txt2);text-align:center;margin-top:8px">Enkel een live wedstrijd volgen? Dat kan ook zonder account.</p>
    </div>
    <div style="width:100%;max-width:400px">
      <button class="btn btn-pale" style="width:100%" onclick="go('handleiding')">${icI(IC.clipboard)} Handleiding</button>
    </div>
  </div>`;
}

function authSwitchTab(t) {
  document.getElementById('tab-login').classList.toggle('act', t === 'login');
  document.getElementById('tab-register').classList.toggle('act', t === 'register');
  document.getElementById('auth-login-form').style.display = t === 'login' ? '' : 'none';
  document.getElementById('auth-register-form').style.display = t === 'register' ? '' : 'none';
}

function authDoLogin() {
  const email = (document.getElementById('auth-email') || {}).value || '';
  const pwd = (document.getElementById('auth-pwd') || {}).value || '';
  const err = document.getElementById('auth-err');
  if (err) err.textContent = 'Bezig...';
  fbauth.signInWithEmailAndPassword(email, pwd)
    .then(() => { if (err) err.textContent = ''; })
    .catch(e => { if (err) err.textContent = authErrMsg(e.code); });
}

function authForgotPassword() {
  const email = (document.getElementById('auth-email') || {}).value || '';
  if (!email) { showToast('Vul eerst je e-mailadres in.', 'err'); return; }
  fbauth.sendPasswordResetEmail(email)
    .then(() => showToast('Resetmail verstuurd naar ' + email + '. Controleer ook je spammap.', 'ok'))
    .catch(e => showToast(authErrMsg(e.code), 'err'));
}

async function authDoRegister() {
  const name = (document.getElementById('reg-name') || {}).value || '';
  const email = (document.getElementById('reg-email') || {}).value || '';
  const pwd = (document.getElementById('reg-pwd') || {}).value || '';
  const pwd2 = (document.getElementById('reg-pwd2') || {}).value || '';
  const err = document.getElementById('reg-err');
  if (!name.trim()) { if (err) err.textContent = 'Geef je naam in.'; return; }
  if (pwd.length < 6) { if (err) err.textContent = 'Wachtwoord moet minstens 6 tekens zijn.'; return; }
  if (pwd !== pwd2) { if (err) err.textContent = 'De twee wachtwoorden zijn niet gelijk.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = await fbauth.createUserWithEmailAndPassword(email, pwd);
    await cred.user.updateProfile({ displayName: name.trim() });
    await fbdb.ref('users/' + cred.user.uid).set({ email, displayName: name.trim(), createdAt: Date.now() });
    if (err) err.textContent = '✓ Account aangemaakt!';
  } catch (e) { if (err) err.textContent = authErrMsg(e.code); }
}

function authErrMsg(code) {
  const map = {
    'auth/user-not-found': 'Geen account gevonden met dit e-mailadres.',
    'auth/wrong-password': 'Onjuist wachtwoord.',
    'auth/invalid-email': 'Ongeldig e-mailadres.',
    'auth/email-already-in-use': 'Dit e-mailadres is al in gebruik.',
    'auth/weak-password': 'Wachtwoord moet minstens 6 tekens zijn.',
    'auth/invalid-credential': 'Onjuist e-mailadres of wachtwoord.',
    'auth/too-many-requests': 'Te veel pogingen. Probeer later opnieuw.',
  };
  return map[code] || 'Er ging iets mis. Probeer opnieuw.';
}

function authSignInAsGuest() {
  if (!fbauth) { showToast('Geen verbinding beschikbaar.', 'err'); return; }
  fbauth.signInAnonymously().catch(() => showToast('Aanmelden als gast mislukt, probeer opnieuw.', 'err'));
}

async function guestJoinWithCode() {
  const code = ((document.getElementById('guest-code') || {}).value || '').trim().toUpperCase();
  const err = document.getElementById('guest-err');
  if (!code) { if (err) err.textContent = 'Voer een code in.'; return; }
  if (err) err.textContent = 'Bezig...';
  const result = await joinTeamByToken(code);
  if (result === 'ok') { /* selectTeam navigeert automatisch */ }
  else if (err) err.textContent = 'Code niet gevonden. Controleer de code en probeer opnieuw.';
}

function renderGuestJoin() {
  return `<div class="auth-wrap">
    <div class="auth-logo"><img src="logo.png" alt="Match Delegate" class="auth-logo-img"></div>
    <div class="auth-title">Gastmodus</div>
    <div class="auth-sub">Volg een live wedstrijd zonder account</div>
    <div class="auth-box">
      <div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24;margin-bottom:16px">
        ${icI(IC.eye)} Je bekijkt als gast. Enkel live wedstrijden volgen is mogelijk.
      </div>
      <div class="fg"><label>Uitnodigingscode</label>
        <input id="guest-code" type="text" autocomplete="off" placeholder="bv. ABC123" style="text-transform:uppercase;letter-spacing:2px;font-size:18px;text-align:center">
      </div>
      <div class="auth-err" id="guest-err"></div>
      <button class="btn btn-green" onclick="guestJoinWithCode()">${icI(IC.check)}Verbinden</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="authDoSignOut()">← Terug naar aanmelden</button>
    </div>
  </div>`;
}

// ===================== TEAM SELECT VIEW =====================
function renderTeamSelect() {
  const teamIds = orderedTeamIds(Object.keys(userTeams));
  // Het Beheer-knopje leidt (in de 'system'-context) naar eigenaarstools + "beheerder worden".
  // Voor iemand die al beheerder is maar niet de eigenaar, is dat scherm leeg — dan het knopje verbergen.
  const showBeheerBtn = !ownerUid || isOwner || (!isApprovedAdmin && !viewerMode);
  // Clubnaam tonen boven de ploegen (fase 2f). Bij méér dan één club: echt groeperen met een kopje
  // per club (handig voor een ouder/kijker met kinderen in verschillende clubs) — dan geen herschik.
  // Bij één club: één clubkopje boven de gewone, herschikbare lijst. Bij nog onbekende clubnaam:
  // gewone platte lijst (het kopje verschijnt zodra de naam asynchroon geladen is).
  const distinctClubs = [...new Set(teamIds.map(id => teamClubNames[id]).filter(Boolean))];
  const grouped = distinctClubs.length > 1;
  const canReorder = teamIds.length > 1 && !grouped;
  const clubHdrHtml = cn => `<div style="font-size:12px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 6px">${esc(cn)}</div>`;
  const teamRowHtml = id => {
    const role = userTeams[id];
    const name = teamNames[id] || id;
    const handle = canReorder ? `<span class="ts-drag-handle" onclick="event.stopPropagation()">${icI(IC.grip)}</span>` : '';
    return `<div class="ts-team-row" data-team-id="${id}" onclick="selectTeam('${id}')">
          ${handle}
          <span class="ts-name" id="tsname-${id}">${esc(name)}</span>
          <span class="ts-role ${role}">${role === 'admin' ? `${icI(IC.edit)} Co-beheerder` : `${icI(IC.eye)} Kijker`}</span>
        </div>`;
  };
  let teamRows;
  if (!teamIds.length) {
    teamRows = `<div class="empty"><div class="ei">${icI(IC.players)}</div><p>Je hebt nog geen ploegen.<br>Maak er een aan of voer een uitnodigingscode in.</p></div>`;
  } else if (grouped) {
    const buckets = {}; const order = [];
    teamIds.forEach(id => { const cn = teamClubNames[id] || 'Overige ploegen'; if (!(cn in buckets)) { buckets[cn] = []; order.push(cn); } buckets[cn].push(id); });
    order.sort((a, b) => a === 'Overige ploegen' ? 1 : b === 'Overige ploegen' ? -1 : a.localeCompare(b, 'nl'));
    teamRows = order.map(cn => `<div style="margin-bottom:4px">${clubHdrHtml(cn)}${buckets[cn].map(teamRowHtml).join('')}</div>`).join('');
  } else {
    // Eén (of nog onbekende) club: clubkopje tonen als de naam gekend is, met de herschikbare lijst eronder.
    const header = distinctClubs.length === 1 ? clubHdrHtml(distinctClubs[0]) : '';
    teamRows = header + `<div id="ts-team-list">${teamIds.map(teamRowHtml).join('')}</div>`;
  }
  if (canReorder) setTimeout(initTeamReorder, 0);

  // Ververs namen én clubnamen asynchroon — ook als er al een (mogelijk verouderde) waarde in de
  // cache zit. fbOnce() i.p.v. ruwe once('value'): offline blijft dat anders eeuwig hangen. Een
  // timeout betekent enkel "geen verbinding", niet "ploeg bestaat niet meer" — enkel bij een echte
  // fout opruimen. Als een clubnaam nieuw gekend raakt: één keer herrenderen zodat de groepering
  // per club verschijnt (de volgende pass vindt niets nieuw → geen lus).
  setTimeout(() => {
    let clubChanged = false;
    Promise.all(teamIds.map(id => {
      const el = document.getElementById('tsname-' + id);
      return fbOnce(fbdb.ref('teams/' + id + '/info'))
        .then(s => {
          if (!s.exists()) { pruneDeadTeam(id); return; }
          const info = s.val() || {};
          if (info.name) { teamNames[id] = info.name; if (el) el.textContent = info.name; }
          if (info.clubName && teamClubNames[id] !== info.clubName) { teamClubNames[id] = info.clubName; clubChanged = true; }
        })
        .catch(e => { if (e && e.message !== 'fb-timeout') pruneDeadTeam(id); });
    })).then(() => { if (clubChanged && view === 'teamselect') render(); });
  }, 0);

  return `<div class="ts-wrap">
    <div class="ts-hdr">
      <img src="logo_no_background.png" alt="Match Delegate" class="ts-logo">
      <div class="ts-hdr-text">
        <div class="ts-hdr-name">Match Delegate</div>
        <p>${esc((currentUser && (currentUser.displayName || currentUser.email)) || '')}</p>
      </div>
      ${showBeheerBtn ? `<button class="hdr-gear-beheer" onclick="_beheerFrom=view;_beheerContext='system';go('beheer')" title="Beheer">${icI(IC.edit)} Beheer</button>` : ''}
      <button class="hdr-gear" onclick="_settingsFrom=view;go('settings')" title="Instellingen">${icI(IC.gear)}</button>
    </div>
    <div class="ts-content">
      ${teamIds.length > 0 ? `<div class="sec" style="margin-bottom:10px">Jouw ploegen</div>` : ''}
      ${teamRows}
      ${Object.keys(myClubs || {}).length ? `<div class="sec" style="margin-top:20px;margin-bottom:10px">Clubbeheer</div>
      <button class="btn btn-org" onclick="go('clubbeheer')">${icI(IC.players)} Mijn club beheren</button>` : ''}
      <div class="sec" style="margin-top:20px;margin-bottom:10px">Ploeg toevoegen</div>
      <div>
        ${!viewerMode && isApprovedAdmin
          ? `<button class="btn btn-org" onclick="showCreateTeamModal()">${icI(IC.plus)} Nieuwe ploeg aanmaken</button>`
          : ''}
        <button class="btn btn-gray" style="margin-top:10px" onclick="showJoinTeamModal()">${icI(IC.link)} Ploeg bekijken via code</button>
        ${(cloudReady && currentUser && !isGuest && !viewerMode && !isApprovedAdmin)
          ? (localStorage.getItem('voetbal_adminRequested') === '1'
            ? `<div class="nudge" style="margin-top:10px">${icI(IC.hourglass)} <b>Aanvraag ingediend</b> — je hoort het zodra de maker je goedkeurt. Daarna kan je hier een eigen ploeg aanmaken.</div>`
            : `<p style="font-size:12px;color:var(--txt2);margin-top:10px;margin-bottom:0">Wil je zelf een <b>eigen ploeg aanmaken</b>? Tik op het groene <b>Beheer</b>-knopje hierboven om het aan te vragen.</p>`)
          : ''}
        <div style="display:flex;gap:8px;margin-top:20px">
          <button class="btn btn-pale" style="flex:1" onclick="cloudLogout()">Afmelden</button>
          <button class="btn btn-pale" style="flex:1" onclick="go('handleiding')">${icI(IC.clipboard)} Handleiding</button>
        </div>
      </div>
    </div>
  </div>`;
}
// Sleepbalkje om de volgorde van de ploegen op het ploegenkeuzescherm te herschikken.
// Pointer Events i.p.v. losse touch/mouse-handlers: werkt zowel met de vinger als de muis.
function initTeamReorder() {
  const list = document.getElementById('ts-team-list');
  if (!list) return;
  const afterElement = y => {
    let closest = { offset: -Infinity, el: null };
    list.querySelectorAll('.ts-team-row:not(.dragging)').forEach(row => {
      const box = row.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) closest = { offset, el: row };
    });
    return closest.el;
  };
  list.querySelectorAll('.ts-drag-handle').forEach(handle => {
    handle.addEventListener('pointerdown', e => {
      e.preventDefault();
      const dragEl = handle.closest('.ts-team-row');
      if (!dragEl) return;
      dragEl.classList.add('dragging');
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      const onMove = ev => {
        const afterEl = afterElement(ev.clientY);
        if (afterEl == null) list.appendChild(dragEl);
        else if (afterEl !== dragEl) list.insertBefore(dragEl, afterEl);
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        dragEl.classList.remove('dragging');
        if (currentUser) saveTeamOrder(currentUser.uid, Array.from(list.children).map(r => r.dataset.teamId));
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  });
}

let _pendingCreateClubId = null; // club waarin een nieuwe ploeg wordt aangemaakt (clubbeheer-flow)
function showCreateTeamModal(clubId) {
  // Als er een eigenaar is ingesteld en je bent niet goedgekeurd → eerst toestemming vragen.
  // Uitzondering: een clubbeheerder mag altijd een ploeg aanmaken binnen zijn eigen club.
  if (ownerUid && !isApprovedAdmin && !(clubId && myClubs[clubId])) { showRequestAdminModal(); return; }
  _pendingCreateClubId = clubId || null;
  // In clubcontext: laat de clubbeheerder kiezen of hij deze ploeg zelf mee beheert (als lid) of
  // enkel via zijn clubrol. Standaard aangevinkt, want in de praktijk beheert hij ze vaak zelf.
  const joinRow = clubId ? `<label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:12px;cursor:pointer"><input type="checkbox" id="ct-join" checked style="width:18px;height:18px;flex-shrink:0"> Ik doe zelf het dagelijks beheer van deze ploeg <span style="color:var(--txt2)">(in "Jouw ploegen")</span></label>` : '';
  openModal(`<h3>${icI(IC.plus)} Nieuwe ploeg</h3>
    <div class="fg"><label>Naam van de ploeg</label><input id="new-team-name" type="text" placeholder="bv. U15 Rood" autofocus></div>
    ${joinRow}
    <div class="auth-err" id="ct-err"></div>
    <button class="btn btn-org" id="ct-btn" onclick="doCreateTeam()">Aanmaken</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}

async function doCreateTeam() {
  const name = (document.getElementById('new-team-name') || {}).value || '';
  const err = document.getElementById('ct-err');
  const btn = document.getElementById('ct-btn');
  if (!name.trim()) { if (err) err.textContent = 'Geef een naam in.'; return; }
  if (err) err.textContent = 'Bezig...';
  if (btn) btn.disabled = true;
  const joinChk = document.getElementById('ct-join');
  const joinAsMember = joinChk ? joinChk.checked : true;
  try {
    await createTeam(name, _pendingCreateClubId, joinAsMember);
    _pendingCreateClubId = null;
    closeModal();
  } catch (e) {
    console.error('createTeam fout:', e);
    if (e && e.code === 'PERMISSION_DENIED') {
      if (err) err.textContent = 'Je hebt nog geen toestemming om ploegen aan te maken. Vraag ze aan via "Beheerder worden".';
    } else if (err) {
      err.textContent = 'Onbekende fout. Controleer je internetverbinding.';
    }
    if (btn) btn.disabled = false;
  }
}

function showJoinTeamModal() {
  openModal(`<h3>${icI(IC.link)} Ploeg vervoegen</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:14px">Vraag de uitnodigingscode aan de beheerder van de ploeg.</p>
    <div class="fg"><label>Uitnodigingscode</label><input id="join-token" type="text" placeholder="bv. AB12CD" autocomplete="off" style="text-transform:uppercase;letter-spacing:4px;font-size:22px;text-align:center" autofocus></div>
    <div class="auth-err" id="jt-err"></div>
    <button class="btn btn-green" onclick="doJoinTeam()">Vervoegen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}

async function doJoinTeam() {
  const token = (document.getElementById('join-token') || {}).value || '';
  const err = document.getElementById('jt-err');
  if (!token.trim()) { if (err) err.textContent = 'Voer een code in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const result = await joinTeamByToken(token);
    if (result === 'not_found') { if (err) err.textContent = 'Code niet gevonden. Controleer de code en probeer opnieuw.'; return; }
    closeModal();
  } catch (e) {
    console.error('joinTeam fout:', e);
    if (err) err.textContent = 'Vervoegen mislukt, controleer je internetverbinding.';
  }
}

// ===================== STATE =====================
let view = 'home', match = null, tab = 'wedstrijd', timerInt = null, _settingsFrom = 'home', _beheerFrom = 'home';
let _beheerContext = 'team'; // 'team' = deze ploeg beheren (via home), 'system' = beheerder worden/eigenaarstools (via ploegkeuzescherm)
let currentTournament = null, trnWiz = null;

// ===================== UTILS =====================
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function pFirstName(p) { return p.firstName !== undefined ? p.firstName : (p.name || '').split(' ')[0]; }
function pLastName(p) { return p.lastName !== undefined ? p.lastName : _lastName(p.name || ''); }
function fmtTime(ms) {
  const s = Math.floor(Math.max(0,ms) / 1000);
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function fmtDate(ts) { return new Date(ts).toLocaleDateString('nl-BE',{day:'numeric',month:'long',year:'numeric'}); }
function matchWhen(m) {
  const d = m.date ? new Date(m.date + 'T00:00:00').getTime() : m.createdAt;
  return fmtDate(d) + (m.time ? ' · ' + m.time : '');
}
function getGameTimeMs(m) {
  let t = 0;
  for (const q of m.quarters) {
    if (q.endTime) t += q.endTime - q.startTime - (q.totalPaused || 0);
    else if (q.startTime) t += (q.pausedAt ? q.pausedAt : Date.now()) - q.startTime - (q.totalPaused || 0);
  }
  return Math.max(0, t);
}
function getQElapsed(m) {
  const q = m.quarters[m.quarters.length - 1];
  if (!q || !q.startTime) return 0;
  const ref = q.endTime ? q.endTime : (q.pausedAt ? q.pausedAt : Date.now());
  return Math.max(0, ref - q.startTime - (q.totalPaused || 0));
}
function gameMin(ms) { return Math.floor(ms / 60000) + 1; }
// Cumulatieve werkelijke speeltijd vóór het begin van kwart qNum.
function gameTimeMsAtStartOfQuarter(m, qNum) {
  let t = 0;
  for (const q of [...m.quarters].sort((a,b) => a.num - b.num)) {
    if (q.num >= qNum) break;
    if (q.endTime && q.startTime) t += q.endTime - q.startTime - (q.totalPaused || 0);
    else t += (m.quarterDuration || 15) * 60000;
  }
  return t;
}
// Minuut binnen het kwart (reset naar 1 bij elk nieuw kwart).
function eventMin(e, m) {
  if (!e.quarterNum) return gameMin(e.gameTimeMs);
  const actualStart = gameTimeMsAtStartOfQuarter(m, e.quarterNum);
  const withinQuarter = Math.max(0, e.gameTimeMs - actualStart);
  return Math.floor(withinQuarter / 60000) + 1;
}
// Globale voetbaltijd voor de samenvatting: extra time als "45' + 1'", nieuwe kwarten starten na nominale duur.
function eventMinGlobal(e, m) {
  if (!e.quarterNum) { const min = gameMin(e.gameTimeMs); return { min, extra: 0 }; }
  const nomMs = (m.quarterDuration || 15) * 60000;
  const nomStartMs = (e.quarterNum - 1) * nomMs;
  const actualStart = gameTimeMsAtStartOfQuarter(m, e.quarterNum);
  const withinQ = Math.max(0, e.gameTimeMs - actualStart);
  if (withinQ <= nomMs) {
    return { min: Math.floor((nomStartMs + withinQ) / 60000) + 1, extra: 0 };
  } else {
    const nomEndMin = Math.floor((nomStartMs + nomMs) / 60000);
    const extraMin = Math.ceil((withinQ - nomMs) / 60000);
    return { min: nomEndMin, extra: extraMin };
  }
}
function eventMinSummaryText(e, m) {
  const { min, extra } = eventMinGlobal(e, m);
  return extra > 0 ? `${min}' + ${extra}'` : `${min}'`;
}
function eventMinLocal(e, m) {
  if (!e.quarterNum) return `${gameMin(e.gameTimeMs)}'`;
  const nomMs = (m.quarterDuration || 15) * 60000;
  const actualStart = gameTimeMsAtStartOfQuarter(m, e.quarterNum);
  const withinQ = Math.max(0, e.gameTimeMs - actualStart);
  if (withinQ <= nomMs) return `${Math.floor(withinQ / 60000) + 1}'`;
  const extraMin = Math.ceil((withinQ - nomMs) / 60000);
  return `${m.quarterDuration || 15}'+${extraMin}'`;
}
function playersOnField(m) { return m.players.filter(p => p.onField && !p.absent); }
function playersOnBench(m) { return m.players.filter(p => !p.onField && !p.absent); }
// Bij retroactief event: spelers op het veld/bank at het begin van het geselecteerde kwart.
function playersOnFieldForEvent(m) {
  if (_postEventQuarter != null) return playersAtPeriodStart(m, _postEventQuarter);
  return playersOnField(m);
}
// Veldbezetting inclusief reeds ingeplande pauzewissels (voor het plannen van meerdere wissels op rij).
function effectiveOnField(m) {
  const on = new Set(m.players.filter(p => p.onField).map(p => p.id));
  for (const s of (m.pendingSubs || [])) { on.delete(s.outId); on.add(s.inId); }
  return m.players.filter(p => on.has(p.id));
}

function calcMinutes(m) {
  const mins = {}, totalMs = getGameTimeMs(m), entry = {};
  for (const p of m.players) mins[p.id] = { ms: 0, absent: !!p.absent };
  for (const p of m.players) if (p.starting && !p.absent) entry[p.id] = 0;
  const evts = [...m.events].sort((a,b) => a.gameTimeMs - b.gameTimeMs);
  for (const e of evts) {
    if (e.type === 'substitution') {
      if (entry[e.playerOutId] !== undefined) { mins[e.playerOutId].ms += e.gameTimeMs - entry[e.playerOutId]; delete entry[e.playerOutId]; }
      entry[e.playerInId] = e.gameTimeMs;
    }
    if (e.type === 'red_card' && entry[e.playerId] !== undefined) {
      mins[e.playerId].ms += e.gameTimeMs - entry[e.playerId]; delete entry[e.playerId];
    }
    // Blessure waarbij de speler het veld verlaat zonder directe wissel: stop de teller.
    if (e.type === 'injury' && e.leavesField && entry[e.playerId] !== undefined) {
      mins[e.playerId].ms += e.gameTimeMs - entry[e.playerId]; delete entry[e.playerId];
    }
  }
  for (const [pid, entryMs] of Object.entries(entry)) if (mins[pid]) mins[pid].ms += totalMs - entryMs;
  return mins;
}
// Stond deze speler ooit als doelman geregistreerd (via keeperByQ, bijgehouden per kwart
// in syncKeeper() bij elke keeperwissel)? Gebruikt voor keeperstatistieken i.p.v. enkel de
// EIND-positie (p.line==='Doel'), zodat een keeperwissel tijdens de wedstrijd (bv. na
// blessure) de statistieken niet verkeerd aan de verkeerde speler toekent. Oudere
// wedstrijden zonder keeperByQ-data hebben geen entries, dan valt de aanroeper terug op
// de eind-positie-benadering.
function wasKeeperAtAll(m, playerId) {
  const byQ = m.keeperByQ;
  if (!byQ) return false;
  return Object.values(byQ).some(arr => Array.isArray(arr) && arr.some(e => e.id === playerId));
}
// Aantal ms per speler in doel, opgebouwd uit keeperByQ (per kwart een lijst {id, sinceMs}
// telkens een nieuwe entry bij een keeperwissel). Binnen elk kwart loopt een entry door tot
// de volgende (of tot het einde van dat kwart). Geeft null voor oudere wedstrijden zonder
// keeperByQ-data — daar is geen betrouwbare minutenopbouw uit te herleiden.
function keeperMinutes(m) {
  const byQ = m.keeperByQ;
  if (!byQ || !Object.keys(byQ).length) return null;
  const totals = {};
  for (const qNum of Object.keys(byQ).map(Number).sort((a, b) => a - b)) {
    const arr = byQ[qNum];
    if (!Array.isArray(arr) || !arr.length) continue;
    const qEndMs = gameTimeMsAtEndOfQuarter(m, qNum);
    arr.forEach((entry, i) => {
      const endMs = i + 1 < arr.length ? arr[i + 1].sinceMs : qEndMs;
      totals[entry.id] = (totals[entry.id] || 0) + Math.max(0, endMs - entry.sinceMs);
    });
  }
  return totals;
}
function calcMinutesPerQuarter(m) {
  const qNums = [...new Set((m.quarters || []).map(q => q.num))].sort((a, b) => a - b);
  if (qNums.length < 2) return null;
  const totalMs = getGameTimeMs(m);
  const qBounds = qNums.map((qNum, i) => {
    const start = gameTimeMsAtStartOfQuarter(m, qNum);
    const end = i + 1 < qNums.length ? gameTimeMsAtStartOfQuarter(m, qNums[i + 1]) : totalMs;
    return { qNum, start, end };
  });
  const intervals = {};
  for (const p of m.players) intervals[p.id] = [];
  const entry = {};
  for (const p of m.players) if (p.starting) entry[p.id] = 0;
  const evts = [...m.events].sort((a, b) => a.gameTimeMs - b.gameTimeMs);
  for (const e of evts) {
    if (e.type === 'substitution') {
      if (entry[e.playerOutId] !== undefined) { intervals[e.playerOutId].push({ start: entry[e.playerOutId], end: e.gameTimeMs }); delete entry[e.playerOutId]; }
      entry[e.playerInId] = e.gameTimeMs;
    }
    if (e.type === 'red_card' && entry[e.playerId] !== undefined) { intervals[e.playerId].push({ start: entry[e.playerId], end: e.gameTimeMs }); delete entry[e.playerId]; }
    if (e.type === 'injury' && e.leavesField && entry[e.playerId] !== undefined) { intervals[e.playerId].push({ start: entry[e.playerId], end: e.gameTimeMs }); delete entry[e.playerId]; }
  }
  for (const [pid, ms] of Object.entries(entry)) if (intervals[pid]) intervals[pid].push({ start: ms, end: totalMs });
  const result = {};
  for (const p of m.players) {
    result[p.id] = {};
    for (const { qNum, start: qs, end: qe } of qBounds) {
      let ms = 0;
      for (const { start, end } of intervals[p.id]) ms += Math.max(0, Math.min(end, qe) - Math.max(start, qs));
      result[p.id][qNum] = ms;
    }
  }
  return { qNums, result };
}

function pName(m, id){ const p = m.players.find(x=>x.id===id); return p ? p.name : '?'; }
// evtLabel() bouwt HTML op (gebruikt in innerHTML voor het gebeurtenissenlog, o.a. bij
// kijkers) — spelersnamen en vrije tekst (reason/cornerType) komen van gebruikersinvoer
// en moeten hier ge-esc't worden. pName() zelf blijft ongefilterd: die wordt ook gebruikt
// voor platte tekst (WhatsApp-deelbericht, CSV), waar HTML-entities fout zouden staan.
function evtLabel(e, m) {
  const pn = id => esc(pName(m, id));
  switch(e.type) {
    case 'goal_us': { let s = `${icI(IC.goal)} Goal ${pn(e.playerId)}`; if (e.assistId) s += ` (assist ${pn(e.assistId)})`; return s; }
    case 'goal_them': return `${icI(IC.goal)} Tegendoel`;
    case 'own_goal': return `${icI(IC.goal)} Eigen doel (${pn(e.playerId)})`;
    case 'own_goal_them': return `${icI(IC.goal)} Eigen doel tegenstander`;
    case 'corner_us': { let s = `${icI(IC.corner)} Hoekschop voor ${esc(tName(m))}`; if (e.cornerType) s += ` · ${esc(e.cornerType)}`; if (e.playerId) s += ` · ${pn(e.playerId)}`; return s; }
    case 'corner_them': { let s = `${icI(IC.corner)} Hoekschop tegen`; if (e.cornerType) s += ` · ${esc(e.cornerType)}`; return s; }
    case 'substitution': return `${icI(IC.swap)} ${e.atBreak?'Pauzewissel: ':''}${pn(e.playerInId)} voor ${pn(e.playerOutId)}`;
    case 'posSwap': return `${icI(IC.compass)} ${e.atBreak?'Pauze-positiewissel: ':'Positiewissel: '}${pn(e.pA)} ↔ ${pn(e.pB)}`;
    case 'yellow_card': return `${icI(IC.cardY)} Gele kaart ${pn(e.playerId)}`;
    case 'red_card': return `${icI(IC.cardR)} Rode kaart ${pn(e.playerId)}`;
    case 'penalty_us': return `${icI(IC.penalty)} Penalty voor ${esc(tName(m))}${e.playerId?' · '+pn(e.playerId):''}${e.scored===true?' — GOAL':e.scored===false?' — gemist':''}`;
    case 'penalty_them': return `${icI(IC.penalty)} Penalty tegen${e.scored===true?' — tegendoel':e.scored===false?' — gemist':''}`;
    case 'freekick_us': return `${icI(IC.bolt)} Vrije trap voor ${esc(tName(m))}${e.playerId?' · '+pn(e.playerId):''}`;
    case 'freekick_them': return `${icI(IC.bolt)} Vrije trap tegen`;
    case 'injury': { const it = e.injuryType==='kramp'?'Kramp':e.injuryType==='licht'?'Lichte blessure':'Ernstige blessure'; return `${icI(IC.injury)} ${it} · ${pn(e.playerId)}${e.leavesField?' — verlaat veld':''}`; }
    case 'shot_us': return `${icI(IC.shot)} Schot voor ${esc(tName(m))}${e.onTarget?' (op doel)':''}`;
    case 'shot_them': return `${icI(IC.shot)} Schot tegen${e.onTarget?' (op doel)':''}`;
    case 'save_us': return `${icI(IC.save)} Redding (onze keeper)`;
    case 'save_them': return `${icI(IC.save)} Redding tegenstander`;
    case 'disallowed_us': return `${icI(IC.disallowed)} Afgekeurd doelpunt voor ${esc(tName(m))}${e.reason?' · '+esc(e.reason):''}`;
    case 'disallowed_them': return `${icI(IC.disallowed)} Afgekeurd doelpunt tegen${e.reason?' · '+esc(e.reason):''}`;
    case 'captain_change': return `${icI(IC.captain)} Nieuwe kapitein: ${pn(e.playerId)}`;
    case 'quarter_start': return `${icI(IC.playFilled)} ${pSing(m)} ${e.quarterNum} gestart`;
    case 'quarter_end': return `${icI(IC.stopFilled)} ${pSing(m)} ${e.quarterNum} afgelopen`;
    default: return esc(e.type);
  }
}
// Platte-tekstvariant van evtLabel(): zelfde switch, maar zonder iconen/HTML — nodig voor
// contexten die geen HTML renderen (PDF-tijdlijn via jsPDF-tekst i.p.v. innerHTML).
function evtLabelPlain(e, m) {
  switch(e.type) {
    case 'goal_us': { let s = `Goal ${pName(m,e.playerId)}`; if (e.assistId) s += ` (assist ${pName(m,e.assistId)})`; return s; }
    case 'goal_them': return 'Tegendoel';
    case 'own_goal': return `Eigen doel (${pName(m,e.playerId)})`;
    case 'own_goal_them': return 'Eigen doel tegenstander';
    case 'corner_us': { let s = `Hoekschop voor ${tName(m)}`; if (e.cornerType) s += ` · ${e.cornerType}`; if (e.playerId) s += ` · ${pName(m,e.playerId)}`; return s; }
    case 'corner_them': { let s = 'Hoekschop tegen'; if (e.cornerType) s += ` · ${e.cornerType}`; return s; }
    case 'substitution': return `${e.atBreak?'Pauzewissel: ':''}${pName(m,e.playerInId)} voor ${pName(m,e.playerOutId)}`;
    // <-> i.p.v. ↔: jsPDF's standaardfonts (WinAnsiEncoding) missen dit Unicode-teken,
    // waardoor deze regel als enige met een kapot/leeg glyph in de PDF verscheen.
    case 'posSwap': return `${e.atBreak?'Pauze-positiewissel: ':'Positiewissel: '}${pName(m,e.pA)} <-> ${pName(m,e.pB)}`;
    case 'yellow_card': return `Gele kaart ${pName(m,e.playerId)}`;
    case 'red_card': return `Rode kaart ${pName(m,e.playerId)}`;
    case 'penalty_us': return `Penalty voor ${tName(m)}${e.playerId?' · '+pName(m,e.playerId):''}${e.scored===true?' — GOAL':e.scored===false?' — gemist':''}`;
    case 'penalty_them': return `Penalty tegen${e.scored===true?' — tegendoel':e.scored===false?' — gemist':''}`;
    case 'freekick_us': return `Vrije trap voor ${tName(m)}${e.playerId?' · '+pName(m,e.playerId):''}`;
    case 'freekick_them': return 'Vrije trap tegen';
    case 'injury': { const it = e.injuryType==='kramp'?'Kramp':e.injuryType==='licht'?'Lichte blessure':'Ernstige blessure'; return `${it} · ${pName(m,e.playerId)}${e.leavesField?' — verlaat veld':''}`; }
    case 'shot_us': return `Schot voor ${tName(m)}${e.onTarget?' (op doel)':''}`;
    case 'shot_them': return `Schot tegen${e.onTarget?' (op doel)':''}`;
    case 'save_us': return 'Redding (onze keeper)';
    case 'save_them': return 'Redding tegenstander';
    case 'disallowed_us': return `Afgekeurd doelpunt voor ${tName(m)}${e.reason?' · '+e.reason:''}`;
    case 'disallowed_them': return `Afgekeurd doelpunt tegen${e.reason?' · '+e.reason:''}`;
    case 'captain_change': return `Nieuwe kapitein: ${pName(m,e.playerId)}`;
    case 'quarter_start': return `${pSing(m)} ${e.quarterNum} gestart`;
    case 'quarter_end': return `${pSing(m)} ${e.quarterNum} afgelopen`;
    default: return e.type;
  }
}
function allCaptains(m) {
  const changes = (m.events||[]).filter(e => e.type==='captain_change').sort((a,b)=>(a.gameTimeMs||0)-(b.gameTimeMs||0));
  if (!changes.length) return m.captainId ? [m.captainId] : [];
  const ids = [];
  if (changes[0].fromId) ids.push(changes[0].fromId);
  for (const c of changes) if (!ids.includes(c.playerId)) ids.push(c.playerId);
  return ids;
}
// Events gegroepeerd per deel (kwart/helft/...), met de tussenstand t.e.m. dat deel.
// quarter_start / quarter_end worden weggelaten: de groepskop vervangt ze.
function eventsByQuarter(m) {
  const groups = [];
  const qnums = [...new Set(m.events.map(e => e.quarterNum).filter(n => n != null))].sort((a, b) => a - b);
  for (const qn of qnums) {
    const list = m.events.filter(e => e.quarterNum === qn && !e.type.startsWith('quarter')).sort((a, b) => a.gameTimeMs - b.gameTimeMs);
    groups.push({ qn, list, cum: scoreUpToQuarter(m, qn) });
  }
  const orphan = m.events.filter(e => e.quarterNum == null && !e.type.startsWith('quarter'));
  if (orphan.length) groups.push({ qn: null, list: orphan, cum: null });
  return groups;
}
// Filterbalk boven de events-tijdlijn (enkel het scherm — de jsPDF-export in detail-pdf.js
// gebruikt evtLabelPlain rechtstreeks en toont altijd alles, ongeacht deze filter).
const ELOG_FILTER_GROUPS = {
  goal: { label: 'Goals', icon: 'goal', types: ['goal_us', 'goal_them', 'own_goal', 'own_goal_them'] },
  sub: { label: 'Wissels', icon: 'swap', types: ['substitution'] },
  card: { label: 'Kaarten', icon: 'cardY', types: ['yellow_card', 'red_card'] },
};
// null = geen filter actief (alles tonen). Anders: key van ELOG_FILTER_GROUPS — enkel die categorie tonen.
let elogFilter = null;
function toggleElogFilter(key) { elogFilter = (elogFilter === key) ? null : key; render(); }
// HTML-event-log voor het scherm (detail + live-log), met kwart-kop + tussenstand + verwijderknop.
function renderEventLog(m) {
  const groups = eventsByQuarter(m);
  if (!groups.length) return '<p style="color:var(--txt2);font-size:14px">Geen events.</p>';
  const elog_ro = !!(m.fromCloud && (!isAdmin || viewerMode));
  const HIDDEN_FOR_VIEWER = new Set(['quarter_start', 'quarter_end', 'posSwap']);
  const GOAL_TYPES = new Set(['goal_us', 'goal_them', 'own_goal', 'own_goal_them', 'penalty_us', 'penalty_them']);
  const activeTypes = elogFilter ? new Set(ELOG_FILTER_GROUPS[elogFilter].types) : null;
  const filterBar = `<div class="no-print" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${Object.entries(ELOG_FILTER_GROUPS).map(([k, g]) => `<span class="start-chip ${elogFilter===k?'on':''}" onclick="toggleElogFilter('${k}')">${icI(IC[g.icon])} ${g.label}</span>`).join('')}</div>`;
  return filterBar + groups.map(g => {
    const head = g.qn == null ? 'Overig' : `${pSing(m)} ${g.qn}`;
    const score = g.cum ? `<span class="qgroup-score">${isAway(m) ? `${g.cum.them}–<span class="us">${g.cum.us}</span>` : `<span class="us">${g.cum.us}</span>–${g.cum.them}`}</span>` : '';
    let list = elog_ro ? g.list.filter(e => !HIDDEN_FOR_VIEWER.has(e.type)) : g.list;
    if (activeTypes) list = list.filter(e => activeTypes.has(e.type));
    const items = list.length
      ? list.map(e => {
          const isGoal = elog_ro && GOAL_TYPES.has(e.type) && (e.type !== 'penalty_us' && e.type !== 'penalty_them' || e.scored);
          const goalStyle = isGoal ? ' style="font-weight:700;font-size:15px"' : '';
          return `<li${goalStyle}><span class="emin">${eventMinLocal(e,m)}</span><span class="etxt">${evtLabel(e, m)}</span>${elog_ro ? '' : `<button class="evt-edit no-print" onclick="modalEditEvent('${e.id}')" title="Bewerken">${icI(IC.edit)}</button><button class="evt-del no-print" onclick="confirmDeleteEvent('${e.id}')" title="Verwijderen">×</button>`}</li>`;
        }).join('')
      : '<li class="qgroup-empty">Geen events in dit deel (of alles weggefilterd).</li>';
    return `<div class="qgroup"><div class="qgroup-head"><span>${head}</span>${score}</div><ul class="elog">${items}</ul></div>`;
  }).join('');
}

// ===================== TIMER =====================
function startTimer() {
  stopTimer();
  // checkOvertimeAlert draait ongeacht subtab (Wedstrijd/Opstelling/Verloop) — voorheen zat
  // de piep/trilling verstopt in updateTimerDisplay(), die meteen stopt zonder het
  // #timer-time-element (enkel aanwezig op de Wedstrijd-tab).
  timerInt = setInterval(() => { if (view === 'live') { checkOvertimeAlert(); updateTimerDisplay(); } }, 500);
}
function stopTimer() { if (timerInt) { clearInterval(timerInt); timerInt = null; } }
// Scherm wakker houden tijdens een lopend deel
let wakeLock = null;
async function requestWake() { try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) {} }
async function releaseWake() { try { if (wakeLock) await wakeLock.release(); } catch (e) {} wakeLock = null; }
// Eindsignaal (geluid + trilling)
function beep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
    const o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.4, ac.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.7);
    o.start(); o.stop(ac.currentTime + 0.72);
  } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } catch (e) {}
}
function countdownOn() { return localStorage.getItem('voetbal_countdown') === '1'; }
function toggleCountdown() { localStorage.setItem('voetbal_countdown', countdownOn() ? '0' : '1'); render(); }
// Eenvoudige modus: toont enkel de meest gebruikte eventknoppen (Goal, Wissel, Kaart, Blessure).
// Standaard AAN — minder drempel voor een ouder/afgevaardigde die niet elke actie kent.
function simpleEventsOn() { return localStorage.getItem('voetbal_simple_events') !== '0'; }
function toggleSimpleEvents() { localStorage.setItem('voetbal_simple_events', simpleEventsOn() ? '0' : '1'); render(); }
function timerText(m) {
  const elapsed = getQElapsed(m), durMs = (m.quarterDuration || 0) * 60000;
  if (durMs && elapsed >= durMs) return fmtTime(durMs) + ' + ' + fmtTime(elapsed - durMs);
  if (countdownOn() && durMs) return '-' + fmtTime(durMs - elapsed);
  return fmtTime(elapsed);
}
// Eindsignaal-check: apart van updateTimerDisplay() zodat het blijft werken ongeacht welke
// subtab (Wedstrijd/Opstelling/Verloop) actief is — updateTimerDisplay() stopt vroegtijdig
// als het #timer-time-element er niet is, en zou de piep dan nooit bereiken.
function checkOvertimeAlert() {
  if (!match) return;
  const q = match.quarters[match.quarters.length - 1];
  if (!q) return;
  const elapsed = getQElapsed(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const isRunning = q.startTime && !q.pausedAt && !q.endTime;
  if (isRunning && durMs && elapsed >= durMs && !q.alerted) { q.alerted = true; beep(); dbSave(match); }
}
function updateTimerDisplay() {
  const el = document.getElementById('timer-time');
  if (!el || !match) return;
  const q = match.quarters[match.quarters.length - 1];
  const elapsed = getQElapsed(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const isRunning = q && q.startTime && !q.pausedAt && !q.endTime;
  const overtime = isRunning && durMs && elapsed >= durMs;
  el.textContent = timerText(match);
  el.style.color = overtime ? 'var(--org)' : '';
  const bar = document.getElementById('timer-progress-bar');
  if (bar && durMs) {
    const pct = Math.min(100, (elapsed / durMs) * 100).toFixed(1);
    bar.style.width = pct + '%';
    bar.style.background = overtime ? 'var(--org)' : 'var(--grn)';
  }
}

// ===================== MODAL =====================
function togglePwd(btn) {
  const inp = btn.previousElementSibling;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.innerHTML = show ? icI(IC.eyeOff) : icI(IC.eye);
}
function openModal(html) {
  const el = document.getElementById('modal');
  el.innerHTML = `<div class="modal-ov" onclick="if(event.target===this)closeModal()"><div class="modal">${html}</div></div>`;
  el.classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modal').innerHTML = '';
  _postEventQuarter = null;
}
function showToast(msg, type) {
  let t = document.getElementById('_toast');
  if (!t) { t = document.createElement('div'); t.id = '_toast'; document.body.appendChild(t); }
  t.className = 'toast' + (type === 'ok' ? ' toast-ok' : type === 'err' ? ' toast-err' : '');
  t.textContent = msg;
  t.classList.remove('toast-hide');
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.add('toast-hide'), 3000);
}
let _confirmCb = null;
function showConfirm(msg, onYes, btnLabel, btnClass) {
  _confirmCb = onYes;
  openModal(`<p style="margin:0 0 20px;line-height:1.5">${msg}</p>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn" onclick="closeModal()">Annuleer</button>
      <button class="btn ${btnClass||'btn-red'}" onclick="closeModal();if(_confirmCb){const cb=_confirmCb;_confirmCb=null;cb();}">${btnLabel||'Verwijderen'}</button>
    </div>`);
}

// ===================== NAVIGATION =====================
const GUEST_ALLOWED_VIEWS = ['home', 'live', 'settings', 'handleiding', 'auth', 'guestjoin'];
async function go(v, id, _histReplace) {
  // Gast: enkel toegang tot deze schermen, ongeacht hoe de navigatie tot stand komt
  // (klik, terugknop, console) — voorkomt dat een gast bij volledige teamdata terechtkomt.
  if (isGuest && !GUEST_ALLOWED_VIEWS.includes(v)) v = 'home';
  // Beheer vereist een ingelogde gebruiker (was vroeger de guard in cloudLoginModal()).
  if ((v === 'beheer' || v === 'clubbeheer' || v === 'clubsadmin') && !currentUser) v = 'auth';
  stopTimer(); releaseWake(); applyStoredTheme(); applyDark();
  view = v; tab = 'wedstrijd';
  if (id) match = await dbGet(id);
  if (v === 'live') {
    startTimer();
    // Wake lock hierboven altijd losgelaten bij navigatie — bij terugkeer naar 'live' met een
    // lopend (niet gepauzeerd/afgesloten) deel meteen opnieuw aanvragen, anders vergrendelt
    // het scherm tijdens de wedstrijd na een uitstapje naar een ander scherm in de app.
    const q = match && match.quarters[match.quarters.length - 1];
    if (q && q.startTime && !q.pausedAt && !q.endTime) requestWake();
  }
  // Sla navigatiestatus op in de browser history zodat de back-knop werkt binnen de app.
  // Auth en teamselect zijn geen echte navigatiestappen — die vervangen de huidige state.
  const noHistory = v === 'auth' || v === 'teamselect';
  const state = { v, id: id || null };
  if (noHistory || _histReplace) history.replaceState(state, '');
  else history.pushState(state, '');
  render();
}
window.addEventListener('popstate', async e => {
  const s = e.state;
  if (!s || !s.v) return;
  // Navigeer intern zonder opnieuw een history-entry te maken.
  await go(s.v, s.id || undefined, true);
});
function render() { document.getElementById('app').innerHTML = views[view]() + '<div class="credit">Match Delegate · App created by <b>Tim Buyse</b></div>'; }

// ===================== VISUAL PITCH =====================
// Achternaam = alles na het eerste woord (voornaam), incl. tussenvoegsel (De, Van, ...).
function _lastName(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
}
// Map van speler-id → veldnaam: enkel achternaam, met initiaal als er duplicaten zijn.
function fieldDisplayNames(players) {
  const lastNames = players.map(p => _lastName(p.name || ''));
  return new Map(players.map((p, i) => {
    const ln = lastNames[i];
    const isDup = lastNames.filter(l => l.toLowerCase() === ln.toLowerCase()).length > 1;
    const initial = isDup ? ((p.name||'').trim()[0]||'').toUpperCase() + '. ' : '';
    return [p.id, initial + ln];
  }));
}
function pitchLines() {
  return `<svg class="pitch-lines" viewBox="0 0 320 480">
    <line x1="0" y1="240" x2="320" y2="240" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <circle cx="160" cy="240" r="43" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <circle cx="160" cy="240" r="3" fill="rgba(255,255,255,.7)"/>
    <rect x="65.5" y="0" width="189" height="75" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <rect x="65.5" y="405" width="189" height="75" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <rect x="117" y="0" width="86" height="25" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <rect x="117" y="455" width="86" height="25" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <circle cx="160" cy="50" r="3" fill="rgba(255,255,255,.7)"/>
    <circle cx="160" cy="430" r="3" fill="rgba(255,255,255,.7)"/>
    <path d="M 8 0 A 8 8 0 0 0 0 8" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <path d="M 312 0 A 8 8 0 0 1 320 8" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <path d="M 0 472 A 8 8 0 0 0 8 480" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
    <path d="M 320 472 A 8 8 0 0 1 312 480" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
  </svg>`;
}
function pitchDot(m, p, x, y, dn, captainId) {
  const capId = captainId !== undefined ? captainId : (m ? m.captainId : null);
  const cap = (capId === p.id) ? ' ©' : '';
  const lbl = `${esc(dn || _lastName(p.name))}${cap}`;
  return `<div class="pdot ${p.line==='Doel'?'pdot-org':''}" style="left:${x}%;top:${y}%">
    ${p.posNum||p.number||'?'}<span class="pdot-lbl">${lbl}</span></div>`;
}
function renderPitch(m, players, captainId) {
  const dns = fieldDisplayNames(players);
  let dots = '';
  const xy = players.filter(p => typeof p.x === 'number' && typeof p.y === 'number');
  const rest = players.filter(p => !(typeof p.x === 'number' && typeof p.y === 'number'));
  for (const p of xy) dots += pitchDot(m, p, p.x, p.y, dns.get(p.id), captainId);
  const byLine = {};
  for (const p of rest) { (byLine[p.line] = byLine[p.line] || []).push(p); }
  for (const [line, ps] of Object.entries(byLine)) {
    const y = LINE_Y[line] != null ? LINE_Y[line] : 50;
    const n = ps.length;
    ps.forEach((p, i) => { dots += pitchDot(m, p, n === 1 ? 50 : 18 + (i * (64 / (n - 1))), y, dns.get(p.id), captainId); });
  }
  return `<div class="pitch">${pitchLines()}${dots}</div>
  <div class="field-legend"><span class="ic-i" style="color:#f5821f;font-size:.9em;vertical-align:-.05em">${IC.dot}</span> = doelman · cijfer in bol = positienummer · onder = naam</div>`;
}
function captainAtStartOfQuarter(m, qNum) {
  const startMs = gameTimeMsAtStartOfQuarter(m, qNum);
  const allChanges = (m.events || []).filter(e => e.type === 'captain_change')
    .sort((a, b) => (a.gameTimeMs || 0) - (b.gameTimeMs || 0));
  if (!allChanges.length) return m.captainId;
  // Wijzigingen die plaatsvonden vóór of exact bij de start van dit kwart
  const before = allChanges.filter(e => (e.gameTimeMs || 0) <= startMs);
  if (!before.length) return allChanges[0].fromId || m.captainId;
  return before[before.length - 1].playerId;
}

// Zelfstandige SVG-veldweergave voor de PDF (los venster, zonder de app-CSS).
function pitchSVG(m, players, svgWidth = 280, captainId = undefined) {
  const capId = captainId !== undefined ? captainId : m.captainId;
  const W = 320, H = 480, R = 15;
  const pts = [];
  players.filter(p => typeof p.x === 'number' && typeof p.y === 'number').forEach(p => pts.push({ p, x: p.x, y: p.y }));
  const byLine = {};
  players.filter(p => !(typeof p.x === 'number' && typeof p.y === 'number')).forEach(p => { (byLine[p.line] = byLine[p.line] || []).push(p); });
  Object.entries(byLine).forEach(([line, ps]) => {
    const y = LINE_Y[line] != null ? LINE_Y[line] : 50, n = ps.length;
    ps.forEach((p, i) => pts.push({ p, x: n === 1 ? 50 : 18 + i * (64 / (n - 1)), y }));
  });
  const dns = fieldDisplayNames(pts.map(({p}) => p));
  const dots = pts.map(({ p, x, y }) => {
    const cx = (x / 100 * W).toFixed(1), cy = (y / 100 * H).toFixed(1);
    const gk = p.line === 'Doel', cap = (capId === p.id) ? ' ©' : '';
    return `<g><circle cx="${cx}" cy="${cy}" r="${R}" fill="${gk ? '#f5821f' : '#101010'}" stroke="#fff" stroke-width="2"/>` +
      `<text x="${cx}" y="${(+cy + 4).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff">${esc(p.posNum || p.number || '?')}</text>` +
      `<text x="${cx}" y="${(+cy + R + 12).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff">${esc((dns.get(p.id) || _lastName(p.name || '')) + cap)}</text></g>`;
  }).join('');
  const PAW=189,PAD=75,GAW=86,GAD=25,GW=36,GD=10,CCR=43,PENY=50,CR=8;
  const pax=((W-PAW)/2).toFixed(1), gax=((W-GAW)/2).toFixed(1), gx=((W-GW)/2).toFixed(1);
  return `<svg viewBox="-3 -${GD+2} ${W+6} ${H+GD*2+4}" width="${svgWidth}" style="max-width:100%">
    <defs>
      <pattern id="grass" x="0" y="0" width="${W}" height="60" patternUnits="userSpaceOnUse">
        <rect width="${W}" height="30" fill="#1b8040"/>
        <rect y="30" width="${W}" height="30" fill="#1e9449"/>
      </pattern>
      <clipPath id="fc"><rect x="0" y="0" width="${W}" height="${H}" rx="8"/></clipPath>
    </defs>
    <g clip-path="url(#fc)"><rect x="0" y="0" width="${W}" height="${H}" fill="url(#grass)"/></g>
    <rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="none" stroke="#fff" stroke-width="2.5"/>
    <line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="#fff" stroke-width="2"/>
    <circle cx="${W/2}" cy="${H/2}" r="${CCR}" fill="none" stroke="#fff" stroke-width="2"/>
    <circle cx="${W/2}" cy="${H/2}" r="3" fill="#fff"/>
    <rect x="${pax}" y="0" width="${PAW}" height="${PAD}" fill="none" stroke="#fff" stroke-width="2"/>
    <rect x="${pax}" y="${H-PAD}" width="${PAW}" height="${PAD}" fill="none" stroke="#fff" stroke-width="2"/>
    <rect x="${gax}" y="0" width="${GAW}" height="${GAD}" fill="none" stroke="#fff" stroke-width="2"/>
    <rect x="${gax}" y="${H-GAD}" width="${GAW}" height="${GAD}" fill="none" stroke="#fff" stroke-width="2"/>
    <circle cx="${W/2}" cy="${PENY}" r="3" fill="#fff"/>
    <circle cx="${W/2}" cy="${H-PENY}" r="3" fill="#fff"/>
    <path d="M ${CR} 0 A ${CR} ${CR} 0 0 0 0 ${CR}" fill="none" stroke="#fff" stroke-width="2"/>
    <path d="M ${W-CR} 0 A ${CR} ${CR} 0 0 1 ${W} ${CR}" fill="none" stroke="#fff" stroke-width="2"/>
    <path d="M 0 ${H-CR} A ${CR} ${CR} 0 0 0 ${CR} ${H}" fill="none" stroke="#fff" stroke-width="2"/>
    <path d="M ${W} ${H-CR} A ${CR} ${CR} 0 0 1 ${W-CR} ${H}" fill="none" stroke="#fff" stroke-width="2"/>
    ${dots}
  </svg>`;
}

// ===================== HOME =====================

// ===================== MAINTENANCE =====================

function renderMaintenance() {
  return `<div style="position:fixed;inset:0;z-index:9999;background:url('background_logo.jpg') center/cover no-repeat">
    <div style="position:absolute;inset:0;background:rgba(10,18,35,0.55)"></div>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center;padding:32px">
      <img src="logo_no_background.png" style="width:140px;height:140px;object-fit:contain">
      <div style="width:150px;height:3px;background:#2f9e57;border-radius:2px"></div>
      <div>
        <div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:2px;text-transform:uppercase">Match Delegate</div>
        <div style="color:rgba(255,255,255,0.55);font-size:12px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin-top:6px">Manage &nbsp;•&nbsp; Track &nbsp;•&nbsp; Share</div>
      </div>
      <div style="margin-top:16px;color:rgba(255,255,255,0.65);font-size:14px;line-height:1.7;max-width:280px">We werken aan de app om jullie nog een betere gebruikservaring te garanderen.</div>
      <div style="color:rgba(255,255,255,0.85);font-size:15px;font-weight:600;max-width:280px">Even geduld. We zijn zo terug.</div>
    </div>
  </div>`;
}

async function toggleMaintenance() {
  if (!fbdb) return;
  const newVal = !maintenanceActive;
  maintenanceActive = newVal;
  render();
  try {
    await fbdb.ref('maintenance/active').set(newVal);
  } catch(e) {
    maintenanceActive = !newVal;
    render();
    showToast('Onderhoudsmodus wijzigen mislukt, probeer opnieuw.', 'err');
    console.error('toggleMaintenance:', e);
  }
}
const views = {
  auth: renderAuth,
  guestjoin: renderGuestJoin,
  maintenance: renderMaintenance,
  teamselect: renderTeamSelect,
  home: () => {
    loadHome();
    setTimeout(updateCloudChip, 0);
    const canSwitch = cloudReady && currentUser && activeTeamId && !isGuest;
    // Header toont de PLOEGnaam als hoofdtitel (zodat je weet in welke ploeg je zit) en de
    // clubnaam kleiner eronder (fase 2f; gedenormaliseerd zodat ook kijkers ze zien).
    const teamName = canSwitch ? esc(teamNames[activeTeamId] || 'Ploeg') : '';
    const clubName = canSwitch ? esc(activeClubName || '') : '';
    const switchBtn = canSwitch
      ? `<button class="team-switch-btn" onclick="go('teamselect')" title="Van ploeg wisselen">${icI(IC.swap)} Ploeg</button>`
      : '';
    return `<div class="hdr hdr-home" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <div style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden">
        <img src="logo_no_background.png" class="hdr-crest" alt="Match Delegate">
        ${teamName ? `<div style="min-width:0;overflow:hidden">
          <div class="hdr-club-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${teamName}</div>
          ${clubName ? `<div style="font-size:12px;font-weight:600;color:#fff;opacity:.75;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${clubName}</div>` : ''}
        </div>` : ''}
        ${switchBtn ? `<span style="margin-left:6px">${switchBtn}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
        <span id="cloud-chip" class="cloud-chip" style="display:none" onclick="_beheerFrom=view;_beheerContext='team';go('beheer')"></span>
        <button class="hdr-gear" onclick="_settingsFrom=view;go('settings')" title="Instellingen">${icI(IC.gear)}</button>
      </div>
    </div>
      <div class="content" id="home-content"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
  },
  matches: () => {
    loadMatches();
    return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>${icI(IC.ball)} Wedstrijden</h1></div>
      <div class="content" id="matches-content"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
  },
  setup: () => renderSettings(true),
  settings: () => renderSettings(false),
  handleiding: () => renderHandleiding(0),
  live: () => renderLive(),
  detail: () => renderDetail(),
  stats: () => { statsFilter = homeFilter; loadStats(); return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>${icI(IC.chart)} Statistieken</h1></div><div class="content" id="stats-content"><div class="empty"><div class="ei">${IC.timer}</div></div></div>`; },
  playerDetail: () => { loadPlayerDetail(); return `<div class="hdr"><button class="back" onclick="go(_playerDetailFrom||'stats')">‹</button><h1>${icI(IC.shirt)} Speler</h1></div><div class="content" id="player-detail-content"><div class="empty"><div class="ei">${IC.timer}</div></div></div>`; },
  playertransfer: renderPlayerTransfer,
};
let homeFilter = 'all';
function setHomeFilter(v) { homeFilter = v; if (view === 'matches') loadMatches(); else loadHome(); }
// Eén wedstrijd-kaartje (gebruikt op het dashboard én in de volledige lijst).
function matchItemHtml(m) {
  const st = m.status, target = st === 'live' ? 'live' : st === 'planned' ? 'prep' : 'detail';
  const border = st === 'live' ? 'live-border' : st === 'planned' ? 'plan-border' : '';
  const badge = st === 'live' ? `<span class="badge badge-live">${icI(IC.live)} Live</span>` : st === 'planned' ? `<span class="badge badge-plan">${icI(IC.calendar)} Gepland</span>` : `<span class="badge badge-done">${icI(IC.done)} Gespeeld</span>`;
  const right = st === 'planned' ? `<div style="text-align:right;font-size:13px;color:var(--txt2);font-weight:600">${m.location || ''}</div>` : `<div class="mi-score">${scoreTxt(m)}</div>`;
  const sdata = `${m.opponent||''} ${m.teamName||''} ${m.subteam||''} ${m.location||''} ${m.competition||''} ${matchWhen(m)}`.toLowerCase();
  const ownLabel = esc(tName(m)) + (m.subteam ? ` (${esc(m.subteam)})` : '');
  if (st === 'live') {
    const qNum = m.quarters ? m.quarters.length : 0;
    const periodLabel = qNum > 0 ? `${pSingLow(m)} ${qNum}` : 'gestart';
    return `<div class="match-item live-border" data-s="${esc(sdata)}" onclick="go('live','${m.id}')" style="padding:14px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
        <div style="display:flex;align-items:center;gap:6px;white-space:nowrap">
          <span class="live-pulse-dot"></span>
          <span style="font-size:12px;font-weight:700;color:var(--rd);text-transform:uppercase;letter-spacing:.5px">Live · ${periodLabel}</span>
        </div>
        <div style="display:flex;align-items:center;gap:7px;flex-shrink:0">
          <span style="font-size:15px;font-weight:700">${isAway(m)?esc(m.opponent):ownLabel}</span>
          <span style="font-size:24px;font-weight:800;letter-spacing:3px">${scoreHtml(m,'')}</span>
          <span style="font-size:15px;font-weight:700">${isAway(m)?ownLabel:esc(m.opponent)}</span>
        </div>
      </div>
    </div>`;
  }
  return `<div class="match-item ${border}" data-s="${esc(sdata)}" onclick="go('${target}','${m.id}')">
    <div class="mi-info">
      <div class="mi-opp">${esc(m.opponent)}</div>
      <div class="mi-date">${m.teamName?'<b>'+esc(m.teamName)+(m.subteam?' ('+esc(m.subteam)+')':'')+'</b> · ':''}${matchWhen(m)}${st!=='planned'&&m.location?' · '+esc(m.location):''}</div>
      ${badge}<span class="badge badge-type">${m.matchType||''}</span>${m.numQuarters&&m.quarterDuration?`<span class="badge badge-type">${m.numQuarters} × ${m.quarterDuration}'</span>`:''}
    </div>${right}</div>`;
}
// HOME = dashboard: tegels + komende wedstrijd (filterbaar per ploeg) + recent.
async function loadHome() {
  const all = await dbAll();
  const el = document.getElementById('home-content');
  if (!el) return;
  const looseMatches = all.filter(m => !m.tournamentId);
  const rosters = getTeamsV2();
  const teamCount = rosters.length;
  const playerCount = rosters.reduce((n, t) => n + ((t.players || []).length), 0);
  const trnCount = getTournaments().length;
  // In de cloud toont elke ploeg zijn eigen spelers; van ploeg wisselen gaat via de ⇄-knop bovenaan.
  const teamTile = cloudReady
    ? `<button class="tile" onclick="openSquad()"><span class="tile-fi ic-i" aria-hidden="true">${IC.shirt}</span><span class="tl">Spelers</span><span class="tc">${playerCount} ${playerCount===1?'speler':'spelers'}</span></button>`
    : `<button class="tile" onclick="go('teams')"><span class="tile-fi ic-i" aria-hidden="true">${IC.shirt}</span><span class="tl">Ploegen</span><span class="tc">${teamCount} ${teamCount===1?'ploeg':'ploegen'}</span></button>`;
  const teams = [...new Set(looseMatches.map(m => m.teamName).filter(Boolean))].sort();
  // In de cloud kan de lokale cache (tijdelijk, of na een teamwissel) wedstrijden van een
  // andere ploeg bevatten — altijd filteren op de naam van de actieve ploeg i.p.v. te
  // vertrouwen op "de cache bevat toch enkel deze ploeg". Als de naam nog niet gekend is
  // (bv. meteen na een refresh, vóór selectTeam()'s achtergrond-fetch klaar is) NOOIT
  // terugvallen op 'all' (ongefilterd) — dat toonde ooit even een andere ploeg's wedstrijd.
  if (cloudReady) homeFilter = teamNames[activeTeamId] || UNKNOWN_TEAM_FILTER;
  else if (homeFilter !== 'all' && !teams.includes(homeFilter)) homeFilter = 'all';
  // Zelfde filter toepassen als de wedstrijdenlijst zelf (loadMatches) — anders telt de
  // tegel hier alles wat lokaal gecached staat, incl. een andere ploeg op dit toestel.
  const tileMatches = homeFilter === 'all' ? looseMatches : looseMatches.filter(m => m.teamName === homeFilter);
  const tiles = `<div class="home-tiles" style="grid-template-columns:1fr 1fr">
    <button class="tile" onclick="go('matches')"><span class="tile-fi ic-i" aria-hidden="true">${IC.ball}</span><span class="tl">Wedstrijden</span><span class="tc">${tileMatches.length}</span></button>
    ${teamTile}
    <button class="tile" onclick="go('tournaments')"><span class="tile-fi ic-i" aria-hidden="true">${IC.medal}</span><span class="tl">Tornooien</span><span class="tc">${trnCount} ${trnCount===1?'tornooi':'tornooien'}</span></button>
    <button class="tile" onclick="go('stats')"><span class="tile-fi ic-i" aria-hidden="true">${IC.chart}</span><span class="tl">Statistieken</span><span class="tc">bekijk</span></button>
  </div>`;
  const isOffline = offlineWithKnownCloudTeam() || (!navigator.onLine && cloudReady && !!activeTeamId);
  const offlineBanner = !isOffline ? '' : (canManage()
    ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24;margin-bottom:12px">${icI(IC.warn)} Je bent offline. Je kan gewoon verder werken — wijzigingen worden gesynchroniseerd zodra er terug verbinding is.</div>`
    : `<div class="viewer-banner" style="background:var(--rdp,#fee2e2);color:var(--rd,#dc2626);border-color:#fca5a5;margin-bottom:12px">${icI(IC.warn)} Je bent offline. Je ziet mogelijk verouderde gegevens tot de verbinding terugkeert.</div>`);
  if (!all.length && !teamCount) {
    // Kijkers/gasten kunnen zelf geen ploeg/wedstrijd aanmaken — geef hen geen instructie
    // die ze toch niet kunnen uitvoeren.
    const emptyMsg = canManage()
      ? `<p>Welkom! Maak eerst een <b>ploeg</b> aan,<br>tik dan <b>+</b> voor je eerste wedstrijd.</p>`
      : `<p>Er staat nog niets klaar voor deze ploeg.<br>Vraag de beheerder om een wedstrijd aan te maken.</p>`;
    el.innerHTML = offlineBanner + tiles + `<div class="empty"><div class="ei">${IC.players}</div>${emptyMsg}</div>`;
    return;
  }
  const guestBanner = isGuest
    ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">
        <span>${icI(IC.eye)} Gastmodus · enkel live wedstrijden volgen</span>
        <button class="btn btn-gray btn-sm" style="white-space:nowrap" onclick="authDoSignOut()">Afmelden</button>
      </div>` : '';
  const welcomeKey = 'voetbal_viewer_welcomed_' + activeTeamId;
  const viewerWelcome = (!isGuest && !isAdmin && cloudReady && !localStorage.getItem(welcomeKey))
    ? `<div class="card" style="border-left:4px solid var(--grn);margin-bottom:16px">
        <div style="font-size:15px;font-weight:700;margin-bottom:6px">Welkom bij ${esc(getClubName() || 'de ploeg')}!</div>
        <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Je volgt deze ploeg live. Je kan wedstrijden en tornooien bekijken, de score en events live volgen, en de opstelling raadplegen.</p>
        <p style="font-size:12px;color:var(--txt2);margin-bottom:10px">${icI(IC.warn)} Er zijn nog geen pushmeldingen als de app gesloten is — houd de app open tijdens de wedstrijd om alles mee te volgen.</p>
        <button class="btn btn-green btn-sm" onclick="localStorage.setItem('${welcomeKey}','1');this.closest('.card').remove()">Begrepen</button>
      </div>` : '';
  const coAdminHint = (!isGuest && !isAdmin && cloudReady && activeTeamId)
    ? `<p style="font-size:12px;color:var(--txt2);margin-bottom:14px">Wil je <b>co-beheerder</b> worden van deze ploeg? Tik op de <b>Kijken</b>-knop rechtsboven en vraag het aan.</p>`
    : '';
  const filterBar = (!cloudReady && teams.length > 1) ? `<div class="filterbar">
    <select onchange="setHomeFilter(this.value)">
      <option value="all" ${homeFilter==='all'?'selected':''}>Alle ploegen</option>
      ${teams.map(t => `<option value="${esc(t)}" ${homeFilter===t?'selected':''}>${esc(t)}</option>`).join('')}
    </select></div>` : '';
  // Komende wedstrijden (live of gepland), gefilterd per ploeg, vroegste eerst.
  let upcoming = all.filter(m => m.status === 'live' || (m.status === 'planned' && !m.tournamentId));
  if (homeFilter !== 'all') upcoming = upcoming.filter(m => m.teamName === homeFilter);
  upcoming.sort((a, b) => { const r = (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1); if (r) return r; return (a.date || '').localeCompare(b.date || ''); });
  upcoming = upcoming.slice(0, 1); // enkel de eerstvolgende
  const upcomingHtml = upcoming.length ? upcoming.map(matchItemHtml).join('') : '';
  // Eerstvolgende tornooi
  let upcomingTrn = getTournaments().filter(t => (t.date || '') >= new Date().toISOString().split('T')[0]);
  if (homeFilter !== 'all') upcomingTrn = upcomingTrn.filter(t => { const team = teamById(t.teamId); return team && team.name === homeFilter; });
  upcomingTrn.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  upcomingTrn = upcomingTrn.slice(0, 1);
  const upcomingTrnHtml = upcomingTrn.length
    ? upcomingTrn.map(t => {
        const team = teamById(t.teamId);
        return `<div class="match-item plan-border" onclick="goTournament('${t.id}')">
          <div class="mi-info">
            <div class="mi-opp">${icI(IC.medal)} ${esc(t.name)}</div>
            <div class="mi-date">${team ? '<b>'+esc(team.name)+'</b> · ' : ''}${t.date ? fmtDate(new Date(t.date+'T00:00:00').getTime()) : ''}${t.location ? ' · '+esc(t.location) : ''}</div>
            <span class="badge badge-plan">${icI(IC.calendar)} Gepland</span><span class="badge badge-type">Tornooi</span>${t.matchType?`<span class="badge badge-type">${t.matchType}</span>`:''}
          </div>
        </div>`;
      }).join('')
    : '';
  // Laatst gespeelde wedstrijd (zelfde filter).
  let recent = looseMatches.filter(m => m.status === 'done');
  if (homeFilter !== 'all') recent = recent.filter(m => m.teamName === homeFilter);
  recent = recent.slice(0, 1);
  const recentHtml = recent.length ? `<div class="sec">${icI(IC.history)} Laatst gespeeld</div>${recent.map(matchItemHtml).join('')}` : '';
  const newBtn = canManage() ? `<button class="btn btn-org" onclick="newMatch()" style="margin-bottom:14px">${icI(IC.ball)} + Nieuwe wedstrijd</button>` : '';
  const createTeamHint = '';
  if (isGuest) {
    const liveMatches = all.filter(m => m.status === 'live');
    const liveHtml = liveMatches.length
      ? liveMatches.map(matchItemHtml).join('')
      : `<div class="empty" style="padding:24px 0"><div class="ei">${IC.ball}</div><p>Geen live wedstrijden op dit moment.</p></div>`;
    el.innerHTML = guestBanner + `<div class="sec">${icI(IC.ball)} Live wedstrijden</div>` + liveHtml;
    return;
  }
  const matchSection = upcoming.length ? `<div class="sec">${icI(IC.calendar)} Eerstvolgende wedstrijd</div>${upcomingHtml}` : '';
  const trnSection = upcomingTrn.length ? `<div class="sec">${icI(IC.medal)} Eerstvolgende tornooi</div>${upcomingTrnHtml}` : '';
  const noneSection = (!upcoming.length && !upcomingTrn.length)
    ? `<div class="empty" style="padding:16px"><div class="ei">${icI(IC.calendar)}</div><p style="margin:0;color:var(--txt2)">Geen geplande wedstrijden of tornooien${homeFilter!=='all'?' voor deze ploeg':''}.</p></div>`
    : '';
  el.innerHTML = offlineBanner + guestBanner + viewerWelcome + tiles + createTeamHint + newBtn + filterBar + matchSection + noneSection + recentHtml + trnSection + coAdminHint;
}
// WEDSTRIJDEN = volledige lijst met filter + zoeken.
async function loadMatches() {
  const all = (await dbAll()).filter(m => !m.tournamentId);
  const el = document.getElementById('matches-content');
  if (!el) return;
  if (!all.length) {
    el.innerHTML = `<div class="empty"><div class="ei">${IC.ball}</div><p>Nog geen wedstrijden.<br>Maak eerst een ploeg aan, tik dan <b>+</b>.</p></div>`;
    return;
  }
  const teams = [...new Set(all.map(m => m.teamName).filter(Boolean))].sort();
  // Zie loadHome(): in de cloud altijd op de actieve ploeg filteren, nooit blind 'all'.
  if (cloudReady) homeFilter = teamNames[activeTeamId] || UNKNOWN_TEAM_FILTER;
  else if (homeFilter !== 'all' && !teams.includes(homeFilter)) homeFilter = 'all';
  const list = (homeFilter === 'all' ? all : all.filter(m => m.teamName === homeFilter)).slice();
  const filterBar = (!cloudReady && teams.length) ? `<div class="filterbar">
    <select onchange="setHomeFilter(this.value)">
      <option value="all" ${homeFilter==='all'?'selected':''}>Alle ploegen (${all.length})</option>
      ${teams.map(t => `<option value="${esc(t)}" ${homeFilter===t?'selected':''}>${esc(t)} (${all.filter(m=>m.teamName===t).length})</option>`).join('')}
    </select></div>` : '';
  // Gescheiden in duidelijke groepen: live · gepland (vroegste eerst) · gespeeld (recentste eerst).
  const live = list.filter(m => m.status === 'live');
  const planned = list.filter(m => m.status === 'planned').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const done = list.filter(m => m.status === 'done').sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt - a.createdAt));
  const sec = (title, arr) => arr.length ? `<div class="sec">${title}</div>${arr.map(matchItemHtml).join('')}` : '';
  const items = list.length
    ? sec(`${icI(IC.live)} Live`, live) + sec(`${icI(IC.calendar)} Geplande wedstrijden`, planned) + sec(`${icI(IC.done)} Gespeelde wedstrijden`, done)
    : `<div class="empty"><div class="ei">${IC.search}</div><p>Geen wedstrijden voor deze ploeg.</p></div>`;
  const searchBar = all.length > 6 ? `<div class="searchbar"><input id="home-search" type="search" placeholder="Zoek op tegenstander, ploeg, plaats…" oninput="filterHomeItems(this.value)" value="${esc(homeSearch)}"></div>` : '';
  const newBtn = canManage() ? `<button class="btn btn-org" onclick="newMatch()" style="margin-bottom:12px">${icI(IC.ball)} + Nieuwe wedstrijd</button>` : '';
  el.innerHTML = newBtn + filterBar + searchBar + `<div id="match-list">${items}</div>`;
  if (homeSearch) filterHomeItems(homeSearch);
}
let homeSearch = '';
function filterHomeItems(q) {
  homeSearch = q;
  const term = (q || '').trim().toLowerCase();
  const list = document.getElementById('match-list');
  if (!list) return;
  let shown = 0;
  list.querySelectorAll('.match-item').forEach(el => {
    const hit = !term || (el.getAttribute('data-s') || '').includes(term);
    el.style.display = hit ? '' : 'none';
    if (hit) shown++;
  });
  let none = document.getElementById('search-none');
  if (!shown && term) {
    if (!none) { none = document.createElement('div'); none.id = 'search-none'; none.className = 'empty'; none.innerHTML = `<div class="ei">${IC.search}</div><p>Geen wedstrijden gevonden.</p>`; list.appendChild(none); }
  } else if (none) { none.remove(); }
}

