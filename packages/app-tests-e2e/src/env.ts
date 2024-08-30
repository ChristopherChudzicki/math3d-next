import { cleanEnv, str, email, url } from "envalid";

const env = cleanEnv(process.env, {
  TEST_EMAIL_PROVIDER: str({
    default: "test.math3d.org",
  }),
  TEST_APP_URL: url(),
  TEST_API_URL: url(),
  TEST_USER_ADMIN_EMAIL: email(),
  TEST_USER_ADMIN_PASSWORD: str(),
  TEST_USER_STATIC_EMAIL: email(),
  TEST_USER_STATIC_PASSWORD: str(),
  PROJECT_CWD: str({
    desc: "The repo root; injected by yarn",
  }),
  EMAIL_BACKEND: str({
    desc: "The implmentation to use for checking email.",
    choices: ["FileEmailBackend"],
    default: "FileEmailBackend",
  }),
  EMAIL_DIR: str({
    desc: "The directory where FileEmailBackend emails are stored, relative to the project root",
    default: "webserver/private/email",
  }),
});

export default env;
