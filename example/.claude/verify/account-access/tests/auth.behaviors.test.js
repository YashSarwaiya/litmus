// Behavior tests for account-access.
// Source behaviors: ../behaviors.md
// Target code:       /Users/YashSarwaiya1/Desktop/expect/src/auth.js
//
// Framework: Node.js built-in test runner (node:test) + node:assert/strict.
// No dependencies to install. Requires Node >= 18 (tested on Node v20).
// Run:  node --test /Users/YashSarwaiya1/Desktop/expect/.claude/verify/account-access/tests/
//
// IMPORTANT (test-author note):
// The expected behaviors are FIXED. Where a behavior looks like it will FAIL
// against the current code (notably B8 access control and B9 password leakage),
// the test still asserts the behavior EXACTLY as required. Catching that
// mismatch is the point — do not relax these assertions.
//
// Credential note: behaviors.md uses placeholder passwords ("correct-pw", etc.).
// The intent is "matching credentials succeed / mismatching are rejected". We
// read the ACTUAL stored credentials from the in-memory module (no real data,
// no DB) so the "matching" cases test a true match, and use deliberately wrong
// values for the rejection cases.

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const auth = require("/Users/YashSarwaiya1/Desktop/expect/src/auth.js");
const { login, getAccount, users } = auth;

// --- Fixtures derived from the in-memory module (no real/external data) ---
const ALICE = users[1];
const BOB = users[2];

// Sanity guard so a fixture drift fails loudly rather than silently passing.
assert.equal(ALICE.email, "alice@example.com", "fixture: Alice email");
assert.equal(BOB.email, "bob@example.com", "fixture: Bob email");

// A login result is "rejected" if it is falsy, or not a success-shaped object.
function isRejected(result) {
  if (!result) return true;
  if (typeof result === "object" && result.ok === false) return true;
  // A success-shaped object (ok:true and/or a user payload) is NOT a rejection.
  if (typeof result === "object" && (result.ok === true || result.user)) {
    return false;
  }
  return false;
}

// A login result is "successful" if it represents an authenticated session.
function isSuccess(result) {
  return !!result && typeof result === "object" && (result.ok === true || !!result.user);
}

// Deep-scan any value for a forbidden password string anywhere inside it,
// and for any key literally named "password". Returns a list of findings.
function findPasswordLeaks(value, forbiddenStrings) {
  const findings = [];
  const seen = new Set();
  const forbidden = forbiddenStrings.filter((s) => typeof s === "string" && s.length > 0);

  function walk(node, path) {
    if (node === null || node === undefined) return;
    if (typeof node === "string") {
      for (const secret of forbidden) {
        if (node.includes(secret)) {
          findings.push(`secret value "${secret}" found at ${path}`);
        }
      }
      return;
    }
    if (typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);
    for (const key of Object.keys(node)) {
      if (key.toLowerCase() === "password") {
        findings.push(`forbidden key "password" found at ${path}.${key}`);
      }
      walk(node[key], `${path}.${key}`);
    }
  }

  walk(value, "$");
  return findings;
}

describe("B1 — Successful login with matching email + password", () => {
  test('B1: email="alice@example.com" + matching password → login succeeds', () => {
    const result = login(ALICE.email, ALICE.password);
    assert.ok(isSuccess(result), "Alice with correct password should be authenticated");
  });

  test('B1: email="bob@example.com" + matching password → login succeeds', () => {
    const result = login(BOB.email, BOB.password);
    assert.ok(isSuccess(result), "Bob with correct password should be authenticated");
  });
});

describe("B2 — Login rejected when password does not match", () => {
  test('B2: email="alice@example.com", password="wrong-pw" → rejected', () => {
    const result = login(ALICE.email, "wrong-pw");
    assert.ok(isRejected(result), "wrong password must not authenticate");
  });

  test("B2: wrong-case password (case-sensitive) → rejected", () => {
    const wrongCase = ALICE.password.toUpperCase();
    // Guard: only meaningful if toggling case actually changes the string.
    assert.notEqual(wrongCase, ALICE.password, "fixture: password must have letters");
    const result = login(ALICE.email, wrongCase);
    assert.ok(isRejected(result), "case-altered password must not authenticate");
  });
});

describe("B3 — Login rejected when email does not match any user", () => {
  test('B3: email="nobody@example.com" → rejected', () => {
    const result = login("nobody@example.com", "anything");
    assert.ok(isRejected(result), "unknown email must not authenticate");
  });

  test("B3: wrong-case email (no exact-match record) → rejected", () => {
    const wrongCaseEmail = ALICE.email.toUpperCase(); // "ALICE@EXAMPLE.COM"
    assert.notEqual(wrongCaseEmail, ALICE.email, "fixture: email must have letters");
    const result = login(wrongCaseEmail, ALICE.password);
    assert.ok(isRejected(result), "non-exact-match email must not authenticate");
  });
});

describe("B4 — Login rejected when email is empty", () => {
  test('B4: email="" → rejected', () => {
    const result = login("", ALICE.password);
    assert.ok(isRejected(result), "empty email must not authenticate");
  });

  test("B4: email=null → rejected", () => {
    const result = login(null, ALICE.password);
    assert.ok(isRejected(result), "null email must not authenticate");
  });

  test("B4: email missing (undefined) → rejected", () => {
    const result = login(undefined, ALICE.password);
    assert.ok(isRejected(result), "missing email must not authenticate");
  });
});

