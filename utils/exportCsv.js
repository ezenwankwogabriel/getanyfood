const { parseAsync } = require('json2csv');
const _ = require('lodash');
/**
 *
 * @param {Array} fields example ['name', 'orders'];
 * @param {Array} fieldNames example ['Name', 'No. of Orders'];
 * @param {Array} myData array containing data fieldset
 */
const exportCsv = async function (fields, fieldNames, myData, unwindPath) {
  try {
    const opts = { fields: [...fields], fieldNames: [...fieldNames] };
    const resolved = [];
    unwindPath = unwindPath || '';
    for (let i = 0; i < myData.length; i++) {
      resolved.push(_.pick(myData[i], [...fields]));
    }
    return await parseAsync(resolved, opts, unwindPath);
  } catch (ex) {
    throw new Error(ex);
  }
};

module.exports = exportCsv;
