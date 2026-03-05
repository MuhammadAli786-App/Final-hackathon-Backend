// import Appointment from "../models/Appointment.js";

// const ALLOWED_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

// /**
//  * BOOK APPOINTMENT
//  * Receptionist / Admin
//  */
// export const createAppointment = async (req, res) => {
//   try {
//     // frontend uses appointmentDate and reason field names
//     const {
//       patientId,
//       doctorId,
//       appointmentDate,
//       reason,
//       status = 'pending',
//     } = req.body;

//     if (!patientId || !doctorId || !appointmentDate) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const dateObj = new Date(appointmentDate);
//     if (isNaN(dateObj.getTime())) {
//       return res.status(400).json({ message: "Invalid date" });
//     }

//     // if a patient is creating, ensure they can only book for themselves
//     if (req.user.role.toLowerCase() === 'patient' && String(req.user._id) !== String(patientId)) {
//       return res.status(403).json({ message: 'Patients can only schedule their own appointments' });
//     }

//     const appointment = await Appointment.create({
//       patientId,
//       doctorId,
//       date: dateObj,
//       notes: reason,
//       status,
//     });

//     res.status(201).json(appointment);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * GET APPOINTMENTS
//  * Role-based filtering
//  */
// export const getAppointments = async (req, res) => {
//   try {
//     const { patientId, doctorId, status } = req.query;
//     let filter = {};

//     if (status) filter.status = status;
//     if (patientId) filter.patientId = patientId;
//     if (doctorId) filter.doctorId = doctorId;

//     // enforce role-based visibility
//     const role = (req.user.role || "").toLowerCase();
//     if (role === "doctor") {
//       filter.doctorId = req.user._id;
//     }

//     if (role === "patient") {
//       if (!patientId) {
//         return res.status(400).json({ message: "patientId query param is required for patient role" });
//       }
//       // ensure the patientId requested matches provided one (can't view others)
//       // (linking between user and patient record is required for better UX)
//     }

//     const appointments = await Appointment.find(filter)
//       .populate("patientId", "name age gender")
//       .populate("doctorId", "name email")
//       .sort({ date: 1 });

//     res.json(appointments);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * GET SINGLE APPOINTMENT
//  */
// export const getAppointmentById = async (req, res) => {
//   try {
//     const appointment = await Appointment.findById(req.params.id)
//       .populate("patientId", "name age gender")
//       .populate("doctorId", "name email");
    
//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }
    
//     res.json(appointment);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * UPDATE APPOINTMENT DETAILS
//  */
// export const updateAppointment = async (req, res) => {
//   try {
//     const {
//       patientId,
//       doctorId,
//       appointmentDate,
//       reason,
//     } = req.body;

//     const appointment = await Appointment.findById(req.params.id);
//     if (!appointment) return res.status(404).json({ message: "Appointment not found" });

//     // Update fields if provided
//     if (patientId) appointment.patientId = patientId;
//     if (doctorId) appointment.doctorId = doctorId;
//     if (appointmentDate) {
//       const dateObj = new Date(appointmentDate);
//       if (isNaN(dateObj.getTime())) {
//         return res.status(400).json({ message: "Invalid date" });
//       }
//       appointment.date = dateObj;
//     }
//     if (reason !== undefined) appointment.notes = reason;

//     const updated = await Appointment.findByIdAndUpdate(
//       req.params.id,
//       {
//         patientId: appointment.patientId,
//         doctorId: appointment.doctorId,
//         date: appointment.date,
//         notes: appointment.notes
//       },
//       { new: true }
//     )
//       .populate("patientId", "name age gender")
//       .populate("doctorId", "name email");

//     res.json(updated);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * UPDATE STATUS
//  */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("patientId", "name age gender")
      .populate("doctorId", "name email");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// /**
//  * DELETE APPOINTMENT
//  */
// export const deleteAppointment = async (req, res) => {
//   try {
//     const appointment = await Appointment.findById(req.params.id);
//     if (!appointment) return res.status(404).json({ message: "Appointment not found" });

//     await appointment.deleteOne();
//     res.json({ message: "Appointment deleted" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


import Appointment from "../models/Appointment.js";

const ALLOWED_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

/**
 * CREATE APPOINTMENT
 */
export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason, status = 'pending' } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (req.user.role.toLowerCase() === 'patient' && String(req.user._id) !== String(patientId)) {
      return res.status(403).json({ message: 'Patients can only schedule their own appointments' });
    }

    const dateObj = new Date(appointmentDate);
    if (isNaN(dateObj.getTime())) return res.status(400).json({ message: "Invalid date" });

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: dateObj,
      notes: reason,
      status,
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET APPOINTMENTS
 */
export const getAppointments = async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (patientId && patientId !== 'undefined') filter.patientId = patientId;
    if (doctorId && doctorId !== 'undefined') filter.doctorId = doctorId;

    const role = (req.user.role || "").toLowerCase();
    if (role === "doctor") filter.doctorId = req.user._id;
    if (role === "patient" && !patientId) return res.status(400).json({ message: "patientId query required for patient" });

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name age gender")
      .populate("doctorId", "name email")
      .sort({ date: 1 })
      .lean();

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET SINGLE APPOINTMENT
 */
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name age gender")
      .populate("doctorId", "name email")
      .lean();

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE APPOINTMENT
 */
export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const { patientId, doctorId, appointmentDate, reason } = req.body;

    if (patientId) appointment.patientId = patientId;
    if (doctorId) appointment.doctorId = doctorId;
    if (appointmentDate) {
      const dateObj = new Date(appointmentDate);
      if (isNaN(dateObj.getTime())) return res.status(400).json({ message: "Invalid date" });
      appointment.date = dateObj;
    }
    if (reason !== undefined) appointment.notes = reason;

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: appointment.date,
        notes: appointment.notes
      },
      { new: true }
    )
      .populate("patientId", "name age gender")
      .populate("doctorId", "name email")
      .lean();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE APPOINTMENT
 */
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await appointment.deleteOne();
    res.json({ message: "Appointment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};