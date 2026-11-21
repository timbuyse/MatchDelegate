// ===================== HOCKEY BELGIUM: KALENDER INLEZEN =====================
// De kalender op hockey.be komt uit de WordPress-plugin "Sportlink Connect", die zijn gegevens via een
// eigen JSON-endpoint geeft. Zelfde opzet als de voetbalbond-import (import-cal.js): de app vraagt
// RECHTSTREEKS vanuit de browser, zonder tussenserver. CORS laat dat toe (getest door Tim, 21-11-2026).
//
// DIT BESTAND BEVAT ENKEL HET LEZEN EN INTERPRETEREN. Geen scherm, geen opslag: elke functie hieronder
// is zuiver (of haalt enkel op), zodat ze los te testen valt. De schermen en het aanmaken van ploegen en
// wedstrijden komen erbovenop.
//
// WAT DE BRON GEEFT (bekeken op een echt antwoord van 21-11-2026):
//   autocomplete  -> { "0": { id: "CC6VG1L", label: "Indiana (DE PINTE)" }, cache: true }
//   program       -> { data: [ rij, ... ], columns: [...] }, met per rij ZEVEN cellen, allemaal stukjes HTML:
//        0  datum (dd/mm/jjjj) in een <span>, daaronder, na <br>, het TERREIN ("INDI 3 A1")
//        1  tijd "08:30:00"
//        2  competitie, platte tekst ("U9 Boys - Reg. 2 G")
//        3  thuisploeg: <span>clubnaam</span><br><strong>ploegcode</strong> soort ("U9B-3" "Outdoor")
//        4  logo van de thuisclub, als achtergrondafbeelding (de bestandsnaam is een vaste sleutel)
//        5  logo van de uitclub
//        6  uitploeg, zelfde opmaak als 3
//
// TWEE DINGEN IN DE GEGEVENS DIE DE IMPORT MOET OPVANGEN:
//   1. ELKE WEDSTRIJD STAAT ER TWEE KEER IN. Het hele antwoord herhaalt zich in dezelfde volgorde. Zonder
//      ontdubbelen zou elke wedstrijd dubbel aangemaakt worden. Sleutel: datum, tijd, competitie en beide
//      ploegen (zie hbeSleutel).
//   2. INTERNE WEDSTRIJDEN. Speelt Indiana U9B-3 tegen Indiana U9B-1, dan zijn beide ploegen van de club.
//      Voor elk van die twee ploegen is het een wedstrijd, met de andere als tegenstander.
//
// WELKE KANT VAN DE CLUB IS? Het antwoord noemt de clubnaam wel, maar twee clubs kunnen dezelfde naam
// dragen. Het logo is wél uniek. Omdat de vraag per club gesteld wordt, speelt de eigen club in ELKE rij
// mee: het logo dat het vaakst voorkomt, is dus het eigen logo (hbeEigenLogo).

const HBE_BASIS = 'https://hockey.be/wp-json/sportlink-api/cached';

