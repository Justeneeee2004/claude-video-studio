/**
 * Transcribe a video/audio file to Remotion Caption[] JSON with local Whisper (WebGPU).
 *
 *   node scripts/transcribe.mts <input media> [output.json] [model] [language]
 *   node scripts/transcribe.mts public/footage/clip.mp4 captions/clip.json small.en
 *
 * Models: small.en (default, English) | small | base | medium ... (multilingual needs `language`).
 * First run downloads the model (hundreds of MB). Requires a WebGPU-capable GPU.
 * Paste the resulting array inline into a <KineticCaptions captions={[...]}> node.
 */
import { registerMediabunnyServer } from "@mediabunny/server";
import {
  WHISPER_WEBGPU_SAMPLE_RATE,
  canUseWhisperWebGpu,
  downloadWhisperModel,
  loadWhisperModel,
  toCaptions,
  transcribe,
} from "@remotion/whisper-webgpu";
import {
  ALL_FORMATS,
  Conversion,
  FilePathSource,
  Input,
  NullTarget,
  Output,
  WavOutputFormat,
} from "mediabunny";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";

const [, , inputPath, outputArg, modelArg, languageArg] = process.argv;

if (!inputPath) {
  console.error("Usage: node scripts/transcribe.mts <input media> [output.json] [model] [language]");
  process.exit(1);
}

const model = (modelArg ?? "small.en") as Parameters<typeof downloadWhisperModel>[0]["model"];
const outputPath =
  outputArg ?? join("captions", `${basename(inputPath, extname(inputPath))}.json`);

registerMediabunnyServer();

const support = await canUseWhisperWebGpu();
if (!support.supported) {
  throw new Error(support.detailedReason);
}

type WaveformChunk = { startFrame: number; waveform: Float32Array };
const chunks: WaveformChunk[] = [];

using input = new Input({
  formats: ALL_FORMATS,
  source: new FilePathSource(inputPath),
});

const audioTrack = await input.getPrimaryAudioTrack();
if (audioTrack === null) {
  throw new Error("The media does not contain an audio track.");
}

const conversion = await Conversion.init({
  input,
  output: new Output({ format: new WavOutputFormat(), target: new NullTarget() }),
  video: { discard: true },
  audio: (track) => {
    if (track.id !== audioTrack.id) {
      return { discard: true };
    }
    return {
      codec: "pcm-f32",
      forceTranscode: true,
      numberOfChannels: 1,
      sampleFormat: "f32",
      sampleRate: WHISPER_WEBGPU_SAMPLE_RATE,
      process: (sample) => {
        const waveform = new Float32Array(
          sample.allocationSize({ format: "f32", planeIndex: 0 }) / Float32Array.BYTES_PER_ELEMENT,
        );
        sample.copyTo(waveform, { format: "f32", planeIndex: 0 });
        chunks.push({
          startFrame: Math.round(sample.timestamp * WHISPER_WEBGPU_SAMPLE_RATE),
          waveform,
        });
        return sample;
      },
    };
  },
});

if (!conversion.isValid) {
  throw new Error("The audio track cannot be decoded.");
}

await conversion.execute();

const waveformLength = chunks.reduce(
  (max, chunk) => Math.max(max, chunk.startFrame + chunk.waveform.length),
  0,
);
const channelWaveform = new Float32Array(waveformLength);
for (const chunk of chunks) {
  const destinationStart = Math.max(0, chunk.startFrame);
  const sourceStart = Math.max(0, -chunk.startFrame);
  const availableLength = Math.min(
    chunk.waveform.length - sourceStart,
    channelWaveform.length - destinationStart,
  );
  if (availableLength > 0) {
    channelWaveform.set(
      chunk.waveform.subarray(sourceStart, sourceStart + availableLength),
      destinationStart,
    );
  }
}

console.log(`Downloading/loading model ${model}...`);
await downloadWhisperModel({ model });
await using modelHandle = await loadWhisperModel({ model });
void modelHandle;

console.log("Transcribing...");
const transcription = await transcribe({
  channelWaveform,
  model,
  ...(languageArg ? { language: languageArg } : {}),
});
const { captions } = toCaptions({ whisperWebGpuOutput: transcription });

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(captions, null, 2));
console.log(`Wrote ${captions.length} captions → ${outputPath}`);
