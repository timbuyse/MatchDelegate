# ============================================================================
#  EEN TWEEDE WERKMAP OM PARALLEL AAN DE APP TE WERKEN
# ============================================================================
#  Waarom dit bestaat: twee Claude-sessies in DEZELFDE map delen letterlijk
#  dezelfde bestanden. Bewerken ze allebei core.js, dan overschrijft de laatste
#  de eerste — zonder waarschuwing. Op 28-08-2026 ging dat maar net goed.
#
#  Een "worktree" is dezelfde repo met een tweede map ernaast, op een eigen
#  tak. De geschiedenis is gedeeld, de bestanden niet. Sessie 1 werkt hier,
#  sessie 2 daar, en ze kunnen elkaar niet meer raken.
#
#  GEBRUIK
#    .\worktree.ps1 statistieken      een tweede werkmap maken
#    .\worktree.ps1 -Lijst            tonen wat er openstaat
#    .\worktree.ps1 -Klaar statistieken   het werk binnenhalen en opruimen
#    .\worktree.ps1 -Weg statistieken     weggooien zonder binnen te halen
# ============================================================================

[CmdletBinding(DefaultParameterSetName = 'Maak')]
param(
    [Parameter(ParameterSetName = 'Maak', Position = 0, Mandatory = $true)]
    [string]$Naam,
    [Parameter(ParameterSetName = 'Lijst')] [switch]$Lijst,
    [Parameter(ParameterSetName = 'Klaar')] [string]$Klaar,
    [Parameter(ParameterSetName = 'Weg')]   [string]$Weg
)

$ErrorActionPreference = 'Stop'
$hoofd = $PSScriptRoot
Set-Location $hoofd

# GIT SCHRIJFT GEWONE VOORTGANG NAAR HET FOUTKANAAL ("Preparing worktree...", "Updating files...").
# Met $ErrorActionPreference = 'Stop' maakt Windows PowerShell daar een terminating error van, en dan
# stopt dit script middenin: de tweede map staat er dan wél, maar zonder eigen poort en zonder de
# skip-worktree op launch.json — precies de twee dingen die botsingen moeten voorkomen. Twee keer
# gebeurd op 29-08-2026. Deze helper vouwt het foutkanaal bij de gewone uitvoer en laat het oordeel
# volledig aan de afloopcode over, wat het enige betrouwbare signaal van git is.
# Let op: enkel `2>&1` volstaat NIET. Windows PowerShell maakt van elke regel op het foutkanaal een
# ErrorRecord, en met 'Stop' is die op zichzelf al fataal — ook al is de tekst gewone voortgang. De
# voorkeur moet dus echt even op 'Continue' staan tijdens de aanroep. Hij is hier lokaal aan de
# functie, dus buiten deze regels blijft 'Stop' onverkort gelden.
function Git-Doe {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Argumenten)
    $ErrorActionPreference = 'Continue'
    & git @Argumenten 2>&1 | ForEach-Object { Write-Host "  $_" }
    return $LASTEXITCODE
}

function Vrije-Poort {
    # De hoofdmap draait op 3000; een tweede werkmap krijgt de eerste vrije daarboven.
    $bezet = @((Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue).LocalPort)
    # OOK DE POORTEN DIE ANDERE WERKMAPPEN AL GECLAIMD HEBBEN (29-08-2026). Hierboven staan enkel de
    # poorten waarop op DIT moment iets luistert. Maak je twee werkmappen na elkaar zonder er een
    # server in te starten, dan kregen ze allebei 3001 — en zodra je ze later samen opstart, vechten
    # ze erom. Wat een map claimt, staat in haar eigen launch.json.
    foreach ($pad in (git worktree list --porcelain 2>$null | Where-Object { $_ -like 'worktree *' } | ForEach-Object { $_.Substring(9) })) {
        $cfg = Join-Path $pad '.claude\launch.json'
        if (-not (Test-Path $cfg)) { continue }
        try { $bezet += (Get-Content $cfg -Raw | ConvertFrom-Json).configurations.port } catch {}
    }
    foreach ($p in 3001..3020) { if ($bezet -notcontains $p) { return $p } }
    throw "Geen vrije poort gevonden tussen 3001 en 3020."
}

