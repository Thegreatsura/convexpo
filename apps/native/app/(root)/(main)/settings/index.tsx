import { Ionicons } from "@expo/vector-icons";
import { api } from "@my-better-t-app/backend";
import { useConvexAuth, useQuery } from "convex/react";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import { authClient } from "@/lib/auth-client";

export default function SettingsRoute() {
	const foreground = useThemeColor("foreground");
	const [isDeletingUser, setIsDeletingUser] = useState(false);
	const { isAuthenticated } = useConvexAuth();
	const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");

	if (!user) return null;

	const handleDeleteUser = async () => {
		await authClient.deleteUser(
			{},
			{
				onRequest: () => {
					setIsDeletingUser(true);
				},
				onSuccess: () => {
					setIsDeletingUser(false);
				},
				onError: (ctx) => {
					setIsDeletingUser(false);
					Alert.alert("Error", ctx.error.message || "Failed to delete user");
				},
			},
		);
	};

	return (
		<View className="flex-1">
			<ScrollView
				contentInsetAdjustmentBehavior="always"
				contentContainerClassName="px-6 py-2 gap-4 min-h-full"
			>
				{/* User Info */}
				<View className="flex">
					<Text className="text-lg text-muted">{user.name}</Text>
					<Text className="text-lg text-muted">{user.email}</Text>
				</View>

				{/* Delete User */}
				<View className="flex gap-4">
					<Button
						variant="tertiary"
						size="sm"
						className="self-start rounded-full"
						isDisabled={isDeletingUser}
						onPress={() => {
							Alert.alert(
								"Delete User",
								"Are you sure you want to delete your account?",
								[
									{ text: "Cancel", style: "cancel" },
									{ text: "Delete", onPress: handleDeleteUser },
								],
							);
						}}
					>
						<Ionicons name="trash-outline" size={18} color={foreground} />
						<Button.Label>
							{isDeletingUser ? "Deleting..." : "Delete User"}
						</Button.Label>
						{isDeletingUser ? <Spinner size="sm" color="default" /> : null}
					</Button>
				</View>
			</ScrollView>
		</View>
	);
}
