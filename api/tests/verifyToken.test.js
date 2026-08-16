const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/verifyToken");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("verifyToken middleware", () => {
  it("rejects a request with no Authorization header", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a malformed/invalid token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token signed with the wrong secret", () => {
    const badToken = jwt.sign({ id: "1", username: "eve" }, "wrong-secret");
    const req = { headers: { authorization: `Bearer ${badToken}` } };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a valid token and attaches the decoded payload to req.user", (done) => {
    const token = jwt.sign({ id: "abc123", username: "alice" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();

    verifyToken(req, res, () => {
      expect(req.user).toMatchObject({ id: "abc123", username: "alice" });
      done();
    });
  });
});
