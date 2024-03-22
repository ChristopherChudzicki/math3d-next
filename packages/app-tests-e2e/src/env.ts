import { cleanEnv, str, email, url } from "envalid";

const env = cleanEnv(process.env, {
  TEST_APP_URL: url(),
  TEST_API_URL: url(),
  TEST_USER_ADMIN_EMAIL: email(),
  TEST_USER_ADMIN_PASSWORD: str(),
  TEST_USER_STATIC_EMAIL: email(),
  TEST_USER_STATIC_PASSWORD: str(),
  TEST_USER_DYNAMIC_EMAIL: email(),
  TEST_USER_DYNAMIC_PASSWORD: str(),
  TEST_USER_EDITABLE_EMAIL: email(),
  TEST_USER_EDITABLE_PASSWORD: str(),
  TEST_USER_PW_CHANGER_EMAIL: email(),
  TEST_USER_PW_CHANGER_PASSWORD: str(),
  TEST_USER_NOT_CREATED_EMAIL: email(),
  TEST_USER_NOT_CREATED_PASSWORD: str(),
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
