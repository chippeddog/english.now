import { useEffect } from "react";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";

export function Skeleton({ className = "" }: { className?: string }) {
	const opacity = useSharedValue(1);

	useEffect(() => {
		opacity.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true);
	}, [opacity]);

	const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<Animated.View
			className={`rounded-lg bg-neutral-100 ${className}`}
			style={style}
		/>
	);
}
