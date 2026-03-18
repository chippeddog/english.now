import { env } from "@english.now/env/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUpgradeDialog } from "@/components/dashboard/upgrade-dialog";
import { useTRPC } from "@/utils/trpc";

type VocabularyMode = "word" | "phrase";

export function useConversationVocabulary(sessionId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { openDialog } = useUpgradeDialog();

	const mutation = useMutation({
		mutationFn: async (input: { text: string; mode: VocabularyMode }) => {
			const response = await fetch(
				`${env.VITE_SERVER_URL}/api/conversation/vocabulary`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						sessionId,
						text: input.text,
						mode: input.mode,
					}),
				},
			);

			if (!response.ok) {
				const errorData = (await response.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(errorData?.error ?? "Failed to queue vocabulary");
			}

			return response.json() as Promise<{
				status: "queued";
				jobId: string | null;
			}>;
		},
		onSuccess: (_data, variables) => {
			const refreshQueries = () => {
				queryClient.invalidateQueries({
					queryKey:
						variables.mode === "word"
							? trpc.vocabulary.getWords.queryKey()
							: trpc.vocabulary.getPhrases.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.vocabulary.getAccess.queryKey(),
				});
			};

			refreshQueries();
			window.setTimeout(refreshQueries, 2500);
			window.setTimeout(refreshQueries, 8000);
			toast.success(`"${variables.text}" is being added in the background`);
		},
		onError: (err, variables) => {
			if (err.message.includes("FREE_VOCAB_ADD_LIMIT_REACHED")) {
				openDialog();
				toast.error("You've reached your daily vocabulary add limit.");
				return;
			}

			toast.error(
				err.message ??
					`Failed to queue ${variables.mode === "word" ? "word" : "phrase"}`,
			);
		},
	});

	return {
		addVocabulary: mutation.mutate,
		addVocabularyAsync: mutation.mutateAsync,
		isPending: mutation.isPending,
	};
}
