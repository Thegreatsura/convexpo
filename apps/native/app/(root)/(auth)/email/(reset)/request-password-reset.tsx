import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Button, InputGroup, Spinner, TextField } from "heroui-native";
import { useState } from "react";
import { Alert } from "react-native";
import FormHeader, { FormContainer } from "@/components/form";
import { Icon } from "@/components/icon";
import { useThemeColor } from "@/hooks/useThemeColor";
import { authClient } from "@/lib/auth-client";

export default function RequestPasswordResetRoute() {
	const router = useRouter();
	const accentForeground = useThemeColor("accent-foreground");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleRequestReset = async () => {
		if (!email.trim()) {
			Alert.alert("Error", "Please enter your email");
			return;
		}

		await authClient.requestPasswordReset(
			{
				email,
				redirectTo: Linking.createURL("email/reset-password"),
			},
			{
				onRequest: () => setIsLoading(true),
				onError: (ctx) => {
					setIsLoading(false);
					Alert.alert(
						"Error",
						ctx.error.message || "Failed to send reset link",
					);
				},
				onSuccess: () => {
					setIsLoading(false);
					Alert.alert("Success", "Reset link sent to your email");
					router.back();
				},
			},
		);
	};

	return (
		<FormContainer>
			<FormHeader
				title="Reset Password"
				description="Enter your email to receive a password reset link"
			/>
			{/* email */}
			<TextField isRequired>
				<InputGroup>
					<InputGroup.Prefix isDecorative className="pl-4">
						<Icon name="mail-outline" size={20} className="text-muted" />
					</InputGroup.Prefix>
					<InputGroup.Input
						placeholder="Enter your email"
						keyboardType="email-address"
						autoCapitalize="none"
						value={email}
						onChangeText={setEmail}
					/>
				</InputGroup>
			</TextField>
			{/* submit */}
			<Button onPress={handleRequestReset} isDisabled={isLoading}>
				<Button.Label>
					{isLoading ? "Sending..." : "Send Reset Link"}
				</Button.Label>
				{isLoading ? <Spinner size="sm" color={accentForeground} /> : null}
			</Button>
		</FormContainer>
	);
}
