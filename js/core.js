// ===================== CONFIG =====================
const APP_VERSION = '0.37.1'; // MAJOR.MINOR.PATCH — 0.x = testfase, nog niet officieel live
const FEEDBACK_EMAIL = 'info@matchdelegate.be';
const MATCH_TYPES = {
  '3v3':  { field: 3,  lines: ['Doel','Verdediging','Aanval'] },
  '5v5':  { field: 5,  lines: ['Doel','Verdediging','Middenveld','Aanval'] },
  '8v8':  { field: 8,  lines: ['Doel','Verdediging','Middenveld','Aanval'] },
  '11v11':{ field: 11, lines: ['Doel','Verdediging','Middenveld','Aanval'] },
};
// De lijnen van een wedstrijd, met terugval op 8v8 als de wedstrijdvorm niet (meer) in MATCH_TYPES
// staat — bv. na het hernoemen of schrappen van een vorm, terwijl oude wedstrijden op de toestellen
// de oude tekst houden. Enkel voor keuzelijstjes: een lijnenlijst hoort geen scherm te doen crashen.
function matchLines(m) { return (MATCH_TYPES[m && m.matchType] || MATCH_TYPES['8v8']).lines; }
// Waar een speler ZONDER coördinaten getekend wordt, per lijn. Enkel weergave, en enkel voor oude of
// half ingevulde opstellingen: wie x/y heeft, staat op zijn roosterplek. Gelijk aan de rijen van
// POS_GRID hieronder, zodat zo'n speler niet tussen twee rijen valt.
const LINE_Y = { 'Doel': 91, 'Verdediging': 76, 'Middenveld': 46, 'Aanval': 16 };
// De codes bij de positienummers die computePosNum toekent (1 = doel, 2-5 verdediging, 6/8/10/11/7
// middenveld, 9 aanval). Het nummer zegt wélke plek, de code hoe die plek heet.
const POS_CODES_11 = {
  1: 'K', 2: 'RV', 3: 'CV', 4: 'CV', 5: 'LV', 6: 'CVM',
  7: 'RA', 8: 'CM', 9: 'SP/CA', 10: 'CAM', 11: 'LA',
};
// Op een klein veld heten dezelfde nummers anders: de "spits" is er een aanvallende middenvelder en
// de flanken zijn middenvelders i.p.v. aanvallers. 3, 4, 6 en 8 staan niet in de lijst die Tim
// opgaf omdat 8v8 ze zelden of nooit toekent (zie computePosNum); ze volgen daarom de grote tabel.
const POS_CODES_KLEIN = {
  1: 'K', 2: 'RV', 3: 'CV', 4: 'CV', 5: 'LV', 6: 'CVM',
  7: 'RM', 8: 'CM', 9: 'CAM', 10: 'CVM', 11: 'LM',
};
function posCode(n, matchType) {
  const tabel = matchType === '11v11' ? POS_CODES_11 : POS_CODES_KLEIN;
  return tabel[parseInt(n, 10)] || '';
}
// ===================== POSITIEROOSTER =====================
// 26 plekken op het veld: 5 kolommen x 5 rijen, plus de doelman. Hetzelfde rooster voor ELKE
// wedstrijdvorm — enkel het aantal spelers dat je moet plaatsen verschilt (8 bij 8v8, 11 bij 11v11).
// Dit vervangt op termijn de vaste slots per formatie (FORMATIONS): de formatie blijft bestaan als
// vertrekpunt en als naam in het verslag, maar je mag elke speler op elke plek zetten.
//
//  - `code` is de IDENTITEIT van een plek: uniek over de 26, en dat is wat een wedstrijd bewaart en
//    waarop een geplande positiewissel werkt. Zo kan er geen dubbelzinnigheid bestaan, wat met een
//    positieNUMMER niet lukt: er zijn 26 plekken en maar 11 klassieke nummers.
//  - `line` is een van de vier lijnen van de app. Die volgt uit de CODE en niet uit de rij: LW is een
//    flankaanvaller en LAM een middenvelder, ook al staan ze even hoog. De vier lijnen blijven de
//    vier lijnen, want daaraan hangen de statistiek "posities per linie", de PDF en LINE_Y.
//  - x/y liggen bewust binnen het bereik van de oude formatiecoördinaten (x 14..86, y 22..93), zodat
//    een bestaande opstelling op het rooster terug te vinden is (zie gridPlekVoor).
const POS_GRID = (() => {
  const KOL = [14, 32, 50, 68, 86];                       // links → rechts
  // De rijen liggen 15% van elkaar, en de doelman ligt op dezelfde afstand onder de verdediging. Die
  // 15% is precies wat een shirt plus het naamplaatje eronder nodig heeft (zie .pslot in index.html:
  // 18% van de veldbreedte, plus een label van een vaste 15px) — bij minder gaat een naam over het
  // shirt van de rij eronder. De aanval staat op de grote baklijn van de tegenstander (die loopt tot
  // y=15,6) en de doelman blijft diep genoeg om in zijn doelgebied te staan. De rijen lagen eerst
  // 14/14/14/16 van elkaar; die kleinste afstand van 14% was net wat de shirtgrootte begrensde.
  // Dit verschuift NIET welke plek een bestaande opstelling krijgt: binnen één lijn hebben alle plekken
  // dezelfde y, dus gridPlekVoor kiest daar op x.
  const RIJ = { aanval: 16, aanvMid: 31, midden: 46, verdMid: 61, verdediging: 76 };
  const D = 'Doel', V = 'Verdediging', M = 'Middenveld', A = 'Aanval';
  const rij = (y, codes, lijnen) => codes.map((code, i) => ({ code, line: lijnen[i], x: KOL[i], y }));
  return [
    ...rij(RIJ.aanval,      ['LFA', 'LCA', 'CA',  'RCA', 'RFA'], [A, A, A, A, A]),
    ...rij(RIJ.aanvMid,     ['LW',  'LAM', 'CAM', 'RAM', 'RW'],  [A, M, M, M, A]),
    ...rij(RIJ.midden,      ['LM',  'LCM', 'CM',  'RCM', 'RM'],  [M, M, M, M, M]),
    ...rij(RIJ.verdMid,     ['LVW', 'LVM', 'CVM', 'RVM', 'RVW'], [M, M, M, M, M]),
    ...rij(RIJ.verdediging, ['LV',  'LCV', 'CV',  'RCV', 'RV'],  [V, V, V, V, V]),
    { code: 'GK', line: D, x: 50, y: 91 },
  ];
})();
// Welke plek welk positienummer draagt, per wedstrijdvorm. Het nummer is enkel een LABEL: bij jeugd
// is de voorste écht "de 9" en de middenpositie "de 10", dus dat woord moet blijven bestaan. Er hangt
// geen bewaarde data aan — een wedstrijd bewaart de code — dus deze tabel is later veilig te wijzigen
// zonder migratie: geen opstelling verschuift, geen geplande wissel wordt ongeldig, geen verslag
// verandert. Plekken die hier niet in staan hebben geen nummer, en dat is de eerlijke uitkomst: voor
// LFA of RCM bestaat er geen nummer dat een trainer zou herkennen.
// Aantal genummerde plekken = aantal spelers op het veld: 8 bij 8v8, 11 bij 11v11.
const POS_NUMMERS = {
  klein:   { GK: 1, LV: 5, CV: 3, RV: 2, CVM: 10, LM: 11, RM: 7, CAM: 9 },
  '11v11': { GK: 1, LV: 5, LCV: 3, RCV: 4, RV: 2, CVM: 6, CM: 8, CAM: 10, LW: 11, CA: 9, RW: 7 },
};
// De plekken van een formatie MET hun nummer. Dit is de tabel die telt: per opstelling, elk nummer
// één keer, en elke plek van die opstelling heeft er een.
//
// Waarom per formatie en niet per wedstrijdvorm: een nummer hoort bij je ROL in die opstelling, niet
// bij een vast plekje op het gras. In een 4-3-3 is de linksbuiten de 11; in een 4-4-2 is de 11 een
// spits en de linkshalf de 8. Met één nummer per plek per wedstrijdvorm loopt dat onvermijdelijk vast
// — bij 2-3-2 kwamen 11 en 7 twee keer op het veld (LM/LW en RM/RW).
//
// De 11v11-cijfers volgen de Nederlands-Belgische traditie (1 keeper, 2 rechtsback, 3-4 centraal,
// 5 linksback, 6 en 8 middenveld, 10 aanvallende middenvelder, 7 rechts, 9 spits, 11 links). Voor 8v8
// bestaat er geen conventie: 'Dubbele ruit' is door Tim vastgelegd, de rest volgt daar consistent uit.
// Deze tabel is puur een LABEL: er hangt geen bewaarde data aan (een wedstrijd bewaart de code, en het
// nummer wordt bij het opslaan mee ingestempeld), dus later wijzigen kan zonder migratie.
const FORMATIE_NUMMERS = {
  '3v3': {
    // Deze formaties hebben geen doelman.
    'Driehoek 1-2': { CV: 3, LCA: 10, RCA: 9 },
    'Driehoek 2-1': { LCV: 5, RCV: 2, CA: 9 },
  },
  '5v5': {
    // De twee middenvelders staan op de HALVE kolommen en niet uiterst links/rechts: zo dicht bij de
    // zijlijn stonden ze verder uit elkaar dan de formatie ze tekent, en op een 5v5-veld verlies je
    // dan de verbinding tussen de vier veldspelers. De nummers 11 en 7 blijven bij die plekken horen.
    'Ruit (1-2-1)':   { GK: 1, CV: 3, LCM: 11, RCM: 7, CA: 9 },
    'Vierkant (2-2)': { GK: 1, LCV: 5, RCV: 2, LCA: 10, RCA: 9 },
  },
  '8v8': {
    'Dubbele ruit': { GK: 1, LV: 5, CV: 3, RV: 2, LM: 11, CVM: 10, RM: 7, CAM: 9 },
    // Een ruit heeft geen vlakke lijnen: de centrale middenvelder zakt weg (CVM) en er staat een punt
    // tussen middenveld en aanval (CAM). Precies dáárin verschilt hij van de 3-3-1 hieronder, die wél
    // twee vlakke rijen van drie heeft. Tot v0.35.0 stonden beide op exact dezelfde acht plekken,
    // waardoor ze op het veld niet uit elkaar te houden waren: dezelfde shirts lichtten op.
    '3-3-1':        { GK: 1, LV: 5, CV: 3, RV: 2, LM: 11, CM: 10, RM: 7, CA: 9 },
    // LM en RM houden 11 en 7 zoals in de ruit — zelfde plek, zelfde nummer, dat is rustiger voor de
    // spelers. De twee voorsten worden het klassieke spitsenduo 9 en 10, en CVM schuift van 10 naar 6:
    // in de ruit is hij de spelmaker, hier met twee spitsen de controleur.
    // Dat spitsenduo staat centraal vooraan (LCA/RCA) en niet op de vleugelplekken LW/RW: de formatie
    // tekent ze op de aanvalslijn dicht bij elkaar, en LW/RW liggen een rij lager tegen de zijlijn.
    '2-3-2':        { GK: 1, LV: 5, RV: 2, LM: 11, CVM: 6, RM: 7, LCA: 10, RCA: 9 },
  },
  '11v11': {
    '1-4-3-3':   { GK: 1, LV: 5, LCV: 3, RCV: 4, RV: 2, CVM: 6, CM: 8, CAM: 10, LW: 11, CA: 9, RW: 7 },
    '1-4-2-3-1': { GK: 1, LV: 5, LCV: 3, RCV: 4, RV: 2, CVM: 6, CM: 8, LW: 11, CAM: 10, RW: 7, CA: 9 },
    '1-4-4-2':   { GK: 1, LV: 5, LCV: 3, RCV: 4, RV: 2, LM: 11, LCM: 6, RCM: 8, RM: 7, LCA: 9, RCA: 10 },
    // De brede spelers van de vier zijn hier vleugelverdedigers: de rechtse krijgt daarom 2, het
    // traditionele nummer van de rechtsback. Zo houden de vleugelaanvallers 11 en 7.
    '1-3-4-3':   { GK: 1, LCV: 5, CV: 4, RCV: 3, LM: 11, LCM: 6, RCM: 8, RM: 2, LCA: 10, CA: 9, RCA: 7 },
  },
};
function formatieNummers(matchType, formatie) {
  const perVorm = FORMATIE_NUMMERS[matchType];
  return (perVorm && formatie && perVorm[formatie]) || null;
}
function gridPlek(code) { return POS_GRID.find(p => p.code === code) || null; }
// Het nummer van een plek. Eerst de tabel van de gekozen FORMATIE (daar is elk nummer uniek en heeft
// elke plek er een); zet je iemand op een plek buiten die formatie, dan valt het terug op de algemene
// tabel per wedstrijdvorm, en heeft die plek daar ook geen nummer, dan is er geen — en dat is de
// eerlijke uitkomst.
function gridNummer(code, matchType, formatie) {
  const perFormatie = formatieNummers(matchType, formatie);
  if (perFormatie && perFormatie[code]) return perFormatie[code];
  const tabel = matchType === '11v11' ? POS_NUMMERS['11v11'] : POS_NUMMERS.klein;
  return tabel[code] || null;
}
// Label voor een plek: de code, met het nummer erbij waar er een bestaat — voor keuzelijsten, de
// tijdlijn en het verslag, waar plaats is. In het shirt op het veld staat enkel het rugnummer.
function gridLabel(code, matchType, formatie) {
  const n = gridNummer(code, matchType, formatie);
  return n ? `${code} (${n})` : code;
}
// Zelfde, maar met de wedstrijd als context — zo hoeft een oproeper de wedstrijdvorm en de formatie
// niet zelf uit elkaar te plukken.
function matchGridNummer(m, code) { return gridNummer(code, m && m.matchType, m && m.formation); }
function matchGridLabel(m, code) { return gridLabel(code, m && m.matchType, m && m.formation); }
// Een bestaande opstelling op het rooster terugvinden. Bewust BINNEN de eigen lijn zoeken: in de
// dubbele ruit staat een verdediger op (24,65), en de dichtstbijzijnde roosterplek daar is LVM — een
// middenvelder. Zonder deze beperking zou zo'n speler stil van linie veranderen en daarmee de
// statistiek "posities per linie" en het verslag vervalsen. De speler bewaart zijn `line` al, dus die
// is de baas en x/y beslissen enkel welke plek binnen die lijn.
function gridPlekVoor(line, x, y) {
  const kandidaten = POS_GRID.filter(p => p.line === line);
  const lijst = kandidaten.length ? kandidaten : POS_GRID;
  if (typeof x !== 'number' || typeof y !== 'number') return lijst[Math.floor(lijst.length / 2)];
  let best = lijst[0], bestD = Infinity;
  for (const p of lijst) {
    const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
// De code van een speler zoals hij nu op het veld staat. Nieuwe wedstrijden bewaren `posCodeVeld`;
// voor alles wat al bestaat leiden we ze af uit lijn + x/y. Nooit stil terugschrijven naar het
// wedstrijdobject — zie het datamodel-voorschrift in CLAUDE.md.
// ---------- De markering op een velddiagram ----------
// Een SHIRT en niet langer een bol. Eén functie voor alle drie de velden (de wizard, "posities
// herplaatsen" in het livescherm, en renderPitch voor de planner/het pauzescherm/het verslag), zodat
// ze niet uit elkaar kunnen groeien — dat was met .pslot en .pdot al gebeurd.
// Zelfde pad als IC.shirt, dus dezelfde vorm als het shirt-icoon in de knoppen en de tegels.
const SHIRT_PATH = 'M15 4l6 2v5h-3v8a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-8h-3v-5l6-2a3 3 0 0 0 6 0';
// `binnen` is het RUGNUMMER van de speler die er staat, niet het positienummer: een shirt vraagt om
// een rugnummer, en dat is het enige nummer dat de trainer én de spelers zelf gebruiken. Waar de
// speler staat, ís zijn positie. Gebruikt een ploeg geen rugnummers, dan blijft het shirt leeg en
// doet de naam eronder het werk. De positiecode staat onder een LEGE plek (zie `label`) en verdwijnt
// zodra er iemand op staat.
function shirtSvg(gevuld, keeper, binnen) {
  const fill = gevuld ? (keeper ? '#f5821f' : 'var(--blk)') : 'rgba(0,0,0,.18)';
  // Een lege plek krijgt een dunne VOLLE lijn. Een streepjeslijn stond er eerst, maar op 33 px (het
  // shirt van een niet-voorgestelde plek) is één streepje van 2 eenheden nog geen 3 px: dat wordt een
  // rafelige, ongelijke rand. Een dunne volle contour blijft rustig op elke grootte.
  const txt = (binnen != null && String(binnen) !== '')
    ? `<text x="12" y="16.6" text-anchor="middle" class="pmark-txt">${esc(String(binnen))}</text>` : '';
  return `<svg class="pmark-svg" viewBox="0 0 24 24" aria-hidden="true">`
    + `<path d="${SHIRT_PATH}" fill="${fill}" stroke="rgba(255,255,255,.88)" stroke-width="${gevuld ? 1.2 : 1}"/>`
    + `${txt}</svg>`;
}
// Een speler op een roosterplek zetten: x/y, de lijn, het positienummer (uit de tabel van de formatie
// van deze wedstrijd) en de code. Eén plek waar dat gebeurt, zodat een verhuizing overal — live, in de
// pauze, bij een terugspoeling — exact hetzelfde oplevert.
function zetOpGridPlek(p, plek, m) {
  if (!p || !plek) return p;
  p.x = plek.x; p.y = plek.y; p.line = plek.line;
  p.posNum = matchGridNummer(m, plek.code) || '';
  p.posCodeVeld = plek.code;
  return p;
}
function spelerGridCode(p) {
  if (!p) return null;
  // x/y is de BRON, niet posCodeVeld. Elke roosterplek heeft unieke coördinaten, en x/y wordt overal
  // correct meegekopieerd: bij een wissel, een terugspoeling, een reconstructie. posCodeVeld had eerst
  // voorrang, en dan las een reconstructie die enkel x/y terugzette (positionsAtMatchStart) nog de
  // OUDE code — de plek van vóór de verhuizing. Het veld blijft wel meeschrijven: het documenteert de
  // bedoeling en dient als terugval voor een speler zonder coördinaten.
  if (typeof p.x === 'number' && typeof p.y === 'number') {
    const plek = gridPlekVoor(p.line, p.x, p.y);
    if (plek) return plek.code;
  }
  if (p.posCodeVeld && gridPlek(p.posCodeVeld)) return p.posCodeVeld;
  return null;
}
const PERIOD_TYPES = {
  'helften': { count: 2, sing: 'Helft', plural: 'helften', abbr: 'H' },
  'delen':   { count: 3, sing: 'Deel',  plural: 'delen',   abbr: 'D' },
  'kwarten': { count: 4, sing: 'Kwart', plural: 'kwarten', abbr: 'K' },
};
function pType(m) { return PERIOD_TYPES[m && m.periodKey] || PERIOD_TYPES['kwarten']; }
function pSing(m) { return pType(m).sing; }              // bv. "Kwart"
function pSingLow(m) { return pType(m).sing.toLowerCase(); } // bv. "kwart"
function pPlural(m) { return pType(m).plural; }          // bv. "kwarten"
function pAbbr(m) { return pType(m).abbr; }              // bv. "K"
// "2 delen" / "1 deel": bij een wedstrijd van één blok stond er anders "1 delen".
function pCount(m, n) { const c = n == null ? (m && m.numQuarters) : n; return `${c} ${c === 1 ? pSingLow(m) : pPlural(m)}`; }
// Redenen bij "niet beschikbaar" (NB) in de selectie — optioneel: geen reden blijft geldig.
// 'elders' is de ENIGE reden met een rekengevolg: die wedstrijd telt niet als gemist in het
// aanwezigheids-% (de speler voetbalde, alleen bij een andere ploeg). De rest is informatie.
const ABSENT_REASONS = [
  { key: 'ziek',     label: 'Ziek' },
  { key: 'blessure', label: 'Geblesseerd' },
  { key: 'elders',   label: 'Speelt elders' },
  { key: 'ander',    label: 'Andere reden' },
];
function absentReasonLabel(key) { const r = ABSENT_REASONS.find(x => x.key === key); return r ? r.label : ''; }
const DURATIONS = { helften: [30, 45], delen: [15, 20], kwarten: [10, 15, 20] };
const DUR_DEFAULT = { helften: 30, delen: 20, kwarten: 15 };
// Veelgebruikte formaties per wedstrijdtype. Slot = {line, x, y} (x,y in % van het veld; doel onderaan).
const D = 'Doel', V = 'Verdediging', M = 'Middenveld', A = 'Aanval';
const FORMATIONS = {
  '3v3': [
    { name: 'Driehoek 1-2', slots: [{line:V,x:50,y:66},{line:A,x:28,y:30},{line:A,x:72,y:30}] },
    { name: 'Driehoek 2-1', slots: [{line:V,x:30,y:66},{line:V,x:70,y:66},{line:A,x:50,y:30}] },
  ],
  '5v5': [
    { name: 'Ruit (1-2-1)', slots: [{line:D,x:50,y:90},{line:V,x:50,y:68},{line:M,x:26,y:46},{line:M,x:74,y:46},{line:A,x:50,y:24}] },
    { name: 'Vierkant (2-2)', slots: [{line:D,x:50,y:90},{line:V,x:30,y:66},{line:V,x:70,y:66},{line:A,x:30,y:34},{line:A,x:70,y:34}] },
  ],
  '8v8': [
    { name: 'Dubbele ruit', slots: [{line:D,x:50,y:92},{line:V,x:50,y:77},{line:V,x:24,y:65},{line:V,x:76,y:65},{line:M,x:50,y:50},{line:M,x:24,y:38},{line:M,x:76,y:38},{line:A,x:50,y:22}] },
    { name: '3-3-1', slots: [{line:D,x:50,y:92},{line:V,x:22,y:73},{line:V,x:50,y:75},{line:V,x:78,y:73},{line:M,x:22,y:48},{line:M,x:50,y:50},{line:M,x:78,y:48},{line:A,x:50,y:24}] },
    { name: '2-3-2', slots: [{line:D,x:50,y:92},{line:V,x:32,y:73},{line:V,x:68,y:73},{line:M,x:20,y:50},{line:M,x:50,y:52},{line:M,x:80,y:50},{line:A,x:32,y:26},{line:A,x:68,y:26}] },
  ],
  '11v11': [
    { name: '1-4-3-3', slots: [{line:D,x:50,y:93},{line:V,x:14,y:75},{line:V,x:38,y:78},{line:V,x:62,y:78},{line:V,x:86,y:75},{line:M,x:28,y:54},{line:M,x:50,y:44},{line:M,x:72,y:54},{line:A,x:22,y:26},{line:A,x:50,y:24},{line:A,x:78,y:26}] },
    { name: '1-4-2-3-1', slots: [{line:D,x:50,y:93},{line:V,x:14,y:75},{line:V,x:38,y:78},{line:V,x:62,y:78},{line:V,x:86,y:75},{line:M,x:36,y:60},{line:M,x:64,y:60},{line:M,x:20,y:40},{line:M,x:50,y:38},{line:M,x:80,y:40},{line:A,x:50,y:22}] },
    { name: '1-4-4-2', slots: [{line:D,x:50,y:93},{line:V,x:14,y:75},{line:V,x:38,y:78},{line:V,x:62,y:78},{line:V,x:86,y:75},{line:M,x:14,y:52},{line:M,x:38,y:52},{line:M,x:62,y:52},{line:M,x:86,y:52},{line:A,x:35,y:26},{line:A,x:65,y:26}] },
    { name: '1-3-4-3', slots: [{line:D,x:50,y:93},{line:V,x:26,y:77},{line:V,x:50,y:78},{line:V,x:74,y:77},{line:M,x:14,y:52},{line:M,x:38,y:54},{line:M,x:62,y:54},{line:M,x:86,y:52},{line:A,x:24,y:26},{line:A,x:50,y:24},{line:A,x:76,y:26}] },
  ],
};
// Enkel voor de samenvatting per linie in de statistiek "Posities". 'Doel' is hier GK, zoals de
// roosterplek van de doelman heet — anders stond er "K×2 · GK×2" naast elkaar in dezelfde regel.
const LINE_SHORT = { 'Doel': 'GK', 'Verdediging': 'V', 'Middenveld': 'M', 'Aanval': 'A' };
// Weergavelabel voor een lijn/positie — 'Doel' wordt getoond als 'Doelman', de opgeslagen waarde blijft 'Doel'.
const LINE_LABEL = { 'Doel': 'Doelman', 'Verdediging': 'Verdediging', 'Middenveld': 'Middenveld', 'Aanval': 'Aanval' };
function lineLabel(l) { return LINE_LABEL[l] || l; }
// ----- Voorkeurspositie van een speler in het rooster (p.pos + p.side) -----
// Fijner dan de vier lijnen hierboven: een vleugelspeler en een spits zitten beide in de lijn
// 'Aanval', en bij een middenvelder is de tweede keuze diepte (verdedigend/aanvallend) i.p.v. een
// kant. De LIJNEN zelf blijven bewust de vier bekende waarden — daaraan hangen de formaties, LINE_Y,
// het veldtekenen, beide PDF's en de statistiek "posities per linie". Elke positie hoort dus bij
// precies één lijn (posLine), en 'axis' zegt waarop de tweede keuze slaat op het veld:
// 'x' = breedte (links/rechts), 'y' = diepte (verdedigend/aanvallend).
const POSITIONS = {
  Keeper:        { line: 'Doel',        sideLabel: '',     axis: 'x', sides: {} },
  Verdediger:    { line: 'Verdediging', sideLabel: 'Kant', axis: 'x', sides: { links: 'Links', centraal: 'Centraal', rechts: 'Rechts' } },
  Middenvelder:  { line: 'Middenveld',  sideLabel: 'Rol',  axis: 'y', sides: { verdedigend: 'Verdedigend', centraal: 'Centraal', aanvallend: 'Aanvallend' } },
  Vleugelspeler: { line: 'Aanval',      sideLabel: 'Kant', axis: 'x', sides: { links: 'Links', rechts: 'Rechts' } },
  Spits:         { line: 'Aanval',      sideLabel: '',     axis: 'x', sides: {} },
};
// Vóór v0.14 werd de lijnnaam zelf als voorkeurspositie bewaard. Die waarden blijven leesbaar
// (rooster van een ander toestel dat nog niet opnieuw bewaard is, of een oude back-up): "Aanval"
// wordt Spits — wie eigenlijk vleugelspeler is, kiest de beheerder zelf.
const LEGACY_POS = { 'Doel': 'Keeper', 'Verdediging': 'Verdediger', 'Middenveld': 'Middenvelder', 'Aanval': 'Spits' };
function normPos(pos) { const p = (pos || '').trim(); return POSITIONS[p] ? p : (LEGACY_POS[p] || ''); }
function posMeta(pos) { return POSITIONS[normPos(pos)] || null; }
function posLine(pos) { const m = posMeta(pos); return m ? m.line : ''; }
function posSides(pos) { const m = posMeta(pos); return m ? m.sides : {}; }
function posSideLabel(pos) { const m = posMeta(pos); return m ? m.sideLabel : ''; }
function posSideValid(pos, side) { return !!posSides(pos)[side]; }
// ----- Rugnummers zijn optioneel -----
// Bij jeugdploegen zijn vaste rugnummers niet de norm (wisselende truitjes), dus een ploeg kan ze
// uitzetten met `useNumbers: false`. Bestaande ploegen hebben dat veld niet en gebruiken ze dus wel.
// Los daarvan geldt overal: een nummer wordt enkel getoond als er ook echt een is. Voordien stond
// er "?" in elk bolletje en elke chip, wat las alsof er iets ontbrak of stuk was.
function teamUsesNumbers(team) { return !team || team.useNumbers !== false; }
// BELANGRIJK — de weergaveregel is "de SPELER is de baas": een nummer wordt getoond als die speler er
// een heeft. `useNumbers` regelt enkel het ROOSTER (kolom, invoervakjes, sorteren) en of een nieuwe
// wedstrijd/tornooiselectie nummers uit het rooster voorvult. Een al bestaande wedstrijd draagt haar
// eigen kopie van de nummers en blijft die tonen: dat is de waarheid van dát verslag. Wil je ze daar
// weg, dan wis je ze in de wedstrijd zelf via "Rugnummers" op het verslag.
// (Kort een ploeg-brede onderdrukking geprobeerd in v0.16.0 — teruggedraaid in v0.16.1: dan werd het
// per-wedstrijd invullen van een nummer een dode belofte.)
function pNum(p) { const n = (p && p.number != null) ? String(p.number).trim() : ''; return n; }
// Het rugnummerbolletje, of niets: een leeg gevuld bolletje leest als een fout.
function numDot(p, cls, stijl) { const n = pNum(p); return n ? `<div class="${cls}"${stijl ? ` style="${stijl}"` : ''}>${esc(n)}</div>` : ''; }
function numSpan(p, cls) { const n = pNum(p); return n ? `<span class="${cls}">${esc(n)}</span>` : ''; }
// Kopregel boven een selectielijst (.selrow): benoemt het smalle invoervakje vooraan, want een leeg
// vakje zonder label liet je gokken wat er in moet. De kolommen volgen exact de rij zelf: 40px voor
// het vakje, dan (in de wedstrijdwizard) 22px voor de kapiteinsknop, dan de naam.
function selRowHead(rest, metKapitein) {
  return `<div style="display:flex;align-items:flex-end;gap:10px;padding:0 0 6px;font-size:10px;font-weight:700;color:var(--txt2);text-transform:uppercase">
    <span style="width:40px;flex-shrink:0;text-align:center">Rugnr</span>
    ${metKapitein ? '<span style="width:22px;flex-shrink:0"></span>' : ''}
    <span style="flex:1">${rest || 'Speler'}</span></div>`;
}
// Voorkeurspositie + de gekozen kant/rol, voor weergave bij spelersbeheer en selectie.
function posDisplay(p) {
  const pos = normPos(p && p.pos);
  if (!pos) return '';
  const s = posSides(pos)[p.side];
  return s ? pos + ' · ' + s : pos;
}
// ----- Professionele lijn-iconen (SVG, erven kleur via currentColor) -----
const _svg = (b) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const IC = {
  ball: _svg('<circle cx="12" cy="12" r="9"/><path d="M12 7l4.76 3.45l-1.76 5.55h-6l-1.76-5.55z"/><path d="M12 7v-4m3 13l2.5 3m-.74-8.55l3.74-1.45m-11.44 7.05l-2.56 2.95m.74-8.55l-3.74-1.45"/>'),
  players: _svg('<circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3.3 2.5-5.4 5.5-5.4s5.5 2.1 5.5 5.4"/><circle cx="17.2" cy="9.2" r="2.3"/><path d="M15.4 13.9c2.7.1 4.6 2.2 4.6 4.8"/>'),
  shirt: _svg('<path d="M15 4l6 2v5h-3v8a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-8h-3v-5l6-2a3 3 0 0 0 6 0"/>'),
  trophy: _svg('<path d="M7 4.5h10V8a5 5 0 0 1-10 0V4.5z"/><path d="M7 6H4.6A2.4 2.4 0 0 0 7 9M17 6h2.4A2.4 2.4 0 0 1 17 9"/><path d="M12 13v3.5M9 20h6M10.2 20l.4-3.5h2.8l.4 3.5"/>'),
  medal: _svg('<path d="M12 4v3m-4-3v6m8-6v6"/><path d="M12 18.5l-3 1.5l.5-3.5l-2-2l3-.5l1.5-3l1.5 3l3 .5l-2 2l.5 3.5z"/>'),
  chart: _svg('<path d="M3 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M15 9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M4 20h14"/>'),
  goal: _svg('<path d="M3 20V6h18v14" stroke-width="2.2"/><path d="M3 9.5h4M3 13h3M7 6v4M11 6v3M15 6v3"/><circle cx="15.5" cy="14.5" r="3" fill="currentColor" stroke="none"/>'),
  swap: _svg('<path d="M4 8.5h13M14 5.5l3 3-3 3"/><path d="M20 15.5H7M10 12.5l-3 3 3 3"/>'),
  cardY: _svg('<rect x="6.5" y="3.5" width="9.5" height="15" rx="1.6" transform="rotate(10 12 11)" fill="#eab308" stroke="#a16207" stroke-width="1.2"/>'),
  cardR: _svg('<rect x="6.5" y="3.5" width="9.5" height="15" rx="1.6" transform="rotate(10 12 11)" fill="#dc2626" stroke="#991b1b" stroke-width="1.2"/>'),
  penalty: _svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>'),
  corner: _svg('<path d="M7 21V3.5"/><path d="M7 4h9.5l-2.6 2.8L16.5 9.6H7z" fill="currentColor" stroke="none"/>'),
  injury: _svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8.5v7M8.5 12h7" stroke-width="2.4"/>'),
  more: _svg('<circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none"/>'),
  log: _svg('<path d="M5 4.5h14v15H5z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/>'),
  shot: _svg('<circle cx="7.5" cy="14.5" r="3.5"/><path d="M10.5 11.5l7.5-7.5M14.5 4h4.5v4.5"/>'),
  save: _svg('<path d="M7 20V9a2 2 0 0 1 4 0v5"/><path d="M11 12.5a2 2 0 0 1 4 0v3.5"/><path d="M15 15.5a2 2 0 0 1 4 0V20"/>'),
  disallowed: _svg('<circle cx="12" cy="12" r="9"/><line x1="5.4" y1="5.4" x2="18.6" y2="18.6" stroke-width="2.2"/>'),
  calendar: _svg('<path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2z"/><path d="M16 3v4M8 3v4M4 11h16M8 15h2v2h-2z"/>'),
  history: _svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 3"/>'),
  live: _svg('<circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="9.5" stroke-opacity=".35"/>'),
  done: _svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8 5-5.8"/>'),
  search: _svg('<circle cx="11" cy="10.5" r="7"/><line x1="16.5" y1="16" x2="21" y2="20.5"/>'),
  assist: _svg('<path d="M5 12.5h11M13.5 8l3.5 4.5-3.5 4.5"/><circle cx="5" cy="12.5" r="2.5" fill="currentColor" stroke="none"/>'),
  timer: _svg('<circle cx="12" cy="13.5" r="8"/><path d="M12 9.5V14l2.5 2.5"/><path d="M9.5 3.5h5M12 3.5V6"/>'),
  balance: _svg('<path d="M12 4v17M4 6h16"/><path d="M6 6l-3 7h6l-3-7"/><path d="M18 6l-3 7h6l-3-7"/>'),
  compass: _svg('<circle cx="12" cy="12" r="9"/><path d="M12 4l3 8H9z" fill="currentColor" stroke="none"/><path d="M12 20l-3-8h6z" fill="currentColor" stroke="none" opacity=".4"/>'),
  clipboard: _svg('<path d="M9 2h6l1 3H8l1-3zM4 5h16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 11h8M8 15h5"/>'),
  edit: _svg('<path d="M4 20l4-1L18.5 8.5a2.12 2.12 0 0 0-3-3L4 16z"/><path d="M15.5 5.5l3 3"/>'),
  motm: _svg('<polygon points="12,2.5 14.9,9 22,9 16.4,13.5 18.7,20.5 12,16.5 5.3,20.5 7.6,13.5 2,9 9.1,9" fill="currentColor" stroke="none" opacity=".85"/>'),
  keeper: _svg('<path d="M8 20.5V9a2 2 0 0 1 4 0v5"/><path d="M12 12.5a2 2 0 0 1 4 0v4"/><path d="M16 15.5a2 2 0 0 1 4 0v2a4.5 4.5 0 0 1-4.5 4.5H8.5A4.5 4.5 0 0 1 4 17.5v-2"/><path d="M4 15.5a2 2 0 0 1 4 0"/>'),
  admins: _svg('<circle cx="9" cy="7.5" r="3.2"/><path d="M3.5 19.5c0-3.2 2.5-5.2 5.5-5.2 1.1 0 2.1.3 3 .8"/><path d="M14.5 14l2 2 4-3.5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  plus:   _svg('<path d="M12 4v16M4 12h16" stroke-width="2.2" stroke-linecap="round"/>'),
  shield: _svg('<path d="M12 3l8 3v5c0 4.5-3.5 8.5-8 9.5C7.5 19.5 4 15.5 4 11V6l8-3z"/>'),
  wrench: _svg('<path d="M14.7 3.3a5 5 0 0 0-6.3 6.3L3.3 14.7a2.3 2.3 0 0 0 3.2 3.2l5.1-5.1a5 5 0 0 0 6.3-6.3l-2.9 2.9-1.5-1.5 2.9-2.9z" fill="currentColor" stroke="none"/>'),
  trash:  _svg('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 7v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>'),
  share:  _svg('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  link:    _svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  gear:    _svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  eye:     _svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.8"/>'),
  bolt:    _svg('<path d="M13 2L3 14h9l-1 8 10-12h-9z" fill="currentColor" stroke="none"/>'),
  home:    _svg('<path d="M3 10.5l9-7 9 7V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21V13h6v8"/>'),
  plane:   _svg('<path d="M21 3L3 11l7 3 9-7-7 9 3 7z" fill="currentColor" stroke="none"/>'),
  finish:  _svg('<path d="M4 3v18M4 3h12l-3 4.5 3 4.5H4"/>'),
  auto:    _svg('<circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'),
  captain: _svg('<circle cx="12" cy="12" r="9"/><path d="M15.5 9a5 5 0 1 0 0 6" stroke-width="2.2"/>'),
  warn:    _svg('<path d="M10.3 4L1.7 19a2 2 0 0 0 1.7 3h17.2a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z"/><path d="M12 9v5"/><circle cx="12" cy="17.5" r=".8" fill="currentColor" stroke="none"/>'),
  close:   _svg('<path d="M18 6L6 18M6 6l12 12" stroke-width="2.2"/>'),
  grip:    _svg('<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>'),
  check:   _svg('<path d="M4 13l5 5L20 7" stroke-width="2.4"/>'),
  copy:    _svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  // ---- Vervangers voor het Tabler-iconenfont (B15: ~1MB font weg voor 28 iconen) ----
  mail:      _svg('<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2z"/><path d="M3 7l9 6l9-6"/>'),
  eyeOff:    _svg('<path d="M10.585 10.587a2 2 0 0 0 2.829 2.828"/><path d="M16.681 16.673a8.717 8.717 0 0 1-4.681 1.327c-3.6 0-6.6-2-9-6c1.272-2.12 2.712-3.678 4.32-4.674m2.86-1.146a9.055 9.055 0 0 1 1.82-.18c3.6 0 6.6 2 9 6c-.666 1.11-1.379 2.067-2.138 2.87"/><path d="M3 3l18 18"/>'),
  crown:     _svg('<path d="M12 6l4 6l5-4l-2 10h-14l-2-10l5 4z"/>'),
  qrcode:    _svg('<path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M7 17v.01M14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M7 7v.01M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/><path d="M17 7v.01M14 14h3M20 14v.01M14 14v3M14 20h3M17 17h3M20 17v3"/>'),
  hourglass: _svg('<path d="M6.5 7h11M6.5 17h11"/><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1z"/><path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0-1-1h-10a1 1 0 0 0-1 1z"/>'),
  playFilled:  _svg('<path d="M6 4v16a1 1 0 0 0 1.524.852l13-8a1 1 0 0 0 0-1.704l-13-8a1 1 0 0 0-1.524.852z" fill="currentColor" stroke="none"/>'),
  stopFilled:  _svg('<path d="M17 4h-10a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-10a3 3 0 0 0-3-3z" fill="currentColor" stroke="none"/>'),
  pauseFilled: _svg('<path d="M9 4h-2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2z" fill="currentColor" stroke="none"/><path d="M17 4h-2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2z" fill="currentColor" stroke="none"/>'),
  dot:       _svg('<path d="M7 3.34a10 10 0 1 1-4.995 8.984l-.005-.324l.005-.324a10 10 0 0 1 4.995-8.336z" fill="currentColor" stroke="none"/>'),
  moon:      _svg('<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1-8.313-12.454z"/>'),
  bell:      _svg('<path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/>'),
  lock:      _svg('<path d="M5 13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2z"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0-2 0"/><path d="M8 11v-4a4 4 0 1 1 8 0v4"/>'),
  shieldLock: _svg('<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1-8.5 15a12 12 0 0 1-8.5-15a12 12 0 0 0 8.5-3"/><path d="M12 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/><path d="M12 12l0 2.5"/>'),
  download:  _svg('<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M7 11l5 5l5-5"/><path d="M12 4l0 12"/>'),
  upload:    _svg('<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M7 9l5-5l5 5"/><path d="M12 4l0 12"/>'),
  undo:      _svg('<path d="M9 14l-4-4l4-4"/><path d="M5 10h11a4 4 0 1 1 0 8h-1"/>'),
  stopwatch: _svg('<circle cx="12" cy="13" r="7"/><path d="M14.5 10.5l-2.5 2.5"/><path d="M17 8l1-1"/><path d="M14 3h-4"/>'),
  table:     _svg('<path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2z"/><path d="M3 10h18M10 3v18"/>'),
  code:      _svg('<path d="M7 8l-4 4l4 4M17 8l4 4l-4 4M14 4l-4 16"/>'),
  fileText:  _svg('<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 9l1 0M9 13l6 0M9 17l6 0"/>'),
  archive:   _svg('<path d="M3 4h18v4h-18z"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-11"/><path d="M10 12h4"/>'),
};
const icI = ic => `<span class="ic-i">${ic}</span> `;
function tName(m) { return (m && m.teamName) || 'Sparta'; }
// Uitwedstrijd? Bepaalt overal enkel de weergave-volgorde: thuisploeg eerst in score, titel,
// tussenstanden en het deelbericht.
// Een TORNOOIWEDSTRIJD is neutraal terrein: er is geen thuisploeg, en de locatie van zo'n wedstrijd
// is de locatie van het tornooi ("Sportpark Aalter"), dus zou alles als uitwedstrijd gelezen worden
// en stond je eigen score overal tweede — een 3-1 winst las als "1-3". Eigen ploeg dus altijd eerst.
function isAway(m) { return !!(m && !m.tournamentId && m.location && m.location.toLowerCase() !== 'thuis'); }
function matchTitle(m) {
  const own = esc(tName(m)) + (m.subteam ? ` (${esc(m.subteam)})` : ''), opp = esc(m.opponent || '');
  return isAway(m) ? `${opp} vs ${own}` : `${own} vs ${opp}`;
}
// Score in thuisploeg-eerst volgorde. cls = CSS-klasse voor eigen score (groen).
function scoreHtml(m, cls) {
  const c = cls || 'us';
  return isAway(m)
    ? `${m.scoreThem} – <span class="${c}">${m.scoreUs}</span>`
    : `<span class="${c}">${m.scoreUs}</span> – ${m.scoreThem}`;
}
// Platte tekst voor score (bv. in share/PDF-titel).
function scoreTxt(m) {
  return isAway(m) ? `${m.scoreThem}-${m.scoreUs}` : `${m.scoreUs}-${m.scoreThem}`;
}
// Speelminuten van één speler als getal om te tonen. ÉÉN regel voor de hele app: afronden.
// Voordien kapte de spelerslijst af (Math.floor) terwijl het dagoverzicht van een tornooi, de
// deel-kolommen en het percentage afrondden. Dezelfde speler stond dan op 9' in het
// wedstrijdverslag en 10' in het dagoverzicht, en een wissel op exact 4 min las als "3' · 20%"
// (20% van 20 min = 4'). Wijzig je dit, kijk dan ook naar `mn()` in teams-tournaments.js en
// stats-settings.js — die doen hetzelfde voor de totalen.
function playedMin(ms) { return Math.round((ms || 0) / 60000); }
// Club/ploeg-branding (logo + naam), per toestel bewaard
function getClubName() { return localStorage.getItem('voetbal_club_name') || 'Mijn ploeg'; }
// Alle eigen sporen van één gebruiker uit de cloud halen: lidmaatschappen, aanvragen en de
// persoonlijke index-records. Gedeeld door "Account verwijderen" (Instellingen) en door het
// afmelden van een gast — anders lopen die twee opruimingen uit elkaar.
// Moet ALTIJD vóór user.delete() lopen: daarna bestaat auth.uid niet meer en weigeren de
// beveiligingsregels elke schrijfactie, waardoor de records als wees achterblijven.
// Data van de ploeg zelf (wedstrijden, spelers) blijft bewust staan; die is van de anderen.
async function wisEigenCloudSporen(uid) {
  if (!fbdb || !uid) return;
  // Ploegen uit het geheugen én uit de database: een gast die de app opnieuw opende, heeft
  // `userTeams` niet noodzakelijk gevuld, en dan zou zijn lidmaatschap blijven staan.
  let tids = Object.keys(userTeams || {});
  try {
    const s = await fbOnce(fbdb.ref('users/' + uid + '/teams'));
    tids = [...new Set(tids.concat(Object.keys(s.val() || {})))];
  } catch (e) {}
  for (const tid of tids) {
    try { await fbdb.ref('memberInfo/' + tid + '/' + uid).remove(); } catch (e) {}
    // teamAdminRequests VÓÓR het lidmaatschap wissen: de self-verwijder-regel vereist dat je nog
    // viewer bent — daarna wordt dit stil geweigerd en blijft een aanvraag met naam als wees achter.
    try { await fbdb.ref('teamAdminRequests/' + tid + '/' + uid).remove(); } catch (e) {}
    try { await fbdb.ref('teams/' + tid + '/members/' + uid).remove(); } catch (e) {}
  }
  for (const cid of Object.keys(myClubs || {})) {
    try { await fbdb.ref('clubs/' + cid + '/admins/' + uid).remove(); } catch (e) {}
  }
  try { await fbdb.ref('users/' + uid).remove(); } catch (e) {}
  // Naam/e-mail los van een ploeg. Uitnodigingscodes (invites/) blijven ongemoeid: die zijn niet
  // op uid geïndexeerd en verwijderen zou de actieve link van een hele ploeg kunnen breken.
  try { await fbdb.ref('usersByEmail/' + uid).remove(); } catch (e) {}
  try { await fbdb.ref('approvedAdmins/' + uid).remove(); } catch (e) {}
  try { await fbdb.ref('adminRequests/' + uid).remove(); } catch (e) {}
  try { await fbdb.ref('rejectedAdmins/' + uid).remove(); } catch (e) {}
}
function getClubLogo() { return 'logo.png'; } // vast MatchDelegate-merklogo, niet wijzigbaar
// Zelfde merklogo zonder de donkere tegel eronder — losse bal, geen woordmerk. Gebruikt op de
// splash en in de app-header, waar de naam er in tekst naast staat.
const APP_LOGO_TRANSPARANT = 'logo_no_background.png';
// Merkje mét de naam erin, doorzichtig, in twee vormen en elk in een versie voor een lichte en een
// donkere ondergrond. Samengesteld uit hetzelfde pictogram; zie scratchpad/merkje.py.
//  - breed: pictogram + naam naast elkaar, voor smalle stroken zoals de voettekst van een PDF.
//    De naam is daar bewust groot t.o.v. het pictogram, anders is hij op 12 pt niet te lezen.
//  - hoog : pictogram, groene balk, naam en baseline onder elkaar — de opstartanimatie als beeld.
const APP_LOGO_BREED = 'logo_breed.png';
const APP_LOGO_BREED_DONKER = 'logo_breed_op_donker.png';
const APP_LOGO_HOOG = 'logo_hoog.png';
const APP_LOGO_HOOG_DONKER = 'logo_hoog_op_donker.png';
// Hoeveel pixels een logo in de PDF krijgt per PDF-punt. Eén punt is 1/72 inch, dus een logo dat
// even veel pixels als punten meekrijgt, staat op 72 dpi in het document: wazig zodra je inzoomt
// of afdrukt. Met 8 zit je op ≈576 dpi, ruim boven wat een printer zet, en blijft het logo ook bij
// stevig inzoomen scherp. Kost weinig: jsPDF neemt eenzelfde afbeelding maar één keer op, hoe vaak
// ze ook geplaatst wordt.
const PDF_LOGO_DICHTHEID = 8;
// jsPDF bewaart een afbeelding standaard ONGECOMPRIMEERD: 320×320 px kostte zo 300 KB ruwe pixels
// plus 100 KB voor het doorzichtigheidskanaal. Met deze vlag als `compression`-argument van
// addImage() gaat datzelfde logo door zlib en blijft er een fractie van over — bij vlakke kleuren
// zelfs een twintigste. Geef hem mee bij élke addImage, anders groeit een verslag met foto's en
// logo's snel naar een halve megabyte.
const PDF_BEELD_COMPRESSIE = 'SLOW';   // 'SLOW' = beste compressie; deze beelden zijn klein genoeg
// Clublogo van de actieve ploeg (data-URI), of leeg als de club er geen heeft. Valt terug op het
// laatst gekende logo van DEZE ploeg (per ploeg gecacht, zie rememberTeamClubLogo): activeClubLogo
// hangt aan de info-fetch, die aan het veld kan mislukken — en dan hoort een PDF niet plots zonder
// logo te verschijnen. Per ploeg, dus nooit het logo van een andere club.
function getActiveClubLogo() {
  if (activeClubLogo) return activeClubLogo;
  if (activeTeamId && teamClubLogos[activeTeamId]) return teamClubLogos[activeTeamId];
  // Laatste terugval: het logo van een ándere ploeg van DEZELFDE club. Eén club heeft één logo, dus
  // dit is nooit het verkeerde beeld — en het redt een ploeg waarvan het logo niet (of nog niet)
  // gedenormaliseerd is, zoals elke ploeg aangemaakt vóór v0.31.8. Enkel bij een gekende clubId.
  const cid = activeClubId || (activeTeamId && teamClubIds[activeTeamId]);
  if (cid) {
    for (const tid in teamClubLogos) if (teamClubIds[tid] === cid && teamClubLogos[tid]) return teamClubLogos[tid];
  }
  return '';
}
// Lees een afbeeldingsbestand in, verklein tot max `size` px en comprimeer tot een
// kleine data-URI (geschikt om in RTDB te bewaren). Behoudt transparantie (PNG) bij
// bestanden mét alpha, anders JPEG voor een kleinere payload. Geeft een data-URI terug.
const CLUB_LOGO_MAX_PX = 512;    // was 256: te weinig pixels voor een scherp logo in de PDF
const CLUB_LOGO_MAX_URI = 120000; // ±88 KB — grens waarboven we liever verkleinen dan bewaren
function fileToClubLogoDataUri(file, size = CLUB_LOGO_MAX_PX) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error('Geen afbeelding')); return; }
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Kon bestand niet lezen'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Ongeldige afbeelding'));
      img.onload = () => {
        const teken = maat => {
          const scale = Math.min(1, maat / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          return cv;
        };
        const isPng = /png/i.test(file.type);
        if (!isPng) { resolve(teken(size).toDataURL('image/jpeg', 0.82)); return; }
        // Een logo hoort transparant te blijven: JPEG zou er een witte blokrand van maken op een
        // donkere achtergrond. Valt de PNG te groot uit (het logo gaat naar Firebase en wordt naar
        // élke ploeg van de club gekopieerd), dan liever een paar pixels kleiner dan die
        // transparantie kwijt. Pas als het dan nog niet past, wint de payload.
        for (const maat of [size, 384, 256]) {
          const uri = teken(maat).toDataURL('image/png');
          if (uri.length <= CLUB_LOGO_MAX_URI) { resolve(uri); return; }
        }
        resolve(teken(size).toDataURL('image/jpeg', 0.82));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function setupDone() { return !!localStorage.getItem('voetbal_setup_done'); }
// ----- Thema (kleuren passen zich aan het logo aan) -----
const GENERIC_THEME = { primary: '#2f9e57', accent: '#2f74bd', dark: '#0f172a' };
function clamp255(n) { return Math.max(0, Math.min(255, Math.round(n))); }
function parseHex(h) { h = h.replace('#', ''); return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) }; }
function toHex(r, g, b) { return '#' + [r,g,b].map(v => clamp255(v).toString(16).padStart(2,'0')).join(''); }
function mixHex(a, b, t) { const A = parseHex(a), B = parseHex(b); return toHex(A.r+(B.r-A.r)*t, A.g+(B.g-A.g)*t, A.b+(B.b-A.b)*t); }
function shade(hex, amt) { return amt < 0 ? mixHex(hex, '#000000', -amt) : mixHex(hex, '#ffffff', amt); }
function applyTheme(t) {
  t = t || GENERIC_THEME;
  const s = document.documentElement.style, set = (k,v) => s.setProperty(k,v);
  set('--grn', t.primary); set('--grn2', shade(t.primary,-0.18)); set('--grnp', mixHex(t.primary,'#ffffff',0.88)); set('--grnb', mixHex(t.primary,'#ffffff',0.7));
  set('--org', t.accent); set('--org2', shade(t.accent,-0.15)); set('--orgp', mixHex(t.accent,'#ffffff',0.86)); set('--orgb', mixHex(t.accent,'#ffffff',0.66));
  set('--blk', t.dark); set('--blk2', mixHex(t.dark,'#ffffff',0.1)); set('--blk3', mixHex(t.dark,'#ffffff',0.2));
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = t.dark;
}
function applyStoredTheme() { let t = null; try { t = JSON.parse(localStorage.getItem('voetbal_theme') || 'null'); } catch (e) {} applyTheme(t || GENERIC_THEME); }
// Donkere modus (per toestel). Drie standen in voetbal_dark:
//   '1'    = altijd donker
//   'auto' = volg de systeeminstelling van het toestel
//   '0' of niets = altijd licht — dit blijft bewust de STANDAARD. Wie de app enkel opent om mee te
//   kijken (ouders) mag niet plots een ander uiterlijk krijgen omdat zijn gsm op donker staat; wie
//   het wil, zet 'auto' zelf aan in Instellingen.
function darkPref() { const v = localStorage.getItem('voetbal_dark'); return (v === '1' || v === 'auto') ? v : '0'; }
function systemDark() { try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); } catch (e) { return false; } }
function darkOn() { const p = darkPref(); return p === '1' || (p === 'auto' && systemDark()); }
function applyDark() { document.body.classList.toggle('dark', darkOn()); }
function setDarkPref(v) { localStorage.setItem('voetbal_dark', v); applyDark(); render(); }
// Staat de voorkeur op 'auto', dan moet de app meteen mee omschakelen wanneer het toestel 's avonds
// vanzelf naar donker gaat. Zonder deze listener zie je dat pas na een herstart van de app.
(function watchSystemDark() {
  if (!window.matchMedia) return;
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (darkPref() !== 'auto') return; applyDark(); if (typeof render === 'function') render(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange); // oudere WebKit (iOS < 14)
  } catch (e) {}
})();
// ----- Ploegen v2: {id, name, players:[{id,name,number,pos}]} -----
function getTeamsV2() { try { return JSON.parse(localStorage.getItem('voetbal_teams_v2') || '[]'); } catch (e) { return []; } }
function saveTeamsV2(arr) { localStorage.setItem('voetbal_teams_v2', JSON.stringify(arr)); cloudOnLocalTeamsSave(arr); }
function teamById(id) { return getTeamsV2().find(t => t.id === id) || null; }
// ----- Rooster per ploeg: cache + "al geladen?"-vlag -----
// In cloudmodus bevat 'voetbal_teams_v2' enkel het rooster van de ACTIEVE ploeg: applyCloudTeams
// schrijft de hele sleutel over met wat de roster-listener binnenbrengt. Tussen het wisselen van
// ploeg en die eerste snapshot stond hier dus nog het rooster van de VORIGE ploeg (spelers van de
// verkeerde ploeg) of niets ("nog geen spelers" op een ploeg die er wél heeft). Twee dingen lossen
// dat op: een cache per ploeg zodat een tweede bezoek meteen klopt (ook offline), en een vlag die
// "leeg" van "nog niet geladen" onderscheidt — hetzelfde patroon als _trnSquadLoaded.
let rosterTeamId = null;   // voor welke ploeg staat het rooster in voetbal_teams_v2?
let rosterLoaded = false;  // is dat rooster bruikbaar? (cachetreffer of snapshot van de cloud)
function rosterCacheKey(teamId) { return 'voetbal_roster_' + teamId; }
function cacheRoster(teamId, arr) {
  if (!teamId) return;
  try { localStorage.setItem(rosterCacheKey(teamId), JSON.stringify(arr || [])); } catch (e) {}
}
function forgetRosterCache(teamId) {
  if (!teamId) return;
  try { localStorage.removeItem(rosterCacheKey(teamId)); } catch (e) {}
}
// Zet het laatst gekende rooster van deze ploeg klaar vóór het scherm rendert. Is er geen cache,
// dan liever leeg dan de lijst van een andere ploeg laten staan — rosterReady() zorgt ervoor dat
// die leegte als "laden…" gelezen wordt en niet als "geen spelers".
function hydrateRosterFromCache(teamId) {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(rosterCacheKey(teamId)) || '[]'); } catch (e) { arr = []; }
  if (!Array.isArray(arr)) arr = [];
  localStorage.setItem('voetbal_teams_v2', JSON.stringify(arr));
  return arr.length > 0;
}
// Mag je op getTeamsV2() vertrouwen voor de actieve ploeg? Lokaal (zonder cloud) altijd.
function rosterReady() { return !cloudReady || (rosterLoaded && rosterTeamId === activeTeamId); }
// Tekst bij een lege spelerslijst: "laden…" zolang de cloud niet geantwoord heeft, en pas daarna
// het eerlijke "geen spelers". Zonder dit las een nog niet gesynct rooster als een leeg rooster.
function rosterEmptyText(txt) { return rosterReady() ? txt : 'Spelers laden…'; }
// Horen twee wedstrijden bij dezelfde ploeg? Bij voorkeur via het stabiele teamId (sinds v0.5.34),
// met de teamName-fallback voor oudere wedstrijden. De matches-store is niet per ploeg gescheiden.
function sameTeamAsMatch(a, b) {
  if (!a || !b) return false;
  if (a.teamId && b.teamId) return a.teamId === b.teamId;
  return !!(a.teamName && a.teamName === b.teamName);
}
// Staat deze wedstrijd duidelijk vergeten open? Live, en de wandklok is meer dan een half uur
// voorbij het moment waarop het lopende blok had moeten eindigen. Zo blijft een normale rust of een
// blok dat wat uitloopt buiten schot, maar valt een wedstrijd die na de handdruk nooit afgesloten
// werd wél op — die laat zijn klok anders uren doorlopen.
const FORGOTTEN_MATCH_GRACE_MS = 30 * 60000;
function looksForgotten(m) {
  if (!m || m.status !== 'live') return false;
  const qs = m.quarters || [];
  const q = qs[qs.length - 1];
  if (!q || !q.startTime) return false;
  const nominal = (m.quarterDuration || 0) * 60000;
  return Date.now() > q.startTime + nominal + FORGOTTEN_MATCH_GRACE_MS;
}
// Tornooien (localStorage)
function getTournaments() { try { return JSON.parse(localStorage.getItem('voetbal_tournaments') || '[]'); } catch(e) { return []; } }
// LET OP: dit schrijft enkel lokaal, bewust ZONDER cloud-sync. Vroeger duwde deze functie de hele
// tornooi-array met één set() naar de cloud (last-writer-wins), waardoor een tornooi dat een ander
// toestel intussen toevoegde stil verdween. Gebruik saveTournament()/deleteTournament() voor alles
// wat ook moet syncen; blijft er ooit een aanroeper op deze functie hangen, dan synct die gewoon
// niet — veel veiliger dan de volledige cloudnode overschrijven.
function setTournamentsLocal(arr) { localStorage.setItem('voetbal_tournaments', JSON.stringify(arr)); }
function saveTournaments(arr) { setTournamentsLocal(arr); }
// Eén tornooi opslaan (lokaal + enkel dat ene child in de cloud), met een tijdstempel zodat
// applyCloudTournaments een recentere lokale versie kan herkennen. Zelfde patroon als dbSave().
function saveTournament(t) {
  if (!t || !t.id) return;
  t.updatedAt = Date.now();
  const arr = getTournaments();
  const i = arr.findIndex(x => x.id === t.id);
  if (i >= 0) arr[i] = t; else arr.push(t);
  setTournamentsLocal(arr);
  cloudOnLocalTournamentSave(t);
}
function deleteTournament(id) {
  if (!id) return;
  setTournamentsLocal(getTournaments().filter(t => t.id !== id));
  cloudOnLocalTournamentDelete(id);
}
function tournamentById(id) { return getTournaments().find(t => t.id === id) || null; }
// Een tornooi is afgesloten zodra het expliciet afgesloten werd. Zonder dat veld (alle bestaande
// tornooien) valt het terug op de oude regel: de datum bepaalt of het bij de gespeelde hoort.
function tournamentClosed(t) { return !!(t && t.status === 'done'); }
// Een wedstrijd die niet doorgaat: sinds v0.32.0 een vierde statuswaarde naast planned/live/done.
// Bewust géén apart vlaggetje: zo valt een geannuleerde wedstrijd vanzelf weg uit élke filter die op
// 'done' staat (statistieken, tornooistanden, uitslagen) én uit die op 'planned' (komende wedstrijd,
// "nog te spelen" in een tornooi). Alleen de weergave moet ze expliciet kennen.
function matchCancelled(m) { return !!(m && m.status === 'cancelled'); }
// Tornooiselectie uitlezen. Nieuw formaat: squad.players (elk met sel 'mee'/'absent'). Oud formaat:
// squad.base/bench/absent. Beide worden hier naar één lijst met een sel-veld genormaliseerd, zodat
// elke aanroeper dezelfde spelers ziet (vroeger stond die normalisatie 5x apart, met verschillen).
function tournamentSquadList(t) {
  const sq = (t && t.squad) || {};
  if (sq.players) return sq.players;
  return [
    ...(sq.base   || []).map(s => Object.assign({}, s, { sel: 'mee' })),
    ...(sq.bench  || []).map(s => Object.assign({}, s, { sel: 'mee' })),
    ...(sq.absent || []).map(s => Object.assign({}, s, { sel: 'absent' })),
  ];
}
// Wie effectief meegaat naar het tornooi. Beschikbaarheid (NB) geef je één keer in bij de
// tornooiselectie; enkel deze spelers mogen dus in de pool van een tornooiwedstrijd komen.
function tournamentSquadMee(t) { return tournamentSquadList(t).filter(s => s.sel !== 'absent'); }
// Trainer en ploegverantwoordelijke van een tornooiwedstrijd komen van het TORNOOI, niet van de
// wedstrijd: op een tornooidag zijn ze voor alle wedstrijden dezelfde. Ze werden bij het aanmaken
// van de wedstrijd één keer gekopieerd, dus wie ze nadien in het tornooi wijzigde, zag dat nergens
// terug. Lees ze daarom altijd via deze twee helpers.
// De kopie in de wedstrijd (m.trainer / m.responsible) blijft bestaan als terugval — een kijker of
// een gewist tornooi levert hier geen tornooi op, en dan is de oude waarde nog altijd beter dan
// niets. Het datamodel verandert niet.
function matchTrainer(m) {
  if (!m) return '';
  const t = m.tournamentId ? tournamentById(m.tournamentId) : null;
  return (t && t.trainer) || m.trainer || '';
}
function matchResponsible(m) {
  if (!m) return '';
  const t = m.tournamentId ? tournamentById(m.tournamentId) : null;
  return (t && t.responsible) || m.responsible || '';
}
// --- Meerdere trainers en ploegverantwoordelijken -----------------------------------------
// Een wedstrijd (of tornooi) kan door meer dan één trainer én meer dan één ploegverantwoordelijke
// begeleid worden. Ze zitten bewust in dezelfde velden `trainer` en `responsible` als één
// komma-gescheiden tekst: het datamodel verandert niet, bestaande wedstrijden, tornooien en ploegen
// blijven leesbaar, en een oudere app-versie of een kijker toont gewoon de hele tekst. Datzelfde
// geldt voor `team.responsible` in het rooster. Lees ze nooit als lijst uit zonder staffList().
function staffList(s) { return String(s || '').split(',').map(x => x.trim()).filter(Boolean); }
function staffJoin(arr) { return (arr || []).map(x => String(x || '').trim()).filter(Boolean).join(', '); }
// Enkelvoud of meervoud, naargelang er één of meer namen in het veld staan.
function trainerLabel(s) { return staffList(s).length > 1 ? 'Trainers' : 'Trainer'; }
function responsibleLabel(s) { return staffList(s).length > 1 ? 'Ploegverantwoordelijken' : 'Ploegverantwoordelijke'; }
// De namen die in het rooster van de ploeg staan — de aanvinkbare keuzes.
function teamTrainerNames(team) { return (((team || {}).trainers) || []).map(t => (t.name || '').trim()).filter(Boolean); }
function teamResponsibleNames(team) { return staffList((team || {}).responsible); }
// Keuzeveld: de namen uit het ploegrooster aanvinken, plus een vrij veld voor wie er niet in staat
// (daar mogen ook meerdere namen, gescheiden door komma's). `prefix` is het id-voorvoegsel van het
// scherm ('n' in de wedstrijdwizard, 'trn' bij een tornooi, 'ei' bij Info bewerken), `soort` is
// 'trn' voor trainers of 'resp' voor ploegverantwoordelijken.
const STAFF_KIND = {
  trn:  { label: 'Trainer(s)', een: 'trainer', hint: 'Meerdere trainers mogen: vink er meerdere aan, of scheid namen met een komma.' },
  resp: { label: 'Ploegverantwoordelijke(n)', een: 'ploegverantwoordelijke', hint: 'Meerdere ploegverantwoordelijken mogen: vink er meerdere aan, of scheid namen met een komma.' },
};
function staffPickerHtml(prefix, soort, namen, current) {
  const k = STAFF_KIND[soort];
  const gekozen = staffList(current);
  const laag = gekozen.map(n => n.toLowerCase());
  const known = (namen || []).map(n => String(n || '').trim()).filter(Boolean);
  const extra = gekozen.filter(n => !known.some(x => x.toLowerCase() === n.toLowerCase()));
  const boxes = known.map(n => `<label class="chkrow"><input type="checkbox" class="${prefix}-${soort}-cb" value="${esc(n)}" ${laag.includes(n.toLowerCase()) ? 'checked' : ''}> ${esc(n)}</label>`).join('');
  return `<div class="fg"><label>${k.label}</label>
    ${boxes ? `<div class="trn-pick">${boxes}</div>` : ''}
    <input id="${prefix}-${soort}-other" type="text" value="${esc(extra.join(', '))}" placeholder="${known.length ? 'Andere ' + k.een + ' (optioneel)' : 'Naam ' + k.een + ' (optioneel)'}" autocomplete="off" style="margin-top:8px">
    <div style="font-size:11px;color:var(--txt2);margin-top:5px">${k.hint}</div>
  </div>`;
}
// Leest het keuzeveld hierboven terug uit. Staat het niet op dit scherm (bv. een tornooiwedstrijd,
// waar trainer en ploegverantwoordelijke van het tornooi komen), dan blijft de bestaande waarde
// ongemoeid.
function readStaffPicker(prefix, soort, fallback) {
  const boxes = Array.from(document.querySelectorAll('.' + prefix + '-' + soort + '-cb'));
  const other = document.getElementById(prefix + '-' + soort + '-other');
  if (!boxes.length && !other) return fallback || '';
  const namen = boxes.filter(b => b.checked).map(b => b.value);
  if (other) staffList(other.value).forEach(n => { if (!namen.some(x => x.toLowerCase() === n.toLowerCase())) namen.push(n); });
  return staffJoin(namen);
}
// De terugvalkopie in de wedstrijd bijwerken telkens ze bewaard wordt, zodat ze niet verouderd
// raakt tegenover het tornooi. Roep dit aan vlak vóór dbSave() van een tornooiwedstrijd.
function syncTournamentStaff(m) {
  if (!m || !m.tournamentId) return;
  const t = tournamentById(m.tournamentId); if (!t) return;
  m.trainer = t.trainer || '';
  m.responsible = t.responsible || '';
}
// Standaard wedstrijdduur van een tornooi: hoeveel blokken en hoe lang een blok duurt. Op een
// tornooidag ligt dat voor de hele dag vast, dus geef je het één keer bij het tornooi in en neemt
// elke nieuwe wedstrijd het over — afwijken per wedstrijd blijft mogelijk in de wedstrijdwizard.
// Tornooien van vóór v0.17.4 hebben deze velden niet en vallen terug op 1 blok van 20 minuten, de
// waarde die tot dan hardgecodeerd in addTournamentMatch stond. Geen migratie nodig.
const TRN_PERIODS_DEFAULT = { periodKey: 'delen', numQuarters: 1, quarterDuration: 20 };
function tournamentPeriods(t) {
  const p = t || {};
  const pk = PERIOD_TYPES[p.periodKey] ? p.periodKey : TRN_PERIODS_DEFAULT.periodKey;
  const nq = parseInt(p.numQuarters, 10);
  const qd = parseInt(p.quarterDuration, 10);
  return {
    periodKey: pk,
    numQuarters: Number.isFinite(nq) && nq > 0 ? nq : TRN_PERIODS_DEFAULT.numQuarters,
    quarterDuration: Number.isFinite(qd) && qd > 0 ? qd : TRN_PERIODS_DEFAULT.quarterDuration,
  };
}
// Leesbare weergave van die standaard, bv. "1 × 20 min" of "2 × 30 min".
function tournamentPeriodsLabel(t) {
  const p = tournamentPeriods(t);
  return `${p.numQuarters} × ${p.quarterDuration} min`;
}
// Puntenverdeling van een tornooi. Verschilt per tornooi: 3/1/0 is de standaard, maar 2/1/0 komt bij
// jeugdtornooien ook voor. Sommige tornooien belonen een gelijkspel MET doelpunten (1-1, 2-2) anders
// dan een 0-0 — vandaar de aparte `drawNil`. Die valt terug op `draw` wanneer hij ontbreekt, dus
// tornooien van vóór v0.17.5 rekenen exact zoals voorheen; tornooien van vóór v0.9.1 hebben helemaal
// geen `points`-veld en vallen terug op 3/1/0.
const TRN_POINTS_DEFAULT = { win: 3, draw: 1, loss: 0 };
function tournamentPoints(t) {
  const p = (t && t.points) || {};
  const num = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : d; };
  const draw = num(p.draw, TRN_POINTS_DEFAULT.draw);
  return {
    win: num(p.win, TRN_POINTS_DEFAULT.win),
    draw,
    drawNil: num(p.drawNil, draw),
    loss: num(p.loss, TRN_POINTS_DEFAULT.loss),
  };
}
// "3/1/0", of "3/2/1/0" wanneer een 0-0 anders telt dan een gelijkspel met doelpunten. Zolang die
// twee gelijk zijn blijft het driedelige schema staan — dat is wat iedereen kent.
function tournamentPointsLabel(t) {
  const p = tournamentPoints(t);
  return p.drawNil === p.draw ? `${p.win}/${p.draw}/${p.loss}` : `${p.win}/${p.draw}/${p.drawNil}/${p.loss}`;
}
// Uitleg die bij het schema hoort, zodat "3/2/1/0" leesbaar blijft.
function tournamentPointsLegend(t) {
  const p = tournamentPoints(t);
  return p.drawNil === p.draw ? 'winst/gelijk/verlies' : 'winst/gelijk met doelpunten/0-0/verlies';
}
// Alles op 0 = er wordt niet op punten gespeeld; dan laten we de puntenregel helemaal weg.
function tournamentUsesPoints(t) { const p = tournamentPoints(t); return (p.win + p.draw + p.drawNil + p.loss) > 0; }
function goTournament(id) { currentTournament = tournamentById(id); go('tournament'); }
// Score & opstelling herberekenen uit de events (na correctie/verwijdering)
function recomputeScore(m) {
  let us = 0, them = 0;
  for (const e of m.events) {
    if (e.type === 'goal_us' || e.type === 'own_goal_them') us++;
    else if (e.type === 'goal_them' || e.type === 'own_goal') them++;
    else if (e.type === 'penalty_us' && e.scored) us++;
    else if (e.type === 'penalty_them' && e.scored) them++;
  }
  m.scoreUs = us; m.scoreThem = them;
}
// Tussenstand t.e.m. een bepaald deel (kwart/helft/...).
function scoreUpToQuarter(m, qNum) {
  let us = 0, them = 0;
  for (const e of m.events) {
    if (e.quarterNum == null || e.quarterNum > qNum) continue;
    if (e.type === 'goal_us' || e.type === 'own_goal_them') us++;
    else if (e.type === 'goal_them' || e.type === 'own_goal') them++;
    else if (e.type === 'penalty_us' && e.scored) us++;
    else if (e.type === 'penalty_them' && e.scored) them++;
  }
  return { us, them };
}
// Uitgesloten spelers: wie een rode kaart kreeg (ook de automatische na twee gele, zie
// autoSecondYellow) mag niet meer op het veld komen en mag ook NIET vervangen worden — zijn plaats
// blijft leeg en de ploeg speelt met een man minder. Dat is een spelregel, geen voorkeur: overal
// waar een opstelling, een bank of een wissel iemand het veld op stuurt, hoort dit gecheckt te
// worden. Wordt de kaart weer verwijderd (verkeerd ingegeven), dan valt dit automatisch weg.
function uitgeslotenIds(m) {
  return new Set(((m && m.events) || []).filter(e => e.type === 'red_card' && e.playerId).map(e => e.playerId));
}
function isUitgesloten(m, pid) { return !!pid && uitgeslotenIds(m).has(pid); }
// Hoeveel spelers er nog op het veld MOGEN staan: de wedstrijdvorm min de uitsluitingen. Een rode
// kaart betekent een man minder — die plaats mag niet opgevuld worden, ook niet van de bank. Overal
// waar iemand het veld op gezet wordt, hoort dit de bovengrens te zijn en niet de wedstrijdvorm zelf.
function veldPlaatsenNu(m) {
  const vorm = (MATCH_TYPES[m && m.matchType] || MATCH_TYPES['8v8']).field;
  return Math.max(0, vorm - uitgeslotenIds(m).size);
}
// Mag deze speler nu op het veld staan? Afwezig gemarkeerd of uitgesloten: nee.
function magOpHetVeld(m, p) { return !!p && !p.absent && !isUitgesloten(m, p.id); }
function recomputeOnField(m) {
  // Wie als "niet aanwezig" gemarkeerd is, staat nooit op het veld — wat de events ook zeggen.
  // De beginstand hield daar al rekening mee, maar de replay hieronder zette een speler die
  // eerder via een wissel inkwam er stil weer op. Zo stond iemand die al naar huis was na een
  // undoLast (of het verwijderen van een event) opnieuw op het veld én in de wisselmodal.
  const absent = new Set(m.players.filter(p => p.absent).map(p => p.id));
  // Uitgesloten spelers idem: zonder deze set zette een wissel die ná de rode kaart in de events
  // staat hem er stil weer op, en dan speelde de ploeg weer voltallig.
  const uit = uitgeslotenIds(m);
  const on = {}; m.players.forEach(p => on[p.id] = !!p.starting && !p.absent && !uit.has(p.id));
  for (const e of [...m.events].sort((a, b) => a.gameTimeMs - b.gameTimeMs)) {
    if (e.type === 'substitution') { if (e.playerOutId) on[e.playerOutId] = false; if (e.playerInId && !absent.has(e.playerInId) && !uit.has(e.playerInId)) on[e.playerInId] = true; }
    if (e.type === 'red_card' && e.playerId) on[e.playerId] = false;
    if (e.type === 'injury' && e.leavesField && e.playerId) on[e.playerId] = false;
  }
  m.players.forEach(p => p.onField = !!on[p.id]);
}
// Een wedstrijd kent drie toestanden vóór de aftrap: nog geen selectie, wel een selectie maar nog
// geen opstelling, en allebei. Die middelste bestaat sinds v0.30.0: je kan de selectie opslaan
// zonder de spelers al op het veld te zetten. De basisspelers staan dan gewoon in m.players
// (starting), maar zonder plaats (x/y), en de wedstrijd draagt het optionele vlaggetje
// `lineupPending`. Oudere wedstrijden hebben dat veld niet en gelden dus altijd als "opstelling
// ingegeven" — hun gedrag verandert nergens.
function heeftSelectie(m) { return !!(m && m.players && m.players.length); }
function heeftOpstelling(m) {
  if (!heeftSelectie(m)) return false;
  if (m.lineupPending) return false;
  // Terugval voor het geval het vlaggetje ontbreekt: zonder één basisspeler mét plaats is er
  // feitelijk geen opstelling om te tonen.
  return m.players.some(p => p.starting && typeof p.x === 'number');
}

