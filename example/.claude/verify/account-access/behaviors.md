# Expected Behaviors — account-access

Derived **only** from `/Users/YashSarwaiya1/Desktop/expect/.claude/specs/account-access.md`.
These describe what the requirement demands, not how any code is implemented.

## Source requirement (summary)
- A user logs in with email and password and then views their account.
- Login succeeds only when email + password match; otherwise it is rejected.
- A logged-in user may view ONLY their own account, never another user's.
- A user's password must never be returned to the caller or shown in any output.
- Wrong or empty email/password must be rejected (no login).

---

## Behaviors

### B1 — Successful login with matching email + password
- **behavior:** Login succeeds when the provided email and password match an existing user's credentials.
- **cases:**
  - `email="alice@example.com", password="correct-pw"` (matching record) → login succeeds (authenticated session / success result).
  - `email="bob@example.com", password="bobs-pw"` (matching record) → login succeeds.
- **testability:** auto

### B2 — Login rejected when password does not match
- **behavior:** Login is rejected when the email exists but the password is incorrect.
- **cases:**
  - `email="alice@example.com", password="wrong-pw"` → login rejected (no authenticated session).
  - `email="alice@example.com", password="Correct-Pw"` (wrong case, assuming password is case-sensitive) → login rejected.
- **testability:** auto

### B3 — Login rejected when email does not match any user
- **behavior:** Login is rejected when no user exists with the provided email.
- **cases:**
  - `email="nobody@example.com", password="anything"` → login rejected.
  - `email="ALICE@example.com", password="correct-pw"` (no exact-match record) → login rejected.
- **testability:** auto

### B4 — Login rejected when email is empty
- **behavior:** An empty email is rejected; no login occurs.
- **cases:**
  - `email="", password="correct-pw"` → login rejected.
  - `email=null/missing, password="correct-pw"` → login rejected.
- **testability:** auto

### B5 — Login rejected when password is empty
- **behavior:** An empty password is rejected; no login occurs.
- **cases:**
  - `email="alice@example.com", password=""` → login rejected.
  - `email="alice@example.com", password=null/missing` → login rejected.
- **testability:** auto

### B6 — Login rejected when both email and password are empty
- **behavior:** When both inputs are empty, login is rejected.
- **cases:**
  - `email="", password=""` → login rejected.
- **testability:** auto

### B7 — Logged-in user can view their own account
- **behavior:** After a successful login, the user can view their own account details.
- **cases:**
  - Alice logged in → view her account → returns Alice's account data.
  - Bob logged in → view his account → returns Bob's account data.
- **testability:** auto

### B8 — User cannot view another user's account
- **behavior:** A logged-in user may view ONLY their own account; any attempt to view a different user's account must be denied (never returns the other user's data).
- **cases:**
  - Alice logged in → request to view Bob's account → denied / no Bob data returned.
  - Bob logged in → request to view Alice's account → denied / no Alice data returned.
- **testability:** auto

### B9 — Password never returned to the caller
- **behavior:** A user's password (plaintext or hash) must never appear in any response returned to the caller, including the successful-login response and the account view.
- **cases:**
  - Login success response for Alice → contains no `password` field and no password value anywhere.
  - View-account response for Alice → contains no `password` field and no password value anywhere.
- **testability:** auto

### B10 — Password never shown anywhere in output
- **behavior:** The user's password must never be shown anywhere in any output (logs, error messages, serialized objects, rendered views).
- **cases:**
  - Any error message on failed login → does not echo or include the submitted/stored password.
  - Any rendered or serialized account output → does not include the password value.
- **testability:** manual (requires inspecting all output surfaces — logs, UI, errors — which a human may need to review; the response-payload portion is auto-checkable, but full coverage is manual)

---

## Coverage notes
- The requirement does not specify exact error message text, response format, session mechanism, or rate-limiting — those are intentionally NOT asserted as behaviors here to avoid inventing requirements.
- B4–B6 are explicitly implied by "Wrong or empty email/password must be rejected."
- B8 is explicitly required by "must never be able to view another user's account."
- B9/B10 both stem from "password must never be returned to the caller or shown anywhere"; split because "returned to caller" (auto) and "shown anywhere" (broader, partly manual) are distinct surfaces.
