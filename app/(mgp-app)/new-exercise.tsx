import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createExercise } from "@/core/exercises/actions/create-exercise.action";
import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import { showAlert } from "@/helpers/alerts/alert.service";
import { usePickExerciseImage } from "@/presentation/exercises/hooks/usePickExerciseImage";
import { Fonts } from "@/presentation/theme/fonts";
import SheetScreen from "@/presentation/theme/components/SheetScreen";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";

const WEIGHT_UNITS = ["kg", "lb"];

const NewExerciseScreen = () => {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const queryClient = useQueryClient();

  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const primaryColor = useThemeColor({}, "primary");
  const mutedText = useThemeColor({}, "textMuted");
  const faintText = useThemeColor({}, "textFaint");

  const [exerciseName, setExerciseName] = useState("");
  const [exerciseWeight, setExerciseWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [selectedImage, setSelectedImage] = useState<PickedExerciseImage | null>(
    null
  );
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const { pickImage } = usePickExerciseImage();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets failure flag when the selected image changes
    setImagePreviewFailed(false);
  }, [selectedImage]);

  const exerciseMutation = useMutation({
    mutationFn: createExercise,
    onSuccess(data) {
      if (data.imageUrl) {
        Image.prefetch(data.imageUrl);
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      router.back();
      showAlert("Ejercicio guardado", `${data.name} se creo correctamente`);
    },
    onError(error) {
      showAlert("Error", error.message);
    },
  });

  const handleCreateExercise = () => {
    if (!exerciseName.trim()) {
      showAlert("Campo requerido", "Ingresa el nombre del ejercicio.");
      return;
    }

    const normalizedWeight = exerciseWeight.trim().replace(",", ".");
    const parsedWeight = Number(normalizedWeight);

    if (!normalizedWeight || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      showAlert("Peso invalido", "Ingresa un peso numerico mayor a 0.");
      return;
    }

    exerciseMutation.mutate({
      name: exerciseName.trim(),
      weight: parsedWeight,
      weightUnit: weightUnit.trim() || "kg",
      category: String(categoryId),
      image: selectedImage ?? undefined,
    });
  };

  const handlePickImage = async () => {
    const image = await pickImage();
    if (image) {
      setSelectedImage(image);
    }
  };

  return (
    <SheetScreen>
      <ThemedText type="subtitle" style={styles.modalTitle}>
        Nuevo ejercicio
      </ThemedText>
      <ThemedText style={[styles.modalDescription, { color: mutedText }]}>
        Agrega el nombre, el peso y la unidad para esta categoria.
      </ThemedText>

      <ThemedTextInput
        placeholder="Nombre del ejercicio"
        value={exerciseName}
        onChangeText={setExerciseName}
        autoCapitalize="words"
        autoFocus
        maxLength={40}
      />

      <View style={styles.weightRow}>
        <ThemedTextInput
          placeholder="Peso"
          value={exerciseWeight}
          onChangeText={setExerciseWeight}
          keyboardType="decimal-pad"
          style={styles.weightInput}
        />

        <View style={[styles.unitToggle, { backgroundColor: borderColor }]}>
          {WEIGHT_UNITS.map((unit) => (
            <Pressable
              key={unit}
              onPress={() => setWeightUnit(unit)}
              style={[
                styles.unitOption,
                weightUnit === unit && { backgroundColor: surfaceColor },
              ]}
            >
              <Text
                style={[
                  styles.unitOptionText,
                  { color: weightUnit === unit ? primaryColor : faintText },
                ]}
              >
                {unit}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {selectedImage ? (
        <View style={styles.imagePreviewCard}>
          {imagePreviewFailed ? (
            <View style={[styles.imagePreview, styles.imagePreviewFallback, { borderColor }]}>
              <Ionicons name="image-outline" size={22} color={mutedText} />
            </View>
          ) : (
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.imagePreview}
              contentFit="cover"
              onError={() => setImagePreviewFailed(true)}
            />
          )}
          <View style={styles.imagePreviewOverlay}>
            <View style={styles.imageAddedBadge}>
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
              <Text style={styles.imageAddedText}>Imagen añadida</Text>
            </View>
            <Pressable style={styles.changeImageChip} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={12} color={primaryColor} />
              <Text style={[styles.changeImageChipText, { color: primaryColor }]}>
                Cambiar
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.addImageButton, { borderColor: faintText }]}
          onPress={handlePickImage}
        >
          <Ionicons name="image-outline" size={19} color={primaryColor} />
          <Text style={[styles.addImageButtonText, { color: primaryColor }]}>
            Agregar imagen
          </Text>
        </Pressable>
      )}

      <View style={styles.modalButtonWrapper}>
        <ThemedButton
          onPress={handleCreateExercise}
          disabled={exerciseMutation.isPending}
        >
          {exerciseMutation.isPending ? "Guardando..." : "Guardar ejercicio"}
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
    marginBottom: 18,
    fontSize: 14,
  },
  weightRow: {
    flexDirection: "row",
    gap: 11,
  },
  weightInput: {
    flex: 1,
    marginBottom: 0,
  },
  unitToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    height: 54,
    alignItems: "center",
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 11,
  },
  unitOptionText: {
    fontFamily: Fonts.extrabold,
    fontSize: 13,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 11,
  },
  addImageButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  imagePreviewCard: {
    marginTop: 11,
    borderRadius: 16,
    overflow: "hidden",
    height: 130,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePreviewFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  imagePreviewOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(12,13,17,0.5)",
  },
  imageAddedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  imageAddedText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  changeImageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  changeImageChipText: {
    fontFamily: Fonts.extrabold,
    fontSize: 12,
  },
  modalButtonWrapper: {
    marginTop: 15,
  },
  cancelButton: {
    marginTop: 6,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 4,
  },
  cancelText: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
});

export default NewExerciseScreen;
