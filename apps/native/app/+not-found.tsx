import { Link, Stack } from "expo-router";
import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: "Not Found" }} />
			<View className="flex-1 items-center justify-center bg-background p-4">
				<Surface
					variant="secondary"
					className="max-w-sm items-center rounded-lg p-6"
				>
					<Text className="mb-1 font-medium text-foreground text-lg">
						Page Not Found
					</Text>
					<Text className="mb-4 text-center text-muted text-sm">
						The page you're looking for doesn't exist.
					</Text>
					<Link href="/" asChild>
						<Button size="sm">
							<Button.Label>Go Home</Button.Label>
						</Button>
					</Link>
				</Surface>
			</View>
		</>
	);
}
