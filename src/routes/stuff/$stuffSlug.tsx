import { createFileRoute, redirect } from "@tanstack/react-router";
import { MainLayout } from "~/components/layout/main-layout";
import { NotFound } from "~/components/not-found";
import { StuffHeader } from "~/features/stuff/components/stuff-header";
import { StuffRatingsList } from "~/features/stuff/components/stuff-ratings-list";
import { useStuff } from "~/features/stuff/hooks";
import { stuffQueryOptions } from "~/features/stuff/queries";

export const Route = createFileRoute("/stuff/$stuffSlug")({
	beforeLoad: async ({ params, context }) => {
		const slug = params.stuffSlug;
		if (!slug) throw redirect({ to: "/" });
		await context.queryClient.ensureQueryData(stuffQueryOptions(slug));
	},
	component: RouteComponent,
	head: ({ params, match }) => {
		const cachedRaw = match.context.queryClient.getQueryData(
			stuffQueryOptions(params.stuffSlug).queryKey,
		);

		let cached: { id?: string; name?: string; images?: string[] } | null = null;
		if (cachedRaw && typeof cachedRaw === "object") {
			const maybeWrapper = cachedRaw as Record<string, unknown>;
			if ("data" in maybeWrapper && typeof maybeWrapper.data === "object") {
				cached = maybeWrapper.data as {
					id?: string;
					name?: string;
					images?: string[];
				};
			} else {
				cached = maybeWrapper as {
					id?: string;
					name?: string;
					images?: string[];
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

		const metas: Record<string, string | undefined>[] = [
			{ title },
			{
				name: "twitter:card",
				content: hasImages ? "summary_large_image" : "summary",
			},
			{ name: "twitter:title", content: title },
			{ name: "robots", content: "index, follow" },
		];

		if (hasImages) {
			metas.push({ name: "og:image", content: images[0] });
			metas.push({ name: "twitter:image", content: images[0] });
		}

		return {
			meta: metas,
			links: [{ rel: "canonical", href: `/stuff/${params.stuffSlug}` }],
		};
	},
});

function RouteComponent() {
	const slug = Route.useParams().stuffSlug;
	const { user } = Route.useRouteContext();
	const { data, isLoading, error } = useStuff(slug);

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
			</div>
		);
	}

	if (error || !data) {
		return <NotFound />;
	}

	const stuff = data;
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
		<MainLayout
			user={
				user
					? {
							username: user?.username ?? "",
							name: user?.name,
							image: user?.image ?? "",
						}
					: undefined
			}
		>
			<div className="px-4 py-4">
				<StuffHeader stuff={safeStuff} />{" "}
				<div className="-mx-4 border-t border-neutral-800" />{" "}
				<StuffRatingsList slug={slug} />
			</div>
		</MainLayout>
	);
}
