/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      babelConfig: true,
    }],
  },
  moduleNameMapper: {
    '\\.(css|png|svg|jpe?g|woff2?)$': '<rootDir>/tests/mocks/simple.ts',
  },
};
