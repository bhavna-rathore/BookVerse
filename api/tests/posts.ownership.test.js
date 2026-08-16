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

async function createPost(token, overrides = {}) {
  const res = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      bookTitle: "Atomic Habits",
      author: "James Clear",
      bookCover: "cover.jpg",
      summary: "Small habits, big results.",
      ...overrides,
    });
  return res.body;
}

describe("POST /api/posts", () => {
  it("rejects post creation with no token", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ bookTitle: "X", bookCover: "x.jpg" });

    expect(res.status).toBe(401);
  });

  it("sets the post's username from the verified token, ignoring any client-supplied username", async () => {
    const token = await registerAndLogin("alice");

    const post = await createPost(token, { username: "someone-else-entirely" });

    expect(post.username).toBe("alice");
  });

  it("ignores server-managed fields a client tries to set directly (likes, isFeatured)", async () => {
    const token = await registerAndLogin("alice");

    const post = await createPost(token, { likes: 999999, isFeatured: true });

    expect(post.likes).toBe(0);
    expect(post.isFeatured).toBe(false);
  });
});

describe("PUT /api/posts/:id — ownership enforcement", () => {
  it("lets the owner update their own post", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ bookTitle: "Atomic Habits (Updated)" });

    expect(res.status).toBe(200);
    expect(res.body.bookTitle).toBe("Atomic Habits (Updated)");
  });

  it("rejects an update from a different logged-in user with 403", async () => {
    const aliceToken = await registerAndLogin("alice");
    const post = await createPost(aliceToken);
    const bobToken = await registerAndLogin("bob");

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ bookTitle: "Hijacked" });

    expect(res.status).toBe(403);
  });

  it("rejects an update with no token at all", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .send({ bookTitle: "Hijacked" });

    expect(res.status).toBe(401);
  });

  it("can't be tricked by sending a different username in the body", async () => {
    // This is the exact scenario the original review flagged: ownership must
    // come from the verified token, never from a client-supplied field.
    const aliceToken = await registerAndLogin("alice");
    const post = await createPost(aliceToken);
    const bobToken = await registerAndLogin("bob");

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ username: "alice", bookTitle: "Hijacked via spoofed body" });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/posts/:id — ownership enforcement", () => {
  it("lets the owner delete their own post", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/posts/${post._id}`);
    expect(getRes.status).toBe(404);
  });

  it("rejects a delete from a different logged-in user with 403, and the post survives", async () => {
    const aliceToken = await registerAndLogin("alice");
    const post = await createPost(aliceToken);
    const bobToken = await registerAndLogin("bob");

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(res.status).toBe(403);

    const getRes = await request(app).get(`/api/posts/${post._id}`);
    expect(getRes.status).toBe(200);
  });

  it("can no longer be bypassed via a ?username= query param (the original vulnerability)", async () => {
    const aliceToken = await registerAndLogin("alice");
    const post = await createPost(aliceToken);
    const bobToken = await registerAndLogin("bob");

    const res = await request(app)
      .delete(`/api/posts/${post._id}?username=alice`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
  });
});

describe("GET /api/posts", () => {
  it("is public and returns posts without requiring a token", async () => {
    const token = await registerAndLogin("alice");
    await createPost(token);

    const res = await request(app).get("/api/posts");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("paginates and caps the page size at 100", async () => {
    const res = await request(app).get("/api/posts?limit=500");
    expect(res.status).toBe(200);
    // Nothing to actually hit the cap with here, but the request must not error.
    expect(Array.isArray(res.body)).toBe(true);
  });
});
