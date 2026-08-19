import { Redirect, Stack, router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, AppState, View } from "react-native";

import ActivityHeaderButton from "@/presentation/activity/components/ActivityHeaderButton";
import LogoutIconButton from "@/presentation/auth/components/LogoutIconButton";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import AddNewButton from "@/presentation/common/components/AddNewButton";
import DeleteExerciseHeaderButton from "@/presentation/exercises/components/DeleteExerciseHeaderButton";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";

const CheckAuthenticationLayout = () => {
  const { status, checkStatus } = useAuthStore();

  const colors = useThemeColors();

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        nextAppState === "active" &&
        useAuthStore.getState().status === "authenticated"
      ) {
        checkStatus();
      }
    });

    return () => subscription.remove();
  }, []);

  if (status === "checking") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 5,
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect href="/auth/login" />;
  }

  // native Sheets (UISheetPresentationController in iOS)
  const sheetScreenOptions: React.ComponentProps<
    typeof Stack.Screen
  >["options"] = {
    presentation: "formSheet",
    headerShown: false,
    sheetAllowedDetents: "fitToContents",
    sheetGrabberVisible: true,
    sheetCornerRadius: 34,
    sheetElevation: 24,
    contentStyle: {
      backgroundColor: colors.background,
    },
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontFamily: Fonts.extrabold,
            fontSize: 17,
            color: colors.text,
          },
          headerTintColor: colors.primary,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="(home)/index"
          options={{
            title: "Categorias",
            headerLeft: () => <LogoutIconButton />,
            headerRight: () => (
              <View style={{ flexDirection: "row", gap: 16 }}>
                <ActivityHeaderButton />
                <AddNewButton
                  testID="home-new-category-button"
                  onPressAction={() => router.navigate("/new-category")}
                />
              </View>
            ),
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
          options={({ route }) => {
            const { id, name } = (route.params ?? {}) as {
              id?: string;
              name?: string;
            };

            return {
              title: name ?? "Detalle del ejercicio",
              headerRight: () => (
                <DeleteExerciseHeaderButton
                  exerciseId={String(id)}
                  name={name}
                />
              ),
            };
          }}
        />

        <Stack.Screen
          name="exercise-progress"
          options={{
            title: "Progreso",
          }}
        />

        <Stack.Screen
          name="activity"
          options={{
            title: "Actividad",
          }}
        />

        <Stack.Screen name="new-category" options={sheetScreenOptions} />
        <Stack.Screen name="new-exercise" options={sheetScreenOptions} />
        <Stack.Screen name="weight-entry" options={sheetScreenOptions} />
      </Stack>
    </>
  );
};

export default CheckAuthenticationLayout;
