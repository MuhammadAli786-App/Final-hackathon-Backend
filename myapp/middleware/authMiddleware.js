import jwt from "jsonwebtoken";
import userSchema from "../models/userSchema.js";

const checkAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing or invalid",
        status: false,
      });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userSchema.findById(decoded._id).select("-password");
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
        status: false,
      });
    }

    if (!user) {
      return res.status(401).json({ message: "User not found", status: false });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired token", status: false });
  }
};

export const roleMiddleware = (...roles) => (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions", status: false });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const allowed = roles.map((r) => String(r).toLowerCase());

    if (allowed.length === 0 || !allowed.includes(userRole)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions", status: false });
    }

    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Role check failed", status: false });
  }
};

export default checkAuth;
