import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useAuthStore } from "../store/useAuthStore";

const LogoutIconButton = () => {
  const colors = useThemeColors();
  const { logout } = useAuthStore();

  return (
    <Pressable testID="home-logout-button" hitSlop={12} onPress={logout}>
      <Ionicons name="log-out-outline" size={24} color={colors.primary} />
    </Pressable>
  );
};
export default LogoutIconButton;
