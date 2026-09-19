/**
 * One-off generator: writes drizzle/0002_seed_hce.sql from HCE reference arrays.
 * Run: node scripts/generate-hce-seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {{ ipa: string, grapheme: string, example: string } | null}[][]} */
const KEYBOARD_ROWS = [
  [
    { ipa: "p", grapheme: "P", example: "as in stop" },
    { ipa: "t", grapheme: "T", example: "as in tent" },
    { ipa: "k", grapheme: "K", example: "as in book" },
    null,
  ],
  [
    { ipa: "b", grapheme: "B", example: "as in bed" },
    { ipa: "d", grapheme: "D", example: "as in bed" },
    { ipa: "ɡ", grapheme: "G", example: "as in log" },
    null,
  ],
  [
    { ipa: "n", grapheme: "N", example: "as in thin" },
    { ipa: "m", grapheme: "M", example: "as in jam" },
    { ipa: "ŋ", grapheme: "NG", example: "as in ring" },
    null,
  ],
  [
    { ipa: "f", grapheme: "F", example: "as in fan" },
    { ipa: "s", grapheme: "S", example: "as in sun" },
    { ipa: "θ", grapheme: "TH", example: "as in thin" },
    { ipa: "ʃ", grapheme: "SH", example: "as in ship" },
  ],
  [
    { ipa: "v", grapheme: "V", example: "as in van" },
    { ipa: "z", grapheme: "Z", example: "as in zip" },
    { ipa: "ð", grapheme: "DH", example: "as in then" },
    { ipa: "ʒ", grapheme: "ZH", example: "as in measure" },
  ],
  [
    { ipa: "l", grapheme: "L", example: "as in log" },
    { ipa: "ɹ", grapheme: "R", example: "as in ring" },
    { ipa: "w", grapheme: "W", example: "as in win" },
    { ipa: "j", grapheme: "Y", example: "as in yes" },
  ],
  [
    { ipa: "h", grapheme: "H", example: "as in hat" },
    { ipa: "tʃ", grapheme: "CH", example: "as in chin" },
    { ipa: "dʒ", grapheme: "J", example: "as in jam" },
    null,
  ],
  [
    { ipa: "iː", grapheme: "EE", example: "as in street" },
    { ipa: "ɪ", grapheme: "I", example: "as in bid" },
    { ipa: "e", grapheme: "E", example: "as in bed" },
    { ipa: "eː", grapheme: "AIR", example: "as in share" },
  ],
  [
    { ipa: "æ", grapheme: "A", example: "as in bad" },
    { ipa: "ɐ", grapheme: "U", example: "as in bud" },
    { ipa: "ɐː", grapheme: "AR", example: "as in bark" },
    { ipa: "ɜː", grapheme: "ER", example: "as in bird" },
  ],
  [
    { ipa: "ʉː", grapheme: "OO", example: "as in boot" },
    { ipa: "ɔ", grapheme: "O", example: "as in log" },
    { ipa: "oː", grapheme: "OR", example: "as in fork" },
    { ipa: "ʊ", grapheme: "OO", example: "as in book" },
  ],
  [
    { ipa: "æɪ", grapheme: "AY", example: "as in bait" },
    { ipa: "ɑe", grapheme: "IE", example: "as in bike" },
    { ipa: "oɪ", grapheme: "OY", example: "as in boil" },
    { ipa: "əʉ", grapheme: "OH", example: "as in boat" },
  ],
  [
    { ipa: "æɔ", grapheme: "OW", example: "as in cloud" },
    { ipa: "ɪə", grapheme: "EAR", example: "as in beard" },
    null,
    { ipa: "ə", grapheme: "UH", example: "as in about" },
  ],
];

