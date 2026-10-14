const { logActivity } = require("../service/auditLog.service");

const SAFE_BODY_KEYS = ["reason", "type", "profileId", "role", "status", "comment"];

const RULES = [
  {
    test: (m, p) => m === "POST" && p === "/account/delete-request",
    action: "account.delete_request",
    category: "delete_request",
    summary: "Requested account deletion",
    target: () => ({ type: "user" }),
  },
  {
    test: (m, p) => m === "POST" && /^\/admin\/delete-requests\/[^/]+\/(approve|reject)$/.test(p),
    action: (p) => `delete_request.${p.endsWith("/approve") ? "approve" : "reject"}`,
    category: "delete_request",
    summary: (p) => `${p.endsWith("/approve") ? "Approved" : "Rejected"} a delete request`,
    target: (p) => ({ type: "user", id: p.split("/")[3] }),
  },
  {
    test: (m, p) => m === "POST" && /^\/admin\/registration[^/]*\/.*\/(approve|reject)$/.test(p),
    action: (p) => `registration.${p.endsWith("/approve") ? "approve" : "reject"}`,
    category: "registration",
    summary: (p) => `${p.endsWith("/approve") ? "Approved" : "Rejected"} a registration`,
    target: (p) => {
      const seg = p.split("/");
      return { type: seg[seg.length - 3] || "profile", id: seg[seg.length - 2] };
    },
  },
  {
    test: (m, p) => m === "POST" && /verify[-_]?otp|otp\/verify|\/login/i.test(p),
    action: "auth.login",
    category: "auth",
    summary: "Login attempt",
    target: () => ({ type: "user" }),
  },
  {
    test: (m, p) => m === "POST" && /register|signup/i.test(p),
    action: "auth.register",
    category: "auth",
    summary: "Registration submitted",
    target: () => ({ type: "profile" }),
  },
  {
    test: (m, p) => m === "POST" && p.startsWith("/checkin"),
    action: "checkin.submit",
    category: "checkin",
    summary: "Photographer check-in submitted",
    target: () => ({ type: "checkin" }),
  },
  {
    test: (m, p) => m !== "GET" && p.startsWith("/admin/"),
    action: (p, m) => `admin.${m.toLowerCase()}`,
    category: "admin",
    summary: (p, m) => `${m} ${p}`,
    target: () => ({}),
  },
];

const resolve = (v, ...args) => (typeof v === "function" ? v(...args) : v);

function auditTrail(req, res, next) {
  const method = req.method;
  if (method === "GET" || method === "OPTIONS" || method === "HEAD") return next();

  res.on("finish", () => {
    try {
      const path = (req.originalUrl || req.url || "").split("?")[0];
      const rule = RULES.find((r) => r.test(method, path));
      if (!rule) return;

      const user = req.user; // set by authenticate, available by 'finish'
      const body = req.body || {};
      const target = rule.target(path) || {};

      const meta = {};
      SAFE_BODY_KEYS.forEach((k) => {
        if (body[k] !== undefined && typeof body[k] !== "object") meta[k] = body[k];
      });

      logActivity({
        actorId: user ? user._id : null,
        actorEmail: user ? user.email : String(body.email || "").toLowerCase(),
        actorName: user ? user.name : "",
        actorRole: user ? user.role : "",
        action: resolve(rule.action, path, method),
        category: rule.category,
        summary: resolve(rule.summary, path, method),
        method,
        path,
        statusCode: res.statusCode,
        outcome: res.statusCode < 400 ? "success" : "failure",
        targetType: target.type || "",
        targetId: target.id || "",
        meta,
        ip: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "",
        userAgent: req.headers["user-agent"] || "",
      });
    } catch (err) {
      console.error("[audit] middleware error:", err.message);
    }
  });

  next();
}

module.exports = auditTrail;