import getEnvVar from "../util/getEnvVar";

export const DB_HOST = getEnvVar("DB_HOST");
export const DB_PORT = +getEnvVar("DB_PORT");
export const DB_NAME = getEnvVar("DB_NAME");
export const DB_USER = getEnvVar("DB_USER");
export const DB_PASS = getEnvVar("DB_PASS");
