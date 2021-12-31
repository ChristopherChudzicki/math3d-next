const getEnvVar = (varName: string) => {
  const value = process.env[varName];
  if (value === undefined) {
    throw new Error(`Env variable ${varName} is undefined.`);
  }
  return value;
};

export const DB_HOST = getEnvVar("DB_HOST");
export const DB_PORT = +getEnvVar("DB_PORT");
export const DB_NAME = getEnvVar("DB_NAME");
export const DB_USER = getEnvVar("DB_USER");
export const DB_PASS = getEnvVar("DB_PASS");
