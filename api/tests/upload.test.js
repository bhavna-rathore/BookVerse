const request = require("supertest");
const fs = require("fs");
const path = require("path");
const app = require("../app");
const db = require("./dbHandler");

const uploadedFiles = [];
const IMAGES_DIR = path.join(__dirname, "..", "images");

beforeAll(async () => db.connect());
afterEach(async () => db.clearDatabase());
afterAll(async () => {
  await db.closeDatabase();
  // Clean up anything the upload tests actually wrote to disk.
  for (const filename of uploadedFiles) {
    const p = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});

async function registerAndLogin(username) {
  await request(app)
    .post("/api/auth/register")
    .send({ username, email: `${username}@example.com`, password: "password123" });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ username, password: "password123" });

  return res.body.token;
}

describe("POST /api/upload", () => {
  it("rejects an upload with no token", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("file", Buffer.from("fake image bytes"), "cover.png");

    expect(res.status).toBe(401);
  });

  it("accepts a valid image and returns a server-generated filename, not the client's", async () => {
    const token = await registerAndLogin("alice");

    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("fake image bytes"), "my-cover.png");

    expect(res.status).toBe(200);
    expect(typeof res.body.filename).toBe("string");
    expect(res.body.filename).not.toBe("my-cover.png");
    expect(res.body.filename.endsWith(".png")).toBe(true);

    uploadedFiles.push(res.body.filename);
  });

  it("rejects a disallowed file type (e.g. an HTML file)", async () => {
    const token = await registerAndLogin("alice");

    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("<script>alert(1)</script>"), {
        filename: "evil.html",
        contentType: "text/html",
      });

    expect(res.status).toBe(400);
  });

  it("generates a different filename for two uploads with the same original name", async () => {
    const token = await registerAndLogin("alice");

    const first = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("first"), "same-name.png");
    const second = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("second"), "same-name.png");

    expect(first.body.filename).not.toBe(second.body.filename);

    uploadedFiles.push(first.body.filename, second.body.filename);
  });
});
