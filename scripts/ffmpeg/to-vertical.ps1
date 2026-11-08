# Convert a landscape video to 9:16 (1080x1920).
# -Mode blur  : scaled clip centered over a blurred, zoomed copy (keeps everything visible)
# -Mode crop  : scale to height 1920 and center-crop to 1080 wide (tight, may cut edges)
# Usage: .\scripts\ffmpeg\to-vertical.ps1 -In clip.mp4 [-Out clip_9x16.mp4] [-Mode blur|crop]
param(
  [Parameter(Mandatory = $true)][string]$In,
  [string]$Out = "",
  [ValidateSet("blur", "crop")][string]$Mode = "blur"
)
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, $null).TrimEnd('.') + "_9x16.mp4" }

if ($Mode -eq "crop") {
  ffmpeg -y -i $In -vf "scale=-2:1920,crop=1080:1920" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k $Out
} else {
  ffmpeg -y -i $In -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:6[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k $Out
}
Write-Host "-> $Out"
