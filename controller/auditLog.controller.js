const auditLogService = require("../service/auditLog.service");

async function list(req, res, next) {
  try {
    res.json(await auditLogService.listLogs(req.query));
  } catch (err) {
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    res.json(await auditLogService.getStats());
  } catch (err) {
    next(err);
  }
}

module.exports = { list, stats };