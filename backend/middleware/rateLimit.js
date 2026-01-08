/**
 * Rate Limiting Middleware
 * Enforces scan limits per user (2 full scans, 3 quick scans)
 */

/**
 * Check if user can perform a scan based on their limits
 */
export const checkScanLimit = async (req, res, next) => {
  try {
    const { scanType = "quick" } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated.",
      });
    }

    // Check if user can perform this type of scan
    if (!user.canScan(scanType)) {
      const remaining = user.getRemainingScans();
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `You have reached your ${scanType} scan limit. Remaining: ${remaining.quick} quick, ${remaining.full} full scans.`,
        limits: {
          quick: {
            used: user.scanLimits.quickScansUsed,
            limit: user.scanLimits.quickScansLimit,
            remaining: remaining.quick,
          },
          full: {
            used: user.scanLimits.fullScansUsed,
            limit: user.scanLimits.fullScansLimit,
            remaining: remaining.full,
          },
        },
      });
    }

    next();
  } catch (error) {
    console.error("Rate limit check error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to check scan limits.",
    });
  }
};

