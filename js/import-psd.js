// ===================== TRAINERSVOORBEREIDING INLEZEN (PDF) =====================
// De trainer zet zijn selectie en zijn opstelling per kwart in ProSoccerData en drukt dat af als
// "wedstrijdvoorbereiding". Dat blad bevat precies wat de afgevaardigde hier anders met de hand
// intikt: wie meegaat, wie start, waar iedereen staat, en hoe de ploeg er bij elk volgend moment
// hoort te staan. Dit bestand leest zo'n PDF, laat je het resultaat eerst nakijken en zet het dan
// klaar als een gewone selectie + opstelling + wedstrijdplan.
//
// ER KOMT NIETS NIEUWS IN HET DATAMODEL BIJ. De import vult wiz (de wizard) en roept finishWizard
// aan, en schrijft daarna het plan weg langs _schrijfPlanDraft — exact dezelfde weg als wanneer je
// alles met de hand ingeeft. Een ingelezen wedstrijd is achteraf niet te onderscheiden van een
// getikte, en alles blijft gewoon bewerkbaar.
//
// GEEN EXTERNE BIBLIOTHEEK, om dezelfde reden als bij de kalenderimport (zie import-cal.js): een
// PDF-lezer als pdf.js weegt anderhalve megabyte, en dat is veel voor een app die offline op een
// telefoon aan de zijlijn moet starten. Het kan hier zonder, omdat deze PDF's uit de printfunctie
// van de browser komen (Skia/PDF): platte objecten, FlateDecode-streams die de browser zelf kan
// uitpakken (DecompressionStream), en fonts met een ToUnicode-tabel waarmee de tekst terug te
// vinden is. Wat we nodig hebben is enkel TEKST MET COÖRDINATEN — geen tekeningen, geen kleuren,
// geen afbeeldingen. Past een bestand niet in dat stramien, dan zeggen we dat eerlijk in plaats van
// half te raden.
//
// GEMETEN OP TWEE ECHTE BLADEN (28-08-2026): één met vier momenten (start + 15'/30'/45') en één met
// acht (start + 7'/15'/22'/30'/37'/45'/52'), beide 8v8 in de dubbele ruit. Het raster van PSD lag in
// allebei op dezelfde plaats. Toch leunt niets hieronder op vaste pixelwaarden: de rijen en kolommen
// worden per blad uit de gevonden posities afgeleid, en de opstelling wordt herkend aan het PATROON
// (hoeveel spelers per rij, van achter naar voor) en niet aan waar een naam toevallig staat.

// Toestand van het importscherm. Leeft enkel zolang je op dat scherm bent.
let psdSt = null;

// ---------------------------------------------------------------------------------------------
// 1. DE PDF LEZEN — tekst met coördinaten, meer niet
// ---------------------------------------------------------------------------------------------

// Bytes als tekst waarin we met reguliere expressies kunnen zoeken. Latin-1 houdt één byte = één
// teken, dus een positie in deze tekst is meteen de bytepositie — dat hebben we nodig om een stream
// er weer uit te knippen. In stukken, want String.fromCharCode kapt op een te lange argumentenlijst.
function psdLatin1(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return s;
}

// Een FlateDecode-stream is een zlib-stroom (mét kop), niet de rauwe deflate die in een zip zit —
// vandaar 'deflate' hier en 'deflate-raw' in de kalenderimport.
async function psdInflateMet(u8, formaat) {
  const ds = new DecompressionStream(formaat);
  const buf = await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(buf);
}
// DecompressionStream is STRENGER dan de meeste zlib-implementaties: één byte te veel achteraan en
// de hele stroom faalt. En één byte te veel is precies wat er in een PDF staat — tussen de laatste
// byte van de stream en het woord 'endstream' staat een regeleinde. Vandaar dat we de staart
// afknippen, en bij een mislukking nog een paar bytes korter proberen. De laatste poging is
// 'deflate-raw': een enkele maker schrijft de zlib-kop niet mee.
async function psdInflate(u8) {
  let eind = u8.length;
  while (eind > 0 && [0x0a, 0x0d, 0x20, 0x09, 0x00].includes(u8[eind - 1])) eind--;
  const fouten = [];
  for (const formaat of ['deflate', 'deflate-raw']) {
    for (const n of [eind, u8.length, eind - 1, eind - 2]) {
      if (n <= 0 || n > u8.length) continue;
      try { return await psdInflateMet(u8.subarray(0, n), formaat); } catch (e) { fouten.push(e); }
    }
  }
  throw fouten[0] || new Error('Kon een deel van de PDF niet uitpakken.');
}

// Waar elk object begint. Het anker op een regeleinde houdt toevallige "12 0 obj" IN een
// binaire stream buiten: die staat nooit netjes aan het begin van een regel.
function psdObjecten(s) {
  const uit = {};
  const re = /[\r\n](\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(s))) uit[parseInt(m[1], 10)] = re.lastIndex;
  return uit;
}
function psdBody(s, off, nr) {
  const st = off[nr];
  if (st === undefined) return '';
  const e = s.indexOf('endobj', st);
  return s.slice(st, e < 0 ? undefined : e);
}
// De inhoud van een stream-object, uitgepakt. /Length wordt bewust NIET gebruikt: dat mag een
// verwijzing naar een ander object zijn, en 'endstream' zoeken werkt in beide gevallen.
async function psdStream(s, u8, off, nr) {
  const st = off[nr];
  if (st === undefined) return null;
  const e = s.indexOf('endobj', st);
  const body = s.slice(st, e < 0 ? undefined : e);
  const i = body.indexOf('stream');
  if (i < 0) return null;
  let j = i + 6;
  if (body.substr(j, 2) === '\r\n') j += 2;
  else if (body[j] === '\n' || body[j] === '\r') j += 1;
  const k = body.lastIndexOf('endstream');
  const bytes = u8.subarray(st + j, st + (k < 0 ? body.length : k));
  if (/\/FlateDecode/.test(body.slice(0, i))) {
    try { return await psdInflate(bytes); } catch (e2) { return null; }
  }
  return bytes;
}