// ===================== DATABASE =====================
const DB_NAME = 'voetbal_db', DB_VER = 1;
let db;
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('matches')) d.createObjectStore('matches', { keyPath: 'id' });
    };
    r.onsuccess = e => res(e.target.result);
    r.onerror = e => rej(e.target.error);
  });
}
function dbAll() {
  return new Promise((res, rej) => {
    const r = db.transaction('matches','readonly').objectStore('matches').getAll();
    r.onsuccess = e => res(e.target.result.sort((a,b) => b.createdAt - a.createdAt));
    r.onerror = e => rej(e.target.error);
  });
}
function dbGet(id) {
  return new Promise((res, rej) => {
    const r = db.transaction('matches','readonly').objectStore('matches').get(id);
    r.onsuccess = e => res(e.target.result);
    r.onerror = e => rej(e.target.error);
  });
}
function dbSave(m) {
  m.updatedAt = Date.now();
  return new Promise((res, rej) => {
    const r = db.transaction('matches','readwrite').objectStore('matches').put(m);
    r.onsuccess = () => { cloudOnLocalMatchSave(m); res(); };
    r.onerror = e => rej(e.target.error);
  });
}
function dbDel(id) {
  return new Promise((res, rej) => {
    const r = db.transaction('matches','readwrite').objectStore('matches').delete(id);
    r.onsuccess = () => { cloudOnLocalMatchDelete(id); res(); };
    r.onerror = e => rej(e.target.error);
  });
}
// Lokaal schrijven ZONDER naar de cloud te pushen (gebruikt door de cloud-listener zelf).
function dbPutLocal(m) {
  return new Promise((res, rej) => {
    const r = db.transaction('matches','readwrite').objectStore('matches').put(m);
    r.onsuccess = () => res();
    r.onerror = e => rej(e.target.error);
  });
}
function dbDelLocal(id) {
  return new Promise((res, rej) => {
    const r = db.transaction('matches','readwrite').objectStore('matches').delete(id);
    r.onsuccess = () => res();
    r.onerror = e => rej(e.target.error);
  });
}
// Wist alle lokaal gecachte ploeg-/wedstrijddata van dit toestel — nodig bij afmelden en
// accountverwijdering, anders blijft op een gedeeld/geleend toestel de volledige
// wedstrijdgeschiedenis, spelerslijst en clublogo staan voor de volgende gebruiker.
// Puur cosmetische toestelvoorkeuren (donkere modus, aftel-toggle, ...) blijven bewust staan
// — dat is geen persoons-/ploeggebonden data. Enkel lokaal (clear(), geen cloud-echo): de
// cloud-data van andere leden mag hierdoor niet verdwijnen.
async function clearLocalDeviceData(uid) {
  try {
    if (db) await new Promise(res => {
      const tx = db.transaction('matches', 'readwrite');
      tx.objectStore('matches').clear();
      tx.oncomplete = res; tx.onerror = res;
    });
  } catch (e) {}
  ['voetbal_teams_v2', 'voetbal_tournaments', 'voetbal_club_name', 'voetbal_club_logo',
   'voetbal_theme', 'voetbal_teamNames', 'voetbal_teamClubIds', 'voetbal_teamClubLogos', 'voetbal_setup_done',
   'voetbal_last_backup', 'voetbal_adminRequested', 'voetbal_adminApprovedSeen', 'voetbal_activeTeamId']
    .forEach(k => localStorage.removeItem(k));
  // Ook de per-ploeg roostercaches: die horen bij de vorige gebruiker.
  try {
    Object.keys(localStorage).filter(k => k.indexOf('voetbal_roster_') === 0).forEach(k => localStorage.removeItem(k));
  } catch (e) {}
  rosterTeamId = null; rosterLoaded = false;
  teamClubIds = {}; teamClubLogos = {};
  if (uid) localStorage.removeItem('voetbal_userTeams_' + uid);
  if (uid) localStorage.removeItem('voetbal_teamOrder_' + uid); // ploeg-id's van de vorige gebruiker
}

