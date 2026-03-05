import { FEATURE_FLAGS, hasFeatureAccess, isTrialActive, isTrialEndingSoon } from '../config/subscriptions.js'

// Middleware to check if user has access to a specific feature
export const featureMiddleware = (featureName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const userPlan = req.user.subscriptionPlan || 'free'
    
    // Check if user has feature access
    if (!hasFeatureAccess(userPlan, featureName)) {
      return res.status(403).json({
        message: `This feature is not available in your plan (${userPlan})`,
        requiredPlan: 'pro',
        currentPlan: userPlan,
        feature: featureName,
        upgradeUrl: '/api/subscriptions/upgrade'
      })
    }

    // Add subscription info to request
    req.featureAccess = {
      hasAccess: true,
      feature: featureName,
      plan: userPlan,
      trialActive: isTrialActive(req.user),
      trialEndingSoon: isTrialEndingSoon(req.user)
    }

    next()
  }
}

// Middleware to check feature with graceful fallback (log but allow)
export const featureMiddlewareLog = (featureName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const userPlan = req.user.subscriptionPlan || 'free'
    const hasAccess = hasFeatureAccess(userPlan, featureName)

    // Log feature access attempt
    console.log(`[Feature Access] User: ${req.user.email}, Feature: ${featureName}, Plan: ${userPlan}, Allowed: ${hasAccess}`)

    // Add info to request regardless of access
    req.featureAccess = {
      hasAccess,
      feature: featureName,
      plan: userPlan,
      trialActive: isTrialActive(req.user),
      trialEndingSoon: isTrialEndingSoon(req.user)
    }

    next()
  }
}

// Middleware to attach subscription info to response
export const subscriptionInfoMiddleware = (req, res, next) => {
  if (req.user) {
    req.subscriptionInfo = {
      plan: req.user.subscriptionPlan,
      isOnTrial: req.user.isOnTrial,
      trialEndsAt: req.user.trialEndsAt,
      subscriptionEndsAt: req.user.subscriptionEndsAt
    }
  }
  next()
}

export default {
  featureMiddleware,
  featureMiddlewareLog,
  subscriptionInfoMiddleware
}
