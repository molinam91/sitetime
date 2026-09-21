function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function ok(body) {
  return json(200, body);
}

function badRequest(message) {
  return json(400, { error: message });
}

function unauthorized(message = "Not authorized") {
  return json(401, { error: message });
}

function serverError(message = "Something went wrong") {
  return json(500, { error: message });
}

module.exports = { json, ok, badRequest, unauthorized, serverError };
