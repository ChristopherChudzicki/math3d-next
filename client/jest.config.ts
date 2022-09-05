import { resolve } from "path";
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  setupFilesAfterEnv: [resolve(__dirname, "./src/setupTests.ts")],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  verbose: true,
};

export default config;