// De ToUnicode-tabel van een font: van glyphnummer naar leesbare tekst. Zonder deze tabel zijn de
// tekststrings in de PDF betekenisloze nummers.
function psdCMap(txt) {
  const uit = {};
  let blk;
  const reChar = /beginbfchar([\s\S]*?)endbfchar/g;
  while ((blk = reChar.exec(txt))) {
    const re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
    let p;
    while ((p = re.exec(blk[1]))) {
      let t = '';
      for (let i = 0; i < p[2].length; i += 4) t += String.fromCharCode(parseInt(p[2].substr(i, 4), 16));
      uit[parseInt(p[1], 16)] = t;
    }
  }
  const reRange = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((blk = reRange.exec(txt))) {
    const re = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
    let p;
    while ((p = re.exec(blk[1]))) {
      const lo = parseInt(p[1], 16), hi = parseInt(p[2], 16), dst = parseInt(p[3], 16);
      // Een reeks van duizenden zou een subset-font niet hebben; de grens vangt een verkeerd
      // gelezen tabel af zonder het geheugen vol te schrijven.
      for (let k = lo; k <= hi && k - lo < 4096; k++) uit[k] = String.fromCharCode(dst + k - lo);
    }
  }
  return uit;
}

function psdMul(a, b) {
  return [
    a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5],
  ];
}

