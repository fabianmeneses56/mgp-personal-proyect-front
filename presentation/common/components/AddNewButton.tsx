import { Pressable } from "react-native";

import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";

interface props {
  onPressAction: () => void;
  testID?: string;
}

const AddNewButton = ({ onPressAction, testID }: props) => {
  const colors = useThemeColors();
  return (
    <Pressable testID={testID} hitSlop={12} onPress={onPressAction}>
      <Ionicons name="add" size={24} color={colors.primary} />
    </Pressable>
  );
};

export default AddNewButton;
