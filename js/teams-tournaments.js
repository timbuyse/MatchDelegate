// ===================== PLOEGEN BEHEREN =====================
let editingTeam = null;
let teamEditMode = false; // beheerder: overzicht (uit) vs. bewerkbare lijst (aan)
function renderTeamsList() {
  const teams = cloudReady ? getTeamsV2().filter(t => t.fromCloud) : getTeamsV2();
  const title = cloudReady ? `${icI(IC.players)} Spelers` : `${icI(IC.players)} Ploegen`;
  return `<div class="hdr"><button class="back" onclick="go('home')">‹</button><h1>${title}</h1></div>
  <div class="content">
    ${teams.length ? teams.map(t => `<div class="team-row" onclick="openTeam('${t.id}')"><div><div class="tn">${esc(t.name)}</div><div class="tc">${t.players.length} spelers</div></div><span style="margin-left:auto;color:var(--txt2);font-size:22px">›</span></div>`).join('') : `<div class="empty"><div class="ei">${IC.players}</div><p>${rosterEmptyText('Nog geen spelers.')}</p></div>`}
    ${!cloudReady && canManage()
      ? '<button class="btn btn-green" style="margin-top:8px" onclick="newTeam()">+ Nieuwe ploeg</button>'
      : (cloudReady && isAdmin)
        ? `<div class="viewer-banner" style="margin-top:8px">${icI(IC.plus)} Een andere ploeg aanmaken of ernaar wisselen doe je via de ploegknop (${icI(IC.swap)}) bovenaan het startscherm.</div>`
        : `<div class="viewer-banner" style="margin-top:8px">${icI(IC.eye)} Je kijkt mee — spelers worden door de beheerder beheerd</div>`}
  </div>`;
}
// useNumbers: false vanaf het AANMAKEN (v0.55.0): bij jeugdploegen zijn vaste rugnummers niet de
// norm, dus een nieuwe ploeg start zonder. LET OP: dit hoort hier, bij het aanmaken — niet in de
// betekenis van een ontbrekend veld. teamUsesNumbers() leest een ontbrekend veld als "aan", en dat
// moet zo blijven: bestaande ploegen van vóór v0.15.0 hebben het veld niet en horen hun nummers te
// houden.
function newTeam() { if (!canManage()) return; editingTeam = { id: uid(), name: '', responsible: '', trainers: [], players: [], useNumbers: false, isNew: true }; teamEditMode = true; teamDelUndo = []; go('teamEdit'); }
function openTeam(id) { const t = teamById(id); if (!t) return; editingTeam = JSON.parse(JSON.stringify(t)); teamEditMode = false; teamDelUndo = []; go('teamEdit'); }
function toggleTeamEditMode() { teamEditMode = !teamEditMode; render(); }
// Het tweede lijstje verschilt per positie: een kant (links/rechts) bij Verdediger en
// Vleugelspeler, een rol (verdedigend/aanvallend) bij Middenvelder, en niets bij Keeper of Spits.
// Enkel dat ene blokje herschrijven i.p.v. een volledige herrender (zelfde reden als bij
// wizTrainerSelChange): de rugnummers in dit scherm staan op onchange, dus een herrender
// midden in het typen zou een nog niet vastgelegd nummer wissen.
function teamSideRowHtml(i, p) {
  const sides = posSides(p.pos);
  const keys = Object.keys(sides);
  if (!keys.length) return '';
  return `<select onchange="editingTeam.players[${i}].side=this.value"><option value="">${esc(posSideLabel(p.pos))} (optioneel)…</option>${keys.map(k => `<option value="${k}" ${p.side===k?'selected':''}>${esc(sides[k])}</option>`).join('')}</select>`;
}
function teamPosChange(i, val) {
  const p = editingTeam.players[i];
  p.pos = val;
  if (!posSideValid(val, p.side)) p.side = ''; // kant/rol van de vorige positie hoort hier niet meer
  const fg = document.getElementById('team-side-fg-' + i);
  if (fg) {
    const html = teamSideRowHtml(i, p);
    fg.innerHTML = html;
    fg.style.display = html ? '' : 'none';
  }
}
// Beheerder: ga rechtstreeks naar de spelerslijst van de huidige ploeg (1 roster per ploeg).
// TWEE INGANGEN, TWEE SCHERMEN (Tim, 23-08-2026). De tegel "Ploeg" op het beginscherm en de groene
// knop rechtsboven leidden naar hetzelfde scherm: dezelfde bestemming met twee namen, en dus een lange
// pagina waarin de spelers en het ledenbeheer door elkaar stonden. Nu bepaalt de ingang wat je ziet:
//   'ploeg'  — de ploeg zelf: standaardinstellingen, trainers en de spelerslijst (tegel "Ploeg").
//   'beheer' — wie toegang heeft en wat je met de ploeg als geheel doet (de groene knop "Beheer").
// Eén render-functie, want het is één ploeg met twee gezichten; dat houdt de terugknop en de
// kijkersweergave op één plek.
let teamScherm = 'ploeg';
function openSquad(scherm) {
  teamScherm = scherm === 'beheer' ? 'beheer' : 'ploeg';
  const arr = cloudReady ? getTeamsV2().filter(t => t.fromCloud) : getTeamsV2();
  if (arr.length === 1) openTeam(arr[0].id); else go('teams');
}
function openTeamBeheer() { openSquad('beheer'); }
// Binnen hetzelfde scherm van gezicht wisselen: enkel hertekenen, geen nieuwe navigatiestap. Anders
// zou de terugknop je door twee versies van dezelfde ploeg laten lopen.
function toonTeamScherm(s) { teamScherm = (s === 'beheer') ? 'beheer' : 'ploeg'; render(); }
// De groene knop rechtsboven: een beheerder komt in het beheerscherm, een kijker bij de ploeg zelf
// (voor hem bestaat het beheerdeel niet).
// DE WEG TERUG MAG NOOIT VERDWIJNEN (24-08-2026). Dit stond op `isAdmin && !viewerMode`, dus zodra
// de kijkmodus aanstond opende de chip het gewone ploegscherm — en net dáár stond de schakelaar om
// hem weer uit te zetten, op het beheerscherm. Tim zat daardoor vast en kwam er alleen uit door de
// app te herladen. De schakelaar is nu weg, maar deze regel blijft op `isAdmin`: wie beheerder is,
// raakt altijd op zijn beheerscherm, wat de kijkmodus ook zegt.
function openCloudChip() { openSquad(isAdmin ? 'beheer' : 'ploeg'); }
function closeTeamEdit() { editingTeam = null; teamDelUndo = []; go(cloudReady ? 'home' : 'teams'); }
// De spelerslijst van een ploeg (overzicht én kijkersweergave) is sorteerbaar op de drie kolommen
// die er staan: rugnummer (enkel als de ploeg ze gebruikt), familienaam en voorkeurspositie.
// Standaard alfabetisch op familienaam — zoals elke andere spelerslijst in de app.
let teamListSort = 'naam';
function setTeamListSort(v) { teamListSort = v; render(); }
function teamListSorted(t) {
  const arr = [...(t.players || [])];
  if (teamListSort === 'nr' && teamUsesNumbers(t)) {
    return arr.sort((a, b) => ((parseInt(a.number) || 999) - (parseInt(b.number) || 999)) || byLastNameNl({ name: pLastName(a) }, { name: pLastName(b) }));
  }
  if (teamListSort === 'positie') {
    // Op de vaste volgorde van POSITIONS (keeper → spits), niet alfabetisch: dat leest als een
    // opstelling. Zonder positie achteraan.
    const keys = Object.keys(POSITIONS);
    const rank = p => { const i = keys.indexOf(normPos(p.pos)); return i < 0 ? 99 : i; };
    return arr.sort((a, b) => (rank(a) - rank(b)) || (pLastName(a) + pFirstName(a)).localeCompare(pLastName(b) + pFirstName(b), 'nl'));
  }
  return arr.sort((a, b) => (pLastName(a) + ' ' + pFirstName(a)).localeCompare(pLastName(b) + ' ' + pFirstName(b), 'nl'));
}
function teamListHead(t) {
  const knop = (key, label, extra) => `<span onclick="setTeamListSort('${key}')" style="cursor:pointer;${extra || ''}${teamListSort === key ? 'color:var(--grn)' : ''}">${label}${teamListSort === key ? ' ▾' : ''}</span>`;
  return `<div class="stat-row" style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--txt2);border-bottom:1px solid var(--bdr)">
    ${teamUsesNumbers(t) ? knop('nr', 'Nr', 'min-width:38px;') : ''}
    ${knop('naam', 'Naam', 'flex:1;')}
    ${knop('positie', 'Positie')}
  </div>`;
}
function teamPlayerRows(t) {
  const sorted = teamListSorted(t);
  if (!sorted.length) return '<p style="color:var(--txt2);font-size:13px;text-align:center;padding:6px 0">Nog geen spelers.</p>';
  // Spelerdetail is beheerder-only (openPlayerDetail doet voor kijkers stil niets) — geen
  // klik-affordance tonen die nergens toe leidt.
  return teamListHead(t) + sorted.map(p => `<div class="stat-row" ${canSeeStats() ? `style="cursor:pointer" onclick="openPlayerDetail('${jsq(pFirstName(p) + ' ' + pLastName(p))}','${jsq(t.name)}','${jsq(p.id)}')"` : ''}>
      ${teamUsesNumbers(t) ? `<span style="min-width:38px;font-weight:800;color:var(--txt2)">${esc(p.number)||'–'}</span>` : ''}
      <span style="flex:1;font-weight:600">${esc(pFirstName(p))} ${esc(pLastName(p))}</span>
      ${p.pos?`<span style="font-size:12px;color:var(--txt2)">${esc(posDisplay(p))}</span>`:''}
    </div>`).join('');
}
// De ploegverantwoordelijken en trainers als inforegels. Genummerd zodra er meer dan één is —
// bij precies één zou "Trainer 1" alleen maar suggereren dat er nog eentje mist.
function teamStaffRowsHtml(t) {
  const rij = (k, v) => `<div class="stat-row"><span style="color:var(--txt2);min-width:140px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`;
  const resps = teamResponsibleNames(t);
  const trainers = teamTrainerNames(t);
  return resps.map((n, i) => rij('Ploegverantw.' + (resps.length > 1 ? ' ' + (i + 1) : ''), n)).join('')
    + trainers.map((n, i) => rij('Trainer' + (trainers.length > 1 ? ' ' + (i + 1) : ''), n)).join('');
}
function renderTeamView() {
  const t = editingTeam;
  const trainers = (t.trainers || []).filter(tr => tr.name);
  return `<div class="hdr"><button class="back" onclick="closeTeamEdit()">‹</button><h1>${esc(t.name)}</h1></div>
  <div class="content">
    <div class="viewer-banner">${icI(IC.eye)} Je kijkt mee — ploegen worden door de beheerder beheerd</div>
    ${(t.responsible || trainers.length) ? `<div class="card">
      ${teamStaffRowsHtml(t)}
    </div>` : ''}
    <div class="sec">Spelers (${t.players.length})</div>
    <div class="card">${teamPlayerRows(t)}</div>
    ${(cloudReady && activeTeamId && t.fromCloud && !isGuest) ? `
    <div class="sec">Meedoen</div>
    <div class="card">
      <button class="btn btn-pale" onclick="confirmRequestCoAdmin()">${icI(IC.edit)} Vraag ploegbeheer aan</button>
      <p style="font-size:12px;color:var(--txt2);margin-top:6px">Wil je zelf wedstrijden mogen bijhouden voor deze ploeg? Vraag het hier aan.</p>
    </div>` : ''}
  </div>`;
}
// ===================== PLOEGSCHERM =====================
// Twee gezichten van hetzelfde scherm (Tim, 23-08-2026), gekozen met teamScherm:
//   'ploeg'  — de ploeg zelf: spelers, trainers, standaardinstellingen. Dit is het dagelijkse werk.
//   'beheer' — wie toegang heeft en de ploeg als geheel: uitnodigen, leden, naam, kijkmodus, prullenmand.
// In v1.0.4 stond alles op één scherm samen. Dat werd één lange lijst waarin het dagelijkse werk
// (spelers) tussen handelingen stond die je een paar keer per seizoen doet. Belangrijk: het blijft
// ÉÉN navigatiestap — toonTeamScherm hertekent enkel, zodat de terugknop je niet door twee versies
// van dezelfde ploeg laat lopen. Onderaan elk gezicht staat de weg naar het andere.
function renderTeamOverview() {
  const t = editingTeam;
  const oDmt = MATCH_TYPES[t.defaultMatchType] ? t.defaultMatchType : '8v8';
  const oForms = FORMATIONS[oDmt] || [];
  const oForm = oForms.some(f => f.name === t.defaultFormation) ? t.defaultFormation : (oForms[0] ? oForms[0].name : '');
  // De beheerblokken gelden de ACTIEVE cloud-ploeg. In lokale modus (geen cloud) en bij een ploeg
  // die niet de actieve cloud-ploeg is, horen ze er niet te staan — anders zou je de leden van de
  // ene ploeg beheren terwijl je naar de andere kijkt.
  const cloudPloeg = cloudReady && activeTeamId && t.fromCloud;
  const mensenBlok = (cloudPloeg && isAdmin) ? `
    <div class="sec">${icI(IC.players)} Mensen met toegang</div>
    <div class="card">
      <button class="btn btn-green" onclick="showInviteModal()"><span class="ic-i" style="font-size:1.1em">${IC.qrcode}</span> Iemand uitnodigen</button>
      <button class="btn btn-pale" style="margin-top:8px" onclick="showMembersModal()">${icI(IC.players)} Leden${pendingCoAdminCount ? `<span class="req-badge">${pendingCoAdminCount}</span>` : ''}</button>
      ${isOwner ? `<button class="btn btn-pale" style="margin-top:8px" onclick="showAppointTeamAdmin('${activeTeamId}','${jsq(t.name)}')">${icI(IC.shield)} Aanstellen op e-mailadres</button>
      <p style="font-size:12px;color:var(--txt2);margin-top:6px">Voor wie de uitnodigingslink niet kreeg. Enkel jij als maker van de app ziet dit.</p>` : ''}
    </div>` : '';
  // Prullenmand staat er ALTIJD (ook leeg), want een knop die verdwijnt als er niets in zit was
  // precies de reden dat "Teruggevonden" eens wel en dan weer niet leek op te duiken.
  const ploegBlok = (cloudPloeg && isAdmin) ? `
    <div class="sec">Deze ploeg</div>
    <div class="card">
      <button class="btn btn-pale" onclick="showRenameTeamModal()">${icI(IC.edit)} Naam wijzigen</button>
      ${/* DE KIJKMODUS-SCHAKELAAR IS WEG (Tim, 24-08-2026). Hij was een val: de schakelaar stond op
           dít scherm, maar zodra de kijkmodus aanstond opende de chip bovenaan het gewone
           ploegscherm i.p.v. het beheerscherm (zie openCloudChip) — de enige weg terug zat dus
           achter een deur die je net had dichtgedaan. Tim zat vast en kwam er alleen uit door de
           app te herladen. Hij voegde bovendien weinig toe.
           De onderliggende `viewerMode` en alle `!viewerMode`-controles blijven staan: ze zijn
           overal verweven in canLive/canManage/canSeeStats, en het testharnas (rollen.js) gebruikt
           ze om een kijker na te bootsen zonder tweede account. Enkel de knop is weg, dus de modus
           kan niet meer per ongeluk aangezet worden. */ ''}
      <button class="btn btn-pale" style="margin-top:14px" onclick="_tgvFrom='teamEdit';go('teruggevonden')">${icI(IC.history)} Prullenmand</button>
      <p style="font-size:12px;color:var(--txt2);margin-top:6px">Verwijderde wedstrijden en tornooien blijven bewaard. Hier zet je ze terug.</p>
      ${/* Archiveren en verwijderen van een hele ploeg staan bewust NIET hier maar in Clubbeheer
            (Tim, 23-08-2026): het zijn clubhandelingen, net als een ploeg aanmaken. Zo staan de drie
            bij elkaar en kan niemand vanuit het dagelijkse ploegscherm per ongeluk een ploeg wissen. */ ''}
    </div>` : '';
  // BEHEERSCHERM: enkel de twee blokken over toegang en over de ploeg als geheel. Bestaan die hier
  // niet (geen beheerder, of een ploeg die niet de actieve cloud-ploeg is), dan valt dit terug op de
  // ploeg zelf — een scherm met enkel een terugknop is nooit het antwoord.
  if (teamScherm === 'beheer' && (mensenBlok || ploegBlok)) {
    return `<div class="hdr"><button class="back" onclick="closeTeamEdit()">‹</button><h1>Beheer · ${esc(t.name)}</h1></div>
    <div class="content">
      ${mensenBlok}
      ${ploegBlok}
      <button class="btn btn-pale" style="margin-top:14px" onclick="toonTeamScherm('ploeg')">${icI(IC.shirt)} Naar de ploeg en de spelers</button>
    </div>`;
  }
  return `<div class="hdr"><button class="back" onclick="closeTeamEdit()">‹</button><h1>${esc(t.name)}</h1></div>
  <div class="content">
    <div class="sec">De ploeg</div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1"><b style="font-size:15px">Spelers en instellingen</b><div style="font-size:12px;color:var(--txt2)">Spelers, rugnummers, trainers en de standaardinstellingen aanpassen.</div></div>
        ${/* Een potlood in plaats van een chip met het woord "Aan" (Tim, 23-08-2026): "Aan" las als een
             schakelaar die al aanstond, terwijl het de knop is waarmee je begint te bewerken. Het
             potlood kleurt groen zodra bewerken aanstaat. */ ''}
        <button class="lc-btn" onclick="toggleTeamEditMode()" aria-label="Bewerken" title="Bewerken"
          style="${teamEditMode ? 'background:var(--grn);color:#fff;border-color:var(--grn)' : ''}">${icI(IC.edit)}</button>
      </div>
    </div>
    <div class="card">
      <div class="stat-row"><span style="color:var(--txt2);min-width:140px">Standaardopstelling</span><span style="font-weight:600">${esc(oForm)} <span style="color:var(--txt2);font-weight:400">(${esc(oDmt)})</span></span></div>
      ${teamStaffRowsHtml(t)}
    </div>
    ${/* Ook hier, niet enkel achter het potlood: dit is het scherm waar je bélandt, en waar je dus
         komt kijken of deze ploeg aan haar ploeg bij de bond hangt. Zie import-cal.js. */ ''}
    ${rbfaTeamSectieHtml(t)}
    <div class="sec">Spelers (${t.players.length})</div>
    <div class="card">${teamPlayerRows(t)}</div>
    ${/* Mensen met toegang en "Deze ploeg" staan niet meer hieronder maar in het beheerscherm (de
         groene knop rechtsboven). Enkel de weg ernaartoe blijft hier staan, zodat je niet eerst
         terug moet naar het beginscherm. */ ''}
    ${(mensenBlok || ploegBlok) ? `<button class="btn btn-pale" style="margin-top:14px" onclick="toonTeamScherm('beheer')">${icI(IC.shield)} Beheer: mensen met toegang en deze ploeg</button>` : ''}
  </div>`;
}
function renderTeamEdit() {
  if (!editingTeam) return '<div class="content"><p>Geen ploeg.</p></div>';
  if (!canManage()) return renderTeamView();
  if (!teamEditMode) return renderTeamOverview();
  const posKeys = Object.keys(POSITIONS);
  // Rugnummers zijn optioneel per ploeg (bij jeugd zijn vaste nummers niet de norm). Staat het uit,
  // dan verdwijnt het nummervakje hier en krijgt de naam die ruimte; de al ingevulde nummers blijven
  // bewaard, ze worden enkel niet gebruikt — zet je het vinkje terug aan, dan staan ze er weer.
  const useNums = teamUsesNumbers(editingTeam);
  const rowCols = useNums ? '56px 1fr 1fr auto' : '1fr 1fr auto';
  const rows = editingTeam.players.map((p, i) => `
    <div class="pirow" style="grid-template-columns:${rowCols}">
      ${useNums ? `<input type="number" placeholder="Rugnr" value="${esc(p.number)}" onchange="editingTeam.players[${i}].number=this.value" inputmode="numeric" aria-label="Rugnummer">` : ''}
      <input type="text" placeholder="Voornaam" value="${esc(pFirstName(p))}" oninput="editingTeam.players[${i}].firstName=this.value" autocomplete="off">
      <input type="text" placeholder="Familienaam" value="${esc(pLastName(p))}" oninput="editingTeam.players[${i}].lastName=this.value" autocomplete="off">
      <button class="delbtn" onclick="teamDelPlayer(${i})">×</button>
    </div>
    <div class="pirow2" style="grid-template-columns:1fr;margin-bottom:12px">
      <select onchange="teamPosChange(${i},this.value)"><option value="">Voorkeurspositie…</option>${posKeys.map(k => `<option value="${esc(k)}" ${normPos(p.pos)===k?'selected':''}>${esc(k)}</option>`).join('')}</select>
    </div>
    <div class="pirow2" id="team-side-fg-${i}" style="grid-template-columns:1fr;margin-bottom:12px;${teamSideRowHtml(i, p)?'':'display:none'}">
      ${teamSideRowHtml(i, p)}
    </div>`).join('');
  const colHead = `<div style="display:grid;grid-template-columns:${useNums ? '56px 1fr 1fr 38px' : '1fr 1fr 38px'};gap:6px;font-size:11px;font-weight:700;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${useNums ? '<span>Rugnr</span>' : ''}<span>Voornaam</span><span>Familienaam</span><span></span></div>`;
  const numToggle = `<label class="chkrow" style="margin-bottom:10px"><input type="checkbox" ${useNums ? 'checked' : ''} onchange="teamToggleNumbers(this.checked)"> Vaste rugnummers gebruiken</label>
    <p style="font-size:11px;color:var(--txt2);margin:-4px 0 12px">${useNums
      ? 'Zet dit uit als je ploeg geen vaste rugnummers heeft. De nummers verdwijnen dan uit de app; per wedstrijd kan je er nog altijd één invullen.'
      : 'Er staan nergens rugnummers. Wil je er voor één wedstrijd toch, dan vul je ze in bij de selectie van die wedstrijd.'}</p>`;
  // Trainers en ploegverantwoordelijken: zoveel rijen als je wil. Er staat er altijd minstens één,
  // ook al is die leeg — anders zie je bij een nieuwe ploeg geen enkel invulveld.
  const staffRows = (soort, namen, enkel) => {
    const lijst = namen.length ? namen : [''];
    return lijst.map((naam, i) => `<div class="fg" style="margin-bottom:8px"><label>${enkel} ${i+1}${i > 0 ? ' (optioneel)' : ''}</label>
      <div style="display:flex;gap:6px;align-items:center">
        <input type="text" placeholder="Naam ${enkel.toLowerCase()}" value="${esc(naam)}" oninput="setStaffName('${soort}',${i},this.value)" autocomplete="off">
        ${lijst.length > 1 ? `<button class="delbtn" style="flex:none" onclick="delStaffName('${soort}',${i})" aria-label="Verwijderen">×</button>` : ''}
      </div></div>`).join('');
  };
  const trainerRows = staffRows('trainers', staffNames('trainers'), 'Trainer')
    + `<button class="btn btn-pale btn-sm" onclick="addStaffName('trainers')">+ Nog een trainer</button>`;
  const respRows = staffRows('responsible', staffNames('responsible'), 'Ploegverantwoordelijke')
    + `<button class="btn btn-pale btn-sm" onclick="addStaffName('responsible')">+ Nog een ploegverantwoordelijke</button>`;
  const dmt = MATCH_TYPES[editingTeam.defaultMatchType] ? editingTeam.defaultMatchType : '8v8';
  const dForms = FORMATIONS[dmt] || [];
  const dfName = dForms.some(f => f.name === editingTeam.defaultFormation) ? editingTeam.defaultFormation : (dForms[0] ? dForms[0].name : '');
  const dpk = PERIOD_TYPES[editingTeam.defaultPeriodKey] ? editingTeam.defaultPeriodKey : 'kwarten';
  const ddur = Number(editingTeam.defaultQuarterDuration) > 0 ? Number(editingTeam.defaultQuarterDuration) : (DUR_DEFAULT[dpk] || 15);
  // Het potlood staat hier GROEN: dat is de toestand "bewerken staat aan" (Tim, 23-08-2026). In het
  // overzicht is het grijs en zet je het aan; hier zegt het dat je aan het bewerken bent, en met één
  // tik ben je klaar. Bij een nieuwe ploeg niet: daar is er nog geen overzicht om naar terug te keren,
  // en de terugpijl sluit dan het hele scherm.
  return `<div class="hdr"><button class="back" onclick="${editingTeam.isNew ? 'closeTeamEdit()' : 'toggleTeamEditMode()'}">‹</button><h1>Ploeg bewerken</h1>${editingTeam.isNew ? '' : `<button class="lc-btn" onclick="toggleTeamEditMode()" aria-label="Klaar met bewerken" title="Klaar met bewerken" style="background:var(--grn);color:#fff;border-color:var(--grn)">${icI(IC.edit)}</button>`}</div>
  <div class="content">
    <div class="card">
      <div class="fg"><label>Ploegnaam</label>${(cloudReady && !editingTeam.isNew)
        ? `<input id="t-name" value="${esc(editingTeam.name)}" autocomplete="off" readonly style="opacity:.65;cursor:not-allowed;background:var(--bg2,rgba(0,0,0,.04))"><div style="font-size:12px;color:var(--txt2);margin-top:4px">De ploegnaam wijzig je met <b>"Naam wijzigen"</b>, onderaan het ploegscherm.</div>`
        : `<input id="t-name" value="${esc(editingTeam.name)}" oninput="editingTeam.name=this.value" placeholder="bv. U10IP" autocomplete="off">`}</div>
    </div>
    <div class="sec">Ploegverantwoordelijken</div>
    <div class="card">${respRows}</div>
    <div class="sec">Standaard voor nieuwe wedstrijden</div>
    <div class="card">
      <div class="fg"><label>Standaard wedstrijdvorm</label><select onchange="teamFormatChange(this.value)">${Object.keys(MATCH_TYPES).map(k => `<option value="${k}" ${k===dmt?'selected':''}>${k}</option>`).join('')}</select></div>
      <div class="fg"><label>Standaard opstelling</label><select onchange="editingTeam.defaultFormation=this.value">${dForms.map(f => `<option value="${esc(f.name)}" ${f.name===dfName?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div>
      ${/* Aantal blokken en blokduur horen hier net zo goed thuis als de vorm: een U8 speelt geen
           4x15. Stond tot v0.45.0 vast in de wizard, waardoor je het bij élke wedstrijd van elke
           ploeg opnieuw moest bijstellen. */ ''}
      <div class="fg"><label>Standaard aantal blokken</label><select onchange="teamPeriodChange(this.value)">${Object.keys(PERIOD_TYPES).map(k => `<option value="${k}" ${k===dpk?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
      ${/* Zelfde keuzelijst als in de wizard, mét "Vrij...": bij delen staan enkel 15 en 20 in de
           vaste lijst, dus zonder vrije invoer kon je 3 x 10 niet als standaard zetten terwijl dat per
           wedstrijd wél kon. durOptsHtml/readDur komen uit wizard-prep.js — dat bestand laadt later,
           maar deze aanroep gebeurt pas bij het tekenen, dus dat is veilig (zie CLAUDE.md). */ ''}
      <div class="fg" style="margin-bottom:0"><label>Standaard duur per blok</label>
        <select id="t-dur" onchange="teamDurChange()">${durOptsHtml(dpk, ddur)}</select>
        <input id="t-dur-custom" type="number" min="1" max="60" inputmode="numeric" placeholder="minuten per blok"
          value="${ddur}" oninput="teamDurCustom(this.value)" style="margin-top:6px;${(DURATIONS[dpk] || []).includes(ddur) ? 'display:none' : ''}"></div>
      <p style="font-size:12px;color:var(--txt2);margin:8px 0 0">Staat klaar bij een nieuwe wedstrijd en bij het inlezen van een kalender; je kan het per wedstrijd nog aanpassen.</p>
    </div>
    ${/* De koppeling met de ploeg bij de voetbalbond. Staat in import-cal.js, bij de kalenderimport
         die er iets mee doet. Dat bestand laadt ná dit bestand, maar deze aanroep gebeurt pas bij
         het tekenen — dus na het laden van alles. Zelfde constructie als durOptsHtml hierboven. */''}
    ${rbfaTeamSectieHtml(editingTeam)}
    <div class="sec">Trainers</div>
    <div class="card">${trainerRows}</div>
    <div class="sec">Spelers (${editingTeam.players.length})</div>
    ${teamDelUndoHtml()}
    ${numToggle}
    ${useNums ? (() => { const nums = editingTeam.players.map(p => (p.number || '').trim()).filter(Boolean); const dup = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))]; return dup.length ? `<div class="backup-banner" style="background:var(--rdp);color:var(--rd);border-color:#fca5a5">${icI(IC.warn)} Dubbel rugnummer: ${dup.map(esc).join(', ')}</div>` : ''; })() : ''}
    ${editingTeam.players.length > 1 ? (useNums
      ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px"><button class="btn btn-gray btn-sm" onclick="teamSortPlayers('nr')">↕ Sorteer op nr</button><button class="btn btn-gray btn-sm" onclick="teamSortPlayers('name')">↕ Sorteer op naam</button></div>`
      : `<button class="btn btn-gray btn-sm" style="margin-bottom:8px" onclick="teamSortPlayers('name')">↕ Sorteer op naam</button>`) : ''}
    <div class="card">${editingTeam.players.length ? colHead : ''}<div id="t-rows">${rows || '<p style="color:var(--txt2);font-size:13px;text-align:center;padding:6px 0">Nog geen spelers.</p>'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <button class="btn btn-pale btn-sm" onclick="teamAddPlayer()">+ Speler</button>
        <button class="btn btn-pale btn-sm" onclick="teamPasteModal()">${icI(IC.clipboard)} Lijst plakken</button>
      </div></div>
    <button class="btn btn-green" onclick="saveTeamEdit()">${icI(IC.check)}Ploeg opslaan</button>
    ${(editingTeam.isNew || cloudReady) ? '' : `<div class="danger"><button class="btn btn-red" onclick="deleteTeamConfirm()">${icI(IC.trash)} Ploeg verwijderen</button></div>`}
  </div>`;
}
// Vinkje "Vaste rugnummers gebruiken". Volledige herrender, want de kolomindeling van élke
// spelersrij verandert mee. De ingevulde nummers blijven staan (niet wissen: omkeerbaar).
function teamToggleNumbers(aan) { editingTeam.useNumbers = !!aan; render(); }
// Standaard opstelling volgt de gekozen wedstrijdvorm in de ploeg-editor.
function teamFormatChange(val) {
  editingTeam.defaultMatchType = MATCH_TYPES[val] ? val : '8v8';
  const forms = FORMATIONS[editingTeam.defaultMatchType] || [];
  editingTeam.defaultFormation = forms[0] ? forms[0].name : '';
  render();
}
// Het aantal blokken bepaalt welke duurtijden er te kiezen zijn (een helft van 10 minuten bestaat
// niet), dus bij een wijziging valt de duur terug op de standaard van die soort.
function teamPeriodChange(val) {
  editingTeam.defaultPeriodKey = PERIOD_TYPES[val] ? val : 'kwarten';
  editingTeam.defaultQuarterDuration = DUR_DEFAULT[editingTeam.defaultPeriodKey] || 15;
  render();
}
// "Vrij..." (waarde 0) toont het invoervakje; een gewone keuze zet de duur meteen.
function teamDurChange() {
  const s = document.getElementById('t-dur'); if (!s) return;
  const inp = document.getElementById('t-dur-custom');
  if (s.value === '0') { if (inp) { inp.style.display = ''; inp.focus(); inp.select(); } return; }
  if (inp) inp.style.display = 'none';
  editingTeam.defaultQuarterDuration = parseInt(s.value) || 15;
}
function teamDurCustom(v) {
  const n = parseInt(v);
  if (n > 0 && n <= 60) editingTeam.defaultQuarterDuration = n;
}
// Geen automatisch volgnummer meer (v0.55.0): een nieuwe speler kreeg stilzwijgend nummer N+1 mee,
// óók als de rugnummers uitstonden — zette je ze later aan, dan stond de hele lijst op 1, 2, 3…
// alsof dat echte rugnummers waren. Het vakje blijft leeg; wie vaste nummers gebruikt, vult ze zelf.
function teamAddPlayer() { editingTeam.players.push({ id: uid(), globalId: uid(), firstName: '', lastName: '', name: '', number: '', pos: '' }); render(); }
// Een speler uit de lijst halen is één tik op een klein kruisje, tussen twee tekstvelden, op een
// telefoon. Dat gaat mis. De verwijderde regels blijven daarom op een stapeltje staan zolang je in
// dit scherm bent, zodat je ze op hun oude plaats kan terugzetten — ook meerdere na elkaar.
// Persoonsgegevens blijven hier bewust in het geheugen: niets van dit stapeltje wordt weggeschreven.
let teamDelUndo = [];
function teamDelPlayer(i) {
  const p = editingTeam.players[i];
  if (p) teamDelUndo.push({ i, p });
  editingTeam.players.splice(i, 1);
  render();
}
function teamDelUndoLaatste() {
  const laatste = teamDelUndo.pop();
  if (!laatste) return;
  // Op de oorspronkelijke plaats terug, tenzij de lijst intussen korter is dan die plek.
  const pos = Math.min(laatste.i, editingTeam.players.length);
  editingTeam.players.splice(pos, 0, laatste.p);
  render();
}
function teamDelUndoHtml() {
  if (!teamDelUndo.length) return '';
  const laatste = teamDelUndo[teamDelUndo.length - 1].p;
  const naam = (pFirstName(laatste) + ' ' + pLastName(laatste)).trim() || laatste.name || 'Speler';
  return `<div class="nudge" style="margin-bottom:12px">${icI(IC.history)} <b>${esc(naam)}</b> verwijderd${teamDelUndo.length > 1 ? ` (en ${teamDelUndo.length - 1} ${teamDelUndo.length === 2 ? 'andere' : 'andere'})` : ''}.
    Nog niets opgeslagen — je kan dit terugzetten.
    <button class="btn btn-orgpale btn-sm" style="margin-top:8px;width:100%" onclick="teamDelUndoLaatste()">Ongedaan maken</button></div>`;
}
function teamSortPlayers(by) {
  editingTeam.players.sort((a, b) => {
    if (by === 'nr') { const na = parseInt(a.number) || 999, nb = parseInt(b.number) || 999; return na - nb; }
    // Op FAMILIENAAM, met de voornaam als tiebreaker. Sorteerde voordien op voornaam, wat niet is
    // wat je van "sorteer op naam" verwacht in een spelerslijst.
    return (pLastName(a) + ' ' + pFirstName(a)).localeCompare(pLastName(b) + ' ' + pFirstName(b), 'nl');
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
// Een speler hernoemen in het rooster moet doorwerken in wat er al bestaat. Een wedstrijd bewaart
// namelijk zijn eigen kopie van de naam (m.players[].name) — dat is bewust, want een gastspeler of
// iemand die de ploeg intussen verliet heeft geen rooster meer om op terug te vallen. Bij een
// naamCORRECTIE is die kopie echter gewoon fout, en dan hoort ze overal mee te veranderen.
// Enkel de naam: rugnummers en posities mogen per wedstrijd afwijken en blijven dus staan.
// `opties.enkelGepland` beperkt de correctie tot wedstrijden die nog niet begonnen zijn, en laat de
// tornooiselecties ongemoeid. Dat is de stand waarin applyCloudTeams deze functie aanroept: een
// naamcorrectie die van een ánder toestel binnenkomt (zie de uitleg daar). Een gespeelde wedstrijd
// herschrijven vanuit een achtergrondgebeurtenis is een zwaardere ingreep dan daar past; wie de naam
// zelf typt, krijgt via saveTeamEdit nog altijd de volledige correctie.
async function hernoemSpelerInGegevens(hernoemd, opties) {
  if (!hernoemd.length) return 0;
  const enkelGepland = !!(opties && opties.enkelGepland);
  const opId = new Map(hernoemd.map(h => [h.id, h.naam]));
  const opGlobal = new Map(hernoemd.filter(h => h.globalId).map(h => [h.globalId, h.naam]));
  const nieuweNaam = (rosterId, globalId) => (rosterId && opId.get(rosterId)) || (globalId && opGlobal.get(globalId)) || null;
  let aantal = 0;
  const alle = await dbAll();
  for (const m of alle) {
    if (enkelGepland && m.status !== 'planned') continue;
    let raak = false;
    (m.players || []).forEach(p => {
      const n = nieuweNaam(p.rosterId, p.globalId);
      if (n && p.name !== n) { p.name = n; raak = true; }
    });
    // Wie als niet-beschikbaar genoteerd staat, staat er enkel met zijn naam in.
    (m.absentPlayers || []).forEach(a => {
      if (typeof a === 'string') return;   // heel oude vorm zonder rosterId: niets om op te matchen
      const n = nieuweNaam(a.rosterId, a.globalId);
      if (n && a.name !== n) { a.name = n; raak = true; }
    });
    if (raak) { await dbSave(m); aantal++; }
  }
  // Ook de tornooiselecties dragen namen mee (zie tournamentSquadList). Per tornooi opslaan met
  // saveTournament: saveTournaments() schrijft bewust enkel lokaal en zou de correctie dus niet
  // naar de andere toestellen brengen.
  if (!enkelGepland) getTournaments().forEach(t => {
    const sq = t && t.squad; if (!sq) return;
    let raak = false;
    [sq.players, sq.base, sq.bench, sq.absent].forEach(lijst => {
      (lijst || []).forEach(s => {
        const n = nieuweNaam(s.srcId, s.globalId);
        if (n && s.name !== n) { s.name = n; raak = true; }
      });
    });
    if (raak) saveTournament(t);
  });
  return aantal;
}
// ---------------------------------------------------------------------------------------------
// DEZELFDE JONGEN TWEE KEER OPVANGEN
// ---------------------------------------------------------------------------------------------
// Een speler bijzetten deed tot nu toe geen enkele controle: elke rij kreeg een verse `id` én een
// verse `globalId`. Stond diezelfde jongen al in de kern van een andere ploeg van de club, dan waren
// dat voor de app twee verschillende personen — en zijn loopbaanoverzicht in het spelerdetail, dat
// op `globalId` werkt, bleef leeg. Op 30-08-2026 bleken Oscar Jones, Noa Duvinage en Matteo Van
// Glabeke alle drie zo verdubbeld.
//
// De controle draait bij het OPSLAAN van de ploeg, niet bij het tikken op "+ Speler": op dat moment
// is er nog geen naam om iets mee te vergelijken. Het is meteen ook de enige plek waar de geplakte
// lijst langskomt, en dáár levert het het meeste op — twintig namen in één beweging.
//
// Het is een WAARSCHUWING, geen slot: "toch een andere speler" staat altijd in de keuzelijst.
// Hoe streng er vergeleken wordt, staat bij naamLijktOp in core.js.
let dubbelSt = null;   // { clean, hernoemd, items, keuze } zolang het venster openstaat
let dubbelBezig = false;

// Waar kan dezelfde jongen al staan? In deze kern, in de kern van een zusterploeg, en in de
// wedstrijden op dit toestel (daar zitten de losse en de gastspelers).
//
// WAARSCHUWEN DOEN WE OVER ÁLLE WEDSTRIJDEN, RECHTZETTEN ENKEL IN DIE VAN DEZE PLOEG. De reden is
// dwingend: dbSave() duwt een wedstrijd altijd naar het pad van de ACTIEVE ploeg (zie
// cloudOnLocalMatchSave in core.js), en op dit toestel staan ook de wedstrijden van elke andere
// ploeg die hier ooit geopend is. Een wedstrijd van een andere ploeg terugschrijven zou haar dus
// naar de verkeerde ploeg verhuizen. Lezen is ongevaarlijk, schrijven niet — vandaar de grendel
// onderaan in dubbelKoppelWedstrijden, die het los van deze filter nog eens nakijkt.
async function dubbelBronnen() {
  let zusters = [];
  try { zusters = await clubZusterPloegen(); } catch (e) { zusters = []; }
  let wedstrijden = [];
  try { wedstrijden = (await dbAll()).filter(Boolean); } catch (e) { wedstrijden = []; }
  return { zusters, wedstrijden };
}
// Hoort deze wedstrijd bij de kern die je aan het bewerken bent? Een wedstrijd draagt het id van de
// SPELERSKERN, niet dat van de ploeg (zie showPloegExport in views-account.js) — en `kern.id` is
// precies dat id. Wedstrijden van vóór dat veld vallen terug op de naam.
function dubbelEigenWedstrijd(m, kern) {
  if (!m || !kern) return false;
  return m.teamId ? m.teamId === kern.id : (!!m.teamName && m.teamName === kern.name);
}
function dubbelWedstrijdLabel(m) {
  const dag = m.date ? m.date.split('-').reverse().slice(0, 2).join('/') : '';
  return (m.opponent || 'wedstrijd') + (dag ? ' · ' + dag : '');
}
function dubbelWedLijst(waar) {
  const namen = [...new Set(waar.map(w => w.wedstrijd))];
  const kop = namen.slice(0, 2).join(', ') + (namen.length > 2 ? ' en ' + (namen.length - 2) + ' andere' : '');
  return `${namen.length === 1 ? 'de wedstrijd' : namen.length + ' wedstrijden'} (${kop})`;
}
function dubbelWedZin(g) {
  const wat = g.herkomst === 'Losse speler' ? 'staat als losse speler'
    : g.herkomst ? 'staat als gast · ' + g.herkomst
    : 'stond in de selectie';
  const eigen = g.waar.filter(w => w.eigen), elders = g.waar.filter(w => !w.eigen);
  const delen = [];
  if (eigen.length) delen.push('in ' + dubbelWedLijst(eigen) + ' van deze ploeg');
  if (elders.length) delen.push('in ' + dubbelWedLijst(elders) + ' van ' + [...new Set(elders.map(w => w.ploeg))].join(', '));
  return wat + ' ' + delen.join(', en ');
}
// `nieuw` zijn de spelers die er nu bijkomen, `bestaand` de kern zoals ze al was. Geeft per nieuwe
// speler terug waar hij al lijkt te staan — of niets, en dan slaat de app gewoon op.
async function dubbelsZoeken(nieuw, bestaand, kern) {
  if (!nieuw.length) return [];
  const { zusters, wedstrijden } = await dubbelBronnen();
  const kernIds = new Set(bestaand.map(p => p.id).filter(Boolean));
  const kernGlobals = new Set(bestaand.map(p => p.globalId).filter(Boolean));
  // Uit de wedstrijden van DEZE ploeg: iedereen die meespeelde zonder in haar kern te staan —
  // gasten, losse spelers, en wie ooit uit de kern gehaald is.
  // Uit die van een ANDERE ploeg: enkel de gasten en de losse spelers. Haar gewone spelers vind je
  // al via haar kern, en die dubbel opnoemen maakt er alleen ruis van.
  // Per persoon gebundeld: een losse speler die in vijf wedstrijden staat is één keuze, en koppelen
  // doen we dan meteen in alle vijf.
  const groepen = new Map();
  wedstrijden.forEach(m => {
    const eigen = dubbelEigenWedstrijd(m, kern);
    (m.players || []).forEach(p => {
      if (!p || !p.name || !p.id) return;
      if (!eigen && !p.guest) return;
      if (p.rosterId && kernIds.has(p.rosterId)) return;
      if (p.globalId && kernGlobals.has(p.globalId)) return;
      const sleutel = (eigen ? 'e:' : 'a:') + (p.rosterId || ('naam:' + naamNorm(p.name)));
      let g = groepen.get(sleutel);
      if (!g) { g = { naam: p.name, herkomst: p.guest ? (p.fromName || '') : '', waar: [] }; groepen.set(sleutel, g); }
      g.waar.push({ matchId: m.id, playerId: p.id, wedstrijd: dubbelWedstrijdLabel(m), eigen, ploeg: eigen ? '' : (m.teamName || 'een andere ploeg') });
    });
  });
  const alleGroepen = [...groepen.values()];
  const uit = [];
  nieuw.forEach((np, k) => {
    const kernTreffers = [];
    bestaand.forEach(p => { if (naamLijktOp(p.name, np.name)) kernTreffers.push({ naam: p.name, waar: 'staat al in deze kern' }); });
    // Ook de nieuwe rijen onderling: twee keer dezelfde lijst plakken is zo gebeurd.
    nieuw.slice(0, k).forEach(p => { if (naamLijktOp(p.name, np.name)) kernTreffers.push({ naam: p.name, waar: 'staat hierboven nog een keer in je lijst' }); });
    zusters.forEach(t => (t.players || []).forEach(p => { if (naamLijktOp(p.name, np.name)) kernTreffers.push({ naam: p.name, waar: 'staat in de kern van ' + (t.name || 'een andere ploeg') }); }));
    const wedTreffers = alleGroepen.filter(g => naamLijktOp(g.naam, np.name));
    if (kernTreffers.length || wedTreffers.length) uit.push({ speler: np, kernTreffers, wedTreffers });
  });
  return uit;
}
function dubbelKies(i, val) { if (dubbelSt) dubbelSt.keuze[i] = val; }
// De keuze die klaarstaat. Die moet altijd ook ECHT in de keuzelijst staan, anders toont het venster
// iets anders dan wat er zou gebeuren. Staat hij al in een kern: niet toevoegen.
// Anders koppelen aan de eerste wedstrijd van DEZE ploeg waar hij in staat. Vindt hij er geen — hij
// staat enkel bij een andere ploeg — dan valt hij terug op gewoon toevoegen.
function dubbelStandaardKeuze(it) {
  if (it.kernTreffers.length) return 'weg';
  const j = it.wedTreffers.findIndex(g => g.waar.some(w => w.eigen));
  return j >= 0 ? 'koppel:' + j : 'nieuw';
}
function dubbelTerug() { dubbelSt = null; closeModal(); }
function dubbelVenster() {
  const kaarten = dubbelSt.items.map((it, i) => {
    const regels = it.kernTreffers.map(t => `<li><b>${esc(t.naam)}</b> — ${esc(t.waar)}</li>`)
      .concat(it.wedTreffers.map(g => `<li><b>${esc(g.naam)}</b> — ${esc(dubbelWedZin(g))}</li>`)).join('');
    // Welke keuze klaarstaat, bepaalt dubbelStandaardKeuze — houd die twee gelijk.
    // Koppelen kan ALLEEN in een wedstrijd van deze ploeg — zie de uitleg bij dubbelBronnen.
    const opties = [];
    if (it.kernTreffers.length) opties.push({ v: 'weg', t: 'Niet toevoegen — het is dezelfde speler' });
    it.wedTreffers.forEach((g, j) => {
      const eigen = g.waar.filter(w => w.eigen);
      if (!eigen.length) return;
      opties.push({ v: 'koppel:' + j, t: `Toevoegen en koppelen aan ${g.naam} (${eigen.length} wedstrijd${eigen.length === 1 ? '' : 'en'})` });
    });
    if (!it.kernTreffers.length) opties.push({ v: 'weg', t: 'Toch niet toevoegen' });
    opties.push({ v: 'nieuw', t: 'Toch toevoegen — het is een andere speler' });
    const gekozen = dubbelSt.keuze[i];
    // Staat hij enkel in wedstrijden van een ANDERE ploeg, dan valt er niets recht te zetten — hier
    // niet, en daar evenmin (Tims twee vragen, 30-08-2026). Het bewerkmenu van een afgewerkte
    // wedstrijd kent geen manier om een losse speler alsnog aan een speler te hangen: "Selectie
    // aanpassen" haalt er enkel iemand uit die niets deed.
    // Hier stond even "zet hem dan ook in de kern van die ploeg". Dat was FOUT ADVIES: één speler
    // hoort in één kern, en hem in twee kernen zetten is exact de dubbele identiteit die dit venster
    // moet tegenhouden. Andersom is het net de bedoeling dat hij daar als GAST opgeroepen wordt, en
    // dat kan pas nu — want vanaf deze opslag bestaat hij in een kern.
    // De melding zegt daarom enkel wat het is, en waarschuwt uitdrukkelijk tegen die tweede kern.
    const enkelElders = it.wedTreffers.length && !it.wedTreffers.some(g => g.waar.some(w => w.eigen));
    return `<div class="card" style="border-left:4px solid var(--org);text-align:left;margin-bottom:10px">
      <div style="font-weight:700;margin-bottom:5px">${esc(it.speler.name)}</div>
      <ul style="margin:0 0 9px 17px;padding:0;font-size:13px;color:var(--txt2);line-height:1.5">${regels}</ul>
      ${enkelElders ? `<p style="font-size:12px;color:var(--txt2);margin:-4px 0 9px">Dat is een wedstrijd van een andere ploeg. Die blijft zo staan — daar valt niets meer aan recht te zetten. Voeg hem hier gewoon toe, maar zet hem <b>niet</b> ook nog eens in de kern van die ploeg: één speler hoort in één kern, en vanaf nu kan die ploeg hem als gast oproepen.</p>` : ''}
      <select onchange="dubbelKies(${i}, this.value)" style="font-size:13px">
        ${opties.map(o => `<option value="${esc(o.v)}" ${o.v === gekozen ? 'selected' : ''}>${esc(o.t)}</option>`).join('')}
      </select>
    </div>`;
  }).join('');
  const n = dubbelSt.items.length;
  openModal(`<h3>${icI(IC.warn)} ${n === 1 ? 'Deze speler bestaat misschien al' : 'Deze spelers bestaan misschien al'}</h3>
    <p style="color:var(--txt2);font-size:13px;margin-bottom:12px">Zet je dezelfde jongen twee keer in de app, dan ziet ze hem als twee verschillende spelers en blijft zijn overzicht per ploeg leeg. Kies per speler wat er moet gebeuren.</p>
    ${kaarten}
    <button class="btn btn-green" onclick="dubbelDoorgaan()">${icI(IC.check)}Ploeg opslaan</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="dubbelTerug()">Terug naar de lijst</button>`);
}
// De wedstrijdinvoer aan de nieuwe speler hangen: enkel `rosterId` en `globalId`. `guest`/`fromName`
// blijven bewust staan — dat zegt iets over die dag (hij speelde toen als gast mee) en dat mag een
// latere toevoeging aan de kern niet met terugwerkende kracht herschrijven.
async function dubbelKoppelWedstrijden(koppelingen, kern) {
  let aantal = 0;
  for (const k of koppelingen) {
    const perWedstrijd = new Map();
    k.waar.forEach(w => { if (!w.eigen) return; if (!perWedstrijd.has(w.matchId)) perWedstrijd.set(w.matchId, []); perWedstrijd.get(w.matchId).push(w.playerId); });
    for (const [matchId, ids] of perWedstrijd) {
      let m = null;
      try { m = await dbGet(matchId); } catch (e) { m = null; }
      if (!m || !Array.isArray(m.players)) continue;
      // DE GRENDEL. Los van alle filters hierboven: enkel een wedstrijd van DEZE ploeg mag hier
      // weggeschreven worden. dbSave() zet een wedstrijd altijd bij de actieve ploeg, dus die van
      // een andere ploeg zou hier van ploeg verspringen. Vandaar deze controle vlak vóór de pen.
      if (!dubbelEigenWedstrijd(m, kern)) continue;
      let raak = false;
      m.players.forEach(p => {
        if (ids.indexOf(p.id) < 0) return;
        p.rosterId = k.speler.id;
        p.globalId = k.speler.globalId || null;
        raak = true;
      });
      if (!raak) continue;
      try {
        // Firebase bewaart geen lege lijst, dus een geplande wedstrijd kan uit de cloud terugkomen
        // zónder `events`. Dan gewoon opslaan: er valt niets te herrekenen.
        if (Array.isArray(m.events)) { recomputeScore(m); recomputeOnField(m); }
        await dbSave(m); aantal++;
      } catch (e) {}
    }
  }
  return aantal;
}
async function dubbelDoorgaan() {
  if (!dubbelSt) { closeModal(); return; }
  const st = dubbelSt;
  const weg = new Set(), koppelingen = [];
  st.items.forEach((it, i) => {
    const keuze = st.keuze[i] || 'nieuw';
    if (keuze === 'weg') { weg.add(it.speler.id); return; }
    if (keuze.indexOf('koppel:') === 0) {
      const g = it.wedTreffers[parseInt(keuze.slice(7), 10)];
      // Enkel de wedstrijden van deze ploeg; die van een andere ploeg zijn hier alleen ter info.
      const eigen = g ? g.waar.filter(w => w.eigen) : [];
      if (eigen.length) koppelingen.push({ speler: it.speler, waar: eigen });
    }
  });
  st.clean.players = st.clean.players.filter(p => !weg.has(p.id));
  dubbelSt = null;
  closeModal();
  await ploegWegschrijven(st.clean, st.hernoemd);
  const gekoppeld = koppelingen.length ? await dubbelKoppelWedstrijden(koppelingen, st.clean) : 0;
  const bericht = [];
  if (weg.size) bericht.push(`${weg.size} niet toegevoegd`);
  if (gekoppeld) bericht.push(`gekoppeld in ${gekoppeld} wedstrijd${gekoppeld === 1 ? '' : 'en'}`);
  if (bericht.length) showToast('Ploeg opgeslagen — ' + bericht.join(', ') + '.', 'ok');
}

async function saveTeamEdit() {
  if (dubbelBezig) return;   // twee keer tikken op Opslaan zou twee vensters openen
  if (!editingTeam.name.trim()) { showToast('Geef de ploeg een naam.', 'err'); return; }
  const eDmt = MATCH_TYPES[editingTeam.defaultMatchType] ? editingTeam.defaultMatchType : '8v8';
  const eDforms = FORMATIONS[eDmt] || [];
  const eDform = eDforms.some(f => f.name === editingTeam.defaultFormation) ? editingTeam.defaultFormation : (eDforms[0] ? eDforms[0].name : '');
  const clean = {
    id: editingTeam.id,
    name: editingTeam.name.trim(),
    // Meerdere ploegverantwoordelijken zitten komma-gescheiden in dit ene veld (zie staffList in
    // core.js): het datamodel blijft zo ongewijzigd. syncStaffToTeam hield het bij tijdens het typen.
    responsible: staffJoin(staffList(editingTeam.responsible)),
    defaultMatchType: eDmt,
    defaultFormation: eDform,
    // Blokken en blokduur enkel wegschrijven als ze geldig zijn; een ploeg zonder deze velden valt
    // in teamMatchDefaults terug op 4 kwarten van 15 minuten, zoals het vóór v0.45.0 vast stond.
    ...(PERIOD_TYPES[editingTeam.defaultPeriodKey] ? { defaultPeriodKey: editingTeam.defaultPeriodKey } : {}),
    ...(Number(editingTeam.defaultQuarterDuration) > 0 ? { defaultQuarterDuration: Number(editingTeam.defaultQuarterDuration) } : {}),
    // Enkel wegschrijven als het uitstaat: zo blijven bestaande ploegen (zonder dit veld) gewoon
    // rugnummers gebruiken, en blijft het object schoon voor wie ze wél gebruikt.
    ...(teamUsesNumbers(editingTeam) ? {} : { useNumbers: false }),
    // syncStaffToTeam hield editingTeam.trainers al bij tijdens het typen.
    trainers: (editingTeam.trainers || []).map(t => ({ id: t.id || uid(), name: (t.name || '').trim() })).filter(t => t.name),
    players: editingTeam.players.filter(p => (pFirstName(p) || pLastName(p) || '').trim()).map(p => {
      const fn = ((p.firstName !== undefined ? p.firstName : pFirstName(p)) || '').trim();
      const ln = ((p.lastName !== undefined ? p.lastName : pLastName(p)) || '').trim();
      // globalId blijft de speler identificeren over ploegen heen (bv. na een overzetting via
      // de eigenaarstool "Speler overzetten"); spelers van vóór die feature krijgen er hier
      // lazy alsnog één, zodat elke speler vanaf nu overzetbaar is.
      // normPos zet een oude waarde (de lijnnaam, van vóór v0.14) hier meteen om naar de nieuwe
      // positielijst; een kant/rol die niet bij de positie hoort valt weg.
      const pos = normPos(p.pos);
      return { id: p.id, globalId: p.globalId || uid(), firstName: fn, lastName: ln, name: (fn + ' ' + ln).trim() || p.name || '', number: p.number || '', pos, side: posSideValid(pos, p.side) ? p.side : '' };
    })
  };
  if (editingTeam.fromCloud) clean.fromCloud = true;
  // Wie is er hernoemd? Vergelijken vóór het opslaan, want daarna is de oude naam weg.
  const bestaandeKern = getTeamsV2().find(t => t.id === clean.id);
  const vorige = bestaandeKern ? (bestaandeKern.players || []) : [];
  const hernoemd = clean.players.map(np => {
    const op = vorige.find(x => x.id === np.id);
    return (op && (op.name || '').trim() !== (np.name || '').trim())
      ? { id: np.id, globalId: np.globalId, naam: np.name } : null;
  }).filter(Boolean);
  // Lijkt een van de nieuwe spelers op iemand die al bestaat? Dan eerst vragen (zie hierboven).
  // Faalt de opzoeking — geen net, geen rechten op de zusterploegen — dan slaat de app gewoon op:
  // dit is een hulp, geen voorwaarde.
  const bestaandeIds = new Set(vorige.map(p => p.id));
  const nieuweSpelers = clean.players.filter(p => !bestaandeIds.has(p.id) && (p.name || '').trim());
  if (nieuweSpelers.length) {
    let items = [];
    dubbelBezig = true;
    try { items = await dubbelsZoeken(nieuweSpelers, clean.players.filter(p => bestaandeIds.has(p.id)), clean); }
    catch (e) { items = []; }
    dubbelBezig = false;
    if (items.length) {
      dubbelSt = { clean, hernoemd, items, keuze: {} };
      items.forEach((it, i) => { dubbelSt.keuze[i] = dubbelStandaardKeuze(it); });
      dubbelVenster();
      return;
    }
  }
  await ploegWegschrijven(clean, hernoemd);
}
// Het eigenlijke wegschrijven van de ploeg. Apart, omdat de dubbelcontrole er een venster tussen
// kan schuiven en daarna hier verder moet. De lijst wordt hier OPNIEUW gelezen: tussen het openen
// van dat venster en het opslaan kan er een roostersnapshot van de cloud binnengekomen zijn.
async function ploegWegschrijven(clean, hernoemd) {
  const arr = getTeamsV2(); const idx = arr.findIndex(t => t.id === clean.id);
  // DE KOPPELING MET DE VOETBALBOND MEENEMEN. `clean` wordt hierboven veld per veld opgebouwd uit wat
  // op het scherm staat, en alles wat er niet in zit verdwijnt bij de regel hieronder (`arr[idx] =
  // clean` vervangt de ploeg volledig). Die koppeling wordt door haar eigen venster bewaard, dus
  // zonder deze twee regels wiste een gewone "Ploeg opslaan" de gekoppelde bondsploegen.
  // Uit de PAS GELEZEN lijst, niet uit editingTeam: tussen het openen van het scherm en het opslaan
  // kan dat venster de koppeling gewijzigd hebben, of kan er een roostersnapshot uit de cloud
  // binnengekomen zijn.
  if (idx >= 0) {
    const b = arr[idx] || {};
    if (Array.isArray(b.rbfaTeams) && b.rbfaTeams.length) clean.rbfaTeams = b.rbfaTeams;
    if (b.rbfaClubId) clean.rbfaClubId = b.rbfaClubId;
  }
  if (idx >= 0) arr[idx] = clean; else arr.push(clean);
  saveTeamsV2(arr); editingTeam = null; teamDelUndo = []; go(cloudReady ? 'home' : 'teams');
  if (hernoemd.length) {
    const n = await hernoemSpelerInGegevens(hernoemd);
    if (n) showToast(`Naam aangepast in ${n} wedstrijd${n === 1 ? '' : 'en'}.`, 'ok');
  }
}
function deleteTeamConfirm() {
  openModal(`<h3>Ploeg verwijderen?</h3><p style="text-align:center;color:var(--txt2);margin-bottom:16px">"${esc(editingTeam.name)}" en alle spelers worden verwijderd. Bestaande wedstrijden blijven behouden.</p>
    <button class="btn btn-red" onclick="doDeleteTeam()">${icI(IC.trash)} Ja, verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function doDeleteTeam() { saveTeamsV2(getTeamsV2().filter(t => t.id !== editingTeam.id)); editingTeam = null; closeModal(); go('teams'); }
// Trainers en ploegverantwoordelijken in de ploeg-editor. `soort` is 'trainers' (een lijst van
// {id,name} in het rooster) of 'responsible' (één komma-gescheiden tekst — zie staffList in
// core.js). Beide worden hier als een gewone namenlijst behandeld; wegschrijven gebeurt in
// saveTeamEdit, zodat een half ingevulde rij nooit blijft plakken.
// Tijdens het bewerken staan de namen in `editingTeam._staff`, inclusief een nog lege rij — die zou
// in de opslagvorm (een lijst zonder lege namen, of een komma-gescheiden tekst) meteen verdwijnen
// en dus wegvallen zodra het scherm hertekent. `_staff` wordt nooit bewaard: saveTeamEdit bouwt het
// ploegobject veld per veld op.
function staffNames(soort) {
  if (!editingTeam._staff) editingTeam._staff = {};
  if (!editingTeam._staff[soort]) {
    const uit = soort === 'trainers' ? teamTrainerNames(editingTeam) : teamResponsibleNames(editingTeam);
    editingTeam._staff[soort] = uit.length ? uit : [''];
  }
  return editingTeam._staff[soort];
}
// De ingevulde rijen meteen in het ploegobject zelf zetten (lege rijen vallen weg), zodat het
// overzichtsscherm hetzelfde toont als de editor — net zoals de spelersrijen dat al deden.
function syncStaffToTeam(soort) {
  const namen = staffNames(soort).map(n => n.trim()).filter(Boolean);
  if (soort === 'trainers') {
    const oud = editingTeam.trainers || [];
    // Bestaande id's op positie hergebruiken: een naamcorrectie mag geen nieuw trainer-id maken.
    editingTeam.trainers = namen.map((name, i) => ({ id: (oud[i] || {}).id || uid(), name }));
  } else {
    editingTeam.responsible = staffJoin(namen);
  }
}
function setStaffName(soort, i, val) {
  const namen = staffNames(soort);
  while (namen.length <= i) namen.push('');
  namen[i] = val;
  syncStaffToTeam(soort);
}
function addStaffName(soort) {
  const namen = staffNames(soort);
  // Een lege rij erbij zetten heeft geen zin zolang de laatste nog leeg is.
  if (namen.length && !namen[namen.length - 1].trim()) { showToast('Vul eerst de laatste naam in.', 'err'); return; }
  namen.push('');
  render();
}
function delStaffName(soort, i) {
  staffNames(soort).splice(i, 1);
  syncStaffToTeam(soort);
  render();
}

// ===================== TORNOOIEN =====================
// Hoort dit tornooi bij de ploeg die nu actief is? voetbal_tournaments is één globale
// localStorage-sleutel die bij een ploegwissel niet gewist wordt, dus zonder filter zag je in de
// lijst van ploeg B ook de tornooien van ploeg A — bewerkbaar, en bij opslaan belandde die data
// onder B (teamRef schrijft altijd naar de ACTIEVE ploeg). Op teamId en niet op teamName, want
// syncTeamNaming migreert de teamName van tornooien niet mee bij een hernoeming.
// In cloudmodus bevat getTeamsV2() enkel het rooster van de actieve ploeg, dus teamById() is daar
// precies de juiste test. Zonder cloud (meerdere ploegen lokaal) volgen we de bestaande
// homeFilter: 'all' betekent daar een bewuste keuze van de gebruiker om alles te zien.
function tournamentInActiveTeam(t) {
  if (!t) return false;
  // Een tornooi dat nooit in de cloud stond (zuiver lokaal aangemaakt, of net opgeslagen en de echo
  // is nog niet terug) hoort bij geen enkele cloudploeg. Dat blijft zichtbaar: onzichtbaar maken zou
  // het onbereikbaar maken, en dat is precies de fout die bij het verwijderen van een tornooi al eens
  // data onvindbaar maakte. Opslaan ervan blijft lokaal — cloudOnLocalTournamentSave blokkeert de
  // cloud-write en zegt dat ook.
  if (cloudReady && !t.fromCloud) return true;
  // Enkel verbergen wat aantoonbaar bij een ANDERE ploeg hoort. Een ouder cloudtornooi zonder
  // teamId is niet toe te wijzen; dat tonen we, want het kwam uit de node van een eigen ploeg en
  // verbergen zou het onbereikbaar maken.
  if (cloudReady) return !t.teamId || !!teamById(t.teamId);
  if (homeFilter === 'all') return true;
  const team = teamById(t.teamId);
  return !!(team && team.name === homeFilter);
}
function renderTournamentList() {
  const today = new Date().toISOString().split('T')[0];
  const all = getTournaments().filter(t => tournamentInActiveTeam(t) && trnZichtbaar(t)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const planned = all.filter(t => !tournamentClosed(t) && (!t.date || t.date >= today));
  const done    = all.filter(t => tournamentClosed(t) || (t.date && t.date < today)).reverse();
  const newBtn = canManage() ? `<button class="btn btn-green" onclick="newTournament()">${icI(IC.medal)} + Nieuw tornooi</button>` : '';
  const trnRow = (t, borderColor) => {
    const team = teamById(t.teamId);
    return `<div class="team-row" style="border-left-color:${borderColor}" onclick="goTournament('${t.id}')">
      <div>
        <div class="tn">${icI(IC.medal)} ${esc(t.name)}${trnIsConcept(t) ? ' <span class="ts-role viewer" style="vertical-align:middle">' + icI(IC.eyeOff) + 'Concept</span>' : ''}</div>
        <div class="tc">${t.date ? fmtDate(new Date(t.date + 'T00:00:00').getTime()) : ''}${t.location ? ' · ' + esc(t.location) : ''}${team ? ' · ' + esc(team.name) : ''}${tournamentClosed(t) ? ' · afgesloten' : ''}</div>
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

// ---------------------------------------------------------------------------------------------
// WAT HET TORNOOIPLAN OPLEVERT (Tim, 01-09-2026)
// ---------------------------------------------------------------------------------------------
// Per wedstrijd staat er een plan, maar over het tornooi heen zag je de verdeling nergens — en dat is
// juist waar het bij een tornooi om gaat: staat iedereen even vaak in de basis, en komt iedereen aan
// speeltijd. Eén tabel over alle wedstrijden die al ingegeven zijn, gespeeld of niet.
//
// GESPEELD EN GEPLAND BLIJVEN APART. Van een afgewerkte wedstrijd zijn de échte minuten bekend
// (calcMinutes); van een wedstrijd die nog moet komen is er enkel het plan (planSpeeltijd). Die twee in
// één getal gieten zou een plan als gemeten tijd laten lezen — precies wat Tim op 29-08-2026 uit de
// statistieken heeft laten halen. Ze staan dus naast elkaar, met het totaal erachter.
function trnPlanRijen(matches) {
  const per = new Map();
  // Sleutel over wedstrijden heen: de speler in de kern, met de naam als terugval voor een losse of
  // gastspeler. Binnen één tornooi komt iedereen uit dezelfde dagselectie, dus dit valt niet uiteen.
  const sleutel = p => p.rosterId || (p.name || '').trim().toLowerCase();
  // PER WEDSTRIJD ERBIJ (Tim, 01-09-2026). Alleen een totaal verbergt de spreiding: veertig minuten
  // over twee wedstrijden is iets anders dan veertig in één. De wedstrijden zijn genummerd in de
  // volgorde waarin ze gespeeld worden — `matches` komt al op datum en uur gesorteerd binnen.
  (matches || []).forEach((m, idx) => {
    const gespeeld = m.status === 'done';
    // `quarters` kan uit de cloud terugkomen als undefined (Firebase bewaart geen lege lijst), en
    // calcMinutes loopt daar stuk op zijn for-of. Dan is er gewoon niets gemeten.
    const mins = (gespeeld && Array.isArray(m.quarters)) ? calcMinutes(m) : null;
    const plan = gespeeld ? null : planSpeeltijd(m);
    (m.players || []).forEach(p => {
      if (!magOpHetVeld(m, p)) return;   // uitgesloten of niet aanwezig: geen speeltijd om te tellen
      const k = sleutel(p);
      if (!per.has(k)) per.set(k, { naam: (p.name || '').trim(), nummer: p.number || '', basis: 0, mee: 0, gespeeldMin: 0, geplandMin: 0, perWed: [] });
      const r = per.get(k);
      if (!r.naam && p.name) r.naam = p.name.trim();
      if (!r.nummer && p.number) r.nummer = p.number;
      r.mee++;
      if (p.starting) r.basis++;
      const min = gespeeld
        ? (mins ? Math.round(((mins[p.id] && mins[p.id].ms) || 0) / 60000) : 0)
        : Math.round((plan.perSpeler[p.id] || 0));
      if (gespeeld) r.gespeeldMin += min; else r.geplandMin += min;
      r.perWed.push({ nr: idx + 1, min, gespeeld, tegen: (m.opponent || '').trim(), tijd: (m.time || '').trim() });
    });
  });
  return [...per.values()]
    .map(r => Object.assign(r, { totaalMin: r.gespeeldMin + r.geplandMin, perWed: r.perWed.sort((a, b) => a.nr - b.nr) }))
    .sort((a, b) => b.totaalMin - a.totaalMin || b.basis - a.basis || a.naam.localeCompare(b.naam, 'nl'));
}
function trnPlanHtml(matches) {
  const rijen = trnPlanRijen(matches);
  if (!rijen.length) return '';
  const nGespeeld = (matches || []).filter(m => m.status === 'done').length;
  const nTeGaan = (matches || []).length - nGespeeld;
  const nWed = (matches || []).length;
  const rij = r => {
    const delen = [];
    if (nGespeeld) delen.push(`gespeeld <b>${r.gespeeldMin}'</b>`);
    if (nTeGaan) delen.push(`gepland <b>${r.geplandMin}'</b>`);
    if (nGespeeld && nTeGaan) delen.push(`samen <b>${r.totaalMin}'</b>`);
    // De wedstrijden op een rij, klein. Een geplande staat lichter dan een gespeelde — anders lees je
    // een plan als een uitslag. Het nummer is de volgorde van de dag; het uur en de tegenstander staan
    // in de tooltip, want daar is op deze regel geen plaats voor.
    const perWed = r.perWed.map(w => {
      const titel = `Wedstrijd ${w.nr}${w.tijd ? ' · ' + w.tijd : ''}${w.tegen ? ' · ' + w.tegen : ''}${w.gespeeld ? '' : ' · nog te spelen'}`;
      return `<span title="${esc(titel)}" style="${w.gespeeld ? '' : 'opacity:.6;'}white-space:nowrap"><span style="font-weight:700">${w.nr}</span> ${w.min}'</span>`;
    }).join('<span style="color:var(--bdr)"> | </span>');
    return `<div style="display:flex;align-items:baseline;gap:8px;padding:6px 0;border-bottom:1px solid var(--bdr)">
      <span style="flex:1;min-width:0;font-size:14px">${r.nummer ? `<span style="color:var(--txt2);font-size:12px">${esc(String(r.nummer))}</span> ` : ''}${esc(r.naam || 'Speler')}
        <br><small style="color:var(--txt2)">${delen.join(' · ')}</small>
        ${r.perWed.length > 1 ? `<br><small style="color:var(--txt2);font-size:11px">${perWed}</small>` : ''}</span>
      ${/* Mét noemer: "2 basis" zegt niet van hoeveel wedstrijden. `mee` is het aantal wedstrijden
           waarvoor hij beschikbaar in de selectie stond — dat kan minder zijn dan het totaal wanneer
           hij ergens als niet-aanwezig gemarkeerd staat. */ ''}
      <span class="ts-role ${r.basis ? 'admin' : 'viewer'}" style="flex-shrink:0">${r.basis}/${r.mee} basis</span>
    </div>`;
  };
  // Eén regel die zegt waar de cijfers over gaan, want "gepland" is geen gemeten tijd. Zelfde
  // voorbehoud als bij "Speeltijd volgens dit plan" op het planscherm.
  const uitleg = nTeGaan
    ? `Over de <b>${nWed}</b> ${nWed === 1 ? 'wedstrijd' : 'wedstrijden'} die je al ingaf${nGespeeld ? `, waarvan <b>${nGespeeld}</b> gespeeld` : ''}. De geplande minuten zijn een plan, niet de wedstrijd: geplande wissels gaan nooit vanzelf af.`
    : `Over de <b>${nWed}</b> gespeelde ${nWed === 1 ? 'wedstrijd' : 'wedstrijden'} van dit tornooi.`;
  return `<details class="card" style="margin-bottom:12px">
    <summary style="cursor:pointer;font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--txt2)">Speeltijd over het tornooi</summary>
    <p style="font-size:12px;color:var(--txt2);margin:8px 0 6px">${uitleg}</p>
    ${rijen.map(rij).join('')}
  </details>`;
}

// Zonder tornooi in het geheugen (bv. na een refresh op deze pagina) stond hier een kale regel
// "Niet gevonden." zonder hoofding: geen terugknop, dus een doodlopend scherm.
function trnNotFound(titel) {
  return `<div class="hdr"><button class="back" onclick="go('tournaments')">‹</button><h1>${icI(IC.medal)} ${titel}</h1></div>
    <div class="content"><div class="empty"><div class="ei">${IC.medal}</div><p>Dit tornooi is niet gevonden.<br>Ga terug naar de lijst en kies het opnieuw.</p>
      <button class="btn btn-green" style="margin-top:12px" onclick="go('tournaments')">Naar de tornooien</button></div></div>`;
}
function renderTournament() {
  const t = currentTournament;
  if (!t) return trnNotFound('Tornooi');
  // POORTWACHTER, niet enkel de lijst filteren. Een tornooi dat op concept gezet wordt, zit al in de
  // lokale opslag van de andere beheerders (het synchroniseert naar iedereen) — dus wie het scherm net
  // open had, of er via de terugknop op terugkomt, moet hier tegen een muur lopen. Zelfde reden als de
  // guards in go() voor importvv en importpsd.
  if (!trnZichtbaar(t)) return trnNotFound('Tornooi');
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
  // Zie matchResultaat in core.js: een gewonnen strafschoppenreeks telt als winst.
  const w = done.filter(m => matchResultaat(m) === 'W').length;
  const d = done.filter(m => matchResultaat(m) === 'G').length;
  const l = done.filter(m => matchResultaat(m) === 'V').length;
  const gf = done.reduce((s, m) => s + m.scoreUs, 0);
  const ga = done.reduce((s, m) => s + m.scoreThem, 0);
  const infoRows = [
    ['Ploeg', team ? team.name : (t.teamName || '')],
    ['Locatie', t.location],
    ['Wedstrijdduur', tournamentPeriodsLabel(t)],
    [trainerLabel(t.trainer), t.trainer],
    // Afgekort, zoals in het wedstrijddetail: voluit botst het label in deze smalle kolom tegen de
    // naam ernaast.
    ['Ploegverantw.', t.responsible],
    ['Eindstand', t.standing],
    // Enkel vermelden als de puntenverdeling afwijkt van de standaard 3/1/0, anders is het ruis.
    // Alles op 0 = er wordt niet op punten gespeeld; dan hoort er geen "0/0/0"-regel te staan.
    ['Punten', (!tournamentUsesPoints(t) || tournamentPointsLabel(t) === '3/1/0') ? '' : tournamentPointsLabel(t) + ' (' + tournamentPointsLegend(t) + ')'],
  ].filter(([, v]) => v).map(([k, v]) => `<div class="stat-row"><span style="color:var(--txt2);min-width:140px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('');
  // Selectie van de tornooidag. NB en "niet geselecteerd" gelden voor de hele dag en zijn dus
  // identiek voor elke wedstrijd: ze staan hier (en in het tornooiverslag), niet in elk
  // wedstrijdverslag apart. Namen staan als doorlopende, links uitgelijnde tekst onder elkaar —
  // rechts uitlijnen in een stat-row werkte niet voor lijsten die over meerdere regels lopen.
  const squadAll = tournamentSquadList(t);
  const sg = tournamentSelectionGroups(t);
  const squadRow = `<div class="stat-row"><span style="color:var(--txt2);min-width:140px">Selectie</span><span style="font-weight:600">${sg.mee.length} spelers${t.matchType?' · '+t.matchType:''}</span></div>`;
  const namesP = (label, arr) => arr.length
    ? `<p style="font-size:14px;line-height:1.6;margin-top:6px">${label ? `<span style="color:var(--txt2)">${label}</span> ` : ''}${esc(arr.map(nameWithNum).join(', '))}</p>`
    : '';
  // Vierde groep, zoals in het verslag: wie meeging maar tijdens een wedstrijd als niet aanwezig
  // gemarkeerd werd (naar huis, of nooit opgedaagd). Die stond hier niet, waardoor de tornooipagina
  // en het verslag een andere indeling gaven voor dezelfde dag.
  const noShowNamen = [...new Set(done.flatMap(m => (m.players || []).filter(p => p.absent).map(p => (p.name || '').trim())))]
    .filter(Boolean).sort((a, b) => _lastName(a).localeCompare(_lastName(b), 'nl'));
  const meeNietAanwezig = sg.mee.filter(s => noShowNamen.includes((s.name || '').trim()));
  const squadBlock = namesP('Geselecteerd:', sg.mee)
    + namesP('Geselecteerd maar niet aanwezig:', meeNietAanwezig)
    + namesP('Niet geselecteerd:', sg.notSelected) + namesP('Niet beschikbaar:', sg.absent);
  const cleanSheets = done.filter(m => m.scoreThem === 0).length;
  const statsHtml = done.length ? `<div class="card" style="margin-bottom:12px">
    <div class="stat-big">
      <div class="stat-box"><div class="v" style="color:var(--grn)">${w}</div><div class="l">Gewonnen</div></div>
      <div class="stat-box"><div class="v">${d}</div><div class="l">Gelijk</div></div>
      <div class="stat-box"><div class="v" style="color:var(--rd)">${l}</div><div class="l">Verloren</div></div>
      <div class="stat-box"><div class="v">${gf}–${ga}</div><div class="l">Doelpunten</div></div>
      ${cleanSheets ? `<div class="stat-box"><div class="v">${cleanSheets}</div><div class="l">Nul gehouden</div></div>` : ''}
    </div>
  </div>` : '';
  const noSquad = !squadAll.length;
  const gesloten = tournamentClosed(t);
  const squadWarning = (canManage() && noSquad && !gesloten) ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24">${icI(IC.warn)} Nog geen selectie ingegeven — geef eerst een selectie in voor je wedstrijden toevoegt. <button class="btn btn-org btn-sm" onclick="editTournament('${t.id}')">Selectie ingeven</button></div>` : '';
  // Afgesloten tornooi: geen wedstrijden meer bij (ook niet klonen). De gegevens blijven wel
  // aanpasbaar — een naam of selectie rechtzetten mag zonder eerst te heropenen.
  const closedBanner = gesloten
    ? `<div class="viewer-banner">${icI(IC.done)} Afgesloten${t.closedAt ? ' op ' + fmtDate(t.closedAt) : ''}${canManage() ? ' — geen wedstrijden meer toe te voegen' : ''}</div>` : '';
  // CONCEPT: nog niet gedeeld met de andere ploegbeheerders. Zie trnIsConcept in core.js voor wat dit
  // wél en niet is — en zeg dat laatste ook op het scherm, anders houdt iemand het over een jaar voor
  // een slot op de gegevens.
  // GEEN WOORD OVER DE STATISTIEKEN IN DEZE BALK (Tim, 01-09-2026). Dat stond er eerst bij, maar het
  // enige waar een tornooi in de cijfers voor meetelt is "geselecteerd voor een tornooi" — en dan is
  // "telt voor niemand mee in de statistieken" een grote belofte over iets kleins. Het gedrag blijft
  // (zie trnIsConcept in core.js), de melding niet.
  const isConcept = trnIsConcept(t);
  const conceptBanner = isConcept
    ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24">${icI(IC.eyeOff)} <b>Concept — nog niet gedeeld.</b> Andere ploegbeheerders en kijkers zien dit tornooi niet. De clubbeheerder en de eigenaar van de app zien het wél.${canManage() ? `<br><span style="font-size:12px">Het is een keuze in de app, geen slot op de gegevens.</span>` : ''}</div>`
    : '';
  // Tweede argument = "zet het OP concept". Dus false om te delen.
  const conceptBtn = !canManage() ? '' : (isConcept
    ? `<button class="btn btn-green" style="margin-top:8px;width:100%" onclick="trnZetConcept('${t.id}', false)">${icI(IC.eye)} Delen met de ploeg</button>`
    : `<button class="btn btn-pale" style="margin-top:8px;width:100%" onclick="trnZetConcept('${t.id}', true)">${icI(IC.eyeOff)} Op concept zetten — nog niet delen</button>`);
  const newMatchBtn = (canManage() && !noSquad && !gesloten) ? `<button class="btn btn-org" style="margin-bottom:12px" onclick="addTournamentMatch('${t.id}')">${icI(IC.ball)} + Wedstrijd toevoegen</button>` : '';
  // HET TORNOOIPLAN OP PAPIER (Tim, 01-09-2026): alle wedstrijdplannen achter elkaar plus de speeltijd
  // van de hele dag. Boven "Wedstrijd toevoegen", waar Tim het vroeg. Enkel zinvol met wedstrijden, en
  // enkel voor wie de ploeg bijhoudt — het is het blad voor de bank, niet iets voor een kijker.
  const planPdfBtn = (matches.length && canManage())
    ? `<button class="btn btn-pale" style="margin-bottom:12px" onclick="exportTornooiplanPDF('${t.id}')">${icI(IC.download)} Tornooiplan downloaden (PDF)</button>` : '';
  const closeBtn = !canManage() ? '' : (gesloten
    ? `<button class="btn btn-orgpale" style="margin-top:12px;width:100%" onclick="reopenTournament('${t.id}')">${icI(IC.undo)} Tornooi heropenen</button>`
    : `<button class="btn btn-pale" style="margin-top:12px;width:100%" onclick="closeTournamentConfirm('${t.id}')">${icI(IC.done)} Tornooi afsluiten</button>`);
  // Dagoverzicht: pas zinvol zodra er één wedstrijd afgewerkt is. Ook voor kijkers zichtbaar.
  const reportBtn = done.length ? `<button class="btn btn-green" style="margin-bottom:12px" onclick="goTournamentReport('${t.id}')">${icI(IC.clipboard)} Tornooiverslag</button>` : '';
  const matchList = matches.length
    ? matches.map(m => `<div>${matchItemHtml(m)}${(canManage() && !gesloten) ? `<button class="btn btn-orgpale btn-sm" style="margin:-6px 0 10px;width:100%" onclick="cloneTournamentMatch('${m.id}','${t.id}')">${icI(IC.copy)} Kloon als nieuwe wedstrijd</button>` : ''}</div>`).join('')
    : `<div class="empty" style="padding:20px 0"><div class="ei" style="font-size:36px">${IC.ball}</div><p>Nog geen wedstrijden.${canManage() && !noSquad && !gesloten ? ' Voeg er een toe!' : ''}</p></div>`;
  el.innerHTML = `
    ${conceptBanner}
    ${closedBanner}
    <div class="card">${infoRows}${squadRow}${squadBlock}</div>
    ${squadWarning}
    ${statsHtml}
    ${/* Volgt dezelfde publiek/privé-keuze als de sectie Speelminuten in het wedstrijdverslag: een
         tabel met de speeltijd van elke speler over de hele dag is precies waar die schakelaar over
         gaat. Zie statSectionVisible in stats-settings.js. */ ''}
    ${(typeof statSectionVisible !== 'function' || statSectionVisible('minutes')) ? trnPlanHtml(matches) : ''}
    ${reportBtn}
    ${planPdfBtn}
    ${newMatchBtn}
    <div class="sec">Wedstrijden (${matches.length})</div>
    ${matchList}
    ${closeBtn}
    ${conceptBtn}
    ${canManage() ? `<div class="danger"><button class="btn btn-red" onclick="deleteTournamentConfirm('${t.id}')">${icI(IC.trash)} Tornooi verwijderen</button></div>` : ''}`;
}

// ===================== TORNOOIVERSLAG (DAGOVERZICHT) =====================
// Eén dagoverzicht over alle wedstrijden van een tornooi samen. Bewust géén opstelling per deel en
// géén tijdlijn: dat staat al in het verslag/PDF van elke wedstrijd apart. Tornooiwedstrijden zitten
// niet in de gewone statistieken, dus dit rekent volledig op zichzelf, enkel binnen deze dag.
// Selectiegroepen van een tornooi: dagbreed en dus identiek voor elke wedstrijd van dat tornooi.
// Wie meegaat, wie niet geselecteerd werd (ploegkern minus tornooiselectie) en wie niet beschikbaar
// is (met reden). Eén bron voor de tornooipagina, het tornooiverslag en beide PDF's.
function tournamentSelectionGroups(t) {
  const byLast = (a, b) => _lastName(a.name || '').localeCompare(_lastName(b.name || ''), 'nl');
  const all = tournamentSquadList(t);
  // Een rugnummer wordt getoond als de speler er een heeft: de tornooiselectie draagt haar eigen
  // nummers, die je daar leeg kan laten of wissen.
  const num = p => p.number || '';
  const mee = all.filter(s => s.sel !== 'absent')
    .map(s => ({ name: s.name || '', number: num(s), guest: !!s.guest, fromName: s.fromName || '' })).sort(byLast);
  // Een reden hoort enkel bij een NB'er: staat er door oudere of half bewerkte data toch een reden
  // bij iemand die meegaat, dan negeren we die (anders leest de selectie als "(speelt elders)").
  const absent = all.filter(s => s.sel === 'absent')
    .map(s => ({ name: s.name || '', number: num(s), reason: s.absentReason || '', guest: !!s.guest, fromName: s.fromName || '' })).sort(byLast);
  const known = new Set();
  all.forEach(s => { if (s.srcId) known.add(s.srcId); known.add((s.name || '').trim()); });
  const team = teamById(t.teamId);
  const notSelected = ((team && team.players) || [])
    .filter(p => !known.has(p.id) && !known.has((p.name || '').trim()))
    .map(p => ({ name: p.name || '', number: num(p) })).sort(byLast);
  return { mee, absent, notSelected };
}
// "Wedstrijd 2 van 4": plaats van een wedstrijd binnen zijn tornooi, in dezelfde volgorde als de
// tornooipagina (datum, dan aanmaakmoment). Nodig in de wedstrijd-PDF, die los doorgestuurd wordt.
async function tournamentMatchPosition(trnId, matchId) {
  try {
    const all = await dbAll();
    const list = all.filter(x => x.tournamentId === trnId)
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt - b.createdAt));
    const idx = list.findIndex(x => x.id === matchId);
    return { index: idx >= 0 ? idx + 1 : 0, total: list.length };
  } catch (e) { return { index: 0, total: 0 }; }
}
function goTournamentReport(id) {
  const t = tournamentById(id); if (!t) return;
  currentTournament = t; go('tournamentReport');
}
// Alle cijfers van de dag op één plek, zodat het scherm, het deelbericht en (later) de PDF exact
// dezelfde getallen tonen. `matches` = alle wedstrijden van het tornooi (ook nog niet gespeelde).
function tournamentReportData(t, matches) {
  const done = matches.filter(m => m.status === 'done');
  const pl = {};
  // Zelfde spelerssleutel als de statistieken: rosterId indien beschikbaar, anders de naam. Zo
  // blijft een speler één rij, ook als een oudere wedstrijd nog geen rosterId meedroeg.
  const getp = (rosterId, name, number) => {
    const k = rosterId ? 'r:' + rosterId : 'n:' + (name || '').trim().toLowerCase();
    if (!pl[k]) pl[k] = { name: name || '', number: number || '', rosterId: rosterId || null,
      squad: 0, timed: 0, mp: 0, ms: 0, goals: 0, assists: 0, yc: 0, rc: 0, keeperMp: 0, keeperMs: 0, cs: 0, notPresent: 0 };
    const r = pl[k];
    if (!r.number && number) r.number = number;
    return r;
  };
  const results = [];
  // dNil telt de 0-0's apart: sommige tornooien geven daar minder punten voor dan voor een
  // gelijkspel met doelpunten (zie tournamentPoints). d blijft het totaal aantal gelijke spelen,
  // want de balans "1W · 2G · 1V" splitst dat niet op.
  let w = 0, d = 0, dNil = 0, l = 0, gf = 0, ga = 0, cleanSheets = 0;
  for (const m of done) {
    // Is er in deze wedstrijd überhaupt tijd geregistreerd? Bij "Snel resultaat invoeren" niet: dan
    // staat de score vast maar heeft niemand speelminuten. Zo'n wedstrijd mag de noemer van de
    // fair-play-tabel niet verlagen (wie 3 wedstrijden volledig speelde zakte anders naar 15'/match),
    // terwijl hij wél meetelt als "in de selectie" — dat was hij immers echt.
    const gemeten = getGameTimeMs(m) > 0;
    gf += m.scoreUs; ga += m.scoreThem;
    // matchResultaat (core.js) rekent een gewonnen strafschoppenreeks als winst — Tims keuze. De
    // score zelf blijft ongemoeid, dus gf/ga hierboven kloppen gewoon.
    const res = matchResultaat(m);
    if (res === 'W') w++; else if (res === 'V') l++; else { d++; if (m.scoreUs === 0 && m.scoreThem === 0) dNil++; }
    if (m.scoreThem === 0) cleanSheets++;
    const mins = calcMinutes(m);
    const kMs = keeperMinutes(m); // null bij oudere wedstrijden zonder keeperByQ
    for (const p of (m.players || [])) {
      const r = getp(p.rosterId, p.name, p.number);
      // No-show ("Niet aanwezig" tijdens de wedstrijd) telt niet als selectie — zelfde regel als in
      // de statistieken, anders lijkt het alsof de trainer hem geen speelkansen gaf.
      if (p.absent) { r.notPresent++; continue; }
      r.squad++;
      if (gemeten) r.timed++;
      const ms = mins[p.id] ? mins[p.id].ms : 0;
      r.ms += ms;
      if (ms > 0) r.mp++;
      const wasKeeper = (m.keeperByQ && Object.keys(m.keeperByQ).length) ? wasKeeperAtAll(m, p.id) : p.line === 'Doel';
      if (ms > 0 && wasKeeper) {
        r.keeperMp++;
        r.keeperMs += (kMs && kMs[p.id]) || ms;
        if (m.scoreThem === 0) r.cs++;
      }
    }
    const byId = id => (m.players || []).find(x => x.id === id) || null;
    const scorers = [];
    for (const e of (m.events || [])) {
      if ((e.type === 'goal_us' || (e.type === 'penalty_us' && e.scored)) && e.playerId) {
        const p = byId(e.playerId); if (p) { getp(p.rosterId, p.name, p.number).goals++; scorers.push(p.name); }
      }
      if (e.type === 'goal_us' && e.assistId) { const p = byId(e.assistId); if (p) getp(p.rosterId, p.name, p.number).assists++; }
      if (e.type === 'yellow_card' && e.playerId) { const p = byId(e.playerId); if (p) getp(p.rosterId, p.name, p.number).yc++; }
      if (e.type === 'red_card' && e.playerId) { const p = byId(e.playerId); if (p) getp(p.rosterId, p.name, p.number).rc++; }
    }
    results.push({ m, res, scorers });
  }
  // De dagselectie komt uit het tornooi zelf: daar duidde je "mee" en "NB" (met reden) aan, en sinds
  // v0.7.5 staat NB nergens anders meer.
  const byLast = (a, b) => _lastName(a.name || '').localeCompare(_lastName(b.name || ''), 'nl');
  const sg = tournamentSelectionGroups(t);
  const squadMee = sg.mee, squadAbsent = sg.absent, squadNotSelected = sg.notSelected;
  const players = Object.values(pl);
  // Puntenverdeling komt van het tornooi zelf (standaard 3/1/0, per tornooi aanpasbaar).
  const pts = tournamentPoints(t);
  return {
    done, planned: matches.length - done.length, results, players,
    w, d, dNil, l, gf, ga, cleanSheets,
    points: w * pts.win + (d - dNil) * pts.draw + dNil * pts.drawNil + l * pts.loss,
    pointsLabel: tournamentPointsLabel(t), pointsLegend: tournamentPointsLegend(t), usesPoints: tournamentUsesPoints(t),
    squadMee, squadAbsent, squadNotSelected,
    notPresent: players.filter(p => p.notPresent > 0).sort(byLast),
    notes: done.filter(m => (m.notes || '').trim()),
  };
}
function renderTournamentReport() {
  const t = currentTournament;
  if (!t) return trnNotFound('Tornooiverslag');
  if (!trnZichtbaar(t)) return trnNotFound('Tornooiverslag');   // zelfde poortwachter als renderTournament
  setTimeout(loadTournamentReport, 0);
  return `<div class="hdr"><button class="back" onclick="goTournament('${t.id}')">‹</button>
    <div><h1>${icI(IC.clipboard)} Tornooiverslag</h1><div class="hdr-sub">${esc(t.name)}${t.date ? ' · ' + fmtDate(new Date(t.date + 'T00:00:00').getTime()) : ''}</div></div>
  </div>
  <div class="content" id="trn-report"><div class="empty"><div class="ei">${IC.timer}</div><p>Laden...</p></div></div>`;
}
async function loadTournamentReport() {
  const t = currentTournament;
  if (!t) return;
  const el = document.getElementById('trn-report');
  if (!el) return;
  const all = await dbAll();
  const matches = all.filter(m => m.tournamentId === t.id).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt - b.createdAt));
  const r = tournamentReportData(t, matches);
  if (!r.done.length) {
    el.innerHTML = `<div class="empty"><div class="ei">${IC.clipboard}</div><p>Nog geen afgewerkte wedstrijden.<br>Het verslag verschijnt zodra er een wedstrijd afgelopen is.</p></div>`;
    return;
  }
  const team = teamById(t.teamId);
  const mn = ms => Math.round(ms / 60000);
  const row = (left, mid, right) => `<div class="stat-row"><span style="flex:1">${left}</span>${mid ? `<span style="color:var(--txt2);font-size:13px">${mid}</span>` : ''}<span style="font-weight:800;min-width:64px;text-align:right">${right}</span></div>`;
  const nameList = arr => esc(arr.map(nameWithNum).join(', '));
  const infoRows = [
    ['Ploeg', team ? team.name : (t.teamName || '')],
    ['Locatie', t.location],
    ['Format', t.matchType],
    ['Wedstrijdduur', tournamentPeriodsLabel(t)],
    [trainerLabel(t.trainer), t.trainer],
    ['Ploegverantw.', t.responsible],
    ['Eindstand', t.standing],
  ].filter(([, v]) => v).map(([k, v]) => `<div class="stat-row"><span style="color:var(--txt2);min-width:140px">${k}</span><span style="font-weight:600">${esc(v)}</span></div>`).join('');
  // Resultaten: één rij per wedstrijd, met de doelpuntenmakers eronder. Tikken opent het verslag
  // van die wedstrijd.
  const resColor = res => res === 'W' ? 'var(--grn)' : res === 'V' ? 'var(--rd)' : 'var(--txt2)';
  const resultRows = r.results.map(({ m, res, scorers }) => {
    const cnt = {};
    scorers.forEach(n => { cnt[n] = (cnt[n] || 0) + 1; });
    const scLine = Object.entries(cnt).map(([n, c]) => c > 1 ? `${n} (${c})` : n).join(', ');
    return `<div class="stat-row" style="cursor:pointer;align-items:flex-start" onclick="go('detail','${m.id}')">
      <span style="min-width:44px;color:var(--txt2);font-size:13px">${esc(m.time || '')}</span>
      <span style="flex:1">${esc(m.opponent || '')}<small style="display:block;color:var(--txt2)">${scLine ? icI(IC.ball) + ' ' + esc(scLine) : '—'}</small></span>
      <span style="font-weight:800;min-width:52px;text-align:right;color:${resColor(res)}">${scoreTxt(m)}</span>
    </div>`;
  }).join('');
  // Speeltijd: squad = het aantal wedstrijden waarin de speler in de selectie stond (bank inbegrepen),
  // dus 0 minuten na 4x op de bank is zichtbaar. Dat is net het punt van een tornooiverslag.
  const played = r.players.filter(p => p.squad > 0);
  const minutes = played.slice().sort((a, b) => b.ms - a.ms);
  // Fair-play rekent per wedstrijd waarin er tijd geregistreerd is (timed), niet per selectie:
  // een "Snel resultaat" heeft geen speelminuten en zou het gemiddelde van iedereen omlaag halen.
  // Wie enkel zulke wedstrijden had, kan hier dus niet in staan — er is niets om te vergelijken.
  const fair = played.filter(p => p.timed > 0).sort((a, b) => (a.ms / a.timed) - (b.ms / b.timed));
  const scorers = r.players.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
  const assisters = r.players.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists);
  const carded = r.players.filter(p => p.yc || p.rc).sort((a, b) => (b.yc + b.rc * 2) - (a.yc + a.rc * 2));
  const keepers = r.players.filter(p => p.keeperMp > 0).sort((a, b) => b.keeperMs - a.keeperMs);
  const sec = (title, body) => `<div class="sec">${title}</div><div class="card">${body}</div>`;
  // Zichtbaarheid voor kijkers volgt dezelfde keuzes als de statistiekenpagina (de oogjes uit
  // v0.5.20, opgeslagen in teams/{id}/info/statsPublic). Voordien toonde dit verslag élke kijker de
  // speeltijd, de fair-play-rangschikking, de kaarten en de volledige dagselectie — precies wat daar
  // standaard verborgen staat. Wie meegaat naar het tornooi mag wél altijd getoond worden; wie niet
  // gekozen werd of niet beschikbaar was (met reden) niet.
  const mag = statSectionVisible;
  let verborgen = 0;
  const secIf = (k, title, body) => { if (!mag(k)) { verborgen++; return ''; } return sec(title, body); };
  el.innerHTML = `
    <div class="card">
      <div class="stat-big" style="margin-bottom:10px">
        <div class="stat-box"><div class="v">${r.done.length}</div><div class="l">Gespeeld</div></div>
        <div class="stat-box"><div class="v" style="color:var(--grn)">${r.w}</div><div class="l">Winst</div></div>
        <div class="stat-box"><div class="v">${r.d}</div><div class="l">Gelijk</div></div>
        <div class="stat-box"><div class="v" style="color:var(--rd)">${r.l}</div><div class="l">Verlies</div></div>
      </div>
      <div class="stat-big">
        <div class="stat-box"><div class="v">${r.gf}</div><div class="l">Doelpunten voor</div></div>
        <div class="stat-box"><div class="v">${r.ga}</div><div class="l">Doelpunten tegen</div></div>
        <div class="stat-box"><div class="v">${r.gf-r.ga>=0?'+':''}${r.gf-r.ga}</div><div class="l">Saldo</div></div>
        ${r.usesPoints ? `<div class="stat-box"><div class="v">${r.points}</div><div class="l">Punten</div></div>`
          // Clean sheets stonden wél in het deelbericht en de PDF, maar niet hier. Enkel als er geen
          // puntenregel is, want anders wordt de rij te druk op een gsm.
          : r.cleanSheets ? `<div class="stat-box"><div class="v">${r.cleanSheets}</div><div class="l">Nul gehouden</div></div>` : ''}
      </div>
      ${r.usesPoints ? `<p style="font-size:11px;color:var(--txt2);text-align:center;margin-top:8px">Punten volgens ${r.pointsLabel} (${r.pointsLegend}) over je eigen wedstrijden — geen officiële eindstand van het tornooi.${r.cleanSheets ? ` De ploeg hield ${r.cleanSheets}× de nul.` : ''}</p>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <button class="btn btn-green" onclick="shareTournamentReport()">${icI(IC.share)} Delen</button>
      <button class="btn btn-org" onclick="exportTournamentPDF()">${icI(IC.fileText)} PDF</button>
    </div>
    ${r.planned ? `<div class="viewer-banner" style="background:var(--org-pale,#fff3e0);color:#b45309;border-color:#fbbf24">${icI(IC.warn)} ${r.planned} van de ${r.done.length + r.planned} wedstrijden is nog niet afgewerkt — die cijfers zitten hier niet in.</div>` : ''}
    ${sec('Tornooi-info', infoRows || '<p style="color:var(--txt2);font-size:14px">Geen extra info.</p>')}
    ${sec(`Uitslagen (${r.done.length})`, resultRows
      // Deze voetnoot stond enkel in de PDF, terwijl de vraag "waarom staat onze score eerst?" juist
      // op het scherm opkomt. Een tornooi is neutraal terrein, dus er is geen thuisploeg.
      + `<p style="font-size:11px;color:var(--txt2);margin-top:8px">Bij een tornooi staat de eigen ploeg altijd eerst — er is geen thuis- of uitploeg.</p>`)}
    ${sec(`Dagselectie (${r.squadMee.length})`, `<p style="font-size:14px;line-height:1.6"><span style="color:var(--txt2)">Geselecteerd:</span> ${nameList(r.squadMee)}</p>`
      + (mag('selected')
        ? (r.notPresent.length ? `<p style="font-size:14px;line-height:1.6;margin-top:6px"><span style="color:var(--txt2)">Geselecteerd maar niet aanwezig:</span> ${esc(r.notPresent.map(p => p.name).join(', '))}</p>` : '')
          + (r.squadNotSelected.length ? `<p style="font-size:14px;line-height:1.6;margin-top:6px"><span style="color:var(--txt2)">Niet geselecteerd:</span> ${nameList(r.squadNotSelected)}</p>` : '')
          + (r.squadAbsent.length ? `<p style="font-size:14px;line-height:1.6;margin-top:6px"><span style="color:var(--txt2)">Niet beschikbaar:</span> ${nameList(r.squadAbsent)}</p>` : '')
        : (() => { const rest = r.notPresent.length + r.squadNotSelected.length + r.squadAbsent.length; if (rest) verborgen++; return ''; })()))}
    ${(() => {
      // Speeltijd en fair-play stonden in twee tabellen onder elkaar, met dezelfde elf namen en
      // twee gemiddelden die je moest vergelijken door heen en weer te kijken. Nu één lijst, met
      // beide gemiddelden naast elkaar per speler. De twee kijker-schakelaars blijven los werken:
      // "gem. per selectie" hoort bij fair-play, de rest bij de speelminuten.
      const toonMin = mag('minutes'), toonFair = mag('fairplay');
      if (!toonMin && !toonFair) { verborgen += 2; return ''; }
      if (!toonMin || !toonFair) verborgen++;
      // Sorteren op wie het minst aan spelen kwam zodra fair-play zichtbaar is (dat was het punt van
      // die tabel); anders op totale speeltijd, zoals de speeltijdtabel deed.
      // Iedereen die in de selectie zat, ook wie enkel wedstrijden zonder geregistreerde tijd had
      // ("Snel resultaat"): die heeft geen gemiddelde per selectie, maar hoort wel in de lijst.
      const lijst = played.slice().sort(toonFair
        ? (a, b) => (a.timed ? a.ms / a.timed : Infinity) - (b.timed ? b.ms / b.timed : Infinity)
        : (a, b) => b.ms - a.ms);
      if (!lijst.length) return sec(`${icI(IC.timer)} Speeltijd over de dag`, '<p style="color:var(--txt2);font-size:14px">—</p>');
      const uitleg = `<p style="font-size:12px;color:var(--txt2);margin-bottom:8px">${toonFair
        ? 'Twee gemiddelden per speler: <b>per gespeelde match</b> (hoe lang hij speelde als hij speelde) en <b>per selectie</b> (bank inbegrepen) — dat laatste toont of iedereen ongeveer gelijk aan spelen kwam. '
        : ''}Een wedstrijd waarvoor de speler als "niet aanwezig" stond telt niet mee, en een wedstrijd waarvan je enkel de uitslag ingaf ook niet: daar is geen speeltijd bijgehouden.</p>`;
      const rijen = lijst.map(p => {
        const bits = [`${p.mp} van ${p.squad} gespeeld`];
        if (p.notPresent) bits.push(`${p.notPresent}× niet aanwezig`);
        if (toonMin && p.mp) bits.push(`gem. ${mn(p.ms / p.mp)}'/gespeelde match`);
        if (toonFair && p.timed) bits.push(`gem. ${mn(p.ms / p.timed)}'/selectie`);
        const rechts = toonMin ? `${mn(p.ms)}'` : (p.timed ? `${mn(p.ms / p.timed)}'` : '–');
        return row(esc(p.name) + `<small style="color:var(--txt2);display:block">${bits.join(' · ')}</small>`, '', rechts);
      }).join('');
      return sec(`${icI(IC.timer)} Speeltijd over de dag`, uitleg + rijen);
    })()}
    ${(scorers.length || assisters.length) ? sec(`${icI(IC.ball)} Doelpunten &amp; assists`,
      scorers.map(p => row(esc(p.name), '', p.goals + '×')).join('')
      + (assisters.length ? `<hr><div style="font-size:11px;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px;font-weight:700;padding-bottom:4px">Assists</div>` + assisters.map(p => row(esc(p.name), '', p.assists + '×')).join('') : '')) : ''}
    ${keepers.length ? sec(`${icI(IC.save)} Keeper(s)`, keepers.map(p => row(esc(p.name), `${p.keeperMp} ${p.keeperMp === 1 ? 'wedstrijd' : 'wedstrijden'} in doel`, `${p.cs} CS`)).join('')) : ''}
    ${carded.length ? secIf('cards', `${icI(IC.cardY)} Kaarten`, carded.map(p => `<div class="stat-row"><span style="flex:1">${esc(p.name)}</span><span>${p.yc ? icI(IC.cardY).repeat(p.yc) : ''}${p.rc ? icI(IC.cardR).repeat(p.rc) : ''}</span></div>`).join('')) : ''}
    ${(canManage() && r.notes.length) ? sec(`Notities <span style="font-size:11px;font-weight:400;color:var(--txt2);text-transform:none">(enkel zichtbaar voor beheerders)</span>`,
      r.notes.map(m => `<p class="notes-txt" style="margin-bottom:8px"><span style="color:var(--txt2);font-size:13px">vs ${esc(m.opponent || '')}:</span><br>${esc(m.notes)}</p>`).join('')) : ''}
    ${verborgen ? `<p style="font-size:12px;color:var(--txt2);text-align:center;margin-top:14px">Meer statistieken enkel beschikbaar voor ploegbeheerders.</p>` : ''}
    ${viewerVisibilityHintHtml(['selected', 'minutes', 'fairplay', 'cards'])}`;
}
// Deelbericht voor de ploeggroep: uitslagen + dagresultaat + doelpuntenmakers, zonder speeltijden
// (die zijn intern) en zonder notities.
async function shareTournamentReport() {
  const t = currentTournament; if (!t) return;
  const all = await dbAll();
  const matches = all.filter(m => m.tournamentId === t.id).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt - b.createdAt));
  const r = tournamentReportData(t, matches);
  if (!r.done.length) { showToast('Nog geen afgewerkte wedstrijden om te delen.', 'err'); return; }
  const team = teamById(t.teamId);
  const lines = [`🏅 ${t.name}${t.date ? ' — ' + fmtDate(new Date(t.date + 'T00:00:00').getTime()) : ''}`];
  lines.push(`${team ? team.name : (t.teamName || '')}${t.location ? ' · ' + t.location : ''}`);
  lines.push('');
  r.results.forEach(({ m, scorers }) => {
    const cnt = {};
    scorers.forEach(n => { cnt[n] = (cnt[n] || 0) + 1; });
    const scLine = Object.entries(cnt).map(([n, c]) => c > 1 ? `${n} (${c})` : n).join(', ');
    lines.push(`${m.time ? m.time + ' ' : ''}vs ${m.opponent || ''}: ${scoreTxt(m)}${scLine ? ' — ⚽ ' + scLine : ''}`);
  });
  lines.push('', `${r.w}W · ${r.d}G · ${r.l}V — doelpunten ${r.gf}-${r.ga}${r.usesPoints ? ` — ${r.points} punten (${r.pointsLabel})` : ''}`);
  // Het scherm en de PDF waarschuwen hier expliciet voor; zonder deze regel las "1W · 1G · 1V" in
  // de ploeggroep als het volledige tornooi terwijl er nog wedstrijden op de planning stonden.
  if (r.planned) lines.push(`⏳ ${r.planned} van de ${r.done.length + r.planned} wedstrijden nog niet afgewerkt — deze cijfers gaan over de rest.`);
  if (r.cleanSheets) lines.push(`🧱 ${r.cleanSheets}× de nul gehouden`);
  if (t.standing) lines.push(`🏆 Eindstand: ${t.standing}`);
  lines.push('', `— ${activeClubName || getClubName()}`);
  const text = lines.join('\n');
  if (navigator.share) { try { await navigator.share({ title: t.name, text }); } catch (e) {} }
  else { try { await navigator.clipboard.writeText(text); showToast('Dagoverzicht gekopieerd naar klembord', 'ok'); } catch (e) { showToast(text, ''); } }
}

// ----- Tornooiverslag als PDF -----
// Zelfde opmaaktaal als de wedstrijd-PDF (marges, sectiekoppen, tabelstijl, voettekst). De
// opmaak-helpers hieronder zijn een compacte kopie van die in exportPDF() (js/detail-pdf.js): daar
// wordt de cursor `y` op tientallen plaatsen rechtstreeks gebruikt, dus die functie omvormen naar
// gedeelde helpers was een te grote ingreep in een werkende PDF. Wijzig je hier de opmaak, kijk dan
// ook daar (en omgekeerd).
async function exportTournamentPDF() {
  const t = currentTournament; if (!t) return;
  showToast('PDF wordt gemaakt...', 'ok');
  try { await loadJsPDF(); } catch (e) { showToast('PDF-bibliotheek laden mislukt. Controleer je verbinding.', 'err'); return; }
  const all = await dbAll();
  const matches = all.filter(x => x.tournamentId === t.id)
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt - b.createdAt));
  const r = tournamentReportData(t, matches);
  if (!r.done.length) { showToast('Nog geen afgewerkte wedstrijden om te rapporteren.', 'err'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const _docText = doc.text.bind(doc);
  doc.text = (text, ...rest) => _docText(Array.isArray(text) ? text.map(x => typeof x === 'string' ? pdfSafe(x) : x) : (typeof text === 'string' ? pdfSafe(text) : text), ...rest);
  const L = createPdfLayout(doc);
  const { PW, PH, MG, CW } = L;
  const ensure = L.ensure, heading = L.heading, tableBlock = L.tableBlock, textBlock = L.textBlock;
  const HEAD_STYLE = { fillColor: [245, 246, 245], textColor: [107, 114, 128], fontStyle: 'bold' };
  const mn = ms => Math.round(ms / 60000);
  const team = teamById(t.teamId);

  // ---- Header ----
  // Clublogo linksboven, app-logo in de voettekst — zelfde indeling als de wedstrijd-PDF.
  const clubLogo = await rasterizeToPngFit(getActiveClubLogo(), 40, 40, PDF_LOGO_DICHTHEID);
  if (clubLogo) { try { doc.addImage(clubLogo.uri, 'PNG', MG, L.y, clubLogo.w, clubLogo.h, 'clublogo', PDF_BEELD_COMPRESSIE); } catch (e) {} }
  const kopInspring = clubLogo ? clubLogo.w + 10 : 0;
  const voetLogo = await rasterizeToPngFit(APP_LOGO_TRANSPARANT, 13, 13, PDF_LOGO_DICHTHEID);
  const tx = MG + kopInspring, tw = CW - kopInspring;
  doc.setFont(undefined, 'bold'); doc.setFontSize(15); doc.setTextColor(23, 23, 23);
  const titleLines = doc.splitTextToSize(t.name || 'Tornooi', tw);
  doc.text(titleLines, tx, L.y + 13);
  doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(107, 114, 128);
  let my = L.y + 13 + (titleLines.length - 1) * 16 + 14;
  const metaBits = [team ? team.name : (t.teamName || ''), t.date ? fmtDate(new Date(t.date + 'T00:00:00').getTime()) : '', t.location, t.matchType, tournamentPeriodsLabel(t)].filter(Boolean);
  const metaLines = doc.splitTextToSize(metaBits.join(' · '), tw);
  doc.text(metaLines, tx, my); my += metaLines.length * 13;
  const infoBits = [t.trainer && (trainerLabel(t.trainer) + ': ' + t.trainer), t.responsible && (responsibleLabel(t.responsible) + ': ' + t.responsible), t.standing && ('Eindstand: ' + t.standing)].filter(Boolean);
  if (infoBits.length) {
    const infoLines = doc.splitTextToSize(infoBits.join(' · '), tw);
    doc.text(infoLines, tx, my); my += infoLines.length * 13;
  }
  L.y = Math.max(L.y + 56, my + 4);
  doc.setDrawColor(245, 130, 31); doc.setLineWidth(2); doc.line(MG, L.y, MG + CW, L.y);
  L.y += 26;

  // ---- Dagresultaat ----
  doc.setFont(undefined, 'bold'); doc.setFontSize(20); doc.setTextColor(23, 23, 23);
  doc.text(`${r.w}W · ${r.d}G · ${r.l}V`, PW / 2, L.y + 16, { align: 'center' });
  L.y += 34;
  doc.setFont(undefined, 'normal'); doc.setFontSize(11); doc.setTextColor(107, 114, 128);
  const resBits = [`${r.done.length} ${r.done.length === 1 ? 'wedstrijd' : 'wedstrijden'} gespeeld`,
    `doelpunten ${r.gf}-${r.ga} (${r.gf - r.ga >= 0 ? '+' : ''}${r.gf - r.ga})`,
    r.usesPoints ? `${r.points} punten volgens ${r.pointsLabel}` : '',
    r.cleanSheets ? `${r.cleanSheets}× de nul gehouden` : ''].filter(Boolean);
  doc.text(resBits.join(' · '), PW / 2, L.y, { align: 'center', maxWidth: CW });
  L.y += 16;
  if (r.planned) {
    doc.setFontSize(9.5);
    doc.text(`${r.planned} van de ${r.done.length + r.planned} wedstrijden is nog niet afgewerkt en zit hier niet in.`, PW / 2, L.y, { align: 'center', maxWidth: CW });
    L.y += 14;
  }
  if (r.usesPoints) {
    doc.setFontSize(9.5);
    // Zonder het schema tussen haakjes: dat staat één regel hoger al in de resultaatregel.
    doc.text('De punten gaan enkel over de eigen wedstrijden en zijn geen officiële eindstand van het tornooi.', PW / 2, L.y, { align: 'center', maxWidth: CW });
    L.y += 22;
  } else L.y += 8;
  doc.setTextColor(23, 23, 23);

  // ---- Uitslagen ----
  tableBlock(`Uitslagen (${r.done.length})`, {
    head: [['Uur', 'Tegenstander', 'Uitslag', 'W/G/V', 'Doelpuntenmakers']],
    body: r.results.map(({ m, res, scorers }) => {
      const cnt = {};
      scorers.forEach(n => { cnt[n] = (cnt[n] || 0) + 1; });
      return [m.time || '', m.opponent || '', scoreTxt(m), res, Object.entries(cnt).map(([n, c]) => c > 1 ? `${n} (${c})` : n).join(', ') || '-'];
    }),
    styles: { fontSize: 10, cellPadding: 5, valign: 'top' }, headStyles: HEAD_STYLE,
    // Kolom 3 breed genoeg voor de kop "W/G/V" op één regel (die wikkelde bij 38 pt).
    columnStyles: { 0: { cellWidth: 42 }, 2: { cellWidth: 50, halign: 'center' }, 3: { cellWidth: 50, halign: 'center', fontStyle: 'bold' } },
  }, 24, 'Bij een tornooi staat de eigen ploeg altijd eerst.');

  // ---- Dagselectie ----
  // Zelfde zichtbaarheidsregels als het verslag op het scherm: een kijker kan deze PDF downloaden,
  // dus wat daar verborgen is, hoort hier ook niet in. Wie meegaat mag wel altijd vermeld worden.
  const pdfMag = statSectionVisible;
  const selGroups = [['Geselecteerd:', r.squadMee, true],
    ...(pdfMag('selected') ? [
      ['Geselecteerd maar niet aanwezig:', r.notPresent, false],
      ['Niet geselecteerd:', r.squadNotSelected, false],
      ['Niet beschikbaar:', r.squadAbsent, false]] : [])].filter(g => g[1].length);
  if (selGroups.length) {
    doc.setFont(undefined, 'normal'); doc.setFontSize(11);
    const wrapped = selGroups.map(([lbl, list]) => doc.splitTextToSize(lbl + ' ' + list.map(nameWithNum).join(', '), CW));
    heading(`Dagselectie (${r.squadMee.length})`, wrapped.reduce((n, w) => n + w.length * 15 + 4, 0));
    for (let i = 0; i < wrapped.length; i++) {
      doc.setFont(undefined, 'normal'); doc.setFontSize(11);
      doc.setTextColor(...(selGroups[i][2] ? [23, 23, 23] : [107, 114, 128]));
      for (const ln of wrapped[i]) { ensure(15); doc.text(ln, MG, L.y); L.y += 15; }
      L.y += 4;
    }
    doc.setTextColor(23, 23, 23); L.y += 12;
  }

  // ---- Speeltijd + fair-play ----
  const played = r.players.filter(p => p.squad > 0);
  // Geen enkele speler een rugnummer? Dan valt de '#'-kolom weg (rugnummers zijn optioneel) en
  // schuiven de kolombreedtes één plaats op.
  const anyNum = r.players.some(p => pNum(p));
  const numCol = anyNum ? ['#'] : [];
  const numCell = p => anyNum ? [pNum(p)] : [];
  const colShift = obj => { if (anyNum) return obj; const out = {}; for (const k in obj) out[Number(k) - 1] = obj[k]; delete out['-1']; return out; };
  // autoTable laat een kolom-halign niet doorwerken op de kopcel (headStyles wint), waardoor de
  // titels links stonden boven rechts uitgelijnde cijfers. Alles rechts behalve # en de naam.
  const naamIdx = anyNum ? 1 : 0;
  const rechtsUitgelijndeKoppen = d => { if (d.section === 'head' && d.column.index > naamIdx) d.cell.styles.halign = 'right'; };
  // Eén tabel voor speeltijd én fair-play: het waren twee lijsten met dezelfde namen, en de twee
  // gemiddelden die je wil vergelijken stonden een halve pagina uit elkaar. De kijker-schakelaars
  // blijven wel los werken — "Gem. per selectie" hoort bij fair-play, de rest bij de speelminuten —
  // dus de kolommen verschijnen naargelang wat een kijker mag zien.
  const toonMin = pdfMag('minutes'), toonFair = pdfMag('fairplay');
  if (played.length && (toonMin || toonFair)) {
    // Minste speeltijd per selectie eerst zodra die kolom er staat (dat was het punt van de
    // fair-play-lijst); anders de langste totale speeltijd eerst. Wie enkel wedstrijden zonder
    // geregistreerde tijd had ("Snel resultaat") heeft geen gemiddelde en komt achteraan.
    const rijen = played.slice().sort(toonFair
      ? (a, b) => (a.timed ? a.ms / a.timed : Infinity) - (b.timed ? b.ms / b.timed : Infinity)
      : (a, b) => b.ms - a.ms);
    // Kopletter 9 en gemeten kolombreedtes, zodat elke titel op één regel past; alles rechts
    // uitgelijnd behalve de naam, net als de cijfers eronder (zie didParseCell).
    const head = [...numCol, 'Naam', 'Gespeeld'];
    const breedtes = { 0: { cellWidth: 24 }, 2: { cellWidth: 60, halign: 'right' } };
    let k = 3;
    if (toonMin) { head.push('Totaal speelminuten', 'Gem. per gespeelde match'); breedtes[k++] = { cellWidth: 100, halign: 'right' }; breedtes[k++] = { cellWidth: 129, halign: 'right' }; }
    if (toonFair) { head.push('Gem. per selectie'); breedtes[k++] = { cellWidth: 89, halign: 'right' }; }
    tableBlock('Speeltijd over de dag', {
      head: [head],
      body: rijen.map(p => {
        const rij = [...numCell(p), p.name || '', `${p.mp} van ${p.squad}${p.notPresent ? ` · ${p.notPresent}× niet aanwezig` : ''}`];
        if (toonMin) rij.push(`${mn(p.ms)}'`, p.mp ? `${mn(p.ms / p.mp)}'` : '-');
        if (toonFair) rij.push(p.timed ? `${mn(p.ms / p.timed)}'` : '-');
        return rij;
      }),
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: Object.assign({}, HEAD_STYLE, { fontSize: 9 }),
      columnStyles: colShift(breedtes),
      didParseCell: rechtsUitgelijndeKoppen,
    }, 24, `"Gespeeld" is in hoeveel van de wedstrijden waarvoor hij geselecteerd was, hij effectief speelde.${toonFair ? ' Het gemiddelde per selectie telt de bank mee en laat zo zien of iedereen ongeveer gelijk aan spelen kwam.' : ''} Een wedstrijd waarvoor hij zich afmeldde telt niet mee, en een wedstrijd waarvan enkel de uitslag ingegeven is ook niet: daar is geen speeltijd bijgehouden.`);
  }

  // ---- Doelpunten, assists, keepers, kaarten ----
  const tally = (arr, val) => arr.map(p => `${p.name}${val(p) > 1 ? ` (${val(p)})` : ''}`).join(', ');
  const scorers = r.players.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
  const assisters = r.players.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists);
  const keepers = r.players.filter(p => p.keeperMp > 0).sort((a, b) => b.keeperMs - a.keeperMs);
  const carded = r.players.filter(p => p.yc || p.rc).sort((a, b) => (b.yc + b.rc * 2) - (a.yc + a.rc * 2));
  if (scorers.length || assisters.length) {
    // Elk op een eigen regel: achter elkaar met een puntje ertussen liep de assistlijst midden in
    // de doelpuntenlijst door en was niet meer te zien waar de ene ophield.
    const parts = [scorers.length ? 'Doelpunten: ' + tally(scorers, p => p.goals) : '', assisters.length ? 'Assists: ' + tally(assisters, p => p.assists) : ''].filter(Boolean);
    textBlock('Doelpunten & assists', parts.join('\n'));
  }
  if (keepers.length) textBlock('Keeper(s)', keepers.map(p => `${p.name}: ${p.keeperMp} ${p.keeperMp === 1 ? 'wedstrijd' : 'wedstrijden'} in doel, ${p.cs} clean sheet${p.cs === 1 ? '' : 's'}`).join('   ·   '));
  if (carded.length && pdfMag('cards')) textBlock('Kaarten', carded.map(p => `${p.name}: ${[p.yc ? p.yc + '× geel' : '', p.rc ? p.rc + '× rood' : ''].filter(Boolean).join(' + ')}`).join('   ·   '));

  // Geen notitie-sectie in het dagoverzicht: elk wedstrijdverslag hieronder bevat zijn eigen
  // notities, dus die zouden anders twee keer in hetzelfde document staan. (Op het scherm staat het
  // dagoverzicht wél apart, en daar horen ze net wel bij.)

  // ---- De wedstrijdverslagen, in volgorde ----
  // Na het dagoverzicht volgt elke wedstrijd apart, elk op een nieuwe pagina. Zonder de tornooi-info:
  // die staat vooraan in dit document en zou zich per wedstrijd herhalen. De secties zelf komen uit
  // pdfMatchBody() (js/detail-pdf.js), dezelfde functie als de losse wedstrijd-PDF gebruikt.
  for (let i = 0; i < r.done.length; i++) {
    const m = r.done[i];
    doc.addPage(); L.y = L.MG;
    doc.setFont(undefined, 'bold'); doc.setFontSize(10); doc.setTextColor(107, 114, 128);
    // Nummeren over ALLE wedstrijden van de dag, niet over de afgewerkte: de losse wedstrijd-PDF
    // doet dat ook (tournamentMatchPosition), en dezelfde wedstrijd las anders "WEDSTRIJD 3 VAN 4"
    // hier en "Wedstrijd 4 van 5" daar. Zelfde sortering, dus dezelfde nummers.
    const absIdx = matches.findIndex(x => x.id === m.id) + 1;
    doc.text(absIdx ? `WEDSTRIJD ${absIdx} VAN ${matches.length}` : `WEDSTRIJD ${i + 1}`, MG, L.y + 9);
    doc.setFont(undefined, 'bold'); doc.setFontSize(15); doc.setTextColor(23, 23, 23);
    const wTitle = doc.splitTextToSize(`${tName(m)} vs ${m.opponent || ''}`, CW - 110);
    doc.text(wTitle, MG, L.y + 30);
    doc.setFontSize(20);
    doc.text(scoreTxt(m).replace('-', ' – '), MG + CW, L.y + 30, { align: 'right' });
    let wy = L.y + 30 + (wTitle.length - 1) * 16 + 15;
    doc.setFont(undefined, 'normal'); doc.setFontSize(10.5); doc.setTextColor(107, 114, 128);
    // subteam (het A/B-ploeglabel) hoorde hier ook bij: bij twee deelploegen op hetzelfde tornooi
    // was in dit verslag niet te zien welke van de twee gespeeld had.
    const wBits = [m.time, m.subteam && ('Ploeg ' + m.subteam), `${pCount(m)} × ${m.quarterDuration} min`, m.matchType,
      m.formation && ('Opstelling: ' + m.formation), m.referee && ('Scheidsrechter: ' + m.referee),
      m.jersey && ('Truikleur: ' + m.jersey),
      allCaptains(m).length && ('Kapitein(s): ' + allCaptains(m).map(id => pName(m, id)).join(' | ')),
      m.motmId && ('Man van de match: ' + pName(m, m.motmId))].filter(Boolean);
    const wLines = doc.splitTextToSize(wBits.join(' · '), CW);
    doc.text(wLines, MG, wy);
    wy += wLines.length * 13;
    L.y = wy + 6;
    doc.setDrawColor(245, 130, 31); doc.setLineWidth(1.5); doc.line(MG, L.y, MG + CW, L.y);
    L.y += 22; doc.setTextColor(23, 23, 23);
    await pdfMatchBody(doc, L, m);
  }

  L.footer(voetLogo);
  const fileTitle = `${t.date ? t.date + '_' : ''}${(t.name || 'tornooi')}_tornooiverslag`.replace(/[\\/:*?"<>|]/g, '-');
  doc.save(`${fileTitle}.pdf`);
  showToast(`PDF gedownload: ${fileTitle}.pdf`, 'ok');
}

// Hoort deze wedstrijd bij de actieve ploeg? Zelfde dubbele criterium als elders in de app: bij
// voorkeur het stabiele m.teamId, met de teamName-fallback voor wedstrijden van vóór v0.5.34.
// De matches-store in IndexedDB is niet per ploeg gescheiden, vandaar deze controle.
function trnMatchIsOwn(m) {
  if (m.teamId && teamById(m.teamId)) return true;
  const tn = teamNames[activeTeamId] || '';
  return !!(tn && m.teamName === tn);
}
// Een tornooi verwijderen terwijl er nog wedstrijden aan hangen maakte die wedstrijden onvindbaar:
// ze houden hun tournamentId, en élke lijst (wedstrijden, home, volgende wedstrijd) en alle
// statistieken filteren op !m.tournamentId. Daarom kan een tornooi mét wedstrijden niet meer
// zomaar verwijderd worden; wie alles in één keer wil wissen, moet dat expliciet bevestigen met
// zijn wachtwoord en krijgt een back-up in deletedMatches (enkel leesbaar voor de beheerder(s)
// van die ploeg, de clubbeheerder en de eigenaar).
// ===================== TORNOOI AFSLUITEN =====================
// Afsluiten = de dag is voorbij: het tornooi verhuist naar de gespeelde tornooien, ongeacht de
// datum, en er kunnen geen wedstrijden meer bijkomen. Bewust géén slot op de gegevens zelf — een
// naam of selectie rechtzetten mag zonder te heropenen. Nieuwe, optionele velden (status/closedAt),
// dus bestaande tornooien blijven zich gedragen zoals voorheen.
let _trnCloseBusy = false;
async function closeTournamentConfirm(id) {
  if (!canManage()) return;
  const t = tournamentById(id); if (!t) return;
  let gepland = null;
  try { gepland = (await dbAll()).filter(m => m.tournamentId === id && m.status === 'planned'); } catch (e) { gepland = null; }
  if (!gepland) { showToast('Kon de wedstrijden niet nalezen, probeer opnieuw.', 'err'); return; }
  const n = gepland.length;
  const wedstrijden = `${n} wedstrijd${n === 1 ? '' : 'en'}`;
  openModal(`<h3>${icI(IC.done)} Tornooi afsluiten?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:12px">"${esc(t.name)}" verhuist naar de gespeelde tornooien en er kunnen geen wedstrijden meer bijkomen. Je kan het altijd heropenen.</p>
    ${n ? `<p style="text-align:center;font-size:13px;color:#b45309;background:var(--org-pale,#fff3e0);border:1px solid #fbbf24;border-radius:10px;padding:8px 10px;margin-bottom:14px">${icI(IC.warn)} Er ${n === 1 ? 'staat' : 'staan'} nog ${wedstrijden} op gepland.</p>` : ''}
    <button class="btn btn-green" onclick="doCloseTournament('${id}',false)">${icI(IC.check)} Afsluiten</button>
    ${n ? `<button class="btn btn-red" style="margin-top:8px" onclick="doCloseTournament('${id}',true)">${icI(IC.trash)} Afsluiten en ${wedstrijden} verwijderen</button>` : ''}
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doCloseTournament(id, verwijderGepland) {
  if (!canManage()) return;
  const t = tournamentById(id); if (!t) return;
  if (_trnCloseBusy) return;   // dubbeltik-guard: zou de wedstrijden twee keer proberen te wissen
  _trnCloseBusy = true;
  try {
    if (verwijderGepland) {
      const gepland = (await dbAll()).filter(m => m.tournamentId === id && m.status === 'planned');
      for (const m of gepland) await dbDel(m.id);
    }
    t.status = 'done';
    t.closedAt = Date.now();
    saveTournament(t);
    if (currentTournament && currentTournament.id === id) currentTournament = t;
    closeModal(); render();
    showToast('Tornooi afgesloten.', 'ok');
  } finally { _trnCloseBusy = false; }
}
async function reopenTournament(id) {
  if (!canManage()) return;
  const t = tournamentById(id); if (!t) return;
  // Expliciet op 'open' zetten i.p.v. het veld weg te gooien: zo is het ook voor de cloud-merge een
  // echte wijziging en kan een ander toestel niet stil terugvallen op de oude waarde.
  t.status = 'open';
  t.closedAt = null;
  saveTournament(t);
  if (currentTournament && currentTournament.id === id) currentTournament = t;
  render();
  showToast('Tornooi heropend.', 'ok');
}
// Op concept zetten of weer delen. Bewaart WIE het op concept zette: die persoon blijft het zien,
// terwijl een andere ploegbeheerder die hetzelfde tornooi opent niets meer vindt. Zie trnIsConcept en
// trnZichtbaar in core.js — en `concept` expliciet weggooien bij het delen, zodat de cloud-merge het
// als een echte wijziging ziet (zelfde reden als bij reopenTournament hierboven).
async function trnZetConcept(id, opConcept) {
  if (!canManage()) { showToast('Enkel een beheerder kan dit wijzigen.', 'err'); return; }
  const t = tournamentById(id); if (!t) return;
  if (opConcept) {
    t.concept = true;
    t.conceptBy = (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) || '';
  } else {
    t.concept = false;
    t.conceptBy = null;
  }
  saveTournament(t);
  if (currentTournament && currentTournament.id === id) currentTournament = t;
  render();
  showToast(opConcept
    ? 'Op concept gezet. Enkel jij, de clubbeheerder en de eigenaar van de app zien dit tornooi nog.'
    : 'Gedeeld met de ploeg — iedereen ziet het nu.', 'ok');
}
async function deleteTournamentConfirm(id) {
  const t = tournamentById(id); if (!t) return;
  let mine = null;
  try { mine = (await dbAll()).filter(m => m.tournamentId === id); } catch (e) { mine = null; }
  if (!mine) { showToast('Kon de wedstrijden niet nalezen, probeer opnieuw.', 'err'); return; }
  const n = mine.length;
  if (n === 0) {
    openModal(`<h3>Tornooi verwijderen?</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">"${esc(t.name)}" wordt verwijderd.${(cloudReady && activeTeamId && isAdmin) ? ' Er wordt een back-up bewaard, dus je kan dit terugvinden in de <b>Prullenmand</b> op het ploegscherm.' : ' Zonder internetverbinding kan er geen back-up bewaard worden.'}</p>
      <button class="btn btn-red" onclick="doDeleteTournament('${id}')">${icI(IC.trash)} Ja, verwijderen</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  const wedstrijden = `${n} wedstrijd${n === 1 ? '' : 'en'}`;
  // De back-up landt onder de ACTIEVE ploeg (zo staan de rules van deletedMatches), dus alles in één
  // keer wissen kan enkel als álle wedstrijden van dit tornooi ook bij die ploeg horen. En zonder
  // cloud/aanmelding is er geen wachtwoordcontrole en geen back-up mogelijk — dan bieden we die weg
  // niet aan.
  const canAll = cloudReady && !!currentUser && !!fbdb && !!activeTeamId;
  const sameTeam = mine.every(trnMatchIsOwn);
  const allBlock = !canAll
    ? `<p style="text-align:center;color:var(--txt2);font-size:13px">Alles in één keer verwijderen kan enkel met internetverbinding, omdat er dan een back-up bewaard kan worden.</p>`
    : !sameTeam
      ? `<p style="text-align:center;color:var(--txt2);font-size:13px">Dit tornooi hoort bij een andere ploeg. Open eerst die ploeg om alles in één keer te verwijderen.</p>`
      : `<button class="btn btn-red" onclick="askDeleteTournamentAll('${id}')">${icI(IC.trash)} Wedstrijden meteen ook verwijderen</button>`;
  openModal(`<h3>Tornooi verwijderen?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:10px">"${esc(t.name)}" heeft nog <b>${wedstrijden}</b>. Verwijder die eerst via de tornooipagina, of verwijder alles in één keer.</p>
    ${allBlock}
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
function askDeleteTournamentAll(id) {
  const t = tournamentById(id); if (!t) return;
  openModal(`<h3>${icI(IC.warn)} Alles verwijderen?</h3>
    <p style="text-align:center;color:var(--rd);font-size:13px;margin-bottom:10px"><b>Onomkeerbaar.</b> Het tornooi "${esc(t.name)}" én al zijn wedstrijden worden verwijderd, met alle doelpunten, wissels, opstellingen en notities.</p>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">Er wordt een back-up bewaard die enkel de app-eigenaar kan terugvinden.</p>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">Geef je wachtwoord in ter bevestiging:</p>
    <div class="fg fg-pwd"><input id="trndel-pwd" type="password" placeholder="wachtwoord" autofocus><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="trndel-err"></div>
    <button class="btn btn-red" onclick="doDeleteTournamentAll('${id}')">Permanent verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
let _trnDeleteBusy = false;
async function doDeleteTournamentAll(id) {
  if (!canManage() || !fbdb || !currentUser || !activeTeamId) return;
  const t = tournamentById(id); if (!t) return;
  const pwd = (document.getElementById('trndel-pwd') || {}).value || '';
  const err = document.getElementById('trndel-err');
  if (!pwd) { if (err) err.textContent = 'Geef je wachtwoord in.'; return; }
  if (_trnDeleteBusy) return; // dubbeltik-guard: een 2e run zou de back-up kunnen overschrijven
  _trnDeleteBusy = true;
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pwd);
    await currentUser.reauthenticateWithCredential(cred);
    const mine = (await dbAll()).filter(m => m.tournamentId === id);
    // Nog eens narekenen op het moment zelf: de back-up mag nooit onder een andere ploeg landen.
    if (!mine.every(trnMatchIsOwn)) {
      if (err) err.textContent = 'Deze wedstrijden horen bij een andere ploeg.';
      return;
    }
    const snap = jclone(t);
    let gewist = 0;
    for (const m of mine) {
      // Back-up vóór de echte verwijdering, met het tornooi-object erbij zodat de dag (selectie,
      // eindstand, puntenverdeling) volledig reconstrueerbaar blijft. fbOnce() i.p.v. een ruwe
      // once('value'): die resolvet offline zonder gecachte waarde nooit.
      // Lukt de back-up niet, dan verwijderen we NIETS meer: zonder vangnet mag deze actie niet
      // doorgaan. Wat al gewist is, is dan wél geback-upt, dus er gaat nooit data verloren.
      try {
        const nr = notesRef(m.id);
        const notesSnap = nr ? await fbOnce(nr) : null;
        await fbdb.ref('deletedMatches/' + activeTeamId + '/' + m.id).set({
          deletedAt: Date.now(),
          deletedBy: currentUser.uid,
          deletedByEmail: currentUser.email || '',
          match: jclone(m),
          notes: notesSnap ? notesSnap.val() : null,
          tournament: snap,
        });
      } catch (e) {
        if (err) err.textContent = gewist
          ? `Back-up mislukt na ${gewist} wedstrijd${gewist === 1 ? '' : 'en'} — gestopt. Probeer opnieuw.`
          : 'Back-up mislukt, er is niets verwijderd. Probeer opnieuw.';
        return;
      }
      await dbDel(m.id);
      gewist++;
    }
    deleteTournament(id);
    currentTournament = null;
    showToast(`Tornooi en ${mine.length} wedstrijd${mine.length === 1 ? '' : 'en'} verwijderd.`, 'ok');
    closeModal();
    go('tournaments');
  } catch (e) {
    if (err) err.textContent = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
      ? 'Ongeldig wachtwoord.' : 'Verwijderen mislukt, probeer opnieuw.';
  } finally { _trnDeleteBusy = false; }
}
async function doDeleteTournament(id) {
  if (!canManage()) return; // zelfde reden als bij saveTournamentWiz: dit wist data
  // Een tornooi ZONDER wedstrijden had tot nu geen enkel vangnet — de bevestiging zei zelfs dat het
  // niet ongedaan te maken was. Nu gaat er eerst een back-up naar dezelfde knoop als bij een
  // verwijderde wedstrijd (deletedMatches), zodat het herstelscherm het terugvindt. Bewust die knoop
  // en geen nieuwe: de rules staan daar al goed, dus er valt niets te publiceren.
  const t = tournamentById(id);
  if (t && cloudReady && fbdb && activeTeamId && isAdmin) {
    try {
      await fbdb.ref('deletedMatches/' + activeTeamId + '/' + id).set({
        deletedAt: Date.now(),
        deletedBy: currentUser ? currentUser.uid : null,
        deletedByEmail: (currentUser && currentUser.email) || '',
        tournament: jclone(t),
      });
    } catch (e) {}
  }
  deleteTournament(id);
  currentTournament = null; closeModal(); go('tournaments');
}

// ----- Tornooi-wizard -----
// De ploeg van een tornooi komt uit de context waarin je het aanmaakt, niet uit een keuzelijst.
// In de cloud werk je altijd binnen één ploeg; lokaal is het de ploeg die op het homescherm
// gefilterd staat. Blijft er daarna meer dan één kandidaat over (lokale modus met meerdere ploegen
// en filter "Alle ploegen"), dan is er geen context en toont stap 1 alsnog een keuze.
function trnTeamCandidates() {
  const teams = getTeamsV2();
  if (!cloudReady && homeFilter && homeFilter !== 'all') {
    const m = teams.filter(t => t.name === homeFilter);
    if (m.length) return m;
  }
  return teams;
}
function newTournament() {
  if (!canManage()) return;
  // Zelfde reden als bij newMatch(): de dagselectie komt uit het rooster van de actieve ploeg.
  if (!rosterReady()) { showToast('Spelers zijn nog aan het laden — probeer het over een paar seconden opnieuw.', 'err'); return; }
  const now = new Date();
  const team = trnTeamCandidates()[0] || null;
  trnWiz = {
    step: 1, id: uid(), isNew: true,
    name: '', date: now.toISOString().split('T')[0],
    location: '', teamId: (team || {}).id || '',
    matchType: '8v8',
    periodKey: TRN_PERIODS_DEFAULT.periodKey, numQuarters: TRN_PERIODS_DEFAULT.numQuarters,
    quarterDuration: TRN_PERIODS_DEFAULT.quarterDuration,
    // Net als bij een wedstrijd: de eerste trainer en ploegverantwoordelijke staan voorgevinkt.
    trainer: teamTrainerNames(team)[0] || '',
    responsible: teamResponsibleNames(team)[0] || '',
    pool: [], poolTeamId: null,
  };
  trnWiz._sig = trnWizSig(); // vertrekpunt voor de "niet bewaard"-vraag bij het verlaten
  go('tournamentNew');
}
function editTournament(id) {
  if (!canManage()) return;
  const t = tournamentById(id); if (!t) return;
  trnWiz = Object.assign({}, t, { step: 1, isNew: false, pool: [], poolTeamId: null, matchType: t.matchType || '8v8' });
  trnWizBuildPool();
  const allSquad = tournamentSquadList(t); // incl. NB — die keuze moet hier juist herbewerkbaar blijven
  const byKey = {};
  allSquad.forEach(s => { byKey[s.srcId || s.name] = s; });
  const gebruikt = new Set();
  trnWiz.pool.forEach(p => {
    const key = byKey[p.srcId] ? p.srcId : (byKey[p.name] ? p.name : null);
    const s = key ? byKey[key] : null;
    if (key) gebruikt.add(key);
    const val = s ? (s.sel || 'mee') : null;
    p.sel = val === 'absent' ? 'absent' : (val ? 'mee' : 'none');
    p.absentReason = (p.sel === 'absent' && s) ? (s.absentReason || '') : '';
    // Tornooi-specifiek rugnummer terugzetten — trnWizBuildPool nam het rosternummer, waardoor
    // een aangepast tornooinummer bij herbewerken stil verloren ging. Een BEWUST leeggemaakt nummer
    // hoort ook leeg te blijven: met `if (s.number)` viel het terug op het roosternummer, en dan
    // stond er in het verslag weer een nummer dat je net had weggehaald.
    if (s && s.sel) p.number = s.number || '';
  });
  // Squadleden zonder tegenhanger in het rooster achteraan toevoegen i.p.v. ze te laten vallen:
  // gastspelers en losse spelers staan per definitie niet in het rooster, en een speler die de
  // ploeg intussen verliet verdween hier stil uit de dagselectie terwijl zijn minuten en
  // doelpunten in hetzelfde verslag bleven staan.
  allSquad.forEach(s => {
    const key = s.srcId || s.name;
    if (gebruikt.has(key)) return;
    gebruikt.add(key);
    trnWiz.pool.push({
      pid: s.pid || uid(), srcId: s.srcId, srcGlobalId: s.globalId || null,
      name: s.name || '', number: s.number || '', pos: s.pos || '', side: s.side || '',
      guest: !!s.guest, fromName: s.fromName || '',
      sel: s.sel === 'absent' ? 'absent' : 'mee',
      absentReason: s.sel === 'absent' ? (s.absentReason || '') : '',
    });
  });
  trnWiz.poolTeamId = trnWiz.teamId;
  trnWiz._sig = trnWizSig(); // idem: pas ná het herstellen van de bestaande selectie
  go('tournamentNew');
}
// Geeft terug of de pool écht opnieuw opgebouwd is. Vindt teamById() de ploeg niet (rooster nog
// niet gesynct, of een tornooi uit de lokale modus), dan blijft een bestaande pool staan: hem
// leegmaken zou saveTournamentWiz die leegte als een lege squad.players laten wegschrijven en zo
// de dagselectie inclusief NB-redenen wissen — ook in de cloud. Is de pool toch al leeg, dan valt
// er niets te beschermen en verandert er niets.
function trnWizBuildPool() {
  const team = teamById(trnWiz.teamId);
  if (!team) {
    if ((trnWiz.pool || []).length) {
      showToast('Ploeg niet gevonden — de bestaande selectie blijft ongewijzigd.', 'err');
      return false;
    }
    trnWiz.pool = [];
    return false;
  }
  // Zonder vaste rugnummers in de ploeg starten de nummervelden leeg (per tornooidag mag je er nog
  // altijd één invullen) — zie teamUsesNumbers.
  const numsAan = teamUsesNumbers(team);
  trnWiz.pool = team.players.map(p => ({
    pid: uid(), srcId: p.id, srcGlobalId: p.globalId || null,
    name: ((pFirstName(p) + ' ' + pLastName(p)).trim()) || p.name || '',
    number: numsAan ? (p.number || '') : '', pos: p.pos || '', side: p.side || '', sel: 'none',
  }));
  return true;
}
// Enkel bereikbaar zolang stap 1 nog een keuzelijst toont (nieuw tornooi, geen ploegcontext).
function trnWizTeamChange() {
  const oudeTeamId = trnWiz.teamId;
  captureTrnStep1();
  const team = teamById(trnWiz.teamId);
  if (team) {
    trnWiz.trainer = teamTrainerNames(team)[0] || '';
    trnWiz.responsible = teamResponsibleNames(team)[0] || '';
    // Een andere ploeg betekent een ander rooster, dus de selectie wordt opnieuw opgebouwd. Niet
    // stil doen als er al iets gekozen was (bv. na terugkeren uit stap 2).
    const gekozen = trnWiz.teamId !== oudeTeamId ? (trnWiz.pool || []).filter(p => p.sel && p.sel !== 'none').length : 0;
    if (trnWizBuildPool()) {
      trnWiz.poolTeamId = trnWiz.teamId;
      if (gekozen) showToast(`Andere ploeg gekozen — de selectie van ${gekozen} speler${gekozen === 1 ? '' : 's'} is opnieuw opgebouwd.`, 'err');
    }
  }
  render();
}
// Wisselt de blokvorm van de standaardduur: duurlijst herbouwen en terugvallen op de standaardduur
// van die vorm, net zoals trnPeriodChange() bij een tornooiwedstrijd doet. Zonder dat bleef een
// duur staan die niet in de nieuwe lijst voorkomt, en sprong de selector op "Vrij…" met een leeg vakje.
function trnDefPeriodChange() {
  const el = document.getElementById('trn-pt'); if (!el || !trnWiz) return;
  if (el.value === '1') { trnWiz.periodKey = 'delen'; trnWiz.numQuarters = 1; }
  else if (PERIOD_TYPES[el.value]) { trnWiz.periodKey = el.value; trnWiz.numQuarters = PERIOD_TYPES[el.value].count; }
  const qd = document.getElementById('trn-qd'); if (!qd) return;
  const def = DUR_DEFAULT[trnWiz.periodKey] || tournamentPeriods(trnWiz).quarterDuration;
  trnWiz.quarterDuration = def;
  qd.innerHTML = durOptsHtml(trnWiz.periodKey, def);
  const ci = document.getElementById('trn-qd-custom');
  if (ci) { ci.style.display = qd.value === '0' ? '' : 'none'; if (qd.value !== '0') ci.value = ''; }
}
function captureTrnStep1() {
  const v = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const ts = document.getElementById('trn-team-sel'); if (ts) trnWiz.teamId = ts.value;
  trnWiz.name = (v('trn-name') || '').trim();
  trnWiz.date = v('trn-date');
  trnWiz.location = (v('trn-location') || '').trim();
  const mt = document.getElementById('trn-matchtype'); if (mt) trnWiz.matchType = mt.value;
  // Standaardduur. Zelfde vertaling als readTrnPeriodSel(): "1 blok" is periodKey 'delen' met
  // numQuarters 1, de andere keuzes halen hun aantal uit PERIOD_TYPES.
  const ptEl = document.getElementById('trn-pt');
  if (ptEl) {
    if (ptEl.value === '1') { trnWiz.periodKey = 'delen'; trnWiz.numQuarters = 1; }
    else if (PERIOD_TYPES[ptEl.value]) { trnWiz.periodKey = ptEl.value; trnWiz.numQuarters = PERIOD_TYPES[ptEl.value].count; }
    trnWiz.quarterDuration = readDur('trn-qd', 'trn-qd-custom', tournamentPeriods(trnWiz).quarterDuration);
  }
  trnWiz.trainer = readStaffPicker('trn', 'trn', trnWiz.trainer);
  trnWiz.responsible = readStaffPicker('trn', 'resp', trnWiz.responsible);
  // Alleen overschrijven als het veld op dit scherm staat (stap 1) — anders zou stap 2 het wissen.
  if (document.getElementById('trn-standing')) trnWiz.standing = (v('trn-standing') || '').trim();
  if (document.getElementById('trn-pts-win')) {
    // Leeg of onzin laten terugvallen op de standaard van dat veld, i.p.v. op NaN.
    const d = tournamentPoints(trnWiz);
    const num = (id, def) => { const n = parseInt(v(id), 10); return Number.isFinite(n) && n >= 0 ? Math.min(99, n) : def; };
    trnWiz.points = { win: num('trn-pts-win', d.win), draw: num('trn-pts-draw', d.draw), drawNil: num('trn-pts-drawnil', d.drawNil), loss: num('trn-pts-loss', d.loss) };
  }
}
function trnWizNext() {
  if (trnWiz.step === 1) {
    captureTrnStep1();
    if (!trnWiz.name) { showToast('Geef het tornooi een naam.', 'err'); return; }
    if (!trnWiz.teamId) { showToast('Maak eerst een ploeg aan.', 'err'); return; }
    // poolTeamId enkel bijwerken als de herbouw echt gelukt is — anders blijft de mismatch staan
    // en probeert de app het opnieuw zodra het rooster wél gekend is.
    if (trnWiz.poolTeamId !== trnWiz.teamId && trnWizBuildPool()) trnWiz.poolTeamId = trnWiz.teamId;
    trnWiz.step = 2; render();
  }
}
function trnWizBack() { if (trnWiz.step > 1) { trnWiz.step--; render(); } }
// Signatuur van alles wat je in deze wizard kan ingeven. Zo vraagt trnWizLeave() enkel om
// bevestiging als er écht iets gewijzigd is: bij het bewerken van een bestaand tornooi is de naam
// altijd ingevuld, dus "is er iets ingevuld?" zou altijd waar zijn en bij elke terugtik zeuren.
function trnWizSig() {
  if (!trnWiz) return '';
  return JSON.stringify([trnWiz.name, trnWiz.date, trnWiz.location, trnWiz.matchType, trnWiz.trainer,
    trnWiz.responsible, trnWiz.standing, trnWiz.points, trnWiz.teamId, tournamentPeriods(trnWiz),
    // Enkel wie effectief gekozen is: bij een nieuw tornooi is de pool op stap 1 nog leeg en wordt
    // hij pas op stap 2 opgebouwd (allemaal 'none'). Zonder deze filter zou dat alleen al als een
    // wijziging tellen.
    (trnWiz.pool || []).filter(p => p.sel && p.sel !== 'none')
      .map(p => [p.pid, p.sel, p.absentReason || '', p.number || '']).sort()]);
}
function trnWizLeave() {
  // Stap 1 staat nog in de DOM: eerst overnemen, anders ziet de signatuur een net getypte naam niet.
  if (trnWiz && trnWiz.step === 1 && document.getElementById('trn-name')) captureTrnStep1();
  const bestemming = currentTournament ? 'tournament' : 'tournaments';
  if (trnWiz && trnWiz._sig && trnWizSig() !== trnWiz._sig) {
    openModal(`<h3>Wijzigingen niet bewaren?</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">Wat je hier aanpaste aan ${trnWiz.isNew ? 'dit nieuwe tornooi' : 'de selectie of de info'} gaat verloren.</p>
      <button class="btn btn-red" onclick="closeModal();trnWiz=null;go('${bestemming}')">Verlaten zonder bewaren</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Blijven</button>`);
    return;
  }
  trnWiz = null; go(bestemming);
}
function setTrnSel(pid, val) {
  const p = trnWiz.pool.find(x => x.pid === pid); if (!p) return;
  p.sel = (p.sel === val) ? 'none' : val; // tweede tik = terug naar niet-geselecteerd (de standaard)
  if (p.sel !== 'absent') p.absentReason = '';
  render();
}
function setTrnPoolNum(pid, val) { const p = trnWiz.pool.find(x => x.pid === pid); if (p) p.number = val; }
function setTrnAbsentReason(pid, val) { const p = trnWiz.pool.find(x => x.pid === pid); if (p) { p.absentReason = val; render(); } }
// Eigen guard, ook al zijn alle UI-paden hierheen al afgeschermd: deze functie schrijft een tornooi
// weg (lokaal én naar de cloud), dus ze mag niet enkel op de knoppen vertrouwen.
async function saveTournamentWiz() {
  if (!canManage() || !trnWiz) return;
  // Wie al in de bewaarde selectie stond, houdt zijn addedAt; wie er nu bij komt krijgt er een.
  // De verslagen van wedstrijden die toen al gespeeld waren, laten hem daarmee buiten "niet
  // geselecteerd" (zie selectionGroups). Een tornooi dat nog nooit bewaard is (nieuw) krijgt geen
  // stempels: dan was iedereen er van het begin bij.
  const bestaand = trnWiz.isNew ? new Map()
    : new Map(tournamentSquadList(tournamentById(trnWiz.id) || {}).map(s => [s.pid || s.srcId || s.name, s.addedAt || null]));
  const stempel = p => {
    if (trnWiz.isNew) return {};
    const k = p.pid || p.srcId || p.name;
    if (bestaand.has(k)) { const a = bestaand.get(k); return a ? { addedAt: a } : {}; }
    return { addedAt: Date.now() };
  };
  const squad = {
    players: trnWiz.pool
      .filter(p => p.sel === 'mee' || p.sel === 'absent')
      .map(p => Object.assign(stempel(p), { pid: p.pid, srcId: p.srcId, globalId: p.srcGlobalId || null, name: p.name, number: p.number, pos: p.pos, side: p.side || '', sel: p.sel, absentReason: p.sel === 'absent' ? (p.absentReason || '') : '',
        // Gasten (andere ploeg of losse speler) horen bij de dagselectie zelf, niet bij het rooster.
        // Zo blijven de selectiegroepen, speeltijd, verslag en PDF vanzelf kloppen.
        guest: !!p.guest, fromName: p.guest ? (p.fromName || '') : '' })),
  };
  const team = teamById(trnWiz.teamId);
  const obj = {
    id: trnWiz.id, name: trnWiz.name, date: trnWiz.date, location: trnWiz.location,
    teamId: trnWiz.teamId, teamName: team ? team.name : '',
    matchType: trnWiz.matchType || '8v8',
    // Standaardduur van de dag (zie tournamentPeriods): altijd genormaliseerd wegschrijven, zodat
    // een tornooi van vóór v0.17.4 de velden krijgt zodra je het bewerkt.
    periodKey: tournamentPeriods(trnWiz).periodKey,
    numQuarters: tournamentPeriods(trnWiz).numQuarters,
    quarterDuration: tournamentPeriods(trnWiz).quarterDuration,
    trainer: trnWiz.trainer || '', responsible: trnWiz.responsible || '',
    standing: trnWiz.standing || '', points: tournamentPoints(trnWiz), squad,
  };
  // Is de standaardduur gewijzigd? Dan vragen we achteraf of de al geplande wedstrijden mee moeten
  // (zie vraagDuurToepassen). Vóór het opslaan bepalen, want daarna is de oude waarde weg.
  const vorige = tournamentPeriods(tournamentById(trnWiz.id));
  const nieuwe = tournamentPeriods(obj);
  const duurGewijzigd = !trnWiz.isNew
    && (vorige.numQuarters !== nieuwe.numQuarters || vorige.quarterDuration !== nieuwe.quarterDuration || vorige.periodKey !== nieuwe.periodKey);
  saveTournament(obj); // upsert lokaal + enkel dit ene tornooi naar de cloud
  currentTournament = obj; trnWiz = null;
  await go('tournament');
  if (duurGewijzigd) vraagDuurToepassen(obj);
}
// De standaardduur van het tornooi is net gewijzigd: aanbieden om de al GEPLANDE wedstrijden mee te
// zetten. Enkel geplande — bij een lopende of gespeelde wedstrijd zijn de blokken al afgewerkt en
// zou een andere duur de speelminuten en het verslag onbetrouwbaar maken.
async function vraagDuurToepassen(t) {
  const gepland = (await dbAll()).filter(m => m.tournamentId === t.id && m.status === 'planned');
  if (!gepland.length) return;
  const p = tournamentPeriods(t);
  const zelfde = m => m.numQuarters === p.numQuarters && m.quarterDuration === p.quarterDuration;
  const teWijzigen = gepland.filter(m => !zelfde(m));
  if (!teWijzigen.length) return; // ze stonden al zo — niets te vragen
  const n = teWijzigen.length;
  openModal(`<h3>${icI(IC.timer)} Ook de geplande wedstrijden?</h3>
    <p style="text-align:center;color:var(--txt2);margin-bottom:6px">De standaardduur van dit tornooi staat nu op <b>${tournamentPeriodsLabel(t)}</b>.
    ${n === 1 ? 'Eén geplande wedstrijd heeft' : `${n} geplande wedstrijden hebben`} nog een andere duur:</p>
    <p style="text-align:center;font-size:13px;color:var(--txt2);margin-bottom:16px">${teWijzigen.map(m => `${esc(m.opponent || 'Wedstrijd')} (${m.numQuarters} × ${m.quarterDuration} min)`).join('<br>')}</p>
    <button class="btn btn-green" onclick="pasDuurToe('${t.id}')">${icI(IC.check)} Ja, ${n === 1 ? 'die wedstrijd' : 'die ' + n + ' wedstrijden'} aanpassen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Nee, laten staan</button>`);
}
async function pasDuurToe(trnId) {
  const t = tournamentById(trnId); if (!t) { closeModal(); return; }
  const p = tournamentPeriods(t);
  const gepland = (await dbAll()).filter(m => m.tournamentId === trnId && m.status === 'planned');
  let n = 0;
  for (const m of gepland) {
    if (m.numQuarters === p.numQuarters && m.quarterDuration === p.quarterDuration && m.periodKey === p.periodKey) continue;
    m.periodKey = p.periodKey; m.numQuarters = p.numQuarters; m.quarterDuration = p.quarterDuration;
    await dbSave(m);
    n++;
  }
  closeModal();
  showToast(n === 1 ? 'Eén wedstrijd aangepast.' : `${n} wedstrijden aangepast.`, 'ok');
  render();
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
  const teams = trnTeamCandidates();
  // Een tornooi hoort bij de ploeg waarin je het aanmaakt, dus normaal is er niets te kiezen:
  // de ploeg staat er als vaste regel. Bij een bestaand tornooi is wisselen zelfs verkeerd — de
  // al aangemaakte wedstrijden blijven bij de oude ploeg staan, dus dat wordt half werk. De
  // keuzelijst blijft enkel over waar er écht geen context is: lokale modus met meerdere ploegen
  // en het homescherm op "Alle ploegen".
  const vast = teamById(trnWiz.teamId);
  const teamSel = (trnWiz.isNew && teams.length > 1)
    ? `<select id="trn-team-sel" onchange="trnWizTeamChange()">${teams.map(t => `<option value="${t.id}" ${trnWiz.teamId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select>`
    : vast
      ? `<div style="font-size:15px;font-weight:600;padding:6px 0">${esc(vast.name)}</div>`
      : teams.length
        ? `<div style="font-size:15px;font-weight:600;padding:6px 0">${esc(teams[0].name)}</div>`
        : `<div style="font-size:14px;color:var(--txt2);padding:6px 0">Nog geen ploegen. <a onclick="go('teams')" style="color:var(--grn);font-weight:700;cursor:pointer">Maak eerst een ploeg aan →</a></div>`;
  const selectedTeam = vast || (teams.length ? teams[0] : null);
  return `<div class="card">
    <div class="fg"><label>Naam van het tornooi</label><input id="trn-name" type="text" placeholder="bv. Paastornooi Gent" value="${esc(trnWiz.name)}" autocomplete="off"></div>
    <div class="fg"><label>Ploeg</label>${teamSel}</div>
    <div class="fg"><label>Datum</label><input id="trn-date" type="date" value="${esc(trnWiz.date)}"></div>
    <div class="fg"><label>Locatie</label><input id="trn-location" type="text" placeholder="bv. Sportpark Gent" value="${esc(trnWiz.location)}" autocomplete="off"></div>
    <div class="fg"><label>Type wedstrijd</label><select id="trn-matchtype">${['3v3','5v5','8v8','11v11'].map(t=>`<option value="${t}" ${(trnWiz.matchType||'8v8')===t?'selected':''}>${t.replace('v',' tegen ')}</option>`).join('')}</select></div>
    ${(() => {
      // Standaardduur van de dag. Op een tornooi spelen alle wedstrijden even lang, dus geef je dat
      // hier één keer in i.p.v. bij elke wedstrijd opnieuw; de wedstrijdwizard vult ze voor en laat
      // afwijken toe (een halve finale van 2 × 15' bijvoorbeeld).
      const p = tournamentPeriods(trnWiz);
      const vast = DURATIONS[p.periodKey] || [15];
      const eigen = !vast.includes(p.quarterDuration);
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="fg"><label>Aantal blokken</label>
          <select id="trn-pt" onchange="trnDefPeriodChange()"><option value="1" ${p.numQuarters===1?'selected':''}>1 blok</option>${['helften','delen','kwarten'].map(k => `<option value="${k}" ${p.numQuarters!==1&&p.periodKey===k?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
        <div class="fg"><label>Duur van een blok</label>
          <select id="trn-qd" onchange="onDurChange('trn-qd','trn-qd-custom')">${durOptsHtml(p.periodKey, p.quarterDuration)}</select>
          <input id="trn-qd-custom" type="number" min="1" max="99" placeholder="min." style="margin-top:6px;${eigen?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;color:var(--txt);background:var(--card);-webkit-appearance:none" value="${eigen?p.quarterDuration:''}"></div>
      </div>
      <div style="font-size:11px;color:var(--txt2);margin:-6px 0 12px">Geldt als standaard voor elke nieuwe wedstrijd van dit tornooi. Per wedstrijd kan je er nog van afwijken.</div>`;
    })()}
    ${staffPickerHtml('trn', 'trn', teamTrainerNames(selectedTeam), trnWiz.trainer)}
    ${staffPickerHtml('trn', 'resp', teamResponsibleNames(selectedTeam), trnWiz.responsible)}
    <div class="fg"><label>Eindstand (optioneel)</label>
      <input id="trn-standing" type="text" value="${esc(trnWiz.standing||'')}" placeholder="bv. 3e van 8" autocomplete="off">
      <div style="font-size:11px;color:var(--txt2);padding-top:4px">Vul je zelf in na het tornooi — de app kent de uitslagen van de andere ploegen niet.</div>
    </div>
    ${(() => { const p = tournamentPoints(trnWiz);
      // Vier vakjes in een 2×2-raster i.p.v. drie op een rij: op een smartphone werden vier kolommen
      // te smal voor label én invoervakje. "Gelijk 0-0" apart, want sommige tornooien belonen een
      // 1-1 anders dan een 0-0; laat je het gelijk aan "Gelijk met doelpunten", dan blijft alles
      // zoals vroeger en toont de app gewoon het vertrouwde 3/1/0.
      const vak = (id, lbl, val) => `<div><div style="font-size:11px;color:var(--txt2);padding-bottom:2px">${lbl}</div><input id="${id}" type="number" min="0" max="99" inputmode="numeric" value="${val}"></div>`;
      return `<div class="fg"><label>Punten per wedstrijd</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${vak('trn-pts-win', 'Winst', p.win)}
        ${vak('trn-pts-draw', 'Gelijk mét doelpunten', p.draw)}
        ${vak('trn-pts-drawnil', 'Gelijk 0-0', p.drawNil)}
        ${vak('trn-pts-loss', 'Verlies', p.loss)}
      </div>
      <div style="font-size:11px;color:var(--txt2);padding-top:4px">Verschilt per tornooi (3/1/0, 2/1/0, …). Telt een <b>0-0</b> even zwaar als een 1-1? Vul dan bij allebei hetzelfde in. Zet alles op 0 als er niet op punten gespeeld wordt — dan valt de puntenregel weg in het verslag.</div>
    </div>`; })()}
  </div>
  <button class="btn btn-green" onclick="trnWizNext()">Volgende → Selectie</button>
  <button class="btn btn-orgpale" onclick="saveTournamentWizStep1Only()" style="margin-top:8px">${trnWiz.isNew ? icI(IC.calendar) + ' Opslaan zonder selectie' : icI(IC.check) + ' Opslaan'}</button>`;
}
function renderTrnStep2() {
  const team = teamById(trnWiz.teamId);
  const mee = trnWiz.pool.filter(p => p.sel === 'mee').length;
  const ab  = trnWiz.pool.filter(p => p.sel === 'absent').length;
  const own = trnWiz.pool.filter(p => !p.guest), guests = trnWiz.pool.filter(p => p.guest);
  const selRow2 = p => `<div class="selrow">
    <input type="number" class="pn-inp" value="${esc(p.number)}" placeholder="" onchange="setTrnPoolNum('${p.pid}',this.value)" inputmode="numeric" aria-label="Rugnummer">
    <div class="nm">${esc(p.name)}<small>${p.guest ? 'Gast · ' + esc(p.fromName || 'andere ploeg') : (posDisplay(p) || '—')}</small>
      ${p.sel === 'absent' ? absentReasonSelect(p.pid, p.absentReason || '', 'setTrnAbsentReason') : ''}</div>
    <div class="seg">
      <button class="${p.sel==='mee'?'basis':''}" onclick="setTrnSel('${p.pid}','mee')">Mee</button>
      <button class="${p.sel==='absent'?'absent':''}" onclick="setTrnSel('${p.pid}','absent')" title="Niet beschikbaar — telt mee in het aanwezigheids-%">NB</button>
    </div></div>`;
  return `
    <div class="card" style="display:flex;gap:10px;text-align:center;margin-bottom:12px">
      <div style="flex:1"><div style="font-size:22px;font-weight:900;color:var(--grn)">${mee}</div><div style="font-size:11px;color:var(--txt2)">MEE</div></div>
      ${ab ? `<div style="flex:1"><div style="font-size:22px;font-weight:900;color:var(--rd)">${ab}</div><div style="font-size:11px;color:var(--txt2)">NIET BESCH.</div></div>` : ''}
    </div>
    <div class="sec">${esc(team ? team.name : 'Ploeg')}</div>
    <div style="font-size:12px;color:var(--txt2);padding:0 2px 6px"><b>Niets aanduiden = niet geselecteerd</b> (telt nergens mee). <b>Mee</b> = in de tornooiselectie, <b style="color:var(--rd)">NB</b> = niet beschikbaar (telt mee in het aanwezigheids-%); nog eens op dezelfde knop tikken maakt de keuze weer ongedaan. Bij <b>NB</b> kan je een reden kiezen; <b>speelt elders</b> laat die wedstrijd niet als gemist tellen.</div>
    <div class="card">${own.length ? selRowHead('Speler · voorkeurspositie') + own.map(selRow2).join('') : `<p style="color:var(--txt2);font-size:14px">${rosterEmptyText('Deze ploeg heeft geen spelers.')}</p>`}</div>
    ${guests.length ? `<div class="sec">Gastspelers</div><div class="card">${selRowHead('Speler · van welke ploeg')}${guests.map(selRow2).join('')}</div>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-orgpale" onclick="addGuestsModal()">+ Speler van andere ploeg</button>
      <button class="btn btn-pale" onclick="addLoosePlayerModal()">+ Losse speler</button>
    </div>
    <div class="wiz-nav">
      <button class="btn btn-gray" onclick="trnWizBack()">← Vorige</button>
      <button class="btn btn-green" onclick="saveTournamentWiz()">${icI(IC.check)}Tornooi opslaan</button>
    </div>`;
}

// ----- Tornooimatch wizard -----
function addTournamentMatch(trnId) {
  if (!canManage()) return;
  const t = tournamentById(trnId); if (!t) return;
  // Ook al is de knop verborgen bij een afgesloten tornooi: de handler weigert het zelf, zodat een
  // scherm dat nog van vóór het afsluiten dateert er geen wedstrijd meer in kan schuiven.
  if (tournamentClosed(t)) { showToast('Dit tornooi is afgesloten. Heropen het om een wedstrijd toe te voegen.', 'err'); return; }
  const team = teamById(t.teamId);
  const allSquadPlayers = tournamentSquadMee(t);
  // Guard op wie effectief MEEGAAT, niet op de volledige squad: staat iedereen op "niet
  // beschikbaar", dan is de squad wel gevuld maar de pool leeg, en liep je door naar een
  // selectiescherm zonder één speler.
  if (!allSquadPlayers.length) {
    const iedereenNb = tournamentSquadList(t).length > 0;
    openModal(`<h3>Selectie ontbreekt</h3>
      <p style="text-align:center;color:var(--txt2);margin-bottom:16px">${iedereenNb
        ? 'Elke speler in dit tornooi staat op <b>niet beschikbaar</b>, dus er is niemand om op te stellen. Pas de selectie aan.'
        : 'Geef eerst een selectie in voor dit tornooi voor je wedstrijden toevoegt.'}</p>
      <button class="btn btn-green" onclick="closeModal();editTournament('${trnId}')">${icI(IC.edit)} Selectie aanpassen</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
    return;
  }
  // Iedereen die meegaat naar het tornooi staat in de selectie van deze wedstrijd; wie start volgt uit
  // de opstelling. Hier werden voordien de eerste N van de dagselectie als basisspeler aangeduid
  // (N uit het matchType) — dat is een gok op alfabetische volgorde, en sinds v0.33.0 beslist de app
  // niet meer wie begint. Allemaal 'bank' = geselecteerd, nog geen plaats op het veld.
  const matchType = t.matchType || '8v8';
  const pool = allSquadPlayers.map(s => ({
    pid: uid(), srcId: s.srcId, srcGlobalId: s.globalId || null, name: s.name, number: s.number, pos: s.pos, side: s.side || '',
    fromName: s.guest ? (s.fromName || '') : (team ? team.name : ''), guest: !!s.guest,
    sel: 'bank', slot: null,
  }));
  const now = new Date();
  wiz = {
    step: 1, trnMode: true, tournamentId: trnId,
    teamId: t.teamId, teamNameFallback: team ? team.name : '',
    opponent: '', date: t.date || now.toISOString().split('T')[0],
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    location: t.location || 'Thuis', matchType,
    // Duur uit het tornooi: op een tornooidag spelen alle wedstrijden even lang. Stond hier
    // hardgecodeerd op 1 × 20', waardoor je het bij élke wedstrijd opnieuw moest omzetten.
    // tournamentPeriods valt op diezelfde 1 × 20' terug voor tornooien zonder die velden.
    periodKey: tournamentPeriods(t).periodKey,
    quarterDuration: tournamentPeriods(t).quarterDuration,
    numQuarters: tournamentPeriods(t).numQuarters,
    competition: 'Tornooi', matchday: '', referee: '', jersey: '', venue: '',
    trainer: t.trainer || '', responsible: t.responsible || '',
    pool, poolTeamId: t.teamId, formationIndex: 0, selPlace: null,
  };
  go('new');
}
async function cloneTournamentMatch(matchId, trnId) {
  if (!canManage()) return;
  const src = await dbGet(matchId);
  if (!src) return;
  const t = tournamentById(trnId); if (!t) return;
  if (tournamentClosed(t)) { showToast('Dit tornooi is afgesloten. Heropen het om een wedstrijd toe te voegen.', 'err'); return; }
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
    // Zelfde volgorde als elders (detail-pdf.js): een bewaarde voorkeurspositie is fijner dan de
    // lijn, en normPos vangt een oude lijnnaam op.
    pos: p.pos || p.line || '',
    side: p.side || '',
    fromName: src.teamName || (team ? team.name : ''),
    guest: !!p.guest,
    sel: p.starting ? 'basis' : 'bank',
    slot: null,
    // Zie poolPlekTerug in core.js: de bewaarde roosterplek gaat voor, x/y binnen de lijn is de terugval.
    _x: p.x, _y: p.y, _posCodeVeld: p.posCodeVeld || spelerGridCode(p) || null, _line: p.line || '',
  }));
  // Tornooispelers die niet in de bronmatch stonden (die wedstrijd niet geselecteerd) toch in de
  // pool opnemen als 'none' — anders zijn ze in de kloon enkel via de gast-modal (fout gelabeld als
  // gast) terug toe te voegen. Enkel wie meegaat: NB-spelers horen hier niet meer bij.
  const _sqList = tournamentSquadMee(t);
  const _usedSrc = new Set(pool.map(p => p.srcId).filter(Boolean));
  _sqList.forEach(s => {
    if (s.srcId ? _usedSrc.has(s.srcId) : pool.some(p => (p.name || '').trim() === (s.name || '').trim())) return;
    pool.push({ pid: uid(), srcId: s.srcId || null, srcGlobalId: s.globalId || null, name: s.name, number: s.number || '', pos: s.pos || '', side: s.side || '', fromName: s.guest ? (s.fromName || '') : (team ? team.name : ''), guest: !!s.guest, sel: 'none', slot: null });
  });
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
    pool, poolTeamId: t.teamId, formationIndex: fi, selPlace: null,
  };
  // Basisspelers terugplaatsen op hun roosterplek, met dezelfde regel als overal (poolPlekTerug in
  // core.js). Hier stond een exacte match op x/y in de formatie, die sinds v0.34.0 nooit meer lukt:
  // de kloon opende dus met een leeg veld (audit 23-08-2026).
  poolPlekTerug(wiz.pool.filter(p => p.sel === 'basis'));
  // Kapitein meenemen, zoals editMatchWizard doet: bij een tornooi is dat elke wedstrijd dezelfde
  // speler, dus hem in elke kloon opnieuw aanduiden was pure herhaling. De eerste pool-entries
  // volgen de volgorde van src.players, dus de index klopt.
  if (src.captainId) {
    const ci = (src.players || []).findIndex(p => p.id === src.captainId);
    if (ci >= 0 && wiz.pool[ci]) wiz.captainPid = wiz.pool[ci].pid;
  }
  go('new');
}
// Regeltje onder een veld van de tornooimatch-wizard: wat zet het tornooi hier als standaard? Zowel
// het format als het aantal blokken en de blokduur worden bij een nieuwe wedstrijd van het tornooi
// overgenomen, en zonder vermelding zag je niet waar die voorgevulde waarden vandaan kwamen.
// Bewust een vaststelling en geen "overgenomen van…": de selectors werken de DOM bij zonder opnieuw
// te renderen, dus een zin die naar de huidige keuze verwijst zou na één wijziging niet meer kloppen.
function trnStandaardHint(waardeFn, staart) {
  const t = (wiz && wiz.tournamentId) ? tournamentById(wiz.tournamentId) : null;
  if (!t) return '';
  const val = waardeFn(t);
  if (!val) return '';
  return `<div style="font-size:11px;color:var(--txt2);margin:-2px 0 12px">Standaard van dit tornooi: <b>${esc(val)}</b>.${staart ? ' ' + staart : ''}</div>`;
}
function renderTrnMatchStep1() {
  return `<div class="card">
    <div class="fg"><label>Tegenstander</label><input id="n-opp" type="text" placeholder="Naam tegenstander..." autocomplete="off" value="${esc(wiz.opponent)}"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Datum</label><input id="n-date" type="date" value="${wiz.date}"></div>
      <div class="fg"><label>Startuur</label><input id="n-time" type="time" value="${wiz.time}"></div>
    </div>
    <div class="fg" style="margin-bottom:6px"><label>Format</label>
      <select id="n-type" onchange="trnWizTypeChange()">
        ${['3v3','5v5','8v8','11v11'].map(tp => `<option value="${tp}" ${wiz.matchType===tp?'selected':''}>${tp.replace('v',' tegen ')}</option>`).join('')}
      </select></div>
    ${trnStandaardHint(t => t.matchType ? (t.matchType || '').replace('v', ' tegen ') : '')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Aantal blokken</label>
        <select id="n-pt" onchange="trnPeriodChange()"><option value="1" ${wiz.numQuarters===1?'selected':''}>1 blok</option>${['helften','delen','kwarten'].map(k => `<option value="${k}" ${wiz.numQuarters!==1&&wiz.periodKey===k?'selected':''}>${PERIOD_TYPES[k].count} ${PERIOD_TYPES[k].plural}</option>`).join('')}</select></div>
      <div class="fg"><label>Duur van een blok</label>
        <select id="n-qd" onchange="onDurChange('n-qd','n-qd-custom')">${durOptsHtml(wiz.periodKey, wiz.quarterDuration)}</select>
        ${(() => {
          // Vrije duur zichtbaar mét het getal erin, zoals in de gewone wizard. Stond hier
          // hardgecodeerd verborgen en leeg, dus een tornooiwedstrijd met blokken van 12 min toonde
          // bij bewerken "Vrij…" zonder dat je zag hoeveel minuten het was.
          const vast = DURATIONS[wiz.periodKey] || [15];
          const eigen = !!wiz.quarterDuration && !vast.includes(wiz.quarterDuration);
          return `<input id="n-qd-custom" type="number" min="1" max="99" placeholder="min." style="margin-top:6px;${eigen?'':'display:none'};width:100%;padding:10px;border:2px solid var(--bdr);border-radius:8px;font-size:16px;color:var(--txt);background:var(--card);-webkit-appearance:none" value="${eigen?wiz.quarterDuration:''}">`;
        })()}</div>
    </div>
    ${trnStandaardHint(tournamentPeriodsLabel, 'Je kan er voor deze wedstrijd van afwijken.')}
  </div>
  ${/* Zelfde keuze als in de gewone wizard (wizStep1): herbewerken is enkel dit scherm. */ ''}
  ${wiz.editId
    ? `<button class="btn btn-green" onclick="finishStep1Only()">${icI(IC.check)} Opslaan</button>`
    : `<button class="btn btn-green" onclick="trnMatchNext()">Volgende → Selectie</button>
  <button class="btn btn-orgpale" onclick="finishStep1Only()" style="margin-top:8px">${icI(IC.calendar)} Plannen zonder opstelling</button>`}`;
}
function trnWizTypeChange() {
  wiz.matchType = document.getElementById('n-type').value;
  wiz.formationIndex = 0;
  wiz.pool.forEach(p => p.slot = null);
}
// De blokken-selector van een tornooimatch stuurt periodKey ÉN numQuarters (de gewone wizard
// leidt numQuarters af uit periodKey, maar een tornooimatch kan ook "1 blok" zijn — voordien
// bleef numQuarters altijd 1 hangen en was de selector een dode knop die "3 delen" toonde).
function readTrnPeriodSel() {
  const el = document.getElementById('n-pt'); if (!el || !wiz) return;
  if (el.value === '1') { wiz.periodKey = 'delen'; wiz.numQuarters = 1; }
  else if (PERIOD_TYPES[el.value]) { wiz.periodKey = el.value; wiz.numQuarters = PERIOD_TYPES[el.value].count; }
}
function trnPeriodChange() {
  readTrnPeriodSel();
  const qd = document.getElementById('n-qd');
  if (!qd) return;
  // Terugvallen op de standaardduur van de nieuwe blokvorm, zoals onPeriodChange() in de gewone
  // wizard. Voordien bleef de oude duur staan: koos je "2 helften" na 20 minuten, dan zat 20 niet
  // in de lijst [30, 45] en sprong de selector op "Vrij…" met een leeg vakje — waarna readDur stil
  // terugviel op 20 en je 2×20' opsloeg in plaats van 2×30'.
  const def = DUR_DEFAULT[wiz.periodKey] || wiz.quarterDuration;
  wiz.quarterDuration = def;
  qd.innerHTML = durOptsHtml(wiz.periodKey, def);
  const ci = document.getElementById('n-qd-custom');
  if (ci) { ci.style.display = qd.value === '0' ? '' : 'none'; if (qd.value !== '0') ci.value = ''; }
}
function trnMatchNext() {
  wiz.opponent = (document.getElementById('n-opp')?.value || '').trim();
  wiz.date = document.getElementById('n-date')?.value || wiz.date;
  wiz.time = document.getElementById('n-time')?.value || wiz.time;
  wiz.matchType = document.getElementById('n-type')?.value || wiz.matchType;
  readTrnPeriodSel();
  wiz.quarterDuration = readDur('n-qd', 'n-qd-custom', wiz.quarterDuration);
  if (!wiz.opponent) { showToast('Vul de naam van de tegenstander in.', 'err'); return; }
  wiz.step = 2; render();
}

