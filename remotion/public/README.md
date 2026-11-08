# public/ — files served to compositions via staticFile()

- brand/        logos (png/svg), local fonts
- screenshots/  app screenshots for DeviceFrame / ScreenshotShowcase
- music/        licensed music beds
- vo/           voiceover mp3 per scene
- footage/      video clips (mp4/webm)

Reference as `staticFile("screenshots/dashboard.png")` or pass the relative path in props
(`screenshotSrc: "screenshots/dashboard.png"`); `src/lib/assets.ts` resolves it.