// De tekenopdrachten van één pagina. We volgen enkel wat de PLAATS van tekst bepaalt: de
// grafische toestand (q/Q/cm), de tekstmatrix (BT/Tm/Td/TD/T*/TL) en het tonen zelf (Tj/TJ/'/").
// Alles wat tekent — lijnen, vlakken, afbeeldingen — negeren we; de shirtjes op het veld zijn voor
// ons alleen interessant door de naam die eronder staat.
const PSD_TOK = /<[0-9A-Fa-f\s]*>|\((?:\\[\s\S]|[^\\()])*\)|\[|\]|[-+]?[0-9.]+|\/[^\s/[\]<>(){}]+|[A-Za-z'"*]+/g;
function psdContentItems(content, fonts, hoogte) {
  const uit = [];
  let ctm = [1, 0, 0, 1, 0, 0], tm = [1, 0, 0, 1, 0, 0], tlm = tm.slice();
  let font = null, tf = 1, leading = 0;
  const stack = [];
  let ops = [];
  const getal = t => { const v = parseFloat(t); return isFinite(v) ? v : 0; };
  const toon = () => {
    const cmap = (font && fonts[font]) || null;
    let txt = '';
    for (const o of ops) {
      if (o[0] !== '<') continue;
      const hx = o.slice(1, -1).replace(/\s/g, '');
      // Identity-H (wat deze PDF's gebruiken) is twee bytes per teken. Zonder tabel valt het terug
      // op de bytes zelf, wat voor een gewoon font de juiste letters geeft.
      if (cmap) { for (let i = 0; i + 4 <= hx.length; i += 4) { const c = cmap[parseInt(hx.substr(i, 4), 16)]; if (c) txt += c; } }
      else for (let i = 0; i + 2 <= hx.length; i += 2) txt += String.fromCharCode(parseInt(hx.substr(i, 2), 16));
    }
    if (!txt.trim()) return;
    const M = psdMul(tm, ctm);
    const size = Math.abs(tf) * Math.sqrt(M[0] * M[0] + M[1] * M[1]) || 10;
    uit.push({ x: M[4], y: hoogte - M[5], text: txt, size });
  };
  let t;
  PSD_TOK.lastIndex = 0;
  while ((t = PSD_TOK.exec(content))) {
    const tok = t[0];
    if (/^[-+]?[0-9.]|^\/|^\[|^\]|^<|^\(/.test(tok)) { ops.push(tok); continue; }
    if (tok === 'q') stack.push(ctm.slice());
    else if (tok === 'Q') { if (stack.length) ctm = stack.pop(); }
    else if (tok === 'cm' && ops.length >= 6) ctm = psdMul(ops.slice(-6).map(getal), ctm);
    else if (tok === 'BT') { tm = [1, 0, 0, 1, 0, 0]; tlm = tm.slice(); }
    else if (tok === 'Tf' && ops.length >= 2) { font = ops[ops.length - 2].slice(1); tf = getal(ops[ops.length - 1]); }
    else if (tok === 'TL' && ops.length >= 1) leading = getal(ops[ops.length - 1]);
    else if (tok === 'Tm' && ops.length >= 6) { tm = ops.slice(-6).map(getal); tlm = tm.slice(); }
    else if ((tok === 'Td' || tok === 'TD') && ops.length >= 2) {
      if (tok === 'TD') leading = -getal(ops[ops.length - 1]);
      tlm = psdMul([1, 0, 0, 1, getal(ops[ops.length - 2]), getal(ops[ops.length - 1])], tlm); tm = tlm.slice();
    } else if (tok === 'T*') { tlm = psdMul([1, 0, 0, 1, 0, -leading], tlm); tm = tlm.slice(); }
    else if (tok === 'Tj' || tok === 'TJ') toon();
    else if (tok === "'" || tok === '"') { tlm = psdMul([1, 0, 0, 1, 0, -leading], tlm); tm = tlm.slice(); toon(); }
    ops = [];
  }
  return uit;
}

// Losse stukjes tekst weer tot leesbare regels plakken. Een PDF knipt één woord in stukken zodra de
// letterafstand verspringt ("T" · ". Le" · "ytens"), dus zonder deze stap vind je geen enkele naam
// terug. Twee stukken horen bij elkaar als ze op dezelfde regel staan én het tweede begint waar het
// eerste ongeveer eindigt. Die breedte schatten we uit de lettergrootte (~0,55 em gemiddeld); bewust
// aan de krappe kant, want twee kolommen aan elkaar plakken is erger dan één woord in twee stukken.
function psdRegels(items) {
  const rij = items.slice().sort((a, b) => (Math.round(a.y * 2) - Math.round(b.y * 2)) || (a.x - b.x));
  const uit = [];
  for (const it of rij) {
    const v = uit[uit.length - 1];
    if (v && Math.abs(v.y - it.y) < 1.5 && it.x <= v.x + 0.55 * v.size * v.text.length + 0.35 * v.size) {
      v.text += it.text;
      continue;
    }
    uit.push({ x: it.x, y: it.y, text: it.text, size: it.size });
  }
  return uit;
}

const PSD_MAX_BYTES = 20 * 1024 * 1024;
// De pagina's van een PDF als regels tekst met hun plaats op het blad.
async function psdLeesPdf(arrayBuffer) {
  const u8 = new Uint8Array(arrayBuffer);
  if (u8.length > PSD_MAX_BYTES) throw new Error('Dat bestand is te groot om in te lezen.');
  const s = psdLatin1(u8);
  if (s.slice(0, 1024).indexOf('%PDF') < 0) throw new Error('Dit is geen PDF-bestand.');
  if (/\/Encrypt\b/.test(s)) throw new Error('Deze PDF is beveiligd met een wachtwoord.');
  const off = psdObjecten(s);
  // Objecten die in een ObjStm verpakt zitten kunnen we niet vinden met de scan hierboven. De
  // printfunctie van de browser maakt die niet, maar een PDF die door een ander programma opnieuw
  // opgeslagen is wel — en dan is het eerlijker om dat te zeggen dan om een halve opstelling te tonen.
  if (/\/ObjStm\b/.test(s) && !Object.keys(off).length) throw new Error('Deze PDF is op een manier opgeslagen die we niet kunnen lezen.');
  const paginas = [];
  const nrs = Object.keys(off).map(n => parseInt(n, 10)).sort((a, b) => a - b);
  for (const nr of nrs) {
    const body = psdBody(s, off, nr);
    if (!/\/Type\s*\/Page\b/.test(body) || /\/Type\s*\/Pages\b/.test(body)) continue;
    const mb = body.match(/\/MediaBox\s*\[\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/);
    const hoogte = mb ? parseFloat(mb[2]) : 842;
    // De fonts van deze pagina, elk met zijn ToUnicode-tabel.
    const fonts = {};
    const fm = body.match(/\/Font\s*<<([\s\S]*?)>>/);
    if (fm) {
      const re = /\/(\w+)\s+(\d+)\s+0\s+R/g;
      let f;
      while ((f = re.exec(fm[1]))) {
        const fo = psdBody(s, off, parseInt(f[2], 10));
        const tu = fo.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
        if (!tu) { fonts[f[1]] = null; continue; }
        const cm = await psdStream(s, u8, off, parseInt(tu[1], 10));
        fonts[f[1]] = cm ? psdCMap(psdLatin1(cm)) : null;
      }
    }
    // /Contents mag één object zijn of een reeks; beide komen voor.
    const cm = body.match(/\/Contents\s+(?:(\d+)\s+0\s+R|\[([^\]]*)\])/);
    let content = '';
    if (cm && cm[1]) { const b = await psdStream(s, u8, off, parseInt(cm[1], 10)); if (b) content = psdLatin1(b); }
    else if (cm && cm[2]) {
      const re = /(\d+)\s+0\s+R/g;
      let c;
      while ((c = re.exec(cm[2]))) { const b = await psdStream(s, u8, off, parseInt(c[1], 10)); if (b) content += psdLatin1(b) + '\n'; }
    }
    if (content) paginas.push({ regels: psdRegels(psdContentItems(content, fonts, hoogte)) });
  }
  if (!paginas.length) throw new Error('We vinden geen leesbare tekst in deze PDF.');
  return paginas;
}

// ---------------------------------------------------------------------------------------------
// 2. HET BLAD BEGRIJPEN
// ---------------------------------------------------------------------------------------------

// Weg met accenten, hoofdletters en dubbele spaties, zodat "Théo" en "Theo" hetzelfde zijn.
function psdNorm(s) {
  // De accenttekens worden als code-punten geschrapt (\u0300-\u036f) en niet als letterlijke
  // tekens in de broncode: die zijn onzichtbaar en overleven niet elke tekstbewerking.
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
// De voettekst van de afdruk (datum, adres van de pagina, paginanummer) hoort nergens bij.
function psdIsVoettekst(r) {
  return /prosoccerdata|^https?:|^\d+\s*\/\s*\d+$/i.test(r.text.trim()) || /^\d{2}-\d{2}-\d{4}/.test(r.text.trim());
}

// De selectietabel op de eerste pagina: een kop met "Naam" en "Geboortedatum", en daaronder één rij
// per speler met vinkjes in de kolommen C (kapitein), GK (doelman), P (speelt) en S (wisselspeler).
function psdLeesTabel(regels) {
  const kop = regels.find(r => /^Naam$/i.test(r.text.trim()));
  const dat = regels.find(r => /^Geboortedatum$/i.test(r.text.trim()) && Math.abs(r.y - (kop || {}).y) < 2);
  if (!kop || !dat) return null;
  const opKop = regels.filter(r => Math.abs(r.y - kop.y) < 2);
  const kolom = letter => { const r = opKop.find(x => x.text.trim() === letter && x.x > dat.x); return r ? r.x : null; };
  const kols = { C: kolom('C'), GK: kolom('GK'), P: kolom('P'), S: kolom('S') };
  const rechts = Math.max(dat.x, ...Object.values(kols).filter(v => v !== null));
  const rijen = [];
  for (const r of regels) {
    if (r.y <= kop.y + 2 || psdIsVoettekst(r)) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.text.trim())) continue;   // de geboortedatum merkt een spelersrij
    if (Math.abs(r.x - dat.x) > 40) continue;
    const opRij = regels.filter(x => Math.abs(x.y - r.y) < 3);
    const naam = opRij.find(x => Math.abs(x.x - kop.x) < 25 && x.x < dat.x - 20);
    if (!naam) continue;
    const kruis = k => kols[k] !== null && opRij.some(x => /^[xX✓v]$/.test(x.text.trim()) && Math.abs(x.x - kols[k]) < 10);
    rijen.push({ naam: naam.text.trim(), geboren: r.text.trim(), kapitein: kruis('C'), keeper: kruis('GK'), speelt: kruis('P'), wissel: kruis('S') });
  }
  return rijen.length ? { spelers: rijen, rechterrand: rechts } : null;
}

// Een opstellingsblok: de namen op het veld, gegroepeerd in rijen van achter naar voor.
// `namen` zijn de tekstregels die bij dit blok horen, zonder de wisselspelers eronder.
function psdBlokRijen(namen) {
  const gesorteerd = namen.slice().sort((a, b) => b.y - a.y);   // onderaan (eigen doel) eerst
  const rijen = [];
  for (const n of gesorteerd) {
    const laatste = rijen[rijen.length - 1];
    // De rijen van PSD liggen ruim uit elkaar (een halve shirthoogte is al meer dan dit), dus een
    // vaste marge volstaat om te bepalen of twee namen op dezelfde hoogte staan.
    if (laatste && Math.abs(laatste[0].y - n.y) < 12) laatste.push(n);
    else rijen.push([n]);
  }
  rijen.forEach(r => r.sort((a, b) => a.x - b.x));   // binnen een rij van links naar rechts
  return rijen;
}

// De roosterplekken van een formatie, in dezelfde vorm als psdBlokRijen: rijen van achter naar voor,
// elke rij van links naar rechts. Dit is waar de app haar spelers zet (formatieVoorstel), niet de
// ruwe formatiecoördinaten — precies daarom is het vergelijkbaar met wat PSD tekent.
function psdFormatieRijen(form, matchType) {
  const plekken = [...formatieVoorstel(form, matchType)].map(gridPlek).filter(Boolean);
  const perY = {};
  plekken.forEach(p => { (perY[p.y] = perY[p.y] || []).push(p); });
  return Object.keys(perY).map(Number).sort((a, b) => b - a).map(y => perY[y].slice().sort((a, b) => a.x - b.x));
}

// Welke roosterplekken horen bij deze getekende opstelling? Eerst proberen we de FORMATIE te
// herkennen: hoeveel spelers per rij, van achter naar voor. Dat patroon is voor elke opstelling van
// een wedstrijdvorm anders (dubbele ruit 1-3-1-2-1, 3-3-1 dus 1-3-3-1, 2-3-2 dus 1-2-1-2-2), dus
// herkennen we ze eenduidig — en dan landen de spelers exact op de plekken die de app zelf zou
// voorstellen, met de juiste positienummers erbij.
function psdPlekkenVoorRijen(rijen, matchType) {
  const patroon = rijen.map(r => r.length).join('-');
  const forms = FORMATIONS[matchType] || [];
  const treffers = [];
  forms.forEach((f, i) => {
    const fr = psdFormatieRijen(f, matchType);
    if (fr.map(r => r.length).join('-') === patroon) treffers.push({ index: i, form: f, rijen: fr });
  });
  if (treffers.length) {
    const t = treffers[0];
    const codes = [];
    rijen.forEach((rij, ri) => rij.forEach((n, ci) => codes.push({ naam: n, code: t.rijen[ri][ci].code })));
    return { codes, formatieIndex: t.index, formatieNaam: t.form.name, zeker: treffers.length === 1 };
  }
  // Geen enkele formatie past. Dan leggen we de rijen zelf op het rooster: de onderste rij met één
  // speler is de doelman, de rest wordt van achter naar voor over de rijen van het rooster verdeeld,
  // en binnen een rij zo symmetrisch mogelijk. Minder mooi dan een herkende formatie, maar het levert
  // een bruikbare opstelling op die je daarna gewoon kan verslepen.
  const RIJ_Y = [76, 61, 46, 31, 16];
  const KOL = [14, 32, 50, 68, 86];
  const kolommenVoor = n => (n >= 5 ? KOL : n === 4 ? [14, 32, 68, 86] : n === 3 ? [14, 50, 86] : n === 2 ? [14, 86] : [50]);
  const codes = [];
  let veldRijen = rijen;
  if (rijen.length && rijen[0].length === 1) {
    codes.push({ naam: rijen[0][0], code: 'GK' });
    veldRijen = rijen.slice(1);
  }
  veldRijen.forEach((rij, ri) => {
    // De rijen proportioneel over de vijf rijen van het rooster spreiden, zodat een opstelling met
    // drie lijnen niet allemaal achterin belandt.
    const y = RIJ_Y[veldRijen.length <= 1 ? 2 : Math.round(ri * (RIJ_Y.length - 1) / (veldRijen.length - 1))];
    const kols = kolommenVoor(rij.length);
    rij.forEach((n, ci) => {
      const plek = POS_GRID.find(p => p.y === y && p.x === kols[Math.min(ci, kols.length - 1)]);
      if (plek) codes.push({ naam: n, code: plek.code });
    });
  });
  return { codes, formatieIndex: null, formatieNaam: null, zeker: false };
}

// Het hele blad omzetten in: de selectie, en per moment een opstelling.
// `blokken` krijgt per moment de minuut (null voor de startopstelling), de namen per plek en de
// wisselspelers die eronder vermeld staan.
function psdLeesVoorbereiding(paginas, matchType) {
  const p1 = paginas[0].regels;
  const wedstrijd = {};
  const veld = (label) => {
    const r = p1.find(x => x.text.trim().toLowerCase() === label);
    if (!r) return '';
    const naast = p1.filter(x => Math.abs(x.y - r.y) < 2 && x.x > r.x + 10).sort((a, b) => a.x - b.x)[0];
    return naast ? naast.text.trim() : '';
  };
  wedstrijd.titel = veld('game');
  wedstrijd.datum = veld('date');
  wedstrijd.tijd = veld('time');

  const tabel = psdLeesTabel(p1);
  if (!tabel) throw new Error('We vinden op dit blad geen spelerslijst met geboortedata. Is dit wel een wedstrijdvoorbereiding uit ProSoccerData?');

  const blokken = [];
  paginas.forEach((pg, pi) => {
    // De koppen "Minuut 15'" bakenen de blokken op een pagina af. Ze staan naast elkaar, elk boven
    // hun eigen veldje. Een blok loopt van net links van zijn kop tot net links van de volgende:
    // het midden nemen zou fout zijn, want de veldjes zijn smaller dan de ruimte ertussen.
    const koppen = pg.regels.filter(r => /^Minuut\s*[\d]/i.test(r.text.trim()))
      .map(r => ({ x: r.x, y: r.y, minuut: parseFloat(r.text.replace(',', '.').match(/[\d.]+/)[0]) }))
      .sort((a, b) => a.x - b.x);
    const grenzen = koppen.map((k, i) => ({
      minuut: k.minuut, y: k.y,
      van: k.x - 15,
      tot: i + 1 < koppen.length ? koppen[i + 1].x - 15 : Infinity,
    }));
    // De startopstelling staat op de eerste pagina naast de spelerslijst en heeft geen kop. Ze is
    // te herkennen aan haar plaats: rechts van de tabel.
    if (pi === 0) grenzen.unshift({ minuut: null, y: 0, van: tabel.rechterrand + 20, tot: Infinity });

    for (const g of grenzen) {
      // Andere koppen kunnen in het bereik van dit blok vallen; die horen er niet bij.
      const inBlok = pg.regels.filter(r => r.x >= g.van && r.x < g.tot && r.y > g.y + 5 && !psdIsVoettekst(r)
        && !/^Minuut\s*[\d]/i.test(r.text.trim()));
      const wisselKop = inBlok.find(r => /^wisselspelers$/i.test(r.text.trim()));
      const namen = inBlok.filter(r => (!wisselKop || r.y < wisselKop.y - 3) && !/^wisselspelers$/i.test(r.text.trim())
        && r.text.trim().length > 1);
      const bank = wisselKop ? inBlok.filter(r => r.y > wisselKop.y - 3 && !/^wisselspelers$/i.test(r.text.trim())).map(r => r.text.trim()) : [];
      if (namen.length < 2) continue;
      const rijen = psdBlokRijen(namen);
      const plekken = psdPlekkenVoorRijen(rijen, matchType);
      blokken.push({
        minuut: g.minuut, pagina: pi + 1,
        veldNamen: plekken.codes.map(c => ({ tekst: c.naam.text.trim(), code: c.code })),
        bank, formatieIndex: plekken.formatieIndex, formatieNaam: plekken.formatieNaam, formatieZeker: plekken.zeker,
        patroon: rijen.map(r => r.length).join('-'),
      });
    }
  });
  // Op volgorde van de wedstrijd: de startopstelling eerst, daarna oplopend in de tijd.
  blokken.sort((a, b) => (a.minuut === null ? -1 : b.minuut === null ? 1 : a.minuut - b.minuut));
  if (!blokken.length) throw new Error('We vinden op dit blad geen opstelling.');
  return { wedstrijd, selectie: tabel.spelers, blokken };
}

// ---------------------------------------------------------------------------------------------
// 3. NAMEN KOPPELEN
// ---------------------------------------------------------------------------------------------

// PSD schrijft in de lijst "Achternaam Voornaam" en in het veld "V. Achternaam", terwijl de kern hier
// "Voornaam Achternaam" bewaart. Vergelijken doen we daarom op de VERZAMELING woorden: dan maakt de
// volgorde niet uit en botst "Van Den Broeke Jérôme" niet met "Jérôme Van Den Broeke".
// Twee namen zijn "bijna hetzelfde woord" als ze een flink stuk begin delen en ongeveer even lang
// zijn. Dat vangt de spellingverschillen die tussen PSD en de kern echt voorkomen — "Broeke" tegen
// "Broecke" — zonder twee verschillende spelers op elkaar te laten lijken: vier gelijke letters aan
// het begin is voor korte namen als "Loman" en "Lossy" al te veel gevraagd.
function psdBijnaZelfdeWoord(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2 || Math.min(a.length, b.length) < 4) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i >= 4;
}
function psdZelfdePersoon(a, b) {
  const wa = psdNorm(a).split(' ').filter(Boolean), wb = psdNorm(b).split(' ').filter(Boolean);
  if (!wa.length || !wb.length) return false;
  if (wa.slice().sort().join(' ') === wb.slice().sort().join(' ')) return true;
  // Eén van beide mag korter zijn (PSD schrijft "Reyes Henao Julio Cesar", de kern "Julio Reyes"),
  // zolang élk woord van de kortste een partner heeft in de langste én er minstens twee LETTERLIJK
  // gelijk zijn — anders zou één gedeelde achternaam, of twee vage gelijkenissen, al volstaan.
  const kort = wa.length <= wb.length ? wa : wb, lang = wa.length <= wb.length ? wb : wa;
  const over = lang.slice();
  let exact = 0;
  for (const w of kort) {
    let i = over.indexOf(w);
    if (i >= 0) exact++;
    else i = over.findIndex(x => psdBijnaZelfdeWoord(w, x));
    if (i < 0) return false;
    over.splice(i, 1);
  }
  return exact >= 2;
}
// De afgekorte veldnaam ("B. Van Speybr…") terugvinden in de spelerslijst van hetzelfde blad. De
// naam kan afgeknipt zijn, dus we zoeken op wat er staat als BEGIN van de achternaam, met de
// voorletter als tweede controle.
function psdVeldNaamNaarSpeler(tekst, spelers) {
  const t = tekst.replace(/[.…]+$/, '').trim();
  const m = t.match(/^([A-Za-zÀ-ÿ])\.\s*(.+)$/);
  const letter = m ? psdNorm(m[1]) : '';
  const rest = psdNorm(m ? m[2] : t);
  if (!rest) return -1;
  const kandidaten = [];
  spelers.forEach((s, i) => {
    const n = psdNorm(s.naam);
    if (n.indexOf(rest) < 0) return;
    if (letter && !n.split(' ').some(w => w[0] === letter)) return;
    kandidaten.push(i);
  });
  return kandidaten.length === 1 ? kandidaten[0] : -1;
}

