import { Link } from "expo-router";
import { Button, InputGroup, Spinner, TextField } from "heroui-native";
import { useState } from "react";
import { Alert } from "react-native";
import FormHeader, { FormContainer } from "@/components/form";
import { Icon } from "@/components/icon";
import { useThemeColor } from "@/hooks/useThemeColor";
import { authClient } from "@/lib/auth-client";

export default function SignInRoute() {
	const accentForeground = useThemeColor("accent-foreground");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSignIn = async () => {
		if (!email.trim()) {
			Alert.alert("Error", "Please enter your email");
			return;
		}
		if (!password) {
			Alert.alert("Error", "Please enter your password");
			return;
		}
		await authClient.signIn.email(
			{
				email: email.trim(),
				password,
				rememberMe: true,
			},
			{
				onRequest: () => setIsLoading(true),
				onError: (ctx) => {
					setIsLoading(false);
					Alert.alert("Error", ctx.error.message || "Failed to sign in");
				},
				onSuccess: () => setIsLoading(false),
			},
		);
	};

	return (
		<FormContainer>
			<FormHeader
				title="Login"
				description="Enter your email and password to login"
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
						textContentType="oneTimeCode"
					/>
				</InputGroup>
			</TextField>
			{/* password */}
			<TextField isRequired>
				<InputGroup>
					<InputGroup.Prefix isDecorative className="pl-4">
						<Icon name="lock-closed-outline" size={20} className="text-muted" />
					</InputGroup.Prefix>
					<InputGroup.Input
						placeholder="Enter your password"
						secureTextEntry
						value={password}
						onChangeText={setPassword}
						textContentType="oneTimeCode"
					/>
					<InputGroup.Suffix isDecorative className="pr-4">
						<Icon name="eye-outline" size={20} className="text-muted" />
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
			{/* submit */}
			<Button onPress={handleSignIn} isDisabled={isLoading}>
				<Button.Label>{isLoading ? "Signing In..." : "Sign In"}</Button.Label>
				{isLoading ? <Spinner size="sm" color={accentForeground} /> : null}
			</Button>
			{/* forgot password */}
			<Link href="/(root)/(auth)/email/(reset)/request-password-reset" asChild>
				<Button variant="ghost" size="sm" className="self-center">
					<Button.Label className="text-muted">Forgot Password?</Button.Label>
				</Button>
			</Link>
		</FormContainer>
	);
}
