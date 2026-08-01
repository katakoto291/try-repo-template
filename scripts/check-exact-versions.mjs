#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const packageJsonPaths = [".", "frontend", "backend", "shared"].map((dir) =>
  join(dir, "package.json"),
);

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const isExactVersion = (spec) => /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(spec);
const isWorkspaceProtocol = (spec) => spec.startsWith("workspace:");

let hasError = false;

for (const path of packageJsonPaths) {
  const pkg = JSON.parse(readFileSync(path, "utf8"));

  for (const field of DEPENDENCY_FIELDS) {
    const deps = pkg[field];
    if (!deps) continue;

    for (const [name, spec] of Object.entries(deps)) {
      if (isWorkspaceProtocol(spec) || isExactVersion(spec)) continue;

      console.error(
        `${path}: ${field}["${name}"] = "${spec}" is not pinned to an exact version`,
      );
      hasError = true;
    }
  }
}

if (hasError) {
  console.error(
    "\nAll dependency versions must be pinned exactly (no ^, ~, or other ranges).",
  );
  process.exit(1);
}

console.log("All dependency versions are pinned exactly.");
