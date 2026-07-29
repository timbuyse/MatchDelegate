# Draai via: .\handleiding\generate-b64.ps1 vanuit de projectmap
# Genereert handleiding-screenshots.js met alle screenshots als base64, voor de
# PDF-download van de handleiding (exportHandleidingPDF).
#
# De screenshots worden hierbij naar JPEG geconverteerd. De PNG's in screenshots/ blijven
# ongewijzigd en worden rechtstreeks in de app getoond; enkel de ingebedde kopie wordt
# gecomprimeerd. Reden: de schermbeelden bevatten een fotografische header die in PNG erg
# groot uitvalt (189 KB tegenover 41 KB in JPEG), en het base64-bestand zit volledig in de
# PDF. Zo blijft die download rond 700 KB in plaats van meer dan 3 MB.

Add-Type -AssemblyName System.Drawing

$screenshotsDir = Join-Path $PSScriptRoot "screenshots"
$outputFile = Join-Path $PSScriptRoot "..\handleiding-screenshots.js"
$kwaliteit = 82

$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$files = Get-ChildItem $screenshotsDir -Filter "*.png" | Sort-Object Name

$obj = @{}
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$kwaliteit)
    $ms = New-Object System.IO.MemoryStream
    $img.Save($ms, $jpegEncoder, $params)
    $bytes = $ms.ToArray()
    $ms.Dispose(); $params.Dispose(); $img.Dispose()

    $b64 = [Convert]::ToBase64String($bytes)
    $obj[$f.BaseName] = "data:image/jpeg;base64,$b64"
    Write-Host "  OK $($f.Name) ($([Math]::Round($bytes.Length / 1024)) KB als JPEG)"
}

$json = $obj | ConvertTo-Json -Compress

$content = "// Gegenereerd door handleiding/generate-b64.ps1 - niet handmatig bewerken`nvar HANDLEIDING_SCREENSHOTS = $json;`n"
[System.IO.File]::WriteAllText($outputFile, $content, [System.Text.Encoding]::UTF8)

Write-Host "`nKlaar - $($files.Count) screenshots geschreven naar handleiding-screenshots.js"
