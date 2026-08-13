import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { Category } from "@/core/categories/interfaces/category.interface";
import { showAlert } from "@/helpers/alerts/alert.service";
import { useCategory } from "@/presentation/categories/hooks/useCategory";
import { Fonts } from "@/presentation/theme/fonts";
import SheetScreen from "@/presentation/theme/components/SheetScreen";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

const NewCategoryScreen = () => {
  const [formValue, setFormValue] = useState("");
  const { productMutation } = useCategory("new");
  const queryClient = useQueryClient();

  const mutedText = useThemeColor({}, "textMuted");
  const faintText = useThemeColor({}, "textFaint");

  const handleSubmit = async () => {
    const trimmedName = formValue.trim();

    if (!trimmedName) {
      showAlert("Campo requerido", "Ingresa el nombre de la categoria.");
      return;
    }

    const cachedCategories = queryClient.getQueryData<Category[]>([
      "categories",
    ]);

    const isDuplicate = cachedCategories?.some(
      (category) =>
        category.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      showAlert(
        "Nombre duplicado",
        "Ya existe una categoria con ese nombre."
      );
      return;
    }

    try {
      await productMutation.mutateAsync({
        name: formValue.trim(),
        exercise: [],
        id: "",
      });
      router.back();
    } catch (error) {
      showAlert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo guardar la categoria."
      );
    }
  };

  return (
    <SheetScreen>
      <ThemedText type="subtitle" style={styles.modalTitle}>
        Nueva categoria
      </ThemedText>
      <ThemedText style={[styles.modalDescription, { color: mutedText }]}>
        Dale un nombre claro para encontrar mas rapido tus ejercicios.
      </ThemedText>

      <Text style={[styles.fieldLabel, { color: faintText }]}>Nombre</Text>
      <ThemedTextInput
        testID="new-category-name-input"
        placeholder="Nombre de la categoria"
        autoCapitalize="words"
        autoFocus
        value={formValue}
        onChangeText={setFormValue}
        maxLength={40}
      />

      <View style={styles.modalButtonWrapper}>
        <ThemedButton
          testID="new-category-submit-button"
          onPress={handleSubmit}
          disabled={productMutation.isPending}
        >
          {productMutation.isPending ? "Guardando..." : "Guardar categoria"}
        </ThemedButton>
      </View>

      <Pressable style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={[styles.cancelText, { color: mutedText }]}>Cancelar</Text>
      </Pressable>
    </SheetScreen>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    marginBottom: 8,
  },
  modalDescription: {
    lineHeight: 21,
    marginBottom: 20,
    fontSize: 14,
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalButtonWrapper: {
    marginTop: 6,
  },
  cancelButton: {
    marginTop: 6,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  cancelText: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
});

export default NewCategoryScreen;
