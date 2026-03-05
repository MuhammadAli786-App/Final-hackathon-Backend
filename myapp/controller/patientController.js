// import Patient from "../models/Patient.js";

// /**
//  * CREATE PATIENT
//  * Receptionist / Admin only
//  */
// export const createPatient = async (req, res) => {
//   try {
//     const { name, age, gender, contact, address } = req.body;

//     if (!name || !age || !gender || !contact) {
//       return res.status(400).json({ message: "All required fields must be filled" });
//     }

//     const patient = await Patient.create({
//       name,
//       age,
//       gender,
//       contact,
//       address, // now stored in schema
//       createdBy: req.user._id,
//     });

//     res.status(201).json(patient);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * GET ALL PATIENTS
//  * Admin / Receptionist see all
//  * Doctor sees all (optional filter later)
//  */
// export const getAllPatients = async (req, res) => {
//   try {
//     const patients = await Patient.find().sort({ createdAt: -1 });
//     res.json(patients);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * GET SINGLE PATIENT
//  */
// export const getSinglePatient = async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     res.json(patient);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * UPDATE PATIENT
//  * Receptionist / Admin only
//  */
// export const updatePatient = async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const updatedPatient = await Patient.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );

//     res.json(updatedPatient);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /**
//  * DELETE PATIENT
//  * Admin only
//  */
// export const deletePatient = async (req, res) => {
//   try {
//     const patient = await Patient.findById(req.params.id);

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     await patient.deleteOne();

//     res.json({ message: "Patient deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

import Patient from "../models/Patient.js";

/**
 * CREATE PATIENT
 */
export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, contact, address } = req.body;
    if (!name || !age || !gender || !contact) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      contact,
      address,
      createdBy: req.user._id,
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET ALL PATIENTS
 */
// export const getAllPatients = async (req, res) => {
//   try {
//     const patients = await Patient.find().sort({ createdAt: -1 }).lean();
//     res.json(patients);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * GET SINGLE PATIENT
 */
export const getSinglePatient = async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ message: "Patient ID missing" });

    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE PATIENT
 */
export const updatePatient = async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ message: "Patient ID missing" });

    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE PATIENT
 */
export const deletePatient = async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ message: "Patient ID missing" });

    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    await patient.deleteOne();
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};