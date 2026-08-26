require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const SUPER_ADMIN_EMAIL = "srikharankamesh@gmail.com"; 
const SUPER_ADMIN_NAME = "Srikharan";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await User.findOneAndUpdate(
    { email: SUPER_ADMIN_EMAIL },
    { name: SUPER_ADMIN_NAME, email: SUPER_ADMIN_EMAIL, role: "super_admin" },
    { upsert: true, new: true }
  );

  console.log("Super admin seeded:", result);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});