// Runs before the test framework loads, so it's guaranteed to run before any
// test file requires app.js — which fails fast if JWT_SECRET is missing.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-do-not-use-in-production";
