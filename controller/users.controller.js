const usersService = require("../service/users.service");

async function listUsers(req, res, next) {
  try {
    const users = await usersService.listStudioUsers(req.user);
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers };