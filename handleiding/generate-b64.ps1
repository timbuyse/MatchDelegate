# Draai via: .\handleiding\generate-b64.ps1 vanuit de projectmap
# Genereert handleiding-screenshots.js met alle screenshots als base64.

$screenshotsDir = Join-Path $PSScriptRoot "screenshots"
$outputFile = Join-Path $PSScriptRoot "..\handleiding-screenshots.js"

$files = Get-ChildItem $screenshotsDir -Filter "*.png" | Sort-Object Name

$obj = @{}
foreach ($f in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $b64 = [Convert]::ToBase64String($bytes)
    $key = $f.BaseName
    $obj[$key] = "data:image/png;base64,$b64"
    Write-Host "  OK $($f.Name) ($([Math]::Round($bytes.Length / 1024)) KB)"
}

$json = $obj | ConvertTo-Json -Compress

$content = "// Gegenereerd door handleiding/generate-b64.ps1 - niet handmatig bewerken`nvar HANDLEIDING_SCREENSHOTS = $json;`n"
[System.IO.File]::WriteAllText($outputFile, $content, [System.Text.Encoding]::UTF8)

Write-Host "`nKlaar - $($files.Count) screenshots geschreven naar handleiding-screenshots.js"
