import { cleanEnv, str, email, url } from "envalid";

const env = cleanEnv(process.env, {
  TEST_APP_URL: url(),
  TEST_API_URL: url(),
  TEST_USER_1_EMAIL: email(),
  TEST_USER_1_PASSWORD: str(),
  TEST_USER_2_EMAIL: email(),
  TEST_USER_2_PASSWORD: str(),
});

export default env;
