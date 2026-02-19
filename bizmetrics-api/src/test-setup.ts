// Test setup — sets env vars before anything else imports env.ts
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-32-characters-long!';
process.env.OPENAI_API_KEY = 'sk-test-key-not-real';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
