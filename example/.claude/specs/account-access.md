---
slug: account-access
created: 2026-06-06
status: locked
---

## Requirement (verbatim — source of truth)

Let a user log in with their email and password and view their account.

## Clarifications

- Inputs: email and password.
- Login succeeds only with a matching email + password; otherwise it is rejected.

## Security expectations

(User answers to the security questions, appended verbatim.)

- Who is allowed to see what: a logged-in user may view ONLY their own account.
  They must never be able to view another user's account.
- Secrets: a user's password must never be returned to the caller or shown
  anywhere in the output.
- Wrong or empty email/password must be rejected (no login).
