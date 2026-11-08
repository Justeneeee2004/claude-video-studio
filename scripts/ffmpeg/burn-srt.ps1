# Hard-burn an .srt subtitle file into a video (for platforms without caption support).
# Usage: .\scripts\ffmpeg\burn-srt.ps1 -In clip.mp4 -Srt clip.srt [-Out clip_subs.mp4] [-FontSize 28]
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Srt,
  [string]$Out = "",
  [int]$FontSize = 28
)
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, $null).TrimEnd('.') + "_subs.mp4" }

# ffmpeg filter paths: forward slashes, escaped drive colon.
$srtPath = ((Resolve-Path $Srt).Path -replace '\\', '/') -replace ':', '\:'
$style = "FontName=Arial,FontSize=$FontSize,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=0,MarginV=60"

ffmpeg -y -i $In -vf "subtitles='$srtPath':force_style='$style'" -c:v libx264 -preset medium -crf 18 -c:a copy $Out
Write-Host "-> $Out"
