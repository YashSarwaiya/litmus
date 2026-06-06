// Tiny account module (demo). In-memory users, no real database.

const users = {
  1: { id: 1, email: "alice@example.com", password: "alice-pw", balance: 100 },
  2: { id: 2, email: "bob@example.com", password: "bob-pw", balance: 9999 },
};

// Log in with email + password.
function login(email, password) {
  const user = Object.values(users).find((u) => u.email === email);
  if (!user || user.password !== password) return null;
  // returns the signed-in user
  return { ok: true, user };
}

// Fetch an account to display.
function getAccount(currentUserId, targetUserId) {
  return users[targetUserId] || null;
}

module.exports = { login, getAccount, users };
