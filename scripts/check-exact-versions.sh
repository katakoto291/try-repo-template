#!/usr/bin/env sh
# Checks that every NuGet <PackageVersion>/<PackageReference> version in the
# repo is pinned exactly (e.g. "8.0.29"), not a range ("[1.0.0,2.0.0)") or a
# wildcard ("1.0.*"). NuGet accepts both forms, but only an exact string
# guarantees a reproducible restore across machines/CI, same as
# check-exact-versions.mjs did for package.json's ^/~ ranges.
set -eu

cd "$(dirname "$0")/.."

matches=$(grep -rnE --include='*.props' --include='*.csproj' \
  --exclude-dir=bin --exclude-dir=obj \
  'Version="[^"]*[][()*,][^"]*"' . || true)

if [ -n "$matches" ]; then
  echo "Found non-exact NuGet package versions (ranges/wildcards):" >&2
  echo "$matches" >&2
  exit 1
fi

echo "All NuGet package versions are exact."
