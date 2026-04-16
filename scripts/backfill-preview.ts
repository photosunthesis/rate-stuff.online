/**
 * One-off backfill: populate content_preview for all existing ratings.
 *
 * Run AFTER applying the migration that adds the content_preview column:
 *   pnpm db:migrate
 *   pnpm tsx scripts/backfill-preview.ts
 *
 * Requires DATABASE_URL in .env
 */

import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

// ---------------------------------------------------------------------------
// Preview generation — inline copy of generateContentPreview from rich-text.ts
// so this script has zero dependency on browser-only modules.
// ---------------------------------------------------------------------------

const INLINE_ATTRS = new Set([
  "bold",
  "italic",
  "strike",
  "underline",
  "link",
  "code",
]);

function generateContentPreview(content: string, maxLength = 200): string {
  try {
    const parsed = JSON.parse(content);
    if (!parsed.ops || !Array.isArray(parsed.ops)) return "";

    let charCount = 0;
    const previewOps: Array<{
      insert: string;
      attributes?: Record<string, unknown>;
    }> = [];

    for (const op of parsed.ops) {
      if (typeof op.insert !== "string") continue;

      const text = op.insert.replace(/\n+/g, " ");
      if (!text) continue;

      const attrs =
        op.attributes != null
          ? Object.fromEntries(
              Object.entries(op.attributes as Record<string, unknown>).filter(
                ([k]) => INLINE_ATTRS.has(k),
              ),
            )
          : undefined;
      const hasAttrs = attrs != null && Object.keys(attrs).length > 0;

      const remaining = maxLength - charCount;
      if (text.length >= remaining) {
        const truncated = `${text.slice(0, remaining).trimEnd()}...`;
        previewOps.push(
          hasAttrs
            ? { insert: truncated, attributes: attrs }
            : { insert: truncated },
        );
        break;
      }

      previewOps.push(
        hasAttrs ? { insert: text, attributes: attrs } : { insert: text },
      );
      charCount += text.length;
    }

    if (previewOps.length === 0) return "";
    return JSON.stringify({ ops: previewOps });
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Backfill
// ---------------------------------------------------------------------------

const BATCH_SIZE = 100;
const DRY_RUN = process.argv.includes("--dry-run");

async function backfill() {
  console.log(DRY_RUN ? "[DRY RUN] Fetching ratings..." : "Fetching ratings...");

  const rows = await sql<{ id: string; content: string }[]>`
    SELECT id, content
    FROM ratings
    WHERE content_preview IS NULL
    ORDER BY created_at DESC
  `;

  console.log(`Found ${rows.length} ratings without a preview`);

  if (rows.length === 0) {
    console.log("Nothing to backfill.");
    await sql.end();
    return;
  }

  if (DRY_RUN) {
    console.log("\nSample previews (first 3):");
    for (const row of rows.slice(0, 3)) {
      console.log(`\n[${row.id}]`);
      console.log("Preview:", generateContentPreview(row.content));
    }
    await sql.end();
    return;
  }

  let done = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    await sql.begin(async (tx) => {
      for (const row of batch) {
        const preview = generateContentPreview(row.content);
        await tx`
          UPDATE ratings
          SET content_preview = ${preview}
          WHERE id = ${row.id}::uuid
        `;
      }
    });

    done += batch.length;
    console.log(`Backfilled ${done} / ${rows.length}...`);
  }

  console.log(`\nDone! Backfilled ${done} ratings.`);
  await sql.end();
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