// ---------------------------------------------------------------------------------------------
// 4. DE MOMENTEN OP DE BLOKKEN VAN DE WEDSTRIJD LEGGEN
// ---------------------------------------------------------------------------------------------

// PSD noemt een moment bij de minuut waarop het ingaat: 15' is het begin van het tweede kwart van
// vijftien, 7' is het wisselmoment halverwege het eerste. De app kent per blok precies die twee
// momenten (de start, en één moment halverwege), dus de minuut vertelt ons welk van de twee het is.
// De minuten zijn afgerond (PSD schrijft 7' en 22' voor 7,5 en 22,5), vandaar de ruime marge.
function psdMomentNaarDeel(minuut, duur, aantalDelen) {
  if (minuut === null) return { deel: 1, na: false };
  if (!duur) return null;
  const q = minuut / duur;
  const rond = Math.round(q);
  const isStart = Math.abs(q - rond) < 0.25;
  const deel = isStart ? rond + 1 : Math.floor(q) + 1;
  if (deel < 1 || deel > aantalDelen) return null;
  if (deel === 1 && isStart) return { deel: 1, na: false };
  return { deel, na: !isStart };
}
function psdMomentLabel(m, moment, blok) {
  if (blok.minuut === null) return 'Startopstelling';
  const naam = `${blok.minuut}'`;
  if (!moment) return `${naam} — valt buiten de wedstrijd`;
  const deelWoord = typeof pSingLow === 'function' ? pSingLow(m) : 'kwart';
  return moment.na ? `${naam} — tijdens ${deelWoord} ${moment.deel}` : `${naam} — begin van ${deelWoord} ${moment.deel}`;
}

