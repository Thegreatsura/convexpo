import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useThemeColor } from "heroui-native";
import { useMemo } from "react";
import { Platform } from "react-native";

export const useNavigationOptions = () => {
	const foreground = useThemeColor("foreground");
	const background = useThemeColor("background");

	return useMemo(() => {
		const root: NativeStackNavigationOptions = {
			contentStyle: {
				backgroundColor: background,
			},
		};

		const base: NativeStackNavigationOptions = {
			headerTintColor: foreground,
			headerTitleAlign: "center",
			headerLargeTitleShadowVisible: false,
			headerLargeTitleStyle: {
				color: foreground,
			},
			headerShadowVisible: false,
			contentStyle: { backgroundColor: background },
		};

		return {
			root,
			standard: {
				...base,
				headerStyle: {
					backgroundColor: Platform.OS === "ios" ? "transparent" : background,
				},
				headerTransparent: Platform.OS === "ios",
			},
			modal: {
				...base,
				headerStyle: {
					backgroundColor: Platform.OS === "ios" ? "transparent" : background,
				},
			},
		};
	}, [foreground, background]);
};
