# Litmus 🧪

**An independent check for AI-written code — does it actually do what you asked, and is it safe?**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![Built with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-d97757.svg)](https://docs.claude.com/en/docs/claude-code)

> When an AI writes code and then checks its own work, it grades its own homework.
> **Litmus is the independent second opinion** — a fresh checker that reads *your
> requirement* (never the AI's reasoning), writes **real, runnable tests**, and
> tells you whether the code actually does what you asked.

It's the difference between *"the AI says it's done"* and *"it's actually done."*

Litmus is built entirely from native [Claude Code](https://docs.claude.com/en/docs/claude-code) commands and subagents — **no separate app, no service, no extra API keys.** It's just a handful of Markdown files you drop into your config.

---

## Contents

- [The problem](#the-problem)
- [Quickstart](#quickstart)
- [See it work](#see-it-work)
- [How it works](#how-it-works)
- [How Litmus is different](#how-litmus-is-different)
- [Features](#features)
- [The rules it never breaks](#the-rules-it-never-breaks)
- [Requirements](#requirements)
- [Honest limits](#honest-limits)
- [Roadmap](#roadmap)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Prior art](#prior-art)
- [License](#license)

---

## The problem

When the same AI chat that writes the code also checks it, the check is biased:

- **It trusts its own assumptions.** The wrong assumption that caused the bug is still in its head during review — so the bug sails right through.
- **Its tests mirror the code, not your request.** AI test-writers read the *implementation* and assert "what the code does." If the code is wrong, the test is wrong **the same way** — and passes. (Researchers call this *confirmation bias* / *"circularity of error."*)
- **It quietly forgets parts.** Ask for *"a calculator that adds two numbers **and shows the result in red**,"* and if it forgets the red, it also forgets to **test** the red. The dropped part is never checked.
- **It skips security you didn't think to ask for.** Around **45% of AI-generated code ships a known vulnerability** ([Veracode, 2025](https://www.veracode.com/)) — one user reading another's data, a password leaking into a response. You never wrote "block this," so it never gets built *or* tested.

The result: green checkmarks that don't actually mean the feature is right.

## Quickstart

Litmus is just text files in your Claude Code config, so it works in **every** project.

```bash
git clone https://github.com/YashSarwaiya/litmus
cp litmus/commands/*.md ~/.claude/commands/
cp litmus/agents/*.md   ~/.claude/agents/
```

Then, in any project:

```
1. /req   <describe a feature in your own words>   # captures it + audits for ambiguity
2.        build the feature normally
3. /verify-req <name>                              # independently check that feature
   /verify-all                                     # check every feature → one dashboard
```

If a check fails, Litmus hands you a copy-paste summary to take back to your builder chat. Fix it, re-run. The order is always **`/req` → build → `/verify`.**

## See it work

Here's the canonical example. You ask for:

> *"a calculator that adds two numbers and shows the result in red."*

The AI builds it — addition works, the result renders… but it forgot the **red**. Its own tests pass (the math is right). You'd ship it.

Run `/verify-req calculator` and Litmus checks against *your words*:

```
| Behavior                          | Result |
|-----------------------------------|--------|
| adds two numbers                  | ✅ PASS |
| result is rendered                | ✅ PASS |
| result is shown in red            | ❌ FAIL |  ← caught it
```

> *"The result isn't red. `renderResult` returns `<span>5</span>` with no color.
> Please make the result text red."*

You paste that to your builder, it fixes it, you re-run → **all green.** Litmus never saw the code, so it had no reason to overlook the missing red.

**Depth, too.** Ask it to check an email validator at `thorough` and it goes past the obvious — boundary value analysis catches `a@@b.com` (double `@`), `a@b.` (nothing after the dot), and more, that a shallow `includes("@")` check waves through. (And edges you *didn't* specify are shown as ⚠️ "worth a look" notes, never false failures — see [Features](#features).)

## How it works

When you run `/verify-req`, three fresh helpers run in **isolated context** so none of them inherit the builder's assumptions:

```
your requirement ─▶ behavior-author ─▶ test-author ─▶ verifier ─▶ PASS / FAIL / report
                    (reads ONLY the     (writes real    (runs them;
                     requirement,        tests)          no edit tools —
                     never the code)                     reports, never patches)
```

1. **behavior-author** reads **only your requirement** and lists what the feature *should* do.
2. **test-author** turns that list into **real, runnable tests**.
3. **verifier** runs them against your actual code and reports **PASS / FAIL / MANUAL / ERROR**.

Because the expected behavior comes from *your words* and the checker is *blind to the code*, Litmus catches the two things self-checking misses: **code that's confidently wrong**, and **the parts the builder forgot**.

## How Litmus is different

|  | Checks against | How it decides | Sees the code first? | Catches "code **and** its tests both wrong"? |
|---|---|---|---|---|
| **AI writing its own tests** (Claude, Copilot, Qodo…) | what the **code does** | runs tests it wrote *from the code* | **Yes** → inherits the code's bugs | ❌ No — the tests mirror the bug |
| **LLM-as-judge** | a prompt / rubric | a model **eyeballs** it, gives a score | Usually | ❌ No — subjective, no execution, no ground truth |
| **Litmus** | **your original requirement** | **runs real tests** from your words | **No** — the behavior author is blind to the code | ✅ Yes |

**vs. AI writing its own tests** — those are written *by reading the code*, so they describe what it currently does (and skip what the builder forgot). It's a student writing both the questions *and* the answer key. Litmus writes its tests from your **requirement**, blind to the code — the teacher grading against the assignment. (They're not enemies: keep the AI's tests for fast feedback; Litmus is the independent layer on top.)

**vs. LLM-as-judge** — a judge *looks* and returns an opinion ("looks good, 8/10"): no execution, no ground truth, and a confident-but-wrong answer can talk it into a pass. Litmus turns your requirement into concrete `input → expected output` cases and **runs them**. The verdict is *"this test passed/failed,"* not *"a model thinks it's fine."*

## Features

- **🔒 Security "friendly hacker."** When a feature touches login, money, or private data, Litmus asks a couple of plain questions (most importantly *"who's allowed to see what?"*) and writes **attack tests** — malicious input, missing-auth, one user reading another's data (IDOR), secret leakage. If an attack gets through → FAIL. Access-control checks need you to state who-sees-what, otherwise they're MANUAL (never a silent pass); a `npm audit` dependency scan runs as a dated advisory that never counts toward "all clear."
- **🎚️ Depth dial (basic → advanced).** `quick` / `standard` / `thorough` (default) / `max`. Deeper means boundary-value analysis and adversarial inputs. Crucially, every check is tagged **stated** (from your requirement → hard PASS/FAIL) or **probe** (an edge it *inferred* → a ⚠️ finding, never a failure). So you get deep coverage **without** false alarms — the #1 cause of bogus AI tests.
- **🔎 Function-level retrieval.** For single-function checks, name the spec after the function; Litmus records the exact `function:` so *"which check covers `isProActive`?"* is a one-line lookup, both directions.
- **🚦 Never a false "all clear."** Litmus refuses to report all-green while anything failed, errored, was skipped, or was left unanswered. Skipped/manual items are always shown, never hidden.
- **🧠 Smart memory.** It remembers where each feature's code lives and reuses its tests; change a requirement and it automatically rebuilds that feature's tests (it hashes the requirement to know).

## The rules it never breaks

1. **Your original requirement is the source of truth.**
2. **The checker runs in a fresh, independent context** — it never sees the builder's reasoning.
3. **Expected behavior is derived from the requirement, never the code** (the *bias firewall*).
4. **Verification uses real, executable tests** — not a model's opinion.
5. **Checking and fixing stay separate** — the checker reports; it never patches.

…and one promise on top: **no false green.**

## Requirements

- **[Claude Code](https://docs.claude.com/en/docs/claude-code)** — Litmus is built from its native commands + subagents.
- **A way to run tests in your project** — whatever your stack uses (e.g. Node's built-in test runner, `pytest`, `go test`). Litmus detects it; if there's none, it picks the conventional one for the language.
- **No extra API keys, no external service.** It runs on the model you already use in Claude Code; your code never leaves your machine.

## Honest limits

Litmus is a sharp, focused tool — not a magic "is my code perfect" button.

- It tests **what your requirement says.** A vague requirement makes a weak check — which is why `/req` audits for ambiguity *before* anything is generated.
- **"No bugs found" means no *known* attack or stated behavior failed** — not "provably correct" or "provably secure." It is **not** a replacement for a professional security audit.
- It uses **one strong model** today (see [Roadmap](#roadmap)).
- Some things can't be auto-checked (visual/subjective, or code that needs a live external service) — those are reported as MANUAL or ERROR, never a fake pass.

## Roadmap

- ✅ **Phase 1 (done):** independent, requirement-first verification — functional + security + depth dial. Proven end-to-end.
- 🔜 **Multi-model cross-check:** a second, different-provider model writes the tests independently; keep the union of distinct checks. Research suggests a real-but-modest gain — so it'll be opt-in for high-stakes checks, not a default.
- 🔜 **"Breaks when combined":** interaction/regression checks across features (today `/verify-all` re-runs everything, which catches some of this).
- 🔜 **Trust hardening:** a second look before any FAIL is reported (kill false alarms), and stricter handling of vague requirements (kill false calm).

## FAQ

**Is this just TDD / writing tests first?**
No. In TDD the *same* developer (or AI) writes the tests and the code, so the tests carry the same assumptions. Litmus writes the tests *independently, from your requirement, after the build* — so it catches what the builder misunderstood. (More on why "after" beats "before" below.)

**Does it replace the tests my AI already writes?**
No — keep those for fast feedback. Litmus is the independent second opinion on top, for the cases where the code *and* its own tests are confidently wrong together.

**Does my code get sent anywhere?**
No. Litmus runs inside your own Claude Code session on the model you already use. No external service, no extra keys.

**Why check *after* the build, not define tests *before*?**
If the builder can see the tests and writes code to pass *those exact tests*, "it passed" means nothing. Keeping the check independent (the builder never sees it) is what makes a green result trustworthy. Litmus does capture the *goal* up front in plain words — just not the tests.

**Does it edit or fix my code?**
Never. The verifier has no edit tools by design. It reports; you (or your builder chat) fix.

**What languages does it work with?**
Any stack you can run tests in. Litmus detects your test setup, or picks the conventional one for the language.

## Contributing

Contributions are very welcome — issues, ideas, and PRs.

The entire tool is **plain Markdown**:
- `commands/` — the slash commands (`/req`, `/verify-req`, `/verify-all`).
- `agents/` — the subagents (`requirement-auditor`, `behavior-author`, `test-author`, `verifier`).

To try a change: edit the files, copy them into `~/.claude/`, and run the commands in any project. If you find a case where Litmus gives a **false alarm** (flags working code) or a **false calm** (misses a real bug), please open an issue with the requirement and the code — those are the most valuable reports.

## Prior art

Litmus stands on well-known shoulders and is honest about it. Spec-first development exists in [GitHub Spec Kit](https://github.com/github/spec-kit), [AWS Kiro](https://kiro.dev/), and BMAD; independent "critic" review and reference-based test checking exist in research and in tools like [DeepEval](https://github.com/confident-ai/deepeval) and [promptfoo](https://www.promptfoo.dev/); and *"don't let the test see the code"* is an active research direction. Litmus's contribution is **wiring those ideas together — requirement-first, fresh-context, executable, security-aware — natively and simply inside Claude Code.**

## License

[MIT](LICENSE) © Yash Sarwaiya
