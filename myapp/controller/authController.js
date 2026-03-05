import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { uuid } from "uuidv4";
import userSchema from "../models/userSchema.js";
import otpModel from "../models/otpSchema.js";
import { sendEmail } from "../services/emailService.js";

// Signup Controller
export const signupHandlerController = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.json({ message: "Missing required fields", status: false });

    // Check if user exists
    const existing = await userSchema.findOne({ email });
    if (existing)
      return res.json({ message: "Email already registered", status: false });

    // Inside signupHandlerController before hashing
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
        status: false,
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    await userSchema.create({ name, email, role, password: hashed });

    // Generate OTP
    const OTP = uuid().slice(0, 6);
    await otpModel.create({ email, otp: OTP });

    // Send email using emailService
    await sendEmail({
      to: email,
      subject: "Email Verification",
      templateName: "signupEmail.html",
      variables: { name, OTP },
    });

    res.json({
      message: "User registered successfully, check email for OTP",
      status: true,
    });
  } catch (err) {
    res.json({ message: err.message || "Signup failed", status: false });
  }
};

export const loginHandlerController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Required fields
    if (!email || !password) {
      return res.json({
        message: "Email and password are required",
        status: false,
      });
    }

    // 2️⃣ User find
    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.json({
        message: "Invalid credentials",
        status: false,
      });
    }

    // 3️⃣ Email verification check
    if (!user.isVerified) {
      return res.json({
        message: "Please verify your email before login",
        status: false,
      });
    }

    // 4️⃣ Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        message: "Invalid credentials",
        status: false,
      });
    }

    // 5️⃣ Token generate
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.json({
      message: "Login successful",
      status: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        isOnTrial: user.isOnTrial,
        trialEndsAt: user.trialEndsAt,
        subscriptionEndsAt: user.subscriptionEndsAt,
      },
    });
  } catch (err) {
    return res.json({
      message: err.message || "Login failed",
      status: false,
    });
  }
};

export const verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.json({
        message: "Email and OTP are required",
        status: false,
      });
    }

    // Find latest unused OTP
    const otpRecord = await otpModel
      .findOne({ email, isUsed: false })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.json({
        message: "Invalid or expired OTP",
        status: false,
      });
    }

    // OTP expiry check (10 minutes)
    const OTP_EXPIRY_TIME = 10 * 60 * 1000;
    if (Date.now() - otpRecord.createdAt.getTime() > OTP_EXPIRY_TIME) {
      return res.json({
        message: "OTP has expired",
        status: false,
      });
    }

    // OTP match
    if (otpRecord.otp !== otp) {
      return res.json({
        message: "Invalid OTP",
        status: false,
      });
    }

    // Check user exists
    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.json({
        message: "User does not exist",
        status: false,
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Verify user
    user.isVerified = true;
    await user.save();

    return res.json({
      message: "Email verified successfully",
      status: true,
    });
  } catch (error) {
    return res.json({
      message: error.message || "Server error",
      status: false,
    });
  }
};

export const resetOTPController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        message: "Email is required",
        status: false,
      });
    }

    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.json({
        message: "User does not exist",
        status: false,
      });
    }

    if (user.isVerified) {
      return res.json({
        message: "Email is already verified",
        status: false,
      });
    }

    // Invalidate previous OTPs
    await otpModel.updateMany({ email, isUsed: false }, { isUsed: true });

    // Generate new OTP
    const OTP = uuid().slice(0, 6);

    await otpModel.create({ email, otp: OTP });

    // Send email via service
    await sendEmail({
      to: email,
      subject: "Email Verification",
      templateName: "signupEmail.html",
      variables: {
        name: user.name,
        OTP,
      },
    });

    return res.json({
      message: "OTP has been resent successfully",
      status: true,
    });
  } catch (error) {
    return res.json({
      message: error.message || "Something went wrong",
      status: false,
    });
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        message: "Email is required",
        status: false,
      });
    }

    const user = await userSchema.findOne({ email });
    if (!user) {
      return res.json({
        message: "User does not exist",
        status: false,
      });
    }

    if (!user.isVerified) {
      return res.json({
        message: "Please verify your email first",
        status: false,
      });
    }

    // Create reset token
    const token = jwt.sign({ _id: user._id, email }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    // Send email via service
    await sendEmail({
      to: email,
      subject: "Reset Your Password",
      templateName: "forgotPassword.html",
      variables: {
        name: user.name,
        resetLink: `${process.env.FRONTEND_URL}change-password?q=${token}`,
      },
    });

    return res.json({
      message: "Password reset link has been sent to your email",
      status: true,
    });
  } catch (error) {
    return res.json({
      message: error.message || "Something went wrong",
      status: false,
    });
  }
};
export const changePasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.json({
        message: "Token and new password are required",
        status: false,
      });
    }

    // Strong password check
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
        status: false,
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.json({
        message: "Token expired or invalid",
        status: false,
      });
    }

    const user = await userSchema.findById(decoded._id);
    if (!user) {
      return res.json({
        message: "User not found",
        status: false,
      });
    }

    // Prevent same password reuse
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.json({
        message: "New password must be different from old password",
        status: false,
      });
    }

    // Hash and update
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    await user.save();

    return res.json({
      message: "Password changed successfully",
      status: true,
    });
  } catch (error) {
    return res.json({
      message: error.message || "Something went wrong",
      status: false,
    });
  }
};
