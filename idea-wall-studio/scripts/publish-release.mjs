import { spawn } from "node:child_process";
import process from "node:process";

const publishUrl = process.env.IDEA_WALL_AUTO_UPDATE_URL;

if (!publishUrl) {
  console.error("IDEA_WALL_AUTO_UPDATE_URL is required for dist:publish.");
  process.exit(1);
}

const args = [
  "electron-builder",
  "--publish",
  "always",
  "-c.publish.provider=generic",
  `-c.publish.url=${publishUrl}`
];

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", args, {
  stdio: "inherit",
  shell: false
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
