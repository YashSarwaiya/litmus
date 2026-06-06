# Litmus

An independent litmus test for AI-written code — built entirely from native
Claude Code commands and subagents, no separate app.

It checks the code Claude writes against your **original requirement**, using a
*fresh, independent* checker that doesn't share the builder's assumptions. The
builder can't pass its own homework.

## Why

When the same chat that writes code also reviews it, it tends to confirm its own
work — the wrong assumption that caused a bug is still in context during review,
so the bug slips through. This layer does the check in a fresh context, judged
against the **user's original requirement**, not the builder's description of what
it did.

## The five rules it enforces

1. **The user's original requirement is the source of truth.**
2. **The checker runs in a fresh, independent context** — it never sees the
   builder's reasoning.
3. **Expected behavior is derived from the requirement, never the code** (the
   "bias firewall").
4. **Verification uses real, executable tests** — not a model eyeballing the code.
5. **Checking and fixing stay separate** — the checker reports, it never patches.

## Install

Copy the two folders into your Claude Code config so the commands work in every
project:

```bash
cp commands/*.md ~/.claude/commands/
cp agents/*.md   ~/.claude/agents/
```

That's it — `/req`, `/verify-req`, and `/verify-all` are now available everywhere.

## Use

```
1. /req <describe a feature in your own words>   # capture the requirement (it
                                                 # also audits it for ambiguity)
2. build the feature normally
3. /verify-req <name>                            # check that one feature
   /verify-all                                   # check every feature at once
```

If a check fails, it hands you a copy-paste summary to take back to the builder
chat. Fix, then re-run.

Order is always: **`/req` → build → `/verify`.**

## What's in here

| Path | What it is |
|---|---|
| `commands/req.md` | `/req` — capture the requirement verbatim + ambiguity audit |
| `commands/verify-req.md` | `/verify-req` — verify one feature |
| `commands/verify-all.md` | `/verify-all` — verify every feature → one dashboard |
| `agents/requirement-auditor.md` | Flags vague/untestable parts of a requirement |
| `agents/behavior-author.md` | Derives expected behavior from the requirement only (never the code) |
| `agents/test-author.md` | Turns behaviors into runnable tests (reads code only for wiring) |
| `agents/verifier.md` | Runs the tests, reports pass/fail (no edit tools — can't patch) |
| `brief.md` | The original idea + design rules + open problems |
| `example/` | A worked demo (a calculator) showing the layer catch a missing requirement and pass once fixed |

## How it works (under the hood)

When you run `/verify-req`:

1. `behavior-author` reads **only your requirement** and lists what the feature
   should do.
2. `test-author` turns that into real test files.
3. `verifier` runs those tests against your actual code and reports
   PASS / FAIL / MANUAL-CHECK / ERROR.

Each step runs as a fresh subagent (isolated context), so the builder's
assumptions can't leak into the check. Per-feature memory (where the code lives +
a hash of the requirement) is stored in `.claude/verify/<name>/source.lock`, so
re-runs are instant and a changed requirement automatically rebuilds its tests.

## Security checks (the "friendly hacker")

When a requirement touches login, money, or private data, `/req` asks a few plain
questions (most importantly *"who is allowed to see what?"*) and saves your
answers as part of the requirement. Litmus then writes **attack tests** and runs
them — trying to break in the way a security researcher would:

- malicious input (injection / script / path tricks) → must be rejected
- private pages without a valid login → must be denied
- one user trying to open **another user's** data (IDOR) → must be blocked
- passwords / tokens / keys → must never leak into responses or logs

If an attack gets through → **FAIL**. Honest limits, shown clearly:

- access-control tests need you to state *who-sees-what*; if you don't, that
  check is **MANUAL**, never a silent pass.
- a dependency scan (`npm audit`) runs as a dated **advisory** that is never
  counted toward "all clear" (a clean scan is not proof of safety).
- inherently human flaws (business logic) are marked for human review.

See `example/.claude/verify/account-access/` for a worked run that catches a real
IDOR + password-leak in a sample login.

## Status

- **Phase 1 (done):** single-model verification (functional + security) — proven
  end-to-end (see `example/`).
- **Phase 2 (not built):** multiple independent models writing the expected
  behavior, keeping what they agree on and routing disagreements to the user.
  Add it only if it measurably catches bugs the single model missed.

## Prior art

Spec-first-then-check exists in GitHub Spec Kit, AWS Kiro, and Cursor Plan Mode;
multi-agent role separation in BMAD-METHOD; reference-based test checking in
DeepEval and promptfoo. The novel part here is the **independent, requirement-first
spec + fresh-context executable check** wired natively into Claude Code.
