---
description: Capture the original requirement verbatim as the source of truth, then audit it for ambiguity
argument-hint: [the requirement, in your own words]
---

# Capture the requirement as the source of truth

The text below is the user's ORIGINAL requirement. It is the single source of
truth for verification. Treat it as sacred.

Requirement (verbatim):
$ARGUMENTS

## Rules (do not violate)

- Store the requirement **verbatim**. Do NOT paraphrase, summarize, "clean up",
  reorder, or reinterpret it. A summary silently drops parts (e.g. "...and show
  the result in red"), and any dropped part will never be tested.
- Do NOT generate expected behavior or tests in this command. This step only
  captures and audits the requirement.
- If `$ARGUMENTS` is empty, ask the user to paste the full requirement, then
  proceed with what they give you.

## Steps

1. Derive a short, stable kebab-case `<slug>` from the requirement (e.g.
   `calculator-add-red`). Keep it memorable; the user will reuse it in
   `/verify-req <slug>`.

2. Create the spec file at `.claude/specs/<slug>.md` (run `mkdir -p
   .claude/specs` first if needed) with EXACTLY this shape:

   ```
   ---
   slug: <slug>
   created: <today's date, YYYY-MM-DD>
   status: draft
   ---

   ## Requirement (verbatim — source of truth)

   <the user's requirement, character-for-character as given>

   ## Clarifications

   _(none yet)_
   ```

3. Launch the `requirement-auditor` agent and pass it ONLY the path to the spec
   file. It returns clarifying questions for any ambiguous, vague, or untestable
   parts. It must not rewrite the requirement or generate behaviors.

4. If the auditor returns blocking ambiguities, surface them to the user (use
   AskUserQuestion for focused choices where it fits). Append the user's answers
   **verbatim** under the `## Clarifications` section — append only; never edit
   the original requirement text above it.

5. When there are no blocking ambiguities (or the user is satisfied that the
   remaining ones are acceptable), set `status: locked` in the frontmatter.

6. Tell the user the `<slug>` and that once the code is built they can run
   `/verify-req <slug>` to check it against this requirement (no file path
   needed — it finds and remembers the code).

7. If a spec with this `<slug>` already existed and you changed it (the user is
   editing a requirement, not creating a new one), tell them their saved
   verification for this feature is now out of date — the next `/verify-req
   <slug>` or `/verify-all` run will automatically rebuild its tests from the
   updated requirement. Do NOT touch `.claude/verify/<slug>/` yourself; the
   changed requirement is detected automatically by its content hash.
