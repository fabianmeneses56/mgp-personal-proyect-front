import { notifyManager } from "@tanstack/react-query";

// React Query defers state notifications to a setTimeout(fn, 0) macrotask,
// which races against each test's act()/waitFor scope and intermittently
// fires after it closes, producing flaky "not wrapped in act(...)" warnings.
// Running the scheduler synchronously keeps every update inside the awaiting
// act() call, removing the race without changing any test's assertions.
notifyManager.setScheduler((callback) => callback());

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
