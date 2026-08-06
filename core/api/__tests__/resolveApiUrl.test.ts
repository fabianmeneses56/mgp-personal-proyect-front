import { resolveApiUrl } from "@/core/api/resolveApiUrl";

describe("resolveApiUrl", () => {
  it("returns the prod url when stage is prod", () => {
    const url = resolveApiUrl({
      stage: "prod",
      platform: "ios",
      urls: { prod: "https://api.example.com" },
    });

    expect(url).toBe("https://api.example.com");
  });

  it("ignores the platform-specific urls when stage is prod", () => {
    const url = resolveApiUrl({
      stage: "prod",
      platform: "android",
      urls: {
        prod: "https://api.example.com",
        devIos: "http://192.168.1.10:3000",
        devAndroid: "http://192.168.1.11:3000",
      },
    });

    expect(url).toBe("https://api.example.com");
  });

  it("returns the iOS dev url when stage is dev and platform is ios", () => {
    const url = resolveApiUrl({
      stage: "dev",
      platform: "ios",
      urls: {
        devIos: "http://192.168.1.10:3000",
        devAndroid: "http://192.168.1.11:3000",
      },
    });

    expect(url).toBe("http://192.168.1.10:3000");
  });

  it("returns the Android dev url when stage is dev and platform is android", () => {
    const url = resolveApiUrl({
      stage: "dev",
      platform: "android",
      urls: {
        devIos: "http://192.168.1.10:3000",
        devAndroid: "http://192.168.1.11:3000",
      },
    });

    expect(url).toBe("http://192.168.1.11:3000");
  });

  it("returns undefined when the expected url is absent", () => {
    const url = resolveApiUrl({
      stage: "prod",
      platform: "ios",
      urls: {},
    });

    expect(url).toBeUndefined();
  });
});
