module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "airbnb-base",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    'plugin:prettier/recommended' // this should come last
  ],
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["build/", "**/*.js", "src/scripts/transfer-from-v1"],
  rules: {
    "prettier/prettier": ["error"],
    "max-classes-per-file": 0,
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-param-reassign": [
      "error",
      {
        props: false,
      },
    ],
    "no-underscore-dangle": 0,
    "@typescript-eslint/no-unused-vars": [
      2,
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
      },
    ],
    "import/prefer-default-export": [0],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        ts: "never",
      },
    ],
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".ts"],
      },
    },
  },
};
