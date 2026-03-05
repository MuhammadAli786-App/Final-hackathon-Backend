import express from "express";

import {
  changePasswordController,
  forgotPasswordController,
  loginHandlerController,
  resetOTPController,
  signupHandlerController,
  verifyOTPController,
} from "../controller/authController.js";

const authRoute = express.Router();

// Signup
authRoute.post("/signup", signupHandlerController);

// Login
authRoute.post("/login", loginHandlerController);
// otp
authRoute.post("/verify-otp", verifyOTPController);
authRoute.post("/reset-otp", resetOTPController);
authRoute.post("/forgot-password", forgotPasswordController);
authRoute.post("/change-password", changePasswordController);

export default authRoute;
