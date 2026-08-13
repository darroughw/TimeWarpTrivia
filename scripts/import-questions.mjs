// One-time (but safe to re-run) load of data/questions-*-seed.json into
// the `questions` table added by supabase/migrations/0002_question_content.sql.
//
// The source JSON stores the answer as a `correct_answer` string, and in
// every one of the 1,389 source rows that string is options[0] — the seed
// files were hand-authored with the correct answer always written first.
// Importing that ordering as-is would put the correct answer in slot A
// for every single question in the live game. So each question's options
// are shuffled here, once, at import time, and the resulting index is
// what actually gets stored as correct_index.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

const CATEGORY_SLUGS = {
  Music: "music",
  TV: "tv",
  Movies: "movies",
  Fashion: "fashion",
  "Toys & Games": "toys-games",
  "Advertising/Commercials": "advertising-commercials",
  "Slang/Catchphrases": "slang-catchphrases",
  "Internet Memes/Internet Culture": "internet-memes",
  Sports: "sports",
  "News & Events": "news-events",
  Celebrities: "celebrities",
  "Space Race": "space-race",
};

const FILES = [
  "questions-60s-seed.json",
  "questions-70s-seed.json",
  "questions-80s-seed.json",
  "questions-90s-seed.json",
  "questions-2000s-seed.json",
  "questions-2010s-seed.json",
  "questions-west-wing-seed.json",
  "questions-fallout-seed.json",
];

function shuffleWithCorrectIndex(options, correctAnswer) {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { options: shuffled, correctIndex: shuffled.indexOf(correctAnswer) };
}

const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!rawConnectionString) {
  console.error("POSTGRES_URL_NON_POOLING (or POSTGRES_URL) is not set.");
  process.exit(1);
}
const connectionString = rawConnectionString.replace(/[?&]sslmode=[^&]*/, "");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

let inserted = 0;
let skipped = 0;

await client.query("begin");
try {
  for (const file of FILES) {
    const rows = JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));
    for (const row of rows) {
      const { options, correctIndex } = shuffleWithCorrectIndex(row.options, row.correct_answer);
      if (correctIndex === -1) throw new Error(`correct_answer not found in options: "${row.text}"`);

      // Deep Cuts rows (TIM-41) have no decade/category — the topic
      // itself is the category — and need their own ON CONFLICT target
      // since decade_id is always null there (nulls never conflict with
      // each other, so the decade-mode unique constraint can't dedupe
      // these rows; see questions_deep_cut_topic_id_text_key).
      let result;
      if (row.deep_cut_topic_label) {
        result = await client.query(
          `insert into questions (deep_cut_topic_id, text, options, correct_index, flavor_wrong)
           values ($1, $2, $3, $4, $5)
           on conflict (deep_cut_topic_id, text) do nothing`,
          [row.deep_cut_topic_label, row.text, options, correctIndex, row.flavor_wrong ?? null],
        );
      } else {
        const categoryId = CATEGORY_SLUGS[row.category_label];
        if (!categoryId) throw new Error(`Unknown category_label "${row.category_label}" in ${file}`);

        result = await client.query(
          `insert into questions (decade_id, category_id, text, options, correct_index, flavor_wrong)
           values ($1, $2, $3, $4, $5, $6)
           on conflict (decade_id, text) do nothing`,
          [row.decade_label, categoryId, row.text, options, correctIndex, row.flavor_wrong ?? null],
        );
      }
      if (result.rowCount > 0) inserted += 1;
      else skipped += 1;
    }
  }
  await client.query("commit");
} catch (err) {
  await client.query("rollback");
  throw err;
}

console.log(`Imported ${inserted} questions, skipped ${skipped} duplicates.`);
await client.end();
