import userModel from '../models/userSchema.js'
import { SUBSCRIPTION_PLANS, FEATURE_FLAGS, getSubscriptionStatus, getPlanDetails, isTrialActive, hasFeatureAccess, getFlagsForPlan, mapToPlanKey } from '../config/subscriptions.js'

// Get current user's subscription status
export const getSubscriptionStatus_handler = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select('subscriptionPlan isOnTrial trialEndsAt subscriptionEndsAt email')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const status = getSubscriptionStatus(user)
    const planDetails = getPlanDetails(user.subscriptionPlan)

    res.json({
      user: {
        email: user.email,
        plan: user.subscriptionPlan
      },
      status,
      planDetails,
      trialEndsAt: user.trialEndsAt,
      subscriptionEndsAt: user.subscriptionEndsAt
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscription status', error: error.message })
  }
}

// Get all subscription plans
export const getPlans = async (req, res) => {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price,
      billingCycle: plan.billingCycle,
      features: plan.features
    }))

    res.json({ plans })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plans', error: error.message })
  }
}

// Get single plan details
export const getPlanDetails_handler = async (req, res) => {
  try {
    const { planName } = req.params
    const plan = getPlanDetails(planName)

    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' })
    }

    res.json({ plan })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch plan details', error: error.message })
  }
}

// Upgrade subscription (mock - in production use Stripe/Razorpay)
export const upgradePlan = async (req, res) => {
  try {
    const { planName, paymentMethod } = req.body
    const user = await userModel.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const newPlan = getPlanDetails(planName)
    if (!newPlan) {
      return res.status(400).json({ message: 'Invalid plan' })
    }

    // Validate (cannot downgrade from pro to free)
    if (user.subscriptionPlan === 'pro' && planName === 'free') {
      return res.status(400).json({ message: 'Cannot downgrade from Pro to Free. Please contact support.' })
    }

    // Update subscription
    user.subscriptionPlan = planName
    user.isOnTrial = false
    user.paymentMethod = paymentMethod || 'mock'

    // Set expiration (30 days from now for monthly billing)
    user.subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await user.save()

    res.json({
      message: `Successfully upgraded to ${planName} plan`,
      user: {
        email: user.email,
        plan: user.subscriptionPlan,
        subscriptionEndsAt: user.subscriptionEndsAt
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to upgrade plan', error: error.message })
  }
}

// Downgrade subscription
export const downgradePlan = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.subscriptionPlan === 'free') {
      return res.status(400).json({ message: 'Already on Free plan' })
    }

    // Downgrade to free
    user.subscriptionPlan = 'free'
    user.subscriptionEndsAt = null
    user.paymentMethod = null

    await user.save()

    res.json({
      message: 'Successfully downgraded to Free plan',
      user: {
        email: user.email,
        plan: user.subscriptionPlan
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to downgrade plan', error: error.message })
  }
}

// Get feature access for user
export const getFeatureAccess = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select('subscriptionPlan')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const plan = getPlanDetails(user.subscriptionPlan)
    const features = plan.features

    // produce a canonical flags matrix combining FEATURE_FLAGS and plan.features
    const flags = getFlagsForPlan(user.subscriptionPlan)

    res.json({
      plan: user.subscriptionPlan,
      features,
      flags
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feature access', error: error.message })
  }
}

// Check specific feature access
export const checkFeatureAccess = async (req, res) => {
  try {
    const { featureName } = req.params
    const user = await userModel.findById(req.user._id).select('subscriptionPlan isOnTrial trialEndsAt')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Use helpers to support friendly names (e.g. prescriptionCreation) and enum flags
    const hasAccess = hasFeatureAccess(user.subscriptionPlan, featureName)
    const plan = getPlanDetails(user.subscriptionPlan)
    const planKey = mapToPlanKey(featureName)
    const value = plan.features ? plan.features[planKey] : null

    res.json({
      feature: featureName,
      hasAccess,
      plan: user.subscriptionPlan,
      isOnTrial: user.isOnTrial,
      trialEndsAt: user.trialEndsAt,
      value
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to check feature access', error: error.message })
  }
}

// Extend trial (admin only)
export const extendTrial = async (req, res) => {
  try {
    const { userId, days } = req.body

    if (!userId || !days) {
      return res.status(400).json({ message: 'userId and days are required' })
    }

    const user = await userModel.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Extend trial
    user.trialEndsAt = new Date(new Date(user.trialEndsAt).getTime() + days * 24 * 60 * 60 * 1000)
    user.isOnTrial = true

    await user.save()

    res.json({
      message: `Trial extended by ${days} days`,
      user: {
        email: user.email,
        trialEndsAt: user.trialEndsAt
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to extend trial', error: error.message })
  }
}

// Get subscription usage stats
export const getUsageStats = async (req, res) => {
  try {
    const userId = req.user._id
    const user = await userModel.findById(userId).select('subscriptionPlan')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // You would query actual usage from your models
    // This is a mock implementation
    const planLimits = getPlanDetails(user.subscriptionPlan).features

    const usage = {
      plan: user.subscriptionPlan,
      limits: planLimits,
      currentUsage: {
        patients: Math.floor(planLimits.patients * 0.6), // Mock: 60% usage
        appointments: Math.floor(planLimits.appointments * 0.4),
        prescriptions: Math.floor(planLimits.prescriptions * 0.35),
        fileStorage: Math.floor((planLimits.fileStorage * 0.3) || 300) // MB
      }
    }

    res.json(usage)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch usage stats', error: error.message })
  }
}

// Admin: Get all user subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await userModel.find({}, 'email subscriptionPlan isOnTrial trialEndsAt subscriptionEndsAt createdAt').limit(50)

    res.json({
      total: subscriptions.length,
      subscriptions
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch subscriptions', error: error.message })
  }
}

export default {
  getSubscriptionStatus_handler,
  getPlans,
  getPlanDetails_handler,
  upgradePlan,
  downgradePlan,
  getFeatureAccess,
  checkFeatureAccess,
  extendTrial,
  getUsageStats,
  getAllSubscriptions
}
