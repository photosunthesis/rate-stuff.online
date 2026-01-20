import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { MainLayout } from "~/components/layout/main-layout";
import { NotFound } from "~/components/ui/not-found";
import { StuffHeader } from "~/features/stuff/components/stuff-header";
import { Suspense, lazy } from "react";
import { RatingCardSkeleton } from "~/components/ui/rating-card-skeleton";

const StuffRatingsList = lazy(() =>
	import("~/features/stuff/components/stuff-ratings-list").then((module) => ({
		default: module.StuffRatingsList,
	})),
);
import { stuffQueryOptions } from "~/features/stuff/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authQueryOptions } from "~/features/auth/queries";
import { mapToCurrentUser } from "~/utils/user-mapping";

export const Route = createFileRoute("/_public/stuff/$stuffSlug")({
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

		let cached: {
			id?: string;
			name?: string;
			images?: string[];
			averageRating?: number;
			ratingCount?: number;
		} | null = null;
		if (cachedRaw && typeof cachedRaw === "object") {
			const maybeWrapper = cachedRaw as Record<string, unknown>;
			if ("data" in maybeWrapper && typeof maybeWrapper.data === "object") {
				cached = maybeWrapper.data as {
					id?: string;
					name?: string;
					images?: string[];
					averageRating?: number;
					ratingCount?: number;
				};
			} else {
				cached = maybeWrapper as {
					id?: string;
					name?: string;
					images?: string[];
					averageRating?: number;
					ratingCount?: number;
				};
			}
		}

		const stuff = cached ?? null;
		const title = stuff?.name
			? `${stuff.name} - Rate Stuff Online`
			: "Stuff - Rate Stuff Online";

		const images = Array.isArray(stuff?.images)
			? (stuff.images as string[])
			: [];
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

		const metas: Record<string, string | undefined>[] = [
			{ title },
			{ name: "description", content: description },
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
				name: "twitter:card",
				content: hasImages ? "summary_large_image" : "summary",
			},
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "robots", content: "index, follow" },
		];

		if (hasImages) {
			metas.push({ name: "og:image", content: images[0] });
			metas.push({ name: "twitter:image", content: images[0] });
		}

		const pageUrl = `https://rate-stuff.online/stuff/${params.stuffSlug}`;

		const ld: Record<string, unknown> = {
			"@context": "https://schema.org",
			"@type": "Product",
			name: stuff?.name ?? undefined,
			image: hasImages ? images : undefined,
			url: pageUrl,
			description: description,
		};

		if (averageRating != null && ratingCount != null && ratingCount > 0) {
			ld.aggregateRating = {
				"@type": "AggregateRating",
				ratingValue: averageRating.toFixed(2),
				ratingCount: ratingCount,
			};
		}

		return {
			meta: metas,
			links: [{ rel: "canonical", href: `/stuff/${params.stuffSlug}` }],
			scripts: [{ type: "application/ld+json", children: JSON.stringify(ld) }],
		};
	},
});

function RouteComponent() {
	const slug = Route.useParams().stuffSlug;
	const { stuff } = Route.useRouteContext();
	const { data: user } = useSuspenseQuery(authQueryOptions());
	const currentUser = mapToCurrentUser(user);

	// Normalize to safe shape to avoid runtime errors
	const imagesForSafe = Array.isArray(
		(stuff as unknown as { images?: unknown })?.images,
	)
		? ((stuff as { images?: string[] }).images ?? [])
		: [];
	const safeStuff = {
		...stuff,
		images: imagesForSafe,
	};

	if (!Array.isArray(safeStuff.images)) {
		safeStuff.images = [];
	}

	return (
		<MainLayout user={currentUser}>
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
				<StuffRatingsList slug={slug} user={currentUser} />
			</Suspense>
		</MainLayout>
	);
}
