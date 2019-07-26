const AuditTrailModel = require('../../../models/audit');
const utils = require('../../../utils/index');

module.exports = class AuditTrail {
  static async getAudit(req, res) {
    const query = {};
    switch (req.query) {
      case 'name': query.name = req.query.name; break;
      default: break;
    }
    const audit = await utils.PaginateRequest(req, {}, AuditTrailModel);
    return res.success(audit);
  }
};
