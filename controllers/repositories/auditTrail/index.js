const AuditTrailModel = require('../../../models/audit');
const utils = require('../../../utils/index');

module.exports = class AuditTrail {
  static async getAudit(req, res) {
    const query = {};
    if (req.query.name) query.name = new RegExp(req.query.name);
    const audit = await utils.PaginateRequest(req, {}, AuditTrailModel);
    return res.success(audit);
  }
};
