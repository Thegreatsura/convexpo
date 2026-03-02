import { Stack } from "expo-router";

import { useUser } from "@/contexts/user-context";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export const unstable_settings = {
	anchor: "(main)/(home)/index",
};

export default function RootLayout() {
	const { user, isLoading } = useUser();
	const { root } = useNavigationOptions();

	// Use !!user for auth state — the Convex query cache persists across HMR
	// (ConvexReactClient is at module scope), so user won't flicker during
	// hot reloads unlike useConvexAuth().isAuthenticated.
	const isAuthenticated = !!user;

	return (
		<Stack screenOptions={{ headerShown: false, ...root }}>
			<Stack.Protected guard={!isLoading && !isAuthenticated}>
				<Stack.Screen name="(auth)" />
			</Stack.Protected>
			<Stack.Protected guard={isLoading || isAuthenticated}>
				<Stack.Screen name="(main)" />
			</Stack.Protected>
		</Stack>
	);
}
