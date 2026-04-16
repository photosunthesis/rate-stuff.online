import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { MainLayout } from "~/shared/components/layout/main-layout";
import { NotFound } from "~/shared/components/feedback/not-found";
import { StuffHeader } from "~/features/stuff/components/stuff-header";
import { Suspense, lazy } from "react";
import { RatingCardSkeleton } from "~/features/ratings/components/rating-card-skeleton";
import { stuffQueryOptions } from "~/features/stuff/hooks";

const StuffRatingsList = lazy(() =>
	import("~/features/stuff/components/stuff-ratings-list").then((module) => ({
		default: module.StuffRatingsList,
	})),
);

export const Route = createFileRoute("/_public/stuff/$stuffSlug/")({
	beforeLoad: async ({ params, context }) => {
		const slug = params.stuffSlug;

		if (!slug) throw redirect({ to: "/" });

		const stuff = await context.queryClient.ensureQueryData(
			stuffQueryOptions(slug),
		);

		if (!stuff) throw notFound();

		return { stuff: stuff };
	},
	component: RouteComponent,
	notFoundComponent: NotFound,
	head: ({ params, match }) => {
		const cachedRaw = match.context.queryClient.getQueryData(
			stuffQueryOptions(params.stuffSlug).queryKey,
		);

		type CachedStuff = {
			id?: string;
			name?: string;
			images?: { card: string; lightbox: string }[];
			averageRating?: number;
			ratingCount?: number;
		};
		let cached: CachedStuff | null = null;
		if (cachedRaw && typeof cachedRaw === "object") {
			const maybeWrapper = cachedRaw as Record<string, unknown>;
			if ("data" in maybeWrapper && typeof maybeWrapper.data === "object") {
				cached = maybeWrapper.data as CachedStuff;
			} else {
				cached = maybeWrapper as CachedStuff;
			}
		}

		const stuff = cached ?? null;
		const title = stuff?.name
			? `${stuff.name} - Rate Stuff Online`
			: "Stuff - Rate Stuff Online";

		const images = Array.isArray(stuff?.images) ? stuff.images : [];
		const hasImages = images.length > 0;

		const ratingCount =
			typeof stuff?.ratingCount === "number"
				? (stuff?.ratingCount as number)
				: undefined;
		const averageRating =
			typeof stuff?.averageRating === "number"
				? (stuff?.averageRating as number)
				: undefined;

		const description = stuff?.name
			? averageRating != null && ratingCount != null
				? `${stuff.name} — ${averageRating.toFixed(1)} average from ${ratingCount} ${
						ratingCount === 1 ? "rating" : "ratings"
					} on Rate Stuff Online.`
				: `View ratings and details for ${stuff.name} on Rate Stuff Online.`
			: "Stuff on Rate Stuff Online.";

		const pageUrl = `https://rate-stuff.online/stuff/${params.stuffSlug}`;
		const finalImage = hasImages
			? images[0].card
			: "https://rate-stuff.online/web-app-manifest-512x512.png";

		const keywords = [
			stuff?.name ?? "stuff",
			"reviews",
			"ratings",
			"community opinions",
			"rate stuff online",
		].join(", ");

		const metas: Record<string, string | undefined>[] = [
			{ title },
			{ name: "description", content: description },
			{ name: "keywords", content: keywords },
			{
				name: "og:site_name",
				property: "og:site_name",
				content: "Rate Stuff Online",
			},
			{ name: "og:title", property: "og:title", content: title },
			{
				name: "og:description",
				property: "og:description",
				content: description,
			},
			{ name: "og:type", property: "og:type", content: "product" },
			{
				name: "og:url",
				property: "og:url",
				content: pageUrl,
			},
			{ name: "og:image", content: finalImage },
			{
				name: "twitter:card",
				content: hasImages ? "summary_large_image" : "summary",
			},
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: finalImage },
			{ name: "robots", content: "index, follow" },
		];

		const ld: Record<string, unknown> = {
			"@context": "https://schema.org",
			"@type": "Thing",
			name: stuff?.name ?? undefined,
			image: hasImages ? images : [finalImage],
			url: pageUrl,
			description: description,
		};

		return {
			meta: metas,
			links: [{ rel: "canonical", href: pageUrl }],
			scripts: [{ type: "application/ld+json", children: JSON.stringify(ld) }],
		};
	},
});

function RouteComponent() {
	const slug = Route.useParams().stuffSlug;
	const { stuff } = Route.useRouteContext();

	// Normalize to safe shape to avoid runtime errors
	const safeStuff = {
		...stuff,
		images: Array.isArray(stuff?.images) ? stuff.images : [],
	};

	return (
		<MainLayout>
			<StuffHeader stuff={safeStuff} />{" "}
			<div className="border-t border-neutral-800" />
			<Suspense
				fallback={
					<div className="py-2">
						{[0, 1, 2, 3, 4, 5].map((n, idx) => (
							<div
								key={n}
								className={idx === 0 ? "" : "border-t border-neutral-800"}
							>
								<RatingCardSkeleton variant="stuff" showImage={idx % 2 === 0} />
							</div>
						))}
					</div>
				}
			>
				<StuffRatingsList slug={slug} />
			</Suspense>
		</MainLayout>
	);
}
