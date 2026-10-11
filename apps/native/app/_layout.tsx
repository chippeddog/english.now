import {
	DarkTheme,
	DefaultTheme,
	type Theme,
	ThemeProvider,
} from "@react-navigation/native";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import React, { useEffect, useRef } from "react";
import {
	ActivityIndicator,
	Platform,
	Pressable,
	Text,
	View,
} from "react-native";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { signOut } from "@/lib/social-auth";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient, trpc } from "@/utils/trpc";

const LIGHT_THEME: Theme = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const hasMounted = useRef(false);
	const { colorScheme, isDarkColorScheme } = useColorScheme();
	const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

	useIsomorphicLayoutEffect(() => {
		if (hasMounted.current) {
			return;
		}

		if (Platform.OS === "web") {
			document.documentElement.classList.add("bg-background");
		}
		setAndroidNavigationBar(colorScheme);
		setIsColorSchemeLoaded(true);
		hasMounted.current = true;
	}, []);

	if (!isColorSchemeLoaded) {
		return null;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
				<StatusBar style={isDarkColorScheme ? "light" : "dark"} />
				<GestureHandlerRootView style={{ flex: 1 }}>
					<RootNavigator />
				</GestureHandlerRootView>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

function RootNavigator() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const [hasLoadedSession, setHasLoadedSession] = React.useState(false);

	useEffect(() => {
		if (!isSessionPending) {
			setHasLoadedSession(true);
		}
	}, [isSessionPending]);

	const isSignedIn = !!session?.user;

	const profileQuery = useQuery({
		...trpc.profile.get.queryOptions(),
		enabled: isSignedIn,
	});
	const isOnboarded = !!profileQuery.data?.isOnboardingCompleted;

	const enrollmentQuery = useQuery({
		...trpc.content.getEnrollment.queryOptions(),
		enabled: isSignedIn && isOnboarded,
	});
	const isEnrolled = !!enrollmentQuery.data;

	const isUserStateLoading =
		isSignedIn &&
		(profileQuery.isPending || (isOnboarded && enrollmentQuery.isPending));

	const userStateError =
		isSignedIn &&
		(profileQuery.isError || (isOnboarded && enrollmentQuery.isError));

	useEffect(() => {
		if (hasLoadedSession && !isUserStateLoading) {
			SplashScreen.hideAsync();
		}
	}, [hasLoadedSession, isUserStateLoading]);

	if (!hasLoadedSession) {
		return null;
	}

	if (isUserStateLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator />
			</View>
		);
	}

	if (userStateError) {
		return (
			<View className="flex-1 items-center justify-center gap-4 bg-background px-6">
				<Text className="text-center text-base text-foreground">
					Couldn't load your profile. Check your connection and try again.
				</Text>
				<Pressable
					onPress={() => {
						profileQuery.refetch();
						enrollmentQuery.refetch();
					}}
					accessibilityRole="button"
					className="rounded-xl border border-border px-5 py-2.5 active:opacity-70"
				>
					<Text className="font-medium text-foreground">Try Again</Text>
				</Pressable>
				<Pressable onPress={() => signOut()} accessibilityRole="button">
					<Text className="text-muted-foreground text-sm">Sign out</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<Stack>
			<Stack.Protected guard={isSignedIn && isOnboarded && isEnrolled}>
				<Stack.Screen name="(app)" options={{ headerShown: false }} />
			</Stack.Protected>
			<Stack.Protected guard={isSignedIn && isOnboarded && !isEnrolled}>
				<Stack.Screen name="generating" options={{ headerShown: false }} />
			</Stack.Protected>
			<Stack.Protected guard={isSignedIn && !isOnboarded}>
				<Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
			</Stack.Protected>
			<Stack.Protected guard={!isSignedIn}>
				<Stack.Screen name="(auth)" options={{ headerShown: false }} />
			</Stack.Protected>
		</Stack>
	);
}

const useIsomorphicLayoutEffect =
	Platform.OS === "web" && typeof window === "undefined"
		? React.useEffect
		: React.useLayoutEffect;
