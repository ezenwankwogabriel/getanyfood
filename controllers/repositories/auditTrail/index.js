const AuditTrailModel = require('../../../models/audit');
const User = require('../../../models/user');
const utils = require('../../../utils/index');

module.exports = class AuditTrail {
  static async getAudit(req, res) {
    const queryOptions = {
      populate: [
        {
          path: 'user',
          model: User,
          select: '-password -deleted',
        },
      ],
    };
    if (req.query.name) queryOptions.name = new RegExp(req.query.name);
    const audit = await utils.PaginateRequest(
      req,
      queryOptions,
      AuditTrailModel,
    );
    return res.success(audit);
  }
};
