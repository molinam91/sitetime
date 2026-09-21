const crypto = require("crypto");

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is not set — see README.md");
  return s;
}

function hmac(input) {
  return crypto.createHmac("sha256", secret()).update(input).digest("hex");
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Session token = base64url(JSON payload with an expiry) + "." + HMAC signature of that
// payload. No external JWT library needed for something this small.
function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!timingSafeEqual(sig, hmac(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && Date.now() < exp;
  } catch (e) {
    return false;
  }
}

function isAuthed(event) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  return verifyToken(token);
}

// Used both to check a submitted PIN against the stored hash, and to compute the hash to
// store when the PIN is set/changed. Keyed off SESSION_SECRET so the stored value alone
// (e.g. if the Blobs store were ever exposed) isn't enough to derive the PIN's hash for a
// different secret, and isn't the plaintext PIN either way.
function hashPin(pin) {
  return hmac("pin:" + pin);
}

function pinMatches(pin, storedHash) {
  return timingSafeEqual(hashPin(pin), storedHash);
}

module.exports = { issueToken, verifyToken, isAuthed, hashPin, pinMatches };
