/// <reference types="jest" />

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    navigate: jest.fn(),
  },
}));

jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});
