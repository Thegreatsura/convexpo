import { Stack } from "expo-router";

import { ThemeToggle } from "@/components/theme-toggle";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export default function HomeLayout() {
	const { standard } = useNavigationOptions();

	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					title: "Home",
					headerLargeTitle: true,
					...standard,
					headerLeft: () => <ThemeToggle />,
				}}
			/>
		</Stack>
	);
}
