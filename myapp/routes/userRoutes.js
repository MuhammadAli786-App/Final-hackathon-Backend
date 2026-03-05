import express from "express";
import checkAuth, { roleMiddleware } from "../middleware/authMiddleware.js";
import userSchema from "../models/userSchema.js";
import {
  createUser,
  getSingleUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from "../controller/userController.js";

const router = express.Router();

// GET ALL USERS (with optional role filter)
// GET /api/users?role=doctor
router.get("/", checkAuth, roleMiddleware("admin", "receptionist", "doctor", "patient"), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    const users = await userSchema.find(filter).select("_id name email role isActive createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE USER (Admin only - for creating doctors/receptionists)
router.post("/", checkAuth, roleMiddleware("admin"), createUser);

// GET SINGLE USER
router.get("/:id", checkAuth, roleMiddleware("admin", "doctor", "receptionist"), getSingleUser);

// UPDATE USER (Admin only)
router.put("/:id", checkAuth, roleMiddleware("admin"), updateUser);

// DELETE USER (Admin only)
router.delete("/:id", checkAuth, roleMiddleware("admin"), deleteUser);

// TOGGLE USER STATUS (Activate/Deactivate) (Admin only)
router.patch("/:id/status", checkAuth, roleMiddleware("admin"), toggleUserStatus);

export default router;