function Toon-Lijst {
    Write-Host ""
    Write-Host "Werkmappen van deze repo:" -ForegroundColor Cyan
    git worktree list | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
}

# ---------------------------------------------------------------- lijst -----
if ($Lijst) { Toon-Lijst; return }

# ------------------------------------------------- klaar / weg (opruimen) ---
if ($Klaar -or $Weg) {
    $n = if ($Klaar) { $Klaar } else { $Weg }
    $map = Join-Path (Split-Path $hoofd -Parent) "MatchDelegate-$n"
    if (-not (Test-Path $map)) { throw "Er is geen werkmap '$map'." }

    # Niets weggooien waar nog niet-vastgelegd werk in staat.
    Push-Location $map
    $vuil = git status --porcelain
    Pop-Location
    if ($vuil) {
        Write-Host ""
        Write-Host "In die werkmap staat nog werk dat niet vastgelegd is:" -ForegroundColor Yellow
        $vuil | ForEach-Object { Write-Host "  $_" }
        Write-Host ""
        Write-Host "Leg dat eerst vast (of gooi het weg) en probeer het dan opnieuw." -ForegroundColor Yellow
        return
    }

    if ($Klaar) {
        # Binnenhalen betekent 'git checkout master' HIER. Ligt er in deze map nog werk, dan zou dat
        # verstoord worden of de wissel tegenhouden — dus eerst kijken, niet zomaar doen.
        $hier = git status --porcelain --untracked-files=no
        if ($hier) {
            Write-Host ""
            Write-Host "In DEZE map staat nog werk dat niet vastgelegd is:" -ForegroundColor Yellow
            $hier | ForEach-Object { Write-Host "  $_" }
            Write-Host ""
            Write-Host "Leg dat eerst vast. Daarna haalt dit commando '$n' binnen." -ForegroundColor Yellow
            Write-Host "(De werkmap blijft ondertussen gewoon staan.)" -ForegroundColor Yellow
            return
        }
        $tak = (git rev-parse --abbrev-ref HEAD).Trim()
        if ($tak -ne 'master') {
            Write-Host ""
            Write-Host "Deze map staat op tak '$tak' en niet op master. Zet ze eerst op master." -ForegroundColor Yellow
            Write-Host ""
            return
        }
        Write-Host "Werk van tak '$n' binnenhalen in master..." -ForegroundColor Cyan
        $code = Git-Doe merge --no-ff $n -m "Werk van '$n' samenvoegen"
        if ($code -ne 0) {
            Write-Host ""
            Write-Host "Samenvoegen liep vast. De werkmap blijft staan; los het conflict op en" -ForegroundColor Yellow
            Write-Host "voer dit daarna opnieuw uit." -ForegroundColor Yellow
            return
        }
    }

    # WEIGERT WINDOWS DE MAP TE WISSEN, DAN IS DE SESSIE DIE ERIN WERKTE NOG OPEN (29-08-2026). Git
    # heeft de worktree dan al uitgeschreven, dus de tak mag weg en er kan niets meer misgaan; enkel
    # de lege map blijft staan. Dat melden is beter dan het script laten struikelen.
    $wegCode = Git-Doe worktree remove $map --force
    git branch -D $n 2>&1 | Out-Null
    Write-Host ""
    if ($wegCode -ne 0 -and (Test-Path $map)) {
        Write-Host "De map '$map' kon niet gewist worden - ze wordt nog gebruikt." -ForegroundColor Yellow
        Write-Host "Sluit de sessie die daarin werkte en wis ze daarna met de hand." -ForegroundColor Yellow
        Write-Host "Git en de tak zijn wel al opgeruimd." -ForegroundColor Yellow
        Write-Host ""
    }
    Write-Host "Opgeruimd." -ForegroundColor Green
    if ($Klaar) { Write-Host "Het werk staat nu in master. Nog niet gepusht." -ForegroundColor Green }
    Toon-Lijst
    return
}

# ------------------------------------------------------------ aanmaken -----
if ($Naam -notmatch '^[a-z0-9][a-z0-9-]*$') {
    throw "Kies een korte naam met kleine letters, cijfers en streepjes (bv. 'statistieken')."
}
$map = Join-Path (Split-Path $hoofd -Parent) "MatchDelegate-$Naam"
if (Test-Path $map) { throw "De map '$map' bestaat al." }

