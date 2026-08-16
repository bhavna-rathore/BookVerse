const request = require("supertest");
const app = require("../app");
const db = require("./dbHandler");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

describe("POST /api/auth/register", () => {
  it("rejects a username shorter than 3 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "ab", email: "ab@example.com", password: "password123" });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "abcdef", email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "abcdef", email: "abcdef@example.com", password: "123" });

    expect(res.status).toBe(400);
  });

  it("creates a user and never returns the password hash", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "alice",
      email: "alice@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice");
    expect(res.body.password).toBeUndefined();
  });

  it("rejects a duplicate username with 409, not a raw Mongo error", async () => {
    await request(app).post("/api/auth/register").send({
      username: "alice",
      email: "alice@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      username: "alice",
      email: "someone-else@example.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      username: "alice",
      email: "alice@example.com",
      password: "password123",
    });
  });

  it("logs in with correct credentials and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.password).toBeUndefined();
  });

  it("rejects a wrong password with a generic message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "alice", password: "wrong-password" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Wrong username or password");
  });

  it("rejects an unknown username with the same generic message (no username enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "nobody-registered", password: "whatever123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Wrong username or password");
  });
});
