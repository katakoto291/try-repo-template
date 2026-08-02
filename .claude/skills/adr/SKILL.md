---
name: adr
description: Draft a new Architecture Decision Record (ADR) in docs/adr/ from a design decision that was just discussed or decided in the current conversation or PR review. Use this whenever the user asks to "write an ADR", "record this decision", "document why we did X", or after a substantive technical/architectural discussion concludes with a decision (framework choice, library swap, structural change, a new convention like the exact-version-pinning or import-boundary rules already in this repo). Even if the user doesn't say "ADR" explicitly, proactively suggest running this after a decision this significant just got made. Do NOT use for trivial changes (typo fixes, formatting, routine dependency patch bumps) that don't need a documented rationale.
---

# Draft an ADR from this conversation

This repo keeps Architecture Decision Records in `docs/adr/` (see
`docs/adr/0001-record-architecture-decisions.md` for the convention this
skill follows). A plain scaffolding script (`scripts/new-adr.sh`, wired up
as `pnpm run new-adr -- "title"`) already handles the mechanical part - the
next sequence number, the filename, today's date. What it can't do is know
what was actually discussed. That's this skill's job: turn a decision that
just got made in this conversation into a properly filled-out ADR, not just
an empty template.

## When to run this

Use it right after a real decision has been reached - not just any code
change. Good signals: the user or a PR discussion settled on one approach
over alternatives, adopted or dropped a dependency/tool, changed a
convention other contributors will need to follow, or reversed an earlier
decision. If nothing was actually decided (just an exploratory question, or
a routine change with no real trade-off), don't force an ADR - say so and
skip it.

## Steps

1. **Confirm the title.** Infer a short, specific title from what was just
   decided (e.g. "Use pnpm workspaces instead of npm for the monorepo", not
   "Package manager"). If it's ambiguous, ask.

2. **Scaffold the file.** Run the existing script rather than hand-rolling
   the numbering/filename yourself - it already handles sequence numbers,
   slugs, and dates correctly, and reusing it keeps this skill from
   drifting out of sync if that logic ever changes:

   ```sh
   pnpm run new-adr -- "<title>"
   ```

   Note the path it prints.

3. **Fill in Context.** Explain what problem or discussion led here.
   Reference what was actually said in this conversation (or PR, if the
   user points you at one) - the constraints, the competing concerns, why
   this needed a decision at all. Avoid generic boilerplate; if the
   discussion surfaced a concrete failure, trade-off, or constraint, name
   it specifically.

4. **Fill in Decision.** State what was decided, plainly. If alternatives
   were discussed and rejected, say what they were and why they lost -
   that's often the most useful part of an ADR for someone reading it
   later, since it stops them from re-proposing the same rejected idea
   without knowing why it didn't work out.

5. **Fill in Consequences.** What does this make easier, what does it make
   harder, what follow-up work (if any) does it imply. Pull this from the
   conversation if trade-offs were already discussed; otherwise reason
   about it yourself, but keep it concrete rather than vague ("this may
   have some risk").

6. **Leave Status as `Proposed`** unless the user has explicitly said this
   is already settled/merged/accepted, in which case set it to `Accepted`.

7. **Show the result and stop.** Print the path and show the user the
   generated file's content before doing anything else with it (committing,
   opening a PR, etc.). This is a first draft of *their* record of *their*
   decision - they may want to adjust wording, add context you didn't have,
   or correct a detail. Don't commit or push it without them confirming
   it's accurate.

## What good output looks like

Context/Decision/Consequences should each run a few sentences to a short
paragraph - long enough to actually explain the reasoning, short enough
that someone skimming `docs/adr/` later will read it instead of skipping
it. Replace the template's placeholder comments entirely with real content;
don't leave them alongside your text. If a section genuinely has nothing to
add (e.g. no alternatives were considered), say that briefly rather than
padding it out.
