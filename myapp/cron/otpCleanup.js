import cron from "node-cron";
import OTP from "../models/otpSchema.js";

const otpCleanup = () => {
  // Run every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    const expiry = new Date(Date.now() - 10 * 60 * 1000); // OTP older than 10 mins
    const result = await OTP.deleteMany({ createdAt: { $lt: expiry } });
    console.log(`Cron Job: Deleted ${result.deletedCount} expired OTPs`);
  });
};

export default otpCleanup;
