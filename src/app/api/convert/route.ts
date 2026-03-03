import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ConvertMode = "pdf_to_word" | "word_to_pdf";

const maxBytesPerFile = 100 * 1024 * 1024;
const allowedWordExtensions = new Set([".doc", ".docx"]);
let cachedOfficeBinary: string | null | undefined;

const candidateOfficeBinaries = [
  process.env.SOFFICE_PATH,
  process.platform === "win32" ? "soffice.exe" : "soffice",
  process.platform === "win32" ? "libreoffice.exe" : "libreoffice",
  process.platform === "win32" ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe" : undefined,
  process.platform === "win32" ? "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe" : undefined,
  process.platform === "win32" ? "C:\\Program Files\\LibreOffice\\program\\soffice.com" : undefined,
  process.platform === "win32" ? "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com" : undefined,
].filter((value): value is string => Boolean(value));

const runCommand = (command: string, args: string[], timeoutMs = 120000) =>
  new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Command timeout after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });

const tryResolveWithWhere = async (command: string) => {
  if (process.platform !== "win32") {
    return null;
  }
  try {
    const result = await runCommand("where.exe", [command], 6000);
    if (result.code !== 0) {
      return null;
    }
    const first = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    return first ?? null;
  } catch {
    return null;
  }
};

const detectOfficeBinary = async () => {
  if (cachedOfficeBinary !== undefined) {
    return cachedOfficeBinary;
  }
  for (const candidate of candidateOfficeBinaries) {
    if (path.isAbsolute(candidate)) {
      try {
        await fs.access(candidate);
        cachedOfficeBinary = candidate;
        return cachedOfficeBinary;
      } catch {
        // Continue searching.
      }
      continue;
    }
    const resolved = await tryResolveWithWhere(candidate);
    if (resolved) {
      cachedOfficeBinary = resolved;
      return cachedOfficeBinary;
    }
    try {
      const result = await runCommand(candidate, ["--version"], 8000);
      if (result.code === 0) {
        cachedOfficeBinary = candidate;
        return candidate;
      }
    } catch {
      // Try next candidate.
    }
  }
  cachedOfficeBinary = null;
  return cachedOfficeBinary;
};

const normalizeMode = (value: string): ConvertMode | null => {
  if (value === "pdf_to_word" || value === "word_to_pdf") {
    return value;
  }
  return null;
};

const outputMetaByMode: Record<ConvertMode, { ext: string; mime: string; convertTo: string }> = {
  pdf_to_word: {
    ext: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    convertTo: "docx",
  },
  word_to_pdf: {
    ext: ".pdf",
    mime: "application/pdf",
    convertTo: "pdf",
  },
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const modeRaw = formData.get("mode");
  const mode = typeof modeRaw === "string" ? normalizeMode(modeRaw) : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!mode) {
    return NextResponse.json({ error: "Invalid conversion mode." }, { status: 400 });
  }
  if (file.size > maxBytesPerFile) {
    return NextResponse.json({ error: "File exceeds the 100MB size limit." }, { status: 413 });
  }

  const inputExt = path.extname(file.name).toLowerCase();
  if (mode === "pdf_to_word" && inputExt !== ".pdf") {
    return NextResponse.json({ error: "PDF to Word requires a .pdf file." }, { status: 400 });
  }
  if (mode === "word_to_pdf" && !allowedWordExtensions.has(inputExt)) {
    return NextResponse.json({ error: "Word to PDF requires a .doc or .docx file." }, { status: 400 });
  }

  const officeBinary = await detectOfficeBinary();
  if (!officeBinary) {
    return NextResponse.json(
      {
        error:
          "Conversion engine not found. Install LibreOffice and ensure `soffice` is available on PATH, or set SOFFICE_PATH.",
      },
      { status: 503 },
    );
  }

  const meta = outputMetaByMode[mode];
  const workspace = await fs.mkdtemp(path.join(tmpdir(), "idea-wall-convert-"));
  const inputPath = path.join(workspace, file.name);
  const baseName = path.basename(file.name, inputExt);
  const outputPath = path.join(workspace, `${baseName}${meta.ext}`);

  try {
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(inputPath, Buffer.from(arrayBuffer));

    const convertResult = await runCommand(officeBinary, [
      "--headless",
      "--nologo",
      "--nolockcheck",
      "--nodefault",
      "--norestore",
      "--convert-to",
      meta.convertTo,
      "--outdir",
      workspace,
      inputPath,
    ], 180000);

    if (convertResult.code !== 0) {
      const errorText = `${convertResult.stdout}\n${convertResult.stderr}`.trim();
      const passwordHint = /password|encrypted|encryption/i.test(errorText);
      return NextResponse.json(
        {
          error: passwordHint ? "The file appears to be protected or encrypted." : "Conversion failed.",
          detail: errorText || "Unknown conversion error.",
        },
        { status: 422 },
      );
    }

    const outputBuffer = await fs.readFile(outputPath);
    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "content-type": meta.mime,
        "content-disposition": `attachment; filename="${baseName}${meta.ext}"`,
        "x-converted-filename": `${baseName}${meta.ext}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: "Conversion failed.", detail: message }, { status: 500 });
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
}
