import { resolve } from "path";
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  setupFilesAfterEnv: [resolve(__dirname, "./src/setupTests.ts")],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          baseUrl: "src",
          paths: {
            "@/*": ["./*"],
          },
          parser: {
            syntax: "typescript",
          },
        },
      },
    ],
  },
  transformIgnorePatterns: ["^.+\\.module\\.css$"],
  moduleNameMapper: {
    // Adding .css to the regex does not work. Why? Is swc removing the extension?
    "^.+\\.module$": "identity-obj-proxy",
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
  verbose: true,
};

export default config;
