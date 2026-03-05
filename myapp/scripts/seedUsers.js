import dotenv from "dotenv";
import connectDB from "../config/db.js";
import bcrypt from "bcryptjs";
import userModel from "../models/userSchema.js";

dotenv.config();

const users = [
  { name: "Seed Admin", email: "admin@clinic.com", role: "admin", password: "Admin@123" },
  { name: "Seed Doctor", email: "doctor@clinic.com", role: "doctor", password: "Doctor@123" },
  { name: "Seed Receptionist", email: "receptionist@clinic.com", role: "receptionist", password: "Receptionist@123" },
  { name: "Seed Patient", email: "patient@clinic.com", role: "patient", password: "Patient@123" },
];

const run = async () => {
  try {
    await connectDB();

    for (const u of users) {
      let existing = await userModel.findOne({ email: u.email });
      const hashed = await bcrypt.hash(u.password, 10);
      if (existing) {
        // update password to known value and ensure verified
        existing.password = hashed;
        existing.isVerified = true;
        await existing.save();
        console.log(`Updated existing user password: ${u.email}`);
      } else {
        const newUser = await userModel.create({
          name: u.name,
          email: u.email,
          password: hashed,
          role: u.role,
          isVerified: true,
          subscriptionPlan: 'free',
          isOnTrial: true,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        });
        existing = newUser;
        console.log(`Created user: ${newUser.email} (${u.role})`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();