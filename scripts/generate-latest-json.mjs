#!/usr/bin/env node
/**
 * Build Tauri updater latest.json from GitHub release assets (Phase 2 fallback
 * when TAURI_SIGNING_PRIVATE_KEY is not configured — signatures stay empty).
 *
 * Usage:
 *   node generate-latest-json.mjs \
 *     --version 0.2.0 \
 *     --tag v0.2.0 \
 *     --notes-file release-notes.md \
 *     --assets-json assets.json \
 *     --output latest.json
 *
 * assets.json: array of { name, browser_download_url } from gh api.
 */
import fs from "node:fs";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    args[name] = argv[i + 1];
    i += 1;
  }
  return args;
}

function platformKey(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".sig")) return null;

  if (lower.includes("aarch64") && (lower.endsWith(".dmg") || lower.endsWith(".app.tar.gz"))) {
    return "darwin-aarch64";
  }
  if (
    (lower.includes("x64") || lower.includes("x86_64") || lower.includes("_64")) &&
    lower.endsWith(".dmg")
  ) {
    return "darwin-x86_64";
  }
  if (lower.endsWith("-setup.exe") || lower.endsWith("_x64-setup.exe")) {
    return "windows-x86_64";
  }
  if (lower.endsWith(".msi")) {
    return "windows-x86_64";
  }
  if (lower.endsWith(".dmg") && !lower.includes("aarch64")) {
    return "darwin-aarch64";
  }
  return null;
}

function readSignature(assets, installerName) {
  const sigName = `${installerName}.sig`;
  const sig = assets.find((a) => a.name === sigName);
  if (!sig?.browser_download_url) return "";
  try {
    // Caller should embed signature content; gh download happens in workflow.
    return sig.signatureContent ?? "";
  } catch {
    return "";
  }
}

const args = parseArgs(process.argv);
const version = args.version?.replace(/^v/, "");
const notesFile = args["notes-file"];
const assetsFile = args["assets-json"];
const output = args.output ?? "latest.json";

if (!version || !assetsFile) {
  console.error(
    "Required: --version, --assets-json. Optional: --notes-file, --output, --tag",
  );
  process.exit(1);
}

const notes = notesFile && fs.existsSync(notesFile)
  ? fs.readFileSync(notesFile, "utf8").trim()
  : `DonDon v${version}`;

/** @type {{ name: string, browser_download_url: string, signatureContent?: string }[]} */
const assets = JSON.parse(fs.readFileSync(assetsFile, "utf8"));

const platforms = {};
for (const asset of assets) {
  const key = platformKey(asset.name);
  if (!key || platforms[key]) continue;
  platforms[key] = {
    url: asset.browser_download_url,
    signature: readSignature(assets, asset.name),
  };
}

const manifest = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms,
};

fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${output} with platforms: ${Object.keys(platforms).join(", ") || "(none)"}`);
