const UserModel = require('../../models/user');
const ProductModel = require('../../models/product');
const ProductCategoryModel = require('../../models/product/category');
const utils = require('../../utils/index');
const VendorModel = require('../../models/user/vendorType');

module.exports = class AuditTrail {
  static async vendorList(req, res) {
    const query = {
      userType: 'merchant',
      deleted: 0,
      status: 1,
      select: [
        'businessName',
        'businessAddress',
        'businessType',
        'emailAddress',
        'phoneNumber',
        'businessDays',
        'workingHours',
        'profilePhoto',
        'profileThumbnail',
        'businessDescription',
        'businessCategory',
        'delivery',
      ],
    };
    if (req.query.name) query.businessName = new RegExp(req.query.name, 'i');
    if (req.query.category) query.businessCategory = new RegExp(req.query.category, 'i');

    const vendors = await utils.PaginateRequest(req, query, UserModel);
    const ratedVendors = await Promise.all(
      vendors.docs.map(async (vendor) => {
        // eslint-disable-next-line
        vendor._doc.rating = await vendor.getMerchantRating();
        return vendor;
      }),
    );
    return res.success(ratedVendors);
  }

  static async vendorCategories(req, res) {
    const { vendorId: merchant } = req.params;
    const { name } = req.query;
    const query = {
      merchant,
      populate: [{ path: 'merchant', select: '-password -deleted' }],
    };
    if (name) query.name = new RegExp(name, 'i');
    const categories = await utils.PaginateRequest(
      req,
      query,
      ProductCategoryModel,
    );
    res.success(categories);
  }

  static async vendorProducts(req, res) {
    const { vendorId: merchant } = req.params;
    const {
      name, from, to, type, category,
    } = req.query;
    const query = {
      merchant,
      populate: [
        {
          path: 'merchant',
          select: '-password -deleted',
        },
        {
          path: 'category',
        },
      ],
      sort: { rating: 1 },
    };
    if (category) query.category = category;
    if (name) query.businessName = new RegExp(name, 'i');
    if (from && to) query.price = { $gt: from, $lt: to };
    if (type === 'freeDelivery') query.deliveryType = 'free';
    if (type === 'maxDiscount') query.sort = { discount: 1 };
    if (type === 'maxRating') query.sort = { rating: 1 };
    const products = await utils.PaginateRequest(req, query, ProductModel);
    res.success(products);
  }

  static async recommendNewVendor(req, res) {
    const {
      emailAddress,
      businessAddress,
      businessName,
      phoneNumber,
      comment,
    } = req.body;
    const { firstName, lastName } = req.user;
    req.body.template = 'email';
    const body = {
      email: process.env.getanyEmail,
      template: 'email',
      subject: 'New Vendor Recommended',
      content: `A new vendor ${businessName} with address ${businessAddress}, email ${emailAddress} and phone number ${phoneNumber} has been recommended by ${lastName} ${firstName}.
     Comment about vendor: ${comment}`,
    };
    const email = utils.Email(body);
    await email.send();
    res.success();
  }

  static async vendorTypes(req, res) {
    const types = req.body;
    if (!Array.isArray(types)) return res.badRequest('types not provided or is not a valid array');
    const vendors = await VendorModel.findOneAndUpdate(
      {},
      { vendors: types },
      { upsert: true, new: true },
    );
    return res.success(vendors);
  }

  static async getVendorTypes(req, res) {
    const { vendors } = await VendorModel.findOne({});
    return res.success(vendors);
  }
};
