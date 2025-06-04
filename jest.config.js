export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@config/(.*)$': './src/config/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
