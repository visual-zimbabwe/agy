import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/components/wall"];
const TARGET_FILE = "WallCanvas.tsx";
const MIN_CLASS_LENGTH = 40;
const MIN_DUPLICATE_COUNT = 3;
const isStrict = process.argv.includes("--strict");

const files = [];
for (const root of ROOTS) {
  walk(root);
}
files.push(join("src", "components", TARGET_FILE));

function walk(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) {
      walk(join(path, entry));
    }
    return;
  }

  if (!path.endsWith(".tsx")) {
    return;
  }

  files.push(path);
}

const classUsage = new Map();
const regexes = [/className="([^"]+)"/g, /className='([^']+)'/g, /className=\{`([^`]+)`\}/g];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const regex of regexes) {
    let match = regex.exec(source);
    while (match) {
      const className = normalize(match[1]);
      if (className.length >= MIN_CLASS_LENGTH && !className.includes("${")) {
        const entries = classUsage.get(className) ?? [];
        entries.push(file);
        classUsage.set(className, entries);
      }
      match = regex.exec(source);
    }
  }
}

const duplicates = [...classUsage.entries()]
  .map(([className, owners]) => ({ className, owners }))
  .filter((entry) => entry.owners.length >= MIN_DUPLICATE_COUNT)
  .sort((a, b) => b.owners.length - a.owners.length);

if (duplicates.length === 0) {
  console.log("No repeated long className literals found in wall surfaces.");
  process.exit(0);
}

const output = isStrict ? console.error : console.warn;
output("Duplicate className literals detected. Promote these styles into wall chrome classes:");
for (const duplicate of duplicates) {
  output(`- ${duplicate.owners.length}x: "${duplicate.className}"`);
  const uniqueOwners = [...new Set(duplicate.owners)];
  for (const owner of uniqueOwners.slice(0, 5)) {
    output(`  - ${owner}`);
  }
}
if (isStrict) {
  process.exit(1);
}
console.log("Reported duplicate wall class literals (non-blocking mode).");
process.exit(0);

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