// ===================== CLOUD SYNC (Firebase) =====================
// Multi-ploeg model: elke ploeg is een eigen afgeschermde ruimte in Firebase.
// Beheerder (admin) kan schrijven, kijkers (viewer) kunnen alleen lezen.
// Toegang via uitnodigingscode per ploeg.
const FB_CONFIG = {
  apiKey: "AIzaSyByL7E3q7YH0hinfI7xRLl_QXHCZG4QywE",
  authDomain: "matchdelegate-v2.firebaseapp.com",
  databaseURL: "https://matchdelegate-v2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "matchdelegate-v2",
  storageBucket: "matchdelegate-v2.firebasestorage.app",
  messagingSenderId: "950872304129",
  appId: "1:950872304129:web:e9d5b1e03a41bd9d9bae00"
};

let cloudReady = false, isAdmin = false, fbdb = null, fbauth = null;
let isGuest = false;       // anoniem ingelogde gast (beperkte toegang)
let viewerMode = false;    // beheerder kijkt als kijker (tijdelijk)
let activeTeamId = null;   // welke ploeg is actief
let currentUser = null;    // ingelogde Firebase user
let userTeams = {};        // { teamId: 'admin'|'viewer' }
let teamListeners = [];    // actieve Firebase .on() listeners
let knownLiveMatchIds = new Set(); // bijhouden welke matches al als 'live' gekend zijn
let teamNames = {};                // { teamId: naam } cache voor ploegselect
// Sentinel voor "we kennen de naam van de actieve ploeg nog niet" — NOOIT terugvallen op
// 'all' (ongefilterd) in loadHome()/loadMatches(), want de lokale matches-cache bevat
// wedstrijden van elke ploeg die ooit op dit toestel geopend werd. Deze waarde matcht
// bewust geen enkele echte m.teamName, dus toont tijdelijk niets i.p.v. een andere ploeg.
const UNKNOWN_TEAM_FILTER = '__unknown_team__';
let knownScores = {};              // { matchId: { us, them } } voor doelpunt-detectie
let ownerUid = null;       // uid van de maker/eigenaar (uniek, vastgelegd in /owner)
let isOwner = false;       // is de huidige gebruiker de eigenaar?
let isApprovedAdmin = false; // mag deze gebruiker ploegen aanmaken (eigenaar of goedgekeurd)?
let pendingAdminCount = 0; // aantal openstaande beheerdersaanvragen (enkel voor eigenaar)
let pendingCoAdminCount = 0; // openstaande ploegbeheer aanvragen voor actieve ploeg
let maintenanceActive = false; // is onderhoudsmodus actief?
// Clubmodel (fase 2): een club groepeert meerdere ploegen; de clubbeheerder beheert ze.
let myClubs = {};          // { clubId: 'admin' } — clubs die deze gebruiker beheert
let activeClubId = null;   // clubId van de actieve ploeg (afgeleid uit teams/{id}/info/clubId)
let activeClubName = '';   // gedenormaliseerde clubnaam van de actieve ploeg (teams/{id}/info/clubName)
let activeClubLogo = '';   // gedenormaliseerd clublogo (data-URI) van de actieve ploeg (teams/{id}/info/clubLogo)
let isClubAdmin = false;   // is de huidige gebruiker clubbeheerder van de actieve ploeg's club?
let activeStatsPublic = {}; // { sectieKey: bool } — welke statistieksecties de beheerder publiek zette (teams/{id}/info/statsPublic)
let teamClubNames = {};    // { teamId: clubName } — cache voor groepering op het ploegkeuzescherm
// { teamId: clubId } — nodig om isClubAdmin (myClubs[clubId]) SYNCHROON te kunnen bepalen bij het
// selecteren van een ploeg. Voordien hing dat volledig aan de info-fetch: liep die in een timeout,
// dan bleef een clubbeheerder-niet-ploeglid stil kijker tot een herstart. Bewaard in localStorage,
// zelfde patroon als voetbal_teamNames.
let teamClubIds = {};
function loadTeamClubIds() {
  try { const c = JSON.parse(localStorage.getItem('voetbal_teamClubIds') || '{}'); for (const k in c) if (!teamClubIds[k]) teamClubIds[k] = c[k]; } catch (e) {}
}
function rememberTeamClubId(teamId, clubId) {
  if (!teamId) return;
  if (clubId) teamClubIds[teamId] = clubId; else delete teamClubIds[teamId];
  try { localStorage.setItem('voetbal_teamClubIds', JSON.stringify(teamClubIds)); } catch (e) {}
}
// { teamId: clubLogo } — cache clublogo per ploeg (ploegkeuzescherm én de PDF's). Bewaard in
// localStorage, zelfde patroon als voetbal_teamClubIds en om dezelfde reden: activeClubLogo komt
// uit de info-fetch van fetchTeamInfo, en die kan op traag 4G in zijn timeout lopen of offline
// helemaal mislukken. Zonder deze cache droeg een PDF die je aan het veld maakte (typisch het
// wedstrijdplan, vlak na het openen van de app) géén clublogo, terwijl hetzelfde document thuis
// op wifi het wél had. Logo's zijn data-URI's van ±88 KB; bij een volle opslag valt deze cache
// terug op enkel de actieve ploeg (zie rememberTeamClubLogo).
let teamClubLogos = {};
function loadTeamClubLogos() {
  try { const c = JSON.parse(localStorage.getItem('voetbal_teamClubLogos') || '{}'); for (const k in c) if (!teamClubLogos[k]) teamClubLogos[k] = c[k]; } catch (e) {}
}
function rememberTeamClubLogo(teamId, logo) {
  if (!teamId) return;
  if (logo) teamClubLogos[teamId] = logo; else delete teamClubLogos[teamId];
  try { localStorage.setItem('voetbal_teamClubLogos', JSON.stringify(teamClubLogos)); }
  catch (e) {
    // Opslag vol (meerdere ploegen × ±88 KB): dan liever enkel het logo van deze ploeg bewaren
    // dan de hele cache verliezen. Het geheugen houdt de andere deze sessie nog wel.
    try { localStorage.setItem('voetbal_teamClubLogos', JSON.stringify(logo ? { [teamId]: logo } : {})); } catch (e2) {}
  }
}
let archivedTeams = {};    // { teamId: true } — gearchiveerde ploegen (verborgen uit de actieve lijsten)

