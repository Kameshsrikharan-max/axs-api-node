const User = require("../models/User");
const StudioProfile = require("../models/StudioProfile");
const PhotographerProfile = require("../models/PhotographerProfile");
const { makeToken } = require("../utils/token");
const AppError = require("../config/errors/AppError");

async function assertEmailFree(email) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }
}

function deriveName(basicInfo, email) {
  const full = `${basicInfo.firstName || ""} ${basicInfo.lastName || ""}`.trim();
  return full || email.split("@")[0];
}

async function registerStudioAdmin(formData) {
  const basicInfo = formData && formData.basicInfo;
  if (!basicInfo || !basicInfo.email) {
    throw new AppError("Basic info with a valid email is required", 400);
  }

  const email = basicInfo.email.trim().toLowerCase();
  await assertEmailFree(email);

  const user = await User.create({
    name: deriveName(basicInfo, email),
    email,
    role: "studio_admin",
  });

  try {
    const profile = await StudioProfile.create({
      userId: user._id,
      basicInfo,
      kyc: formData.kyc,
      studioDetails: formData.studioDetails,
      documents: formData.documents,
    });

    const token = makeToken(email);
    return { user, profile, token };
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }
}

async function registerFreelancePhotographer(formData) {
  const basicInfo = formData && formData.basicInfo;
  if (!basicInfo || !basicInfo.email) {
    throw new AppError("Basic info with a valid email is required", 400);
  }

  const email = basicInfo.email.trim().toLowerCase();
  await assertEmailFree(email);

  const user = await User.create({
    name: deriveName(basicInfo, email),
    email,
    role: "freelance_photographer",
  });

  try {
    const profile = await PhotographerProfile.create({
      userId: user._id,
      basicInfo,
      kyc: formData.kyc,
      photographerDetails: formData.photographerDetails,
      workArea: formData.workArea,
    });

    const token = makeToken(email);
    return { user, profile, token };
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }
}

module.exports = { registerStudioAdmin, registerFreelancePhotographer };