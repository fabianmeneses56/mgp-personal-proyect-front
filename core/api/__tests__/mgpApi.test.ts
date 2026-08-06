import MockAdapter from "axios-mock-adapter";
import { waitFor } from "@testing-library/react-native";

import { mgpApi } from "@/core/api/mgpApi";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

describe("mgpApi interceptors", () => {
  let mock: MockAdapter;
  const initialState = useAuthStore.getState();

  beforeEach(() => {
    mock = new MockAdapter(mgpApi);
  });

  afterEach(async () => {
    mock.restore();
    await SecureStorageAdapter.deleteItem("token");
    useAuthStore.setState(initialState, true);
  });

  it("attaches the Authorization header on a normal request when a token is stored", async () => {
    await SecureStorageAdapter.setItem("token", "abc-token");
    mock.onGet("/categories").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer abc-token");
      return [200, {}];
    });

    await mgpApi.get("/categories");
  });

  it("does not attach the Authorization header on /auth/login even with a stored token", async () => {
    await SecureStorageAdapter.setItem("token", "abc-token");
    mock.onPost("/auth/login").reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, {}];
    });

    await mgpApi.post("/auth/login", {});
  });

  it("does not attach the Authorization header when there is no token in storage", async () => {
    await SecureStorageAdapter.deleteItem("token");
    mock.onGet("/categories").reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, {}];
    });

    await mgpApi.get("/categories");
  });

  it("logs out on a 401 response outside of /auth/login", async () => {
    useAuthStore.setState({ status: "authenticated", token: "abc-token" });
    mock.onGet("/categories").reply(401);

    await expect(mgpApi.get("/categories")).rejects.toThrow();

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe("unauthenticated");
    });
  });

  it("does not log out on a 401 response from /auth/login", async () => {
    useAuthStore.setState({ status: "authenticated", token: "abc-token" });
    mock.onPost("/auth/login").reply(401);

    await expect(mgpApi.post("/auth/login", {})).rejects.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useAuthStore.getState().status).toBe("authenticated");
  });
});
