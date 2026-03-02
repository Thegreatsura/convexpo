import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useThemeColor } from "heroui-native";
import { useMemo } from "react";
import { Platform } from "react-native";

export const useNavigationOptions = () => {
	const foreground = useThemeColor("foreground");
	const background = useThemeColor("background");

	return useMemo(() => {
		const base: NativeStackNavigationOptions = {
			headerTintColor: foreground,
			headerTitleAlign: "center",
			headerLargeTitleShadowVisible: false,
			headerLargeTitleStyle: { color: foreground },
			headerShadowVisible: false,
			contentStyle: { backgroundColor: background },
		};

		const platformHeader: NativeStackNavigationOptions = Platform.select({
			ios: { headerStyle: { backgroundColor: "transparent" } },
			default: { headerStyle: { backgroundColor: background } },
		});

		return {
			base,
			root: {
				contentStyle: { backgroundColor: background },
			} satisfies NativeStackNavigationOptions,
			standard: {
				...base,
				...platformHeader,
				headerTransparent: Platform.OS === "ios",
			},
			modal: {
				...base,
				...platformHeader,
			},
		};
	}, [foreground, background]);
};
