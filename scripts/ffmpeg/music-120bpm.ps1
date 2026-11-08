# Conform a music track to exactly 120 BPM (brief rallyo-prelaunch section 7: 1 beat = 15 f, 1 bar = 60 f at 30 fps).
# atempo = Target / measured BPM (pitch is kept). If the track is already within -Tolerance of the target,
# no stretch is applied: same-format output is a stream copy, other formats are a plain transcode.
# Measure the BPM first (beat/kick regression over the groove section), never trust a tag.
# Usage: .\scripts\ffmpeg\music-120bpm.ps1 -In track.mp3 -Bpm 124.0 [-Out track-120.mp3|.wav] [-Target 120] [-Tolerance 0.5]
#   .mp3 out -> libmp3lame 320 kb/s, 48 kHz (copy when no stretch and input is .mp3)
#   .wav out -> pcm_s16le, 48 kHz (what section 7 suggests for the final pick)
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][double]$Bpm,
  [string]$Out = "",
  [double]$Target = 120,
  [double]$Tolerance = 0.5
)
if (-not (Test-Path -LiteralPath $In)) { throw "Input not found: $In" }
if ($Bpm -le 0) { throw "-Bpm must be > 0" }
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, $null).TrimEnd('.') + "-120.mp3" }

$inv = [Globalization.CultureInfo]::InvariantCulture
$ratio = $Target / $Bpm
if ($ratio -lt 0.5 -or $ratio -gt 2.0) { throw "atempo ratio $ratio outside 0.5-2.0; check -Bpm (half/double time?)" }
$stretch = [Math]::Abs($Bpm - $Target) -gt $Tolerance
$outExt = [IO.Path]::GetExtension($Out).ToLowerInvariant()
$inExt = [IO.Path]::GetExtension($In).ToLowerInvariant()

switch ($outExt) {
  ".wav" { $codec = @("-c:a", "pcm_s16le", "-ar", "48000") }
  ".mp3" { $codec = @("-c:a", "libmp3lame", "-b:a", "320k", "-ar", "48000") }
  default { $codec = @("-c:a", "aac", "-b:a", "256k", "-ar", "48000") }
}

if ($stretch) {
  $atempo = $ratio.ToString("0.######", $inv)
  Write-Host ("Measured {0} BPM -> atempo={1} (target {2} BPM)" -f $Bpm.ToString($inv), $atempo, $Target.ToString($inv))
  ffmpeg -hide_banner -loglevel warning -y -i $In -map 0:a:0 -af "atempo=$atempo" @codec $Out
} elseif ($outExt -eq $inExt -and $outExt -eq ".mp3") {
  Write-Host ("Measured {0} BPM is within +/-{1} of {2}: no stretch, stream copy" -f $Bpm.ToString($inv), $Tolerance.ToString($inv), $Target.ToString($inv))
  ffmpeg -hide_banner -loglevel warning -y -i $In -map 0:a:0 -c:a copy $Out
} else {
  Write-Host ("Measured {0} BPM is within +/-{1} of {2}: no stretch, transcode only" -f $Bpm.ToString($inv), $Tolerance.ToString($inv), $Target.ToString($inv))
  ffmpeg -hide_banner -loglevel warning -y -i $In -map 0:a:0 @codec $Out
}
if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed ($LASTEXITCODE)" }

$dIn = [double]::Parse((ffprobe -v error -show_entries format=duration -of csv=p=0 $In), $inv)
$dOut = [double]::Parse((ffprobe -v error -show_entries format=duration -of csv=p=0 $Out), $inv)
Write-Host ("Duration {0:0.000} s -> {1:0.000} s" -f $dIn, $dOut)
Write-Host "-> $Out"
