const crypto = require("crypto");
const { readJSON, writeJSON } = require("./_shared/blobs");
const { isAuthed } = require("./_shared/token");
const { ok, badRequest, unauthorized, serverError } = require("./_shared/response");

const KEY = "menu";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      return ok(await readJSON(KEY, []));
    }

    if (!isAuthed(event)) return unauthorized();
    const menu = await readJSON(KEY, []);

    if (event.httpMethod === "POST") {
      const item = { ...JSON.parse(event.body || "{}"), id: crypto.randomUUID() };
      const next = [...menu, item];
      await writeJSON(KEY, next);
      return ok(item);
    }

    if (event.httpMethod === "PUT") {
      const { id, patch } = JSON.parse(event.body || "{}");
      if (!id) return badRequest("Missing id");
      let updated = null;
      const next = menu.map((m) => {
        if (m.id !== id) return m;
        updated = { ...m, ...patch };
        return updated;
      });
      if (!updated) return badRequest("Item not found");
      await writeJSON(KEY, next);
      return ok(updated);
    }

    if (event.httpMethod === "DELETE") {
      const id = (event.queryStringParameters || {}).id;
      if (!id) return badRequest("Missing id");
      await writeJSON(KEY, menu.filter((m) => m.id !== id));
      return ok({ ok: true });
    }

    return badRequest("GET, POST, PUT, or DELETE only");
  } catch (e) {
    return serverError(e.message);
  }
};
