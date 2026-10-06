require("dotenv").config();
const mongoose = require("mongoose");
const Plan = require("../models/Plan");

const PLANS = [
  { planId: "standard-p4p", name: "Standard-p4p", description: "Professional photography delivery tools for your business.", price: 300, features: ["Create Events from enquiries", "Manage Users in your studio", "Review new users", "View Dashboard analytics"] },
  { planId: "starter-p4p", name: "Starter-p4p", description: "Professional photography delivery tools for your business.", price: 499, features: ["Up to 2 team members", "10 GB storage", "5 active events", "Email support"] },
  { planId: "pro-p4p", name: "Pro-p4p", description: "Advanced tools for growing studios.", price: 999, highlighted: true, recommended: true, features: ["Up to 5 team members", "50 GB storage", "20 active events", "Priority support"] },
  { planId: "business-p4p", name: "Business-p4p", description: "For studios managing multiple photographers.", price: 1499, features: ["Up to 10 team members", "200 GB storage", "Unlimited events", "Priority support"] },
  { planId: "elite-p4p", name: "Elite-p4p", description: "Premium tools with client-facing galleries.", price: 1999, features: ["Up to 15 team members", "500 GB storage", "Unlimited events", "Client gallery branding"] },
  { planId: "studio-p4p", name: "Studio-p4p", description: "Full studio suite with automation.", price: 2499, features: ["Up to 25 team members", "1 TB storage", "Unlimited events", "Workflow automation"] },
  { planId: "agency-p4p", name: "Agency-p4p", description: "Multi-brand support for photography agencies.", price: 3499, features: ["Unlimited team members", "5 TB storage", "Unlimited events", "Dedicated account manager"] },
];

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);

    for (let i = 0; i < PLANS.length; i++) {
      await Plan.updateOne(
        { planId: PLANS[i].planId },
        { $set: { ...PLANS[i], billingCycle: "monthly", sortOrder: i, active: true } },
        { upsert: true }
      );
    }
    console.log(`Seeded ${PLANS.length} subscription plans into "${mongoose.connection.name}"`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
})();