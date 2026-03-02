import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Pressable, Text } from "react-native";

import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export default function EmailLayout() {
	const { modal } = useNavigationOptions();
	return (
		<Stack
			screenOptions={{
				gestureEnabled: false,
				headerTransparent: true,
				...modal,
			}}
		>
			<Stack.Screen
				name="signin"
				options={{
					headerLeft: () => <CloseButton />,
					headerRight: () => <SignUpButton />,
					title: "",
				}}
			/>
			<Stack.Screen
				name="signup"
				options={{
					title: "",
				}}
			/>
			<Stack.Screen
				name="(reset)/request-password-reset"
				options={{
					title: "",
				}}
			/>
			<Stack.Screen
				name="(reset)/reset-password"
				options={{
					title: "",
				}}
			/>
		</Stack>
	);
}
/* ------------------------------ close button ------------------------------ */
const CloseButton = () => {
	const foreground = useThemeColor("foreground");
	return (
		<Link href=".." asChild>
			<Pressable className="justify-center rounded-full p-2">
				<Ionicons name="close" size={22} color={foreground} />
			</Pressable>
		</Link>
	);
};

const SignUpButton = () => {
	return (
		<Link href="/(root)/(auth)/email/signup" asChild>
			<Pressable className="justify-center rounded-full px-3">
				<Text className="text-foreground">Sign Up</Text>
			</Pressable>
		</Link>
	);
};
