module.exports = {
  root: true,
  extends: ["@react-native", "@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-native"],
  rules: {
    // TypeScript specific rules
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/prefer-const": "error",
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/explicit-module-boundary-types": "warn",

    // React/React Native specific rules
    "react/prop-types": "off", // We use TypeScript for prop validation
    "react-native/no-unused-styles": "error",
    "react-native/split-platform-components": "error",
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
    "react-native/no-raw-text": "off", // Allow raw text for flexibility

    // General code quality rules
    "no-console": "warn", // Warn about console statements
    "prefer-const": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-template": "error",
    "no-duplicate-imports": "error",
    "no-unused-vars": "off", // Use TypeScript version instead

    // Performance related rules
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",

    // Code style rules
    "max-len": ["warn", { code: 120, ignoreUrls: true }],
    indent: ["error", 2],
    quotes: ["error", "single"],
    semi: ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
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
