import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@english.now/env/server";

export const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
