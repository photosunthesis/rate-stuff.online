#!/usr/bin/env node
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run seeder in production (NODE_ENV=production).");
  process.exit(1);
}

const ALLOW = process.env.SEED_LOCAL === "1" || process.argv.includes("--local") || process.argv.includes("--force");

if (!ALLOW) {
  console.error(
    "This seeder is for local development only. Set SEED_LOCAL=1 or pass --local to run."
  );
  process.exit(1);
}

async function main() {
  const sqlite = new Database("./dev.db");
  const db = drizzle(sqlite, { schema });

  console.log("Seeding database (./dev.db)...");

  // Create users
  const adminId = randomUUID();
  const userId = randomUUID();

  const adminPassword = bcrypt.hashSync("admin", 12);
  const userPassword = bcrypt.hashSync("userPassword", 12);

  await db.insert(schema.users).values([
    {
      id: adminId,
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin User",
      role: schema.ROLES.ADMIN,
    },
    {
      id: userId,
      email: "user@example.com",
      password: userPassword,
      name: "Regular User",
      role: schema.ROLES.USER,
    },
  ]).run();

  // Create 10 invite codes created by admin
  const codes = Array.from({ length: 6 }).map(() => ({
    id: randomUUID(),
    code: `${randomUUID().split("-")[0].toUpperCase()}`,
    createdBy: adminId,
  }));

  await db.insert(schema.inviteCodes).values(codes).run();

  console.log("Seed complete:");
  console.log(`  Admin: admin@example.com (id=${adminId})`);
  console.log(`  User:  user@example.com (id=${userId})`);
  console.log("  Invite codes:");
  codes.forEach((c) => console.log(`    ${c.code}`));

  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
