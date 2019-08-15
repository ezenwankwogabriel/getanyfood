const config = require('config');
const debug = require('debug')('app:startup');

const Email = require('./email');
const AuditTrail = require('./auditTrail');
const EncryptPassword = require('./encryptPassword');
const PaginateRequest = require('./paginateRequest');
const UserSubType = require('./userSubType');
const ExportCsv = require('./exportCsv');
const getPriceTotal = require('./getPriceTotal');

module.exports = {
  port: config.get('port'),
  host: config.get('host'),
  dbName: config.get('database'),
  webHost: config.get('web_host'),
  supportEmail: config.get('support'),
  debug,

  Email,
  EncryptPassword,
  PaginateRequest,
  UserSubType,
  AuditTrail,
  ExportCsv,
  getPriceTotal,
};
