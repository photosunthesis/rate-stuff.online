import bcrypt from "bcryptjs";
import fs from "fs";
import { execSync } from "child_process";

// Generate a 6-character random code
function generateInviteCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

function escapeSqlString(str: string): string {
	return `'${str.replace(/'/g, "''")}'`;
}

async function seed() {
	console.log("🌱 Generating seed data...");

	try {
		const adminId = crypto.randomUUID();
		const userId = crypto.randomUUID();
		const adminPassword = await bcrypt.hash("admin123", 12);
		const userPassword = await bcrypt.hash("user123", 12);
		const now = Date.now(); // Milliseconds for timestamp

		// We're using raw SQL because of D1 limitations with Drizzle ORM, also I'm new to the React world :D
		const sqlStatements = [
			`-- Seed data generated at ${new Date().toISOString()}`,
			`INSERT INTO users (id, email, password, name, role, created_at, updated_at) VALUES (${escapeSqlString(adminId)}, 'admin@example.com', ${escapeSqlString(adminPassword)}, 'Admin User', 'admin', ${now}, ${now});`,
			`INSERT INTO users (id, email, password, name, role, created_at, updated_at) VALUES (${escapeSqlString(userId)}, 'user@example.com', ${escapeSqlString(userPassword)}, 'Regular User', 'user', ${now}, ${now});`,
		];

		console.log("✅ Generated users");

		// Generate 10 invite codes created by admin
		for (let i = 0; i < 10; i++) {
			const code = generateInviteCode();
			const codeId = crypto.randomUUID();
			sqlStatements.push(
				`INSERT INTO invite_codes (id, code, created_by, created_at) VALUES (${escapeSqlString(codeId)}, ${escapeSqlString(code)}, ${escapeSqlString(adminId)}, ${now});`,
			);
			console.log(`   Generated code: ${code}`);
		}

		const sqlContent = sqlStatements.join("\n");
		const seedFilePath = "seed.sql";
		fs.writeFileSync(seedFilePath, sqlContent);
		console.log(`\n💾 Saved SQL to ${seedFilePath}`);

		console.log("🚀 Executing seed against local D1 database...");
		try {
			execSync(
				"pnpm wrangler d1 execute rate-stuff-online --local --file seed.sql",
				{
					stdio: "inherit",
				},
			);
			console.log("\n🎉 Database seed completed successfully!");
		} catch (execError) {
			console.error("\n❌ Failed to execute seed script via Wrangler.");
			console.error(
				"You can try running it manually: pnpm wrangler d1 execute rate-stuff-online --local --file seed.sql",
			);
			process.exit(1);
		} finally {
			// Optional: remove file
			// fs.unlinkSync(seedFilePath);
		}
	} catch (error) {
		console.error("❌ Error generating seed:", error);
		process.exit(1);
	}
}

seed();