// ---------------------------------------------------------------------------------------------
// 5. HET SCHERM
// ---------------------------------------------------------------------------------------------

function psdStart() {
  if (!match) return;
  if (!canManage()) { showToast('Enkel een beheerder kan een voorbereiding inlezen.', 'err'); return; }
  if (!rosterReady()) { showToast('Spelers zijn nog aan het laden — probeer het over een paar seconden opnieuw.', 'err'); return; }
  psdSt = { fase: 'kies', fout: '', bezig: false, matchId: match.id, bestand: '', lezing: null, koppel: {}, waarschuwingen: [] };
  go('importpsd');
}
function psdTerug() { const id = psdSt && psdSt.matchId; psdSt = null; go('prep', id); }
function psdAnderBestand() { if (!psdSt) return; psdSt.fase = 'kies'; psdSt.lezing = null; psdSt.fout = ''; render(); }
function psdRender() {
  const el = document.getElementById('psd-content');
  if (!el) { render(); return; }
  el.innerHTML = psdBodyHtml();
}

function renderImportPsd() {
  if (!psdSt || !match) {
    return `<div class="hdr"><button class="back" onclick="go('matches')">‹</button><h1>${icI(IC.upload)} Voorbereiding inlezen</h1></div>
      <div class="content"><div class="empty"><div class="ei">${IC.upload}</div>
        <p>Een voorbereiding inlezen kan enkel een ploegbeheerder, vanuit een geplande wedstrijd.</p></div>
        <button class="btn btn-pale" onclick="go('matches')">Naar de wedstrijden</button></div>`;
  }
  return `<div class="hdr"><button class="back" onclick="psdTerug()">‹</button><h1>${icI(IC.upload)} Voorbereiding inlezen</h1></div>
    <div class="content" id="psd-content">${psdBodyHtml()}</div>`;
}
function psdBodyHtml() { return psdSt.fase === 'na' ? psdVoorstelHtml() : psdKiesHtml(); }

