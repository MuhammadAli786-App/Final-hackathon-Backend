import userModel from '../models/userSchema.js'
import { getFlagsForPlan, mapToPlanKey } from '../config/subscriptions.js'

/**
 * Feature Flags Middleware
 * Checks if user has access to a specific feature based on subscription plan
 * 
 * Usage: router.post('/diagnose', featureFlagMiddleware('aiSymptomChecker'), controller)
 */
export const featureFlagMiddleware = (requiredFeature) => {
  return async (req, res, next) => {
    try {
      const user = req.user
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' })
      }

      const fullUser = await userModel.findById(user._id)
      
      // Check if user is on trial (all features enabled)
      const isOnTrialActive = fullUser.isOnTrial && new Date(fullUser.trialEndsAt) > Date.now()
      // Check if paid subscription is active
      const isSubscriptionActive = !fullUser.subscriptionEndsAt || new Date(fullUser.subscriptionEndsAt) > Date.now()

      // Trial users have access to all features
      if (isOnTrialActive) {
        req.featureAccess = { allowed: true, reason: 'trial' }
        return next()
      }

      // Build flag set for current plan
      const planFlags = getFlagsForPlan(fullUser.subscriptionPlan)

      // If subscription is expired and user is on free plan, some flags may be false
      // but we still use planFlags for decisioning.
      const normalizedFeature = requiredFeature
      // also check mapped key in case friendly name differs
      const altFeature = mapToPlanKey(requiredFeature)
      const hasAccess = Boolean(planFlags[normalizedFeature] || planFlags[altFeature])

      if (!hasAccess) {
        return res.status(403).json({
          message: `Feature "${requiredFeature}" not available in your plan`,
          feature: requiredFeature,
          currentPlan: fullUser.subscriptionPlan,
          contact: 'support@clinic.com',
          suggestUpgrade: true
        })
      }

      // Check usage limits
      const hasExceededLimit = await checkUsageLimit(fullUser, requiredFeature)
      if (hasExceededLimit) {
        return res.status(429).json({
          message: `Monthly limit exceeded for ${requiredFeature}`,
          feature: requiredFeature,
          upgrade: true
        })
      }

      req.featureAccess = { allowed: true, reason: 'subscription' }
      next()
    } catch (error) {
      console.error('Feature flag middleware error:', error)
      res.status(500).json({ message: 'Could not verify feature access' })
    }
  }
}

/**
 * Check if user has exceeded usage limits for a feature
 */
export const checkUsageLimit = async (user, feature) => {
  const limits = {
    free: {
      appointmentsPerMonth: 50,
      prescriptionsPerMonth: 0,
      aiRequestsPerMonth: 0,
      documentsPerMonth: 0
    },
    pro: {
      appointmentsPerMonth: 5000,
      prescriptionsPerMonth: 1000,
      aiRequestsPerMonth: 1000,
      documentsPerMonth: 5000
    },
    enterprise: {
      appointmentsPerMonth: 999999,
      prescriptionsPerMonth: 999999,
      aiRequestsPerMonth: 999999,
      documentsPerMonth: 999999
    }
  }

  const userLimits = limits[user.subscriptionPlan] || limits.free

  // Check monthly reset
  const now = new Date()
  const lastReset = new Date(user.usage?.lastResetDate || user.createdAt)
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    // Need to reset
    return false // Don't block, will reset on next update
  }

  switch(feature) {
    case 'appointmentScheduling':
      return user.usage?.appointmentsThisMonth >= userLimits.appointmentsPerMonth
    case 'prescriptionCreation':
      return user.usage?.prescriptionsThisMonth >= userLimits.prescriptionsPerMonth
    case 'aiSymptomChecker':
    case 'prescriptionExplanation':
      return user.usage?.aiRequestsThisMonth >= userLimits.aiRequestsPerMonth
    case 'documentUpload':
      return user.usage?.documentsThisMonth >= userLimits.documentsPerMonth
    default:
      return false
  }
}

/**
 * Get feature flag status for a user and feature
 */
export const getFeatureFlagStatus = async (userId, featureName) => {
  try {
    const user = await userModel.findById(userId)
    if (!user) return { enabled: false, reason: 'user_not_found' }

    const isOnTrialActive = user.isOnTrial && new Date(user.trialEndsAt) > Date.now()
    const isSubscriptionActive = !user.subscriptionEndsAt || new Date(user.subscriptionEndsAt) > Date.now()

    // Trial has all features
    if (isOnTrialActive) {
      return { enabled: true, reason: 'trial', plan: user.subscriptionPlan }
    }

    // Check subscription active
    if (!isSubscriptionActive && user.subscriptionPlan === 'free') {
      return { enabled: false, reason: 'free_plan_limited', plan: 'free' }
    }

    // Check plan features via flag matrix
    const flags = getFlagsForPlan(user.subscriptionPlan)
    if (!flags[featureName] && !flags[mapToPlanKey(featureName)]) {
      return { enabled: false, reason: 'plan_limit', plan: user.subscriptionPlan }
    }

    // Check usage limits
    const exceededLimit = await checkUsageLimit(user, featureName)
    if (exceededLimit) {
      return { enabled: false, reason: 'usage_limit_exceeded', plan: user.subscriptionPlan }
    }

    return { enabled: true, reason: 'allowed', plan: user.subscriptionPlan }
  } catch (error) {
    console.error('Error checking feature flag:', error)
    return { enabled: false, reason: 'error' }
  }
}

/**
 * Check if user can access analytics (admin only + pro/enterprise)
 */
export const canAccessAnalytics = async (userId, userRole) => {
  if (userRole !== 'admin' && userRole !== 'doctor') {
    return false
  }

  const user = await userModel.findById(userId)
  return user.subscriptionPlan === 'pro' || user.subscriptionPlan === 'enterprise'
}

/**
 * Check if user can use AI features
 */
export const canUseAIFeatures = async (userId) => {
  const user = await userModel.findById(userId)
  
  const isOnTrialActive = user.isOnTrial && new Date(user.trialEndsAt) > Date.now()
  const isPro = user.subscriptionPlan === 'pro'
  const isEnterprise = user.subscriptionPlan === 'enterprise'

  return isOnTrialActive || isPro || isEnterprise
}

/**
 * Track feature usage
 */
export const trackFeatureUsage = async (userId, feature) => {
  try {
    const user = await userModel.findById(userId)
    if (!user) return

    const now = new Date()
    const lastReset = new Date(user.usage?.lastResetDate || user.createdAt)
    
    // Reset monthly usage if month changed
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      user.usage = {
        appointmentsThisMonth: 0,
        prescriptionsThisMonth: 0,
        aiRequestsThisMonth: 0,
        documentsThisMonth: 0,
        lastResetDate: now
      }
    }

    // Increment counter
    switch(feature) {
      case 'appointmentScheduling':
        user.usage.appointmentsThisMonth += 1
        break
      case 'prescriptionCreation':
        user.usage.prescriptionsThisMonth += 1
        break
      case 'aiSymptomChecker':
      case 'prescriptionExplanation':
        user.usage.aiRequestsThisMonth += 1
        break
      case 'documentUpload':
        user.usage.documentsThisMonth = (user.usage.documentsThisMonth || 0) + 1
        break
    }

    await user.save()
  } catch (error) {
    console.error('Error tracking feature usage:', error)
  }
}
