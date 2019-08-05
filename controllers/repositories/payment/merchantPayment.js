const PaymentModel = require('../../../models/payment');
const utils = require('../../../utils');

module.exports = class MerchantPayment {
  static async getPayment(req, res) {
    const { adminId, _id: userId } = req.user;
    const { isExports } = req.params;
    const { startDate, endDate } = req.query;

    const query = { recipient: adminId || userId, populate: ['recipient'] };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const paymentRequest = await utils.PaginateRequest(req, query, PaymentModel);
    const unwindPath = 'recipient';
    // const newss = await PaymentModel.find();
    if (isExports === 'true') {
      const fields = ['recipient.businessName', 'amount', 'transactionNumber', 'bankName', 'accountNumber', 'status', 'createdAt'];
      const fieldNames = ['Merchant', 'Amount', 'Transaction Number', 'Bank Name', 'Account Number', 'Status', 'Date Created'];
      const csv = await utils.ExportCsv(fields, fieldNames, paymentRequest.docs, unwindPath);
      res.attachment('Payment.csv');
      return res.end(csv);
    }
    return res.success(paymentRequest);
  }

  static async requestWithdrawal(req, res) {
    const { amount } = req.body;
    // there should be a walletAmount(unpaid amount) for merchants;
    // fetch the wallet amount
    // if amount less than or equal to wallet amount
    // request for payment from Admin and update the new balance for merchant
    return res.success('successful');
  }
};
