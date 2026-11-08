/**
 * Rallyo align-captions (brief build item 13).
 *
 * Maps the CANONICAL caption text of one VO clip (brief section 6: " / " = page break, " ⏎ " = line
 * break inside a page) onto Whisper's word timings (scripts/transcribe.mts output, language `tl`) and
 * writes a Remotion Caption[] for `vo[i].captions` / <RallyoCaptions captions={[...]}>.
 * Whisper is used for TIMING ONLY: the caption text is always the canonical spelling
 * (Rallyo, rallyo.ph, GCash, Up next, Auto-call, Player ID, one month).
 *
 *   node scripts/align-captions.mts <whisper.json> --clip vo-07 [--props ../briefs/rallyo-prelaunch.props.json]
 *        [--text "canonical text"] [--window-ms 5800] [--out captions/vo-07.aligned.json] [--print]
 *        [--write-props ../briefs/rallyo-prelaunch.props.json]
 *   node scripts/align-captions.mts --check [--props <props.json>]   layout check of every canonical text
 *   node scripts/align-captions.mts --self-test                       fabricated Whisper output, asserts
 *
 * Steps
 *  1. Parse the canonical text into pages / lines / words. A page over 24 characters (or ~750 px) with no
 *     explicit ⏎ is split into the best 2 lines; explicit ⏎ lines are kept as written.
 *  2. Layout gate (FAILS the run): every line ≤ 24 characters and ≤ 750 px of Satoshi 900 at 60 px
 *     (plate x 92-890 = 798 px minus 2 × 24 px padding), at most 2 lines per page. Widths come from the
 *     real font file (public/rallyo/fonts/Satoshi-Black.woff2: cmap + hmtx advances + GPOS pair kerning),
 *     summed per word plus the space advance, the way RallyoCaptions lays out a line.
 *  3. Group Whisper tokens into words (a token without a leading space glues onto the previous one, so
 *     whisper.cpp sub-word tokens and "-call" / "-H" pieces join up; [BLANK_AUDIO]-style tags are dropped).
 *  4. Needleman-Wunsch over word sequences with compound moves (1 canonical ↔ 1-5 Whisper words, or 2-3
 *     canonical ↔ 1 Whisper word). The substitution cost is a normalised Levenshtein distance between
 *     phonetically folded strings (Tagalog e/i and o/u, c/k, f/p, v/b, doubled letters) and the best of a
 *     variant table (Raleo → Rallyo, auto call → Auto-call, G cash → GCash, I D → ID, P H → .ph, chicken →
 *     check-in, 1 → one, nang → ng ...). Gaps are cheaper at the ends (Whisper's trailing hallucinations).
 *  5. Matched words copy Whisper's timings (1:k spans first start → last end; k:1 splits the Whisper span
 *     by character length). Unmatched canonical words are interpolated by character length between their
 *     timed neighbours (borrowing the neighbours' spans when the hole is too short).
 *  6. Output Caption[]: leading space on every word but the first, "\n" instead of the space before a
 *     line-break word, `pageBreakAfter: true` on the last word of every page. Pages shorter than 1.2 s are
 *     FLAGGED (warning, not a failure). The last page of a clip holds to the clip window's end.
 *  7. Cue report: the start of "libre" (scene 9 slam: first beat at or after the word, 1185 or 1200) and
 *     of "parating" (scene 2 COMING SOON badge, snapped to the 3 f grid).
 *
 * Exit code 1 = a layout failure, no Whisper words matched, or a failed self-test assertion.
 */
import type { Caption } from "@remotion/captions";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";

// ---------------------------------------------------------------------------------------------------
// Constants (brief section 5 "Caption plate", section 6, lib/rallyo-timeline.ts)
// ---------------------------------------------------------------------------------------------------

const FPS = 30;
const MAX_CHARS = 24;
const PLATE_W = 798;
const PLATE_PAD_X = 24;
const MAX_LINE_PX = PLATE_W - 2 * PLATE_PAD_X; // 750
const MAX_LINES = 2;
const FONT_SIZE = 60;
const MIN_PAGE_MS = 1200;
const VO_LEAD = 6;
const VO_END_LIMIT = 1470;
const BEAT = 15; // 120 BPM at 30 fps
const SLAM_OPTIONS = [1185, 1200];
const VO_IDS = ["vo-01", "vo-02", "vo-03", "vo-04", "vo-05", "vo-06", "vo-07", "vo-08", "vo-09", "vo-10"];
/** Fallback when no props file is given (= VO_AT in lib/rallyo-timeline.ts). */
const DEFAULT_VO_AT = [6, 141, 246, 396, 516, 651, 801, 981, 1131, 1296];

/** Alignment weights. */
const GAP = 0.55;
const END_GAP = 0.25;
const COMPOUND = 0.08;
/** A compound move (one word split by Whisper, or words merged) must be near-exact to be taken. */
const COMPOUND_MAX = 0.34;
const WEAK_MATCH = 0.5;
/** Rough speaking rate for interpolation outside any timed neighbour (≈ 2.4 tokens/s). */
const MS_PER_WEIGHT = 65;
const MIN_WORD_MS = 80;

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REMOTION_DIR = resolve(SCRIPT_DIR, "..");
const FONT_FILE = join(REMOTION_DIR, "public", "rallyo", "fonts", "Satoshi-Black.woff2");
const DEFAULT_PROPS = resolve(REMOTION_DIR, "..", "briefs", "rallyo-prelaunch.props.json");

// ---------------------------------------------------------------------------------------------------
// Font metrics: WOFF2 → cmap + hmtx + GPOS pair kerning (enough for advance-width measuring)
// ---------------------------------------------------------------------------------------------------

type Font = {
  readonly unitsPerEm: number;
  readonly glyph: (codePoint: number) => number;
  readonly advance: (glyphId: number) => number;
  readonly kern: (left: number, right: number) => number;
};

const KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ",
  "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS",
  "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc",
  "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop",
  "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill",
];

const readWoff2Tables = (file: string): Map<string, Buffer> => {
  const buf = readFileSync(file);
  if (buf.toString("latin1", 0, 4) !== "wOF2") {
    throw new Error(`${file} is not a WOFF2 file`);
  }
  const numTables = buf.readUInt16BE(12);
  const totalCompressed = buf.readUInt32BE(20);
  let off = 48;
  const base128 = (): number => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = buf[off++];
      value = value * 128 + (byte & 0x7f);
      if ((byte & 0x80) === 0) {
        return value;
      }
    }
    throw new Error("Bad UIntBase128 in WOFF2 directory");
  };
  const dir: { tag: string; length: number }[] = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[off++];
    const tagIndex = flags & 0x3f;
    const version = flags >> 6;
    let tag: string;
    if (tagIndex === 63) {
      tag = buf.toString("latin1", off, off + 4);
      off += 4;
    } else {
      tag = KNOWN_TAGS[tagIndex];
    }
    const origLength = base128();
    const transformed = tag === "glyf" || tag === "loca" ? version !== 3 : version !== 0;
    const length = transformed ? base128() : origLength;
    dir.push({ tag: transformed ? `${tag}#t` : tag, length });
  }
  const data = brotliDecompressSync(buf.subarray(off, off + totalCompressed));
  const tables = new Map<string, Buffer>();
  let p = 0;
  for (const t of dir) {
    tables.set(t.tag, data.subarray(p, p + t.length));
    p += t.length;
  }
  return tables;
};

