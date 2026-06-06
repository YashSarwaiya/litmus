---
description: Verify EVERY captured requirement at once and produce one dashboard
argument-hint: [optional: fresh | specific slugs]
---

# Verify every feature against its requirement

Run the independent verification across **all** captured requirements in this
project (`.claude/specs/*.md`) and produce a single dashboard. This is a thin
orchestrator over `/verify-req` — same agents, same rules — looped over every
feature, then rolled up.

Arguments: `$ARGUMENTS`
- `fresh` → rebuild behaviors + tests for every feature from scratch.
- one or more `<slug>`s → only verify those features (others are not shown as
  passing — they're simply out of scope for this run).
- empty → verify all features with the smart default (reuse current tests,
  auto-rebuild only the ones whose requirement changed).

## Tone — these states are NOT errors

Several normal situations stop the run early: no requirements captured yet, a
requirement still in draft, or code not found. NONE of these are errors or bugs —
they just mean an earlier step hasn't happened yet. Never say "error", "I can't
run", "failed", or "blockers". Say it calmly as the next small step, show the
exact command to copy, and offer to do it. The user is often non-technical; a
scary message makes them think the tool is broken when it is working perfectly.

## CRITICAL — keep every check independent (do not violate)

The same independence rules as `/verify-req`, applied per feature:

- Give each subagent ONLY the relevant file path(s). Never tell a subagent what
  the code does, why it's correct, or what was intended.
- **One agent invocation never spans two features.** Run each feature's own
  `behavior-author` → `test-author` → `verifier` chain separately, so behaviors
  for one feature can never bias another.
- You orchestrate and report. You never edit source code and you never fix
  (that's the builder's job).
- The requirement wins ties. If a *requirement itself* looks wrong/impossible,
  flag that feature and stop verifying it — don't paper over it.

## The core guarantee — never a false "all clear"

The dashboard must never imply everything is fine when it isn't:

- The denominator is **every** spec. Skipped / errored features are always shown,
  never dropped or hidden.
- A feature is **PASS** only if the verifier actually ran and every `auto`
  behavior passed.
- An **empty / 0-collected test run = ERROR, not PASS.** A check that asserts
  nothing is not a pass.
- **ERROR ≠ FAIL.** ERROR = the check couldn't run (missing code, env/test
  problem) — it is NOT a verdict on the code. Propagate the verifier's own
  PASS/FAIL/MANUAL/ERROR classification verbatim; never recolor ERROR as FAIL or
  PASS.
- Overall verdict is **ALL CLEAR only if** there are zero FAIL, zero ERROR, and
  zero SKIP.

## Pipeline

1. **Enumerate.** List `.claude/specs/*.md`.

   **If there are NO specs yet** (a new project — the common first-time case):
   this is NOT an error. Respond warmly, e.g.: "Nothing to verify yet —
   `/verify-all` checks your features *after* you've written down what each one
   should do. Let's capture your first one — it takes a minute." Then:
   - Show a copy-paste starter: `/req <describe one feature in your own words>`.
   - To jog the user's memory, you MAY glance at the project and name a few
     feature areas they could describe — but do NOT write the requirement for
     them. The requirement must be the user's own words; reverse-engineering it
     from the code defeats the entire purpose (the check would just confirm the
     code against itself).
   - Then ask, via AskUserQuestion: "Capture your first requirement now?" If
     **yes**, walk them straight into `/req` instead of stopping. If **no**, stop
     politely with the starter line above. Either way, do not call this an error.

   If specific slugs were given in the arguments, restrict to those.

2. **Pre-classify each spec (read-only, no agents yet).** For each:
   - If `status` is not `locked` → **SKIP (draft)**. Record the reason; do not
     generate or run anything for it.
   - Compute the current spec hash:
     `shasum -a 256 .claude/specs/<slug>.md | cut -d' ' -f1`.
   - Read `.claude/verify/<slug>/source.lock` if present (`spec_hash`, `target`).
     - missing lock, or missing/empty `behaviors.md`/`tests/` → needs a first-run
       build.
     - saved `spec_hash` ≠ current hash, or `fresh` was passed → **stale** →
       rebuild.
     - otherwise → current (reuse tests, just re-run the verifier).
   - Validate the saved `target` path(s) still exist on disk. Missing → the
     feature needs its code location re-resolved (see step 3).

3. **Resolve missing code locations — in ONE batch.** Collect every feature that
   has no valid saved `target` (first run, or the saved path vanished). For each,
   search with Grep/Glob using terms from its requirement to propose candidates,
   then ask the user ONCE to confirm/correct them all together (don't interrupt
   per feature). Write each confirmed path into that feature's `source.lock`.
   Any feature whose location the user can't/won't confirm → **SKIP (no code)** —
   shown explicitly, never treated as passing.

4. **Per feature (serial — one at a time), run the `/verify-req` pipeline:**
   - If rebuilding (first run, stale, or `fresh`): `behavior-author` (spec path
     ONLY) → `test-author` (behaviors path + target) → after tests exist, write
     `source.lock` (current `spec_hash`, `target`, today's date).
   - Always: `verifier` (spec + behaviors + tests + target). Save the returned
     report to `.claude/verify/<slug>/report.md`.
   - If a feature's pipeline crashes (e.g. test-author fails) → mark that one
     feature **ERROR** with a short reason and CONTINUE the others. One broken
     feature must never abort the whole run.
   - Run serially by default to avoid features' tests colliding (shared ports,
     DBs, fixtures, or racing installs).

5. **Aggregate.** Reduce each feature to ONE status by reading its report:
   - **PASS** — verifier ran, ≥1 auto behavior, all auto PASS (note any manual).
   - **FAIL** — ≥1 auto behavior failed (code violates the requirement).
   - **ERROR** — verifier reported ERROR, or 0 tests ran, or code missing.
   - **SKIP** — draft/unlocked, or no confirmed code location.
   - Track the pass/fail/manual counts and the outstanding manual-check count.

6. **Write + show the dashboard.** Write it to `.claude/verify/_dashboard.md` and
   print it inline, sorted **worst-first** (FAIL → ERROR → SKIP → PASS). Use this
   shape:

   ```
   # Verification Dashboard — <project>
   Verdict: <ALL CLEAR | NEEDS ATTENTION> — A PASS · B FAIL · C ERROR · D SKIP  (N features)

   | Feature | Status | Pass | Fail | Manual | Report |
   |---------|--------|------|------|--------|--------|
   | ...     | ❌ FAIL |  8  |  3  |  0 | <slug>/report.md |
   | ...     | ⚠️ ERROR | – | – |  – | <slug>/report.md |
   | ...     | 📝 SKIP |  –  |  –  |  – | (draft — run /req) |
   | ...     | ✅ PASS | 22  |  0  |  1 | <slug>/report.md |

   Bottom line: <plain-English summary of what needs attention and what to do>.
   (Nothing was changed.)
   ```

   Use `–` (not `0`) for features that weren't run, so empty cells never read as
   "all good". For each FAIL, include below the table the copy-pasteable
   "These behaviors don't match the requirement: <list>. Please fix." handoff for
   the builder chat. For each SKIP/ERROR, say the one action that resolves it
   (lock the draft with `/req`; build/point at the code; fix the test/env).

Do NOT fix anything. Report only.