describe("B5 — Login rejected when password is empty", () => {
  test('B5: password="" → rejected', () => {
    const result = login(ALICE.email, "");
    assert.ok(isRejected(result), "empty password must not authenticate");
  });

  test("B5: password=null → rejected", () => {
    const result = login(ALICE.email, null);
    assert.ok(isRejected(result), "null password must not authenticate");
  });

  test("B5: password missing (undefined) → rejected", () => {
    const result = login(ALICE.email, undefined);
    assert.ok(isRejected(result), "missing password must not authenticate");
  });
});

describe("B6 — Login rejected when both email and password are empty", () => {
  test('B6: email="" password="" → rejected', () => {
    const result = login("", "");
    assert.ok(isRejected(result), "empty email+password must not authenticate");
  });
});

describe("B7 — Logged-in user can view their own account", () => {
  test("B7: Alice logged in → view her own account → returns Alice's data", () => {
    const session = login(ALICE.email, ALICE.password);
    assert.ok(isSuccess(session), "precondition: Alice must be logged in");
    const account = getAccount(ALICE.id, ALICE.id);
    assert.ok(account, "Alice should be able to view her own account");
    assert.equal(account.id, ALICE.id, "returned account is Alice's");
    assert.equal(account.email, ALICE.email, "returned account is Alice's");
  });

  test("B7: Bob logged in → view his own account → returns Bob's data", () => {
    const session = login(BOB.email, BOB.password);
    assert.ok(isSuccess(session), "precondition: Bob must be logged in");
    const account = getAccount(BOB.id, BOB.id);
    assert.ok(account, "Bob should be able to view his own account");
    assert.equal(account.id, BOB.id, "returned account is Bob's");
    assert.equal(account.email, BOB.email, "returned account is Bob's");
  });
});

describe("B8 — SECURITY: user cannot view another user's account", () => {
  // Attack tests: a logged-in user requests SOMEONE ELSE'S account.
  // The attack must FAIL — i.e. the victim's data must NOT be returned.
  test("B8: Alice logged in → requests Bob's account → denied, no Bob data", () => {
    const session = login(ALICE.email, ALICE.password);
    assert.ok(isSuccess(session), "precondition: Alice must be logged in");

    const result = getAccount(ALICE.id /* current */, BOB.id /* target = victim */);

    // Denied means: no Bob data leaks back. Acceptable: null/undefined, an
    // error/denied marker, or Alice's own account — but NEVER Bob's record.
    const leakedBob =
      !!result &&
      typeof result === "object" &&
      (result.id === BOB.id || result.email === BOB.email);

    assert.equal(
      leakedBob,
      false,
      "ACCESS CONTROL: Alice must NOT receive Bob's account data"
    );
  });

  test("B8: Bob logged in → requests Alice's account → denied, no Alice data", () => {
    const session = login(BOB.email, BOB.password);
    assert.ok(isSuccess(session), "precondition: Bob must be logged in");

    const result = getAccount(BOB.id /* current */, ALICE.id /* target = victim */);

    const leakedAlice =
      !!result &&
      typeof result === "object" &&
      (result.id === ALICE.id || result.email === ALICE.email);

    assert.equal(
      leakedAlice,
      false,
      "ACCESS CONTROL: Bob must NOT receive Alice's account data"
    );
  });
});

describe("B9 — SECURITY: password never returned to the caller", () => {
  // Attack/inspection tests: scan returned payloads for the secret value and
  // for any field named "password". Must find NEITHER.
  const allStoredPasswords = Object.values(users)
    .map((u) => u.password)
    .filter(Boolean);

  test("B9: login-success response for Alice contains no password", () => {
    const result = login(ALICE.email, ALICE.password);
    assert.ok(isSuccess(result), "precondition: Alice must be logged in");

    const leaks = findPasswordLeaks(result, allStoredPasswords);
    assert.deepEqual(
      leaks,
      [],
      `PASSWORD LEAK in login response: ${leaks.join("; ")}`
    );
  });

  test("B9: view-account response for Alice contains no password", () => {
    const session = login(ALICE.email, ALICE.password);
    assert.ok(isSuccess(session), "precondition: Alice must be logged in");

    const account = getAccount(ALICE.id, ALICE.id);
    const leaks = findPasswordLeaks(account, allStoredPasswords);
    assert.deepEqual(
      leaks,
      [],
      `PASSWORD LEAK in account view: ${leaks.join("; ")}`
    );
  });
});

describe("B10 — Password never shown anywhere in output (manual)", () => {
  // testability: manual.
  // The response-payload portion is auto-covered by B9. Full coverage requires
  // a human to inspect ALL output surfaces that B9 cannot see: server/console
  // logs, thrown error messages/stack traces, UI-rendered account views, and
  // any serialized representations (e.g. JSON sent over the wire, audit logs).
  test("B10: MANUAL — verify password appears in NO output surface", { skip: true }, () => {
    // Skipped on purpose. Manual reviewer checklist:
    //  - Failed-login error messages / thrown errors do NOT echo the submitted
    //    or stored password.
    //  - Application/console/audit logs never print the password value.
    //  - Rendered or serialized account views never include the password.
    assert.fail("manual check — should never auto-run");
  });
});
