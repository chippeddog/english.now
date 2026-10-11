import {
	isGlassEffectAPIAvailable,
	isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Platform } from "react-native";

// Some iOS 26 betas report Liquid Glass as available but lack the runtime API and crash,
// so both checks are required before rendering GlassView.
export const canUseLiquidGlass =
	Platform.OS === "ios" &&
	isLiquidGlassAvailable() &&
	isGlassEffectAPIAvailable();