const parseCmap = (cmap: Buffer): ((cp: number) => number) => {
  const count = cmap.readUInt16BE(2);
  let best: { offset: number; format: number } | null = null;
  for (let i = 0; i < count; i++) {
    const platform = cmap.readUInt16BE(4 + i * 8);
    const encoding = cmap.readUInt16BE(6 + i * 8);
    const offset = cmap.readUInt32BE(8 + i * 8);
    const format = cmap.readUInt16BE(offset);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode || (format !== 4 && format !== 12)) {
      continue;
    }
    if (!best || (format === 12 && best.format !== 12)) {
      best = { offset, format };
    }
  }
  if (!best) {
    throw new Error("No unicode cmap subtable (format 4 or 12)");
  }
  const map = new Map<number, number>();
  const o = best.offset;
  if (best.format === 12) {
    const groups = cmap.readUInt32BE(o + 12);
    for (let g = 0; g < groups; g++) {
      const start = cmap.readUInt32BE(o + 16 + g * 12);
      const end = cmap.readUInt32BE(o + 20 + g * 12);
      const glyph = cmap.readUInt32BE(o + 24 + g * 12);
      for (let cp = start; cp <= end && cp - start < 0x10000; cp++) {
        map.set(cp, glyph + (cp - start));
      }
    }
  } else {
    const segX2 = cmap.readUInt16BE(o + 6);
    const ends = o + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    for (let s = 0; s < segX2 / 2; s++) {
      const end = cmap.readUInt16BE(ends + s * 2);
      const start = cmap.readUInt16BE(starts + s * 2);
      const delta = cmap.readInt16BE(deltas + s * 2);
      const rangeOffset = cmap.readUInt16BE(ranges + s * 2);
      for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
        let glyph: number;
        if (rangeOffset === 0) {
          glyph = (cp + delta) & 0xffff;
        } else {
          const at = ranges + s * 2 + rangeOffset + (cp - start) * 2;
          const raw = cmap.readUInt16BE(at);
          glyph = raw === 0 ? 0 : (raw + delta) & 0xffff;
        }
        if (glyph !== 0) {
          map.set(cp, glyph);
        }
      }
    }
  }
  return (cp: number) => map.get(cp) ?? 0;
};

const popcount = (n: number): number => {
  let c = 0;
  for (let v = n; v; v >>= 1) {
    c += v & 1;
  }
  return c;
};

/** Pair kerning from GPOS lookups referenced by the 'kern' feature (PairPos formats 1 and 2, extension 9). */
const parseGposKerning = (gpos: Buffer | undefined): ((l: number, r: number) => number) => {
  if (!gpos) {
    return () => 0;
  }
  const featureList = gpos.readUInt16BE(6);
  const lookupList = gpos.readUInt16BE(8);
  const lookupIndices = new Set<number>();
  const featureCount = gpos.readUInt16BE(featureList);
  for (let i = 0; i < featureCount; i++) {
    const rec = featureList + 2 + i * 6;
    if (gpos.toString("latin1", rec, rec + 4) !== "kern") {
      continue;
    }
    const feature = featureList + gpos.readUInt16BE(rec + 4);
    const n = gpos.readUInt16BE(feature + 2);
    for (let k = 0; k < n; k++) {
      lookupIndices.add(gpos.readUInt16BE(feature + 4 + k * 2));
    }
  }
  const coverageIndex = (cov: number, glyph: number): number => {
    const format = gpos.readUInt16BE(cov);
    const count = gpos.readUInt16BE(cov + 2);
    if (format === 1) {
      for (let i = 0; i < count; i++) {
        if (gpos.readUInt16BE(cov + 4 + i * 2) === glyph) {
          return i;
        }
      }
      return -1;
    }
    for (let i = 0; i < count; i++) {
      const r = cov + 4 + i * 6;
      const start = gpos.readUInt16BE(r);
      const end = gpos.readUInt16BE(r + 2);
      if (glyph >= start && glyph <= end) {
        return gpos.readUInt16BE(r + 4) + glyph - start;
      }
    }
    return -1;
  };
  const classOf = (cd: number, glyph: number): number => {
    const format = gpos.readUInt16BE(cd);
    if (format === 1) {
      const start = gpos.readUInt16BE(cd + 2);
      const count = gpos.readUInt16BE(cd + 4);
      return glyph >= start && glyph < start + count ? gpos.readUInt16BE(cd + 6 + (glyph - start) * 2) : 0;
    }
    const count = gpos.readUInt16BE(cd + 2);
    for (let i = 0; i < count; i++) {
      const r = cd + 4 + i * 6;
      if (glyph >= gpos.readUInt16BE(r) && glyph <= gpos.readUInt16BE(r + 2)) {
        return gpos.readUInt16BE(r + 4);
      }
    }
    return 0;
  };
  /** XAdvance of a ValueRecord at `at` with `format`, or 0. */
  const xAdvance = (at: number, format: number): number =>
    format & 0x4 ? gpos.readInt16BE(at + popcount(format & 0x3) * 2) : 0;

  type Sub = (l: number, r: number) => number | null;
  const subtables: Sub[][] = [];
  const lookupCount = gpos.readUInt16BE(lookupList);
  [...lookupIndices].sort((a, b) => a - b).forEach((index) => {
    if (index >= lookupCount) {
      return;
    }
    const lookup = lookupList + gpos.readUInt16BE(lookupList + 2 + index * 2);
    let type = gpos.readUInt16BE(lookup);
    const subCount = gpos.readUInt16BE(lookup + 4);
    const subs: Sub[] = [];
    for (let s = 0; s < subCount; s++) {
      let st = lookup + gpos.readUInt16BE(lookup + 6 + s * 2);
      if (type === 9) {
        type = gpos.readUInt16BE(st + 2);
        st += gpos.readUInt32BE(st + 4);
      }
      if (type !== 2) {
        continue;
      }
      const posFormat = gpos.readUInt16BE(st);
      const coverage = st + gpos.readUInt16BE(st + 2);
      const vf1 = gpos.readUInt16BE(st + 4);
      const vf2 = gpos.readUInt16BE(st + 6);
      const size1 = popcount(vf1) * 2;
      const size2 = popcount(vf2) * 2;
      if (posFormat === 1) {
        const pairSetCount = gpos.readUInt16BE(st + 8);
        subs.push((l, r) => {
          const ci = coverageIndex(coverage, l);
          if (ci < 0 || ci >= pairSetCount) {
            return null;
          }
          const set = st + gpos.readUInt16BE(st + 10 + ci * 2);
          const n = gpos.readUInt16BE(set);
          for (let i = 0; i < n; i++) {
            const rec = set + 2 + i * (2 + size1 + size2);
            if (gpos.readUInt16BE(rec) === r) {
              return xAdvance(rec + 2, vf1);
            }
          }
          return null;
        });
      } else if (posFormat === 2) {
        const cd1 = st + gpos.readUInt16BE(st + 8);
        const cd2 = st + gpos.readUInt16BE(st + 10);
        const class1Count = gpos.readUInt16BE(st + 12);
        const class2Count = gpos.readUInt16BE(st + 14);
        subs.push((l, r) => {
          if (coverageIndex(coverage, l) < 0) {
            return null;
          }
          const c1 = classOf(cd1, l);
          const c2 = classOf(cd2, r);
          if (c1 >= class1Count || c2 >= class2Count) {
            return 0;
          }
          const rec = st + 16 + (c1 * class2Count + c2) * (size1 + size2);
          return xAdvance(rec, vf1);
        });
      }
    }
    subtables.push(subs);
  });
  return (l, r) => {
    let total = 0;
    for (const subs of subtables) {
      for (const sub of subs) {
        const v = sub(l, r);
        if (v !== null) {
          total += v;
          break;
        }
      }
    }
    return total;
  };
};

