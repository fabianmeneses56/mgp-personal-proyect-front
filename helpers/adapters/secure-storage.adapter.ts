import * as SecureStore from "expo-secure-store";
import { showAlert } from "@/helpers/alerts/alert.service";

export class SecureStorageAdapter {
  private static cache = new Map<string, string | null>();

  static async setItem(key: string, value: string) {
    this.cache.set(key, value);

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      this.cache.delete(key);
      showAlert("Error", "Failed to save data");
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
      showAlert("Error", "Failed to get data");
      return null;
    }
  }

  static async deleteItem(key: string) {
    this.cache.delete(key);

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      showAlert("Error", "Failed to delete data");
    }
  }
}
