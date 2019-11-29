const config = require('config');

const Email = require('./email');
const AuditTrail = require('./auditTrail');
const EncryptPassword = require('./encryptPassword');
const PaginateRequest = require('./paginateRequest');
const UserSubType = require('./userSubType');
const ExportCsv = require('./exportCsv');
const getPriceTotal = require('./getPriceTotal');
const generateOrderId = require('./generateOrderId');
const sendToNester = require('./nesterpod');
const charges = require('./charges');

module.exports = {
  port: config.get('port'),
  host: config.get('host'),
  dbName: config.get('database'),
  webHost: config.get('web_host'),
  supportEmail: config.get('support'),
  api: config.get('api'),
  Email,
  EncryptPassword,
  PaginateRequest,
  UserSubType,
  AuditTrail,
  ExportCsv,
  getPriceTotal,
  generateOrderId,
  sendToNester,
  charges,
};
