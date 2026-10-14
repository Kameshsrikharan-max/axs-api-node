const AuditLog = require("../models/AuditLog");

function buildFilter({ category, outcome, actor, search, from, to }) {
  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (outcome && outcome !== "all") filter.outcome = outcome;
  if (actor) filter.actorEmail = actor.toLowerCase();
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ actorEmail: rx }, { actorName: rx }, { action: rx }, { summary: rx }, { targetId: rx }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  return filter;
}

async function create(entry) {
  return AuditLog.create(entry);
}

async function findPaged(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 25));
  const filter = buildFilter(query);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function stats() {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [total, last24h, failures24h, byCategory, topActors, perDay] = await Promise.all([
    AuditLog.countDocuments({}),
    AuditLog.countDocuments({ createdAt: { $gte: dayAgo } }),
    AuditLog.countDocuments({ createdAt: { $gte: dayAgo }, outcome: "failure" }),
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, actorEmail: { $ne: "" } } },
      { $group: { _id: "$actorEmail", count: { $sum: 1 }, name: { $first: "$actorName" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    total,
    last24h,
    failures24h,
    byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
    topActors: topActors.map((a) => ({ email: a._id, name: a.name, count: a.count })),
    perDay: perDay.map((d) => ({ date: d._id, count: d.count })),
  };
}

module.exports = { create, findPaged, stats };