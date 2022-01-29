module.exports = {
  extends: [
    "react-app",
    "react-app/jest",
    "airbnb",
    "prettier",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  plugins: ["react", "@typescript-eslint", "prettier"],
  rules: {
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      },
    ],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {},
    },
    "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
  },
  overrides: [
    {
      files: ["**/*.ts?(x)"],
      rules: {},
    },
    {
      files: ["**/*.stories.*"],
      rules: {
        "import/no-anonymous-default-export": "off",
      },
    },
  ],
};
