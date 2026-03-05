import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: String,
  dosage: String,
  duration: String,
});

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    medicines: [medicineSchema],

    instructions: String,

    aiExplanation: String,
    pdfUrl: {
      type: String,
    },
    attachments: [
      {
        url: String,
        fileName: String,
        uploadedAt: Date,
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Prescription", prescriptionSchema);
