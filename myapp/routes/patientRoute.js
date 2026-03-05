// backend/routes/appointmentRoutes.js
import express from "express";
import checkAuth, { roleMiddleware } from "../middleware/authMiddleware.js";
import { safeFeatureMiddleware } from "../middleware/safeFeatureMiddleware.js";

import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} from "../controller/appointmentController.js";

const router = express.Router();

// CREATE APPOINTMENT
router.post(
  "/",
  checkAuth,
  safeFeatureMiddleware("appointmentScheduling"),
  createAppointment
);

// GET ALL APPOINTMENTS
router.get(
  "/",
  checkAuth,
  roleMiddleware("admin", "doctor", "receptionist", "patient"),
  getAppointments
);

// GET SINGLE APPOINTMENT
router.get(
  "/:id",
  checkAuth,
  roleMiddleware("admin", "doctor", "receptionist", "patient"),
  getAppointmentById
);

// UPDATE APPOINTMENT
router.put(
  "/:id",
  checkAuth,
  safeFeatureMiddleware("appointmentScheduling"),
  roleMiddleware("admin", "doctor"),
  updateAppointment
);

// UPDATE APPOINTMENT STATUS
router.patch(
  "/:id/status",
  checkAuth,
  safeFeatureMiddleware("appointmentScheduling"),
  roleMiddleware("admin", "doctor"),
  updateAppointmentStatus
);

// DELETE APPOINTMENT
router.delete(
  "/:id",
  checkAuth,
  safeFeatureMiddleware("appointmentScheduling"),
  roleMiddleware("admin", "doctor"),
  deleteAppointment
);

export default router;