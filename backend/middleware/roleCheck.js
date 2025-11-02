/**
 * Role-based access middleware
 * @param {Array} allowedRoles - Array of roles that are allowed to access the route
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
