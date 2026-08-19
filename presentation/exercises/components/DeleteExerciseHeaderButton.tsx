import { Pressable, StyleSheet } from "react-native";

import { showConfirm } from "@/helpers/alerts/alert.service";
import { useExerciseActions } from "@/presentation/exercises/hooks/useExerciseActions";
import { useThemeColors } from "@/presentation/theme/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";

interface props {
  exerciseId: string;
  name?: string;
}

const DeleteExerciseHeaderButton = ({ exerciseId, name }: props) => {
  const colors = useThemeColors();
  const { remove, isDeleting } = useExerciseActions(exerciseId, name);

  const confirmDeleteExercise = () => {
    showConfirm({
      title: "Eliminar ejercicio",
      message: `Se eliminara ${name ?? "este ejercicio"} y ya no aparecera en tu lista.`,
      confirmText: isDeleting ? "Eliminando..." : "Eliminar",
      destructive: true,
      onConfirm: () => remove(),
    });
  };

  return (
    <Pressable
      onPress={confirmDeleteExercise}
      disabled={isDeleting}
      hitSlop={10}
      style={({ pressed }) => [
        styles.deleteHeaderButton,
        { opacity: pressed || isDeleting ? 0.75 : 1 },
      ]}
    >
      <Ionicons name="trash-outline" size={22} color={colors.danger} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  deleteHeaderButton: {
    padding: 4,
  },
});

export default DeleteExerciseHeaderButton;
