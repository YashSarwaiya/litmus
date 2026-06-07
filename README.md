# Litmus 🧪

**An independent check for AI-written code — does it actually do what you asked, and is it safe?**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-d97757.svg)](https://docs.claude.com/en/docs/claude-code)

> When an AI writes code and then checks its own work, it grades its own homework.
> **Litmus is the independent second opinion** — a fresh checker that reads *your
> requirement* (never the AI's reasoning), writes **real, runnable tests**, and
> tells you if the code truly matches.

Built from native [Claude Code](https://docs.claude.com/en/docs/claude-code) commands + subagents. No app, no service, no extra API keys.

## How it works — and *why* each step

You use three commands: `/req` → build → `/verify-req`. Here's the pipeline, and the reason each step exists:

| Step | What happens | Why it's done this way |
|---|---|---|
| **1. `/req`** | saves your requirement **word-for-word** | a summary can silently drop a part (*"…in red"*); your exact words are the source of truth |
| **2. audit** | flags vague wording before anything else | a fuzzy requirement makes a fuzzy check — fix it first |
| **3. build** | your normal Claude writes the feature | the builder and the checker must be **different**, or it grades its own homework |
| **4. behavior‑author** | lists the expected behavior from the requirement **only — never the code** | if it read the code, the tests would just copy the code's bugs (*confirmation bias*) |
| **5. test‑author** | turns that into **real, runnable test code** | running code gives a hard yes/no — not a model's opinion |
| **6. verifier** | runs the tests, reports PASS/FAIL — and has **no power to edit** | a checker that could edit might "fix" the test to make it pass; no edit power = honest report |
| **7. you** | hand failures back to the builder, re‑run | you stay in control; the loop ends when you're satisfied |

**Two decisions behind all of it:**

- **Check *after* the build, not before** — the builder never sees the tests, so *"it passed"* actually means something.
- **A fresh, isolated context for each helper** — the builder's assumptions can't leak into the check.

## What it looks like

```text
you ▸  /req a calculator that adds two numbers and shows the result in red
litmus  Saved your words. Quick check — which red? (CSS "red" is fine ✓). Locked.

you ▸  …build the calculator with Claude as usual…

you ▸  /verify-req calculator
litmus  Checked against YOUR requirement (not the code):
          ✅ adds two numbers
          ✅ result is shown
          ❌ result is NOT red        ← the part the builder forgot
        → paste to your builder: "make the result text red."

you ▸  …builder fixes it…  /verify-req calculator
litmus  ✅ all good — including red.
```

Litmus never saw the code, so it had no reason to overlook the missing red — that's the whole point.

## Quickstart

```bash
git clone https://github.com/YashSarwaiya/litmus
cp litmus/commands/*.md ~/.claude/commands/
cp litmus/agents/*.md   ~/.claude/agents/
```

Then in any project: **`/req` your feature → build it → `/verify-req`** (or `/verify-all` for every feature at once).

## How it's different

|  | Checks against | Sees the code first? | Catches "code **and** its tests both wrong"? |
|---|---|---|---|
| AI writing its own tests | what the **code does** | yes → inherits the bugs | ❌ |
| LLM‑as‑judge | a rubric (it eyeballs) | usually | ❌ no execution |
| **Litmus** | **your requirement** | **no** (blind to the code) | ✅ |

## Features

- **🔒 Security "friendly hacker"** — for login/money/private‑data features, writes attack tests (injection, missing‑auth, one user reading another's data, secret leaks).
- **🎚️ Depth dial** — `quick` → `thorough` → `max`. Deeper finds more edge cases; edges *beyond* your requirement show as ⚠️ "worth a look" findings, never false failures.
- **🚦 Never a false "all clear"** — it won't show all‑green while anything failed, errored, or was skipped.
- **🧠 Memory** — remembers where each feature's code lives; a changed requirement auto‑rebuilds its tests.

## Honest limits

- It tests **what your requirement says** — vague in, weak check out (so `/req` audits for vagueness first).
- "No bugs found" = no *known* failure — **not** "provably correct/secure," and not a replacement for a real security audit.
- Uses **one strong model** today (multi‑model cross‑check is on the roadmap).

## FAQ

**Is this just TDD?** No — in TDD the same AI writes tests and code, sharing the same blind spots. Litmus writes the tests *independently, from your requirement*.
**Does it replace my AI's tests?** No — keep those for speed; Litmus is the independent second opinion on top.
**Does my code leave my machine?** No — it runs in your own Claude Code, no external service or keys.
**Does it edit my code?** Never. It reports; you fix.
**What languages?** Any stack you can run tests in — it detects yours.

## Contributing

PRs and issues welcome. The whole tool is plain Markdown: `commands/` (the slash commands) and `agents/` (the subagents). Edit, copy into `~/.claude/`, try it. The most valuable reports: a **false alarm** (flags working code) or a **false calm** (misses a real bug).

## Prior art

Spec‑first dev exists in [Spec Kit](https://github.com/github/spec-kit) / [Kiro](https://kiro.dev/); reference‑based test checking in [DeepEval](https://github.com/confident-ai/deepeval) / [promptfoo](https://www.promptfoo.dev/). Litmus's contribution: wiring *requirement‑first, fresh‑context, executable* checking natively into Claude Code.

## License

[MIT](LICENSE) © Yash Sarwaiya
