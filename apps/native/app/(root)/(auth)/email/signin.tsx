import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import {
	Button,
	InputGroup,
	Spinner,
	TextField,
	useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { Alert } from "react-native";

import FormHeader, { FormContainer } from "@/components/form";
import { authClient } from "@/lib/auth-client";

export default function SignInRoute() {
	const muted = useThemeColor("muted");
	/* ---------------------------------- state --------------------------------- */
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	/* ----------------------------- handle sign in ----------------------------- */
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
				password: password,
				rememberMe: true,
			},
			{
				onRequest: () => {
					setIsLoading(true);
				},
				onError: (ctx) => {
					setIsLoading(false);
					Alert.alert("Error", ctx.error.message || "Failed to sign in");
				},
				onSuccess: () => {
					setIsLoading(false);
				},
			},
		);
	};
	/* --------------------------------- return --------------------------------- */
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
						<Ionicons name="mail-outline" size={20} color={muted} />
					</InputGroup.Prefix>
					<InputGroup.Input
						className="h-16 rounded-3xl"
						placeholder="Enter your email"
						keyboardType="email-address"
						autoCapitalize="none"
						value={email}
						onChangeText={setEmail}
					/>
				</InputGroup>
			</TextField>
			{/* password */}
			<TextField isRequired>
				<InputGroup>
					<InputGroup.Prefix isDecorative className="pl-4">
						<Ionicons name="lock-closed-outline" size={20} color={muted} />
					</InputGroup.Prefix>
					<InputGroup.Input
						className="h-16 rounded-3xl"
						placeholder="Enter your password"
						secureTextEntry
						value={password}
						onChangeText={setPassword}
					/>
					<InputGroup.Suffix isDecorative className="pr-4">
						<Ionicons name="eye-outline" size={20} color={muted} />
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
			{/* submit */}
			<Button
				onPress={handleSignIn}
				isDisabled={isLoading}
				size="lg"
				className="rounded-3xl"
			>
				<Button.Label>{isLoading ? "Signing In..." : "Sign In"}</Button.Label>
				{isLoading ? <Spinner size="sm" color="default" /> : null}
			</Button>
			{/* forgot password */}
			<Link href="/(root)/(auth)/email/(reset)/request-password-reset" asChild>
				<Button
					variant="tertiary"
					size="sm"
					className="self-center rounded-3xl"
				>
					<Ionicons name="lock-closed-outline" size={14} color={muted} />
					<Button.Label>Forgot Password?</Button.Label>
					<Ionicons name="chevron-forward" size={16} color={muted} />
				</Button>
			</Link>
		</FormContainer>
	);
}
