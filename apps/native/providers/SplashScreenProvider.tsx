import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import type React from "react";
import { useEffect } from "react";

import { useUser } from "@/contexts/user-context";
import { delay } from "@/utils/delay";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
	duration: 200,
	fade: true,
});

export default function SplashScreenProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isLoading: isUserLoading } = useUser();
	const [fontsLoaded, fontError] = useFonts({});

	if (fontError) {
		throw fontError;
	}

	useEffect(() => {
		if (isUserLoading || !fontsLoaded) {
			return;
		}
		delay(350).then(() => {
			SplashScreen.hideAsync();
		});
	}, [isUserLoading, fontsLoaded]);

	return <>{children}</>;
}