// ---- Opvragen ----
async function hbeVraag(params, wat) {
  const url = HBE_BASIS + '?' + Object.entries(params).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  let r;
  try { r = await fetch(url); }
  catch (e) { throw new Error('Geen verbinding met Hockey Belgium. Kijk je internetverbinding na en probeer opnieuw.'); }
  if (!r.ok) throw new Error(`Hockey Belgium antwoordde niet zoals verwacht (${r.status}) bij ${wat}. Probeer het later opnieuw.`);
  try { return await r.json(); }
  catch (e) { throw new Error(`Het antwoord van Hockey Belgium bij ${wat} was onleesbaar. Probeer het later opnieuw.`); }
}
// Clubs zoeken op naam. De bron geeft een object met cijfersleutels ("0", "1", ...) plus "cache": true.
async function hbeClubZoek(term) {
  term = String(term || '').trim();
  if (term.length < 2) return [];
  const j = await hbeVraag({ endpoint: 'autocomplete', term }, 'het zoeken van de club');
  return Object.keys(j || {}).filter(k => /^\d+$/.test(k) && j[k] && j[k].id)
    .map(k => ({ id: String(j[k].id), label: String(j[k].label || j[k].value || j[k].id) }));
}
// Het seizoen waarin `nu` valt: van 1 augustus tot 31 juli. Hockey begint begin september, maar de
// kalender mag al eerder klaarstaan.
function hbeSeizoen(nu) {
  nu = nu || new Date();
  const jaar = nu.getMonth() >= 7 ? nu.getFullYear() : nu.getFullYear() - 1;
  return { van: `${jaar}-08-01`, tot: `${jaar + 1}-07-31` };
}
// De maanden tussen twee datums ("2026-08-01" tot "2027-07-31"), elk als { van, tot } met de eerste en de laatste dag.
function hbeMaanden(van, tot) {
  const uit = [], p = n => String(n).padStart(2, '0');
  const [y0, m0] = van.split('-').map(Number), [y1, m1] = tot.split('-').map(Number);
  let y = y0, m = m0;
  while (y < y1 || (y === y1 && m <= m1)) {
    const laatste = new Date(Date.UTC(y, m, 0)).getUTCDate();   // dag 0 van de volgende maand = laatste dag van deze
    uit.push({ van: `${y}-${p(m)}-01`, tot: `${y}-${p(m)}-${p(laatste)}` });
    m++; if (m > 12) { m = 1; y++; }
  }
  return uit;
}
// Het hele programma van een club in een periode, al gelezen en ontdubbeld.
// PER MAAND OPGEVRAAGD, NIET IN ÉÉN KEER (21-11-2026). De bron blijkt een groot bereik (een heel seizoen) leeg te
// kunnen beantwoorden, terwijl een week of een paar maanden wel rijen geeft. Per maand vragen is traag genoeg om
// te volstaan (twaalf kleine verzoeken) en valt niet om op die grens. Dat elke wedstrijd in de bron dubbel staat,
// vangt hbeLeesRijen toch al op, dus een rij die in twee antwoorden zit, telt maar één keer.
async function hbeProgramma(clubId, van, tot) {
  const maanden = hbeMaanden(van, tot);
  const antwoorden = await Promise.all(maanden.map(mnd =>
    hbeVraag({ lang: 'nl', endpoint: 'program', dump: '', clubid: clubId, facilityid: '', poolid: 0, subpool: 'A', from: mnd.van, to: mnd.tot }, 'het programma van ' + mnd.van.slice(0, 7))));
  const ruw = [];
  antwoorden.forEach(j => { if (j && Array.isArray(j.data)) j.data.forEach(r => ruw.push(r)); });
  const res = hbeLeesRijen(ruw);
  res.ontvangen = ruw.length;
  if (!res.rijen.length && ruw.length) { try { console.warn('Hockey Belgium: regels ontvangen maar geen enkele leesbaar. Eerste regel:', ruw[0]); } catch (e) {} }
  return res;
}

