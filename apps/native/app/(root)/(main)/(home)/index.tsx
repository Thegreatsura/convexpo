import { api } from "@my-better-t-app/backend";
import { useConvexAuth, useQuery } from "convex/react";
import { Surface } from "heroui-native";
import { ScrollView, Text, View } from "react-native";

export default function HomeRoute() {
	const healthCheck = useQuery(api.healthCheck.get);
	const { isAuthenticated } = useConvexAuth();
	const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");

	return (
		<View className="flex-1">
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				contentContainerClassName="gap-4 pt-2 px-4 pb-24"
			>
				{/* User card */}
				{user ? (
					<Surface variant="secondary" className="rounded-3xl p-6">
						<Text className="font-bold text-foreground text-lg">
							{user.name}
						</Text>
						<Text className="pt-1 text-muted text-sm">{user.email}</Text>
					</Surface>
				) : null}

				{/* API Status */}
				<Surface variant="secondary" className="rounded-3xl p-6">
					<Text className="mb-2 font-medium text-foreground">API Status</Text>
					<View className="flex-row items-center gap-2">
						<View
							className={`h-2 w-2 rounded-full ${healthCheck === "OK" ? "bg-success" : "bg-danger"}`}
						/>
						<Text className="text-muted text-xs">
							{healthCheck === undefined
								? "Checking..."
								: healthCheck === "OK"
									? "Connected to Convex"
									: "Disconnected"}
						</Text>
					</View>
				</Surface>

				{/* Placeholder for posts — will be brought back later */}
				<Surface variant="secondary" className="rounded-3xl p-6">
					<Text className="font-medium text-foreground">Posts</Text>
					<Text className="pt-1 text-muted text-sm">
						Post CRUD will be added back in the next phase.
					</Text>
				</Surface>
			</ScrollView>
		</View>
	);
}
