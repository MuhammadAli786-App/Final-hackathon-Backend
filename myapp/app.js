import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js";
import { cloudinaryConfig } from "./config/cloudinary.js";
import connectDB from "./config/db.js";
import otpCleanup from "./cron/otpCleanup.js";
import cleanupUnverifiedUsers from "./cron/cleanupUnverifiedUser.js";
import patientRoutes from "./routes/patientRoute.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import diagnosisRoutes from "./routes/diagnosisRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
cloudinaryConfig();
const app = express();

// ✅ Middlewares
app.use(cors());

app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoute);

app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/diagnosis", diagnosisRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route Not Found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ✅ MongoDB Connection
connectDB();
// Start cron job
otpCleanup();
cleanupUnverifiedUsers();
// ✅ Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
