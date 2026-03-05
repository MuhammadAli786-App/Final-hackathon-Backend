import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    age: { type: Number, required: true },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    contact: { type: String, required: true },

    address: { type: String },

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    documents: [
      {
        url: String,
        fileName: String,
        uploadedAt: Date,
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Patient", patientSchema);
