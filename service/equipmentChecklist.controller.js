const equipmentChecklistService = require("./equipmentChecklist.service");

async function getDefaultList(req, res, next) {
  try {
    const list = await equipmentChecklistService.getDefaultList(req.user._id);
    res.json({ success: true, defaultList: list });
  } catch (err) {
    next(err);
  }
}

async function saveDefaultList(req, res, next) {
  try {
    const items = req.body.items || [];
    const list = await equipmentChecklistService.saveDefaultList(req.user._id, items);
    res.json({ success: true, message: "Default equipment list saved", defaultList: list });
  } catch (err) {
    next(err);
  }
}

async function getChecklist(req, res, next) {
  try {
    const { eventId } = req.params;
    const checklist = await equipmentChecklistService.getChecklistForEvent(eventId, req.user._id);
    res.json({ success: true, checklist });
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { eventId } = req.params;
    const { name, category } = req.body;
    const checklist = await equipmentChecklistService.addItem(eventId, name, category);
    res.json({ success: true, checklist });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const { eventId, itemId } = req.params;
    const checklist = await equipmentChecklistService.removeItem(eventId, itemId);
    res.json({ success: true, checklist });
  } catch (err) {
    next(err);
  }
}

async function setItemChecked(req, res, next) {
  try {
    const { eventId, itemId } = req.params;
    const { checked } = req.body;
    const checkedByLabel = req.user?.name || req.user?.email || "";
    const checklist = await equipmentChecklistService.setItemChecked(
      eventId,
      itemId,
      Boolean(checked),
      checkedByLabel
    );
    res.json({ success: true, checklist });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDefaultList,
  saveDefaultList,
  getChecklist,
  addItem,
  removeItem,
  setItemChecked,
};