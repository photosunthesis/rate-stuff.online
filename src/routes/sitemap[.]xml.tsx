import { createFileRoute } from "@tanstack/react-router";
import { stuff, users, ratings } from "~/db/schema";
import { isNull, desc, sql, and, gt } from "drizzle-orm";
import { getDatabase } from "~/db";
import { cached } from "~/infrastructure/kv/cache";

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const origin = new URL(request.url).origin;

				const sitemap = await cached(
					"sitemap",
					async () => {
						const db = getDatabase();

						const pages = ["/", "/privacy", "/terms"];

						const staticEntries = pages
							.map(
								(p) => `
	<url>
		<loc>${origin}${p}</loc>
		<changefreq>weekly</changefreq>
	</url>`,
							)
							.join("");

						let dynamicEntries = "";

							
						try {
							// Get top 100 stuff
							const stuffRows = await db
								.select({ slug: stuff.slug })
								.from(stuff)
								.where(isNull(stuff.deletedAt))
								.orderBy(desc(stuff.createdAt))
								.limit(100);

							dynamicEntries += stuffRows
								.map(
									(r: { slug: string }) => `
	<url>
		<loc>${origin}/stuff/${r.slug}</loc>
		<changefreq>weekly</changefreq>
	</url>`,
								)
								.join("");

							// Get top 100 users excluding admins
							const userRows = await db
								.select({ username: users.username })
								.from(users)
								.where(
									sql`${users.username} IS NOT NULL AND ${users.role} != ${"admin"}`,
								)
								.orderBy(desc(users.createdAt))
								.limit(100);

							dynamicEntries += userRows
								.map((u: { username: string | null }) =>
									u.username
										? `
	<url>
		<loc>${origin}/user/${u.username}</loc>
		<changefreq>weekly</changefreq>
	</url>`
										: "",
								)
								.join("");

							// Get top 100 ratings with content longer than 50 characters
							const ratingRows = await db
								.select({ id: ratings.id })
								.from(ratings)
								.where(
									and(
										isNull(ratings.deletedAt),
										gt(sql<number>`length(${ratings.content})`, 50),
									),
								)
								.orderBy(desc(ratings.createdAt))
								.limit(100);

							dynamicEntries += ratingRows
								.map(
									(r: { id: string }) => `
	<url>
		<loc>${origin}/rating/${r.id}</loc>
		<changefreq>weekly</changefreq>
	</url>`,
								)
								.join("");
						} catch {}

						const urlEntries = `${staticEntries}${dynamicEntries}`;

						return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
					},
					3600,
				);

				return new Response(sitemap, {
					headers: {
						"Content-Type": "application/xml",
						"Cache-Control":
							"public, s-maxage=3600, stale-while-revalidate=600",
					},
				});
			},
		},
	},
});