function cloudAvailable() { return typeof firebase !== 'undefined'; }
function jclone(o) { return JSON.parse(JSON.stringify(o)); }

function teamRef(path) {
  if (!fbdb || !activeTeamId) return null;
  return fbdb.ref('teams/' + activeTeamId + (path ? '/' + path : ''));
}
// Notities apart van "matches" (zie database.rules.json): enkel beheerders mogen dit pad lezen,
// zodat kijkers/gasten notities niet via Firebase kunnen inzien, ook niet buiten de UI om.
function notesRef(path) {
  if (!fbdb || !activeTeamId) return null;
  return fbdb.ref('teamNotes/' + activeTeamId + (path ? '/' + path : ''));
}

let fbConnected = null; // null = nog onbekend, true/false = echte verbindingsstatus
function cloudInit() {
  if (!cloudAvailable()) return;
  try {
    firebase.initializeApp(FB_CONFIG);
    fbdb = firebase.database();
    fbauth = firebase.auth();
    cloudReady = true;
    fbauth.onAuthStateChanged(onAuthChanged);
    // Verbindingsstatus voor het sync-dotje op het live-scherm (SDK is lokaal, dus
    // "SDK geladen" zegt niets meer over echte connectiviteit).
    fbdb.ref('.info/connected').on('value', s => {
      fbConnected = !!s.val();
      const d = document.getElementById('sync-dot');
      if (d) {
        d.className = 'sync-dot ' + (fbConnected ? 'on' : 'off');
        d.title = fbConnected ? 'Gesynchroniseerd met de cloud' : 'Offline — wijzigingen syncen zodra er verbinding is';
      }
    });
  } catch (e) { cloudReady = false; }
}