/** @type {[string, ...string[]][]} */
const WORDS_3 = [
  ["bed", "b", "e", "d"],
  ["bid", "b", "ɪ", "d"],
  ["bad", "b", "æ", "d"],
  ["bud", "b", "ɐ", "d"],
  ["bird", "b", "ɜː", "d"],
  ["bark", "b", "ɐː", "k"],
  ["book", "b", "ʊ", "k"],
  ["boot", "b", "ʉː", "t"],
  ["boat", "b", "əʉ", "t"],
  ["bike", "b", "ɑe", "k"],
  ["bait", "b", "æɪ", "t"],
  ["boil", "b", "oɪ", "l"],
  ["beard", "b", "ɪə", "d"],
  ["choice", "tʃ", "oɪ", "s"],
  ["thin", "θ", "ɪ", "n"],
  ["then", "ð", "e", "n"],
  ["ship", "ʃ", "ɪ", "p"],
  ["chin", "tʃ", "ɪ", "n"],
  ["jam", "dʒ", "æ", "m"],
  ["yes", "j", "e", "s"],
  ["win", "w", "ɪ", "n"],
  ["ring", "ɹ", "ɪ", "ŋ"],
  ["log", "l", "ɔ", "ɡ"],
  ["fan", "f", "æ", "n"],
  ["van", "v", "æ", "n"],
  ["sun", "s", "ɐ", "n"],
  ["zip", "z", "ɪ", "p"],
  ["gum", "ɡ", "ɐ", "m"],
  ["hat", "h", "æ", "t"],
  ["fork", "f", "oː", "k"],
];

/** @type {[string, ...string[]][]} */
const WORDS_4 = [
  ["stop", "s", "t", "ɔ", "p"],
  ["frog", "f", "ɹ", "ɔ", "ɡ"],
  ["clap", "k", "l", "æ", "p"],
  ["slip", "s", "l", "ɪ", "p"],
  ["drum", "d", "ɹ", "ɐ", "m"],
  ["grin", "ɡ", "ɹ", "ɪ", "n"],
  ["train", "t", "ɹ", "æɪ", "n"],
  ["cloud", "k", "l", "æɔ", "d"],
  ["snake", "s", "n", "æɪ", "k"],
  ["smile", "s", "m", "ɑe", "l"],
  ["milk", "m", "ɪ", "l", "k"],
  ["hand", "h", "æ", "n", "d"],
  ["tent", "t", "e", "n", "t"],
  ["jump", "dʒ", "ɐ", "m", "p"],
  ["lamp", "l", "æ", "m", "p"],
  ["bank", "b", "æ", "ŋ", "k"],
  ["frame", "f", "ɹ", "æɪ", "m"],
  ["cold", "k", "əʉ", "l", "d"],
  ["wind", "w", "ɪ", "n", "d"],
  ["soft", "s", "ɔ", "f", "t"],
  ["gift", "ɡ", "ɪ", "f", "t"],
  ["desk", "d", "e", "s", "k"],
  ["left", "l", "e", "f", "t"],
  ["pond", "p", "ɔ", "n", "d"],
  ["golf", "ɡ", "ɔ", "l", "f"],
  ["silk", "s", "ɪ", "l", "k"],
  ["great", "ɡ", "ɹ", "æɪ", "t"],
  ["crab", "k", "ɹ", "æ", "b"],
  ["plug", "p", "l", "ɐ", "ɡ"],
  ["quiz", "k", "w", "ɪ", "z"],
];

/** @type {[string, ...string[]][]} */
const WORDS_5 = [
  ["stamp", "s", "t", "æ", "m", "p"],
  ["plant", "p", "l", "æ", "n", "t"],
  ["blank", "b", "l", "æ", "ŋ", "k"],
  ["grand", "ɡ", "ɹ", "æ", "n", "d"],
  ["clamp", "k", "l", "æ", "m", "p"],
  ["twist", "t", "w", "ɪ", "s", "t"],
  ["trust", "t", "ɹ", "ɐ", "s", "t"],
  ["drink", "d", "ɹ", "ɪ", "ŋ", "k"],
  ["brisk", "b", "ɹ", "ɪ", "s", "k"],
  ["shrimp", "ʃ", "ɹ", "ɪ", "m", "p"],
  ["scrap", "s", "k", "ɹ", "æ", "p"],
  ["scribe", "s", "k", "ɹ", "ɑe", "b"],
  ["scream", "s", "k", "ɹ", "iː", "m"],
  ["splash", "s", "p", "l", "æ", "ʃ"],
  ["spring", "s", "p", "ɹ", "ɪ", "ŋ"],
  ["strap", "s", "t", "ɹ", "æ", "p"],
  ["street", "s", "t", "ɹ", "iː", "t"],
  ["scrub", "s", "k", "ɹ", "ɐ", "b"],
  ["flask", "f", "l", "ɐː", "s", "k"],
  ["clasp", "k", "l", "ɐː", "s", "p"],
  ["cleft", "k", "l", "e", "f", "t"],
  ["glint", "ɡ", "l", "ɪ", "n", "t"],
  ["blend", "b", "l", "e", "n", "d"],
  ["strain", "s", "t", "ɹ", "æɪ", "n"],
  ["thrust", "θ", "ɹ", "ɐ", "s", "t"],
  ["sprawl", "s", "p", "ɹ", "oː", "l"],
  ["scrawl", "s", "k", "ɹ", "oː", "l"],
  ["sprig", "s", "p", "ɹ", "ɪ", "ɡ"],
  ["sprout", "s", "p", "ɹ", "æɔ", "t"],
  ["smoked", "s", "m", "əʉ", "k", "t"],
];

