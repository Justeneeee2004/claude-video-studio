# Join clips back to back. Same codec/size/fps → stream copy; otherwise pass -Reencode.
# Usage: .\scripts\ffmpeg\concat.ps1 -Out joined.mp4 -Files a.mp4, b.mp4, c.mp4 [-Reencode]
param(
  [Parameter(Mandatory = $true)][string]$Out,
  [Parameter(Mandatory = $true)][string[]]$Files,
  [switch]$Reencode
)

$list = [IO.Path]::GetTempFileName()
$lines = foreach ($f in $Files) {
  $p = (Resolve-Path $f).Path -replace '\\', '/' -replace "'", "'\\''"
  "file '$p'"
}
Set-Content -Path $list -Value $lines -Encoding ascii

if ($Reencode) {
  ffmpeg -y -f concat -safe 0 -i $list -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k $Out
} else {
  ffmpeg -y -f concat -safe 0 -i $list -c copy $Out
}
Remove-Item $list -Force
Write-Host "-> $Out"
