import { PickedExerciseImage } from "@/core/exercises/interfaces/picked-exercise-image.interface";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
// iOS camera photos default to HEIC/HEIF. expo-image-picker transcodes them to
// JPEG when `quality` < 1 and/or `allowsEditing` is set, but some devices still
// report the original mime type. Treat them as JPEG instead of rejecting them.
const HEIC_MIME_TYPES = ["image/heic", "image/heif"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const buildFileName = (uri: string, mimeType: string) => {
  const uriFileName = uri.split("/").pop();
  if (uriFileName) return uriFileName;

  const extension = mimeType.split("/").pop();
  return `exercise-image.${extension}`;
};

const normalizeFileName = (fileName: string, wasHeic: boolean) =>
  wasHeic ? fileName.replace(/\.(heic|heif)$/i, ".jpg") : fileName;

export const usePickExerciseImage = () => {
  const pickImage = async (): Promise<PickedExerciseImage | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permiso requerido",
        "Debes habilitar el acceso a tus fotos desde la configuración del dispositivo para seleccionar una imagen."
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    const rawMimeType = (asset.mimeType ?? "").toLowerCase();
    const isHeic = HEIC_MIME_TYPES.includes(rawMimeType);
    const mimeType = isHeic ? "image/jpeg" : rawMimeType;

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      Alert.alert("Formato no soportado", "Selecciona una imagen en formato JPEG, PNG o WEBP.");
      return null;
    }

    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
      Alert.alert("Imagen demasiado grande", "La imagen debe pesar 5MB o menos.");
      return null;
    }

    return {
      uri: asset.uri,
      mimeType,
      fileName: normalizeFileName(
        asset.fileName ?? buildFileName(asset.uri, mimeType),
        isHeic
      ),
    };
  };

  return { pickImage };
};
