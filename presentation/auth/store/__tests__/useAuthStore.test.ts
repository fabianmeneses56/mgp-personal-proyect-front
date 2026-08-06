import { waitFor } from "@testing-library/react-native";

import { authCheckStatus, authLogin } from "@/core/auth/actions/auth-actions";
import { User } from "@/core/auth/interface/user";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

jest.mock("@/core/auth/actions/auth-actions");
jest.mock("@/helpers/adapters/secure-storage.adapter");

const mockedAuthLogin = authLogin as jest.MockedFunction<typeof authLogin>;
const mockedAuthCheckStatus = authCheckStatus as jest.MockedFunction<
  typeof authCheckStatus
>;
const mockedSetItem = SecureStorageAdapter.setItem as jest.Mock;
const mockedDeleteItem = SecureStorageAdapter.deleteItem as jest.Mock;

const initialState = useAuthStore.getState();

const user: User = {
  id: "user-1",
  email: "user@example.com",
  fullName: "Test User",
  isActive: true,
  roles: ["user"],
};

beforeEach(() => {
  useAuthStore.setState(initialState, true);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("login", () => {
  it("sets status to authenticated with user and token, and persists the token", async () => {
    mockedAuthLogin.mockResolvedValue({ user, token: "abc-token" });

    const result = await useAuthStore
      .getState()
      .login("user@example.com", "secret");

    expect(result).toBe(true);
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().token).toBe("abc-token");
    await waitFor(() => {
      expect(mockedSetItem).toHaveBeenCalledWith("token", "abc-token");
    });
  });

  it("sets status to unauthenticated and clears the token when the action returns null", async () => {
    mockedAuthLogin.mockResolvedValue(null);

    const result = await useAuthStore
      .getState()
      .login("user@example.com", "wrong-password");

    expect(result).toBe(false);
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeUndefined();
    expect(useAuthStore.getState().token).toBeUndefined();
    await waitFor(() => {
      expect(mockedDeleteItem).toHaveBeenCalledWith("token");
    });
  });
});

describe("logout", () => {
  it("clears state and storage", async () => {
    useAuthStore.setState({ status: "authenticated", user, token: "abc-token" });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeUndefined();
    expect(useAuthStore.getState().token).toBeUndefined();
    expect(mockedDeleteItem).toHaveBeenCalledWith("token");
  });
});

describe("checkStatus", () => {
  it("resolves to authenticated when the action returns a user and token", async () => {
    mockedAuthCheckStatus.mockResolvedValue({ user, token: "abc-token" });

    await useAuthStore.getState().checkStatus();

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().token).toBe("abc-token");
  });

  it("resolves to unauthenticated when the action returns null", async () => {
    mockedAuthCheckStatus.mockResolvedValue(null);

    await useAuthStore.getState().checkStatus();

    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeUndefined();
    expect(useAuthStore.getState().token).toBeUndefined();
  });
});
