module.exports = {
  root: true,
  extends: "@react-native",
  env: {
    jest: true,
  },
  ignorePatterns: ["lib/**/*.d.ts", "node_modules/", "android/", "ios/"],
  rules: {
    quotes: ["error", "double"],
  },
};
