import * as WebBrowser from "expo-web-browser";
import { WEB_URL } from "@/lib/constants";

export function openOnWeb(path: string) {
	return WebBrowser.openBrowserAsync(`${WEB_URL}${path}`);
}
