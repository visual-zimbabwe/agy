import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const desktopRoot = process.cwd();
const repoRoot = path.resolve(desktopRoot, "..");
const webDistRoot = path.join(desktopRoot, ".dist", "web");
const standaloneRoot = path.join(repoRoot, ".next", "standalone");
const staticRoot = path.join(repoRoot, ".next", "static");
const publicRoot = path.join(repoRoot, "public");

async function ensureExists(targetPath) {
  try {
    await stat(targetPath);
  } catch (_error) {
    throw new Error(`Missing required build output at: ${targetPath}`);
  }
}

async function copyDir(fromPath, toPath) {
  await mkdir(path.dirname(toPath), { recursive: true });
  await cp(fromPath, toPath, { recursive: true, force: true });
}

async function main() {
  await ensureExists(standaloneRoot);
  await ensureExists(staticRoot);

  await rm(webDistRoot, { recursive: true, force: true });
  await mkdir(webDistRoot, { recursive: true });

  await copyDir(standaloneRoot, webDistRoot);
  await copyDir(staticRoot, path.join(webDistRoot, ".next", "static"));
  await copyDir(publicRoot, path.join(webDistRoot, "public"));

  console.log("Prepared packaged web runtime in .dist/web");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
