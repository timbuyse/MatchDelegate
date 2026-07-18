// ===================== CONFIG =====================
const APP_VERSION = '0.5.38'; // MAJOR.MINOR.PATCH — 0.x = testfase, nog niet officieel live
const FEEDBACK_EMAIL = 'buysesorgeloos@gmail.com';
const MATCH_TYPES = {
  '3v3':  { field: 3,  lines: ['Doel','Verdediging','Aanval'] },
  '5v5':  { field: 5,  lines: ['Doel','Verdediging','Middenveld','Aanval'] },
  '8v8':  { field: 8,  lines: ['Doel','Verdediging','Middenveld','Aanval'] },
  '11v11':{ field: 11, lines: ['Doel','Verdediging','Middenveld','Aanval'] },
};
const LINE_Y = { 'Doel': 90, 'Verdediging': 68, 'Middenveld': 45, 'Aanval': 22 };
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
const LINE_SHORT = { 'Doel': 'K', 'Verdediging': 'V', 'Middenveld': 'M', 'Aanval': 'A' };
// Weergavelabel voor een lijn/positie — 'Doel' wordt getoond als 'Doelman', de opgeslagen waarde blijft 'Doel'.
const LINE_LABEL = { 'Doel': 'Doelman', 'Verdediging': 'Verdediging', 'Middenveld': 'Middenveld', 'Aanval': 'Aanval' };
function lineLabel(l) { return LINE_LABEL[l] || l; }
// Optionele verfijning van de voorkeurspositie, enkel voor Verdediging (p.side op de speler).
const DEFENSE_SIDES = { centraal: 'Centraal', links: 'Links', rechts: 'Rechts' };
// Voorkeurspositie + (indien Verdediging) de gekozen kant, voor weergave bij spelersbeheer/selectie.
function posDisplay(p) {
  if (!p || !p.pos) return '';
  const base = lineLabel(p.pos);
  return (p.pos === 'Verdediging' && p.side && DEFENSE_SIDES[p.side]) ? base + ' · ' + DEFENSE_SIDES[p.side] : base;
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
function isAway(m) { return !!(m && m.location && m.location.toLowerCase() !== 'thuis'); }
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
// Club/ploeg-branding (logo + naam), per toestel bewaard
function getClubName() { return localStorage.getItem('voetbal_club_name') || 'Mijn ploeg'; }
function getClubLogo() { return 'logo.png'; } // vast MatchDelegate-merklogo, niet wijzigbaar
// Clublogo van de actieve ploeg (data-URI), of leeg als de club er geen heeft.
function getActiveClubLogo() { return activeClubLogo || ''; }
// Lees een afbeeldingsbestand in, verklein tot max `size` px en comprimeer tot een
// kleine data-URI (geschikt om in RTDB te bewaren). Behoudt transparantie (PNG) bij
// bestanden mét alpha, anders JPEG voor een kleinere payload. Geeft een data-URI terug.
function fileToClubLogoDataUri(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) { reject(new Error('Geen afbeelding')); return; }
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Kon bestand niet lezen'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Ongeldige afbeelding'));
      img.onload = () => {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
        const isPng = /png/i.test(file.type);
        let uri = isPng ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.82);
        // Als PNG toch groot uitvalt, val terug op JPEG (verliest transparantie maar blijft klein).
        if (uri.length > 60000 && isPng) uri = cv.toDataURL('image/jpeg', 0.82);
        resolve(uri);
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
// Donkere modus (per toestel)
function darkOn() { return localStorage.getItem('voetbal_dark') === '1'; } // standaard UIT (licht); enkel '1' = donker
function applyDark() { document.body.classList.toggle('dark', darkOn()); }
function toggleDark() { localStorage.setItem('voetbal_dark', darkOn() ? '0' : '1'); applyDark(); render(); }
// ----- Ploegen v2: {id, name, players:[{id,name,number,pos}]} -----
function getTeamsV2() { try { return JSON.parse(localStorage.getItem('voetbal_teams_v2') || '[]'); } catch (e) { return []; } }
function saveTeamsV2(arr) { localStorage.setItem('voetbal_teams_v2', JSON.stringify(arr)); cloudOnLocalTeamsSave(arr); }
function teamById(id) { return getTeamsV2().find(t => t.id === id) || null; }
// Tornooien (localStorage)
function getTournaments() { try { return JSON.parse(localStorage.getItem('voetbal_tournaments') || '[]'); } catch(e) { return []; } }
function saveTournaments(arr) { localStorage.setItem('voetbal_tournaments', JSON.stringify(arr)); cloudOnLocalTournamentsSave(arr); }
function tournamentById(id) { return getTournaments().find(t => t.id === id) || null; }
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
function recomputeOnField(m) {
  const on = {}; m.players.forEach(p => on[p.id] = !!p.starting && !p.absent);
  for (const e of [...m.events].sort((a, b) => a.gameTimeMs - b.gameTimeMs)) {
    if (e.type === 'substitution') { if (e.playerOutId) on[e.playerOutId] = false; if (e.playerInId) on[e.playerInId] = true; }
    if (e.type === 'red_card' && e.playerId) on[e.playerId] = false;
    if (e.type === 'injury' && e.leavesField && e.playerId) on[e.playerId] = false;
  }
  m.players.forEach(p => p.onField = !!on[p.id]);
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
   'voetbal_theme', 'voetbal_teamNames', 'voetbal_setup_done', 'voetbal_last_backup',
   'voetbal_adminRequested', 'voetbal_adminApprovedSeen', 'voetbal_activeTeamId']
    .forEach(k => localStorage.removeItem(k));
  if (uid) localStorage.removeItem('voetbal_userTeams_' + uid);
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
let teamClubLogos = {};    // { teamId: clubLogo } — cache clublogo per ploeg (ploegkeuzescherm)
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
  if (user.email) { try { fbdb.ref('usersByEmail/' + user.uid).set({ email: user.email, name: user.displayName || '' }); } catch (e) {} }
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
  isAdmin = (userTeams[teamId] === 'admin');
  // Club-context van de actieve ploeg. Owner is impliciet clubbeheerder overal; voor de rest
  // wachten we op de clubId-fetch hieronder (achtergrond) vóór we isClubAdmin definitief zetten.
  activeClubId = null; activeClubName = ''; activeClubLogo = ''; activeStatsPublic = {};
  isClubAdmin = isOwner;
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
  fbOnce(fbdb.ref('teams/' + teamId + '/info')).then(s => {
    if (activeTeamId !== teamId || !s.exists()) return; // ondertussen van ploeg gewisseld
    const info = s.val() || {};
    activeClubId = info.clubId || null;
    activeClubName = info.clubName || '';
    activeClubLogo = info.clubLogo || '';
    activeStatsPublic = info.statsPublic || {};
    if (activeClubName) teamClubNames[teamId] = activeClubName;
    if (activeClubLogo) teamClubLogos[teamId] = activeClubLogo; else delete teamClubLogos[teamId];
    if (info.archived) archivedTeams[teamId] = true; else delete archivedTeams[teamId];
    isClubAdmin = isOwner || !!(activeClubId && myClubs[activeClubId]);
    // Clubbeheerder beheert de ploegen van zijn club (fase 2d): behandel hem als beheerder van
    // deze ploeg, ook al is hij geen ploeglid. Verandert isAdmin → altijd herrenderen.
    const wasAdmin = isAdmin;
    if (isClubAdmin) isAdmin = true;
    // Elevatie naar beheerder ná de initiële cloudListen(): de beheerder-only listeners
    // (o.a. teamNotes) zijn toen niet opgezet omdat isAdmin nog false was. Herstart ze nu,
    // net zoals onSelfRoleChanged bij een rolwijziging doet.
    if (isAdmin && !wasAdmin) { stopTeamListeners(); cloudListen(); listenCoAdminRequests(); }
    const changed = info.name && teamNames[teamId] !== info.name;
    if (info.name) { teamNames[teamId] = info.name; try { localStorage.setItem('voetbal_teamNames', JSON.stringify(teamNames)); } catch (e) {} }
    if (isAdmin !== wasAdmin || ((changed || activeClubName) && (view === 'home' || view === 'matches'))) render();
  }).catch(() => {});
  go('home');
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
  try { r.set(jclone(arr || [])).catch(_syncFail); } catch (e) {}
}
function cloudOnLocalTournamentsSave(arr) {
  const r = teamRef('tournaments'); if (!r || !isAdmin) return;
  try { r.set(jclone(arr || [])).catch(_syncFail); } catch (e) {}
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
  if (migrated && (view === 'home' || view === 'matches')) render();
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
  if (!db) return;
  for (const id of Object.keys(obj)) {
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
  cloudRefreshUI();
}
function applyCloudTournaments(val) {
  const cloud = Array.isArray(val) ? val : Object.values(val || {});
  const cloudIds = new Set(cloud.map(t => t && t.id).filter(Boolean));
  const localOnly = getTournaments().filter(t => !t.fromCloud && !cloudIds.has(t.id));
  const merged = localOnly.concat(cloud.map(t => Object.assign({}, t, { fromCloud: true })));
  localStorage.setItem('voetbal_tournaments', JSON.stringify(merged));
  cloudRefreshUI();
}

function cloudRefreshUI() {
  if (view === 'home') loadHome();
  else if (view === 'matches') loadMatches();
  else if (view === 'stats' && typeof loadStats === 'function') loadStats();
  else if (view === 'teams') render();
  else if (view === 'tournaments') render();
  else if (view === 'tournament') loadTournamentDetail();
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
function canSeeStats() { return !isGuest && !viewerMode && (!cloudReady || isAdmin || isOwner); }

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
