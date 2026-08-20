import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";

interface props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const StateCard = ({ children, style, testID }: props) => {
  const colors = useThemeColors();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default StateCard;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
    gap: 10,
  },
});
