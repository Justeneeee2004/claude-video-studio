# Cut a clip between two timestamps (re-encodes so the first frame is clean).
# Usage: .\scripts\ffmpeg\trim.ps1 -In clip.mp4 -Start 00:00:05 -End 00:00:12 [-Out clip_trim.mp4]
# Prefer <Video trimBefore / durationInFrames> inside Remotion; use this for standalone files.
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Start,
  [Parameter(Mandatory = $true)][string]$End,
  [string]$Out = ""
)
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, $null).TrimEnd('.') + "_trim.mp4" }

$duration = ([TimeSpan]::Parse($End) - [TimeSpan]::Parse($Start)).TotalSeconds
ffmpeg -y -ss $Start -i $In -t $duration -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k $Out
Write-Host "-> $Out"
