import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import StateCard from "./StateCard";

interface props {
  message: string;
  onRetry: () => void;
  /**
   * `card` (default) for screens that are not already inside another card;
   * `inline` when the state lives inside one.
   */
  variant?: "card" | "inline";
  retryLabel?: string;
  retryAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ErrorState = ({
  message,
  onRetry,
  variant = "card",
  retryLabel = "Reintentar",
  retryAccessibilityLabel,
  style,
  testID,
}: props) => {
  const colors = useThemeColors();

  const retryButton = (
    <Pressable
      onPress={onRetry}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={retryAccessibilityLabel ?? retryLabel}
      style={variant === "card" ? styles.cardRetryButton : undefined}
    >
      <Text
        style={[
          variant === "card" ? styles.cardRetryText : styles.inlineRetryText,
          { color: colors.primary },
        ]}
      >
        {retryLabel}
      </Text>
    </Pressable>
  );

  if (variant === "inline") {
    return (
      <View testID={testID} style={[styles.inline, style]}>
        <Text style={[styles.inlineMessage, { color: colors.textFaint }]}>
          {message}
        </Text>
        {retryButton}
      </View>
    );
  }

  return (
    <StateCard style={style} testID={testID}>
      <ThemedText type="subtitle" style={styles.cardMessage}>
        {message}
      </ThemedText>
      {retryButton}
    </StateCard>
  );
};

export default ErrorState;

const styles = StyleSheet.create({
  cardMessage: {
    textAlign: "center",
  },
  cardRetryButton: {
    marginTop: 4,
  },
  cardRetryText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  inline: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  inlineMessage: {
    fontFamily: Fonts.semibold,
    fontSize: 13.5,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  inlineRetryText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
});
