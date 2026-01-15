import { createFileRoute } from "@tanstack/react-router";
import { db } from "~/db";
import { stuff, users, ratings } from "~/db/schema";
import { isNull, desc, sql } from "drizzle-orm";

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const origin = new URL(request.url).origin;

				// static pages
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

				// dynamic entries: fetch up to 100 of each type from the DB
				let dynamicEntries = "";

				try {
					// Stuff (by slug)
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

					// Users (by username) — only include users with a username and exclude admins
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

					// Ratings (by id) — exclude soft-deleted
					const ratingRows = await db
						.select({ id: ratings.id })
						.from(ratings)
						.where(isNull(ratings.deletedAt))
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
				} catch {
					// Ignore errors fetching dynamic entries
				}

				const urlEntries = `${staticEntries}${dynamicEntries}`;

				const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;

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
