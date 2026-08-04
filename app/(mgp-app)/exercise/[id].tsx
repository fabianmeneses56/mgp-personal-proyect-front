import AnimatedHistoryRowComponent from "@/presentation/exercises/components/AnimatedHistoryRowComponent";
import FullscreenImageModal from "@/presentation/exercises/components/FullscreenImageModal";
import { useExerciseActions } from "@/presentation/exercises/hooks/useExerciseActions";
import { ThemedText } from "@/presentation/theme/components/themed-text";
import { Fonts } from "@/presentation/theme/fonts";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { WeightProgressChart } from "@/presentation/weight-history/components/WeightProgressChart";
import { useWeightHistoryManager } from "@/presentation/weight-history/hooks/useWeightHistoryManager";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ExerciseDetailScreen = () => {
  const { id, name, categoryName, imageUrl } = useLocalSearchParams<{
    id: string;
    name?: string;
    weightGrams?: string;
    weight?: string;
    weightUnit?: string;
    categoryName?: string;
    imageUrl?: string;
  }>();
  const navigation = useNavigation();

  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const borderColor = useThemeColor({}, "surfaceBorder");
  const textColor = useThemeColor({}, "text");
  const faintText = useThemeColor({}, "textFaint");
  const primaryColor = useThemeColor({}, "primary");
  const primarySoft = useThemeColor({}, "primarySoft");
  const mutedText = useThemeColor({}, "textMuted");
  const dangerBg = useThemeColor({}, "dangerBg");
  const dangerBorder = useThemeColor({}, "dangerBorder");
  const dangerText = useThemeColor({}, "danger");

  const {
    weightHistory,
    isLoading,
    isRefetching,
    isError,
    refetch,
    removeEntry,
  } = useWeightHistoryManager(String(id));

  const swipeableRefs = useRef<Map<string, { close: () => void }>>(new Map());
  const openRowIdRef = useRef<string | null>(null);

  const latestWeightEntry =
    [...weightHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0] ?? null;
  const displayWeight = latestWeightEntry
    ? `${latestWeightEntry.weight} ${latestWeightEntry.weightUnit}`
    : "Sin registros";

  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const { remove, changeImage, currentImageUrl, isDeleting, isChangingImage } =
    useExerciseActions(String(id), name, imageUrl);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets failure flag when the image URL changes
    setImageLoadFailed(false);
  }, [currentImageUrl]);

  const openCreateWeightModal = () => {
    router.navigate({
      pathname: "/weight-entry",
      params: {
        exerciseId: String(id),
        ...(latestWeightEntry && {
          weight: latestWeightEntry.weight.toString(),
          weightUnit: latestWeightEntry.weightUnit,
        }),
      },
    });
  };

  const confirmDeleteExercise = useCallback(() => {
    Alert.alert(
      "Eliminar ejercicio",
      `Se eliminara ${String(name ?? "este ejercicio")} y ya no aparecera en tu lista.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: isDeleting ? "Eliminando..." : "Eliminar",
          style: "destructive",
          onPress: () => remove(),
        },
      ],
    );
  }, [isDeleting, remove, name]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name ? String(name) : undefined,
      headerRight: () => (
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
      ),
    });
  }, [confirmDeleteExercise, dangerText, isDeleting, name, navigation]);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={primaryColor}
        />
      }
    >
      <View
        style={[
          styles.heroCard,
          { backgroundColor: surfaceColor, borderColor },
        ]}
      >
        <View style={[styles.heroBadge, { backgroundColor: primarySoft }]}>
          <Text style={[styles.heroBadgeText, { color: primaryColor }]}>
            Detalle
          </Text>
        </View>

        {currentImageUrl && !imageLoadFailed ? (
          <Pressable
            onPress={() => setImageViewerVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Image
              source={{ uri: currentImageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={200}
              onError={() => setImageLoadFailed(true)}
            />
          </Pressable>
        ) : (
          <View
            style={[styles.heroImagePlaceholder, { borderColor: faintText }]}
          >
            <Text
              style={[styles.heroImagePlaceholderText, { color: faintText }]}
            >
              IMAGEN DEL EJERCICIO
            </Text>
          </View>
        )}

        <View style={styles.changeImageWrapper}>
          <Pressable
            onPress={changeImage}
            disabled={isChangingImage}
            style={({ pressed }) => [
              styles.changeImageButton,
              {
                backgroundColor: primarySoft,
                opacity: pressed || isChangingImage ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="camera-outline" size={16} color={primaryColor} />
            <Text
              style={[styles.changeImageButtonText, { color: primaryColor }]}
            >
              {isChangingImage ? "Actualizando..." : "Cambiar imagen"}
            </Text>
          </Pressable>
        </View>

        <ThemedText type="title" style={styles.title}>
          {name ?? "Ejercicio"}
        </ThemedText>

        <Text style={[styles.subtitle, { color: mutedText }]}>
          Categoria: {categoryName ?? "Sin categoria"}
        </Text>
      </View>

      <View
        style={[
          styles.metricCard,
          { backgroundColor: surfaceColor, borderColor },
        ]}
      >
        <Text style={[styles.metricLabel, { color: faintText }]}>
          Peso asignado
        </Text>
        <Text style={[styles.metricValue, { color: primaryColor }]}>
          {displayWeight}
        </Text>
        <Text style={[styles.metricHint, { color: mutedText }]}>
          Usa este valor para identificar rapidamente la carga del ejercicio.
        </Text>
      </View>

      <View
        style={[
          styles.historyCard,
          { backgroundColor: surfaceColor, borderColor },
        ]}
      >
        <ThemedText type="subtitle" style={styles.historyTitle}>
          Historico de pesos
        </ThemedText>

        {isLoading ? (
          [0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.historyRowWrapper,
                {
                  borderColor,
                  backgroundColor: borderColor,
                  height: 56,
                  borderRadius: 14,
                },
              ]}
            />
          ))
        ) : isError ? (
          <View style={styles.historyErrorState}>
            <Text style={[styles.emptyHistory, { color: faintText }]}>
              No pudimos cargar el historial.
            </Text>
            <Pressable onPress={() => refetch()} hitSlop={8}>
              <Text style={[styles.retryText, { color: primaryColor }]}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : weightHistory.length === 0 ? (
          <Text style={[styles.emptyHistory, { color: faintText }]}>
            Sin registros de peso
          </Text>
        ) : null}

        {!isLoading &&
          !isError &&
          [...weightHistory]
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .map((entry) => (
              <AnimatedHistoryRowComponent
                key={entry.id}
                entry={entry}
                exerciseId={String(id)}
                onRemove={removeEntry}
                swipeableRefs={swipeableRefs}
                openRowIdRef={openRowIdRef}
                backgroundColor={backgroundColor}
                borderColor={borderColor}
                textColor={textColor}
                faintText={faintText}
                primaryColor={primaryColor}
                mutedText={mutedText}
              />
            ))}

        <Pressable
          onPress={openCreateWeightModal}
          style={({ pressed }) => [
            styles.registerWeightButton,
            { backgroundColor: primaryColor, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.registerWeightButtonText}>
            Registrar nuevo peso
          </Text>
        </Pressable>
      </View>

      {!isLoading && !isError && weightHistory.length >= 2 ? (
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/exercise-progress",
              params: { exerciseId: String(id), name },
            })
          }
          style={({ pressed }) => [
            styles.progressCard,
            {
              backgroundColor: surfaceColor,
              borderColor,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.progressCardHeader}>
            <Text style={[styles.progressCardTitle, { color: textColor }]}>
              Progreso de peso
            </Text>
            <Text style={[styles.progressCardHint, { color: primaryColor }]}>
              Ver progreso →
            </Text>
          </View>
          <WeightProgressChart entries={weightHistory} variant="compact" />
        </Pressable>
      ) : null}

      <View
        style={[
          styles.dangerZone,
          { backgroundColor: dangerBg, borderColor: dangerBorder },
        ]}
      >
        <View style={styles.dangerZoneHeader}>
          <Ionicons name="warning-outline" size={20} color={dangerText} />
          <Text style={[styles.dangerZoneTitle, { color: dangerText }]}>
            Zona de peligro
          </Text>
        </View>
        <Text style={[styles.dangerZoneDescription, { color: mutedText }]}>
          Si ya no necesitas este ejercicio, puedes eliminarlo desde aqui.
        </Text>
        <Pressable
          onPress={confirmDeleteExercise}
          disabled={isDeleting}
          style={({ pressed }) => [
            styles.deleteExerciseButton,
            {
              backgroundColor: dangerText,
              opacity: pressed || isDeleting ? 0.82 : 1,
            },
          ]}
        >
          <Text style={styles.deleteExerciseButtonText}>
            {isDeleting ? "Eliminando ejercicio..." : "Eliminar ejercicio"}
          </Text>
        </Pressable>
      </View>

      {currentImageUrl ? (
        <FullscreenImageModal
          visible={imageViewerVisible}
          imageUrl={currentImageUrl}
          onClose={() => setImageViewerVisible(false)}
        />
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  deleteHeaderButton: {
    padding: 4,
    transform: [{ translateX: 3 }],
  },
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
  },
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginBottom: 15,
  },
  heroBadgeText: {
    fontFamily: Fonts.extrabold,
    fontSize: 11.5,
    letterSpacing: 0.3,
  },
  historyRowWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 165,
    borderRadius: 18,
  },
  heroImagePlaceholder: {
    width: "100%",
    height: 165,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImagePlaceholderText: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  changeImageWrapper: {
    marginTop: 15,
    alignItems: "center",
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  changeImageButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },
  title: {
    marginTop: 17,
    fontSize: 25,
    lineHeight: 29,
  },
  subtitle: {
    marginTop: 3,
    fontFamily: Fonts.semibold,
    fontSize: 13.5,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 19,
    gap: 6,
  },
  metricLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricValue: {
    fontWeight: "800",
    fontSize: 30,
    fontVariant: ["tabular-nums"],
  },
  metricHint: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.medium,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 19,
    gap: 12,
  },
  progressCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  progressCardHint: {
    fontFamily: Fonts.bold,
    fontSize: 12.5,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 19,
    gap: 12,
  },
  historyTitle: {
    marginBottom: 2,
  },
  emptyHistory: {
    fontSize: 13.5,
    fontFamily: Fonts.semibold,
    textAlign: "center",
    paddingVertical: 8,
  },
  historyErrorState: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 13.5,
  },

  registerWeightButton: {
    marginTop: 2,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  registerWeightButtonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  dangerZone: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 19,
    gap: 12,
  },
  dangerZoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dangerZoneTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 16,
  },
  dangerZoneDescription: {
    fontFamily: Fonts.medium,
    lineHeight: 21,
    fontSize: 13.5,
  },
  deleteExerciseButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteExerciseButtonText: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
});

export default ExerciseDetailScreen;
