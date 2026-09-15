const notificationService = require("../service/notification.service");

async function create(req, res, next) {
  try {
    const triggeredBy = req.body.triggeredBy || req.user?.name || req.user?.email || "Studio Admin";
    const notification = await notificationService.createNotification({
      ...req.body,
      triggeredBy,
    });
    res.status(201).json({ success: true, notification });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const notifications = await notificationService.listForUser(req.user.email);
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user.email);
    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user.email);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await notificationService.deleteOne(req.params.id, req.user.email);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
}

async function clearAll(req, res, next) {
  try {
    await notificationService.clearAll(req.user.email);
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, markRead, markAllRead, remove, clearAll };