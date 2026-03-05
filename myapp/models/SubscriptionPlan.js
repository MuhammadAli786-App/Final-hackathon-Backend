import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  displayName: {
    type: String,
    enum: ['Free', 'Pro', 'Enterprise'],
    default: 'Free'
  },
  price: {
    type: Number,
    default: 0 // Monthly price in USD
  },
  description: String,
  features: {
    patientManagement: { type: Boolean, default: true },
    appointmentScheduling: { type: Boolean, default: true },
    prescriptionCreation: { type: Boolean, default: false },
    aiSymptomChecker: { type: Boolean, default: false },
    prescriptionExplanation: { type: Boolean, default: false },
    analyticsAccess: { type: Boolean, default: false },
    documentUpload: { type: Boolean, default: false },
    maxPatients: { type: Number, default: 10 },
    maxDoctors: { type: Number, default: 1 },
    aiCreditsPerMonth: { type: Number, default: 0 },
    supportTier: {
      type: String,
      enum: ['email', 'priority', 'dedicated'],
      default: 'email'
    }
  },
  limits: {
    appointmentsPerMonth: { type: Number, default: 50 },
    prescriptionsPerMonth: { type: Number, default: 0 },
    storageGB: { type: Number, default: 1 }
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionSchema)
