import { Alert, AlertButton } from "react-native";

export function showAlert(title: string, message?: string): void {
  Alert.alert(title, message);
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
}

export function showConfirm({
  title,
  message,
  confirmText = "Aceptar",
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmOptions): void {
  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel", onPress: onCancel },
    {
      text: confirmText,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}

export function showOptions(
  title: string,
  message: string | undefined,
  buttons: AlertButton[],
): void {
  Alert.alert(title, message, buttons);
}
