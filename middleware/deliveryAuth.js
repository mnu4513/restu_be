const deliveryAuth = (req, res, next) => {
  try {
    // auth middleware should already have populated req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access delivery services",
      });
    }

    next();
  } catch (error) {
    console.error("Delivery auth error:", error);

    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};

module.exports = deliveryAuth;