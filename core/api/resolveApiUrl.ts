import { Platform } from "react-native";

export type Stage = "dev" | "prod";

interface ApiUrlConfig {
  stage: Stage;
  platform: typeof Platform.OS;
  urls: {
    prod?: string;
    devIos?: string;
    devAndroid?: string;
  };
}

export function resolveApiUrl(config: ApiUrlConfig): string | undefined {
  if (config.stage === "prod") {
    return config.urls.prod;
  }

  return config.platform === "ios"
    ? config.urls.devIos
    : config.urls.devAndroid;
}
