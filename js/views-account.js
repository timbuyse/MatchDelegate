// ===================== APP-BEHEER (view) =====================
// Alles wat over de HELE app gaat: clubs en clubbeheerders, alle gebruikers, de prullenmand met
// verwijderde ploegen, en de onderhoudsmodus. Enkel voor de eigenaar.
//
// Tot v1.0.4 heette dit scherm "Beheer" en had het TWEE inhouden in één view: kwam je via het
// homescherm, dan beheerde je de actieve ploeg; kwam je via de ploegenlijst, dan zag je de
// eigenaarstools. Welke van de twee je kreeg hing af van een onzichtbare schakelaar
// (_beheerContext). Dat was de grootste bron van verwarring in de app: drie knoppen die "Beheer"
// of "Beheren" heetten en telkens iets anders deden. Het ploeggedeelte is verhuisd naar het
// ploegscherm (renderTeamOverview in teams-tournaments.js), waar het bij de spelers hoort.
function renderBeheer() {
  // Eigenaar: eenmalig claimen (enkel als nog niet ingesteld)
  const ownerBlock = !ownerUid
    ? `<div class="sec">Eigenaar</div><div class="card"><button class="btn btn-org" onclick="claimOwner()"><span class="ic-i" style="font-size:1.1em">${IC.crown}</span> Ik ben de maker (eigenaar instellen)</button></div>`
    : '';

  const toolsBlock = (isOwner && !viewerMode) ? `
    <div class="card">
      <button class="btn btn-dark" onclick="go('clubsadmin')">${icI(IC.players)} Clubs en clubbeheerders</button>
      <button class="btn btn-dark" style="margin-top:8px" onclick="go('allusers')">${icI(IC.players)} Alle gebruikers</button>
      ${cloudReady ? `<button class="btn btn-dark" style="margin-top:8px" onclick="_tgvFrom='beheer';go('teruggevonden')">${icI(IC.history)} Prullenmand</button>` : ''}
    </div>
    <div class="sec">${icI(IC.wrench)} Onderhoud</div>
    <div class="card">
      <p style="font-size:13px;color:var(--txt2);margin:0 0 10px">Staat dit aan, dan ziet iedereen een melding en kan er niets gewijzigd worden.</p>
      <button class="btn" style="background:${maintenanceActive?'#b91c1c':'#1e3a2f'};color:${maintenanceActive?'#fef2f2':'#86efac'};border:1.5px solid ${maintenanceActive?'#ef4444':'#2f9e57'}" onclick="toggleMaintenance()">${maintenanceActive?`${icI(IC.wrench)} Onderhoud UIT-zetten`:`${icI(IC.wrench)} Onderhoud AAN-zetten`}</button>
    </div>` : (ownerUid ? `
    <div class="card"><p style="color:var(--txt2);font-size:14px;margin:0">Dit scherm is enkel voor de maker van de app.</p></div>` : '');

  return `<div class="hdr"><button class="back" onclick="go(_beheerFrom||'teamselect')">‹</button><h1>${icI(IC.shield)} App-beheer</h1></div>
  <div class="content">
    ${ownerBlock}
    ${toolsBlock}
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
      try { const s = await fbOnce(fbdb.ref('teams/' + tid + '/info')); const inf = s.val() || {}; return { id: tid, name: s.exists() ? (inf.name || '') : null, archived: !!inf.archived, exists: s.exists() }; }
      catch (e) { return { id: tid, name: teamNames[tid] || '', archived: !!archivedTeams[tid], exists: true }; } // bij een fout (bv. offline) niet opkuisen
    }));
    const dead = fetched.filter(r => !r.exists);
    for (const r of dead) { try { await fbdb.ref('clubs/' + clubId + '/teams/' + r.id).remove(); } catch (e) {} }
    // Cache bijwerken zodat teamselect meteen klopt.
    fetched.filter(r => r.exists).forEach(r => { if (r.archived) archivedTeams[r.id] = true; else delete archivedTeams[r.id]; });
    const live = fetched.filter(r => r.exists).map(r => ({ id: r.id, name: r.name || '(naamloze ploeg)', archived: r.archived }));
    live.sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    const rows = live.filter(r => !r.archived);
    const archivedRows = live.filter(r => r.archived);
    // Namen van álle beheerde clubs ophalen zodat de keuzelijst niet terugvalt op de clubId (code)
    // voor de niet-actieve clubs (de actieve naam kennen we al via clubName). Enkel bij >1 club.
    const clubNamesById = { [clubId]: clubName };
    if (clubIds.length > 1) {
      await Promise.all(clubIds.filter(id => id !== clubId).map(async id => {
        try { const s = await fbOnce(fbdb.ref('clubs/' + id + '/info/name')); clubNamesById[id] = s.val() || id; }
        catch (e) { clubNamesById[id] = id; }
      }));
    }
    // Wie beheert deze club? Namen zijn "best effort": usersByEmail is owner-only, dus een
    // clubbeheerder valt terug op de ledeninformatie van zijn eigen clubploegen en anders op de
    // ruwe id. Een naam die ontbreekt mag dit scherm niet doen falen.
    const clubAdminUids = Object.keys(club.admins || {});
    const clubAdminNamen = {};
    if (clubAdminUids.length) {
      let ube = {};
      try { ube = (await fbOnce(fbdb.ref('usersByEmail'))).val() || {}; } catch (e) {}
      clubAdminUids.forEach(u => { const i = ube[u]; if (i && (i.name || i.email)) clubAdminNamen[u] = i.name || i.email; });
      const ontbreekt = clubAdminUids.filter(u => !clubAdminNamen[u]);
      if (ontbreekt.length) {
        await Promise.all(teamIds.map(async tid => {
          try {
            const mi = (await fbOnce(fbdb.ref('memberInfo/' + tid))).val() || {};
            ontbreekt.forEach(u => { const i = mi[u]; if (i && (i.name || i.email) && !clubAdminNamen[u]) clubAdminNamen[u] = i.name || i.email; });
          } catch (e) {}
        }));
      }
    }
    const clubSelector = clubIds.length > 1
      ? `<div class="fg"><label>Club</label><select onchange="_clubBeheerId=this.value;loadClubBeheerView()">${clubIds.map(id => `<option value="${esc(id)}" ${id === clubId ? 'selected' : ''}>${esc(clubNamesById[id] || id)}</option>`).join('')}</select></div>`
      : '';
    el.innerHTML = `
      ${clubSelector}
      ${clubLogoCardHtml(clubId, (club.info && club.info.logo) || '', 'loadClubBeheerView()')}
      <div class="sec">${esc(clubName)} <span style="font-weight:400;text-transform:none;color:var(--txt2)">(${rows.length} ${rows.length === 1 ? 'ploeg' : 'ploegen'})</span></div>
      <div class="card">
        ${rows.length ? rows.map(t => `<div style="padding:8px 0;border-bottom:1px solid var(--bdr)">
          <div style="font-weight:600">${esc(t.name)}${userTeams[t.id] ? ' <span style="font-weight:400;color:var(--grn);font-size:12px">· in Jouw ploegen</span>' : ''}</div>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
            <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="openTeamFromClub('${t.id}')">Openen</button>
            <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="toggleClubTeamMembership('${t.id}')">${userTeams[t.id] ? 'Uit mijn ploegen' : 'Bij mijn ploegen'}</button>
            <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="archiveTeam('${t.id}','${jsq(t.name)}')">${icI(IC.archive)} Archiveren</button>
            ${/* Verwijderen staat hier naast archiveren, want dat hoort samen: allebei "deze ploeg
                  moet weg". Voor een clubbeheerder is het grijs — de databankregels laten enkel de
                  maker van de app een ploeg hard verwijderen; hij archiveert (alles blijft bewaard).
                  Een grijze knop mét uitleg bij het aantikken, geen dode knop: anders blijf je zoeken
                  waarom er niets gebeurt. */ ''}
            ${isOwner
              ? `<button class="btn btn-red btn-sm" style="width:auto;margin:0" onclick="ownerDeleteTeam('${t.id}','${jsq(t.name)}')">${icI(IC.trash)} Verwijderen</button>`
              : `<button class="btn btn-sm" style="width:auto;margin:0;background:#f1f1f1;color:var(--txt2);opacity:.7;cursor:not-allowed" onclick="showToast('Definitief verwijderen kan enkel de maker van de app. Gebruik Archiveren: de ploeg verdwijnt uit de lijsten en alle gegevens blijven bewaard.','err')">${icI(IC.trash)} Verwijderen</button>`}
          </div>
        </div>`).join('') : '<p style="color:var(--txt2);font-size:14px;margin:0">Nog geen ploegen in deze club.</p>'}
      </div>
      <button class="btn btn-green" onclick="showCreateTeamModal('${clubId}')">${icI(IC.plus)} Nieuwe ploeg in deze club</button>
      <p style="font-size:12px;color:var(--txt2);margin-top:10px">Tik "Openen" bij een ploeg om er trainers of afgevaardigden bij te zetten. Dat doe je op het ploegscherm zelf, bij "Mensen met toegang".</p>
      ${/* Wie de club beheert stond nergens in dit scherm — enkel de eigenaar zag het, in een heel
            ander scherm. Hier alleen ter informatie: aanstellen blijft bij de maker van de app. */ ''}
      <div class="sec" style="margin-top:20px">Clubbeheerders</div>
      <div class="card">
        ${clubAdminUids.length
          ? clubAdminUids.map(u => `<div class="stat-row"><span style="flex:1">${esc(clubAdminNamen[u] || u)}</span>${(currentUser && u === currentUser.uid) ? '<span class="ts-role admin">jij</span>' : ''}</div>`).join('')
          : '<p style="color:var(--txt2);font-size:14px;margin:0">Nog geen clubbeheerder.</p>'}
        <p style="font-size:12px;color:var(--txt2);margin-top:10px">${isOwner
          ? 'Als maker van de app stel je ze aan via App-beheer → Clubs en clubbeheerders.'
          : 'Een clubbeheerder wordt aangesteld door de maker van de app.'}</p>
        ${isOwner ? `<button class="btn btn-pale" style="margin-top:4px" onclick="_beheerFrom='clubbeheer';go('clubsadmin')">${icI(IC.shield)} Aanstellen of wijzigen</button>` : ''}
      </div>
      <div class="sec" style="margin-top:20px">Extra</div>
      ${rows.length >= 2 ? `<button class="btn btn-pale" onclick="go('playertransfer')">${icI(IC.swap)} Spelers doorschuiven (binnen club)</button>` : ''}
      <button class="btn btn-pale" style="margin-top:8px" onclick="showClubExport('${clubId}')">${icI(IC.download)} Clubexport (Excel)</button>
      ${archivedRows.length ? `<div class="sec" style="margin-top:20px">Gearchiveerd (${archivedRows.length})</div>
      <div class="card">
        ${archivedRows.map(t => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr)">
          <span style="flex:1;font-size:14px;color:var(--txt2)">${esc(t.name)}</span>
          <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="unarchiveTeam('${t.id}')">Herstellen</button>
        </div>`).join('')}
        <p style="font-size:12px;color:var(--txt2);margin-top:8px">Gearchiveerde ploegen zijn verborgen uit de actieve lijsten maar behouden al hun gegevens.</p>
      </div>` : ''}`;
  } catch (e) {
    el.innerHTML = '<div class="card"><p style="color:var(--org2);font-size:14px;margin:0">Kon de club niet laden. Probeer opnieuw.</p></div>';
  }
}
async function openTeamFromClub(tid) {
  // Clubbeheerder klikt een clubploeg open. Sinds v1.1.0 landt hij op het ploegscherm zelf (met de
  // wedstrijden, de tegels en de volgende match) in plaats van meteen in een beheerscherm — de
  // knop heet daarom "Openen" en niet meer "Beheren". Alles over die ploeg staat één tik verder,
  // achter de tegel Ploeg.
  await selectTeam(tid);
  // Optimistisch: we komen uit het clubbeheer van deze club, dus toon meteen de beheercontroles
  // (selectTeam bevestigt dit ook async via isClubAdmin → isAdmin).
  if (_clubBeheerId && myClubs && myClubs[_clubBeheerId] && !isAdmin) {
    isAdmin = true;
    // De initiële cloudListen() in selectTeam draaide nog zonder beheerder-rechten (geen
    // teamNotes-listener, geen aanvraag-badge). Herstart de listeners hier meteen — de async
    // elevatie in selectTeam slaat dat pad anders over, omdat isAdmin door deze optimistische
    // set al true is tegen de tijd dat de info-fetch resolvet (wasAdmin-check).
    stopTeamListeners(); cloudListen(); listenCoAdminRequests();
  }
  go('home');
}
// Hybride (fase 2d): de clubbeheerder voegt zichzelf toe aan / haalt zichzelf weg uit een clubploeg
// als ploegbeheerder (lid). Zo verschijnt de ploeg wel/niet in zijn eigen "Jouw ploegen"; zijn
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
    // Offline-cache bijwerken, anders toont een offline-herstart een net verwijderd/toegevoegd
    // lidmaatschap verkeerd tot de volgende online load.
    if (currentUser) cacheUserTeams(currentUser.uid, userTeams);
    loadClubBeheerView();
  } catch (e) { showToast('Wijzigen mislukt, probeer opnieuw.', 'err'); }
}
// Archiveren (fase 2d schijf 3): een ploeg "wegzetten" zonder ze te verwijderen — ze verdwijnt uit
// de actieve lijsten maar behoudt alle gegevens. Dit is een gewone ploeg-aanpassing (info/archived),
// dus de clubbeheerder mag het (i.t.t. hard verwijderen, dat bij de eigenaar/maker blijft).
function archiveTeam(tid, naam) {
  if (!fbdb) return;
  showConfirm('Ploeg "' + esc(naam) + '" archiveren? Ze verdwijnt uit de actieve lijsten maar alle gegevens blijven bewaard. Je kan ze later herstellen.', async () => {
    try {
      await fbdb.ref('teams/' + tid + '/info/archived').set(true);
      archivedTeams[tid] = true;
      showToast('Ploeg gearchiveerd.', 'ok');
      loadClubBeheerView();
    } catch (e) { showToast('Archiveren mislukt, probeer opnieuw.', 'err'); }
  }, 'Archiveren', 'btn-org');
}
async function unarchiveTeam(tid) {
  if (!fbdb) return;
  try {
    await fbdb.ref('teams/' + tid + '/info/archived').remove();
    delete archivedTeams[tid];
    showToast('Ploeg hersteld.', 'ok');
    loadClubBeheerView();
  } catch (e) { showToast('Herstellen mislukt, probeer opnieuw.', 'err'); }
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
    // Ploegnamen van alle clubploegen ophalen (voor de per-ploeg aanstel-knoppen). Verwijderde
    // ploegen (naam niet gevonden) laten we weg — die tellen ook niet mee voor "leeg" bij verwijderen.
    const allTeamIds = [];
    clubIds.forEach(cid => Object.keys((clubsVal[cid] || {}).teams || {}).forEach(t => allTeamIds.push(t)));
    const teamNameMap = {};
    await Promise.all([...new Set(allTeamIds)].map(async t => {
      try { const s = await fbOnce(fbdb.ref('teams/' + t + '/info/name')); teamNameMap[t] = s.exists() ? (s.val() || t) : null; }
      catch (e) { teamNameMap[t] = t; }
    }));
    const secMini = 'font-size:12px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px';
    const clubsHtml = clubIds.length ? clubIds.map(cid => {
      const c = clubsVal[cid] || {};
      const nm = (c.info && c.info.name) || '(naamloze club)';
      const teamIds = Object.keys(c.teams || {}).filter(t => teamNameMap[t] !== null);
      const nTeams = teamIds.length;
      const admins = Object.keys(c.admins || {});
      const adminHtml = admins.length
        ? admins.map(uid => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><span style="flex:1;font-size:13px">${esc(userName(uid))}</span><button class="btn btn-pale btn-sm" style="width:auto;margin:0;color:var(--rd)" onclick="removeClubAdmin('${cid}','${uid}')">Verwijderen</button></div>`).join('')
        : '<p style="font-size:13px;color:var(--txt2);margin:2px 0">Nog geen clubbeheerder.</p>';
      const teamsHtml = teamIds.length
        ? teamIds.map(t => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><span style="flex:1;font-size:13px">${esc(teamNameMap[t] || t)}</span><button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="showAppointTeamAdmin('${t}',&quot;${esc(teamNameMap[t] || '').replace(/"/g, '&quot;')}&quot;)">${icI(IC.plus)} Ploegbeheerder</button></div>`).join('')
        : '<p style="font-size:13px;color:var(--txt2);margin:2px 0">Nog geen ploegen.</p>';
      const deleteBtn = nTeams === 0
        ? `<button style="margin-top:12px;background:none;border:none;color:var(--rd);font-size:13px;font-weight:700;cursor:pointer;padding:0;display:flex;align-items:center;gap:6px" onclick="deleteClub('${cid}','${jsq(nm)}')">${icI(IC.trash)} Club verwijderen</button>`
        : `<p style="font-size:12px;color:var(--txt2);margin-top:12px">Een club kan enkel verwijderd worden als er geen ploegen meer in zitten.</p>`;
      return `<div class="card" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="flex:1;font-weight:800;font-size:16px">${esc(nm)}</span>
          <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="renameClub('${cid}',&quot;${esc(nm).replace(/"/g, '&quot;')}&quot;)">${icI(IC.edit)} Hernoemen</button>
        </div>
        <div style="font-size:13px;color:var(--txt2);margin-bottom:10px">${nTeams} ${nTeams === 1 ? 'ploeg' : 'ploegen'}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          ${(c.info && c.info.logo)
            ? `<img src="${c.info.logo}" alt="Clublogo" style="width:44px;height:44px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid var(--bdr)">`
            : `<div style="width:44px;height:44px;border-radius:8px;background:var(--bg2,#f3f4f6);border:1px dashed var(--bdr);display:flex;align-items:center;justify-content:center;color:var(--txt2)">${IC.shield}</div>`}
          <span style="flex:1;font-size:13px;color:var(--txt2)">Clublogo</span>
          <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="pickClubLogo('${cid}',()=>{loadClubsAdminView()})">${(c.info && c.info.logo) ? 'Wijzigen' : 'Toevoegen'}</button>
          ${(c.info && c.info.logo) ? `<button class="btn btn-pale btn-sm" style="width:auto;margin:0;color:var(--rd)" onclick="removeClubLogo('${cid}',()=>{loadClubsAdminView()})">Verwijderen</button>` : ''}
        </div>
        <div style="${secMini}">Clubbeheerders</div>
        ${adminHtml}
        <button class="btn btn-pale btn-sm" style="margin-top:8px" onclick="showAppointClubAdmin('${cid}')">${icI(IC.plus)} Clubbeheerder aanstellen</button>
        <div style="${secMini};margin-top:12px">Ploegen</div>
        ${teamsHtml}
        ${deleteBtn}
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
  const btn = document.getElementById('cc-btn'); if (btn) btn.disabled = true;
  try {
    const cid = fbdb.ref('clubs').push().key;
    await fbdb.ref('clubs/' + cid).set({ info: { name, logo: '', createdBy: currentUser.uid, createdAt: Date.now() }, admins: {}, teams: {} });
    closeModal(); loadClubsAdminView();
  } catch (e) { if (err) err.textContent = 'Aanmaken mislukt. Probeer opnieuw.'; if (btn) btn.disabled = false; }
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
// ----- Clublogo (instelbaar door eigenaar én clubbeheerder) -----
// Mag de huidige gebruiker het logo van deze club wijzigen? Eigenaar overal, clubbeheerder
// enkel van zijn eigen club(s).
function canEditClubLogo(cid) { return !!(isOwner || (cid && myClubs[cid])); }
// Schrijf het logo naar clubs/{cid}/info/logo én denormaliseer het naar teams/{tid}/info/clubLogo
// van alle ploegen van de club (zodat kijkers het zien, net als clubName). Leeg = verwijderen.
async function writeClubLogo(cid, dataUri) {
  if (!cid || !fbdb) return;
  await fbdb.ref('clubs/' + cid + '/info/logo').set(dataUri || null);
  const teamIds = Object.keys((await fbOnce(fbdb.ref('clubs/' + cid + '/teams'))).val() || {});
  for (const tid of teamIds) { try { await fbdb.ref('teams/' + tid + '/info/clubLogo').set(dataUri || null); } catch (e) {} }
  // Actieve-ploeg-cache meteen bijwerken zodat lopende schermen kloppen.
  if (activeClubId === cid) activeClubLogo = dataUri || '';
  for (const tid of teamIds) rememberTeamClubLogo(tid, dataUri || '');
}
// Kies een afbeelding, verklein/comprimeer ze en bewaar ze als clublogo. onDone() na afloop.
function pickClubLogo(cid, onDone) {
  if (!canEditClubLogo(cid)) return;
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const file = inp.files && inp.files[0];
    if (!file) return;
    try {
      const uri = await fileToClubLogoDataUri(file);   // standaardmaat: zie CLUB_LOGO_MAX_PX
      await writeClubLogo(cid, uri);
      if (onDone) onDone();
    } catch (e) { alert('Kon het logo niet instellen: ' + (e.message || 'onbekende fout')); }
  };
  inp.click();
}
async function removeClubLogo(cid, onDone) {
  if (!canEditClubLogo(cid)) return;
  if (!confirm('Clublogo verwijderen?')) return;
  try { await writeClubLogo(cid, ''); if (onDone) onDone(); }
  catch (e) { alert('Kon het logo niet verwijderen.'); }
}
// Herbruikbaar logo-kaartje voor de beheerschermen. `reloadCall` is een JS-expressie (string)
// die het scherm herlaadt na een wijziging (bv. "loadClubBeheerView()").
function clubLogoCardHtml(cid, logo, reloadCall) {
  const rc = (reloadCall || '').replace(/"/g, '&quot;');
  const preview = logo
    ? `<img src="${logo}" alt="Clublogo" style="width:56px;height:56px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid var(--bdr)">`
    : `<div style="width:56px;height:56px;border-radius:8px;background:var(--bg2,#f3f4f6);border:1px dashed var(--bdr);display:flex;align-items:center;justify-content:center;color:var(--txt2)">${IC.shield}</div>`;
  return `<div class="card" style="display:flex;align-items:center;gap:12px">
    ${preview}
    <div style="flex:1">
      <div style="font-weight:600;font-size:14px">Clublogo</div>
      <div style="font-size:12px;color:var(--txt2)">${logo ? 'Wordt getoond op de ploegpagina en in de PDF.' : 'Nog geen logo ingesteld.'}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn btn-pale btn-sm" style="width:auto;margin:0;white-space:nowrap" onclick="pickClubLogo('${cid}',()=>{${rc}})">${logo ? 'Wijzigen' : 'Toevoegen'}</button>
      ${logo ? `<button class="btn btn-pale btn-sm" style="width:auto;margin:0;white-space:nowrap" onclick="removeClubLogo('${cid}',()=>{${rc}})">Verwijderen</button>` : ''}
    </div>
  </div>`;
}
function showAppointClubAdmin(cid) {
  openModal(`<h3>${icI(IC.shield)} Clubbeheerder aanstellen</h3>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Vul het e-mailadres in van de persoon. Die moet zich al minstens één keer aangemeld hebben in Match Delegate met dat e-mailadres, zodat we het account kennen.</p>
    <div class="fg"><label>E-mailadres</label><input id="appoint-email" type="email" placeholder="naam@voorbeeld.be" autocomplete="off" autofocus></div>
    <div class="auth-err" id="ap-err"></div>
    <button class="btn btn-green" onclick="doAppointClubAdmin('${cid}')">Aanstellen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Een aanstelling op e-mailadres mag enkel naar iemand die dat adres bewezen heeft. Zonder deze
// controle kon iemand zich registreren met het adres van de TVJO en de aanstelling opvangen die
// voor de TVJO bedoeld was. De index wordt bij elke aanmelding herschreven, dus een oude entry
// zonder `verified`-veld hoort hier ook bij "nog niet bevestigd" — vandaar de tweede zin.
function emailBevestigd(entry) { return !!(entry && entry.verified); }
const NIET_BEVESTIGD_MSG = 'Dit e-mailadres is nog niet bevestigd. Vraag de persoon om de link in de '
  + 'bevestigingsmail aan te klikken en daarna de app opnieuw te openen. Staat die mail er niet meer, '
  + 'dan kan hij een nieuwe versturen via Instellingen → Account.';
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
    if (!emailBevestigd(idx[uid])) { if (err) err.innerHTML = NIET_BEVESTIGD_MSG; return; }
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
// Club verwijderen (enkel app-eigenaar, enkel een LEGE club). Kuist ook de omgekeerde index van
// elke clubbeheerder op (users/{uid}/clubs/{cid}).
function deleteClub(cid, naam) {
  if (!isOwner || !fbdb) return;
  showConfirm('Club "' + esc(naam) + '" verwijderen? Dit kan enkel als er geen ploegen meer in zitten.', async () => {
    try {
      const c = (await fbOnce(fbdb.ref('clubs/' + cid))).val() || {};
      // Enkel ploegen die écht nog bestaan tellen; wees-index-entries van reeds verwijderde ploegen
      // negeren (en meteen opkuisen), zodat een club met "0 ploegen" in de UI ook echt verwijderbaar is.
      const teamIds = Object.keys(c.teams || {});
      const liveTeams = [];
      for (const tid of teamIds) {
        try {
          if ((await fbOnce(fbdb.ref('teams/' + tid + '/info'))).exists()) liveTeams.push(tid);
          else { try { await fbdb.ref('clubs/' + cid + '/teams/' + tid).remove(); } catch (e) {} }
        } catch (e) { liveTeams.push(tid); } // leesfout → voorzichtig, niet opkuisen
      }
      if (liveTeams.length > 0) { showToast('Deze club bevat nog ploegen. Verwijder of verplaats die eerst.', 'err'); return; }
      const admins = Object.keys(c.admins || {});
      for (const uid of admins) { try { await fbdb.ref('users/' + uid + '/clubs/' + cid).remove(); } catch (e) {} }
      await fbdb.ref('clubs/' + cid).remove();
      showToast('Club verwijderd.', 'ok');
      loadClubsAdminView();
    } catch (e) { showToast('Verwijderen mislukt, probeer opnieuw.', 'err'); }
  }, 'Verwijderen');
}
// Ploegbeheerder rechtstreeks aanstellen op e-mailadres (enkel app-eigenaar). Zet de persoon als
// ploegbeheerder (lid) van de ploeg + de omgekeerde index, zodat de ploeg meteen bij hem verschijnt.
function showAppointTeamAdmin(tid, teamNaam) {
  openModal(`<h3>${icI(IC.shield)} Ploegbeheerder aanstellen</h3>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Voor <b>${esc(teamNaam || 'deze ploeg')}</b>. Vul het e-mailadres in van de persoon; die moet zich al minstens één keer aangemeld hebben in Match Delegate.</p>
    <div class="fg"><label>E-mailadres</label><input id="appoint-team-email" type="email" placeholder="naam@voorbeeld.be" autocomplete="off" autofocus></div>
    <div class="auth-err" id="apt-err"></div>
    <button class="btn btn-green" onclick="doAppointTeamAdmin('${tid}')">Aanstellen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doAppointTeamAdmin(tid) {
  if (!isOwner || !fbdb) return;
  const email = ((document.getElementById('appoint-team-email') || {}).value || '').trim().toLowerCase();
  const err = document.getElementById('apt-err');
  if (!email) { if (err) err.textContent = 'Vul een e-mailadres in.'; return; }
  if (err) err.textContent = 'Bezig...';
  try {
    const idx = (await fbOnce(fbdb.ref('usersByEmail'))).val() || {};
    const uid = Object.keys(idx).find(u => ((idx[u] && idx[u].email) || '').toLowerCase() === email);
    if (!uid) { if (err) err.textContent = 'Geen account met dat e-mailadres gevonden. Vraag de persoon eerst één keer in te loggen.'; return; }
    if (!emailBevestigd(idx[uid])) { if (err) err.innerHTML = NIET_BEVESTIGD_MSG; return; }
    await fbdb.ref('teams/' + tid + '/members/' + uid).set('admin');
    await fbdb.ref('users/' + uid + '/teams/' + tid).set('admin');
    closeModal();
    showToast('Ploegbeheerder aangesteld.', 'ok');
    loadClubsAdminView();
  } catch (e) { if (err) err.textContent = 'Aanstellen mislukt. Zijn de rules gepubliceerd?'; }
}
// ===================== ALLE GEBRUIKERS (view) =====================
// Systeembreed overzicht van alle gebruikers per ploeg, voor de eigenaar. Vervangt de
// vroegere showAllUsersModal()-modal door een apart scherm: schaalt beter bij veel ploegen
// dankzij een zoekveld en per-ploeg inklapbare secties i.p.v. één lange platte lijst.
function renderAllUsers() {
  if (!isOwner) return `<div class="hdr"><button class="back" onclick="go('beheer')">‹</button><h1>${icI(IC.players)} Alle gebruikers</h1></div><div class="content"><p style="text-align:center;color:var(--txt2)">Geen toegang.</p></div>`;
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
    const teamsSnap = await fbOnce(fbdb.ref('teams'));
    const teamsVal = teamsSnap.val() || {};

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
      const tInfo = team.info || {};
      const teamNaam = tInfo.name || (team.club && team.club.name) || tid;
      const clubNaam = tInfo.clubName || '';
      const sectieTitel = (clubNaam ? clubNaam + ' · ' : '') + teamNaam;
      const uids = Object.keys(members).sort((a, b) =>
        (members[a] === 'admin' ? 0 : 1) - (members[b] === 'admin' ? 0 : 1));
      // Ledenloze ploegen tóch tonen: dit is het enige scherm met "Verwijderen" (ownerDeleteTeam) —
      // een ploeg die een clubbeheerder zonder lidmaatschap aanmaakte, was anders nergens hard te
      // verwijderen door de eigenaar.
      if (!uids.length) {
        sections.push(`<details class="card allusers-team" data-search="${esc(sectieTitel.toLowerCase())}" style="margin-bottom:12px">
          <summary style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <span style="flex:1;font-size:13px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px">${esc(sectieTitel)} <span style="font-weight:400;text-transform:none">(geen leden)</span></span>
            <button class="btn btn-red btn-sm" onclick="event.preventDefault();event.stopPropagation();ownerDeleteTeam('${tid}','${jsq(teamNaam)}')">Verwijderen</button>
          </summary>
          <div style="margin-top:10px"><p style="color:var(--txt2);font-size:13px;margin:0">Deze ploeg heeft geen leden.</p></div>
        </details>`);
        continue;
      }

      const users = uids.map(uid => ({ naam: (info[uid] || {}).name || '(onbekend)', email: (info[uid] || {}).email || '', role: members[uid] }));
      const rows = users.map(u => {
        const roleBadge = u.role === 'admin'
          ? `<span class="ts-role admin">${icI(IC.edit)} Ploegbeheerder</span>`
          : `<span class="ts-role viewer">${icI(IC.eye)} Kijker</span>`;
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr)">
          <span style="flex:1;font-size:14px"><b>${esc(u.naam)}</b><br><small style="color:var(--txt2)">${esc(u.email)}</small></span>
          ${roleBadge}
        </div>`;
      });
      const searchBlob = users.map(u => (u.naam + ' ' + u.email).toLowerCase()).join(' | ');
      sections.push(`<details class="card allusers-team" data-search="${esc(searchBlob)}" style="margin-bottom:12px" open>
        <summary style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <span style="flex:1;font-size:13px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px">${esc(sectieTitel)} <span style="font-weight:400;text-transform:none">(${uids.length})</span></span>
          <button class="btn btn-red btn-sm" onclick="event.preventDefault();event.stopPropagation();ownerDeleteTeam('${tid}','${jsq(teamNaam)}')">Verwijderen</button>
        </summary>
        <div style="margin-top:10px">${rows.join('')}</div>
      </details>`);
    }

    el.innerHTML = (sections.length ? sections.join('') : '<p style="text-align:center;color:var(--txt2)">Geen ploegen met leden.</p>');
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
// ===================== CLUBEXPORT =====================
// Twee vragen zitten hierachter: "kunnen we onze gegevens eruit krijgen als we stoppen" (een bestuur)
// en "geef me de speeltijd van de hele club" (een TVJO). Eén tabel met één regel per speler per
// wedstrijd beantwoordt beide: het is hun volledige uitvoer én de basis voor elke draaitabel.
// Bewust uit de CLOUD en niet van dit toestel: lokaal staan enkel de ploegen die je ooit opende, en
// dan zou de uitvoer afhangen van waar je toevallig geweest bent — dezelfde scheefheid die we bij de
// back-up hebben weggehaald.
// Bewust ZONDER notities: spelernotities en de gebeurtenis "kwetsuur" kunnen dingen over kinderen
// bevatten. In de app zijn die beheerder-only; in een CSV die naar een bestuur gemaild wordt niet meer.
function csvBestand(naam, rijen) {
  const esc2 = v => (v == null ? '' : String(v).replace(/"/g, '""'));
  const csv = '﻿' + rijen.map(r => r.map(c => `"${esc2(c)}"`).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = naam;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
// Alle ploegen van de club met hun kern en hun wedstrijden. Per ploeg apart, met voortgang op het
// scherm: bij vier ploegen van 36 wedstrijden duurt dit even, en een scherm dat stilstaat leest als
// een app die vastloopt.
async function clubExportOphalen(clubId, meld) {
  const clubTeams = (await fbOnce(fbdb.ref('clubs/' + clubId + '/teams'))).val() || {};
  const ids = Object.keys(clubTeams);
  const uit = [];
  for (let i = 0; i < ids.length; i++) {
    const tid = ids[i];
    if (meld) meld(`Ploeg ${i + 1} van ${ids.length} ophalen…`);
    try {
      const t = (await fbOnce(fbdb.ref('teams/' + tid))).val() || {};
      const kern = normalizeRosterArray(t.roster)[0] || null;
      if (!kern || !kern.name) continue;   // ploeg zonder kern-node: naam onbekend, overslaan
      uit.push({ id: tid, naam: kern.name, spelers: kern.players || [],
        tornooien: t.tournaments || {},
        wedstrijden: Object.values(t.matches || {}).filter(Boolean) });
    } catch (e) { /* geen leesrecht of leesfout: die ploeg valt weg, de rest niet */ }
  }
  return uit;
}
// De gegevens worden één keer opgehaald en hier bewaard; vroeger haalde elke knop alles opnieuw op.
let ceState = null;   // { clubId, ploegen, seizoen }
function ceSeizoenen(ploegen) {
  const s = new Set();
  ploegen.forEach(pl => (pl.wedstrijden || []).forEach(m => { if (m && !m.tournamentId) s.add(seasonOf(m)); }));
  return [...s].sort().reverse();
}
// Tornooiwedstrijden horen NIET bij de competitiecijfers: een tornooidag is vijf wedstrijdjes van tien
// minuten, en die samen met een competitiewedstrijd in één tabel maakt "gemiddelde minuten per
// wedstrijd" waardeloos. De statistieken in de app laten ze al buiten; de export deed dat niet.
// Ze verdwijnen daarom naar hun eigen tabblad in plaats van uit het bestand.
function ceMatches(pl, tornooi) {
  const sz = (ceState || {}).seizoen || 'alle';
  return (pl.wedstrijden || []).filter(m => m && (!!m.tournamentId === !!tornooi)
    && (sz === 'alle' || seasonOf(m) === sz));
}
// Eén doorloop over de gespeelde wedstrijden die per speler optelt. De sleutel bepaalt of je een
// speler over zijn ploegen samen ziet (voor "heeft dit kind genoeg gevoetbald?") of per ploeg
// (voor "hoe is de speeltijd in mijn ploeg verdeeld?").
function ceSpelerTotalen(ploegen, sleutelFn) {
  const per = new Map();
  ploegen.forEach(pl => {
    ceMatches(pl, false).filter(m => m.status === 'done').forEach(m => {
      const mins = calcMinutes(m), evts = m.events || [], seizoen = seasonOf(m);
      (m.players || []).forEach(p => {
        const k = sleutelFn(p, pl, seizoen);
        if (!per.has(k)) per.set(k, { naam: p.name || '', seizoen, ploegen: new Set(), nummers: new Set(),
          selecties: 0, gespeeld: 0, ms: 0, doelpunten: 0, assists: 0, geel: 0, rood: 0, keeper: 0, afwezig: 0 });
        const r = per.get(k);
        r.ploegen.add(pl.naam);
        if (p.number) r.nummers.add(String(p.number));
        if (p.absent) { r.afwezig++; return; }
        r.selecties++;
        const ms = (mins[p.id] || {}).ms || 0;
        if (ms > 0) { r.gespeeld++; r.ms += ms; }
        r.doelpunten += evts.filter(e => e.type === 'goal_us' && e.playerId === p.id).length;
        r.assists += evts.filter(e => e.type === 'goal_us' && e.assistId === p.id).length;
        r.geel += evts.filter(e => e.type === 'yellow_card' && e.playerId === p.id).length;
        r.rood += evts.filter(e => e.type === 'red_card' && e.playerId === p.id).length;
        if (wasKeeperAtAll(m, p.id)) r.keeper++;
      });
    });
  });
  return [...per.values()].sort((a, b) => (b.seizoen || '').localeCompare(a.seizoen || '')
    || a.naam.localeCompare(b.naam, 'nl'));
}
function ceSpelerRij(r) {
  const min = Math.round(r.ms / 60000);
  return [r.seizoen, r.naam, [...r.ploegen].join(', '), [...r.nummers].join(', '),
    r.selecties, r.gespeeld, r.afwezig, min,
    r.gespeeld ? Math.round(min / r.gespeeld) : 0,
    r.selecties ? Math.round(min / r.selecties) : 0,
    r.doelpunten, r.assists, r.geel, r.rood, r.keeper];
}
const CE_SPELER_KOP = ['Seizoen', 'Speler', 'Ploeg(en)', 'Rugnummer(s)', 'Geselecteerd', 'Gespeeld',
  'Niet beschikbaar', 'Totale minuten', 'Gem. per gespeelde wedstrijd', 'Gem. per selectie',
  'Doelpunten', 'Assists', 'Geel', 'Rood', 'Keeperbeurten'];
// Per speler per seizoen, over al zijn ploegen samen. Bij de leeftijdsrotatie van Voetbal Vlaanderen
// verhuist een speler middenin het seizoen; enkel per ploeg tonen zou hem in beide ploegen te weinig
// laten spelen. Samenvoegen gebeurt op het blijvende spelersnummer — een speler die met de hand in de
// nieuwe ploeg ingetikt is (i.p.v. via "Spelers doorschuiven") blijft dus twee personen, net zoals zijn
// carrière-overzicht dan leeg blijft.
function clubExportSpelerRijen(ploegen) {
  return [CE_SPELER_KOP].concat(
    ceSpelerTotalen(ploegen, (p, pl, seizoen) => seizoen + '|' + (p.globalId || p.name || '')).map(ceSpelerRij));
}
// En dezelfde speler per ploeg: dat is de vraag van de trainer van één ploeg.
function clubExportSpelerPerPloegRijen(ploegen) {
  return [CE_SPELER_KOP].concat(
    ceSpelerTotalen(ploegen, (p, pl, seizoen) => seizoen + '|' + pl.naam + '|' + (p.globalId || p.name || '')).map(ceSpelerRij));
}
function clubExportSpeeltijdRijen(ploegen, tornooi) {
  const rijen = [['Ploeg', 'Ploeg-label', 'Seizoen', 'Datum', 'Uur', 'Tegenstander', 'Thuis/uit', 'Soort',
    'Speler', 'Rugnummer', 'Minuten', 'Basis of bank', 'Beschikbaar', 'Doelpunten', 'Assists', 'Geel', 'Rood', 'Keeper']];
  ploegen.forEach(pl => {
    // Enkel gespeelde wedstrijden: een geplande wedstrijd heeft nul minuten en zou elk gemiddelde
    // vertekenen. Wat er nog aankomt, staat in het wedstrijdenbestand.
    ceMatches(pl, tornooi).filter(m => m.status === 'done').forEach(m => {
      const mins = calcMinutes(m);
      const evts = m.events || [];
      const gemeen = [pl.naam, m.subteam || '', seasonOf(m), m.date || '', m.time || '',
        m.opponent || '', m.location || '', m.competition || ''];
      (m.players || []).forEach(p => {
        const ms = (mins[p.id] || {}).ms || 0;
        rijen.push(gemeen.concat([
          p.name || '', p.number || '',
          Math.round(ms / 60000),
          p.starting ? 'Basis' : 'Bank',
          p.absent ? 'Niet gespeeld (afwezig)' : 'Beschikbaar',
          evts.filter(e => e.type === 'goal_us' && e.playerId === p.id).length,
          evts.filter(e => e.type === 'goal_us' && e.assistId === p.id).length,
          evts.filter(e => e.type === 'yellow_card' && e.playerId === p.id).length,
          evts.filter(e => e.type === 'red_card' && e.playerId === p.id).length,
          wasKeeperAtAll(m, p.id) ? 'ja' : '',
        ]));
      });
      // Wie niet beschikbaar was, hoort er ook in: dat is de noemer waarmee je ziet of iemand
      // structureel te weinig speelt of gewoon vaak niet kon. Oude data bewaart die als tekst,
      // nieuwere als een record — beide vormen aanvaarden.
      (m.absentPlayers || []).forEach(a => {
        const naam = typeof a === 'string' ? a : (a && a.name) || '';
        if (!naam) return;
        rijen.push(gemeen.concat([naam, '', 0, '', 'Niet beschikbaar', 0, 0, 0, 0, '']));
      });
    });
  });
  return rijen;
}
function clubExportWedstrijdRijen(ploegen) {
  const rijen = [['Ploeg', 'Ploeg-label', 'Seizoen', 'Datum', 'Uur', 'Tegenstander', 'Thuis/uit', 'Terrein',
    'Soort', 'Format', 'Blokken', 'Duur per blok', 'Status', 'Doelpunten voor', 'Doelpunten tegen']];
  ploegen.forEach(pl => {
    ceMatches(pl, false).forEach(m => {
      if (!m) return;
      const status = m.status === 'done' ? 'Gespeeld' : m.status === 'live' ? 'Bezig'
        : m.status === 'cancelled' ? 'Geannuleerd' : 'Gepland';
      const gespeeld = m.status === 'done';
      rijen.push([pl.naam, m.subteam || '', seasonOf(m), m.date || '', m.time || '', m.opponent || '',
        m.location || '', m.venue || '', m.competition || '', m.matchType || '',
        m.numQuarters || '', m.quarterDuration || '', status,
        gespeeld ? (m.scoreUs != null ? m.scoreUs : '') : '',
        gespeeld ? (m.scoreThem != null ? m.scoreThem : '') : '']);
    });
  });
  return rijen;
}
function clubExportOverzichtRijen(ploegen) {
  const sz = (ceState || {}).seizoen || 'alle';
  const rijen = [['Clubexport', activeClubName || ''],
    ['Gemaakt op', new Date().toISOString().slice(0, 10)],
    ['Seizoen', sz === 'alle' ? 'alle seizoenen' : sz], [],
    ['Ploeg', 'Spelers in de kern', 'Wedstrijden', 'Gespeeld', 'Gepland', 'Tornooien', 'Wedstrijden in tornooien']];
  ploegen.forEach(pl => {
    const w = ceMatches(pl, false), t = ceMatches(pl, true);
    // Aantal tornooien: bij voorkeur uit de tornooilijst van de ploeg zelf, want een tornooi zonder
    // wedstrijden zou anders niet meegeteld worden. Anders terugvallen op de tornooien die we in de
    // wedstrijden tegenkomen.
    const uitLijst = Object.values(pl.tornooien || {}).filter(x => x && (sz === 'alle' || seasonOf(x) === sz)).length;
    const uitWedstrijden = new Set(t.map(m => m.tournamentId)).size;
    rijen.push([pl.naam, (pl.spelers || []).length, w.length,
      w.filter(m => m.status === 'done').length, w.filter(m => m.status === 'planned').length,
      Math.max(uitLijst, uitWedstrijden), t.length]);
  });
  rijen.push([], ['Tornooiwedstrijden staan apart: hun korte wedstrijdjes zouden de gemiddelden van de competitie vertekenen.'],
    ['Spelernotities en kwetsuurdetails zitten bewust niet in dit bestand.']);
  return rijen;
}
// Eerst ophalen, dán kiezen: pas na het ophalen weet de app welke seizoenen er zijn. Zo hoeft er ook
// niet per knop opnieuw opgehaald te worden.
async function showClubExport(clubId) {
  if (!fbdb || !(isOwner || (myClubs || {})[clubId])) return;
  openModal(`<h3>${icI(IC.download)} Clubexport</h3>
    <p id="ce-melding" style="font-size:13px;color:var(--txt2);text-align:left">Gegevens van alle ploegen ophalen…</p>
    <button class="btn btn-gray" style="margin-top:10px" onclick="closeModal()">Annuleren</button>`);
  const meld = t => { const el = document.getElementById('ce-melding'); if (el) el.textContent = t; };
  try {
    const ploegen = await clubExportOphalen(clubId, meld);
    if (!ploegen.length) { meld('Geen ploegen gevonden waarvan je de gegevens mag lezen.'); return; }
    const seizoenen = ceSeizoenen(ploegen);
    ceState = { clubId, ploegen, seizoen: seizoenen[0] || 'alle' };
    ceVenster();
  } catch (e) { meld('Ophalen mislukt. Sluit dit venster en probeer opnieuw.'); }
}
function ceZetSeizoen(v) { if (ceState) { ceState.seizoen = v; ceVenster(); } }
function ceVenster() {
  const s = ceState; if (!s) return;
  const seizoenen = ceSeizoenen(s.ploegen);
  const w = s.ploegen.reduce((n, pl) => n + ceMatches(pl, false).length, 0);
  const t = s.ploegen.reduce((n, pl) => n + ceMatches(pl, true).length, 0);
  openModal(`<h3>${icI(IC.download)} Clubexport</h3>
    <p style="font-size:13px;color:var(--txt2);text-align:left;margin-bottom:10px">Alle ploegen van deze club, rechtstreeks uit de databank — dus ook ploegen die je op dit toestel nooit opende.</p>
    <div class="fg"><label>Seizoen</label>
      <select onchange="ceZetSeizoen(this.value)">
        ${seizoenen.map(z => `<option value="${esc(z)}" ${s.seizoen === z ? 'selected' : ''}>${esc(z)}</option>`).join('')}
        <option value="alle" ${s.seizoen === 'alle' ? 'selected' : ''}>Alle seizoenen</option>
      </select></div>
    <p style="font-size:13px;text-align:left;margin:0 0 12px"><b>${s.ploegen.length}</b> ${s.ploegen.length === 1 ? 'ploeg' : 'ploegen'} · <b>${w}</b> ${w === 1 ? 'wedstrijd' : 'wedstrijden'}${t ? ` · <b>${t}</b> in tornooien` : ''}</p>
    <button class="btn btn-org" onclick="doClubExport('excel')">${icI(IC.table)} Excel — alles in één bestand</button>
    <p style="font-size:12px;color:var(--txt2);text-align:left;margin:6px 0 14px">Zes tabbladen: <b>Overzicht</b>, <b>Spelers</b> (per speler, over zijn ploegen samen), <b>Spelers per ploeg</b>, <b>Wedstrijden</b>, <b>Speeltijd</b> en <b>Tornooiwedstrijden</b>.</p>
    <div class="sec" style="margin-top:0">Of los, als CSV</div>
    <button class="btn btn-pale" onclick="doClubExport('speeltijd')">${icI(IC.table)} Speeltijd per speler</button>
    <button class="btn btn-pale" style="margin-top:6px" onclick="doClubExport('wedstrijden')">${icI(IC.table)} Wedstrijdenlijst</button>
    <p style="font-size:12px;color:var(--txt2);text-align:left;margin:6px 0 12px">Tornooiwedstrijden staan apart en tellen niet mee in de speeltijd: hun korte wedstrijdjes zouden je gemiddelden vertekenen. Spelernotities en kwetsuurdetails zitten er bewust niet in.</p>
    <div id="ce-melding" style="font-size:13px;color:var(--org2);min-height:18px;text-align:left"></div>
    <button class="btn btn-gray" style="margin-top:6px" onclick="closeModal()">Sluiten</button>`);
}
function ceDownload(naam, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = naam;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function doClubExport(soort) {
  const s = ceState; if (!s) return;
  const meld = t => { const el = document.getElementById('ce-melding'); if (el) el.textContent = t; };
  const dag = new Date().toISOString().slice(0, 10);
  const sz = s.seizoen === 'alle' ? 'alle-seizoenen' : s.seizoen.replace('/', '-');
  const club = (activeClubName || 'club').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  try {
    if (soort === 'excel') {
      const bladen = [
        { naam: 'Overzicht', rijen: clubExportOverzichtRijen(s.ploegen) },
        { naam: 'Spelers', rijen: clubExportSpelerRijen(s.ploegen) },
        { naam: 'Spelers per ploeg', rijen: clubExportSpelerPerPloegRijen(s.ploegen) },
        { naam: 'Wedstrijden', rijen: clubExportWedstrijdRijen(s.ploegen) },
        { naam: 'Speeltijd', rijen: clubExportSpeeltijdRijen(s.ploegen, false) },
        { naam: 'Tornooiwedstrijden', rijen: clubExportSpeeltijdRijen(s.ploegen, true) },
      ];
      ceDownload(`${club}-export-${sz}-${dag}.xlsx`, xlsxBlob(bladen));
      meld(`${bladen[1].rijen.length - 1} spelers · ${bladen[3].rijen.length - 1} wedstrijden · ${bladen[5].rijen.length - 1} regels tornooi.`);
    } else if (soort === 'speeltijd') {
      const rijen = clubExportSpeeltijdRijen(s.ploegen, false);
      csvBestand(`${club}-speeltijd-${sz}-${dag}.csv`, rijen);
      meld(`${rijen.length - 1} regels.`);
    } else {
      const rijen = clubExportWedstrijdRijen(s.ploegen);
      csvBestand(`${club}-wedstrijden-${sz}-${dag}.csv`, rijen);
      meld(`${rijen.length - 1} wedstrijden.`);
    }
  } catch (e) { meld('Bestand maken mislukt. Probeer opnieuw.'); }
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
  if (!clubIds.length) return '<div class="hdr"><button class="back" onclick="go(\'clubbeheer\')">‹</button><h1>Spelers doorschuiven</h1></div><div class="content"><p style="text-align:center;color:var(--txt2)">Geen toegang.</p></div>';
  setTimeout(loadPlayerTransferView, 0);
  return `<div class="hdr"><button class="back" onclick="go('clubbeheer')">‹</button><h1>${icI(IC.swap)} Spelers doorschuiven</h1></div>
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
    ptState = { teams, srcTeamId: teams[0].id, dstTeamId: '', gekozen: new Set() };
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
      <div class="fg" style="margin-bottom:0"><label>Naar ploeg</label>
        ${dstOptions.length ? `<select onchange="ptState.dstTeamId=this.value">${dstOptions.map(t => `<option value="${esc(t.id)}" ${s.dstTeamId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select>` : '<p style="color:var(--txt2);font-size:13px;margin:0">Geen andere ploeg beschikbaar.</p>'}</div>
    </div>
    ${ptUndoHtml()}
    ${/* Vinkjes en geen keuzelijstje: bij een seizoensovergang gaan er vijftien spelers samen mee, en
         één speler kiezen is dan hetzelfde als er één aanvinken. Er blijft altijd iemand achter — wie
         stopt, of wie een jaar in dezelfde categorie blijft — dus "allemaal" mag geen automatisme zijn. */ ''}
    <div class="sec">Wie gaat mee? (${s.gekozen.size}/${players.length})</div>
    <div class="card">
      ${players.length ? `<div style="display:flex;gap:6px;margin-bottom:10px">
        <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="ptAlle(true)">Allemaal</button>
        <button class="btn btn-gray btn-sm" style="width:auto;margin:0" onclick="ptAlle(false)">Niemand</button>
      </div>
      ${sortedByName(players.map(p => ({ ...p, name: playerLabel(p) }))).map(p => `
        <div class="ts-team-row" style="cursor:pointer;gap:10px" onclick="ptToggle('${p.id}')">
          <div class="bulk-vink" style="${s.gekozen.has(p.id) ? 'background:var(--grn);border-color:var(--grn)' : ''}">${s.gekozen.has(p.id) ? icI(IC.done) : ''}</div>
          <span style="flex:1;font-size:15px">${esc(playerLabel(p))}</span>
          ${p.number ? `<span style="font-size:13px;color:var(--txt2)">${esc(p.number)}</span>` : ''}
        </div>`).join('')}`
      : `<p style="color:var(--txt2);font-size:14px;margin:0">Deze ploeg heeft nog geen spelers.</p>`}
    </div>
    <button class="btn btn-green" onclick="confirmTransferPlayer()">${icI(IC.swap)} Overzetten</button>
    <p style="font-size:12px;color:var(--txt2);margin-top:10px">Wie je aanvinkt, verdwijnt uit de spelerslijst van de bronploeg en komt bij de doelploeg. Zijn wedstrijden en statistieken bij de bronploeg blijven behouden, en op zijn spelerspagina blijft "Carrière — eerder bij" werken.<br><br>Wie achterblijft en gestopt is, haal je uit de spelerslijst via <b>Spelers</b> — daar kan je dat ook ongedaan maken.</p>`;
}
function ptToggle(id) {
  if (!ptState) return;
  if (ptState.gekozen.has(id)) ptState.gekozen.delete(id); else ptState.gekozen.add(id);
  const el = document.getElementById('playertransfer-content');
  if (el) el.innerHTML = renderPlayerTransferForm();
}
function ptAlle(aan) {
  if (!ptState) return;
  const src = ptState.teams.find(t => t.id === ptState.srcTeamId);
  ptState.gekozen = new Set(aan ? (src ? src.players.map(p => p.id) : []) : []);
  const el = document.getElementById('playertransfer-content');
  if (el) el.innerHTML = renderPlayerTransferForm();
}
function ptSrcChange(val) {
  ptState.srcTeamId = val; ptState.gekozen = new Set();
  if (ptState.dstTeamId === val) ptState.dstTeamId = '';
  // Enkel het formulier herbouwen met de al-geladen ptState — een volledige render() zou
  // via renderPlayerTransfer() opnieuw loadPlayerTransferView() triggeren, dat ptState.srcTeamId
  // meteen terug op de eerste ploeg (België) zou zetten en de keuze onmogelijk maakte.
  const el = document.getElementById('playertransfer-content');
  if (el) el.innerHTML = renderPlayerTransferForm();
}
function confirmTransferPlayer() {
  const s = ptState;
  if (!s || !s.gekozen.size) { showToast('Vink aan wie meegaat.', 'err'); return; }
  if (!s.dstTeamId || s.dstTeamId === s.srcTeamId) { showToast('Kies een andere doelploeg.', 'err'); return; }
  const srcTeam = s.teams.find(t => t.id === s.srcTeamId);
  const dstTeam = s.teams.find(t => t.id === s.dstTeamId);
  if (!srcTeam || !dstTeam) return;
  const mee = srcTeam.players.filter(p => s.gekozen.has(p.id));
  const blijft = srcTeam.players.length - mee.length;
  openModal(`<h3>${icI(IC.swap)} ${mee.length === 1 ? 'Speler' : mee.length + ' spelers'} overzetten?</h3>
    <p style="font-size:14px;margin-bottom:10px">Van <b>${esc(srcTeam.name)}</b> naar <b>${esc(dstTeam.name)}</b>.</p>
    <div style="max-height:35vh;overflow-y:auto;text-align:left;font-size:13px;border:1px solid var(--bdr);border-radius:8px;padding:8px;margin-bottom:10px">
      ${sortedByName(mee.map(p => ({ ...p, name: playerLabel(p) }))).map(p => `<div style="padding:2px 0">${esc(playerLabel(p))}</div>`).join('')}
    </div>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:14px">${blijft
      ? `${blijft} ${blijft === 1 ? 'speler blijft' : 'spelers blijven'} bij ${esc(srcTeam.name)}.`
      : `De spelerslijst van ${esc(srcTeam.name)} wordt daarmee leeg.`} Wedstrijden en statistieken blijven bij beide ploegen zoals ze zijn.</p>
    <button class="btn btn-green" onclick="doTransferPlayer()">${icI(IC.check)} Ja, overzetten</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Eén stap terug na een doorschuifbeurt: de twee spelerslijsten zoals ze waren. Bewust met dezelfde
// vervaltermijn als bij het bulk aanpassen — een knop van vorige week die belooft iets ongedaan te
// maken, is verwarrender dan nuttig.
const PT_UNDO_KEY = 'voetbal_kern_undo';
function ptUndoBeschikbaar() {
  try {
    const u = JSON.parse(localStorage.getItem(PT_UNDO_KEY) || 'null');
    if (!u || !u.src || !u.dst) return null;
    if (Date.now() - (u.when || 0) > 24 * 60 * 60 * 1000) return null;
    return u;
  } catch (e) { return null; }
}
function ptUndoHtml() {
  const u = ptUndoBeschikbaar();
  if (!u) return '';
  return `<div class="nudge" style="margin-bottom:12px">${icI(IC.history)} <b>${u.aantal} ${u.aantal === 1 ? 'speler' : 'spelers'}</b> doorgeschoven van ${esc(u.srcNaam)} naar ${esc(u.dstNaam)}.
    <button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="ptUndo()">Ongedaan maken</button>
    <button class="btn btn-gray btn-sm" style="margin-top:6px;width:100%" onclick="ptUndoVergeten()">Sluiten</button></div>`;
}
function ptUndoVergeten() { try { localStorage.removeItem(PT_UNDO_KEY); } catch (e) {} const el = document.getElementById('playertransfer-content'); if (el) el.innerHTML = renderPlayerTransferForm(); }
async function ptUndo() {
  const u = ptUndoBeschikbaar();
  if (!u || !fbdb) return;
  try {
    await Promise.all([
      fbdb.ref('teams/' + u.srcId + '/roster').set(u.src),
      fbdb.ref('teams/' + u.dstId + '/roster').set(u.dst),
    ]);
    try { localStorage.removeItem(PT_UNDO_KEY); } catch (e) {}
    showToast('Teruggezet.', 'ok');
    loadPlayerTransferView();
  } catch (e) { showToast('Terugzetten mislukt, probeer opnieuw.', 'err'); }
}
async function doTransferPlayer() {
  const s = ptState;
  // Speler overzetten is een club-operatie: eigenaar of clubbeheerder (spiegelt de UI-gate in
  // renderPlayerTransfer, die op myClubs gate't). De rules dwingen de fijne club-scoping af.
  if (!s || !fbdb || !(isOwner || Object.keys(myClubs || {}).length)) return;
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
    const gekozen = [...s.gekozen];
    const mee = (srcRoster[0].players || []).filter(p => gekozen.includes(p.id));
    if (!mee.length) { showToast('Spelers niet gevonden, probeer opnieuw.', 'err'); return; }
    // De twee lijsten bewaren zoals ze NU zijn, vóór we ze wijzigen — dat is de stap terug.
    const undo = { when: Date.now(), aantal: mee.length,
      srcId: s.srcTeamId, dstId: s.dstTeamId,
      srcNaam: (s.teams.find(t => t.id === s.srcTeamId) || {}).name || '',
      dstNaam: (s.teams.find(t => t.id === s.dstTeamId) || {}).name || '',
      src: jclone(srcRoster), dst: jclone(dstRoster) };
    // Eén nieuw record per speler: een verse lokale id in de doelploeg, maar hetzelfde blijvende
    // globalId — dát is wat "Carrière — eerder bij" laat werken.
    const zonderGlobalId = [];
    const nieuwe = mee.map(p => {
      const globalId = p.globalId || uid();
      if (!p.globalId) zonderGlobalId.push({ oudId: p.id, globalId });
      return Object.assign({}, p, { id: uid(), globalId });
    });
    srcRoster[0].players = (srcRoster[0].players || []).filter(p => !gekozen.includes(p.id));
    dstRoster[0].players = (dstRoster[0].players || []).concat(nieuwe);
    // Eén schrijfbeurt per ploeg, niet één per speler: bij vijftien spelers zou dat vijftien keer
    // dezelfde lijst overschrijven, met evenveel kansen om er halfweg uit te vallen.
    await Promise.all([
      fbdb.ref('teams/' + s.srcTeamId + '/roster').set(srcRoster),
      fbdb.ref('teams/' + s.dstTeamId + '/roster').set(dstRoster),
    ]);
    try { localStorage.setItem(PT_UNDO_KEY, JSON.stringify(undo)); } catch (e) {}
    // Carrière-backfill: had de speler nog geen globalId, dan dragen zijn historische wedstrijden
    // bij de bronploeg het zonet gegenereerde id ook niet — en blijft "Carrière — eerder bij" bij
    // een eerste overzetting leeg. Best-effort: het globalId terugschrijven in elke wedstrijd van
    // de bronploeg waarin hij (op rosterId) meespeelde. Een fout hier breekt de overzetting niet.
    // Eén doorloop over de wedstrijden voor álle spelers die nog geen globalId hadden, niet één
    // doorloop per speler.
    if (zonderGlobalId.length) {
      try {
        const msnap = await fbOnce(fbdb.ref('teams/' + s.srcTeamId + '/matches'));
        const matches = msnap.val() || {};
        for (const mid of Object.keys(matches)) {
          const players = matches[mid] && matches[mid].players;
          if (!Array.isArray(players)) continue;
          let changed = false;
          players.forEach(p => {
            if (!p || p.globalId) return;
            const hit = zonderGlobalId.find(z => z.oudId === p.rosterId);
            if (hit) { p.globalId = hit.globalId; changed = true; }
          });
          if (changed) await fbdb.ref('teams/' + s.srcTeamId + '/matches/' + mid + '/players').set(players);
        }
      } catch (e) {}
    }
    const n = mee.length;
    showToast(`${n} ${n === 1 ? 'speler' : 'spelers'} overgezet.`, 'ok');
    // Op het scherm blijven: de knop "Ongedaan maken" staat hier, en bij een seizoensovergang
    // schuif je meestal meteen de volgende ploeg door.
    loadPlayerTransferView();
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
// Afmelden. Een GAST wordt bovendien verwijderd i.p.v. enkel afgemeld: zijn anonieme account is
// daarna toch onbruikbaar (er hangt geen e-mailadres aan om mee terug te keren) en bleef anders als
// wees in Firebase staan — bij elke nieuwe gast komt er dan weer een bij.
// Enkel bij `isAnonymous`: een gewoon account verwijderen zou de gebruiker zijn toegang kosten.
// Bewust gekoppeld aan deze knop en niet aan het sluiten van de app: de signalen daarvoor
// (visibilitychange, pagehide) vuren ook als iemand even naar een andere app kijkt, en op iOS komt
// er bij het wegvegen vaak helemaal geen signaal.
async function authDoSignOut() {
  const user = currentUser;
  const uid = user ? user.uid : null;
  const wasGast = !!(user && user.isAnonymous);
  clearLocalDeviceData(uid);
  const afmelden = () => { try { fbauth.signOut(); } catch (e) {} };
  if (wasGast) {
    // Eerst zijn lidmaatschap en index-records opruimen — daarna mag het niet meer, want zonder
    // account weigeren de regels elke schrijfactie en blijft hij als naamloze kijker in de
    // ledenlijst staan. Pas daarna het account zelf. Mislukt dat, dan gewoon afmelden: een gast
    // mag hier nooit op vastlopen.
    try { await wisEigenCloudSporen(uid); } catch (e) {}
    try { await user.delete(); } catch (e) { afmelden(); }
  } else {
    afmelden();
  }
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
async function createTeam(name, clubId, joinAsMember, defaultMatchType, defaultFormation, defaultPeriodKey, defaultQuarterDuration) {
  if (joinAsMember === undefined) joinAsMember = true; // standaard: maker wordt ploegbeheerder (lid)
  if (!currentUser || !fbdb) return;
  name = (name || '').trim(); if (!name) return;
  // Standaard wedstrijdvorm + opstelling (staan klaar bij een nieuwe wedstrijd, per wedstrijd aanpasbaar).
  const dMatchType = MATCH_TYPES[defaultMatchType] ? defaultMatchType : '8v8';
  const dForms = FORMATIONS[dMatchType] || [];
  const dFormation = dForms.some(f => f.name === defaultFormation) ? defaultFormation : (dForms[0] ? dForms[0].name : '');
  // Aantal blokken + blokduur horen ook bij de ploeg (sinds v0.45.0). Ongeldig of niets meegegeven:
  // 4 kwarten van 15, precies wat er vroeger vast in de wizard stond.
  const dPeriodKey = PERIOD_TYPES[defaultPeriodKey] ? defaultPeriodKey : 'kwarten';
  const dDur = Number(defaultQuarterDuration) > 0 ? Number(defaultQuarterDuration) : (DUR_DEFAULT[dPeriodKey] || 15);
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
    // Het clublogo hoort hier om exact dezelfde reden bij. Voordien stond enkel de naam hier en kwam
    // het logo alleen op een ploeg terecht via writeClubLogo(), die over de ploegen loopt die op dat
    // moment bestaan — een ploeg die je daarna aanmaakte, bleef dus zonder logo (in de app én op elke
    // PDF) tot iemand het logo opnieuw opsloeg.
    try { const cl = (await fbOnce(fbdb.ref('clubs/' + clubId + '/info/logo'))).val(); if (cl) info.clubLogo = cl; } catch (e) {}
  }
  await fbdb.ref('teams/' + teamId).set({
    info,
    // Hybride (fase 2d): de clubbeheerder kan kiezen om de ploeg zelf mee te beheren (als lid) of
    // niet (puur via zijn clubrol). Bij niet-lid blijft members leeg tot een trainer aangesteld wordt.
    members: joinAsMember ? { [uid]: 'admin' } : {},
    club: { name, logo: '', theme: null },
    // useNumbers: false — een nieuwe ploeg start zonder vaste rugnummers (v0.55.0). LET OP: die
    // regel leeft op TWEE aanmaakwegen: hier (cloud, "Nieuwe ploeg in deze club") en in newTeam()
    // (lokaal scherm). De eerste versie zette hem enkel lokaal, en Tim maakt ploegen via de club
    // aan — het vinkje stond dus gewoon weer aan (gemeld 22-08-2026).
    roster: { [initialRosterId]: { id: initialRosterId, name, players: [], trainers: [], defaultMatchType: dMatchType, defaultFormation: dFormation, defaultPeriodKey: dPeriodKey, defaultQuarterDuration: dDur, useNumbers: false, fromCloud: true } }
  });
  // Registreer de ploeg in de club-index. Faalt dit stil én is de maker geen lid (joinAsMember
  // uit), dan zou de ploeg nergens zichtbaar zijn — meld het dan minstens.
  if (clubId) { try { await fbdb.ref('clubs/' + clubId + '/teams/' + teamId).set(true); } catch (e) { showToast('Ploeg aangemaakt, maar registreren in de club mislukte — herlaad Clubbeheer en probeer opnieuw.', 'err'); } }
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
// QR-code lokaal tekenen met de meegeleverde generator (qr/qrcode.js). Vroeger kwam dit plaatje van
// api.qrserver.com: dat werkte niet zonder internet — net aan de zijlijn waar je iemand wil laten
// aansluiten — en het stuurde de uitnodigings-URL mét geldige code naar een externe server.
// Levert een SVG (scherp op elk scherm, geen canvas nodig). Faalt de generator of ontbreekt hij,
// dan geeft dit een lege string terug en toont de modal de bestaande tekstfallback met code + link.
function qrSvg(data, px) {
  if (typeof qrcode !== 'function') return '';
  try {
    const qr = qrcode(0, 'M'); // 0 = automatisch de kleinste passende versie
    qr.addData(data);
    qr.make();
    const size = px || 180;
    return `<div style="width:${size}px;height:${size}px;background:#fff;border-radius:10px;padding:6px;box-sizing:border-box" role="img" aria-label="QR-code uitnodiging">
      ${qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true })}</div>`;
  } catch (e) { console.error('qrSvg:', e); return ''; }
}
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
  const shareText = 'Volg ' + teamName + ' via Match Delegate. Open de link of gebruik code ' + token + '.';
  const qr = qrSvg(joinUrl);
  openModal(`<h3>${icI(IC.link)} Uitnodiging — ${esc(teamName)}</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">${qr ? 'Scan de QR-code of deel de link.' : 'Deel de link of de code hieronder.'} Werkt ook voor mensen zonder account.</p>
    ${qr ? `<div id="invite-qr-wrap" style="display:flex;justify-content:center;margin-bottom:12px">${qr}</div>`
         : `<p style="text-align:center;color:var(--org2);font-size:12px;margin-bottom:8px">${icI(IC.warn)} QR-code niet beschikbaar — gebruik de code of link hieronder.</p>`}
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

// ---- Kijker vraagt ploegbeheer aan ----
function confirmRequestCoAdmin() {
  openModal(`<h3>${icI(IC.edit)} Ploegbeheer aanvragen</h3>
    <p style="color:var(--txt2);font-size:14px;margin-bottom:16px">Je vraagt de beheerder van <b>${esc(getClubName() || 'deze ploeg')}</b> om ploegbeheerder te worden. De beheerder moet dit eerst goedkeuren voordat je wedstrijden kan aanmaken of bewerken.</p>
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
    showToast('Aanvraag verstuurd. De beheerder ziet ze bij het openen van de app (Leden).', 'ok');
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
    const [miSnap, memSnap] = await Promise.all([
      fbOnce(fbdb.ref('memberInfo/' + tid)),
      fbOnce(fbdb.ref('teams/' + tid + '/members')),
    ]);
    // Aanvragen apart en tolerant: als deze read faalt (bv. rechtenkwestie) mag dat de rest
    // van de ledenlijst niet laten falen — dan tonen we gewoon geen openstaande aanvragen.
    const reqSnap = await fbOnce(fbdb.ref('teamAdminRequests/' + tid)).catch(() => null);
    const info = miSnap.val() || {};
    const members = memSnap.val() || {};
    const requests = (reqSnap && reqSnap.val()) || {};
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
        ? `<span class="ts-role admin">${icI(IC.edit)} Ploegbeheerder</span>`
        : `<span class="ts-role viewer">${icI(IC.eye)} Kijker</span>`;
      // Onbevestigd adres = de naam hierboven steunt op niets. Geen blokkade (jij gaf zelf de
      // uitnodiging en kent de persoon meestal), maar je hoort het wel te zien vóór je promoveert.
      const bevestigd = !!mi.verified;
      const btns = role !== 'admin'
        ? `<button class="btn btn-pale btn-sm" onclick="promoteMember('${uid}',${bevestigd ? 1 : 0})">Maak ploegbeheerder</button>
           <button class="btn btn-red btn-sm" onclick="removeMember('${uid}')">Verwijderen</button>`
        : (uid !== currentUser?.uid
          ? `<button class="btn btn-gray btn-sm" onclick="demoteMember('${uid}')">Maak kijker</button>`
          : '');
      return `<div class="ts-team-row ml-row" data-search="${esc((naam + ' ' + email).toLowerCase())}" style="cursor:default;flex-direction:column;align-items:stretch;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="flex:1;font-size:15px;font-weight:700"><b>${esc(naam)}</b><br><small style="color:var(--txt2);font-weight:400">${esc(email)}</small>${bevestigd ? '' : `<br><small style="color:var(--org2);font-weight:600">${icI(IC.warn)} e-mailadres niet bevestigd</small>`}</span>
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
      // Naam en e-mail in een aanvraag zijn door de aanvrager zelf ingevuld. Of dat adres van hem
      // is, staat enkel in de ledeninformatie — daar kan hij niet over liegen.
      const reqBevestigd = !!((info[uid] || {}).verified);
      return `<div class="ts-team-row ml-row" data-search="${esc((naam + ' ' + email).toLowerCase())}" style="cursor:default;border-left:3px solid var(--org);flex-direction:column;align-items:stretch;gap:8px">
        <div><b>${esc(naam)}</b><br><small style="color:var(--txt2)">${esc(email)}</small>${reqBevestigd ? '' : `<br><small style="color:var(--org2);font-weight:600">${icI(IC.warn)} e-mailadres niet bevestigd</small>`}<br><small style="color:var(--org)">Vraagt ploegbeheer aan</small></div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-green btn-sm" onclick="approveCoAdmin('${uid}',${reqBevestigd ? 1 : 0})">Goedkeuren</button>
          <button class="btn btn-red btn-sm" onclick="rejectCoAdmin('${uid}')">Weigeren</button>
        </div>
      </div>`;
    });
    const viewers = uids.filter(u => members[u] !== 'admin').length;
    const el = document.getElementById('members-list');
    if (el) el.innerHTML =
      (reqRows.length ? `<p style="font-size:12px;font-weight:700;color:var(--org);margin-bottom:6px">OPENSTAANDE AANVRAGEN</p>${reqRows.join('')}<hr style="margin:10px 0">` : '')
      + (rows.length ? rows.join('') : '<p style="text-align:center;color:var(--txt2)">Nog niemand vervoegd.</p>')
      + `<p style="text-align:center;color:var(--txt2);font-size:12px;margin-top:10px">${viewers} kijker${viewers===1?'':'s'} · ${uids.filter(u=>members[u]==='admin').length} ploegbeheerder${uids.filter(u=>members[u]==='admin').length===1?'':'s'}</p>`;
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
async function approveCoAdmin(uid, bevestigd) {
  const tid = activeTeamId;
  if (!isAdmin || !tid || !fbdb) return;
  const doe = async () => {
    try {
      await fbdb.ref('teams/' + tid + '/members/' + uid).set('admin');
      await fbdb.ref('teamAdminRequests/' + tid + '/' + uid).remove();
      showMembersModal();
    } catch (e) { showToast('Goedkeuren mislukt, probeer opnieuw.', 'err'); }
  };
  if (bevestigd) { doe(); return; }
  showConfirm('Deze persoon heeft zijn e-mailadres niet bevestigd, dus er is geen bewijs dat dat adres van hem is. '
    + 'Toch goedkeuren als ploegbeheerder?', doe, 'Goedkeuren', 'btn-green');
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
  showConfirm('Wil je deze ploegbeheerder terugzetten naar kijker?', async () => {
    try {
      await fbdb.ref('teams/' + activeTeamId + '/members/' + uid).set('viewer');
      showMembersModal();
    } catch (e) { showToast('Degraderen mislukt, probeer opnieuw.', 'err'); }
  }, 'Terugzetten', 'btn-org');
}

async function promoteMember(uid, bevestigd) {
  if (!isAdmin || !activeTeamId || !fbdb) return;
  showConfirm('Wil je deze persoon promoveren tot ploegbeheerder? Ze kunnen dan wedstrijden aanmaken en bewerken.'
    + (bevestigd ? '' : ' LET OP: deze persoon heeft zijn e-mailadres niet bevestigd, dus er is geen bewijs dat dat adres van hem is. Doe dit enkel als je zeker weet wie het is.'), async () => {
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
      ${localStorage.getItem('voetbal_pending_join') ? `<div class="nudge" style="margin-bottom:14px">${icI(IC.link)} Je volgt een uitnodigingslink voor een ploeg. Meld je aan, registreer of ga verder als gast om ze te kunnen volgen.</div>` : ''}
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
    // Bevestigingsmail. Bewust géén blokkade: het account werkt meteen, ook vóór de link
    // aangeklikt is. De bevestiging telt waar ze moet tellen — bij het aanstellen van een
    // club- of ploegbeheerder op e-mailadres. Mislukt het versturen (bv. te veel pogingen),
    // dan bestaat het account nog altijd; de herinnering in Instellingen vangt dat op.
    // In een venster en niet op het formulier: een nieuw account heeft nog geen ploegen, dus
    // onAuthChanged springt meteen naar het ploegkeuzescherm en het formulier (met #reg-err) is
    // dan al verdwenen. Een toast is er na drie tellen ook weer af. Een venster blijft staan tot
    // de gebruiker het wegklikt, en go() ruimt modals niet op.
    let mailFout = null;
    try { await cred.user.sendEmailVerification(); } catch (e) { mailFout = (e && e.code) || 'onbekend'; }
    if (err) err.textContent = '✓ Account aangemaakt!';
    openModal(mailFout === null
      ? `<h3>${icI(IC.mail)} Bevestig je e-mailadres</h3>
         <p style="font-size:13px;color:var(--txt2);line-height:1.6;margin-bottom:14px">We stuurden een mail naar
         <b style="color:var(--txt)">${esc(email)}</b>. Klik die link één keer aan — kijk ook in je spammap.<br><br>
         Je kan de app meteen gebruiken. Zolang je adres niet bevestigd is, kan je alleen niet als ploeg- of
         clubbeheerder aangesteld worden. Je kan de mail later opnieuw versturen via Instellingen → Account.</p>
         <button class="btn btn-org" onclick="closeModal()">Begrepen</button>`
      : `<h3>${icI(IC.warn)} Account aangemaakt, mail niet verstuurd</h3>
         <p style="font-size:13px;color:var(--txt2);line-height:1.6;margin-bottom:14px">Je account bestaat en je bent
         aangemeld, maar de bevestigingsmail kon niet verstuurd worden. Probeer het later opnieuw via
         Instellingen → Account.</p>
         <button class="btn btn-org" onclick="closeModal()">Sluiten</button>`);
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
  else if (err) err.textContent = result === 'not_found'
    ? 'Code niet gevonden. Controleer de code en probeer opnieuw.'
    : 'Geen verbinding — controleer je internet en probeer opnieuw.';
}

function renderGuestJoin() {
  return `<div class="auth-wrap">
    ${/* Zelfde kop als het aanmeldscherm: de fotoachtergrond met het pictogram en de naam. Hier
          stonden "Gastmodus" en de ondertitel los op de pagina met .auth-title/.auth-sub — die
          klassen zijn wit, want ze horen op die donkere hero thuis. Op de lichte achtergrond van
          dit scherm was de titel dus onleesbaar. Wat dit scherm apart maakt, staat nu in de kaart
          eronder met .auth-welcome, net als "Welkom" bij het aanmelden. */ ''}
    <div class="auth-hero">
      <div class="auth-hero-dot1"></div>
      <div class="auth-hero-dot2"></div>
      <img src="${APP_LOGO_TRANSPARANT}" alt="Match Delegate" class="auth-logo-img">
      <div class="auth-title">Match Delegate</div>
      <div class="auth-sub">Manage &nbsp;·&nbsp; Track &nbsp;·&nbsp; Share</div>
    </div>
    <div class="auth-box">
      <div class="auth-welcome">Gastmodus</div>
      <div class="auth-welcome-sub">Volg een live wedstrijd zonder account</div>
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
  // Gearchiveerde ploegen (fase 2d schijf 3) niet tonen in "Jouw ploegen" — ze blijven bereikbaar
  // via Clubbeheer (sectie Gearchiveerd) en kunnen daar hersteld worden.
  const teamIds = orderedTeamIds(Object.keys(userTeams)).filter(id => !archivedTeams[id]);
  // De groene "Beheer"-knop in de kop is weg sinds v1.1.0: hij leidde naar hetzelfde scherm als de
  // Beheer-chip op het homescherm, maar toonde er iets anders in. Wat erachter zat (App-beheer)
  // staat nu als een gewoon blok onderaan, en enkel voor de eigenaar. Zolang er nog geen eigenaar
  // is blijft het bereikbaar om die eenmalig te kunnen claimen.
  const showAppBeheer = !ownerUid || isOwner;
  // Clubnaam tonen boven de ploegen (fase 2f). Bij méér dan één club: echt groeperen met een kopje
  // per club (handig voor een ouder/kijker met kinderen in verschillende clubs) — dan geen herschik.
  // Bij één club: één clubkopje boven de gewone, herschikbare lijst. Bij nog onbekende clubnaam:
  // gewone platte lijst (het kopje verschijnt zodra de naam asynchroon geladen is).
  const distinctClubs = [...new Set(teamIds.map(id => teamClubNames[id]).filter(Boolean))];
  const grouped = distinctClubs.length > 1;
  const canReorder = teamIds.length > 1 && !grouped;
  // Eén logo per club opzoeken via een willekeurige ploeg uit die club (cache teamClubLogos).
  const clubLogoFor = cn => { const id = teamIds.find(t => teamClubNames[t] === cn && teamClubLogos[t]); return id ? teamClubLogos[id] : ''; };
  // Clubbeheerder van déze club? Dan is de hele clubkop de ingang naar Clubbeheer. Bewust de hele
  // balk en niet een knopje ernaast: dat knopje was ~30px hoog met de eerste ploegrij er vlak
  // onder, en aan de zijlijn tikte je dan de ploeg open in plaats van de club.
  const clubIdFor = cn => { const id = teamIds.find(t => teamClubNames[t] === cn && teamClubIds[t]); return id ? teamClubIds[id] : null; };
  // Welke beheerde clubs kregen effectief een klikbare kop? Wie een club beheert zonder er zelf een
  // ploeg van te volgen, heeft geen kop — en zou zonder de terugvalknop onderaan geen enkele ingang
  // naar zijn club meer hebben.
  const clubKoppen = {};
  const clubHdrHtml = cn => {
    const logo = clubLogoFor(cn);
    const cid = clubIdFor(cn);
    const mag = cid && myClubs && myClubs[cid] && !viewerMode;
    if (mag) clubKoppen[cid] = true;
    const binnen = `${logo ? `<img src="${logo}" alt="" style="width:26px;height:26px;object-fit:contain;border-radius:5px;flex-shrink:0">` : ''}
      <span style="flex:1;min-width:0"><span style="display:block;font-size:12px;font-weight:700;color:${mag ? 'var(--grn2)' : 'var(--txt2)'};text-transform:uppercase;letter-spacing:.5px">${esc(cn)}</span>
      ${mag ? `<span style="display:block;font-size:11.5px;font-weight:600;color:var(--grn2);text-transform:none;letter-spacing:0">Club beheren</span>` : ''}</span>
      ${mag ? `<span style="color:var(--grn2);font-size:19px;font-weight:700">›</span>` : ''}`;
    return mag
      ? `<div onclick="_clubBeheerId='${cid}';go('clubbeheer')" style="display:flex;align-items:center;gap:9px;margin:14px 0 6px;padding:11px 12px;background:var(--grnp);border-radius:10px;cursor:pointer">${binnen}</div>`
      : `<div style="display:flex;align-items:center;gap:8px;margin:14px 0 6px">${binnen}</div>`;
  };
  const teamRowHtml = id => {
    const role = userTeams[id];
    const name = teamNames[id] || id;
    const handle = canReorder ? `<span class="ts-drag-handle" onclick="event.stopPropagation()">${icI(IC.grip)}</span>` : '';
    return `<div class="ts-team-row" data-team-id="${id}" onclick="selectTeam('${id}')">
          ${handle}
          <span class="ts-name" id="tsname-${id}">${esc(name)}</span>
          <span class="ts-role ${role}">${role === 'admin' ? `${icI(IC.edit)} Ploegbeheerder` : `${icI(IC.eye)} Kijker`}</span>
        </div>`;
  };
  let teamRows;
  if (!teamIds.length) {
    teamRows = `<div class="empty"><div class="ei">${icI(IC.players)}</div><p>Je volgt nog geen ploegen.<br>Volg er een met een uitnodigingscode.</p></div>`;
  } else if (grouped) {
    const buckets = {}; const order = [];
    teamIds.forEach(id => { const cn = teamClubNames[id] || 'Overige ploegen'; if (!(cn in buckets)) { buckets[cn] = []; order.push(cn); } buckets[cn].push(id); });
    order.sort((a, b) => a === 'Overige ploegen' ? 1 : b === 'Overige ploegen' ? -1 : a.localeCompare(b, 'nl'));
    teamRows = order.map(cn => `<div style="margin-bottom:4px">${clubHdrHtml(cn)}${buckets[cn].map(teamRowHtml).join('')}</div>`).join('');
  } else {
    // Eén (of nog onbekende) club: clubkopje tonen als de naam gekend is én ALLE ploegen bij die
    // club horen — anders zou een club-loze ploeg onder het verkeerde clubkopje lijken te staan.
    const header = (distinctClubs.length === 1 && teamIds.every(id => teamClubNames[id])) ? clubHdrHtml(distinctClubs[0]) : '';
    teamRows = header + `<div id="ts-team-list">${teamIds.map(teamRowHtml).join('')}</div>`;
  }
  if (canReorder) setTimeout(initTeamReorder, 0);

  // Ververs namen én clubnamen asynchroon — ook als er al een (mogelijk verouderde) waarde in de
  // cache zit. fbOnce() i.p.v. ruwe once('value'): offline blijft dat anders eeuwig hangen. Een
  // timeout betekent enkel "geen verbinding", niet "ploeg bestaat niet meer" — enkel bij een echte
  // fout opruimen. Als een clubnaam nieuw gekend raakt: één keer herrenderen zodat de groepering
  // per club verschijnt (de volgende pass vindt niets nieuw → geen lus).
  setTimeout(() => {
    let needsRerender = false;
    Promise.all(teamIds.map(id => {
      const el = document.getElementById('tsname-' + id);
      return fbOnce(fbdb.ref('teams/' + id + '/info'))
        .then(s => {
          if (!s.exists()) { pruneDeadTeam(id); return; }
          const info = s.val() || {};
          if (info.name) { teamNames[id] = info.name; if (el) el.textContent = info.name; }
          if (info.clubName && teamClubNames[id] !== info.clubName) { teamClubNames[id] = info.clubName; needsRerender = true; }
          // clubId onthouden zodat selectTeam() de clubbeheerder-rechten synchroon kan zetten en
          // niet meer afhangt van een info-fetch die in een timeout kan lopen (zie fetchTeamInfo).
          rememberTeamClubId(id, info.clubId || null);
          const nl = info.clubLogo || ''; if ((teamClubLogos[id] || '') !== nl) { rememberTeamClubLogo(id, nl); needsRerender = true; }
          // Ploeg die intussen gearchiveerd raakte → uit de lijst halen (herrenderen).
          if (info.archived && !archivedTeams[id]) { archivedTeams[id] = true; needsRerender = true; }
        })
        .catch(e => { if (e && e.message !== 'fb-timeout') pruneDeadTeam(id); });
    })).then(() => { if (needsRerender && view === 'teamselect') render(); });
  }, 0);

  return `<div class="ts-wrap">
    <div class="ts-hdr">
      <img src="logo_no_background.png" alt="Match Delegate" class="ts-logo">
      <div class="ts-hdr-text">
        <div class="ts-hdr-name">Match Delegate</div>
        <p>${esc((currentUser && (currentUser.displayName || currentUser.email)) || '')}</p>
      </div>
      <button class="hdr-gear" onclick="_settingsFrom=view;go('settings')" title="Instellingen">${icI(IC.gear)}</button>
    </div>
    <div class="ts-content">
      ${teamIds.length > 0 ? `<div class="sec" style="margin-bottom:10px">Jouw ploegen</div>` : ''}
      ${teamRows}
      ${/* Heette "Ploeg toevoegen", maar dat beloofde iets anders dan de knop doet: je maakt hier
            geen ploeg, je gaat er een volgen met een code die je van een trainer kreeg. Aanmaken
            gebeurt in Clubbeheer. Kop, knop en venster zeggen nu alle drie hetzelfde woord —
            eerst waren dat "toevoegen", "bekijken" en "vervoegen". */ ''}
      <div class="sec" style="margin-top:20px;margin-bottom:10px">Een ploeg volgen</div>
      <button class="btn btn-gray" onclick="showJoinTeamModal()">${icI(IC.link)} Ploeg volgen via code</button>
      <p style="font-size:12px;color:var(--txt2);margin-top:6px">Kreeg je een code van een trainer? Dan komt die ploeg hierboven bij je lijst.${Object.keys(myClubs || {}).length ? ' Een <b>nieuwe</b> ploeg maak je aan bij Clubbeheer.' : ''}</p>
      ${(() => {
        // Terugvalknop: enkel voor beheerde clubs die hierboven géén klikbare kop kregen.
        const zonderKop = Object.keys(myClubs || {}).filter(cid => !clubKoppen[cid]);
        if (!zonderKop.length || viewerMode) return '';
        return `<div class="sec" style="margin-top:20px;margin-bottom:10px">Clubbeheer</div>
      <button class="btn btn-org" onclick="_clubBeheerId='${zonderKop[0]}';go('clubbeheer')">${icI(IC.players)} ${zonderKop.length > 1 ? 'Mijn clubs beheren' : 'Mijn club beheren'}</button>`;
      })()}
      ${showAppBeheer ? `<div class="sec" style="margin-top:20px;margin-bottom:10px">Beheer van de app</div>
      <button class="btn btn-dark" onclick="_beheerFrom='teamselect';go('beheer')">${icI(IC.shield)} App-beheer</button>
      <p style="font-size:12px;color:var(--txt2);margin-top:6px">Clubs en clubbeheerders, alle gebruikers, onderhoud.</p>` : ''}
      <div style="display:flex;gap:8px;margin-top:20px">
        <button class="btn btn-pale" style="flex:1" onclick="cloudLogout()">Afmelden</button>
        <button class="btn btn-pale" style="flex:1" onclick="go('handleiding')">${icI(IC.clipboard)} Handleiding</button>
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
    <div class="fg"><label>Standaard wedstrijdvorm</label><select id="ct-mt" onchange="ctFormatChange()">${Object.keys(MATCH_TYPES).map(k => `<option value="${k}" ${k==='8v8'?'selected':''}>${k}</option>`).join('')}</select></div>
    <div class="fg"><label>Standaard opstelling</label><select id="ct-form">${FORMATIONS['8v8'].map(f => `<option value="${esc(f.name)}">${esc(f.name)}</option>`).join('')}</select></div>
    <div class="fg"><label>Standaard aantal blokken</label><select id="ct-pk" onchange="ctPeriodChange()">${Object.keys(PERIOD_TYPES).map(k => `<option value="${k}" ${k==='kwarten'?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
    <div class="fg"><label>Standaard duur per blok</label>
      <select id="ct-dur" onchange="onDurChange('ct-dur','ct-dur-custom')">${durOptsHtml('kwarten', DUR_DEFAULT['kwarten'])}</select>
      <input id="ct-dur-custom" type="number" min="1" max="60" inputmode="numeric" placeholder="minuten per blok" style="display:none;margin-top:6px"></div>
    <p style="font-size:12px;color:var(--txt2);margin:-4px 0 12px">Staat klaar bij een nieuwe wedstrijd en bij het inlezen van een kalender; je kan het per wedstrijd nog aanpassen en later wijzigen bij "Ploeg bewerken".</p>
    ${joinRow}
    <div class="auth-err" id="ct-err"></div>
    <button class="btn btn-org" id="ct-btn" onclick="doCreateTeam()">Aanmaken</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}

// Opstelling-keuzes in het "Nieuwe ploeg"-popup volgen de gekozen wedstrijdvorm.
function ctFormatChange() {
  const mt = (document.getElementById('ct-mt') || {}).value || '8v8';
  const sel = document.getElementById('ct-form'); if (!sel) return;
  sel.innerHTML = (FORMATIONS[mt] || []).map(f => `<option value="${esc(f.name)}">${esc(f.name)}</option>`).join('');
}
// Idem voor de duurtijden: welke er te kiezen zijn, hangt af van het aantal blokken.
function ctPeriodChange() {
  const pk = (document.getElementById('ct-pk') || {}).value || 'kwarten';
  const sel = document.getElementById('ct-dur'); if (!sel) return;
  sel.innerHTML = durOptsHtml(pk, DUR_DEFAULT[pk]);
  const inp = document.getElementById('ct-dur-custom'); if (inp) inp.style.display = 'none';
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
  const dMatchType = (document.getElementById('ct-mt') || {}).value || '8v8';
  const dFormation = (document.getElementById('ct-form') || {}).value || '';
  try {
    await createTeam(name, _pendingCreateClubId, joinAsMember, dMatchType, dFormation,
      (document.getElementById('ct-pk') || {}).value || 'kwarten',
      readDur('ct-dur', 'ct-dur-custom', 0));
    _pendingCreateClubId = null;
    closeModal();
  } catch (e) {
    console.error('createTeam fout:', e);
    if (e && e.code === 'PERMISSION_DENIED') {
      if (err) err.textContent = 'Je hebt geen toestemming om ploegen aan te maken. Enkel de clubbeheerder maakt ploegen aan binnen zijn club — contacteer de clubbeheerder of de eigenaar.';
    } else if (err) {
      err.textContent = 'Onbekende fout. Controleer je internetverbinding.';
    }
    if (btn) btn.disabled = false;
  }
}

function showJoinTeamModal() {
  openModal(`<h3>${icI(IC.link)} Ploeg volgen</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:14px">Vraag de uitnodigingscode aan de beheerder van de ploeg.</p>
    <div class="fg"><label>Uitnodigingscode</label><input id="join-token" type="text" placeholder="bv. AB12CD" autocomplete="off" style="text-transform:uppercase;letter-spacing:4px;font-size:22px;text-align:center" autofocus></div>
    <div class="auth-err" id="jt-err"></div>
    <button class="btn btn-green" onclick="doJoinTeam()">Volgen</button>
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
    if (result !== 'ok') { if (err) err.textContent = 'Geen verbinding — controleer je internet en probeer opnieuw.'; return; }
    closeModal();
  } catch (e) {
    console.error('joinTeam fout:', e);
    if (err) err.textContent = 'Volgen mislukt, controleer je internetverbinding.';
  }
}

// ===================== STATE =====================
let view = 'home', match = null, tab = 'wedstrijd', timerInt = null, _settingsFrom = 'home', _beheerFrom = 'home';
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
// Vaste ordening voor élke spelerslijst: alfabetisch op FAMILIENAAM, met de voornaam als
// tiebreaker. Eén regel voor het hele scherm, het verslag, de PDF en de CSV, zodat je een naam
// altijd op dezelfde plaats zoekt. Rangschikkingen (topschutters, meeste minuten, fair-play) houden
// natuurlijk hun eigen orde — dat zijn geen lijsten maar klassementen.
function byLastNameNl(a, b) {
  const an = (a && a.name) || '', bn = (b && b.name) || '';
  return _lastName(an).localeCompare(_lastName(bn), 'nl') || an.localeCompare(bn, 'nl');
}
function sortedByName(list) { return (list || []).slice().sort(byLastNameNl); }
function playersOnField(m) { return sortedByName(m.players.filter(p => p.onField && !p.absent)); }
// Bank = wie ingezet kan worden. Een uitgesloten speler (rode kaart) hoort daar niet in: hij mag
// niet meer op het veld en zou hier aantikbaar staan (zie magOpHetVeld in core.js).
// magNogMeedoen: ook wie de wedstrijd verlaten heeft valt weg. Dit is de bank van NU (livescherm,
// wissel na blessure), dus zonder tijdvenster — een vertrek in de toekomst bestaat niet.
function playersOnBench(m) { return sortedByName(m.players.filter(p => !p.onField && magNogMeedoen(m, p))); }
// Bij retroactief event: spelers op het veld/bank at het begin van het geselecteerde kwart.
function playersOnFieldForEvent(m) {
  if (_postEventQuarter != null) return playersAtPeriodStart(m, _postEventQuarter);
  return playersOnField(m);
}
// Veldbezetting inclusief reeds ingeplande pauzewissels (voor het plannen van meerdere wissels op rij).
function effectiveOnField(m) {
  const on = new Set(m.players.filter(p => p.onField && !p.absent).map(p => p.id));
  for (const s of (m.pendingSubs || [])) { on.delete(s.outId); on.add(s.inId); }
  // Vangnet: een afwezig gemarkeerde speler hoort hier nooit in, ook niet via een ingeplande
  // pauzewissel van vóór die markering. Anders toont de wisselmodal een naam die al weg is.
  return m.players.filter(p => on.has(p.id) && !p.absent);
}

function calcMinutes(m) {
  const mins = {}, totalMs = getGameTimeMs(m), entry = {};
  for (const p of m.players) mins[p.id] = { ms: 0, absent: !!p.absent };
  for (const p of m.players) if (p.starting && !p.absent) entry[p.id] = 0;
  const evts = [...m.events].sort((a,b) => a.gameTimeMs - b.gameTimeMs);
  for (const e of evts) {
    // EENZIJDIGE WISSELS (v0.49.0): iemand kan eraf gaan zónder vervanger (playerInId is dan null)
    // of erbij komen zónder dat er iemand af gaat (playerOutId null). Zonder de controles hieronder
    // kwam er een teller onder de sleutel `null` te staan, en liet het eerstvolgende eenzijdige
    // event de hele berekening crashen op `mins[null].ms`. Dat nam élk scherm mee dat speelminuten
    // toont: het pauzescherm, de wisselkeuze ("minst gespeeld eerst"), het blessurescherm, het
    // verslag en de statistieken. Gevonden in de zijlijntest van 22-08-2026.
    // De `mins[...]`-controle is een vangnet voor een speler die intussen uit de selectie gehaald
    // is: zijn teller opruimen mag altijd, optellen enkel als hij nog bestaat.
    if (e.type === 'substitution') {
      if (e.playerOutId && entry[e.playerOutId] !== undefined) {
        if (mins[e.playerOutId]) mins[e.playerOutId].ms += e.gameTimeMs - entry[e.playerOutId];
        delete entry[e.playerOutId];
      }
      if (e.playerInId) entry[e.playerInId] = e.gameTimeMs;
    }
    if (e.type === 'red_card' && e.playerId && entry[e.playerId] !== undefined) {
      if (mins[e.playerId]) mins[e.playerId].ms += e.gameTimeMs - entry[e.playerId];
      delete entry[e.playerId];
    }
    // Blessure waarbij de speler het veld verlaat zonder directe wissel: stop de teller.
    if (e.type === 'injury' && e.leavesField && e.playerId && entry[e.playerId] !== undefined) {
      if (mins[e.playerId]) mins[e.playerId].ms += e.gameTimeMs - entry[e.playerId];
      delete entry[e.playerId];
    }
  }
  for (const [pid, entryMs] of Object.entries(entry)) if (mins[pid]) mins[pid].ms += totalMs - entryMs;
  // Wie als "niet aanwezig" gemarkeerd is, krijgt 0 speelminuten — ook al kwam hij eerder in via
  // een wissel (zoals de "Niet aanwezig"-actie belooft).
  for (const p of m.players) if (p.absent && mins[p.id]) mins[p.id].ms = 0;
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
    // Zelfde eenzijdige-wisselvalstrik als in calcMinutes hierboven — zie de uitleg daar. Deze
    // functie had ze ook, en crashte op `intervals[null].push`.
    if (e.type === 'substitution') {
      if (e.playerOutId && entry[e.playerOutId] !== undefined) {
        if (intervals[e.playerOutId]) intervals[e.playerOutId].push({ start: entry[e.playerOutId], end: e.gameTimeMs });
        delete entry[e.playerOutId];
      }
      if (e.playerInId) entry[e.playerInId] = e.gameTimeMs;
    }
    if (e.type === 'red_card' && e.playerId && entry[e.playerId] !== undefined) {
      if (intervals[e.playerId]) intervals[e.playerId].push({ start: entry[e.playerId], end: e.gameTimeMs });
      delete entry[e.playerId];
    }
    if (e.type === 'injury' && e.leavesField && e.playerId && entry[e.playerId] !== undefined) {
      if (intervals[e.playerId]) intervals[e.playerId].push({ start: entry[e.playerId], end: e.gameTimeMs });
      delete entry[e.playerId];
    }
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
// Naam van de tegenstander voor eventlabels: bij een doelpunt tegen lees je liever wie scoorde
// dan enkel "Tegendoel" — zelfde lijn als de "voor <ploegnaam>"-labels bij hoekschop/vrije trap.
function oppName(m) { return (m && m.opponent) || 'tegenstander'; }
// evtLabel() bouwt HTML op (gebruikt in innerHTML voor het gebeurtenissenlog, o.a. bij
// kijkers) — spelersnamen en vrije tekst (reason/cornerType) komen van gebruikersinvoer
// en moeten hier ge-esc't worden. pName() zelf blijft ongefilterd: die wordt ook gebruikt
// Een positiewissel als BEWEGINGEN: "Bram naar 7 RM · Emiel naar 11 LA". Dat zegt waar elke speler
// terechtkomt; "A ↔ B" laat je dat zelf uitzoeken, en bij een keten van drie staat dezelfde speler
// er dan twee keer in alsof er iets fout ging. posA/posB zijn de posities van vóór de wissel, dus
// pA belandt op posB en omgekeerd. Oudere events zonder die snapshots vallen terug op de ruilvorm.
function posSwapBeweging(m, e, pijl) {
  // Verhuizing naar een lege plek (geen tegenspeler): één beweging, met de code van de bestemming —
  // die zegt hier meer dan een nummer, want een vrije plek heeft er niet altijd een.
  if (e.pA && !e.pB && e.naarPlek) {
    return `${pName(m, e.pA)} ${pijl} ${matchGridLabel(m, e.naarPlek)}`;
  }
  const naar = (spelerId, pos) => {
    const nr = pos && pos.posNum ? String(pos.posNum) : '';
    const code = nr ? posCode(nr, m.matchType) : '';
    return nr ? `${pName(m, spelerId)} ${pijl} ${nr}${code ? ' ' + code : ''}` : '';
  };
  const a = naar(e.pA, e.posB), b = naar(e.pB, e.posA);
  if (!a || !b) return `${pName(m, e.pA)} ${pijl === '→' ? '↔' : '<->'} ${pName(m, e.pB)}`;
  return `${a} · ${b}`;
}
// Positiewisselingen die op hetzelfde moment gebeuren vormen SAMEN één herschikking. "A ruilt met
// B" gevolgd door "B ruilt met C" is netto: A naar B's plek, B naar C's plek, C naar A's plek. Elk
// event apart tonen laat een tussenstand zien die nooit op het veld gestaan heeft — je las dan dat
// iemand naar 9 ging en even later opnieuw ergens anders naartoe.
// Deze functie rekent de reeks door en geeft per speler enkel het EINDpunt.
function posSwapReeksBewegingen(m, events) {
  const start = {}, pos = {};
  for (const e of events) {
    if (!e.pA || !e.pB || !e.posA || !e.posB) return null;   // oud event zonder posities: niet te bepalen
    if (!(e.pA in pos)) { pos[e.pA] = { ...e.posA }; start[e.pA] = { ...e.posA }; }
    if (!(e.pB in pos)) { pos[e.pB] = { ...e.posB }; start[e.pB] = { ...e.posB }; }
    const t = pos[e.pA]; pos[e.pA] = pos[e.pB]; pos[e.pB] = t;
  }
  const uit = [];
  Object.keys(pos).forEach(id => {
    const s = start[id], n = pos[id];
    if (!n || !n.posNum) return;
    if (s && String(s.posNum) === String(n.posNum)) return;   // netto op zijn plek gebleven
    const code = posCode(n.posNum, m.matchType);
    uit.push({ id, naam: pName(m, id), plek: `${n.posNum}${code ? ' ' + code : ''}` });
  });
  return uit;
}
// Eén regel voor een reeks positiewisselingen. Bij één enkele wissel is dit hetzelfde als vroeger.
function posSwapReeksTekst(m, events, pijl) {
  const bew = posSwapReeksBewegingen(m, events);
  if (!bew || !bew.length) {
    // Geen posities bekend (oude wedstrijd): terugvallen op de ruilvorm, per event.
    return events.map(e => `${pName(m, e.pA)} ${pijl === '→' ? '↔' : '<->'} ${pName(m, e.pB)}`).join(' · ');
  }
  return bew.map(b => `${b.naam} ${pijl} ${b.plek}`).join(' · ');
}
// Opeenvolgende positiewisselingen op hetzelfde moment samenvoegen tot één regel. "Hetzelfde
// moment" is dezelfde SPEELMINUUT (niet dezelfde milliseconde): twee wissels die je 20 seconden
// na elkaar intikt horen ook bij dezelfde herschikking. Pauzewissels groeperen enkel met
// pauzewissels van hetzelfde deel. Alles wat geen posSwap is blijft ongemoeid; de onderliggende
// events blijven apart bestaan, enkel de weergave voegt samen.
function groepeerPosSwaps(list) {
  const uit = [];
  const minuut = ms => Math.floor((ms || 0) / 60000);
  for (const e of list) {
    const vorige = uit[uit.length - 1];
    const zelfdeMoment = vorige && vorige.type === 'posSwapReeks'
      && !!vorige.atBreak === !!e.atBreak
      && vorige.quarterNum === e.quarterNum
      && (vorige.atBreak || minuut(vorige.gameTimeMs) === minuut(e.gameTimeMs));
    // Een verhuizing naar een lege plek (geen pB) hoort niet in een reeks: die reeks rekent ruilen door
    // om per speler het eindpunt te vinden, en een verhuizing is geen ruil. Ze blijft dus een eigen
    // regel, die posSwapBeweging als één beweging toont.
    const isVerhuis = e.type === 'posSwap' && !e.pB;
    if (e.type === 'posSwap' && !isVerhuis && zelfdeMoment) { vorige.events.push(e); continue; }
    if (e.type === 'posSwap' && !isVerhuis) {
      uit.push({ type: 'posSwapReeks', events: [e], atBreak: e.atBreak, quarterNum: e.quarterNum, gameTimeMs: e.gameTimeMs, id: e.id });
      continue;
    }
    uit.push(e);
  }
  // Een reeks van één is gewoon dat ene event: dan hoeft er niets speciaals te gebeuren.
  return uit.map(x => (x.type === 'posSwapReeks' && x.events.length === 1) ? x.events[0] : x);
}
// voor platte tekst (WhatsApp-deelbericht, CSV), waar HTML-entities fout zouden staan.
function evtLabel(e, m) {
  const pn = id => esc(pName(m, id));
  switch(e.type) {
    case 'goal_us': { let s = `${icI(IC.goal)} Doelpunt ${pn(e.playerId)}`; if (e.assistId) s += ` (assist ${pn(e.assistId)})`; return s; }
    case 'goal_them': return `${icI(IC.goal)} Doelpunt ${esc(oppName(m))}`;
    case 'own_goal': return `${icI(IC.goal)} Eigen doel (${pn(e.playerId)})`;
    case 'own_goal_them': return `${icI(IC.goal)} Eigen doel tegenstander`;
    case 'corner_us': { let s = `${icI(IC.corner)} Hoekschop voor ${esc(tName(m))}`; if (e.cornerType) s += ` · ${esc(e.cornerType)}`; if (e.playerId) s += ` · ${pn(e.playerId)}`; return s; }
    case 'corner_them': { let s = `${icI(IC.corner)} Hoekschop tegen`; if (e.cornerType) s += ` · ${esc(e.cornerType)}`; return s; }
    // Sinds v0.49.0 kan een wissel eenzijdig zijn; "X voor ?" was de weergave van een lege kant.
    case 'substitution': {
      const kop = e.atBreak ? 'Pauzewissel: ' : '';
      if (e.playerInId && !e.playerOutId) return `${icI(IC.swap)} ${kop}${pn(e.playerInId)} komt erbij${e.naarPlek ? ` op ${esc(matchGridLabel(m, e.naarPlek))}` : ''}`;
      if (!e.playerInId && e.playerOutId) return `${icI(IC.swap)} ${kop}${pn(e.playerOutId)} gaat van het veld — geen vervanger`;
      return `${icI(IC.swap)} ${kop}${pn(e.playerInId)} voor ${pn(e.playerOutId)}`;
    }
    case 'posSwap': return `${icI(IC.compass)} ${e.atBreak?'Pauze-positiewissel: ':'Positiewissel: '}${esc(posSwapBeweging(m, e, '→'))}`;
    case 'posSwapReeks': return `${icI(IC.compass)} ${e.atBreak?'Pauze-positiewissels: ':'Positiewissels: '}${esc(posSwapReeksTekst(m, e.events, '→'))}`;
    case 'yellow_card': return `${icI(IC.cardY)} Gele kaart ${pn(e.playerId)}`;
    case 'red_card': return `${icI(IC.cardR)} Rode kaart ${pn(e.playerId)}`;
    case 'penalty_us': return `${icI(IC.penalty)} Penalty voor ${esc(tName(m))}${e.playerId?' · '+pn(e.playerId):''}${e.scored===true?' — GOAL':e.scored===false?' — gemist':''}`;
    case 'penalty_them': return `${icI(IC.penalty)} Penalty tegen${e.scored===true?' — tegendoel':e.scored===false?' — gemist':''}`;
    case 'freekick_us': return `${icI(IC.bolt)} Vrije trap voor ${esc(tName(m))}${e.playerId?' · '+pn(e.playerId):''}`;
    case 'freekick_them': return `${icI(IC.bolt)} Vrije trap tegen`;
    // 'vertrokken' is geen blessure maar dezelfde registratie: de speler verlaat het veld en zijn
    // teller stopt (zie markLeftField). Dan ook geen blessurewoord en geen "verlaat veld" erachter —
    // dat staat al in het woord zelf.
    // Een vertrek is geen blessure, dus ook niet het blessure-icoon: een kruisje, hetzelfde teken
    // als op de knop waarmee je het registreert.
    case 'injury': { if (e.injuryType === 'vertrokken') return `${icI(IC.close)} Verliet de wedstrijd · ${pn(e.playerId)}${e.reason ? ` <span style="color:var(--txt2)">(${esc(e.reason)})</span>` : ''}`; const it = e.injuryType==='kramp'?'Kramp':e.injuryType==='licht'?'Lichte blessure':'Ernstige blessure'; return `${icI(IC.injury)} ${it} · ${pn(e.playerId)}${e.leavesField?' — verlaat veld':''}`; }
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
    case 'goal_us': { let s = `Doelpunt ${pName(m,e.playerId)}`; if (e.assistId) s += ` (assist ${pName(m,e.assistId)})`; return s; }
    case 'goal_them': return `Doelpunt ${oppName(m)}`;
    case 'own_goal': return `Eigen doel (${pName(m,e.playerId)})`;
    case 'own_goal_them': return 'Eigen doel tegenstander';
    case 'corner_us': { let s = `Hoekschop voor ${tName(m)}`; if (e.cornerType) s += ` · ${e.cornerType}`; if (e.playerId) s += ` · ${pName(m,e.playerId)}`; return s; }
    case 'corner_them': { let s = 'Hoekschop tegen'; if (e.cornerType) s += ` · ${e.cornerType}`; return s; }
    case 'substitution': {
      const kop = e.atBreak ? 'Pauzewissel: ' : '';
      if (e.playerInId && !e.playerOutId) return `${kop}${pName(m,e.playerInId)} komt erbij${e.naarPlek ? ` op ${matchGridLabel(m, e.naarPlek)}` : ''}`;
      if (!e.playerInId && e.playerOutId) return `${kop}${pName(m,e.playerOutId)} gaat van het veld — geen vervanger`;
      return `${kop}${pName(m,e.playerInId)} voor ${pName(m,e.playerOutId)}`;
    }
    // -> i.p.v. → : jsPDF's standaardfonts (WinAnsiEncoding) missen dat Unicode-teken, waardoor
    // deze regel als enige met een kapot/leeg glyph in de PDF verscheen.
    case 'posSwap': return `${e.atBreak?'Pauze-positiewissel: ':'Positiewissel: '}${posSwapBeweging(m, e, '->')}`;
    case 'posSwapReeks': return `${e.atBreak?'Pauze-positiewissels: ':'Positiewissels: '}${posSwapReeksTekst(m, e.events, '->')}`;
    case 'yellow_card': return `Gele kaart ${pName(m,e.playerId)}`;
    case 'red_card': return `Rode kaart ${pName(m,e.playerId)}`;
    case 'penalty_us': return `Penalty voor ${tName(m)}${e.playerId?' · '+pName(m,e.playerId):''}${e.scored===true?' — GOAL':e.scored===false?' — gemist':''}`;
    case 'penalty_them': return `Penalty tegen${e.scored===true?' — tegendoel':e.scored===false?' — gemist':''}`;
    case 'freekick_us': return `Vrije trap voor ${tName(m)}${e.playerId?' · '+pName(m,e.playerId):''}`;
    case 'freekick_them': return 'Vrije trap tegen';
    case 'injury': { if (e.injuryType === 'vertrokken') return `Verliet de wedstrijd · ${pName(m,e.playerId)}${e.reason ? ` (${e.reason})` : ''}`; const it = e.injuryType==='kramp'?'Kramp':e.injuryType==='licht'?'Lichte blessure':'Ernstige blessure'; return `${it} · ${pName(m,e.playerId)}${e.leavesField?' — verlaat veld':''}`; }
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
  // Positiewisselingen horen bij deze filter: wie op 'Wissels' klikt om een pas toegevoegde of
  // aangepaste positiewissel terug te vinden, zag ze anders net wegvallen.
  sub: { label: 'Wissels', icon: 'swap', types: ['substitution', 'posSwap'] },
  card: { label: 'Kaarten', icon: 'cardY', types: ['yellow_card', 'red_card'] },
};
// null = geen filter actief (alles tonen). Anders: key van ELOG_FILTER_GROUPS — enkel die categorie tonen.
let elogFilter = null;
// Vanwaar de huidige wedstrijd geopend werd ('home' of 'matches') — zie go(). Bepaalt waar de
// terugpijl van prep/live/detail naartoe gaat. Zelfde patroon als _settingsFrom.
let _matchFrom = 'matches';
function matchTerug() { return _matchFrom === 'home' ? 'home' : 'matches'; }
function toggleElogFilter(key) { elogFilter = (elogFilter === key) ? null : key; render(); }
// ===================== STARTOPSTELLING PER BLOK =====================
// Alle wissels en positiewissels die in de pauze gebeuren dragen atBreak. Bij een jeugdploeg zijn
// dat er tientallen per pauze — de trainer zet er in de rust bijna een nieuwe ploeg neer — en op het
// verslag verdronken de doelpunten en kaarten daarin. Als losse regels zeggen ze bovendien weinig:
// je wil niet weten via welke reeks ruilingen de opstelling ontstond, je wil de opstelling.
// Daarom worden ze op het verslag samengevouwen tot ÉÉN regel per blok: wie er staat, en waar.
// LET OP: er wordt niets weggegooid. De events blijven staan zoals ze zijn, want de speelminuten,
// de keeperminuten, de veldweergave en het terugspoelen (positionsAtMatchStart) lezen ze allemaal.
// Dit is uitsluitend een kwestie van tekenen.
function isBreakLineupEvent(e) {
  return !!e && !!e.atBreak && (e.type === 'substitution' || e.type === 'posSwap' || e.type === 'posSwapReeks');
}
// De opstelling bij de start van blok qn, op leesbare volgorde: doel eerst, dan achteruit naar voren,
// en binnen een lijn van links naar rechts. Dat leest als een opstelling i.p.v. als een lijst.
// EEN bron voor de opstelling van een blok: dezelfde functie die het velddiagram tekent
// (pitchPlayersAtPeriodStart). Voordien las deze regel playersAtPeriodStart en het diagram de
// andere — twee wegen naar hetzelfde antwoord, en die liepen uiteen: de tekst zette een speler op
// CAM terwijl het diagram hem op LM tekende. Dat is exact de fabrieksfout die deze hele reeks
// veroorzaakte, dus hier geen tweede berekening meer.
function startLineupRijen(m, qn) {
  const spelers = (typeof pitchPlayersAtPeriodStart === 'function') ? pitchPlayersAtPeriodStart(m, qn)
    : ((typeof playersAtPeriodStart === 'function') ? playersAtPeriodStart(m, qn) : []);
  return spelers
    .map(p => {
      const code = spelerGridCode(p);
      return {
        naam: fieldName(m, p.id),
        // plek = het samengestelde label voor het scherm ("GK (1)"); code en nummer los erbij, want
        // de PDF zet ze anders naast elkaar en haakjes binnen haakjes leest niet.
        plek: code ? matchGridLabel(m, code) : (p.posNum ? String(p.posNum) : (p.line || '')),
        code: code || '',
        nummer: code ? (matchGridNummer(m, code) || '') : (p.posNum || ''),
        y: typeof p.y === 'number' ? p.y : (LINE_Y[p.line] || 50),
        x: typeof p.x === 'number' ? p.x : 50,
      };
    })
    .sort((a, b) => (b.y - a.y) || (a.x - b.x));
}
// Wie zat er op de bank op het MOMENT dat dit blok begon? Dat is iets anders dan de bankregel
// onder het velddiagram (periodBenchNames = wie het hele blok geen minuut speelde): bij de
// STARTopstelling hoort de momentopname — wie beschikbaar was maar niet begon, ook al viel hij
// vijf minuten later in. Weg zijn: wie afwezig was, wie de wedstrijd vóór dit blok verliet, en wie
// vóór dit blok een rode kaart kreeg.
function bankBijStart(m, qn) {
  if (!qn) return [];
  const opVeld = new Set(playersAtPeriodStart(m, qn).map(p => p.id));
  const weg = vertrokkenIds(m, qn);
  const rood = new Set((m.events || [])
    .filter(e => e.type === 'red_card' && e.playerId && e.quarterNum != null
      && (e.quarterNum < qn || (e.atBreak && e.quarterNum === qn)))
    .map(e => e.playerId));
  const dns = fieldDisplayNames(m.players || []);
  return sortedByName((m.players || []).filter(p => !p.absent && !opVeld.has(p.id) && !weg.has(p.id) && !rood.has(p.id)))
    .map(p => dns.get(p.id) || p.name || '');
}
// Dezelfde regel als platte tekst, voor de PDF-tijdlijn. Eén bron voor de rijen, zodat het scherm
// en de PDF nooit een andere opstelling tonen.
function startLineupTekst(m, qn) {
  const rijen = startLineupRijen(m, qn);
  if (!rijen.length) return '';
  // "Vincent F. (GK, 1), Briek D. (LM, 11)" — plaats en positienummer samen tussen één stel haakjes,
  // spelers gescheiden door komma's. De eerdere vorm ("Vincent F. — GK (1) · Briek D. — …") las met
  // die streepjes en middelpunten als één lange brij; dit leest als een opstellingsblad.
  // De bank hoort erbij als MOMENTOPNAME: wie beschikbaar was maar dit blok niet begon — ook wie
  // vijf minuten later inviel. Eerst stond hier periodBenchNames (wie het hele blok niet speelde),
  // maar dat is de regel van het velddiagram-kader; bij een STARTopstelling klopte die niet: na
  // wissels tijdens het blok stond er dan niemand op de bank (gemeld 22-08-2026).
  const bank = bankBijStart(m, qn);
  return 'Startopstelling: ' + rijen.map(r => {
    const binnen = [r.code, r.nummer].filter(Boolean).join(', ');
    return binnen ? `${r.naam} (${binnen})` : r.naam;
  }).join(', ') + (bank.length ? ` — bank: ${bank.join(', ')}` : '');
}
function startLineupHtml(m, qn) {
  const rijen = startLineupRijen(m, qn);
  if (!rijen.length) return '';
  const bank = bankBijStart(m, qn);
  return `<li class="startlineup"><span class="emin">${icI(IC.shirt)}</span><span class="etxt"><b>Startopstelling</b><span class="sl-lijst">${rijen
    .map(r => `<span class="sl-item">${esc(r.naam)}${r.plek ? `<span class="sl-plek">${esc(r.plek)}</span>` : ''}</span>`)
    .join('')}</span>${bank.length ? `<span class="sl-bank">Bank: ${bank.map(esc).join(', ')}</span>` : ''}</span></li>`;
}
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
    // Tussenstand ÉN wat er in dit blok zelf gebeurde: "1–1" alleen las als de score van dit kwart,
    // terwijl het de totale stand is. Staat er ALTIJD, ook bij 0–0: eerst stond hij enkel bij blokken
    // mét doelpunten, maar dan las het ontbreken als een gat i.p.v. als "hier viel niets" (Tim, 22-08).
    const dit = g.qn == null ? null : scoreInQuarter(m, g.qn);
    const ditText = dit
      ? `<span class="qgroup-dit">dit ${pSingLow(m)}: ${isAway(m) ? `${dit.them}–${dit.us}` : `${dit.us}–${dit.them}`}</span>` : '';
    const score = g.cum ? `<span class="qgroup-score">${isAway(m) ? `${g.cum.them}–<span class="us">${g.cum.us}</span>` : `<span class="us">${g.cum.us}</span>–${g.cum.them}`}${ditText}</span>` : '';
    let list = elog_ro ? g.list.filter(e => !HIDDEN_FOR_VIEWER.has(e.type)) : g.list;
    if (activeTypes) list = list.filter(e => activeTypes.has(e.type));
    // Positiewisselingen op hetzelfde moment als één regel — zie groepeerPosSwaps.
    list = groepeerPosSwaps(list);
    // De pauzewijzigingen samenvouwen tot één "Startopstelling"-regel — zie isBreakLineupEvent.
    // Enkel zonder actieve filter: wie op 'Wissels' klikt, zoekt net die losse regels.
    const vouwSamen = !activeTypes && g.qn != null;
    const startRegel = vouwSamen ? startLineupHtml(m, g.qn) : '';
    if (vouwSamen) list = list.filter(e => !isBreakLineupEvent(e));
    // Wat in de PAUZE gebeurde (bv. een speler die de wedstrijd verliet) hoort VÓÓR de
    // startopstelling van dit blok — het gebeurde er letterlijk voor — en draagt geen minuut:
    // in de pauze loopt de klok niet, dus "1'" was gewoon onwaar.
    const pauzeItems = list.filter(e => e.atBreak);
    if (pauzeItems.length) list = list.filter(e => !e.atBreak);
    const li = e => {
      const isGoal = elog_ro && GOAL_TYPES.has(e.type) && (e.type !== 'penalty_us' && e.type !== 'penalty_them' || e.scored);
      const goalStyle = isGoal ? ' style="font-weight:700;font-size:15px"' : '';
      // Een samengevoegde reeks heeft geen eigen event om te bewerken; verwijderen wist de hele
      // reeks, want de delen ervan hebben los geen betekenis.
      const knoppen = elog_ro ? ''
        : (e.type === 'posSwapReeks'
          ? `<button class="evt-del no-print" onclick="confirmDeleteEvents(['${e.events.map(x => x.id).join("','")}'])" title="Verwijderen">×</button>`
          : `<button class="evt-edit no-print" onclick="modalEditEvent('${e.id}')" title="Bewerken">${icI(IC.edit)}</button><button class="evt-del no-print" onclick="confirmDeleteEvent('${e.id}')" title="Verwijderen">×</button>`);
      return `<li${goalStyle}><span class="emin">${e.atBreak ? 'pauze' : eventMinLocal(e, m)}</span><span class="etxt">${evtLabel(e, m)}</span>${knoppen}</li>`;
    };
    const items = pauzeItems.map(li).join('') + startRegel + (list.length
      ? list.map(li).join('')
      : ((startRegel || pauzeItems.length) ? '' : '<li class="qgroup-empty">Geen events in dit deel (of alles weggefilterd).</li>'));
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
let _overtimeAlerted = new Set(); // lokaal: welk kwart al een overtime-piep gaf op DIT toestel
function checkOvertimeAlert() {
  if (!match) return;
  const q = match.quarters[match.quarters.length - 1];
  if (!q) return;
  const elapsed = getQElapsed(match);
  const durMs = (match.quarterDuration || 0) * 60000;
  const isRunning = q.startTime && !q.pausedAt && !q.endTime;
  // Enkel lokaal piepen — niet q.alerted op de gedeelde match zetten + dbSave'en vanaf elk
  // beheerderstoestel tegelijk (dat overschreef elkaars recente wijzigingen, last-writer-wins).
  const key = match.id + ':' + q.num;
  if (isRunning && durMs && elapsed >= durMs && !_overtimeAlerted.has(key)) { _overtimeAlerted.add(key); beep(); }
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
  // Schuifpositie bewaren over een herrender heen: schermen als de opstellingsplanner hertekenen
  // zichzelf bij elke tik (openModal opnieuw), en zonder dit sprong de inhoud telkens naar boven —
  // op een telefoon betekent dat na élke tik op het veld opnieuw naar beneden vegen. Een modal die
  // een ándere opent na closeModal() start gewoon op 0, want dan is er geen .modal meer om te lezen.
  const vorige = el.querySelector('.modal');
  const scroll = vorige ? vorige.scrollTop : 0;
  el.innerHTML = `<div class="modal-ov" onclick="if(event.target===this)closeModal()"><div class="modal">${html}</div></div>`;
  el.classList.remove('hidden');
  if (scroll) { const nieuwe = el.querySelector('.modal'); if (nieuwe) nieuwe.scrollTop = scroll; }
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
const GUEST_ALLOWED_VIEWS = ['home', 'live', 'settings', 'handleiding', 'auth', 'guestjoin', 'maintenance'];
async function go(v, id, _histReplace) {
  // Gast: enkel toegang tot deze schermen, ongeacht hoe de navigatie tot stand komt
  // (klik, terugknop, console) — voorkomt dat een gast bij volledige teamdata terechtkomt.
  if (isGuest && !GUEST_ALLOWED_VIEWS.includes(v)) v = 'home';
  // Onthoud vanwaar een wedstrijd geopend werd: de terugpijl bracht je ALTIJD naar de
  // wedstrijdenlijst, ook als je vanaf het homescherm kwam (gemeld 22-08-2026). Enkel gezet bij de
  // overgang lijst→wedstrijd; navigatie tússen wedstrijdschermen (prep→live→detail) laat het staan.
  if ((v === 'prep' || v === 'live' || v === 'detail') && (view === 'home' || view === 'matches')) _matchFrom = view;
  // Kijkers mogen de statistiekenpagina zien (met enkel de publieke secties); het individuele
  // spelerdetail blijft beheerder-only. Blokkeert ook back-/console-navigatie naar playerDetail.
  if (v === 'playerDetail' && !canSeeStats()) v = 'home';
  // Beheer vereist een ingelogde gebruiker (was vroeger de guard in cloudLoginModal()).
  if ((v === 'beheer' || v === 'clubbeheer' || v === 'clubsadmin') && !currentUser) v = 'auth';
  // Kalender importeren kan enkel wie mag beheren. Deze poortwachter ontbrak, en de knop verbergen
  // volstaat niet: via de terugknop van de telefoon kwam je er wél. renderImportCal zette dan geen
  // toestand op (impStart weigert) en liep vast, waarna ÉLKE hertekening crashte — de app leek
  // bevroren op het vorige scherm terwijl ze dacht dat je hier stond (audit 23-08-2026). Meest
  // waarschijnlijke weg ernaartoe: thuis inlezen, aan het veld je verbinding verliezen, terugknop.
  if (v === 'importcal' && !canManage()) v = 'matches';
  // Algemene gate: wie niet ingelogd is (en geen gast), hoort enkel op het auth-scherm, de
  // handleiding of de onderhoudspagina — via Handleiding → terug → Instellingen → terug kon
  // een afgemelde gebruiker anders op een leeg homescherm belanden zonder weg terug.
  // (cloudReady-check: in lokale modus zonder cloud blijft alles gewoon bereikbaar.)
  if (!currentUser && !isGuest && cloudReady && !['auth', 'handleiding', 'maintenance'].includes(v)) v = 'auth';
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
// Voornaam = het eerste woord. Dat is wat er op het veld staat: een trainer roept een voornaam,
// en op een jeugdploeg herken je zo sneller wie waar staat dan aan de familienaam.
function _firstName(name) {
  if (!name) return '';
  return name.trim().split(/\s+/)[0];
}
// Map van speler-id → veldnaam: voornaam + de eerste letter van de familienaam ("Maxim B."). Botsen
// twee spelers daar nog op (Lars Marysse naast Lars Meersman), dan komen er letters bij tot ze
// verschillen. Geef bij voorkeur de VOLLEDIGE spelerslijst van de wedstrijd mee, niet enkel wie op
// het veld staat: anders krijgt een invaller met dezelfde voornaam als een basisspeler te weinig
// letters, terwijl beide namen na een wissel op hetzelfde diagram verschijnen.
function fieldDisplayNames(players) {
  const firstNames = players.map(p => _firstName(p.name || ''));
  // Een naam van één woord heeft geen familienaam — _lastName geeft dan datzelfde woord terug, en
  // zonder deze uitzondering werd "Cher" op het veld "Cher Cher".
  const lastNames = players.map((p, i) => {
    const ln = _lastName(p.name || '').trim();
    return ln.toLowerCase() === _firstName(p.name || '').toLowerCase() ? '' : ln;
  });
  // Eén letter is de standaard, maar bij "Lars Marysse" naast "Lars Meersman" zou dat twee keer
  // "Lars M." geven. Per groep gelijke voornamen zoeken we daarom het kleinste aantal letters
  // waarmee iedereen in die groep verschilt.
  const kort = new Map(); // voornaam (kleine letters) → aantal letters van de familienaam
  firstNames.forEach((fn, i) => {
    const key = fn.toLowerCase();
    if (kort.has(key)) return;
    const groep = lastNames.filter((_, j) => firstNames[j].toLowerCase() === key);
    if (groep.length < 2) { kort.set(key, 1); return; }
    let n = 1;
    const maxLen = Math.max(...groep.map(l => l.length));
    while (n < maxLen && new Set(groep.map(l => l.slice(0, n).toLowerCase())).size < groep.length) n++;
    kort.set(key, n);
  });
  return new Map(players.map((p, i) => {
    const n = kort.get(firstNames[i].toLowerCase()) || 1;
    if (!lastNames[i]) return [p.id, firstNames[i]];
    // trimEnd: bij een tussenvoegsel valt de afkapping soms op een spatie ("Van " → "Van.").
    const stuk = lastNames[i].slice(0, n).trimEnd();
    if (!stuk) return [p.id, firstNames[i]];
    // Volledige familienaam (twee naamgenoten): geen punt erachter, dat leest als een afkorting.
    return [p.id, firstNames[i] + ' ' + stuk + (stuk.length < lastNames[i].length ? '.' : '')];
  }));
}
// Veldnaam van één speler van een wedstrijd, met dezelfde ontdubbeling als het diagram zelf.
function fieldName(m, id) {
  const p = (m && m.players || []).find(x => x.id === id);
  if (!p) return '?';
  return fieldDisplayNames(m.players).get(id) || _firstName(p.name || '');
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
function pitchDot(m, p, x, y, dn, captainId, tap) {
  const capId = captainId !== undefined ? captainId : (m ? m.captainId : null);
  const cap = (capId === p.id) ? ' ©' : '';
  const lbl = `${esc(dn || _firstName(p.name))}${cap}`;
  // tap = { fn, selId }: maakt de bol aantikbaar (pauze-opstelling in het livescherm).
  const tapAttr = tap ? ` onclick="${tap.fn}('field','${p.id}')" style="cursor:pointer;` : ' style="';
  // Het shirt is doorschijnend, dus een box-shadow zou een vierkante rand om het vakje zetten.
  // Met een ronde hoek leest het als een selectie rond de speler.
  const selRing = (tap && tap.selId === p.id) ? 'box-shadow:0 0 0 3px var(--org);border-radius:8px;' : '';
  // In het shirt staat het RUGNUMMER (sinds v0.34.0; voordien het positienummer in een bol). Een
  // shirt vraagt om een rugnummer, en dat is het enige nummer dat de trainer én de spelers zelf
  // gebruiken; waar de speler staat, ís zijn positie. Rugnummers zijn optioneel per ploeg — dan
  // blijft het shirt leeg en doet de naam eronder het werk. Het positienummer is van het veld
  // verdwenen: met 26 roosterplekken en 11 klassieke nummers kan een nummer een plek niet meer
  // aanduiden. Het staat nog wel in de lijsten en de tijdlijn, als "CAM (9)".
  // Bewust NIETS meer bij de bol dan het positienummer, de naam en ©. Wissels, keeperovernames en
  // kaartjes stonden hier vroeger als regeltjes/blokjes, maar het diagram toont de opstelling bij de
  // START van het deel en houdt geen rekening met positiewisselingen — een vervanger onder een bol
  // hangen suggereerde dan een positie die hij misschien nooit gespeeld heeft. De wissels staan nu
  // in een kader onder het veld (zie periodSubList / renderPitch), de kaarten in de tijdlijn.
  return `<div class="pdot"${tapAttr}${selRing}left:${x}%;top:${y}%">
    ${shirtSvg(true, p.line === 'Doel', pNum(p))}<span class="pdot-lbl">${lbl}</span></div>`;
}
// qNum (optioneel): toont onder het veld de wissels van dat deel en de bank.
// tap (optioneel): maakt de bollen aantikbaar — gebruikt door de pauze-opstelling in het livescherm.
// De onbezette plekken van het rooster, als open shirts met hun code eronder. Enkel wanneer de
// oproeper ze aankan (tap.plek): dan is elke vrije plek aantikbaar met fn('plek','CODE'), en kan je
// een speler naar een lege plaats zetten i.p.v. enkel met iemand te ruilen.
function pitchOpenPlekken(m, players, tap) {
  if (!tap || !tap.plek || typeof POS_GRID === 'undefined') return '';
  const bezet = new Set();
  for (const p of players) { const c = spelerGridCode(p); if (c) bezet.add(c); }
  return POS_GRID.filter(plek => !bezet.has(plek.code)).map(plek => {
    const gk = plek.line === 'Doel';
    // tap.plekSel: de plek die als bestemming gekozen is, met hetzelfde oranje kader als een
    // geselecteerde speler — anders zie je niet waar je zonet op tikte.
    const ring = (tap.plekSel && tap.plekSel === plek.code) ? ';box-shadow:0 0 0 3px var(--org);border-radius:8px' : '';
    // Een plek die bij de FORMATIE hoort (draagt een positienummer) is iets groter dan de rest,
    // net als overal — bij een leeg veld stonden alle 26 even klein en las niets als "hier hoort
    // iemand". En zodra er een speler vastgehouden wordt (tap.selId), krijgen de vrije plekken een
    // gestippeld randje: dat zijn de bestemmingen waar je op kan tikken.
    const nummer = m ? (matchGridNummer(m, plek.code) || '') : '';
    const doel = tap.selId ? ' pslot-doel' : '';
    return `<div class="pslot pslot-open${nummer ? ' pslot-vorm' : ''}${doel}${ring ? ' pslot-tip' : ''}" style="left:${plek.x}%;top:${plek.y}%${ring}" onclick="${tap.fn}('plek','${plek.code}')">`
      + `${shirtSvg(false, gk, nummer)}<span class="pmark-code">${nummer ? esc(nummer + ' · ') : ''}${plek.code}</span></div>`;
  }).join('');
}
function renderPitch(m, players, captainId, qNum, tap) {
  // Dedupliceren over de hele wedstrijdselectie, niet enkel over wie nu op het veld staat: een
  // invaller met dezelfde voornaam staat in het wisselkader eronder en moet dezelfde letter krijgen.
  const dns = fieldDisplayNames((m && m.players && m.players.length) ? m.players : players);
  let dots = '';
  const xy = players.filter(p => typeof p.x === 'number' && typeof p.y === 'number');
  const rest = players.filter(p => !(typeof p.x === 'number' && typeof p.y === 'number'));
  // Een speler wordt getekend OP zijn roosterplek, niet op zijn ruwe x/y. De 26 plekken liggen altijd
  // op dezelfde hoogte, bij elke formatie; een wedstrijd van vóór v0.34.0 draagt nog de coördinaten van
  // een formatieslot (bv. de middenvelders van een dubbele ruit op y 38 en 50) en die vielen dan net
  // naast de rij — drie spelers die op dezelfde lijn horen, stonden zo op drie hoogtes. De bewaarde
  // x/y blijft ongemoeid; dit is enkel weergave. Botsen twee spelers op dezelfde plek (rare oude
  // data), dan houdt de eerste ze en valt de tweede terug op zijn eigen coördinaten.
  const bezetteP = new Set();
  for (const p of xy) {
    const plek = gridPlek(spelerGridCode(p));
    const opRooster = plek && !bezetteP.has(plek.code);
    if (opRooster) bezetteP.add(plek.code);
    dots += pitchDot(m, p, opRooster ? plek.x : p.x, opRooster ? plek.y : p.y, dns.get(p.id), captainId, tap);
  }
  const byLine = {};
  for (const p of rest) { (byLine[p.line] = byLine[p.line] || []).push(p); }
  for (const [line, ps] of Object.entries(byLine)) {
    const y = LINE_Y[line] != null ? LINE_Y[line] : 50;
    const n = ps.length;
    ps.forEach((p, i) => { dots += pitchDot(m, p, n === 1 ? 50 : 18 + (i * (64 / (n - 1))), y, dns.get(p.id), captainId, tap); });
  }
  const bench = (m && !tap) ? periodBenchNames(m, qNum) : [];
  // Wissels in een eigen kader ONDER het veld i.p.v. bij de bollen: het diagram toont de opstelling
  // bij de start van het deel en negeert positiewisselingen, dus een naam onder een bol beweerde
  // een positie die de invaller misschien nooit gespeeld heeft. Hier staat enkel wie, wanneer.
  const wissels = (m && !tap) ? periodSubList(m, qNum) : [];
  return `<div class="pitch">${pitchLines()}${pitchOpenPlekken(m, players, tap)}${dots}</div>
  ${wissels.length ? `<div class="pitch-subs">
    <div class="pitch-subs-h">Wissels</div>
    ${wissels.map(w => `<div class="psr"><span class="psr-min">${esc(w.min)}</span><span class="psr-uit"><span class="ic-i">${IC.download}</span> ${esc(w.out.join(', '))}</span><span class="psr-in"><span class="ic-i">${IC.upload}</span> ${esc(w.in.join(', '))}</span></div>`).join('')}
  </div>` : ''}
  ${bench.length ? `<div class="pitch-bench"><b>Bank:</b> ${esc(bench.join(', '))}</div>` : ''}
  ${/* Dat het oranje shirt de doelman is, stond hier ook nog eens uitgelegd. Weg: dat leest je van het
       veld zelf af (hij staat in het doelgebied). Wat een lezer níet kan weten, is welk cijfer er in
       het shirt staat — daar stond tot v0.34.0 het positienummer. */ ''}
  ${tap ? '' : `<div class="field-legend">Cijfer in het shirt = rugnummer</div>`}`;
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

// De wissels van één periode, chronologisch, voor het kader onder het velddiagram (scherm + PDF).
// Enkel wat er TIJDENS het deel gebeurde: een pauzewissel (atBreak) zit al in de startopstelling
// die het veld toont. Bewust niet gekoppeld aan een bol: het diagram houdt geen rekening met
// positiewisselingen, dus een invaller onder een bol hangen beweert een positie die hij misschien
// nooit gespeeld heeft. Kaarten, blessures en positiewisselingen (ook die naar doel) staan hier
// niet in — die staan in de tijdlijn van de events.
// Wissels op dezelfde minuut komen op één regel samen — de spelers die eraf gaan bij elkaar, de
// invallers bij elkaar. Een dubbele wissel is in de praktijk één beslissing en leest zo ook zo.
//   [{ min: "12'", out: ['Sam D.', 'Lars M.'], in: ['Tuur S.', 'Vic G.'] }, ...]
function periodSubList(m, qNum) {
  if (!qNum) return [];
  const rijen = [];
  (m.events || [])
    .filter(e => e.type === 'substitution' && e.quarterNum === qNum && !e.atBreak && e.playerOutId && e.playerInId)
    .sort((a, b) => (a.gameTimeMs || 0) - (b.gameTimeMs || 0))
    .forEach(e => {
      const min = eventMinLocal(e, m);
      // Gesorteerd op tijd, dus wissels met dezelfde minuut staan naast elkaar in de lijst.
      const laatste = rijen[rijen.length - 1];
      if (laatste && laatste.min === min) {
        laatste.out.push(fieldName(m, e.playerOutId));
        laatste.in.push(fieldName(m, e.playerInId));
      } else {
        rijen.push({ min, out: [fieldName(m, e.playerOutId)], in: [fieldName(m, e.playerInId)] });
      }
    });
  return rijen;
}
// Wie in de selectie zat maar tijdens die periode geen minuut op het veld stond (dus ook niet
// inviel). Wordt onder het velddiagram getoond, zodat de bank per deel zichtbaar is.
function periodBenchNames(m, qNum) {
  if (!qNum) return [];
  const onField = new Set(playersAtPeriodStart(m, qNum).map(p => p.id));
  (m.events || []).forEach(e => { if (e.type === 'substitution' && e.quarterNum === qNum && e.playerInId) onField.add(e.playerInId); });
  // Wie de wedstrijd vóór dit blok verliet, zit niet op de bank — hij is weg. Voordien stond zo
  // iemand hier bij élk volgend blok, omdat hij niet `absent` is (zie vertrokkenIds).
  const weg = vertrokkenIds(m, qNum);
  const dns = fieldDisplayNames(m.players || []);
  return (m.players || []).filter(p => !p.absent && !weg.has(p.id) && !onField.has(p.id))
    .map(p => dns.get(p.id) || _firstName(p.name || ''))
    .sort((a, b) => a.localeCompare(b, 'nl'));
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
  // AANzetten sluit de app voor iedereen — alle ploegen, alle kijkers, ook een lopende wedstrijd.
  // Dat was de enige zware actie zonder drempel, terwijl één kijker verwijderen wél bevestiging
  // vraagt en een ploeg verwijderen zelfs het wachtwoord. UITzetten herstelt en blijft één tik.
  if (newVal) {
    showConfirm('Onderhoudsmodus aanzetten? De app wordt onmiddellijk onbruikbaar voor iedereen — alle ploegen en alle kijkers, ook tijdens een lopende wedstrijd.',
      () => doToggleMaintenance(true), 'Aanzetten', 'btn-red');
    return;
  }
  doToggleMaintenance(false);
}
async function doToggleMaintenance(newVal) {
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
        ${teamName ? `<div style="flex:1 1 auto;min-width:0;overflow:hidden">
          <div class="hdr-club-name">${teamName}</div>
          ${clubName ? `<div class="hdr-club-sub">${clubName}</div>` : ''}
        </div>` : ''}
        ${switchBtn ? `<span style="margin-left:6px">${switchBtn}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
        <span id="cloud-chip" class="cloud-chip" style="display:none" onclick="openSquad()"></span>
        <button class="hdr-gear" onclick="_settingsFrom=view;go('settings')" title="Instellingen">${icI(IC.gear)}</button>
      </div>
    </div>
      <div class="content" id="home-content"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
  },
  matches: () => {
    // Bij het binnenkomen altijd op de huidige maand beginnen; bladeren binnen het scherm gaat
    // via loadMatches() en blijft dus wél bewaard.
    calMaand = null; calDag = null;
    loadMatches();
    return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>${icI(IC.ball)} Wedstrijden</h1></div>
      <div class="content" id="matches-content"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
  },
  agenda: () => {
    calMaand = null; calDag = null;
    loadAgenda();
    return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>${icI(IC.calendar)} Agenda</h1></div>
      <div class="content" id="agenda-content"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
  },
  // renderHerstel woont in stats-settings.js, dat ná dit bestand geladen wordt — dus pas oplossen
  // bij de aanroep (zie de waarschuwing over dispatchtabellen in CLAUDE.md).
  herstel: () => renderHerstel(),
  teruggevonden: () => renderTeruggevonden(),
  setup: () => { refreshEmailVerified(); return renderSettings(true); },
  settings: () => { refreshEmailVerified(); return renderSettings(false); },
  handleiding: () => renderHandleiding(0),
  live: () => renderLive(),
  detail: () => renderDetail(),
  stats: () => { statsFilter = homeFilter; loadStats(); return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>${icI(IC.chart)} Statistieken</h1></div><div class="content" id="stats-content"><div class="empty"><div class="ei">${IC.timer}</div></div></div>`; },
  playerDetail: () => { loadPlayerDetail(); return `<div class="hdr"><button class="back" onclick="go(_playerDetailFrom||'stats')">‹</button><h1>${icI(IC.shirt)} Speler</h1></div><div class="content" id="player-detail-content"><div class="empty"><div class="ei">${IC.timer}</div></div></div>`; },
  playertransfer: renderPlayerTransfer,
  // Wordt bij de aanroep opgelost, niet bij het laden: renderImportCal woont in import-cal.js, dat
  // ná dit bestand geladen wordt (zie de waarschuwing over dispatchtabellen in CLAUDE.md).
  importcal: () => renderImportCal(),
};
let homeFilter = 'all';
// Herlaad het scherm waar je OP staat. De agenda heeft dezelfde ploegfilter, en die viel hier in de
// `else` en herlaadde dus het beginscherm — dat op zoek gaat naar zijn eigen blok, dat er niet is, en
// stil terugkeert. Gevolg: je koos een andere ploeg, de keuzelijst bleef op die ploeg staan alsof het
// gelukt was, en er veranderde niets (audit 23-08-2026). kalenderHerlaad() kent het onderscheid al.
function setHomeFilter(v) {
  homeFilter = v;
  if (view === 'agenda') loadAgenda();
  else if (view === 'matches') loadMatches();
  else loadHome();
}
// Eén wedstrijd-kaartje (gebruikt op het dashboard én in de volledige lijst).
function matchItemHtml(m) {
  const st = m.status, af = matchCancelled(m);
  // Een geannuleerde wedstrijd heeft geen uitslag en dus geen verslag: ze opent in het
  // wedstrijdscherm, net als een geplande — daar staat ook de knop om het weer ongedaan te maken.
  const zonderScore = st === 'planned' || af;
  const target = st === 'live' ? 'live' : zonderScore ? 'prep' : 'detail';
  const border = st === 'live' ? 'live-border' : af ? 'cancel-border' : st === 'planned' ? 'plan-border' : '';
  const badge = st === 'live' ? `<span class="badge badge-live">${icI(IC.live)} Live</span>` : af ? `<span class="badge badge-cancel">${icI(IC.close)} Geannuleerd</span>` : st === 'planned' ? `<span class="badge badge-plan">${icI(IC.calendar)} Gepland</span>` : `<span class="badge badge-done">${icI(IC.done)} Gespeeld</span>`;
  // Bij een strafschoppenreeks blijft de wedstrijdscore staan zoals ze is, met de reeks eronder in
  // het klein — "1-1" met daaronder "pen. 4-5". Zo blijft de uitslag leesbaar als uitslag.
  const right = zonderScore
    ? `<div style="text-align:right;font-size:13px;color:var(--txt2);font-weight:600">${m.location || ''}</div>`
    : `<div style="text-align:right"><div class="mi-score">${scoreTxt(m)}</div>${heeftShootout(m) ? `<div style="font-size:11px;color:var(--txt2);font-weight:700;white-space:nowrap">pen. ${esc(shootoutTxt(m))}</div>` : ''}</div>`;
  const sdata = `${m.opponent||''} ${m.teamName||''} ${m.subteam||''} ${m.location||''} ${m.competition||''} ${matchWhen(m)}`.toLowerCase();
  const ownLabel = esc(tName(m)) + (m.subteam ? ` (${esc(m.subteam)})` : '');
  if (st === 'live') {
    const qNum = m.quarters ? m.quarters.length : 0;
    // Welk deel er loopt staat op een eigen regeltje onder "LIVE". Stond het ernaast, dan botste
    // "LIVE · KWART 1" op een telefoon tegen de eerste ploegnaam — er is op één regel geen plaats voor
    // een status, twee ploegnamen én de score. Zo blijft de linkerkolom kort en houdt de score zijn
    // plaats rechts. Weglaten was geen optie: op een tornooidag wil je net zien welk blok loopt.
    return `<div class="match-item live-border" data-s="${esc(sdata)}" onclick="go('live','${m.id}')" style="padding:14px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%">
        <div style="flex-shrink:0">
          <div style="display:flex;align-items:center;gap:6px;white-space:nowrap">
            <span class="live-pulse-dot"></span>
            <span style="font-size:12px;font-weight:700;color:var(--rd);text-transform:uppercase;letter-spacing:.5px">Live</span>
          </div>
          ${qNum > 0 ? `<div style="font-size:11px;color:var(--txt2);font-weight:600;margin-top:2px;white-space:nowrap">${esc(pSing(m))} ${qNum}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:7px;min-width:0">
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
      <div class="mi-date">${m.teamName?'<b>'+esc(m.teamName)+(m.subteam?' ('+esc(m.subteam)+')':'')+'</b> · ':''}${matchWhen(m)}${!zonderScore&&m.location?' · '+esc(m.location):''}${af&&m.cancelReason?' · '+esc(m.cancelReason):''}</div>
      ${/* De SOORT wedstrijd hoort hier bij: op een kaartje zag je wel "Gepland" en "5v5", maar niet
           of het om competitie, beker of een oefenmatch ging — net wat bepaalt hoe zwaar ze weegt.
           Vrije tekst, dus we tonen wat er staat (ook een eigen soort via "Andere…"); leeg = niets. */ ''}
      ${badge}${m.competition ? `<span class="badge badge-kind">${esc(m.competition)}</span>` : ''}<span class="badge badge-type">${m.matchType||''}</span>${m.numQuarters&&m.quarterDuration?`<span class="badge badge-type">${m.numQuarters} × ${m.quarterDuration}'</span>`:''}
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
  // De tegel heet "Ploeg" en niet "Spelers": erachter zitten ook de trainers, de ploegverantwoordelijken
  // en de standaardinstellingen voor een nieuwe wedstrijd. Het getal eronder blijft wél het aantal
  // spelers — dat is de nuttigste teller om vanaf het startscherm te zien.
  const teamTile = cloudReady
    ? `<button class="tile" onclick="openSquad()"><span class="tile-fi ic-i" aria-hidden="true">${IC.shirt}</span><span class="tl">Ploeg</span><span class="tc">${rosterReady() ? `${playerCount} ${playerCount===1?'speler':'spelers'}` : 'laden…'}</span></button>`
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
  // Een gast mag enkel home/live/instellingen/handleiding openen (GUEST_ALLOWED_VIEWS), dus élke
  // tegel hier was voor hem een dode knop: tikken bracht hem via go() gewoon terug op home. De
  // gastbanner zegt al waar hij aan toe is ("enkel live wedstrijden volgen").
  const tiles = isGuest ? '' : `<div class="home-tiles" style="grid-template-columns:1fr 1fr">
    <button class="tile" onclick="go('matches')"><span class="tile-fi ic-i" aria-hidden="true">${IC.ball}</span><span class="tl">Wedstrijden</span><span class="tc">${tileMatches.length}</span></button>
    ${teamTile}
    <button class="tile" onclick="go('tournaments')"><span class="tile-fi ic-i" aria-hidden="true">${IC.medal}</span><span class="tl">Tornooien</span><span class="tc">${trnCount} ${trnCount===1?'tornooi':'tornooien'}</span></button>
    <button class="tile" onclick="go('stats')"><span class="tile-fi ic-i" aria-hidden="true">${IC.chart}</span><span class="tl">Statistieken</span><span class="tc">bekijk</span></button>
    ${/* Over de volle breedte: een vijfde tegel zou anders een gat naast zich laten. De agenda is
          de enige plek waar wedstrijden en tornooien samen op één kalender staan. */ ''}
    <button class="tile tile-breed" style="grid-column:1/-1" onclick="go('agenda')"><span class="tile-fi ic-i" aria-hidden="true">${IC.calendar}</span><span class="tl">Agenda</span></button>
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
    ? `<p style="font-size:12px;color:var(--txt2);margin-bottom:14px">Wil je <b>ploegbeheerder</b> worden van deze ploeg? Tik op de <b>Kijken</b>-knop rechtsboven en vraag het aan.</p>`
    : '';
  const filterBar = (!cloudReady && teams.length > 1) ? `<div class="filterbar">
    <select onchange="setHomeFilter(this.value)">
      <option value="all" ${homeFilter==='all'?'selected':''}>Alle ploegen</option>
      ${teams.map(t => `<option value="${esc(t)}" ${homeFilter===t?'selected':''}>${esc(t)}</option>`).join('')}
    </select></div>` : '';
  // Komende wedstrijden (live of gepland), gefilterd per ploeg, vroegste eerst.
  // Een geannuleerde wedstrijd hoort hier tot en met haar eigen dag bij: "die van zaterdag gaat niet
  // door" is nieuws zolang die zaterdag niet voorbij is, en anders zoek je op het startscherm naar
  // een wedstrijd die er plots niet meer staat. Ze verdwijnt wél zodra de dag om is — daarin
  // verschilt ze van een geplande wedstrijd, die bewust blijft staan (zo zie je dat je vergat ze te
  // starten). Ze sorteert gewoon op datum mee, dus ze staat waar ze hoort.
  // isoDagVan en niet toISOString: die laatste geeft de UTC-dag, dus tussen middernacht en 2 uur
  // 's nachts (zomertijd) zou een wedstrijd van gisteren nog als "vandaag" gelden.
  const vandaagISO = isoDagVan(new Date());
  // Een geplande wedstrijd waarvan de dag voorbij is, hoort hier niet meer bij — ook al staat ze nog
  // op 'planned' omdat ze nooit gestart of afgesloten werd. Die filter stond er wél op een
  // geannuleerde wedstrijd, maar niet op een gewone geplande: een vergeten wedstrijd van vorige maand
  // bleef zo bovenaan het startscherm staan als "eerstvolgende". Een wedstrijd zonder datum valt hier
  // dus ook weg; ze kan niet de eerstvolgende zijn en stond voordien juist vooraan (een lege datum
  // sorteert vóór alles). In de volledige wedstrijdenlijst blijven beide gewoon staan.
  // 'live' blijft zonder datumvoorwaarde: die wedstrijd wordt nú gespeeld en moet je kunnen openen.
  let upcoming = all.filter(m => m.status === 'live'
    || (m.status === 'planned' && !m.tournamentId && (m.date || '') >= vandaagISO)
    || (matchCancelled(m) && !m.tournamentId && (m.date || '') >= vandaagISO));
  if (homeFilter !== 'all') upcoming = upcoming.filter(m => m.teamName === homeFilter);
  upcoming.sort((a, b) => { const r = (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1); if (r) return r; return (a.date || '').localeCompare(b.date || ''); });
  // De twee eerstvolgende: met één wedstrijd zie je wel wat er nu aankomt, maar niet of er dit
  // weekend nog iets volgt. Meer dan twee maakt van het startscherm een tweede wedstrijdenlijst.
  upcoming = upcoming.slice(0, 2);
  const upcomingHtml = upcoming.length ? upcoming.map(matchItemHtml).join('') : '';
  // Eerstvolgende tornooi
  // Een afgesloten tornooi hoort hier niet meer bij, ook al ligt de datum nog in de toekomst: het
  // is bewust opgeborgen. Zelfde regel als in de tornooilijst (zie tournamentClosed).
  let upcomingTrn = getTournaments().filter(t => !tournamentClosed(t) && (t.date || '') >= new Date().toISOString().split('T')[0]);
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
  // Laatst gespeelde wedstrijden (zelfde filter). Sorteren op WEDSTRIJDDATUM en niet op de volgorde
  // van dbAll (dat is aanmaakdatum, nieuwste eerst): sinds de kalenderimport bestaan er wedstrijden
  // die vandaag aangemaakt zijn maar over maanden gespeeld worden, en dan stond onder "laatst
  // gespeeld" de laatst ingelezen wedstrijd in plaats van de laatst gespeelde.
  let recent = looseMatches.filter(m => m.status === 'done');
  if (homeFilter !== 'all') recent = recent.filter(m => m.teamName === homeFilter);
  recent.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  recent = recent.slice(0, 2);
  const recentHtml = recent.length ? `<div class="sec">${icI(IC.history)} Laatst gespeeld</div>${recent.map(matchItemHtml).join('')}` : '';
  const newBtn = canManage() ? `<button class="btn btn-org" onclick="newMatch()" style="margin-bottom:14px">${icI(IC.ball)} + Nieuwe wedstrijd</button>` : '';
  const createTeamHint = '';
  if (isGuest) {
    // Op de actieve ploeg filteren (zoals de andere lijsten) — anders toont een gast alle
    // lokaal-gecachte live matches, ook van een andere ploeg die hij ooit via een gastlink volgde.
    let liveMatches = all.filter(m => m.status === 'live');
    if (homeFilter !== 'all') liveMatches = liveMatches.filter(m => m.teamName === homeFilter);
    const liveHtml = liveMatches.length
      ? liveMatches.map(matchItemHtml).join('')
      : `<div class="empty" style="padding:24px 0"><div class="ei">${IC.ball}</div><p>Geen live wedstrijden op dit moment.</p></div>`;
    el.innerHTML = guestBanner + `<div class="sec">${icI(IC.ball)} Live wedstrijden</div>` + liveHtml;
    return;
  }
  // Vergeten-open-wedstrijd-melding: een live wedstrijd die niet afgesloten werd laat zijn klok op
  // wandkloktijd doorlopen, en de lijst hierboven is afgekapt — een vergeten wedstrijd 1 van een
  // tornooidag bleef dus volledig onzichtbaar.
  // looksForgotten() wacht een half uur na het voorziene einde, zodat een normale rust of een blok
  // dat wat uitloopt geen melding geeft.
  // BEWUST NIET GEFILTERD OP DE PLOEGFILTER (v0.48.0). Voordien wel, en dan werd een doorlopende
  // klok onvindbaar zodra je beginscherm op een andere ploeg stond — of op dezelfde ploeg met een
  // ander ploeg-id, wat na het incident van 21-08-2026 kon voorkomen. Op 22-08-2026 liep zo een
  // wedstrijd een hele nacht door zonder dat ze ergens te zien was. Een tikkende klok is dringend
  // voor de hele club, niet enkel voor de ploeg waar je nu naar kijkt; daarom staat de ploegnaam
  // op de knop in plaats van de melding weg te filteren.
  const forgotten = canManage() ? all.filter(looksForgotten) : [];
  // Live maar de klok staat stil: geen vertekende minuten, wel een wedstrijd die nog afgewerkt of
  // gedeblokkeerd moet worden (zie vastgelopenLive in live-match.js). Andere tekst, want "de klok
  // loopt door" zou hier gewoon niet waar zijn.
  const onafgewerkt = canManage() ? all.filter(looksUnfinished) : [];
  const openKnop = m => `<button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="go('live','${m.id}')">${esc(m.teamName || '')}${m.teamName ? ' · ' : ''}${esc(m.opponent || 'Wedstrijd')}${m.date ? ' · ' + fmtDate(new Date(m.date + 'T00:00:00').getTime()) : ''}</button>`;
  const forgottenBanner = (forgotten.length
    ? `<div class="nudge" style="margin-bottom:14px">${icI(IC.warn)} <b>${forgotten.length === 1 ? 'Eén wedstrijd loopt' : forgotten.length + ' wedstrijden lopen'} nog.</b> De klok tikt door, wat de speelminuten vertekent. Sluit ${forgotten.length === 1 ? 'ze' : 'ze allemaal'} af zodra je kan.
        ${forgotten.map(openKnop).join('')}
      </div>`
    : '') + (onafgewerkt.length
    ? `<div class="nudge" style="margin-bottom:14px">${icI(IC.warn)} <b>${onafgewerkt.length === 1 ? 'Eén wedstrijd staat' : onafgewerkt.length + ' wedstrijden staan'} nog open.</b> De klok staat stil, dus de speelminuten kloppen — ${onafgewerkt.length === 1 ? 'ze is' : 'ze zijn'} enkel nooit afgesloten.
        ${onafgewerkt.map(openKnop).join('')}
      </div>`
    : '');
  // Wedstrijden waarvan de dag voorbij is en die nooit afgesloten werden: nooit gestart (nog
  // 'planned') of gestart maar nooit beëindigd ('live'). Die stonden vóór v0.38.0 bij
  // "Eerstvolgende" — daar hoorden ze niet, maar ze mogen ook niet gewoon verdwijnen: er hangt een
  // verslag aan dat nog afgewerkt moet worden. Recentste eerst: die is het meest waarschijnlijk aan
  // de orde. Enkel voor wie de ploeg beheert — voor een kijker is dit administratie waar hij niets
  // aan kan doen. Staat een wedstrijd al in de banner hierboven (looksForgotten), dan laten we ze
  // hier weg: dezelfde wedstrijd twee keer op één scherm leest als twee problemen.
  // Deze berekening hoort ná `forgotten` te staan, anders is die variabele hier nog niet gekend.
  const inBanner = new Set([...forgotten, ...onafgewerkt].map(m => m.id));
  let openOud = canManage()
    ? looseMatches.filter(m => m.status !== 'done' && !matchCancelled(m)
        && (m.date || '') && m.date < vandaagISO && !inBanner.has(m.id))
    : [];
  if (homeFilter !== 'all') openOud = openOud.filter(m => m.teamName === homeFilter);
  openOud.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  openOud = openOud.slice(0, 2);
  const openOudHtml = openOud.length
    ? `<div class="sec">${icI(IC.warn)} Niet afgesloten</div>${openOud.map(matchItemHtml).join('')}`
    : '';
  const matchSection = upcoming.length ? `<div class="sec">${icI(IC.calendar)} Eerstvolgende wedstrijd${upcoming.length > 1 ? 'en' : ''}</div>${upcomingHtml}` : '';
  const trnSection = upcomingTrn.length ? `<div class="sec">${icI(IC.medal)} Eerstvolgende tornooi</div>${upcomingTrnHtml}` : '';
  const noneSection = (!upcoming.length && !upcomingTrn.length)
    ? `<div class="empty" style="padding:16px"><div class="ei">${icI(IC.calendar)}</div><p style="margin:0;color:var(--txt2)">Geen geplande wedstrijden of tornooien${homeFilter!=='all'?' voor deze ploeg':''}.</p></div>`
    : '';
  // Discrete clubvoettekst (fase clublogo): klein clublogo + clubnaam onderaan de ploegpagina.
  const clubLogo = getActiveClubLogo();
  const clubFooter = (clubLogo || activeClubName)
    ? `<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:28px 0 8px;opacity:.8">
        ${clubLogo ? `<img src="${clubLogo}" alt="" style="width:40px;height:40px;object-fit:contain">` : ''}
        ${activeClubName ? `<span style="font-size:13px;color:var(--txt2);font-weight:600">${esc(activeClubName)}</span>` : ''}
      </div>` : '';
  el.innerHTML = offlineBanner + guestBanner + viewerWelcome + forgottenBanner + tiles + createTeamHint + newBtn + filterBar + matchSection + noneSection + openOudHtml + recentHtml + trnSection + coAdminHint + clubFooter;
  // "Wat is er nieuw" bij een major-versie — hier en niet in init(), omdat de gebruiker op dit punt
  // écht binnen is (voorbij splash, aanmelden en setup). Eén keer per sessie proberen; de melding
  // zelf beslist of ze getoond wordt (zie toonNieuwAlsNodig in core.js).
  if (!_nieuwGetoond) { _nieuwGetoond = true; setTimeout(toonNieuwAlsNodig, 700); }
}
let _nieuwGetoond = false;
// WEDSTRIJDEN = volledige lijst met filter + zoeken.
// ----- Kalenderweergave van de wedstrijden -----
// De lijst blijft de standaard; de kalender is een tweede kijk op dezelfde wedstrijden, handig om
// te zien hoe een maand eruitziet. Enkel losse wedstrijden dus, net als de lijst hier: tornooien
// horen bij hun eigen scherm en zouden in dit blok misplaatst zijn.
let matchesWeergave = localStorage.getItem('voetbal_matches_weergave') === 'kalender' ? 'kalender' : 'lijst';
let calMaand = null;        // 'YYYY-MM' — null = huidige maand
let calDag = null;          // 'YYYY-MM-DD' van de aangetikte dag
const CAL_DAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const CAL_MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

function setMatchesWeergave(v) {
  matchesWeergave = v === 'kalender' ? 'kalender' : 'lijst';
  try { localStorage.setItem('voetbal_matches_weergave', matchesWeergave); } catch (e) {}
  loadMatches();
}
// ===================== FILTER OP DE WEDSTRIJDENLIJST =====================
// Vijf keuzes achter één knop (Tim, 23-08-2026). Bewust ALLEEN in de lijstweergave: in de kalender
// zie je per dag één stip, en een filter die daar stil wedstrijden wegneemt maakt van een lege dag
// een leugen. Zelfde afweging als bij de zoekbalk en het bulk-bewerken, die daar ook niet staan.
// Niet bewaard tussen sessies: een filter die je bij het openen van de app niet ziet staan, is de
// snelste manier om te denken dat er wedstrijden verdwenen zijn. De teller op de knop zegt tijdens
// het gebruiken hoeveel er actief zijn.
let matchFilter = { kind: 'all', status: 'all', seizoen: 'all', locatie: 'all', subteam: 'all' };
const MATCH_FILTER_LEEG = { kind: 'all', status: 'all', seizoen: 'all', locatie: 'all', subteam: 'all' };
function matchFilterAantal() { return Object.keys(MATCH_FILTER_LEEG).filter(k => matchFilter[k] !== 'all').length; }
function matchFilterPasToe(lijst) {
  return lijst.filter(m =>
    (matchFilter.kind === 'all' || matchKindOf(m) === matchFilter.kind)
    && (matchFilter.status === 'all' || m.status === matchFilter.status)
    && (matchFilter.seizoen === 'all' || seasonOf(m) === matchFilter.seizoen)
    && (matchFilter.locatie === 'all' || (m.location || '') === matchFilter.locatie)
    && (matchFilter.subteam === 'all' || (m.subteam || '') === matchFilter.subteam));
}
function setMatchFilterVeld(veld, waarde) {
  if (!(veld in MATCH_FILTER_LEEG)) return;
  matchFilter[veld] = waarde;
  loadMatches();
  modalMatchFilter();   // paneel blijft open: je zet er meestal meer dan één achter elkaar
}
function wisMatchFilter() { matchFilter = { ...MATCH_FILTER_LEEG }; closeModal(); loadMatches(); }
// De actieve filters als kaartjes naast het filterteken — zelfde patroon als op de
// statistiekenpagina (Tim, 23-08-2026): het teken opent het paneel, de kaartjes zeggen waar je
// naar kijkt. Elk kaartje is zelf ook aantikbaar, want dat is waar je naartoe grijpt om het
// weer weg te halen.
const MATCH_FILTER_LABEL = {
  kind: v => v === 'other' ? 'Andere soort' : v,
  status: v => ({ planned: 'Gepland', live: 'Live', done: 'Gespeeld', cancelled: 'Geannuleerd' }[v] || v),
  locatie: v => v,
  seizoen: v => v,
  subteam: v => 'Ploeg ' + v,
};
function matchFilterChipsHtml() {
  return Object.keys(MATCH_FILTER_LEEG)
    .filter(k => matchFilter[k] !== 'all')
    .map(k => `<span class="start-chip on" onclick="modalMatchFilter()">${esc(MATCH_FILTER_LABEL[k](matchFilter[k]))}</span>`)
    .join('');
}
// De keuzes komen uit de wedstrijden zelf, niet uit een vaste lijst: een seizoen of ploeglabel dat
// niet voorkomt, hoort niet in het menu te staan. Enkel de soort toont ook de drie standaardwaarden,
// zodat je op "Beker" kan filteren voordat er één ingelezen is.
function matchFilterVelden(alle) {
  const seizoenen = [...new Set(alle.map(seasonOf))].sort().reverse();
  const subteams = [...new Set(alle.map(m => (m.subteam || '').trim()).filter(Boolean))].sort();
  const soorten = [...new Set([...MATCH_KINDS, ...alle.map(m => (m.competition || '').trim()).filter(Boolean)])];
  const velden = [
    { veld: 'kind', label: 'Soort wedstrijd', opties: [['all', 'Alle soorten'], ...soorten.map(s => [s, s])] },
    { veld: 'status', label: 'Status', opties: [['all', 'Alle'], ['planned', 'Gepland'], ['live', 'Live'], ['done', 'Gespeeld'], ['cancelled', 'Geannuleerd']] },
    { veld: 'locatie', label: 'Thuis of uit', opties: [['all', 'Allebei'], ['Thuis', 'Thuis'], ['Uit', 'Uit']] },
  ];
  if (seizoenen.length > 1) velden.push({ veld: 'seizoen', label: 'Seizoen', opties: [['all', 'Alle seizoenen'], ...seizoenen.map(s => [s, s])] });
  if (subteams.length) velden.push({ veld: 'subteam', label: 'Ploeglabel', opties: [['all', 'Alle'], ...subteams.map(s => [s, s])] });
  return velden;
}
function modalMatchFilter() {
  const alle = (_matchFilterBron || []);
  const velden = matchFilterVelden(alle);
  const aantal = matchFilterPasToe(alle).length;
  const n = matchFilterAantal();
  openModal(`<h3>${icI(IC.search)} Filter</h3>
    ${velden.map(v => `<div class="fg"><label>${v.label}</label>
      <select onchange="setMatchFilterVeld('${v.veld}', this.value)">
        ${v.opties.map(([w, l]) => `<option value="${esc(w)}" ${matchFilter[v.veld] === w ? 'selected' : ''}>${esc(l)}</option>`).join('')}
      </select></div>`).join('')}
    <p style="text-align:center;font-size:13px;color:var(--txt2);margin:12px 0">${aantal} van de ${alle.length} ${alle.length === 1 ? 'wedstrijd' : 'wedstrijden'}${n ? '' : ' · geen filter actief'}</p>
    ${n ? `<button class="btn btn-pale" onclick="wisMatchFilter()">${icI(IC.close)} Filter wissen</button>` : ''}
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Sluiten</button>`);
}
// De lijst waarop het paneel zijn keuzes en tellingen baseert. Wordt door loadMatches gezet, zodat
// het paneel niet zelf de databank moet lezen (en dus niet async hoeft te zijn).
let _matchFilterBron = [];
// Dezelfde kalender staat in twee schermen; bladeren moet het scherm herladen waar je op staat.
function kalenderHerlaad() { if (view === 'agenda') loadAgenda(); else loadMatches(); }
function calSchuif(delta) {
  const [j, m] = (calMaand || isoMaandVan(new Date())).split('-').map(Number);
  const d = new Date(j, m - 1 + delta, 1);
  calMaand = isoMaandVan(d);
  calDag = null;
  kalenderHerlaad();
}
function calKies(iso) { calDag = (calDag === iso) ? null : iso; kalenderHerlaad(); }
function isoMaandVan(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function isoDagVan(d) { return isoMaandVan(d) + '-' + String(d.getDate()).padStart(2, '0'); }

// Bouwt het maandrooster. `tornooien` is optioneel: het wedstrijdenscherm geeft er geen mee (daar
// horen ze niet thuis), de agenda wel. Zo blijft er één kalender om te onderhouden.
function renderKalender(matches, tornooien = []) {
  const vandaag = isoDagVan(new Date());
  if (!calMaand) calMaand = vandaag.slice(0, 7);
  const [jaar, maand] = calMaand.split('-').map(Number);

  const perDag = {};
  const voegToe = (datum, soort) => {
    if (!datum) return;
    (perDag[datum] = perDag[datum] || []).push(soort);
  };
  matches.forEach(m => voegToe(m.date, m.status === 'live' ? 'live' : matchCancelled(m) ? 'cancel' : m.status === 'planned' ? 'plan' : 'done'));
  tornooien.forEach(t => voegToe(t.date, 'trn'));

  // Maandag als eerste kolom (getDay() geeft zondag = 0).
  const eerste = new Date(jaar, maand - 1, 1);
  const voorloop = (eerste.getDay() + 6) % 7;
  const dagenInMaand = new Date(jaar, maand, 0).getDate();

  let cellen = '';
  for (let i = 0; i < voorloop; i++) cellen += '<div class="cal-cell leeg"></div>';
  for (let d = 1; d <= dagenInMaand; d++) {
    const iso = `${calMaand}-${String(d).padStart(2, '0')}`;
    // Eén stip per wedstrijd, niet per soort: twee wedstrijden op dezelfde dag hoor je te zien.
    // Meer dan vier past niet in een cel; dan valt de rest weg (de lijst eronder toont ze wel).
    const dots = (perDag[iso] || []).slice(0, 4).map(s => `<i class="cal-dot ${s}"></i>`).join('');
    const klas = ['cal-cell', iso === vandaag ? 'vandaag' : '', iso === calDag ? 'sel' : ''].filter(Boolean).join(' ');
    cellen += `<div class="${klas}" onclick="calKies('${iso}')">
      <span class="cal-num">${d}</span><span class="cal-dots">${dots}</span></div>`;
  }

  // Wat er onder de kalender komt: de gekozen dag, of anders de hele maand op volgorde.
  const inMaand = m => (m.date || '').startsWith(calMaand);
  const gekozen = calDag
    ? matches.filter(m => m.date === calDag)
    : matches.filter(inMaand).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));
  const trnGekozen = calDag
    ? tornooien.filter(t => t.date === calDag)
    : tornooien.filter(t => (t.date || '').startsWith(calMaand));
  const kop = calDag
    ? new Date(calDag + 'T00:00:00').toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })
    : `${CAL_MAANDEN[maand - 1]} ${jaar}`;
  // Een tornooi staat als één dagitem in de agenda; zijn eigen wedstrijden zitten in het tornooi
  // zelf en zouden die dag anders vol stippen zetten.
  // Een tornooi is geen geplande wedstrijd: het kaartje droeg de oranje rand en badge daarvan, ook
  // als het tornooi al afgesloten was. Nu de eigen tornooikleur (dezelfde als de stip hierboven en
  // de legende), met de status in een tweede badge — zelfde woordkeuze als het Tornooien-scherm.
  const trnItems = trnGekozen.map(t => {
    // Enkel écht afgesloten, niet "de datum is voorbij": een tornooi dat nog niet afgesloten is
    // hoort ook niet zo te heten (zie tournamentClosed).
    const af = tournamentClosed(t);
    return `<div class="match-item trn-border" onclick="goTournament('${t.id}')">
      <div class="mi-info"><div class="mi-opp">${esc(t.name || 'Tornooi')}</div>
      <div class="mi-date">${t.date ? fmtDate(new Date(t.date + 'T00:00:00').getTime()) : ''}${t.location ? ' · ' + esc(t.location) : ''}${af ? ' · afgesloten' : ''}</div>
      <span class="badge badge-trn">${icI(IC.medal)} Tornooi</span>${af ? `<span class="badge badge-done" style="margin-left:5px">${icI(IC.done)} Afgesloten</span>` : ''}</div></div>`;
  }).join('');
  const lijst = (trnItems + gekozen.map(matchItemHtml).join(''))
    || `<p style="color:var(--txt2);font-size:14px;text-align:center;padding:8px 0">Niets ${calDag ? 'op deze dag' : 'deze maand'}.</p>`;

  return `<div class="cal-nav">
      <button onclick="calSchuif(-1)" aria-label="Vorige maand">‹</button>
      <b>${CAL_MAANDEN[maand - 1]} ${jaar}</b>
      <button onclick="calSchuif(1)" aria-label="Volgende maand">›</button>
    </div>
    <div class="cal-grid">${CAL_DAGEN.map(d => `<div class="cal-dow">${d}</div>`).join('')}${cellen}</div>
    <div class="cal-legend">
      <span><i class="cal-dot plan"></i> gepland</span>
      <span><i class="cal-dot live"></i> live</span>
      <span><i class="cal-dot done"></i> gespeeld</span>
      ${/* Enkel wanneer er ook écht iets geannuleerd is — anders staat er een uitleg bij een stip die
           je nooit ziet. Zelfde regel als bij de tornooistip hiernaast. */ ''}
      ${matches.some(matchCancelled) ? '<span><i class="cal-dot cancel"></i> geannuleerd</span>' : ''}
      ${tornooien.length ? '<span><i class="cal-dot trn"></i> tornooi</span>' : ''}
    </div>
    <div class="sec">${esc(kop)}</div>
    ${lijst}`;
}

// De agenda: dezelfde kalender, maar mét de tornooidagen erbij. Dat is het verschil met de kalender
// bij Wedstrijden — daar horen tornooien niet thuis, hier wel, want dit is de agenda van de ploeg.
async function loadAgenda() {
  // Eerst de databaseoproep, dán pas het element opzoeken: de view-functie roept dit aan vóór ze
  // haar HTML teruggeeft, dus #agenda-content bestaat pas na de eerste await (zelfde patroon als
  // loadMatches en loadHome).
  // Enkel losse wedstrijden: de wedstrijden ván een tornooi zitten in dat tornooi, en zouden die
  // dag anders dubbel tellen.
  const all = (await dbAll()).filter(m => !m.tournamentId);
  const el = document.getElementById('agenda-content');
  if (!el) return;
  const teams = [...new Set(all.map(m => m.teamName).filter(Boolean))].sort();
  if (cloudReady) homeFilter = teamNames[activeTeamId] || UNKNOWN_TEAM_FILTER;
  else if (homeFilter !== 'all' && !teams.includes(homeFilter)) homeFilter = 'all';
  const list = homeFilter === 'all' ? all : all.filter(m => m.teamName === homeFilter);
  const trns = getTournaments().filter(t => {
    if (!cloudReady) return homeFilter === 'all' || (t.teamName || '') === homeFilter;
    return tournamentInActiveTeam(t);
  });
  const filterBar = (!cloudReady && teams.length) ? `<div class="filterbar">
    <select onchange="setHomeFilter(this.value)">
      <option value="all" ${homeFilter === 'all' ? 'selected' : ''}>Alle ploegen</option>
      ${teams.map(t => `<option value="${esc(t)}" ${homeFilter === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
    </select></div>` : '';
  el.innerHTML = filterBar + renderKalender(list, trns);
}

// ===================== MEERDERE WEDSTRIJDEN TEGELIJK AANPASSEN =====================
// Aanleiding: na een kalenderimport staan tientallen wedstrijden op ploeg-label "B" terwijl het
// "Zwart" moet zijn. Eén voor één is dat tientallen keren hetzelfde klikken.
// Twee grenzen, bewust:
//  1. Enkel velden waar niets van afhangt. De ploeg, de tegenstander, de datum, het uur, thuis/uit en
//     alles rond selectie, opstelling, plan en gebeurtenissen blijven hier buiten. De ploeg is geen
//     theoretisch risico: precies dat veld deed op 21-08-2026 een wedstrijd uit de lijst verdwijnen.
//  2. Wedstrijdvorm, aantal blokken en blokduur enkel op GEPLANDE wedstrijden: die bepalen mee de
//     speelminuten en hoeveel spelers op het veld horen, dus op een gespeelde wedstrijd zou je het
//     verslag hertekenen dat al gedeeld is.
// Er wordt altijd maar één veld per keer gewijzigd, en op elke wedstrijd wordt enkel dat veld gezet —
// de rest van het object blijft letterlijk staan, zoals de kalenderimport het ook doet.
let bulkMode = false;
let bulkSel = new Set();
let bulkVeld = null;
const BULK_UNDO_KEY = 'voetbal_bulk_undo';
const BULK_UNDO_GELDIG_MS = 24 * 60 * 60 * 1000;   // een dag oude "ongedaan maken" helpt niemand meer
const BULK_VELDEN = [
  { key: 'subteam',         label: 'Ploeg-label',            soort: 'tekst', plaatshouder: 'bv. A, B of Zwart — leeg mag ook' },
  { key: 'competition',     label: 'Soort wedstrijd',        soort: 'keuze', opties: () => ['Competitie', 'Beker', 'Vriendschappelijk'] },
  { key: 'venue',           label: 'Terrein',                soort: 'tekst', plaatshouder: 'bv. Terrein 2' },
  { key: 'jersey',          label: 'Truikleur',              soort: 'tekst', plaatshouder: 'bv. rood-wit' },
  { key: 'trainer',         label: 'Trainer',                soort: 'tekst', plaatshouder: 'naam' },
  { key: 'responsible',     label: 'Ploegverantwoordelijke', soort: 'tekst', plaatshouder: 'naam' },
  { key: 'matchType',       label: 'Wedstrijdvorm',          soort: 'keuze', enkelGepland: true, opties: () => Object.keys(MATCH_TYPES) },
  // LET OP — dit veld zit in TWEE eigenschappen: periodKey ('kwarten') én numQuarters (4). Overal in
  // de app worden die samen gezet (zie wizPeriodChange, trnPeriodChange), en "1 deel" is de
  // uitzondering die het duidelijk maakt: dat is periodKey 'delen' mét numQuarters 1, terwijl
  // 'delen' normaal 3 betekent. Tot v0.47.0 schreef het bulk-bewerken hier enkel periodKey. Een
  // wedstrijd hield dan haar oude numQuarters, en na het laatste "gekende" blok viel elke knop weg:
  // geen volgend blok, geen einde, geen events — een livescherm zonder uitweg, met een klok die
  // bleef tikken (veldtest 22-08-2026). Vandaar lees/zet/raakt: één keuze, twee velden.
  { key: 'periodKey',       label: 'Aantal blokken',         soort: 'keuze', enkelGepland: true,
    opties: () => ['1', ...Object.keys(PERIOD_TYPES)],
    toon: k => k === '1' ? '1 deel' : `${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}`,
    lees: m => (m.periodKey === 'delen' && Number(m.numQuarters) === 1) ? '1' : (m.periodKey || ''),
    zet: (m, w) => {
      if (w === '1') { m.periodKey = 'delen'; m.numQuarters = 1; }
      else if (PERIOD_TYPES[w]) { m.periodKey = w; m.numQuarters = PERIOD_TYPES[w].count; }
    },
    raakt: ['periodKey', 'numQuarters'] },
  { key: 'quarterDuration', label: 'Blokduur',               soort: 'keuze', enkelGepland: true,
    opties: () => [...new Set([].concat(...Object.values(DURATIONS)))].sort((a, b) => a - b), toon: v => v + ' minuten', getal: true },
];
function bulkVeldById(key) { return BULK_VELDEN.find(v => v.key === key) || null; }
// Eén keuze kan meer dan één eigenschap van de wedstrijd omvatten (zie 'Aantal blokken'). Deze drie
// helpers zijn de enige plek waar het verschil bestaat; de rest van het bulk-bewerken werkt met de
// keuzewaarde en weet niet hoeveel velden eronder zitten.
function bulkLees(v, m) { return v.lees ? v.lees(m) : (m[v.key] == null ? '' : m[v.key]); }
function bulkZet(v, m, waarde) { if (v.zet) v.zet(m, waarde); else m[v.key] = waarde; }
// Alles wat dit veld aanraakt, zoals het nú in de wedstrijd staat — het ongedaan-maken moet elk van
// die eigenschappen terugzetten, niet enkel de eerste. `undefined` wordt null: een veld dat er nog
// niet was, hoort na een ongedaan-maken ook niet te bestaan.
function bulkOudeWaarden(v, m) {
  const o = {};
  (v.raakt || [v.key]).forEach(k => { o[k] = m[k] === undefined ? null : m[k]; });
  return o;
}
function bulkStart() { bulkMode = true; bulkSel = new Set(); bulkVeld = null; loadMatches(); }
function bulkStop() { bulkMode = false; bulkSel = new Set(); bulkVeld = null; loadMatches(); }
function bulkToggle(id) {
  if (bulkSel.has(id)) bulkSel.delete(id); else bulkSel.add(id);
  // Enkel het aangetikte kaartje en de teller hertekenen: de hele lijst hertekenen zou de zoekterm
  // en de schuifpositie wegvegen, en dat is bij dertig wedstrijden bijzonder vervelend.
  const kaart = document.querySelector(`.match-item[data-bulk="${id}"]`);
  if (kaart) {
    kaart.classList.toggle('bulk-aan', bulkSel.has(id));
    // Ook het vinkje zelf, niet enkel de groene achtergrond: dat vinkje wordt bij het tekenen
    // ingezet, dus zonder deze regel bleef een aangetikte rij een leeg groen blokje.
    const vink = kaart.querySelector('.bulk-vink');
    if (vink) vink.innerHTML = bulkSel.has(id) ? icI(IC.done) : '';
  }
  bulkBarVerversen();
}
// "Alles" werkt op wat je NU ziet, dus binnen je zoekterm — niet op de hele lijst. Anders selecteert
// een zoekopdracht op "B" stilletjes ook alles wat je net weggefilterd hebt.
function bulkAllesZichtbaar() {
  const zichtbaar = [...document.querySelectorAll('#match-list .match-item[data-bulk]')]
    .filter(el => el.style.display !== 'none');
  const allemaalAl = zichtbaar.length > 0 && zichtbaar.every(el => bulkSel.has(el.getAttribute('data-bulk')));
  zichtbaar.forEach(el => {
    const id = el.getAttribute('data-bulk');
    if (allemaalAl) bulkSel.delete(id); else bulkSel.add(id);
    el.classList.toggle('bulk-aan', bulkSel.has(id));
    const vink = el.querySelector('.bulk-vink');
    if (vink) vink.innerHTML = bulkSel.has(id) ? icI(IC.done) : '';
  });
  bulkBarVerversen();
}
function bulkBarVerversen() {
  const el = document.getElementById('bulk-teller');
  if (el) el.textContent = bulkSel.size === 0 ? 'Niets geselecteerd'
    : bulkSel.size === 1 ? '1 wedstrijd geselecteerd' : `${bulkSel.size} wedstrijden geselecteerd`;
  const btn = document.getElementById('bulk-pas-btn');
  if (btn) { btn.disabled = bulkSel.size === 0; btn.style.opacity = bulkSel.size === 0 ? '.5' : ''; }
}
function bulkItemHtml(m) {
  const sdata = `${m.opponent||''} ${m.teamName||''} ${m.subteam||''} ${m.location||''} ${m.competition||''} ${matchWhen(m)}`.toLowerCase();
  const aan = bulkSel.has(m.id);
  const statusTxt = m.status === 'live' ? 'Live' : m.status === 'planned' ? 'Gepland' : matchCancelled(m) ? 'Geannuleerd' : 'Gespeeld';
  return `<div class="match-item ${aan ? 'bulk-aan' : ''}" data-bulk="${m.id}" data-s="${esc(sdata)}" onclick="bulkToggle('${m.id}')">
    <div class="bulk-vink">${aan ? icI(IC.done) : ''}</div>
    <div class="mi-info">
      <div class="mi-opp">${esc(m.opponent || '(geen tegenstander)')}</div>
      <div class="mi-date">${m.teamName ? '<b>' + esc(m.teamName) + (m.subteam ? ' (' + esc(m.subteam) + ')' : '') + '</b> · ' : ''}${matchWhen(m)} · ${statusTxt}</div>
    </div></div>`;
}
// De balk boven de lijst: teller, alles-knop, en de weg naar het aanpassen zelf.
function bulkBarHtml() {
  return `<div class="card" style="margin-bottom:12px;position:sticky;top:0;z-index:5">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <b id="bulk-teller" style="flex:1;font-size:14px">Niets geselecteerd</b>
      <button class="btn btn-pale btn-sm" style="width:auto;margin:0" onclick="bulkAllesZichtbaar()">Alles in de lijst</button>
    </div>
    <p style="font-size:12px;color:var(--txt2);margin:8px 0 10px">Tik de wedstrijden aan die je samen wil aanpassen. Zoek eerst hierboven om je lijst korter te maken — "Alles in de lijst" volgt je zoekterm.</p>
    <button class="btn btn-org" id="bulk-pas-btn" disabled style="opacity:.5" onclick="bulkKiesVeld()">${icI(IC.edit)} Aanpassen…</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="bulkStop()">Annuleren</button>
  </div>`;
}
function bulkKiesVeld() {
  if (!bulkSel.size) return;
  openModal(`<h3>${icI(IC.edit)} Wat wil je aanpassen?</h3>
    <p style="font-size:13px;color:var(--txt2);margin-bottom:12px">Bij <b>${bulkSel.size}</b> ${bulkSel.size === 1 ? 'wedstrijd' : 'wedstrijden'}. Je past één ding per keer aan; al de rest van die wedstrijden blijft ongewijzigd.</p>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${BULK_VELDEN.map(v => `<button class="btn btn-pale" style="margin:0;text-align:left" onclick="bulkKiesWaarde('${v.key}')">${esc(v.label)}${v.enkelGepland ? ' <span style="color:var(--txt2);font-weight:400">— enkel geplande</span>' : ''}</button>`).join('')}
    </div>
    <button class="btn btn-gray" style="margin-top:12px" onclick="closeModal()">Annuleren</button>`);
}
async function bulkKiesWaarde(key) {
  const v = bulkVeldById(key);
  if (!v) return;
  bulkVeld = key;
  // Bij een veld dat enkel op geplande wedstrijden mag: nu al zeggen hoeveel er dan afvallen, niet
  // pas achteraf. Anders denk je dertig wedstrijden aan te passen en zijn het er twaalf.
  const alle = await dbAll();
  const gekozen = alle.filter(m => bulkSel.has(m.id));
  const raakt = v.enkelGepland ? gekozen.filter(m => m.status === 'planned') : gekozen;
  const vallenAf = gekozen.length - raakt.length;
  const invoer = v.soort === 'keuze'
    ? `<select id="bulk-waarde">${v.opties().map(o => `<option value="${esc(String(o))}">${esc(v.toon ? v.toon(o) : String(o))}</option>`).join('')}</select>`
    : `<input id="bulk-waarde" type="text" placeholder="${esc(v.plaatshouder || '')}" autocomplete="off">`;
  openModal(`<h3>${icI(IC.edit)} ${esc(v.label)}</h3>
    <div class="fg"><label>Nieuwe waarde</label>${invoer}</div>
    ${vallenAf > 0 ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24;text-align:left;margin-bottom:10px">${icI(IC.warn)} ${vallenAf} van je ${gekozen.length} wedstrijden ${vallenAf === 1 ? 'is' : 'zijn'} niet meer gepland en ${vallenAf === 1 ? 'blijft' : 'blijven'} dus ongewijzigd. Dit gaat over de speelminuten, en die van een gespeelde wedstrijd horen niet meer te bewegen.</div>` : ''}
    ${raakt.length ? `<button class="btn btn-org" onclick="bulkBekijkEnPasToe()">Volgende</button>`
      : `<p style="font-size:13px;color:var(--org2)">Geen enkele van je gekozen wedstrijden is nog gepland.</p>`}
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
// Laatste scherm vóór het opslaan: wat er verandert, bij welke wedstrijden, met de oude waarde erbij.
async function bulkBekijkEnPasToe() {
  const v = bulkVeldById(bulkVeld);
  if (!v) return;
  const inp = document.getElementById('bulk-waarde');
  let waarde = inp ? inp.value : '';
  if (v.getal) waarde = Number(waarde) || 0;
  const alle = await dbAll();
  const raakt = alle.filter(m => bulkSel.has(m.id) && (!v.enkelGepland || m.status === 'planned'))
    .filter(m => String(bulkLees(v, m)) !== String(waarde));   // wat al goed staat, laten we staan
  if (!raakt.length) { closeModal(); showToast('Daar stond die waarde al overal.', 'ok'); return; }
  const toon = x => (x === '' || x == null) ? '(leeg)' : (v.toon ? v.toon(x) : String(x));
  openModal(`<h3>${icI(IC.warn)} Nakijken</h3>
    <p style="font-size:14px;margin-bottom:10px">Bij <b>${raakt.length}</b> ${raakt.length === 1 ? 'wedstrijd' : 'wedstrijden'} wordt <b>${esc(v.label.toLowerCase())}</b> <b>${esc(toon(waarde))}</b>.</p>
    <div style="max-height:40vh;overflow-y:auto;text-align:left;font-size:13px;color:var(--txt2);border:1px solid var(--bdr);border-radius:8px;padding:8px">
      ${raakt.map(m => `<div style="padding:3px 0;border-bottom:1px solid var(--bdr)">${esc(m.opponent || '(geen tegenstander)')} · ${esc(matchWhen(m))}<br><span style="font-size:12px">nu: ${esc(toon(bulkLees(v, m)))}</span></div>`).join('')}
    </div>
    <button class="btn btn-org" style="margin-top:12px" onclick="bulkVoerUit('${esc(String(waarde))}')">Aanpassen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function bulkVoerUit(waardeTxt) {
  const v = bulkVeldById(bulkVeld);
  if (!v) return;
  const waarde = v.getal ? (Number(waardeTxt) || 0) : waardeTxt;
  closeModal();
  const alle = await dbAll();
  const raakt = alle.filter(m => bulkSel.has(m.id) && (!v.enkelGepland || m.status === 'planned'))
    .filter(m => String(bulkLees(v, m)) !== String(waarde));
  // De ploeg mee in de ongedaan-maken. Zonder dit verscheen het bannertje bij élke ploeg, en zette
  // een tik erop de oude waarden terug terwijl een ándere ploeg actief was — waarna die wedstrijden
  // naar de cloud van díe ploeg gingen. Precies het mechanisme van het incident van 21-08-2026,
  // door mij zelf opnieuw ingebouwd. Nu hoort een ongedaan-maken bij één ploeg.
  const undo = { veld: v.key, label: v.label, when: Date.now(), entries: [],
    teamId: activeTeamId || '', ploeg: (cloudReady ? (teamNames[activeTeamId] || '') : homeFilter) || '' };
  let gelukt = 0, mislukt = 0;
  for (const m of raakt) {
    const vers = await dbGet(m.id);
    if (!vers) { mislukt++; continue; }
    // `oud` blijft de losse waarde (oudere ongedaan-maken-gegevens in localStorage kennen enkel dat
    // veld); `oudAlle` draagt élke eigenschap die dit veld aanraakt. Zie bulkUndo.
    undo.entries.push({ id: vers.id, oud: vers[v.key] == null ? '' : vers[v.key], oudAlle: bulkOudeWaarden(v, vers) });
    bulkZet(v, vers, waarde);
    recomputeScore(vers); recomputeOnField(vers);
    try { await dbSave(vers); gelukt++; } catch (e) { mislukt++; undo.entries.pop(); }
  }
  try { localStorage.setItem(BULK_UNDO_KEY, JSON.stringify(undo)); } catch (e) {}
  bulkMode = false; bulkSel = new Set(); bulkVeld = null;
  showToast(mislukt ? `${gelukt} aangepast, ${mislukt} mislukt.` : `${gelukt} ${gelukt === 1 ? 'wedstrijd' : 'wedstrijden'} aangepast.`, mislukt ? 'err' : 'ok');
  loadMatches();
}
function bulkUndoBeschikbaar() {
  try {
    const u = JSON.parse(localStorage.getItem(BULK_UNDO_KEY) || 'null');
    if (!u || !u.entries || !u.entries.length) return null;
    if (Date.now() - (u.when || 0) > BULK_UNDO_GELDIG_MS) return null;
    // Enkel bij de ploeg waar de wijziging gebeurde. In de cloud is dat de actieve ploeg-id; lokaal
    // (zonder cloud) bestaat die niet en vergelijken we op de ploegnaam waarop de lijst filtert.
    // Een oudere ongedaan-maken zonder ploeg-informatie is niet toe te wijzen en bieden we niet aan.
    if (cloudReady) { if (!u.teamId || u.teamId !== activeTeamId) return null; }
    else if (u.ploeg && homeFilter !== 'all' && u.ploeg !== homeFilter) return null;
    return u;
  } catch (e) { return null; }
}
function bulkUndoVergeten() { try { localStorage.removeItem(BULK_UNDO_KEY); } catch (e) {} loadMatches(); }
async function bulkUndo() {
  const u = bulkUndoBeschikbaar();
  if (!u) return;
  let gelukt = 0;
  for (const e of u.entries) {
    const m = await dbGet(e.id);
    if (!m) continue;
    // oudAlle sinds v0.48.0: één keuze kan meer dan één eigenschap gezet hebben ('Aantal blokken'
    // zet periodKey én numQuarters). Ontbreekt het, dan komt deze ongedaan-maken van vóór die
    // versie en is er ook maar één veld gewijzigd.
    if (e.oudAlle && typeof e.oudAlle === 'object') {
      Object.keys(e.oudAlle).forEach(k => {
        if (e.oudAlle[k] === null) delete m[k]; else m[k] = e.oudAlle[k];
      });
    } else m[u.veld] = e.oud;
    recomputeScore(m); recomputeOnField(m);
    try { await dbSave(m); gelukt++; } catch (err) {}
  }
  try { localStorage.removeItem(BULK_UNDO_KEY); } catch (e) {}
  showToast(`${gelukt} ${gelukt === 1 ? 'wedstrijd' : 'wedstrijden'} teruggezet.`, 'ok');
  loadMatches();
}
function bulkUndoBannerHtml() {
  const u = bulkUndoBeschikbaar();
  if (!u || bulkMode) return '';
  const n = u.entries.length;
  return `<div class="nudge" style="margin-bottom:12px">${icI(IC.history)} <b>${n} ${n === 1 ? 'wedstrijd' : 'wedstrijden'} aangepast</b> (${esc(u.label.toLowerCase())}).
    <button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="bulkUndo()">Ongedaan maken</button>
    <button class="btn btn-gray btn-sm" style="margin-top:6px;width:100%" onclick="bulkUndoVergeten()">Sluiten</button></div>`;
}
async function loadMatches() {
  const all = (await dbAll()).filter(m => !m.tournamentId);
  const el = document.getElementById('matches-content');
  if (!el) return;
  // Ook zonder één wedstrijd horen de twee aanmaakknoppen hier te staan: wie met een lege app
  // begint, is net degene die zijn hele kalender in één keer wil inlezen.
  // "Nieuwe wedstrijd" is de hoofdhandeling en houdt de volle breedte; importeren en meerdere
  // aanpassen zijn bijzaken en staan daaronder naast elkaar (Tim, 23-08-2026). Bij een lege lijst
  // bestaat "meerdere aanpassen" niet en krijgt importeren de hele regel.
  const nieuwBtn = canManage() ? `<button class="btn btn-org" onclick="newMatch()" style="margin-bottom:8px">${icI(IC.ball)} + Nieuwe wedstrijd</button>` : '';
  const impBtn = canManage() ? `<button class="btn btn-orgpale btn-sm" style="margin:0" onclick="impStart()">${icI(IC.upload)} Kalender importeren</button>` : '';
  const maakBtns = nieuwBtn + (impBtn ? `<div style="margin-bottom:12px">${impBtn}</div>` : '');
  if (!all.length) {
    el.innerHTML = maakBtns + `<div class="empty"><div class="ei">${IC.ball}</div><p>Nog geen wedstrijden.<br>Maak eerst een ploeg aan, tik dan <b>+</b> — of lees de kalender van je reeks in.</p></div>`;
    return;
  }
  const teams = [...new Set(all.map(m => m.teamName).filter(Boolean))].sort();
  // Zie loadHome(): in de cloud altijd op de actieve ploeg filteren, nooit blind 'all'.
  if (cloudReady) homeFilter = teamNames[activeTeamId] || UNKNOWN_TEAM_FILTER;
  else if (homeFilter !== 'all' && !teams.includes(homeFilter)) homeFilter = 'all';
  const perPloeg = (homeFilter === 'all' ? all : all.filter(m => m.teamName === homeFilter)).slice();
  // De filter geldt enkel in de lijstweergave (zie matchFilter): in de kalender zou hij stil dagen
  // leegmaken. `_matchFilterBron` is wat het paneel telt en waaruit het zijn keuzes haalt — dus de
  // wedstrijden van deze ploeg, vóór het filteren.
  _matchFilterBron = perPloeg;
  const filterAan = matchesWeergave === 'lijst' && matchFilterAantal() > 0;
  const list = filterAan ? matchFilterPasToe(perPloeg) : perPloeg;
  // Alleen zinvol met MEER dan één ploeg op dit toestel: bij één ploeg stond er een keuzelijst met
  // "Alle ploegen" en die ene ploeg — een keuze die niets te kiezen valt, en die leest als een filter
  // op iets anders (Tim, 23-08-2026). In cloud-modus stond ze er sowieso al niet.
  const filterBar = (!cloudReady && teams.length > 1) ? `<div class="filterbar">
    <select onchange="setHomeFilter(this.value)">
      <option value="all" ${homeFilter==='all'?'selected':''}>Alle ploegen (${all.length})</option>
      ${teams.map(t => `<option value="${esc(t)}" ${homeFilter===t?'selected':''}>${esc(t)} (${all.filter(m=>m.teamName===t).length})</option>`).join('')}
    </select></div>` : '';
  // Gescheiden in duidelijke groepen: live · gepland (vroegste eerst) · gespeeld (recentste eerst).
  const live = list.filter(m => m.status === 'live');
  const planned = list.filter(m => m.status === 'planned').sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const done = list.filter(m => m.status === 'done').sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt - a.createdAt));
  // Geannuleerd staat onderaan, apart: het zijn geen geplande wedstrijden meer (er valt niets voor
  // te bereiden) en ook geen uitslagen. Recentste eerst, zoals bij de gespeelde.
  const afgelast = list.filter(matchCancelled).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt - a.createdAt));
  // Tweede parameter zodat dezelfde groepen ook met de vinkjes-weergave getekend kunnen worden.
  const sec = (title, arr, teken) => arr.length ? `<div class="sec">${title}</div>${arr.map(teken || matchItemHtml).join('')}` : '';
  const items = list.length
    ? sec(`${icI(IC.live)} Live`, live) + sec(`${icI(IC.calendar)} Geplande wedstrijden`, planned) + sec(`${icI(IC.done)} Gespeelde wedstrijden`, done) + sec(`${icI(IC.close)} Geannuleerde wedstrijden`, afgelast)
    : (filterAan
      ? `<div class="empty"><div class="ei">${IC.search}</div><p>Geen wedstrijden met deze filter.<br><button class="btn btn-pale btn-sm" style="width:auto;margin-top:10px" onclick="wisMatchFilter()">Filter wissen</button></p></div>`
      : `<div class="empty"><div class="ei">${IC.search}</div><p>Geen wedstrijden voor deze ploeg.</p></div>`);
  const searchBar = all.length > 6 ? `<div class="searchbar"><input id="home-search" type="search" placeholder="Zoek op tegenstander, ploeg, plaats…" oninput="filterHomeItems(this.value)" value="${esc(homeSearch)}"></div>` : '';
  // Twee kijken op dezelfde wedstrijden. De zoekbalk hoort bij de lijst: in de kalender zoek je op
  // datum, niet op naam.
  const schakelaar = `<div class="cal-switch">
    <button class="${matchesWeergave === 'lijst' ? 'act' : ''}" onclick="setMatchesWeergave('lijst')">${icI(IC.log)} Lijst</button>
    <button class="${matchesWeergave === 'kalender' ? 'act' : ''}" onclick="setMatchesWeergave('kalender')">${icI(IC.calendar)} Kalender</button>
  </div>`;
  // Meerdere tegelijk aanpassen: dezelfde lijst, maar met vinkjes en zonder navigatie bij een tik.
  // Bewust enkel in de lijstweergave — in de kalender zie je per dag één stip en kan je niet
  // overzien wát je aanvinkt. De zoekbalk blijft werken, want die is hier het gereedschap: je zoekt
  // "B" en vinkt dan alles aan.
  if (bulkMode) {
    const bulkItems = list.length
      ? sec(`${icI(IC.live)} Live`, live, bulkItemHtml) + sec(`${icI(IC.calendar)} Geplande wedstrijden`, planned, bulkItemHtml)
        + sec(`${icI(IC.done)} Gespeelde wedstrijden`, done, bulkItemHtml) + sec(`${icI(IC.close)} Geannuleerde wedstrijden`, afgelast, bulkItemHtml)
      : `<div class="empty"><div class="ei">${IC.search}</div><p>Geen wedstrijden voor deze ploeg.</p></div>`;
    el.innerHTML = bulkBarHtml() + searchBar + `<div id="match-list">${bulkItems}</div>`;
    if (homeSearch) filterHomeItems(homeSearch);
    bulkBarVerversen();
    return;
  }
  const bulkBtn = (canManage() && list.length > 1)
    ? `<button class="btn btn-pale btn-sm" style="margin:0" onclick="bulkStart()">${icI(IC.edit)} Meerdere aanpassen</button>` : '';
  // De twee bijzaken naast elkaar op halve breedte; staat er maar één, dan vult die de regel.
  const rijBtns = (impBtn || bulkBtn)
    ? `<div style="display:grid;grid-template-columns:${impBtn && bulkBtn ? '1fr 1fr' : '1fr'};gap:8px;margin-bottom:12px">${impBtn}${bulkBtn}</div>` : '';
  if (matchesWeergave === 'kalender') {
    el.innerHTML = bulkUndoBannerHtml() + impUndoBannerHtml() + nieuwBtn + (impBtn ? `<div style="margin-bottom:12px">${impBtn}</div>` : '') + filterBar + schakelaar + renderKalender(list);
    return;
  }
  // Het filterteken met de actieve filters ernaast als kaartjes. Zonder filter staat het woord
  // "Filter" erbij (een kaal tekentje zegt niets als er nog niets gekozen is); zodra er kaartjes
  // staan, zeggen die wat er gebeurt en volstaat het teken.
  const n = matchFilterAantal();
  // Ook tonen zodra er een filter AAN staat, ongeacht het aantal wedstrijden. De grens lag op "meer
  // dan drie", terwijl het filteren zelf enkel van `n` afhangt: met drie wedstrijden waarvan de filter
  // er twee verbergt, toonde de lijst er één en stond er nergens een teken, een kaartje of een teller
  // — terwijl de tegel op het beginscherm er drie meldde. Dat leest als "mijn wedstrijden zijn
  // verdwenen" (audit 23-08-2026). Filtert de filter álles weg, dan stond er al een knop
  // "Filter wissen"; dit gat zat in het geval dat er nog iets overblijft.
  const filterBtn = (perPloeg.length > 3 || n > 0)
    ? `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn btn-pale btn-sm" style="width:auto;padding:6px 11px;margin:0" title="Filter" onclick="modalMatchFilter()">${icI(IC.filter)}${n ? '' : ' Filter'}</button>
        ${matchFilterChipsHtml()}
        ${n ? `<span style="font-size:12px;color:var(--txt2)">${list.length} van ${perPloeg.length}</span>` : ''}
      </div>` : '';
  el.innerHTML = bulkUndoBannerHtml() + impUndoBannerHtml() + nieuwBtn + rijBtns + filterBar + schakelaar + filterBtn + searchBar + `<div id="match-list">${items}</div>`;
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

