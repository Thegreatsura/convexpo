import { api } from "@app/backend";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Card } from "heroui-native";
import { ScrollView, View } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

function getStatusConfig(
	isLoading: boolean,
	isConnected: boolean,
	colors: { success: string; danger: string; muted: string },
) {
	if (isLoading) {
		return {
			icon: "cloud-outline" as const,
			color: colors.muted,
			label: "Checking...",
		};
	}

	if (isConnected) {
		return {
			icon: "cloud-done-outline" as const,
			color: colors.success,
			label: "Connected to Convex",
		};
	}

	return {
		icon: "cloud-offline-outline" as const,
		color: colors.danger,
		label: "Disconnected",
	};
}

export default function HomeRoute() {
	const healthCheck = useQuery(api.healthCheck.get);
	const success = useThemeColor("success");
	const danger = useThemeColor("danger");
	const muted = useThemeColor("muted");

	const isConnected = healthCheck === "OK";
	const isLoading = healthCheck === undefined;

	const status = getStatusConfig(isLoading, isConnected, {
		success,
		danger,
		muted,
	});

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="always"
			contentContainerClassName="flex-grow px-4 py-2 gap-4"
		>
			{/* API Status */}
			<Card variant="secondary">
				<Card.Body className="flex-row items-center gap-3">
					<Ionicons name={status.icon} size={20} color={status.color} />
					<View>
						<Card.Title>API Status</Card.Title>
						<Card.Description>{status.label}</Card.Description>
					</View>
				</Card.Body>
			</Card>
		</ScrollView>
	);
}
