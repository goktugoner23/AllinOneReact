module.exports = {
  root: true,
  extends: ["@react-native", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-native"],
  rules: {
    // TypeScript specific rules - relaxed to avoid noise
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unsafe-function-type": "off",
    "@typescript-eslint/no-shadow": "off",

    // React/React Native specific rules - relaxed
    "react/prop-types": "off",
    "react/no-unstable-nested-components": "off",
    "react-native/no-unused-styles": "off",
    "react-native/split-platform-components": "off",
    "react-native/no-inline-styles": "off",
    "react-native/no-color-literals": "off",
    "react-native/no-raw-text": "off",

    // General code quality rules - relaxed
    "no-console": "off",
    "prefer-const": "off",
    "no-var": "off",
    "object-shorthand": "off",
    "prefer-template": "off",
    "no-duplicate-imports": "off",
    "no-unused-vars": "off",
    "no-useless-escape": "off",
    "radix": "off",
    "no-catch-shadow": "off",
    "dot-notation": "off",
    "no-bitwise": "off",
    "no-new": "off",

    // ESLint comments
    "eslint-comments/no-unused-disable": "off",

    // Performance related rules
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/rules-of-hooks": "error",

    // Code style rules - let Prettier handle these
    "max-len": "off",
    "indent": "off",
    "quotes": "off",
    "semi": "off",
    "comma-dangle": "off",
  },
  env: {
    "react-native/react-native": true,
    es6: true,
    node: true,
    jest: true,
  },
  settings: {
    "react-native/style-sheet-object-names": ["StyleSheet", "styles"],
  },
};
