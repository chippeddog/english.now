import type { getConversationSessionMeta } from "../../services/conversation-mode";

export type ConversationSessionMeta = ReturnType<
	typeof getConversationSessionMeta
>;
