import { cleanEnv, str, email, url } from "envalid";

const env = cleanEnv(process.env, {
  TEST_APP_URL: url(),
  TEST_API_URL: url(),
  TEST_USER_1_EMAIL: email(),
  TEST_USER_1_PASSWORD: str(),
  TEST_USER_2_EMAIL: email(),
  TEST_USER_2_PASSWORD: str(),
  TEST_USER_3_EMAIL: email(),
  TEST_USER_3_PASSWORD: str(),
  PROJECT_CWD: str({
    desc: "The repo root; injected by yarn",
  }),
  EMAIL_BACKEND: str({
    desc: "The implmentation to use for checking email.",
    choices: ["FileEmailBackend"],
    default: "FileEmailBackend",
  }),
  EMAIL_DIR: str({
    desc: "The directory where emails are stored, relative to the project root",
    default: "webserver/private/email",
  }),
});

export default env;