// once('value') met timeout: offline resolvet zo'n call nooit, waardoor de opstartflow
// eeuwig zou hangen (blanco scherm na de splash). Bij timeout → reject, zodat de
// bestaande try/catch-fallbacks (gecachte waarden) gebruikt worden.
function fbOnce(ref, ms = 4000) {
  return Promise.race([
    ref.once('value'),
    new Promise((_, reject) => setTimeout(() => reject(new Error('fb-timeout')), ms))
  ]);
}
// Offline-banner op het homescherm live bijwerken bij verbindingswissel.
window.addEventListener('online', () => { if (view === 'home') render(); });
window.addEventListener('offline', () => { if (view === 'home') render(); });

// Onderhoudsstatus lezen + live meeluisteren. Geldt voor élke geauthenticeerde gebruiker
// (ook een anonieme gast), zodat niemand tijdens onderhoud gewoon doorwerkt. De eigenaar wordt
// nooit geblokkeerd (die moet onderhoud kunnen uit-zetten).
async function initMaintenanceWatch() {
  if (window._maintenanceOff) { window._maintenanceOff(); window._maintenanceOff = null; }
  await new Promise(resolve => {
    const mRef = fbdb.ref('maintenance/active');
    const tmo = setTimeout(resolve, 4000); // offline: ga verder zonder maintenance-status
    mRef.once('value', snap => { maintenanceActive = !!snap.val(); clearTimeout(tmo); resolve(); });
    window._maintenanceOff = () => mRef.off('value');
    mRef.on('value', snap => {
      maintenanceActive = !!snap.val();
      if (view && view !== 'auth') {
        if (maintenanceActive && !isOwner) go('maintenance', undefined, true);
        else if (!maintenanceActive && view === 'maintenance') onAuthChanged(currentUser);
      }
    });
  });
}
// E-mail->uid index van de ingelogde gebruiker bijwerken. `verified` mág niet liegen: de rules
// dwingen af dat het exact overeenkomt met wat Firebase zelf over dit account weet. Dat is wat
// een aanstelling beschermt — je stelt een club-/ploegbeheerder aan OP e-mailadres, en zonder die
// controle kon iemand zich registreren met het adres van een ander en zo diens aanstelling opvangen.
function writeUserEmailIndex(user) {
  if (!fbdb || !user || !user.email) return;
  try {
    fbdb.ref('usersByEmail/' + user.uid).set({
      email: user.email, name: user.displayName || '', verified: !!user.emailVerified
    });
  } catch (e) {}
}
async function onAuthChanged(user) {
  if (window._hideSplash) window._hideSplash();
  currentUser = user;
  if (!user) {
    // Niet ingelogd → toon auth scherm (pending join blijft bewaard in localStorage)
    isAdmin = false; isGuest = false; viewerMode = false; activeTeamId = null; userTeams = {};
    ownerUid = null; isOwner = false; isApprovedAdmin = false; maintenanceActive = false;
    myClubs = {}; activeClubId = null; activeClubName = ''; isClubAdmin = false; archivedTeams = {};
    if (window._maintenanceOff) { window._maintenanceOff(); window._maintenanceOff = null; }
    if (window._approvalOff) { window._approvalOff(); window._approvalOff = null; }
    stopTeamListeners(); listenAdminRequests();
    await go('auth', undefined, true); return;
  }
  // Anonieme gast
  if (user.isAnonymous) {
    isGuest = true; isAdmin = false;
    ownerUid = null; isOwner = false; isApprovedAdmin = false;
    myClubs = {}; activeClubId = null; activeClubName = ''; isClubAdmin = false;
    // Onderhoudsmodus geldt ook voor gasten — anders werken die gewoon door tijdens onderhoud.
    await initMaintenanceWatch();
    if (maintenanceActive) { await go('maintenance', undefined, true); return; }
    // Pending join via QR/link afhandelen (ook voor een gast, zelfde als bij een ingelogde gebruiker)
    const pendingJoin = localStorage.getItem('voetbal_pending_join');
    if (pendingJoin) {
      localStorage.removeItem('voetbal_pending_join');
      const result = await joinTeamByToken(pendingJoin);
      if (result === 'ok') return;
      if (result === 'not_found') showToast('Code niet gevonden. Voer de code hieronder handmatig in.', 'err');
      if (result === 'offline') showToast('Kon de uitnodiging niet controleren (geen verbinding). Probeer het later opnieuw.', 'err');
    }
    await loadUserTeams(user.uid);
    const teamIds = Object.keys(userTeams);
    if (teamIds.length === 0) { await go('guestjoin', undefined, true); return; }
    if (!activeTeamId || !userTeams[activeTeamId]) await selectTeam(teamIds[0]);
    return;
  }
  isGuest = false;
  // E-mail->uid index van zichzelf wegschrijven (fase 3) zodat de app-eigenaar deze persoon later
  // op e-mailadres als clubbeheerder kan aanstellen, ook als hij (nog) geen ploeg vervoegd heeft.
  // Fire-and-forget; de rules laten enkel je eigen entry met je eigen e-mailadres toe.
  writeUserEmailIndex(user);
  // Ingelogd → laad eigenaar-status + ploegen van deze gebruiker
  await loadOwnerStatus(user);
  // Maintenance-listener pas hier registreren: gebruiker is nu authenticated,
  // anders annuleert Firebase de listener (auth != null regel) en herstelt die nooit.
  await initMaintenanceWatch();
  if (maintenanceActive && !isOwner) {
    await go('maintenance', undefined, true); return;
  }
  await loadUserTeams(user.uid);
  maybeNotifyApproved();
  maybeNotifyRejected();
  // Live meeluisteren naar de eigen goedkeuringsstatus: de eigenaar keurt goed/af →
  // de aanvrager ziet het meteen, zonder app-herstart. Eerste waarde overslaan
  // (de opstartflow hierboven dekt die al af).
  if (window._approvalOff) { window._approvalOff(); window._approvalOff = null; }
  if (!isOwner) {
    const aRef = fbdb.ref('approvedAdmins/' + user.uid);
    const rRef = fbdb.ref('rejectedAdmins/' + user.uid);
    let aFirst = true, rFirst = true;
    const onApproved = s => {
      if (aFirst) { aFirst = false; return; }
      const was = isApprovedAdmin;
      isApprovedAdmin = !!s.val();
      if (isApprovedAdmin && !was) { maybeNotifyApproved(); if (view === 'teamselect' || view === 'beheer') render(); }
    };
    const onRejected = s => {
      if (rFirst) { rFirst = false; return; }
      if (s.exists()) maybeNotifyRejected();
    };
    aRef.on('value', onApproved);
    rRef.on('value', onRejected);
    window._approvalOff = () => { aRef.off('value', onApproved); rRef.off('value', onRejected); };
  }
  // Pending join via QR/link afhandelen
  const pendingJoin = localStorage.getItem('voetbal_pending_join');
  if (pendingJoin) {
    localStorage.removeItem('voetbal_pending_join');
    const result = await joinTeamByToken(pendingJoin);
    if (result === 'ok') return;
    if (result === 'not_found') showToast('Code niet gevonden. Voer de code hieronder handmatig in.', 'err');
    if (result === 'offline') showToast('Kon de uitnodiging niet controleren (geen verbinding). Probeer het later opnieuw.', 'err');
    // val door naar de normale ploeg-laadflow hieronder i.p.v. hier vast te blijven zitten
  }
  const teamIds = Object.keys(userTeams);
  if (teamIds.length === 0) {
    await go('teamselect', undefined, true); return;
  }
  if (teamIds.length === 1 && !activeTeamId) {
    await selectTeam(teamIds[0]); return;
  }
  // Meerdere ploegen: bij een verse app-start (activeTeamId nog null) de laatst gekozen
  // ploeg herstellen i.p.v. altijd op het ploegkeuzescherm te belanden.
  if (!activeTeamId) {
    const lastTeamId = localStorage.getItem('voetbal_activeTeamId');
    if (lastTeamId && userTeams[lastTeamId]) { await selectTeam(lastTeamId); return; }
  }
  if (!activeTeamId || !userTeams[activeTeamId]) {
    await preloadTeamNames();
    await go('teamselect', undefined, true); return;
  }
  updateCloudChip(); cloudRefreshUI();
}

// Eigenaar- en goedkeuringsstatus laden.
async function loadOwnerStatus(user) {
  ownerUid = null; isOwner = false; isApprovedAdmin = false; myClubs = {};
  if (!user || !fbdb) { listenAdminRequests(); return; }
  try {
    ownerUid = (await fbOnce(fbdb.ref('owner'))).val() || null;
    isOwner = !!(ownerUid && ownerUid === user.uid);
    if (isOwner) isApprovedAdmin = true;
    else isApprovedAdmin = !!(await fbOnce(fbdb.ref('approvedAdmins/' + user.uid))).val();
    // Clubs die deze gebruiker beheert (omgekeerde index, gezet bij aanstelling als clubbeheerder).
    try { myClubs = (await fbOnce(fbdb.ref('users/' + user.uid + '/clubs'))).val() || {}; } catch (e) { myClubs = {}; }
  } catch (e) { /* geen rechten / offline → standaard niet goedgekeurd */ }
  listenAdminRequests();
}

// Live meeluisteren naar openstaande aanvragen (enkel eigenaar) voor de teller.
function onAdminReqValue(s) {
  const v = s.val() || {};
  pendingAdminCount = Object.keys(v).length;
  updateCloudChip();
  const b = document.getElementById('owner-req-btn');
  if (b) b.innerHTML = `${icI(IC.shield)} Beheerdersaanvragen` + (pendingAdminCount ? ` (${pendingAdminCount})` : '');
}
function listenAdminRequests() {
  if (!fbdb) return;
  try { fbdb.ref('adminRequests').off('value', onAdminReqValue); } catch (e) {}
  pendingAdminCount = 0;
  if (isOwner) { try { fbdb.ref('adminRequests').on('value', onAdminReqValue); } catch (e) {} }
}

function onCoAdminReqValue(s) {
  const v = s.val() || {};
  pendingCoAdminCount = Object.keys(v).length;
  updateCloudChip();
}
function listenCoAdminRequests() {
  if (!fbdb || !activeTeamId) return;
  try { fbdb.ref('teamAdminRequests/' + activeTeamId).off('value', onCoAdminReqValue); } catch (e) {}
  pendingCoAdminCount = 0;
  if (isAdmin) { try { fbdb.ref('teamAdminRequests/' + activeTeamId).on('value', onCoAdminReqValue); } catch (e) {} }
}

// De maker legt zichzelf eenmalig vast als eigenaar (kan daarna niet meer overgenomen worden).
async function claimOwner() {
  if (!currentUser || !fbdb) return;
  try {
    const snap = await fbOnce(fbdb.ref('owner'));
    if (snap.exists()) { showToast('Er is al een eigenaar ingesteld.', 'err'); ownerUid = snap.val(); isOwner = (ownerUid === currentUser.uid); closeModal(); if (view === 'beheer') render(); return; }
    await fbdb.ref('owner').set(currentUser.uid);
    ownerUid = currentUser.uid; isOwner = true; isApprovedAdmin = true;
    listenAdminRequests();
    closeModal();
    if (view === 'beheer') render();
    showToast('Je bent nu ingesteld als eigenaar van Match Delegate.', 'ok');
  } catch (e) {
    showToast('Eigenaar instellen mislukt, probeer opnieuw.', 'err');
  }
}

// Toon eenmalig een melding wanneer een eerdere aanvraag werd goedgekeurd.
function maybeNotifyApproved() {
  if (!isApprovedAdmin || isOwner) return;
  if (localStorage.getItem('voetbal_adminRequested') !== '1') return;
  if (localStorage.getItem('voetbal_adminApprovedSeen') === '1') return;
  localStorage.setItem('voetbal_adminApprovedSeen', '1');
  setTimeout(() => {
    openModal(`<h3>${icI(IC.done)} Aanvraag goedgekeurd</h3>
      <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px">Je hebt nu beheerdersrechten. Je kunt een eigen ploeg aanmaken via <b>Van ploeg wisselen → Nieuwe ploeg aanmaken</b>.</p>
      <button class="btn btn-green" onclick="closeModal();view='teamselect';render()">${icI(IC.plus)} Ploeg aanmaken</button>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Later</button>`);
  }, 700);
}
async function maybeNotifyRejected() {
  if (!currentUser || !fbdb) return;
  if (localStorage.getItem('voetbal_adminRequested') !== '1') return;
  if (isApprovedAdmin) return;
  try {
    const [rejSnap, reqSnap] = await Promise.all([
      fbOnce(fbdb.ref('rejectedAdmins/' + currentUser.uid)),
      fbOnce(fbdb.ref('adminRequests/' + currentUser.uid)),
    ]);
    const wasRejected = rejSnap.exists();
    const stillPending = reqSnap.exists();
    if (!wasRejected && stillPending) return; // aanvraag loopt nog
    // Opruimen
    if (wasRejected) await fbdb.ref('rejectedAdmins/' + currentUser.uid).remove().catch(() => {});
    localStorage.removeItem('voetbal_adminRequested');
    localStorage.removeItem('voetbal_adminApprovedSeen');
    if (wasRejected) {
      setTimeout(() => {
        openModal(`<h3>Aanvraag geweigerd</h3>
          <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:16px">Je aanvraag om beheerder te worden is geweigerd. Je kan een nieuwe aanvraag indienen als je dit wil.</p>
          <button class="btn btn-org" onclick="closeModal();showRequestAdminModal()">Nieuwe aanvraag indienen</button>
          <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Sluiten</button>`);
      }, 700);
    }
    // Stilletjes resetten als aanvraag verdween zonder formele weigering
  } catch (e) {}
}

// Een gebruiker vraagt beheerdersrechten (ploegen mogen aanmaken) aan bij de eigenaar.
function showRequestAdminModal() {
  if (!currentUser) return;
  openModal(`<h3>Beheerder worden</h3>
    <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:14px">Om zelf een ploeg te kunnen aanmaken heb je toestemming nodig van de maker. Verstuur een aanvraag — je hoort het zodra ze goedgekeurd is.</p>
    <div class="auth-err" id="req-err"></div>
    <button class="btn btn-org" onclick="doRequestAdmin()">Aanvraag versturen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
async function doRequestAdmin() {
  const err = document.getElementById('req-err');
  if (!currentUser || !fbdb) return;
  if (err) err.textContent = 'Bezig...';
  try {
    await fbdb.ref('adminRequests/' + currentUser.uid).set({
      email: currentUser.email || '',
      name: currentUser.displayName || '',
      createdAt: Date.now()
    });
    // Onthoud dat we een aanvraag deden + reset "gezien" zodat de goedkeuring later getoond wordt
    localStorage.setItem('voetbal_adminRequested', '1');
    localStorage.removeItem('voetbal_adminApprovedSeen');
    // Bevestiging met e-mail-nudge: de maker krijgt geen automatische melding (geen
    // serverkant), dus bied aan om hem zelf even te verwittigen via e-mail.
    const mailSubject = encodeURIComponent('MatchDelegate: beheerdersaanvraag van ' + (currentUser.displayName || currentUser.email || ''));
    const mailBody = encodeURIComponent('Dag,\n\nIk heb zonet in MatchDelegate een aanvraag ingediend om beheerder te worden (zelf ploegen aanmaken).\n\nNaam: ' + (currentUser.displayName || '') + '\nE-mail: ' + (currentUser.email || '') + '\n\nKan je ze goedkeuren via Beheer → Eigenaarstools → Beheerdersaanvragen?\n\nBedankt!');
    openModal(`<h3>${icI(IC.done)} Aanvraag verstuurd</h3>
      <p style="text-align:center;color:var(--txt2);font-size:14px;margin-bottom:14px">Zodra de maker je goedkeurt zie je het meteen in de app verschijnen.<br><br>De maker krijgt <b>geen automatische melding</b> — verwittig hem gerust even zelf:</p>
      <a class="btn btn-org" style="display:block;text-decoration:none;text-align:center" href="mailto:${FEEDBACK_EMAIL}?subject=${mailSubject}&body=${mailBody}">${icI(IC.mail)} Verwittig de maker via e-mail</a>
      <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Sluiten</button>`);
  } catch (e) {
    if (err) err.textContent = 'Versturen mislukt, probeer opnieuw.';
  }
}

// Eigenaar: openstaande beheerdersaanvragen bekijken en goed-/afkeuren (als modal).
async function showAdminRequestsModal() {
  if (!isOwner || !fbdb) return;
  openModal(`<h3>${icI(IC.shield)} Beheerdersaanvragen</h3>
    <div id="adminreq-list"><p style="text-align:center;color:var(--txt2)">Laden...</p></div>
    <button class="btn btn-gray" style="margin-top:10px" onclick="closeModal()">Sluiten</button>`);
  await loadAdminRequestsList();
}
async function loadAdminRequestsList() {
  const el = document.getElementById('adminreq-list');
  if (!el) return;
  try {
    const snap = await fbOnce(fbdb.ref('adminRequests'));
    const reqs = snap.val() || {};
    const uids = Object.keys(reqs);
    if (!uids.length) { el.innerHTML = '<p style="text-align:center;color:var(--txt2)">Geen openstaande aanvragen.</p>'; return; }
    el.innerHTML = uids.map(uid => {
      const r = reqs[uid] || {};
      return `<div class="ts-team-row" style="cursor:default;margin-bottom:8px;flex-direction:column;align-items:stretch;gap:8px">
        <div><b>${esc(r.name || '(geen naam)')}</b><br><small style="color:var(--txt2)">${esc(r.email || '')}</small></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button class="btn btn-green btn-sm" onclick="approveAdmin('${uid}')">${icI(IC.check)} Goedkeuren</button>
          <button class="btn btn-red btn-sm" onclick="rejectAdmin('${uid}')">${icI(IC.close)} Weigeren</button>
        </div></div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<p style="text-align:center;color:var(--org2)">Kon de aanvragen niet laden.</p>';
  }
}
async function approveAdmin(uid) {
  if (!isOwner || !fbdb) return;
  try {
    const reqSnap = await fbOnce(fbdb.ref('adminRequests/' + uid));
    const req = reqSnap.val() || {};
    await fbdb.ref('approvedAdmins/' + uid).set({ approved: true, name: req.name || '', email: req.email || '' });
    await fbdb.ref('adminRequests/' + uid).remove();
    loadAdminRequestsList();
  } catch (e) { showToast('Goedkeuren mislukt, probeer opnieuw.', 'err'); }
}
async function rejectAdmin(uid) {
  if (!isOwner || !fbdb) return;
  try {
    await fbdb.ref('rejectedAdmins/' + uid).set({ rejectedAt: Date.now() });
    await fbdb.ref('adminRequests/' + uid).remove();
    loadAdminRequestsList();
  } catch (e) { showToast('Weigeren mislukt, probeer opnieuw.', 'err'); }
}