function sqlStr(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlBreak(parts) {
  return parts.join("\n--> statement-breakpoint\n");
}

const inventory = [];
const seen = new Set();
for (const row of KEYBOARD_ROWS) {
  for (const slot of row) {
    if (!slot || seen.has(slot.ipa)) continue;
    seen.add(slot.ipa);
    inventory.push(slot);
  }
}

const phonemeInserts = inventory.map(
  (p) =>
    `INSERT INTO "phonemes" ("ipa", "grapheme", "example") VALUES (${sqlStr(p.ipa)}, ${sqlStr(p.grapheme)}, ${sqlStr(p.example)}) ON CONFLICT ("ipa") DO NOTHING;`,
);

const keyboardInserts = [];
KEYBOARD_ROWS.forEach((row, rowIndex) => {
  row.forEach((slot, colIndex) => {
    if (slot === null) {
      keyboardInserts.push(
        `INSERT INTO "keyboard_slots" ("row", "col", "phoneme_id") VALUES (${rowIndex}, ${colIndex}, NULL) ON CONFLICT ("row", "col") DO NOTHING;`,
      );
    } else {
      keyboardInserts.push(
        `INSERT INTO "keyboard_slots" ("row", "col", "phoneme_id") SELECT ${rowIndex}, ${colIndex}, "id" FROM "phonemes" WHERE "ipa" = ${sqlStr(slot.ipa)} ON CONFLICT ("row", "col") DO NOTHING;`,
      );
    }
  });
});

/** @type {[number, [string, ...string[]][]][]} */
const corpusGroups = [
  [3, WORDS_3],
  [4, WORDS_4],
  [5, WORDS_5],
];

const corpusInserts = [];
const corpusPhonemeInserts = [];
for (const [length, words] of corpusGroups) {
  for (const [english, ...ipas] of words) {
    corpusInserts.push(
      `INSERT INTO "corpus_words" ("slug", "english", "phoneme_length") VALUES (${sqlStr(english)}, ${sqlStr(english)}, ${length}) ON CONFLICT ("slug") DO NOTHING;`,
    );
    ipas.forEach((ipa, position) => {
      corpusPhonemeInserts.push(
        `INSERT INTO "corpus_word_phonemes" ("corpus_word_id", "position", "phoneme_id") SELECT cw."id", ${position}, p."id" FROM "corpus_words" cw, "phonemes" p WHERE cw."slug" = ${sqlStr(english)} AND p."ipa" = ${sqlStr(ipa)} ON CONFLICT ("corpus_word_id", "position") DO NOTHING;`,
      );
    });
  }
}

const sql = sqlBreak([
  "-- Seed HCE phoneme inventory, keyboard layout, and corpus words",
  ...phonemeInserts,
  ...keyboardInserts,
  ...corpusInserts,
  ...corpusPhonemeInserts,
]);

const outPath = path.join(__dirname, "..", "drizzle", "0002_seed_hce.sql");
fs.writeFileSync(outPath, `${sql}\n`);
console.log(`Wrote ${outPath}`);
