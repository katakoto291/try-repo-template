#!/usr/bin/env sh
# Applies .github/repo-settings.json (merge options, wiki, ...) plus
# vulnerability alerts / automated security fixes to the current repo.
#
# Run this once after generating a new repository from this template.
# Requires the GitHub CLI, authenticated as someone with admin rights on
# the repo: `gh auth login` first if you haven't already.
set -eu

cd "$(dirname "$0")/.."

repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)

echo "Applying $(pwd)/.github/repo-settings.json to $repo..."
gh api -X PATCH "repos/$repo" --input .github/repo-settings.json

echo "Enabling vulnerability alerts and automated security fixes..."
gh api -X PUT "repos/$repo/vulnerability-alerts"
gh api -X PUT "repos/$repo/automated-security-fixes"

echo "Done."
