# Loudness-normalize audio to social-media targets (-14 LUFS, -1.5 dBTP). Video stream copied.
# Usage: .\scripts\ffmpeg\normalize-audio.ps1 -In clip.mp4 [-Out clip_norm.mp4] [-Lufs -14]
param(
  [Parameter(Mandatory = $true)][string]$In,
  [string]$Out = "",
  [double]$Lufs = -14
)
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, $null).TrimEnd('.') + "_norm.mp4" }

ffmpeg -y -i $In -af "loudnorm=I=${Lufs}:TP=-1.5:LRA=11" -c:v copy -c:a aac -b:a 192k $Out
Write-Host "-> $Out"
