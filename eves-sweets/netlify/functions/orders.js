const crypto = require("crypto");
const { readJSON, writeJSON } = require("./_shared/blobs");
const { isAuthed } = require("./_shared/token");
const { ok, badRequest, unauthorized, serverError } = require("./_shared/response");

const KEY = "orders";

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      if (!isAuthed(event)) return unauthorized();
      return ok(await readJSON(KEY, []));
    }

    if (event.httpMethod === "POST") {
      // Placing an order is the one write customers (never signed in) are allowed to make.
      // orderNumber is read-modify-write, not atomic: two orders landing in the same instant
      // could in theory get the same display number. Each order's real identity is its `id`
      // (a UUID), so a rare number collision is cosmetic, not a data problem.
      const body = JSON.parse(event.body || "{}");
      const orders = await readJSON(KEY, []);
      const orderNumber = orders.reduce((max, o) => Math.max(max, o.orderNumber || 0), 0) + 1;
      const order = {
        ...body,
        id: crypto.randomUUID(),
        orderNumber,
        placedAt: Date.now(),
        source: body.source || "customer",
      };
      await writeJSON(KEY, [...orders, order]);
      return ok({ id: order.id, orderNumber: order.orderNumber });
    }

    if (!isAuthed(event)) return unauthorized();
    const orders = await readJSON(KEY, []);

    if (event.httpMethod === "DELETE") {
      const id = (event.queryStringParameters || {}).id;
      if (!id) return badRequest("Missing id");
      await writeJSON(KEY, orders.filter((o) => o.id !== id));
      return ok({ ok: true });
    }

    return badRequest("GET, POST, or DELETE only");
  } catch (e) {
    return serverError(e.message);
  }
};