# Een nieuwe werkmap krijgt de bestanden van de laatste COMMIT, niet die van je
# huidige map. Staat de -Port van serve.ps1 nog niet vastgelegd, dan start de
# tweede server alsnog op 3000 en botst hij met de eerste. Dat kostte bij het
# uitproberen een kwartier zoeken, vandaar deze controle.
# De regels aaneenplakken tot ÉÉN tekst: `git show` geeft een array terug, en -notmatch op een array
# filtert die (het geeft de niet-passende regels terug, wat altijd "waar" lijkt) in plaats van ja/nee
# te antwoorden. Daardoor blokkeerde deze controle ook nadat serve.ps1 wél vastgelegd was.
$vastgelegd = (git show "HEAD:serve.ps1" 2>$null) -join "`n"
if ($vastgelegd -notmatch '\[int\]\$Port') {
    Write-Host ""
    Write-Host "STOP: de aangepaste serve.ps1 is nog niet vastgelegd in git." -ForegroundColor Red
    Write-Host "Zonder die versie draait de tweede werkmap ook op poort 3000." -ForegroundColor Red
    Write-Host "Commit eerst serve.ps1 en worktree.ps1, en probeer het dan opnieuw." -ForegroundColor Red
    Write-Host ""
    return
}

$poort = Vrije-Poort
Write-Host "Tweede werkmap aanmaken op poort $poort..." -ForegroundColor Cyan
if ((Git-Doe worktree add $map -b $Naam) -ne 0) { throw "Aanmaken mislukt." }

# De preview-tool leest .claude/launch.json om te weten hoe de app start en op
# welke poort ze luistert. In deze tweede map moet dat een ANDERE poort zijn,
# anders vechten de twee servers om 3000. De poort gaat als gewoon argument mee
# aan serve.ps1 (die kent -Port): geen omgevingsvariabele en geen cmd.exe met
# '&&', want dat overleeft het doorgeven van losse argumenten niet.
$cfg = @{
    version = '0.0.1'
    configurations = @(@{
        name = "match-delegate-$Naam"
        runtimeExecutable = 'powershell.exe'
        runtimeArgs = @('-ExecutionPolicy', 'Bypass', '-File', 'serve.ps1', '-Port', "$poort")
        port = $poort
        autoPort = $false
    })
}
$cfgPad = Join-Path $map '.claude\launch.json'
New-Item -ItemType Directory -Force (Split-Path $cfgPad) | Out-Null
[System.IO.File]::WriteAllText($cfgPad, ($cfg | ConvertTo-Json -Depth 6), (New-Object System.Text.UTF8Encoding $false))

# launch.json staat in git. Zonder dit zou de gewijzigde poort in deze werkmap
# als een wijziging tellen en per ongeluk mee gecommit kunnen worden.
Push-Location $map
git update-index --skip-worktree .claude/launch.json
Pop-Location

Write-Host ""
Write-Host "Klaar." -ForegroundColor Green
Write-Host ""
Write-Host "  Map    : $map"
Write-Host "  Tak    : $Naam"
Write-Host "  Poort  : $poort   (de hoofdmap houdt 3000)"
Write-Host ""
Write-Host "Open daar een nieuwe Claude-sessie. De twee sessies zien elkaars" -ForegroundColor Cyan
Write-Host "bestanden niet meer, dus ze kunnen elkaar niet overschrijven." -ForegroundColor Cyan
Write-Host ""
Write-Host "LET OP: de app bewaart haar gegevens per adres. Op localhost:$poort ben" -ForegroundColor Yellow
Write-Host "je niet aangemeld en staat je ploeg niet klaar - dat is een andere" -ForegroundColor Yellow
Write-Host "'installatie' voor de browser. Meld daar opnieuw aan om te testen." -ForegroundColor Yellow
Write-Host ""
Write-Host "Als het werk af is:  .\worktree.ps1 -Klaar $Naam" -ForegroundColor Cyan
Write-Host ""
Toon-Lijst
