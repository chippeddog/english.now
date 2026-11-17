import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

const CAL_NAMESPACE = "secret";

const CAL_CONFIG = {
	layout: "month_view",
	useSlotsViewOnSmallScreen: "true",
	theme: "light",
} as const;

export function BookDemoCalendar() {
	useEffect(() => {
		(async function initCal() {
			const cal = await getCalApi({ namespace: CAL_NAMESPACE });
			cal("ui", {
				hideEventTypeDetails: false,
				layout: "month_view",
				theme: "light",
			});
		})();
	}, []);

	return (
		<Cal
			namespace={CAL_NAMESPACE}
			calLink="chippeddog/english"
			style={{
				width: "100%",
				height: "100%",
				minHeight: "520px",
				overflow: "auto",
			}}
			config={CAL_CONFIG}
		/>
	);
}
