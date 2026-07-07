import { Redirect, Stack } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import LogoutIconButton from "@/presentation/auth/components/LogoutIconButton";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

const CheckAuthenticationLayout = () => {
  const { status, checkStatus } = useAuthStore();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const primaryColor = useThemeColor({}, "primary");

  useEffect(() => {
    checkStatus();
  }, []);

  if (status === "checking") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 5,
          backgroundColor,
        }}
      >
        <ActivityIndicator color={primaryColor} />
      </View>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect href="/auth/login" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: backgroundColor,
          },
          headerTitleStyle: {
            fontFamily: Fonts.extrabold,
            fontSize: 17,
            color: textColor,
          },
          headerTintColor: primaryColor,
          contentStyle: {
            backgroundColor: backgroundColor,
          },
        }}
      >
        <Stack.Screen
          name="(home)/index"
          options={{
            title: "Categorias",
            headerLeft: () => <LogoutIconButton />,
            // headerRight: () => (
            //   <AddNewButton onPressAction={() => setModalVisible(true)} />
            // ),
          }}
        />

        <Stack.Screen
          name="category/[id]"
          options={{
            title: "Ejercicios",
          }}
        />

        <Stack.Screen
          name="exercise/[id]"
          options={{
            title: "Detalle del ejercicio",
          }}
        />
      </Stack>
    </>
  );
};

export default CheckAuthenticationLayout;
