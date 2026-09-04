const Invite = require("../models/Invite");
const User = require("../models/User");
const StudioProfile = require("../models/StudioProfile");
const StudioManagerProfile = require("../models/StudioManagerProfile");
const StudioPhotographerProfile = require("../models/StudioPhotographerProfile");
const { generateInviteToken } = require("../utils/token");
const { sendInviteEmail } = require("../utils/mailer");
const AppError = require("../config/errors/AppError");

const INVITE_EXPIRY_DAYS = 7;
const VALID_ROLES = ["studio_manager", "studio_photographer"];

const PROFILE_MODEL_BY_ROLE = {
  studio_manager: StudioManagerProfile,
  studio_photographer: StudioPhotographerProfile,
};

// Frontend builds the actual clickable URL — this just needs a base to
// hand back for convenience; CLIENT_ORIGIN falls back sensibly if unset.
function buildInviteLink(token) {
  const base = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  return `${base}/invite/${token}`;
}

async function sendInvite(inviterUserId, { email, role }) {
  if (!email || !role) {
    throw new AppError("Email and role are required", 400);
  }
  if (!VALID_ROLES.includes(role)) {
    throw new AppError("Invalid role for invitation", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const existingPendingInvite = await Invite.findOne({ email: normalizedEmail, status: "pending" });
  if (existingPendingInvite) {
    throw new AppError("An invite is already pending for this email", 409);
  }

  const inviterStudio = await StudioProfile.findOne({ userId: inviterUserId });
  const studioName = inviterStudio?.studioDetails?.studioName || "";

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invite = await Invite.create({
    token,
    email: normalizedEmail,
    role,
    invitedBy: inviterUserId,
    studioName,
    expiresAt,
  });

  const inviteLink = buildInviteLink(token);

  try {
    await sendInviteEmail(normalizedEmail, inviteLink, role, studioName);
  } catch (err) {
    // Roll back the invite if the email genuinely never went out, so the
    // person isn't left with a dead, un-emailed invite blocking re-invites.
    await Invite.deleteOne({ _id: invite._id });
    throw new AppError("Failed to send invite email. Please try again.", 502);
  }

  return { invite, inviteLink };
}

async function getInviteByToken(token) {
  const invite = await Invite.findOne({ token });

  if (!invite) {
    throw new AppError("Invite not found", 404);
  }
  if (invite.status === "accepted") {
    throw new AppError("This invite has already been used", 410);
  }
  if (invite.status === "cancelled") {
    throw new AppError("This invite has been cancelled", 410);
  }
  if (invite.expiresAt < new Date()) {
    if (invite.status !== "expired") {
      invite.status = "expired";
      await invite.save();
    }
    throw new AppError("This invite has expired", 410);
  }

  return invite;
}

function deriveName(basicInfo, email) {
  const full = `${basicInfo.firstName || ""} ${basicInfo.lastName || ""}`.trim();
  return full || email.split("@")[0];
}

async function registerViaInvite(token, formData) {
  const invite = await getInviteByToken(token);

  const basicInfo = formData && formData.basicInfo;
  if (!basicInfo) {
    throw new AppError("Basic info is required", 400);
  }

  // The invite's email is authoritative — ignore whatever the form sends
  // for email so an invite can't be redeemed for a different address.
  const email = invite.email;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const user = await User.create({
    name: deriveName(basicInfo, email),
    email,
    role: invite.role,
  });

  const ProfileModel = PROFILE_MODEL_BY_ROLE[invite.role];

  try {
    const profileData = {
      userId: user._id,
      studioOwnerId: invite.invitedBy,
      basicInfo: { ...basicInfo, email },
      kyc: formData.kyc || {},
    };

    if (invite.role === "studio_manager") {
      profileData.managerDetails = formData.managerDetails || {};
    } else {
      profileData.photographerDetails = formData.photographerDetails || {};
    }

    const profile = await ProfileModel.create(profileData);

    invite.status = "accepted";
    await invite.save();

    return { user, profile };
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }
}

module.exports = { sendInvite, getInviteByToken, registerViaInvite };