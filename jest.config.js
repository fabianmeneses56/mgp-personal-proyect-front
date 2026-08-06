const jestExpoTransform = require("jest-expo/jest-preset").transform;

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // jest-expo compiles for Metro's bundler-specific dynamic import, which Jest's
  // CommonJS runtime can't execute. This plugin rewrites `import()` to `require()`
  // only for the Jest transform, so mgpApi.ts's dynamic import of useAuthStore
  // (used to break a circular dependency) is testable.
  transform: {
    ...jestExpoTransform,
    "\\.[jt]sx?$": [
      jestExpoTransform["\\.[jt]sx?$"][0],
      {
        ...jestExpoTransform["\\.[jt]sx?$"][1],
        plugins: ["babel-plugin-dynamic-import-node"],
      },
    ],
  },
};
