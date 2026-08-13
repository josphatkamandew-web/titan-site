// Runs at Netlify build time (see netlify.toml: build.command).
// Set TITAN_API_BASE in Netlify's Site settings -> Environment variables
// to your deployed backend URL, e.g. https://titan-vsa-x-api.onrender.com
// (no trailing slash). Falls back to localhost for local `netlify dev`.

const fs = require("fs");
const path = require("path");

const apiBase = process.env.TITAN_API_BASE || "http://localhost:8000";

if (!process.env.TITAN_API_BASE) {
  console.warn(
    "\n[build-config] WARNING: TITAN_API_BASE is not set. " +
    "Falling back to http://localhost:8000 — the deployed site will not " +
    "be able to reach a real backend until you set this in Netlify's " +
    "environment variables and redeploy.\n"
  );
}

const outPath = path.join(__dirname, "public", "js", "config.js");
const contents = `// AUTO-GENERATED at build time by build-config.js — do not edit directly.
window.TITAN_API_BASE = ${JSON.stringify(apiBase)};
`;

fs.writeFileSync(outPath, contents);
console.log(`[build-config] Wrote ${outPath} with TITAN_API_BASE=${apiBase}`);
