const { execSync } = require("child_process");
const { existsSync } = require("fs");

const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const dbPath = dbUrl.replace("file:", "");
const isNewDb = !existsSync(dbPath);

console.log("=== ISO 27001 Startup ===");
console.log(`DATABASE_URL: ${dbUrl}`);
console.log(`DB file exists: ${!isNewDb}`);

try {
  console.log("Syncing database schema...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });

  if (isNewDb) {
    console.log("Seeding initial data...");
    execSync(
      `npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts`,
      { stdio: "inherit" }
    );
    console.log("Seed complete.");
  }
} catch (err) {
  console.error("Startup error:", err.message);
  process.exit(1);
}

console.log("Starting Next.js...");
execSync("npx next start -p ${PORT:-3000}", { stdio: "inherit", shell: true });
