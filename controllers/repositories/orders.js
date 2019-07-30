const User = require('../../models/user');
const Order = require('../../models/order');

const orderActions = {
  scopeRequest: async (req, res, next) => {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
        merchant: req.params.id,
      })
        .populate({
          path: 'customer',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

      if (!order) return res.status(404).send('This order does not exist');

      req.scopedOrder = order;
      next();
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    const order = new Order({
      ...req.body,
      customer: req.user.id,
    });
    try {
      const savedOrder = await order.save();
      const fullOrder = await Order.findOne(savedOrder)
        .populate({
          path: 'customer',
          model: User,
          select: '-password -selected',
        })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -selected',
        });

      res.success(fullOrder);
    } catch (err) {
      next(err);
    }
  },

  showAllById: async (req, res, next) => {
    try {
      const orders = await Order.paginate(
        { merchant: req.params.id },
        {
          limit: req.query.limit || 20,
          offset: req.query.offset || 0,
          page: req.query.page || 1,
          populate: [
            {
              path: 'customer',
              model: User,
              select: '-password -deleted',
            },
            {
              path: 'merchant',
              model: User,
              select: '-password -deleted',
            },
          ],
        },
      );
      res.success(orders);
    } catch (err) {
      next(err);
    }
  },

  showOne: (req, res) => {
    res.success(req.scopedOrder);
  },

  update: async (req, res, next) => {
    const { status, pickupTime } = req.body;
    try {
      await req.scopedOrder.update({
        status,
        pickupTime,
      });

      const updatedOrder = await Order.findOne({
        _id: req.params.orderId,
        merchant: req.params.id,
      })
        .populate({
          path: 'customer',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

      return res.success(updatedOrder);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = orderActions;
