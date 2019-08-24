const UserModel = require('../../models/user');
const ProductModel = require('../../models/product');
const utils = require('../../utils/index');

module.exports = class AuditTrail {
  static async vendorList(req, res) {
    const query = {
      userType: 'merchant',
      deleted: 0,
      status: 1,
      select: ['businessName', 'businessAddress', 'emailAddress', 'phoneNumber', 'workingHours', 'profileThumbnail', 'businessDescription', 'businessCategory'],
    };
    if (req.query.name) query.businessName = new RegExp(req.query.name);
    if (req.query.category) query.businessCategory = new RegExp(req.query.category);

    const vendors = await utils.PaginateRequest(req, query, UserModel);
    return res.success(vendors);
  }

  static async vendorProducts(req, res) {
    const { vendorId: merchant } = req.params;
    const {
      name, from, to, type,
    } = req.query;
    const query = {
      merchant,
      populate: [{
        path: 'merchant',
        select: '-password -deleted',
      }, {
        path: 'category',
      }],
      sort: { rating: 1 },
    };
    if (name) query.name = new RegExp(name);
    if (from && to) query.price = { $gt: from, $lt: to };
    if (type === 'freeDelivery') query.deliveryType = 'free';
    if (type === 'maxDiscount') query.sort = { discount: 1 };
    if (type === 'maxRating') query.sort = { rating: 1 };
    const products = await utils.PaginateRequest(req, query, ProductModel);
    res.success(products);
  }

  static async recommendNewVendor(req, res) {
    const email = utils.Email({ ...req.body, to: utils.supportEmail });
    await email.send();
    res.success();
  }
};
