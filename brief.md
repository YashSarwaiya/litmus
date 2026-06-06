# Independent Verification Layer for AI-Written Code

> A project brief to hand to Claude Code. Contains my original idea (in my own
> words) and the refined design with rules, open problems, and build order.

---

## My original idea (raw, in my own words)

I'm using Claude Code and it developed one functionality. Now what I want to do
is: I'll call some tool and give it some context about what the current function
is for and how it's wired. That tool sends the context to multiple models, and
they all return the expected behaviour. Then I pass that to a new Claude Code
chat to check the actual code against the expected behaviour. If it doesn't
match, show the user "this isn't working" — so the user can go back to the old
Claude Code chat and say "fix this."

The reason for using a separate/new chat instead of the same one: the chat that
wrote the code is biased toward thinking its own code is correct, so it won't
catch its own mistakes. A fresh chat doesn't carry that baggage.

Important correction I worked out: the context I send must include the
**original user requirement** (e.g. "build a calculator that adds two numbers
AND shows the result in red"), not just Claude's summary of what it built —
because Claude's summary can silently forget parts (like "red"), and any part
the summary forgets will never get tested. So Claude adds a little wiring
context, but the user requirement is the boss.

---

## Goal

Catch bugs in code that Claude Code writes, by checking it with a *separate*
process that doesn't share the builder's assumptions. The builder and the
checker must stay independent.

## The problem I'm solving

When the same chat that writes code also checks it, it tends to confirm its own
work — the same wrong assumption that caused a bug is sitting in context during
the review, so the bug slips through. I want the check done fresh, and judged
against the **original user requirement**, not against the builder's description
of what it did.

## The flow

1. A builder chat (Claude Code) implements a function.
2. A tool gathers context: the **original user requirement** (the source of
   truth) plus the **actual code** and how it's wired (file, function name,
   dependencies). The requirement is primary; the wiring notes are only for
   navigation.
3. That package goes to one or more models, which each independently write the
   **expected behavior** of the function — derived from the user requirement,
   not from the builder's recap.
4. The expected behavior is turned into **runnable tests** (not just prose
   opinions).
5. A **new, fresh** Claude Code chat runs the tests against the real code.
6. If tests fail → surface to the user: "this isn't matching the requirement,"
   with which behavior failed.
7. User sends the failure back to the original builder chat to fix. Re-run the
   check.

## Hard design rules (these are the point — don't violate them)

- The **user's original requirement is the source of truth.** If the builder's
  context and the requirement ever disagree, the requirement wins.
- The checker must be a **fresh context** — it must not see the builder's
  reasoning about why the code is correct.
- Expected behavior must be derived from the **requirement**, never from the
  builder's summary (the builder can silently forget parts, and forgotten parts
  never get tested).
- Verification must use **executable tests**, not a model eyeballing the code
  and giving an opinion.
- Keep **checking and fixing separate** — the checker reports failures, it does
  not patch.

## Open problems I still need to solve (don't pretend these are done)

- **Merge problem:** if multiple models produce different expected behaviors,
  how do I decide what's correct without reintroducing a single point of
  failure? (Idea: keep what they agree on, route disagreements to the user.)
- **Context leak:** the builder's wiring notes still carry some of its
  assumptions. How do I gather just enough to navigate the code without nudging
  the checker?
- **Loop control:** what stops infinite fix→check→fix ping-pong, and what
  happens if the *checker* is wrong and the code was actually fine? Need a human
  gate or confidence signal.
- **Bad requirement:** if the user's requirement is vague, the whole system
  produces confident nonsense. May need a step that flags ambiguous
  requirements before generating behavior.

## Build order (cheapest-first — prove it before scaling)

- **Phase 1:** ONE strong model writes expected behavior from the requirement →
  fresh chat generates and runs tests → human decides on failures. Get this
  solid first.
- **Phase 2:** only after Phase 1 works, add a 2nd and 3rd model and **measure**
  whether they catch bugs the single model missed. If they don't, drop the
  multi-model idea.

## What already exists (so I don't rebuild it)

Spec-first-then-check is already shipping in GitHub Spec Kit, AWS Kiro, and
Cursor Plan Mode. Multi-agent role separation exists in BMAD-METHOD.
Reference-based checking with tests exists in DeepEval and promptfoo. My only
novel part is the **multi-model independent spec** step — so I should consider
building on top of one of these rather than from scratch, and focus my effort on
the novel part.
