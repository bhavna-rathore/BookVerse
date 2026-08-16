const request = require("supertest");
const jwt = require("jsonwebtoken");
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

describe("Category deletion — admin-only", () => {
  it("rejects deletion from a regular logged-in user", async () => {
    const token = await registerAndLogin("alice");
    const cat = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Fiction" });

    const res = await request(app)
      .delete(`/api/categories/${cat.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("succeeds for an admin", async () => {
    const token = await registerAndLogin("alice");
    const cat = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Fiction" });

    const adminToken = await makeAdminAndLogin("alice");

    const res = await request(app)
      .delete(`/api/categories/${cat.body._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("still lets any logged-in user create a category (not admin-gated)", async () => {
    const token = await registerAndLogin("alice");
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Non-Fiction" });

    expect(res.status).toBe(201);
  });
});

describe("Post deletion — owner or admin", () => {
  async function createPost(token) {
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookTitle: "Dune", bookCover: "dune.jpg" });
    return res.body;
  }

  it("still rejects a non-owner, non-admin user (regression check)", async () => {
    const aliceToken = await registerAndLogin("alice");
    const post = await createPost(aliceToken);
    const bobToken = await registerAndLogin("bob");

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
  });

  it("lets an admin delete a post they don't own", async () => {
    const aliceToken = await registerAndLogin("alice");
    const post = await createPost(aliceToken);
    await registerAndLogin("mod");
    const adminToken = await makeAdminAndLogin("mod");

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/posts/${post._id}`);
    expect(getRes.status).toBe(404);
  });
});

describe("Tokens issued before roles existed", () => {
  it("are treated as a regular user, not a crash", async () => {
    const username = "legacyuser";
    await request(app)
      .post("/api/auth/register")
      .send({ username, email: `${username}@example.com`, password: "password123" });

    // Simulate an old token with no role claim at all.
    const legacyToken = jwt.sign({ id: "000000000000000000000000", username }, process.env.JWT_SECRET);

    const res = await request(app)
      .delete("/api/categories/000000000000000000000000")
      .set("Authorization", `Bearer ${legacyToken}`);

    expect(res.status).toBe(403); // rejected as non-admin, not a 500
  });
});
