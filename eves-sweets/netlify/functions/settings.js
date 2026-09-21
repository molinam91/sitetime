const { readJSON, writeJSON } = require("./_shared/blobs");
const { isAuthed } = require("./_shared/token");
const { ok, badRequest, unauthorized, serverError } = require("./_shared/response");

const KEY = "settings";
const DEFAULTS = {
  businessName: "My Bakery",
  whatsappNumber: "",
  currency: "$",
  deliveryFee: 0,
  logo: null,
  promoCodes: [],
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const settings = await readJSON(KEY, DEFAULTS);
      return ok({ ...DEFAULTS, ...settings });
    }
    if (event.httpMethod === "POST") {
      if (!isAuthed(event)) return unauthorized();
      const body = JSON.parse(event.body || "{}");
      await writeJSON(KEY, { ...DEFAULTS, ...body });
      return ok({ ok: true });
    }
    return badRequest("GET or POST only");
  } catch (e) {
    return serverError(e.message);
  }
};
