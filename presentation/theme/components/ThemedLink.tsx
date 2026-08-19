import { Link, LinkProps } from "expo-router";
import { useThemeColors } from "../hooks/use-theme-colors";

interface Props extends LinkProps {}
// type Props = Omit<LinkProps, "style"> & { style?: StyleProp<TextStyle> };
const ThemedLink = ({ style, ...rest }: Props) => {
  const colors = useThemeColors();

  return (
    <Link
      style={[
        {
          color: colors.primary,
        },
        style,
      ]}
      {...rest}
    />
  );
};
export default ThemedLink;