// De weg naar dat PDF-bestand staat er stap voor stap bij (Tims tekst, 28-08-2026). Wie hier voor het
// eerst komt, weet niet dat de knop in PSD "Bekijk wedstrijdvoorbereiding" heet en dat je pas via het
// printvenster van de browser aan een PDF raakt — en zonder die weg is de hele functie onbruikbaar.
const PSD_STAPPEN = [
  'Ga naar <b>ProSoccerData</b> als afgevaardigde of trainer.',
  'Klik op een <b>geplande wedstrijd</b>.',
  'Kies rechtsbovenaan <b>"Bekijk wedstrijdvoorbereiding"</b>.',
  'Klik in het venster dat verschijnt op het <b>printicoon</b> en bewaar het document als <b>PDF</b>.',
  'Die PDF laad je hieronder op.',
];
function psdKiesHtml() {
  return `
    <div class="card" style="border-left:4px solid var(--org)">
      <div style="font-weight:800;font-size:15px;margin-bottom:4px">${icI(IC.warn)} Demo-functie</div>
      <p style="font-size:13px;color:var(--txt2);margin:0">Dit is een <b>demo-functie</b> en vatbaar voor fouten. Er wordt gewerkt aan de robuustheid. Kijk het voorstel dus na vóór je het overneemt — je krijgt alles eerst te zien.</p>
    </div>

    <div class="sec">Hoe werkt dit?</div>
    <div class="card">
      <p style="font-size:14px;color:var(--txt2);margin:0 0 10px">Werkt je trainer in ProSoccerData, dan staat op zijn wedstrijdvoorbereiding alles wat je hier anders met de hand intikt: de selectie, de opstelling en de wissels per moment.</p>
      <ol style="margin:0;padding-left:20px;font-size:14px;color:var(--txt2);line-height:1.8">
        ${PSD_STAPPEN.map(s => `<li>${s}</li>`).join('')}
      </ol>
    </div>

    <div class="sec">Bestand</div>
    <div class="card">
      <div class="fg" style="margin:0"><label>De PDF van de wedstrijdvoorbereiding</label>
        <input id="psd-file" type="file" accept=".pdf,application/pdf" onchange="psdBestand(this)"
               style="width:100%;padding:10px;border:2px dashed var(--bdr);border-radius:8px;font-size:14px;background:var(--card);color:var(--txt)"></div>
      ${psdSt.fout ? `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(220,60,60,.12);color:var(--rd);font-size:14px;font-weight:600">${icI(IC.warn)}${esc(psdSt.fout)}</div>` : ''}
      ${psdSt.bezig ? '<p style="font-size:13px;color:var(--txt2);margin:14px 0 0">Bezig met lezen…</p>' : ''}
      <p style="font-size:13px;color:var(--txt2);margin:14px 0 0">Er wordt nog niets bewaard: je krijgt eerst te zien wat we van het blad begrepen hebben, en pas daarna zet je het klaar. Het bestand blijft op je eigen toestel.</p>
    </div>`;
}

async function psdBestand(inp) {
  const f = inp && inp.files && inp.files[0];
  if (!f || !psdSt) return;
  psdSt.fout = ''; psdSt.bezig = true; psdSt.bestand = f.name; psdRender();
  try {
    const buf = await f.arrayBuffer();
    const paginas = await psdLeesPdf(buf);
    const m = match;
    const lezing = psdLeesVoorbereiding(paginas, MATCH_TYPES[m.matchType] ? m.matchType : '8v8');
    psdSt.lezing = lezing;
    psdKoppelAutomatisch();
    psdSt.fase = 'na';
  } catch (e) {
    psdSt.fout = (e && e.message) || 'Dit bestand konden we niet lezen.';
  }
  psdSt.bezig = false;
  render();
}

// Elke naam van het blad aan een speler van de kern hangen. Wat eenduidig is doen we zelf; de rest
// laat je hieronder met een keuzelijst aanwijzen.
function psdKoppelAutomatisch() {
  const team = kernById(match.teamId) || getTeamsV2().find(t => t.name === match.teamName);
  const roster = (team && team.players) || [];
  const gebruikt = new Set();
  psdSt.koppel = {};
  psdSt.lezing.selectie.forEach((s, i) => {
    // Enkel wie de trainer ook ECHT indeelt. Een naam die wel in de lijst staat maar zonder vinkje
    // in P of S, en die ook nergens op een veld verschijnt, is niet geselecteerd — die zou anders
    // stil op de bank belanden terwijl het scherm hem als "niet ingedeeld" toont. Hij blijft wel in
    // de lijst staan, zodat je hem er met de keuzelijst alsnog bij kan halen.
    if (!s.speelt && !s.wissel && !psdStaatOpEenVeld(i)) { psdSt.koppel[i] = ''; return; }
    const kand = roster.filter(r => !gebruikt.has(r.id) && psdZelfdePersoon(r.name, s.naam));
    if (kand.length === 1) { psdSt.koppel[i] = kand[0].id; gebruikt.add(kand[0].id); }
    else psdSt.koppel[i] = '';
  });
}
// Komt de speler op rij `i` van de lijst ergens in een opstelling voor?
function psdStaatOpEenVeld(i) {
  return (psdSt.lezing.blokken || []).some(b => b.veldNamen.some(v => psdVeldNaamNaarSpeler(v.tekst, psdSt.lezing.selectie) === i));
}
function psdZetKoppel(i, id) {
  if (!psdSt) return;
  // Dezelfde speler twee keer koppelen kan niet: die zou dan op twee plaatsen tegelijk staan.
  if (id) Object.keys(psdSt.koppel).forEach(k => { if (k !== String(i) && psdSt.koppel[k] === id) psdSt.koppel[k] = ''; });
  psdSt.koppel[i] = id;
  psdRender();
}

function psdVoorstelHtml() {
  const m = match;
  const lz = psdSt.lezing;
  const team = kernById(m.teamId) || getTeamsV2().find(t => t.name === m.teamName);
  const roster = (team && team.players) || [];
  const duur = m.quarterDuration || 0;
  const delen = plannedPartsCount(m);
  const veldGroot = (MATCH_TYPES[m.matchType] || {}).field || 8;

  // --- klopt dit blad bij deze wedstrijd? ---
  const controles = [];
  if (lz.wedstrijd.datum && m.date && lz.wedstrijd.datum !== m.date) controles.push(`Het blad is van <b>${esc(lz.wedstrijd.datum)}</b>, deze wedstrijd staat op <b>${esc(m.date)}</b>.`);
  if (lz.wedstrijd.titel && m.opponent && psdNorm(lz.wedstrijd.titel).indexOf(psdNorm(m.opponent).split(' ')[0] || 'x') < 0)
    controles.push(`Op het blad staat <b>${esc(lz.wedstrijd.titel)}</b>, deze wedstrijd is tegen <b>${esc(m.opponent)}</b>.`);

  // --- de selectie ---
  const gekoppeld = i => psdSt.koppel[i] || '';
  const start = lz.blokken.find(b => b.minuut === null);
  const startIdx = new Set();
  if (start) start.veldNamen.forEach(v => { const i = psdVeldNaamNaarSpeler(v.tekst, lz.selectie); if (i >= 0) startIdx.add(i); });
  const selHtml = lz.selectie.map((s, i) => {
    const id = gekoppeld(i);
    const rol = startIdx.has(i) ? 'basis' : (s.wissel || s.speelt ? 'bank' : '');
    const opties = roster.map(r => `<option value="${esc(r.id)}" ${id === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
    return `<div class="stat-row" style="align-items:center;gap:8px">
      <span style="flex:1;min-width:0">
        <span style="font-weight:600">${esc(s.naam)}</span>
        ${rol === 'basis' ? '<span style="font-size:11px;font-weight:700;color:var(--grn);margin-left:6px">BASIS</span>' : rol === 'bank' ? '<span style="font-size:11px;font-weight:700;color:var(--txt2);margin-left:6px">BANK</span>' : ''}
        ${s.keeper ? `<span style="font-size:11px;color:var(--txt2);margin-left:6px">${esc('doelman')}</span>` : ''}
        ${s.kapitein ? `<span style="font-size:11px;color:var(--org);margin-left:6px">kapitein</span>` : ''}
      </span>
      <select onchange="psdZetKoppel(${i}, this.value)" style="max-width:52%;font-size:13px;padding:5px 6px">
        <option value="">— niet meenemen —</option>${opties}
      </select>
    </div>`;
  }).join('');
  const aantalGekoppeld = lz.selectie.filter((s, i) => gekoppeld(i)).length;
  const nietGekoppeld = lz.selectie.filter((s, i) => !gekoppeld(i)).length;

  // --- de momenten ---
  const momentRijen = lz.blokken.map(b => {
    const mm = psdMomentNaarDeel(b.minuut, duur, delen);
    const namen = b.veldNamen.map(v => {
      const i = psdVeldNaamNaarSpeler(v.tekst, lz.selectie);
      const ok = i >= 0 && gekoppeld(i);
      const nm = i >= 0 ? lz.selectie[i].naam : v.tekst;
      return `<span style="white-space:nowrap;${ok ? '' : 'color:var(--rd);font-weight:700'}">${esc(matchGridLabel(m, v.code))}: ${esc(nm)}</span>`;
    }).join('<span style="color:var(--bdr)"> · </span>');
    return `<div style="padding:8px 0;border-bottom:1px solid var(--bdr)">
      <div style="font-weight:700;font-size:14px">${esc(psdMomentLabel(m, mm, b))}${mm ? '' : ` <span style="color:var(--rd)">${icI(IC.warn)}</span>`}</div>
      <div style="font-size:12px;color:var(--txt2);margin-top:3px;line-height:1.7">${namen}</div>
    </div>`;
  }).join('');

  // --- wat we niet konden ---
  const waar = [];
  const onbekend = new Set();
  lz.blokken.forEach(b => b.veldNamen.forEach(v => {
    const i = psdVeldNaamNaarSpeler(v.tekst, lz.selectie);
    if (i < 0 || !gekoppeld(i)) onbekend.add(v.tekst);
  }));
  if (onbekend.size) waar.push(`Deze namen van het veld vinden we niet terug in je kern: <b>${[...onbekend].map(esc).join(', ')}</b>. Koppel ze hierboven, anders blijft die plaats leeg.`);
  if (start && start.formatieIndex === null) waar.push(`De opstelling (${esc(start.patroon)}) komt niet overeen met een formatie van ${esc(m.matchType)}. We zetten de spelers zo goed mogelijk op het veld — kijk de opstelling daarna zeker na.`);
  else if (start && !start.formatieZeker) waar.push(`Meerdere formaties hebben dezelfde vorm; we nemen <b>${esc(start.formatieNaam)}</b>. Je kan die achteraf wijzigen.`);
  if (start && start.veldNamen.length !== veldGroot) waar.push(`Het blad zet <b>${start.veldNamen.length}</b> spelers op het veld, deze wedstrijd is <b>${esc(m.matchType)}</b> (${veldGroot} spelers).`);
  lz.blokken.forEach(b => { if (b.minuut !== null && !psdMomentNaarDeel(b.minuut, duur, delen)) waar.push(`Het moment <b>${b.minuut}'</b> valt buiten deze wedstrijd (${delen} × ${duur} min) en wordt overgeslagen.`); });
  if (!duur) waar.push('Deze wedstrijd heeft geen bloklengte, dus we kunnen de momenten niet plaatsen. Enkel de selectie en de startopstelling worden overgenomen.');

  const kanOvernemen = aantalGekoppeld > 0 && start && start.veldNamen.length >= Math.min(veldGroot, aantalGekoppeld);

  return `
    ${/* De herinnering hoort ook hier, want dít is het scherm waarop je beslist om over te nemen. */ ''}
    <div class="card" style="border-left:4px solid var(--org)">
      <p style="font-size:13px;color:var(--txt2);margin:0">${icI(IC.warn)} <b>Demo-functie.</b> Kijk hieronder na of alles klopt vóór je overneemt — vooral de koppeling van de namen en de opstelling per moment.</p>
    </div>
    ${controles.length ? `<div class="card" style="border-left:4px solid var(--org)">
      <div style="font-weight:700;margin-bottom:6px">${icI(IC.warn)} Hoort dit blad bij deze wedstrijd?</div>
      ${controles.map(c => `<p style="font-size:13px;color:var(--txt2);margin:0 0 4px">${c}</p>`).join('')}
    </div>` : ''}

    <div class="sec">Wedstrijd op het blad</div>
    <div class="card">
      <div class="stat-row"><span style="color:var(--txt2);min-width:110px">Wedstrijd</span><span style="font-weight:600">${esc(lz.wedstrijd.titel || '—')}</span></div>
      <div class="stat-row"><span style="color:var(--txt2);min-width:110px">Datum</span><span style="font-weight:600">${esc(lz.wedstrijd.datum || '—')}${lz.wedstrijd.tijd ? ' · ' + esc(lz.wedstrijd.tijd) : ''}</span></div>
      <div class="stat-row"><span style="color:var(--txt2);min-width:110px">Bestand</span><span style="font-weight:600">${esc(psdSt.bestand)}</span></div>
    </div>

    <div class="sec">Selectie (${aantalGekoppeld} van ${lz.selectie.length})</div>
    <div class="card">
      <p style="font-size:13px;color:var(--txt2);margin:0 0 8px">Links staat de naam van het blad, rechts wie dat is in jouw kern. Klopt er een niet, zet ze dan zelf goed.</p>
      ${selHtml}
      ${nietGekoppeld ? `<p style="font-size:13px;color:var(--rd);font-weight:600;margin:10px 0 0">${icI(IC.warn)} ${nietGekoppeld} naam${nietGekoppeld === 1 ? '' : 'en'} nog niet gekoppeld.</p>` : ''}
    </div>

    <div class="sec">Opstelling per moment</div>
    <div class="card">${momentRijen}</div>

    ${waar.length ? `<div class="card" style="border-left:4px solid var(--org)">
      <div style="font-weight:700;margin-bottom:6px">${icI(IC.warn)} Even nakijken</div>
      ${waar.map(w => `<p style="font-size:13px;color:var(--txt2);margin:0 0 6px">${w}</p>`).join('')}
    </div>` : ''}

    <button class="btn btn-green" ${kanOvernemen ? 'onclick="psdOvernemen()"' : 'disabled style="opacity:.5"'}>${icI(IC.check)} Overnemen</button>
    <button class="btn btn-pale" style="margin-top:8px" onclick="psdAnderBestand()">Ander bestand kiezen</button>
    <p style="font-size:12px;color:var(--txt2);margin-top:10px;text-align:center">Na het overnemen kan je alles gewoon aanpassen: de selectie, de opstelling en elk moment van het plan.</p>`;
}

