#!/usr/bin/env node
/**
 * Extract release notes for a semver from CHANGELOG.md (Keep a Changelog format).
 * Usage: node extract-changelog.mjs <version> [path/to/CHANGELOG.md]
 * Prints markdown body to stdout; exits 0 with fallback text if section missing.
 */
import fs from "node:fs";
import path from "node:path";

const version = process.argv[2]?.replace(/^v/, "");
const changelogPath = path.resolve(process.argv[3] ?? "CHANGELOG.md");

if (!version) {
  console.error("Usage: node extract-changelog.mjs <version> [CHANGELOG.md]");
  process.exit(1);
}

const fallback = `DonDon desktop release v${version}.\n\nSee repository commits for details.`;

function extractSection(source, targetVersion) {
  const headingPatterns = [
    new RegExp(`^## \\[${targetVersion.replace(/\./g, "\\.")}\\]`, "m"),
    new RegExp(`^## ${targetVersion.replace(/\./g, "\\.")}`, "m"),
    new RegExp(`^## v${targetVersion.replace(/\./g, "\\.")}`, "m"),
  ];

  let start = -1;
  for (const pattern of headingPatterns) {
    const match = source.match(pattern);
    if (match?.index != null) {
      start = match.index;
      break;
    }
  }

  if (start < 0) {
    return null;
  }

  const afterHeading = source.slice(start);
  const firstLineEnd = afterHeading.indexOf("\n");
  const body = firstLineEnd >= 0 ? afterHeading.slice(firstLineEnd + 1) : "";
  const stopPattern = /\n(?:## |\[[^\]]+\]:)/;
  const stop = body.search(stopPattern);
  const section = stop >= 0 ? body.slice(0, stop) : body;

  return section.trim();
}

try {
  if (!fs.existsSync(changelogPath)) {
    process.stdout.write(fallback);
    process.exit(0);
  }

  const content = fs.readFileSync(changelogPath, "utf8");
  const section = extractSection(content, version);
  process.stdout.write(section?.trim() || fallback);
} catch (err) {
  console.error(err);
  process.stdout.write(fallback);
}
