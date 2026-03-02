import "@/global.css";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env } from "@my-better-t-app/env/native";
import { ConvexReactClient } from "convex/react";
import { Slot } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { UserProvider } from "@/contexts/user-context";
import { authClient } from "@/lib/auth-client";
import SplashScreenProvider from "@/providers/SplashScreenProvider";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
	unsavedChangesWarning: false,
});

/* ------------------------------- root layout ------------------------------ */
export default function Layout() {
	return (
		<GestureHandlerRootView className="flex-1">
			<KeyboardProvider>
				<AppThemeProvider>
					<HeroUINativeProvider>
						<ConvexBetterAuthProvider client={convex} authClient={authClient}>
							<UserProvider>
								<SplashScreenProvider>
									<Slot />
								</SplashScreenProvider>
							</UserProvider>
						</ConvexBetterAuthProvider>
					</HeroUINativeProvider>
				</AppThemeProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
