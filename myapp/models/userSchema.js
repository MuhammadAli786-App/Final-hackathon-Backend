import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["patient", "admin", "doctor", "receptionist"],
      default: "patient",
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
    isOnTrial: {
      type: Boolean,
      default: true,
    },
    paymentMethod: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Usage tracking for subscription limits
    usage: {
      appointmentsThisMonth: { type: Number, default: 0 },
      prescriptionsThisMonth: { type: Number, default: 0 },
      aiRequestsThisMonth: { type: Number, default: 0 },
      storageUsedGB: { type: Number, default: 0 },
      lastResetDate: { type: Date, default: Date.now }
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false, // __v remove kar dega
  },
);

const userModel = mongoose.model("User", userSchema);
export default userModel;
