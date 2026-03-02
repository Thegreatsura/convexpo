import { useConvexAuth } from "convex/react";
import { Stack } from "expo-router";

import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export const unstable_settings = {
	anchor: "(main)/(home)/index",
};

export default function RootLayout() {
	const { isAuthenticated } = useConvexAuth();
	const { root } = useNavigationOptions();

	return (
		<Stack screenOptions={{ headerShown: false, ...root }}>
			{/* AUTH STACK */}
			<Stack.Protected guard={!isAuthenticated}>
				<Stack.Screen name="(auth)" />
			</Stack.Protected>
			{/* AUTHENTICATED NESTED STACK */}
			<Stack.Protected guard={isAuthenticated}>
				<Stack.Screen name="(main)" />
			</Stack.Protected>
		</Stack>
	);
}
