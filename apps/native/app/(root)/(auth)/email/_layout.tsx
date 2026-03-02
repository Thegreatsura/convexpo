import { Link, Stack } from "expo-router";
import { Pressable, Text } from "react-native";

import { Icon } from "@/components/icon";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export default function EmailLayout() {
	const { modal } = useNavigationOptions();
	return (
		<Stack
			screenOptions={{
				...modal,
				gestureEnabled: false,
				headerTransparent: true,
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
	return (
		<Link href=".." asChild>
			<Pressable className="justify-center rounded-full p-2" hitSlop={24}>
				<Icon name="close" size={22} className="text-foreground" />
			</Pressable>
		</Link>
	);
};

const SignUpButton = () => {
	return (
		<Link href="/(root)/(auth)/email/signup" asChild>
			<Pressable className="p-2" hitSlop={24}>
				<Text className="text-foreground">Sign Up</Text>
			</Pressable>
		</Link>
	);
};
