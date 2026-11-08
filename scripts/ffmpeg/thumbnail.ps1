# Grab one frame as a JPG (poster / cover image).
# Usage: .\scripts\ffmpeg\thumbnail.ps1 -In clip.mp4 -Time 00:00:03 [-Out poster.jpg]
param(
  [Parameter(Mandatory = $true)][string]$In,
  [string]$Time = "00:00:01",
  [string]$Out = ""
)
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, $null).TrimEnd('.') + "_poster.jpg" }

ffmpeg -y -ss $Time -i $In -frames:v 1 -q:v 2 $Out
Write-Host "-> $Out"
