const PaymentModel = require('../../../models/payment');
const utils = require('../../../utils');

module.exports = class Payment {
  static async getPaymentRequest(req, res) {
    const { startDate, endDate, merchant, txNumber, bank } = req.query;
    const { isExports } = req.params;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    switch (req.query) {
      case 'merchant': query.merchant = merchant; break;
      case 'bank': query.bank = bank; break;
      case 'txNumber': query.transactionNumber = txNumber; break;
      default: break;
    }
    query.populate = ['merchant'];
    const requests = await utils.PaginateRequest(req, query, PaymentModel);

    if (isExports) {
      const fields = ['recipient', 'amount', 'transactionNumber', 'bankName', 'accountNumber', 'status', 'createdAt'];
      const fieldNames = ['Merchant', 'Amount', 'Transaction Number', 'Bank Name', 'Account Number', 'Status', 'Date Created'];
      const csv = await utils.ExportCsv(fields, fieldNames, requests.docs );
      res.attachment('Payment Request.csv');
      return res.end(csv);
    }
    return res.success(requests);
  }

  static async markAsPaid(req, res) {
    let { paymentIds } = req.body;
    paymentIds = typeof paymentIds === 'string' ? [paymentIds] : Array.isArray(paymentIds) ? paymentIds : false;
    if (!paymentIds) { return res.badRequest('Payment Id is required'); }
    await PaymentModel.update({ _id: { $in: paymentIds } }, { $set: { status: true } });
    return res.success('Request marked as Paid');
  }
};
