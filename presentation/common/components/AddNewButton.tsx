import { Pressable } from "react-native";

import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";

interface props {
  onPressAction: () => void;
}

const AddNewButton = ({ onPressAction }: props) => {
  const primaryColor = useThemeColor({}, "primary");
  return (
    <Pressable hitSlop={12} onPress={onPressAction}>
      <Ionicons name="add" size={24} color={primaryColor} />
    </Pressable>
  );
};

export default AddNewButton;
