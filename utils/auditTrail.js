const AuditTrailModel = require('../models/audit');

/**
 *
 * @param {String} user id of user
 * @param {String} activity activity carried out by user
 * @param {String} agent device used by user
 */
async function auditTrail(req, activity) {
  const userAgent = req.headers['user-agent'] || "";
  const userId = req.user._id;
  try {
    await new AuditTrailModel({ user: userId, activity, agent: userAgent }).save();
    return;
  } catch (ex) {
    throw new Error(ex);
  }
}

module.exports = auditTrail;
