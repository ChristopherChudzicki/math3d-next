import { cleanEnv, str, email, url } from "envalid";

const env = cleanEnv(process.env, {
  TEST_APP_URL: url(),
  TEST_API_URL: url(),
  TEST_USER_STATIC_EMAIL: email(),
  TEST_USER_STATIC_UID: str({
    desc: "Dummy-provider uid of the seeded static user; must match seed_test_data",
  }),
  PROJECT_CWD: str({
    desc: "The repo root; injected by yarn",
  }),
});

export default env;
