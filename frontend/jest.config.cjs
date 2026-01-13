module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true, tsconfig: "<rootDir>/tsconfig.json" }],
  },
};
