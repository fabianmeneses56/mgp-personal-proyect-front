import { Link, LinkProps } from "expo-router";
import { useThemeColor } from "../hooks/use-theme-color";

interface Props extends LinkProps {}
// type Props = Omit<LinkProps, "style"> & { style?: StyleProp<TextStyle> };
const ThemedLink = ({ style, ...rest }: Props) => {
  const primaryColor = useThemeColor({}, "primary");

  return (
    <Link
      style={[
        {
          color: primaryColor,
        },
        style,
      ]}
      {...rest}
    />
  );
};
export default ThemedLink;
