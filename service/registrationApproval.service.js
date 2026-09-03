const User = require("../models/User");
const StudioProfile = require("../models/StudioProfile");
const PhotographerProfile = require("../models/PhotographerProfile");
const AppError = require("../config/errors/AppError");

const PROFILE_MODELS = {
  "studio-admin": { Model: StudioProfile, role: "studio_admin" },
  "freelance-photographer": { Model: PhotographerProfile, role: "freelance_photographer" },
};

function resolveModel(type) {
  const entry = PROFILE_MODELS[type];
  if (!entry) {
    throw new AppError("Unknown registration type", 400);
  }
  return entry;
}

async function listPendingRegistrations() {
  const [pendingStudios, pendingPhotographers] = await Promise.all([
    StudioProfile.find({ status: "pending_review" }).populate("userId").sort({ createdAt: -1 }),
    PhotographerProfile.find({ status: "pending_review" }).populate("userId").sort({ createdAt: -1 }),
  ]);

  const toEntry = (profile, type) => ({
    profileId: profile._id,
    type,
    user: profile.userId,
    basicInfo: profile.basicInfo,
    kyc: profile.kyc,
    details: type === "studio-admin" ? profile.studioDetails : profile.photographerDetails,
    workOrDocuments: type === "studio-admin" ? profile.documents : profile.workArea,
    status: profile.status,
    createdAt: profile.createdAt,
  });

  const combined = [
    ...pendingStudios.map((p) => toEntry(p, "studio-admin")),
    ...pendingPhotographers.map((p) => toEntry(p, "freelance-photographer")),
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