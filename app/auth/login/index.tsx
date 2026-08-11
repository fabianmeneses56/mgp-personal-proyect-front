import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useLogin } from "@/presentation/auth/hooks/useLogin";
import { Fonts } from "@/presentation/theme/fonts";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedLink from "@/presentation/theme/components/ThemedLink";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

const LoginScreen = () => {
  const backgroundColor = useThemeColor({}, "background");
  const primaryColor = useThemeColor({}, "primary");
  const mutedText = useThemeColor({}, "textMuted");

  const { form, isPosting, onChangeForm, onLogin } = useLogin();

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={[styles.logoMark, { backgroundColor: primaryColor, shadowColor: primaryColor }]}>
            <Ionicons name="barbell-outline" size={28} color="#FFFFFF" />
          </View>

          <ThemedText type="title" style={styles.title}>
            Ingresar
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>
            Por favor ingresa para continuar
          </ThemedText>

          <View style={styles.form}>
            <ThemedTextInput
              testID="login-email-input"
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail-outline"
              value={form.email}
              onChangeText={(value) => onChangeForm("email", value)}
            />

            <ThemedTextInput
              testID="login-password-input"
              placeholder="Contraseña"
              secureTextEntry
              secureToggle
              autoCapitalize="none"
              icon="lock-closed-outline"
              value={form.password}
              onChangeText={(value) => onChangeForm("password", value)}
            />
          </View>

          <View style={styles.buttonWrapper}>
            <ThemedButton
              testID="login-submit-button"
              icon="arrow-forward-outline"
              onPress={onLogin}
              disabled={isPosting}
            >
              Ingresar
            </ThemedButton>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={{ color: mutedText, fontFamily: Fonts.medium }}>
            ¿No tenés cuenta?{" "}
          </ThemedText>
          <ThemedLink href="/auth/register" style={styles.footerLink}>
            Crear una
          </ThemedLink>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    paddingVertical: 40,
  },
  content: {
    justifyContent: "center",
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    marginTop: 26,
    fontSize: 34,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
  },
  form: {
    marginTop: 30,
  },
  buttonWrapper: {
    marginTop: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 36,
  },
  footerLink: {
    fontFamily: Fonts.bold,
    fontSize: 15.5,
  },
});

export default LoginScreen;