let fontCache: Font | null = null;
const loadFont = (): Font => {
  if (fontCache) {
    return fontCache;
  }
  const tables = readWoff2Tables(FONT_FILE);
  const head = tables.get("head");
  const hhea = tables.get("hhea");
  const hmtx = tables.get("hmtx");
  const cmap = tables.get("cmap");
  if (!head || !hhea || !hmtx || !cmap) {
    throw new Error(`${FONT_FILE}: missing head/hhea/hmtx/cmap (or hmtx is WOFF2-transformed)`);
  }
  const unitsPerEm = head.readUInt16BE(18);
  const numberOfHMetrics = hhea.readUInt16BE(34);
  const glyph = parseCmap(cmap);
  const advance = (g: number): number => hmtx.readUInt16BE(Math.min(g, numberOfHMetrics - 1) * 4);
  fontCache = { unitsPerEm, glyph, advance, kern: parseGposKerning(tables.get("GPOS")) };
  return fontCache;
};

const missingGlyphs = new Set<string>();

/** Width in px of one word (advances + pair kerning), Satoshi 900. */
const measureWord = (word: string, fontSize = FONT_SIZE): number => {
  const font = loadFont();
  let units = 0;
  let prev = -1;
  for (const ch of word) {
    const cp = ch.codePointAt(0) ?? 0;
    let g = font.glyph(cp);
    if (g === 0) {
      missingGlyphs.add(ch);
      g = font.glyph(0x4d); // "M": wide fallback, errs on the safe side
    }
    if (prev >= 0) {
      units += font.kern(prev, g);
    }
    units += font.advance(g);
    prev = g;
  }
  return (units * fontSize) / font.unitsPerEm;
};

/** Width of a caption line as RallyoCaptions lays it out: words (inline-block) joined by one space. */
const measureLine = (words: readonly string[], fontSize = FONT_SIZE): number => {
  const space = measureWord(" ", fontSize);
  return words.reduce((sum, w, i) => sum + measureWord(w, fontSize) + (i > 0 ? space : 0), 0);
};

// ---------------------------------------------------------------------------------------------------
// Canonical text → pages / lines / words, plus the layout gate
// ---------------------------------------------------------------------------------------------------

type CanonWord = {
  readonly text: string;
  readonly page: number;
  readonly line: number;
  readonly lineBreakBefore: boolean;
  readonly pageEnd: boolean;
};

type PageLayout = {
  readonly lines: string[][];
  readonly explicit: boolean;
};

type LayoutIssue = { readonly level: "fail" | "flag"; readonly message: string };

const lineText = (words: readonly string[]): string => words.join(" ");

/** Best 2-line split (smallest widest line) when a page is over 24 chars / 750 px and has no ⏎. */
const splitPage = (words: string[]): string[][] => {
  const single = lineText(words);
  if (single.length <= MAX_CHARS && measureLine(words) <= MAX_LINE_PX) {
    return [words];
  }
  let best: { lines: string[][]; score: number; fits: boolean } | null = null;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k);
    const b = words.slice(k);
    const wa = measureLine(a);
    const wb = measureLine(b);
    const fits =
      lineText(a).length <= MAX_CHARS && lineText(b).length <= MAX_CHARS && wa <= MAX_LINE_PX && wb <= MAX_LINE_PX;
    const score = Math.max(wa, wb);
    if (!best || (fits && !best.fits) || (fits === best.fits && score < best.score)) {
      best = { lines: [a, b], score, fits };
    }
  }
  return best ? best.lines : [words];
};

const parseCanonical = (canonical: string): { pages: PageLayout[]; words: CanonWord[] } => {
  const cleaned = canonical.replace(/\s+/g, " ").trim();
  const pageTexts = cleaned
    .split(/\s+\/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const pages: PageLayout[] = pageTexts.map((pageText) => {
    const explicitLines = pageText
      .split(/\s*⏎\s*/)
      .map((l) => l.split(" ").filter((w) => w.length > 0))
      .filter((l) => l.length > 0);
    if (explicitLines.length > 1) {
      return { lines: explicitLines, explicit: true };
    }
    return { lines: splitPage(explicitLines[0] ?? []), explicit: false };
  });
  const words: CanonWord[] = [];
  pages.forEach((page, p) => {
    page.lines.forEach((line, l) => {
      line.forEach((text, w) => {
        words.push({
          text,
          page: p,
          line: l,
          lineBreakBefore: l > 0 && w === 0,
          pageEnd: l === page.lines.length - 1 && w === line.length - 1,
        });
      });
    });
  });
  return { pages, words };
};

const checkLayout = (pages: readonly PageLayout[]): LayoutIssue[] => {
  const issues: LayoutIssue[] = [];
  pages.forEach((page, p) => {
    const nWords = page.lines.reduce((s, l) => s + l.length, 0);
    if (page.lines.length > MAX_LINES) {
      issues.push({ level: "fail", message: `page ${p + 1}: ${page.lines.length} lines (max ${MAX_LINES})` });
    }
    if (nWords < 2 || nWords > 4) {
      issues.push({ level: "flag", message: `page ${p + 1}: ${nWords} words (brief: 2-4 per page)` });
    }
    page.lines.forEach((line, l) => {
      const text = lineText(line);
      const px = measureLine(line);
      if (text.length > MAX_CHARS) {
        issues.push({ level: "fail", message: `page ${p + 1} line ${l + 1} "${text}": ${text.length} chars (max ${MAX_CHARS})` });
      }
      if (px > MAX_LINE_PX) {
        issues.push({ level: "fail", message: `page ${p + 1} line ${l + 1} "${text}": ${px.toFixed(0)} px at ${FONT_SIZE} px (max ${MAX_LINE_PX})` });
      }
    });
  });
  if (missingGlyphs.size > 0) {
    issues.push({ level: "flag", message: `glyphs missing from Satoshi Black (measured as "M"): ${[...missingGlyphs].join(" ")}` });
  }
  return issues;
};

// ---------------------------------------------------------------------------------------------------
// Whisper input
// ---------------------------------------------------------------------------------------------------

type WhisperWord = { text: string; startMs: number; endMs: number; confidence: number | null };

type RawToken = { text: string; startMs: number; endMs: number; confidence: number | null };

/** Accepts Caption[] (transcribe.mts), {captions: Caption[]}, or whisper-webgpu {words: [{text, startInSeconds, endInSeconds}]}. */
const readWhisperTokens = (json: unknown): RawToken[] => {
  const asRecord = (v: unknown): Record<string, unknown> => (typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {});
  let list: unknown[] = [];
  if (Array.isArray(json)) {
    list = json;
  } else if (Array.isArray(asRecord(json).captions)) {
    list = asRecord(json).captions as unknown[];
  } else if (Array.isArray(asRecord(json).words)) {
    list = asRecord(json).words as unknown[];
  } else {
    throw new Error("Whisper JSON: expected Caption[], {captions}, or {words}");
  }
  return list.map((item, i) => {
    const r = asRecord(item);
    const text = typeof r.text === "string" ? r.text : "";
    const startMs = typeof r.startMs === "number" ? r.startMs : typeof r.startInSeconds === "number" ? r.startInSeconds * 1000 : NaN;
    const endMs = typeof r.endMs === "number" ? r.endMs : typeof r.endInSeconds === "number" ? r.endInSeconds * 1000 : NaN;
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      throw new Error(`Whisper token ${i} ("${text}") has no startMs/endMs`);
    }
    const confidence = typeof r.confidence === "number" ? r.confidence : null;
    return { text, startMs: Math.round(startMs), endMs: Math.round(endMs), confidence };
  });
};

