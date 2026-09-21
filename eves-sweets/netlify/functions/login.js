const { readJSON, writeJSON } = require("./_shared/blobs");
const { issueToken, hashPin, pinMatches } = require("./_shared/token");
const { ok, badRequest, unauthorized, serverError } = require("./_shared/response");

const AUTH_KEY = "auth";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return badRequest("POST only");
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return badRequest("Invalid JSON body");
  }
  const pin = (body.pin || "").toString();
  if (!pin) return badRequest("Missing pin");

  try {
    const auth = await readJSON(AUTH_KEY, null);
    if (auth && auth.pinHash) {
      if (!pinMatches(pin, auth.pinHash)) return unauthorized("Wrong PIN");
    } else {
      // First-ever login: bootstrap from the DASHBOARD_PIN env var, then persist the hash so
      // the env var is never needed again (and "Change PIN" in Settings works from here on).
      const bootstrapPin = process.env.DASHBOARD_PIN;
      if (!bootstrapPin) return serverError("DASHBOARD_PIN is not configured — see README.md");
      if (pin !== bootstrapPin) return unauthorized("Wrong PIN");
      await writeJSON(AUTH_KEY, { pinHash: hashPin(pin) });
    }
    return ok({ token: issueToken() });
  } catch (e) {
    return serverError(e.message);
  }
};
