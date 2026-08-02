#!/usr/bin/env sh
# Scaffolds a new ADR from docs/adr/template.md with the next sequence
# number and today's date.
#
# Usage: pnpm run new-adr -- "Title of the decision"
set -eu

# `pnpm run new-adr -- "title"` forwards the "--" itself as $1, unlike
# some other package managers - drop it if present so this works the
# same whether or not "--" was passed.
if [ "${1:-}" = "--" ]; then
  shift
fi

title="${1:-}"
if [ -z "$title" ]; then
  echo "Usage: pnpm run new-adr -- \"Title of the decision\"" >&2
  exit 1
fi

dir="$(dirname "$0")/../docs/adr"

last=$(find "$dir" -maxdepth 1 -type f -name '[0-9][0-9][0-9][0-9]-*.md' -exec basename {} \; | sort | tail -1 | cut -c1-4)
# Strip leading zeros first: POSIX sh arithmetic (unlike bash) has no
# "10#" radix prefix to force base-10, and a bare "0001" would otherwise
# be misread as an (invalid) octal literal.
last_num=$(echo "${last:-0}" | sed 's/^0*//')
next=$(printf "%04d" $((${last_num:-0} + 1)))

slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
file="$dir/${next}-${slug}.md"

if [ -e "$file" ]; then
  echo "$file already exists" >&2
  exit 1
fi

sed \
  -e "s/{{NUMBER}}/$next/" \
  -e "s|{{TITLE}}|$title|" \
  -e "s/{{DATE}}/$(date +%Y-%m-%d)/" \
  "$dir/template.md" > "$file"

echo "Created $file"