/** Glue sub-word tokens (no leading space) onto the previous word; drop [BLANK_AUDIO]-style tags. */
const groupWhisperWords = (tokens: readonly RawToken[]): WhisperWord[] => {
  const words: WhisperWord[] = [];
  for (const t of tokens) {
    if (/^\s*[[(<].*[\])>]\s*$/.test(t.text)) {
      continue;
    }
    const startsWord = /^\s/.test(t.text) || words.length === 0;
    const hasLetters = norm(t.text).length > 0;
    if (startsWord && hasLetters) {
      words.push({ text: t.text.trim(), startMs: t.startMs, endMs: t.endMs, confidence: t.confidence });
    } else if (words.length > 0) {
      const last = words[words.length - 1];
      last.text += t.text.trim();
      last.endMs = Math.max(last.endMs, t.endMs);
    } else if (hasLetters) {
      words.push({ text: t.text.trim(), startMs: t.startMs, endMs: t.endMs, confidence: t.confidence });
    }
  }
  return words;
};

// ---------------------------------------------------------------------------------------------------
// Normalisation, variants, distance
// ---------------------------------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven",
  "8": "eight", "9": "nine", "10": "ten",
};

function norm(s: string): string {
  const plain = s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const bare = plain.replace(/[^a-z0-9]/g, "");
  return NUMBER_WORDS[bare] ?? bare;
}

/** Phonetic folding for Taglish ASR spellings (applied to both sides). */
const fold = (s: string): string =>
  s
    .replace(/ph/g, "f")
    .replace(/c(?!h)/g, "k")
    .replace(/q/g, "k")
    .replace(/x/g, "ks")
    .replace(/z/g, "s")
    .replace(/f/g, "p")
    .replace(/v/g, "b")
    .replace(/e/g, "i")
    .replace(/o/g, "u")
    .replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1");

/**
 * Spoken / ASR variants per canonical word (keys and values are run through norm + fold, spaces = word
 * boundaries Whisper may insert). Covers brand respellings, spelled letters and Tagalog/English variants.
 */
const VARIANTS: Record<string, string[]> = {
  rallyo: ["raleo", "ralyo", "rallio", "raliyo", "rally yo", "rally o", "rallye", "ralio", "rayo", "rally-yo"],
  rallyoph: ["rallyo dot ph", "rally yo dot p h", "raleo dot ph", "rallyo ph", "rallyo dot p h", "rally-yo dot p-h", "ralyo dot pH"],
  gcash: ["g cash", "gee cash", "ji cash", "jcash", "gecash", "g-cash"],
  id: ["i d", "ai di", "aydi", "eye dee", "i-d", "ide"],
  autocall: ["auto call", "otto call", "oto call", "auto-call"],
  autoseeded: ["auto seeded", "auto seated", "autoseated", "auto sided", "auto-seated"],
  checkin: ["check in", "chicken", "check-in"],
  isave: ["i save", "e save", "isabe", "esave"],
  isend: ["i send", "e send", "esend"],
  one: ["1", "won", "wan"],
  for: ["4", "por", "four"],
  ng: ["nang", "nag"],
  lang: ["lng", "lamang"],
  oi: ["oy", "uy", "oie", "oye"],
  saang: ["saan", "sa ang"],
  waitlisted: ["wait listed", "waitlist", "weightlisted", "wait-listed"],
  features: ["pitures", "fitures", "feature"],
  standings: ["standing"],
  hosts: ["host"],
  courts: ["court"],
  pools: ["pool"],
  winners: ["winner"],
  advance: ["advanced", "advans"],
  month: ["months", "mont"],
  parating: ["darating", "parateng"],
  kalma: ["calma"],
  tournament: ["turnament", "tornament", "tournaments"],
  na: ["nah"],
  man: ["mun"],
  davao: ["dabaw", "dabao"],
  visit: ["bisit"],
  upnext: ["up next"],
};

const levenshtein = (a: string, b: string): number => {
  if (a === b) {
    return 0;
  }
  if (a.length === 0 || b.length === 0) {
    return Math.max(a.length, b.length);
  }
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
};

const ratio = (a: string, b: string): number => {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 0 : levenshtein(a, b) / max;
};

/** Folded spoken forms of one canonical word (its own spelling first, then the variants). */
const canonForms = (word: string): string[] => {
  const key = norm(word);
  const variants = VARIANTS[key] ?? [];
  const forms = [key, ...variants.map((v) => v.split(/\s+/).map(norm).join(""))];
  return [...new Set(forms.map(fold))];
};

// ---------------------------------------------------------------------------------------------------
// Alignment (Needleman-Wunsch with compound moves)
// ---------------------------------------------------------------------------------------------------

type Move =
  | { kind: "match"; ci: number; ca: number; wj: number; wb: number; cost: number }
  | { kind: "skipCanon"; ci: number }
  | { kind: "skipWhisper"; wj: number };

const MOVES: readonly [number, number][] = [
  [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 1], [3, 1],
];

