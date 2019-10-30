const shortId = require('shortid');
const PaymentModel = require('../../../models/payment');
const UserModel = require('../../../models/user');
const utils = require('../../../utils');
const { SendNotification } = require('../../repositories/notification');

module.exports = class MerchantPayment {
  static async getPayment(req, res) {
    const { _id: merchant } = req.user;
    const { isExports } = req.params;
    const { startDate, endDate } = req.query;

    const query = { merchant };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const paymentRequest = await utils.PaginateRequest(req, query, PaymentModel);
    const unwindPath = 'merchant';
    // const newss = await PaymentModel.find();
    if (isExports === 'true') {
      const fields = ['merchant.businessName', 'amount', 'transactionNumber', 'bankName', 'accountNumber', 'status', 'createdAt'];
      const fieldNames = ['Merchant', 'Amount', 'Transaction Number', 'Bank Name', 'Account Number', 'Status', 'Date Created'];
      const csv = await utils.ExportCsv(fields, fieldNames, paymentRequest.docs, unwindPath);
      res.attachment('Payment.csv');
      return res.end(csv);
    }
    return res.success(paymentRequest);
  }

  static async requestWithdrawal(req, res) {
    const { amount, bankName, accountNumber } = req.body;
    const { walletAmount, _id: merchant, businessName } = req.user;
    const { _id: admin } = await UserModel.findOne({ userType: 'super_admin' });
    if (walletAmount < amount) return res.badRequest('Amount requested exceeds wallet amount');

    const amountLeft = walletAmount - Number(amount);
    req.user.walletAmount = amountLeft;
    const payment = {
      merchant,
      amount,
      transactionNumber: shortId.generate(),
      bankName,
      accountNumber,
    };
    await Promise.all([
      new PaymentModel(payment).save(),
      req.user.save(),
    ]);
    SendNotification({
      message: `New request for payment by ${businessName}`,
      notificationTo: admin,
      notificationFrom: merchant,
    });
    return res.success('successful');
  }
};
