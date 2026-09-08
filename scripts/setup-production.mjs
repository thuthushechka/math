/**
 * Provision Turso + Vercel env for math-club production.
 *
 * Usage:
 *   $env:TURSO_API_TOKEN="..."; $env:TURSO_ORG="your-org"; node scripts/setup-production.mjs
 */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@tursodatabase/api";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const DB_NAME = "math-club";
const GROUP = "default";

const apiToken = process.env.TURSO_API_TOKEN;
const org = process.env.TURSO_ORG;

if (!apiToken || !org) {
  console.error(
    "Need env vars:\n  TURSO_API_TOKEN — from https://app.turso.tech → Settings → API Tokens\n  TURSO_ORG — your organization slug (from Turso dashboard URL)"
  );
  process.exit(1);
}

const turso = createClient({ org, token: apiToken });

async function ensureDatabase() {
  try {
    const { database } = await turso.databases.retrieve(DB_NAME);
    console.log(`Database "${DB_NAME}" already exists`);
    return database;
  } catch {
    console.log(`Creating database "${DB_NAME}"...`);
    const { database } = await turso.databases.create(DB_NAME, { group: GROUP });
    return database;
  }
}

async function main() {
  const database = await ensureDatabase();
  const hostname = database.Hostname;
  const databaseUrl = `libsql://${hostname}`;

  console.log("Creating auth token...");
  const { jwt } = await turso.databases.createToken(DB_NAME, {
    expiration: "never",
    authorization: "full-access",
  });

  const sessionSecret = randomBytes(32).toString("base64");

  console.log("\n--- Credentials ---");
  console.log(`DATABASE_URL=${databaseUrl}`);
  console.log(`TURSO_AUTH_TOKEN=${jwt.slice(0, 20)}...`);
  console.log(`SESSION_SECRET=${sessionSecret.slice(0, 10)}...`);

  const setEnv = (name, value) => {
    for (const env of ["production", "preview", "development"]) {
      execSync(`npx vercel env add ${name} ${env} --force`, {
        input: value,
        stdio: ["pipe", "inherit", "inherit"],
        cwd: root,
      });
    }
  };

  console.log("\nSetting Vercel environment variables...");
  setEnv("DATABASE_URL", databaseUrl);
  setEnv("TURSO_AUTH_TOKEN", jwt);
  setEnv("SESSION_SECRET", sessionSecret);

  console.log("\nRunning migrations...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl, TURSO_AUTH_TOKEN: jwt },
    cwd: root,
  });

  console.log("\nSeeding database...");
  execSync("npm run db:seed", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl, TURSO_AUTH_TOKEN: jwt },
    cwd: root,
  });

  console.log("\nRedeploying to Vercel...");
  execSync("npx vercel deploy --prod --yes", {
    stdio: "inherit",
    cwd: root,
  });

  console.log("\nDone! Site: https://math-club-nine.vercel.app");
  console.log("Login: admin/admin or math/math14");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
