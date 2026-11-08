# Publish-readiness checks for a rendered video. Prints PASS / WARN / FAIL lines and a summary.
# Usage: .\scripts\qa.ps1 -File output\renders\x.mp4 [-Props briefs\x.props.json] [-ExpectSeconds 27] [-Comp ProductPromo]
#   -Props   : scans the props JSON for placeholder text and missing public/ assets
#   -Comp    : checks whether project sources changed after the render (stale render)
# Always open the contact sheet it writes next to the video (<name>.contact.png) and look at it.
param(
  [Parameter(Mandatory = $true)][string]$File,
  [string]$Props = "",
  [double]$ExpectSeconds = 0,
  [string]$Comp = ""
)

$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot -Parent
$video = (Resolve-Path $File).Path
$fails = 0; $warns = 0
function Pass($m) { Write-Host "PASS  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "WARN  $m" -ForegroundColor Yellow; $script:warns++ }
function Fail($m) { Write-Host "FAIL  $m" -ForegroundColor Red; $script:fails++ }

Write-Host "== QA: $video" -ForegroundColor Cyan

# 1. Container / streams
$probeJson = & ffprobe -v error -show_entries "format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels" -of json $video | Out-String
$probe = $probeJson | ConvertFrom-Json
$v = $probe.streams | Where-Object { $_.codec_type -eq "video" } | Select-Object -First 1
$a = $probe.streams | Where-Object { $_.codec_type -eq "audio" } | Select-Object -First 1
$duration = [double]$probe.format.duration
$mbps = [math]::Round(([double]$probe.format.bit_rate) / 1000000, 2)

if ($null -eq $v) { Fail "no video stream" } else {
  Pass ("video {0} {1}x{2} @ {3} fps, {4}, {5} Mbps" -f $v.codec_name, $v.width, $v.height, $v.r_frame_rate, $v.pix_fmt, $mbps)
  if ($v.codec_name -ne "h264") { Warn "codec is $($v.codec_name); platforms prefer h264" }
  if ($v.r_frame_rate -ne "30/1") { Warn "fps is $($v.r_frame_rate), project standard is 30" }
  if ($mbps -lt 3) { Warn "bitrate $mbps Mbps is low for 1080p (YouTube suggests 8)" }
}
if ($null -eq $a) { Warn "NO AUDIO TRACK (silent video). Intentional for muted-autoplay ads only." } else {
  Pass ("audio {0} {1} Hz {2}ch" -f $a.codec_name, $a.sample_rate, $a.channels)
}
Write-Host ("      duration {0:N2} s, size {1:N1} MB" -f $duration, ([double]$probe.format.size / 1MB))
if ($ExpectSeconds -gt 0) {
  if ([math]::Abs($duration - $ExpectSeconds) -gt 0.2) { Fail "duration $duration s != expected $ExpectSeconds s" } else { Pass "duration matches expected $ExpectSeconds s" }
}
if ($duration -gt 60) { Warn "longer than 60 s: too long for Reels/TikTok ads, trim for social" }

# 2. Decode integrity
$decode = & ffmpeg -v error -xerror -i $video -f null - 2>&1 | Out-String
if ($decode.Trim().Length -gt 0) { Fail "decode errors:`n$decode" } else { Pass "decodes with zero errors" }

# 3. Black / frozen segments
$black = & ffmpeg -i $video -vf "blackdetect=d=0.3:pix_th=0.10" -an -f null - 2>&1 | Select-String "black_start"
if ($black) { Warn "black segments: $($black -join '; ')" } else { Pass "no black segments >= 0.3 s" }
$frozen = & ffmpeg -i $video -vf "freezedetect=n=-60dB:d=1.5" -an -f null - 2>&1 | Select-String "freeze_start"
if ($frozen) { Warn "frozen segments >= 1.5 s: $($frozen -join '; ')" } else { Pass "no frozen segments >= 1.5 s" }

# 4. Luma spikes (flash frames) via per-frame average luminance
$yavgLines = & ffmpeg -v info -i $video -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG" -an -f null - 2>&1 | Out-String -Stream
$yavg = @($yavgLines | Where-Object { "$_" -match "YAVG=([0-9.]+)" } | ForEach-Object { [double]$Matches[1] })
if ($yavg.Count -eq 0) { Warn "flash-frame check skipped (could not read signalstats output)" }
if ($yavg.Count -gt 0) {
  $sorted = $yavg | Sort-Object
  $median = $sorted[[int]($sorted.Count / 2)]
  $spikes = @()
  for ($i = 0; $i -lt $yavg.Count; $i++) { if ($yavg[$i] -gt ($median * 2.5) -and $yavg[$i] -gt 120) { $spikes += $i } }
  if ($spikes.Count -gt 0) { Warn ("luma spikes (flash frames) at frames: {0} (median YAVG {1:N0})" -f (($spikes | Select-Object -First 12) -join ","), $median) }
  else { Pass ("no flash frames (median YAVG {0:N0}, max {1:N0})" -f $median, $sorted[-1]) }
}

# 5. Placeholder content + asset paths in props
if ($Props) {
  $propsPath = (Resolve-Path $Props).Path
  $raw = Get-Content $propsPath -Raw
  if ($raw -match "(?i)placeholder|lorem|TODO|replace with") { Fail "props contain placeholder text: $propsPath" } else { Pass "no placeholder text in props" }
  $p = $raw | ConvertFrom-Json
  foreach ($key in @("screenshotSrc", "logoSrc", "musicSrc")) {
    $val = $p.$key
    if ($null -eq $val) { continue }
    if ([string]::IsNullOrWhiteSpace($val)) { Warn "$key is empty (placeholder art / no music will show)"; continue }
    if ($val -match "^https?://") { continue }
    $asset = Join-Path $root ("remotion\public\" + $val)
    if (Test-Path $asset) { Pass "$key -> $val exists" } else { Fail "$key -> remotion/public/$val NOT FOUND" }
  }
} else {
  Write-Host "      (pass -Props to scan for placeholder text and missing assets)"
}

# 6. Stale render check
if ($Comp) {
  $renderTime = (Get-Item $video).LastWriteTime
  $newer = Get-ChildItem (Join-Path $root "remotion\src") -Recurse -File | Where-Object { $_.LastWriteTime -gt $renderTime }
  if ($newer) { Warn ("render is STALE: {0} source file(s) changed after it, e.g. {1}" -f $newer.Count, $newer[0].Name) } else { Pass "render is newer than all sources" }
}

# 7. Contact sheet for eyeballing (1 frame per second, 8 columns)
$sheet = [IO.Path]::ChangeExtension($video, $null).TrimEnd('.') + ".contact.png"
$rows = [math]::Max(1, [math]::Ceiling($duration / 8))
& ffmpeg -v error -y -i $video -vf "fps=1,scale=320:-1,tile=8x${rows}:padding=4:margin=4" -frames:v 1 $sheet 2>&1 | Out-Null
if (Test-Path $sheet) { Pass "contact sheet -> $sheet  (OPEN IT: check safe areas, typos, placeholder art, cut points)" } else { Warn "contact sheet failed" }

Write-Host ""
if ($fails -gt 0) { Write-Host "RESULT: NOT READY ($fails fail, $warns warn)" -ForegroundColor Red; exit 1 }
elseif ($warns -gt 0) { Write-Host "RESULT: REVIEW ($warns warn) - read warnings and the contact sheet" -ForegroundColor Yellow; exit 0 }
else { Write-Host "RESULT: READY (automated checks) - still watch it once end to end" -ForegroundColor Green; exit 0 }
