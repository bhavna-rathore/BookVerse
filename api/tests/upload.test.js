const request = require("supertest");
const fs = require("fs");
const path = require("path");
const app = require("../app");
const db = require("./dbHandler");

const uploadedFiles = [];
const IMAGES_DIR = path.join(__dirname, "..", "images");

// Real PNG magic bytes — content-sniffing now checks the file on disk, not
// just the claimed Content-Type, so test fixtures need to actually look
// like the format they claim to be.
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
function fakePng(payload = "fake png data") {
  return Buffer.concat([PNG_HEADER, Buffer.from(payload)]);
}

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
      .attach("file", fakePng(), "cover.png");

    expect(res.status).toBe(401);
  });

  it("accepts a valid image and returns a server-generated filename, not the client's", async () => {
    const token = await registerAndLogin("alice");

    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", fakePng(), "my-cover.png");

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

  it("rejects a file whose content doesn't match its claimed image type (spoofed Content-Type)", async () => {
    // multer's fileFilter only sees the client-supplied Content-Type header,
    // which is trivially spoofable — this is the actual content-sniffing
    // check that catches it after the header lies.
    const token = await registerAndLogin("alice");

    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("<script>alert(1)</script>"), {
        filename: "evil.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
  });

  it("generates a different filename for two uploads with the same original name", async () => {
    const token = await registerAndLogin("alice");

    const first = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", fakePng("first"), "same-name.png");
    const second = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", fakePng("second"), "same-name.png");

    expect(first.body.filename).not.toBe(second.body.filename);

    uploadedFiles.push(first.body.filename, second.body.filename);
  });
});
