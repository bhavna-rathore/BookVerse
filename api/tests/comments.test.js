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

async function createPost(token) {
  const res = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({ bookTitle: "Dune", bookCover: "dune.jpg" });
  return res.body;
}

describe("POST /api/comments", () => {
  it("rejects a comment with no token", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);

    const res = await request(app).post("/api/comments").send({ postId: post._id, text: "Great book!" });
    expect(res.status).toBe(401);
  });

  it("rejects empty text", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);

    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "   " });

    expect(res.status).toBe(400);
  });

  it("rejects a postId that doesn't refer to a real post", async () => {
    const token = await registerAndLogin("alice");

    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: "000000000000000000000000", text: "Great book!" });

    expect(res.status).toBe(400);
  });

  it("creates a top-level comment with username from the token, not the body", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);

    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Great book!", username: "someone-else" });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe("alice");
    expect(res.body.parentId).toBeNull();
  });

  it("creates a nested reply", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);
    const top = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Great book!" });

    const bobToken = await registerAndLogin("bob");
    const reply = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ postId: post._id, text: "Agreed!", parentId: top.body._id });

    expect(reply.status).toBe(201);
    expect(reply.body.parentId).toBe(top.body._id);
  });

  it("rejects a parentId belonging to a different post", async () => {
    const token = await registerAndLogin("alice");
    const postA = await createPost(token);
    const postB = await createPost(token);
    const top = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: postA._id, text: "On post A" });

    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: postB._id, text: "Cross-post reply", parentId: top.body._id });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/comments?postId=", () => {
  it("returns a nested tree, not a flat list", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);

    const top = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Top level" });
    await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "A reply", parentId: top.body._id });

    const res = await request(app).get(`/api/comments?postId=${post._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1); // one root
    expect(res.body[0].text).toBe("Top level");
    expect(res.body[0].replies).toHaveLength(1);
    expect(res.body[0].replies[0].text).toBe("A reply");
  });
});

describe("DELETE /api/comments/:id", () => {
  it("lets the owner delete their own comment", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);
    const comment = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Delete me" });

    const res = await request(app)
      .delete(`/api/comments/${comment.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("rejects deletion from a different non-admin user", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);
    const comment = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Not yours" });

    const bobToken = await registerAndLogin("bob");
    const res = await request(app)
      .delete(`/api/comments/${comment.body._id}`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
  });

  it("lets an admin delete someone else's comment", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);
    const comment = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Moderate me" });

    await registerAndLogin("mod");
    const adminToken = await makeAdminAndLogin("mod");

    const res = await request(app)
      .delete(`/api/comments/${comment.body._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it("cascades delete to replies", async () => {
    const token = await registerAndLogin("alice");
    const post = await createPost(token);
    const top = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Parent" });
    const reply = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Child", parentId: top.body._id });
    const grandchild = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${token}`)
      .send({ postId: post._id, text: "Grandchild", parentId: reply.body._id });

    const delRes = await request(app)
      .delete(`/api/comments/${top.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.deletedCount).toBe(3); // parent + child + grandchild

    const treeRes = await request(app).get(`/api/comments?postId=${post._id}`);
    expect(treeRes.body).toHaveLength(0);
  });
});
