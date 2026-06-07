---
description: Independently verify built code against the captured requirement using fresh subagents
argument-hint: [slug] [optional: file-or-folder | quick|standard|thorough|max | fresh]
---

# Independent verification against the requirement

Verify that the code matches the **original requirement** (the source of truth),
using fresh subagents that do not share the builder's assumptions.

Arguments: `$ARGUMENTS`
- First token = `<slug>` of a captured requirement (see `.claude/specs/<slug>.md`).
- Remaining tokens (OPTIONAL) = the file(s)/folder(s) where the feature was
  built. The user does NOT have to list files. They may give a folder, or leave
  it blank — in which case this command finds the relevant code itself.

If the slug is missing: if some specs exist, list `.claude/specs/*.md` and ask
which one. If there are NO specs at all, don't treat it as an error — say warmly
that nothing is captured yet, show a copy-paste starter
`/req <describe the feature in your own words>`, and offer (AskUserQuestion) to
capture the first requirement now; if yes, walk them into `/req`.

The word `fresh` anywhere in the arguments forces a full rebuild of the
behaviors and tests (otherwise existing ones are reused when still valid).

A depth word — `quick`, `standard`, `thorough`, or `max` — sets how hard the
tests probe (default **thorough**). Deeper finds more edge cases; edges that go
beyond what the requirement states are reported as ⚠️ findings, never as
failures. Pass it to the `behavior-author` and `test-author` agents.

## Tone — the "stop early" cases are NOT errors

Some normal situations stop this command before it runs: no requirement captured
yet, the requirement still in draft, or the code not built/found. NONE of these
are errors or bugs — an earlier step just hasn't happened. Never say "error", "I
can't run", "failed", or "blockers". Say it calmly as the next small step, show
the exact command to copy, and offer to do it. The user is often non-technical; a
scary message makes them think the tool is broken when it is working as intended.

## CRITICAL — keep the check independent (do not violate)

You may be the same chat that wrote this code. That makes you biased toward
believing it is correct. To keep the check independent:

- Give each subagent ONLY: the relevant file path(s) it needs. Nothing else.
- Do NOT tell any subagent what the code does, why it is correct, how you
  designed it, or what you intended. No summaries, no reasoning, no reassurance.
- Let each subagent read the files itself. Your job here is orchestration and
  reporting — NOT explaining or defending the implementation.

## Memory (so re-runs are fast and trustworthy)

Each feature keeps a tiny file `.claude/verify/<slug>/source.lock` with:
- `spec_hash:` the SHA-256 of the spec file's full contents at the time its
  behaviors/tests were last generated.
- `target:` the confirmed code location(s).
- `function:` the exact function/symbol under test, when it's a single-function
  check (blank otherwise) — makes "which check covers `foo`?" a direct lookup.
- `depth:` the depth the tests were generated at (quick/standard/thorough/max).
- `generated:` when they were generated.

This lets the command (a) remember where the code is, so the user isn't asked
again, and (b) tell whether the saved tests still match the current requirement.

## Pipeline

1. **Pre-check.** Read `.claude/specs/<slug>.md`. If `status` is not `locked`,
   this is not an error — the requirement just isn't finished. Say so calmly,
   e.g. "This requirement is still a draft — let's lock it first so the check is
   meaningful," and offer to finish it via `/req` (resolve the open questions,
   then set it to locked). Only continue once it's locked (or the user explicitly
   says to proceed anyway). Create the working dir:
   `mkdir -p .claude/verify/<slug>`. Compute the current spec hash:
   `shasum -a 256 .claude/specs/<slug>.md | cut -d' ' -f1`.

2. **Locate the code (with memory).**
   - If the user gave a path/folder on the command line, use it — and if it
     differs from the saved `target`, treat it as a correction.
   - Else if `source.lock` has a `target` that still EXISTS on disk, use it
     silently (optional one-line FYI: "checking against <target> — pass a path
     to override").
   - Else (no path given, and no valid saved target): find the code yourself
     with Grep/Glob using terms from the requirement, show the user the short
     list, and ask them to confirm or correct it BEFORE continuing. Never
     silently guess — the entire check is worthless if it runs against the wrong
     code.
   - If the search turns up nothing that matches the requirement, don't call it
     an error — it usually means the feature isn't built yet. Say that calmly and
     offer the choice: point you at the right file/folder, or build it first and
     come back. Do not run the check against unrelated code (that would produce
     misleading FAILs that just mean "this isn't the thing").
   Whatever is used becomes the "target path(s)" for the steps below. If the spec
   frontmatter has a `function:` (or the check clearly targets one
   function/symbol), note that exact name too — pass it to the agents and record
   it in `source.lock` so the check is precisely tied to that function.

   (Searching to find WHERE the code lives is fine — you are only locating
   paths. You still must not tell the subagents WHAT the code does or why.)

3. **Decide: reuse or rebuild.**
   - **Rebuild** (regenerate behaviors + tests) if ANY of: the user passed
     `fresh`; `source.lock` is missing; `behaviors.md` or `tests/` is
     missing/empty; the saved `spec_hash` ≠ the current spec hash (the
     requirement changed); or the requested depth ≠ the saved `depth` (deeper or
     shallower run requested).
   - **Otherwise REUSE** the existing behaviors and tests (fast path — the
     normal case when only the code changed, e.g. re-checking after a fix).

4. **Expected behavior (bias firewall)** — only when rebuilding. Launch the
   `behavior-author` agent and pass it ONLY the spec path. It derives expected
   behaviors from the requirement ALONE — it does not read the implementation —
   and writes them to `.claude/verify/<slug>/behaviors.md`.

5. **Tests** — only when rebuilding. Launch the `test-author` agent and pass it
   the behaviors file path and the target path(s). It writes runnable tests into
   `.claude/verify/<slug>/tests/`. It may read the code for wiring (signatures,
   imports, how to invoke) but must NOT change the expected outcomes. Pass both
   agents the depth level and the `function` name (if any) so they target the
   right symbol. After the tests exist, write `.claude/verify/<slug>/source.lock`
   with the current `spec_hash`, the `target`, the `function` (if any), the
   `depth`, and today's date.

6. **Run (checker is not the fixer).** Launch the `verifier` agent and pass it
   the spec path, the behaviors path, the tests path, and the target path(s). It
   runs the tests against the real code and RETURNS a report. It has no
   write/edit tools — it reports, it never patches. Save the returned report to
   `.claude/verify/<slug>/report.md`.

7. **Surface.** Show the user the report: each behavior as PASS / FAIL /
   MANUAL-CHECK / ERROR, mapped back to the requirement, with failing output.
   Show security behaviors (S-prefixed) in the same list, and show any static
   security advisory in its OWN block, clearly marked as NOT a pass/fail. Show any
   ⚠️ **findings** (failed `probe` behaviors — edge cases beyond what the
   requirement states) in their OWN block too, clearly marked as "worth a look,
   not failures." The feature "matches the requirement" when its functional AND
   security behaviors are clean — findings and the advisory NEVER count toward
   that, and a security check left MANUAL is not a pass.
   Do NOT fix anything yourself. If there are real failures, hand the user a
   copy-pasteable summary to take back to the builder chat, for example:

   > These behaviors don't match the requirement: <list>. Please fix.

   They can then re-run `/verify-req <slug>` (with or without a path).

## The rule that breaks ties

The requirement wins. If the code and the requirement disagree, the **code** is
wrong — do NOT change the test to match the code. The one exception: if the
*requirement itself* looks wrong or impossible, flag that to the user and stop;
do not silently paper over it.
