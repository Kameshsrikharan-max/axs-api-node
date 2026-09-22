const equipmentChecklistRepository = require("../repository/equipmentChecklist.repository");
const equipmentDefaultListRepository = require("../repository/equipmentDefaultList.repository");
const AppError = require("../config/errors/AppError");

// Fallback starter list used the very first time a studio/user opens the
// checklist before they've ever saved their own customized default list.
const STARTER_DEFAULT_ITEMS = [
  { name: "Camera Body (Primary)", category: "Camera" },
  { name: "Camera Body (Backup)", category: "Camera" },
  { name: "Kit Lens", category: "Lens" },
  { name: "Prime Lens", category: "Lens" },
  { name: "Zoom Lens", category: "Lens" },
  { name: "Flash / Speedlight", category: "Lighting" },
  { name: "Reflector", category: "Lighting" },
  { name: "LED Panel", category: "Lighting" },
  { name: "Tripod", category: "Support" },
  { name: "Monopod", category: "Support" },
  { name: "Gimbal / Stabilizer", category: "Support" },
  { name: "Memory Cards", category: "Storage" },
  { name: "Portable SSD / Backup Drive", category: "Storage" },
  { name: "Spare Batteries", category: "Power" },
  { name: "Battery Charger", category: "Power" },
  { name: "Power Bank", category: "Power" },
  { name: "Drone", category: "Specialty" },
  { name: "Audio Recorder", category: "Audio" },
  { name: "Lapel Mic", category: "Audio" },
  { name: "Laptop", category: "Editing" },
];

function sanitizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      name: (item?.name || "").trim(),
      category: (item?.category || "General").trim() || "General",
    }))
    .filter((item) => item.name.length > 0);
}

async function getDefaultList(ownerId) {
  const saved = await equipmentDefaultListRepository.findByOwner(ownerId);
  if (saved) return saved;
  // Not persisted yet — this is just a preview of what will be used to
  // seed a new event's checklist until the owner explicitly saves one.
  return { owner: ownerId, items: STARTER_DEFAULT_ITEMS, _isFallback: true };
}

async function saveDefaultList(ownerId, items) {
  const clean = sanitizeItems(items);
  if (clean.length === 0) {
    throw new AppError("Default list needs at least one item", 400);
  }
  return equipmentDefaultListRepository.upsert(ownerId, clean);
}

async function getChecklistForEvent(eventId, ownerId) {
  const existing = await equipmentChecklistRepository.findByEventId(eventId);
  if (existing) return existing;

  const defaultList = await getDefaultList(ownerId);
  const seededItems = defaultList.items.map((item) => ({
    name: item.name,
    category: item.category,
    checked: false,
    checkedBy: "",
    checkedAt: null,
  }));

  return equipmentChecklistRepository.create(eventId, seededItems, ownerId);
}

async function addItem(eventId, name, category) {
  const cleanName = (name || "").trim();
  if (!cleanName) {
    throw new AppError("Item name is required", 400);
  }

  const item = {
    name: cleanName,
    category: (category || "General").trim() || "General",
    checked: false,
    checkedBy: "",
    checkedAt: null,
  };

  const updated = await equipmentChecklistRepository.addItem(eventId, item);
  if (!updated) {
    throw new AppError("Checklist not found for this event", 404);
  }
  return updated;
}

async function removeItem(eventId, itemId) {
  const updated = await equipmentChecklistRepository.removeItem(eventId, itemId);
  if (!updated) {
    throw new AppError("Checklist not found for this event", 404);
  }
  return updated;
}

async function setItemChecked(eventId, itemId, checked, checkedByLabel) {
  const updated = await equipmentChecklistRepository.setItemChecked(
    eventId,
    itemId,
    checked,
    checkedByLabel
  );
  if (!updated) {
    throw new AppError("Checklist item not found", 404);
  }
  return updated;
}

module.exports = {
  getDefaultList,
  saveDefaultList,
  getChecklistForEvent,
  addItem,
  removeItem,
  setItemChecked,
};