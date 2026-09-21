const { getStore } = require("@netlify/blobs");

// A single store, multiple keys — simple JSON blobs are small enough here (menu photos are
// resized to ~380px/quality 0.55 before upload) that one key per collection is both simpler
// and, since these are plain server-side key-value writes rather than the old app's
// client-side "regenerate and republish a whole HTML page" step, still fast even as the menu
// grows.
function store() {
  return getStore({ name: "eves-sweets" });
}

async function readJSON(key, fallback) {
  const data = await store().get(key, { type: "json" });
  return data === null || data === undefined ? fallback : data;
}

function writeJSON(key, value) {
  return store().setJSON(key, value);
}

module.exports = { readJSON, writeJSON };
