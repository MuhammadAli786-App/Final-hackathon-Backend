import cron from "node-cron";
import User from "../models/userSchema.js";

const cleanupUnverifiedUsers = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000
      );

      const result = await User.deleteMany({
        isVerified: false,
        createdAt: { $lt: twoHoursAgo },
      });

      if (result.deletedCount > 0) {
        console.log(
          `🧹 ${result.deletedCount} unverified users deleted`
        );
      }
    } catch (error) {
      console.error("❌ Cleanup cron error:", error.message);
    }
  });
};

export default cleanupUnverifiedUsers;
