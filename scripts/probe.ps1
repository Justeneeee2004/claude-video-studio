# Print the facts QA cares about for a rendered file: duration, size, streams, fps, audio.
# Usage: .\scripts\probe.ps1 -File output\renders\promo.mp4
param([Parameter(Mandatory = $true)][string]$File)

$path = (Resolve-Path $File).Path
ffprobe -v error -show_entries "format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels" -of json $path
