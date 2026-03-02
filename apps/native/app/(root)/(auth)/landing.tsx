import { Link } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { Icon } from "@/components/icon";

export default function Landing() {
	return (
		<View className="flex-1 gap-4 px-8 pt-safe pb-safe">
			<View className="flex-1 justify-end">
				<Text className="font-extrabold text-6xl text-foreground">
					Convexpo
				</Text>
			</View>
			{/* OAuth buttons — placeholder for now */}
			<View className="w-full flex-row gap-4">
				<Button className="flex-1" size="lg" variant="tertiary" isDisabled>
					<Icon name="logo-google" size={20} className="text-foreground" />
					<Button.Label>Google</Button.Label>
				</Button>
				<Button className="flex-1" size="lg" variant="tertiary" isDisabled>
					<Icon name="logo-apple" size={20} className="text-foreground" />
					<Button.Label>Apple</Button.Label>
				</Button>
			</View>
			<Link href="/(root)/(auth)/email/signin" asChild>
				<Button className="w-full" size="lg">
					<Button.Label>Email</Button.Label>
				</Button>
			</Link>
		</View>
	);
}
