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
import { Alert, Text } from "react-native";

import FormHeader, { FormContainer } from "@/components/form";
import { authClient } from "@/lib/auth-client";

export default function SignUpRoute() {
	const muted = useThemeColor("muted");
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
						<Ionicons name="person-outline" size={20} color={muted} />
					</InputGroup.Prefix>
					<InputGroup.Input
						className="h-16 rounded-3xl"
						placeholder="Enter your full name"
						autoCapitalize="words"
						value={name}
						onChangeText={setName}
					/>
				</InputGroup>
			</TextField>
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
			{/* confirm password */}
			<TextField isRequired>
				<InputGroup>
					<InputGroup.Prefix isDecorative className="pl-4">
						<Ionicons name="lock-closed-outline" size={20} color={muted} />
					</InputGroup.Prefix>
					<InputGroup.Input
						className="h-16 rounded-3xl"
						placeholder="Confirm your password"
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
				onPress={handleSignUp}
				isDisabled={isLoading}
				className="rounded-3xl"
				size="lg"
			>
				<Button.Label>
					{isLoading ? "Creating Account..." : "Sign Up"}
				</Button.Label>
				{isLoading ? <Spinner size="sm" color="default" /> : null}
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
