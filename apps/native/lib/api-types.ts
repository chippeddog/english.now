import type { AppRouter } from "@english.now/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type CourseData = NonNullable<RouterOutputs["content"]["getCourse"]>;
export type CourseUnit = CourseData["units"][number];
export type CourseLesson = CourseUnit["lessons"][number];
