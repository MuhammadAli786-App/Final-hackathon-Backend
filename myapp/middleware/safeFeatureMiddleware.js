// middleware/safeFeatureMiddleware.js
export const safeFeatureMiddleware = (featureName) => (req, res, next) => {
  const userPlan = req.user.subscriptionPlan || 'free';
  const hasAccess = hasFeatureAccess(userPlan, featureName);

  // Don't block, just attach info to request
  req.featureAccess = {
    hasAccess,
    feature: featureName,
    plan: userPlan
  };

  next(); // always call next()
};