async function showApprovedAdminsModal() {
  if (!isOwner || !fbdb) return;
  openModal(`<h3>${icI(IC.admins)} Goedgekeurde beheerders</h3>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:12px">Deze personen mogen ploegen aanmaken. Klik "Intrekken" om hun recht te verwijderen — hun bestaande ploeg en data blijven bewaard.</p>
    <div id="approved-list"><p style="text-align:center;color:var(--txt2)">Laden...</p></div>
    <button class="btn btn-gray" style="margin-top:10px" onclick="closeModal()">Sluiten</button>`);
  try {
    const snap = await fbOnce(fbdb.ref('approvedAdmins'));
    const approved = snap.val() || {};
    const uids = Object.keys(approved);
    const el = document.getElementById('approved-list');
    if (!uids.length) { if (el) el.innerHTML = '<p style="text-align:center;color:var(--txt2)">Geen goedgekeurde beheerders.</p>'; return; }
    const users = await Promise.all(uids.map(async uid => {
      const entry = approved[uid];
      // Nieuw formaat: naam/email zit al in approvedAdmins
      if (typeof entry === 'object' && entry.name) return { uid, name: entry.name, email: entry.email || '' };
      // Oud formaat (true): haal naam op uit users-node (eigenaar heeft nu leesrecht)
      try {
        const s = await fbOnce(fbdb.ref('users/' + uid));
        const u = s.val() || {};
        return { uid, name: u.displayName || uid, email: u.email || '' };
      } catch (_) { return { uid, name: uid, email: '' }; }
    }));
    if (el) el.innerHTML = users.map(u => `
      <div class="ts-team-row" style="cursor:default;margin-bottom:8px">
        <span class="ts-name" style="font-size:15px"><b>${esc(u.name)}</b><br><small style="color:var(--txt2);font-weight:400">${esc(u.email)}</small></span>
        <button class="btn btn-red btn-sm" onclick="revokeAdmin('${u.uid}')">Intrekken</button>
      </div>`).join('');
  } catch (e) {
    const el = document.getElementById('approved-list');
    if (el) el.innerHTML = '<p style="text-align:center;color:var(--org2)">Kon de lijst niet laden.</p>';
  }
}

function ownerDeleteTeam(tid, naam) {
  if (!isOwner || !fbdb) return;
  openModal(`<h3>Ploeg verwijderen</h3>
    <p style="text-align:center;color:var(--rd);font-size:13px;margin-bottom:10px"><b>${esc(naam)}</b> — alle data gaat permanent verloren.</p>
    <p style="text-align:center;color:var(--txt2);font-size:13px;margin-bottom:10px">Geef je wachtwoord in ter bevestiging:</p>
    <div class="fg fg-pwd"><input id="owndel-pwd" type="password" placeholder="wachtwoord" autofocus><button type="button" class="pwd-eye" onclick="togglePwd(this)" tabindex="-1">${icI(IC.eye)}</button></div>
    <div class="auth-err" id="owndel-err"></div>
    <button class="btn btn-red" onclick="doOwnerDeleteTeam('${tid}')">Permanent verwijderen</button>
    <button class="btn btn-gray" style="margin-top:8px" onclick="closeModal()">Annuleren</button>`);
}
let _teamDeleteBusy = false;
async function doOwnerDeleteTeam(tid) {
  if (!isOwner || !fbdb || !currentUser) return;
  const pwd = (document.getElementById('owndel-pwd') || {}).value || '';
  const err = document.getElementById('owndel-err');
  if (!pwd) { if (err) err.textContent = 'Geef je wachtwoord in.'; return; }
  if (_teamDeleteBusy) return; // dubbeltik-guard: een 2e run zou de backup met null overschrijven
  _teamDeleteBusy = true;
  if (err) err.textContent = 'Bezig...';
  try {
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, pwd);
    await currentUser.reauthenticateWithCredential(cred);
    const [teamSnap, memberInfoSnap, teamNotesSnap] = await Promise.all([
      fbOnce(fbdb.ref('teams/' + tid)),
      fbOnce(fbdb.ref('memberInfo/' + tid)),
      fbOnce(fbdb.ref('teamNotes/' + tid)),
    ]);
    // Al verwijderd (bv. door een dubbeltik of een ander toestel)? Nooit de bestaande backup met
    // een leeg object overschrijven.
    if (!teamSnap.exists()) { showToast('Ploeg is al verwijderd.', 'ok'); closeModal(); return; }
    // Backup opslaan vóór verwijderen
    await fbdb.ref('deletedTeams/' + tid).set({
      deletedAt: Date.now(),
      deletedBy: currentUser.uid,
      deletedByEmail: currentUser.email || '',
      team: teamSnap.val(),
      memberInfo: memberInfoSnap.val(),
      teamNotes: teamNotesSnap.val(),
    });
    // Uitnodigingstoken direct verwijderen (een query over /invites is niet toegelaten door de rules)
    const info = (teamSnap.val() || {}).info || {};
    const token = info.inviteToken;
    if (token) { try { await fbdb.ref('invites/' + token).remove(); } catch (e) {} }
    await Promise.all([
      fbdb.ref('teams/' + tid).remove(),
      fbdb.ref('memberInfo/' + tid).remove(),
      fbdb.ref('teamAdminRequests/' + tid).remove(),
      fbdb.ref('teamNotes/' + tid).remove(),
    ]);
    // Club-index opkuisen (fase 2) zodat de ploeg niet als wees in Clubbeheer blijft staan.
    if (info.clubId) { try { await fbdb.ref('clubs/' + info.clubId + '/teams/' + tid).remove(); } catch (e) {} }
    showToast('Ploeg verwijderd.', 'ok');
    closeModal();
    if (view === 'allusers') loadAllUsersView();
  } catch (e) {
    if (err) err.textContent = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
      ? 'Ongeldig wachtwoord.' : 'Verwijderen mislukt, probeer opnieuw.';
  } finally { _teamDeleteBusy = false; }
}

async function revokeAdmin(uid) {
  if (!isOwner || !fbdb) return;
  showConfirm('Ben je zeker dat je de beheerdersrechten van deze persoon wil intrekken?', async () => {
    try {
      await fbdb.ref('approvedAdmins/' + uid).remove();
      showApprovedAdminsModal();
    } catch (e) { showToast('Intrekken mislukt, probeer opnieuw.', 'err'); }
  }, 'Intrekken');
}

// Een verwijderde/onbereikbare ploeg opruimen uit de lijst van de gebruiker.
function pruneDeadTeam(id) {
  delete userTeams[id];
  if (currentUser) fbdb.ref('users/' + currentUser.uid + '/teams/' + id).remove().catch(() => {});
  if (activeTeamId === id) { activeTeamId = null; localStorage.removeItem('voetbal_activeTeamId'); }
  forgetRosterCache(id); // geen rooster van een ploeg waar je niet meer bij hoort op dit toestel
  rememberTeamClubLogo(id, '');
  if (view === 'teamselect') render();
}

async function preloadTeamNames() {
  // Offline: val terug op eerder gecachte namen zodat het ploegkeuzescherm niet leeg oogt.
  try { const c = JSON.parse(localStorage.getItem('voetbal_teamNames') || '{}'); for (const k in c) if (!teamNames[k]) teamNames[k] = c[k]; } catch (e) {}
  const ids = Object.keys(userTeams);
  // Altijd verversen, ook als er al een (mogelijk verouderde) naam in de cache zit — anders
  // ziet een ander toestel een hernoemde ploeg nooit terug, zelfs niet na een refresh.
  await Promise.all(ids.map(async id => {
    try {
      const s = await fbOnce(fbdb.ref('teams/' + id + '/info/name'));
      if (s.exists()) teamNames[id] = s.val();
    } catch (e) {}
  }));
  try { localStorage.setItem('voetbal_teamNames', JSON.stringify(teamNames)); } catch (e) {}
}
async function loadUserTeams(uid) {
  let raw = null;
  try { raw = (await fbOnce(fbdb.ref('users/' + uid + '/teams'))).val(); }
  catch (e) { /* offline/timeout: val hieronder terug op de lokaal gecachte ploegenlijst */ }
  if (raw === null) raw = cachedUserTeams(uid);
  raw = raw || {};
  userTeams = {};
  await Promise.all(Object.keys(raw).map(async id => {
    try {
      const nameSnap = await fbOnce(fbdb.ref('teams/' + id + '/info/name'));
      if (!nameSnap.exists()) {
        // Ploeg bestaat niet meer → opruimen
        fbdb.ref('users/' + uid + '/teams/' + id).remove().catch(() => {});
        return;
      }
      // Werkelijke rol ophalen; val terug op gecachede rol als de read faalt
      let role = raw[id];
      try {
        const roleSnap = await fbOnce(fbdb.ref('teams/' + id + '/members/' + uid));
        if (roleSnap.exists()) {
          role = roleSnap.val();
          if (role !== raw[id]) fbdb.ref('users/' + uid + '/teams/' + id).set(role).catch(() => {});
        }
      } catch (e) { /* geen toegang tot members-node: gecachede rol gebruiken */ }
      userTeams[id] = role;
    } catch (e) {
      // Timeout = offline: ploeg behouden met gecachte rol. Andere fout (permissie): overslaan maar NIET verwijderen.
      if (e && e.message === 'fb-timeout') userTeams[id] = raw[id];
    }
  }));
  cacheUserTeams(uid, userTeams);
}

// Ploegenlijst + rollen lokaal cachen zodat een beheerder ook offline (na herstart)
// zijn ploeg en rechten behoudt. Enkel gebruikt als de cloud niet antwoordt.
function cacheUserTeams(uid, teams) {
  if (!uid || !teams || !Object.keys(teams).length) return;
  try { localStorage.setItem('voetbal_userTeams_' + uid, JSON.stringify(teams)); } catch (e) {}
}
function cachedUserTeams(uid) {
  try { return JSON.parse(localStorage.getItem('voetbal_userTeams_' + uid) || 'null'); } catch (e) { return null; }
}

// Volgorde waarin een gebruiker zijn ploegen op het ploegenkeuzescherm wil zien (drag-and-drop).
function getTeamOrder(uid) {
  try { return JSON.parse(localStorage.getItem('voetbal_teamOrder_' + uid) || '[]'); } catch (e) { return []; }
}
function saveTeamOrder(uid, order) {
  if (!uid) return;
  try { localStorage.setItem('voetbal_teamOrder_' + uid, JSON.stringify(order)); } catch (e) {}
}
// Past de bewaarde volgorde toe op een lijst team-ID's; nieuwe/onbekende ploegen komen achteraan.
function orderedTeamIds(ids) {
  if (!currentUser) return ids;
  const saved = getTeamOrder(currentUser.uid).filter(id => ids.includes(id));
  const rest = ids.filter(id => !saved.includes(id));
  return [...saved, ...rest];
}

async function selectTeam(teamId) {
  stopTeamListeners();
  // Zorg dat teamNames[] al gevuld is vóór go('home') rendert (bv. bij het herstellen van de
  // laatst actieve ploeg meteen na app-start) — anders valt de team-filter in loadHome()/
  // loadMatches()/cleanupOrphanMatches() terug op 'onbekend' en kan een andere ploeg's cache
  // even zichtbaar zijn. Zelfde synchrone cache-hydratie als preloadTeamNames().
  try { const c = JSON.parse(localStorage.getItem('voetbal_teamNames') || '{}'); for (const k in c) if (!teamNames[k]) teamNames[k] = c[k]; } catch (e) {}
  activeTeamId = teamId;
  // Rooster: meteen het laatst gekende van DEZE ploeg neerzetten en als "nog niet geladen" markeren
  // tot de roster-listener antwoordt. Zonder dit rendert go('home') hieronder nog met het rooster
  // van de vorige ploeg (of met niets, wat als "geen spelers" gelezen werd).
  // Een cachetreffer voor DEZE ploeg is meteen bruikbaar (en op het veld zonder bereik het enige
  // wat er is): de listener verrijkt hem straks. Enkel als er niets gecacht is blijft het rooster
  // "niet geladen" — dan is er ook echt geen spelersdata voor deze ploeg op dit toestel.
  rosterTeamId = teamId;
  rosterLoaded = hydrateRosterFromCache(teamId);
  isAdmin = (userTeams[teamId] === 'admin');
  // Club-context van de actieve ploeg. Owner is impliciet clubbeheerder overal.
  activeClubId = null; activeClubName = ''; activeClubLogo = ''; activeStatsPublic = {};
  isClubAdmin = isOwner;
  // Kennen we de club van deze ploeg al van een vorige keer? Dan isClubAdmin (en dus isAdmin)
  // meteen zetten, vóór cloudListen() en go('home'). Zo hangen de beheerknoppen en de
  // beheerder-only listeners niet langer aan een fetch die in een timeout kan lopen.
  // Enkel elevatie: myClubs wordt bij elke aanmelding vers opgehaald, dus een ingetrokken
  // clubbeheerdersrol kan hier nooit blijven hangen. Klopt de onthouden club niet meer, dan
  // corrigeert de fetch hieronder het alsnog (en de rules weigeren intussen elke schrijfactie).
  loadTeamClubIds();
  loadTeamClubLogos(); // laatst gekende clublogo's van dit toestel — vangnet voor getActiveClubLogo()
  const cachedClubId = teamClubIds[teamId];
  if (!isClubAdmin && cachedClubId && myClubs[cachedClubId]) {
    activeClubId = cachedClubId;
    if (teamClubNames[teamId]) activeClubName = teamClubNames[teamId];
    isClubAdmin = true;
    isAdmin = true;
  }
  localStorage.setItem('voetbal_activeTeamId', teamId);
  // Sla op dat deze user tot deze ploeg hoort (dubbele index voor snelle lookup). Enkel als hij
  // effectief een rol heeft: een clubbeheerder die geen ploeglid is, mag niet als 'viewer'
  // geregistreerd worden — anders staat de ploeg na herstart permanent als "Kijker" in Jouw ploegen.
  if (currentUser && userTeams[teamId]) fbdb.ref('users/' + currentUser.uid + '/teams/' + teamId).set(userTeams[teamId]);
  // Naam + e-mail registreren zodat de beheerder ziet wie vervoegd is. Enkel voor echte leden:
  // een clubbeheerder die geen ploeglid is, hoort niet als 'viewer' in memberInfo te belanden.
  if (userTeams[teamId]) writeMemberInfo(teamId, userTeams[teamId]);
  cloudListen();
  listenCoAdminRequests();
  // Zorg dat setup overgeslagen wordt voor kijkers (club-data komt van de cloud)
  localStorage.setItem('voetbal_setup_done', '1');
  // teamNames[] kan deze ploeg nog niet kennen (bv. rechtstreeks via invite-link toegevoegd,
  // zonder ooit het ploegkeuzescherm — en dus preloadTeamNames() — te doorlopen), of een
  // verouderde (bv. ondertussen hernoemde) naam bevatten. Altijd verversen op de achtergrond
  // en enkel herrenderen als de naam echt gewijzigd is — tot de eerste fetch klaar is valt
  // loadHome()/loadMatches() terug op de bestaande (of UNKNOWN_TEAM_FILTER) waarde i.p.v. een
  // andere ploeg te tonen.
  // Info van de actieve ploeg in één fetch: naam (voor de filter/weergave) + club-context (fase 2):
  // clubId (welke club), clubName (gedenormaliseerd, ook leesbaar voor kijkers) en of de huidige
  // gebruiker daar clubbeheerder van is. Tot deze fetch klaar is valt isClubAdmin terug op isOwner.
  fetchTeamInfo(teamId);
  go('home');
}
// Ploeginfo ophalen mét herhaalpogingen. Voordien was dit één fbOnce met een stille catch: liep die
// in zijn timeout van 4 s (trage 4G op het veld), dan bleef een clubbeheerder-niet-ploeglid zonder
// enige melding kijker — geen "+ Nieuw tornooi", geen bewerkknoppen — tot een herstart. Dezelfde
// fetch bepaalt ook de clubnaam, het logo, statsPublic en de archief-check.
async function fetchTeamInfo(teamId, poging = 0) {
  const wachtMs = [0, 2000, 5000];
  if (poging >= wachtMs.length) {
    // Alle pogingen mislukt: eerlijk zeggen i.p.v. een uitgekleed scherm zonder uitleg.
    if (activeTeamId === teamId && (view === 'home' || view === 'matches')) {
      showToast('Kon de ploeggegevens niet ophalen — sommige beheerknoppen ontbreken mogelijk. Tik op Instellingen › Ploeg om opnieuw te proberen.', 'err');
    }
    return;
  }
  if (poging > 0) await new Promise(r => setTimeout(r, wachtMs[poging]));
  // Intussen van ploeg gewisseld of afgemeld? Dan niets meer doen — een late poging mag nooit de
  // club-context van een andere ploeg zetten.
  if (activeTeamId !== teamId || !currentUser || !fbdb) return;
  let s;
  try { s = await fbOnce(fbdb.ref('teams/' + teamId + '/info')); }
  catch (e) { return fetchTeamInfo(teamId, poging + 1); }
  {
    if (activeTeamId !== teamId || !s.exists()) return; // ondertussen van ploeg gewisseld
    const info = s.val() || {};
    activeClubId = info.clubId || null;
    activeClubName = info.clubName || '';
    activeClubLogo = info.clubLogo || '';
    activeStatsPublic = info.statsPublic || {};
    rememberTeamClubId(teamId, activeClubId); // ook wissen als de ploeg géén club (meer) heeft
    if (activeClubName) teamClubNames[teamId] = activeClubName;
    rememberTeamClubLogo(teamId, activeClubLogo); // ook op het toestel, voor de PDF's zonder bereik
    if (info.archived) archivedTeams[teamId] = true; else delete archivedTeams[teamId];
    isClubAdmin = isOwner || !!(activeClubId && myClubs[activeClubId]);
    // Ontbreekt het clublogo op deze ploeg terwijl de club er een heeft? Dan is ze aangemaakt vóór
    // v0.31.8 (createTeam nam het logo toen niet mee) of dateert ze van na de laatste keer dat het
    // logo opgeslagen werd. Een clubbeheerder vult het hier bij — één schrijfactie, en daarna zien
    // ook de kijkers van die ploeg het logo. Op de achtergrond: dit mag de ploegflow niet ophouden.
    if (!activeClubLogo && activeClubId && isClubAdmin) vulClubLogoAan(teamId, activeClubId);
    // Gearchiveerde ploeg: gewone leden er niet gewoon in laten doorwerken (ze is uit alle
    // lijsten verborgen, maar werd bv. bij herstart via voetbal_activeTeamId weer actief).
    // Eigenaar/clubbeheerder mag er wél in (beheren/herstellen via Clubbeheer).
    if (info.archived && !isClubAdmin) {
      showToast('Deze ploeg is gearchiveerd door de club.', 'err');
      stopTeamListeners();
      activeTeamId = null;
      localStorage.removeItem('voetbal_activeTeamId');
      go('teamselect', undefined, true);
      return;
    }
    // Clubbeheerder beheert de ploegen van zijn club (fase 2d): behandel hem als beheerder van
    // deze ploeg, ook al is hij geen ploeglid. Verandert isAdmin → altijd herrenderen.
    const wasAdmin = isAdmin;
    // Uit de echte rol + de nu bekende club-context, in BEIDE richtingen: klopt de onthouden
    // clubId niet meer (ploeg verhuisd naar een andere club), dan moet de elevatie die hierboven
    // uit de cache kwam ook weer weg.
    isAdmin = (userTeams[teamId] === 'admin') || isClubAdmin;
    // Elevatie naar beheerder ná de initiële cloudListen(): de beheerder-only listeners
    // (o.a. teamNotes) zijn toen niet opgezet omdat isAdmin nog false was. Herstart ze nu,
    // net zoals onSelfRoleChanged bij een rolwijziging doet. Bij een degradatie idem, zodat
    // beheerder-only listeners netjes stoppen.
    if (isAdmin !== wasAdmin) { stopTeamListeners(); cloudListen(); listenCoAdminRequests(); }
    const changed = info.name && teamNames[teamId] !== info.name;
    if (info.name) { teamNames[teamId] = info.name; try { localStorage.setItem('voetbal_teamNames', JSON.stringify(teamNames)); } catch (e) {} }
    if (isAdmin !== wasAdmin || ((changed || activeClubName) && (view === 'home' || view === 'matches'))) render();
  }
}

