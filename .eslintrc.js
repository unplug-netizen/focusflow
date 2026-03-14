module.exports = {
  root: true,
  extends: "@react-native",
  env: {
    jest: true,
  },
  rules: {
    quotes: ["error", "double"],
    "prettier/prettier": [
      "error",
      {
        singleQuote: false,
        trailingComma: "es5",
        tabWidth: 2,
        semi: true,
      },
    ],
  },
};
