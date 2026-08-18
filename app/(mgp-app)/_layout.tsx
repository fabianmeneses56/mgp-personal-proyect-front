import { Redirect, Stack, router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, AppState, View } from "react-native";

import LogoutIconButton from "@/presentation/auth/components/LogoutIconButton";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import ActivityHeaderButton from "@/presentation/activity/components/ActivityHeaderButton";
import AddNewButton from "@/presentation/common/components/AddNewButton";
import DeleteExerciseHeaderButton from "@/presentation/exercises/components/DeleteExerciseHeaderButton";
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

  // Sheets nativos (UISheetPresentationController en iOS). Con fitToContents
  // el sheet mide lo que mide su contenido; contentStyle es obligatorio o el
  // sheet queda transparente.
  const sheetScreenOptions: React.ComponentProps<typeof Stack.Screen>["options"] = {
    presentation: "formSheet",
    headerShown: false,
    sheetAllowedDetents: "fitToContents",
    sheetGrabberVisible: true,
    sheetCornerRadius: 34,
    sheetElevation: 24,
    contentStyle: {
      backgroundColor: backgroundColor,
    },
  };

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