// ---- Lezen ----
// De HTML van de bron in een AFZONDERLIJK, onbeschreven document zetten: scripts lopen er niet, en
// afbeeldingen worden niet geladen. Enkel om er tekst uit te halen.
function hbeDoc(html) { return new DOMParser().parseFromString(String(html || ''), 'text/html'); }
function hbeTekst(el) { return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
// "21/11/2026" -> "2026-11-21", of null als het geen echte datum is.
function hbeDatum(txt) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(txt || '').trim());
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function hbeTijd(txt) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(txt || '').trim());
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}
// De bestandsnaam van het logo zonder uitbreiding: de vaste sleutel van een club.
function hbeLogoSleutel(html) {
  const m = /url\(([^)]+)\)/.exec(String(html || ''));
  if (!m) return '';
  const naam = m[1].replace(/["']/g, '').split('/').pop() || '';
  return naam.replace(/\.[a-z0-9]+$/i, '');
}
// Een ploegcel: <span>club</span><br><strong>code</strong> soort
function hbePloegCel(html) {
  const d = hbeDoc(html);
  const club = hbeTekst(d.querySelector('span'));
  const sterk = d.querySelector('strong');
  const code = hbeTekst(sterk);
  // De soort staat NA de code, als losse tekst ("Outdoor", "Trimmers").
  let soort = '';
  if (sterk) { let n = sterk.nextSibling; while (n) { if (n.nodeType === 3) soort += n.textContent; n = n.nextSibling; } }
  return { club, code, soort: soort.replace(/\s+/g, ' ').trim() };
}
// Eén rij van de bron. null als ze niet te lezen valt (geen datum, of een ploeg zonder naam).
function hbeLeesRij(rij) {
  if (!Array.isArray(rij) || rij.length < 7) return null;
  const d0 = hbeDoc(rij[0]);
  const datum = hbeDatum(hbeTekst(d0.querySelector('span')));
  // Het terrein is de tekst NA de <br>: zonder <span> blijft enkel die over.
  const span = d0.querySelector('span'); if (span) span.remove();
  const terrein = hbeTekst(d0.body);
  const thuis = hbePloegCel(rij[3]), uit = hbePloegCel(rij[6]);
  if (!datum || !thuis.club || !thuis.code || !uit.club || !uit.code) return null;
  return {
    datum, tijd: hbeTijd(rij[1]), terrein, competitie: String(rij[2] || '').trim(),
    thuis: Object.assign(thuis, { logo: hbeLogoSleutel(rij[4]) }),
    uit: Object.assign(uit, { logo: hbeLogoSleutel(rij[5]) }),
  };
}
function hbeSleutel(r) {
  return [r.datum, r.tijd, r.competitie, r.thuis.club, r.thuis.code, r.uit.club, r.uit.code].join('|');
}
// Alle rijen lezen en ontdubbelen. `overgeslagen` = rijen die niet te lezen vielen, `dubbel` = rijen die
// er al in zaten. Beide tellen mee zodat de import er eerlijk over kan zijn.
function hbeLeesRijen(data) {
  const gezien = new Set(), rijen = [];
  let overgeslagen = 0, dubbel = 0;
  (Array.isArray(data) ? data : []).forEach(raw => {
    const r = hbeLeesRij(raw);
    if (!r) { overgeslagen++; return; }
    const k = hbeSleutel(r);
    if (gezien.has(k)) { dubbel++; return; }
    gezien.add(k); rijen.push(r);
  });
  return { rijen, overgeslagen, dubbel };
}

// ---- De eigen club en haar ploegen ----
// Het logo dat in de meeste rijen voorkomt, want de eigen club speelt in elke rij mee. Bij een gelijke stand
// (te weinig rijen om te kiezen) geven we niets terug in plaats van te raden.
function hbeEigenLogo(rijen) {
  const tel = {};
  rijen.forEach(r => { [r.thuis.logo, r.uit.logo].forEach(l => { if (l) tel[l] = (tel[l] || 0) + 1; }); });
  const lijst = Object.entries(tel).sort((a, b) => b[1] - a[1]);
  if (!lijst.length) return '';
  if (lijst.length > 1 && lijst[0][1] === lijst[1][1]) return '';
  return lijst[0][0];
}
function hbeIsEigen(kant, eigenLogo) { return !!eigenLogo && kant.logo === eigenLogo; }
// De ploegen van de club: elke ploegcode die aan de eigen kant voorkomt, één keer. `soorten` zegt waar ze
// speelt (Outdoor, Indoor, Trimmers) — dezelfde ploeg speelt zowel veld als zaal.
function hbePloegen(rijen, eigenLogo) {
  const per = new Map();
  rijen.forEach(r => {
    [r.thuis, r.uit].forEach(kant => {
      if (!hbeIsEigen(kant, eigenLogo)) return;
      let p = per.get(kant.code);
      if (!p) { p = { code: kant.code, club: kant.club, soorten: new Set(), competities: new Set(), aantal: 0 }; per.set(kant.code, p); }
      if (kant.soort) p.soorten.add(kant.soort);
      if (r.competitie) p.competities.add(r.competitie);
      p.aantal++;
    });
  });
  return [...per.values()].map(p => ({ code: p.code, club: p.club, soorten: [...p.soorten], competities: [...p.competities], aantal: p.aantal }))
    .sort((a, b) => a.code.localeCompare(b.code, 'nl', { numeric: true }));
}
// De wedstrijden van ÉÉN ploeg, in de vorm die de app nodig heeft. Een interne wedstrijd (beide kanten van
// de club) telt voor elke van de twee ploegen, met de andere als tegenstander.
function hbeWedstrijdenVan(rijen, eigenLogo, code) {
  const uit = [];
  rijen.forEach(r => {
    const zijnThuis = hbeIsEigen(r.thuis, eigenLogo) && r.thuis.code === code;
    const zijnUit = hbeIsEigen(r.uit, eigenLogo) && r.uit.code === code;
    if (!zijnThuis && !zijnUit) return;
    const wij = zijnThuis ? r.thuis : r.uit, zij = zijnThuis ? r.uit : r.thuis;
    uit.push({
      datum: r.datum, tijd: r.tijd, terrein: r.terrein, competitie: r.competitie,
      thuis: zijnThuis, soort: wij.soort,
      tegenstander: `${zij.club} ${zij.code}`.trim(), tegenstanderClub: zij.club, tegenstanderCode: zij.code,
      intern: hbeIsEigen(zij, eigenLogo),
    });
  });
  return uit.sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
}
// De wedstrijden van een BUNDEL (alle labels van één leeftijd en geslacht), elk met het label van zijn eigen team in
// `eigenCode`. Een wedstrijd tussen twee labels van dezelfde bundel is één wedstrijd in het echt en wordt hier één
// wedstrijd (vanuit de thuisploeg gezien), niet twee. Spelen twee labels uit VERSCHILLENDE bundels tegen elkaar, dan
// krijgt elke bundel zijn eigen kant.
function hbeWedstrijdenVanBundel(rijen, eigenLogo, bundel) {
  const uit = [];
  rijen.forEach(r => {
    const thuisHier = hbeIsEigen(r.thuis, eigenLogo) && hbeBundelCode(r.thuis.code) === bundel;
    const uitHier = hbeIsEigen(r.uit, eigenLogo) && hbeBundelCode(r.uit.code) === bundel;
    if (!thuisHier && !uitHier) return;
    const kanten = (thuisHier && uitHier) ? [true] : [thuisHier];   // beide in de bundel: enkel de thuiskant
    kanten.forEach(thuis => {
      const wij = thuis ? r.thuis : r.uit, zij = thuis ? r.uit : r.thuis;
      uit.push({
        datum: r.datum, tijd: r.tijd, terrein: r.terrein, competitie: r.competitie,
        thuis, soort: wij.soort, eigenCode: wij.code,
        tegenstander: `${zij.club} ${zij.code}`.trim(), tegenstanderClub: zij.club, tegenstanderCode: zij.code,
        intern: hbeIsEigen(zij, eigenLogo),
      });
    });
  });
  return uit.sort((a, b) => (a.datum + a.tijd).localeCompare(b.datum + b.tijd));
}
// De bundels van de club: elke jeugdbundel één keer, met haar labels en het aantal wedstrijden.
function hbeBundels(rijen, eigenLogo) {
  const per = new Map();
  hbePloegen(rijen, eigenLogo).forEach(p => {
    const b = hbeBundelCode(p.code);
    if (!b) return;
    if (!per.has(b)) per.set(b, { code: b, labels: [] });
    per.get(b).labels.push(p.code);
  });
  return [...per.values()].map(b => Object.assign(b, { aantal: hbeWedstrijdenVanBundel(rijen, eigenLogo, b.code).length }))
    .sort((a, b) => a.code.localeCompare(b.code, 'nl', { numeric: true }));
}
// Veld of zaal volgens de soort in de bron. null = niet te zeggen (Trimmers, onbekend): dan geldt de
// standaard van de ploeg. Een inschatting: enkel "Indoor"/"Zaal" geeft zaal, enkel "Outdoor" geeft veld.
function hbeMatchTypeVoorSoort(soort) {
  if (/indoor|zaal/i.test(soort || '')) return '6v6';
  if (/outdoor|veld/i.test(soort || '')) return '11v11';
  return null;
}

// =============================================================================================
// HET SCHERM: PLOEGEN EN KALENDER VAN HOCKEY BELGIUM IN CLUBBEHEER
// =============================================================================================
// Eén knop voor de clubbeheerder: club opzoeken, de ploegen zien die uit het programma volgen, en met één tik
// de ploegen aanmaken én hun hele seizoenprogramma inlezen. Een tweede keer drukken voegt enkel toe wat er
// nieuw is en past aan wat verzet werd — er komen geen dubbels.
//
// ENKEL DE JEUGD (Tim, 21-11-2026): ploegcodes die met U en een leeftijd beginnen (U7B-3, U10G-2, U19B-1).
// Senioren, Masters, Trimmers en Fun League blijven buiten schot.
//
// WAAR DE KOPPELING STAAT: op de kern (de ploeg in de ploegenlijst van de cloudploeg), als `hbeClubId` en
// `hbeCode` — precies zoals de voetbalbond-koppeling (`rbfaClubId`). `clubs/<id>` is voor een clubbeheerder
// niet te beschrijven (enkel de eigenaar), en de Firebase-regels hoeven zo niet te veranderen.
// Het veld `hbeKey` op een wedstrijd is NIEUW en OPTIONEEL: het onthoudt van welke regel uit de kalender de
// wedstrijd komt, zodat een tweede keer inlezen kan ontdubbelen. Een wedstrijd zonder dat veld werkt gewoon.
//
// WEGSCHRIJVEN GEBEURT GERICHT, PER PLOEG, IN ÉÉN VERZOEK. Een wedstrijd van een andere cloudploeg gaat niet
// langs dbSave (dat schrijft naar de actieve ploeg): de club heeft tientallen ploegen en de beheerder is er
// geen lid van. Elke nieuwe wedstrijd heeft dezelfde vorm als die van impVoerUit (import-cal.js).

let hbeSt = null;

// Leeftijd uit een jeugdcode: "U7B-3" -> 7, "U10G-2" -> 10. null voor al de rest (H-2, D-4, T-1, JL-1).
function hbeJeugdLeeftijd(code) {
  const m = /^U(\d{1,2})[A-Z]?(-\d+)?$/i.exec(String(code || '').trim());
  return m ? parseInt(m[1], 10) : null;
}
// DE BUNDEL: een leeftijd met geslacht, zonder het nummer. "U7B-1", "U7B-2" en "U7B-3" zijn drie teams (labels) van
// dezelfde U7-jongensploeg (Tim, 21-11-2026). Eén ploeg in de app, en het label per wedstrijd in `subteam`, het
// bestaande "Ploeg-label": de wedstrijd toont dan "U7B (U7B-3)" en de statistieken filteren erop. Senioren en al wat geen
// jeugdcode is, geeft '' (die blijven toch buiten de import).
function hbeBundelCode(code) {
  const m = /^(U\d{1,2}[A-Z]?)-\d+$/i.exec(String(code || '').trim());
  return m ? m[1].toUpperCase() : '';
}
// De startwaarden van een jeugdploeg volgens de indeling van Hockey Belgium (tabel van Tim, 21-11-2026):
// U7-U8 3 tegen 3, U9 6 tegen 6, U10-U12 8 tegen 8, vanaf U14 11 tegen 11. Alleen de duur van U14 (2 x 30) en
// van het grote veld (2 x 35) komt uit het reglement; de rest is een startwaarde van 4 x 15.
function hbeVormVoorCode(code) {
  const n = hbeJeugdLeeftijd(code);
  if (n === null) return null;
  if (n <= 8) return { matchType: '3v3', periodKey: 'kwarten', dur: 15 };
  if (n === 9) return { matchType: '6v6', periodKey: 'kwarten', dur: 15 };
  if (n <= 12) return { matchType: '8v8', periodKey: 'kwarten', dur: 15 };
  if (n === 14) return { matchType: '11v11', periodKey: 'helften', dur: 30 };
  return { matchType: '11v11', periodKey: 'helften', dur: 35 };
}
// De sleutel van elke wedstrijd van één ploeg. Competitie + thuis/uit + tegenstander volstaat bijna; speelt
// een ploeg dezelfde tegenstander twee keer thuis in dezelfde competitie, dan telt een volgnummer. De DATUM
// zit er bewust niet in: wordt een wedstrijd verzet, dan hoort ze zichzelf terug te vinden en bijgewerkt te worden
// in plaats van dubbel te verschijnen.
function hbeWedstrijdSleutels(lijst) {
  const teller = {};
  lijst.forEach(w => {
    // Het eigen label hoort erin: binnen een bundel spelen meerdere labels tegen dezelfde tegenstander.
    const basis = [w.eigenCode || '', w.competitie, w.thuis ? 'T' : 'U', w.tegenstanderClub, w.tegenstanderCode].join('|');
    teller[basis] = (teller[basis] || 0) + 1;
    w.sleutel = basis + '#' + teller[basis];
  });
  return lijst;
}
// Een nieuwe wedstrijd, in dezelfde vorm als impVoerUit ze maakt. De competitienaam ("U9 Boys - Reg. 2 G") staat
// in de notities: het is geen veld dat de app kent, en wat niet in het model past hoort daar.
function hbeNieuweWedstrijd(w, kernId, ploegNaam, vorm) {
  return {
    id: uid(), createdAt: Date.now(), notes: w.competitie || '', motmId: null, captainId: null,
    quarters: [], currentQuarter: 0, quarterStatus: 'not_started', scoreUs: 0, scoreThem: 0, events: [],
    formation: '', players: [], absentPlayers: [], status: 'planned',
    opponent: w.tegenstander, date: w.datum, time: w.tijd || '00:00', location: w.thuis ? 'Thuis' : 'Uit',
    venue: '', terrein: w.terrein || '',
    teamName: ploegNaam, teamId: kernId, subteam: w.eigenCode || '',
    competition: 'Competitie', matchday: '', referee: '', jersey: '', trainer: '', responsible: '',
    matchType: vorm.matchType, fieldSize: MATCH_TYPES[vorm.matchType].field,
    periodKey: vorm.periodKey, numQuarters: PERIOD_TYPES[vorm.periodKey].count, quarterDuration: vorm.dur,
    hbeKey: w.sleutel,
  };
}
// De velden die een tweede keer inlezen mag aanpassen op een bestaande, nog geplande wedstrijd: precies wat
// de bron weet. Selectie, opstelling en notities blijven staan.
function hbeBronVelden(w) {
  return { opponent: w.tegenstander, date: w.datum, time: w.tijd || '00:00', location: w.thuis ? 'Thuis' : 'Uit', terrein: w.terrein || '' };
}
function hbeFoutTekst(e) { return (e && e.message) ? String(e.message) : 'onbekende fout'; }
function hbeVandaag() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

async function hbeClubOpen(clubId) {
  if (!fbdb || !currentUser) { showToast('Hiervoor is verbinding nodig.', 'err'); return; }
  if (!(myClubs && myClubs[clubId]) && !isOwner) { showToast('Enkel een clubbeheerder kan dit.', 'err'); return; }
  hbeSt = { clubId, zoek: '', keuzes: null, club: null, rijen: null, eigenLogo: '', ploegen: null, kernen: [], keuze: {},
            metVerleden: true, bezig: true, bezigTxt: 'Gegevens van de club ophalen…', fout: '', klaar: null };
  hbeRender();
  try {
    const [naam, kernen] = await Promise.all([
      (async () => { try { return (await fbOnce(fbdb.ref('clubs/' + clubId + '/info/name'))).val() || ''; } catch (e) { return ''; } })(),
      rbfaKernenVanClub(clubId),
    ]);
    hbeSt.zoek = naam; hbeSt.kernen = kernen;
    // Is de club al eens gekoppeld, dan kennen we haar id en slaan we het zoeken over.
    const gekend = kernen.find(k => k.hbeClubId);
    if (gekend) { hbeSt.bezig = false; hbeSt.bezigTxt = ''; return hbeKies(gekend.hbeClubId, naam); }
  } catch (e) { hbeSt.fout = 'De ploegen van de club ophalen is niet gelukt. Probeer het opnieuw.'; }
  hbeSt.bezig = false; hbeSt.bezigTxt = '';
  hbeRender();
}
function hbeSluit() { hbeSt = null; closeModal(); }
function hbeVeld(v) { if (hbeSt) hbeSt.zoek = v; }
async function hbeZoekClub() {
  if (!hbeSt || hbeSt.bezig) return;
  hbeSt.bezig = true; hbeSt.bezigTxt = 'Zoeken…'; hbeSt.fout = ''; hbeRender();
  try {
    hbeSt.keuzes = await hbeClubZoek(hbeSt.zoek);
    if (!hbeSt.keuzes.length) hbeSt.fout = 'Geen club gevonden met die naam. Probeer een korter stukje van de naam.';
  } catch (e) { hbeSt.fout = hbeFoutTekst(e); }
  if (hbeSt) { hbeSt.bezig = false; hbeSt.bezigTxt = ''; hbeRender(); }
}
// Een club gekozen: het hele seizoenprogramma ophalen en de jeugdploegen eruit afleiden.
async function hbeKies(id, label) {
  if (!hbeSt) return;
  hbeSt.club = { id: String(id), label: String(label || id) };
  hbeSt.bezig = true; hbeSt.bezigTxt = 'Het programma van het seizoen ophalen…'; hbeSt.fout = ''; hbeRender();
  try {
    const s = hbeSeizoen();
    const res = await hbeProgramma(hbeSt.club.id, s.van, s.tot);
    hbeSt.rijen = res.rijen; hbeSt.tellers = { overgeslagen: res.overgeslagen, dubbel: res.dubbel };
    hbeSt.eigenLogo = hbeEigenLogo(res.rijen);
    if (!res.rijen.length) {
      // Zeggen WAT er misging: niets ontvangen is iets anders dan wel ontvangen maar niet kunnen lezen.
      hbeSt.fout = res.ontvangen
        ? `Hockey Belgium gaf ${res.ontvangen} regels, maar geen enkele was te lezen (${res.overgeslagen} overgeslagen). Meld dit; de opmaak van hockey.be is mogelijk veranderd.`
        : `Hockey Belgium gaf geen enkele wedstrijd terug voor deze club tussen ${s.van} en ${s.tot}.`;
      hbeSt.ploegen = [];
    }
    else if (!hbeSt.eigenLogo) { hbeSt.fout = 'De ploegen van de club konden niet betrouwbaar herkend worden in dit programma.'; hbeSt.ploegen = []; }
    else {
      hbeSt.ploegen = hbeBundels(res.rijen, hbeSt.eigenLogo);
      hbeSt.keuze = {}; hbeSt.ploegen.forEach(p => { hbeSt.keuze[p.code] = true; });
      if (!hbeSt.ploegen.length) hbeSt.fout = 'Er staan geen jeugdploegen (U7 tot U19) in het programma van deze club.';
    }
  } catch (e) { hbeSt.fout = hbeFoutTekst(e); hbeSt.ploegen = null; }
  if (hbeSt) { hbeSt.bezig = false; hbeSt.bezigTxt = ''; hbeRender(); }
}
function hbeToggle(code) { if (hbeSt) { hbeSt.keuze[code] = !hbeSt.keuze[code]; hbeRender(); } }
function hbeAlles(aan) { if (hbeSt && hbeSt.ploegen) { hbeSt.ploegen.forEach(p => { hbeSt.keuze[p.code] = !!aan; }); hbeRender(); } }
function hbeVerleden(aan) { if (hbeSt) { hbeSt.metVerleden = !!aan; hbeRender(); } }
function hbeTerug() { if (hbeSt && !hbeSt.bezig) { Object.assign(hbeSt, { club: null, rijen: null, ploegen: null, keuzes: null, fout: '', klaar: null }); hbeRender(); } }

function hbeRender() {
  if (!hbeSt) return;
  const lijst = document.querySelector('#modal [data-hbe-lijst]');
  const schuif = lijst ? lijst.scrollTop : 0;
  openModal(hbeHtml());
  if (schuif) { const n = document.querySelector('#modal [data-hbe-lijst]'); if (n) n.scrollTop = schuif; }
}
function hbeHtml() {
  const st = hbeSt;
  const kop = `<h3>${icI(IC.link)} Ploegen van Hockey Belgium</h3>`;
  const sluit = `<button class="btn btn-gray" style="margin-top:8px" onclick="hbeSluit()">Sluiten</button>`;
  if (st.bezig) return `${kop}<p style="text-align:center;color:var(--txt2);padding:18px 0">${esc(st.bezigTxt || 'Bezig…')}</p>${sluit}`;
  if (st.klaar) {
    const k = st.klaar;
    return `${kop}
      <p style="text-align:center;margin:12px 0 4px"><b>${k.ploegen}</b> ${k.ploegen === 1 ? 'ploeg' : 'ploegen'} aangemaakt, <b>${k.wedstrijden}</b> ${k.wedstrijden === 1 ? 'wedstrijd' : 'wedstrijden'} toegevoegd${k.bijgewerkt ? `, <b>${k.bijgewerkt}</b> bijgewerkt` : ''}.</p>
      ${k.fouten.length ? `<div class="auth-err" style="display:block;margin-top:10px">${k.fouten.map(esc).join('<br>')}</div>` : ''}
      <p style="font-size:12px;color:var(--txt2);text-align:center;margin:10px 0">Open Clubbeheer opnieuw om de ploegen te zien. Tik je hier later nogmaals, dan komen enkel nieuwe of verzette wedstrijden bij.</p>
      <button class="btn btn-green" onclick="hbeSluit();clubSchermHertekenen()">Klaar</button>`;
  }
  // Stap 1: club zoeken
  if (!st.club) {
    return `${kop}
      <p style="font-size:13px;color:var(--txt2);margin-bottom:10px">Zoek je club op hockey.be. De app haalt daarna de jeugdploegen en hun volledige kalender van dit seizoen binnen.</p>
      <div class="fg"><label>Naam van de club</label><input type="text" value="${esc(st.zoek)}" oninput="hbeVeld(this.value)" onkeydown="if(event.key==='Enter')hbeZoekClub()" placeholder="bv. Indiana"></div>
      <button class="btn btn-pale" style="margin-bottom:10px" onclick="hbeZoekClub()">Zoeken</button>
      ${st.keuzes && st.keuzes.length ? `<div style="display:grid;gap:6px;margin-bottom:6px">${st.keuzes.map(c => `<button class="btn btn-orgpale" style="margin:0;text-align:left" onclick="hbeKies('${esc(c.id)}','${esc(c.label).replace(/'/g, '&#39;')}')">${esc(c.label)}</button>`).join('')}</div>` : ''}
      ${st.fout ? `<div class="auth-err" style="display:block">${esc(st.fout)}</div>` : ''}
      ${sluit}`;
  }
  // Stap 2: de ploegen
  const bestaand = new Set(st.kernen.filter(k => k.hbeCode).map(k => k.hbeCode));
  const gekozen = (st.ploegen || []).filter(p => st.keuze[p.code]);
  const wedstrijdenTotaal = gekozen.reduce((n, p) => n + hbeWedstrijdenVanBundel(st.rijen, st.eigenLogo, p.code).filter(w => st.metVerleden || w.datum >= hbeVandaag()).length, 0);
  const rij = p => {
    const vorm = hbeVormVoorCode(p.code);
    const al = bestaand.has(p.code);
    return `<label style="display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid var(--bdr,#e5e5e5);cursor:pointer">
      <input type="checkbox" ${st.keuze[p.code] ? 'checked' : ''} onchange="hbeToggle('${esc(p.code)}')" style="width:18px;height:18px;flex-shrink:0">
      <span style="flex:1;min-width:0"><b>${esc(p.code)}</b> <span style="color:var(--txt2);font-size:12px">· ${esc(matchTypeLabel(vorm.matchType))} · ${p.labels.length} ${p.labels.length === 1 ? 'label' : 'labels'} · ${p.aantal} ${p.aantal === 1 ? 'wedstrijd' : 'wedstrijden'}</span>
        <span style="display:block;color:var(--txt2);font-size:11px;white-space:normal">${p.labels.map(esc).join(', ')}</span></span>
      ${al ? '<span class="badge badge-type" style="font-size:11px">bestaat al</span>' : ''}</label>`;
  };
  return `${kop}
    <p style="font-size:13px;color:var(--txt2);margin-bottom:8px"><b>${esc(st.club.label)}</b> · alleen de jeugd (U7 tot U19), één ploeg per leeftijd en geslacht${st.tellers && st.tellers.dubbel ? ` · ${st.tellers.dubbel} dubbele regels in de bron genegeerd` : ''}</p>
    ${st.fout ? `<div class="auth-err" style="display:block;margin-bottom:8px">${esc(st.fout)}</div>` : ''}
    ${(st.ploegen && st.ploegen.length) ? `
      <div style="display:flex;gap:8px;margin-bottom:6px"><button class="btn btn-pale btn-sm" style="margin:0" onclick="hbeAlles(true)">Alles</button><button class="btn btn-pale btn-sm" style="margin:0" onclick="hbeAlles(false)">Niets</button></div>
      <div data-hbe-lijst style="max-height:40vh;overflow-y:auto;border:1px solid var(--bdr,#e5e5e5);border-radius:10px;padding:2px 8px">${st.ploegen.map(rij).join('')}</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:10px 0;cursor:pointer"><input type="checkbox" ${st.metVerleden ? 'checked' : ''} onchange="hbeVerleden(this.checked)" style="width:18px;height:18px"> Ook wedstrijden van vóór vandaag</label>
      <p style="font-size:12px;color:var(--txt2);margin:0 0 10px">Startwaarden per leeftijd: U7-U8 3 tegen 3, U9 6 tegen 6, U10-U12 8 tegen 8, vanaf U14 11 tegen 11. De duur is een startwaarde; je past ze per ploeg aan.</p>
      <button class="btn btn-green" ${gekozen.length ? '' : 'disabled'} onclick="hbeUitvoeren()">${icI(IC.check)} ${gekozen.length} ${gekozen.length === 1 ? 'ploeg' : 'ploegen'} inlezen (${wedstrijdenTotaal} ${wedstrijdenTotaal === 1 ? 'wedstrijd' : 'wedstrijden'})</button>` : ''}
    <button class="btn btn-gray" style="margin-top:8px" onclick="hbeTerug()">Andere club zoeken</button>${sluit}`;
}

// Ploegen aanmaken en kalenders inlezen. Eén ploeg tegelijk: loopt er één mis, dan staan de andere er gewoon.
async function hbeUitvoeren() {
  const st = hbeSt;
  if (!st || st.bezig || !st.ploegen) return;
  if (!(myClubs && myClubs[st.clubId]) && !isOwner) { showToast('Enkel een clubbeheerder kan dit.', 'err'); return; }
  const gekozen = st.ploegen.filter(p => st.keuze[p.code]);
  if (!gekozen.length) return;
  st.bezig = true; st.fout = '';
  const tot = { ploegen: 0, wedstrijden: 0, bijgewerkt: 0, fouten: [] };
  const vandaag = hbeVandaag();
  for (const p of gekozen) {
    if (hbeSt !== st) return;   // venster gesloten: stoppen
    st.bezigTxt = `${p.code} (${tot.ploegen + tot.fouten.length + 1} van ${gekozen.length})…`; hbeRender();
    try {
      const vorm = hbeVormVoorCode(p.code);
      let kern = st.kernen.find(k => k.hbeCode === p.code && (!k.hbeClubId || k.hbeClubId === st.club.id));
      if (!kern) {
        const res = await createTeam(p.code, st.clubId, false, vorm.matchType, '', vorm.periodKey, vorm.dur, true);
        if (!res) throw new Error('de ploeg kon niet aangemaakt worden');
        // De koppeling gericht op de nieuwe kern zetten: enkel deze twee velden.
        await fbdb.ref('teams/' + res.teamId + '/roster/' + res.rosterId).update({ hbeClubId: st.club.id, hbeCode: p.code });
        kern = { teamId: res.teamId, kernId: res.rosterId, nieuw: true };
        st.kernen.push({ teamId: res.teamId, kernId: res.rosterId, hbeCode: p.code, hbeClubId: st.club.id });
        tot.ploegen++;
      }
      let lijst = hbeWedstrijdenVanBundel(st.rijen, st.eigenLogo, p.code);
      hbeWedstrijdSleutels(lijst);
      if (!st.metVerleden) lijst = lijst.filter(w => w.datum >= vandaag);
      // Wat er al staat (enkel bij een ploeg die al bestond): per sleutel de bestaande wedstrijd.
      const bestaand = {};
      if (!kern.nieuw) {
        const v = (await fbOnce(fbdb.ref('teams/' + kern.teamId + '/matches'), 15000)).val() || {};
        Object.keys(v).forEach(k => { const m = v[k]; if (m && m.hbeKey) bestaand[m.hbeKey] = Object.assign({ _pad: k }, m); });
      }
      const schrijf = {};
      let nieuwHier = 0, bijHier = 0;
      lijst.forEach(w => {
        const oud = bestaand[w.sleutel];
        if (oud) {
          // Enkel een nog geplande wedstrijd aanpassen, en enkel als er echt iets verschilt.
          if ((oud.status || 'planned') !== 'planned') return;
          const veld = hbeBronVelden(w);
          const verschilt = Object.keys(veld).some(k => String(oud[k] === undefined ? '' : oud[k]) !== String(veld[k]));
          if (!verschilt) return;
          Object.keys(veld).forEach(k => { schrijf[oud._pad + '/' + k] = veld[k]; });
          bijHier++;
          return;
        }
        const m = hbeNieuweWedstrijd(w, kern.kernId, p.code, vorm);
        schrijf[m.id] = m; nieuwHier++;
      });
      if (nieuwHier || bijHier) await fbdb.ref('teams/' + kern.teamId + '/matches').update(schrijf);
      tot.wedstrijden += nieuwHier; tot.bijgewerkt += bijHier;
    } catch (e) {
      tot.fouten.push(`${p.code}: ${hbeFoutTekst(e)}`);
    }
  }
  if (hbeSt !== st) return;
  st.bezig = false; st.bezigTxt = ''; st.klaar = tot; hbeRender();
}
