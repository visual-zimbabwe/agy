import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const desktopRoot = process.cwd();
const repoRoot = path.resolve(desktopRoot, "..");
const sourceIcon = path.join(repoRoot, "src", "app", "favicon.ico");
const buildRoot = path.join(desktopRoot, "build");
const targetIcon = path.join(buildRoot, "icon.ico");

async function main() {
  await stat(sourceIcon);
  await mkdir(buildRoot, { recursive: true });
  await copyFile(sourceIcon, targetIcon);
  console.log("Synced desktop icon from src/app/favicon.ico to agy-studio/build/icon.ico");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
