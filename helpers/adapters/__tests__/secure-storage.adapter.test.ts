import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";

const mockedGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockedSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockedDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;
const mockedAlert = Alert.alert as jest.Mock;

const USED_KEYS = [
  "cache-hit-key",
  "cache-miss-key",
  "set-fail-key",
  "delete-key",
  "get-fail-key",
];

afterEach(async () => {
  jest.resetAllMocks();
  await Promise.all(USED_KEYS.map((key) => SecureStorageAdapter.deleteItem(key)));
  jest.resetAllMocks();
});

describe("SecureStorageAdapter.getItem", () => {
  it("returns the cached value without calling SecureStore", async () => {
    mockedGetItemAsync.mockResolvedValueOnce("cached-value");
    await SecureStorageAdapter.getItem("cache-hit-key");
    mockedGetItemAsync.mockClear();

    const result = await SecureStorageAdapter.getItem("cache-hit-key");

    expect(result).toBe("cached-value");
    expect(mockedGetItemAsync).not.toHaveBeenCalled();
  });

  it("reads from SecureStore and caches the value when it is not cached yet", async () => {
    mockedGetItemAsync.mockResolvedValue("fresh-value");

    const first = await SecureStorageAdapter.getItem("cache-miss-key");
    const second = await SecureStorageAdapter.getItem("cache-miss-key");

    expect(first).toBe("fresh-value");
    expect(second).toBe("fresh-value");
    expect(mockedGetItemAsync).toHaveBeenCalledTimes(1);
    expect(mockedGetItemAsync).toHaveBeenCalledWith("cache-miss-key");
  });

  it("alerts and returns null when SecureStore fails", async () => {
    mockedGetItemAsync.mockRejectedValueOnce(new Error("read error"));

    const result = await SecureStorageAdapter.getItem("get-fail-key");

    expect(result).toBeNull();
    expect(mockedAlert).toHaveBeenCalledWith("Error", "Failed to get data");
  });
});

describe("SecureStorageAdapter.setItem", () => {
  it("reverts the cache entry and alerts when SecureStore fails", async () => {
    mockedSetItemAsync.mockRejectedValueOnce(new Error("disk full"));

    await SecureStorageAdapter.setItem("set-fail-key", "value");

    expect(mockedAlert).toHaveBeenCalledWith("Error", "Failed to save data");

    mockedGetItemAsync.mockResolvedValueOnce(null);
    const result = await SecureStorageAdapter.getItem("set-fail-key");

    expect(mockedGetItemAsync).toHaveBeenCalledWith("set-fail-key");
    expect(result).toBeNull();
  });
});

describe("SecureStorageAdapter.deleteItem", () => {
  it("clears the cache and calls SecureStore.deleteItemAsync", async () => {
    mockedGetItemAsync.mockResolvedValueOnce("to-delete");
    await SecureStorageAdapter.getItem("delete-key");

    await SecureStorageAdapter.deleteItem("delete-key");

    expect(mockedDeleteItemAsync).toHaveBeenCalledWith("delete-key");

    mockedGetItemAsync.mockResolvedValueOnce(null);
    mockedGetItemAsync.mockClear();
    const result = await SecureStorageAdapter.getItem("delete-key");

    expect(mockedGetItemAsync).toHaveBeenCalledWith("delete-key");
    expect(result).toBeNull();
  });
});
