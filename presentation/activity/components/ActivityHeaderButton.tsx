import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

const ActivityHeaderButton = () => {
  const primaryColor = useThemeColor({}, "primary");

  return (
    <Pressable
      testID="home-activity-button"
      hitSlop={12}
      onPress={() => {
        Haptics.selectionAsync();
        router.navigate("/activity");
      }}
    >
      <Ionicons name="time-outline" size={24} color={primaryColor} />
    </Pressable>
  );
};

export default ActivityHeaderButton;
