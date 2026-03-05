import express from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
} from "../controller/appointmentController.js";

import checkAuth, { roleMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Book appointment
router.post(
  "/",
  checkAuth,
  // doctors may schedule appointments for their patients as well
  roleMiddleware("admin", "receptionist", "patient", "doctor"),
  createAppointment
);

// Get appointments
router.get(
  "/",
  checkAuth,
  roleMiddleware("admin", "receptionist", "doctor", "patient"),
  getAppointments
);

// Get single appointment
router.get(
  "/:id",
  checkAuth,
  roleMiddleware("admin", "receptionist", "doctor", "patient"),
  getAppointmentById
);

// Update appointment details
router.put(
  "/:id",
  checkAuth,
  // doctors should be able to modify appointment info (reschedule etc.)
  roleMiddleware("admin", "receptionist", "doctor"),
  updateAppointment
);

// Update status
router.put(
  "/:id/status",
  checkAuth,
  roleMiddleware("admin", "receptionist", "doctor"),
  updateAppointmentStatus
);

// Delete
router.delete(
  "/:id",
  checkAuth,
  // allow doctors to delete/cancel appointments if needed
  roleMiddleware("admin", "receptionist", "doctor"),
  deleteAppointment
);

export default router;
