const User = require("../models/User");
const StudioProfile = require("../models/StudioProfile");
const PhotographerProfile = require("../models/PhotographerProfile");
const StudioManagerProfile = require("../models/StudioManagerProfile");
const StudioPhotographerProfile = require("../models/StudioPhotographerProfile");
const AppError = require("../config/errors/AppError");

const PROFILE_MODELS = {
  "studio-admin": { Model: StudioProfile, role: "studio_admin" },
  "freelance-photographer": { Model: PhotographerProfile, role: "freelance_photographer" },
  "studio-manager": { Model: StudioManagerProfile, role: "studio_manager" },
  "studio-photographer": { Model: StudioPhotographerProfile, role: "studio_photographer" },
};

function resolveModel(type) {
  const entry = PROFILE_MODELS[type];
  if (!entry) {
    throw new AppError("Unknown registration type", 400);
  }
  return entry;
}

async function listPendingRegistrations() {
  const [pendingStudios, pendingPhotographers, pendingManagers, pendingStudioPhotographers] = await Promise.all([
    StudioProfile.find({ status: "pending_review" }).populate("userId").sort({ createdAt: -1 }),
    PhotographerProfile.find({ status: "pending_review" }).populate("userId").sort({ createdAt: -1 }),
    StudioManagerProfile.find({ status: "pending_review" }).populate("userId").populate("studioOwnerId").sort({ createdAt: -1 }),
    StudioPhotographerProfile.find({ status: "pending_review" }).populate("userId").populate("studioOwnerId").sort({ createdAt: -1 }),
  ]);

  const toEntry = (profile, type) => {
    let details;
    if (type === "studio-admin") details = profile.studioDetails;
    else if (type === "freelance-photographer") details = profile.photographerDetails;
    else if (type === "studio-manager") details = profile.managerDetails;
    else details = profile.photographerDetails;

    const workOrDocuments =
      type === "studio-admin" ? profile.documents : type === "freelance-photographer" ? profile.workArea : {};

    return {
      profileId: profile._id,
      type,
      user: profile.userId,
      studioOwner: profile.studioOwnerId || undefined,
      basicInfo: profile.basicInfo,
      kyc: profile.kyc,
      details,
      workOrDocuments,
      status: profile.status,
      createdAt: profile.createdAt,
    };
  };

  const combined = [
    ...pendingStudios.map((p) => toEntry(p, "studio-admin")),
    ...pendingPhotographers.map((p) => toEntry(p, "freelance-photographer")),
    ...pendingManagers.map((p) => toEntry(p, "studio-manager")),
    ...pendingStudioPhotographers.map((p) => toEntry(p, "studio-photographer")),
  ];

  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return combined;
}

async function approveRegistration(type, profileId) {
  const { Model } = resolveModel(type);

  const profile = await Model.findById(profileId);
  if (!profile) {
    throw new AppError("Registration not found", 404);
  }
  if (profile.status !== "pending_review") {
    throw new AppError("This registration has already been reviewed", 409);
  }

  profile.status = "active";
  await profile.save();

  const user = await User.findById(profile.userId);
  return { email: user ? user.email : profile.basicInfo.email };
}

async function rejectRegistration(type, profileId) {
  const { Model } = resolveModel(type);

  const profile = await Model.findById(profileId);
  if (!profile) {
    throw new AppError("Registration not found", 404);
  }
  if (profile.status !== "pending_review") {
    throw new AppError("This registration has already been reviewed", 409);
  }

  // Rejecting removes the account entirely — same email can re-register.
  const userId = profile.userId;
  await Model.deleteOne({ _id: profile._id });
  if (userId) {
    await User.deleteOne({ _id: userId });
  }

  return { email: profile.basicInfo.email };
}

module.exports = { listPendingRegistrations, approveRegistration, rejectRegistration };