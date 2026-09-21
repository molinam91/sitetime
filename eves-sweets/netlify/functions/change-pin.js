const { writeJSON } = require("./_shared/blobs");
const { isAuthed, hashPin } = require("./_shared/token");
const { ok, badRequest, unauthorized, serverError } = require("./_shared/response");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return badRequest("POST only");
  if (!isAuthed(event)) return unauthorized();
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return badRequest("Invalid JSON body");
  }
  const newPin = (body.newPin || "").toString();
  if (newPin.length < 6) return badRequest("PIN must be at least 6 characters");
  try {
    await writeJSON("auth", { pinHash: hashPin(newPin) });
    return ok({ ok: true });
  } catch (e) {
    return serverError(e.message);
  }
};
