import { authCheckStatus, authLogin } from "@/core/auth/actions/auth-actions";
import { mgpApi } from "@/core/api/mgpApi";
import { buildAuthResponse } from "@/test-utils/fixtures";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("authLogin", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("lowercases the email before posting", async () => {
    mockedMgpApi.post.mockResolvedValue({ data: buildAuthResponse() });

    await authLogin("User@Example.com", "secret");

    expect(mockedMgpApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "user@example.com",
      password: "secret",
    });
  });

  it("splits token from user in the response", async () => {
    const authResponse = buildAuthResponse({
      id: "user-42",
      email: "user@example.com",
      token: "abc-token",
    });
    mockedMgpApi.post.mockResolvedValue({ data: authResponse });

    const result = await authLogin("user@example.com", "secret");

    expect(result).toEqual({
      user: {
        id: "user-42",
        email: "user@example.com",
        fullName: authResponse.fullName,
        isActive: authResponse.isActive,
        roles: authResponse.roles,
      },
      token: "abc-token",
    });
  });

  it("returns null when the request fails", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    mockedMgpApi.post.mockRejectedValue(new Error("Invalid credentials"));

    const result = await authLogin("user@example.com", "wrong-password");

    expect(result).toBeNull();
  });
});

describe("authCheckStatus", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("requests /auth/check-status and splits token from user", async () => {
    const authResponse = buildAuthResponse({ token: "abc-token" });
    mockedMgpApi.get.mockResolvedValue({ data: authResponse });

    const result = await authCheckStatus();

    expect(mockedMgpApi.get).toHaveBeenCalledWith("/auth/check-status");
    expect(result).toEqual({
      user: {
        id: authResponse.id,
        email: authResponse.email,
        fullName: authResponse.fullName,
        isActive: authResponse.isActive,
        roles: authResponse.roles,
      },
      token: "abc-token",
    });
  });

  it("returns null when the request fails", async () => {
    mockedMgpApi.get.mockRejectedValue(new Error("Network error"));

    const result = await authCheckStatus();

    expect(result).toBeNull();
  });
});
