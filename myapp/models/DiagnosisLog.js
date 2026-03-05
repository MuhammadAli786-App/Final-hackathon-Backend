import mongoose from "mongoose";

const diagnosisLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    symptoms: String,

    aiResponse: String,

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
    },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("DiagnosisLog", diagnosisLogSchema);