// Een ploeg zonder gedenormaliseerd clublogo bijwerken vanuit de clubnode. Enkel voor een
// clubbeheerder: die mag de clubs-node lezen en teams/{id}/info schrijven (zelfde pad als
// writeClubLogo). Stil bij een fout — dit is opkuiswerk, geen actie van de gebruiker.
async function vulClubLogoAan(teamId, clubId) {
  try {
    const logo = (await fbOnce(fbdb.ref('clubs/' + clubId + '/info/logo'))).val();
    if (!logo || activeTeamId !== teamId) return;   // geen clublogo, of intussen van ploeg gewisseld
    await fbdb.ref('teams/' + teamId + '/info/clubLogo').set(logo);
    if (activeTeamId !== teamId) return;
    activeClubLogo = logo;
    rememberTeamClubLogo(teamId, logo);
    if (view === 'home') render();                  // clubvoettekst onderaan het startscherm
  } catch (e) {}
}

// Naam + e-mail van een lid bewaren zodat de beheerder de kijkers kan zien.
function writeMemberInfo(teamId, role) {
  if (!currentUser || !fbdb || !teamId) return Promise.resolve();
  return fbdb.ref('memberInfo/' + teamId + '/' + currentUser.uid).set({
    email: currentUser.email || '',
    name: currentUser.displayName || '',
    role: role || 'viewer',
    joinedAt: Date.now()
  }).catch(() => {});
}

// ---- schrijven (enkel admins van de actieve ploeg) ----
// Cloud-write geweigerd/mislukt (permissie- of serverfout — offline wordt gewoon gebufferd):
// niet stil laten passeren maar de gebruiker verwittigen. Gedrosseld tegen toast-regen.
let _lastSyncFailAt = 0;
function _syncFail() {
  const now = Date.now();
  if (now - _lastSyncFailAt < 10000) return;
  _lastSyncFailAt = now;
  showToast('Synchronisatie mislukt — wijziging is wel lokaal bewaard.', 'err');
}
function cloudOnLocalMatchSave(m) {
  const r = teamRef('matches/' + m.id); if (!r || !isAdmin || !m || !m.id) return;
  try {
    const c = jclone(m);
    delete c.photo1; delete c.photo2; // base64 niet naar Firebase (te groot)
    // Notities gaan niet mee in "matches" (leesbaar door elk teamlid) maar apart naar
    // "teamNotes" (enkel beheerders) — zie notesRef().
    const playerNotes = {};
    (c.players || []).forEach(p => { if (p.note) playerNotes[p.id] = p.note; delete p.note; });
    delete c.notes;
    r.set(c).catch(_syncFail);
    const nr = notesRef(m.id);
    if (nr) {
      if (m.notes || Object.keys(playerNotes).length) nr.set({ notes: m.notes || '', players: playerNotes }).catch(_syncFail);
      else nr.remove().catch(_syncFail);
    }
  } catch (e) {}
}
function cloudOnLocalMatchDelete(id) {
  const r = teamRef('matches/' + id); if (!r || !isAdmin || !id) return;
  try { r.remove().catch(_syncFail); } catch (e) {}
  try { const nr = notesRef(id); if (nr) nr.remove().catch(_syncFail); } catch (e) {}
}
function cloudOnLocalTeamsSave(arr) {
  const r = teamRef('roster'); if (!r || !isAdmin) return;
  // Nooit pushen zolang het rooster van de ACTIEVE ploeg nog niet binnen is: in dat gaatje staat in
  // voetbal_teams_v2 nog de (gecachte) lijst van een vorige ploeg, en één set() zou daarmee het
  // rooster van deze ploeg overschrijven. Zelfde soort cross-team-vangnet als bij tornooien,
  // zie cloudOnLocalTournamentSave.
  if (!rosterReady()) {
    showToast('Spelers zijn nog niet geladen — deze wijziging is niet bewaard. Probeer opnieuw.', 'err');
    return;
  }
  try { r.set(jclone(arr || [])).catch(_syncFail); } catch (e) {}
}
// Per tornooi schrijven i.p.v. de hele array (zelfde reden als bij matches, zie B14/A3): met één
// set() van de volledige node wist de laatste schrijver stil de tornooien van een ander toestel.
function cloudOnLocalTournamentSave(t) {
  if (!t || !t.id) return;
  // Vangnet tegen een cross-team-write: teamRef schrijft altijd naar de ACTIEVE ploeg, dus een
  // tornooi van een andere ploeg (voetbal_tournaments is één globale sleutel) zou hier onder de
  // verkeerde ploeg belanden. Enkel blokkeren als we het rooster van de actieve ploeg echt kennen —
  // is dat nog niet gesynct, dan is teamById() nietszeggend en mag een legitieme write niet sneuvelen.
  const bekend = getTeamsV2();
  if (cloudReady && t.teamId && bekend.length && !bekend.some(x => x.id === t.teamId)) {
    showToast('Dit tornooi hoort bij een andere ploeg — lokaal bewaard, niet gesynchroniseerd.', 'err');
    return;
  }
  const r = teamRef('tournaments/' + t.id); if (!r || !isAdmin) return;
  try {
    const { pub, priv } = splitTournamentSquad(t);
    r.set(pub).catch(_syncFail);
    const sr = trnSquadRef(t.id);
    if (sr) {
      if (priv.length) sr.set({ players: priv, updatedAt: t.updatedAt || Date.now() }).catch(_syncFail);
      else sr.remove().catch(_syncFail);
    }
  } catch (e) {}
}
// De niet-beschikbare spelers van een tornooi, met hun reden ("ziek", "blessure", …), horen NIET
// in de "tournaments"-node: die zit onder teams/$teamId en is dus leesbaar voor élk ploeglid —
// ook een kijker of een gast met viewer-rol, rechtstreeks via Firebase, buiten de UI om. Voor
// minderjarigen is dat het gevoeligste stukje data in de app. Ze verhuizen daarom naar teamNotes
// (beheerder-only, zie notesRef/database.rules.json), exact zoals de wedstrijdnotities. Zo is er
// géén rules-wijziging nodig.
// Bijwerking die precies klopt met de statsPublic-keuze ("Geselecteerd" blijft publiek, de rest
// niet): "niet geselecteerd" staat nergens opgeslagen (= rooster min selectie), dus zodra de
// absent-lijst weg is kan een kijker die twee groepen ook ruw niet meer onderscheiden.
// Lokaal blijft alles gewoon in één tornooi-object staan.
function trnSquadRef(id) { return notesRef('tournamentSquad/' + id); }
function splitTournamentSquad(t) {
  const pub = jclone(t);
  const priv = [];
  const sq = pub.squad;
  if (sq) {
    if (Array.isArray(sq.players)) {
      sq.players = sq.players.filter(p => {
        if (p && p.sel === 'absent') { priv.push(p); return false; }
        return true;
      });
    }
    // Oud formaat (squad.base/bench/absent): ook hier de absent-lijst afsplitsen, anders zet een
    // tornooi van vóór de players-vorm bij het eerste terugpushen stil zijn redenen publiek.
    if (Array.isArray(sq.absent)) {
      sq.absent.forEach(p => { if (p) priv.push(Object.assign({}, p, { sel: 'absent' })); });
      delete sq.absent;
    }
  }
  return { pub, priv };
}
function cloudOnLocalTournamentDelete(id) {
  const r = teamRef('tournaments/' + id); if (!r || !isAdmin || !id) return;
  try { r.remove().catch(_syncFail); } catch (e) {}
  try { const sr = trnSquadRef(id); if (sr) sr.remove().catch(_syncFail); } catch (e) {}
}
// ---- lezen ----
function stopTeamListeners() {
  for (const { ref, event } of teamListeners) { try { ref.off(event); } catch (e) {} }
  teamListeners = [];
  knownLiveMatchIds = new Set();
  knownScores = {};
}
function cloudListen() {
  if (!cloudReady || !activeTeamId) return;
  const addL = (path, event, fn) => {
    const r = teamRef(path); r.on(event, fn);
    teamListeners.push({ ref: r, event });
  };
  // Matches: child-niveau i.p.v. één 'value'-listener op de hele node — zo stuurt één
  // event tijdens een live wedstrijd (bv. een goal) enkel díe ene wedstrijd door, niet
  // het volledige seizoen opnieuw (zie B14-analyse: schaalde met de totale historiek).
  const mRef = teamRef('matches');
  mRef.on('child_added', s => applyCloudMatch(s.key, s.val()));
  mRef.on('child_changed', s => applyCloudMatch(s.key, s.val()));
  mRef.on('child_removed', s => applyCloudMatchRemoved(s.key));
  teamListeners.push({ ref: mRef, event: 'child_added' }, { ref: mRef, event: 'child_changed' }, { ref: mRef, event: 'child_removed' });
  // Eenmalige opruimbeurt bij het (opnieuw) beginnen luisteren: lokale fromCloud-wedstrijden
  // die niet meer in de cloud staan (bv. verwijderd terwijl dit toestel volledig offline was)
  // worden hier nog opgeruimd — child_removed vangt dit enkel op voor toekomstige verwijderingen.
  // teamNames[activeTeamId] meegeven zodat enkel wedstrijden van DEZE ploeg opgeruimd worden —
  // anders wist dit ook de lokale cache van een andere ploeg op hetzelfde toestel.
  mRef.once('value').then(s => cleanupOrphanMatches(new Set(Object.keys(s.val() || {})), teamNames[activeTeamId])).catch(() => {});
  addL('roster',  'value', s => applyCloudTeams(s.val() || []));
  addL('club',    'value', s => applyCloudClub(s.val()));
  addL('tournaments', 'value', s => applyCloudTournaments(s.val() || {}));
  // statsPublic live volgen: een beheerder die secties (on)zichtbaar maakt voor kijkers bereikt
  // zo ook toestellen met de app al open — voordien werd dit enkel eenmalig in selectTeam gelezen
  // (en zag een kijker die snel doorklikte even de defaults i.p.v. de echte keuzes).
  addL('info/statsPublic', 'value', s => {
    activeStatsPublic = s.val() || {};
    if (view === 'stats') loadStats();
  });
  // Notities enkel ophalen als beheerder (kijkers/gasten mogen dit pad sowieso niet lezen).
  if (isAdmin) {
    const nr = notesRef();
    if (nr) { nr.on('value', s => applyCloudNotes(s.val() || {})); teamListeners.push({ ref: nr, event: 'value' }); }
  }
  // Live meeluisteren naar de EIGEN rol: goedkeuring/degradatie/verwijdering komt zo
  // meteen door i.p.v. pas na een app-herstart. Eerste waarde (huidige rol bij het
  // selecteren van de ploeg) wordt genegeerd — enkel échte wijzigingen doen iets.
  if (currentUser && !isGuest) {
    let first = true;
    addL('members/' + currentUser.uid, 'value', s => {
      if (first) { first = false; return; }
      onSelfRoleChanged(s.val());
    });
  }
}

// Eigen rol gewijzigd door een (andere) beheerder terwijl de app open staat.
function onSelfRoleChanged(role) {
  const tid = activeTeamId;
  if (!tid || !currentUser) return;
  if (!role) {
    // Clubbeheerder behoudt toegang via zijn club, ook al is hij geen ploeglid (meer):
    // niet degraderen of wegsturen.
    if (isClubAdmin) return;
    // Uit de ploeg verwijderd → netjes terug naar het ploegkeuzescherm.
    stopTeamListeners();
    delete userTeams[tid];
    cacheUserTeams(currentUser.uid, userTeams);
    activeTeamId = null; isAdmin = false;
    localStorage.removeItem('voetbal_activeTeamId');
    forgetRosterCache(tid); rosterLoaded = false; rosterTeamId = null;
    rememberTeamClubLogo(tid, '');
    showToast('Je bent uit deze ploeg verwijderd.', 'err');
    go('teamselect', undefined, true);
    return;
  }
  userTeams[tid] = role;
  cacheUserTeams(currentUser.uid, userTeams);
  fbdb.ref('users/' + currentUser.uid + '/teams/' + tid).set(role).catch(() => {});
  const wasAdmin = isAdmin;
  // Een clubbeheerder blijft beheerder van de ploeg, ook al zet een ploegbeheerder zijn
  // ploeglidmaatschap op 'viewer'.
  isAdmin = (role === 'admin') || isClubAdmin;
  if (isAdmin === wasAdmin) return;
  // Rolafhankelijke listeners heropstarten (notities, aanvragen-teller) en UI verversen.
  stopTeamListeners(); cloudListen(); listenCoAdminRequests(); updateCloudChip();
  showToast(isAdmin ? 'Goedgekeurd! Je bent nu ploegbeheerder van deze ploeg.' : 'Je rol is gewijzigd naar kijker.', isAdmin ? 'ok' : 'err');
  render();
}

