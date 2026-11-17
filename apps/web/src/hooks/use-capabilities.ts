import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

/**
 * Integrations enabled on the server. Self-hosted instances may run without
 * billing, Google sign-in or speech services; hide those features when off.
 * While loading, everything is reported as enabled to avoid layout flicker on
 * the fully configured hosted site.
 */
export function useCapabilities() {
	const trpc = useTRPC();
	const { data } = useQuery({
		...trpc.meta.capabilities.queryOptions(),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});

	return (
		data ?? {
			googleAuth: true,
			appleAuth: true,
			billing: true,
			emailVerification: true,
			pronunciation: true,
			liveTranscription: true,
		}
	);
}
