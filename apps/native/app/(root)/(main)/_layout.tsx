import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useThemeColor } from "heroui-native";

export default function MainLayout() {
	const accent = useThemeColor("accent");

	return (
		<NativeTabs>
			<NativeTabs.Trigger name="(home)">
				<NativeTabs.Trigger.Icon
					sf={{ default: "globe.americas", selected: "globe.americas.fill" }}
					md="home"
					selectedColor={accent}
				/>
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="settings">
				<NativeTabs.Trigger.Icon
					sf={{
						default: "person.text.rectangle",
						selected: "person.text.rectangle.fill",
					}}
					md="settings"
					selectedColor={accent}
				/>
				<NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
