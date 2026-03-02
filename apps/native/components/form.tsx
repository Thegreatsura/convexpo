import { Text, View } from "react-native";

/* ----------------------------- form container ----------------------------- */
export function FormContainer({ children }: { children: React.ReactNode }) {
	return <View className="flex-1 gap-4 px-6 pt-20">{children}</View>;
}
/* ------------------------------- form header ------------------------------ */
export default function FormHeader({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children?: React.ReactNode;
}) {
	return (
		<View className="gap-2">
			<Text className="font-extrabold text-4xl text-foreground">{title}</Text>
			<Text className="text-muted">{description}</Text>
			{children}
		</View>
	);
}
