import { task } from "@trigger.dev/sdk";

export const helloWorld = task({
	id: "hello-world",
	run: async (payload: { message: string }) => {
		return {
			message: payload.message,
			receivedAt: new Date().toISOString(),
		};
	},
});
