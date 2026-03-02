import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text } from "react-native";

import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { authClient } from "@/lib/auth-client";

export default function SettingsLayout() {
	const { standard } = useNavigationOptions();

	return (
		<Stack screenOptions={standard}>
			<Stack.Screen
				name="index"
				options={{
					title: "Settings",
					headerLargeTitle: true,
					headerRight: () => <SignOutButton />,
				}}
			/>
		</Stack>
	);
}

const SignOutButton = () => {
	const [isSigningOut, setIsSigningOut] = useState(false);

	const handleSignOut = async () => {
		await authClient.signOut(
			{},
			{
				onRequest: () => {
					setIsSigningOut(true);
				},
				onSuccess: () => {
					setIsSigningOut(false);
				},
				onError: (ctx) => {
					Alert.alert("Error", ctx.error.message || "Failed to sign out");
					setIsSigningOut(false);
				},
			},
		);
	};

	return (
		<Pressable
			className="justify-center rounded-full px-3"
			disabled={isSigningOut}
			onPress={() => {
				Alert.alert("Sign Out", "Are you sure you want to sign out?", [
					{ text: "Cancel", style: "cancel" },
					{ text: "Sign Out", onPress: handleSignOut },
				]);
			}}
		>
			<Text className="text-foreground">Sign Out</Text>
		</Pressable>
	);
};
