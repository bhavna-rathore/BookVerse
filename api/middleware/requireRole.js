// Compose after verifyToken — relies on req.user.role from the verified JWT.
// A token issued before roles existed has no `role` claim, which is treated
// as "user" (the safe default), not a crash.
function requireRole(role) {
  return function (req, res, next) {
    const actualRole = req.user?.role || "user";
    if (actualRole !== role) {
      return res.status(403).json({ error: "You don't have permission to do that" });
    }
    next();
  };
}

module.exports = requireRole;
