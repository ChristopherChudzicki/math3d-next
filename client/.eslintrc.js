module.exports = {
  extends: [
    "react-app",
    "react-app/jest",
    "airbnb",
    "airbnb-typescript",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    'plugin:prettier/recommended' // this should come last
  ],
  plugins: ["react", "@typescript-eslint"],
  rules: {
    "max-classes-per-file": "off",
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      },
    ],
    "import/prefer-default-export": "off",
    "react/destructuring-assignment": "off",
    "no-param-reassign": [
      "error",
      { props: true, ignorePropertyModificationsFor: ["state"] },
    ],
  },
  settings: {},
  overrides: [
    {
      files: ["**/*.ts?(x)"],
      rules: {
        "react/prop-types": "off",
        "react/require-default-props": "off",
        "react/jsx-props-no-spreading": "off",
      },
    },
    {
      files: ["**/*.stories.*"],
      rules: {
        "import/no-anonymous-default-export": "off",
      },
    },
  ],
  parserOptions: {
    project: "./tsconfig.json",
  },
};