// Ploegnaam kan al gewijzigd zijn op club-niveau (via doRenameTeam, of van vóór de fix
// daarvoor) terwijl de roster-naam (Spelers-pagina, tornooiwizard) en bestaande wedstrijden
// nog een oudere naam dragen. Wordt aangeroepen bij elke rename én bij elke club-data-load
// (applyCloudClub) zodat ook al langer bestaande, nooit-gemigreerde mismatches zichzelf
// herstellen zonder dat iemand opnieuw op "Naam wijzigen" moet klikken.
async function syncTeamNaming(newName, extraOldNames) {
  if (!newName) return;
  const oldNames = new Set([...(extraOldNames || []), ...getTeamsV2().map(t => t.name).filter(Boolean)]);
  oldNames.delete(newName);
  if (!oldNames.size) return;
  const localRoster = getTeamsV2();
  if (localRoster.length) { localRoster.forEach(t => { t.name = newName; }); saveTeamsV2(localRoster); }
  if (isAdmin && fbdb && activeTeamId) {
    try {
      const rosterSnap = await fbdb.ref('teams/' + activeTeamId + '/roster').once('value');
      const roster = rosterSnap.val();
      if (roster) {
        const updates = {};
        for (const rid in roster) updates[rid + '/name'] = newName;
        await fbdb.ref('teams/' + activeTeamId + '/roster').update(updates);
      }
    } catch (e) {}
  }
  const matches = await dbAll();
  let migrated = false;
  for (const m of matches) {
    if (oldNames.has(m.teamName)) { m.teamName = newName; await dbSave(m); migrated = true; }
  }
  // Tornooien dragen óók een gedenormaliseerde teamName (voor de lijst en het verslag). Die bleef
  // op de oude naam staan na een naamswijziging, zodat een tornooi in de lijst nog "U11IP" toonde
  // terwijl de ploeg intussen anders heet.
  const trns = getTournaments();
  let trnMigrated = false;
  for (const t of trns) {
    if (oldNames.has(t.teamName)) { t.teamName = newName; saveTournament(t); trnMigrated = true; }
  }
  if (trnMigrated && currentTournament && oldNames.has(currentTournament.teamName)) currentTournament.teamName = newName;
  if ((migrated || trnMigrated) && (view === 'home' || view === 'matches' || view === 'tournaments' || view === 'tournament')) render();
}
function applyCloudClub(val) {
  if (!val) return;
  if (val.name) {
    localStorage.setItem('voetbal_club_name', val.name);
    syncTeamNaming(val.name).catch(() => {});
  }
  if (val.logo) localStorage.setItem('voetbal_club_logo', val.logo);
  if (val.theme) localStorage.setItem('voetbal_theme', val.theme); else localStorage.removeItem('voetbal_theme');
  applyStoredTheme();
  if (view === 'home' || view === 'setup') { go('home'); } else cloudRefreshUI();
}
// Verwerkt precies één wedstrijd uit de cloud (via child_added/child_changed) — zelfde
// logica als voorheen in de over-alles-lopende applyCloudMatches, maar nu per item, zodat
// één cloud-wijziging niet langer het hele seizoen opnieuw verwerkt (zie B14).
async function applyCloudMatch(id, m) {
  if (!db || !m) return;
  m.id = id; m.fromCloud = true;
  if (!Array.isArray(m.events)) m.events = [];
  if (!Array.isArray(m.players)) m.players = [];
  if (!Array.isArray(m.quarters)) m.quarters = [];
  const existing = await dbGet(id);
  // Offline-vangnet: is de lokale versie recenter bewerkt dan wat de cloud heeft
  // (bv. wedstrijd offline afgewerkt en app afgesloten vóór de sync kon gebeuren)?
  // Dan lokaal behouden en opnieuw pushen i.p.v. overschrijven met de oude cloud-versie.
  if (existing && isAdmin && (existing.updatedAt || 0) > (m.updatedAt || 0)) {
    cloudOnLocalMatchSave(existing);
    return;
  }
  // Tombstones van beide kanten verenigen vóór de event-merge: een bewust verwijderd
  // event mag nooit "terugkomen" via een ander toestel of een oude back-up.
  const tomb = new Set([...(m.deletedEventIds || []), ...((existing && existing.deletedEventIds) || [])]);
  if (tomb.size) {
    m.deletedEventIds = [...tomb];
    const before = m.events.length;
    m.events = m.events.filter(e => !tomb.has(e.id));
    if (m.events.length !== before) { recomputeScore(m); recomputeOnField(m); }
  }
  // Merge: lokale events die nog niet in de cloud zitten bewaren (co-admin conflict-fix)
  if (existing && Array.isArray(existing.events) && existing.events.length) {
    const cloudEventIds = new Set(m.events.map(e => e.id));
    const localOnly = existing.events.filter(e => e.id && !cloudEventIds.has(e.id) && !tomb.has(e.id));
    if (localOnly.length) {
      m.events = [...m.events, ...localOnly].sort((a, b) => (a.gameTimeMs ?? 0) - (b.gameTimeMs ?? 0));
      recomputeScore(m); recomputeOnField(m);
      // De cloud mist events die wij wél hebben (andere beheerder overschreef ze met een
      // verouderd object) → gemergde versie terugpushen zodat alle toestellen convergeren.
      // Geen lus-gevaar: na de echo zijn er geen localOnly-events meer en stopt dit vanzelf.
      cloudOnLocalMatchSave(m);
    }
  }
  // Notities zitten niet (meer) in het cloud-object (zie cloudOnLocalMatchSave) — lokaal bewaarde
  // notities overnemen zodat ze niet verdwijnen tot de aparte teamNotes-listener ze aanvult.
  if (existing) {
    if (existing.notes && m.notes === undefined) m.notes = existing.notes;
    if (Array.isArray(existing.players)) {
      const noteMap = new Map(existing.players.filter(p => p.note).map(p => [p.id, p.note]));
      if (noteMap.size) m.players.forEach(p => { if (noteMap.has(p.id)) p.note = noteMap.get(p.id); });
    }
    // Foto's gaan bewust nooit naar de cloud (te groot voor RTDB) — lokale foto's
    // overnemen zodat de cloud-echo ze niet wist vlak na het toevoegen.
    if (existing.photo1 && m.photo1 === undefined) m.photo1 = existing.photo1;
    if (existing.photo2 && m.photo2 === undefined) m.photo2 = existing.photo2;
  }
  await dbPutLocal(m);
  // Notificatie voor kijkers: toon eenmalig als wedstrijd live gaat
  if (!isAdmin && m.status === 'live' && !knownLiveMatchIds.has(id)) {
    knownLiveMatchIds.add(id);
    knownScores[id] = { us: m.scoreUs || 0, them: m.scoreThem || 0 };
    notifyLiveMatch(m);
  } else if (m.status !== 'live') {
    knownLiveMatchIds.delete(id);
    delete knownScores[id];
  } else if (!isAdmin && m.status === 'live' && knownScores[id]) {
    const prev = knownScores[id];
    const newUs = m.scoreUs || 0, newThem = m.scoreThem || 0;
    if (newUs > prev.us) notifyGoal(m, true, newUs, newThem);
    else if (newThem > prev.them) notifyGoal(m, false, newUs, newThem);
    knownScores[id] = { us: newUs, them: newThem };
  }
  cloudRefreshUI();
}
// Eén wedstrijd is uit de cloud verwijderd (bv. door een beheerder) — lokaal meenemen.
async function applyCloudMatchRemoved(id) {
  if (!db) return;
  const existing = await dbGet(id);
  if (existing && existing.fromCloud) await dbDelLocal(id);
  knownLiveMatchIds.delete(id);
  delete knownScores[id];
  cloudRefreshUI();
}
// Eenmalige opruimbeurt bij het starten van cloudListen(): lokale fromCloud-wedstrijden die
// niet (meer) in de huidige cloud-snapshot staan worden verwijderd. child_removed vangt dit
// enkel op voor verwijderingen die gebeuren TERWIJL dit toestel actief luistert; wat al weg
// was vóór het opnieuw verbinden (bv. na lang offline zijn) wordt hier ingehaald.
// teamName beperkt dit tot wedstrijden van de ploeg die nu aan het syncen is — de lokale
// 'matches'-store is niet per ploeg gescheiden, dus zonder deze check zou een ploegwissel
// ook de cache van een ANDERE ploeg op dit toestel wissen. Onbekende teamName (nog niet
// gesynct) → geen enkele match kan matchen, dus deze ronde wordt dan veilig overgeslagen.
async function cleanupOrphanMatches(cloudIds, teamName) {
  if (!db) return;
  const local = await dbAll();
  for (const m of local) { if (m.fromCloud && m.teamName === teamName && !cloudIds.has(m.id)) await dbDelLocal(m.id); }
}
// Notities komen via een apart, beheerder-only pad binnen (zie notesRef/database.rules.json)
// en worden hier teruggekoppeld naar de lokale match — nodig zodat een tweede beheerder
// (ander toestel) ze ook ziet, en na het wissen van lokale opslag.
async function applyCloudNotes(obj) {
  // Hetzelfde beheerder-only pad draagt ook de niet-beschikbare spelers van elk tornooi
  // (zie splitTournamentSquad) — die staan onder één vaste sleutel naast de wedstrijdnotities.
  applyCloudTournamentSquads((obj || {}).tournamentSquad || {});
  if (!db) return;
  for (const id of Object.keys(obj)) {
    if (id === 'tournamentSquad') continue;
    const n = obj[id]; if (!n) continue;
    const existing = await dbGet(id); if (!existing) continue;
    existing.notes = n.notes || '';
    if (Array.isArray(existing.players) && n.players) {
      existing.players.forEach(p => { p.note = n.players[p.id] || ''; });
    }
    await dbPutLocal(existing);
  }
  cloudRefreshUI();
}
// Bewuste opt-in voor systeemmeldingen terwijl de PWA open maar op de achtergrond staat
// (bv. gebruiker wisselt naar een andere app tijdens een live wedstrijd) — enkel aan als
// de gebruiker dit zelf aanzette (toggle in Instellingen, echte tik = echte browserpermissie)
// ÉN de browserpermissie nog steeds 'granted' is (kan buiten de app om ingetrokken zijn).
function bgNotifOn() {
  return localStorage.getItem('voetbal_bgNotif') === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted';
}
async function toggleBgNotif() {
  if (!('Notification' in window)) return;
  if (bgNotifOn()) { localStorage.setItem('voetbal_bgNotif', '0'); render(); return; }
  if (Notification.permission === 'denied') {
    showToast('Meldingen staan geblokkeerd in je browserinstellingen. Zet ze daar terug aan.', 'err');
    return;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { localStorage.setItem('voetbal_bgNotif', '1'); showToast('Meldingen bij doelpunten staan aan.', 'ok'); }
    else showToast('Geen toestemming gekregen voor meldingen.', 'err');
  } catch (e) { showToast('Meldingen inschakelen mislukt.', 'err'); }
  render();
}
function notifyLiveMatch(m) {
  const club = getClubName() || 'je ploeg';
  const opp = m.opponent ? ` — ${m.opponent}` : '';
  const title = `⚽ Live: ${club}${opp}`;
  const body = 'De wedstrijd is gestart. Tik om te volgen.';
  if (bgNotifOn()) {
    try { new Notification(title, { body, icon: 'logo.png', tag: 'live-' + m.id }); } catch (e) {}
  }
  // In-app banner als fallback (ook als notificaties uitstaan of geblokkeerd zijn)
  showLiveBanner(title, m.id);
}
function notifyGoal(m, scoredUs, newUs, newThem) {
  const club = getClubName() || tName(m);
  const home = !isAway(m);
  const usLabel = home ? club : m.opponent;
  const themLabel = home ? m.opponent : club;
  const usScore = home ? newUs : newThem;
  const themScore = home ? newThem : newUs;
  const title = scoredUs ? `⚽ GOAL! ${usLabel} ${usScore}–${themScore} ${themLabel}` : `⚽ Tegendoel — ${usLabel} ${usScore}–${themScore} ${themLabel}`;
  const body = scoredUs ? `${club} scoort!` : `${m.opponent} scoort.`;
  if (bgNotifOn()) {
    try { new Notification(title, { body, icon: 'logo.png', tag: 'goal-' + m.id, renotify: true }); } catch (e) {}
  }
  showGoalBanner(title, m.id, scoredUs);
}
function showGoalBanner(title, matchId, scoredUs) {
  let banner = document.getElementById('goal-notify-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'goal-notify-banner';
    document.body.appendChild(banner);
  }
  banner.style.cssText = `position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:${scoredUs ? '#2f9e57' : '#dc2626'};color:#fff;padding:10px 18px;border-radius:12px;font-size:14px;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.35);z-index:9000;cursor:pointer;max-width:320px;text-align:center;animation:splashFade .3s ease`;
  banner.textContent = title;
  banner.onclick = () => { banner.remove(); if (view !== 'live') go('live', matchId); };
  clearTimeout(banner._t);
  banner._t = setTimeout(() => banner && banner.remove(), 8000);
}
function showLiveBanner(title, matchId) {
  if (view === 'live' && match && match.id === matchId) return; // al op live scherm
  let banner = document.getElementById('live-notify-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'live-notify-banner';
    banner.style.cssText = 'position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:#2f9e57;color:#fff;padding:10px 18px;border-radius:12px;font-size:14px;font-weight:700;box-shadow:0 4px 16px rgba(0,0,0,.35);z-index:9000;cursor:pointer;display:flex;align-items:center;gap:10px;max-width:320px;text-align:center;animation:splashFade .3s ease';
    document.body.appendChild(banner);
  }
  banner.innerHTML = `<span>${title}</span><span style="font-size:11px;opacity:.8">Tik om te volgen</span>`;
  banner.onclick = () => { banner.remove(); go('live', matchId); };
  clearTimeout(banner._t);
  banner._t = setTimeout(() => banner && banner.remove(), 12000);
}
function applyCloudTeams(val) {
  const raw = Array.isArray(val) ? val : Object.values(val || {});
  // Firebase slaat [] op als null — normaliseer terug naar array, filter nulls
  const cloud = raw.filter(t => t && t.id).map(t => Object.assign({}, t, {
    players: Array.isArray(t.players) ? t.players : [],
    trainers: Array.isArray(t.trainers) ? t.trainers : [],
    fromCloud: true
  }));
  const merged = cloud; // in cloud-modus enkel cloud-ploegen bewaren
  localStorage.setItem('voetbal_teams_v2', JSON.stringify(merged));
  // Rooster van de actieve ploeg is nu écht binnen: vlag zetten (leeg betekent van hier af ook
  // echt "geen spelers") en apart cachen zodat een volgende wissel naar deze ploeg meteen klopt.
  rosterTeamId = activeTeamId;
  rosterLoaded = true;
  cacheRoster(activeTeamId, merged);
  cloudRefreshUI();
}
// Tornooien stonden vroeger als één array in de cloud en werden hier onvoorwaardelijk over de
// lokale versie gekopieerd. Wie offline een selectie of eindstand aanpaste en de app sloot vóór de
// sync kon gebeuren, zag zijn werk bij de volgende start stil overschreven door de oude
// cloudversie. Nu per id vergelijken op updatedAt, met dezelfde terugpush-logica als
// applyCloudMatch. Twee beheerders die tegelijk HETZELFDE tornooi bewerken blijven
// last-writer-wins (per tornooi, niet per veld) — bewust, zie groep D.
let _trnShapeMigrated = false;
let _trnSquadMigrated = false;
// Cache van het beheerder-only deel van de dagselectie (tornooi-id → NB-spelers), gevuld door
// applyCloudTournamentSquads. _trnSquadLoaded zegt of de teamNotes-snapshot al binnen is: zolang
// dat niet zo is mag een lege cache niet als "er zijn er geen" gelezen worden, anders zou een
// tornooi in dat tijdsvenster zijn NB-groep lijken te verliezen.
let cloudTrnSquad = {};
let _trnSquadLoaded = false;
// Het NB-deel komt via het aparte, beheerder-only pad binnen en wordt hier teruggekoppeld naar de
// lokale tornooien — nodig voor een tweede beheerder (ander toestel) en na het wissen van lokale
// opslag. Werkt in beide richtingen: aanvullen én weghalen wat elders geschrapt werd.
function applyCloudTournamentSquads(obj) {
  cloudTrnSquad = {};
  for (const id of Object.keys(obj || {})) {
    const raw = (obj[id] && obj[id].players) || [];
    cloudTrnSquad[id] = (Array.isArray(raw) ? raw : Object.values(raw))
      .filter(p => p && p.name)
      .map(p => Object.assign({}, p, { sel: 'absent' }));
  }
  _trnSquadLoaded = true;
  const arr = getTournaments();
  let changed = false;
  for (const t of arr) {
    // Enkel tornooien die uit de cloud komen: een zuiver lokaal tornooi (nooit gesynct) mag hier
    // niets verliezen, en het oude squad-formaat wordt pas bij de eerstvolgende save gesplitst.
    if (!t.fromCloud || !t.squad || !Array.isArray(t.squad.players)) continue;
    const priv = jclone(cloudTrnSquad[t.id] || []);
    const huidig = t.squad.players.filter(p => p && p.sel === 'absent');
    if (JSON.stringify(huidig) === JSON.stringify(priv)) continue;
    t.squad.players = [...t.squad.players.filter(p => !(p && p.sel === 'absent')), ...priv];
    changed = true;
  }
  if (changed) { setTournamentsLocal(arr); cloudRefreshUI(); } // lokaal-only: geen sync-lus
}
// De cloud-versie van een tornooi mist de NB-spelers (zie splitTournamentSquad). Aanvullen met wat
// we hebben: het beheerder-only pad zodra dat binnen is, anders de lokale versie zodat de NB-groep
// niet even uit het scherm verdwijnt tussen de twee listeners.
function withTournamentSquad(ct, lt) {
  const sq = ct.squad;
  if (!sq || !Array.isArray(sq.players)) return ct;
  if (sq.players.some(p => p && p.sel === 'absent')) return ct; // nog niet gesplitst tornooi
  const priv = _trnSquadLoaded
    ? (cloudTrnSquad[ct.id] || [])
    : (lt ? tournamentSquadList(lt).filter(p => p && p.sel === 'absent') : []);
  if (!priv.length) return ct;
  ct.squad = Object.assign({}, sq, { players: [...sq.players, ...jclone(priv)] });
  return ct;
}
function applyCloudTournaments(val) {
  const raw = (Array.isArray(val) ? val : Object.values(val || {})).filter(t => t && t.id);
  // Ontdubbelen op id, nieuwste wint. Nodig als vangnet voor de oude array-vorm: die had
  // numerieke sleutels, dus tijdens de migratie kan hetzelfde tornooi even twee keer in de node
  // staan en zou het anders dubbel in de lijst verschijnen.
  const cloudById = new Map();
  for (const t of raw) {
    const prev = cloudById.get(t.id);
    if (!prev || (t.updatedAt || 0) >= (prev.updatedAt || 0)) cloudById.set(t.id, t);
  }
  const local = getTournaments();
  const localById = new Map(local.map(t => [t.id, t]));
  const merged = [];
  const repush = [];
  const teSplitsen = [];
  for (const [id, ct] of cloudById) {
    const lt = localById.get(id);
    // Staat het NB-deel nog ín de publieke node? Dan is dit tornooi van vóór de splitsing.
    if (tournamentSquadList(ct).some(p => p && p.sel === 'absent')) teSplitsen.push(id);
    if (lt && isAdmin && (lt.updatedAt || 0) > (ct.updatedAt || 0)) {
      // Lokaal recenter bewerkt dan wat de cloud heeft → lokaal behouden en terugduwen.
      // Geen lus: na de echo zijn de tijdstempels gelijk en valt dit weg.
      merged.push(lt); repush.push(lt);
    } else {
      merged.push(withTournamentSquad(Object.assign({}, ct, { fromCloud: true }), lt));
    }
  }
  // Tornooien die nooit in de cloud stonden (zuiver lokale modus) blijven behouden.
  for (const lt of local) if (!cloudById.has(lt.id) && !lt.fromCloud) merged.push(lt);
  setTournamentsLocal(merged);
  repush.forEach(t => cloudOnLocalTournamentSave(t));
  // Eenmalige vormmigratie: de oude array-node één keer herschrijven als object gesleuteld op
  // tornooi-id, zodat de per-child writes hierboven niet naast de oude numerieke sleutels landen.
  if (!_trnShapeMigrated && isAdmin && Array.isArray(val) && raw.length) {
    _trnShapeMigrated = true;
    // Meteen in de gesplitste vorm herschrijven (pub, zonder de NB-spelers) — anders zou deze
    // set() de redenen van een oud tornooi opnieuw publiek zetten, net vóór de privacy-migratie
    // hieronder ze weer wegneemt.
    const byId = {};
    for (const [id, ct] of cloudById) byId[id] = splitTournamentSquad(ct).pub;
    const r = teamRef('tournaments');
    if (r) { try { r.set(byId).catch(_syncFail); } catch (e) {} }
  }
  // Eenmalige privacy-migratie: tornooien die de NB-spelers nog ín de publieke node hebben één keer
  // opnieuw wegschrijven — cloudOnLocalTournamentSave verhuist dat deel dan naar het beheerder-only
  // pad en wist het uit "tournaments". Via het gemergde object, zodat een lokaal recentere versie
  // wint. Geen lus: na de echo is de node schoon (en de vlag blokkeert een tweede ronde).
  if (isAdmin && !_trnSquadMigrated && teSplitsen.length) {
    _trnSquadMigrated = true;
    const byId = new Map(merged.map(t => [t.id, t]));
    teSplitsen.forEach(id => { const t = byId.get(id); if (t) cloudOnLocalTournamentSave(t); });
  }
  cloudRefreshUI();
}

function cloudRefreshUI() {
  if (view === 'home') loadHome();
  else if (view === 'matches') loadMatches();
  else if (view === 'stats' && typeof loadStats === 'function') loadStats();
  else if (view === 'teams') render();
  // De spelerslijst is een momentopname (openTeam kloont naar editingTeam), dus een rooster dat pas
  // ná het openen binnenkwam bleef hier onzichtbaar tot je het scherm verliet. Enkel in de
  // overzichtsmodus verversen — in bewerkmodus zou een herrender ingetypte wijzigingen weggooien.
  else if (view === 'teamEdit' && editingTeam && !teamEditMode) {
    const arr = cloudReady ? getTeamsV2().filter(t => t.fromCloud) : getTeamsV2();
    // Na een ploegwissel bestaat het oude id niet meer; in de cloud is er precies één rooster.
    const vers = arr.find(t => t.id === editingTeam.id) || (cloudReady && arr.length === 1 ? arr[0] : null);
    if (vers) { editingTeam = jclone(vers); render(); }
  }
  else if (view === 'tournaments') render();
  // currentTournament is een momentopname: zonder verversen bleven de tornooipagina én het verslag
  // op de oude versie hangen wanneer een ander toestel het tornooi aanpaste. En het verslag had
  // helemaal geen branch, dus daar zag je een tweede beheerder wedstrijd 4 niet afsluiten.
  else if (view === 'tournament' || view === 'tournamentReport') {
    if (currentTournament) {
      const vers = tournamentById(currentTournament.id);
      if (vers) currentTournament = vers;
    }
    if (view === 'tournament') loadTournamentDetail(); else loadTournamentReport();
  }
  else if ((view === 'detail' || view === 'live' || view === 'prep') && match) {
    // Ook voor beheerders verversen (co-admin-fix): anders pusht een beheerder bij zijn
    // volgende actie een verouderd object en wist hij de events van de andere beheerder.
    // Niet verversen terwijl een popup openstaat — dat zou in-flight bewerkingen
    // (bv. "Spelers bewerken") stilletjes weggooien.
    const modalOpen = isAdmin && !document.getElementById('modal').classList.contains('hidden');
    if (!modalOpen) dbGet(match.id).then(m => { if (m) { match = m; render(); } });
  }
}

// ---- rechten ----
// Offline bij het opstarten met een gekende cloud-ploeg: de rol (beheerder/kijker) kan niet
// geverifieerd worden zonder verbinding, dus geen beheerrechten geven tot die bevestigd is.
function offlineWithKnownCloudTeam() { return !cloudReady && !!localStorage.getItem('voetbal_activeTeamId'); }
function canManage() { return !isGuest && !viewerMode && !offlineWithKnownCloudTeam() && (!cloudReady || isAdmin); }
// Statistieken (seizoensoverzicht + individueel spelerdetail) zijn enkel voor beheerders,
// niet voor kijkers of gasten (bewuste keuze). Anders dan canManage() blijft dit offline wél
// true, zodat een beheerder zijn stats ook zonder verbinding kan bekijken.
// Offline mét een gekende cloud-ploeg telt de gecachete rol (isAdmin uit localStorage): anders
// zag een KIJKER bij een falende SDK-load plots de volledige beheerdersweergave. Pure lokale
// modus (geen cloud-ploeg bekend) blijft alles tonen.
function canSeeStats() { return !isGuest && !viewerMode && (isAdmin || isOwner || (!cloudReady && !offlineWithKnownCloudTeam())); }
// Mag deze statistieksectie getoond worden aan wie nu kijkt? Beheerders zien alles; voor kijkers
// gelden de oogjes uit v0.5.20 (teams/{id}/info/statsPublic, standaard STATS_DEFAULT_PUBLIC).
// Eén plek voor die regel, want ze geldt nu op de statistiekenpagina, in het tornooiverslag en in
// het wedstrijdverslag — op het scherm én in de PDF's, die een kijker allemaal kan openen.
function statSectionVisible(key) { return canSeeStats() || statSectionPublic(key); }
// Enkel de keuze zelf, zonder de beheerder-uitzondering — nodig om een beheerder te kunnen vertellen
// wat een KIJKER hier wel en niet ziet.
function statSectionPublic(key) {
  if (key in activeStatsPublic) return !!activeStatsPublic[key];
  return !!(typeof STATS_DEFAULT_PUBLIC !== 'undefined' && STATS_DEFAULT_PUBLIC[key]);
}
// Hint onderaan een verslag, enkel voor beheerders: wat ziet een kijker hier níet, en waar wijzig je
// dat? De instelling staat bewust op één plek (de oogjes bij Statistieken, per ploeg) — dit maakt
// alleen vindbaar dát ze ook de verslagen bepaalt, want in het verslag zelf was daar niets van te
// zien.
const _VIEWER_HINT_LABELS = {
  minutes: 'de speelminuten', fairplay: 'de fair-play-lijst', cards: 'de kaarten',
  selected: 'wie niet geselecteerd of niet beschikbaar was',
};
function viewerVisibilityHintHtml(keys) {
  if (!canSeeStats()) return '';
  const verborgen = keys.filter(k => !statSectionPublic(k)).map(k => _VIEWER_HINT_LABELS[k] || k);
  const kern = verborgen.length
    ? `<b>Verborgen voor kijkers:</b> ${esc(verborgen.join(', '))}.`
    : 'Kijkers zien dit verslag volledig.';
  return `<p style="font-size:12px;color:var(--txt2);text-align:center;margin-top:16px;line-height:1.6">
    ${icI(IC.eye)} ${kern} Je past dat aan met de oogjes bij <b>Statistieken</b> (geldt voor alle verslagen van deze ploeg).
    <button class="btn btn-pale btn-sm no-print" style="margin-top:8px" onclick="go('stats')">${icI(IC.chart)} Naar Statistieken</button></p>`;
}

// ---- UI chip + account modal ----
function updateCloudChip() {
  const el = document.getElementById('cloud-chip');
  if (!el) return;
  // Voor een gast leidt deze chip nergens naartoe (go('beheer') wordt door de guest-guard in
  // go() stil teruggeschreven naar 'home' — "Vraag ploegbeheer aan" is sowieso niet mogelijk
  // zonder eigen account) — dan liever niet tonen dan een knop die niets zichtbaars doet.
  if (!cloudReady || !activeTeamId || isGuest) { el.style.display = 'none'; return; }
  el.style.display = '';
  const effectiveAdmin = isAdmin && !viewerMode;
  const coBadge = (effectiveAdmin && pendingCoAdminCount) ? `<span class="req-badge">${pendingCoAdminCount}</span>` : '';
  el.innerHTML = effectiveAdmin ? `${icI(IC.edit)} Beheer${coBadge}` : icI(IC.eye) + (isAdmin && viewerMode ? 'Kijkmodus' : 'Kijken');
  el.className = 'cloud-chip ' + (effectiveAdmin ? 'admin' : 'viewer');
}
