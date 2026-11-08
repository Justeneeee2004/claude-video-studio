# High-quality GIF (two-pass palette). Good for README / email / chat previews.
# Usage: .\scripts\ffmpeg\gif.ps1 -In clip.mp4 [-Out clip.gif] [-Width 720] [-Fps 15]
param(
  [Parameter(Mandatory = $true)][string]$In,
  [string]$Out = "",
  [int]$Width = 720,
  [int]$Fps = 15
)
if (-not $Out) { $Out = [IO.Path]::ChangeExtension($In, ".gif") }

ffmpeg -y -i $In -vf "fps=$Fps,scale=${Width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=192[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4" $Out
Write-Host "-> $Out"
