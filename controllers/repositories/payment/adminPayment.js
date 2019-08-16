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
    switch (req.query) {
      case 'merchant':
        query.merchant = merchant;
        break;
      case 'bank':
        query.bank = bank;
        break;
      case 'txNumber':
        query.transactionNumber = txNumber;
        break;
      default:
        break;
    }
    query.populate = ['merchant'];
    const requests = await utils.PaginateRequest(req, query, PaymentModel);

    if (isExports) {
      const fields = [
        'recipient',
        'amount',
        'transactionNumber',
        'bankName',
        'accountNumber',
        'status',
        'createdAt',
      ];
      const fieldNames = [
        'Merchant',
        'Amount',
        'Transaction Number',
        'Bank Name',
        'Account Number',
        'Status',
        'Date Created',
      ];
      const csv = await utils.ExportCsv(fields, fieldNames, requests.docs);
      res.attachment('Payment Request.csv');
      return res.end(csv);
    }
    return res.success(requests);
  }

  static async markAsPaid(req, res) {
    let { paymentIds } = req.body;
    paymentIds = typeof paymentIds === 'string'
      ? [paymentIds]
      : Array.isArray(paymentIds)
        ? paymentIds
        : false;
    if (!paymentIds) {
      return res.badRequest('Payment Id is required');
    }
    await PaymentModel.update(
      { _id: { $in: paymentIds } },
      { $set: { status: true } },
    );
    return res.success('Request marked as Paid');
  }

  static async showPaidRequests(req, res, next) {
    const queryOptions = {
      status: true,
      populate: [
        {
          path: 'recipient',
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
        path: 'recipient',
        model: User,
        select: 'businessName -password -deleted',
      });
      const fields = [
        'recipient',
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
          recipient: payment.recipient.businessName,
        })),
      );
      res.attachment('Paid Requests.csv');
      res.end(csv);
    } catch (err) {
      next(err);
    }
  }
};
