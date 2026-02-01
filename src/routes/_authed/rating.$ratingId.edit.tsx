import {
	createFileRoute,
	redirect,
	useRouter,
	useCanGoBack,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ratingQueryOptions } from "~/domains/ratings/queries/display";
import { authQueryOptions } from "~/domains/users/queries";
import { EditRatingForm } from "~/domains/ratings/components/edit-rating-form";
import { MainLayout } from "~/components/layout/main-layout";
import { mapToCurrentUser } from "~/domains/users/utils/user-mapping";
import {
	useUpdateRatingMutation,
	useUploadImageMutation,
} from "~/domains/ratings/queries/create";
import { useState } from "react";
import { withTimeout } from "~/utils/timeout";
import { NotFound } from "~/components/ui/feedback/not-found";

export const Route = createFileRoute("/_authed/rating/$ratingId/edit")({
	beforeLoad: async ({ params, context }) => {
		const ratingId = params.ratingId;
		const queryClient = context.queryClient;

		const [user, ratingRes] = await Promise.all([
			queryClient.ensureQueryData(authQueryOptions()),
			queryClient.ensureQueryData(ratingQueryOptions(ratingId)),
		]);

		if (!user) {
			throw redirect({ to: "/" });
		}

		if (!ratingRes || !ratingRes.success || !ratingRes.data) {
			throw new Error("Rating not found");
		}

		const rating = ratingRes.data;

		if (rating.userId !== user.id) {
			throw redirect({
				to: "/sign-in",
				search: { redirect: `/rating/${ratingId}` },
			});
		}

		return { user, rating };
	},
	component: RouteComponent,
	errorComponent: NotFound,
	head: ({ params, match }) => {
		const cached = match.context.queryClient.getQueryData(
			ratingQueryOptions(params.ratingId).queryKey,
		);
		const rating = cached?.success ? cached.data : null;
		const stuffName = rating?.stuff?.name ?? "Rating";
		return {
			meta: [
				{ title: `Edit Rating: ${stuffName} - Rate Stuff Online` },
				{ name: "robots", content: "noindex" },
			],
		};
	},
});

function RouteComponent() {
	const { user, rating } = Route.useRouteContext();
	const { ratingId } = Route.useParams();
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const currentUser = mapToCurrentUser(user);
	const updateRatingMutation = useUpdateRatingMutation();
	const uploadImageMutation = useUploadImageMutation();
	const [formError, setFormError] = useState<string | null>(null);

	const handleUpdate = async (data: {
		score: number;
		content: string;
		tags: string[];
		images?: File[];
		finalImages?: string[];
	}) => {
		setFormError(null);
		const currentImages = data.finalImages ?? [];
		const newImages = data.images ?? [];
		const uploadedUrls: string[] = [];

		try {
			if (newImages.length > 0) {
				const uploads = newImages.map((file) =>
					withTimeout(
						uploadImageMutation.mutateAsync({
							file,
							ratingId: rating.id,
						}),
						{ context: "upload-image" },
					).then((res) => {
						return res.url;
					}),
				);

				const results = await Promise.all(uploads);
				results.forEach((url: string) => {
					if (url) uploadedUrls.push(url);
				});
			}

			const finalImages = [...currentImages, ...uploadedUrls];

			const result = await withTimeout(
				updateRatingMutation.mutateAsync({
					data: {
						ratingId: rating.id,
						score: data.score,
						content: data.content,
						tags: data.tags,
						images: finalImages,
					},
				}),
				{ context: "update-rating" },
			);

			if (!result.success) {
				throw new Error(result.errorMessage);
			}

			router.invalidate();

			if (canGoBack) {
				router.history.back();
			} else {
				router.navigate({ to: `/rating/${rating.id}` });
			}
		} catch (error) {
			setFormError(
				error instanceof Error ? error.message : "Failed to update rating",
			);
			throw error;
		}
	};

	let parsedImages: string[] = [];
	if (typeof rating.images === "string") {
		try {
			parsedImages = JSON.parse(rating.images);
		} catch {
			parsedImages = [];
		}
	} else if (Array.isArray(rating.images)) {
		parsedImages = rating.images as string[];
	}

	return (
		<MainLayout user={currentUser}>
			<div className="h-full flex flex-col">
				<div className="border-b border-neutral-800 px-3 py-2">
					<div className="flex items-center gap-3">
						<button
							type="button"
							className="flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
							onClick={(e) => {
								e.stopPropagation();
								if (canGoBack) {
									router.history.back();
								} else {
									router.navigate({ to: `/rating/${ratingId}` });
								}
							}}
						>
							<ArrowLeft className="h-5 w-5 shrink-0" />
						</button>
						<h2 className="text-lg font-semibold text-white">Edit Rating</h2>
					</div>
				</div>
				<div className="flex-1 min-h-0">
					<EditRatingForm
						initialData={{
							score: rating.score,
							content: rating.content,
							tags: rating.tags ?? [],
							images: parsedImages,
							stuffName: rating.stuff?.name ?? "Unknown Item",
						}}
						onSubmit={handleUpdate}
						isPending={
							updateRatingMutation.isPending || uploadImageMutation.isPending
						}
						errorMessage={formError}
						validationErrors={{}}
						onCancel={() => router.history.back()}
					/>
				</div>
			</div>
		</MainLayout>
	);
}
