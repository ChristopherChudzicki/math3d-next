module.exports = {
  ignorePatterns: ["/node_modules/**/*.js"],
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  rules: {
    "no-console": "warn",
    "import/first": "error",
    "react/prop-types": "off",
  },
  extends: [
    "react-app",
    "react-app/jest",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  root: true,
  plugins: ["react", "@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 11,
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  settings: {
    react: {
      pragma: "React",
      version: "detect",
    },
  },
};
