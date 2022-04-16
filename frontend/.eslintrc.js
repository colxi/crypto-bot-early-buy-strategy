module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    "plugin:vue/vue3-essential",
    "@vue/standard",
    "@vue/typescript/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    quotes: [2, "single", "avoid-escape"],
    "max-len": ["warn", { code: 1200 }],
    "space-before-function-paren": "off",
    "comma-dangle": ["warn", "only-multiline"],
    "no-unreachable": "off",
    "no-multiple-empty-lines": ["warn", { max: 2, maxBOF: 0, maxEOF: 0 }],
    "vue/no-unused-components": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/explicit-function-return-type": ["warn"],
    "@typescript-eslint/no-non-null-assertion": "off"
  },
  overrides: [
    {
      files: [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)"
      ],
      env: {
        jest: true
      }
    }
  ]
};
