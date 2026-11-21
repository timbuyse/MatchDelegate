# Tests voor hockey en minivoetbal

Browsertests voor de sporten naast voetbal (PR #19). Er is geen testframework in deze repo; deze map is een losse set controles
die je zelf start. Elke controle zegt `OK` of `FOUT`, je hoeft geen uitkomsten na te kijken.

## Veilig?

Ja. De tests stubben alles wat opslaat (`dbSave`, `render`, ...), gebruiken een nagemaakte Firebase-database in het geheugen
(`T.fakeDb()`) en een nagemaakte `fetch` voor hockey.be. Er wordt niets naar productie geschreven, ook niet als je ingelogd bent.
Laad na een test in de Console wel de pagina opnieuw (F5): sommige tests zetten globals zoals `activeSport` om.

## Optie 1: automatisch met Node en Playwright

```
cd <een-lege-map-buiten-de-repo>
npm i playwright && npx playwright install chromium
# start de app, bv. met je bestaande serve.ps1 of: python -m http.server 3055   (in de repo-map)
node <pad-naar-repo>/tests-sporten/run.js http://localhost:3055/index.html
node <pad-naar-repo>/tests-sporten/run.js http://localhost:3055/index.html hockey   # enkel tests met "hockey" in de naam
```

Elk testbestand krijgt een verse pagina, zonder service worker. Exitcode 1 als iets faalt.

## Optie 2: met de hand in de Console

Open de app, F12, tab Console. Plak achter elkaar: `fixture-hockey.js`, `00-helpers.js`, een testbestand, en daarna
`await T.run()`. Dat zijn losse plakbeurten; laad de pagina opnieuw tussen twee testbestanden.

## Wat testen ze?

| Bestand | Dekt |
|---|---|
| `01-sporten-en-lijsten.js` | formaten, duren, standaarden per sport; een minivoetbalploeg is altijd 5v5; `createTeam` per clubsport |
| `02-hockey-import.js` | hockey.be-rijen lezen, dubbels, eigen club, jeugdbundels, per maand opvragen, volledige import en opnieuw importeren |
| `03-minivoetbal-regels.js` | cornerteller, cornerbal (gescoord/gemist), protestcorner, cornerbalreeks, woorden |
| `04-hockey-kaarten.js` | groen/geel/rood, schorsing met aftelling, terugkeer, wisselblokkade, tegenstander, herberekening uit events |
| `05-velden.js` | veldvariant per sport (voetbal, minivoetbal, hockey buiten, hockey zaal) |
| `06-voetbalbond-verborgen.js` | bondskoppeling uit bij hockey, aan bij voetbal en minivoetbal, voorgesteld formaat |
| `fixture-hockey.js` | tien echte rijen uit het hockey.be-programma, met opzet lastige gevallen |

## Wat ze NIET dekken

Echte Firebase (rechten, schrijven, sync), echte live wedstrijden, de pdf als echt bestand en de echte hockey.be-server.
Zie `TODO-sporten.md`.

## Een test toevoegen

`T.test('naam', async () => { T.is(werkelijk, verwacht, 'uitleg'); T.check(voorwaarde, 'uitleg'); })` in een nieuw bestand
`NN-naam.js`; `run.js` pakt het vanzelf op.
