import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import DiagnosisLog from "../models/DiagnosisLog.js";
import User from "../models/userSchema.js";

// Helpers
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const adminStats = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await User.countDocuments({ role: "doctor" });

    // appointments per month for last year
    const now = new Date();
    const aYearAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
    const monthlyAppointments = await Appointment.aggregate([
      { $match: { date: { $gte: aYearAgo } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // revenue simulated as appointments * 100
    const revenue = monthlyAppointments.reduce((sum, m) => sum + m.count * 100, 0);

    // most common diagnosis condition (parse JSON stored in aiResponse)
    const logs = await DiagnosisLog.find().select("aiResponse");
    const freq = {};
    logs.forEach((l) => {
      try {
        const obj = JSON.parse(l.aiResponse);
        if (obj.conditions && Array.isArray(obj.conditions)) {
          obj.conditions.forEach((c) => { freq[c] = (freq[c] || 0) + 1; });
        }
      } catch {};
    });
    const mostCommon = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-";

    res.json({ totalPatients, totalDoctors, monthlyAppointments, revenue, mostCommon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const doctorStats = async (req, res) => {
  try {
    const docId = req.user._id;
    const today = startOfDay(new Date());
    const startMonth = startOfMonth(new Date());

    const dailyAppointments = await Appointment.countDocuments({ doctorId: docId, date: { $gte: today } });
    const monthlyAppointments = await Appointment.countDocuments({ doctorId: docId, date: { $gte: startMonth } });
    const prescriptionCount = await Prescription.countDocuments({ doctorId: docId });

    res.json({ dailyAppointments, monthlyAppointments, prescriptionCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
