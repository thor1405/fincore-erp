const ROLES = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  VIEWER: 'Viewer'
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // If somehow the role isn't attached (e.g. legacy token), default to Owner to avoid breaking existing users.
    // However, our new auth route guarantees it.
    const userRole = req.user.role || ROLES.OWNER;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions for this action.' });
    }
    next();
  };
};

const requireWriteAccess = requireRole([ROLES.OWNER, ROLES.ADMIN, ROLES.EDITOR]);
const requireAdminAccess = requireRole([ROLES.OWNER, ROLES.ADMIN]);

module.exports = { requireRole, ROLES, requireWriteAccess, requireAdminAccess };
