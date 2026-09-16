const Event = require("../models/Event");
const notificationService = require("../service/notification.service");

const PHOTOGRAPHER_ROLES = [
  "studio_photographer",
  "freelance_photographer",
];

const EVENT_FIELDS = [
  "name",
  "type",
  "date",
  "time",
  "address",
  "city",
  "state",
  "customer",
  "customerPhone",
  "customerEmail",
  "status",
  "pipeline",
  "members",
  "budget",
  "image",
  "location",
  "selectedServices",
  "albumData",
];

const eventResponse = (event) => {
  const item = event.toObject ? event.toObject() : event;

  return {
    ...item,
    id: String(item._id),
    _id: String(item._id),
  };
};

const cleanAssignedMembers = (members = []) => {
  if (!Array.isArray(members)) return [];

  return members
    .filter((member) => member && member.email)
    .map((member) => ({
      // Supports the current frontend `id` field and the correct `userId` field.
      userId: member.userId || member.id || undefined,
      name: String(member.name || "").trim(),
      email: String(member.email || "").trim().toLowerCase(),
      mobile: String(member.mobile || "").trim(),
      city: String(member.city || "").trim(),
      role: String(member.role || "").trim(),
      assignRole: String(member.assignRole || "Photographer").trim(),
      service: String(member.service || "General").trim(),
      status: String(member.status || "Confirmed").trim(),
    }));
};

const eventPayload = (body = {}) => {
  return EVENT_FIELDS.reduce((result, field) => {
    if (body[field] !== undefined) {
      result[field] = body[field];
    }
    return result;
  }, {});
};

async function create(req, res, next) {
  try {
    const payload = eventPayload(req.body);

    const event = await Event.create({
      ...payload,
      createdBy: req.user._id,
      members: Number(payload.members || 0),
    });

    res.status(201).json({
      success: true,
      event: eventResponse(event),
    });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const userEmail = String(req.user.email || "").toLowerCase();

    const isPhotographer = PHOTOGRAPHER_ROLES.includes(req.user.role);

    // Photographers can only see events where they are assigned.
    // Email support keeps previously saved assignments working too.
    const filter = isPhotographer
      ? {
          $or: [
            { "assignedMembersList.userId": req.user._id },
            { "assignedMembersList.email": userEmail },
          ],
        }
      : {};

    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      events: events.map(eventResponse),
    });
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const isPhotographer = PHOTOGRAPHER_ROLES.includes(req.user.role);

    if (isPhotographer) {
      const email = String(req.user.email || "").toLowerCase();

      const isAssigned = event.assignedMembersList.some((member) => {
        const memberUserId = member.userId ? String(member.userId) : "";
        const memberEmail = String(member.email || "").toLowerCase();

        return (
          memberUserId === String(req.user._id) ||
          memberEmail === email
        );
      });

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this event.",
        });
      }
    }

    res.json({
      success: true,
      event: eventResponse(event),
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const payload = eventPayload(req.body);

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    res.json({
      success: true,
      event: eventResponse(event),
    });
  } catch (error) {
    next(error);
  }
}

async function assignTeam(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const assignedMembersList = cleanAssignedMembers(
      req.body.assignedMembersList
    );

    const previousEmails = new Set(
      event.assignedMembersList
        .map((member) => String(member.email || "").toLowerCase())
        .filter(Boolean)
    );

    event.assignedMembersList = assignedMembersList;
    event.members = assignedMembersList.length;

    await event.save();

    // Notify only newly assigned people; saving changes again will not create duplicates.
    const newlyAssignedMembers = assignedMembersList.filter(
      (member) => !previousEmails.has(member.email)
    );

    await Promise.all(
      newlyAssignedMembers.map((member) =>
        notificationService.createNotification({
          recipientEmail: member.email,
          notifCategory: "eventAssignment",
          category: "Event Assignment",
          title: `You've been assigned to "${event.name}"`,
          description: `You've been assigned as ${
            member.assignRole || "Photographer"
          } for this event.`,
          date: event.date,
          time: event.time || "",
          priority: "high",
          triggeredBy: req.user.name || req.user.email || "Studio Admin",
          tags: [member.assignRole, member.service].filter(Boolean),
          isActionable: true,
          eventId: event._id,
          payload: {
            eventId: String(event._id),
            eventName: event.name,
            role: member.assignRole,
            venue: [event.address, event.city].filter(Boolean).join(", "),
            assignedBy: req.user.name || req.user.email || "Studio Admin",
          },
        })
      )
    );

    res.json({
      success: true,
      event: eventResponse(event),
      notifiedCount: newlyAssignedMembers.length,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  assignTeam,
};