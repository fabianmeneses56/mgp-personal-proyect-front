import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import StateCard from "./StateCard";

interface props {
  title: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const EmptyState = ({ title, description, style, testID }: props) => {
  const colors = useThemeColors();

  return (
    <StateCard style={style} testID={testID}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>

      {description && (
        <ThemedText style={[styles.description, { color: colors.textMuted }]}>
          {description}
        </ThemedText>
      )}
    </StateCard>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  title: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
  },
});
