import express from 'express'
import checkAuth, { roleMiddleware } from '../middleware/authMiddleware.js'
import {
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
} from '../controller/subscriptionController.js'

const router = express.Router()

// Public routes - get plans
router.get('/plans', getPlans)
router.get('/plans/:planName', getPlanDetails_handler)

// Protected user routes - check subscription
router.get('/status', checkAuth, getSubscriptionStatus_handler)
// returns raw plan.features and boolean flags
router.get('/features', checkAuth, getFeatureAccess)
router.get('/flags', checkAuth, getFeatureAccess) // alias for flags
router.get('/features/:featureName', checkAuth, checkFeatureAccess)
router.get('/usage', checkAuth, getUsageStats)

// Protected user routes - manage subscription
router.post('/upgrade', checkAuth, upgradePlan)
router.post('/downgrade', checkAuth, downgradePlan)

// Admin only routes
router.get('/admin/all', checkAuth, roleMiddleware('admin'), getAllSubscriptions)
router.post('/admin/extend-trial', checkAuth, roleMiddleware('admin'), extendTrial)

export default router
