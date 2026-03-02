import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Landing() {
	const foreground = useThemeColor("foreground");

	return (
		<SafeAreaView className="flex-1 gap-4 px-8">
			<View className="flex-1 justify-end">
				<Text className="font-extrabold text-6xl text-foreground">
					Convexpo
				</Text>
				<Text className="text-muted text-xl">
					Convex + Better Auth + Expo + HeroUI = 🚀
				</Text>
			</View>
			{/* OAuth buttons — placeholder for now */}
			<View className="w-full flex-row gap-4">
				<Button
					className="flex-1 overflow-hidden rounded-full"
					size="lg"
					variant="tertiary"
					isDisabled
				>
					<Ionicons name="logo-google" size={20} color={foreground} />
					<Button.Label>Google</Button.Label>
				</Button>
				<Button
					className="flex-1 overflow-hidden rounded-full"
					size="lg"
					variant="tertiary"
					isDisabled
				>
					<Ionicons name="logo-apple" size={20} color={foreground} />
					<Button.Label>Apple</Button.Label>
				</Button>
			</View>
			<Link href="/(root)/(auth)/email/signin" asChild>
				<Button className="w-full rounded-full" size="lg">
					<Button.Label>Email</Button.Label>
				</Button>
			</Link>
		</SafeAreaView>
	);
}
