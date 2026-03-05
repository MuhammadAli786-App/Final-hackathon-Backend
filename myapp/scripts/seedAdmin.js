import dotenv from "dotenv";
import connectDB from "../config/db.js";
import bcrypt from "bcryptjs";
import userModel from "../models/userSchema.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();

    const email = process.env.SEED_ADMIN_EMAIL || "admin@clinic.com";
    const existing = await userModel.findOne({ email });
    if (existing) {
      console.log("Admin user already exists:", email);
      process.exit(0);
    }

    const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
    const hashed = await bcrypt.hash(password, 10);

    const admin = await userModel.create({
      name: "Seed Admin",
      email,
      password: hashed,
      role: "admin",
      isVerified: true,
    });

    console.log("Created admin:", admin.email);
    console.log("Password:", password);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
