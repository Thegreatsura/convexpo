import { Link } from "expo-router";
import { Button, InputGroup, Spinner, TextField } from "heroui-native";
import { useState } from "react";
import { Alert, Text } from "react-native";

import FormHeader, { FormContainer } from "@/components/form";
import { Icon } from "@/components/icon";
import { authClient } from "@/lib/auth-client";

export default function SignUpRoute() {
	/* ---------------------------------- state --------------------------------- */
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	/* ------------------------------ handle signup ----------------------------- */
	const handleSignUp = async () => {
		if (!name.trim()) {
			Alert.alert("Error", "Please enter your name");
			return;
		}
		if (!email.trim()) {
			Alert.alert("Error", "Please enter your email");
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

		await authClient.signUp.email(
			{
				name: name.trim(),
				email: email.trim(),
				password: password,
			},
			{
				onRequest: () => {
					setIsLoading(true);
				},
				onError: (ctx) => {
					setIsLoading(false);
					Alert.alert("Error", ctx.error.message || "Failed to sign up");
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
				title="Sign Up"
				description="Create your account to get started"
			/>
			{/* name */}
			<TextField isRequired>
				<InputGroup>
					<InputGroup.Prefix isDecorative className="pl-4">
						<Icon name="person-outline" size={20} className="text-muted" />
					</InputGroup.Prefix>
					<InputGroup.Input
						placeholder="Enter your full name"
						autoCapitalize="words"
						value={name}
						onChangeText={setName}
						textContentType="oneTimeCode"
					/>
				</InputGroup>
			</TextField>
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
					/>
					<InputGroup.Suffix isDecorative className="pr-4">
						<Icon name="eye-outline" size={20} className="text-muted" />
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
			{/* confirm password */}
			<TextField isRequired>
				<InputGroup>
					<InputGroup.Prefix isDecorative className="pl-4">
						<Icon name="lock-closed-outline" size={20} className="text-muted" />
					</InputGroup.Prefix>
					<InputGroup.Input
						placeholder="Confirm your password"
						secureTextEntry
						value={confirmPassword}
						onChangeText={setConfirmPassword}
					/>
					<InputGroup.Suffix isDecorative className="pr-4">
						<Icon name="checkmark-outline" size={20} className="text-muted" />
					</InputGroup.Suffix>
				</InputGroup>
			</TextField>
			{/* submit */}
			<Button onPress={handleSignUp} isDisabled={isLoading}>
				<Button.Label>
					{isLoading ? "Creating Account..." : "Sign Up"}
				</Button.Label>
				{isLoading ? <Spinner size="sm" /> : null}
			</Button>
			<Text className="px-14 text-center text-muted text-sm">
				by continuing you agree to our{" "}
				<Link href="https://convex.dev" className="text-foreground underline">
					terms of service
				</Link>{" "}
				and{" "}
				<Link href="https://convex.dev" className="text-foreground underline">
					privacy policy
				</Link>
			</Text>
		</FormContainer>
	);
}
