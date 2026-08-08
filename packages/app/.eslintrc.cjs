// The edge Worker (src/worker) is typechecked with Workers types via its own
// tsconfig, excluded from the app's main tsconfig. Point ESLint's typed-linting
// parser at that project so worker sources lint under the same rules.
module.exports = {
  overrides: [
    {
      files: ["src/worker/**/*.ts"],
      parserOptions: {
        project: "./src/worker/tsconfig.json",
      },
    },
  ],
};
