const { execSync } = require("child_process");
const { existsSync, mkdirSync } = require("fs");
const path = require("path");

const dbUrl = process.env.DATABASE_URL || "file:/var/data/iso27001.db";
const dbPath = dbUrl.replace("file:", "");
const uploadDir = process.env.UPLOAD_DIR
  ? path.join(process.env.UPLOAD_DIR, "uploads")
  : "/var/data/uploads";

// Ensure directories exist
[path.dirname(dbPath), uploadDir].forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

const isNewDb = !existsSync(dbPath);

console.log("=== ISO 27001 Startup ===");
console.log(`DATABASE_URL: ${dbUrl}`);
console.log(`Upload dir: ${uploadDir}`);
console.log(`New database: ${isNewDb}`);

try {
  console.log("Syncing database schema...");
  execSync("./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  if (isNewDb) {
    console.log("Seeding initial data...");
    execSync(
      `./node_modules/.bin/ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts`,
      {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: dbUrl },
      }
    );
    console.log("Seed complete.");
  }
} catch (err) {
  console.error("Startup error:", err.message);
  process.exit(1);
}

const port = process.env.PORT || 8080;
console.log(`Starting Next.js on port ${port}...`);

process.env.PORT = String(port);
execSync(`./node_modules/.bin/next start -p ${port}`, { stdio: "inherit" });
