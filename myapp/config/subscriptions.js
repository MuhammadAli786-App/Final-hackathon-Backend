// Subscription plans and pricing
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'free',
    displayName: 'Free',
    price: 0,
    billingCycle: 'monthly',
    features: {
      patients: 5,
      appointments: 10,
      prescriptions: 5,
      aiSymptomChecker: true,
      basicAnalytics: true,
      fileStorage: 100, // MB
      documentsPerPatient: 2,
      supportLevel: 'email',
    }
  },
  PRO: {
    name: 'pro',
    displayName: 'Pro',
    price: 999, // PKR 999/month
    billingCycle: 'monthly',
    features: {
      patients: 100,
      appointments: 500,
      prescriptions: 250,
      aiSymptomChecker: true,
      aiPrescriptionExplanation: true,
      advancedAnalytics: true,
      fileStorage: 5000, // MB
      documentsPerPatient: 50,
      supportLevel: 'priority',
      customBranding: true,
      API_access: true,
      bulkImport: true,
    }
  },
  ENTERPRISE: {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 'custom',
    billingCycle: 'annual',
    features: {
      patients: 'unlimited',
      appointments: 'unlimited',
      prescriptions: 'unlimited',
      aiSymptomChecker: true,
      aiPrescriptionExplanation: true,
      advancedAnalytics: true,
      fileStorage: 'unlimited', // MB
      documentsPerPatient: 'unlimited',
      supportLevel: 'dedicated',
      customBranding: true,
      API_access: true,
      bulkImport: true,
      ssoIntegration: true,
      advancedReports: true,
      dataExport: true,
    }
  }
}

// Feature access matrix
export const FEATURE_FLAGS = {
  // Patient Management
  PATIENT_CRUD: ['free', 'pro', 'enterprise'],
  PATIENT_DOCUMENTS: ['pro', 'enterprise'],
  BULK_PATIENT_IMPORT: ['pro', 'enterprise'],
  
  // Appointments
  APPOINTMENT_BOOKING: ['free', 'pro', 'enterprise'],
  APPOINTMENT_REMINDERS: ['pro', 'enterprise'],
  BULK_APPOINTMENT_SCHEDULING: ['pro', 'enterprise'],
  
  // Prescriptions
  PRESCRIPTION_CREATION: ['free', 'pro', 'enterprise'],
  PRESCRIPTION_PDF: ['free', 'pro', 'enterprise'],
  AI_PRESCRIPTION_EXPLANATION: ['pro', 'enterprise'],
  PRESCRIPTION_TEMPLATES: ['pro', 'enterprise'],
  
  // AI Features
  AI_SYMPTOM_CHECKER: ['free', 'pro', 'enterprise'],
  AI_DIAGNOSIS_ANALYSIS: ['pro', 'enterprise'],
  
  // Analytics
  BASIC_ANALYTICS: ['free', 'pro', 'enterprise'],
  ADVANCED_ANALYTICS: ['pro', 'enterprise'],
  CUSTOM_REPORTS: ['enterprise'],
  DATA_EXPORT: ['enterprise'],
  
  // File Management
  FILE_UPLOADS: ['free', 'pro', 'enterprise'],
  
  // API & Integration
  API_ACCESS: ['pro', 'enterprise'],
  SSO_INTEGRATION: ['enterprise'],
  
  // Support
  PRIORITY_SUPPORT: ['pro', 'enterprise'],
  DEDICATED_SUPPORT: ['enterprise'],
}

// Trial information
export const TRIAL_CONFIG = {
  DURATION_DAYS: 14,
  AUTO_CONVERSION_PLAN: 'free', // Auto-convert to free after trial
  SHOW_UPGRADE_PROMPT_DAYS: 3, // Show prompt 3 days before trial ends
}

// Friendly-to-plan-key map (used by frontend/tests and middleware)
export const FEATURE_KEY_MAP = {
  // Friendly name : plan.features key
  prescriptionCreation: 'prescriptions',
  analyticsAccess: 'basicAnalytics',
  patientManagement: 'patients',
  appointmentScheduling: 'appointments',
  aiSymptomChecker: 'aiSymptomChecker',
  aiPrescriptionExplanation: 'aiPrescriptionExplanation',
  // add more mappings as needed
}

// Helper function to convert flag names (e.g. PRESCRIPTION_CREATION) into
// friendly camelCase keys (prescriptionCreation) for UI/tests.
export const flagToFriendly = (flagName) => {
  return flagName
    .toLowerCase()
    .split('_')
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('')
}

