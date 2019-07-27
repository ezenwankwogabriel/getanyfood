const express = require('express');

const Router = express();

const AuditTrail = require('../../controllers/repositories/auditTrail/');

Router.get('/', AuditTrail.getAudit);

module.exports = Router;
