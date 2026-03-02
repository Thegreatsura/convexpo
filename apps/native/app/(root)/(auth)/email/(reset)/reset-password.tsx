import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
	Button,
	InputGroup,
	Spinner,
	TextField,
	useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import FormHeader, { FormContainer } from "@/components/form";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordRoute() {
	const muted = useThemeColor("muted");
	const foreground = useThemeColor("foreground");
	const router = useRouter();

	const { token, error } = useLocalSearchParams<{
		token: string;
		error?: string;
	}>();
	/* ---------------------------------- state --------------------------------- */
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	/* ------------------------- handle reset password ------------------------- */
	const handleResetPassword = async () => {
		if (!password) {
			Alert.alert("Error", "Please enter your new password");
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert("Error", "Passwords don't match");
			return;
		}
		if (password.length < 6) {
			Alert.alert("Error", "Password must be at least 6 characters");
			return;
		}

		await authClient.resetPassword(
			{
				newPassword: password,
				token: token,
			},
			{
				onRequest: () => {
					setIsLoading(true);
				},
				onError: (ctx) => {
					setIsLoading(false);
					Alert.alert("Error", ctx.error.message || "Failed to reset password");
				},
				onSuccess: () => {
					setIsLoading(false);
					Alert.alert("Success", "Password reset successfully");
					router.back();
				},
			},
		);
	};
	/* --------------------------------- invalid token --------------------------------- */
	if (error === "INVALID_TOKEN" || !token) {
		return (
			<View className="flex-1 bg-background">
				<View className="flex-1 justify-center px-6">
					<View className="mb-8">
						<Text className="mb-4 font-bold text-2xl text-foreground">
							Invalid Link
						</Text>
						<Text className="text-muted">
							This reset link has already been used or is invalid
						</Text>
					</View>
					<Link href="/(root)/(auth)/email/signin" asChild>
						<Button className="rounded-3xl">
							<Ionicons
								name="arrow-back-outline"
								size={16}
								color={foreground}
							/>
							<Button.Label>Back to Sign In</Button.Label>
						</Button>
					</Link>
				</View>
			</View>
		);
	}
	/* --------------------------------- return --------------------------------- */
	return (
		<FormContainer>
			<FormHeader
				title="Reset Password"
				description="Enter your new password to complete the reset"
			/>
			{/* new password */}
			<TextField isRequired>
				<InputGroup>
					<InputGroup.Prefix isDecorative className="pl-4">
						<Ionicons name="lock-closed-outline" size={20} color={muted} />
					</InputGroup.Prefix>
					<InputGroup.Input
						className="h-16 rounded-3xl"
						placeholder="Enter your new password"
						secureTextEntry
						value={password}
						onChangeText={setPassword}
					/>
					<InputGroup.Suffix isDecorative className="pr-4">
						<Ionicons name="eye-outline" size={20} color={muted} />
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
			{/* confirm password */}
			<TextField isRequired>
				<InputGroup>
					<InputGroup.Prefix isDecorative className="pl-4">
						<Ionicons name="lock-closed-outline" size={20} color={muted} />
					</InputGroup.Prefix>
					<InputGroup.Input
						className="h-16 rounded-3xl"
						placeholder="Confirm your new password"
						secureTextEntry
						value={confirmPassword}
						onChangeText={setConfirmPassword}
					/>
					<InputGroup.Suffix isDecorative className="pr-4">
						<Ionicons name="checkmark-outline" size={20} color={muted} />
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
			{/* submit */}
			<Button
				onPress={handleResetPassword}
				isDisabled={isLoading}
				className="rounded-3xl"
				size="lg"
			>
				<Button.Label>
					{isLoading ? "Resetting..." : "Reset Password"}
				</Button.Label>
				{isLoading ? <Spinner size="sm" color="default" /> : null}
			</Button>
		</FormContainer>
	);
}
