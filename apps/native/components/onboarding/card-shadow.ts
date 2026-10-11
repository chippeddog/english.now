import type { ViewStyle } from "react-native";

export const cardShadow: ViewStyle = {
	shadowColor: "#000",
	shadowOffset: { width: 0, height: 2 },
	shadowOpacity: 0.06,
	shadowRadius: 4,
	elevation: 1,
};

export const elevatedCardShadow: ViewStyle = {
	shadowColor: "#000",
	shadowOffset: { width: 0, height: 10 },
	shadowOpacity: 0.06,
	shadowRadius: 16,
	elevation: 3,
};