const align = (canon: readonly CanonWord[], whisper: readonly WhisperWord[]): Move[] => {
  const n = canon.length;
  const m = whisper.length;
  const cForms = canon.map((w) => canonForms(w.text));
  const cKeys = canon.map((w) => fold(norm(w.text)));
  const wKeys = whisper.map((w) => norm(w.text));
  const INF = Number.POSITIVE_INFINITY;
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(INF));
  const back: (Move | null)[][] = Array.from({ length: n + 1 }, () => new Array<Move | null>(m + 1).fill(null));
  cost[0][0] = 0;
  const matchCost = (i: number, a: number, j: number, b: number): number => {
    const spoken = fold(wKeys.slice(j, j + b).join(""));
    if (a === 1) {
      return Math.min(...cForms[i].map((f) => ratio(f, spoken)));
    }
    return ratio(fold(cKeys.slice(i, i + a).join("")), spoken);
  };
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const here = cost[i][j];
      if (here === INF) {
        continue;
      }
      // Whisper word with no canonical counterpart (cheap before the first / after the last canonical word).
      if (j < m) {
        const c = here + (i === 0 || i === n ? END_GAP : GAP);
        if (c < cost[i][j + 1]) {
          cost[i][j + 1] = c;
          back[i][j + 1] = { kind: "skipWhisper", wj: j };
        }
      }
      // Canonical word Whisper did not hear.
      if (i < n) {
        const c = here + GAP;
        if (c < cost[i + 1][j]) {
          cost[i + 1][j] = c;
          back[i + 1][j] = { kind: "skipCanon", ci: i };
        }
      }
      for (const [a, b] of MOVES) {
        if (i + a > n || j + b > m) {
          continue;
        }
        const mc = matchCost(i, a, j, b);
        if (a + b > 2 && mc > COMPOUND_MAX) {
          continue;
        }
        const c = here + mc + COMPOUND * (a + b - 2);
        if (c < cost[i + a][j + b]) {
          cost[i + a][j + b] = c;
          back[i + a][j + b] = { kind: "match", ci: i, ca: a, wj: j, wb: b, cost: mc };
        }
      }
    }
  }
  const path: Move[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = back[i][j];
    if (!mv) {
      throw new Error("alignment backtrack failed");
    }
    path.push(mv);
    if (mv.kind === "match") {
      i -= mv.ca;
      j -= mv.wb;
    } else if (mv.kind === "skipCanon") {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return path.reverse();
};

// ---------------------------------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------------------------------

type Timed = { startMs: number; endMs: number; source: string; cost: number | null };

const weight = (word: string): number => Math.max(1, norm(word).length) + 1;

const assignTimings = (
  canon: readonly CanonWord[],
  whisper: readonly WhisperWord[],
  moves: readonly Move[],
  windowMs: number | null,
): { timed: Timed[]; weak: string[] } => {
  const timed: (Timed | null)[] = canon.map(() => null);
  const weak: string[] = [];
  for (const mv of moves) {
    if (mv.kind !== "match") {
      continue;
    }
    const ws = whisper.slice(mv.wj, mv.wj + mv.wb);
    const spoken = ws.map((w) => w.text).join(" + ");
    const start = ws[0].startMs;
    const end = ws[ws.length - 1].endMs;
    if (mv.cost > WEAK_MATCH) {
      const cs = canon.slice(mv.ci, mv.ci + mv.ca).map((c) => c.text).join(" ");
      weak.push(`"${cs}" ↔ "${spoken}" (distance ${mv.cost.toFixed(2)})`);
    }
    if (mv.ca === 1) {
      timed[mv.ci] = { startMs: start, endMs: end, source: `"${spoken}"${mv.wb > 1 ? ` (1:${mv.wb})` : ""}`, cost: mv.cost };
    } else {
      const group = canon.slice(mv.ci, mv.ci + mv.ca);
      const total = group.reduce((s, c) => s + weight(c.text), 0);
      let cursor = start;
      group.forEach((c, k) => {
        const dur = ((end - start) * weight(c.text)) / total;
        timed[mv.ci + k] = {
          startMs: Math.round(cursor),
          endMs: Math.round(cursor + dur),
          source: `"${spoken}" (${mv.ca}:1 split)`,
          cost: mv.cost,
        };
        cursor += dur;
      });
    }
  }
  if (timed.every((t) => t === null)) {
    throw new Error("no canonical word matched any Whisper word: wrong clip or empty transcript");
  }
  // Interpolate runs of unmatched canonical words by character length.
  let i = 0;
  while (i < canon.length) {
    if (timed[i] !== null) {
      i++;
      continue;
    }
    let r1 = i;
    while (r1 + 1 < canon.length && timed[r1 + 1] === null) {
      r1++;
    }
    let lo = i;
    let hi = r1;
    const prev = i > 0 ? timed[i - 1] : null;
    const next = r1 + 1 < canon.length ? timed[r1 + 1] : null;
    const runWeight = canon.slice(i, r1 + 1).reduce((s, c) => s + weight(c.text), 0);
    const est = runWeight * MS_PER_WEIGHT;
    let from = prev ? prev.endMs : Math.max(0, (next as Timed).startMs - est);
    let until = next ? next.startMs : Math.min(windowMs ?? Number.POSITIVE_INFINITY, (prev as Timed).endMs + est);
    if (until - from < MIN_WORD_MS * (r1 - i + 1)) {
      // Too tight: share the neighbours' spans too.
      if (prev) {
        lo = i - 1;
        from = prev.startMs;
      }
      if (next) {
        hi = r1 + 1;
        until = next.endMs;
      }
    }
    const span = canon.slice(lo, hi + 1);
    const total = span.reduce((s, c) => s + weight(c.text), 0);
    let cursor = from;
    span.forEach((c, k) => {
      const dur = ((until - from) * weight(c.text)) / total;
      const idx = lo + k;
      const wasMatched = timed[idx] !== null;
      timed[idx] = {
        startMs: Math.round(cursor),
        endMs: Math.round(cursor + dur),
        source: wasMatched ? `${(timed[idx] as Timed).source}, re-split` : "(interpolated)",
        cost: wasMatched ? (timed[idx] as Timed).cost : null,
      };
      cursor += dur;
    });
    i = r1 + 1;
  }
  // Monotonic, non-overlapping, at least 1 ms long.
  const out = timed as Timed[];
  for (let k = 0; k < out.length; k++) {
    if (k > 0 && out[k].startMs < out[k - 1].startMs) {
      out[k].startMs = out[k - 1].startMs;
    }
    if (out[k].endMs <= out[k].startMs) {
      out[k].endMs = out[k].startMs + 1;
    }
    if (k > 0 && out[k - 1].endMs > out[k].startMs) {
      out[k - 1].endMs = Math.max(out[k - 1].startMs + 1, out[k].startMs);
    }
  }
  return { timed: out, weak };
};

// ---------------------------------------------------------------------------------------------------
// Whole pipeline
// ---------------------------------------------------------------------------------------------------

type PageReport = { text: string; lines: string[]; px: number[]; startMs: number; durationMs: number; short: boolean };

type Cue = { word: string; startMs: number; absFrame: number; cueFrame: number; note: string };

type AlignResult = {
  readonly clip: string;
  readonly captions: Caption[];
  readonly pages: PageReport[];
  readonly words: { text: string; timing: Timed }[];
  readonly issues: LayoutIssue[];
  readonly weak: string[];
  readonly cues: Cue[];
  readonly ok: boolean;
};

const clipIndex = (clip: string): number => VO_IDS.indexOf(clip);

const voWindowMs = (clip: string, voAt: readonly number[]): number | null => {
  const i = clipIndex(clip);
  if (i < 0) {
    return null;
  }
  const end = i < voAt.length - 1 ? voAt[i + 1] - VO_LEAD : VO_END_LIMIT;
  return ((end - voAt[i]) / FPS) * 1000;
};

const findCues = (clip: string, words: readonly { text: string; timing: Timed }[], voAt: readonly number[]): Cue[] => {
  const cues: Cue[] = [];
  const at = voAt[clipIndex(clip)] ?? null;
  for (const w of words) {
    const key = norm(w.text);
    if (key !== "libre" && key !== "parating") {
      continue;
    }
    if (at === null) {
      cues.push({ word: key, startMs: w.timing.startMs, absFrame: NaN, cueFrame: NaN, note: "unknown clip start" });
      continue;
    }
    const absFrame = at + (w.timing.startMs / 1000) * FPS;
    if (key === "libre") {
      const beat = Math.ceil(absFrame / BEAT - 1e-9) * BEAT;
      const option = SLAM_OPTIONS.find((o) => o >= beat);
      const note =
        option === undefined
          ? `first beat ≥ word is f${beat}, AFTER both slam options (${SLAM_OPTIONS.join(", ")}): re-time scene 9`
          : option === beat
            ? `slamAt = ${option} (first beat at or after the word)`
            : `first beat ≥ word is f${beat}; nearest slam option at or after it is ${option}`;
      cues.push({ word: key, startMs: w.timing.startMs, absFrame, cueFrame: option ?? beat, note });
    } else {
      const cueFrame = Math.round(absFrame / 3) * 3;
      const ceil3 = Math.ceil(absFrame / 3 - 1e-9) * 3;
      cues.push({
        word: key,
        startMs: w.timing.startMs,
        absFrame,
        cueFrame,
        note: `scene 2 badge cue f${cueFrame} (nearest 3 f), f${ceil3} if it must not lead the word; local ${cueFrame - 135}`,
      });
    }
  }
  return cues;
};

const alignClip = ({
  clip,
  canonical,
  whisperJson,
  voAt = DEFAULT_VO_AT,
  windowMs,
}: {
  clip: string;
  canonical: string;
  whisperJson: unknown;
  voAt?: readonly number[];
  windowMs?: number | null;
}): AlignResult => {
  const windowLen = windowMs === undefined ? voWindowMs(clip, voAt) : windowMs;
  const { pages, words: canon } = parseCanonical(canonical);
  const issues = checkLayout(pages);
  const whisper = groupWhisperWords(readWhisperTokens(whisperJson));
  const moves = align(canon, whisper);
  const { timed, weak } = assignTimings(canon, whisper, moves, windowLen);
  const captions: Caption[] = canon.map((w, k) => {
    const t = timed[k];
    const lead = k === 0 ? "" : w.lineBreakBefore ? "\n" : " ";
    const c: Caption = {
      text: `${lead}${w.text}`,
      startMs: t.startMs,
      endMs: t.endMs,
      timestampMs: Math.round((t.startMs + t.endMs) / 2),
      confidence: null,
    };
    if (w.pageEnd) {
      c.pageBreakAfter = true;
    }
    return c;
  });
  const pageReports: PageReport[] = pages.map((page, p) => {
    const first = canon.findIndex((w) => w.page === p);
    const nextFirst = canon.findIndex((w) => w.page === p + 1);
    const startMs = timed[first].startMs;
    const last = p === pages.length - 1;
    const endMs = !last ? timed[nextFirst].startMs : windowLen ?? timed[timed.length - 1].endMs;
    const durationMs = endMs - startMs;
    return {
      text: page.lines.map(lineText).join(" ⏎ "),
      lines: page.lines.map(lineText),
      px: page.lines.map((l) => measureLine(l)),
      startMs,
      durationMs,
      short: durationMs < MIN_PAGE_MS,
    };
  });
  pageReports.forEach((pr, p) => {
    if (pr.short) {
      issues.push({ level: "flag", message: `page ${p + 1} "${pr.text}" is up ${(pr.durationMs / 1000).toFixed(2)} s (< 1.2 s)` });
    }
  });
  if (windowLen !== null && timed[timed.length - 1].endMs > windowLen) {
    issues.push({ level: "flag", message: `last word ends at ${timed[timed.length - 1].endMs} ms, after the clip window (${Math.round(windowLen)} ms)` });
  }
  weak.forEach((w) => issues.push({ level: "flag", message: `weak match ${w}` }));
  const words = canon.map((w, k) => ({ text: w.text, timing: timed[k] }));
  return {
    clip,
    captions,
    pages: pageReports,
    words,
    issues,
    weak,
    cues: findCues(clip, words, voAt),
    ok: !issues.some((x) => x.level === "fail"),
  };
};

const fmtS = (ms: number): string => (ms / 1000).toFixed(2);

const printReport = (r: AlignResult): void => {
  console.log(`\n== ${r.clip}: ${r.words.length} canonical words, ${r.pages.length} pages`);
  r.pages.forEach((p, i) => {
    const lines = p.lines.map((l, k) => `"${l}" ${l.length} ch ${p.px[k].toFixed(0)} px`).join(" | ");
    console.log(`  page ${i + 1}  ${fmtS(p.startMs)} s  up ${fmtS(p.durationMs)} s${p.short ? "  FLAG < 1.2 s" : ""}   ${lines}`);
  });
  r.words.forEach((w) => {
    const t = w.timing;
    console.log(`    ${w.text.padEnd(14)} ${String(t.startMs).padStart(5)}-${String(t.endMs).padEnd(5)} ms  ← ${t.source}`);
  });
  r.cues.forEach((c) => {
    console.log(`  CUE "${c.word}" starts at ${c.startMs} ms → abs f${c.absFrame.toFixed(1)} → ${c.note}`);
  });
  r.issues.forEach((x) => console.log(`  ${x.level === "fail" ? "FAIL" : "FLAG"} ${x.message}`));
  console.log(`  RESULT ${r.ok ? "OK" : "FAILED"} (${r.issues.filter((x) => x.level === "fail").length} fail, ${r.issues.filter((x) => x.level === "flag").length} flag)`);
};

// ---------------------------------------------------------------------------------------------------
// Props helpers
// ---------------------------------------------------------------------------------------------------

type PropsVo = { id: string; at: number; text: string; plate: boolean; captions: unknown[] };

const readPropsVo = (file: string): PropsVo[] => {
  const json = JSON.parse(readFileSync(file, "utf8")) as { vo?: PropsVo[] };
  if (!Array.isArray(json.vo)) {
    throw new Error(`${file} has no "vo" array`);
  }
  return json.vo;
};

// ---------------------------------------------------------------------------------------------------
// Self-test (fabricated Whisper output)
// ---------------------------------------------------------------------------------------------------

type Fixture = { clip: string; canonical: string; whisper: [string, number, number][] };

/** [text, startS, endS] in whisper-webgpu word style (leading spaces), with typical ASR misspellings. */
const FIXTURES: Fixture[] = [
  {
    clip: "vo-07",
    canonical: "Tournament naman? / Auto-call sa courts, / auto-seeded ang pools, / winners advance agad.",
    whisper: [
      [" Tournament", 0.0, 0.52], [" naman?", 0.52, 0.98],
      [" auto", 1.3, 1.55], [" call", 1.55, 1.84], [" sa", 1.84, 1.96], [" courts,", 1.96, 2.4],
      [" autoseated", 2.52, 3.18], [" pools,", 3.3, 3.7],
      [" winners", 3.82, 4.2], [" advanced", 4.2, 4.66], [" agad.", 4.66, 5.02], [" Thank you.", 5.3, 5.6],
    ],
  },
  {
    clip: "vo-09",
    canonical: "Sa waitlisted hosts: / libre lahat ng features / for one month!",
    whisper: [
      [" Sa", 0.0, 0.14], [" wait", 0.14, 0.38], [" listed", 0.38, 0.72], [" hosts:", 0.72, 1.18],
      [" Libre", 1.52, 1.86], [" lahat", 1.86, 2.2], [" nang", 2.2, 2.32], [" pitures", 2.32, 2.86],
      [" for", 2.98, 3.12], [" 1", 3.12, 3.34], [" month!", 3.34, 3.86],
    ],
  },
  {
    clip: "vo-02",
    canonical: "Kalma lang, host, / parating na ang Rallyo.",
    whisper: [
      [" Kalma", 0.0, 0.36], [" lang,", 0.36, 0.6], [" host,", 0.6, 1.02], [" darating", 1.24, 1.66],
      [" na", 1.66, 1.78], [" ang", 1.78, 1.94], [" Raleo.", 1.94, 2.6],
    ],
  },
  {
    clip: "vo-04",
    canonical: "Kita kung cash / o GCash. Approve!",
    whisper: [
      [" Kita", 0.0, 0.3], [" kong", 0.3, 0.5], [" cash", 0.5, 0.92], [" o", 1.0, 1.1], [" G", 1.1, 1.3],
      ["-Cash.", 1.3, 1.7], [" Approve!", 2.0, 2.7],
    ],
  },
  {
    clip: "vo-08",
    canonical: "Player ID, ⏎ check-in code, / kita kung saang court.",
    whisper: [
      [" Player", 0.0, 0.34], [" I", 0.34, 0.52], [" D,", 0.52, 0.78], [" chicken", 0.86, 1.3], [" code,", 1.3, 1.7],
      [" kita", 1.9, 2.14], [" kung", 2.14, 2.3], [" saan", 2.3, 2.56], [" court.", 2.56, 3.1],
    ],
  },
  {
    clip: "vo-10",
    canonical: "Coming soon sa Davao! Visit rallyo.ph, oi!",
    whisper: [
      [" Coming", 0.0, 0.3], [" soon", 0.3, 0.62], [" sa", 0.62, 0.74], [" Davao!", 0.74, 1.3], [" Visit", 1.6, 1.92],
      [" Raleo", 1.92, 2.4], [" dot", 2.4, 2.6], [" P", 2.6, 2.8], ["-H,", 2.8, 3.1], [" oy!", 3.2, 3.6],
    ],
  },
];

const fixtureJson = (f: Fixture): Caption[] =>
  f.whisper.map(([text, s, e]) => ({
    text,
    startMs: Math.round(s * 1000),
    endMs: Math.round(e * 1000),
    timestampMs: Math.round(((s + e) / 2) * 1000),
    confidence: null,
  }));

const runSelfTest = (): boolean => {
  let failures = 0;
  const check = (label: string, cond: boolean, detail = ""): void => {
    console.log(`  ${cond ? "PASS" : "FAIL"} ${label}${detail ? `  (${detail})` : ""}`);
    if (!cond) {
      failures++;
    }
  };
  const results = new Map<string, AlignResult>();
  for (const f of FIXTURES) {
    const r = alignClip({ clip: f.clip, canonical: f.canonical, whisperJson: fixtureJson(f) });
    results.set(f.clip, r);
    printReport(r);
  }
  const get = (clip: string, word: string): Timed => {
    const r = results.get(clip) as AlignResult;
    const w = r.words.find((x) => x.text === word);
    if (!w) {
      throw new Error(`${clip}: no word ${word}`);
    }
    return w.timing;
  };
  const texts = (clip: string): string[] => (results.get(clip) as AlignResult).captions.map((c) => c.text);
  const breaks = (clip: string): string[] =>
    (results.get(clip) as AlignResult).captions.filter((c) => c.pageBreakAfter).map((c) => c.text.trim());

  console.log("\n== self-test assertions");
  // vo-07
  const v7 = results.get("vo-07") as AlignResult;
  check("vo-07 layout ok", v7.ok, v7.issues.map((x) => x.message).join("; "));
  check("vo-07 canonical text kept", texts("vo-07").join("") === "Tournament naman? Auto-call sa courts, auto-seeded ang pools, winners advance agad.");
  check("vo-07 leading spaces", texts("vo-07").slice(1).every((t) => t.startsWith(" ")) && !texts("vo-07")[0].startsWith(" "));
  check("vo-07 page breaks after naman? courts, pools, agad.", breaks("vo-07").join("|") === "naman?|courts,|pools,|agad.", breaks("vo-07").join("|"));
  const autoCall = get("vo-07", "Auto-call");
  check('vo-07 "auto"+"call" → Auto-call 1300-1840', autoCall.startMs === 1300 && autoCall.endMs === 1840, `${autoCall.startMs}-${autoCall.endMs}`);
  const seeded = get("vo-07", "auto-seeded");
  check('vo-07 "autoseated" → auto-seeded 2520-3180', seeded.startMs === 2520 && seeded.endMs === 3180, `${seeded.startMs}-${seeded.endMs}`);
  const ang7 = get("vo-07", "ang");
  check('vo-07 dropped "ang" interpolated into 3180-3300', ang7.startMs === 3180 && ang7.endMs === 3300 && ang7.source === "(interpolated)", `${ang7.startMs}-${ang7.endMs} ${ang7.source}`);
  const advance = get("vo-07", "advance");
  check('vo-07 "advanced" → advance 4200-4660', advance.startMs === 4200 && advance.endMs === 4660);
  const agad = get("vo-07", "agad.");
  check('vo-07 trailing hallucination "Thank you." ignored', agad.endMs === 5020, `${agad.endMs}`);
  check("vo-07 page 1 up 1.30 s, not flagged", v7.pages[0].durationMs === 1300 && !v7.pages[0].short);
  check("vo-07 last page holds to the 5.80 s window", v7.pages[3].durationMs === 5800 - 3820, `${v7.pages[3].durationMs}`);
  // vo-09
  const v9 = results.get("vo-09") as AlignResult;
  check("vo-09 layout ok", v9.ok, v9.issues.map((x) => x.message).join("; "));
  const waitlisted = get("vo-09", "waitlisted");
  check('vo-09 "wait"+"listed" → waitlisted 140-720', waitlisted.startMs === 140 && waitlisted.endMs === 720);
  const libre = get("vo-09", "libre");
  check('vo-09 "Libre" start 1520 ms', libre.startMs === 1520);
  const ng = get("vo-09", "ng");
  check('vo-09 "nang" → ng 2200-2320', ng.startMs === 2200 && ng.endMs === 2320);
  const one = get("vo-09", "one");
  check('vo-09 "1" → one 3120-3340', one.startMs === 3120 && one.endMs === 3340);
  const features = get("vo-09", "features");
  check('vo-09 "pitures" → features', features.startMs === 2320 && features.endMs === 2860);
  const libreCue = v9.cues.find((c) => c.word === "libre");
  check("vo-09 libre cue → abs f1176.6 → slamAt 1185", !!libreCue && Math.abs(libreCue.absFrame - 1176.6) < 0.01 && libreCue.cueFrame === 1185, libreCue ? `${libreCue.absFrame.toFixed(1)} → ${libreCue.cueFrame}` : "none");
  check("vo-09 page 1 up 1.52 s", v9.pages[0].durationMs === 1520 && !v9.pages[0].short);
  // vo-02
  const v2 = results.get("vo-02") as AlignResult;
  check('vo-02 "Raleo." → Rallyo. 1940-2600', get("vo-02", "Rallyo.").startMs === 1940 && get("vo-02", "Rallyo.").endMs === 2600);
  const parCue = v2.cues.find((c) => c.word === "parating");
  check('vo-02 "darating" → parating cue 1240 ms → abs f178.2 → f177', !!parCue && parCue.startMs === 1240 && parCue.cueFrame === 177, parCue ? `${parCue.startMs} ms f${parCue.absFrame.toFixed(1)} → f${parCue.cueFrame}` : "none");
  check("vo-02 canonical spelling Rallyo kept", texts("vo-02").join("").endsWith("ang Rallyo."));
  // vo-04
  const gcash = get("vo-04", "GCash.");
  check('vo-04 " G"+"-Cash." → GCash. 1100-1700', gcash.startMs === 1100 && gcash.endMs === 1700, `${gcash.startMs}-${gcash.endMs}`);
  check('vo-04 "kong" → kung', get("vo-04", "kung").startMs === 300);
  // vo-08
  const id = get("vo-08", "ID,");
  check('vo-08 " I"+" D," → ID, 340-780', id.startMs === 340 && id.endMs === 780, `${id.startMs}-${id.endMs}`);
  check('vo-08 "chicken" → check-in 860-1300', get("vo-08", "check-in").startMs === 860);
  check('vo-08 "saan" → saang', get("vo-08", "saang").startMs === 2300);
  check("vo-08 explicit ⏎ encoded as \\n before check-in", texts("vo-08")[2] === "\ncheck-in", JSON.stringify(texts("vo-08")[2]));
  // vo-10
  const url = get("vo-10", "rallyo.ph,");
  check('vo-10 "Raleo dot P-H," → rallyo.ph, 1920-3100', url.startMs === 1920 && url.endMs === 3100, `${url.startMs}-${url.endMs}`);
  check('vo-10 "oy!" → oi!', get("vo-10", "oi!").startMs === 3200);
  check("vo-10 page over 24 chars auto-split into 2 lines", (results.get("vo-10") as AlignResult).pages[0].lines.length === 2, (results.get("vo-10") as AlignResult).pages[0].lines.join(" | "));

  // Layout gate negatives.
  console.log("\n== layout gate negatives");
  const tooLong = checkLayout(parseCanonical("Isang tap sa Share ready na ang post para sa GC ngayon na agad").pages);
  check("a page needing 3 lines fails", tooLong.some((x) => x.level === "fail"), tooLong.map((x) => x.message).join("; "));
  const longLine = checkLayout(parseCanonical("Auto-call sa lahat ng courts, ⏎ ok").pages);
  check("an explicit ⏎ line over 24 chars fails", longLine.some((x) => x.level === "fail" && x.message.includes("chars")), longLine.map((x) => x.message).join("; "));
  const widePx = checkLayout(parseCanonical("WWWWWWWWWWWW WWWWWWWWWWW").pages);
  check("a 24-char line over 750 px fails on width", widePx.some((x) => x.level === "fail" && x.message.includes("px")), widePx.map((x) => x.message).join("; "));
  const short = alignClip({
    clip: "vo-07",
    canonical: "Tournament naman? / Auto-call sa courts,",
    whisperJson: fixtureJson({ clip: "vo-07", canonical: "", whisper: [[" Tournament", 0, 0.4], [" naman?", 0.4, 0.8], [" auto", 0.9, 1.1], [" call", 1.1, 1.3], [" sa", 1.3, 1.4], [" courts,", 1.4, 1.8]] }),
  });
  check("a page up < 1.2 s is flagged, not failed", short.ok && short.pages[0].short && short.issues.some((x) => x.level === "flag" && x.message.includes("< 1.2 s")));
  let threw = false;
  try {
    alignClip({ clip: "vo-01", canonical: "Sino next?", whisperJson: [] });
  } catch {
    threw = true;
  }
  check("an empty transcript throws", threw);

  console.log(`\n== self-test ${failures === 0 ? "PASSED" : `FAILED (${failures})`}`);
  return failures === 0;
};

// ---------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------

const parseArgs = (argv: string[]): { positional: string[]; flags: Map<string, string | true> } => {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags.set(a.slice(2), next);
        i++;
      } else {
        flags.set(a.slice(2), true);
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
};

const str = (v: string | true | undefined): string | undefined => (typeof v === "string" ? v : undefined);

const main = (): number => {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  if (flags.has("self-test")) {
    return runSelfTest() ? 0 : 1;
  }
  const propsPath = str(flags.get("props")) ?? (existsSync(DEFAULT_PROPS) ? DEFAULT_PROPS : undefined);
  const propsVo = propsPath ? readPropsVo(propsPath) : null;
  const voAt = propsVo ? VO_IDS.map((id, i) => propsVo.find((v) => v.id === id)?.at ?? DEFAULT_VO_AT[i]) : DEFAULT_VO_AT;

  if (flags.has("check")) {
    if (!propsVo) {
      console.error("--check needs --props (or the default briefs/rallyo-prelaunch.props.json)");
      return 1;
    }
    let ok = true;
    console.log(`Layout check: ≤ ${MAX_CHARS} chars and ≤ ${MAX_LINE_PX} px per line (Satoshi 900, ${FONT_SIZE} px), ≤ ${MAX_LINES} lines per page`);
    for (const vo of propsVo) {
      const { pages } = parseCanonical(vo.text);
      const issues = checkLayout(pages);
      const fail = issues.some((x) => x.level === "fail");
      if (fail && vo.plate) {
        ok = false;
      }
      console.log(`\n${vo.id}${vo.plate ? "" : " (no plate)"}: ${fail ? (vo.plate ? "FAIL" : "would fail (no plate, not enforced)") : "ok"}`);
      pages.forEach((p, i) =>
        p.lines.forEach((l, k) => {
          const t = lineText(l);
          console.log(`  page ${i + 1} line ${k + 1}${p.explicit ? " ⏎" : ""}  ${String(t.length).padStart(2)} ch ${measureLine(l).toFixed(0).padStart(4)} px  "${t}"`);
        }),
      );
      issues.forEach((x) => console.log(`  ${x.level === "fail" ? "FAIL" : "FLAG"} ${x.message}`));
    }
    return ok ? 0 : 1;
  }

  const whisperPath = positional[0];
  const clip = str(flags.get("clip"));
  if (!whisperPath || !clip) {
    console.error(
      "Usage: node scripts/align-captions.mts <whisper.json> --clip vo-07 [--props <props.json>] [--text \"…\"] [--window-ms N] [--out file] [--print] [--write-props <props.json>]\n" +
        "       node scripts/align-captions.mts --check [--props <props.json>]\n" +
        "       node scripts/align-captions.mts --self-test",
    );
    return 1;
  }
  if (clipIndex(clip) < 0) {
    console.error(`--clip must be one of ${VO_IDS.join(", ")}`);
    return 1;
  }
  const canonical = str(flags.get("text")) ?? propsVo?.find((v) => v.id === clip)?.text;
  if (!canonical) {
    console.error(`No canonical text for ${clip}: pass --text or --props`);
    return 1;
  }
  const windowFlag = str(flags.get("window-ms"));
  const result = alignClip({
    clip,
    canonical,
    whisperJson: JSON.parse(readFileSync(whisperPath, "utf8")),
    voAt,
    windowMs: windowFlag ? Number(windowFlag) : undefined,
  });
  printReport(result);
  if (!result.ok) {
    return 1;
  }
  const out = str(flags.get("out")) ?? join("captions", `${clip}.aligned.json`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(result.captions, null, 2)}\n`);
  console.log(`  wrote ${result.captions.length} captions → ${out}`);
  if (flags.has("print")) {
    console.log(JSON.stringify(result.captions, null, 2));
  }
  const writeProps = str(flags.get("write-props"));
  if (writeProps) {
    const json = JSON.parse(readFileSync(writeProps, "utf8")) as { vo?: PropsVo[] };
    const entry = json.vo?.find((v) => v.id === clip);
    if (!entry) {
      console.error(`${writeProps}: no vo entry ${clip}`);
      return 1;
    }
    entry.captions = result.captions;
    writeFileSync(writeProps, `${JSON.stringify(json, null, 2)}\n`);
    console.log(`  wrote vo[${clip}].captions → ${writeProps}`);
  }
  return 0;
};

process.exitCode = main();
