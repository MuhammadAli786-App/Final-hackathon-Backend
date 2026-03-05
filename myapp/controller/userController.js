import userSchema from "../models/userSchema.js";
import bcrypt from "bcryptjs";

// CREATE USER (Doctor/Receptionist by Admin)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role is doctor or receptionist
    if (!["doctor", "receptionist"].includes(role)) {
      return res.status(400).json({ message: "Role must be doctor or receptionist" });
    }

    // Check if user already exists
    const existing = await userSchema.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await userSchema.create({
      name,
      email,
      password: hashed,
      role,
      isActive: true
    });

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE USER
export const getSingleUser = async (req, res) => {
  try {
    const user = await userSchema.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER (Admin can update doctor/receptionist details)
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const userId = req.params.id;

    // Find user
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to change email to an existing one
    if (email && email !== user.email) {
      const existing = await userSchema.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER (Admin can delete doctor/receptionist)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find and delete user
    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting last admin account (optional safety check)
    if (user.role === "admin") {
      const adminCount = await userSchema.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete the last admin account" });
      }
    }

    await userSchema.deleteOne({ _id: userId });

    res.json({
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ACTIVATE/DEACTIVATE USER (Toggle isActive status)
export const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    const user = await userSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
