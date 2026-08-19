import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";

const ActivityHeaderButton = () => {
  const colors = useThemeColors();

  return (
    <Pressable
      testID="home-activity-button"
      hitSlop={12}
      onPress={() => {
        Haptics.selectionAsync();
        router.navigate("/activity");
      }}
    >
      <Ionicons name="time-outline" size={24} color={colors.primary} />
    </Pressable>
  );
};

export default ActivityHeaderButton;
