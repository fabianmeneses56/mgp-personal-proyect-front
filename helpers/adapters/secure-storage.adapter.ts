import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export class SecureStorageAdapter {
  private static cache = new Map<string, string | null>();

  static async setItem(key: string, value: string) {
    this.cache.set(key, value);

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      this.cache.delete(key);
      Alert.alert("Error", "Failed to save data");
    }
  }

  static async getItem(key: string) {
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null;
    }

    try {
      const value = await SecureStore.getItemAsync(key);
      this.cache.set(key, value);

      return value;
    } catch (error) {
      Alert.alert("Error", "Failed to get data");
      return null;
    }
  }

  static async deleteItem(key: string) {
    this.cache.delete(key);

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to delete data");
    }
  }
}
