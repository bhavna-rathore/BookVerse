describe("app boot", () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    jest.resetModules();
    jest.dontMock("dotenv");
  });

  it("refuses to start without JWT_SECRET set", () => {
    delete process.env.JWT_SECRET;
    jest.resetModules();
    // app.js calls dotenv.config(), which would otherwise reload the real
    // api/.env (which does have a JWT_SECRET) and mask the exact thing this
    // test is checking. Stub it out so the missing-env-var path is real.
    jest.doMock("dotenv", () => ({ config: () => {} }));

    expect(() => require("../app")).toThrow(/JWT_SECRET is required/);
  });

  it("starts fine once JWT_SECRET is set", () => {
    process.env.JWT_SECRET = "some-secret";
    jest.resetModules();

    expect(() => require("../app")).not.toThrow();
  });
});
