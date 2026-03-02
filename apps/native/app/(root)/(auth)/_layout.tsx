import { Stack } from "expo-router";

import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export default function AuthLayout() {
	const { standard } = useNavigationOptions();
	return (
		<Stack screenOptions={standard}>
			<Stack.Screen
				name="landing"
				options={{
					title: "",
				}}
			/>
			<Stack.Screen
				name="email"
				options={{
					headerShown: false,
					presentation: "modal",
				}}
			/>
		</Stack>
	);
}
