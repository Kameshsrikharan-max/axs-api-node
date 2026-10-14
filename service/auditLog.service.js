const auditLogRepository = require("../repository/auditLog.repository");

// Never throws — a logging failure must not break the real request.
async function logActivity(entry) {
  try {
    await auditLogRepository.create(entry);
  } catch (err) {
    console.error("[audit] failed to write log:", err.message);
  }
}

async function listLogs(query) {
  return auditLogRepository.findPaged(query);
}

async function getStats() {
  return auditLogRepository.stats();
}

module.exports = { logActivity, listLogs, getStats };