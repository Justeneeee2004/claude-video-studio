# assets/ — RAW sources (not served by Remotion)

Keep originals here: footage, logos (SVG/PNG), fonts, music, VO, screenshots.

Anything a composition references must be copied into `remotion/public/` and used via
`staticFile("...")` (or a relative path in props; the `asset()` helper resolves it):

| Raw (here)            | Served (copy to)              | Used as                                         |
|-----------------------|-------------------------------|-------------------------------------------------|
| assets/brand/logos/   | remotion/public/brand/        | `logoSrc: "brand/logo.png"`                     |
| assets/screenshots/   | remotion/public/screenshots/  | `screenshotSrc: "screenshots/dashboard.png"`    |
| assets/audio/music/   | remotion/public/music/        | `musicSrc: "music/track.mp3"`                   |
| assets/audio/vo/      | remotion/public/vo/           | `<Audio src={staticFile("vo/scene-1.mp3")} />`  |
| assets/footage/       | remotion/public/footage/      | `<Video src={staticFile("footage/clip.mp4")} />`|

Licensing: only use music/footage you have rights to. CC-BY tracks need credit in the
video description (e.g. "Music: Inspired by Kevin MacLeod (incompetech.com), CC BY 3.0").