// Helper function to check if user has access to feature using FEATURE_FLAGS
export const hasFeatureAccess = (userPlan, featureName) => {
  // first try direct flag lookup using either friendly or raw name
  let allowedPlans = FEATURE_FLAGS[featureName]
  if (!allowedPlans) {
    // maybe featureName is friendly, convert back to raw
    const raw = Object.keys(FEATURE_FLAGS).find(f => flagToFriendly(f) === featureName)
    if (raw) allowedPlans = FEATURE_FLAGS[raw]
  }
  if (allowedPlans) {
    return allowedPlans.includes(userPlan)
  }
  // else map to a plan.features key
  const key = FEATURE_KEY_MAP[featureName] || featureName
  const plan = getPlanDetails(userPlan)
  return plan.features && plan.features[key] !== undefined
}

// Helper to translate friendly name to plan feature key
export const mapToPlanKey = (featureName) => {
  return FEATURE_KEY_MAP[featureName] || featureName
}

// Generate a boolean flags matrix for a given plan name (friendly keys)
export const getFlagsForPlan = (planName) => {
  const normalized = (planName || 'free').toLowerCase()
  const plan = getPlanDetails(normalized)
  const flags = {}

  // 1) Flags derived from FEATURE_FLAGS (enum-style)
  for (const [raw, allowedPlans] of Object.entries(FEATURE_FLAGS)) {
    const friendly = flagToFriendly(raw)
    flags[friendly] = allowedPlans.includes(plan.name)
  }

  // 2) Flags derived from plan.features using FEATURE_KEY_MAP (friendly -> plan key)
  for (const [friendly, key] of Object.entries(FEATURE_KEY_MAP)) {
    if (flags[friendly] === undefined) {
      const val = plan.features && plan.features[key]
      flags[friendly] = Boolean(
        val === true ||
        val === 'unlimited' ||
        (typeof val === 'number' && val > 0)
      )
    }
  }

  // 3) Also expose raw plan feature keys as booleans (if not conflicting)
  if (plan.features) {
    for (const [k, v] of Object.entries(plan.features)) {
      if (flags[k] === undefined) {
        flags[k] = Boolean(v === true || v === 'unlimited' || (typeof v === 'number' && v > 0))
      }
    }
  }

  return flags
}

// Helper to get plan details
export const getPlanDetails = (planName) => {
  const normalized = planName.toLowerCase()
  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.name === normalized) {
      return plan
    }
  }
  return SUBSCRIPTION_PLANS.FREE
}

// Helper to check if trial is active
export const isTrialActive = (user) => {
  if (!user.isOnTrial) return false
  if (!user.trialEndsAt) return false
  return new Date() < new Date(user.trialEndsAt)
}

// Helper to check if trial is ending soon
export const isTrialEndingSoon = (user) => {
  if (!isTrialActive(user)) return false
  const daysUntilEnd = Math.ceil((new Date(user.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
  return daysUntilEnd <= TRIAL_CONFIG.SHOW_UPGRADE_PROMPT_DAYS
}

// Helper to get subscription status
export const getSubscriptionStatus = (user) => {
  if (isTrialActive(user)) {
    const daysLeft = Math.ceil((new Date(user.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
    return {
      status: 'trial',
      daysLeft,
      isEndingSoon: isTrialEndingSoon(user),
      plan: 'trial'
    }
  }

  if (user.subscriptionEndsAt && new Date() > new Date(user.subscriptionEndsAt)) {
    return {
      status: 'expired',
      expiredAt: user.subscriptionEndsAt,
      plan: user.subscriptionPlan
    }
  }

  if (user.subscriptionPlan === 'free') {
    return {
      status: 'active',
      type: 'free',
      plan: 'free'
    }
  }

  return {
    status: 'active',
    type: 'paid',
    plan: user.subscriptionPlan,
    expiresAt: user.subscriptionEndsAt
  }
}

export default {
  SUBSCRIPTION_PLANS,
  FEATURE_FLAGS,
  TRIAL_CONFIG,
  hasFeatureAccess,
  getPlanDetails,
  isTrialActive,
  isTrialEndingSoon,
  getSubscriptionStatus,
  getFlagsForPlan,
  FEATURE_KEY_MAP,
  flagToFriendly,
  mapToPlanKey
}


