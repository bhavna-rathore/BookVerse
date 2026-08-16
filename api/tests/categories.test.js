const request = require("supertest");
const app = require("../app");
const db = require("./dbHandler");

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

describe("POST /api/categories", () => {
  it("rejects a duplicate category name that only differs by case", async () => {
    const token = await registerAndLogin("alice");

    await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Fiction" });

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "fiction" });

    expect(res.status).toBe(409);
  });
});

describe("Post <-> Category linking", () => {
  it("resolves a client-supplied categoryId to a real category on create", async () => {
    const token = await registerAndLogin("alice");
    const catRes = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Self Growth" });

    const postRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookTitle: "Atomic Habits",
        bookCover: "cover.jpg",
        categoryId: catRes.body._id,
      });

    expect(postRes.body.categoryId).toBe(catRes.body._id);
    expect(postRes.body.category).toBe("Self Growth");
  });

  it("ignores an invalid/unknown categoryId instead of erroring", async () => {
    const token = await registerAndLogin("alice");

    const postRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        bookTitle: "Atomic Habits",
        bookCover: "cover.jpg",
        categoryId: "000000000000000000000000",
      });

    expect(postRes.status).toBe(200);
    expect(postRes.body.categoryId).toBeNull();
  });

  it("filters posts by category name case-insensitively (the original bug)", async () => {
    const token = await registerAndLogin("alice");
    const catRes = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Fiction" });

    await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookTitle: "Dune", bookCover: "dune.jpg", categoryId: catRes.body._id });

    // Original bug: a post stored with category "Fiction" would never match
    // a filter of "fiction" because it was a plain string comparison.
    const res = await request(app).get("/api/posts?category=fiction");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].bookTitle).toBe("Dune");
  });

  it("returns an empty list (not all posts) for an unknown category name", async () => {
    const token = await registerAndLogin("alice");
    await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookTitle: "Dune", bookCover: "dune.jpg" });

    const res = await request(app).get("/api/posts?category=does-not-exist");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
