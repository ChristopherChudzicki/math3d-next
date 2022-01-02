const getEnvVar = (varName: string): string => {
  const value = process.env[varName];
  if (value === undefined) {
    throw new Error(`Env variable ${varName} is undefined.`);
  }
  return value;
};

export default getEnvVar;