// ---------------------------------------------------------------------------------------------
// 6. OVERNEMEN
// ---------------------------------------------------------------------------------------------
// In twee stappen, en in deze volgorde: eerst de selectie en de startopstelling langs de wizard
// (finishWizard schrijft m.players precies zoals de app dat overal verwacht), daarna het plan langs
// _schrijfPlanDraft — dezelfde weg als de planningskaart, dus de geplande wissels worden vanzelf
// afgeleid uit de opstellingen die het blad geeft.
async function psdOvernemen() {
  if (!psdSt || !match) return;
  const lz = psdSt.lezing;
  const m0 = match;
  const duur = m0.quarterDuration || 0;
  const delen = plannedPartsCount(m0);
  const start = lz.blokken.find(b => b.minuut === null);
  if (!start) { showToast('Geen startopstelling op het blad.', 'err'); return; }

  // Van een naam op het veld naar de rooster-id waaraan hij gekoppeld is.
  const rosterIdVan = tekst => {
    const i = psdVeldNaamNaarSpeler(tekst, lz.selectie);
    return i >= 0 ? (psdSt.koppel[i] || '') : '';
  };

  await editMatchWizard(m0);
  if (!wiz) { showToast('De ploeg van deze wedstrijd kon niet geladen worden.', 'err'); return; }

  // 1. Iedereen op 'none', daarna de selectie van het blad erop leggen.
  wiz.pool.forEach(p => { p.sel = 'none'; p.slot = null; });
  const poolOp = id => wiz.pool.find(p => p.srcId === id);
  lz.selectie.forEach((s, i) => {
    const rid = psdSt.koppel[i];
    if (!rid) return;
    const p = poolOp(rid);
    if (p) p.sel = 'bank';
  });
  // 2. De startopstelling: wie op het veld staat wordt 'basis' en krijgt zijn roosterplek.
  start.veldNamen.forEach(v => {
    const p = poolOp(rosterIdVan(v.tekst));
    if (p) { p.sel = 'basis'; p.slot = v.code; }
  });
  if (start.formatieIndex !== null) wiz.formationIndex = start.formatieIndex;
  // 3. De kapitein, als het blad er een aanduidt.
  const kap = lz.selectie.findIndex(s => s.kapitein);
  if (kap >= 0 && psdSt.koppel[kap]) { const p = poolOp(psdSt.koppel[kap]); if (p) wiz.captainPid = p.pid; }

  const opVeld = wiz.pool.filter(p => p.sel === 'basis' && p.slot).length;
  if (!opVeld) { wiz = null; showToast('Geen enkele speler van de opstelling kon gekoppeld worden.', 'err'); return; }

  // formatieBevestigd = true: het blad IS de opstelling, dus een venster dat vraagt of we het echt
  // zo bedoelen zou hier alleen maar in de weg staan.
  const m = await finishWizard(false, false, true);
  if (!m) return;   // finishWizard weigerde en heeft zelf al gemeld waarom

  // 4. De volgende momenten als plan. De speler-id's bestaan nu pas, dus we zoeken ze hier op.
  const spelerOp = rid => (m.players || []).find(p => p.rosterId === rid);
  const naarEntries = blok => blok.veldNamen.map(v => {
    const sp = spelerOp(rosterIdVan(v.tekst));
    const plek = gridPlek(v.code);
    if (!sp || !plek) return null;
    return { id: sp.id, x: plek.x, y: plek.y, line: plek.line, posNum: matchGridNummer(m, v.code) || '', posCodeVeld: v.code };
  }).filter(Boolean);

  let aantal = 0, overgeslagen = 0;
  _planLineupDraft = {};
  _planNaDraft = {};
  for (const b of lz.blokken) {
    if (b.minuut === null) continue;
    const mm = psdMomentNaarDeel(b.minuut, duur, delen);
    if (!mm) { overgeslagen++; continue; }
    const entries = naarEntries(b);
    if (!entries.length) { overgeslagen++; continue; }
    if (mm.na) _planNaDraft[mm.deel] = entries; else _planLineupDraft[mm.deel] = entries;
    aantal++;
  }
  if (aantal) {
    await _schrijfPlanDraft();
  } else {
    _planLineupDraft = null; _planNaDraft = null;
  }

  psdSt = null;
  await go('prep', m.id);
  showToast(`Voorbereiding ingelezen: ${opVeld} in de basis${aantal ? `, ${aantal} moment${aantal === 1 ? '' : 'en'} in het plan` : ''}${overgeslagen ? ` (${overgeslagen} overgeslagen)` : ''}.`);
}
