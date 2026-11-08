# FFmpeg helpers (PowerShell)

System FFmpeg 8.x is on PATH. Inside `remotion/`, `npx remotion ffmpeg` / `npx remotion ffprobe`
also work (bundled binaries). Run scripts from the repo root.

| Script                 | Does                                                        |
|------------------------|-------------------------------------------------------------|
| `to-vertical.ps1`      | 16:9 → 9:16, blurred-fill (default) or center-crop          |
| `trim.ps1`             | Cut between timestamps, re-encoded (clean first frame)      |
| `concat.ps1`           | Join clips (stream copy, or `-Reencode` if formats differ)  |
| `gif.ps1`              | Two-pass palette GIF                                        |
| `burn-srt.ps1`         | Hard-burn .srt captions                                     |
| `normalize-audio.ps1`  | Loudness to -14 LUFS / -1.5 dBTP (social targets)           |
| `extract-audio.ps1`    | Audio track → wav (16 kHz mono, transcription-ready) or mp3 |
| `thumbnail.ps1`        | One frame → JPG                                             |
| `..\probe.ps1`         | ffprobe JSON: duration, streams, fps, audio                 |

Rules of thumb
- Trimming for use *inside* Remotion: use `<Video trimBefore durationInFrames>` instead (non-destructive).
- Re-encode when cutting (`-c:v libx264 -crf 18`); stream-copy only for concat of identical files.
- Deliverables: H.264 + AAC, yuv420p, 30 fps. Remotion's default render already matches.
- Social loudness: -14 LUFS integrated, true peak ≤ -1.5 dBTP.
