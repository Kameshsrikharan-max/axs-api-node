const User = require("../models/User");
const StudioProfile = require("../models/StudioProfile");
const PhotographerProfile = require("../models/PhotographerProfile");
const StudioManagerProfile = require("../models/StudioManagerProfile");
const StudioPhotographerProfile = require("../models/StudioPhotographerProfile");
const AppError = require("../config/errors/AppError");

const ROLE_DISPLAY_LABEL = {
  studio_admin: "Studio Admin",
  freelance_photographer: "Freelance Photographer",
  studio_manager: "Studio Manager",
  studio_photographer: "Studio Photographer",
};

const INVITE_BASED_ROLES = ["studio_manager", "studio_photographer"];

const PROFILE_MODEL_BY_ROLE = {
  studio_admin: StudioProfile,
  freelance_photographer: PhotographerProfile,
  studio_manager: StudioManagerProfile,
  studio_photographer: StudioPhotographerProfile,
};

const STATUS_LABEL = {
  pending_review: "Pending",
  active: "Active",
  rejected: "Inactive",
};

function detailsBlockForRole(role, profile) {
  if (!profile) return {};
  if (role === "studio_admin") return profile.studioDetails || {};
  if (role === "freelance_photographer") return profile.photographerDetails || {};
  if (role === "studio_manager") return profile.managerDetails || {};
  if (role === "studio_photographer") return profile.photographerDetails || {};
  return {};
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// One query per role instead of one per user.
async function loadProfilesForUsers(users) {
  const idsByRole = {};
  users.forEach((u) => {
    if (!PROFILE_MODEL_BY_ROLE[u.role]) return;
    idsByRole[u.role] = idsByRole[u.role] || [];
    idsByRole[u.role].push(u._id);
  });

  const profileMap = new Map();
  await Promise.all(
    Object.entries(idsByRole).map(async ([role, ids]) => {
      const Model = PROFILE_MODEL_BY_ROLE[role];
      const profiles = await Model.find({ userId: { $in: ids } });
      profiles.forEach((p) => profileMap.set(String(p.userId), p));
    })
  );
  return profileMap;
}

// Studio name lookup for manager/photographer profiles, keyed by studioOwnerId.
async function loadStudioNames(studioOwnerIds) {
  const uniqueIds = [...new Set(studioOwnerIds.map(String))];
  if (uniqueIds.length === 0) return new Map();
  const studios = await StudioProfile.find({ userId: { $in: uniqueIds } });
  const map = new Map();
  studios.forEach((s) => map.set(String(s.userId), s.studioDetails?.studioName || ""));
  return map;
}

async function buildUserRecords(users) {
  const profileMap = await loadProfilesForUsers(users);

  const studioOwnerIds = users
    .map((u) => profileMap.get(String(u._id)))
    .filter((p) => p && p.studioOwnerId)
    .map((p) => p.studioOwnerId);
  const studioNameMap = await loadStudioNames(studioOwnerIds);

  return users.map((u) => {
    const profile = profileMap.get(String(u._id));
    const details = detailsBlockForRole(u.role, profile);
    const basicInfo = profile?.basicInfo || {};
    const fullName = `${basicInfo.firstName || ""} ${basicInfo.lastName || ""}`.trim() || u.name;

    const studioName = profile?.studioOwnerId
      ? studioNameMap.get(String(profile.studioOwnerId)) || ""
      : u.role === "studio_admin"
      ? details.studioName || ""
      : "";

    return {
      id: String(u._id),
      name: fullName,
      email: u.email,
      phone: basicInfo.phone || details.phone || "",
      studio: studioName,
      studioId: profile?.studioOwnerId
        ? String(profile.studioOwnerId)
        : u.role === "studio_admin"
        ? String(u._id)
        : undefined,
      role: ROLE_DISPLAY_LABEL[u.role] || u.role,
      status: STATUS_LABEL[profile?.status] || "Pending",
      signupType: INVITE_BASED_ROLES.includes(u.role) ? "Invited" : "Registered",
      created: formatDate(profile?.createdAt || u.createdAt),
      location: basicInfo.city || "",
      notes: details.bio || "",
    };
  });
}

async function listStudioUsers(requester) {
  if (requester.role === "super_admin") {
    const users = await User.find({
      role: { $in: ["studio_admin", "freelance_photographer", "studio_manager", "studio_photographer"] },
    }).sort({ createdAt: -1 });
    return buildUserRecords(users);
  }

  if (requester.role === "studio_admin") {
    const [managerProfiles, photographerProfiles] = await Promise.all([
      StudioManagerProfile.find({ studioOwnerId: requester._id }, "userId"),
      StudioPhotographerProfile.find({ studioOwnerId: requester._id }, "userId"),
    ]);
    const scopedUserIds = [...managerProfiles, ...photographerProfiles].map((p) => p.userId);

    const [scopedUsers, freelanceUsers] = await Promise.all([
      User.find({ _id: { $in: scopedUserIds } }),
      User.find({ role: "freelance_photographer" }), // not studio-scoped yet, see note above
    ]);

    const users = [...scopedUsers, ...freelanceUsers].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return buildUserRecords(users);
  }

  throw new AppError("Not authorized to list studio users", 403);
}

module.exports = { listStudioUsers };