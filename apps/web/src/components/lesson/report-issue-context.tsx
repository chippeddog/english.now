import { createContext, useContext } from "react";

type LessonReportIssueContextValue = {
	attemptId: string | null;
	setAttemptId: (attemptId: string | null) => void;
};

const noop = () => {};

export const LessonReportIssueContext =
	createContext<LessonReportIssueContextValue>({
		attemptId: null,
		setAttemptId: noop,
	});

export function useLessonReportIssue() {
	return useContext(LessonReportIssueContext);
}
