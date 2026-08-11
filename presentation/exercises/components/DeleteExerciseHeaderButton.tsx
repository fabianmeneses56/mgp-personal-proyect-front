import { Pressable, StyleSheet } from "react-native";

import { showConfirm } from "@/helpers/alerts/alert.service";
import { useExerciseActions } from "@/presentation/exercises/hooks/useExerciseActions";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";

interface props {
  exerciseId: string;
  name?: string;
}

const DeleteExerciseHeaderButton = ({ exerciseId, name }: props) => {
  const dangerText = useThemeColor({}, "danger");
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
      <Ionicons name="trash-outline" size={22} color={dangerText} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  deleteHeaderButton: {
    padding: 4,
  },
});

export default DeleteExerciseHeaderButton;
