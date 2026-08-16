const request = require("supertest");
const app = require("../app");
const db = require("./dbHandler");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => db.closeDatabase());

async function registerAndLogin(username) {
  const registerRes = await request(app)
    .post("/api/auth/register")
    .send({ username, email: `${username}@example.com`, password: "password123" });

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username, password: "password123" });

  return { id: registerRes.body._id, token: loginRes.body.token };
}

describe("GET /api/users/:id", () => {
  it("returns a public profile shape only — never the email or password", async () => {
    const alice = await registerAndLogin("alice");

    const res = await request(app).get(`/api/users/${alice.id}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice");
    expect(res.body.email).toBeUndefined();
    expect(res.body.password).toBeUndefined();
  });
});

describe("PUT /api/users/:id — ownership enforcement", () => {
  it("lets a user update their own account", async () => {
    const alice = await registerAndLogin("alice");

    const res = await request(app)
      .put(`/api/users/${alice.id}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ username: "alice-updated" });

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("alice-updated");
  });

  it("rejects a request with no token", async () => {
    const alice = await registerAndLogin("alice");

    const res = await request(app)
      .put(`/api/users/${alice.id}`)
      .send({ username: "hijacked" });

    expect(res.status).toBe(401);
  });

  it("can no longer be bypassed by sending a matching userId in the body (the original vulnerability)", async () => {
    const alice = await registerAndLogin("alice");
    const bob = await registerAndLogin("bob");

    // Bob is authenticated as himself, but tries to edit Alice's account by
    // targeting her id in the URL and body — this used to be enough.
    const res = await request(app)
      .put(`/api/users/${alice.id}`)
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ userId: alice.id, username: "hijacked-by-bob" });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/users/:id — ownership enforcement", () => {
  it("rejects account deletion from a different logged-in user", async () => {
    const alice = await registerAndLogin("alice");
    const bob = await registerAndLogin("bob");

    const res = await request(app)
      .delete(`/api/users/${alice.id}`)
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ userId: alice.id });

    expect(res.status).toBe(403);

    const stillThere = await request(app).get(`/api/users/${alice.id}`);
    expect(stillThere.status).toBe(200);
  });

  it("lets a user delete their own account", async () => {
    const alice = await registerAndLogin("alice");

    const res = await request(app)
      .delete(`/api/users/${alice.id}`)
      .set("Authorization", `Bearer ${alice.token}`);

    expect(res.status).toBe(200);

    const gone = await request(app).get(`/api/users/${alice.id}`);
    expect(gone.status).toBe(404);
  });
});
