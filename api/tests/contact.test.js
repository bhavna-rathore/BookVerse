const request = require("supertest");
const app = require("../app");
const db = require("./dbHandler");
const User = require("../models/User");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

async function registerAndLogin(username) {
  await request(app)
    .post("/api/auth/register")
    .send({ username, email: `${username}@example.com`, password: "password123" });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password: "password123" });

  return res.body.token;
}

async function makeAdminAndLogin(username) {
  await User.findOneAndUpdate({ username }, { $set: { role: "admin" } });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password: "password123" });
  return res.body.token;
}

describe("POST /api/contact", () => {
  it("rejects a missing name", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ email: "a@example.com", message: "Hello" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "not-an-email", message: "Hello" });
    expect(res.status).toBe(400);
  });

  it("rejects an empty message", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "a@example.com", message: "   " });
    expect(res.status).toBe(400);
  });

  it("accepts a valid submission without requiring a token (public endpoint)", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "alice@example.com", message: "Love the app!" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Alice");
    expect(res.body.email).toBe("alice@example.com");
    expect(res.body.message).toBe("Love the app!");
  });
});

describe("GET /api/contact — admin-only", () => {
  it("rejects a request with no token", async () => {
    const res = await request(app).get("/api/contact");
    expect(res.status).toBe(401);
  });

  it("rejects a non-admin logged-in user", async () => {
    const token = await registerAndLogin("alice");
    const res = await request(app).get("/api/contact").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("returns submissions newest-first for an admin", async () => {
    await request(app)
      .post("/api/contact")
      .send({ name: "Alice", email: "alice@example.com", message: "First" });
    await request(app)
      .post("/api/contact")
      .send({ name: "Bob", email: "bob@example.com", message: "Second" });

    await registerAndLogin("mod");
    const adminToken = await makeAdminAndLogin("mod");

    const res = await request(app).get("/api/contact").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].message).toBe("Second"); // newest first
  });
});
