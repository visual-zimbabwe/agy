import { stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const requiredPaths = [
  "electron/main.cjs",
  "electron/preload.cjs",
  ".dist/web/server.js",
  ".dist/web/.next/static",
  ".dist/web/public"
];

async function main() {
  for (const relPath of requiredPaths) {
    const absPath = path.join(process.cwd(), relPath);
    try {
      await stat(absPath);
      console.log(`OK ${relPath}`);
    } catch (_error) {
      throw new Error(`Missing required artifact: ${relPath}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
