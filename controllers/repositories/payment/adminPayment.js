const PaymentModel = require('../../../models/payment');
const utils = require('../../../utils');
const User = require('../../../models/user');

module.exports = class Payment {
  static async getPaymentRequest(req, res) {
    const {
      startDate, endDate, merchant, txNumber, bank,
    } = req.query;
    const { isExports } = req.params;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (req.query.merchant) query.merchant = merchant;
    if (req.query.bank) query.bank = bank;
    if (req.query.txNumber) query.transactionNumber = txNumber;
    query.populate = ['merchant'];
    const requests = await utils.PaginateRequest(req, query, PaymentModel);

    if (isExports) {
      const fields = ['merchant', 'amount', 'transactionNumber', 'bankName', 'accountNumber', 'status', 'createdAt'];
      const fieldNames = ['Merchant', 'Amount', 'Transaction Number', 'Bank Name', 'Account Number', 'Status', 'Date Created'];
      const csv = await utils.ExportCsv(fields, fieldNames, requests.docs);
      res.attachment('Payment Request.csv');
      return res.end(csv);
    }
    return res.success(requests);
  }

  static async markAsPaid(req, res) {
    let { paymentIds } = req.body;
    if (typeof paymentIds === 'string') paymentIds = [paymentIds];
    else if (!Array.isArray(paymentIds)) paymentIds = false;
    if (!paymentIds) { return res.badRequest('Payment Id is required'); }
    let payments = await PaymentModel.find({ _id: { $in: paymentIds } });
    payments = payments.filter(payment => !payment.status);
    if (payments.length < 1) return res.badRequest('Request has been previously marked');
    const paymentQuery = payments.map(payment => ({
      updateOne: {
        // eslint-disable-next-line no-underscore-dangle
        filter: { _id: payment._id },
        update: { status: true },
      },
    }));
    const userQuery = payments.map(payment => ({
      updateOne: {
        filter: { _id: payment.merchant },
        update: { $inc: { walletAmount: -payment.amount } },
      },
    }));
    await Promise.all([
      User.bulkWrite(userQuery),
      PaymentModel.bulkWrite(paymentQuery),
    ]);
    return res.success(`${paymentIds.length > 0 ? 'Requests' : 'Request'}  marked as Paid`);
  }

  static async showPaidRequests(req, res, next) {
    const queryOptions = {
      status: true,
      populate: [
        {
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        },
      ],
    };

    try {
      const payments = await utils.PaginateRequest(
        req,
        queryOptions,
        PaymentModel,
      );

      res.success(payments);
    } catch (err) {
      next(err);
    }
  }

  static async exportPaidRequests(req, res, next) {
    try {
      const payments = await PaymentModel.find({ status: true }).populate({
        path: 'merchant',
        model: User,
        select: 'businessName -password -deleted',
      });
      const fields = [
        'merchant',
        'amount',
        'transactionNumber',
        'bankName',
        'accountNumber',
        'createdAt',
        'updatedAt',
      ];
      const fieldNames = [
        'Merchant',
        'Amount',
        'Transaction Number',
        'Bank Name',
        'Account Number',
        'Date of Request',
        'Date of Payment',
      ];
      const csv = await utils.ExportCsv(
        fields,
        fieldNames,
        payments.map(payment => ({
          ...payment,
          merchant: payment.merchant.businessName,
        })),
      );
      res.attachment('Paid Requests.csv');
      res.end(csv);
    } catch (err) {
      next(err);
    }
  }
};
