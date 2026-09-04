const User = require("../models/User");
const StudioProfile = require("../models/StudioProfile");
const PhotographerProfile = require("../models/PhotographerProfile");
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
    // status defaults to "pending_review" (see StudioProfile schema) —
    // this account cannot log in until a super admin approves it.
    const profile = await StudioProfile.create({
      userId: user._id,
      basicInfo,
      kyc: formData.kyc,
      studioDetails: formData.studioDetails,
      documents: formData.documents,
    });

    // No token is issued here — registration no longer logs the user in.
    // They must wait for super admin approval, then log in via OTP.
    return { user, profile };
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

    return { user, profile };
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }
}

module.exports = { registerStudioAdmin, registerFreelancePhotographer };