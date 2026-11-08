# Extract the audio track (for transcription or VO editing).
# Usage: .\scripts\ffmpeg\extract-audio.ps1 -In clip.mp4 [-Out clip.wav] [-Format wav|mp3]
param(
  [Parameter(Mandatory = $true)][string]$In,
  [string]$Out = "",
  [ValidateSet("wav", "mp3")][string]$Format = "wav"
)
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, ".$Format") }

if ($Format -eq "mp3") {
  ffmpeg -y -i $In -vn -c:a libmp3lame -q:a 2 $Out
} else {
  ffmpeg -y -i $In -vn -ac 1 -ar 16000 -c:a pcm_s16le $Out
}
Write-Host "-> $Out"
