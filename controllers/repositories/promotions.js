const { DateTime } = require('luxon');
const Promotion = require('../../models/promotion');
const Product = require('../../models/product');
const User = require('../../models/user');
const utils = require('../../utils');

const promotionActions = {
  scopeRequest: async (req, res, next) => {
    try {
      const promotion = await Promotion.findOne({
        _id: req.params.promotionId,
        merchant: req.params.id,
      })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'item.product',
          model: Product,
        });

      req.scopedPromotion = promotion;
      next();
    } catch (err) {
      next(err);
    }
  },

  showOne: (req, res) => res.success(req.scopedPromotion),

  showAllById: async (req, res, next) => {
    const queryOptions = {
      merchant: req.params.id,
      populate: [
        {
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'item.product',
          model: Product,
        },
      ],
    };
    try {
      const promotions = await utils.PaginateRequest(
        req,
        queryOptions,
        Promotion,
      );
      res.success(promotions);
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const promotion = new Promotion({
        ...req.body,
        merchant: req.params.id,
        expiresAt: req.body.expiresAt
          ? req.body.expiresAt
          : DateTime.local().plus({ seconds: req.body.expiresIn }),
      });

      const savedPromotion = await promotion.save();
      const fullPromotion = await Promotion.findById(savedPromotion.id)
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'item.product',
          model: Product,
        });

      res.success(fullPromotion);
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      await req.scopedPromotion.update({ ...req.body });

      const updatedPromotion = await Promotion.findById(req.scopedPromotion.id)
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'item.product',
          model: Product,
        });

      res.success(updatedPromotion);
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      await req.scopedPromotion.remove();

      res.success();
    } catch (err) {
      next(err);
    }
  },
};

module.exports = promotionActions;
