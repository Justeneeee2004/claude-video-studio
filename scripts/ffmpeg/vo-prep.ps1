# Prep one VO take (brief rallyo-prelaunch section 6): trim leading + trailing silence (-50 dB),
# loudnorm to -16 LUFS / -1.5 dBTP / LRA 7, write a 48 kHz 16-bit PCM WAV. Never time-stretches.
# Usage: .\scripts\ffmpeg\vo-prep.ps1 -In assets\audio\vo\rallyo\vo-01-take2.wav -Out remotion\public\rallyo\vo\vo-01.wav
# Prints before/after duration and the output's measured loudness (ebur128 integrated + true peak).
param(
  [Parameter(Mandatory = $true)][string]$In,
  [string]$Out = ""
)
if (-not (Test-Path -LiteralPath $In)) { throw "Input not found: $In" }
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, $null).TrimEnd('.') + "-prep.wav" }
$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

$af = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=7"
ffmpeg -hide_banner -loglevel warning -y -i $In -af $af -ar 48000 -c:a pcm_s16le $Out
if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed ($LASTEXITCODE)" }

$inv = [Globalization.CultureInfo]::InvariantCulture
$dIn = [double]::Parse((ffprobe -v error -show_entries format=duration -of csv=p=0 $In), $inv)
$dOut = [double]::Parse((ffprobe -v error -show_entries format=duration -of csv=p=0 $Out), $inv)

# ebur128 summary is printed on stderr; stringify each line (works in Windows PowerShell 5.1 and 7).
$log = (& ffmpeg -hide_banner -nostats -i $Out -af "ebur128=peak=true" -f null - 2>&1 | ForEach-Object { "$_" }) -join "`n"
$summary = $log.Substring([Math]::Max(0, $log.LastIndexOf("Summary:")))
$i = if ($summary -match "I:\s+(-?[\d.]+) LUFS") { $Matches[1] } else { "?" }
$lra = if ($summary -match "LRA:\s+(-?[\d.]+) LU") { $Matches[1] } else { "?" }
$tp = if ($summary -match "Peak:\s+(-?[\d.]+|-inf) dBFS") { $Matches[1] } else { "?" }

Write-Host ("Duration  {0:0.000} s -> {1:0.000} s (trimmed {2:0.000} s)" -f $dIn, $dOut, ($dIn - $dOut))
Write-Host ("Loudness  I = $i LUFS, true peak = $tp dBTP, LRA = $lra LU (target -16 LUFS / -1.5 dBTP)")
Write-Host "-> $Out"
