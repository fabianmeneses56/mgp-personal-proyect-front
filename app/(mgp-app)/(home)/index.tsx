import React, { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useCategory } from "@/presentation/categories/hooks/useCategory";
import { useCategories } from "@/presentation/categories/hooks/useCategories";
import AddNewButton from "@/presentation/common/components/AddNewButton";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedTextInput from "@/presentation/theme/components/ThemedTextInput";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { router, useNavigation } from "expo-router";

const HomeScreen = () => {
  const { categoriesQuery } = useCategories();
  const [modalVisible, setModalVisible] = useState(false);
  const [formValue, setFormValue] = useState("");
  const navigation = useNavigation();
  const { productMutation } = useCategory("new");

  const surfaceColor = useThemeColor(
    { light: "#F7F8FC", dark: "#20242C" },
    "background"
  );
  const heroColor = useThemeColor(
    { light: "#E8EEFF", dark: "#283552" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#DCE5FF", dark: "#33415C" },
    "background"
  );
  const mutedText = useThemeColor(
    { light: "#667085", dark: "#98A2B3" },
    "text"
  );
  const modalBackground = useThemeColor(
    { light: "#FFFFFF", dark: "#151718" },
    "background"
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AddNewButton onPressAction={() => setModalVisible(true)} />
      ),
    });
  }, [navigation]);

  const handleSubmit = async () => {
    if (!formValue.trim()) {
      Alert.alert("Campo requerido", "Ingresa el nombre de la categoria.");
      return;
    }

    await productMutation.mutateAsync({
      name: formValue.trim(),
      exercise: [],
      id: "",
    });

    setFormValue("");
    setModalVisible(false);
  };

  const closeModal = () => {
    setFormValue("");
    setModalVisible(false);
  };

  if (categoriesQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <ActivityIndicator size={32} color={Colors.light.primary} />
          <ThemedText type="subtitle" style={styles.loadingTitle}>
            Cargando categorias
          </ThemedText>
          <ThemedText style={[styles.loadingText, { color: mutedText }]}>
            Estamos preparando tu espacio de entrenamiento.
          </ThemedText>
        </View>
      </View>
    );
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(category) => category.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.heroCard,
                { backgroundColor: heroColor, borderColor },
              ]}
            >
              <View style={styles.heroBadge}>
                <ThemedText style={styles.heroBadgeText}>Rutina</ThemedText>
              </View>

              <ThemedText type="title" style={styles.heroTitle}>
                Tus categorias
              </ThemedText>

              <ThemedText style={[styles.heroDescription, { color: mutedText }]}>
                Organiza tus ejercicios por grupo y entra rapido a cada categoria.
              </ThemedText>

              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: surfaceColor, borderColor },
                  ]}
                >
                  <ThemedText style={[styles.statLabel, { color: mutedText }]}>
                    Categorias
                  </ThemedText>
                  <ThemedText style={styles.statValue}>
                    {categories.length}
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: surfaceColor, borderColor },
                  ]}
                >
                  <ThemedText style={[styles.statLabel, { color: mutedText }]}>
                    Ejercicios
                  </ThemedText>
                  <ThemedText style={styles.statValue}>
                    {categories.reduce(
                      (total, category) => total + category.exercise.length,
                      0
                    )}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Explora categorias</ThemedText>
              <ThemedText style={[styles.sectionHint, { color: mutedText }]}>
                Toca una tarjeta para ver sus ejercicios.
              </ThemedText>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/category/[id]",
                params: {
                  id: item.id,
                  name: item.name,
                  data: JSON.stringify(item.exercise),
                },
              })
            }
            style={({ pressed }) => [
              styles.categoryCard,
              {
                backgroundColor: surfaceColor,
                borderColor,
                transform: [{ scale: pressed ? 0.985 : 1 }],
                opacity: pressed ? 0.94 : 1,
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.indexBadge,
                  { backgroundColor: heroColor, borderColor },
                ]}
              >
                <ThemedText style={styles.indexBadgeText}>{index + 1}</ThemedText>
              </View>

              <View style={styles.arrowCircle}>
                <ThemedText style={styles.arrowText}>›</ThemedText>
              </View>
            </View>

            <ThemedText type="subtitle" style={styles.categoryName}>
              {item.name}
            </ThemedText>

            <View style={styles.cardFooter}>
              <View>
                <ThemedText style={[styles.footerLabel, { color: mutedText }]}>
                  Ejercicios
                </ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.footerValue}>
                  {item.exercise.length}
                </ThemedText>
              </View>

              <View style={styles.footerPill}>
                <Text style={styles.footerPillText}>Abrir</Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyState,
              { backgroundColor: surfaceColor, borderColor },
            ]}
          >
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Aun no hay categorias
            </ThemedText>
            <ThemedText style={[styles.emptyDescription, { color: mutedText }]}>
              Crea tu primera categoria con el boton superior para empezar a
              organizar tus ejercicios.
            </ThemedText>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: modalBackground, borderColor },
            ]}
          >
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Nueva categoria
            </ThemedText>
            <ThemedText style={[styles.modalDescription, { color: mutedText }]}>
              Dale un nombre claro para encontrar mas rapido tus ejercicios.
            </ThemedText>

            <ThemedTextInput
              placeholder="Nombre de la categoria"
              autoCapitalize="words"
              value={formValue}
              onChangeText={setFormValue}
            />

            <ThemedButton
              onPress={handleSubmit}
              disabled={productMutation.isPending}
            >
              {productMutation.isPending ? "Guardando..." : "Guardar categoria"}
            </ThemedButton>

            <Pressable style={styles.cancelButton} onPress={closeModal}>
              <Text style={[styles.cancelText, { color: mutedText }]}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  loadingTitle: {
    marginTop: 6,
  },
  loadingText: {
    textAlign: "center",
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 28,
    gap: 14,
  },
  headerBlock: {
    gap: 18,
    marginBottom: 6,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(61, 100, 244, 0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 36,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  statLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionHint: {
    fontSize: 15,
    lineHeight: 22,
  },
  categoryCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  indexBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  indexBadgeText: {
    color: Colors.light.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(61, 100, 244, 0.08)",
  },
  arrowText: {
    color: Colors.light.primary,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  categoryName: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  footerValue: {
    fontSize: 18,
  },
  footerPill: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  footerPillText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
    marginTop: 18,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: "center",
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 6,
  },
  modalDescription: {
    lineHeight: 22,
    marginBottom: 18,
  },
  cancelButton: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default HomeScreen;
