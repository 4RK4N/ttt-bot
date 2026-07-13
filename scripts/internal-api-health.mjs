import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const configPath = path.join(process.cwd(), "data", "config.json");

function loadBootstrap() {
  const raw = JSON.parse(readFileSync(configPath, "utf8")) as Record<
    string,
    unknown
  >;
  function requiredString(key) {
    const value = raw[key];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`Missing DB config "${key}" in data/config.json.`);
    }
    return value.trim();
  }
  const portRaw = raw.dbPort;
  const port =
    typeof portRaw === "number"
      ? portRaw
      : Number.parseInt(String(portRaw ?? ""), 10);
  return {
    host: requiredString("dbHost"),
    port: Number.isInteger(port) && port > 0 ? port : 5432,
    user: requiredString("dbUser"),
    database: requiredString("dbName"),
  };
}

async function loadAppConfig(pool) {
  const result = await pool.query(
    "SELECT key, value FROM app_config WHERE key IN ('internalApiPort', 'internalApiSecret')",
  );
  const rows = Object.fromEntries(
    result.rows.map((row) => [row.key, row.value]),
  );
  const port =
    typeof rows.internalApiPort === "number" ? rows.internalApiPort : 8087;
  const secret =
    typeof rows.internalApiSecret === "string"
      ? rows.internalApiSecret.trim()
      : "";
  return { port, secret };
}

const bootstrap = loadBootstrap();
const pool = new pg.Pool(bootstrap);

try {
  const { port, secret } = await loadAppConfig(pool);
  if (!secret) {
    console.error(
      "[healthcheck] internalApiSecret is not set in app_config.",
    );
    process.exit(1);
  }

  const res = await fetch(`http://127.0.0.1:${port}/internal/health`, {
    headers: { "X-Internal-Token": secret },
  });

  if (!res.ok) {
    console.error(`[healthcheck] HTTP ${res.status}.`);
    process.exit(1);
  }

  const body = await res.json();
  process.exit(body.ok === true ? 0 : 1);
} catch (err) {
  console.error("[healthcheck] Failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
