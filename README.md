# Litmus

**An independent check for AI-written code: does it actually do what you asked — and is it safe?**

Litmus is a small layer you add to [Claude Code](https://docs.claude.com/en/docs/claude-code). After the AI builds a feature, Litmus checks the code against your **original request** — using a *separate, fresh* checker that never saw the AI's reasoning and writes **real, runnable tests**.

It's the difference between *"the AI says it's done"* and *"it's actually done."*

Built entirely from native Claude Code commands and subagents. No separate app, no service, no extra API keys.

---

## The problem

When the same AI chat that writes the code also checks it, it grades its own homework:

- **It trusts its own assumptions.** The wrong assumption that caused a bug is still in its head during the review — so the bug sails right through.
- **Its tests mirror the code, not your request.** AI test-writers read the *implementation* and assert "what the code does." If the code is wrong, the test is wrong **in the same way** — and passes. (Researchers call this *confirmation bias* or *"circularity of error."*)
- **It quietly forgets parts.** Ask for *"a calculator that adds two numbers **and shows the result in red**,"* and if it forgets the red, it also forgets to **test** the red. The dropped part is never checked.
- **It skips security you didn't think to ask for.** About **45% of AI-generated code ships a known vulnerability** ([Veracode, 2025](https://www.veracode.com/)) — things like one user being able to read another user's data, or a password leaking into a response. You never wrote "block this," so it never gets built *or* tested.

The result: green checkmarks that don't actually mean the feature is right.

## What Litmus does

```
/req           say what you want, in your own words   ← this becomes the source of truth
               → build the feature normally
/verify-req    an independent checker tests the code against your words
/verify-all    do that for every feature → one dashboard
```

Under the hood, `/verify-req` runs three fresh helpers, each in an **isolated context** so they can't inherit the builder's assumptions:

1. **behavior-author** reads **only your requirement** — never the code — and lists what the feature *should* do.
2. **test-author** turns that list into **real, runnable tests**.
3. **verifier** runs the tests against your actual code and reports **PASS / FAIL / MANUAL / ERROR**. It has no edit tools — it reports, it never patches.

Because the expected behavior comes from *your words* and the checker is *blind to the code*, Litmus catches the two things self-checking misses: **code that is confidently wrong** and **the parts the builder forgot.**

## How it's different

|  | Checks against | How it decides | Sees the code first? | Catches "the code **and** its own tests are both wrong"? |
|---|---|---|---|---|
| **AI writing its own tests** (Claude, Copilot, Qodo…) | what the **code does** | runs tests it wrote *from the code* | **Yes** → inherits the code's bugs | ❌ No — the tests mirror the bug |
| **LLM-as-judge** | a prompt / rubric | a model **eyeballs** it and gives an opinion or score | Usually yes | ❌ No — subjective, no execution, no ground truth |
| **Litmus** | **your original requirement** | **runs real tests** derived from your words | **No** — the behavior author is blind to the code | ✅ Yes |

### vs. AI writing its own test cases
Tools that auto-generate tests (including Claude itself, mid-build) write them **by reading the code**. So the tests describe what the code *currently does* — they pass even when the feature is wrong, and they skip whatever the builder forgot. It's a student writing both the questions *and* the answer key.

Litmus writes its tests from your **requirement**, **blind to the code**, in a **fresh context**. It's the teacher grading against the original assignment. (The two aren't enemies — keep the AI's own tests for fast feedback; Litmus is the independent second opinion on top.)

### vs. LLM-as-judge
An LLM judge *looks* at the code or output and returns a subjective verdict ("looks good, 8/10"). No code is executed, there's no objective ground truth, and a confident-looking-but-wrong answer can talk it into a pass.

Litmus doesn't eyeball. It turns **your requirement** into concrete `input → expected output` cases and **runs them as executable tests**. The verdict is *"this test passed / failed against the real code,"* not *"a model thinks it's fine."*

## Security: a built-in "friendly hacker"

When a requirement touches **login, money, or private data**, `/req` asks a few plain questions — most importantly *"who is allowed to see what?"* — and saves your answers as part of the requirement. Litmus then writes **attack tests** and runs them, trying to break in the way a security researcher would:

- malicious input (injection / script / path tricks) → must be rejected
- private pages without a valid login → must be denied
- one user trying to open **another user's** data (IDOR) → must be blocked
- passwords / tokens / keys → must never leak into responses or logs

If an attack gets through → **FAIL**. With honest limits, shown clearly:

- access-control tests need you to state *who-sees-what*; if you don't, that check is **MANUAL**, never a silent pass.
- a dependency scan (`npm audit`) runs as a dated **advisory** that is never counted toward "all clear" — a clean scan is not proof of safety.
- inherently human flaws (business logic) are flagged for human review.

## The rules it never breaks

1. **Your original requirement is the source of truth.**
2. **The checker runs in a fresh, independent context** — it never sees the builder's reasoning.
3. **Expected behavior is derived from the requirement, never the code** (the *bias firewall*).
4. **Verification uses real, executable tests** — not a model's opinion.
5. **Checking and fixing stay separate** — the checker reports; it never patches.

And one promise on top: **it never shows "all clear" while anything failed, errored, was skipped, or was left unanswered.** No false green.

## Install

Litmus is just text files that live in your Claude Code config, so it works in every project.

```bash
git clone https://github.com/YashSarwaiya/litmus
cp litmus/commands/*.md ~/.claude/commands/
cp litmus/agents/*.md   ~/.claude/agents/
```

That's it — `/req`, `/verify-req`, and `/verify-all` are now available everywhere.

## Use

```
1. /req <describe a feature in your own words>   # captures it + audits for ambiguity
2. build the feature normally
3. /verify-req <name>                            # check that one feature
   /verify-all                                   # check every feature at once
```

If a check fails, Litmus hands you a copy-paste summary to take back to your builder chat. Fix it, then re-run. Order is always: **`/req` → build → `/verify`.**

It remembers where each feature's code lives and re-uses its tests; change a requirement and it automatically rebuilds that feature's tests (it hashes the requirement to know).

## Honest limits

Litmus is a sharp, focused tool — not a magic "is my code perfect" button.

- It tests **what your requirement says.** A vague requirement gives a weak check — which is why `/req` audits for ambiguity *before* anything is generated.
- **"No bugs found" means no *known* attack or stated behavior failed** — not "provably correct" or "provably secure." It is **not** a replacement for a professional security audit.
- It runs **one strong model** today. A multi-model cross-check (independent models that must agree) is designed but not yet built.
- Cross-feature *"breaks when combined"* checks (integration / regression across features) are partially covered by `/verify-all` re-running everything, with deeper interaction checks still on the roadmap.

## How this relates to existing ideas

Litmus stands on well-known shoulders, and is honest about it. Spec-first development exists in **GitHub Spec Kit**, **AWS Kiro**, and **BMAD**; independent "critic" review and reference-based test checking exist in research and in tools like **DeepEval** and **promptfoo**; the *"don't let the test see the code"* principle is an active research direction. Litmus's contribution is **wiring those ideas together — requirement-first, fresh-context, executable, security-aware — natively and simply inside Claude Code.**

## License

MIT.
