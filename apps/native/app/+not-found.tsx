import { Link, Stack } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: "" }} />
			<View className="flex-1 gap-4 px-8 pb-safe">
				<View className="flex-1 justify-end">
					<Text className="font-extrabold text-6xl text-foreground">404</Text>
					<Text className="text-muted">This page doesn't exist.</Text>
				</View>
				<Link href="/" asChild>
					<Button className="w-full" size="lg">
						<Button.Label>Go Home</Button.Label>
					</Button>
				</Link>
			</View>
		</>
	);
}
